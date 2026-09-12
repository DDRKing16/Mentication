// =====================================================================
// PRODUCTION-LOCKED · Box Breathing V2 (approved benchmark)
// Premium polish pass requested 29 Aug 2026.
// Timing, narration and 4·4·4·4 pacing remain unchanged.
// =====================================================================
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { haptic, setHapticsEnabled } from "@/lib/feedback";
import BoxBreathingV2BreathLoom, {
  getBoxBreathingV2BreathState,
  updateBoxBreathingV2BreathLoom,
} from "@/components/BoxBreathingV2BreathLoom";
import {
  BOX_V2_SQUARE_STYLE,
  BOX_V2_PATH_D,
} from "@/lib/boxV2Layout";

// One master clock drives the full experience. Nothing below owns an
// independent breathing timer, which keeps the glass, tracer, phase text and
// environmental light perfectly locked together.
const PHASE_MS = 4000;
const ROUND_MS = PHASE_MS * 4;
const DEFAULT_ROUNDS = 4;
const TRAIL_LENGTH = 0.085;

const PHASE_LABELS = ["Breathe in", "Hold", "Breathe out", "Hold"];
const PHASE_NUMBERS = [4, 4, 4, 4];

export default function BoxBreathingV2Pacer({
  running = true,
  discreet = false,
  onComplete,
  rounds = DEFAULT_ROUNDS,
}) {
  const a11y = useAccessibilityPrefs();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [rewardPulse, setRewardPulse] = useState(0);
  const phaseTone =
    phaseIndex === 0
      ? "rgba(214, 250, 233, 1)"
      : phaseIndex === 1
        ? "rgba(230, 242, 238, 0.95)"
        : phaseIndex === 2
          ? "rgba(238, 233, 216, 0.98)"
          : "rgba(226, 246, 238, 0.95)";

  const loomRef = useRef(null);
  const pathRef = useRef(null);
  const trailRef = useRef(null);
  const dotRef = useRef(null);
  const tracerSvgRef = useRef(null);
  const playerRootRef = useRef(null);
  const LRef = useRef(0);
  const elapsedRef = useRef(0);
  const lastRef = useRef(null);
  const lastIndexRef = useRef(-1);
  const completedRoundRef = useRef(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const totalMs = rounds * ROUND_MS;

  useEffect(() => {
    setHapticsEnabled(!a11y.prefs.reducedMotion);
  }, [a11y.prefs.reducedMotion]);

  // Seed every moving layer before paint so there is no first-frame jump.
  useLayoutEffect(() => {
    playerRootRef.current = document.querySelector(".box-v2-player");
    const p = pathRef.current;
    if (p && typeof p.getTotalLength === "function") LRef.current = p.getTotalLength();
    if (pathRef.current) pathRef.current.style.strokeDashoffset = "1";
    if (trailRef.current) {
      trailRef.current.style.strokeDashoffset = String(TRAIL_LENGTH);
      trailRef.current.style.opacity = "0";
    }
    if (dotRef.current) dotRef.current.style.opacity = "0";

    const startPoint =
      p && LRef.current > 0 && typeof p.getPointAtLength === "function"
        ? p.getPointAtLength(0)
        : null;

    const visual = getBoxBreathingV2BreathState(0, 0, a11y.prefs.reducedMotion);
    if (tracerSvgRef.current) {
      tracerSvgRef.current.style.transform = `scaleX(${visual.scaleX}) scaleY(${visual.scaleY})`;
    }
    if (playerRootRef.current) {
      playerRootRef.current.style.setProperty("--box-v2-fullness", visual.fullness.toFixed(4));
    }

    updateBoxBreathingV2BreathLoom(loomRef.current, {
      phaseIndex: 0,
      phaseProgress: 0,
      completedCycles: 0,
      tracerPoint: startPoint,
      trackOpacity: 0,
      reducedMotion: a11y.prefs.reducedMotion,
    });
  }, [a11y.prefs.reducedMotion]);

  // Master clock: tracing, breathing scale, environmental light and labels all
  // derive from this elapsed value. React only re-renders on phase/cycle edges.
  useEffect(() => {
    let raf;
    const loop = (now) => {
      if (lastRef.current == null) lastRef.current = now;
      const dt = now - lastRef.current;
      lastRef.current = now;

      if (running && !doneRef.current) {
        elapsedRef.current = Math.min(elapsedRef.current + dt, totalMs);
        const inRound = elapsedRef.current % ROUND_MS;
        const index = Math.min(PHASE_LABELS.length - 1, Math.floor(inRound / PHASE_MS));
        const progress = (inRound - index * PHASE_MS) / PHASE_MS;
        const visual = getBoxBreathingV2BreathState(index, progress, a11y.prefs.reducedMotion);

        if (index !== lastIndexRef.current) {
          lastIndexRef.current = index;
          setPhaseIndex(index);
          if (!discreet) haptic(10);
        }

        // A quiet completion wave after each full 16-second circuit. It is
        // intentionally skipped on the final circuit because the stage changes.
        const completedRound = Math.floor(elapsedRef.current / ROUND_MS);
        if (
          completedRound > completedRoundRef.current &&
          completedRound > 0 &&
          completedRound < rounds
        ) {
          completedRoundRef.current = completedRound;
          setRewardPulse((pulse) => pulse + 1);
        }

        // The tracer path now breathes with the glass instead of staying rigid.
        if (tracerSvgRef.current) {
          tracerSvgRef.current.style.transform = `scaleX(${visual.scaleX}) scaleY(${visual.scaleY})`;
        }
        if (playerRootRef.current) {
          playerRootRef.current.style.setProperty("--box-v2-fullness", visual.fullness.toFixed(4));
        }

        // 0..1 over the 16-second circuit.
        const t = (index + progress) / 4;
        const drawn = pathRef.current;
        const trail = trailRef.current;
        const dot = dotRef.current;
        let tracerPoint = null;
        let trackOpacity = 0;

        if (drawn) {
          const drawOffset = 1 - t;
          drawn.style.strokeDashoffset = String(drawOffset);
          const op = t < 0.06 ? t / 0.06 : t > 0.94 ? (1 - t) / 0.06 : 1;
          trackOpacity = op;
          const glowBoost = 0.72 + 0.28 * Math.sin((t * Math.PI * 2) + 0.6);
          drawn.style.opacity = String(op * 0.92);
          drawn.style.filter = `drop-shadow(0 0 ${4 + glowBoost * 4}px rgba(178, 245, 220, 0.26)) blur(0.08px)`;

          // A short atmospheric light wake follows the leading point rather
          // than leaving the tracer feeling like a conventional progress bar.
          if (trail) {
            trail.style.strokeDashoffset = String(TRAIL_LENGTH - t);
            trail.style.opacity = String(op * 0.64);
            trail.style.filter = `drop-shadow(0 0 ${6 + glowBoost * 5}px rgba(172, 242, 214, 0.34)) blur(0.35px)`;
          }

          if (dot && LRef.current > 0) {
            const pt = drawn.getPointAtLength(t * LRef.current);
            tracerPoint = pt;

            // Bloom very briefly as the light turns each corner.
            const distanceFromCorner = Math.min(progress, 1 - progress);
            const cornerEnergy = Math.max(0, 1 - distanceFromCorner / 0.11);
            const cornerScale = 1 + cornerEnergy * 0.22;
            dot.setAttribute("transform", `translate(${pt.x} ${pt.y}) scale(${cornerScale})`);
            dot.style.opacity = String(op);
            dot.style.filter = `drop-shadow(0 0 ${3 + glowBoost * 3 + cornerEnergy * 3}px rgba(205, 244, 231, 0.82))`;
          }
        }

        updateBoxBreathingV2BreathLoom(loomRef.current, {
          phaseIndex: index,
          phaseProgress: progress,
          completedCycles: Math.min(3, Math.floor(elapsedRef.current / ROUND_MS)),
          tracerPoint,
          trackOpacity,
          reducedMotion: a11y.prefs.reducedMotion,
        });

        if (elapsedRef.current >= totalMs) {
          doneRef.current = true;
          if (onCompleteRef.current) onCompleteRef.current();
        }
      }

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      if (playerRootRef.current) {
        playerRootRef.current.style.removeProperty("--box-v2-fullness");
      }
    };
  }, [running, totalMs, rounds, discreet, a11y.prefs.reducedMotion]);

  return (
    <div className="flex w-full flex-col items-center">
      {/* Current 4-second segment is indicated without adding another timer. */}
      <div className="mb-2 text-center sm:mb-2.5">
        <p className="text-[0.62rem] font-medium uppercase tracking-[0.27em] text-cream/52">
          Breathe
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2 font-heading text-[1.55rem] font-medium tracking-[-0.02em] sm:text-[1.8rem]">
          {PHASE_NUMBERS.map((value, index) => (
            <React.Fragment key={index}>
              <motion.span
                animate={{
                  opacity: phaseIndex === index ? 1 : 0.42,
                  scale: phaseIndex === index ? 1.055 : 1,
                  textShadow: phaseIndex === index
                    ? "0 0 14px rgba(177, 240, 216, 0.28)"
                    : "0 0 0 rgba(177, 240, 216, 0)",
                }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-cream"
              >
                {value}
              </motion.span>
              {index < PHASE_NUMBERS.length - 1 && (
                <span className="-mx-0.5 text-cream/28">·</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div
        className="relative flex items-center justify-center"
        style={{ width: BOX_V2_SQUARE_STYLE.width, height: BOX_V2_SQUARE_STYLE.height }}
      >
        {rewardPulse > 0 && !a11y.prefs.reducedMotion && (
          <motion.div
            key={rewardPulse}
            aria-hidden="true"
            className="pointer-events-none absolute inset-[10%] rounded-[18%] border border-[#c8f5df]/20"
            initial={{ opacity: 0.36, scale: 0.98 }}
            animate={{ opacity: 0, scale: 1.46 }}
            transition={{ duration: 1.7, ease: [0.16, 1, 0.3, 1] }}
          />
        )}

        <div
          className="relative flex items-center justify-center border-0 bg-transparent shadow-none"
          style={{
            width: BOX_V2_SQUARE_STYLE.width,
            height: BOX_V2_SQUARE_STYLE.height,
            border: "none",
            boxShadow: "none",
            background: "transparent",
          }}
        >
          <BoxBreathingV2BreathLoom
            ref={loomRef}
            running={running}
            discreet={discreet}
            reducedMotion={a11y.prefs.reducedMotion}
          />

          <svg
            ref={tracerSvgRef}
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{
              overflow: "visible",
              zIndex: 3,
              transformOrigin: "50% 50%",
              willChange: "transform",
            }}
          >
            <defs>
              <filter id="boxV2Glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="1.2" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 1.1 0"
                />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              ref={pathRef}
              d={BOX_V2_PATH_D}
              fill="none"
              stroke="rgba(224, 243, 232, 0.82)"
              strokeWidth="0.74"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#boxV2Glow)"
              pathLength={1}
              strokeDasharray={1}
            />

            <path
              ref={trailRef}
              d={BOX_V2_PATH_D}
              fill="none"
              stroke="rgba(190, 247, 221, 0.68)"
              strokeWidth="1.05"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={`${TRAIL_LENGTH} 1`}
            />

            <g ref={dotRef}>
              <circle r="4.5" fill="rgba(168,238,212,0.08)" filter="url(#boxV2Glow)" />
              <circle r="3.1" fill="rgba(176,242,216,0.17)" filter="url(#boxV2Glow)" />
              <circle r="2" fill="rgba(196,247,225,0.42)" filter="url(#boxV2Glow)" />
              <circle r="1.02" fill="rgba(242,238,222,0.97)" />
              <circle r="0.48" fill="rgba(255,255,255,0.99)" />
            </g>
          </svg>
        </div>
      </div>

      <div className="relative mt-4 h-9 w-full sm:mt-5">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={phaseIndex}
            initial={{
              opacity: 0,
              y: 8,
              scale: 0.985,
              letterSpacing: "0.23em",
              color: "rgba(255,255,255,0.4)",
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              letterSpacing: "0.18em",
              color: phaseTone,
            }}
            exit={{
              opacity: 0,
              y: -7,
              scale: 0.985,
              letterSpacing: "0.15em",
              color: "rgba(255,255,255,0.38)",
            }}
            transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 text-center font-heading text-[1.35rem] font-medium uppercase text-cream"
            style={{
              textShadow: "0 0 12px rgba(132, 234, 205, 0.20)",
              WebkitFontSmoothing: "antialiased",
              textRendering: "optimizeLegibility",
            }}
          >
            {PHASE_LABELS[phaseIndex]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
