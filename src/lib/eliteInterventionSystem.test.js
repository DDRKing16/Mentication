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

describe("elite 17 contract", () => {
  it("includes every flagship exactly once with evidence", () => {
    expect(FLAGSHIP_IDS).toHaveLength(17);
    expect(new Set(FLAGSHIP_IDS).size).toBe(17);
    expect(library.interventions).toHaveLength(17);
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

  it("keeps the active catalogue internally consistent and resolves every flagship pathway", () => {
    expect(INTERVENTIONS).toHaveLength(ACTIVE_INTERVENTION_COUNT);
    const resolved = pathwayByIds(FLAGSHIP_IDS);
    expect(resolved).toHaveLength(17);
    expect(new Set(resolved.map((item) => item.id))).toEqual(new Set(FLAGSHIP_IDS));
    library.interventions.forEach((item) => {
      expect(item.flow.length).toBeGreaterThanOrEqual(4);
      expect(item.flow.every((step) => typeof step === "string" && step.trim().length > 0)).toBe(true);
    });
  });

  it("routes all 17 flagships through an implemented experience system", () => {
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

  it("keeps AI-processing consent out of the thought-capture screen until AI is connected", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    const resetSource = fs.readFileSync(new URL("../pages/ResetFlow.jsx", import.meta.url), "utf8");
    expect(source).not.toContain("AI is not connected yet");
    expect(source).not.toContain("I understand how my reflection is handled");
    expect(resetSource).not.toContain("tofPrivacyAcknowledged");
    expect(resetSource).not.toContain("AI is not connected yet");
    expect(resetSource).not.toContain("tof-entry__privacy-consent");
  });

  it("keeps Thought or Fact readiness focused and keeps safety details available on demand", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("A thought can feel true without being a fact.");
    expect(source).toContain("Is this a good time for this?");
    expect(source).toContain(">Ground first<");
    expect(source).not.toContain("Separate what happened from what your mind is adding.");
    expect(source).toContain("{eyebrow && <p>{eyebrow}<\/p>}");
    expect(source).not.toContain("Private evidence review");
    expect(source).not.toContain("tof-progress");
    const resetSource = fs.readFileSync(new URL("../pages/ResetFlow.jsx", import.meta.url), "utf8");
    expect(resetSource).toContain("isThoughtOrFactEntry");
    expect(resetSource).toContain("What thought are you putting on trial?");
    expect(resetSource).toContain("Write it as it appears in your mind.");
    expect(resetSource).toContain("Open case");
    expect(resetSource).toContain("Ground first");
    expect(resetSource).toContain("startThoughtVoiceEntry");
    expect(resetSource).toContain("navigator.mediaDevices.getUserMedia");
    expect(resetSource).toContain("tof-voice");
    expect(resetSource).toContain("Use recording");
    expect(resetSource).toContain("Audio is not saved");
  });

  it("keeps Thought or Fact capture private, plain, and free of a premature certainty prompt", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Write the thought exactly as it appears.");
    expect(source).toContain("Private on this device");
    expect(source).toContain("tof-capture tof-capture--entry");
    expect(source).toContain("Look at it");
    expect(source).toContain("const hasThought = cleanSentence(thought).length >= 3;");
    expect(source).not.toContain("Use its exact words. One thought is enough.");
    expect(source).not.toContain("How convincing is it right now?");
    expect(source).not.toContain("autoFocus value={thought}");
    expect(source).not.toContain("Statement under review");
    expect(source).not.toContain("Place it on the evidence table");
  });

  it("keeps Thought or Fact capture as one calm, keyboard-safe writing sequence", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(source).toContain("tof-capture__intro");
    expect(source).toContain("tof-capture__privacy");
    expect(source).toContain("tof-capture__actions");
    expect(source).toContain("tof-capture__prompt");
    expect(source).toContain("tof-capture__stage");
    expect(styles).toContain(".tof-capture--entry .tof-document-wrap");
    expect(styles).toContain(".tof-capture__actions .tof-button");
    expect(styles).toContain("font-size: 16px;");
    expect(styles).toContain("overflow-wrap: anywhere;");
  });

  it("keeps claim confirmation editable and preserves the original wording option", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(source).toContain("Put the exact claim on record.");
    expect(source).toContain("Your original words");
    expect(source).toContain("Claim for review");
    expect(source).toContain("Use this claim");
    expect(source).toContain("Keep my original words");
    expect(source).toContain("tof-claim-confirmation");
    expect(styles).toContain(".tof-claim-confirmation__sheet");
    expect(source).not.toContain("How true does this feel right now?");
    expect(source).not.toContain("function BeliefStage");
    expect(source).toContain("Which shortcuts might be shaping the claim?");
    expect(source).toContain("The charge sheet");
    expect(source).toContain("Confirm charge");
    expect(source).not.toContain("function EvidenceDesk");
    expect(source).toContain('go("evidence", { assignments, evidenceLane: 0 });');
  });

  it("sorts the whole statement in one tap and moves on immediately", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Choose the closest fit. You can adjust it later.");
    expect(source).toContain("onSelect(category.id)");
    expect(source).not.toContain("Review a placed part");
    expect(source).not.toContain("All parts have been placed. Moving on…");
  });

  it("makes the sorting decision explicit before the statement can advance", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("onSelect(category.id)");
    expect(source).toContain("Feeling");
  });

  it("teaches thought patterns without turning Sorting into a lesson", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("See what this thought is made of.");
    expect(source).toContain("Why these choices?");
    expect(source).toContain("Jumping to conclusions");
    expect(source).toContain("worst-case leap");
    expect(source).not.toContain("Tap a fragment, then place it where it fits best.");
    expect(source).not.toContain("Choose the closest fit, or leave it open.");
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(styles).toContain("min-height: 4.6rem");
  });

  it("keeps evidence optional and non-quantified", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Evidence does not have to settle the thought. It helps make room for the full picture.");
    expect(source).toContain("Why include this?");
    expect(source).toContain("eyebrow={lane.label}");
    expect(source).toContain("Skip for now");
    expect(source).toContain("One observable detail");
    expect(source).not.toContain("Give more than one possibility room.");
    expect(source).not.toContain("Nothing needs solving here.");
    expect(source).not.toContain("More checking may not add much.");
    expect(source).not.toContain("Evidence balance");
    expect(source).not.toContain("tof-balance");
  });

  it("keeps Thought or Fact navigation quiet while a task is active", () => {
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(styles).toContain(".tof-shell > [aria-label^=\"Stage\"] { display: none !important; }");
    expect(styles).toContain(".tof-shell [aria-label^=\"Stage\"] { display: none !important; }");
    expect(styles).toContain(".tof-entry__progress { display: none; }");
  });

  it("uses one calm certainty control and does not turn evidence into a numbered progress task", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain('type="range"');
    expect(source).toContain('aria-valuetext={`${value} out of 10 now`}');
    expect(source).not.toContain("tof-evidence-step");
    expect(source).not.toContain("of ${lanes.length}");
  });

  it("starts Thought or Fact with a calm suitability checkpoint", () => {
    const source = fs.readFileSync(new URL("../pages/ResetFlow.jsx", import.meta.url), "utf8");
    expect(source).toContain("Hold the thought up to the light.");
    expect(source).toContain("This is for an everyday upsetting thought.");
    expect(source).toContain("Take a practical step");
  });

  it("uses the Reset starting rating and keeps thought capture focused on writing", () => {
    const source = fs.readFileSync(new URL("../pages/ResetFlow.jsx", import.meta.url), "utf8");
    expect(source).not.toContain("How convincing does it feel right now?");
    expect(source).not.toContain("tof-entry__certainty-slider");
    expect(source).toContain("initialCertainty={interventionId === \"factCheck\" ? answers.intensity : undefined}");
  });

  it("routes the claim straight to thinking patterns then the evidence prompts", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain('go("charge");');
    expect(source).toContain('onContinue={() => go("sort")}');
    expect(source).toContain('onSelect={(category) => { const assignments = Object.fromEntries');
    expect(source).toContain('go("evidence", { assignments, evidenceLane: 0 });');
    expect(source).not.toContain('go("desk")');
  });

  it("keeps the fairer view editable and non-final", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("A truer thought, in your own words.");
    expect(source).toContain("tof-ruling tof-ruling--editorial");
    expect(source).toContain("A more balanced thought");
    expect(source).toContain("What informed this");
    expect(source).toContain("Keep it unresolved");
    expect(source).toContain("Restore first draft");
    expect(source).toContain('added: (evidence.interpretations?.length ? evidence.interpretations : []).join(" ")');
    expect(source).not.toContain("How convincing does the original thought feel now?");
    expect(source).not.toContain("Does this sound like your view?");
    expect(source).not.toContain("Your working ruling");
    expect(source).toContain('added: (evidence.interpretations?.length ? evidence.interpretations : []).join(" ")');
  });

  it("keeps the completion takeaway with a private saved reflection", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("returnPhrase: data.returnPhrase");
    expect(source).toContain("setReturnPhrase={(returnPhrase) => update({ returnPhrase })}");
  });

  it("offers a broad, multi-select set of thinking traps", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain('id: "all-or-nothing"');
    expect(source).toContain('id: "overgeneralising"');
    expect(source).toContain('id: "emotional-reasoning"');
    expect(source).toContain('id: "discounting-positives"');
    expect(source).toContain("selected.length");
    expect(source).toContain("Choose every pattern that may fit");
  });

  it("captures evidence that supports and challenges the conclusion", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain('id: "support"');
    expect(source).toContain('id: "against"');
    expect(source).toContain("What evidence points another way?");
    expect(source).toContain("evidenceAgainst");
  });

  it("builds an editable adaptive thought and asks for a post-review rating", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("buildBalancedThought");
    expect(source).toContain("Make this mine");
    expect(source).toContain("A more balanced thought");
    expect(source).toContain("How true does the original thought feel now?");
    expect(source).toContain('go("direction")');
    expect(source).not.toContain("filter(Boolean).slice(0, 3)");
  });

  it("keeps the end rating on the balanced-thought screen instead of adding another step", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("How true does the original thought feel now?");
    expect(source).toContain('onContinue={() => go("direction")}');
    expect(source).not.toContain('{stage === "rerate"');
  });

  it("keeps direction focused with one relevant primary choice", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Test this carefully");
    expect(source).toContain("Leave this here for now");
    expect(source).toContain("Return to the present");
    expect(source).toContain("Stop here");
    expect(source).toContain("tof-direction tof-direction--choice");
    expect(source).toContain("Choose what helps now.");
    expect(source).not.toContain("There is no right next step. Stopping is a valid choice.");
    expect(source).not.toContain("Stop analysing and ground in what is around you.");
    expect(source).not.toContain("tof-direction-grid");
  });

  it("offers a practical step when the review contains both a fact and a concrete concern", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Boolean((data.support || data.facts || []).length)");
  });

  it("requires an informed confirmation before Test the Prediction", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Confirm Test the Prediction");
    expect(source).toContain("What remains open");
    expect(source).toContain("Choose only a small, safe experiment.");
    expect(source).toContain("Not now");
    expect(source).toContain("Continue to Test the Prediction");
  });

  it("keeps completion compact and asks before local saving", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Keep what is useful.");
    expect(source).toContain("See the notes you made");
    expect(source).toContain("Save this privately?");
    expect(source).toContain("This stays only on this device.");
    expect(source).not.toContain("Review complete");
    expect(source).toContain("tof-complete tof-complete--quiet");
    expect(source).toContain("Keep what is useful.");
    expect(source).not.toContain("It felt equally convincing before and after.");
    expect(source).not.toContain("You noted a change in how convincing it felt.");
  });

  it("closes with the intervention's core distinction without dismissing the concern", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("A thought can be important without being the whole story.");
  });

  it("requires an explicit safe test confirmation", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("This feels safe and within my control.");
    expect(source).toContain("disabled={!testFeelsSafe}");
    expect(source).toContain("Boolean(counts.prediction || (data.predictions || []).length)");
  });

  it("offers explicit repeat modes and prevents duplicate private records", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("Quick check");
    expect(source).toContain("Full review");
    expect(source).toContain("Deeper review");
    expect(source).toContain('repeatMode: "quick"');
    expect(source).toContain("existing.some((item) => item.thought === record.thought");
  });

  it("ships reduced motion and screen-reader stage equivalents", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).toContain("MotionConfig reducedMotion={a11y.prefs.reducedMotion ? \"always\" : \"never\"}");
    expect(source).toContain("Thought capture. Enter one thought in your own words.");
    expect(source).toContain("role=\"status\"");
    expect(source).toContain("data-sfx=\"none\"");
    expect(source).not.toContain("playComplete()");
  });

  it("keeps Thought or Fact secondary controls legible, reachable, and keyboard-visible", () => {
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(styles).toContain("--tof-secondary: rgba(255,255,255,.72)");
    expect(styles).toContain(".tof-text-action { min-height: 2.75rem;");
    expect(styles).toContain(".tof-claim-card__actions button { min-height: 2.75rem;");
    expect(styles).toContain(".tof-shell button:focus-visible");
    expect(styles).toContain("outline: 3px solid #ffe29b");
    expect(styles).toContain(".tof-button:disabled { cursor: not-allowed;");
    expect(styles).toContain("opacity: 0.58");
    expect(styles).toContain(".tof-document small { color: rgba(44,45,42,.68);");
  });

  it("protects mobile typing, safe areas, and large text across Thought or Fact", () => {
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(styles).toContain(".tof-shell[data-quiet] textarea { font-size: 16px; }");
    expect(styles).toContain("padding-bottom: max(6rem, calc(4rem + env(safe-area-inset-bottom)));");
    expect(styles).toContain("html.large-text .tof-ruling--editorial,");
    expect(styles).toContain("html.one-handed .tof-ruling-actions,");
  });

  it("keeps the visual system readable, centered, and unmistakably actionable", () => {
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(styles).toContain(".tof-shell[data-quiet] { color: #fffaf0; }");
    expect(styles).toContain("border-radius: .7rem;");
    expect(styles).toContain("font-size: 1rem;");
    expect(styles).toContain(".tof-stage > .tof-button, .tof-stage > .tof-text-action { margin-inline: auto; }");
    expect(styles).toContain("grid-template-columns: 2.25rem 1fr 2.25rem;");
  });

  it("keeps Thought or Fact's quiet shell and bespoke mobile stages out of generic card layouts", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(source).toContain("quiet");
    expect(source).toContain("Your original words");
    expect(source).not.toContain("editable part");
    expect(source).toContain("Choose the closest fit. You can adjust it later.");
    expect(styles).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(styles).toContain(".tof-shell .tof-world__dust { display: none; }");
    expect(styles).toContain(".tof-fairer-view section:last-child");
    expect(source).not.toContain("AnimatePresence mode=\"wait\"");
    expect(styles).toContain(".tof-shell[data-quiet]");
    expect(styles).toContain(".tof-shell:has(.tof-ruling) > .fixed");
  });

  it("does not leave an empty chamber while changing between Thought or Fact stages", () => {
    const source = fs.readFileSync(new URL("../components/ThoughtOrFactExperience.jsx", import.meta.url), "utf8");
    expect(source).not.toContain('mode="wait"');
  });

  it("does not leave a fixed help dock over the final Thought or Fact choices", () => {
    const styles = fs.readFileSync(new URL("../styles/thought-or-fact.css", import.meta.url), "utf8");
    expect(styles).toContain(".tof-shell .fixed { display: none !important; }");
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
    const css = fs.readFileSync(new URL("../index.css", import.meta.url), "utf8");
    expect(css).toContain("html.high-contrast");
    expect(css).toContain("html.large-text");
    expect(css).toContain("html.one-handed");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toContain("@media(max-width:640px)");
  });
});
