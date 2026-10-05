import { captureGoalBaseline } from "./goalAssessment";
import { describe, expect, it } from 'vitest';
import { WALK_MINUTES, energyOutcome, helpfulnessResponse, walkSeconds, walkElapsed, toggleWalkPause, leaveWalk, restoreBumpState, bumpRecap } from './happyBumpState';
import { withLiftCheckin } from './liftFollowup';
import { computeEffectiveness } from './interventions';

describe('Happy Bump truthful outcomes', () => {
  it.each([{}, { baseline: null, current: null }, { baseline: 3 }, { current: 5 }])('never infers change from an unanswered rating: %j', (state) => {
    expect(energyOutcome(state).shift).toBeNull();
    expect(helpfulnessResponse(state.helpfulness)).toBe('not_answered');
  });
  it.each([[3,3,0],[3,5,2],[5,3,-2]])('reports only answered energy %s → %s', (baseline,current,shift) => {
    expect(energyOutcome({baseline,current}).shift).toBe(shift);
    expect(energyOutcome({baseline,current}).scale).toBe('energy');
  });
  it('does not infer helpfulness from unchanged or increased energy', () => {
    expect(helpfulnessResponse(energyOutcome({baseline:3,current:5}).helpfulness)).toBe('not_answered');
    expect(helpfulnessResponse(energyOutcome({baseline:3,current:3,helpfulness:'helpful'}).helpfulness)).toBe('better');
  });
  it('distinguishes selected, started, completed and skipped tasks', () => {
    expect(bumpRecap({task:'A task'}).join()).not.toContain('Finished');
    for (const [taskStatus,label] of [['started','Started'],['completed','Finished'],['skipped','Skipped']]) expect(bumpRecap({task:'A task',taskStatus})).toContain(`${label}: A task`);
  });
  it('never treats selecting a route or opening an app as actual movement/contact', () => {
    expect(bumpRecap({environment:'inside',connection:'message'})).toEqual(['Opened a contact app']);
    expect(bumpRecap({environment:'inside',walkStatus:'completed',contactStatus:'attempted'})).toEqual(['Finished an indoor walk','Tried to reach someone']);
    expect(bumpRecap({contactStatus:'contacted'})).toEqual(['Reached out to someone']);
  });
  it('keeps the actual next action and comfort in the current recap', () => {
    expect(bumpRecap({nextActivity:'Read',pairing:'Tea',reward:'Rest',comfortIdea:'Soft blanket'})).toEqual(['Next: Read · with Tea · then Rest','Comfort: Soft blanket']);
  });
  it('discards legacy fabricated ratings and restores newer explicit answers', () => {
    expect(restoreBumpState({}, {baseline:3,current:5,scene:'reveal'})).toMatchObject({baseline:null,current:null,scene:'complete'});
    expect(restoreBumpState({}, {version:2,baseline:3,current:3,helpfulness:'same',scene:'mission'})).toMatchObject({baseline:3,current:3,helpfulness:'same',scene:'win'});
  });
});

describe('adjustable walk clock', () => {
  it.each(WALK_MINUTES)('caps a %s-minute walk without inferring completion', (walkMinutes) => {
    const state={walkMinutes,startedAt:1000,elapsedBeforePause:0,paused:false};
    expect(walkSeconds(state)).toBe(walkMinutes*60);
    expect(walkElapsed(state,1000000)).toBe(walkMinutes*60);
    expect(state.walkStatus).toBeUndefined();
  });
  it('excludes paused time, survives a restored pause, and stops after skipping/shortening', () => {
    const state={version:2,walkMinutes:3,startedAt:1000,elapsedBeforePause:0,paused:false};
    const paused=toggleWalkPause(state,11000);
    expect(walkElapsed(paused,50000)).toBe(10);
    const restored=restoreBumpState({},paused);
    const resumed=toggleWalkPause(restored,60000);
    expect(walkElapsed(resumed,65000)).toBe(15);
    for (const status of ['started','skipped','completed']) {
      const ended=leaveWalk(resumed,status,65000);
      expect(ended).toMatchObject({scene:'connection',walkStatus:status,startedAt:null});
      expect(walkElapsed(ended,100000)).toBe(15);
    }
  });
});

describe('explicit helpfulness learning alongside separate mood evidence', () => {
  const session=(helpfulness) => ({id:'bump-one',created_date:new Date().toISOString(),direction:'lift',intensity_start:5,goal_baseline:captureGoalBaseline('lift',5),completed_pathway:['happyBump'],attempts:[{intervention_id:'happyBump',exit_reason:'completed',completed_percentage:1,response:helpfulnessResponse(helpfulness),helpfulness_response:helpfulnessResponse(helpfulness)}]});
  it.each([['helpful','better',true],['same','same',false],['worse','worse',false]])('consumes %s even if the subsequent mood rating differs', (choice,response,positive) => {
    const updated=withLiftCheckin(session(choice),choice==='helpful'?3:8,5);
    expect(updated.attempts[0]).toMatchObject({response,helpfulness_response:response,mood_response:choice==='helpful'?'worse':'better'});
    const fit=computeEffectiveness([updated]).happyBump;
    expect(positive ? fit>0.5 : fit<0.5).toBe(true);
    // Recording the independent mood measure does not add a second sample.
    const control=session(choice);
    expect(computeEffectiveness([updated]).happyBump).toBeCloseTo(computeEffectiveness([control]).happyBump,6);
    expect(withLiftCheckin(updated,choice==='helpful'?3:8,5).attempts).toHaveLength(1);
  });
  it('leaves missing/unsure feedback unknown; measured mood can still provide one sample', () => {
    expect(computeEffectiveness([session(null)]).happyBump).toBe(0.5);
    expect(computeEffectiveness([session('unsure')]).happyBump).toBe(0.5);
    expect(withLiftCheckin(session('unsure'),7,5).attempts[0].response).toBe('better');
  });
});
