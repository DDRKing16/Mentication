# Local combined baseline for the second design review

Publication is held following the user's feedback on visuals, interaction and content across Tapping, Self-Compassion, Unhook, Make Room and Tara. This is a tested integration baseline, not an accepted design or a published release.

Base: first-release main `6ce94730424ba67bb27281fc846ce2bec2606949`.
Branch: `codex/integrated-release-20`.
Combined sources: care entry `8a5afc3`, care redesign `6aa8266`, tapping redesign `0793acca`, Tara implementation `0b320f6` and contract `0ca1bd4`.

## Integrated scope

18 catalogue practices plus Dear 2100 and Foundations produce 20 journeys. Registry membership includes Tara while the historic evidence library remains 18 items. The five original new builds carry Unrated evidence rather than invented validation claims.

Tara uses its actual component through ResetFlow and the `/tara-tactician` entry alias, Library and need-based entry. Its own confirmed recap replaces an extra host reflection. Only declared event/comparison enums and booleans enter session outcomes; no situation, prediction, observation, learning or next-step wording enters session history. The preparation time is an estimate; the real event and return are self-paced.

Shared return points read validated, explicitly saved Tara recaps; deletion preserves unrelated drafts, fails truthfully, and clears a matching recap draft. Tara export uses validated records. Shared deletion and cross-tab deletion notify mounted Tara, clear authored state and prevent the deleted draft from being recreated. Existing saved care cards, notes and first-release routes are retained.

## Validation

- 64 Vitest files / **510 tests passed**.
- Typecheck, lint, production build, V3 verification and diff check passed.
- Three redesigned care practices: nine real-host flows at 320/390/430px, six long-input flows, matched/blank ratings, save/return/delete, refresh/resume, alternatives, keyboard, reduced motion, high contrast, enlarged text and storage failures/retries passed.
- Redesigned tapping: three real-host mobile flows through all nine timed points, full and stopped rounds, restart paused, exact/blank question handling and shared finish passed. Separate cue and resilience suites passed immediate cancellation on pause/stop/hidden/alternative/exit/unmount, no replay, independent explicit activation, unsupported hardware, silent reset, reduced motion, failed save/delete and corrupt-draft recovery.
- Tara component browser suite passed its nine lifecycle/accessibility/error scenarios.
- Tara actual host, on both Vite and the production build: all six reported comparisons with actual finished/stepped-out/not-attempted/unknown statuses, optional recap save, resume, shared return/deletion, private-text exclusion, no duplicate completion and cross-tab deletion without resurrection passed.
- First-release shared entry, PMR alternative and optional note, denied save/delete, refresh, Home bridge, existing-record reuse and Back passed on the production build.

Screenshots for review are copied to `/workspace/shared/release20-review/`: `self-compassion-mobile.png`, `unhook-mobile.png`, `make-room-mobile.png`, `tapping-mobile.png`, `tara-mobile.png`. They show this combined tree at 390px, not the older live release.

No second-release push, CI run or deployment was triggered. Native iOS and physical haptic sensation have not been verified in this Linux environment. The existing Render direct-route 404 setting remains unresolved and separate from this app patch. No hosting or router-wide workaround was introduced.
