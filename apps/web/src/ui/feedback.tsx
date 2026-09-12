import { CheckCircle, Info, Warning, WarningCircle } from "@phosphor-icons/react";
import type { CSSProperties, ReactNode } from "react";

/* ------------------------------- Notice -------------------------------- */

type NoticeVariant = "info" | "warning" | "error" | "success";

const NOTICE_ICON: Record<NoticeVariant, ReactNode> = {
  info: <Info size={18} weight="bold" />,
  warning: <Warning size={18} weight="bold" />,
  error: <WarningCircle size={18} weight="bold" />,
  success: <CheckCircle size={18} weight="bold" />
};

export function Notice({
  variant = "info",
  title,
  children,
  className = ""
}: {
  variant?: NoticeVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`notice notice-${variant} ${className}`.trim()} role={variant === "error" ? "alert" : "status"}>
      <div className="notice-icon" style={{ color: `var(--${variant === "info" ? "blue" : variant === "warning" ? "warn" : variant})` }} aria-hidden="true">
        {NOTICE_ICON[variant]}
      </div>
      <div>
        {title ? <h4 className="notice-title">{title}</h4> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------- Empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  body,
  action,
  variant = "card",
  className = ""
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  variant?: "card" | "inline";
  className?: string;
}) {
  return (
    <div className={`empty-state-${variant}${className ? ` ${className}` : ""}`} role="status">
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <h3>{title}</h3>
      {body ? <p className="text-sm" style={{ maxWidth: "38ch" }}>{body}</p> : null}
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}

/* ------------------------- Spinner & skeletons -------------------------- */

export function Spinner({ size = 24, className = "", style }: { size?: number; className?: string; style?: CSSProperties }) {
  return (
    <svg
      className={`spin ${className}`.trim()}
      style={{ width: size, height: size, ...style }}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
      role="img"
    >
      <circle className="spinner-track" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <circle className="spinner-head" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="44" />
    </svg>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`.trim()} aria-hidden="true" />;
}

export function ViewSkeleton() {
  return (
    <div className="skeleton-view" aria-busy="true" aria-label="Loading">
      <div className="skeleton-row">
        <Skeleton className="is-title" />
        <Skeleton className="is-pill" />
      </div>
      <Skeleton className="is-hero" />
      <div className="skeleton-grid">
        <Skeleton className="is-card" />
        <Skeleton className="is-card" />
        <Skeleton className="is-card" />
      </div>
    </div>
  );
}

/* --------------------------------- Ring --------------------------------- */

export function Ring({
  ratio,
  size = 46,
  label,
  color
}: {
  ratio: number;
  size?: number;
  label?: string;
  color?: string;
}) {
  const target = Math.min(100, Math.max(0, Math.round(ratio)));
  // The conic-gradient stop is registered as animatable in CSS
  // (--ring-ratio via @property), so the browser tweens the sweep itself —
  // no per-frame state updates needed. Reduced motion disables the
  // transition in CSS.
  const thickness = Math.max(5, Math.round(size / 9));
  return (
    <div
      className="goal-ring"
      role="img"
      aria-label={label ?? `${target}% complete`}
      style={
        {
          "--ring-size": `${size}px`,
          "--ring-thickness": `${thickness}px`,
          "--ring-ratio": target,
          ...(color ? { "--project-color": color } : {})
        } as CSSProperties
      }
    >
      <span>{target}%</span>
    </div>
  );
}

/* ------------------------------- Brand mark ------------------------------ */

export function Mark({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <path d="M5 17 L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
      <circle cx="5" cy="17" r="2.6" fill="currentColor" stroke="var(--line)" strokeWidth="1" />
      <circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="var(--line)" strokeWidth="1" />
      <circle cx="19" cy="7" r="3.2" fill="currentColor" stroke="var(--line)" strokeWidth="1" />
    </svg>
  );
}
