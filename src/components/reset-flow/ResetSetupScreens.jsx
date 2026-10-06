import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import FlowHomeButton from "@/components/FlowHomeButton";
import PreferencesRow from "@/components/PreferencesRow";
import { Button } from "@/components/ui/button";

export function BuildingResetScreen() {
  return (
    <div className="calmbg flex min-h-full flex-col items-center justify-center gap-6 px-6">
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
      <p className="text-muted-foreground">Finding a starting practice from your answers.</p>
    </div>
  );
}

export function NoSafeMatchScreen({ onAdjust }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <FlowHomeButton />
      <h1 className="font-heading text-3xl font-medium text-primary">No matching reset for these settings</h1>
      <p className="max-w-md text-muted-foreground">
        None of the available practices fits your goal, intensity, time and setting together. Keep your intensity honest. You can choose another goal or allow more time if that works for you, or return Home. Some practices are unavailable in your current setting.
      </p>
      <Button onClick={onAdjust} className="rounded-full">Adjust settings</Button>
    </div>
  );
}

export function ResetOverview({ answers, isPrebuilt, pathway, setAnswers, onBegin }) {
  return (
    <div className="calmbg min-h-full">
      <div className="mx-auto flex min-h-[100dvh] max-w-xl flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-8">
        <div className="flex justify-end">
          <FlowHomeButton />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="font-heading text-[1.8rem] font-semibold leading-tight tracking-[-0.025em] text-primary text-balance sm:text-4xl">
            {["happyBump", "progressive-muscle-relaxation-v2"].includes(pathway[0]?.id) ? "Your flexible reset" : `Your ${answers.timeMin}-minute reset`}
          </h1>
          <p className="mt-2 max-w-lg text-[0.98rem] leading-relaxed text-muted-foreground text-balance">
            {isPrebuilt
              ? `${pathway.length} practice${pathway.length === 1 ? "" : "s"}, one at a time.`
              : "A starting practice based on your answers. The next step can change after your check-in."}
          </p>

          {!isPrebuilt && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">You chose {answers.directionLabel || answers.direction}{Number.isFinite(answers.timeMin) ? ` and ${answers.timeMin} minutes` : ''}. Your current answers and any saved local feedback guide this starting suggestion. You can adapt it or stop.</p>}

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-[1.5rem] border border-border bg-card p-5 soft-depth"
          >
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <span>First activity</span>
              <span>{pathway[0]?.id === "progressive-muscle-relaxation-v2" ? "2–5" : pathway[0]?.durationMax ? `${pathway[0].durationMin}–${pathway[0].durationMax}` : pathway[0]?.durationMin} min</span>
            </div>
            <h2 className="mt-3 font-heading text-[1.35rem] font-semibold tracking-[-0.02em] text-foreground">
              {pathway[0]?.name}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{pathway[0]?.why}</p>
          </motion.section>

          {pathway[0]?.id === "happyBump" && <p className="mt-4 text-sm text-muted-foreground">Allow 5–15 minutes, depending on your walk and pace. For a shorter reset, keep the walk short or use Skip ahead. We’ll check in before suggesting anything else.</p>}
          {pathway[0]?.id === "progressive-muscle-relaxation-v2" && <p className="mt-4 text-sm text-muted-foreground">Choose short or full, with gentle tension or release only. Allow about 2–5 minutes; you can skip any area or stop.</p>}
          {!isPrebuilt && <PreferencesRow answers={answers} setAnswers={setAnswers} />}
        </div>

        <div className="flex justify-center pt-6">
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
