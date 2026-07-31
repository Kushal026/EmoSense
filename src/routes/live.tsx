import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Pause, Play, Square, RefreshCw, AlertTriangle } from "lucide-react";
import { Shell } from "@/components/Shell";
import { EmotionBadge, ScoreBar, StatRow } from "@/components/Widgets";
import { EMOTION_KEYS, EMOTION_META, type EmotionKey } from "@/lib/emotions";
import { detectFaces, loadEngine, type FaceResult } from "@/lib/face-engine";
import { drawFaces } from "@/lib/draw";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live Webcam Emotion Detection | EmoSense" },
      {
        name: "description",
        content:
          "Run real-time facial emotion recognition on your webcam with live FPS, per-face confidence and detection statistics.",
      },
      { property: "og:title", content: "Live Webcam Emotion Detection | EmoSense" },
      {
        property: "og:description",
        content: "Real-time multi-face emotion recognition with live FPS and confidence stats.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LivePage,
});

type CamState = "off" | "starting" | "running" | "paused";

function LivePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const stateRef = useRef<CamState>("off");
  const framesRef = useRef(0);
  const lastTickRef = useRef(performance.now());
  const fpsSamplesRef = useRef<number[]>([]);

  const [camState, setCamState] = useState<CamState>("off");
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faces, setFaces] = useState<FaceResult[]>([]);
  const [fps, setFps] = useState(0);
  const [frames, setFrames] = useState(0);
  const [detectMs, setDetectMs] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);

  const setState = (s: CamState) => {
    stateRef.current = s;
    setCamState(s);
  };

  // Warm up the model as soon as the page opens.
  useEffect(() => {
    loadEngine()
      .then(() => setModelReady(true))
      .catch(() => setError("Emotion model could not be loaded."));
  }, []);

  const stopStream = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx && canvasRef.current)
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }, []);

  // Always release the webcam when leaving the page.
  useEffect(() => stopStream, [stopStream]);

  /** Detection loop — runs off the render path, one inference in flight at a time. */
  const loop = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || stateRef.current !== "running") return;

    if (!busyRef.current && video.readyState >= 2) {
      busyRef.current = true;
      const t0 = performance.now();
      try {
        const result = await detectFaces(video, 288);
        setFaces(result);
        setDetectMs(performance.now() - t0);

        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawFaces(ctx, result);
        }

        framesRef.current += 1;
        setFrames(framesRef.current);

        const now = performance.now();
        const delta = now - lastTickRef.current;
        lastTickRef.current = now;
        const samples = fpsSamplesRef.current;
        samples.push(1000 / Math.max(delta, 1));
        if (samples.length > 15) samples.shift();
        setFps(samples.reduce((a, b) => a + b, 0) / samples.length);
      } catch {
        /* transient frame errors are ignored — never crash the loop */
      } finally {
        busyRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(() => void loop());
  }, []);

  const start = useCallback(
    async (index = deviceIndex) => {
      setError(null);
      setState("starting");
      try {
        const list = (await navigator.mediaDevices.enumerateDevices()).filter(
          (d) => d.kind === "videoinput",
        );
        setDevices(list);
        const deviceId = list[index]?.deviceId;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: 1280, height: 720 }
            : { facingMode: "user", width: 1280, height: 720 },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        await loadEngine();
        framesRef.current = 0;
        fpsSamplesRef.current = [];
        lastTickRef.current = performance.now();
        setState("running");
        rafRef.current = requestAnimationFrame(() => void loop());
      } catch (err) {
        stopStream();
        setState("off");
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access and try again."
            : "Camera not found.",
        );
      }
    },
    [deviceIndex, loop, stopStream],
  );

  const pause = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setState("paused");
  };

  const resume = () => {
    setState("running");
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(() => void loop());
  };

  const stop = () => {
    stopStream();
    setState("off");
    setFaces([]);
    setFps(0);
  };

  const switchCamera = async () => {
    if (devices.length < 2) return;
    const next = (deviceIndex + 1) % devices.length;
    setDeviceIndex(next);
    stopStream();
    await start(next);
  };

  const top = faces[0];
  const running = camState === "running";

  return (
    <Shell>
      <div className="px-6 py-8 md:px-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Live Emotion Recognition</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every visible face is boxed and classified in real time.
          </p>
        </header>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertTriangle className="size-4" /> {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div>
            <div className="panel relative aspect-video w-full overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn(
                  "size-full object-cover transition-opacity duration-300",
                  camState === "off" ? "opacity-0" : "opacity-100",
                )}
              />
              <canvas
                ref={canvasRef}
                className="pointer-events-none absolute inset-0 size-full object-cover"
              />

              {camState === "off" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                  <Camera className="size-10 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Camera is off — press Start to begin detection.
                  </p>
                </div>
              )}

              {camState !== "off" && (
                <div className="absolute top-3 left-3 rounded-lg bg-background/70 px-3 py-1.5 font-mono text-xs backdrop-blur">
                  FPS : {fps.toFixed(0)}
                </div>
              )}
              {camState === "paused" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                  <span className="rounded-full border border-border bg-surface px-4 py-2 text-sm">
                    Paused
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Ctrl onClick={() => void start()} disabled={camState !== "off"} primary>
                <Play className="size-4" /> Start
              </Ctrl>
              <Ctrl onClick={pause} disabled={!running}>
                <Pause className="size-4" /> Pause
              </Ctrl>
              <Ctrl onClick={resume} disabled={camState !== "paused"}>
                <Play className="size-4" /> Resume
              </Ctrl>
              <Ctrl onClick={stop} disabled={camState === "off"}>
                <Square className="size-4" /> Stop
              </Ctrl>
              <Ctrl onClick={() => void switchCamera()} disabled={devices.length < 2}>
                <RefreshCw className="size-4" /> Switch Camera
              </Ctrl>
            </div>
          </div>

          <aside className="panel h-fit p-5">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              Live Statistics
            </h2>

            <div className="mb-4 flex min-h-10 items-center">
              {top ? (
                <EmotionBadge emotion={top.emotion} confidence={top.confidence} size="lg" />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {running ? "No face detected." : "Awaiting camera…"}
                </span>
              )}
            </div>

            <StatRow
              label="Current Emotion"
              value={top ? EMOTION_META[top.emotion].label : "—"}
            />
            <StatRow
              label="Confidence"
              value={top ? `${Math.round(top.confidence * 100)}%` : "—"}
              accent
            />
            <StatRow label="Faces" value={String(faces.length)} />
            <StatRow label="Frames Processed" value={String(frames)} />
            <StatRow label="Current FPS" value={fps.toFixed(1)} accent />
            <StatRow
              label="Camera Status"
              value={
                camState === "running"
                  ? "Streaming"
                  : camState === "paused"
                    ? "Paused"
                    : camState === "starting"
                      ? "Starting…"
                      : "Stopped"
              }
            />
            <StatRow label="Detection Time" value={`${detectMs.toFixed(0)} ms`} />
            <StatRow label="Model" value={modelReady ? "Loaded" : "Loading…"} />

            <div className="mt-5 space-y-2 border-t border-border pt-4">
              <p className="mb-2 text-xs tracking-wide text-muted-foreground uppercase">
                Class probabilities
              </p>
              {EMOTION_KEYS.map((key: EmotionKey) => (
                <ScoreBar key={key} emotion={key} value={top?.scores[key] ?? 0} />
              ))}
            </div>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

function Ctrl({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        primary
          ? "bg-gradient-brand text-primary-foreground hover:shadow-glow"
          : "border border-border bg-surface text-foreground hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
