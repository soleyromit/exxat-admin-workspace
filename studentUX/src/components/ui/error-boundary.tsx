import * as React from "react";
import { Button } from "./button";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback UI. If omitted, renders the default ErrorFallback. */
  fallback?: React.ReactNode;
  /** Called when the user clicks "Try again" to reset the boundary. */
  onReset?: () => void;
}

// ─── Default fallback UI ────────────────────────────────────────────────────

function ErrorFallback({
  error,
  onReset,
}: {
  error: Error | null;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] gap-4 p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <div className="max-w-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error?.message || "An unexpected error occurred. Try reloading the page."}
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onReset}>
          Try again
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.reload()}
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}

// ─── Error Boundary class component ────────────────────────────────────────
// Must be a class because React error boundaries require lifecycle methods
// (getDerivedStateFromError / componentDidCatch) not available in hooks.

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Uncaught error:", error, info.componentStack);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <ErrorFallback error={this.state.error} onReset={this.reset} />
        )
      );
    }
    return this.props.children;
  }
}

// ─── HOC helper ────────────────────────────────────────────────────────────

/**
 * Wraps a component in an ErrorBoundary.
 *
 * @example
 * const SafeChart = withErrorBoundary(ChartComponent);
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, "children">
) {
  const displayName = Component.displayName || Component.name || "Component";

  function WrappedComponent(props: P) {
    return (
      <ErrorBoundary {...boundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  }

  WrappedComponent.displayName = `withErrorBoundary(${displayName})`;
  return WrappedComponent;
}
