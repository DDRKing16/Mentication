import {subscribeAccessibilityPreferences} from '@/lib/accessibilitySubscription';
// @ts-check
import { useState, useEffect, useCallback } from "react";
import { notifyAccessibilityPreferencesChanged } from "@/lib/accessibilityEvents";

// Accessibility preferences, persisted locally and applied to <html> as classes.
const KEY = "haven.a11y.v2";
export const ACCESSIBILITY_DEFAULTS = Object.freeze({
  reducedMotion: false,
  largeText: false,
  captions: true,
  highContrast: false,
  oneHanded: false,
  ambientSoundscape: true,
  ambientType: "wind",
});

// Whether the OS itself asks for reduced motion (checked only before this
// device has its own saved Mentication preference, same as a first install).
export function prefersReducedMotionByDefault() {
  try {
    return typeof window !== "undefined" && !!window.matchMedia
      && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...ACCESSIBILITY_DEFAULTS, reducedMotion: prefersReducedMotionByDefault() };
    const saved=JSON.parse(raw);
    const next={...ACCESSIBILITY_DEFAULTS,reducedMotion:prefersReducedMotionByDefault()};
    if(saved && typeof saved==='object' && !Array.isArray(saved)) {
      for(const key of Object.keys(next)) if(typeof next[key]==='boolean' && typeof saved[key]==='boolean')next[key]=saved[key];
      if(['off','wind','rain','ocean','hum','whitenoise'].includes(saved.ambientType))next.ambientType=saved.ambientType;
    }
    return next;
  } catch {
    return { ...ACCESSIBILITY_DEFAULTS, reducedMotion:prefersReducedMotionByDefault() };
  }
}

function applyToDocument(prefs) {
  if (typeof document === "undefined") return;
  const el = document.documentElement;
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

  useEffect(() => {
    const refresh = () => setPrefs(read());
    return subscribeAccessibilityPreferences(refresh);
  }, []);

  const setPref = useCallback((key, value) => {
    setPrefs((prev) => {
      const next = { ...prev, [key]: value };
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* */ }
      queueMicrotask(notifyAccessibilityPreferencesChanged);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setPrefs({ ...ACCESSIBILITY_DEFAULTS });
    try { localStorage.setItem(KEY, JSON.stringify(ACCESSIBILITY_DEFAULTS)); } catch { /* */ }
    notifyAccessibilityPreferencesChanged();
  }, []);

  return { prefs, setPref, reset };
}
