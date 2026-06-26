import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";

export function Signup() {
  const { signup, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [partialKey, setPartialKey] = useState("");

  if (status === "authed" && !recoveryKey) {
    return <Navigate to="/app" replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const key = await signup(email, password);
      setRecoveryKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  if (recoveryKey) {
    const expectedPartial = recoveryKey.slice(-4);
    const canProceed = confirmedSaved && partialKey.toLowerCase() === expectedPartial.toLowerCase();

    return (
      <AuthShell title="Save your Recovery Key" subtitle="This is the only way to recover your account if you forget your password.">
        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "var(--radius-card)", textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontWeight: "var(--fw-bold)", fontSize: "1.2rem", letterSpacing: "2px", userSelect: "all", fontFamily: "monospace", color: "var(--primary)" }}>
            {recoveryKey}
          </p>
        </div>
        <p className="auth-note" style={{ marginBottom: "2rem" }}>
          Please save this key in a secure location, like a password manager. 
          We cannot recover it for you.
        </p>

        <div style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem" }}>
            <input 
              type="checkbox" 
              checked={confirmedSaved} 
              onChange={(e) => setConfirmedSaved(e.target.checked)} 
              style={{ width: "1rem", height: "1rem" }}
            />
            I have saved this recovery key securely
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.9rem" }}>
            <span>To confirm, please enter the last 4 characters of your key:</span>
            <input
              type="text"
              value={partialKey}
              onChange={(e) => setPartialKey(e.target.value)}
              placeholder={expectedPartial}
              maxLength={4}
              style={{ fontFamily: "monospace", textTransform: "lowercase", width: "6rem", textAlign: "center" }}
            />
          </label>
        </div>

        <button className="primary-button" disabled={!canProceed} onClick={() => navigate("/app")}>
          Continue to Planner
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Your data is end-to-end encrypted before it ever syncs.">
      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          <span>Confirm password</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error ? <p className="auth-error">{error}</p> : null}
        <p className="auth-note">
          Your password encrypts your data — we can't reset it or recover your notes if it's lost.
        </p>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
