import {beforeEach,afterEach,expect,it,vi} from 'vitest';
let ambient,current;
const settle=async()=>{await Promise.resolve();await Promise.resolve();await Promise.resolve();};
beforeEach(async()=>{
 vi.resetModules();globalThis.window=new EventTarget();globalThis.document=new EventTarget();document.visibilityState='visible';
 globalThis.Audio=class {constructor(src){this.src=src;this.paused=true;this.play=vi.fn(()=>Promise.reject(new Error('gesture')));this.pause=vi.fn(()=>{this.paused=true;});current=this;}};
 ambient=await import('./homeAmbient.js');
});
afterEach(()=>{delete globalThis.window;delete globalThis.document;delete globalThis.Audio;});
it('does not restart an armed autoplay retry after pause or mute',async()=>{
 ambient.resumeHomeAmbient();await settle();ambient.pauseHomeAmbient();document.dispatchEvent(new Event('pointerdown'));expect(current.play).toHaveBeenCalledTimes(1);
 ambient.resumeHomeAmbient();await settle();ambient.setHomeAmbientMuted(true);document.dispatchEvent(new Event('keydown'));expect(current.play).toHaveBeenCalledTimes(2);
});
it('ignores a late rejected play after stop',async()=>{
 let reject;ambient.resumeHomeAmbient();await settle();current.play.mockImplementation(()=>new Promise((_,r)=>{reject=r;}));ambient.resumeHomeAmbient();ambient.stopHomeAmbient();reject(new Error('late'));await settle();document.dispatchEvent(new Event('pointerdown'));expect(current.play).toHaveBeenCalledTimes(2);
});
it('suspends in background and resumes only when still wanted',async()=>{
 ambient.resumeHomeAmbient();await settle();document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));document.dispatchEvent(new Event('pointerdown'));expect(current.play).toHaveBeenCalledTimes(1);
 document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));expect(current.play).toHaveBeenCalledTimes(2);ambient.pauseHomeAmbient();window.dispatchEvent(new Event('pageshow'));expect(current.play).toHaveBeenCalledTimes(2);
});
it('preserves approved source, handoff position, loop and clamped volume',()=>{ambient.handoffHomeAmbient({currentTime:25,volume:2});expect(current.src).toBe('/audio/home-ambient.mp3');expect(current.currentTime).toBe(25);expect(current.volume).toBe(1);expect(current.loop).toBe(true);});
