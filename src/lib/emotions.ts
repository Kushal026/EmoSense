/**
 * Emotion metadata shared by the live and image detection screens.
 * face-api returns FER-style labels; we map them to display names,
 * emoji and design-system color tokens.
 */

export const EMOTION_KEYS = [
  "happy",
  "sad",
  "angry",
  "fear",
  "surprise",
  "neutral",
  "disgust",
  "tired",
] as const;

export type EmotionKey = (typeof EMOTION_KEYS)[number];

/** face-api expression label -> our canonical key */
export const RAW_TO_KEY: Record<string, EmotionKey> = {
  happy: "happy",
  sad: "sad",
  angry: "angry",
  fearful: "fear",
  surprised: "surprise",
  neutral: "neutral",
  disgusted: "disgust",
  tired: "tired",
};

export const EMOTION_META: Record<
  EmotionKey,
  { label: string; emoji: string; token: string }
> = {
  happy: { label: "Happy", emoji: "😊", token: "--happy" },
  sad: { label: "Sad", emoji: "😢", token: "--sad" },
  angry: { label: "Angry", emoji: "😠", token: "--angry" },
  fear: { label: "Fear", emoji: "😨", token: "--fear" },
  surprise: { label: "Surprise", emoji: "😮", token: "--surprise" },
  neutral: { label: "Neutral", emoji: "😐", token: "--neutral" },
  disgust: { label: "Disgust", emoji: "🤢", token: "--disgust" },
  tired: { label: "Tired", emoji: "😴", token: "--neutral" },
};

/** Resolve an emotion token to a concrete CSS color for canvas drawing. */
export function emotionColor(key: EmotionKey): string {
  if (typeof window === "undefined") return "#7aa2ff";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(EMOTION_META[key].token)
    .trim();
  return value || "#7aa2ff";
}
