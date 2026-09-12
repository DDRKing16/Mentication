import React from "react";
import { motion } from "framer-motion";
import BreathingPacer from "@/components/BreathingPacer";
import GroundingStage from "@/components/GroundingStage";

// Each intervention renders a distinct, immersive "stage" so consecutive
// practices feel meaningfully different — not the same frame with different
// text. Modes derive from the intervention's category, each with its own
// ambient halo, central visual, motion, and instruction type:
//   breath  → breathing pacer (square shape for box/hold patterns)
//   sense   → radiating sensory rings + rotating dashed field (grounding)
//   body    → vertical body-scan glow inside a capsule (somatic)
//   mind    → reflective notebook card (cognitive / emotion)
//   lift    → rising warm particles (mood / energising)
//   focus   → crisp step counter with tick marks (task initiation)
//   connect → two overlapping warm circles (social)
//   ring    → countdown ring (default / holds)

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

export function stageModeFor(iv) {
  const c = iv?.category;
  if (c === "breathing") return "breath";
  if (c === "grounding") return "sense";
  if (c === "somatic") return "body";
  if (c === "cognitive") return "mind";
  if (c === "lift") return "lift";
  if (c === "focus") return "focus";
  if (c === "connection") return "connect";
  if (c === "emotion") return "mind";
  return "ring";
}

function breathShape(iv) {
  return iv?.mechanism === "paced-hold" ? "square" : "circle";
}

const MODE_LABEL = {
  breath: "Breathe",
  sense: "Notice",
  body: "Feel",
  mind: "Reflect",
  lift: "Move",
  focus: "Do",
  connect: "Connect",
  ring: "Hold",
};

const ACCENT_FOR = { breath: "teal", sense: "teal", body: "indigo", mind: "indigo", lift: "gold", focus: "teal", connect: "rose", ring: "teal" };
const ACCENT = {
  teal: { chip: "text-teal/80" },
  gold: { chip: "text-[hsl(40_60%_70%)]" },
  indigo: { chip: "text-[hsl(36_55%_72%)]" },
  rose: { chip: "text-[hsl(350_60%_72%)]" },
};
const HALO = {
  teal: "bg-[radial-gradient(circle,hsl(178_55%_45%/0.14),transparent_60%)]",
  indigo: "bg-[radial-gradient(circle,hsl(36_50%_55%/0.14),transparent_60%)]",
  gold: "bg-[radial-gradient(circle,hsl(40_60%_55%/0.16),transparent_60%)]",
  rose: "bg-[radial-gradient(circle,hsl(350_60%_55%/0.16),transparent_60%)]",
};

function Ring({ pct }) {
  const C = 2 * Math.PI * 46;
  return (
    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="46" fill="none" stroke="var(--intervention-muted, hsl(178 24% 28%))" strokeOpacity="0.28" strokeWidth="1.5" />
      <motion.circle
        cx="50" cy="50" r="46" fill="none" stroke="var(--intervention-accent, hsl(178 55% 50%))" strokeWidth="2" strokeLinecap="round"
        strokeDasharray={C}
        animate={{ strokeDashoffset: C * (1 - pct) }}
        transition={{ duration: 0.4, ease: "linear" }}
      />
    </svg>
  );
}

function CountdownRing({ step, stepRemaining, discreet, showTimer }) {
  const pct = step.holdSec ? Math.min(1, Math.max(0, 1 - stepRemaining / step.holdSec)) : 0;
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      {!discreet && (
        <motion.div
          className="absolute h-48 w-48 rounded-full border border-teal/10"
          animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      {!discreet && <div className="absolute h-52 w-52 rounded-full bg-[radial-gradient(circle,hsl(178_55%_45%/0.12),transparent_70%)]" />}
      <Ring pct={pct} />
      <div className="relative text-center">
        {showTimer ? (
          <span className="intervention-copy-muted font-heading text-3xl font-medium tabular-nums">{fmt(stepRemaining)}</span>
        ) : (
          <span className="block h-3 w-3 rounded-full bg-teal shadow-[0_0_16px_hsl(178_55%_45%/0.7)] animate-soft-pulse" />
        )}
      </div>
    </div>
  );
}

function GentleBreath({ running, discreet }) {
  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      <motion.div
        className="absolute h-44 w-44 rounded-full border border-teal/15"
        animate={{ scale: running ? [1, 1.2, 1] : 1, opacity: [0.4, 0.1, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute h-40 w-40 rounded-full bg-gradient-to-br from-teal/25 to-indigo/25"
        animate={{ scale: running ? [1, 1.12, 1] : 1, opacity: discreet ? 0.4 : running ? [0.6, 1, 0.6] : 0.6 }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative h-2.5 w-2.5 rounded-full bg-cream/80 shadow" />
    </div>
  );
}

function SenseRings({ running, discreet }) {
  return (
    <div className="relative flex h-64 w-64 items-center justify-center">
      <motion.span
        className="absolute h-56 w-56 rounded-full border border-dashed border-teal/15"
        animate={{ rotate: running ? 360 : 0 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-teal/30"
          style={{ height: 56, width: 56 }}
          animate={running ? { scale: [1, 4], opacity: [0.55, 0] } : { scale: 1, opacity: discreet ? 0.3 : 0.5 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeOut", delay: i * 0.9 }}
        />
      ))}
      <motion.span
        className="relative h-4 w-4 rounded-full bg-teal shadow-[0_0_22px_hsl(178_55%_45%/0.7)]"
        animate={{ scale: running ? [1, 1.3, 1] : 1 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function BodyScan({ running, discreet }) {
  return (
    <div className="relative flex h-64 w-40 items-center justify-center">
      <div className="absolute h-56 w-24 rounded-[6rem] border border-indigo/15 bg-[radial-gradient(circle,hsl(36_50%_50%/0.06),transparent_70%)]" />
      <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-indigo/40 to-transparent" />
      <motion.div
        className="absolute left-1/2 h-14 w-14 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(36_55%_65%/0.6),transparent_70%)]"
        animate={running ? { top: ["10%", "74%", "10%"] } : { top: "42%" }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative h-2 w-2 rounded-full bg-cream/70" />
    </div>
  );
}

function MindCard() {
  return (
    <div
      className="relative w-80 max-w-full rounded-2xl border border-cream/10 bg-cream/[0.04] px-6 py-5 backdrop-blur-md"
      style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 24px, hsl(30 30% 90% / 0.06) 25px)" }}
    >
      <div className="absolute left-3 top-0 h-full w-px bg-[hsl(4_70%_56%/0.3)]" />
      <div className="mb-3 flex items-center gap-2">
        <div className="h-px w-10 bg-cream/25" />
        <span className="intervention-copy-muted text-[0.62rem] uppercase tracking-[0.2em]">notebook</span>
      </div>
      <motion.span
        className="absolute right-5 top-5 h-2 w-2 rounded-full bg-[hsl(40_60%_65%)]"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function LiftParticles({ running }) {
  return (
    <div className="relative h-64 w-64 overflow-hidden">
      <div className="absolute bottom-0 left-1/2 h-24 w-48 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(40_60%_55%/0.22),transparent_70%)]" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <motion.span
          key={i}
          className="absolute bottom-6 rounded-full bg-[hsl(40_65%_65%)]"
          style={{ height: 4 + (i % 3) * 3, width: 4 + (i % 3) * 3, left: `${8 + i * 11}%` }}
          animate={running ? { y: [0, -230], opacity: [0, 0.95, 0] } : { y: 0, opacity: 0.4 }}
          transition={{ duration: 4 + (i % 4), repeat: Infinity, ease: "easeOut", delay: i * 0.5 }}
        />
      ))}
    </div>
  );
}

function FocusStep({ n, total, step, stepRemaining }) {
  const pct = step.holdSec ? Math.min(1, Math.max(0, 1 - stepRemaining / step.holdSec)) : 0;
  return (
    <div className="relative flex h-48 w-48 items-center justify-center">
      <Ring pct={pct} />
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 h-3 w-px bg-cream/15"
          style={{ transform: `rotate(${i * 30}deg) translateY(-5.6rem)`, transformOrigin: "center" }}
        />
      ))}
      <div className="relative text-center">
        <span className="intervention-copy-primary block font-heading text-4xl font-medium tabular-nums">{n}</span>
        <span className="intervention-copy-muted mt-1 block text-[0.62rem] uppercase tracking-[0.2em]">of {total}</span>
      </div>
    </div>
  );
}

function ConnectVenn({ running }) {
  return (
    <div className="relative flex h-48 items-center justify-center">
      <div className="absolute h-10 w-10 rounded-full bg-[radial-gradient(circle,hsl(40_70%_70%/0.5),transparent_70%)]" />
      <motion.span
        className="relative h-32 w-32 rounded-full border border-[hsl(40_60%_65%/0.4)] bg-[hsl(40_60%_60%/0.08)]"
        animate={running ? { x: [10, 0, 10] } : { x: 7 }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="relative h-32 w-32 -ml-9 rounded-full border border-[hsl(350_60%_65%/0.4)] bg-[hsl(350_60%_60%/0.08)]"
        animate={running ? { x: [-10, 0, -10] } : { x: -7 }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function StageVisual({ mode, iv, step, stepIndex, running, showTimer, stepRemaining, discreet, noBreathing }) {
  const label = MODE_LABEL[mode] || "Hold";
  const accentKey = ACCENT_FOR[mode] || "teal";
  const halo = HALO[accentKey];
  const isPace = mode === "breath" && step.pace && !noBreathing;
  const showTimerText = showTimer && !isPace && mode !== "focus";

  return (
    <div className="relative flex w-full flex-col items-center gap-8">
      <div className="text-center">
        <p className="intervention-copy-muted text-[0.65rem] font-medium uppercase tracking-[0.24em]">{label}</p>
        <h2 className="intervention-copy-primary mt-2 font-heading text-[2.15rem] font-medium leading-[1.1] tracking-[-0.02em] text-balance sm:text-[2.6rem]">
          {step.title}
        </h2>
      </div>

      <div className="relative flex min-h-[16rem] w-full items-center justify-center">
        <div className={"pointer-events-none absolute h-80 w-80 rounded-full " + halo} />

        {mode === "breath" &&
          (isPace ? (
            <BreathingPacer phases={step.pace} shape={breathShape(iv)} discreet={discreet} tone="cream" />
          ) : (
            <GentleBreath running={running} discreet={discreet} />
          ))}

        {mode === "sense" && (
          <GroundingStage step={step} stepRemaining={stepRemaining} running={running} discreet={discreet} />
        )}

        {mode === "body" && <BodyScan running={running} discreet={discreet} />}

        {mode === "mind" && <MindCard />}

        {mode === "lift" && <LiftParticles running={running} />}

        {mode === "focus" && (
          <FocusStep n={(stepIndex ?? 0) + 1} total={iv?.steps?.length || 1} step={step} stepRemaining={stepRemaining} />
        )}

        {mode === "connect" && <ConnectVenn running={running} />}

        {mode === "ring" && (
          <CountdownRing step={step} stepRemaining={stepRemaining} discreet={discreet} showTimer={showTimer} />
        )}
      </div>

      {showTimerText && (
        <span className="intervention-copy-muted font-heading text-sm tracking-[0.12em] tabular-nums">{fmt(stepRemaining)}</span>
      )}
    </div>
  );
}
