import { describe, expect, it } from 'vitest';
import { createTappingProgressClock } from './tappingProgressClock';

describe('tapping guide output clock', () => {
  it('holds the guide when native audio stalls despite advancing wall time', () => {
    const step = createTappingProgressClock();
    expect(step(0, 10)).toBe(false);
    expect(step(1000, 10.2)).toBe(false);
    expect(step(6000, 10.2)).toBe(false);
    expect(step(6250, 11)).toBe(true);
    expect(step(6500, 11.25)).toBe(false);
    expect(step(7250, 12)).toBe(true);
  });
  it('uses quiet wall time when no audio output is available', () => {
    const step = createTappingProgressClock();
    expect(step(1000)).toBe(false);
    expect(step(1750)).toBe(false);
    expect(step(2000)).toBe(true);
    expect(step(3000)).toBe(true);
  });
  it('keeps fractional progress at ordinary frame jitter without stretching the dose', () => {
    const step = createTappingProgressClock(); step(0, 20);
    let seconds = 0;
    for (let i = 1; i <= 40; i++) if (step(i * 250, 20 + i * .25)) seconds++;
    expect(seconds).toBe(10);
  });
  it('consumes the full second at floating-point boundaries without advancing the next cue early', () => {
    const step = createTappingProgressClock(); step(0, 10.1);
    expect(step(1000, 11.1 - 1e-12)).toBe(true);
    expect(step(1250, 11.35)).toBe(false);
    expect(step(1750, 11.85)).toBe(false);
    expect(step(2000, 12.1)).toBe(true);
  });
  it('advances once after a blocked callback and discards whole seconds of backlog', () => {
    const step = createTappingProgressClock(); step(0, 10);
    expect(step(9000, 19.1)).toBe(true);
    expect(step(9250, 19.35)).toBe(false);
    expect(step(9500, 19.6)).toBe(false);
    expect(step(9750, 19.85)).toBe(false);
    expect(step(10000, 20.1)).toBe(true);
  });
  it('reanchors mute/unmute without counting time from another clock', () => {
    const step = createTappingProgressClock(); step(0, 10);
    expect(step(750, 10.75)).toBe(false);
    expect(step(1000)).toBe(false);
    expect(step(2000)).toBe(true);
    expect(step(2250, 13)).toBe(false);
    expect(step(3250, 14)).toBe(true);
  });
  it('ignores backwards timestamp jitter instead of counting it twice', () => {
    const step = createTappingProgressClock(); step(0, 10);
    expect(step(500, 10.5)).toBe(false);
    expect(step(750, 10.45)).toBe(false);
    expect(step(1000, 11)).toBe(true);
    expect(step(1250, 11)).toBe(false);
  });
  it('a new clock starts at the saved place after a pause or point change', () => {
    const step = createTappingProgressClock(); step(0, 10); step(750, 10.75);
    const resumed = createTappingProgressClock();
    expect(resumed(9000, 19)).toBe(false);
    expect(resumed(9750, 19.75)).toBe(false);
    expect(resumed(10000, 20)).toBe(true);
  });
});
