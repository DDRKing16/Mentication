# Combined journey contracts

The release contains 17 catalogue practices plus Dear 2100 and Foundations. Original names/artwork remain in their approved components; Tara is excluded pending its assets. Four original worker builds use actual IDs `eftTapping`, `selfCompassion`, `unhook`, `makeRoom`; display names are Gentle Tapping, Self-Compassion, Unhook from the Thought, and Make Room for the Feeling.

## Shared React controls

`JourneyOptions({ id, onOpen, label? })` opens a native dialog with a tailored in-place alternative, retains the mounted practice, and awaits timer/audio pause. Rejected pauses show an error. Closing never resumes or grants completion. Native dialog supplies focus containment and Escape.

`JourneyTakeaway({ id })` saves only explicitly entered text through `takeawayStore`, separate from history/statistics. Established care cards, Thought or Fact records and other archives reuse their own storage. Return points reads actual records and supports deletion; saving is optional and device-local, with visible failures.

ResetFlow lazily dispatches the four new components. Gentle Tapping's adapter preserves its own question and stopped/incomplete status; a stopped round receives no full credit. Care outcomes contain only their exact numeric assessment and coarse practice/action choices. Private notice, perspective and action text never enter session history or completion snapshots. The host goal question remains a separate optional check-in; missing baselines never produce a comparison.

The new techniques have Unrated evidence metadata, declared goal/mechanism/duration/preferences and ordinary V3 history learning. No scoring weights or new clinical matching claims were introduced. Tapping retains its supplied `automaticEligible:false` restriction for automatic-only plans; it is explicitly selectable. Existing access policy is reused via PlusGate and remains unchanged.

## Secure native pause bridge

Host sends `{ type:'mentication:pause-for-alternative', requestId }` to the exact same-origin iframe. The document validates origin and parent source, pauses, then acknowledges `{ type:'mentication:alternative-ready', requestId }`. The host validates source/origin/request and rejects after 1.5 seconds if acknowledgement is missing. Native receivers exist for Foundations, Signal Lock, Vector Shift, Night Channel, Good Map and Dear 2100.

Deletion reset disposes mounted Signal Lock, Good Map and Foundations documents before a second clear, preventing pagehide autosave from resurrecting removed data. Tapping stops its writer and exits on cross-tab deletion. Saved notes, care cards, tapping drafts, Signal Lock and Foundations keys participate in shared deletion/backup/export paths.

Home's source lives in `design/home-source`; its validated opaque-origin bridge and token remain intact. Initial recommendation data and document layout are ready before its route controls become available. Regenerate `public/home.html` with the existing build script. Dear 2100 edits remain in `design/dear2100/app.js` and are regenerated with its existing script.
