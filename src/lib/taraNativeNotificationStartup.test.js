import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const native = vi.hoisted(() => ({ enabled: true, api: null }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.enabled } }));
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: new Proxy({}, { get: (_, name) => name === 'then' ? undefined : (...args) => native.api[name](...args) }) }));
let callback;
beforeEach(() => {
  vi.resetModules(); native.enabled = true;
  vi.stubGlobal('window', new EventTarget()); vi.stubGlobal('CustomEvent', Event);
  callback = null;
  native.api = { addListener: vi.fn(async (name, handler) => { callback = handler; return { remove: vi.fn() }; }), requestPermissions: vi.fn(), schedule: vi.fn() };
});
afterEach(() => vi.unstubAllGlobals());
const event = (id = 41001, draftId = 'saved-plan', interventionId = 'taraTactician') => ({ notification: { id, extra: { draftId, interventionId } } });
describe('native app-wide notification action listener', () => {
  it('consumes the SDK-retained cold-start action before Tara or the router mounts', async () => {
    native.api.addListener.mockImplementation(async (name, handler) => { handler(event()); return { remove: vi.fn() }; });
    const runtime = await import('./taraCheckInNotifications');
    const routing = await import('./taraNotificationRouting');
    await runtime.initializeTaraNotificationRouting();
    expect(routing.takeTaraNotificationRequest()).toMatchObject({ planId: 'saved-plan' });
    expect(native.api.requestPermissions).not.toHaveBeenCalled(); expect(native.api.schedule).not.toHaveBeenCalled();
  });
  it('installs once across startup and bridge mounts and routes subsequent taps outside Tara', async () => {
    const runtime = await import('./taraCheckInNotifications'); const routing = await import('./taraNotificationRouting');
    await Promise.all([runtime.initializeTaraNotificationRouting(), runtime.initializeTaraNotificationRouting()]);
    expect(native.api.addListener).toHaveBeenCalledOnce();
    callback(event()); expect(routing.takeTaraNotificationRequest().planId).toBe('saved-plan');
    callback(event(41002, 'another-plan')); expect(routing.takeTaraNotificationRequest().planId).toBe('another-plan');
  });
  it('ignores daily reminders, wrong intervention metadata and invalid targets', async () => {
    const runtime = await import('./taraCheckInNotifications'); const routing = await import('./taraNotificationRouting');
    await runtime.initializeTaraNotificationRouting();
    callback(event(2101)); callback(event(41001, 'saved-plan', 'other')); callback(event(41001, '/settings')); callback({ notification: {} });
    expect(routing.takeTaraNotificationRequest()).toBeNull();
  });
  it('retries a failed listener registration without blocking startup', async () => {
    const runtime = await import('./taraCheckInNotifications');
    native.api.addListener.mockRejectedValueOnce(new Error('bridge unavailable'));
    await runtime.initializeTaraNotificationRouting(); await runtime.initializeTaraNotificationRouting();
    expect(native.api.addListener).toHaveBeenCalledTimes(2);
  });
  it('does not register native callbacks on the website', async () => {
    native.enabled = false; const runtime = await import('./taraCheckInNotifications');
    await runtime.initializeTaraNotificationRouting(); expect(native.api.addListener).not.toHaveBeenCalled();
  });
});
