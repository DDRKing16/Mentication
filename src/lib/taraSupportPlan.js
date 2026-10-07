// User-chosen, device-local support. These are plans, never evidence of action.
export const SUPPORT_FIELDS = ['pause', 'regulation', 'affirmation', 'leave', 'help'];
export const SUPPORT_CHOICES = {
  pause: [
    ['quiet', 'Take a quiet pause', 'If safe and possible, pause somewhere with less demand.'],
    ['here', 'Pause where I am', 'Stay where I am, reduce the demand and give myself a moment.'],
    ['ask', 'Ask for a moment', '“I need a moment. I’ll let you know what I can do next.”'],
  ],
  regulation: [
    ['support', 'Feel what supports me', 'Notice the chair or surface supporting me. Let my shoulders soften if comfortable.'],
    ['look', 'Find three ordinary things', 'Look for three ordinary things around me. Name their colours or shapes silently.'],
    ['breath', 'Let one breath settle', 'Keep my breathing comfortable. Let one exhale finish without forcing it.'],
  ],
  affirmation: [
    ['pace', 'I can change the pace', 'I can change the pace. One manageable step is enough.'],
    ['imperfect', 'I do not have to do this perfectly', 'I do not have to do this perfectly. I can ask, pause or change my plan.'],
    ['choice', 'My needs count here', 'My needs count here. I can choose what is safe and workable for me.'],
  ],
};
export const newSupportPlan = () => ({ pause: '', regulation: '', affirmation: '', leave: '', help: '', confirmed: [] });
export const newTaraCheckIns = () => ({ preference: 'off', intervalMinutes: 20, durationMinutes: 60, startedAt: 0, endsAt: 0, nextAt: 0, status: 'off', lastAnswer: '' });
const text = value => typeof value === 'string' ? value.slice(0, 3000) : '';
export function readSupportPlan(raw) {
  return { ...Object.fromEntries(SUPPORT_FIELDS.map(field => [field, text(raw?.[field])])),
    confirmed: SUPPORT_FIELDS.filter(field => raw?.confirmed?.includes(field) && text(raw?.[field]).trim()) };
}
export function readTaraCheckIns(raw) {
  const fresh = newTaraCheckIns();
  const time = value => Number.isSafeInteger(value) && value >= 0 ? value : 0;
  return { preference: ['off', 'in-app', 'device'].includes(raw?.preference) ? raw.preference : fresh.preference,
    intervalMinutes: [10, 20, 30].includes(raw?.intervalMinutes) ? raw.intervalMinutes : fresh.intervalMinutes,
    durationMinutes: [30, 60, 120].includes(raw?.durationMinutes) ? raw.durationMinutes : fresh.durationMinutes,
    startedAt: time(raw?.startedAt), endsAt: time(raw?.endsAt), nextAt: time(raw?.nextAt),
    status: ['off', 'in-app', 'scheduled', 'denied', 'error', 'ended', 'unverified'].includes(raw?.status) ? raw.status : 'off',
    lastAnswer: ['okay', 'break', 'regulate', 'leave', 'help'].includes(raw?.lastAnswer) ? raw.lastAnswer : '' };
}
export function keepSupportField(state, field, value) {
  if (!SUPPORT_FIELDS.includes(field)) return state;
  const words = text(value).trim(); const plan = state.supportPlan || newSupportPlan();
  return { ...state, saved: false, supportPlan: { ...plan, [field]: words,
    confirmed: [...plan.confirmed.filter(item => item !== field), ...(words ? [field] : [])] } };
}
export function startCheckIns(checkIns, now = Date.now()) {
  const prefs = readTaraCheckIns(checkIns);
  return prefs.preference === 'off' ? { ...prefs, startedAt: 0, endsAt: 0, nextAt: 0, status: 'off' }
    : { ...prefs, startedAt: now, endsAt: now + prefs.durationMinutes * 60000,
      nextAt: now + prefs.intervalMinutes * 60000, status: prefs.preference === 'device' ? 'unverified' : 'in-app', lastAnswer: '' };
}
export function checkInDue(checkIns, now = Date.now()) {
  return checkIns.preference !== 'off' && checkIns.startedAt > 0 && checkIns.nextAt > 0
    && checkIns.endsAt >= now && checkIns.nextAt <= now && checkIns.status !== 'ended';
}
export function answerCheckIn(checkIns, answer, now = Date.now()) {
  if (!['okay', 'break', 'regulate', 'leave', 'help'].includes(answer)) return checkIns;
  const next = checkIns.startedAt + (Math.floor(Math.max(0, now - checkIns.startedAt) / (checkIns.intervalMinutes * 60000)) + 1) * checkIns.intervalMinutes * 60000;
  return { ...checkIns, lastAnswer: answer, nextAt: next <= checkIns.endsAt ? next : 0 };
}
