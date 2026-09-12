import React, { forwardRef } from "react";

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const smoothstep = (value) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * Updates the visual using Box Breathing V2's existing 16-second master clock.
 *
 * normalisedCycleProgress:
 * 0.00-0.25 = inhale
 * 0.25-0.50 = first hold
 * 0.50-0.75 = exhale
 * 0.75-1.00 = final hold
 *
 * This component deliberately owns no timer, narration or audio logic.
 */
export function updateBoxBreathingVolumetricField(
  node,
  normalisedCycleProgress,
  reducedMotion = false,
) {
  if (!node) return;

  const progress =
    ((Number(normalisedCycleProgress) || 0) % 1 + 1) % 1;
  const phaseFloat = progress * 4;
  const phaseIndex = Math.min(3, Math.floor(phaseFloat));
  const phaseProgress = phaseFloat - phaseIndex;
  const easedProgress = smoothstep(phaseProgress);

  let breathAmount = 0;

  if (phaseIndex === 0) {
    breathAmount = easedProgress;
  } else if (phaseIndex === 1) {
    breathAmount = 1;
  } else if (phaseIndex === 2) {
    breathAmount = 1 - easedProgress;
  }

  // Barely perceptible residual life during the final hold.
  const restingPulse =
    phaseIndex === 3
      ? Math.sin(phaseProgress * Math.PI) * 0.004
      : 0;

  const rootScale = reducedMotion
    ? 0.992
    : 0.985 + breathAmount * 0.06;
  const fieldScale = reducedMotion
    ? 0.91
    : 0.82 + breathAmount * 0.24 + restingPulse;
  const brightness = reducedMotion
    ? 0.98
    : 0.94 + breathAmount * 0.18;
  const innerLight = reducedMotion
    ? 0.21
    : 0.14 +
      breathAmount * 0.28 +
      (phaseIndex === 3 ? restingPulse * 3 : 0);
  const haloOpacity = reducedMotion
    ? 0.13
    : 0.14 + breathAmount * 0.28;
  const haloScale = reducedMotion
    ? 1
    : 0.96 + breathAmount * 0.16;
  const outerBloom = reducedMotion
    ? 0.18
    : 0.22 + breathAmount * 0.42;
  const coreGlow = reducedMotion
    ? 0.28
    : 0.28 + breathAmount * 0.54;
  const warmth = reducedMotion
    ? 0.82
    : 0.72 + breathAmount * 0.24 + (phaseIndex === 2 ? 0.08 : 0);

  let sweepPosition = "-48%";
  let sweepOpacity = 0;

  if (!reducedMotion) {
    if (phaseIndex === 0) {
      sweepPosition = `${-48 + easedProgress * 54}%`;
      sweepOpacity = 0.08 + easedProgress * 0.1;
    } else if (phaseIndex === 1) {
      sweepPosition = `${6 + easedProgress * 10}%`;
      sweepOpacity = 0.16 - easedProgress * 0.025;
    } else if (phaseIndex === 2) {
      sweepPosition = `${16 + easedProgress * 96}%`;
      sweepOpacity = 0.135 - easedProgress * 0.065;
    } else {
      sweepPosition = "112%";
      sweepOpacity = 0.025;
    }
  }

  node.style.setProperty("--box-field-root-scale", rootScale.toFixed(4));
  node.style.setProperty("--box-field-scale", fieldScale.toFixed(4));
  node.style.setProperty("--box-field-brightness", brightness.toFixed(4));
  node.style.setProperty("--box-inner-light", innerLight.toFixed(4));
  node.style.setProperty("--box-halo-opacity", haloOpacity.toFixed(4));
  node.style.setProperty("--box-halo-scale", haloScale.toFixed(4));
  node.style.setProperty("--box-outer-bloom", outerBloom.toFixed(4));
  node.style.setProperty("--box-core-glow", coreGlow.toFixed(4));
  node.style.setProperty("--box-warmth", warmth.toFixed(4));
  node.style.setProperty("--box-sweep-x", sweepPosition);
  node.style.setProperty("--box-sweep-opacity", sweepOpacity.toFixed(4));
}

const FIELD_STYLES = `
  .box-v2-volumetric-field {
    --box-field-root-scale: 1;
    --box-field-scale: 1;
    --box-field-brightness: 1;
    --box-inner-light: 0.13;
    --box-halo-opacity: 0.08;
    --box-halo-scale: 1;
    --box-outer-bloom: 0.18;
    --box-core-glow: 0.2;
    --box-warmth: 0.75;
    --box-sweep-x: 0%;
    --box-sweep-opacity: 0;

    position: absolute;
    inset: -10%;
    z-index: 1;
    pointer-events: none;
    isolation: isolate;
    transform: translateZ(0) scale(var(--box-field-root-scale));
    transform-origin: 50% 50%;
    filter: brightness(var(--box-field-brightness));
    will-change: transform, filter;
    background: transparent;
  }

  .box-v2-field-bloom {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 170%;
    height: 170%;
    transform: translate3d(-50%, -50%, 0) scale(calc(var(--box-halo-scale) * 1.18));
    border-radius: 30%;
    opacity: var(--box-outer-bloom);
    background:
      radial-gradient(
        circle at 50% 45%,
        rgba(196, 252, 236, 0.24) 0%,
        rgba(129, 229, 198, 0.14) 26%,
        rgba(46, 127, 105, 0.06) 50%,
        transparent 78%
      );
    filter: blur(34px) saturate(1.24);
    will-change: transform, opacity;
  }

  .box-v2-field-halo {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 138%;
    height: 138%;
    transform: translate3d(-50%, -50%, 0) scale(var(--box-halo-scale));
    border-radius: 32%;
    opacity: calc(var(--box-halo-opacity) + 0.08);
    background:
      radial-gradient(
        circle at 50% 48%,
        rgba(91, 231, 195, calc(var(--box-core-glow) * 0.96)) 0%,
        rgba(32, 151, 126, calc(var(--box-core-glow) * 0.58)) 24%,
        rgba(7, 61, 53, 0.02) 54%,
        transparent 74%
      );
    filter: blur(28px) saturate(1.18);
    will-change: transform, opacity;
  }

  .box-v2-field-core {
    position: absolute;
    inset: 27%;
    border-radius: 31%;
    background:
      radial-gradient(
        circle at 46% 43%,
        rgba(157, 238, 212, calc(var(--box-inner-light) * 1.15)) 0%,
        rgba(65, 188, 158, calc(var(--box-inner-light) * 0.65)) 25%,
        rgba(5, 61, 51, 0.28) 37%,
        rgba(0, 13, 12, 0.72) 78%,
        rgba(0, 5, 5, 0.88) 100%
      );
    filter: blur(7px) saturate(1.2);
    opacity: calc(0.82 + var(--box-warmth) * 0.18);
  }

  .box-v2-field-caustic {
    position: absolute;
    top: -16%;
    left: var(--box-sweep-x);
    width: 34%;
    height: 132%;
    opacity: var(--box-sweep-opacity);
    transform: rotate(11deg) translateZ(0);
    background:
      linear-gradient(
        90deg,
        transparent 0%,
        rgba(194, 229, 255, 0.10) 28%,
        rgba(242, 222, 255, 0.24) 47%,
        rgba(255, 228, 200, 0.12) 61%,
        transparent 100%
      );
    filter: blur(15px);
    mix-blend-mode: screen;
    will-change: left, opacity;
  }

  .box-v2-field-vignette {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(
        ellipse at center,
        transparent 34%,
        rgba(0, 10, 9, 0.08) 60%,
        rgba(0, 5, 5, 0.48) 100%
      );
  }

  .box-v2-field-grain {
    position: absolute;
    inset: 5%;
    width: 90%;
    height: 90%;
    border-radius: 25%;
    opacity: 0.035;
    mix-blend-mode: soft-light;
  }

  .box-v2-volumetric-field.is-discreet {
    opacity: 0.72;
  }

  .box-v2-volumetric-field.is-reduced-motion
    .box-v2-field-caustic {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    .box-v2-field-caustic {
      display: none;
    }
  }
`;

const BoxBreathingV2VolumetricField = forwardRef(
  function BoxBreathingV2VolumetricField(
    { discreet = false, reducedMotion = false },
    ref,
  ) {
    const classNames = [
      "box-v2-volumetric-field",
      "box-v2-native-motion",
      discreet ? "is-discreet" : "",
      reducedMotion ? "is-reduced-motion" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <>
        <style>{FIELD_STYLES}</style>

        <div ref={ref} aria-hidden="true" className={classNames}>
          <div className="box-v2-field-bloom" />
          <div className="box-v2-field-halo" />
          <div className="box-v2-field-core" />
          <div className="box-v2-field-caustic" />
          <div className="box-v2-field-vignette" />
          <div className="box-v2-field-grain" />
        </div>
      </>
    );
  },
);

export default BoxBreathingV2VolumetricField;
