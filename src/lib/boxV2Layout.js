// =====================================================================
// PRODUCTION-LOCKED · Box Breathing V2 (approved benchmark)
// Do NOT change visuals, timing, narration, audio, layout or
// functionality without an explicit request. Benchmark standard for
// future Mentication interventions. Spec: docs/box-breathing-v2-spec.md
// =====================================================================

// Shared layout constants for Box Breathing V2 — used by both the static
// instruction frame and the paced pacer so the loom and tracing square stay
// perfectly aligned across the two states.
//
// The SQUARE is the hero breathing-path container; it is sized responsively
// (viewport-width-capped so it stays centred with equal side margins on every
// mobile width, viewport-height-capped so it fits the stage) and centred by the
// parent flex.
//
// Both use explicit width/height (never inset-only on the <svg>, which is a
// replaced element that would otherwise honour only `left` and drift off-centre).

export const BOX_V2_SQUARE_STYLE = {
  width: "min(90vw, 54dvh, 24.25rem)",
  height: "min(90vw, 54dvh, 24.25rem)",
};

// SVG rounded-square path, clockwise starting at the bottom-left corner and
// going up the left side → across the top → down the right → across the bottom,
// matching the requested breathing circuit:
//   bottom-left → top-left → top-right → bottom-right → bottom-left
const P = 10;   // inset from the 0..100 viewBox edge
const RC = 12;   // corner radius
export const BOX_V2_PATH_D = [
  `M ${P},${100 - P - RC}`,
  `L ${P},${P + RC}`,
  `A ${RC},${RC} 0 0 1 ${P + RC},${P}`,
  `L ${100 - P - RC},${P}`,
  `A ${RC},${RC} 0 0 1 ${100 - P},${P + RC}`,
  `L ${100 - P},${100 - P - RC}`,
  `A ${RC},${RC} 0 0 1 ${100 - P - RC},${100 - P}`,
  `L ${P + RC},${100 - P}`,
  `A ${RC},${RC} 0 0 1 ${P},${100 - P - RC}`,
  "Z",
].join(" ");

// Faint static rounded-square outline (always visible, the "square shape").
export const BOX_V2_OUTLINE_RECT = {
  x: P,
  y: P,
  width: 100 - 2 * P,
  height: 100 - 2 * P,
  rx: RC,
  ry: RC,
};