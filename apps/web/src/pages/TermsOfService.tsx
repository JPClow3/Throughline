import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function TermsOfService() {
  return (
    <div className="relative min-h-screen text-on-surface bg-background overflow-hidden pb-20">
      {/* Kinetic Aurora Background Layer */}
      <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[var(--surface-container-lowest)] opacity-70">
        <div className="absolute top-[-20%] left-[-10%] w-[130%] h-[130%] bg-gradient-to-br from-[var(--primary-container)]/40 via-[var(--primary-fixed-dim)]/40 to-[#008080]/30 rounded-full blur-[200px] mix-blend-multiply dark:mix-blend-lighten aurora-bg-1 origin-center opacity-70"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[140%] h-[140%] bg-gradient-to-tl from-[var(--secondary-fixed)]/40 via-[var(--primary)]/30 to-[#e6e6fa]/40 rounded-full blur-[250px] mix-blend-multiply dark:mix-blend-lighten aurora-bg-2 origin-center opacity-70"></div>
        <div className="absolute top-[20%] left-[40%] w-[60%] h-[60%] bg-white/30 dark:bg-white/5 rounded-full blur-[150px] mix-blend-overlay animate-[pulse_10s_ease-in-out_infinite]"></div>
      </div>

      <header className="relative z-50 flex justify-between items-center px-6 py-4 bg-white/30 dark:bg-black/30 backdrop-blur-[80px] rounded-[40px_15px_40px_15px] mt-6 mx-auto w-[90%] max-w-[1440px] border border-white/30 dark:border-white/10 shadow-sm">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-transform hover:scale-[1.02] active:scale-95 duration-300">
          <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto hidden dark:block" style={{ filter: 'brightness(0) invert(1)' }} />
          <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto block dark:hidden" />
        </Link>
        <nav className="hidden md:flex gap-8">
          <Link to="/privacy" className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium hover:scale-[1.015] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] px-4 py-2 rounded-lg">Privacy</Link>
        </nav>
        <div className="flex gap-4 items-center">
          <Link className="flex items-center gap-2 text-[var(--primary)] dark:text-[var(--primary-fixed)] font-semibold hover:scale-[1.015] active:scale-[0.98] transition-all bg-[var(--primary)]/10 px-4 py-2 rounded-full" to="/">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-16 px-6 max-w-[800px] mx-auto">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[var(--ink)] mb-10 text-center">Terms of Service</h1>
        
        <div className="glass-panel glass-heavy rounded-[30px] p-8 md:p-12 shadow-xl depth-hover border border-white/40 dark:border-white/10 flex flex-col gap-10">
          <section>
            <h2 className="text-2xl font-medium text-[var(--ink)] mb-4 tracking-tight">1. Acceptance of Terms</h2>
            <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed font-light">
              By accessing and using the Throughline application, you accept and agree to be bound by these Terms of Service. If you do not agree with any part of the terms, you should not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[var(--ink)] mb-4 tracking-tight">2. Use of the Application</h2>
            <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed font-light">
              Throughline is a productivity and study tool. You are entirely responsible for all the content you create, store, and manage within the application. Because the application is "local-first", you are responsible for maintaining your data on your device, unless cloud sync services are explicitly provided.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[var(--ink)] mb-4 tracking-tight">3. Account and Security</h2>
            <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed font-light">
              You are responsible for maintaining the confidentiality of your login information and any generated encryption keys. We are not responsible for any data loss resulting from the loss of access to your device or encryption key.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[var(--ink)] mb-4 tracking-tight">4. Modifications to the Service</h2>
            <p className="text-[var(--ink-muted)] text-[16px] leading-relaxed font-light">
              We reserve the right to modify or discontinue the service (or any part thereof) at any time, with or without prior notice. We shall not be liable to you or to any third party for any modification, suspension, or discontinuance of the service.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
