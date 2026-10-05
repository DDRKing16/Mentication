import { afterEach, describe, expect, it, vi } from 'vitest';
import { advanceNextStep, freshNextStep, NEXT_STEP_KEY, replaceNextStep, restoreNextStep, undoNextStep } from '../lib/nextStepState';
import { captureGoalBaseline, goalPointChange, MATCHED_ASSESSMENT_IDS } from '../lib/goalAssessment';
const step = { title: 'Open one synthetic file', micro: 'One click.', easier: ['Touch the mouse'] };
const active = () => ({ ...freshNextStep(), screen: 'focus', ladder: [{ ...step }, { ...step }] });
afterEach(() => vi.unstubAllGlobals());
describe('Next Easiest Step honest state and persistence', () => {
  it('replacing with an easier or edited action never completes it', () => {
    const state = replaceNextStep(active(), 'Touch the mouse');
    expect(state.currentStepIndex).toBe(0);
    expect(state.winsToday).toBe(0);
    expect(state.ladder[0].status).toBeNull();
  });
  it('skip advances without credit and undo reverses completion and skip', () => {
    const skipped = advanceNextStep(active(), 'skipped');
    expect(skipped.winsToday).toBe(0);
    const done = advanceNextStep(skipped, 'done');
    expect(done.screen).toBe('dashboard');
    expect(done.winsToday).toBe(1);
    const undone = undoNextStep(done);
    expect(undone.winsToday).toBe(0);
    expect(undoNextStep(undone).ladder.every(s => !s.status)).toBe(true);
    expect(advanceNextStep(done, 'done')).toBe(done);
  });
  it('blocked reads and malformed saved ladders return an actionable error', () => {
    vi.stubGlobal('localStorage', { getItem() { throw new Error('blocked'); } });
    expect(restoreNextStep().error).toContain('could not be read');
    vi.stubGlobal('localStorage', { getItem: () => JSON.stringify({ ladder: [null] }) });
    expect(restoreNextStep().state.ladder).toEqual([]);
  });
  it('restores explicit statuses, ignores stale counters, and offers resume from landing', () => {
    vi.stubGlobal('localStorage', { getItem: key => key === NEXT_STEP_KEY ? JSON.stringify({ ...active(), ladder: [{ ...step, status: 'skipped' }, step], winsToday: 999, currentStepIndex: 999 }) : null });
    const { state } = restoreNextStep();
    expect(state.screen).toBe('landing');
    expect(state.currentStepIndex).toBe(1);
    expect(state.winsToday).toBe(0);
  });
  it('uses matched goal assessment and never treats missing ratings as answers', () => {
    expect(MATCHED_ASSESSMENT_IDS.has('nextAction')).toBe(true);
    const baseline = captureGoalBaseline('focus', 8);
    expect(goalPointChange(baseline, 'focus', 3)).toBe(-5);
    expect(goalPointChange(baseline, 'focus', null)).toBeNull();
    expect(goalPointChange({ ...baseline, left: 'Different anchor' }, 'focus', 3)).toBeNull();
    expect(goalPointChange(baseline, 'calm', 3)).toBeNull();
  });
});
