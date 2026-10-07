import { supportsTaraNotifications } from './taraCheckInNotifications';
import { loadTara } from './taraTacticianStorage';
import { requestTaraNotification, targetForTaraNotification } from './taraNotificationRouting';
import { consumeWebCheckInTap, reconcileWebCheckIns } from './webCheckIns';

export const WEB_CHECKIN_CANCELLATION_KEY = 'mentation.web-checkins.v1';
let watching = false;
export async function reconcileTaraWebCheckIns() {
  if (supportsTaraNotifications()) return;
  let draft;
  try { draft = loadTara().draft; }
  catch { return; } // Preserve unreadable local data and ownership.
  try {
    const result = await reconcileWebCheckIns(draft);
    window.dispatchEvent(new CustomEvent('mentation:tara-web-delivery', { detail: { draftId: draft?.id, status: result.status } }));
    window.dispatchEvent(new CustomEvent('mentation:tara-web-stop-pending', { detail: { pending: false } }));
  } catch {
    let pending = false;
    try { pending = JSON.parse(localStorage.getItem(WEB_CHECKIN_CANCELLATION_KEY) || 'null')?.pendingCancel === true; } catch { /* Retain unreadable ownership. */ }
    window.dispatchEvent(new CustomEvent('mentation:tara-web-stop-pending', { detail: { pending } }));
    window.dispatchEvent(new CustomEvent('mentation:tara-web-delivery', { detail: { draftId: draft?.id, status: 'unverified' } }));
  }
}
// Consume the hash before constructing either router; it never enters access logs.
export function initializeTaraWebCheckIns() {
  if (supportsTaraNotifications() || typeof window === 'undefined') return;
  const id = consumeWebCheckInTap();
  if (id) {
    try { const target = targetForTaraNotification(loadTara(), id); if (target?.active) requestTaraNotification(id); } catch { /* Missing/unreadable plans stay on Home. */ }
  }
  if (watching) return;
  watching = true;
  for (const name of ['online', 'focus', 'mentation:tara-plan-changed', 'mentation:tara-cleared', 'mentation:sessions-changed']) window.addEventListener(name, reconcileTaraWebCheckIns);
  window.addEventListener('storage', event => { if (event.key === null || event.key === 'mentation.tara-tactician.v1' || event.key === WEB_CHECKIN_CANCELLATION_KEY) reconcileTaraWebCheckIns(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'hidden') reconcileTaraWebCheckIns(); });
  reconcileTaraWebCheckIns();
}
