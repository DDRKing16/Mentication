import { validCareScreen } from './careQuestionFlow.js';
import { careMilestone } from './carePracticeDesign.js';
/** Original practice copy. Clinical rationale and host contract: docs/handoffs/care-practices.md. */
export const CARE_PRACTICES = Object.freeze({
  selfCompassion: {
    title: 'Self-Compassion', goal: 'calm', accent: '#f5c2ad', motif: 'shelter',
    intro: 'Turn a harsh line into a caring response you can believe, then one act of support.',
    question: 'How harsh is your self-talk right now?', left: 'Not harsh', right: 'Extremely harsh',
    noticeTitle: 'What is the critical line?', noticeBody: 'Choose a familiar line or write the words your mind is using. A few words are enough.',
    noticeLabel: 'The critical line', notices: ['I should have done better.', 'I always get it wrong.', 'I am falling behind.'],
    perspectiveTitle: 'How would you answer someone you care about?', perspectiveBody: 'Keep the difficulty in view. Choose words you can believe, even a little.',
    perspectiveLabel: 'A compassionate response', perspectives: ['This is hard. One mistake is not the whole of me.', 'I can take responsibility without attacking myself.', 'I am having a difficult moment and deserve some care.'],
    practiceTitle: 'Let the kinder response have a little space.', practiceBody: 'Read your response slowly, as if speaking to someone you care about. Let your tone be steady. You do not need to feel convinced or positive.',
    actionTitle: 'What would care look like next?', actions: ['Take a short rest', 'Ask for a little help', 'Make one small repair'],
    returnLine: 'When the critic returns, answer with care and choose one supportive step.',
    reveals: ['You have noticed the critic. That gives you a place to begin.', 'A fair response can hold both difficulty and care.', 'Compassion can become something you do.'],
  },
  unhook: {
    title: 'Unhook from the Thought', goal: 'reset', accent: '#b9d5f5', motif: 'thread',
    intro: 'Practise seeing a thought as a thought, then return your attention to something useful.',
    question: 'How caught up in this thought are you right now?', left: 'Not caught up', right: 'Completely caught up',
    noticeTitle: 'Which thought keeps pulling you in?', noticeBody: 'Use a few words. We will practise noticing the thought without deciding whether it is true.',
    noticeLabel: 'The sticky thought', notices: ['Something will go wrong.', 'I cannot do this.', 'They will judge me.'],
    perspectiveTitle: 'Give the thought a name.', perspectiveBody: 'Try a label that helps you recognise what your mind is doing. You can edit it to fit.',
    perspectiveLabel: 'A noticing phrase', perspectives: ['My mind is predicting trouble.', 'I am noticing a familiar story.', 'Here is my mind judging again.'],
    practiceTitle: 'A thought is here. So is the room.', practiceBody: 'Say your noticing phrase quietly. Then notice one colour or sound nearby. Let attention rest there for a moment. The thought can still be present.',
    actionTitle: 'Where do you want to put your attention?', actions: ['Read the next sentence', 'Listen to the person with me', 'Open the thing I want to work on'],
    returnLine: 'When the thought pulls again, name it and gently return to your chosen action.',
    reveals: ['You are noticing the thought that has your attention.', 'Naming the pattern creates another way to respond.', 'You can choose your next move while the thought is here.'],
  },
  makeRoom: {
    title: 'Make Room for the Feeling', goal: 'calm', accent: '#c5d6b7', motif: 'room',
    intro: 'Give a manageable feeling some room while staying connected to your surroundings.',
    question: 'How much are you struggling with this feeling right now?', left: 'Not struggling', right: 'Struggling a lot',
    noticeTitle: 'What feeling is here?', noticeBody: 'Choose something manageable right now. No need to recall a difficult event or search your body.',
    noticeLabel: 'The feeling', notices: ['Sadness', 'Worry', 'Frustration', 'Hard to name'],
    perspectiveTitle: 'Choose a little room.', perspectiveBody: 'Keep your eyes open. For a few moments, try letting this feeling be present without pushing it away. Stop or look around whenever you want.',
    perspectiveLabel: 'A phrase to try', perspectives: ['This feeling can be here for this moment.', 'I can let this be uncomfortable without solving it now.', 'I can notice a little, then look around.'],
    practiceTitle: 'Let the feeling have a little room.', practiceBody: 'Notice it lightly, only as much as feels workable. Let your breathing be ordinary. Also notice the support of the chair or a nearby object. Nothing has to intensify or disappear.',
    actionTitle: 'What can you do with the feeling here?', actions: ['Get a glass of water', 'Step somewhere more comfortable', 'Return to one small everyday task'],
    returnLine: 'Make a little room, stay connected to your surroundings, and choose your next step.',
    reveals: ['You have named what is here without needing the whole story.', 'You choose how much attention to give the feeling.', 'The feeling and a useful next step can both be here.'],
  },
});
export const CARE_STAGES = ['arrival', 'baseline', 'notice', 'perspective', 'practice', 'action', 'rerate', 'complete'];
export const validCareRating = value => Number.isInteger(value) && value >= 0 && value <= 10;
export function freshCareState() {
  return { version: 1, careScreen: null, careTrail: [], stage: 'arrival', before: null, after: null, notice: '', perspective: '', action: '', clicks: 0, milestone: '', practiceTaken: false, actionStatus: null, responseRead: false, responseTone: 'steady', defusionStep: 0, distance: 'near', anchorType: null, anchorText: '', anchorNoticed: false, allowance: null, attentionFocused: false };
}
export function restoreCareState(value) {
  const s = freshCareState();
  if (!value || value.version !== 1) return s;
  for (const key of ['notice', 'perspective', 'action', 'milestone', 'anchorText']) if (typeof value[key] === 'string') s[key] = value[key].slice(0, 300);
  if ([...CARE_STAGES, 'orient'].includes(value.stage)) s.stage = value.stage;
  s.careScreen = validCareScreen(value.careScreen) ? value.careScreen : null;
  s.careTrail = Array.isArray(value.careTrail) ? value.careTrail.filter(validCareScreen).slice(-64) : [];
  for (const key of ['before', 'after']) s[key] = validCareRating(value[key]) ? value[key] : null;
  s.clicks = Number.isSafeInteger(value.clicks) && value.clicks >= 0 ? value.clicks : 0;
  s.practiceTaken = value.practiceTaken === true;
  s.actionStatus = ['done', 'planned', 'not-now'].includes(value.actionStatus) ? value.actionStatus : null;
  s.responseRead = value.responseRead === true;
  s.responseTone = ['steady', 'gentle'].includes(value.responseTone) ? value.responseTone : 'steady';
  s.defusionStep = [0, 1, 2].includes(value.defusionStep) ? value.defusionStep : 0;
  s.distance = value.distance === 'beside' ? 'beside' : 'near';
  s.anchorType = ['object', 'sound', 'support'].includes(value.anchorType) ? value.anchorType : null;
  s.anchorNoticed = value.anchorNoticed === true;
  s.allowance = ['small', 'more'].includes(value.allowance) ? value.allowance : null;
  s.attentionFocused = value.attentionFocused === true;
  return s;
}
export function careClick(state, id) {
  const clicks = state.clicks + 1;
  return { ...state, clicks, milestone: clicks % 2 === 0 ? careMilestone(id, state) : state.milestone };
}
export function careOutcome(id, state) {
  const config = CARE_PRACTICES[id];
  return { practice: id, assessment: { question: config.question, left: config.left, right: config.right, min: 0, max: 10, before: state.before, after: state.after }, change: validCareRating(state.before) && validCareRating(state.after) ? state.after - state.before : null, practiceTaken: state.practiceTaken, actionStatus: state.actionStatus };
}
