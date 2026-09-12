// Soft, calm UI sound feedback synthesized via the Web Audio API.
// All tones are low-pass shaped, low in pitch, and quiet — designed to feel
// tactile and reassuring rather than bright, sharp, or celebratory.

let ctx = null;
let suspended = false;

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
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try { navigator.vibrate(ms); } catch { /* */ }
}

// Tiny multi-pulse haptic motifs for premium stage choreography.
export function hapticPattern(pattern = [8]) {
  if (!hapticsEnabled) return;
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