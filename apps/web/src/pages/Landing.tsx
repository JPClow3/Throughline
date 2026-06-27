import {
  ArrowRight,
  Cube,
  Clock,
  CodeBlock,
  Database,
  LockKey,
  ShieldCheck,
  WifiSlash,
  CloudCheck,
  DeviceMobile
} from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ThroughlineMark } from "../components/ThroughlineMark";

const floatTransition = { duration: 7, repeat: Infinity, ease: "easeInOut" } as const;

function Reveal({ children, delay = 0, className, style }: { children: ReactNode; delay?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function BrowserFrame({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`browser-frame${className ? ` ${className}` : ""}`}>
      <div className="browser-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <img src={src} alt={alt} loading="lazy" width={2480} height={1600} />
    </div>
  );
}

function AmbientBackground() {
  return (
    <div className="fixed inset-0 z-[-2] pointer-events-none overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-gradient-to-br from-[var(--tl-accent-blue)]/30 to-[var(--tl-accent-violet)]/10 rounded-full blur-[100px] animate-pulse-bio" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-tl from-[var(--tl-accent-aqua)]/20 to-[var(--tl-accent-blue)]/10 rounded-full blur-[120px] animate-pulse-bio" style={{ animationDelay: '-4s' }} />
      <div className="absolute top-[40%] left-[60%] w-[40vw] h-[40vw] bg-[var(--tl-accent-aqua)]/10 rounded-full blur-[150px] animate-pulse-bio" style={{ animationDelay: '-2s' }} />
      
      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-25 flex items-center justify-center scale-150">
        <svg className="w-full h-full animate-float-slow" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="thread-bg" x1="180" x2="820" y1="160" y2="820" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7EA7FF" />
              <stop offset="0.52" stopColor="#B9A7FF" />
              <stop offset="1" stopColor="#8FE7DD" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path className="filament-path" fill="none" filter="url(#glow)" stroke="url(#thread-bg)" strokeLinecap="round" strokeWidth="20" d="M100 200 C200 400 300 200 500 500 C700 800 800 500 900 700" />
          <path className="filament-path" fill="none" filter="url(#glow)" stroke="url(#thread-bg)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="40" style={{ animationDelay: '1s', opacity: 0.5 }} d="M260 260 C260 330 260 350 330 352 C405 352 395 351 455 352 C515 352 500 435 565 435 C650 435 654 510 654 565 C654 640 704 654 748 724" />
        </svg>
      </div>
    </div>
  );
}

const SHOWCASE = [
  {
    eyebrow: "Board",
    title: "Visualize your workflow",
    body: "A beautifully clean Kanban board. Drag, drop, and focus on what needs to be done next.",
    img: "/store-assets/shots/board.png",
    alt: "Throughline Kanban board interface"
  },
  {
    eyebrow: "Timeline",
    title: "Pace yourself",
    body: "A gentle hourly agenda. Schedule tasks without the overwhelming pressure of a stuffed calendar.",
    img: "/store-assets/shots/timeline.png",
    alt: "Throughline timeline interface"
  },
  {
    eyebrow: "Notes",
    title: "Everything connected",
    body: "A built-in markdown notebook that naturally links back to your tasks and goals.",
    img: "/store-assets/shots/notes.png",
    alt: "Throughline markdown notes interface"
  }
];

const BENTO_FEATURES = [
  { icon: <ShieldCheck size={28} weight="duotone" />, color: "bg-[var(--tl-surface-tint)]", title: "Local-First Privacy", body: "Your data never leaves your device. Total sovereignty over your academic life powered by IndexedDB." },
  { icon: <Cube size={28} weight="duotone" />, color: "bg-[var(--tl-surface-tint)]", title: "Spatial Organization", body: "Map your syllabus visually. Connect concepts in a fluid, three-dimensional workspace designed for complex understanding." },
  { icon: <Clock size={28} weight="duotone" />, color: "bg-[var(--tl-surface-tint)]", title: "Academic Rhythm", body: "Sync with your semesters. Automated scheduling that breathes with your actual energy levels." }
];

const FAQ = [
  {
    q: "Is my data private?",
    a: "Yes. With an account, everything is end-to-end encrypted on your device before it syncs — the server only ever stores ciphertext it can't read."
  },
  {
    q: "Does it work offline?",
    a: "Fully. Throughline is local-first: your plan lives in the browser and works with no connection. Sync catches up when you're back online."
  },
  {
    q: "How much does it cost?",
    a: "Throughline is in beta. There are no ads and no tracking, and it installs as an app on your phone, desktop, and Windows."
  }
];

export function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="landing text-[var(--tl-text)]">
        <AmbientBackground />
        
        <header className="landing-nav glass-panel" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, borderBottom: '1px solid var(--tl-glass-border)', backdropFilter: 'blur(40px)', backgroundColor: 'var(--tl-surface-glass)' }}>
          <a className="landing-brand" href="#top">
            <img src="/brand/svg/throughline-icon-liquid-glass.svg" alt="" width="24" height="24" style={{ borderRadius: '6px' }} />
            <span style={{ marginLeft: '8px', paddingRight: '4px', fontWeight: 'bold' }}>Throughline</span>
          </a>
          <nav className="landing-nav-links" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#views">The app</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            <Link className="landing-link" style={{ color: 'var(--tl-accent-blue)' }} to="/login">
              Log in
            </Link>
            <Link className="primary-button" style={{ borderRadius: '30px' }} to="/signup">
              Get started
            </Link>
          </div>
        </header>

        <main id="top" className="landing-main" style={{ paddingTop: '160px' }}>
          {/* Hero Section */}
          <section className="flex flex-col items-center text-center mb-32">
            <div className="relative w-full max-w-4xl flex flex-col items-center">
              <div className="absolute inset-0 bg-[var(--tl-surface-glass)] rounded-[100px] blur-[60px] -z-10" />
              <h1 className="font-display-lg text-[40px] md:text-[64px] font-bold text-[var(--tl-text)] mb-6 drop-shadow-sm flex flex-col gap-2 relative leading-tight" style={{ letterSpacing: '-0.04em' }}>
                <Reveal delay={0} style={{ transform: 'translateZ(20px) scale(1.02)' }}>Academic Flow,</Reveal>
                <Reveal delay={0.1} style={{ transform: 'translateZ(40px) scale(1.05)' }}>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--tl-accent-blue)] to-[#7EA7FF]">
                    Engineered.
                  </span>
                </Reveal>
              </h1>
              <Reveal delay={0.2} style={{ transform: 'translateZ(10px) scale(1.01)' }}>
                <p className="text-[18px] text-[var(--tl-text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                  A local-first, spatial workspace designed explicitly for students who demand absolute focus, uncompromising privacy, and rhythmic academic progression.
                </p>
              </Reveal>
              <Reveal delay={0.3} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link className="primary-button flex items-center justify-center gap-3" style={{ padding: '16px 32px', borderRadius: '30px', fontSize: '16px' }} to="/signup">
                  Start Your Flow <ArrowRight size={20} />
                </Link>
                <a className="glass-panel text-[var(--tl-text)] font-medium transition-all duration-300" style={{ padding: '16px 32px', borderRadius: '30px', fontSize: '16px', display: 'flex', alignItems: 'center' }} href="#views">
                  Explore Features
                </a>
              </Reveal>
            </div>
          </section>

          {/* Connected SVG Filament for Modules */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2 top-[500px] w-full max-w-[1000px] h-[600px] -z-10 pointer-events-none">
            <svg className="w-full h-full opacity-30" viewBox="0 0 1000 600">
              <path d="M200 100 C300 300 700 100 800 300 C900 500 500 400 300 550" fill="none" filter="url(#glow)" stroke="url(#thread-bg)" strokeDasharray="8 16" strokeLinecap="round" strokeWidth="8" />
            </svg>
          </div>

          {/* Bento Feature Grid */}
          <section id="how" className="mb-40 max-w-[1200px] mx-auto w-full px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {BENTO_FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={0.1 * index} className="glass-panel rounded-3xl p-10 flex flex-col items-start h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-8 border border-white/50 text-[var(--tl-accent-blue)] shadow-sm`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-[24px] font-semibold text-[var(--tl-text)] mb-4">{feature.title}</h3>
                  <p className="text-[16px] text-[var(--tl-text-secondary)] leading-relaxed font-light">
                    {feature.body}
                  </p>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Showcase Section */}
          <section id="views" className="landing-section">
            <Reveal className="landing-section-head text-center mb-16">
              <span className="eyebrow" style={{ color: 'var(--tl-accent-blue)' }}>The app</span>
              <h2 className="text-[40px] font-bold text-[var(--tl-text)] mt-2">One plan, a few calm views.</h2>
            </Reveal>
            <div className="landing-showcase">
              {SHOWCASE.map((item, index) => (
                <div key={item.title} className={`landing-showcase-row${index % 2 ? " is-reversed" : ""}`}>
                  <Reveal className="landing-showcase-text">
                    <span className="eyebrow" style={{ color: 'var(--tl-accent-blue)' }}>{item.eyebrow}</span>
                    <h3 className="text-[32px] font-semibold text-[var(--tl-text)] mb-4 mt-2">{item.title}</h3>
                    <p className="text-[18px] text-[var(--tl-text-secondary)] font-light">{item.body}</p>
                  </Reveal>
                  <motion.div
                    className="landing-showcase-shot"
                    initial={{ opacity: 0, x: index % 2 ? -44 : 44 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <BrowserFrame src={item.img} alt={item.alt} className="glass-panel p-2 rounded-[1.5rem]" />
                  </motion.div>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Panel - Data Portability */}
          <section className="mb-32 max-w-[1200px] mx-auto w-full px-6">
            <Reveal delay={0.2}>
              <div className="glass-heavy rounded-[40px] p-12 md:p-20 flex flex-col lg:flex-row gap-16 items-center relative overflow-hidden" style={{ background: 'var(--tl-glass-card-strong)', border: '1px solid var(--tl-glass-border)' }}>
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-bl from-[var(--tl-accent-blue)]/30 to-transparent rounded-full blur-[60px]" />
                <div className="flex-1 z-10 relative">
                  <div className="absolute -left-10 -top-10 opacity-20 w-32 h-32 pointer-events-none">
                    <svg viewBox="0 0 1024 1024"><circle cx="512" cy="512" fill="none" r="400" stroke="#7EA7FF" strokeDasharray="100 50" strokeWidth="40" /></svg>
                  </div>
                  <h2 className="text-[36px] font-bold text-[var(--tl-text)] mb-6">True Data Portability</h2>
                  <p className="text-[18px] text-[var(--tl-text-secondary)] font-light mb-10 leading-relaxed">
                    We believe your thoughts belong to you. Import and export everything via clean JSON. The underlying IndexedDB architecture ensures lightning fast, offline-first performance without a central server sniffing your research.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="px-6 py-3 rounded-2xl border bg-[var(--tl-surface-glass-strong)] border-[var(--tl-glass-border)] text-[var(--tl-text)] font-medium flex items-center gap-2 backdrop-blur-md shadow-sm transition-transform hover:scale-105">
                      <CodeBlock size={20} color="var(--tl-accent-blue)" /> JSON Export
                    </div>
                    <div className="px-6 py-3 rounded-2xl border bg-[var(--tl-surface-glass-strong)] border-[var(--tl-glass-border)] text-[var(--tl-text)] font-medium flex items-center gap-2 backdrop-blur-md shadow-sm transition-transform hover:scale-105">
                      <Database size={20} color="var(--tl-accent-violet)" /> IndexedDB
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full z-10">
                  <div className="bg-[var(--tl-surface-glass-strong)] border border-[var(--tl-glass-border)] rounded-3xl p-8 font-mono text-[13px] text-[var(--tl-text-secondary)] shadow-inner overflow-x-auto relative backdrop-blur-xl">
                    <div className="absolute top-5 left-6 flex gap-3">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-sm" />
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm" />
                      <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-sm" />
                    </div>
                    <pre className="mt-8"><code>{`{
  "user": "scholar_01",
  "workspace": "Thesis_Drafting",
  "flow_state": "active",
  "data_locality": "100%",
  "sync": {
    "provider": "none",
    "status": "isolated"
  }
}`}</code></pre>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          <section id="faq" className="landing-section landing-faq">
            <Reveal className="landing-section-head text-center">
              <span className="eyebrow" style={{ color: 'var(--tl-accent-blue)' }}>Questions</span>
              <h2 className="text-[40px] font-bold text-[var(--tl-text)] mt-2">Good to know.</h2>
            </Reveal>
            <div className="landing-faq-list max-w-2xl mx-auto mt-10">
              {FAQ.map((item) => (
                <Reveal key={item.q}>
                  <details className="landing-faq-item glass-panel depth-hover mb-4 p-6 rounded-2xl">
                    <summary className="font-medium text-[18px] cursor-pointer outline-none">{item.q}</summary>
                    <p className="mt-4 text-[var(--tl-text-secondary)] font-light leading-relaxed">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="landing-final text-center mt-32 mb-20">
            <Reveal>
              <h2 className="text-[40px] font-bold text-[var(--tl-text)] mb-4">Start with one goal.</h2>
              <p className="text-[18px] text-[var(--tl-text-secondary)] font-light mb-8">Add the first step today — Throughline keeps the rest calm.</p>
              <Link className="primary-button depth-hover glow-halo inline-flex items-center gap-2" style={{ padding: '16px 32px', borderRadius: '30px', fontSize: '16px' }} to="/signup">
                Get started <ArrowRight size={17} />
              </Link>
            </Reveal>
          </section>
        </main>

        <footer className="landing-footer border-t border-[var(--tl-border-subtle)] mt-10 pt-10 pb-10">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
            <div className="text-[14px] text-[var(--tl-text-secondary)]/70">
              © 2024 Throughline. Engineered for Flow.
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <a className="text-[14px] text-[var(--tl-text-secondary)]/70 hover:text-[var(--tl-accent-blue)] transition-colors" href="#privacy">Privacy</a>
              <a className="text-[14px] text-[var(--tl-text-secondary)]/70 hover:text-[var(--tl-accent-blue)] transition-colors" href="#terms">Terms</a>
              <a className="text-[14px] text-[var(--tl-text-secondary)]/70 hover:text-[var(--tl-accent-blue)] transition-colors" href="#faq">Methodology</a>
              <a className="text-[14px] text-[var(--tl-text-secondary)]/70 hover:text-[var(--tl-accent-blue)] transition-colors" href="#support">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
