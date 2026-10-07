import { tacticFor } from './taraTactics';

// Built-in coaching, not model output. Cues describe a practice moment rather
// than predicting another person's reaction or declaring a real-world outcome.
export const TARA_GUIDANCE = {
  'Finding the words': { insight: 'You do not need the whole answer. Give yourself a way back to one point.', recovery: 'You lose your place again, halfway through the point.', reset: 'Look at one steady detail. Return to the one point I want to make.', smaller: 'Say just my first line, then pause before the next sentence.', backups: [['pause', 'Ask for a moment', '“Give me a moment. I want to get this clear.”', 'A pause makes room for your next sentence.'], ['point', 'Return to one point', '“The main thing I want to say is…”', 'A single point gives you somewhere to return.'], ['return', 'Continue later', '“I need to pause this. I’ll decide when to come back.”', 'You can choose the pace without promising a time you cannot keep.']] },
  'Holding a boundary': { insight: 'A useful limit says what you can do. It does not need to control the response.', recovery: 'You notice the urge to explain more than you want to.', reset: 'Check what I can genuinely agree to before answering.', smaller: 'Name one limit without adding a long explanation.', backups: [['repeat', 'Repeat the limit', '“That is what I can offer.”', 'Repeating a clear limit keeps your answer consistent.'], ['time', 'Decide later', '“I’m not ready to agree. I need time to decide.”', 'Time protects a decision you have not made yet.'], ['pause', 'Pause the conversation', '“I need to stop here for now.”', 'Pausing is an available boundary too.']] },
  'Feeling judged': { insight: 'You can return to what you came to say or do, even while uncertainty is there.', recovery: 'You start checking faces instead of following your point.', reset: 'Look at my note or task. Find the next useful action.', smaller: 'Return to one useful point or question, rather than checking every reaction.', backups: [['point', 'Use my anchor point', 'Return to the one thing I came here to say or do.', 'An anchor gives your attention a practical destination.'], ['ask', 'Ask a useful question', '“What do you need from me next?”', 'A practical question gives you information instead of a guessed judgement.'], ['pause', 'Take a quiet pause', 'Feel where I am sitting or standing. Then choose my next step.', 'A brief pause gives you room to choose where to put your attention.']] },
  'Getting started': { insight: 'Make the start visible and small. Finishing the whole task is a different decision.', recovery: 'After the first step, the rest of the task starts to feel large.', reset: 'Put only the first thing I need in front of me.', smaller: 'Get one thing ready. Decide about the next step afterwards.', backups: [['one', 'Shrink the next step', 'Choose one small piece and leave the rest for later.', 'A defined piece reduces the size of the immediate decision.'], ['help', 'Ask for one detail', 'Ask for the one practical detail I need to continue.', 'You can get information without having to solve the whole task.'], ['pause', 'Stop and reassess', 'Pause here. Decide whether to continue, change the step, or return later.', 'Stopping to reassess does not erase the action you took.']] },
  'Making a mistake': { insight: 'Choose a step you can check. You do not have to remove every uncertainty first.', recovery: 'You find something in this step that needs checking.', reset: 'Pause at this step. Check one thing before moving on.', smaller: 'Make or check one small part before committing to the rest.', backups: [['check', 'Check one thing', 'Check this one part against what the task needs.', 'One check gives you specific information about this step.'], ['ask', 'Get another view', '“Could you help me check this part?”', 'A second view can help with the part you are unsure about.'], ['adjust', 'Adjust one part', 'Make one small change, then look at it again.', 'A small adjustment keeps the next action concrete.']] },
  'Feeling overwhelmed': { insight: 'Choose one demand for now. The others do not all need an answer at once.', recovery: 'Another demand arrives before you have finished this one.', reset: 'Name one thing to deal with next. Let the other demands wait.', smaller: 'Name only the next manageable action and do that part.', backups: [['one', 'Choose one demand', 'Deal with one manageable thing next. Let the rest wait.', 'Choosing one demand reduces what you are deciding right now.'], ['help', 'Ask for support', '“Can you help me work out the next step?”', 'Practical help is an option when there are too many demands.'], ['pause', 'Change the pace', '“I need a pause. I’ll decide when to return.”', 'You can change the pace or step out intentionally.']] },
  'Not knowing what happens': { insight: 'Find one useful detail. You do not need a complete picture to choose the next step.', recovery: 'You reach another part you have not done before.', reset: 'Look, listen, or ask for one useful detail.', smaller: 'Find out just what happens next before deciding about the rest.', backups: [['ask', 'Ask what comes next', '“What happens next, and what do I need to do?”', 'A specific question can make the immediate step clearer.'], ['watch', 'Observe one step', 'Watch or listen for one useful detail before acting.', 'Observing gives you information without making a guessed plan.'], ['pause', 'Give myself time', '“I need a moment to understand this part.”', 'Time to understand is a useful response in an unfamiliar situation.']] },
};
export const guidanceFor = state => TARA_GUIDANCE[state.challenge] || TARA_GUIDANCE['Feeling overwhelmed'];
export const newTaraPractice = () => ({ round: 0, step: 'choose', responses: ['', ''], wordings: ['', ''], tried: [false, false], triedWordings: ['', ''], usability: '' });
export function practiceOptions(state) {
  if (state.practice.round === 1) return guidanceFor(state).backups;
  return [['move', 'Use my first move', state.rehearsal || state.plan.do || '“Let me take a moment.”', tacticFor(state).purpose], ['pause', 'Give myself a pause', tacticFor(state).pause, 'A pause creates room to choose your next step.'], ['reset', 'Find my place first', guidanceFor(state).reset, 'One steady detail can give you somewhere to return.']];
}
export function startTaraPractice(state) { return { ...state, experienceVersion: 3, phase: 'rehearse', practice: newTaraPractice(), saved: false }; }
export function choosePracticeResponse(state, response) {
  const option = practiceOptions(state).find(([id]) => id === response);
  if (!option) return state;
  const round = state.practice.round;
  const responses = [...state.practice.responses]; responses[round] = response;
  const wordings = [...state.practice.wordings]; wordings[round] = option[2];
  return { ...state, experienceVersion: 3, rehearsalChoice: round === 0 ? response === 'pause' ? 'pause' : 'my-move' : state.rehearsalChoice,
    rehearsalResponse: option[2], practice: { ...state.practice, responses, wordings, step: 'try' }, saved: false,
    ...(round === 1 ? { plan: { ...state.plan, spikes: option[2] } } : {}) };
}
export function confirmPracticeTry(state) {
  const round = state.practice.round;
  if (state.practice.step !== 'try' || !state.practice.responses[round] || !state.practice.wordings[round].trim()) return state;
  const tried = [...state.practice.tried]; tried[round] = true;
  const triedWordings = [...state.practice.triedWordings]; triedWordings[round] = state.practice.wordings[round];
  return { ...state, experienceVersion: 3, rehearsed: true, saved: false, phase: round === 1 ? 'ready' : 'rehearse',
    practice: { ...state.practice, tried, triedWordings, round: 1, step: round === 1 ? 'ready' : 'choose' } };
}
export function keepUnpractisedPlan(state) { return { ...state, experienceVersion: 3, phase: 'ready', practice: { ...state.practice, step: 'ready' }, saved: false }; }
export function chooseTaraNextStep(state, choice) {
  const nextStep = choice === 'keep' ? `Next time, I will try: ${state.plan.do || 'one manageable step.'}`
    : choice === 'adjust' ? guidanceFor(state).smaller
    : choice === 'later' ? 'Leave this for now. When I return, choose one manageable first move.' : null;
  if (nextStep === null) return state;
  return { ...state, carryChoice: choice, nextStep, saved: false };
}
