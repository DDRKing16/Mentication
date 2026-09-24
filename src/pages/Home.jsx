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
import { Sparkles } from "lucide-react";
import { hasParkedNotes } from "@/lib/tomorrowParking/storage";

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
  const [parkedNotes, setParkedNotes] = useState(false);

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

          {/* New Premium ENTRY Daily Journal Card */}
          <section className="px-5 pt-8">
            <div 
              onClick={() => navigate("/journal")}
              className="bg-[#38221E] text-[#F7F2E8] rounded-[28px] p-6 shadow-[0_12px_32px_rgba(56,34,30,0.18)] border border-[#38221E]/10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-between items-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
              <div className="flex-1 min-w-0 pr-4 z-10">
                <span className="text-[9px] font-bold tracking-[0.25em] text-[#C29B68] uppercase block mb-1">
                  DAILY JOURNAL • ENTRY
                </span>
                <h3 className="font-serif text-[23px] font-bold leading-none tracking-wide text-white mb-2">
                  Check in with yourself
                </h3>
                <p className="text-[12px] opacity-75 leading-relaxed max-w-[240px]">
                  Take 2 minutes to record your vector, capture voice thoughts, and compile daily blueprints.
                </p>
              </div>
              <div className="shrink-0 w-12 h-12 rounded-[18px] bg-white/10 flex items-center justify-center border border-white/20 z-10 transition-transform group-hover:scale-105">
                <Sparkles className="w-6 h-6 text-[#C29B68]" />
              </div>
            </div>
          </section>

          {/* Dear 2100 — the longer reflective flow for a goal you've been avoiding */}
          <section className="px-5 pt-4">
            <div
              onClick={() => navigate("/dear-2100")}
              className="bg-[#0038A0] text-[#FBF7EC] rounded-[28px] p-6 shadow-[0_12px_32px_rgba(0,56,160,0.22)] border border-white/10 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-between items-center relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
              <div className="flex-1 min-w-0 pr-4 z-10">
                <span className="text-[9px] font-bold tracking-[0.25em] text-[#F3B65B] uppercase block mb-1">
                  DEAR 2100 · 15 MINUTES
                </span>
                <h3 className="font-serif text-[23px] font-bold leading-none tracking-wide text-white mb-2">
                  Go after the thing you've avoided
                </h3>
                <p className="text-[12px] opacity-80 leading-relaxed max-w-[240px]">
                  A guided reflection from what's stopping you to one real, committed first step.
                </p>
              </div>
              <div className="shrink-0 w-12 h-12 rounded-[18px] bg-white/10 flex items-center justify-center border border-white/20 z-10 transition-transform group-hover:scale-105">
                <span className="text-[20px] leading-none">→</span>
              </div>
            </div>
          </section>

          {/* Tomorrow Parking Lot — daytime review, shown only while something is parked */}
          {parkedNotes && (
            <section className="px-5 pt-4">
              <button
                type="button"
                onClick={() => navigate("/parking-lot", { state: { fromHome: true } })}
                aria-label="Open your parking lot to review what you parked last night"
                className="w-full text-left bg-[#5B5A8C] text-[#F5F1FA] rounded-[28px] p-6 shadow-[0_12px_32px_rgba(91,90,140,0.22)] border border-white/10 transition-all hover:scale-[1.01] active:scale-[0.99] flex justify-between items-center relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent pointer-events-none" />
                <div className="flex-1 min-w-0 pr-4 z-10">
                  <span className="text-[9px] font-bold tracking-[0.25em] text-[#E8C2A8] uppercase block mb-1">
                    TOMORROW PARKING LOT · DAYTIME
                  </span>
                  <h3 className="font-serif text-[23px] font-bold leading-none tracking-wide text-white mb-2">
                    Something is parked
                  </h3>
                  <p className="text-[12px] opacity-80 leading-relaxed max-w-[240px]">
                    Read, edit or let go of what you set down last night — whenever you're ready.
                  </p>
                </div>
                <div className="shrink-0 w-12 h-12 rounded-[18px] bg-white/10 flex items-center justify-center border border-white/20 z-10 transition-transform group-hover:scale-105">
                  <span className="text-[20px] leading-none">→</span>
                </div>
              </button>
            </section>
          )}

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
