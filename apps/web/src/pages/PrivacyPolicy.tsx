import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function PrivacyPolicy() {
  return (
    <div className="landing-ambient-bg">
      <div className="ambient-mesh"></div>
      <div className="landing-content">
        <header className="landing-nav" aria-label="Main navigation">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto hidden dark:block" style={{ filter: 'brightness(0) invert(1)' }} />
            <img src="/brand/svg/throughline-lockup-horizontal.svg" alt="Throughline" className="h-6 w-auto block dark:hidden" />
          </Link>
          <nav className="landing-nav-links" aria-label="Sections">
            <Link to="/#how">How it works</Link>
            <Link to="/#views">The app</Link>
            <Link to="/#faq">FAQ</Link>
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

        <main id="top" className="landing-main" style={{ padding: "8rem 1.5rem", maxWidth: "800px", margin: "0 auto" }}>
          <div style={{ marginBottom: "2rem" }}>
            <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted)", textDecoration: "none" }}>
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>

          <h1 style={{ fontSize: "var(--text-display-lg)", marginBottom: "2rem" }}>Privacy Policy</h1>
          
          <div className="glass-panel" style={{ padding: "2.5rem", display: "grid", gap: "2rem", fontSize: "1.05rem", lineHeight: "1.6" }}>
            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "600" }}>Local-First</h2>
              <p style={{ color: "var(--ink-faint)" }}>
                Throughline is built on a local-first architecture. This means your data (goals, tasks, notes) 
                is stored primarily on your own device within your browser's local database.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "600" }}>End-to-End Encryption</h2>
              <p style={{ color: "var(--ink-faint)" }}>
                When you create an account, an encryption key is generated on your device. All your data is 
                encrypted locally before it ever leaves your device to be synced. Our servers only store and 
                transmit encrypted blobs of data. We do not have the keys, meaning we cannot read, mine, 
                or access your tasks or goals.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "600" }}>Analytics and Tracking</h2>
              <p style={{ color: "var(--ink-faint)" }}>
                We do not use invasive third-party analytics or tracking cookies. We do not sell any data 
                to third parties or advertisers.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
