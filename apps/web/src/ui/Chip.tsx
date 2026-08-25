import type { ButtonHTMLAttributes, ReactNode } from "react";
import { X } from "@phosphor-icons/react";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
};

export function Chip({ active = false, className = "", children, ...rest }: ChipProps) {
  return (
    <button type="button" className={`chip ${active ? "active" : ""} ${className}`.trim()} aria-pressed={active} {...rest}>
      {children}
    </button>
  );
}

export function StaticChip({
  tone,
  className = "",
  children
}: {
  tone?: "overdue" | "soon" | "done";
  className?: string;
  children: ReactNode;
}) {
  const toneClass = tone ? `is-${tone}` : "";
  return <span className={`chip-static ${toneClass} ${className}`.trim()}>{children}</span>;
}

export function ProjectDot() {
  return <span className="project-dot" aria-hidden="true" />;
}

export function UnlinkButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="note-link-unlink" aria-label={label} onClick={onClick}>
      <X size={11} weight="bold" />
    </button>
  );
}
