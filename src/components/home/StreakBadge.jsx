// @ts-check
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sessionStore } from "@/lib/localData";
import { getStreakStats } from "@/lib/streakStats";

/**
 * Daily-streak counter, overlaid on the home screen above the sandboxed
 * HomeFrame document (visible without scrolling, beside the greeting).
 * Hidden entirely at 0 — never shown as "0 days". Derived live from session
 * history (see computeLocalCalendarStreak), so it always agrees with
 * whatever else on the device reads the same streak.
 */
export default function StreakBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let live = true;
    const refresh = () => {
      sessionStore.list("-created_date", 500).then((sessions) => {
        if (!live) return;
        setCount(getStreakStats(sessions).currentStreak);
      }).catch(() => {});
    };
    refresh();
    window.addEventListener("mentation:sessions-changed", refresh);
    return () => { live = false; window.removeEventListener("mentation:sessions-changed", refresh); };
  }, []);

  if (count <= 0) return null;

  return (
    <div
      className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 backdrop-blur-sm"
      aria-label={`${count} day streak`}
    >
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C9A84C" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 3c-1.2 3-4 4.6-4 8.2a4 4 0 0 0 8 0c0-1.1-.3-2-.8-2.8.2 1.6-.5 2.6-1.2 3-.5-2.6-1-3.8-2-5.4Z" />
      </svg>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="font-heading text-base leading-none text-[#F5EFE0]"
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <span className="font-body text-xs font-light leading-none text-[#F5EFE0]/80">days</span>
    </div>
  );
}
