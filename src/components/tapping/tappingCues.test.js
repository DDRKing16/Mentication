import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTappingCues } from './tappingCues';

function audioFixture() {
  const tones = [], contexts = [];
  class Audio {
    state = 'suspended'; currentTime = 7; destination = {};
    constructor() { contexts.push(this); }
    resume = vi.fn(async () => { this.state = 'running'; });
    close = vi.fn(async () => { this.state = 'closed'; });
    createOscillator() { const tone = { frequency: {}, connect: vi.fn(), disconnect: vi.fn(), start: vi.fn(), stop: vi.fn() }; tones.push(tone); return tone; }
    createGain() { return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }; }
  }
  return { Audio, tones, contexts };
}
afterEach(() => { vi.useRealTimers(); });
describe('tapping cue lifecycle', () => {
  it('aligns optional touch with the +200 ms finger contact and cancels pending contact',async()=>{
    vi.useFakeTimers();const vibrate=vi.fn(()=>true);const cues=createTappingCues({AudioContextClass:null,native:false,vibrate});
    cues.emit('beat',{haptic:true,contactDelay:200});expect(vibrate).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(199);expect(vibrate).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(1);expect(vibrate).toHaveBeenLastCalledWith(8);
    cues.emit('beat',{haptic:true,contactDelay:200});cues.cancel();await vi.advanceTimersByTimeAsync(500);expect(vibrate.mock.calls.filter(([value])=>value===8)).toHaveLength(1);cues.dispose();
  });
  it('stays silent until an explicit activation, and produces one beat per supplied event', async () => {
    const { Audio, tones, contexts } = audioFixture();
    const cues = createTappingCues({ AudioContextClass: Audio, native: false, vibrate: null });
    expect(contexts).toHaveLength(0);
    expect(await cues.enableSound()).toBe(true);
    cues.emit('beat', { sound: true });
    expect(tones).toHaveLength(1); expect(tones[0].frequency.value).toBe(196);
    expect(tones[0].start).toHaveBeenCalledWith(7);
    cues.emit('point', { sound: true });
    expect(tones).toHaveLength(3); expect(tones[1].frequency.value).toBe(261.63);
    expect(tones[2].start).toHaveBeenCalledWith(7.18);
    cues.cancel();
    for (const tone of tones) expect(tone.stop).toHaveBeenLastCalledWith();
    cues.dispose(); expect(contexts[0].close).toHaveBeenCalledOnce();
  });
  it('cancels both browser pattern vibration and already scheduled sound', async () => {
    const { Audio, tones } = audioFixture(), vibrate = vi.fn(() => true);
    const cues = createTappingCues({ AudioContextClass: Audio, native: false, vibrate });
    await cues.enableSound(); await cues.enableHaptics();
    cues.emit('point', { sound: true, haptic: true });
    expect(vibrate).toHaveBeenLastCalledWith([8, 65, 8]);
    cues.cancel(); expect(vibrate).toHaveBeenLastCalledWith(0);
    expect(tones[1].stop).toHaveBeenLastCalledWith();
  });
  it('cancels the pending native double cue immediately on pause/exit', async () => {
    vi.useFakeTimers(); const impact = vi.fn(async () => {});
    const cues = createTappingCues({ AudioContextClass: null, native: true, impact, vibrate: null });
    cues.emit('point', { haptic: true }); await vi.advanceTimersByTimeAsync(0);
    expect(impact).toHaveBeenCalledOnce();
    cues.cancel(); await vi.advanceTimersByTimeAsync(1000);
    expect(impact).toHaveBeenCalledOnce();
    cues.emit('point', { haptic: true }); await vi.advanceTimersByTimeAsync(85);
    expect(impact).toHaveBeenCalledTimes(3);
    cues.dispose(); await vi.advanceTimersByTimeAsync(2000); expect(impact).toHaveBeenCalledTimes(3);
  });
  it('does not overlap an unresolved native impact or replay a cancelled one', async () => {
    const impact = vi.fn(() => new Promise(() => {}));
    const cues = createTappingCues({ AudioContextClass: null, native: true, impact });
    cues.emit('beat', { haptic: true }); cues.emit('beat', { haptic: true });
    await Promise.resolve(); expect(impact).toHaveBeenCalledOnce();
    cues.dispose(); cues.emit('beat', { haptic: true }); expect(impact).toHaveBeenCalledOnce();
  });
  it('rejects unavailable vibration and reports suspended audio with visible fallback', async () => {
    const onError = vi.fn(), { Audio, contexts } = audioFixture();
    const cues = createTappingCues({ AudioContextClass: Audio, native: false, vibrate: () => false, onError });
    await expect(cues.enableHaptics()).rejects.toThrow();
    await cues.enableSound(); contexts[0].state = 'suspended';
    cues.emit('beat', { sound: true, haptic: true });
    expect(onError).toHaveBeenCalledWith('sound'); expect(onError).toHaveBeenCalledWith('haptic');
  });
  it('ignores late native failures after exit', async () => {
    let reject; const onError = vi.fn();
    const cues = createTappingCues({ native: true, AudioContextClass: null, impact: () => new Promise((_, r) => { reject = r; }), onError });
    cues.emit('beat', { haptic: true }); await Promise.resolve(); cues.dispose(); reject(new Error('late'));
    await Promise.resolve(); await Promise.resolve(); expect(onError).not.toHaveBeenCalled();
  });
  it('does not activate audio when its gesture promise completes after exit', async () => {
    let resolve;
    class Audio { state = 'running'; resume = () => new Promise(r => { resolve = r; }); close = async () => {}; }
    const cues = createTappingCues({ AudioContextClass: Audio, native: false });
    const enabled = cues.enableSound(); cues.dispose(); resolve(); expect(await enabled).toBe(false);
  });
});
