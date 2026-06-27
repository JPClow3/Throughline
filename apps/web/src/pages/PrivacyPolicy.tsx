import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function PrivacyPolicy() {
  return (
    <div className="relative min-h-screen text-[#f9fafb] bg-[#030712] overflow-hidden pb-20 font-sans">
      {/* Kinetic Aurora Background Layer */}
      <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden opacity-70">
        <div className="absolute top-[-20%] left-[-10%] w-[130%] h-[130%] bg-gradient-to-br from-[#6366f1]/40 via-[#818cf8]/40 to-[#008080]/30 rounded-full blur-[200px] mix-blend-screen aurora-bg-1 origin-center opacity-70"></div>
        <div className="absolute bottom-[-30%] right-[-10%] w-[140%] h-[140%] bg-gradient-to-tl from-[#10b981]/40 via-[#6366f1]/30 to-[#e6e6fa]/40 rounded-full blur-[250px] mix-blend-screen aurora-bg-2 origin-center opacity-70"></div>
        <div className="absolute top-[20%] left-[40%] w-[60%] h-[60%] bg-white/5 rounded-full blur-[150px] mix-blend-overlay animate-[pulse_10s_ease-in-out_infinite]"></div>
      </div>

      <header className="relative z-50 flex justify-between items-center px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl mt-6 mx-auto w-[90%] max-w-[1440px] border border-white/10 shadow-sm">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-transform hover:scale-[1.02] active:scale-95 duration-300">
          <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto block" style={{ filter: 'brightness(0) invert(1)' }} />
        </Link>
        <nav className="hidden md:flex gap-8">
        </nav>
        <div className="flex gap-4 items-center">
          <Link className="flex items-center gap-2 text-[#818cf8] font-semibold hover:scale-[1.015] active:scale-[0.98] transition-all bg-[#6366f1]/10 px-4 py-2 rounded-full" to="/">
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </header>

      <main className="relative z-10 pt-16 px-6 max-w-[800px] mx-auto">
        <h1 className="text-4xl md:text-5xl font-light tracking-tight text-[#f9fafb] mb-10 text-center">Privacy Policy</h1>
        
        <div className="glass-panel glass-heavy rounded-[30px] p-8 md:p-12 shadow-xl depth-hover border border-white/10 bg-white/5 backdrop-blur-xl flex flex-col gap-10">
          <section>
            <h2 className="text-2xl font-medium text-[#f9fafb] mb-4 tracking-tight">Local-First</h2>
            <p className="text-[#9ca3af] text-[16px] leading-relaxed font-light">
              Throughline is built with a "local-first" philosophy. This means that all of your task data, project maps, and personal goals live exactly where they belong: on your device. We use IndexedDB to securely store your data locally in your browser or installed app.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[#f9fafb] mb-4 tracking-tight">Push Notifications</h2>
            <p className="text-[#9ca3af] text-[16px] leading-relaxed font-light">
              If you opt-in to push notifications, we only send the bare minimum data required to trigger the alert. <strong>Push payloads are fully redacted.</strong> They contain only opaque identifiers and generic urgency alerts. The titles and descriptions of your tasks never pass through our push servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[#f9fafb] mb-4 tracking-tight">Zero Tracking or Analytics</h2>
            <p className="text-[#9ca3af] text-[16px] leading-relaxed font-light">
              We do not want to know how you use the app. There are no third-party trackers, no analytics scripts, and no behavioral monitoring. Your workflows and study habits are strictly your business.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[#f9fafb] mb-4 tracking-tight">Sync & End-to-End Encryption</h2>
            <p className="text-[#9ca3af] text-[16px] leading-relaxed font-light">
              When you create an account to sync across devices, your data is End-to-End Encrypted (E2EE) using a key derived locally from your password. The server only ever receives and stores ciphertext that it cannot read. Because we never possess your key, we cannot recover your data if you forget your password.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-[#f9fafb] mb-4 tracking-tight">Data Portability</h2>
            <p className="text-[#9ca3af] text-[16px] leading-relaxed font-light">
              Your thoughts are yours. At any time, you can export your entire workspace as a clean JSON file and take it elsewhere. We do not hold your data hostage.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
