import React from "react";
import { Home, RotateCcw } from "lucide-react";
import { Logo } from "@/components/Logo";

// A last-resort safety net. If any page throws while rendering, this shows a
// calm, on-brand recovery screen instead of a blank white app — someone
// reaching for Mentication in a hard moment should never hit a dead end.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Mentication: unhandled error in the app tree", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md text-center">
          <Logo className="mx-auto h-20 w-20" />
          <h1 className="mt-7 font-heading text-3xl font-medium tracking-tight text-primary">
            Something didn’t load right
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            Nothing you did is lost. Try again, or head back to the home screen.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="no-tap inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-medium text-foreground transition-transform active:scale-95"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Try again
            </button>
            <button
              type="button"
              onClick={() => { window.location.href = "/"; }}
              className="no-tap inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-sm transition-transform active:scale-95"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Go home
            </button>
          </div>
        </div>
      </main>
    );
  }
}
