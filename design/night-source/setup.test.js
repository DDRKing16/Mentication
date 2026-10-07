import { describe, expect, it } from 'vitest';
import { readNightSetup, writeNightSetup, clockForSetup, nightSetupNote, NIGHT_SETUP_KEY } from './setup.js';
const source={channel:'rainy',minutes:30,seconds:1773,source:'local',kind:'preview',volume:.3,texture:.2,view:true,noteId:'synthetic-note',setupStep:'timer'};
function store(){const values=new Map();return {getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};}
describe('a paused Night setup across interruption',()=>{
  it('restores actual chosen controls and remainder with a paused clock',()=>{
    const storage=store();expect(writeNightSetup(source,storage,100)).toBe(true);
    const restored=readNightSetup(['rainy'],storage,200);expect(restored).toEqual(source);
    const clock=clockForSetup(restored);expect(clock.seconds).toBe(1773);expect(clock.deadline).toBeNull();
  });
  it('never persists a file, provider secret, song link, title or assessment',()=>{
    const storage=store();writeNightSetup({...source,file:'blob:private',accessToken:'private',link:'private',title:'private',rating:8},storage,100);
    expect(storage.getItem(NIGHT_SETUP_KEY)).not.toContain('private');expect(storage.getItem(NIGHT_SETUP_KEY)).not.toContain('rating');
  });
  it('migrates earlier setup records without losing choices or silently starting playback',()=>{
    const storage=store();const {setupStep,...legacy}=source;
    storage.setItem(NIGHT_SETUP_KEY,JSON.stringify({...legacy,version:1,expiresAt:1000}));
    const restored=readNightSetup(['rainy'],storage,200);
    expect(restored).toEqual({...source,setupStep:'source'});
    expect(clockForSetup(restored).deadline).toBeNull();
    for(const step of ['source','file','timer']) {
      writeNightSetup({...source,setupStep:step},storage,100);
      expect(readNightSetup(['rainy'],storage,200).setupStep).toBe(step);
    }
  });
  it('preserves a file requirement and provider source without inventing playback',()=>{
    const storage=store();writeNightSetup({...source,kind:'file'},storage,100);expect(readNightSetup(['rainy'],storage,200).kind).toBe('file');
    writeNightSetup({...source,source:'spotify',kind:'provider'},storage,100);expect(readNightSetup(['rainy'],storage,200).source).toBe('spotify');
    expect(clockForSetup(readNightSetup(['rainy'],storage,200)).deadline).toBeNull();
  });
  it('rejects expired, corrupt and out-of-range setup positions',()=>{
    const storage=store();writeNightSetup(source,storage,100);expect(readNightSetup(['rainy'],storage,100+24*60*60*1000)).toBeNull();
    for(const override of [{channel:'unknown'},{minutes:3},{seconds:1801},{seconds:-1},{source:'fake'},{kind:'fake'}]) {
      writeNightSetup({...source,...override},storage,100);expect(readNightSetup(['rainy'],storage,200)).toBeNull();
    }
    storage.setItem(NIGHT_SETUP_KEY,'broken');expect(readNightSetup(['rainy'],storage,200)).toBeNull();
  });
  it('reports silent and thrown setup-write failure instead of promising recovery',()=>{
    for(const setItem of [()=>{},()=>{throw new Error('Quota');}])expect(writeNightSetup(source,{setItem,getItem:()=>null},100)).toBe(false);
  });
  it('only an explicit setup confirmation can supply a reusable note, never a sleep result',()=>{
    const note=nightSetupNote({channelName:'Rainy Day',channelId:'rainy',minutes:30,source:'local',kind:'preview'});
    expect(note).toContain('Rainy Day · generated noise preview');expect(note).toContain('30 minutes');expect(note).toContain('not a sleep result');expect(nightSetupNote({minutes:3})).toBe('');
  });
  it('does not call an absent narration recording a generated preview or promise a kept file/provider grant',()=>{
    expect(nightSetupNote({channelName:'Documentary Drift',channelId:'documentary',minutes:15,source:'local',kind:'preview'})).toContain('recording not added yet');
    expect(nightSetupNote({channelName:'Rainy Day',minutes:15,source:'local',kind:'file'})).toContain('Attach the file again');
    expect(nightSetupNote({channelName:'Rainy Day',minutes:15,source:'apple',kind:'provider'})).toContain('authorize and choose a song');
  });
});
