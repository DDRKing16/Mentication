import React, { useEffect, useRef, useState } from "react";
import { useWordReveal } from "@/hooks/useWordReveal";
import GroundingScene from "@/components/grounding54321/GroundingScene";
import StageMarkers from "@/components/grounding54321/StageMarkers";
import { INK, STAGES } from "@/lib/grounding54321Layout";
import { GROUNDING_ALTERNATIVES, groundingProgress } from "@/lib/groundingExperience";
import "@/styles/grounding-accessibility.css";
import { hapticPattern } from "@/lib/feedback";

// 5-4-3-2-1 Grounding V2 — master premium sensory grounding stage.
//
// Renders the five stage markers, the uppercase sense label, the large serif
// heading, the pearl-glass GroundingScene, and the supporting narration text.
//
// The player supplies the single suggested-time clock; moving to another
// sense is always an explicit choice. Muted/reduced-motion guidance stays
// fully readable without waiting for word animation.
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
  reducedMotion = false,
}) {
  const [narrationDone, setNarrationDone] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const alternativeRef = useRef(null);
  useEffect(() => {
    if (showAlternative) alternativeRef.current?.scrollIntoView({ block: "nearest" });
  }, [showAlternative]);

  const holdSec = step?.holdSec ?? 10;
  const sense = step?.sense;
  const stage = STAGES.find((s) => s.sense === sense);
  const progress = groundingProgress(stepRemaining, holdSec);
  const remainingSec = (narrationDone || !narrate) ? Math.max(0, Math.ceil(stepRemaining ?? holdSec)) : holdSec;

  useEffect(() => {
    if (discreet || reducedMotion || !running) return;
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
  }, [sense, discreet, reducedMotion]);

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

  // The player owns elapsed time. The visual never advances on a second RAF clock.
  useEffect(() => {
    setNarrationDone(false);
    setShowAlternative(false);
  }, [spoken, sense]);

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <StageMarkers activeSense={sense} reducedMotion={reducedMotion || !running} />

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
          aria-live="off"
        >
          {remainingSec > 0 ? `${remainingSec}s suggested time` : "Move on whenever you are ready"}
        </p>
      )}

      <GroundingScene sense={sense} progress={progress} running={running} reducedMotion={reducedMotion} discreet={discreet} />

      {(showBody || !narrate || reducedMotion || !running) && (
        <div className="grounding-instruction -mt-8 flex w-full max-w-md flex-col items-center gap-1.5 px-4 text-center sm:-mt-7">
          <p
            className="grounding-instruction-sentence text-[17px] leading-[1.7] text-balance sm:text-[19px]"
            style={{ color: INK }}
          >
            {tokens.map((t, i) => {
              if (t.space) return <span key={i}>{t.text}</span>;
              const vis = reducedMotion || !narrate || !running || revealAll || (t.wordIndex != null && t.wordIndex < visibleCount);
              return (
                <span key={i} style={{ opacity: vis ? 1 : 0 }}>
                  {t.text}
                </span>
              );
            })}
          </p>
        </div>
      )}
      <div className="flex w-full max-w-md flex-col items-center gap-3 px-4 text-center" style={{ color: INK }}>
        <p className="text-sm">Take as long as you need. You can move on without finding every item.</p>
        <details className="w-full text-left text-base leading-relaxed"><summary className="cursor-pointer text-center underline">How to practise · optional</summary><p className="mt-3">Notice a detail that is already here: a colour, the contact of clothes, or a sound. If attention wanders, come back to one comfortable detail. You do not need to find the full number or feel a particular change.</p><p className="mt-2">Choose Next sense when you want, use the alternative below, or finish early. The time is a suggestion.</p></details>
        {GROUNDING_ALTERNATIVES[sense] && <>
          <button type="button" className="rounded-full border border-current px-5 py-3 text-sm" aria-expanded={showAlternative} onClick={() => setShowAlternative((value) => !value)}>Try another sense instead</button>
          {showAlternative && <p ref={alternativeRef} className="text-base leading-relaxed" role="status">{GROUNDING_ALTERNATIVES[sense]}</p>}
        </>}
      </div>
    </div>
  );
}