import assert from 'node:assert/strict';
import {
  INTERVENTIONS,
  buildPathway,
  buildSegment,
  computeEffectiveness,
  immediatePathway,
  RECOMMENDATION_ENGINE_VERSION,
} from '../src/lib/interventions.js';
import {
  hardEligibleV3,
  intensityFitV3,
  scoreInterventionV3,
  V3_WEIGHTS,
} from '../src/lib/recommendationV3.js';
import { FINAL_50_ALGORITHM_META } from '../src/lib/final50AlgorithmMeta.js';
import { CORE_25_IDS } from '../src/lib/final50Catalog.js';

const byId = (id) => INTERVENTIONS.find((iv) => iv.id === id);
const approx = (actual, expected, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
};

assert.equal(RECOMMENDATION_ENGINE_VERSION, '3.3.0-flagship17');
assert.equal(INTERVENTIONS.length, 25);
assert.deepEqual(CORE_25_IDS.filter((id) => !FINAL_50_ALGORITHM_META[id]), []);

// Preferred/eligible intensity is the source of truth, including taper to .35.
const checkEvidence = byId('factCheck');
assert.deepEqual(
  [checkEvidence.intensityMin, checkEvidence.preferredIntensityMin, checkEvidence.preferredIntensityMax, checkEvidence.intensityMax],
  [2, 3, 6, 7],
);
assert.equal(intensityFitV3(checkEvidence, 1), 0);
approx(intensityFitV3(checkEvidence, 2), 0.35);
assert.equal(intensityFitV3(checkEvidence, 3), 1);
assert.equal(intensityFitV3(checkEvidence, 6), 1);
approx(intensityFitV3(checkEvidence, 7), 0.35);
assert.equal(intensityFitV3(checkEvidence, 8), 0);
assert.equal(hardEligibleV3(checkEvidence, {
  direction: 'calm', intensity: 8, whereFelt: 'thoughts', timeMin: 10,
  location: 'home', audio: 'yes', movement: 'seated',
}), false);

// Raising tools are hard-ineligible at 9–10.
const pulseShift = byId('pulseShift');
assert.equal(hardEligibleV3(pulseShift, {
  direction: 'lift', intensity: 9, whereFelt: 'body', timeMin: 10,
  location: 'home', audio: 'yes', movement: 'yes',
}), false);

// Verify the exact score equation from the returned normalized components.
const answers = {
  direction: 'calm', intensity: 8, whereFelt: 'body', timeMin: 10,
  location: 'home', audio: 'yes', movement: 'seated', seed: 'formula-check',
};
const scored = scoreInterventionV3(byId('sigh'), answers, {}, {
  slot: 'opener',
  dislikePenalty: () => 2.5,
  seed: 'formula-check',
});
assert.equal(scored.eligible, true);
const c = scored.components;
const expectedScore =
  V3_WEIGHTS.state * c.S +
  V3_WEIGHTS.intensity * c.I +
  V3_WEIGHTS.personal * c.P +
  V3_WEIGHTS.target * c.T +
  V3_WEIGHTS.direction * c.D +
  V3_WEIGHTS.loadArousal * c.L +
  V3_WEIGHTS.context * c.C +
  V3_WEIGHTS.evidence * c.E +
  V3_WEIGHTS.role * c.R +
  V3_WEIGHTS.diversity * c.V +
  V3_WEIGHTS.novelty * c.N -
  scored.DP + scored.J;
approx(scored.score, expectedScore);
for (const value of Object.values(c)) assert.ok(value >= 0 && value <= 1);
assert.ok(scored.J >= -0.1 && scored.J <= 0.1);

// Bayesian learning hierarchy: better > same > worse; unanswered is neutral/no evidence.
const now = new Date('2026-08-29T00:00:00+10:00');
const baseAttempt = {
  intervention_id: 'sigh', mechanism: byId('sigh').mechanism,
  completed_percentage: 1, context_key: 'calm|body_tension|7-8|body|home|standard',
  ended_at: now.toISOString(),
};
const sessionFor = (response) => [{
  created_date: now.toISOString(), direction: 'calm', pathway: ['sigh'],
  attempts: [{ ...baseAttempt, response }],
}];
const better = computeEffectiveness(sessionFor('better')).sigh;
const same = computeEffectiveness(sessionFor('same')).sigh;
const worse = computeEffectiveness(sessionFor('worse')).sigh;
const unanswered = computeEffectiveness(sessionFor('not_answered')).sigh;
assert.ok(better > same && same > worse);
approx(unanswered, 0.5);

// Immediate mode uses the same ranker but never leaks disallowed candidates.
const immediate = immediatePathway(9, {
  whereFelt: 'body', timeMin: 5, location: 'home', audio: 'yes', movement: 'seated',
}, {});
assert.ok(immediate.length > 0);
for (const iv of immediate) {
  assert.ok(Number(iv.cognitiveLoad ?? 2) <= 2);
  assert.ok(Number(iv.durationMin ?? 99) <= 3);
  assert.ok(['lower', 'steady'].includes(iv.arousal));
  assert.ok((iv.pathwayRoles || []).some((r) => ['opener', 'rescue'].includes(String(r).toLowerCase())));
  assert.ok(!['temperature-shock', 'breath-hold', 'paced-hold'].includes(iv.mechanism));
  assert.notEqual(iv.mechanismFamily || iv.category, 'cognitive');
}
const immediateNext = buildSegment({
  direction: 'calm', immediate: true, intensity: 9, whereFelt: 'body', timeMin: 5,
  location: 'home', audio: 'yes', movement: 'seated',
}, {}, { targetMin: 3, count: 1, usedIds: [immediate[0].id] });
for (const iv of immediateNext) {
  assert.ok(Number(iv.cognitiveLoad ?? 2) <= 2);
  assert.ok(Number(iv.durationMin ?? 99) <= 3);
  assert.ok(['lower', 'steady'].includes(iv.arousal));
}

// Hard-eligible ranking never falls back to an intensity-ineligible option.
const impossible = buildPathway({
  direction: 'lift', intensity: 10, whereFelt: 'body', timeMin: 1,
  location: 'public', audio: 'no', movement: 'discreet',
}, {});
assert.deepEqual(impossible, []);

// Dislike penalty: exact + mechanism, with 30-day half-life.
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
const { recordDislike, dislikePenalty } = await import('../src/lib/preferences.js');
const nowMs = now.getTime();
recordDislike('sigh', byId('sigh').mechanism, now.toISOString());
const recentPenalty = dislikePenalty('sigh', byId('sigh').mechanism, nowMs);
approx(recentPenalty, 9); // 7 exact + 2 mechanism
store.clear();
const old = new Date(nowMs - 30 * 24 * 60 * 60 * 1000).toISOString();
recordDislike('sigh', byId('sigh').mechanism, old);
const halfLifePenalty = dislikePenalty('sigh', byId('sigh').mechanism, nowMs);
approx(halfLifePenalty, 4.5, 1e-8);

console.log('Mentication V3 verification passed.');
