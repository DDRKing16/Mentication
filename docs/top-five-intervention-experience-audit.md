# Mentication Top-Five Intervention Experience Audit

Audit date: 2026-09-06

## Scope and method

This audit reviews the complete active Core 25 library against the approved
intervention boards, the Elite Intervention Standard, the actual coded state
machines and a live 390 x 844 mobile walkthrough.

- 25 interventions reviewed.
- 143 rendered states captured.
- Every coded screen and safety branch reviewed in source.
- Zero runtime exceptions or horizontal-overflow failures were found.
- Functional correctness was not treated as evidence of product quality.

The target is not merely attractive UI. A top-five experience must make the
therapeutic mechanism tangible, give choices visible consequences, create a
distinct sensory identity, reach the useful action quickly, produce an honest
payoff and remain equally usable in reduced-motion, silent and low-motor modes.

## Executive verdict

The user's criticism is correct. The implementation is substantially below the
quality of the approved boards.

Box Breathing, Progressive Muscle Relaxation and 5-4-3-2-1 Grounding are the
only credible quality foundations. Even these need refinement before they meet
the final standard. Signal Lock contains useful functional depth, and several
other flagships contain good clinical sequencing, but their experience design
is not yet premium.

The principal implementation error was allowing shared engineering to become
shared presentation. Thirteen flagships use a nearly identical atmospheric
background, small symbolic ornament, glass text card and option grid. Eight
supporting interventions are passive timed slides in the generic reset player.
The result is clinically literate content presented as interchangeable forms.

## Library-wide changes required

1. Keep the shared shell only for navigation, safety, accessibility, narration
   and state persistence. It must recede visually behind each intervention.
2. Remove the repeated `large glass card + text + option grid` as the dominant
   interaction model.
3. Replace passive instructions with direct manipulation of the therapeutic
   mechanism: sorting, tracing, compressing, opening, balancing, moving,
   sealing, tuning or orienting.
4. Make at least one user choice materially alter later visuals, timing,
   guidance or available actions in every intervention.
5. Remove the generic post-intervention `How are you now?` and `One last
   reflection` sequences where they do not measure the mechanism.
6. Give every intervention one unmistakable material, motion verb, spatial
   behaviour and audio identity. A user should recognise it without its title.
7. Use progressive disclosure. The first meaningful action should normally
   occur within ten seconds; psychoeducation belongs behind `Why this may help`.
8. Build real Immediate, Standard and Supported routes where the approved
   contract specifies them.
9. Produce layered, component-ready visual assets. Phone mockups remain design
   references; text, controls and state changes must be native responsive UI.
10. Make sound, haptics and motion reinforce the mechanism rather than adding a
    generic ambient layer. Every expressive interaction requires an equivalent
    reduced-motion, silent and tap-based route.

## Intervention change register

### Calm

#### 1. Cyclic Sighing & Extended Exhale — complete experience rebuild

**Current failure:** Four useful instructions are reduced to a generic ring,
timer and Next button. The double inhale is not visually or physically distinct
from ordinary paced breathing, and the generic outcome screen measures the
wrong thing.

**Required experience:** Build a responsive two-stage breath object: the first
inhale expands the main chamber, the second sip creates a small upper bloom and
the long exhale releases a visible stream. Offer one, three or five cycles; let
the user soften or stop the pace in place; use restrained phase haptics and an
optional exhale tone. End by asking about breathing comfort, chest/shoulder
release or whether the pace felt usable—not generic mood.

#### 2. Box Breathing — benchmark refinement

**Keep:** The emerald Breath Loom, perimeter pacing, narration and immersive
spatial field.

**Required changes:** Add the approved comfort gate and standard/no-hold choice
before pacing. Let holds be removed, timing slowed and guidance reduced without
restarting. Make the square itself carry instruction and progress so text does
not cover the experience. Replace the generic reset debrief with breathing
comfort and usable-attention outcomes. Preserve a fully static four-edge
alternative with identical timing information.

#### 3. Progressive Muscle Relaxation — benchmark refinement

**Keep:** The body map, regional tense/release contrast and existing body-state
assets.

**Required changes:** Make the suitability check and Immediate, Standard,
Supported and release-only routes visible before the first tense. Let the user
tap a body region directly, see tension gather and release through that region,
skip any area without penalty and compare before/after locally. The ending
should preserve a subtle body map of what softened and what remains, not send
the user into a generic intensity flow.

#### 4. Thought or Fact? — major experience rebuild

**Current failure:** The approved Mind Court/evidence-desk world has been
collapsed into three labels above another glass questionnaire. The user chooses
a category but does not actually sort or inspect the thought.

**Required experience:** Restore the softened Mind Court visual system. Place
the captured thought on an editable evidence card; allow words or clauses to be
sorted into Fact, Interpretation, Prediction and Catastrophe trays; reveal
certainty and missing-information weight visually; let evidence cards rebalance
the working view. The final output is an editable provisional ruling with a
visible uncertainty margin and optional route to Test the Prediction—not a
correct/incorrect verdict.

#### 5. Solvable or Hypothetical Worry? — complete experience rebuild

**Current failure:** This is four timed paragraphs. It asks the user to perform
the entire discrimination and planning process away from the interface.

**Required experience:** Capture one worry into a movable token and route it at
a clear fork: `current problem` or `future what-if`. The solvable route opens a
three-part action strip—next action, owner and time. The hypothetical route
places the worry into a bounded return container and brings a present anchor
forward. Uncertainty should remain a valid middle route. End with either a real
action card or visibly contained worry, with local edit/delete controls.

#### 6. Urge Surfing — major experience rebuild

**Current failure:** The app describes a wave while the user watches a generic
visual and timer. The board's Choice Window and wave-tracking interaction are
missing, so non-action does not feel active or rewarding.

**Required experience:** Start with danger/trigger exits, then let the user
choose a 60-second, 90-second or Supported window. Use a full-screen responsive
wave that the user traces or follows with a tap-based alternative. Record a
small number of non-judgmental intensity points so the wave redraws from their
experience rather than pretending biology follows a fixed curve. Make the
expanding Choice Window the payoff: act, wait, leave the trigger or seek
support. An unchanged or stronger urge must remain visually valid.

#### 7. Then What? — major experience rebuild

**Current failure:** A row of dots and repeated text forms replace the approved
cinematic continuation concept. The bounded five-node coping route is entered
into one textarea and produces no meaningful visual result.

**Required experience:** Put the feared frozen frame inside a dark, softly
cropped film cell. The user moves the filmstrip forward one frame at a time to
reveal First Move, First Person, First Resource, What Remains and What Happens
Next. Each answer should populate the next frame and visibly reduce the frozen
frame's dominance without erasing it. Finish on a compact coping-route strip
that can be saved deliberately. Detect reassurance looping and stop the film
rather than encouraging more analysis.

### Lift

#### 8. Ignition Point — major experience rebuild

**Current failure:** Pleasure, Mastery, Connection and Dream are ordinary
buttons around a generic glowing ornament. The chosen pathway changes one line
of suggested text but does not create discovery, personalisation or ignition.

**Required experience:** Create four visually distinct energy territories that
belong to one system: Pleasure glows, Mastery assembles, Connection links and
Dream reveals a distant path. Ask only constraints that change suggestions—
energy, access, time, cost and location. Let the user browse a small deck,
reject, edit or create an option, then scale it by dragging it toward current
capacity. The first real-world action should visibly ignite the selected route.
On return, collect reachability and worthwhileness separately and save only with
consent.

#### 9. Countermove — major experience rebuild

**Current failure:** The excellent gravitational-trajectory board is represented
by a small static orbital doodle above forms. A 5°, 20° or 45° choice does not
feel spatial and stronger options appear implicitly better.

**Required experience:** Make the gravitational pull the whole stage. After the
user confirms protection, restoration or avoidance, let them drag a point onto
one of three trajectories. All trajectories reach a valid changed direction;
their energy cost, not quality, differs. Generate an editable countermove on the
chosen path, and let `Make it lighter` physically bend it closer. On return,
show whether the situation widened and build Direction Memory only from
repeated, confirmed outcomes.

#### 10. Open Channel — major experience rebuild

**Current failure:** A tiny dotted bridge and a generic message form do not
deliver the emotional or visual promise of reopening a channel. Tone buttons
replace a genuine staged reconnection experience.

**Required experience:** Use two distant signal points and a broken luminous
channel. Safety or no-contact choices should deliberately close/protect the
channel with equal dignity. Signal, Reopen, Repair, Ask and Presence should form
different bridge shapes and different action builders. The user's wording must
appear inside the channel, with edits changing signal clarity in real time.
Provide honest external handoff buttons to copy/open the chosen communication
route; never imply sending. The payoff is a deliberate bridge decision, not a
reply.

#### 11. Pulse Shift — major experience rebuild

**Current failure:** Four pulsing dots and one block of movement copy replace
the position-aware embodied sequence. Lying, seated, standing and moving routes
barely alter the visual or choreography.

**Required experience:** Use a neutral position-aware figure or abstract body
constellation. Selecting the starting posture should recompose the figure;
Flicker, Pulse and Surge should alter rhythm and movement range without ranking
them. Guide several short bilateral or joint-specific movements with visual
echoes and optional haptics. The generated energy then travels into the user's
chosen real-world destination. Persistent pain/dizziness/rest exits must remain
visible throughout.

#### 12. Test the Prediction — major experience rebuild

**Current failure:** Prediction and observation are two static words. The
forecast, eligibility logic, observable criteria and post-test learning are
mostly free text, so the behavioural experiment does not feel like an
experiment.

**Required experience:** Restore the forecast lens. Capture a precise prediction
and confidence from 0–100, run the safety/eligibility gate, then assemble a fair
test from draggable Action, Support and Observe pieces. Preview the complete
experiment card before leaving. On return, place observation beside forecast,
support confirming, disconfirming, mixed and unanswered evidence equally, then
re-rate confidence. Save a visual Reality Record only when requested.

#### 13. Change the Scene — major experience rebuild

**Current failure:** The board's threshold journey and polished route screens
have become a small doorway icon and four buttons. Crossing into another place
causes no visual transition, and the arrival/sensory lens is missing.

**Required experience:** Make the threshold full-screen. Turn, doorway, room and
outside create different symbolic routes using the approved assets. Preview
distance, safety and effort; then animate a real crossing with a tap alternative
to movement/hold gestures. On arrival, the interface should visibly change
light, depth and ambient texture and ask the user to discover one actual
difference. Finish by revealing what behaviour the new setting makes available.

#### 14. Self-Compassion Break — complete experience rebuild

**Current failure:** Three compassion statements are passive timed slides. The
app recites compassionate language instead of helping the user transform their
own language.

**Required experience:** Create a Language Transformation system. Let the user
capture or select the harsh pressure they are experiencing, then move it through
three lenses: `This is here`, `Others know this experience`, and `What would be
kind and useful now?`. Typography should soften, widen and become easier to hold
at each stage. Offer a tactile hand-on-body route, silent reading and a low-body
contact alternative. End with one user-approved compassionate sentence, not a
generic mood rating.

### Ground

#### 15. 5-4-3-2-1 Grounding — benchmark refinement

**Keep:** The sequential sensory discovery, expanding environmental field,
uploaded visual system and narration.

**Required changes:** Make each discovered item produce a visible persistent
mark so the room genuinely returns around the user. Add shortened counts and
skip/substitute controls before inaccessible smell or taste steps. Remove rigid
timing and let discovery drive advancement. Finish by showing the completed
sensory world and asking about orientation/reconnection, not generic intensity.

#### 16. Reroute — major experience rebuild

**Current failure:** The current pathway has better branching than most, but it
still appears as sequential option cards. Destination qualities do not create a
meaningful map, and the selected route does not feel like somewhere attention
can travel.

**Required experience:** Begin with one stable foothold that becomes the origin
of a spatial route map. Social, Sensory, Familiar, Active and Absorbing should
open recognisably different constellations. Reachability and friction should
shorten or lengthen the visible route; removing the first obstacle should open
it. After the real-world handoff, ask whether attention entered. If not, redraw
the map or change mechanism, while explicitly preserving the distinction
between flexible redirection and avoidance.

#### 17. Orienting Scan — complete experience rebuild

**Current failure:** Generic timer, ring and instruction text. Nothing in the UI
requires or rewards looking around.

**Required experience:** Build a panoramic orientation field with landmarks at
the screen edges. The user follows slow light cues around the room and taps when
they locate neutral shapes, colours, exits, distances or sounds. The horizon
widens as peripheral attention returns. Device orientation may enhance the
experience but cannot be required. The reduced-motion route uses a static
compass sequence. End on `I know where I am / I need more grounding / I need
support`.

#### 18. Name What You're Feeling — complete experience rebuild

**Current failure:** The user is told to find a word on passive timed slides;
the interface provides neither emotional vocabulary nor meaningful
classification.

**Required experience:** Create a responsive emotion constellation organised by
energy and pleasantness without claiming diagnosis. Begin with broad regions,
then reveal nearby words and allow `mixed`, `unclear` and custom language.
Optionally locate the feeling in the body and adjust intensity. Once a label is
chosen, reveal possible needs as hypotheses the user can reject. The payoff is
a user-owned phrase such as `Something like ___ is here, and ___ may help`.

### Focus

#### 19. Next Easiest Step — major experience rebuild

**Current failure:** The approved weighted-stone compression system is replaced
by a generic card and automatically generated sentence. The app does not first
capture the user's actual task, and `couldn't start` does not visibly reduce the
step again.

**Required experience:** Restore the stacked weight/stone metaphor. Capture the
task, identify the barrier, then let the user break or compress the mass until
one observable action remains. Each reduction should visibly remove weight and
complexity. The final screen contains only the one step, with a tactile `Take
this step` handoff. On return, complete, partial and could-not-start alter the
same object; failure to start recursively makes it lighter or switches to
Ignition Point.

#### 20. Signal Lock — substantial premium rebuild

**Keep:** Target lockability, time/output choice, perimeter selection,
distraction capture, pausing and deliberate outcomes.

**Required changes:** Replace the generic panel sequence with a coherent signal
console. Vague targets appear noisy and physically sharpen as first action,
materials and finish line become clear. Selected perimeter controls should
visibly remove interference from the signal. During the sprint, the target
dominates; captured distractions become quiet orbiting satellites rather than
list items. Add a default neutral/hidden-time mode, background/lock-screen timer
behaviour and a calm finish that does not resemble a productivity game.

#### 21. Friction Sweep — complete experience rebuild

**Current failure:** Four timed instruction cards ask the user to identify and
remove friction without any diagnosis, interaction or visible change.

**Required experience:** Present a blocked route to the named task. Let the user
identify the first blocker—missing item, unclear instruction, clutter, excess
choice or competing cue—then tap/drag one obstacle away using a button
alternative. The route should brighten only where friction was actually
removed. Ask the user to perform the real change, return and begin one visible
step. Avoid rewarding endless environment optimisation.

### Sleep

#### 22. Tomorrow Parking Lot — major experience rebuild

**Current failure:** The approved night-containment gesture is represented by a
small decorative note, textarea and Finish button. The night flow is followed
by the same daytime-style reflection screen, breaking containment.

**Required experience:** After the urgency gate, place the user's short line on
a softly lit note occupying the centre of a near-black world. Let the user slide
or tap it into a secure horizon slot; the note should become unreadable as the
night clears. Confirm local storage once, offer Night Channel only by consent,
then end passively with no rating. Build a separate daylight Parking Lot where
items can be reopened, edited, scheduled or deleted.

#### 23. Night Channel — complete product experience rebuild

**Current failure:** The setup language is promising, but the central native
content option is disabled and the external route does not actually open or
bookmark audio. The final experience is a near-black screen telling the user to
use another app. It is currently not a functioning intervention.

**Required experience:** Install a small, exceptional native starter catalogue
across Familiar Replay, Continuing Story, Gentle Curiosity, Gentle Conversation
and Fictional World, with previews and clear finite durations. External sources
need honest deep-link/share/bookmark handoffs where supported. Build a premium
full-screen tuner with distinct channel artwork, a simple capture control and
an actual native player with background audio, sleep timer and lock-screen
controls. During playback, artwork descends to near-black and controls fade but
remain recoverable. There is no night rating; optional usefulness feedback
returns in daylight.

#### 24. Awake-in-Bed Reset — complete experience rebuild

**Current failure:** Four timed slides keep the user looking at a bright,
progress-oriented interface while instructing them to leave bed and stop trying
to sleep.

**Required experience:** Use one exceptionally dim transition screen rather
than a slide deck. A low horizon path guides `turn clock away`, `leave bed` and
`choose a quiet activity`; each action is acknowledged with one tap and then
the screen disappears. Offer undemanding activity routes already available to
the user, optional quiet audio and a single `I'm sleepy` return control. No
countdown, completion score or mandatory return.

#### 25. Drop the Sleep Struggle — complete experience rebuild

**Current failure:** The acceptance mechanism is contradicted by a timer,
progress indicators, Next controls and a post-intervention assessment. It turns
not trying into another task to complete.

**Required experience:** Remove visible progress, targets and completion. Use a
near-black field where effort-related words gently loosen and dissolve into the
support beneath them. Deliver four sparse phrases with long user-controlled
gaps, minimal narration and no sudden sound. The user may leave the screen on,
lock the phone or stop at any time. The ending is simply continued quiet rest;
feedback, if offered, belongs the next day.

## Priority order for implementation

### Phase 1 — prove the new quality bar

1. Thought or Fact — strongest board-to-code discrepancy and ideal proof of
   meaningful interaction.
2. Ignition Point — proves real personalisation and four consequential routes.
3. Tomorrow Parking Lot — proves that premium can also be minimal and quiet.

These three should be implemented and approved before the remaining library is
rebuilt.

### Phase 2 — rebuild the flagship worlds

Urge Surfing, Then What?, Countermove, Open Channel, Pulse Shift, Test the
Prediction, Change the Scene, Reroute, Next Easiest Step, Signal Lock and Night
Channel.

### Phase 3 — elevate the supporting eight

Cyclic Sighing, Solvable or Hypothetical Worry, Self-Compassion Break,
Orienting Scan, Name What You're Feeling, Friction Sweep, Awake-in-Bed Reset and
Drop the Sleep Struggle.

### Phase 4 — benchmark refinement and integration

Refine Box Breathing, PMR and 5-4-3-2-1 Grounding, then verify handoffs,
accessibility, memory, audio, responsive layouts and real-device performance
across the complete library.

## Release gate

An intervention is not approved for V1 until all of the following are true:

- It can be recognised without reading its title.
- Its central interaction directly performs the therapeutic mechanism.
- At least one meaningful choice changes the later experience.
- The first useful action occurs within approximately ten seconds where safe.
- Its visual payoff is caused by the user, not merely played at them.
- Its outcome measures the mechanism rather than generic mood or compliance.
- Its Immediate, Standard and Supported/adapted routes work where specified.
- Reduced-motion, silent, screen-reader and low-motor routes retain the same
  psychological function.
- It works at small-phone, large-phone and tablet layouts with Dynamic Type.
- It has passed a full real-device pathway review with no placeholder content,
  disabled core feature or unsupported capability claim.
