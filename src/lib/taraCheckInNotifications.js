import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { requestTaraNotification, validTaraPlanId } from './taraNotificationRouting';

// A bounded range belongs only to this intervention. Daily reminders use 2101–2107.
export const TARA_NOTIFICATION_IDS = Array.from({ length: 12 }, (_, i) => 41001 + i);
export const supportsTaraNotifications = () => Capacitor.isNativePlatform();
// Keep the approved plugin proxy out of Promise return values: Promise
// resolution would call a fictitious plugin method named `then`.
let watchingDeletion = false;
let pendingCleanup = Promise.resolve();
let routingPromise = null;
let stopFailure = false;
export const taraNativeStopFailed = () => stopFailure;
// Capacitor retains cold-start notification actions until this boot listener consumes them.
// It survives route changes and is installed before a journey is mounted.
export function initializeTaraNotificationRouting() {
  if (!supportsTaraNotifications()) return Promise.resolve();
  if (routingPromise) return routingPromise;
  routingPromise = Promise.resolve().then(() => LocalNotifications.addListener('localNotificationActionPerformed', event => {
    if (TARA_NOTIFICATION_IDS.includes(event.notification?.id) && event.notification.extra?.interventionId === 'taraTactician') {
      requestTaraNotification(event.notification.extra.draftId);
    }
  })).catch(() => { routingPromise = null; });
  return routingPromise;
}
// Remains active across route changes once this feature has been used.
// The host can also call this at native boot to cover deletion before opening the journey.
export function watchTaraNotificationDeletion() {
  if (watchingDeletion || !supportsTaraNotifications() || typeof window === 'undefined') return;
  watchingDeletion = true;
  initializeTaraNotificationRouting();
  const changed = () => {
    initializeTaraNotificationRouting(); // Retry a transient bridge failure on resume.
    try {
      const raw = localStorage.getItem('mentation.tara-tactician.v1');
      const draft = raw === null ? null : JSON.parse(raw).draft;
      if (!draft || draft.completionReported || draft.eventStatus !== 'in-progress' || !draft.checkIns?.startedAt || draft.checkIns?.endsAt < Date.now() || draft.checkIns?.status === 'ended' || draft.checkIns?.preference === 'off') {
        pendingCleanup = pendingCleanup.then(() => cancelTaraNotifications()).catch(() => {
          stopFailure = true;
          window.dispatchEvent(new CustomEvent('mentation:tara-notification-error'));
        });
      }
    } catch { /* Preserve unreadable data and its ownership until the user clears it. */ }
  };
  window.addEventListener('mentation:sessions-changed', changed);
  window.addEventListener('mentation:tara-cleared', changed);
  window.addEventListener('mentation:tara-plan-changed', changed);
  window.addEventListener('storage', event => { if (event.key === null || event.key === 'mentation.tara-tactician.v1') changed(); });
  window.addEventListener('focus', changed);
  window.addEventListener('mentation:app-active', changed);
  globalThis.document?.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') changed(); });
  changed();
}
export async function cancelTaraNotifications(api) {
  if (!api && !supportsTaraNotifications()) return;
  const client = api || LocalNotifications;
  await client.cancel({ notifications: TARA_NOTIFICATION_IDS.map(id => ({ id })) });
  // Cancel means cancel pending; remove our delivered copies as well, never another journey's.
  await client.removeDeliveredNotificationsById({ ids: TARA_NOTIFICATION_IDS });
  stopFailure = false;
  if (supportsTaraNotifications() && typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('mentation:tara-notifications-stopped'));
}
export function notificationsForPlan(draftId, checkIns, now = Date.now()) {
  if (!validTaraPlanId(draftId) || checkIns.preference !== 'device' || !checkIns.startedAt || checkIns.endsAt <= now) return [];
  const interval = checkIns.intervalMinutes * 60000;
  if (![10, 20, 30].includes(checkIns.intervalMinutes) || checkIns.endsAt > checkIns.startedAt + 120 * 60000) return [];
  const notifications = [];
  for (let at = checkIns.startedAt + interval; at <= checkIns.endsAt && notifications.length < 12; at += interval) {
    if (at <= now) continue;
    notifications.push({ id: TARA_NOTIFICATION_IDS[notifications.length], title: 'Mentication',
      body: 'How are you doing? Open your plan for a check-in or help.',
      schedule: { at: new Date(at), repeats: false }, extra: { interventionId: 'taraTactician', draftId } });
  }
  return notifications;
}
// Called only from an explicit permission-and-start action, never on load or typing.
export async function scheduleTaraNotifications(draftId, checkIns, api) {
  if (!api && !supportsTaraNotifications()) return { status: 'in-app', reason: 'browser' };
  const client = api || LocalNotifications;
  await pendingCleanup;
  let permission = await client.checkPermissions();
  if (permission.display === 'prompt' || permission.display === 'prompt-with-rationale') permission = await client.requestPermissions();
  if (permission.display !== 'granted') { await cancelTaraNotifications(client); return { status: 'denied' }; }
  const notifications = notificationsForPlan(draftId, checkIns);
  if (!notifications.length) { await cancelTaraNotifications(client); return { status: 'ended' }; }
  try {
    await cancelTaraNotifications(client);
    await client.schedule({ notifications });
    const pending = await client.getPending();
    if (!notifications.every(item => pending.notifications.some(saved => saved.id === item.id && saved.extra?.draftId === draftId))) throw new Error('Notification queue did not confirm the plan.');
    return { status: 'scheduled' };
  } catch (error) {
    await cancelTaraNotifications(client);
    throw error;
  }
}
export async function verifyTaraNotifications(draftId, api) {
  if (!api && !supportsTaraNotifications()) return false;
  const client = api || LocalNotifications;
  const permission = await client.checkPermissions();
  if (permission.display !== 'granted') return false;
  const pending = await client.getPending();
  return pending.notifications.some(item => TARA_NOTIFICATION_IDS.includes(item.id) && item.extra?.draftId === draftId);
}
