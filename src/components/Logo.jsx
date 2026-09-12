import React from "react";

export const MENTICATION_PRIMARY_ASSET = "/media/brand/mentation-primary.png";
export const MENTICATION_SLOGAN = "Take your mind somewhere better.";

/** The supplied brand symbol, cropped from the approved primary artwork. */
export function Logo({ className = "h-12 w-12", decorative = false, label = "Mentication" }) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-[22%] bg-[var(--mcn-emerald)] ${className}`}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      <img
        src={MENTICATION_PRIMARY_ASSET}
        className="pointer-events-none absolute max-w-none select-none"
        style={{ width: "267.3%", height: "264.3%", left: "-155.4%", top: "-7.1%" }}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
    </span>
  );
}

/** Official supplied lockup with the approved slogan. */
export function BrandLockup({ size = "sm", tagline = false, compact = false, className = "" }) {
  const imageSize = compact ? "h-14 w-14" : size === "lg" ? "h-28 w-28" : size === "md" ? "h-24 w-24" : "h-20 w-20";
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`} aria-label={`Mentication. ${MENTICATION_SLOGAN}`}>
      <Logo className={imageSize} decorative />
      <div className="min-w-0 leading-tight">
        <span className="block font-clean text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl">
          Mentication
        </span>
        {(tagline || !compact) && (
          <span className="mt-1 block max-w-[15rem] text-sm leading-snug text-[var(--mcn-brown)] dark:text-[#DDB977]">
            {MENTICATION_SLOGAN}
          </span>
        )}
      </div>
    </div>
  );
}

export default Logo;
