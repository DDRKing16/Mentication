// Lightweight, privacy-conscious "last focus" memory for The Happy Bump.
//
// Only the life-area category and, when it matches one of the built-in
// suggested actions, that canned action text are remembered. Freely typed
// custom text is never stored here, matching the same exclusion the flagship
// resume-state already applies to personal free-text fields.
const KEY = "mentation.happyBump.lastFocus.v1";

export function getLastFocus() {
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function saveLastFocus({ lifeArea, areaAction }) {
  try { localStorage.setItem(KEY, JSON.stringify({ lifeArea, areaAction: areaAction || null, at: new Date().toISOString() })); } catch { /* private mode / quota */ }
}

export function clearLastFocus() {
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
}
