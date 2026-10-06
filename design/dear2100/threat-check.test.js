import { describe, expect, it } from 'vitest';
import { THREAT_QUESTIONS, scoreThreatCheck, threatCheckPassed, requiredThreatStep, requiredThreatView, emptyThreatCheck } from './threat-check';
const correct = THREAT_QUESTIONS.map(q=>q.correct);
const book = check => ({step:8,answers:{want:'Learn music'},threatCheck:check});
describe('Dear 2100 required understanding check',()=>{
 it('contains exactly four questions with one valid answer each',()=>{
  expect(THREAT_QUESTIONS).toHaveLength(4);
  for(const q of THREAT_QUESTIONS) { expect(q.options).toHaveLength(4); expect(new Set(q.options).size).toBe(4); expect(q.correct).toBeGreaterThanOrEqual(0); expect(q.correct).toBeLessThan(4); expect(q.explanation).toBeTruthy(); }
 });
 it('requires all four answered before scoring, including malformed saved data',()=>{
  for(const answers of [[null,...correct.slice(1)],correct.slice(1),[-1,0,3,1],[2,0,3,4],['2',0,3,1]]) {
   expect(scoreThreatCheck({answers})).toBeNull(); expect(threatCheckPassed(book({answers,submitted:true}))).toBe(false);
  }
 });
 it('requires explicit submission, passes 3/4 and 4/4, rejects 2/4 and below',()=>{
  for(let mistakes=0;mistakes<=4;mistakes++) {
   const answers=correct.map((value,index)=>index<mistakes?(value+1)%4:value);
   expect(scoreThreatCheck({answers})).toBe(4-mistakes);
   expect(threatCheckPassed(book({answers,submitted:false}))).toBe(false);
   expect(threatCheckPassed(book({answers,submitted:true}))).toBe(mistakes<=1);
  }
 });
 it('retry clears answers and cannot retain a prior pass',()=>{
  const retry=emptyThreatCheck();expect(scoreThreatCheck(retry)).toBeNull();expect(threatCheckPassed(book(retry))).toBe(false);
 });
 it.each(['fear','practical','both'])('gates downstream navigation for %s without deleting valid progress',barrierFocus=>{
  const prior={...book(null),furthestStep:9,answers:{want:'Music',barrierFocus,practicalSupport:'Ask for help'}};
  for(let step=0;step<=9;step++)expect(requiredThreatStep(prior,step)).toBe(step>3?3:step);
  for(const view of ['home','cover','book','closing'])expect(requiredThreatView(prior,view)).toBe(view);
  expect(requiredThreatView(prior,'plan')).toBe('journey');expect(requiredThreatView(prior,'journey')).toBe('journey');expect(prior.furthestStep).toBe(9);expect(prior.answers.practicalSupport).toBe('Ask for help');
  const passed={...prior,threatCheck:{answers:correct,submitted:true}};expect(requiredThreatStep(passed,9)).toBe(9);expect(requiredThreatView(passed,'plan')).toBe('plan');
 });
});
