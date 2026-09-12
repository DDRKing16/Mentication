import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Global accessibility preferences, persisted to localStorage and applied to <html>.
const KEY = "haven_a11y";
const DEFAULTS = {
  reducedMotion: false,
  textScale: 1, // 1 | 1.15 | 1.3
  captions: true,
  highContrast: false,
  oneHanded: false,
};

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return DEFAULTS; }
  });

  // respect the OS preference on first run
  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    try {
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setSettings((s) => ({ ...s, reducedMotion: true }));
      }
    } catch { /* */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* */ }
    const html = document.documentElement;
    html.style.fontSize = `${Math.round(16 * (settings.textScale || 1))}px`;
    html.classList.toggle("reduce-motion", !!settings.reducedMotion);
    html.classList.toggle("hc", !!settings.highContrast);
    html.classList.toggle("one-handed", !!settings.oneHanded);
  }, [settings]);

  const update = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const reset = useCallback(() => setSettings(DEFAULTS), []);

  return (
    <AccessibilityContext.Provider value={{ ...settings, update, reset }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export const useAccessibility = () => useContext(AccessibilityContext);