// @ts-check
// Home — premium mobile landing with a reversible palette experiment.
// Presentation only; all flows (direction selection, last-worked replay,
// time-of-day recommendation) route to the existing /reset entry unchanged.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sessionStore } from "@/lib/localData";
import SafetyFooter from "@/components/SafetyFooter";
import PullToRefresh from "@/components/PullToRefresh";
import HomeHero from "@/components/home/HomeHero";
import LastWorkedCard from "@/components/home/LastWorkedCard";
import CategoryCard from "@/components/home/CategoryCard";
import RecommendedCard from "@/components/home/RecommendedCard";
import { HOME_THEME } from "@/lib/homeTheme";

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
  const [lastWorked, setLastWorked] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

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
      <div className={`home-theme home-theme--${HOME_THEME} min-h-full bg-[var(--home-bg)] text-[var(--home-ink)]`}>
        <div className="mx-auto flex min-h-full max-w-[36rem] flex-col">
          <HomeHero onProfile={() => navigate("/profile")} onInsights={() => navigate("/insights")} />

          <section className="px-5 pt-9">
            <h2 className="text-center font-clean text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-[var(--home-ink)]">
              What do you need right now?
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {HOME_GRID.map((c, i) => (
                <CategoryCard key={c.id} card={c} index={i} onClick={() => choose(c)} />
              ))}
            </div>
          </section>

          {(lastWorked || personalBest) ? (
            <section className="mt-10 px-2">
              <LastWorkedCard subtitle="Repeat your most effective reset" onClick={doLastWorked} overlap={false} />
            </section>
          ) : recommendation ? (
            <section className="mt-10 px-5">
              <RecommendedCard
                title={recommendation.title}
                descriptor={`${recommendation.minutes} min · ${recommendation.tag}`}
                onClick={doRecommend}
              />
            </section>
          ) : null}

          <div className="px-5">
            <SafetyFooter dark={false} />
          </div>

          <div className="h-32" />
        </div>
      </div>
    </PullToRefresh>
  );
}
