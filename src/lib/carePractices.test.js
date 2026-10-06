import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARE_PRACTICES, careClick, careOutcome, freshCareState, restoreCareState } from './carePractices';
import { CARE_SAVED_KEY, deleteCareDraft, deleteCareSaved, readCareDraft, readCareSaved, writeCareDraft, writeCareSaved } from './carePracticeStorage';
function storage() {
  const data = new Map();
  const local = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  vi.stubGlobal('localStorage', local);
  return local;
}
afterEach(() => vi.unstubAllGlobals());
describe.each(Object.keys(CARE_PRACTICES))('%s practice', id => {
  it('keeps blank ratings blank, preserves zero, and compares identical anchors', () => {
    const s = freshCareState();
    expect(careOutcome(id, s).change).toBeNull();
    const outcome = careOutcome(id, { ...s, before: 0, after: 7 });
    expect(outcome.change).toBe(7);
    expect(outcome.assessment.question).toBe(CARE_PRACTICES[id].question);
    expect(restoreCareState({ ...s, before: '', after: 40 })).toMatchObject({ before: null, after: null });
  });
  it('reveals only on pairs of activations and never grants action credit', () => {
    let s = freshCareState();
    s = careClick(s, id); expect(s.milestone).toBe('');
    s = careClick(s, id); expect(s.milestone).not.toBe('');
    const previous = s.milestone;
    s = careClick({ ...s, stage: 'practice' }, id); expect(s.milestone).toBe(previous);
    s = careClick(s, id); expect(s.milestone).toBe(CARE_PRACTICES[id].reveals[1]);
    expect(s.actionStatus).toBeNull();
  });
  it('resumes a private interrupted draft through host storage and clears it on finish', () => {
    storage();
    const s = { ...freshCareState(), stage: 'practice', notice: 'Synthetic private note', before: 0 };
    expect(writeCareDraft(id, s)).toBe(true);
    expect(readCareDraft(id)).toEqual(s);
    expect(readCareDraft('another-id')).toBeNull();
    expect(deleteCareDraft(id)).toBe(true);
    expect(readCareDraft(id)).toBeNull();
  });
  it('saves and deletes separate return cards without deleting other practices', () => {
    storage();
    const s = { ...freshCareState(), stage: 'complete', after: 0, actionStatus: 'planned' };
    writeCareSaved('other', freshCareState());
    expect(writeCareSaved(id, s)).toBe(true);
    expect(readCareSaved(id)).toEqual(s);
    expect(deleteCareSaved(id)).toBe(true);
    expect(readCareSaved('other')).not.toBeNull();
  });
  it('reports write/delete failures instead of claiming persistence', () => {
    const local = storage();
    writeCareSaved(id, freshCareState()); writeCareDraft(id, freshCareState());
    local.setItem = () => { throw new Error('quota'); };
    local.removeItem = () => { throw new Error('blocked'); };
    expect(writeCareSaved(id, freshCareState())).toBe(false);
    expect(deleteCareSaved(id)).toBe(false);
    expect(writeCareDraft(id, { ...freshCareState(), stage: 'notice' })).toBe(false);
    expect(deleteCareDraft(id)).toBe(false);
    local.getItem = () => { throw new Error('blocked reads'); };
    expect(deleteCareDraft(id)).toBe(false);
  });
  it('handles malformed saved content without executing or trusting it', () => {
    const local = storage(); local.setItem(CARE_SAVED_KEY, '{broken');
    expect(readCareSaved(id)).toBeNull();
    expect(restoreCareState({ version: 1, stage: 'unknown', clicks: -9, before: '0', practiceTaken: 'true' })).toMatchObject({ stage: 'arrival', clicks: 0, before: null, practiceTaken: false });
  });
});
