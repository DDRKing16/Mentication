// 5-4-3-2-1 Grounding V2 — master premium layout (light ivory / pearl-glass).
//
// A warm ivory/pearl field with a faded mint-sage wash on the left, faint
// apricot/powder-blue/lavender traces at the edges, and a central pearl-glass
// human silhouette. Each sense stage surrounds the figure with its own number
// of coloured sensory elements: SEE 5 lights, FEEL 4 ripples, HEAR 3 waves,
// SMELL 2 wisps, TASTE 1 droplet.
//
// This is Grounding-V2-specific and shares nothing with Box Breathing V2's
// `boxV2Layout`. Positions are expressed in a 0..100 SVG space (centre 50,52)
// so the single scene scales responsively to its container.

export const INK = "#1A2E26"; // deep forest-green typography
export const BG_IVORY = "#FDF9F3";
export const MINT_WASH = "#E0EBE6";
export const PASTEL_WASH = "#F5F0E9";

// Responsive square — the full figure + sensory ring + arc must fit without
// cropping, so it is capped by both viewport width and height.
export const GROUNDING_V2_FIELD_SIZE = {
  width: "min(86vw, 50vh, 30rem)",
  height: "min(86vw, 50vh, 30rem)",
};

export const GROUNDING_V2_CENTER = { x: 50, y: 52 };

const at = (deg, r = 34) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: +(GROUNDING_V2_CENTER.x + r * Math.cos(rad)).toFixed(1),
    y: +(GROUNDING_V2_CENTER.y + r * Math.sin(rad)).toFixed(1),
  };
};

// SEE — five lights around the figure (sage, apricot, powder blue, lavender,
// champagne gold), clockwise from the top.
export const SEE_LIGHTS = [
  { id: 0, ...at(0), color: "#9CC4A8", glow: "rgba(156,196,168,0.55)" },
  { id: 1, ...at(72), color: "#F2C9A0", glow: "rgba(242,201,160,0.5)" },
  { id: 2, ...at(144), color: "#A8C8E0", glow: "rgba(168,200,224,0.5)" },
  { id: 3, ...at(216), color: "#C9B8E0", glow: "rgba(201,184,224,0.5)" },
  { id: 4, ...at(288), color: "#E8D9A8", glow: "rgba(232,217,168,0.5)" },
];

// FEEL — four touch-ripple anchors on the figure (shoulders + hands/lap).
export const FEEL_POINTS = [
  { id: 0, x: 38, y: 46 },
  { id: 1, x: 62, y: 46 },
  { id: 2, x: 43, y: 67 },
  { id: 3, x: 57, y: 67 },
];

// HEAR — three sound-wave origins arriving from different directions.
export const HEAR_WAVES = [
  { id: 0, x: 16, y: 52 },
  { id: 1, x: 50, y: 14 },
  { id: 2, x: 84, y: 52 },
];

// SMELL — two wisps rising from the lower edges.
export const SMELL_WISPS = [
  { id: 0, x: 40, y: 80 },
  { id: 1, x: 60, y: 80 },
];

// TASTE — one champagne-gold droplet drifting into the figure's centre.
export const TASTE_DROP = { x: 50, y: 16, target: { x: 50, y: 52 } };

// SEE — CSS glow-overlay positions matching the five orb glows already baked
// into grounding-figure.png (percentages of the PNG's own square bounding
// box, measured directly from the artwork's pixel data — not the old SVG
// pentagon layout above, which no longer corresponds to any on-screen element).
export const SEE_ORB_GLOWS = [
  { id: "upper-left", left: 10.4, top: 17.7, color: "#9CC4A8" }, // sage
  { id: "upper-right", left: 89.8, top: 17.6, color: "#D9B673" }, // muted gold
  { id: "lower-left", left: 10.5, top: 53.5, color: "#C9B8E0" }, // lavender
  { id: "lower-right", left: 90.8, top: 53.6, color: "#A8C8E0" }, // pale blue
  { id: "bottom-center", left: 49.4, top: 83.7, color: "#F09A5E" }, // warm orange-apricot
];

// Stage metadata for the top markers + sense label. `cue` is the short
// uppercase prompt shown above the spoken sentence in the reserved
// instruction area beneath the visual.
export const STAGES = [
  { sense: "sight", label: "SEE", count: 5, accent: "#9CC4A8", cue: "NOTICE" },
  { sense: "touch", label: "FEEL", count: 4, accent: "#C9B8E0", cue: "FEEL" },
  { sense: "hearing", label: "HEAR", count: 3, accent: "#A8C8E0", cue: "LISTEN" },
  { sense: "smell", label: "SMELL", count: 2, accent: "#F2C9A0", cue: "BREATHE" },
  { sense: "taste", label: "TASTE", count: 1, accent: "#E8D9A8", cue: "TASTE" },
  { sense: "recenter", label: "RECENTER", count: 1, accent: "#9CC4A8", cue: "ARRIVE" },
];