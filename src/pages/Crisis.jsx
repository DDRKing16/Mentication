import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, LifeBuoy, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

const NUMBERS = [
  { label: "Emergency services", number: "000", note: "If you’re in immediate danger" },
  { label: "Lifeline Australia", number: "13 11 14", note: "24/7 crisis support" },
  { label: "Beyond Blue", number: "1300 22 4636", note: "Anxiety & depression support" },
  { label: "Suicide Call Back Service", number: "1300 659 467", note: "For you or someone you support" },
];

export default function Crisis() {
  const navigate = useNavigate();
  return (
    <div className="min-h-full bg-gradient-to-b from-[hsl(178_40%_9%)] via-[hsl(178_36%_13%)] to-[hsl(178_42%_7%)] text-cream">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pt-10 pb-16">
        <button
          onClick={() => navigate(-1)}
          className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-cream/70 transition-colors hover:text-cream"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <LifeBuoy className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h1 className="mt-6 font-heading text-[2rem] font-medium leading-tight tracking-tight text-cream text-balance">
            If you’re in crisis right now
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-cream/70 text-balance">
            You don’t have to hold this alone. Reaching out is a sign of strength, and help is one call away.
          </p>
        </motion.div>

        <div className="mt-9 flex flex-col gap-3">
          {NUMBERS.map((n) => (
            <a
              key={n.label}
              href={`tel:${n.number.replace(/\s/g, "")}`}
              className="no-tap flex items-center gap-4 rounded-2xl border border-cream/10 bg-white/5 p-5 transition-all hover:border-[var(--mcn-gold)]/55 hover:bg-white/10 active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--mcn-gold)]/15 text-[#DDB977]">
                <Phone className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg font-medium text-cream">{n.label}</span>
                <span className="block text-sm text-cream/55">{n.note}</span>
                <span className="mt-2 block font-heading text-lg font-medium tabular-nums text-[#DDB977]">{n.number}</span>
              </span>
            </a>
          ))}
        </div>

        <p className="mt-3 text-center text-xs text-cream/40">
          Outside Australia? Find a local line at{" "}
          <a className="inline-flex min-h-11 items-center underline underline-offset-2" href="https://findahelpline.com" target="_blank" rel="noreferrer">
            findahelpline.com
          </a>
        </p>

        <div className="mt-10 rounded-2xl border border-cream/10 bg-white/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cream/60">
            <HeartPulse className="h-4 w-4" /> Wellbeing disclaimer
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Mentication is a self-regulation and wellbeing tool. It is not a medical device, a crisis service, or a substitute
            for professional mental-health care. If you’re in immediate danger, or having thoughts of ending your life,
            please contact one of the services above or your local emergency number right away.
          </p>
        </div>

        <Button
          size="lg"
          onClick={() => navigate("/reset", { state: { immediate: true, direction: "calm", directionLabel: "Calm down" } })}
          className="mt-8 h-14 w-full rounded-full bg-[var(--mcn-gold)] text-base font-medium text-[#102827] active:scale-95"
        >
          Try a calming reset instead
        </Button>
      </div>
    </div>
  );
}
