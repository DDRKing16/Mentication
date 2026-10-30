# Local-only combined release verification — 29 October 2026

Branch: `local/release-ratings-audio` in `/workspace/mentication-integrated`.
No combined push, PR creation, remote merge or deployment was attempted. The earlier PR-creation denial remains pending explicit authorization.

## Exact inputs and ancestry

- Current main: `b296df2f4b7927d79c3b472410c80983ae46fdc1` (reviewed notification/privacy/docs work).
- Ratings: `51386da0234a12881f3e79016b2bdc0f3990d096`.
- Audio: `70ace33b0d68ab8d92d25c6f635e5b5f0ae19eac`.
- First local merge: `961db73a6d20e83c88e44060e917a69114375bde`, parents current main + ratings.
- Combined local merge: `1f1fd0b51032ef696192624c511f7455aafb4976`, parents first local merge + audio.

All three input commits are ancestors of the combined result. The only merge conflict was `public/night-channel/index.html`. It was resolved by running `node scripts/build-night-document.mjs` against the combined canonical `design/night-source` and shared ratings source. No side's generated document was chosen wholesale. No unresolved conflicts remain.

Additional conservative hardening retains a `goalAssessmentInvalid` marker when explicit endpoint metadata is invalid. This prevents fallback to a compatible starting baseline from accepting that endpoint number. Missing legacy metadata can still use the established compatible-baseline fallback. This was a synthetic defensive case, not a proven user-path release blocker. Unit and browser cases cover invalid metadata at zero/nonzero, subsequent explicit answer, and reload.

## Combined validation

| Check | Result / scope |
|---|---|
| `npm test -- --run` | 117 files, 1,048 tests passed |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; existing large-chunk advisory |
| `node scripts/verify-v3-algorithm.mjs` | Passed |
| Night canonical document rebuild | Passed; existing import.meta/IIFE warnings from shared web-check-in imports |
| `verify-rating-migration.cjs` | 16 rendered browser cases: 8 old setup baselines; 8 old/current/explicit-valid/explicit-invalid endpoint metadata cases at zero/nonzero. Practice starts after fresh baseline; compatible answers and new endpoint metadata survive reload. |
| `verify-integrated-night.cjs` | Both 320px and 390px: contextual sleep question/anchors, actual labelled generated-noise playback, confirmed STOP, Back to timer, Forward without restarting playback, change source after STOP, matching zero endpoint. No page exceptions or horizontal overflow. |
| Ancestry and whitespace checks | All exact inputs included; `git diff --check` passed |

Browser commands used `BASE_URL=http://localhost:5190` and `PLAYWRIGHT_MODULE=/opt/codex/cua_node/lib/node_modules/playwright`. No account connection, paid generation or credential setup occurred. Night browser playback used only the existing explicitly labelled generated-noise preview.

## Coverage inventory and evidence

- `night-results.json` and `night-matched-zero-{320,390}.png`: rerun against combined generated Night.
- `../handoffs/contextual-ratings/migration/results.json`: rerun against combined source; includes new invalid-metadata cases.
- [Complete ratings route/construct/anchors inventory](../handoffs/contextual-ratings/README.md): all reachable practice entries, exact numeric domains, before/after meaning, resume and follow-up branches. Prior-branch browser evidence is clearly separated from this combined rerun; all helper tests were rerun combined.
- [Audio readiness and provider limits](../audio-readiness/README.md): retained audio-owner source and evidence, missing-asset counts, provider setup and device limits.

No exhaustive claim of every timer variant or every possible click sequence. Native notification resume, physical-device locked-screen playback/haptics, live provider playback and missing narration remain outside this verification. Generic checkpoint direction-switch UI reachability remains unproven. Existing narration/content gaps are not resolved by integration.
