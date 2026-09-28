// Shown once on Home, straight after someone's first finished reset: it names
// the win, then offers the next steps that turn it into a habit (an evening
// reminder, the free seven-day programme) and, gently, the Plus trial.
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bell, CalendarDays, Sparkles, X } from "lucide-react";
import { enableDailyReminder, formatReminderTime, getReminderPrefs } from "@/lib/reminders";

const SEEN_KEY = "mentication.firstwin.v1";

export function firstWinSeen() {
  try { return localStorage.getItem(SEEN_KEY) === "1"; } catch { return true; }
}

function markSeen() {
  try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* storage unavailable */ }
}

/**
 * Only for people who are genuinely new: one to three finished sessions, card
 * not yet dismissed, and no sign they already have rhythm going (an active
 * programme, or a two-day streak) — otherwise "your first reset" reads as
 * confused rather than encouraging.
 */
export const shouldShowFirstWin = (sessionCount, seen, { hasActiveProgramme = false, streak = 0 } = {}) =>
  !seen && sessionCount >= 1 && sessionCount <= 3 && !hasActiveProgramme && streak < 2;

export default function FirstWinCard({ sessionCount, plusActive, hasActiveProgramme, streak, onProgramme, onPlus }) {
  const [hidden, setHidden] = useState(() => firstWinSeen());
  const [reminderNote, setReminderNote] = useState("");
  if (hidden || !shouldShowFirstWin(sessionCount, false, { hasActiveProgramme, streak })) return null;

  const close = () => { markSeen(); setHidden(true); };
  const remind = async () => {
    const { hour, minute } = getReminderPrefs();
    const result = await enableDailyReminder(hour, minute).catch(() => ({ ok: false, reason: "error" }));
    if (result.reason === "preview") setReminderNote("Saved. Reminders arrive in the iPhone app.");
    else if (result.ok) setReminderNote(`Done. A gentle nudge each evening at ${formatReminderTime(hour, minute)}. Change it any time in Settings.`);
    else if (result.reason === "denied") setReminderNote("Notifications are off for Mentication. You can turn them on in your iPhone's Settings.");
    else setReminderNote("That didn't work just now. You can set it any time in Settings.");
  };
  const go = (fn) => () => { markSeen(); fn(); };

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#112b50] via-[#2a3f6e] to-[#E0715C] p-6 text-white shadow-[0_24px_50px_-28px_rgba(17,43,80,0.9)]">
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
        <button type="button" onClick={close} aria-label="Not now" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-white/70 hover:text-white">
          <X className="h-5 w-5" />
        </button>
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-white/70">Your first reset</p>
        <h2 className="mt-2 pr-8 font-heading text-[1.7rem] font-medium leading-tight">You did it.</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/80">That's how Mentication works: a few minutes, whenever you need it. A little each day is what makes it stick.</p>

        <div className="mt-5 space-y-2.5">
          <button type="button" onClick={remind} disabled={!!reminderNote} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white/15 px-4 text-left text-sm font-semibold backdrop-blur disabled:opacity-70">
            <Bell className="h-4 w-4 shrink-0" /> Remind me each evening
          </button>
          {reminderNote && <p className="px-1 text-xs leading-relaxed text-white/80" role="status">{reminderNote}</p>}
          <button type="button" onClick={go(onProgramme)} className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left text-sm font-semibold text-[#112b50]">
            <CalendarDays className="h-4 w-4 shrink-0 text-[#E0715C]" /> Try seven calmer days <span className="ml-auto text-xs font-medium text-[#112b50]/60">Free</span>
          </button>
        </div>

        {!plusActive && (
          <button type="button" onClick={go(onPlus)} className="mt-4 flex min-h-11 items-center gap-2 text-left text-xs font-medium text-white/85 underline-offset-4 hover:underline">
            <Sparkles className="h-3.5 w-3.5 shrink-0" /> Want to go deeper? Try Plus free for 7 days.
          </button>
        )}
      </div>
    </motion.section>
  );
}
