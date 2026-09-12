import { useEffect, useRef } from "react";

// Progressive Muscle Relaxation V2 uses the uploaded MP3 soundscape referenced
// by the project asset path, while the spoken narration remains active.
// This mirrors the Box Breathing / Grounding V2 pattern: a single ambient track
// that fades in, ducks during spoken lines, and fades out cleanly on exit.

const MP3_URL = "/media/audio/PMR%20V2%20background%20music.mp3";

const BASE_VOL = 0.22;
const DUCK_VOL = 0.07;
const FADE_IN = 1.4;
const FADE_OUT = 1.2;
const DUCK_FADE = 0.5;

const ease = (t) => t * t * (3 - 2 * t);

export function usePMRSoundscape({ active, running, narrationActive }) {
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

    if (active && running) {
      const target = narrationActive ? DUCK_VOL : BASE_VOL;
      const starting = audio.volume < 0.02;
      fadeTo(target, starting ? FADE_IN : DUCK_FADE);
      if (audio.paused) audio.play().catch(() => { /* autoplay can be blocked before a gesture */ });
    } else {
      fadeTo(0, FADE_OUT, () => { try { audio.pause(); } catch { /* */ } });
    }
  }, [active, running, narrationActive]);

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
