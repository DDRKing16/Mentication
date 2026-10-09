import { THREAT_QUESTIONS } from "./threat-check.js";
// Confirmed answers only. Editing or navigation never adds another action.
export function confirmPracticeAnswer(previous = [], id, label, value) {
  const detail = Array.isArray(value) ? value.filter(Boolean).join(', ') : value == null ? '' : String(value).trim();
  if (!detail) return previous.filter(item => item.id !== id);
  const event = { id, label, detail };
  return previous.some(item => item.id === id)
    ? previous.map(item => item.id === id ? event : item)
    : [...previous, event];
}
export function answerPair(events = []) {
  const count = Math.floor(events.length / 2) * 2;
  return count ? events.slice(count - 2, count) : [];
}

// Selection remains a draft until Next/Check is pressed. Rechecking the same
// question updates its evidence without pretending another question was completed.
export function confirmThreatPracticeAnswer(events, index, answer) {
  const question = THREAT_QUESTIONS[index];
  if (!question || !Number.isInteger(answer) || answer < 0 || answer >= question.options.length) return events;
  const takeaways = [
    ['Notice the signal', 'A signal is not a fact. Its meaning is still open.'],
    ['Make room for context', 'A racing heart is a response, not proof of danger.'],
    ['Check what happened', 'Look at what was said or done before deciding what it means.'],
    ['Leave room to choose', 'Noticing the story can help you choose. It does not guarantee less fear.'],
  ];
  const [label, detail] = takeaways[index];
  return confirmPracticeAnswer(events, `threat:${question.id}`, label,
    (answer === question.correct ? 'Matched the teaching. ' : 'A takeaway to revisit. ') + detail);
}
