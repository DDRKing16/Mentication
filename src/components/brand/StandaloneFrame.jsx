import React, { useCallback, useEffect, useRef } from "react";
import WithBrandThreshold from "@/components/brand/WithBrandThreshold";
import InterventionNav from "@/components/brand/InterventionNav";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";

export const REDUCE_MOTION_STYLE_ID = "mentication-reduce-motion";

// Night Channel, Vector Shift and Signal Lock run as same-origin iframes with
// their own document, so the host page's `html.reduce-motion` class (set by
// useAccessibilityPrefs) never reaches their CSS. Rather than hand-edit one of
// these finished builds, the preference is mirrored into the iframe's own
// document from its wrapper at runtime, using the same stilling rule every
// other screen already gets from src/index.css's `html.reduce-motion` rule.
export function applyReduceMotion(doc, on) {
  if (!doc) return;
  const existing = doc.getElementById(REDUCE_MOTION_STYLE_ID);
  if (!on) {
    existing?.remove();
    return;
  }
  const style = existing || doc.createElement("style");
  style.id = REDUCE_MOTION_STYLE_ID;
  style.textContent =
    "*, *::before, *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }";
  if (!existing) doc.head?.appendChild(style);
}

/**
 * Runs a finished, self-contained intervention build (public/<name>/index.html)
 * inside Mentication: the brand Threshold first, then the build in a frame under
 * a slim top bar that carries the shared Back (left) and Home (right) buttons.
 * The bar is its own strip, so the buttons never cover the build's own controls.
 */
export default function StandaloneFrame({ id, name, src, background = "#02050B", tone = "dark", nav = {} }) {
  const { prefs } = useAccessibilityPrefs();
  const frame = useRef(null);
  const loaded = useRef(false);

  const sync = useCallback(() => {
    try {
      applyReduceMotion(frame.current?.contentDocument, !!prefs.reducedMotion);
    } catch {
      /* cross-origin or not ready yet; nothing to mirror */
    }
  }, [prefs.reducedMotion]);

  useEffect(() => {
    if (loaded.current) sync();
  }, [sync]);

  return (
    <WithBrandThreshold id={id} name={name}>
      <main className="fixed inset-0 flex flex-col" style={{ background }} aria-label={name}>
        <div className="relative shrink-0" style={{ height: "calc(3.5rem + env(safe-area-inset-top))" }}>
          <InterventionNav position="absolute" tone={tone} back={nav.back !== false} home={nav.home !== false} />
        </div>
        <iframe
          ref={frame}
          title={name}
          src={src}
          className="min-h-0 w-full flex-1 border-0"
          allow="autoplay"
          style={{ width: "100%", maxWidth: "none" }}
          onLoad={() => {
            loaded.current = true;
            sync();
          }}
        />
      </main>
    </WithBrandThreshold>
  );
}
