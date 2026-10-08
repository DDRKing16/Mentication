/** A checkpoint is earned by two distinct, confirmed pieces of practice.
 * Navigation, typing, opening help and repeated clicks are never progress.
 * These views derive from existing session state; they do not claim a save or a benefit.
 */
export function checkpointFor(events = []) {
  const unique = [...new Map(events.filter(event => event && event.id && event.detail).map(event => [event.id, event])).values()];
  const pairs = Math.floor(unique.length / 2);
  return { count: unique.length, pairs, items: pairs ? unique.slice(pairs * 2 - 2, pairs * 2) : [], all: unique };
}
export const practiceEvent = (id, label, detail, ...confirmation) => (confirmation.length === 0 || confirmation[0] === true) && detail !== null && detail !== undefined && detail !== '' ? { id, label, detail: String(detail) } : null;

/** Keep optional answers in the order they were confirmed during this visit.
 * Editing updates the existing evidence; undo removes it. Neither earns a new event.
 * Restored sessions begin from their saved evidence, never from a click counter.
 */
export function reconcilePracticeEvents(previous = [], events = []) {
  const current = checkpointFor(events).all;
  const byId = new Map(current.map(event => [event.id, event]));
  const kept = previous.filter(event => byId.has(event.id)).map(event => byId.get(event.id));
  const known = new Set(kept.map(event => event.id));
  return [...kept, ...current.filter(event => !known.has(event.id))];
}

export function careCheckpoints(id, s) {
  const e = practiceEvent;
  // Only a committed screen departure confirms authored words; an open editor does not.
  return [
    e('before', 'Your starting point', `${s.before} / 10`, s.before !== null && s.before !== undefined),
    e('notice', id === 'makeRoom' ? 'You named' : 'Your words', s.notice || 'Held privately in mind', s.noticeConfirmed === true),
    e('response', id === 'selfCompassion' ? 'A voice on your side' : 'A different way to hear it', s.perspective, id !== 'makeRoom' && s.responseConfirmed === true),
    ...(id === 'makeRoom' ? [e('anchor', 'A place for attention', s.anchorText || {object:'One ordinary object',sound:'A sound nearby',support:'The surface supporting you'}[s.anchorType])] : []),
    e('try', 'You marked this as tried', id === 'selfCompassion' ? 'Saying the caring words' : id === 'unhook' ? 'Hearing the words as a thought' : 'Allowing the feeling, with your anchor here', s.practiceTaken),
    e('action', 'Your next small step', s.action, s.actionConfirmed === true),
    ...(id === 'unhook' ? [e('anchor', 'A place for attention', s.anchorText || {object:'One ordinary object',sound:'A sound nearby',support:'The surface supporting you'}[s.anchorType])] : []),
    e('return', 'You marked a return of attention', s.action || 'Your outside anchor', id === 'unhook' && s.anchorNoticed),
    e('status', 'Planned or done', s.actionStatus === 'done' ? 'You marked the step as done' : 'A plan, ready when you are', ['planned','done'].includes(s.actionStatus)),
    e('after', 'Your check-in now', `${s.after} / 10`, s.after !== null && s.after !== undefined),
  ];
}
