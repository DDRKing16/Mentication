import {useAppBack} from '@/hooks/useAppBack';
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, LifeBuoy, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

const AUSTRALIAN_NUMBERS = [
  { label: "Emergency services (Australia)", number: "000", note: "If you’re in immediate danger in Australia" },
  { label: "Lifeline Australia", number: "13 11 14", note: "24/7 crisis support" },
  { label: "Beyond Blue (Australia)", number: "1300 22 4636", note: "Anxiety & depression support" },
  { label: "Suicide Call Back Service (Australia)", number: "1300 659 467", note: "For you or someone you support" },
];

export default function Crisis() {
  const navigate = useNavigate();
  const goBack=useAppBack();
  return (
    <div style={{ '--cream': '37 41% 87%' }} className="min-h-full bg-gradient-to-b from-[hsl(178_40%_9%)] via-[hsl(178_36%_13%)] to-[hsl(178_42%_7%)] text-cream">
      <div className="mx-auto flex min-h-full max-w-lg flex-col px-5 pt-10 pb-16">
        <button
          onClick={goBack}
          className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-cream/70 transition-colors hover:text-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDB977]"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
        </button>

        <div className="mt-4 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <LifeBuoy aria-hidden="true" className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <h1 className="mt-4 font-heading text-[2rem] font-medium leading-tight tracking-tight text-cream text-balance">
            If you’re in crisis right now
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-cream" id="local-emergency-guidance">
            If you or someone else is in immediate danger, call your local emergency number now.
          </p>
        </div>

        <section aria-labelledby="international-support-heading" className="mt-6 rounded-2xl border border-cream/20 bg-white/5 p-5">
          <h2 id="international-support-heading" className="font-heading text-xl font-medium">Outside Australia?</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">Choose a support service for the country you’re in.</p>
          <a className="mt-2 inline-flex min-h-11 items-center rounded-md text-base font-medium text-[#DDB977] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDB977]" href="https://findahelpline.com" target="_blank" rel="noreferrer">
            Find a helpline in your country (opens in a new tab)
          </a>
        </section>

        <section aria-labelledby="australian-support-heading" className="mt-6">
          <h2 id="australian-support-heading" className="font-heading text-xl font-medium">In Australia</h2>
          <p className="mt-2 text-sm leading-relaxed text-cream/80">The numbers below are Australian services.</p>
          <div className="mt-3 flex flex-col gap-3">
          {AUSTRALIAN_NUMBERS.map((n) => (
            <a
              key={n.label}
              href={`tel:${n.number.replace(/\s/g, "")}`}
              className="no-tap flex items-center gap-4 rounded-2xl border border-cream/10 bg-white/5 p-5 transition-all hover:border-[var(--mcn-gold)]/55 hover:bg-white/10 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#DDB977]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--mcn-gold)]/15 text-[#DDB977]">
                <Phone aria-hidden="true" className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg font-medium text-cream">{n.label}</span>
                <span className="block text-sm text-cream/80">{n.note}</span>
                <span className="mt-2 block font-heading text-lg font-medium tabular-nums text-[#DDB977]">{n.number}</span>
              </span>
            </a>
          ))}
          </div>
        </section>

        <div className="mt-10 rounded-2xl border border-cream/10 bg-white/5 p-5">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-cream/60">
            <HeartPulse aria-hidden="true" className="h-4 w-4" /> Wellbeing disclaimer
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/70">
            Mentication is a self-regulation and wellbeing tool. It is not a medical device, a crisis service, or a substitute
            for professional mental-health care. If you’re in immediate danger, or having thoughts of ending your life,
            please contact one of the services above or your local emergency number right away.
          </p>
        </div>

        <p className="mt-8 text-sm leading-relaxed text-cream/80">A practice can support you while you seek help. It does not replace urgent care or contacting someone who can help keep you safe.</p>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate("/reset", { state: { immediate: true, direction: "calm", directionLabel: "Calm down" } })}
          className="mt-3 h-auto min-h-14 w-full whitespace-normal rounded-full border-cream/40 bg-transparent py-3 text-base font-medium text-cream hover:bg-white/10 hover:text-cream active:scale-95"
        >
          Optional calming practice
        </Button>
      </div>
    </div>
  );
}
