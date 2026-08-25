import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";
import { Button, Field, Notice, TextInput } from "../ui";

export function Login() {
  const { login, loginWithGoogle, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // The pre-paint script resolves the theme before render, so one read is accurate here.
  const [googleTheme] = useState<"outline" | "filled_black">(() =>
    typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark"
      ? "filled_black"
      : "outline"
  );

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
        />
      </div>

      <div className="auth-divider">or continue with email</div>

      <form className="auth-form" onSubmit={submit}>
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password or Recovery Key">
          <TextInput
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        {error ? (
          <Notice variant="error">{error}</Notice>
        ) : null}
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="auth-switch" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p>
          New here? <Link to="/signup">Create an account</Link>
        </p>
        <p style={{ fontSize: "0.85em" }}>
          <Link to="/forgot-password">Forgot your password?</Link>
        </p>
      </div>
    </AuthShell>
  );
}
