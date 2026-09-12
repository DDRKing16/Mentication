import { algorithmMetaFor } from "./final50AlgorithmMeta.js";
import { flagshipMetadataFor, FLAGSHIP_CATALOGUE_VERSION } from "./flagshipRegistry.js";

// Mentication curated intervention catalogue.
//
// This module deliberately sits between the original intervention definitions
// and the recommendation engine. The original definitions remain available as
// migration input, while every user-facing and automatically recommended path
// receives only the canonical active interventions. The historic core-25
// export names remain for saved-session and tooling compatibility.

export const CORE_25_CATALOGUE_VERSION = FLAGSHIP_CATALOGUE_VERSION;
// Backwards-compatible export for saved sessions and older imports.
export const FINAL_50_CATALOGUE_VERSION = CORE_25_CATALOGUE_VERSION;

const DEFAULTS = {
  category: "cognitive",
  type: "cognitive",
  mechanism: "cognitive-reappraisal",
  targets: ["thoughts"],
  states: ["any"],
  intensityMin: 0,
  intensityMax: 10,
  durationMin: 3,
  cognitiveLoad: 2,
  physicalDemand: 1,
  environment: "any",
  eyes: "either",
  audio: "optional",
  movement: "none",
  discreet: true,
  bedtime: false,
  panic: false,
  performanceSafe: true,
  energy: "steady",
  arousal: "steady",
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
  basePriority: 5,
};

const newIntervention = (definition) => ({
  ...DEFAULTS,
  ...definition,
  type: definition.type || definition.category || DEFAULTS.type,
});

// Explicit aliases preserve meaning for the most common duplicate, renamed and
// hero-upgraded IDs. Other retired IDs are resolved by a deterministic metadata
// match in createFinal50Resolver below.
export const LEGACY_ID_ALIASES = Object.freeze({
  cyclicSigh: "sigh",
  sighRest: "sigh",
  panicSigh: "sigh",
  exhaleLadder: "sigh",
  box: "boxV2",
  coherent: "resonant",
  waveBreath: "resonant",
  pmr: "progressive-muscle-relaxation-v2",
  bodyScan: "progressive-muscle-relaxation-v2",
  tenseRelease: "progressive-muscle-relaxation-v2",
  grounding54321: "grounding54321V2",
  grounding4321: "grounding54321V2",
  panic54321: "grounding54321V2",
  orientPanic: "orienting",
  discreetOrient: "orienting",
  feetFloor: "fivePoints",
  weightSense: "fivePoints",
  texture: "temperatureTexture",
  tempAnchor: "temperatureTexture",
  fabricTouch: "temperatureTexture",
  activationMenu: "activationMenu",
  move90: "changeScene",
  musicShift: "changeScene",
  natureStep: "changeScene",
  oneThing: "nextAction",
  singleTask: "signalLock",
  fiveMinRule: "twoMinStart",
  frictionDrop: "frictionSweep",
  reduceInputs: "frictionSweep",
  attentionAnchor: "signalLock",
  breathCountdown: "sigh",
  letGoOfDay: "dropSleepStruggle",
  cozyHaven: "progressive-muscle-relaxation-v2",
  resonant: "sigh",
  thoughtRecord: "factCheck",
  probability: "factCheck",
  worryPostpone: "solvableWorry",
  tinyWin: "activationMenu",
  activityScheduling: "activationMenu",
  lowMoodLoop: "activationMenu",
  reframeSetback: "factCheck",
  moodWalk: "changeScene",
  savourMemory: "activationMenu",
  fivePoints: "grounding54321V2",
  objectFocus: "grounding54321V2",
  temperatureTexture: "grounding54321V2",
  soundMap: "orienting",
  bodyRadar: "nameFeeling",
  rideWave: "urgeSurf",
  twoMinStart: "nextAction",
  taskBreakdown: "nextAction",
  implIntention: "nextAction",
  mobiliseFocus: "frictionSweep",
  sleepThoughtReframe: "dropSleepStruggle",
  constructiveWorry: "tomorrowParking",
  windDownBody: "progressive-muscle-relaxation-v2",
  sleepDrift: "sigh",
  breathWatch: "dropSleepStruggle",
  songMove: "changeScene",
  nextPhysicalStep: "nextAction",
  nextEasiestStep: "nextAction",
  energyLadder: "activationMenu",
  natureReset: "changeScene",
  valuesStep: "activationMenu",
  pomodoro: "signalLock",
  woop: "nextAction",
  brainDump: "nextAction",
  warmHeavy: "progressive-muscle-relaxation-v2",
});

// Only entries with changed clinical content are overridden here. Retained
// interventions keep their current production scripts and, therefore, their
// already generated narration audio.
const CONTENT_OVERRIDES = {
  sigh: {
    name: "Cyclic Sighing & Extended Exhale",
    why: "A double inhale followed by a comfortable, longer exhale can reduce physiological arousal quickly.",
    directions: ["calm", "ground"],
    supportedSubstates: ["body_tension", "tense_body", "overstimulated"],
    basePriority: 8,
    steps: [
      {
        title: "Let the breath stay comfortable",
        body: "Sit or stand with some support. If the breath feels uncomfortable or light-headed, return to normal breathing.",
        speak: "Find some support. Keep every breath comfortable. If you feel light-headed, return to normal breathing.",
        holdSec: 12,
      },
      {
        title: "Two inhales, one easy exhale",
        body: "Breathe in through the nose. Take one small second sip of air, then let a longer breath leave through the mouth.",
        speak: "Breathe in through the nose. Take one small second sip of air. Then let a longer breath leave through the mouth.",
        pace: [
          { label: "Breathe in", sec: 2 },
          { label: "Small second sip", sec: 1 },
          { label: "Easy breath out", sec: 6 },
        ],
        holdSec: 36,
      },
      {
        title: "Continue gently",
        body: "Repeat without forcing the inhale or emptying the lungs. Let the exhale do less, not more.",
        speak: "Continue gently. No forcing, and no need to empty the lungs. Let the exhale stay easy.",
        pace: [
          { label: "Breathe in", sec: 2 },
          { label: "Small second sip", sec: 1 },
          { label: "Easy breath out", sec: 6 },
        ],
        holdSec: 45,
      },
      {
        title: "Notice the shift",
        body: "Return to your natural breath. Notice any small change in your chest, shoulders or pace.",
        speak: "Return to your natural breath. Notice any small change in your chest, your shoulders, or your pace.",
        holdSec: 14,
      },
    ],
  },
  resonant: {
    directions: ["calm", "sleep"],
    bedtime: true,
    why: "Slow, even breathing at a comfortable rhythm can support steadier autonomic regulation.",
  },
  factCheck: {
    name: "Fact, Interpretation or Prediction?",
    why: "Separating observable facts from interpretations and predictions reduces unhelpful certainty.",
    directions: ["calm", "focus", "reset"],
    mechanism: "cognitive-decentring",
    cognitiveLoad: 3,
    supportedSubstates: ["racing_thoughts", "overloaded", "avoiding"],
    steps: [
      {
        title: "Catch the thought",
        body: "Put the thought into one short sentence. Use the exact words your mind is giving you.",
        speak: "Catch the thought and put it into one short sentence. Use the exact words your mind is giving you.",
        holdSec: 24,
      },
      {
        title: "Sort what it contains",
        body: "A fact is directly observable. An interpretation is the meaning you have added. A prediction is what your mind says will happen next.",
        speak: "Now sort it. A fact is directly observable. An interpretation is the meaning added. A prediction is what your mind says will happen next.",
        holdSec: 35,
      },
      {
        title: "Label each part",
        body: "Which words are facts? Which are interpretations? Which are predictions? More than one can be present.",
        speak: "Which parts are facts? Which are interpretations? Which are predictions? More than one can be present.",
        holdSec: 35,
      },
      {
        title: "Use a balanced sentence",
        body: "Try: ‘What I know is… What my mind is adding is… What I can do next is…’",
        speak: "Try this. What I know is... What my mind is adding is... What I can do next is...",
        holdSec: 42,
      },
    ],
  },
  thoughtRecord: {
    name: "Check the Evidence",
    why: "A brief evidence review helps replace all-or-nothing conclusions with a more balanced appraisal.",
    directions: ["calm", "focus", "reset"],
    mechanism: "evidence-review",
    durationMin: 4,
    cognitiveLoad: 4,
    requiredResources: [],
    steps: [
      {
        title: "Name the conclusion",
        body: "What is the upsetting conclusion your mind has reached? Keep it to one sentence.",
        speak: "Name the upsetting conclusion your mind has reached. Keep it to one sentence.",
        holdSec: 28,
      },
      {
        title: "Evidence that supports it",
        body: "List only observable information. Leave out guesses, feelings and mind-reading for this step.",
        speak: "What observable information supports it? For this step, leave out guesses, feelings, and mind-reading.",
        holdSec: 42,
      },
      {
        title: "Evidence that does not",
        body: "What facts, exceptions or missing information make the conclusion less certain?",
        speak: "What facts, exceptions, or missing information make that conclusion less certain?",
        holdSec: 42,
      },
      {
        title: "Build the balanced view",
        body: "Use both sides: ‘Although…, it is also true that… The most balanced view is…’",
        speak: "Use both sides. Although... it is also true that... The most balanced view is...",
        holdSec: 48,
      },
    ],
  },
  probability: {
    directions: ["calm", "focus", "reset"],
    why: "Estimating likelihood separately from possibility helps calibrate threat predictions.",
  },
  worryPostpone: {
    directions: ["calm", "focus", "sleep", "reset"],
    why: "Setting a specific worry period can reduce repeated engagement with worry outside that time.",
  },
  activationMenu: {
    name: "Ignition Point",
    why: "Choosing a personally meaningful source of pleasure, mastery, connection or dream can create a reason to move before motivation arrives.",
    directions: ["lift", "focus"],
    mechanism: "behavioural-activation-choice",
    durationMin: 3,
    cognitiveLoad: 2,
    steps: [
      {
        title: "Choose the need",
        body: "Would today benefit most from pleasure, a sense of mastery, connection with someone, or one small step toward a dream?",
        speak: "Choose what would help most today. A little pleasure, a sense of mastery, connection with someone, or one small step toward a dream.",
        holdSec: 26,
      },
      {
        title: "Make the action small",
        body: "Pick one action that is specific, realistic and possible within the next hour.",
        speak: "Pick one action that is specific, realistic, and possible within the next hour.",
        holdSec: 32,
      },
      {
        title: "Choose when and where",
        body: "Complete the plan: ‘At…, in…, I will… for… minutes.’",
        speak: "Choose when and where. At this time... in this place... I will do this... for this many minutes.",
        holdSec: 38,
      },
      {
        title: "Begin with the first move",
        body: "What is the first visible action? Start that part now, before waiting for motivation.",
        speak: "What is the first visible action? Begin that part now, before waiting for motivation.",
        holdSec: 30,
      },
    ],
  },
  nextAction: {
    name: "Next Easiest Step",
    mechanism: "executive-friction-reduction",
    why: "Identifying the exact barrier and compressing the task into one observable action makes starting more executable.",
    directions: ["focus", "lift"],
    durationMin: 3,
    cognitiveLoad: 2,
    steps: [
      { title: "Name the barrier", body: "Choose what is blocking focus: the next action is unclear, effort feels too high, attention is pulled away, the task is too large, or there is no drive.", holdSec: 30 },
      { title: "Compress the task", body: "Reduce the entry requirement until one observable physical action remains.", holdSec: 35 },
      { title: "Take the step", body: "The app does not need to stay open. Return when something has happened.", holdSec: 20 },
    ],
  },
  tomorrowParking: {
    name: "Tomorrow Parking Lot",
    mechanism: "cognitive-offloading",
    why: "Capturing one unfinished responsibility outside the night reduces the need to keep rehearsing it in bed.",
    durationMin: 1,
    cognitiveLoad: 1,
    bedtime: true,
    closing: true,
    steps: [
      { title: "Park what is unfinished", body: "Capture the unfinished thought, responsibility or task in one short line.", holdSec: 30 },
      { title: "Stored for tomorrow", body: "It has been saved outside the night. Put the phone down; nothing else needs to be completed now.", holdSec: 20 },
    ],
  },
  brainDump: {
    name: "Distraction Dump",
    why: "Externalising competing thoughts reduces the need to keep rehearsing them while focusing.",
    directions: ["focus", "sleep"],
    mechanism: "cognitive-offload",
    steps: [
      {
        title: "Open a capture space",
        body: "Use paper or a notes app. This is a holding place, not another task list to solve now.",
        speak: "Open paper or a notes app. This is only a holding place. Nothing needs to be solved right now.",
        holdSec: 18,
      },
      {
        title: "Empty the mental tabs",
        body: "Write each distraction, reminder or worry as a short line. Do not organise yet.",
        speak: "Write each distraction, reminder, or worry as a short line. Do not organise anything yet.",
        holdSec: 60,
      },
      {
        title: "Mark the true next item",
        body: "Circle only what matters next. Park everything else for a later review time.",
        speak: "Circle only what matters next. Park everything else for a later review time.",
        holdSec: 34,
      },
      {
        title: "Return to one thing",
        body: "Close the list and begin the smallest visible step of the circled item.",
        speak: "Close the list. Begin the smallest visible step of the circled item.",
        holdSec: 26,
      },
    ],
  },
};

const NEW_INTERVENTIONS = {
  thenWhat: newIntervention({
    id: "thenWhat", name: "Then What?", category: "cognitive", mechanism: "coping-appraisal",
    why: "Extending the story beyond a feared frame reveals possible responses, support and life beyond the event.",
    targets: ["thoughts"], states: ["worried", "overthinking", "anxious"], directions: ["calm", "focus", "reset"],
    durationMin: 5, cognitiveLoad: 4, energy: "steady", intensityMin: 2, intensityMax: 7,
    unsuitableSubstates: ["acute", "disconnected"],
    steps: [
      { title: "Freeze the exact frame", body: "Name the specific moment your mind keeps stopping at, without graphic detail.", holdSec: 30 },
      { title: "Name the catastrophic meaning", body: "Notice whether the mind has turned pain, embarrassment or disruption into permanent damage or complete inability to cope.", holdSec: 35 },
      { title: "Continue the film", body: "What happens immediately afterwards? What first response, person or resource becomes available?", holdSec: 45 },
      { title: "Build the coping route", body: "Map the first move, first person, first resource, what remains intact and what happens next.", holdSec: 50 },
      { title: "Return to now", body: "Decide whether anything genuinely needs to be done now.", holdSec: 25 },
    ],
  }),
  countermove: newIntervention({
    id: "countermove", name: "Countermove", category: "lift", mechanism: "graded-opposite-action",
    why: "A capacity-matched move can change direction while a low-mood pull remains present.",
    targets: ["thoughts", "body"], states: ["any"], directions: ["lift", "focus"], durationMin: 4,
    cognitiveLoad: 3, physicalDemand: 1, energy: "energising", arousal: "raise", intensityMax: 7,
    steps: [
      { title: "Name the pull", body: "Identify whether the pull says isolate, stay still, cancel, avoid, stay silent, give up, scroll or numb.", holdSec: 30 },
      { title: "Check the pull", body: "Is it protecting you, supporting genuine recovery, or providing short-term relief while life gets smaller?", holdSec: 35 },
      { title: "Choose a trajectory", body: "Select a 5 degree nudge, 20 degree shift or 45 degree breakaway that fits current capacity.", holdSec: 35 },
      { title: "Take the move", body: "The app does not need to stay open. Come back when something has happened.", holdSec: 20 },
    ],
  }),
  openChannel: newIntervention({
    id: "openChannel", name: "Open Channel", category: "connection", mechanism: "relational-reentry",
    why: "A deliberate, safe bridge can reopen connection after withdrawal without requiring a perfect explanation or a reply.",
    targets: ["thoughts", "both"], states: ["any"], directions: ["lift", "calm"], durationMin: 4,
    cognitiveLoad: 3, environment: "any", energy: "steady", intensityMax: 7,
    steps: [
      { title: "Where did the channel close?", body: "Identify the silence, cancellation, distance or difficult interaction.", holdSec: 30 },
      { title: "Check the connection", body: "Only continue if contact is emotionally and physically safe and no boundary prohibits it.", holdSec: 30 },
      { title: "Choose the bridge", body: "Choose a signal, reopen, repair, ask or safe shared presence.", holdSec: 35 },
      { title: "Complete outside the app", body: "Review and edit any wording yourself. No message will be sent automatically.", holdSec: 25 },
    ],
  }),
  pulseShift: newIntervention({
    id: "pulseShift", name: "Pulse Shift", category: "lift", mechanism: "graded-psychomotor-activation",
    why: "Accessible, capacity-matched movement can create usable activation without waiting for motivation.",
    targets: ["body", "both"], states: ["any"], directions: ["lift", "focus"], durationMin: 4,
    cognitiveLoad: 1, physicalDemand: 1, movement: "seated", energy: "energising", arousal: "raise", intensityMax: 6,
    unsuitableSubstates: ["acute", "body_tension"], contraindicationTags: ["dizziness", "pain", "physical-instability"],
    steps: [
      { title: "Check the starting state", body: "Continue for flatness, heaviness, slowing or fogginess - not panic, dizziness, pain, instability or a genuine need for rest.", holdSec: 25 },
      { title: "Unlock", body: "Use an accessible posture or joint movement from lying, seated, standing or moving.", holdSec: 35 },
      { title: "Build", body: "Add a capacity-matched rhythm or bilateral movement, with seated and low-mobility alternatives.", holdSec: 40 },
      { title: "Direct", body: "Choose what this movement could carry you into next.", holdSec: 30 },
    ],
  }),
  reroute: newIntervention({
    id: "reroute", name: "Reroute", category: "grounding", mechanism: "preferred-attention-redirection",
    why: "A brief physical foothold can restore enough choice to redirect attention into a familiar, absorbing activity.",
    targets: ["body", "thoughts"], states: ["overwhelmed", "anxious", "distressed"], directions: ["ground", "lift"],
    durationMin: 3, cognitiveLoad: 1, eyes: "open", energy: "steady", intensityMin: 3, intensityMax: 8,
    unsuitableSubstates: ["immediate-danger"], requiredResources: ["safe preferred activity"],
    steps: [
      { title: "Create a foothold", body: "Use one stable physical point for about ten seconds. No controlled breathing or prolonged scan.", holdSec: 10 },
      { title: "Choose the destination", body: "Select a familiar, absorbing, comforting, active, social, funny or creative activity.", holdSec: 25 },
      { title: "Open the route", body: "Remove the first piece of friction and leave Mentication for the real activity.", holdSec: 15 },
    ],
  }),
  signalLock: newIntervention({
    id: "signalLock", name: "Signal Lock", category: "focus", mechanism: "scaffold-lock-sprint",
    why: "Turning a vague task into a startable target and containing distractions makes a bounded focus sprint easier to begin.",
    targets: ["thoughts", "behaviour"], states: ["distracted", "avoiding", "overloaded"], directions: ["focus", "lift"],
    durationMin: 8, cognitiveLoad: 3, energy: "energising", arousal: "raise", intensityMin: 0, intensityMax: 7,
    steps: [
      { title: "Scaffold", body: "Compress the intended task into one observable target that can begin within twenty seconds.", holdSec: 30 },
      { title: "Lock", body: "Choose a finish line, sprint length and only the perimeter changes that matter.", holdSec: 30 },
      { title: "Sprint", body: "Start the visible countdown; distractions can be captured without leaving the target.", holdSec: 180 },
    ],
  }),
  nightChannel: newIntervention({
    id: "nightChannel", name: "Night Channel", category: "sleep", mechanism: "narrative-attentional-capture",
    why: "Interesting, low-pressure narrative audio gives bedtime attention somewhere appealing to settle without requiring an exercise.",
    targets: ["thoughts"], states: ["cant_sleep", "cant_switch_off", "worried"], directions: ["sleep", "calm"],
    durationMin: 15, cognitiveLoad: 1, bedtime: true, closing: true, audio: "required", energy: "calming", arousal: "lower",
    requiredResources: ["selected audio source"],
    steps: [
      { title: "Tune the channel", body: "Choose a familiar voice, continuing story, interesting facts, gentle conversation, fictional world or replay.", holdSec: 20 },
      { title: "Set the descent", body: "Choose familiarity, engagement and an optional fade duration.", holdSec: 20 },
      { title: "Let the screen disappear", body: "Playback continues with accessible controls while the interface moves toward near-black.", holdSec: 20 },
    ],
  }),
  solvableWorry: newIntervention({
    id: "solvableWorry",
    name: "Solvable or Hypothetical Worry?",
    category: "cognitive",
    mechanism: "worry-discrimination",
    why: "Distinguishing a current problem from a hypothetical worry directs attention towards either action or disengagement.",
    targets: ["thoughts"],
    states: ["worried", "overthinking", "cant_switch_off", "anxious"],
    directions: ["calm", "focus", "sleep", "reset"],
    durationMin: 3,
    cognitiveLoad: 3,
    supportedSubstates: ["racing_thoughts", "overloaded", "avoiding"],
    steps: [
      { title: "Name the worry", body: "Put the worry into one sentence. What exactly is your mind asking you to solve?", speak: "Put the worry into one sentence. What exactly is your mind asking you to solve?", holdSec: 28 },
      { title: "Is there a current problem?", body: "Is something happening now that can be acted on, or is this mainly a ‘what if’ about the future?", speak: "Is something happening now that can be acted on? Or is this mainly a what-if about the future?", holdSec: 34 },
      { title: "If it is solvable", body: "Choose one useful next action, who will do it, and when. Keep the step small enough to start.", speak: "If it is solvable, choose one useful next action, who will do it, and when. Keep it small enough to start.", holdSec: 40 },
      { title: "If it is hypothetical", body: "Label it ‘hypothetical worry’, postpone it to worry time, and bring attention back to the present task.", speak: "If it is hypothetical, label it hypothetical worry. Postpone it to worry time, and bring attention back to the present task.", holdSec: 38 },
    ],
  }),
  activityScheduling: newIntervention({
    id: "activityScheduling",
    name: "Activity Scheduling",
    category: "lift",
    mechanism: "behavioural-activation-scheduling",
    why: "Scheduling a concrete, achievable activity helps action occur even when motivation is low.",
    targets: ["thoughts", "body"],
    states: ["any"],
    directions: ["lift", "focus"],
    durationMin: 4,
    cognitiveLoad: 3,
    energy: "energising",
    arousal: "raise",
    steps: [
      { title: "Choose one useful activity", body: "Pick something small that offers pleasure, mastery, connection or physical care.", speak: "Choose one small activity that offers pleasure, mastery, connection, or physical care.", holdSec: 30 },
      { title: "Set a realistic dose", body: "Shrink it until it feels achievable on a low-energy day. Ten useful minutes still counts.", speak: "Shrink it until it feels achievable on a low-energy day. Ten useful minutes still counts.", holdSec: 32 },
      { title: "Schedule it precisely", body: "Choose the day, start time and place. Add it to a calendar or reminder if available.", speak: "Choose the day, the start time, and the place. Add it to a calendar or reminder if available.", holdSec: 40 },
      { title: "Plan around the obstacle", body: "Name the most likely barrier and one adjustment that makes follow-through easier.", speak: "Name the most likely barrier. Choose one adjustment that makes follow-through easier.", holdSec: 36 },
    ],
  }),
  lowMoodLoop: newIntervention({
    id: "lowMoodLoop",
    name: "Low-Mood Loop Breaker",
    category: "lift",
    mechanism: "behavioural-activation-formulation",
    why: "Mapping the low-mood avoidance cycle identifies the smallest point where behaviour can change the loop.",
    targets: ["thoughts", "body"],
    states: ["any"],
    directions: ["lift", "focus"],
    durationMin: 4,
    cognitiveLoad: 3,
    energy: "energising",
    arousal: "raise",
    steps: [
      { title: "Name what dropped away", body: "When mood fell, what useful or meaningful activity became less frequent?", speak: "When mood fell, what useful or meaningful activity became less frequent?", holdSec: 34 },
      { title: "Notice the short-term relief", body: "What did avoidance make easier in the moment? No judgement; identify what keeps the loop going.", speak: "What did avoidance make easier in the moment? No judgement. Just notice what keeps the loop going.", holdSec: 36 },
      { title: "Notice the longer-term cost", body: "How does doing less affect mood, confidence, energy or connection later?", speak: "How does doing less affect mood, confidence, energy, or connection later?", holdSec: 36 },
      { title: "Break one link", body: "Choose the smallest opposite action that is safe and possible today. Begin for two minutes.", speak: "Choose the smallest safe opposite action that is possible today. Begin for two minutes.", holdSec: 42 },
    ],
  }),
  testPrediction: newIntervention({
    id: "testPrediction",
    name: "Test the Prediction",
    category: "lift",
    mechanism: "behavioural-experiment",
    why: "A small behavioural experiment creates real-world evidence about an unhelpful prediction.",
    targets: ["thoughts", "body"],
    states: ["worried", "overthinking", "any"],
    directions: ["lift", "focus", "calm"],
    durationMin: 4,
    cognitiveLoad: 4,
    energy: "steady",
    steps: [
      { title: "State the prediction", body: "Complete: ‘If I do…, then… will happen.’ Rate how strongly you believe it from 0 to 100.", speak: "State the prediction. If I do this... then this will happen. Rate how strongly you believe it, from zero to one hundred.", holdSec: 36 },
      { title: "Design a small fair test", body: "Choose a safe, manageable action that could give useful evidence. Keep it small enough to complete.", speak: "Design a small, fair test. Choose a safe, manageable action that could give useful evidence.", holdSec: 42 },
      { title: "Define what to observe", body: "What outcome would support the prediction? What outcome would not support it?", speak: "Decide what to observe. What would support the prediction? And what would not support it?", holdSec: 34 },
      { title: "Run it and review", body: "Choose when to test it. Afterwards, compare the prediction with what actually happened and re-rate the belief.", speak: "Choose when to test it. Afterwards, compare the prediction with what actually happened, and rate the belief again.", holdSec: 42 },
    ],
  }),
  reframeSetback: newIntervention({
    id: "reframeSetback",
    name: "Reframe the Setback",
    category: "lift",
    mechanism: "cognitive-reappraisal",
    why: "A balanced appraisal of a setback protects motivation without dismissing disappointment.",
    targets: ["thoughts"],
    states: ["overthinking", "worried", "any"],
    directions: ["lift", "calm", "focus"],
    durationMin: 3,
    cognitiveLoad: 3,
    steps: [
      { title: "Name what happened", body: "Describe the setback using only specific facts. Avoid labels about who you are.", speak: "Describe what happened using only specific facts. Leave out labels about who you are.", holdSec: 32 },
      { title: "Name the understandable impact", body: "What did this cost, and what feeling makes sense here? A balanced reframe does not deny the impact.", speak: "Name the understandable impact. What did this cost, and what feeling makes sense here?", holdSec: 36 },
      { title: "Find the limited meaning", body: "What does this event not prove about you, the future or every other attempt?", speak: "What does this event not prove about you, the future, or every other attempt?", holdSec: 34 },
      { title: "Choose the useful meaning", body: "Complete: ‘This was difficult, and the next useful thing I can do is…’",
        speak: "Complete this sentence. This was difficult... and the next useful thing I can do is...", holdSec: 40 },
    ],
  }),
  temperatureTexture: newIntervention({
    id: "temperatureTexture",
    name: "Temperature and Texture Reset",
    category: "grounding",
    mechanism: "tactile-grounding",
    why: "Deliberate contact with neutral sensory detail can reorient attention to the present.",
    targets: ["body", "thoughts"],
    states: ["overstimulated", "overwhelmed", "panicky", "anxious", "any"],
    directions: ["ground", "calm"],
    durationMin: 2,
    cognitiveLoad: 1,
    physicalDemand: 1,
    eyes: "open",
    movement: "seated",
    panic: true,
    steps: [
      { title: "Choose a safe object", body: "Hold something nearby: fabric, a mug, keys or another safe object. Avoid extreme heat or cold.", speak: "Choose a safe object nearby. Avoid anything extremely hot or cold.", holdSec: 18 },
      { title: "Notice temperature", body: "Is it cool, warm or neutral? Notice the temperature without needing it to change.", speak: "Notice the temperature. Cool, warm, or neutral. Nothing needs to change.", holdSec: 28 },
      { title: "Notice texture", body: "Move your fingertips slowly. Find edges, smoothness, roughness, weight and pressure.", speak: "Move your fingertips slowly. Notice edges, smoothness, roughness, weight, and pressure.", holdSec: 36 },
      { title: "Name what is here", body: "Say three neutral sensory facts, then look up and name where you are.", speak: "Name three neutral sensory facts. Then look up, and name where you are.", holdSec: 28 },
    ],
  }),
  frictionSweep: newIntervention({
    id: "frictionSweep",
    name: "Friction Sweep",
    category: "focus",
    mechanism: "environment-design",
    why: "Removing one practical obstacle and one competing cue makes task initiation more likely.",
    targets: ["thoughts", "body"],
    states: ["overwhelmed", "overstimulated", "restless", "any"],
    directions: ["focus", "lift"],
    durationMin: 2,
    cognitiveLoad: 2,
    energy: "energising",
    arousal: "raise",
    steps: [
      { title: "Spot the first friction", body: "What is making the first step harder: a missing item, unclear instruction, clutter or too many choices?", speak: "Spot the first friction. A missing item, an unclear instruction, clutter, or too many choices.", holdSec: 28 },
      { title: "Remove one obstacle", body: "Put the needed item in reach, open the right file, clear a small space or choose the first option.", speak: "Remove one obstacle. Put the needed item in reach, open the right file, clear a small space, or choose the first option.", holdSec: 34 },
      { title: "Quiet one competing cue", body: "Silence one alert, close one tab, move the phone or reduce one source of noise.", speak: "Quiet one competing cue. Silence one alert, close one tab, move the phone, or reduce one source of noise.", holdSec: 28 },
      { title: "Start before adding more", body: "Begin the next physical step now. Do not optimise the whole environment first.", speak: "Begin the next physical step now. The whole environment does not need to be perfect.", holdSec: 24 },
    ],
  }),
  woop: newIntervention({
    id: "woop",
    name: "WOOP",
    category: "focus",
    mechanism: "mental-contrasting",
    why: "Wish, outcome, obstacle and plan turns a valued intention into a realistic implementation plan.",
    targets: ["thoughts"],
    states: ["overwhelmed", "worried", "any"],
    directions: ["focus", "lift"],
    durationMin: 4,
    cognitiveLoad: 4,
    steps: [
      { title: "Wish", body: "Choose one meaningful wish that is challenging but possible within a realistic timeframe.", speak: "Choose one meaningful wish. Something challenging, but possible within a realistic timeframe.", holdSec: 34 },
      { title: "Outcome", body: "What would be the best result of making progress? Picture the most important benefit.", speak: "What would be the best result of making progress? Picture the most important benefit.", holdSec: 34 },
      { title: "Obstacle", body: "What within you is most likely to get in the way: a thought, feeling, habit or impulse?",
        speak: "What within you is most likely to get in the way? A thought, a feeling, a habit, or an impulse.", holdSec: 38 },
      { title: "Plan", body: "Complete: ‘If this obstacle appears, then I will…’ Choose one specific, effective response.", speak: "Make the plan. If this obstacle appears... then I will... Choose one specific response.", holdSec: 44 },
    ],
  }),
  awakeInBedReset: newIntervention({
    id: "awakeInBedReset",
    name: "Awake-in-Bed Reset",
    category: "sleep",
    mechanism: "stimulus-control",
    why: "Leaving bed briefly when wakefulness becomes prolonged helps re-associate bed with sleep rather than struggle.",
    targets: ["thoughts", "body"],
    states: ["cant_sleep", "cant_switch_off"],
    directions: ["sleep"],
    durationMin: 3,
    cognitiveLoad: 1,
    environment: "private",
    eyes: "open",
    bedtime: true,
    energy: "calming",
    arousal: "lower",
    steps: [
      { title: "Stop checking the time", body: "Turn the clock away. If you have been awake and becoming frustrated, stop trying harder to sleep.", speak: "Turn the clock away. If you have been awake and becoming frustrated, stop trying harder to sleep.", holdSec: 24 },
      { title: "Leave the bed briefly", body: "Move to a safe, dimly lit place. Keep stimulation low and avoid work, news or scrolling.", speak: "Move to a safe, dimly lit place. Keep stimulation low. Avoid work, news, and scrolling.", holdSec: 28 },
      { title: "Choose a quiet activity", body: "Read something undemanding, listen quietly, or sit comfortably. The aim is rest, not forcing sleep.", speak: "Choose a quiet, undemanding activity. The aim is rest, not forcing sleep.", holdSec: 48 },
      { title: "Return when sleepy", body: "Go back to bed when your eyes feel heavy or you notice sleepiness. Repeat if the struggle returns.", speak: "Return to bed when your eyes feel heavy, or you notice sleepiness. Repeat if the struggle returns.", holdSec: 34 },
    ],
  }),
  sleepThoughtReframe: newIntervention({
    id: "sleepThoughtReframe",
    name: "Sleep Thought Reframe",
    category: "sleep",
    mechanism: "cbti-cognitive-restructuring",
    why: "A balanced response to catastrophic sleep thoughts reduces arousal and performance pressure.",
    targets: ["thoughts"],
    states: ["cant_sleep", "cant_switch_off", "worried"],
    directions: ["sleep", "calm"],
    durationMin: 3,
    cognitiveLoad: 3,
    bedtime: true,
    energy: "calming",
    arousal: "lower",
    steps: [
      { title: "Catch the sleep thought", body: "What is your mind predicting about tonight or tomorrow? Put it into one sentence.", speak: "Catch the sleep thought. What is your mind predicting about tonight, or tomorrow?", holdSec: 30 },
      { title: "Check the certainty", body: "Is this a guaranteed fact, or a tired mind making an understandable prediction? What evidence is missing?", speak: "Is this guaranteed fact? Or is a tired mind making an understandable prediction? What evidence is missing?", holdSec: 38 },
      { title: "Use a balanced response", body: "Try: ‘This may be a difficult night, and my body can still rest. Tomorrow may be harder, not impossible.’",
        speak: "Try a balanced response. This may be a difficult night, and my body can still rest. Tomorrow may be harder, not impossible.", holdSec: 42 },
      { title: "Return to resting", body: "Let the problem-solving stop here. Rest is useful even before sleep arrives.", speak: "Let the problem-solving stop here. Rest is useful, even before sleep arrives.", holdSec: 30 },
    ],
  }),
  dropSleepStruggle: newIntervention({
    id: "dropSleepStruggle",
    name: "Drop the Sleep Struggle",
    category: "sleep",
    mechanism: "paradoxical-acceptance",
    why: "Letting go of the effort to force sleep reduces the arousal created by monitoring and struggle.",
    targets: ["thoughts", "body"],
    states: ["cant_sleep", "cant_switch_off"],
    directions: ["sleep", "calm"],
    durationMin: 4,
    cognitiveLoad: 1,
    bedtime: true,
    closing: true,
    energy: "calming",
    arousal: "lower",
    steps: [
      { title: "Release the task", body: "For now, sleep is not a task to complete. Nothing needs to be achieved in this moment.", speak: "For now, sleep is not a task to complete. Nothing needs to be achieved in this moment.", holdSec: 32 },
      { title: "Allow quiet wakefulness", body: "Give yourself permission to be awake and resting. Let the eyes be soft rather than checking for sleep.", speak: "Give yourself permission to be awake and resting. Let the eyes be soft, rather than checking for sleep.", holdSec: 44 },
      { title: "Notice without measuring", body: "Feel the support beneath you. Notice one breath, then another, without judging whether it is working.", speak: "Feel the support beneath you. Notice one breath, then another, without judging whether it is working.", holdSec: 54 },
      { title: "Let sleep come in its own time", body: "The only aim is to rest quietly. Sleep can arrive when it arrives.", speak: "The only aim is to rest quietly. Sleep can arrive when it arrives.", holdSec: 44 },
    ],
  }),
  constructiveWorry: newIntervention({
    id: "constructiveWorry",
    name: "Constructive Worry",
    category: "sleep",
    mechanism: "scheduled-problem-solving",
    why: "Writing worries and one next step before bed reduces unfinished problem-solving in bed.",
    targets: ["thoughts"],
    states: ["worried", "cant_sleep", "cant_switch_off"],
    directions: ["sleep", "calm"],
    durationMin: 5,
    cognitiveLoad: 3,
    bedtime: true,
    energy: "calming",
    arousal: "lower",
    steps: [
      { title: "Use a page, not the bed", body: "Do this before settling to sleep where possible. Divide a page into ‘worry’ and ‘next step’.", speak: "Use a page or notes app. Divide it into worry, and next step. Where possible, do this before getting into bed.", holdSec: 24 },
      { title: "Write each worry briefly", body: "Use one line for each concern. Avoid analysing it in detail.", speak: "Write each concern in one short line. Avoid analysing it in detail.", holdSec: 55 },
      { title: "Add one next step", body: "For solvable concerns, write the smallest next action and when it will happen. For hypothetical worries, write ‘no action tonight’.", speak: "Add one next step for each solvable concern, and when it will happen. For hypothetical worries, write, no action tonight.", holdSec: 65 },
      { title: "Close the list", body: "Tell yourself: ‘This has been captured. I can return to it at the planned time.’",
        speak: "Close the list. This has been captured. You can return to it at the planned time.", holdSec: 34 },
    ],
  }),
};

// Order is product order. It is also the source of truth for the catalogue
// count and for the within-direction order in the Intervention Library.
const CORE_25_SPECS = [
  // Calm (7)
  ["sigh", "calm"],
  ["boxV2", "calm"],
  ["progressive-muscle-relaxation-v2", "calm"],
  ["factCheck", "calm"],
  ["solvableWorry", "calm"],
  ["urgeSurf", "calm"],
  ["thenWhat", "calm"],

  // Lift (7)
  ["activationMenu", "lift"],
  ["countermove", "lift"],
  ["openChannel", "lift"],
  ["pulseShift", "lift"],
  ["testPrediction", "lift"],
  ["changeScene", "lift"],
  ["compassionBreak", "lift"],

  // Ground (4)
  ["grounding54321V2", "ground"],
  ["reroute", "ground"],
  ["orienting", "ground"],
  ["nameFeeling", "ground"],

  // Focus (3)
  ["nextAction", "focus"],
  ["signalLock", "focus"],
  ["frictionSweep", "focus"],

  // Sleep (4)
  ["tomorrowParking", "sleep"],
  ["nightChannel", "sleep"],
  ["awakeInBedReset", "sleep"],
  ["dropSleepStruggle", "sleep"],
];

export const CORE_25_IDS = Object.freeze(CORE_25_SPECS.map(([id]) => id));
export const ACTIVE_INTERVENTION_IDS = CORE_25_IDS;
export const ACTIVE_INTERVENTION_COUNT = CORE_25_IDS.length;
// Backwards-compatible export for tooling that still uses the historic name.
export const FINAL_50_IDS = CORE_25_IDS;

const DIRECTION_OVERRIDES = {
  "progressive-muscle-relaxation-v2": ["calm", "sleep"],
  urgeSurf: ["calm", "ground", "reset"],
  tinyWin: ["lift", "focus"],
  energyLadder: ["lift", "focus"],
  compassionBreak: ["lift", "calm"],
  valuesStep: ["lift", "focus"],
  grounding54321V2: ["ground", "calm"],
  reroute: ["ground", "lift"],
  orienting: ["ground", "calm"],
  fivePoints: ["ground", "calm"],
  objectFocus: ["ground", "calm"],
  soundMap: ["ground", "calm"],
  nameFeeling: ["ground", "calm", "reset"],
  bodyRadar: ["ground", "calm"],
  rideWave: ["ground", "calm", "reset"],
  nextAction: ["focus", "lift"],
  signalLock: ["focus", "lift"],
  twoMinStart: ["focus", "lift"],
  taskBreakdown: ["focus", "lift"],
  pomodoro: ["focus"],
  implIntention: ["focus", "lift"],
  mobiliseFocus: ["focus", "lift"],
  tomorrowParking: ["sleep", "calm"],
  nightChannel: ["sleep", "calm"],
  windDownBody: ["sleep", "calm"],
  warmHeavy: ["sleep", "calm"],
  sleepDrift: ["sleep", "calm"],
  breathWatch: ["sleep", "calm"],
};

const NAME_OVERRIDES = {
  boxV2: "Box Breathing",
  "progressive-muscle-relaxation-v2": "Progressive Muscle Relaxation",
  grounding54321V2: "5-4-3-2-1 Grounding",
  factCheck: "Thought or Fact?",
  fivePoints: "Five Points of Contact",
  activationMenu: "Ignition Point",
  nextAction: "Next Easiest Step",
  pomodoro: "One Focus Block",
  songMove: "Song and Move",
  sleepDrift: "Slow Drift Breathing",
  warmHeavy: "Warm and Heavy",
};

export function createCore25Catalogue(legacyInterventions = []) {
  const legacyById = new Map(legacyInterventions.map((iv) => [iv.id, iv]));

  const catalogue = CORE_25_SPECS.map(([id, primaryDirection], index) => {
    const source = NEW_INTERVENTIONS[id] || legacyById.get(id);
    if (!source) throw new Error(`[core-25] Missing intervention definition: ${id}`);

    const content = CONTENT_OVERRIDES[id] || {};
    const algorithm = algorithmMetaFor(id) || {};
    const flagship = flagshipMetadataFor(id) || {};
    const directions = algorithm.algorithmDirections || DIRECTION_OVERRIDES[id] || content.directions || source.directions;
    return {
      ...source,
      ...content,
      ...algorithm,
      ...flagship,
      id,
      name: NAME_OVERRIDES[id] || content.name || source.name,
      directions,
      primaryDirection,
      catalogueVersion: CORE_25_CATALOGUE_VERSION,
      catalogueOrder: index + 1,
      catalogueStatus: "curated",
      recommendationEligible: true,
      releaseStatus: "production",
    };
  });

  const ids = new Set(catalogue.map((iv) => iv.id));
  if (catalogue.length !== 25 || ids.size !== 25) {
    throw new Error(`[active-catalogue] Expected 25 unique interventions; received ${catalogue.length}/${ids.size}`);
  }
  return catalogue;
}

// Compatibility alias: older modules and saved migrations use this name.
export const createFinal50Catalogue = createCore25Catalogue;

function overlap(a = [], b = []) {
  const right = new Set(b);
  return a.reduce((total, value) => total + (right.has(value) ? 1 : 0), 0);
}

function legacyMatchScore(legacy, candidate) {
  let score = 0;
  if (legacy.category === candidate.category) score += 12;
  if (legacy.mechanism === candidate.mechanism) score += 18;
  score += overlap(legacy.directions, candidate.directions) * 8;
  score += overlap(legacy.targets, candidate.targets) * 3;
  score += overlap(legacy.states, candidate.states) * 0.5;
  if (!!legacy.bedtime === !!candidate.bedtime) score += 2;
  if (!!legacy.panic === !!candidate.panic) score += 1;
  score -= Math.abs((legacy.durationMin || 3) - (candidate.durationMin || 3)) * 0.25;
  return score;
}

export function createFinal50Resolver(legacyInterventions, finalInterventions) {
  const finalById = new Map(finalInterventions.map((iv) => [iv.id, iv]));
  const finalByName = new Map(finalInterventions.map((iv) => [iv.name, iv]));
  const legacyById = new Map(legacyInterventions.map((iv) => [iv.id, iv]));
  const legacyByName = new Map(legacyInterventions.map((iv) => [iv.name, iv]));
  const inferred = new Map();

  return (key) => {
    if (!key) return undefined;
    if (finalById.has(key)) return key;
    if (finalByName.has(key)) return finalByName.get(key).id;

    const explicit = LEGACY_ID_ALIASES[key];
    if (explicit && finalById.has(explicit)) return explicit;
    if (inferred.has(key)) return inferred.get(key);

    const legacy = legacyById.get(key) || legacyByName.get(key);
    if (!legacy) return undefined;

    const ranked = [...finalInterventions].sort((a, b) => {
      const scoreDifference = legacyMatchScore(legacy, b) - legacyMatchScore(legacy, a);
      return scoreDifference || a.catalogueOrder - b.catalogueOrder;
    });
    const successor = ranked[0]?.id;
    if (successor) inferred.set(key, successor);
    return successor;
  };
}

export function final50Counts(interventions) {
  return interventions.reduce((counts, iv) => {
    counts[iv.primaryDirection] = (counts[iv.primaryDirection] || 0) + 1;
    return counts;
  }, {});
}

export const core25Counts = final50Counts;
