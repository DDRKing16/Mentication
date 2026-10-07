import { describe, it, expect } from 'vitest';
import { boxPosition, writeBoxPosition } from './boxPosition';
import { createBoxBreathingClock } from './boxBreathingClock';
import { resetNavigationEntry, freshResetEntry } from './resetNavigation';
const value={sessionId:'same',step:1,elapsed:12,clockElapsed:12345,helpfulness:'worse',note:'PRIVATE',running:true};
describe('Box Breathing paused return',()=>{
  it('retains active elapsed time while excluding private words and playback state',()=>{
    const clean=boxPosition(value,'same');expect(clean.clockElapsed).toBe(12345);expect(clean.helpfulness).toBe('worse');expect(JSON.stringify(clean)).not.toMatch(/PRIVATE|running/);
    const clock=createBoxBreathingClock(4,clean.clockElapsed);expect(clock.tick(900000,false).elapsed).toBe(12345);expect(clock.tick(900001,true).elapsed).toBe(12345);expect(clock.tick(900101,true).elapsed).toBe(12445);
  });
  it('keeps a same-session place through coarse routing and clears it for a new attempt',()=>{
    const entry={prebuilt:true,pathway:['boxV2'],reset_session_id:'same',reset_box:value};
    const resume=resetNavigationEntry(entry,{direction:'calm'},'guiding');expect(resume.reset_box).toEqual(boxPosition(value,'same'));
    expect(freshResetEntry(resume,{direction:'calm'}).reset_box).toBeUndefined();expect(boxPosition(value,'other')).toBeNull();
  });
  it('reports storage failures and does not invent successful resume',()=>{
    const history={state:{idx:3,usr:{reset_session_id:'same'}},replaceState(){}};expect(writeBoxPosition(history,value,'same')).toBe(false);
    history.replaceState=function(next){this.state=next;};expect(writeBoxPosition(history,value,'same')).toBe(true);expect(history.state.idx).toBe(3);
  });
});
