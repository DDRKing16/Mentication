// Dedicated spoken-script layer for intervention narration.
//
// On-screen text and spoken text are different content formats. This module
// converts a step's written instructions into a natural, human-paced spoken
// string — short phrases, contractions, and deliberate pauses encoded through
// sentence / paragraph breaks (the speech engine honours punctuation as
// silence). Pace-only steps (visual breathing guide, no body) return "" so the
// voice gets out of the way and silence becomes part of the intervention.

const SOFTEN = [
  [/\bInhale\b/g, "Breathe in"],
  [/\bExhale\b/g, "Breathe out"],
  [/^Place /, "Just place "],
  [/^Try /, "You can try to "],
];

function soften(sentence) {
  let s = sentence;
  for (const [re, rep] of SOFTEN) s = s.replace(re, rep);
  return s;
}

// Break a written instruction into short, naturally paced spoken phrases.
// Em-dashes and semicolons become full stops (a breath); sentences are
// separated by paragraph breaks so the narrator leaves a little space between
// ideas rather than running them together.
function toSpoken(body) {
  let s = body.trim();
  s = s.replace(/\s—\s/g, ". ");
  s = s.replace(/;\s*/g, ". ");
  const sentences = s
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(soften);
  if (!sentences.length) return "";
  return sentences.join("\n\n");
}

// Returns the spoken string for a step, or "" for pace-only / silent steps.
export function spokenFor(step, iv, direction) {
  if (!step) return "";
  if (typeof step.speak === "string" && step.speak.trim()) return step.speak.trim();
  if (!step.body || !step.body.trim()) return "";
  return toSpoken(step.body);
}

// Direction-tuned delivery. The warm "honey" voice carries most directions;
// "river" (calm, neutral, clean) suits focus. Rate and a leading silence
// before the first words vary by purpose — sleep is slowest with the most
// space, focus is a touch brighter and begins sooner.
export function voiceFor(direction) {
  switch (direction) {
    case "sleep":  return { voice: "river", rate: 0.78, leadMs: 1800 };
    case "calm":   return { voice: "river", rate: 0.80, leadMs: 1400 };
    case "ground": return { voice: "river", rate: 0.82, leadMs: 1200 };
    case "reset":  return { voice: "river", rate: 0.80, leadMs: 1400 };
    case "focus":  return { voice: "river", rate: 0.84, leadMs: 1000 };
    case "lift":   return { voice: "river", rate: 0.82, leadMs: 1100 };
    default:       return { voice: "river", rate: 0.82, leadMs: 1200 };
  }
}