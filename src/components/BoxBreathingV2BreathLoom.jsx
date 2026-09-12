import React, { forwardRef, useId } from "react";

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const lerp = (from, to, progress) => from + (to - from) * progress;
const easeInOut = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * Imperatively updates the centre visual from BoxBreathingV2Pacer's existing
 * master clock. This component deliberately owns no timer or animation loop.
 */
export function getBoxBreathingV2BreathState(
  phaseIndex = 0,
  phaseProgress = 0,
  reducedMotion = false,
) {
  const progress = easeInOut(phaseProgress);

  // The square is the pacer, so the inhale/exhale movement must be clearly
  // readable at a glance. 0.88 → 1.08 keeps the same 20 percentage-point
  // breathing range, sitting slightly lower than the first stronger pass.
  const MIN_SCALE = 0.88;
  const MAX_SCALE = 1.08;

  let scale;
  let fullness;
  if (reducedMotion) {
    scale = 1;
    fullness = 0.5;
  } else if (phaseIndex === 0) {
    scale = lerp(MIN_SCALE, MAX_SCALE, progress);
    fullness = progress;
  } else if (phaseIndex === 1) {
    // At the top hold, retain a tiny suspended "pressure" movement rather
    // than freezing the glass completely. Peak movement stays below 0.8%.
    const suspension = Math.sin(progress * Math.PI) * 0.008;
    scale = MAX_SCALE * (1 + suspension);
    fullness = 1;
  } else if (phaseIndex === 2) {
    scale = lerp(MAX_SCALE, MIN_SCALE, progress);
    fullness = 1 - progress;
  } else {
    // The low hold settles into the next inhale instead of looking mechanically
    // frozen. The movement is intentionally tiny compared with inhale/exhale.
    const settle = Math.sin((1 - progress) * Math.PI) * 0.0035;
    scale = MIN_SCALE * (1 + settle);
    fullness = 0;
  }

  // Slightly wider lateral expansion makes the glass feel pressurised rather
  // than like a flat PNG being resized. The same transform is applied to the
  // tracer in BoxBreathingV2Pacer so it never detaches from the perimeter.
  const organicX = scale * (1 + fullness * 0.012);
  const organicY = scale * (1 - fullness * 0.002);

  return {
    scale,
    scaleX: organicX,
    scaleY: organicY,
    fullness,
  };
}

export function updateBoxBreathingV2BreathLoom(node, frame = {}) {
  if (!node) return;

  const {
    phaseIndex = 0,
    phaseProgress = 0,
    completedCycles = 0,
    reducedMotion = false,
  } = frame;

  const { scale, scaleX, scaleY, fullness } = getBoxBreathingV2BreathState(
    phaseIndex,
    phaseProgress,
    reducedMotion,
  );

  const loops = reducedMotion
    ? 3
    : Math.min(3, Math.max(1, Math.floor(completedCycles) + 1));

  node.dataset.loops = String(loops);
  node.dataset.phase = String(Math.min(3, Math.max(0, phaseIndex)));
  node.style.setProperty("--breath-scale", scale.toFixed(4));
  node.style.setProperty("--breath-scale-x", scaleX.toFixed(4));
  node.style.setProperty("--breath-scale-y", scaleY.toFixed(4));
  node.style.setProperty("--breath-fullness", fullness.toFixed(4));
  node.style.setProperty("--breath-light", (0.64 + fullness * 0.36).toFixed(4));
  node.style.setProperty("--breath-refraction", (0.58 + fullness * 0.42).toFixed(4));
}

const STYLES = `
  .box-v2-breath-loom {
    --breath-scale: 0.88;
    --breath-scale-x: 0.88;
    --breath-scale-y: 0.88;
    --breath-fullness: 0;
    --breath-light: 0.64;
    --breath-refraction: 0.58;
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    user-select: none;
    isolation: isolate;
  }

  /* Glow layers share the square's box so they stay concentric with it while
     it breathes. Only transform + opacity animate, never layout. */
  .box-v2-breath-aura {
    position: absolute;
    left: 8.5%;
    top: 8.5%;
    width: 83%;
    height: 83%;
    z-index: 0;
    border-radius: 17.5%;
    pointer-events: none;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .box-v2-breath-aura--environment {
    background: radial-gradient(closest-side, rgba(138, 236, 199, 0.20) 0%, rgba(50, 162, 129, 0.095) 47%, transparent 79%);
    filter: blur(30px);
    transform: scale(calc(1.18 + var(--breath-fullness) * 0.78));
    opacity: calc(0.16 + var(--breath-fullness) * 0.66);
  }

  .box-v2-breath-aura--rim {
    background: radial-gradient(closest-side, rgba(224, 255, 241, 0.20) 55%, rgba(126, 232, 193, 0.16) 82%, transparent 100%);
    filter: blur(14px);
    transform: scaleX(calc(var(--breath-scale-x) * (1.02 + var(--breath-fullness) * 0.17)))
               scaleY(calc(var(--breath-scale-y) * (1.02 + var(--breath-fullness) * 0.145)));
    opacity: calc(0.14 + var(--breath-fullness) * 0.68);
  }

  .box-v2-glass-square {
    position: absolute;
    left: 8.5%;
    top: 8.5%;
    width: 83%;
    height: 83%;
    z-index: 1;
    overflow: hidden;
    border-radius: 17.5%;
    transform: scaleX(var(--breath-scale-x)) scaleY(var(--breath-scale-y));
    transform-origin: 50% 50%;
    opacity: var(--breath-light);
    box-shadow:
      0 0 calc(2px + var(--breath-fullness) * 3px) rgba(250, 246, 219, calc(0.68 + var(--breath-fullness) * 0.30)),
      0 0 calc(11px + var(--breath-fullness) * 20px) rgba(132, 238, 199, calc(0.30 + var(--breath-fullness) * 0.30)),
      0 0 calc(30px + var(--breath-fullness) * 44px) rgba(42, 192, 149, calc(0.13 + var(--breath-fullness) * 0.22)),
      inset 0 0 calc(10px + var(--breath-fullness) * 18px) rgba(255, 250, 220, calc(0.13 + var(--breath-fullness) * 0.20));
    will-change: transform, opacity;
  }

  /* The supplied 945 × 1680 artwork is used as a source atlas. These values
     crop only its premium glass square (not its typography or controls). */
  .box-v2-glass-source {
    position: absolute;
    width: 151.2%;
    height: 268.8%;
    max-width: none;
    left: -25.6%;
    top: -69.6%;
    object-fit: fill;
    filter:
      brightness(calc(0.84 + var(--breath-fullness) * 0.30))
      saturate(calc(0.92 + var(--breath-fullness) * 0.20))
      contrast(calc(0.98 + var(--breath-fullness) * 0.09));
    pointer-events: none;
  }

  .box-v2-glass-shade {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      linear-gradient(145deg, rgba(255,255,232,calc(0.04 + var(--breath-fullness) * 0.20)), transparent 34%),
      radial-gradient(circle at 50% 52%, transparent 34%, rgba(0,22,18,calc(0.24 - var(--breath-fullness) * 0.17)) 100%);
    box-shadow:
      inset 0 2px 2px rgba(255,255,236,calc(0.12 + var(--breath-fullness) * 0.26)),
      inset 2px 0 2px rgba(255,255,236,calc(0.08 + var(--breath-fullness) * 0.18)),
      inset -3px -4px 9px rgba(0,24,19,calc(0.28 - var(--breath-fullness) * 0.12));
  }

  /* Soft internal bloom — the glass reads as filling with light on the inhale
     and draining on the exhale, rather than simply changing opacity. */
  .box-v2-glass-bloom {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(58% 52% at 50% 48%, rgba(214, 255, 236, calc(0.05 + var(--breath-fullness) * 0.16)) 0%, transparent 72%),
      radial-gradient(34% 28% at 36% 32%, rgba(255, 255, 240, calc(0.03 + var(--breath-fullness) * 0.13)) 0%, transparent 76%);
    filter: blur(calc(6px + var(--breath-fullness) * 5px));
    mix-blend-mode: screen;
    opacity: var(--breath-refraction);
  }

  .box-v2-glass-shimmer {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(112deg, transparent 24%, rgba(203, 253, 233, 0.16) 42%, transparent 58%);
    opacity: calc(0.04 + var(--breath-fullness) * 0.20);
    mix-blend-mode: screen;
    animation: box-v2-glass-shimmer 26s ease-in-out infinite;
  }

  /* Very faint refracted light drifting inside the glass. Clipped by the
     square's overflow, so it never touches the artwork's edges. */
  .box-v2-glass-shimmer::before {
    content: "";
    position: absolute;
    inset: -22%;
    background:
      radial-gradient(36% 28% at 33% 31%, rgba(236, 255, 246, 0.17), transparent 72%),
      radial-gradient(30% 23% at 69% 67%, rgba(170, 242, 211, 0.11), transparent 74%);
    opacity: calc(0.34 + var(--breath-fullness) * 0.66);
    animation: box-v2-glass-refraction 38s ease-in-out infinite;
  }

  @keyframes box-v2-glass-shimmer {
    0%, 100% { transform: translateX(-18%); }
    50% { transform: translateX(18%); }
  }

  @keyframes box-v2-glass-refraction {
    0%, 100% { transform: translate3d(-3%, 2%, 0) scale(1.02); }
    50% { transform: translate3d(3%, -2%, 0) scale(1.06); }
  }

  .box-v2-memory-loops {
    position: absolute;
    inset: 13.5%;
    overflow: visible;
    transform: scaleX(var(--breath-scale-x)) scaleY(var(--breath-scale-y));
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .box-v2-memory-loop {
    fill: none;
    stroke: url(#box-v2-loop-gradient);
    stroke-width: 0.52;
    vector-effect: non-scaling-stroke;
    filter: url(#box-v2-loop-softness);
    opacity: 0;
    transition: opacity 1400ms cubic-bezier(.22,1,.36,1);
  }

  .box-v2-breath-loom[data-loops="1"] .box-v2-memory-loop--1,
  .box-v2-breath-loom[data-loops="2"] .box-v2-memory-loop--1,
  .box-v2-breath-loom[data-loops="2"] .box-v2-memory-loop--2,
  .box-v2-breath-loom[data-loops="3"] .box-v2-memory-loop {
    opacity: 1;
  }

  .box-v2-memory-loop--1 { opacity: 0; }
  .box-v2-memory-loop--2 { opacity: 0; }
  .box-v2-memory-loop--3 { opacity: 0; }

  .box-v2-breath-loom.is-discreet { opacity: 0.72; }

  @media (prefers-reduced-motion: reduce) {
    .box-v2-glass-square,
    .box-v2-memory-loops { transform: none !important; }
    .box-v2-breath-aura--rim { transform: scale(1.05) !important; }
    .box-v2-breath-aura--environment { transform: scale(1.5) !important; }
    .box-v2-memory-loop { transition: none; }
    .box-v2-glass-shimmer,
    .box-v2-glass-shimmer::before { animation: none; }
  }
`;

function BoxBreathingV2BreathLoomInner(
  { running = true, discreet = false, reducedMotion = false },
  ref,
) {
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  const className = [
    "box-v2-breath-loom",
    discreet ? "is-discreet" : "",
    running ? "" : "is-paused",
    reducedMotion ? "is-reduced-motion" : "",
  ].filter(Boolean).join(" ");

  return (
    <>
      <style>{STYLES}</style>
      <div
        ref={ref}
        className={className}
        data-loops={reducedMotion ? "3" : "1"}
        data-phase="0"
        aria-hidden="true"
      >
        <div className="box-v2-breath-aura box-v2-breath-aura--environment" />
        <div className="box-v2-breath-aura box-v2-breath-aura--rim" />

        <div className="box-v2-glass-square">
          <img
            className="box-v2-glass-source"
            src="/media/images/box-v2-glass-square-reference.png"
            alt=""
            draggable="false"
          />
          <div className="box-v2-glass-shade" />
          <div className="box-v2-glass-bloom" />
          <div className="box-v2-glass-shimmer" />
        </div>

        <svg className="box-v2-memory-loops" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={`${id}-loop-gradient`} x1="15" y1="12" x2="86" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fffbdc" stopOpacity="0.34" />
              <stop offset="0.34" stopColor="#b9f7d9" stopOpacity="0.18" />
              <stop offset="0.72" stopColor="#65d3ac" stopOpacity="0.11" />
              <stop offset="1" stopColor="#e9ffe9" stopOpacity="0.26" />
            </linearGradient>
            <filter id={`${id}-loop-softness`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="0.28" result="soft" />
              <feMerge><feMergeNode in="soft" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect className="box-v2-memory-loop box-v2-memory-loop--1" x="11" y="11" width="78" height="78" rx="17" stroke={`url(#${id}-loop-gradient)`} filter={`url(#${id}-loop-softness)`} />
          <rect className="box-v2-memory-loop box-v2-memory-loop--2" x="22" y="22" width="56" height="56" rx="13" stroke={`url(#${id}-loop-gradient)`} filter={`url(#${id}-loop-softness)`} />
          <rect className="box-v2-memory-loop box-v2-memory-loop--3" x="33" y="33" width="34" height="34" rx="9" stroke={`url(#${id}-loop-gradient)`} filter={`url(#${id}-loop-softness)`} />
        </svg>
      </div>
    </>
  );
}

const BoxBreathingV2BreathLoom = forwardRef(BoxBreathingV2BreathLoomInner);
export default BoxBreathingV2BreathLoom;
