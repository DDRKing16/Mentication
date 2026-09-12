import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import "@/styles/thought-or-fact.css";
import {
  ArrowRight,
  Brain,
  Check,
  GitBranch,
  Heart,
  ChevronLeft,
  CircleHelp,
  Eye,
  FileText,
  FlaskConical,
  Plus,
  PenLine,
  Scale,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import InterventionControlShell from "@/components/InterventionControlShell";
import "@/styles/thought-or-fact.css";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { buildBalancedThought, buildThoughtOrFactLearningRecord, findThinkingTrapLanguage, normaliseThoughtOrFactDraft } from "@/lib/thoughtOrFactState";
import {
  clearActiveFlagship,
  getActiveFlagship,
  getFlagshipPreferences,
  recordHandoffDecision,
  rememberFlagshipEvent,
  saveActiveFlagship,
} from "@/lib/flagshipMemory";

const RECORD_KEY = "mentation.thought-or-fact.records.v1";

const CATEGORIES = [
  {
    id: "fact",
    label: "Fact",
    short: "What happened",
    prompt: "Could a camera, message or record verify this?",
    color: "#9ee7c1",
    icon: Eye,
  },
  {
    id: "interpretation",
    label: "Interpretation",
    short: "One possible meaning",
    prompt: "Is this one possible meaning rather than the only meaning?",
    color: "#efcf8c",
    icon: FileText,
  },
  {
    id: "prediction",
    label: "Prediction",
    short: "A future guess",
    prompt: "Is the mind forecasting something that has not happened?",
    color: "#9bc8f4",
    icon: FlaskConical,
  },
  {
    id: "catastrophe",
    label: "Worst-case leap",
    short: "When possibility feels certain",
    prompt: "Has possibility become certainty, permanence or total loss?",
    color: "#d8b0e8",
    icon: CircleHelp,
  },
  {
    id: "feeling",
    label: "Feeling",
    short: "An emotional response",
    prompt: "Is this describing how you feel rather than something to prove?",
    color: "#e7a9a9",
    icon: Heart,
  },
];

const STAGES = ["fit", "capture", "claims", "charge", "sort", "evidence", "ruling", "rerate", "direction", "complete"];

const THINKING_TRAPS = [
  { id: "mind-reading", title: "Mind reading", body: "Assuming you know what another person thinks.", icon: Brain },
  { id: "jumping-to-conclusions", title: "Jumping to conclusions", body: "Treating a possible meaning as certain.", icon: GitBranch },
  { id: "catastrophising", title: "Catastrophising", body: "Expecting the worst possible outcome.", icon: TriangleAlert },
  { id: "all-or-nothing", title: "All-or-nothing thinking", body: "Seeing only total success or total failure.", icon: CircleHelp },
  { id: "overgeneralising", title: "Overgeneralising", body: "Drawing a broad conclusion from one event.", icon: GitBranch },
  { id: "emotional-reasoning", title: "Emotional reasoning", body: "Treating a strong feeling as proof.", icon: Heart },
  { id: "mental-filter", title: "Mental filter", body: "Focusing on the painful detail and missing the rest.", icon: Eye },
  { id: "discounting-positives", title: "Discounting positives", body: "Dismissing evidence that does not fit the fear.", icon: Scale },
  { id: "labelling", title: "Labelling", body: "Turning one experience into a fixed judgement about yourself or someone else.", icon: FileText },
  { id: "personalising", title: "Personalising", body: "Taking responsibility for something with many possible causes.", icon: Brain },
  { id: "should-statements", title: "Should rules", body: "Holding yourself or others to a rigid rule.", icon: CircleHelp },
  { id: "magnifying-minimising", title: "Magnifying or minimising", body: "Making one part of the picture much bigger or smaller than it is.", icon: Scale },
];

const cleanSentence = (value = "") => value.replace(/\s+/g, " ").trim();

function splitThought(value) {
  const text = cleanSentence(value);
  if (!text) return [];
  const pieces = text
    .split(/(?<=[.!?;])\s+|\s+(?=(?:but|because|which means|so|and then|therefore)\b)/gi)
    .map((piece) => piece.trim())
    .filter(Boolean);
  return (pieces.length ? pieces : [text]).map((text, index) => ({ id: `fragment-${index}`, text }));
}

function defaultFairerView(thought, fragments, assignments, alternatives, uncertainties, evidence = {}) {
  const collect = (ids) => fragments.filter((fragment) => ids.includes(assignments[fragment.id])).map((fragment) => fragment.text);
  return {
    adaptive: buildBalancedThought({ thought, distortions: evidence.distortions, evidenceAgainst: evidence.evidenceAgainst, alternatives: [...alternatives, ...uncertainties, ...(evidence.interpretations || [])] }),
    known: (evidence.support?.length ? evidence.support : (evidence.facts?.length ? evidence.facts : collect(["fact"]))).join(" "),
    against: (evidence.evidenceAgainst || []).join(" "),
    added: (evidence.interpretations?.length ? evidence.interpretations : []).join(" "),
    open: [...alternatives, ...uncertainties, ...(evidence.predictions || [])].join(" "),
  };
}

function readSavedRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECORD_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecord(record) {
  try {
    const existing = readSavedRecords();
    if (existing.some((item) => item.thought === record.thought && item.ruling === record.ruling)) return true;
    const next = [record, ...existing].slice(0, 24);
    localStorage.setItem(RECORD_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function EvidenceMark({ category, count, active }) {
  const Icon = category.icon;
  return (
    <div className={`tof-seal tof-seal--${category.id} ${active ? "is-active" : ""}`} style={{ "--seal": category.color }}>
      <Icon aria-hidden="true" />
      <span>{category.label}</span>
      <strong>{count}</strong>
    </div>
  );
}

function CourtHeading({ eyebrow, title, body, compact = false }) {
  return (
    <div className={`tof-heading ${compact ? "is-compact" : ""}`}>
      {eyebrow && <p>{eyebrow}</p>}
      <h1>{title}</h1>
      {body && <div className="tof-heading__body">{body}</div>}
    </div>
  );
}

function CourtButton({ children, secondary = false, className = "", ...props }) {
  return (
    <button {...props} data-sfx="none" className={`tof-button ${secondary ? "tof-button--secondary" : ""} ${className}`}>
      {children}
    </button>
  );
}

function FitStage({ hasCompletedBefore, onReady, onQuick, onFull, onDeep, onGround, onAction }) {
  return (
    <motion.div className="tof-fit tof-fit--entry tof-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <CourtHeading title="A thought can feel true without being a fact." />
      <div className="tof-fit__choices">
        {hasCompletedBefore ? <><CourtButton onClick={onQuick}>Quick check <ArrowRight /></CourtButton><button type="button" className="tof-text-action" onClick={onFull}>Full review</button><button type="button" className="tof-text-action" onClick={onDeep}>Deeper review</button></> : <CourtButton onClick={onReady}>Look at a thought <ArrowRight /></CourtButton>}
        <CourtButton secondary onClick={onGround}>Ground first</CourtButton>
        <details className="tof-fit__more"><summary>More options</summary><button className="tof-text-action" onClick={onAction}>Take a practical step</button></details>
      </div>
      <details className="tof-learn"><summary>Is this a good time for this?</summary><p>For an everyday upsetting thought - not urgent danger or a safety decision. If you are in immediate danger, dealing with abuse or trauma, or need urgent medical or legal help, choose support instead.</p></details>
    </motion.div>
  );
}

function CaptureStage({ thought, setThought, onContinue }) {
  const hasThought = cleanSentence(thought).length >= 3;
  const nearingLimit = thought.length >= 320;
  return (
    <motion.div className="tof-capture tof-capture--entry tof-stage tof-stage--paper-open" initial={{ opacity: 0, y: 24, rotateX: -7, scale: 0.985 }} animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} exit={{ opacity: 0, y: -12, transition: { duration: 0.12 } }} transition={{ type: "spring", stiffness: 80, damping: 18 }}>
      <div className="tof-capture__intro">
        <p className="tof-capture__stage">Thought or Fact · 1 of 8</p>
        <CourtHeading title="Write the thought exactly as it appears." body={<p className="tof-capture__prompt">One thought is enough. Use the words that come naturally.</p>} />
      </div>
      <div className="tof-document-wrap">
        <div className="tof-document-shadow" aria-hidden="true" />
        <label className="tof-document">
          <span className="tof-document__label">Your thought</span>
          <textarea value={thought} onChange={(event) => setThought(event.target.value)} maxLength={360} rows={5} placeholder="For example: I made a mistake." aria-label="The thought you want to look at" aria-describedby="tof-capture-privacy" />
        </label>
        <p id="tof-capture-privacy" className="tof-capture__privacy">Private on this device{nearingLimit ? " · " + thought.length + "/360" : ""}</p>
      </div>
      <div className="tof-capture__actions">
        <CourtButton disabled={!hasThought} onClick={onContinue}>Look at it <ArrowRight /></CourtButton>
      </div>
    </motion.div>
  );
}

function ClaimsStage({ thought, claim, setClaim, onContinue, onKeepOriginal }) {
  const hasClaim = cleanSentence(claim).length >= 3;
  return (
    <motion.div className="tof-claim-confirmation tof-stage" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      <CourtHeading title="Put the exact claim on record." body={<p>Edit anything that does not match what you meant.</p>} />
      <section className="tof-claim-confirmation__sheet" aria-label="Claim confirmation">
        <div className="tof-claim-confirmation__original"><span>Your original words</span><q>{thought}</q></div>
        <label className="tof-claim-confirmation__field"><span>Claim for review</span><textarea value={claim} onChange={(event) => setClaim(event.target.value)} rows={3} maxLength={360} aria-label="Claim for review" /><PenLine aria-hidden="true" /></label>
      </section>
      <div className="tof-claim-confirmation__actions"><CourtButton disabled={!hasClaim} onClick={onContinue}>Use this claim</CourtButton><button type="button" className="tof-text-action" onClick={onKeepOriginal}>Keep my original words</button></div>
    </motion.div>
  );
}

function HighlightedClaim({ claim, phrases = [] }) {
  if (!phrases.length) return claim;
  const pattern = new RegExp(`(${phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  return claim.split(pattern).map((part, index) => phrases.some((phrase) => phrase.toLowerCase() === part.toLowerCase()) ? <mark key={index}>{part}</mark> : <React.Fragment key={index}>{part}</React.Fragment>);
}

function ChargeStage({ claim, selected, setSelected, onContinue }) {
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const matches = findThinkingTrapLanguage(claim);
  const suggested = matches.map(({ id }) => id);
  const [activeSuggestion, setActiveSuggestion] = useState(null);
  const activePhrases = matches.find(({ id }) => id === activeSuggestion)?.phrases || [];
  return <motion.div className="tof-charge-sheet tof-stage" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .24 }}>
    <CourtHeading eyebrow="The charge sheet" title="Which shortcuts might be shaping the claim?" />
    <q className="tof-charge-sheet__claim"><HighlightedClaim claim={claim} phrases={activePhrases} /></q>
    {suggested.length > 0 && <p className="tof-charge-sheet__suggestion">Tap a suggestion to see the exact wording it noticed. Only choose what fits.</p>}
    <div className="tof-charge-sheet__list">{THINKING_TRAPS.map(({ id, title, body, icon: Icon }) => {
      const phraseMatch = matches.find((match) => match.id === id);
      return <button type="button" key={id} onClick={() => { setActiveSuggestion(id); toggle(id); }} onMouseEnter={() => setActiveSuggestion(id)} onMouseLeave={() => setActiveSuggestion(null)} onFocus={() => setActiveSuggestion(id)} onBlur={() => setActiveSuggestion(null)} aria-label={`${title}. ${body}${phraseMatch ? ` Suggested from: ${phraseMatch.phrases.join(", ")}.` : ""}`} aria-pressed={selected.includes(id)} className={`${selected.includes(id) ? "is-selected" : ""} ${phraseMatch ? "is-suggested" : ""} ${activeSuggestion === id ? "is-active-suggestion" : ""}`}><span className="tof-charge-sheet__icon"><Icon /></span><span><strong>{title}</strong><small>{body}</small>{phraseMatch && <em>Spotted: {phraseMatch.phrases.map((phrase) => `“${phrase}”`).join(", ")}</em>}</span><i>{selected.includes(id) && <Check />}</i></button>;
    })}</div>
    <p className="tof-charge-sheet__note">{selected.length ? `${selected.length} pattern${selected.length === 1 ? "" : "s"} selected. You can choose more than one.` : "Choose every pattern that may fit. These are possibilities, not verdicts."}</p>
    <div className="tof-charge-sheet__actions"><CourtButton onClick={onContinue}>Confirm charge</CourtButton><button type="button" className="tof-text-action" onClick={() => { setSelected([]); onContinue(); }}>None of these</button></div>
  </motion.div>;
}

function SortStage({ claim, onSelect, onBack }) {
  return (
    <motion.div className="tof-sort tof-sort--single tof-stage tof-stage--sort-reveal" initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -22, scale: 1.02 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
      <CourtHeading title="See what this thought is made of." />
      <details className="tof-patterns"><summary>Why these choices?</summary><p><strong>Jumping to conclusions</strong> is when a possible outcome starts to feel certain. <strong>Catastrophising</strong> is when the mind moves quickly to the worst-case leap. Noticing a pattern does not make your concern invalid.</p></details>
      <article className="tof-active-fragment" aria-label="Statement being sorted"><span>Your statement</span><q>{claim}</q></article>
      <p className="tof-sort__instruction">Choose the closest fit. You can adjust it later.</p>
      <div className="tof-trays" role="group" aria-label="Ways to describe this statement">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return <button key={category.id} onClick={() => onSelect(category.id)} className={`tof-tray tof-tray--${category.id}`} style={{ "--tray": category.color }}><span className="tof-tray__icon"><Icon /></span><span><strong>{category.label}</strong><small>{category.short}</small></span></button>;
        })}
      </div>
      <div className="tof-sort__footer"><button onClick={onBack} className="tof-text-action"><ChevronLeft /> Adjust the statement</button></div>
    </motion.div>
  );
}

function EvidenceColumn({ type, title, subtitle, entries, draft, onDraft, onAdd, onRemove }) {
  return (
    <section className={`tof-evidence-column tof-evidence-column--${type}`}>
      <div className="tof-evidence-column__head">
        <span>{type === "support" ? <Scale /> : <CircleHelp />}</span>
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
      <div className="tof-evidence-stack">
        <AnimatePresence initial={false}>
          {entries.map((entry, index) => (
            <motion.div key={`${entry}-${index}`} className="tof-evidence-card" style={{ "--card-index": index }} initial={{ opacity: 0, y: 18, rotate: -1 }} animate={{ opacity: 1, y: 0, rotate: index % 2 ? 0.7 : -0.5 }} whileHover={{ y: -3, rotate: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
              <span>{entry}</span><button aria-label={`Remove ${entry}`} onClick={() => onRemove(index)}><X /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="tof-evidence-entry">
        <input value={draft} onChange={(event) => onDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onAdd(); } }} placeholder={type === "support" ? "One observable detail…" : "One exception or unknown…"} />
        <button onClick={onAdd} disabled={!draft.trim()} aria-label={`Add ${title.toLowerCase()}`}><Plus /></button>
      </div>
    </section>
  );
}

function EvidenceStage({ data, update, onContinue, initialLane = 0 }) {
  const [activeLaneIndex, setActiveLaneIndex] = useState(initialLane);
  const [draft, setDraft] = useState("");
  const lanes = [
    { id: "support", label: "Evidence for", title: "What makes this thought seem true?", why: "Why include this?", input: "One observable detail that supports it" },
    { id: "against", label: "Evidence against", title: "What evidence points another way?", why: "Why include this?", input: "One exception, detail, or uncertainty" },
    { id: "interpretations", label: "Other explanations", title: "What else could this mean?", why: "Why include this?", input: "One other possible explanation" },
    { id: "predictions", label: "What remains open", title: "What can you not know yet?", why: "Why include this?", input: "One thing that remains uncertain" },
  ];
  const values = { support: data.support || [], against: data.evidenceAgainst || [], interpretations: data.interpretations || [], predictions: data.predictions || [] };
  const lane = lanes[activeLaneIndex];
  const entries = values[lane.id];
  const atLastSurface = activeLaneIndex === lanes.length - 1;
  const laneKey = lane.id === "against" ? "evidenceAgainst" : lane.id;
  const add = () => { const clean = cleanSentence(draft); if (!clean || entries.length >= 3) return; update({ [laneKey]: [...entries, clean] }); setDraft(""); };
  const remove = (index) => update({ [laneKey]: entries.filter((_, entryIndex) => entryIndex !== index) });
  const advance = () => { if (atLastSurface) onContinue(); else { setActiveLaneIndex((index) => index + 1); setDraft(""); } };
  if (lane.id === "feelings") {
    const commonFeelings = ["Embarrassed", "Anxious", "Hurt", "Angry", "Confused", "Other"];
    const intensity = Number.isInteger(data.feelingIntensity) ? data.feelingIntensity : null;
    const toggleFeeling = (feeling) => update({ feelings: entries.includes(feeling) ? entries.filter((item) => item !== feeling) : [...entries, feeling] });
    return <motion.div className="tof-evidence tof-evidence--single tof-feelings tof-stage" data-lane="feelings" initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }}>
      <CourtHeading eyebrow="Feelings · 2 of 4" title="What did you feel?" />
      <p className="tof-feelings__note">Feelings are valid information, not automatic proof.</p>
      <section className="tof-feelings__choices" aria-label="Common feelings"><span>Common feelings</span><div>{commonFeelings.map((feeling) => <button key={feeling} type="button" className={entries.includes(feeling) ? "is-selected" : ""} aria-pressed={entries.includes(feeling)} onClick={() => toggleFeeling(feeling)}>{feeling}<i>{entries.includes(feeling) && <Check />}</i></button>)}</div></section>
      <section className="tof-feelings__intensity" aria-label="Feeling intensity"><span>Intensity (optional)</span><div role="radiogroup">{Array.from({ length: 11 }, (_, value) => <button type="button" key={value} role="radio" aria-checked={intensity === value} className={intensity === value ? "is-selected" : ""} onClick={() => update({ feelingIntensity: value })}><small>{value}</small><i /></button>)}</div></section>
      <div className="tof-evidence-actions"><button type="button" className="tof-text-action" onClick={advance}>Skip for now</button><CourtButton onClick={advance}>Next <ArrowRight /></CourtButton></div>
    </motion.div>;
  }
  return (
    <motion.div className="tof-evidence tof-evidence--single tof-stage tof-stage--balance-reveal" data-lane={lane.id} initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18, transition: { duration: 0.12 } }} transition={{ duration: 0.45 }}>
      <CourtHeading eyebrow={lane.label} title={lane.title} />
      <details className="tof-evidence-why"><summary>{lane.why}</summary><p>Evidence does not have to settle the thought. It helps make room for the full picture. It can also help separate what happened from what your mind added.</p></details>
      <section className="tof-evidence-column tof-evidence-column--single" role="region" aria-label={lane.title}>
        <div className="tof-evidence-stack" aria-live="polite">
          <AnimatePresence initial={false}>{entries.map((entry, index) => <motion.div key={index} className="tof-evidence-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: .96 }}><q>{entry}</q><button type="button" aria-label="Remove entry" onClick={() => remove(index)}><X /></button></motion.div>)}</AnimatePresence>
        </div>
        {entries.length < 3 && <div className="tof-evidence-entry"><textarea value={draft} rows={2} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); add(); } }} placeholder={lane.input} aria-label={lane.input} /><button type="button" onClick={add} disabled={!draft.trim()} aria-label="Add entry"><Plus /></button></div>}
      </section>
      <div className="tof-evidence-actions"><button type="button" className="tof-text-action" onClick={advance}>Skip for now</button><CourtButton onClick={advance}>{atLastSurface ? "Review the evidence" : "Next"} <ArrowRight /></CourtButton></div>
    </motion.div>
  );
}
function RulingStage({ fairerView, initialFairerView, distortions = [], rating, setRating, onContinue, onUnresolved, updateFairerView }) {
  const [editing, setEditing] = useState(null);
  const summary = [fairerView.known, fairerView.against, fairerView.added, fairerView.open].filter(Boolean);
  const updateAdaptive = (adaptive) => updateFairerView({ ...fairerView, adaptive });
  return (
    <motion.div className="tof-ruling tof-ruling--editorial tof-stage tof-stage--ruling-forward" initial={{ opacity: 0, y: 30, rotateX: -8, scale: 0.965 }} animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }} exit={{ opacity: 0, y: -18, transition: { duration: 0.12 } }} transition={{ type: "spring", stiffness: 72, damping: 17 }}>
      <CourtHeading compact eyebrow="Your balanced perspective" title="A truer thought, in your own words." />
      <div className="tof-fairer-view">
        <section className="tof-fairer-view__thought"><div><h2>A more balanced thought</h2><button type="button" className="tof-text-action" onClick={() => setEditing(editing ? null : "adaptive")} aria-expanded={Boolean(editing)}>{editing ? "Done" : "Make this mine"}</button></div>{editing ? <textarea value={fairerView.adaptive} onChange={(event) => updateAdaptive(event.target.value)} aria-label="A more balanced thought" /> : <p>{fairerView.adaptive}</p>}</section>
        <details className="tof-fairer-view__notes"><summary>What informed this</summary><div>{distortions.length > 0 && <p><strong>Patterns you chose:</strong> {distortions.join(", ")}.</p>}{summary.length > 0 && <p>{summary.join(" ")}</p>}{summary.length === 0 && <p>No extra evidence was needed for this to be a useful first perspective.</p>}</div></details>
        {editing && <button type="button" className="tof-text-action tof-fairer-view__restore" onClick={() => updateFairerView(initialFairerView)}>Restore first draft</button>}
      </div>
      <label className="tof-ruling__rating"><span>How true does the original thought feel now?</span><output>{rating} / 10</output><input type="range" min="0" max="10" step="1" value={rating} onChange={(event) => setRating(Number(event.target.value))} aria-label="How true the original thought feels now, from zero to ten" /></label>
      <div className="tof-ruling-actions"><button type="button" className="tof-text-action" onClick={onUnresolved}>Keep it unresolved</button><CourtButton onClick={onContinue}>Continue <ArrowRight /></CourtButton></div>
    </motion.div>
  );
}

function ReRateStage({ claim, adaptiveThought, before, value, setValue, onContinue, onSkip }) {
  const beforeLabel = Number.isInteger(before) ? `${before} out of 10 before` : "No starting rating";
  return <motion.div className="tof-belief-rating tof-rerate tof-stage" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: .24 }}>
    <CourtHeading title="How true does this feel now, after looking at the full picture?" />
    <section className="tof-belief-rating__claim"><small>Your original thought</small><q>{claim}</q></section>
    <section className="tof-rerate__adaptive"><small>A more balanced thought</small><p>{adaptiveThought}</p></section>
    <label className="tof-belief-rating__slider"><span><strong>{value}</strong><small>out of 10 now · {beforeLabel}</small></span><input type="range" min="0" max="10" step="1" value={value} onChange={(event) => setValue(Number(event.target.value))} aria-label="How true the original thought feels now, from zero to ten" aria-valuetext={`${value} out of 10 now`} /></label>
    <div className="tof-belief-rating__ends"><span>Not at all convincing</span><span>Completely convincing</span></div>
    <p className="tof-belief-rating__note">A change is not required. The point is to notice what feels different, if anything.</p>
    <div className="tof-belief-rating__actions"><CourtButton onClick={onContinue}>Choose what helps now <ArrowRight /></CourtButton><button type="button" className="tof-text-action" onClick={onSkip}>Skip rating</button></div>
  </motion.div>;
}

function DirectionStage({ hasPrediction, hasActionable, hasOpenQuestions, predictionText, knownContext, openContext, onLeave, onAction, onTest, onGround }) {
  const [confirmingTest, setConfirmingTest] = useState(false);
  const [testFeelsSafe, setTestFeelsSafe] = useState(false);
  const primary = { title: "Leave this here for now", action: onLeave, icon: ShieldCheck };
  const PrimaryIcon = primary.icon;
  if (confirmingTest) return (
    <motion.div className="tof-direction tof-direction--confirmation tof-stage tof-stage--room-open" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18, transition: { duration: 0.12 } }} transition={{ type: "spring", stiffness: 88, damping: 19 }}>
      <CourtHeading title="Test this carefully." />
      <section className="tof-test-confirmation" aria-label="Confirm Test the Prediction"><div><small>The prediction</small><q>{predictionText || "A prediction was identified."}</q></div><div><small>What you know</small><span>{knownContext || "Nothing has been recorded as certain."}</span></div><div><small>What remains open</small><span>{openContext || "There is still information you cannot know yet."}</span></div><p className="tof-test-confirmation__boundary">Choose only a small, safe experiment. Do not use this for immediate danger, safety decisions, medical advice, or situations involving abuse or trauma.</p><label className="tof-test-safety"><input type="checkbox" checked={testFeelsSafe} onChange={(event) => setTestFeelsSafe(event.target.checked)} /> <span>This feels safe and within my control.</span></label><div className="tof-test-confirmation__actions"><button type="button" className="tof-text-action" onClick={() => { setConfirmingTest(false); setTestFeelsSafe(false); }}>Not now</button><CourtButton disabled={!testFeelsSafe} onClick={onTest}>Continue to Test the Prediction <ArrowRight /></CourtButton></div></section>
    </motion.div>
  );
  return (
    <motion.div className="tof-direction tof-direction--choice tof-stage tof-stage--room-open" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -18, transition: { duration: 0.12 } }} transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}>
      <CourtHeading title="Choose what helps now." />
      {hasActionable && <p className="tof-direction__valid-concern">This concern may be real. A practical step can be more useful than more analysis.</p>}
      <button type="button" onClick={primary.action} className="tof-direction-primary"><span><PrimaryIcon /></span><strong>{primary.title}</strong><ArrowRight /></button>
      <div className="tof-direction-rows">
        {hasActionable && <button type="button" onClick={onAction}><ArrowRight /><strong>Take one practical step</strong></button>}
        {hasPrediction && <button type="button" onClick={() => setConfirmingTest(true)}><FlaskConical /><strong>Test the prediction</strong><ArrowRight /></button>}
        <button type="button" onClick={onGround}><Sparkles /><strong>Return to the present</strong><ArrowRight /></button>
        <button type="button" onClick={onLeave}><ShieldCheck /><strong>Stop here</strong><ArrowRight /></button>
      </div>
    </motion.div>
  );
}

function CompletionStage({ thought, fairerView, returnPhrase, setReturnPhrase, saved, onSave, onFinish }) {
  const [showSaveConsent, setShowSaveConsent] = useState(false);
  const fairerSummary = fairerView?.adaptive || [fairerView?.known, fairerView?.added, fairerView?.open].filter(Boolean).join(" ") || "It can remain unresolved for now.";
  if (showSaveConsent && !saved) return (
    <motion.div className="tof-complete tof-complete--save tof-stage tof-stage--completion-widen" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18, transition: { duration: 0.12 } }} transition={{ type: "spring", stiffness: 88, damping: 19 }}>
      <CourtHeading title="Save this privately?" />
      <section className="tof-save-consent" aria-label="Save private record"><p>This stays only on this device.</p><div><button type="button" className="tof-text-action" onClick={() => setShowSaveConsent(false)}>Not now</button><CourtButton onClick={onSave}>Save privately</CourtButton></div></section>
    </motion.div>
  );
  return (
    <motion.div className="tof-complete tof-complete--quiet tof-stage tof-stage--completion-widen" initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, y: -18, transition: { duration: 0.12 } }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
      <CourtHeading title="Keep what is useful." />
      <p className="tof-complete__takeaway">A thought can be important without being the whole story.</p>
      <div className="tof-completion-summary" aria-label="Your private reflection"><section><small>Original thought</small><q>{thought}</q></section><section><small>A fairer view</small><p>{fairerSummary}</p></section></div>
       <details className="tof-completion-details"><summary>See the notes you made</summary><div><section><small>Facts</small><p>{fairerView?.known || "Nothing recorded."}</p></section><section><small>Possible meaning</small><p>{fairerView?.added || "Nothing added."}</p></section><section><small>Still open</small><p>{fairerView?.open || "It can remain open."}</p></section></div></details>
       <label className="tof-return-phrase"><span>If this thought returns, I can remember:</span><input value={returnPhrase} onChange={(event) => setReturnPhrase(event.target.value)} maxLength={140} placeholder="A short phrase for yourself" /></label>
      <div className="tof-complete__actions"><CourtButton onClick={onFinish}>Finish</CourtButton><button type="button" className="tof-text-action" disabled={saved} onClick={() => setShowSaveConsent(true)}>{saved ? "Saved privately" : "Save privately"}</button></div>
    </motion.div>
  );
}

export default function ThoughtOrFactExperience({ intervention, answers, initialThought = "", initialCertainty, onComplete, onAttemptEvent, onExit }) {
  const navigate = useNavigate();
  const a11y = useAccessibilityPrefs();
  const restored = useMemo(() => {
    const active = getActiveFlagship();
    return active?.interventionId === "factCheck" ? active : null;
  }, []);
  const [stage, setStage] = useState(restored?.data?.stage || (initialThought ? "claims" : "fit"));
  const hasCompletedBefore = useMemo(() => getFlagshipPreferences().events?.some((event) => event.interventionId === "factCheck" && event.completed), []);
  const [data, setData] = useState(restored?.data || {
    stage: "fit",
    thought: initialThought,
    refinedClaim: initialThought,
    certaintyBefore: Number.isInteger(initialCertainty) ? initialCertainty : null,
    certaintyAfter: Number.isInteger(initialCertainty) ? initialCertainty : 5,
    fragments: [],
    assignments: {},
    support: [],
    alternatives: [],
    uncertainty: [],
    fairerView: { adaptive: "", known: "", against: "", added: "", open: "" },
    saved: false,
  });
  const startedAt = useRef(Date.now());

  const stageIndex = Math.max(0, STAGES.indexOf(stage));
  const stageAnnouncement = { fit: "Thought or Fact. Choose how you would like to begin.", capture: "Thought capture. Enter one thought in your own words.", claims: "Review an editable claim.", charge: "Choose any thinking shortcuts that might be present, or none.", sort: "Choose the closest description for the statement.", evidence: "Make room for evidence that supports and challenges the conclusion.", ruling: "Review your more balanced thought.", rerate: "Notice how true the original thought feels now.", direction: "Choose what would be useful now.", complete: "Your private reflection is ready." }[stage];
  const shellStage = stageIndex < 2 ? 1 : stageIndex < 5 ? 2 : 3;
  const update = (patch) => setData((current) => ({ ...current, ...patch }));
  const go = (nextStage, patch = {}) => {
    setStage(nextStage);
    setData((current) => ({ ...current, ...patch, stage: nextStage }));
    window.scrollTo({ top: 0, behavior: a11y.prefs.reducedMotion ? "auto" : "smooth" });
  };

  const fragments = data.fragments?.length ? data.fragments : splitThought(data.thought);

  useEffect(() => {
    saveActiveFlagship({ interventionId: "factCheck", step: stageIndex, data: normaliseThoughtOrFactDraft({ ...data, fragments, stage }) });
  }, [data, fragments, stage, stageIndex]);
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category.id, Object.values(data.assignments || {}).filter((value) => value === category.id).length]));
  const hasPrediction = Boolean(counts.prediction || (data.predictions || []).length);
  const hasActionable = Boolean((data.support || data.facts || []).length);
  const hasOpenQuestions = Boolean((data.alternatives || []).length || (data.uncertainty || []).length);
  const predictionText = fragments.filter((fragment) => data.assignments?.[fragment.id] === "prediction").map((fragment) => fragment.text).join(" ");
  const knownContext = fragments.filter((fragment) => data.assignments?.[fragment.id] === "fact").map((fragment) => fragment.text).join(" ");
  const openContext = [...(data.alternatives || []), ...(data.uncertainty || [])].join(" ");

  const launch = (targetId) => {
    recordHandoffDecision("factCheck", targetId, "accepted");
    clearActiveFlagship("factCheck");
    navigate("/reset", {
      replace: true,
      state: {
        prebuilt: true,
        pathway: [targetId],
        direction: targetId === "nextAction" ? "focus" : "ground",
        directionLabel: targetId === "nextAction" ? "Next Easiest Step" : "5-4-3-2-1 Grounding",
        intensity: answers?.intensity || 5,
        whereFelt: "both",
        timeMin: targetId === "nextAction" ? 3 : 5,
        audio: answers?.audio || "yes",
      },
    });
  };

  const createFairerView = () => defaultFairerView(data.thought, fragments, data.assignments || {}, data.alternatives || [], data.uncertainty || [], data);

  const finish = (saved = data.saved) => {
    const learningRecord = buildThoughtOrFactLearningRecord({
      assignments: data.assignments,
      certaintyBefore: data.certaintyBefore,
      certaintyAfter: data.certaintyAfter,
      repeatMode: data.repeatMode,
      saved,
    });
    rememberFlagshipEvent({
      interventionId: "factCheck",
      completed: true,
      options: learningRecord,
    });
    clearActiveFlagship("factCheck");
    onAttemptEvent?.({ interventionId: "factCheck", mechanism: intervention.mechanism, action: "completed", completedPercentage: 1, timestamp: Date.now(), startedAt: startedAt.current });
    onComplete?.({ skipReflection: true, outcome: { classificationCounts: counts, certaintyBefore: data.certaintyBefore, certaintyAfter: data.certaintyAfter, saved }, postValue: data.certaintyAfter });
  };

  const handleSave = () => {
    const saved = saveRecord({
      id: globalThis.crypto?.randomUUID?.() || `tof-${Date.now()}`,
      createdAt: new Date().toISOString(),
      thought: data.thought,
      ruling: [data.fairerView?.known, data.fairerView?.added, data.fairerView?.open].filter(Boolean).join(" "),
      fairerView: data.fairerView,
      returnPhrase: data.returnPhrase,
      certaintyBefore: data.certaintyBefore,
      certaintyAfter: data.certaintyAfter,
      classifications: counts,
    });
    update({ saved });
  };

  const back = () => {
    const previous = { capture: "fit", claims: "capture", charge: "claims", sort: "charge", evidence: "sort", ruling: "evidence", rerate: "ruling", direction: "rerate", complete: "direction" }[stage];
    if (previous) go(previous);
    else onExit?.();
  };

  return (
    <MotionConfig reducedMotion={a11y.prefs.reducedMotion ? "always" : "never"}>
    <InterventionControlShell
      id="factCheck"
      goal="calm"
      title="Thought or Fact?"
      stage={stage === "claims" ? 2 : stage === "charge" ? 3 : stage === "sort" ? 4 : stage === "evidence" ? 5 : shellStage}
      stages={stage === "claims" || stage === "charge" || stage === "sort" || stage === "evidence" ? 8 : 3}
      quiet
      onBack={back}
      onExit={onExit}
      onSimplify={() => go(stage === "sort" ? "capture" : stage)}
      simplifyLabel={stage === "sort" ? "Sort the whole thought instead" : "Use less guidance"}
      onDifferent={() => launch("grounding54321V2")}
      accent="#e7c982"
      dark
      className={`tof-shell ${a11y.prefs.reducedMotion ? "tof-reduced-motion" : ""}`}
      field={<div className="tof-world" aria-hidden="true"><div className="tof-world__ceiling" /><div className="tof-world__light" /><div className="tof-world__lamp"><i /></div><div className="tof-world__backwall" /><div className="tof-world__table" /><div className="tof-world__desk-edge" /><div className="tof-world__dust">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--i": index }} />)}</div></div>}
    >
      <div className="tof-experience" data-tof-stage={stage}>
        <div className="tof-live-region" role="status" aria-live="polite">{stageAnnouncement}</div>
        <AnimatePresence initial={false}>
          {stage === "fit" && <FitStage key="fit" hasCompletedBefore={hasCompletedBefore} onReady={() => go("capture", { repeatMode: "full" })} onQuick={() => go("capture", { repeatMode: "quick" })} onFull={() => go("capture", { repeatMode: "full" })} onDeep={() => go("capture", { repeatMode: "deep" })} onGround={() => launch("grounding54321V2")} onAction={() => launch("nextAction")} />}
          {stage === "capture" && <CaptureStage key="capture" thought={data.thought} setThought={(thought) => update({ thought })} onContinue={() => go("claims", { refinedClaim: data.thought, fragments: splitThought(data.thought), assignments: {} })} />}
          {stage === "claims" && <ClaimsStage key="claims" thought={data.thought} claim={data.refinedClaim ?? data.thought} setClaim={(refinedClaim) => update({ refinedClaim })} onKeepOriginal={() => { const refinedClaim = data.thought; update({ refinedClaim, fragments: splitThought(refinedClaim), assignments: {} }); go("charge"); }} onContinue={() => { const refinedClaim = cleanSentence(data.refinedClaim ?? data.thought); update({ refinedClaim, fragments: splitThought(refinedClaim), assignments: {} }); go("charge"); }} />}
          {stage === "charge" && <ChargeStage key="charge" claim={data.refinedClaim ?? data.thought} selected={data.distortions || []} setSelected={(distortions) => update({ distortions })} onContinue={() => go("sort")} />}
          {stage === "sort" && <SortStage key="sort" claim={data.refinedClaim ?? data.thought} onSelect={(category) => { const assignments = Object.fromEntries(fragments.map((fragment) => [fragment.id, category])); go("evidence", { assignments, evidenceLane: 0 }); }} onBack={() => go("charge")} />}
          {stage === "evidence" && <EvidenceStage key="evidence" data={data} initialLane={data.evidenceLane || 0} update={update} onContinue={() => go("ruling", { fairerView: createFairerView() })} />}
          {stage === "ruling" && <RulingStage key="ruling" fairerView={data.fairerView || createFairerView()} initialFairerView={createFairerView()} distortions={data.distortions || []} rating={Number.isInteger(data.certaintyAfter) && data.certaintyAfter >= 0 && data.certaintyAfter <= 10 ? data.certaintyAfter : 5} setRating={(certaintyAfter) => update({ certaintyAfter })} updateFairerView={(fairerView) => update({ fairerView })} onContinue={() => go("direction")} onUnresolved={() => go("direction", { direction: "unresolved" })} />}
          {stage === "direction" && <DirectionStage key="direction" hasPrediction={hasPrediction} hasActionable={hasActionable} hasOpenQuestions={hasOpenQuestions} predictionText={predictionText} knownContext={knownContext} openContext={openContext} onLeave={() => finish()} onAction={() => launch("nextAction")} onTest={() => { recordHandoffDecision("factCheck", "testPrediction", "accepted"); clearActiveFlagship("factCheck"); navigate("/reset", { replace: true, state: { prebuilt: true, pathway: ["testPrediction"], direction: "lift", directionLabel: "Test the Prediction", intensity: answers?.intensity || 5, whereFelt: "thoughts", timeMin: 4, audio: answers?.audio || "yes" } }); }} onGround={() => launch("grounding54321V2")} />}
          {stage === "complete" && <CompletionStage key="complete" thought={data.thought} fairerView={data.fairerView} returnPhrase={data.returnPhrase || ""} setReturnPhrase={(returnPhrase) => update({ returnPhrase })} saved={data.saved} onSave={handleSave} onFinish={() => finish()} />}
        </AnimatePresence>
      </div>
    </InterventionControlShell>
    </MotionConfig>
  );
}
