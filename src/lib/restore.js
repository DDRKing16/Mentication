// General recovery activities, independently authored for Mentication. This
// separate category never changes recommendation scores or clinical ratings.
const activity = (id, title, detail, minutes, steps, extra = {}) => Object.freeze({ id, title, detail, minutes, steps, ...extra });
export const RESTORE_ACTIVITIES = Object.freeze([
  activity('breathing', 'Comfortable breathing', 'Slow down without holding or forcing', 2, [
    ['Settle into support', 'Sit comfortably. Let your shoulders soften and leave your eyes open if you prefer. Let your breath find its own depth.'],
    ['An easy rhythm', 'Allow a gentle breath in, then an easy breath out. Slow only as much as feels comfortable. No holds or unusually deep breaths are needed.'],
    ['Return to natural breathing', 'Let go of any rhythm. Notice the support beneath you and take a moment before moving on.'],
  ], { note: 'If changing your breath feels uncomfortable or makes you light-headed, return to normal breathing and stop.' }),
  activity('music', 'Calming music', 'Listen to your own gentle track', 5, [
    ['Choose your sound', 'Open a familiar, gentle track in your own music app. Keep the volume comfortable. This guide does not play music.'],
    ['Listen without a task', 'Put other tasks aside. Notice one sound or instrument, then let your attention widen to the whole track. Return whenever your mind wanders.'],
    ['Leave a little quiet', 'When you are ready, lower or stop the music. Notice what you want to carry into the next part of your day.'],
  ], { external: true }),
  activity('body-rest', 'Non-sleep deep rest', 'A written, awake body scan', 5, [
    ['Find a resting position', 'Lie down or sit with support somewhere you can safely rest. Let your hands rest easily. You can keep your eyes open. No audio is included.'],
    ['Travel gently through your body', 'Notice your feet, legs, hips, back, hands and face in turn. Rest your attention briefly in each place. There is nothing to tense, fix or achieve.'],
    ['Widen and return', 'Notice your whole body being supported. When ready, look around, move your fingers and toes, and return slowly. This is a simple body-scan rest, not a promise of sleep or recovery.'],
  ]),
  activity('reading', 'Easy reading', 'A few pages with no target', 5, [
    ['Find something inviting', 'Choose your own book or another easy piece of reading. Pick somewhere comfortable and set messages aside. No reading material is supplied here.'],
    ['Read at your pace', 'Read without a target for pages or learning. If the material feels demanding, switch to something lighter or simply pause.'],
    ['Close at a natural point', 'Finish a sentence or page when you want to stop. Set the book down and notice the room before returning to your day.'],
  ], { external: true }),
  activity('meditation', 'Guided meditation', 'A written practice in steady attention', 3, [
    ['Find an anchor', 'Sit with support. Notice where your feet meet the floor or your body meets the chair. Eyes open or closed is your choice. This meditation is written, without narration.'],
    ['Notice and return', 'Rest your attention on that contact or on your natural breath. Thoughts can come and go. When you notice wandering, gently return to your chosen anchor.'],
    ['Make room for the next moment', 'Notice a sound in the room and look around. There is no need to feel a particular way. Choose your next action gently.'],
  ]),
  activity('nature', 'Relaxing nature viewing', 'A quiet scene from your own media', 5, [
    ['Choose a gentle scene', 'Use your own nature video or familiar relaxing programme. Turn off autoplay and choose a comfortable volume. This guide does not stream or include video.'],
    ['Watch without scrolling', 'Let one scene hold your attention. Notice a colour, movement or sound. You can put the screen down if viewing stops feeling restful.'],
    ['Finish on purpose', 'Stop the video when you choose. Look at something nearby before returning to other tasks.'],
  ], { external: true }),
  activity('tea', 'Mindful tea break', 'One drink and a little space', 3, [
    ['Make your cup', 'Prepare a drink you enjoy and find a place to sit. Let a hot drink cool to a comfortable temperature. Set work and messages aside.'],
    ['Notice one sip', 'Notice the cup, its scent and the taste of a small sip. Let the drink be your only task for a few moments. Water works just as well.'],
    ['Finish gently', 'Take another unhurried sip if you want. Set the cup down and decide what can wait a little longer.'],
  ]),
  activity('walk', 'Gentle outdoor walk', 'A safe, easy change of surroundings', 5, [
    ['Choose a manageable route', 'Choose a safe, familiar route and an easy pace. Green space is an option, not a requirement. Adapt to your mobility and conditions; a seated outdoor pause is also welcome.'],
    ['Put the screen away', 'Look where you are going rather than at this guide. Notice the air or a nearby tree when it is safe to do so. This is not a step-count challenge.'],
    ['Come back at your pace', 'Stop or return before the walk becomes a strain. Once safely still, notice how much activity feels enough for now.'],
  ], { external: true, note: 'Use the screen only while safely stopped. Rest instead if walking does not suit you today.' }),
  activity('recovery-day', 'Take a recovery day', 'Reduce one demand and plan support', 2, [
    ['Name what can ease', 'Choose one optional demand you can postpone, shorten or ask someone to help with today. Rest does not need to be earned.'],
    ['Make a small recovery plan', 'Write one realistic adjustment below. You might keep exercise gentle, make food easier or leave a clear space for rest. This guide does not switch Oura Rest Mode or change any activity goals.'],
    ['Make room for that plan', 'Decide when you will make the adjustment and whether anyone needs to know. A plan counts as a plan; you will choose separately if you actually took the break.'],
  ], { planning: true, planLabel: 'One demand I can ease today', placeholder: 'For example, postpone the optional errand' }),
  activity('sleep-routine', 'Protect a sleep routine', 'Choose a repeatable evening cue', 2, [
    ['Choose one repeatable cue', 'Pick a small wind-down action and a realistic time to begin it. Aim for a routine that fits your life rather than a perfect bedtime.'],
    ['Prepare the easy version', 'Write the simplest version below. You could put your book by the bed, dim a light or leave the phone outside reach. This does not set an alarm or reminder.'],
    ['Leave sleep unforced', 'Keep the cue gentle and repeatable. You are preparing a routine, not making yourself sleep on command. Return to this plan when the chosen time comes.'],
  ], { planning: true, planLabel: 'My evening cue and a realistic time', placeholder: 'For example, dim the lamp around 10 pm' }),
]);
export const RESTORE_DRAFT_KEY = 'mentation.restore.draft.v1';
export const RESTORE_HISTORY_KEY = 'mentation.restore.history.v1';
export function restoreActivity(id) { return RESTORE_ACTIVITIES.find(item => item.id === id) || null; }
export function readRestoreDraft(storage) {
  try {
    const value = JSON.parse(storage?.getItem(RESTORE_DRAFT_KEY) || 'null');
    if (!value || !restoreActivity(value.id) || !Number.isInteger(value.step) || value.step < 0 || value.step > 2 || !Number.isFinite(value.elapsed) || value.elapsed < 0 || value.elapsed > 86400) return null;
    return { id: value.id, step: value.step, elapsed: value.elapsed, target: [120,180,300,600].includes(value.target) ? value.target : 300, plan: typeof value.plan === 'string' ? value.plan.slice(0, 300) : '', attemptId: typeof value.attemptId === 'string' && /^[a-zA-Z0-9-]{8,80}$/.test(value.attemptId) ? value.attemptId : null };
  } catch { return null; }
}
export function writeRestoreDraft(storage, draft) {
  try { storage.setItem(RESTORE_DRAFT_KEY, JSON.stringify(draft)); return true; } catch { return false; }
}
export function saveRestoreOutcome(storage, { id, outcome, elapsed, attemptId, plan = '', feedback = null, now = new Date().toISOString() }) {
  if (!restoreActivity(id) || !['completed', 'stopped', 'planned'].includes(outcome) || !Number.isFinite(elapsed) || elapsed < 0 || typeof attemptId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(attemptId)) return false;
  try {
    let history; try { history = JSON.parse(storage.getItem(RESTORE_HISTORY_KEY) || '[]'); } catch { history = []; }
    if (!Array.isArray(history)) history = [];
    const record = { id, attemptId, outcome, elapsed: Math.round(elapsed), feedback: ['more-rested','same','less-rested'].includes(feedback) ? feedback : null, at: now, plan: restoreActivity(id).planning && typeof plan === 'string' ? plan.slice(0, 300) : '' };
    storage.setItem(RESTORE_HISTORY_KEY, JSON.stringify([record, ...history.filter(item => item?.attemptId !== attemptId)].slice(0, 50)));
    storage.removeItem(RESTORE_DRAFT_KEY);
    return true;
  } catch { return false; }
}
export function restoreClock(seconds) {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function readRestorePlans(storage) {
  try {
    const values = JSON.parse(storage?.getItem(RESTORE_HISTORY_KEY) || '[]');
    return Array.isArray(values) ? values.filter(value => restoreActivity(value?.id)?.planning && value.outcome === 'planned' && typeof value.plan === 'string' && value.plan.trim()).slice(0, 3).map(value => ({ id: value.id, plan: value.plan.slice(0, 300) })) : [];
  } catch { return []; }
}

export function readRestoreOutcome(storage, attemptId) {
  if (typeof attemptId !== 'string' || !/^[a-zA-Z0-9-]{8,80}$/.test(attemptId)) return null;
  try {
    const values = JSON.parse(storage?.getItem(RESTORE_HISTORY_KEY) || '[]');
    const value = Array.isArray(values) ? values.find(item => item?.attemptId === attemptId) : null;
    return value && restoreActivity(value.id) && ['completed','stopped','planned'].includes(value.outcome) && Number.isFinite(value.elapsed) && value.elapsed >= 0 ? value : null;
  } catch { return null; }
}
