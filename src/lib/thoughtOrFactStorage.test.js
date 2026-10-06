import { afterEach, describe, expect, it, vi } from 'vitest';
import { readThoughtRecords, saveThoughtRecord, deleteThoughtRecord, thoughtReflectionContent, isCurrentThoughtReflection, THOUGHT_RECORD_KEY } from './thoughtOrFactStorage';
import { normaliseThoughtOrFactDraft } from './thoughtOrFactState';
import { saveActiveFlagship } from './flagshipMemory';
function storage(initial='[]') {
  const values = new Map([[THOUGHT_RECORD_KEY,initial]]);
  return {getItem:key=>values.get(key) ?? null,setItem:(key,value)=>values.set(key,value)};
}
const data = {thought:'Synthetic thought',balancedConfirmed:true,fairerView:{adaptive:'Synthetic perspective'},returnPhrase:'Synthetic cue',certaintyBefore:0,certaintyAfter:null,support:['Synthetic supporting detail'],evidenceAgainst:['Synthetic unknown']};
afterEach(()=>vi.unstubAllGlobals());
describe('faithful optional Thought or Fact reflections',()=>{
  it('rejects silent and thrown saves, retaining the previous archive',()=>{
    for (const setItem of [()=>{},()=>{throw new Error('Quota');}]) {
      const store=storage('[{"id":"prior","thought":"Keep this"}]');store.setItem=setItem;
      expect(()=>saveThoughtRecord({id:'current',...thoughtReflectionContent(data)},store)).toThrow();
      expect(readThoughtRecords(store)).toEqual([{id:'prior',thought:'Keep this'}]);
    }
  });
  it('never overwrites an unreadable or invalid existing archive',()=>{
    for(const prior of ['broken','{}','[null]','[{"thought":"No identity"}]']) {
      const store=storage(prior);
      expect(()=>saveThoughtRecord({id:'current'},store)).toThrow();
      expect(store.getItem(THOUGHT_RECORD_KEY)).toBe(prior);
    }
  });
  it('updates the same reflection and keeps every other valid legacy record',()=>{
    const old=Array.from({length:40},(_,i)=>({id:`legacy-${i}`,extra:'Legacy metadata'})),store=storage(JSON.stringify(old));
    saveThoughtRecord({id:'current',createdAt:'original date',...thoughtReflectionContent(data)},store);
    saveThoughtRecord({id:'current',createdAt:'original date',...thoughtReflectionContent({...data,returnPhrase:'Edited cue'})},store);
    const records=readThoughtRecords(store);
    expect(records).toHaveLength(41);expect(records[0]).toMatchObject({id:'current',createdAt:'original date',returnPhrase:'Edited cue'});expect(records.slice(1)).toEqual(old);
  });
  it('retains actual evidence and unanswered ratings when the review is left unresolved',()=>{
    const content=thoughtReflectionContent({...data,balancedConfirmed:false});
    expect(content).toMatchObject({ruling:'Left unresolved',fairerView:null,balancedConfirmed:false,certaintyBefore:0,certaintyAfter:null,support:data.support,evidenceAgainst:data.evidenceAgainst});
    expect(JSON.stringify(content)).not.toContain('Synthetic perspective');
  });
  it('claims the current reflection is saved only when the actual saved words and answers match',()=>{
    const record={id:'current',...thoughtReflectionContent(data)};
    expect(isCurrentThoughtReflection(record,data)).toBe(true);
    expect(isCurrentThoughtReflection(record,{...data,returnPhrase:'Unsaved edit'})).toBe(false);
    expect(isCurrentThoughtReflection(record,{...data,certaintyAfter:0})).toBe(false);
    expect(isCurrentThoughtReflection(null,data)).toBe(false);
  });
  it('verifies deletion and preserves other records',()=>{
    const store=storage('[{"id":"current"},{"id":"keep"}]'),write=store.setItem;store.setItem=()=>{};
    expect(()=>deleteThoughtRecord('current',store)).toThrow();expect(readThoughtRecords(store)).toHaveLength(2);
    store.setItem=write;deleteThoughtRecord('current',store);expect(readThoughtRecords(store)).toEqual([{id:'keep'}]);
  });
  it('restores unfinished evidence exactly without promoting it into reviewed evidence',()=>{
    const drafts={support:'  Synthetic unfinished detail\nsecond line',against:'Synthetic unfinished unknown'};
    const restored=normaliseThoughtOrFactDraft({evidenceDrafts:drafts});
    expect(restored.evidenceDrafts).toEqual(drafts);expect(restored.support).toEqual([]);expect(restored.evidenceAgainst).toEqual([]);
    expect(normaliseThoughtOrFactDraft({evidenceDrafts:{support:1}}).evidenceDrafts).toEqual({support:'',against:''});
  });
  it('returns a truthful active-draft result after verification rather than ignoring storage failures',()=>{
    const store=storage();vi.stubGlobal('localStorage',store);
    expect(saveActiveFlagship({interventionId:'factCheck',data:{evidenceDrafts:{support:'Synthetic'}}})).toBe(true);
    store.setItem=()=>{};
    expect(saveActiveFlagship({interventionId:'factCheck',data:{evidenceDrafts:{support:'Unsaved'}}})).toBe(false);
  });
});
