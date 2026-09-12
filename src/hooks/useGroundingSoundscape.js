import { useEffect, useRef } from "react";

// 5-4-3-2-1 Grounding V2 — dedicated background soundscape.
//
// Mirrors the approved Box Breathing V2 soundscape pattern (a separate
// implementation, not a shared import of the production-locked hook): the
// uploaded Sensory Grounding MP3 plays as a low, immersive ambient bed
// underneath the spoken narration for the whole intervention. It fades in when
// the stage begins, loops throughout, ducks to a quieter level while the
// narrator is speaking and returns afterwards, and fades out gently when the
// intervention ends or the user exits (the fade continues even after unmount so
// the exit is never abrupt).
//
// Volume constants are identical to Box Breathing V2 so the background level
// matches exactly. Volume is controlled on the HTMLMediaElement directly (no
// Web Audio graph) so it works regardless of the MP3 host's CORS headers.

const MP3_URL = "/media/audio/grounding-soundscape.mp3";

const BASE_VOL = 0.22; // ~22% perceived background level (narration stays clear)
const DUCK_VOL = 0.07; // underneath narration
const FADE_IN = 1.6;   // seconds — gentle fade-in on start
const FADE_OUT = 1.2;  // seconds — gentle fade-out on end / exit
const DUCK_FADE = 0.5; // seconds — duck / return transitions
const HANDOFF_DUR = 0.42; // seconds — premium stage handoff motif

const ease = (t) => t * t * (3 - 2 * t);

const STAGE_AUDIO = {
  sight: { pan: 0.08, lowpass: 3300, q: 0.72 },
  touch: { pan: 0.17, lowpass: 2850, q: 0.88 },
  hearing: { pan: 0.0, lowpass: 4100, q: 0.62 },
  smell: { pan: -0.11, lowpass: 2500, q: 0.98 },
  taste: { pan: -0.18, lowpass: 3180, q: 0.8 },
  recenter: { pan: 0.0, lowpass: 3600, q: 0.7 },
};

export function useGroundingSoundscape({ active, narrationActive, sense }) {
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const toneRafRef = useRef(0);
  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const filterRef = useRef(null);
  const panRef = useRef(null);
  const masterRef = useRef(null);
  const targetRef = useRef(0);
  const prevSenseRef = useRef(undefined);

  const setOutputLevel = (audio, v) => {
    if (masterRef.current && ctxRef.current) {
      masterRef.current.gain.value = v;
      // Keep element audible if the graph is unavailable mid-session.
      audio.volume = 1;
    } else {
      audio.volume = v;
    }
  };

  const getOutputLevel = (audio) => {
    if (masterRef.current && ctxRef.current) return masterRef.current.gain.value;
    return audio.volume;
  };

  const rampStageProfile = (s, dur = HANDOFF_DUR) => {
    const profile = STAGE_AUDIO[s] || STAGE_AUDIO.taste;
    const ctx = ctxRef.current;
    if (!ctx || !filterRef.current || !panRef.current) return;
    const t = ctx.currentTime;
    const p = panRef.current.pan;
    const f = filterRef.current.frequency;
    const q = filterRef.current.Q;
    p.cancelScheduledValues(t);
    f.cancelScheduledValues(t);
    q.cancelScheduledValues(t);
    p.setValueAtTime(p.value, t);
    f.setValueAtTime(f.value, t);
    q.setValueAtTime(q.value, t);
    p.linearRampToValueAtTime(profile.pan, t + dur);
    f.linearRampToValueAtTime(profile.lowpass, t + dur);
    q.linearRampToValueAtTime(profile.q, t + dur);
  };

  const tonalSwell = () => {
    const ctx = ctxRef.current;
    const filter = filterRef.current;
    if (!ctx || !filter) return;
    cancelAnimationFrame(toneRafRef.current);
    const base = filter.frequency.value;
    const peak = Math.min(5600, base * 1.16);
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / (HANDOFF_DUR * 1000));
      const upDown = k < 0.5 ? ease(k / 0.5) : ease((1 - k) / 0.5);
      filter.frequency.value = base + (peak - base) * upDown;
      if (k < 1) toneRafRef.current = requestAnimationFrame(step);
      else filter.frequency.value = base;
    };
    toneRafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const audio = new Audio(MP3_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;

    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const source = ctx.createMediaElementSource(audio);
        const filter = ctx.createBiquadFilter();
        const pan = ctx.createStereoPanner();
        const master = ctx.createGain();
        filter.type = "lowpass";
        filter.frequency.value = STAGE_AUDIO.taste.lowpass;
        filter.Q.value = STAGE_AUDIO.taste.q;
        pan.pan.value = STAGE_AUDIO.taste.pan;
        master.gain.value = 0;
        source.connect(filter);
        filter.connect(pan);
        pan.connect(master);
        master.connect(ctx.destination);
        ctxRef.current = ctx;
        sourceRef.current = source;
        filterRef.current = filter;
        panRef.current = pan;
        masterRef.current = master;
        audio.volume = 1;
      }
    } catch {
      // Graceful fallback: direct media-element volume path.
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(toneRafRef.current);
      const a = audioRef.current;
      if (a) {
        // Fade out gently even after this component unmounts (e.g. user exits),
        // then pause — so the soundscape never cuts off abruptly.
        if (a.volume > 0.01) {
          const start = a.volume;
          const t0 = performance.now();
          const step = (now) => {
            const k = Math.min(1, (now - t0) / (FADE_OUT * 1000));
            setOutputLevel(a, start * (1 - ease(k)));
            if (k < 1) requestAnimationFrame(step);
            else { try { a.pause(); } catch { /* */ } }
          };
          requestAnimationFrame(step);
        } else {
          try { a.pause(); } catch { /* */ }
        }
      }
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
      }
      ctxRef.current = null;
      sourceRef.current = null;
      filterRef.current = null;
      panRef.current = null;
      masterRef.current = null;
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const fadeTo = (target, duration, onDone) => {
      cancelAnimationFrame(rafRef.current);
      const start = getOutputLevel(audio);
      if (!duration || start === target) {
        setOutputLevel(audio, target);
        if (onDone) onDone();
        return;
      }
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / (duration * 1000));
        setOutputLevel(audio, Math.max(0, start + (target - start) * ease(k)));
        if (k < 1) rafRef.current = requestAnimationFrame(step);
        else if (onDone) onDone();
      };
      rafRef.current = requestAnimationFrame(step);
    };

    if (active) {
      const target = narrationActive ? DUCK_VOL : BASE_VOL;
      targetRef.current = target;
      const starting = getOutputLevel(audio) < 0.02;
      fadeTo(target, starting ? FADE_IN : DUCK_FADE);
      if (audio.paused) audio.play().catch(() => { /* autoplay can be blocked before a gesture */ });
    } else {
      targetRef.current = 0;
      fadeTo(0, FADE_OUT, () => { try { audio.pause(); } catch { /* */ } });
    }
  }, [active, narrationActive]);

  // Sense-stage spatial micro-design + premium handoff tonal motif.
  useEffect(() => {
    if (!active) return;
    rampStageProfile(sense, HANDOFF_DUR);
    if (prevSenseRef.current && prevSenseRef.current !== sense) {
      tonalSwell();
    }
    prevSenseRef.current = sense;
  }, [active, sense]);

  // Autoplay can block the unmuted soundscape in strict / iframe contexts. A
  // one-time tap anywhere unlocks it so the ambient bed is never silent.
  useEffect(() => {
    if (!active) return;
    const unlock = () => {
      const a = audioRef.current;
      const c = ctxRef.current;
      if (c && c.state === "suspended") c.resume().catch(() => {});
      if (a && a.paused) a.play().catch(() => { /* */ });
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [active]);
}