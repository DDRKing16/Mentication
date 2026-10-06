# Ten cumulative overnight implementation passes

Branch: `codex/overnight-ten-passes`, starting from main `e292234` plus the completed required Dear 2100 check `681952b`. No push, merge or deploy. Requested multipliers are aspirations, not measured quality or clinical claims. Each pass inspects the cumulative version, implements focused behavior, and validates it before continuing.

## Pass 1 — authored practice discovery

Inspected all current Library entries, need entry language, categories, durations and the active standalone Signal Lock/Dear journeys. Fixed the unlabeled Reset category. Search now finds existing need phrases, supported directions and authored acronyms, including “cannot get started”, without changing clinical matching. Self-paced maps/steps/reflection and Tara preparation are labeled honestly; Dear no longer promises a fixed duration or guaranteed committed action. Results have an announced count and an explicit clear-search/filter recovery action.

Validation: four data-contract tests passed; typecheck passed; actual 390px Library verified Reset, plain-language search, Tara time, no-results recovery and no overflow. No artwork, intervention naming or matching logic changed.

## Pass 2 — readable, findable saved work on mobile

Inspected Return points and native saved-card schemas. Reworked records into practice-colored cards using existing brand atmospheres, with real dates only when available. Added local search across actually displayed saved wording. Tara now shows its confirmed prediction, observation and reported result even when optional learning/action fields are blank; factual prediction results remain distinct from historical difficulty comparisons. Archive destinations are a separate disclosure and do not imply saved data.

Validation: three source-fidelity/search/date tests passed; typecheck passed; real 320×640 route verified native Tara recap with blank optional fields, word search/recovery, actual saved date and 150% text with long-word wrapping/no overflow. No storage schema or artwork changed.

## Pass 3 — clear selection feedback and honest unanswered ratings

Inspected need selection and Reset assessment controls. Choosing a need now focuses and brings its tailored preview into view, confirms the exact user choice, and provides a clear way back to the chosen option before launching. Generic unanswered baseline/end ratings show an em dash and “Choose a rating”, with an honest slider announcement, rather than looking like a selected 5. Explicit number/slider interaction and the existing Confirm/Skip semantics remain.

Validation: real 320px first-click preview/focus/change-without-launch flow passed; actual Library → Box Breathing baseline proved no selected number until explicit 5; seven existing baseline fidelity tests and typecheck passed. Inspection also found direct `/reset` without state leaves an empty setup; address it in pass 4.

## Pass 4 — reliable fresh and repeat entry

Inspected onboarding, setup fallback, and launch payloads from Home/My Plan/Library/need entry. Explicit onboarding can now complete for the open run even when storage denies access, avoiding a welcome redirect loop; deleting app data resets that memory. Bare `/reset` uses the existing guided choices. Retired prebuilt pathways recover into guided setup and no longer retain an unusable fixed pathway. Shared launch helpers retain the chosen practice/context while clearing old goal/distress ratings; repeat/suggested launches cannot answer today’s assessment from history.

Validation: 21 entry/recommendation/history tests passed; typecheck passed; actual browser verified bare setup, retired-pathway fallback and storage-denied onboarding reaching Home. Matching algorithms and existing immediate-reset behavior are unchanged.

## Pass 5 — personalization from current local history

Inspected Home, My Plan, Profile and Insights history lifecycles. A shared local-only subscription refreshes their derived views on actual session save/delete, another tab's session changes, focus and visible resume; stale requests cannot win after cleanup. Repeat actions also use fresh assessment payloads. My Plan describes reported check-ins rather than implying that an aggregate best practice was the last practice. Read errors keep prior data and offer retry.

Validation: nine subscription, progress-story and recommendation tests, typecheck and lint passed. Mounted 320px My Plan updated after real session create/delete without navigating; mounted 390px Insights updated after another tab's create/delete. No matching algorithm or fabricated ratings added.

## Pass 6 — verified local saves, backups and deletion

Inspected shared history/notes, Journal, backup restore, reminder cancellation and full deletion. Shared writes/removals now verify storage; unreadable session history cannot silently become an empty overwrite. Journal saves/deletes update the view only after verification and preserve the active entry on error. Backup includes Journal, validates its container and version, prepares history merges before writing, and rolls back partial restore failures with truthful recovery messages. Full deletion includes Dear books/backups and Journal, verifies owned local/session keys, cancels native reminders first, and stays on Profile with a retry message if deletion fails. Scoped memory deletion verifies its promised draft/handoff removals. Return points retries independent stores so one unreadable store does not block others.

Validation: 20 storage/backup/memory/reminder tests passed, including corrupt history, silent writes/removals, Journal round-trip and partial restore rollback. Typecheck and lint passed. Actual 320px Profile proved a silent deletion failure keeps the route, records and truthful retry visible. Native notification hardware is unavailable; cancellation uses the existing on-device plugin.

## Pass 7 — reliable mobile return navigation

Inspected direct-link and shared intervention Back controls. They now check the router's app-created history index rather than counting unrelated browser entries. Settings, Library, Crisis, Privacy, Plus, Palace, Programmes and Thought or Fact entry fall back to Home; shared intervention chrome retains its Library fallback. Reset setup also protects restored step links with missing internal history. Authored in-journey steps remain intact.

Validation: 16 app-back/history tests passed; typecheck and lint passed. Actual 320px browser proved direct Settings Back stays in Mentication despite longer outside history, internal Library → Settings Back survives refresh, and Settings at 150% text has no horizontal overflow.

## Pass 8 — accessible ratings and live preferences

Inspected shared assessment dimensions and accessibility propagation. The rating component now occupies available width, uses five mobile columns with 44px minimum height, and keeps all eleven authored numbers/meanings and honest unanswered state. Selected sound/text controls announce their state. Loading overlays have status announcements. Accessibility reads validate saved booleans, honor OS reduced motion when no explicit choice exists even if another preference was saved, and retain the OS fallback for unreadable storage. Owned cross-tab changes, visible resume/focus and OS motion changes refresh preferences with listener cleanup; explicit saved choices remain authoritative.

Validation: 16 scale/preference/subscription tests passed; typecheck and lint passed. Actual 320px reduced-motion browser verified every rating target is at least 44×44px, keyboard selection, no overflow, OS fallback and mounted cross-tab contrast refresh. Browser inspection caught and fixed the previously shrinking rating container before completing this pass.

## Pass 9 — audio retry and interruption lifecycle

Inspected Home ambient handoff and procedural practice audio. Fixed denied-autoplay retries that could survive pause/mute and restart on an unrelated later gesture. A generation guard rejects late failures; pending gesture listeners are removed on pause, stop and mute. Background/page interruption suspends Home audio and resumes only while still requested. Standalone journey routes pause Home audio; the approved continuous setup/rating/pathway handoff remains. Approved music source, looping, handoff position and volume are retained. The tab loading surface also announces its status.

Validation: four audio lifecycle tests passed, including denied gesture retries, late promise rejection, background interruption and source/position/volume fidelity. Typecheck and lint passed. Actual Library → Dear navigation with synthetic autoplay denial verified subsequent gestures cannot restart Home music. No approved audio/art asset replaced.

## Pass 10 — cumulative integration and error recovery

Audited the cumulative version rather than starting another design. Corrected follow-up mood controls that still visually answered an unanswered 5; a failed Lift history write now reports that the valid answers were not saved while still allowing the chosen next step or finish. Change the Scene history read errors offer retry instead of hanging. Profile's existing data controls are available with no rated history, so books/Journal/notes can still be deleted. Production enlarged-text testing exposed Settings buttons overflowing at 320px; long actions now wrap inside the screen. Replaced Journal tests that required the old optimistic write order with actual corrupt-container, exact-entry round-trip and silent-write failure contracts. Added executable cumulative production mobile regression checks.

Validation on the cumulative version:

- **72 Vitest files / 569 tests passed**. Typecheck, lint, production build, V3 verification and whitespace check passed. The build retains its existing large-chunk warning; no build errors.
- `qa/overnight-ten-passes-browser.py`: 320/390px actual routes, empty-history deletion, silent failure/retry, owned local/session removal with unrelated data preserved, plain-language discovery, unanswered ratings, all eleven 44×44px targets, keyboard, cross-tab contrast, direct/internal Back plus refresh, 150% text, failed restore rollback, Lift save error with available finish, actual Journal save failure/retry/refresh, and scene-history read recovery passed without page errors.
- `qa/journey-experience-browser.py`: authored entry and baseline, alternatives/pause/return/focus, optional notes, quota failures, host refresh, return/read/delete, existing-record reuse and Back passed in production.
- `qa/dear-threat-required-browser.py`: all three fresh barriers plus four legacy entry views passed 75% gate/failure/retry/keyboard/back/refresh/home-exit/resume, new-chapter reset and no-bypass checks in production.
- `qa/tara-integrated-browser.py`: all five actual reported prediction outcomes, resume, privacy, no duplicate completion and mounted cross-tab deletion passed in production.
- `qa/journey-standalone-browser.py`: Night Channel, Good Map and Dear preserve iframe progress across alternatives; Vector Shift pauses; Foundations/Signal Lock acknowledge pause; mounted cross-tab deletion cannot resurrect old content. No page errors.

Evidence logs: `/tmp/overnight-all-tests.log`, `/tmp/overnight-pass10-types.log`, `/tmp/overnight-pass10-lint.log`, `/tmp/overnight-build.log`, `/tmp/overnight-v3.log`, `/tmp/overnight-mobile-browser.log`, `/tmp/overnight-shared-browser.log`, `/tmp/overnight-dear-browser.log`, `/tmp/overnight-tara-browser.log`, `/tmp/overnight-standalone-browser.log`.

## Completion and limits

All ten sequential passes are complete on the cumulative branch. None of the requested quality multipliers is a measured result. Approved standalone builds, artwork, names, clinical matching, questions/scale meanings and the existing local saved-state systems are retained; no remote service, account, new plugin or app-wide reward matrix was added. The mandatory Dear check remains the preceding separate `681952b` commit. Native iOS notification hardware and spoken VoiceOver testing are unavailable here. No push, merge or deployment. The previously identified hosting deep-link rewrite remains a separate deployment setting, not changed by this branch.
