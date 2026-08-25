import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";
import { Button, Field, TextInput, ToggleRow } from "../ui";

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
  // The pre-paint script resolves the theme before render, so one read is accurate here.
  const [googleTheme] = useState<"outline" | "filled_black">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "filled_black"
      : "outline"
  );

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
        <div className="recovery-key-display">{recoveryKey}</div>
        <p className="text-center text-sm text-[var(--ink-soft)]">
          Save this in a password manager before continuing. The server cannot read your task content, and Throughline
          cannot recover encrypted data if both your password and recovery key are lost.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <ToggleRow checked={confirmedSaved} onChange={setConfirmedSaved}>
            I have saved this recovery key securely
          </ToggleRow>
          <Field label="To confirm, enter the last 4 characters of your key">
            <TextInput
              type="text"
              value={partialKey}
              onChange={(event) => setPartialKey(event.target.value)}
              placeholder="last 4"
              maxLength={4}
              style={{ fontFamily: "monospace", width: "8rem", textAlign: "center" }}
            />
          </Field>
        </div>

        {error ? <p className="auth-error">{error}</p> : null}
        <div className="flex flex-col items-center gap-3">
          <Button onClick={() => void regenerateRecoveryKey()} disabled={recoveryBusy}>
            {recoveryBusy ? "Generating..." : "Generate a different key"}
          </Button>
          <Button variant="primary" disabled={!canProceed} onClick={() => navigate("/app")}>
            Continue to Planner
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Local-first by default. Optional sync is end-to-end encrypted before records leave this device.">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
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
          theme={googleTheme}
          shape="pill"
          text="signup_with"
        />
      </div>

      <div className="auth-divider">or create with email</div>

      <form className="auth-form" onSubmit={submit}>
        <Field label="Email">
          <TextInput type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Password">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="Confirm password">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </Field>
        {error ? <p className="auth-error">{error}</p> : null}
        <p className="text-sm text-[var(--ink-soft)]">
          Your password encrypts your records. If you lose it, your recovery key is required to unlock synced data.
        </p>
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
