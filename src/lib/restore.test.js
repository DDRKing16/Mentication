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
    const store = memory();
    expect(saveRestoreOutcome(store,{ id:'recovery-day',outcome:'completed',attemptId:'bad-completed',elapsed:0 })).toBe(false);
    expect(saveRestoreOutcome(store,{ id:'breathing',outcome:'planned',attemptId:'bad-planned',elapsed:0 })).toBe(false);
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
    const store = memory(); writeRestoreDraft(store,{ id:'reading',step:2,elapsed:9,attemptId:'attempt-one' });
    expect(saveRestoreOutcome(store,{ id:'reading',outcome:'stopped',attemptId:'attempt-one',elapsed:9,feedback:'not-a-rating',now:'2026-11-01T10:00:00Z' })).toBe(true);
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))).toEqual([{ id:'reading',outcome:'stopped',attemptId:'attempt-one',elapsed:9,feedback:null,at:'2026-11-01T10:00:00Z',plan:'' }]);
    expect(store.getItem(RESTORE_DRAFT_KEY)).toBeNull();
    saveRestoreOutcome(store,{ id:'reading',outcome:'stopped',attemptId:'attempt-one',elapsed:10,feedback:'same' });
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))).toHaveLength(1);
    expect(saveRestoreOutcome(store,{ id:'reading',outcome:'timer-ended',elapsed:9 })).toBe(false);
  });
  it('retains history beyond fifty records and handles denied storage without claiming success', () => {
    const store = memory(); for(let n=0;n<70;n++) saveRestoreOutcome(store,{ id:'tea',outcome:'completed',attemptId:`attempt-${n}`,elapsed:n });
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))).toHaveLength(70);
    expect(readRestoreHistory(store)).toHaveLength(70);
    expect(readRestoreOutcome(store, 'attempt-0')).not.toBeNull();
    expect(writeRestoreDraft(null,{})).toBe(false); expect(saveRestoreOutcome(null,{ id:'tea',outcome:'completed',attemptId:'attempt-one',elapsed:0 })).toBe(false);
  });
  it('keeps bounded plans on device and separate from completed breaks', () => { const store = memory(); saveRestoreOutcome(store,{ id:'recovery-day',outcome:'planned',attemptId:'attempt-plan',elapsed:0,plan:'Leave the optional errand for tomorrow' }); expect(readRestorePlans(store)).toEqual([{ id:'recovery-day',plan:'Leave the optional errand for tomorrow' }]); });
  it('preserves a different attempt draft when an older reflection is saved', () => {
    const store = memory();
    const draft = { id:'reading', step:1, elapsed:4, target:300, attemptId:'new-attempt' };
    writeRestoreDraft(store, draft);
    expect(saveRestoreOutcome(store,{ id:'breathing', outcome:'completed', elapsed:5, attemptId:'old-attempt' })).toBe(true);
    expect(readRestoreDraft(store)).toMatchObject(draft);
    writeRestoreDraft(store, { ...draft, id:'breathing' });
    saveRestoreOutcome(store,{ id:'breathing', outcome:'completed', elapsed:5, attemptId:'old-attempt' });
    expect(readRestoreDraft(store).attemptId).toBe('new-attempt');
  });
  it('records plan manageability separately from rest feedback', () => {
    const store = memory();
    saveRestoreOutcome(store,{ id:'recovery-day', outcome:'planned', attemptId:'plan-attempt', elapsed:0, feedback:'manageable' });
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))[0].feedback).toBe('manageable');
    saveRestoreOutcome(store,{ id:'sleep-routine', outcome:'planned', attemptId:'sleep-attempt', elapsed:0, feedback:'more-rested' });
    expect(JSON.parse(store.getItem(RESTORE_HISTORY_KEY))[0].feedback).toBeNull();
  });
  it('formats active timer time safely', () => { expect(restoreClock(61.8)).toBe('1:01'); expect(restoreClock(-1)).toBe('0:00'); });
});

import { readRestoreHistory, deleteRestoreOutcome, readRestoreOutcome, deleteRestoreDraft } from './restore';
describe('Restore saved history', () => {
  it('shows more than three plans and keeps stopped, planned and completed distinct', () => {
    const store = memory();
    for (let n = 0; n < 6; n++) saveRestoreOutcome(store, { id: 'recovery-day', outcome: 'planned', attemptId: `plan-test-${n}`, elapsed: n, plan: `Plan ${n}` });
    saveRestoreOutcome(store, { id: 'tea', outcome: 'completed', attemptId: 'tea-completed', elapsed: 10, feedback: 'same', now: '2026-11-08T12:00:00Z' });
    saveRestoreOutcome(store, { id: 'sleep-routine', outcome: 'stopped', attemptId: 'sleep-stopped', elapsed: 2, plan: 'An unfinished idea' });
    expect(readRestorePlans(store)).toHaveLength(6);
    expect(readRestoreHistory(store)).toHaveLength(8);
    expect(readRestoreHistory(store).map(record => record.outcome).slice(0, 2)).toEqual(['stopped', 'completed']);
    expect(readRestoreOutcome(store, 'tea-completed')).toMatchObject({ at: '2026-11-08T12:00:00Z', feedback: 'same', elapsed: 10 });
  });
  it('deletes only the specified attempt, preserving drafts and other records', () => {
    const store = memory();
    for (const attemptId of ['attempt-one', 'attempt-two']) saveRestoreOutcome(store, { id: 'tea', outcome: 'completed', attemptId, elapsed: 0 });
    writeRestoreDraft(store, { id: 'tea', step: 1, elapsed: 0, target: 300, attemptId: 'new-attempt' });
    expect(deleteRestoreOutcome(store, 'attempt-one')).toBe(true);
    expect(readRestoreHistory(store).map(record => record.attemptId)).toEqual(['attempt-two']);
    expect(readRestoreDraft(store).attemptId).toBe('new-attempt');
    expect(deleteRestoreOutcome(store, 'attempt-one')).toBe(true);
    expect(deleteRestoreOutcome(store, 'invalid')).toBe(false);
  });
  it('distinguishes an empty collection from unavailable or corrupt storage and never overwrites corrupt history', () => {
    expect(readRestoreHistory(memory())).toEqual([]);
    expect(() => readRestoreHistory(null)).toThrow();
    const store = memory();
    for (const data of ['invalid json', '{}']) {
      store.setItem(RESTORE_HISTORY_KEY, data);
      expect(() => readRestoreHistory(store)).toThrow();
      expect(deleteRestoreOutcome(store, 'attempt-one')).toBe(false);
      expect(saveRestoreOutcome(store, { id: 'tea', outcome: 'completed', attemptId: 'attempt-one', elapsed: 0 })).toBe(false);
      expect(store.getItem(RESTORE_HISTORY_KEY)).toBe(data);
    }
  });
  it('handles read and write failures without a false success', () => {
    const denied = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
    expect(() => readRestoreHistory(denied)).toThrow();
    expect(deleteRestoreOutcome(denied, 'attempt-one')).toBe(false);
    const store = memory();
    saveRestoreOutcome(store, { id: 'tea', outcome: 'completed', attemptId: 'attempt-one', elapsed: 0 });
    const full = { ...store, setItem() { throw new Error('full'); } };
    expect(deleteRestoreOutcome(full, 'attempt-one')).toBe(false);
    expect(readRestoreHistory(store)).toHaveLength(1);
  });
  it('sanitises legacy records without fabricating dates, feedback or outcomes', () => {
    const store = memory();
    store.setItem(RESTORE_HISTORY_KEY, JSON.stringify([
      null, { id: 'tea', outcome: 'planned', attemptId: 'bad-outcome', elapsed: 0 },
      { id: 'tea', outcome: 'completed', attemptId: 'valid-record', elapsed: 1, at: 'bad date', feedback: 'manageable', plan: 'not a plan' },
    ]));
    expect(readRestoreHistory(store)).toEqual([{ id: 'tea', outcome: 'completed', attemptId: 'valid-record', elapsed: 1, at: null, feedback: null, plan: '' }]);
  });
  it('retains successful history writes when draft removal fails', () => {
    const store = memory();
    writeRestoreDraft(store, { id: 'tea', step: 1, elapsed: 0, target: 300, attemptId: 'attempt-one' });
    expect(saveRestoreOutcome({ ...store, removeItem() { throw new Error('denied'); } }, { id: 'tea', outcome: 'completed', attemptId: 'attempt-one', elapsed: 0 })).toBe(true);
    expect(readRestoreHistory(store)).toHaveLength(1);
  });
});

describe('Restore verified persistence', () => {
  const outcome = { id: 'tea', outcome: 'completed', attemptId: 'attempt-one', elapsed: 0 };
  const draft = { id: 'tea', step: 1, elapsed: 0, target: 300, attemptId: 'attempt-one', plan: '' };
  it('rejects silent no-op draft and outcome writes without discarding progress', () => {
    const store = memory();
    writeRestoreDraft(store, draft);
    const silent = { ...store, setItem() {} };
    expect(writeRestoreDraft(silent, { ...draft, elapsed: 3 })).toBe(false);
    expect(saveRestoreOutcome(silent, outcome)).toBe(false);
    expect(readRestoreDraft(store)).toEqual(draft);
    expect(readRestoreHistory(store)).toEqual([]);
  });
  it('rejects silent no-op outcome deletion and keeps the saved record', () => {
    const store = memory();
    saveRestoreOutcome(store, outcome);
    expect(deleteRestoreOutcome({ ...store, setItem() {} }, 'attempt-one')).toBe(false);
    expect(readRestoreHistory(store)).toHaveLength(1);
  });
  it('verifies draft removal and rejects silent no-op or denied removal', () => {
    const store = memory();
    writeRestoreDraft(store, draft);
    expect(deleteRestoreDraft({ ...store, removeItem() {} })).toBe(false);
    expect(readRestoreDraft(store)).toEqual(draft);
    expect(deleteRestoreDraft(null)).toBe(false);
    expect(deleteRestoreDraft(store)).toBe(true);
    expect(readRestoreDraft(store)).toBeNull();
  });
  it('does not claim success when a write cannot be read back', () => {
    const store = memory();
    let written = false;
    const unreadable = { ...store, setItem(key, value) { store.setItem(key, value); written = true; }, getItem(key) { if (written) throw new Error('read denied'); return store.getItem(key); } };
    expect(saveRestoreOutcome(unreadable, outcome)).toBe(false);
    expect(readRestoreHistory(store)).toHaveLength(1);
  });
  it('keeps a confirmed outcome even if draft removal silently fails', () => {
    const store = memory();
    writeRestoreDraft(store, draft);
    expect(saveRestoreOutcome({ ...store, removeItem() {} }, outcome)).toBe(true);
    expect(readRestoreHistory(store)).toHaveLength(1);
    expect(readRestoreDraft(store)).toEqual(draft);
  });
});
