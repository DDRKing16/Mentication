// =====================================================================
// PRODUCTION-LOCKED · Box Breathing V2 (approved benchmark)
// Do NOT change visuals, timing, narration, audio, layout or
// functionality without an explicit request. Benchmark standard for
// future Mentication interventions. Spec: docs/box-breathing-v2-spec.md
// =====================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getNarration } from "@/lib/narrationService";

const FADE_IN_MS = 300;
const FADE_OUT_MS = 160;
const ease = (t) => t * t * (3 - 2 * t);

// Split the displayed body into tokens (words / whitespace / punctuation-only
// decorations) and assign each word a zero-based index that maps 1:1 to the
// spoken-word alignment. Punctuation-only tokens (e.g. the em dash) are tied
// to the next spoken word so they reveal with it, preserving natural wrapping.
function buildTokens(body) {
  const raw = body.match(/\S+|\s+/g) || [];
  let wi = 0;
  const list = raw.map((t) => {
    if (!t.trim()) return { text: t, space: true };
    if (/\w/.test(t)) return { text: t, word: true, wordIndex: wi++ };
    return { text: t, decoration: true };
  });
  let lastWi = -1;
  for (let i = 0; i < list.length; i++) {
    if (list[i].word) lastWi = list[i].wordIndex;
    else if (list[i].decoration) {
      let nw = -1;
      for (let j = i + 1; j < list.length; j++) if (list[j].word) { nw = list[j].wordIndex; break; }
      list[i].wordIndex = nw !== -1 ? nw : lastWi !== -1 ? lastWi : 0;
    }
  }
  return { list, wordCount: wi };
}

// Word-synced reveal for the Box Breathing V2 "Find your seat" instruction
// screen. Reads the local narration manifest (audio url + word-level
// alignment), plays it on a dedicated audio element mirroring the shared
// narrator's fade / lead / playback-rate, and reveals each displayed word as
// it is spoken by reading the audio element's currentTime against the
// alignment.
//
// - "BREATHE" / title stay visible (rendered by the frame); the instruction
//   body starts hidden and is revealed word by word.
// - When narration is muted the full instruction is shown immediately.
// - If alignment never arrives or the audio fails, the full instruction is
//   revealed so it is never stuck blank.
export function useBoxV2WordReveal({ body, spoken, rate = 0.82, leadMs = 0, narrate, running, onEnd }) {
  const { list: tokens, wordCount } = useMemo(() => buildTokens(body || ""), [body]);

  const audioRef = useRef(null);
  const [alignment, setAlignment] = useState(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(0);
  const [revealAll, setRevealAll] = useState(false);

  const aligned = Array.isArray(alignment) && alignment.length > 0;

  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const leadRef = useRef(null);
  const fadeIdRef = useRef(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const fireEnd = useCallback(() => {
    if (!endedRef.current) { endedRef.current = true; onEndRef.current?.(); }
  }, []);

  const fadeTo = (audio, to, ms, done) => {
    if (fadeIdRef.current) cancelAnimationFrame(fadeIdRef.current);
    const from = audio.volume;
    if (!ms || from === to) { audio.volume = to; if (done) done(); return; }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / ms);
      audio.volume = from + (to - from) * ease(t);
      if (t < 1) fadeIdRef.current = requestAnimationFrame(step);
      else { fadeIdRef.current = null; audio.volume = to; if (done) done(); }
    };
    fadeIdRef.current = requestAnimationFrame(step);
  };

  // Fetch aligned audio + alignment once per spoken text.
  useEffect(() => {
    let cancelled = false;
    setReady(false); setFailed(false); setAlignment(null);
    setRevealAll(false); setVisible(0);
    startedRef.current = false; endedRef.current = false;
    if (!spoken) { setReady(true); return; }
    const narration = getNarration(spoken);
    if (!narration?.url) { setFailed(true); return; }
    const url = narration.url;
    const al = narration.alignment;
    const audio = new Audio();
    audio.preload = "auto";
    audio.preservesPitch = true;
    audio.src = url;
    audioRef.current = audio;
    if (Array.isArray(al) && al.length) setAlignment(al);
    audio.addEventListener("canplay", () => { if (!cancelled) setReady(true); }, { once: true });
    audio.addEventListener("error", () => { if (!cancelled) setFailed(true); }, { once: true });
    return () => {
      cancelled = true;
      if (leadRef.current) { clearTimeout(leadRef.current); leadRef.current = null; }
      const audio = audioRef.current;
      if (audio) {
        if (fadeIdRef.current) cancelAnimationFrame(fadeIdRef.current);
        audio.onended = null;
        audio.pause();
        audio.src = "";
        audioRef.current = null;
      }
    };
  }, [spoken]);

  // When narration is muted, show the full instruction immediately.
  useEffect(() => {
    if (!narrate) setRevealAll(true);
  }, [narrate]);

  // Play / pause audio based on narrate + running + ready. First start applies
  // the lead and plays from 0; resuming after a pause just continues.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !ready || failed || revealAll) return;
    audio.onended = () => fireEnd();
    if (narrate && running) {
      if (!startedRef.current) {
        const begin = () => {
          if (audio.currentTime > 0) audio.currentTime = 0;
          audio.playbackRate = rate;
          audio.volume = 0;
          endedRef.current = false;
          const p = audio.play();
          const up = () => fadeTo(audio, 1, FADE_IN_MS);
          if (p && p.then) p.then(up).catch(() => {});
          else up();
          startedRef.current = true;
        };
        if (leadMs > 0) { clearTimeout(leadRef.current); leadRef.current = setTimeout(begin, leadMs); }
        else begin();
      } else if (audio.paused) {
        audio.volume = 0;
        const p = audio.play();
        const up = () => fadeTo(audio, 1, FADE_IN_MS);
        if (p && p.then) p.then(up).catch(() => {});
        else up();
      }
    } else {
      if (!audio.paused) fadeTo(audio, 0, FADE_OUT_MS, () => audio.pause());
    }
  }, [narrate, running, ready, failed, revealAll, rate, leadMs, fireEnd]);

  // Reveal words by reading the audio element's currentTime against the
  // alignment. If the alignment word count doesn't match the displayed text,
  // reveal the whole instruction at once so nothing is stuck hidden.
  useEffect(() => {
    let raf;
    const loop = () => {
      const audio = audioRef.current;
      if (!revealAll && !endedRef.current && aligned && audio) {
        const t = audio.currentTime;
        let count = 0;
        for (let i = 0; i < alignment.length; i++) {
          if (alignment[i].start <= t) count++;
          else break;
        }
        if (alignment.length !== wordCount) {
          setRevealAll(true);
        } else {
          setVisible((c) => (count !== c ? count : c));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [aligned, alignment, revealAll, wordCount]);

  // Hard failure (audio/alignment could not be generated) → reveal the full
  // instruction so it is never stuck blank, and signal completion.
  useEffect(() => {
    if (failed) { setRevealAll(true); fireEnd(); }
  }, [failed, fireEnd]);

  // Autoplay can block the narration audio in strict / iframe contexts. A
  // one-time tap unlocks it so the instruction is never silent.
  useEffect(() => {
    if (!narrate) return;
    const unlock = () => {
      const audio = audioRef.current;
      if (audio && audio.paused && !revealAll) {
        audio.playbackRate = rate;
        const p = audio.play();
        const up = () => fadeTo(audio, 1, FADE_IN_MS);
        if (p && p.then) p.then(up).catch(() => {});
        else up();
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [narrate]);

  return { tokens, wordCount, visibleCount: revealAll ? wordCount : visible, revealAll };
}