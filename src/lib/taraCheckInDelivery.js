import { cancelTaraNotifications, scheduleTaraNotifications, supportsTaraNotifications, verifyTaraNotifications } from './taraCheckInNotifications';
import { cancelWebCheckIns, startWebCheckIns, verifyWebCheckIns } from './webCheckIns';

// Keep native capability native-only. The website has a separate real transport.
// This function stays synchronous until the web permission call has been made.
export function startTaraCheckInDelivery(id, checkIns) {
  if (supportsTaraNotifications()) return scheduleTaraNotifications(id, checkIns);
  return startWebCheckIns(id, checkIns).then(result => ['scheduled', 'denied'].includes(result.status)
    ? result : { status: 'in-app', reason: result.status });
}
export const stopTaraCheckInDelivery = () => supportsTaraNotifications() ? cancelTaraNotifications() : cancelWebCheckIns();
export const verifyTaraCheckInDelivery = id => supportsTaraNotifications() ? verifyTaraNotifications(id) : verifyWebCheckIns(id);
