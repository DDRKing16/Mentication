import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const transport = vi.hoisted(() => ({ tap: null, result: { status: 'off' }, error: null }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('./webCheckIns', () => ({ consumeWebCheckInTap: () => transport.tap,
  reconcileWebCheckIns: vi.fn(async () => { if (transport.error) throw transport.error; return transport.result; }) }));
import { newTaraState } from './taraTacticianState';
import { startCheckIns } from './taraSupportPlan';
import { saveTaraDraft } from './taraTacticianStorage';
import { takeTaraNotificationRequest } from './taraNotificationRouting';
import { initializeTaraWebCheckIns, reconcileTaraWebCheckIns, WEB_CHECKIN_CANCELLATION_KEY } from './taraWebCheckInLifecycle';
import { deleteAllLocalAppData } from './localData';
class Memory {
  values = new Map(); getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); } removeItem(key) { this.values.delete(key); }
  get length() { return this.values.size; } key(index) { return [...this.values.keys()][index] ?? null; }
}
beforeEach(() => {
  const local = new Memory(); const target = new EventTarget(); target.localStorage = local; target.sessionStorage = new Memory();
  vi.stubGlobal('window', target); vi.stubGlobal('localStorage', local); vi.stubGlobal('document', new EventTarget());
  vi.stubGlobal('CustomEvent', class extends Event { constructor(name, options) { super(name); this.detail = options?.detail; } });
  transport.tap = null; transport.result = { status: 'off' }; transport.error = null; takeTaraNotificationRequest();
});
afterEach(() => vi.unstubAllGlobals());
describe('Tara hosted web lifecycle integration', () => {
  it('routes only an existing active draft using the same cold-start queue', () => {
    const draft = { ...newTaraState(), id: 'matching-draft', eventStatus: 'in-progress', checkIns: startCheckIns({ preference: 'device' }) };
    saveTaraDraft(draft); transport.tap = draft.id; initializeTaraWebCheckIns();
    expect(takeTaraNotificationRequest()).toMatchObject({ planId: draft.id });
    transport.tap = 'deleted-draft'; initializeTaraWebCheckIns(); expect(takeTaraNotificationRequest()).toBeNull();
    transport.tap = draft.id; saveTaraDraft({ ...draft, completionReported: true });
    initializeTaraWebCheckIns(); expect(takeTaraNotificationRequest()).toBeNull();
  });
  it('keeps only opaque cancellation ownership when all private local data is deleted', () => {
    const ownership = JSON.stringify({ token: 'a'.repeat(64), planId: 'opaque', pendingCancel: true });
    localStorage.setItem(WEB_CHECKIN_CANCELLATION_KEY, ownership);
    localStorage.setItem('mentation.tara-tactician.v1', 'PRIVATE words');
    localStorage.setItem('mentation.sessions.v1', 'PRIVATE outcomes');
    deleteAllLocalAppData();
    expect(localStorage.getItem(WEB_CHECKIN_CANCELLATION_KEY)).toBe(ownership);
    expect(localStorage.getItem('mentation.tara-tactician.v1')).toBeNull();
    expect(localStorage.getItem('mentation.sessions.v1')).toBeNull();
  });
  it('surfaces offline cancellation pending and clears that message after reconciliation succeeds', async () => {
    const notices = []; window.addEventListener('mentation:tara-web-stop-pending', event => notices.push(event.detail.pending));
    localStorage.setItem(WEB_CHECKIN_CANCELLATION_KEY, JSON.stringify({ pendingCancel: true, token: 'a'.repeat(64) }));
    transport.error = new Error('offline'); await reconcileTaraWebCheckIns(); expect(notices.at(-1)).toBe(true);
    expect(localStorage.getItem(WEB_CHECKIN_CANCELLATION_KEY)).not.toBeNull();
    transport.error = null; transport.result = { status: 'cancelled' };
    await reconcileTaraWebCheckIns(); expect(notices.at(-1)).toBe(false);
  });
  it('does not erase unreadable saved plans during background reconciliation', async () => {
    localStorage.setItem('mentation.tara-tactician.v1', '{unreadable');
    await reconcileTaraWebCheckIns();
    expect(localStorage.getItem('mentation.tara-tactician.v1')).toBe('{unreadable');
  });
});
