// Understanding of the authored threat screen; never a health or outcome score.
export const THREAT_QUESTIONS = [
  { id: 'signal', question: 'What does noticing a possible threat tell you?', options: ['The danger is confirmed.', 'Your first impression is a fact.', 'A signal caught your attention; its meaning is still open.', 'You deliberately chose the response.'], correct: 2, explanation: 'Noticing is automatic. The first signal is incomplete, so your first impression does not establish what is there.' },
  { id: 'alarm', question: 'What does a racing heart establish on its own?', options: ['Your body is responding; context still matters.', 'There is definitely a threat.', 'Your prediction is accurate.', 'Reasoning has already checked the situation.'], correct: 0, explanation: 'The body may prepare before you understand what happened. A racing heart is a response, not proof of a threat.' },
  { id: 'context', question: 'How can you check an uncertain social cue?', options: ['Treat the worst prediction as the only explanation.', 'Assume you know what someone thinks.', 'Use discomfort as proof of their meaning.', 'Check what was actually said or done.'], correct: 3, explanation: 'A social cue can have several meanings. Check observable context before treating a prediction as the only explanation.' },
  { id: 'loop', question: 'If the situation is safe enough, what can noticing the story loop help you do?', options: ['Guarantee that fear will stop.', 'Make room to check the story and choose a next move.', 'Prove that the story is true.', 'Remove uncertainty by always avoiding.'], correct: 1, explanation: 'Noticing can create room to choose; it does not switch off fear. Avoidance can bring brief relief while leaving uncertainty intact.' },
];
export function scoreThreatCheck(check) {
  const answers = check?.answers;
  if (!Array.isArray(answers) || answers.length !== 4 || !answers.every(answer => Number.isInteger(answer) && answer >= 0 && answer <= 3)) return null;
  return answers.reduce((score, answer, index) => score + Number(answer === THREAT_QUESTIONS[index].correct), 0);
}
export function threatCheckPassed(book) {
  const score = scoreThreatCheck(book?.threatCheck);
  return book?.threatCheck?.submitted === true && score !== null && score >= 3;
}
export function requiredThreatStep(book, step) {
  return step > 3 && !threatCheckPassed(book) ? 3 : step;
}
export function requiredThreatView(book, view) {
  return book?.answers?.want?.trim() && !threatCheckPassed(book) && (view === 'plan' || view === 'journey' && book.step > 3) ? 'journey' : view;
}
export const emptyThreatCheck = () => ({ answers: [null, null, null, null], submitted: false });
