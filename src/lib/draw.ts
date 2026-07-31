import { EMOTION_META, emotionColor } from "@/lib/emotions";
import type { FaceResult } from "@/lib/face-engine";

/**
 * Draw bounding boxes + emotion labels for detected faces.
 * Colors come from the emotion design tokens.
 */
export function drawFaces(
  ctx: CanvasRenderingContext2D,
  faces: FaceResult[],
  scale = 1,
) {
  for (const face of faces) {
    const color = emotionColor(face.emotion);
    const meta = EMOTION_META[face.emotion];
    const x = face.box.x * scale;
    const y = face.box.y * scale;
    const w = face.box.width * scale;
    const h = face.box.height * scale;
    const r = Math.min(14, w * 0.12);

    // Rounded bounding box
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, w * 0.012);
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.stroke();
    ctx.restore();

    // Label pill above the face
    const text = `${meta.emoji} ${meta.label}`;
    const sub = `Confidence: ${Math.round(face.confidence * 100)}%`;
    const fontSize = Math.max(13, Math.min(22, w * 0.13));
    ctx.font = `600 ${fontSize}px "DM Sans", system-ui, sans-serif`;
    const padX = fontSize * 0.6;
    const boxW = Math.max(ctx.measureText(text).width, ctx.measureText(sub).width) + padX * 2;
    const boxH = fontSize * 2.7;
    const boxY = Math.max(2, y - boxH - 6);

    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.roundRect(x, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0b1220";
    ctx.fillText(text, x + padX, boxY + fontSize * 1.1);
    ctx.font = `500 ${fontSize * 0.78}px "DM Sans", system-ui, sans-serif`;
    ctx.fillText(sub, x + padX, boxY + fontSize * 2.15);
    ctx.restore();
  }
}
