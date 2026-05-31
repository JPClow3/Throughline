import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="auth-screen">
        <div className="auth-loading">Loading…</div>
      </div>
    );
  }

  if (status === "anon") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
