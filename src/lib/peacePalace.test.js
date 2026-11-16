import { afterEach, describe, expect, it, vi } from 'vitest';
import { sessionStore } from './localData';
import { derivePeacePalace } from './peacePalace';
import { dailyPractices, olderPalaceHistory, practice, HISTORY_NOW } from '../../scripts/fixtures/lifetime-history.mjs';

function seed(records) {
  const encoded=JSON.stringify(records), getItem=vi.fn(()=>encoded), setItem=vi.fn();
  vi.stubGlobal('window',{localStorage:{getItem,setItem}});
  return {getItem,setItem,encoded};
}
afterEach(()=>vi.unstubAllGlobals());
describe('lifetime palace from retained history',()=>{
  it('reproduces capped undercounts but includes every retained completion and builder',async()=>{
    const records=dailyPractices(501,1), storage=seed(records);
    expect(derivePeacePalace(await sessionStore.list('-created_date',500))).toMatchObject({growth:1000,completedCount:500});
    const palace=derivePeacePalace(await sessionStore.listAll());
    expect(palace).toMatchObject({growth:1002,completedCount:501,sessionCount:501,level:6,stonesToNext:0});
    expect(palace.builders.find(b=>b.id==='box').count).toBe(501);
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem()).toBe(storage.encoded);
  });
  it('does not regress when newer non-contributing records displace old completions',async()=>{
    const records=olderPalaceHistory();seed(records);
    expect(derivePeacePalace(await sessionStore.list('-created_date',500)).level).toBe(0);
    const before=derivePeacePalace(await sessionStore.listAll());
    expect(before).toMatchObject({growth:56,level:6,completedCount:28,sessionCount:28});
    seed([practice('another-empty',HISTORY_NOW,false),...records]);
    expect(derivePeacePalace(await sessionStore.listAll())).toEqual(before);
  });
  it('keeps scoring unchanged: deduplicate completed IDs per session and credit unfinished visits once',()=>{
    const complete=practice('complete',HISTORY_NOW);
    complete.attempts.push({...complete.attempts[0]});
    const partial={id:'partial',attempts:[{intervention_id:'box',exit_reason:'stopped'}]};
    expect(derivePeacePalace([complete,partial])).toMatchObject({growth:3,completedCount:1,sessionCount:2,level:0,stonesToNext:1});
  });
  it('rejects read failure instead of manufacturing an empty palace or overwriting history',async()=>{
    const setItem=vi.fn();vi.stubGlobal('window',{localStorage:{getItem:()=>{throw Error('blocked');},setItem}});
    await expect(sessionStore.listAll()).rejects.toThrow('blocked');expect(setItem).not.toHaveBeenCalled();
  });
});
