# The Mentication Brand Thread

Each intervention is its own world (its own colours, motion and personality).
The **brand thread** is what makes them all feel like Mentication: a small set
of shared elements that appear in every one, on top of each intervention's
own look.

## The idea in one line

> Every intervention is a different room. You always enter through the same
> coral door, and a coral thread runs through all of them.

## The shared elements

| Element | What it is | Where it comes from |
|---|---|---|
| **The Doorway** | The coral arch (with the soft flowing figure beneath it) from the logo, drawn as stroke art so it can animate | `src/components/brand/BrandDoorway.jsx` |
| **The Thread** | The coral brush swash from under the wordmark. Used as a title underline, a progress line, and a divider | `BrandSwash`, and the progress line in `InterventionControlShell` |
| **Moment type** | EB Garamond *italic* for the headline of a "moment" (opening, closing). Hanken Grotesk for all interface text | `var(--font-editorial)` and `var(--font-heading)` |
| **One easing** | Every brand moment uses the same easing curve so they feel like one hand | `BRAND_EASE` |
| **Coral** | `#E0715C` on dark worlds, deeper `#D6553F` on the one light world (5-4-3-2-1 Grounding) | `getBrandCoral(id)` |
| **Label** | The header label always reads `MENTICATION · <GOAL>` | `InterventionControlShell` |

## What stays unique

Each intervention keeps its own colour world. The registry in
`src/lib/interventionBrand.js` records each one (`INTERVENTION_ATMOSPHERE`) and a
test checks that all twelve stay distinct, so the set never blurs into one look.
Interventions keep their own motion, layout, typography inside the experience,
and interaction.

## Rules

1. Never restyle an intervention's colour world to "match" another. Distinct is the point.
2. Brand elements go on top of a world, never replace it.
3. Every brand moment is short (under 2s), skippable with a tap, and skipped
   entirely when Reduce motion is on.
4. Nothing about an intervention's steps, wording or timing changes for branding.
5. New interventions get an entry in `INTERVENTION_ATMOSPHERE` and a test row.

## Status

**Phase 1 — done:** The Threshold. Every intervention started from the Library
now opens with the Doorway drawing itself in that intervention's own colour
world, then its name in Garamond italic with the coral Thread under it, then the
door lifts (`WithBrandThreshold` in `ResetFlow.jsx`). The shared shell shows
progress as a coral thread and the label as `MENTICATION · <GOAL>`.

**Next phases (in order):**

2. **The closing moment.** The Thread completes: the shared completion/reflect
   screens and each intervention's own ending resolve into the Doorway and
   swash, so every session closes the same way.
3. **Chrome unification.** The bespoke chromes (Box/PMR/Grounding player, Urge
   Surfing bar, Next Easiest Step buttons, Tomorrow Parking Lot buttons) adopt
   the shared header label, thread progress and button style.
4. **Type harmonisation.** Moment headlines in EB Garamond italic everywhere;
   retire stray families (Fraunces, Lora, Nunito Sans, Inter, Space Grotesk,
   Georgia) where it can be done without changing the look people love.
5. **Direct routes.** `/next-easiest-step`, `/night-channel`, `/parking-lot`
   and `/signal-lock` get the Threshold too. Signal Lock exists as two builds
   (native dark navy and an iframe in cream/lime) and should become one look.
6. **Shared surface recipe.** One set of tokens for glass surfaces (border,
   blur, radius) and grain so cards and docks match across worlds.
