import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

export const AMBIENT_PAUSE_EVENT = "mentication:ambient-pause";
export const AMBIENT_RESUME_EVENT = "mentication:ambient-resume";
export const AMBIENT_TOGGLE_EVENT = "mentication:ambient-toggle";
export const AMBIENT_STATE_EVENT = "mentication:ambient-state";
export const AMBIENT_MUTED_KEY = "mentation.homeMusic.muted.v1";

function readMuted() {
  try { return localStorage.getItem(AMBIENT_MUTED_KEY) === "1"; }
  catch { return false; }
}

export function setAmbientMuted(value) {
  try { localStorage.setItem(AMBIENT_MUTED_KEY, value ? "1" : "0"); } catch {}
  window.dispatchEvent(new CustomEvent(AMBIENT_TOGGLE_EVENT, { detail: { muted: value } }));
}

export default function AmbientHomeMusic() {
  const location = useLocation();
  const audioRef = useRef(null);
  const pausedRef = useRef(false);
  const gestureUnlockedRef = useRef(false);
  const [muted, setMuted] = useState(readMuted);

  const publish = (nextMuted = muted) => {
    window.dispatchEvent(new CustomEvent(AMBIENT_STATE_EVENT, {
      detail: { muted: nextMuted, pausedForIntervention: pausedRef.current },
    }));
  };

  const tryPlay = async () => {
    const audio = audioRef.current;
    if (!audio || readMuted() || pausedRef.current) return;
    try { await audio.play(); } catch {}
  };

  useEffect(() => {
    const audio = new Audio("/audio/home-ambient.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.35;
    audioRef.current = audio;

    const unlock = () => {
      gestureUnlockedRef.current = true;
      void tryPlay();
    };
    const pauseForIntervention = () => {
      pausedRef.current = true;
      audio.pause();
      publish(readMuted());
    };
    const resumeOutsideIntervention = () => {
      pausedRef.current = false;
      if (gestureUnlockedRef.current) void tryPlay();
      publish(readMuted());
    };
    const toggle = (event) => {
      const nextMuted = typeof event?.detail?.muted === "boolean" ? event.detail.muted : !readMuted();
      try { localStorage.setItem(AMBIENT_MUTED_KEY, nextMuted ? "1" : "0"); } catch {}
      setMuted(nextMuted);
      audio.muted = nextMuted;
      if (nextMuted) audio.pause();
      else if (!pausedRef.current && gestureUnlockedRef.current) void tryPlay();
      publish(nextMuted);
    };

    audio.muted = readMuted();
    window.addEventListener(AMBIENT_PAUSE_EVENT, pauseForIntervention);
    window.addEventListener(AMBIENT_RESUME_EVENT, resumeOutsideIntervention);
    window.addEventListener(AMBIENT_TOGGLE_EVENT, toggle);
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    publish(readMuted());

    return () => {
      window.removeEventListener(AMBIENT_PAUSE_EVENT, pauseForIntervention);
      window.removeEventListener(AMBIENT_RESUME_EVENT, resumeOutsideIntervention);
      window.removeEventListener(AMBIENT_TOGGLE_EVENT, toggle);
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && pausedRef.current) {
      pausedRef.current = false;
      if (gestureUnlockedRef.current && !muted) void tryPlay();
      publish(muted);
    }
  }, [location.pathname, muted]);

  return null;
}
