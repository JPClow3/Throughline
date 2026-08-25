import { Link } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { Mark } from "../ui";

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing">
      <header className="landing-nav" aria-label="Main navigation">
        <Link to="/" className="landing-brand" aria-label="Throughline home">
          <span className="shell-brand-mark" aria-hidden="true">
            <Mark size={18} />
          </span>
          Throughline
        </Link>
        <nav className="landing-nav-links" aria-label="Sections">
          <Link to="/#features">Features</Link>
          <Link to="/#views">The app</Link>
          <Link to="/#faq">FAQ</Link>
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

      <main id="top" className="prose-page">
        <Link to="/" className="back-home-link">
          <ArrowLeft size={15} weight="bold" />
          Back to Home
        </Link>

        <h1 style={{ fontSize: "var(--text-display)", lineHeight: 1.1 }}>{title}</h1>

        <article className="ik-card prose-card">{children}</article>
      </main>
    </div>
  );
}

export function PrivacyPolicy() {
  return (
    <LegalShell title="Privacy Policy">
      <section>
        <h2>Local-First</h2>
        <p>
          Throughline is built on a local-first architecture. This means your data (goals, tasks, notes) is stored
          primarily on your own device within your browser's local database. Core planner workflows continue to work
          offline.
        </p>
      </section>

      <section>
        <h2>Optional Encrypted Sync</h2>
        <p>
          When you create an account, an encryption key is generated on your device. Planner records are encrypted
          locally before they ever leave your device for sync. Our servers store and transmit ciphertext only; we do
          not have the keys and cannot read, mine, or access your tasks, notes, goals, project details, tags, or
          subtasks.
        </p>
      </section>

      <section>
        <h2>Recovery Keys</h2>
        <p>
          Your recovery key is required to reset a forgotten password and unlock encrypted synced records. If both
          your password and recovery key are lost, Throughline cannot recover your encrypted task content because the
          server cannot decrypt it.
        </p>
      </section>

      <section>
        <h2>Analytics and Tracking</h2>
        <p>
          We do not use invasive third-party analytics or tracking cookies. We do not sell any data to third parties
          or advertisers.
        </p>
      </section>
    </LegalShell>
  );
}

export function TermsOfService() {
  return (
    <LegalShell title="Terms of Service">
      <section>
        <h2>Beta Software</h2>
        <p>
          Throughline is currently provided as beta software. While we strive to ensure local data, encrypted sync,
          and exports are reliable, we cannot be held responsible for unintentional data loss. The app is local-first
          by default; optional account sync stores end-to-end encrypted records that our server cannot read. If you
          lose both your password and recovery key, encrypted synced content cannot be recovered.
        </p>
      </section>

      <section>
        <h2>Acceptable Use</h2>
        <p>
          You agree not to use the service in any way that violates applicable laws or causes harm to the
          infrastructure of Throughline. We reserve the right to terminate accounts that abuse the syncing
          infrastructure.
        </p>
      </section>

      <section>
        <h2>Modifications to Service</h2>
        <p>
          We reserve the right to modify or discontinue the service at any time. We will always endeavor to give
          sufficient notice and provide export mechanisms for your data before any significant disruption to service.
        </p>
      </section>
    </LegalShell>
  );
}
