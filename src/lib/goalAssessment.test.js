import { describe, expect, it } from 'vitest';
import { GOAL_ASSESSMENTS, captureGoalBaseline, goalPointChange } from './goalAssessment';
import { withLiftCheckin } from './liftFollowup';

describe('same-question goal baseline contract', () => {
  it.each(Object.keys(GOAL_ASSESSMENTS))('preserves %s question, scale, anchors and direction', (direction) => {
    const baseline=captureGoalBaseline(direction,3);
    expect(baseline).toMatchObject({...GOAL_ASSESSMENTS[direction],min:0,max:10,value:3,answered:true});
    expect(goalPointChange(baseline,direction,3)).toBe(0);
    expect(goalPointChange(baseline,direction,5)).toBe(2);
    expect(goalPointChange({...baseline,question:'Energy?'},direction,5)).toBeNull();
    expect(goalPointChange({...baseline,left:'Different'},direction,5)).toBeNull();
    expect(goalPointChange({...baseline,answered:false},direction,5)).toBeNull();
  });
  it('never treats a guessed or skipped baseline, or another scale, as a comparison', () => {
    expect(goalPointChange(null,'lift',7)).toBeNull();
    expect(goalPointChange(captureGoalBaseline('calm',5),'lift',7)).toBeNull();
    expect(captureGoalBaseline('lift',null)).toBeNull();
    expect(captureGoalBaseline('lift','5')).toBeNull();
    const session={id:'legacy',direction:'lift',intensity_start:5,completed_pathway:['happyBump'],attempts:[{intervention_id:'happyBump',exit_reason:'completed',response:'not_answered'}]};
    expect(withLiftCheckin(session,7,5).attempts[0].response).toBe('not_answered');
  });
});
