import { describe, expect, it, vi } from 'vitest';
import { bindJourneyNoteHistory } from './journeyNoteHistory';
function fixture() {
  const listeners = new Set();
  const original = { idx: 3, key: 'practice', usr: { privatePractice: 'retained' } };
  const host = {
    history: { state: original, pushState: vi.fn(function(state) { this.state = state; }), back: vi.fn() },
    addEventListener: (_, listener) => listeners.add(listener),
    removeEventListener: (_, listener) => listeners.delete(listener),
  };
  const pop = state => { host.history.state = state; for (const listener of listeners) listener(); };
  return { host, original, pop, listeners };
}
describe('Journey Takeaway history lifecycle', () => {
  it('preserves Router state and adds exactly one entry for the note', () => {
    const f = fixture(), binding = bindJourneyNoteHistory('note', vi.fn(), f.host);
    expect(f.host.history.state).toEqual({ ...f.original, idx: 4, journey_note: 'note' });
    binding.dispose();
    const rebound = bindJourneyNoteHistory('note', vi.fn(), f.host);
    expect(f.host.history.pushState).toHaveBeenCalledOnce();
    rebound.dispose();
  });
  it('closes once on Return/Escape without navigating twice on repeated dismissal', () => {
    const f = fixture(), close = vi.fn(), binding = bindJourneyNoteHistory('note', close, f.host);
    binding.close(); binding.close(); f.pop(f.original);
    expect(close).toHaveBeenCalledOnce(); expect(f.host.history.back).toHaveBeenCalledOnce();
    binding.dispose();
  });
  it('browser Back closes the note without issuing another Back', () => {
    const f = fixture(), close = vi.fn(), binding = bindJourneyNoteHistory('note', close, f.host);
    f.pop(f.original); binding.close();
    expect(close).toHaveBeenCalledOnce(); expect(f.host.history.back).not.toHaveBeenCalled();
    binding.dispose();
  });
  it('route unmount removes its listener without undoing navigation', () => {
    const f = fixture(), close = vi.fn(), binding = bindJourneyNoteHistory('note', close, f.host);
    binding.dispose(); f.pop({ idx: 5, key: 'saved-notes' });
    expect(f.listeners.size).toBe(0); expect(close).not.toHaveBeenCalled(); expect(f.host.history.back).not.toHaveBeenCalled();
  });
  it('retains dismissal when pushState is unavailable', () => {
    const f = fixture(), close = vi.fn(); f.host.history.pushState.mockImplementation(() => { throw Error('unavailable'); });
    const binding = bindJourneyNoteHistory('note', close, f.host); binding.close();
    expect(close).toHaveBeenCalledOnce(); expect(f.host.history.back).not.toHaveBeenCalled(); binding.dispose();
  });
  it('still dismisses when history.back is unavailable', () => {
    const f = fixture(), close = vi.fn(), binding = bindJourneyNoteHistory('note', close, f.host);
    f.host.history.back.mockImplementation(() => { throw Error('unavailable'); });
    expect(() => binding.close()).not.toThrow(); expect(close).toHaveBeenCalledOnce(); binding.dispose();
  });
  it('does not navigate backwards when newer navigation has already replaced the note', () => {
    const f = fixture(), close = vi.fn(), binding = bindJourneyNoteHistory('note', close, f.host);
    f.host.history.state = { idx: 5, key: 'new-route' }; binding.close();
    expect(f.host.history.back).not.toHaveBeenCalled(); binding.dispose();
  });
});
