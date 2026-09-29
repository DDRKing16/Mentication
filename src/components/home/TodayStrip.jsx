// "Today strip": Your Week, the active programme and the one personalised
// suggestion, bundled into one compact block instead of three separate
// full-size cards. The programme and the suggestion sit side by side as two
// small tiles — same family as the category grid below (icon-in-a-circle,
// rounded card, short label) — rather than as two stacked text rows, so the
// whole thing reads as one considered piece instead of a list.
import React, { useMemo } from "react";
import { ArrowRight, CalendarDays, Play } from "lucide-react";
import { summariseWeek } from "@/components/home/YourWeek";
import { activeProgrammeId, getProgramme, programmeProgress, programmeStartedAt } from "@/lib/programmes";

function Tile({ onClick, eyebrow, eyebrowColor, iconBg, iconColor, icon: Icon, title, ariaLabel, cta }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="no-tap flex min-h-[6.75rem] min-w-0 flex-1 basis-0 flex-col justify-between overflow-hidden rounded-[20px] bg-[var(--home-card)] p-3.5 text-left shadow-[0_10px_24px_-18px_rgba(17,43,80,0.4)] transition-transform active:scale-[0.97]"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full" style={{ background: iconBg, color: iconColor }}>
        <Icon className="h-4 w-4" strokeWidth={1.8} fill={Icon === Play ? "currentColor" : "none"} />
      </span>
      <span className="mt-2 min-w-0">
        <span className="block truncate text-[0.58rem] font-bold uppercase tracking-[0.12em]" style={{ color: eyebrowColor }}>{eyebrow}</span>
        <span className="mt-0.5 block truncate text-[0.86rem] font-semibold leading-tight text-[var(--home-ink)]">{title}</span>
      </span>
      {cta}
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

  const today = programmeState?.progress.days[programmeState.progress.todayIndex];
  const canStartToday = today && today.status !== "tomorrow";

  return (
    <section className="px-5 pt-6">
      {/* Your Week keeps its own full-width row — the seven dots need the room. */}
      <button
        type="button"
        onClick={onOpenWeek}
        aria-label={`Your week: ${week.line} Open your progress.`}
        className="no-tap block w-full rounded-[20px] bg-[var(--home-card)] px-4 py-3 text-left shadow-[0_10px_24px_-18px_rgba(17,43,80,0.4)]"
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[var(--home-ink)]/50">Your week</span>
          <span className="truncate text-[0.76rem] font-medium text-[var(--home-ink)]/75">{week.line}</span>
        </span>
        <span className="mt-1.5 flex justify-between gap-1" aria-hidden="true">
          {week.days.map((day, index) => (
            <span
              key={index}
              className={`grid h-5 w-5 place-items-center rounded-full text-[0.55rem] font-semibold ${
                day.done
                  ? "bg-[#E0715C] text-white"
                  : day.today
                    ? "border-[1.5px] border-[#E0715C]/60 text-[var(--home-ink)]/70"
                    : "border border-[var(--home-ink)]/12 text-[var(--home-ink)]/30"
              }`}
            >
              {day.done ? "✓" : ""}
            </span>
          ))}
        </span>
      </button>

      {/* The programme and the suggestion side by side — two equal tiles,
          not two stacked lines of different weight competing for attention. */}
      <div className="mt-2.5 flex gap-2.5">
        {programmeState ? (
          <Tile
            onClick={canStartToday ? () => onStartDay(today) : onOpenProgramme}
            ariaLabel={`${programmeState.programme.title}, day ${programmeState.progress.todayIndex + 1}: ${today.intention}`}
            eyebrow={`Day ${programmeState.progress.todayIndex + 1} of ${programmeState.programme.days.length}`}
            eyebrowColor="#B94E3B"
            iconBg="rgba(224,113,92,0.15)"
            iconColor="#E0715C"
            icon={CalendarDays}
            title={today.intention}
            cta={
              canStartToday ? (
                <span className="mt-2 flex items-center gap-1 text-[0.72rem] font-semibold text-[#B94E3B]">Start <ArrowRight className="h-3 w-3" /></span>
              ) : (
                <span className="mt-2 block text-[0.7rem] text-[var(--home-ink)]/45">Opens tomorrow</span>
              )
            }
          />
        ) : (
          <Tile
            onClick={onOpenProgramme}
            ariaLabel="Try seven calmer days, a free programme"
            eyebrow="Programmes · free"
            eyebrowColor="#B94E3B"
            iconBg="rgba(224,113,92,0.15)"
            iconColor="#E0715C"
            icon={CalendarDays}
            title="Try seven calmer days"
            cta={<span className="mt-2 flex items-center gap-1 text-[0.72rem] font-semibold text-[#B94E3B]">Start <ArrowRight className="h-3 w-3" /></span>}
          />
        )}

        {quick && (
          <Tile
            onClick={quick.onClick}
            ariaLabel={quick.title}
            eyebrow={quick.eyebrow}
            eyebrowColor="var(--home-accent)"
            iconBg="var(--home-accent-soft)"
            iconColor="var(--home-accent)"
            icon={Play}
            title={quick.title}
            cta={<span className="mt-2 flex items-center gap-1 text-[0.72rem] font-semibold" style={{ color: "var(--home-accent)" }}>Begin <ArrowRight className="h-3 w-3" /></span>}
          />
        )}
      </div>
    </section>
  );
}
