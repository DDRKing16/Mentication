// @ts-check
import React from "react";

export const MENTICATION_PRIMARY_ASSET = "/media/brand/mentation-primary.png";
export const MENTICATION_MIDNIGHT_COPPER_ASSET = "/media/brand/mentation-midnight-copper.png";
export const MENTICATION_NAVY_CORAL_ASSET = "/media/brand/mentation-navy-coral.png";
export const MENTICATION_NAVY_CORAL_TRANSPARENT_ASSET = "/media/brand/mentation-navy-coral-transparent.png";
export const MENTICATION_GREEN_PINK_ASSET = "/media/brand/mentation-green-pink-transparent.png";
export const MENTICATION_SLOGAN = "Take your mind somewhere better.";

/** The supplied brand symbol, cropped from the approved primary artwork. */
export function Logo({
  className = "h-12 w-12",
  decorative = false,
  label = "Mentication",
  src = MENTICATION_PRIMARY_ASSET,
  background = "var(--mcn-emerald)",
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-[22%] ${className}`}
      style={{ backgroundColor: background }}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      <img
        src={src}
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
export function BrandLockup({
  size = "sm",
  tagline = false,
  compact = false,
  className = "",
  logoSrc,
  logoBackground,
  tone = "default",
}) {
  const imageSize = compact ? "h-14 w-14" : size === "lg" ? "h-28 w-28" : size === "md" ? "h-24 w-24" : "h-20 w-20";
  const welcomeTone = tone === "welcome";
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`} aria-label={`Mentication. ${MENTICATION_SLOGAN}`}>
      <Logo className={imageSize} decorative src={logoSrc} background={logoBackground} />
      <div className="min-w-0 leading-tight">
        <span className={`block font-clean text-xl font-semibold tracking-[-0.02em] sm:text-2xl ${welcomeTone ? "text-[var(--welcome-ink)]" : "text-foreground"}`}>
          Mentication
        </span>
        {(tagline || !compact) && (
          <span className={`mt-1 block max-w-[15rem] font-[var(--font-editorial)] text-base italic leading-snug ${welcomeTone ? "text-[var(--welcome-accent)]" : "text-[var(--mcn-brown)] dark:text-[#DDB977]"}`}>
            {MENTICATION_SLOGAN}
          </span>
        )}
      </div>
    </div>
  );
}

export default Logo;
