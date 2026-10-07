/** Small, durable screens within the existing care-practice host stages. */
export const CARE_SCREEN_STAGES = Object.freeze({
  intro: 'arrival', before: 'baseline', notice: 'notice', 'notice-own': 'notice',
  response: 'perspective', 'response-own': 'perspective', tone: 'perspective', say: 'practice',
  pattern: 'perspective', frame: 'practice', action: 'action', 'action-own': 'action',
  anchor: 'perspective', 'anchor-own': 'perspective', outside: 'practice', allow: 'practice',
  return: 'practice', 'return-next': 'practice', 're-hook': 'practice', status: 'action',
  after: 'rerate', save: 'complete', card: 'complete', options: 'arrival', orient: 'orient',
});
export const CARE_SCREEN_PATHS = Object.freeze({
  selfCompassion: ['intro','before','notice','response','tone','say','action','status','after','save','card'],
  unhook: ['intro','before','notice','pattern','frame','action','anchor','return','return-next','status','after','save','card'],
  makeRoom: ['intro','before','notice','anchor','outside','allow','action','status','after','save','card'],
});
export const validCareScreen = value => typeof value === 'string' && Object.hasOwn(CARE_SCREEN_STAGES, value);
export function validCareScreenFor(id, screen) {
  const extra = ['notice-own','action-own','options','orient', ...(id === 'selfCompassion' ? ['response-own'] : id === 'unhook' ? ['anchor-own','re-hook'] : ['anchor-own'])];
  return !!CARE_SCREEN_PATHS[id] && (CARE_SCREEN_PATHS[id].includes(screen) || extra.includes(screen));
}
export function careScreen(id, state, choices = {}) {
  // A stopped feeling practice must ask for a gentle moment again before re-entering it.
  if (id === 'makeRoom' && state.careScreen === 'allow' && (!['small','more'].includes(state.allowance) || !['object','sound','support'].includes(state.anchorType))) return ['object','sound','support'].includes(state.anchorType) ? 'outside' : 'anchor';
  if (validCareScreenFor(id, state.careScreen)) return state.careScreen;
  // Existing version-1 drafts/cards retain their text and actual self-reports.
  if (state.stage === 'arrival') return 'intro';
  if (state.stage === 'baseline') return 'before';
  if (state.stage === 'notice') return state.notice?.trim() && Array.isArray(choices.notices) && !choices.notices.includes(state.notice) ? 'notice-own' : 'notice';
  if (state.stage === 'rerate') return 'after';
  if (state.stage === 'complete') return 'card';
  if (state.stage === 'orient') return 'orient';
  if (state.stage === 'action') return state.action?.trim() && ['planned','done'].includes(state.actionStatus) ? 'status' : state.action?.trim() && Array.isArray(choices.actions) && !choices.actions.includes(state.action) ? 'action-own' : 'action';
  if (id === 'selfCompassion') return state.perspective ? 'say' : 'response';
  if (id === 'unhook') {
    if (!state.perspective) return 'pattern';
    if (!state.practiceTaken || state.defusionStep < 2) return 'frame';
    if (!state.action?.trim() || !['planned','done'].includes(state.actionStatus)) return state.action?.trim() && Array.isArray(choices.actions) && !choices.actions.includes(state.action) ? 'action-own' : 'action';
    if (!state.anchorType) return 'anchor';
    if (state.distance === 'near') return 're-hook';
    return state.anchorNoticed ? 'return-next' : 'return';
  }
  return !['object','sound','support'].includes(state.anchorType) ? 'anchor' : state.allowance ? 'allow' : 'outside';
}
export function careForwardPatch(id, state, from, to, values = {}) {
  if (!validCareScreenFor(id, to)) throw new Error('Unknown care screen');
  const history = Array.isArray(state.careTrail) ? state.careTrail : [];
  return { ...values, stage: CARE_SCREEN_STAGES[to], careScreen: to, careTrail: from === to ? history : [...history, from].slice(-64) };
}
export function careBackPatch(id, state, from) {
  const history = (state.careTrail || []).filter(step => validCareScreenFor(id, step));
  let to = history.at(-1);
  if (!to) {
    const custom = { 'notice-own': 'notice', 'response-own': 'response', 'action-own': 'action', 'anchor-own': 'anchor', 're-hook': 'return-next', options: 'card', orient: id === 'selfCompassion' ? 'say' : id === 'unhook' ? 'return' : 'outside' };
    const path = CARE_SCREEN_PATHS[id];
    to = custom[from] || path[Math.max(0, path.indexOf(from) - 1)];
  }
  const trail = history.slice(0, -1);
  if (id === 'makeRoom' && from === 'orient' && to === 'allow' && !state.allowance) {
    to = state.anchorType ? 'outside' : 'anchor';
    if (trail.at(-1) === to) trail.pop();
  }
  return { stage: CARE_SCREEN_STAGES[to], careScreen: to, careTrail: trail };
}
export function careNextAfterNotice(id) { return id === 'selfCompassion' ? 'response' : id === 'unhook' ? 'pattern' : 'anchor'; }
export function careSavedMatches(state, saved) {
  return !!saved && ['notice','perspective','action','actionStatus','before','after','practiceTaken','responseTone','anchorType','anchorText'].every(key => state[key] === saved[key]);
}

export function careScreenProgress(id, state, screen) {
  const related = { 'notice-own': 'notice', 'response-own': 'response', 'action-own': 'action', 'anchor-own': 'anchor', 're-hook': 'return',  };
  const path = CARE_SCREEN_PATHS[id];
  const context = ['options','orient'].includes(screen) ? state.careTrail?.at(-1) || 'intro' : screen;
  return Math.max(0, path.indexOf(related[context] || context)) / (path.length - 1) * 7;
}

export function careScreenResumeLabel(id, screen) {
  const notice = id === 'selfCompassion' ? 'the critical line' : id === 'unhook' ? 'the thought' : 'the feeling';
  return { intro: 'Your beginning', before: 'Your starting rating', notice: `Naming ${notice}`, 'notice-own': `Writing ${notice}`, response: 'Choosing a caring response', 'response-own': 'Writing a caring response', tone: 'Choosing a tone', say: 'Saying the caring response', pattern: 'Naming the mental pattern', frame: 'Trying the noticing phrase', action: 'Choosing a useful step', 'action-own': 'Writing your own next step', anchor: 'Choosing an outside anchor', 'anchor-own': 'Naming your outside anchor', outside: 'Staying with your outside anchor', allow: 'A gentle moment with the feeling', return: 'Returning attention to your step', 'return-next': 'Choosing whether to continue or return again', 're-hook': 'Another return of attention', status: 'Marking your step as planned or done', after: 'Your after-practice rating', save: 'Choosing whether to save your card', card: 'Your personal card', options: 'Practice options', orient: 'Back with the room' }[screen];
}
