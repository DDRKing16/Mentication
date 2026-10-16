import manifest from './tappingAudioManifest.json';
import approvedManifest from '../../../narration-manifest.json';

export const TAPPING_VOICE_ID = 'qKsErzZyZLoLSAUfEopJ';
const normalize = text => text.trim().replace(/\s+/g, ' ');
const approvedEntries = new Map(Object.values(approvedManifest)
  .filter(entry => entry.voice_id === TAPPING_VOICE_ID && entry.audio)
  .map(entry => [normalize(entry.text), entry]));

function getApprovedNarration(text) {
  const entry = approvedEntries.get(normalize(text));
  return entry ? { url: entry.audio, alignment: Array.isArray(entry.alignment) ? entry.alignment : [] } : null;
}

// Narration uses a pitch-preserving media element; bed and contact stay at 1x.
export const TAPPING_VOICE_RATE = 0.8;
export function tappingNarration(key, lookup = getApprovedNarration) {
  const text = manifest[key]?.caption;
  if (!text) return null;
  return lookup(text);
}
export function tappingNarrationKeys(concern) {
  return Object.keys(manifest).filter(key => key.startsWith('place-') || key.startsWith(concern + '-') || ['tap', 'rest'].includes(key));
}
export function hasTappingNarration(concern, lookup = getApprovedNarration) {
  return tappingNarrationKeys(concern).every(key => Boolean(tappingNarration(key, lookup)?.url));
}
export function tappingNarrationDuration(key) {
  const clip = tappingNarration(key);
  const end = clip?.alignment?.at(-1)?.end;
  return Number.isFinite(end) && end > 0 ? end / TAPPING_VOICE_RATE : manifest[key]?.duration || 0;
}
