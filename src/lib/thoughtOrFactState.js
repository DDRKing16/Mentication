const cleanText = (value) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const normaliseEntries = (entries) => (Array.isArray(entries) ? entries : [])
  .map(cleanText)
  .filter(Boolean);

export function buildThoughtOrFactLearningRecord({ assignments = {}, certaintyBefore, certaintyAfter, repeatMode, saved } = {}) {
  const classifications = Object.values(assignments);
  const classification = classifications[0] || "unclear";
  const hasBefore = Number.isInteger(certaintyBefore) && certaintyBefore >= 0 && certaintyBefore <= 10;
  const hasAfter = Number.isInteger(certaintyAfter) && certaintyAfter >= 0 && certaintyAfter <= 10;
  return {
    classification,
    certaintyShift: hasBefore && hasAfter ? certaintyAfter - certaintyBefore : null,
    repeatMode: ["quick", "full", "deep"].includes(repeatMode) ? repeatMode : "full",
    usedSavedCopy: saved === true,
  };
}

const LANGUAGE_SIGNALS = [
  { id: "mind-reading", patterns: [/\b(they think|she thinks|he thinks|everyone thinks|nobody likes me)\b/gi] },
  { id: "jumping-to-conclusions", patterns: [/\b(they think|she thinks|he thinks|everyone thinks|nobody likes me|they will|she will|he will|obviously|definitely|must mean)\b/gi] },
  { id: "overgeneralising", patterns: [/\ball people\b/gi, /\b(everyone|everybody|nobody|no one|always|never)\b/gi] },
  { id: "catastrophising", patterns: [/\b(worst|ruined|disaster|catastrophe|unbearable)\b/gi] },
  { id: "all-or-nothing", patterns: [/\b(always|never|completely|total|failure|perfect)\b/gi] },
  { id: "emotional-reasoning", patterns: [/\b(i feel|i hate|i am angry|i'm angry|i'm anxious|i am anxious)\b/gi] },
  { id: "mental-filter", patterns: [/\b(only|nothing good|all i can see|just the bad)\b/gi] },
  { id: "discounting-positives", patterns: [/\b(does not count|doesn't count|do not count|doesn't matter|does not matter)\b/gi] },
  { id: "labelling", patterns: [/\b(i am a |i'm a |loser|failure|worthless|stupid)\b/gi] },
  { id: "personalising", patterns: [/\b(all my fault|my fault|because of me|i caused)\b/gi] },
  { id: "should-statements", patterns: [/\b(should|must|have to)\b/gi] },
  { id: "magnifying-minimising", patterns: [/\b(huge|tiny|awful|terrible|the end of the world)\b/gi] },
];

export function findThinkingTrapLanguage(statement = "") {
  const text = cleanText(statement).toLowerCase();
  return LANGUAGE_SIGNALS.map(({ id, patterns }) => ({
    id,
    phrases: [...new Set(patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => match[0].trim())))],
  })).filter(({ phrases }) => phrases.length);
}

export function suggestThinkingTraps(statement = "") {
  return findThinkingTrapLanguage(statement).map(({ id }) => id);
}

export function buildBalancedThought({ thought = "", distortions = [], evidenceAgainst = [], alternatives = [] } = {}) {
  const text = cleanText(thought).replace(/[.!?]+$/, "");
  const active = distortions.length ? distortions : suggestThinkingTraps(text);
  const hateFocus = text.match(/\bi hate\s+(.+?)(?:\s+because\b|\s+and\b|$)/i)?.[1]?.replace(/^all\s+/i, "");
  const opening = hateFocus
    ? `I’m feeling fed up with ${hateFocus} right now.`
    : `I’m noticing the thought that ${text}.`;
  const perspective = active.includes("emotional-reasoning") && active.includes("overgeneralising")
    ? "That feeling is real, but it does not prove every person is the same."
    : active.includes("overgeneralising")
      ? "One painful experience does not tell me what every person or every future moment will be like."
      : active.includes("mind-reading") || active.includes("jumping-to-conclusions")
        ? "I cannot know what other people think without clearer evidence."
        : active.includes("catastrophising")
          ? "A difficult possibility is not proof that the worst outcome will happen."
          : active.includes("all-or-nothing")
            ? "This is not a choice between total failure and total success."
            : "This thought matters, and it may not be the whole picture.";
  const exception = evidenceAgainst[0]
    ? `“${cleanText(evidenceAgainst[0])}” is an exception worth holding alongside it.`
    : alternatives[0]
      ? `Another possibility is: ${cleanText(alternatives[0])}.`
      : "I can leave room for exceptions and information I do not have yet.";
  return [opening, perspective, exception].join(" ");
}

export function normaliseThoughtOrFactDraft(draft = {}) {
  const fragments = (Array.isArray(draft.fragments) ? draft.fragments : [])
    .map((fragment) => ({ ...fragment, id: cleanText(fragment?.id), text: cleanText(fragment?.text) }))
    .filter((fragment) => fragment.id && fragment.text);
  const validIds = new Set(fragments.map((fragment) => fragment.id));
  const assignments = Object.fromEntries(Object.entries(draft.assignments || {})
    .filter(([id, category]) => validIds.has(id) && ["fact", "interpretation", "prediction", "catastrophe", "feeling", "open"].includes(category)));

  return {
    ...draft,
    thought: cleanText(draft.thought),
    fragments,
    assignments,
    fairerView: {
      adaptive: cleanText(draft.fairerView?.adaptive),
      known: cleanText(draft.fairerView?.known),
      against: cleanText(draft.fairerView?.against),
      added: cleanText(draft.fairerView?.added),
      open: cleanText(draft.fairerView?.open),
    },
    support: normaliseEntries(draft.support),
    evidenceAgainst: normaliseEntries(draft.evidenceAgainst),
    distortions: normaliseEntries(draft.distortions),
    alternatives: normaliseEntries(draft.alternatives),
    uncertainty: normaliseEntries(draft.uncertainty),
    facts: normaliseEntries(draft.facts),
    feelings: normaliseEntries(draft.feelings),
    interpretations: normaliseEntries(draft.interpretations),
    predictions: normaliseEntries(draft.predictions),
    refinedClaim: cleanText(draft.refinedClaim),
    returnPhrase: cleanText(draft.returnPhrase),
    evidenceLane: Number.isInteger(draft.evidenceLane) && draft.evidenceLane >= 0 && draft.evidenceLane <= 3 ? draft.evidenceLane : 0,
    feelingIntensity: Number.isInteger(draft.feelingIntensity) && draft.feelingIntensity >= 0 && draft.feelingIntensity <= 10 ? draft.feelingIntensity : null,
  };
}
