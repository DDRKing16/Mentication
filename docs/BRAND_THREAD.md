# The Mentication Brand Thread

Each intervention is its own world (its own colours, motion and personality).
The **brand thread** is what makes them all feel like Mentication: a small set
of shared elements that appear in every one, on top of each intervention's
own look.

## The idea in one line

> Every intervention is a different room, in its own colours. You always enter through the same
> door, and a thread runs through all of them.

## The shared elements

| Element | What it is | Where it comes from |
|---|---|---|
| **The Logo and Wordmark** | The real supplied artwork: the brushed doorway with its flowing figure, the hand-lettered wordmark and its swash. Revealed in three beats (doorway settles in, wordmark writes on, swash sweeps out). Never redrawn | `src/components/brand/BrandLockup.jsx`, artwork in `public/media/brand/logo/` |
| **A colourway per intervention** | The logo's four inks (wordmark, figure, swash, arch) come from the MCN V1 Branding Kit colour package, a different set for each of the 12 interventions | `src/lib/brandColourways.json`, `INTERVENTION_COLOURWAY` |
| **The Thread** | The line that runs through every intervention, in that intervention's swash colour: a hairline under each name and the progress line in the shared shell | `BrandHairline`, `InterventionControlShell` |
| **Moment type** | EB Garamond *italic* for the headline of a "moment" (opening, closing). Hanken Grotesk for all interface text | `var(--font-editorial)` and `var(--font-heading)` |
| **One easing** | Every brand moment uses the same easing curve so they feel like one hand | `BRAND_EASE` |
| **Label** | The header label always reads `MENTICATION · <GOAL>` | `InterventionControlShell` |

## What stays unique

Each intervention keeps its own colour world (`INTERVENTION_ATMOSPHERE`) and its own
logo colourway (`INTERVENTION_COLOURWAY`). Tests check that all twelve of each
stay distinct, so the set never blurs into one look.
Interventions keep their own motion, layout, typography inside the experience,
and interaction.

## Rules

0. **Never redraw, approximate or restyle the logo or wordmark.** Only the supplied artwork is used: `public/media/brand/mentation-navy-coral-transparent.png` is the source. `python3 scripts/build_brand_logos.py` splits it into its three real parts and recolours them for each colourway in `src/lib/brandColourways.json`. The colourways are colours from the brand kit; add new ones from the kit only, then re-run the script and commit the generated files.
0b. **Reliability:** the logo reveal animates opacity and transform only. Never clip-path, masks or SVG geometry: some web views silently drop those and the logo would stay hidden. A test enforces this.
1. Never restyle an intervention's colour world to "match" another. Distinct is the point.
2. Brand elements go on top of a world, never replace it.
3. Every brand moment is short (under 2s), skippable with a tap, and skipped
   entirely when Reduce motion is on.
4. Nothing about an intervention's steps, wording or timing changes for branding.
5. New interventions get an entry in `INTERVENTION_ATMOSPHERE` and `INTERVENTION_COLOURWAY` (a colourway no other intervention uses) and a test row.

## Status

**Phase 1 — done:** The Threshold. Every intervention started from the Library
now opens with the real logo and wordmark, in that intervention's own
colourway from the brand kit, revealing themselves over that intervention's own
colour world, then its name in Garamond italic with a hairline under it, then the door lifts (`WithBrandThreshold` in `ResetFlow.jsx`). The shared shell shows
progress as a thread in the intervention's colour and the label as `MENTICATION · <GOAL>`.

**Next phases (in order):**

2. **The closing moment.** The Thread completes: the shared completion/reflect
   screens and each intervention's own ending resolve into the logo and
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
