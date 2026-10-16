# Single-step intervention release review

Branch: `codex/intervention-single-step-release`. Based on latest `origin/main` verified at `0096f0885431e66b21c9534e78290d96120b71c5` (PR29). No merge or deployment is included.

## Runtime inventory and scope

The actual runtime catalogue has **18** entries (`CORE_25_SPECS` in `src/lib/final50Catalog.js`); Restructure adds **Dear 2100 and Foundations**, giving **20 reachable interventions**. `FINAL_50_LOCK.md`'s historic 25 count is not the current route inventory. Deprecated definitions and their simplified components are not additional live flows: entry resolves them through the current catalogue. This change does not alter recommendation or migration policy.

[Coverage matrix](coverage.md) distinguishes changes from existing conforming layouts and states exactly what the browser exercised. [Route captures and extracted rendered text](inventory/routes.json) cover all 20 at 320×568 and 390×844, with no uncaught page errors or horizontal overflow. Each capture is of an actual local app route, not a proposed design. The Vector Shift direct entry capture is its baseline; its embedded activities are in the walkthrough captures.

## Changes

- **Foundations:** action and dose selection stay on screen until Continue/See my plan; selection persists across refresh. Stages move into a disclosure, intro copy is shorter, and the primary footer stays reachable while the content scrolls. Review questions and two-answer reflections remain intact.
- **Dear 2100:** the two-road visual remains. Its two written reflections now have independent saved screens and one primary each, rather than a Keep reflection action alongside stage Continue. Both new screen IDs are registered in iframe and host history. Back/pause stay visible while the question is focused. The threat model exposes the selected explanation, with the others available by selecting a node; approach/source detail is expandable. The required visual, four-phase teaching and understanding check remain.
- **The Good Map:** day and time now have separate screens, preserving both across Back/Forward/reload. Calendar wording still says no notification is scheduled. Intro privacy detail is expandable; short-phone art is smaller.
- **PMR:** choose style, then Continue; its setup primary is sticky and its decorative art is smaller on short phones. The automatic practice clock, skip/pause/stop and honest stopped outcomes are unchanged.
- **Happy Bump:** task and life-area options select an answer; the existing primary confirms it. This avoids options silently navigating while a separate primary implies confirmation is needed. Walk timing and actual-attempt reporting remain unchanged. The primary button no longer translates on hover, which could oscillate at the pointer boundary after browser Forward.
- **Thought or Fact:** suggested starting thoughts are an optional disclosure; the writing field and Continue get more room. Short-phone decorative art is smaller.

Another way stays in each flow's existing secondary footer. No shared wrapper was used to hide unchanged inner-screen clutter. Tara remains a guide within Let's get through this. PR27's output-clock tapping rhythm/missing voice state, PR28's long-plan disclosures and PR29's consent/attention/attempt behavior remain. No narration, credentials, native dependencies or paid infrastructure were added or changed.

## Verification and evidence

All browser sessions use Chromium with `--mute-audio`, synthetic device-local answers, and reduced motion. Test text is not real personal information. Production previews are local Vite builds.

- `npm test -- --run`: 109 files / 953 tests passed.
- `npm run lint`, `npm run typecheck`, production build and `node scripts/verify-v3-algorithm.mjs`: passed. See [logs](checks/).
- [Focused Foundations / Dear 2100 results](focused/results.json): 320×568 and 390×844; actual ratings/teaching/answers, long text, repeated clicks, explanation Close, browser Back/Forward, refresh, save and exit. Dear also reaches values and the action plan.
- [Broad walkthrough traces](walkthroughs/interaction-traces.json): 22 cases across 11 flows at both widths, including real elapsed breathing and urge guidance, checkpoint counts, grounding double-click guard, skips, sorting Undo, and saved resumption.
- [Care results](care-current/browser-results.json): 15 cases including all three care journeys at both widths, long text, failure recovery, stopped practice/re-entry consent and legacy drafts.
- [Tara evidence](tara/): current `tara-focused.browser.mjs` scenarios, including three complete before/during/after plans, long support text, Cancel, explicit worse/not-attempted reports and unprepared support. See [log](checks/tara.log).
- [Tapping results](tapping/results.json): real playback, unavailable voice, pause/reload/resume, stop, no after-rating, optional next choices/Back, Finish. Browser audio was muted; no listening-quality claim.
- [Action/body results](action-body/results.json): Next Easiest Step, PMR and Happy Bump, including Back/Forward, pause/reload, edits, skip/undo, optional questions and storage failure recovery.
- [Good Map results](good-map/results.json): full sort/rating/plan path, long custom wording, day/time navigation and resume, saved plan and not-tried/unrated follow-up.

Representative screens: [Foundations choice](focused/foundations-choice-320.png), [Foundations size](focused/foundations-size-320.png), [Dear reflection](focused/dear-resumed-reflection-320.png), [Dear plan](focused/dear-plan-390.png), [tapping missing voice](tapping/missing-voice-320.png). Every inventory screenshot uses `<id>-<width>.png` in `inventory/`.

The existing older browser scripts contain stale expectations (PMR auto-advance, Happy Bump old reflection labels, Tara's older action label and a premature Vector Shift checkpoint). Release copies in `scripts/verify-release-*.cjs` follow the current rendered transitions. Tests wait beyond the 250ms accidental-double-tap guard for intentional separate actions. Early exploratory Chromium failures were resolved by giving Chromium writable XDG cache/config directories; they are not counted as passes. One run overlapped a rebuild and received an HTTP error; the successful rerun used a stable production preview.

## Reproduction

Use environment-provided Playwright, not a new application dependency. Start `npm run preview -- --host 0.0.0.0 --port 5182` after a build. Set `XDG_CACHE_HOME=/tmp/browser-cache` and `XDG_CONFIG_HOME=/tmp/browser-config` in this restricted environment. `BASE_URL` selects another preview for release scripts; `CARE_PREVIEW_URL` does so for care; Tara uses `TARA_APP_ORIGIN`. The legacy Playwright module defaults can be overridden with `PLAYWRIGHT_MODULE` (the `.mjs` entry for Tara).

Run `scripts/audit-reachable-interventions.cjs`, `verify-single-step-release.cjs`, `verify-good-map-release.cjs`, `verify-release-action-body.cjs`, `verify-release-walkthroughs.cjs`, `verify-release-care.cjs`, `verify-tapping-release.cjs`, and `tara-focused.browser.mjs`. Each writes its own evidence. Browser results describe exercised paths, not every permutation of optional answers.

## Review limits

No physical phone, native app, closed-phone/background execution, native haptic quality, audio audition, OS notification delivery or calendar import was tested. No hosted Render deployment was tested or changed. The long Night Channel session was entered, not played for 15 minutes. PMR was paused/skipped/stopped rather than running every full-length route to completion; unit tests cover its timing model. Good Map export consent and all historical-map permutations, and Dear 2100's fear-specific wave/outcome variants, were source-reviewed but not all traversed in this release. Screen-reader and real mobile keyboard testing remain independent device-review work. These limits must not be represented as completed device acceptance.
