import { ArrowRight, CalendarDots, Database, Kanban, LockKey, Note, ShieldCheck } from "@phosphor-icons/react";
import { MotionConfig, motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Mark } from "../ui";

function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.9, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  {
    icon: (
      <span className="feature-icon" style={{ background: "var(--yellow)" }}>
        <ShieldCheck size={22} weight="bold" />
      </span>
    ),
    title: "Local-first privacy",
    body: "Your planner lives on your device in IndexedDB. Optional sync is end-to-end encrypted — records only ever leave as ciphertext the server can't read."
  },
  {
    icon: (
      <span className="feature-icon" style={{ background: "var(--green-soft)" }}>
        <Kanban size={22} weight="bold" />
      </span>
    ),
    title: "Course & task planning",
    body: "Group coursework into projects, break goals into steps, and move work across a Backlog → Done board that keeps up with you."
  },
  {
    icon: (
      <span className="feature-icon" style={{ background: "var(--blue-soft)" }}>
        <CalendarDots size={22} weight="bold" />
      </span>
    ),
    title: "Deadlines without dread",
    body: "A time-of-day agenda shows today's pressure honestly, exports clean .ics files for your calendar, and reminds you before things slip."
  }
];

const SHOWCASE = [
  {
    eyebrow: "Board",
    title: "See the whole workload",
    body: "A bold five-column Kanban board. Drag tasks between Backlog, Ready, Doing, Blocked, and Done — or move them by keyboard.",
    img: "/store-assets/shots/board.png",
    alt: "Throughline Kanban board"
  },
  {
    eyebrow: "Timeline",
    title: "Pace your day",
    body: "One day at a time, laid out hour by hour. Schedule study blocks without the overwhelm of a stuffed calendar.",
    img: "/store-assets/shots/timeline.png",
    alt: "Throughline timeline agenda"
  },
  {
    eyebrow: "Notes",
    title: "Everything connected",
    body: "A markdown notebook that cross-links to tasks and goals, so lecture notes stay one click away from the work they support.",
    img: "/store-assets/shots/notes.png",
    alt: "Throughline markdown notes"
  }
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
      <div className="landing">
        <header className="landing-nav">
          <Link className="landing-brand" to="/" aria-label="Throughline home">
            <span className="shell-brand-mark" aria-hidden="true">
              <Mark size={18} />
            </span>
            Throughline
          </Link>
          <nav className="landing-nav-links" aria-label="Sections">
            <a href="#features">Features</a>
            <a href="#views">The app</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="landing-nav-actions">
            <Link className="landing-link" to="/login">
              Log in
            </Link>
            <Link to="/signup" className="btn btn-accent btn-sm">
              Get started
            </Link>
          </div>
        </header>

        <main id="top" className="landing-main">
          <section className="landing-hero">
            <Reveal>
              <div className="landing-hero-badge-row">
                <span className="chip-static">
                  <LockKey size={12} weight="bold" /> Local-first
                </span>
                <span className="chip-static">
                  <ShieldCheck size={12} weight="bold" /> End-to-end encrypted sync
                </span>
                <span className="chip-static">
                  <Note size={12} weight="bold" /> Installable PWA
                </span>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <h1>
                School work,
                <br />
                <span className="landing-hero-accent">handled.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="landing-hero-sub">
                A local-first student planner for courses, tasks, notes, due dates, and calm academic momentum —
                without giving up privacy.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="landing-hero-actions">
                <Link to="/signup" className="btn btn-primary" style={{ minHeight: 50, paddingInline: "1.6rem", fontSize: "1rem" }}>
                  Start planning free <ArrowRight size={18} weight="bold" />
                </Link>
                <a href="#views" className="btn" style={{ minHeight: 50, paddingInline: "1.6rem", fontSize: "1rem" }}>
                  Explore features
                </a>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <div className="landing-hero-mock ik-card" aria-hidden="true">
                <div className="landing-hero-mock-head">
                  <span className="chip-static" style={{ background: "var(--green-soft)" }}>
                    Today · 1 of 3 done
                  </span>
                  <span className="chip-static">Due today</span>
                </div>
                <div className="landing-hero-mock-row">
                  <span className="project-dot" style={{ "--project-color": "var(--green)" } as CSSProperties} />
                  <span className="landing-hero-mock-title landing-hero-mock-done">Read chapter 4</span>
                  <span className="chip-static" style={{ background: "var(--green-soft)" }}>Done</span>
                </div>
                <div className="landing-hero-mock-row">
                  <span className="project-dot" style={{ "--project-color": "var(--blue)" } as CSSProperties} />
                  <span className="landing-hero-mock-title">Biology lab report</span>
                  <span className="chip-static" style={{ background: "var(--yellow-soft)" }}>Today · 18:00</span>
                </div>
                <div className="landing-hero-mock-row">
                  <span className="project-dot" style={{ "--project-color": "var(--red)" } as CSSProperties} />
                  <span className="landing-hero-mock-title">Email professor</span>
                  <span className="chip-static" style={{ background: "var(--red-soft)" }}>Overdue</span>
                </div>
              </div>
            </Reveal>
          </section>

          <section id="features" className="landing-section">
            <Reveal>
              <div className="landing-section-head">
                <span className="eyebrow">Why Throughline</span>
                <h2>One plan. Every deadline.</h2>
              </div>
            </Reveal>
            <div className="feature-grid">
              {FEATURES.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 0.06}>
                  <article className="ik-card feature-card">
                    {feature.icon}
                    <h3>{feature.title}</h3>
                    <p>{feature.body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </section>

          <section id="views" className="landing-section">
            <Reveal>
              <div className="landing-section-head">
                <span className="eyebrow">The app</span>
                <h2>One plan, a few strong views.</h2>
              </div>
            </Reveal>
            <div className="flex flex-col gap-16">
              {SHOWCASE.map((item, index) => (
                <div key={item.title} className={`showcase-row${index % 2 ? " is-reversed" : ""}`}>
                  <Reveal>
                    <div className="showcase-text">
                      <span className="eyebrow">{item.eyebrow}</span>
                      <h3>{item.title}</h3>
                      <p>{item.body}</p>
                    </div>
                  </Reveal>
                  <Reveal delay={0.08}>
                    <div className="ik-card showcase-shot">
                      <div className="browser-bar" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <img src={item.img} alt={item.alt} loading="lazy" width={2480} height={1600} />
                    </div>
                  </Reveal>
                </div>
              ))}
            </div>
          </section>

          <section>
            <Reveal>
              <div className="ik-card portability-panel">
                <div>
                  <span className="eyebrow">Data portability</span>
                  <h2>Your notes belong to you</h2>
                  <p>
                    Import and export everything as clean JSON. The local-first IndexedDB core means fast, offline
                    performance — no central server sniffing your research.
                  </p>
                  <div className="code-chip-row">
                    <span className="chip-static">
                      <Database size={14} weight="bold" style={{ color: "var(--blue)" }} /> JSON export
                    </span>
                    <span className="chip-static">
                      <Database size={14} weight="bold" style={{ color: "var(--violet)" }} /> IndexedDB
                    </span>
                    <span className="chip-static">
                      <Database size={14} weight="bold" style={{ color: "var(--green)" }} /> .ics calendar export
                    </span>
                  </div>
                </div>
                <div className="json-window">
                  <pre>
                    <code>{`{
  "user": "scholar_01",
  "workspace": "Thesis_Drafting",
  "flow_state": "active",
  "data_locality": "100%",
  "sync": {
    "provider": "optional-e2ee",
    "status": "ciphertext-only"
  }
}`}</code>
                  </pre>
                </div>
              </div>
            </Reveal>
          </section>

          <section id="faq" className="landing-section">
            <Reveal>
              <div className="landing-section-head">
                <span className="eyebrow">Questions</span>
                <h2>Good to know.</h2>
              </div>
            </Reveal>
            <div className="faq-list">
              {FAQ.map((item) => (
                <Reveal key={item.q}>
                  <details className="ik-card faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </section>

          <section className="ik-card landing-final">
            <h2>Start with one goal.</h2>
            <p>Add the first step today — Throughline keeps the rest calm.</p>
            <Link to="/signup" className="btn btn-accent" style={{ minHeight: 50, paddingInline: "1.6rem", fontSize: "1rem" }}>
              Get started <ArrowRight size={17} weight="bold" />
            </Link>
          </section>
        </main>

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <span>© 2026 Throughline. Plan the line.</span>
            <nav className="landing-footer-links" aria-label="Legal">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Terms</Link>
              <a href="/#faq">FAQ</a>
            </nav>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

