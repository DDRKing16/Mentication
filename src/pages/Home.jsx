// Home — premium emerald/ivory landing matching the Homepage V3 reference.
// Presentation only; all flows (direction selection, last-worked replay,
// time-of-day recommendation) route to the existing /reset entry unchanged.
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Flame, Sparkles } from "lucide-react";
import { sessionStore } from "@/lib/localData";
import { pickLastWorked, buildPersonalBest } from "@/lib/interventions";
import { buildRecommendation } from "@/lib/recommend";
import { buildMomentumSummary } from "@/lib/insights";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import SafetyFooter from "@/components/SafetyFooter";
import PullToRefresh from "@/components/PullToRefresh";
import HomeHero from "@/components/home/HomeHero";
import LastWorkedCard from "@/components/home/LastWorkedCard";
import CategoryCard from "@/components/home/CategoryCard";
import RecommendedCard from "@/components/home/RecommendedCard";
import FlagshipReturnCard from "@/components/FlagshipReturnCard";

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
  const [momentum, setMomentum] = useState(null);

  const loadSessions = useCallback(async () => {
    const sessions = await sessionStore.list("-created_date", 30);
    if (!hasCompletedOnboarding() && sessions.length === 0) {
      navigate("/welcome", { replace: true });
      return;
    }
    setLastWorked(pickLastWorked(sessions));
    setPersonalBest(buildPersonalBest(sessions));
    setRecommendation(buildRecommendation(sessions));
    setMomentum(buildMomentumSummary(sessions));
  }, [navigate]);
  useEffect(() => { loadSessions().catch(() => {}); }, [loadSessions]);

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
      <div className="min-h-full bg-[var(--mcn-cream)] text-[var(--mcn-emerald)]">
        <div className="mx-auto flex min-h-full max-w-[36rem] flex-col">
          <HomeHero onProfile={() => navigate("/profile")} onInsights={() => navigate("/insights")} />

          <FlagshipReturnCard />

          {(lastWorked || personalBest) && (
            <LastWorkedCard subtitle="Repeat your most effective reset" onClick={doLastWorked} overlap />
          )}

          {momentum && (
            <section className="px-[18px] pt-6">
              <div className="rounded-[1.75rem] border border-[#0E4536]/10 bg-white/70 p-5 shadow-[0_20px_50px_-28px_rgba(14,69,54,0.45)] backdrop-blur">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[#7A572E]">Your momentum</p>
                    <h2 className="mt-1.5 font-clean text-[1.3rem] font-medium leading-tight text-[var(--mcn-emerald)]">
                      {momentum.totalSessions
                        ? `${momentum.thisWeek} reset${momentum.thisWeek === 1 ? "" : "s"} this week`
                        : "Your plan starts with one reset"}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#5F726B]">
                      {momentum.totalSessions
                        ? momentum.sessionsToGoal > 0
                          ? `${momentum.sessionsToGoal} more ${momentum.sessionsToGoal === 1 ? "session" : "sessions"} to reach your ${momentum.weeklyGoal}-reset weekly rhythm.`
                          : "You’ve hit your weekly rhythm. Keep following what works."
                        : "Sessions stay on this device, and your personal patterns begin after your first guided reset."}
                    </p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0E4536] text-white">
                    <Sparkles className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                </div>

                {momentum.totalSessions > 0 && (
                  <>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-[#0E4536]/5 px-4 py-3">
                        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#5F726B]">
                          <Flame className="h-3.5 w-3.5 text-[#C16D2A]" /> Streak
                        </p>
                        <p className="mt-2 font-heading text-2xl font-medium text-[var(--mcn-emerald)]">{momentum.streakDays}d</p>
                      </div>
                      <div className="rounded-2xl bg-[#0E4536]/5 px-4 py-3">
                        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[#5F726B]">
                          <BarChart3 className="h-3.5 w-3.5 text-[#0E4536]" /> Avg shift
                        </p>
                        <p className="mt-2 font-heading text-2xl font-medium text-[var(--mcn-emerald)]">
                          {momentum.averageShift > 0 ? `+${momentum.averageShift}` : momentum.averageShift}
                        </p>
                      </div>
                    </div>
                    {momentum.bestDirection && (
                      <p className="mt-4 text-sm leading-relaxed text-[#5F726B]">
                        <span className="font-medium text-[var(--mcn-emerald)]">
                          {momentum.bestDirection.charAt(0).toUpperCase() + momentum.bestDirection.slice(1)}
                        </span>{" "}
                        resets are helping most right now.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          <section className="px-[18px] pt-6">
            <h2 className="text-center font-clean text-[1.65rem] font-medium leading-tight tracking-[-0.01em] text-[var(--mcn-emerald)]">
              What do you need right now?
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-4">
              {HOME_GRID.map((c, i) => (
                <CategoryCard key={c.id} card={c} index={i} onClick={() => choose(c)} />
              ))}
            </div>
          </section>

          {recommendation && (
            <section className="mt-7 px-[18px]">
              <RecommendedCard
                title={recommendation.title}
                descriptor={`${recommendation.minutes} min · ${recommendation.tag}`}
                onClick={doRecommend}
              />
            </section>
          )}

          <div className="px-[18px]">
            <SafetyFooter dark={false} />
          </div>

          <div className="h-28" />
        </div>
      </div>
    </PullToRefresh>
  );
}
