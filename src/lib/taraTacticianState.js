import { newTaraPractice } from './taraGuidance';
import { FLOW_PHASES, screenFor } from './getThroughFlow';
// Tara uses authored, offline guidance. No generated conversation or inferred outcome.
export const TARA_ID = 'taraTactician';
export const PHASES = ['entry', 'prepare', 'plan', 'ready', 'rehearse', 'tackle', 'support', 'reflect', 'recap'];
export const COMPARISONS = [
  ['less', 'Less difficult than I expected'], ['same', 'About as I expected'],
  ['more', 'More difficult than I expected'], ['different', 'Something different happened'],
  ['not-tested', 'I did not test it'], ['unsure', 'I’m not sure yet'],
];
export const PREDICTION_RESULTS = [['happened', 'It happened'], ['partly', 'Part of it happened'], ['did-not', 'It did not happen'], ['not-tested', 'I did not test it'], ['unsure', 'I’m not sure yet']];
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
  return { schemaVersion: 1, experienceVersion: 3, practice: newTaraPractice(), carryChoice: '', selectedMoveId: '', rehearsalChoice: '', rehearsalResponse: '', predictionResult: '', id: globalThis.crypto?.randomUUID?.() || `tara-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    phase: 'entry', flowScreen: 'entry', savePreference: '', actionChoice: '', paceChoice: '', prepareView: 'event', entryMode: null, event: '', situation: '', challenge: '', prediction: '', predictionEdited: false,
    likelihood: '', plan: { mind: '', notice: '', do: '', spikes: '' }, rehearsal: '', rehearsed: false,
    support: '', eventStatus: 'not-started', actualActionConfirmed: false, completionReported: false, actual: '', comparison: '', learning: '', nextStep: '', saved: false };
}
export function chooseEvent(state, event) {
  if (!EVENTS.some(item => item.id === event)) return state;
  return { ...state, event, prepareView: 'challenge', selectedMoveId: '', rehearsalChoice: '', rehearsalResponse: '', challenge: '', prediction: state.predictionEdited ? state.prediction : '', saved: false };
}
export function chooseChallenge(state, challenge) {
  if (!EVENTS.find(item => item.id === state.event)?.challenges.includes(challenge)) return state;
  return { ...state, challenge, selectedMoveId: '', rehearsalChoice: '', rehearsalResponse: '', prediction: state.predictionEdited ? state.prediction : GUIDANCE[challenge][0], saved: false };
}
export function preparePlan(state) {
  const guide = GUIDANCE[state.challenge] || GUIDANCE['Feeling overwhelmed'];
  const names = ['mind', 'notice', 'do', 'spikes'];
  return { ...state, phase: 'plan', plan: Object.fromEntries(names.map((name, index) => [name, state.plan[name] || (name === 'mind' ? state.prediction || guide[0] : guide[index + 1])])) };
}
export function beginTackle(state) { return { ...state, phase: 'tackle', eventStatus: state.eventStatus === 'not-started' ? 'in-progress' : state.eventStatus }; }
export function returnToEvent(state) { return { ...state, phase: 'tackle', support: '' }; }
export function confirmReflection(state) {
  if (!state.actualActionConfirmed || !['finished', 'stepped-out', 'not-attempted', 'unknown'].includes(state.eventStatus) || !(state.experienceVersion >= 2 ? PREDICTION_RESULTS.some(([value]) => value === state.predictionResult) : COMPARISONS.some(([value]) => value === state.comparison))) return state;
  return { ...state, phase: 'recap', saved: false };
}
const text = value => typeof value === 'string' ? value.slice(0, 3000) : '';
export function validateTaraState(raw) {
  if (!raw || raw.schemaVersion !== 1 || typeof raw.id !== 'string' || !raw.id || !PHASES.includes(raw.phase)) return null;
  if (raw.experienceVersion !== undefined && ![1, 2, 3].includes(raw.experienceVersion)) return null;
  if (!['not-started', 'in-progress', 'finished', 'stepped-out', 'not-attempted', 'unknown'].includes(raw.eventStatus)) return null;
  if (raw.experienceVersion === 3) {
    const practice = raw.practice;
    const pair = (value, predicate) => Array.isArray(value) && value.length === 2 && value.every(predicate);
    const wording = value => typeof value === 'string' && value.length <= 3000;
    if (!practice || ![0, 1].includes(practice.round) || !['choose', 'try', 'ready'].includes(practice.step)
      || !pair(practice.responses, value => typeof value === 'string' && value.length <= 30)
      || !pair(practice.wordings, wording) || !pair(practice.tried, value => typeof value === 'boolean')
      || (practice.triedWordings !== undefined && !pair(practice.triedWordings, wording))
      || !['', 'usable', 'adjust', 'unsure'].includes(practice.usability)) return null;
  }

  const state = newTaraState();
  for (const key of ['situation', 'prediction', 'rehearsal', 'rehearsalResponse', 'actual', 'learning', 'nextStep']) state[key] = text(raw[key]);
  for (const key of ['predictionEdited', 'rehearsed', 'saved', 'actualActionConfirmed', 'completionReported']) state[key] = raw[key] === true;
  state.experienceVersion = [2, 3].includes(raw.experienceVersion) ? raw.experienceVersion : 1;
  state.carryChoice = ['keep', 'adjust', 'later'].includes(raw.carryChoice) ? raw.carryChoice : '';
  const practice = raw.practice || {};
  state.practice = { round: practice.round === 1 ? 1 : 0, step: ['choose', 'try', 'ready'].includes(practice.step) ? practice.step : 'choose',
    responses: [0, 1].map(index => typeof practice.responses?.[index] === 'string' ? practice.responses[index].slice(0, 30) : ''),
    wordings: [0, 1].map(index => text(practice.wordings?.[index])), triedWordings: [0, 1].map(index => text(practice.triedWordings?.[index])), tried: [0, 1].map(index => practice.tried?.[index] === true),
    usability: ['usable', 'adjust', 'unsure'].includes(practice.usability) ? practice.usability : '' };
  if (state.practice.tried.some(Boolean)) state.rehearsed = true;
  state.selectedMoveId = typeof raw.selectedMoveId === 'string' ? raw.selectedMoveId.slice(0, 30) : '';
  state.rehearsalChoice = ['my-move', 'pause'].includes(raw.rehearsalChoice) ? raw.rehearsalChoice : '';
  if (raw.practice === undefined && state.rehearsalChoice && state.rehearsalResponse) {
    state.practice.responses[0] = state.rehearsalChoice === 'pause' ? 'pause' : 'move';
    state.practice.wordings[0] = state.rehearsalResponse;
    state.practice.step = 'try';
  }
  state.predictionResult = PREDICTION_RESULTS.some(([value]) => value === raw.predictionResult) ? raw.predictionResult : '';
  state.id = raw.id; state.phase = raw.phase; state.eventStatus = raw.eventStatus;
  state.entryMode = ['prepare', 'live'].includes(raw.entryMode) ? raw.entryMode : null;
  state.event = EVENTS.some(item => item.id === raw.event) ? raw.event : '';
  state.prepareView = ['event', 'challenge'].includes(raw.prepareView) ? raw.prepareView : state.event ? 'challenge' : 'event';
  state.challenge = EVENTS.find(item => item.id === state.event)?.challenges.includes(raw.challenge) ? raw.challenge : '';
  state.likelihood = ['unlikely', 'possible', 'likely', 'unsure'].includes(raw.likelihood) ? raw.likelihood : '';
  state.comparison = COMPARISONS.some(([value]) => value === raw.comparison) ? raw.comparison : '';
  state.support = ['racing', 'overwhelmed', 'step-out'].includes(raw.support) ? raw.support : '';
  state.plan = Object.fromEntries(['mind', 'notice', 'do', 'spikes'].map(key => [key, text(raw.plan?.[key])]));
  if (raw.flowScreen !== undefined && !Object.hasOwn(FLOW_PHASES, raw.flowScreen)) return null;
  state.flowScreen = FLOW_PHASES[raw.flowScreen] === state.phase ? raw.flowScreen : screenFor({ ...state, flowScreen: undefined });
  state.savePreference = ['save', 'skip'].includes(raw.savePreference) ? raw.savePreference : '';
  state.actionChoice = ['finished', 'stepped-out', 'not-attempted', 'unknown'].includes(raw.actionChoice) ? raw.actionChoice : '';
  state.paceChoice = ['stay', 'pause'].includes(raw.paceChoice) ? raw.paceChoice : '';
  if (state.phase === 'recap' && (!(state.experienceVersion >= 2 ? state.predictionResult : state.comparison) || !state.actualActionConfirmed || !['finished', 'stepped-out', 'not-attempted', 'unknown'].includes(state.eventStatus))) return null;
  return state;
}
export function taraCompletion(state) {
  // Deliberate coarse fields only. Host integration must allowlist any new enums.
  return { interventionId: TARA_ID, completion: 'completed', saved: state.saved,
    eventStatus: state.eventStatus, predictionComparison: state.comparison || null, predictionResult: state.predictionResult || null, rehearsed: state.rehearsed };
}
