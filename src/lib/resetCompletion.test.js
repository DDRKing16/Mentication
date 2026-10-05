import { describe, expect, it } from 'vitest';
import { attemptEventDisposition, resetCompletionSnapshot, coarseCompletionOutcome, finalAssessmentEvent } from './resetCompletion';
import { resetNavigationEntry, freshResetEntry } from './resetNavigation';
import { captureGoalBaseline, goalPointChange } from './goalAssessment';

const answers = { direction:'reset', intensity:7, goal_baseline:captureGoalBaseline('reset', 7) };
const event = { interventionId:'factCheck', action:'completed', exitReason:'completed', completedPercentage:1, startedAt:1000, timestamp:2000, helpfulness:'same' };
const result = { requireGoalReassessment:true, helpfulness:'same', outcome:{ classificationCounts:{ fact:1, interpretation:2 }, certaintyBefore:8, certaintyAfter:6, saved:false } };
const entry = { prebuilt:true, pathway:['factCheck'], reset_completion:{ event, result } };

describe('final assessment refresh boundary', () => {
  it('round-trips the final phase, original baseline, same session and coarse completion after the private draft is gone', () => {
    const saved = resetNavigationEntry(entry, answers, 'goalReassessment', { id:'same-session', startedAt:1000 });
    const refreshed = JSON.parse(JSON.stringify(saved));
    expect(refreshed).toMatchObject({ reset_phase:'goalReassessment', reset_session_id:'same-session', reset_started_at:1000, pathway:['factCheck'] });
    expect(refreshed.goal_baseline).toEqual(answers.goal_baseline);
    expect(resetCompletionSnapshot(refreshed.reset_completion, 'factCheck')).toEqual({event, result});
    expect(goalPointChange(refreshed.goal_baseline, 'reset', 5)).toBe(-2);
    expect(goalPointChange(refreshed.goal_baseline, 'reset', null)).toBeNull();
    expect(resetNavigationEntry(refreshed, answers, 'goalReassessment')).toEqual(saved);
  });
  it('never persists private text even inside known fields, arrays or classification counts', () => {
    const privateResult = { ...result, thought:'PRIVATE', outcome:{ ...result.outcome, thought:'PRIVATE', transcript:'PRIVATE', tensionResponse:'PRIVATE', certaintyAfter:'PRIVATE', classificationCounts:{ fact:1, feeling:'PRIVATE', PRIVATE:2 }, skippedRegions:['hands', 'PRIVATE'] }, navigateTo:'/library?thought=PRIVATE' };
    const saved = resetNavigationEntry({ ...entry, reset_completion:{ event:{...event, mechanism:'PRIVATE', note:'PRIVATE'}, result:privateResult } }, answers, 'goalReassessment');
    expect(JSON.stringify(saved)).not.toContain('PRIVATE');
    expect(saved.reset_completion.result.outcome.skippedRegions).toEqual(['hands']);
    expect(saved.reset_completion.result.outcome.classificationCounts).toEqual({fact:1});
  });
  it.each(['skipped','exited'])('preserves explicit %s and its partial completion through refresh', exitReason => {
    const snapshot = resetCompletionSnapshot({event:{...event, exitReason, completedPercentage:0.25}, result}, 'factCheck');
    expect(snapshot.event).toMatchObject({exitReason, completedPercentage:0.25});
  });
  it('does not invent helpfulness, mechanism feedback or an endpoint rating', () => {
    const { helpfulness: _ignored, ...unansweredEvent } = event;
    const snapshot = resetCompletionSnapshot({event:unansweredEvent, result:{}}, 'factCheck');
    expect(snapshot.result).toEqual({requireGoalReassessment:true});
    expect(snapshot.event.helpfulness).toBeUndefined();
  });
  it('does not reuse a completion for another practice or a fresh attempt', () => {
    expect(resetCompletionSnapshot(entry.reset_completion, 'boxV2')).toBeNull();
    expect(resetCompletionSnapshot({event:{...event,action:'started'}, result}, 'factCheck')).toBeNull();
    const saved = resetNavigationEntry(entry, answers, 'goalReassessment', {id:'old'});
    const fresh = freshResetEntry(saved, answers);
    expect(fresh.reset_completion).toBeUndefined();
    expect(fresh.reset_session_id).toBeUndefined();
    expect(fresh.reset_phase).toBe('questions');
  });
  it('keeps supported mechanism reports separate from the matched goal measure', () => {
    for (const outcome of [
      {type:'pmr', tensionResponse:'easier_to_notice', mode:'release', length:'short', stopped:true, skippedRegions:['hands']},
      {interventionId:'grounding54321V2', presence:'more_unsettled', stoppedEarly:true},
      {kind:'box_breathing', completion:'exited'},
      {category:'check', windowSeconds:30, intensityBefore:8, intensityNow:8, action:'wait', choiceOutcome:'not_yet'},
    ]) expect(coarseCompletionOutcome(outcome, outcome.interventionId || 'test')).toEqual(outcome);
  });
});

describe('attempt event boundary', () => {
  it.each(['started','progress','paused','resumed','unknown',undefined])('ignores %s without manufacturing a skipped attempt', action => {
    expect(attemptEventDisposition({...event, action})).toBe('ignore');
  });
  it('ignores incomplete event envelopes', () => {
    expect(attemptEventDisposition(null)).toBe('ignore');
    expect(attemptEventDisposition({action:'completed'})).toBe('ignore');
  });
  it('defers completed events until the optional assessment is answered or skipped', () => {
    expect(attemptEventDisposition(event)).toBe('pending');
  });
  it.each(['switched','skipped','exited'])('retains the explicit terminal %s event', action => {
    expect(attemptEventDisposition({...event,action})).toBe('record');
  });
});

describe('approved Change Scene coarse handoff', () => {
  const token = '692cd7a7-2a56-4b39-bf90-ad0179b34709';
  const outcome = {actions:{1:{choice:'alternative',status:'done'},2:{status:'skipped'}},confirmedActions:1,skippedActions:1,handoffToken:token};
  const sceneEvent = {...event, interventionId:'changeScene'};
  it.each(['happyBump','dear2100','different'])('retains %s routing only with the exact coarse outcome token', practice => {
    const navigateTo = `/scene-followup?practice=${practice}&session=${token}`;
    expect(resetCompletionSnapshot({event:sceneEvent,result:{outcome,navigateTo}}, 'changeScene').result).toEqual({requireGoalReassessment:true,outcome,navigateTo});
  });
  it('drops arbitrary query text, invalid tokens and private action descriptions', () => {
    const dirty = {...outcome, actions:{1:{choice:'alternative',status:'done',text:'PRIVATE'},PRIVATE:{choice:'primary',status:'done'}}, note:'PRIVATE'};
    expect(JSON.stringify(coarseCompletionOutcome(dirty,'changeScene'))).not.toContain('PRIVATE');
    for (const navigateTo of [`/scene-followup?practice=different&session=${token}&thought=PRIVATE`, '/scene-followup?practice=different&session=PRIVATE', `/scene-followup?practice=PRIVATE&session=${token}`]) {
      expect(resetCompletionSnapshot({event:sceneEvent,result:{outcome,navigateTo}}, 'changeScene').result.navigateTo).toBeUndefined();
    }
  });
});

it('retains Tomorrow Parking bedside identity and verified coarse save without note text', () => {
  const snapshot = resetCompletionSnapshot({event:{...event,interventionId:'tomorrowParking'},result:{interventionId:'tomorrowParking',outcome:{parked:true,durationSec:60,note:'PRIVATE'},navigateTo:'/parking-lot'}},'tomorrowParking');
  expect(snapshot.result).toEqual({requireGoalReassessment:true,interventionId:'tomorrowParking',outcome:{parked:true,durationSec:60},navigateTo:'/parking-lot'});
});


describe('iframe completion event without invented full completion', () => {
  const item = {id:'vectorShift', mechanism:'attention'};
  it('records a deliberate stop as exited with the supplied partial fraction', () => {
    const event = finalAssessmentEvent(null,item,{exitReason:'stopped',completedPercentage:0.4},2000);
    expect(event).toMatchObject({interventionId:'vectorShift',action:'completed',exitReason:'exited',completedPercentage:0.4,timestamp:2000});
    expect(finalAssessmentEvent(null,item,{exitReason:'stopped'},2000).completedPercentage).toBe(0);
  });
  it('preserves a real pending skipped event and reports only explicit helpfulness', () => {
    const pending = {...event,exitReason:'skipped',completedPercentage:0.25};
    expect(finalAssessmentEvent(pending,item,{helpfulness:'worse'})).toEqual({...pending,helpfulness:'worse'});
    expect(finalAssessmentEvent(null,item,{}).completedPercentage).toBe(1);
    expect(finalAssessmentEvent(null,null,{})).toBeNull();
  });
  it('retains only the coarse Vector gameplay report through refresh', () => {
    const outcome = {skippedStages:[2,4,4,'PRIVATE'],easierMode:true,gameplayOnly:true,scoreText:'PRIVATE'};
    expect(coarseCompletionOutcome(outcome,'vectorShift')).toEqual({skippedStages:[2,4],easierMode:true,gameplayOnly:true});
  });
});
