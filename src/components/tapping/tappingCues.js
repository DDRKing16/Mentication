import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// No independent rhythm timer: the round supplies each point/beat event.
// Only the short, distinct point-change double cue needs a cancellable timeout.
export function createTappingCues({
  AudioContextClass = window.AudioContext || window.webkitAudioContext,
  native = Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Haptics'),
  impact = () => Haptics.impact({ style: ImpactStyle.Light }),
  vibrate = typeof navigator.vibrate === 'function' ? value => navigator.vibrate(value) : null,
  onError = () => {},
} = {}) {
  let context = null, generation = 0, disposed = false, hapticBusy = false;
  const nodes = new Set(), timers = new Set();
  function stopSound() {
    for (const { tone, gain } of nodes) { try { tone.stop(); tone.disconnect(); gain.disconnect(); } catch { /* already ended */ } }
    nodes.clear();
  }
  function stopHaptics() {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (!native && vibrate) { try { vibrate(0); } catch { /* optional hardware */ } }
  }
  function cancel() { generation += 1; stopSound(); stopHaptics(); }
  function report(kind, token) { if (!disposed && generation === token) onError(kind); }
  async function enableSound() {
    const token = generation;
    if (disposed || !AudioContextClass) throw new Error('Sound unavailable');
    if (!context) context = new AudioContextClass();
    await context.resume();
    return !disposed && generation === token && context.state === 'running';
  }
  async function enableHaptics() {
    const token = generation;
    if (disposed || (!native && !vibrate)) throw new Error('Haptics unavailable');
    if (native) await impact();
    else if (!vibrate(8)) throw new Error('Haptics unavailable');
    return !disposed && generation === token;
  }
  function toneAt(frequency, delay, length) {
    if (!context || context.state !== 'running') throw new Error('Sound suspended');
    const tone = context.createOscillator(), gain = context.createGain();
    const node = { tone, gain }; nodes.add(node);
    const start = context.currentTime + delay;
    tone.type = 'sine'; tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.025, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    tone.connect(gain); gain.connect(context.destination);
    tone.onended = () => { tone.disconnect(); gain.disconnect(); nodes.delete(node); };
    tone.start(start); tone.stop(start + length + 0.015);
  }
  function nativePulse(token) {
    if (disposed || generation !== token || hapticBusy) return;
    hapticBusy = true;
    Promise.resolve().then(() => {
      if (!disposed && generation === token) return impact();
    }).catch(() => report('haptic', token)).finally(() => { hapticBusy = false; });
  }
  function emit(kind, { sound = false, haptic = false } = {}) {
    if (disposed) return;
    const token = generation;
    if (sound) {
      try {
        toneAt(kind === 'point' ? 261.63 : 196, 0, kind === 'point' ? 0.14 : 0.09);
        if (kind === 'point') toneAt(220, 0.18, 0.14);
      } catch { stopSound(); report('sound', token); }
    }
    if (haptic) {
      if (native) {
        nativePulse(token);
        if (kind === 'point') {
          const timer = setTimeout(() => { timers.delete(timer); nativePulse(token); }, 85);
          timers.add(timer);
        }
      } else {
        try { if (!vibrate || !vibrate(kind === 'point' ? [8, 65, 8] : 8)) report('haptic', token); }
        catch { report('haptic', token); }
      }
    }
  }
  function dispose() { disposed = true; cancel(); if (context) void context.close().catch(() => {}); }
  return { enableSound, enableHaptics, emit, cancel, stopSound, stopHaptics, dispose };
}
