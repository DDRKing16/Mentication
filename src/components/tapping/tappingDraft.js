import { CONCERNS, TAPPING_POINTS } from './tappingProtocol';
export const TAPPING_DRAFT_KEY = 'mentation.eftTapping.draft.v1';
const integer = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;
export function readTappingDraft() {
  const raw = JSON.parse(localStorage.getItem(TAPPING_DRAFT_KEY) || 'null');
  if (!raw) return null;
  if (['voiceOn','musicOn','beatOn','muted'].some(key=>raw[key]!=null&&typeof raw[key]!=='boolean') || raw.version !== 1 || !['choose', 'before', 'ready', 'round', 'after', 'result', 'next', 'note'].includes(raw.stage) || !CONCERNS.some(c => c.id === raw.concern) || !integer(raw.index, TAPPING_POINTS.length - 1) || !integer(raw.second, 60) || !integer(raw.duration, 86400) || !integer(raw.rounds, 1000) || !integer(raw.skipped, 1000) || ![raw.before, raw.after].every(value => value === null || integer(value, 10)) || (raw.takeawayText != null && (typeof raw.takeawayText !== 'string' || raw.takeawayText.length > 1500)) || (raw.takeawayId != null && (typeof raw.takeawayId !== 'string' || raw.takeawayId.length > 160))) throw new Error('Unreadable tapping draft');
  if (raw.practiceEvents != null && (!Array.isArray(raw.practiceEvents) || raw.practiceEvents.length > 10000 || raw.practiceEvents.some(event => !event || !['id','label','detail'].every(key => typeof event[key] === 'string')))) throw new Error('Unreadable tapping checkpoints');
  if (raw.checkpointRound != null && !integer(raw.checkpointRound, 10000)) throw new Error('Unreadable tapping round');
  return raw;
}
export function writeTappingDraft(value) {
  localStorage.setItem(TAPPING_DRAFT_KEY, JSON.stringify({ ...value, version: 1 }));
}
export function deleteTappingDraft() { localStorage.removeItem(TAPPING_DRAFT_KEY); }
