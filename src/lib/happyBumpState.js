// Energy is descriptive. Only explicit helpfulness is used as recommendation feedback.
export const WALK_MINUTES = [1, 3, 5];
export { HELPFULNESS, helpfulnessResponse } from "./attemptFeedback.js";
export const answeredEnergy = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 10;
export function energyOutcome(state) {
  const start = answeredEnergy(state.baseline) ? state.baseline : null;
  const end = answeredEnergy(state.current) ? state.current : null;
  return { scale: 'energy', start, end, shift: start == null || end == null ? null : end - start, helpfulness: state.helpfulness || null };
}
export const walkSeconds = (state) => (WALK_MINUTES.includes(state.walkMinutes) ? state.walkMinutes : 3) * 60;
export function walkElapsed(state, now = Date.now()) {
  return Math.min(walkSeconds(state), Math.max(0, (state.elapsedBeforePause || 0) + (state.startedAt != null && !state.paused ? (now - state.startedAt) / 1000 : 0)));
}
export function toggleWalkPause(state, now = Date.now()) {
  return state.paused ? { ...state, paused: false, startedAt: now } : { ...state, paused: true, elapsedBeforePause: walkElapsed(state, now), startedAt: null };
}
export function leaveWalk(state, status, now = Date.now()) {
  return { ...state, walkStatus: status, elapsedBeforePause: walkElapsed(state, now), startedAt: null, paused: false, scene: 'connection' };
}
export function restoreBumpState(initial, saved) {
  const state = { ...initial, ...saved };
  // Old defaults and selected actions were not evidence of answers/completion.
  if (saved?.version !== 2) Object.assign(state, { baseline: null, current: null, helpfulness: null, walkStatus: null, taskStatus: null, contactStatus: null });
  state.version = 2;
  // Legacy drafts have no confirmation flags. Only an already-departed rating
  // screen is evidence of confirmation; a slider being edited is not.
  state.baselineConfirmed = saved?.baselineConfirmed ?? (answeredEnergy(state.baseline) && !['arrival', 'baseline'].includes(state.scene));
  state.currentConfirmed = saved?.currentConfirmed ?? (answeredEnergy(state.current) && ['helpfulness', 'complete'].includes(state.scene));
  if (state.scene === 'move') Object.assign(state, {elapsedBeforePause:walkElapsed(state),startedAt:null,paused:true});
  if (['grateful', 'anticipate'].includes(state.scene)) state.scene = 'proud';
  if (state.scene === 'reveal') state.scene = 'complete';
  if (state.scene === 'mission' && !state.task) state.scene = 'win';
  if (state.scene === 'nextPlan' && !state.nextMode) state.scene = 'nextMode';
  if (state.scene === 'areaAction' && !state.lifeArea) state.scene = 'lifeArea';
  if (state.scene === 'comfortIdea' && !state.activeSense) state.scene = 'comfortSense';
  if (['pairing', 'reward', 'comfortSense', 'comfortIdea'].includes(state.scene) && !state.nextActivity?.trim()) state.scene = 'nextPlan';
  return state;
}
export function bumpRecap(state) {
  const items = [];
  if (state.hydrated) items.push('Had some water');
  if (state.aired) items.push('Got some air or light');
  if (state.walkStatus === 'completed') items.push(state.environment === 'inside' ? 'Finished an indoor walk' : 'Finished a walk');
  if (state.walkStatus === 'started') items.push('Took a shorter walk');
  if (state.walkStatus === 'skipped') items.push('Skipped the walk');
  if (state.contactStatus === 'contacted') items.push('Reached out to someone');
  else if (state.contactStatus === 'attempted') items.push('Tried to reach someone');
  else if (state.connection && state.connection !== 'skipped') items.push('Opened a contact app');
  if (state.taskStatus) items.push(`${state.taskStatus === 'completed' ? 'Finished' : state.taskStatus === 'started' ? 'Started' : 'Skipped'}${state.task ? `: ${state.task}` : ' the small task'}`);
  if (state.areaAction) items.push(`Planned: ${state.areaAction}`);
  if (state.nextActivity) items.push(`Next: ${state.nextActivity}${state.pairing ? ` · with ${state.pairing}` : ''}${state.reward ? ` · then ${state.reward}` : ''}`);
  if (state.comfortIdea || state.customComfortIdea) items.push(`Comfort: ${state.customComfortIdea || state.comfortIdea}`);
  return items.length ? items : ['You reached the end. No actions were marked complete.'];
}
