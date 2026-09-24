import colourwayData from "@/lib/brandColourways.json";
import logoLayout from "@/lib/brandLogoLayout.json";

// The Mentication brand thread.
//
// Every intervention keeps its own colour world (its "atmosphere"), but all of
// them share the same brand elements on top: the coral Doorway (the arch from
// the logo), the coral Thread (the brush swash under the wordmark), Hanken
// Grotesk for interface text and EB Garamond italic for "moment" headlines.
// See docs/BRAND_THREAD.md.

// Brand coral is the accent from the logo's swash and arch. `onDark` is the
// slightly lifted version used on dark atmospheres; `onLight` is the deeper
// version used on the cream 5-4-3-2-1 Grounding atmosphere.
export const BRAND_CORAL = Object.freeze({
  onDark: "#E0715C",
  onLight: "#D6553F",
});

export const BRAND_CREAM = "#F6EFE2";
export const BRAND_NAVY = "#0E2A52";

// Timing/easing shared by every brand moment so they all feel like one hand.
export const BRAND_EASE = [0.22, 1, 0.36, 1];
export const BRAND_THRESHOLD_MS = 1700;
// How long the intervention loads underneath the opaque threshold before it lifts.
export const BRAND_HANDOFF_MS = 500;

const DEFAULT_ATMOSPHERE = Object.freeze({
  background: "#0A1F3D",
  glow: "rgba(224, 113, 92, 0.16)",
  tone: "dark",
});

// Colour worlds sampled from each intervention's own screens.
// `tone: "light"` means the atmosphere is a light surface (ink text, deeper coral).
export const INTERVENTION_ATMOSPHERE = Object.freeze({
  boxV2: { background: "#010E24", glow: "rgba(138, 236, 199, 0.16)", tone: "dark" },
  "progressive-muscle-relaxation-v2": { background: "#271327", glow: "rgba(190, 150, 200, 0.18)", tone: "dark" },
  factCheck: { background: "#024B58", glow: "rgba(238, 229, 207, 0.14)", tone: "dark" },
  urgeSurf: { background: "#041014", glow: "rgba(88, 207, 199, 0.16)", tone: "dark" },
  happyBump: { background: "#031513", glow: "rgba(85, 201, 166, 0.18)", tone: "dark" },
  changeScene: { background: "#2A0E15", glow: "rgba(162, 249, 184, 0.14)", tone: "dark" },
  grounding54321V2: { background: "#ECE2D2", glow: "rgba(14, 69, 54, 0.10)", tone: "light" },
  vectorShift: { background: "#0B2A1F", glow: "rgba(0, 255, 136, 0.14)", tone: "dark" },
  nextAction: { background: "#0B2A26", glow: "rgba(165, 243, 252, 0.14)", tone: "dark" },
  signalLock: { background: "#06131F", glow: "rgba(255, 211, 107, 0.14)", tone: "dark" },
  tomorrowParking: { background: "#0C0A10", glow: "rgba(214, 120, 100, 0.14)", tone: "dark" },
  nightChannel: { background: "#02050B", glow: "rgba(158, 182, 255, 0.14)", tone: "dark" },
});

/** The atmosphere for an intervention id, falling back to Mentication navy. */
export function getBrandAtmosphere(id) {
  return INTERVENTION_ATMOSPHERE[id] || DEFAULT_ATMOSPHERE;
}

/** The line colour for an intervention: its logo's swash colour. */
export function getBrandCoral(id) {
  return getBrandColourway(id).swash;
}

// Each intervention gets its own colourway of the REAL logo, taken from the
// MCN V1 Branding Kit (see src/lib/brandColourways.json). The shapes are never
// redrawn; scripts/build_brand_logos.py recolours the supplied artwork.
export const BRAND_COLOURWAYS = colourwayData.colourways;

export const INTERVENTION_COLOURWAY = Object.freeze({
  boxV2: "sky-peach",
  "progressive-muscle-relaxation-v2": "blush-mustard",
  factCheck: "cream-rose-sage",
  urgeSurf: "emerald-cream",
  happyBump: "sun-violet",
  changeScene: "garnet-meadow",
  grounding54321V2: "sage-rose",
  vectorShift: "lilac-lime",
  nextAction: "peach-teal",
  signalLock: "cobalt-coral",
  tomorrowParking: "cream-red",
  nightChannel: "sky-lilac",
});

const DEFAULT_COLOURWAY = "cream-rose-sage";

/** The colourway id for an intervention (falls back to a neutral brand one). */
export function getBrandColourwayId(id) {
  return INTERVENTION_COLOURWAY[id] || DEFAULT_COLOURWAY;
}

/** The four ink colours (wordmark, figure, swash, arch) for an intervention. */
export function getBrandColourway(id) {
  return BRAND_COLOURWAYS[getBrandColourwayId(id)];
}

/**
 * The three real logo parts, coloured for this intervention, with where each
 * sits on the original artwork (as percentages of the artwork's size).
 */
export function getBrandLogoParts(id) {
  const folder = `/media/brand/logo/${getBrandColourwayId(id)}`;
  const { width, height, layers } = logoLayout;
  const part = (name) => ({
    src: `${folder}/${name}.png`,
    left: (layers[name].x / width) * 100,
    top: (layers[name].y / height) * 100,
    width: (layers[name].w / width) * 100,
    height: (layers[name].h / height) * 100,
  });
  return {
    aspect: width / height,
    doorway: part("doorway"),
    wordmark: part("wordmark"),
    swash: part("swash"),
  };
}

/** Ink (text) colour appropriate for the atmosphere's tone. */
export function getBrandInk(id) {
  return getBrandAtmosphere(id).tone === "light" ? BRAND_NAVY : BRAND_CREAM;
}
