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
| Thought or Fact? | Existing evidence and balanced response retained | Production checkpoint/refresh and full unit suite; exhaustive outcome branches not rerun. |
| The Happy Bump | Existing energy/activity confirmations and no-change outcome retained | Production checkpoint/refresh, unchanged energy branch; other outcome branches not rerun. |
| Next Easiest Step | Existing actual completed-step checkpoint retained | Production step completion/refresh; exhaustive task variations not rerun. |
| Tomorrow Parking Lot | Existing private draft/verified local save retained | Production draft/save checkpoint; full storage tests pass with deterministic Date. Native calendar handoff not tested. |
| 5-4-3-2-1 Grounding | Existing confirmed sense actions, pause and partial outcome retained | Production four-sense/checkpoint/refresh; rapid double tap advances once. Older shared QA still used obsolete “Next sense” selector; not counted as a pass. |
| Progressive Muscle Relaxation | Existing narrator/artwork and full release-only guidance retained | Live browser 320/390px seven-area hands-free completion; unit suite. Physical narrator audition not performed. |
| Night Channel | Finished supplied build unchanged | Production sound/duration choices and entry checkpoint. Full 15-minute end-to-end sleep session not rerun. |
| The Good Map | Existing meaningful sorting and undo retained | Production sorting/undo checkpoint and restore path; entire longer reflection not rerun. |
| Vector Shift | Finished supplied build unchanged | Production 320/390 actual noticing, three collections, letters/features, disabled-repeat, checkpoints and refresh pass. Complete physical interaction not verified. |
| Box Breathing | Existing pacing and honest partial outcomes unchanged | Unit suite and entry/hierarchy review; complete timed production branch not newly certified. |
| Urge Surfing | Existing actual practice/choice and stop options unchanged | Unit suite and entry/hierarchy review; all timed branches not newly certified. |
| Signal Lock | Finished supplied build unchanged | Unit suite and entry/hierarchy review; full game branches not newly certified. |
| Dear 2100 | Existing automatic dedicated threat education and 4-question gate retained | Production fear/practical/both, one question at a time, keyboard, refresh, 2/4 fail with explanations, retry 3/4 pass, legacy navigation guard, 4/4 pass. Immediate-help structure unchanged. |
| Foundations | Existing authored flow unchanged | Unit suite and entry/hierarchy review; full education branch not rerun. |

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
- Full validation: **108 files / 939 tests pass**, lint, typecheck and production
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
3. Exhaustive unchanged/worse/save/next-step branches for rows explicitly marked
   incomplete above. Existing suite coverage is not a new complete manual certification.
4. Parent coordinates merge/deployment to the established destination. No deployment
   was performed in this environment. Git transport works; GitHub CLI reports its
   configured token invalid, so PR creation through that CLI is unavailable.
