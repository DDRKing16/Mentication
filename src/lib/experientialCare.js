/** Original UI language; these labels describe the user's choice, not an assessment. */
export const MIND_PATTERNS = [
  { id: 'predicting', label: 'Predicting', hint: 'What might happen', phrase: 'My mind is predicting' },
  { id: 'judging', label: 'Judging', hint: 'A verdict about me', phrase: 'My mind is judging' },
  { id: 'replaying', label: 'Replaying', hint: 'Going over what happened', phrase: 'My mind is replaying' },
  { id: 'noticing', label: 'Just a thought', hint: 'None of those quite fit', phrase: 'I am noticing the thought' },
];
export const UNHOOK_STEPS = [
  { action: 'Read the next sentence', label: 'Read one sentence', detail: 'Return to the words in front of me.', target: 'The words in front of me', cue: 'Find the next sentence. Notice one word, then give that line your attention.' },
  { action: 'Listen to the next thing the person with me says', label: 'Listen to someone', detail: 'Return to connection.', target: 'The voice I want to hear', cue: 'Listen to the next few words. Let the thought be here while you attend to the person.' },
  { action: 'Open the next thing I want to work on', label: 'Begin my next task', detail: 'Return to something I chose.', target: 'The thing I want to begin', cue: 'Bring the task into view. Notice its first detail, then begin one small part.' },
];
export const ROOM_STEPS = [
  { action: 'Get a glass of water', label: 'Get a glass of water', detail: 'An ordinary act of care.' },
  { action: 'Move somewhere more comfortable', label: 'Make my setting easier', detail: 'Support myself where I am.' },
  { action: 'Take the first small step of my next task', label: 'Begin one everyday thing', detail: 'Let the feeling come along.' },
];
export function mindPattern(perspective = '') {
  return MIND_PATTERNS.find(pattern => perspective.startsWith(pattern.phrase)) || MIND_PATTERNS[3];
}
export function mindPhrase(patternId, thought = '') {
  const prefix = (MIND_PATTERNS.find(pattern => pattern.id === patternId) || MIND_PATTERNS[3]).phrase;
  // Draft schema caps the noticing phrase at 300. The exact thought remains separate and uncut in the UI.
  return thought.trim() ? `${prefix}: “${thought}”`.slice(0, 300) : `${prefix}, held in mind.`;
}
export function unhookPhase(s) {
  if (s.defusionStep < 2 || !s.practiceTaken) return 'notice';
  if (!s.action.trim() || !['planned', 'done'].includes(s.actionStatus)) return 'direction';
  return 'attention';
}
export function actionAttention(action = '') {
  const exact = UNHOOK_STEPS.find(step => step.action === action);
  if (exact) return { ...exact, preferred: action === UNHOOK_STEPS[1].action ? 'sound' : 'object' };
  // Route a user's literal action words to a practical cue, never assess the thought.
  if (/^\s*read\b/i.test(action)) return { preferred: 'object', target: 'The line I chose to read', cue: 'Find the line you chose. Notice one word, then give that line your attention.' };
  if (/^\s*(listen|hear)\b/i.test(action)) return { preferred: 'sound', target: 'The sound I chose to hear', cue: 'Listen for the sound you chose. Give it a moment of attention, with the thought still here.' };
  return { preferred: 'object', target: 'One detail of my next step', cue: 'Bring this step into view. Find one ordinary detail of it to attend to. The thought can come along.' };
}
export function attentionTarget(s) {
  if (s.anchorText) return s.anchorText;
  const attention = actionAttention(s.action);
  return s.anchorType === attention.preferred ? attention.target : OUTSIDE_ANCHORS[s.anchorType]?.fallback || attention.target;
}
export const OUTSIDE_ANCHORS = {
  object: { label: 'See', name: 'Something I can see', fallback: 'One object nearby', cue: 'Look at an ordinary object. Notice an edge or colour.', example: 'The edge of my desk' },
  sound: { label: 'Hear', name: 'Something I can hear', fallback: 'One sound already here', cue: 'Listen to a sound already here. Notice it for a moment.', example: 'The hum of the fan' },
  support: { label: 'Feel support', name: 'The surface supporting me', fallback: 'The surface supporting me', cue: 'Notice the chair, floor or surface supporting you.', example: 'My chair' },
};
export function anchorName(s) { return s.anchorText || OUTSIDE_ANCHORS[s.anchorType]?.fallback || 'something around me'; }
export function roomPhase(s) { return s.allowance ? 'allow' : 'anchor'; }
export function assessmentText(s) {
  if (s.before === null || s.after === null) return 'One or both ratings were blank, so there is no score comparison.';
  return `${s.before} → ${s.after} / 10 · ${s.after === s.before ? 'You reported no change.' : s.after < s.before ? 'You reported less difficulty.' : 'You reported more difficulty.'}`;
}
