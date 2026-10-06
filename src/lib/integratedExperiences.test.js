import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERVENTIONS, buildPathway, computeEffectiveness, pathwayByIds } from './interventions';
import { hardEligibleV3, personalFitV3, scoreInterventionV3 } from './recommendationV3';
import { isInteractiveFlagship } from './flagshipExperienceRouting';
import { coarseCompletionOutcome } from './resetCompletion';
import { CARE_PRACTICES } from './carePractices';
import { CARE_SAVED_KEY, readCareCards, writeCareSaved, deleteCareSaved } from './carePracticeStorage';
import { readTappingDraft, writeTappingDraft, TAPPING_DRAFT_KEY } from '../components/tapping/tappingDraft';
import { deleteFlagshipMemory } from './flagshipMemory';
import { exportLocalAppData } from './localData';
class Storage {
  values = new Map(); get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index]; }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
beforeEach(() => { const storage = new Storage(); vi.stubGlobal('localStorage', storage); vi.stubGlobal('sessionStorage', new Storage()); vi.stubGlobal('window', { localStorage: storage }); });
const ids = ['eftTapping', 'selfCompassion', 'unhook', 'makeRoom'];
const answers = { direction: 'calm', intensity: 4, distress: 4, whereFelt: 'both', timeMin: 5, location: 'home', movement: 'seated', audio: 'no' };
describe('19 reachable experiences including 17 catalogue practices', () => {
  it('registers all four exact builds with honest mechanisms and no generic fallback', () => {
    expect(INTERVENTIONS).toHaveLength(17);
    for (const iv of pathwayByIds(ids)) {
      expect(isInteractiveFlagship(iv.id)).toBe(true);
      expect(iv.evidenceGrade).toBe('Unrated');
      expect(iv.mechanismFamily).toBeTruthy();
      expect(hardEligibleV3(iv, { ...answers, direction: iv.primaryDirection })).toBe(true);
      expect(hardEligibleV3(iv, { ...answers, direction: iv.primaryDirection, timeMin: 1 })).toBe(false);
      const score = scoreInterventionV3(iv, { ...answers, direction: iv.primaryDirection });
      expect(score).toBeTruthy();
    }
    expect(pathwayByIds(ids)).toHaveLength(4);
    expect(INTERVENTIONS.find(iv => iv.id === 'signalLock').mechanism).toBe('external-visual-anchoring');
  });
  it.each(ids)('uses actual helpfulness history for %s and keeps goal/time constraints', id => {
    const iv = INTERVENTIONS.find(item => item.id === id);
    const a = { ...answers, direction: iv.primaryDirection, timeMin: 3 };
    const effects = computeEffectiveness([{ direction: a.direction, context_snapshot: a, attempts: [{ intervention_id: id, response: 'better', completed_percentage: 1, exit_reason: 'completed', ended_at: new Date().toISOString() }] }]);
    expect(effects[id]).toBeGreaterThan(0.5);
    expect(personalFitV3(iv, a, effects)).toBeGreaterThan(personalFitV3(iv, a, {}));
    expect(buildPathway(a, effects).every(item => item.directions.includes(a.direction) && item.durationMin <= a.timeMin)).toBe(true);
  });
  it('does not leak personal text, invent a result, or compare different questions', () => {
    const config = CARE_PRACTICES.unhook;
    const result = coarseCompletionOutcome({ practice: 'unhook', assessment: { question: config.question, left: config.left, right: config.right, min: 0, max: 10, before: 0, after: null }, notice: 'private', perspective: 'private', action: 'private', actionStatus: 'planned', practiceTaken: false }, 'unhook');
    expect(result.assessment.before).toBe(0); expect(result.assessment.after).toBeNull(); expect(result.change).toBeNull();
    expect(JSON.stringify(result)).not.toContain('private');
    expect(coarseCompletionOutcome({ assessment: { question: 'a different question', min: 0, max: 10, before: 5, after: 0 } }, 'unhook').assessment).toBeUndefined();
    const stopped = coarseCompletionOutcome({ completed: false, stopped: true, roundsCompleted: 0, before: null, after: 0, ratingQuestion: 'How intense is the discomfort right now?', ratingMin: 0, ratingMax: 10 }, 'eftTapping');
    expect(stopped.completed).toBe(false); expect(stopped.before).toBeNull(); expect(stopped.after).toBe(0);
  });
  it('protects corrupt saved cards from replacement and deletion', () => {
    localStorage.setItem(CARE_SAVED_KEY, '[]');
    expect(() => readCareCards()).toThrow();
    expect(writeCareSaved('unhook', { version: 1 })).toBe(false);
    expect(deleteCareSaved('unhook')).toBe(false);
    expect(localStorage.getItem(CARE_SAVED_KEY)).toBe('[]');
  });
  it('recovers only valid tapping progress and surfaces storage failures', () => {
    const draft = { stage: 'round', concern: 'worry', before: 0, after: null, index: 2, second: 3, duration: 35, rounds: 0, skipped: 0 };
    writeTappingDraft(draft); expect(readTappingDraft().before).toBe(0);
    localStorage.setItem(TAPPING_DRAFT_KEY, '{bad'); expect(() => readTappingDraft()).toThrow();
    localStorage.setItem = () => { throw new Error('blocked'); }; expect(() => writeTappingDraft(draft)).toThrow('blocked');
  });
  it('exports and deletes actual care/tapping/Foundations records together', () => {
    const keys = [CARE_SAVED_KEY, TAPPING_DRAFT_KEY, 'mentication.foundations.draft.v2', 'mentication.foundations.weekly-plan.v2', 'mentication.foundations.weekly-plan.v1'];
    keys.forEach(key => localStorage.setItem(key, '{}'));
    expect(exportLocalAppData().careCards).toEqual({});
    expect(exportLocalAppData().foundations['mentication.foundations.draft.v2']).toBe('{}');
    deleteFlagshipMemory('saved'); keys.forEach(key => expect(localStorage.getItem(key)).toBeNull());
  });
});
