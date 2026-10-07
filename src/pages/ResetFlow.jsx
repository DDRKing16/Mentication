import {createSessionCompletion} from '@/lib/sessionCompletion';
import {confirmedJourneyTakeaway} from '@/lib/confirmedJourneyTakeaway';
import SessionSaveRecovery from '@/components/reset-flow/SessionSaveRecovery';
import SelectedPracticeContext from '@/components/reset-flow/SelectedPracticeContext';
import {appBackTarget} from '@/lib/appBack';
import JourneyTakeaway from '@/components/journey/JourneyTakeaway';
import { attemptEventDisposition, resetCompletionSnapshot, finalAssessmentEvent } from '@/lib/resetCompletion';
import { resetNavigationEntry, freshResetEntry, appendResetFlowSnapshot, resetFlowHistorySnapshot } from "@/lib/resetNavigation";
import { captureGoalBaseline, GOAL_ASSESSMENTS, goalPointChange, hasGoalBaseline, MATCHED_ASSESSMENT_IDS } from "@/lib/goalAssessment";
import { withAttemptHelpfulness } from "@/lib/attemptFeedback";
// @ts-check
import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Castle, ChevronLeft, ChevronRight, Check, ArrowRight } from "lucide-react";
import IntensityDial from "@/components/IntensityDial";
import WithBrandThreshold from "@/components/brand/WithBrandThreshold";
import { standaloneRouteFor } from "@/lib/standaloneInterventions";
import BrandClosing from "@/components/brand/BrandClosing";
import { isInteractiveFlagship, isNewFlagship } from "@/lib/flagshipExperienceRouting";
import { BuildingResetScreen, NoSafeMatchScreen, ResetOverview } from "@/components/reset-flow/ResetSetupScreens";

// Each intervention's own guided experience is a large, self-contained
// world (its own screens, motion and — for a couple of them — thousands of
// lines of markup). Only one ever runs per session, so they load on demand
// once the pathway is known, instead of every one of them riding along in
// this shared flow's bundle for every reset. Each one's own stylesheet
// (imported inside the component itself, not here) rides along with it.
const TaraTacticianExperience = lazy(() => import("@/components/tara-tactician/TaraTacticianExperience"));
const GentleTappingExperience = lazy(() => import("@/components/tapping/GentleTappingExperience"));
const SelfCompassionExperience = lazy(() => import("@/components/SelfCompassionExperience"));
const UnhookExperience = lazy(() => import("@/components/UnhookExperience"));
const MakeRoomExperience = lazy(() => import("@/components/MakeRoomExperience"));
const ResetPlayer = lazy(() => import("@/components/ResetPlayer"));
const FlagshipExperience = lazy(() => import("@/components/FlagshipExperience"));
const NewFlagshipExperience = lazy(() => import("@/components/NewFlagshipExperiences"));
const ThoughtOrFactEntry = lazy(() => import("@/components/thought-or-fact/ThoughtOrFactEntry"));
const ThoughtOrFactExperience = lazy(() => import("@/components/ThoughtOrFactExperience"));
const UrgeSurfExperience = lazy(() => import("@/components/UrgeSurfExperience"));
const NextEasiestStepExperience = lazy(() => import("@/components/NextEasiestStepExperience"));
const ChangeSceneExperience = lazy(() => import("@/components/ChangeSceneExperience"));
const VectorShiftFrame = lazy(() => import("@/components/VectorShiftFrame"));
const TomorrowParkingExperience = lazy(() => import("@/components/TomorrowParkingExperience"));
import {
  buildPathway,
  buildSegment,
  segmentMinutes,
  pathwayByIds,
  DIRECTIONS,
  computeEffectiveness,
  buildAttemptRecord,
  coarseContextKey,
  RECOMMENDATION_ENGINE_VERSION,
} from "@/lib/interventions";
import FlowHomeButton from "@/components/FlowHomeButton";
import { sessionStore } from "@/lib/localData";
import { useFreeQuota } from "@/hooks/useFreeQuota";
import { playComplete } from "@/lib/feedback";
import { clearActiveFlagship } from "@/lib/flagshipMemory";
import { pauseHomeAmbient, resumeHomeAmbient } from "@/lib/homeAmbient";
import { maybeRequestReview } from "@/lib/reviewPrompt";
import {
  createInitialResetAnswers,
  needsGuidedResetEntry,
  INTENSITY_QUESTION,
  REMAINING_STATE_BY_ID,
  REMAINING_STATE_OPTIONS,
  UNSURE_FIRST_STEP,
  unsureSecondStep,
} from "@/lib/resetFlowConfig";

export default function ResetFlow() {
  const navigate = useNavigate();
  const location = useLocation();
  const entry = useMemo(() => {
    const incoming=location.state;
    return incoming?.prebuilt && !pathwayByIds(incoming.pathway).length ? {...incoming,prebuilt:false,pathway:[],unsure:true,reset_phase:undefined} : incoming;
  },[location.state]);
  const { allowed, isPremium, loading: quotaLoading } = useFreeQuota();

  const directEntryPathway = entry?.prebuilt ? pathwayByIds(entry.pathway) : [];
  const usablePrebuiltEntry = Boolean(entry?.prebuilt && directEntryPathway.length);
  const needsAnsweredBaseline = directEntryPathway.some((item) => MATCHED_ASSESSMENT_IDS.has(item.id)) && !hasGoalBaseline(entry);
  const startsDirectFlagship = !needsAnsweredBaseline && directEntryPathway.length === 1 && isInteractiveFlagship(directEntryPathway[0]?.id);
  const restoredCompletion = entry?.reset_phase === "goalReassessment" ? resetCompletionSnapshot(entry.reset_completion, directEntryPathway[0]?.id) : null;
  const initialPhase = restoredCompletion ? "goalReassessment" : needsAnsweredBaseline ? "questions" : ["questions", "pathway", "guiding"].includes(entry?.reset_phase) ? entry.reset_phase : startsDirectFlagship ? "guiding" : (usablePrebuiltEntry ? "pathway" : (entry?.unsure || needsGuidedResetEntry({ ...entry, prebuilt: usablePrebuiltEntry }) ? "unsure" : (entry?.immediate ? "pathway" : "questions")));
  const [questionStep, setQuestionStep] = useState(() => ["goal", "distress", "time"].includes(entry?.reset_question) ? entry.reset_question : "goal");
  const [phase, setPhase] = useState(initialPhase); // unsure | questions | building | pathway | guiding | reflect | done
  const [building, setBuilding] = useState(!!entry?.immediate);
  // iOS back-gesture support: each forward setup step pushes a history entry so
  // swipe-back steps chronologically through the flow instead of exiting.
  const stepParam = useMemo(() => parseInt(new URLSearchParams(location.search).get("step") || "0", 10) || 0, [location.search]);
  const flowStack = useRef(Object.assign([], { [stepParam]: { phase: initialPhase, unsureStep: 0, questionStep: entry?.reset_question || "goal" } }));
  const restoredStepRef = useRef(stepParam);
  const buildingTimer = useRef(null);
  const [answers, setAnswers] = useState(() => createInitialResetAnswers(entry));

  useEffect(() => {
    if (phase !== "questions") return;
    const state = globalThis.history?.state;
    if (!state) return;
    try { globalThis.history.replaceState({...state,usr:resetNavigationEntry({...entry,reset_question:questionStep},answers,"questions",{id:sessionIdRef.current,startedAt:startTimeRef.current})},""); } catch { /* Practice remains usable if history is unavailable. */ }
  }, [answers, questionStep, phase]);
  useEffect(() => {
    if (phase !== "questions") return;
    const frame=requestAnimationFrame(()=>document.querySelector("main h1")?.focus({preventScroll:true}));
    return ()=>cancelAnimationFrame(frame);
  }, [phase,questionStep]);

  const [endIntensity, setEndIntensity] = useState(null);
  const [tofEntryThought, setTofEntryThought] = useState("");
  const [tofVoiceState, setTofVoiceState] = useState("idle");
  const [tofVoiceSeconds, setTofVoiceSeconds] = useState(0);
  const voiceStreamRef = useRef(null);
  const [whatHelped, setWhatHelped] = useState("");
  const [wouldUseAgain, setWouldUseAgain] = useState(null);
  const [unsureStep, setUnsureStep] = useState(0);
  const [unsureBranch, setUnsureBranch] = useState(null);
  const [saving, setSaving] = useState(false);
  const [completionSaveFailed, setCompletionSaveFailed] = useState(false);
  const completionTransactionRef = useRef(null);
  const savingHistoryRef = useRef(false);
  const completionMountedRef = useRef(true);
  useEffect(() => { completionMountedRef.current = true; return () => { completionMountedRef.current = false; }; }, []);
  useEffect(() => {
    if (completionTransactionRef.current && completionTransactionRef.current.phase !== phase) {
      completionTransactionRef.current = null;
      setCompletionSaveFailed(false);
      setSaving(false);
    }
  }, [phase]);
  // The Closing brand moment plays once between a session ending and the
  // screen that follows (the shared "done" screen, or navigating away).
  // { id, onDone } while it plays; null the rest of the time.
  const [closing, setClosing] = useState(null);
  // coaching loop state
  const [activePathway, setActivePathway] = useState(["guiding", "goalReassessment"].includes(initialPhase) ? directEntryPathway : null);
  const [usedIds, setUsedIds] = useState(["guiding", "goalReassessment"].includes(initialPhase) ? directEntryPathway.map((item) => item.id) : []);
  const [planRemaining, setPlanRemaining] = useState(0);
  const [lastValue, setLastValue] = useState(answers.intensity ?? 5);
  const [checkinValue, setCheckinValue] = useState(null);
  const [checkpointScreen,setCheckpointScreen] = useState("rating");
  const [reflectionScreen,setReflectionScreen] = useState("repeat");
  const [remaining, setRemaining] = useState(null);
  const [showSwitch, setShowSwitch] = useState(false);
  const startTimeRef = useRef(entry?.reset_started_at || Date.now());
  const sessionIdRef = useRef(entry?.reset_session_id || globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`);
  useEffect(() => {
    if (phase !== "guiding" || !usablePrebuiltEntry) return;
    const state = globalThis.history?.state;
    if (state?.usr?.reset_session_id === sessionIdRef.current) return;
    try { globalThis.history.replaceState({...state,usr:resetNavigationEntry(state?.usr || entry,answers,"guiding",{id:sessionIdRef.current,startedAt:startTimeRef.current})}, ""); } catch { /* Practice-specific persistence reports unavailable history. */ }
  }, [phase, usablePrebuiltEntry, entry, answers]);

  const [effectiveness, setEffectiveness] = useState({});
  const sessionHistoryRef = useRef([]);
  const attemptLogRef = useRef([]);
  const pendingCompletionRef = useRef(restoredCompletion ? { ...restoredCompletion.event, mechanism:directEntryPathway[0]?.mechanism } : null);
  const goalCompletionRef = useRef(restoredCompletion?.result || null);
  const [goalEndRating, setGoalEndRating] = useState(restoredCompletion?.goalRating ?? null);
  useEffect(() => {
    if (phase !== "goalReassessment" || !pendingCompletionRef.current) return;
    const state=globalThis.history?.state;
    if (!state) return;
    try { globalThis.history.replaceState({...state,usr:resetNavigationEntry({...entry,reset_completion:{event:pendingCompletionRef.current,result:goalCompletionRef.current,goalRating:goalEndRating}},answers,"goalReassessment",{id:sessionIdRef.current,startedAt:startTimeRef.current})},""); } catch { /* Current answer remains available in this screen. */ }
  }, [phase,goalEndRating]);
  const sessionSavedRef = useRef(false);
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

  // Home ambient continues through every setup / rating / pathway screen.
  // It stops only once the user has explicitly begun an intervention.
  useEffect(() => {
    if (phase === "guiding") pauseHomeAmbient();
    else resumeHomeAmbient();
  }, [phase]);

  // immediate mode skips questions — show a brief building animation, then the pathway
  useEffect(() => {
    if (entry?.immediate) {
      const t = setTimeout(() => setBuilding(false), 800);
      return () => clearTimeout(t);
    }
  }, [entry?.immediate]);

  // Restore both browser Back and Forward, including history after refresh.
  useEffect(() => {
    if (restoredStepRef.current === stepParam) return;
    restoredStepRef.current = stepParam;
    const snap = resetFlowHistorySnapshot(flowStack.current, stepParam, entry) || { phase:initialPhase, unsureStep:0 };
    if (snap) {
      if (buildingTimer.current) { clearTimeout(buildingTimer.current); buildingTimer.current = null; }
      setPhase(snap.phase);
      setUnsureStep(snap.unsureStep ?? 0);
      setQuestionStep(snap.questionStep || entry?.reset_question || "goal");
      setBuilding(false);
    }
  }, [stepParam]);
  useEffect(() => () => { if (buildingTimer.current) clearTimeout(buildingTimer.current); }, []);

  // Review prompt: fire once per completion, after the "done" screen (which
  // only renders once BrandClosing's animation has finished). Waits a
  // further 800-1200ms so it never competes with the completion animation
  // itself, per Apple's own guidance. The streak itself needs no extra
  // bookkeeping here — it's derived live from session history wherever it's
  // displayed (see src/lib/streak.js's computeLocalCalendarStreak).
  const completionHandledRef = useRef(false);
  useEffect(() => {
    if (phase !== "done") { completionHandledRef.current = false; return; }
    if (completionHandledRef.current) return;
    completionHandledRef.current = true;
    const delay = 800 + Math.round(Math.random() * 400);
    const t = setTimeout(() => {
      sessionStore.list("-created_date", 1000).then((sessions) => {
        maybeRequestReview(sessions.length);
      }).catch(() => {});
    }, delay);
    return () => clearTimeout(t);
  }, [phase]);

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

  // The mic permission is asked for once per session: the granted stream is
  // kept (muted between notes) and reused, so the browser never re-prompts
  // for every voice note. It is fully released only when the flow unmounts.
  const muteThoughtVoice = () => {
    voiceStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = false; });
  };

  const startThoughtVoiceEntry = async () => {
    setTofVoiceSeconds(0);
    if (!navigator.mediaDevices?.getUserMedia) {
      setTofVoiceState("idle");
      return;
    }
    try {
      if (!voiceStreamRef.current) {
        voiceStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      } else {
        voiceStreamRef.current.getAudioTracks().forEach((track) => { track.enabled = true; });
      }
      setTofVoiceState("listening");
    } catch {
      voiceStreamRef.current = null;
      setTofVoiceState("idle");
    }
  };

  const stopThoughtVoiceEntry = () => {
    muteThoughtVoice();
    setTofVoiceState("stopped");
  };

  const returnToThoughtWriting = () => {
    muteThoughtVoice();
    setTofVoiceSeconds(0);
    setTofVoiceState("idle");
  };

  // Preload the first Box Breathing V2 narration and its two background
  // images as soon as the intervention is selected, rather than at every app
  // launch, so it still starts instantly without paying that cost up front.
  // The local narration manifest this pulls in is sizeable, so it's fetched
  // on demand here too -- only a reset that actually opens with Box
  // Breathing pays for it, not every reset.
  useEffect(() => {
    const first = pathway[0];
    if (first?.id === "boxV2") {
      import("@/lib/preloadBoxV2")
        .then(({ warmNarration, warmBoxV2Images }) => {
          warmNarration(first, answers.direction);
          warmBoxV2Images();
        })
        .catch(() => {
          // Warming is a head start, not a requirement -- Box Breathing's
          // own screen still loads and plays narration itself if this
          // fetch fails (e.g. offline).
        });
    }
  }, [pathway, answers.direction]);


  const setAnswer = (key, value) => setAnswers((a) => ({ ...a, [key]: value, ...(key === "intensity" ? { goal_baseline:captureGoalBaseline(a.direction, value) } : {}) }));

  const advance = (snap, nextEntry = entry, nextAnswers = answers) => {
    flowStack.current = appendResetFlowSnapshot(flowStack.current, stepParam, {
      phase: snap.phase,
      unsureStep: snap.unsureStep ?? unsureStep,
      questionStep: snap.questionStep ?? questionStep,
    });
    setPhase(snap.phase);
    if (snap.unsureStep != null) setUnsureStep(snap.unsureStep);
    if (snap.questionStep != null) setQuestionStep(snap.questionStep);
    navigate(`/reset?step=${flowStack.current.length - 1}`, { state: resetNavigationEntry({ ...nextEntry, reset_question:snap.questionStep ?? questionStep }, nextAnswers, snap.phase, { id:sessionIdRef.current, startedAt:startTimeRef.current }) });
  };
  const goBack = () => {
    if (stepParam > 0) navigate(appBackTarget(window.history.state,"/"));
    else navigate("/");
  };

  const nextQuestion = () => {
    if (questionStep === "goal" && answers.direction === "lift") { advance({phase:"questions",questionStep:"distress"}); return; }
    if (questionStep !== "time" && !(usablePrebuiltEntry && pathway.length === 1)) { advance({phase:"questions",questionStep:"time"}); return; }
    if (!isPremium && !quotaLoading && allowed <= 0) return;
    if(entry?.prebuilt && pathway.length === 1 && pathway[0].id !== "factCheck") { beginGuided();return; }
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
    const disposition = attemptEventDisposition(event);
    if (disposition === "ignore") return;
    if (disposition === "pending") {
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
      exitReason: event.action,
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
      exitReason: event.exitReason || "completed",
      coarseContextKey: coarseContextKey(currentAttemptContext(lastValue)),
    });
    attemptLogRef.current = [...attemptLogRef.current, withAttemptHelpfulness(record, event.helpfulness)];
    pendingCompletionRef.current = null;
    return rebuildEffectivenessWithLiveAttempts(attemptLogRef.current);
  };

  const beginGuided = () => {
    completionTransactionRef.current = null;
    setCompletionSaveFailed(false);
    sessionSavedRef.current = false;
    setSaving(false);
    const first = pathway[0];
    if (!first) return;
    if (MATCHED_ASSESSMENT_IDS.has(first.id) && !hasGoalBaseline(answers)) { setPhase("questions"); return; }
    pauseHomeAmbient();
    attemptLogRef.current = [];
    pendingCompletionRef.current = null;
    setActivePathway([first]);
    setUsedIds([first.id]);
    setPlanRemaining(Math.max(0, (answers.timeMin || 5) - segmentMinutes([first])));
    setLastValue(answers.intensity ?? 5);
    // Every practice keeps its original explicit baseline across refresh.
    // Private exercise progress remains owned by the experience.
    advance({ phase: "guiding" }, { ...entry, prebuilt:true, pathway:[first.id] });
  };

  const startGoalReassessment = (result) => {
    const item = activePathway?.[0];
    pendingCompletionRef.current = finalAssessmentEvent(pendingCompletionRef.current, item, result);
    goalCompletionRef.current = result;
    setGoalEndRating(null);
    advance({ phase:"goalReassessment" }, { ...entry, prebuilt:true, pathway:activePathway.map(item => item.id), reset_completion:{ event:pendingCompletionRef.current, result } });
  };

  const onSegmentComplete = (result) => {
    if (result?.requireGoalReassessment) { startGoalReassessment(result); return; }
    setCheckinValue(null);
    setCheckpointScreen("rating");
    setRemaining(null);
    advance({ phase: "checkpoint" });
  };

  const startSegment = (opts, effectivenessOverride = effectiveness) => {
    const nextIntensity = checkinValue ?? lastValue ?? answers.intensity ?? 5;
    const resolvedDirection = opts.direction || answers.direction;
    const resolvedWhereFelt = opts.whereFelt || answers.whereFelt;
    if (resolvedDirection !== answers.direction && (resolvedDirection === "lift" || answers.direction === "lift")) {
      // Save the completed work under its original scale before asking for a
      // fresh rating in another goal. Never relabel mood as distress or erase
      // the attempts when Begin starts the newly checked-in reset.
      const fresh = createInitialResetAnswers({ ...answers, goal_baseline:null, direction: resolvedDirection, directionLabel: DIRECTIONS.find((item) => item.id === resolvedDirection)?.label, intensity: null, distress: null, whereFelt: resolvedWhereFelt, immediate: false });
      completeSession({ silent: true, endIntensityOverride: nextIntensity, onFinished: () => {
        setAnswers(fresh);
        setPhase("questions");
        setActivePathway(null);
        setUsedIds([]);
        setPlanRemaining(0);
        setEndIntensity(null);
        setSaving(false);
        setWhatHelped("");
        setWouldUseAgain(null);
        setCheckinValue(null);
        attemptLogRef.current = [];
        pendingCompletionRef.current = null;
        sessionSavedRef.current = false;
        sessionIdRef.current = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`;
        startTimeRef.current = Date.now();
        flowStack.current = [{ phase: "questions", unsureStep: 0 }];
        navigate("/reset", { replace: true, state: fresh });
      } });
      return;
    }
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
    advance({ phase: "guiding" }, { ...entry, prebuilt:true, pathway:seg.map(item => item.id) }, nextAnswers);
  };

  // Re-run the segment the user just finished — same practice, fresh start.
  const repeatLast = () => {
    if (!activePathway || !activePathway.length) return;
    // Repeating is a new attempt. Save the previous attempt without inventing
    // a rating, then collect a fresh baseline instead of reusing its old one.
    commitPendingPulse(checkinValue);
    completeSession({ silent:true, endIntensityOverride:checkinValue, onFinished:restartSame });
  };

  const continueCoaching = () => {
    const nextIntensity = checkinValue ?? lastValue;
    const nextEffectiveness = commitPendingPulse(checkinValue);
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

  const addMore = (mins) => {
    const nextIntensity = checkinValue ?? lastValue;
    const nextEffectiveness = commitPendingPulse(checkinValue);
    const implied = remaining ? REMAINING_STATE_BY_ID[remaining] : null;
    startSegment({ targetMin: mins, count: 1, whereFelt: implied?.whereFelt }, nextEffectiveness);
  };

  const switchDirection = (dir) => {
    const nextIntensity = checkinValue ?? lastValue;
    const nextEffectiveness = commitPendingPulse(checkinValue);
    setShowSwitch(false);
    startSegment({ targetMin: Math.min(6, Math.max(2, answers.timeMin || 5)), direction: dir }, nextEffectiveness);
    setPlanRemaining(0);
  };

  const wrapUp = () => {
    const finalValue = checkinValue;
    commitPendingPulse(finalValue);
    setEndIntensity(finalValue);
    advance({ phase: "reflect" });
  };

  const savePendingCompletion = async () => {
    const pending = completionTransactionRef.current;
    if (!pending || sessionSavedRef.current || savingHistoryRef.current) return;
    savingHistoryRef.current = true;
    setSaving(true);
    try {
      await pending.transaction.save();
      if (!completionMountedRef.current || pending !== completionTransactionRef.current) return;
      sessionSavedRef.current = true;
      setCompletionSaveFailed(false);
      if (!pending.silent && !answers.discreet && !answers.noAudio) playComplete();
      setClosing({id:pending.brandId,onDone:pending.finish});
    } catch {
      if (completionMountedRef.current && pending === completionTransactionRef.current) setCompletionSaveFailed(true);
    } finally {
      savingHistoryRef.current = false;
      if (completionMountedRef.current) setSaving(false);
    }
  };

  const completeSession = (options = {}) => {
    if (sessionSavedRef.current || savingHistoryRef.current) return;
    if (completionTransactionRef.current) { savePendingCompletion(); return; }
    const completedAt = options.completedAt ?? Date.now();
    const payload = {
      id: sessionIdRef.current,
      created_date: new Date(completedAt).toISOString(),
      state: answers.direction,
      state_label: answers.directionLabel,
      direction: answers.direction,
      direction_label: answers.directionLabel,
      intensity_start: answers.intensity,
      goal_baseline: answers.goal_baseline || null,
      intensity_end: Object.prototype.hasOwnProperty.call(options, "endIntensityOverride") ? options.endIntensityOverride : endIntensity,
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
      recommendation_engine_version: RECOMMENDATION_ENGINE_VERSION,
      what_helped: whatHelped.trim() || undefined,
      would_use_again: wouldUseAgain || undefined,
      duration_sec: Math.max(0,Math.round((completedAt - startTimeRef.current) / 1000)),
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
    // Either way, the Closing brand moment plays first so every session
    // resolves into the logo and swash the same way before it hands off.
    const finish = () => {
      if (options.onFinished) { options.onFinished(); return; }
      if (options.direct) navigate(options.navigateTo || "/", { replace: true, state: options.liftFollowup ? { completedSession: payload } : undefined });
      else advance({ phase: "done" });
    };
    completionTransactionRef.current = {
      transaction:createSessionCompletion(payload, value=>sessionStore.create(value)),
      silent:options.silent,
      brandId:usedIds[usedIds.length - 1] || pathway[0]?.id,
      phase,
      finish,
    };
    savePendingCompletion();
  };

  const finishClosing = () => {
    const finish = closing?.onDone;
    setClosing(null);
    finish?.();
  };

  if (completionSaveFailed) {
    const brandId = completionTransactionRef.current?.brandId;
    const practice = pathwayByIds([brandId])[0];
    return <SessionSaveRecovery practice={practice} saving={saving} onRetry={savePendingCompletion} onLeave={() => {
      completionTransactionRef.current = null;
      sessionSavedRef.current = true;
      navigate("/", {replace:true});
    }} />;
  }

  // A session that just ended shows only the Closing brand moment -- never
  // stacked on top of whatever screen was showing -- so nothing of the old
  // screen can show through as it fades. Once it finishes, `finishClosing`
  // hands off to the shared "done" screen or navigates away.
  if (closing) {
    return <BrandClosing id={closing.id} onDone={finishClosing} />;
  }

  // quietly re-run the just-completed pathway from the overview
  const restartSame = () => {
    completionTransactionRef.current = null;
    setCompletionSaveFailed(false);
    const fresh = freshResetEntry(entry, answers);
    setAnswers(createInitialResetAnswers(fresh));
    sessionIdRef.current = globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`;
    clearActiveFlagship();
    if (buildingTimer.current) clearTimeout(buildingTimer.current);
    flowStack.current = [{ phase: "questions", unsureStep: 0 }];
    startTimeRef.current = Date.now();
    setPhase("questions");
    setQuestionStep("goal");
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
    navigate(`/reset?step=0`, { state: fresh });
  };

  // ---------- BUILDING ----------
  if (building) {
    return <BuildingResetScreen />;
  }

  // ---------- PATHWAY OVERVIEW ----------
  if (phase === "pathway") {
    if (!pathway.length) {
      return <NoSafeMatchScreen onAdjust={() => { setAnswers((value) => ({ ...value, immediate: false })); advance({ phase: "questions" }); }} />;
    }
    if (isThoughtOrFactEntry) {
      return (
        <Suspense fallback={<BuildingResetScreen />}>
          <ThoughtOrFactEntry
            answers={answers}
            thought={tofEntryThought}
            voiceSeconds={tofVoiceSeconds}
            voiceState={tofVoiceState}
            onBegin={beginGuided}
            onReturnToWriting={returnToThoughtWriting}
            onStartVoice={startThoughtVoiceEntry}
            onStopVoice={stopThoughtVoiceEntry}
            onThoughtChange={setTofEntryThought}
          />
        </Suspense>
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

  // Opt-in contract for experiences with additional mechanism-specific feedback.
  // The matching goal rating is independent; skipping it never supplies a delta.
  if (phase === "goalReassessment") {
    const assessment = GOAL_ASSESSMENTS[answers.direction];
    const finishGoal = (rating) => {
      const result = goalCompletionRef.current || {};
      const event = pendingCompletionRef.current;
      const completedAt = restoredCompletion?.completedAt ?? Date.now();
      if (event) {
        const confirmedEntry = resetNavigationEntry({...entry,reset_completion:{event,result,goalRating:rating,completedAt}},answers,"goalReassessment",{id:sessionIdRef.current,startedAt:startTimeRef.current});
        navigate(`${location.pathname}${location.search}`,{replace:true,state:confirmedEntry});
      }
      setGoalEndRating(rating);
      commitPendingPulse(goalPointChange(answers.goal_baseline, answers.direction, rating) == null ? null : rating);
      completeSession({ direct:true, silent:true, completedAt, endIntensityOverride:rating, interventionOutcome:result.outcome, navigateTo:result.navigateTo });
    };
    return <main className={`${goalCompletionRef.current?.interventionId === "tomorrowParking" ? "tpl tpl--bedside tpl-goal" : "calmbg"} min-h-[100dvh] px-5 py-6`}><div className="mx-auto flex max-w-lg flex-col gap-6">
      <FlowHomeButton />
      <SelectedPracticeContext practice={pathwayByIds([goalCompletionRef.current?.interventionId || usedIds[usedIds.length - 1] || pathway[0]?.id])[0]} label="After your practice" showTime={false} compact />
      <h1 className="font-heading text-3xl text-primary">{assessment?.question || INTENSITY_QUESTION.title}</h1>
      <p className="text-muted-foreground">{hasGoalBaseline(answers) ? "The same goal question as at the start." : "An optional goal check-in, separate from the practice question. There is no starting goal rating to compare."} Confirm an honest rating, or skip. You do not need to feel better.</p>
      <IntensityDial value={goalEndRating} onChange={setGoalEndRating} direction={answers.direction} />
      <p className="text-muted-foreground">{goalEndRating == null ? 'Not answered yet.' : goalPointChange(answers.goal_baseline, answers.direction, goalEndRating) == null ? 'No confirmed starting rating to compare.' : `${answers.goal_baseline.value} → ${goalEndRating} · ${goalPointChange(answers.goal_baseline, answers.direction, goalEndRating)} points`}</p>
      <Button className="rounded-full" disabled={saving} onClick={() => finishGoal(goalEndRating ?? 5)}>Confirm rating: {goalEndRating ?? 5}</Button>
      <button type="button" className="min-h-11 underline" disabled={saving} onClick={() => finishGoal(null)}>Skip and finish</button>
      <JourneyTakeaway id={goalCompletionRef.current?.interventionId || usedIds[usedIds.length - 1] || pathway[0]?.id} initialText={confirmedJourneyTakeaway(goalCompletionRef.current?.interventionId || usedIds[usedIds.length - 1] || pathway[0]?.id,goalCompletionRef.current?.outcome)} />

    </div></main>;
  }

  // ---------- GUIDING ----------
  if (phase === "guiding" && activePathway) {
    // Signal Lock, Vector Shift and Night Channel are finished standalone builds;
    // never show the simplified in-code stand-ins.
    const standaloneRoute = activePathway.length === 1 ? standaloneRouteFor(activePathway[0]?.id) : null;
    if (standaloneRoute && activePathway[0]?.id !== "vectorShift") return <Navigate to={standaloneRoute} replace state={activePathway[0]?.id === "nightChannel" ? { goal_baseline: answers.goal_baseline, direction: answers.direction } : undefined} />;
    const interactive = activePathway.length === 1 && isInteractiveFlagship(activePathway[0]?.id);
    if (interactive) {
      const interventionId = activePathway[0]?.id;
      // Each branch is a separately lazy-loaded component with its own props
      // shape; the union those component types produce is narrower than any
      // one of them, so the props passed below are typed loosely here.
      const Experience = /** @type {any} */ (interventionId === "taraTactician" ? TaraTacticianExperience
        : interventionId === "eftTapping" ? GentleTappingExperience
        : interventionId === "selfCompassion" ? SelfCompassionExperience
        : interventionId === "unhook" ? UnhookExperience
        : interventionId === "makeRoom" ? MakeRoomExperience
        : interventionId === "vectorShift"
        ? VectorShiftFrame
        : interventionId === "factCheck"
        ? ThoughtOrFactExperience
        : interventionId === "urgeSurf"
          ? UrgeSurfExperience
        : interventionId === "nextAction"
          ? NextEasiestStepExperience
        : interventionId === "changeScene"
          ? ChangeSceneExperience
        : interventionId === "tomorrowParking"
          ? TomorrowParkingExperience
        : isNewFlagship(interventionId)
          ? NewFlagshipExperience
          : FlagshipExperience);
      return (
        <WithBrandThreshold key={interventionId} id={interventionId} name={activePathway[0]?.name}>
        <Suspense fallback={<BuildingResetScreen />}>
        <Experience
          intervention={activePathway[0]}
          sessionId={sessionIdRef.current}
          initialThought={interventionId === "factCheck" ? tofEntryThought : undefined}
          initialCertainty={interventionId === "factCheck" ? answers.intensity : undefined}
          answers={{ ...answers, intensity: lastValue }}
          onGoalBaseline={(baseline) => {
            if (!hasGoalBaseline({ direction:answers.direction, goal_baseline:baseline })) return;
            const next = { ...answers, intensity: baseline.value, goal_baseline: baseline };
            setAnswers(next);
            setLastValue(baseline.value);
            navigate(`${location.pathname}${location.search}`, { replace: true, state: resetNavigationEntry(entry, next, "guiding", { id: sessionIdRef.current, startedAt: startTimeRef.current }) });
          }}
          onAttemptEvent={handleAttemptEvent}
          onComplete={(result) => {
            if (result?.helpfulness && pendingCompletionRef.current) pendingCompletionRef.current = { ...pendingCompletionRef.current, helpfulness:result.helpfulness };
            if (result?.requireGoalReassessment) {
              startGoalReassessment(result);
              return;
            }
            commitPendingPulse(null);
            setEndIntensity(null);
            if (result?.skipReflection) {
              completeSession({
                direct: true,
                silent: true,
                endIntensityOverride: null,
                interventionOutcome: result.outcome,
                navigateTo: interventionId === "happyBump" && answers.direction === "lift" ? "/lift-followup" : result.navigateTo,
                liftFollowup: interventionId === "happyBump" && answers.direction === "lift",
              });
              return;
            }
            advance({ phase: "reflect" });
          }}
          onExit={() => navigate("/")}
        />
        </Suspense>
        </WithBrandThreshold>
      );
    }
    const single = activePathway.length === 1 ? activePathway[0] : null;
    return (
      <WithBrandThreshold key={single?.id || "pathway"} id={single?.id} name={single?.name}>
        <Suspense fallback={<BuildingResetScreen />}>
        <ResetPlayer
          sessionId={sessionIdRef.current}
          pathway={activePathway}
          answers={{ ...answers, intensity: lastValue }}
          effectiveness={effectiveness}
          onAttemptEvent={handleAttemptEvent}
          onComplete={onSegmentComplete}
          onExit={() => navigate("/")}
        />
        </Suspense>
      </WithBrandThreshold>
    );
  }

  // Shared follow-up answers are separate optional screens.
  if (phase === "checkpoint") {
    const assessment=GOAL_ASSESSMENTS[answers.direction];
    const rating=checkpointScreen==="rating";
    const obstacle=checkpointScreen==="obstacle";
    return <main className="calmbg min-h-[100dvh]"><div className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6">
      <div className="flex items-center justify-between">{!rating && <button type="button" className="min-h-11 underline" onClick={()=>setCheckpointScreen(obstacle?"next":"rating")}>Back</button>}<FlowHomeButton /></div>
      <h1 className="font-heading text-4xl leading-tight text-primary">{rating ? assessment?.question || "How intense is it right now?" : obstacle ? "What’s still in the way?" : "What would help you now?"}</h1>
      {rating ? <>
        <p className="text-muted-foreground">Optional. You can skip this check-in.</p>
        <IntensityDial value={checkinValue} onChange={setCheckinValue} direction={answers.direction} />
        <Button className="min-h-14 w-full rounded-full text-lg" onClick={()=>{setCheckinValue(checkinValue??5);setCheckpointScreen("next");}}>Confirm rating: {checkinValue??5}</Button>
        <button type="button" className="min-h-11 underline" onClick={()=>{setCheckinValue(null);setCheckpointScreen("next");}}>Skip check-in</button>
      </> : obstacle ? <>
        <p className="text-muted-foreground">Optional. Choose what feels closest.</p>
        <div className="grid gap-3">{REMAINING_STATE_OPTIONS.map(choice=><button key={choice.id} type="button" aria-pressed={remaining===choice.id} className={"min-h-12 rounded-2xl border p-4 text-left "+(remaining===choice.id?"bg-primary text-primary-foreground":"bg-card")} onClick={()=>setRemaining(choice.id)}>{choice.label}</button>)}</div>
        <Button className="min-h-14 w-full rounded-full text-lg" onClick={()=>setCheckpointScreen("next")}>Continue</Button>
      </> : <>
        <p className="text-muted-foreground">Continue, stop here, or change the next step.</p>
        <Button className="min-h-14 w-full rounded-full text-lg" onClick={continueCoaching}>Continue my reset <ArrowRight className="ml-2 h-5 w-5" /></Button>
        <button type="button" className="min-h-12 w-full underline" onClick={wrapUp}>Finish for now</button>
        <details className="rounded-2xl border p-4"><summary className="min-h-11 cursor-pointer">Other next steps</summary><div className="grid gap-2"><button type="button" className="min-h-11 text-left underline" onClick={repeatLast}>Repeat this practice</button><button type="button" className="min-h-11 text-left underline" onClick={()=>setCheckpointScreen("obstacle")}>Name what is still in the way</button><button type="button" className="min-h-11 text-left underline" onClick={()=>setShowSwitch(true)}>Choose another direction</button><button type="button" className="min-h-11 text-left underline" onClick={()=>addMore(8)}>Allow more time</button></div></details>
        {showSwitch && <section className="rounded-2xl border bg-card p-4"><h2 className="sr-only">Another direction</h2><div className="grid gap-2">{DIRECTIONS.filter(direction=>direction.id!==answers.direction).map(direction=><button key={direction.id} type="button" className="min-h-12 w-full rounded-2xl border p-4 text-left" onClick={()=>switchDirection(direction.id)}>{direction.label}</button>)}</div><button type="button" className="min-h-11 underline" onClick={()=>setShowSwitch(false)}>Keep this direction</button></section>}
      </>}
    </div></main>;
  }

  if (phase === "reflect") {
    const helped=pathwayByIds(usedIds.length?usedIds:pathway.map(item=>item.id));
    const repeat=reflectionScreen==="repeat";
    return <main className="calmbg min-h-[100dvh]"><div className="mx-auto flex max-w-lg flex-col gap-5 px-5 py-6">
      <div className="flex items-center justify-between">{!repeat&&<button type="button" className="min-h-11 underline" onClick={()=>setReflectionScreen("repeat")}>Back</button>}<FlowHomeButton /></div>
      <h1 className="font-heading text-4xl leading-tight text-primary">{repeat?"Would you use this reset again?":"What helped most?"}</h1>
      <p className="text-muted-foreground">Optional. You can finish without answering.</p>
      <div className="grid gap-3">{(repeat?[{id:"yes",label:"Yes"},{id:"maybe",label:"Maybe"},{id:"no",label:"No"}]:[...helped.map(item=>({id:item.name,label:item.name})),...['Neither','Not sure'].map(label=>({id:label,label}))]).map(option=><button type="button" key={option.id} aria-pressed={(repeat?wouldUseAgain:whatHelped)===option.id} className={"min-h-12 rounded-2xl border p-4 text-left "+((repeat?wouldUseAgain:whatHelped)===option.id?"bg-primary text-primary-foreground":"bg-card")} onClick={()=>repeat?setWouldUseAgain(option.id):setWhatHelped(option.id)}>{option.label}</button>)}</div>
      <Button disabled={saving} className="min-h-14 w-full rounded-full text-lg" onClick={completeSession}>{saving?"Saving…":"Done"}</Button>
      {repeat&&helped.length>1&&<button type="button" className="min-h-11 underline" onClick={()=>setReflectionScreen("helped")}>Add which practice helped · optional</button>}
    </div></main>;
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
      : outcome === "neutral" ? "No before-and-after comparison was recorded." : "Your rating stayed the same.";
    return (
      <div className="calmbg flex min-h-full flex-col items-center justify-center gap-6 px-6 text-center">
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
          {(attemptLogRef.current || []).some((a) => a?.exit_reason === "completed") && (
            <motion.button
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => navigate("/palace", { replace: true })}
              data-sfx="select"
              className="mx-auto mt-5 flex items-center gap-2 rounded-full border border-teal/30 bg-teal/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:border-teal/50"
            >
              <Castle className="h-4 w-4 text-teal" strokeWidth={1.8} />
              Visit your Peace Palace
            </motion.button>
          )}
        </div>

        <JourneyTakeaway id={usedIds[usedIds.length - 1] || pathway[0]?.id} />
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
      <div className="calmbg min-h-full">
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

  // Each independent setup answer has its own history entry. Ratings are
  // still explicit; selecting a display default never confirms a baseline.
  const lastSetupQuestion = questionStep === "time" || (usablePrebuiltEntry && pathway.length === 1 && (answers.direction !== "lift" || questionStep === "distress"));
  const setupTitle = questionStep === "distress" ? "How distressed are you right now?" : questionStep === "time" ? "How much time do you have?" : GOAL_ASSESSMENTS[answers.direction]?.question || INTENSITY_QUESTION.title;
  const setupDisabled = questionStep === "distress" ? answers.distress === null : questionStep === "goal" ? answers.intensity === null || !hasGoalBaseline(answers) : false;
  return <main className="calmbg min-h-[100dvh]"><div className="mx-auto flex max-w-lg flex-col px-5 py-6 sm:px-8">
    <div className="mb-8 flex items-center justify-between"><button type="button" onClick={prevQuestion} className="min-h-11 text-muted-foreground"><ChevronLeft className="inline h-4 w-4" /> Back</button><FlowHomeButton /></div>
    {usablePrebuiltEntry && pathway.length === 1 && <SelectedPracticeContext practice={pathway[0]} compact />}
    <h1 tabIndex={-1} className="font-heading text-4xl leading-tight text-primary outline-none">{setupTitle}</h1>
    <p className="mt-3 text-muted-foreground">{questionStep === "distress" ? "Separate from your mood. This helps choose a suitable practice." : questionStep === "time" ? "Choose the time available for your reset." : "Choose an honest first rating."}</p>
    {questionStep === "goal" && <div className="my-8"><IntensityDial value={answers.intensity} onChange={value => setAnswer("intensity",value)} direction={answers.direction} /></div>}
    {questionStep === "distress" && <label className="my-8 flex flex-col gap-3"><span className="sr-only">Current distress</span><select aria-label="Current distress" className="min-h-14 w-full rounded-xl border border-border bg-card px-3 text-lg" value={answers.distress ?? ""} onChange={event => setAnswer("distress",event.target.value === "" ? null : Number(event.target.value))}><option value="">Choose a rating</option>{Array.from({length:11},(_,value)=><option key={value} value={value}>{value}{value===0?" · No distress":value===10?" · Extreme distress":""}</option>)}</select></label>}
    {questionStep === "time" && <label className="my-8 flex flex-col gap-3"><span className="sr-only">Time available</span><select aria-label="Time available" className="min-h-14 w-full rounded-xl border border-border bg-card px-3 text-lg" value={answers.timeMin} onChange={event => setAnswer("timeMin",Number(event.target.value))}>{[...new Set([3,5,10,15,answers.timeMin])].sort((a,b)=>a-b).map(minutes=><option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>}
    <Button size="lg" disabled={setupDisabled} onClick={nextQuestion} className="min-h-14 w-full rounded-full text-lg">{lastSetupQuestion ? usablePrebuiltEntry && pathway.length===1 ? pathway[0].id==="factCheck" ? "Continue to your thought" : `Start ${pathway[0].name}` : "Build my reset" : "Continue"}<ChevronRight className="ml-2 h-5 w-5" /></Button>
  </div></main>;
}
