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

function ThroughlineMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17 L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="5" cy="17" r="2.4" fill="currentColor" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <circle cx="19" cy="7" r="3" fill="currentColor" />
    </svg>
  );
}

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
      <img src={src} alt={alt} loading="lazy" />
    </div>
  );
}

const STEPS = [
  { icon: <Target size={20} />, title: "Set an end goal", body: "Name what you're working toward — “Launch my side project”, “Run a 10k”." },
  { icon: <Path size={20} />, title: "Break it into steps", body: "Add ordered tasks under the goal. Reorder them as the plan changes." },
  { icon: <Sparkle size={20} />, title: "Watch it roll up", body: "Finish steps and progress climbs on its own — on Today, the board, and the timeline." }
];

const SHOWCASE = [
  {
    eyebrow: "Board",
    title: "See the work move",
    body: "A calm Kanban board across Backlog → Done, with a project filter and quick search. Drag, or change status inline.",
    img: "/shots/board.png",
    alt: "Throughline board view"
  },
  {
    eyebrow: "Timeline",
    title: "Plan the day, gently",
    body: "An hourly agenda for any day in the next ten, so due work has a place to land without the pressure of a packed calendar.",
    img: "/shots/timeline.png",
    alt: "Throughline timeline view"
  },
  {
    eyebrow: "Notes",
    title: "Context, cross-linked",
    body: "One markdown notebook. Link a note to any task or goal and jump straight back to the work it belongs to.",
    img: "/shots/notes.png",
    alt: "Throughline notes view"
  }
];

const FEATURES = [
  { icon: <Target size={18} />, title: "Goals hold tasks", body: "Real child steps with derived roll-up progress." },
  { icon: <NoteIcon size={18} />, title: "Cross-linked notes", body: "A notebook that points back to your work." },
  { icon: <Kanban size={18} />, title: "Board & timeline", body: "The same plan, two calm views — filterable." },
  { icon: <CalendarDots size={18} />, title: "ICS export", body: "Send due dates to your calendar of choice." }
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
        <header className="landing-nav">
          <a className="landing-brand" href="#top">
            <span className="landing-brand-mark">
              <ThroughlineMark size={20} />
            </span>
            Throughline
          </a>
          <nav className="landing-nav-links" aria-label="Sections">
            <a href="#how">How it works</a>
            <a href="#views">The app</a>
            <a href="#privacy">Privacy</a>
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
              <h1>
                Goals that quietly
                <br />
                pull the work forward.
              </h1>
              <p className="landing-lede">
                Throughline is a calm, private planner where end goals hold real tasks — with a
                cross-linked notebook, a board, and a timeline. Local-first and end-to-end encrypted.
              </p>
              <div className="landing-cta-row">
                <Link className="primary-button" to="/signup">
                  Get started <ArrowRight size={17} />
                </Link>
                <Link className="secondary-button" to="/app">
                  Open the app
                </Link>
              </div>
              <span className="landing-trust">
                <LockKey size={14} /> End-to-end encrypted · works offline · no ads, ever
              </span>
            </Reveal>
            <Reveal className="landing-hero-shot" delay={0.12}>
              <BrowserFrame src="/shots/today.png" alt="Throughline Today view" />
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
                  <article className="landing-step glass-panel">
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
                <Reveal key={item.title}>
                  <div className={`landing-showcase-row${index % 2 ? " is-reversed" : ""}`}>
                    <div className="landing-showcase-text">
                      <span className="eyebrow">{item.eyebrow}</span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                    <BrowserFrame className="landing-showcase-shot" src={item.img} alt={item.alt} />
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="privacy" className="landing-privacy">
            <Reveal>
              <div className="landing-privacy-card glass-panel">
                <span className="landing-feature-icon">
                  <LockKey size={22} />
                </span>
                <h2>Private by design.</h2>
                <p>
                  Your goals, tasks, and notes are encrypted on your device with a key only you hold.
                  Throughline's server stores nothing it can read.
                </p>
                <div className="landing-privacy-points">
                  <span>
                    <LockKey size={16} /> End-to-end encrypted
                  </span>
                  <span>
                    <WifiSlash size={16} /> Works fully offline
                  </span>
                  <span>
                    <CloudCheck size={16} /> Syncs across your devices
                  </span>
                  <span>
                    <DeviceMobile size={16} /> Installs as an app
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
                  <article className="landing-feature glass-panel">
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
                  <details className="landing-faq-item glass-panel">
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
              <Link className="primary-button" to="/signup">
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
              <h4>Product</h4>
              <a href="#how">How it works</a>
              <a href="#views">The app</a>
              <a href="#privacy">Privacy</a>
              <a href="#faq">FAQ</a>
            </div>
            <div>
              <h4>Account</h4>
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
