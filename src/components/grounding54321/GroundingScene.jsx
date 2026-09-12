import React, { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import SenseOverlay from "@/components/grounding54321/SenseOverlay";
import { GROUNDING_V2_FIELD_SIZE } from "@/lib/grounding54321Layout";

// 5-4-3-2-1 Grounding V2 — central visual.
//
// A single transparent PNG: a seated meditative figure within three concentric
// rings, five radiating lines and five coloured glowing orbs. It is the ONLY
// image rendered here — no generated person, grey shadow, outer circle,
// background, card or border. The image is shown centred, square and
// uncropped (object-contain) so the head, legs, orbs and glows all stay
// visible, and it scales responsively via the shared GROUNDING_V2_FIELD_SIZE
// box.
//
// The image and its sibling glisten mask share a wrapper carrying the subtle
// `grounding-breathe` scale/brightness animation, so both stay pixel-aligned
// through the pulse. The `grounding-glisten` layer is a single soft
// pearlescent light drifting across the figure, clipped to the PNG's alpha
// (mask) so it only appears over the pearl person and never forms a
// rectangle or touches the page background. `SenseOverlay` adds only
// lightweight, unmasked, pointer-events:none CSS glow/ripple/wave/wisp
// elements for the active sense, including one mapped orb highlight per stage,
// without ever remounting the PNG or glisten.
//
// This component stays mounted across all five stages (ResetPlayer keys the
// grounding stage motion.div by intervention, not by step) so the image and
// glisten never flicker or reload between See / Feel / Hear / Smell / Taste.
const GROUNDING_PNG = "/media/images/grounding-figure.png";

/** @param {string | undefined} sense */
function countForSense(sense) {
  switch (sense) {
    case "sight":
      return 5;
    case "touch":
      return 4;
    case "hearing":
      return 3;
    case "smell":
      return 2;
    case "taste":
      return 1;
    case "recenter":
      return 1;
    default:
      return 0;
  }
}

/** @param {number} v */
function clamp01(v) {
  return Math.min(1, Math.max(0, v));
}

/**
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Per-stage start/end tuning for the base visual scene.
 * Values are intentionally calibrated so each item count (5/4/3/2/1) creates
 * a clearly visible, premium-feeling lift in clarity and colour.
 */
const SCENE_PHASES = {
  sight: {
    start: { sat: 0.58, presence: 0.78, contrast: 0.88, bright: 0.93, diffuse: 2.1 },
    end: { sat: 0.73, presence: 0.86, contrast: 0.93, bright: 0.965, diffuse: 1.3 },
  },
  touch: {
    start: { sat: 0.73, presence: 0.86, contrast: 0.93, bright: 0.965, diffuse: 1.3 },
    end: { sat: 0.82, presence: 0.91, contrast: 0.96, bright: 0.98, diffuse: 0.85 },
  },
  hearing: {
    start: { sat: 0.82, presence: 0.91, contrast: 0.96, bright: 0.98, diffuse: 0.85 },
    end: { sat: 0.91, presence: 0.95, contrast: 0.985, bright: 0.99, diffuse: 0.45 },
  },
  smell: {
    start: { sat: 0.91, presence: 0.95, contrast: 0.985, bright: 0.99, diffuse: 0.45 },
    end: { sat: 0.97, presence: 0.98, contrast: 0.995, bright: 0.997, diffuse: 0.2 },
  },
  taste: {
    start: { sat: 0.97, presence: 0.98, contrast: 0.995, bright: 0.997, diffuse: 0.2 },
    end: { sat: 1, presence: 1, contrast: 1, bright: 1, diffuse: 0 },
  },
  recenter: {
    start: { sat: 1, presence: 1, contrast: 1, bright: 1, diffuse: 0 },
    end: { sat: 1, presence: 1, contrast: 1, bright: 1, diffuse: 0 },
  },
};

/** @param {string | undefined} sense */
function phaseForSense(sense) {
  switch (sense) {
    case "sight":
      return SCENE_PHASES.sight;
    case "touch":
      return SCENE_PHASES.touch;
    case "hearing":
      return SCENE_PHASES.hearing;
    case "smell":
      return SCENE_PHASES.smell;
    case "taste":
      return SCENE_PHASES.taste;
    case "recenter":
      return SCENE_PHASES.recenter;
    default:
      return SCENE_PHASES.taste;
  }
}

/**
 * @param {string | undefined} sense
 * @param {number} progress
 */
function sceneStyleForSense(sense, progress) {
  const phase = phaseForSense(sense);
  const count = countForSense(sense);
  const stepProgress = clamp01(progress);

  // Stepwise progression: improves once per counted item (5/4/3/2/1).
  const completed = count > 0 ? Math.floor(stepProgress * count) : 0;
  const t = count > 0 ? completed / count : 1;

  const sat = lerp(phase.start.sat, phase.end.sat, t);
  const presence = lerp(phase.start.presence, phase.end.presence, t);
  const contrast = lerp(phase.start.contrast, phase.end.contrast, t);
  const bright = lerp(phase.start.bright, phase.end.bright, t);
  const diffuse = lerp(phase.start.diffuse, phase.end.diffuse, t);

  return {
    opacity: presence,
    filter: `saturate(${sat}) contrast(${contrast}) brightness(${bright}) blur(${diffuse}px)`,
  };
}

/**
 * @param {{ sense?: string, progress?: number }} props
 */
export default function GroundingScene({ sense, progress = 0 }) {
  const baseSceneStyle = sceneStyleForSense(sense, progress);
  const [handoffTick, setHandoffTick] = useState(0);
  const prevSenseRef = useRef(/** @type {string | null} */ (null));
  const phaseProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const depthOpacity = 0.14 + phaseProgress * 0.2;

  useEffect(() => {
    if (!sense) return;
    if (prevSenseRef.current && prevSenseRef.current !== sense) {
      setHandoffTick((n) => n + 1);
    }
    prevSenseRef.current = sense;
  }, [sense]);

  return (
    <div className="relative flex" style={GROUNDING_V2_FIELD_SIZE}>
      {/* Shared wrapper carries the scale/brightness breathe animation so the
          glisten mask and sense overlay (siblings of the image) scale in
          lockstep and never drift out of alignment with the PNG. */}
      <div className="grounding-breathe relative h-full w-full">
        <div className="grounding-v2-scene-base relative h-full w-full" style={baseSceneStyle}>
          <Image
            src={GROUNDING_PNG}
            alt="Seated meditative figure within concentric rings, five radiating lines and five glowing orbs"
            fittingType="fit"
            className="h-full w-full"
          />
          <div className="grounding-depth-pass" style={{ opacity: depthOpacity }} aria-hidden="true" />
          <div className="grounding-prism" aria-hidden="true" />
          <div className="grounding-glisten" aria-hidden="true" />
        </div>
        {sense && <div key={`${sense}-${handoffTick}`} className="grounding-stage-handoff" aria-hidden="true" />}
        <SenseOverlay sense={sense} progress={progress} />
      </div>
    </div>
  );
}