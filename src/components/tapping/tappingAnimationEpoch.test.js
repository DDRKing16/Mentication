import { describe, expect, it, vi } from 'vitest';
import { observeTappingAnimationStart, synchronizeTappingAnimations } from './tappingAnimationEpoch';

function element(animation) {
  return { isConnected: true, classList: { contains: () => true }, getAnimations: () => [animation] };
}
describe('actual CSS rhythm epoch', () => {
  it('uses the start time even when a delayed animationstart still reports zero current time', () => {
    const callback = vi.fn();
    const target = element({ animationName: 'tap-wrist-contact', startTime: 6500, currentTime: 0, playState: 'running' });
    observeTappingAnimationStart(target, callback);
    observeTappingAnimationStart(target, callback);
    expect(callback).toHaveBeenCalledOnce();expect(callback.mock.calls[0][0]).toBe(6500);expect(callback.mock.calls[0][1]()).toBe(0);
  });
  it('waits for a pending animation clock and ignores a cancelled or paused guide', async () => {
    let ready;
    const animation = { animationName: 'tap-wrist-contact', startTime: null, playState: 'running', ready: new Promise(resolve => { ready = resolve; }) };
    const target = element(animation), callback = vi.fn();
    observeTappingAnimationStart(target, callback);
    expect(callback).not.toHaveBeenCalled();
    animation.startTime = 7300; ready(); await animation.ready; await Promise.resolve();
    expect(callback).toHaveBeenCalledOnce();expect(callback.mock.calls[0][0]).toBe(7300);
    const cancelled = { ...animation, startTime: null, ready: Promise.resolve() };
    target.getAnimations = () => [cancelled];
    observeTappingAnimationStart(target, callback);
    target.isConnected = false; cancelled.startTime = 7400; await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('one audio output clock for every contact visual', () => {
  it('holds the wrist, knuckles and light with a stalled output clock, resumes CSS when muted and rejoins the same phase', () => {
    let phase=240,next;
    const animations=['tap-wrist-contact','tap-knuckle-contact','tap-light-contact'].map(animationName=>({animationName,playState:'running',currentTime:0,pause:vi.fn(function(){this.playState='paused';}),play:vi.fn(function(){this.playState='running';})}));
    const target={isConnected:true,classList:{contains:()=>true},dataset:{},closest:()=>({getAnimations:()=>animations})};
    const requestFrame=vi.fn(fn=>{next=fn;return 7;}),cancelFrame=vi.fn();
    const stop=synchronizeTappingAnimations(target,()=>phase,{requestFrame,cancelFrame});
    expect(animations.map(a=>a.currentTime)).toEqual([240,240,240]);expect(target.dataset.clock).toBe('audio');
    next();expect(animations.map(a=>a.currentTime)).toEqual([240,240,240]);
    phase=null;next();expect(animations.every(a=>a.play.mock.calls.length===1)).toBe(true);expect(target.dataset.clock).toBe('visual');
    phase=800;next();expect(animations.map(a=>a.currentTime)).toEqual([800,800,800]);
    stop();expect(cancelFrame).toHaveBeenCalledWith(7);phase=1200;next();expect(animations.map(a=>a.currentTime)).toEqual([800,800,800]);
  });
  it('does not keep requesting frames when the point is stopped or disconnected', () => {
    let next,active=true;
    const target={isConnected:true,classList:{contains:()=>active},dataset:{},closest:()=>({getAnimations:()=>[]})};
    const requestFrame=vi.fn(fn=>{next=fn;return 1;});
    synchronizeTappingAnimations(target,()=>0,{requestFrame,cancelFrame:vi.fn()});
    active=false;next();expect(requestFrame).toHaveBeenCalledOnce();
  });
});
