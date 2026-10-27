import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AuthShell } from "./AuthShell";
import { Notice, Spinner } from "../ui";

const API_BASE = (import.meta.env.VITE_PUSH_API_URL ?? "/api").replace(/\/$/, "");

type VerifyState =
  | { status: "loading" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

export function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const [state, setState] = useState<VerifyState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!token) {
        if (!cancelled) {
          setState({ status: "error", message: "This verification link is missing a token." });
        }
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/verify-email?token=${encodeURIComponent(token)}`, {
          method: "GET",
          credentials: "include"
        });
        if (cancelled) return;
        if (!res.ok) {
          setState({
            status: "error",
            message: "This verification link is invalid or has expired. You can request a new one from Settings."
          });
          return;
        }
        const data = (await res.json()) as { email?: string };
        setState({ status: "success", email: data.email ?? "your account" });
      } catch {
        if (!cancelled) {
          setState({
            status: "error",
            message: "Could not reach the server to verify your email. Check your connection and try again."
          });
        }
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <AuthShell title="Verifying email" subtitle="Confirming your Throughline account address.">
        <div className="auth-form" style={{ placeItems: "center", display: "grid", gap: "1rem" }}>
          <Spinner size={28} />
          <p className="auth-subtitle" style={{ margin: 0 }}>
            One moment…
          </p>
        </div>
      </AuthShell>
    );
  }

  if (state.status === "success") {
    return (
      <AuthShell title="Email verified" subtitle="Your account email is confirmed. Planner data stays local-first and end-to-end encrypted.">
        <Notice variant="success" title="You're all set">
          <p>
            <strong>{state.email}</strong> is verified. Optional sync keeps working the same way — the server still cannot
            read your tasks.
          </p>
        </Notice>
        <div className="button-row" style={{ marginTop: "1.25rem" }}>
          <Link to="/app" className="btn btn-accent">
            Open planner
          </Link>
          <Link to="/login" className="btn">
            Sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verification failed" subtitle="We could not confirm this email link.">
      <Notice variant="error" title="Link not valid">
        <p>{state.message}</p>
      </Notice>
      <div className="button-row" style={{ marginTop: "1.25rem" }}>
        <Link to="/app?view=settings" className="btn btn-accent">
          Open Settings
        </Link>
        <Link to="/app" className="btn">
          Continue locally
        </Link>
      </div>
    </AuthShell>
  );
}
