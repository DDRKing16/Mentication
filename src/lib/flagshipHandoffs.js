import { FLAGSHIP_REGISTRY } from "./flagshipRegistry.js";
import { getHandoffMemory } from "./flagshipMemory.js";

const RULES = Object.freeze([
  { from: "factCheck", to: "testPrediction", when: (c) => c.classification === "prediction" && c.safelyTestable, reason: "This looks safely testable, so a small experiment could gather real evidence." },
  { from: "factCheck", to: "thenWhat", when: (c) => c.classification === "catastrophe", reason: "The difficult part is the feared consequence, so continuing beyond the worst frame may help." },
  { from: "testPrediction", to: "factCheck", when: (c) => c.completed && c.distortedInterpretation, reason: "You gathered evidence; sorting fact from interpretation can help you read the result fairly." },
  { from: "nextAction", to: "activationMenu", when: (c) => c.barrier === "no-drive", reason: "The next step is visible; the remaining barrier is low reward, so Ignition Point may fit better." },
  { from: "urgeSurf", to: "changeScene", when: (c) => c.choiceAvailable && c.environmentCue, reason: "A little choice is available, but the setting is still cueing the urge; changing scene may protect that space." },
  { from: "countermove", to: "openChannel", when: (c) => !c.directActionTooDemanding && (c.pull === "isolate" || c.relational), reason: "This pull is relational, so reopening one safe channel is the most relevant next move." },
  { from: "countermove", to: "pulseShift", when: (c) => !c.directActionTooDemanding && (c.physicallyFlat || c.barrier === "physically-flat"), reason: "You know the direction but your body feels flat; a small pulse of movement may make action available." },
  { from: "countermove", to: "nextAction", when: (c) => !c.directActionTooDemanding && c.pull === "avoid" && c.taskRelated, reason: "The pull concerns a task, so compressing it into one executable step may be more useful." },
  { from: "pulseShift", to: "countermove", when: (c) => c.moreMovement && c.avoidedAction, reason: "More movement is available; Countermove can direct it toward the avoided action." },
  { from: "pulseShift", to: "nextAction", when: (c) => c.moreMovement && c.taskRelated, reason: "You have a little more activation; one easy task step can give it a direction." },
  { from: "thenWhat", to: "nextAction", when: (c) => c.presentAction === "yes", reason: "A genuine practical action emerged, so turn it into one executable next step." },
  { from: "thenWhat", to: "grounding54321V2", when: (c) => c.reassuranceLoop, reason: "More analysis may be feeding certainty-seeking; grounding can return attention to the present." },
  { from: "thenWhat", to: "urgeSurf", when: (c) => c.reassuranceLoop && c.urgeToAnalyse, reason: "The pull to analyse can be treated as an urge rather than another question to solve." },
  { from: "tomorrowParking", to: "nextAction", when: (c) => c.reopenedNextDay, reason: "This item is back in daytime space; one easy step can help you begin it." },
  { from: "grounding54321V2", to: "vectorShift", when: (c) => c.orientationImproved && c.needsDestination, reason: "You are more oriented; a short precision-grounding protocol can help consolidate that return." },
  { from: "countermove", to: "vectorShift", when: (c) => c.directActionTooDemanding, reason: "Direct action is too demanding right now; Vector Shift can provide a contained grounding reset before another move." },
  { from: "nextAction", to: "signalLock", when: (c) => c.actionClear && c.wantsTimedSprint, reason: "The next action is clear and startable, so a bounded focus sprint can carry it forward." },
  { from: "signalLock", to: "nextAction", when: (c) => c.targetUnstartable, reason: "Brief scaffolding did not reveal a startable target; Next Easiest Step can identify the deeper barrier." },
  { from: "tomorrowParking", to: "nightChannel", when: (c) => c.parkedNow && c.audioAllowed, reason: "The unfinished thought is stored; Night Channel can now give remaining attention somewhere low-pressure to settle." },
]);

const DAY = 24 * 60 * 60 * 1000;

export function recommendHandoff(from, context = {}) {
  if (context.immediateDanger || context.needsSafety || Number(context.distress || 0) >= 9) return null;
  const memory = getHandoffMemory();
  const recentlyCompleted = new Set(context.recentlyCompleted || []);
  const currentMechanism = FLAGSHIP_REGISTRY[from]?.primaryMechanism;

  return RULES.find((rule) => {
    if (rule.from !== from || !rule.when(context)) return false;
    if (rule.to === from || recentlyCompleted.has(rule.to)) return false;
    const pair = `${from}->${rule.to}`;
    const dismissedAt = memory.dismissed?.[pair];
    if (dismissedAt && Date.now() - dismissedAt < 30 * DAY) return false;
    const nextMechanism = FLAGSHIP_REGISTRY[rule.to]?.primaryMechanism;
    if (nextMechanism && currentMechanism === nextMechanism) return false;
    if ((memory.recent || []).slice(0, 2).includes(rule.to)) return false;
    return true;
  }) || null;
}

export function handoffRules() { return RULES; }
