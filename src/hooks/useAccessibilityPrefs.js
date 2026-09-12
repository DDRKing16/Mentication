import { useState, useEffect, useCallback } from "react";

// Accessibility preferences, persisted locally and applied to <html> as classes.
const KEY = "haven.a11y.v2";
export const ACCESSIBILITY_DEFAULTS = Object.freeze({
  reducedMotion: false,
  largeText: false,
  textScale: 1,
  captions: true,
  highContrast: false,
  oneHanded: false,
  ambientSoundscape: true,
  ambientType: "wind",
});

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...ACCESSIBILITY_DEFAULTS };
    return { ...ACCESSIBILITY_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...ACCESSIBILITY_DEFAULTS };
  }
}

function applyToDocument(prefs) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
  el.style.fontSize = `${Math.round(16 * (prefs.textScale || (prefs.largeText ? 1.15 : 1)))}px`;
  el.classList.toggle("reduce-motion", !!prefs.reducedMotion);
  el.classList.toggle("large-text", !!prefs.largeText);
  el.classList.toggle("high-contrast", !!prefs.highContrast);
  el.classList.toggle("one-handed", !!prefs.oneHanded);
}

export function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useState(read);

  useEffect(() => {
    applyToDocument(prefs);
  }, [prefs]);

  const setPref = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPrefs({ ...ACCESSIBILITY_DEFAULTS });
    try { localStorage.setItem(KEY, JSON.stringify(ACCESSIBILITY_DEFAULTS)); } catch { /* */ }
  }, []);

  return { prefs, setPref, reset };
}
