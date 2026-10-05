import { useEffect, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

// A foreground return never starts breathing on the user's behalf. The same
// Pause/Play control resumes both the paced stage and its instruction audio.
export function useBoxBreathingActivityPause(active, onPause) {
  const pauseRef = useRef(onPause);
  pauseRef.current = onPause;
  useEffect(() => {
    if (!active) return;
    let disposed = false;
    let nativeListener;
    const pause = () => pauseRef.current();
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("freeze", pause);
    window.addEventListener("pagehide", pause);
    visibility();
    if (Capacitor.isNativePlatform()) {
      App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive && !disposed) pause();
      }).then((listener) => {
        if (disposed) listener.remove();
        else nativeListener = listener;
      }).catch(() => { /* document visibility remains available */ });
    }
    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("freeze", pause);
      window.removeEventListener("pagehide", pause);
      nativeListener?.remove();
    };
  }, [active]);
}
