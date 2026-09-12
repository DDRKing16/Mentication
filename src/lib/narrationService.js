// Local narration service.
//
// Replaces the previous hosted speech function and cache entity
// with a static lookup over the pre-generated narration manifest and its
// local mp3 assets (checked into `public/audio/narration/`). No network
// request is made and no audio is ever generated at runtime — narration is
// either found locally or logged as missing.
import manifest from "../../narration-manifest.json";

// Normalise only leading/trailing whitespace and collapse repeated spaces,
// so lookups are resilient to incidental formatting differences without
// masking real content mismatches.
function normalize(text) {
  return typeof text === "string" ? text.trim().replace(/\s+/g, " ") : "";
}

// Build the text -> manifest entry lookup once. Manifest key iteration order
// mirrors insertion order in the JSON file, so the first entry for a given
// normalised text wins on duplicates.
const lookup = new Map();
for (const key of Object.keys(manifest)) {
  const entry = manifest[key];
  const norm = normalize(entry?.text);
  if (!norm || lookup.has(norm)) continue;
  lookup.set(norm, entry);
}

export const NARRATION_INDEXED_COUNT = lookup.size;

// Returns { url, alignment } for the given spoken text — the same shape the
// narration player previously read from the `elevenlabs-speak` response's
// `data` field — or null if no local narration exists for it.
export function getNarration(text) {
  const norm = normalize(text);
  if (!norm) return null;
  const entry = lookup.get(norm);
  if (!entry) {
    if (import.meta.env?.DEV) {
      console.error(`[narration] Missing local narration for spoken text: "${text}"`);
    }
    return null;
  }
  return { url: entry.audio, alignment: Array.isArray(entry.alignment) ? entry.alignment : [] };
}

// Runtime narration is intentionally offline-only. Missing clips are created
// by the build-time narration script and bundled into the app, never generated
// from a device with a secret API key.
export async function fetchNarration(text, { withAlignment = false } = {}) {
  const norm = normalize(text);
  if (!norm) return null;

  const existing = lookup.get(norm);
  if (existing?.audio && (!withAlignment || (Array.isArray(existing.alignment) && existing.alignment.length))) {
    return { url: existing.audio, alignment: Array.isArray(existing.alignment) ? existing.alignment : [] };
  }
  return null;
}
