import { describe, expect, it } from 'vitest';
import { GOAL_ASSESSMENTS, captureGoalBaseline, goalPointChange, restoredGoalRating } from './goalAssessment';
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

describe('contextual wording and old measurements', () => {
  it('measures sleep difficulty, not alertness, without changing the domain', () => {
    expect(captureGoalBaseline('sleep',0)).toMatchObject({question:'How much are you struggling to sleep right now?',scale:'sleep difficulty',left:'Not struggling',right:'Struggling a lot',min:0,max:10,higherIsBetter:false,value:0});
  });
  it.each(['calm','focus','ground','reset','sleep'])('does not relabel an old %s baseline or compare it to a new question', direction => {
    const old={...captureGoalBaseline(direction,0),question:'How intense is it right now?',...(direction==='sleep'?{scale:'wakefulness',left:'Drowsy',right:'Wide awake'}:{})};
    expect(goalPointChange(old,direction,0)).toBeNull();
    expect(old.question).toBe('How intense is it right now?');
    expect(goalPointChange(captureGoalBaseline(direction,0),direction,0)).toBe(0);
    expect(goalPointChange(captureGoalBaseline(direction,0),direction,null)).toBeNull();
  });
});

describe('resumed endpoint construct',()=>{
 it.each([0,7])('does not relabel old wakefulness endpoint %s',goalRating=>{
 const old={...captureGoalBaseline('sleep',5),question:'How intense is it right now?',scale:'wakefulness',left:'Drowsy',right:'Wide awake'};
 expect(restoredGoalRating({direction:'sleep',goal_baseline:old},{goalRating})).toBeNull();
 expect(restoredGoalRating({direction:'sleep'},{goalRating})).toBeNull();
 expect(restoredGoalRating({direction:'sleep',goal_baseline:captureGoalBaseline('sleep',5)},{goalRating})).toBe(goalRating);
 expect(restoredGoalRating({direction:'sleep'},{goalRating,goalAssessment:captureGoalBaseline('sleep',goalRating)})).toBe(goalRating);
 expect(restoredGoalRating({direction:'sleep'},{goalRating,goalAssessment:captureGoalBaseline('calm',goalRating)})).toBeNull();
 });
});
