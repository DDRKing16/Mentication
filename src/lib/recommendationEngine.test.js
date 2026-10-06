import { afterEach, describe, expect, it, vi } from 'vitest';
import { INTERVENTIONS, buildPathway, buildSegment, computeEffectiveness, immediatePathway, segmentMinutes, suggestSwitch } from './interventions';
import { ACTIVE_INTERVENTION_IDS } from './final50Catalog';
import { contextKeyV3, hardEligibleV3, immediateEligibleV3, intensityFitV3, interventionDurationSeconds, personalFitV3, scoreInterventionV3, V3_WEIGHTS } from './recommendationV3';
import { createInitialResetAnswers } from './resetFlowConfig';
import { recordDislike } from './preferences';
import { standaloneRouteFor } from './standaloneInterventions';

const byId = (id) => INTERVENTIONS.find((iv) => iv.id === id);
const answers = (overrides = {}) => ({ direction: 'calm', intensity: 5, distress: 5, whereFelt: 'both', timeMin: 5, location: 'home', audio: 'yes', movement: 'seated', ...overrides });
const session = (id, response, overrides = {}) => ({
  created_date: new Date().toISOString(), direction: 'calm', pathway: [id],
  context_snapshot: answers(),
  attempts: [{ intervention_id: id, response, completed_percentage: 1, exit_reason: 'completed', ended_at: new Date().toISOString(), context_key: contextKeyV3(answers()) }],
  ...overrides,
});
afterEach(() => vi.unstubAllGlobals());

describe('current catalogue recommendation contracts', () => {
  it('uses exactly the approved reachable pool, including dual-entry Good Map', () => {
    expect(INTERVENTIONS.map((iv) => iv.id)).toEqual([
      'boxV2', 'progressive-muscle-relaxation-v2', 'factCheck', 'urgeSurf',
      'happyBump', 'changeScene', 'goodMap', 'grounding54321V2', 'vectorShift',
      'nextAction', 'signalLock', 'tomorrowParking', 'nightChannel',
      'eftTapping', 'selfCompassion', 'unhook', 'makeRoom', 'taraTactician',
    ]);
    expect(ACTIVE_INTERVENTION_IDS).toEqual(INTERVENTIONS.map((iv) => iv.id));
    expect(standaloneRouteFor('goodMap')).toBe('/good-map');
    expect(standaloneRouteFor('signalLock')).toBe('/signal-lock');
    expect(standaloneRouteFor('vectorShift')).toBe('/vector-shift');
    expect(standaloneRouteFor('nightChannel')).toBe('/night-channel');
  });

  it.each(['calm', 'lift', 'focus', 'ground', 'sleep', 'reset'])('never leaks wrong-goal or out-of-range choices for %s at any boundary', (direction) => {
    for (let intensity = 0; intensity <= 10; intensity += 1) {
      const a = answers({ direction, intensity, distress: intensity, timeMin: 15, movement: 'yes' });
      const path = buildPathway(a);
      for (const iv of path) {
        expect(iv.algorithmDirections, iv.id).toContain(direction);
        expect(hardEligibleV3(iv, a), iv.id).toBe(true);
        expect(intensity).toBeGreaterThanOrEqual(iv.intensityMin);
        expect(intensity).toBeLessThanOrEqual(iv.intensityMax);
      }
      expect(new Set(path.map((iv) => iv.id)).size).toBe(path.length);
      expect(path.reduce((s, iv) => s + interventionDurationSeconds(iv), 0)).toBeLessThanOrEqual(900);
    }
  });

  it.each(['calm', 'lift', 'focus', 'ground', 'sleep', 'reset'])('offers an existing suitable cold-start practice for %s', (direction) => {
    expect(buildPathway(answers({ direction })).length).toBeGreaterThan(0);
  });

  it('repairs the actual Welcome immediate defaults without changing dose or safety metadata', () => {
    const a = createInitialResetAnswers({ immediate: true });
    expect(buildPathway(a).map((iv) => iv.id)).toEqual(['grounding54321V2']);
    expect(segmentMinutes(buildPathway(a))).toBe(5);
    expect(byId('grounding54321V2').durationMin).toBe(5);
    expect(byId('grounding54321V2').intensityMin).toBe(4);
  });

  it('honours rescue eligibility across immediate intensity boundaries', () => {
    for (let intensity = 0; intensity <= 10; intensity += 1) {
      const a = answers({ intensity, immediate: true });
      const path = buildPathway(a);
      expect(path.length > 0).toBe(intensity >= 4);
      path.forEach((iv) => expect(immediateEligibleV3(iv, a)).toBe(true));
    }
    expect(immediatePathway(10, answers({ intensity: 10 })).map((iv) => iv.id)).toEqual(['grounding54321V2']);
    expect(immediatePathway(9, answers({ intensity: 9, timeMin: 3 }))).toEqual([]);
    expect(immediateEligibleV3(byId('boxV2'), answers())).toBe(false);
    expect(immediateEligibleV3(byId('factCheck'), answers())).toBe(false);
    expect(immediateEligibleV3(byId('happyBump'), answers({ movement: 'yes' }))).toBe(false);
  });

  it('does not reuse placeholder timers to squeeze a full experience into leftover time', () => {
    expect(interventionDurationSeconds(byId('grounding54321V2'))).toBe(300);
    expect(interventionDurationSeconds(byId('nightChannel'))).toBe(900);
    expect(hardEligibleV3(byId('grounding54321V2'), answers({ remainingTime: 1 }))).toBe(false);
    expect(buildSegment(answers({ immediate: true, intensity: 9 }), {}, { targetMin: 3 })).toEqual([]);
    expect(buildSegment(answers({ immediate: true, intensity: 9 }), {}, { targetMin: 5, usedIds: ['grounding54321V2'] })).toEqual([]);
  });

  it('preserves intensity taper and upper exclusions', () => {
    const iv = byId('factCheck');
    expect([1, 2, 3, 6, 7, 8].map((n) => intensityFitV3(iv, n))).toEqual([0, 0.35, 1, 1, 0.35, 0]);
    expect(hardEligibleV3(iv, answers({ intensity: 8 }))).toBe(false);
    expect(hardEligibleV3(byId('vectorShift'), answers({ intensity: 9 }))).toBe(false);
  });

  it('preserves context and contraindication exclusions', () => {
    expect(hardEligibleV3(byId('boxV2'), answers({ noBreathing: true }))).toBe(false);
    expect(hardEligibleV3(byId('nightChannel'), answers({ direction: 'sleep', timeMin: 20, audio: 'no' }))).toBe(false);
    expect(hardEligibleV3(byId('happyBump'), answers({ direction: 'lift', movement: 'yes', contraindicationTags: ['dizziness'] }))).toBe(false);
    expect(hardEligibleV3(byId('vectorShift'), answers({ unsuitableSubstates: ['immediate-danger'] }))).toBe(false);
    const constrained = { ...byId('grounding54321V2'), environment: 'private', movement: 'full', eyes: 'closed', requiredResources: ['mat'] };
    expect(hardEligibleV3(constrained, answers({ location: 'public', eyesOpen: true }))).toBe(false);
    expect(hardEligibleV3(constrained, answers({ movement: 'yes', requiredResources: ['mat'] }))).toBe(true);
    expect(buildPathway(answers({ direction: 'lift', intensity: 10, timeMin: 1, location: 'public', audio: 'no', movement: 'discreet' }))).toEqual([]);
    expect(buildPathway(answers({ direction: 'unknown' }))).toEqual([]);
  });

  it('uses the documented weighted score for an active intervention', () => {
    const result = scoreInterventionV3(byId('boxV2'), answers(), {}, { dislikePenalty: () => 2.5 });
    expect(result.eligible).toBe(true);
    const keys = ['S', 'I', 'P', 'T', 'D', 'L', 'C', 'E', 'R', 'V', 'N'];
    const weighted = Object.values(V3_WEIGHTS).reduce((sum, w, i) => sum + w * result.components[keys[i]], 0);
    expect(result.score).toBeCloseTo(weighted - 2.5 + result.J);
  });
});

describe('personal outcomes with sparse and noisy history', () => {
  it('shrinks single observations and ignores missing responses', () => {
    const better = computeEffectiveness([session('boxV2', 'better')]).boxV2;
    const worse = computeEffectiveness([session('boxV2', 'worse')]).boxV2;
    expect(better).toBeGreaterThan(0.5);
    expect(better).toBeLessThan(0.7);
    expect(worse).toBeLessThan(0.5);
    expect(worse).toBeGreaterThan(0.3);
    expect(computeEffectiveness([session('boxV2', 'not_answered')]).boxV2).toBe(0.5);
    expect(personalFitV3(byId('boxV2'), answers(), {})).toBe(0.5);
  });

  it('prefers a suitable alternative to a negatively rated cold-start winner', () => {
    const a = answers({ timeMin: 5 });
    const original = buildPathway(a)[0].id;
    const eff = computeEffectiveness([session(original, 'worse')]);
    expect(buildPathway(a, eff)[0].id).not.toBe(original);
    expect(hardEligibleV3(buildPathway(a, eff)[0], a)).toBe(true);
    expect(suggestSwitch(original, 'thoughts', a, eff)?.id).not.toBe(original);
  });

  it('learns a helpful practice without letting its feedback override the current goal', () => {
    const history = Array.from({ length: 10 }, () => session('factCheck', 'better'));
    const eff = computeEffectiveness(history);
    const a = answers({ whereFelt: 'thoughts', timeMin: 3 });
    expect(buildPathway(a, eff)[0].id).toBe('factCheck');
    expect(buildPathway(answers({ direction: 'focus' }), eff).map((iv) => iv.id)).not.toContain('factCheck');
    expect(buildPathway(answers({ intensity: 9 }), eff).map((iv) => iv.id)).not.toContain('factCheck');
  });

  it('honours the owner-required Happy Bump opener despite personal ranking', () => {
    const a = answers({ direction: 'lift', intensity: 3, movement: 'yes' });
    expect(buildPathway(a)[0].id).toBe('happyBump');
    expect(buildPathway(a, computeEffectiveness([session('happyBump', 'worse')]))[0].id).toBe('happyBump');
    const storage = new Map();
    vi.stubGlobal('localStorage', { getItem: (k) => storage.get(k), setItem: (k, v) => storage.set(k, v) });
    recordDislike('happyBump', byId('happyBump').mechanism);
    expect(buildPathway(a)[0].id).toBe('happyBump');
  });

  it('uses explicit single-practice session preference when no attempt response exists', () => {
    const s = session('boxV2', 'not_answered', { would_use_again: 'no' });
    expect(computeEffectiveness([s]).boxV2).toBeLessThan(0.5);
    expect(computeEffectiveness([{ ...s, would_use_again: 'yes' }]).boxV2).toBeGreaterThan(0.5);
    expect(computeEffectiveness([{ ...s, attempts: [], completed_pathway: [] }]).boxV2).toBe(0.5);
    const multi = { ...s, completed_pathway: ['boxV2', 'factCheck'] };
    expect(computeEffectiveness([multi]).boxV2).toBe(0.5);
    const answered = session('boxV2', 'better', { would_use_again: 'no' });
    expect(computeEffectiveness([answered]).boxV2).toBeCloseTo(computeEffectiveness([session('boxV2', 'better')]).boxV2);
  });

  it('never transfers retired-practice outcomes to a guessed active successor', () => {
    const eff = computeEffectiveness([session('sigh', 'better'), session('pulseShift', 'worse')]);
    expect(eff.totalUses).toBe(0);
    expect(Object.keys(eff.contextMap)).toEqual([]);
    INTERVENTIONS.forEach((iv) => expect(eff[iv.id]).toBeUndefined());
  });

  it('weakens old evidence and balances contradictory responses', () => {
    const old = new Date(Date.now() - 180 * 86400000).toISOString();
    const historic = session('boxV2', 'better');
    historic.attempts[0].ended_at = old;
    expect(computeEffectiveness([historic]).boxV2).toBeLessThan(computeEffectiveness([session('boxV2', 'better')]).boxV2);
    expect(computeEffectiveness([session('boxV2', 'better'), session('boxV2', 'worse')]).boxV2).toBeCloseTo(0.5);
  });
});
