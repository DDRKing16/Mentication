// @ts-check
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { ACCESSIBILITY_CHANGED_EVENT } from "./accessibilityEvents";

// The one remaining setting this file owns: the three-step text size scale.
// Reduce motion, high contrast, captions and one-handed reach all live in
// `src/hooks/useAccessibilityPrefs.js` now (the store every intervention and
// the brand Threshold/Closing actually read) -- see AGENT_LOG.md, 28 Sep.
const KEY = "haven_a11y";
const DEFAULTS = {
  textScale: 1, // 1 | 1.15 | 1.3
};

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; }
    catch { return DEFAULTS; }
  });

  useEffect(() => {
    const refresh = () => {
      try { setSettings({ ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }); }
      catch { setSettings(DEFAULTS); }
    };
    window.addEventListener(ACCESSIBILITY_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(ACCESSIBILITY_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* */ }
    document.documentElement.style.fontSize = `${Math.round(16 * (settings.textScale || 1))}px`;
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