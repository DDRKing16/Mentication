# Urge Surfing rebuild — Step 2 source register

**Status:** Complete on 2026-09-09.  This is an inventory only: it does not
approve conflicting requirements or change runtime behaviour.

## How this register is used

Every later Urge Surfing step must cite the applicable register item(s).
`Authoritative visual` means the source is used for the interface's observable
appearance. `Authoritative product` means it is used for safety, privacy,
accessibility, and truthful behaviour. A duplicate is verified byte-for-byte
and has one canonical path for future reference.

## 2026-09-10 user-supplied implementation pack — binding amendment

The user has expressly requested that Urge Surfing be designed **exactly as
specified** in the following supplied files. They are the canonical material
for this rebuild and supersede the earlier visual/reference classifications
below wherever they differ:

- `/Users/dylandesai-rogers/Downloads/mentation_urge_surfing_detailed_build_spec.pdf`
- `/Users/dylandesai-rogers/Downloads/Urge-Surfing-build-specification.md`
- `/Users/dylandesai-rogers/Documents/Mentication/App Interventions (primary code guide)/Urge Surfing/Assets/Mentication_Urge_Surfing_WAVE_SYSTEM/`
- `/Users/dylandesai-rogers/Documents/Mentication/App Interventions (primary code guide)/Urge Surfing/Assets/Mentication_Urge_Surfing_ALL_58_PNG_ASSETS_FLAT/`

The detailed specification establishes the five core screens, 393 × 852
reference canvas, visual tokens, semantic-UI requirement, post-window rating,
and functional-state requirements. The 58 atomic PNGs are approved visual and
content references where their filename identifies an approved state or
screen. They are never full-screen UI substitutes.

The current runtime copies under `public/media/interventions/urge-surfing/`
remain the canonical implementation copy only after byte comparison to the
user-supplied assets. The files under the user-supplied directories remain
read-only source material.

## A. Authoritative visual references

| ID | Canonical source | Role | Verified detail |
| --- | --- | --- | --- |
| V1 | `Visual Assets_MentiCation/Urge Surfing/Boards/complete-intervention-design-board.png` | Complete five-screen system board | 3200 × 2500; byte-identical copies exist in `design-boards/` and `intervention-library/source-assets/project-boards/` |
| V2 | `Visual Assets_MentiCation/Urge Surfing/Screen Concepts/urge-surfing-mentation-branded-concept.png` | Mentication-branded concept reference | 1692 × 930; duplicate at `design-boards/urge-surfing-mentation-branded-concept.png` |
| V3 | `design-boards/urge-surfing-choice-window-production-concept.png` | Choice Window production concept | 1692 × 930; duplicated in `intervention-library/source-assets/project-boards/` |
| V4 | `Visual Assets_MentiCation/Urge Surfing/Individual Screens/01-name-the-wave.png` | Screen 1 — Name the wave | 325 × 745; byte-identical runtime reference: `public/media/interventions/urge-surfing/name-the-wave.png` |
| V5 | `Visual Assets_MentiCation/Urge Surfing/Individual Screens/02-find-the-pull.png` | Screen 2 — Find the pull | 325 × 745; byte-identical runtime reference: `public/media/interventions/urge-surfing/find-the-pull.png` |
| V6 | `Visual Assets_MentiCation/Urge Surfing/Individual Screens/03-set-your-anchor.png` | Screen 3 — Set your anchor | 325 × 745; byte-identical runtime reference: `public/media/interventions/urge-surfing/set-your-anchor.png` |
| V7 | `Visual Assets_MentiCation/Urge Surfing/Individual Screens/04-ride-the-crest.png` | Screen 4 — Ride the crest | 330 × 745; byte-identical runtime reference: `public/media/interventions/urge-surfing/ride-the-crest.png` |
| V8 | `Visual Assets_MentiCation/Urge Surfing/Individual Screens/05-you-kept-the-choice.png` | Screen 5 — You kept the choice | 330 × 745; byte-identical runtime reference: `public/media/interventions/urge-surfing/you-kept-the-choice.png` |

The five individual-screen images are comparison references only. They must
never be rendered as a whole-screen substitute for real, accessible UI.

## B. Authoritative product and implementation references

| ID | Source | Role in later steps |
| --- | --- | --- |
| P1 | `docs/standards-pass-01-urge-and-prediction.md` | Safety gate, choice-window intent, agency-based outcome, persistent exits, reduced-motion and automatic-trace requirements, local-memory limits, and handoffs |
| P2 | `docs/personalisation-memory-privacy-contract.md` | What can be kept locally and what must not be inferred or retained |
| P3 | `docs/shared-intervention-control-shell.md` | Shared exit, accessibility, and immersive-control expectations |
| P4 | `docs/intervention-design-audit.md` | Safety sequencing and production-readiness amendment record |
| P5 | `docs/top-five-intervention-experience-audit.md` | Required Choice Window, live wave tracking, grounded handoffs, and non-judgemental outcomes |
| P6 | `docs/urge-surfing-100-step-plan.md` | Earlier rebuild checklist and historical implementation evidence; not final authority where it conflicts with P1 |
| P7 | `docs/intervention-scripts.md` | Legacy narration/copy material; not approved automatically and must not override P1 |

## C. Approved production asset pack

All assets below are in `public/media/interventions/urge-surfing/assets/` and
are atomic UI/art assets, not complete-screen replacements.

| Asset group | Files |
| --- | --- |
| Wave system | `WAVE_SYSTEM__urge-wave-idle.png`, `WAVE_SYSTEM__urge-wave-intensity-3.png`, `WAVE_SYSTEM__urge-wave-intensity-8.png`, `WAVE_SYSTEM__urge-wave-timer-active.png`, `WAVE_SYSTEM__urge-wave-final-seconds.png`, `WAVE_SYSTEM__urge-wave-reduced-motion.png`, `WAVE_SYSTEM__wave-system-spec.png` |
| Body map | `BODY_MAP__urge-body-map-base.png`, `BODY_MAP__body-map-selected-chest.png`, `BODY_MAP__body-map-spec.png`, `BODY_MAP__region-head_face.png`, `BODY_MAP__region-throat_neck.png`, `BODY_MAP__region-shoulders.png`, `BODY_MAP__region-chest.png`, `BODY_MAP__region-upper_abdomen.png`, `BODY_MAP__region-lower_abdomen.png`, `BODY_MAP__region-pelvis.png`, `BODY_MAP__region-arms_hands.png`, `BODY_MAP__region-legs_feet.png`, `BODY_MAP__region-whole_body.png` |
| Choice-window dial | `DURATION_DIAL__duration-dial-30s.png`, `DURATION_DIAL__duration-dial-60s.png`, `DURATION_DIAL__duration-dial-90s.png`, `DURATION_DIAL__duration-dial-120s.png`, `DURATION_DIAL__duration-dial-150s.png`, `DURATION_DIAL__duration-dial-180s.png`, `DURATION_DIAL__duration-dial-spec.png` |
| Crest/ocean/hand | `CREST_OCEAN_HAND__crest-line-art.png`, `CREST_OCEAN_HAND__guiding-hand-line-art.png`, `CREST_OCEAN_HAND__ocean-horizon-line-art.png`, `CREST_OCEAN_HAND__crest-ocean-hand-reference.png` |
| Urge and sensation icons | `ICONS__icon-send.png`, `ICONS__icon-check.png`, `ICONS__icon-use.png`, `ICONS__icon-snap.png`, `ICONS__icon-avoid.png`, `ICONS__icon-hot.png`, `ICONS__icon-tight.png`, `ICONS__icon-buzzing.png`, `ICONS__icon-restless.png` |
| Navigation and controls | `ICONS__icon-back.png`, `ICONS__icon-chevron.png`, `ICONS__icon-close.png`, `ICONS__icon-decrement.png`, `ICONS__icon-increment.png`, `ICONS__icon-information.png`, `ICONS__icon-microphone.png`, `ICONS__icon-stop.png`, `ICONS__icon-timer.png` |
| Completion handoffs | `ICONS__icon-leave.png`, `ICONS__icon-reach_out.png`, `ICONS__icon-substitute.png` |
| Asset specifications | `ICONS__icons-reference.png`, `TYPOGRAPHY__typography-approved-spec.png`, `POST_RATING__post-rating-approved-screen.png`, `HANDOFF_PRIVACY__handoff-privacy-approved-spec.png`, `REFERENCE__asset-pack-contact-sheet.png`, `WHY_90_SECONDS__why-90-seconds-approved-screen.png` |

Additional approved art in `public/media/interventions/urge-surfing/approved-art/`:
`body-map-front-back.png`, `crest-at-sunset.png`, and `ocean-horizon-sunset.png`.

## D. Supporting and derivative material

| Source | Classification | Reason |
| --- | --- | --- |
| `Visual Assets_MentiCation/Urge Surfing/Earlier Iterations/pre-brand-production-concept.png` | Historical | May explain evolution; cannot override V1–V8 |
| `intervention-library/final/boards/urge-surfing-elite-board.png` | Supporting board | Inspect during comparison, but does not replace the supplied screen set |
| `intervention-library/final/assets/urge-surfing-existing-system.png` | Existing-system evidence | Documents prior state, not a UI target |
| `tmp/urge-reference-01.png` through `tmp/urge-reference-05.png` | Derived comparison copies | Must be hash-checked against V4–V8 before use |
| `tmp/pdfs/urge-spec-01.png` through `tmp/pdfs/urge-spec-18.png` | Rendered specification pages | Inspect as a source rendering; do not treat as an editable source file |
| `tmp/intervention-audit/contact-sheets/06-urgeSurf.jpg` and `tmp/intervention-audit/screens/06-urgeSurf-01.png` through `06-urgeSurf-03.png` | Previous audit evidence | Historical only |
| `scripts/render_urge_surfing_board.py` | Reference-rendering utility | May be used to inspect boards; does not define product behaviour |

## E. Existing implementation — not a source of truth

These files show what is already present and will be assessed later. They do
not override visual or product references:

- `src/components/UrgeSurfExperience.jsx`
- `src/lib/urgeSurfSession.js` and `src/lib/urgeSurfSession.test.js`
- `src/lib/urgeSurfState.js` and `src/lib/urgeSurfState.test.js`
- `src/styles/urge-surfing.css`, `src/styles/urge-surfing-v2.css`,
  `src/styles/urge-surfing-brand.css`, and `src/styles/urge-surfing-fonts.css`
- the `urgeSurf` integration branch in `src/pages/ResetFlow.jsx`

## Step 2 exit condition

The visual references, product standards, approved atomic assets, derivatives,
and legacy implementation are all named and classified. Step 3 can now set the
source hierarchy without silently treating an older asset or incomplete code
path as authority.
