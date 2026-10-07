import { getNarration } from '@/lib/narrationService';
import { PMR_RATE } from '@/lib/pmrSession';
import manifest from './tappingAudioManifest.json';
import approvedManifest from '../../../narration-manifest.json';

const approvedTexts = new Set(Object.values(approvedManifest).map(entry => entry.text.trim().replace(/\s+/g, ' ')));

// The same offline narrator lookup and playback rate as PMR. No alternate voice.
export const TAPPING_VOICE_RATE = PMR_RATE;
export function tappingNarration(key, lookup = getNarration) {
  const text = manifest[key]?.caption;
  if (!text || (lookup === getNarration && !approvedTexts.has(text.trim().replace(/\s+/g, ' ')))) return null;
  return lookup(text);
}
export function tappingNarrationKeys(concern) {
  return Object.keys(manifest).filter(key => key.startsWith('place-') || key.startsWith(concern + '-') || ['tap', 'rest'].includes(key));
}
export function hasTappingNarration(concern, lookup = getNarration) {
  return tappingNarrationKeys(concern).every(key => Boolean(tappingNarration(key, lookup)?.url));
}
export function tappingNarrationDuration(key) {
  const clip = tappingNarration(key);
  const end = clip?.alignment?.at(-1)?.end;
  return Number.isFinite(end) && end > 0 ? end / TAPPING_VOICE_RATE : manifest[key]?.duration || 0;
}
