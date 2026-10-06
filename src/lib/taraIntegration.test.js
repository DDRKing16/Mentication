import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERVENTIONS, pathwayByIds } from './interventions';
import { hardEligibleV3 } from './recommendationV3';
import { coarseCompletionOutcome } from './resetCompletion';
import { deleteFlagshipMemory } from './flagshipMemory';
import { exportLocalAppData } from './localData';
import { newTaraState, confirmReflection } from './taraTacticianState';
import { TARA_STORAGE_KEY, deleteTaraRecap, loadTara, saveTaraDraft, saveTaraRecap } from './taraTacticianStorage';
class Memory {
 values = new Map(); getItem(key) { return this.values.get(key) ?? null; }
 setItem(key, value) { this.values.set(key, String(value)); } removeItem(key) { this.values.delete(key); }
 get length() { return this.values.size; } key(i) { return [...this.values.keys()][i]; }
}
beforeEach(() => { const storage = new Memory(); vi.stubGlobal('localStorage', storage); vi.stubGlobal('sessionStorage', new Memory()); vi.stubGlobal('window', { localStorage: storage }); });
afterEach(() => vi.unstubAllGlobals());
const recap = (id) => confirmReflection({ ...newTaraState(), id, experienceVersion: 1, phase: 'reflect', eventStatus: 'unknown', actualActionConfirmed: true, comparison: 'unsure', learning: 'Private learning', nextStep: 'Private next action' });
describe('Tara host integration', () => {
 it('resolves the actual custom practice with Unrated evidence and time/goal constraints', () => {
  const [iv] = pathwayByIds(['taraTactician']); expect(iv).toBeTruthy(); expect(INTERVENTIONS).toHaveLength(18);
  expect(iv.evidenceGrade).toBe('Unrated'); expect(iv.mechanismFamily).toBe('preparation-rehearsal-reflection');
  const answers = { direction: 'focus', timeMin: 5, intensity: 4, whereFelt: 'thoughts', location: 'home', audio: 'no' };
  expect(hardEligibleV3(iv, answers)).toBe(true); expect(hardEligibleV3(iv, { ...answers, timeMin: 1 })).toBe(false);
  expect(hardEligibleV3(iv, { ...answers, direction: 'sleep' })).toBe(false);
 });
 it.each(['less', 'same', 'more', 'different', 'not-tested', 'unsure'])('retains confirmed %s without private content or success inference', predictionComparison => {
  const clean = coarseCompletionOutcome({ interventionId: 'taraTactician', completion: 'completed', saved: false, eventStatus: 'not-attempted', predictionComparison, rehearsed: false, prediction: 'Private prediction', learning: 'Private learning' }, 'taraTactician');
  expect(clean).toEqual({ interventionId: 'taraTactician', completion: 'completed', saved: false, eventStatus: 'not-attempted', predictionComparison, rehearsed: false });
  expect(coarseCompletionOutcome({ eventStatus: 'successful', predictionComparison: 'improved', rehearsed: 'yes' }, 'taraTactician')).toEqual({});
 });
 it.each(['happened', 'partly', 'did-not', 'not-tested', 'unsure'])('preserves factual result %s independently of historical difficulty', predictionResult => {
  const clean = coarseCompletionOutcome({ predictionResult, predictionComparison: 'more', actual: 'Private observation' }, 'taraTactician');
  expect(clean).toEqual({ predictionResult, predictionComparison: 'more' });
  expect(coarseCompletionOutcome({ predictionResult: 'improved' }, 'taraTactician')).toEqual({});
 });
 it('exports validated authored records and deletes only the selected saved recap', () => {
  saveTaraRecap(recap('first')); saveTaraRecap(recap('second'));
  const draft = { ...newTaraState(), phase: 'prepare', situation: 'Private draft' }; saveTaraDraft(draft);
  expect(exportLocalAppData().tara.recaps).toHaveLength(2);
  const next = deleteTaraRecap('first'); expect(next.recaps.map(item => item.id)).toEqual(['second']); expect(next.draft.id).toBe(draft.id);
  expect(loadTara().recaps).toHaveLength(1);
  deleteFlagshipMemory('saved'); expect(localStorage.getItem(TARA_STORAGE_KEY)).toBeNull();
 });
 it('surfaces failed recap deletion, preserves corruption, and never claims a successful export of unreadable data', () => {
  saveTaraRecap(recap('first')); vi.spyOn(localStorage, 'setItem').mockImplementation(() => { throw Error('quota'); });
  expect(() => deleteTaraRecap('first')).toThrow(); expect(loadTara().recaps).toHaveLength(1); vi.restoreAllMocks();
  localStorage.setItem(TARA_STORAGE_KEY, '{corrupt'); expect(() => exportLocalAppData()).toThrow(); expect(() => deleteTaraRecap('first')).toThrow(); expect(localStorage.getItem(TARA_STORAGE_KEY)).toBe('{corrupt');
 });
});
