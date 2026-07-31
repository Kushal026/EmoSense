import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ImageIcon, Zap, ShieldCheck, Gauge, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { loadEngine } from "@/lib/face-engine";
import { EMOTION_KEYS, EMOTION_META } from "@/lib/emotions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EmoSense — Real-Time AI Emotion Detection" },
      {
        name: "description",
        content:
          "EmoSense detects human emotions from facial expressions in real time using your webcam or an uploaded image. Runs entirely in your browser.",
      },
      { property: "og:title", content: "EmoSense — Real-Time AI Emotion Detection" },
      {
        property: "og:description",
        content:
          "Live webcam and image emotion recognition with a 7-class expression CNN, running fully on-device.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    loadEngine()
      .then(() => !cancelled && setStatus("ready"))
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Shell>
      <div className="mx-auto max-w-5xl px-6 py-14 md:px-10 md:py-20">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted-foreground">
          <Zap className="size-3.5 text-accent" /> On-device deep learning · 7 emotion classes
        </p>

        <h1 className="font-display text-6xl font-bold md:text-7xl">
          <span className="text-gradient">EmoSense</span>
        </h1>
        <p className="mt-3 max-w-xl text-lg text-muted-foreground">
          AI Powered Emotion Detection System
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <ModeCard
            icon={<Camera className="size-6" />}
            title="Live Emotion Detection"
            body="Stream your webcam, track every visible face and read emotions frame by frame with live FPS and confidence stats."
            cta="Start Camera"
            to="/live"
          />
          <ModeCard
            icon={<ImageIcon className="size-6" />}
            title="Image Emotion Detection"
            body="Upload a JPG or PNG, detect all faces at once, review per-face confidence and export the annotated result."
            cta="Upload Image"
            to="/image"
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {EMOTION_KEYS.map((key) => (
            <span
              key={key}
              className="rounded-full border px-3 py-1 text-sm"
              style={{
                color: `var(${EMOTION_META[key].token})`,
                borderColor: `color-mix(in oklch, var(${EMOTION_META[key].token}) 40%, transparent)`,
              }}
            >
              {EMOTION_META[key].emoji} {EMOTION_META[key].label}
            </span>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Feature icon={<Gauge className="size-4" />} title="25–30 FPS" body="Non-blocking detection loop keeps the UI smooth." />
          <Feature icon={<ShieldCheck className="size-4" />} title="Private" body="Frames are processed locally, never uploaded." />
          <Feature icon={<Zap className="size-4" />} title="Multi-face" body="Every visible face is boxed and classified." />
        </div>

        <div className="mt-12 flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm">
          {status === "loading" && (
            <>
              <span className="size-2 animate-pulse rounded-full bg-accent" />
              <span className="text-muted-foreground">Loading emotion model…</span>
            </>
          )}
          {status === "ready" && (
            <>
              <CheckCircle2 className="size-4 text-happy" />
              <span className="text-foreground">Model Loaded Successfully</span>
            </>
          )}
          {status === "error" && (
            <>
              <span className="size-2 rounded-full bg-destructive" />
              <span className="text-destructive">Emotion model could not be loaded.</span>
            </>
          )}
        </div>
      </div>
    </Shell>
  );
}

function ModeCard({
  icon,
  title,
  body,
  cta,
  to,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="panel group relative overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute -top-24 -right-24 size-48 rounded-full bg-gradient-brand opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25" />
      <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
        {icon}
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      <Link
        to={to}
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-shadow duration-200 hover:shadow-glow"
      >
        {cta}
      </Link>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2 text-accent">{icon}<span className="text-sm font-semibold text-foreground">{title}</span></div>
      <p className="mt-1.5 text-xs text-muted-foreground">{body}</p>
    </div>
  );
}
