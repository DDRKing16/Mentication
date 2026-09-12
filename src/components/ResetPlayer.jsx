import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Play, Pause, Volume2, VolumeX, Type, Clock, EyeOff, Waves, Moon, Layers,
  Activity, Brain, Feather, Zap, Shuffle, ChevronRight,
} from "lucide-react";
import StageVisual, { stageModeFor } from "@/components/StageVisual";
import BoxBreathingV2Stage from "@/components/BoxBreathingV2Stage";
import GroundingV2Stage from "@/components/grounding54321/GroundingV2Stage";
import PMRV2Stage from "@/components/PMRV2Stage";
import {
  suggestSwitch, suggestAdaptiveAlternative, transitionSentence, SWITCH_MODES,
} from "@/lib/interventions";
import { spokenFor, voiceFor } from "@/lib/spoken";
import { useAmbientSound, AMBIENT_OPTIONS } from "@/hooks/useAmbientSound";
import { useGuideVoice } from "@/hooks/useGuideVoice";
import { useSoundscapeMixer } from "@/hooks/useSoundscapeMixer";
import { useSleepTimer } from "@/hooks/useSleepTimer";
import { useBoxBreathingSoundscape } from "@/hooks/useBoxBreathingSoundscape";
import { useGroundingSoundscape } from "@/hooks/useGroundingSoundscape";
import { usePMRSoundscape } from "@/hooks/usePMRSoundscape";
import SoundscapeMixer from "@/components/SoundscapeMixer";
import SleepTimerSheet from "@/components/SleepTimerSheet";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { suspendFeedback, resumeFeedback, haptic, setHapticsEnabled } from "@/lib/feedback";
import { recordDislike } from "@/lib/preferences";
import { interventionThemeStyle, paletteForIntervention } from "@/lib/mentationThemes";

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export default function ResetPlayer({ pathway, answers, effectiveness = {}, onComplete, onAttemptEvent, onExit }) {
  const [remaining, setRemaining] = useState(pathway);
  const [ivIndex, setIvIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [showTimer, setShowTimer] = useState(true);
  const a11y = useAccessibilityPrefs();
  const [captions, setCaptions] = useState(a11y.prefs.captions !== false);
  const discreet = !!answers?.discreet;
  const noBreathing = !!answers?.noBreathing;
  const noAudio = !!answers?.noAudio || discreet;
  const eyesOpen = !!answers?.eyesOpen;
  const isSleep = answers?.direction === "sleep";
  const [narrate, setNarrate] = useState(!noAudio && answers?.audio === "yes");
  // True once the narrator has finished the current step's line, so the step
  // doesn't auto-advance and cut the voice off mid-sentence. Reset per step.
  const [narrationEnded, setNarrationEnded] = useState(true);
  const [transition, setTransition] = useState(null);
  const [showSwitch, setShowSwitch] = useState(false);
  const { current: ambient, set: setAmbient } = useAmbientSound();
  const [showAmbient, setShowAmbient] = useState(false);
  const mixer = useSoundscapeMixer();
  const sleepTimer = useSleepTimer();
  const [showSounds, setShowSounds] = useState(false);
  const [showSleepTimer, setShowSleepTimer] = useState(false);
  const [stepsDone, setStepsDone] = useState(0);
  const transitionTimer = useRef(null);

  const iv = remaining[ivIndex];
  const step = iv?.steps[stepIndex];
  const stageMode = iv ? stageModeFor(iv) : "ring";
  // Box Breathing V2 renders its own single-clock pacer and drives step
  // completion itself — fully isolated from the shared stage/breath components.
  const isBoxV2Paced = step?.boxV2 === true;
  const isBoxV2 = iv?.id === "boxV2";
  const isGroundingV2 = iv?.id === "grounding54321V2";
  const isPMRV2 = iv?.id === "progressive-muscle-relaxation-v2";
  const interventionPalette = useMemo(
    () => paletteForIntervention(iv, answers?.direction),
    [iv, answers?.direction]
  );
  const lightChrome = interventionPalette.mode === "light";
  // Box Breathing V2 uses its own uploaded MP3 soundscape (with narration
  // ducking) instead of the procedural ambient.
  const narrationActive = narrate && !narrationEnded;
  // The Box Breathing V2 soundscape plays for the whole intervention — through
  // the paced 4·4·4·4 cycle AND the following "Rest" step — so it simply
  // continues from the end of the breathing sequence rather than fading out.
  useBoxBreathingSoundscape({ active: isBoxV2, narrationActive });
  // 5-4-3-2-1 Grounding V2 plays its own uploaded MP3 soundscape (with the same
  // volume + narration ducking as Box Breathing) throughout the whole exercise.
  useGroundingSoundscape({ active: isGroundingV2, narrationActive, sense: step?.sense });
  usePMRSoundscape({
    active: isPMRV2 && !noAudio && !discreet,
    running,
    narrationActive,
    phase: step?.phase,
    stepIndex,
  });
  const isLastStep = step != null && stepIndex === iv.steps.length - 1;
  const isLastIv = ivIndex === remaining.length - 1;

  // ---- narration (natural guide voice) ----
  const { speak, stop: stopVoice, pause: pauseVoice, resume: resumeVoice, preload } = useGuideVoice();
  const vf = useMemo(() => voiceFor(answers?.direction), [answers?.direction]);

  // warm the cache so the first lines start without a gap
  useEffect(() => {
    if (!narrate) return;
    const first = remaining[0];
    // Grounding V2 stages fetch with_alignment themselves; skip the non-aligned
    // warm so it doesn't force a slow aligned regeneration on first play.
    if (first?.id === "grounding54321V2" || first?.id === "progressive-muscle-relaxation-v2") return;
    const s0 = first?.steps?.[0];
    const s1 = first?.steps?.[1] || remaining[1]?.steps?.[0];
    [s0, s1].forEach((s) => {
      if (!s) return;
      const sp = spokenFor(s, first, answers?.direction);
      if (sp) preload(sp, { voice: vf.voice });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!narrate) { stopVoice(); setNarrationEnded(true); return; }
    if (transition) { speak(transition.sentence, { ...vf, leadMs: 400 }); return; }
    if (step) {
      const spoken = spokenFor(step, iv, answers?.direction);
      const isFirst = ivIndex === 0 && stepIndex === 0;
      // No spoken text → nothing to wait for; gating is skipped.
      setNarrationEnded(!spoken);
      // Box Breathing V2 instruction step: the instruction frame owns its own
      // aligned narration (word-synced reveal via useBoxV2WordReveal), so the
      // shared narrator is skipped for this one step. The frame calls
      // onNarrationEnd -> setNarrationEnded(true) when the words finish.
      // Grounding V2 owns its own aligned narration (word-synced reveal via
      // useWordReveal inside the stage), so the shared narrator is skipped for
      // it — exactly as the Box Breathing V2 instruction step is skipped. The
      // stage calls onNarrationEnd -> setNarrationEnded(true) when done.
      if (!(isBoxV2 && !isBoxV2Paced) && !isGroundingV2 && !isPMRV2) {
        speak(spoken, {
          ...vf,
          leadMs: isFirst ? vf.leadMs : 250,
          onEnd: spoken ? () => setNarrationEnded(true) : undefined,
        });
      }
      // Preload every spoken line of the current and next intervention so each
      // step's audio is ready the instant it advances — no generation gap.
      // Grounding V2 is skipped: its stages fetch with_alignment themselves, so
      // a non-aligned preload here would force a slow aligned regeneration.
      [remaining[ivIndex], remaining[ivIndex + 1]].forEach((intv) => {
        if (!intv || intv.id === "grounding54321V2" || intv.id === "progressive-muscle-relaxation-v2") return;
        intv.steps.forEach((s) => {
          const sp = spokenFor(s, intv, answers?.direction);
          if (sp) preload(sp, { voice: vf.voice });
        });
      });
    }
    return () => stopVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ivIndex, stepIndex, narrate, transition]);

  useEffect(() => () => stopVoice(), []);

  // Autoplay can block the first narration line in strict / iframe contexts.
  // A one-time tap anywhere in the player resumes the narrator if it was muted
  // by an autoplay block, so sound is never permanently lost.
  useEffect(() => {
    const unlock = () => { if (narrate) resumeVoice(); };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-start the ambient soundscape under the narration when enabled
  // (default on). Skipped for discreet / no-audio sessions and for sleep
  // (sleep has its own soundscape mixer). The in-session Waves control can
  // still change or mute it.
  useEffect(() => {
    if (!a11y?.prefs?.ambientSoundscape) return;
    if (noAudio || discreet || isSleep) return;
    // Box Breathing V2 plays its own uploaded MP3 soundscape rather than the
    // procedural ambient — keep the ambient silent for it.
    if (remaining[0]?.id === "boxV2" || remaining[0]?.id === "grounding54321V2" || remaining[0]?.id === "progressive-muscle-relaxation-v2") return;
    setAmbient(a11y.prefs.ambientType || "wind");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mute the procedural ambient (rain/wind) for the whole Box Breathing
  // intervention so it is not layered over the MP3, and restore it for other
  // interventions.
  useEffect(() => {
    if (isBoxV2 || isGroundingV2 || isPMRV2) {
      setAmbient("off");
    } else if (!isSleep && a11y?.prefs?.ambientSoundscape && !noAudio && !discreet) {
      setAmbient(a11y.prefs.ambientType || "wind");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBoxV2, isGroundingV2, isPMRV2]);

  // ---- media session: lock screen & background controls ----
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.mediaSession) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: iv?.name || "Reset",
        artist: "Mentication",
        album: "Guided reset",
      });
      navigator.mediaSession.setActionHandler("play", () => { setRunning(true); resumeVoice(); });
      navigator.mediaSession.setActionHandler("pause", () => { setRunning(false); pauseVoice(); });
    } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iv?.name]);

  useEffect(() => () => {
    sleepTimer.cancel();
    mixer.stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // keep UI feedback silent during discreet / no-audio sessions
  useEffect(() => {
    if (noAudio || discreet) suspendFeedback();
    else resumeFeedback();
    setHapticsEnabled(!a11y.prefs.reducedMotion);
    return () => resumeFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noAudio, discreet]);

  // ---- step timer ----
  useEffect(() => {
    if (!running || transition || !step) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running, transition, ivIndex, stepIndex]);

  const goNextStep = useCallback(() => {
    if (!step) return;
    if (!discreet) haptic(10);
    if (!isLastStep) {
      setStepsDone((s) => s + 1);
      setStepIndex((i) => i + 1);
      setElapsed(0);
    } else if (!isLastIv) {
      setStepsDone((s) => s + 1);
      
      // Emit completion event for current intervention as it transitions
      if (onAttemptEvent && iv?.id) {
        onAttemptEvent({
          interventionId: iv.id,
          mechanism: iv?.mechanism,
          action: "completed",
          timestamp: Date.now(),
        });
      }
      
      const nextIv = remaining[ivIndex + 1];
      setTransition({ to: nextIv, sentence: transitionSentence(nextIv) });
      stopVoice();
      transitionTimer.current = setTimeout(() => {
        setTransition(null);
        setIvIndex((i) => i + 1);
        setStepIndex(0);
        setElapsed(0);
      }, 4200);
    } else {
      setStepsDone((s) => s + 1);
      
      // Emit completion event for final intervention
      if (onAttemptEvent && iv?.id) {
        onAttemptEvent({
          interventionId: iv.id,
          mechanism: iv?.mechanism,
          action: "completed",
          timestamp: Date.now(),
        });
      }
      
      stopVoice();
      onComplete();
    }
  }, [step, isLastStep, isLastIv, ivIndex, remaining, onComplete, iv, onAttemptEvent]);

  // auto-advance when step time elapses — but wait for the narrator to finish
  // the current line when narration is on, so the voice never gets cut off.
  // A safety cap (holdSec + 45s) prevents a step hanging if audio fails to load.
  useEffect(() => {
    if (!running || transition || !step) return;
    // Box Breathing V2's paced step is driven entirely by its own master clock;
    // only a generous safety cap prevents a hang if the pacer ever fails to fire.
    if (isBoxV2Paced) {
      // Allow generous headroom before this safety cap ever cuts in — the
      // breathing timing itself (4 × 16 s) is unchanged.
      if (elapsed >= step.holdSec + 45) goNextStep();
      return;
    }
    const spoken = narrate ? spokenFor(step, iv, answers?.direction) : "";
    const waitForVoice = !!spoken && !narrationEnded;
    const safetyCap = spoken ? step.holdSec + 45 : step.holdSec;
    if (elapsed >= safetyCap) { goNextStep(); return; }
    if (elapsed >= step.holdSec && !waitForVoice) goNextStep();
  }, [elapsed, running, transition, step, goNextStep, narrate, narrationEnded, answers?.direction, isBoxV2Paced]);

  // ---- controls ----
  const togglePause = () => {
    setRunning((r) => {
      const next = !r;
      if (next) resumeVoice(); else pauseVoice();
      return next;
    });
  };
  const toggleNarrate = () => {
    setNarrate((n) => {
      const next = !n;
      if (!next) stopVoice();
      return next;
    });
  };
  const handleSleepEnd = useCallback(() => {
    // fade soundscape and narration out gently, then finish the segment
    mixer.setMasterTarget(0, 18);
    stopVoice();
    setRunning(false);
    setTimeout(() => {
      mixer.stopAll();
      onComplete();
    }, 19000);
  }, [mixer, stopVoice, onComplete]);

  const handleExit = () => {
    stopVoice();
    sleepTimer.cancel();
    mixer.stopAll();
    onExit();
  };

  // ---- PMR V2: move directly to the next muscle group ----
  // Individual muscle phases skip the matching release phase and land on the
  // next region. Intro and whole-body closing phases advance one stage at a
  // time so this control remains available throughout the full experience.
  const nextPMRStageIndex = useMemo(() => {
    if (!isPMRV2 || !step || !Array.isArray(iv?.steps)) return -1;

    const currentRegion = step.region;

    if (stepIndex >= iv.steps.length - 1) return iv.steps.length;

    if (!currentRegion || currentRegion === "whole") {
      return stepIndex + 1;
    }

    for (let i = stepIndex + 1; i < iv.steps.length; i += 1) {
      const candidate = iv.steps[i];

      if (candidate?.region && candidate.region !== currentRegion) {
        return i;
      }
    }

    return iv.steps.length;
  }, [isPMRV2, step, stepIndex, iv?.steps]);

  const nextPMRBodyPart = useCallback(() => {
    if (nextPMRStageIndex < 0) return;

    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
    }

    // Stop the current narration before changing stages so clips cannot overlap.
    stopVoice();

    setTransition(null);

    if (nextPMRStageIndex >= iv.steps.length) {
      setNarrationEnded(true);
      goNextStep();
      return;
    }

    // Count skipped PMR stages as completed for overall progress.
    setStepsDone((done) =>
      done + Math.max(1, nextPMRStageIndex - stepIndex)
    );

    setStepIndex(nextPMRStageIndex);
    setElapsed(0);
    setNarrationEnded(false);
    setRunning(true);
  }, [
    nextPMRStageIndex,
    stepIndex,
    stopVoice,
    iv?.steps?.length,
    goNextStep,
  ]);

  // ---- "this isn't helping" switch ----
  const doSwitch = (mode) => {
    // Record a negative vote for the practice being abandoned, so repeated
    // "this isn't helping" taps progressively demote it and its mechanism.
    recordDislike(iv?.id, iv?.mechanism);
    
    stopVoice();
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    
    // Use adaptive alternative selection: prefers interventions with proven
    // effectiveness in this context if available, falls back to standard suggest
    const newIv = suggestAdaptiveAlternative(iv.id, mode, answers, effectiveness)
      || suggestSwitch(iv.id, mode, answers, effectiveness);

    // Emit the rejection after the replacement has been selected so the parent
    // can keep the adaptive session state in sync with the practice now running.
    if (onAttemptEvent && iv?.id) {
      onAttemptEvent({
        interventionId: iv.id,
        mechanism: iv?.mechanism,
        action: "switched",
        switchReason: mode,
        replacementId: newIv?.id || null,
        replacementMechanism: newIv?.mechanism || null,
        timestamp: Date.now(),
      });
    }

    // V3 never bypasses hard eligibility to force a replacement. If there is
    // no safe/eligible alternative for the current settings, leave the player
    // unchanged and let the user adjust the session instead.
    if (!newIv) {
      setTransition(null);
      setShowSwitch(false);
      setRunning(true);
      return;
    }

    // V3 pathways are adaptive one intervention at a time. Do not append a
    // preselected closer here; the next practice is re-ranked after the pulse.
    setRemaining([newIv]);
    setIvIndex(0);
    setStepIndex(0);
    setElapsed(0);
    setTransition(null);
    setShowSwitch(false);
    setRunning(true);
  };

  // ---- skip to the next activity ----
  const skipToNext = () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setStepsDone((s) => s + 1);
    stopVoice();
    
    // Emit attempt event for the intervention being skipped
    if (onAttemptEvent && iv?.id && !isLastIv) {
      onAttemptEvent({
        interventionId: iv.id,
        mechanism: iv?.mechanism,
        action: "skipped",
        timestamp: Date.now(),
      });
    }
    
    setTransition(null);
    if (!isLastIv) {
      setIvIndex((i) => i + 1);
      setStepIndex(0);
      setElapsed(0);
    } else {
      // Last intervention is being "skipped" (completed without explicit feedback)
      if (onAttemptEvent && iv?.id) {
        onAttemptEvent({
          interventionId: iv.id,
          mechanism: iv?.mechanism,
          action: "skipped",
          timestamp: Date.now(),
        });
      }
      onComplete();
    }
  };

  // ---- overall progress (subtle) ----
  const totalLeft = useMemo(() => {
    let n = (iv?.steps.length - stepIndex) || 0;
    for (let i = ivIndex + 1; i < remaining.length; i++) n += remaining[i].steps.length;
    return Math.max(n, 1);
  }, [remaining, ivIndex, stepIndex, iv]);
  const progress = stepsDone / (stepsDone + totalLeft);

  const stepRemaining = step ? Math.max(step.holdSec - elapsed, 0) : 0;
  const groundingSense = isGroundingV2 ? step?.sense : undefined;
  const groundingAmbientVars = useMemo(() => {
    const intro = {
      "--grounding-v2-wash-opacity": 1,
      "--grounding-v2-veil-opacity": 0,
      "--grounding-v2-diffuse": "0px",
      "--grounding-v2-color": 1,
      "--grounding-v2-bright": 1,
    };

    if (!isGroundingV2) return intro;

    switch (groundingSense) {
      case "sight":
        return {
          "--grounding-v2-wash-opacity": 0.68,
          "--grounding-v2-veil-opacity": 0.24,
          "--grounding-v2-diffuse": "13px",
          "--grounding-v2-color": 0.93,
          "--grounding-v2-bright": 0.985,
        };
      case "touch":
        return {
          "--grounding-v2-wash-opacity": 0.76,
          "--grounding-v2-veil-opacity": 0.18,
          "--grounding-v2-diffuse": "10px",
          "--grounding-v2-color": 0.95,
          "--grounding-v2-bright": 0.99,
        };
      case "hearing":
        return {
          "--grounding-v2-wash-opacity": 0.84,
          "--grounding-v2-veil-opacity": 0.12,
          "--grounding-v2-diffuse": "7px",
          "--grounding-v2-color": 0.97,
          "--grounding-v2-bright": 0.995,
        };
      case "smell":
        return {
          "--grounding-v2-wash-opacity": 0.92,
          "--grounding-v2-veil-opacity": 0.06,
          "--grounding-v2-diffuse": "4px",
          "--grounding-v2-color": 0.985,
          "--grounding-v2-bright": 0.998,
        };
      case "taste":
      default:
        return intro;
    }
  }, [isGroundingV2, groundingSense]);

  return (
    <div
      className="intervention-theme fixed inset-0 z-50 flex flex-col overflow-hidden"
      data-intervention-theme={interventionPalette.id}
      data-theme-mode={interventionPalette.mode}
      style={interventionThemeStyle(interventionPalette)}
    >
      {/* immersive ambient backdrop */}
      <div className="pointer-events-none absolute inset-0" style={{ display: isGroundingV2 ? "none" : "block" }}>
        <div className="intervention-theme-backdrop absolute inset-0" />
        <motion.div
          className="absolute left-1/2 top-1/2 h-[140vmin] w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle at center, rgb(var(--intervention-accent-rgb) / 0.18) 0%, rgb(var(--intervention-accent-rgb) / 0.05) 30%, transparent 60%)" }}
          animate={{ opacity: running ? [0.7, 1, 0.7] : 0.5, scale: [1, 1.04, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="intervention-player-vignette absolute inset-0" />
      </div>
      {/* 5-4-3-2-1 Grounding V2: stage-driven ambient progression only on the background layer. */}
      {isGroundingV2 && <div className="grounding-v2-ambient pointer-events-none absolute inset-0" style={groundingAmbientVars} />}
      {isPMRV2 && <div className="pmr-v2-player-ambient pointer-events-none absolute inset-0" />}
      {/* Box Breathing V2: true-black canvas so the crystal disappears into it */}
      {isBoxV2 && <div className="pointer-events-none absolute inset-0 bg-[var(--intervention-bg)]" />}

      {/* subtle, non-pressuring progress hairline */}
      <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-white/[0.06]">
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-[var(--intervention-accent)] to-transparent"
          animate={{ width: `${Math.min(progress * 100, 100)}%` }}
          transition={{ ease: "easeInOut", duration: 1.2 }}
        />
      </div>

      {/* top bar */}
      <div className="relative flex items-center justify-between px-6 safe-top-lg">
        {!lightChrome ? (
          <div className="intervention-copy-muted flex items-center gap-2.5 text-[0.7rem] font-medium uppercase tracking-[0.22em]">
            <span className="intervention-accent-bg h-1.5 w-1.5 rounded-full animate-soft-pulse" />
            {/* PMR V2 owns a single restrained heading rendered in its own stage, so the generic name label is skipped here to avoid a duplicate. */}
            {isPMRV2 ? null : iv?.name ? <span>{iv.name}</span> : "Reset in progress"}
          </div>
        ) : (
          <span />
        )}
        <button
          onClick={handleExit}
          aria-label="Exit"
          className={"no-tap flex h-11 w-11 items-center justify-center rounded-full transition-all " + (lightChrome ? "text-[#1A2E26]/55 hover:bg-[#1A2E26]/5 hover:text-[#1A2E26]" : "text-cream/55 hover:bg-white/10 hover:text-cream")}
        >
          <X className="h-5 w-5" strokeWidth={1.6} />
        </button>
      </div>

      {/* stage */}
      <div className={`relative flex flex-1 flex-col items-center justify-center ${isPMRV2 ? "px-4 sm:px-6" : "px-6"}`}>
        <AnimatePresence mode="wait">
          {transition ? (
            <motion.div
              key="transition"
              initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -18, filter: "blur(6px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-w-md cursor-pointer flex-col items-center text-center"
              onClick={() => {
                if (transitionTimer.current) clearTimeout(transitionTimer.current);
                setTransition(null);
                setIvIndex((i) => i + 1);
                setStepIndex(0);
                setElapsed(0);
              }}
            >
              <span className="intervention-copy-muted text-[0.7rem] font-medium uppercase tracking-[0.24em]">Coming up next</span>
              <h2 className="intervention-copy-primary mt-5 font-heading text-[2.5rem] font-medium leading-[1.05] tracking-[-0.02em] text-balance sm:text-5xl">
                {transition.to.name}
              </h2>
              <p className="intervention-copy-muted mt-5 max-w-sm text-lg leading-relaxed text-balance">{transition.sentence}</p>
              <p className="intervention-copy-muted mt-3 text-base leading-relaxed text-balance">{transition.to.why}</p>
              <span className="intervention-copy-muted mt-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                <span className="intervention-accent-bg h-1 w-1 rounded-full" /> tap to continue
              </span>
            </motion.div>
          ) : step ? (
            <motion.div
              key={
                isGroundingV2
                  ? `grounding-${ivIndex}`
                  : isPMRV2
                    ? `pmr-${ivIndex}`
                    : `${ivIndex}-${stepIndex}`
              }
              initial={isPMRV2 ? false : { opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex w-full max-w-md flex-col items-center gap-6 pb-2"
            >
              {isBoxV2 ? (
                <BoxBreathingV2Stage
                  step={step}
                  running={running}
                  discreet={discreet}
                  paced={isBoxV2Paced}
                  showBody={captions}
                  isOpening={ivIndex === 0 && stepIndex === 0}
                  isClosing={isLastIv && stepIndex === iv.steps.length - 1}
                  narrate={narrate}
                  rate={vf.rate}
                  leadMs={ivIndex === 0 && stepIndex === 0 ? vf.leadMs : 250}
                  onNarrationEnd={() => setNarrationEnded(true)}
                  onComplete={isBoxV2Paced ? goNextStep : undefined}
                />
              ) : isGroundingV2 ? (
                <GroundingV2Stage
                  step={step}
                  running={running}
                  showTimer={showTimer}
                  stepRemaining={stepRemaining}
                  discreet={discreet}
                  showBody={captions}
                  narrate={narrate}
                  rate={vf.rate}
                  leadMs={ivIndex === 0 && stepIndex === 0 ? vf.leadMs : 250}
                  spoken={spokenFor(step, iv, answers?.direction)}
                  onNarrationEnd={() => { setElapsed(0); setNarrationEnded(true); }}
                />
              ) : isPMRV2 ? (
                <PMRV2Stage
                  step={step}
                  steps={iv.steps}
                  stepIndex={stepIndex}
                  elapsed={elapsed}
                  running={running}
                  showBody={captions}
                  narrate={narrate}
                  rate={vf.rate}
                  leadMs={ivIndex === 0 && stepIndex === 0 ? vf.leadMs : 250}
                  spoken={spokenFor(step, iv, answers?.direction)}
                  onNarrationEnd={() => setNarrationEnded(true)}
                  onNextBodyPart={nextPMRStageIndex >= 0 ? nextPMRBodyPart : undefined}
                  nextBodyPartLabel={
                    step?.phase === "intro"
                      ? "Start with hands"
                      : step?.phase === "return"
                        ? "Finish"
                        : "Next body part"
                  }
                />
              ) : (
                <StageVisual
                  mode={stageMode}
                  iv={iv}
                  step={step}
                  stepIndex={stepIndex}
                  running={running}
                  showTimer={showTimer}
                  stepRemaining={stepRemaining}
                  discreet={discreet}
                  noBreathing={noBreathing}
                />
              )}

              {captions && !(isBoxV2 && !isBoxV2Paced) && !isGroundingV2 && !isPMRV2 && (
                <p className={"intervention-copy-muted max-w-md text-center text-[1.05rem] leading-[1.7] text-balance " + (isBoxV2 ? "-mt-5" : "")}>
                  {step.body}
                </p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="resting"
              initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-w-md flex-col items-center text-center"
            >
              <span className="intervention-copy-muted text-[0.7rem] font-medium uppercase tracking-[0.24em]">A moment to rest</span>
              <h2 className="intervention-copy-primary mt-5 font-heading text-[2rem] font-medium tracking-[-0.018em] text-balance sm:text-[2.5rem]">Let’s settle here</h2>
              <p className="intervention-copy-muted mt-5 text-lg leading-relaxed text-balance">Take a slow breath. When you’re ready, we’ll finish gently.</p>
              <button
                onClick={onComplete}
                className="no-tap mt-9 rounded-full bg-white/10 px-10 py-3.5 text-base font-medium text-cream transition-all hover:bg-white/15 hover:-translate-y-0.5 active:scale-95"
              >
                Finish gently
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* adaptive actions — calm, integrated chips */}
      <div className={`flex items-center justify-center px-6 pb-1 pt-3 ${isPMRV2 ? "pmr-v2-actions-wrap" : ""}`}>
        <div className={"flex items-center gap-1 rounded-full p-1 backdrop-blur-md " + (isPMRV2 ? "pmr-v2-actions " : "") + (lightChrome ? "border border-[#1A2E26]/10 bg-white/40" : "border border-white/[0.08] bg-white/[0.03]")}>
          <button
            onClick={() => setShowSwitch(true)}
            className={"no-tap flex h-12 items-center rounded-full px-5 text-sm font-medium transition-all " + (lightChrome ? "text-[#1A2E26]/65 hover:bg-[#1A2E26]/5 hover:text-[#1A2E26]" : "text-cream/65 hover:bg-white/10 hover:text-cream")}
          >
            This isn’t helping
          </button>
          <span className={"h-5 w-px " + (lightChrome ? "bg-[#1A2E26]/10" : "bg-white/10")} />
          <button
            onClick={skipToNext}
            className={"no-tap flex h-12 items-center rounded-full px-5 text-sm font-medium transition-all " + (lightChrome ? "text-[#1A2E26]/65 hover:bg-[#1A2E26]/5 hover:text-[#1A2E26]" : "text-cream/65 hover:bg-white/10 hover:text-cream")}
          >
            {isPMRV2 ? "Next intervention" : "Next"}
          </button>
        </div>
      </div>

      {/* control dock */}
      <div className={`safe-bottom relative flex items-center justify-center gap-2 px-6 pb-10 pt-3 ${isPMRV2 ? "pmr-v2-control-wrap" : ""}`}>
        <div className={"flex items-center gap-0.5 rounded-full p-1.5 backdrop-blur-xl " + (isPMRV2 ? "pmr-v2-control-dock " : "") + (lightChrome ? "border border-[#1A2E26]/10 bg-white/40 shadow-[0_8px_30px_-12px_rgba(26,46,38,0.18)]" : "border border-white/[0.08] bg-white/[0.04] shadow-[0_8px_30px_-12px_hsl(178_60%_4%/0.7)]")}>
          <CtrlButton light={lightChrome} active={running} onClick={togglePause} label={running ? "Pause" : "Play"}>
            {running ? <Pause className="h-5 w-5" strokeWidth={1.7} /> : <Play className="h-5 w-5" strokeWidth={1.7} />}
          </CtrlButton>
          <CtrlButton light={lightChrome} active={narrate} onClick={toggleNarrate} label={narrate ? "Audio on" : "Audio off"}>
            {narrate ? <Volume2 className="h-5 w-5" strokeWidth={1.7} /> : <VolumeX className="h-5 w-5" strokeWidth={1.7} />}
          </CtrlButton>
          <CtrlButton light={lightChrome} active={captions} onClick={() => setCaptions((c) => !c)} label={captions ? "Captions on" : "Captions off"}>
            <Type className="h-5 w-5" strokeWidth={1.7} />
          </CtrlButton>
          <CtrlButton light={lightChrome} active={showTimer} onClick={() => setShowTimer((s) => !s)} label={showTimer ? "Timer on" : "Timer off"}>
            {showTimer ? <Clock className="h-5 w-5" strokeWidth={1.7} /> : <EyeOff className="h-5 w-5" strokeWidth={1.7} />}
          </CtrlButton>
          {!isSleep && (
            <CtrlButton light={lightChrome} active={ambient !== "off"} onClick={() => setShowAmbient((s) => !s)} label="Ambient sound">
              <Waves className="h-5 w-5" strokeWidth={1.7} />
            </CtrlButton>
          )}
          {isSleep && (
            <CtrlButton light={lightChrome}
              active={Object.values(mixer.volumes).some((v) => v > 0)}
              onClick={() => { setShowSounds((s) => !s); setShowAmbient(false); }}
              label="Soundscapes"
            >
              <Layers className="h-5 w-5" strokeWidth={1.7} />
            </CtrlButton>
          )}
          {isSleep && (
            <CtrlButton light={lightChrome}
              active={sleepTimer.active}
              onClick={() => setShowSleepTimer((s) => !s)}
              label="Sleep timer"
            >
              <Moon className="h-5 w-5" strokeWidth={1.7} />
            </CtrlButton>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAmbient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-32 left-1/2 z-50 -translate-x-1/2 rounded-3xl border border-white/10 bg-[hsl(178_36%_13%)]/95 p-2 shadow-[0_20px_60px_-20px_hsl(178_60%_4%/0.8)] backdrop-blur-xl"
          >
            <div className="flex flex-col gap-1">
              {AMBIENT_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => { setAmbient(o.id); if (o.id !== "off") setShowAmbient(false); }}
                  className={
                    "no-tap flex items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm transition-colors " +
                    (ambient === o.id ? "bg-white/15 text-cream" : "text-cream/70 hover:bg-white/10")
                  }
                >
                  <span className={"h-2 w-2 rounded-full " + (ambient === o.id ? "bg-teal" : "bg-cream/30")} />
                  {o.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSounds && isSleep && (
          <SoundscapeMixer mixer={mixer} onClose={() => setShowSounds(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSleepTimer && isSleep && (
          <SleepTimerSheet
            active={sleepTimer.active}
            secondsLeft={sleepTimer.secondsLeft}
            onPick={(min) => { sleepTimer.start(min * 60, () => handleSleepEnd()); setShowSleepTimer(false); }}
            onCancel={() => sleepTimer.cancel()}
            onClose={() => setShowSleepTimer(false)}
          />
        )}
      </AnimatePresence>

      {/* switch sheet */}
      <AnimatePresence>
        {showSwitch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm sm:items-center sm:justify-center"
            onClick={() => setShowSwitch(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-gradient-to-b from-[hsl(178_34%_16%)] to-[hsl(178_40%_9%)] p-6 pb-10 sm:rounded-3xl"
            >
              <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-cream/20 sm:hidden" />
              <h3 className="font-heading text-2xl font-medium tracking-tight text-cream">Let’s try something else</h3>
              <p className="mt-1 text-cream/55">Pick a direction — we’ll switch right away.</p>
              <div className="mt-5 flex flex-col gap-2.5">
                {SWITCH_MODES.map((m) => {
                  const Icon = { Activity, Brain, Feather, Zap, Shuffle }[m.icon];
                  return (
                    <button
                      key={m.value}
                      onClick={() => doSwitch(m.value)}
                      className="no-tap flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.04] p-4 text-left transition-all duration-300 hover:border-teal/40 hover:bg-white/[0.08] active:scale-[0.98]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-teal">
                        <Icon className="h-5 w-5" strokeWidth={1.7} />
                      </span>
                      <span className="flex-1">
                        <span className="block font-heading text-lg font-medium text-cream">{m.label}</span>
                        <span className="block text-sm text-cream/50">{m.hint}</span>
                      </span>
                      <ChevronRight className="h-5 w-5 text-cream/40" />
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setShowSwitch(false)}
                className="no-tap mt-5 w-full rounded-full py-3 text-sm font-medium text-cream/55 transition-colors hover:text-cream"
              >
                Stay with this one
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CtrlButton({ children, onClick, active, label, light = false }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        "no-tap flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 " +
        (light
          ? active
            ? "bg-[#1A2E26]/10 text-[#1A2E26] shadow-[0_0_14px_rgba(156,196,168,0.35)]"
            : "text-[#1A2E26]/45 hover:bg-[#1A2E26]/5 hover:text-[#1A2E26]/80"
          : active
            ? "bg-white/[0.12] text-cream shadow-[0_0_18px_hsl(178_55%_45%/0.18)]"
            : "text-cream/40 hover:bg-white/5 hover:text-cream/80")
      }
    >
      {children}
    </button>
  );
}
