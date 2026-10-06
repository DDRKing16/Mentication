import { CONCERNS, TAPPING_POINTS } from './tappingProtocol';
export const TAPPING_DRAFT_KEY = 'mentation.eftTapping.draft.v1';
const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
export function readTappingDraft() {
  const raw = JSON.parse(localStorage.getItem(TAPPING_DRAFT_KEY) || 'null');
  if (!raw) return null;
  if (raw.version !== 1 || !['choose', 'before', 'ready', 'round', 'after', 'result'].includes(raw.stage) || !CONCERNS.some(c => c.id === raw.concern) || !integer(raw.index, TAPPING_POINTS.length - 1) || !integer(raw.second, 30) || !integer(raw.duration, 86400) || !integer(raw.rounds, 1000) || !integer(raw.skipped, 1000) || ![raw.before, raw.after].every(value => value === null || integer(value, 10))) throw new Error('Unreadable tapping draft');
  return raw;
}
export function writeTappingDraft(value) {
  localStorage.setItem(TAPPING_DRAFT_KEY, JSON.stringify({ ...value, version: 1 }));
}
export function deleteTappingDraft() { localStorage.removeItem(TAPPING_DRAFT_KEY); }
