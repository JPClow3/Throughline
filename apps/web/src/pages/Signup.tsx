import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthProvider";
import { RecoveryKeyPanel } from "../auth/RecoveryKeyPanel";
import { buildVerifyEmailLink } from "../lib/verifyEmailLink";
import { AuthShell } from "./AuthShell";
import { Button, Field, Notice, TextInput } from "../ui";

export function Signup() {
  const { signup, loginWithGoogle, rotateRecoveryKey, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
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
      const result = await signup(email, password);
      setRecoveryKey(result.recoveryKey);
      setVerificationToken(result.verificationToken ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle(credential: string) {
    setBusy(true);
    setError("");
    try {
      const result = await loginWithGoogle(credential);
      if (result.created) {
        const key = await rotateRecoveryKey();
        setRecoveryKey(key);
        setConfirmedSaved(false);
        setPartialKey("");
        return;
      }
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  if (recoveryKey) {
    const canProceed =
      confirmedSaved && partialKey.toLowerCase() === recoveryKey.slice(-4).toLowerCase();

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
        <RecoveryKeyPanel
          recoveryKey={recoveryKey}
          confirmed={confirmedSaved}
          onConfirmedChange={setConfirmedSaved}
          partialKey={partialKey}
          onPartialKeyChange={setPartialKey}
          onRegenerate={regenerateRecoveryKey}
          regenerateBusy={recoveryBusy}
          footer={
            <>
              {verificationToken ? (
                <Notice variant="info" title="Confirm your email when you can">
                  <p>
                    Mail delivery is optional on this server. Open the verification link below (or from Settings later).
                    Your planner already works locally.
                  </p>
                  <div className="button-row" style={{ marginTop: "0.75rem" }}>
                    <a className="btn btn-accent" href={buildVerifyEmailLink(verificationToken)}>
                      Open verification link
                    </a>
                  </div>
                </Notice>
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">
                  We also sent a confirmation email when mail is configured — you can resend it anytime from Settings.
                </p>
              )}
              {error ? <p className="auth-error">{error}</p> : null}
              <Button variant="primary" disabled={!canProceed} onClick={() => navigate("/app")}>
                Continue to Planner
              </Button>
            </>
          }
        />
      </AuthShell>
    );
  }

  const googleEnabled = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  return (
    <AuthShell title="Create your account" subtitle="Local-first by default. Optional sync is end-to-end encrypted before records leave this device.">
      {googleEnabled ? (
        <>
          <div className="auth-oauth-row">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  await handleGoogle(credentialResponse.credential);
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
        </>
      ) : null}

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
      <div className="auth-switch auth-switch-stack">
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
        <p className="auth-switch-secondary">
          Prefer offline? <Link to="/app">Continue without an account</Link>
        </p>
      </div>
    </AuthShell>
  );
}
