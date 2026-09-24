import React from "react";
import { motion } from "framer-motion";
import { BRAND_EASE, getBrandCoral } from "@/lib/interventionBrand";

/**
 * The Mentication Thread as a progress bar: a line drawn in the intervention's
 * own swash colour (see docs/BRAND_THREAD.md). Two variants share the same
 * colour and easing so every player reads as one family:
 *  - "pill": a short capsule track (the shared control shell's header).
 *  - "hairline": a thin full-width line (a full-bleed player's top edge).
 */
export default function BrandThreadProgress({ id, progress, stage, stages, variant = "pill", className = "" }) {
  const fraction = progress != null ? progress : (stage || 0) / Math.max(1, stages || 1);
  const pct = Math.min(100, Math.max(0, fraction * 100));
  const coral = getBrandCoral(id);
  const ariaProps = stages
    ? { "aria-label": `Stage ${stage} of ${stages}`, "aria-valuemin": 1, "aria-valuemax": stages, "aria-valuenow": stage }
    : { "aria-label": "Progress", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": Math.round(pct) };

  if (variant === "hairline") {
    return (
      <div
        className={`pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-white/[0.06] ${className}`}
        role="progressbar"
        {...ariaProps}
      >
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, transparent, ${coral}, transparent)`, boxShadow: `0 0 8px ${coral}66` }}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "easeInOut", duration: 1.2 }}
        />
      </div>
    );
  }

  return (
    <div
      className={`relative z-10 mx-auto flex w-full max-w-5xl items-center justify-center px-5 ${className}`}
      role="progressbar"
      {...ariaProps}
    >
      <div className="relative h-[3px] w-full max-w-[15rem] rounded-full bg-white/15">
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: `linear-gradient(90deg, ${coral}66, ${coral})`, boxShadow: `0 0 10px ${coral}88` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: BRAND_EASE }}
        />
      </div>
    </div>
  );
}
