import type { ReactNode } from "react";
import { Link } from "react-router-dom";



export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="auth-screen">
      <div className="auth-card glass-panel">
        <Link to="/" aria-label="Throughline home" className="flex items-center gap-2 mb-8 hover:opacity-80 transition-opacity justify-center w-full">
          <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-7 w-auto hidden dark:block" style={{ filter: 'brightness(0) invert(1)' }} />
          <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-7 w-auto block dark:hidden" />
        </Link>
        <h1 className="auth-title">{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}
