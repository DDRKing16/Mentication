# Shared journey integration

Base: `e2369be`. Host branch: `codex/need-takeaway-alternatives`.

The shared patch owns `App.jsx`, `ResetFlow.jsx`, shared player/control wrappers,
Home/Library/My Plan entry, localData/flagshipMemory and the new journey components.
It does not include the Foundations or SignalLock internal redesigns, the new
intervention components, or their clinical matching decisions.

## React contracts

- `JourneyOptions({ id, onOpen, label? })`: opens a native modal with a tailored
  in-place alternative. Keep the practice mounted. `onOpen` may be async and must
  pause active timer/audio; throw/reject on failure. Closing never auto-resumes or
  marks progress complete. Escape and keyboard focus are handled by the native dialog.
- `JourneyTakeaway({ id })`: optional explicitly entered note, stored through the
  existing localData module. Blank or inferred content is never saved. Notes are
  separate from session statistics and available at `/return-points`, with deletion.
  Established saved work is linked back to its original store rather than copied.
- New experiences default-export a component with `{ intervention, answers,
  sessionId, onComplete, onAttemptEvent, onExit }` as needed. Terminal completion
  can use `onComplete({ interventionId, requireGoalReassessment:true, helpfulness,
  outcome, exitReason, completedPercentage })`. No private text in outcome/history.
  Only emitted terminal attempts are used for feedback; mount/progress is not completion.
- The shared completion serializer uses an allowlist. Provide the exact coarse
  outcome fields before adding a new allowlist entry; do not pass whole drafts.

Confirmed three-new worker IDs/exports:

| ID | Default component |
| --- | --- |
| `selfCompassion` | `SelfCompassionExperience.jsx` |
| `unhook` | `UnhookExperience.jsx` |
| `makeRoom` | `MakeRoomExperience.jsx` |

Tapping provisional ID/export: `eftTapping` / `EFTTappingExperience.jsx`; final
worker contract still needed. Calm primary, Ground secondary/discoverability.

The four new component files are not present in this environment. No unavailable
route or invented registration is added. Integration requires transferring their
bundles and confirming names, durations, mechanisms, eligibility and outcome fields.

## Standalone pause bridge

Host sends `{ type:"mentication:pause-for-alternative", requestId }` to the iframe's
same origin. Receiver must check origin, `event.source === window.parent` and string
requestId, then pause existing timer/audio without clearing valid progress. Reply
`{ type:"mentication:alternative-ready", requestId }` only after pausing succeeds.
The host accepts only matching source/origin/request. A timeout reports a visible
error and leaves the running practice uncovered.

Receivers implemented in this patch: Vector Shift, Night Channel, The Good Map,
and Dear 2100. Foundations and SignalLock receivers must be supplied by their
internal workers. The original builds correctly time out until those are combined.

For SignalLock preserve the worker's grounding semantics, `external-visual-anchoring`
mechanism, Ground primary/Calm secondary and removed timed-sprint handoffs. Its key
`mentation.signal-lock.grounding.v1` is included in shared saved-memory clearing and
shared export. Host storage deletion handling disposes the old iframe before a
second clear/reload to avoid a pagehide autosave resurrecting deleted work.
Foundations must supply its canonical key to extend this handling.

## Catalogue / selector integration

Shared owner should integrate each supplied definition in `final50Catalog.js`,
`final50AlgorithmMeta.js`, `flagshipRegistry.js`, `flagshipExperienceRouting.js`,
`goalAssessment.js`, branded metadata/threshold assets and ResetFlow's lazy dispatch.
Workers should not make competing edits there.

Required supplied fields: ID/name, actual duration range, primary/secondary goals,
mechanism and mechanism family, cognitive load, arousal, audio/movement/eyes/private
setting requirements, contraindication/substate tags, pathway roles and appropriate
intensity limits. Evidence should remain explicitly unrated unless supported.

Verify each new ID through `hardEligibleV3`, `scoreInterventionV3`, `buildPathway`,
`buildSegment`, direct Library routes and preference/time filters. Verify confirmed
helpfulness and matching before/after samples use that ID/mechanism and skipped,
partial or unmeasured work supplies no fabricated improvement. Do not change the
scoring formula to force a new experience to win.

The Library now filters declared secondary directions as well as primary. Grouping
remains in the practice's primary stream, so Tapping can appear when Ground is
selected while retaining a Calm home in the catalogue.

## Transfer without a remote push

Create a Git bundle containing the local review branch relative to the common base.
Save that local deliverable as a private Library file. The parent can resolve that
file and download/materialize it in its own workspace, verify the bundle, fetch a
local review ref, then combine the patches in an isolated integration checkout.
A local path or commit hash alone cannot transfer bytes across execution machines.
