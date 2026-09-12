import { useEffect, useState } from "react";

/**
 * Tracks the OS dark-mode preference, mirrors it onto <html class="dark">
 * (so the existing token-based styling adapts natively), and returns the
 * current boolean. Mount once at the app root; components may also call it
 * to read the value for custom dark styling.
 */
export function useSystemDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [dark]);

  return dark;
}