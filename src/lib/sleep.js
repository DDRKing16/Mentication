// Sleep-specific data: awake-reason picker, procedural soundscape layer defs,
// curated mixes, and a night-time helper.

export const AWAKE_REASONS = [
  { id: "racing", label: "Racing thoughts", whereFelt: "thoughts" },
  { id: "body", label: "Tense, wired body", whereFelt: "body" },
  { id: "loop", label: "Can’t switch off", whereFelt: "both" },
  { id: "wake", label: "Woke up, can’t get back", whereFelt: "both" },
  { id: "dread", label: "Dread about tomorrow", whereFelt: "thoughts" },
  { id: "screen", label: "Overstimulated", whereFelt: "both" },
];

// Procedural soundscape layer definitions consumed by useSoundscapeMixer.
export const SOUNDSCAPE_LAYERS = [
  { id: "ocean", label: "Ocean swell" },
  { id: "rain", label: "Soft rain" },
  { id: "wind", label: "Low wind" },
  { id: "hum", label: "Warm hum" },
  { id: "brown", label: "Brown noise" },
  { id: "stream", label: "Forest stream" },
  { id: "fireplace", label: "Fireplace" },
  { id: "bowl", label: "Singing bowl" },
];

export const MIX_PRESETS = [
  { id: "deep", label: "Deep sleep", layers: { hum: 0.45, brown: 0.4 } },
  { id: "rainy", label: "Rainy night", layers: { rain: 0.6, wind: 0.2 } },
  { id: "ocean", label: "Ocean drift", layers: { ocean: 0.7 } },
  { id: "forest", label: "Forest stream", layers: { stream: 0.55, wind: 0.15 } },
  { id: "fire", label: "Warm fire", layers: { fireplace: 0.6, wind: 0.1 } },
  { id: "bowl", label: "Calm bowl", layers: { bowl: 0.5, brown: 0.3 } },
];

export function isNightTime(date = new Date()) {
  const h = date.getHours();
  return h >= 20 || h < 6;
}