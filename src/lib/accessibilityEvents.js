// @ts-check
export const ACCESSIBILITY_CHANGED_EVENT = "mentation:accessibility-changed";

export function notifyAccessibilityPreferencesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_CHANGED_EVENT));
}
