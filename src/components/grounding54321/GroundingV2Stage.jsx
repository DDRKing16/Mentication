import React, { useEffect, useRef, useState } from "react";
import { useWordReveal } from "@/hooks/useWordReveal";
import GroundingScene from "@/components/grounding54321/GroundingScene";
import StageMarkers from "@/components/grounding54321/StageMarkers";
import { INK, STAGES } from "@/lib/grounding54321Layout";
import { hapticPattern } from "@/lib/feedback";

// 5-4-3-2-1 Grounding V2 — master premium sensory grounding stage.
//
// Renders the five stage markers, the uppercase sense label, the large serif
// heading, the pearl-glass GroundingScene, and the supporting narration text.
//
// Narration is owned here via `useWordReveal` (the approved production
// word-by-word pattern) — each word appears exactly when the narrator speaks
// it; nothing is shown before narration begins. The shared ResetPlayer
// narrator is skipped for Grounding V2.
//
// The stage timer (and the sensory illumination + progress arc) begins ONLY
// after this stage's narration instruction finishes, then runs for the step's
// holdSec. ResetPlayer advances at the same point (it resets its elapsed
// counter on this stage's onNarrationEnd), so the arc and the advance stay in
// sync.
export default function GroundingV2Stage({
  step,
  running,
  showTimer,
  stepRemaining,
  discreet,
  narrate = false,
  rate = 0.82,
  leadMs = 0,
  spoken = "",
  onNarrationEnd,
  showBody = true,
}) {
  const [narrationDone, setNarrationDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const accumRef = useRef(0);

  const holdSec = step?.holdSec ?? 10;
  const sense = step?.sense;
  const stage = STAGES.find((s) => s.sense === sense);
  const isLast = sense === "taste";
  const remainingSec = narrationDone ? Math.max(0, Math.ceil(stepRemaining ?? holdSec)) : holdSec;

  useEffect(() => {
    switch (sense) {
      case "sight":
        hapticPattern([7]);
        break;
      case "touch":
        hapticPattern([8, 18, 6]);
        break;
      case "hearing":
        hapticPattern([6, 22, 5]);
        break;
      case "smell":
        hapticPattern([7, 14, 6]);
        break;
      case "taste":
        hapticPattern([9]);
        break;
      case "recenter":
        hapticPattern([7]);
        break;
      default:
        break;
    }
  }, [sense]);

  const { tokens, visibleCount, revealAll } = useWordReveal({
    body: step?.body,
    spoken,
    rate,
    leadMs,
    narrate,
    running,
    onEnd: () => {
      setNarrationDone(true);
      onNarrationEnd?.();
    },
  });

  // Reflection clock — accumulates only while running, from the moment
  // narration ends, across holdSec. Pauses cleanly with `running`.
  useEffect(() => {
    if (!narrationDone) {
      accumRef.current = 0;
      setProgress(0);
      return;
    }
    let raf;
    let last = null;
    const loop = (now) => {
      if (last != null && running) {
        accumRef.current = Math.min(holdSec, accumRef.current + (now - last) / 1000);
      }
      last = now;
      setProgress(holdSec > 0 ? accumRef.current / holdSec : 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [narrationDone, holdSec, running]);

  // Reset per stage.
  useEffect(() => {
    setNarrationDone(false);
    accumRef.current = 0;
    setProgress(0);
  }, [spoken, sense]);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <StageMarkers activeSense={sense} />

      <p
        className="text-[0.65rem] font-medium uppercase tracking-[0.28em]"
        style={{ color: `${INK}99` }}
      >
        {stage?.label ?? ""}
      </p>
      <h2
        className="font-heading text-[1.95rem] font-medium leading-[1.1] tracking-[-0.02em] text-balance sm:text-[2.3rem]"
        style={{ color: INK }}
      >
        {step?.title}
      </h2>

      {showTimer && (
        <p
          className="text-[0.7rem] font-medium uppercase tracking-[0.22em]"
          style={{ color: `${INK}99` }}
          aria-live="polite"
        >
          {remainingSec}s
        </p>
      )}

      <GroundingScene sense={sense} progress={progress} running={running} showArc={showTimer} isLast={isLast} />

      {showBody && (
        <div className="grounding-instruction -mt-8 flex w-full max-w-md flex-col items-center gap-1.5 px-4 text-center sm:-mt-7">
          <p
            className="grounding-instruction-sentence text-[17px] leading-[1.7] text-balance sm:text-[19px]"
            style={{ color: INK }}
          >
            {tokens.map((t, i) => {
              if (t.space) return <span key={i}>{t.text}</span>;
              const vis = revealAll || (t.wordIndex != null && t.wordIndex < visibleCount);
              return (
                <span key={i} style={{ opacity: vis ? 1 : 0 }}>
                  {t.text}
                </span>
              );
            })}
          </p>
        </div>
      )}
    </div>
  );
}