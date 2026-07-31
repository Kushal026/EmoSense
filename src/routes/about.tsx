import { createFileRoute } from "@tanstack/react-router";
import { Cpu, Layers, ShieldCheck, Workflow } from "lucide-react";
import { Shell } from "@/components/Shell";
import { EMOTION_KEYS, EMOTION_META } from "@/lib/emotions";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About EmoSense — How the Emotion Model Works" },
      {
        name: "description",
        content:
          "How EmoSense works: face localisation, 48x48 grayscale preprocessing and a 7-class FER expression CNN running fully in the browser.",
      },
      { property: "og:title", content: "About EmoSense — How the Emotion Model Works" },
      {
        property: "og:description",
        content: "Architecture, pipeline and privacy model behind EmoSense emotion detection.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <Shell>
      <div className="mx-auto max-w-3xl px-6 py-12 md:px-10">
        <h1 className="text-3xl font-bold">About EmoSense</h1>
        <p className="mt-2 text-muted-foreground">
          EmoSense is a real-time facial emotion recognition system. Face detection and
          expression classification both run on-device with WebGL-accelerated tensors — no
          server, no uploads.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Item
            icon={<Workflow className="size-4" />}
            title="Pipeline"
            body="Frame capture → face localisation → crop & normalise → CNN inference → top-1 emotion + confidence → overlay render."
          />
          <Item
            icon={<Cpu className="size-4" />}
            title="Model"
            body="FER-style expression CNN over 48×48 grayscale inputs, 7 output classes, paired with a TinyFaceDetector for localisation."
          />
          <Item
            icon={<Layers className="size-4" />}
            title="Performance"
            body="Inference runs asynchronously with a single job in flight, so the interface stays responsive at 25–30 FPS on typical hardware."
          />
          <Item
            icon={<ShieldCheck className="size-4" />}
            title="Privacy"
            body="Webcam frames and uploaded images are processed locally and are never transmitted or stored anywhere."
          />
        </div>

        <h2 className="mt-10 text-xl font-semibold">Emotion classes</h2>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {EMOTION_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3"
            >
              <span className="text-xl">{EMOTION_META[key].emoji}</span>
              <span className="text-sm font-medium">{EMOTION_META[key].label}</span>
              <span
                className="ml-auto size-3 rounded-full"
                style={{ background: `var(${EMOTION_META[key].token})` }}
              />
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          Emotion recognition from facial expressions is probabilistic and can be affected by
          lighting, occlusion, head pose and demographic bias in training data. Treat results as
          an estimate, not a diagnosis.
        </p>
      </div>
    </Shell>
  );
}

function Item({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center gap-2 text-accent">
        {icon}
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
