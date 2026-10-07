import { describe,it,expect } from 'vitest';
import { groundingPosition,writeGroundingPosition } from './groundingPosition';
import { resetNavigationEntry,freshResetEntry } from './resetNavigation';
const value={sessionId:'same',step:3,elapsed:7.8,feedback:true,presence:'more_unsettled',helpfulness:'worse',words:'PRIVATE',running:true};
describe('coarse grounding return in the existing reset entry',()=>{
  it('keeps only actual stage and explicit independent feedback, never private words or running state',()=>{
    expect(groundingPosition(value,'same')).toEqual({sessionId:'same',step:3,elapsed:7,feedback:true,presence:'more_unsettled',helpfulness:'worse'});
  });
  it('does not inherit another session or an invalid stage/time',()=>{
    for(const bad of [{...value,step:6},{...value,step:-1},{...value,elapsed:Infinity},{...value,elapsed:-1}])expect(groundingPosition(bad,'same')).toBeNull();
    expect(groundingPosition(value,'new')).toBeNull();
  });
  it('keeps unknown feedback unanswered',()=>{
    expect(groundingPosition({...value,presence:'better',helpfulness:5},'same')).toMatchObject({presence:null,helpfulness:null});
  });
  it('retains history metadata and requires read-back confirmation',()=>{
    const history={state:{idx:2,key:'key',usr:{reset_session_id:'same',goal_baseline:{value:0,confirmed:true}}},replaceState(next){this.state=next}};
    expect(writeGroundingPosition(history,value,'same')).toBe(true);expect(history.state.idx).toBe(2);expect(history.state.usr.goal_baseline.value).toBe(0);
    const silent={state:{usr:{reset_session_id:'same'}},replaceState(){}};expect(writeGroundingPosition(silent,value,'same')).toBe(false);
  });
  it('reports thrown and mismatched-history failures without writing',()=>{
    expect(writeGroundingPosition({state:{usr:{reset_session_id:'same'}},replaceState(){throw new Error('blocked')}},value,'same')).toBe(false);
    expect(writeGroundingPosition({state:{usr:{reset_session_id:'other'}},replaceState(){throw new Error('must not write')}},value,'same')).toBe(false);
  });
  it('navigation sanitizes the same-session return and clears it on a genuinely new attempt',()=>{
    const entry={pathway:['grounding54321V2'],reset_session_id:'same',reset_grounding:value};
    const next=resetNavigationEntry(entry,{direction:'ground'},'guiding');expect(next.reset_grounding).toEqual(groundingPosition(value,'same'));expect(JSON.stringify(next)).not.toContain('PRIVATE');
    expect(freshResetEntry(next,{direction:'ground'}).reset_grounding).toBeUndefined();
    expect(resetNavigationEntry(entry,{direction:'ground'},'guiding',{id:'new'}).reset_grounding).toBeUndefined();
  });
});


it('retains a separate optional feedback screen without turning old feedback into an answer',()=>{
  expect(groundingPosition({...value,feedbackStep:'helpfulness',helpfulness:null},'same')).toMatchObject({feedbackStep:'helpfulness',helpfulness:null});
  expect(groundingPosition({...value,feedbackStep:'PRIVATE'},'same').feedbackStep).toBeUndefined();
});
