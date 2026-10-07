import { afterEach,describe,expect,it,vi } from 'vitest';
import { createTappingAudio } from './tappingAudio';

function fixture(){
 const contexts=[],sources=[],events=[],fetchAudio=vi.fn(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)}));
 const gain=()=>({gain:{value:0,cancelScheduledValues:vi.fn(),setTargetAtTime:vi.fn()},connect:vi.fn()});
 class Audio {state='suspended';currentTime=10;destination={};listeners={};gains=[];
  constructor(){contexts.push(this);}
  resume=vi.fn(async()=>{this.state='running';});close=vi.fn(async()=>{this.state='closed';});
  createGain(){const g=gain();this.gains.push(g);return g;}
  decodeAudioData=vi.fn(async()=>({duration:48}));
  addEventListener=(kind,cb)=>{this.listeners[kind]=cb;};removeEventListener=vi.fn();
  createBufferSource(){const source={connect:vi.fn(),disconnect:vi.fn(),start:vi.fn(),stop:vi.fn()};sources.push(source);return source;}
 }
 const errors=vi.fn(),interrupted=vi.fn(),mixer=createTappingAudio({AudioContextClass:Audio,fetchAudio,onError:errors,onInterrupted:interrupted,onEvent:(kind,event)=>events.push({kind,...event})});
 return{mixer,contexts,sources,events,fetchAudio,errors,interrupted};
}
afterEach(()=>vi.useRealTimers());
describe('offline tapping voice/music/contact mixer',()=>{
 it('prefetches without hardware and unlocks directly in the Start gesture',async()=>{const f=fixture();await f.mixer.preload('worry');expect(f.contexts).toHaveLength(0);const enabled=f.mixer.activate('worry');expect(f.contexts[0].resume).toHaveBeenCalledOnce();expect(await enabled).toBe(true);expect(f.sources).toHaveLength(0);f.mixer.run();expect(f.events[0].kind).toBe('music');f.mixer.dispose();});
 it('ducks music under the real spoken clip and schedules contact at the fingertip offset',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-brow');f.mixer.beat();expect(f.events.map(e=>e.kind)).toEqual(['music','voice','beat']);expect(f.events[2].at).toBe(10.2);expect(f.sources[0].loop).toBe(true);expect(f.contexts[0].gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.12,10,.16);f.sources[1].onended();expect(f.contexts[0].gains[1].gain.setTargetAtTime).toHaveBeenLastCalledWith(.45,10,.16);f.mixer.dispose();});
 it('pause immediately cancels music, voice and queued contact; Resume continues the sentence',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-hand');f.mixer.beat();f.contexts[0].currentTime=11.5;f.mixer.pause();for(const source of f.sources)expect(source.stop).toHaveBeenCalled();f.mixer.run();expect(f.events.at(-1)).toMatchObject({kind:'voice',key:'place-hand',offset:1.5});f.mixer.cancel();f.mixer.run();expect(f.events.at(-1).kind).toBe('music');f.mixer.dispose();});
 it('changing one channel stops only that channel and releases ducking',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-collar');f.mixer.beat();f.mixer.configure({voice:false});expect(f.sources[1].stop).toHaveBeenCalledOnce();expect(f.sources[0].stop).not.toHaveBeenCalled();f.mixer.configure({music:false,beat:false});expect(f.sources[0].stop).toHaveBeenCalledOnce();expect(f.sources[2].stop).toHaveBeenCalledOnce();f.mixer.dispose();});
 it('reports a failed voice asset, keeps the available bed/beat and genuinely retries',async()=>{const f=fixture();f.fetchAudio.mockImplementation(async url=>({ok:!url.includes('place-brow'),arrayBuffer:async()=>new ArrayBuffer(16)}));expect(await f.mixer.activate('worry')).toBe(true);expect(f.errors).toHaveBeenCalledWith('voice');f.mixer.run();f.mixer.speak('place-hand');f.mixer.beat();expect(f.events.map(e=>e.kind)).toEqual(['music','beat']);f.mixer.pause();f.fetchAudio.mockImplementation(async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)}));await f.mixer.activate('worry',{voice:true,music:true,beat:true});f.mixer.run();f.mixer.speak('place-brow');expect(f.events.at(-1).kind).toBe('voice');f.mixer.dispose();});
 it('never activates late after pause or disposal',async()=>{const f=fixture();let resolve;const pending=new Promise(r=>{resolve=r;});f.fetchAudio.mockImplementation(()=>pending);const activating=f.mixer.activate('worry');await Promise.resolve();f.mixer.dispose();resolve({ok:true,arrayBuffer:async()=>new ArrayBuffer(16)});expect(await activating).toBe(false);expect(f.sources).toHaveLength(0);expect(f.contexts[0].close).toHaveBeenCalledOnce();});
 it('rejects a resolved unlock when the context is still suspended',async()=>{const f=fixture();f.mixer.preload('worry');const activating=f.mixer.activate('worry');f.contexts[0].state='suspended';await expect(activating).rejects.toThrow('Audio unavailable');f.mixer.dispose();});
 it('an actual context interruption stops every source and asks the round to pause',async()=>{const f=fixture();await f.mixer.activate('worry');f.mixer.run();f.mixer.speak('place-arm');f.mixer.beat();f.contexts[0].state='interrupted';f.contexts[0].listeners.statechange();expect(f.interrupted).toHaveBeenCalledOnce();for(const source of f.sources)expect(source.stop).toHaveBeenCalled();f.mixer.dispose();});
});
