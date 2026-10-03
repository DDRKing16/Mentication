// @ts-check
// Home — premium mobile landing with a reversible palette experiment.
// Presentation only; all flows (direction selection, last-worked replay,
// time-of-day recommendation) route to the existing /reset entry unchanged.
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sessionStore } from "@/lib/localData";
import SafetyFooter from "@/components/SafetyFooter";
import PullToRefresh from "@/components/PullToRefresh";
import HomeHero from "@/components/home/HomeHero";
import CategoryCard from "@/components/home/CategoryCard";
import TodayStrip from "@/components/home/TodayStrip";
import FirstWinCard from "@/components/home/FirstWinCard";
import MoreWaysIn from "@/components/home/MoreWaysIn";
import WhatsNewRibbon from "@/components/home/WhatsNewRibbon";
// Only the on-device "which programme is active" bookkeeping is needed
// eagerly here; `programmeProgress` and `launchStateFor` need the full
// intervention data, so they're loaded on demand instead (see below).
import { activeProgrammeId, getProgramme, programmeStartedAt } from "@/lib/programmeStore";
import { computeLocalCalendarStreak } from "@/lib/streak";
import { HOME_THEME } from "@/lib/homeTheme";
import { usePlus } from "@/lib/subscription";

// Tracks the last time Insights was opened, purely on-device, so the small
// dot on its icon can mean "there's a session since you last looked" rather
// than always being on or always being off.
// Real screens from the three Restructure journeys — the same previews the
// Plus paywall and Restructure page use — shown on the cream-blue home card
// so it shows what each journey actually is.
const RESTRUCTURE_PREVIEWS = [
  "/media/plus-preview/foundations.jpg",
  "/media/plus-preview/dear2100.jpg",
  "/media/plus-preview/good-map.jpg",
];

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
  transition: { type: "spring", stiffness: 260, damping: 20, delay: index * 0.06 },
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

// A gentle reorder by time of day — Sleep surfaces earlier in the evening,
// Lift and Focus earlier in the morning — instead of one fixed order all
// day. "Guide me" always stays last: it's a helper, not a mood choice.
function orderedGrid(now = new Date()) {
  const hour = now.getHours();
  const priority = hour >= 20 || hour < 5
    ? ["sleep", "calm", "ground", "lift", "focus"]
    : hour < 11
      ? ["lift", "focus", "calm", "ground", "sleep"]
      : ["calm", "focus", "lift", "ground", "sleep"];
  const guide = HOME_GRID.find((c) => c.unsure);
  const rest = HOME_GRID.filter((c) => !c.unsure).slice().sort((a, b) => priority.indexOf(a.id) - priority.indexOf(b.id));
  return guide ? [...rest, guide] : rest;
}

// The one-line greeting under the hero: an open programme day beats a
// streak, and neither beats plain silence. `programmeProgress` needs the
// full intervention data, so it's loaded on demand rather than up front.
async function computeHeroHeadline(sessions) {
  const id = activeProgrammeId();
  const programme = id ? getProgramme(id) : null;
  if (programme) {
    const { programmeProgress } = await import("@/lib/programmes");
    const progress = programmeProgress(programme, sessions, programmeStartedAt(id));
    const today = progress.days[progress.todayIndex];
    if (!progress.finished && today?.status !== "tomorrow") return `Ready for day ${progress.todayIndex + 1}?`;
  }
  const streak = computeLocalCalendarStreak(sessions);
  if (streak >= 3) return `${streak} days in a row — keep it going.`;
  return undefined;
}

export default function Home() {
  const navigate = useNavigate();
  const plus = usePlus();
  const [lastWorked, setLastWorked] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [hasNewInsight, setHasNewInsight] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Which mood was reached for last time, so the grid can mark it with a
  // small dot — a quiet way back to what was just used, not a suggestion.
  const recentTint = sessions[0]?.direction || null;

  // The greeting sometimes names the actual thing worth doing today, instead
  // of the same generic line every single time — but only when there's a
  // real, specific reason to (an open programme day, or a real streak), so
  // it stays honest rather than performing enthusiasm. Computed alongside
  // the rest of the session-derived state in `loadSessions`, since it needs
  // the same on-demand intervention data as the recommendation engine does.
  const [heroHeadline, setHeroHeadline] = useState(undefined);

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
    setHeroHeadline(await computeHeroHeadline(weekSessions));
    setHasNewInsight(hasUnseenInsight(weekSessions));
    setLoaded(true);
  };
  useEffect(() => { loadSessions().catch(() => {}); }, []);

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
      <div className={`home-theme home-theme--${HOME_THEME} relative isolate min-h-full bg-[var(--home-bg)] text-[var(--home-ink)]`}>
        {/* A full-screen backdrop some themes switch on (the sunset sky and
            palms sit behind everything, not just the header). Hidden by
            default. */}
        <div aria-hidden="true" className="home-page-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <img src="/media/brand/sunset-sky.svg" alt="" draggable={false} className="home-page-art absolute inset-0 h-full w-full select-none object-cover object-right-top" />
          <img src="/media/brand/palm-silhouette-dusk.svg" alt="" draggable={false} className="home-page-palm home-page-palm--main absolute select-none" />
          <img src="/media/brand/palm-silhouette-dusk.svg" alt="" draggable={false} className="home-page-palm home-page-palm--small absolute select-none" />
          <span className="home-page-haze absolute inset-0" />
          <span className="home-felt home-page-grain absolute inset-0" />
        </div>
        <div className="mx-auto flex min-h-full max-w-[36rem] flex-col">
          <HomeHero
            onMenu={() => navigate("/settings")}
            onProfile={() => navigate("/profile")}
            onInsights={() => { markInsightsSeen(); setHasNewInsight(false); navigate("/insights"); }}
            hasNewInsight={hasNewInsight}
            headline={heroHeadline}
          />

          {/* Only for people who've been here before - a brand-new person
              has nothing to compare this to, so the note would be noise. */}
          {loaded && sessions.length > 0 && <WhatsNewRibbon />}

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
            loading={!loaded}
            onOpenWeek={() => navigate("/insights")}
            onOpenProgramme={() => { const id = activeProgrammeId(); navigate(id ? `/programmes/${id}` : "/programmes/calmer-seven"); }}
            onStartDay={async (day) => {
              const { launchStateFor } = await import("@/lib/programmes");
              const state = launchStateFor(day.id, getProgramme(activeProgrammeId()));
              if (state) navigate("/reset", { state });
            }}
            quick={
              (lastWorked || personalBest)
                ? { eyebrow: "Worked last time", title: "Repeat your most effective reset", onClick: doLastWorked }
                : recommendation
                  ? { eyebrow: "For you", title: recommendation.title, onClick: doRecommend }
                  : null
            }
          />

          <motion.section {...reveal(2)} className="home-heading-section px-5 pt-5">
            <h2 className="home-heading whitespace-nowrap text-center font-clean text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--home-ink)]">
              What do you need right now?
            </h2>
            <div className="home-cat-grid mt-6 grid grid-cols-2 gap-4 min-[430px]:grid-cols-3">
              {orderedGrid().map((c, i) => (
                <CategoryCard key={c.id} card={c} index={i} recent={!!recentTint && c.tint === recentTint} onClick={() => choose(c)} />
              ))}
            </div>
            {/* Restructure: a cream-blue card the width of Your Week, under the
                six buttons, with a real screen from each of its three journeys
                fanned on the right as a preview of what they are. It opens the
                category holding Foundations, Dear 2100 and The Good Map. */}
            <button
              type="button"
              onClick={() => navigate("/restructure")}
              aria-label="Restructure: Foundations, Dear 2100 and The Good Map"
              data-sfx="select"
              className="home-restructure no-tap mt-4 flex min-h-[5.75rem] w-full items-center justify-between gap-3 rounded-[1.4rem] py-3 pl-4 pr-3 text-left transition-transform duration-150 active:scale-[0.985]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Layers className="home-restructure-icon h-[1.15rem] w-[1.15rem] shrink-0" strokeWidth={1.7} aria-hidden="true" />
                <span>
                  <span className="home-restructure-title block font-heading text-[1.02rem] font-semibold leading-tight">Restructure</span>
                  <span className="home-restructure-sub block text-[0.68rem] font-medium leading-tight">Foundations · Dear 2100 · The Good Map</span>
                </span>
              </span>
              <span className="flex shrink-0 items-center pr-1.5">
                {RESTRUCTURE_PREVIEWS.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    loading="lazy"
                    className="h-[3.4rem] w-[2.6rem] rounded-[0.5rem] border border-white/80 bg-[#0A1B33] object-cover object-top shadow-[0_6px_14px_-8px_rgba(13,42,72,0.55)]"
                    style={{ transform: `rotate(${(i - 1) * 8}deg)`, zIndex: RESTRUCTURE_PREVIEWS.length - i, marginLeft: i ? "-0.45rem" : 0 }}
                  />
                ))}
              </span>
            </button>
          </motion.section>

          {/* A quiet break between the everyday grid above and the longer,
              optional journeys below, instead of running straight into them. */}
          <div className="home-divider mx-5 mt-9 h-px bg-[var(--home-ink)]/10" />

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <MoreWaysIn plusActive={plus.active} onOpen={(route) => navigate(route)} />
          </motion.div>

          <div className="home-footer px-5 pt-8">
            <SafetyFooter home />
          </div>

          <div className="home-bottom-spacer h-32" />
        </div>
      </div>
    </PullToRefresh>
  );
}
