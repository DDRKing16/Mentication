import { describe, expect, it } from 'vitest';
import { freshCareState, restoreCareState, careOutcome } from './carePractices';
import { MIND_PATTERNS, mindPhrase, mindPattern, unhookPhase, roomPhase, actionAttention, attentionTarget, assessmentText } from './experientialCare';

describe('new practices remain honest across the existing draft codec', () => {
  const thought = 'I might lose my place when I speak. '.repeat(10).slice(0, 300);
  for (const pattern of MIND_PATTERNS) it(`restores ${pattern.id} without losing the exact thought`, () => {
    const state = { ...freshCareState(), stage: 'practice', notice: thought, perspective: mindPhrase(pattern.id, thought), defusionStep: 1 };
    const restored = restoreCareState(JSON.parse(JSON.stringify(state)));
    expect(restored.notice).toBe(thought);
    expect(mindPattern(restored.perspective).id).toBe(pattern.id);
    expect(restored.perspective.length).toBeLessThanOrEqual(300);
    expect(unhookPhase(restored)).toBe('notice');
    expect(careOutcome('unhook', restored).practiceTaken).toBe(false);
  });
  it('does not treat an older two-choice draft as a self-report', () => {
    const restored = restoreCareState({ ...freshCareState(), stage: 'practice', defusionStep: 2, distance: 'beside', anchorType: 'object', perspective: 'I am noticing the thought…', practiceTaken: false });
    expect(unhookPhase(restored)).toBe('notice');
  });
  it('restores the reported phrase, chosen plan and reported attention separately', () => {
    const states = [
      { defusionStep: 2, practiceTaken: true },
      { defusionStep: 2, practiceTaken: true, action: 'Read my first line', actionStatus: 'planned', distance: 'beside', anchorType: 'object', anchorText: 'My notes' },
      { defusionStep: 2, practiceTaken: true, action: 'Read my first line', actionStatus: 'planned', distance: 'beside', anchorType: 'object', anchorNoticed: true },
    ].map(values => restoreCareState({ ...freshCareState(), ...values }));
    expect(states.map(unhookPhase)).toEqual(['direction', 'attention', 'attention']);
    expect(states.map(s => s.anchorNoticed)).toEqual([false, false, true]);
    expect(states[2].actionStatus).toBe('planned');
  });
  it('allows a feeling without manufacturing an attempt or changed rating', () => {
    const restored = restoreCareState({ ...freshCareState(), stage: 'practice', notice: 'Worry', allowance: 'small', anchorType: 'sound', before: 6 });
    expect(roomPhase(restored)).toBe('allow');
    expect(careOutcome('makeRoom', restored)).toMatchObject({ practiceTaken: false, change: null });
    expect(restored.after).toBeNull();
  });
  it('keeps a stopped/declined plan distinct from a completed action', () => {
    const restored = restoreCareState({ ...freshCareState(), notice: 'Worry', action: 'Get water', actionStatus: 'planned', allowance: null });
    expect(careOutcome('makeRoom', restored)).toMatchObject({ practiceTaken: false, actionStatus: 'planned' });
  });
});
describe('personal cues support the chosen action and sense', () => {
  it('uses literal reading words without interpreting the thought', () => { expect(actionAttention('Read the opening line of my notes.')).toMatchObject({ preferred: 'object', target: 'The line I chose to read' }); });
  it('honours another sense instead of claiming the user noticed a page', () => { expect(attentionTarget({ action: 'Read my notes', anchorType: 'support', anchorText: '' })).toBe('The surface supporting me'); });
  it('keeps a user-named anchor exact', () => { expect(attentionTarget({ action: 'Read my notes', anchorType: 'support', anchorText: 'My Blue Chair' })).toBe('My Blue Chair'); });
  it('does not turn a negative or stopping action into a reading instruction', () => { expect(actionAttention('Do not read that message yet').target).toBe('One detail of my next step'); expect(actionAttention('Close my notes').target).toBe('One detail of my next step'); });
  it('does not assume a person when the user chooses their own listening step', () => { expect(actionAttention('Listen to the fan').target).toBe('The sound I chose to hear'); });
  it('uses a general practical cue for unrecognised actions', () => { expect(actionAttention('Do something I chose').cue).toContain('ordinary detail'); });
  it('reports zero, blank and no-change accurately', () => { expect(assessmentText({ before: 0, after: 0 })).toContain('no change'); expect(assessmentText({ before: 6, after: null })).toContain('blank'); expect(assessmentText({ before: 6, after: 8 })).toContain('more difficulty'); });
});
