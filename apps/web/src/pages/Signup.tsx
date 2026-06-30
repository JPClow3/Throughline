import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";

export function Signup() {
  const { signup, loginWithGoogle, rotateRecoveryKey, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [confirmedSaved, setConfirmedSaved] = useState(false);
  const [partialKey, setPartialKey] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);

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

    async function regenerateRecoveryKey() {
      setRecoveryBusy(true);
      setError("");
      try {
        const key = await rotateRecoveryKey();
        setRecoveryKey(key);
        setConfirmedSaved(false);
        setPartialKey("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not generate a new recovery key.");
      } finally {
        setRecoveryBusy(false);
      }
    }

    return (
      <AuthShell title="Save your recovery key" subtitle="Your records are end-to-end encrypted. This key is required if you lose your password.">
        <div className="glass-panel" style={{ padding: "2rem", borderRadius: "var(--radius-card)", textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontWeight: "var(--fw-bold)", fontSize: "1.2rem", letterSpacing: "2px", userSelect: "all", fontFamily: "monospace", color: "var(--primary)" }}>
            {recoveryKey}
          </p>
        </div>
        <p className="auth-note" style={{ marginBottom: "2rem" }}>
          Save this in a password manager before continuing. The server cannot read your task content, and
          Throughline cannot recover encrypted data if both your password and recovery key are lost.
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
              placeholder="last 4"
              maxLength={4}
              style={{ fontFamily: "monospace", textTransform: "lowercase", width: "6rem", textAlign: "center" }}
            />
          </label>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
        <div className="button-row" style={{ justifyContent: "center", marginBottom: "1rem" }}>
          <button className="secondary-button" type="button" onClick={() => void regenerateRecoveryKey()} disabled={recoveryBusy}>
            {recoveryBusy ? "Generating..." : "Generate a different key"}
          </button>
        </div>
        <button className="primary-button depth-hover glow-halo" disabled={!canProceed} onClick={() => navigate("/app")}>
          Continue to Planner
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Local-first by default. Optional sync is end-to-end encrypted before records leave this device.">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (credentialResponse.credential) {
              try {
                setBusy(true);
                await loginWithGoogle(credentialResponse.credential);
                navigate("/app");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Google sign in failed.");
              } finally {
                setBusy(false);
              }
            }
          }}
          onError={() => {
            setError("Google sign in failed.");
          }}
          theme="filled_black"
          shape="pill"
          text="signup_with"
        />
      </div>
      
      <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "var(--ink-muted)", fontSize: "0.85em" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--surface-border)" }} />
        <span style={{ padding: "0 1rem" }}>or create with email</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--surface-border)" }} />
      </div>

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
          Your password encrypts your records. If you lose it, your recovery key is required to unlock synced data.
        </p>
        <button className="primary-button depth-hover glow-halo" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
