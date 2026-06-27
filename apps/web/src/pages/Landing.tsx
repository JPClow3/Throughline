import {
  ArrowRight,
  CalendarDots,
  CloudCheck,
  Kanban,
  LockKey,
  Note as NoteIcon,
  Path,
  Sparkle,
  Target,
  WifiSlash
} from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const floatTransition = { duration: 7, repeat: Infinity, ease: "easeInOut" } as const;

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
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

const STEPS = [
  { icon: <Target size={24} weight="fill" />, title: "Set an end goal", body: "Name what you're working toward — “Launch my side project”, “Run a 10k”." },
  { icon: <Path size={24} weight="fill" />, title: "Break it into steps", body: "Add ordered tasks under the goal. Reorder them as the plan changes." },
  { icon: <Sparkle size={24} weight="fill" />, title: "Watch it roll up", body: "Finish steps and progress climbs on its own — on Today, the board, and the timeline." }
];

const SHOWCASE = [
  {
    eyebrow: "Board",
    title: "See the work move",
    body: "A calm Kanban board across Backlog → Done, with a project filter and quick search. Drag, or change status inline.",
    img: "/store-assets/shots/board.png",
    alt: "Throughline Kanban board interface showing columns for Backlog, In Progress, and Done"
  },
  {
    eyebrow: "Timeline",
    title: "Plan the day, gently",
    body: "An hourly agenda for any day in the next ten, so due work has a place to land without the pressure of a packed calendar.",
    img: "/store-assets/shots/timeline.png",
    alt: "Throughline timeline interface showing tasks scheduled on an hourly agenda calendar"
  },
  {
    eyebrow: "Notes",
    title: "Context, cross-linked",
    body: "One markdown notebook. Link a note to any task or goal and jump straight back to the work it belongs to.",
    img: "/store-assets/shots/notes.png",
    alt: "Throughline markdown notes interface demonstrating cross-linking back to specific tasks and goals"
  }
];

const FEATURES = [
  { icon: <Target size={20} weight="duotone" />, title: "Goals hold tasks", body: "Real child steps with derived roll-up progress." },
  { icon: <NoteIcon size={20} weight="duotone" />, title: "Cross-linked notes", body: "A notebook that points back to your work." },
  { icon: <Kanban size={20} weight="duotone" />, title: "Board & timeline", body: "The same plan, two calm views — filterable." },
  { icon: <CalendarDots size={20} weight="duotone" />, title: "ICS export", body: "Send due dates to your calendar of choice." }
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
    q: "Can I use it on more than one device?",
    a: "Yes — sign in on each device and your goals, tasks, and notes sync across them automatically."
  },
  {
    q: "What happens if I forget my password?",
    a: "Because your data is end-to-end encrypted with a key derived from your password, we can't reset it or recover your notes. Keep it somewhere safe."
  },
  {
    q: "How much does it cost?",
    a: "Throughline is in beta. There are no ads and no tracking, and it installs as an app on your phone, desktop, and Windows."
  }
];

export function Landing() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen text-on-surface bg-background overflow-hidden pb-10">
        
        {/* Kinetic Aurora Background Layer */}
        <div className="fixed inset-0 z-[0] pointer-events-none overflow-hidden bg-[var(--surface-container-lowest)] opacity-70">
          <div className="absolute top-[-20%] left-[-10%] w-[130%] h-[130%] bg-gradient-to-br from-[var(--primary-container)]/40 via-[var(--primary-fixed-dim)]/40 to-[#008080]/30 rounded-full blur-[200px] mix-blend-multiply dark:mix-blend-lighten aurora-bg-1 origin-center opacity-70"></div>
          <div className="absolute bottom-[-30%] right-[-10%] w-[140%] h-[140%] bg-gradient-to-tl from-[var(--secondary-fixed)]/40 via-[var(--primary)]/30 to-[#e6e6fa]/40 rounded-full blur-[250px] mix-blend-multiply dark:mix-blend-lighten aurora-bg-2 origin-center opacity-70"></div>
          <div className="absolute top-[20%] left-[40%] w-[60%] h-[60%] bg-white/30 dark:bg-white/5 rounded-full blur-[150px] mix-blend-overlay animate-[pulse_10s_ease-in-out_infinite]"></div>
        </div>

        {/* Top Navigation */}
        <nav className="relative z-50 flex justify-between items-center px-6 py-4 bg-white/30 dark:bg-black/30 backdrop-blur-[80px] rounded-[40px_15px_40px_15px] mt-6 mx-auto w-[90%] max-w-[1440px] border border-white/30 dark:border-white/10 shadow-sm">
          <a href="#top" className="flex items-center gap-2 hover:opacity-80 transition-transform hover:scale-[1.02] active:scale-95 duration-300">
            <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto hidden dark:block" style={{ filter: 'brightness(0) invert(1)' }} />
            <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto block dark:hidden" />
          </a>
          <div className="hidden md:flex gap-8">
            <a className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium hover:scale-[1.015] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] px-4 py-2 rounded-lg" href="#how">How it works</a>
            <a className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium hover:scale-[1.015] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] px-4 py-2 rounded-lg" href="#views">The app</a>
            <Link className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium hover:scale-[1.015] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] px-4 py-2 rounded-lg" to="/privacy">Privacy</Link>
            <Link className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium hover:scale-[1.015] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] px-4 py-2 rounded-lg" to="/terms">Terms</Link>
            <a className="text-[var(--ink-muted)] hover:text-[var(--ink)] font-medium hover:scale-[1.015] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-300 active:scale-[0.98] px-4 py-2 rounded-lg" href="#faq">FAQ</a>
          </div>
          <div className="flex gap-4 items-center">
            <Link className="hidden md:block text-[var(--primary)] dark:text-[var(--primary-fixed)] font-semibold hover:scale-[1.015] active:scale-[0.98] transition-all" to="/login">Sign In</Link>
            <Link className="btn-primary px-6 py-2.5 rounded-[25px_10px_25px_10px] font-semibold text-white shadow-sm flex items-center justify-center glow-halo" to="/signup">Get Started</Link>
          </div>
        </nav>

        <main id="top" className="relative z-10 pt-24 pb-24 px-6 md:px-16 max-w-[1440px] mx-auto">
          {/* Hero Section */}
          <section className="flex flex-col lg:flex-row items-center gap-12 mt-12 mb-40">
            <Reveal className="flex-1 flex flex-col items-start text-left pl-0 md:pl-12 w-full">
              <span className="text-[var(--primary)] dark:text-[var(--primary-fixed)] font-semibold tracking-widest text-xs uppercase mb-6 bg-[var(--primary)]/10 dark:bg-[var(--primary)]/20 px-4 py-1.5 rounded-full border border-[var(--primary)]/20">A calm place to plan</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 drop-shadow-sm max-w-3xl font-light leading-[1.05] tracking-tight">
                <span className="text-shimmer">Academic Flow, <br/>Engineered.</span>
              </h1>
              <p className="text-lg md:text-xl text-[var(--ink-muted)] max-w-2xl mb-12 font-light leading-relaxed">
                Throughline is a calm, private planner where end goals hold real tasks — with a cross-linked notebook, a board, and a timeline. Local-first and end-to-end encrypted.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 mb-8 w-full sm:w-auto">
                <Link className="btn-primary w-full sm:w-auto px-8 py-4 rounded-[40px_15px_40px_15px] font-medium hover:scale-[1.015] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 depth-hover" to="/signup">
                  Start Your Flow
                  <ArrowRight size={20} weight="bold" />
                </Link>
                <a href="#how" className="glass-panel w-full sm:w-auto px-8 py-4 rounded-[15px_40px_15px_40px] font-medium text-[var(--ink)] hover:bg-white/40 dark:hover:bg-white/10 active:scale-[0.98] transition-all duration-200 depth-hover flex items-center justify-center">
                  Explore Features
                </a>
              </div>
              <span className="flex items-center gap-2 text-sm text-[var(--ink-faint)] font-medium">
                <LockKey size={16} /> End-to-end encrypted · works offline · no ads
              </span>
            </Reveal>
            
            <Reveal className="flex-1 w-full" delay={0.15}>
              <motion.div className="relative glow-halo rounded-[40px] p-2" animate={{ y: [0, -12, 0] }} transition={floatTransition}>
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/20 to-[var(--secondary-fixed)]/20 rounded-[40px] blur-3xl -z-10"></div>
                <BrowserFrame src="/store-assets/shots/today.png" alt="Throughline Today view showing the daily task list and progress rolled up into goals" className="rounded-[32px] overflow-hidden shadow-2xl border-white/40 dark:border-white/10 border-2" />
              </motion.div>
            </Reveal>
          </section>

          {/* Steps / How it works */}
          <section id="how" className="mb-48 relative">
            <Reveal className="text-center mb-24 max-w-2xl mx-auto">
              <span className="text-[var(--primary)] font-semibold tracking-widest text-xs uppercase mb-3 block">How it works</span>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[var(--ink)]">From a vague goal to a clear next step.</h2>
            </Reveal>

            {/* Energy Filaments Background */}
            <div className="absolute inset-0 z-0 hidden lg:block pointer-events-none group opacity-60 top-32">
              <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
                <path className="animate-[pulse_4s_ease-in-out_infinite] transition-colors duration-1000" d="M 100 150 C 200 350, 450 150, 500 400 C 550 650, 800 450, 900 650" stroke="url(#thread-line)" strokeDasharray="15 15" strokeLinecap="round" strokeWidth="2"></path>
                <defs>
                  <linearGradient id="thread-line" x1="100" y1="150" x2="900" y2="650" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--primary)" stopOpacity="0.4"></stop>
                    <stop offset="0.5" stopColor="var(--secondary-fixed)" stopOpacity="0.6"></stop>
                    <stop offset="1" stopColor="var(--primary-fixed-dim)" stopOpacity="0.4"></stop>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 relative z-10 group px-4">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.15} className={`w-full max-w-sm ${index === 1 ? 'lg:mt-24 scale-105 z-20' : 'lg:mt-8 z-10 opacity-90'}`}>
                  <div className={`glass-panel ${index === 1 ? 'glass-heavy rounded-liquid-2 p-12 hover:scale-[1.05]' : 'glass-light rounded-liquid-1 p-10 hover:scale-[1.03]'} depth-hover relative overflow-hidden transition-all duration-500`}>
                    {index === 1 && <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-[var(--secondary)]/10 to-transparent z-0 pointer-events-none"></div>}
                    
                    <span className="absolute top-8 right-10 text-6xl font-bold text-[var(--ink-faint)] opacity-20 pointer-events-none select-none">0{index + 1}</span>
                    
                    <div className={`w-16 h-16 rounded-[20px_10px_20px_10px] flex items-center justify-center mb-8 relative z-10 shadow-lg border ${
                      index === 0 ? 'bg-[var(--primary)]/10 border-[var(--primary)]/20 text-[var(--primary)]' : 
                      index === 1 ? 'bg-white/80 dark:bg-white/10 backdrop-blur-xl border-white/60 dark:border-white/20 text-[var(--primary)] shadow-[0_0_30px_rgba(44,42,188,0.2)]' : 
                      'bg-[var(--secondary)]/10 border-[var(--secondary)]/20 text-[var(--secondary)]'
                    }`}>
                      {step.icon}
                    </div>
                    <h3 className="text-2xl font-medium text-[var(--ink)] mb-4 relative z-10 tracking-tight">{step.title}</h3>
                    <p className="text-[var(--ink-muted)] text-lg leading-relaxed relative z-10">{step.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Views Showcase */}
          <section id="views" className="mb-48 relative">
            <Reveal className="text-center mb-28 max-w-2xl mx-auto">
              <span className="text-[var(--primary)] font-semibold tracking-widest text-xs uppercase mb-3 block">The App</span>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[var(--ink)]">One plan, a few calm views.</h2>
            </Reveal>

            <div className="flex flex-col gap-36">
              {SHOWCASE.map((item, index) => (
                <div key={item.title} className={`flex flex-col ${index % 2 ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-16`}>
                  <Reveal className="flex-1 max-w-xl">
                    <span className="text-[var(--secondary)] font-semibold uppercase tracking-widest text-xs mb-4 block opacity-80">{item.eyebrow}</span>
                    <h3 className="text-3xl md:text-4xl font-medium mb-6 text-[var(--ink)] tracking-tight">{item.title}</h3>
                    <p className="text-xl text-[var(--ink-muted)] leading-relaxed font-light">{item.body}</p>
                  </Reveal>
                  
                  <Reveal className="flex-[1.5] w-full" delay={0.15}>
                    <div className={`glass-panel p-4 md:p-10 ${index % 2 ? 'rounded-liquid-1' : 'rounded-liquid-3'} depth-hover border-2 border-white/40 dark:border-white/10`}>
                      <BrowserFrame src={item.img} alt={item.alt} className="rounded-[24px] shadow-2xl dark:shadow-none overflow-hidden" />
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>
          </section>

          {/* Technical Panel / Privacy */}
          <section id="privacy" className="mb-40 pl-0 md:pl-10">
            <Reveal>
              <div className="glass-panel glass-heavy rounded-liquid-3 p-12 md:p-20 flex flex-col md:flex-row gap-16 items-center relative overflow-hidden w-full depth-hover border-2 border-white/50 dark:border-white/10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[var(--primary-container)]/30 rounded-full blur-[120px] mix-blend-multiply pointer-events-none"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] bg-[var(--secondary-fixed)]/30 rounded-full blur-[100px] mix-blend-multiply pointer-events-none"></div>
                
                <div className="flex-1 z-10 md:pr-10">
                  <div className="w-20 h-20 rounded-[30px_15px_30px_15px] bg-[var(--primary)]/10 flex items-center justify-center mb-8 border border-[var(--primary)]/20 text-[var(--primary)] shadow-[0_0_30px_rgba(44,42,188,0.2)]">
                    <LockKey size={36} weight="duotone" />
                  </div>
                  <h2 className="text-4xl font-light tracking-tight text-[var(--ink)] mb-6">Private by design.</h2>
                  <p className="text-xl text-[var(--ink-muted)] mb-10 leading-relaxed font-light">
                    Your goals, tasks, and notes are encrypted on your device with a key only you hold. Throughline's server stores nothing it can read. True data portability via clean JSON.
                  </p>
                  
                  <div className="flex flex-wrap gap-4">
                    <span className="px-6 py-3 rounded-[25px_10px_25px_10px] border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-sm text-[var(--ink)] font-medium text-sm flex items-center gap-2 shadow-sm hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-default">
                      <LockKey size={18} /> E2E Encrypted
                    </span>
                    <span className="px-6 py-3 rounded-[10px_25px_10px_25px] border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-sm text-[var(--ink)] font-medium text-sm flex items-center gap-2 shadow-sm hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-default">
                      <WifiSlash size={18} /> Fully Offline
                    </span>
                    <span className="px-6 py-3 rounded-[25px_10px_25px_10px] border border-white/40 dark:border-white/10 bg-white/50 dark:bg-black/30 backdrop-blur-sm text-[var(--ink)] font-medium text-sm flex items-center gap-2 shadow-sm hover:bg-white/70 dark:hover:bg-white/10 transition-colors cursor-default">
                      <CloudCheck size={18} /> Cross-device Sync
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 w-full z-10 relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary)]/10 to-transparent blur-3xl -z-10 rounded-full"></div>
                  <div className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-liquid-2 p-10 font-mono text-sm text-[var(--ink)] shadow-xl overflow-x-auto relative min-h-[250px] flex flex-col justify-center">
                    <div className="absolute top-6 left-8 flex gap-2.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--error)] opacity-80"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--secondary-fixed-dim)] opacity-80"></div>
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--primary-fixed-dim)] opacity-80"></div>
                    </div>
                    <pre className="mt-8 text-[var(--ink-muted)] text-[15px] leading-relaxed"><code>{`{
  "user": "scholar_01",
  "workspace": "Thesis_Drafting",
  "flow_state": "active",
  "data_locality": "100%",
  "sync": {
    "provider": "e2e_encrypted",
    "status": "isolated"
  }
}`}</code></pre>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* Features Grid */}
          <section className="mb-40">
            <Reveal className="text-center mb-20 max-w-2xl mx-auto">
              <span className="text-[var(--primary)] font-semibold tracking-widest text-xs uppercase mb-3 block">Everything in one place</span>
              <h2 className="text-4xl md:text-5xl font-light tracking-tight text-[var(--ink)]">Calm, but it does the work.</h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.1} className="h-full">
                  <article className="glass-panel p-8 rounded-[30px] depth-hover h-full flex flex-col items-start gap-5 border border-white/30 dark:border-white/5 bg-gradient-to-b from-white/40 to-white/10 dark:from-white/5 dark:to-transparent">
                    <span className="w-12 h-12 rounded-[16px] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center border border-[var(--primary)]/20 shadow-sm">
                      {feature.icon}
                    </span>
                    <h3 className="text-xl font-medium text-[var(--ink)] tracking-tight">{feature.title}</h3>
                    <p className="text-[var(--ink-muted)] text-[15px] leading-relaxed font-light">{feature.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="mb-40">
            <Reveal className="text-center mb-20 max-w-2xl mx-auto">
              <span className="text-[var(--primary)] font-semibold tracking-widest text-xs uppercase mb-3 block">Questions</span>
              <h2 className="text-4xl font-light tracking-tight text-[var(--ink)]">Good to know.</h2>
            </Reveal>
            <div className="max-w-3xl mx-auto flex flex-col gap-5">
              {FAQ.map((item, index) => (
                <Reveal key={item.q} delay={index * 0.05}>
                  <details className="glass-panel rounded-[24px] group depth-hover overflow-hidden [&_summary::-webkit-details-marker]:hidden border border-white/30 dark:border-white/10">
                    <summary className="flex items-center justify-between p-7 cursor-pointer font-medium text-lg text-[var(--ink)] list-none hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
                      {item.q}
                      <span className="text-2xl text-[var(--ink-faint)] group-open:rotate-45 transition-transform duration-300 transform origin-center flex items-center justify-center w-8 h-8 rounded-full bg-white/30 dark:bg-white/5">+</span>
                    </summary>
                    <p className="px-7 pb-8 text-[var(--ink-muted)] text-[16px] leading-relaxed border-t border-white/20 dark:border-white/5 pt-5 mt-1 bg-white/10 dark:bg-transparent">{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="text-center py-24 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/5 to-transparent blur-3xl -z-10 pointer-events-none"></div>
            <Reveal>
              <h2 className="text-5xl md:text-6xl font-light tracking-tight mb-6 text-[var(--ink)]">Start with one goal.</h2>
              <p className="text-2xl text-[var(--ink-muted)] mb-12 font-light">Add the first step today — Throughline keeps the rest calm.</p>
              <Link className="btn-primary inline-flex items-center gap-3 px-10 py-5 rounded-[40px_15px_40px_15px] font-medium text-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 depth-hover glow-halo mx-auto" to="/signup">
                Get started <ArrowRight size={24} weight="bold" />
              </Link>
            </Reveal>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-12 px-12 py-12 bg-white/30 dark:bg-black/30 backdrop-blur-[80px] rounded-[40px_15px_40px_15px] mb-8 mx-auto w-[90%] max-w-[1440px] border border-white/30 dark:border-white/10 shadow-sm">
          <div className="flex flex-col gap-4">
            <a href="#top" className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto hidden dark:block" style={{ filter: 'brightness(0) invert(1)' }} />
              <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto block dark:hidden" />
            </a>
            <span className="text-sm font-medium text-[var(--ink-faint)]">© {new Date().getFullYear()} Throughline. Engineered for Flow.</span>
          </div>
          
          <div className="flex flex-wrap gap-16 text-sm font-medium">
            <div className="flex flex-col gap-4">
              <span className="text-[var(--ink)] opacity-40 uppercase tracking-widest text-xs font-semibold">Product</span>
              <a className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" href="#how">How it works</a>
              <a className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" href="#views">The app</a>
              <Link className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" to="/privacy">Privacy</Link>
              <Link className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" to="/terms">Terms</Link>
              <a className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" href="#faq">FAQ</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[var(--ink)] opacity-40 uppercase tracking-widest text-xs font-semibold">Account</span>
              <Link className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" to="/login">Log in</Link>
              <Link className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" to="/signup">Get started</Link>
              <Link className="text-[var(--ink-muted)] hover:text-[var(--primary)] transition-all active:scale-[0.98] text-[15px]" to="/app">Open the app</Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
