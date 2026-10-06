import { afterEach, describe, expect, it, vi } from 'vitest';
import { CARE_PRACTICES, careClick, careOutcome, freshCareState, restoreCareState } from './carePractices';
import { careMilestone, compassionateSuggestions, noticingPhrase, makeRoomPhrase } from './carePracticeDesign';
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
    s = careClick({ ...s, stage: 'practice', notice: 'Synthetic private line' }, id); expect(s.milestone).toBe(previous);
    s = careClick(s, id); expect(s.milestone).toContain('Synthetic private line');
    expect(s.actionStatus).toBeNull();
  });
  it('resumes a private interrupted draft through host storage and clears it on finish', () => {
    storage();
    const s = { ...freshCareState(), stage: 'practice', notice: 'Synthetic private note', before: 0, anchorType: 'object', anchorText: 'Blue mug', anchorNoticed: true, distance: 'beside', defusionStep: 2, allowance: 'small', attentionFocused: true, responseRead: true };
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

describe('Experiential care state and compatibility', () => {
  it('restores old cards and drafts without erasing words or inventing interactions', () => {
    const old = {version:1,stage:'practice',before:7,after:null,notice:'An old note',perspective:'My saved response',action:'My saved step',clicks:6,practiceTaken:true,actionStatus:'planned'};
    const restored = restoreCareState(old);
    expect(restored).toMatchObject(old);
    expect(restored).toMatchObject({distance:'near',defusionStep:0,anchorNoticed:false,allowance:null,responseRead:false});
    const local=storage();
    local.setItem(CARE_SAVED_KEY,JSON.stringify({selfCompassion:old}));
    expect(readCareSaved('selfCompassion').perspective).toBe('My saved response');
    expect(writeCareSaved('unhook',freshCareState())).toBe(true);
    expect(readCareSaved('selfCompassion').action).toBe('My saved step');
  });
  it('defusion retains the exact thought without debating or rewriting it', () => {
    expect(noticingPhrase('They will judge me.')).toContain('“They will judge me.”');
    expect(noticingPhrase('')).not.toContain('wrong');
    const phrase=noticingPhrase('x'.repeat(300));
    expect(phrase.length).toBeLessThanOrEqual(300);
    expect(phrase.endsWith('…”')).toBe(true);
    expect(makeRoomPhrase('Worry')).toContain('worry');
    expect(makeRoomPhrase('x'.repeat(300))).toContain('choose a useful step.');
    expect(makeRoomPhrase('x'.repeat(300)).length).toBeLessThanOrEqual(300);
  });
  it('compassion starters respond to the selected line and remain editable suggestions', () => {
    expect(compassionateSuggestions('I messed everything up.')[0]).toContain('repair');
    expect(compassionateSuggestions('I should be doing more.')[0]).toContain('capacity');
    expect(compassionateSuggestions('An unrelated private line')[0]).not.toContain('mistake');
  });
  it('milestones reflect chosen input and distinguish planned from completed actions', () => {
    const s={...freshCareState(),action:'Open the blue document',actionStatus:'planned',notice:'Worry',allowance:'small'};
    expect(careMilestone('unhook',s)).toContain('a plan');
    expect(careMilestone('unhook',{...s,actionStatus:'done'})).toContain('marked your step as done');
    expect(careMilestone('makeRoom',{...s,action:'',actionStatus:null})).toContain('Worry');
    expect(careOutcome('makeRoom',s).change).toBeNull();
  });
  it('corrupt saved data is preserved on attempted save or delete', () => {
    const local=storage();local.setItem(CARE_SAVED_KEY,'{broken');
    expect(writeCareSaved('makeRoom',freshCareState())).toBe(false);
    expect(deleteCareSaved('makeRoom')).toBe(false);
    expect(local.getItem(CARE_SAVED_KEY)).toBe('{broken');
  });
  it('does not claim deletion if verifying the saved store fails', () => {
    const local=storage();writeCareSaved('unhook',freshCareState());
    const read=local.getItem;let reads=0;
    local.getItem=key=>{if(key===CARE_SAVED_KEY && ++reads>1)throw Error('blocked verification');return read(key);};
    expect(deleteCareSaved('unhook')).toBe(false);
  });
  it('expires interrupted drafts through the existing host TTL', () => {
    const local=storage();writeCareDraft('makeRoom',freshCareState());
    const active=JSON.parse(local.getItem('mentation.flagship.active.v1'));
    local.setItem('mentation.flagship.active.v1',JSON.stringify({...active,expiresAt:Date.now()-1}));
    expect(readCareDraft('makeRoom')).toBeNull();
  });
});
