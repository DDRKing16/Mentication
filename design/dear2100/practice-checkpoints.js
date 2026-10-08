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
