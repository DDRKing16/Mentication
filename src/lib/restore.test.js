import { describe, it, expect } from 'vitest';
import { RESTORE_ACTIVITIES, restoreActivity, readRestoreDraft, writeRestoreDraft, saveRestoreOutcome, RESTORE_DRAFT_KEY, RESTORE_HISTORY_KEY, restoreClock, readRestorePlans } from './restore';
function memory() { const entries = new Map(); return { getItem: key => entries.get(key) || null, setItem: (key,value) => entries.set(key,value), removeItem: key => entries.delete(key) }; }
describe('Restore activity registry', () => {
  it('contains exactly ten distinct functional choices and three authored stages each', () => {
    expect(RESTORE_ACTIVITIES.map(item => item.id)).toEqual(['breathing','music','body-rest','reading','meditation','nature','tea','walk','recovery-day','sleep-routine']);
    expect(new Set(RESTORE_ACTIVITIES.map(item => item.id)).size).toBe(10);
    expect(RESTORE_ACTIVITIES.every(item => item.steps.length === 3 && item.steps.every(([title,body]) => title && body.length > 70))).toBe(true);
    expect(restoreActivity('unknown')).toBeNull();
    expect(restoreActivity('music').steps[0][1]).toContain('does not play music');
    expect(restoreActivity('nature').steps[0][1]).toContain('does not stream');
  });
  it('distinguishes planning from completing an activity', () => {
    expect(RESTORE_ACTIVITIES.filter(item => item.planning).map(item => item.id)).toEqual(['recovery-day','sleep-routine']);
    expect(restoreActivity('recovery-day').steps[1][1]).toContain('does not switch Oura Rest Mode');
  });
});
describe('Restore local progress and explicit outcomes', () => {
  it('round trips resumable progress and rejects corrupt or out-of-range drafts', () => {
    const store = memory(); const draft = { id:'music',step:1,elapsed:12,target:300,plan:'',attemptId:'attempt-one' };
    expect(writeRestoreDraft(store,draft)).toBe(true); expect(readRestoreDraft(store)).toEqual(draft);
    for (const value of [{ ...draft,id:'unknown' },{ ...draft,step:3 },{ ...draft,elapsed:-1 }]) { store.setItem(RESTORE_DRAFT_KEY,JSON.stringify(value)); expect(readRestoreDraft(store)).toBeNull(); }
    store.setItem(RESTORE_DRAFT_KEY,'bad json'); expect(readRestoreDraft(store)).toBeNull();
  });
  it('records only explicit outcomes, strips unrecognised feedback and discards drafts', () => {
    const store = memory(); writeRestoreDraft(store,{ id:'reading',step:2,elapsed:9 });
    expect(saveRestoreOutcome(store,{ id:'reading',outcome:'stopped',attemptId:'attempt-one',elapsed:9,feedback:'not-a-rating',now:'2026-11-01T10:00:00Z' })).toBe(true);
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))).toEqual([{ id:'reading',outcome:'stopped',attemptId:'attempt-one',elapsed:9,feedback:null,at:'2026-11-01T10:00:00Z',plan:'' }]);
    expect(store.getItem(RESTORE_DRAFT_KEY)).toBeNull();
    saveRestoreOutcome(store,{ id:'reading',outcome:'stopped',attemptId:'attempt-one',elapsed:10,feedback:'same' });
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))).toHaveLength(1);
    expect(saveRestoreOutcome(store,{ id:'reading',outcome:'timer-ended',elapsed:9 })).toBe(false);
  });
  it('bounds history and handles denied storage without claiming success', () => {
    const store = memory(); for(let n=0;n<70;n++) saveRestoreOutcome(store,{ id:'tea',outcome:'completed',attemptId:`attempt-${n}`,elapsed:n });
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))).toHaveLength(50);
    expect(writeRestoreDraft(null,{})).toBe(false); expect(saveRestoreOutcome(null,{ id:'tea',outcome:'completed',attemptId:'attempt-one',elapsed:0 })).toBe(false);
  });
  it('keeps bounded plans on device and separate from completed breaks', () => { const store = memory(); saveRestoreOutcome(store,{ id:'recovery-day',outcome:'planned',attemptId:'attempt-plan',elapsed:0,plan:'Leave the optional errand for tomorrow' }); expect(readRestorePlans(store)).toEqual([{ id:'recovery-day',plan:'Leave the optional errand for tomorrow' }]); });
  it('formats active timer time safely', () => { expect(restoreClock(61.8)).toBe('1:01'); expect(restoreClock(-1)).toBe('0:00'); });
});
