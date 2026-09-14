import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchNarration, getNarration } from "@/lib/narrationService";

// Generic word-by-word narration sync — mirrors the approved production
// pattern used by Box Breathing V2, extracted as a reusable, intervention-
// agnostic hook. This is a SEPARATE implementation (not a shared import of the
// production-locked Box Breathing V2 hook) so that intervention stays untouched.
//
// Reads the local narration manifest (audio url + word-level alignment),
// plays it on a dedicated audio element mirroring the shared narrator's fade /
// lead / playback-rate, and reveals each displayed word as it is spoken by
// reading the audio element's currentTime against the alignment.
//
// - The body starts hidden and is revealed word by word as the narrator speaks.
// - When narration is muted the full body is shown immediately.
// - If alignment never arrives or the audio fails, the full body is revealed so
//   it is never stuck blank.
//
// `body` is the displayed text; `spoken` is the spoken string (typically
// `spokenFor(step, iv, direction)`). Their word counts must match for a
// synced reveal; if they don't, the whole body reveals at once (graceful).

const FADE_IN_MS = 300;
const FADE_OUT_MS = 160;
const CLIP_FADE_OUT_MS = 24;
const ease = (t) => t * t * (3 - 2 * t);

// Split the displayed body into tokens (words / whitespace / punctuation-only
// decorations) and assign each word a zero-based index that maps 1:1 to the
// spoken-word alignment. Punctuation-only tokens are tied to the next spoken
// word so they reveal with it, preserving natural wrapping.
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

// Fallback word timing when a narration clip exists but has no alignment.
// Even spacing keeps the same word-by-word feel instead of dumping all text.
function buildSyntheticAlignment(wordCount, durationSec) {
  if (!wordCount || !Number.isFinite(durationSec) || durationSec <= 0) return [];
  const total = Math.max(0.7, durationSec);
  const head = Math.min(0.16, total * 0.12);
  const tail = Math.min(0.12, total * 0.08);
  const span = Math.max(0.24, total - head - tail);
  const step = span / wordCount;
  return Array.from({ length: wordCount }, (_, i) => {
    const start = head + i * step;
    const end = head + (i + 0.82) * step;
    return { word: `w${i + 1}`, start: Number(start.toFixed(3)), end: Number(end.toFixed(3)) };
  });
}

export function useWordReveal({ body, spoken, rate = 0.82, leadMs = 0, narrate, running, onEnd, allowRemoteFallback = true }) {
  const { list: tokens, wordCount } = useMemo(() => buildTokens(body || ""), [body]);

  const audioRef = useRef(null);
  const [alignment, setAlignment] = useState(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(0);
  const [revealAll, setRevealAll] = useState(false);

  const aligned = Array.isArray(alignment) && alignment.length > 0;
  const revealAlignment = useMemo(() => {
    if (!aligned) return [];
    // If spoken has extra trailing words versus displayed body, reveal and end
    // against the displayed-word subset so audible narration does not continue
    // beyond what's on screen.
    if (alignment.length > wordCount && wordCount > 0) return alignment.slice(0, wordCount);
    return alignment;
  }, [aligned, alignment, wordCount]);
  const hasTrailingNarrationWords = useMemo(
    () => aligned && alignment.length > revealAlignment.length,
    [aligned, alignment, revealAlignment]
  );
  const clipEndAt = useMemo(() => {
    if (!aligned || !revealAlignment.length) return null;
    const lastEnd = revealAlignment[revealAlignment.length - 1].end;
    // If spoken has extra trailing words, clip before the next word starts.
    if (alignment.length > revealAlignment.length) {
      const next = alignment[revealAlignment.length];
      if (next?.start > lastEnd) {
        const early = next.start - 0.08;
        const late = lastEnd + 0.02;
        return Math.max(lastEnd, Math.min(early, late));
      }
    }
    return lastEnd + 0.08;
  }, [aligned, alignment, revealAlignment]);

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

    const attachNarration = (narration) => {
      if (!narration?.url) { setFailed(true); return; }
      const url = narration.url;
      const al = narration.alignment;
      const audio = new Audio();
      audio.preload = "auto";
      audio.preservesPitch = true;
      audio.src = url;
      audioRef.current = audio;
      if (Array.isArray(al) && al.length) {
        setAlignment(al);
      } else {
        // Keep tokens hidden until we derive timing from duration.
        setAlignment(null);
        audio.addEventListener("loadedmetadata", () => {
          if (cancelled) return;
          const synthetic = buildSyntheticAlignment(wordCount, audio.duration);
          if (synthetic.length) setAlignment(synthetic);
          else setRevealAll(true);
        }, { once: true });
      }
      audio.addEventListener("canplay", () => { if (!cancelled) setReady(true); }, { once: true });
      audio.addEventListener("error", () => { if (!cancelled) setFailed(true); }, { once: true });
    };

    const local = getNarration(spoken);
    if (local?.url) {
      attachNarration(local);
      // If local audio is present but unaligned, try to upgrade to aligned data
      // in the background without blocking immediate playback. Skipped when
      // remote fallback is disabled (PMR V2 must stay fully local).
      if (allowRemoteFallback && !(Array.isArray(local.alignment) && local.alignment.length)) {
        fetchNarration(spoken, { withAlignment: true }).then((remote) => {
          if (cancelled) return;
          if (Array.isArray(remote?.alignment) && remote.alignment.length) {
            setAlignment(remote.alignment);
          }
        });
      }
    } else {
      // Some callers (e.g. PMR V2) must never trigger a live/backend narration
      // request — they only ever use pre-generated local narration. When
      // disabled, a manifest miss fails immediately instead of calling out.
      if (!allowRemoteFallback) {
        setFailed(true);
        return;
      }
      const alignedJob = fetchNarration(spoken, { withAlignment: true }).then((r) => (r?.url ? r : null));
      const plainJob = fetchNarration(spoken, { withAlignment: false }).then((r) => (r?.url ? r : null));

      Promise.any([
        alignedJob.then((r) => (r ? r : Promise.reject(new Error("no aligned clip")))),
        plainJob.then((r) => (r ? r : Promise.reject(new Error("no plain clip")))),
      ])
        .then((winner) => {
          if (cancelled) return;
          attachNarration(winner);
        })
        .catch(() => {
          if (cancelled) return;
          setFailed(true);
        });
    }

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
  }, [spoken, allowRemoteFallback]);

  // When narration is muted, show the full body immediately.
  useEffect(() => {
    if (!narrate) setRevealAll(true);
  }, [narrate]);

  // Play / pause audio based on narrate + running + ready.
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

  // Reveal words strictly from the audio element's playhead so on-screen text
  // advances only while narration is actually speaking.
  useEffect(() => {
    let raf;
    const loop = () => {
      if (revealAll || endedRef.current || !aligned) return;
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        const t = audio.currentTime;
        let count = 0;
        for (let i = 0; i < revealAlignment.length; i++) {
          if (revealAlignment[i].start <= t) count++;
          else break;
        }
        setVisible((c) => (count !== c ? count : c));
        // Advance once the displayed-text alignment has completed. This also
        // safely clips entries where spoken text has extra trailing words.
        if (revealAlignment.length && clipEndAt != null && t >= clipEndAt && !endedRef.current) {
          if (hasTrailingNarrationWords) {
            fadeTo(audio, 0, CLIP_FADE_OUT_MS, () => {
              audio.pause();
              fireEnd();
            });
          } else {
            fadeTo(audio, 0, FADE_OUT_MS, () => {
              audio.pause();
              fireEnd();
            });
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    if (!revealAll && !endedRef.current && aligned) {
      raf = requestAnimationFrame(loop);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [aligned, revealAlignment, hasTrailingNarrationWords, clipEndAt, revealAll, fireEnd]);

  // Hard failure → reveal the full body and signal completion.
  useEffect(() => {
    if (failed) { setRevealAll(true); fireEnd(); }
  }, [failed, fireEnd]);

  // Autoplay can block the narration audio in strict / iframe contexts. A
  // one-time tap unlocks it so the body is never silent.
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