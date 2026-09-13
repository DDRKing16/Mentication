// Mentication Recommendation Engine V3
// Two-stage model:
//   1) hard eligibility (never relaxed)
//   2) transparent 100-point ranking score
//
// Score = 20S + 18I + 15P + 10T + 8D + 8L + 6C + 5E + 4R + 3V + 3N - DP + J

export const V3_WEIGHTS = Object.freeze({
  state: 20,
  intensity: 18,
  personal: 15,
  target: 10,
  direction: 8,
  loadArousal: 8,
  context: 6,
  evidence: 5,
  role: 4,
  diversity: 3,
  novelty: 3,
});

export const EVIDENCE_PRIOR = Object.freeze({
  A: 1,
  "A−": 0.85,
  "A-": 0.85,
  "B+": 0.70,
  B: 0.55,
});

const DAY_MS = 24 * 60 * 60 * 1000;
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const lower = (v) => String(v ?? "").trim().toLowerCase();

export function v3Hash01(str) {
  let h = 2166136261;
  const text = String(str ?? "");
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function interventionDurationSeconds(iv) {
  const sec = (iv?.steps || []).reduce((total, step) => total + (Number(step?.holdSec) || 0), 0);
  return Math.max(1, sec || (Number(iv?.durationMin) || 1) * 60);
}

export function contextKeyV3(answers = {}) {
  const direction = answers.direction || "calm";
  const subtype = answers.subtype || answers.inferredSubtype || answers.whereFelt || "both";
  const intensity = Number.isFinite(Number(answers.intensity)) ? Number(answers.intensity) : 5;
  let band = "0-3";
  if (intensity >= 9) band = "9-10";
  else if (intensity >= 7) band = "7-8";
  else if (intensity >= 4) band = "4-6";
  const where = answers.whereFelt || "both";
  const location = answers.location || "home";
  const mode = answers.majorPreference || answers.preferenceMode || answers.mode || "standard";
  return [direction, subtype, band, where, location, mode].join("|");
}

export function inferProfileV3(answers = {}) {
  const states = new Set();
  const tags = new Set();
  const substates = new Set();
  const dir = answers.direction || "calm";
  const intensity = Number.isFinite(Number(answers.intensity)) ? Number(answers.intensity) : 5;
  const where = answers.whereFelt || "both";

  if (where === "body") {
    tags.add("physical");
    states.add("tense");
  } else if (where === "thoughts") {
    tags.add("cognitive");
    states.add("overthinking");
    states.add("cant_switch_off");
  } else {
    tags.add("physical");
    tags.add("cognitive");
    states.add("overwhelmed");
  }

  if (dir === "calm") {
    states.add("anxious");
    if (intensity >= 8) {
      states.add("panicky");
      tags.add("acute");
      substates.add("acute");
    }
    if (where === "body") substates.add("body_tension");
    if (where === "thoughts") substates.add("racing_thoughts");
    if (where === "both") substates.add("both");
  } else if (dir === "ground") {
    states.add("overwhelmed");
    states.add("overstimulated");
    substates.add("overstimulated");
    if (answers.disconnected) substates.add("disconnected");
    if (where === "both") substates.add("both");
    if (intensity >= 8) {
      states.add("panicky");
      tags.add("acute");
      substates.add("acute");
    }
  } else if (dir === "lift") {
    tags.add("low_mood");
    substates.add("low_mood");
    if (intensity <= 3 || answers.tired || answers.exhausted) {
      tags.add("tired");
      tags.add("low_energy");
      substates.add("low_energy");
      substates.add("tired");
    }
    if (answers.lonely) substates.add("lonely");
  } else if (dir === "focus") {
    states.add("cant_switch_off");
    substates.add("distracted");
    if (intensity >= 6 || answers.overloaded) substates.add("overloaded");
    if (intensity <= 3 || answers.tired) substates.add("tired");
    if (answers.avoiding) substates.add("avoiding");
  } else if (dir === "sleep") {
    states.add("cant_sleep");
    states.add("cant_switch_off");
    const reason = answers.awake_reason;
    if (reason === "racing" || reason === "loop" || where === "thoughts") {
      states.add("overthinking");
      tags.add("ruminating");
      substates.add("racing_thoughts");
    }
    if (reason === "body" || where === "body") {
      states.add("tense");
      substates.add("tense_body");
    }
    if (reason === "screen") {
      states.add("overstimulated");
      substates.add("overstimulated");
    }
    if (reason === "woke" || reason === "woke_up") substates.add("woke_up");
    if (reason === "dread") {
      states.add("worried");
      states.add("anxious");
    }
  } else if (dir === "reset") {
    states.add("overthinking");
    states.add("cant_switch_off");
    states.add("worried");
    tags.add("ruminating");
    substates.add("racing_thoughts");
  }

  [
    "tired", "exhausted", "lonely", "bored", "disconnected", "angry", "reactive",
    "ruminating", "avoiding", "overloaded", "overstimulated", "body_tension",
    "racing_thoughts", "low_mood", "low_energy", "tense_body", "woke_up",
  ].forEach((k) => {
    if (answers[k]) {
      tags.add(k);
      substates.add(k);
    }
  });

  if (answers.subtype) substates.add(answers.subtype);
  return { states, tags, substates };
}

export function hardEligibleV3(iv, answers = {}, profile = inferProfileV3(answers)) {
  if (!iv) return false;
  if (iv.recommendationEligible === false) return false;
  if (iv.automaticEligible === false && answers.automaticOnly) return false;

  const direction = answers.direction;
  const dirs = iv.algorithmDirections || iv.directions || [];
  if (direction && !dirs.includes(direction)) return false;

  const intensity = Number.isFinite(Number(answers.intensity)) ? Number(answers.intensity) : 5;
  if (intensity < Number(iv.intensityMin ?? 0) || intensity > Number(iv.intensityMax ?? 10)) return false;

  const timeMin = Number(answers.timeMin ?? 5);
  if (Number(iv.durationMin ?? 0) > timeMin) return false;
  if (answers.remainingTime != null) {
    const remainingSeconds = Math.max(0, Number(answers.remainingTime) * 60 + 30);
    if (interventionDurationSeconds(iv) > remainingSeconds) return false;
  }

  const needed = asArray(iv.requiredResources);
  const available = asArray(answers.requiredResources);
  if (needed.length && needed.some((r) => !available.includes(r))) return false;

  if ((answers.audio === "no" || answers.audio === "quiet" || answers.noAudio) && iv.audio === "required") return false;
  if ((answers.movement === "seated" || answers.movement === "discreet") && iv.movement === "full") return false;
  if (answers.location === "work" && !iv.performanceSafe) return false;
  if ((answers.location === "work" || answers.location === "public") && iv.environment === "private") return false;
  if (answers.noBreathing && iv.category === "breathing") return false;
  if (answers.eyesOpen && iv.eyes === "closed") return false;
  if (answers.discreet) {
    if (iv.audio === "required") return false;
    if (iv.movement === "full") return false;
    if (iv.environment === "private" && !iv.discreet) return false;
  }

  if (intensity >= 9 && iv.arousal === "raise") return false;

  const activeContra = new Set(asArray(answers.contraindicationTags));
  if (asArray(iv.contraindicationTags).some((tag) => activeContra.has(tag))) return false;

  const activeSubstates = new Set([
    ...profile.substates,
    ...asArray(answers.unsuitableSubstates),
  ]);
  if (asArray(iv.unsuitableSubstates).some((tag) => activeSubstates.has(tag))) return false;

  if (iv.id === "petConnection" && answers.hasPet !== true) return false;
  // Happy Bump can support a gentle calm-down only when movement is welcome
  // and distress is not acute. For focus it is an activation bridge, not a
  // replacement for a concrete task intervention.
  if (iv.id === "happyBump" && direction === "calm" && (intensity > 5 || profile.tags.has("acute"))) return false;
  if (iv.id === "happyBump" && direction === "focus" && !(
    answers.avoiding || answers.low_energy || answers.low_mood || answers.tired || answers.exhausted
  )) return false;
  return true;
}

export function intensityFitV3(iv, intensityInput) {
  const x = Number.isFinite(Number(intensityInput)) ? Number(intensityInput) : 5;
  const eMin = Number(iv.intensityMin ?? 0);
  const eMax = Number(iv.intensityMax ?? 10);
  const pMin = Number(iv.preferredIntensityMin ?? eMin);
  const pMax = Number(iv.preferredIntensityMax ?? eMax);
  if (x < eMin || x > eMax) return 0;
  if (x >= pMin && x <= pMax) return 1;

  if (x < pMin) {
    if (pMin <= eMin) return 1;
    return clamp01(0.35 + 0.65 * ((x - eMin) / (pMin - eMin)));
  }
  if (pMax >= eMax) return 1;
  return clamp01(0.35 + 0.65 * ((eMax - x) / (eMax - pMax)));
}

export function stateFitV3(iv, profile) {
  const exact = new Set(iv.supportedSubstates || []);
  for (const sub of profile.substates) if (exact.has(sub)) return 1;

  const states = asArray(iv.states);
  const hits = states.filter((st) => profile.states.has(st));
  if (hits.length >= 1) return 0.80;
  if (states.includes("any")) return 0.40;

  const targetText = lower(iv.bestWhen);
  if (targetText) {
    for (const tag of [...profile.tags, ...profile.substates]) {
      const readable = String(tag).replaceAll("_", " ");
      if (targetText.includes(readable)) return 0.60;
    }
  }
  if (asArray(iv.directions).length) return 0.15;
  return 0.15;
}

export function targetFitV3(iv, answers = {}) {
  const where = answers.whereFelt || "both";
  const targets = new Set(asArray(iv.targets));
  const algo = lower(iv.algorithmTarget);
  const hasBody = targets.has("body") || targets.has("both") || algo.includes("body") || algo.includes("behaviour") || algo.includes("senses") || algo.includes("emotion");
  const hasThoughts = targets.has("thoughts") || targets.has("both") || algo.includes("thought") || algo.includes("attention") || algo.includes("values") || algo.includes("environment");

  if (where === "both") {
    if (targets.has("both") || (hasBody && hasThoughts)) return 1;
    if (hasBody || hasThoughts) return 0.70;
    return 0.40;
  }
  if (where === "body") {
    if (hasBody) return 1;
    if (hasThoughts) return 0.40;
    return 0;
  }
  if (where === "thoughts") {
    if (hasThoughts) return 1;
    if (hasBody) return 0.40;
    return 0;
  }
  return 0.40;
}

export function directionFitV3(iv, answers = {}) {
  const direction = answers.direction;
  if (!direction) return 0.60;
  const dirs = iv.algorithmDirections || iv.directions || [];
  if (iv.primaryDirection === direction) return 1;
  if (dirs.includes(direction)) return 0.80;
  return 0;
}

function maxCognitiveLoadForIntensity(intensity) {
  if (intensity >= 9) return 1;
  if (intensity >= 7) return 2;
  if (intensity >= 5) return 3;
  return 4;
}

export function loadArousalFitV3(iv, answers = {}) {
  const intensity = Number.isFinite(Number(answers.intensity)) ? Number(answers.intensity) : 5;
  const maxLoad = maxCognitiveLoadForIntensity(intensity);
  const load = Number(iv.cognitiveLoad ?? 2);
  const cognitiveFit = clamp01(1 - 0.45 * Math.max(0, load - maxLoad));

  let arousalFit = 0.75;
  if (intensity >= 9) {
    if (iv.arousal === "raise") return 0;
    arousalFit = iv.arousal === "lower" ? 1 : 0.70;
  } else if ((answers.direction === "lift" || answers.direction === "focus") && intensity <= 4) {
    arousalFit = iv.arousal === "raise" ? 1 : iv.arousal === "steady" ? 0.75 : 0.55;
  } else if (intensity >= 7) {
    arousalFit = iv.arousal === "lower" ? 1 : iv.arousal === "steady" ? 0.75 : 0.35;
  } else {
    arousalFit = iv.arousal === "steady" ? 1 : iv.arousal === "lower" ? 0.85 : 0.75;
  }

  return clamp01(0.70 * cognitiveFit + 0.30 * arousalFit);
}

export function contextFitV3(iv, answers = {}) {
  let sum = 0;
  let n = 0;
  const add = (v) => { sum += clamp01(v); n += 1; };

  if (answers.location) {
    if (answers.location === "work" || answers.location === "public") add(iv.discreet || iv.performanceSafe ? 1 : 0.3);
    else if (answers.location === "outdoors") add(iv.environment === "outdoors" ? 1 : iv.environment === "any" ? 0.75 : 0.4);
    else add(iv.environment === "private" || iv.environment === "any" ? 1 : 0.75);
  }
  if (answers.audio) {
    if (answers.audio === "no") add(iv.audio === "none" ? 1 : iv.audio === "optional" ? 0.85 : 0);
    else if (answers.audio === "quiet") add(iv.audio === "required" ? 0.3 : 0.9);
    else add(iv.audio === "none" ? 0.75 : 1);
  }
  if (answers.movement) {
    if (answers.movement === "yes") add(iv.movement === "full" ? 1 : 0.85);
    else if (answers.movement === "seated") add(iv.movement === "seated" || iv.movement === "none" ? 1 : 0);
    else if (answers.movement === "discreet") add(iv.discreet ? 1 : iv.movement === "none" ? 0.9 : 0.6);
  }
  if (answers.eyesOpen) add(iv.eyes === "open" || iv.eyes === "either" ? 1 : 0);
  if (answers.bedtime || answers.direction === "sleep") add(iv.bedtime ? 1 : 0.55);

  const ctx = lower(iv.algorithmContext);
  if (ctx.includes("work") && answers.location === "work") add(1);
  if (ctx.includes("bedtime") && (answers.bedtime || answers.direction === "sleep")) add(1);
  if (ctx.includes("movement") && answers.movement === "yes") add(1);
  if (ctx.includes("eyes open") && (answers.eyesOpen || iv.eyes === "open")) add(1);

  return n ? clamp01(sum / n) : 0.75;
}

export function evidenceFitV3(iv) {
  return EVIDENCE_PRIOR[iv.evidenceGrade] ?? 0.55;
}

export function roleFitV3(iv, slot = "core") {
  const roles = new Set(asArray(iv.pathwayRoles).map(lower));
  if (!roles.size) return slot === "core" ? 0.60 : 0.30;
  if (slot === "opener") {
    if (roles.has("rescue") || roles.has("opener")) return 1;
    if (roles.has("core")) return 0.60;
    return 0.30;
  }
  if (slot === "closer") {
    if (roles.has("closer")) return 1;
    if (roles.has("core")) return 0.60;
    return 0.30;
  }
  if (roles.has("core")) return 1;
  if (roles.has("opener") || roles.has("closer") || roles.has("rescue")) return 0.60;
  return 0.30;
}

export function diversityFitV3(iv, usedMechanisms = new Set(), usedFamilies = new Set()) {
  if (!usedMechanisms.size && !usedFamilies.size) return 1;
  if (usedMechanisms.has(iv.mechanism)) return 0;
  if (usedFamilies.has(iv.mechanismFamily || iv.category)) return 0.40;
  return 1;
}

export function noveltyFitV3(iv, effectiveness = {}) {
  const recency = Number(effectiveness?.recentMap?.[iv.id] || 0);
  return clamp01(Math.max(0.25, 1 - 0.35 * recency));
}

export function personalFitV3(iv, answers = {}, effectiveness = {}) {
  const ctx = contextKeyV3(answers);
  const contextEff = effectiveness?.contextMap?.[ctx]?.[iv.id];
  if (Number.isFinite(contextEff)) return clamp01(contextEff);
  if (Number.isFinite(effectiveness?.[iv.id])) return clamp01(effectiveness[iv.id]);
  const mechanismEff = effectiveness?.mechanismMap?.[iv.mechanism];
  if (Number.isFinite(mechanismEff)) return clamp01(mechanismEff);
  return 0.50;
}

export function scoreInterventionV3(iv, answers, effectiveness = {}, options = {}) {
  const profile = options.profile || inferProfileV3(answers);
  const slot = options.slot || "core";
  const usedMechanisms = options.usedMechanisms || new Set();
  const usedFamilies = options.usedFamilies || new Set();
  const dislikePenalty = typeof options.dislikePenalty === "function" ? options.dislikePenalty(iv.id, iv.mechanism) : 0;
  const immediate = !!options.immediate;

  if (!hardEligibleV3(iv, answers, profile)) return { score: -Infinity, eligible: false, components: null };

  const components = {
    S: stateFitV3(iv, profile),
    I: intensityFitV3(iv, answers.intensity),
    P: personalFitV3(iv, answers, effectiveness),
    T: targetFitV3(iv, answers),
    D: directionFitV3(iv, answers),
    L: loadArousalFitV3(iv, answers),
    C: contextFitV3(iv, answers),
    E: evidenceFitV3(iv),
    R: roleFitV3(iv, slot),
    V: diversityFitV3(iv, usedMechanisms, usedFamilies),
    N: immediate ? 0 : noveltyFitV3(iv, effectiveness),
  };

  const seed = options.seed || `${answers.direction}|${answers.whereFelt}|${answers.intensity}|${answers.location || "home"}|${slot}`;
  const J = (v3Hash01(`${iv.id}|${seed}`) - 0.5) * 0.2; // ±0.10
  const DP = Math.max(0, Math.min(20, Number(dislikePenalty) || 0));

  const score =
    V3_WEIGHTS.state * components.S +
    V3_WEIGHTS.intensity * components.I +
    V3_WEIGHTS.personal * components.P +
    V3_WEIGHTS.target * components.T +
    V3_WEIGHTS.direction * components.D +
    V3_WEIGHTS.loadArousal * components.L +
    V3_WEIGHTS.context * components.C +
    V3_WEIGHTS.evidence * components.E +
    V3_WEIGHTS.role * components.R +
    V3_WEIGHTS.diversity * components.V +
    V3_WEIGHTS.novelty * components.N -
    DP + J;

  return { score, eligible: true, components, DP, J };
}

function rewardForResponse(response) {
  const r = lower(response);
  if (r === "better") return 1;
  if (r === "same" || r === "neutral") return 0.45;
  if (r === "worse" || r === "bad") return 0;
  return null;
}

function timestampForAttempt(attempt, session) {
  return attempt?.ended_at || attempt?.endedAt || attempt?.started_at || attempt?.startedAt || session?.created_date || session?.createdAt || null;
}

function recencyWeight45Days(dateLike, nowMs) {
  const t = new Date(dateLike || 0).getTime();
  if (!Number.isFinite(t) || t <= 0) return 0.35; // old/legacy attempt with unknown timestamp: weak evidence
  const days = Math.max(0, (nowMs - t) / DAY_MS);
  return Math.exp(-Math.log(2) * days / 45);
}

function completionConfidence(value) {
  const p = clamp01(value == null ? 1 : value);
  return 0.25 + 0.75 * p;
}

export function computeEffectivenessV3(sessions = [], helpers = {}) {
  const resolveId = helpers.resolveId || ((x) => x);
  const getIntervention = helpers.getIntervention || (() => null);
  const contextKeyFor = helpers.contextKeyFor || contextKeyV3;
  const nowMs = helpers.nowMs || Date.now();

  const mechanismSamples = new Map();
  const interventionSamples = new Map();
  const contextSamples = new Map();
  const usageCount = {};
  const categoryUsage = {};
  const recentMap = {};
  let totalUses = 0;

  const addSample = (map, key, reward, weight) => {
    if (!key || reward == null || weight <= 0) return;
    if (!map.has(key)) map.set(key, { wr: 0, w: 0 });
    const x = map.get(key);
    x.wr += weight * reward;
    x.w += weight;
  };

  // Novelty/recency: session-index decay, exactly as specified: Σ 0.5^sessionIndex.
  [...sessions]
    .sort((a, b) => new Date(b.created_date || b.createdAt || 0) - new Date(a.created_date || a.createdAt || 0))
    .slice(0, 12)
    .forEach((session, sessionIndex) => {
      const decay = Math.pow(0.5, sessionIndex);
      const ids = [
        ...(session.attempts || []).map((a) => a.intervention_id),
        ...(session.completed_pathway || []),
        ...(session.pathway || []),
      ];
      const unique = [...new Set(ids.map(resolveId).filter(Boolean))];
      unique.forEach((id) => { recentMap[id] = (recentMap[id] || 0) + decay; });
    });

  sessions.forEach((session) => {
    const fallbackContext = session.context_snapshot ? contextKeyFor(session.context_snapshot) : null;
    const usageIds = [
      ...(session.attempts || []).map((a) => a.intervention_id),
      ...(session.completed_pathway || []),
      ...(session.pathway || []),
    ].map(resolveId).filter(Boolean);
    [...new Set(usageIds)].forEach((id) => {
      usageCount[id] = (usageCount[id] || 0) + 1;
      totalUses += 1;
      const iv = getIntervention(id);
      if (iv?.category) categoryUsage[iv.category] = (categoryUsage[iv.category] || 0) + 1;
    });

    (session.attempts || []).forEach((attempt) => {
      const response = lower(attempt?.response);
      if (!response || response === "not_answered") return; // unanswered is not neutral evidence
      const reward = rewardForResponse(response);
      if (reward == null) return;
      const id = resolveId(attempt?.intervention_id);
      if (!id) return;
      const iv = getIntervention(id);
      const mechanism = attempt?.mechanism || iv?.mechanism;
      const contextKey = attempt?.context_key || fallbackContext;
      const timeWeight = recencyWeight45Days(timestampForAttempt(attempt, session), nowMs);
      const confidence = completionConfidence(attempt?.completed_percentage);
      const weight = timeWeight * confidence;

      addSample(interventionSamples, id, reward, weight);
      addSample(mechanismSamples, mechanism, reward, weight);
      if (contextKey) addSample(contextSamples, `${contextKey}::${id}`, reward, weight);
    });
  });

  const mechanismMap = {};
  for (const [mechanism, sample] of mechanismSamples.entries()) {
    mechanismMap[mechanism] = (6 * 0.5 + sample.wr) / (6 + sample.w);
  }

  const eff = {};
  const knownIds = new Set([...Object.keys(usageCount), ...[...interventionSamples.keys()]]);
  for (const id of knownIds) {
    const iv = getIntervention(id);
    const mechPrior = mechanismMap[iv?.mechanism] ?? 0.5;
    const sample = interventionSamples.get(id) || { wr: 0, w: 0 };
    eff[id] = clamp01((4 * mechPrior + sample.wr) / (4 + sample.w));
  }

  const contextMap = {};
  for (const [key, sample] of contextSamples.entries()) {
    const split = key.lastIndexOf("::");
    const contextKey = key.slice(0, split);
    const id = key.slice(split + 2);
    if (!contextMap[contextKey]) contextMap[contextKey] = {};
    const globalPrior = Number.isFinite(eff[id]) ? eff[id] : 0.5;
    contextMap[contextKey][id] = clamp01((3 * globalPrior + sample.wr) / (3 + sample.w));
  }

  eff.contextMap = contextMap;
  eff.mechanismMap = mechanismMap;
  eff.recentMap = recentMap;
  eff.usageCount = usageCount;
  eff.categoryUsage = categoryUsage;
  eff.totalUses = totalUses;
  eff.engineVersion = "3.0.0";
  return eff;
}

export function immediateEligibleV3(iv, answers = {}, profile = inferProfileV3(answers)) {
  if (!hardEligibleV3(iv, answers, profile)) return false;
  if (Number(iv.cognitiveLoad ?? 2) > 2) return false;
  const roles = new Set(asArray(iv.pathwayRoles).map(lower));
  if (!(roles.has("rescue") || roles.has("opener"))) return false;
  if (!["lower", "steady"].includes(iv.arousal)) return false;
  if (Number(iv.durationMin ?? 99) > 3) return false;
  if (["temperature-shock", "breath-hold", "paced-hold"].includes(iv.mechanism)) return false;
  if ((iv.mechanismFamily || iv.category) === "cognitive") return false;
  return true;
}
