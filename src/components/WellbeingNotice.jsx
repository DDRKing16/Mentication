import React from "react";
import AccessibleModal from "@/components/AccessibleModal";
import { X, HeartPulse, ShieldCheck, Lock } from "lucide-react";

export default function WellbeingNotice({ onClose, dark = false }) {
  const card = dark ? "bg-[hsl(178_36%_13%)] text-cream border-cream/15" : "bg-card text-foreground border-border";
  const sub = dark ? "text-cream/65" : "text-muted-foreground";
  const inner = dark ? "border-cream/10 bg-white/5" : "border-border bg-background/60";

  return (
    <AccessibleModal titleId="WellbeingNotice-title" onClose={onClose}>
      <div
        className={"w-full max-w-md rounded-3xl border p-6 pb-8 soft-depth " + card}
      >
        <div className="flex items-center justify-between">
          <h2 id="WellbeingNotice-title" className="flex items-center gap-2 font-heading text-xl font-medium tracking-tight">
            <HeartPulse className="h-5 w-5 text-destructive" /> Keeping you safe
          </h2>
          <button type="button" autoFocus onClick={onClose} aria-label="Close keeping you safe" className="no-tap flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-80 transition-opacity hover:opacity-100">
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
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            <ShieldCheck className="h-4 w-4" /> Find a crisis line near you
          </a>
        </div>

        <div className={"mt-4 flex items-start gap-2 text-sm leading-relaxed " + sub}>
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Your practice history, ratings, saved notes and plans stay on this device. Some practices also keep unfinished drafts. Delete app data from Profile; manage any exported backups separately. Optional website check-ins use delivery metadata, not your plan text.
          </p>
        </div>

        <button onClick={onClose} className="no-tap mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground active:scale-95">
          Got it
        </button>
      </div>
    </AccessibleModal>
  );
}