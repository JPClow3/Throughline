import { Warning } from "@phosphor-icons/react";
import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

/**
 * Top-level boundary so a render error in any view shows a calm recovery screen
 * instead of a blank page. Local data in IndexedDB is untouched.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Throughline crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen view-layout" role="alert">
          <div className="crash-card glass-panel" style={{ textAlign: "center", padding: "var(--space-10) var(--space-6)", borderRadius: "var(--radius-card)", maxWidth: "400px" }}>
            <span className="empty-state-icon" style={{ margin: "0 auto var(--space-4)" }}>
              <Warning size={32} color="var(--danger)" />
            </span>
            <h1 style={{ fontSize: "var(--text-section)", marginBottom: "var(--space-2)" }}>Something went sideways</h1>
            <p style={{ color: "var(--ink-muted)", marginBottom: "var(--space-6)" }}>An unexpected error interrupted the view. Your data is saved locally and is safe.</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()} style={{ margin: "0 auto" }}>
              Reload Throughline
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
