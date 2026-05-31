import type { ReactNode } from "react";
import { Link } from "react-router-dom";

function ThroughlineMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17 L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="5" cy="17" r="2.4" fill="currentColor" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <circle cx="19" cy="7" r="3" fill="currentColor" />
    </svg>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-card glass-panel">
        <Link className="auth-brand" to="/" aria-label="Throughline home">
          <span className="auth-brand-mark">
            <ThroughlineMark />
          </span>
          Throughline
        </Link>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
