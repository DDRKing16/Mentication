import React, { useEffect, useState } from "react";
import { ArrowRight, MoonStar, RotateCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { clearNightChannelFeedbackPrompt, clearTomorrowParkingItem, getActiveFlagship, getNightChannelFeedbackPrompt, getTomorrowParkingItem, rememberFlagshipEvent } from "@/lib/flagshipMemory";
import { FLAGSHIP_REGISTRY } from "@/lib/flagshipRegistry";

const PARKING_REOPEN_DELAY = 4 * 60 * 60 * 1000;

export default function FlagshipReturnCard() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const [parked, setParked] = useState(null);
  const [nightFeedback, setNightFeedback] = useState(null);

  useEffect(() => {
    const refresh = () => {
      setActive(getActiveFlagship());
      setParked(getTomorrowParkingItem());
      setNightFeedback(getNightChannelFeedbackPrompt());
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  const meta = active?.interventionId ? FLAGSHIP_REGISTRY[active.interventionId] : null;
  const parkedAt = parked?.createdAt ? new Date(parked.createdAt).getTime() : 0;
  const showParked = !!parked?.item && Date.now() - parkedAt >= PARKING_REOPEN_DELAY;
  const nightAt = nightFeedback?.createdAt ? new Date(nightFeedback.createdAt).getTime() : 0;
  const showNightFeedback = !!nightFeedback && Date.now() - nightAt >= PARKING_REOPEN_DELAY;
  const launch = (interventionId) => {
    const target = FLAGSHIP_REGISTRY[interventionId];
    navigate("/reset", { state: { prebuilt: true, pathway: [interventionId], direction: target.primaryGoal, directionLabel: target.displayName, intensity: 5, whereFelt: "both", timeMin: 6, audio: "yes" } });
  };

  if (showNightFeedback && (!active?.away || !meta)) {
    const answer = (value) => {
      rememberFlagshipEvent({ interventionId: "nightChannel", options: { morningFeedback: value, engagement: nightFeedback.engagement, fade: nightFeedback.fade } });
      clearNightChannelFeedbackPrompt();
      setNightFeedback(null);
    };
    return <section className="mx-[18px] -mt-2 mb-5 rounded-[1.6rem] border border-[var(--mcn-emerald)]/15 bg-white/75 p-4 shadow-[0_18px_50px_-34px_rgba(4,48,39,.7)] backdrop-blur">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[var(--mcn-emerald)]/55">Optional daytime feedback</p>
      <h2 className="mt-1 font-heading text-lg font-medium">How did Night Channel fit?</h2>
      <p className="mt-1 text-sm text-[var(--mcn-emerald)]/65">No sleep time is requested or inferred.</p>
      <div className="mt-4 grid grid-cols-2 gap-2">{["Worth using again","Too interesting","Not interesting enough","Fade too early","Fade too late","Topic did not fit"].map(value=><button key={value} onClick={()=>answer(value)} className="min-h-11 rounded-xl border border-[var(--mcn-emerald)]/15 px-3 text-left text-xs text-[var(--mcn-emerald)]">{value}</button>)}</div>
      <button onClick={()=>answer("dismissed")} className="mt-3 min-h-11 w-full text-sm text-[var(--mcn-emerald)]/55">Not now</button>
    </section>;
  }

  if (showParked && (!active?.away || !meta)) {
    return <section className="mx-[18px] -mt-2 mb-5 rounded-[1.6rem] border border-[var(--mcn-emerald)]/15 bg-white/75 p-4 shadow-[0_18px_50px_-34px_rgba(4,48,39,.7)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--mcn-emerald)] text-white"><MoonStar className="h-4 w-4"/></div>
        <div className="min-w-0 flex-1"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[var(--mcn-emerald)]/55">Reopened in daytime</p><h2 className="mt-1 font-heading text-lg font-medium">A parked item is ready</h2><p className="mt-1 text-sm text-[var(--mcn-emerald)]/65">Turn it into one easy action when you choose. Its private text stays hidden on this card.</p></div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={()=>{ clearTomorrowParkingItem(); setParked(null); launch("nextAction"); }} className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[var(--mcn-emerald)] px-4 text-sm font-semibold text-white">Open daytime step <ArrowRight className="ml-2 h-4 w-4"/></button>
        <button aria-label="Delete parked item" onClick={()=>{ clearTomorrowParkingItem(); setParked(null); }} className="grid min-h-11 min-w-11 place-items-center rounded-full border border-[var(--mcn-emerald)]/20 text-[var(--mcn-emerald)]"><Trash2 className="h-4 w-4"/></button>
      </div>
    </section>;
  }

  if (!active?.away || !meta) return null;
  return <section className="mx-[18px] -mt-2 mb-5 rounded-[1.6rem] border border-[var(--mcn-emerald)]/15 bg-white/75 p-4 shadow-[0_18px_50px_-34px_rgba(4,48,39,.7)] backdrop-blur">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--mcn-emerald)] text-white"><RotateCcw className="h-4 w-4"/></div>
      <div className="min-w-0 flex-1"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[var(--mcn-emerald)]/55">Your action is waiting</p><h2 className="mt-1 font-heading text-lg font-medium">Return to {meta.displayName}</h2><p className="mt-1 text-sm text-[var(--mcn-emerald)]/65">Tell Mentication what happened or adjust the move without starting over.</p></div>
    </div>
    <button onClick={()=>launch(active.interventionId)} className="mt-4 flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--mcn-emerald)] px-4 text-sm font-semibold text-white">Return <ArrowRight className="ml-2 h-4 w-4"/></button>
  </section>;
}
