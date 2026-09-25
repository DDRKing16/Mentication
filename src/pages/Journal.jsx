import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Moon, 
  Footprints, 
  Users, 
  Briefcase, 
  Utensils, 
  Sun, 
  Check, 
  Plus, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  Trash2,
  Info,
  Mic,
  Calendar,
  Sparkle
} from "lucide-react";

// --- UPGRADED EMOTIONS MAP (Matches the exact 16 words from the Mood Meter image) ---
const EMOTIONS = [
  // TL - ANXIOUS (x: 0..0.5, y: 0..0.5)
  { name: "Anxious", x: 0.125, y: 0.125, quadrant: "ANXIOUS", emoji: "😰" },
  { name: "Stressed", x: 0.375, y: 0.125, quadrant: "ANXIOUS", emoji: "😰" },
  { name: "Frustrated", x: 0.125, y: 0.375, quadrant: "ANXIOUS", emoji: "😰" },
  { name: "Overwhelmed", x: 0.375, y: 0.375, quadrant: "ANXIOUS", emoji: "😰" },

  // TR - ENERGIZED (x: 0.5..1, y: 0..0.5)
  { name: "Energized", x: 0.625, y: 0.125, quadrant: "ENERGIZED", emoji: "✨" },
  { name: "Excited", x: 0.875, y: 0.125, quadrant: "ENERGIZED", emoji: "✨" },
  { name: "Joyful", x: 0.625, y: 0.375, quadrant: "ENERGIZED", emoji: "✨" },
  { name: "Inspired", x: 0.875, y: 0.375, quadrant: "ENERGIZED", emoji: "✨" },

  // BL - DRAINED (x: 0..0.5, y: 0.5..1)
  { name: "Drained", x: 0.125, y: 0.625, quadrant: "DRAINED", emoji: "🌫️" },
  { name: "Low", x: 0.375, y: 0.625, quadrant: "DRAINED", emoji: "🌫️" },
  { name: "Lonely", x: 0.125, y: 0.875, quadrant: "DRAINED", emoji: "🌫️" },
  { name: "Stuck", x: 0.375, y: 0.875, quadrant: "DRAINED", emoji: "🌫️" },

  // BR - CALM (x: 0.5..1, y: 0.5..1)
  { name: "Calm", x: 0.625, y: 0.625, quadrant: "CALM", emoji: "🍃" },
  { name: "Peaceful", x: 0.875, y: 0.625, quadrant: "CALM", emoji: "🍃" },
  { name: "Content", x: 0.625, y: 0.875, quadrant: "CALM", emoji: "🍃" },
  { name: "Soft", x: 0.875, y: 0.875, quadrant: "CALM", emoji: "🍃" }
];

const VOICE_TRANSCRIPTS = [
  "The morning light hit the kitchen table just right, and for a second, everything felt perfectly still.",
  "Shared a quiet laugh with a close friend today. It reminded me of how connected we all really are.",
  "Walked under the trees and listened to the wind. Simple moments like this are what keep me grounded.",
  "Finally finished that task I've been dreading for days. The relief is like a breath of fresh air.",
  "Cooked a warm nourishing meal tonight and actually sat down to enjoy it. No screen, just peaceful silence."
];

// Helper to calculate closest 3 emotions
const getMoodSummary = (x, y) => {
  const sorted = [...EMOTIONS].map(e => {
    const dist = Math.sqrt(Math.pow(x - e.x, 2) + Math.pow(y - e.y, 2));
    return { ...e, dist };
  }).sort((a, b) => a.dist - b.dist);

  const closest = sorted.slice(0, 3);
  let primaryQuad = "Calm";
  let emoji = "🍃";

  if (x < 0.5 && y < 0.5) {
    primaryQuad = "Anxious";
    emoji = "😰";
  } else if (x >= 0.5 && y < 0.5) {
    primaryQuad = "Energized";
    emoji = "✨";
  } else if (x < 0.5 && y >= 0.5) {
    primaryQuad = "Drained";
    emoji = "🌫️";
  } else {
    primaryQuad = "Calm";
    emoji = "🍃";
  }

  const formattedEmotions = `${closest[0].name.toLowerCase()} + ${closest[1].name.toLowerCase()} with a touch of ${closest[2].name.toLowerCase()}`;
  return {
    primary: primaryQuad,
    emoji,
    secondary: closest.map(c => c.name),
    summary: `Mostly ${primaryQuad.toLowerCase()} — ${formattedEmotions}`
  };
};

const getMoodChartPath = (m, isFill) => {
  let path = "M 8 28 C 60 28, 120 28, 180 28, 264 28";
  const { x, y } = m;
  if (x < 0.5 && y < 0.5) {
    // Anxious
    path = "M 8 36 C 60 8, 120 44, 180 12, 264 34";
  } else if (x >= 0.5 && y < 0.5) {
    // Energized
    path = "M 8 38 C 60 14, 120 8, 180 16, 264 22";
  } else if (x < 0.5 && y >= 0.5) {
    // Drained
    path = "M 8 22 C 60 38, 120 48, 180 44, 264 38";
  } else {
    // Calm
    path = "M 8 38 C 60 32, 120 22, 180 18, 264 14";
  }
  
  if (isFill) {
    return `${path} L 264 50 L 8 50 Z`;
  }
  return path;
};

const getMoodChartEndDotY = (m) => {
  const { x, y } = m;
  if (x < 0.5 && y < 0.5) return 34;
  if (x >= 0.5 && y < 0.5) return 22;
  if (x < 0.5 && y >= 0.5) return 38;
  return 14;
};

const getMoodDescriptionParagraph = (entry) => {
  const { x, y } = entry.mood;
  if (x < 0.5 && y < 0.5) {
    return "An active current of tension. Focus on steady breaths and soft, intentional pacing.";
  } else if (x >= 0.5 && y < 0.5) {
    return "Highly energized and alive. Productive ideas and vibrant feelings are taking flight.";
  } else if (x < 0.5 && y >= 0.5) {
    return "A quiet lull in energy. Giving yourself full permission to move slow and restore.";
  } else {
    return "Grounded, serene, and soft. Appreciating a deep, calming and comfortable ease.";
  }
};

const getHighlightsAndChallenges = (entry) => {
  const highlights = [];
  const challenges = [];
  
  // 1. Sleep Quality
  if (entry.sleep.hours >= 7.5 && entry.sleep.quality.includes("Deep")) {
    highlights.push("Deep, restorative sleep session");
  } else if (entry.sleep.hours < 6.0) {
    challenges.push("Under 6 hours of sleep recorded");
  } else if (entry.sleep.quality.includes("Rough night")) {
    challenges.push("Restless sleep or rough night");
  }
  
  // 2. Felt Good tags
  if (entry.feltGoodTags && entry.feltGoodTags.length > 0) {
    entry.feltGoodTags.forEach((tag) => {
      highlights.push(tag);
    });
  }
  
  // 3. Work Feeling
  if (entry.workFeel && (entry.workFeel.includes("Dialed in") || entry.workFeel.includes("In Flow"))) {
    highlights.push("Flow state or focused session");
  } else if (entry.workFeel && entry.workFeel.includes("Draining")) {
    challenges.push("Draining work energy early");
  }
  
  if (entry.workWhat && entry.workWhat.includes("Felt stuck")) {
    challenges.push("Moment of feeling stuck / blocked");
  } else if (entry.workWhat && entry.workWhat.includes("Achieved something")) {
    highlights.push("Achieved a personal win");
  }
  
  // 4. Fuel / Food
  if (entry.fuel && entry.fuel.includes("Really well / cooked with care")) {
    highlights.push("Nourishing meal cooked with care");
  } else if (entry.fuel && entry.fuel.includes("Rushed / skipped")) {
    challenges.push("Rushed or skipped fueling");
  }
  
  // 5. Play / Recreation
  if (entry.play && entry.play.length > 0 && !entry.play.includes("No real play")) {
    const playActivity = entry.play[0];
    highlights.push(`Recreation: ${playActivity}`);
  }
  
  // Fallback defaults so there's always beautifully balanced lists
  if (highlights.length === 0) {
    highlights.push("Found space for quiet observation");
    highlights.push("Preserved standard daily rhythms");
  }
  if (challenges.length === 0) {
    challenges.push("Mild creative friction");
    challenges.push("Mindful boundary setting");
  }
  
  return {
    highlights: highlights.slice(0, 3),
    challenges: challenges.slice(0, 3)
  };
};

export default function Journal() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = Home/Dashboard, 1-5 = Flow steps
  const [daybook, setDaybook] = useState([]);
  const [selectedPastEntry, setSelectedPastEntry] = useState(null);

  // Sophisticated micro-audio feedback using Web Audio API (zero external assets, 100% reliable)
  const playSound = (type) => {
    if (typeof window === 'undefined') return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'tap') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'toggle') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now);
        gain1.gain.setValueAtTime(0.04, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.start(now);
        osc1.stop(now + 0.5);
        
        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(830.61, ctx.currentTime);
            gain2.gain.setValueAtTime(0.04, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.5);
          } catch { /* audio unsupported */ }
        }, 80);
      } else if (type === 'delete') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.18);
      }
    } catch (e) {
      console.warn("Audio Context blocked or unsupported", e);
    }
  };

  // Active Flow State
  const [mood, setMood] = useState({ x: 0.5, y: 0.5 });
  const [dayTags, setDayTags] = useState([]);
  const [sleep, setSleep] = useState({ hours: 7.5, quality: [], custom: "" });
  const [move, setMove] = useState([]);
  const [people, setPeople] = useState([]);
  const [workFeel, setWorkFeel] = useState([]);
  const [workWhat, setWorkWhat] = useState([]);
  const [fuel, setFuel] = useState([]);
  const [play, setPlay] = useState([]);
  const [anchor, setAnchor] = useState("");
  const [feltGoodTags, setFeltGoodTags] = useState([]);
  const [customFeltGoodInput, setCustomFeltGoodInput] = useState("");
  const [isBlueprint, setIsBlueprint] = useState(false);

  // Custom User Answers text states
  const [customMoodInput, setCustomMoodInput] = useState("");
  const [customSleepInput, setCustomSleepInput] = useState("");
  const [customDayInput, setCustomDayInput] = useState("");
  const [customMoveInput, setCustomMoveInput] = useState("");
  const [customPeopleInput, setCustomPeopleInput] = useState("");
  const [customWorkInput, setCustomWorkInput] = useState("");
  const [customFuelInput, setCustomFuelInput] = useState("");
  const [customPlayInput, setCustomPlayInput] = useState("");

  // UI States
  const [activeRootCard, setActiveRootCard] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(15);
  const [toast, setToast] = useState(null);
  const [showComfortModal, setShowComfortModal] = useState(false);

  // Speech Recognition states
  const [isRealSpeech, setIsRealSpeech] = useState(false);
  const recognitionRef = useRef(null);

  // Audio recording timers
  const recordInterval = useRef(null);
  const recordTimeout = useRef(null);

  // Load daybook from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("daybook");
    if (stored) {
      try {
        setDaybook(JSON.parse(stored));
      } catch {
        console.error("Failed to parse daybook from storage");
      }
    }
  }, []);

  // Toast helper
  const triggerToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Start new entry flow
  const startNewEntry = () => {
    playSound('success');
    setMood({ x: 0.5, y: 0.5 });
    setDayTags([]);
    setSleep({ hours: 7.5, quality: [], custom: "" });
    setMove([]);
    setPeople([]);
    setWorkFeel([]);
    setWorkWhat([]);
    setFuel([]);
    setPlay([]);
    setAnchor("");
    setFeltGoodTags([]);
    setCustomFeltGoodInput("");
    setIsBlueprint(false);
    setSelectedPastEntry(null);

    // Reset Custom Inputs
    setCustomMoodInput("");
    setCustomSleepInput("");
    setCustomDayInput("");
    setCustomMoveInput("");
    setCustomPeopleInput("");
    setCustomWorkInput("");
    setCustomFuelInput("");
    setCustomPlayInput("");

    setStep(1);
  };

  // Save active entry
  const saveEntry = () => {
    playSound('success');
    const moodInfo = getMoodSummary(mood.x, mood.y);
    const now = new Date();
    
    const newEntry = {
      id: Math.random().toString(36).substring(2, 9),
      mood: {
        x: mood.x,
        y: mood.y,
        primary: moodInfo.primary,
        secondary: moodInfo.secondary
      },
      dayTags,
      sleep,
      move,
      people,
      workFeel,
      workWhat,
      fuel,
      play,
      anchor,
      feltGoodTags,
      customFeltGoodInput,
      isBlueprint,
      date: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      
      // Custom notes
      customMoodNote: customMoodInput,
      customSleepNote: customSleepInput,
      customMoveNote: customMoveInput,
      customPeopleNote: customPeopleInput,
      customWorkNote: customWorkInput,
      customFuelNote: customFuelInput,
      customPlayNote: customPlayInput
    };

    const updatedDaybook = [newEntry, ...daybook];
    setDaybook(updatedDaybook);
    localStorage.setItem("daybook", JSON.stringify(updatedDaybook));
    triggerToast("Entry saved to Mentication Archive");
    setStep(0); // return to dashboard
  };

  // Delete past entry
  const deleteEntry = (id, e) => {
    e.stopPropagation();
    playSound('delete');
    const updated = daybook.filter(item => item.id !== id);
    setDaybook(updated);
    localStorage.setItem("daybook", JSON.stringify(updated));
    triggerToast("Entry deleted");
    if (selectedPastEntry?.id === id) {
      setSelectedPastEntry(null);
      setStep(0);
    }
  };

  // Navigation handlers
  const handleNext = () => {
    playSound('success');
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    playSound('tap');
    if (step > 1) {
      setStep(step - 1);
    } else {
      setStep(0);
    }
  };

  const handleSkip = () => {
    playSound('tap');
    handleNext();
  };

  // Speech Recognition / Voice Recording triggers
  const startRecording = (e) => {
    e.preventDefault();
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsRealSpeech(true);
      setIsRecording(true);
      setRecordingTime(15);

      try {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
          const speechToText = event.results[event.results.length - 1][0].transcript;
          setAnchor(prev => prev ? `${prev} ${speechToText}` : speechToText);
        };

        rec.onerror = (err) => {
          console.warn("Speech API Error, falling back:", err);
          startFakeRecording();
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = rec;
        rec.start();

        // 15 seconds timer
        recordInterval.current = setInterval(() => {
          setRecordingTime(prev => {
            if (prev <= 1) {
              stopRecording();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        recordTimeout.current = setTimeout(() => {
          stopRecording();
        }, 15000);

      } catch (err) {
        console.warn("Could not start SpeechRecognition:", err);
        startFakeRecording();
      }
    } else {
      startFakeRecording();
    }
  };

  const stopRecording = () => {
    if (recordInterval.current) clearInterval(recordInterval.current);
    if (recordTimeout.current) clearTimeout(recordTimeout.current);

    if (isRealSpeech && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRealSpeech(false);
      setIsRecording(false);
      triggerToast("Voice transcribed beautifully");
    } else {
      stopFakeRecording();
    }
  };

  const startFakeRecording = () => {
    setIsRealSpeech(false);
    setIsRecording(true);
    setRecordingTime(15);
    
    recordInterval.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev <= 1) {
          stopFakeRecording();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    recordTimeout.current = setTimeout(() => {
      stopFakeRecording();
    }, 15000);
  };

  const stopFakeRecording = () => {
    if (recordInterval.current) clearInterval(recordInterval.current);
    if (recordTimeout.current) clearTimeout(recordTimeout.current);
    
    if (isRecording) {
      setIsRecording(false);
      // Append random poetic transcript
      const transcript = VOICE_TRANSCRIPTS[Math.floor(Math.random() * VOICE_TRANSCRIPTS.length)];
      setAnchor(prev => prev ? `${prev}\n${transcript}` : transcript);
      triggerToast("Voice transcribed beautifully");
    }
  };

  const currentMoodInfo = getMoodSummary(mood.x, mood.y);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F7F2E8] grain-bg text-[#38221E] font-sans antialiased selection:bg-[#4A7685]/10 selection:text-[#38221E]">
      
      {/* Centered Premium Phone Frame Wrapper */}
      <div className="w-full max-w-[420px] bg-[#F7F2E8] rounded-[48px] shadow-[0_24px_64px_rgba(56,34,30,0.14)] overflow-hidden relative border-[10px] border-[#38221E]/15 h-[864px] flex flex-col">
        
        {/* iOS style top status bar */}
        <div className="px-8 pt-4 pb-2 flex justify-between items-center text-[11px] font-semibold tracking-wider opacity-85 z-20">
          <div>9:41</div>
          <div className="flex items-center gap-1.5">
            {/* Cellular */}
            <svg className="w-4 h-3" viewBox="0 0 24 24" fill="currentColor">
              <rect x="1" y="16" width="3" height="5" rx="0.5" />
              <rect x="6" y="12" width="3" height="9" rx="0.5" />
              <rect x="11" y="8" width="3" height="13" rx="0.5" />
              <rect x="16" y="4" width="3" height="17" rx="0.5" />
            </svg>
            {/* Wifi */}
            <svg className="w-4.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M12 20h.01M8.5 16.5a5 5 0 017 0M5 13a10 10 0 0114 0M1.5 9.5a15 15 0 0121 0" />
            </svg>
            {/* Battery */}
            <svg className="w-5.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <rect x="2" y="5" width="16" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
              <rect x="4" y="7" width="10" height="6" rx="0.5" />
              <path d="M19 9h1v2h-1z" />
            </svg>
          </div>
        </div>

        {/* Header navigation bar */}
        <div className="px-6 pt-1 pb-0.5 flex justify-between items-center z-20">
          {step === 0 ? (
            <button 
              onClick={() => navigate("/")}
              className="text-[13px] font-semibold tracking-tight py-2 px-3 hover:opacity-70 transition-all flex items-center gap-1 focus:outline-none min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
              Home
            </button>
          ) : (
            <button 
              onClick={handleBack}
              className="text-[13px] font-semibold tracking-tight py-2 px-3 hover:opacity-70 transition-all flex items-center gap-1 focus:outline-none min-h-[44px]"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
              {step === 5 && selectedPastEntry ? "Archive" : "Back"}
            </button>
          )}

          {/* Stepper progress dots */}
          {step > 0 && !selectedPastEntry && (
            <div className="flex justify-center gap-1.5 py-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <div
                  key={d}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    d === step 
                      ? "bg-[#4A7685] w-4" 
                      : d < step 
                        ? "bg-[#4A7685]/50 w-1.5" 
                        : "bg-[#38221E]/15 w-1.5"
                  }`}
                />
              ))}
            </div>
          )}

          {step > 0 && step < 5 && !selectedPastEntry ? (
            <button 
              onClick={handleSkip}
              className="text-[13px] font-semibold tracking-tight py-2 px-3 hover:opacity-70 transition-all flex items-center gap-1 focus:outline-none min-h-[44px]"
            >
              Skip
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
          ) : (
            <div className="w-12"></div>
          )}
        </div>

        {/* Scrollable Main Content Container */}
        <div className="flex-1 overflow-y-auto px-6 pt-0 pb-4 flex flex-col justify-between scroll-smooth relative">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 0: HOME / DASHBOARD */}
            {step === 0 && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Brand Header with Mentication Logo Aesthetics */}
                  <div className="mt-8 mb-10 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-[20px] bg-white border border-[#E5DCD0] flex items-center justify-center shadow-soft mb-3 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#4A7685]/10 to-transparent" />
                      <Sparkles className="w-6 h-6 text-[#38221E]" strokeWidth={1.5} />
                    </div>
                    <h1 className="font-serif text-[42px] leading-none tracking-wider uppercase mb-1 font-bold">
                      ENTRY
                    </h1>
                    <p className="text-[10px] tracking-[0.25em] font-semibold uppercase opacity-65">
                      Mentication Daily Journal
                    </p>
                  </div>

                  {/* Dynamic History List */}
                  <div className="space-y-6">
                    <h2 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#38221E]/60 border-b border-[#38221E]/10 pb-2 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Your Journal Archive
                    </h2>

                    {daybook.length === 0 ? (
                      <div className="bg-[#FFFFFF] border border-[#E5DCD0] rounded-[24px] p-6 text-center shadow-soft">
                        <p className="font-serif italic text-[16px] mb-4 text-[#38221E]/85 leading-relaxed">
                          "Each day is an unfolding room. Walk inside with steady eyes."
                        </p>
                        <p className="text-[12px] opacity-60">
                          Your custom daily vectors, speech transcriptions, and physiological blueprints will collect securely here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {daybook.map((item) => {
                          const weather = getMoodSummary(item.mood.x, item.mood.y);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedPastEntry(item);
                                setStep(5);
                              }}
                              className="bg-[#FFFFFF] border border-[#E5DCD0] rounded-[20px] p-4 shadow-soft hover:border-[#4A7685]/30 transition-all cursor-pointer flex justify-between items-center group min-h-[72px]"
                            >
                              <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[12px] font-semibold tracking-wide">
                                    {item.date.split(",")[0]}
                                  </span>
                                  <span className="text-[10px] opacity-30">•</span>
                                  <span className="text-[11px] font-semibold tracking-[0.1em] text-[#4A7685] uppercase">
                                    {item.mood.primary}
                                  </span>
                                </div>
                                <p className="font-serif italic text-[13px] text-[#38221E]/80 truncate">
                                  {item.anchor || "Untitled reflection."}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[16px]">{weather.emoji}</span>
                                <button
                                  onClick={(e) => deleteEntry(item.id, e)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-[#A34C3F] hover:bg-[#A34C3F]/10 rounded-full transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Write Button */}
                <div className="mt-8 mb-4">
                  <button
                    onClick={startNewEntry}
                    className="w-full h-[52px] bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-semibold tracking-wide shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] min-h-[46px]"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Write Today's Entry
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: UPGRADED MOOD METER */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Step label & Heading */}
                  <div className="mb-2.5">
                    <span className="text-[10px] font-semibold tracking-[0.15em] text-[#4A7685] uppercase">
                      01 / MAP
                    </span>
                    <h2 className="font-serif text-[24px] font-semibold mt-0.5 tracking-tight">
                      How is your inner climate in this moment?
                    </h2>
                  </div>

                  {/* HIGH-FIDELITY MOOD METER BOX */}
                  <div className="flex flex-col items-center mb-2.5">
                    
                    {/* Tracked title */}
                    <div className="text-[11px] font-semibold tracking-[0.3em] uppercase opacity-70 mb-2">
                      M O O D   M E T E R
                    </div>

                    <div className="flex items-stretch relative">
                      
                      {/* Left vertical Y-axis label */}
                      <div className="absolute -left-5 top-1/2 -translate-y-1/2 -rotate-90 origin-center text-[8px] font-bold uppercase tracking-widest text-[#38221E]/50 whitespace-nowrap flex items-center gap-1 pointer-events-none">
                        Low Energy ➜ High Energy
                      </div>

                      {/* 280x280 main box */}
                      <div 
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                          const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
                          playSound('tap');
                          setMood({ x, y });
                        }}
                        className="w-full max-w-[280px] aspect-square rounded-[32px] overflow-hidden border border-[#E5DCD0] relative shadow-soft cursor-crosshair select-none bg-white p-1"
                      >
                        <div className="grid grid-cols-2 grid-rows-2 h-full w-full rounded-[28px] overflow-hidden">
                          
                          {/* Quadrant TL - ANXIOUS */}
                          <div className="bg-[#FBF0EB] grid grid-cols-2 grid-rows-2 h-full w-full p-2 gap-1.5 border-r border-b border-[#38221E]/5">
                            {[
                              { name: "Anxious", x: 0.125, y: 0.125 },
                              { name: "Stressed", x: 0.375, y: 0.125 },
                              { name: "Frustrated", x: 0.125, y: 0.375 },
                              { name: "Overwhelmed", x: 0.375, y: 0.375 }
                            ].map(emo => {
                              const isSelected = currentMoodInfo.primary === "Anxious" && Math.abs(mood.x - emo.x) < 0.05 && Math.abs(mood.y - emo.y) < 0.05;
                              return (
                                <button
                                  key={emo.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound('tap');
                                    setMood({ x: emo.x, y: emo.y });
                                  }}
                                  className={`flex items-center justify-center p-1 rounded-xl text-[10px] font-bold tracking-tight text-center transition-all ${
                                    isSelected
                                      ? "bg-[#38221E] text-white shadow-sm scale-105"
                                      : "bg-white/60 hover:bg-white/85 text-[#38221E]/85 hover:scale-[1.02]"
                                  } min-h-[44px]`}
                                >
                                  {emo.name}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quadrant TR - ENERGIZED */}
                          <div className="bg-[#FAF3DB] grid grid-cols-2 grid-rows-2 h-full w-full p-2 gap-1.5 border-b border-[#38221E]/5">
                            {[
                              { name: "Energized", x: 0.625, y: 0.125 },
                              { name: "Excited", x: 0.875, y: 0.125 },
                              { name: "Joyful", x: 0.625, y: 0.375 },
                              { name: "Inspired", x: 0.875, y: 0.375 }
                            ].map(emo => {
                              const isSelected = currentMoodInfo.primary === "Energized" && Math.abs(mood.x - emo.x) < 0.05 && Math.abs(mood.y - emo.y) < 0.05;
                              return (
                                <button
                                  key={emo.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound('tap');
                                    setMood({ x: emo.x, y: emo.y });
                                  }}
                                  className={`flex items-center justify-center p-1 rounded-xl text-[10px] font-bold tracking-tight text-center transition-all ${
                                    isSelected
                                      ? "bg-[#38221E] text-white shadow-sm scale-105"
                                      : "bg-white/60 hover:bg-white/85 text-[#38221E]/85 hover:scale-[1.02]"
                                  } min-h-[44px]`}
                                >
                                  {emo.name}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quadrant BL - DRAINED */}
                          <div className="bg-[#EAF1F4] grid grid-cols-2 grid-rows-2 h-full w-full p-2 gap-1.5 border-r border-[#38221E]/5">
                            {[
                              { name: "Drained", x: 0.125, y: 0.625 },
                              { name: "Low", x: 0.375, y: 0.625 },
                              { name: "Lonely", x: 0.125, y: 0.875 },
                              { name: "Stuck", x: 0.375, y: 0.875 }
                            ].map(emo => {
                              const isSelected = currentMoodInfo.primary === "Drained" && Math.abs(mood.x - emo.x) < 0.05 && Math.abs(mood.y - emo.y) < 0.05;
                              return (
                                <button
                                  key={emo.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound('tap');
                                    setMood({ x: emo.x, y: emo.y });
                                  }}
                                  className={`flex items-center justify-center p-1 rounded-xl text-[10px] font-bold tracking-tight text-center transition-all ${
                                    isSelected
                                      ? "bg-[#38221E] text-white shadow-sm scale-105"
                                      : "bg-white/60 hover:bg-white/85 text-[#38221E]/85 hover:scale-[1.02]"
                                  } min-h-[44px]`}
                                >
                                  {emo.name}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quadrant BR - CALM */}
                          <div className="bg-[#E9F2F0] grid grid-cols-2 grid-rows-2 h-full w-full p-2 gap-1.5">
                            {[
                              { name: "Calm", x: 0.625, y: 0.625 },
                              { name: "Peaceful", x: 0.875, y: 0.625 },
                              { name: "Content", x: 0.625, y: 0.875 },
                              { name: "Soft", x: 0.875, y: 0.875 }
                            ].map(emo => {
                              const isSelected = currentMoodInfo.primary === "Calm" && Math.abs(mood.x - emo.x) < 0.05 && Math.abs(mood.y - emo.y) < 0.05;
                              return (
                                <button
                                  key={emo.name}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playSound('tap');
                                    setMood({ x: emo.x, y: emo.y });
                                  }}
                                  className={`flex items-center justify-center p-1 rounded-xl text-[10px] font-bold tracking-tight text-center transition-all ${
                                    isSelected
                                      ? "bg-[#38221E] text-white shadow-sm scale-105"
                                      : "bg-white/60 hover:bg-white/85 text-[#38221E]/85 hover:scale-[1.02]"
                                  } min-h-[44px]`}
                                >
                                  {emo.name}
                                </button>
                              );
                            })}
                          </div>

                        </div>

                        {/* Centered Axis Face Icon */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#F7F2E8] border border-[#E5DCD0] flex items-center justify-center shadow-md select-none text-[12px] pointer-events-none">
                          🙂
                        </div>

                        {/* Tap dot pointer */}
                        <motion.div
                          animate={{ left: `${mood.x * 100}%`, top: `${mood.y * 100}%` }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          className="absolute w-8 h-8 bg-[#FFFFFF] rounded-full shadow-[0_6px_20px_rgba(56,34,30,0.25)] border border-[#38221E]/25 flex items-center justify-center z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                        >
                          <span className="text-[15px]">{currentMoodInfo.emoji}</span>
                        </motion.div>

                      </div>
                    </div>

                    {/* Bottom horizontal X-axis label */}
                    <div className="text-[8px] font-bold uppercase tracking-widest text-[#38221E]/50 mt-1.5 pointer-events-none">
                      Unpleasant ➜ Pleasant
                    </div>
                  </div>

                  {/* Summary Card with Custom Textbox for MAP */}
                  <div className="bg-[#FFFFFF] border border-[#E5DCD0] rounded-[20px] p-3.5 shadow-soft">
                    <p className="text-[9px] uppercase font-semibold tracking-wider text-[#4A7685] mb-0.5">
                      Current Vector
                    </p>
                    <p className="font-serif italic text-[15px] text-[#38221E] leading-snug mb-2.5">
                      "{currentMoodInfo.summary}"
                    </p>
                    
                    {/* Interactive micro text field inside card */}
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Add secondary shades or thoughts..."
                        value={customMoodInput}
                        onChange={(e) => setCustomMoodInput(e.target.value)}
                        className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                      />
                    </div>
                  </div>
                </div>

                {/* Continue button */}
                <div className="mt-4 mb-2">
                  <button
                    onClick={handleNext}
                    className="w-full h-[52px] bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-semibold tracking-wide transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] min-h-[46px]"
                  >
                    Confirm Inner Climate
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DAY TAGS + TEXTBOX */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2.5">
                    <span className="text-[10px] font-semibold tracking-[0.15em] text-[#4A7685] uppercase">
                      02 / DAY
                    </span>
                    <h2 className="font-serif text-[24px] font-semibold mt-0.5 tracking-tight leading-tight">
                      What actually got your time today?
                    </h2>
                  </div>

                  {/* Multi-select Grid */}
                  <div className="flex flex-wrap gap-1.5 max-h-[220px] overflow-y-auto pr-1 mb-3">
                    {[
                      "Work", "People", "Family", "Body / Move", "Outdoors", 
                      "Creating", "Learning", "Rest", "Chores", "Cooking", 
                      "Travel", "Music", "Scrolling", "Gaming", "Reading", "Nothing much"
                    ].map((tag) => {
                      const isSelected = dayTags.includes(tag);
                      return (
                        <motion.button
                          key={tag}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            playSound('toggle');
                            if (isSelected) {
                              setDayTags(dayTags.filter(t => t !== tag));
                            } else {
                              setDayTags([...dayTags, tag]);
                            }
                          }}
                          className={`h-11 px-4 rounded-full border text-[12px] font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 focus:outline-none min-h-[44px] ${
                            isSelected 
                              ? "bg-[#4A7685] border-[#4A7685] text-white shadow-md shadow-[#4A7685]/15" 
                              : "bg-white border-[#E5DCD0] text-[#38221E] hover:border-[#4A7685]/30"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          {tag}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* TEXTBOX FOR USER CUSTOM ANSWER */}
                  <div className="bg-white border border-[#E5DCD0] rounded-[20px] p-3.5 shadow-soft">
                    <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-2">
                      Or type a custom activity...
                    </label>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customDayInput.trim()) {
                          playSound('toggle');
                          const tag = customDayInput.trim();
                          if (!dayTags.includes(tag)) {
                            setDayTags([...dayTags, tag]);
                          }
                          setCustomDayInput("");
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input 
                        type="text"
                        placeholder="e.g., Deep meditation, Gardening..."
                        value={customDayInput}
                        onChange={(e) => setCustomDayInput(e.target.value)}
                        className="flex-1 h-11 px-4 bg-[#F7F2E8]/40 border border-[#E5DCD0] rounded-full text-[13px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                      />
                      <button 
                        type="submit"
                        aria-label="Add custom activity"
                        className="h-11 w-11 rounded-full bg-[#4A7685] text-white flex items-center justify-center hover:bg-[#4A7685]/90 transition-all min-h-[44px]"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </button>
                    </form>
                  </div>

                </div>

                {/* Continue button */}
                <div className="mt-4 mb-2">
                  <button
                    onClick={handleNext}
                    className="w-full h-[52px] bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-semibold tracking-wide transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] min-h-[46px]"
                  >
                    Continue to Roots
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: ROOTS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="relative">
                  <div className="mb-2.5">
                    <span className="text-[10px] font-semibold tracking-[0.15em] text-[#4A7685] uppercase">
                      03 / ROOTS
                    </span>
                    <h2 className="font-serif text-[24px] font-semibold mt-0.5 tracking-tight leading-tight">
                      Quick check — tap all that apply
                    </h2>
                  </div>

                  {/* 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-2.5">
                    {/* Sleep */}
                    <div 
                      onClick={() => { playSound('tap'); setActiveRootCard("sleep"); }}
                      className={`bg-white border p-3 rounded-[20px] shadow-soft cursor-pointer transition-all hover:border-[#4A7685]/40 flex flex-col justify-between h-[88px] min-h-[44px] ${
                        activeRootCard === "sleep" ? "ring-2 ring-[#4A7685]" : "border-[#E5DCD0]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Moon className="w-4 h-4 text-[#4A7685]" strokeWidth={1.5} />
                        {(sleep.hours > 0 || sleep.quality.length > 0) && <div className="w-1.5 h-1.5 rounded-full bg-[#4A7685]" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold tracking-[0.15em] text-[#38221E]/60 uppercase block">Sleep</span>
                        <span className="font-serif text-[13px] truncate block leading-tight mt-0.5">
                          {sleep.hours}h {sleep.quality.join(", ") ? `• ${sleep.quality[0]}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Move */}
                    <div 
                      onClick={() => { playSound('tap'); setActiveRootCard("move"); }}
                      className={`bg-white border p-3 rounded-[20px] shadow-soft cursor-pointer transition-all hover:border-[#4A7685]/40 flex flex-col justify-between h-[88px] min-h-[44px] ${
                        activeRootCard === "move" ? "ring-2 ring-[#4A7685]" : "border-[#E5DCD0]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Footprints className="w-4 h-4 text-[#4A7685]" strokeWidth={1.5} />
                        {(move.length > 0 || customMoveInput) && <div className="w-1.5 h-1.5 rounded-full bg-[#4A7685]" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold tracking-[0.15em] text-[#38221E]/60 uppercase block">Move</span>
                        <span className="font-serif text-[13px] truncate block leading-tight mt-0.5">
                          {customMoveInput || (move.length > 0 ? move[0] : "Tap to record")}
                        </span>
                      </div>
                    </div>

                    {/* People */}
                    <div 
                      onClick={() => { playSound('tap'); setActiveRootCard("people"); }}
                      className={`bg-white border p-3 rounded-[20px] shadow-soft cursor-pointer transition-all hover:border-[#4A7685]/40 flex flex-col justify-between h-[88px] min-h-[44px] ${
                        activeRootCard === "people" ? "ring-2 ring-[#4A7685]" : "border-[#E5DCD0]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Users className="w-4 h-4 text-[#4A7685]" strokeWidth={1.5} />
                        {(people.length > 0 || customPeopleInput) && <div className="w-1.5 h-1.5 rounded-full bg-[#4A7685]" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold tracking-[0.15em] text-[#38221E]/60 uppercase block">People</span>
                        <span className="font-serif text-[13px] truncate block leading-tight mt-0.5">
                          {customPeopleInput || (people.length > 0 ? people[0] : "Tap to record")}
                        </span>
                      </div>
                    </div>

                    {/* Work */}
                    <div 
                      onClick={() => { playSound('tap'); setActiveRootCard("work"); }}
                      className={`bg-white border p-3 rounded-[20px] shadow-soft cursor-pointer transition-all hover:border-[#4A7685]/40 flex flex-col justify-between h-[88px] min-h-[44px] ${
                        activeRootCard === "work" ? "ring-2 ring-[#4A7685]" : "border-[#E5DCD0]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Briefcase className="w-4 h-4 text-[#4A7685]" strokeWidth={1.5} />
                        {(workFeel.length > 0 || workWhat.length > 0 || customWorkInput) && <div className="w-1.5 h-1.5 rounded-full bg-[#4A7685]" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold tracking-[0.15em] text-[#38221E]/60 uppercase block">Work</span>
                        <span className="font-serif text-[13px] truncate block leading-tight mt-0.5">
                          {customWorkInput || (workFeel.length > 0 ? workFeel[0] : "Tap to record")}
                        </span>
                      </div>
                    </div>

                    {/* Fuel */}
                    <div 
                      onClick={() => { playSound('tap'); setActiveRootCard("fuel"); }}
                      className={`bg-white border p-3 rounded-[20px] shadow-soft cursor-pointer transition-all hover:border-[#4A7685]/40 flex flex-col justify-between h-[88px] min-h-[44px] ${
                        activeRootCard === "fuel" ? "ring-2 ring-[#4A7685]" : "border-[#E5DCD0]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Utensils className="w-4 h-4 text-[#4A7685]" strokeWidth={1.5} />
                        {(fuel.length > 0 || customFuelInput) && <div className="w-1.5 h-1.5 rounded-full bg-[#4A7685]" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold tracking-[0.15em] text-[#38221E]/60 uppercase block">Fuel</span>
                        <span className="font-serif text-[13px] truncate block leading-tight mt-0.5">
                          {customFuelInput || (fuel.length > 0 ? fuel[0] : "Tap to record")}
                        </span>
                      </div>
                    </div>

                    {/* Play */}
                    <div 
                      onClick={() => { playSound('tap'); setActiveRootCard("play"); }}
                      className={`bg-white border p-3 rounded-[20px] shadow-soft cursor-pointer transition-all hover:border-[#4A7685]/40 flex flex-col justify-between h-[88px] min-h-[44px] ${
                        activeRootCard === "play" ? "ring-2 ring-[#4A7685]" : "border-[#E5DCD0]"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <Sun className="w-4 h-4 text-[#4A7685]" strokeWidth={1.5} />
                        {(play.length > 0 || customPlayInput) && <div className="w-1.5 h-1.5 rounded-full bg-[#4A7685]" />}
                      </div>
                      <div>
                        <span className="text-[9px] font-semibold tracking-[0.15em] text-[#38221E]/60 uppercase block">Play</span>
                        <span className="font-serif text-[13px] truncate block leading-tight mt-0.5">
                          {customPlayInput || (play.length > 0 ? play[0] : "Tap to record")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM DRAWER ACCORDION WITH INTEGRATED CUSTOM TEXT BOXES */}
                  <AnimatePresence>
                    {activeRootCard && (
                      <motion.div
                        initial={{ opacity: 0, y: 150 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 150 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="absolute inset-x-0 bottom-0 top-[40px] bg-white rounded-t-[32px] shadow-[0_-12px_32px_rgba(56,34,30,0.12)] p-6 z-30 overflow-y-auto flex flex-col justify-between border-t border-[#E5DCD0]"
                      >
                        <div>
                          {/* Header */}
                          <div className="flex justify-between items-center mb-6 border-b border-[#E5DCD0]/50 pb-3">
                            <span className="text-[10px] font-bold tracking-[0.2em] text-[#4A7685] uppercase">
                              ROOT SETTINGS / {activeRootCard}
                            </span>
                            <button 
                              onClick={() => { playSound('tap'); setActiveRootCard(null); }}
                              className="text-[12px] font-semibold hover:opacity-75 focus:outline-none min-h-[44px]"
                            >
                              Done
                            </button>
                          </div>

                          {/* SLEEP CONTENT */}
                          {activeRootCard === "sleep" && (
                            <div className="space-y-6">
                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/65 block mb-2">
                                  Sleep Duration
                                </label>
                                <div className="flex justify-between items-baseline mb-2">
                                  <span className="font-serif text-[32px] font-bold text-[#38221E]">
                                    {sleep.hours}h
                                  </span>
                                  <span className="text-[11px] opacity-60">Ideal sleep: 7.5 - 8.5 hours</span>
                                </div>
                                <input
                                  type="range"
                                  min="0"
                                  max="12"
                                  step="0.5"
                                  value={sleep.hours}
                                  onChange={(e) => setSleep({ ...sleep, hours: parseFloat(e.target.value) })}
                                  className="w-full accent-[#4A7685] bg-[#F7F2E8] h-1.5 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/65 block mb-2">
                                  Quality Indicators
                                </label>
                                <div className="flex gap-2 mb-4">
                                  {["Rough night", "Okay", "Deep"].map((q) => {
                                    const isSel = sleep.quality.includes(q);
                                    return (
                                      <button
                                        key={q}
                                        onClick={() => {
                                          if (isSel) {
                                            setSleep({ ...sleep, quality: sleep.quality.filter(item => item !== q) });
                                          } else {
                                            setSleep({ ...sleep, quality: [...sleep.quality, q] });
                                          }
                                        }}
                                        className={`h-11 px-4 rounded-full border text-[12px] font-bold tracking-tight transition-all focus:outline-none flex-1 min-h-[44px] ${
                                          isSel 
                                            ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                            : "bg-white border-[#E5DCD0] text-[#38221E]"
                                        }`}
                                      >
                                        {q}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* TEXTBOX FOR SLEEP ROOT */}
                              <div className="pt-2 border-t border-[#E5DCD0]/50">
                                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  Or write a custom sleep note
                                </label>
                                <input 
                                  type="text"
                                  placeholder="e.g., Woke up once, Vivid dreams..."
                                  value={customSleepInput}
                                  onChange={(e) => setCustomSleepInput(e.target.value)}
                                  className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                                />
                              </div>
                            </div>
                          )}

                          {/* MOVE CONTENT */}
                          {activeRootCard === "move" && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/65 block mb-1">
                                Physical Session
                              </label>
                              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                                {[
                                  "No real movement", "Gentle stretch / slow walk", 
                                  "Light walk / yoga", "Steady session / gym", 
                                  "Strong run / workout", "Pushed hard / all out"
                                ].map((opt) => {
                                  const isSel = move.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        if (isSel) {
                                          setMove(move.filter(m => m !== opt));
                                        } else {
                                          setMove([...move, opt]);
                                        }
                                      }}
                                      className={`h-10 px-4 rounded-xl border text-[12px] font-medium text-left transition-all focus:outline-none min-h-[40px] flex items-center justify-between ${
                                        isSel 
                                          ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                          : "bg-white border-[#E5DCD0] text-[#38221E]"
                                      }`}
                                    >
                                      <span>{opt}</span>
                                      {isSel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* TEXTBOX FOR MOVE ROOT */}
                              <div className="pt-2 border-t border-[#E5DCD0]/50">
                                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  Or input custom movement description
                                </label>
                                <input 
                                  type="text"
                                  placeholder="e.g. 45 min Pilates session, 5km Row..."
                                  value={customMoveInput}
                                  onChange={(e) => setCustomMoveInput(e.target.value)}
                                  className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                                />
                              </div>
                            </div>
                          )}

                          {/* PEOPLE CONTENT */}
                          {activeRootCard === "people" && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/65 block mb-1">
                                Interpersonal Connections
                              </label>
                              <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                                {[
                                  "Alone but okay", "Alone + flat", "Partner", "Close friends", 
                                  "Family", "Coworkers", "Kids", "Strangers", "Community", "Pet time"
                                ].map((opt) => {
                                  const isSel = people.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        if (isSel) {
                                          setPeople(people.filter(p => p !== opt));
                                        } else {
                                          setPeople([...people, opt]);
                                        }
                                      }}
                                      className={`h-[36px] px-3 rounded-full border text-[11px] font-semibold transition-all focus:outline-none min-h-[36px] flex items-center gap-1 ${
                                        isSel 
                                          ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                          : "bg-white border-[#E5DCD0] text-[#38221E]"
                                      }`}
                                    >
                                      {isSel && <Check className="w-3 h-3" />}
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* TEXTBOX FOR PEOPLE ROOT */}
                              <div className="pt-2 border-t border-[#E5DCD0]/50">
                                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  Or write a custom social note
                                </label>
                                <input 
                                  type="text"
                                  placeholder="e.g. Called my mom, Deep conversation with Alex..."
                                  value={customPeopleInput}
                                  onChange={(e) => setCustomPeopleInput(e.target.value)}
                                  className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                                />
                              </div>
                            </div>
                          )}

                          {/* WORK CONTENT */}
                          {activeRootCard === "work" && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  How did work feel?
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {["Draining", "Neutral", "Dialed in", "In Flow", "Enjoyable / fun", "Productive"].map((opt) => {
                                    const isSel = workFeel.includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          if (isSel) {
                                            setWorkFeel(workFeel.filter(wf => wf !== opt));
                                          } else {
                                            setWorkFeel([...workFeel, opt]);
                                          }
                                        }}
                                        className={`h-8 px-3 rounded-full border text-[11px] font-semibold transition-all focus:outline-none min-h-[32px] ${
                                          isSel 
                                            ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                            : "bg-white border-[#E5DCD0] text-[#38221E]"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  What actually happened?
                                </label>
                                <div className="flex flex-wrap gap-1.5">
                                  {["Achieved something", "Felt stuck", "On edge", "In a groove", "Collaborated well", "Learned something"].map((opt) => {
                                    const isSel = workWhat.includes(opt);
                                    return (
                                      <button
                                        key={opt}
                                        onClick={() => {
                                          if (isSel) {
                                            setWorkWhat(workWhat.filter(ww => ww !== opt));
                                          } else {
                                            setWorkWhat([...workWhat, opt]);
                                          }
                                        }}
                                        className={`h-8 px-3 rounded-full border text-[11px] font-semibold transition-all focus:outline-none min-h-[32px] ${
                                          isSel 
                                            ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                            : "bg-white border-[#E5DCD0] text-[#38221E]"
                                        }`}
                                      >
                                        {opt}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* TEXTBOX FOR WORK ROOT */}
                              <div className="pt-2 border-t border-[#E5DCD0]/50">
                                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  Or add a custom work description
                                </label>
                                <input 
                                  type="text"
                                  placeholder="e.g. Pitched to client, Redesigned app flow..."
                                  value={customWorkInput}
                                  onChange={(e) => setCustomWorkInput(e.target.value)}
                                  className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                                />
                              </div>
                            </div>
                          )}

                          {/* FUEL CONTENT */}
                          {activeRootCard === "fuel" && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/65 block mb-1">
                                Fuel & Nourishment
                              </label>
                              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                                {[
                                  "Rushed / skipped", "Mindless / meh", 
                                  "Okay / enough", "Well / good meals", 
                                  "Really well / cooked with care"
                                ].map((opt) => {
                                  const isSel = fuel.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        if (isSel) {
                                          setFuel(fuel.filter(f => f !== opt));
                                        } else {
                                          setFuel([...fuel, opt]);
                                        }
                                      }}
                                      className={`h-10 px-4 rounded-xl border text-[12px] font-medium text-left transition-all focus:outline-none min-h-[40px] flex items-center justify-between ${
                                        isSel 
                                          ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                          : "bg-white border-[#E5DCD0] text-[#38221E]"
                                      }`}
                                    >
                                      <span>{opt}</span>
                                      {isSel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* TEXTBOX FOR FUEL ROOT */}
                              <div className="pt-2 border-t border-[#E5DCD0]/50">
                                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  Or add custom nutrition detail
                                </label>
                                <input 
                                  type="text"
                                  placeholder="e.g. 16-hour Fast, Organic Green Juice..."
                                  value={customFuelInput}
                                  onChange={(e) => setCustomFuelInput(e.target.value)}
                                  className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                                />
                              </div>
                            </div>
                          )}

                          {/* PLAY CONTENT */}
                          {activeRootCard === "play" && (
                            <div className="space-y-4">
                              <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/65 block mb-1">
                                Play & Offline Recreation
                              </label>
                              <div className="flex flex-wrap gap-1.5 max-h-[180px] overflow-y-auto pr-1">
                                {[
                                  "No real play", "Scrolled", "Music", "Outside / nature", 
                                  "Hobby / creating", "Cooking", "Game / sport", 
                                  "Show / movie", "Bath / slow time", "Laughed with someone"
                                ].map((opt) => {
                                  const isSel = play.includes(opt);
                                  return (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        if (isSel) {
                                          setPlay(play.filter(p => p !== opt));
                                        } else {
                                          setPlay([...play, opt]);
                                        }
                                      }}
                                      className={`h-[36px] px-3 rounded-full border text-[11px] font-semibold transition-all focus:outline-none min-h-[36px] flex items-center gap-1 ${
                                        isSel 
                                          ? "bg-[#4A7685] border-[#4A7685] text-white" 
                                          : "bg-white border-[#E5DCD0] text-[#38221E]"
                                      }`}
                                    >
                                      {isSel && <Check className="w-3 h-3" />}
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* TEXTBOX FOR PLAY ROOT */}
                              <div className="pt-2 border-t border-[#E5DCD0]/50">
                                <label className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1.5">
                                  Or add your unique offline recreation
                                </label>
                                <input 
                                  type="text"
                                  placeholder="e.g. Played acoustic guitar, Read Kinfolk..."
                                  value={customPlayInput}
                                  onChange={(e) => setCustomPlayInput(e.target.value)}
                                  className="w-full h-[40px] px-3.5 bg-[#F7F2E8]/50 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                                />
                              </div>
                            </div>
                          )}

                        </div>

                        {/* Save */}
                        <div className="mt-8">
                          <button
                            onClick={() => { playSound('tap'); setActiveRootCard(null); }}
                            className="w-full h-[48px] bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-semibold tracking-wide transition-all text-[14px] min-h-[44px]"
                          >
                            Confirm Settings
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Continue button */}
                <div className="mt-4 mb-2">
                  <button
                    onClick={handleNext}
                    className="w-full h-[52px] bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-semibold tracking-wide transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] min-h-[46px]"
                  >
                    Continue to Anchor
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: RENAMED FELT GOOD WITH SPEECH TRANSCRIPTION */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2.5">
                    <span className="text-[10px] font-semibold tracking-[0.15em] text-[#4A7685] uppercase">
                      04 / FELT GOOD
                    </span>
                    <h2 className="font-serif text-[24px] font-semibold mt-0.5 tracking-tight leading-tight">
                      What made you feel good today?
                    </h2>
                  </div>

                  {/* Suggestion Chips - Toggleable */}
                  <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1 mb-2">
                    {[
                      "A text that made me smile", "A small win", "A view / light / sky", 
                      "Finished something hard", "A kind moment", "Cooked something good", 
                      "Moved my body and felt better", "Laughed properly", "Felt like myself for a sec"
                    ].map((chip) => {
                      const isSelected = feltGoodTags.includes(chip);
                      return (
                        <button
                          key={chip}
                          onClick={() => {
                            playSound('toggle');
                            if (isSelected) {
                              setFeltGoodTags(feltGoodTags.filter(t => t !== chip));
                            } else {
                              setFeltGoodTags([...feltGoodTags, chip]);
                            }
                          }}
                          className={`h-11 px-4 rounded-full border text-[12px] font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 focus:outline-none min-h-[44px] ${
                            isSelected 
                              ? "bg-[#4A7685] border-[#4A7685] text-white shadow-md shadow-[#4A7685]/15" 
                              : "bg-white border-[#E5DCD0] text-[#38221E] hover:border-[#4A7685]/30"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          {chip}
                        </button>
                      );
                    })}
                  </div>

                  {/* CUSTOM TEXTBOX FOR FELT GOOD */}
                  <div className="bg-white border border-[#E5DCD0] rounded-[20px] p-2.5 shadow-soft mb-2.5">
                    <label className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#38221E]/60 block mb-1">
                      Or type a custom feel-good factor...
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="e.g. Perfect cup of coffee, Quality conversation..."
                        value={customFeltGoodInput}
                        onChange={(e) => setCustomFeltGoodInput(e.target.value)}
                        className="flex-1 h-11 px-4 bg-[#F7F2E8]/40 border border-[#E5DCD0] rounded-full text-[12px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customFeltGoodInput.trim()) {
                              playSound('toggle');
                              const tag = customFeltGoodInput.trim();
                              if (!feltGoodTags.includes(tag)) {
                                setFeltGoodTags([...feltGoodTags, tag]);
                              }
                              setCustomFeltGoodInput("");
                            }
                          }
                        }}
                      />
                      <button 
                        onClick={() => {
                          if (customFeltGoodInput.trim()) {
                            playSound('toggle');
                            const tag = customFeltGoodInput.trim();
                            if (!feltGoodTags.includes(tag)) {
                              setFeltGoodTags([...feltGoodTags, tag]);
                            }
                            setCustomFeltGoodInput("");
                          }
                        }}
                        aria-label="Add custom feel-good factor"
                        className="h-11 w-11 rounded-full bg-[#4A7685] text-white flex items-center justify-center hover:bg-[#4A7685]/90 transition-all min-h-[44px]"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                    </div>
                  </div>

                  {/* LOWER HALF: ONE MOMENT WORTH KEEPING */}
                  <div className="border-t border-[#38221E]/10 pt-3 mt-3">
                    <h3 className="font-serif text-[17px] font-bold text-[#38221E] mb-1.5">
                      One moment worth keeping?
                    </h3>

                    {/* Textarea */}
                    <div className="relative mb-2.5">
                      <textarea
                        placeholder="It was when..."
                        value={anchor}
                        onChange={(e) => setAnchor(e.target.value)}
                        className="w-full h-[72px] bg-white border border-[#E5DCD0] rounded-[20px] p-4 text-[13px] text-[#38221E] placeholder-[#38221E]/40 focus:outline-none focus:border-[#4A7685] focus:ring-1 focus:ring-[#4A7685] resize-none shadow-soft"
                      />
                    </div>

                    {/* REAL Voice Recording Transcription Button */}
                    <div className="flex flex-col items-center mb-3">
                      <button
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onMouseLeave={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        aria-label="Hold to record voice reflection"
                        className={`w-full max-w-[240px] h-11 rounded-full border flex items-center justify-center gap-2 transition-all text-[11px] font-bold tracking-wide select-none cursor-pointer min-h-[44px] ${
                          isRecording 
                            ? "bg-[#A34C3F] border-[#A34C3F] text-white shadow-lg" 
                            : "bg-white border-[#E5DCD0] text-[#38221E] hover:border-[#4A7685]/30"
                        }`}
                      >
                        {isRecording ? <Mic className="w-3.5 h-3.5 animate-pulse text-white" /> : <Mic className="w-3.5 h-3.5 text-[#4A7685]" />}
                        {isRecording ? `Listening... • ${recordingTime}s` : "Hold to speak real-time • 15s"}
                      </button>

                      {/* Waveform visualizer */}
                      {isRecording && (
                        <div className="flex items-center gap-1 mt-2 h-4">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => {
                            const scalePattern = [
                              [1, 1.8, 1], [1, 2.5, 1], [1, 3.2, 1], [1, 2.0, 1], [1, 2.8, 1],
                              [1, 3.5, 1], [1, 1.5, 1], [1, 2.2, 1], [1, 3.0, 1], [1, 1.8, 1]
                            ][bar - 1];
                            return (
                              <motion.div
                                key={bar}
                                animate={{ 
                                  scaleY: scalePattern
                                }}
                                transition={{ 
                                  duration: 0.6, 
                                  repeat: Infinity, 
                                  delay: bar * 0.06,
                                  ease: "easeInOut"
                                }}
                                className="w-0.5 h-4 bg-[#A34C3F] rounded-full origin-center"
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Future Self Blueprint Toggle */}
                    {mood.x > 0.5 && (
                      <label className="flex items-start gap-3 bg-white border border-[#E5DCD0] rounded-[18px] p-2.5 shadow-soft cursor-pointer hover:border-[#C29B68]/50 transition-all select-none">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isBlueprint}
                            onChange={(e) => { playSound('toggle'); setIsBlueprint(e.target.checked); }}
                            className="w-4 h-4 rounded border-[#E5DCD0] text-[#4A7685] focus:ring-[#4A7685] cursor-pointer"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-[#38221E] block">
                            ✦ Save as Good Day Blueprint
                          </span>
                          <span className="text-[9px] text-[#38221E]/60 block mt-0.5">
                            Compile today's positive vectors for Future Self reflection.
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>

                {/* Compile button */}
                <div className="mt-4 mb-2">
                  <button
                    onClick={handleNext}
                    className="w-full h-[52px] bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-semibold tracking-wide transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 text-[15px] min-h-[46px]"
                  >
                    Compile Entry
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: UPGRADED EDITORIAL ADULT COMPILATION */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Small Editorial Minimalist Title */}
                  <div className="text-center pt-1 pb-1">
                    <span className="text-[9px] font-bold tracking-[0.25em] text-[#38221E]/60 uppercase">
                      JOURNAL
                    </span>
                    <h2 className="font-serif text-[26px] font-bold text-[#38221E] tracking-wide mt-0.5 leading-none">
                      {selectedPastEntry
                        ? selectedPastEntry.date
                        : new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </h2>
                    <span className="text-[9px] font-bold tracking-[0.18em] text-[#4A7685] uppercase block mt-1">
                      A CLEARER PICTURE
                    </span>
                  </div>

                  {/* OVERALL DAY WIDGET WITH CIRCULAR SLEEP GAUGE */}
                  <div className="bg-white/95 border border-[#E5DCD0] rounded-[20px] p-3.5 shadow-soft flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-[#38221E]/50 uppercase block mb-1">
                        OVERALL DAY
                      </span>
                      <h3 className="font-serif text-[22px] font-bold text-[#38221E] leading-none">
                        {selectedPastEntry ? selectedPastEntry.mood.primary : currentMoodInfo.primary}
                      </h3>
                      <p className="text-[11.5px] text-[#38221E]/80 leading-relaxed font-serif italic mt-1.5">
                        {getMoodDescriptionParagraph(selectedPastEntry || {
                          id: "", mood: { x: mood.x, y: mood.y, primary: currentMoodInfo.primary, secondary: currentMoodInfo.secondary },
                          dayTags, sleep, move, people, workFeel, workWhat, fuel, play, anchor, isBlueprint, date: "", time: ""
                        })}
                      </p>
                    </div>
                    
                    {/* Circular Sleep Gauge */}
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="relative w-[64px] h-[64px] flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            stroke="#E5DCD0"
                            strokeWidth="4.5"
                            fill="transparent"
                            className="opacity-40"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="26"
                            stroke="#38221E"
                            strokeWidth="4.5"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 26}
                            strokeDashoffset={
                              2 * Math.PI * 26 * (1 - Math.min(12, selectedPastEntry ? selectedPastEntry.sleep.hours : sleep.hours) / 12)
                            }
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>
                        <div className="text-center">
                          <span className="font-serif text-[15px] font-bold text-[#38221E]">
                            {selectedPastEntry ? selectedPastEntry.sleep.hours : sleep.hours}
                          </span>
                          <span className="text-[8px] text-[#38221E]/60 block -mt-1 leading-none">/12</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-[#38221E]/50 uppercase tracking-widest mt-1">
                        SLEEP
                      </span>
                    </div>
                  </div>

                  {/* MOOD THROUGHOUT THE DAY */}
                  <div className="bg-white/95 border border-[#E5DCD0] rounded-[20px] p-3 shadow-soft">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-[#38221E]/50 uppercase">
                        MOOD THROUGHOUT THE DAY
                      </span>
                      <span className="text-[8px] font-semibold text-[#4A7685] tracking-wide uppercase">
                        Continuous Resonance
                      </span>
                    </div>
                    
                    <div className="h-[52px] relative flex flex-col justify-end mt-1">
                      <div className="absolute top-[26px] left-0 right-0 border-t border-dashed border-[#38221E]/10 z-0" />
                      
                      <svg className="w-full h-full absolute top-0 left-0 overflow-visible z-10">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38221E" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#38221E" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        
                        <path
                          d={getMoodChartPath(selectedPastEntry ? selectedPastEntry.mood : mood, true)}
                          fill="url(#chartGradient)"
                          className="transition-all duration-700 ease-out"
                        />
                        
                        <path
                          d={getMoodChartPath(selectedPastEntry ? selectedPastEntry.mood : mood, false)}
                          fill="none"
                          stroke="#38221E"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="transition-all duration-700 ease-out"
                        />
                        
                        <circle
                          cx="264"
                          cy={getMoodChartEndDotY(selectedPastEntry ? selectedPastEntry.mood : mood)}
                          r="3"
                          fill="#38221E"
                        />
                        <circle
                          cx="264"
                          cy={getMoodChartEndDotY(selectedPastEntry ? selectedPastEntry.mood : mood)}
                          r="6"
                          fill="#38221E"
                          className="opacity-25 animate-ping"
                        />
                      </svg>
                      
                      <div className="flex justify-between text-[8px] font-bold text-[#38221E]/40 uppercase tracking-widest px-1 pt-1 z-10 select-none">
                        <span>6am</span>
                        <span>12pm</span>
                        <span>6pm</span>
                        <span>10pm</span>
                      </div>
                    </div>
                  </div>

                  {/* KEY AREAS AT A GLANCE */}
                  <div className="bg-white/95 border border-[#E5DCD0] rounded-[20px] p-3.5 shadow-soft">
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="text-[9px] font-bold tracking-[0.15em] text-[#38221E]/50 uppercase">
                        KEY AREAS
                      </span>
                      <span className="text-[8px] font-semibold text-[#4A7685] tracking-wide uppercase">
                        AT A GLANCE
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-4 divide-x divide-[#E5DCD0]/30">
                      {/* Sleep Column */}
                      <div className="flex flex-col items-center justify-center px-1 text-center">
                        <Moon className="w-3.5 h-3.5 text-[#38221E] mb-1" />
                        <span className="text-[8px] font-bold text-[#38221E]/50 uppercase tracking-wider block">Sleep</span>
                        <span className="font-serif text-[11px] font-bold text-[#38221E] mt-0.5 leading-none">
                          {(selectedPastEntry ? selectedPastEntry.sleep.hours : sleep.hours)}h
                        </span>
                        <span className="text-[8px] text-[#38221E]/60 truncate font-serif italic mt-0.5 max-w-full">
                          {selectedPastEntry
                            ? selectedPastEntry.customSleepNote || selectedPastEntry.sleep.quality[0] || "Okay"
                            : customSleepInput || sleep.quality[0] || "Okay"}
                        </span>
                      </div>
                      
                      {/* Movement Column */}
                      <div className="flex flex-col items-center justify-center px-1 text-center">
                        <Footprints className="w-3.5 h-3.5 text-[#38221E] mb-1" />
                        <span className="text-[8px] font-bold text-[#38221E]/50 uppercase tracking-wider block">Move</span>
                        <span className="font-serif text-[11px] font-bold text-[#38221E] mt-0.5 leading-none truncate max-w-full">
                          {selectedPastEntry
                            ? (selectedPastEntry.customMoveNote ? "Active" : selectedPastEntry.move[0]?.split(" ")[0] || "None")
                            : (customMoveInput ? "Active" : move[0]?.split(" ")[0] || "None")}
                        </span>
                        <span className="text-[8px] text-[#38221E]/60 truncate font-serif italic mt-0.5 max-w-full">
                          {selectedPastEntry
                            ? (selectedPastEntry.customMoveNote || selectedPastEntry.move[0] || "Resting")
                            : (customMoveInput || move[0] || "Resting")}
                        </span>
                      </div>
                      
                      {/* Social Column */}
                      <div className="flex flex-col items-center justify-center px-1 text-center">
                        <Users className="w-3.5 h-3.5 text-[#38221E] mb-1" />
                        <span className="text-[8px] font-bold text-[#38221E]/50 uppercase tracking-wider block">People</span>
                        <span className="font-serif text-[11px] font-bold text-[#38221E] mt-0.5 leading-none truncate max-w-full">
                          {selectedPastEntry
                            ? (selectedPastEntry.customPeopleNote ? "Connected" : selectedPastEntry.people[0]?.split(" ")[0] || "Alone")
                            : (customPeopleInput ? "Connected" : people[0]?.split(" ")[0] || "Alone")}
                        </span>
                        <span className="text-[8px] text-[#38221E]/60 truncate font-serif italic mt-0.5 max-w-full">
                          {selectedPastEntry
                            ? (selectedPastEntry.customPeopleNote || selectedPastEntry.people[0] || "Peaceful")
                            : (customPeopleInput || people[0] || "Peaceful")}
                        </span>
                      </div>
                      
                      {/* Nutrition Column */}
                      <div className="flex flex-col items-center justify-center px-1 text-center">
                        <Utensils className="w-3.5 h-3.5 text-[#38221E] mb-1" />
                        <span className="text-[8px] font-bold text-[#38221E]/50 uppercase tracking-wider block">Fuel</span>
                        <span className="font-serif text-[11px] font-bold text-[#38221E] mt-0.5 leading-none truncate max-w-full">
                          {selectedPastEntry
                            ? (selectedPastEntry.customFuelNote ? "Nourished" : selectedPastEntry.fuel[0]?.split(" ")[0] || "Standard")
                            : (customFuelInput ? "Nourished" : fuel[0]?.split(" ")[0] || "Standard")}
                        </span>
                        <span className="text-[8px] text-[#38221E]/60 truncate font-serif italic mt-0.5 max-w-full">
                          {selectedPastEntry
                            ? (selectedPastEntry.customFuelNote || selectedPastEntry.fuel[0] || "Adequate")
                            : (customFuelInput || fuel[0] || "Adequate")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* WHAT STOOD OUT (HIGHLIGHTS & CHALLENGES) */}
                  <div className="bg-white/95 border border-[#E5DCD0] rounded-[20px] p-3.5 shadow-soft">
                    <span className="text-[9px] font-bold tracking-[0.15em] text-[#38221E]/50 uppercase block mb-2.5">
                      WHAT STOOD OUT
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Highlights Column */}
                      <div>
                        <span className="text-[8px] font-bold tracking-[0.12em] text-[#4A7685] uppercase block mb-2">
                          HIGHLIGHTS
                        </span>
                        <div className="space-y-1.5">
                          {getHighlightsAndChallenges(selectedPastEntry || {
                            id: "", mood: { x: mood.x, y: mood.y, primary: currentMoodInfo.primary, secondary: currentMoodInfo.secondary },
                            dayTags, sleep, move, people, workFeel, workWhat, fuel, play, anchor, isBlueprint, date: "", time: "",
                            feltGoodTags: feltGoodTags
                          }).highlights.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[10.5px] text-[#38221E] leading-tight">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#38221E] flex items-center justify-center text-white text-[9px] font-bold shrink-0 select-none">
                                +
                              </div>
                              <span className="font-sans truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Challenges Column */}
                      <div>
                        <span className="text-[8px] font-bold tracking-[0.12em] text-[#38221E]/50 uppercase block mb-2">
                          CHALLENGES
                        </span>
                        <div className="space-y-1.5">
                          {getHighlightsAndChallenges(selectedPastEntry || {
                            id: "", mood: { x: mood.x, y: mood.y, primary: currentMoodInfo.primary, secondary: currentMoodInfo.secondary },
                            dayTags, sleep, move, people, workFeel, workWhat, fuel, play, anchor, isBlueprint, date: "", time: "",
                            feltGoodTags: feltGoodTags
                          }).challenges.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[10.5px] text-[#38221E]/85 leading-tight">
                              <div className="w-3.5 h-3.5 rounded-full bg-[#38221E]/25 flex items-center justify-center text-[#38221E] text-[9px] font-bold shrink-0 select-none">
                                -
                              </div>
                              <span className="font-sans truncate">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ANCHOR / COMPACT INSIGHT BAR */}
                  {(selectedPastEntry ? selectedPastEntry.anchor : anchor) && (
                    <div className="bg-[#F5F1E8] border border-[#E5DCD0]/60 p-3 rounded-[16px] shadow-sm relative overflow-hidden">
                      <p className="font-serif italic text-[12.5px] text-[#38221E]/95 leading-relaxed text-center">
                        “ {selectedPastEntry ? selectedPastEntry.anchor : anchor} ”
                      </p>
                    </div>
                  )}

                  {/* TOMORROW / ACTION CONTAINER */}
                  <div className="bg-white/95 border border-[#E5DCD0] rounded-[20px] p-3 shadow-soft flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#F7F2E8] border border-[#E5DCD0] flex items-center justify-center shrink-0">
                        <Sparkle className="w-3.5 h-3.5 text-[#38221E]" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] font-bold tracking-[0.15em] text-[#38221E]/50 uppercase block">
                          TOMORROW
                        </span>
                        <span className="text-[10.5px] font-serif italic text-[#38221E] block leading-tight truncate">
                          {(selectedPastEntry ? selectedPastEntry.isBlueprint : isBlueprint) ? "Active daily blueprint enabled" : "Reflect and flow forward."}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 flex items-center gap-2">
                      {selectedPastEntry ? (
                        <button
                          onClick={() => {
                            playSound('tap');
                            setSelectedPastEntry(null);
                            setStep(0);
                          }}
                          className="h-[34px] px-3.5 bg-[#4A7685] hover:bg-[#4A7685]/90 text-white rounded-full font-bold text-[10px] tracking-wide uppercase transition-all transform active:scale-95 flex items-center gap-1 shadow-sm"
                        >
                          Home
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => { playSound('tap'); setStep(1); }}
                            className="h-[34px] px-3 border border-[#38221E]/30 text-[#38221E]/70 rounded-full font-bold text-[10px] tracking-wide uppercase transition-all transform active:scale-95 flex items-center"
                          >
                            Edit
                          </button>
                          <button
                            onClick={saveEntry}
                            className="h-[34px] px-4 bg-[#38221E] hover:bg-[#38221E]/95 text-white rounded-full font-bold text-[10px] tracking-wide uppercase transition-all transform active:scale-95 flex items-center gap-1.5 shadow-md"
                          >
                            <Check className="w-3 h-3" strokeWidth={3} />
                            Save
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Bottom Centered "This isn't helping" Pill (Only visible during Flow steps 1-4) */}
        {step > 0 && step < 5 && (
          <div className="py-3 flex justify-center bg-gradient-to-t from-[#F7F2E8] to-transparent z-15 shrink-0 select-none">
            <button
              onClick={() => setShowComfortModal(true)}
              className="px-4 py-1.5 border border-[#38221E]/15 bg-white/40 backdrop-blur-sm rounded-full text-[10px] font-semibold tracking-tight text-[#38221E]/80 hover:bg-white hover:text-[#4A7685] active:scale-95 transition-all shadow-sm focus:outline-none min-h-[32px]"
            >
              This isn't helping
            </button>
          </div>
        )}

        {/* Home Indicator line */}
        <div className="w-32 h-1 bg-[#38221E]/15 rounded-full mx-auto mb-2 shrink-0 select-none" />

      </div>

      {/* TOAST NOTIFICATION CONTAINER */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 bg-[#4A7685] text-white px-5 py-3 rounded-full text-[13px] font-semibold tracking-wide shadow-xl z-50 flex items-center gap-2 border border-[#E5DCD0]/20"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMFORT MODAL */}
      <AnimatePresence>
        {showComfortModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#38221E]/35 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E5DCD0] rounded-[28px] max-w-[340px] p-6 text-center shadow-2xl flex flex-col items-center"
            >
              <div className="w-11 h-11 rounded-full bg-[#F7F2E8] flex items-center justify-center text-[#4A7685] mb-4">
                <Info className="w-5.5 h-5.5" />
              </div>
              <h3 className="font-serif text-[21px] font-bold mb-2 text-[#38221E]">
                Take a Deep Breath
              </h3>
              <p className="text-[13px] text-[#38221E]/80 leading-relaxed mb-6">
                You don't have to finish this entry right now. There's no performance here. If you need, just close the app and go look at the sky for a moment. That's more important.
              </p>
              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => {
                    setShowComfortModal(false);
                    setStep(0); // return to dashboard
                  }}
                  className="w-full h-11 bg-[#A34C3F] hover:bg-[#A34C3F]/90 text-white rounded-full font-semibold text-[13px] tracking-wide transition-all min-h-[44px]"
                >
                  Leave Journaling for Now
                </button>
                <button
                  onClick={() => setShowComfortModal(false)}
                  className="w-full h-11 border border-[#38221E]/20 text-[#38221E]/70 hover:bg-[#F7F2E8] rounded-full font-semibold text-[13px] tracking-wide transition-all min-h-[44px]"
                >
                  Return to Writing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}