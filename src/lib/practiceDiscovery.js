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
  if (practice.id === 'urgeSurf') return '30–60 sec practice · optional setup';
  if (practice.id === 'progressive-muscle-relaxation-v2') return 'About 2–5 min';
  return `About ${practice.durationMin}${practice.durationMax ? `–${practice.durationMax}` : ''} min`;
}

// Presentation and navigation only. Recommendation scoring and practice state
// remain owned by their existing modules. Need selection uses catalogue IDs.
import { INTERVENTIONS } from './interventions';
import { practiceLaunchEntry } from './practiceLaunch';
import { standaloneRouteFor } from './standaloneInterventions';

export const NEED_GROUPS = [
  { id: 'body', title: 'Settle & reconnect', description: 'Overwhelm, tension or a difficult feeling', needs: ['overwhelmed', 'tense', 'feeling-struggle'], mark: '01' },
  { id: 'mind', title: 'Meet a busy mind', description: 'Looping thoughts or a harsh inner voice', needs: ['thought', 'sticky-thought', 'harsh-self-talk'], mark: '02' },
  { id: 'action', title: 'Find a next step', description: 'Getting started, making a change or preparing', needs: ['starting', 'flat', 'prepare-situation'], mark: '03' },
  { id: 'night', title: 'Leave it for tonight', description: 'Unfinished thoughts at bedtime', needs: ['bedtime'], mark: '04' },
];

// Describe the activity, rather than promising a particular psychological effect.
export const PRACTICE_PREVIEWS = {
  boxV2: 'Follow a breathing rhythm and adjust the pace to suit you.',
  'progressive-muscle-relaxation-v2': 'Move through muscle groups with gentle effort or release only.',
  factCheck: 'Separate observations from interpretations, then write a fairer perspective.',
  urgeSurf: 'Notice an urge for a short window, then choose a safe next action.',
  selfCompassion: 'Answer a harsh inner line with words you can believe and an act of care.',
  makeRoom: 'Explore a manageable feeling and choose the support or boundary you need.',
  happyBump: 'Choose manageable activities and try one small action at a time.',
  changeScene: 'Try one small change in your surroundings or position.',
  goodMap: 'Map the parts of life that matter to you, then choose something to try.',
  dear2100: 'Explore avoidance, reflect in your book, and choose a smallest action.',
  grounding54321V2: 'Notice everyday details through your senses, with options to adapt or skip.',
  vectorShift: 'Follow visual challenges that use tracking, navigation and attention.',
  signalLock: 'Follow a visual signal and reveal a room, one connection at a time.',
  eftTapping: 'Try a guided tapping round, with choices about touch and pace.',
  nextAction: 'Turn a task into a small step you can edit, try or make easier.',
  taraTactician: 'Prepare a next move, choose support, and return to reflect on what happened.',
  unhook: 'Name a thought as a thought, then turn toward an action you choose.',
  tomorrowParking: 'Put an unfinished thought into a note you can return to later.',
  nightChannel: 'Choose a listening channel or quiet rest, at your own pace.',
};

export const practiceDuration = practiceTimeLabel;

export function practiceDestination(id, audio = 'no') {
  if (id === 'dear2100') return { to: '/dear-2100' };
  const iv = INTERVENTIONS.find(item => item.id === id);
  if (!iv) return null;
  const route = standaloneRouteFor(id);
  if (route) return { to: route };
  return { to: '/reset', state: practiceLaunchEntry(iv, { audio }) };
}
