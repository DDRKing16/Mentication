import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Check, ArrowRight, ArrowLeft, RotateCcw, X, Mic, Scale, LockKeyhole } from "lucide-react";
import IntensityDial from "@/components/IntensityDial";
import ChoiceButtons from "@/components/ChoiceButtons";
import ResetPlayer from "@/components/ResetPlayer";
import FlagshipExperience, { isInteractiveFlagship } from "@/components/FlagshipExperience";
import NewFlagshipExperience, { isNewFlagship } from "@/components/NewFlagshipExperiences";
import ThoughtOrFactExperience from "@/components/ThoughtOrFactExperience";
import UrgeSurfExperience from "@/components/UrgeSurfExperience";
import { warmNarration } from "@/lib/preloadBoxV2";
import {
  buildPathway,
  buildSegment,
  segmentMinutes,
  pathwayByIds,
  DIRECTIONS,
  computeEffectiveness,
  buildAttemptRecord,
  coarseContextKey,
  TIME_OPTIONS,
  WHERE_OPTIONS,
  AUDIO_OPTIONS,
  MOVE_OPTIONS,
  LOCATION_OPTIONS,
} from "@/lib/interventions";
import { AWAKE_REASONS } from "@/lib/sleep";
import PreferencesRow from "@/components/PreferencesRow";
import FlowHomeButton from "@/components/FlowHomeButton";
import { sessionStore } from "@/lib/localData";
import { useFreeQuota } from "@/hooks/useFreeQuota";
import { playComplete } from "@/lib/feedback";
import { recordHandoffDecision } from "@/lib/flagshipMemory";
import "@/styles/thought-or-fact.css";
import "@/styles/urge-surfing.css";

const WHERE_FELT_DEFAULT = { calm: "body", lift: "both", reset: "thoughts", ground: "both", focus: "thoughts", sleep: "body" };

const QUESTIONS = [
  { key: "intensity", title: "How intense is it right now?", sub: "There’s no wrong number. Just an honest first read.", render: "intensity" },
];

const REMAIN_CHIPS = [
  { id: "thoughts", label: "Racing thoughts", direction: "reset", whereFelt: "thoughts" },
  { id: "body", label: "Tense body", direction: "calm", whereFelt: "body" },
  { id: "low", label: "Low / flat", direction: "lift", whereFelt: "both" },
  { id: "focus", label: "Can’t focus", direction: "focus", whereFelt: "thoughts" },
  { id: "wired", label: "Wired / wakeful", direction: "sleep", whereFelt: "body" },
  { id: "none", label: "Nothing — I’m good", direction: null, whereFelt: null },
];
const REMAIN_MAP = Object.fromEntries(REMAIN_CHIPS.map((c) => [c.id, { direction: c.direction, whereFelt: c.whereFelt }]));

export default function ResetFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = location.state;
  const { allowed, isPremium, loading: quotaLoading } = useFreeQuota();

  const initialPhase = entry?.prebuilt ? "pathway" : (entry?.unsure ? "unsure" : (entry?.immediate ? "pathway" : "questions"));
  const [phase, setPhase] = useState(initialPhase); // unsure | questions | building | pathway | guiding | reflect | done
  const [qIndex, setQIndex] = useState(0);
  const [building, setBuilding] = useState(!!entry?.immediate);
  // iOS back-gesture support: each forward setup step pushes a history entry so
  // swipe-back steps chronologically through the flow instead of exiting.
  const flowStack = useRef([{ phase: initialPhase, qIndex: 0, unsureStep: 0 }]);
  const buildingTimer = useRef(null);
  const stepParam = useMemo(() => parseInt(new URLSearchParams(location.search).get("step") || "0", 10) || 0, [location.search]);
  const [answers, setAnswers] = useState({
    direction: entry?.direction ?? (entry?.immediate ? "calm" : null),
    directionLabel: entry?.directionLabel ?? (entry?.immediate ? "Calm down" : ""),
    immediate: !!entry?.immediate,
    intensity: entry?.intensity ?? (entry?.immediate ? 9 : null),
    whereFelt: entry?.whereFelt ?? (entry?.direction ? (WHERE_FELT_DEFAULT[entry.direction] || "both") : null),
    timeMin: entry?.timeMin ?? 5,
    audio: entry?.audio ?? "yes",
    movement: entry?.movement ?? "seated",
    location: entry?.location ?? "home",
    situation: entry?.situation ?? null,
    awake_reason: null,
    discreet: !!entry?.discreet,
    eyesOpen: false,
    noBreathing: false,
    noAudio: false,
    bedtime: !!entry?.bedtime,
  });

  const [endIntensity, setEndIntensity] = useState(null);
  const [tofEntryThought, setTofEntryThought] = useState("");
  const [tofReady, setTofReady] = useState(false);
  const [tofVoiceState, setTofVoiceState] = useState("idle");
  const [tofVoiceSeconds, setTofVoiceSeconds] = useState(0);
  const voiceStreamRef = useRef(null);
  const [whatHelped, setWhatHelped] = useState("");
  const [wouldUseAgain, setWouldUseAgain] = useState(null);
  const [unsureStep, setUnsureStep] = useState(0);
  const [unsureBranch, setUnsureBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  // coaching loop state
  const [activePathway, setActivePathway] = useState(null);
  const [usedIds, setUsedIds] = useState([]);
  const [planRemaining, setPlanRemaining] = useState(0);
  const [lastValue, setLastValue] = useState(answers.intensity ?? 5);
  const [checkinValue, setCheckinValue] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [showSwitch, setShowSwitch] = useState(false);
  const startTimeRef = useRef(Date.now());

  const [effectiveness, setEffectiveness] = useState({});
  const sessionHistoryRef = useRef([]);
  const attemptLogRef = useRef([]);
  const pendingCompletionRef = useRef(null);
  const [weekCount, setWeekCount] = useState(0);
  useEffect(() => {
    let mounted = true;
    sessionStore.list("-created_date", 50).then((sessions) => {
      if (!mounted) return;
      sessionHistoryRef.current = sessions;
      setEffectiveness(computeEffectiveness(sessions));
      const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
      setWeekCount(sessions.filter((s) => new Date(s.created_date).getTime() >= since).length);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  // immediate mode skips questions — show a brief building animation, then the pathway
  useEffect(() => {
    if (entry?.immediate) {
      const t = setTimeout(() => setBuilding(false), 800);
      return () => clearTimeout(t);
    }
  }, [entry?.immediate]);

  // restore flow state when the user navigates back (iOS swipe-back)
  useEffect(() => {
    if (stepParam < flowStack.current.length - 1) {
      if (buildingTimer.current) { clearTimeout(buildingTimer.current); buildingTimer.current = null; }
      const snap = flowStack.current[stepParam];
      flowStack.current = flowStack.current.slice(0, stepParam + 1);
      if (snap) {
        setPhase(snap.phase);
        setQIndex(snap.qIndex ?? 0);
        setUnsureStep(snap.unsureStep ?? 0);
        setBuilding(false);
      }
    }
  }, [stepParam]);
  useEffect(() => () => { if (buildingTimer.current) clearTimeout(buildingTimer.current); }, []);

  // Completion reliably returns the user home: after the affirming done
  // screen, gently auto-advance to home. Any tap cancels by changing the phase
  // or navigating.
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => navigate("/", { replace: true }), 4500);
    return () => clearTimeout(t);
  }, [phase, navigate]);

  const pathway = useMemo(() => {
    return entry?.prebuilt ? pathwayByIds(entry.pathway) : buildPathway(answers, effectiveness);
  }, [entry, answers, effectiveness]);
  const pathwayPreview = entry?.prebuilt ? pathway : pathway.slice(0, 1);
  const isThoughtOrFactEntry = entry?.prebuilt && pathway.length === 1 && pathway[0]?.id === "factCheck";

  const releaseThoughtVoice = () => {
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceStreamRef.current = null;
  };

  useEffect(() => {
    if (tofVoiceState !== "listening") return undefined;
    const timer = window.setInterval(() => setTofVoiceSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [tofVoiceState]);

  useEffect(() => () => releaseThoughtVoice(), []);

  const startThoughtVoiceEntry = async () => {
    setTofVoiceSeconds(0);
    if (!navigator.mediaDevices?.getUserMedia) {
      setTofVoiceState("idle");
      return;
    }
    try {
      voiceStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTofVoiceState("listening");
    } catch {
      setTofVoiceState("idle");
    }
  };

  const stopThoughtVoiceEntry = () => {
    releaseThoughtVoice();
    setTofVoiceState("stopped");
  };

  const returnToThoughtWriting = () => {
    releaseThoughtVoice();
    setTofVoiceSeconds(0);
    setTofVoiceState("idle");
  };

  // Preload the first Box Breathing V2 narration as soon as the intervention
  // is selected. The native SVG Breath Loom has no media-loading gate.
  useEffect(() => {
    const first = pathway[0];
    if (first?.id === "boxV2") {
      warmNarration(first, answers.direction);
    }
  }, [pathway, answers.direction]);

  if (!entry) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg text-muted-foreground">Let’s start from the beginning.</p>
        <Button onClick={() => navigate("/")} className="rounded-full">Back to home</Button>
      </div>
    );
  }

  const setAnswer = (key, value) => setAnswers((a) => ({ ...a, [key]: value }));

  const advance = (snap) => {
    flowStack.current.push({
      phase: snap.phase,
      qIndex: snap.qIndex ?? qIndex,
      unsureStep: snap.unsureStep ?? unsureStep,
    });
    setPhase(snap.phase);
    if (snap.qIndex != null) setQIndex(snap.qIndex);
    if (snap.unsureStep != null) setUnsureStep(snap.unsureStep);
    navigate(`/reset?step=${flowStack.current.length - 1}`, { state: entry });
  };
  const goBack = () => {
    if (flowStack.current.length > 1) navigate(-1);
    else navigate("/");
  };

  const nextQuestion = () => {
    if (qIndex < QUESTIONS.length - 1) {
      advance({ phase: "questions", qIndex: qIndex + 1 });
    } else {
      if (!isPremium && !quotaLoading && allowed <= 0) return;
      setBuilding(true);
      buildingTimer.current = setTimeout(() => { setBuilding(false); advance({ phase: "pathway" }); }, 650);
    }
  };
  const prevQuestion = () => goBack();

  const currentQ = QUESTIONS[qIndex];
  const canProceed = () => {
    if (currentQ.key === "intensity") return answers.intensity !== null;
    return answers[currentQ.key] !== null;
  };

  const currentAttemptContext = (intensity = lastValue) => ({
    ...answers,
    intensity: intensity ?? answers.intensity ?? 5,
    subtype: answers.subtype || undefined,
  });

  const rebuildEffectivenessWithLiveAttempts = (attempts = attemptLogRef.current) => {
    const liveSession = attempts.length ? [{
      created_date: new Date().toISOString(),
      direction: answers.direction,
      attempts,
      context_snapshot: currentAttemptContext(lastValue),
      pathway: attempts.map((a) => a.intervention_id).filter(Boolean),
    }] : [];
    const next = computeEffectiveness([...sessionHistoryRef.current, ...liveSession]);
    setEffectiveness(next);
    return next;
  };

  const handleAttemptEvent = (event) => {
    if (!event?.interventionId) return;
    if (event.action === "completed") {
      pendingCompletionRef.current = event;
      return;
    }

    const response = event.action === "switched" ? "worse" : "not_answered";
    const record = buildAttemptRecord({
      interventionId: event.interventionId,
      mechanism: event.mechanism,
      startedAt: event.startedAt ? new Date(event.startedAt).toISOString() : new Date(event.timestamp || Date.now()).toISOString(),
      endedAt: new Date(event.timestamp || Date.now()).toISOString(),
      completedPercentage: event.completedPercentage ?? (event.action === "switched" ? 0.5 : 0.25),
      response,
      exitReason: event.action === "switched" ? "switched" : "skipped",
      switchPreference: event.switchReason || null,
      coarseContextKey: coarseContextKey(currentAttemptContext(lastValue)),
    });
    attemptLogRef.current = [...attemptLogRef.current, record];

    // A V3 in-player switch changes the practice that is actually running.
    // Keep the parent pathway/used-id state aligned so the next re-rank cannot
    // accidentally recommend that replacement again and "repeat last" repeats
    // the practice the user actually received.
    if (event.action === "switched" && event.replacementId) {
      const replacement = pathwayByIds([event.replacementId])[0];
      if (replacement) {
        setActivePathway([replacement]);
        setUsedIds((prev) => Array.from(new Set([...prev, replacement.id])));
      }
    }
    rebuildEffectivenessWithLiveAttempts();
  };

  const pulseResponse = (before, after) => {
    if (before == null || after == null) return "not_answered";
    const delta = Number(after) - Number(before);
    if (delta === 0) return "same";
    const improved = answers.direction === "lift" ? delta > 0 : delta < 0;
    return improved ? "better" : "worse";
  };

  const commitPendingPulse = (afterValue = checkinValue ?? lastValue) => {
    const event = pendingCompletionRef.current;
    if (!event?.interventionId) return effectiveness;
    const response = pulseResponse(lastValue, afterValue);
    const record = buildAttemptRecord({
      interventionId: event.interventionId,
      mechanism: event.mechanism,
      startedAt: event.startedAt ? new Date(event.startedAt).toISOString() : new Date(event.timestamp || Date.now()).toISOString(),
      endedAt: new Date(event.timestamp || Date.now()).toISOString(),
      completedPercentage: event.completedPercentage ?? 1,
      response,
      exitReason: "completed",
      coarseContextKey: coarseContextKey(currentAttemptContext(lastValue)),
    });
    attemptLogRef.current = [...attemptLogRef.current, record];
    pendingCompletionRef.current = null;
    return rebuildEffectivenessWithLiveAttempts(attemptLogRef.current);
  };

  const beginGuided = () => {
    const first = pathway[0];
    if (!first) return;
    attemptLogRef.current = [];
    pendingCompletionRef.current = null;
    setActivePathway([first]);
    setUsedIds([first.id]);
    setPlanRemaining(Math.max(0, (answers.timeMin || 5) - segmentMinutes([first])));
    setLastValue(answers.intensity ?? 5);
    advance({ phase: "guiding" });
  };

  const onSegmentComplete = () => {
    setCheckinValue(lastValue);
    setRemaining(null);
    advance({ phase: "checkpoint" });
  };

  const startSegment = (opts, effectivenessOverride = effectiveness) => {
    const nextIntensity = checkinValue ?? lastValue ?? answers.intensity ?? 5;
    const resolvedDirection = opts.direction || answers.direction;
    const resolvedWhereFelt = opts.whereFelt || answers.whereFelt;
    const nextAnswers = {
      ...answers,
      direction: resolvedDirection,
      whereFelt: resolvedWhereFelt,
      intensity: nextIntensity,
    };
    // V3 re-ranks after every completed practice. A segment is therefore one
    // intervention; the next one is chosen only after the checkpoint pulse.
    const seg = buildSegment(nextAnswers, effectivenessOverride, { ...opts, count: 1, usedIds });
    if (!seg || seg.length === 0) { setEndIntensity(nextIntensity); advance({ phase: "reflect" }); return; }
    setActivePathway(seg);
    setUsedIds((prev) => Array.from(new Set([...prev, ...seg.map((p) => p.id)])));
    if (resolvedDirection !== answers.direction || resolvedWhereFelt !== answers.whereFelt) {
      setAnswers((prev) => ({
        ...prev,
        direction: resolvedDirection,
        whereFelt: resolvedWhereFelt,
      }));
    }
    setLastValue(nextIntensity);
    setCheckinValue(null);
    advance({ phase: "guiding" });
  };

  // Re-run the segment the user just finished — same practice, fresh start.
  const repeatLast = () => {
    if (!activePathway || !activePathway.length) return;
    const nextIntensity = checkinValue ?? lastValue;
    commitPendingPulse(nextIntensity);
    setLastValue(nextIntensity);
    setCheckinValue(null);
    advance({ phase: "guiding" });
  };

  const continueCoaching = () => {
    const nextIntensity = checkinValue ?? lastValue;
    const nextEffectiveness = commitPendingPulse(nextIntensity);
    const remTarget = Math.min(6, Math.max(1, Math.round(planRemaining)));
    const implied = remaining ? REMAIN_MAP[remaining] : null;
    if (implied && implied.direction && implied.direction !== answers.direction) {
      startSegment({ targetMin: Math.min(6, Math.max(2, remTarget)), direction: implied.direction, whereFelt: implied.whereFelt }, nextEffectiveness);
      setPlanRemaining(0);
      return;
    }
    startSegment({ targetMin: remTarget, whereFelt: implied?.whereFelt }, nextEffectiveness);
    setPlanRemaining((prev) => Math.max(0, prev - remTarget));
  };

  const addMore = (mins, count) => {
    const nextIntensity = checkinValue ?? lastValue;
    const nextEffectiveness = commitPendingPulse(nextIntensity);
    const implied = remaining ? REMAIN_MAP[remaining] : null;
    startSegment({ targetMin: mins, count: 1, whereFelt: implied?.whereFelt }, nextEffectiveness);
  };

  const switchDirection = (dir) => {
    const nextIntensity = checkinValue ?? lastValue;
    const nextEffectiveness = commitPendingPulse(nextIntensity);
    setShowSwitch(false);
    startSegment({ targetMin: Math.min(6, Math.max(2, answers.timeMin || 5)), direction: dir }, nextEffectiveness);
    setPlanRemaining(0);
  };

  const wrapUp = () => {
    const finalValue = checkinValue ?? lastValue;
    commitPendingPulse(finalValue);
    setEndIntensity(finalValue);
    advance({ phase: "reflect" });
  };

  const completeSession = (options = {}) => {
    if (!options.silent && !answers.discreet && !answers.noAudio) playComplete();
    const payload = {
      state: answers.direction,
      state_label: answers.directionLabel,
      direction: answers.direction,
      direction_label: answers.directionLabel,
      intensity_start: answers.intensity,
      intensity_end: options.endIntensityOverride ?? endIntensity,
      where_felt: answers.whereFelt,
      time_min: answers.timeMin,
      audio: answers.audio,
      movement: answers.movement,
      immediate: answers.immediate,
      pathway: usedIds.length ? usedIds : pathway.map((p) => p.id),
      completed_pathway: attemptLogRef.current.filter((a) => a.exit_reason === "completed").map((a) => a.intervention_id),
      attempts: attemptLogRef.current,
      context_snapshot: {
        ...answers,
        intensity: answers.intensity,
        where_felt: answers.whereFelt,
      },
      recommendation_engine_version: "3.1.0-core25",
      what_helped: whatHelped.trim() || undefined,
      would_use_again: wouldUseAgain || undefined,
      duration_sec: Math.round((Date.now() - startTimeRef.current) / 1000),
      situation: answers.situation || undefined,
      awake_reason: answers.awake_reason || undefined,
      discreet: !!answers.discreet,
      eyes_open: !!answers.eyesOpen,
      no_breathing: !!answers.noBreathing,
      no_audio: !!answers.noAudio,
      bedtime: !!answers.bedtime,
      intervention_outcome: options.interventionOutcome || undefined,
    };
    // Dedicated premium experiences may own their complete state and return
    // directly home; legacy pathways retain the shared completion screen.
    if (options.direct) navigate("/", { replace: true });
    else advance({ phase: "done" });
    sessionStore.create(payload).catch(() => {
      // non-blocking — the experience continues regardless
    });
  };

  // quietly re-run the just-completed pathway from the overview
  const restartSame = () => {
    if (buildingTimer.current) clearTimeout(buildingTimer.current);
    flowStack.current = [{ phase: "pathway", qIndex: 0, unsureStep: 0 }];
    startTimeRef.current = Date.now();
    setPhase("pathway");
    setQIndex(0);
    setUnsureStep(0);
    setBuilding(false);
    setActivePathway(null);
    setUsedIds([]);
    setPlanRemaining(0);
    setEndIntensity(null);
    setWhatHelped("");
    setWouldUseAgain(null);
    setRemaining(null);
    setShowSwitch(false);
    setCheckinValue(null);
    attemptLogRef.current = [];
    pendingCompletionRef.current = null;
    navigate(`/reset?step=0`, { state: entry });
  };

  // ---------- BUILDING ----------
  if (building) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-cream via-background to-background px-6">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal/40 to-indigo/40 breath-glow"
        >
          <Sparkles className="h-9 w-9 text-primary" strokeWidth={1.4} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-heading text-2xl text-primary tracking-tight"
        >
          Building your reset…
        </motion.p>
        <p className="text-muted-foreground">Tailoring a pathway just for you.</p>
      </div>
    );
  }

  // ---------- PATHWAY OVERVIEW ----------
  if (phase === "pathway") {
    if (!pathway.length) {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-5 px-6 text-center">
          <FlowHomeButton />
          <h1 className="font-heading text-3xl font-medium text-primary">No safe match for these settings</h1>
          <p className="max-w-md text-muted-foreground">Adjust the intensity or session preferences and try again. Mentication will not bypass hard eligibility rules to force a recommendation.</p>
          <Button onClick={() => advance({ phase: "questions", qIndex: 0 })} className="rounded-full">Adjust settings</Button>
        </div>
      );
    }
    if (isThoughtOrFactEntry && !tofReady) {
      return <div className="tof-readiness">
        <header className="tof-entry__header"><button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="tof-entry__icon"><ArrowLeft /></button><p>Thought or Fact?</p><button type="button" onClick={() => navigate("/")} aria-label="Exit Thought or Fact" className="tof-entry__icon"><X /></button></header>
        <main className="tof-readiness__main">
          <div><p className="tof-readiness__eyebrow">A quiet examination</p><h1>Hold the thought up to the light.</h1><p>Separate what happened from what your mind added.</p></div>
          <details><summary>This is for an everyday upsetting thought.</summary><p>If you’re in immediate danger, dealing with abuse or trauma, or need urgent medical or legal help, choose support instead.</p></details>
          <div className="tof-readiness__actions"><button type="button" onClick={() => setTofReady(true)} className="tof-entry__primary">Begin <ArrowRight /></button><button type="button" className="tof-entry__ground" onClick={() => navigate("/reset", { state: { prebuilt: true, pathway: ["grounding54321V2"], direction: "ground", intensity: answers.intensity ?? 5, timeMin: 5, audio: answers.audio } })}>Ground first</button><button type="button" className="tof-entry__ground" onClick={() => navigate("/reset", { state: { prebuilt: true, pathway: ["nextAction"], direction: "focus", intensity: answers.intensity ?? 5, timeMin: 3, audio: answers.audio } })}>Take a practical step</button></div>
        </main>
      </div>;
    }
    if (isThoughtOrFactEntry && tofVoiceState !== "idle") {
      const isListening = tofVoiceState === "listening";
      const elapsed = String(Math.floor(tofVoiceSeconds / 60)).padStart(2, "0") + ":" + String(tofVoiceSeconds % 60).padStart(2, "0");
      return (
        <div className="tof-voice" data-state={tofVoiceState}>
          <header className="tof-entry__header">
            <button type="button" onClick={returnToThoughtWriting} aria-label="Return to writing" className="tof-entry__icon"><ArrowLeft /></button>
            <p>Thought or Fact?</p>
            <button type="button" onClick={() => navigate("/")} aria-label="Exit Thought or Fact" className="tof-entry__icon"><X /></button>
          </header>
          <div className="tof-entry__progress" aria-label="Stage 1 of 8">{Array.from({ length: 8 }, (_, index) => <span key={index} className={index === 0 ? "is-active" : ""} />)}</div>
          <main className="tof-voice__main">
            <div className="tof-voice__intro">
              <p>Voice capture</p>
              <h1>{isListening ? "I’m listening." : tofVoiceState === "unavailable" ? "Voice capture isn’t available." : "Recording paused."}</h1>
              <span>{isListening ? "Say the thought exactly as it appears." : tofVoiceState === "unavailable" ? "You can continue by writing it instead." : "Your typed thought is still here."}</span>
            </div>
            <section className="tof-voice__panel" aria-live="polite">
              <div className="tof-voice__pulse"><Mic aria-hidden="true" /></div>
              <div className="tof-voice__wave" aria-hidden="true">{Array.from({ length: 17 }, (_, index) => <span key={index} style={{ "--wave-delay": index * -0.08 + "s" }} />)}</div>
              <time dateTime={"PT" + tofVoiceSeconds + "S"}>{elapsed}</time>
              {isListening ? <button type="button" onClick={stopThoughtVoiceEntry} className="tof-voice__stop"><span aria-hidden="true" />Stop recording</button> : <p className="tof-voice__status">{tofVoiceState === "unavailable" ? "Microphone permission was not granted." : "No recording has been kept."}</p>}
            </section>
            <p className="tof-voice__privacy"><LockKeyhole aria-hidden="true" /> Audio is not saved</p>
            <div className="tof-voice__actions"><button type="button" disabled className="tof-entry__primary">Use recording</button><button type="button" onClick={returnToThoughtWriting} className="tof-entry__ground">Cancel</button></div>
          </main>
        </div>
      );
    }

    if (isThoughtOrFactEntry) {
      return (
        <div className="tof-entry">
          <header className="tof-entry__header">
            <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="tof-entry__icon"><ArrowLeft /></button>
            <p>Thought or Fact?</p>
            <button type="button" onClick={() => navigate("/")} aria-label="Exit Thought or Fact" className="tof-entry__icon"><X /></button>
          </header>
          <div className="tof-entry__progress" aria-label="Stage 1 of 8">{Array.from({ length: 8 }, (_, index) => <span key={index} className={index === 0 ? "is-active" : ""} />)}</div>
          <main className="tof-entry__main">
            <div className="tof-entry__intro"><h1>What thought are you putting on trial?</h1><p>Write it as it appears in your mind.</p></div>
            <section className="tof-entry__folder">
              <div className="tof-entry__tab"><Scale aria-hidden="true" /></div>
              <label className="tof-entry__field"><textarea value={tofEntryThought} onChange={(event) => setTofEntryThought(event.target.value)} maxLength={360} placeholder="For example: I made a mistake." aria-label="The thought you want to examine" /><button type="button" aria-label="Start voice entry" className="tof-entry__mic" onClick={startThoughtVoiceEntry}><Mic /></button></label>
              <p><LockKeyhole aria-hidden="true" /> Private on this device</p>
            </section>
            <div className="tof-entry__actions"><button type="button" disabled={tofEntryThought.trim().length < 3} onClick={beginGuided} className="tof-entry__primary">Open case</button><button type="button" onClick={() => navigate("/reset", { state: { prebuilt: true, pathway: ["grounding54321V2"], direction: "ground", intensity: answers.intensity ?? 5, timeMin: 5, audio: answers.audio } })} className="tof-entry__ground">Ground first</button></div>
          </main>
        </div>
      );
    }

    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
          <div className="flex justify-end">
            <FlowHomeButton />
          </div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Your reset</p>
          <h1 className="mt-3 font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
            Your {answers.timeMin}-minute reset
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-balance">
            {entry?.prebuilt
              ? `${pathway.length} practice${pathway.length === 1 ? "" : "s"}, one at a time.`
              : "Starting with the best-fit practice. The next step will adapt after your check-in."}
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {pathwayPreview.map((iv, i) => (
              <motion.div
                key={iv.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 soft-depth"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-heading text-lg font-medium tracking-tight text-foreground">{iv.name}</p>
                  <p className="text-sm leading-snug text-muted-foreground">{iv.why}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {!entry?.prebuilt && (
            <PreferencesRow answers={answers} setAnswers={setAnswers} />
          )}

          <div className="mt-10 flex justify-center">
            <Button
              size="lg"
              onClick={beginGuided}
              data-sfx="select"
              className="h-16 w-full max-w-sm rounded-full bg-primary text-lg font-medium text-primary-foreground soft-depth active:scale-95"
            >
              Begin <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- GUIDING ----------
  if (phase === "guiding" && activePathway) {
    const interactive = activePathway.length === 1 && isInteractiveFlagship(activePathway[0]?.id);
    if (interactive) {
      const interventionId = activePathway[0]?.id;
      const Experience = interventionId === "factCheck"
        ? ThoughtOrFactExperience
        : interventionId === "urgeSurf"
          ? UrgeSurfExperience
        : isNewFlagship(interventionId)
          ? NewFlagshipExperience
          : FlagshipExperience;
      return (
        <Experience
          intervention={activePathway[0]}
          initialThought={interventionId === "factCheck" ? tofEntryThought : undefined}
          initialCertainty={interventionId === "factCheck" ? answers.intensity : undefined}
          answers={{ ...answers, intensity: lastValue }}
          onAttemptEvent={handleAttemptEvent}
          onComplete={(result) => {
            commitPendingPulse(lastValue);
            setEndIntensity(lastValue);
            if (result?.skipReflection) {
              completeSession({
                direct: true,
                silent: true,
                endIntensityOverride: lastValue,
                interventionOutcome: result.outcome,
              });
              return;
            }
            advance({ phase: "reflect" });
          }}
          onExit={() => navigate("/")}
        />
      );
    }
    return (
      <ResetPlayer
        pathway={activePathway}
        answers={{ ...answers, intensity: lastValue }}
        effectiveness={effectiveness}
        onAttemptEvent={handleAttemptEvent}
        onComplete={onSegmentComplete}
        onExit={() => navigate("/")}
      />
    );
  }

  // ---------- CHECKPOINT (coaching loop) ----------
  if (phase === "checkpoint") {
    const isLift = answers.direction === "lift";
    const v = checkinValue ?? lastValue ?? 5;
    const delta = v - lastValue;
    const improved = isLift ? delta : -delta;
    const implied = remaining ? REMAIN_MAP[remaining] : null;
    const shiftsDir = implied && implied.direction && implied.direction !== answers.direction;
    const dirLabel = (id) => (DIRECTIONS.find((d) => d.id === id) || {}).label || id;
    const remMin = Math.round(planRemaining);

    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto flex min-h-full max-w-xl flex-col items-center px-5 pt-6 pb-10 sm:px-8">
          <div className="flex w-full justify-start">
            <FlowHomeButton />
          </div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Let’s check in</p>
            <h1 className="mt-2 font-heading text-2xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-3xl">
              How are you now?
            </h1>
            {usedIds.length > 0 && (
              <p className="mt-2 text-sm text-muted-foreground">{usedIds.length} practice{usedIds.length === 1 ? "" : "s"} so far{planRemaining > 0 ? ` · ${remMin} min left in your plan` : ""}</p>
            )}
          </motion.div>

          <div className="mt-4 w-full max-w-md">
            <IntensityDial value={v} onChange={setCheckinValue} direction={answers.direction} compact />
          </div>

          {delta !== 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 font-heading text-lg text-indigo italic text-center text-balance">
              {improved > 0
                ? isLift ? `Up ${delta} — that’s real.` : `Down ${Math.abs(delta)} — that’s real.`
                : isLift ? "A little lower still — be gentle." : "Still rising — that happens. Be gentle."}
            </motion.p>
          )}

          <div className="mt-5 w-full max-w-md">
            <p className="text-sm font-medium text-muted-foreground">What’s still in the way?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {REMAIN_CHIPS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setRemaining(remaining === c.id ? null : c.id)}
                  className={
                    "no-tap rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 " +
                    (remaining === c.id
                      ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                      : "border-border bg-card text-foreground hover:border-primary/30")
                  }
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {usedIds.includes("grounding54321V2") && improved > 0 && v >= 4 && (
            <div className="mt-5 w-full max-w-md rounded-3xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Optional next route</p>
              <h2 className="mt-2 font-heading text-xl text-primary">Reroute</h2>
              <p className="mt-2 text-sm text-muted-foreground">You appear more oriented, but attention may still need somewhere safe and absorbing to go.</p>
              <button onClick={()=>{recordHandoffDecision("grounding54321V2","reroute","accepted");navigate("/reset",{replace:true,state:{prebuilt:true,pathway:["reroute"],direction:"ground",directionLabel:"Reroute",intensity:v,whereFelt:"both",timeMin:3,audio:answers.audio||"yes"}})}} className="mt-4 min-h-11 w-full rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Begin Reroute with my consent</button>
            </div>
          )}

          <div className="mt-6 w-full max-w-md flex flex-col items-center gap-2.5">
            <Button
              size="lg"
              onClick={continueCoaching}
              className="h-14 w-full rounded-full bg-primary text-base font-medium text-primary-foreground soft-depth active:scale-95"
            >
              {shiftsDir
                ? <>Try {dirLabel(implied.direction)} <ArrowRight className="ml-2 h-5 w-5" /></>
                : remMin > 1
                ? <>Keep going — {remMin} min left <ArrowRight className="ml-2 h-5 w-5" /></>
                : <>Add a little more <ArrowRight className="ml-2 h-5 w-5" /></>}
            </Button>

            <button
              type="button"
              onClick={wrapUp}
              className="no-tap w-full rounded-full border border-border bg-card py-3 text-base font-medium text-foreground transition-all hover:border-primary/30 active:scale-95"
            >
              I’m good — wrap up
            </button>

            <div className="mt-1 w-full">
              <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">Adjust my reset</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={repeatLast}
                  className="no-tap flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-95"
                >
                  <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} /> Repeat
                </button>
                <button
                  type="button"
                  onClick={() => addMore(8, 3)}
                  className="no-tap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-95"
                >
                  A lot more
                </button>
                <button
                  type="button"
                  onClick={() => setShowSwitch(true)}
                  className="no-tap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground active:scale-95"
                >
                  Switch direction
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showSwitch && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center"
              onClick={() => setShowSwitch(false)}
            >
              <motion.div
                initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-10 sm:rounded-3xl"
              >
                <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-muted sm:hidden" />
                <h3 className="font-heading text-2xl font-medium tracking-tight text-primary">Switch direction</h3>
                <p className="mt-1 text-muted-foreground">We’ll build a fresh pathway for the new direction.</p>
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {DIRECTIONS.filter((d) => d.id !== answers.direction).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => switchDirection(d.id)}
                      className="no-tap rounded-2xl border border-border bg-background/60 p-4 text-left transition-all hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                      <span className="block font-heading text-lg font-medium text-foreground">{d.label}</span>
                      <span className="block text-sm text-muted-foreground">{d.desc}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowSwitch(false)} className="no-tap mt-5 w-full rounded-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                  Stay with {dirLabel(answers.direction)}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---------- REFLECT ----------
  if (phase === "reflect") {
    const isLift = answers.direction === "lift";
    const improvement = answers.intensity != null && endIntensity != null
      ? (isLift ? endIntensity - answers.intensity : answers.intensity - endIntensity)
      : null;
    const helpedOptions = pathwayByIds(usedIds.length ? usedIds : pathway.map((p) => p.id));
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto flex min-h-full max-w-xl flex-col items-center px-5 pt-10 pb-28 sm:px-8">
          <div className="flex w-full justify-start">
            <FlowHomeButton />
          </div>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Before we wrap up</p>
            <h1 className="mt-3 font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
              One last reflection
            </h1>
          </motion.div>

          {improvement != null && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 font-heading text-2xl text-indigo italic text-center text-balance"
            >
              {improvement > 0
                ? isLift ? `Up ${improvement}. You lifted yourself — that’s real.` : `Down ${improvement}. You settled yourself — that’s real.`
                : improvement < 0
                ? isLift ? "A little lower still. Be gentle — you showed up." : "Still rising. Be gentle — you showed up."
                : "Holding steady. You showed up, and that matters."}
            </motion.p>
          )}

          <div className="mt-8 flex w-full max-w-md justify-center">
            <Button
              size="lg"
              onClick={completeSession}
              disabled={saving}
              data-sfx="none"
              className="h-16 w-full rounded-full bg-primary text-lg font-medium text-primary-foreground soft-depth active:scale-95"
            >
              Done <Check className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <p className="mt-8 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/70">Optional reflection</p>
          <div className="mt-4 w-full max-w-md">
            <p className="text-sm font-medium text-muted-foreground">Would you use this reset again?</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { v: "yes", label: "Yes" },
                { v: "maybe", label: "Maybe" },
                { v: "no", label: "No" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setWouldUseAgain(o.v)}
                  className={
                    "no-tap rounded-full border py-3 text-base font-medium transition-all active:scale-95 " +
                    (wouldUseAgain === o.v
                      ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                      : "border-border bg-card text-foreground hover:border-primary/30")
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {helpedOptions.length > 1 && (
            <div className="mt-8 w-full max-w-md">
              <p className="text-sm font-medium text-muted-foreground">
                What helped most? <span className="text-muted-foreground/60">(optional)</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {helpedOptions.map((iv) => (
                  <button
                    key={iv.id}
                    type="button"
                    onClick={() => setWhatHelped(whatHelped === iv.name ? "" : iv.name)}
                    className={
                      "no-tap rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 " +
                      (whatHelped === iv.name
                        ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                        : "border-border bg-card text-foreground hover:border-primary/30")
                    }
                  >
                    {iv.name}
                  </button>
                ))}
                {["Both", "Neither", "Not sure"].map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setWhatHelped(whatHelped === o ? "" : o)}
                    className={
                      "no-tap rounded-full border px-4 py-2 text-sm font-medium transition-all active:scale-95 " +
                      (whatHelped === o
                        ? "border-primary/0 bg-primary text-primary-foreground soft-depth"
                        : "border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground")
                    }
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex w-full max-w-md justify-center">
            <Button
              variant="outline"
              onClick={completeSession}
              disabled={saving}
              data-sfx="none"
              className="h-12 rounded-full border-primary/30 px-8 text-base font-medium text-primary hover:bg-primary/10 active:scale-95"
            >
              {saving ? "Saving…" : "Save reflection"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DONE ----------
  if (phase === "done") {
    const isLift = answers.direction === "lift";
    const imp = answers.intensity != null && endIntensity != null
      ? (isLift ? endIntensity - answers.intensity : answers.intensity - endIntensity)
      : null;
    const outcome = imp == null ? "neutral"
      : imp >= 3 ? "clear"
      : imp > 0 ? "small"
      : imp < 0 ? "worse"
      : "steady";
    const headline = outcome === "clear" ? "You came back to yourself."
      : outcome === "worse" ? "You showed up — that matters."
      : outcome === "small" ? "You moved the needle."
      : "You showed up.";
    const ack = outcome === "clear"
      ? (isLift ? `Up ${imp}. You lifted yourself — that’s real.` : `Down ${imp}. You settled yourself — that’s real.`)
      : outcome === "small"
      ? (isLift ? `Up ${imp} — a real shift.` : `Down ${imp} — a real shift.`)
      : outcome === "worse"
      ? "Different things work at different times. Be gentle with yourself."
      : "Holding steady. You showed up, and that matters.";
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-cream via-background to-background px-6 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <motion.span
            initial={{ scale: 0.7, opacity: 0.5 }}
            animate={{ scale: 1.7, opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeOut", delay: 0.35 }}
            className="absolute h-24 w-24 rounded-full border border-teal/30"
          />
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal/40 to-indigo/40 breath-glow"
          >
            <Check className="h-10 w-10 text-primary" strokeWidth={1.6} />
          </motion.div>
        </div>
        <div>
          <h1 className="font-heading text-3xl font-medium tracking-tight text-primary text-balance">
            {headline}
          </h1>
          {ack && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mx-auto mt-3 max-w-sm font-heading text-xl italic text-indigo text-balance"
            >
              {ack}
            </motion.p>
          )}
          <p className="mx-auto mt-4 max-w-sm text-lg text-muted-foreground text-balance">
            That’s the whole practice. Come back any time you need to.
          </p>
        </div>

        {weekCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground/80">
            <span className="h-1.5 w-1.5 rounded-full bg-teal/70" />
            {weekCount} reset{weekCount === 1 ? "" : "s"} this week
          </div>
        )}

        <div className="flex w-full max-w-sm flex-col gap-3">
          <Button size="lg" onClick={() => navigate("/", { replace: true })} className="h-14 rounded-full bg-primary px-8 text-base font-medium text-primary-foreground soft-depth active:scale-95">
            Back to start
          </Button>
          <button onClick={restartSame} className="no-tap rounded-full border border-border bg-card py-3 text-base font-medium text-foreground transition-all hover:border-primary/30 active:scale-95">
            Do it again
          </button>
        </div>
      </div>
    );
  }

  // ---------- UNSURE (determine direction) ----------
  if (phase === "unsure") {
    const q1 = {
      title: "Let’s find your direction",
      sub: "No idea needed — just pick what’s closest.",
      options: [
        { label: "Too high", sub: "Wound up, racing", branch: "high" },
        { label: "Too low", sub: "Flat, heavy", branch: "low" },
        { label: "Stuck", sub: "Neither — just stuck", branch: "stuck" },
      ],
    };
    const q2For = (branch) => {
      if (branch === "high") return {
        title: "Where is it loudest?",
        sub: "One more and we’ll begin.",
        options: [
          { label: "In my body", sub: "Tense, racing heart", dir: "calm", dirLabel: "Calm down" },
          { label: "In my thoughts", sub: "Can’t switch off", dir: "reset", dirLabel: "Get unstuck" },
          { label: "I want to sleep", sub: "Wired at bedtime", dir: "sleep", dirLabel: "Sleep" },
        ],
      };
      if (branch === "low") return {
        title: "What’s closer?",
        sub: "One more and we’ll begin.",
        options: [
          { label: "Low mood", sub: "Down, flat", dir: "lift", dirLabel: "Feel better" },
          { label: "Can’t get going", sub: "Stuck on a task", dir: "focus", dirLabel: "Focus" },
        ],
      };
      return {
        title: "Where’s the stuckness?",
        sub: "One more and we’ll begin.",
        options: [
          { label: "In my head", sub: "Looping thoughts", dir: "reset", dirLabel: "Get unstuck" },
          { label: "Disconnected", sub: "Spaced out, not here", dir: "ground", dirLabel: "Feel grounded" },
        ],
      };
    };
    const chooseUnsure = (o) => {
      if (o.branch) { setUnsureBranch(o.branch); advance({ phase: "unsure", unsureStep: 1 }); }
      else {
        setAnswers((a) => ({ ...a, direction: o.dir, directionLabel: o.dirLabel }));
        advance({ phase: "questions", qIndex: 0 });
      }
    };
    const q = unsureStep === 0 ? q1 : q2For(unsureBranch);
    return (
      <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
        <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={goBack}
              className="no-tap flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <FlowHomeButton />
          </div>
          <h1 className="mt-8 font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
            {q.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-balance">{q.sub}</p>
          <div className="mt-8 flex flex-col gap-3">
            {q.options.map((o) => (
              <button
                key={o.label}
                onClick={() => chooseUnsure(o)}
                className="no-tap flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <span>
                  <span className="block font-heading text-lg font-medium tracking-tight text-foreground">{o.label}</span>
                  <span className="block text-sm text-muted-foreground">{o.sub}</span>
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- QUESTIONS ----------
  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <div className="mx-auto flex min-h-full max-w-xl flex-col px-5 pt-10 pb-28 sm:px-8">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={prevQuestion}
            className="no-tap flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={
                    "h-1.5 w-6 rounded-full transition-colors " +
                    (i <= qIndex ? "bg-primary" : "bg-secondary")
                  }
                />
              ))}
            </div>
            <FlowHomeButton />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={qIndex}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            <h1 className="font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
              {currentQ.key === "intensity" && answers.direction === "lift" ? "How is your mood right now?" : currentQ.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground text-balance">
              {currentQ.key === "intensity" && answers.direction === "lift" ? "Low to high. An honest first read." : currentQ.sub}
            </p>

            <div className="mt-10 flex flex-1 flex-col items-center">
              {currentQ.render === "intensity" && (
                <IntensityDial value={answers.intensity ?? 5} onChange={(v) => setAnswer("intensity", v)} direction={answers.direction} />
              )}
              {currentQ.render === "where" && (
                <div className="w-full">
                  {answers.direction === "sleep" ? (
                    <ChoiceButtons
                      options={AWAKE_REASONS.map((r) => ({ value: r.whereFelt, label: r.label, awake: r.id }))}
                      value={answers.whereFelt}
                      onSelect={(v, opt) => { setAnswer("whereFelt", v); setAnswer("awake_reason", opt?.awake); }}
                    />
                  ) : (
                    <ChoiceButtons
                      options={WHERE_OPTIONS}
                      value={answers.whereFelt}
                      onSelect={(v) => setAnswer("whereFelt", v)}
                    />
                  )}
                </div>
              )}
              {currentQ.render === "time" && (
                <div className="w-full">
                  <ChoiceButtons
                    options={TIME_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                    value={answers.timeMin}
                    onSelect={(v) => setAnswer("timeMin", v)}
                    columns="grid-cols-2 sm:grid-cols-3"
                  />
                </div>
              )}
              {currentQ.render === "audio" && (
                <div className="w-full">
                  <ChoiceButtons options={AUDIO_OPTIONS} value={answers.audio} onSelect={(v) => setAnswer("audio", v)} />
                </div>
              )}
              {currentQ.render === "move" && (
                <div className="w-full">
                  <ChoiceButtons options={MOVE_OPTIONS} value={answers.movement} onSelect={(v) => setAnswer("movement", v)} />
                </div>
              )}
              {currentQ.render === "location" && (
                <div className="w-full">
                  <ChoiceButtons options={LOCATION_OPTIONS} value={answers.location} onSelect={(v) => setAnswer("location", v)} />
                </div>
              )}
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                size="lg"
                disabled={!canProceed()}
                onClick={nextQuestion}
                className="h-16 w-full max-w-sm rounded-full bg-primary text-lg font-medium text-primary-foreground soft-depth active:scale-95 disabled:opacity-40 disabled:shadow-none"
              >
                {qIndex < QUESTIONS.length - 1 ? "Continue" : "Build my reset"}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
