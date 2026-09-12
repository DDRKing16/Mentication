import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, ArrowRight,
  CloudRain, Sun, RefreshCw, Anchor, Target, Moon, HelpCircle,
} from "lucide-react";
import { HOME_CARDS } from "@/lib/interventions";
import SafetyFooter from "@/components/SafetyFooter";
import CrisisSupportCard from "@/components/CrisisSupportCard";
import { BrandLockup } from "@/components/Logo";
import PremiumTrustStrip from "@/components/PremiumTrustStrip";
import { completeOnboarding } from "@/lib/onboarding";

const ICONS = { CloudRain, Sun, RefreshCw, Anchor, Target, Moon, HelpCircle };

export default function Onboarding() {
  const navigate = useNavigate();

  const choose = (card) => {
    completeOnboarding();
    if (card.unsure) navigate("/reset", { state: { unsure: true } });
    else navigate("/reset", { state: { direction: card.direction, directionLabel: card.label } });
  };

  const immediate = () => {
    completeOnboarding();
    navigate("/reset", { state: { immediate: true, direction: "calm", directionLabel: "Calm down" } });
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <div className="mx-auto flex min-h-full max-w-3xl flex-col px-5 pt-12 pb-16 sm:px-8">
        <header className="flex items-center justify-center">
          <BrandLockup size="md" tagline />
        </header>
        <div className="mt-6 flex justify-center">
          <PremiumTrustStrip items={["Private on this device", "No account", "Start in under a minute"]} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 text-center"
        >
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal/30 to-indigo/30 breath-glow">
            <motion.div
              className="h-16 w-16 rounded-full bg-gradient-to-br from-teal/50 to-indigo/50"
              initial={false}
              animate={{ scale: [1, 1.12, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <h1 className="mt-8 font-heading text-[2.4rem] font-medium leading-[1.05] tracking-tight text-primary text-balance sm:text-5xl">
            Choose what you need,<br />then let’s begin.
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-muted-foreground text-balance">
            Step 2 of 2. Pick the closest fit and start right away — simple, private, and low-pressure.
          </p>
        </motion.div>

        <div className="mt-8">
          <CrisisSupportCard
            compact
            title="I need help right now"
            body="If a reset is not enough, reach crisis support immediately."
            actionLabel="Get help now"
          />
        </div>

        <button
          onClick={immediate}
          className="no-tap mx-auto mt-4 flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-5 py-2.5 text-sm font-medium text-primary transition-all hover:bg-primary/10 active:scale-95"
        >
          <Sparkles className="h-4 w-4" strokeWidth={1.8} /> Start a calming reset now
        </button>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {HOME_CARDS.map((c, i) => {
            const Icon = ICONS[c.id === "unsure" ? "HelpCircle" : { calm: "CloudRain", lift: "Sun", reset: "RefreshCw", ground: "Anchor", focus: "Target", sleep: "Moon" }[c.direction]];
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                onClick={() => choose(c)}
                className="no-tap group relative flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left transition-all duration-300 min-h-[7.5rem] hover:border-primary/30 hover:-translate-y-0.5 active:scale-[0.98]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block font-heading text-[1.05rem] font-medium leading-tight tracking-tight text-foreground">{c.label}</span>
                  <span className="block text-sm text-muted-foreground">{c.sub}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground">Everything in V1 is available without an account.</p>
          <button
            onClick={() => { completeOnboarding(); navigate("/library"); }}
            className="no-tap mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/30 active:scale-95"
          >
            Explore the library <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <SafetyFooter />
      </div>
    </div>
  );
}
