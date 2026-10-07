import { afterEach, describe, expect, it, vi } from 'vitest';
import { readTappingDraft, writeTappingDraft, TAPPING_DRAFT_KEY } from './tappingDraft';
const legacy = { version:1,stage:'round',concern:'grounding',before:0,after:null,index:3,second:7,duration:43,slow:true,rounds:0,stopped:false,skipped:0,roundSkipped:false };
function storage(value) { let raw=JSON.stringify(value);vi.stubGlobal('localStorage',{getItem:key=>key===TAPPING_DRAFT_KEY?raw:null,setItem:(_key,value)=>{raw=value;}});return()=>raw; }
afterEach(()=>vi.unstubAllGlobals());
describe('tapping question and optional-cue draft compatibility',()=>{
  it('restores a narrated setup beyond the old 30-second boundary and explicit audio choices',()=>{const current={...legacy,index:0,second:34,voiceOn:true,musicOn:false,beatOn:true,muted:true};storage(current);expect(readTappingDraft()).toEqual(current);});
  it.each(['voiceOn','musicOn','beatOn','muted'])('protects malformed %s preferences from overwrite',field=>{const get=storage({...legacy,[field]:'on'});const original=get();expect(()=>readTappingDraft()).toThrow('Unreadable');expect(get()).toBe(original);});
  it('retains an older interrupted round and genuine zero without new fields',()=>{storage(legacy);expect(readTappingDraft()).toEqual(legacy);});
  it.each(['next','note'])('restores the optional %s page with draft text and the genuine note identity',stage=>{const draft={...legacy,stage,takeawayText:'A still guide.\nMy own cue.',takeawayId:'reset:session-1700000000000:eftTapping'};storage(draft);expect(readTappingDraft()).toEqual(draft);});
  it('keeps an unsaved note only in the tapping draft',()=>{const get=storage(null);writeTappingDraft({...legacy,stage:'note',takeawayText:'My unsaved cue',takeawayId:null});expect(JSON.parse(get()).takeawayText).toBe('My unsaved cue');expect(readTappingDraft().after).toBeNull();});
  it.each([{takeawayText:'x'.repeat(1501)},{takeawayText:{}},{takeawayId:{}},{takeawayId:'x'.repeat(161)}])('rejects malformed new fields without overwriting the draft: %j',fields=>{const get=storage({...legacy,...fields});const original=get();expect(()=>readTappingDraft()).toThrow('Unreadable');expect(get()).toBe(original);});
});
