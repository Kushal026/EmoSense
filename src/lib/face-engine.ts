/**
 * Face detection + emotion prediction engine (browser only).
 *
 * Wraps @vladmandic/face-api: a TinyFaceDetector for face localisation and
 * a FER-style CNN (48x48 grayscale inputs, 7 classes) for expression
 * classification. Models are served locally from /models.
 */

import { RAW_TO_KEY, type EmotionKey } from "./emotions";

export interface FaceResult {
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

/** Run detection + expression prediction on a video or image element. */
export async function detectFaces(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
  inputSize = 320,
): Promise<FaceResult[]> {
  const api = faceapi ?? (await loadEngine());
  const options = new api.TinyFaceDetectorOptions({
    inputSize,
    scoreThreshold: 0.4,
  });

  const detections = await api
    .detectAllFaces(input as HTMLVideoElement, options)
    .withFaceExpressions();

  return detections.map((d) => {
    const scores = {} as Record<EmotionKey, number>;
    let emotion: EmotionKey = "neutral";
    let confidence = 0;

    for (const [raw, value] of Object.entries(d.expressions as unknown as Record<string, number>)) {
      const key = RAW_TO_KEY[raw];
      if (!key) continue;
      scores[key] = value;
      if (value > confidence) {
        confidence = value;
        emotion = key;
      }
    }

    const { x, y, width, height } = d.detection.box;
    return { box: { x, y, width, height }, emotion, confidence, scores };
  });
}
