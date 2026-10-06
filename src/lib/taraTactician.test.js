import { describe, expect, it } from 'vitest';
import { COMPARISONS, beginTackle, chooseChallenge, chooseEvent, confirmReflection, newTaraState, preparePlan, returnToEvent, taraCompletion, validateTaraState } from './taraTacticianState';
import { TARA_STORAGE_KEY, clearTara, loadTara, saveTaraDraft, saveTaraRecap } from './taraTacticianStorage';

function memory() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; }
const prepared = () => preparePlan(chooseChallenge(chooseEvent({ ...newTaraState(), phase: 'prepare' }, 'conversation'), 'Finding the words'));
const reflected = (comparison = 'same', eventStatus = 'finished') => confirmReflection({ ...beginTackle(prepared()), phase: 'reflect', comparison, eventStatus, actualActionConfirmed: true });

describe('Tara honest state and progress', () => {
  it('starts with no invented observation or rating', () => {
    expect(newTaraState()).toMatchObject({ actual: '', comparison: '', likelihood: '', eventStatus: 'not-started', rehearsed: false, actualActionConfirmed: false });
  });
  it('reveals only valid challenges and protects user-authored prediction and plan', () => {
    const state = prepared();
    expect(chooseChallenge(state, 'invalid')).toBe(state);
    const edited = { ...state, prediction: 'My own words', predictionEdited: true, plan: { ...state.plan, do: 'My first sentence' } };
    const changed = chooseChallenge(chooseEvent(edited, 'task'), 'Getting started');
    expect(changed.prediction).toBe('My own words');
    expect(preparePlan(changed).plan.do).toBe('My first sentence');
    expect(chooseEvent(state, 'task').prediction).toBe('');
  });
  it('allows tackle without rehearsal and preserves actual event status on support return', () => {
    const tackled = beginTackle(prepared());
    expect(tackled).toMatchObject({ phase: 'tackle', rehearsed: false, eventStatus: 'in-progress' });
    expect(returnToEvent({ ...tackled, phase: 'support', eventStatus: 'stepped-out' })).toMatchObject({ phase: 'tackle', eventStatus: 'stepped-out' });
  });
  it('requires explicit action and comparison confirmation before a recap', () => {
    const state = { ...prepared(), phase: 'reflect', comparison: 'same' };
    expect(confirmReflection(state)).toBe(state);
    expect(confirmReflection({ ...state, actualActionConfirmed: true, eventStatus: 'unknown' }).phase).toBe('recap');
    expect(confirmReflection({ ...state, actualActionConfirmed: true, eventStatus: 'in-progress' }).phase).toBe('reflect');
    expect(confirmReflection({ ...state, actualActionConfirmed: true, comparison: '' }).phase).toBe('reflect');
  });
  it.each(COMPARISONS.map(([value]) => value))('preserves honest comparison %s', comparison => {
    expect(reflected(comparison).comparison).toBe(comparison);
    expect(reflected(comparison).actual).toBe('');
  });
  it('keeps intentional stepping out and not attempting distinct from participation', () => {
    for (const status of ['stepped-out', 'not-attempted', 'unknown']) expect(reflected('not-tested', status).eventStatus).toBe(status);
  });
  it('never copies private wording into the coarse completion contract', () => {
    const outcome = taraCompletion({ ...reflected(), situation: 'Private event', prediction: 'Private prediction', actual: 'Private observation', learning: 'Private learning', rehearsal: 'Private rehearsal' });
    expect(Object.keys(outcome)).toEqual(['interventionId', 'completion', 'saved', 'eventStatus', 'predictionComparison', 'rehearsed']);
    expect(JSON.stringify(outcome)).not.toContain('Private');
  });
  it('rejects future schemas, invalid phases and fabricated recaps', () => {
    expect(validateTaraState({ ...prepared(), schemaVersion: 2 })).toBeNull();
    expect(validateTaraState({ ...prepared(), phase: 'made-up' })).toBeNull();
    expect(validateTaraState({ ...prepared(), phase: 'recap' })).toBeNull();
  });
});
describe('Tara device persistence', () => {
  it('resumes exact draft and phase with private text kept local', () => {
    const store = memory(); const draft = { ...beginTackle(prepared()), phase: 'support', support: 'racing', rehearsal: 'My words' };
    saveTaraDraft(draft, store);
    expect(loadTara(store).draft).toEqual(draft);
  });
  it('saves recap only by explicit request, updates it without duplicates and clears all Tara data', () => {
    const store = memory(); const recap = reflected('more');
    saveTaraDraft(recap, store); expect(loadTara(store).recaps).toEqual([]);
    saveTaraRecap(recap, store); saveTaraRecap({ ...recap, learning: 'Adjust the pace' }, store);
    expect(loadTara(store).recaps).toHaveLength(1);
    expect(loadTara(store).recaps[0]).toMatchObject({ saved: true, comparison: 'more', learning: 'Adjust the pace' });
    clearTara(store); expect(loadTara(store)).toEqual({ draft: null, recaps: [] });
  });
  it('does not overwrite malformed or future-version saved data', () => {
    const store = memory();
    for (const raw of ['broken', JSON.stringify({ schemaVersion: 2, draft: null, recaps: [] })]) {
      store.setItem(TARA_STORAGE_KEY, raw);
      expect(() => saveTaraDraft(prepared(), store)).toThrow();
      expect(store.getItem(TARA_STORAGE_KEY)).toBe(raw);
    }
  });
  it('reports quota failure, silent write failure, read failure and silent deletion failure', () => {
    expect(() => saveTaraDraft(prepared(), { ...memory(), setItem() { throw new Error('Quota'); } })).toThrow(/could not be saved/);
    expect(() => saveTaraDraft(prepared(), { ...memory(), setItem() {} })).toThrow(/could not be saved/);
    expect(() => loadTara({ getItem() { throw new Error('Security'); } })).toThrow();
    const store = memory(); saveTaraDraft(prepared(), store);
    expect(() => clearTara({ ...store, removeItem() {} })).toThrow(/could not be deleted/);
    expect(loadTara(store).draft).not.toBeNull();
  });
});
