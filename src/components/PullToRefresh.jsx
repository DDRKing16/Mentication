import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";

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
      {(pull > 2 || refreshing) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-2 z-50 flex -translate-x-1/2 items-start justify-center"
          style={{ height: Math.max(pull, refreshing ? THRESHOLD : 0) }}
        >
          <RefreshCw
            className={"h-5 w-5 " + (refreshing ? "animate-spin text-primary" : "text-muted-foreground")}
            style={{ transform: `rotate(${pull * 3}deg)` }}
          />
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
