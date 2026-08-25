import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthShell } from "./AuthShell";
import { Button, Field, Notice, TextInput } from "../ui";

export function ForgotPassword() {
  const { resetPassword, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (status === "authed") {
    return <Navigate to="/app" replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (newPassword.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (!resetPassword) {
        throw new Error("Reset password not implemented.");
      }
      await resetPassword(email, recoveryKey.trim().toLowerCase(), newPassword);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell title="Recover Account" subtitle="Use your 32-character recovery key to set a new password.">
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
        <Field label="Recovery Key">
          <TextInput
            type="text"
            required
            placeholder="abcd-ef01-2345-..."
            value={recoveryKey}
            onChange={(event) => setRecoveryKey(event.target.value)}
          />
        </Field>
        <Field label="New Password">
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>
        {error ? (
          <Notice variant="error">{error}</Notice>
        ) : null}
        <Button variant="primary" type="submit" disabled={busy}>
          {busy ? "Recovering…" : "Reset Password"}
        </Button>
      </form>
      <p className="auth-switch">
        Remembered it? <Link to="/login">Sign in</Link>
      </p>
    </AuthShell>
  );
}
