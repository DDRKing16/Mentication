# Three care practices — integration handoff

Base: `e2369be`. Branch: `codex/three-care-practices`. No shared routing, catalogue, recommendation, takeaway, or alternative files changed.

## Registration contract

| ID | Default component export | Suggested need / goal | Description |
| --- | --- | --- | --- |
| `selfCompassion` | `src/components/SelfCompassionExperience.jsx` | Harsh self-talk or shame / calm | Meet self-criticism with a believable caring response and a supportive step. |
| `unhook` | `src/components/UnhookExperience.jsx` | Caught in a sticky thought / reset | Notice and name a thought, reconnect with the room, and choose where attention goes next. |
| `makeRoom` | `src/components/MakeRoomExperience.jsx` | Struggling with a feeling / calm | Gently allow a manageable feeling while choosing a useful action. |

All accept existing `intervention`, `answers`, `onComplete`, `onAttemptEvent`, `onExit` props. `answers` is deliberately not used to invent the practice-specific baseline. Default wrappers set a stable ID/key. Host should register all three in library / need-based entry / interactive routing and provide normal exit navigation. No new URL assumption is embedded in the components. Suggested duration: 2–4 minutes, self-paced. No premium entitlement assumption is embedded.

`onComplete({ requireGoalReassessment: true, outcome })` reports `practice`, `assessment` (exact question, left/right anchors, 0–10, before/after), `change` (after minus before, or null), `practiceTaken`, and `actionStatus` (`done`, `planned`, `not-now`, or null). Ratings and skips are explicit. The practice-specific comparison must not be mixed with the host's separate goal reassessment. No free text is sent in completion or attempt metadata. Planned actions never receive done credit. Saved-card review closes through `onExit`, not `onComplete`.

## Persistence and deletion

The three experiences share `carePracticeStorage.js`, which delegates automatic drafts to existing `flagshipMemory` APIs and verifies writes. Draft TTL remains 24 hours; reload offers Resume or fresh start. Finish/delete verifies draft removal. Save retains one card per practice at `mentation.carePractices.saved.v1`; the `mentation.` prefix is already covered by Settings' `deleteAllLocalAppData`. Each experience also has a delete-saved-card action and an explicit delete-draft-and-leave action. Exit keeps the automatic draft, and this is disclosed on entry. Saved cards are available from the same practice's entry screen.

Optional `persistence` prop permits the coordinating host to substitute its new shared infrastructure without altering content. Required synchronous methods: `readDraft(id): state|null`, `writeDraft(id,state): boolean`, `deleteDraft(id): boolean`, `readSaved(id): state|null`, `writeSaved(id,state): boolean`, `deleteSaved(id): boolean`. Failures must return false; do not swallow failure and return success. Drafts and saved states use `freshCareState` / `restoreCareState`. Host central saved-return UI can read this adapter. If host retains the older `deleteFlagshipMemory('saved'|'all')` button wording for all saved return points, include `CARE_SAVED_KEY` in that host-owned clear operation (current global Settings deletion already includes it).

## Distinct techniques and original content

- Self-Compassion: identify a specific critical line, answer as for someone cared about with believable words, then enact care. It neither insists on positivity nor erases responsibility.
- Unhook: notice/name a thought, orient attention outward, choose a meaningful next action. Unlike Thought or Fact, it does not gather evidence, dispute content, or determine truth.
- Make Room: name a manageable feeling, actively choose whether to try allowing it, keep contact with the room, and act with the feeling present. Unlike Urge Surfing, it has no urge-strength tracking, wave countdown, or pressure to outlast an impulse. It requests no trauma recall or intense exposure. Stop/look-around and decline-practice paths are immediate.

Primary clinical references reviewed 2026-10-06:

1. [WHO, Doing What Matters in Times of Stress](https://www.who.int/thailand/news/feature-stories/detail/doing-what-matters-in-times-of-stress): identifies unhooking, values, making room and kindness as stress-management skills. [WHO guide overview](https://tdr.who.int/home/our-work/global-engagement/9789240003927) describes evidence-informed development and field testing. This grounds technique selection, not a claim that these newly built screens are clinically validated.
2. [WA Centre for Clinical Interventions, Self Compassion](https://www.cci.health.wa.gov.au/Resources/For-Clinicians/Self-Compassion): progression from noticing self-criticism to compassionate thinking and behaviour informs the compassion route.
3. [WHO publication rights](https://www.who.int/publications/b/53604): guide uses a non-commercial licence; commercial copying/adaptation requires permission. These components do not reproduce or adapt guide exercises, worksheets, illustrations, audio, quotations or metaphors. All interface prose, sequences and SVG artwork were written for this implementation around general therapeutic techniques. No WHO/CCI endorsement is implied. Content/licensing review by the product owner remains possible before release.

## Interaction and accessibility

Every pair of actual enabled button activations produces an inline reveal and incremental artwork change. No artificial progress taps, popups or dismissals. Native click activation includes keyboard Enter/Space; text editing and elapsed time do not count as clicks. The practice has no countdown and no mandatory milestone interactions. Stop and decline remain available. Focus moves to the new heading; buttons/textarea have accessible names and visible focus. Rating buttons start unselected; skips clear an already-selected rating. OS reduced motion and existing app preference disable animations/transitions; large-text/high-contrast classes are supported. All practice text remains available with motion disabled.

## Verification

- `npm test -- --run`: 54 files / 420 tests passed in final aggregate run; includes 18 new model/storage tests.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed; build gives existing large-chunk advisory.
- `node scripts/verify-care-practices.cjs` with Vite on port 5173 and Playwright available: tests each component directly without modifying shared routing. Temporary harness removes itself. Chromium binary defaults to `/usr/bin/chromium` or `CHROMIUM_PATH`.
- Browser scenarios: 375px mobile and 320px large-text layout, full practice, interruption/reload/resume, zero versus blank ratings, identical pre/post question, explicit rating skip, storage quota failure/retry, blocked draft deletion, save/return/delete, repeat, decline/stop, keyboard Enter/Space, focus and reduced motion, no horizontal overflow, no page errors. Screenshots written to `/tmp/{id}-{practice|complete}-mobile.png`.

End-to-end discoverability and host shared-return/alternative navigation require the coordinating task's registration. Native iOS was not run in this Linux environment.

Committed visual evidence: `docs/handoffs/care-practices-evidence/` contains all three mobile practice screenshots and the final browser PASS log. The V3 algorithm verification also passed. The final rerun of all aggregate checks passed after the deletion-error fix.
