import { useEffect, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { pmrTiming, PMR_LEAD, PMR_RATE } from '@/lib/pmrSession';

// PMR-owned clock: narration, mute, pose and step completion share one timeline.
export function usePMRPlayback({ step, stepIndex, running, audioEnabled, onPause, onComplete }) {
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;
  const audioRef = useRef(null);
  const endedRef = useRef(false);
  const { duration } = pmrTiming(step);
  useEffect(() => {
    elapsedRef.current = 0;
    endedRef.current = false;
    setElapsed(0);
    const { narration } = pmrTiming(step);
    const audio = narration?.url ? new Audio(narration.url) : null;
    audioRef.current = audio;
    if (audio) { audio.preload = 'auto'; audio.playbackRate = PMR_RATE; }
    return () => { if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); } audioRef.current = null; };
  }, [step, stepIndex]);

  useEffect(() => {
    let disposed = false;
    const pause = () => onPause();
    const visibility = () => { if (document.hidden) pause(); };
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('freeze', pause);
    window.addEventListener('blur', pause);
    const listener = App.addListener('appStateChange', ({ isActive }) => { if (!isActive) pause(); });
    listener.then(handle => { if (disposed) handle.remove(); });
    return () => { disposed = true; document.removeEventListener('visibilitychange', visibility); document.removeEventListener('freeze', pause); window.removeEventListener('blur', pause); listener.then(handle => handle.remove()); };
  }, [onPause]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!running || !audioEnabled) audio?.pause();
    let raf;
    let previous = null;
    let playPending = false;
    const tick = now => {
      if (document.hidden) { previous = null; audio?.pause(); return; }
      if (previous != null && now - previous > 750) { audio?.pause(); onPause(); return; }
      const dt = previous == null ? 0 : Math.min(0.1, Math.max(0, (now - previous) / 1000));
      previous = now;
      elapsedRef.current = Math.min(duration, elapsedRef.current + dt);
      const t = elapsedRef.current;
      setElapsed(t);
      if (audio && audioEnabled && t >= PMR_LEAD) {
        const target = (t - PMR_LEAD) * PMR_RATE;
        if (Number.isFinite(audio.duration) && target < audio.duration) {
          if (Math.abs(audio.currentTime - target) > 0.25) audio.currentTime = target;
          if (audio.paused && !playPending) {
            playPending = true;
            audio.play().catch(() => {}).finally(() => { playPending = false; });
          }
        }
      }
      if (t >= duration) {
        audio?.pause();
        if (!endedRef.current) { endedRef.current = true; completeRef.current(); }
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    if (running) raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); audio?.pause(); };
  }, [step, stepIndex, running, audioEnabled, duration, onPause]);
  return elapsed;
}
