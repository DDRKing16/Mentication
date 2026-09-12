# Mentication Shared Intervention Control Shell

Version 1.0 — canonical functional shell for all intervention experiences.

## 1. Purpose

The shared shell gives every intervention the same safety, navigation, accessibility and adaptation grammar while allowing the central experience to look and behave differently.

The shell should feel quiet and almost architectural. It does not compete with the intervention’s signature object or motion, but it is always understandable under stress, fatigue or reduced attention.

## 2. Core principles

1. **Stable positions:** controls do not move unpredictably between interventions.

2. **Progressive disclosure:** only controls useful in the current state are visible.

3. **One dominant action:** every active screen has one clear primary action.

4. **Immediate agency:** Pause, Stop and This Is Not Helping never require searching through settings.

5. **No lost work:** pausing, adapting or handing off preserves relevant user input.

6. **No performance pressure:** progress shows orientation, not scores, streaks or productivity.

7. **Accessible equivalence:** every expressive gesture has a tap, screen-reader and reduced-motion route.

## 3. Visual character

The shell uses **adaptive glass**:

- a translucent neutral surface;

- subtle tint from the intervention’s signature palette;

- high-contrast foreground labels and icons;

- restrained border and shadow;

- no heavy blur behind essential text;

- no meaning communicated by tint alone.

The shared shell keeps one consistent type system, icon family, spacing scale, corner logic and state treatment. Intervention artwork may use radically different materials.

### Functional colour roles

- **Primary action:** high-contrast ivory or intervention-neutral light surface.

- **Selected state:** border, check mark and text weight; colour is secondary.

- **Adaptation:** calm blue or neutral outline.

- **Stop/exit:** neutral by default, clear coral only when risk or destructive loss is relevant.

- **Safety/support:** high-contrast dedicated treatment with icon and explicit label.

Functional colours must not change meaning between interventions.

## 4. Canonical layout

~~~text
┌──────────────────────────────────────┐
│ EXIT        STAGE / ORIENTATION   ⋯  │  Header
│                                      │
│                                      │
│        SIGNATURE EXPERIENCE          │  Experience stage
│                                      │
│                                      │
│     Contextual instruction/choice    │
│                                      │
│     THIS IS NOT HELPING              │  Persistent escape
│                                      │
│  [secondary]      [PRIMARY ACTION]   │  Action zone
│                                      │
│  PAUSE  AUDIO  GUIDE  ADAPT  STOP    │  Control dock when active
└──────────────────────────────────────┘
~~~

Not every control is shown at once. The positions remain stable when a control is applicable.

## 5. Shell regions

### 5.1 Header

**Left:** Exit or Back.

- Before the core mechanism begins, Back returns to the previous setup step.

- During an active guided mechanism, the same position becomes Exit; tapping it pauses the intervention before leaving.

- Exit never silently deletes user-entered text or a saved return point.

**Centre:** optional stage orientation.

- Use a short stage name or discreet dots only when they help the user know where they are.

- Do not show completion percentages.

- Do not imply that more screens means better progress.

**Right:** More/Accessibility.

- Opens text size, reduced motion, haptics, captions and input alternatives.

- Essential Pause, Stop and This Is Not Helping controls do not live only inside this menu.

### 5.2 Experience stage

The centre is owned by the intervention’s signature system. It contains one dominant focal object and one main psychological job.

Native text and controls sit above artwork as responsive UI. Essential information is never baked into images.

### 5.3 Context line

One concise instruction, question or piece of psychoeducation may appear beneath or beside the focal object.

Rules:

- one instruction at a time;

- maximum two short lines at default text size where possible;

- no safety-critical information through audio alone;

- disappears when silence is part of the mechanism;

- expands cleanly with larger text.

### 5.4 Persistent escape

**This Is Not Helping** remains reachable throughout active interventions.

It may appear as a quiet text button or control-dock item, but never disappears into a secondary menu.

One tap:

1. pauses animation, timer, narration, soundscape and haptics;

2. preserves the current state;

3. opens a mechanism-specific adaptation sheet.

### 5.5 Action zone

The lowest main-content region contains:

- one primary action;

- at most one visible secondary action;

- optional tertiary text action below.

Primary and secondary actions must not swap positions unexpectedly between consecutive screens.

### 5.6 Active control dock

The dock appears only during guided, timed or playback states.

Canonical order:

~~~text
PAUSE     AUDIO     GUIDANCE     ADAPT     STOP
~~~

Controls that do not apply are omitted without reordering the remaining controls. Empty space is acceptable.

The dock may dim after inactivity but must return on one tap anywhere safe. Screen readers continue to expose it.

## 6. Canonical control behaviour

### Pause

Pause is immediate.

- stop motion at a stable frame;

- pause timer and native playback;

- stop haptic sequencing;

- retain the current step and user input;

- show Resume, Adapt and Stop.

Pausing is not recorded as failure.

### Audio

Audio opens a compact sheet with independent controls for:

- narration;

- background sound;

- cue sounds;

- captions/transcript;

- device-appropriate volume guidance.

The app must not imply it can control audio playing in an external app unless a supported integration actually permits this.

### Guidance

Guidance uses three understandable levels:

- **Full:** narration, text and timing prompts.

- **Light:** essential prompts only.

- **Minimal:** visual mechanism and safety controls only.

Changing guidance does not restart the intervention.

### Adapt

Adapt opens only relevant transformations, such as:

- shorter;

- easier;

- slower;

- less movement;

- skip this area;

- different route;

- use text instead;

- use taps instead.

The first recommended adaptation reflects the current mechanism, not a generic menu order.

### Stop

Stop ends the active mechanism immediately.

- It does not demand a completion rating.

- It may offer Save Return Point when useful.

- It presents a safety route only when relevant.

- It returns to the originating goal without forcing a new intervention.

### This Is Not Helping

The adaptation sheet uses this order:

1. easiest in-place adjustment;

2. different mechanism;

3. stop;

4. support option when relevant.

Examples:

- Box Breathing → remove holds, slow guidance, Ground instead.

- PMR → release only, skip area, non-body Calm route.

- Thought or Fact → stop analysing, Ground, address the real problem.

- Urge Surfing → leave trigger, Ground, contact support.

- Signal Lock → hide time, reduce target, use Next Easiest Step.

## 7. Shell states

The shell follows a shared state model:

~~~text
SETUP
  ↓
READY
  ↓
ACTIVE ↔ PAUSED
  ↓       ↓
ADAPTING  STOPPED
  ↓
ACTIVE
  ↓
OUTCOME
  ↓
FINISHED · SAVED · HANDOFF · SUPPORT
~~~

### Setup

Collect only information that changes the route.

Visible controls: Back/Exit, Accessibility, primary setup action.

### Ready

Summarise what will happen and provide Begin. Skip this state if the mechanism can safely start directly.

### Active

Expose the active dock and persistent escape. Prevent device sleep only when the experience requires the screen.


### Paused

Freeze the mechanism and show Resume, Adapt and Stop. Do not cover the entire screen with an alarming modal.

### Adapting

Use a bottom sheet or inline transformation that preserves visual context. Applying an adaptation returns to the same point where possible.

### Outcome

Ask one mechanism-specific question. Generic mood ratings are secondary and optional.

### Finished

Offer Finish, optional Save, or one relevant next route. Avoid recommendation carousels.

### Handoff

Explain why the next mechanism may fit and exactly what information will carry forward.

### Support

Replace the expressive interface with a clear, high-contrast support state. Safety information takes priority over visual immersion.

## 8. Five shell profiles

The same shell adapts through five approved profiles.

### 8.1 Guided immersive

Used by: Box Breathing, PMR, Urge Surfing, 5–4–3–2–1 Grounding.

Visible during active use:

- Pause;

- Audio;

- Guidance;

- Adapt;

- Stop;

- This Is Not Helping.

Progress uses named phases or discreet stage markers.

### 8.2 Reflective

Used by: Thought or Fact, Then What?, Test the Prediction.

Visible:

- Exit;

- Undo/Edit where relevant;

- Guidance;

- This Is Not Helping;

- Save only at meaningful points.

No permanent Pause control is needed when nothing is moving or timed. User text remains editable.

### 8.3 Action pathway

Used by: Ignition Point, Change the Scene, Open Channel, Countermove, Pulse Shift, Reroute, Next Easiest Step.

Visible:

- Exit;

- Make It Easier or Adapt;

- Different Route;

- Save Return Point before leaving the app;

- This Is Not Helping.

External handoff is visually distinct from completing an action inside Mentication.

### 8.4 Focus/timed

Used by: Signal Lock.

Visible:

- Pause;

- Capture Distraction;

- Audio;

- Hide/Show Time;

- Stop Deliberately.

Stopping deliberately is an honest outcome, not a failed timer.

### 8.5 Sleep

Used by: Tomorrow Parking Lot and Night Channel.

Rules:

- lowest visual luminance;

- no bright modal sheets;

- no completion celebration;

- no unsolicited next intervention;

- controls disappear quickly but remain accessible;

- Stop, Pause and lock-screen behaviour are explicit;

- feedback waits until daytime.

Tomorrow Parking Lot uses a minimal containment profile rather than an active dock. Night Channel uses a playback dock.

## 9. Mechanism-specific outcome panel

The panel contains:

1. one primary question;

2. three to six honest outcomes;

3. optional note;

4. Finish;

5. optional Save or one relevant handoff.

It must support unchanged, partial, stopped and support-needed outcomes where relevant.

It must not:

- preselect a positive answer;

- animate a reward before the user answers;

- translate completion into symptom improvement;

- require text explanation;

- show a generic streak.

## 10. Handoff card

Canonical structure:

**What changed:** one sentence based on explicit user input.

**Why this may fit better:** one sentence naming the new mechanism.

**What will carry over:** visible list of fields.

Actions:

- Continue with the suggested intervention.

- Choose a different route.

- Finish here.

No intervention starts automatically after a handoff.

## 11. External-app handoff

Before opening another app, show:

- destination app or service;

- action the user intends to take;

- content copied or linked;

- whether Mentication can detect a return;

- saved return point;

- Cancel and Open App.

Never claim an external action was completed merely because the destination app opened.

## 12. Interruption and resume

If interrupted by a call, backgrounding or app closure:

- pause native timers, audio, animation and haptics where appropriate;

- preserve safe local state;

- never resume sound or intense motion unexpectedly;

- on return, show Resume, Restart Smaller or Finish;

- do not resume safety-sensitive instructions mid-step without reorientation.

Sleep playback follows the explicitly selected background-playback setting.

## 13. Accessibility behaviour

The shell must pass these conditions independently of intervention artwork:

- text scales and reflows without overlapping the focal object;

- focus order follows Header → Experience → Context → Actions → Dock;

- controls have text labels, not icons alone;

- touch targets meet the platform’s accessible minimum;

- selection uses icon, label and shape as well as colour;

- reduced motion can be changed before or during an intervention;

- gesture alternatives are offered at the point of use;

- paused and dimmed controls remain perceivable at increased contrast;

- the support state is readable without sound, animation or haptics.

## 14. Component architecture for later coding

The shell should be implemented as reusable components rather than copied layouts:

- InterventionShell
- ShellHeader
- StageOrientation
- ExperienceStage
- ContextPrompt
- ActionZone
- ControlDock
- AudioSheet
- GuidanceSheet
- AdaptationSheet
- NotHelpingSheet
- PauseState
- OutcomePanel
- HandoffCard
- ExternalHandoff
- SupportState
- ResumeState

Each intervention supplies configuration, content and its signature experience component. It does not redefine the shell’s safety or navigation behaviour.

## 15. Shell configuration contract

Each intervention declares:

~~~text
profile
availableControls
primaryAction
secondaryAction
notHelpingOptions
adaptations
progressStyle
audioCapabilities
backgroundBehaviour
outcomeQuestion
validOutcomes
handoffs
memoryEvents
accessibilityAlternatives
~~~

Unsupported controls are omitted, not simulated.

## 16. Approval checklist

- [ ] Exit is always discoverable.
- [ ] The primary action is visually dominant.
- [ ] This Is Not Helping is reachable during the active mechanism.
- [ ] Pause and Stop act immediately when present.
- [ ] Adaptation preserves state.
- [ ] Outcome language is mechanism-specific.
- [ ] Handoffs show what information carries over.
- [ ] External actions are not falsely marked complete.
- [ ] Reduced motion and gesture alternatives are available in context.
- [ ] Text scaling and screen-reader order are verified.
- [ ] Sleep states avoid bright interruptions and bedtime feedback.
- [ ] The intervention uses one of the five approved profiles.
- [ ] The central artwork remains distinct while the shell remains recognisable.

The shared shell is approved only when the same control behaviour can be demonstrated across at least one intervention from each of the five profiles.

