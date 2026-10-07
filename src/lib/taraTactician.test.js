import { describe, expect, it } from 'vitest';
import { COMPARISONS, PREDICTION_RESULTS, beginTackle, chooseChallenge, chooseEvent, confirmReflection, newTaraState, preparePlan, returnToEvent, taraCompletion, validateTaraState } from './taraTacticianState';
import { chooseRehearsalResponse, chooseTaraMove } from './taraTactics';
import { TARA_STORAGE_KEY, clearTara, loadTara, saveTaraDraft, saveTaraRecap } from './taraTacticianStorage';

function memory() { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; }
const prepared = () => preparePlan(chooseChallenge(chooseEvent({ ...newTaraState(), phase: 'prepare' }, 'conversation'), 'Finding the words'));
const reflected = (comparison = 'same', eventStatus = 'finished') => confirmReflection({ ...beginTackle(prepared()), phase: 'reflect', experienceVersion: 1, comparison, eventStatus, actualActionConfirmed: true });

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
    const state = { ...prepared(), phase: 'reflect', experienceVersion: 1, comparison: 'same' };
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
    expect(Object.keys(outcome)).toEqual(['interventionId', 'completion', 'saved', 'eventStatus', 'predictionComparison', 'predictionResult', 'rehearsed']);
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
    expect(loadTara(store).draft).toEqual({ ...draft, flowScreen: 'support' });
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


describe('Tara practice-first semantics and compatibility', () => {
  it.each(PREDICTION_RESULTS.map(([value]) => value))('requires an explicit prediction result %s and actual action', predictionResult => {
    const state = { ...prepared(), phase: 'reflect', comparison: 'more', predictionResult, eventStatus: 'unknown' };
    expect(confirmReflection(state)).toBe(state);
    const recap = confirmReflection({ ...state, actualActionConfirmed: true });
    expect(recap.phase).toBe('recap');
    expect(recap.predictionResult).toBe(predictionResult);
    expect(recap.comparison).toBe('more');
    expect(recap.actual).toBe('');
    expect(taraCompletion(recap)).toMatchObject({ predictionResult, predictionComparison: 'more', eventStatus: 'unknown' });
  });
  it('does not substitute a difficulty comparison for a new prediction result', () => {
    const state = { ...prepared(), phase: 'reflect', comparison: 'less', eventStatus: 'finished', actualActionConfirmed: true };
    expect(confirmReflection(state)).toBe(state);
    expect(validateTaraState({ ...state, phase: 'recap' })).toBeNull();
  });
  it('choosing a response does not claim it was practised or produce an observation', () => {
    const state = { ...prepared(), phase: 'rehearse', rehearsal: 'My own practice sentence' };
    const response = chooseRehearsalResponse(state, 'my-move');
    expect(response).toMatchObject({ rehearsalResponse: 'My own practice sentence', rehearsed: false, actual: '', predictionResult: '' });
    expect(chooseRehearsalResponse(state, 'invalid')).toBe(state);
    expect(chooseRehearsalResponse(state, 'pause').rehearsalResponse).toBe('“Give me a moment to find the words.”');
  });
  it('changes only the chosen move and rehearsal choice, preserving private authored backup fields', () => {
    const state = { ...prepared(), rehearsalChoice: 'my-move', rehearsalResponse: 'Previous response', prediction: 'My prediction' };
    const changed = chooseTaraMove(state, 'pause');
    expect(changed.plan).toMatchObject({ ...state.plan, do: '“Give me a moment to find the words.”' });
    expect(changed).toMatchObject({ prediction: 'My prediction', rehearsalChoice: '', rehearsalResponse: '', rehearsed: false, experienceVersion: 2 });
    expect(chooseTaraMove(state, 'not-a-move')).toBe(state);
  });
  it.each(COMPARISONS.map(([value]) => value))('loads unversioned saved records without reinterpreting %s', comparison => {
    const legacy = reflected(comparison);
    delete legacy.experienceVersion; delete legacy.predictionResult;
    const store = memory();
    store.setItem(TARA_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, draft: legacy, recaps: [legacy] }));
    const loaded = loadTara(store);
    expect(loaded.draft).toMatchObject({ experienceVersion: 1, predictionResult: '', comparison });
    saveTaraDraft({ ...loaded.draft, learning: 'Legacy wording retained' }, store);
    expect(loadTara(store).recaps[0]).toMatchObject({ comparison, predictionResult: '' });
  });
  it('resumes a new partial prediction recap without deriving difficulty or practising claims', () => {
    const store = memory();
    const recap = confirmReflection({ ...prepared(), phase: 'reflect', actualActionConfirmed: true, eventStatus: 'not-attempted', predictionResult: 'partly', actual: 'I only observed one part.' });
    saveTaraRecap(recap, store);
    expect(loadTara(store).recaps[0]).toMatchObject({ predictionResult: 'partly', comparison: '', rehearsed: false, actual: 'I only observed one part.', saved: true });
  });
  it('preserves future experience versions rather than silently downgrading or overwriting them', () => {
    const store = memory();
    const raw = JSON.stringify({ schemaVersion: 1, draft: { ...prepared(), experienceVersion: 4 }, recaps: [] });
    store.setItem(TARA_STORAGE_KEY, raw);
    expect(() => loadTara(store)).toThrow();
    expect(() => saveTaraDraft(prepared(), store)).toThrow();
    expect(store.getItem(TARA_STORAGE_KEY)).toBe(raw);
  });
});
