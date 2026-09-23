// Soft, calm UI sound feedback synthesized via the Web Audio API.
// All tones are low-pass shaped, low in pitch, and quiet — designed to feel
// tactile and reassuring rather than bright, sharp, or celebratory.

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

let ctx = null;
let suspended = false;
const isNative = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
};

// Maps a "duration"-shaped haptic request (the vibrate-style API the rest of
// this file already calls with) onto the discrete impact strengths iOS/
// Android actually expose. Kept intentionally light-touch, matching the
// "always understated" rule below.
function impactStyleFor(ms) {
  if (ms <= 10) return ImpactStyle.Light;
  if (ms <= 20) return ImpactStyle.Medium;
  return ImpactStyle.Heavy;
}

function nativeImpact(ms) {
  Haptics.impact({ style: impactStyleFor(ms) }).catch(() => {});
}

function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone({ freq, type = "sine", gain = 0.05, attack = 0.01, decay = 0.18, when = 0, lp = 1200 }) {
  const c = ac();
  if (!c || suspended) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = lp;
  filter.Q.value = 0.5;
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  osc.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + attack + decay + 0.05);
}

// muted, soft tap — the everyday tactile tick
export function playTap() {
  tone({ freq: 220, type: "sine", gain: 0.03, attack: 0.004, decay: 0.08, lp: 900 });
}

// gentle warm two-note confirmation — choosing a direction, starting a pathway
export function playSelect() {
  tone({ freq: 196, type: "sine", gain: 0.05, attack: 0.01, decay: 0.22, lp: 1000 });
  tone({ freq: 261.63, type: "sine", gain: 0.045, attack: 0.012, decay: 0.3, when: 0.07, lp: 1000 });
}

// warm, low, calm settling chord — a pathway finishing
export function playComplete() {
  tone({ freq: 174.61, type: "sine", gain: 0.05, attack: 0.02, decay: 0.9, lp: 800 });
  tone({ freq: 220, type: "sine", gain: 0.04, attack: 0.03, decay: 1.1, when: 0.05, lp: 800 });
  tone({ freq: 130.81, type: "sine", gain: 0.04, attack: 0.04, decay: 1.5, when: 0.09, lp: 700 });
}

// Crisp mechanical click sound
export function playCrispClick() {
  tone({ freq: 880, type: "sine", gain: 0.08, attack: 0.002, decay: 0.03, lp: 2500 });
  tone({ freq: 1760, type: "sine", gain: 0.04, attack: 0.001, decay: 0.015, lp: 4000 });
}

// Dopamine feedback clicking sound: crisp click followed by rapid rising warm sparkles
export function playDopamineClick() {
  playCrispClick();
  const sparkles = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  sparkles.forEach((freq, idx) => {
    tone({
      freq,
      type: "sine",
      gain: 0.025,
      attack: 0.008,
      decay: 0.15,
      when: 0.05 + idx * 0.04,
      lp: 2000
    });
  });
}

// A short run of the same warm "shift" chime used by the opening control.
// It marks the start of a selected micro-action without speaking a countdown.
export function playShiftCountdown() {
  playDopamineClick();
  [0.65, 1.3, 1.95, 2.6].forEach((when, index) => {
    tone({
      freq: index % 2 === 0 ? 523.25 : 659.25,
      type: "sine",
      gain: 0.022,
      attack: 0.008,
      decay: 0.14,
      when,
      lp: 2000
    });
  });
}

// Ultra-premium reward chime for complete satisfaction upon finishing
export function playSuperRewardChime() {
  playComplete();
  const notes = [311.13, 392.00, 466.16, 622.25, 783.99, 932.33, 1244.50]; // Eb4, G4, Bb4, Eb5, G5, Bb5, Eb6
  notes.forEach((freq, idx) => {
    tone({
      freq,
      type: "sine",
      gain: 0.03,
      attack: 0.015,
      decay: 0.8 - idx * 0.08,
      when: idx * 0.08,
      lp: 1800
    });
  });
}

// 2-second uplifting conquest major-chord brassy sweep
export function playConquestInstrumental() {
  playCrispClick();
  const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    tone({
      freq,
      type: "sine",
      gain: 0.03,
      attack: 0.05,
      decay: 1.8 - idx * 0.1,
      when: 0.02 + idx * 0.07,
      lp: 1600
    });
    tone({
      freq: freq * 1.005,
      type: "triangle",
      gain: 0.012,
      attack: 0.08,
      decay: 1.5 - idx * 0.1,
      when: 0.02 + idx * 0.07,
      lp: 1200
    });
  });
}

// 1.2-second realistic double-chirp of a bird synthesized via Web Audio
export function playBirdChirp() {
  const c = ac();
  if (!c || suspended) return;
  const t = c.currentTime;
  for (let i = 0; i < 2; i++) {
    const t0 = t + i * 0.22;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1400, t0);
    osc.frequency.exponentialRampToValueAtTime(3600, t0 + 0.09);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.012, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.12);
  }
}

// A lower, more spacious call used as the second opening-scene nature cue.
export function playDawnBirdCall() {
  const c = ac();
  if (!c || suspended) return;
  const t = c.currentTime;
  [0, 0.34].forEach((offset, index) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    const t0 = t + offset;
    osc.type = "triangle";
    osc.frequency.setValueAtTime(index === 0 ? 820 : 980, t0);
    osc.frequency.exponentialRampToValueAtTime(index === 0 ? 1420 : 1240, t0 + 0.16);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.018, t0 + 0.024);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 0.22);
  });
}

// A brief, soft filtered swell suggesting wind through leaves.
export function playTreeWind() {
  const c = ac();
  if (!c || suspended) return;
  const buffer = c.createBuffer(1, c.sampleRate * 1.6, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) data[index] = Math.random() * 2 - 1;
  const source = c.createBufferSource();
  const filter = c.createBiquadFilter();
  const g = c.createGain();
  filter.type = "lowpass";
  filter.frequency.value = 820;
  filter.Q.value = 0.7;
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.025, t + 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.55);
  source.buffer = buffer;
  source.connect(filter);
  filter.connect(g);
  g.connect(c.destination);
  source.start(t);
  source.stop(t + 1.6);
}

// Temporarily mute UI feedback (e.g. during a discreet / no-audio session).
export function suspendFeedback() { suspended = true; }
export function resumeFeedback() { suspended = false; }

// Very subtle haptic cue for moments that benefit from a tactile anchor —
// a breath phase change, a grounding step, a release. Gated by the reduced-
// motion accessibility preference. Always understated; never strong.
let hapticsEnabled = true;
export function setHapticsEnabled(v) { hapticsEnabled = !!v; }
export function haptic(ms = 12) {
  if (!hapticsEnabled) return;
  if (isNative()) {
    nativeImpact(ms);
    return;
  }
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try { navigator.vibrate(ms); } catch { /* */ }
}

// Tiny multi-pulse haptic motifs for premium stage choreography. `pattern` is
// a vibrate-style [onMs, offMs, onMs, ...] sequence; on native we replay it as
// timed discrete impacts instead, since iOS/Android have no raw duration API.
export function hapticPattern(pattern = [8]) {
  if (!hapticsEnabled) return;
  if (isNative()) {
    let t = 0;
    pattern.forEach((ms, i) => {
      const isOnPulse = i % 2 === 0;
      if (isOnPulse && ms > 0) {
        const fireAt = t;
        setTimeout(() => nativeImpact(ms), fireAt);
      }
      t += ms;
    });
    return;
  }
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try { navigator.vibrate(pattern); } catch { /* */ }
}

// One global, delegated listener gives every button a quiet tactile tap.
// Buttons marked data-sfx="select" emit a gentle confirmation instead;
// data-sfx="none" stays silent.
export function installFeedback() {
  if (typeof window === "undefined") return () => {};
  const handler = (e) => {
    const el = e.target && e.target.closest && e.target.closest('button, [role="button"]');
    if (!el) return;
    const sfx = el.getAttribute && el.getAttribute("data-sfx");
    if (sfx === "none") return;
    if (sfx === "select") playSelect();
    else playTap();
  };
  window.addEventListener("pointerdown", handler, { passive: true });
  return () => window.removeEventListener("pointerdown", handler);
}