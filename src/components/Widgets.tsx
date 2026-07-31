import { EMOTION_META, type EmotionKey } from "@/lib/emotions";
import { cn } from "@/lib/utils";

/** Key/value row used inside statistics panels. */
export function StatRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
      <span
        className={cn(
          "font-mono text-sm font-medium",
          accent ? "text-accent" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** Emoji + label chip tinted with the emotion's own color token. */
export function EmotionBadge({
  emotion,
  confidence,
  size = "md",
}: {
  emotion: EmotionKey;
  confidence?: number;
  size?: "sm" | "md" | "lg";
}) {
  const meta = EMOTION_META[emotion];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium",
        size === "lg" && "px-4 py-2 text-base",
        size === "md" && "px-3 py-1.5 text-sm",
        size === "sm" && "px-2.5 py-1 text-xs",
      )}
      style={{
        color: `var(${meta.token})`,
        borderColor: `color-mix(in oklch, var(${meta.token}) 45%, transparent)`,
        background: `color-mix(in oklch, var(${meta.token}) 12%, transparent)`,
      }}
    >
      <span aria-hidden>{meta.emoji}</span>
      {meta.label}
      {confidence !== undefined && (
        <span className="font-mono opacity-80">{Math.round(confidence * 100)}%</span>
      )}
    </span>
  );
}

/** Horizontal probability bar for one emotion class. */
export function ScoreBar({ emotion, value }: { emotion: EmotionKey; value: number }) {
  const meta = EMOTION_META[emotion];
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-xs text-muted-foreground">
        {meta.emoji} {meta.label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(2, value * 100)}%`, background: `var(${meta.token})` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-[11px] text-muted-foreground">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
