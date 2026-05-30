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
        <div className="crash-screen" role="alert">
          <div className="crash-card glass-panel">
            <span className="empty-state-icon">
              <Warning size={26} />
            </span>
            <h1>Something went sideways</h1>
            <p>An unexpected error interrupted the view. Your data is saved locally and is safe.</p>
            <button className="primary-button" type="button" onClick={() => window.location.reload()}>
              Reload Throughline
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
