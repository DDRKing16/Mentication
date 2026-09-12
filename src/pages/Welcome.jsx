import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, HeartHandshake, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/Logo";
import CrisisSupportCard from "@/components/CrisisSupportCard";
import PremiumTrustStrip from "@/components/PremiumTrustStrip";
import { completeWelcome } from "@/lib/onboarding";

const SLIDES = [
  {
    icon: Sparkles,
    title: "A moment, just for you",
    body: "Tell Mentication what you need right now. In under a minute you’ll get a guided reset shaped to your time, your setting, and how you’re feeling.",
  },
  {
    icon: HeartHandshake,
    title: "It meets you where you are",
    body: "Racing mind, tense body, can’t switch off, can’t get going — whatever’s in the way, there’s a pathway for it. No jargon, no pressure.",
  },
  {
    icon: ShieldCheck,
    title: "Yours, and private",
    body: "Mentication is a wellbeing tool, not a replacement for professional care. Your sessions stay yours, and you can erase them any time.",
  },
];

export default function Welcome() {
  const navigate = useNavigate();
  const [i, setI] = useState(0);
  const slide = SLIDES[i];
  const Icon = slide.icon;
  const last = i === SLIDES.length - 1;

  const finish = () => {
    completeWelcome();
    navigate("/onboarding");
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-14 pb-12">
        <BrandLockup />
        <div className="mt-6">
          <PremiumTrustStrip items={["Private on this device", "No account", "Guided in minutes"]} />
        </div>

        <div className="flex flex-1 flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon className="h-7 w-7" strokeWidth={1.5} />
              </span>
              <h1 className="mt-7 font-heading text-[2rem] font-medium leading-tight tracking-tight text-primary text-balance">
                {slide.title}
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-lg leading-relaxed text-muted-foreground text-balance">
                {slide.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-center gap-2">
            {SLIDES.map((_, idx) => (
              <span
                key={idx}
                className={"h-1.5 rounded-full transition-all " + (idx === i ? "w-7 bg-primary" : "w-1.5 bg-secondary")}
              />
            ))}
          </div>

          {last ? (
            <div className="flex flex-col gap-2.5">
              <Button size="lg" onClick={finish} className="h-16 w-full rounded-full bg-primary text-lg font-medium text-primary-foreground soft-depth active:scale-95">
                Choose what you need <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={finish}
                className="no-tap text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip
              </button>
              <Button size="lg" onClick={() => setI(i + 1)} className="h-14 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground soft-depth active:scale-95">
                Continue <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
          <CrisisSupportCard
            compact
            title="In crisis right now?"
            body="Skip the onboarding and reach support immediately."
          />
        </div>
      </div>
    </div>
  );
}