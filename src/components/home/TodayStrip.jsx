// "Today strip": Your Week, the active programme and the one personalised
// suggestion, bundled into a single compact card instead of three separate
// full-size ones. The six category buttons below are the main feature of
// Home; this exists to get out of their way, not compete with them.
import React, { useMemo } from "react";
import { ArrowRight, CalendarDays, Play } from "lucide-react";
import { summariseWeek } from "@/components/home/YourWeek";
import { activeProgrammeId, getProgramme, programmeProgress, programmeStartedAt } from "@/lib/programmes";

function Row({ onClick, children, ariaLabel }) {
  return (
    <button type="button" onClick={onClick} aria-label={ariaLabel} className="no-tap flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-[var(--home-ink)]/5">
      {children}
    </button>
  );
}

export default function TodayStrip({ sessions, onOpenWeek, onOpenProgramme, onStartDay, quick }) {
  const week = useMemo(() => summariseWeek(sessions), [sessions]);

  const programmeState = useMemo(() => {
    const id = activeProgrammeId();
    const programme = id ? getProgramme(id) : null;
    if (!programme) return null;
    const progress = programmeProgress(programme, sessions, programmeStartedAt(id));
    if (progress.finished) return null;
    return { programme, progress };
  }, [sessions]);

  return (
    <section className="px-5 pt-6">
      <div className="divide-y divide-[var(--home-ink)]/8 overflow-hidden rounded-[24px] border border-[var(--home-ink)]/10 bg-white/65 shadow-[0_10px_28px_-20px_rgba(17,43,80,0.45)] backdrop-blur">
        <Row onClick={onOpenWeek} ariaLabel={`Your week: ${week.line} Open your progress.`}>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[var(--home-ink)]/55">Your week</span>
              <span className="text-[0.72rem] font-medium text-[var(--home-ink)]/75">{week.line}</span>
            </span>
            <span className="mt-1.5 grid grid-cols-7 gap-1" aria-hidden="true">
              {week.days.map((day, index) => (
                <span key={index} className="flex flex-col items-center gap-0.5">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[0.55rem] font-semibold ${
                      day.done
                        ? "bg-[#E0715C] text-white"
                        : day.today
                          ? "border-[1.5px] border-[#E0715C]/60 text-[var(--home-ink)]/70"
                          : "border border-[var(--home-ink)]/15 text-[var(--home-ink)]/35"
                    }`}
                  >
                    {day.done ? "✓" : ""}
                  </span>
                  <span className={`text-[0.55rem] ${day.today ? "font-bold text-[var(--home-ink)]" : "text-[var(--home-ink)]/45"}`}>{day.label}</span>
                </span>
              ))}
            </span>
          </span>
        </Row>

        {programmeState ? (
          // A row with two real actions (open the programme, or start today's
          // day) — two sibling buttons, not a button nested inside a button.
          <div className="flex w-full items-center gap-3 px-4 py-3">
            <button
              type="button"
              onClick={onOpenProgramme}
              aria-label={`${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}`}
              className="no-tap flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E0715C]/15 text-[#E0715C]"><CalendarDays className="h-4 w-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#B94E3B]">Day {programmeState.progress.todayIndex + 1} of {programmeState.programme.days.length}</span>
                <span className="block truncate text-[0.82rem] font-semibold text-[var(--home-ink)]">{programmeState.progress.days[programmeState.progress.todayIndex].intention}</span>
              </span>
            </button>
            {programmeState.progress.days[programmeState.progress.todayIndex].status === "tomorrow" ? (
              <span className="shrink-0 text-[0.68rem] text-[var(--home-ink)]/55">Tomorrow</span>
            ) : (
              <button
                type="button"
                onClick={() => onStartDay(programmeState.progress.days[programmeState.progress.todayIndex])}
                className="no-tap flex shrink-0 items-center gap-1 rounded-full bg-[var(--home-ink)] px-3 py-1.5 text-[0.72rem] font-semibold text-white active:scale-95"
              >
                Start <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <Row onClick={onOpenProgramme} ariaLabel="Try seven calmer days, a free programme">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E0715C]/15 text-[#E0715C]"><CalendarDays className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#B94E3B]">Programmes · free</span>
              <span className="block truncate text-[0.82rem] font-semibold text-[var(--home-ink)]">Try seven calmer days</span>
            </span>
          </Row>
        )}

        {quick && (
          <Row onClick={quick.onClick} ariaLabel={quick.title}>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--home-accent)]/15 text-[var(--home-accent)]"><Play className="h-3.5 w-3.5 translate-x-[1px]" fill="currentColor" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[var(--home-accent)]">{quick.eyebrow}</span>
              <span className="block truncate text-[0.82rem] font-semibold text-[var(--home-ink)]">{quick.title}</span>
            </span>
          </Row>
        )}
      </div>
    </section>
  );
}
