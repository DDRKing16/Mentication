import { describe, expect, it } from 'vitest';
import { pmrRouteGroups } from './PMRRoute';
import { createPMRSteps } from '@/lib/pmrSession';
import { INTERVENTIONS } from '@/lib/interventions';
const original = INTERVENTIONS.find(iv => iv.id === 'progressive-muscle-relaxation-v2').steps;
describe('PMR chosen route', () => {
  it('shows only the selected areas for short release and contrast routes', () => {
    for (const mode of ['release', 'contrast']) {
      const steps = createPMRSteps(original, { length: 'short', mode });
      const groups = pmrRouteGroups(steps);
      expect(groups.map(group => group.region)).toEqual(['whole', 'hands', 'shoulders', 'lowerLegs', 'whole']);
      for (let index = 0; index < steps.length; index++) {
        const matching = groups.filter(group => index >= group.start && index <= group.end);
        expect(matching).toHaveLength(1);
        expect(matching[0].region).toBe(steps[index].region);
      }
    }
  });
  it('keeps all seven areas in a full route without changing the source steps', () => {
    const steps = createPMRSteps(original, { length: 'full', mode: 'contrast' });
    const snapshot = structuredClone(steps);
    expect(pmrRouteGroups(steps).filter(group => group.region !== 'whole')).toHaveLength(7);
    expect(steps).toEqual(snapshot);
  });
});
