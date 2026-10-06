// Authored rehearsal cues. These describe a practice situation, never another
// person's predicted reaction or a result the user has achieved.
export const TARA_TACTICS = {
  'Finding the words': {
    cue: 'It’s your turn to speak, and you lose your place.',
    purpose: 'A short opening gives you one place to begin.',
    pause: '“Give me a moment to find the words.”',
    moves: [['open', 'Open with one sentence', '“What I want to say is…”'], ['pause', 'Ask for a moment', '“Give me a moment to find the words.”'], ['point', 'Return to my main point', '“The main thing I need you to know is…”']],
  },
  'Holding a boundary': {
    cue: 'You are asked to agree before you have decided what works for you.',
    purpose: 'A clear line names your limit without needing to explain everything at once.',
    pause: '“I need a little time before I answer.”',
    moves: [['limit', 'Name one clear limit', '“I can do this part. I cannot take on the rest.”'], ['time', 'Take time before agreeing', '“I need a little time before I answer.”'], ['repeat', 'Keep my answer simple', '“That does not work for me.”']],
  },
  'Feeling judged': {
    cue: 'You notice yourself checking someone’s face and lose track of what you wanted to say.',
    purpose: 'A useful point or question brings your attention back to the task in front of you.',
    pause: 'Pause and look at one steady thing before returning to my point.',
    moves: [['point', 'Come back to my point', 'Return to the one thing I came here to say or do.'], ['question', 'Ask one useful question', '“Could you clarify what you need from me?”'], ['pace', 'Slow my next sentence', 'Let my next sentence be shorter and slower.']],
  },
  'Getting started': {
    cue: 'The task is in front of you. You feel the pull to put it off.',
    purpose: 'A small first action makes the start concrete without committing you to the whole task.',
    pause: 'Pause, then name the smallest action I can actually do.',
    moves: [['open', 'Get the first thing ready', 'Open the file, lay out the material, or get the first thing ready.'], ['one', 'Do only the first piece', 'Work on one small, clearly defined piece.'], ['ask', 'Ask one practical question', 'Ask for the one detail I need to begin.']],
  },
  'Making a mistake': {
    cue: 'You reach a step you are not sure about.',
    purpose: 'A check or question gives you information about this step before you move on.',
    pause: 'Pause at this step instead of rushing into the next one.',
    moves: [['check', 'Check this one step', 'Check what this step needs before moving on.'], ['ask', 'Ask for clarification', '“Can you help me check this part?”'], ['small', 'Make a small first version', 'Make one small version that I can review and adjust.']],
  },
  'Feeling overwhelmed': {
    cue: 'Several demands arrive at once. You lose track of what comes next.',
    purpose: 'One manageable action reduces how much you need to handle at once.',
    pause: 'Pause and choose one demand to deal with first.',
    moves: [['one', 'Choose just one thing', 'Name one manageable thing to do next.'], ['time', 'Ask for more time', '“I need a moment. I’ll come back to this.”'], ['help', 'Ask for practical support', 'Ask someone to help me work out the next step.']],
  },
  'Not knowing what happens': {
    cue: 'You reach a part of the situation you have not done before.',
    purpose: 'Observing or asking gives you one useful detail to base your next move on.',
    pause: 'Give myself time to look, listen, or ask before choosing.',
    moves: [['ask', 'Find out what comes next', '“What happens next, and what do I need to do?”'], ['observe', 'Watch one step first', 'Look or listen for one useful detail before acting.'], ['small', 'Take the next small step', 'Choose one manageable next step without solving the whole situation.']],
  },
};
export const tacticFor = state => TARA_TACTICS[state.challenge] || TARA_TACTICS['Feeling overwhelmed'];
export function chooseTaraMove(state, id) {
  const move = tacticFor(state).moves.find(([key]) => key === id);
  if (!move) return state;
  return { ...state, experienceVersion: 2, selectedMoveId: id, saved: false,
    rehearsalChoice: '', rehearsalResponse: '', plan: { ...state.plan, do: move[2] } };
}
export function chooseRehearsalResponse(state, choice) {
  if (!['my-move', 'pause'].includes(choice)) return state;
  return { ...state, rehearsalChoice: choice, rehearsalResponse: choice === 'my-move'
    ? state.rehearsal || state.plan.do : tacticFor(state).pause, saved: false };
}
