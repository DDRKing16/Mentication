import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withAttemptHelpfulness, withMeasuredResponse, learningResponse } from './attemptFeedback';
import { computeEffectiveness } from './interventions';

describe('shared intervention helpfulness contract', () => {
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-05T00:00:00Z')); });
  afterEach(() => vi.useRealTimers());
  it.each(['happyBump','boxV2'])('supports %s with one explicit sample over independent mood', (intervention_id) => {
    const attempt={intervention_id,response:'not_answered',completed_percentage:1,exit_reason:'completed'};
    const feedback=withAttemptHelpfulness(attempt,'worse');
    expect(feedback.helpfulness_response).toBe('worse');
    const measured=withMeasuredResponse(feedback,'better');
    expect(measured).toMatchObject({mood_response:'better',response:'worse'});
    expect(learningResponse({...measured,response:'better'})).toBe('worse');
    const session={created_date:new Date().toISOString(),attempts:[measured]};
    expect(computeEffectiveness([session])[intervention_id]).toBeLessThan(0.5);
    expect(computeEffectiveness([session])[intervention_id]).toBe(computeEffectiveness([{...session,attempts:[feedback]}])[intervention_id]);
  });
  it('does not turn absent, uncertain or invalid helpfulness into evidence', () => {
    for (const value of [undefined,null,'unsure','invalid']) expect(withAttemptHelpfulness({response:'not_answered'},value)).toEqual({response:'not_answered'});
  });
});
