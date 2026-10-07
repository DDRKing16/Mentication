import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newTaraState } from './taraTacticianState';
import { startCheckIns } from './taraSupportPlan';
import { resetNavigationEntry } from './resetNavigation';
import { requestTaraNotification, takeTaraNotificationRequest, targetForTaraNotification, taraNotificationPath, validTaraPlanId } from './taraNotificationRouting';

const now = 1900000000000;
const active = () => ({ ...newTaraState(), id: 'saved-plan', eventStatus: 'in-progress',
  checkIns: startCheckIns({ preference: 'device', intervalMinutes: 10, durationMinutes: 30 }, now) });
beforeEach(() => takeTaraNotificationRequest());
afterEach(() => vi.unstubAllGlobals());
describe('opaque notification routing and saved-plan ownership', () => {
  it('retains a cold-start request before a router exists and consumes it once', () => {
    requestTaraNotification('saved-plan');
    expect(takeTaraNotificationRequest()).toMatchObject({ planId: 'saved-plan' });
    expect(takeTaraNotificationRequest()).toBeNull();
  });
  it('wakes the mounted bridge with a fresh request for repeated taps', () => {
    const target = new EventTarget(); vi.stubGlobal('window', target); vi.stubGlobal('CustomEvent', Event);
    const heard = vi.fn(); target.addEventListener('mentation:tara-notification-open', heard);
    requestTaraNotification('saved-plan'); const first = takeTaraNotificationRequest();
    requestTaraNotification('saved-plan'); const second = takeTaraNotificationRequest();
    expect(heard).toHaveBeenCalledTimes(2); expect(first.requestId).not.toBe(second.requestId);
  });
  it.each(['', '/settings', '../../other', 'private words', 'https://other.invalid', 'a'.repeat(101), null, {}])('rejects unsafe or private plan identifiers %s', id => {
    expect(validTaraPlanId(id)).toBe(false); expect(taraNotificationPath(id)).toBeNull();
    requestTaraNotification(id); expect(takeTaraNotificationRequest()).toBeNull();
  });
  it('opens only the matching active draft and never treats another draft as the notified plan', () => {
    const records = { draft: active(), recaps: [] };
    expect(targetForTaraNotification(records, 'saved-plan', now)).toMatchObject({ active: true, archived: false });
    expect(targetForTaraNotification(records, 'deleted-plan', now)).toBeNull();
    expect(taraNotificationPath('saved-plan')).toBe('/tara-tactician?taraCheckIn=saved-plan');
  });
  it.each(['expired', 'completed', 'off', 'ended', 'paused'])('does not reopen %s as a live check-in or fabricate an outcome', type => {
    const record = active();
    if (type === 'expired') record.checkIns.endsAt = now - 1;
    if (type === 'completed') record.completionReported = true;
    if (type === 'off') record.checkIns.preference = 'off';
    if (type === 'ended') record.checkIns.status = 'ended';
    if (type === 'paused') record.eventStatus = 'unknown';
    const before = JSON.stringify(record);
    expect(targetForTaraNotification({ draft: record, recaps: [] }, record.id, now).active).toBe(false);
    expect(JSON.stringify(record)).toBe(before);
  });
  it('resolves an archived reflection without replacing the current draft', () => {
    const record = { ...active(), phase: 'recap', actual: 'Private actual words' };
    const records = { draft: { ...active(), id: 'new-plan' }, recaps: [record] };
    expect(targetForTaraNotification(records, record.id, now)).toEqual({ record, active: false, archived: true });
    expect(records.draft.id).toBe('new-plan');
  });
  it('preserves the opaque target across reset refresh only for Tara, with no private words', () => {
    const entry = { prebuilt: true, pathway: ['taraTactician'], taraNotificationPlanId: 'saved-plan', taraNotificationRequestId: 'tap-1', situation: 'PRIVATE' };
    const snapshot = resetNavigationEntry(entry, { direction: 'focus' }, 'guiding');
    expect(snapshot).toMatchObject({ taraNotificationPlanId: 'saved-plan', taraNotificationRequestId: 'tap-1' });
    expect(JSON.stringify(snapshot)).not.toContain('PRIVATE');
    expect(resetNavigationEntry({ ...entry, pathway: ['boxV2'] }, {}, 'guiding').taraNotificationPlanId).toBeUndefined();
    expect(resetNavigationEntry({ ...entry, taraNotificationPlanId: 'private words' }, {}, 'guiding').taraNotificationPlanId).toBeUndefined();
    expect(JSON.stringify(resetNavigationEntry({ ...entry, taraNotificationRequestId: 'PRIVATE words' }, {}, 'guiding'))).not.toContain('PRIVATE');
    expect(resetNavigationEntry(entry, {}, 'questions').taraNotificationPlanId).toBeUndefined();
  });
});
