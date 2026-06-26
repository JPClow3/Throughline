import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

export function PrivacyPolicy() {
  return (
    <div className="landing-layout">
      <header className="landing-nav">
        <Link to="/" className="brand-mark">
          T/L
        </Link>
      </header>

      <main className="landing-main" style={{ padding: "4rem 1.5rem", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--ink-muted)", textDecoration: "none" }}>
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

        <h1 style={{ fontSize: "var(--text-display-lg)", marginBottom: "2rem" }}>Privacy Policy</h1>
        
        <div className="surface" style={{ padding: "2rem", display: "grid", gap: "1.5rem", fontSize: "1.05rem", lineHeight: "1.6" }}>
          <section>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Local-First By Design</h2>
            <p>
              Throughline is built with a local-first philosophy. This means that all of your task data, project maps, and personal goals stay right where they belong: on your device. We use IndexedDB to store your data securely within your browser or installed app.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Push Notifications</h2>
            <p>
              If you opt-in to push notifications, we only send the absolute minimum data required to trigger the alert. <strong>Push payloads are fully redacted.</strong> They only contain non-identifiable identifiers and generic urgency flags. Your task titles and descriptions never touch our notification servers.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Zero Tracking or Analytics</h2>
            <p>
              We don't want to know how you use the app. There are no third-party trackers, no analytics scripts, and no behavioral monitoring. Your workflows and study habits are strictly your business.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>Future Cloud Sync</h2>
            <p>
              When we launch multi-device synchronization, it will be built with End-to-End (E2E) encryption. Our servers will only handle encrypted blobs, creating a zero-knowledge environment where nobody—not even us—can read your data.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
