import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThroughlineMark } from "../components/ThroughlineMark";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <main className="auth-screen">
      <div className="landing-ambient-bg" />
      <div className="auth-card glass-heavy depth-hover" style={{ borderRadius: "var(--radius-card)", position: "relative" }}>
        <Link className="auth-brand" to="/" aria-label="Throughline home">
          <span className="auth-brand-mark">
            <ThroughlineMark size={24} />
          </span>
          Throughline
        </Link>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}
