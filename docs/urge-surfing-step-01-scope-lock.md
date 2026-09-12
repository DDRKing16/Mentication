# Urge Surfing rebuild — Step 1 scope lock

**Status:** Complete on 2026-09-09.  No runtime implementation changed in this step.

## Sole product scope

The only product being rebuilt is **Urge Surfing**.  Work will be completed
one approved step at a time and must remain faithful to the supplied Urge
Surfing source material.

## Allowed implementation boundary

Future Urge Surfing work may modify only the following paths when a later
approved step requires it:

- `src/components/UrgeSurfExperience.jsx`
- `src/lib/urgeSurfSession.js` and `src/lib/urgeSurfSession.test.js`
- `src/lib/urgeSurfState.js` and `src/lib/urgeSurfState.test.js`
- `src/styles/urge-surfing.css`, `src/styles/urge-surfing-v2.css`, and
  `src/styles/urge-surfing-brand.css`
- `src/pages/ResetFlow.jsx`, only for the existing `urgeSurf` entry/exit
  integration
- Urge-Surfing-specific approved assets under
  `public/media/interventions/urge-surfing/`
- Urge-Surfing-specific documentation and visual-QA evidence under `docs/` and
  `output/`

## Explicitly protected

- `src/components/ThoughtOrFactExperience.jsx`
- `src/lib/thoughtOrFactState.js`
- `src/styles/thought-or-fact.css`
- Thought or Fact data, consent, completion, handoff, and UI behaviour
- Every unrelated modified, deleted, or untracked file already present in this
  checkout

`ResetFlow.jsx` is a shared integration point.  Any future change there must
be restricted to the `interventionId === "urgeSurf"` branch and must not alter
the `factCheck` branch or the shared reset-flow behaviour.

## Verification evidence

- The workspace contains substantial pre-existing uncommitted work, which is
  treated as user work and is not to be reset, cleaned, reformatted, or
  attributed to this rebuild.
- The current Urge Surfing route is already isolated to
  `UrgeSurfExperience.jsx` through the `interventionId === "urgeSurf"` branch
  in `ResetFlow.jsx`.
- Thought or Fact has a separate dedicated component and is out of scope.

## Exit condition for Step 1

This scope record exists, no protected file has been changed, and later steps
must cite this boundary before making a runtime edit.
