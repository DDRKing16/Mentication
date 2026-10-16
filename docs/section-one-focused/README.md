# Let’s get through this — focused verification

16 October 2026. Baseline `1468a214ea06c9146150be5e7f3121c73035e6de` (main / PR 27).
Read-only inspection and browser journeys preceded the focused fix below.

**Local production-build verification passes, with one long-text presentation defect fixed. Hosted-site verification is blocked:** this environment's proxy rejects `https://mentication-preview.onrender.com/` with HTTP 403 on CONNECT; Chromium reports `ERR_TUNNEL_CONNECTION_FAILED`. These captures are from the actual React app at localhost, not the Render deployment. No merge or deployment is included.

## Findings and acceptance

All examples are synthetic. Muted Chromium at 320×844 and 390×844; reduced motion enabled. No physical iPhone, real contact, listening audition, or delivered OS notification is represented by these results.

| Requirement | Result | Specific evidence |
|---|---|---|
| Situation and challenge clarification | PASS | Three full journeys: declining extra work / holding a boundary; first hospital appointment / uncertainty; overdue paperwork / getting started. Authored situation and optional prediction; no suggested worry silently recorded. [Results](validation/focused-production.json). |
| Personalised before, during and after plan | PASS | Edited first move, five chosen support fields, two rehearsals, saved pocket plan, all live tools, explicit reflection and next-use step. [Complete hospital plan](screenshots/hospital-visit-complete-plan.png); [after / not attempted](screenshots/tax-paperwork-after.png). Personalisation is authored choices and built-in guidance, not AI inference. |
| Regulation tools | PASS | All three choices exercised across scenarios: ordinary objects, supporting surface, comfortable breath. Live grounding can be stopped/switched; no improvement assumed. [Grounding](screenshots/hospital-visit-regulate.png). |
| Practical breaks and exit wording | PASS | Pause in place, ask for time, quiet pause; own safe exit and practical alternative. Opening exit never records leaving. [Exit](screenshots/hospital-visit-exit.png); [unprepared safe alternative](screenshots/unprepared-safe-exit.png). |
| Support contacts and affirmations | PASS | Named synthetic colleague, receptionist/sister, office helpline with a concrete request. App explicitly says it does not contact anyone; user must act. Three different reminder phrases. [Help](screenshots/hospital-visit-help.png); [affirmation](screenshots/hospital-visit-affirmation.png). |
| Rehearsal and usability | PASS | Selecting an answer leaves `tried=[false,false]`; explicit “I tried this” records each try. Usable / unsure / want to adjust all continue to editable pocket plans. [Rehearsal](screenshots/work-boundary-rehearsal.png). Unpractised branch also passes [edge checks](validation/edge-cases.json). |
| Immediate during-event support | PASS | Break, regulate and leave buttons all visible above 844px in both widths; help/affirmation/check-in reachable. Fresh entry → Get started → I’m in it now works without preparation. Refresh retains the current support screen. [Live](screenshots/work-boundary-live.png); [unprepared](screenshots/unprepared-live.png). |
| Save / leave / resume | PASS | All three complete plans survive leaving to home and reopening, with exact chosen words. Partial custom planning survives refresh and Back. Quota failure shows unsaved status and keeps immediate help available; retry succeeds. |
| Editing, cancellation and repeated actions | PASS | Cancel discards editor text; saved edit persists. Editing the pause preserves four other support fields. Delete dialog Escape cancels; confirmed deletion cannot resurrect via Back. Reopening finished reflection adds no second session. Native mocked repeat taps/cancellation pass. |
| Unchanged, worse, stepped-out and uncertain outcomes | PASS | Workload unchanged; hospital felt worse and user stepped out; paperwork not attempted. Exact authored observations retained; host intensity remains null. Explicit event statuses persist independently of practice completion. All five prediction-result branches covered in edge checks. |
| Private text / truthful action claims | PASS in checked paths | No authored situation, move, contact or observation in host session history or browser history state. No POST requests observed in the focused unconfigured-web run. Planning, viewing exit and selecting rehearsal do not claim real-world completion. Separate reflection is opt-in; draft persistence is disclosed. This is local browser storage, not an encryption claim. |
| One question, hierarchy, low text and next action | PASS after focused fix | One H1, at most one answer fieldset and one textarea per screen; no horizontal overflow. Screenshots show one main task with secondary options. Long authored support wording initially filled multiple screens and sat beneath the sticky action; now a short preview and explicit expansion preserve the complete words. See before/after below. Larger text edge check also passed. |
| Tara guides without dominating | PASS | Experience is named “Let’s get through this”; no Tara portrait in entry hero. Brief introduction appears after choosing a first move and in live support; contextual cues follow. [Entry](screenshots/work-boundary-entry.png); [introduction](screenshots/work-boundary-first-move.png). Actual [discovery card](screenshots/discovery.png) uses the experience name. [Home](screenshots/home.png) retains its existing decorative spaniel artwork, without a Tara-named headline; no home redesign was made. Catalogue/discovery naming tests pass. |
| Notification claims match implementation | PASS for source/local fallback; delivery UNVERIFIED | Unconfigured local build explicitly says no background notifications. Foreground due checks and off/cancellation paths work. Native adapter mock covers permission, bounded schedules, cancellation, deep links, expired/deleted targets; no OS delivery occurred. Source distinguishes scheduled acceptance from delivery; web transport needs existing API/public-key configuration. Hosted configuration could not be inspected through the blocked proxy. Closed/locked delivery is not verified. |

## Focused fix

A realistic 463-character custom pause produced a long support card and repeated the entire text in the checkpoint. On a 320px display the sticky grounding button covered part of the wording. [Before](screenshots/long-pause-before.png).

Support wording over 220 characters now shows a 100-character preview and **Read the full wording**. The checkpoint uses the same brief preview. Full text stays unchanged in storage and in the expandable plan. Normal short plans are unchanged. The browser regression asserts the collapsed card ends above the primary button, full expansion equals the original 463 characters, and refresh retains the exact original. [After](screenshots/long-pause-after.png).

No clinical wording, flow order, notifications infrastructure, secrets, finished standalone interventions or home design changed.

## Validation and reproduction

- Full suite: **109 files / 946 tests passed** — [test log](validation/tests.txt).
- [Lint](validation/lint.txt), [typecheck](validation/types.txt), [production build](validation/build.txt): pass. Existing Vite large-chunk advisory remains.
- New actual production-app browser suite: **5 scenario groups**, zero page errors, muted. [Results](validation/focused-production.json).
- Existing production support suite: **2 full 320/390 journeys**, zero page errors. [Results](validation/support-production.json).
- Design-harness edge suite: **16 groups**, including quota, denial, stale schedules, interrupted planning, explicit outcomes and deletion. [Results](validation/edge-cases.json).
- Actual app with mocked native bridge: **11 groups**, zero page errors. [Results](validation/native-mock.json). This is adapter/router testing, not a physical-device run.
- Updated stale QA expectation `not granted` → current `not allowed`, preserving the denial and manual-support assertions. Removed the runner's hard-coded obsolete baseline SHA; pass `TARA_BASE_COMMIT` explicitly. The new test's initial iframe-storage setup error was corrected by limiting setup to the top window; final run has zero errors.

With the production preview running on port 5221:

```sh
TARA_APP_ORIGIN=http://127.0.0.1:5221 TARA_EVIDENCE_DIR=/tmp/tara-focused node scripts/tara-focused.browser.mjs
TARA_APP_ORIGIN=http://127.0.0.1:5221 TARA_PRODUCTION=1 TARA_BASE_COMMIT=1468a214ea06c9146150be5e7f3121c73035e6de TARA_EVIDENCE_DIR=/tmp/tara-support node scripts/tara-live-support.browser.mjs
```

Selected screenshots are committed; [SHA-256 manifest](screenshots.json). Full generated captures can be reproduced with the scripts. Remaining checks: Render URL verification from an allowed network; physical iPhone/accessibility and real closed/locked notification delivery where already configured. No paid infrastructure or credentials were created.
