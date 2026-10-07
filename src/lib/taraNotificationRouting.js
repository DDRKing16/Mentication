// Only opaque plan identifiers enter notification payloads/history, never words.
export const validTaraPlanId = id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id);
export const taraNotificationPath = id => validTaraPlanId(id) ? `/tara-tactician?taraCheckIn=${encodeURIComponent(id)}` : null;
let pending = null;
export function requestTaraNotification(planId) {
  if (!validTaraPlanId(planId)) return;
  pending = { planId, requestId: `${Date.now()}-${globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)}` };
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mentation:tara-notification-open'));
}
export function takeTaraNotificationRequest() { const value = pending; pending = null; return value; }
export function targetForTaraNotification(records, planId, now = Date.now()) {
  if (!validTaraPlanId(planId)) return null;
  const record = records.draft?.id === planId ? records.draft : records.recaps?.find(value => value.id === planId);
  if (!record) return null;
  const archived = records.draft?.id !== record.id;
  const active = !archived && !record.completionReported && record.eventStatus === 'in-progress' && record.checkIns?.startedAt > 0
    && record.checkIns.endsAt >= now && record.checkIns.preference !== 'off' && record.checkIns.status !== 'ended';
  return { record, active, archived };
}
