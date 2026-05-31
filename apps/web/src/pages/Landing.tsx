import {
  ArrowRight,
  CalendarDots,
  Kanban,
  LockKey,
  Note as NoteIcon,
  Target
} from "@phosphor-icons/react";
import { Link } from "react-router-dom";

function ThroughlineMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 17 L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="5" cy="17" r="2.4" fill="currentColor" />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
      <circle cx="19" cy="7" r="3" fill="currentColor" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: <Target size={20} />,
    title: "Goals hold the work",
    body: "Set an end goal, break it into ordered steps, and watch progress roll up on its own."
  },
  {
    icon: <NoteIcon size={20} />,
    title: "Notes, cross-linked",
    body: "One calm notebook. Link a note to any task or goal and jump straight back to it."
  },
  {
    icon: <Kanban size={20} />,
    title: "Board & timeline",
    body: "See the same work as a Kanban board or an hourly day agenda — filter by project."
  },
  {
    icon: <CalendarDots size={20} />,
    title: "Yours, everywhere",
    body: "Works fully offline as an installable app, and syncs across your devices when you're online."
  }
];

export function Landing() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <span className="landing-brand">
          <span className="landing-brand-mark">
            <ThroughlineMark size={20} />
          </span>
          Throughline
        </span>
        <nav className="landing-nav-actions">
          <Link className="landing-link" to="/app">
            Log in
          </Link>
          <Link className="primary-button" to="/app">
            Get started
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
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
            <Link className="primary-button" to="/app">
              Get started <ArrowRight size={17} />
            </Link>
            <Link className="secondary-button" to="/app">
              Open the app
            </Link>
          </div>
          <span className="landing-trust">
            <LockKey size={14} /> End-to-end encrypted · works offline · no ads, ever
          </span>
        </section>

        <section className="landing-preview" aria-hidden="true">
          <div className="landing-preview-card glass-panel">
            <span className="eyebrow">Today</span>
            <h2 className="landing-preview-title">2 of 8 done</h2>
            <div className="landing-preview-bar">
              <span style={{ width: "25%" }} />
            </div>
            <div className="landing-preview-rows">
              <div className="landing-preview-row">
                <span className="landing-dot" style={{ background: "#6be4ff" }} />
                Wire up the landing page
              </div>
              <div className="landing-preview-row">
                <span className="landing-dot" style={{ background: "#ff9e7a" }} />
                Plan the week's meals
              </div>
              <div className="landing-preview-row is-muted">
                <span className="landing-dot" style={{ background: "#b59cff" }} />
                Three easy runs this week
              </div>
            </div>
          </div>
        </section>
      </main>

      <section className="landing-features">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="landing-feature glass-panel">
            <span className="landing-feature-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="landing-final">
        <h2>Start with one goal.</h2>
        <p>Add the first step today — Throughline keeps the rest calm.</p>
        <Link className="primary-button" to="/app">
          Get started <ArrowRight size={17} />
        </Link>
      </section>

      <footer className="landing-footer">
        <span className="landing-brand">
          <ThroughlineMark size={16} /> Throughline
        </span>
        <span>A calm place to plan.</span>
      </footer>
    </div>
  );
}
