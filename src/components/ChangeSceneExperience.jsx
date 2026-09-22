import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useGuideVoice } from "@/hooks/useGuideVoice";
import { getActiveFlagship, saveActiveFlagship, clearActiveFlagship, rememberFlagshipEvent } from "@/lib/flagshipMemory";
import { hapticPattern, playDopamineClick, playConquestInstrumental, playSelect, playShiftCountdown, playBirdChirp, playDawnBirdCall, playTreeWind } from "@/lib/feedback";
import InterventionControlShell from "@/components/InterventionControlShell";
import { CHANGE_SCENE_NARRATION } from "@/lib/changeSceneNarration";
import { voiceFor } from "@/lib/spoken";
import { getNarration } from "@/lib/narrationService";

const ID = "changeScene";

const STEPS = [
  {
    accent: "#c46c4d",
    accentRgb: "196, 108, 77",
    title: "Change the Scene",
    eyebrow: "",
    prompt: "Click the play button below to shift the moment with a small step.",
    psychoeducation: "Changing your physical scene interrupts stuck neural loop cycles instantly.",
    badge: "✦",
    progress: [true, false, false, false, false, false, false, false, false],
    cta: "TAP to SHIFT",
    meta: "about 4 minutes • one small shift at a time",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <defs>
          <filter id="nebula-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="nebula-grad-1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#a2f9b8" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#a2f9b8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#581825" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula-grad-2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#ef4444" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#581825" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="45" cy="50" r="38" fill="url(#nebula-grad-1)" filter="url(#nebula-glow)" />
        <circle cx="85" cy="58" r="42" fill="url(#nebula-grad-2)" filter="url(#nebula-glow)" />
        <circle cx="66" cy="35" r="28" fill="url(#nebula-grad-1)" filter="url(#nebula-glow)" />
        <path d="M25 45 L50 35 L75 55 L105 40 L85 75 L55 70 Z" stroke="rgba(162, 249, 184, 0.4)" strokeWidth="1.2" strokeDasharray="3 3" />
        <path d="M50 35 L55 70 M75 55 L55 70" stroke="rgba(162, 249, 184, 0.25)" strokeWidth="0.8" />
        <circle cx="25" cy="45" r="3.5" fill="#a2f9b8" filter="url(#nebula-glow)" />
        <circle cx="50" cy="35" r="2.5" fill="#ffffff" />
        <circle cx="75" cy="55" r="4" fill="#a2f9b8" filter="url(#nebula-glow)" />
        <circle cx="105" cy="40" r="3" fill="#ef4444" filter="url(#nebula-glow)" />
        <circle cx="85" cy="75" r="2" fill="#ffffff" />
        <circle cx="55" cy="70" r="3.5" fill="#a2f9b8" filter="url(#nebula-glow)" />
        <ellipse cx="66" cy="54" rx="55" ry="32" stroke="rgba(162, 249, 184, 0.15)" strokeWidth="1" transform="rotate(-15 66 54)" />
        <circle cx="20" cy="65" r="1.5" fill="#a2f9b8" />
        <circle cx="112" cy="43" r="2" fill="#ef4444" />
      </svg>
    )
  },
  {
    accent: "#5f8a70",
    accentRgb: "95, 138, 112",
    title: "Move, just a little",
    eyebrow: "Now",
    prompt: "Move to a different spot in the room.",
    psychoeducation: "Even a 2-foot shift tricks your brain into scanning for new possibilities.",
    badge: "1",
    progress: [false, true, false, false, false, false, false, false, false],
    cta: "Moved",
    meta: "1 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="13" y="29" width="44" height="44" rx="13" fill="#fff" stroke="rgba(20,33,30,.12)" strokeWidth="2"/>
        <rect x="77" y="22" width="47" height="47" rx="15" fill="rgba(95,138,112,.08)" stroke="rgba(95,138,112,.20)" strokeWidth="2"/>
        <path d="M37 51h12" stroke="rgba(20,33,30,.16)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M89 42h18" stroke="rgba(20,33,30,.14)" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="65" cy="53" r="2" fill="#5f8a70"/>
        <circle cx="71" cy="53" r="2" fill="rgba(20,33,30,.14)"/>
      </svg>
    )
  },
  {
    accent: "#4f89a5",
    accentRgb: "79, 137, 165",
    title: "Get Some Water",
    eyebrow: "Now",
    prompt: "Grab a glass of water. Take a few slow sips.",
    psychoeducation: "Sipping cool water activates the vagal nerve, resetting physiological threat levels.",
    badge: "2",
    progress: [false, false, true, false, false, false, false, false, false],
    cta: "Got it",
    meta: "2 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <path d="M46 24h40l-4 60c-1 8-31 8-32 0l-4-60Z" fill="#fff" stroke="#25312e" strokeWidth="1.6"/>
        <path d="M50 59h32l-2 24c-1 5-27 5-28 0l-2-24Z" fill="#4ea8de" style={{ filter: "drop-shadow(0 0 10px #4ea8de)" }} />
        <ellipse cx="66" cy="59" rx="16" ry="3" fill="rgba(255,255,255,.55)"/>
        <circle cx="60" cy="64" r="1.4" fill="white" opacity=".7"/>
        <circle cx="72" cy="74" r="1" fill="white" opacity=".4"/>
        <circle cx="62" cy="78" r="1.2" fill="white" opacity=".6"/>
      </svg>
    )
  },
  {
    accent: "#7767a1",
    accentRgb: "119, 103, 161",
    title: "Step outside",
    eyebrow: "Now",
    prompt: "Take 30 seconds outside. Bring your phone.",
    psychoeducation: "Natural light and open horizons reset your amygdala's focus threshold.",
    badge: "3",
    progress: [false, false, false, true, false, false, false, false, false],
    cta: "I'm outside",
    meta: "3 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="24" y="24" width="38" height="60" rx="2" fill="#fffdf8" stroke="rgba(20,33,30,.12)"/>
        <rect x="37" y="35" width="25" height="49" fill="#fff" stroke="rgba(20,33,30,.12)"/>
        <circle cx="95" cy="44" r="8" stroke="rgba(119,103,161,.3)"/>
        <circle cx="95" cy="44" r="3" fill="rgba(119,103,161,.22)"/>
        <path d="M95 31v-7M95 64v-7M82 44h-7M115 44h-7M86 35l-5-5M109 58l-5-5M104 35l5-5M81 58l5-5" stroke="rgba(119,103,161,.28)" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    accent: "#c46c58",
    accentRgb: "196, 108, 88",
    title: "Send one text",
    eyebrow: "Now",
    prompt: "Send a small text.",
    psychoeducation: "A tiny micro-connection signals safety to your nervous system.",
    badge: "4",
    progress: [false, false, false, false, true, false, false, false, false],
    cta: "I'll send one",
    meta: "4 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="18" y="31" width="78" height="48" rx="16" fill="#fff" stroke="rgba(20,33,30,.08)"/>
        <rect x="25" y="37" width="64" height="20" rx="6" fill="#e2f0fe" />
        <text x="57" y="49" textAnchor="middle" fontSize="5" fill="#1e3a8a" fontFamily="system-ui" fontWeight="bold">Have a beautiful day! ✦</text>
        <circle cx="98" cy="34" r="7" fill="rgba(196,108,88,.18)"/>
        <path d="M96 34h4M98 32v4" stroke="#c46c58" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    accent: "#7f916b",
    accentRgb: "127, 145, 107",
    title: "Find a quiet corner",
    titleStyle: { fontSize: "44px" },
    eyebrow: "Now",
    prompt: "Choose somewhere different. Get comfortable and let your body soften.",
    psychoeducation: "Allowing physical soft spots to hold your weight cues the body to let go of defense.",
    badge: "5",
    progress: [false, false, false, false, false, true, false, false, false],
    cta: "I'm settled",
    meta: "5 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <rect x="23" y="20" width="81" height="67" rx="2" fill="#fffdf8" stroke="rgba(20,33,30,.08)"/>
        <ellipse cx="59" cy="67" rx="25" ry="11" fill="rgba(127,145,107,.12)"/>
        <rect x="91" y="52" width="4" height="28" rx="2" fill="rgba(20,33,30,.16)"/>
        <circle cx="93" cy="44" r="8" fill="#f4decf"/>
        <path d="M35 36c7-5 13-5 19 0-6 7-13 7-19 0Z" fill="rgba(127,145,107,.28)"/>
      </svg>
    )
  },
  {
    accent: "#936fba",
    accentRgb: "147, 111, 186",
    title: "Plan one thing",
    eyebrow: "Now",
    prompt: "Plan one thing, anything you'd like to do.",
    psychoeducation: "Anticipating a positive event releases dopamine, elevating current resilience.",
    badge: "6",
    progress: [false, false, false, false, false, false, true, false, false],
    cta: "Planned",
    meta: "6 of 6 • keep going",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="cal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="#f3f4f6" />
          </linearGradient>
        </defs>
        <rect x="25" y="16" width="82" height="76" rx="14" fill="url(#cal-grad)" stroke="rgba(20,33,30,.12)" strokeWidth="1.5" />
        <rect x="25" y="16" width="82" height="20" rx="14" fill="#936fba" />
        <rect x="38" y="10" width="4" height="12" rx="2" fill="#374151" />
        <rect x="64" y="10" width="4" height="12" rx="2" fill="#374151" />
        <rect x="90" y="10" width="4" height="12" rx="2" fill="#374151" />
        <circle cx="42" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="58" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="74" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="90" cy="50" r="4" fill="#e5e7eb" />
        <circle cx="42" cy="68" r="4" fill="#e5e7eb" />
        <circle cx="58" cy="68" r="4" fill="#e5e7eb" />
        <circle cx="74" cy="68" r="7" fill="#936fba" style={{ filter: "drop-shadow(0 0 6px #936fba)" }} />
        <path d="M72 68l1.5 1.5 3-3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    accent: "#2c6a5e",
    accentRgb: "44, 106, 94",
    title: "Scene changed.",
    eyebrow: "Complete",
    prompt: "Notice any difference in how you feel. Feel free to rest, or keep moving if you want a greater shift.",
    psychoeducation: "You just proved to your nervous system that you have the power to shift your state.",
    badge: "✓",
    progress: [false, false, false, false, false, false, false, true, false],
    cta: "NEXT PATHWAY",
    meta: "scene changed • keep the shift",
    art: (
      <svg viewBox="0 0 132 108" fill="none" className="w-full h-full overflow-visible">
        <circle cx="66" cy="54" r="33" fill="rgba(255,255,255,.72)" stroke="rgba(44,106,94,.10)"/>
        <circle cx="66" cy="54" r="18" fill="rgba(44,106,94,.07)"/>
        <circle cx="66" cy="54" r="8" fill="#14211e"/>
        <path d="M63 54l2 2 4-5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <g fill="rgba(44,106,94,.55)">
          <circle cx="29" cy="28" r="1.5"/>
          <circle cx="106" cy="24" r="1.5"/>
          <circle cx="102" cy="81" r="1.5"/>
          <circle cx="35" cy="78" r="1.5"/>
        </g>
        <g fill="#e7b45c">
          <circle cx="21" cy="40" r="1.4"/>
          <circle cx="115" cy="46" r="1.4"/>
        </g>
      </svg>
    )
  },
  {
    accent: "#a2f9b8",
    accentRgb: "162, 249, 184",
    title: "You changed\nthe scene.",
    eyebrow: "Next Step",
    prompt: "A small shift creates enough lift for the rest of your day.",
    psychoeducation: "Action is the fastest bridge to psychological and physical restoration.",
    badge: "✦",
    progress: [false, false, false, false, false, false, false, false, true],
    cta: "I AM SHIFTED ✓",
    meta: "you can always come back for a quick shift",
    art: null
  }
];

const SUGGESTIONS = {
  1: ["Walk to window", "Stand up & stretch", "Step into kitchen", "Go into hallway", "Sit on other chair", "Roll my shoulders", "Pace for ten steps"],
  2: ["Ice-cold water", "Warm herbal tea", "Zesty lemon water", "Crisp sparkling water", "One deep gulp", "Three slow sips", "Freshly filtered glass"],
  3: ["Look at clouds", "Feel the breeze", "Close eyes in sun", "Listen to birds", "One big fresh breath", "Touch a green leaf", "Stand on the grass"],
  4: ["Just checking in!", "Thinking of you!", "Hope you're well!", "Hey, thank you!", "Have a great day!", "Sending positive vibes!", "Let's catch up soon!"],
  5: ["Dim the room lights", "Plump a soft cushion", "Wrap in a blanket", "Slide into slippers", "Silence all screens", "Light a warm candle", "Sit cross-legged"],
  6: ["Delicious dinner", "Fun exercise class", "Cozy movie night", "Hobby project time", "Coffee with friend", "Nature walk slot", "Quiet reading hour"],
  7: ["Rest quietly", "Make a warm drink", "Listen to music", "Take a short walk", "Tidy one small space", "Plan your next task"]
};

const ALTERNATIVE_TASKS = {
  1: "Stand and stretch your arms overhead.",
  2: "Wash your hands or face with cool water.",
  3: "Open a window and take three slow breaths.",
  4: "Write one sentence in your notes app.",
  5: "Put on one calming song and sit still.",
  6: "Set a five-minute reminder for a small task.",
  7: "Choose one gentle thing to do next."
};

const CHIPS = [
  "Reach out", "Reply to someone", "Organise something", "Appreciate someone",
  "Just check in", "Say thank you", "Share something funny", "Invite to catch up",
  "Send encouragement", "Ask how they are"
];

const QUICK_PLANS = ["Dinner", "Class", "Climb", "Lesson"];

export default function ChangeSceneExperience({ intervention, answers, onComplete, onAttemptEvent, onExit }) {
  const { prefs } = useAccessibilityPrefs();
  const { speak, stop: stopVoice, preload } = useGuideVoice();

  const voice = useMemo(() => voiceFor("lift"), []);

  // Restore session state if active
  const restored = useMemo(() => {
    const active = getActiveFlagship();
    return active?.interventionId === ID ? active.experience : null;
  }, []);

  const [step, setStep] = useState(restored?.step || 0);
  const [step0Taps, setStep0Taps] = useState(0);
  const [actionConfirmed, setActionConfirmed] = useState(false);
  const [selectedChip, setSelectedChip] = useState(restored?.selectedChip || null);
  const [isCozy, setIsCozy] = useState(restored?.isCozy || false);
  const [plannedThing, setPlannedThing] = useState(restored?.plannedThing || "");
  const [narrationOn, setNarrationOn] = useState(answers?.audio !== "no");

  // Toast overlay state for elegant notifications
  const [toastMessage, setToastMessage] = useState(null);

  // Premium alignment & sticky note tracking
  const [currentAudioTime, setCurrentAudioTime] = useState(0);
  const [audioIsPlaying, setAudioIsPlaying] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  // New suggestions & pathway states
  const [selectedSuggestions, setSelectedSuggestions] = useState({});
  const [selectedTaskChoice, setSelectedTaskChoice] = useState(restored?.selectedTaskChoice || {});
  const [customText, setCustomText] = useState("");
  const [showCustomInputStep, setShowCustomInputStep] = useState(null);
  
  const [selectedPath, setSelectedPath] = useState(null); // "relax" or "active"
  const [selectedPathActivity, setSelectedPathActivity] = useState(null);
  const [pathwayCustomText, setPathwayCustomText] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Save state on change
  useEffect(() => {
    const statePayload = {
      interventionId: ID,
      experience: { step, selectedChip, isCozy, plannedThing, selectedSuggestions, selectedTaskChoice, selectedPath, selectedPathActivity },
      away: step === 3 || step === 4, // "away" states
      updatedAt: new Date().toISOString()
    };
    saveActiveFlagship(statePayload);
  }, [step, selectedChip, isCozy, plannedThing, selectedSuggestions, selectedTaskChoice, selectedPath, selectedPathActivity]);

  // Preload all narration lines
  useEffect(() => {
    if (!narrationOn) return;
    Object.values(CHANGE_SCENE_NARRATION).forEach((line) => preload(line, voice));
  }, [narrationOn, preload, voice]);

  // Urgency glow effect timer
  useEffect(() => {
    setElapsedSeconds(0);
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Toast automatic clear effect
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Immersive Step 3 bird chirps ambient sound loop
  useEffect(() => {
    if (step === 3) {
      playBirdChirp();
      const interval = setInterval(() => {
        playBirdChirp();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Trigger audio narration per step
  useEffect(() => {
    stopVoice();
    setShowSticky(false);

    if (narrationOn) {
      const speechText = CHANGE_SCENE_NARRATION[`s${step}`];
      if (speechText) {
        speak(speechText, {
          voice,
          onTimeUpdate: (time) => {
            setCurrentAudioTime(time);
            setAudioIsPlaying(true);
          },
          onEnd: () => {
            setAudioIsPlaying(false);
            setShowSticky(true);
          }
        });
      }
    } else {
      setShowSticky(true);
    }

    return () => {
      stopVoice();
    };
  }, [step, narrationOn, speak, stopVoice, voice]);

  useEffect(() => {
    if (step !== 0 || step0Taps === 0) return;
    if (step0Taps === 1) {
      playBirdChirp();
      return;
    }
    if (step0Taps === 2) {
      playDawnBirdCall();
      return;
    }
    if (step0Taps === 3) {
      playTreeWind();
      if (narrationOn) speak(CHANGE_SCENE_NARRATION.s0Shift, { voice });
    }
  }, [step, step0Taps, narrationOn, speak, voice]);

  // Clean up voice on unmount
  useEffect(() => () => stopVoice(), [stopVoice]);

  const current = STEPS[step];

  // Calculate high-fidelity alignment timing per word and preserve newlines
  const mappedLines = useMemo(() => {
    const promptText = current.prompt || "";
    const lines = promptText.split("\n");
    const speechText = CHANGE_SCENE_NARRATION[`s${step}`];
    const narrationData = getNarration(speechText);
    const alignment = narrationData?.alignment || [];

    let lastFoundIdx = -1;
    return lines.map((line) => {
      const words = line.split(/\s+/).filter(Boolean);
      return words.map((word) => {
        const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!cleanWord) return { word, start: 0, end: 0 };
        
        const matchIdx = alignment.findIndex((item, idx) => {
          if (idx <= lastFoundIdx) return false;
          const alignWord = item.word.toLowerCase().replace(/[^a-z0-9]/g, "");
          const isNumMatch = cleanWord === "30" && alignWord === "thirty";
          return alignWord === cleanWord || isNumMatch;
        });

        if (matchIdx !== -1) {
          lastFoundIdx = matchIdx;
          return {
            word,
            start: alignment[matchIdx].start,
            end: alignment[matchIdx].end
          };
        }
        return { word, start: 0, end: 0 };
      });
    });
  }, [current.prompt, step]);

  const step0Brightness = useMemo(() => {
    if (step0Taps === 0) return 0.40;
    if (step0Taps === 1) return 0.60;
    if (step0Taps === 2) return 0.80;
    return 1.00;
  }, [step0Taps]);

  const step0BgColor = useMemo(() => {
    const r = Math.round(88 * step0Brightness);
    const g = Math.round(24 * step0Brightness);
    const b = Math.round(37 * step0Brightness);
    return `rgb(${r}, ${g}, ${b})`;
  }, [step0Brightness]);

  const handleNext = () => {
    if (step === 0 && step0Taps < 3) {
      playDopamineClick();
      hapticPattern([6]);
      setStep0Taps(prev => prev + 1);
    } else {
      if (step === 7) {
        // High fidelity transition from Scene Changed screen (Step 7) to Pathway screen (Step 8)
        playConquestInstrumental();
        hapticPattern([10, 50, 14, 65, 20]);
        setStep(8);
      } else if (step === 8) {
        // Complete pathway sequence and log session
        handleComplete();
      } else {
        // Move to next step with conquest chimes
        playConquestInstrumental();
        hapticPattern([6]);
        if (step < STEPS.length - 1) {
          setStep(step + 1);
        } else {
          handleComplete();
        }
      }
    }
  };

  const handleActionPress = () => {
    if (step === 0) {
      handleNext();
      return;
    }
    if (actionConfirmed) return;

    setActionConfirmed(true);
    playSelect();
    hapticPattern([6]);
    window.setTimeout(handleNext, 420);
  };

  const handleTaskChoice = (choice) => {
    setSelectedTaskChoice((choices) => ({ ...choices, [step]: choice }));
    playShiftCountdown();
    hapticPattern([6, 50, 6, 50, 6]);
  };

  const handleComplete = () => {
    const outcomeData = {
      isCozy,
      plannedThing,
      selectedSuggestions,
      selectedPath,
      selectedPathActivity,
      completedStep: step
    };

    rememberFlagshipEvent({
      interventionId: ID,
      completed: true,
      options: outcomeData
    });

    clearActiveFlagship(ID);

    onAttemptEvent?.({
      interventionId: ID,
      mechanism: intervention.mechanism,
      action: "completed",
      completedPercentage: 1.0,
      timestamp: Date.now()
    });

    onComplete?.({
      interventionId: ID,
      skipReflection: true,
      outcome: outcomeData
    });
  };

  const handleBack = () => {
    if (step > 0) {
      playSelect();
      hapticPattern([6]);
      setStep(step - 1);
    } else {
      onExit?.();
    }
  };

  useEffect(() => {
    setActionConfirmed(false);
  }, [step]);

  // Dynamic style parameters & premium theme mapping from uploaded images
  const theme = useMemo(() => {
    if (step === 0 || step === 5 || step === 6 || step === 8) {
      // Maroon Scheme (Screens 0, 5, 6, 8)
      return {
        paper: "#581825", // Maroon background
        ink: "#a2f9b8",   // Light electric green text
        accent: "#a2f9b8", // Accent color matches
        accentRgb: "162, 249, 184",
        buttonBg: "#ef4444", // Light red button shading
        buttonText: "#a2f9b8", // Lime green text on button
        stickyBg: "#1c4434", // Dark green sticky note
        stickyText: "#e87a74", // Soft red/pink text
        shadow: "0 28px 80px rgba(88, 24, 37, 0.4)",
        badgeBg: "#b91c1c",
        badgeText: "#a2f9b8",
        promptBg: "#1c4434",
        promptBorder: "rgba(162, 249, 184, 0.4)"
      };
    } else if (step === 7) {
      // Coral Wildcard Theme (Screen 8)
      return {
        paper: "#ffdad4", // Peach coral background
        ink: "#0ea5e9",   // Bright electric teal instructions
        accent: "#0ea5e9",
        accentRgb: "14, 165, 233",
        buttonBg: "#7c3aed", // Purple button
        buttonText: "#ffffff",
        stickyBg: "#7c3aed", // Purple sticky note
        stickyText: "#ffece8", // Peach/coral text
        shadow: "0 28px 80px rgba(124, 58, 237, 0.2)",
        badgeBg: "#7c3aed",
        badgeText: "#ffffff",
        promptBg: "#1c4434",
        promptBorder: "rgba(124, 58, 237, 0.4)"
      };
    } else {
      // Alternate Green Theme for screens 2, 3, 4, 5 (Step 1, 2, 3, 4)
      return {
        paper: "#daf1eb", // Alternate light green background
        ink: "#e87a74",   // Underlined soft red/slightly pink instructions
        accent: "#e87a74",
        accentRgb: "232, 122, 116",
        buttonBg: "#e87a74", // Soft red/pink proceed button
        buttonText: "#122a2e", // Dark green text on button
        stickyBg: "#1c4434", // Darker green sticky note
        stickyText: "#e87a74", // Soft red/slightly pink writing on sticky note
        shadow: "0 28px 80px rgba(28, 68, 52, 0.15)",
        badgeBg: "#1c4434",
        badgeText: "#e87a74",
        promptBg: "#1c4434",
        promptBorder: "rgba(232, 122, 116, 0.4)"
      };
    }
  }, [step]);

  const currentAccent = theme.accent;
  const currentAccentRgb = theme.accentRgb;

  // Literal left-to-right flowy continuous lines SVG background
  const arrowSvg = useMemo(() => {
    return (step === 0 || step === 5 || step === 6 || step === 8)
      ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='24' viewBox='0 0 60 24'%3E%3Cpath d='M0 8 C15 4, 15 12, 30 8 C45 4, 45 12, 60 8' stroke='white' stroke-width='1' fill='none' opacity='0.12' stroke-linecap='round'/%3E%3Cpath d='M0 16 C15 12, 15 20, 30 16 C45 12, 45 20, 60 16' stroke='white' stroke-width='1' fill='none' opacity='0.12' stroke-linecap='round'/%3E%3C/svg%3E"
      : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='24' viewBox='0 0 60 24'%3E%3Cpath d='M0 8 C15 4, 15 12, 30 8 C45 4, 45 12, 60 8' stroke='%2314211e' stroke-width='1' fill='none' opacity='0.05' stroke-linecap='round'/%3E%3Cpath d='M0 16 C15 12, 15 20, 30 16 C45 12, 45 20, 60 16' stroke='%2314211e' stroke-width='1' fill='none' opacity='0.05' stroke-linecap='round'/%3E%3C/svg%3E";
  }, [step]);

  const progressMap = (
    <div className="train-map" aria-label={`Progress: Step ${step + 1} of 9`}>
      <div className="train-line-bg" />
      <div className="train-line-fill" style={{ "--progress": step / 8 }} />
      {Array.from({ length: 9 }).map((_, i) => {
        const isPassed = i < step;
        const isActive = i === step;
        const stationLabels = ["Start", "Move", "Water", "Air", "Text", "Soften", "Plan", "Shift", "Path"];

        return (
          <button
            key={i}
            type="button"
            className={`station ${isPassed ? "passed" : ""} ${isActive ? "active" : ""}`}
            onClick={() => {
              if (i <= step) {
                playDopamineClick();
                hapticPattern([6]);
                setStep(i);
              }
            }}
            disabled={i > step}
            style={{ background: "transparent", border: "none", cursor: i <= step ? "pointer" : "default" }}
          >
            <div
              className="station-dot"
              style={{}}
            />
            <span className="station-label">{stationLabels[i]}</span>
          </button>
        );
      })}
    </div>
  );

  const openingNature = step === 0 && step0Taps > 0 ? (
    <div className={`opening-nature stage-${step0Taps}`} aria-hidden="true">
      <svg className="nature-horizon nature-horizon-far" viewBox="0 0 440 210" preserveAspectRatio="none">
        <path d="M0 186C40 157 75 170 113 137C152 104 189 144 230 120C272 96 296 116 337 82C371 55 400 72 440 38V210H0Z" />
      </svg>
      <svg className="nature-horizon nature-horizon-near" viewBox="0 0 440 240" preserveAspectRatio="none">
        <path d="M0 205C45 178 79 190 119 161C159 132 189 174 234 139C284 100 316 145 355 112C389 84 412 97 440 77V240H0Z" />
      </svg>
      <svg className="nature-branches" viewBox="0 0 440 230" preserveAspectRatio="none">
        <path d="M0 14C44 18 48 55 89 61C121 66 137 37 168 18M16 2C28 41 42 76 79 103M0 61C39 51 69 83 101 111" />
        <path d="M346 223C353 175 379 150 420 129M366 207C401 173 410 146 440 131" />
        <g className="nature-leaves">
          <circle cx="78" cy="72" r="8" /><circle cx="104" cy="87" r="6" /><circle cx="129" cy="54" r="9" />
          <circle cx="360" cy="164" r="8" /><circle cx="394" cy="143" r="7" /><circle cx="420" cy="116" r="9" />
        </g>
      </svg>
      <div className="opening-sun" />
      <div className="sunlight-beam" />
    </div>
  ) : null;

  const suggestionsNote = step > 0 && step < 8 && selectedTaskChoice[step] ? (
    <motion.div
      initial={prefs.reducedMotion ? false : { opacity: 0, y: 8, rotate: -1 }}
      animate={{ opacity: 1, y: 0, rotate: -1 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="guided-suggestions"
      aria-label="Suggestions"
    >
      <p className="guided-suggestions-heading">Some suggestions</p>
      {step === 7 ? (
        <div className="next-steps">
          <div>
            <p>Restful</p>
            <ul>
              {SUGGESTIONS[step].slice(0, 3).map((suggestion) => <li className="guided-suggestion" key={suggestion}>{suggestion}</li>)}
            </ul>
          </div>
          <div>
            <p>Productive</p>
            <ul>
              {SUGGESTIONS[step].slice(3, 6).map((suggestion) => <li className="guided-suggestion" key={suggestion}>{suggestion}</li>)}
            </ul>
          </div>
        </div>
      ) : (
        <ul className="guided-suggestions-list">
          {(SUGGESTIONS[step] || []).slice(0, 6).map((suggestion) => (
            <li className="guided-suggestion" key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      )}
    </motion.div>
  ) : null;

  return (
    <InterventionControlShell
      id={ID}
      goal="Lift"
      title="Change the Scene"
      stage={step + 1}
      stages={STEPS.length}
      onBack={handleBack}
      onExit={onExit}
      audioOn={narrationOn}
      onAudio={() => setNarrationOn(!narrationOn)}
      onDifferent={onExit}
      accent={currentAccent}
      className="change-scene-v2-container"
      field={
        <style dangerouslySetInnerHTML={{
          __html: `
            .change-scene-v2-container {
              background: ${step === 0
                ? step0BgColor
                : step === 3 
                  ? "linear-gradient(180deg, #60a5fa 0%, #daf1eb 60%, #daf1eb 100%)" 
                  : theme.paper} !important;
              transition: background 0.5s ease;
              overflow: visible;
            }

            .change-scene-v2 {
              --ink: ${theme.ink};
              --muted: #7b8582;
              --paper: ${theme.paper};
              --accent: ${theme.accent};
              --accent-rgb: ${theme.accentRgb};
              --prompt-bg: ${theme.promptBg};
              --prompt-border: ${theme.promptBorder};
              --button-bg: ${theme.buttonBg};
              --button-text: ${theme.buttonText};
              width: 100%;
              height: calc(100dvh - 126px);
              min-height: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 8px 16px 12px;
              margin: 0;
              box-sizing: border-box;
              overflow: hidden;
            }

            .change-scene-v2 .shell {
              width: 100%;
              max-width: 440px;
              margin: 0 auto;
              height: 100%;
              max-height: 680px;
              min-height: 0;
              padding: 18px 20px 12px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              overflow: hidden;
              border-radius: 24px;
              position: relative;
              background: var(--paper);
              border: 1px solid rgba(255,255,255,${(step === 0 || step === 5 || step === 6 || step === 8) ? "0.06" : "0.82"});
              box-shadow: ${theme.shadow}, 0 0 0 1px rgba(20,33,30,.035);
              backdrop-filter: blur(30px) saturate(1.05);
              transition: transform 0.3s ease, border-color 0.5s ease, background 0.5s ease;
              transform-origin: center center;
            }

            .change-scene-v2 h1 {
              text-align: center !important;
              width: 100% !important;
              display: block !important;
            }
            .change-scene-v2 h1.left-align {
              text-align: left !important;
            }

            .change-scene-v2 .brand {
              display: flex;
              justify-content: center;
              margin-bottom: 8px;
              flex-shrink: 0;
              position: relative;
              z-index: 3;
            }
            .change-scene-v2 .brand-pill {
              background: ${step === 0 ? "rgba(162, 249, 184, 0.08)" : "rgba(20,33,30,.035)"};
              border: 1px solid ${step === 0 ? "rgba(162, 249, 184, 0.16)" : "rgba(20,33,30,.06)"};
              padding: 6px 16px;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 10px;
              font-weight: 800;
              letter-spacing: 0.12em;
              text-transform: uppercase;
              color: var(--ink);
              opacity: 0.85;
            }
            .change-scene-v2 .brand-dot {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: var(--accent);
              box-shadow: 0 0 8px var(--accent);
            }

            .change-scene-v2 .content {
              display: flex;
              flex-direction: column;
              flex: 1 1 auto;
              min-height: 0;
              position: relative;
              z-index: 5;
            }
            .change-scene-v2 .instruction-screen {
              flex: 1;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              min-height: 0;
              padding: 4px 0 8px;
            }
            .change-scene-v2 .reveal-screen {
              position: relative;
            }
            .change-scene-v2 .reveal-screen::before {
              content: none;
            }
            .change-scene-v2 .reveal-screen .scene-heading,
            .change-scene-v2 .reveal-screen .guided-suggestions {
              animation: sceneContentReveal 5s linear both;
              will-change: filter, opacity;
            }
            .change-scene-v2 h1 {
              font-family: Iowan Old Style, Baskerville, "Times New Roman", serif !important;
              font-weight: 700;
              letter-spacing: -0.045em;
              text-wrap: balance;
            }
            .change-scene-v2 .title-the {
              font-size: 0.62em;
              letter-spacing: -0.02em;
            }
            .change-scene-v2 .instruction-screen .interaction,
            .change-scene-v2 .instruction-screen .achievement-card {
              display: none;
              justify-content: space-between;
            }

            .change-scene-v2 .visual {
              position: relative;
              height: 120px;
              margin-bottom: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 20px;
              overflow: hidden;
              flex-shrink: 0;
            }
            .change-scene-v2 .visual.step-0-visual {
              display: none;
            }
            .change-scene-v2 .scene-visual {
              position: relative;
              height: 96px;
              display: grid;
              place-items: center;
              overflow: hidden;
              margin: 0 0 12px;
              border: 1px solid rgba(255,255,255,0.16);
              border-radius: 18px;
              background: #102119;
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 24px rgba(0,0,0,0.2);
              flex: 0 0 auto;
            }
            .change-scene-v2 .scene-visual-image {
              position: absolute;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              object-position: center;
              filter: saturate(1.08) contrast(1.04);
            }
            .change-scene-v2 .scene-visual-scrim {
              position: absolute;
              inset: 0;
              background: linear-gradient(90deg, rgba(9,25,18,0.32), transparent 52%, rgba(9,25,18,0.18));
              z-index: 1;
            }
            .change-scene-v2 .scene-visual::before,
            .change-scene-v2 .scene-visual::after {
              content: "";
              position: absolute;
              width: 180px;
              height: 180px;
              border: 1px solid rgba(255,255,255,0.16);
              border-radius: 50%;
              pointer-events: none;
            }
            .change-scene-v2 .scene-visual::before {
              top: -125px;
              left: -44px;
            }
            .change-scene-v2 .scene-visual::after {
              right: -68px;
              bottom: -136px;
            }
            .change-scene-v2 .scene-visual-art {
              width: 130px;
              height: 106px;
              position: relative;
              z-index: 2;
            }
            .change-scene-v2 .completion-screen {
              isolation: isolate;
              justify-content: center;
              padding: 18px 8px;
              border-radius: 22px;
              background:
                radial-gradient(circle at 10% 16%, rgba(163, 249, 184, 0.86) 0 2px, transparent 3px),
                radial-gradient(circle at 18% 68%, rgba(248, 214, 106, 0.86) 0 3px, transparent 4px),
                radial-gradient(circle at 30% 80%, rgba(163, 249, 184, 0.72) 0 1px, transparent 2px),
                radial-gradient(circle at 72% 13%, rgba(248, 214, 106, 0.9) 0 2px, transparent 3px),
                radial-gradient(circle at 85% 34%, rgba(163, 249, 184, 0.68) 0 3px, transparent 4px),
                radial-gradient(circle at 91% 78%, rgba(248, 214, 106, 0.76) 0 2px, transparent 3px),
                linear-gradient(160deg, #0b514a, #073c3b 54%, #061d24);
              border: 1px solid rgba(255, 248, 205, 0.28);
              box-shadow:
                inset 0 2px 0 rgba(255,255,255,0.28),
                inset 0 -10px 20px rgba(0,0,0,0.22),
                inset 12px 0 26px rgba(163,249,184,0.06),
                0 8px 0 #042c2b,
                0 19px 34px rgba(0,0,0,0.3);
              transform: translateY(-4px);
            }
            .change-scene-v2 .completion-screen::before {
              content: "";
              position: absolute;
              inset: 0;
              z-index: -1;
              border-radius: inherit;
              background:
                radial-gradient(ellipse 58% 48% at 50% 50%, rgba(255, 230, 144, 0.34), rgba(255, 216, 105, 0.12) 34%, transparent 72%),
                linear-gradient(142deg, rgba(255,255,255,0.19), transparent 34%);
              animation: completionTorch 4.8s ease-in-out infinite;
              pointer-events: none;
            }
            .change-scene-v2 .completion-screen::after {
              content: "";
              position: absolute;
              inset: 1px;
              z-index: 0;
              border-radius: inherit;
              pointer-events: none;
              background:
                linear-gradient(112deg, transparent 28%, rgba(255,255,255,0.18) 43%, transparent 55%),
                linear-gradient(180deg, rgba(255,255,255,0.1), transparent 22%);
              mix-blend-mode: screen;
            }
            .change-scene-v2 .completion-screen > .text-center {
              width: 100%;
              position: relative;
              z-index: 1;
            }
            .change-scene-v2 .completion-title {
              margin: 0;
              color: #fff7d1 !important;
              font-family: "Snell Roundhand", "Segoe Script", "Apple Chancery", cursive !important;
              font-size: clamp(40px, 10vw, 52px) !important;
              font-weight: 600;
              letter-spacing: -0.075em;
              line-height: 0.95;
              white-space: nowrap;
              text-align: center !important;
              text-shadow: 0 3px 18px rgba(0,0,0,0.42);
            }
            .change-scene-v2 .completion-seal {
              display: grid;
              place-items: center;
              width: 78px;
              height: 78px;
              margin: 34px auto 0;
              border: 2px solid #f8d66a;
              border-radius: 50%;
              color: #fff3bf;
              font-size: 32px;
              box-shadow: 0 0 16px rgba(248, 214, 106, 0.86), 0 0 38px rgba(248, 214, 106, 0.38);
            }
            .change-scene-v2 .completion-caption {
              margin: 34px auto 0;
              max-width: 310px;
              color: #fff3bf;
              font-family: "Snell Roundhand", "Segoe Script", "Apple Chancery", cursive;
              font-size: 25px;
              font-weight: 600;
              letter-spacing: -0.03em;
              line-height: 1.1;
              text-transform: none;
            }
            @keyframes completionTorch {
              0%, 100% { opacity: 0.5; }
              52% { opacity: 1; }
            }
            .change-scene-v2 .guided-suggestions {
              display: block;
              width: min(74%, 270px);
              height: 136px;
              margin: 10px auto 8px 0;
              padding: 16px 16px 13px;
              box-sizing: border-box;
              border: 1px solid rgba(141, 112, 25, 0.24);
              border-radius: 2px;
              background: rgba(255, 247, 182, 0.84);
              box-shadow: 0 10px 18px rgba(42, 31, 8, 0.22);
              text-align: left;
              position: relative;
              overflow: hidden;
              position: relative;
              z-index: 1;
            }
            .change-scene-v2 .instruction-popup-shell .guided-suggestions {
              width: min(76%, 206px);
              height: 102px;
              margin: 8px 0 0 0;
              padding: 11px 12px 8px;
              transform-origin: top left;
            }
            .change-scene-v2 .instruction-popup-shell .guided-suggestions-heading {
              margin-bottom: 3px;
              font-size: 12px;
            }
            .change-scene-v2 .instruction-popup-shell .guided-suggestions-list {
              height: 66px;
              column-gap: 8px;
            }
            .change-scene-v2 .instruction-popup-shell .guided-suggestion {
              min-height: 12px;
              gap: 4px;
              padding-left: 8px;
              font-size: 10px;
              line-height: 1.1;
            }
            .change-scene-v2 .instruction-popup-shell .guided-suggestion::before {
              font-size: 12px;
            }
            .change-scene-v2 .guided-suggestions-heading {
              margin: 0 0 6px;
              color: #4b3720;
              font-family: Iowan Old Style, Baskerville, Georgia, serif;
              font-size: 15px;
              font-weight: 700;
              letter-spacing: -0.02em;
            }
            .change-scene-v2 .guided-suggestions-list {
              height: 88px;
              margin: 0;
              padding: 0;
              list-style: none;
              columns: 2;
              column-gap: 14px;
              column-fill: auto;
            }
            .change-scene-v2 .next-steps {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 10px;
            }
            .change-scene-v2 .next-steps p {
              margin: 0 0 3px;
              color: #5d4022;
              font-family: Iowan Old Style, Baskerville, Georgia, serif;
              font-size: 11px;
              font-weight: 700;
            }
            .change-scene-v2 .next-steps ul {
              margin: 0;
              padding: 0;
              list-style: none;
            }
            .change-scene-v2 .guided-suggestions::before {
              content: "";
              position: absolute;
              top: -8px;
              left: 50%;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: #bc3830;
              box-shadow: 0 2px 2px rgba(0,0,0,0.25), inset 0 1px rgba(255,255,255,0.45);
              transform: translateX(-50%);
            }
            .change-scene-v2 .guided-suggestion {
              display: flex;
              align-items: center;
              gap: 9px;
              min-height: 15px;
              padding: 1px 2px 1px 12px;
              color: #253c31;
              font-family: "EB Garamond", Georgia, serif;
              font-size: 13px;
              font-style: italic;
              font-weight: 600;
              line-height: 1.15;
              break-inside: avoid;
            }
            .change-scene-v2 .guided-suggestion::before {
              content: "•";
              color: #c65c50;
              font-size: 18px;
            }
            .change-scene-v2 .guided-suggestion:nth-child(2),
            .change-scene-v2 .guided-suggestion:nth-child(5) {
              text-decoration: underline;
              text-decoration-color: rgba(103, 70, 37, 0.55);
              text-underline-offset: 2px;
            }
            .change-scene-v2 .pathway-flow,
            .change-scene-v2 .pathway-custom-input,
            .change-scene-v2 .pathway-actions {
              display: none;
            }

            .change-scene-v2 .prompt {
              position: relative;
              background: var(--prompt-bg);
              border: 1px solid var(--prompt-border);
              padding: ${step === 0 ? "8px 24px 8px" : "10px 18px 11px"};
              border-radius: 24px;
              box-shadow: ${step === 0 ? "none" : "0 16px 40px rgba(0,0,0,0.12)"};
              filter: ${step === 0 ? "drop-shadow(0 8px 16px rgba(0,0,0,0.25))" : "none"};
              margin: 34px 0 6px;
              transition: background-color 0.4s ease, border-color 0.4s ease, opacity 0.3s ease, transform 0.3s ease;
              clip-path: ${step === 0 ? "polygon(0% 0%, 91% 0%, 100% 50%, 91% 100%, 0% 100%)" : "none"};
              width: ${step === 0 ? "84%" : "100%"};
              margin-left: ${step === 0 ? "8%" : "0"};
              background-image: url("${arrowSvg}");
              background-repeat: repeat-x;
              background-size: 60px 24px;
              background-position: bottom 6px left 0;
            }
            .change-scene-v2 .instruction-popup-shell {
              position: relative;
              z-index: 3;
              width: min(90%, 313px);
              margin: 12px auto 0;
            }
            .change-scene-v2 .instruction-popup-shell .prompt {
              margin: 0;
              padding: 11px;
              border: 1px solid rgba(255, 249, 223, 0.3);
              border-radius: 18px;
              background: #1c4434;
              background-image: none;
              box-shadow: 0 18px 34px rgba(0,0,0,0.3);
            }
            .change-scene-v2 .task-choices {
              display: grid;
              gap: 8px;
            }
            .change-scene-v2 .task-choice {
              position: relative;
              width: 100%;
              min-height: 56px;
              padding: 9px 12px;
              border: 1px solid rgba(255, 249, 223, 0.22);
              border-radius: 12px;
              background: rgba(255,255,255,0.055);
              color: #fff9df;
              cursor: pointer;
              font-family: Iowan Old Style, Baskerville, Georgia, serif;
              font-size: 14.5px;
              line-height: 1.2;
              text-align: left;
              transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
            }
            .change-scene-v2 .task-choice:hover,
            .change-scene-v2 .task-choice.selected {
              border-color: #ffe58a;
              background: rgba(255, 229, 138, 0.13);
              transform: translateY(-1px);
            }
            .change-scene-v2 .task-choice.selected {
              padding-left: 48px;
            }
            .change-scene-v2 .target-lock {
              position: absolute;
              top: 50%;
              left: 12px;
              width: 27px;
              height: 27px;
              color: #ffe58a;
              transform: translateY(-50%);
              filter: drop-shadow(0 0 6px rgba(255, 229, 138, 0.72));
            }
            .change-scene-v2 .target-lock svg {
              width: 100%;
              height: 100%;
              stroke: currentColor;
              stroke-linecap: round;
              stroke-linejoin: round;
              stroke-width: 2;
            }
            .change-scene-v2 .task-choice-label {
              display: block;
              margin-bottom: 4px;
              color: #ffe58a;
              font-family: system-ui, sans-serif;
              font-size: 9px;
              font-weight: 800;
              letter-spacing: 0.13em;
              text-transform: uppercase;
            }
            @keyframes sceneAmbientReveal {
              0% {
                background: rgba(2, 16, 13, 0.48);
              }
              20% {
                background: rgba(2, 16, 13, 0.4);
              }
              40% {
                background: rgba(2, 16, 13, 0.3);
              }
              60% {
                background: rgba(2, 16, 13, 0.2);
              }
              80% {
                background: rgba(2, 16, 13, 0.1);
              }
              100% {
                background: rgba(2, 16, 13, 0);
              }
            }
            @keyframes sceneContentReveal {
              0% { filter: blur(8px) brightness(0.5); opacity: 0.5; }
              20% { filter: blur(6px) brightness(0.6); opacity: 0.6; }
              40% { filter: blur(4px) brightness(0.7); opacity: 0.7; }
              60% { filter: blur(2px) brightness(0.8); opacity: 0.8; }
              80% { filter: blur(1px) brightness(0.9); opacity: 0.9; }
              100% { filter: blur(0) brightness(1); opacity: 1; }
            }
            .change-scene-v2 .opening-instruction {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .change-scene-v2 .start-screen-content h1 {
              align-self: stretch;
              text-align: left !important;
            }
            .change-scene-v2 .start-screen-content .prompt-text {
              width: min(86%, 318px);
              margin: 0 auto;
              color: #fff7d1;
              font-family: Iowan Old Style, Baskerville, "Times New Roman", serif;
              font-size: 19px;
              font-weight: 500;
              letter-spacing: -0.02em;
              line-height: 1.35;
              text-align: center;
              text-shadow: 0 2px 14px rgba(0,0,0,0.32);
            }

            .change-scene-v2 .prompt-text {
              font-size: 17px;
              line-height: 1.3;
              font-weight: 750;
              color: #fff9df;
              text-align: center;
              font-style: normal;
            }

            .change-scene-v2 .word-span {
              position: relative;
              display: inline-block;
              margin-right: 0.22em;
              white-space: pre-wrap;
              transition: color 0.12s ease, transform 0.12s ease;
            }
            .change-scene-v2 .word-span.dimmed {
              color: inherit;
            }
            .change-scene-v2 .word-span.active {
              color: #ffe58a;
              text-shadow: 0 0 12px rgba(255, 229, 138, 0.7);
              transform: scale(1.04);
              font-weight: 800;
            }

            .change-scene-v2 .badge {
              position: absolute;
              top: -12px;
              left: 20px;
              background: ${theme.badgeBg};
              color: ${theme.badgeText};
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 9px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              box-shadow: 0 4px 10px rgba(0,0,0,0.15);
              border: 1px solid rgba(255,255,255,0.12);
            }

            .change-scene-v2 .sticky-note {
              position: absolute;
              bottom: -22px;
              width: 155px;
              padding: 6px 14px;
              border-radius: 12px;
              box-shadow: 0 8px 24px rgba(0,0,0,0.18);
              font-size: 10px;
              line-height: 1.35;
              font-weight: 750;
              z-index: 25;
              transition: all 0.3s ease;
            }
            .change-scene-v2 .sticky-note.left-side {
              left: 12px;
              transform: rotate(-3.5deg);
            }
            .change-scene-v2 .sticky-note.right-side {
              right: 12px;
              transform: rotate(2.8deg);
            }
            .change-scene-v2 .sticky-note.in-flow {
              position: relative;
              bottom: auto;
              left: auto;
              width: min(100%, 252px);
              margin: 14px 0 0 12px;
              transform: none;
              opacity: 1;
              z-index: 1;
            }
            .change-scene-v2 .sticky-note-pin {
              position: absolute;
              top: -6px;
              left: 50%;
              width: 10px;
              height: 10px;
              background: rgba(255,255,255,0.5);
              border-radius: 50%;
              transform: translateX(-50%);
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            }

            .change-scene-v2 .glistening {
              position: relative;
              overflow: hidden;
            }
            .change-scene-v2 .glistening .glisten-sweep {
              position: absolute;
              top: -50%;
              left: -60%;
              width: 50%;
              height: 200%;
              background: linear-gradient(
                to right,
                rgba(255, 255, 255, 0) 0%,
                rgba(255, 255, 255, 0.45) 50%,
                rgba(255, 255, 255, 0) 100%
              );
              transform: rotate(30deg);
              animation: glisten 4.5s infinite ease-in-out;
              pointer-events: none;
            }
            @keyframes glisten {
              0% { left: -100%; }
              15% { left: 150%; }
              100% { left: 150%; }
            }

            .change-scene-v2 .interaction {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 100%;
              margin: 12px 0;
            }
            .change-scene-v2 .start-screen-content {
              display: flex;
              flex: 1;
              flex-direction: column;
              align-items: center;
              justify-content: flex-start;
              gap: 16px;
              min-height: 0;
              padding: 16px 0 12px;
              position: relative;
              z-index: 3;
            }
            .change-scene-v2 .opening-nature {
              position: absolute;
              inset: 0;
              z-index: 1;
              overflow: hidden;
              pointer-events: none;
            }
            .change-scene-v2 .nature-horizon,
            .change-scene-v2 .nature-branches {
              position: absolute;
              inset-inline: 0;
              width: 100%;
              overflow: visible;
              fill: none;
              stroke-linecap: round;
              stroke-linejoin: round;
              opacity: 0;
              transition: opacity 0.7s ease, transform 0.9s ease;
            }
            .change-scene-v2 .nature-horizon-far {
              bottom: -2px;
              height: 210px;
              fill: rgba(57, 116, 79, 0.2);
              transform: translateY(16px);
            }
            .change-scene-v2 .nature-horizon-near {
              bottom: -2px;
              height: 240px;
              fill: rgba(28, 83, 59, 0.24);
              transform: translateY(24px);
            }
            .change-scene-v2 .nature-branches {
              top: 0;
              height: 230px;
              stroke: rgba(166, 240, 193, 0.38);
              stroke-width: 2.2px;
            }
            .change-scene-v2 .nature-leaves {
              fill: rgba(166, 240, 193, 0.26);
              stroke: none;
            }
            .change-scene-v2 .opening-nature.stage-1 .nature-horizon-far,
            .change-scene-v2 .opening-nature.stage-1 .nature-branches {
              opacity: 0.42;
              transform: translateY(0);
            }
            .change-scene-v2 .opening-nature.stage-2 .nature-horizon,
            .change-scene-v2 .opening-nature.stage-2 .nature-branches,
            .change-scene-v2 .opening-nature.stage-3 .nature-horizon,
            .change-scene-v2 .opening-nature.stage-3 .nature-branches {
              opacity: 0.72;
              transform: translateY(0);
            }
            .change-scene-v2 .opening-sun {
              position: absolute;
              top: 77px;
              right: 34px;
              width: 38px;
              height: 38px;
              border-radius: 50%;
              background: #ffe58a;
              box-shadow: 0 0 18px rgba(255,229,138,0.7), 0 0 48px rgba(255,229,138,0.3);
              opacity: 0;
              transform: scale(0.7);
              transition: opacity 0.6s ease, transform 0.6s ease;
            }
            .change-scene-v2 .opening-nature.stage-2 .opening-sun,
            .change-scene-v2 .opening-nature.stage-3 .opening-sun {
              opacity: 0.62;
              transform: scale(1);
            }
            .change-scene-v2 .sunlight-beam {
              position: absolute;
              top: 88px;
              right: -38px;
              width: 280px;
              height: 480px;
              opacity: 0;
              transform: rotate(25deg);
              transform-origin: top right;
              background: linear-gradient(90deg, rgba(255,229,138,0.26), rgba(255,229,138,0.05) 40%, transparent 72%);
              clip-path: polygon(0 0, 100% 0, 68% 100%, 20% 100%);
              transition: opacity 0.8s ease;
            }
            .change-scene-v2 .opening-nature.stage-2 .sunlight-beam,
            .change-scene-v2 .opening-nature.stage-3 .sunlight-beam {
              opacity: 0.7;
            }
            .change-scene-v2 .start-screen-content .prompt {
              margin: 0;
            }
            .change-scene-v2 .start-shift-control {
              position: relative;
              width: clamp(132px, 34vw, 150px);
              aspect-ratio: 1;
              flex: 0 0 auto;
              display: grid;
              place-items: center;
              margin: 0;
              padding: 0;
              border: 0;
              border-radius: 50%;
              background: transparent;
              cursor: pointer;
              filter: drop-shadow(0 0 10px rgba(57, 242, 117, 0.68)) drop-shadow(0 0 24px rgba(57, 242, 117, 0.42));
              transition: filter 0.35s ease, transform 0.35s ease;
            }
            .change-scene-v2 .start-shift-control:focus-visible,
            .change-scene-v2 button:focus-visible,
            .change-scene-v2 input:focus-visible {
              outline: 3px solid var(--accent);
              outline-offset: 4px;
            }
            .change-scene-v2 .start-shift-icon {
              width: 83.333%;
              height: 83.333%;
              filter: drop-shadow(0 0 8px #39f275);
            }
            .change-scene-v2 .start-tap-progress {
              display: flex;
              gap: 6px;
              align-items: center;
              justify-content: center;
              min-height: 10px;
              margin-bottom: 12px;
            }
            .change-scene-v2 .start-tap-progress span {
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: rgba(162, 249, 184, 0.28);
              transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
            }
            .change-scene-v2 .start-tap-progress span.active {
              background: #a2f9b8;
              box-shadow: 0 0 10px #a2f9b8;
              transform: scale(1.25);
            }
            .change-scene-v2 .start-screen-content .train-map {
              margin: 0 0 8px;
            }
            .change-scene-v2 .start-control-label {
              color: #a2f9b8;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              margin-top: -7px;
              margin-bottom: 0;
              transition: color 0.35s ease, text-shadow 0.35s ease;
            }
            .change-scene-v2 .start-control-label::first-letter {
              font-size: 1.28em;
              font-weight: 950;
            }
            .change-scene-v2 .start-screen-content:has(.start-tap-progress span:nth-child(1).active) .start-shift-control {
              filter: drop-shadow(0 0 14px rgba(57,242,117,0.82)) drop-shadow(0 0 34px rgba(57,242,117,0.58));
            }
            .change-scene-v2 .start-screen-content:has(.start-tap-progress span:nth-child(2).active) .start-shift-control {
              filter: drop-shadow(0 0 19px rgba(57,242,117,0.96)) drop-shadow(0 0 48px rgba(57,242,117,0.74));
            }
            .change-scene-v2 .start-screen-content.opening-stage-3 {
              position: fixed;
              inset: 0;
              z-index: 25;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 32px;
              background: rgba(98, 34, 47, 0.36);
              backdrop-filter: blur(1px);
            }
            .change-scene-v2 .start-screen-content.opening-stage-3 h1,
            .change-scene-v2 .start-screen-content.opening-stage-3 .opening-instruction,
            .change-scene-v2 .start-screen-content.opening-stage-3 .start-tap-progress,
            .change-scene-v2 .start-screen-content.opening-stage-3 .train-map {
              display: none;
            }
            .change-scene-v2 .start-screen-content.opening-stage-3 .start-shift-control {
              width: min(224px, 70vw);
              filter: drop-shadow(0 0 25px rgba(57,242,117,1)) drop-shadow(0 0 74px rgba(57,242,117,0.96));
              animation: openingLaunchGlow 1.15s ease-in-out infinite;
            }
            .change-scene-v2 .start-screen-content.opening-stage-3 .start-control-label {
              color: #d8ffe5;
              font-size: 14px;
              text-shadow: 0 0 12px #39f275, 0 0 30px rgba(57,242,117,0.9);
            }
            @keyframes openingLaunchGlow {
              50% { transform: scale(1.045); }
            }

            .change-scene-v2 .suggestions-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              width: 100%;
              padding: 0 4px;
            }
            .change-scene-v2 .suggestion-btn {
              min-height: 48px;
              height: auto;
              padding: 10px 16px;
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: space-between;
              cursor: pointer;
              font-size: 12.5px;
              font-weight: 700;
              font-family: system-ui, -apple-system, sans-serif;
              letter-spacing: 0.01em;
              transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              text-align: left;
              background: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "#aa1c1c"
                : step === 7
                  ? "#e2847a"
                  : "#133829"};
              color: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "rgba(162, 249, 184, 0.85)"
                : step === 7
                  ? "rgba(124, 58, 237, 0.85)"
                  : "rgba(232, 122, 116, 0.85)"};
              border: 1.5px solid ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "rgba(162, 249, 184, 0.25)"
                : step === 7
                  ? "rgba(124, 58, 237, 0.25)"
                  : "rgba(232, 122, 116, 0.25)"};
              box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            }
            .change-scene-v2 .suggestion-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(0,0,0,0.12);
              border-color: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "rgba(162, 249, 184, 0.5)"
                : step === 7
                  ? "rgba(124, 58, 237, 0.5)"
                  : "rgba(232, 122, 116, 0.5)"};
            }
            .change-scene-v2 .suggestion-btn:active {
              transform: translateY(1px);
            }
            .change-scene-v2 .suggestion-btn.selected {
              background: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "#ffffff"
                : step === 7
                  ? "#2e1065"
                  : "#ffffff"};
              color: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "#581825"
                : step === 7
                  ? "#ffffff"
                  : "#091e16"};
              border: 1.5px solid ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "#a2f9b8"
                : step === 7
                  ? "#a78bfa"
                  : "#e87a74"};
              box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.75), 0 8px 24px rgba(var(--accent-rgb), 0.35);
              font-weight: 850;
              transform: scale(1.02);
            }

            .change-scene-v2 .circle-tick {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 1.5px solid currentColor;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: 900;
              flex-shrink: 0;
              margin-left: 6px;
              transition: all 0.2s ease;
            }
            .change-scene-v2 .suggestion-btn.selected .circle-tick {
              background: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "#581825"
                : step === 7
                  ? "#ffffff"
                  : "#091e16"};
              color: ${(step === 0 || step === 5 || step === 6 || step === 8)
                ? "#a2f9b8"
                : step === 7
                  ? "#a78bfa"
                  : "#e87a74"};
              border-color: transparent;
            }

            .change-scene-v2 .plan-input {
              width: 100%;
              height: 42px;
              border-radius: 12px;
              padding: 0 16px;
              outline: none;
              font-size: 13px;
              font-weight: 650;
              transition: all 0.3s ease;
            }

            .change-scene-v2 .achievement-card {
              background: rgba(20, 33, 30, 0.95);
              border: 1.5px solid #a2f9b8;
              box-shadow: 0 0 20px rgba(162, 249, 184, 0.35);
              border-radius: 16px;
              padding: 14px 16px;
              position: absolute;
              bottom: -4px;
              left: 4px;
              width: 98%;
              z-index: 30;
            }

            .change-scene-v2 .heavy-blur {
              filter: blur(7px) grayscale(0.25);
              opacity: 0.42;
              transition: filter 0.4s ease, opacity 0.4s ease;
              pointer-events: none;
            }

            .change-scene-v2 .footer {
              padding: 0 16px 6px;
              position: relative;
              z-index: 10;
              margin-top: auto;
              margin-bottom: 28px;
            }
            .change-scene-v2 .footer--start {
              margin-top: 8px;
            }
            .change-scene-v2 .footer--start .train-map {
              margin: 0;
            }
            .change-scene-v2 .shell:has(.footer--start) {
              justify-content: flex-start;
            }
            .change-scene-v2 .shell:has(.footer--start) .content {
              flex: 0 0 auto;
            }

            .change-scene-v2 .circular-push-btn {
              position: relative;
              width: min(189px, 68%);
              height: 54px;
              border-radius: 27px;
              background: #39f275;
              color: #062819;
              border: 2px solid rgba(222, 255, 234, 0.9);
              outline: none;
              cursor: pointer;
              box-shadow: 0 7px 0 #168547, 0 0 22px rgba(57, 242, 117, 0.96), 0 0 50px rgba(57, 242, 117, 0.72), 0 14px 22px rgba(0,0,0,0.22);
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 12px;
              transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.2s ease;
              z-index: 10;
              margin: 2px auto;
              animation: neonActionPulse 1.7s ease-in-out infinite;
              will-change: transform, box-shadow;
            }
            .change-scene-v2 .circular-push-btn:active {
              transform: translateY(4px);
              box-shadow: 0 3px 0 #168547, 0 0 14px rgba(57, 242, 117, 0.45), 0 7px 12px rgba(0,0,0,0.2);
            }
            .change-scene-v2 .circular-push-btn.confirmed {
              background: #dfffe8;
              animation: none;
              transform: translateY(4px);
              box-shadow: 0 3px 0 #168547, 0 0 24px rgba(57, 242, 117, 0.8);
            }
            .change-scene-v2 .action-status {
              width: 28px;
              height: 28px;
              display: grid;
              place-items: center;
              flex: 0 0 auto;
              border: 2px solid currentColor;
              border-radius: 50%;
              font-size: 17px;
              font-weight: 900;
              line-height: 1;
              transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
            }
            .change-scene-v2 .circular-push-btn.confirmed .action-status {
              background: #0c7a3e;
              color: #ffffff;
              border-color: #0c7a3e;
              transform: scale(1.08);
            }
            @keyframes neonActionPulse {
              0%, 100% { transform: scale(1); box-shadow: 0 7px 0 #168547, 0 0 12px rgba(57, 242, 117, 0.44), 0 0 28px rgba(57, 242, 117, 0.28), 0 14px 22px rgba(0,0,0,0.22); }
              50% { transform: scale(1.045); box-shadow: 0 7px 0 #168547, 0 0 34px rgba(57, 242, 117, 1), 0 0 72px rgba(57, 242, 117, 0.86), 0 16px 26px rgba(0,0,0,0.24); }
            }

            .change-scene-v2 .circular-push-btn.glow-pulse-red {
              animation: redGlowPulse 1.8s infinite ease-in-out;
            }
            @keyframes redGlowPulse {
              0%, 100% { box-shadow: 0 0 12px rgba(239, 68, 68, 0.5), 0 6px 0 #991b1b, 0 10px 16px rgba(0,0,0,0.22); }
              50% { box-shadow: 0 0 24px rgba(239, 68, 68, 0.95), 0 6px 0 #991b1b, 0 10px 16px rgba(0,0,0,0.22); transform: scale(1.02); }
            }

            .change-scene-v2 .circular-push-btn.green-pulse {
              animation: greenGlowPulse 1.8s infinite ease-in-out;
              background: #22c55e !important;
              color: #ef4444 !important;
            }
            @keyframes greenGlowPulse {
              0%, 100% { box-shadow: 0 0 12px rgba(34, 197, 94, 0.5), 0 6px 0 #15803d, 0 10px 16px rgba(0,0,0,0.22); }
              50% { box-shadow: 0 0 24px rgba(34, 197, 94, 0.95), 0 6px 0 #15803d, 0 10px 16px rgba(0,0,0,0.22); transform: scale(1.02); }
            }

            @keyframes playPulse {
              0%, 100% { transform: scale(1); opacity: 0.95; }
              50% { transform: scale(1.05); opacity: 1; filter: drop-shadow(0 0 8px rgba(162, 249, 184, 0.4)); }
            }
            .change-scene-v2 .play-btn-pulse {
              animation: playPulse 2s infinite ease-in-out;
            }

            .change-scene-v2 .train-map {
              display: flex;
              align-items: center;
              justify-content: space-between;
              position: relative;
              width: 100%;
              padding: 0 4px;
              margin: 0;
              height: 62px;
              max-width: 100%;
            }
            .change-scene-v2 .train-line-bg {
              position: absolute;
              left: 13px;
              right: 13px;
              top: 50%;
              height: 4px;
              background: #1c4434;
              transform: translateY(-50%);
              z-index: 1;
            }
            .change-scene-v2 .train-line-fill {
              position: absolute;
              left: 13px;
              right: 13px;
              top: 50%;
              height: 4px;
              background: #39f275;
              transform: translateY(-50%) scaleX(var(--progress, 0));
              transform-origin: left center;
              z-index: 2;
              transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .change-scene-v2 .station {
              position: relative;
              z-index: 3;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 58px;
              cursor: pointer;
            }
            .change-scene-v2 .station-dot {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: ${(step === 0 || step === 5 || step === 6 || step === 8) ? "#581825" : "#daf1eb"};
              border: 3px solid #1c4434;
              transition: all 0.3s ease;
            }
            .change-scene-v2 .station.passed .station-dot {
              background: #39f275;
              border-color: #39f275;
              box-shadow: 0 0 10px rgba(57, 242, 117, 0.58);
            }
            .change-scene-v2 .station:first-of-type .station-dot {
              box-shadow: none;
            }
            .change-scene-v2 .station.active .station-dot {
              width: 18px;
              height: 18px;
              background: #f4c95d;
              border-color: #f4c95d;
              box-shadow: 0 0 12px #f4c95d, 0 0 24px rgba(244, 201, 93, 0.56);
              transform: none;
            }
            .change-scene-v2 .station:last-child .station-dot {
              background: #9a2940;
              border-color: #9a2940;
            }
            .change-scene-v2 .station:last-child.active .station-dot {
              background: #f4c95d;
              border-color: #f4c95d;
            }
            .change-scene-v2 .station-label {
              position: absolute;
              top: 41px;
              font-size: 8px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #7b1726;
              opacity: 1;
              white-space: nowrap;
              transition: opacity 0.3s ease;
            }
            .change-scene-v2 .station.active .station-label {
              opacity: 1;
              font-weight: 900;
            }
            .change-scene-v2 .station:disabled {
              cursor: default;
              opacity: 1;
            }
            .change-scene-v2 .progress-top {
              position: relative;
              z-index: 5;
              margin: 10px 0 12px;
            }

            .change-scene-v2 .pointing-line {
              position: absolute;
              background: #a2f9b8;
              box-shadow: 0 0 8px #a2f9b8;
              opacity: 0.8;
              pointer-events: none;
              z-index: 15;
            }

            @media (max-height: 720px) {
              .change-scene-v2 .shell {
                padding-top: 18px;
              }
              .change-scene-v2 .train-map {
                margin: 14px 0 10px;
              }
              .change-scene-v2 .start-screen-content {
                gap: 16px;
              }
            }
            @media (max-width: 390px) {
              .change-scene-v2 .suggestions-grid {
                grid-template-columns: 1fr;
              }
              .change-scene-v2 .station {
                width: 44px;
                height: 48px;
              }
              .change-scene-v2 .station-label {
                display: none;
              }
              .change-scene-v2 .pathway-flow {
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 8px;
                min-height: 0 !important;
              }
              .change-scene-v2 .pathway-rail {
                display: none;
              }
              .change-scene-v2 .pathway-column {
                width: 100%;
                padding: 0;
              }
              .change-scene-v2 .pathway-column .truncate {
                overflow: visible;
                text-overflow: clip;
                white-space: normal;
              }
              .change-scene-v2 .pathway-actions {
                flex-wrap: wrap;
              }
            }
            .change-scene-v2 .pointing-top {
              top: -24px;
              left: 50%;
              width: 2px;
              height: 18px;
              transform: translateX(-50%);
              animation: pointDown 1.2s infinite ease-in-out;
            }
            .change-scene-v2 .pointing-bottom {
              bottom: -24px;
              left: 50%;
              width: 2px;
              height: 18px;
              transform: translateX(-50%);
              animation: pointUp 1.2s infinite ease-in-out;
            }
            .change-scene-v2 .pointing-left {
              left: -28px;
              top: 50%;
              width: 18px;
              height: 2px;
              transform: translateY(-50%);
              animation: pointRight 1.2s infinite ease-in-out;
            }
            .change-scene-v2 .pointing-right {
              right: -28px;
              top: 50%;
              width: 18px;
              height: 2px;
              transform: translateY(-50%);
              animation: pointLeft 1.2s infinite ease-in-out;
            }

            @keyframes pointDown {
              0% { transform: translate(-50%, -4px); opacity: 0.2; }
              50% { transform: translate(-50%, 4px); opacity: 1; }
              100% { transform: translate(-50%, -4px); opacity: 0.2; }
            }
            @keyframes pointUp {
              0% { transform: translate(-50%, 4px); opacity: 0.2; }
              50% { transform: translate(-50%, -4px); opacity: 1; }
              100% { transform: translate(-50%, 4px); opacity: 0.2; }
            }
            @keyframes pointRight {
              0% { transform: translate(-4px, -50%); opacity: 0.2; }
              50% { transform: translate(4px, -50%); opacity: 1; }
              100% { transform: translate(-4px, -50%); opacity: 0.2; }
            }
            @keyframes pointLeft {
              0% { transform: translate(4px, -50%); opacity: 0.2; }
              50% { transform: translate(-4px, -50%); opacity: 1; }
              100% { transform: translate(4px, -50%); opacity: 0.2; }
            }

            .change-scene-v2 .meta {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              text-align: center;
              color: var(--ink);
              opacity: 0.55;
            }

            .change-scene-v2-container .different-btn {
              transform: translateY(28px) !important;
              opacity: 0.5;
              transition: all 0.3s ease;
            }
            .change-scene-v2-container .different-btn:hover {
              opacity: 0.9;
            }

            /* Custom radial backgrounds for smooth visual aura */
            .change-scene-v2-bg {
              position: absolute;
              inset: 0;
              z-index: 0;
              border-radius: inherit;
              pointer-events: none;
              background: ${step === 0 
                ? step0BgColor 
                : step === 3
                  ? "linear-gradient(180deg, #60a5fa 0%, #daf1eb 60%, #daf1eb 100%)"
                  : `radial-gradient(55% 45% at 10% 92%, rgba(${currentAccentRgb}, .18), transparent 72%),
                          radial-gradient(42% 35% at 92% 18%, rgba(255,255,255, .1), transparent 74%),
                          ${theme.paper}`};
              filter: none;
              transition: background 0.5s ease;
            }
            
            /* Custom completion background gradient override */
            .change-scene-v2-bg-s7 {
              background: radial-gradient(55% 45% at 15% 92%, rgba(90, 190, 169, .26), transparent 72%),
                          radial-gradient(50% 42% at 88% 18%, rgba(230, 163, 206, .24), transparent 72%),
                          linear-gradient(145deg, #ffdad4, #f7e8ed 40%, #e1eaf8 72%, #daf1eb) !important;
            }
          `
        }} />
      }
    >
      <div className="change-scene-v2">
        <section className="shell">
          <div className={`change-scene-v2-bg ${step === 7 ? "change-scene-v2-bg-s7" : ""}`} />
          {openingNature}
          <div className="brand">
            <div className="brand-pill">
              <span className="brand-dot"></span>
              <span>CHANGE THE SCENE</span>
            </div>
          </div>

          <div className="progress-top">{progressMap}</div>

          <div className="content">
            {/* Elegant Toast Overlay */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -15 }}
                  transition={{ type: "spring", stiffness: 220, damping: 18 }}
                  className="absolute inset-x-4 bottom-28 bg-[#1e293b]/95 backdrop-blur-md border border-[#384252] text-[#f8fafc] rounded-2xl py-3.5 px-5 flex items-center justify-center gap-3 shadow-2xl z-50 text-[12px] font-bold tracking-wide select-none"
                >
                  <span className="text-[#a2f9b8] animate-pulse">✦</span>
                  <span>{toastMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ambient Sunshine overlay representation for Step 3 */}
            {step === 3 && (
              <div 
                className="absolute top-0 right-0 w-[240px] h-[240px] rounded-full bg-yellow-300 opacity-20 pointer-events-none"
                style={{ filter: "blur(60px)", zIndex: 1 }}
              />
            )}

            <AnimatePresence mode="sync">
              <motion.div
                key={step}
                initial={prefs.reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefs.reducedMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{ duration: prefs.reducedMotion ? 0 : 0.24, ease: "easeInOut" }}
                className="flex-1 flex flex-col min-h-0 relative"
              >
                {step !== 8 ? (
                  /* Standard Step Layout */
                  <div className={`instruction-screen ${step > 0 ? "reveal-screen" : ""}`}>
                    <div className={step === 0 ? `start-screen-content opening-stage-${step0Taps}` : ""}>
                      <h1 
                          style={{ 
                            fontSize: step === 0 ? "54px" : (step === 5 ? "42px" : "46px"), 
                            color: step >= 1 && step <= 4 ? "#123a30" : step === 7 ? "#4f245f" : "var(--ink)", 
                            margin: step === 0 ? "0 0 4px" : "8px 0",
                            textAlign: "center",
                            lineHeight: "1.1",
                            position: "relative"
                          }}
                          className="scene-heading"
                        >
                          {current.title === "Change the Scene" ? (
                            <>
                              Change <span className="title-the">the</span>
                              <br />
                              Scene
                            </>
                          ) : current.title.includes("\n") ? (
                            current.title.split("\n").map((line, index) => (
                              <React.Fragment key={line}>
                                {line}
                                {index === 0 && <br />}
                              </React.Fragment>
                            ))
                          ) : (
                            current.title
                          )}
                      </h1>
                      {step === 0 && <p className="opening-meta">{current.meta}</p>}

                      <div className={step === 0 ? "relative w-full" : "instruction-popup-shell"}>
                        <div className={step === 0 ? "opening-instruction" : "prompt"}>
                        {step === 0 ? (
                          <div className="prompt-text">
                            {mappedLines.map((lineWords, lineIdx) => (
                              <div key={lineIdx} className={lineIdx > 0 ? "mt-1" : ""}>
                                  {lineWords.map((item, idx) => {
                                    const isActive = audioIsPlaying && item.end > item.start && currentAudioTime >= item.start && currentAudioTime <= item.end;
                                    return (
                                      <span
                                        key={idx}
                                        className={`word-span ${isActive ? "active" : ""} ${audioIsPlaying ? "dimmed" : ""}`}
                                      >
                                        {item.word}
                                      </span>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="task-choices">
                              <button
                                type="button"
                                className={`task-choice primary ${selectedTaskChoice[step] === "primary" ? "selected" : ""}`}
                                aria-pressed={selectedTaskChoice[step] === "primary"}
                                onClick={() => handleTaskChoice("primary")}
                              >
                                {selectedTaskChoice[step] === "primary" && (
                                  <span className="target-lock" aria-hidden="true">
                                    <svg viewBox="0 0 32 32" fill="none">
                                      <circle cx="16" cy="16" r="9.5" />
                                      <circle cx="16" cy="16" r="3.3" />
                                      <path d="M16 1.5v7M16 23.5v7M1.5 16h7M23.5 16h7" />
                                    </svg>
                                  </span>
                                )}
                                <span className="task-choice-label">Try this</span>
                                <span className="prompt-text">
                                  {mappedLines.map((lineWords, lineIdx) => (
                                    <span key={lineIdx} className={lineIdx > 0 ? "block mt-1" : "block"}>
                                      {lineWords.map((item, idx) => {
                                        const isActive = audioIsPlaying && item.end > item.start && currentAudioTime >= item.start && currentAudioTime <= item.end;
                                        return (
                                          <span
                                            key={idx}
                                            className={`word-span ${isActive ? "active" : ""} ${audioIsPlaying ? "dimmed" : ""}`}
                                          >
                                            {item.word}
                                          </span>
                                        );
                                      })}
                                    </span>
                                  ))}
                                </span>
                              </button>
                              <button
                                type="button"
                                className={`task-choice alternative ${selectedTaskChoice[step] === "alternative" ? "selected" : ""}`}
                                aria-pressed={selectedTaskChoice[step] === "alternative"}
                                onClick={() => handleTaskChoice("alternative")}
                              >
                                {selectedTaskChoice[step] === "alternative" && (
                                  <span className="target-lock" aria-hidden="true">
                                    <svg viewBox="0 0 32 32" fill="none">
                                      <circle cx="16" cy="16" r="9.5" />
                                      <circle cx="16" cy="16" r="3.3" />
                                      <path d="M16 1.5v7M16 23.5v7M1.5 16h7M23.5 16h7" />
                                    </svg>
                                  </span>
                                )}
                                <span className="task-choice-label">Or try</span>
                                <span>{ALTERNATIVE_TASKS[step]}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {suggestionsNote}
                      </div>

                      {step === 0 && (
                        <>
                          <motion.button
                            type="button"
                            whileTap={prefs.reducedMotion ? {} : { scale: 0.94 }}
                            onClick={handleNext}
                            className="start-shift-control"
                            aria-label={step0Taps < 3 ? "Tap to shift the scene" : "Begin Change the Scene"}
                          >
                            <div className="start-shift-icon flex items-center justify-center play-btn-pulse">
                              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden="true">
                                <circle cx="50" cy="50" r="44" stroke="#5ebb7a" strokeWidth="2.5" fill="none" strokeDasharray="14 11" strokeLinecap="round" />
                                <circle cx="50" cy="50" r="36" stroke="#4da86c" strokeWidth="2.2" fill="none" />
                                <circle cx="50" cy="50" r="33" stroke="#5ebb7a" strokeWidth="1.5" fill="none" />
                                <path d="M42 34 L66 50 L42 66 Z" fill="none" stroke="#f15a24" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
                                <path d="M46 41 L59 50" fill="none" stroke="#f7931e" strokeWidth="2.5" strokeLinecap="round" />
                              </svg>
                            </div>
                          </motion.button>
                          <span className="start-control-label">
                            {step0Taps === 0 ? "Tap to shift" : step0Taps === 1 ? "Tap again" : step0Taps === 2 ? "Again" : "Tap play to begin"}
                          </span>
                          <div className="start-tap-progress" aria-label={`${step0Taps} of 3 activation taps complete`}>
                            {[1, 2, 3].map((tap) => <span key={tap} className={step0Taps >= tap ? "active" : ""} />)}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Compact Interactive Area */}
                    <div className="interaction" style={step === 0 ? { display: "none" } : undefined}>
                      {step >= 1 && step <= 7 && (
                        <div className="w-full">
                          {showCustomInputStep === step ? (
                            <div className="flex flex-col gap-2 w-full px-2">
                              <input
                                className="plan-input text-center font-bold"
                                style={{
                                  background: "var(--prompt-bg)",
                                  color: "var(--ink)",
                                  border: "2px solid var(--accent)",
                                  boxShadow: "0 0 12px rgba(var(--accent-rgb), 0.4)"
                                }}
                                placeholder="Type custom shift activity..."
                                value={customText}
                                onChange={(e) => setCustomText(e.target.value)}
                                autoFocus
                              />
                              <button
                                className="suggestion-btn selected flex justify-center items-center font-bold"
                                onClick={() => {
                                  if (customText.trim()) {
                                    playSelect();
                                    setSelectedSuggestions(prev => ({ ...prev, [step]: customText.trim() }));
                                    setShowCustomInputStep(null);
                                  }
                                }}
                              >
                                Apply Answer ✓
                              </button>
                            </div>
                          ) : (
                            <div className="suggestions-grid">
                              {(SUGGESTIONS[step] || []).map((text, idx) => {
                                const isSelected = selectedSuggestions[step] === text;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`suggestion-btn ${isSelected ? "selected" : ""}`}
                                    onClick={() => {
                                      playSelect();
                                      setSelectedSuggestions(prev => ({ ...prev, [step]: text }));
                                    }}
                                  >
                                    <span className="truncate">{text}</span>
                                    <span className="circle-tick">
                                      {isSelected && "✓"}
                                    </span>
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                className={`suggestion-btn ${selectedSuggestions[step] && !(SUGGESTIONS[step] || []).includes(selectedSuggestions[step]) ? "selected" : ""}`}
                                onClick={() => {
                                  playSelect();
                                  setCustomText(selectedSuggestions[step] && !(SUGGESTIONS[step] || []).includes(selectedSuggestions[step]) ? selectedSuggestions[step] : "");
                                  setShowCustomInputStep(step);
                                }}
                              >
                                <span className="truncate">
                                  {selectedSuggestions[step] && !(SUGGESTIONS[step] || []).includes(selectedSuggestions[step]) ? selectedSuggestions[step] : "Custom..."}
                                </span>
                                <span className="circle-tick">
                                  {selectedSuggestions[step] && !(SUGGESTIONS[step] || []).includes(selectedSuggestions[step]) && "✓"}
                                </span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Achievement Card Sliding in on completion Step 7 */}
                    {step === 7 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 35, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 180, damping: 14 }}
                        className="achievement-card"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xl">🏆</span>
                          <h3 className="text-xs font-black uppercase tracking-wider text-[#a2f9b8]">
                            Scene Shift Achieved!
                          </h3>
                        </div>
                        <p className="text-[11px] leading-relaxed font-semibold text-white">
                          You just completed 6 small things incredibly quickly! 
                          <br />
                          <span className="text-[#a2f9b8] font-bold">The Lesson:</span> Pretty much any task—even the ones that seem really hard—is exactly like this when broken down into small, single steps.
                        </p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  /* Step 8 Vertical Flow Pathway selection screen */
                  <div className="completion-screen flex-1 flex flex-col justify-between items-center relative min-h-0 w-full px-2">
                    <div className="text-center pt-1">
                      <h1 className="completion-title">You changed the scene.</h1>
                      <div className="completion-seal" aria-hidden="true">✦</div>
                      <p className="completion-caption">{current.prompt}</p>
                    </div>

                    <div className="pathway-flow flex-1 w-full flex justify-between items-center relative py-1 my-1 min-h-0" style={{ minHeight: "220px" }}>
                      <div className="pathway-rail absolute left-1/2 top-0 bottom-12 w-3 bg-[#a2f9b8]/20 -translate-x-1/2 rounded-full pointer-events-none" aria-hidden="true">
                        <div 
                          className="absolute top-0 w-full bg-[#a2f9b8] rounded-full transition-all duration-700"
                          style={{ 
                            height: selectedPath ? "100%" : "0%",
                            boxShadow: "0 0 12px #a2f9b8, 0 0 20px rgba(162, 249, 184, 0.6)" 
                          }} 
                        />
                        {selectedPath === "relax" && (
                          <svg className="absolute bottom-0 right-1/2 w-24 h-16 overflow-visible pointer-events-none" viewBox="0 0 96 64">
                            <path d="M 96 0 C 96 32, 16 32, 16 64" fill="none" stroke="#a2f9b8" strokeWidth="10" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px #a2f9b8)" }} />
                          </svg>
                        )}
                        {selectedPath === "active" && (
                          <svg className="absolute bottom-0 left-1/2 w-24 h-16 overflow-visible pointer-events-none" viewBox="0 0 96 64">
                            <path d="M 0 0 C 0 32, 80 32, 80 64" fill="none" stroke="#a2f9b8" strokeWidth="10" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 10px #a2f9b8)" }} />
                          </svg>
                        )}
                      </div>

                      <div className="pathway-column w-[45%] flex flex-col items-center gap-2 z-10 pr-1">
                        <h2 className="text-[11px] font-black uppercase tracking-wider text-[#a2f9b8] text-center mb-1 drop-shadow-sm select-none">
                          ← Relax & Shift
                        </h2>
                        {["Take deep breaths", "Listen to music", "Warm cozy bath", "Cuddle a pet"].map((act, i) => {
                          const isSelected = selectedPathActivity === act;
                          return (
                            <button 
                              key={i} 
                              className={`suggestion-btn w-full justify-center text-center transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                playSelect();
                                setSelectedPath("relax");
                                setSelectedPathActivity(act);
                              }}
                              style={{ minHeight: "44px", fontSize: "11px", padding: "10px", borderRadius: "12px" }}
                            >
                              <span className="truncate">{act}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="pathway-column w-[45%] flex flex-col items-center gap-2 z-10 pl-1">
                        <h2 className="text-[11px] font-black uppercase tracking-wider text-[#ef4444] text-center mb-1 drop-shadow-sm select-none">
                          Keep Moving →
                        </h2>
                        {["Organise space", "Go for a walk", "Call a loved one", "Eat favorite meal"].map((act, i) => {
                          const isSelected = selectedPathActivity === act;
                          return (
                            <button 
                              key={i} 
                              className={`suggestion-btn w-full justify-center text-center transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                playSelect();
                                setSelectedPath("active");
                                setSelectedPathActivity(act);
                              }}
                              style={{ minHeight: "44px", fontSize: "11px", padding: "10px", borderRadius: "12px" }}
                            >
                              <span className="truncate">{act}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Pathway Text Input */}
                    <div className="pathway-custom-input w-full px-2 flex gap-2 justify-center items-center flex-shrink-0 z-20 my-1">
                      <input
                        className="plan-input text-center text-xs font-semibold focus:border-white focus:ring-2 focus:ring-white/30"
                        style={{
                          background: "var(--prompt-bg)",
                          color: "var(--ink)",
                          borderColor: "var(--accent)",
                          borderWidth: "1.5px",
                          borderRadius: "12px",
                          minHeight: "44px",
                          width: "82%",
                          transition: "all 0.3s ease"
                        }}
                        placeholder="Or type custom shift activity..."
                        value={pathwayCustomText}
                        onChange={(e) => {
                          setPathwayCustomText(e.target.value);
                          setSelectedPathActivity(e.target.value);
                        }}
                      />
                    </div>

                    {/* Directing buttons for stronger LIFT activities */}
                    <div className="pathway-actions flex justify-center gap-2.5 w-full flex-shrink-0 z-20 my-1">
                      <button 
                        className="text-[10px] font-extrabold uppercase tracking-wide border border-white/20 bg-black/40 rounded-full px-4 py-1.5 text-white hover:bg-white/10 active:scale-[0.96] transition-all"
                        onClick={() => {
                          playDopamineClick();
                          setToastMessage("Launching Happy Bump experience... ✦");
                        }}
                      >
                        ✦ Happy Bump
                      </button>
                      <button 
                        className="text-[10px] font-extrabold uppercase tracking-wide border border-white/20 bg-black/40 rounded-full px-4 py-1.5 text-white hover:bg-white/10 active:scale-[0.96] transition-all opacity-60"
                        onClick={() => {
                          playDopamineClick();
                          setToastMessage("What If I Could (Coming Soon!) ✦");
                        }}
                      >
                        ✦ What If I Could
                      </button>
                      <button 
                        className="text-[10px] font-extrabold uppercase tracking-wide border border-white/20 bg-black/40 rounded-full px-4 py-1.5 text-white hover:bg-white/10 active:scale-[0.96] transition-all"
                        onClick={() => {
                          playDopamineClick();
                          setToastMessage("Launching Dear 2100 Experience... ✦");
                        }}
                      >
                        ✦ Dear 2100
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className={`footer ${step === 0 ? "footer--start" : ""}`}>
            {/* Tactile Circular 3D Action Button */}
            {step !== 0 && (
              <div className="flex justify-center flex-shrink-0 relative">
              <motion.button
                whileTap={prefs.reducedMotion ? {} : { scale: 0.94 }}
                onClick={handleActionPress}
                className={`circular-push-btn ${actionConfirmed ? "confirmed" : ""}`}
                aria-label={current.cta}
              >
                <span className="action-status" aria-hidden="true">{actionConfirmed ? "✓" : ""}</span>
                <span className="text-xs font-extrabold uppercase tracking-wider text-center select-none leading-tight z-10 px-1">
                  {current.cta}
                </span>
              </motion.button>
              </div>
            )}

            {step !== 0 && <div className="meta">{current.meta}</div>}
          </footer>
        </section>
      </div>
    </InterventionControlShell>
  );
}