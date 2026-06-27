import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden text-on-surface">
      {/* Kinetic Aurora Background Layer */}
      <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[var(--surface-container-lowest)] opacity-70">
        <div className="absolute top-[-20%] left-[-10%] w-[130%] h-[130%] bg-gradient-to-br from-[var(--primary-container)]/40 via-[var(--primary-fixed-dim)]/40 to-[#008080]/30 rounded-full blur-[200px] mix-blend-multiply dark:mix-blend-lighten aurora-bg-1 origin-center opacity-70"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[140%] h-[140%] bg-gradient-to-tl from-[var(--secondary-fixed)]/40 via-[var(--primary)]/30 to-[#e6e6fa]/40 rounded-full blur-[250px] mix-blend-multiply dark:mix-blend-lighten aurora-bg-2 origin-center opacity-70"></div>
        <div className="absolute top-[20%] left-[40%] w-[60%] h-[60%] bg-white/30 dark:bg-white/5 rounded-full blur-[150px] mix-blend-overlay animate-[pulse_10s_ease-in-out_infinite]"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        <div className="mb-10">
          <Link to="/" className="flex items-center hover:opacity-80 transition-transform hover:scale-[1.02] active:scale-95 duration-300">
            <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-7 w-auto hidden dark:block" style={{ filter: 'brightness(0) invert(1)' }} />
            <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-7 w-auto block dark:hidden" />
          </Link>
        </div>
        <div className="glass-panel glass-heavy rounded-liquid-3 p-8 md:p-12 shadow-2xl depth-hover border border-white/40 dark:border-white/10 w-full relative overflow-hidden flex flex-col">
          <div className="relative z-10 flex flex-col gap-2 mb-8">
            <h1 className="text-3xl font-light tracking-tight text-[var(--ink)] text-center">{title}</h1>
            <p className="text-[var(--ink-muted)] text-center leading-relaxed font-light">{subtitle}</p>
          </div>
          <div className="relative z-10 w-full flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
