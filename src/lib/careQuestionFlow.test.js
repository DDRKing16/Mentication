import { describe, expect, it } from 'vitest';
import { freshCareState, restoreCareState, careOutcome } from './carePractices';
import { CARE_SCREEN_PATHS, careForwardPatch, careBackPatch, careScreen, careSavedMatches, careScreenProgress } from './careQuestionFlow';

describe.each(Object.keys(CARE_SCREEN_PATHS))('%s focused flow', id => {
  it('restores each actual screen and its previous screen without losing private words or reports', () => {
    let state = { ...freshCareState(), notice: 'Exact personal words', perspective: 'A believable response', action: 'My useful step', before: 0 };
    let screen = 'intro';
    for (const next of CARE_SCREEN_PATHS[id].slice(1)) {
      const previous = screen;
      state = restoreCareState({ ...state, ...careForwardPatch(id, state, screen, next, next === 'outside' ? { anchorType: 'object' } : next === 'allow' ? { allowance: 'small' } : {}) });
      expect(careScreen(id, state)).toBe(next);
      const back = restoreCareState({ ...state, ...careBackPatch(id, state, next) });
      expect(careScreen(id, back)).toBe(previous);
      expect(back.notice).toBe('Exact personal words');
      expect(back.action).toBe('My useful step');
      expect(back.before).toBe(0);
      expect(careOutcome(id, state)).toMatchObject({ change: null, practiceTaken: false, actionStatus: null });
      screen = next;
    }
  });
  it('keeps progress moving forward as the actual questions advance', () => {
    const progress = CARE_SCREEN_PATHS[id].map(screen => careScreenProgress(id, freshCareState(), screen));
    expect(progress).toEqual([...progress].sort((a,b) => a-b));
    expect(progress[0]).toBe(0);
    expect(progress.at(-1)).toBe(7);
    expect(careScreenProgress(id, { ...freshCareState(), careTrail: ['notice-own'] }, 'options')).toBe(careScreenProgress(id, freshCareState(), 'notice'));
  });
  it('keeps skipped ratings null and prevents save matching a different card', () => {
    const state = { ...freshCareState(), notice: 'Current words', before: 8, after: 9 };
    const skipped = { ...state, ...careForwardPatch(id, state, 'after', 'save', { before: null, after: null }) };
    expect(careOutcome(id, skipped).assessment).toMatchObject({ before: null, after: null });
    expect(careSavedMatches(skipped, { ...skipped, notice: 'An older saved card' })).toBe(false);
    expect(careSavedMatches(skipped, { ...skipped, careScreen: 'card', careTrail: [] })).toBe(true);
  });
  it('ignores corrupt navigation history and never trusts an unknown screen', () => {
    const state = restoreCareState({ ...freshCareState(), careScreen: 'execute', careTrail: ['bad',null,{},'intro'], notice: 'Keep me' });
    expect(state.careScreen).toBeNull();
    expect(state.careTrail).toEqual(['intro']);
    expect(careScreen(id, state)).toBe('intro');
    expect(() => careForwardPatch(id, state, 'intro', 'bad')).toThrow('Unknown care screen');
  });
});
it('returns from optional naming to the actual previous practice screen', () => {
  const state = { ...freshCareState(), careScreen: 'anchor-own', careTrail: ['before','notice','anchor','outside'], anchorType: 'support', anchorText: 'My chair' };
  const back = restoreCareState({ ...state, ...careBackPatch('makeRoom', state, 'anchor-own') });
  expect(careScreen('makeRoom', back)).toBe('outside');
  expect(back).toMatchObject({ anchorType: 'support', anchorText: 'My chair', practiceTaken: false });
});
it('ignores screens belonging to another practice in a corrupted draft', () => {
  const state = restoreCareState({ ...freshCareState(), careScreen: 'return', careTrail: ['frame','return','intro'] });
  expect(careScreen('selfCompassion', state)).toBe('intro');
  expect(careBackPatch('selfCompassion', state, 'response').careScreen).toBe('intro');
});
it('resumes older version-1 drafts at a useful corresponding screen without inventing credit', () => {
  const old = { ...freshCareState(), careScreen: null, stage: 'practice', notice: 'Original words', practiceTaken: false };
  expect(careScreen('selfCompassion', { ...old, perspective: 'My saved response' })).toBe('say');
  expect(careScreen('unhook', { ...old, perspective: 'My mind is predicting…', defusionStep: 2 })).toBe('frame');
  expect(careScreen('makeRoom', { ...old, anchorType: 'object', allowance: 'small' })).toBe('allow');
  expect(careScreen('makeRoom', { ...old, stage: 'complete' })).toBe('card');
  expect(restoreCareState(old).practiceTaken).toBe(false);
});
it('bounds repeated return history while retaining the immediate Back destination', () => {
  let state = freshCareState();
  for (let i = 0; i < 100; i++) state = { ...state, ...careForwardPatch('unhook', state, 'return-next', 're-hook') };
  expect(state.careTrail.length).toBe(64);
  expect(careBackPatch('unhook', state, 're-hook').careScreen).toBe('return-next');
});

it('reopens a legacy unfinished custom notice or step as a visible editor', () => {
  const old = { ...freshCareState(), careScreen: null, stage: 'notice', notice: 'My exact custom words' };
  expect(careScreen('unhook', old, { notices: ['A preset'] })).toBe('notice-own');
  expect(careScreen('unhook', { ...old, stage: 'action', action: 'My own pending step', actionStatus: null }, { actions: ['Read one sentence'] })).toBe('action-own');
  expect(careScreen('unhook', { ...old, stage: 'action', action: 'My own step', actionStatus: 'done' }, { actions: [] })).toBe('status');
});

it('clears allowing consent on stop, so Back stays outside until an explicit new choice', () => {
  const stopped = { ...freshCareState(), careScreen: 'orient', stage: 'orient', anchorType: 'support', anchorText: 'My chair', careTrail: ['anchor','outside','allow'], allowance: null };
  const back = restoreCareState({ ...stopped, ...careBackPatch('makeRoom', stopped, 'orient') });
  expect(careScreen('makeRoom', back)).toBe('outside');
  expect(back.practiceTaken).toBe(false);
  expect(back.careTrail).toEqual(['anchor']);
  const consenting = { ...back, ...careForwardPatch('makeRoom', back, 'outside', 'allow', { allowance: 'small' }) };
  expect(careScreen('makeRoom', consenting)).toBe('allow');
});
