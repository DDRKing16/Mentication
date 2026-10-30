import { describe, expect, it, vi } from 'vitest';
import { startUrgeGuide } from './urgeSurfAudio';

describe('revised Urge Surfing narration availability', () => {
  const player = () => ({ enabled: true, preload: vi.fn(), speak: vi.fn(), stop: vi.fn(), setActive: vi.fn(), lookup: vi.fn() });
  it('does not duck the soundscape or play another sentence when the revised line is absent', () => {
    const p = player();p.lookup.mockReturnValue(null);
    const cleanup = startUrgeGuide('revised sentence', p);
    expect(p.setActive).toHaveBeenCalledWith(false);expect(p.stop).toHaveBeenCalledOnce();
    expect(p.preload).not.toHaveBeenCalled();expect(p.speak).not.toHaveBeenCalled();expect(cleanup).toBe(p.stop);
  });
  it('uses the exact matching line and releases ducking on its natural end', () => {
    const p = player();p.lookup.mockReturnValue({ url: '/audio/narration/approved.mp3' });
    const cleanup = startUrgeGuide('approved sentence', p);
    expect(p.lookup).toHaveBeenCalledWith('approved sentence');expect(p.setActive).toHaveBeenCalledWith(true);
    expect(p.preload).toHaveBeenCalledWith('approved sentence');
    expect(p.speak.mock.calls[0][0]).toBe('approved sentence');expect(p.speak.mock.calls[0][1].rate).toBe(1);
    p.speak.mock.calls[0][1].onEnd();expect(p.setActive).toHaveBeenLastCalledWith(false);expect(cleanup).toBe(p.stop);
  });
  it('keeps no-audio sessions silent without looking up a recording', () => {
    const p = player();p.enabled=false;startUrgeGuide('approved sentence', p);
    expect(p.lookup).not.toHaveBeenCalled();expect(p.speak).not.toHaveBeenCalled();expect(p.setActive).toHaveBeenCalledWith(false);
  });
});
