import { beforeEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import library from "../../intervention-library/data/interventions.json";
import { FLAGSHIP_IDS, FLAGSHIP_REGISTRY } from "./flagshipRegistry.js";
import { FLAGSHIP_EVIDENCE } from "./flagshipEvidence.js";
import { handoffRules, recommendHandoff } from "./flagshipHandoffs.js";
import { ACCESSIBILITY_DEFAULTS } from "../hooks/useAccessibilityPrefs.js";
import { clearActiveFlagship, deleteFlagshipMemory, getActiveFlagship, getFlagshipPatternSummary, getFlagshipPreferences, rememberFlagshipEvent, saveActiveFlagship } from "./flagshipMemory.js";
import { buildBalancedThought, buildThoughtOrFactLearningRecord, findThinkingTrapLanguage, normaliseThoughtOrFactDraft, suggestThinkingTraps } from "./thoughtOrFactState.js";
import { INTERVENTIONS, pathwayByIds } from "./interventions.js";
import { ACTIVE_INTERVENTION_COUNT } from "./final50Catalog.js";
import { INTERACTIVE_FLAGSHIP_IDS } from "./flagshipExperienceRouting.js";

class LocalStorageStub {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

beforeEach(() => { global.localStorage = new LocalStorageStub(); });

describe("elite 18 contract", () => {
  it("includes every flagship exactly once with evidence", () => {
    expect(FLAGSHIP_IDS).toHaveLength(18);
    expect(new Set(FLAGSHIP_IDS).size).toBe(18);
    expect(library.interventions).toHaveLength(18);
    expect(new Set(library.interventions.map((item) => item.id))).toEqual(new Set(FLAGSHIP_IDS));
    FLAGSHIP_IDS.forEach((id) => {
      expect(FLAGSHIP_REGISTRY[id].flagship).toBe(true);
      expect(FLAGSHIP_EVIDENCE[id].psychoeducation.length).toBeGreaterThan(40);
      expect(FLAGSHIP_EVIDENCE[id].sources.length).toBeGreaterThan(0);
    });
  });

  it("keeps Dream as Ignition Point's fourth pathway", () => {
    const ignition = library.interventions.find((item) => item.id === "activationMenu");
    expect(ignition.purpose).toContain("Pleasure, Mastery, Connection or Dream");
    expect(ignition.flow.join(" ")).toContain("Pleasure, Mastery, Connection or Dream");
  });

  it("keeps the active catalogue internally consistent and resolves every still-active flagship pathway", () => {
    expect(INTERVENTIONS).toHaveLength(ACTIVE_INTERVENTION_COUNT);
    // 2026-09-16: only 12 of the 18 flagships remain in the active catalogue
    // (14 were archived out of product scope) — pathwayByIds silently drops
    // any id no longer present, so the invariant is scoped to survivors.
    const stillActiveFlagshipIds = FLAGSHIP_IDS.filter((id) => INTERVENTIONS.some((iv) => iv.id === id));
    const resolved = pathwayByIds(FLAGSHIP_IDS);
    expect(new Set(resolved.map((item) => item.id))).toEqual(new Set(stillActiveFlagshipIds));
    library.interventions.forEach((item) => {
      expect(item.flow.length).toBeGreaterThanOrEqual(4);
      expect(item.flow.every((step) => typeof step === "string" && step.trim().length > 0)).toBe(true);
    });
  });

  it("routes all 18 flagships through an implemented experience system", () => {
    const guidedPlayerIds = FLAGSHIP_IDS.filter((id) => !INTERACTIVE_FLAGSHIP_IDS.includes(id));
    expect(new Set([...INTERACTIVE_FLAGSHIP_IDS, ...guidedPlayerIds])).toEqual(new Set(FLAGSHIP_IDS));
    expect(guidedPlayerIds.sort()).toEqual([
      "boxV2", "grounding54321V2", "progressive-muscle-relaxation-v2",
    ].sort());
    guidedPlayerIds.forEach((id) => {
      expect(INTERVENTIONS.find((item) => item.id === id)?.steps?.length).toBeGreaterThan(0);
    });
  });

  it("contains only valid handoff destinations and blocks unsafe handoffs", () => {
    handoffRules().forEach((rule) => {
      expect(FLAGSHIP_REGISTRY[rule.from]).toBeTruthy();
      expect(FLAGSHIP_REGISTRY[rule.to]).toBeTruthy();
      expect(rule.from).not.toBe(rule.to);
    });
    expect(recommendHandoff("thenWhat", { immediateDanger: true, presentAction: "yes" })).toBeNull();
    expect(recommendHandoff("thenWhat", { distress: 9, presentAction: "yes" })).toBeNull();
  });

  it("strips sensitive free text from preference memory", () => {
    rememberFlagshipEvent({ interventionId: "factCheck", options: { thought: "My private thought", classification: "prediction" } });
    const saved = getFlagshipPreferences().events[0];
    expect(saved.options.thought).toBe("captured");
    expect(saved.options.classification).toBe("prediction");
  });

  it("applies observation, tentative and descriptive pattern thresholds", () => {
    expect(getFlagshipPatternSummary("nextAction").level).toBe("observation");
    for (let i = 0; i < 3; i += 1) rememberFlagshipEvent({ interventionId: "nextAction", completed: true });
    expect(getFlagshipPatternSummary("nextAction").level).toBe("tentative");
    for (let i = 0; i < 2; i += 1) rememberFlagshipEvent({ interventionId: "nextAction", completed: true });
    expect(getFlagshipPatternSummary("nextAction").level).toBe("descriptive");
  });

  it("expires active free-text state", () => {
    saveActiveFlagship({ interventionId: "factCheck", draft: "session-only" });
    expect(getActiveFlagship().draft).toBe("session-only");
    const active = JSON.parse(localStorage.getItem("mentation.flagship.active.v1"));
    active.expiresAt = Date.now() - 1;
    localStorage.setItem("mentation.flagship.active.v1", JSON.stringify(active));
    expect(getActiveFlagship()).toBeNull();
  });

  it("normalises Thought or Fact drafts before persistence so removed or blank slips cannot return", () => {
    expect(normaliseThoughtOrFactDraft({
      thought: "I will fail",
      fragments: [{ id: "kept", text: "I will fail" }, { id: "blank", text: "   " }],
      assignments: { kept: "prediction", blank: "catastrophe", deleted: "fact" },
      fairerView: { known: "  One fact ", added: " ", open: "Not known" },
      support: ["One observable detail"],
      alternatives: ["  "],
      uncertainty: ["I do not know"],
    })).toMatchObject({
      thought: "I will fail",
      fragments: [{ id: "kept", text: "I will fail" }],
      assignments: { kept: "prediction" },
      fairerView: { known: "One fact", added: "", open: "Not known" },
      support: ["One observable detail"],
      alternatives: [],
      uncertainty: ["I do not know"],
    });
  });

  it("suggests possible thinking patterns from the statement without treating them as a verdict", () => {
    expect(suggestThinkingTraps("Nobody likes me. Everyone thinks I am a failure.")).toEqual(expect.arrayContaining([
      "mind-reading", "jumping-to-conclusions", "overgeneralising", "labelling",
    ]));
  });

  it("links a suggested pattern to the exact words that prompted it", () => {
    expect(findThinkingTrapLanguage("I hate all people in Melbourne because I feel like everyone is cooked.")).toContainEqual({
      id: "overgeneralising",
      phrases: ["all people", "everyone"],
    });
  });

  it("recognises a broader set of language signals without selecting patterns for the person", () => {
    expect(findThinkingTrapLanguage("They will reject me; it is all my fault and the good parts do not count.")).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "jumping-to-conclusions", phrases: expect.arrayContaining(["they will"]) }),
      expect.objectContaining({ id: "personalising", phrases: expect.arrayContaining(["all my fault"]) }),
      expect.objectContaining({ id: "discounting-positives", phrases: expect.arrayContaining(["do not count"]) }),
    ]));
  });

  it("builds a short balanced thought from the person's words, chosen pattern, and exception", () => {
    expect(buildBalancedThought({
      thought: "I hate all people in Melbourne because I just feel like everyone is cooked.",
      distortions: ["overgeneralising", "emotional-reasoning"],
      evidenceAgainst: ["My sister and two friends have treated me well"],
    })).toBe("I’m feeling fed up with people in Melbourne right now. That feeling is real, but it does not prove every person is the same. “My sister and two friends have treated me well” is an exception worth holding alongside it.");
  });

  it("keeps Thought or Fact learning memory free of the person's words and evidence", () => {
    expect(buildThoughtOrFactLearningRecord({
      thought: "Nobody likes me",
      refinedClaim: "Nobody likes me",
      support: ["Nicole did not reply"],
      evidenceAgainst: ["Sam invited me out"],
      alternatives: ["Nicole may be busy"],
      assignments: { "fragment-0": "interpretation" },
      distortions: ["mind-reading", "overgeneralising"],
      certaintyBefore: 9,
      certaintyAfter: 5,
      repeatMode: "full",
    })).toEqual({
      classification: "interpretation",
      certaintyShift: -4,
      repeatMode: "full",
      usedSavedCopy: false,
    });
  });

  it("keeps the Thought or Fact flow short, private, and fully reachable", () => {
    const src = fs.readFileSync("src/components/ThoughtOrFactExperience.jsx", "utf8");
    expect(src).toContain('const STAGES = ["capture", "sort", "evidence", "ruling", "direction", "complete"]');
    expect(src).toContain('onFinish={() => go("complete")}');
    expect(src).toContain("Private on this device");
    expect(src).toContain("Skip for now");
    expect(src).toContain("Keep what");
    expect(src).toContain("Test the prediction");
  });

  it("keeps Thought or Fact's quiet shell styles", () => {
    const css = fs.readFileSync("src/styles/thought-or-fact.css", "utf8");
    expect(css).toContain('.tof-shell > [aria-label^="Stage"]');
  });

  it("keeps a Thought or Fact draft editable until its matching intervention explicitly clears it", () => {
    saveActiveFlagship({
      interventionId: "factCheck",
      data: { thought: "I will fail", fragments: [{ id: "one", text: "I will fail" }], assignments: { one: "prediction" } },
    });

    clearActiveFlagship("nextAction");
    expect(getActiveFlagship().data).toMatchObject({ thought: "I will fail", assignments: { one: "prediction" } });

    clearActiveFlagship("factCheck");
    expect(getActiveFlagship()).toBeNull();
  });

  it("lets the user delete intervention memory directly", () => {
    rememberFlagshipEvent({ interventionId: "activationMenu", completed: true, options: { pathway: "Dream" } });
    saveActiveFlagship({ interventionId: "activationMenu", draft: "private draft" });
    deleteFlagshipMemory("all");
    expect(getFlagshipPreferences().events).toEqual([]);
    expect(getActiveFlagship()).toBeNull();
  });

  it("ships equivalent accessibility modes by default", () => {
    expect(ACCESSIBILITY_DEFAULTS).toMatchObject({ reducedMotion: false, captions: true, highContrast: false, oneHanded: false });
    const css = [
      fs.readFileSync(new URL("../index.css", import.meta.url), "utf8"),
      fs.readFileSync(new URL("../styles/intervention-experiences.css", import.meta.url), "utf8"),
    ].join("\n");
    expect(css).toContain("html.high-contrast");
    expect(css).toContain("html.large-text");
    expect(css).toContain("html.one-handed");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@media(max-width:640px)");
  });
});
