import { describe, expect, it, vi } from 'vitest';
import { bindJourneyScreenHistory } from './journeyScreenHistory.js';

function harness(state = { idx: 7, key: 'router-key', usr: { returnPath: '/library' } }) {
  const listeners = new Map();
  const frameWindow = { postMessage: vi.fn() };
  const getFrame = vi.fn(() => ({ contentWindow: frameWindow }));
  const onExit = vi.fn();
  const onError = vi.fn();
  const history = {
    state,
    pushState: vi.fn(value => { history.state = value; }),
    replaceState: vi.fn(value => { history.state = value; }),
    back: vi.fn(),
  };
  const host = {
    history, location: { origin: 'https://mentation.example' },
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: (type, listener) => { if (listeners.get(type) === listener) listeners.delete(type); },
  };
  const bind = () => bindJourneyScreenHistory({ id: 'goodMap', getFrame, onExit, onError, screenIds: ['intro', 'sat'], cursorNames: ['moment', 'satisfaction'], host });
  const send = (data, origin = host.location.origin, source = frameWindow) => listeners.get('message')?.({ origin, source, data });
  const event = (mode, id = 'intro', satisfaction = 0) => ({ type: 'mentication:screen', journeyId: 'goodMap', mode, screen: { id, cursors: { moment: 0, satisfaction } } });
  const cleanup = bind();
  return { host, history, getFrame, frameWindow, onExit, onError, listeners, send, event, cleanup, bind };
}

describe('journey screen history across recreated iframes', () => {
  it('preserves Router user state/key and advances its index only for real screens', () => {
    const h = harness();
    h.send(h.event('init'));
    expect(h.history.state).toEqual({ idx: 7, key: 'router-key', usr: { returnPath: '/library' }, 'menticationScreen:goodMap': { id: 'intro', cursors: { moment: 0, satisfaction: 0 }, depth: 0 } });
    h.send(h.event('push', 'sat', 2));
    expect(h.history.state.idx).toBe(8);
    expect(h.history.state.usr).toEqual({ returnPath: '/library' });
    expect(h.history.state.key).toBe('router-key');
    h.send(h.event('replace', 'sat', 3));
    expect(h.history.state.idx).toBe(8);
    expect(h.history.pushState).toHaveBeenCalledTimes(1);
    expect(h.history.state['menticationScreen:goodMap'].depth).toBe(1);
  });

  it('restores the host cursor instead of replacing it with a recreated frame beginning', () => {
    const h = harness();
    h.send(h.event('init'));
    h.send(h.event('push', 'sat', 2));
    const before = h.history.state;
    h.cleanup();
    const newWindow = { postMessage: vi.fn() };
    h.getFrame.mockReturnValue({ contentWindow: newWindow });
    h.bind();
    h.send(h.event('init'), h.host.location.origin, newWindow);
    expect(h.history.state).toEqual(before);
    expect(newWindow.postMessage).toHaveBeenCalledWith({ type: 'mentication:restore-screen', journeyId: 'goodMap', screen: { id: 'sat', cursors: { moment: 0, satisfaction: 2 }, depth: 1 } }, h.host.location.origin);
  });

  it('restores browser Back to the current frame without answers in the message', () => {
    const h = harness();
    h.listeners.get('popstate')({ state: { 'menticationScreen:goodMap': { id: 'sat', cursors: { moment: 1, satisfaction: 2 }, depth: 3 } } });
    expect(h.frameWindow.postMessage).toHaveBeenCalledWith({ type: 'mentication:restore-screen', journeyId: 'goodMap', screen: { id: 'sat', cursors: { moment: 1, satisfaction: 2 }, depth: 3 } }, h.host.location.origin);
  });

  it('rejects another origin, another frame and another journey before writes or navigation', () => {
    const h = harness();
    h.send(h.event('push'), 'https://other.example');
    h.send(h.event('push'), h.host.location.origin, {});
    h.send({ ...h.event('push'), journeyId: 'nightChannel' });
    expect(h.history.pushState).not.toHaveBeenCalled();
    expect(h.history.replaceState).not.toHaveBeenCalled();
    expect(h.frameWindow.postMessage).not.toHaveBeenCalled();
  });

  it('rejects private fields, unknown screens and nonnumeric cursors', () => {
    const h = harness();
    for (const screen of [
      { id: 'intro', cursors: { moment: 0, satisfaction: 0 }, answer: 'private words' },
      { id: 'intro', cursors: { moment: 0, satisfaction: 0, note: 'private words' } },
      { id: 'not-a-screen', cursors: { moment: 0, satisfaction: 0 } },
      { id: 'sat', cursors: { moment: 0, satisfaction: '2' } },
      { id: 'sat', cursors: { moment: -1, satisfaction: 0 } },
      { id: 'sat', cursors: { moment: 0, satisfaction: Infinity } },
    ]) h.send({ ...h.event('push'), screen });
    expect(h.history.pushState).not.toHaveBeenCalled();
    expect(h.history.replaceState).not.toHaveBeenCalled();
    expect(JSON.stringify(h.history.state)).not.toContain('private words');
  });

  it('keeps initial return separate from screen Back and removes listeners on cleanup', () => {
    const h = harness();
    h.send(h.event('init'));
    h.send({ type: 'mentication:screen-back', journeyId: 'goodMap' });
    expect(h.onExit).toHaveBeenCalledTimes(1);
    h.send(h.event('push', 'sat'));
    h.send({ type: 'mentication:screen-back', journeyId: 'goodMap' });
    expect(h.history.back).toHaveBeenCalledTimes(1);
    h.cleanup();
    expect(h.listeners.size).toBe(0);
  });

  it('keeps the current metadata and emits no success restoration when initial history is blocked', () => {
    const h = harness();
    const before = h.history.state;
    h.history.replaceState.mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    expect(() => h.send(h.event('init'))).not.toThrow();
    expect(h.history.state).toBe(before);
    expect(h.frameWindow.postMessage).not.toHaveBeenCalled();
    expect(h.onError).toHaveBeenCalledOnce();
    h.history.replaceState.mockImplementation(value => { h.history.state = value; });
    h.send(h.event('init'));
    expect(h.frameWindow.postMessage).toHaveBeenCalledOnce();
  });

  it('catches blocked pushes and Back without changing remembered progress', () => {
    const h = harness();
    h.send(h.event('init'));
    h.send(h.event('push', 'sat', 1));
    const before = h.history.state;
    h.history.pushState.mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    expect(() => h.send(h.event('push', 'sat', 2))).not.toThrow();
    expect(h.history.state).toBe(before);
    h.history.back.mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
    expect(() => h.send({ type: 'mentication:screen-back', journeyId: 'goodMap' })).not.toThrow();
    expect(h.history.state).toBe(before);
    expect(h.onError).toHaveBeenCalledTimes(2);
    expect(h.onExit).not.toHaveBeenCalled();
  });

  it('does not let a late Forward acknowledgment overwrite a newer Back entry', () => {
    const h = harness();
    h.send(h.event('init'));
    const intro = h.history.state;
    h.send(h.event('push', 'sat', 1));
    const sat = h.history.state;
    h.listeners.get('popstate')({ state: sat });
    h.history.state = intro;
    h.listeners.get('popstate')({ state: intro });
    h.send(h.event('replace', 'sat', 1));
    expect(h.history.state).toBe(intro);
    h.send(h.event('replace', 'intro'));
    expect(h.history.state['menticationScreen:goodMap'].id).toBe('intro');
    h.send(h.event('push', 'sat', 2));
    expect(h.history.state['menticationScreen:goodMap']).toEqual({ id: 'sat', cursors: { moment: 0, satisfaction: 2 }, depth: 1 });
  });
});
