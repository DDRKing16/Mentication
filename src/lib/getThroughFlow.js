export const GET_THROUGH_TITLE = 'Let’s get through this';
export const FLOW_PHASES = {
  entry: 'entry', timing: 'prepare', event: 'prepare', challenge: 'prepare',
  prediction: 'plan', move: 'plan', 'move-confirm': 'plan',
  'practice-choose': 'rehearse', 'practice-try': 'rehearse', usability: 'ready', ready: 'ready',
  live: 'tackle', support: 'support', pace: 'support',
  'reflect-action': 'reflect', 'reflect-prediction': 'reflect', 'reflect-observation': 'reflect',
  'next-step': 'recap', recap: 'recap',
};
export const FLOW_SCREENS = Object.keys(FLOW_PHASES);
export function screenFor(state) {
  if (FLOW_PHASES[state.flowScreen] === state.phase) return state.flowScreen;
  if (state.phase === 'prepare') return state.event && state.prepareView !== 'event' ? 'challenge' : 'event';
  if (state.phase === 'plan') return state.plan.do ? 'move-confirm' : 'move';
  if (state.phase === 'rehearse') return state.practice.step === 'try' ? 'practice-try' : 'practice-choose';
  if (state.phase === 'tackle') return 'live';
  if (state.phase === 'support') return state.support === 'step-out' ? 'pace' : 'support';
  if (state.phase === 'reflect') return !state.actualActionConfirmed ? 'reflect-action' : !state.predictionResult ? 'reflect-prediction' : 'reflect-observation';
  if (state.phase === 'recap') return state.nextStep || state.saved || state.completionReported ? 'recap' : 'next-step';
  return state.phase === 'ready' ? 'ready' : 'entry';
}
export function atScreen(state, screen) {
  if (!FLOW_SCREENS.includes(screen)) return state;
  return { ...state, flowScreen: screen, phase: FLOW_PHASES[screen] };
}
export function resumeFromEntry(state) {
  if (state.actualActionConfirmed) return atScreen(state, state.nextStep || state.savePreference ? 'recap' : state.predictionResult ? 'reflect-observation' : 'reflect-prediction');
  if (state.practice.step === 'ready' || state.practice.tried.every(Boolean)) return atScreen(state, 'ready');
  if (state.practice.tried[0] || state.practice.responses[0]) {
    const round = state.practice.tried[0] ? 1 : 0;
    const step = state.practice.responses[round] ? 'try' : 'choose';
    return atScreen({ ...state, practice: { ...state.practice, round, step } }, step === 'try' ? 'practice-try' : 'practice-choose');
  }
  return atScreen(state, state.plan.do ? 'move-confirm' : state.challenge ? 'move' : state.event ? 'challenge' : state.entryMode === 'live' ? 'live' : 'event');
}
// Fallback after refresh, when this mount does not own a previous history entry.
// Changing the viewed question never rewinds words, outcomes or confirmed tries.
export function previousScreen(state) {
  const screen = screenFor(state);
  if (screen === 'practice-choose' && state.practice.round === 1) return atScreen({ ...state, practice: { ...state.practice, round: 0, step: 'try' } }, 'practice-try');
  const previous = { timing: 'entry', event: 'timing', challenge: 'event', prediction: 'challenge', move: 'prediction', 'move-confirm': 'move',
    'practice-choose': 'move-confirm', 'practice-try': 'practice-choose', usability: 'practice-try', ready: state.practice.tried.some(Boolean) ? 'usability' : 'move-confirm',
    live: state.entryMode === 'live' ? 'timing' : 'ready', support: 'live', pace: 'live',
    'reflect-action': 'live', 'reflect-prediction': 'reflect-action', 'reflect-observation': 'reflect-prediction', 'next-step': 'reflect-observation', recap: 'next-step' }[screen];
  const next = previous === 'practice-try' ? { ...state, practice: { ...state.practice, step: 'try' } }
    : previous === 'practice-choose' ? { ...state, practice: { ...state.practice, step: 'choose' } } : state;
  return previous ? atScreen(next, previous) : state;
}
