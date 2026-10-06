# Combined experience verification

Base: `e2369be13e67553b220d9630a5d0f522716f3b97`.
Integration branch: `codex/integrated-release`.
Original shared patch: `8d12c85`; imported worker commits: Foundations `f0048a7`, Signal Lock `e17bb73`, Gentle Tapping `09ba021`, three care practices `b619ce3`.
Linux, Node 22, Chromium through Playwright. Tara is outside this release.

| Check | Result |
| --- | --- |
| `npm test -- --run` | 60 files / 466 tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; existing large-chunk advisory |
| `node scripts/verify-v3-algorithm.mjs` | Passed |
| `qa/journey-experience-browser.py --url http://127.0.0.1:5181` | Passed |
| `JOURNEY_URL=http://127.0.0.1:5181 python qa/journey-standalone-browser.py` | Passed |
| `JOURNEY_URL=http://127.0.0.1:5181 python qa/integrated-new-journeys-browser.py` | Passed |
| `CARE_PREVIEW_URL=http://127.0.0.1:5181 node scripts/verify-care-practices.cjs` | Passed for all three practices |
| `python tests/signal-lock/browser.py http://127.0.0.1:5181` | Passed, 320px mobile through 1280px desktop |
| Tapping `browser-check.cjs`, `edge-check.cjs`, `pacing-check.cjs` with `TAPPING_PREVIEW_URL=http://127.0.0.1:5181/design/tapping/index.html` | All passed; preview uses host Router context |

Shared mobile coverage: need entry, explicit goal baseline, PMR pause/return, native modal focus/Escape, optional save, denied write/delete, final check-in refresh, return/read/delete, native record reuse, Home bridges, Back, no horizontal overflow/page errors.

Native-frame coverage: Night Channel, Good Map and Dear 2100 retain mounted progress; Vector Shift pauses; Signal Lock and Foundations acknowledge the secure pause contract. Cross-tab Signal Lock deletion disposes an old writer before pagehide, preventing resurrection.

New real-host coverage: all three care practices are discoverable in Library and run their original components. Tests cover their own zero/blank scales, shared alternatives, interruption/resume, optional card save, shared return hub, deletion, host check-in refresh and no private text in session history. Tapping covers its own exact 0–10 question, optional skip, paused draft recovery, stopped round with zero completion credit, optional saved cue and deletion.

Care component coverage additionally verifies keyboard Enter/Space, focus, reduced motion, 320px large-text layout, practice decline, repeat, save quota failure/retry and denied draft deletion. Signal Lock verifies paired taps, all scenes, paused/hidden time exclusion, refresh, terminal history, optional feeling, settings and denied storage.

Algorithm tests verify all 17 catalogue IDs (19 total journeys including Dear 2100 and Foundations), four actual custom dispatches, declared goal/time eligibility, mechanism families, Unrated evidence, actual helpfulness-history influence and unchanged V3 score rules. Scales remain separate; private wording is excluded from history and restored completion snapshots.

Known limits: narration audit on the base reports 68/92 clips ready, 24 absent; no new narration was fabricated. Text-only/self-paced paths work without audio. Native iOS/VoiceOver and moderated participant testing were not run in this Linux environment. The user-test plan below remains a proposed evaluation, not observed user outcomes.
