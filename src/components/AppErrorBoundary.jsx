import React from "react";
import { AlertTriangle, Home, LifeBuoy, RefreshCw } from "lucide-react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Keep the failure local and private on-device.
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  recover = (callback) => {
    this.setState({ hasError: false }, () => callback?.());
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream via-background to-background px-6 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" strokeWidth={1.7} />
          </span>
          <h1 className="mt-6 font-heading text-3xl font-medium tracking-tight text-primary text-balance">
            Something went wrong
          </h1>
          <p className="mt-3 max-w-md text-lg leading-relaxed text-muted-foreground text-balance">
            Mentication hit a problem. You can go back home, get support, or reload this app.
          </p>
          <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
            <button
              type="button"
              onClick={() => this.recover(this.props.onGoHome)}
              className="no-tap flex h-14 items-center justify-center gap-2 rounded-full bg-primary px-5 text-base font-medium text-primary-foreground soft-depth active:scale-95"
            >
              <Home className="h-4 w-4" /> Back to start
            </button>
            <button
              type="button"
              onClick={() => this.recover(this.props.onGetSupport)}
              className="no-tap flex h-14 items-center justify-center gap-2 rounded-full border border-destructive/30 bg-destructive/5 px-5 text-base font-medium text-destructive active:scale-95"
            >
              <LifeBuoy className="h-4 w-4" /> Get support now
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="no-tap flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground active:scale-95"
            >
              <RefreshCw className="h-4 w-4" /> Reload app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
