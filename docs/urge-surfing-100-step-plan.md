# Urge Surfing 100-Step Rebuild Plan

**Goal:** Rebuild Urge Surfing as five real, accessible, local-first screens, matching the supplied visual references at 390 x 844 without altering Thought or Fact.

**Working rule:** Complete, test, capture, compare, and correct each step before continuing. A checked item is evidence-backed, not assumed.

## Foundation and boundaries

- [x] 1. Confirm the writable project checkout. Evidence (2026-09-09): `pwd` and `git rev-parse --show-toplevel` both resolved to `/Users/dylandesai-rogers/Documents/Mentication App Build (Code)`; the workspace root and `src/` are writable.
- [x] 2. Inspect `git status --short`. Evidence (2026-09-09): baseline contains 59 modified, 28 deleted, and 58 untracked paths. Urge-specific candidates are untracked and confined to `src/components/UrgeSurfExperience.jsx`, `src/lib/urgeSurfSession*`, `src/lib/urgeSurfState*`, and this plan; all other paths remain out of scope.
- [x] 3. Inspect the scoped diff and preserve unrelated changes.
- [x] 4. Read the full Markdown build specification.
- [x] 5. Read the full production handoff.
- [x] 6. Read the asset manifest.
- [x] 7. Inspect the supporting PDF and its five-screen references.
- [x] 8. Inspect each original visual reference screen.
- [x] 9. Inspect the supplied individual PNG asset pack.
- [x] 10. Inspect the Urge Surfing CSS import cascade.
- [x] 11. Identify the Urge-only component, state, test, and style boundaries.
- [x] 12. Confirm Thought or Fact files are out of scope.
- [x] 13. Confirm no complete screen image will be used as UI.
- [x] 14. Confirm local-only data and no remote transcription policy.
- [x] 15. Confirm approved fonts, colours, durations, and handoff rules.

## Baseline architecture and tests

- [ ] 16. Define the route and event contract against the approved specification.
- [ ] 17. Define Urge-only configuration constants and stable keys.
- [ ] 18. Define encrypted-draft adapter boundary without changing global storage.
- [ ] 19. Add a failing test for valid initial intensity.
- [ ] 20. Implement the minimal initial-intensity reducer behavior.
- [ ] 21. Add a failing test for one selected urge category.
- [x] 22. Implement and pass single-category replacement behavior.
- [ ] 23. Add a failing test for one selected body region.
- [ ] 24. Implement and pass single-body-region behavior.
- [ ] 25. Add a failing test for selectable sensations.
- [ ] 26. Implement and pass sensation behavior.
- [ ] 27. Add a failing test for 30-180 second duration bounds.
- [x] 28. Implement and pass 15-second duration normalization.
- [ ] 29. Add a failing test for wall-clock timer restoration.
- [ ] 30. Implement and pass timer restoration.
- [ ] 31. Add a failing test for idempotent timer completion.
- [ ] 32. Implement and pass idempotent completion.
- [ ] 33. Add a failing test for null post-rating.
- [ ] 34. Implement and pass honest null post-rating behavior.
- [ ] 35. Add a failing test for one protected ten-minute extension.
- [ ] 36. Implement and pass extension de-duplication.
- [ ] 37. Add focused interaction tests for screen-route transitions.
- [ ] 38. Run the focused Urge test suite before UI work.

## Screen 1 - Name the Wave

- [ ] 39. Re-measure Screen 1 reference layout at 390 x 844.
- [ ] 40. Map Screen 1 supplied wave and icon assets to their slots.
- [ ] 41. Add a failing Screen 1 validation test.
- [ ] 42. Implement real safe-area header, back, exit, title, and progress.
- [ ] 43. Implement accessible 1-10 intensity selection.
- [ ] 44. Implement visible selected intensity state and announcement.
- [ ] 45. Implement supplied wave-system asset state without rasterizing the screen.
- [ ] 46. Implement five real category controls with supplied icons.
- [ ] 47. Implement disabled-until-valid Continue behavior.
- [ ] 48. Implement an honest unavailable on-device voice-entry state.
- [ ] 49. Implement keyboard focus order and 44 px targets.
- [ ] 50. Capture the live screen at exactly 390 x 844.
- [ ] 51. Compare source and live capture side-by-side.
- [ ] 52. Correct Screen 1 P0/P1/P2 visual differences.
- [ ] 53. Recapture and record a passing Screen 1 comparison.

## Screen 2 - Find the Pull

- [ ] 54. Re-measure Screen 2 reference layout at 390 x 844.
- [ ] 55. Map supplied body base, overlays, and sensation icons to slots.
- [ ] 56. Add a failing Screen 2 selection and validation test.
- [ ] 57. Implement addressable body-region controls over the supplied base.
- [ ] 58. Implement visible selected-region overlay and non-colour marker.
- [ ] 59. Implement the equivalent accessible region-list alternative.
- [ ] 60. Implement real sensation selection controls.
- [ ] 61. Implement back preservation and Continue validation.
- [ ] 62. Verify reduced-motion selection behavior.
- [ ] 63. Capture the live screen at exactly 390 x 844.
- [ ] 64. Compare source and live capture side-by-side.
- [ ] 65. Correct Screen 2 P0/P1/P2 visual differences.
- [ ] 66. Recapture and record a passing Screen 2 comparison.

## Screen 3 - Set Your Anchor

- [ ] 67. Re-measure Screen 3 reference layout at 390 x 844.
- [ ] 68. Add a failing anchor validation and trim-preservation test.
- [ ] 69. Implement the real multiline anchor field and helper copy.
- [ ] 70. Implement the 30-180 second duration controls in 15-second increments.
- [ ] 71. Implement supplied dial-reference asset treatment around a real dial value.
- [ ] 72. Implement plus/minus bound-disabled states.
- [ ] 73. Implement `Why 90 seconds?` focus-returning disclosure.
- [ ] 74. Implement the approved explanation copy exactly.
- [ ] 75. Implement Start my window validation and draft checkpoint boundary.
- [ ] 76. Capture the live screen at exactly 390 x 844.
- [ ] 77. Compare source and live capture side-by-side.
- [ ] 78. Correct Screen 3 P0/P1/P2 visual differences.
- [ ] 79. Recapture and record a passing Screen 3 comparison.

## Screen 4 - Ride the Crest

- [ ] 80. Re-measure Screen 4 reference layout at 390 x 844.
- [ ] 81. Add a failing countdown and background-restoration test.
- [ ] 82. Implement timestamp-derived remaining time.
- [ ] 83. Implement timer start persistence before route entry.
- [ ] 84. Implement supplied active, final-seconds, and reduced-motion wave states.
- [ ] 85. Implement supplied crest/ocean/hand artwork in its intended slot.
- [ ] 86. Implement initial-intensity readout without clinical inference.
- [ ] 87. Implement optional haptic status without fabricated native behavior.
- [ ] 88. Implement lifecycle recovery and invalid-state notice.
- [ ] 89. Capture the live screen at exactly 390 x 844.
- [ ] 90. Compare source and live capture side-by-side.
- [ ] 91. Correct Screen 4 P0/P1/P2 visual differences.
- [ ] 92. Recapture and record a passing Screen 4 comparison.

## Screen 5, handoffs, and release validation

- [ ] 93. Re-measure Screen 5 reference layout at 390 x 844.
- [ ] 94. Implement approved post-window rating screen and skip behavior.
- [ ] 95. Implement truthful Before/Now comparison with null omission.
- [ ] 96. Implement the four real next-action controls and supplied icons.
- [ ] 97. Implement one protected Wait 10 More ten-minute timer loop.
- [ ] 98. Implement honest Change the Scene, user-chosen reach-out, and substitute-picker handoffs.
- [ ] 99. Capture, compare, correct, and recapture Screen 5 at 390 x 844.
- [ ] 100. Run all tests, lint, production build, `git diff --check`, responsive/accessibility checks, and final five-screen design QA report.
