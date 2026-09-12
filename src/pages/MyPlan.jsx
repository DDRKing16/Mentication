// My Plan — a focused view of the user's personalised regulation plan.
// Reuses the existing recommendation engine and history (no new data): the
// time-of-day reset plus their best-performing practice. Both start buttons
// launch the existing /reset flow with a prebuilt pathway.
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LOCAL_DATA_CHANGED_EVENT, sessionStore } from "@/lib/localData";
import { pickLastWorked, improvementOf, buildPersonalBest } from "@/lib/interventions";
import { buildRecommendation } from "@/lib/recommend";
import RecommendedCard from "@/components/home/RecommendedCard";
import LastWorkedCard from "@/components/home/LastWorkedCard";
import PremiumPageHeader from "@/components/PremiumPageHeader";
import PullToRefresh from "@/components/PullToRefresh";

export default function MyPlan() {
  const navigate = useNavigate();
  const [lastWorked, setLastWorked] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const loadPlan = useCallback(async () => {
    try {
      setError("");
      const sessions = await sessionStore.list("-created_date", 30);
      setLastWorked(pickLastWorked(sessions));
      setPersonalBest(buildPersonalBest(sessions));
      setRecommendation(buildRecommendation(sessions));
    } catch {
      setError("We couldn’t refresh your plan from this device just now.");
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const refresh = () => { loadPlan(); };
    window.addEventListener(LOCAL_DATA_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [loadPlan]);

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
    <PullToRefresh onRefresh={loadPlan}>
      <div className="min-h-full bg-[#ECE2D2] text-[#0E4536]">
        <div className="mx-auto max-w-[36rem] px-[18px] pt-[max(2rem,env(safe-area-inset-top))] pb-28">
          <PremiumPageHeader
            eyebrow="Your plan"
            title="My Plan"
            body="A quieter, more personal reset lane built from what has already helped on this device."
            trustItems={["Private on this device", "Updates with each reset", "One-tap restart"]}
          />

          {error && (
            <div className="mt-6 rounded-[1.75rem] border border-destructive/20 bg-white/75 p-5">
              <p className="font-heading text-xl font-medium tracking-tight text-primary">We couldn’t refresh your plan</p>
              <p className="mt-2 text-sm leading-relaxed text-[#5F726B]">{error}</p>
              <button
                type="button"
                onClick={loadPlan}
                className="no-tap mt-4 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground active:scale-95"
              >
                Try again
              </button>
            </div>
          )}

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
    </PullToRefresh>
  );
}
