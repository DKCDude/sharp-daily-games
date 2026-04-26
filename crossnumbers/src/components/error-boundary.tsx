import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("Crossnumbers crashed:", error, info);
  }

  handleReload = () => {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith("crossnumbers_"))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-background">
          <div className="max-w-md w-full rounded-2xl border border-border bg-card p-6 text-center space-y-4 shadow-sm">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              The puzzle failed to load. Clearing your saved progress for today
              usually fixes this.
            </p>
            <pre className="text-[11px] text-left bg-muted/40 rounded-md p-3 overflow-auto max-h-40 text-muted-foreground">
              {this.state.error.message}
            </pre>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Reset and reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
