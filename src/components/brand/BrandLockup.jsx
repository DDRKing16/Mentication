import React from "react";
import { motion } from "framer-motion";
import { BRAND_EASE } from "@/lib/interventionBrand";

/**
 * The real Mentication logo and wordmark, put back together from its three real
 * parts (doorway, hand-lettered wordmark, coral swash) and revealed in order:
 * the doorway settles in, the wordmark writes on from the left, then the swash
 * sweeps out beneath it.
 *
 * Reliability rule: only opacity and transform are animated (never clip-path,
 * masks or SVG geometry), because those work in every browser and web view.
 * If an animation ever fails to run, the parts must still end up visible, so
 * each part's `animate` target is its natural, fully visible state.
 *
 * The artwork is never redrawn (see docs/BRAND_THREAD.md). `parts` comes from
 * getBrandLogoParts(id) in src/lib/interventionBrand.js.
 *
 * Decorative: the parent names the moment for screen readers.
 */
function Part({ part, initial, animate, transition, origin }) {
  return (
    <motion.img
      src={part.src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className="pointer-events-none absolute select-none"
      style={{
        left: `${part.left}%`,
        top: `${part.top}%`,
        width: `${part.width}%`,
        height: `${part.height}%`,
        transformOrigin: origin,
      }}
      initial={initial}
      animate={animate}
      transition={transition}
    />
  );
}

export function BrandLockup({ parts, delay = 0, className = "w-72" }) {
  return (
    <div className={`relative ${className}`} style={{ aspectRatio: String(parts.aspect) }} aria-hidden="true">
      <Part
        part={parts.doorway}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.85, delay, ease: BRAND_EASE }}
        origin="50% 0%"
      />
      <Part
        part={parts.wordmark}
        initial={{ opacity: 0, x: -22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: delay + 0.5, ease: BRAND_EASE }}
        origin="0% 50%"
      />
      <Part
        part={parts.swash}
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.9, delay: delay + 0.95, ease: BRAND_EASE }}
        origin="0% 50%"
      />
    </div>
  );
}

/** A fine line that draws itself under the intervention name. */
export function BrandHairline({ coral = "#E0715C", delay = 0, className = "w-40" }) {
  return (
    <motion.span
      aria-hidden="true"
      className={`block h-px origin-left rounded-full ${className}`}
      style={{ background: `linear-gradient(90deg, transparent, ${coral}, transparent)` }}
      initial={{ scaleX: 0, opacity: 0 }}
      animate={{ scaleX: 1, opacity: 1 }}
      transition={{ duration: 0.8, delay, ease: BRAND_EASE }}
    />
  );
}
