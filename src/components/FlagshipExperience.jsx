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
import { INTERACTIVE_EXPERIENCE_IDS, INTERACTIVE_FLAGSHIP_IDS, isInteractiveExperience, isInteractiveFlagship } from "@/lib/flagshipExperienceRouting";
import { getInterventionAtmosphere, getInterventionMoment } from "@/lib/interventionExperience";

export { INTERACTIVE_EXPERIENCE_IDS, INTERACTIVE_FLAGSHIP_IDS, isInteractiveExperience, isInteractiveFlagship };

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

function sighRouteFor(where, style) {
  const anchor = {
    chest: "drop the shoulders and let the chest soften on the out-breath",
    throat: "unclench the jaw, soften the tongue and keep the throat easy",
    stomach: "let the belly release instead of holding the breath high",
    whole: "let the whole body get a little heavier on the exhale",
  }[where] || "let the body soften a few percent on the exhale";
  const shape = {
    single: "Take one fuller inhale, then a long easy sigh out.",
    double: "Take a breath in, sip a little more air, then let a longer sigh leave slowly.",
    silent: "Take a quieter inhale and send the whole exhale out through relaxed lips.",
  }[style] || "Take one fuller inhale, then a long easy sigh out.";
  return `${shape} On each round, ${anchor}.`;
}

function move90RouteFor(position, style) {
  const start = {
    seated: "Stay seated and",
    standing: "From standing,",
    lying: "From where you are lying,",
    already: "Without overthinking it,",
  }[position] || "From where you are,";
  const action = {
    loosen: "roll the shoulders, open the chest and add easy arm movement for ninety seconds.",
    march: "march in place, shift weight or pace the room with a steady rhythm for ninety seconds.",
    cross: "use cross-body reaches or taps to wake up both sides of the body for ninety seconds.",
    shake: "shake out the hands, arms and upper body until the flatness breaks slightly.",
  }[style] || "add light movement for ninety seconds.";
  return `${start} ${action}`;
}

function sensoryWakeRouteFor(input) {
  return {
    cold: "Use a bright temperature cue: cool water on hands or face, a cold glass, or a cooler doorway for thirty to sixty seconds.",
    light: "Move toward brighter light, lift the gaze and let your eyes take in a little more contrast and distance.",
    sound: "Play one clear, energising sound or song and let the body respond to it for one minute.",
    scent: "Use the strongest clean scent available and pair it with one deliberate fuller inhale.",
    texture: "Wake up the hands with a textured object, quick rubbing, or firmer pressure against fabric or a wall.",
  }[input] || "Use one bright sensory cue that feels safe and noticeably different from the flat state.";
}

function feelingSupportFor(feeling) {
  return {
    anxious: "We are giving the feeling a name so your system does not have to hold it as unnamed alarm.",
    sad: "Sadness often softens when it is allowed to be precise instead of diffused through everything.",
    angry: "Naming anger can separate the signal from the impulse to act on it immediately.",
    hurt: "Hurt is easier to meet when it is recognised directly, without arguing with it.",
    ashamed: "Shame shrinks a little when it is brought into words instead of staying hidden and global.",
    tense: "Tension often carries emotion in the body before the mind finds language for it.",
    flat: "Flatness is still a real state. Naming it gives you something concrete to respond to.",
    numb: "Numb still counts as a feeling state. It often means your system is protecting itself.",
  }[feeling] || "Precision helps the feeling become more workable.";
}

function needRouteFor(need) {
  return {
    space: "Create ten minutes of less input: step away, lower noise, dim the screen or reduce demands.",
    comfort: "Add one grounded comfort cue: warmth, water, a blanket, slower breathing or a gentler posture.",
    action: "Choose one small real-world move that changes the situation by even one degree.",
    connection: "Pick one safe low-pressure signal toward another person, or choose supportive presence instead of explanation.",
    reassurance: "Write one steadying sentence you would believe from a wise, calm version of yourself.",
    movement: "Use one minute of matched movement: stretch, walk, sway, shake out tension or change rooms.",
    rest: "Protect a small pocket of genuine restoration without turning it into total shutdown.",
    clarity: "Capture the one sentence, task or question that would make the fog thinner.",
    expression: "Let the emotion leave a trace somewhere safe: voice note, notes app, tears, drawing or music.",
  }[need] || "Follow the first helpful thread rather than waiting for certainty.";
}

function basicsActionFor(need) {
  return {
    water: "Get a full glass of water and take a few steady sips before deciding anything else.",
    food: "Have the easiest available snack with protein or carbs - enough to signal fuel, not perfection.",
    air: "Open a window, step outside briefly or move toward cooler, fresher air if available.",
    bathroom: "Take the bathroom break now so your body is not carrying that signal in the background.",
    posture: "Change position, uncurl the body and give your shoulders, jaw and spine a small reset.",
    quiet: "Reduce one input source: headphones off, tabs closed, brightness lowered or notifications muted.",
    rest: "Choose a deliberate short reset - lie down, close your eyes or stop demanding output for a few minutes.",
  }[need] || "Tend to the first body need that is asking the loudest.";
}

function worryActionFor(type) {
  return {
    current: "Name one real-world next step, who will do it, and when it will happen.",
    future: "Label it hypothetical worry, decide there is no action right now, and return to the next real thing in front of you.",
    mixed: "Split the real problem from the what-if story, then take one action only on the part that exists now.",
  }[type] || "Choose the smallest useful response instead of staying in the loop.";
}

function scheduleActionFor(track) {
  return {
    pleasure: "Schedule one genuinely pleasant action with a specific day, time and place.",
    mastery: "Schedule one small action that creates capability, progress or order you can see.",
    connection: "Schedule one human contact, shared space or low-pressure signal toward another person.",
    care: "Schedule one act of physical care: food, movement, showering, sleep protection or going outside.",
  }[track] || "Schedule one small action that feels possible on a low-capacity day.";
}

function loopBreakFor(link) {
  return {
    activity: "Re-enter one tiny version of the dropped activity for two minutes only.",
    avoidance: "Approach the safest first edge instead of waiting to feel ready.",
    isolation: "Create one safe point of connection without forcing a whole conversation.",
    selfcare: "Restore one body-care action before asking your mind to do more.",
  }[link] || "Break one link in the loop with the lightest workable action.";
}

function frictionFixFor(friction) {
  return {
    missing: "Put the missing item in reach before you start.",
    unclear: "Reduce the job to the first visible action that could be done right now.",
    clutter: "Clear one palm-sized space or one visible distraction, not the whole area.",
    choices: "Choose one option and treat it as a draft, not a final decision.",
    interruptions: "Silence one alert or move one interrupting device out of reach.",
  }[friction] || "Remove one source of friction, then begin before optimising anything else.";
}

function screensFor(id, data) {
  const intro = (line, body) => ({ kind: "intro", eyebrow: "PREMIUM PRACTICE", prompt: line, body });
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
  if (id === "sigh") return [
    intro("Use the fastest off-ramp.", "This is a brief exhale-lengthening reset. We are not forcing deep breathing - only giving the body a clearer signal that the danger spike can come down."),
    { prompt: "Where does the tension feel loudest?", options: [choice("chest", "Chest"), choice("throat", "Jaw, throat or face"), choice("stomach", "Stomach or solar plexus"), choice("whole", "All over")] },
    { prompt: "What kind of sigh fits best here?", options: [choice("single", "Single long sigh"), choice("double", "Physiological sigh"), choice("silent", "Quiet discreet sigh")] },
    { kind: "action", prompt: "Take three slower off-ramps.", body: "Comfort matters more than size. Stop if breathing work makes you feel worse.", defaultValue: sighRouteFor(data.tensionArea, data.sighStyle) },
    { kind: "completion", prompt: "The body got a clearer safety cue.", body: "Even a small drop in pressure counts. The win is a little more room, not perfect calm." },
  ];
  if (id === "move90") return [
    intro("Wake the body before the mood.", "Movement can shift chemistry faster than waiting for motivation. Keep it simple and work with the body you have right now."),
    { prompt: "Where are you starting from?", options: [choice("seated", "Seated"), choice("standing", "Standing"), choice("lying", "Lying down"), choice("already", "Already moving a little")] },
    { prompt: "What movement style feels most believable?", options: [choice("loosen", "Loosen and open"), choice("march", "March or pace"), choice("cross", "Cross-body rhythm"), choice("shake", "Shake it out")] },
    { kind: "action", prompt: "Give it ninety seconds.", body: "The goal is a clean state shift, not a workout.", defaultValue: move90RouteFor(data.startPosition, data.moveStyle) },
    away("Carry the movement through.", "The app can stay behind you. Return after the ninety seconds to decide what the energy can serve."),
    returning("Did the movement create any more availability?", "More energy, more willingness, or even a little less heaviness all count."),
  ];
  if (id === "sensoryWake") return [
    intro("Brighten the input, not the pressure.", "When you feel foggy or flat, a sharper sensory cue can create enough contrast to wake the system back up."),
    { prompt: "Which sense feels easiest to wake up safely?", options: [choice("cold", "Temperature"), choice("light", "Light"), choice("sound", "Sound"), choice("scent", "Scent"), choice("texture", "Touch or texture")] },
    { kind: "action", prompt: "Use one clean sensory jolt.", body: "Keep it brief, safe and noticeable - not overwhelming.", defaultValue: sensoryWakeRouteFor(data.sensoryInput) },
    { prompt: "What should that extra brightness serve?", options: [choice("move", "Getting moving"), choice("task", "Starting a task"), choice("care", "Basic self-care"), choice("outside", "Changing rooms or going outside")] },
    { kind: "completion", prompt: "The flatness has been interrupted.", body: "Use the opened window quickly. The next small move matters more than analysing the feeling." },
  ];
  if (id === "nameFeeling") return [
    intro("Give the feeling edges.", "This is not about analysing yourself perfectly. It is about turning a blur into something your mind and body can work with."),
    { prompt: "Which word is closest right now?", body: "Pick the nearest fit, even if it is only roughly right.", options: [choice("anxious", "Anxious"), choice("sad", "Sad"), choice("angry", "Angry"), choice("hurt", "Hurt"), choice("ashamed", "Ashamed"), choice("tense", "Tense"), choice("flat", "Flat"), choice("numb", "Numb")] },
    { prompt: "How strong is it?", body: feelingSupportFor(data.feeling), options: [choice("low", "Low", "Present but manageable"), choice("medium", "Medium", "Noticeable and shaping the moment"), choice("high", "High", "Loud, heated or hard to ignore"), choice("mixed", "Mixed", "More than one feeling is active")] },
    { kind: "capture", prompt: "What touched it off, or what is underneath it?", body: "One short sentence is enough. You are naming context, not building a case.", placeholder: "It flared when..." },
    { kind: "completion", prompt: "Now the feeling is named.", body: "You do not have to solve it in this moment. A named state is easier to meet with the next right support." },
  ];
  if (id === "whatNeed") return [
    intro("Let the feeling point somewhere useful.", "Once a feeling is named, ask what would actually help. The answer does not need to be deep - it just needs direction."),
    { prompt: "What does this state need most?", options: [choice("space", "Space"), choice("comfort", "Comfort"), choice("action", "Action"), choice("connection", "Connection"), choice("reassurance", "Reassurance"), choice("movement", "Movement"), choice("rest", "Rest"), choice("clarity", "Clarity"), choice("expression", "Expression")] },
    { kind: "action", prompt: "Follow that thread with one concrete move.", body: "Keep it kind, specific and possible in the next few minutes.", defaultValue: needRouteFor(data.need) },
    away("Take the smallest version now.", "You can leave the app. This is about meeting the need in real life, not staying in the exercise."),
    returning("Did meeting the need help at all?", "Even slight relief counts - and useful information counts too."),
  ];
  if (id === "dontSendIt") return [
    intro("Protect the next ten minutes.", "When the message is hot, speed is the enemy. The job is not to decide everything now - only to stop an irreversible send."),
    { prompt: "What are you about to send or say?", options: [choice("text", "A text or DM"), choice("email", "An email"), choice("comment", "A comment or post"), choice("voice", "A voice note"), choice("live", "Something I want to say right now")] },
    { prompt: "What does the pause need to protect?", options: [choice("relationship", "The relationship"), choice("self", "Myself"), choice("clarity", "Clarity"), choice("consequences", "Future consequences")] },
    away("Put the message out of reach for two minutes.", "Lower the phone, unclench the jaw and let three long exhales finish before you decide anything."),
    { kind: "return", prompt: "What is the wiser next move?", body: "You can choose delay without composing the perfect reply.", options: [choice("wait", "Wait longer"), choice("edit", "Edit it later"), choice("delete", "Delete the draft"), choice("support", "Ask somebody safe to sense-check it")] },
  ];
  if (id === "checkBasics") return [
    intro("Check the body before the story.", "A surprising number of mental states are amplified by simple unmet needs. We are ruling out cheap fixes before doing heavier work."),
    { prompt: "What is the loudest basic need?", options: [choice("water", "Water"), choice("food", "Food"), choice("air", "Fresh air or temperature"), choice("bathroom", "Bathroom"), choice("posture", "Movement or posture"), choice("quiet", "Less noise or screen"), choice("rest", "Rest")] },
    { kind: "action", prompt: "Tend to that need first.", body: "Choose the smallest version that is available right now.", defaultValue: basicsActionFor(data.need) },
    away("Handle the body need now.", "The app can wait. Come back after you have actually done it, even if the shift is small."),
    returning("Did the state change after meeting the need?", "If not, that is useful too - it means the next reset can target something else with less guessing."),
  ];
  if (id === "orienting") return [
    intro("Rebuild the room around you.", "When alarm gets loud, your system narrows. We are widening it again with simple proof that this moment is here, specific and survivable."),
    { prompt: "Start with one stable anchor.", body: "Choose the first thing that feels easiest to orient around.", options: [choice("wall", "A wall, doorway or corner"), choice("light", "A light source or window"), choice("object", "A neutral object nearby"), choice("sound", "A steady sound in the room")] },
    { prompt: "What else is here?", body: "Let your eyes move slowly. You are collecting ordinary details, not hunting for danger.", options: [choice("three", "I can name three visible things"), choice("two", "I can find two so far"), choice("slow", "I need to go slower")] },
    { kind: "action", prompt: "Finish the orienting sequence.", body: "Use one steady line that proves where and when you are.", defaultValue: "Name three neutral things you can see, feel both feet or seat support, and say quietly: I am here, in this room, and this moment is passing." },
    { kind: "completion", prompt: "The room is back in view.", body: "You do not need to feel perfect. The goal is that the present moment is bigger than the alarm now." },
  ];
  if (id === "solvableWorry") return [
    intro("Sort the worry by what exists now.", "This is a worry-discrimination practice. We are separating present problems from future simulations so your effort goes to the right place."),
    { kind: "capture", prompt: "What exact worry is looping?", body: "One sentence only. Name the problem your mind keeps re-opening.", placeholder: "The worry is..." },
    { prompt: "What kind of worry is it?", options: [choice("current", "Current problem", "There is something real to act on now"), choice("future", "Hypothetical worry", "Mostly a what-if about the future"), choice("mixed", "Mixed", "Part real problem, part imagined spiral")] },
    { kind: "action", prompt: "Choose the right response for that kind of worry.", body: "The aim is direction, not certainty.", defaultValue: worryActionFor(data.worryType) },
    { kind: "completion", prompt: "The worry has been sorted.", body: "A present problem gets action. A hypothetical worry gets containment. You do not have to solve both at once." },
  ];
  if (id === "activityScheduling") return [
    intro("Turn motivation into an appointment.", "Mood shifts less from intentions than from contact with scheduled, concrete actions. We are building one activity your future self can actually enter."),
    { prompt: "What kind of activity would help most?", options: [choice("pleasure", "Pleasure"), choice("mastery", "Mastery"), choice("connection", "Connection"), choice("care", "Physical care")] },
    { kind: "action", prompt: "Write the smallest version worth scheduling.", body: "Shrink it until it still matters and still feels doable on a low-energy day.", defaultValue: scheduleActionFor(data.activityTrack) },
    { prompt: "What is the main follow-through risk?", options: [choice("energy", "Low energy"), choice("time", "Time gets swallowed"), choice("avoidance", "I dodge it when the time comes"), choice("forget", "I simply forget")] },
    { kind: "completion", prompt: "Now make it real outside the app.", body: "Put it in a calendar, reminder, note or visible place. Premium change comes from a scheduled real-world cue, not just a good idea." },
  ];
  if (id === "lowMoodLoop") return [
    intro("Find the loop, not your flaw.", "Low mood often becomes self-reinforcing through avoidance, isolation and shrinking life. We are looking for one break point, not a total transformation."),
    { prompt: "Which link in the loop is loudest right now?", options: [choice("activity", "Dropped activities"), choice("avoidance", "Avoiding what feels heavy"), choice("isolation", "Withdrawing from people"), choice("selfcare", "Basic care has slipped")] },
    { prompt: "What keeps that link appealing in the moment?", options: [choice("relief", "It gives quick relief"), choice("protection", "It feels protective"), choice("numb", "It asks less of me"), choice("habit", "It has become automatic")] },
    { kind: "action", prompt: "Choose the lightest loop-breaker.", body: "We only need a safe two-minute break in the pattern.", defaultValue: loopBreakFor(data.loopLink) },
    returning("Did that move widen the day at all?", "Even a slight change in direction matters more than a sudden change in mood."),
  ];
  if (id === "frictionSweep") return [
    intro("Make starting easier than drifting.", "Focus problems often live in the environment as much as in the mind. We are clearing one obstacle and one competing cue before asking for willpower."),
    { prompt: "What is the first friction?", options: [choice("missing", "Something I need is missing"), choice("unclear", "The first step is unclear"), choice("clutter", "Clutter or setup is in the way"), choice("choices", "Too many choices"), choice("interruptions", "Alerts or interruptions")] },
    { kind: "action", prompt: "Remove that first friction.", body: "One small environmental move is enough.", defaultValue: frictionFixFor(data.frictionType) },
    { prompt: "What else is likely to pull you off track?", options: [choice("phone", "Phone or messages"), choice("tabs", "Too many tabs or windows"), choice("noise", "Noise or people"), choice("self", "My own urge to switch away")] },
    { kind: "completion", prompt: "Start before you improve the rest.", body: "The premium move is to begin the task now while the runway is briefly clear." },
  ];
  return [];
}

function SignatureVisual({ id, step, reducedMotion }) {
  const motionProps = reducedMotion ? {} : { animate: { scale: [1, 1.05, 1], opacity: [0.6, 1, 0.6] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } };
  if (id === "countermove") return <div className="signature gravity"><div className="gravity-mass"/><motion.div className="trajectory t1" {...motionProps}/><div className="trajectory t2"/><div className="moving-point"/></div>;
  if (id === "openChannel") return <div className="signature channel"><div className="channel-point left"/><div className="channel-bridge">{[0,1,2,3].map(i=><span key={i}/>)}</div><div className="channel-point right"/></div>;
  if (id === "pulseShift") return <div className="signature pulse">{[0,1,2,3].map(i=><motion.span key={i} style={{animationDelay:`${i*.35}s`}} {...motionProps}/>)}</div>;
  if (id === "sigh") return <div className="signature pulse">{[0,1,2].map(i=><motion.span key={i} style={{animationDelay:`${i*.45}s`}} {...motionProps}/>)}</div>;
  if (id === "move90") return <div className="signature gravity"><div className="gravity-mass"/><motion.div className="trajectory t1" {...motionProps}/><div className="trajectory t2"/><div className="moving-point"/></div>;
  if (id === "sensoryWake") return <div className="signature ignition"><motion.span {...motionProps}/>{[0,1,2,3,4].map(i=><i key={i} style={{transform:`rotate(${i*72}deg) translateY(-54px)`}}/>)}</div>;
  if (id === "thenWhat") return <div className="signature timeline">{[0,1,2,3,4].map((i)=><span key={i} className={i <= Math.min(4, step) ? "active" : ""}/>)}</div>;
  if (id === "testPrediction") return <div className="signature experiment"><div>PREDICTION</div><span/><div>OBSERVATION</div></div>;
  if (id === "factCheck") return <div className="signature sorting"><span>FACT</span><span>MEANING</span><span>NEXT</span></div>;
  if (id === "changeScene") return <div className="signature doorway"><motion.div {...motionProps}/></div>;
  if (id === "activationMenu") return <div className="signature ignition"><motion.span {...motionProps}/>{[0,1,2,3,4,5].map(i=><i key={i} style={{transform:`rotate(${i*60}deg) translateY(-54px)`}}/>)}</div>;
  if (id === "tomorrowParking") return <div className="signature parking"><div className="night-orbit"/><motion.div className="parked-note" {...motionProps}/></div>;
  if (id === "nameFeeling") return <div className="signature sorting"><span>NAME</span><span>INTENSITY</span><span>TRIGGER</span></div>;
  if (id === "whatNeed") return <div className="signature ignition"><motion.span {...motionProps}/>{[0,1,2,3,4].map(i=><i key={i} style={{transform:`rotate(${i*72}deg) translateY(-54px)`}}/>)}</div>;
  if (id === "dontSendIt") return <div className="signature channel"><div className="channel-point left"/><div className="channel-bridge">{[0,1,2,3].map(i=><span key={i}/>)}</div><div className="channel-point right"/></div>;
  if (id === "checkBasics") return <div className="signature pulse">{[0,1,2].map(i=><motion.span key={i} style={{animationDelay:`${i*.4}s`}} {...motionProps}/>)}</div>;
  if (id === "orienting") return <div className="signature doorway"><motion.div {...motionProps}/></div>;
  if (id === "solvableWorry") return <div className="signature sorting"><span>WORRY</span><span>REAL</span><span>NEXT</span></div>;
  if (id === "activityScheduling") return <div className="signature ignition"><motion.span {...motionProps}/>{[0,1,2,3].map(i=><i key={i} style={{transform:`rotate(${i*90}deg) translateY(-54px)`}}/>)}</div>;
  if (id === "lowMoodLoop") return <div className="signature timeline">{[0,1,2,3].map((i)=><span key={i} className={i <= Math.min(3, step) ? "active" : ""}/>)}</div>;
  if (id === "frictionSweep") return <div className="signature compress"><div/><div/><motion.span {...motionProps}/><div/></div>;
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
      sigh: ["", "tensionArea", "sighStyle", "action", "completion"], move90: ["", "startPosition", "moveStyle", "action", "away", "status"],
      sensoryWake: ["", "sensoryInput", "action", "destination", "completion"],
      nameFeeling: ["", "feeling", "intensityBand", "trigger", "completion"], whatNeed: ["", "need", "action", "away", "status"],
      dontSendIt: ["", "channel", "protection", "away", "status"], checkBasics: ["", "need", "action", "away", "status"],
      orienting: ["", "anchor", "scope", "action", "completion"],
      solvableWorry: ["", "worry", "worryType", "action", "completion"], activityScheduling: ["", "activityTrack", "action", "risk", "completion"],
      lowMoodLoop: ["", "loopLink", "loopRelief", "action", "status"], frictionSweep: ["", "frictionType", "action", "driftRisk", "completion"],
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
  const completed = data.status === "completed"
    || !data.status
    || (id === "dontSendIt" && ["wait", "edit", "delete", "support"].includes(data.status));

  const finish = () => {
    rememberFlagshipEvent({ interventionId: id, completed, partial: data.status === "partial", barriers: data.status === "couldnt" ? [data.barrier || "could-not-start"] : [] });
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

  const accent = {
    tomorrowParking: "#b9c7ff",
    countermove: "#ffcc78",
    sigh: "#a7d8ff",
    move90: "#ffd28a",
    sensoryWake: "#ffe2a8",
    nameFeeling: "#f4b0d8",
    whatNeed: "#c8b8ff",
    dontSendIt: "#ffb38c",
    checkBasics: "#9ee4d8",
    orienting: "#8ed9ff",
    solvableWorry: "#f1c77f",
    activityScheduling: "#9fddff",
    lowMoodLoop: "#ffb8a5",
    frictionSweep: "#b8f0c8",
  }[id] || "#a6f0c1";
  return <InterventionControlShell
    id={id}
    goal={meta?.primaryGoal || answers?.direction || intervention?.directions?.[0]}
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
