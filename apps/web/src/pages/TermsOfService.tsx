import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function TermsOfService() {
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

          <h1 style={{ fontSize: "var(--text-display-lg)", marginBottom: "2rem" }}>Terms of Service</h1>
          
          <div className="glass-panel" style={{ padding: "2.5rem", display: "grid", gap: "2rem", fontSize: "1.05rem", lineHeight: "1.6" }}>
            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "600" }}>Beta Software</h2>
              <p style={{ color: "var(--ink-faint)" }}>
                Throughline is currently provided as beta software. While we strive to ensure 
                all data is safely synced and preserved, we cannot be held responsible for 
                unintentional data loss. The nature of local-first means that your device holds 
                the primary copy of your data; if you lose your encryption key, the data cannot be recovered.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "600" }}>Acceptable Use</h2>
              <p style={{ color: "var(--ink-faint)" }}>
                You agree not to use the service in any way that violates applicable laws or causes harm 
                to the infrastructure of Throughline. We reserve the right to terminate accounts that 
                abuse the syncing infrastructure.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: "1.4rem", marginBottom: "0.75rem", fontWeight: "600" }}>Modifications to Service</h2>
              <p style={{ color: "var(--ink-faint)" }}>
                We reserve the right to modify or discontinue the service at any time. We will always 
                endeavor to give sufficient notice and provide export mechanisms for your data before 
                any significant disruption to service.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
