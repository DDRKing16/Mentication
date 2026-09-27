import { describe, expect, it, vi } from "vitest";
import ErrorBoundary from "@/components/ErrorBoundary";

describe("ErrorBoundary", () => {
  it("starts without an error", () => {
    const instance = new ErrorBoundary({ children: null });
    expect(instance.state).toEqual({ hasError: false });
  });

  it("flips into the error state once a child throws", () => {
    expect(ErrorBoundary.getDerivedStateFromError(new Error("boom"))).toEqual({ hasError: true });
  });

  it("logs the error instead of letting it go unnoticed", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const instance = new ErrorBoundary({ children: null });
    instance.componentDidCatch(new Error("boom"), { componentStack: "" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
