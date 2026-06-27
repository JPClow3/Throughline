import {
  ArrowRight,
  CalendarDots,
  CloudCheck,
  DeviceMobile,
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
import { ThroughlineMark } from "../components/ThroughlineMark";

// Removed AnimatedMark in favor of static brand asset

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
  { icon: <Target size={20} color="var(--tl-accent-blue)" />, title: "Define the finish line", body: "Set a clear goal. Something real and meaningful." },
  { icon: <Path size={20} color="var(--tl-accent-violet)" />, title: "Map the path", body: "Break your goal down into actionable, bite-sized tasks." },
  { icon: <Sparkle size={20} color="var(--tl-accent-aqua)" />, title: "Make progress", body: "Check things off and watch your progress climb instantly." }
];

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

const FEATURES = [
  { icon: <Target size={18} color="var(--tl-accent-blue)" />, title: "Goals into Tasks", body: "Tasks live under goals, rolling up real progress automatically." },
  { icon: <NoteIcon size={18} color="var(--tl-accent-aqua)" />, title: "Smart Notebook", body: "Rich markdown notes linked directly to your workflows." },
  { icon: <Kanban size={18} color="var(--tl-accent-violet)" />, title: "Board & Timeline", body: "Two seamless views for your tasks, instantly synced." },
  { icon: <CalendarDots size={18} color="var(--tl-accent-pink)" />, title: "Universal Sync", body: "Export your schedule to any calendar you already use." }
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
      <div className="landing">
        <div className="landing-ambient-bg" />
        <header className="landing-nav">
          <a className="landing-brand" href="#top">
            <img src="/brand/svg/throughline-icon-liquid-glass.svg" alt="" width="24" height="24" style={{ borderRadius: '6px' }} />
            <span className="text-shimmer" style={{ marginLeft: '8px', paddingRight: '4px' }}>Throughline</span>
          </a>
          <nav className="landing-nav-links" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#views">The app</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            <Link className="landing-link" to="/login">
              Log in
            </Link>
            <Link className="primary-button" to="/signup">
              Get started
            </Link>
          </div>
        </header>

        <main id="top" className="landing-main">
          <section className="landing-hero">
            <Reveal className="landing-hero-copy">
              <span className="eyebrow">A calm place to plan</span>
              <h1 className="text-shimmer" style={{ fontSize: "clamp(3rem, 10vw, 5rem)", letterSpacing: "-0.04em", lineHeight: 1.1, paddingBottom: "0.2em", marginBottom: "0.2em" }}>
                Throughline
              </h1>
              <p className="landing-lede">
                The smart planner that quietly pulls the work forward. 
                A beautiful, private space where goals naturally turn into action.
              </p>
              <div className="landing-cta-row">
                <Link className="primary-button depth-hover glow-halo" to="/signup">
                  Get started <ArrowRight size={17} />
                </Link>
                <Link className="secondary-button" to="/app">
                  Open the app
                </Link>
              </div>
              <span className="landing-trust">
                <LockKey size={14} color="var(--tl-accent-aqua)" /> End-to-end encrypted · works offline · no ads, ever
              </span>
            </Reveal>
            <Reveal className="landing-hero-shot" delay={0.12}>
              <motion.div className="landing-float" animate={{ y: [0, -10, 0] }} transition={floatTransition}>
                <BrowserFrame src="/store-assets/shots/today.png" alt="Throughline Today view showing the daily task list and progress rolled up into goals" />
              </motion.div>
            </Reveal>
          </section>

          <section id="how" className="landing-section">
            <Reveal className="landing-section-head">
              <span className="eyebrow">How it works</span>
              <h2>From a vague goal to a clear next step.</h2>
            </Reveal>
            <div className="landing-steps">
              {STEPS.map((step, index) => (
                <Reveal key={step.title} delay={index * 0.08}>
                  <article className="landing-step glass-panel depth-hover">
                    <span className="landing-step-no">{index + 1}</span>
                    <span className="landing-feature-icon">{step.icon}</span>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="views" className="landing-section">
            <Reveal className="landing-section-head">
              <span className="eyebrow">The app</span>
              <h2>One plan, a few calm views.</h2>
            </Reveal>
            <div className="landing-showcase">
              {SHOWCASE.map((item, index) => (
                <div key={item.title} className={`landing-showcase-row${index % 2 ? " is-reversed" : ""}`}>
                  <Reveal className="landing-showcase-text">
                    <span className="eyebrow">{item.eyebrow}</span>
                    <h3>{item.title}</h3>
                    <p>{item.body}</p>
                  </Reveal>
                  <motion.div
                    className="landing-showcase-shot"
                    initial={{ opacity: 0, x: index % 2 ? -44 : 44 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <BrowserFrame src={item.img} alt={item.alt} />
                  </motion.div>
                </div>
              ))}
            </div>
          </section>

          <section id="privacy" className="landing-privacy">
            <Reveal>
              <div className="landing-privacy-card glass-heavy depth-hover">
                <span className="landing-feature-icon" style={{ color: 'var(--tl-accent-aqua)' }}>
                  <LockKey size={22} />
                </span>
                <h2>Private by design.</h2>
                <p>
                  Your goals, tasks, and notes are encrypted on your device with a key only you hold.
                  Throughline's server stores nothing it can read.
                </p>
                <div className="landing-privacy-points">
                  <span>
                    <LockKey size={16} color="var(--tl-accent-aqua)" /> End-to-end encrypted
                  </span>
                  <span>
                    <WifiSlash size={16} color="var(--tl-accent-aqua)" /> Works fully offline
                  </span>
                  <span>
                    <CloudCheck size={16} color="var(--tl-accent-aqua)" /> Syncs across your devices
                  </span>
                  <span>
                    <DeviceMobile size={16} color="var(--tl-accent-aqua)" /> Installs as an app
                  </span>
                </div>
              </div>
            </Reveal>
          </section>

          <section className="landing-section">
            <Reveal className="landing-section-head">
              <span className="eyebrow">Everything in one place</span>
              <h2>Calm, but it does the work.</h2>
            </Reveal>
            <div className="landing-features">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.06}>
                  <article className="landing-feature glass-panel depth-hover">
                    <span className="landing-feature-icon">{feature.icon}</span>
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="faq" className="landing-section landing-faq">
            <Reveal className="landing-section-head">
              <span className="eyebrow">Questions</span>
              <h2>Good to know.</h2>
            </Reveal>
            <div className="landing-faq-list">
              {FAQ.map((item) => (
                <Reveal key={item.q}>
                  <details className="landing-faq-item glass-panel depth-hover">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="landing-final">
            <Reveal>
              <h2>Start with one goal.</h2>
              <p>Add the first step today — Throughline keeps the rest calm.</p>
              <Link className="primary-button depth-hover glow-halo" to="/signup">
                Get started <ArrowRight size={17} />
              </Link>
            </Reveal>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="landing-footer-brand">
            <span className="landing-brand">
              <ThroughlineMark size={16} /> Throughline
            </span>
            <span>A calm place to plan.</span>
          </div>
          <div className="landing-footer-cols">
            <div>
              <h2>Product</h2>
              <a href="#how">How it works</a>
              <a href="#views">The app</a>
              <Link to="/privacy">Privacidade</Link>
              <Link to="/terms">Termos</Link>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h2>Account</h2>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Get started</Link>
              <Link to="/app">Open the app</Link>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
