// Canonical metadata for the expanded flagship collection. This registry is
// deliberately data-only: recommendation, hand-off and presentation layers can
// consume the same clinical distinctions without duplicating them.

export const FLAGSHIP_CATALOGUE_VERSION = "2026-09-14-v1-core26";

const meta = (definition) => Object.freeze({
  secondaryGoals: [],
  eligibleIntensity: [0, 10],
  preferredIntensity: [3, 7],
  cognitiveLoad: 2,
  arousalDirection: "steady",
  pathwayRole: ["core"],
  contextRequirements: [],
  contraindications: [],
  completionModel: "adaptive-reflection",
  eligibleHandoffs: [],
  ...definition,
  experienceTier: "flagship",
  flagship: true,
});

export const FLAGSHIP_REGISTRY = Object.freeze({
  boxV2: meta({
    id: "boxV2", displayName: "Box Breathing", primaryGoal: "calm", secondaryGoals: ["focus"],
    primaryMechanism: "physiological pacing and attentional control", targetState: "elevated physiological activation with scattered attention",
    bestWhen: "A steady external rhythm would help organise breath and attention", preferredIntensity: [4, 8], cognitiveLoad: 1,
    arousalDirection: "lower", pathwayRole: ["opener", "core"], contextRequirements: ["comfortable unforced breathing"],
    contraindications: ["breath holds feel distressing", "dizziness or respiratory discomfort"], interactionSignature: "responsive geometric breathing field",
    completionModel: "brief physiological comparison",
  }),
  factCheck: meta({
    id: "factCheck", displayName: "Thought or Fact", primaryGoal: "calm", secondaryGoals: ["focus", "reset"],
    primaryMechanism: "cognitive sorting and reality clarification", targetState: "distressing interpretations treated as certain facts",
    bestWhen: "The person can reflect and a thought can be separated into fact, interpretation or prediction", eligibleIntensity: [2, 7],
    preferredIntensity: [3, 6], cognitiveLoad: 3, interactionSignature: "visual sorting and evidence separation",
    completionModel: "final classification and balanced wording", eligibleHandoffs: ["testPrediction", "thenWhat"],
  }),
  "progressive-muscle-relaxation-v2": meta({
    id: "progressive-muscle-relaxation-v2", displayName: "Progressive Muscle Relaxation", primaryGoal: "calm", secondaryGoals: ["sleep"],
    primaryMechanism: "muscular tension and release", targetState: "whole-body muscular tension and stress arousal",
    bestWhen: "Physical tension is prominent and a private seated or lying position is available", eligibleIntensity: [4, 10],
    preferredIntensity: [6, 9], cognitiveLoad: 1, arousalDirection: "lower", pathwayRole: ["core", "closer"],
    contextRequirements: ["private space", "capacity to tense safely"], contraindications: ["acute injury or painful muscle group"],
    interactionSignature: "illuminated interactive body map", completionModel: "tension and release comparison",
  }),
  urgeSurf: meta({
    id: "urgeSurf", displayName: "Urge Surfing", primaryGoal: "calm", secondaryGoals: ["ground", "reset"],
    primaryMechanism: "tolerating urges without impulsive action", targetState: "a strong urge that can be observed safely",
    bestWhen: "The urge is intense but immediate safety action is not required", eligibleIntensity: [3, 9], preferredIntensity: [5, 8],
    cognitiveLoad: 2, arousalDirection: "lower", interactionSignature: "living wave that rises, changes and passes",
    completionModel: "urge change and what prevented impulsive action", eligibleHandoffs: ["changeScene"],
  }),
  thenWhat: meta({
    id: "thenWhat", displayName: "Then What?", primaryGoal: "calm", secondaryGoals: ["focus"],
    primaryMechanism: "decatastrophising through coping appraisal and temporal continuation", targetState: "a feared future frozen at its worst frame",
    bestWhen: "A catastrophe can be explored without acute panic, danger, trauma re-experiencing or reassurance looping", eligibleIntensity: [2, 7],
    preferredIntensity: [3, 6], cognitiveLoad: 4, interactionSignature: "frozen catastrophic frame expanding into a longer timeline",
    completionModel: "coping map and present-action decision", contraindications: ["immediate danger", "acute panic", "trauma re-experiencing", "impaired reality testing"],
    eligibleHandoffs: ["nextAction", "grounding54321V2", "urgeSurf"],
  }),
  activationMenu: meta({
    id: "activationMenu", displayName: "Ignition Point", primaryGoal: "lift", secondaryGoals: ["focus"],
    primaryMechanism: "personally meaningful reward, mastery, connection and future-directed activation", targetState: "low reward expectancy and reduced motivation",
    bestWhen: "The person needs one worthwhile action rather than more pressure", eligibleIntensity: [1, 7], preferredIntensity: [2, 5],
    cognitiveLoad: 2, arousalDirection: "raise", interactionSignature: "personalised field of meaningful activation possibilities",
    completionModel: "whether the selected action felt worthwhile",
  }),
  happyBump: meta({
    id: "happyBump", displayName: "The Happy Bump", primaryGoal: "lift", secondaryGoals: ["calm", "focus"],
    primaryMechanism: "stacked behavioural activation", targetState: "low energy, low mood or inertia where a gentle sequence can build momentum",
    bestWhen: "A safe, capacity-matched lift through movement, hydration, connection and one small action would be useful", eligibleIntensity: [0, 7],
    preferredIntensity: [1, 5], cognitiveLoad: 1, physicalDemand: 2, arousalDirection: "raise", pathwayRole: ["opener", "core"],
    contextRequirements: ["safe movement route"], contraindications: ["acute panic", "dizziness", "significant pain", "physical instability"],
    interactionSignature: "a cumulative curve that makes each small input visible", completionModel: "before-and-after energy rating with a saved combination",
  }),
  changeScene: meta({
    id: "changeScene", displayName: "Change the Scene", primaryGoal: "lift", secondaryGoals: ["ground"],
    primaryMechanism: "environmental interruption and state change", targetState: "environmentally reinforced flatness or inertia",
    bestWhen: "A safe, realistic change of position or place is available", eligibleIntensity: [0, 7], preferredIntensity: [1, 6],
    cognitiveLoad: 1, arousalDirection: "raise", pathwayRole: ["opener", "core"], interactionSignature: "cinematic environmental transition",
    completionModel: "whether the environmental shift altered available behaviour",
  }),
  testPrediction: meta({
    id: "testPrediction", displayName: "Test the Prediction", primaryGoal: "lift", secondaryGoals: ["calm"],
    primaryMechanism: "real-world behavioural experiment", targetState: "avoidance maintained by a safely testable negative prediction",
    bestWhen: "Distress is lower and a small, ethical, observable test can be designed", eligibleIntensity: [1, 6], preferredIntensity: [2, 5],
    cognitiveLoad: 4, interactionSignature: "prediction-versus-observation experiment", completionModel: "predicted outcome versus observed outcome",
    contraindications: ["unsafe exposure", "medical, legal or interpersonal risk"], eligibleHandoffs: ["factCheck"],
  }),
  countermove: meta({
    id: "countermove", displayName: "Countermove", primaryGoal: "lift", secondaryGoals: ["focus"],
    primaryMechanism: "behavioural activation, functional assessment and graded opposite action", targetState: "withdrawal or emotion-driven avoidance",
    bestWhen: "The directional pull is avoidant rather than protective or genuinely restorative", eligibleIntensity: [1, 7], preferredIntensity: [2, 6],
    cognitiveLoad: 3, arousalDirection: "raise", interactionSignature: "trajectory bending against gravity", completionModel: "whether behaviour changed direction",
    contraindications: ["genuine danger", "deliberate recovery need"], eligibleHandoffs: ["openChannel", "pulseShift", "nextAction"],
  }),
  openChannel: meta({
    id: "openChannel", displayName: "Open Channel", primaryGoal: "lift", secondaryGoals: ["calm"],
    primaryMechanism: "relational re-entry after withdrawal, silence, cancellation or disconnection", targetState: "safe connection disrupted by withdrawal",
    bestWhen: "A safe relationship can be deliberately reopened or a non-contact relational step is appropriate", eligibleIntensity: [1, 7], preferredIntensity: [2, 5],
    cognitiveLoad: 3, interactionSignature: "bridge forming across fractured relational space", completionModel: "deliberate relational decision",
    contraindications: ["abuse or coercion", "unsafe former partner", "no-contact request", "contact could escalate risk"],
  }),
  pulseShift: meta({
    id: "pulseShift", displayName: "Pulse Shift", primaryGoal: "lift", secondaryGoals: ["focus"],
    primaryMechanism: "graded physical and psychomotor activation", targetState: "flatness, heaviness, fogginess or physical inertia",
    bestWhen: "Under-arousal is present and accessible movement is safe", eligibleIntensity: [0, 6], preferredIntensity: [1, 5],
    cognitiveLoad: 1, arousalDirection: "raise", pathwayRole: ["opener", "core"], contextRequirements: ["capacity-matched movement"],
    contraindications: ["acute panic", "dizziness", "significant pain", "medical symptoms", "physical instability", "genuine rest need"],
    interactionSignature: "static energy becoming directed movement", completionModel: "whether additional movement became available",
    eligibleHandoffs: ["countermove", "nextAction"],
  }),
  grounding54321V2: meta({
    id: "grounding54321V2", displayName: "5-4-3-2-1 Grounding", primaryGoal: "ground", secondaryGoals: ["calm"],
    primaryMechanism: "multisensory present-moment orientation", targetState: "overwhelm, disconnection or sensory narrowing",
    bestWhen: "Eyes-open contact with the immediate environment is useful", eligibleIntensity: [4, 10], preferredIntensity: [7, 10],
    cognitiveLoad: 1, arousalDirection: "lower", pathwayRole: ["rescue", "opener"], contextRequirements: ["eyes-open environment"],
    interactionSignature: "sensory world progressively rebuilding", completionModel: "degree of reconnection with the immediate environment", eligibleHandoffs: ["vectorShift"],
  }),
  vectorShift: meta({
    id: "vectorShift", displayName: "Vector Shift", primaryGoal: "ground", secondaryGoals: ["calm"],
    primaryMechanism: "precision-grounding through attention, visual tracking and reassuring reframing", targetState: "feeling detached, unsettled or overloaded when active external focus is usable",
    bestWhen: "Immediate danger is absent and a structured, game-like grounding protocol would help restore presence", eligibleIntensity: [3, 8], preferredIntensity: [5, 8],
    cognitiveLoad: 2, arousalDirection: "steady", pathwayRole: ["rescue", "opener"], contextRequirements: ["screen interaction"],
    contraindications: ["immediate danger", "urgent practical action", "unable to use a screen safely"], interactionSignature: "four precision challenges resolving into a stabilisation readout",
    completionModel: "completion of the grounding protocol and selected stability signal", eligibleHandoffs: [],
  }),
  nextAction: meta({
    id: "nextAction", displayName: "Next Easiest Step", primaryGoal: "focus", secondaryGoals: ["lift"],
    primaryMechanism: "executive-friction reduction and action initiation", targetState: "focus difficulty caused by an unclear or over-large entry action",
    bestWhen: "One observable action would be more useful than a general plan", eligibleIntensity: [1, 8], preferredIntensity: [2, 6],
    cognitiveLoad: 2, arousalDirection: "steady", pathwayRole: ["opener"], interactionSignature: "complexity compressing into one executable action",
    completionModel: "selected action and completion", eligibleHandoffs: ["activationMenu", "signalLock"],
  }),
  signalLock: meta({
    id: "signalLock", displayName: "Signal Lock", primaryGoal: "focus", secondaryGoals: ["lift"],
    primaryMechanism: "task scaffolding, distraction containment and a timed focus sprint", targetState: "a chosen task that needs rapid clarification and bounded execution",
    bestWhen: "The user has a task and time pressure is motivating rather than destabilising", eligibleIntensity: [0, 7], preferredIntensity: [1, 5],
    cognitiveLoad: 3, arousalDirection: "raise", pathwayRole: ["core"], contextRequirements: ["safe startable task", "available sprint time"],
    contraindications: ["time pressure worsens distress", "urgent safety issue"], interactionSignature: "radar field closing onto one lockable target",
    completionModel: "sprint outcome and time-estimation calibration", eligibleHandoffs: ["nextAction"],
  }),
  tomorrowParking: meta({
    id: "tomorrowParking", displayName: "Tomorrow Parking Lot", primaryGoal: "sleep", secondaryGoals: ["calm"],
    primaryMechanism: "cognitive offloading before sleep", targetState: "unfinished responsibilities being mentally rehearsed at bedtime",
    bestWhen: "One unfinished thought can be stored outside the night", eligibleIntensity: [1, 8], preferredIntensity: [3, 7],
    cognitiveLoad: 1, arousalDirection: "lower", pathwayRole: ["opener", "closer"], contextRequirements: ["bedtime"],
    interactionSignature: "thoughts placed outside the night space", completionModel: "confirmation only", eligibleHandoffs: ["nextAction", "nightChannel"],
  }),
  nightChannel: meta({
    id: "nightChannel", displayName: "Night Channel", primaryGoal: "sleep", secondaryGoals: ["calm"],
    primaryMechanism: "low-effort attentional capture using selected narrative audio", targetState: "bedtime rumination that needs an interesting low-pressure destination",
    bestWhen: "The user wants audio to drift into without completing a mental exercise", eligibleIntensity: [1, 8], preferredIntensity: [3, 7],
    cognitiveLoad: 1, arousalDirection: "lower", pathwayRole: ["closer"], contextRequirements: ["bedtime", "optional audio"],
    contraindications: ["audio is unwanted", "content could be distressing"], interactionSignature: "distant broadcast channels fading into near-black",
    completionModel: "no night completion; optional daytime feedback", eligibleHandoffs: [],
  }),
});

export const FLAGSHIP_IDS = Object.freeze(Object.keys(FLAGSHIP_REGISTRY));
export const flagshipMetadataFor = (id) => FLAGSHIP_REGISTRY[id] || null;
export const isFlagship = (id) => FLAGSHIP_IDS.includes(id);
