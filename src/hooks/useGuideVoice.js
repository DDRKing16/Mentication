import { useRef, useCallback, useEffect } from "react";
import { getNarration } from "@/lib/narrationService";

// Premium narration engine.
//
// Each spoken line owns its own preloaded HTMLAudioElement in a pool, so a
// line that's been warmed (preload / ahead-of-time) starts the instant it's
// requested — no src-swap click, no rebuffer. Transitions between lines are
// smoothed with requestAnimationFrame volume ramps (ease-in-out), tracked
// per-element so the outgoing fade and incoming fade run independently and
// never cancel each other. Playback rate is applied once, after metadata,
// and pitch is preserved so the voice stays natural and human.
//
// Narration audio is served entirely from the local narration manifest (see
// `@/lib/narrationService`) — no backend / network call is made to resolve a
// line's audio.

const TARGET_VOLUME = 1;
const FADE_IN_MS = 300;
const FADE_OUT_MS = 150;
const DEFAULT_VOICE = "river";
const DEFAULT_RATE = 0.80;

const ease = (t) => t * t * (3 - 2 * t);

export function useGuideVoice() {
  const poolRef = useRef(new Map());      // key -> { url, audio, ready }
  const fetchingRef = useRef(new Map());  // key -> Promise<audioEl|null>
  const currentRef = useRef(null);        // { key, audio }
  const leadRef = useRef(null);           // timeout id
  const pendingRef = useRef(null);        // key of the line we're switching to
  const requestSequenceRef = useRef(0);   // invalidates stale same-text requests

  const keyOf = (text, voice) => `${voice}|${text}`;

  const cancelFadeOf = (audio) => {
    if (audio && audio._fadeId) {
      cancelAnimationFrame(audio._fadeId);
      audio._fadeId = null;
    }
  };
  const cancelLead = () => {
    if (leadRef.current) { clearTimeout(leadRef.current); leadRef.current = null; }
  };

  const fadeTo = (audio, to, ms, done) => {
    cancelFadeOf(audio);
    const from = audio.volume;
    if (!ms || from === to) { audio.volume = to; if (done) done(); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      audio.volume = from + (to - from) * ease(t);
      if (t < 1) { audio._fadeId = requestAnimationFrame(step); }
      else { audio._fadeId = null; audio.volume = to; if (done) done(); }
    };
    audio._fadeId = requestAnimationFrame(step);
  };

  // Create a dedicated, preloaded audio element for the line from the local
  // narration manifest — no network round-trip.
  const ensure = useCallback((text, voice = DEFAULT_VOICE) => {
    const k = keyOf(text, voice);
    const pool = poolRef.current;
    const existing = pool.get(k);
    if (existing?.ready) return Promise.resolve(existing.audio);
    if (fetchingRef.current.has(k)) return fetchingRef.current.get(k);

    const p = Promise.resolve(getNarration(text)?.url || null)
      .then((url) => {
        if (!url) return null;
        let entry = pool.get(k);
        if (!entry) {
          const audio = new Audio();
          audio.preload = "auto";
          audio.preservesPitch = true;
          audio.mozPreservesPitch = true;
          audio.webkitPreservesPitch = true;
          audio.src = url;
          entry = { url, audio, ready: false };
          pool.set(k, entry);
        }
        return new Promise((resolve) => {
          const done = () => { entry.ready = true; resolve(entry.audio); };
          if (entry.ready) return resolve(entry.audio);
          if (entry.audio.readyState >= 2) return done();
          entry.audio.addEventListener("canplay", done, { once: true });
          entry.audio.addEventListener("error", () => resolve(null), { once: true });
        });
      })
      .catch(() => null)
      .finally(() => fetchingRef.current.delete(k));

    fetchingRef.current.set(k, p);
    return p;
  }, []);

  const stopCurrent = (immediate = false) => {
    cancelLead();
    const cur = currentRef.current;
    if (!cur) return;
    cur.audio.ontimeupdate = null;
    cur.audio.onended = null;
    if (immediate) { cancelFadeOf(cur.audio); cur.audio.pause(); cur.audio.volume = 0; }
    else fadeTo(cur.audio, 0, FADE_OUT_MS, () => cur.audio.pause());
  };

  const startLine = (key, audio, rate, leadMs, onEnd, onTimeUpdate, requestId) => {
    pendingRef.current = key;
    const begin = () => {
      if (pendingRef.current !== key || requestSequenceRef.current !== requestId) return;
      stopCurrent(false);
      if (audio.currentTime > 0) audio.currentTime = 0;
      audio.playbackRate = rate;
      audio.volume = 0;
      // Notify when this line finishes naturally so the player can wait for
      // the narrator before advancing — only fires for the active line.
      audio.onended = onEnd
        ? () => { if (currentRef.current && currentRef.current.key === key) onEnd(); }
        : null;
      audio.ontimeupdate = onTimeUpdate
        ? () => { if (currentRef.current && currentRef.current.key === key) onTimeUpdate(audio.currentTime); }
        : null;
      const p = audio.play();
      const launch = () => fadeTo(audio, TARGET_VOLUME, FADE_IN_MS);
      if (p && typeof p.then === "function") p.then(launch).catch(() => {});
      else launch();
      currentRef.current = { key, audio };
    };
    if (leadMs > 0) {
      cancelLead();
      leadRef.current = setTimeout(begin, leadMs);
    } else {
      begin();
    }
  };

  const speak = useCallback((text, opts = {}) => {
    if (!text) return;
    const voice = opts.voice || DEFAULT_VOICE;
    const rate = opts.rate ?? DEFAULT_RATE;
    const leadMs = opts.leadMs || 0;
    const onEnd = opts.onEnd || null;
    const onTimeUpdate = opts.onTimeUpdate || null;
    const key = keyOf(text, voice);
    const requestId = ++requestSequenceRef.current;
    pendingRef.current = key;

    ensure(text, voice).then((audio) => {
      if (pendingRef.current !== key || requestSequenceRef.current !== requestId) return;
      if (!audio) return;
      startLine(key, audio, rate, leadMs, onEnd, onTimeUpdate, requestId);
    });
  }, [ensure]);

  const stop = useCallback(() => {
    requestSequenceRef.current += 1;
    cancelLead();
    pendingRef.current = null;
    stopCurrent(true);
    currentRef.current = null;
  }, []);

  const pause = useCallback(() => {
    cancelLead();
    const cur = currentRef.current;
    if (cur && !cur.audio.paused) {
      fadeTo(cur.audio, 0, 160, () => cur.audio.pause());
    }
  }, []);

  const resume = useCallback(() => {
    const cur = currentRef.current;
    if (!cur) return;
    cancelFadeOf(cur.audio);
    if (!cur.audio.paused) {
      fadeTo(cur.audio, TARGET_VOLUME, FADE_IN_MS);
      return;
    }
    cur.audio.volume = 0;
    const p = cur.audio.play();
    const up = () => fadeTo(cur.audio, TARGET_VOLUME, FADE_IN_MS);
    if (p && typeof p.then === "function") p.then(up).catch(() => {});
    else up();
  }, []);

  const preload = useCallback((text, opts = {}) => {
    if (text) ensure(text, opts.voice || DEFAULT_VOICE);
  }, [ensure]);

  useEffect(() => () => {
    requestSequenceRef.current += 1;
    cancelLead();
    poolRef.current.forEach(({ audio }) => {
      cancelFadeOf(audio);
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.pause();
      audio.src = "";
    });
    poolRef.current.clear();
  }, []);

  return { speak, stop, pause, resume, preload };
}