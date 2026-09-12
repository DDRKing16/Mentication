# Core-25 implementation notes

## Architecture

The previous 182 definitions remain in `ARCHIVED_INTERVENTIONS` as read-only
migration input. `createCore25Catalogue` produces the only runtime catalogue.
The recommendation engine, library and player continue importing
`INTERVENTIONS`, so they automatically receive only the curated 25.

`createFinal50Resolver` handles old saved sessions in two stages:

1. Explicit aliases map duplicate, renamed and V2-upgraded IDs.
2. Any other retired ID is deterministically matched to the closest final
   intervention using category, mechanism, direction, target, state, bedtime,
   panic and duration metadata.

This avoids deleting historical definitions while preventing a retired tool
from re-entering a new recommendation.

## Files changed

| File | Change |
|---|---|
| `src/lib/final50Catalog.js` | Curated catalogue, intervention scripts, cross-routing and legacy resolver |
| `src/lib/interventions.js` | Runtime now consumes the core 25; archived catalogue is migration-only |
| `src/pages/InterventionLibrary.jsx` | Groups and filters by Calm, Lift, Ground, Focus and Sleep |
| `src/lib/situations.js` | Every prebuilt pathway now uses core-25 IDs |
| `src/lib/recommendationEngine.test.js` | Adds count, composition, coverage, CBT and alias tests |
| `scripts/final50-narration.mjs` | Audits or generates only missing core-25 narration |
| `package.json` | Adds narration audit and generation commands |

## Files intentionally not rewritten

- `src/components/ResetPlayer.jsx`
- `src/components/StageVisual.jsx`
- Box Breathing V2 components and hooks
- Grounding V2 components and hooks
- `src/components/PMRV2Stage.jsx`
- `src/lib/spoken.js`
- `src/lib/narrationService.js`
- `src/hooks/useGuideVoice.js`
- `docs/mentation-narration-preset.md`

These components already provide the correct player, speech conversion, local
manifest lookup and locked voice preset. Rewriting them would add migration
risk without improving the catalogue change.

## Validation gates

Run from the project root:

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run narration:audit
```

Before generating narration, the audit is expected to report 68 missing local
clips and exit non-zero. After generation it must report zero missing clips.

Then manually verify:

1. The library header shows 25 interventions.
2. Library groups show Calm 7, Lift 7, Ground 4, Focus 3 and Sleep 4.
3. Each home direction creates a non-empty pathway.
4. `Not sure` selects from the same core 25.
5. Old IDs such as `box`, `grounding54321`, `pmr` and `coherent` open their
   final successor.
6. Box Breathing, 5-4-3-2-1 Grounding and PMR retain their existing specialist
   visual players and audio behaviour.
7. A changed CBT intervention reads naturally with captions and narration on.
8. Sleep interventions do not use language that pressures the user to sleep.

## Narration release procedure

1. Clinically review the 68 changed spoken lines in
   `src/lib/final50Catalog.js`.
2. Run `npm run narration:audit` and retain the output as the pre-generation
   baseline.
3. Configure `ELEVENLABS_API_KEY` locally. Do not commit `.env.local`.
4. Run `npm run narration:generate-final50` once. The script checkpoints the
   manifest after each paid request and skips every line already present.
5. Run the audit again. Missing local audio must equal zero.
6. Listen to the first and last clip from each of the 17 changed interventions,
   then spot-check the remaining clips for pronunciation and pacing.
7. Commit `narration-manifest.json` and only the newly created MP3 files.
8. Keep retired MP3s until saved-session migration has been verified in the
   deployed build.
