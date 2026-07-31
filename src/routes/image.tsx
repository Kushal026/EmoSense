import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ImageIcon, Upload, AlertTriangle, History } from "lucide-react";
import { Shell } from "@/components/Shell";
import { EmotionBadge, ScoreBar, StatRow } from "@/components/Widgets";
import { EMOTION_KEYS } from "@/lib/emotions";
import { detectFaces, loadEngine, type FaceResult } from "@/lib/face-engine";
import { drawFaces } from "@/lib/draw";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/image")({
  head: () => ({
    meta: [
      { title: "Image Emotion Detection | EmoSense" },
      {
        name: "description",
        content:
          "Upload a JPG or PNG and detect the emotion of every face, with confidence scores, timing metrics and an exportable annotated image.",
      },
      { property: "og:title", content: "Image Emotion Detection | EmoSense" },
      {
        property: "og:description",
        content: "Multi-face emotion analysis on any uploaded photo, processed on-device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ImagePage,
});

interface HistoryItem {
  id: string;
  name: string;
  thumb: string;
  faces: number;
  top: FaceResult | null;
  at: string;
}

function ImagePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faces, setFaces] = useState<FaceResult[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selected, setSelected] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    loadEngine().catch(() => setError("Emotion model could not be loaded."));
  }, []);

  const handleFile = useCallback(async (file: File) => {
    if (!/\.(jpe?g|png)$/i.test(file.name)) {
      setError("Unsupported file. Please upload a JPG, JPEG or PNG image.");
      return;
    }
    setError(null);
    setBusy(true);
    setFileName(file.name);
    const t0 = performance.now();

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await img.decode();

      const canvas = canvasRef.current!;
      const maxW = 1280;
      const scale = Math.min(1, maxW / img.naturalWidth);
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const result = await detectFaces(canvas, 640);

      drawFaces(ctx, result);
      setFaces(result);
      setSelected(0);

      if (result.length === 0) setError("No face detected.");

      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 96;
      thumbCanvas.height = 64;
      thumbCanvas
        .getContext("2d")!
        .drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);

      setHistory((prev) =>
        [
          {
            id: `${Date.now()}`,
            name: file.name,
            thumb: thumbCanvas.toDataURL("image/jpeg", 0.6),
            faces: result.length,
            top: result[0] ?? null,
            at: new Date().toLocaleTimeString(),
          },
          ...prev,
        ].slice(0, 6),
      );
    } catch {
      setError("That image could not be processed. Try another file.");
    } finally {
      setBusy(false);
    }
  }, []);

  const exportPng = () => {
    const canvas = canvasRef.current;
    if (!canvas || !fileName) return;
    const link = document.createElement("a");
    link.download = `emosense-${fileName.replace(/\.[^.]+$/, "")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const exportReport = () => {
    if (!fileName) return;
    const lines = [
      "EmoSense — Emotion Detection Report",
      "===================================",
      `File: ${fileName}`,
      `Generated: ${new Date().toLocaleString()}`,
      `Faces detected: ${faces.length}`,
      "",
      ...faces.flatMap((f, i) => [
        `Face #${i + 1}`,
        `  Emotion:    ${f.emotion}`,
        `  Confidence: ${(f.confidence * 100).toFixed(1)}%`,
        `  Box:        x=${Math.round(f.box.x)} y=${Math.round(f.box.y)} w=${Math.round(f.box.width)} h=${Math.round(f.box.height)}`,
        "",
      ]),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const link = document.createElement("a");
    link.download = `emosense-report-${Date.now()}.txt`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const active = faces[selected];

  return (
    <Shell>
      <div className="px-6 py-8 md:px-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Image Emotion Detection</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a photo — every detected face is analysed independently.
          </p>
        </header>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="size-4" /> {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) void handleFile(file);
              }}
              className={cn(
                "panel relative flex min-h-[380px] items-center justify-center overflow-hidden p-4 transition-colors",
                dragOver && "border-accent",
              )}
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  "max-h-[62vh] w-auto max-w-full rounded-xl",
                  fileName ? "block" : "hidden",
                )}
              />
              {!fileName && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <ImageIcon className="size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Drop an image here, or use the button below.
                    <br />
                    Supported: JPG · JPEG · PNG
                  </p>
                </div>
              )}
              {busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 text-sm backdrop-blur-sm">
                  Analysing image…
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
              <button
                onClick={() => inputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow hover:shadow-glow"
              >
                <Upload className="size-4" /> Upload Image
              </button>
              <button
                onClick={exportPng}
                disabled={!fileName}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-40"
              >
                <Download className="size-4" /> Export PNG
              </button>
              <button
                onClick={exportReport}
                disabled={!fileName}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-2 disabled:opacity-40"
              >
                <Download className="size-4" /> Export Report
              </button>
            </div>

            {faces.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {faces.map((f, i) => (
                  <button key={i} onClick={() => setSelected(i)} className={cn("rounded-full transition-opacity", selected !== i && "opacity-50")}>
                    <EmotionBadge emotion={f.emotion} confidence={f.confidence} size="sm" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="panel p-5">
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">Results</h2>
              <div className="mb-4 flex min-h-10 items-center">
                {active ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{EMOTION_META[active.emotion].emoji}</span>
                    <EmotionBadge emotion={active.emotion} confidence={active.confidence} size="lg" />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No results yet.</span>
                )}
              </div>

              {faces.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {faces.map((face, index) => (
                    <span key={`${face.emotion}-${index}`} className="rounded-full border border-border/70 bg-surface/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                      Face {index + 1}: {face.emotion}
                    </span>
                  ))}
                </div>
              )}
              <StatRow label="Number of Faces" value={String(faces.length)} />
              <StatRow
                label="Confidence"
                value={active ? `${Math.round(active.confidence * 100)}%` : "—"}
                accent
              />

              <StatRow label="File" value={fileName ?? "—"} />

              <div className="mt-5 space-y-2 border-t border-border pt-4">
                <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">
                  Detected faces
                </p>
                {faces.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No faces detected.</p>
                ) : (
                  faces.map((face, index) => (
                    <div key={`${face.emotion}-${index}`} className="rounded-xl border border-border/70 bg-surface/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Face {index + 1}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{EMOTION_META[face.emotion].emoji}</span>
                          <EmotionBadge emotion={face.emotion} confidence={face.confidence} size="sm" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {EMOTION_KEYS.map((key) => (
                          <ScoreBar key={`${index}-${key}`} emotion={key} value={face.scores[key] ?? 0} />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                <History className="size-4" /> Recent
              </h2>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No detections yet.</p>
              ) : (
                <ul className="space-y-3">
                  {history.map((h) => (
                    <li key={h.id} className="flex items-center gap-3">
                      <img
                        src={h.thumb}
                        alt={`Thumbnail of ${h.name}`}
                        className="size-10 rounded-lg border border-border object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{h.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {h.faces} face{h.faces === 1 ? "" : "s"} · {h.at}
                        </p>
                      </div>
                      {h.top && <EmotionBadge emotion={h.top.emotion} size="sm" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}
