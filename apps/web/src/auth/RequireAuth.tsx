import type { ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { Spinner } from "../ui";

/**
 * Waits for auth bootstrap, then renders the planner for both signed-in and
 * local-only (anon) sessions. Accounts are optional — IndexedDB stays the
 * source of truth either way.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === "loading") {
    return (
      <div className="view-layout" style={{ placeItems: "center", display: "grid", height: "100vh" }}>
        <Spinner size={32} />
      </div>
    );
  }

  return <>{children}</>;
}
