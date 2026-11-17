import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSecureId } from '../../public/signal-lock/secure-id.js';
import * as model from '../../public/signal-lock/session.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const appSource = readFileSync(new URL('../../public/signal-lock/app.js', import.meta.url), 'utf8');
const randomBytes = () => {
  let counter = 0;
  return { getRandomValues: vi.fn(bytes => { bytes.fill(++counter); return bytes; }) };
};

// Exercise actual module initialization and handlers without a browser dependency.
// The release browser suite covers the real host, DOM, focus and storage lifecycle.
function boot(provider, saved = null) {
  const nodes = new Map();
  const node = () => ({ children: [], hidden: false, textContent: '', style: { setProperty() {} },
    classList: { toggle() {}, add() {} }, setAttribute() {}, focus: vi.fn(),
    append(child) { this.children.push(child); }, replaceChildren() { this.children = []; } });
  const get = id => { if (!nodes.has(id)) nodes.set(id, node()); return nodes.get(id); };
  const values = new Map(saved ? [[model.STORAGE_KEY, JSON.stringify(saved)]] : []);
  const storage = { getItem: key => values.get(key) ?? null, setItem: vi.fn((key, value) => values.set(key, value)) };
  const document = { getElementById: get, documentElement: node(), body: node(),
    querySelector: get, createElement: node, createElementNS: node, addEventListener() {} };
  const handlers = new Map();
  const window = { localStorage: storage, addEventListener(type, handler) { handlers.set(type, handler); }, parent: { postMessage() {} }, location: { origin: 'http://test', reload: vi.fn() } };
  const matchMedia = () => ({ matches: false, addEventListener() {} });
  let crypto = provider;
  const execute = new Function('model', 'createSecureId', 'document', 'window', 'performance', 'matchMedia', 'setInterval',
    `const { createSession, advance, durationText, PAIRS_PER_SCENE, TERMINAL, FEELINGS, readSaved, saveSession, STORAGE_KEY } = model;\n${appSource.replace(/^import .*;\n/gm, '')}\nreturn { read: () => ({ session, history }), tick, interrupt };`);
  const app = execute(model, () => createSecureId(crypto), document, window, { now: () => 100 }, matchMedia, vi.fn());
  return { ...app, get, storage, values, dispatch: type => handlers.get(type)?.({ storageArea: storage, key: model.STORAGE_KEY, newValue: null }), reload: window.location.reload, setCrypto: value => { crypto = value; } };
}

const savedSession = status => ({ version: 1, current: { ...model.createSession('legacy-saved-id', 1), status, pairs: status === 'completed' ? 6 : 2, halfPair: status === 'active' }, history: [{ ...model.createSession('prior-history-id', 0), status: 'ended' }] });

describe('Signal Lock secure identifiers', () => {
  it('keeps the offline standalone copy byte-identical to the canonical helper', () => {
    expect(readFileSync(new URL('../../public/signal-lock/secure-id.js', import.meta.url), 'utf8'))
      .toBe(readFileSync(new URL('../../src/lib/secureId.js', import.meta.url), 'utf8'));
  });
  it('uses native UUID generation when available', () => {
    const id = '01234567-89ab-4cde-8fab-0123456789ab';
    expect(createSecureId({ randomUUID: () => id, getRandomValues: () => { throw Error('unused'); } })).toBe(id);
  });
  it('uses secure random bytes and correct version/variant bits without randomUUID', () => {
    const source = randomBytes();
    const first = createSecureId(source), second = createSecureId(source);
    expect(first).toMatch(UUID); expect(second).toMatch(UUID); expect(first).not.toBe(second);
    expect(source.getRandomValues).toHaveBeenCalledTimes(2);
    expect(source.getRandomValues.mock.calls[0][0]).toBeInstanceOf(Uint8Array);
    expect(source.getRandomValues.mock.calls[0][0]).toHaveLength(16);
  });
  it.each([null, {}, { getRandomValues: () => { throw Error('blocked'); } }, { randomUUID: () => { throw Error('blocked'); } }])('never silently substitutes weak randomness: %j', source => {
    expect(() => createSecureId(source)).toThrow();
  });
});

describe('Signal Lock actual initialization and restart handlers', () => {
  it('starts, completes and repeats with secure random bytes, preserving the prior record', () => {
    const app = boot(randomBytes());
    const initial = app.read().session;
    expect(initial.id).toMatch(UUID);
    app.get('start').onclick();
    for (let i = 0; i < 6; i++) { app.get('target-one').onclick(); app.get('target-two').onclick(); }
    app.get('complete').onclick();
    expect(app.read().session).toMatchObject({ id: initial.id, status: 'completed', pairs: 6 });
    app.get('again').onclick();
    expect(app.read().session).toMatchObject({ status: 'ready', pairs: 0 });
    expect(app.read().session.id).toMatch(UUID);
    expect(app.read().session.id).not.toBe(initial.id);
    expect(app.read().history).toHaveLength(1);
    expect(app.read().history[0].id).toBe(initial.id);
    const repeatedId = app.read().session.id;
    app.get('again').onclick();
    expect(app.read().session.id).toBe(repeatedId); // A queued repeat cannot replace a new scene.
  });
  it.each([null, {}, { getRandomValues: () => { throw Error('blocked'); } }, { randomUUID: () => { throw Error('blocked'); } }])('handles initial entropy failure explicitly without creating or saving a session: %j', source => {
    const app = boot(source);
    expect(app.read().session).toBeNull();
    expect(app.storage.setItem).not.toHaveBeenCalled();
    expect(app.get('session-error').hidden).toBe(false);
    expect(app.get('session-error-message').textContent).toMatch(/secure session could not be started/);
    expect(app.get('start-controls').hidden).toBe(true);
    expect(() => { app.tick(); app.interrupt(); }).not.toThrow();
    app.setCrypto(randomBytes()); app.get('retry-session').onclick();
    expect(app.read().session.id).toMatch(UUID);
    expect(app.get('session-error').hidden).toBe(true);
    expect(app.get('start').focus).toHaveBeenCalled();
  });
  it('resumes saved partial progress without requesting any new random identifier', () => {
    const app = boot(null, savedSession('active'));
    expect(app.read().session).toMatchObject({ id: 'legacy-saved-id', status: 'paused', pairs: 2, halfPair: true });
    app.get('resume').onclick(); app.get('target-two').onclick();
    expect(app.read().session).toMatchObject({ id: 'legacy-saved-id', status: 'active', pairs: 3, halfPair: false });
    expect(app.get('session-error').hidden).toBe(true);
  });

  it.each(['tick', 'interrupt', 'tap', 'finish', 'pagehide', 'blur', 'storage'])('does not resurrect a deleted active record through a late %s', action => {
    const app = boot(randomBytes());
    app.get('start').onclick(); app.get('target-one').onclick();
    app.values.delete(model.STORAGE_KEY); app.storage.setItem.mockClear();
    if (action === 'tick' || action === 'interrupt') app[action]();
    else if (['pagehide', 'blur', 'storage'].includes(action)) app.dispatch(action);
    else app.get(action === 'tap' ? 'target-two' : 'stop').onclick();
    expect(app.values.has(model.STORAGE_KEY)).toBe(false);
    expect(app.storage.setItem).not.toHaveBeenCalled();
    expect(app.read()).toEqual({ session: null, history: [] });
    expect(app.get('session-error').hidden).toBe(false);
    expect(app.get('retry-session').textContent).toBe('Reload scene');
    app.get('retry-session').onclick();
    expect(app.reload).toHaveBeenCalledOnce();
    expect(app.storage.setItem).not.toHaveBeenCalled();
  });
  it("never replaces a different window's newer saved session on repeat", () => {
    const app = boot(randomBytes(), savedSession('completed'));
    const newer = { ...savedSession('paused'), current: { ...model.createSession('other-window-id'), status: 'paused' } };
    app.values.set(model.STORAGE_KEY, JSON.stringify(newer)); app.storage.setItem.mockClear();
    app.get('again').onclick();
    expect(JSON.parse(app.values.get(model.STORAGE_KEY))).toEqual(newer);
    expect(app.storage.setItem).not.toHaveBeenCalled();
    expect(app.read().session).toBeNull();
  });
  it('keeps unreadable storage intact and preserves unsaved in-memory progress', () => {
    const app = boot(randomBytes());
    app.values.set(model.STORAGE_KEY, '{broken'); app.storage.setItem.mockClear();
    app.get('start').onclick(); app.get('target-one').onclick();
    expect(app.values.get(model.STORAGE_KEY)).toBe('{broken');
    expect(app.storage.setItem).not.toHaveBeenCalled();
    expect(app.read().session).toMatchObject({ status: 'active', halfPair: true });
    expect(app.get('save-status').textContent).toMatch(/open session only/);
  });
  it('does not overwrite current, history or storage when a repeated scene cannot generate an ID', () => {
    const app = boot({}, savedSession('completed'));
    const previous = structuredClone(app.read());
    const stored = app.values.get(model.STORAGE_KEY);
    app.storage.setItem.mockClear();
    app.get('again').onclick();
    expect(app.read()).toEqual(previous);
    expect(app.values.get(model.STORAGE_KEY)).toBe(stored);
    expect(app.storage.setItem).not.toHaveBeenCalled();
    expect(app.get('summary').hidden).toBe(false);
    expect(app.get('session-error-message').textContent).toMatch(/previous scene is unchanged/);
    app.setCrypto(randomBytes()); app.get('retry-session').onclick();
    expect(app.read().session.id).toMatch(UUID);
    expect(app.read().history.map(record => record.id)).toEqual(['prior-history-id', 'legacy-saved-id']);
  });
});
