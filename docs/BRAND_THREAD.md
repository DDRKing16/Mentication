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

**Phase 2 — done:** The Closing. `BrandClosing` (`src/components/brand/BrandClosing.jsx`)
is the mirror of the Threshold: the coral thread draws in, then the logo and
wordmark resolve out of it, in the colour world of whichever intervention the
session just finished with. It plays once from `ResetFlow.jsx`'s single
`completeSession` function, so it covers every pathway that flow drives to an
end -- the shared reflect screen (Box Breathing, PMR, Grounding, Vector Shift,
Signal Lock) and the direct-exit experiences (Thought or Fact, Urge Surfing,
Change the Scene, Tomorrow Parking Lot, The Happy Bump) alike -- before handing
off to the shared "done" screen or navigating home. To make sure nothing of
the old screen could show through as the moment fades, `ResetFlow` renders
*only* the Closing while it plays (never stacked on top of the screen that
was showing), and only advances once it finishes. Not covered yet: Night
Channel, which exits through its own "Leave Night Channel" control rather
than the shared completion path -- that belongs with phase 5's direct routes.

**Owner feedback, 24 Sep (drives phase 3 below):** some interventions feel clunky and
"like a different app", not tied into Mentication. Next Easiest Step and Change the
Scene were named first; Tomorrow Parking Lot and Urge Surfing are close behind. The
test for "tied in": someone moving from Home or the Library into any intervention should
never feel they left Mentication. That means the same chrome, type, surfaces and
transitions everywhere, with each intervention keeping only its own colour world and
personality. No build labels, version numbers or dev text may ever show to a user.
Done so far: Library cards carry a chip in each intervention's own colours;
Next Easiest Step's "V2" and package label were replaced by a "Mentication · Focus" line.

**Next phases (in order):**

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
