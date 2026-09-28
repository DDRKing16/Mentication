// "Your week" on Home: the seven days of this week, lit up on the days a
// practice was done. A quiet, visible sense of progress, never a guilt trip:
// an empty week just says it starts whenever you do.
import React, { useMemo } from "react";
import { computeLocalCalendarStreak } from "@/lib/insights";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function weekDays(now = new Date()) {
  // Monday-first week containing `now`, in local time.
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

export function summariseWeek(sessions = [], now = new Date()) {
  const practised = new Set(
    sessions
      .map((session) => new Date(session?.created_date))
      .filter((date) => !Number.isNaN(date.getTime()))
      .map(dayKey),
  );
  const todayKey = dayKey(now);
  const days = weekDays(now).map((date, index) => ({
    label: DAY_LABELS[index],
    done: practised.has(dayKey(date)),
    today: dayKey(date) === todayKey,
    future: date > now && dayKey(date) !== todayKey,
  }));
  const count = days.filter((day) => day.done).length;
  const streak = computeLocalCalendarStreak(sessions, { now });
  let line = "Your week starts whenever you do.";
  if (streak >= 2) line = `${streak} days in a row. Nice rhythm.`;
  else if (count === 1) line = "1 day this week.";
  else if (count > 1) line = `${count} days this week.`;
  return { days, count, streak, line };
}

export default function YourWeek({ sessions, onOpen }) {
  const week = useMemo(() => summariseWeek(sessions), [sessions]);
  return (
    <section className="px-5 pt-7">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Your week: ${week.line} Open your progress.`}
        className="w-full rounded-[24px] border border-[var(--home-ink)]/10 bg-white/60 px-5 py-4 text-left shadow-[0_10px_28px_-20px_rgba(17,43,80,0.45)] backdrop-blur"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[var(--home-ink)]/55">Your week</p>
          <p className="text-sm font-medium text-[var(--home-ink)]/80">{week.line}</p>
        </div>
        <ol className="mt-3 grid grid-cols-7 gap-2" aria-hidden="true">
          {week.days.map((day, index) => (
            <li key={index} className="flex flex-col items-center gap-1.5">
              <span
                className={`grid h-8 w-8 place-items-center rounded-full text-[0.7rem] font-semibold transition ${
                  day.done
                    ? "bg-[#E0715C] text-white shadow-[0_6px_14px_-8px_rgba(224,113,92,0.9)]"
                    : day.today
                      ? "border-2 border-[#E0715C]/60 text-[var(--home-ink)]/70"
                      : day.future
                        ? "border border-dashed border-[var(--home-ink)]/15 text-[var(--home-ink)]/30"
                        : "border border-[var(--home-ink)]/15 text-[var(--home-ink)]/45"
                }`}
              >
                {day.done ? "✓" : ""}
              </span>
              <span className={`text-[0.65rem] ${day.today ? "font-bold text-[var(--home-ink)]" : "text-[var(--home-ink)]/50"}`}>{day.label}</span>
            </li>
          ))}
        </ol>
      </button>
    </section>
  );
}
