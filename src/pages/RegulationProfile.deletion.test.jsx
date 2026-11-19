import { afterEach, beforeEach, expect, it, vi } from 'vitest';

// Exercise the actual Profile button handlers with synthetic stores. Browser
// layout/navigation is covered separately by profile-deletion-smoke.browser.mjs.
const hooks = vi.hoisted(() => ({ values: [], refs: [], index: 0, refIndex: 0, navigate: vi.fn() }));
vi.mock('react', async original => ({ ...(await original()),
  useMemo: factory => factory(),
  useState: initial => {
    const index = hooks.index++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], value => { hooks.values[index] = typeof value === 'function' ? value(hooks.values[index]) : value; }];
  },
  useRef: initial => {
    const index = hooks.refIndex++;
    return hooks.refs[index] ||= { current: initial };
  },
}));
vi.mock('@/components/ui/button', () => ({ Button: 'button' }));
vi.mock('@/components/PullToRefresh', () => ({ default: 'div' }));
vi.mock('@/components/SafetyFooter', () => ({ default: 'footer' }));
vi.mock('react-router-dom', () => ({ useNavigate: () => hooks.navigate }));
vi.mock('@/hooks/useDeviceSessions', () => ({ useAllDeviceSessions: () => ({ sessions: [], ready: true, reload: vi.fn() }) }));
vi.mock('@/hooks/usePremium', () => ({ usePremium: () => ({ isPremium: true }) }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
import * as reminders from '@/lib/reminders';
import RegulationProfile from './RegulationProfile';

class MemoryStorage {
  values = new Map();
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
function render() { hooks.index = 0; hooks.refIndex = 0; return RegulationProfile(); }
function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node?.props) return [];
  return [node, ...elements(node.props.children)];
}
function button(name) {
  const found = elements(render()).find(node => node.props.onClick && node.props.children === name);
  expect(found, `button ${name}`).toBeTruthy();
  return found;
}
beforeEach(() => {
  hooks.values = []; hooks.refs = []; hooks.navigate.mockClear();
  globalThis.localStorage = new MemoryStorage();
  globalThis.window = { localStorage, sessionStorage: new MemoryStorage(), dispatchEvent: vi.fn() };
  globalThis.CustomEvent = class { constructor(type) { this.type = type; } };
  localStorage.setItem('daybook', 'synthetic private note');
  localStorage.setItem('mentation.sessions.v1', '[{"id":"synthetic"}]');
  localStorage.setItem('mentation.reminders.uncertain.v1', '1');
});
afterEach(() => { vi.restoreAllMocks(); delete globalThis.window; delete globalThis.localStorage; delete globalThis.CustomEvent; });

function hasText(role, text) {
  return elements(render()).some(node => node.props.role === role && JSON.stringify(node.props.children).includes(text));
}
function confirm() { button('Delete all my data').props.onClick(); return button('Yes, delete everything').props.onClick; }

it('erases despite the real durable uncertainty rejection and keeps its warning', async () => {
  confirm()(); await Promise.resolve();
  expect(localStorage.getItem('daybook')).toBeNull();
  expect(localStorage.getItem('mentation.sessions.v1')).toBeNull();
  expect(localStorage.getItem('mentation.reminders.uncertain.v1')).toBe('1');
  expect(hasText('status', 'App data deleted')).toBe(true);
  expect(hasText('status', 'could not be confirmed')).toBe(true);
  expect(hooks.navigate).not.toHaveBeenCalled();
});
it('cancels without erasing or attempting reminder cleanup', () => {
  const cleanup = vi.spyOn(reminders, 'startReminderDeletion');
  button('Delete all my data').props.onClick(); button('Cancel').props.onClick();
  expect(localStorage.getItem('daybook')).toBe('synthetic private note');
  expect(cleanup).not.toHaveBeenCalled();
});
it('immediately erases even if the native cleanup never settles', () => {
  vi.spyOn(reminders, 'startReminderDeletion').mockReturnValue(new Promise(() => {}));
  confirm()();
  expect(localStorage.getItem('daybook')).toBeNull();
  expect(hasText('status', 'App data deleted')).toBe(true);
  expect(hasText('status', 'is still being checked')).toBe(true);
  expect(hooks.navigate).not.toHaveBeenCalled();
});
it('reports partial failure, still erases other groups, and allows a verified retry', async () => {
  vi.spyOn(reminders, 'startReminderDeletion').mockResolvedValue({ok: true});
  const remove = localStorage.removeItem.bind(localStorage);
  localStorage.removeItem = key => { if (key !== 'daybook') remove(key); };
  confirm()(); await Promise.resolve();
  expect(localStorage.getItem('daybook')).not.toBeNull();
  expect(localStorage.getItem('mentation.sessions.v1')).toBeNull();
  expect(hasText('status', 'App data deleted')).toBe(false);
  expect(hasText('alert', 'could not be verified')).toBe(true);
  localStorage.removeItem = remove;
  button('Yes, delete everything').props.onClick(); await Promise.resolve();
  expect(localStorage.getItem('daybook')).toBeNull();
  expect(hasText('status', 'App data deleted')).toBe(true);
});
it('retry only attempts reminder cleanup and never erases newly saved data', async () => {
  const cleanup = vi.spyOn(reminders, 'startReminderDeletion').mockResolvedValue({ok: false});
  confirm()(); await Promise.resolve();
  localStorage.setItem('daybook', 'synthetic new note');
  cleanup.mockResolvedValue({ok: true});
  button('Retry reminder cleanup').props.onClick(); await Promise.resolve();
  expect(localStorage.getItem('daybook')).toBe('synthetic new note');
  expect(hasText('status', 'could not be confirmed')).toBe(false);
});

it('ignores repeated completion clicks, including the original stale handler', async () => {
  const cleanup = vi.spyOn(reminders, 'startReminderDeletion').mockResolvedValue({ok: true});
  const erase = confirm(); erase();
  localStorage.setItem('daybook', 'synthetic newly saved note');
  erase(); await Promise.resolve();
  expect(cleanup).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem('daybook')).toBe('synthetic newly saved note');
});
