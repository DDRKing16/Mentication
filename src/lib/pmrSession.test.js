import { describe, it, expect } from 'vitest';
import { createPMRSteps, nextPMRArea, pmrTiming, pmrCueState } from './pmrSession';
import { pathwayByIds } from './interventions';
const original = pathwayByIds(['progressive-muscle-relaxation-v2'])[0].steps;
describe('PMR routes and common cue timeline', () => {
  for (const length of ['short', 'full']) for (const mode of ['release', 'contrast']) {
    it(`${length} ${mode} preserves chosen protocol without unsafe extra contraction`, () => {
      const steps = createPMRSteps(original, { length, mode });
      const regions = new Set(steps.filter(s => s.region !== 'whole').map(s => s.region));
      expect(regions.size).toBe(length === 'short' ? 3 : 7);
      expect(steps.filter(s => s.phase === 'tense').length).toBe(mode === 'release' ? 0 : regions.size);
      expect(steps[0].phase).toBe('intro');
      expect(steps.at(-1).phase).toBe('return');
      for (const step of steps) expect(original.some(s => s.body === step.body)).toBe(true);
    });
  }
  it('skips all remaining phases of first, middle and last areas', () => {
    for (const mode of ['contrast', 'release']) {
      const steps = createPMRSteps(original, { mode });
      for (const region of ['hands', 'torso', 'lowerLegs']) {
        const index = steps.findIndex(s => s.region === region);
        const next = nextPMRArea(steps, index);
        expect(steps[next].region).not.toBe(region);
        expect(steps.slice(index, next).every(s => s.region === region)).toBe(true);
      }
    }
  });
  it('does not cut spoken release cues off at the former nine-second timer', () => {
    const step = original.find(s => s.phase === 'tense');
    const timing = pmrTiming(step);
    expect(timing.duration).toBeGreaterThan(13);
    const before = pmrCueState(step, 9);
    const after = pmrCueState(step, timing.duration);
    expect(before.visibleCount).toBeLessThan(after.visibleCount);
    expect(after.visibleCount).toBe(timing.alignment.length);
  });
});
