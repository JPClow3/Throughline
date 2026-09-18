import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Flat cards keep the border but drop the hard shadow (for dense stacks). */
  flat?: boolean;
  /** Inset wells use recessed paper-2 background and control radius. */
  inset?: boolean;
  children?: ReactNode;
};

export function Card({ flat = false, inset = false, className = "", children, ...rest }: CardProps) {
  const baseClass = inset ? "ik-inset" : flat ? "ik-card-flat" : "ik-card";
  return (
    <div className={`${baseClass} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function SectionHeading({
  icon,
  eyebrow,
  title
}: {
  icon?: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="section-heading">
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
    </div>
  );
}
