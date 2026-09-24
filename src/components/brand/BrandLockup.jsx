import React from "react";
import { motion } from "framer-motion";
import { BRAND_EASE } from "@/lib/interventionBrand";

/**
 * The real Mentication logo and wordmark, revealed in two strokes:
 * first the doorway (arch and flowing figure), then the hand-lettered
 * wordmark and its coral swash sweep in from the left.
 *
 * This always uses the supplied artwork (public/media/brand). Never redraw or
 * approximate the logo or wordmark.
 *
 * Artwork layout (1041 x 784): the doorway sits in the top-right block
 * (x > 62%, y < 56%); the wordmark and swash fill the lower part.
 *
 * Decorative: the parent names the moment for screen readers.
 */
const DOORWAY_HIDDEN = "inset(0% 0% 100% 62%)";
const DOORWAY_SHOWN = "inset(0% 0% 56% 62%)";
// Everything except the doorway block, so the two layers never double-draw it.
const WITHOUT_DOORWAY = "polygon(0% 0%, 62% 0%, 62% 56%, 100% 56%, 100% 100%, 0% 100%)";

export function BrandLockup({ src, delay = 0, className = "w-72" }) {
  const imgProps = {
    src,
    alt: "",
    draggable: false,
    "aria-hidden": true,
    className: "pointer-events-none block h-auto w-full select-none",
  };

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* 1. The doorway draws downward. */}
      <motion.img
        {...imgProps}
        className="pointer-events-none absolute inset-0 block h-full w-full select-none"
        initial={{ clipPath: DOORWAY_HIDDEN }}
        animate={{ clipPath: DOORWAY_SHOWN }}
        transition={{ duration: 0.85, delay, ease: BRAND_EASE }}
      />
      {/* 2. The wordmark and swash sweep in from the left. */}
      <motion.div
        initial={{ clipPath: "inset(0% 100% 0% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ duration: 1, delay: delay + 0.55, ease: BRAND_EASE }}
      >
        <img {...imgProps} style={{ clipPath: WITHOUT_DOORWAY }} />
      </motion.div>
    </div>
  );
}

/** A fine coral line that draws itself under the intervention name. */
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
