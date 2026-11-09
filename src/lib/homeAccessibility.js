import { read } from '../hooks/useAccessibilityPrefs.js';
import { writeVerified, removeVerified } from './verifiedStorage.js';
const PREFS_KEY = 'haven.a11y.v2', TEXT_KEY = 'haven_a11y';
const NAMES = Object.freeze({ 'large-text': 'largeText', 'high-contrast': 'highContrast', 'reduce-motion': 'reducedMotion' });
export function homeAccessibilityState(prefs, scale = 1) {
  const textScale = [1, 1.15, 1.3].includes(scale) ? scale : 1;
  return { 'large-text': prefs.largeText === true || textScale > 1, 'high-contrast': prefs.highContrast === true, 'reduce-motion': prefs.reducedMotion === true, textScale };
}
// Only explicit preference booleans cross the sandbox bridge. Storage stays in the host.
export function saveHomeAccessibilityPreference(name, value, storage = globalThis.localStorage, currentPrefs = read()) {
  if (!Object.prototype.hasOwnProperty.call(NAMES, name) || typeof value !== 'boolean') return { ok: false };
  const changes = [];
  try {
    const prefs = { ...currentPrefs, [NAMES[name]]: value };
    changes.push({ key: PREFS_KEY, previous: storage.getItem(PREFS_KEY) });
    writeVerified(storage, PREFS_KEY, JSON.stringify(prefs));
    let text;
    try { text = JSON.parse(storage.getItem(TEXT_KEY) || '{}'); } catch { text = {}; }
    if (!text || typeof text !== 'object' || Array.isArray(text)) text = {};
    if (name === 'large-text') {
      changes.push({ key: TEXT_KEY, previous: storage.getItem(TEXT_KEY) });
      text = { ...text, textScale: value ? ([1.15, 1.3].includes(text.textScale) ? text.textScale : 1.15) : 1 };
      writeVerified(storage, TEXT_KEY, JSON.stringify(text));
    }
    return { ok: true, preferences: homeAccessibilityState(prefs, text.textScale) };
  } catch {
    for (const change of changes.reverse()) {
      try { if (change.previous === null) removeVerified(storage, change.key); else writeVerified(storage, change.key, change.previous); } catch { /* Never claim persistence after failure. */ }
    }
    return { ok: false };
  }
}
