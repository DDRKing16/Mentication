import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import GentleTappingExperience from './GentleTappingExperience';
let practice;
vi.mock('@/components/plus/PlusGate', () => ({ default: ({ children }) => children }));
vi.mock('./TappingExperience', () => ({ default: props => { practice = props; return null; } }));

describe('tapping host preferences and completion bridge', () => {
  it.each([{ noAudio: true }, { discreet: true }])('keeps a silent host reset silent: %j', answers => {
    renderToStaticMarkup(<GentleTappingExperience answers={answers}/>);
    expect(practice.silent).toBe(true);
  });
  it('allows opt-in cues without changing the completion contract', async () => {
    const onComplete = vi.fn(), onAttemptEvent = vi.fn();
    renderToStaticMarkup(<GentleTappingExperience onComplete={onComplete} onAttemptEvent={onAttemptEvent}/>);
    expect(practice.silent).toBe(false);
    const result = { completed: false, before: null, after: 0, roundsCompleted: 0, stopped: true };
    await practice.onComplete(result);
    expect(onComplete).toHaveBeenCalledWith({ requireGoalReassessment: true, exitReason: 'exited', completedPercentage: 0, outcome: result });
    expect(onAttemptEvent).toHaveBeenCalledWith(expect.objectContaining({ interventionId: 'eftTapping', exitReason: 'exited', completedPercentage: 0 }));
  });
});
