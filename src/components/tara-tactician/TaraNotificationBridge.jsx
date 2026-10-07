import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { takeTaraNotificationRequest } from '@/lib/taraNotificationRouting';
import { cancelTaraNotifications, initializeTaraNotificationRouting, taraNativeStopFailed } from '@/lib/taraCheckInNotifications';
import { reconcileTaraWebCheckIns } from '@/lib/taraWebCheckInLifecycle';

export const taraEntryState = request => ({ prebuilt: true, pathway: ['taraTactician'], direction: 'focus', intensity: null, timeMin: 5, audio: 'no',
  ...(request ? { taraNotificationPlanId: request.planId, taraNotificationRequestId: request.requestId } : {}) });
export default function TaraNotificationBridge() {
  const navigate = useNavigate();
  const [stopPending, setStopPending] = useState(false);
  const [nativeStopFailed, setNativeStopFailed] = useState(taraNativeStopFailed);
  useEffect(() => {
    const open = () => { const request = takeTaraNotificationRequest(); if (request) navigate('/reset', { state: taraEntryState(request) }); };
    window.addEventListener('mentation:tara-notification-open', open);
    initializeTaraNotificationRouting(); open();
    return () => window.removeEventListener('mentation:tara-notification-open', open);
  }, [navigate]);
  useEffect(() => {
    const changed = event => setStopPending(event.detail?.pending === true);
    window.addEventListener('mentation:tara-web-stop-pending', changed);
    reconcileTaraWebCheckIns();
    return () => window.removeEventListener('mentation:tara-web-stop-pending', changed);
  }, []);
  useEffect(() => {
    const failed = () => setNativeStopFailed(true); const stopped = () => setNativeStopFailed(false);
    window.addEventListener('mentation:tara-notification-error', failed); window.addEventListener('mentation:tara-notifications-stopped', stopped);
    return () => { window.removeEventListener('mentation:tara-notification-error', failed); window.removeEventListener('mentation:tara-notifications-stopped', stopped); };
  }, []);
  return stopPending || nativeStopFailed ? <div className="fixed bottom-24 left-4 right-4 z-[90] rounded-xl border border-primary/20 bg-background p-4 text-sm text-foreground shadow-lg" role="status">
    {stopPending ? 'Stopping background check-ins is pending. We’ll retry when you’re online.' : 'Phone check-ins could not be cleared. Retry or turn off Mentication notifications in phone settings.'}
    <button type="button" className="ml-2 underline" onClick={() => stopPending ? reconcileTaraWebCheckIns() : cancelTaraNotifications().catch(() => setNativeStopFailed(true))}>Retry stopping</button>
  </div> : null;
}
