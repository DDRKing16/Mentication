// @ts-check
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, ArrowRight, RotateCcw } from "lucide-react";
import IntensityDial from "@/components/IntensityDial";
import ResetPlayer from "@/components/ResetPlayer";
import FlagshipExperience, { isInteractiveFlagship } from "@/components/FlagshipExperience";
import NewFlagshipExperience, { isNewFlagship } from "@/components/NewFlagshipExperiences";
import ThoughtOrFactExperience from "@/components/ThoughtOrFactExperience";
import ThoughtOrFactEntry from "@/components/thought-or-fact/ThoughtOrFactEntry";
import UrgeSurfExperience from "@/components/UrgeSurfExperience";
import { BuildingResetScreen, NoSafeMatchScreen, ResetOverview } from "@/components/reset-flow/ResetSetupScreens";
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
} from "@/lib/interventions";
import FlowHomeButton from "@/components/FlowHomeButton";
import { sessionStore } from "@/lib/localData";
import { useFreeQuota } from "@/hooks/useFreeQuota";
import { playComplete } from "@/lib/feedback";
import { recordHandoffDecision } from "@/lib/flagshipMemory";
import {
  createInitialResetAnswers,
  INTENSITY_QUESTION,
  REMAINING_STATE_BY_ID,
  REMAINING_STATE_OPTIONS,
  UNSURE_FIRST_STEP,
  unsureSecondStep,
} from "@/lib/resetFlowConfig";
import "@/styles/thought-or-fact.css";
import "@/styles/urge-surfing.css";
import "@/styles/happy-bump.css";

export default function ResetFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = location.state;
  const { allowed, isPremium, loading: quotaLoading } = useFreeQuota();

  const directEntryPathway = entry?.prebuilt ? pathwayByIds(entry.pathway) : [];
  const startsUrgeSurfing = directEntryPathway.length === 1 && directEntryPathway[0]?.id === "urgeSurf";
  const startsDirectFlagship = directEntryPathway.length === 1 && isInteractiveFlagship(directEntryPathway[0]?.id);
  const initialPhase = startsDirectFlagship ? "guiding" : (entry?.prebuilt ? "pathway" : (entry?.unsure ? "unsure" : (entry?.immediate ? "pathway" : "questions")));
  const [phase, setPhase] = useState(initialPhase); // unsure | questions | building | pathway | guiding | reflect | done
  const [building, setBuilding] = useState(!!entry?.immediate);
  // iOS back-gesture support: each forward setup step pushes a history entry so
  // swipe-back steps chronologically through the flow instead of exiting.
  const flowStack = useRef([{ phase: initialPhase, unsureStep: 0 }]);
  const buildingTimer = useRef(null);
  const stepParam = useMemo(() => parseInt(new URLSearchParams(location.search).get("step") || "0", 10) || 0, [location.search]);
  const [answers, setAnswers] = useState(() => createInitialResetAnswers(entry));

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
  const [activePathway, setActivePathway] = useState(startsDirectFlagship ? directEntryPathway : null);
  const [usedIds, setUsedIds] = useState(startsDirectFlagship ? directEntryPathway.map((item) => item.id) : []);
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
      unsureStep: snap.unsureStep ?? unsureStep,
    });
    setPhase(snap.phase);
    if (snap.unsureStep != null) setUnsureStep(snap.unsureStep);
    navigate(`/reset?step=${flowStack.current.length - 1}`, { state: entry });
  };
  const goBack = () => {
    if (flowStack.current.length > 1) navigate(-1);
    else navigate("/");
  };

  const nextQuestion = () => {
    if (!isPremium && !quotaLoading && allowed <= 0) return;
    setBuilding(true);
    buildingTimer.current = setTimeout(() => { setBuilding(false); advance({ phase: "pathway" }); }, 650);
  };
  const prevQuestion = () => goBack();

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
    const implied = remaining ? REMAINING_STATE_BY_ID[remaining] : null;
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
    const implied = remaining ? REMAINING_STATE_BY_ID[remaining] : null;
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
    flowStack.current = [{ phase: "pathway", unsureStep: 0 }];
    startTimeRef.current = Date.now();
    setPhase("pathway");
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
    return <BuildingResetScreen />;
  }

  // ---------- PATHWAY OVERVIEW ----------
  if (phase === "pathway") {
    if (!pathway.length) {
      return <NoSafeMatchScreen onAdjust={() => advance({ phase: "questions" })} />;
    }
    if (isThoughtOrFactEntry) {
      return (
        <ThoughtOrFactEntry
          answers={answers}
          ready={tofReady}
          thought={tofEntryThought}
          voiceSeconds={tofVoiceSeconds}
          voiceState={tofVoiceState}
          onBegin={beginGuided}
          onReady={() => setTofReady(true)}
          onReturnToWriting={returnToThoughtWriting}
          onStartVoice={startThoughtVoiceEntry}
          onStopVoice={stopThoughtVoiceEntry}
          onThoughtChange={setTofEntryThought}
        />
      );
    }

    return (
      <ResetOverview
        answers={answers}
        isPrebuilt={Boolean(entry?.prebuilt)}
        pathway={pathway}
        setAnswers={setAnswers}
        onBegin={beginGuided}
      />
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
    const implied = remaining ? REMAINING_STATE_BY_ID[remaining] : null;
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
              {REMAINING_STATE_OPTIONS.map((c) => (
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
              <h2 className="mt-2 font-heading text-xl text-primary">Vector Shift</h2>
              <p className="mt-2 text-sm text-muted-foreground">You appear more oriented; a short precision-grounding protocol can help consolidate that return.</p>
              <button onClick={()=>{recordHandoffDecision("grounding54321V2","vectorShift","accepted");navigate("/reset",{replace:true,state:{prebuilt:true,pathway:["vectorShift"],direction:"ground",directionLabel:"Vector Shift",intensity:v,whereFelt:"both",timeMin:5,audio:answers.audio||"yes"}})}} className="mt-4 min-h-11 w-full rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">Begin Vector Shift with my consent</button>
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
    const chooseUnsure = (option) => {
      if (option.branch) {
        setUnsureBranch(option.branch);
        advance({ phase: "unsure", unsureStep: 1 });
      }
      else {
        setAnswers((current) => ({
          ...current,
          direction: option.direction,
          directionLabel: option.directionLabel,
        }));
        advance({ phase: "questions" });
      }
    };
    const question = unsureStep === 0 ? UNSURE_FIRST_STEP : unsureSecondStep(unsureBranch);
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
            {question.title}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground text-balance">{question.description}</p>
          <div className="mt-8 flex flex-col gap-3">
            {question.options.map((option) => (
              <button
                key={option.label}
                onClick={() => chooseUnsure(option)}
                className="no-tap flex items-center justify-between rounded-2xl border border-border bg-card p-5 text-left transition-all hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.99]"
              >
                <span>
                  <span className="block font-heading text-lg font-medium tracking-tight text-foreground">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">{option.description}</span>
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
            <span className="h-1.5 w-6 rounded-full bg-primary" />
            <FlowHomeButton />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="intensity"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -18 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col"
          >
            <h1 className="font-heading text-3xl font-medium leading-tight tracking-tight text-primary text-balance sm:text-4xl">
              {answers.direction === "lift" ? "How is your mood right now?" : INTENSITY_QUESTION.title}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground text-balance">
              {answers.direction === "lift" ? "Low to high. An honest first read." : INTENSITY_QUESTION.description}
            </p>

            <div className="mt-10 flex flex-1 flex-col items-center">
              <IntensityDial value={answers.intensity ?? 5} onChange={(value) => setAnswer("intensity", value)} direction={answers.direction} />
            </div>

            <div className="mt-10 flex justify-center">
              <Button
                size="lg"
                disabled={answers.intensity === null}
                onClick={nextQuestion}
                className="h-16 w-full max-w-sm rounded-full bg-primary text-lg font-medium text-primary-foreground soft-depth active:scale-95 disabled:opacity-40 disabled:shadow-none"
              >
                Build my reset
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
