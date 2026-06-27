import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";
import { Notice } from "../components/Notice";

export function Login() {
  const { login, loginWithGoogle, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "authed") {
    return <Navigate to="/app" replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to sync your plan across devices.">
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
        />
      </div>
      
      <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "var(--ink-muted)", fontSize: "0.85em" }}>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--surface-border)" }} />
        <span style={{ padding: "0 1rem" }}>or continue with email</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "var(--surface-border)" }} />
      </div>

      <form className="auth-form" onSubmit={submit}>
        <label>
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          <span>Password or Recovery Key</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <Notice variant="error" className="mb-4">{error}</Notice>
        ) : null}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <div className="auth-switch" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p>
          New here? <Link to="/signup">Create an account</Link>
        </p>
        <p style={{ fontSize: "0.85em" }}>
          <Link to="/forgot-password" style={{ color: "var(--ink-muted)" }}>Forgot your password?</Link>
        </p>
      </div>
    </AuthShell>
  );
}
