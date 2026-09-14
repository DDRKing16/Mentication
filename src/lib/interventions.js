import { dislikePenalty } from "./preferences.js";
import {
  computeEffectivenessV3,
  contextKeyV3,
  hardEligibleV3,
  inferProfileV3,
  interventionDurationSeconds,
  scoreInterventionV3,
  immediateEligibleV3,
} from "./recommendationV3.js";
import {
  createCore25Catalogue,
  createFinal50Resolver,
  CORE_25_CATALOGUE_VERSION,
} from "./final50Catalog.js";

// Modular intervention library + recommendation engine for the Reset app.
//
// Every intervention carries rich metadata so the engine can score on state,
// intensity, time, location, audio, movement, and previous effectiveness —
// and assemble a coherent, mechanism-diverse pathway.

export const RECOMMENDATION_ENGINE_VERSION = "3.3.0-flagship17";
export { CORE_25_CATALOGUE_VERSION };

export const STATES = [
  { id: "anxious", label: "Anxious", icon: "CloudRain" },
  { id: "overthinking", label: "Overthinking", icon: "Brain" },
  { id: "panicky", label: "Panicky", icon: "Zap" },
  { id: "overwhelmed", label: "Overwhelmed", icon: "Waves" },
  { id: "tense", label: "Tense", icon: "Activity" },
  { id: "restless", label: "Restless", icon: "Shuffle" },
  { id: "overstimulated", label: "Overstimulated", icon: "Volume2" },
  { id: "cant_switch_off", label: "Can’t switch off", icon: "RefreshCw" },
  { id: "cant_sleep", label: "Can’t sleep", icon: "Moon" },
  { id: "worried", label: "Worried about something", icon: "HelpCircle" },
];

export const DIRECTIONS = [
  { id: "calm", label: "Calm", desc: "Reduce activation" },
  { id: "lift", label: "Lift", desc: "Increase healthy activation / mood / momentum" },
  { id: "ground", label: "Ground", desc: "Present-moment connection" },
  { id: "reset", label: "Reset", desc: "Shift mental state / reduce rumination" },
  { id: "focus", label: "Focus", desc: "Restore attention and action" },
  { id: "sleep", label: "Sleep", desc: "Wind down to rest" },
];

export const HOME_CARDS = [
  { id: "calm", label: "Calm down", sub: "Lower the activation", direction: "calm" },
  { id: "lift", label: "Feel better", sub: "Lift your mood", direction: "lift" },
  { id: "ground", label: "Feel grounded", sub: "Come back to now", direction: "ground" },
  { id: "focus", label: "Focus", sub: "Restore attention", direction: "focus" },
  { id: "sleep", label: "Sleep", sub: "Wind down to rest", direction: "sleep" },
  { id: "unsure", label: "Not sure", sub: "We’ll figure it out", unsure: true },
];

export const SOMETHING_ELSE_PLACEHOLDERS = [
  "racing thoughts I can’t name",
  "a tight feeling in my chest",
  "dread, but I don’t know why",
  "irritable and on edge",
  "numb and disconnected",
  "a foggy, heavy head",
  "like I want to crawl out of my skin",
  "wired but exhausted",
  "a knot in my stomach",
  "can’t slow my breathing down",
];

export const TIME_OPTIONS = [
  { value: 2, label: "2 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20+ min" },
];

export const WHERE_OPTIONS = [
  { value: "thoughts", label: "Mostly my thoughts", icon: "Brain" },
  { value: "body", label: "Mostly my body", icon: "Activity" },
  { value: "both", label: "Both, about equal", icon: "Waves" },
];

export const AUDIO_OPTIONS = [
  { value: "yes", label: "Yes, audio is fine", icon: "Volume2" },
  { value: "quiet", label: "Quietly, maybe", icon: "Feather" },
  { value: "no", label: "No audio", icon: "VolumeX" },
];

export const MOVE_OPTIONS = [
  { value: "yes", label: "Yes, I can move", icon: "Shuffle" },
  { value: "seated", label: "Seated only", icon: "Armchair" },
  { value: "discreet", label: "Just discreetly", icon: "EyeOff" },
];

export const LOCATION_OPTIONS = [
  { value: "home", label: "At home", icon: "Home" },
  { value: "work", label: "At work", icon: "Briefcase" },
  { value: "public", label: "In public", icon: "Users" },
  { value: "outdoors", label: "Out and about", icon: "TreePine" },
];

export const SWITCH_MODES = [
  { value: "physical", label: "Something physical", icon: "Activity", hint: "Body-first, grounding" },
  { value: "thoughts", label: "Something for my thoughts", icon: "Brain", hint: "Mind-first, defusion" },
  { value: "quieter", label: "Something quieter", icon: "Feather", hint: "Softer, slower" },
  { value: "energising", label: "Something energising", icon: "Zap", hint: "A little more active" },
  { value: "unsure", label: "Not sure — surprise me", icon: "Shuffle", hint: "You choose" },
];

// ---- factory with sensible metadata defaults ----
const make = (o) => ({
  category: "breathing",
  type: o.category || "breathing",
  mechanism: "paced-breath",
  targets: ["both"],
  states: ["any"],
  intensityMin: 0,
  intensityMax: 10,
  durationMin: 3,
  cognitiveLoad: 2,
  physicalDemand: 1,
  environment: "any",
  eyes: "either",
  audio: "optional",
  movement: "seated",
  discreet: false,
  bedtime: false,
  panic: false,
  performanceSafe: true,
  energy: "calming",
  arousal: "lower",
  closing: false,
  releaseStatus: "production",
  experienceTier: "standard",
  recommendationEligible: true,
  automaticEligible: true,
  allowExploration: true,
  riskLevel: "low",
  requiredResources: [],
  contraindicationTags: [],
  supportedSubstates: [],
  unsuitableSubstates: [],
  directions: o.directions || (o.bedtime ? ["sleep", "calm"] : o.category === "grounding" ? ["ground", "calm"] : o.category === "cognitive" ? ["reset", "calm"] : ["calm"]),
  ...o,
});

// =========================== BREATHING / PHYSIOLOGICAL (28) ===========================
const BREATHING = [
  make({ id: "sigh", name: "Extended Exhale", category: "breathing", mechanism: "exhale-lengthening", why: "A few long sighs signal safety to your nervous system — the fastest way to step the brakes.", targets: ["body", "both"], states: ["anxious", "tense", "cant_switch_off", "panicky", "restless", "any"], durationMin: 2, panic: true, closing: true, basePriority: 6, steps: [
    { title: "Settle", body: "Soften your shoulders. We’ll take a few extended sighs — no effort, just follow along.", holdSec: 8 },
    { title: "Double inhale, long exhale", body: "In through the nose, then one short sip more at the top. Let it all go through the mouth with a soft sigh.", pace: [{ label: "Breathe in", sec: 3 }, { label: "A little more", sec: 1 }, { label: "Long sigh out", sec: 6 }], holdSec: 30 },
    { title: "Again, gently", body: "Let the exhale be longer than the inhale. That’s the whole secret.", pace: [{ label: "Breathe in", sec: 3 }, { label: "A little more", sec: 1 }, { label: "Long sigh out", sec: 6 }], holdSec: 40 },
    { title: "Pause", body: "Notice any small softening — a little more room in the chest.", holdSec: 10 },
  ] }),
  make({ id: "cyclicSigh", name: "Cyclic Sighing", category: "breathing", mechanism: "exhale-lengthening", why: "Repeating the sigh is one of the most effective ways to quickly calm the body.", targets: ["body", "both"], states: ["anxious", "panicky", "tense", "overwhelmed"], durationMin: 3, panic: true, closing: true, basePriority: 6, steps: [
    { title: "Begin the cycle", body: "Each round: two inhales, one long sigh out.", holdSec: 6 },
    { title: "Round one", pace: [{ label: "In", sec: 2 }, { label: "More", sec: 1 }, { label: "Sigh out", sec: 6 }], holdSec: 18 },
    { title: "Round two", pace: [{ label: "In", sec: 2 }, { label: "More", sec: 1 }, { label: "Sigh out", sec: 6 }], holdSec: 18 },
    { title: "Round three", pace: [{ label: "In", sec: 2 }, { label: "More", sec: 1 }, { label: "Sigh out", sec: 6 }], holdSec: 18 },
    { title: "Rest", body: "Let the breath settle on its own.", holdSec: 12 },
  ] }),
  make({ id: "box", name: "Box Breathing", category: "breathing", mechanism: "paced-hold", why: "A steady square of breath steadies a racing heart and brings you back to the room.", targets: ["body", "both"], states: ["anxious", "tense", "overwhelmed", "restless", "panicky"], durationMin: 4, panic: true, basePriority: 5, steps: [
    { title: "Find your seat", body: "Feet on the floor, hands soft. We’ll breathe a calm square — in, hold, out, hold.", holdSec: 8 },
    { title: "4 · 4 · 4 · 4", body: "Follow the square. If you lose count, just rejoin.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hold", sec: 4 }, { label: "Breathe out", sec: 4 }, { label: "Hold", sec: 4 }], holdSec: 48 },
    { title: "Keep the square", body: "Let each side be smooth and unhurried.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hold", sec: 4 }, { label: "Breathe out", sec: 4 }, { label: "Hold", sec: 4 }], holdSec: 48 },
    { title: "Rest", body: "Let the breath find its own rhythm.", holdSec: 10 },
  ] }),
  make({ id: "boxV2", name: "Box Breathing V2", category: "breathing", mechanism: "paced-hold", why: "A steady square of breath steadies a racing heart and brings you back to the room.", targets: ["body", "both"], states: ["anxious", "tense", "overwhelmed", "restless", "panicky"], durationMin: 2, panic: true, basePriority: 5, steps: [
    { title: "Find your seat", body: "Feet on the floor, hands soft. We’ll breathe a calm square — in, hold, out, hold.", holdSec: 8 },
    { title: "4 · 4 · 4 · 4", body: "Follow the square. If you lose count, just rejoin.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hold", sec: 4 }, { label: "Breathe out", sec: 4 }, { label: "Hold", sec: 4 }], holdSec: 64, boxV2: true },
    { title: "Rest", body: "Let the breath find its own rhythm.", holdSec: 10 },
  ] }),
  make({ id: "coherent", name: "Soft Belly Breathing", category: "breathing", mechanism: "paced-equal", why: "Slow, even breathing at around six a minute settles your whole system.", targets: ["body", "both"], states: ["anxious", "panicky", "cant_sleep", "cant_switch_off", "tense"], durationMin: 5, gentle: true, bedtime: true, closing: true, basePriority: 4, steps: [
    { title: "Soften the belly", body: "Let your belly be loose. About five seconds in, five out.", holdSec: 10 },
    { title: "Even in, even out", body: "Match inhale to exhale. Smooth, slow, easy.", pace: [{ label: "Breathe in", sec: 5 }, { label: "Breathe out", sec: 5 }], holdSec: 60 },
    { title: "Stay with it", body: "Mind wandering is fine — come back to the count.", pace: [{ label: "Breathe in", sec: 5 }, { label: "Breathe out", sec: 5 }], holdSec: 60 },
    { title: "Rest", body: "Let go of the count and rest in the stillness.", holdSec: 12 },
  ] }),
  make({ id: "four78", name: "4-7-8 Breath", category: "breathing", mechanism: "paced-hold", why: "A longer hold and exhale strongly cues the calming branch of your nervous system.", targets: ["body"], states: ["anxious", "cant_sleep", "tense", "overwhelmed"], durationMin: 4, bedtime: true, basePriority: 4, steps: [
    { title: "Tongue to ridge", body: "Rest the tongue just behind your front teeth. Exhale fully first.", holdSec: 8 },
    { title: "In 4 · Hold 7 · Out 8", body: "Inhale through the nose for 4, hold for 7, exhale through the mouth for 8.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hold", sec: 7 }, { label: "Breathe out", sec: 8 }], holdSec: 38 },
    { title: "Again", body: "Keep the count steady. The long exhale does the work.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hold", sec: 7 }, { label: "Breathe out", sec: 8 }], holdSec: 38 },
    { title: "Settle", body: "Let the breath return to normal.", holdSec: 10 },
  ] }),
  make({ id: "resonant", name: "Resonant Breathing", category: "breathing", mechanism: "paced-equal", why: "Six breaths a minute maximises heart-rate variability — your resilience buffer.", targets: ["body", "both"], states: ["anxious", "overwhelmed", "cant_switch_off"], durationMin: 5, gentle: true, closing: true, basePriority: 4, steps: [
    { title: "Find six a minute", body: "Five seconds in, five out. Smooth and unhurried.", holdSec: 10 },
    { title: "Resonate", pace: [{ label: "Breathe in", sec: 5 }, { label: "Breathe out", sec: 5 }], holdSec: 60 },
    { title: "Stay", pace: [{ label: "Breathe in", sec: 5 }, { label: "Breathe out", sec: 5 }], holdSec: 60 },
    { title: "Rest", body: "Notice the steady rhythm you’ve made.", holdSec: 12 },
  ] }),
  make({ id: "nadi", name: "Alternate Nostril", category: "breathing", mechanism: "nostril-alternate", why: "Balancing the two sides of the breath brings a deeply settled, clear-headed calm.", targets: ["body", "thoughts"], states: ["overthinking", "anxious", "overwhelmed", "cant_switch_off"], durationMin: 5, physicalDemand: 2, basePriority: 3, steps: [
    { title: "Right hand ready", body: "Thumb on right nostril, ring finger on left. We’ll alternate sides.", holdSec: 10 },
    { title: "Close right, inhale left", body: "Close the right nostril, inhale through the left.", pace: [{ label: "In (left)", sec: 4 }], holdSec: 6 },
    { title: "Switch, exhale right", body: "Close left, open right, exhale. Then inhale right.", pace: [{ label: "Out (right)", sec: 4 }, { label: "In (right)", sec: 4 }], holdSec: 10 },
    { title: "Switch, exhale left", body: "Close right, open left, exhale. That’s one round — continue gently.", pace: [{ label: "Out (left)", sec: 4 }], holdSec: 6 },
    { title: "A few more rounds", body: "Keep alternating at your own easy pace.", holdSec: 70 },
    { title: "Finish", body: "Rest both hands. Notice the balance.", holdSec: 12 },
  ] }),
  make({ id: "bhramari", name: "Humming Bee Breath", category: "breathing", mechanism: "hum-resonance", why: "The hum vibrates the vagus nerve and gently slows everything down.", targets: ["body", "thoughts"], states: ["overthinking", "anxious", "cant_switch_off", "overstimulated"], durationMin: 3, audio: "required", basePriority: 3, steps: [
    { title: "Close your ears", body: "Gently press flaps over your ears. Lips softly closed.", holdSec: 8 },
    { title: "Hum on the exhale", body: "Inhale, then hum a steady ‘mmmm’ until empty.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hum out", sec: 8 }], holdSec: 30 },
    { title: "Feel the vibration", body: "Let the hum fill your skull and settle the mind.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Hum out", sec: 8 }], holdSec: 30 },
    { title: "Rest in the quiet", body: "Notice the stillness after the hum.", holdSec: 12 },
  ] }),
  make({ id: "lion", name: "Lion’s Breath", category: "breathing", mechanism: "forceful-exhale", why: "A big, open exhale with a soft roar releases jaw tension and stuck energy.", targets: ["body"], states: ["tense", "restless", "frustrated", "overwhelmed"], durationMin: 2, physicalDemand: 2, energy: "grounding", environment: "private", basePriority: 3, steps: [
    { title: "Open wide", body: "Inhale through the nose. Open your mouth wide, tongue out.", holdSec: 8 },
    { title: "Exhale with a ‘ha’", body: "Let out a strong, audible ‘haaaa’ from the belly.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Release", sec: 6 }], holdSec: 30 },
    { title: "Repeat", body: "Three or four rounds. Let the jaw fully release each time.", pace: [{ label: "Breathe in", sec: 4 }, { label: "Release", sec: 6 }], holdSec: 40 },
    { title: "Soften", body: "Close the mouth, feel the face relax.", holdSec: 10 },
  ] }),
  make({ id: "pursedLip", name: "Pursed-Lip Breathing", category: "breathing", mechanism: "exhale-lengthening", why: "Breathing out slowly through pursed lips keeps airways open and slows the breath.", targets: ["body"], states: ["panicky", "anxious", "tense"], durationMin: 3, panic: true, discreet: true, basePriority: 4, steps: [
    { title: "Relax the shoulders", body: "In through the nose for two, out through pursed lips for four.", holdSec: 8 },
    { title: "Slow the exhale", pace: [{ label: "In", sec: 2 }, { label: "Out (pursed)", sec: 4 }], holdSec: 48 },
    { title: "Keep it easy", pace: [{ label: "In", sec: 2 }, { label: "Out (pursed)", sec: 4 }], holdSec: 48 },
    { title: "Rest", body: "Let the breath return to normal.", holdSec: 10 },
  ] }),
  make({ id: "dirga", name: "Three-Part Breath", category: "breathing", mechanism: "interoception", why: "Filling belly, ribs, then chest in sequence builds full, embodied calm.", targets: ["body", "both"], states: ["anxious", "overwhelmed", "cant_switch_off"], durationMin: 4, gentle: true, closing: true, basePriority: 3, steps: [
    { title: "Belly", body: "Fill the belly first, low and slow.", pace: [{ label: "Belly in", sec: 4 }, { label: "Out", sec: 6 }], holdSec: 30 },
    { title: "Belly + ribs", body: "Now fill belly, then let the ribs expand.", pace: [{ label: "Belly, ribs in", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 35 },
    { title: "Belly + ribs + chest", body: "Fill all the way up to the top of the chest.", pace: [{ label: "Full in", sec: 6 }, { label: "Empty out", sec: 7 }], holdSec: 40 },
    { title: "Rest", body: "Let it all go and breathe naturally.", holdSec: 12 },
  ] }),
  make({ id: "sitali", name: "Cooling Breath", category: "breathing", mechanism: "cooling-inhale", why: "Drawing air over a curled tongue cools the body and quiets irritation.", targets: ["body", "thoughts"], states: ["overstimulated", "irritable", "anxious"], durationMin: 3, basePriority: 3, steps: [
    { title: "Curl the tongue", body: "Roll the sides up (or purse the lips if you can’t).", holdSec: 8 },
    { title: "Inhale the cool", body: "Draw air in over the tongue, feeling the coolness.", pace: [{ label: "Cool in", sec: 4 }, { label: "Out nose", sec: 6 }], holdSec: 40 },
    { title: "Repeat", pace: [{ label: "Cool in", sec: 4 }, { label: "Out nose", sec: 6 }], holdSec: 40 },
    { title: "Settle", body: "Close the mouth, notice the cool calm.", holdSec: 10 },
  ] }),
  make({ id: "ujjayi", name: "Ocean Breath", category: "breathing", mechanism: "ocean-breath", why: "A soft whisper at the back of the throat makes the breath audible and anchoring.", targets: ["body", "thoughts"], states: ["overthinking", "anxious", "restless"], durationMin: 4, audio: "required", basePriority: 3, steps: [
    { title: "Whisper the throat", body: "Slightly constrict the back of the throat — a soft ocean sound on the breath.", holdSec: 10 },
    { title: "In and out, audible", pace: [{ label: "Ocean in", sec: 5 }, { label: "Ocean out", sec: 6 }], holdSec: 55 },
    { title: "Stay with the sound", pace: [{ label: "Ocean in", sec: 5 }, { label: "Ocean out", sec: 6 }], holdSec: 55 },
    { title: "Rest", body: "Let the sound fade.", holdSec: 12 },
  ] }),
  make({ id: "downregulator", name: "4-4-6-2 Downregulator", category: "breathing", mechanism: "paced-hold", why: "A longer exhale than inhale reliably shifts you into rest-and-digest.", targets: ["body"], states: ["anxious", "tense", "overwhelmed", "panicky"], durationMin: 3, panic: true, basePriority: 4, steps: [
    { title: "Find the pattern", body: "In 4, hold 4, out 6, hold 2.", holdSec: 8 },
    { title: "Breathe it", pace: [{ label: "In", sec: 4 }, { label: "Hold", sec: 4 }, { label: "Out", sec: 6 }, { label: "Hold", sec: 2 }], holdSec: 48 },
    { title: "Again", pace: [{ label: "In", sec: 4 }, { label: "Hold", sec: 4 }, { label: "Out", sec: 6 }, { label: "Hold", sec: 2 }], holdSec: 48 },
    { title: "Rest", body: "Breathe naturally now.", holdSec: 10 },
  ] }),
  make({ id: "waveBreath", name: "Wave Breath", category: "breathing", mechanism: "paced-equal", why: "Matching breath to an imagined wave brings a soft, hypnotic rhythm.", targets: ["body", "thoughts"], states: ["cant_sleep", "cant_switch_off", "overwhelmed"], durationMin: 5, gentle: true, bedtime: true, closing: true, basePriority: 3, steps: [
    { title: "Picture a wave", body: "A long, slow wave rolling in and out at the shore.", holdSec: 12 },
    { title: "Inhale as it rolls in", pace: [{ label: "Wave in", sec: 5 }, { label: "Wave out", sec: 6 }], holdSec: 66 },
    { title: "Ride it", pace: [{ label: "Wave in", sec: 5 }, { label: "Wave out", sec: 6 }], holdSec: 66 },
    { title: "Rest on the shore", body: "Let the wave settle, and you with it.", holdSec: 12 },
  ] }),
  make({ id: "count10", name: "Count to Ten", category: "breathing", mechanism: "breath-counting", why: "Counting each exhale up to ten is a classic way to quiet a busy mind.", targets: ["thoughts", "both"], states: ["overthinking", "cant_switch_off", "anxious"], durationMin: 4, cognitiveLoad: 3, basePriority: 3, steps: [
    { title: "Count each exhale", body: "Exhale, count ‘one’. Next exhale, ‘two’… up to ten, then restart.", holdSec: 12 },
    { title: "Stay with the count", body: "If you lose track, just start again at one. No judgement.", holdSec: 80 },
    { title: "Notice", body: "Did the mind quieten a little?", holdSec: 12 },
  ] }),
  make({ id: "sighStretch", name: "Sigh & Stretch", category: "breathing", mechanism: "breath-with-stretch", why: "Pairing a long sigh with a gentle stretch releases breath and body at once.", targets: ["body", "both"], states: ["tense", "restless", "overwhelmed"], durationMin: 2, physicalDemand: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Reach up on the inhale", body: "Inhale, reach the arms up.", pace: [{ label: "Reach up", sec: 4 }], holdSec: 6 },
    { title: "Sigh down", body: "Exhale with a sigh, let the arms fall.", pace: [{ label: "Sigh down", sec: 6 }], holdSec: 8 },
    { title: "Repeat three times", body: "Each time, reach a little more open.", pace: [{ label: "Reach up", sec: 4 }, { label: "Sigh down", sec: 6 }], holdSec: 50 },
    { title: "Rest", body: "Let the arms rest, feel the openness.", holdSec: 12 },
  ] }),
  make({ id: "exhaleLadder", name: "Exhale Ladder", category: "breathing", mechanism: "exhale-lengthening", why: "Gradually lengthening the exhale progressively deepens the calm.", targets: ["body"], states: ["anxious", "tense", "panicky"], durationMin: 4, panic: true, basePriority: 4, steps: [
    { title: "In 4, out 4", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 4 }], holdSec: 16 },
    { title: "In 4, out 5", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 5 }], holdSec: 18 },
    { title: "In 4, out 6", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 6 }], holdSec: 20 },
    { title: "In 4, out 7", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 7 }], holdSec: 22 },
    { title: "In 4, out 8", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 8 }], holdSec: 24 },
    { title: "Rest", body: "Breathe naturally, calmer now.", holdSec: 10 },
  ] }),
  make({ id: "handBreath", name: "Hand-on-Heart Breath", category: "breathing", mechanism: "tactile-breath", why: "Warm contact over the heart plus slow breath is deeply soothing and self-compassionate.", targets: ["body", "thoughts"], states: ["anxious", "worried", "overwhelmed", "cant_sleep"], durationMin: 3, gentle: true, closing: true, bedtime: true, basePriority: 4, steps: [
    { title: "Hand to heart", body: "Place a warm hand over your heart. Feel the contact.", holdSec: 12 },
    { title: "Slow and kind", body: "Breathe slowly, as if toward someone you care about.", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 60 },
    { title: "Stay", body: "Let the hand and breath hold you.", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 40 },
    { title: "Rest", body: "One hand stays a moment longer.", holdSec: 10 },
  ] }),
  make({ id: "breathWatch", name: "Breath Watching", category: "breathing", mechanism: "breath-watching", why: "Simply observing the breath, without changing it, trains steady attention.", targets: ["thoughts", "both"], states: ["overthinking", "cant_switch_off", "anxious"], durationMin: 5, gentle: true, closing: true, cognitiveLoad: 2, basePriority: 3, steps: [
    { title: "Don’t change a thing", body: "Just watch the breath come and go on its own.", holdSec: 12 },
    { title: "Notice where you feel it", body: "Nostrils, chest, belly — wherever it’s clearest.", holdSec: 80 },
    { title: "If the mind wanders", body: "Gently return to the breath. No judgement.", holdSec: 80 },
    { title: "Rest", body: "Let attention soften.", holdSec: 12 },
  ] }),
  make({ id: "recoveryBreath", name: "Recovery Breath", category: "breathing", mechanism: "exhale-lengthening", why: "After a spike of stress, two-in-six-out helps the body wind back down.", targets: ["body"], states: ["panicky", "anxious", "tense"], durationMin: 3, panic: true, basePriority: 4, steps: [
    { title: "Start the recovery", body: "Two seconds in, six seconds out.", holdSec: 8 },
    { title: "Bring it down", pace: [{ label: "In", sec: 2 }, { label: "Long out", sec: 6 }], holdSec: 50 },
    { title: "Keep going", pace: [{ label: "In", sec: 2 }, { label: "Long out", sec: 6 }], holdSec: 50 },
    { title: "Rest", body: "Let the breath normalise.", holdSec: 12 },
  ] }),
  make({ id: "breathHold", name: "Breath-Hold Reset", category: "breathing", mechanism: "breath-hold", why: "Brief, gentle holds can slow the heart and interrupt a panic spiral.", targets: ["body"], states: ["panicky", "anxious"], durationMin: 2, panic: true, intensityMin: 6, basePriority: 5, steps: [
    { title: "Exhale fully", body: "Breathe out and let the lungs empty.", holdSec: 6 },
    { title: "Hold gently", body: "Hold the breath out for a few calm seconds — only comfortable.", pace: [{ label: "Hold (easy)", sec: 5 }], holdSec: 8 },
    { title: "Inhale slowly", body: "Breathe in softly, then sigh out long.", pace: [{ label: "In", sec: 4 }, { label: "Sigh out", sec: 6 }], holdSec: 30 },
    { title: "Repeat twice more", body: "Gentle. Never strain.", pace: [{ label: "In", sec: 4 }, { label: "Sigh out", sec: 6 }], holdSec: 30 },
    { title: "Rest", body: "Notice the slower pulse.", holdSec: 10 },
  ] }),
  make({ id: "triBreath", name: "Triangle Breath", category: "breathing", mechanism: "paced-equal", why: "A simple three-sided pace — in, out, hold — is easy to follow when overloaded.", targets: ["body", "both"], states: ["anxious", "overwhelmed", "overstimulated"], durationMin: 3, panic: true, basePriority: 4, steps: [
    { title: "In 4 · Out 6 · Hold 2", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 6 }, { label: "Hold", sec: 2 }], holdSec: 48 },
    { title: "Keep the triangle", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 6 }, { label: "Hold", sec: 2 }], holdSec: 48 },
    { title: "Rest", body: "Breathe naturally.", holdSec: 10 },
  ] }),
  make({ id: "sighRest", name: "Three Sighs Reset", category: "breathing", mechanism: "exhale-lengthening", why: "When there’s no time, three good sighs can shift you a notch.", targets: ["body"], states: ["anxious", "tense", "restless", "any"], durationMin: 1, panic: true, discreet: true, basePriority: 5, steps: [
    { title: "Sigh one", pace: [{ label: "In", sec: 3 }, { label: "Sigh out", sec: 6 }], holdSec: 12 },
    { title: "Sigh two", pace: [{ label: "In", sec: 3 }, { label: "Sigh out", sec: 6 }], holdSec: 12 },
    { title: "Sigh three", pace: [{ label: "In", sec: 3 }, { label: "Sigh out", sec: 6 }], holdSec: 12 },
    { title: "Done", body: "A little softer already.", holdSec: 6 },
  ] }),
  make({ id: "bellyHand", name: "Hand-Belly Breathing", category: "breathing", mechanism: "interoception", why: "Feeling the belly rise and fall under your hands deepens embodied calm.", targets: ["body"], states: ["anxious", "dissociated", "overwhelmed"], durationMin: 3, gentle: true, closing: true, basePriority: 3, steps: [
    { title: "One hand chest, one belly", body: "Notice which moves more.", holdSec: 12 },
    { title: "Breathe into the belly hand", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 55 },
    { title: "Let the chest stay soft", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 40 },
    { title: "Rest", body: "Hands rest, breathing easy.", holdSec: 10 },
  ] }),
  make({ id: "voo", name: "Voo Breath", category: "breathing", mechanism: "hum-resonance", why: "A low ‘voo’ sound into the belly vibrates and calms the core nervous system.", targets: ["body"], states: ["overwhelmed", "tense", "anxious", "trauma"], durationMin: 3, audio: "required", basePriority: 3, steps: [
    { title: "Find a low tone", body: "On the exhale, make a deep ‘vooooo’ sound, felt in the belly.", holdSec: 10 },
    { title: "Let it resonate", pace: [{ label: "In", sec: 4 }, { label: "Voo out", sec: 8 }], holdSec: 36 },
    { title: "Again", pace: [{ label: "In", sec: 4 }, { label: "Voo out", sec: 8 }], holdSec: 36 },
    { title: "Rest in the vibration", body: "Feel the calm settle low in the body.", holdSec: 12 },
  ] }),
  make({ id: "miniInhale", name: "Mini Breath Reset", category: "breathing", mechanism: "exhale-lengthening", why: "A single, well-placed long exhale when you can’t do more.", targets: ["body"], states: ["anxious", "tense", "any"], durationMin: 1, discreet: true, panic: true, basePriority: 4, steps: [
    { title: "One good exhale", body: "In softly… then let out one long, easy sigh.", pace: [{ label: "In", sec: 3 }, { label: "Long out", sec: 7 }], holdSec: 16 },
    { title: "And another", pace: [{ label: "In", sec: 3 }, { label: "Long out", sec: 7 }], holdSec: 16 },
    { title: "Return", body: "Back to whatever you were doing, a touch calmer.", holdSec: 6 },
  ] }),
  make({ id: "inhaleHold", name: "4-2-6 Breath", category: "breathing", mechanism: "paced-hold", why: "A short hold after the inhale, then a long exhale — calming and easy.", targets: ["body"], states: ["anxious", "tense", "overwhelmed"], durationMin: 3, basePriority: 3, steps: [
    { title: "In 4, hold 2, out 6", pace: [{ label: "In", sec: 4 }, { label: "Hold", sec: 2 }, { label: "Out", sec: 6 }], holdSec: 48 },
    { title: "Again", pace: [{ label: "In", sec: 4 }, { label: "Hold", sec: 2 }, { label: "Out", sec: 6 }], holdSec: 48 },
    { title: "Rest", body: "Let the breath find its own pace.", holdSec: 10 },
  ] }),
];

// =========================== GROUNDING / SENSORY (26) ===========================
const GROUNDING = [
  make({ id: "grounding54321", name: "5-4-3-2-1 Grounding", category: "grounding", mechanism: "sensory-54321", why: "Anchoring your senses pulls you out of the storm and back into the present.", targets: ["thoughts", "both"], states: ["overthinking", "overstimulated", "panicky", "anxious", "worried"], durationMin: 4, eyes: "open", basePriority: 5, steps: [
    { title: "5 things you see", body: "Name five things you can see. Ordinary is perfect.", holdSec: 20 },
    { title: "4 you can touch", body: "Four things you can feel — fabric, chair, floor.", holdSec: 18 },
    { title: "3 you hear", body: "Three sounds, near or far.", holdSec: 15 },
    { title: "2 you smell · 1 you taste", body: "Two scents, one taste. You’re here, fully.", holdSec: 18 },
  ] }),
  make({ id: "grounding54321V2", name: "5-4-3-2-1 Grounding V2", category: "grounding", mechanism: "sensory-54321", why: "A flagship sensory grounding practice — anchor through sight, touch, hearing, smell and taste to come fully into the present.", targets: ["thoughts", "both"], states: ["overthinking", "overstimulated", "panicky", "anxious", "worried", "dissociated"], durationMin: 5, eyes: "open", basePriority: 6, steps: [
    { title: "Five things you can see", body: "Notice five things around you.", speak: "Notice five things around you. Ordinary is perfect.", holdSec: 12, grounding54321V2: true, sense: "sight" },
    { title: "Four things you can feel", body: "Notice four things you can feel.", holdSec: 11, grounding54321V2: true, sense: "touch" },
    { title: "Three things you can hear", body: "Listen for three sounds around you.", holdSec: 10, grounding54321V2: true, sense: "hearing" },
    { title: "Two things you can smell", body: "Notice two scents in the air.", holdSec: 9, grounding54321V2: true, sense: "smell" },
    { title: "One thing you can taste", body: "Notice one taste in your mouth.", holdSec: 8, grounding54321V2: true, sense: "taste" },
    { title: "Recenter in the room", body: "Gently widen your focus to the whole room. Feel your feet, your seat, and one steady breath. You are here, now.", speak: "Gently widen your focus to the whole room. Feel your feet, your seat, and one steady breath. You are here, now.", holdSec: 10, grounding54321V2: true, sense: "recenter" },
  ] }),
  make({ id: "orienting", name: "Orienting Scan", category: "grounding", mechanism: "orienting", why: "When the alarm is loud, your brain needs proof you’re safe — here, now.", targets: ["thoughts", "body", "both"], states: ["panicky", "overstimulated", "anxious", "overwhelmed", "any"], durationMin: 2, eyes: "open", panic: true, intensityMin: 5, basePriority: 7, steps: [
    { title: "Look around", body: "Slowly turn your head. Let your eyes find the room’s edges.", holdSec: 12 },
    { title: "Name what you see", body: "Three things you can see. Rest your eyes on each.", holdSec: 30 },
    { title: "Where you are", body: "Say: I am here. This room. This moment. I am safe right now.", holdSec: 20 },
  ] }),
  make({ id: "sensory", name: "Sensory Soothing", category: "grounding", mechanism: "sensory-soothing", why: "One gentle, comforting input to each sense calms an overloaded system.", targets: ["body", "both"], states: ["overstimulated", "overwhelmed", "anxious"], durationMin: 5, gentle: true, closing: true, basePriority: 4, steps: [
    { title: "One soothing sight", body: "Soft light, a plant, the sky. Rest your eyes there.", holdSec: 30 },
    { title: "One comforting touch", body: "Something soft or warm against your skin.", holdSec: 30 },
    { title: "One gentle sound", body: "A low steady sound, or your own slow breath.", holdSec: 30 },
    { title: "Settle", body: "Let the senses hold you for a moment.", holdSec: 15 },
  ] }),
  make({ id: "nameThree", name: "Name Three", category: "grounding", mechanism: "orienting", why: "A lighter version of grounding when five senses feels like too much.", targets: ["thoughts"], states: ["overwhelmed", "overstimulated", "anxious"], durationMin: 2, eyes: "open", discreet: true, basePriority: 4, steps: [
    { title: "Three you see", body: "Name three objects around you, out loud or in your mind.", holdSec: 25 },
    { title: "Three sounds", body: "Name three sounds you can hear.", holdSec: 25 },
    { title: "Three you feel", body: "Three points of contact with your body.", holdSec: 25 },
  ] }),
  make({ id: "colorHunt", name: "Colour Hunt", category: "grounding", mechanism: "sensory-search", why: "Searching for a colour gives an overloaded mind a single, calming task.", targets: ["thoughts"], states: ["overstimulated", "overthinking", "anxious"], durationMin: 3, eyes: "open", basePriority: 3, steps: [
    { title: "Pick a colour", body: "Choose one — say, blue.", holdSec: 6 },
    { title: "Find five", body: "Spot five things that colour around you.", holdSec: 50 },
    { title: "Now another colour", body: "Pick a new colour, find three more.", holdSec: 45 },
    { title: "Settle", body: "Notice you’re a little more here.", holdSec: 10 },
  ] }),
  make({ id: "texture", name: "Texture Tour", category: "grounding", mechanism: "texture", why: "Touch is a fast, direct route back to the body.", targets: ["body"], states: ["dissociated", "overstimulated", "anxious"], durationMin: 3, eyes: "either", basePriority: 3, steps: [
    { title: "Find five textures", body: "Fabric, wood, skin, metal, paper — touch each.", holdSec: 60 },
    { title: "Describe each", body: "Smooth, rough, cool, warm, soft, ridged.", holdSec: 50 },
    { title: "Settle", body: "Let the hands rest, the world steady.", holdSec: 12 },
  ] }),
  make({ id: "tempAnchor", name: "Temperature Anchor", category: "grounding", mechanism: "temperature", why: "Noticing temperature sharply brings you into the body.", targets: ["body"], states: ["dissociated", "overwhelmed", "anxious"], durationMin: 2, basePriority: 3, steps: [
    { title: "Cool on the hands", body: "Notice the air on your hands, or touch something cool.", holdSec: 25 },
    { title: "Warm on the chest", body: "Place a warm hand on your chest, feel the contrast.", holdSec: 25 },
    { title: "Rest", body: "Notice the present temperature, here, now.", holdSec: 12 },
  ] }),
  make({ id: "smellAnchor", name: "Aroma Anchor", category: "grounding", mechanism: "smell", why: "Scent routes straight to the brain’s calming centres.", targets: ["body", "thoughts"], states: ["anxious", "overstimulated", "cant_switch_off"], durationMin: 2, basePriority: 3, steps: [
    { title: "Find a scent", body: "Coffee, soap, a hand cream, fresh air — anything nearby.", holdSec: 10 },
    { title: "Inhale slowly", body: "Three slow breaths of the scent, eyes closed.", holdSec: 45 },
    { title: "Rest", body: "Let the calm settle.", holdSec: 12 },
  ] }),
  make({ id: "soundMap", name: "Sound Map", category: "grounding", mechanism: "sound-map", why: "Mapping sounds outward broadens a contracted, anxious attention.", targets: ["thoughts"], states: ["overstimulated", "anxious", "overwhelmed"], durationMin: 3, basePriority: 3, steps: [
    { title: "Close your eyes", body: "Let the sounds come to you.", holdSec: 10 },
    { title: "Near sounds", body: "List every sound within arm’s reach.", holdSec: 40 },
    { title: "Far sounds", body: "Now reach further — sounds from the next room, the street.", holdSec: 50 },
    { title: "Rest", body: "You’re part of a wider, calmer field.", holdSec: 12 },
  ] }),
  make({ id: "barefoot", name: "Feet on the Earth", category: "grounding", mechanism: "proprioception", why: "Feeling the ground beneath you is the most literal kind of grounding.", targets: ["body"], states: ["anxious", "dissociated", "overwhelmed"], durationMin: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Feel your feet", body: "Press them into the floor. Notice the contact.", holdSec: 25 },
    { title: "Press and release", body: "Press for a moment, then soften. A few times.", holdSec: 40 },
    { title: "Rest", body: "Let the ground hold your weight.", holdSec: 12 },
  ] }),
  make({ id: "fivePoints", name: "Five Points of Contact", category: "grounding", mechanism: "proprioception", why: "Mapping where your body meets the world builds a felt sense of safety.", targets: ["body"], states: ["dissociated", "overwhelmed", "anxious"], durationMin: 3, basePriority: 3, steps: [
    { title: "Feet", body: "Feel both feet on the ground.", holdSec: 20 },
    { title: "Seat", body: "Feel where you’re held by the chair or floor.", holdSec: 20 },
    { title: "Back & hands", body: "Back supported, hands resting in your lap.", holdSec: 20 },
    { title: "Whole body", body: "Five points of contact, fully held.", holdSec: 25 },
  ] }),
  make({ id: "objectFocus", name: "Object in Hand", category: "grounding", mechanism: "object-focus", why: "Describing one object in detail concentrates a scattered mind.", targets: ["thoughts"], states: ["overthinking", "overstimulated", "anxious"], durationMin: 3, eyes: "open", basePriority: 3, steps: [
    { title: "Pick something small", body: "A pen, a stone, a key. Hold it.", holdSec: 10 },
    { title: "Describe it", body: "Colour, weight, texture, temperature, shape.", holdSec: 50 },
    { title: "Close your eyes, picture it", body: "Now see it in your mind’s eye.", holdSec: 40 },
    { title: "Rest", body: "Place it down, more present.", holdSec: 10 },
  ] }),
  make({ id: "iceHold", name: "Ice Cube Focus", category: "grounding", mechanism: "temperature", why: "A strong, safe sensation crowds out panic and pulls you back fast.", targets: ["body"], states: ["panicky", "dissociated", "overwhelmed"], durationMin: 2, panic: true, intensityMin: 6, basePriority: 5, steps: [
    { title: "Hold an ice cube", body: "Or run cold water over your hands.", holdSec: 12 },
    { title: "Describe the sensation", body: "Cold, sharp, then numb. Let it fill attention.", holdSec: 40 },
    { title: "Notice the warming", body: "As your hand warms again, so does your system.", holdSec: 30 },
  ] }),
  make({ id: "softGaze", name: "Soft Gaze", category: "grounding", mechanism: "visual-anchor", why: "Resting a soft, wide gaze settles the nervous system.", targets: ["thoughts", "body"], states: ["overstimulated", "anxious", "overwhelmed"], durationMin: 2, eyes: "open", gentle: true, basePriority: 3, steps: [
    { title: "Soften your eyes", body: "Let your gaze widen, not focusing on anything.", holdSec: 15 },
    { title: "Take in the whole field", body: "Let the room exist without you grasping at it.", holdSec: 50 },
    { title: "Rest", body: "Soften even more. Let it be easy.", holdSec: 12 },
  ] }),
  make({ id: "weightSense", name: "Feel Your Weight", category: "grounding", mechanism: "proprioception", why: "Sensing your weight lets the ground take the load you’ve been carrying.", targets: ["body"], states: ["overwhelmed", "tense", "anxious"], durationMin: 2, basePriority: 3, steps: [
    { title: "Notice gravity", body: "Feel the pull of the ground beneath you.", holdSec: 20 },
    { title: "Let it hold you", body: "Imagine the ground rising to meet you, supportive.", holdSec: 45 },
    { title: "Rest", body: "You don’t have to hold yourself up alone.", holdSec: 12 },
  ] }),
  make({ id: "labelRoom", name: "Label the Room", category: "grounding", mechanism: "orienting", why: "Quietly naming your surroundings is the simplest way back to now.", targets: ["thoughts"], states: ["overthinking", "dissociated", "anxious"], durationMin: 2, eyes: "open", discreet: true, basePriority: 3, steps: [
    { title: "Look and name", body: "Wall, lamp, book, cup — name objects as you see them.", holdSec: 50 },
    { title: "Then the sounds", body: "Name what you hear, too.", holdSec: 35 },
    { title: "Rest", body: "Here. Now.", holdSec: 10 },
  ] }),
  make({ id: "sipSavour", name: "Sip & Savour", category: "grounding", mechanism: "taste", why: "Eating or drinking slowly with full attention soothes and anchors.", targets: ["body", "thoughts"], states: ["overwhelmed", "anxious", "dissociated"], durationMin: 2, basePriority: 3, steps: [
    { title: "Take a sip", body: "Water, tea — something with a little warmth or taste.", holdSec: 10 },
    { title: "Truly taste it", body: "Temperature, flavour, the swallow. Only this.", holdSec: 50 },
    { title: "Rest", body: "A small act of care.", holdSec: 12 },
  ] }),
  make({ id: "handChest", name: "Hand-on-Chest Grounding", category: "grounding", mechanism: "tactile", why: "Warm contact plus a grounding phrase reassures the body it’s safe.", targets: ["body", "thoughts"], states: ["anxious", "worried", "dissociated"], durationMin: 2, gentle: true, discreet: true, basePriority: 4, steps: [
    { title: "Hand on chest", body: "Feel the warmth and the beat beneath.", holdSec: 15 },
    { title: "Say it", body: "‘This is hard, and I’m safe right now.’", holdSec: 40 },
    { title: "Rest", body: "Let the warmth do the work.", holdSec: 12 },
  ] }),
  make({ id: "bodyRadar", name: "Body Radar", category: "grounding", mechanism: "interoception", why: "Scanning for sensation reconnects you to the body’s calm signals.", targets: ["body"], states: ["dissociated", "anxious", "overwhelmed"], durationMin: 3, basePriority: 3, steps: [
    { title: "Scan head to toe", body: "Slowly move attention downward, noting any sensation.", holdSec: 60 },
    { title: "Find the calmest spot", body: "Wherever feels most neutral or soft, rest there.", holdSec: 40 },
    { title: "Settle", body: "Let that place hold you.", holdSec: 12 },
  ] }),
  make({ id: "listenWalk", name: "Listening Walk", category: "grounding", mechanism: "sound-map", why: "A short walk devoted only to listening opens and calms the mind.", targets: ["thoughts", "body"], states: ["overstimulated", "restless", "overwhelmed"], durationMin: 5, environment: "outdoors", movement: "full", physicalDemand: 2, basePriority: 3, steps: [
    { title: "Walk slowly", body: "No destination. Just to listen.", holdSec: 15 },
    { title: "Near sounds", body: "Footsteps, breath, wind in clothes.", holdSec: 60 },
    { title: "Far sounds", body: "Birds, traffic, distant voices.", holdSec: 70 },
    { title: "Come back", body: "Return a little more spacious.", holdSec: 12 },
  ] }),
  make({ id: "tasteNow", name: "Taste Now", category: "grounding", mechanism: "taste", why: "A mint or sweet with full attention is a tiny, reliable reset.", targets: ["thoughts"], states: ["overthinking", "anxious", "dissociated"], durationMin: 2, discreet: true, basePriority: 3, steps: [
    { title: "Take a mint", body: "Or a small sweet. Let it sit on the tongue.", holdSec: 10 },
    { title: "Only the taste", body: "Cool, sweet, fading. Nothing else exists.", holdSec: 50 },
    { title: "Rest", body: "Present again.", holdSec: 10 },
  ] }),
  make({ id: "fabricTouch", name: "Pet the Fabric", category: "grounding", mechanism: "texture", why: "Repetitive, soft touch is quietly regulating when words are too much.", targets: ["body"], states: ["overwhelmed", "dissociated", "overstimulated"], durationMin: 2, gentle: true, discreet: true, basePriority: 3, steps: [
    { title: "Find soft fabric", body: "A sleeve, a blanket, a scarf.", holdSec: 8 },
    { title: "Stroke slowly", body: "Back and forth, noticing the texture under your fingers.", holdSec: 60 },
    { title: "Rest", body: "Let the softness settle you.", holdSec: 12 },
  ] }),
  make({ id: "categories", name: "Name Categories", category: "grounding", mechanism: "cognitive-sensory", why: "Listing categories gives the mind a gentle, organising task.", targets: ["thoughts"], states: ["overthinking", "overwhelmed", "anxious"], durationMin: 2, discreet: true, basePriority: 3, steps: [
    { title: "Five animals", body: "Name five animals, slowly.", holdSec: 30 },
    { title: "Five cities", body: "Five cities you’ve been to or want to see.", holdSec: 30 },
    { title: "Five foods", body: "Five foods you love.", holdSec: 30 },
    { title: "Rest", body: "The mind likes lists.", holdSec: 8 },
  ] }),
  make({ id: "peripheral", name: "Peripheral Vision", category: "grounding", mechanism: "visual-anchor", why: "Widening to peripheral vision triggers a parasympathetic, calming response.", targets: ["thoughts", "body"], states: ["anxious", "overstimulated", "panicky"], durationMin: 2, eyes: "open", panic: true, basePriority: 4, steps: [
    { title: "Look straight ahead", body: "Fix your gaze on a point, soft but steady.", holdSec: 10 },
    { title: "Widen out", body: "Without moving your eyes, let the edges of your vision open up.", holdSec: 50 },
    { title: "Stay wide", body: "Hold the wide view. Notice the calm.", holdSec: 30 },
  ] }),
  make({ id: "alphabetGround", name: "Alphabet Grounding", category: "grounding", mechanism: "cognitive-sensory", why: "A slow A-to-Z object search is engaging enough to interrupt looping thoughts.", targets: ["thoughts"], states: ["overthinking", "overstimulated", "anxious"], durationMin: 3, eyes: "open", discreet: true, basePriority: 3, steps: [
    { title: "A — find something", body: "An object starting with A.", holdSec: 12 },
    { title: "B, C, D…", body: "Keep going slowly through the alphabet.", holdSec: 90 },
    { title: "Rest", body: "The loop has loosened.", holdSec: 10 },
  ] }),
  make({ id: "grounding4321", name: "4-3-2-1 Grounding", category: "grounding", mechanism: "sensory-54321", why: "A shorter four-sense version when five feels like too much.", targets: ["thoughts"], states: ["overwhelmed", "overstimulated", "anxious"], durationMin: 3, eyes: "open", basePriority: 4, steps: [
    { title: "4 you see", body: "Name four things you see.", holdSec: 30 },
    { title: "3 you feel", body: "Three things you can feel.", holdSec: 30 },
    { title: "2 you hear", body: "Two sounds.", holdSec: 25 },
    { title: "1 you smell", body: "One scent. Present.", holdSec: 20 },
  ] }),
];

// =========================== COGNITIVE DEFUSION / OVERTHINKING (22) ===========================
const COGNITIVE = [
  make({ id: "labeling", name: "Thought Labeling", category: "cognitive", mechanism: "defusion-label", why: "Naming a thought as just a thought loosens its grip.", targets: ["thoughts"], states: ["overthinking", "worried", "cant_switch_off", "anxious"], durationMin: 4, basePriority: 4, steps: [
    { title: "Notice the thought", body: "Let one arrive. Don’t push it away.", holdSec: 15 },
    { title: "Name it", body: "‘A worry.’ ‘A memory.’ ‘A what-if.’ Just the label.", holdSec: 30 },
    { title: "Let it pass", body: "Imagine it as a leaf on water, drifting by.", holdSec: 35 },
    { title: "Come back", body: "Another may come — label that one too.", holdSec: 20 },
  ] }),
  make({ id: "leavesStream", name: "Leaves on a Stream", category: "cognitive", mechanism: "metaphor-stream", why: "Placing each thought on a floating leaf is a classic defusion practice.", targets: ["thoughts"], states: ["overthinking", "worried", "cant_switch_off"], durationMin: 5, cognitiveLoad: 3, closing: true, basePriority: 4, steps: [
    { title: "Picture a stream", body: "Slow water, leaves drifting past.", holdSec: 15 },
    { title: "Each thought on a leaf", body: "Place a thought on a leaf, watch it float away.", holdSec: 80 },
    { title: "Don’t follow", body: "Just watch. The stream keeps moving.", holdSec: 80 },
    { title: "Rest by the bank", body: "You’re the watcher, not the thoughts.", holdSec: 12 },
  ] }),
  make({ id: "storyNaming", name: "Name the Story", category: "cognitive", mechanism: "story-naming", why: "‘I’m having the story that…’ instantly creates distance from a thought.", targets: ["thoughts"], states: ["overthinking", "worried", "anxious"], durationMin: 3, basePriority: 3, steps: [
    { title: "Catch the thought", body: "Notice what the mind is telling you.", holdSec: 12 },
    { title: "Prefix it", body: "Say: ‘I’m having the story that…’ and finish it.", holdSec: 40 },
    { title: "Notice the distance", body: "It’s a story, not a fact.", holdSec: 30 },
  ] }),
  make({ id: "thankMind", name: "Thank Your Mind", category: "cognitive", mechanism: "mind-thanking", why: "A wry ‘thanks, mind’ defuses a thought without fighting it.", targets: ["thoughts"], states: ["overthinking", "worried", "irritable"], durationMin: 2, discreet: true, basePriority: 3, steps: [
    { title: "Notice the chatter", body: "There it goes again.", holdSec: 12 },
    { title: "Thank it", body: "‘Thanks, mind, for that thought.’ Lightly.", holdSec: 40 },
    { title: "Let it be", body: "No argument. Just a nod.", holdSec: 20 },
  ] }),
  make({ id: "singThought", name: "Sing the Thought", category: "cognitive", mechanism: "repetition", why: "Singing a worry to a silly tune strips it of its seriousness.", targets: ["thoughts"], states: ["overthinking", "worried"], durationMin: 2, environment: "private", audio: "required", basePriority: 3, steps: [
    { title: "Say the thought", body: "State the worry in one sentence.", holdSec: 12 },
    { title: "Sing it", body: "To ‘Happy Birthday’ or a jingle. Three times.", holdSec: 50 },
    { title: "Notice", body: "Does it still feel as true? As heavy?", holdSec: 20 },
  ] }),
  make({ id: "repeatWord", name: "Repeat Until Meaningless", category: "cognitive", mechanism: "repetition", why: "Saying a sticky word for 30 seconds makes it lose all meaning.", targets: ["thoughts"], states: ["overthinking", "cant_switch_off"], durationMin: 2, audio: "optional", basePriority: 3, steps: [
    { title: "Pick the word", body: "The one word that keeps stabbing — ‘failure’, ‘alone’, etc.", holdSec: 10 },
    { title: "Say it for 30 seconds", body: "Out loud or silently, steady and quick.", holdSec: 35 },
    { title: "Notice it empty out", body: "Just sounds now. No sting.", holdSec: 15 },
  ] }),
  make({ id: "noticing", name: "I’m Noticing That…", category: "cognitive", mechanism: "prefixing", why: "Adding ‘I notice the thought that…’ adds a layer of observer distance.", targets: ["thoughts"], states: ["overthinking", "anxious", "worried"], durationMin: 2, discreet: true, basePriority: 3, steps: [
    { title: "Catch it", body: "What’s the mind saying right now?", holdSec: 12 },
    { title: "Add the prefix", body: "‘I notice I’m having the thought that…’", holdSec: 40 },
    { title: "Step back", body: "You’re the noticer, not the thought.", holdSec: 20 },
  ] }),
  make({ id: "cloudThought", name: "Thought as Cloud", category: "cognitive", mechanism: "metaphor-stream", why: "Watching thoughts drift like clouds teaches the mind they pass on their own.", targets: ["thoughts"], states: ["overthinking", "cant_switch_off", "anxious"], durationMin: 3, gentle: true, closing: true, basePriority: 3, steps: [
    { title: "Look up, in your mind", body: "A wide sky. Thoughts are clouds.", holdSec: 15 },
    { title: "Let them drift", body: "Each thought a cloud, passing by. No need to grab.", holdSec: 80 },
    { title: "The sky stays", body: "You’re the sky, not the clouds.", holdSec: 20 },
  ] }),
  make({ id: "factCheck", name: "Thought or Fact?", category: "cognitive", mechanism: "fact-check", why: "Asking whether a thought is a fact or a guess loosens certainty.", targets: ["thoughts"], states: ["worried", "overthinking"], durationMin: 3, basePriority: 3, steps: [
    { title: "State the thought", body: "In one clear sentence.", holdSec: 12 },
    { title: "Is it a fact?", body: "What’s the evidence? What’s the evidence against?", holdSec: 50 },
    { title: "Is it a guess?", body: "Could it be a story dressed as certainty?", holdSec: 30 },
  ] }),
  make({ id: "valuesCheck", name: "Values Check", category: "cognitive", mechanism: "values", why: "Reconnecting to what matters puts a worry in perspective.", targets: ["thoughts"], states: ["worried", "overwhelmed", "overthinking"], durationMin: 3, basePriority: 3, steps: [
    { title: "What matters to you?", body: "Name one thing you care about deeply.", holdSec: 30 },
    { title: "Does this thought serve it?", body: "Does dwelling on this move you toward or away from it?", holdSec: 40 },
    { title: "One small step", body: "Toward your value, what’s one tiny thing you could do?", holdSec: 30 },
  ] }),
  make({ id: "thenWhat", name: "Then What?", category: "cognitive", mechanism: "decatastrophize", why: "Following a fear to its end usually reveals you’d cope.", targets: ["thoughts"], states: ["worried", "overthinking", "panicky"], durationMin: 4, basePriority: 3, steps: [
    { title: "State the fear", body: "The worst case, in one sentence.", holdSec: 15 },
    { title: "Then what?", body: "If that happened… then what? And then what?", holdSec: 70 },
    { title: "Could you cope?", body: "Honestly — what would you do to get through?", holdSec: 40 },
    { title: "Soften", body: "The edge comes off when you walk to the end.", holdSec: 12 },
  ] }),
  make({ id: "worryPostpone", name: "Worry Postponement", category: "cognitive", mechanism: "worry-postpone", why: "Parking worries for a set time shrinks their hold on the day.", targets: ["thoughts"], states: ["worried", "overthinking", "cant_switch_off"], durationMin: 2, discreet: true, basePriority: 3, steps: [
    { title: "Set a worry time", body: "Pick 15 minutes later today for worries.", holdSec: 15 },
    { title: "Park this one", body: "Tell yourself: ‘I’ll worry about this then, not now.’", holdSec: 40 },
    { title: "Return to now", body: "Come back to what’s in front of you.", holdSec: 25 },
  ] }),
  make({ id: "probability", name: "Possibility vs Probability", category: "cognitive", mechanism: "probability", why: "Separating what could happen from what probably will calibrates fear.", targets: ["thoughts"], states: ["worried", "overthinking", "anxious"], durationMin: 3, basePriority: 3, steps: [
    { title: "What’s the fear?", body: "The scary outcome, one sentence.", holdSec: 12 },
    { title: "Is it possible?", body: "Yes — but how likely, really, from 0–100%?", holdSec: 45 },
    { title: "What’s more likely?", body: "Name a more probable outcome.", holdSec: 35 },
  ] }),
  make({ id: "criticName", name: "Name the Critic", category: "cognitive", mechanism: "critic-naming", why: "Giving the harsh inner voice a name shrinks its authority.", targets: ["thoughts"], states: ["overthinking", "worried", "irritable"], durationMin: 2, basePriority: 3, steps: [
    { title: "Hear the voice", body: "What’s it saying right now?", holdSec: 15 },
    { title: "Give it a name", body: "A silly or plain name. ‘The Manager’, ‘Brenda’.", holdSec: 30 },
    { title: "‘Thanks, Brenda’", body: "Acknowledge, then carry on.", holdSec: 25 },
  ] }),
  make({ id: "reframe", name: "Compassionate Reframe", category: "cognitive", mechanism: "reframe", why: "Re-stating a harsh thought kindly changes how it lands in the body.", targets: ["thoughts"], states: ["worried", "overthinking", "overwhelmed"], durationMin: 3, basePriority: 3, steps: [
    { title: "Hear the harsh thought", body: "Say it as the mind says it.", holdSec: 15 },
    { title: "Reframe it kindly", body: "As you’d say it to a friend.", holdSec: 45 },
    { title: "Notice the body", body: "Does the kinder version soften anything?", holdSec: 25 },
  ] }),
  make({ id: "thoughtRecord", name: "Thought Record", category: "cognitive", mechanism: "record", why: "Writing a thought and an alternative view breaks its spell.", targets: ["thoughts"], states: ["overthinking", "worried"], durationMin: 4, basePriority: 3, steps: [
    { title: "Write the thought", body: "In one line, exactly as it came.", holdSec: 30 },
    { title: "What triggered it?", body: "Note the situation.", holdSec: 30 },
    { title: "An alternative view", body: "Write one other way to see it.", holdSec: 50 },
  ] }),
  make({ id: "friendView", name: "What Would I Tell a Friend?", category: "cognitive", mechanism: "friend-perspective", why: "We’re kinder and clearer for others than for ourselves.", targets: ["thoughts"], states: ["worried", "overthinking", "overwhelmed"], durationMin: 2, discreet: true, basePriority: 4, steps: [
    { title: "Imagine a friend", body: "With this exact worry.", holdSec: 15 },
    { title: "What would you say?", body: "Write or think your words to them.", holdSec: 45 },
    { title: "Say it to yourself", body: "Now offer yourself the same.", holdSec: 25 },
  ] }),
  make({ id: "fiveWhys", name: "Follow the Why", category: "cognitive", mechanism: "root-cause", why: "Asking ‘why’ a few times reveals the deeper need beneath the worry.", targets: ["thoughts"], states: ["worried", "overthinking"], durationMin: 3, basePriority: 3, steps: [
    { title: "State the worry", body: "In one line.", holdSec: 12 },
    { title: "Why does that matter?", body: "Ask ‘why’ up to five times, gently.", holdSec: 70 },
    { title: "The need beneath", body: "What does this reveal you need right now?", holdSec: 30 },
  ] }),
  make({ id: "acceptance", name: "Let It Be", category: "cognitive", mechanism: "acceptance", why: "Sometimes dropping the struggle with a feeling is the relief.", targets: ["thoughts", "body"], states: ["overwhelmed", "anxious", "cant_switch_off"], durationMin: 3, gentle: true, closing: true, basePriority: 3, steps: [
    { title: "Find the feeling", body: "Where is it, right now?", holdSec: 15 },
    { title: "Make room", body: "Let it be there. No fixing, no fleeing.", holdSec: 60 },
    { title: "Soften around it", body: "Let the body soften around the feeling.", holdSec: 30 },
  ] }),
  make({ id: "brainDump", name: "Brain Dump", category: "cognitive", mechanism: "record", why: "Emptying the swirling thoughts onto paper clears the loop.", targets: ["thoughts"], states: ["overthinking", "overwhelmed", "cant_switch_off"], durationMin: 4, basePriority: 3, steps: [
    { title: "Get something to write", body: "Pen and paper, or notes app.", holdSec: 10 },
    { title: "Pour it out", body: "Every thought, no order, no editing.", holdSec: 90 },
    { title: "Set it down", body: "It’s out of your head now. You can rest.", holdSec: 15 },
  ] }),
  make({ id: "categorize", name: "Sort the Thoughts", category: "cognitive", mechanism: "categorize", why: "Grouping thoughts by type reveals most are old stories, not news.", targets: ["thoughts"], states: ["overthinking", "cant_switch_off"], durationMin: 3, basePriority: 3, steps: [
    { title: "List a few thoughts", body: "What’s looping right now?", holdSec: 25 },
    { title: "Tag each", body: "Memory · Plan · Judgment · Fear · Fantasy.", holdSec: 60 },
    { title: "Notice", body: "Most are repeats. Old, not urgent.", holdSec: 20 },
  ] }),
  make({ id: "zoomOut", name: "10-10-10", category: "cognitive", mechanism: "zoom-out", why: "Will this matter in 10 minutes, 10 months, 10 years? Perspective shrinks it.", targets: ["thoughts"], states: ["worried", "overthinking", "overwhelmed"], durationMin: 2, discreet: true, basePriority: 3, steps: [
    { title: "Name the worry", body: "In one line.", holdSec: 12 },
    { title: "10 minutes", body: "Will it matter in 10 minutes?", holdSec: 20 },
    { title: "10 months · 10 years", body: "In 10 months? In 10 years?", holdSec: 40 },
    { title: "Soften", body: "Seen from afar, it shrinks.", holdSec: 12 },
  ] }),
];

// =========================== SOMATIC / MUSCLE RELEASE (16) ===========================
const SOMATIC = [
  make({ id: "bodyScan", name: "Body Scan Release", category: "somatic", mechanism: "muscle-scan", why: "Moving attention through the body unwinds holding you didn’t know was there.", targets: ["body", "both"], states: ["tense", "cant_sleep", "overwhelmed", "cant_switch_off"], durationMin: 6, gentle: true, bedtime: true, closing: true, basePriority: 4, steps: [
    { title: "Feet", body: "Bring attention to your feet. No need to change anything.", holdSec: 25 },
    { title: "Legs & belly", body: "Drift up your legs to your belly. Soften on the exhale.", holdSec: 35 },
    { title: "Shoulders & jaw", body: "Where tension hides. On the next exhale, let them drop.", holdSec: 35 },
    { title: "Whole body", body: "Hold it all in awareness. One slow breath, then let go.", holdSec: 20 },
  ] }),
  make({ id: "pmr", name: "Progressive Relaxation", category: "somatic", mechanism: "pmr", why: "Tensing then releasing teaches muscles what relaxed actually feels like.", targets: ["body"], states: ["tense", "cant_sleep", "restless"], durationMin: 6, bedtime: true, physicalDemand: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Feet & legs", body: "Tense for a few seconds, then release.", holdSec: 35 },
    { title: "Belly & hands", body: "Tense, hold, let go.", holdSec: 35 },
    { title: "Shoulders & face", body: "Tense, hold, let go completely.", holdSec: 35 },
    { title: "Whole body", body: "One full tense, then a long, slow release.", holdSec: 30 },
  ] }),
  make({
  id: "progressive-muscle-relaxation-v2",
  name: "Progressive Muscle Relaxation V2",
  category: "somatic",
  mechanism: "pmr-v2",
  why: "A guided contrast between gentle effort and longer release helps the body recognise and settle muscular tension.",
  targets: ["body"],
  states: ["tense", "cant_sleep", "restless", "overwhelmed"],
  durationMin: 4,
  bedtime: true,
  physicalDemand: 2,
  movement: "seated",
  closing: true,
  basePriority: 5,
  pmrV2: true,
  steps: [
    {
      title: "Settle into support",
      body: "Back supported, hands resting in your lap.",
      speak: "Back supported, hands resting in your lap.",
      region: "whole",
      phase: "intro",
      holdSec: 7,
    },

    {
      title: "Squeeze both hands",
      body: "Gently tense your hands and forearms. Hold. Three, two, one. And let go.",
      speak: "Gently tense your hands and forearms. Hold. Three, two, one. And let go.",
      region: "hands",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let the hands soften",
      body: "Let your hands and forearms soften completely. Notice the warmth and heaviness.",
      speak: "Let your hands and forearms soften completely. Notice the warmth and heaviness.",
      region: "hands",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Lift your shoulders",
      body: "Now tense your arms and shoulders. Lift slightly. Hold. Three, two, one. And release.",
      speak: "Now tense your arms and shoulders. Lift slightly. Hold. Three, two, one. And release.",
      region: "shoulders",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let the shoulders drop",
      body: "Let your arms and shoulders drop and soften. Feel that area loosen.",
      speak: "Let your arms and shoulders drop and soften. Feel that area loosen.",
      region: "shoulders",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Gently tense your jaw",
      body: "Gently tense your jaw and face. Hold. Three, two, one. And let everything soften.",
      speak: "Gently tense your jaw and face. Hold. Three, two, one. And let everything soften.",
      region: "face",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let your jaw soften",
      body: "Let your jaw, your eyes, and your forehead soften completely.",
      speak: "Let your jaw, your eyes, and your forehead soften completely.",
      region: "face",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Gently tighten your stomach",
      body: "Gently tighten your chest and stomach. Hold. Three, two, one. And release.",
      speak: "Gently tighten your chest and stomach. Hold. Three, two, one. And release.",
      region: "torso",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let your stomach soften",
      body: "Let your chest and stomach soften. Allow the centre of your body to relax.",
      speak: "Let your chest and stomach soften. Allow the centre of your body to relax.",
      region: "torso",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Gently tense your hips",
      body: "Tense your hips and glutes. Hold. Three, two, one. And let go.",
      speak: "Tense your hips and glutes. Hold. Three, two, one. And let go.",
      region: "hips",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let the hips soften",
      body: "Let your hips and glutes soften completely. Feel the weight settling down.",
      speak: "Let your hips and glutes soften completely. Feel the weight settling down.",
      region: "hips",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Gently tense your thighs",
      body: "Gently tense your thighs. Hold. Three, two, one. And release.",
      speak: "Gently tense your thighs. Hold. Three, two, one. And release.",
      region: "thighs",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let the thighs grow heavy",
      body: "Let your thighs soften and grow heavy. Notice the release in your legs.",
      speak: "Let your thighs soften and grow heavy. Notice the release in your legs.",
      region: "thighs",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Press through your feet",
      body: "Tense your calves and feet. Hold. Three, two, one. And let go completely.",
      speak: "Tense your calves and feet. Hold. Three, two, one. And let go completely.",
      region: "lowerLegs",
      phase: "tense",
      holdSec: 9,
    },
    {
      title: "Let the lower legs settle",
      body: "Let your calves and feet soften. Let them feel warm, heavy, and at rest.",
      speak: "Let your calves and feet soften. Let them feel warm, heavy, and at rest.",
      region: "lowerLegs",
      phase: "release",
      holdSec: 14,
    },

    {
      title: "Let everything soften",
      body: "Notice your whole body now. Let every remaining bit of tension soften.",
      speak: "Notice your whole body now. Let every remaining bit of tension soften.",
      region: "whole",
      phase: "release",
      holdSec: 24,
    },
    {
      title: "Nothing else to do",
      body: "Let your whole body rest. Nothing else to do right now.",
      speak: "Let your whole body rest. Nothing else to do right now.",
      region: "whole",
      phase: "rest",
      holdSec: 18,
    },
    {
      title: "Come back gradually",
      body: "Gently widen your focus to the whole room. Feel your feet, your seat, and one steady breath. You are here, now.",
      speak: "Gently widen your focus to the whole room. Feel your feet, your seat, and one steady breath. You are here, now.",
      region: "whole",
      phase: "return",
      holdSec: 14,
    },
  ],
}),
  make({ id: "tenseRelease", name: "Quick Tense & Release", category: "somatic", mechanism: "tense-release", why: "A fast, targeted version for tense moments without much time.", targets: ["body"], states: ["tense", "restless", "anxious"], durationMin: 3, physicalDemand: 2, movement: "seated", basePriority: 4, steps: [
    { title: "Fists", body: "Clench, hold, release — feel the warmth.", holdSec: 25 },
    { title: "Shoulders", body: "Hunch up, hold, drop.", holdSec: 25 },
    { title: "Face", body: "Scrunch, hold, smooth out.", holdSec: 25 },
    { title: "Rest", body: "Notice the looseness.", holdSec: 12 },
  ] }),
  make({ id: "shoulderRoll", name: "Shoulder Rolls", category: "somatic", mechanism: "shoulder-roll", why: "Slow rolls melt the most common tension in the body.", targets: ["body"], states: ["tense", "restless", "overwhelmed"], durationMin: 2, physicalDemand: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Up and back", body: "Roll shoulders slowly up, back, and down.", holdSec: 40 },
    { title: "Forward", body: "Now up, forward, and down.", holdSec: 40 },
    { title: "Rest", body: "Let them sit low and soft.", holdSec: 12 },
  ] }),
  make({ id: "neckRelease", name: "Neck Release", category: "somatic", mechanism: "neck-release", why: "Gentle neck movement releases tension that radiates into the head.", targets: ["body"], states: ["tense", "overwhelmed", "cant_sleep"], durationMin: 2, physicalDemand: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Drop right ear to shoulder", body: "Slowly. No forcing.", holdSec: 25 },
    { title: "Other side", body: "Left ear to left shoulder.", holdSec: 25 },
    { title: "Slow circle", body: "Small, soft circles. Then rest.", holdSec: 30 },
  ] }),
  make({ id: "jawSoften", name: "Soften the Jaw", category: "somatic", mechanism: "jaw-soften", why: "The jaw holds huge tension; releasing it calms the whole face.", targets: ["body"], states: ["tense", "anxious", "irritable"], durationMin: 2, discreet: true, movement: "none", basePriority: 3, steps: [
    { title: "Notice the jaw", body: "Is it clenched? Let the teeth part slightly.", holdSec: 20 },
    { title: "Open wide, then let go", body: "Open, then release a few times.", holdSec: 40 },
    { title: "Rest", body: "Let the tongue float, soft.", holdSec: 15 },
  ] }),
  make({ id: "handShake", name: "Hand & Arm Shake", category: "somatic", mechanism: "shake", why: "Shaking out the limbs disperses stuck, jittery energy.", targets: ["body"], states: ["restless", "tense", "panicky"], durationMin: 2, physicalDemand: 2, movement: "full", energy: "energising", basePriority: 3, steps: [
    { title: "Shake the hands", body: "Let them flop and shake.", holdSec: 25 },
    { title: "Shake the arms", body: "Up to the shoulders.", holdSec: 25 },
    { title: "Let it go", body: "Stop, feel the tingle, breathe.", holdSec: 20 },
  ] }),
  make({ id: "hipRelease", name: "Seated Hip Release", category: "somatic", mechanism: "hip-release", why: "Hips hold a lot of unspoken tension; a gentle opener releases it.", targets: ["body"], states: ["tense", "restless", "overwhelmed"], durationMin: 3, physicalDemand: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Ankle on knee", body: "Cross one ankle over the opposite knee.", holdSec: 15 },
    { title: "Fold forward gently", body: "Long spine, soft fold. Breathe.", holdSec: 40 },
    { title: "Other side", body: "Switch and repeat.", holdSec: 40 },
    { title: "Rest", body: "Feel the openness in the hips.", holdSec: 12 },
  ] }),
  make({ id: "eyePalm", name: "Palming for the Eyes", category: "somatic", mechanism: "eye-palm", why: "Warm darkness over tired eyes soothes the whole nervous system.", targets: ["body", "thoughts"], states: ["overstimulated", "cant_sleep", "overwhelmed"], durationMin: 3, eyes: "closed", gentle: true, bedtime: true, closing: true, basePriority: 3, steps: [
    { title: "Warm your hands", body: "Rub palms together until warm.", holdSec: 12 },
    { title: "Cup over closed eyes", body: "Let the warmth and darkness in. No pressure on the eyes.", holdSec: 80 },
    { title: "Rest", body: "Slowly lower the hands, open to soft light.", holdSec: 15 },
  ] }),
  make({ id: "footRelease", name: "Foot & Calf Release", category: "somatic", mechanism: "tense-release", why: "Grounding through the feet releases tension stored low in the body.", targets: ["body"], states: ["tense", "restless", "cant_sleep"], durationMin: 2, physicalDemand: 2, movement: "seated", bedtime: true, basePriority: 3, steps: [
    { title: "Flex the feet", body: "Point, then flex, a few times.", holdSec: 35 },
    { title: "Circle the ankles", body: "Slow circles each direction.", holdSec: 35 },
    { title: "Rest", body: "Let the feet be heavy and warm.", holdSec: 12 },
  ] }),
  make({ id: "pendulation", name: "Pendulation", category: "somatic", mechanism: "pendulation", why: "Shifting between a tense spot and a calm one teaches the body safety.", targets: ["body"], states: ["overwhelmed", "trauma", "anxious"], durationMin: 4, gentle: true, basePriority: 3, steps: [
    { title: "Find a tense spot", body: "Where’s the strongest sensation?", holdSec: 20 },
    { title: "Find a calm spot", body: "Anywhere neutral — a hand, the floor.", holdSec: 20 },
    { title: "Pendulate", body: "Move attention slowly between them, back and forth.", holdSec: 80 },
    { title: "Rest", body: "Notice the whole body settle.", holdSec: 12 },
  ] }),
  make({ id: "resourcing", name: "Felt-Sense Resource", category: "somatic", mechanism: "resourcing", why: "Anchoring in a felt sense of safety stabilises an overwhelmed system.", targets: ["body", "thoughts"], states: ["overwhelmed", "trauma", "cant_sleep"], durationMin: 4, gentle: true, closing: true, bedtime: true, basePriority: 3, steps: [
    { title: "Recall a safe moment", body: "A place or person where you felt at ease.", holdSec: 20 },
    { title: "Feel it in the body", body: "Where is the ease? Rest there.", holdSec: 60 },
    { title: "Let it grow", body: "Let the felt sense widen and deepen.", holdSec: 50 },
    { title: "Rest", body: "Carry it with you.", holdSec: 12 },
  ] }),
  make({ id: "selfHug", name: "Self-Hug", category: "somatic", mechanism: "self-hug", why: "Pressure and self-contact cue care and safety through the body.", targets: ["body", "thoughts"], states: ["anxious", "overwhelmed", "cant_sleep"], durationMin: 2, gentle: true, bedtime: true, closing: true, discreet: true, basePriority: 3, steps: [
    { title: "Cross your arms", body: "Hands to opposite shoulders. Squeeze gently.", holdSec: 15 },
    { title: "Squeeze and breathe", body: "Slow breaths while holding the hug.", holdSec: 50 },
    { title: "Release slowly", body: "Let the arms down, keep the warmth.", holdSec: 15 },
  ] }),
  make({ id: "legsUp", name: "Legs-Up-the-Wall", category: "somatic", mechanism: "legs-up", why: "This rest pose quietly switches on the calming branch of the nervous system.", targets: ["body"], states: ["cant_sleep", "cant_switch_off", "overwhelmed", "restless"], durationMin: 6, gentle: true, bedtime: true, closing: true, environment: "private", basePriority: 5, steps: [
    { title: "Get set up", body: "Lie down, swing legs up a wall or onto a chair.", holdSec: 12 },
    { title: "Soften everything", body: "Legs heavy, jaw slack, belly loose.", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 5 }], holdSec: 60 },
    { title: "Stay and settle", body: "Nothing to fix. Just being here.", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 5 }], holdSec: 60 },
    { title: "Slow return", body: "Bend knees, roll to one side, rest.", holdSec: 15 },
  ] }),
  make({ id: "spineTwist", name: "Seated Spine Twist", category: "somatic", mechanism: "spine-twist", why: "A gentle wring-out releases the back and rebalances the body.", targets: ["body"], states: ["tense", "restless", "overwhelmed"], durationMin: 2, physicalDemand: 2, movement: "seated", basePriority: 3, steps: [
    { title: "Sit tall", body: "Inhale, lengthen the spine.", holdSec: 10 },
    { title: "Twist right", body: "Exhale, twist gently to the right.", holdSec: 30 },
    { title: "Twist left", body: "Inhale centre, exhale twist left.", holdSec: 30 },
    { title: "Rest", body: "Return to centre, softer.", holdSec: 12 },
  ] }),
  make({ id: "groundingStance", name: "Grounding Stance", category: "somatic", mechanism: "grounding-stance", why: "A stable, rooted standing pose builds a felt sense of steadiness.", targets: ["body"], states: ["anxious", "restless", "overwhelmed"], durationMin: 2, physicalDemand: 2, movement: "full", basePriority: 3, steps: [
    { title: "Stand, feet apart", body: "Feel the four corners of each foot.", holdSec: 20 },
    { title: "Soften the knees", body: "Sink a little, let the ground rise to meet you.", holdSec: 40 },
    { title: "Root and breathe", body: "Imagine roots down into the earth.", holdSec: 30 },
  ] }),
];

// =========================== PANIC-FRIENDLY SEQUENCES (10) ===========================
const PANIC = [
  make({ id: "coldWater", name: "Cold Water Reset", category: "somatic", mechanism: "temperature-shock", why: "Cold on the face triggers the dive reflex — it can drop panic within seconds.", targets: ["body"], states: ["panicky", "overwhelmed", "any"], durationMin: 2, panic: true, intensityMin: 7, basePriority: 9, steps: [
    { title: "Get something cold", body: "Cold water on the face, or an ice pack on your cheeks and under the eyes.", holdSec: 12 },
    { title: "Hold it there", body: "15–30 seconds. Bend forward if you can. Your heart rate will slow.", holdSec: 30 },
    { title: "Breathe through it", body: "Slow the exhale while the cold works. You’re resetting, not in danger.", pace: [{ label: "In", sec: 4 }, { label: "Long exhale", sec: 6 }], holdSec: 30 },
  ] }),
  make({ id: "orientPanic", name: "Orient for Panic", category: "grounding", mechanism: "orienting", why: "For panic, slow orientation gives the brain hard proof of present safety.", targets: ["thoughts", "body"], states: ["panicky", "overwhelmed"], durationMin: 2, eyes: "open", panic: true, basePriority: 7, steps: [
    { title: "Look up and around", body: "Slowly. Let your eyes lead your head.", holdSec: 15 },
    { title: "Three things, name them", body: "Out loud. ‘Lamp. Book. Cup.’", holdSec: 35 },
    { title: "Say it", body: "‘I’m here. This is now. I’m safe.’", holdSec: 25 },
  ] }),
  make({ id: "panicSigh", name: "Panic Exhale Ladder", category: "breathing", mechanism: "exhale-lengthening", why: "Lengthening the exhale in steps slows a racing heart.", targets: ["body"], states: ["panicky", "anxious"], durationMin: 2, panic: true, basePriority: 6, steps: [
    { title: "In 3, out 4", pace: [{ label: "In", sec: 3 }, { label: "Out", sec: 4 }], holdSec: 14 },
    { title: "In 3, out 6", pace: [{ label: "In", sec: 3 }, { label: "Out", sec: 6 }], holdSec: 18 },
    { title: "In 3, out 8", pace: [{ label: "In", sec: 3 }, { label: "Out", sec: 8 }], holdSec: 22 },
    { title: "Rest", body: "Breathe naturally. Slower now.", holdSec: 10 },
  ] }),
  make({ id: "icePack", name: "Ice Pack Hold", category: "grounding", mechanism: "temperature", why: "Cold in the hands is a strong, safe anchor when panic floods in.", targets: ["body"], states: ["panicky", "dissociated"], durationMin: 2, panic: true, basePriority: 5, steps: [
    { title: "Grab something cold", body: "Ice pack, frozen can, cold can from the fridge.", holdSec: 10 },
    { title: "Hold it in both hands", body: "Let the cold be your whole focus.", holdSec: 50 },
    { title: "Slow exhale", body: "Long out-breaths while the cold works.", pace: [{ label: "In", sec: 3 }, { label: "Long out", sec: 6 }], holdSec: 30 },
  ] }),
  make({ id: "tenSecond", name: "10-Second Reset", category: "grounding", mechanism: "orienting", why: "When panic is peaking, one short, decisive reset can break the spike.", targets: ["body", "thoughts"], states: ["panicky"], durationMin: 1, panic: true, basePriority: 6, steps: [
    { title: "Splash cold water", body: "On your face, now.", holdSec: 12 },
    { title: "One long sigh", body: "Big in, long sigh out.", pace: [{ label: "In", sec: 3 }, { label: "Out", sec: 7 }], holdSec: 14 },
    { title: "Name where you are", body: "‘I’m in the kitchen. I’m okay.’", holdSec: 12 },
  ] }),
  make({ id: "panic54321", name: "Panic 5-4-3-2-1", category: "grounding", mechanism: "sensory-54321", why: "A grounding classic, paced slowly for a flooded system.", targets: ["thoughts", "body"], states: ["panicky", "overwhelmed"], durationMin: 3, eyes: "open", panic: true, basePriority: 5, steps: [
    { title: "5 things you see", body: "Say them out loud, slowly.", holdSec: 40 },
    { title: "4 you can touch", body: "Feel each one.", holdSec: 35 },
    { title: "3 you hear", body: "Let each sound arrive.", holdSec: 30 },
    { title: "2 you smell, 1 you taste", body: "You’re fully here.", holdSec: 25 },
  ] }),
  make({ id: "panicHold", name: "Gentle Breath Hold", category: "breathing", mechanism: "breath-hold", why: "A brief, easy hold after an exhale can interrupt a panic spiral.", targets: ["body"], states: ["panicky", "anxious"], durationMin: 2, panic: true, basePriority: 5, steps: [
    { title: "Exhale fully", body: "Let the lungs empty, easy.", holdSec: 6 },
    { title: "Hold gently", body: "Only a few calm seconds — never strain.", pace: [{ label: "Hold", sec: 5 }], holdSec: 8 },
    { title: "Sigh in and out", pace: [{ label: "In", sec: 4 }, { label: "Sigh out", sec: 7 }], holdSec: 35 },
    { title: "Rest", body: "Notice the slower beat.", holdSec: 10 },
  ] }),
  make({ id: "legsUpCold", name: "Legs Up + Cold", category: "somatic", mechanism: "legs-up", why: "Combining the calming pose with cold on the eyes doubles the downshift.", targets: ["body"], states: ["panicky", "overwhelmed", "cant_sleep"], durationMin: 3, panic: true, gentle: true, environment: "private", basePriority: 4, steps: [
    { title: "Lie down, legs up", body: "On a wall or chair.", holdSec: 12 },
    { title: "Cold cloth on eyes", body: "Rest it over closed eyes.", holdSec: 60 },
    { title: "Slow breath", body: "Long exhales. Let the calm land.", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 7 }], holdSec: 50 },
  ] }),
  make({ id: "safeNow", name: "Safe Place Now", category: "grounding", mechanism: "resourcing", why: "A fast version of safe-place for when panic needs a sanctuary.", targets: ["thoughts", "body"], states: ["panicky", "overwhelmed"], durationMin: 2, panic: true, basePriority: 4, steps: [
    { title: "Bring a safe place to mind", body: "Real or imagined. Somewhere calm.", holdSec: 15 },
    { title: "Feel it in the body", body: "Where is the ease? Rest there.", holdSec: 50 },
    { title: "Say it", body: "‘I’m safe, right now.’", holdSec: 20 },
  ] }),
  make({ id: "panicCoherent", name: "Panic Coherent", category: "breathing", mechanism: "paced-equal", why: "Once the peak passes, even five-second breathing brings you back to baseline.", targets: ["body"], states: ["panicky", "anxious"], durationMin: 3, panic: true, basePriority: 4, steps: [
    { title: "5 in, 5 out", body: "Smooth and steady. No forcing.", holdSec: 10 },
    { title: "Stay with it", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 5 }], holdSec: 60 },
    { title: "Longer exhale now", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 7 }], holdSec: 40 },
    { title: "Rest", body: "Breathe naturally, calmer.", holdSec: 10 },
  ] }),
];

// =========================== WORK / DISCREET (12) ===========================
const WORK = [
  make({ id: "deskBreath", name: "Desk Breath", category: "breathing", mechanism: "paced-equal", why: "Invisible coherent breathing no one at the desk will notice.", targets: ["body"], states: ["anxious", "overwhelmed", "tense", "overthinking"], durationMin: 2, discreet: true, environment: "work", movement: "seated", basePriority: 5, steps: [
    { title: "Feet flat, soft eyes", body: "Gaze on the screen, breath slow underneath.", holdSec: 10 },
    { title: "5 in, 5 out", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 5 }], holdSec: 60 },
    { title: "Rest", body: "Return to your task a notch steadier.", holdSec: 12 },
  ] }),
  make({ id: "feetFloor", name: "Feet on the Floor", category: "grounding", mechanism: "proprioception", why: "Discreet grounding under the desk that no one sees.", targets: ["body"], states: ["anxious", "overwhelmed", "overstimulated"], durationMin: 2, discreet: true, environment: "work", movement: "seated", basePriority: 4, steps: [
    { title: "Press feet in", body: "Push gently into the floor, release. A few times.", holdSec: 45 },
    { title: "Feel the ground", body: "Let it hold your weight.", holdSec: 30 },
  ] }),
  make({ id: "bathroomReset", name: "One-Minute Reset", category: "breathing", mechanism: "exhale-lengthening", why: "A sixty-second reset for the bathroom when you need to disappear a moment.", targets: ["body", "thoughts"], states: ["anxious", "overwhelmed", "tense"], durationMin: 1, discreet: true, environment: "private", basePriority: 4, steps: [
    { title: "Lock the door", body: "A moment alone. Lean on the wall.", holdSec: 8 },
    { title: "Three long sighs", pace: [{ label: "In", sec: 3 }, { label: "Sigh out", sec: 7 }], holdSec: 30 },
    { title: "Roll the shoulders", body: "And return.", holdSec: 12 },
  ] }),
  make({ id: "penSqueeze", name: "Pen Squeeze Release", category: "somatic", mechanism: "tense-release", why: "Tense and release around a pen — discreet muscle relief at the desk.", targets: ["body"], states: ["tense", "anxious", "restless"], durationMin: 2, discreet: true, environment: "work", movement: "seated", basePriority: 3, steps: [
    { title: "Squeeze the pen", body: "Grip firmly for a few seconds.", holdSec: 25 },
    { title: "Release", body: "Let the hand go soft and warm.", holdSec: 25 },
    { title: "Repeat, then switch hands", body: "A few rounds each side.", holdSec: 40 },
  ] }),
  make({ id: "shoulderDrop", name: "Shoulder Drop", category: "somatic", mechanism: "shoulder-roll", why: "The most discreet release — just letting the shoulders fall.", targets: ["body"], states: ["tense", "overwhelmed", "anxious"], durationMin: 1, discreet: true, environment: "any", movement: "seated", basePriority: 4, steps: [
    { title: "Lift, then drop", body: "Pull shoulders up to ears, then let them fall.", holdSec: 30 },
    { title: "Again", body: "Two more times, each time lower.", holdSec: 30 },
  ] }),
  make({ id: "mirrorGround", name: "Mirror Grounding", category: "grounding", mechanism: "orienting", why: "Meeting your own eyes with kindness in a quiet moment.", targets: ["thoughts", "body"], states: ["anxious", "dissociated", "overwhelmed"], durationMin: 2, discreet: true, environment: "private", eyes: "open", basePriority: 3, steps: [
    { title: "Look in the mirror", body: "Soft gaze, not searching.", holdSec: 15 },
    { title: "Say your name", body: "‘You’re okay, [name]. This will pass.’", holdSec: 40 },
    { title: "Breathe", body: "Three slow breaths, eyes still soft.", holdSec: 30 },
  ] }),
  make({ id: "stealth478", name: "Stealth 4-7-8", category: "breathing", mechanism: "paced-hold", why: "A quiet, mouth-closed version of 4-7-8 for the office.", targets: ["body"], states: ["anxious", "tense", "overwhelmed"], durationMin: 2, discreet: true, environment: "work", movement: "seated", basePriority: 3, steps: [
    { title: "In 4 (nose)", body: "Silently. Hold 7, out 8 through the nose, soft.", pace: [{ label: "In", sec: 4 }, { label: "Hold", sec: 7 }, { label: "Out", sec: 8 }], holdSec: 38 },
    { title: "Again", pace: [{ label: "In", sec: 4 }, { label: "Hold", sec: 7 }, { label: "Out", sec: 8 }], holdSec: 38 },
    { title: "Rest", body: "Calmer. No one noticed.", holdSec: 10 },
  ] }),
  make({ id: "phoneAnchor", name: "Phone Anchor", category: "grounding", mechanism: "object-focus", why: "Describe your phone in detail — discreet and always available.", targets: ["thoughts"], states: ["overthinking", "anxious", "dissociated"], durationMin: 2, discreet: true, environment: "any", eyes: "open", basePriority: 3, steps: [
    { title: "Pick up your phone", body: "Really look at it.", holdSec: 10 },
    { title: "Describe it", body: "Weight, edges, screen, temperature.", holdSec: 50 },
    { title: "Rest", body: "More present.", holdSec: 10 },
  ] }),
  make({ id: "coldSip", name: "Cold Sip", category: "grounding", mechanism: "taste", why: "A cold sip with full attention is a tiny, invisible reset.", targets: ["thoughts", "body"], states: ["anxious", "overwhelmed", "overstimulated"], durationMin: 1, discreet: true, environment: "any", basePriority: 4, steps: [
    { title: "Take a cold sip", body: "Water, ideally.", holdSec: 10 },
    { title: "Taste and temperature", body: "Only that. Slow swallow.", holdSec: 40 },
    { title: "Rest", body: "A small, quiet reset.", holdSec: 8 },
  ] }),
  make({ id: "deskLegsUp", name: "Desk Legs-Up", category: "somatic", mechanism: "legs-up", why: "Legs on a chair under the desk for a discreet calm-down.", targets: ["body"], states: ["overwhelmed", "anxious", "restless", "cant_switch_off"], durationMin: 3, discreet: true, environment: "work", movement: "seated", basePriority: 3, steps: [
    { title: "Feet onto a chair", body: "Under the desk, legs supported.", holdSec: 12 },
    { title: "Soft belly breathing", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 60 },
    { title: "Stay", pace: [{ label: "In", sec: 5 }, { label: "Out", sec: 6 }], holdSec: 45 },
    { title: "Return", body: "Feet down, steadier.", holdSec: 12 },
  ] }),
  make({ id: "discreetOrient", name: "Discreet Orienting", category: "grounding", mechanism: "orienting", why: "A barely-visible scan of the room when you can’t move much.", targets: ["thoughts", "body"], states: ["anxious", "overwhelmed", "overstimulated"], durationMin: 1, discreet: true, environment: "any", eyes: "open", basePriority: 4, steps: [
    { title: "Let your eyes wander", body: "Slowly around the room, no head movement.", holdSec: 30 },
    { title: "Rest on three objects", body: "Settle your gaze on each.", holdSec: 25 },
  ] }),
  make({ id: "handUnderDesk", name: "Hand Press", category: "somatic", mechanism: "tense-release", why: "Press one hand into the other under the desk for quiet release.", targets: ["body"], states: ["tense", "anxious", "frustrated"], durationMin: 1, discreet: true, environment: "work", movement: "seated", basePriority: 3, steps: [
    { title: "Press palms together", body: "Under the desk. Firm, steady pressure.", holdSec: 30 },
    { title: "Release", body: "Let them part, shake out softly.", holdSec: 20 },
  ] }),
];

// =========================== LIFT (mood / momentum) (28) ===========================
const LIFT = [
  make({ id: "tinyWin", name: "One Tiny Win", category: "lift", mechanism: "accomplishment", why: "A ridiculously small completed action restarts momentum.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 7, steps: [
    { title: "Pick something tiny", body: "One action so small it feels almost silly. A sip of water, a stretch, one reply.", holdSec: 20 },
    { title: "Do it now", body: "The whole thing, right now. Don’t dress it up.", holdSec: 45 },
    { title: "Let it count", body: "That counts. Let yourself register the tiny ‘done’.", holdSec: 15 },
  ] }),
  make({ id: "activationMenu", name: "Pleasant Action Menu", category: "lift", mechanism: "behavioural-activation", why: "Choosing one small enjoyable action is the core of behavioural activation.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Scan a few options", body: "A short walk, music, a warm drink, a call, a tidy surface. Pick one that feels just possible.", holdSec: 30 },
    { title: "Commit out loud", body: "Say: ‘I’m going to ____ for a few minutes.’", holdSec: 20 },
    { title: "Begin", body: "Even one minute counts as starting.", holdSec: 30 },
  ] }),
  make({ id: "savourMemory", name: "Savour a Memory", category: "lift", mechanism: "savouring", why: "Re-living a good moment in detail lifts mood in the present.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Bring one to mind", body: "A genuinely good moment — recent or old.", holdSec: 15 },
    { title: "Fill in the senses", body: "What did you see, hear, feel, smell? Be specific.", holdSec: 50 },
    { title: "Stay with it", body: "Let the good feeling widen for a few more breaths.", holdSec: 30 },
  ] }),
  make({ id: "gratitudeThree", name: "Three Good Things", category: "lift", mechanism: "gratitude", why: "Naming three small good things gently trains the mind toward what’s working.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "First one", body: "Something that went okay today, however small.", holdSec: 25 },
    { title: "Second", body: "Another. A kindness, a taste, a moment of ease.", holdSec: 25 },
    { title: "Third", body: "One more. Let yourself sit with all three.", holdSec: 25 },
  ] }),
  make({ id: "move90", name: "Move for Ninety Seconds", category: "lift", mechanism: "movement", why: "Brief movement shifts body chemistry and breaks a flat state.", targets: ["body"], states: ["any"], directions: ["lift"], durationMin: 2, physicalDemand: 2, movement: "full", energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 7, steps: [
    { title: "Stand up", body: "Feet apart, knees soft.", holdSec: 8 },
    { title: "Move how you like", body: "Shake arms, march, sway — anything, ninety seconds.", holdSec: 70 },
    { title: "Arrive", body: "Stop, feel the warmth, breathe.", holdSec: 12 },
  ] }),
  make({ id: "sensoryWake", name: "Wake the Senses", category: "lift", mechanism: "sensory-engagement", why: "A quick hit of bright sensation lifts a foggy, flat state.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Cold water", body: "Splash your face, or run cold water over your wrists.", holdSec: 20 },
    { title: "Bright light", body: "Get to a window or outside for thirty seconds.", holdSec: 35 },
    { title: "Fresh air", body: "Three deep breaths of air, however it tastes.", holdSec: 15 },
  ] }),
  make({ id: "valuesStep", name: "One Values Step", category: "lift", mechanism: "values", why: "A tiny step toward what matters creates forward pull.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Name what matters", body: "One thing you care about — connection, craft, kindness, growth.", holdSec: 25 },
    { title: "One tiny step", body: "The smallest step toward it you could take now.", holdSec: 35 },
    { title: "Take it", body: "Even partially. Direction matters more than speed.", holdSec: 25 },
  ] }),
  make({ id: "musicShift", name: "Put On a Song", category: "lift", mechanism: "music", why: "Music is a fast, low-effort lever for mood and momentum.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, audio: "required", energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Pick one", body: "A song that reliably lifts you. Don’t think, just pick.", holdSec: 12 },
    { title: "Press play", body: "Let it fill the room. Move if you want.", holdSec: 60 },
    { title: "Let it land", body: "Notice the shift, however small.", holdSec: 12 },
  ] }),
  make({ id: "reachOut", name: "Send One Message", category: "lift", mechanism: "connection", why: "A tiny act of connection interrupts low-mood withdrawal.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "steady", basePriority: 5, discreet: true, steps: [
    { title: "Think of someone", body: "One person you’d like to hear from.", holdSec: 12 },
    { title: "Send one line", body: "‘Thinking of you.’ A photo. A question. No preamble needed.", holdSec: 45 },
    { title: "Let it go", body: "You connected. That’s the whole thing.", holdSec: 12 },
  ] }),
  make({ id: "natureStep", name: "Step Outside", category: "lift", mechanism: "nature", why: "Even a minute of outdoors and sky reliably softens a low state.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 3, environment: "outdoors", movement: "full", energy: "energising", arousal: "steady", basePriority: 6, steps: [
    { title: "Get to the door", body: "Outside, a balcony, a window wide open.", holdSec: 12 },
    { title: "Notice three things", body: "Sky, a plant, a sound. Let them reach you.", holdSec: 60 },
    { title: "Breathe it in", body: "Three slow breaths of outside air.", holdSec: 15 },
  ] }),
  make({ id: "bodyMobilise", name: "Shake It Out", category: "lift", mechanism: "movement", why: "Discharging stuck, flat energy through the body lifts momentum.", targets: ["body"], states: ["any"], directions: ["lift"], durationMin: 2, physicalDemand: 2, movement: "full", energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Stand", body: "Loose knees, arms long.", holdSec: 8 },
    { title: "Shake", body: "Hands, arms, shoulders, legs — let it all go for a minute.", holdSec: 60 },
    { title: "Settle", body: "Stop, feel the tingle, breathe.", holdSec: 12 },
  ] }),
  make({ id: "compassionBreak", name: "Self-Compassion Break", category: "lift", mechanism: "compassion", why: "Three short phrases soften self-criticism and lift the mood.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "calming", arousal: "lower", basePriority: 5, steps: [
    { title: "This is a hard moment", body: "Place a hand on your heart. ‘This is hard right now.’", holdSec: 25 },
    { title: "Everyone feels this", body: "‘Hard moments are part of being human. I’m not alone in this.’", holdSec: 30 },
    { title: "Kindness", body: "‘May I be gentle with myself, the way I’d be with a friend.’", holdSec: 30 },
  ] }),
  make({ id: "anticipateJoy", name: "Something to Look Forward To", category: "lift", mechanism: "anticipation", why: "Planning a small pleasure gives the mind a forward pull.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Pick a small treat", body: "Something doable soon — a walk, a meal, a call.", holdSec: 25 },
    { title: "Set when", body: "Give it a time, even roughly.", holdSec: 20 },
    { title: "Picture it", body: "Imagine it briefly. Let the anticipation build.", holdSec: 25 },
  ] }),
  make({ id: "oppositeAction", name: "Opposite Action", category: "lift", mechanism: "opposite-action", why: "Doing the opposite of the low-mood urge gently counteracts it.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Notice the urge", body: "What does low mood want you to do? Hide, scroll, cancel?", holdSec: 20 },
    { title: "The opposite", body: "The opposite action — reach out, go out, start the thing.", holdSec: 35 },
    { title: "Do a little of it", body: "Even a small version. Action can lead, mood can follow.", holdSec: 30 },
  ] }),
  make({ id: "accomplishmentRecall", name: "Remember a Win", category: "lift", mechanism: "accomplishment", why: "Recalling something you finished rebuilds a sense of agency.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Recall one", body: "Something you finished or got through — any size.", holdSec: 25 },
    { title: "What it took", body: "One thing you did that made it happen.", holdSec: 30 },
    { title: "Let it sink", body: "You did that. Let yourself feel it for a moment.", holdSec: 15 },
  ] }),
  make({ id: "postureOpen", name: "Open Up", category: "lift", mechanism: "posture", why: "An open, upright posture feeds back as more energy and confidence.", targets: ["body"], states: ["any"], directions: ["lift"], durationMin: 2, physicalDemand: 1, movement: "seated", energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 5, discreet: true, steps: [
    { title: "Sit or stand tall", body: "Lengthen the spine, lift the chest.", holdSec: 15 },
    { title: "Open the shoulders", body: "Roll them back and down. Soft, not strained.", holdSec: 30 },
    { title: "Breathe into the openness", body: "Three easy breaths, chest wide.", holdSec: 25 },
  ] }),
  make({ id: "lightAir", name: "Light and Air", category: "lift", mechanism: "environment", why: "Light and fresh air are the simplest biological mood lifters.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, environment: "outdoors", movement: "full", energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Get to light", body: "Window, balcony, doorstep. Face the brightest source.", holdSec: 20 },
    { title: "Three deep breaths", body: "Of real air, not indoor air.", holdSec: 30 },
    { title: "Let it register", body: "A small lift, biologically real.", holdSec: 12 },
  ] }),
  make({ id: "curiositySpark", name: "Follow a Spark", category: "lift", mechanism: "curiosity", why: "Curiosity is a quiet back-door into engagement and energy.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Notice a spark", body: "Anything mildly interesting right now — a question, a thing.", holdSec: 15 },
    { title: "Follow it one step", body: "Look it up, read one line, watch one clip.", holdSec: 60 },
    { title: "Notice the pull", body: "Curiosity is movement, even small.", holdSec: 12 },
  ] }),
  make({ id: "pleasureSense", name: "One Small Pleasure", category: "lift", mechanism: "savouring", why: "Letting one sense enjoy something pleasant is a tiny mood repair.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Pick a sense", body: "Taste, smell, touch, sound, sight — one.", holdSec: 12 },
    { title: "Give it something nice", body: "A warm cup, a scent, a texture, a song.", holdSec: 40 },
    { title: "Stay with it", body: "Only that, for a few breaths.", holdSec: 20 },
  ] }),
  make({ id: "momentumStack", name: "Stack the Small", category: "lift", mechanism: "accomplishment", why: "Listing tiny tasks and doing the smallest rebuilds momentum fast.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "List three tiny tasks", body: "Absurdly small. Make the bed, reply, drink water.", holdSec: 30 },
    { title: "Do the smallest", body: "The very smallest one. Now.", holdSec: 45 },
    { title: "Cross it off", body: "Feel the tiny win. Then the next, if you like.", holdSec: 20 },
  ] }),
  make({ id: "songMove", name: "Song + Move", category: "lift", mechanism: "music-movement", why: "One song plus free movement is the fastest way to wake energy and a little joy.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 3, cognitiveLoad: 1, physicalDemand: 2, environment: "any", eyes: "either", audio: "required", movement: "full", discreet: false, performanceSafe: false, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Pick your song", body: "One that reliably lifts you — energised, confident, alive. Don't deliberate, trust the first.", holdSec: 12 },
    { title: "Press play", body: "Let it fill the room.", holdSec: 12 },
    { title: "Move how you want", body: "Walk, sway, dance, stretch your arms. However feels natural. This isn't a workout.", holdSec: 120 },
    { title: "Keep going", body: "Stay with the song. Let it carry you.", holdSec: 60 },
    { title: "Land", body: "Stop, feel the warmth, one easy breath.", holdSec: 12 },
  ] }),
  make({ id: "moodWalk", name: "Mood Walk", category: "lift", mechanism: "locomotion-attention", why: "Brisk movement plus opening your attention loosens a stuck, low mood.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 5, cognitiveLoad: 1, physicalDemand: 2, environment: "outdoors", eyes: "open", audio: "optional", movement: "full", discreet: false, performanceSafe: false, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Step out", body: "A short walk, no destination. Just to move.", holdSec: 15 },
    { title: "Let your arms swing", body: "Natural pace, arms free.", holdSec: 40 },
    { title: "Three things around you", body: "Notice three as you walk.", holdSec: 50 },
    { title: "Pick up the pace a little", body: "If it's comfortable, brisker for a moment.", holdSec: 80 },
    { title: "Look further out", body: "Let your eyes go to the distance.", holdSec: 70 },
    { title: "Anything pleasant?", body: "A colour, a sound, a face. Let it land.", holdSec: 40 },
    { title: "Arrive back", body: "A little looser, a little lighter.", holdSec: 12 },
  ] }),
  make({ id: "natureReset", name: "Nature Reset", category: "lift", mechanism: "nature-exposure", why: "A little outdoor exposure and soft attention gently rebalances a fried system.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 3, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "open", audio: "optional", movement: "seated", discreet: false, energy: "calming", arousal: "steady", basePriority: 6, steps: [
    { title: "Get to the most natural place nearby", body: "Outside, a window, a tree on the corner. Whatever's available — no park required.", holdSec: 15 },
    { title: "Look up", body: "Sky, light, the shape of the clouds.", holdSec: 40 },
    { title: "Air on your face", body: "A few real breaths of it.", holdSec: 35 },
    { title: "Three colours", body: "Find three natural colours.", holdSec: 40 },
    { title: "One sound", body: "Wind, a bird, leaves. Let it reach you.", holdSec: 35 },
    { title: "Stay a moment", body: "You're part of this.", holdSec: 15 },
  ] }),
  make({ id: "futureSnapshot", name: "Future Snapshot", category: "lift", mechanism: "positive-imagery", why: "Vividly imagining a good thing ahead gives the mind a forward pull.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, cognitiveLoad: 2, physicalDemand: 1, environment: "any", eyes: "closed", audio: "optional", movement: "none", discreet: true, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "One thing coming up", body: "Genuinely pleasant or meaningful — soon or far off.", holdSec: 20 },
    { title: "Where will you be?", body: "Picture the place.", holdSec: 30 },
    { title: "Who's there?", body: "Faces, if any.", holdSec: 25 },
    { title: "What you'll see and hear", body: "A few small details.", holdSec: 35 },
    { title: "The best part", body: "What you're looking forward to most.", holdSec: 25 },
    { title: "How you'd like to feel", body: "Let that feeling arrive a little early.", holdSec: 25 },
  ] }),
  make({ id: "photoBoost", name: "Photo Boost", category: "lift", mechanism: "autobiographical-memory", why: "One meaningful photo can summon the feeling of being loved or alive.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "none", discreet: true, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Open one photo", body: "Someone you love, a good day, a pet, a trip. Just one.", holdSec: 20 },
    { title: "Really look", body: "Take it in for a moment.", holdSec: 40 },
    { title: "What comes back?", body: "A feeling, a voice, the weather that day.", holdSec: 40 },
    { title: "Let it linger", body: "Stay with it a few more breaths.", holdSec: 20 },
  ] }),
  make({ id: "changeScene", name: "Change the Scene", category: "lift", mechanism: "environment-shift", why: "A small change of scene breaks a stuck state when willpower can't.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "seated", discreet: true, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Move", body: "Another room, the balcony, the kitchen, a different chair. Anywhere but here.", holdSec: 15 },
    { title: "Settle there", body: "Look around the new spot.", holdSec: 45 },
    { title: "One different thing", body: "A drink, a window, a sound you hadn't noticed.", holdSec: 45 },
    { title: "Notice the shift", body: "Sometimes a small move is enough.", holdSec: 15 },
  ] }),
  make({ id: "energyLadder", name: "Energy Ladder", category: "lift", mechanism: "graded-activation", why: "Matching the action to the energy you actually have makes starting possible.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, cognitiveLoad: 2, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "seated", discreet: true, energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Pick your rung", body: "Low, medium, or higher. Only what feels doable right now.", holdSec: 15 },
    { title: "Low", body: "Sit up, stretch, sip water, open the curtains.", holdSec: 40 },
    { title: "Medium", body: "Walk around, tidy one small thing, play one song.", holdSec: 40 },
    { title: "Higher", body: "Brisk walk, dance, a short burst of exercise.", holdSec: 40 },
    { title: "Do yours, now", body: "Even a little counts. Start where you are.", holdSec: 45 },
    { title: "Land", body: "Notice any lift, however small.", holdSec: 12 },
  ] }),
  make({ id: "noveltySpark", name: "Novelty Spark", category: "lift", mechanism: "novelty", why: "One small new thing interrupts the flat loop of more-of-the-same.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "seated", discreet: true, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "One small change", body: "For the next five minutes, do one thing differently.", holdSec: 15 },
    { title: "Pick", body: "A different room, playlist, route, drink, seat.", holdSec: 20 },
    { title: "Try it", body: "Small and low-effort. That's the whole point.", holdSec: 80 },
    { title: "Notice", body: "A tiny spark of different can break the flat.", holdSec: 15 },
  ] }),
];

// =========================== FOCUS (attention / task initiation) (17) ===========================
const FOCUS = [
  make({ id: "oneThing", name: "Name the One Thing", category: "focus", mechanism: "intention", why: "Naming the single next action clears the fog of too-many options.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 7, steps: [
    { title: "Set everything else down", body: "For a moment, let the list collapse to one.", holdSec: 12 },
    { title: "Name it", body: "The single next physical action. Not the project — the next step.", holdSec: 30 },
    { title: "Say it out loud", body: "‘The next thing is ____.’", holdSec: 15 },
  ] }),
  make({ id: "twoMinStart", name: "Two-Minute Start", category: "focus", mechanism: "commitment", why: "Committing to only two minutes sidesteps the brain’s resistance to starting.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 8, steps: [
    { title: "Set a tiny bar", body: "Just two minutes. You can stop after.", holdSec: 12 },
    { title: "Begin the clock", body: "Start now, not when you feel ready.", holdSec: 30 },
    { title: "If you want to stop, stop", body: "Permission is the whole trick. Often you won’t.", holdSec: 15 },
  ] }),
  make({ id: "frictionDrop", name: "Drop One Friction", category: "focus", mechanism: "friction", why: "Removing one obstacle makes starting measurably easier.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 6, steps: [
    { title: "What’s in the way?", body: "Name one thing slowing you down — a tab, a noise, a missing file.", holdSec: 20 },
    { title: "Remove it", body: "Do that one thing now.", holdSec: 45 },
    { title: "Return", body: "One less thing between you and the task.", holdSec: 10 },
  ] }),
  make({ id: "envTidy", name: "Clear the Space", category: "focus", mechanism: "environment", why: "A cleared surface clears the mind and signals ‘time to work’.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 2, physicalDemand: 1, movement: "seated", energy: "grounding", arousal: "steady", basePriority: 5, steps: [
    { title: "One surface", body: "Just the space in front of you.", holdSec: 10 },
    { title: "Clear it", body: "Two minutes. Anything not needed goes aside.", holdSec: 70 },
    { title: "Sit into it", body: "A clean space, a clearer start.", holdSec: 12 },
  ] }),
  make({ id: "intention", name: "Set the Intention", category: "focus", mechanism: "intention", why: "A clear ‘I will do X for Y reason’ primes focused action.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 6, steps: [
    { title: "State the what", body: "‘I will work on ____.’ One thing.", holdSec: 15 },
    { title: "State the why", body: "One reason it matters, however small.", holdSec: 20 },
    { title: "Begin", body: "Carry that intention into the first move.", holdSec: 15 },
  ] }),
  make({ id: "singleTask", name: "One Thing Only", category: "focus", mechanism: "single-tasking", why: "Closing everything but one task removes the main focus killer.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 7, discreet: true, steps: [
    { title: "Close the rest", body: "Tabs, apps, notifications. One thing stays open.", holdSec: 40 },
    { title: "Phone face-down", body: "Out of sight, out of mind.", holdSec: 15 },
    { title: "Begin the one", body: "Only this, until the next break.", holdSec: 15 },
  ] }),
  make({ id: "pomodoro", name: "One Focus Block", category: "focus", mechanism: "time-box", why: "A short, defined focus block makes starting feel safe and bounded.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 3, energy: "grounding", arousal: "steady", basePriority: 6, steps: [
    { title: "Set a block", body: "Twenty-five minutes, or whatever you can give.", holdSec: 15 },
    { title: "Start the timer", body: "When it runs, you focus. When it ends, you rest.", holdSec: 20 },
    { title: "Begin", body: "The timer makes it a game, not a threat.", holdSec: 15 },
  ] }),
  make({ id: "attentionAnchor", name: "Attention Anchor", category: "focus", mechanism: "attention-training", why: "A single object to return to trains the focus muscle gently.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 3, energy: "grounding", arousal: "lower", basePriority: 5, steps: [
    { title: "Pick an anchor", body: "A dot, a candle, a pen. One small thing at arm’s length.", holdSec: 12 },
    { title: "Rest your eyes there", body: "When the mind wanders, come back. No judgement.", holdSec: 70 },
    { title: "Carry that into the task", body: "The same gentle return, now with your work.", holdSec: 15 },
  ] }),
  make({ id: "focusBreath", name: "Breath Before You Begin", category: "focus", mechanism: "paced-breath", why: "A few settling breaths clear the noise right before you start.", targets: ["body", "thoughts"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "calming", arousal: "lower", basePriority: 6, discreet: true, steps: [
    { title: "Sit, settle", body: "Feet down, shoulders soft.", holdSec: 10 },
    { title: "Six even breaths", pace: [{ label: "In", sec: 4 }, { label: "Out", sec: 5 }], holdSec: 54 },
    { title: "Open your eyes and begin", body: "Into the task, steady.", holdSec: 10 },
  ] }),
  make({ id: "mobiliseFocus", name: "Move Then Sit", category: "focus", mechanism: "movement", why: "A brief body mobilisation wakes the alertness system before focus.", targets: ["body"], states: ["any"], directions: ["focus"], durationMin: 2, physicalDemand: 2, movement: "full", energy: "energising", arousal: "raise", intensityMax: 7, basePriority: 6, steps: [
    { title: "Stand", body: "Quick shake of arms and legs.", holdSec: 15 },
    { title: "Brisk in place", body: "Thirty seconds, a little breathless.", holdSec: 35 },
    { title: "Sit and begin", body: "Alertness borrowed from the body.", holdSec: 12 },
  ] }),
  make({ id: "fiveMinRule", name: "Five-Minute Rule", category: "focus", mechanism: "commitment", why: "Permission to stop after five minutes dissolves the dread of starting.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 7, steps: [
    { title: "Five minutes only", body: "You can stop after five, guilt-free.", holdSec: 12 },
    { title: "Start the timer", body: "Begin now, before you feel ready.", holdSec: 20 },
    { title: "Decide at five", body: "Stop or keep going — either is a win.", holdSec: 15 },
  ] }),
  make({ id: "implIntention", name: "If-Then Plan", category: "focus", mechanism: "implementation-intention", why: "‘If X, then I’ll do Y’ pre-loads the action so the brain follows through.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 6, steps: [
    { title: "Name the trigger", body: "When / where will you start?", holdSec: 20 },
    { title: "Name the action", body: "Exactly what you’ll do then.", holdSec: 25 },
    { title: "Say it", body: "‘When ___, I will ___.’", holdSec: 15 },
  ] }),
  make({ id: "nextAction", name: "The Next Physical Step", category: "focus", mechanism: "task-initiation", why: "Naming the literal next physical move ends paralysis by abstraction.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 1, energy: "grounding", arousal: "steady", basePriority: 8, steps: [
    { title: "Shrink the task", body: "Not the outcome — the next physical action.", holdSec: 15 },
    { title: "Name it", body: "‘Open the doc.’ ‘Pick up the brush.’ One move.", holdSec: 20 },
    { title: "Do it", body: "That one move, now.", holdSec: 15 },
  ] }),
  make({ id: "preTaskReset", name: "Reset Before You Start", category: "focus", mechanism: "orienting", why: "A quick sigh and orientation clears the residue of the last thing.", targets: ["body", "thoughts"], states: ["any"], directions: ["focus"], durationMin: 1, energy: "grounding", arousal: "lower", basePriority: 5, discreet: true, steps: [
    { title: "One long sigh", pace: [{ label: "In", sec: 3 }, { label: "Sigh out", sec: 7 }], holdSec: 12 },
    { title: "Look around", body: "Let your eyes find the room.", holdSec: 15 },
    { title: "Turn to the task", body: "Fresh, not carrying the last thing.", holdSec: 10 },
  ] }),
  make({ id: "reduceInputs", name: "Quiet the Inputs", category: "focus", mechanism: "environment", why: "Silencing notifications and tabs is the fastest real focus gain.", targets: ["thoughts", "body"], states: ["any"], directions: ["focus"], durationMin: 1, energy: "grounding", arousal: "steady", basePriority: 6, discreet: true, steps: [
    { title: "Phone silent", body: "Face-down or in another room.", holdSec: 15 },
    { title: "Close extra tabs", body: "Anything not for this task.", holdSec: 25 },
    { title: "Begin", body: "Less in, more focus.", holdSec: 10 },
  ] }),
  make({ id: "taskBreakdown", name: "Break It Down", category: "focus", mechanism: "task-initiation", why: "Splitting a task into micro-steps makes the first step doable.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 2, energy: "grounding", arousal: "steady", basePriority: 6, steps: [
    { title: "Name the task", body: "The whole thing, one phrase.", holdSec: 12 },
    { title: "Three micro-steps", body: "The smallest first three moves.", holdSec: 45 },
    { title: "Start step one", body: "Only step one, now.", holdSec: 15 },
  ] }),
  make({ id: "rewardAfter", name: "Small Reward After", category: "focus", mechanism: "motivation", why: "A small reward waiting after the block gives the brain a reason to start.", targets: ["thoughts"], states: ["any"], directions: ["focus"], durationMin: 1, energy: "grounding", arousal: "steady", basePriority: 5, steps: [
    { title: "Pick a reward", body: "Something small and real — a tea, a walk, a song.", holdSec: 15 },
    { title: "Earn it", body: "After this block, you get it.", holdSec: 15 },
    { title: "Begin", body: "The reward is closer than it feels.", holdSec: 10 },
  ] }),
];

// =========================== SLEEP / WIND-DOWN (10) ===========================
const SLEEP = [
  make({ id: "windDownBody", name: "Wind-Down Body Scan", category: "somatic", mechanism: "muscle-scan", why: "A slow downward sweep tells the body it’s safe to let go for the night.", targets: ["body", "both"], states: ["cant_sleep", "tense", "cant_switch_off"], directions: ["sleep", "calm"], durationMin: 7, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 5, steps: [
    { title: "Settle in", body: "Lie down, or sit back. Let the room hold you. Nothing to do now but rest.", holdSec: 15 },
    { title: "Feet & legs", body: "Soften your feet, your calves, your thighs. Let them grow heavy.", holdSec: 50 },
    { title: "Belly & breath", body: "Rest attention on the slow rise and fall. No counting — just riding it.", holdSec: 55 },
    { title: "Shoulders & jaw", body: "Let the shoulders melt. Let the jaw slacken. Nothing to hold up.", holdSec: 50 },
    { title: "Whole body", body: "One slow breath for the whole body, then let it all sink.", holdSec: 20 },
  ] }),
  make({ id: "nidraRotation", name: "Body Rotation", category: "somatic", mechanism: "nidra-rotation", why: "Moving attention quickly through the body in sequence quiets the mind into sleep.", targets: ["body", "both"], states: ["cant_switch_off", "cant_sleep", "overthinking"], directions: ["sleep", "calm"], durationMin: 8, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 4, steps: [
    { title: "Right side", body: "Thumb, fingers, palm, wrist, elbow, shoulder — quick, light touches of attention.", holdSec: 50 },
    { title: "Left side", body: "The same on the left. Don’t linger — just pass through.", holdSec: 50 },
    { title: "Centre & face", body: "Lips, tongue, eyes, forehead. Soft, soft, soft.", holdSec: 50 },
    { title: "Whole body at once", body: "Hold the whole body in one wide attention. Let it rest.", holdSec: 30 },
  ] }),
  make({ id: "breathCountdown", name: "Exhale Countdown", category: "breathing", mechanism: "breath-counting", why: "Counting backwards on the exhale gives a looping mind a single, sleepy task.", targets: ["thoughts", "both"], states: ["cant_switch_off", "overthinking", "cant_sleep"], directions: ["sleep", "calm"], durationMin: 5, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 4, steps: [
    { title: "Count down from 60", body: "Each exhale, one number down. If you lose count, start again at 60.", holdSec: 15 },
    { title: "Keep going", body: "Slower each time. No effort — just the count.", holdSec: 120 },
    { title: "If you reach zero", body: "Start again. Or let the counting fade and rest.", holdSec: 30 },
  ] }),
  make({ id: "warmHeavy", name: "Warm & Heavy", category: "somatic", mechanism: "autogenic", why: "Repeating ‘warm and heavy’ is a classic autogenic cue for deep relaxation.", targets: ["body"], states: ["tense", "cant_sleep", "cant_switch_off"], directions: ["sleep", "calm"], durationMin: 5, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 4, steps: [
    { title: "Right arm", body: "‘My right arm is warm and heavy.’ Repeat it slowly, a few times.", holdSec: 45 },
    { title: "Left arm", body: "‘My left arm is warm and heavy.’", holdSec: 45 },
    { title: "Legs", body: "‘My legs are warm and heavy.’", holdSec: 45 },
    { title: "Whole body", body: "‘My whole body is warm, heavy, and at rest.’", holdSec: 30 },
  ] }),
  make({ id: "letGoOfDay", name: "Let Go of the Day", category: "cognitive", mechanism: "release", why: "Briefly naming and releasing the day’s residue clears the runway for sleep.", targets: ["thoughts", "both"], states: ["worried", "overthinking", "cant_switch_off"], directions: ["sleep", "reset"], durationMin: 4, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 4, steps: [
    { title: "Name what’s here", body: "One word for the day — or the thing still on your mind. Just name it.", holdSec: 20 },
    { title: "Set it down", body: "Imagine placing it on the bedside, or outside the door. It can wait.", holdSec: 50 },
    { title: "Thank the day", body: "A small inward ‘done for now.’ Tomorrow is new.", holdSec: 30 },
    { title: "Rest", body: "Nothing left to carry into the night.", holdSec: 20 },
  ] }),
  make({ id: "sleepDrift", name: "Slow Drift Breath", category: "breathing", mechanism: "paced-equal", why: "Very slow, even breathing with longer exhales eases you across into sleep.", targets: ["body", "both"], states: ["cant_sleep", "tense", "cant_switch_off"], directions: ["sleep", "calm"], durationMin: 6, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 5, steps: [
    { title: "In 4, out 7", body: "Slow and soft. Let the exhale be long.", holdSec: 66 },
    { title: "Stay with it", body: "If the mind stirs, come back to the count.", holdSec: 66 },
    { title: "Even slower", body: "Let the breath find its own deep rhythm.", holdSec: 66 },
    { title: "Drift", body: "Let it fade. Let sleep come if it will.", holdSec: 30 },
  ] }),
  make({ id: "cozyHaven", name: "Cozy Haven", category: "somatic", mechanism: "resourcing", why: "A felt sense of a safe, cozy place invites the body toward sleep.", targets: ["body", "thoughts"], states: ["anxious", "cant_sleep", "worried"], directions: ["sleep", "calm"], durationMin: 5, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 4, steps: [
    { title: "Bring a cozy place to mind", body: "Real or imagined — somewhere you feel held and safe.", holdSec: 20 },
    { title: "Feel it", body: "Warmth, softness, quiet. Let it fill the senses.", holdSec: 60 },
    { title: "Let it widen", body: "Let the feeling spread through the body.", holdSec: 40 },
    { title: "Rest there", body: "Held. Safe. Ready to rest.", holdSec: 20 },
  ] }),
  make({ id: "eveningGratitude", name: "Three Small Thanks", category: "lift", mechanism: "gratitude", why: "Ending the day on three small good things gently softens the mind before sleep.", targets: ["thoughts"], states: ["any"], directions: ["sleep", "lift"], durationMin: 3, gentle: true, bedtime: true, closing: true, eyes: "closed", audio: "optional", movement: "none", environment: "private", basePriority: 3, steps: [
    { title: "One", body: "Something small that was okay today.", holdSec: 20 },
    { title: "Two", body: "Another. A taste, a kindness, a moment of ease.", holdSec: 20 },
    { title: "Three", body: "One more. Let them sit together.", holdSec: 25 },
    { title: "Rest", body: "The day, held gently.", holdSec: 15 },
  ] }),
  make({ id: "cognitiveShuffle", name: "Cognitive Shuffle", category: "cognitive", mechanism: "cognitive-shuffle", why: "Scattered, neutral imagery crowds out the looping thoughts that keep you awake.", targets: ["thoughts", "both"], states: ["cant_switch_off", "cant_sleep", "overthinking"], directions: ["sleep", "calm"], durationMin: 5, cognitiveLoad: 2, physicalDemand: 1, environment: "private", eyes: "closed", audio: "optional", movement: "none", discreet: false, bedtime: true, closing: true, gentle: true, basePriority: 4, steps: [
    { title: "Pick a neutral letter", body: "Say, B.", holdSec: 15 },
    { title: "Boat", body: "Picture it, briefly.", holdSec: 12 },
    { title: "Banana", body: "Hold it a moment.", holdSec: 12 },
    { title: "Button", body: "See it.", holdSec: 12 },
    { title: "Bookshelf", body: "Then let it go.", holdSec: 12 },
    { title: "New letter", body: "A new letter, new objects. No story, just images.", holdSec: 15 },
    { title: "Keep it slow", body: "If a thought links to the last, skip to a new letter.", holdSec: 120 },
    { title: "Drift", body: "Let the shuffle carry you toward sleep.", holdSec: 120 },
  ] }),
  make({ id: "tomorrowParking", name: "Tomorrow Parking Lot", category: "cognitive", mechanism: "cognitive-offloading", why: "Parking tomorrow's problems outside your head clears the runway for sleep.", targets: ["thoughts", "both"], states: ["worried", "overthinking", "cant_switch_off", "cant_sleep"], directions: ["sleep", "reset"], durationMin: 3, cognitiveLoad: 2, physicalDemand: 1, environment: "private", eyes: "closed", audio: "optional", movement: "none", discreet: false, bedtime: true, closing: true, gentle: true, basePriority: 5, steps: [
    { title: "Remember tomorrow", body: "One thing your brain wants to hold onto. Say it quietly, then set it down here.", holdSec: 40 },
    { title: "Deal with tomorrow", body: "One thing that needs handling. Park it here too.", holdSec: 40 },
    { title: "Can wait", body: "Anything else. It can wait. It's parked now.", holdSec: 40 },
    { title: "It's parked", body: "None of this needs solving tonight. It's noted, and it can stay here.", holdSec: 40 },
    { title: "Let the night begin", body: "Tomorrow has its own time. Tonight is for rest.", holdSec: 35 },
  ] }),
];

// =========================== CONNECTION / SOCIAL (4) ===========================
const CONNECTION = [
  make({ id: "reachOutNow", name: "Reach Out Now", category: "connection", mechanism: "social-connection", why: "A single small reach interrupts the withdrawal that deepens low mood.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "none", discreet: true, energy: "energising", arousal: "steady", basePriority: 6, steps: [
    { title: "Who comes to mind?", body: "The person most likely to make the next ten minutes a little easier.", holdSec: 20 },
    { title: "Keep it small", body: "A text, a call, a meme, a 'how are you'. No big conversation required.", holdSec: 25 },
    { title: "Send it", body: "One line. Then let it go.", holdSec: 55 },
    { title: "That counts", body: "You reached. Connection is the whole thing.", holdSec: 20 },
  ] }),
  make({ id: "voiceNote", name: "Send a Voice Note", category: "connection", mechanism: "social-connection", why: "Your voice, sent lightly, is connection without the weight of a full call.", targets: ["thoughts"], states: ["any"], directions: ["lift"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "required", movement: "none", discreet: true, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Pick someone easy", body: "Someone you're comfortable with.", holdSec: 15 },
    { title: "Hit record", body: "Say hello, share something, tell them about your day, ask how they are.", holdSec: 25 },
    { title: "Send it", body: "Short is perfect. No pressure to talk long.", holdSec: 55 },
    { title: "Done", body: "Your voice, out in the world. That's connection.", holdSec: 25 },
  ] }),
  make({ id: "petConnection", name: "Pet Connection", category: "connection", mechanism: "pet-connection", why: "A few minutes of real contact with an animal eases loneliness and stress.", targets: ["body", "thoughts"], states: ["any"], directions: ["lift"], durationMin: 3, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "seated", discreet: false, gentle: true, energy: "calming", arousal: "lower", basePriority: 5, steps: [
    { title: "Find your pet", body: "Sit beside them, or call them over.", holdSec: 15 },
    { title: "Slow pats", body: "Long, slow strokes. Notice the texture of their fur.", holdSec: 50 },
    { title: "Their warmth", body: "Feel their breathing, their weight against you.", holdSec: 40 },
    { title: "Talk to them", body: "A few quiet words. They know your voice.", holdSec: 30 },
    { title: "Stay", body: "A few minutes of nothing to do but this.", holdSec: 40 },
    { title: "Notice", body: "A little less alone.", holdSec: 12 },
  ] }),
  make({ id: "beAroundPeople", name: "Be Around People", category: "connection", mechanism: "social-presence", why: "Gentle human presence, with no talking required, softens isolation.", targets: ["thoughts", "body"], states: ["any"], directions: ["lift"], durationMin: 3, cognitiveLoad: 1, physicalDemand: 1, environment: "outdoors", eyes: "open", audio: "optional", movement: "full", discreet: false, performanceSafe: false, energy: "energising", arousal: "steady", basePriority: 5, steps: [
    { title: "Go where people are", body: "A café, library, park, common area. Somewhere with gentle human presence.", holdSec: 20 },
    { title: "No talking required", body: "You're just near. That's enough.", holdSec: 25 },
    { title: "Settle", body: "Find a spot. Sit.", holdSec: 35 },
    { title: "Let the presence in", body: "Voices, movement, life around you.", holdSec: 90 },
    { title: "You're not alone in this", body: "Just being near can ease the ache.", holdSec: 20 },
  ] }),
];

// =========================== EMOTION REGULATION (5) ===========================
const EMOTION = [
  make({ id: "nameFeeling", name: "Name What You're Feeling", category: "emotion", mechanism: "affect-labeling", why: "Putting a word on a feeling is a small act that reliably loosens its grip.", targets: ["thoughts"], states: ["any"], directions: ["calm", "reset"], durationMin: 2, cognitiveLoad: 2, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "none", discreet: true, energy: "calming", arousal: "lower", basePriority: 5, steps: [
    { title: "Find the closest word", body: "Anxious, sad, angry, numb, hurt, ashamed, tense, flat. Whatever fits best.", holdSec: 25 },
    { title: "How strong?", body: "One to ten, roughly.", holdSec: 25 },
    { title: "What touched it off?", body: "If you can see it, name it. If not, that's fine too.", holdSec: 50 },
    { title: "Say it out loud", body: "Sometimes naming it shrinks it a notch.", holdSec: 25 },
  ] }),
  make({ id: "whatNeed", name: "What Does This Emotion Need?", category: "emotion", mechanism: "needs-routing", why: "Asking what a feeling needs turns overwhelm into a next step.", targets: ["thoughts"], states: ["any"], directions: ["calm", "reset"], durationMin: 2, cognitiveLoad: 2, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "none", discreet: true, energy: "calming", arousal: "steady", basePriority: 5, steps: [
    { title: "You named it", body: "Now: what would help most right now?", holdSec: 15 },
    { title: "Pick one", body: "Space, comfort, action, connection, reassurance, movement, expression, rest, clarity.", holdSec: 45 },
    { title: "Let it point you", body: "Whatever you chose — that's the thread to follow next.", holdSec: 40 },
    { title: "No wrong answer", body: "Just information about what you need.", holdSec: 20 },
  ] }),
  make({ id: "urgeSurf", name: "Urge Surfing", category: "emotion", mechanism: "distress-tolerance", why: "Riding an urge without acting lets it lose height on its own.", targets: ["body", "thoughts"], states: ["any"], directions: ["calm", "reset"], durationMin: 4, cognitiveLoad: 3, physicalDemand: 1, environment: "any", eyes: "closed", audio: "optional", movement: "none", discreet: true, energy: "calming", arousal: "lower", basePriority: 5, steps: [
    { title: "Notice the urge", body: "Checking, reacting, messaging, avoiding, quitting, snapping. Name it quietly.", holdSec: 20 },
    { title: "Where in the body?", body: "Where do you feel it pulling?", holdSec: 25 },
    { title: "Rate it", body: "How strong, one to ten.", holdSec: 20 },
    { title: "Imagine a wave", body: "Rising, peaking, falling. Urges do that.", holdSec: 60 },
    { title: "Don't act yet", body: "Just ride it. It will lose height.", holdSec: 60 },
    { title: "Re-rate", body: "A little lower, maybe? Or the same — that's okay too.", holdSec: 25 },
    { title: "If it's still high", body: "Ride another wave. You don't have to act on it.", holdSec: 30 },
  ] }),
  make({ id: "rideWave", name: "Ride the Wave", category: "emotion", mechanism: "emotion-acceptance", why: "Staying with an emotion while it shifts teaches that it won't last forever.", targets: ["body", "thoughts"], states: ["any"], directions: ["calm", "reset"], durationMin: 4, cognitiveLoad: 2, physicalDemand: 1, environment: "any", eyes: "closed", audio: "optional", movement: "none", discreet: true, gentle: true, energy: "calming", arousal: "lower", closing: true, basePriority: 5, steps: [
    { title: "Find where it sits", body: "The emotion, somewhere in the body.", holdSec: 25 },
    { title: "How intense?", body: "Just notice. No need to change it.", holdSec: 20 },
    { title: "Stay with it", body: "Not fixing. Not fleeing. Just here with it.", holdSec: 90 },
    { title: "Watch it shift", body: "Emotions move like weather. Notice what changes.", holdSec: 60 },
    { title: "You're the space around it", body: "Not the feeling itself.", holdSec: 25 },
    { title: "Rest", body: "It can be here, and you can be okay.", holdSec: 25 },
  ] }),
  make({ id: "dontSendIt", name: "Don't Send It Yet", category: "emotion", mechanism: "response-delay", why: "A short pause before reacting stops the message you can't take back.", targets: ["thoughts"], states: ["any"], directions: ["calm", "reset"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "none", discreet: true, energy: "calming", arousal: "lower", basePriority: 6, steps: [
    { title: "Don't send it yet", body: "Put the phone down. Leave the draft.", holdSec: 20 },
    { title: "Step away", body: "A short break. Two, five, or ten minutes.", holdSec: 20 },
    { title: "Breathe it down", body: "Long, slow exhales.", pace: [{ label: "In", sec: 4 }, { label: "Long out", sec: 6 }], holdSec: 48 },
    { title: "Again", body: "Let the exhale be longer each time.", pace: [{ label: "In", sec: 4 }, { label: "Long out", sec: 6 }], holdSec: 48 },
    { title: "When the timer ends", body: "Decide then. Not now. You don't have to figure out what to say.", holdSec: 25 },
  ] }),
];

// =========================== BASIC NEEDS / STATE CHECK (1) ===========================
const NEEDS = [
  make({ id: "checkBasics", name: "Check the Basics", category: "cognitive", mechanism: "needs-assessment", why: "Sometimes the state is just a body asking for something simple.", targets: ["thoughts", "body"], states: ["any"], directions: ["calm", "reset"], durationMin: 2, cognitiveLoad: 1, physicalDemand: 1, environment: "any", eyes: "either", audio: "optional", movement: "none", discreet: true, energy: "calming", arousal: "steady", basePriority: 6, steps: [
    { title: "Quick scan", body: "Thirsty? Hungry? Too hot or cold? Sitting too long? Need air, daylight, the bathroom, less noise, less screen, sleep?", holdSec: 30 },
    { title: "One thing jumping out?", body: "Trust the first one.", holdSec: 20 },
    { title: "Tend to it", body: "Water, a snack, a stretch, fresh air, a quieter spot, a screen break. One small thing.", holdSec: 50 },
    { title: "Then see", body: "Sometimes the state was just a need in disguise.", holdSec: 20 },
  ] }),
];

// Keep the previous catalogue as migration input only. Recommendation, search,
// direct-launch and switching code below consume the curated 25-item catalogue.
// This preserves old session IDs without allowing retired practices to leak
// back into new pathways.
export const ARCHIVED_INTERVENTIONS = [...BREATHING, ...GROUNDING, ...COGNITIVE, ...SOMATIC, ...PANIC, ...WORK, ...LIFT, ...FOCUS, ...SLEEP, ...CONNECTION, ...EMOTION, ...NEEDS];
export const INTERVENTIONS = createCore25Catalogue(ARCHIVED_INTERVENTIONS);

const resolveFinalId = createFinal50Resolver(ARCHIVED_INTERVENTIONS, INTERVENTIONS);
const byId = (id) => {
  const resolved = resolveFinalId(id);
  return resolved ? INTERVENTIONS.find((iv) => iv.id === resolved) : undefined;
};
export const idFor = (key) => resolveFinalId(key);
export const getIntervention = (id) => byId(id);
export const pathwayByIds = (ids) => (ids || []).map(getIntervention).filter(Boolean);

export function normalizeAttemptResponse(value) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (["better", "same", "worse", "not_answered"].includes(raw)) return raw;
  if (raw === "neutral") return "same";
  if (raw === "bad") return "worse";
  if (raw === "good") return "better";
  return "not_answered";
}

export function buildAttemptRecord({ interventionId, mechanism, recommendedRank = 1, startedAt = new Date().toISOString(), endedAt = new Date().toISOString(), completedPercentage = 1, response = "not_answered", exitReason = "completed", switchPreference = null, coarseContextKey = null }) {
  const normalized = normalizeAttemptResponse(response);
  return {
    intervention_id: interventionId || null,
    mechanism: mechanism || null,
    recommended_rank: Number.isFinite(recommendedRank) ? Number(recommendedRank) : 1,
    started_at: startedAt || new Date().toISOString(),
    ended_at: endedAt || new Date().toISOString(),
    completed_percentage: Number.isFinite(completedPercentage) ? Math.min(1, Math.max(0, Number(completedPercentage))) : 1,
    response: normalized,
    exit_reason: ["completed", "skipped", "not_helping", "switched", "exited"].includes(exitReason) ? exitReason : "exited",
    switch_preference: switchPreference || undefined,
    context_key: coarseContextKey || undefined,
  };
}

export function deriveSubtype(direction, subtype, fallback) {
  const map = {
    calm: ["body_tension", "racing_thoughts", "both"],
    ground: ["overstimulated", "disconnected", "both"],
    lift: ["low_mood", "low_energy", "lonely"],
    focus: ["distracted", "overloaded", "tired", "avoiding"],
    sleep: ["racing_thoughts", "tense_body", "woke_up", "overstimulated"],
  };
  const allowed = map[direction] || [];
  if (subtype && allowed.includes(subtype)) return subtype;
  return fallback || (allowed[0] || null);
}

export function coarseContextKey(answers = {}) {
  return contextKeyV3(answers);
}

export function sessionHasValidBaseline(session = {}) {
  const start = Number(session.intensity_start ?? session.intensity ?? NaN);
  const end = Number(session.intensity_end ?? NaN);
  if (!Number.isFinite(start)) return false;
  if (!Number.isFinite(end)) return false;
  return true;
}

// A guaranteed safe, calming reset used whenever the engine can't build a
// personalised pathway — Extended Exhale is short, discreet-friendly, and
// needs no audio, so it works in almost any setting.
export const SAFE_FALLBACK = byId("sigh");

export const improvementOf = (s) =>
  s && s.intensity_start != null && s.intensity_end != null
    ? (s.direction === "lift" ? (s.intensity_end - s.intensity_start) : (s.intensity_start - s.intensity_end))
    : null;

export const segmentMinutes = (pathway = []) => {
  const sec = pathway.reduce((sum, iv) => sum + (iv.steps || []).reduce((s, st) => s + (st.holdSec || 0), 0), 0);
  return Math.max(1, Math.round(sec / 60));
};

// ---- learning: effectiveness + recency + usage signals from past sessions ----
// The effectiveness object carries four signals the engine consumes:
//   eff[id]            — 0..1 effectiveness (drop + would-use-again rating)
//   recentMap[id]      — summed decay over the last 8 sessions (0..~1.5);
//                        drives a strong multiplicative recency penalty so the
//                        same few interventions can't dominate consecutive resets
//   usageCount[id]     — total times used (exploration bonus / staleness penalty)
//   categoryUsage[cat] — total uses per category (keeps the library breadth alive)
//   totalUses          — denominator for category share
export function computeEffectiveness(sessions = []) {
  return computeEffectivenessV3(sessions, {
    resolveId: idFor,
    getIntervention: byId,
    contextKeyFor: coarseContextKey,
  });
}

export function pickLastWorked(sessions = []) {
  const valid = sessions.filter((s) => (s.pathway || []).length && s.intensity_start != null && s.intensity_end != null);
  const yes = valid.find((s) => s.would_use_again === "yes" && (improvementOf(s) ?? 0) > 0);
  if (yes) return yes;
  return valid.find((s) => (improvementOf(s) ?? 0) > 0) || null;
}

// "Use what works for you" — assemble a fresh pathway from the practices that
// have genuinely helped this user (proven effectiveness), rather than literally
// replaying a single past session. Returns null when there isn't enough proven
// history, so the caller can fall back to the last session.
export function buildPersonalBest(sessions = []) {
  const effectiveness = computeEffectiveness(sessions);
  const proven = Object.keys(effectiveness)
    .filter((k) => !["recentMap", "usageCount", "categoryUsage", "totalUses", "contextMap", "mechanismMap", "engineVersion"].includes(k))
    .some((id) => Number(effectiveness[id]) >= 0.55);
  if (!proven) return null;

  const dirCount = {};
  sessions.forEach((session) => {
    if (session.direction) dirCount[session.direction] = (dirCount[session.direction] || 0) + 1;
  });
  const direction = Object.entries(dirCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "calm";
  const answers = {
    direction,
    intensity: 5,
    whereFelt: "both",
    timeMin: 10,
    location: "home",
    audio: "yes",
    movement: "seated",
  };
  const picked = buildV3Sequence(answers, effectiveness, { count: 3, seed: "personal-best" });
  if (!picked.length) return null;
  return { pathway: picked.map((iv) => iv.id), direction };
}

export function buildProfile(sessions = []) {
  const valid = sessions.filter((s) => s.intensity_start != null && s.intensity_end != null);
  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const avgStart = +avg(valid.map((s) => s.intensity_start)).toFixed(1);
  const avgEnd = +avg(valid.map((s) => s.intensity_end)).toFixed(1);

  const toolMap = {};
  valid.forEach((s) => {
    const drop = improvementOf(s) ?? 0;
    (s.pathway || []).forEach((n) => {
      const id = idFor(n);
      if (!id) return;
      if (!toolMap[id]) toolMap[id] = { id, uses: 0, dropSum: 0 };
      toolMap[id].uses += 1;
      toolMap[id].dropSum += drop;
    });
  });
  const tools = Object.values(toolMap).map((t) => ({
    ...t,
    name: (getIntervention(t.id) || {}).name || t.id,
    avgDrop: +(t.dropSum / t.uses).toFixed(1),
  }));
  const mostUsed = [...tools].sort((a, b) => b.uses - a.uses || b.avgDrop - a.avgDrop).slice(0, 5);

  const topTools = (() => {
    const map = {};
    valid.forEach((s) => {
      const drop = improvementOf(s) ?? 0;
      (s.pathway || []).forEach((n) => {
        const id = idFor(n);
        if (!id) return;
        if (!map[id]) map[id] = { id, uses: 0, dropSum: 0 };
        map[id].uses += 1; map[id].dropSum += drop;
      });
    });
    return Object.values(map)
      .map((t) => ({ id: t.id, name: (getIntervention(t.id) || {}).name || t.id, uses: t.uses, drop: +(t.dropSum / t.uses).toFixed(1) }))
      .filter((t) => t.uses >= 1)
      .sort((a, b) => b.drop - a.drop || b.uses - a.uses)
      .slice(0, 5);
  })();

  const combos = {};
  valid.forEach((s) => {
    const ids = (s.pathway || []).map(idFor).filter(Boolean);
    if (!ids.length) return;
    const key = ids.join("→");
    if (!combos[key]) combos[key] = { ids, n: 0, dropSum: 0 };
    combos[key].n += 1;
    combos[key].dropSum += (improvementOf(s) ?? 0);
  });
  const bestCombo = Object.values(combos)
    .map((c) => ({ ...c, drop: +(c.dropSum / c.n).toFixed(1), names: c.ids.map((id) => (getIntervention(id) || {}).name || id) }))
    .sort((a, b) => b.drop - a.drop)[0] || null;

  return {
    count: valid.length,
    avgStart,
    avgEnd,
    change: +avg(valid.map((s) => (improvementOf(s) ?? 0))).toFixed(1),
    mostUsed,
    topTools,
    bestCombo,
  };
}

// ====================== RECOMMENDATION ENGINE V3 ======================
//
// Two-stage design:
//  1. hard eligibility: direction, eligible intensity, time, environment,
//     movement, audio, resources, safety, contraindications and substates.
//     These constraints are never relaxed.
//  2. transparent 100-point ranking via recommendationV3.js.

function familyOf(iv) {
  if (iv?.mechanismFamily) return iv.mechanismFamily;
  switch (iv?.category) {
    case "breathing": case "somatic": return "physio";
    case "grounding": return "sensory";
    case "cognitive": return "cognitive";
    case "lift": return "activation";
    case "focus": return "structure";
    case "sleep": return "winddown";
    case "connection": return "social";
    case "emotion": return "emotion";
    case "needs": return "needs";
    default: return iv?.category || "other";
  }
}

function desiredPathwayCount(timeMin) {
  const mins = Number(timeMin ?? 5);
  if (mins <= 3) return 1;
  if (mins < 8) return 2;
  if (mins < 15) return 3;
  return 4;
}

function pathwaySlot(index, count) {
  if (index === 0) return "opener";
  if (index === count - 1) return "closer";
  return "core";
}

function highDistressFamilyPriority(iv) {
  const family = familyOf(iv);
  if (family === "physio") return 0;
  if (["sensory", "somatic", "autogenic"].includes(family)) return 1;
  if (["emotion", "acceptance", "mindfulness"].includes(family)) return 2;
  if (family === "cognitive") return 3;
  return 4;
}

function isStrongHappyBumpAlternative(candidates, effectiveness = {}) {
  const happyBumpFit = Number(effectiveness.happyBump);
  if (!Number.isFinite(happyBumpFit) || happyBumpFit >= 0.55) return false;
  return candidates.some((candidate) =>
    candidate.id !== "happyBump" &&
    Number.isFinite(Number(effectiveness[candidate.id])) &&
    Number(effectiveness[candidate.id]) >= 0.7
  );
}

function liftOpeningPriority(iv, answers, effectiveness, slot) {
  if (iv.id !== "happyBump" || answers.direction !== "lift" || slot !== "opener") return 0;
  // An explicit current rejection is a preference, not an invitation to
  // overpower the user with a default. A well-supported alternative also wins.
  if (dislikePenalty(iv.id, iv.mechanism) >= 7) return Number.NEGATIVE_INFINITY;
  if (isStrongHappyBumpAlternative(INTERVENTIONS, effectiveness)) return 0;
  return 18;
}

function chooseRankedV3(candidates, a, effectiveness, {
  slot = "core",
  usedMechanisms = new Set(),
  usedFamilies = new Set(),
  seed = "",
  immediate = false,
} = {}) {
  const profile = inferProfileV3(a);
  const scored = candidates
    .map((iv) => {
      const result = scoreInterventionV3(iv, a, effectiveness, {
        profile,
        slot,
        usedMechanisms,
        usedFamilies,
        immediate,
        seed,
        dislikePenalty,
      });
      return { iv, result, priority: liftOpeningPriority(iv, a, effectiveness, slot) };
    })
    .filter((x) => x.result.eligible && Number.isFinite(x.result.score) && Number.isFinite(x.priority))
    .sort((x, y) => (y.result.score + y.priority) - (x.result.score + x.priority));

  if (!scored.length) return null;

  // Pathway rule (not an extra score): during high distress, if several
  // interventions are competitively ranked, prefer the more bottom-up family
  // for the opener: physiological -> sensory/somatic -> emotion -> cognitive.
  if (!immediate && slot === "opener" && Number(a.intensity) >= 7) {
    const top = scored[0].result.score;
    const competitive = scored.filter((x) => x.result.score >= top - 3);
    competitive.sort((x, y) => {
      const familyDiff = highDistressFamilyPriority(x.iv) - highDistressFamilyPriority(y.iv);
      return familyDiff || y.result.score - x.result.score;
    });
    return competitive[0];
  }

  return scored[0];
}

function buildV3Sequence(answers, effectiveness = {}, opts = {}) {
  const a = { location: "home", ...answers };
  const usedIds = new Set(opts.usedIds || []);
  const usedMechanisms = new Set(
    [...usedIds].map((id) => (byId(id) || {}).mechanism).filter(Boolean)
  );
  const usedFamilies = new Set(
    [...usedIds].map((id) => familyOf(byId(id))).filter(Boolean)
  );
  const immediate = !!opts.immediate;
  const requestedCount = Math.max(1, Number(opts.count ?? desiredPathwayCount(a.timeMin)));
  let remainingSeconds = Math.max(60, Number(a.timeMin ?? 5) * 60);
  const picked = [];

  for (let index = 0; index < requestedCount; index += 1) {
    const slot = pathwaySlot(index, requestedCount);
    const localAnswers = {
      ...a,
      remainingTime: remainingSeconds / 60,
    };
    const profile = inferProfileV3(localAnswers);

    let candidates = INTERVENTIONS.filter((iv) => {
      if (usedIds.has(iv.id)) return false;
      if (!hardEligibleV3(iv, localAnswers, profile)) return false;
      if (immediate && !immediateEligibleV3(iv, localAnswers, profile)) return false;
      return true;
    });

    if (!candidates.length) break;

    // Same exact mechanism is normally excluded after the first intervention.
    // If doing so would empty the pool, keep it as a last-resort ranking option;
    // this relaxes diversity only, never a hard clinical/context constraint.
    if (usedMechanisms.size) {
      const freshMechanism = candidates.filter((iv) => !usedMechanisms.has(iv.mechanism));
      if (freshMechanism.length) candidates = freshMechanism;
    }

    const ranked = chooseRankedV3(candidates, localAnswers, effectiveness, {
      slot,
      usedMechanisms,
      usedFamilies,
      immediate,
      seed: `${opts.seed ?? a.seed ?? ""}|${index}`,
    });
    if (!ranked) break;

    const iv = ranked.iv;
    picked.push(iv);
    usedIds.add(iv.id);
    if (iv.mechanism) usedMechanisms.add(iv.mechanism);
    usedFamilies.add(familyOf(iv));
    remainingSeconds = Math.max(0, remainingSeconds - interventionDurationSeconds(iv));
    if (remainingSeconds < 30) break;
  }

  return picked;
}

export function buildPathway(answers, effectiveness = {}) {
  const a = { location: "home", ...answers };
  if (a.immediate) return immediatePathway(a.intensity ?? 9, a, effectiveness);

  // V3 has no relaxed intensity/safety fallback. If nothing is hard-eligible,
  // return an empty pathway so the UI can ask the user to adjust constraints.
  return buildV3Sequence(a, effectiveness, {
    count: desiredPathwayCount(a.timeMin),
    seed: a.seed,
  });
}

export function buildSegment(answers, effectiveness = {}, opts = {}) {
  const { usedIds = [], targetMin = 3, direction, whereFelt, count: countHint } = opts;
  const a = {
    location: "home",
    ...answers,
    direction: direction || answers.direction,
    whereFelt: whereFelt || answers.whereFelt,
    timeMin: Math.max(1, targetMin),
  };

  return buildV3Sequence(a, effectiveness, {
    usedIds,
    count: countHint != null ? countHint : desiredPathwayCount(targetMin),
    immediate: !!a.immediate,
    seed: `${a.direction}|${a.whereFelt}|${a.intensity}|segment`,
  });
}

export function immediatePathway(intensity, answers = {}, effectiveness = {}) {
  const a = {
    location: "home",
    direction: "calm",
    intensity: Number(intensity ?? 9),
    timeMin: Math.max(3, Number(answers.timeMin || 5)),
    ...answers,
    immediate: true,
  };

  // Immediate mode uses the same V3 scorer, but the candidate pool is restricted
  // to low-load opener/rescue practices, lower/steady arousal, <=3 minutes,
  // with no strong cold, breath holds, cognitive restructuring, or exploration.
  return buildV3Sequence(a, effectiveness, {
    count: 3,
    immediate: true,
    seed: `${a.direction}|${a.whereFelt}|${a.intensity}|immediate`,
  });
}

// =========================== IN-SESSION SWITCH / SHORTEN ===========================
export function suggestSwitch(currentId, mode, answers, effectiveness = {}) {
  const a = { location: "home", ...answers };
  const current = byId(currentId);
  const profile = inferProfileV3(a);

  let pool = INTERVENTIONS.filter((iv) =>
    iv.id !== currentId &&
    hardEligibleV3(iv, a, profile) &&
    (!current?.mechanism || iv.mechanism !== current.mechanism)
  );

  // Diversity may relax if needed; hard eligibility never does.
  if (!pool.length) {
    pool = INTERVENTIONS.filter((iv) => iv.id !== currentId && hardEligibleV3(iv, a, profile));
  }
  if (!pool.length) return null;

  const modePredicate = (iv) => {
    switch (mode) {
      case "physical": return targetFitV3Compat(iv, "body");
      case "thoughts": return targetFitV3Compat(iv, "thoughts");
      case "quieter": return iv.gentle || iv.arousal === "lower";
      case "energising": return iv.energy === "energising" || iv.arousal === "raise";
      default: return true;
    }
  };
  const preferred = pool.filter(modePredicate);
  const candidates = preferred.length ? preferred : pool;
  const ranked = chooseRankedV3(candidates, a, effectiveness, {
    slot: "core",
    usedMechanisms: new Set(current?.mechanism ? [current.mechanism] : []),
    usedFamilies: new Set(current ? [familyOf(current)] : []),
    seed: `switch|${currentId}|${mode}`,
  });
  return ranked?.iv || null;
}

function targetFitV3Compat(iv, where) {
  const targets = iv.targets || [];
  const targetText = String(iv.algorithmTarget || "").toLowerCase();
  if (where === "body") {
    return targets.includes("body") || targets.includes("both") || /body|behaviour|sense|emotion/.test(targetText);
  }
  return targets.includes("thoughts") || targets.includes("both") || /thought|attention|value|environment/.test(targetText);
}

export function pickClosing(answers, excludeIds = [], effectiveness = {}) {
  const a = { location: "home", ...answers };
  const excluded = new Set(excludeIds);
  const profile = inferProfileV3(a);
  const candidates = INTERVENTIONS.filter((iv) => {
    if (excluded.has(iv.id)) return false;
    if (!hardEligibleV3(iv, a, profile)) return false;
    const roles = new Set((iv.pathwayRoles || []).map((r) => String(r).toLowerCase()));
    return iv.closing || roles.has("closer");
  });
  const ranked = chooseRankedV3(candidates, a, effectiveness, {
    slot: "closer",
    seed: "closing",
  });
  return ranked?.iv || null;
}

// Adaptive alternative selection: when user indicates current intervention isn't
// helping, suggest an alternative that has proven effective in this context rather
// than just any compatible intervention. This makes the system learn from user
// feedback and adapt in real-time.
export function suggestAdaptiveAlternative(currentId, mode, answers, effectiveness = {}) {
  return suggestSwitch(currentId, mode, answers, effectiveness);
}

export function transitionSentence(nextIv) {
  // Fixed, reusable transition lines — kept intervention-name-free so they
  // stay in the local narration manifest. The upcoming intervention's name
  // still renders on screen (see the transition UI), just not spoken.
  const templates = [
    "Now, let’s move into the next practice.",
    "Gently, we’ll shift into the next step.",
    "When you’re ready, let’s continue.",
    "Now, we’ll move gently forward.",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
