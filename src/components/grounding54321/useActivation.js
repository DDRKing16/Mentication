import { useState } from "react";
import { haptic } from "@/lib/feedback";

// Evenly-spaced auto-illumination across a 0..1 stage progress, with optional
// early tap activation. An element lights when progress passes its threshold
// OR the user taps it; once activated it stays on. Tapping one element does
// not advance the stage — only the full reflection time (or "Next") does.
export function useActivation(count, progress) {
  const [manual, setManual] = useState(() => new Set());
  const activated = Array.from({ length: count }, (_, i) => {
    const threshold = count > 1 ? i / count : 0;
    return manual.has(i) || progress >= threshold;
  });
  const activate = (i) => {
    haptic(8);
    setManual((prev) => {
      if (prev.has(i)) return prev;
      const next = new Set(prev);
      next.add(i);
      return next;
    });
  };
  return { activated, activate };
}