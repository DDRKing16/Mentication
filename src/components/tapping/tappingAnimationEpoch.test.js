import { describe, expect, it, vi } from 'vitest';
import { observeTappingAnimationStart } from './tappingAnimationEpoch';

function element(animation) {
  return { isConnected: true, classList: { contains: () => true }, getAnimations: () => [animation] };
}
describe('actual CSS rhythm epoch', () => {
  it('uses the start time even when a delayed animationstart still reports zero current time', () => {
    const callback = vi.fn();
    const target = element({ animationName: 'tap-wrist-contact', startTime: 6500, currentTime: 0, playState: 'running' });
    observeTappingAnimationStart(target, callback);
    observeTappingAnimationStart(target, callback);
    expect(callback).toHaveBeenCalledExactlyOnceWith(6500);
  });
  it('waits for a pending animation clock and ignores a cancelled or paused guide', async () => {
    let ready;
    const animation = { animationName: 'tap-wrist-contact', startTime: null, playState: 'running', ready: new Promise(resolve => { ready = resolve; }) };
    const target = element(animation), callback = vi.fn();
    observeTappingAnimationStart(target, callback);
    expect(callback).not.toHaveBeenCalled();
    animation.startTime = 7300; ready(); await animation.ready; await Promise.resolve();
    expect(callback).toHaveBeenCalledExactlyOnceWith(7300);
    const cancelled = { ...animation, startTime: null, ready: Promise.resolve() };
    target.getAnimations = () => [cancelled];
    observeTappingAnimationStart(target, callback);
    target.isConnected = false; cancelled.startTime = 7400; await Promise.resolve();
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
