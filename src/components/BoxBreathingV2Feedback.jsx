import React, { useEffect, useRef } from "react";
import { HELPFULNESS } from "@/lib/attemptFeedback";

export default function BoxBreathingV2Feedback({ onContinue, answer = null, onAnswer }) {
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return (
    <section className="flex min-h-0 w-full max-w-md flex-1 flex-col text-center">
      <div className="min-h-0 flex-1 overflow-y-auto px-1 py-5">
      <h2 ref={heading} tabIndex={-1} className="font-heading text-3xl leading-tight text-cream outline-none">Was Box Breathing helpful?</h2>
      <p className="mt-3 text-sm leading-relaxed text-cream/75">Optional. Choose the answer closest to your experience.</p>
      <div role="group" aria-label="Optional Box Breathing helpfulness" className="mt-6 grid grid-cols-1 gap-3">
        {HELPFULNESS.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={answer === id} onClick={() => onAnswer(id)}
            className={`min-h-12 rounded-2xl border px-3 py-3 text-base text-cream ${answer === id ? "border-cream/70 bg-white/15" : "border-white/20 bg-white/5"}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-4 min-h-12 text-sm leading-relaxed text-cream/75" role="status">
        {answer === "worse" ? "There’s no need to force it. Let your breath return to its own rhythm; you can stop here." : "Next, you can answer the same question you started with, or skip it."}
      </p>
      </div>
      <div className="flex shrink-0 flex-col py-2">
      <button type="button" onClick={() => onContinue(answer || undefined)}
        className="mt-4 min-h-12 w-full rounded-full bg-white/15 px-6 py-3 font-medium text-cream">Continue</button>
      <button type="button" onClick={() => onContinue(undefined)}
        className="mt-2 min-h-11 rounded-full px-6 py-3 text-sm text-cream/75">Skip helpfulness</button>
      </div>
    </section>
  );
}
