import { Info, Warning, WarningCircle, CheckCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";

type NoticeVariant = "info" | "warning" | "error" | "success";

type NoticeProps = {
  variant?: NoticeVariant;
  title?: string;
  children: ReactNode;
  className?: string;
};

const variantConfig: Record<NoticeVariant, { icon: ReactNode; cssVar: string }> = {
  info: { icon: <Info size={20} />, cssVar: "var(--focus)" },
  warning: { icon: <Warning size={20} />, cssVar: "var(--warn)" },
  error: { icon: <WarningCircle size={20} />, cssVar: "var(--danger)" },
  success: { icon: <CheckCircle size={20} />, cssVar: "var(--success)" },
};

export function Notice({ variant = "info", title, children, className = "" }: NoticeProps) {
  const config = variantConfig[variant];

  return (
    <div
      className={`notice notice-${variant} ${className}`}
      role={variant === "error" ? "alert" : "status"}
    >
      <div className="notice-icon" aria-hidden="true" style={{ color: config.cssVar }}>
        {config.icon}
      </div>
      <div className="notice-content">
        {title && <h4 className="notice-title" style={{ color: config.cssVar }}>{title}</h4>}
        <div className="notice-body">{children}</div>
      </div>
    </div>
  );
}
