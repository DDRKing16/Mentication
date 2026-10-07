import { GROUNDING_FEEDBACK } from "@/lib/groundingExperience";

export default function GroundingFeedback({ onComplete, feedback, helpfulness, onFeedback, onHelpfulness, step = "presence", onStep }) {
  const presence = step !== "helpfulness";
  const selected = GROUNDING_FEEDBACK.find(item => item.value === feedback);
  return <section className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col text-center" aria-labelledby="grounding-feedback-title">
    <div className="min-h-0 flex-1 overflow-y-auto px-1 py-5"><div className="flex flex-col gap-4">
    {!presence && <button type="button" className="min-h-11 self-start underline" onClick={()=>onStep("presence")}>Back</button>}
    <h2 id="grounding-feedback-title" tabIndex={-1} className="font-heading text-3xl leading-tight outline-none">{presence ? "How did grounding feel?" : "Was this practice helpful?"}</h2>
    <p>Optional. An honest answer is enough.</p>
    <fieldset className="flex flex-col gap-3"><legend className="sr-only">{presence ? "Presence after grounding, optional" : "Helpfulness after grounding, optional"}</legend>
      {presence ? GROUNDING_FEEDBACK.map(({value,label})=><button key={value} type="button" className={`min-h-12 rounded-2xl border px-5 py-3 ${feedback===value?"bg-white/90":"bg-white/40"}`} aria-pressed={feedback===value} onClick={()=>onFeedback(value)}>{label}</button>) : [["helpful","Helpful"],["same","No difference"],["worse","Made things worse"],["unsure","Not sure"]].map(([value,label])=><button key={value} type="button" className={`min-h-12 rounded-2xl border px-5 py-3 ${helpfulness===value?"bg-white/90":"bg-white/40"}`} aria-pressed={helpfulness===value} onClick={()=>onHelpfulness(value)}>{label}</button>)}
    </fieldset>
    {presence && selected && <p role="status">{selected.next}</p>}
    {!presence && helpfulness==="worse" && <p role="status">You can stop here or choose Another way. There is no need to repeat the senses.</p>}
    </div></div>
    <div className="flex shrink-0 flex-col gap-1 py-2">
    <button type="button" className="min-h-14 w-full rounded-full bg-white/90 px-5 py-3 font-medium" onClick={()=>onComplete(feedback,helpfulness)}>Continue to final rating</button>
    {presence && <button type="button" className="min-h-11 underline" onClick={()=>onStep("helpfulness")}>Rate helpfulness · optional</button>}
    <button type="button" className="min-h-11 underline" onClick={()=>presence?onComplete(null,null):onComplete(feedback,null)}>{presence?"Skip feedback":"Skip helpfulness"}</button>
    </div>
  </section>;
}
