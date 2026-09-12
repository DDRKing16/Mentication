import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { useGuideVoice } from "@/hooks/useGuideVoice";
import InterventionControlShell from "@/components/InterventionControlShell";
import { FLAGSHIP_REGISTRY } from "@/lib/flagshipRegistry";
import { evidenceFor } from "@/lib/flagshipEvidence";
import { clearActiveFlagship, getActiveFlagship, recordHandoffDecision, rememberFlagshipEvent, saveActiveFlagship, saveTomorrowParkingItem } from "@/lib/flagshipMemory";
import { recommendHandoff } from "@/lib/flagshipHandoffs";
import { INTERACTIVE_FLAGSHIP_IDS, isInteractiveFlagship } from "@/lib/flagshipExperienceRouting";
import { getInterventionAtmosphere, getInterventionMoment } from "@/lib/interventionExperience";

export { INTERACTIVE_FLAGSHIP_IDS, isInteractiveFlagship };

const OPTIONS = {
  focusBarrier: [
    ["unclear", "Cannot see the next action"], ["effort", "It feels like too much effort"],
    ["pulled", "Attention keeps getting pulled elsewhere"], ["large", "The task feels too large"],
    ["no-drive", "There is no drive to begin"],
  ],
  returnStatus: [["completed", "Completed"], ["partial", "Partly completed"], ["couldnt", "Couldn't start"]],
};

const choice = (value, label, hint) => ({ value, label, hint });

function nextActionFor(barrier) {
  return {
    unclear: "Open the task and identify the first visible action.",
    effort: "Do only the first 30 seconds of the task.",
    pulled: "Contain one competing input, then reopen the task.",
    large: "Complete the smallest independent piece of the task.",
    "no-drive": "Set up the task and make one minimal activation move.",
  }[barrier] || "Take one observable physical step.";
}

function countermoveFor(pull, size) {
  const action = {
    isolate: "open one safe point of contact", still: "make one accessible physical movement",
    cancel: "reduce the commitment instead of abandoning it", avoid: "approach the safest first edge",
    silent: "communicate one honest sentence", giveup: "complete one continuation action",
    numb: "re-enter one real-world activity",
  }[pull] || "move one degree away from withdrawal";
  const prefix = { nudge: "Make it tiny:", shift: "Make a contained move:", breakaway: "Use the capacity available:" }[size] || "Try:";
  return `${prefix} ${action}.`;
}

function movementFor(position, capacity) {
  const level = capacity || "flicker";
  if (position === "lying") return level === "flicker" ? "Press your feet or hands gently into the surface, then release." : "Roll the shoulders, reach the arms and shift toward sitting if safe.";
  if (position === "seated") return level === "flicker" ? "Lift and lower the heels, then open the posture slightly." : "Add alternating arm reaches or a seated cross-body rhythm.";
  if (position === "standing") return level === "flicker" ? "Shift weight left and right with support nearby." : "Add slow steps or cross-body reaches within your space.";
  return "Change the rhythm or direction of your existing movement for a few cycles.";
}

function screensFor(id, data) {
  const intro = (line, body) => ({ kind: "intro", eyebrow: "FLAGSHIP EXPERIENCE", prompt: line, body });
  const away = (prompt, body) => ({ kind: "away", prompt, body });
  const returning = (prompt, body) => ({ kind: "return", prompt, body, options: OPTIONS.returnStatus.map(([value, label]) => choice(value, label)) });

  if (id === "nextAction") return [
    intro("Make focus smaller.", "Lack of focus can have different causes. We will identify the barrier and produce one clear action - not a general plan."),
    { prompt: "What is making it hard to focus?", options: OPTIONS.focusBarrier.map(([value, label]) => choice(value, label)) },
    { kind: "action", prompt: "Here is the next easiest step.", body: "It must be observable: someone could see when it is complete.", defaultValue: nextActionFor(data.barrier) },
    away("Take the step.", "The app does not need to stay open. Your action is saved here for when you return."),
    returning("What happened?", "Partly completed still counts as movement. If you could not start, we will make the action lighter."),
  ];
  if (id === "tomorrowParking") return [
    { prompt: "Does this need action tonight?", body: "If this is urgent, safety-critical or time-critical, do not park it. Take the appropriate real-world action or seek support.", options: [choice("park", "It can wait until tomorrow"), choice("urgent", "It needs action tonight"), choice("support", "I need support deciding")] },
    { kind: "capture", eyebrow: "LOW-LIGHT BEDTIME FLOW", prompt: "What is unfinished?", body: "Capture one short line. It stays on this device only if you deliberately seal it for tomorrow, and it is never sent to analytics.", placeholder: "One short line..." },
    { kind: "parking-complete", prompt: "Stored for tomorrow.", body: "It is outside the night now. Put the phone down; nothing else needs to be completed here." },
  ];
  if (id === "activationMenu") return [
    intro("Find the ignition point.", "Do not wait for motivation. Choose the kind of experience most likely to feel worthwhile: Pleasure, Mastery, Connection or Dream."),
    { prompt: "What could create a little usable reward or meaning?", options: [choice("pleasure", "Pleasure", "Something gently enjoyable"), choice("mastery", "Mastery", "A small sense of capability"), choice("connection", "Connection", "Contact or shared presence"), choice("dream", "Dream", "A small move toward a life you want")] },
    { kind: "action", prompt: "Choose one small, worthwhile action.", body: "Make it possible within the next hour. The aim is contact with reward or meaning, not instant happiness.", defaultValue: data.ignition === "connection" ? "Send one low-pressure signal to a safe person." : data.ignition === "mastery" ? "Finish one small, visible piece of something." : data.ignition === "dream" ? "Take one five-minute step toward something you want your life to contain." : "Spend five minutes with something you genuinely enjoy." },
    away("Begin with the first move.", "Leave the app if you need to. Your chosen action will be waiting here."),
    returning("Did the action feel worthwhile?", "The mood does not need to change for the action to count."),
  ];
  if (id === "changeScene") return [
    intro("Interrupt the setting.", "A small environmental change can make different behaviour available without asking you to think your way out of a stuck state."),
    { prompt: "What is the smallest safe scene change available?", options: [choice("turn", "Turn or change position"), choice("window", "Move to a window or doorway"), choice("room", "Move to another room"), choice("outside", "Step outside briefly")] },
    away("Cross into the new scene.", "Settle there, look around and notice one thing that is different. The app can close."),
    returning("Did the new setting change what felt available?", "No forced mood rating - we are checking whether the environment changed the next possible behaviour."),
  ];
  if (id === "testPrediction") return [
    intro("Turn the prediction into an experiment.", "We are collecting information, not trying to prove you wrong. Only design a safe, ethical and proportionate test."),
    { kind: "capture", prompt: "What is the prediction?", body: "Use: If I do..., then... will happen. This stays locally in the active exercise.", placeholder: "If I..., then..." },
    { prompt: "Can this be tested safely?", options: [choice("yes", "Yes - small and safe"), choice("smaller", "Only if I make it smaller"), choice("no", "No - risk or boundaries are involved")] },
    { kind: "action", prompt: "Design the smallest fair test.", body: "Choose an action and an observable outcome. Do not test medical, legal, physical-safety or high-risk relationship predictions here.", defaultValue: "Take one safe action and observe what actually happens." },
    away("Run the test when ready.", "You do not need to keep the app open. The prediction and test remain on this device."),
    { kind: "capture", prompt: "What did you observe?", body: "Record the outcome, including mixed or uncertain results.", placeholder: "What actually happened...", key: "outcome" },
    { kind: "completion", prompt: "Prediction beside observation.", body: "The result is information, not a verdict. Notice what changed in the prediction and what remains uncertain." },
  ];
  if (id === "factCheck") return [
    intro("Separate what is known from what the mind added.", "A feeling can be valid without making every conclusion a fact."),
    { kind: "capture", prompt: "Catch the thought.", body: "Keep it to one sentence. It stays locally in this active exercise.", placeholder: "The thought in exact words..." },
    { prompt: "What is the thought mainly doing?", options: [choice("fact", "Stating an observable fact"), choice("interpretation", "Adding an interpretation"), choice("prediction", "Making a prediction"), choice("catastrophe", "Jumping to a catastrophic consequence")] },
    { kind: "capture", prompt: "Build a balanced sentence.", body: "Try: What I know is... What my mind is adding is... What I can do next is...", placeholder: "What I know is...", key: "balanced" },
    { kind: "completion", prompt: "The thought has been sorted.", body: "Keep the classification and balanced wording. Certainty is not required." },
  ];
  if (id === "thenWhat") return [
    intro("The mind stopped at the worst frame.", "Keep the story moving. This is coping appraisal, not reassurance that the feared event is harmless or unlikely."),
    { prompt: "Is cognitive exploration safe right now?", options: [choice("safe", "Yes - I can reflect safely"), choice("danger", "Immediate danger or urgent action"), choice("activated", "Too activated for cognitive work"), choice("loop", "I have already analysed this repeatedly")] },
    { kind: "capture", prompt: "What exact frame does the mind stop at?", body: "Keep it brief and avoid graphic detail. This stays only in the active local exercise.", placeholder: "The specific feared moment..." },
    { prompt: "What has that frame come to mean?", options: [choice("pain", "Something painful"), choice("embarrassing", "Something embarrassing"), choice("disruption", "A major disruption"), choice("permanent", "Permanent damage"), choice("cope", "I could not cope"), choice("everything", "Loss of everything")] },
    { kind: "coping", prompt: "Continue the film.", body: "Build a bounded route beyond the frame: first move, first person, first resource, what remains intact and what happens next." },
    { prompt: "Does anything genuinely need to be done now?", options: [choice("yes", "Yes"), choice("no", "No"), choice("uncertain", "Uncertain")] },
    { kind: "completion", prompt: "The feared moment is not the entire future.", body: "A response now exists beyond the frozen frame. Store the route rather than repeating the analysis for certainty." },
  ];
  if (id === "countermove") return [
    intro("The pull can stay. Your direction can change.", "First check whether the pull is protective, restorative or avoidant. Rest and safety are not failures."),
    { prompt: "What is the pull telling you to do?", options: [choice("isolate", "Isolate"), choice("still", "Stay still"), choice("cancel", "Cancel"), choice("avoid", "Avoid"), choice("silent", "Stay silent"), choice("giveup", "Give up"), choice("numb", "Scroll or numb")] },
    { prompt: "What is this pull doing?", options: [choice("protect", "Protecting me from real danger"), choice("restore", "Supporting genuine recovery"), choice("avoid", "Giving short relief while life gets smaller")] },
    { prompt: "Choose a trajectory.", options: [choice("nudge", "5° - Nudge", "The smallest movement away"), choice("shift", "20° - Shift", "Meaningful but contained"), choice("breakaway", "45° - Breakaway", "A stronger move when capacity is available")] },
    { kind: "action", prompt: "Your countermove.", body: "Make it lighter or choose a different direction if this does not fit.", defaultValue: countermoveFor(data.pull, data.trajectory) },
    away("Take the move.", "The app does not need to stay open. Come back when something has happened."),
    returning("Did the action widen the situation, even slightly?", "The mood may not have shifted yet - but the direction may have."),
  ];
  if (id === "openChannel") return [
    intro("Reopen the line - not the whole relationship.", "You do not need a perfect explanation. Completion means making a deliberate relational decision, not receiving a reply."),
    { prompt: "Where did the channel close?", options: [choice("reply", "Stopped replying"), choice("cancel", "Cancelled something"), choice("away", "Pulled away"), choice("pushed", "Pushed somebody away"), choice("interaction", "A difficult interaction happened"), choice("isolated", "Been isolated too long")] },
    { prompt: "What makes reopening difficult?", options: [choice("shame", "Shame"), choice("awkward", "Awkwardness"), choice("rejection", "Fear of rejection"), choice("burden", "Fear of being a burden"), choice("explain", "Do not know how to explain"), choice("energy", "No energy for a conversation")] },
    { prompt: "Is this connection safe and welcome?", options: [choice("safe", "Yes - contact is safe"), choice("unsure", "I am not sure"), choice("unsafe", "No - contact may be unsafe or unwanted")] },
    { prompt: "Choose the bridge.", options: [choice("signal", "Signal", "Small, no conversation required"), choice("reopen", "Reopen", "Acknowledge the silence"), choice("repair", "Repair", "Recognise impact or misunderstanding"), choice("ask", "Ask", "Request company or support"), choice("presence", "Presence", "Enter a safe shared space") ] },
    { kind: "message", prompt: "Create the action in your own voice.", body: "Choose a starting tone, then review and edit every word. Mentication will not access contacts or send anything." },
    away("Complete the bridge outside the app.", "The other person's response is outside your control. Your reviewed action is saved locally while this exercise is active."),
    { kind: "return", prompt: "What deliberate decision did you make?", options: [choice("completed", "Sent or completed"), choice("drafted", "Drafted but not sent"), choice("declined", "Chose not to contact"), choice("unsafe", "Realised it was not safe or helpful")] },
  ];
  if (id === "pulseShift") return [
    intro("Do not chase motivation. Create movement.", "This is graded activation, not exercise coaching. Stop for pain, dizziness, instability or medical symptoms; choose rest when rest is genuinely needed."),
    { prompt: "What is the starting state?", options: [choice("flat", "Flat"), choice("heavy", "Heavy"), choice("slow", "Slowed down"), choice("foggy", "Foggy"), choice("stuck", "Physically stuck"), choice("rest", "I genuinely need rest"), choice("unsafe", "Pain, dizziness or instability")] },
    { prompt: "Where is your body starting?", options: [choice("lying", "Lying down"), choice("seated", "Seated"), choice("standing", "Standing"), choice("moving", "Already moving")] },
    { prompt: "What capacity is available?", options: [choice("flicker", "Flicker", "Minimal movement"), choice("pulse", "Pulse", "Moderate activation"), choice("surge", "Surge", "Stronger movement")] },
    { kind: "movement", prompt: "Unlock. Build. Direct.", body: movementFor(data.position, data.capacity) },
    { prompt: "What could this movement carry you into?", options: [choice("shower", "Showering"), choice("outside", "Getting outside"), choice("food", "Preparing food"), choice("contact", "Contacting somebody"), choice("task", "Beginning a task"), choice("move", "Continuing to move")] },
    away("Carry the movement into real life.", "The app can close. Return when you know whether any more movement became available."),
    returning("Is any more movement available than before?", "We are tracking usable activation, not happiness or performance."),
  ];
  return [];
}

function SignatureVisual({ id, step, reducedMotion }) {
  const motionProps = reducedMotion ? {} : { animate: { scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } };
  if (id === "countermove") return <div className="signature gravity"><div className="gravity-mass"/><motion.div className="trajectory t1" {...motionProps}/><div className="trajectory t2"/><div className="moving-point"/></div>;
  if (id === "openChannel") return <div className="signature channel"><div className="channel-point left"/><div className="channel-bridge">{[0,1,2,3].map(i=><span key={i}/>)}</div><div className="channel-point right"/></div>;
  if (id === "pulseShift") return <div className="signature pulse">{[0,1,2,3].map(i=><motion.span key={i} style={{animationDelay:`${i*.35}s`}} {...motionProps}/>)}</div>;
  if (id === "thenWhat") return <div className="signature timeline">{[0,1,2,3,4].map((i)=><span key={i} className={i <= Math.min(4, step) ? "active" : ""}/>)}</div>;
  if (id === "testPrediction") return <div className="signature experiment"><div>PREDICTION</div><span/><div>OBSERVATION</div></div>;
  if (id === "factCheck") return <div className="signature sorting"><span>FACT</span><span>MEANING</span><span>NEXT</span></div>;
  if (id === "changeScene") return <div className="signature doorway"><motion.div {...motionProps}/></div>;
  if (id === "activationMenu") return <div className="signature ignition"><motion.span {...motionProps}/>{[0,1,2,3,4,5].map(i=><i key={i} style={{transform:`rotate(${i*60}deg) translateY(-54px)`}}/>)}</div>;
  if (id === "tomorrowParking") return <div className="signature parking"><div className="night-orbit"/><motion.div className="parked-note" {...motionProps}/></div>;
  return <div className="signature compress"><div/><div/><div/><motion.span {...motionProps}/></div>;
}

function Handoff({ rule, onAccept, onDismiss }) {
  if (!rule) return null;
  const target = FLAGSHIP_REGISTRY[rule.to];
  return <div className="mt-6 rounded-3xl border border-white/15 bg-white/[0.06] p-5 text-left">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--flag-accent)]">One relevant next option</p>
    <h3 className="mt-2 font-heading text-xl text-white">{target?.displayName || rule.to}</h3>
    <p className="mt-2 text-sm leading-relaxed text-white/70">{rule.reason}</p>
    <div className="mt-4 flex gap-2">
      <button onClick={onAccept} className="min-h-11 flex-1 rounded-full bg-[var(--flag-accent)] px-4 text-sm font-semibold text-slate-950">Begin with my consent</button>
      <button onClick={onDismiss} className="min-h-11 rounded-full border border-white/20 px-4 text-sm text-white/75">Not now</button>
    </div>
  </div>;
}

export default function FlagshipExperience({ intervention, answers, onComplete, onAttemptEvent, onExit }) {
  const id = intervention.id;
  const navigate = useNavigate();
  const a11y = useAccessibilityPrefs();
  const { speak, stop: stopVoice } = useGuideVoice();
  const restored = useMemo(() => {
    const active = getActiveFlagship();
    return active?.interventionId === id ? active : null;
  }, [id]);
  const [step, setStep] = useState(restored?.step || 0);
  const [data, setData] = useState(restored?.data || {});
  const [draft, setDraft] = useState(restored?.draft || "");
  const [handoffDismissed, setHandoffDismissed] = useState(false);
  const [narrationOn, setNarrationOn] = useState(answers?.audio === "yes");
  const screens = screensFor(id, data);
  const current = screens[Math.min(step, Math.max(0, screens.length - 1))];
  const isLast = step >= screens.length - 1;
  const meta = FLAGSHIP_REGISTRY[id];

  useEffect(() => {
    const state = { interventionId: id, step, data, draft, away: current?.kind === "away" };
    saveActiveFlagship(state);
    const persist = () => saveActiveFlagship(state);
    const onVisibility = () => { if (document.hidden) persist(); };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persist);
    return () => { document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("pagehide", persist); };
  }, [id, step, data, draft, current?.kind]);

  useEffect(() => {
    if (current?.kind === "action" && !draft) setDraft(current.defaultValue || "");
  }, [current, draft]);

  useEffect(() => {
    stopVoice();
    if (narrationOn && current) speak([current.prompt, current.body].filter(Boolean).join(" "));
    return stopVoice;
  }, [current, narrationOn, speak, stopVoice]);

  const setValue = (value) => {
    const keys = {
      nextAction: ["", "barrier", "action", "away", "status"], activationMenu: ["", "ignition", "action", "away", "status"],
      changeScene: ["", "scene", "away", "status"], testPrediction: ["", "prediction", "safeTest", "test", "away", "outcome", "completion"],
      factCheck: ["", "thought", "classification", "balanced", "completion"], thenWhat: ["", "eligibility", "frame", "meaning", "coping", "presentAction", "completion"],
      countermove: ["", "pull", "pullCheck", "trajectory", "action", "away", "status"], openChannel: ["", "closure", "barrier", "connectionSafety", "bridge", "message", "away", "status"],
      pulseShift: ["", "state", "position", "capacity", "movement", "destination", "away", "status"], tomorrowParking: ["urgency", "parkingItem", "complete"],
    }[id] || [];
    const key = current?.key || keys[step] || `step${step}`;
    const next = { ...data, [key]: value };
    if (current?.kind === "capture" || current?.kind === "action" || current?.kind === "message" || current?.kind === "coping") setDraft("");
    setData(next);
    rememberFlagshipEvent({ interventionId: id, options: { [key]: typeof value === "string" && value.length < 80 ? value : "captured" }, barrier: key === "barrier" ? value : undefined });
    routeSafety(key, value, next);
  };

  const routeSafety = (key, value, next) => {
    if (id === "thenWhat" && key === "eligibility") {
      if (value === "danger") { navigate("/support"); return; }
      if (value === "activated") { launch("grounding54321V2"); return; }
      if (value === "loop") { launch("urgeSurf"); return; }
    }
    if (id === "countermove" && key === "pullCheck" && value !== "avoid") {
      setData({ ...next, completionNote: value === "protect" ? "Choose safety rather than opposite action." : "Choose deliberate restoration without calling it avoidance." });
      setStep(screens.length - 1); return;
    }
    if (id === "openChannel" && key === "connectionSafety" && value !== "safe") {
      setData({ ...next, completionNote: "Not contacting is a valid, deliberate relational decision when safety or consent is uncertain." });
      setStep(screens.length - 1); return;
    }
    if (id === "pulseShift" && key === "state" && ["rest", "unsafe"].includes(value)) {
      setData({ ...next, completionNote: value === "rest" ? "Choose intentional restoration. Rest is not avoidance." : "Stop movement and seek appropriate support if symptoms are concerning." });
      setStep(screens.length - 1); return;
    }
    if (id === "testPrediction" && key === "safeTest" && value === "no") {
      setData({ ...next, completionNote: "Do not run this experiment. Choose reflection or appropriate professional guidance instead." });
      setStep(screens.length - 1); return;
    }
    if (id === "tomorrowParking" && key === "urgency" && value !== "park") {
      if (value === "support") navigate("/support");
      else onExit?.();
      return;
    }
    setStep((s) => Math.min(s + 1, screens.length - 1));
  };

  const launch = (targetId) => {
    recordHandoffDecision(id, targetId, "accepted");
    clearActiveFlagship(id);
    navigate("/reset", { replace: true, state: { prebuilt: true, pathway: [targetId], direction: FLAGSHIP_REGISTRY[targetId]?.primaryGoal || "calm", directionLabel: FLAGSHIP_REGISTRY[targetId]?.displayName, intensity: answers?.intensity || 5, whereFelt: "both", timeMin: 6, audio: answers?.audio || "yes" } });
  };

  const handoffContext = {
    ...data, completed: true, safelyTestable: data.safeTest === "yes" || data.safeTest === "smaller",
    distortedInterpretation: data.status === "partial", presentAction: data.presentAction,
    reassuranceLoop: data.eligibility === "loop", urgeToAnalyse: data.eligibility === "loop",
    relational: data.pull === "isolate" || data.pull === "silent", physicallyFlat: data.status === "couldnt",
    taskRelated: data.destination === "task" || data.barrier != null, moreMovement: data.status === "completed" || data.status === "partial",
    directActionTooDemanding: id === "countermove" && data.status === "couldnt",
    actionClear: id === "nextAction" && ["completed", "partial"].includes(data.status),
    wantsTimedSprint: id === "nextAction" && ["completed", "partial"].includes(data.status),
    parkedNow: id === "tomorrowParking" && !!data.parkingItem,
    audioAllowed: answers?.audio !== "no",
    reopenedNextDay: id === "tomorrowParking" && new Date().getHours() >= 6,
    distress: answers?.intensity, recentlyCompleted: [],
  };
  const handoff = handoffDismissed ? null : recommendHandoff(id, handoffContext);
  const evidence = evidenceFor(id);
  const experienceMeta = getInterventionAtmosphere(intervention, answers?.direction);
  const momentMeta = getInterventionMoment(intervention, current, step);

  const finish = () => {
    rememberFlagshipEvent({ interventionId: id, completed: data.status === "completed" || !data.status, partial: data.status === "partial", barriers: data.status === "couldnt" ? [data.barrier || "could-not-start"] : [] });
    if (id === "tomorrowParking" && data.parkingItem) {
      saveTomorrowParkingItem(data.parkingItem);
    }
    clearActiveFlagship(id);
    onAttemptEvent?.({ interventionId: id, mechanism: intervention.mechanism, action: "completed", completedPercentage: data.status === "partial" ? 0.65 : data.status === "couldnt" ? 0.25 : 1, timestamp: Date.now() });
    onComplete?.({ interventionId: id, data });
  };

  if (!current) return null;
  const needsText = ["capture", "action", "coping"].includes(current.kind);
  const message = current.kind === "message";
  const completionLike = ["completion", "parking-complete"].includes(current.kind) || (current.kind === "return" && !!data.status) || (isLast && !current.options);
  const statusLabel = data.status === "partial" ? "Partly completed is movement." : data.status === "couldnt" ? "This is information about the barrier, not a failure." : data.completionNote;

  const accent = id === "tomorrowParking" ? "#b9c7ff" : id === "countermove" ? "#ffcc78" : "#a6f0c1";
  return <InterventionControlShell
    id={id}
    goal={meta?.primaryGoal}
    title={meta?.displayName || intervention.name}
    stage={Math.min(3, Math.max(1, Math.ceil(((step + 1) / screens.length) * 3)))}
    onBack={() => step ? setStep(step - 1) : onExit?.()}
    onExit={onExit}
    onSimplify={() => setNarrationOn(false)}
    simplifyLabel="Use less guidance"
    onDifferent={onExit}
    audioOn={narrationOn}
    onAudio={() => setNarrationOn((on) => !on)}
    accent={accent}
    className={`flagship-shell flagship-${id} overflow-hidden`}
    field={<div className="pointer-events-none fixed inset-0 flagship-atmosphere" aria-hidden="true"/>}
  >
    <div className="mx-auto flex min-h-[calc(100dvh-170px)] w-full max-w-5xl flex-col px-5 pb-8 pt-3 sm:px-8">
      <div className="grid flex-1 items-center gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
        <div className="flex min-h-52 flex-col items-center justify-center gap-5">
          <SignatureVisual id={id} step={step} reducedMotion={a11y.prefs.reducedMotion}/>
          <div className="w-full max-w-sm rounded-[1.75rem] border border-white/12 bg-black/25 p-5 text-left shadow-2xl backdrop-blur-xl">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--flag-accent)]">{experienceMeta.purpose}</p>
            <p className="mt-2 text-sm font-medium text-white">{experienceMeta.signature}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/68">{experienceMeta.bestWhen}</p>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.section aria-live="polite" key={`${id}-${step}`} initial={a11y.prefs.reducedMotion ? {opacity:0} : {opacity:0,y:18}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="rounded-[2rem] border border-white/15 bg-[rgba(4,18,31,0.72)] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--flag-accent)]">{current.eyebrow || `${step + 1} / ${screens.length}`}</p>
            <h1 className="mt-3 font-heading text-3xl font-medium leading-tight sm:text-4xl">{current.prompt}</h1>
            {current.body && <p className="mt-4 text-base leading-relaxed text-white/70">{current.body}</p>}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--flag-accent)]">{momentMeta.phase}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/78">{momentMeta.cue}</p>
            </div>
            {current.kind === "intro" && evidence && <details className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/65"><summary className="cursor-pointer font-semibold text-white/80">Why this may help</summary><p className="mt-2 leading-relaxed">{evidence.psychoeducation}</p><p className="mt-2 text-xs text-white/45">Evidence fit: {evidence.evidenceGrade}</p></details>}
            {statusLabel && completionLike && <p className="mt-4 rounded-2xl bg-white/[0.07] p-4 text-sm text-white/75">{statusLabel}</p>}

            {current.options && <div className="mt-6 grid gap-2 sm:grid-cols-2">{current.options.map((opt)=><button key={opt.value} onClick={()=>setValue(opt.value)} className="min-h-14 rounded-2xl border border-white/15 bg-white/[0.06] p-4 text-left transition hover:border-[var(--flag-accent)] hover:bg-white/[0.1] focus:outline-none focus:ring-2 focus:ring-[var(--flag-accent)]"><span className="block font-medium">{opt.label}</span>{opt.hint&&<span className="mt-1 block text-xs text-white/55">{opt.hint}</span>}</button>)}</div>}

            {current.kind === "intro" && <button onClick={()=>setStep(step+1)} className="mt-6 min-h-12 w-full rounded-full bg-[var(--flag-accent)] px-5 font-semibold text-slate-950">Continue <ArrowRight className="ml-2 inline h-4 w-4"/></button>}

            {needsText && <div className="mt-6"><textarea aria-label={current.prompt} value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder={current.placeholder || "Edit this action..."} rows={4} className="w-full rounded-2xl border border-white/15 bg-black/20 p-4 text-base text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-[var(--flag-accent)]"/><p className="mt-2 text-xs text-white/45">Private active-state text: stored locally, never sent to analytics.</p><button disabled={!draft.trim()} onClick={()=>setValue(draft.trim())} className="mt-4 min-h-12 w-full rounded-full bg-[var(--flag-accent)] px-5 font-semibold text-slate-950 disabled:opacity-40">Continue <ArrowRight className="ml-2 inline h-4 w-4"/></button></div>}

            {message && <div className="mt-6"><div className="flex gap-2">{["Light","Honest","Direct"].map(t=><button key={t} onClick={()=>{setData({...data,tone:t.toLowerCase()});setDraft(t==="Light"?"Hey - I went quiet for a bit. No pressure, but I wanted to reopen the line.":t==="Honest"?"I pulled away and did not know how to explain it. I would like to reconnect in a way that feels manageable.":"I have been out of contact. I want to reopen communication, if that is welcome.")}} className="min-h-11 flex-1 rounded-full border border-white/15 text-sm">{t}</button>)}</div><textarea aria-label="Editable contact message" value={draft} onChange={(e)=>setDraft(e.target.value)} rows={4} className="mt-3 w-full rounded-2xl border border-white/15 bg-black/20 p-4 text-white focus:outline-none focus:ring-2 focus:ring-[var(--flag-accent)]"/><button disabled={!draft.trim()} onClick={()=>setValue("reviewed-locally")} className="mt-4 min-h-12 w-full rounded-full bg-[var(--flag-accent)] font-semibold text-slate-950 disabled:opacity-40">I reviewed the action</button></div>}

            {current.kind === "movement" && <div className="mt-6"><div className="rounded-2xl border border-[var(--flag-accent)]/30 bg-white/[0.05] p-5"><p className="text-sm font-semibold text-[var(--flag-accent)]">Accessible movement</p><p className="mt-2 text-white/80">{current.body}</p><p className="mt-3 text-xs text-white/50">Seated and low-mobility alternatives are valid. Stop or skip at any time.</p></div><button onClick={()=>setValue("movement-complete")} className="mt-4 min-h-12 w-full rounded-full bg-[var(--flag-accent)] font-semibold text-slate-950">Continue when ready</button></div>}

            {current.kind === "away" && <div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={()=>setStep(step+1)} className="min-h-12 rounded-full bg-[var(--flag-accent)] px-5 font-semibold text-slate-950">I am back</button><button onClick={onExit} className="min-h-12 rounded-full border border-white/20 px-5 text-white/75">Leave app now</button><p className="sm:col-span-2 text-xs leading-relaxed text-white/45">Your place stays saved on this device while you step away.</p></div>}

            {completionLike && <><Handoff rule={handoff} onAccept={()=>launch(handoff.to)} onDismiss={()=>{recordHandoffDecision(id,handoff.to,"dismissed");setHandoffDismissed(true)}}/><button onClick={finish} className="mt-5 min-h-12 w-full rounded-full bg-[var(--flag-accent)] px-5 font-semibold text-slate-950">Finish <Check className="ml-2 inline h-4 w-4"/></button></>}
          </motion.section>
        </AnimatePresence>
      </div>
    </div>
  </InterventionControlShell>;
}
