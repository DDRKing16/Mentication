import React, { useRef, useState } from "react";
import { motion } from "framer-motion";

const THRESHOLD = 70;

/**
 * Native-style pull-to-refresh wrapper. Only activates when the page is
 * scrolled to the very top; a downward drag reveals a spinner and, past the
 * threshold, awaits `onRefresh` before springing back.
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const handleStart = (e) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  };

  const handleMove = (e) => {
    if (!pulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      setPull(Math.min(delta * 0.5, 100));
    }
  };

  const handleEnd = async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      try {
        await onRefresh?.();
      } catch { /* ignore refresh errors */ }
      setRefreshing(false);
    }
    setPull(0);
  };

  return (
    <div
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      className="relative min-h-full"
    >
      {/* A soft breathing dot with a build-up ring, matching the app's own
          quiet loading language elsewhere, instead of a generic spinner
          icon borrowed wholesale from an icon library. */}
      {(pull > 2 || refreshing) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-2 z-50 flex -translate-x-1/2 items-start justify-center"
          style={{ height: Math.max(pull, refreshing ? THRESHOLD : 0) }}
        >
          <div className="relative grid h-6 w-6 place-items-center">
            <svg viewBox="0 0 24 24" className="absolute inset-0 h-6 w-6 -rotate-90">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/25" />
              <circle
                cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={refreshing ? "text-primary" : "text-primary/70"}
                strokeDasharray={62.8}
                strokeDashoffset={refreshing ? 0 : 62.8 * (1 - Math.min(pull / THRESHOLD, 1))}
              />
            </svg>
            <motion.span
              className="h-2.5 w-2.5 rounded-full bg-primary"
              animate={refreshing ? { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] } : { scale: 1, opacity: 0.9 }}
              transition={{ duration: 1.1, repeat: refreshing ? Infinity : 0, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}
      <motion.div
        animate={{ y: refreshing ? THRESHOLD : pull }}
        transition={{ type: "spring", stiffness: 500, damping: 40 }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
