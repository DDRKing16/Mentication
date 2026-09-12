// @ts-check
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, LockKeyhole, UserRoundX, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLockup, MENTICATION_MIDNIGHT_COPPER_ASSET } from "@/components/Logo";
import SafetyFooter from "@/components/SafetyFooter";
import { completeOnboarding } from "@/lib/onboarding";
import { WELCOME_THEME } from "@/lib/homeTheme";

const TRUST = [
  { icon: LockKeyhole, label: "Private on this device" },
  { icon: UserRoundX, label: "No account required" },
  { icon: Timer, label: "Guided in minutes" },
];

export default function Welcome() {
  const navigate = useNavigate();

  const startReset = () => {
    completeOnboarding();
    navigate("/reset", { state: { immediate: true, direction: "calm", directionLabel: "Calm down" } });
  };
  const explore = () => {
    completeOnboarding();
    navigate("/");
  };

  return (
    <div className={`welcome-theme welcome-theme--${WELCOME_THEME} min-h-full bg-[var(--welcome-bg)] text-[var(--welcome-ink)]`}>
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
        <BrandLockup
          tagline
          tone="welcome"
          logoSrc={WELCOME_THEME === "midnight" ? MENTICATION_MIDNIGHT_COPPER_ASSET : undefined}
          logoBackground="var(--welcome-bg)"
        />

        <motion.main
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-1 flex-col justify-center py-12"
        >
          <h1 className="max-w-[20rem] font-clean text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.04em] text-balance">
            A reset that meets you where you are.
          </h1>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-[var(--welcome-soft)]">
            Choose what you need and Mentication will guide one clear next step, shaped to your time and setting.
          </p>

          <div className="mt-8 border-y border-[var(--welcome-divider)] py-4">
            {TRUST.map(({ icon: Icon, label }) => (
              <p key={label} className="flex min-h-9 items-center gap-3 text-sm font-medium text-[var(--welcome-soft)]">
                <Icon className="h-4 w-4 text-[var(--welcome-accent)]" strokeWidth={1.7} aria-hidden="true" />
                {label}
              </p>
            ))}
          </div>
        </motion.main>

        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={startReset} className="h-16 w-full rounded-full bg-[var(--welcome-button)] text-lg font-semibold text-[var(--welcome-button-ink)] soft-depth active:scale-95">
            Try a reset now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <button onClick={explore} className="no-tap min-h-12 rounded-full text-base font-medium text-[var(--welcome-soft)] transition-colors hover:text-[var(--welcome-ink)]">
            Explore first
          </button>
        </div>
        <SafetyFooter dark={WELCOME_THEME === "midnight"} />
      </div>
    </div>
  );
}