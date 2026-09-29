// @ts-check
// Home — premium mobile landing with a reversible palette experiment.
// Presentation only; all flows (direction selection, last-worked replay,
// time-of-day recommendation) route to the existing /reset entry unchanged.
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { sessionStore } from "@/lib/localData";
import SafetyFooter from "@/components/SafetyFooter";
import PullToRefresh from "@/components/PullToRefresh";
import HomeHero from "@/components/home/HomeHero";
import CategoryCard from "@/components/home/CategoryCard";
import TodayStrip from "@/components/home/TodayStrip";
import FirstWinCard from "@/components/home/FirstWinCard";
import MoreWaysIn from "@/components/home/MoreWaysIn";
import ParkedNudge from "@/components/home/ParkedNudge";
import { activeProgrammeId, getProgramme, launchStateFor } from "@/lib/programmes";
import { computeLocalCalendarStreak } from "@/lib/insights";
import { HOME_THEME } from "@/lib/homeTheme";
import { hasParkedNotes } from "@/lib/tomorrowParking/storage";
import { usePlus } from "@/lib/subscription";

// Tracks the last time Insights was opened, purely on-device, so the small
// dot on its icon can mean "there's a session since you last looked" rather
// than always being on or always being off.
const INSIGHTS_SEEN_KEY = "mentication.insightsSeen.v1";
const markInsightsSeen = () => { try { localStorage.setItem(INSIGHTS_SEEN_KEY, new Date().toISOString()); } catch { /* storage unavailable */ } };
const hasUnseenInsight = (sessions) => {
  const newest = sessions[0]?.created_date;
  if (!newest) return false;
  try {
    const seen = localStorage.getItem(INSIGHTS_SEEN_KEY);
    return !seen || new Date(newest) > new Date(seen);
  } catch {
    return false;
  }
};

// A soft staggered rise for each top-level section as Home first loads,
// instead of everything just appearing at once.
const reveal = (index) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] },
});

const ICON_BASE = "/media/images/home-icons/";
const HOME_GRID = [
  { id: "calm", label: "Calm", sub: "Settle your system", direction: "calm", icon: ICON_BASE + "calm.png", tint: "calm" },
  { id: "lift", label: "Lift", sub: "Gently shift your mood", direction: "lift", icon: ICON_BASE + "lift.png", tint: "lift" },
  { id: "ground", label: "Ground", sub: "Come back to now", direction: "ground", icon: ICON_BASE + "grounded.png", tint: "ground" },
  { id: "sleep", label: "Sleep", sub: "Wind down to rest", direction: "sleep", icon: ICON_BASE + "sleep.png", tint: "sleep" },
  { id: "focus", label: "Focus", sub: "Restore attention", direction: "focus", icon: ICON_BASE + "focus.png", tint: "focus" },
  { id: "guide", label: "Guide me", sub: "Choose what fits", unsure: true, icon: ICON_BASE + "guide.png", tint: "guide" },
];

export default function Home() {
  const navigate = useNavigate();
  const plus = usePlus();
  const [lastWorked, setLastWorked] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [parkedNotes, setParkedNotes] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [hasNewInsight, setHasNewInsight] = useState(false);

  const loadSessions = async () => {
    const [sessions, interventions, recommendations] = await Promise.all([
      sessionStore.list("-created_date", 30),
      import("@/lib/interventions"),
      import("@/lib/recommend"),
    ]);
    const { pickLastWorked, buildPersonalBest } = interventions;
    const { buildRecommendation } = recommendations;
    setLastWorked(pickLastWorked(sessions));
    setPersonalBest(buildPersonalBest(sessions));
    setRecommendation(buildRecommendation(sessions));
    // A longer window just for "Your week" and its streak; the engine above keeps its own 30.
    const weekSessions = await sessionStore.list("-created_date", 120);
    setSessions(weekSessions);
    setHasNewInsight(hasUnseenInsight(weekSessions));
  };
  useEffect(() => { loadSessions().catch(() => {}); }, []);
  useEffect(() => { setParkedNotes(hasParkedNotes()); }, []);

  const choose = (card) => {
    if (card.unsure) navigate("/reset", { state: { unsure: true } });
    else navigate("/reset", { state: { direction: card.direction, directionLabel: card.label } });
  };

  const doLastWorked = () => {
    if (personalBest?.pathway?.length) {
      navigate("/reset", {
        state: {
          prebuilt: true, pathway: personalBest.pathway, direction: personalBest.direction,
          directionLabel: "What works for you", intensity: 5, whereFelt: "both",
          timeMin: 6, audio: "yes", movement: "seated",
        },
      });
      return;
    }
    const s = lastWorked;
    if (!s) return;
    navigate("/reset", {
      state: {
        prebuilt: true, pathway: s.pathway, direction: s.direction || s.state,
        directionLabel: s.direction_label || s.state_label, intensity: s.intensity_start,
        whereFelt: s.where_felt, timeMin: s.time_min, audio: s.audio, movement: s.movement,
      },
    });
  };

  const doRecommend = () => {
    if (!recommendation?.pathway?.length) return;
    navigate("/reset", {
      state: {
        prebuilt: true, pathway: recommendation.pathway, direction: recommendation.direction,
        directionLabel: recommendation.title, intensity: 5, whereFelt: "both",
        timeMin: recommendation.min, audio: "yes", movement: "seated",
      },
    });
  };

  return (
    <PullToRefresh onRefresh={loadSessions}>
      <div className={`home-theme home-theme--${HOME_THEME} min-h-full bg-[var(--home-bg)] text-[var(--home-ink)]`}>
        <div className="mx-auto flex min-h-full max-w-[36rem] flex-col">
          <HomeHero
            onProfile={() => navigate("/profile")}
            onInsights={() => { markInsightsSeen(); setHasNewInsight(false); navigate("/insights"); }}
            hasNewInsight={hasNewInsight}
          />

          <FirstWinCard
            sessionCount={sessions.length}
            plusActive={plus.active}
            hasActiveProgramme={!!activeProgrammeId()}
            streak={computeLocalCalendarStreak(sessions)}
            onProgramme={() => navigate("/programmes/calmer-seven")}
            onPlus={() => navigate("/plus")}
          />

          {/* Your Week, the active programme and one personalised suggestion,
              bundled into a single compact strip instead of three separate
              full-size cards — the six buttons below are the main feature
              of Home and shouldn't need much scrolling to reach. */}
          <TodayStrip
            sessions={sessions}
            onOpenWeek={() => navigate("/insights")}
            onOpenProgramme={() => { const id = activeProgrammeId(); navigate(id ? `/programmes/${id}` : "/programmes/calmer-seven"); }}
            onStartDay={(day) => { const state = launchStateFor(day.id, getProgramme(activeProgrammeId())); if (state) navigate("/reset", { state }); }}
            quick={
              (lastWorked || personalBest)
                ? { eyebrow: "Worked last time", title: "Repeat your most effective reset", onClick: doLastWorked }
                : recommendation
                  ? { eyebrow: "For you", title: recommendation.title, onClick: doRecommend }
                  : null
            }
          />

          <motion.section {...reveal(2)} className="px-5 pt-5">
            <h2 className="text-center font-clean text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--home-ink)]">
              What do you need right now?
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {HOME_GRID.map((c, i) => (
                <CategoryCard key={c.id} card={c} index={i} onClick={() => choose(c)} />
              ))}
            </div>
          </motion.section>

          {/* A quiet break between the everyday grid above and the longer,
              optional journeys below, instead of running straight into them. */}
          <div className="mx-5 mt-9 h-px bg-[var(--home-ink)]/10" />

          <motion.div {...reveal(3)}>
            <MoreWaysIn plusActive={plus.active} onOpen={(route) => navigate(route)} />
          </motion.div>

          {parkedNotes && (
            <motion.div {...reveal(4)}>
              <ParkedNudge onOpen={() => navigate("/parking-lot", { state: { fromHome: true } })} />
            </motion.div>
          )}

          <div className="px-5 pt-8">
            <SafetyFooter dark={false} />
          </div>

          <div className="h-32" />
        </div>
      </div>
    </PullToRefresh>
  );
}
