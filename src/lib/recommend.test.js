import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRecommendation } from './recommend';
import { createInitialResetAnswers } from './resetFlowConfig';
import { contextKeyV3, inferProfileV3, suitabilityIntensityV3 } from './recommendationV3';

afterEach(() => vi.useRealTimers());
describe('fresh and correctly typed recommendation context', () => {
  it('requires a real Lift check-in for morning suggestions instead of inventing distress', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 5, 8));
    const recommendation = buildRecommendation([]);
    expect(recommendation.direction).toBe('lift');
    expect(recommendation.requiresCheckIn).toBe(true);
    expect(recommendation.pathway).toEqual([]);
    expect(recommendation.minutes).toBeNull();
  });
  it('preserves supplied resource and safety exclusions through actual entry initialization', () => {
    const a = createInitialResetAnswers({ direction: 'lift', intensity: 8, distress: 3, contraindicationTags: ['pain'], unsuitableSubstates: ['immediate-danger'], requiredResources: ['screen interaction'], acute: true, disconnected: true });
    expect(a.distress).toBe(3);
    expect(a.intensity).toBe(8);
    expect(a.contraindicationTags).toEqual(['pain']);
    expect(a.unsuitableSubstates).toEqual(['immediate-danger']);
    expect(a.requiredResources).toEqual(['screen interaction']);
    expect(a.acute).toBe(true);
    expect(a.disconnected).toBe(true);
    expect(createInitialResetAnswers({ direction: 'lift', intensity: 5 }).distress).toBeNull();
  });
  it('never labels good mood as acute distress or assigns unknown distress zero', () => {
    expect(Number.isNaN(suitabilityIntensityV3({ direction: 'lift', intensity: 10 }))).toBe(true);
    expect(inferProfileV3({ direction: 'lift', intensity: 10, distress: 3 }).tags.has('acute')).toBe(false);
    expect(inferProfileV3({ direction: 'lift', intensity: 3, distress: 8 }).tags.has('acute')).toBe(true);
    expect(contextKeyV3({ direction: 'lift', intensity: 5, distress: 3 })).not.toBe(contextKeyV3({ direction: 'lift', intensity: 5, distress: 7 }));
  });
});
