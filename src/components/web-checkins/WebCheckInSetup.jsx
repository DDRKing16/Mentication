import { useState } from 'react';
import { startWebCheckIns, webCheckInAvailability } from '@/lib/webCheckIns';

// Optional browser-only slot for the parent-owned ready screen. getPlan must
// synchronously return { draftId, checkIns } with fresh start/end times.
export default function WebCheckInSetup({ getPlan, onStatus }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const availability = webCheckInAvailability();
  async function enable() {
    setBusy(true);
    try {
      const { draftId, checkIns } = getPlan();
      const result = await startWebCheckIns(draftId, checkIns);
      onStatus(result);
      setMessage(result.status === 'scheduled' ? 'Check-ins are scheduled. Delivery depends on your connection and notification settings.' : 'Notifications were not enabled. You can check in while your plan is open.');
    } catch {
      onStatus({ status: 'error' });
      setMessage('Background check-ins could not be confirmed. You can check in while your plan is open.');
    } finally { setBusy(false); }
  }
  return <section aria-label="Background check-ins">
    {availability === 'not-configured' && <p>Background check-ins are not available on this website yet. Check-ins work while your plan is open.</p>}
    {availability === 'install' && <p>On iPhone or iPad, open Mentication in Safari, tap Share, then Add to Home Screen. Open that Home Screen app and return here to allow notifications. Requires iOS or iPadOS 16.4 or later. The Home Screen app may have separate saved data, so create or reopen your plan there.</p>}
    {availability === 'unsupported' && <p>This browser cannot receive background check-ins. You can check in while your plan is open.</p>}
    {availability === 'denied' && <p>Notifications are blocked. You can change this in your device or browser notification settings, then return here.</p>}
    {availability === 'ready' && <><p>Allow a generic notification when this app is closed or your phone is locked. Your situation and plan text stay on this device. To deliver check-ins, the server receives a random plan ID, timing, and this browser’s push subscription; your browser’s notification provider delivers the alert. Delivery can be delayed or blocked by device settings.</p><button type="button" disabled={busy} onClick={enable}>{busy ? 'Setting up check-ins…' : 'Allow background check-ins'}</button></>}
    <p role="status">{message}</p>
  </section>;
}
