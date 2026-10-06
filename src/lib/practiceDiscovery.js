import { NEED_ENTRIES } from './journeyExperience';
export const PRACTICE_CATEGORIES = Object.freeze([
  ['calm', 'Calm'], ['lift', 'Lift'], ['ground', 'Ground'],
  ['focus', 'Focus'], ['reset', 'Reset'], ['sleep', 'Sleep'],
]);
function normalise(value) {
  return String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
// Finds authored language and supported directions; does not infer suitability.
export function practiceSearchMatches(practice, query) {
  const tokens = normalise(query).split(/\s+/).filter(Boolean);
  const needs = NEED_ENTRIES.filter(need=>need.practice===practice.id).map(need=>`${need.label} ${need.reason}`);
  const text = normalise([practice.name, practice.why, practice.category, practice.primaryDirection, ...(practice.directions || []), practice.id?.replace(/([a-z])([A-Z])/g,'$1 $2'), ...needs].join(' '));
  return tokens.every(token=>text.includes(token));
}
export function practiceTimeLabel(practice) {
  if (practice.id === 'dear2100') return 'Self-paced reflection';
  if (practice.id === 'taraTactician') return 'About 5 min to prepare';
  if (practice.id === 'nextAction') return 'Self-paced steps';
  if (practice.id === 'goodMap') return 'Self-paced map';
  if (practice.id === 'nightChannel') return '15+ min · stop anytime';
  if (practice.id === 'progressive-muscle-relaxation-v2') return 'About 2–5 min';
  return `About ${practice.durationMin}${practice.durationMax ? `–${practice.durationMax}` : ''} min`;
}
