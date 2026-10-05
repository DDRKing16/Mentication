import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  ChevronRight,
  CircleHelp,
  Eye,
  FileText,
  FlaskConical,
  GitBranch,
  Heart,
  LockKeyhole,
  Plus,
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
import { BELIEF_QUESTION, BELIEF_ANCHORS, beliefRating, commitEvidenceDrafts, buildBalancedThought, buildThoughtOrFactLearningRecord, findThinkingTrapLanguage, normaliseThoughtOrFactDraft } from "@/lib/thoughtOrFactState";
import {
  clearActiveFlagship,
  getActiveFlagship,
  recordHandoffDecision,
  rememberFlagshipEvent,
  saveActiveFlagship,
} from "@/lib/flagshipMemory";

const RECORD_KEY = "mentation.thought-or-fact.records.v1";

// What kind of thought is this? One tap, no lesson.
const CATEGORIES = [
  { id: "mixed", label: "Mixed", short: "Facts and interpretations together", icon: Scale },
  { id: "not-sure", label: "Not sure", short: "Leave the classification open", icon: CircleHelp },
  { id: "fact", label: "Fact", short: "Something that could be verified", icon: Eye },
  { id: "interpretation", label: "Interpretation", short: "One possible meaning", icon: FileText },
  { id: "prediction", label: "Prediction", short: "A guess about the future", icon: FlaskConical },
  { id: "catastrophe", label: "Worst-case leap", short: "When possible feels certain", icon: CircleHelp },
  { id: "feeling", label: "Feeling", short: "How it feels, not what is provable", icon: Heart },
];

// A new thinking-pattern set is offered only as gentle suggestions.
const THINKING_TRAPS = [
  { id: "mind-reading", title: "Mind reading", body: "Assuming you know what another person thinks.", icon: Brain },
  { id: "jumping-to-conclusions", title: "Jumping to conclusions", body: "Treating a possible meaning as certain.", icon: GitBranch },
  { id: "catastrophising", title: "Catastrophising", body: "Expecting the worst possible outcome.", icon: TriangleAlert },
  { id: "all-or-nothing", title: "All-or-nothing thinking", body: "Seeing only total success or total failure.", icon: CircleHelp },
  { id: "overgeneralising", title: "Overgeneralising", body: "Drawing a broad conclusion from one event.", icon: GitBranch },
  { id: "emotional-reasoning", title: "Emotional reasoning", body: "Treating a strong feeling as proof.", icon: Heart },
  { id: "mental-filter", title: "Mental filter", body: "Focusing on the painful detail and missing the rest.", icon: Eye },
  { id: "discounting-positives", title: "Discounting positives", body: "Dismissing evidence that does not fit the fear.", icon: Scale },
  { id: "labelling", title: "Labelling", body: "Turning one experience into a fixed judgement.", icon: FileText },
  { id: "personalising", title: "Personalising", body: "Taking responsibility for something with many causes.", icon: Brain },
  { id: "should-statements", title: "Should rules", body: "Holding yourself or others to a rigid rule.", icon: CircleHelp },
  { id: "magnifying-minimising", title: "Magnifying or minimising", body: "Making one part of the picture much bigger or smaller.", icon: Scale },
];

// capture -> sort -> evidence -> ruling -> direction -> complete
const STAGES = ["capture", "belief", "sort", "evidence", "ruling", "direction", "complete"];
// Older saved drafts used stages that no longer exist; map them forward.
const LEGACY_STAGES = { fit: "capture", claims: "sort", charge: "sort" };
const STEP_COUNT = 4;
const stepFor = (stage) => ({ sort: 1, evidence: 2, ruling: 3, direction: 4, complete: 4 }[stage] || 0);

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
    adaptive: buildBalancedThought({ thought, facts: [...(evidence.facts || []), ...collect(["fact"])], support: evidence.support, evidenceAgainst: evidence.evidenceAgainst, alternatives: [...alternatives, ...uncertainties, ...(evidence.interpretations || [])] }),
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
    const next = [record, ...existing].slice(0, 24);
    localStorage.setItem(RECORD_KEY, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

function Heading({ eyebrow, title, body }) {
  return (
    <div className="tof-heading">
      {eyebrow && <p>{eyebrow}</p>}
      <h1>{title}</h1>
      {body && <span className="tof-sub">{body}</span>}
    </div>
  );
}

function Steps({ current }) {
  return (
    <div className="tof-steps" role="img" aria-label={`Step ${current} of ${STEP_COUNT}`}>
      {Array.from({ length: STEP_COUNT }, (_, index) => <i key={index} className={index < current ? "is-done" : ""} />)}
    </div>
  );
}

function Button({ children, secondary = false, className = "", ...props }) {
  return (
    <button type="button" {...props} data-sfx="none" className={`tof-button ${secondary ? "tof-button--secondary" : ""} ${className}`}>
      {children}
    </button>
  );
}

const fade = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10, transition: { duration: 0.12 } }, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };

function BeliefRating({ value, onChange }) {
  return <fieldset className="tof-rating">
    <legend className="tof-rating__q">{BELIEF_QUESTION}</legend>
    <p className="tof-sub">{BELIEF_ANCHORS}</p>
    <div className="tof-chips" role="group" aria-label={BELIEF_QUESTION}>
      {Array.from({ length: 11 }, (_, rating) => <button type="button" className="tof-pill" key={rating} aria-pressed={value === rating} onClick={() => onChange(rating)}>{rating}</button>)}
    </div>
    <p className="tof-note">{value === null ? "No rating selected" : `${value} out of 10`}</p>
    <button type="button" className="tof-text-action" onClick={() => onChange(null)}>Skip belief rating</button>
  </fieldset>;
}

function BeliefStage({ thought, value, onChange, onContinue }) {
  return <motion.div className="tof-stage" {...fade}>
    <Heading title="Before you look closer." body="Rate your belief in this thought. This is separate from how you feel." />
    <q className="tof-quote">{thought}</q>
    <BeliefRating value={value} onChange={onChange} />
    <div className="tof-actions"><Button onClick={onContinue}>Continue <ArrowRight /></Button></div>
  </motion.div>;
}

function CaptureStage({ thought, setThought, onContinue }) {
  const hasThought = cleanSentence(thought).length >= 3;
  const nearingLimit = thought.length >= 320;
  const suggestions = [
    "I made a mistake.",
    "Something is going to go wrong.",
    "They probably think badly of me.",
    "I should be handling this better.",
  ];
  return (
    <motion.div className="tof-stage" {...fade}>
      <Heading title="What’s the thought?" body="Type your own, or tap a starting point and edit it if needed." />
      <div className="tof-chips" aria-label="Suggested thoughts">
        {suggestions.map((suggestion) => <button key={suggestion} type="button" className="tof-pill" onClick={() => setThought(suggestion)}>{suggestion}</button>)}
      </div>
      <textarea className="tof-field" value={thought} onChange={(event) => setThought(event.target.value)} maxLength={360} rows={4} placeholder="For example: I made a mistake." aria-label="The thought you want to look at" aria-describedby="tof-capture-privacy" />
      <p id="tof-capture-privacy" className="tof-note"><LockKeyhole aria-hidden="true" /> Private on this device{nearingLimit ? ` · ${thought.length}/360` : ""}</p>
      <div className="tof-actions"><Button disabled={!hasThought} onClick={onContinue}>Continue <ArrowRight /></Button></div>
    </motion.div>
  );
}

function SortStage({ claim, selected, setSelected, onSelect, currentIndex = 0, total = 1 }) {
  const matches = findThinkingTrapLanguage(claim);
  const suggested = matches.map(({ id }) => id);
  const toggle = (id) => setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  const suggestedTraps = THINKING_TRAPS.filter((trap) => suggested.includes(trap.id));
  const otherTraps = THINKING_TRAPS.filter((trap) => !suggested.includes(trap.id));
  return (
    <motion.div className="tof-stage" {...fade}>
      <Heading eyebrow={total > 1 ? `Part ${currentIndex + 1} of ${total}` : "Your thought"} title="What kind of thought is this?" />
      <q className="tof-quote">{claim}</q>
      <div className="tof-options" role="group" aria-label="Ways to describe this thought">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <button key={category.id} type="button" className="tof-option" onClick={() => onSelect(category.id)}>
              <Icon aria-hidden="true" />
              <span><strong>{category.label}</strong><small>{category.short}</small></span>
              <ChevronRight aria-hidden="true" />
            </button>
          );
        })}
      </div>
      <p className="tof-sub">Choose the closest fit. You can adjust it later.</p>
      <section className="tof-patterns" aria-label="Thinking patterns">
        {suggestedTraps.length > 0 && <>
          <h2>Your words may include</h2>
          <div className="tof-chips">
            {suggestedTraps.map(({ id, title }) => (
              <button key={id} type="button" className="tof-pill" aria-pressed={selected.includes(id)} onClick={() => toggle(id)}>{title}</button>
            ))}
          </div>
        </>}
        <details className="tof-details">
          <summary>{suggestedTraps.length ? "Add another pattern" : "Does a thinking pattern fit? (optional)"}</summary>
          <div className="tof-chips" style={{ paddingTop: "0.5rem" }}>
            {otherTraps.map(({ id, title }) => (
              <button key={id} type="button" className="tof-pill" aria-pressed={selected.includes(id)} onClick={() => toggle(id)}>{title}</button>
            ))}
          </div>
        </details>
      </section>
    </motion.div>
  );
}

function EvidenceField({ title, hint, placeholder, entries, draft, setDraft, onAdd, onRemove }) {
  return (
    <section className="tof-evidence-block" aria-label={title}>
      <div><h2>{title}</h2><p>{hint}</p></div>
      {entries.length > 0 && (
        <div className="tof-entries" aria-live="polite">
          <AnimatePresence initial={false}>
            {entries.map((entry, index) => (
              <motion.div key={`${entry}-${index}`} className="tof-entry-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <span>{entry}</span>
                <button type="button" aria-label={`Remove: ${entry}`} onClick={() => onRemove(index)}><X /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      {entries.length < 3 && (
        <div className="tof-add">
          <textarea className="tof-field" rows={1} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onAdd(); } }} placeholder={placeholder} aria-label={title} />
          <button type="button" onClick={onAdd} disabled={!draft.trim()} aria-label={`Add to: ${title}`}><Plus /></button>
        </div>
      )}
    </section>
  );
}

function EvidenceStage({ data, update, onContinue }) {
  const [drafts, setDrafts] = useState({ support: "", against: "" });
  const lanes = [
    { id: "support", key: "support", title: "What makes it seem true?", hint: "One observable detail is plenty.", placeholder: "One observable detail" },
    { id: "against", key: "evidenceAgainst", title: "What points another way?", hint: "An exception, a detail, or something you can’t know yet.", placeholder: "One exception or unknown" },
  ];
  const add = (lane) => {
    const entries = data[lane.key] || [];
    const clean = cleanSentence(drafts[lane.id]);
    if (!clean || entries.length >= 3) return;
    update({ [lane.key]: [...entries, clean] });
    setDrafts((current) => ({ ...current, [lane.id]: "" }));
  };
  const remove = (lane, index) => update({ [lane.key]: (data[lane.key] || []).filter((_, entryIndex) => entryIndex !== index) });
  return (
    <motion.div className="tof-stage" {...fade}>
      <Heading title="Look at it from both sides." body="None of this has to be perfect, and you can skip any of it." />
      <div className="tof-evidence">
        {lanes.map((lane) => (
          <EvidenceField key={lane.id} title={lane.title} hint={lane.hint} placeholder={lane.placeholder} entries={data[lane.key] || []} draft={drafts[lane.id]} setDraft={(value) => setDrafts((current) => ({ ...current, [lane.id]: value }))} onAdd={() => add(lane)} onRemove={(index) => remove(lane, index)} />
        ))}
      </div>
      <div className="tof-actions">
        <Button onClick={() => onContinue(commitEvidenceDrafts(data, drafts))}>Continue <ArrowRight /></Button>
        <button type="button" className="tof-text-action" onClick={() => onContinue(commitEvidenceDrafts(data, drafts))}>Skip for now</button>
      </div>
    </motion.div>
  );
}

function RulingStage({ thought, confirmed, setConfirmed, fairerView, initialFairerView, certaintyBefore, rating, setRating, onContinue, onUnresolved, updateFairerView }) {
  const [editing, setEditing] = useState(false);
  const summary = [fairerView.known, fairerView.against, fairerView.added, fairerView.open].filter(Boolean);
  return (
    <motion.div className="tof-stage" {...fade}>
      <Heading title="A draft to check." body="Keep the facts, including difficult ones. Keep uncertainty where the answer is not known. Edit this until it fits." />
      <section className="tof-fairer" aria-label="A more balanced thought">
        {editing
          ? <textarea className="tof-field" value={fairerView.adaptive} onChange={(event) => updateFairerView({ ...fairerView, adaptive: event.target.value })} aria-label="A more balanced thought" />
          : <p className="tof-fairer__body">{fairerView.adaptive}</p>}
        <div>
          <button type="button" className="tof-text-action" onClick={() => setEditing(!editing)} aria-expanded={editing}>{editing ? "Done" : "Make this mine"}</button>
          {editing && <button type="button" className="tof-text-action" onClick={() => updateFairerView(initialFairerView)}>Restore first draft</button>}
        </div>
      </section>
      {summary.length > 0 && <details className="tof-details"><summary>What informed this</summary><p>{summary.join(" ")}</p></details>}
      <label className="tof-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>This statement preserves the facts and uncertainty, and fits what I mean.</span></label>
      <q className="tof-quote">{thought}</q>
      <BeliefRating value={rating} onChange={setRating} />
      {Number.isInteger(certaintyBefore) && <p className="tof-note">Your starting rating was {certaintyBefore} out of 10. Staying the same or feeling more certain is okay.</p>}
      <div className="tof-actions">
        <Button disabled={!confirmed || !fairerView.adaptive?.trim()} onClick={onContinue}>Continue <ArrowRight /></Button>
        <button type="button" className="tof-text-action" onClick={onUnresolved}>Keep it unresolved</button>
      </div>
    </motion.div>
  );
}

function DirectionStage({ hasPrediction, hasActionable, predictionText, knownContext, openContext, onFinish, onAction, onTest, onGround }) {
  const [confirmingTest, setConfirmingTest] = useState(false);
  const [testFeelsSafe, setTestFeelsSafe] = useState(false);
  if (confirmingTest) return (
    <motion.div className="tof-stage" {...fade}>
      <Heading title="Test this carefully." />
      <section className="tof-panel" aria-label="Confirm Test the Prediction">
        <div><small>The prediction</small><q>{predictionText || "A prediction was identified."}</q></div>
        <div><small>What you know</small><span>{knownContext || "Nothing has been recorded as certain."}</span></div>
        <div><small>What remains open</small><span>{openContext || "There is still information you cannot know yet."}</span></div>
        <p>Choose only a small, safe experiment. Do not use this for immediate danger, safety decisions, medical advice, or situations involving abuse or trauma.</p>
        <label className="tof-check"><input type="checkbox" checked={testFeelsSafe} onChange={(event) => setTestFeelsSafe(event.target.checked)} /> <span>This feels safe and within my control.</span></label>
      </section>
      <div className="tof-actions">
        <Button disabled={!testFeelsSafe} onClick={onTest}>Continue to Test the Prediction <ArrowRight /></Button>
        <button type="button" className="tof-text-action" onClick={() => { setConfirmingTest(false); setTestFeelsSafe(false); }}>Not now</button>
      </div>
    </motion.div>
  );
  return (
    <motion.div className="tof-stage" {...fade}>
      <Heading title="What would help now?" body={hasActionable ? "This concern may be real. A practical step can be more useful than more analysis." : undefined} />
      <div className="tof-options">
        <button type="button" className="tof-option tof-option--primary" onClick={onFinish}><ShieldCheck aria-hidden="true" /><span><strong>Leave this here for now</strong><small>Finish and keep what was useful</small></span><ChevronRight aria-hidden="true" /></button>
        {hasActionable && <button type="button" className="tof-option" onClick={onAction}><ArrowRight aria-hidden="true" /><span><strong>Take one practical step</strong><small>Turn the concern into something doable</small></span><ChevronRight aria-hidden="true" /></button>}
        {hasPrediction && <button type="button" className="tof-option" onClick={() => setConfirmingTest(true)}><FlaskConical aria-hidden="true" /><span><strong>Test the prediction</strong><small>A small, safe experiment</small></span><ChevronRight aria-hidden="true" /></button>}
        <button type="button" className="tof-option" onClick={onGround}><Sparkles aria-hidden="true" /><span><strong>Return to the present</strong><small>Ground in what is around you</small></span><ChevronRight aria-hidden="true" /></button>
      </div>
    </motion.div>
  );
}

function CompletionStage({ confirmed, saveError, thought, fairerView, returnPhrase, setReturnPhrase, saved, onSave, onFinish }) {
  const fairerSummary = (confirmed ? fairerView?.adaptive : "This remains unresolved. I do not need to dismiss the facts or force a new conclusion.") || [fairerView?.known, fairerView?.added, fairerView?.open].filter(Boolean).join(" ") || "It can remain unresolved for now.";
  return (
    <motion.div className="tof-stage" {...fade}>
      <Heading title="Keep what’s useful." body="A thought can be important without being the whole story." />
      <section className="tof-fairer" aria-label="Your private reflection">
        <p className="tof-heading"><span className="tof-sub">Original thought</span></p>
        <q className="tof-quote">{thought}</q>
        <p className="tof-heading"><span className="tof-sub">{confirmed ? "Your confirmed statement" : "Left unresolved"}</span></p>
        <p className="tof-fairer__body">{fairerSummary}</p>
      </section>
      <label className="tof-evidence-block">
        <p>If this thought returns, I can remember:</p>
        <input className="tof-field" value={returnPhrase} onChange={(event) => setReturnPhrase(event.target.value)} maxLength={140} placeholder="A short phrase for yourself" />
      </label>
      <div className="tof-actions">
        <p className="tof-sub">Your automatic draft is cleared when you finish. Save is optional and keeps a separate reflection on this device.</p>
        {saveError && <p role="alert">Saving did not work. Your reflection has not been saved.</p>}
        <Button onClick={onFinish}>Finish</Button>
        <button type="button" className="tof-text-action" disabled={saved} onClick={onSave}>{saved ? "Saved on this device" : "Save privately on this device"}</button>
      </div>
    </motion.div>
  );
}

export default function ThoughtOrFactExperience({ intervention, answers, initialThought = "", onComplete, onAttemptEvent, onExit }) {
  const navigate = useNavigate();
  const a11y = useAccessibilityPrefs();
  const restored = useMemo(() => {
    const active = getActiveFlagship();
    return active?.interventionId === "factCheck" ? { ...active, data: normaliseThoughtOrFactDraft(active.data) } : null;
  }, []);
  const restoredStage = restored?.data?.stage ? (LEGACY_STAGES[restored.data.stage] || restored.data.stage) : null;
  const [stage, setStage] = useState(
    restoredStage && STAGES.includes(restoredStage) ? restoredStage : (initialThought ? "belief" : "capture"),
  );
  const [data, setData] = useState(restored?.data || {
    stage: "capture",
    thought: initialThought,
    refinedClaim: initialThought,
    beliefVersion: 2,
    certaintyBefore: null,
    certaintyAfter: null,
    balancedConfirmed: false,
    fragments: [],
    sortIndex: 0,
    assignments: {},
    support: [],
    alternatives: [],
    uncertainty: [],
    fairerView: { adaptive: "", known: "", against: "", added: "", open: "" },
    saved: false,
  });
  const startedAt = useRef(Date.now());

  const stageIndex = Math.max(0, STAGES.indexOf(stage));
  const stageAnnouncement = { belief: "Rate how true the original thought feels, or leave it unanswered.", capture: "Thought capture. Enter one thought in your own words.", sort: "Choose the closest description for the thought.", evidence: "Look at the thought from both sides. Everything here is optional.", ruling: "Review your more balanced thought.", direction: "Choose what would be useful now.", complete: "Your private reflection is ready." }[stage];
  const update = (patch) => setData((current) => ({ ...current, ...patch }));
  const go = (nextStage, patch = {}) => {
    setStage(nextStage);
    setData((current) => ({ ...current, ...patch, stage: nextStage }));
    window.scrollTo({ top: 0, behavior: a11y.prefs.reducedMotion ? "auto" : "smooth" });
  };

  const fragments = data.fragments?.length ? data.fragments : splitThought(data.thought);
  const sortIndex = Math.min(Math.max(0, data.sortIndex || 0), Math.max(0, fragments.length - 1));
  const currentFragment = fragments[sortIndex] || { id: "fragment-0", text: data.refinedClaim || data.thought };

  useEffect(() => {
    saveActiveFlagship({ interventionId: "factCheck", step: stageIndex, data: normaliseThoughtOrFactDraft({ ...data, fragments, stage }) });
  }, [data, fragments, stage, stageIndex]);
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category.id, Object.values(data.assignments || {}).filter((value) => value === category.id).length]));
  const hasPrediction = Boolean(counts.prediction || (data.predictions || []).length);
  const hasActionable = Boolean((data.support || data.facts || []).length);
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

  const createFairerView = (patch = {}) => defaultFairerView(data.thought, fragments, data.assignments || {}, data.alternatives || [], data.uncertainty || [], { ...data, ...patch });

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
      // The shared preference sanitizer turns null into "selected"; omit missing measurements.
      options: Object.fromEntries(Object.entries(learningRecord).filter(([, value]) => value !== null)),
    });
    clearActiveFlagship("factCheck");
    onAttemptEvent?.({ interventionId: "factCheck", mechanism: intervention.mechanism, action: "completed", completedPercentage: 1, timestamp: Date.now(), startedAt: startedAt.current });
    onComplete?.({ requireGoalReassessment: true, outcome: { classificationCounts: counts, certaintyBefore: data.certaintyBefore, certaintyAfter: data.certaintyAfter, saved } });
  };

  const handleSave = () => {
    const saved = saveRecord({
      id: globalThis.crypto?.randomUUID?.() || `tof-${Date.now()}`,
      createdAt: new Date().toISOString(),
      thought: data.thought,
      ruling: data.balancedConfirmed ? data.fairerView?.adaptive : "Left unresolved",
      fairerView: data.balancedConfirmed ? data.fairerView : null,
      balancedConfirmed: data.balancedConfirmed === true,
      returnPhrase: data.returnPhrase,
      certaintyBefore: data.certaintyBefore,
      certaintyAfter: data.certaintyAfter,
      classifications: counts,
    });
    update({ saved, saveError: !saved });
  };

  const back = () => {
    if (stage === "sort" && sortIndex > 0) {
      update({ sortIndex: sortIndex - 1 });
      return;
    }
    const previous = { belief: "capture", sort: "belief", evidence: "sort", ruling: "evidence", direction: "ruling", complete: "direction" }[stage];
    if (previous) go(previous, previous === "sort" ? { sortIndex: Math.max(0, fragments.length - 1) } : {});
    else onExit?.();
  };

  return (
    <MotionConfig reducedMotion={a11y.prefs.reducedMotion ? "always" : "never"}>
    <InterventionControlShell
      id="factCheck"
      goal="calm"
      title="Thought or Fact?"
      stage={Math.max(1, stepFor(stage))}
      stages={STEP_COUNT}
      quiet
      onBack={back}
      onExit={onExit}
      onSimplify={() => go(stage === "evidence" ? "ruling" : stage, stage === "evidence" ? { fairerView: createFairerView(), balancedConfirmed: false, saved: false } : {})}
      simplifyLabel={stage === "evidence" ? "Skip to a balanced thought" : "Use less guidance"}
      onDifferent={() => launch("grounding54321V2")}
      accent="#00f5d4"
      dark
      className={`tof-shell ${a11y.prefs.reducedMotion ? "tof-reduced-motion" : ""}`}
      field={<div className="tof-world" aria-hidden="true"><div className="tof-world__glow" /></div>}
    >
      <div className="tof-experience" data-tof-stage={stage}>
        <div className="tof-live-region sr-only" role="status" aria-live="polite">{stageAnnouncement}</div>
        <p className="tof-note"><LockKeyhole aria-hidden="true" /> Private on this device. Your thought and progress are automatically stored here as a draft, resumable for 24 hours after your last change. Evidence is kept when you tap Add or Continue. Finish clears the draft; optional Save keeps a separate copy.</p>
        {stepFor(stage) > 0 && <Steps current={stepFor(stage)} />}
        <AnimatePresence initial={false}>
          {stage === "capture" && <CaptureStage key="capture" thought={data.thought} setThought={(thought) => update({ thought })} onContinue={() => go("belief", { certaintyBefore: null, certaintyAfter: null, balancedConfirmed: false, refinedClaim: data.thought, fragments: splitThought(data.thought), assignments: {}, sortIndex: 0 })} />}
          {stage === "belief" && <BeliefStage key="belief" thought={data.thought} value={beliefRating(data.certaintyBefore)} onChange={(certaintyBefore) => update({ certaintyBefore })} onContinue={() => go("sort")} />}
          {stage === "sort" && <SortStage key={`sort-${sortIndex}`} claim={currentFragment.text} currentIndex={sortIndex} total={fragments.length || 1} selected={data.distortions || []} setSelected={(distortions) => update({ distortions })} onSelect={(category) => {
            const assignments = { ...(data.assignments || {}), [currentFragment.id]: category };
            if (sortIndex < fragments.length - 1) update({ assignments, sortIndex: sortIndex + 1 });
            else go("evidence", { assignments, sortIndex });
          }} />}
          {stage === "evidence" && <EvidenceStage key="evidence" data={data} update={update} onContinue={(patch) => go("ruling", { ...patch, fairerView: createFairerView(patch), balancedConfirmed: false, saved: false })} />}
          {stage === "ruling" && <RulingStage key="ruling" thought={data.thought} confirmed={data.balancedConfirmed === true} setConfirmed={(balancedConfirmed) => update({ balancedConfirmed, saved: false })} fairerView={data.fairerView || createFairerView()} initialFairerView={createFairerView()} certaintyBefore={data.certaintyBefore} rating={beliefRating(data.certaintyAfter)} setRating={(certaintyAfter) => update({ certaintyAfter, saved: false })} updateFairerView={(fairerView) => update({ fairerView, balancedConfirmed: false, saved: false })} onContinue={() => go("direction")} onUnresolved={() => go("direction", { direction: "unresolved", balancedConfirmed: false, saved: false })} />}
          {stage === "direction" && <DirectionStage key="direction" hasPrediction={hasPrediction} hasActionable={hasActionable} predictionText={predictionText} knownContext={knownContext} openContext={openContext} onFinish={() => go("complete")} onAction={() => launch("nextAction")} onTest={() => { recordHandoffDecision("factCheck", "testPrediction", "accepted"); clearActiveFlagship("factCheck"); navigate("/reset", { replace: true, state: { prebuilt: true, pathway: ["testPrediction"], direction: "lift", directionLabel: "Test the Prediction", intensity: answers?.intensity || 5, whereFelt: "thoughts", timeMin: 4, audio: answers?.audio || "yes" } }); }} onGround={() => launch("grounding54321V2")} />}
          {stage === "complete" && <CompletionStage key="complete" confirmed={data.balancedConfirmed === true} saveError={data.saveError} thought={data.thought} fairerView={data.fairerView} returnPhrase={data.returnPhrase || ""} setReturnPhrase={(returnPhrase) => update({ returnPhrase, saved: false })} saved={data.saved} onSave={handleSave} onFinish={() => finish()} />}
        </AnimatePresence>
      </div>
    </InterventionControlShell>
    </MotionConfig>
  );
}
