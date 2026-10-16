# Section 1: intervention experience acceptance

Source baseline: `2b4d9962227faf70e60a48cbde61478fa5a37e22` (PRs 25/26).
Reviewed 16 October 2026. This is **not full App Store readiness approval**.
The current runtime catalogue has 18 entries (`CORE_25_SPECS`); its historic name
and FINAL_50_LOCK document do not describe the current count. Dear 2100 and
Foundations are also covered below as separately routed experiences.

## Actual changes

Reconciled `c43c180fdc4e2242b674fc50383ce1ce830288c0` using a three-way merge,
not an old whole-tree replacement. Only its Tapping work was introduced. Kept
current focus/rating/completed-point/saved-cue checkpoints and persisted round IDs.
Resolved both conflicts explicitly: persisted round ID wins; choosing a focus
records the current checkpoint and disables unavailable narration.

Tapping now uses the existing PMR body asset with registered targets and a moving
two-finger demonstration. Native Web Audio looping owns the audible rhythm;
visual phase and haptic requests follow that clock, with no delayed catch-up burst.
Quiet rounds retain their visual clock. Guidance uses fractional output timestamps.
Narration uses 0.8x pitch-preserving media playback, separate from native-rate music
and contact sounds. Pause, replacement, mute and interruption cancel old playback.
The exact approved narrator ID is now required in addition to matching text.

Main previously played the bundled Piper speech. It now refuses that substitute
and shows matching voice as unavailable. This is an intentional correction, **not
completed narration delivery**. The offline audit and exact request contract make
the remaining work reviewable; no audio has been generated.

Existing preparation, care, checkpoint, education, category and home implementations
were retained where current source already met the requested behavior. No notification
infrastructure, purchases, account recovery, deployment resources or audience changes.

Test maintenance: bounded waits for checkpoint rendering; scope quiz score queries
to their quiz (the new checkpoint is also a status region); do not count timing or
opening an easier-mode menu as practice. Freeze Date in storage tests whose September
fixtures otherwise expire against October's real clock. Product retention is unchanged.

## Acceptance matrix

“Pass” refers only to the stated checks. Browser runs use muted Chromium, including
320/390px viewports. They are not physical iPhone runs. No listening audition occurred.
All rows still require applicable native accessibility/audio/interruption checks.

| Intervention | Existing pass retained / actual change | Evidence and limit |
|---|---|---|
| Gentle Tapping | **Changed:** PMR figure, two fingers, common rhythm, approved-voice gate, 0.8x pitch preservation; current checkpoints retained | Production browser: all 9 targets, two complete rounds, pause/resume, repeat, 6→6 then 6→8, saved session with 2 rounds and exact scale. Separate real-clock browser: moving fingers, music/contact activation, mute/unmute, AudioContext suspension, skip/refresh/stopped round. Audio/timing/cue unit tests. **18 approved recordings missing; physical haptic/audio alignment and auditory quality unverified.** |
| Let’s get through this | Existing situation/challenge/first move, 5-part support plan, 2 explicit rehearsals, usability decision, during-event break/regulation/exit/help/affirmation and reflection retained | Production 320/390 complete before/during/after, save/leave/resume, immediate support, uncertain and stepped-out outcomes, no private text in session history or duplicate completion. Tara remains a guide, not hero. No closed-app delivery claim. |
| Unhook from the Thought | Existing framed thought → actual noticing try → chosen action/anchor → return of attention retained | Production 320/390 checkpoint, unchanged rating, saved-card refresh; 320px 6→8 worse outcome and save/restore pass. State tests cover stopped/untried/blank outcomes. Returning attention is not reported as removal of the thought. |
| Make Room for the Feeling | Existing outside anchor, optional gentle allowance, explicit practice try, useful next step retained | Production 320/390 checkpoint and saved-card refresh; 320px 6→8 worse outcome and save/restore pass. State tests distinguish outside-only/stopped from trying allowance; no guaranteed relief. |
| Self-Compassion | Existing believable response, explicit saying try and supportive action retained | Production 320/390 checkpoint and saved-card refresh; 320px 6→8 worse outcome and save/restore pass. Confirmed words differ from typing; trying words differs from completed action. No forced positive appraisal. |
| Change the Scene | Existing 6 actual action confirmations and alternatives retained | Production 320/390 six-action checkpoint/refresh pass. Rendering wait fixed in QA, not product. Same/worse and undo semantics covered by state tests. |
| Thought or Fact? | Existing evidence and balanced response retained | Production 320/390 full belief (0→7), optional patterns, sequential evidence, edited/confirmed perspective, private save/error/retry, same-ID edit, live delete, search, return and large text. Unresolved/blank beliefs preserve evidence; corrupt archives and failed draft writes remain honest. See acceptance-followup logs. |
| The Happy Bump | Existing energy/activity confirmations and no-change outcome retained | Production lower 6→3 at 320px, unchanged 6→6 at 390px, and unrated energy at 320px. Paused walk refresh, honest shorter-walk/started-task status, no invented contact, saved cue/read/delete and blank shared endpoint all pass. |
| Next Easiest Step | Existing actual completed-step checkpoint retained | Production 320/390 three-step edit/done/skip, paused modal/refresh, genuine return, failed ending save/retry, new-visit-only completion history, unreadable saved-task preservation and silent direct route. Fixed enabled-but-inert Undo at a finished-visit boundary; reducer behavior retained. |
| Tomorrow Parking Lot | Existing private draft/verified local save retained | Production 320/390 safety option, interrupted seal without save, failed-save/retry, exact saved note, same-ID edit, worse feedback, quiet refresh, daylight review/delete and no resurrection. Native calendar handoff remains outside browser scope. |
| 5-4-3-2-1 Grounding | Existing confirmed sense actions, pause and partial outcome retained | Production 320/390 paused chosen sense, Back/Forward/refresh, alternatives, independent worse feedback and honest partial history. All five confirmed senses plus recenter, skipped feedback and optional saved cue/read/delete pass. Obsolete selector issue resolved. |
| Progressive Muscle Relaxation | Existing narrator/artwork and full release-only guidance retained | Live browser 320/390px seven-area hands-free completion; unit suite. Physical narrator audition not performed. |
| Night Channel | Finished supplied build unchanged | Production 320/390 generated audio starts/pauses (output muted), exact paused remainder on refresh, alternative pause, same-ID setup save/error/retry/edit/live delete, file reattachment and honest unavailable providers. Full 15-minute timer runs with simulated browser time to zero/stopped; this is not a 15-minute wall-clock listening audition. Native Back/Forward/whole-app refresh pass. |
| The Good Map | Existing meaningful sorting and undo retained | Production 320/390 complete 16-card sorting, importance/map/interpretation/satisfaction/focus/support/barrier/aim, own step/date, plan refresh, negative zero or blank check-in, calendar and consented summary downloads with privacy, larger text, dated return/delete. |
| Vector Shift | Finished supplied build unchanged | Production 320/390 noticing, three collections, letters/features, disabled-repeat, easy games, demand/feedback choices, checkpoints, pause/refresh and native Back/Forward with exact earned letter retained. Physical interaction remains unverified. |
| Box Breathing | Existing pacing and honest partial outcomes unchanged | Production 320/390 full four-round timer via simulated active RAF time, explicit worse/same feedback, complete history and blank endpoint. Separate general 20-minute route confirms baseline/time inputs, paused refresh, alternative return, explicit endpoint zero and truthful partial completion. |
| Urge Surfing | Existing actual practice/choice and stop options unchanged | Production early stop, real 60-second complete quick wave, guided 30-second option, exact paused refresh/Back/Forward, focus/Escape, same/worse optional feedback, independent urge ratings, save failure/retry, private-note return/delete, honest partial/full history and repeat clearing end ratings. No private anchor/body detail in history. |
| Signal Lock | Finished supplied build unchanged | Production 320/390 keyboard and alternating enabled targets, two full scenes from 12 actual paired interactions, explicit same/worse feeling retained on refresh, stopped partial scene, repeat, and native Back/Forward/whole-app paused restoration. No inferred wellbeing. |
| Dear 2100 | Existing automatic dedicated threat education and 4-question gate retained | Production fear/practical/both, one question at a time, keyboard, refresh, 2/4 fail with explanations, retry 3/4 pass, legacy navigation guard, 4/4 pass. Immediate-help structure unchanged. |
| Foundations | Existing authored flow unchanged | New production 320/390 pass: 17 ratings, optional cue/time, back/refresh, weekly save, Not yet review skip and completed review, persisted exact review ratings. |

## Shared requirements and evidence

- Discovery contract tests verify Tapping in **Ground + Calm** and Let’s get through
  this in **Lift + Focus** (also Calm); no new category labels were invented.
- Home music is already **0.175**, halved from **0.35** by `f4caa41`.
- Evening Reset/today card was already reduced by `6c9ca64`: visible desktop height
  33.62px from 134.48px; phone height 43.4px (rounded quarter) from 173.58px. Its separate 58px hit
  surface preserves a usable target, including desktop shell scaling. Not reduced again.
- Another Way stays secondary. The hierarchy browser check covers current entry
  screens separately; this is not proof of every interior screen in every branch.
- Existing checkpoint tests cover confirmed answers, no credit for typing/navigation,
  distinct actions, undo, optional skipped values and truthful untried outcomes.
- Full validation: **109 files / 946 tests pass**, lint, typecheck and production
  build pass. Vite retains its large-chunk advisory. See evidence logs.
- `qa/tapping-readiness-browser.py` exercises production `/reset` with the existing
  prebuilt entry contract and simulated elapsed clock, without injecting completion.
  `qa/tapping-cues-browser.py` uses real Chromium audio/animation clocks; output stays
  muted. Neither substitutes for iOS hardware testing.

## Remaining release dependencies

1. Generate and audition **18 recordings / 19 cue keys**, using existing authorized
   access: `qKsErzZyZLoLSAUfEopJ`, `eleven_v3`, stability `.35`, style `.7`, speaker
   boost false, `[warmly, smiling, gently] `; playback `.8`, pitch preserved.
   Neither `ELEVENLABS_API_KEY` nor `ELEVEN_API_KEY` is configured here. Exact contract:
   `design/tapping/narration/requests.json`. No credential creation, purchases or
   recovery attempted. Run `node scripts/audit-tapping-narration.mjs --strict` before
   declaring clips ready; it intentionally fails while missing. Then audition and
   verify true alignment/durations plus all voice toggles on hardware.
2. Physical iPhone: haptic latency, actual audio/visual sync, native interruptions,
   background/foreground, VoiceOver, pitch quality and safe-area/touch behavior.
3. Browser acceptance now covers the previously deferred rows as specified in the
   matrix. These are representative complete/partial, same/worse, save/recovery
   and return branches, not every possible user input, task catalogue item or
   physical-device interaction. Simulated timer checks are labeled explicitly.
4. Parent coordinates merge/deployment to the established destination. No deployment
   was performed in this environment. Git transport works; GitHub CLI reports its
   configured token invalid, so PR creation through that CLI is unavailable.

## PR27 contact/voice follow-up

Fixed the delayed-contact guard from `5b6a64b`: each detected contact carries its
absolute rhythm timestamp. The animation callback emits at most one touch cue,
only 0–80ms after that contact, without a later React effect reinterpreting phase.
Regression tests cover first frames at 700/1300/1900/6100ms, fresh multi-beat
recovery without replay, both window boundaries and clock restart.

Narration now returns URL and alignment directly from the approved voice/text
entry. A regression fixture puts another narrator with the same text first;
Tapping still selects the approved recording and its duration. Missing approved
clips remain unavailable; no Piper fallback or audio generation was introduced.

Full tests, lint, typecheck, build and V3 algorithm verification pass. Production
Chromium output was muted throughout. Tapping two-round and real-clock cue suites
pass again, and Foundations now has the additional acceptance coverage above.
The older Thought or Fact extended browser script stops on an obsolete Continue
selector after its belief choice. Urge Surfing’s old script reaches the current
entry after removing a retired library filter, then stops on an obsolete
30 seconds selector. No extended pass is claimed for either incomplete run.
Logs: `evidence/contact-fix/`. Strict narration audit remains intentionally blocked
on 18 missing approved recordings. Hardware/audio audition and the other explicitly
incomplete matrix branches remain release dependencies. Parent owns merge/deploy.

## Continued browser acceptance

Recovered the older Urge Surfing, Thought or Fact, Next Easiest Step and Grounding
scripts against the current one-question UI. Explicit ratings, save failures,
private data boundaries and actual completion assertions remain in place. Tests
wait outside the existing 250ms accidental-double-tap gate and wait for browser
Back to settle before Forward; no product progression guards were weakened.

Found and fixed one product defect: Next Easiest Step exposed an enabled Undo
button at the start of a resumed visit even though undoing a previous completed
visit was correctly refused by the reducer. Both active/review buttons now show
the real disabled state. The full task-return browser suite verifies it.

All browser output stayed muted. The supplied Signal Lock, Vector Shift and
Night Channel builds were not edited. Current sleep recovery and timed suites
are in `qa/section-one-sleep-browser.py` and `qa/section-one-timed-browser.py`;
the former replaces obsolete combined sleep-script selectors for this acceptance
run. Old failure logs under `contact-fix/` are historical and superseded by the
passing `acceptance-followup/` logs. Full validation remains 109 files / 946 tests,
lint, typecheck and build passing; V3 algorithm verification also passes.

The Happy Bump follow-up also passes lower (6→3), unchanged (6→6) and unmeasured
energy branches, paused-walk restoration, honest partial action status and optional
saved cue/delete. Its three outcomes are in `acceptance-followup/bump-results.json`.
All eleven continuation browser suites exited successfully; see
`acceptance-followup/run-summary.json` for the exact commands and timing limits.
