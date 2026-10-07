import { describe, expect, it } from 'vitest';
import { atScreen, previousScreen, resumeFromEntry, screenFor } from './getThroughFlow';
import { newTaraState, taraCompletion, validateTaraState } from './taraTacticianState';
import { answerCheckIn, checkInDue, keepSupportField, readSupportPlan, readTaraCheckIns, startCheckIns } from './taraSupportPlan';
import { loadTara, saveTaraDraft } from './taraTacticianStorage';
import { checkpointFor, practiceEvent } from './practiceCheckpoints';

describe('a chosen support plan, without inferred actions', () => {
  it('starts empty, migrates older drafts and never inserts an assumed situation', () => {
    const old = newTaraState(); delete old.supportPlan; delete old.checkIns;
    const loaded = validateTaraState(old);
    expect(loaded.supportPlan).toEqual(newTaraState().supportPlan);
    expect(loaded.checkIns.preference).toBe('off');
    expect(loaded.situation).toBe('');
  });
  it('confirms only kept wording; skipping and editing do not earn extra progress', () => {
    let state = keepSupportField(newTaraState(), 'pause', 'Pause in place.');
    const events = value => value.supportPlan.confirmed.map(field => practiceEvent(field, field, value.supportPlan[field]));
    expect(checkpointFor(events(state)).pairs).toBe(0);
    state = keepSupportField(state, 'regulation', 'Notice one colour.');
    expect(checkpointFor(events(state))).toMatchObject({ count: 2, pairs: 1 });
    state = keepSupportField(state, 'pause', 'Ask for a moment.');
    expect(checkpointFor(events(state))).toMatchObject({ count: 2, pairs: 1 });
    expect(keepSupportField(state, 'help', '').supportPlan.confirmed).toHaveLength(2);
  });
  it.each(['plan-pause', 'plan-regulation', 'plan-affirmation', 'plan-leave', 'plan-help', 'plan-check-ins', 'check-in-duration', 'take-break', 'regulate', 'leave-support', 'help-support', 'affirmation-support', 'check-in'])('saves and refreshes %s with authored words intact', screen => {
    const data = new Map(); const storage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
    const state = atScreen(keepSupportField(newTaraState(), 'leave', 'If leaving is unsafe, pause where I am and seek help.'), screen);
    saveTaraDraft(state, storage);
    expect(loadTara(storage).draft).toEqual(state);
    expect(screenFor(previousScreen(state))).not.toBe(screen);
    expect(state.eventStatus).toBe('not-started');
    expect(state.actualActionConfirmed).toBe(false);
  });
  it('resumes actual live use after Back to entry ahead of an earlier ready plan', () => {
    const state = { ...newTaraState(), eventStatus: 'in-progress', practice: { ...newTaraState().practice, step: 'ready' } };
    expect(screenFor(resumeFromEntry(state))).toBe('live');
  });
  it('bounds private text and allowlists check-in preferences', () => {
    expect(readSupportPlan({ leave: 'x'.repeat(4000), confirmed: ['leave', 'future'], help: 4 }).leave).toHaveLength(3000);
    expect(readSupportPlan({ leave: ' ', confirmed: ['leave'] }).confirmed).toEqual([]);
    expect(readTaraCheckIns({ preference: 'sms', intervalMinutes: 1, durationMinutes: 900, nextAt: -1, status: 'delivered' })).toMatchObject({ preference: 'off', intervalMinutes: 20, durationMinutes: 60, nextAt: 0, status: 'off' });
  });
  it('excludes support words, check-ins and assistance choices from the host outcome', () => {
    const state = keepSupportField(newTaraState(), 'help', 'Private person and request.');
    expect(JSON.stringify(taraCompletion(state))).not.toContain('Private');
    expect(taraCompletion(state)).not.toHaveProperty('supportPlan');
    expect(taraCompletion(state)).not.toHaveProperty('checkIns');
  });
});
describe('foreground check-ins use elapsed time and never infer a benefit', () => {
  const now = 1800000000000;
  it('does not start from a choice or from an off preference', () => {
    expect(checkInDue({ ...newTaraState().checkIns, preference: 'in-app' }, now)).toBe(false);
    expect(startCheckIns(newTaraState().checkIns, now).startedAt).toBe(0);
  });
  it('offers one overdue check-in on return and advances to the next planned slot', () => {
    const active = startCheckIns({ ...newTaraState().checkIns, preference: 'in-app', intervalMinutes: 10 }, now);
    expect(checkInDue(active, now + 9 * 60000)).toBe(false);
    expect(checkInDue(active, now + 35 * 60000)).toBe(true);
    const answer = answerCheckIn(active, 'break', now + 35 * 60000);
    expect(answer.nextAt).toBe(now + 40 * 60000);
    expect(answer.lastAnswer).toBe('break');
    expect(checkInDue(answer, now + 35 * 60000)).toBe(false);
  });
  it('expires, ends explicitly and keeps denied notifications usable in app', () => {
    const active = startCheckIns({ ...newTaraState().checkIns, preference: 'device' }, now);
    expect(checkInDue({ ...active, status: 'denied' }, now + 20 * 60000)).toBe(true);
    expect(checkInDue(active, now + 61 * 60000)).toBe(false);
    expect(checkInDue({ ...active, status: 'ended' }, now + 20 * 60000)).toBe(false);
    expect(answerCheckIn(active, 'okay', now + 60 * 60000).nextAt).toBe(0);
  });
});
