/** Deterministic suggestions, never an assessment of the user's thought or feeling. */
export const COMPASSION_STARTERS = [
  { line: 'I messed everything up.', response: 'I made a mistake. I can care for myself and repair what I can.', need: 'repair' },
  { line: 'I should be doing more.', response: 'My capacity matters too. I can choose one realistic step.', need: 'rest' },
  { line: 'I am not good enough.', response: 'This is a painful thought. I do not have to earn basic kindness.', need: 'support' },
];
export function compassionateSuggestions(line) {
  const match = COMPASSION_STARTERS.find(item => item.line === line);
  return [...new Set([match?.response || 'This is hard. I can meet this moment without attacking myself.', 'I can take responsibility and still treat myself with care.', 'I would not speak to someone I care about this way. I can try a steadier voice.'])];
}
export const EXTERNAL_ANCHORS = {
  object: { label: 'Something I can see', short: 'the object', instruction: 'Look at one ordinary object. Notice its colour and edges.', prompt: 'An object or colour nearby', example: 'The blue mug' },
  sound: { label: 'A sound in the room', short: 'the sound', instruction: 'Listen for one sound already here. No need to search for silence.', prompt: 'A sound already here', example: 'The fan' },
  support: { label: 'The surface supporting me', short: 'the support', instruction: 'Notice the chair, floor or surface supporting you. Keep your eyes open.', prompt: 'The surface supporting me', example: 'My chair' },
};
export const CARE_ACTIONS = {
  selfCompassion: [
    { label: 'Give myself a pause', action: 'Take a two-minute pause', kind: 'rest', detail: 'Make space for my capacity.' },
    { label: 'Ask for support', action: 'Ask someone safe for a little help', kind: 'support', detail: 'I do not have to carry everything alone.' },
    { label: 'Repair one small thing', action: 'Take one small step to repair what I can', kind: 'repair', detail: 'Care and responsibility can go together.' },
  ],
  unhook: [
    { label: 'Return to the task', action: 'Read the next sentence or open the next thing', detail: 'Give attention to one useful step.' },
    { label: 'Be with someone', action: 'Listen to the next thing the person with me says', detail: 'Bring attention to connection.' },
    { label: 'Care for myself', action: 'Get water or take a short, ordinary break', detail: 'Put attention into a concrete act of care.' },
  ],
  makeRoom: [
    { label: 'Do one everyday thing', action: 'Get a glass of water', detail: 'Let the feeling come with me.' },
    { label: 'Make my setting easier', action: 'Move somewhere more comfortable', detail: 'Support myself in the real world.' },
    { label: 'Return gently', action: 'Take the first small step of my next task', detail: 'A feeling can be here while I act.' },
  ],
};
export function noticingPhrase(thought) {
  const clean = thought.trim();
  if (!clean) return 'I am noticing a thought, and I can choose where my attention goes next.';
  const prefix = 'I am noticing the thought: “';
  const limit = 300 - prefix.length - 1;
  return `${prefix}${clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean}”`;
}
export function makeRoomPhrase(feeling) {
  return feeling.trim().length <= 60 && feeling.trim()
    ? `I can give ${feeling.trim().toLowerCase()} a little room and stay connected to what is around me.`
    : 'I can give this feeling a little room, stay connected to the room, and choose a useful step.';
}
export function careMilestone(id, s) {
  const short = value => value.length > 72 ? `${value.slice(0, 69)}…` : value;
  if (s.stage === 'baseline' && Number.isInteger(s.before)) return `Your starting point: ${s.before} / 10. Your own words come next.`;
  if (s.actionStatus === 'done') return `You marked your step as done: ${short(s.action)}.`;
  if (s.actionStatus === 'planned') return `Your next step is a plan: ${short(s.action)}.`;
  if (s.stage === 'action' && s.action) return `Your chosen direction: ${short(s.action)}.`;
  if (id === 'selfCompassion') {
    if (s.responseRead) return `A response to carry: ${short(s.perspective)}`;
    if (s.perspective) return `A caring draft for your own words: ${short(s.perspective)}`;
    if (s.notice) return `You named the line: “${short(s.notice)}”`;
    return 'Start with words you can believe. A small amount of care is enough.';
  }
  if (id === 'unhook') {
    if (s.anchorNoticed) return `Your attention anchor: ${short(s.anchorText || EXTERNAL_ANCHORS[s.anchorType]?.short || 'something in the room')}.`;
    if (s.distance === 'beside') return 'The thought is still here. You have practised putting it beside your attention.';
    if (s.defusionStep) return `Notice the thought: “${short(s.notice || 'the words in your mind')}”`;
    return s.notice ? `Your practice uses your thought: “${short(s.notice)}”` : 'You can practise a different relationship with a thought.';
  }
  if (s.attentionFocused) return `Back with ${short(s.anchorText || EXTERNAL_ANCHORS[s.anchorType]?.short || 'the room')}. The feeling can stay.`;
  if (s.allowance) return `You chose ${s.allowance === 'small' ? 'a little room' : 'more room'} for ${short(s.notice || 'this feeling')}.`;
  if (s.anchorType) return `A steady point nearby: ${short(s.anchorText || EXTERNAL_ANCHORS[s.anchorType].short)}.`;
  return s.notice ? `You named ${short(s.notice)}. You choose how much to notice.` : 'You choose the pace and how much attention to give the feeling.';
}
