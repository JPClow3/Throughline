import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mark } from "../ui";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="ik-card auth-card">
        <Link to="/" aria-label="Throughline home" className="inline-flex items-center justify-center gap-2">
          <span className="shell-brand-mark" aria-hidden="true">
            <Mark size={18} />
          </span>
          <span className="text-lg font-bold">Throughline</span>
        </Link>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
