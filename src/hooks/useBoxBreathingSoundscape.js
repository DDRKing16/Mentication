// =====================================================================
// PRODUCTION-LOCKED · Box Breathing V2 (approved benchmark)
// Do NOT change visuals, timing, narration, audio, layout or
// functionality without an explicit request. Benchmark standard for
// future Mentication interventions. Spec: docs/box-breathing-v2-spec.md
// =====================================================================
import { useEffect, useRef } from "react";

// Box Breathing V2's dedicated background soundscape — the uploaded
// BreathingSphere.mp3 — played as a low, immersive ambient bed underneath the
// spoken narration. It fades in when the paced cycle begins, loops for the full
// intervention, ducks to a quieter level while the narrator is speaking and
// returns afterwards, and fades out gently when the intervention ends or the
// user exits (the fade continues even after unmount so the exit is never abrupt).
//
// Volume is controlled on the HTMLMediaElement directly (no Web Audio graph) so
// it works regardless of the MP3 host's CORS headers.

const MP3_URL = "/media/audio/box-breathing-soundscape.mp3";

const BASE_VOL = 0.22; // ~22% perceived background level (narration stays clear)
const DUCK_VOL = 0.07; // underneath narration
const FADE_IN = 1.6;   // seconds — gentle fade-in on start
const FADE_OUT = 1.2;  // seconds — gentle fade-out on end / exit
const DUCK_FADE = 0.5; // seconds — duck / return transitions

const ease = (t) => t * t * (3 - 2 * t);

export function useBoxBreathingSoundscape({ active, narrationActive }) {
  const audioRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const audio = new Audio(MP3_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;
    return () => {
      cancelAnimationFrame(rafRef.current);
      const a = audioRef.current;
      if (a) {
        // Fade out gently even after this component unmounts (e.g. user exits),
        // then pause — so the soundscape never cuts off abruptly.
        if (a.volume > 0.01) {
          const start = a.volume;
          const t0 = performance.now();
          const step = (now) => {
            const k = Math.min(1, (now - t0) / (FADE_OUT * 1000));
            a.volume = start * (1 - ease(k));
            if (k < 1) requestAnimationFrame(step);
            else { try { a.pause(); } catch { /* */ } }
          };
          requestAnimationFrame(step);
        } else {
          try { a.pause(); } catch { /* */ }
        }
      }
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const fadeTo = (target, duration, onDone) => {
      cancelAnimationFrame(rafRef.current);
      const start = audio.volume;
      if (!duration || start === target) {
        audio.volume = target;
        if (onDone) onDone();
        return;
      }
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / (duration * 1000));
        audio.volume = Math.max(0, start + (target - start) * ease(k));
        if (k < 1) rafRef.current = requestAnimationFrame(step);
        else if (onDone) onDone();
      };
      rafRef.current = requestAnimationFrame(step);
    };

    if (active) {
      const target = narrationActive ? DUCK_VOL : BASE_VOL;
      const starting = audio.volume < 0.02;
      fadeTo(target, starting ? FADE_IN : DUCK_FADE);
      if (audio.paused) audio.play().catch(() => { /* autoplay can be blocked before a gesture */ });
    } else {
      fadeTo(0, FADE_OUT, () => { try { audio.pause(); } catch { /* */ } });
    }
  }, [active, narrationActive]);

  // Autoplay can block the unmuted soundscape in strict / iframe contexts. A
  // one-time tap anywhere unlocks it so the ambient bed is never silent.
  useEffect(() => {
    if (!active) return;
    const unlock = () => {
      const a = audioRef.current;
      if (a && a.paused) a.play().catch(() => { /* */ });
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [active]);
}