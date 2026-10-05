import { captureGoalBaseline } from "./goalAssessment";
import { describe, expect, it } from 'vitest';
import { LIFT_JOURNEYS, liftJourneyOptions, moodResponse } from './liftFollowup';
import { buildPathway, buildSegment, INTERVENTIONS } from './interventions';

const input = (overrides = {}) => ({ completedHappyBump: true, mood: 5, distress: 5, confirmed: true, hasMoreTime: true, answers: { direction: 'lift', location: 'home' }, ...overrides });
describe('owner-approved post-Happy-Bump journey gate', () => {
  it.each([4, 5, 6])('uses fresh positive mood %s without inverting it', (mood) => {
    expect(liftJourneyOptions(input({ mood })).length).toBe(mood >= 5 ? 3 : 0);
  });
  it.each([4, 5, 6])('independently respects distress %s', (distress) => {
    expect(liftJourneyOptions(input({ distress })).length).toBe(distress <= 5 ? 3 : 0);
  });
  it.each([null, undefined, NaN, Infinity, -1, 11, '5'])('does not infer an answer from %s', (value) => {
    expect(liftJourneyOptions(input({ mood: value }))).toEqual([]);
    expect(liftJourneyOptions(input({ distress: value }))).toEqual([]);
  });
  it('requires actual completion, explicit check-in and time consent', () => {
    expect(liftJourneyOptions(input({ completedHappyBump: false }))).toEqual([]);
    expect(liftJourneyOptions(input({ confirmed: false }))).toEqual([]);
    expect(liftJourneyOptions(input({ hasMoreTime: false }))).toEqual([]);
    expect(liftJourneyOptions({ answers: { direction: 'lift', intensity: 7 }, outcome: { start: 3, end: 5 } })).toEqual([]);
    expect(liftJourneyOptions(input({ mood: null, answers: { direction: 'lift', intensity: 10, location: 'home' } }))).toEqual([]);
  });
  it('never treats high positive mood as a substitute for low distress', () => {
    expect(liftJourneyOptions(input({ mood: 10, distress: 8 }))).toEqual([]);
    expect(liftJourneyOptions(input({ mood: 8, distress: 2 }))).toEqual(LIFT_JOURNEYS);
  });
  it.each([
    { direction: 'calm' }, { immediate: true }, { acute: true }, { location: 'work' }, { location: 'public' },
    { contraindicationTags: ['acute-distress'] }, { unsuitableSubstates: ['immediate-danger'] }, { subtype: 'acute' }, { disconnected: true },
  ])('preserves contextual and safety exclusions %j', (change) => {
    expect(liftJourneyOptions(input({ answers: { direction: 'lift', location: 'home', ...change } }))).toEqual([]);
  });
  it('keeps longer programmes separate from the short-reset pool and its time budget', () => {
    expect(LIFT_JOURNEYS.map((item) => item.route)).toEqual(['/dear-2100', '/good-map', '/foundations']);
    expect(INTERVENTIONS.some((iv) => ['dear2100', 'foundations'].includes(iv.id))).toBe(false);
    const a = { direction: 'lift', intensity: 5, distress: 5, timeMin: 30, location: 'home', movement: 'yes' };
    expect(buildPathway(a)[0].id).toBe('happyBump');
    expect(buildPathway(a).filter((iv) => iv.id === 'happyBump')).toHaveLength(1);
    expect(buildPathway(a).some((iv) => iv.id === 'goodMap')).toBe(false);
    expect(buildSegment(a, {}, { usedIds: ['happyBump'], targetMin: 30 }).some((iv) => iv.id === 'happyBump')).toBe(false);
  });
  it('never learns an unanswered mood or confuses lower mood with improvement', () => {
    expect(moodResponse(3, 6)).toBe('better');
    expect(moodResponse(6, 3)).toBe('worse');
    expect(moodResponse(5, 5)).toBe('same');
    expect(moodResponse(null, 5)).toBe('not_answered');
  });
});

describe('separate Lift mood and eligibility distress', () => {
  it('does not interpret positive mood as the suitability ceiling', () => {
    const context = { direction: 'lift', timeMin: 5, movement: 'yes', location: 'home' };
    for (const mood of [0, 4, 5, 6, 10]) {
      expect(buildPathway({ ...context, intensity: mood, distress: 5 })[0]?.id).toBe('happyBump');
      expect(buildPathway({ ...context, intensity: mood, distress: 8 }).some((iv) => iv.id === 'happyBump')).toBe(false);
    }
    expect(buildPathway({ ...context, intensity: 8, distress: 3, acute: true }).some((iv) => iv.id === 'happyBump')).toBe(false);
    expect(buildPathway({ ...context, intensity: 5 })).toEqual([]);
    expect(buildPathway({ ...context, intensity: 5, distress: null })).toEqual([]);
    expect(buildPathway({ ...context, intensity: 5, distress: '5' })).toEqual([]);
  });
  it('keeps flexible Happy Bump time honest and does not pre-chain another exercise', () => {
    const iv = INTERVENTIONS.find((item) => item.id === 'happyBump');
    expect([iv.durationMin, iv.durationMax]).toEqual([5, 15]);
    for (const timeMin of [5, 10, 15, 30]) {
      expect(buildPathway({ direction: 'lift', intensity: 6, distress: 3, timeMin, location: 'home' }).map((item) => item.id)).toEqual(['happyBump']);
    }
    expect(buildPathway({ direction: 'lift', intensity: 6, distress: 3, timeMin: 3 }).some((item) => item.id === 'happyBump')).toBe(false);
  });
});

describe('completion evidence', () => {
  it('keeps session identity and one attempt when confirming more than once', async () => {
    const { withLiftCheckin } = await import('./liftFollowup');
    const completed = { id: 'completed-bump', created_date: '2026-10-05T00:00:00Z', direction: 'lift', intensity_start: 8, goal_baseline:captureGoalBaseline('lift',8), intensity_end: null, completed_pathway: ['happyBump'], attempts: [{ intervention_id: 'happyBump', exit_reason: 'completed', response: 'not_answered' }] };
    expect(withLiftCheckin(completed, null, 5)).toBeNull();
    const once = withLiftCheckin(completed, 5, 5, '2026-10-05T00:01:00Z');
    const twice = withLiftCheckin(once, 5, 5, '2026-10-05T00:01:00Z');
    expect(twice).toEqual(once);
    expect(twice.id).toBe(completed.id);
    expect(twice.created_date).toBe(completed.created_date);
    expect(twice.attempts).toHaveLength(1);
    expect(twice.attempts[0].response).toBe('worse');
    expect(withLiftCheckin({ ...completed, completed_pathway: [] }, 5, 5)).toBeNull();
  });
});
