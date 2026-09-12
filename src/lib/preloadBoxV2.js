// =====================================================================
// PRODUCTION-LOCKED · Box Breathing V2 (approved benchmark)
// Do NOT change visuals, timing, narration, audio, layout or
// functionality without an explicit request. Benchmark standard for
// future Mentication interventions. Spec: docs/box-breathing-v2-spec.md
// =====================================================================
import { spokenFor } from "@/lib/spoken";
import { getNarration } from "@/lib/narrationService";

// Early preloading for Box Breathing V2, kicked off the moment the
// intervention is selected (during the building / pathway-overview phase) —
// before the instruction screen ever renders. The paced centrepiece is now a
// native SVG and needs no image/video preload.

// The persistent backdrop artwork.
export const BOX_V2_BACKGROUND_URL = "/media/box-breathing-bg-v2.png";

// Fetch AND decode the backdrop while the previous screen is still visible, so
// the first painted frame of the exercise already contains the artwork.
let backgroundReady = null;
export function warmBackground() {
  if (backgroundReady) return backgroundReady;
  const img = new Image();
  img.fetchPriority = "high";
  img.src = BOX_V2_BACKGROUND_URL;
  backgroundReady = img.decode
    ? img.decode().catch(() => {})
    : img.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
  return backgroundReady;
}

// Warm the browser's audio cache for the first instruction lines' local
// narration ahead of time, so playback starts promptly when the instruction
// screen appears. Reads straight from the local narration manifest — no
// network request is made.
const warmedTexts = new Set();
export function warmNarration(iv, direction) {
  if (!iv?.steps?.length) return;
  iv.steps.slice(0, 2).forEach((s) => {
    const text = spokenFor(s, iv, direction);
    if (!text || warmedTexts.has(text)) return;
    warmedTexts.add(text);
    const url = getNarration(text)?.url;
    if (url) {
      const a = new Audio(url);
      a.preload = "auto";
      a.load();
    }
  });
}
