// Home card for programmes: today's day of the programme in progress, or an
// invitation to start one.
import React, { useMemo } from "react";
import { ArrowRight, CalendarDays } from "lucide-react";
import { activeProgrammeId, getProgramme, programmeProgress, programmeStartedAt } from "@/lib/programmes";

export default function ProgrammeCard({ sessions, onOpen, onStartDay }) {
  const state = useMemo(() => {
    const id = activeProgrammeId();
    const programme = id ? getProgramme(id) : null;
    if (!programme) return null;
    const progress = programmeProgress(programme, sessions, programmeStartedAt(id));
    return { programme, progress };
  }, [sessions]);

  if (!state || state.progress.finished) {
    return (
      <section className="px-5 pt-4">
        <button type="button" onClick={onOpen} className="flex w-full items-center justify-between gap-4 rounded-[24px] border border-[var(--home-ink)]/10 bg-white/70 p-6 text-left shadow-[0_12px_32px_-22px_rgba(17,43,80,0.45)]">
          <span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-[#B94E3B]">Programmes · a little each day</span>
            <span className="mt-1 block font-serif text-[22px] font-bold leading-tight text-[var(--home-ink)]">Try seven calmer days</span>
            <span className="mt-1 block text-[12px] text-[var(--home-ink)]/70">One short practice a day. Free.</span>
          </span>
          <CalendarDays className="h-7 w-7 shrink-0 text-[#E0715C]" />
        </button>
      </section>
    );
  }

  const { programme, progress } = state;
  const today = progress.days[progress.todayIndex];
  const dayNumber = progress.todayIndex + 1;
  const waiting = today.status === "tomorrow";
  return (
    <section className="px-5 pt-4">
      <div className="rounded-[24px] border border-[#E0715C]/35 bg-white/80 p-6 shadow-[0_0_0_4px_rgba(224,113,92,0.08),0_14px_34px_-22px_rgba(224,113,92,0.55)]">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-[#B94E3B]">{programme.title} · day {dayNumber} of {programme.days.length}</span>
          <span className="mt-1 block font-serif text-[22px] font-bold leading-tight text-[var(--home-ink)]">{today.intention}</span>
          <span className="mt-1 block text-[12px] text-[var(--home-ink)]/70">{waiting ? `Today's done. Day ${dayNumber} opens tomorrow.` : today.name}</span>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--home-ink)]/10"><span className="block h-full rounded-full bg-[#E0715C]" style={{ width: `${(progress.doneCount / programme.days.length) * 100}%` }} /></span>
        </button>
        {!waiting && (
          <button type="button" onClick={() => onStartDay(today)} className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[var(--home-ink)] text-sm font-semibold text-white">
            Start day {dayNumber} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </section>
  );
}
