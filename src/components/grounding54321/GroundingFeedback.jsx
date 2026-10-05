import { useState } from "react";
import { GROUNDING_FEEDBACK } from "@/lib/groundingExperience";

export default function GroundingFeedback({ onComplete, onTryAnother }) {
  const [feedback, setFeedback] = useState(null);
  const [helpfulness, setHelpfulness] = useState(null);
  const selected = GROUNDING_FEEDBACK.find((item) => item.value === feedback);
  return <section className="mx-auto flex max-w-md flex-col gap-5 px-6 py-8 text-center" aria-labelledby="grounding-feedback-title">
    <h2 id="grounding-feedback-title" className="font-heading text-3xl">How did grounding feel?</h2>
    <p>This is separate from your before-and-after rating.</p>
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Presence after grounding, optional</legend>
      {GROUNDING_FEEDBACK.map(({ value, label }) => <button key={value} type="button" className={`rounded-2xl border px-5 py-3 ${feedback === value ? "bg-white/90" : "bg-white/40"}`} aria-pressed={feedback === value} onClick={() => setFeedback(value)}>{label}</button>)}
    </fieldset>
    {selected && <p role="status">{selected.next}</p>}
    <fieldset className="flex flex-wrap justify-center gap-2"><legend className="mb-2">Was this practice helpful? <span className="text-sm">Optional</span></legend>
      {[["helpful", "Helpful"], ["same", "No difference"], ["worse", "Made things worse"], ["unsure", "Not sure"]].map(([value, label]) => <button key={value} type="button" className={`rounded-full border px-4 py-2 ${helpfulness === value ? "bg-white/90" : "bg-white/40"}`} aria-pressed={helpfulness === value} onClick={() => setHelpfulness(value)}>{label}</button>)}
    </fieldset>
    {onTryAnother && selected && feedback !== "more_present" && <button type="button" className="rounded-full border px-5 py-3" onClick={() => onTryAnother(feedback)}>Try another practice</button>}
    <button type="button" className="rounded-full bg-white/80 px-5 py-3" onClick={() => onComplete(feedback, helpfulness)}>Continue to final rating</button>
    <button type="button" className="text-sm underline" onClick={() => onComplete(null, null)}>Skip feedback</button>
  </section>;
}
