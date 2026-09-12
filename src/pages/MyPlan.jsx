// My Plan — a focused view of the user's personalised regulation plan.
// Reuses the existing recommendation engine and history (no new data): the
// time-of-day reset plus their best-performing practice. Both start buttons
// launch the existing /reset flow with a prebuilt pathway.
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sessionStore } from "@/lib/localData";
import { pickLastWorked, improvementOf, buildPersonalBest } from "@/lib/interventions";
import { buildRecommendation } from "@/lib/recommend";
import RecommendedCard from "@/components/home/RecommendedCard";
import LastWorkedCard from "@/components/home/LastWorkedCard";

export default function MyPlan() {
  const navigate = useNavigate();
  const [lastWorked, setLastWorked] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const sessions = await sessionStore.list("-created_date", 30);
      setLastWorked(pickLastWorked(sessions));
      setPersonalBest(buildPersonalBest(sessions));
      setRecommendation(buildRecommendation(sessions));
    })()
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

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

  const lastSub = personalBest
    ? "Built from your best-performing practices"
    : (() => {
        const imp = improvementOf(lastWorked);
        return imp > 0 ? `Last shifted you ${imp.toFixed(1)} pts` : "Repeat your most effective reset";
      })();

  return (
    <div className="min-h-full bg-[#ECE2D2] text-[#0E4536]">
      <div className="mx-auto max-w-[36rem] px-[18px] pt-[max(2rem,env(safe-area-inset-top))] pb-28">
        <header>
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.26em] text-[#7A572E]">Your plan</p>
          <h1 className="mt-1.5 font-heading text-[1.9rem] font-medium leading-tight text-[#0E4536]">My Plan</h1>
          <p className="mt-1 text-[0.92rem] text-[#5F726B]">A personalised regulation plan, built from your history.</p>
        </header>

        <section className="mt-8">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#5F726B]">Today</p>
          <h2 className="mt-1.5 font-heading text-[1.15rem] font-medium text-[#0E4536]">Your reset for today</h2>
          {ready && recommendation ? (
            <div className="mt-3">
              <RecommendedCard
                title={recommendation.title}
                descriptor={`${recommendation.minutes} min · ${recommendation.tag}`}
                onClick={doRecommend}
              />
            </div>
          ) : (
            <div className="mt-3 h-[88px] animate-pulse rounded-[1.5rem] bg-[#1E3C42]/10" />
          )}
        </section>

        <section className="mt-8">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.22em] text-[#5F726B]">Built from your history</p>
          <h2 className="mt-1.5 font-heading text-[1.15rem] font-medium text-[#0E4536]">What works for you</h2>
          {ready && (lastWorked || personalBest) ? (
            <div className="mt-3">
              <LastWorkedCard subtitle={lastSub} onClick={doLastWorked} overlap={false} />
            </div>
          ) : ready ? (
            <p className="mt-3 text-[0.92rem] leading-relaxed text-[#5F726B]">
              Complete a session and your most effective reset will appear here.
            </p>
          ) : (
            <div className="mt-3 h-[76px] animate-pulse rounded-[1.5rem] bg-[#1E3C42]/10" />
          )}
        </section>
      </div>
    </div>
  );
}
