// A slim, dismissible one-line ribbon noting real, meaningful redesign
// work — shown once per version, never again once dismissed or read.
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

const KEY = "mentication.whatsNewSeen.v1";
const VERSION = "home-redesign-2026-09";

export default function WhatsNewRibbon() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(KEY) === VERSION; } catch { return true; }
  });
  const dismiss = () => {
    try { localStorage.setItem(KEY, VERSION); } catch { /* unavailable */ }
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden px-5 pt-4"
        >
          <div className="flex items-center gap-2 rounded-full bg-[var(--home-ink)]/6 px-3.5 py-2 text-[0.76rem] text-[var(--home-ink)]/80">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-[var(--home-accent)]" />
            <span className="min-w-0 flex-1 truncate">Home just got a redesign — take a look around.</span>
            <button type="button" onClick={dismiss} aria-label="Dismiss" className="no-tap grid h-6 w-6 shrink-0 place-items-center rounded-full text-[var(--home-ink)]/50 hover:text-[var(--home-ink)]">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
