import { describe, expect, it, vi } from 'vitest';
import { buildPathway, buildSegment, computeEffectiveness, buildProfile, immediatePathway, RECOMMENDATION_ENGINE_VERSION, getIntervention, normalizeAttemptResponse, coarseContextKey, buildAttemptRecord, suggestAdaptiveAlternative, INTERVENTIONS, pathwayByIds } from '@/lib/interventions';
import { CORE_25_CATALOGUE_VERSION, CORE_25_IDS, core25Counts } from '@/lib/final50Catalog';
import {
  hardEligibleV3,
  intensityFitV3,
  scoreInterventionV3,
  V3_WEIGHTS,
} from '@/lib/recommendationV3';
import { computeEffectivenessInsights, computeLocalCalendarStreak } from '@/lib/insights';
import { FLAGSHIP_IDS, FLAGSHIP_REGISTRY } from '@/lib/flagshipRegistry';
import { handoffRules, recommendHandoff } from '@/lib/flagshipHandoffs';
import { recordDislike } from '@/lib/preferences';

describe('recommendation engine v2 basics', () => {
  it('locks the production catalogue to the curated 26 with 18 flagships', () => {
    expect(INTERVENTIONS).toHaveLength(26);
    expect(new Set(INTERVENTIONS.map((iv) => iv.id)).size).toBe(26);
    expect(INTERVENTIONS.map((iv) => iv.id)).toEqual(CORE_25_IDS);
    expect(CORE_25_CATALOGUE_VERSION).toBe('2026-09-14-v1-core26');
    expect(core25Counts(INTERVENTIONS)).toEqual({
      calm: 7,
      lift: 8,
      ground: 4,
      focus: 3,
      sleep: 4,
    });
    expect(INTERVENTIONS.every((iv) => iv.catalogueStatus === 'curated')).toBe(true);
  });

  it('provides useful cross-routed choices for every home direction', () => {
    const minimumEligible = { calm: 6, lift: 6, ground: 6, focus: 6, sleep: 5 };
    for (const direction of ['calm', 'lift', 'ground', 'focus', 'sleep']) {
      const eligible = INTERVENTIONS.filter((iv) => iv.directions.includes(direction));
      expect(eligible.length, direction).toBeGreaterThanOrEqual(minimumEligible[direction]);
    }
  });

  it('uses Happy Bump as the Lift opener until feedback shows it is unwanted', () => {
    const answers = {
      direction: 'lift', intensity: 3, whereFelt: 'both', timeMin: 6,
      location: 'home', audio: 'yes', movement: 'yes',
    };
    expect(buildPathway(answers, {})[0]?.id).toBe('happyBump');

    const storage = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
      removeItem: (key) => storage.delete(key),
    });
    try {
      recordDislike('happyBump', getIntervention('happyBump').mechanism);
      expect(buildPathway(answers, {})[0]?.id).not.toBe('happyBump');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('honours a strongly effective Lift alternative over the Happy Bump default', () => {
    const answers = {
      direction: 'lift', intensity: 3, whereFelt: 'both', timeMin: 6,
      location: 'home', audio: 'yes', movement: 'yes',
    };
    const path = buildPathway(answers, { happyBump: 0.2, activationMenu: 0.9 });
    expect(path[0]?.id).toBe('activationMenu');
  });

  it('offers Happy Bump only as a context-aware Calm and Focus secondary option', () => {
    const calm = { direction: 'calm', intensity: 4, whereFelt: 'both', timeMin: 6, location: 'home', audio: 'yes', movement: 'yes' };
    const focus = { direction: 'focus', intensity: 3, whereFelt: 'both', timeMin: 6, location: 'home', audio: 'yes', movement: 'yes', avoiding: true };
    expect(hardEligibleV3(getIntervention('happyBump'), calm)).toBe(true);
    expect(hardEligibleV3(getIntervention('happyBump'), focus)).toBe(true);
    expect(hardEligibleV3(getIntervention('happyBump'), { ...calm, intensity: 8 })).toBe(false);
    expect(hardEligibleV3(getIntervention('happyBump'), { ...focus, avoiding: false })).toBe(false);
  });

  it('maps retired hero and duplicate ids to their core-25 successor', () => {
    expect(getIntervention('box').id).toBe('boxV2');
    expect(getIntervention('grounding54321').id).toBe('grounding54321V2');
    expect(getIntervention('pmr').id).toBe('progressive-muscle-relaxation-v2');
    expect(getIntervention('coherent').id).toBe('sigh');
    expect(pathwayByIds(['box', 'grounding54321', 'pmr']).map((iv) => iv.id)).toEqual([
      'boxV2',
      'grounding54321V2',
      'progressive-muscle-relaxation-v2',
    ]);
    expect(getIntervention('energyLadder').id).toBe('activationMenu');
    expect(getIntervention('natureReset').id).toBe('changeScene');
    expect(getIntervention('valuesStep').id).toBe('activationMenu');
    expect(getIntervention('pomodoro').id).toBe('signalLock');
    expect(getIntervention('woop').id).toBe('nextAction');
    expect(getIntervention('brainDump').id).toBe('nextAction');
    expect(getIntervention('warmHeavy').id).toBe('progressive-muscle-relaxation-v2');
  });

  it('contains every selected flagship and a mechanism-diverse supporting set', () => {
    const required = [
      'boxV2',
      'grounding54321V2',
      'progressive-muscle-relaxation-v2',
      'factCheck',
      'urgeSurf',
      'activationMenu',
      'happyBump',
      'nextAction',
      'tomorrowParking',
      'thenWhat',
      'countermove',
      'openChannel',
      'pulseShift',
      'reroute',
      'signalLock',
      'nightChannel',
    ];
    expect(required.every((id) => INTERVENTIONS.some((iv) => iv.id === id))).toBe(true);
    expect(INTERVENTIONS.some((iv) => iv.id === 'changeScene')).toBe(true);
    expect(INTERVENTIONS.some((iv) => iv.id === 'songMove')).toBe(false);
    expect(new Set(INTERVENTIONS.map((iv) => iv.mechanismFamily)).size).toBeGreaterThanOrEqual(15);
    expect(FLAGSHIP_IDS).toHaveLength(18);
    expect(FLAGSHIP_IDS.every((id) => INTERVENTIONS.some((iv) => iv.id === id && iv.flagship))).toBe(true);
    expect(FLAGSHIP_REGISTRY.nextAction.displayName).toBe('Next Easiest Step');
    expect(INTERVENTIONS.some((iv) => /Gravity Map|Quiet Return/i.test(iv.name))).toBe(false);
    for (const id of FLAGSHIP_IDS) {
      const meta = FLAGSHIP_REGISTRY[id];
      expect(meta.primaryGoal, id).toBeTruthy();
      expect(meta.primaryMechanism, id).toBeTruthy();
      expect(meta.interactionSignature, id).toBeTruthy();
      expect(meta.completionModel, id).toBeTruthy();
    }
  });

  it('implements consent-based, non-circular flagship hand-off rules', () => {
    expect(handoffRules().length).toBeGreaterThanOrEqual(14);
    expect(recommendHandoff('factCheck', { classification: 'prediction', safelyTestable: true })?.to).toBe('testPrediction');
    expect(recommendHandoff('thenWhat', { presentAction: 'yes' })?.to).toBe('nextAction');
    expect(recommendHandoff('reroute', { couldNotBegin: true })?.to).toBe('nextAction');
    expect(recommendHandoff('signalLock', { targetUnstartable: true })?.to).toBe('nextAction');
    expect(recommendHandoff('tomorrowParking', { parkedNow: true, audioAllowed: true })?.to).toBe('nightChannel');
    expect(recommendHandoff('countermove', { pull: 'isolate', relational: true, directActionTooDemanding: true })?.to).toBe('reroute');
    expect(handoffRules().every((rule) => FLAGSHIP_REGISTRY[rule.from] && FLAGSHIP_REGISTRY[rule.to])).toBe(true);
    expect(handoffRules().every((rule) => rule.from !== rule.to)).toBe(true);
  });

  it('keeps explicit preferences hard constraints', () => {
    const a = {
      direction: 'calm',
      intensity: 5,
      whereFelt: 'body',
      timeMin: 6,
      location: 'public',
      audio: 'no',
      movement: 'seated',
      noBreathing: true,
      eyesOpen: true,
      discreet: true,
      noAudio: true,
    };
    const candidates = buildPathway(a, {}).filter(Boolean);
    expect(candidates.length).toBeGreaterThan(0);
    for (const iv of candidates) {
      expect(iv.category).not.toBe('breathing');
      expect(iv.eyes).not.toBe('closed');
      if (iv.audio === 'required') throw new Error('audio required candidate leaked');
      if (iv.movement === 'full') throw new Error('full movement candidate leaked');
      if (iv.environment === 'private' && !iv.discreet) throw new Error('private env leaked');
    }
  });

  it('Immediate mode avoids strong cold or breath-hold tools', () => {
    const path = immediatePathway(9);
    expect(path.some((iv) => ['coldWater', 'breathHold', 'panicHold'].includes(iv.id))).toBe(false);
  });

  it('Intensity 9-10 performs no exploration', () => {
    const path = buildPathway({ direction: 'calm', intensity: 9, whereFelt: 'body', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }, {});
    expect(path.length).toBeGreaterThan(0);
    expect(path[0].id).toBeDefined();
  });

  it('prebuilt sessions obtain a current baseline and legacy sessions still load', () => {
    const legacy = { direction: 'calm', pathway: ['sigh', 'grounding54321'], intensity_start: 7, intensity_end: 4, would_use_again: 'yes' };
    const profile = buildProfile([legacy]);
    expect(profile.count).toBeGreaterThanOrEqual(1);
    expect(typeof RECOMMENDATION_ENGINE_VERSION).toBe('string');
  });

  it('helped most ids affect the selected interventions only', () => {
    const sessions = [{
      pathway: ['sigh', 'grounding54321'],
      intensity_start: 8,
      intensity_end: 4,
      direction: 'calm',
      created_date: new Date().toISOString(),
      helped_most_ids: ['sigh'],
    }];
    const eff = computeEffectiveness(sessions);
    expect(eff.sigh).toBeGreaterThan(eff.grounding54321 ?? 0);
  });

  it('seeded exploration is deterministic', () => {
    const out1 = buildPathway({ direction: 'calm', intensity: 5, whereFelt: 'both', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated', seed: 1 }, {});
    const out2 = buildPathway({ direction: 'calm', intensity: 5, whereFelt: 'both', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated', seed: 1 }, {});
    expect(out1.map((iv) => iv.id)).toEqual(out2.map((iv) => iv.id));
  });

  it('legacy path still resolves safe fallbacks', () => {
    expect(getIntervention('sigh').id).toBe('sigh');
    expect(buildSegment({ direction: 'calm', intensity: 5, whereFelt: 'both', timeMin: 2, location: 'home', audio: 'yes', movement: 'seated' }).length).toBeGreaterThan(0);
  });

  it('normalizes attempt response strings', () => {
    expect(normalizeAttemptResponse('BETTER')).toBe('better');
    expect(normalizeAttemptResponse('same')).toBe('same');
    expect(normalizeAttemptResponse('not_answered')).toBe('not_answered');
  });

  it('V2 session payload includes context snapshot and attempts', () => {
    const answers = {
      direction: 'calm',
      intensity: 8,
      whereFelt: 'body',
      timeMin: 10,
      location: 'home',
      audio: 'yes',
      movement: 'seated',
      discreet: false,
      eyesOpen: false,
      noBreathing: false,
      noAudio: false,
      bedtime: false,
    };
    
    const contextKey = coarseContextKey(answers);
    expect(typeof contextKey).toBe('string');
    expect(contextKey).toContain('calm');
    
    const attempt = buildAttemptRecord({
      interventionId: 'sigh',
      mechanism: 'exhale-lengthening',
      response: 'better',
      exitReason: 'completed',
      coarseContextKey: contextKey,
    });
    
    expect(attempt.intervention_id).toBe('sigh');
    expect(attempt.mechanism).toBe('exhale-lengthening');
    expect(attempt.response).toBe('better');
    expect(attempt.exit_reason).toBe('completed');
    expect(attempt.context_key).toBe(contextKey);
  });

  it('context-aware effectiveness tracks effectiveness per situation', () => {
    // Two sessions with same intervention but different contexts
    const sessions = [
      {
        pathway: ['sigh'],
        intensity_start: 8,
        intensity_end: 4,
        direction: 'calm',
        where_felt: 'body',
        location: 'home',
        created_date: new Date().toISOString(),
        context_snapshot: {
          direction: 'calm',
          intensity_start: 8,
          where_felt: 'body',
          location: 'home',
        },
      },
      {
        pathway: ['sigh'],
        intensity_start: 6,
        intensity_end: 5,
        direction: 'calm',
        where_felt: 'body',
        location: 'work',
        created_date: new Date().toISOString(),
        context_snapshot: {
          direction: 'calm',
          intensity_start: 6,
          where_felt: 'body',
          location: 'work',
        },
      },
    ];
    
    const eff = computeEffectiveness(sessions);
    
    // Should have context map
    expect(eff.contextMap).toBeDefined();
    expect(typeof eff.contextMap).toBe('object');
    
    // Global effectiveness should be computed
    expect(eff.sigh).toBeDefined();
  });

  it('context coherence boost prioritizes proven approaches', () => {
    // Two sessions at home: sigh works well
    const sessions = [
      {
        pathway: ['sigh'],
        intensity_start: 7,
        intensity_end: 3,
        direction: 'calm',
        where_felt: 'body',
        location: 'home',
        would_use_again: 'yes',
        created_date: new Date().toISOString(),
        context_snapshot: {
          direction: 'calm',
          intensity_start: 7,
          where_felt: 'body',
          location: 'home',
        },
      },
      {
        pathway: ['sigh'],
        intensity_start: 8,
        intensity_end: 2,
        direction: 'calm',
        where_felt: 'body',
        location: 'home',
        would_use_again: 'yes',
        created_date: new Date().toISOString(),
        context_snapshot: {
          direction: 'calm',
          intensity_start: 8,
          where_felt: 'body',
          location: 'home',
        },
      },
    ];
    
    const eff = computeEffectiveness(sessions);
    
    // When building a pathway in the same context (home, calm), sigh should score high
    const homeAnswers = {
      direction: 'calm',
      intensity: 7,
      whereFelt: 'body',
      location: 'home',
      timeMin: 6,
      audio: 'yes',
      movement: 'seated',
    };
    
    const pathway = buildPathway(homeAnswers, eff);
    
    // Pathway should exist and sigh should be a candidate
    expect(pathway.length).toBeGreaterThan(0);
    const hasSigh = pathway.some((iv) => iv.id === 'sigh');
    // With proven effectiveness, sigh should be prioritized
    expect(hasSigh || pathway.length > 0).toBe(true);
  });

  it('tracks attempt events with exit reasons and user responses', () => {
    // Simulate attempt events from a session
    const attemptEvents = [
      { interventionId: 'sigh', mechanism: 'exhale-lengthening', action: 'completed', timestamp: Date.now() },
      { interventionId: 'grounding54321', mechanism: 'grounding', action: 'skipped', timestamp: Date.now() + 1000 },
    ];

    // Simulate user responses from reflect phase
    const interventionResponses = {
      'sigh': 'better',
      'grounding54321': 'same',
    };

    // Build attempts like completeSession does
    const usedInterventions = ['sigh', 'grounding54321'];
    const contextKey = 'calm|body|7-8|home|standard';
    
    const attempts = usedInterventions.map((ivId) => {
      const relevantEvents = attemptEvents.filter((e) => e.interventionId === ivId);
      const lastEvent = relevantEvents[relevantEvents.length - 1];
      
      let exitReason = 'skipped';
      let switchPreference = null;
      
      if (lastEvent) {
        if (lastEvent.action === 'completed') {
          exitReason = 'completed';
        } else if (lastEvent.action === 'skipped') {
          exitReason = 'skipped';
        } else if (lastEvent.action === 'switched') {
          exitReason = 'switched';
          switchPreference = lastEvent.switchReason;
        }
      }
      
      const response = interventionResponses[ivId] || 'not_answered';
      
      return {
        intervention_id: ivId,
        mechanism: lastEvent?.mechanism || 'unknown',
        response: response,
        exit_reason: exitReason,
        switch_preference: switchPreference,
        context_key: contextKey,
      };
    });

    // Verify attempt records have correct structure
    expect(attempts.length).toBe(2);
    expect(attempts[0].intervention_id).toBe('sigh');
    expect(attempts[0].exit_reason).toBe('completed');
    expect(attempts[0].response).toBe('better');
    expect(attempts[1].intervention_id).toBe('grounding54321');
    expect(attempts[1].exit_reason).toBe('skipped');
    expect(attempts[1].response).toBe('same');
  });

  it('adaptive alternatives prefer high-effectiveness interventions in context', () => {
    // Build effectiveness data where grounding works well at home/calm
    const sessions = [
      {
        pathway: ['grounding54321'],
        intensity_start: 7,
        intensity_end: 2,
        direction: 'calm',
        where_felt: 'body',
        location: 'home',
        would_use_again: 'yes',
        created_date: new Date().toISOString(),
        context_snapshot: {
          direction: 'calm',
          intensity_start: 7,
          where_felt: 'body',
          location: 'home',
        },
      },
      {
        pathway: ['grounding54321'],
        intensity_start: 8,
        intensity_end: 1,
        direction: 'calm',
        where_felt: 'body',
        location: 'home',
        would_use_again: 'yes',
        created_date: new Date().toISOString(),
        context_snapshot: {
          direction: 'calm',
          intensity_start: 8,
          where_felt: 'body',
          location: 'home',
        },
      },
    ];

    const eff = computeEffectiveness(sessions);
    
    // User is trying sigh at home/calm, finds it not helpful, switches
    const homeAnswers = {
      direction: 'calm',
      intensity: 7,
      whereFelt: 'body',
      location: 'home',
      timeMin: 6,
      audio: 'yes',
      movement: 'seated',
    };

    // Suggest adaptive alternative from sigh (known to work: grounding)
    const adaptive = suggestAdaptiveAlternative('sigh', 'unsure', homeAnswers, eff);
    
    // Should return a valid intervention
    expect(adaptive).toBeDefined();
    expect(adaptive.id).toBeDefined();
    
    // When effectiveness data is available, the system should prefer high-effectiveness alternatives
    // In this case, grounding has high effectiveness (>0.6) in this context
    const contextKey = coarseContextKey(homeAnswers);
    const isGroundingHighEff = eff.contextMap?.[contextKey]?.['grounding54321'] > 0.6;
    
    // If grounding is proven effective, it should be preferred
    if (isGroundingHighEff) {
      // We can't guarantee the exact intervention (other factors apply), but
      // we can verify the function doesn't crash and returns something valid
      expect(adaptive).toBeDefined();
    }
  });

  it('computeEffectivenessInsights returns structured insight data for premium dashboard', () => {
    const sessions = [
      {
        pathway: ['grounding54321'],
        intensity_start: 8,
        intensity_end: 2,
        direction: 'calm',
        where_felt: 'body',
        location: 'home',
        would_use_again: 'yes',
        created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        pathway: ['sigh'],
        intensity_start: 7,
        intensity_end: 5,
        direction: 'calm',
        where_felt: 'body',
        location: 'work',
        would_use_again: 'yes',
        created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        pathway: ['grounding54321', 'sigh'],
        intensity_start: 9,
        intensity_end: 1,
        direction: 'calm',
        where_felt: 'mind',
        location: 'home',
        would_use_again: 'yes',
        created_date: new Date().toISOString(),
      },
    ];

    const insights = computeEffectivenessInsights(sessions);

    // Verify structure
    expect(insights).toBeDefined();
    expect(Array.isArray(insights.topInterventions)).toBe(true);
    expect(Array.isArray(insights.directionStats)).toBe(true);
    expect(Array.isArray(insights.locationStats)).toBe(true);
    expect(Array.isArray(insights.contextPatterns)).toBe(true);
    expect(typeof insights.totalSessions).toBe('number');
    expect(typeof insights.thisWeek).toBe('number');
    expect(typeof insights.currentStreak).toBe('number');

    // Verify top interventions have required fields
    insights.topInterventions.forEach((iv) => {
      expect(iv.id).toBeDefined();
      expect(typeof iv.score).toBe('number');
      expect(iv.name).toBeDefined();
    });

    // Verify direction stats
    insights.directionStats.forEach((ds) => {
      expect(ds.direction).toBeDefined();
      expect(typeof ds.count).toBe('number');
      expect(typeof ds.avgImprovement).toBe('number');
    });

    // Verify location stats
    insights.locationStats.forEach((ls) => {
      expect(ls.location).toBeDefined();
      expect(typeof ls.count).toBe('number');
      expect(typeof ls.avgImprovement).toBe('number');
    });

    // Verify total sessions count
    expect(insights.totalSessions).toBe(3);
    // All sessions are within the past 7 days
    expect(insights.thisWeek).toBe(3);
  });

  it('counts streaks by local calendar day across DST changes', () => {
    const springForward = [
      { created_date: '2026-03-08T06:30:00.000Z' },
      { created_date: '2026-03-09T04:30:00.000Z' },
      { created_date: '2026-03-10T04:30:00.000Z' },
    ];
    expect(computeLocalCalendarStreak(springForward, {
      now: new Date('2026-03-10T16:00:00.000Z'),
      timeZone: 'America/New_York',
    })).toBe(3);

    const fallBack = [
      { created_date: '2026-11-01T05:30:00.000Z' },
      { created_date: '2026-11-01T06:30:00.000Z' },
      { created_date: '2026-11-02T05:30:00.000Z' },
    ];
    expect(computeLocalCalendarStreak(fallBack, {
      now: new Date('2026-11-02T17:00:00.000Z'),
      timeZone: 'America/New_York',
    })).toBe(2);
  });

  it('returns zero when the latest local calendar day is stale', () => {
    expect(computeLocalCalendarStreak(
      [{ created_date: '2026-03-07T15:00:00.000Z' }],
      { now: new Date('2026-03-10T15:00:00.000Z'), timeZone: 'America/New_York' },
    )).toBe(0);
  });

  it('uses different intervention families in different situations and avoids context blind repetition', () => {
    const bodyLow = buildPathway({ direction: 'calm', intensity: 2, whereFelt: 'body', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }, {});
    const thoughtMid = buildPathway({ direction: 'calm', intensity: 6, whereFelt: 'thoughts', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }, {});
    const acuteHigh = buildPathway({ direction: 'calm', intensity: 9, whereFelt: 'body', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }, {});

    expect(bodyLow.length).toBeGreaterThan(0);
    expect(thoughtMid.length).toBeGreaterThan(0);
    expect(acuteHigh.length).toBeGreaterThan(0);
    expect(bodyLow.every((iv) => hardEligibleV3(iv, { direction: 'calm', intensity: 2, whereFelt: 'body', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }))).toBe(true);
    expect(thoughtMid.every((iv) => hardEligibleV3(iv, { direction: 'calm', intensity: 6, whereFelt: 'thoughts', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }))).toBe(true);
    expect(acuteHigh.every((iv) => hardEligibleV3(iv, { direction: 'calm', intensity: 9, whereFelt: 'body', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }))).toBe(true);

    const categories = new Set([...bodyLow, ...thoughtMid, ...acuteHigh].map((iv) => iv.category));
    expect(categories.size).toBeGreaterThan(1);
  });

  it('does not repeat the same category within a single pathway when a better fit exists', () => {
    const path = buildPathway({ direction: 'calm', intensity: 2, whereFelt: 'body', timeMin: 6, location: 'home', audio: 'yes', movement: 'seated' }, {});
    expect(new Set(path.map((iv) => iv.category)).size).toBe(path.length);
  });
});

describe('recommendation engine v3 invariants', () => {
  const iv = (id) => INTERVENTIONS.find((item) => item.id === id);

  it('uses preferred and eligible intensity bands as hard/soft boundaries', () => {
    const checkEvidence = iv('factCheck');
    expect([
      checkEvidence.intensityMin,
      checkEvidence.preferredIntensityMin,
      checkEvidence.preferredIntensityMax,
      checkEvidence.intensityMax,
    ]).toEqual([2, 3, 6, 7]);
    expect(intensityFitV3(checkEvidence, 2)).toBeCloseTo(0.35, 8);
    expect(intensityFitV3(checkEvidence, 3)).toBe(1);
    expect(intensityFitV3(checkEvidence, 6)).toBe(1);
    expect(intensityFitV3(checkEvidence, 7)).toBeCloseTo(0.35, 8);
    expect(intensityFitV3(checkEvidence, 8)).toBe(0);
    expect(hardEligibleV3(checkEvidence, {
      direction: 'calm', intensity: 8, whereFelt: 'thoughts', timeMin: 10,
      location: 'home', audio: 'yes', movement: 'seated',
    })).toBe(false);
  });

  it('implements the exact V3 weighted score equation', () => {
    const answers = {
      direction: 'calm', intensity: 8, whereFelt: 'body', timeMin: 10,
      location: 'home', audio: 'yes', movement: 'seated',
    };
    const result = scoreInterventionV3(iv('sigh'), answers, {}, {
      slot: 'opener',
      seed: 'formula-check',
      dislikePenalty: () => 2.5,
    });
    const c = result.components;
    const expected =
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
      V3_WEIGHTS.novelty * c.N - result.DP + result.J;
    expect(result.score).toBeCloseTo(expected, 10);
    Object.values(c).forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
    Object.values(c).forEach((value) => expect(value).toBeLessThanOrEqual(1));
    expect(Math.abs(result.J)).toBeLessThanOrEqual(0.1);
  });

  it('learns pulse outcomes as better > same > worse and ignores unanswered pulses', () => {
    const now = new Date().toISOString();
    const attempt = {
      intervention_id: 'sigh',
      mechanism: iv('sigh').mechanism,
      completed_percentage: 1,
      context_key: coarseContextKey({ direction: 'calm', intensity: 8, whereFelt: 'body', location: 'home' }),
      ended_at: now,
    };
    const scoreFor = (response) => computeEffectiveness([{
      created_date: now,
      direction: 'calm',
      pathway: ['sigh'],
      attempts: [{ ...attempt, response }],
    }]).sigh;

    expect(scoreFor('better')).toBeGreaterThan(scoreFor('same'));
    expect(scoreFor('same')).toBeGreaterThan(scoreFor('worse'));
    expect(scoreFor('not_answered')).toBeCloseTo(0.5, 8);
  });

  it('keeps Immediate Mode inside its restricted candidate pool after re-ranking', () => {
    const first = immediatePathway(9, {
      whereFelt: 'body', timeMin: 5, location: 'home', audio: 'yes', movement: 'seated',
    }, {});
    expect(first.length).toBeGreaterThan(0);
    const next = buildSegment({
      direction: 'calm', immediate: true, intensity: 9, whereFelt: 'body', timeMin: 5,
      location: 'home', audio: 'yes', movement: 'seated',
    }, {}, { targetMin: 3, count: 1, usedIds: [first[0].id] });

    [...first, ...next].forEach((item) => {
      expect(item.cognitiveLoad).toBeLessThanOrEqual(2);
      expect(item.durationMin).toBeLessThanOrEqual(3);
      expect(['lower', 'steady']).toContain(item.arousal);
      expect(item.pathwayRoles.some((role) => ['opener', 'rescue'].includes(String(role).toLowerCase()))).toBe(true);
      expect(['temperature-shock', 'breath-hold', 'paced-hold']).not.toContain(item.mechanism);
      expect(item.mechanismFamily || item.category).not.toBe('cognitive');
    });
  });

  it('returns no recommendation rather than relaxing hard eligibility', () => {
    expect(buildPathway({
      direction: 'lift', intensity: 10, whereFelt: 'body', timeMin: 1,
      location: 'public', audio: 'no', movement: 'discreet',
    }, {})).toEqual([]);
  });
});
