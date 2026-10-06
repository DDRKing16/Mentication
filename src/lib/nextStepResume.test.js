import { afterEach, describe, expect, it, vi } from 'vitest';
import { advanceNextStep, freshNextStep, nextStepAttempt, resumeNextStep, restoreNextStep, undoNextStep } from './nextStepState';
const step = (id,status=null) => ({id,title:`Synthetic action ${id}`,micro:'One real action.',easier:['A smaller action'],status});
const saved = () => ({...freshNextStep(),screen:'dashboard',submitted:true,task:'Synthetic task',ladder:[step('1','done'),step('2','skipped'),step('3'),step('4')],currentStepIndex:2,gettingStarted:'easier',helpfulness:'helpful',startedAt:100});
afterEach(()=>vi.unstubAllGlobals());
describe('return to actual unfinished task steps',()=>{
  it('keeps checkmarks and starts a fresh visit without reusing earlier answers/time',()=>{
    const prior=saved(),next=resumeNextStep(prior,5000);
    expect(next).toMatchObject({screen:'focus',currentStepIndex:2,attemptStartIndex:2,submitted:false,gettingStarted:null,helpfulness:null,startedAt:5000});
    expect(next.ladder).toEqual(prior.ladder);
    expect(nextStepAttempt(next)).toEqual({done:0,skipped:0,total:2});
  });
  it('counts only this visit, never turning earlier work into new credit',()=>{
    const first=advanceNextStep(resumeNextStep(saved()),'done');
    expect(nextStepAttempt(first)).toEqual({done:1,skipped:0,total:2});
    const second=advanceNextStep(first,'skipped');
    expect(nextStepAttempt(second)).toEqual({done:1,skipped:1,total:2});
    expect(second.ladder.filter(s=>s.status==='done')).toHaveLength(2);
    expect(second.screen).toBe('dashboard');
  });
  it('resumes before submission within the same visit with actual answers intact',()=>{
    const prior={...saved(),submitted:false},next=resumeNextStep(prior,5000);
    expect(next).toMatchObject({currentStepIndex:2,attemptStartIndex:0,startedAt:100,gettingStarted:'easier',helpfulness:'helpful'});
    expect(nextStepAttempt(next)).toEqual({done:1,skipped:1,total:4});
  });
  it('does not undo an earlier finished visit or mark a submitted step done',()=>{
    const resumed=resumeNextStep(saved());
    expect(undoNextStep(resumed)).toBe(resumed);
    expect(undoNextStep(advanceNextStep(resumed,'done')).currentStepIndex).toBe(2);
    const submitted={...resumed,submitted:true};
    expect(advanceNextStep(submitted,'done')).toBe(submitted);
  });
  it('does not invent a next step once all steps are marked or skipped',()=>{
    const complete={...saved(),ladder:[step('1','done'),step('2','skipped')]};
    expect(resumeNextStep(complete)).toBe(complete);
  });
  it('restores the visit boundary across interruption without trusting malformed counters',()=>{
    const stored={...resumeNextStep(saved(),5000),currentStepIndex:999,winsToday:999};
    vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(stored)});
    const restored=restoreNextStep().state;
    expect(restored).toMatchObject({screen:'landing',currentStepIndex:2,attemptStartIndex:2,winsToday:1,startedAt:5000});
    expect(nextStepAttempt(restored)).toEqual({done:0,skipped:0,total:2});
    vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify({...stored,attemptStartIndex:99})});
    expect(restoreNextStep().state.attemptStartIndex).toBe(0);
  });
});
