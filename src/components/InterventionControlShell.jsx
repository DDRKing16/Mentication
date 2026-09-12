import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CircleStop, MoreHorizontal, Pause, Play, SlidersHorizontal, Volume2, VolumeX, X } from "lucide-react";
import AccessibilityPanel from "@/components/AccessibilityPanel";

export default function InterventionControlShell({
  id,
  goal,
  title,
  stage = 1,
  stages = 3,
  onBack,
  onExit,
  children,
  field,
  className = "",
  accent = "#a6f0c1",
  active = false,
  paused = false,
  onPause,
  audioOn,
  onAudio,
  onSimplify,
  simplifyLabel = "Make this easier",
  onDifferent,
  dark = true,
  quiet = false,
}) {
  const [showA11y, setShowA11y] = useState(false);
  const [showAdapt, setShowAdapt] = useState(false);

  const openAdapt = () => {
    if (active && !paused) onPause?.();
    setShowAdapt(true);
  };

  return (
    <div className={`${className} intervention-control-shell min-h-dvh text-white ${active ? "pb-32" : "pb-16"}`} style={{ "--intervention-accent": accent, "--nf-accent": accent, "--flag-accent": accent }} data-intervention={id} data-quiet={quiet || undefined}>
      {field}
      <header className="relative z-20 flex items-center justify-between gap-3 p-4 sm:p-6">
        <button onClick={onBack} aria-label="Go back" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/15 bg-black/20"><ArrowLeft className="h-5 w-5" /></button>
        <div className="min-w-0 text-center">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/50">{goal} flagship</p>
          <p className="truncate font-heading text-lg">{title}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowA11y(true)} aria-label="Accessibility options" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/15 bg-black/20"><MoreHorizontal className="h-5 w-5" /></button>
          <button onClick={onExit} aria-label="Exit intervention" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-white/15 bg-black/20"><X className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center gap-2 px-5" aria-label={`Stage ${stage} of ${stages}`}>
        {Array.from({ length: stages }, (_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index < stage ? "w-10 bg-[var(--intervention-accent)]" : "w-5 bg-white/15"}`} />)}
      </div>

      <main className="relative z-10">{children}</main>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full flex-col items-center gap-2 bg-gradient-to-t from-black/55 via-black/25 to-transparent px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button onClick={openAdapt} className="min-h-11 rounded-full px-5 text-sm font-medium text-white/68 underline-offset-4 hover:text-white hover:underline">This is not helping</button>
        {active && <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/45 p-1.5 shadow-2xl backdrop-blur-xl">
          {onPause && <button onClick={onPause} aria-label={paused ? "Resume" : "Pause"} className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-white/10">{paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}</button>}
          {onAudio && <button onClick={onAudio} aria-label={audioOn ? "Mute audio" : "Enable audio"} aria-pressed={audioOn} className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-white/10">{audioOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}
          <button onClick={openAdapt} aria-label="Adapt intervention" className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-white/10"><SlidersHorizontal className="h-5 w-5" /></button>
          <button onClick={onExit} aria-label="Stop intervention" className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-white/10"><CircleStop className="h-5 w-5" /></button>
        </div>}
      </div>

      <AnimatePresence>
        {showAdapt && <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAdapt(false)}>
          <motion.section role="dialog" aria-modal="true" aria-labelledby={`${id}-adapt-title`} onClick={(event) => event.stopPropagation()} initial={{ y: 28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} className="w-full max-w-md rounded-[2rem] border border-white/15 bg-[#071923] p-6 text-white shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--intervention-accent)]">Keep your agency</p>
            <h2 id={`${id}-adapt-title`} className="mt-2 font-heading text-2xl">What would fit better?</h2>
            <div className="mt-5 grid gap-2">
              {onSimplify && <button onClick={() => { onSimplify(); setShowAdapt(false); }} className="min-h-12 rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-left">{simplifyLabel}</button>}
              {onDifferent && <button onClick={() => { onDifferent(); setShowAdapt(false); }} className="min-h-12 rounded-2xl border border-white/15 bg-white/[0.06] px-4 text-left">Use a different mechanism</button>}
              <button onClick={() => { setShowAdapt(false); onExit?.(); }} className="min-h-12 rounded-2xl border border-white/15 px-4 text-left">Stop deliberately</button>
              <button onClick={() => setShowAdapt(false)} className="min-h-11 px-4 text-sm text-white/60">Continue here</button>
            </div>
          </motion.section>
        </motion.div>}
      </AnimatePresence>
      <AnimatePresence>{showA11y && <AccessibilityPanel onClose={() => setShowA11y(false)} dark={dark} />}</AnimatePresence>
    </div>
  );
}
