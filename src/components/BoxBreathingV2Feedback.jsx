import React, { useEffect, useRef, useState } from "react";
import { HELPFULNESS } from "@/lib/attemptFeedback";

export default function BoxBreathingV2Feedback({ onContinue }) {
  const [answer, setAnswer] = useState(null);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return (
    <section className="my-auto w-full max-w-md px-3 py-6 text-center">
      <h2 ref={heading} tabIndex={-1} className="font-heading text-3xl text-cream outline-none">Was Box Breathing helpful?</h2>
      <p className="mt-3 text-sm leading-relaxed text-cream/75">Optional. Your answer helps tailor future recommendations. It is separate from your before-and-after rating.</p>
      <div role="group" aria-label="Optional Box Breathing helpfulness" className="mt-6 grid grid-cols-2 gap-3">
        {HELPFULNESS.map(({ id, label }) => (
          <button key={id} type="button" aria-pressed={answer === id} onClick={() => setAnswer(id)}
            className={`min-h-12 rounded-2xl border px-3 py-3 text-sm text-cream ${answer === id ? "border-cream/70 bg-white/15" : "border-white/20 bg-white/5"}`}>
            {label}
          </button>
        ))}
      </div>
      <p className="mt-4 min-h-12 text-sm leading-relaxed text-cream/75" role="status">
        {answer === "worse" ? "There’s no need to force it. Let your breath return to its own rhythm; you can stop here." : "Next, you can answer the same question you started with, or skip it."}
      </p>
      <button type="button" onClick={() => onContinue(answer || undefined)}
        className="mt-4 min-h-12 w-full rounded-full bg-white/15 px-6 py-3 font-medium text-cream">Continue</button>
      <button type="button" onClick={() => onContinue(undefined)}
        className="mt-2 min-h-11 rounded-full px-6 py-3 text-sm text-cream/75">Skip helpfulness</button>
    </section>
  );
}
