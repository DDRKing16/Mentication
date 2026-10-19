# Completion and check-in evidence audit

Baseline: `f122c01db677ed5903e61efcfc14b66033a614ca` (PR27–31), following threat verification commit `3b44c27ad5c461ca12be21392d3a5f19fa95bf78`. Synthetic local data only; Chromium launches muted. No merge, deploy, hosting, billing, credentials, audience, or production data changes.

## Concrete fixes

- Happy Bump, the three care practices, Tara, Vector Shift and sensory Grounding now derive completion from confirmed practice. Setup, planning, quiz answers and skipped screens do not create completion. Partial practice retains a fraction; stopping remains distinct. Tara rehearsal is distinct from event attendance.
- Lift mood and distress are independently optional. Explicit zero remains zero; missing ratings remain missing; unchanged and worse remain honest. A failed local write stays on the check-in with retry. Repeated confirmation cannot submit concurrently.
- Tomorrow Parking records which reset owns a saved note. Reload before finishing recovers that original completion; reopening the note cannot create an additional completed reset. Draft text is not completion and is not copied into return metadata.
- History, insights and profile stop treating omitted ratings as zero, selected pathways as completed practice, or worse/unchanged scores as improvement. Goal direction is respected. Profile displays signed change rather than averaging different goals' raw before/after scales. Positive-help and strongest-combination cards require positive evidence.
- Vector editable sources had drifted behind the shipped PR31 build. They were reconciled to the shipped source before rebuilding. The shipped `public/vector-shift/index.html` changes **only the completion bridge payload**; artwork, gameplay and checkpoint presentation remain intact. No other finished artwork changed.

## Checks

Final local checks: **113 test files / 976 tests passed**; typecheck, lint, production build and `node scripts/verify-v3-algorithm.mjs` passed. The build retains the existing chunk-size warning. Exact outputs are in `checks/`. These are local results, not remote CI.

All 20 reachable journeys were loaded at 320×568 and 390×844: `inventory/routes.json` contains the actual URLs, frame text, overflow and page errors (40 captures, zero page errors). The following table distinguishes deeper interaction coverage from source inspection. Host journeys run through `/reset`, including direct aliases; standalone documents use their actual React wrapper/iframe, not obsolete similarly named components.

| Journey | Browser interactions beyond inventory | Source / limits |
|---|---|---|
| Box breathing | Both sizes: real timed rounds, pause/resume and checkpoint. Early finish → worse helpfulness → omitted final rating, no full completion. | Stop/skip attempt handling inspected. Full longest timer not replayed. |
| PMR | Both sizes: modes, skipped region, paused reload, words/audio-off, Back and separate questions. | Region-confirmed completion and stopped path inspected; all body/length permutations not replayed. |
| Thought or Fact | Both sizes: capture, classification, evidence, Back/reload. Additional terminal run: unresolved, omitted belief, final zero, reload and repeated finish. | Classification and reflective work, not resolution or improvement, determine practice. |
| Urge Surf | Both sizes: actual timed guidance, pause/resume, early stop. Additional terminal early-stop run saves partial/exit and missing rating honestly. | No fabricated elapsed time; full duration permutations not replayed. |
| Self-Compassion | Both sizes: full journey, Back/reload/edit, private history, dedup, blank/unchanged/worse/untried; extra all-unperformed final check. | Words/plans alone excluded from completion. |
| Unhook | Same care suite plus unperformed/stopped final check. | Anchor noticed/actual practice distinguished from setup. |
| Make Room | Same care suite plus unperformed/stopped final check. | Stopped exit preserved separately. |
| Happy Bump | Both sizes: actual activity, task/undo, notes/errors, Back/reload; all skipped vs one actual action; null/0/unchanged/better mood. Actual full post-Lift Dear handoff. | Energy, mood and distress remain separate. Completion fraction is six practice domains, not checkpoint count. |
| Change the Scene | Both sizes: two confirmations, skip, Back/reload; additional all-six-skipped terminal run. | Confirmed actions / six; zero confirmations are skipped. |
| Good Map | Both sizes: full sort/ratings/plan, return branches, not-yet review, Back/reload. | Plans and later observations remain separate. |
| 5-4-3-2-1 Grounding | Both sizes: double click, noticed vs skip, reload; terminal all-skip and one-noticed variants. | Fraction counts unique senses actually confirmed. |
| Vector Shift | Both sizes: easier mode and actual gameplay checkpoint; all-gameplay-skipped terminal run. | Bridge now reports only four actual gameplay groups. Full competitive game not replayed. |
| Signal Lock | Both sizes: actual standalone route, completed first pair, next-activity/pair checkpoint. | Active standalone model completion/half-pair/local-history dedup inspected and unit tested; entire terminal branch matrix not browser replayed. |
| EFT tapping | Both sizes: actual elapsed round, pause/reload/resume/stop, omitted rating and finish. | Skipped/stopped rounds cannot be full completion. All tapping layouts not replayed. |
| Next Action | Both sizes: entry/edit, done/undo/skip, refresh/resume, Back/Forward and separate questions. | Confirmed task outcomes inspected; plans excluded. |
| Tara Tactician | Real direct route into “I'm in it now”; not-attempted / stepped-out / finished, omitted rating, reload, repeated finish and recap return. | Rehearsal-vs-attendance helper and outcome consistency unit tested; every rehearsal option not replayed. |
| Tomorrow Parking | Both sizes: capture/optional baseline/reload; terminal save, reload before finish, double finish, reopen same note. | Original session owns completion; note return does not add history. |
| Night Channel | Both sizes: real standalone scene and optional check-in screens. | Active controls' matched optional ratings and temporary state inspected. No assumed sleep result; full overnight/background/provider behavior not tested. |
| Dear 2100 | Prior full two-size plan journey and compulsory education tests retained. New actual Happy → Lift → Dear visual at both sizes. | Education/quiz/plan are not performed event evidence. See prior threat handoff. |
| Foundations | Prior full two-size scan/plan/review-not-yet regression retained; fresh two-size inventory. | Active standalone record separates planned and performed. No runtime change; prior detailed evidence reused. |

`focused/` and `focused-320/`: 12 focused records each. `tara/`: three outcome branches. `terminals/`: five terminal/dedup cases. `history/`: explicitly seeded history fixtures (not fabricated runtime completion claims), both widths, missing/zero/unchanged/worse and profile summaries. `action-body/`, `tapping/`, `good-map/`, `care-final/`: existing full targeted regression suites. `checkpoints/`: final pair-accounting regression.

Initial `walkthroughs/` has three failed 320px runs: Vector exposed editable-source drift, and Box/Urge timed assertions failed during concurrent development. After reconciliation and isolated rerun, all three passed in `timer-vector-recheck/`. Initial `care-regression/` stopped on a Make Room locator; final `care-final/` passed all six journeys, six long/enlarged cases and three legacy cases. Initial failures are retained, not silently presented as passes.

## Reproduce

Use existing app dependencies and an externally installed Playwright; no app dependency changes:

```sh
npm run dev -- --host 0.0.0.0 --port 5181
PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright node scripts/verify-completion-evidence.cjs
WIDTH=320 PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright EVIDENCE_DIR=docs/handoffs/completion-audit/focused-320 node scripts/verify-completion-evidence.cjs
PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright node scripts/verify-completion-terminals.cjs
PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright node scripts/verify-tara-completion.cjs
PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright node scripts/verify-completion-history.cjs
BASE_URL=http://localhost:5181 PLAYWRIGHT_MODULE=/tmp/threat-browser/node_modules/playwright EVIDENCE_DIR=docs/handoffs/completion-audit/checkpoints node scripts/verify-two-action-checkpoints.cjs
```

## Limits and publication

- Mobile-sized Chromium is not Safari/WebKit, a physical iPhone, native Capacitor, StoreKit, background audio, or App Store acceptance validation. All 20 entry routes and active completion implementations were inspected; the table does **not** claim every terminal permutation was browser-tested for all 20.
- The existing history chart’s left-axis text is clipped at 320px (visible in `history/history-320.png`); individual numeric history rows remain readable. This pre-existing chart-layout issue is not changed here.
- Historical inaccurate records are not retroactively rewritten. Legacy records with explicit completion and numeric ratings can still be displayed; the audit prevents new false evidence on the corrected paths.
- No external support destination was contacted. No narration generated; required ElevenLabs key names were absent from the process environment during readiness check.
- GitHub publication was blocked: `gh pr create` returned `Post "https://api.github.com/graphql": Forbidden`; CI read also Forbidden. No alternate authenticated tool/account is used to bypass this. Parent must publish/review the branch and obtain remote CI before merge/deploy.
