# Tara practice-first visual checkpoint

This is a review checkpoint, not a finished regression-tested release. The previous completed version remains in the same branch history at `0ca1bd4`; its screenshot-only checkpoint is `864ae77`.

Open the `*-viewport.png` files for the first-screen experience and `*-full.png` for complete layouts. `capture-manifest.json` records dimensions, SHA-256 hashes, fixture provenance and browser errors.

Implemented in this proposed checkpoint:

- The two situation/challenge selections reveal a specific move without an extra confirmation screen.
- A readable plan offers one-field editing and alternative authored moves; backup details stay collapsed.
- Rehearsal presents an explicitly imagined cue, a response choice and its purpose. Only the explicit “I tried it” action marks rehearsal as practised.
- Live mode starts with the chosen move, direct support actions and a return to the event. Entering live mode directly has a clearly labelled suggested pause.
- Reflection separately records whether the prediction happened, with partial, not-tested and unsure choices. Original stored difficulty comparisons stay intact.
- Existing draft/recap storage, explicit save, clear-data and completion callbacks remain; additive experienceVersion 2 and predictionResult require host allowlisting.

Captures use synthetic review wording, not personal data or real-world claimed outcomes. The 320px captures set the root font size to 24px (150% of the default) and use reduced-motion preference. At 320px support options require scrolling after the expanded move; the move appears early and the text remains enlarged.

Lint and typecheck passed before capture. Full unit/browser/build regression is pending; the old browser harness still expects the prior flow. Parent owns host registration, combined navigation and release. No main merge or deployment is part of this checkpoint.
