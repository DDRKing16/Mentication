import { describe, expect, it } from 'vitest';
import { chooseChallenge, chooseEvent, newTaraState, taraCompletion, validateTaraState } from './taraTacticianState';
import { TARA_GUIDANCE, choosePracticeResponse, chooseTaraNextStep, confirmPracticeTry, guidanceFor, keepUnpractisedPlan, newTaraPractice, practiceOptions, startTaraPractice } from './taraGuidance';
import { TARA_STORAGE_KEY, clearTara, loadTara, saveTaraDraft, saveTaraRecap } from './taraTacticianStorage';
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
const plan = () => ({ ...chooseChallenge(chooseEvent(newTaraState(), 'conversation'), 'Holding a boundary'), phase: 'plan', situation: 'My real situation', plan: { mind: 'My reminder', notice: 'My cue', do: 'My exact words', spikes: 'My exact backup' } });
describe('Tara authored planning and two-beat practice', () => {
  it.each(Object.keys(TARA_GUIDANCE))('offers distinct starting/recovery cues and usable backup choices for %s', challenge => {
    const state = { ...plan(), challenge, phase: 'rehearse', practice: newTaraPractice() };
    expect(guidanceFor(state).recovery).toBeTruthy();
    expect(guidanceFor(state).insight).toBeTruthy();
    const first = practiceOptions(state); const second = practiceOptions({ ...state, practice: { ...state.practice, round: 1 } });
    expect(first[0][2]).toBe('My exact words'); expect(second).toHaveLength(3);
    expect(second.every(([id, label, wording, purpose]) => id && label && wording && purpose)).toBe(true);
    expect(new Set(second.map(([id]) => id)).size).toBe(3);
  });
  it('requires response selection and explicit confirmation for each recorded practice beat', () => {
    const started = startTaraPractice(plan());
    expect(confirmPracticeTry(started)).toBe(started);
    const selected = choosePracticeResponse(started, 'move');
    expect(selected).toMatchObject({ rehearsed: false, actual: '', eventStatus: 'not-started', practice: { step: 'try', tried: [false, false] } });
    const first = confirmPracticeTry(selected);
    expect(first.practice.triedWordings[0]).toBe('My exact words');
    expect(first).toMatchObject({ phase: 'rehearse', rehearsed: true, practice: { round: 1, step: 'choose', tried: [true, false] } });
    expect(confirmPracticeTry(first)).toBe(first);
    const second = choosePracticeResponse(first, 'repeat');
    expect(second.practice.tried).toEqual([true, false]);
    expect(second.plan.do).toBe('My exact words');
    const kept = confirmPracticeTry(second);
    expect(kept).toMatchObject({ phase: 'ready', practice: { tried: [true, true], step: 'ready' } });
    expect(kept.actual).toBe(''); expect(kept.actualActionConfirmed).toBe(false);
  });
  it('never silently replaces the first move with a practised pause', () => {
    const state = confirmPracticeTry(choosePracticeResponse(startTaraPractice(plan()), 'pause'));
    expect(state.plan.do).toBe('My exact words');
    expect(state.practice.wordings[0]).toBe('“I need a little time before I answer.”');
    expect(state.plan.spikes).toBe('My exact backup');
  });
  it('keeps an unpractised chosen backup without claiming practice or a real outcome', () => {
    const first = confirmPracticeTry(choosePracticeResponse(startTaraPractice(plan()), 'move'));
    const chosen = choosePracticeResponse(first, 'repeat');
    const kept = keepUnpractisedPlan(chosen);
    expect(kept).toMatchObject({ phase: 'ready', actual: '', eventStatus: 'not-started', practice: { tried: [true, false] } });
    expect(kept.plan.spikes).toBe('“That is what I can offer.”');
    expect(keepUnpractisedPlan(startTaraPractice(plan())).rehearsed).toBe(false);
  });
  it('does not count unknown selections or empty edited practice words as a try', () => {
    const state = startTaraPractice(plan()); expect(choosePracticeResponse(state, 'invented')).toBe(state);
    const chosen = choosePracticeResponse(state, 'move');
    const blank = { ...chosen, practice: { ...chosen.practice, wordings: ['', ''] } };
    expect(confirmPracticeTry(blank)).toBe(blank);
  });
  it('records usability only when provided and retains authored wording across refresh', () => {
    const store = memory();
    const state = { ...choosePracticeResponse(startTaraPractice(plan()), 'move'), practice: { ...newTaraPractice(), step: 'try', responses: ['move', ''], wordings: ['My long practice wording '.repeat(30), ''], tried: [false, false], triedWordings: ['', ''], usability: 'unsure' } };
    saveTaraDraft(state, store); expect(loadTara(store).draft).toEqual({ ...state, flowScreen: 'practice-try' });
    expect(loadTara(store).draft.practice.usability).toBe('unsure');
    expect(taraCompletion(state)).not.toHaveProperty('practice');
    expect(taraCompletion(state)).not.toHaveProperty('situation');
  });
  it.each(['keep', 'adjust', 'later'])('creates a next-use intention only for explicit %s selection and preserves actual report', carryChoice => {
    const original = { ...plan(), phase: 'recap', actual: 'It was hard.', predictionResult: 'partly', comparison: 'more', eventStatus: 'finished', actualActionConfirmed: true };
    const selected = chooseTaraNextStep(original, carryChoice);
    expect(selected.nextStep).toBeTruthy(); expect(selected.carryChoice).toBe(carryChoice);
    expect(selected.actual).toBe(original.actual); expect(selected.comparison).toBe('more'); expect(selected.learning).toBe('');
    expect(chooseTaraNextStep(original, 'fabricated')).toBe(original);
  });
  it('loads v1/v2 without inventing new practice tries or rewriting original outcomes', () => {
    for (const experienceVersion of [1, 2]) {
      const original = { ...plan(), experienceVersion, phase: 'recap', comparison: 'more', predictionResult: experienceVersion === 2 ? 'partly' : '', eventStatus: 'unknown', actualActionConfirmed: true, rehearsed: true };
      delete original.practice;
      const loaded = validateTaraState(original);
      expect(loaded.practice.tried).toEqual([false, false]); expect(loaded.comparison).toBe('more');
      expect(loaded.experienceVersion).toBe(experienceVersion); expect(loaded.plan.do).toBe('My exact words');
      expect(loaded.rehearsed).toBe(true);
    }
  });
  it('supports separate confirmed prediction results on v3 recaps, save/clear and future-version preservation', () => {
    const store = memory();
    const state = { ...plan(), experienceVersion: 3, phase: 'recap', predictionResult: 'not-tested', comparison: '', eventStatus: 'not-attempted', actualActionConfirmed: true };
    saveTaraRecap(state, store); expect(loadTara(store).recaps[0].predictionResult).toBe('not-tested');
    clearTara(store); expect(loadTara(store)).toEqual({ draft: null, recaps: [] });
    const raw = JSON.stringify({ schemaVersion: 1, draft: { ...state, experienceVersion: 4 }, recaps: [] }); store.setItem(TARA_STORAGE_KEY, raw);
    expect(() => saveTaraDraft(plan(), store)).toThrow(); expect(store.getItem(TARA_STORAGE_KEY)).toBe(raw);
  });
});

describe('Tara practice integrity', () => {
  it('keeps the exact words confirmed as tried even if the current wording is edited', () => {
    const tried = confirmPracticeTry(choosePracticeResponse(startTaraPractice(plan()), 'move'));
    const edited = { ...tried, practice: { ...tried.practice, wordings: ['Edited for later', ''] } };
    const store = memory(); saveTaraDraft(edited, store);
    expect(loadTara(store).draft.practice.triedWordings[0]).toBe('My exact words');
    expect(loadTara(store).draft.practice.wordings[0]).toBe('Edited for later');
  });
  it('preserves malformed new practice records instead of dropping private practice words', () => {
    const store = memory();
    for (const practice of [{ ...newTaraPractice(), round: 9 }, { ...newTaraPractice(), wordings: ['My private words'] }, { ...newTaraPractice(), tried: ['yes', false] }]) {
      const raw = JSON.stringify({ schemaVersion: 1, draft: { ...plan(), practice }, recaps: [] });
      store.setItem(TARA_STORAGE_KEY, raw); expect(() => saveTaraDraft(plan(), store)).toThrow(); expect(store.getItem(TARA_STORAGE_KEY)).toBe(raw);
    }
  });
});

it('resumes a legacy selected response verbatim without inventing a confirmed try', () => {
  for (const experienceVersion of [1, 2]) {
    const loaded = validateTaraState({ ...plan(), experienceVersion, phase: 'rehearse', practice: undefined, rehearsalChoice: 'pause', rehearsalResponse: 'My exact earlier selected words', rehearsed: false });
    expect(loaded.practice).toMatchObject({ responses: ['pause', ''], wordings: ['My exact earlier selected words', ''], tried: [false, false], step: 'try' });
    expect(loaded.rehearsed).toBe(false);
    expect(confirmPracticeTry(loaded).experienceVersion).toBe(3);
  }
});
