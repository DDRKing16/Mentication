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

export const BELIEF_QUESTION = "How true does the original thought feel right now?";
export const BELIEF_ANCHORS = "0 = not at all true · 10 = completely true";
export const beliefRating = (value) => Number.isInteger(value) && value >= 0 && value <= 10 ? value : null;

export function commitEvidenceDrafts(data = {}, drafts = {}) {
  return Object.fromEntries([["support", "support"], ["against", "evidenceAgainst"]].map(([id, key]) => {
    const entries = normaliseEntries(data[key]);
    const text = cleanText(drafts[id]);
    return [key, text && entries.length < 3 ? [...entries, text] : entries];
  }));
}

export function buildBalancedThought({ thought = "", facts = [], support = [], evidenceAgainst = [], alternatives = [] } = {}) {
  const known = [...new Set(normaliseEntries([...facts, ...support]))];
  const other = normaliseEntries(evidenceAgainst);
  const open = normaliseEntries(alternatives);
  return [
    `My original thought: “${cleanText(thought)}”`,
    known.length ? `Facts and supporting details I want to keep: ${known.join(" ")}` : "I do not have to dismiss this concern or decide it is false.",
    other.length ? `Other details to hold alongside it: ${other.join(" ")}` : "",
    open.length ? `What remains possible or uncertain: ${open.join(" ")}` : "I can distinguish what is known from what is still uncertain.",
  ].filter(Boolean).join(" ");
}

export function normaliseThoughtOrFactDraft(draft = {}) {
  const fragments = (Array.isArray(draft.fragments) ? draft.fragments : [])
    .map((fragment) => ({ ...fragment, id: cleanText(fragment?.id), text: cleanText(fragment?.text) }))
    .filter((fragment) => fragment.id && fragment.text);
  const validIds = new Set(fragments.map((fragment) => fragment.id));
  const assignments = Object.fromEntries(Object.entries(draft.assignments || {})
    .filter(([id, category]) => validIds.has(id) && ["fact", "interpretation", "prediction", "catastrophe", "feeling", "open", "mixed", "not-sure"].includes(category)));

  return {
    ...draft,
    thought: cleanText(draft.thought),
    beliefVersion: 2,
    // Old drafts may contain a default or a mood score, not an answered belief rating.
    certaintyBefore: draft.beliefVersion === 2 ? beliefRating(draft.certaintyBefore) : null,
    certaintyAfter: draft.beliefVersion === 2 ? beliefRating(draft.certaintyAfter) : null,
    balancedConfirmed: draft.balancedConfirmed === true,
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
