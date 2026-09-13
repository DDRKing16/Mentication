import { useEffect, useRef } from "react";

const SOUNDTRACK_URL = "/media/audio/grounding-soundscape.mp3";
const BASE_VOLUME = 0.16;
const DUCKED_VOLUME = 0.055;
const STAGE_CHORDS = [
  [523.25, 659.25],
  [587.33, 739.99],
  [659.25, 830.61],
  [783.99, 987.77],
  [698.46, 880],
  [587.33, 783.99],
];

const ease = (value) => value * value * (3 - 2 * value);

export function useUrgeSurfSoundscape({ active, enabled, narrationActive, stageIndex }) {
  const audioRef = useRef(null);
  const contextRef = useRef(null);
  const fadeRef = useRef(0);
  const previousStageRef = useRef(null);

  useEffect(() => {
    const audio = new Audio(SOUNDTRACK_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) contextRef.current = new AudioContext();
    } catch {
      contextRef.current = null;
    }

    return () => {
      cancelAnimationFrame(fadeRef.current);
      const current = audioRef.current;
      if (current) {
        const from = current.volume;
        const startedAt = performance.now();
        const fadeOut = (now) => {
          const progress = Math.min(1, (now - startedAt) / 900);
          current.volume = Math.max(0, from * (1 - ease(progress)));
          if (progress < 1) requestAnimationFrame(fadeOut);
          else {
            current.pause();
            current.src = "";
          }
        };
        requestAnimationFrame(fadeOut);
      }
      contextRef.current?.close().catch(() => {});
      audioRef.current = null;
      contextRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;
    cancelAnimationFrame(fadeRef.current);
    const target = active && enabled ? (narrationActive ? DUCKED_VOLUME : BASE_VOLUME) : 0;
    const from = audio.volume;
    const startedAt = performance.now();
    const duration = from < 0.01 && target > 0 ? 1400 : 450;
    const fade = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      audio.volume = Math.max(0, from + (target - from) * ease(progress));
      if (progress < 1) fadeRef.current = requestAnimationFrame(fade);
      else if (target === 0) audio.pause();
    };
    if (target > 0 && audio.paused) audio.play().catch(() => {});
    fadeRef.current = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(fadeRef.current);
  }, [active, enabled, narrationActive]);

  useEffect(() => {
    if (!active || !enabled || previousStageRef.current === stageIndex) return;
    previousStageRef.current = stageIndex;
    const context = contextRef.current;
    if (!context) return;

    const play = () => {
      const start = context.currentTime + 0.015;
      const chord = STAGE_CHORDS[stageIndex] || STAGE_CHORDS[0];
      chord.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = index === 0 ? "sine" : "triangle";
        oscillator.frequency.setValueAtTime(frequency, start);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.015, start + 0.55);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(index === 0 ? 0.045 : 0.026, start + 0.045);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.72);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start + index * 0.035);
        oscillator.stop(start + 0.76);
      });
    };

    if (context.state === "suspended") context.resume().then(play).catch(() => {});
    else play();
  }, [active, enabled, stageIndex]);

  useEffect(() => {
    if (!active || !enabled) return undefined;
    const unlock = () => {
      contextRef.current?.resume().catch(() => {});
      const audio = audioRef.current;
      if (audio?.paused) audio.play().catch(() => {});
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, [active, enabled]);
}
