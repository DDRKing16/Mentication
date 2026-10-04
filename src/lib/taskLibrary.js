// Task library matcher.
//
// Expands the archetype data (src/data/taskArchetypes.js) into concrete tasks
// and matches free-typed input ("make a Korean greeting card") against them.
// A match returns that task's OWN steps — never a shared generic ladder.
// No match returns null and the caller falls back to AI (then the generic
// ladder), so the library only ever makes results more specific.
import { ARCHETYPES } from "@/data/taskArchetypes";

const STOP_WORDS = new Set(["the", "a", "an", "my", "for", "about", "to", "and", "of", "in", "on", "some", "do", "go"]);

const tokens = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

// Expand every archetype × object (× topic) into a task index once. Tasks are
// cheap entries (name + token set + archetype ref); steps are only rendered
// for the single task that wins the match.
let INDEX = null;
function getIndex() {
  if (INDEX) return INDEX;
  INDEX = [];
  for (const arch of ARCHETYPES) {
    const hasTopics = Array.isArray(arch.topics);
    for (const o of arch.objects) {
      const os = hasTopics ? arch.topics : [null];
      for (const t of os) {
        const name = arch.pattern(o, t).replace(/\s+/g, " ").trim();
        const toks = new Set(tokens(name));
        for (const extra of arch.extraTokens || []) toks.add(extra.toLowerCase());
        INDEX.push({ name, nameLower: name.toLowerCase(), toks, arch, o, t });
      }
    }
  }
  return INDEX;
}

function renderStep(templates, o, t) {
  const fill = (s) =>
    s
      .replaceAll("{O}", capitalize(o || ""))
      .replaceAll("{o}", o || "")
      .replaceAll("{t}", t || "");
  return templates.map(([title, micro, time, easier]) => ({
    title: fill(title),
    micro: fill(micro),
    time,
    easier: easier.map(fill),
  }));
}

// Returns { name, steps } for the best library match, or null when nothing
// reasonably matches. Scoring is token overlap against the task name, with a
// bonus when the typed input contains the task name (or vice versa).
export function findLibraryTask(input) {
  const text = (input || "").trim().toLowerCase();
  if (text.length < 4) return null;
  const inToks = tokens(text);
  if (!inToks.length) return null;

  let best = null;
  let bestScore = 0;
  let bestOverlap = 0;
  let bestVerbMatch = false;
  for (const entry of getIndex()) {
    let overlap = 0;
    for (const tok of inToks) if (entry.toks.has(tok)) overlap += 1;
    const verbMatch = entry.toks.has(inToks[0]);
    let score = overlap;
    // Phrase containment: the typed input or the task name contains the other.
    if (entry.nameLower.includes(text) || text.includes(entry.nameLower)) score += 2;
    if (score > bestScore) {
      bestScore = score;
      bestOverlap = overlap;
      bestVerbMatch = verbMatch;
      best = entry;
    }
  }

  // Require meaningful overlap so unrelated tasks never borrow steps: three
  // shared words, or two shared words plus the leading action word ("cancel …").
  if (!best || !(bestOverlap >= 3 || (bestOverlap >= 2 && bestVerbMatch) || bestScore >= 4)) return null;
  return {
    name: best.name,
    steps: renderStep(best.arch.steps, best.o, best.t),
  };
}

export const LIBRARY_TASK_COUNT = getIndex().length;
