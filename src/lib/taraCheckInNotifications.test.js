import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ enabled: false, api: null }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: new Proxy({}, { get: (_, name) => name === 'then' ? undefined : (...args) => native.api[name](...args) }) }));
import { cancelTaraNotifications, notificationsForPlan, scheduleTaraNotifications, TARA_NOTIFICATION_IDS, verifyTaraNotifications, watchTaraNotificationDeletion } from './taraCheckInNotifications';
import { newTaraCheckIns, startCheckIns } from './taraSupportPlan';
let api;
beforeEach(() => {
  native.enabled = false;
  let pending = [];
  api = { checkPermissions: vi.fn(async () => ({ display: 'prompt' })), requestPermissions: vi.fn(async () => ({ display: 'granted' })),
    cancel: vi.fn(async ({ notifications }) => { pending = pending.filter(item => !notifications.some(removal => removal.id === item.id)); }),
    removeDeliveredNotificationsById: vi.fn(async () => {}), schedule: vi.fn(async ({ notifications }) => { pending.push(...notifications); }),
    getPending: vi.fn(async () => ({ notifications: pending })) };
  native.api = api;
});
describe('bounded, explicitly permitted local notifications', () => {
  const active = () => startCheckIns({ ...newTaraCheckIns(), preference: 'device', intervalMinutes: 10, durationMinutes: 120 });
  it('offers a browser fallback with no permission or scheduling calls', async () => {
    expect(await scheduleTaraNotifications('private-id', active())).toEqual({ status: 'in-app', reason: 'browser' });
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it('schedules at most twelve nonrepeating future checks without private wording', async () => {
    const checks = active(); const result = await scheduleTaraNotifications('private-id', checks, api);
    expect(result.status).toBe('scheduled');
    const notifications = api.schedule.mock.calls[0][0].notifications;
    expect(notifications).toHaveLength(12);
    expect(notifications.map(item => item.id)).toEqual(TARA_NOTIFICATION_IDS);
    expect(notifications.every(item => item.schedule.repeats === false && item.schedule.at.getTime() > Date.now())).toBe(true);
    expect(notifications[0].body).toBe('How are you doing? Open your plan for a check-in or help.');
    expect(api.requestPermissions).toHaveBeenCalledOnce();
    api.checkPermissions.mockResolvedValue({ display: 'granted' });
    expect(await verifyTaraNotifications('private-id', api)).toBe(true);
    expect(await verifyTaraNotifications('another-id', api)).toBe(false);
  });
  it('does not repeatedly request a denied permission or schedule anything', async () => {
    api.checkPermissions.mockResolvedValue({ display: 'denied' });
    expect(await scheduleTaraNotifications('id', active(), api)).toEqual({ status: 'denied' });
    expect(api.requestPermissions).not.toHaveBeenCalled(); expect(api.schedule).not.toHaveBeenCalled();
  });
  it('handles a denial at the actual prompt with no queued reminders', async () => {
    api.requestPermissions.mockResolvedValue({ display: 'denied' });
    expect((await scheduleTaraNotifications('id', active(), api)).status).toBe('denied');
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it('does not report scheduling success when queue read-back is incomplete', async () => {
    api.getPending.mockResolvedValue({ notifications: [] });
    await expect(scheduleTaraNotifications('id', active(), api)).rejects.toThrow('Notification queue');
    expect(api.cancel).toHaveBeenCalledTimes(2);
  });
  it('cleans up on schedule failure and preserves cancellation failures honestly', async () => {
    api.schedule.mockRejectedValue(new Error('OS schedule failure'));
    await expect(scheduleTaraNotifications('id', active(), api)).rejects.toThrow('OS schedule failure');
    api.cancel.mockRejectedValue(new Error('Cannot cancel'));
    await expect(cancelTaraNotifications(api)).rejects.toThrow('Cannot cancel');
  });
  it('cancels only this feature’s IDs, retaining daily and other journey reminders', async () => {
    await cancelTaraNotifications(api);
    const ids = api.cancel.mock.calls[0][0].notifications.map(item => item.id);
    expect(ids).toEqual(TARA_NOTIFICATION_IDS); expect(ids).not.toContain(2101);
    expect(api.removeDeliveredNotificationsById).toHaveBeenCalledWith({ ids: TARA_NOTIFICATION_IDS });
  });
  it('never backfills past notification slots or schedules after the chosen window', () => {
    const checks = active();
    expect(notificationsForPlan('id', checks, checks.startedAt + 115 * 60000)).toHaveLength(1);
    expect(notificationsForPlan('id', checks, checks.endsAt)).toEqual([]);
    expect(notificationsForPlan('id', { ...checks, preference: 'off' })).toEqual([]);
    expect(notificationsForPlan('id', { ...checks, endsAt: checks.startedAt + 900 * 60000 })).toEqual([]);
  });
  it('clears owned queued notifications on app-wide deletion while the journey is unmounted', async () => {
    native.enabled = true;
    const target = new EventTarget(); const data = new Map();
    vi.stubGlobal('window', target);
    vi.stubGlobal('localStorage', { getItem: key => data.get(key) ?? null });
    const checkIns = active();
    data.set('mentation.tara-tactician.v1', JSON.stringify({ draft: { eventStatus: 'in-progress', checkIns } }));
    await scheduleTaraNotifications('id', checkIns, api); api.cancel.mockClear();
    watchTaraNotificationDeletion();
    expect(api.cancel).not.toHaveBeenCalled();
    data.clear(); target.dispatchEvent(new Event('mentation:sessions-changed'));
    await vi.waitFor(() => expect(api.cancel).toHaveBeenCalledOnce());
    expect(api.cancel.mock.calls[0][0].notifications.map(item => item.id)).toEqual(TARA_NOTIFICATION_IDS);
    data.set('mentation.tara-tactician.v1', JSON.stringify({ draft: { eventStatus: 'in-progress', checkIns } }));
    await scheduleTaraNotifications('id', checkIns, api); api.cancel.mockClear();
    data.set('mentation.tara-tactician.v1', JSON.stringify({ draft: { eventStatus: 'in-progress', checkIns: { ...checkIns, startedAt: 0 } } }));
    target.dispatchEvent(new Event('mentation:tara-plan-changed'));
    await vi.waitFor(() => expect(api.cancel).toHaveBeenCalledOnce());
    expect((await api.getPending()).notifications).toEqual([]);
    vi.unstubAllGlobals();
  });
});
