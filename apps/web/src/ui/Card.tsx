import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Flat cards keep the border but drop the hard shadow (for dense stacks). */
  flat?: boolean;
  children?: ReactNode;
};

export function Card({ flat = false, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`${flat ? "ik-card-flat" : "ik-card"} ${className}`.trim()} {...rest}>
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
