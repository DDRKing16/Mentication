import { describe, expect, it } from 'vitest';
import { happyBumpCompletion, carePracticeCompletion, taraPracticeCompletion, vectorPracticeCompletion, groundingPracticeCompletion } from './practiceCompletionEvidence';
import { withLiftCheckin } from './liftFollowup';
import { captureGoalBaseline } from './goalAssessment';
import { taraCompletion } from './taraTacticianState';

describe('meaningful practice evidence', () => {
  it('Happy Bump excludes setup, ratings, opened apps and future plans', () => {
    expect(happyBumpCompletion({baseline:0,current:10,connection:'message',task:'Write',taskConfirmed:true,walkChosen:true,nextActivity:'Read',areaAction:'Call',reflectionConfirmed:false,proud:'Words'})).toEqual({exitReason:'skipped',completedPercentage:0});
    for (const state of [{hydrated:true},{aired:true},{walkStatus:'started'},{taskStatus:'completed'},{contactStatus:'attempted'},{reflectionConfirmed:true,proud:'I tried'}]) {
      expect(happyBumpCompletion(state)).toEqual({exitReason:'completed',completedPercentage:1/6});
    }
  });
  it('care distinguishes planned, tried, performed and stopped', () => {
    expect(carePracticeCompletion({actionStatus:'planned',before:8,after:0}).exitReason).toBe('skipped');
    expect(carePracticeCompletion({practiceTaken:true,actionStatus:'planned'}).exitReason).toBe('completed');
    expect(carePracticeCompletion({actionStatus:'done'}).exitReason).toBe('completed');
    expect(carePracticeCompletion({practiceStopped:true,practiceTaken:true}).exitReason).toBe('exited');
  });
  it('Tara distinguishes rehearsal from event attendance and keeps outcome consistent', () => {
    for (const [state,exitReason] of [[{eventStatus:'not-attempted'},'skipped'],[{eventStatus:'unknown'},'skipped'],[{eventStatus:'not-attempted',rehearsed:true},'completed'],[{eventStatus:'finished'},'completed'],[{eventStatus:'stepped-out'},'exited']]) {
      expect(taraPracticeCompletion(state).exitReason).toBe(exitReason);
      expect(taraCompletion(state).completion).toBe(exitReason);
    }
  });
});
describe('independently optional Lift ratings', () => {
  const session={id:'synthetic',direction:'lift',goal_baseline:captureGoalBaseline('lift',5),completed_pathway:['happyBump'],attempts:[{intervention_id:'happyBump',exit_reason:'completed'}]};
  it.each([[0,null,'worse'],[5,null,'same'],[8,null,'better'],[null,0,'not_answered'],[null,null,'not_answered']])('preserves mood %s and distress %s without inventing either', (mood,distress,response) => {
    const updated=withLiftCheckin(session,mood,distress,'synthetic-time');
    expect(updated.intensity_end).toBe(mood);
    expect(updated.post_happy_bump_checkin).toEqual({mood,distress,answered_at:'synthetic-time'});
    expect(updated.attempts[0].mood_response).toBe(response);
    expect(withLiftCheckin(updated,mood,distress,'synthetic-time')).toEqual(updated);
  });
  it('rejects malformed answers and retains explicit helpfulness separately', () => {
    expect(withLiftCheckin(session,'0',null)).toBeNull();
    const updated=withLiftCheckin({...session,attempts:[{...session.attempts[0],helpfulness_response:'better'}]},0,null);
    expect(updated.attempts[0]).toMatchObject({response:'better',mood_response:'worse'});
  });
});

it('Vector counts actual gameplay groups, excluding setup, quiz and skips', () => {
  expect(vectorPracticeCompletion({exitReason:'completed',practicedStages:[]})).toEqual({exitReason:'skipped',completedPercentage:0});
  expect(vectorPracticeCompletion({practicedStages:[2,2,6,7,'3']})).toEqual({exitReason:'completed',completedPercentage:.25});
  expect(vectorPracticeCompletion({exitReason:'stopped',practicedStages:[3]})).toEqual({exitReason:'stopped',completedPercentage:.25});
  expect(vectorPracticeCompletion({practicedStages:[2,3,4,5]})).toEqual({exitReason:'completed',completedPercentage:1});
});

it('Grounding counts confirmed senses, never merely moving to the last screen', () => {
  expect(groundingPracticeCompletion([],true)).toEqual({exitReason:'skipped',completedPercentage:0});
  expect(groundingPracticeCompletion([0,0,5,6],true)).toEqual({exitReason:'completed',completedPercentage:.2});
  expect(groundingPracticeCompletion([0,2],false)).toEqual({exitReason:'exited',completedPercentage:.4});
});
