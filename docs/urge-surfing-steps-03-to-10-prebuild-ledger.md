# Urge Surfing rebuild — Steps 3–10 pre-build ledger

**Status:** Superseded as a planning baseline on 2026-09-10. No runtime
implementation changed in this batch.

## 2026-09-10 Steps 3–5 revalidation against the user-supplied pack

### Step 3 — source hierarchy (binding)

| Priority | Authority | Governs |
| --- | --- | --- |
| 0 | User request: reproduce the supplied documents exactly | Scope, fidelity, and no generic redesign. |
| 1 | User-supplied detailed PDF and Markdown specification | Product behaviour, core-screen sequence, visual tokens, responsive and accessibility requirements. |
| 2 | User-supplied 58-asset pack and Wave System pack | Approved per-screen visual composition, copy where supplied, and atomic asset placement. |
| 3 | Existing runtime copies of those assets | Implementation source only after byte comparison. |
| 4 | Earlier project standards, boards, plans, and code | Compatibility and regression evidence only; they cannot alter the attached design. |

This replaces the prior dark moonlit-screen interpretation. The binding core
visual targets are cream input/completion screens and a deep-teal Ride the
Crest screen, with editorial serif headings, humanist control text, restrained
gold accents, and sea-glass active feedback.

### Step 4 — current-build audit

| Area | Finding | Result for rebuild |
| --- | --- | --- |
| Entry flow | Current code inserts `urge.safety` and `urge.safetySupport` before Name the Wave. | Not part of the attached board pathway; do not carry it forward without an explicit user decision. |
| Core visual system | Existing CSS uses near-black teal as the canvas for every screen and uppercase headings. | Replace screen by screen; it is not a visual target. |
| Route composition | Current flow adds a choice-outcome route and omits the supplied Why 90 seconds screen. | Rebuild against the attached route/state map. |
| Timer copy/control | Current timer invents a stop route and asserts a rise/peak/fall sequence. | Preserve only behaviour/copy explicitly supplied or approved in the new pack. |
| Legacy data assumptions | Current category/sensation selection, anchor limit, and duration bounds are hard-coded. | Move to approved configuration during later state work; do not treat current values as approved. |

**Visual-QA status:** A local development server started successfully. The
browser automation environment was blocked by an administrator security check
before it could open `http://127.0.0.1:5173`, so no new browser capture was
accepted as evidence. The next visual gate remains a 393 × 852 live capture;
this is a tooling blocker, not a substitute for visual acceptance.

### Step 5 — session and accessibility baseline

| Contract | Baseline finding | Required treatment |
| --- | --- | --- |
| State | `urgeSurfSession.js` already has stable route identifiers, integer intensity, end-timestamp timing, and null post-intensity support. | Retain only compatible mechanics; rebuild transitions from the supplied state map. |
| Privacy | Current session does not retain voice audio/transcript; coarse learning excludes raw text/body detail. | Maintain the attached v1 local-only boundary; do not add provider or cloud behaviour. |
| Semantics | Native buttons, input range, textarea, focus ring, labelled body hotspots, and a region-list fallback exist. | Keep and refine; all final controls need source-faithful visual treatment with 44 px targets. |
| Gaps | No supplied Why 90 seconds screen; no modal focus return; range slider is an invisible circular hit target; progress is decorative rather than source-faithful text; timer announces every update. | Correct in the relevant screen steps before visual acceptance. |
| Reduced motion | A global reduced-motion rule exists. | Use the supplied static wave state and avoid animated dial/wave motion in this mode. |

**Steps 1–5 exit condition (2026-09-10):** the attached pack is now the
binding source, the prior implementation is documented as baseline-only, the
permitted edit boundary remains locked, and source/contract/accessibility gaps
are recorded without changing runtime behaviour.

**Verification:** all 58 PNGs in the user-supplied flat asset pack match their
runtime counterparts by SHA-256 (58 matched, zero missing, zero different).
The existing Urge Surfing state/session test suites pass (20 tests). These
checks verify the baseline mechanics and asset provenance only; they do not
replace the pending 393 × 852 visual comparison.

## 2026-09-10 Steps 6–10 — Name the wave implementation

### Step 6 — layout and entry

The live Urge Surfing entry now opens directly on `urge.name`, matching the
supplied five-screen pathway. The retired safety-gate routes and components
were removed from the live entry. The screen has the supplied back affordance,
right-aligned `1 of 5` progress text, heading and prompt, central intensity
area, voice affordance, category row, and bottom Continue action.

### Step 7 — typography and colour

Screen 1 uses the specified warm-cream canvas, deep-teal content and action
colour, sea-glass active state, restrained antique-gold separator/accent, EB
Garamond display type and Inter control copy. This treatment is deliberately
scoped to Screen 1; later screens will be rebuilt individually rather than
recoloured by a global pass.

### Step 8 — intensity control

The source wave state changes between idle, lower-intensity and higher-
intensity supplied assets. Ten visible, semantic radio controls replace the
former invisible range hit-area. Each value has an accessible name, selected
state and 44 px minimum target; the chosen dot retains the source's
sea-glass/gold treatment.

### Step 9 — category controls

The five supplied category icons and labels are real buttons, retain their
stable keys, show a non-colour selected state, and preserve the disabled
Continue state until intensity and a category are selected.

### Step 10 — Screen 1 interaction states

Back remains an explicit route to the calling surface. Voice selection keeps
existing answers and exposes a concise manual-continuation notice instead of
discarding the user’s selections. Continue moves only a valid Screen 1 state
to `urge.body`. The current one-category selection follows the supplied visual
reference; the eventual multi-select product rule remains a later explicit
configuration decision.

**Verification:** the Urge Surfing session/state suites pass (19 tests) and
the production build completes. The live 393 × 852 capture is still pending:
the browser environment again blocked localhost access before a screenshot
could be made, so the visual comparison has not been waived.

## Step 3 — locked source hierarchy

| Priority | Authority | Governs | Rule |
| --- | --- | --- | --- |
| 0 | User requirement to rebuild from supplied files exactly | Scope and fidelity | Do not replace the supplied visual/interaction system with a generic reset or static screen image. |
| 1 | `docs/standards-pass-01-urge-and-prediction.md` | Safety, suitability, truthful claims, choice, privacy, accessibility, and handoffs | Supersedes incompatible legacy board copy or asset labels. |
| 2 | V1–V8 in `docs/urge-surfing-step-02-source-register.md` | Observable visual system, screen hierarchy, supplied control composition, and five-screen experience | Reproduce this visual language with real semantic UI. |
| 3 | Approved atomic asset pack | Wave, body, crest/ocean/hand, dial, icon, typography, and handoff artwork | Use the supplied atomic asset in its intended slot; do not redraw it generically or use a complete screen as a component. |
| 4 | Product/privacy/accessibility references P2–P5 | Local-first persistence, shared controls, accessibility equivalents, and relevant app routing | Apply when they add a requirement without contradicting priorities 0–3. |
| 5 | Older plan/script, audit captures, existing code, historical boards | Discovery and regression evidence only | Never treat legacy implementation or wording as approval. |

## Step 4 — pass/fail requirement ledger

| ID | Requirement | Passing evidence |
| --- | --- | --- |
| R01 | Urge Surfing remains isolated from Thought or Fact and unrelated work. | Diff is within the Step 1 boundary. |
| R02 | Danger/suitability gate occurs before body tracking, countdown, or immersive wave imagery. | Tested No, Yes, and Unsure routes. |
| R03 | Yes/Unsure never starts a solo surf; immediate support is offered. | Interaction test and live capture. |
| R04 | The five supplied screens are real usable UI, not raster screens. | Semantic interaction plus 390 × 844 capture for each screen. |
| R05 | Name the wave includes header, 1–10 intensity, wave/waveform, optional voice state, five icon categories, hint, and validation. | Interaction, accessibility, and visual comparison. |
| R06 | Find the pull has body-region, environment alternative, sensation, non-colour selected state, and validation. | Interaction and visual comparison. |
| R07 | Set your anchor has real anchor input, truthful choice window, working bounds, and no fixed-duration biological claim. | Field/control test and visual comparison. |
| R08 | Ride the crest has timestamp-derived time, approved ocean/wave states, static reduced motion, and non-drag alternative. | Lifecycle, reduced-motion, keyboard/tap, and visual comparison. |
| R09 | Stop, Leave trigger, Grounding, and support are visible or immediately reachable during an active surf. | Capture and interaction test. |
| R10 | Completion measures available choice first; lower intensity is optional and unchanged/stronger remains valid. | Tests: lower, same, higher, skipped, and support. |
| R11 | Wait, leave trigger, substitute, reach out, and deliberate action are real handoffs; one protected extension only. | Handoff and extension tests. |
| R12 | Raw urge text, voice material, and body detail are excluded from coarse learning metadata. | Storage test and local-data inspection. |
| R13 | Saving a useful strategy is explicit, optional, and device-local. | Consent/storage test. |
| R14 | Controls have 44 px targets, visible focus, accessible name/state, and keyboard route. | Accessibility audit. |
| R15 | Reduced motion, large text, high contrast, silent, and low-motor routes work. | Preference-mode captures and keyboard test. |
| R16 | Each core screen passes a 390 × 844 visual comparison. | Side-by-side capture, discrepancy list, and resolved recapture. |

## Step 5 — source conflicts resolved openly

| Conflict | Sources | Binding resolution |
| --- | --- | --- |
| Fixed `Why 90 seconds?` claim | V6 and `WHY_90_SECONDS__why-90-seconds-approved-screen.png` versus P1 | Preserve its information-control position, scale, and affordance; replace its claim with truthful choice-window information. Never assert an urge ends in 90 seconds. |
| Five core references versus early safety gate | V4–V8 versus P1 | Add a quiet non-immersive suitability gate before Screen 1. The five supplied screens remain visual targets for the core surf. |
| Fixed wave rises/peaks/falls | V7 and legacy script versus P1 | Keep moonlit water, crest, trace, and wave language, but let the wave continue beyond frame and never promise it will disappear in-session. |
| Before/Now implies improvement | V8 versus P1 | Keep comparison composition; make Now optional and permit same/higher intensity without failure. Primary result is reported available choice. |
| Standard duration range | Dials include 30–180 seconds; P1 separates Immediate 30–45 seconds from Standard 90 seconds–3 minutes | Standard Screen 3 offers 90, 120, 150, and 180 seconds. A later Immediate route may offer 30 or 45 seconds. |
| Body visual versus body-or-environment mechanism | V5 versus P1 | Preserve the body map as primary visual and add an equivalent environment/trigger route. |
| Haptic-flow visual versus native capability | V7 versus local-first runtime | Retain visual treatment only when optional haptics are available; otherwise no fabricated haptic activity or promise. |
| Legacy promise of lower intensity | Library/legacy script versus P1 | Remove the promise: the aim is more deliberate choice whether or not intensity changes. |

## Step 6 — current live baseline captured

**Route:** Library → Urge Surfing → Begin → `/reset?step=1`.

**Viewport:** 390 × 844.

The current Screen 1 provides semantic controls, a 1–10 slider, five category
choices, and a disabled Continue state. It is baseline evidence only: the
current line-wave, visual density, spacing, icon presentation, waveform, and
overall five-screen flow do not match the supplied references.

## Step 7 — supplied reference capture set inspected

| Reference | Native canvas | Core observable target |
| --- | --- | --- |
| V4 — Name the wave | 325 × 745 | Dark moonlit field, champagne chrome, luminous circular wave/waveform, teal microphone, five equal icon controls, bottom-dot progress. |
| V5 — Find the pull | 325 × 745 | Centred luminous full-body figure, chest selection light, four two-column sensation controls, bottom-dot progress. |
| V6 — Set your anchor | 325 × 745 | Script-style anchor field, central circular duration dial, independent minus/plus, information control, gold Start control, ocean edge. |
| V7 — Ride the crest | 330 × 745 | Full-bleed moonlit ocean/crest/hand, centred countdown, trace path, intensity medallion, waveform, guidance, haptic-status area. |
| V8 — You kept the choice | 330 × 745 | Before/Now comparison, duration card, four stacked full-width action controls, quiet closing copy. |

## Step 8 — reference measurement record

The references include a device frame. Their native canvases are source
evidence and must not be non-uniformly stretched to 390 × 844. Preserve these
normalised placement rules at the target mobile viewport:

| Screen | Geometry to preserve |
| --- | --- |
| V4 | One-row header; prompt immediately below; circular wave in central upper half; voice/categories in one vertical flow; hint and progress above bottom safe area. |
| V5 | Header/prompt in top quarter; full body centred with readable chest light; 2 × 2 sensations in lower third; progress above bottom safe area. |
| V6 | Compact header/prompt; real anchor above dial; minus/plus horizontally aligned to dial centre; information then primary action then closing copy. |
| V7 | Art fills safe canvas; countdown top-centred; trace vertically centred; intensity/waveform/readout below it; low-contrast status strip in bottom safe area. |
| V8 | Header, affirmation, and Before/Now occupy top third; time card follows; four equal-height full-width actions; closing copy bottom-anchored. |

Shared visible material: near-black blue/green sea, champagne-gold keylines
and display type, luminous turquoise active state, off-white body copy, fine
outlines, sea texture, uppercase display titles, and generous tap targets.
Exact screen offsets will be measured during each screen's dedicated build step
rather than guessed in a global CSS pass.

## Step 9 — approved asset-to-slot map

| System | Live slots |
| --- | --- |
| Screen 1 | `WAVE_SYSTEM__urge-wave-idle.png`, intensity assets, category `send/check/use/snap/avoid`, `microphone`, `back`, `chevron`, and typography specification. |
| Screen 2 | `BODY_MAP__urge-body-map-base.png`, selected-region overlays, `hot/tight/buzzing/restless`, and body-map specification. |
| Screen 3 | Duration-dial states/specification, `decrement`, `increment`, `information`, and `back`. |
| Screen 4 | Active/final/reduced-motion wave assets, crest/ocean/hand art, timer, and stop. |
| Screen 5 | Post-rating and handoff/privacy specifications, `leave`, `reach_out`, `substitute`, and timer/completion icons. |
| Cross-screen QA | Contact sheet, icon reference, typography reference, and `*-spec.png` files validate usage; they are not visible UI. |

## Step 10 — complete-screen-image prohibition confirmed

V4–V8 and their byte-identical runtime duplicates are comparison-only. The
live app must use semantic controls, text, and approved atomic assets. A later
completion check must prove that intensity, category, region/environment,
sensations, anchor, duration, timer, rating, skip, stop, leave, support, and
handoff controls change real state rather than merely displaying an image.

## Batch exit condition

The hierarchy, requirements, resolutions, baseline, source inspection,
measurement record, asset map, and screen-image prohibition are recorded. Step
11 can now define the final route and event contract from this ledger.
