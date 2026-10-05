export const NEXT_STEP_KEY = 'mentication_nes_v2_app_state';
export const freshNextStep = () => ({ screen: 'landing', task: null, category: null, brainState: null, ladder: [], currentStepIndex: 0, winsToday: 0, pathLength: 'speedy', startedAt: Date.now(), submitted: false, gettingStarted: null, helpfulness: null });
export function restoreNextStep() {
  try {
    const raw = localStorage.getItem(NEXT_STEP_KEY);
    if (!raw) return { state: freshNextStep(), error: null };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.ladder) || parsed.ladder.length > 20 || parsed.ladder.some(step => !step || typeof step.title !== 'string' || typeof step.micro !== 'string' || !Array.isArray(step.easier) || step.easier.some(value => typeof value !== 'string'))) throw new Error('Invalid task');
    // Legacy counters claimed progress without explicit step states. Do not reuse them.
    const ladder = parsed.ladder.map(step => ({ ...step, status: ['done', 'skipped'].includes(step.status) ? step.status : null }));
    const firstPending = ladder.findIndex(step => !step.status);
    return { state: { ...freshNextStep(), task: typeof parsed.task === 'string' ? parsed.task : '', ladder, pathLength: ['speedy', 'regular', 'mini'].includes(parsed.pathLength) ? parsed.pathLength : 'speedy', currentStepIndex: firstPending < 0 ? ladder.length : firstPending, winsToday: ladder.filter(step => step.status === 'done').length, submitted: parsed.submitted === true, gettingStarted: ['easier', 'same', 'harder', 'unsure'].includes(parsed.gettingStarted) ? parsed.gettingStarted : null, helpfulness: ['helpful', 'same', 'worse', 'unsure'].includes(parsed.helpfulness) ? parsed.helpfulness : null, startedAt: Number.isFinite(parsed.startedAt) ? parsed.startedAt : Date.now() }, error: null };
  } catch {
    return { state: freshNextStep(), error: 'Saved task could not be read. You can start a new task; previous progress is unavailable.' };
  }
}
export function advanceNextStep(state, status) {
  if (!['done', 'skipped'].includes(status) || state.screen !== 'focus' || !state.ladder[state.currentStepIndex] || state.ladder[state.currentStepIndex].status) return state;
  const ladder = state.ladder.map((step, index) => index === state.currentStepIndex ? { ...step, status } : step);
  const next = state.currentStepIndex + 1;
  return { ...state, ladder, currentStepIndex: next, winsToday: ladder.filter(step => step.status === 'done').length, screen: next >= ladder.length ? 'dashboard' : 'focus' };
}
export function undoNextStep(state) {
  if (!state.currentStepIndex || state.submitted) return state;
  const index = state.currentStepIndex - 1;
  const ladder = state.ladder.map((step, i) => i === index ? { ...step, status: null } : step);
  return { ...state, ladder, currentStepIndex: index, winsToday: ladder.filter(step => step.status === 'done').length, screen: 'focus' };
}
export function replaceNextStep(state, title) {
  if (!title.trim() || !state.ladder[state.currentStepIndex] || state.submitted) return state;
  return { ...state, ladder: state.ladder.map((step, index) => index === state.currentStepIndex ? { ...step, title, micro: 'Try just this action. Mark Done only after doing it.', status: null } : step) };
}
