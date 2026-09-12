import { flagshipMetadataFor } from "./flagshipRegistry";

const PURPOSE_LABELS = {
  calm: "Downshift gently",
  ground: "Reconnect to now",
  reset: "Unhook the spiral",
  focus: "Create traction",
  lift: "Create momentum",
  sleep: "Loosen into rest",
};

const CATEGORY_PHASES = {
  breathing: { start: "arrive", middle: "follow the rhythm", end: "let it settle" },
  grounding: { start: "orient", middle: "notice what is real", end: "return to the room" },
  somatic: { start: "arrive in the body", middle: "soften and release", end: "let the body land" },
  cognitive: { start: "slow the story", middle: "separate and sort", end: "keep the useful truth" },
  focus: { start: "narrow the target", middle: "keep the lane clear", end: "carry the traction forward" },
  lift: { start: "create a spark", middle: "build a little movement", end: "carry the shift outward" },
  connection: { start: "open the line", middle: "choose the bridge", end: "keep the contact deliberate" },
  sleep: { start: "dim the edges", middle: "drift with less effort", end: "leave the night quiet" },
  emotion: { start: "name what is here", middle: "stay with the wave", end: "let it pass through" },
};

const CATEGORY_GUIDANCE = {
  breathing: "Comfort matters more than precision. Let the breath be guided, not forced.",
  grounding: "Use simple sensory facts. You do not need to feel calm for this to work.",
  somatic: "Look for a few percent more softness, not a perfect release.",
  cognitive: "You are not trying to think positively — only to think more clearly.",
  focus: "Aim for visible traction. Smaller and more concrete is usually better.",
  lift: "Tiny movement counts. The goal is more availability, not instant motivation.",
  connection: "Deliberate contact counts even if the other person's response is unknown.",
  sleep: "Nothing has to be finished here. Let the practice become less effortful as it goes.",
  emotion: "The feeling can stay while your relationship to it becomes steadier.",
};

const MECHANISM_GUIDANCE = [
  ["exhale-lengthening", "Let the out-breath be easy and slightly longer than the in-breath."],
  ["paced-hold", "Keep the shape steady. If breath holds feel straining, ease off immediately."],
  ["paced-equal", "Aim for an even, unhurried rhythm that feels sustainable."],
  ["nostril-alternate", "Stay gentle and coordinated; there is no prize for doing it fast."],
  ["hum-resonance", "Feel the sound more than you analyse it — vibration is the anchor."],
  ["cognitive-decentring", "Name what is known, what is added, and what action is actually available."],
  ["evidence-review", "Keep returning to observable evidence instead of the strongest feeling."],
  ["behavioural-activation-choice", "Choose something that feels doable and worth doing, even on a low-capacity day."],
  ["executive-friction-reduction", "If the action still feels fuzzy, shrink it again until it is visible."],
  ["cognitive-offloading", "The point is to store it somewhere trustworthy so your mind can stop holding it."],
];

function phaseLabelFor(iv, stepIndex = 0, totalSteps = 1) {
  const phase = CATEGORY_PHASES[iv?.category] || CATEGORY_PHASES.emotion;
  if (stepIndex <= 0) return phase.start;
  if (stepIndex >= totalSteps - 1) return phase.end;
  return phase.middle;
}

function mechanismGuidanceFor(iv) {
  return MECHANISM_GUIDANCE.find(([mechanism]) => mechanism === iv?.mechanism)?.[1] || null;
}

function durationLabelFor(iv) {
  const declared = Number(iv?.durationMin);
  if (Number.isFinite(declared) && declared > 0) return `~${declared} min`;
  const totalSec = (iv?.steps || []).reduce((sum, current) => sum + (Number(current?.holdSec) || 0), 0);
  if (!totalSec) return null;
  return `~${Math.max(1, Math.round(totalSec / 60))} min`;
}

export function getInterventionAtmosphere(iv, direction) {
  const meta = flagshipMetadataFor(iv?.id);
  return {
    purpose: PURPOSE_LABELS[direction || meta?.primaryGoal || iv?.directions?.[0]] || "Find a little more room",
    signature: meta?.interactionSignature || `${iv?.category || "guided"} practice`,
    bestWhen: meta?.bestWhen || "Use this in a way that feels safe, tolerable, and real for your situation.",
    why: iv?.why || meta?.primaryMechanism || "A short guided intervention to shift your state with less effort.",
    duration: durationLabelFor(iv),
  };
}

export function getInterventionMoment(iv, step, stepIndex = 0) {
  const totalSteps = iv?.steps?.length || 1;
  const title = String(step?.title || "").toLowerCase();
  const phase = phaseLabelFor(iv, stepIndex, totalSteps);
  const guide = step?.body || mechanismGuidanceFor(iv) || CATEGORY_GUIDANCE[iv?.category] || CATEGORY_GUIDANCE.emotion;
  let cue = mechanismGuidanceFor(iv) || CATEGORY_GUIDANCE[iv?.category] || CATEGORY_GUIDANCE.emotion;
  if (title.includes("rest") || title.includes("settle") || title.includes("pause")) {
    cue = "Let this part be quieter. Notice any small change without chasing a bigger one.";
  } else if (title.includes("again") || title.includes("continue") || title.includes("stay")) {
    cue = "Repeat the same shape without performing it. Consistency matters more than intensity.";
  } else if (title.includes("begin") || title.includes("find") || title.includes("choose")) {
    cue = "Take a beat to arrive before moving. Starting slower often makes the rest of the intervention land better.";
  }
  return { phase, guide, cue };
}

const REFLECTION_COPY = {
  boxV2: {
    checkpoint: "Did the steady square give your breathing or attention something reliable to lock onto?",
    reflect: "What felt most useful: the pace, the visual anchor, or simply staying with one steady pattern?",
    done: "You gave your system one stable pattern to return to.",
  },
  sigh: {
    checkpoint: "Did the longer exhale create even a little more room in your chest, jaw, or pace?",
    reflect: "What landed most: the sigh itself, the softer exhale, or the brief pause afterwards?",
    done: "You gave your nervous system a clearer off-ramp.",
  },
  "progressive-muscle-relaxation-v2": {
    checkpoint: "What released most clearly in your body, and what still feels like it is asking for care?",
    reflect: "If one body area softened more than the rest, where was it?",
    done: "You helped your body tell the difference between bracing and release.",
  },
  grounding54321V2: {
    checkpoint: "Did the room come back into focus any more clearly after orienting through your senses?",
    reflect: "Which sense helped the world feel most real again?",
    done: "You gave your attention something real to land on.",
  },
  urgeSurf: {
    checkpoint: "Did the wave change, or did you at least gain a little more room to choose?",
    reflect: "What mattered most: naming the urge, riding the timer, or keeping the choice window open?",
    done: "You created space between the urge and the action.",
  },
  signalLock: {
    checkpoint: "Did the lock make the target feel more startable or less noisy?",
    reflect: "What helped most: sharpening the target, clearing the perimeter, or the sprint itself?",
    done: "You turned a vague task into a visible lane.",
  },
  nightChannel: {
    checkpoint: "Did the audio give your mind somewhere easier to rest than rumination?",
    reflect: "What kind of channel felt easiest to drift with tonight?",
    done: "You gave bedtime attention a gentler place to go.",
  },
};

const CATEGORY_REFLECTION = {
  breathing: {
    checkpoint: "Did the rhythm change anything in your body, even slightly?",
    reflect: "What felt most useful: the pace, the exhale, or the moment after the breath?",
    done: "You gave your breathing a steadier pattern to follow.",
  },
  grounding: {
    checkpoint: "Do you feel any more connected to the room or the present moment now?",
    reflect: "Which sensory anchor felt most believable or usable?",
    done: "You helped attention land on something real and present.",
  },
  somatic: {
    checkpoint: "Did any part of your body soften, release, or become easier to notice?",
    reflect: "Where did you notice the clearest change in tension or ease?",
    done: "You gave your body permission to come down a notch.",
  },
  cognitive: {
    checkpoint: "Does the thought feel any less fused, absolute, or urgent now?",
    reflect: "What helped most: naming it, sorting it, or finding the next useful truth?",
    done: "You created a little more space between the thought and the truth.",
  },
  focus: {
    checkpoint: "Does the next move feel any clearer or more startable now?",
    reflect: "What helped most: shrinking the task, clarifying the first move, or removing friction?",
    done: "You made the next step more visible and usable.",
  },
  lift: {
    checkpoint: "Do you have any more movement, energy, or willingness available now?",
    reflect: "What helped most: choosing a direction, building movement, or making the action smaller?",
    done: "You created a little more forward motion to work with.",
  },
  connection: {
    checkpoint: "Does connection feel any more possible, deliberate, or safe now?",
    reflect: "What helped most: naming the distance, choosing the bridge, or deciding deliberately?",
    done: "You made connection a choice again instead of a fog.",
  },
  sleep: {
    checkpoint: "Does the night feel any quieter, softer, or less effortful now?",
    reflect: "What helped most: parking the thought, the slower pace, or giving attention somewhere gentler to rest?",
    done: "You made the night a little less effortful.",
  },
  emotion: {
    checkpoint: "Did this create any more steadiness, choice, or breathing room?",
    reflect: "What part of the practice landed most honestly for you?",
    done: "You stayed with what was here and made a little more room around it.",
  },
};

export function getInterventionReflection(iv) {
  return REFLECTION_COPY[iv?.id] || CATEGORY_REFLECTION[iv?.category] || CATEGORY_REFLECTION.emotion;
}
