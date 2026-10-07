import { describe, expect, it } from 'vitest';
import { atScreen, FLOW_PHASES, previousScreen, resumeFromEntry, screenFor } from './getThroughFlow';
import { newTaraState, validateTaraState } from './taraTacticianState';
import { loadTara, saveTaraDraft } from './taraTacticianStorage';

describe('Get through this single-question navigation and persistence', () => {
  it.each(['timing', 'event', 'challenge', 'prediction', 'move', 'move-confirm', 'practice-choose', 'practice-try', 'usability', 'ready', 'live', 'support', 'pace', 'reflect-action', 'reflect-prediction', 'reflect-observation'])('resumes the exact %s question without changing private content', screen => {
    const data = new Map(); const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
    const state = atScreen({ ...newTaraState(), situation: 'Private work conversation', prediction: 'My actual worry', actual: 'My own observation', paceChoice: 'pause', actionChoice: 'unknown', savePreference: 'skip' }, screen);
    saveTaraDraft(state, storage);
    expect(loadTara(storage).draft).toEqual(state);
    expect(screenFor(loadTara(storage).draft)).toBe(screen);
  });
  it('loads legacy substeps and original outcomes without inferring new reports', () => {
    const state = { ...newTaraState(), phase: 'reflect', experienceVersion: 2, actualActionConfirmed: true, eventStatus: 'unknown', predictionResult: 'unsure', comparison: 'more', nextStep: 'Original next-use words' };
    delete state.flowScreen;
    const loaded = validateTaraState(state);
    expect(screenFor(loaded)).toBe('reflect-observation');
    expect(loaded).toMatchObject({ eventStatus: 'unknown', predictionResult: 'unsure', comparison: 'more', nextStep: 'Original next-use words', savePreference: '' });
  });
  it('Back changes only the view and retains confirmed practice and exact words', () => {
    const state = atScreen({ ...newTaraState(), practice: { ...newTaraState().practice, round: 1, step: 'ready', tried: [true, true], triedWordings: ['First confirmed words', 'Backup confirmed words'] }, rehearsed: true, situation: 'My exact situation' }, 'usability');
    const previous = previousScreen(state);
    expect(screenFor(previous)).toBe('practice-try');
    expect(previous.practice).toMatchObject({ step: 'try', tried: [true, true], triedWordings: ['First confirmed words', 'Backup confirmed words'] });
    expect(previous.situation).toBe(state.situation);
  });
  it('separates pending action choice from the confirmed outcome', () => {
    const state = atScreen({ ...newTaraState(), actionChoice: 'finished', actualActionConfirmed: false }, 'reflect-action');
    expect(validateTaraState(state)).toMatchObject({ actionChoice: 'finished', eventStatus: 'not-started', actualActionConfirmed: false });
  });
  it('rejects unknown persisted screens while allowing a safe fallback for an old mismatched phase', () => {
    expect(validateTaraState({ ...newTaraState(), flowScreen: 'future-screen' })).toBeNull();
    expect(screenFor({ ...newTaraState(), phase: 'tackle' })).toBe('live');
    expect(FLOW_PHASES[screenFor({ ...newTaraState(), phase: 'tackle' })]).toBe('tackle');
  });
  it('resumes the unfinished recovery beat after Back to entry without erasing a confirmed try', () => {
    const state = { ...newTaraState(), prediction: 'My exact worry', practice: { ...newTaraState().practice, tried: [true, false], triedWordings: ['Exact confirmed first wording', ''] } };
    const resumed = resumeFromEntry(state);
    expect(screenFor(resumed)).toBe('practice-choose');
    expect(resumed.practice).toMatchObject({ round: 1, tried: [true, false], triedWordings: ['Exact confirmed first wording', ''] });
    expect(resumed.prediction).toBe(state.prediction);
  });
  it('honours a deliberately kept unpractised plan when resuming', () => {
    const state = { ...newTaraState(), practice: { ...newTaraState().practice, step: 'ready', responses: ['move', ''] } };
    const resumed = resumeFromEntry(state);
    expect(screenFor(resumed)).toBe('ready');
    expect(resumed.practice.tried).toEqual([false, false]);
    expect(resumed.rehearsed).toBe(false);
  });
});
