/**
 * Approved Mentication palettes sampled from the supplied final branding art.
 *
 * Structural UI values (spacing, radii, typography and motion) intentionally
 * live elsewhere. These tokens only change colour, so every intervention keeps
 * the same interaction and layout language.
 */
export const MENTICATION_PALETTES = Object.freeze({
  primaryEmerald: {
    id: "primary-emerald",
    name: "Primary Emerald, Ivory & Gold",
    mode: "dark",
    background: "#1E3C42",
    surface: "#27494E",
    foreground: "#FFFFFF",
    muted: "#ECE2D2",
    accent: "#C99646",
    accentRgb: "201 150 70",
  },
  creamEmeraldGold: {
    id: "cream-emerald-gold",
    name: "Cream, Emerald & Gold",
    mode: "light",
    background: "#ECE2D2",
    surface: "#FFFFFF",
    foreground: "#0E4536",
    muted: "#315E51",
    accent: "#CE9131",
    accentRgb: "206 145 49",
  },
  butterDeepGreen: {
    id: "butter-deep-green",
    name: "Butter Cream & Deep Green",
    mode: "light",
    background: "#F4E1A8",
    surface: "#FFF4CF",
    foreground: "#0B3925",
    muted: "#315B49",
    accent: "#0B3925",
    accentRgb: "11 57 37",
  },
  plumSilk: {
    id: "plum-silk",
    name: "Deep Plum & Silk Cream",
    mode: "dark",
    background: "#240B21",
    surface: "#35122F",
    foreground: "#F2E9E0",
    muted: "#D6BFA9",
    accent: "#D6BFA9",
    accentRgb: "214 191 169",
  },
  peacockPink: {
    id: "peacock-pink",
    name: "Peacock Blue & Bubblegum Pink",
    mode: "dark",
    background: "#024B58",
    surface: "#075A68",
    foreground: "#FFFFFF",
    muted: "#F3D9DD",
    accent: "#F3BDC5",
    accentRgb: "243 189 197",
  },
  emeraldPinkWhite: {
    id: "emerald-pink-white",
    name: "Emerald Green, Pink & White",
    mode: "dark",
    background: "#03432B",
    surface: "#085239",
    foreground: "#FFFFFF",
    muted: "#F4E4E5",
    accent: "#D88389",
    accentRgb: "216 131 137",
  },
  aubergineLavenderCopper: {
    id: "aubergine-lavender-copper",
    name: "Aubergine, Lavender & Rose Copper",
    mode: "dark",
    background: "#271327",
    surface: "#351D35",
    foreground: "#E9E0F0",
    muted: "#CBB7DD",
    accent: "#CB8884",
    accentRgb: "203 136 132",
  },
  midnightGlacialMetal: {
    id: "midnight-glacial-metal",
    name: "Midnight Navy, Glacial Blue & Copper/Silver",
    mode: "dark",
    background: "#010E24",
    surface: "#071A34",
    foreground: "#E5F1FC",
    muted: "#B1D7FB",
    accent: "#C5805E",
    accentAlt: "#9BA2AB",
    accentRgb: "197 128 94",
  },
});

const SPECIAL_INTERVENTION_PALETTES = Object.freeze({
  boxV2: "midnightGlacialMetal",
  grounding54321V2: "creamEmeraldGold",
  "progressive-muscle-relaxation-v2": "aubergineLavenderCopper",
  factCheck: "peacockPink",
});

const DIRECTION_PALETTES = Object.freeze({
  calm: "primaryEmerald",
  reset: "plumSilk",
  lift: "emeraldPinkWhite",
  ground: "creamEmeraldGold",
  focus: "butterDeepGreen",
  sleep: "midnightGlacialMetal",
});

export function paletteForIntervention(intervention, direction) {
  const key = SPECIAL_INTERVENTION_PALETTES[intervention?.id]
    || DIRECTION_PALETTES[direction]
    || DIRECTION_PALETTES[intervention?.primaryDirection]
    || "primaryEmerald";
  return MENTICATION_PALETTES[key];
}

export function interventionThemeStyle(palette) {
  return {
    "--intervention-bg": palette.background,
    "--intervention-surface": palette.surface,
    "--intervention-fg": palette.foreground,
    "--intervention-muted": palette.muted,
    "--intervention-accent": palette.accent,
    "--intervention-accent-rgb": palette.accentRgb,
  };
}

