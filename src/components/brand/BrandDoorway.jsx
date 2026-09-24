import React from "react";
import { motion } from "framer-motion";
import { BRAND_EASE } from "@/lib/interventionBrand";

/**
 * The Mentication Doorway: the coral arch from the logo, with the soft flowing
 * figure beneath it. It draws itself in (stroke animation) so every
 * intervention opens through the same door.
 *
 * Purely decorative: aria-hidden.
 */
export function BrandDoorway({
  coral = "#E0715C",
  ink = "#F6EFE2",
  animate = true,
  delay = 0,
  className = "h-28 w-24",
}) {
  const draw = (extra = 0, duration = 0.9) =>
    animate
      ? {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: { duration, delay: delay + extra, ease: BRAND_EASE },
        }
      : {};

  return (
    <svg viewBox="0 0 120 140" className={className} fill="none" aria-hidden="true" focusable="false">
      {/* Arch: main stroke, then a fainter offset stroke for a brushed look. */}
      <motion.path
        d="M30 120 L30 60 Q30 22 60 22 Q90 22 90 60 L90 120"
        stroke={coral}
        strokeWidth="3.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw(0, 0.9)}
      />
      <motion.path
        d="M36 118 L36 62 Q36 30 60 30 Q84 30 84 62"
        stroke={coral}
        strokeOpacity="0.35"
        strokeWidth="1.4"
        strokeLinecap="round"
        {...draw(0.15, 0.9)}
      />
      {/* The flowing figure. */}
      <motion.path
        d="M14 128 C34 110 52 138 72 120 S102 112 108 124"
        stroke={ink}
        strokeOpacity="0.55"
        strokeWidth="1.8"
        strokeLinecap="round"
        {...draw(0.35, 1)}
      />
      <motion.path
        d="M22 134 C44 122 60 142 84 128"
        stroke={ink}
        strokeOpacity="0.28"
        strokeWidth="1.2"
        strokeLinecap="round"
        {...draw(0.5, 1)}
      />
    </svg>
  );
}

/**
 * The Mentication Thread: the coral brush swash from under the wordmark.
 * Used as the title underline in the threshold and as a divider.
 */
export function BrandSwash({
  coral = "#E0715C",
  animate = true,
  delay = 0,
  className = "h-5 w-56",
}) {
  const props = animate
    ? {
        initial: { pathLength: 0, opacity: 0 },
        animate: { pathLength: 1, opacity: 1 },
        transition: { duration: 0.9, delay, ease: BRAND_EASE },
      }
    : {};
  return (
    <svg viewBox="0 0 320 24" className={className} fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <motion.path
        d="M3 15 C60 5 170 3 250 10 C288 13 306 12 317 8"
        stroke={coral}
        strokeWidth="3.2"
        strokeLinecap="round"
        {...props}
      />
      <motion.path
        d="M18 19 C90 12 190 11 262 15"
        stroke={coral}
        strokeOpacity="0.4"
        strokeWidth="1.2"
        strokeLinecap="round"
        {...(animate
          ? {
              initial: { pathLength: 0, opacity: 0 },
              animate: { pathLength: 1, opacity: 1 },
              transition: { duration: 0.9, delay: delay + 0.15, ease: BRAND_EASE },
            }
          : {})}
      />
    </svg>
  );
}
