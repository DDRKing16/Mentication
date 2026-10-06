// Tara uses authored, offline guidance. No generated conversation or inferred outcome.
export const TARA_ID = 'taraTactician';
export const PHASES = ['entry', 'prepare', 'plan', 'rehearse', 'tackle', 'support', 'reflect', 'recap'];
export const COMPARISONS = [
  ['less', 'Less difficult than I expected'], ['same', 'About as I expected'],
  ['more', 'More difficult than I expected'], ['different', 'Something different happened'],
  ['not-tested', 'I did not test it'], ['unsure', 'I’m not sure yet'],
];
export const EVENTS = [
  { id: 'conversation', label: 'A conversation', challenges: ['Finding the words', 'Holding a boundary', 'Feeling judged'] },
  { id: 'task', label: 'Something I need to do', challenges: ['Getting started', 'Making a mistake', 'Feeling overwhelmed'] },
  { id: 'change', label: 'Something unfamiliar', challenges: ['Not knowing what happens', 'Feeling judged', 'Feeling overwhelmed'] },
  { id: 'other', label: 'Something else', challenges: ['Finding the words', 'Getting started', 'Feeling overwhelmed'] },
];
const GUIDANCE = {
  'Finding the words': ['I might freeze and not know what to say.', 'My words do not need to be perfect.', 'A pause or a tight jaw.', 'Start with one sentence: “What I want to say is…”', 'Ask for a moment, then return to one sentence.'],
  'Holding a boundary': ['They might react badly if I say what I need.', 'I can be clear and respectful without controlling their response.', 'The urge to agree before I am ready.', 'Say one clear limit: “I can do this, but I cannot do that.”', 'Repeat my limit or pause the conversation.'],
  'Feeling judged': ['People might think badly of me.', 'I do not know what someone else is thinking.', 'Checking faces or losing my place.', 'Put my attention on the next thing I want to say or do.', 'Feel my feet and return to that one thing.'],
  'Getting started': ['I might not be able to do this.', 'Starting can be smaller than finishing.', 'Putting off the first move.', 'Choose the smallest useful first action and do just that.', 'Make the action smaller or ask for practical help.'],
  'Making a mistake': ['I might make a mistake and not be able to fix it.', 'I can check one step and ask when I need to.', 'Rushing or checking repeatedly.', 'Do one step, then check what it needs.', 'Pause and decide whether to adjust or get help.'],
  'Feeling overwhelmed': ['It might become too much for me.', 'I can choose the next step and change the pace.', 'Losing track or feeling tense.', 'Name just the next safe, manageable step.', 'Pause, reduce the demand, or step out intentionally.'],
  'Not knowing what happens': ['I might not know what to do next.', 'I can ask, observe, or choose one small next step.', 'Trying to solve everything in advance.', 'Find out the next thing I need to know.', 'Ask for clarification or give myself a pause.'],
};
export function newTaraState() {
  return { schemaVersion: 1, id: globalThis.crypto?.randomUUID?.() || `tara-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    phase: 'entry', entryMode: null, event: '', situation: '', challenge: '', prediction: '', predictionEdited: false,
    likelihood: '', plan: { mind: '', notice: '', do: '', spikes: '' }, rehearsal: '', rehearsed: false,
    support: '', eventStatus: 'not-started', actualActionConfirmed: false, completionReported: false, actual: '', comparison: '', learning: '', nextStep: '', saved: false };
}
export function chooseEvent(state, event) {
  if (!EVENTS.some(item => item.id === event)) return state;
  return { ...state, event, challenge: '', prediction: state.predictionEdited ? state.prediction : '', saved: false };
}
export function chooseChallenge(state, challenge) {
  if (!EVENTS.find(item => item.id === state.event)?.challenges.includes(challenge)) return state;
  return { ...state, challenge, prediction: state.predictionEdited ? state.prediction : GUIDANCE[challenge][0], saved: false };
}
export function preparePlan(state) {
  const guide = GUIDANCE[state.challenge] || GUIDANCE['Feeling overwhelmed'];
  const names = ['mind', 'notice', 'do', 'spikes'];
  return { ...state, phase: 'plan', plan: Object.fromEntries(names.map((name, index) => [name, state.plan[name] || (name === 'mind' ? state.prediction || guide[0] : guide[index + 1])])) };
}
export function beginTackle(state) { return { ...state, phase: 'tackle', eventStatus: state.eventStatus === 'not-started' ? 'in-progress' : state.eventStatus }; }
export function returnToEvent(state) { return { ...state, phase: 'tackle', support: '' }; }
export function confirmReflection(state) {
  if (!state.actualActionConfirmed || !['finished', 'stepped-out', 'not-attempted', 'unknown'].includes(state.eventStatus) || !COMPARISONS.some(([value]) => value === state.comparison)) return state;
  return { ...state, phase: 'recap', saved: false };
}
const text = value => typeof value === 'string' ? value.slice(0, 3000) : '';
export function validateTaraState(raw) {
  if (!raw || raw.schemaVersion !== 1 || typeof raw.id !== 'string' || !raw.id || !PHASES.includes(raw.phase)) return null;
  if (!['not-started', 'in-progress', 'finished', 'stepped-out', 'not-attempted', 'unknown'].includes(raw.eventStatus)) return null;
  const state = newTaraState();
  for (const key of ['situation', 'prediction', 'rehearsal', 'actual', 'learning', 'nextStep']) state[key] = text(raw[key]);
  for (const key of ['predictionEdited', 'rehearsed', 'saved', 'actualActionConfirmed', 'completionReported']) state[key] = raw[key] === true;
  state.id = raw.id; state.phase = raw.phase; state.eventStatus = raw.eventStatus;
  state.entryMode = ['prepare', 'live'].includes(raw.entryMode) ? raw.entryMode : null;
  state.event = EVENTS.some(item => item.id === raw.event) ? raw.event : '';
  state.challenge = EVENTS.find(item => item.id === state.event)?.challenges.includes(raw.challenge) ? raw.challenge : '';
  state.likelihood = ['unlikely', 'possible', 'likely', 'unsure'].includes(raw.likelihood) ? raw.likelihood : '';
  state.comparison = COMPARISONS.some(([value]) => value === raw.comparison) ? raw.comparison : '';
  state.support = ['racing', 'overwhelmed', 'step-out'].includes(raw.support) ? raw.support : '';
  state.plan = Object.fromEntries(['mind', 'notice', 'do', 'spikes'].map(key => [key, text(raw.plan?.[key])]));
  if (state.phase === 'recap' && (!state.comparison || !state.actualActionConfirmed || !['finished', 'stepped-out', 'not-attempted', 'unknown'].includes(state.eventStatus))) return null;
  return state;
}
export function taraCompletion(state) {
  // Deliberate coarse fields only. Host integration must allowlist any new enums.
  return { interventionId: TARA_ID, completion: 'completed', saved: state.saved,
    eventStatus: state.eventStatus, predictionComparison: state.comparison || null, rehearsed: state.rehearsed };
}
