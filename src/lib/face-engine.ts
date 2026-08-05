/**
 * Face detection + emotion prediction engine (browser only).
 *
 * Wraps @vladmandic/face-api: a TinyFaceDetector for face localisation and
 * a FER-style CNN (48x48 grayscale inputs, 7 classes) for expression
 * classification. Models are served locally from /models.
 */

import { EMOTION_KEYS, RAW_TO_KEY, type EmotionKey } from "./emotions";

export interface FaceResult {
  id: number;
  box: { x: number; y: number; width: number; height: number };
  emotion: EmotionKey;
  confidence: number; // 0..1
  scores: Record<EmotionKey, number>;
}

export type EngineStatus = "idle" | "loading" | "ready" | "error";

const MODEL_URL = "/models";

type FaceApi = typeof import("@vladmandic/face-api");

let faceapi: FaceApi | null = null;
let loadPromise: Promise<FaceApi> | null = null;
let previousFaces: FaceResult[] = [];

function normalizeScores(rawScores: Record<EmotionKey, number>): Record<EmotionKey, number> {
  const normalized = {} as Record<EmotionKey, number>;
  let total = 0;

  for (const key of EMOTION_KEYS) {
    const value = rawScores[key] ?? 0;
    normalized[key] = value;
    total += value;
  }

  if (total <= 0) return normalized;

  for (const key of EMOTION_KEYS) {
    normalized[key] = normalized[key] / total;
  }

  return normalized;
}

function smoothScores(
  rawScores: Record<EmotionKey, number>,
  previousScores?: Record<EmotionKey, number>,
): Record<EmotionKey, number> {
  const normalized = normalizeScores(rawScores);
  if (!previousScores) return normalized;

  const smoothed = {} as Record<EmotionKey, number>;
  for (const key of EMOTION_KEYS) {
    const prev = previousScores[key] ?? 0;
    const next = normalized[key] ?? 0;
    smoothed[key] = Math.max(0.01, prev * 0.82 + next * 0.18);
  }

  const total = Object.values(smoothed).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return smoothed;

  for (const key of EMOTION_KEYS) {
    smoothed[key] = smoothed[key] / total;
  }

  return smoothed;
}

function calibrateScores(scores: Record<EmotionKey, number>): Record<EmotionKey, number> {
  const calibrated = { ...scores };
  const neutralScore = calibrated.neutral ?? 0;
  const weakClasses = ["angry", "disgust", "fear", "tired"] as EmotionKey[];
  const strongClasses = ["happy", "surprise", "sad"] as EmotionKey[];

  for (const key of weakClasses) {
    const value = calibrated[key] ?? 0;
    calibrated[key] = value * 1.25;
  }

  for (const key of strongClasses) {
    const value = calibrated[key] ?? 0;
    calibrated[key] = value * 1.04;
  }

  if (neutralScore > 0.32) {
    calibrated.neutral = neutralScore * 0.9;
  }

  const total = Object.values(calibrated).reduce((sum, value) => sum + value, 0);
  if (total <= 0) return calibrated;

  for (const key of EMOTION_KEYS) {
    calibrated[key] = calibrated[key] / total;
  }

  return calibrated;
}

function pickEmotion(scores: Record<EmotionKey, number>, previousEmotion?: EmotionKey, previousConfidence?: number) {
  const calibrated = calibrateScores(scores);
  const entries = Object.entries(calibrated) as [EmotionKey, number][];
  const sorted = entries.sort((a, b) => b[1] - a[1]);
  const [topEmotion, topScore] = sorted[0] ?? ["neutral" as EmotionKey, 0];
  const [, secondScore] = sorted[1] ?? ["neutral" as EmotionKey, 0];
  const neutralScore = calibrated.neutral ?? 0;
  const rareClasses = ["angry", "disgust", "fear", "tired"] as EmotionKey[];
  const expressive = ["angry", "disgust", "fear", "sad", "surprise", "happy", "tired"] as EmotionKey[];
  const expressiveBest = expressive.reduce(
    (best, key) => (calibrated[key] > best.score ? { key, score: calibrated[key] } : best),
    { key: "neutral" as EmotionKey, score: 0 },
  );
  const rareBest = rareClasses.reduce(
    (best, key) => (calibrated[key] > best.score ? { key, score: calibrated[key] } : best),
    { key: "neutral" as EmotionKey, score: 0 },
  );
  const margin = topScore - secondScore;

  let emotion = topEmotion;
  let confidence = topScore;

  if (rareBest.score >= 0.16 && rareBest.score >= expressiveBest.score * 0.92) {
    emotion = rareBest.key;
    confidence = Math.max(0.22, rareBest.score);
  } else if (topEmotion === "neutral" && expressiveBest.score >= 0.16 && neutralScore <= expressiveBest.score + 0.05) {
    emotion = expressiveBest.key;
    confidence = Math.max(0.22, expressiveBest.score);
  } else if (topEmotion !== "neutral" && topScore < 0.18 && expressiveBest.score >= 0.16) {
    emotion = expressiveBest.key;
    confidence = Math.max(0.22, expressiveBest.score);
  } else if (topScore < 0.14 || margin < 0.025) {
    emotion = "neutral";
    confidence = Math.max(topScore, 0.16);
  }

  if (previousEmotion && previousEmotion !== emotion && previousConfidence !== undefined) {
    const prevScore = calibrated[previousEmotion] ?? 0;
    const shouldHold = confidence < 0.28 || prevScore + 0.04 >= topScore || (confidence - previousConfidence) < 0.05;
    if (shouldHold) {
      return { emotion: previousEmotion, confidence: Math.max(previousConfidence * 0.94, 0.18) };
    }
  }

  return { emotion, confidence };
}

/** Load the models once; subsequent calls reuse the same promise. */
export function loadEngine(): Promise<FaceApi> {
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const api = (await import("@vladmandic/face-api")) as FaceApi;
    const tf = api.tf as unknown as {
      setBackend: (name: string) => Promise<boolean>;
      ready: () => Promise<void>;
    };
    await tf.setBackend("webgl").catch(() => tf.setBackend("cpu"));
    await tf.ready();
    await Promise.all([
      api.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      api.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    faceapi = api;
    return api;
  })();

  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}

export function isReady() {
  return faceapi !== null;
}

/** Run detection + expression prediction on a video or canvas element. */
export async function detectFaces(
  input: HTMLVideoElement | HTMLCanvasElement,
  inputSize = 320,
): Promise<FaceResult[]> {
  const api = faceapi ?? (await loadEngine());
  const options = new api.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold: 0.4,
  });

  const detections = await api
    .detectAllFaces(input, options)
    .withFaceExpressions();

  const width = input.width || ("videoWidth" in input ? input.videoWidth : 0);
  const height = input.height || ("videoHeight" in input ? input.videoHeight : 0);

  const validDetections = detections
    .map((d) => ({ d, box: d.detection.box }))
    .filter(({ box }) => {
      const frameW = width || 1;
      const frameH = height || 1;
      const relativeW = box.width / frameW;
      const relativeH = box.height / frameH;
      const centerX = (box.x + box.width / 2) / frameW;
      const centerY = (box.y + box.height / 2) / frameH;
      return (
        relativeW >= 0.08 &&
        relativeH >= 0.08 &&
        relativeW <= 0.72 &&
        relativeH <= 0.95 &&
        centerX >= 0.18 &&
        centerX <= 0.82 &&
        centerY >= 0.12 &&
        centerY <= 0.88
      );
    })
    .sort((a, b) => a.box.x - b.box.x);

  const previousOrdered = previousFaces
    .slice()
    .sort((a, b) => a.box.x - b.box.x);

  const results = validDetections.map((item, index) => {
    const rawScores = {} as Record<EmotionKey, number>;
    const { d } = item;

    for (const [raw, value] of Object.entries(d.expressions as unknown as Record<string, number>)) {
      const key = RAW_TO_KEY[raw];
      if (!key) continue;
      rawScores[key] = value;
    }

    const previousScores = previousOrdered[index]?.scores;
    const scores = smoothScores(rawScores, previousScores);
    const previousFace = previousOrdered[index];
    const { emotion, confidence } = pickEmotion(scores, previousFace?.emotion, previousFace?.confidence);

    const { x, y, width, height } = d.detection.box;
    return { id: index + 1, box: { x, y, width, height }, emotion, confidence, scores };
  });

  previousFaces = results;
  return results;
}
