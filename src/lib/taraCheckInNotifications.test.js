import { beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ enabled: false, api: null, thenReads: 0 }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: new Proxy({}, { get: (_, name) => {
  if (name === 'then') { native.thenReads += 1; return () => { throw new Error('LocalNotifications.then is not implemented'); }; }
  return (...args) => native.api[name](...args);
} }) }));
import { cancelTaraNotifications, notificationsForPlan, scheduleTaraNotifications, TARA_NOTIFICATION_IDS, taraNativeStopFailed, verifyTaraNotifications, watchTaraNotificationDeletion } from './taraCheckInNotifications';
import { newTaraCheckIns, startCheckIns } from './taraSupportPlan';
let api;
beforeEach(() => {
  vi.resetModules();
  native.thenReads = 0;
  native.enabled = false;
  let pending = [];
  api = { checkPermissions: vi.fn(async () => ({ display: 'prompt' })), requestPermissions: vi.fn(async () => ({ display: 'granted' })),
    cancel: vi.fn(async ({ notifications }) => { pending = pending.filter(item => !notifications.some(removal => removal.id === item.id)); }),
    removeDeliveredNotificationsById: vi.fn(async () => {}), schedule: vi.fn(async ({ notifications }) => { pending.push(...notifications); }),
    getPending: vi.fn(async () => ({ notifications: pending })), addListener: vi.fn(async () => ({ remove: vi.fn() })) };
  native.api = api;
});
describe('bounded, explicitly permitted local notifications', () => {
  const active = () => startCheckIns({ ...newTaraCheckIns(), preference: 'device', intervalMinutes: 10, durationMinutes: 120 });
  it('offers a browser fallback with no permission or scheduling calls', async () => {
    expect(await scheduleTaraNotifications('private-id', active())).toEqual({ status: 'in-app', reason: 'browser' });
    expect(api.schedule).not.toHaveBeenCalled();
  });
  it('loads the native plugin proxy without calling a fictitious then method', async () => {
    native.enabled = true;
    expect(await scheduleTaraNotifications('native-plan', active())).toEqual({ status: 'scheduled' });
    expect(api.schedule).toHaveBeenCalledOnce();
    await cancelTaraNotifications(); expect((await api.getPending()).notifications).toEqual([]);
    expect(native.thenReads).toBe(0);
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
  it('replaces the future native schedule when cadence changes and retains another journey’s reminder', async () => {
    await api.schedule({ notifications: [{ id: 2101, extra: { daily: true } }] });
    const checks = active(); await scheduleTaraNotifications('first-plan', checks, api);
    await scheduleTaraNotifications('replacement-plan', { ...checks, intervalMinutes: 30 }, api);
    const queue = (await api.getPending()).notifications;
    expect(queue.filter(item => item.id !== 2101)).toHaveLength(4);
    expect(queue.some(item => item.extra?.draftId === 'first-plan')).toBe(false);
    expect(queue.find(item => item.id === 2101)).toBeTruthy();
    expect(queue.filter(item => item.id !== 2101).every(item => item.schedule.at.getTime() <= checks.endsAt)).toBe(true);
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
    data.set('mentation.tara-tactician.v1', JSON.stringify({ draft: { eventStatus: 'in-progress', checkIns: { ...checkIns, endsAt: Date.now() - 1 } } }));
    api.cancel.mockClear(); target.dispatchEvent(new Event('focus'));
    await vi.waitFor(() => expect(api.cancel).toHaveBeenCalledOnce());
    api.cancel.mockClear(); data.set('mentation.tara-tactician.v1', '{unreadable');
    target.dispatchEvent(new Event('mentation:tara-plan-changed')); await Promise.resolve();
    expect(api.cancel).not.toHaveBeenCalled();
    api.cancel.mockRejectedValueOnce(new Error('OS cancellation failed'));
    data.clear(); target.dispatchEvent(new Event('mentation:tara-cleared'));
    await vi.waitFor(() => expect(taraNativeStopFailed()).toBe(true));
    target.dispatchEvent(new Event('mentation:app-active'));
    await vi.waitFor(() => expect(taraNativeStopFailed()).toBe(false));
    vi.unstubAllGlobals();
  });
});
