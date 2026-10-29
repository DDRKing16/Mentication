# Contextual rating audit — 29 October 2026

Base: origin/main f6cbdaa71535a4c99f42e0ec54e05e99b260040f (PR32). Branch: codex/contextual-ratings. No merge or deployment.

## Shared measurement contract

All six are 0–10, explicitly answered; blank is not zero. The same question and anchors apply at entry, host check-in and goal reassessment. Higher means more difficulty except Lift. Numeric algorithm thresholds are unchanged.

| Goal | Question | 0 / 10 | Construct | Better |
|---|---|---|---|---|
| Calm | How distressed are you right now? | Calm / Extreme | distress | lower |
| Focus | How hard is it to focus right now? | Focused / Can't focus | focus difficulty | lower |
| Ground | How disconnected do you feel right now? | Present / Gone | disconnection | lower |
| Reset | How caught up in repeating thoughts are you right now? | Clear / Consuming | rumination | lower |
| Sleep | How much are you struggling to sleep right now? | Not struggling / Struggling a lot | sleep difficulty | lower |
| Lift | How is your mood right now? | Very low / Great | mood | higher |

Sleep's intermediate descriptors now describe difficulty sleeping, not alertness. No numeric migration: old wakefulness scores cannot be interpreted as sleep difficulty. Old question metadata is retained; the strict matching guard rejects comparison to the new question. Resumed old baselines require a new answer where baseline gating applies; old values are not preselected as answers to new questions. Historical records are not rewritten. Records carrying old explicit metadata conservatively lose comparable-change eligibility; older records without metadata retain the existing legacy handling. Completion headlines and attempt feedback now also respect matching metadata. A skipped follow-up remains missing. Safety distress remains distinct from mood, energy and urge strength.

## Reachable route and rating inventory

Runtime catalogue inspected: 18 canonical interventions; names such as core25/core26/final50 are historical module names. Dear 2100 and Foundations are additional reachable routes. `inventory/routes.json` captures all 20 entry screens at 320 and 390px, including iframe text, overflow and page errors. This is **entry coverage, not full completion coverage**. The inventory deliberately exercises host entries under Calm as an alternate context; normal primary/supported goals are below.

| Activity / route | Goal(s) | Additional measurement, question / anchors / domain / direction | Coverage |
|---|---|---|---|
| Box Breathing / reset boxV2 | calm | qualitative breathing feedback; separate from goal | entry UI; stopped/worse helpfulness terminal UI; unit suite |
| PMR / reset progressive-muscle-relaxation-v2 | calm, sleep | qualitative tension outcome; separate from goal | entry UI; old baseline resume UI; unit suite |
| Thought or Fact / reset factCheck | calm, reset | How true does the original thought feel right now? / not at all true–completely true / 0–10 / higher belief, no automatic benefit | entry UI; classification/omitted belief/goal-zero/reload terminal UI; unit suite |
| Urge Surf / reset urgeSurf | calm, ground, reset | How strong is the urge? / Very mild–Extremely strong / **1–10** / higher urge; optional choice feedback separate | entry UI; state/draft unit suite; early-stop terminal UI; real full 60-second timer and 1–10 endpoint UI |
| Happy Bump / reset happyBump | lift, calm | How is your energy? / Flat–More alive / 0–10 / higher energy; later mood/distress separate | entry UI; real partial and skipped completion, follow-up zero/missing/reload/write failure UI |
| Change Scene / reset changeScene | lift | qualitative performed actions; mood/distress follow-up | entry UI; unit suite; all-skipped terminal UI; mood/distress old data, reload and onward handoff UI |
| Good Map / good-map | lift | Lately, how satisfied are you with [domain]? / Not at all–Completely / 0–10 / higher satisfaction | entry UI; all 16 importance and satisfaction prompts at both widths; back/forward/reload; tried/partly/not-yet × rated/missing follow-up branches |
| Grounding / reset grounding54321V2 | ground, calm | qualitative noticing, completion and helpfulness | entry UI; skipped/partially performed terminal UI |
| Vector Shift / vector-shift and reset vectorShift | ground, calm | game performance is not a wellbeing rating; shared host goal | entry UI; skipped gameplay terminal UI |
| Next Easiest Step / reset nextAction, next-easiest-step, next-easiest-step-v2 | focus | task outcome is not a wellbeing rating; shared host goal | entry UI; storage/goal unit suite; aliases source reviewed |
| Signal Lock / signal-lock | ground, calm | game performance, no matched intensity rating in standalone | entry UI; unit suite |
| Tomorrow Parking / reset tomorrowParking, parking-lot | sleep | optional shared sleep baseline and matching host reassessment; saved note is not improvement | entry UI; source/unit review; saved/reloaded/reopened terminal UI; optional baseline, reload and matched endpoint zero UI |
| Night Channel / night-channel | sleep, calm | shared optional baseline, identical tab-local finish question | entry and optional zero baseline UI; source/unit review of finish |
| Gentle Tapping / reset eftTapping | ground, calm | How intense is the discomfort right now? / None–As intense as it gets / 0–10 / higher discomfort; host goal separate | entry UI; protocol/draft unit suite; pause/reload/resume/stopped/omitted endpoint UI; real full round and matched zero endpoint UI |
| Self-Compassion / reset selfCompassion | calm | How harsh is your self-talk right now? / Not harsh–Extremely harsh / 0–10 / higher difficulty | entry UI; actual skipped/planned path and reassessment reload UI |
| Unhook / reset unhook | reset | How caught up in this thought are you right now? / Not caught up–Completely caught up / 0–10 / higher difficulty | entry UI; stopped path and reassessment reload UI |
| Make Room / reset makeRoom | calm | How much are you struggling with this feeling right now? / Not struggling–Struggling a lot / 0–10 / higher difficulty | entry UI; outside-anchor/stopped path and reassessment reload UI |
| Tara / tara-tactician and reset taraTactician | focus, lift, calm | categorical preparation/prediction/reflection; no numeric intensity reinterpretation | entry UI; unit suite; notification resume not exercised by this owner |
| Dear 2100 / dear-2100, restructure launch | own constructs | prediction likelihood 0–100% Unlikely–Very likely; expected/actual discomfort 0–10 No discomfort–Extreme discomfort; ability for exact step 0–10 Not at all able–Completely able | entry UI; persisted plan's three ratings, zero/reload at both widths; reflection omitted/zero/max saved/reloaded UI at both widths |
| Foundations / foundations | educational | no numeric severity question | entry UI |
| Lift follow-up / lift-followup | lift + separate distress | mood as above; How distressed do you feel now? / None–Extreme / 0–10 / higher distress | actual happyBump handoff, zero, missing, reload and failed save UI |
| Scene follow-up / scene-followup | lift + separate distress | mood as above; current distress None–Extreme 0–10 | source/unit review; real rendered mood/distress and handoff UI |
| Journal / journal | personal log | sleep duration 0–12 hours in 0.5 steps; categorical sleep quality and mood; not goal intensity | source review; no domain changes |
| Home, Library, Plan, Programmes, Return points, History repeats | selected practice/goal | launch adapters lead to above routes; recommendation values must not answer today's question | launch unit suite; static route mapping review; every individual launch control not clicked |
| Support, Privacy, Settings, Plus, Palace, Welcome, Profile, Insights | none | no intervention severity input; settings volume is not likelihood or severity | source review; Insights evidence unit suite |

## Demonstrated fixes

1. Five generic goal questions replaced by their construct-specific question.
2. Sleep scale and all displayed descriptors now measure difficulty sleeping.
3. Dear 2100 expected/actual discomfort and ability scales no longer inherit likelihood anchors. Probability stays 0–100; urge stays 1–10; duration stays hours.
4. Old-baseline completion and attempt comparisons are gated; no silent data conversion.
5. Existing browser fixtures now use the current explicit Calm question rather than accidentally exercising a migration screen.

## Evidence and limits

`results.json`: focused rendered UI assertions. `completion/results.json`: actual completion and follow-up branches with synthetic local data, not mocked outcomes. `inventory/routes.json`: entry screenshots/text only. New unit tests cover old metadata, missing and genuine zero. No paid services, credentials, analytics, consent changes or algorithm threshold edits.

This is not a claim of every possible click sequence or every timer completing. Follow-up coverage below supersedes the initial branch gaps. Native notification resume still needs a device; generic checkpoint direction-switch reachability remains unproven. No real iPhone testing in this environment.

Integration overlap: public/night-channel/index.html is generated from design/night-source and imports goalAssessment; audio owner must regenerate after combining source changes. Dear changes are design/dear2100/app.js plus generated public/dear2100-updated/assets/app.js. Do not overwrite other owners' generated builds wholesale.

Validation: 113 Vitest files / 990 tests pass; typecheck, lint, production build and V3 algorithm verification pass. Build retains the existing large-chunk warning. Night document rebuild emits pre-existing IIFE import.meta warnings. Completion UI: 12 cases; terminal UI: 5 cases; Tapping UI: 2 widths.

Final rendered evidence: 21 focused cases; 40 entry captures (20 routes × 2 widths), zero page errors and zero horizontal overflow; Good Map full journey at two widths plus 12 follow-up branch cases. Legacy Calm and Sleep baselines tested in real UI: new answer required, confirmed zero survives reload.

## Follow-up audit after independent review

Latest main was fetched and verified as bf171387009ce955e8fa60427a11a46b36b7fa24 (PR33). This isolated ratings branch remains based on f6cbdaa; notification/audio integration belongs to the parent.

Additional fixes:

- Old goal baselines paused on `time` or `distress` now start at the new, unanswered goal question. The initial history snapshot and Begin guard use that goal step, avoiding a setup loop.
- Resumed goal endpoints now carry validated question/scale metadata. Old wakefulness selections (including zero) are not preselected under sleep difficulty. Compatible selected endpoints still survive reload, including when there was no starting baseline. Snapshot sanitization rejects mismatched or invalid metadata; no stored historical record is rewritten.
- Scene follow-up only reuses a valid endpoint whose recorded direction is Lift. Old Calm/distress endpoints no longer become mood answers. Version 2 follow-up navigation state distinguishes current answers from legacy snapshots whose mood provenance was uncertain; legacy snapshots conservatively re-ask rather than reinterpret.
- Every direction change uses the existing fresh-goal setup path, not only changes involving Lift. A skipped endpoint saves null. This switch change is source-reviewed defense in depth: a current UI path to the generic checkpoint switch was not established, so it is not claimed as a reproduced release blocker.
- Dear 2100's noninteractive two-answer recap could intercept taps on optional reflection choices at mobile width. It now allows pointer events through to the controls; no question, consent or checkpoint content is removed.

New evidence:

| Evidence | Exact exercised coverage |
|---|---|
| `migration/results.json` | 8 old-baseline cases: Calm/Sleep × paused time/distress × prebuilt/nonprebuilt, unanswered goal → explicit answer → reload → actual practice start; 6 endpoint cases: old/current/explicit endpoint metadata × zero/nonzero, preserving compatible answers across reload |
| `remaining/results.json` | Scene stored Lift zero vs old Calm zero, including legacy navigation state; mood/distress kept separate, reload and Happy Bump handoff at 320/390px. Tomorrow Parking optional baseline zero → reload → save → matching endpoint zero at both widths. Also covers `different` and `dear2100` destinations, including declining/accepting longer-journey consideration before offering Happy Bump. |
| `dear-reflection/results.json` | 320/390px × omitted/zero/max for actual discomfort, likelihood and ability; original domains and contextual anchors, real save and reload. Synthetic persisted chapter/draft, real rendered controls and saved observations. |
| `timers/results.json` | Real wall-clock completion results only. Initial concurrent/development Tapping checks were inconclusive (timeout/interruption while rebuilds could reload the app); the final script runs timers sequentially against the fixed production preview to avoid page/rebuild interruption. No acceleration or mocked completion. |

Current verification: 113 Vitest files, 1,000 tests; typecheck, lint, production build and V3 algorithm verification pass. Native notification resume, physical-device audio/haptics, and the generic direction-switch UI reachability remain unverified by this owner. PR creation remains pending explicit approval and has not been retried.

Final timer result: both unaccelerated production-preview checks passed. Tapping completed a full round with explicit 0 → 0 discomfort; Urge Surf completed its 60-second pause with an optional 1/10 urge endpoint. Both kept the separate skipped host endpoint null and recorded actual completion. Initial development timer attempts are not counted as passes.
