import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import FlowHomeButton from "@/components/FlowHomeButton";
import PreferencesRow from "@/components/PreferencesRow";
import { Button } from "@/components/ui/button";

export function BuildingResetScreen() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-gradient-to-b from-cream via-background to-background px-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-teal/40 to-indigo/40 breath-glow"
      >
        <Sparkles className="h-9 w-9 text-primary" strokeWidth={1.4} />
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="font-heading text-2xl text-primary tracking-tight"
      >
        Building your reset…
      </motion.p>
      <p className="text-muted-foreground">Tailoring a pathway just for you.</p>
    </div>
  );
}

export function NoSafeMatchScreen({ onAdjust }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <FlowHomeButton />
      <h1 className="font-heading text-3xl font-medium text-primary">No safe match for these settings</h1>
      <p className="max-w-md text-muted-foreground">
        Adjust the intensity or session preferences and try again. Mentication will not bypass hard eligibility rules to force a recommendation.
      </p>
      <Button onClick={onAdjust} className="rounded-full">Adjust settings</Button>
    </div>
  );
}

export function ResetOverview({ answers, isPrebuilt, pathway, setAnswers, onBegin }) {
  return (
    <div className="min-h-full bg-gradient-to-b from-cream via-background to-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex justify-end">
          <FlowHomeButton />
        </div>
        <h1 className="mt-3 font-heading text-[1.8rem] font-semibold leading-tight tracking-[-0.025em] text-primary text-balance sm:text-4xl">
          Your {answers.timeMin}-minute reset
        </h1>
        <p className="mt-2 max-w-lg text-[0.98rem] leading-relaxed text-muted-foreground text-balance">
          {isPrebuilt
            ? `${pathway.length} practice${pathway.length === 1 ? "" : "s"}, one at a time.`
            : "Starting with the best-fit practice. The next step will adapt after your check-in."}
        </p>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 rounded-[1.5rem] border border-border bg-card p-5 soft-depth"
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            <span>First activity</span>
            <span>{answers.timeMin} min</span>
          </div>
          <h2 className="mt-3 font-heading text-[1.35rem] font-semibold tracking-[-0.02em] text-foreground">
            {pathway[0]?.name}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pathway[0]?.why}</p>
        </motion.section>

        {!isPrebuilt && <PreferencesRow answers={answers} setAnswers={setAnswers} />}

        <div className="mt-auto flex justify-center pt-6">
          <Button
            size="lg"
            onClick={onBegin}
            data-sfx="select"
            className="h-16 w-full max-w-sm rounded-full bg-primary text-lg font-medium text-primary-foreground soft-depth active:scale-95"
          >
            Begin <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
