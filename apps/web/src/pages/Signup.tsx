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
        <button className="primary-button" onClick={() => navigate("/app")}>
          I have saved my key
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
