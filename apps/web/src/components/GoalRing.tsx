import type { CSSProperties } from "react";

export function GoalRing({ ratio, size = 46, label }: { ratio: number; size?: number; label?: string }) {
  const clamped = Math.min(100, Math.max(0, Math.round(ratio)));
  const thickness = Math.max(4, Math.round(size / 12));

  return (
    <div
      className="goal-ring"
      role="img"
      aria-label={label ?? `${clamped}% complete`}
      style={
        {
          "--ring-size": `${size}px`,
          "--ring-thickness": `${thickness}px`,
          "--ring-ratio": clamped
        } as CSSProperties
      }
    >
      <span>{clamped}%</span>
    </div>
  );
}
