import { afterEach,describe,expect,it,vi } from 'vitest';
import { createTappingAudio } from './tappingAudio';

function fixture({outputClock=false,resolveNarration=key=>({url:'/audio/narration/'+key+'.mp3'})}={}){
 const contexts=[],sources=[],events=[],fetchAudio=vi.fn();
 const audioBuffer=(length,sampleRate=1000)=>{const data=new Float32Array(length);return{length,sampleRate,numberOfChannels:1,duration:length/sampleRate,getChannelData:()=>data};};
 const gain=()=>({gain:{value:0,cancelScheduledValues:vi.fn(),setTargetAtTime:vi.fn()},connect:vi.fn()});
 let wallTime=null,outputLag=0;
 const now=()=>wallTime??(contexts[0]?.currentTime-10||0)*1000;
 class Audio {state='suspended';currentTime=10;destination={};listeners={};gains=[];
  constructor(){contexts.push(this);}
  getOutputTimestamp=outputClock?()=>({contextTime:this.currentTime-outputLag,performanceTime:now()}):undefined;
  resume=vi.fn(async()=>{this.state='running';});close=vi.fn(async()=>{this.state='closed';});
  createGain(){const g=gain();this.gains.push(g);return g;}
  decodeAudioData=vi.fn(async data=>{const buffer=audioBuffer(data.byteLength);buffer.getChannelData(0).fill(.25);return buffer;});
  createBuffer=(channels,length,rate)=>audioBuffer(length,rate);
  addEventListener=(kind,cb)=>{this.listeners[kind]=cb;};removeEventListener=vi.fn();
  createBufferSource(){const source={playbackRate:{value:1},connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};sources.push(source);return source;}
 }
 fetchAudio.mockImplementation(async url=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(url.endsWith('/contact.mp3')?120:48000)}));
 const errors=vi.fn(),interrupted=vi.fn(),mixer=createTappingAudio({AudioContextClass:Audio,fetchAudio,resolveNarration,onError:errors,onInterrupted:interrupted,now,onEvent:(kind,event)=>events.push({kind,...event})});
 return{mixer,contexts,sources,events,fetchAudio,errors,interrupted,setClock:(wall,lag=outputLag)=>{wallTime=wall;outputLag=lag;}};
}
afterEach(()=>vi.useRealTimers());
describe('offline tapping voice/music/contact mixer',()=>{
 it('prefetches without hardware and unlocks directly in the Start gesture',async()=>{const f=fixture();await f.mixer.preload('worry');expect(f.contexts).toHaveLength(0);const enabled=f.mixer.activate('worry');expect(f.contexts[0].resume).toHaveBeenCalledOnce();expect(await enabled).toBe(true);expect(f.sources).toHaveLength(0);f.mixer.run();expect(f.events[0].kind).toBe('music');f.mixer.dispose();});
 it('ducks music under the real spoken clip and accepts the selected cadence contact offset',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-brow');f.mixer.beat(320);expect(f.events.map(e=>e.kind)).toEqual(['music','voice','beat']);expect(f.events[2].at).toBe(10.32);expect(f.sources[0].loop).toBe(true);expect(f.contexts[0].gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.12,10,.16);f.sources[1].onended();expect(f.contexts[0].gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.45,10,.16);f.mixer.dispose();});
 it('pause immediately cancels music, voice and queued contact; Resume continues the sentence',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-hand');f.mixer.beat();f.contexts[0].currentTime=11.5;f.mixer.pause();for(const source of f.sources)expect(source.stop).toHaveBeenCalled();f.mixer.run();expect(f.events.at(-1)).toMatchObject({kind:'voice',key:'place-hand'});expect(f.events.at(-1).offset).toBeCloseTo(1.5);expect(f.sources.at(-1).playbackRate.value).toBe(1);f.mixer.cancel();f.mixer.run();expect(f.events.at(-1).kind).toBe('music');f.mixer.dispose();});
 it.each([600,800])('keeps the original contact waveform in one native %ims loop, with exact silence between contacts',async beatMs=>{
  const f=fixture({outputClock:true});f.setClock(1000,.05);await f.mixer.activate('worry');f.mixer.run();
  f.mixer.startRhythm({beatMs,contactMs:beatMs*.4});
  const source=f.sources[1],data=source.buffer.getChannelData(0),offset=beatMs*.4;
  expect(source.loop).toBe(true);expect(source.playbackRate.value).toBe(1);
  expect(source.buffer.duration).toBeCloseTo(beatMs/1000);
  expect([...data.slice(0,offset)].every(x=>x===0)).toBe(true);
  expect([...data.slice(offset,offset+120)].every(x=>x===.25)).toBe(true);
  expect([...data.slice(offset+120)].every(x=>x===0)).toBe(true);
  expect(f.events[1]).toMatchObject({kind:'beat',key:'contact'});
  expect(f.events[1].offset).toBeCloseTo(0);
  expect(f.events[1].at).toBeCloseTo(10.05);
  f.contexts[0].currentTime=10.1;expect(f.mixer.rhythmPhase()).toBeCloseTo(0);
  f.contexts[0].currentTime=10.1+beatMs*.4/1000;expect(f.mixer.rhythmPhase()).toBeCloseTo(beatMs*.4);
  f.mixer.dispose();
 });
 it.each([600,800])('does not cancel or recreate the native %ims loop during a main-thread stall or stalled audio output',async beatMs=>{
  vi.useFakeTimers();const f=fixture({outputClock:true});f.setClock(1000,.05);await f.mixer.activate('worry');f.mixer.run();
  f.mixer.startRhythm({beatMs,contactMs:beatMs*.4});const source=f.sources[1];
  f.setClock(10000,.05);f.contexts[0].currentTime=10.18;vi.advanceTimersByTime(9000);
  expect(f.events).toHaveLength(2);expect(source.stop).not.toHaveBeenCalled();
  expect(f.mixer.rhythmPhase()).toBeCloseTo(80);
  f.contexts[0].currentTime=19;expect(f.mixer.rhythmPhase()).toBeCloseTo(8900);
  expect(f.events).toHaveLength(2);expect(source.start).toHaveBeenCalledOnce();
  f.mixer.pause();expect(source.stop).toHaveBeenCalledOnce();expect(f.mixer.rhythmPhase()).toBeNull();
  f.mixer.dispose();
 });
 it('replays the under-eye/collarbone failure as audio-clock lag, retaining the contact and exposing the same phase to its visual',async()=>{
  const f=fixture({outputClock:true});f.setClock(1000,.05);await f.mixer.activate('worry');f.mixer.run();
  f.mixer.startRhythm({beatMs:600,contactMs:240});const contact=f.sources[1];
  f.setClock(1866,.05);f.contexts[0].currentTime=10.69;
  expect(contact.stop).not.toHaveBeenCalled();expect(f.mixer.rhythmPhase()).toBeCloseTo(590);
  f.setClock(2200,.05);f.contexts[0].currentTime=10.74;
  expect(f.mixer.rhythmPhase()).toBeCloseTo(640);expect(f.events).toHaveLength(2);
  f.mixer.dispose();
 });
 it('uses reported output latency without timestamps and never moves the visual backwards on timestamp jitter',async()=>{
  const f=fixture();await f.mixer.activate('worry');f.contexts[0].baseLatency=.01;f.contexts[0].outputLatency=.04;
  f.mixer.run();f.mixer.startRhythm({beatMs:600,contactMs:240,phaseMs:100});
  expect(f.events[1].offset).toBeCloseTo(.1);expect(f.mixer.rhythmPhase()).toBeCloseTo(100);
  f.contexts[0].currentTime=10.3;expect(f.mixer.rhythmPhase()).toBeCloseTo(300);
  f.contexts[0].getOutputTimestamp=()=>({contextTime:10.2,performanceTime:100});f.setClock(110);
  expect(f.mixer.rhythmPhase()).toBeCloseTo(300);f.mixer.dispose();
 });
 it('tempo change cancels the old loop and starts at the current visual phase without a burst or voice pitch change',async()=>{
  const f=fixture({outputClock:true});f.setClock(1000,.05);await f.mixer.activate('worry');f.mixer.run();
  f.mixer.startRhythm({beatMs:600,contactMs:240});const old=f.sources[1];
  f.mixer.startRhythm({beatMs:800,contactMs:320,phaseMs:350});
  expect(old.stop).toHaveBeenCalledOnce();expect(f.sources[2].buffer.duration).toBe(.8);
  expect(f.events[2].offset).toBeCloseTo(.35);expect(f.mixer.rhythmPhase()).toBeCloseTo(350);
  f.mixer.speak('place-hand');expect(f.sources.at(-1).playbackRate.value).toBe(1);
  f.mixer.configure({beat:false});expect(f.sources[2].stop).toHaveBeenCalledOnce();expect(f.mixer.rhythmPhase()).toBeNull();
  f.mixer.dispose();
 });
 it('changing one channel stops only that channel and releases ducking',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-collar');f.mixer.beat();f.mixer.configure({voice:false});expect(f.sources[1].stop).toHaveBeenCalledOnce();expect(f.sources[0].stop).not.toHaveBeenCalled();f.mixer.configure({music:false,beat:false});expect(f.sources[0].stop).toHaveBeenCalledOnce();expect(f.sources[2].stop).toHaveBeenCalledOnce();f.mixer.dispose();});
 it('reports a failed voice asset, keeps the available bed/beat and genuinely retries',async()=>{const f=fixture();f.fetchAudio.mockImplementation(async url=>({ok:!url.includes('place-brow'),arrayBuffer:async()=>new ArrayBuffer(url.endsWith('/contact.mp3')?120:48000)}));expect(await f.mixer.activate('worry')).toBe(true);expect(f.errors).toHaveBeenCalledWith('voice');f.mixer.run();f.mixer.speak('place-hand');f.mixer.beat();expect(f.events.map(e=>e.kind)).toEqual(['music','beat']);f.mixer.pause();f.fetchAudio.mockImplementation(async url=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(url.endsWith('/contact.mp3')?120:48000)}));await f.mixer.activate('worry',{voice:true,music:true,beat:true});f.mixer.run();f.mixer.speak('place-brow');expect(f.events.at(-1).kind).toBe('voice');f.mixer.dispose();});
 it('never falls back to the rejected voice when matching recordings are missing',async()=>{const f=fixture({resolveNarration:()=>null});await f.mixer.activate('worry');expect(f.errors).toHaveBeenCalledWith('voice');expect(f.fetchAudio.mock.calls.map(([url])=>url).sort()).toEqual(['/media/tapping/audio/contact.mp3','/media/tapping/audio/warm-room.mp3']);f.mixer.run();f.mixer.speak('place-brow');f.mixer.beat();expect(f.events.map(e=>e.kind)).toEqual(['music','beat']);f.mixer.dispose();});
 it('never activates late after pause or disposal',async()=>{const f=fixture();let resolve;const pending=new Promise(r=>{resolve=r;});f.fetchAudio.mockImplementation(()=>pending);const activating=f.mixer.activate('worry');await Promise.resolve();f.mixer.dispose();resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(48000)});expect(await activating).toBe(false);expect(f.sources).toHaveLength(0);expect(f.contexts[0].close).toHaveBeenCalledOnce();});
 it('rejects a resolved unlock when the context is still suspended',async()=>{const f=fixture();f.mixer.preload('worry');const activating=f.mixer.activate('worry');f.contexts[0].state='suspended';await expect(activating).rejects.toThrow('Audio unavailable');f.mixer.dispose();});
 it('an actual context interruption stops every source and asks the round to pause',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-arm');f.mixer.beat();f.contexts[0].state='interrupted';f.contexts[0].listeners.statechange();expect(f.interrupted).toHaveBeenCalledOnce();for(const source of f.sources)expect(source.stop).toHaveBeenCalled();f.mixer.dispose();});
});
