import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { X, HeartPulse, ShieldCheck, Lock } from "lucide-react";

export default function WellbeingNotice({ onClose, dark = false }) {
  const navigate = useNavigate();
  const card = dark ? "bg-[hsl(178_36%_13%)] text-cream border-cream/15" : "bg-card text-foreground border-border";
  const sub = dark ? "text-cream/65" : "text-muted-foreground";
  const inner = dark ? "border-cream/10 bg-white/5" : "border-border bg-background/60";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-5 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className={"w-full max-w-md rounded-3xl border p-6 pb-8 soft-depth " + card}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-heading text-xl font-medium tracking-tight">
            <HeartPulse className="h-5 w-5 text-destructive" /> Keeping you safe
          </span>
          <button onClick={onClose} aria-label="Close" className="no-tap opacity-60 transition-opacity hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className={"mt-4 text-sm leading-relaxed " + sub}>
          Mentication is a wellbeing companion — not a medical service, therapy, or emergency care. It doesn’t replace professional support or emergency services.
        </p>

        <div className={"mt-5 rounded-2xl border p-4 " + inner}>
          <p className="text-sm font-semibold">If you’re in crisis right now</p>
          <ol className={"mt-2 list-decimal space-y-1 pl-5 text-sm leading-relaxed " + sub}>
            <li>If you’re in immediate danger, call your local emergency number — 000 in Australia, 911 in the US, 999 in the UK.</li>
            <li>Reach a crisis line. You don’t have to be alone with this.</li>
            <li>Stay safe. If you can, be with someone you trust.</li>
          </ol>
          <button
            type="button"
            onClick={() => {
              onClose?.();
              navigate("/support");
            }}
            className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            <ShieldCheck className="h-4 w-4" /> Open crisis numbers
          </button>
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Find a crisis line outside Australia
          </a>
        </div>

        <div className={"mt-4 flex items-start gap-2 text-sm leading-relaxed " + sub}>
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Privacy-first: we store only the shifts you log, the practices you try, and your ratings — never the content of your reflections. You can delete everything any time from your profile.
          </p>
        </div>

        <button onClick={onClose} className="no-tap mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground active:scale-95">
          Got it
        </button>
      </motion.div>
    </div>
  );
}
