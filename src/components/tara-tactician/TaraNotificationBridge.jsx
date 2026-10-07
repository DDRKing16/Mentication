import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { takeTaraNotificationRequest } from '@/lib/taraNotificationRouting';
import { initializeTaraNotificationRouting } from '@/lib/taraCheckInNotifications';

export const taraEntryState = request => ({ prebuilt: true, pathway: ['taraTactician'], direction: 'focus', intensity: null, timeMin: 5, audio: 'no',
  ...(request ? { taraNotificationPlanId: request.planId, taraNotificationRequestId: request.requestId } : {}) });
export default function TaraNotificationBridge() {
  const navigate = useNavigate();
  useEffect(() => {
    const open = () => { const request = takeTaraNotificationRequest(); if (request) navigate('/reset', { state: taraEntryState(request) }); };
    window.addEventListener('mentation:tara-notification-open', open);
    initializeTaraNotificationRouting(); open();
    return () => window.removeEventListener('mentation:tara-notification-open', open);
  }, [navigate]);
  return null;
}
