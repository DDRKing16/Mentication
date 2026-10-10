# Improvement agent log

One line per work block: date, what changed, commit.

- 2026-09-24 — Hid the grey scroll lines under the Library filter buttons (65df40c8).
- 2026-09-24 — Made haptics actually work on iPhone via @capacitor/haptics (eef7dc12).
- 2026-09-24 — Brand thread phase 1: shared Doorway "Threshold" opening for all 12 interventions, coral thread progress + MENTICATION · GOAL label in the shared shell (see docs/BRAND_THREAD.md).
- 2026-09-24 — Threshold now uses the real logo and wordmark artwork (replaced my redraw); added a navy-ink version of the same artwork for the light Grounding world; rule added: never redraw the logo.
- 2026-09-24 — Logo now shown in 12 different brand-kit colourways (one per intervention) using the real artwork split into doorway/wordmark/swash; reveal rebuilt with opacity/transform only after the clip-path version stopped showing for the owner; thread + hairline take each colourway's swash colour.
- 2026-09-24 — Brand thread phase 2: added the Closing, a brief brand moment that plays as a session ends (the coral thread draws in, then the logo resolves out of it, in the last intervention's own colours) before handing off to the shared finish screen or home; covers Box Breathing, PMR, Grounding, Vector Shift, Signal Lock, Thought or Fact, Urge Surfing, Change the Scene, Tomorrow Parking Lot and The Happy Bump (b3c7c86, 826d106, 60e1dff). Watched it play in a real headless-browser run through Thought or Fact end to end; no flash of the old screen, clean handoff to Home.
- 2026-09-24 — Restored the finished Vector Shift (games) and Night Channel (Tune In dashboard) builds; Signal Lock/Vector Shift/Night Channel now have Back+Home; added Back to Box Breathing, PMR, Grounding, Urge Surfing, Tomorrow Parking Lot and Back+Home to Next Easiest Step; added AI-agent guardrails (.github/copilot-instructions.md, AGENTS.md).
- 2026-09-24 — Removed the spot-the-difference Scan game from Vector Shift (Code now leads straight to Reframe; step list renumbered).
- 2026-09-24 — Tie-in pass: Library cards now carry a chip in each intervention's own colours; removed build labels from Next Easiest Step; documented owner feedback that interventions must feel like one app (drives brand phase 3).
- 2026-09-24 — Library options redesigned as world cards (own background, glow, real logo in own colourway); Vector Shift card text no longer mentions the removed scan game; recorded the Mentication Standard and work order in the brand doc.
- 2026-09-24 — Brand thread phase 3 (chrome unification), first slice: Urge Surfing's header now reads MENTICATION · CALM with a coral thread instead of its old mismatched pink logo and dot progress, and its button is the shared pill shape (cceedbb). Box Breathing and 5-4-3-2-1 Grounding's shared player header now reads MENTICATION · GOAL in place of the technique's own name — Grounding had no header label at all before (fb43c1a, 8e7bf72). Tomorrow Parking Lot's night capture flow now reads MENTICATION · SLEEP instead of a plain "Tomorrow Parking Lot" line (c2c2480). Checked on real headless-browser runs at 375x812 through each of the four. Still to do: Next Easiest Step's buttons, and the shared thread progress bar for the Box/PMR/Grounding player and Tomorrow Parking Lot.

## 24 Sep — Screen-fit pass
Checked every intervention at 375x667, 390x844 and 1440x900 for content running off-screen. Fixed Thought or Fact and Change the Scene (too tall on small phones) and The Happy Bump (its glowing line made the page wider than a 390 phone). Standalone builds scroll a little inside their frame; left as is.

## 24 Sep — Brand thread phase 3, continued: the progress thread
Pulled the shared shell's coral progress bar into one reusable piece (`BrandThreadProgress`) and gave it to the two places that were still drawing their own: the Box Breathing / PMR / 5-4-3-2-1 Grounding player (was a plain intervention-colour hairline) and Tomorrow Parking Lot's capture/seal/parked steps (had no progress line at all) (2236529). Watched all four in a real headless-browser run at 375x812 — each shows its own colourway ink, nothing recoloured to match another. Updated the brand doc's status and started SUGGESTIONS.md, flagging that Next Easiest Step's post-ladder "Momentum Dashboard" screen breaks from the rest of its own burgundy/gold palette into cyan-on-navy, and that its colours are marked "locked" in the file, so left for the owner rather than guessed at (dd8aeaa). Did not touch Next Easiest Step's buttons — its primary buttons already use the shared pill shape.

## 24 Sep — Brand thread phase 6: one shared glass recipe for chrome
Started the shared surface recipe phase. `InterventionControlShell`'s header buttons and bottom control dock (Change the Scene, Thought or Fact, The Happy Bump, and Vector Shift/Signal Lock/Night Channel when reached as one step in a longer plan) and `InterventionNav`'s floating Back/Home buttons (every standalone build, Next Easiest Step, Tomorrow Parking Lot) each had their own slightly different border/background/blur numbers for what's the same kind of floating glass button. Pulled both into one shared recipe in `src/index.css` (`.brand-chrome-btn`, `.brand-chrome-dock`, with a light-tone variant for cream worlds) and pointed both components at it (9534a5a). Also gave the Vector Shift/Signal Lock/Night Channel step panel's card the same family (`.brand-chrome-card`), keeping its exact existing colours so its look didn't change (bc5b1c9). Checked in a real headless-browser run at 375x812 across Change the Scene, Thought or Fact, The Happy Bump, Vector Shift, the light-toned Signal Lock build and Next Easiest Step — every world kept its own colours, only the chrome on top now matches. Extended the brand test suite to guard the shared recipe. Left for a future pass: the Box/PMR/Grounding player's own dock (already good) and the smaller popups (ambient sound, sleep timer); updated docs/BRAND_THREAD.md with what's done and what's left.

## 25 Sep — Brand thread phase 6, second slice: the popups pick up each world's own colours, plus a real off-screen bug fixed
The Box/PMR/Grounding player's smaller popups (ambient sound, the sleep soundscape mixer, the sleep timer, and the "this isn't helping" switch sheet) were the last piece of chrome still hardcoded to one fixed dark teal, wrong most visibly on the light 5-4-3-2-1 Grounding world and the light Focus direction. They now take their colours from the same per-intervention theme already used elsewhere in the player, via a small set of reusable helper classes in `src/index.css` (b893536). Checking that change in a real headless-browser run (375x812) turned up a genuine bug, not caused by this change but visible through it: all three popups position themselves with a CSS transform to centre on screen, and that transform was being silently overwritten by their own open/close animation, so each one rendered with its left edge at screen centre — about half of it cut off past the phone's right edge. Fixed by centring with a plain wrapper instead of a transform on the animated element (3c575b6). Added a regression test for both fixes (0952dc0). Watched all three popups across the Sleep (dark), Ground (light) and Calm (dark) directions — each now shows its own world's colours, correctly centred, nothing cut off. Updated docs/BRAND_THREAD.md; left for a future pass, same as before: the player's own header and control dock (already good, lower priority).

## 24 Sep — Brand thread phase 5: the direct doorways that had none
Checked and confirmed Signal Lock, Vector Shift and Night Channel already open through the Threshold and carry the shared Back/Home bar however they're reached — that was done in an earlier pass. Found two real gaps and closed them: opening `/next-easiest-step` directly (as Tomorrow Parking Lot's "act on this now" handoff does) skipped the Threshold entirely, now it plays like everywhere else (ef4d0cc); and Home's "Tomorrow Parking Lot" card opened straight into the daytime review with no doorway and no Back/Home button anywhere on its first screen — it now opens through the Threshold on that fresh visit and carries the shared Back/Home buttons throughout, while re-opening the review right after parking something at night (which just played its own closing moment) still goes in directly so nobody sees two brand moments in a row (04c8fed). Watched both in a real headless-browser run at 375x812, including seeding a parked note to see the review screen itself. Audited every `font-family` in the app for the type-harmonisation phase and found it already done — the shared shell and brand moments use one set of type tokens everywhere, and the only raw font names left are each intervention's own protected, deliberately different typography — so marked phases 3 and 4 done and recorded phase 5's remaining item (Signal Lock's two different-looking builds) in SUGGESTIONS.md rather than guessing at a fix (4c266a0).
## 25 Sep — Grounding polish 1
Each sense step now casts its own soft coloured glow behind the figure (gold for sight, blue for touch, violet for hearing, warm coral for smell, green for taste) plus a warm horizon at the bottom, so the room feels lit rather than flat cream. Steps and wording unchanged.

## 25 Sep — Warmer narrator
All 754 narration clips re-made in the Jessica voice (warmer, slightly slower, more expressive; chosen by the owner from samples). Same words, same file names, timing data refreshed. Old voice is in git history if it needs to come back.

## 25 Sep — Narrator, final voice
All 754 narration clips re-made with the ORIGINAL narrator voice on the eleven_v3 engine, prefixed with the delivery cue "[warmly, smiling, gently]" (stability 0.35, style 0.7, no speaker boost). Chosen by the owner from samples ("friendly and expressive"). Word timing refreshed. The voice is slower than before: 8 steps now run 1-4 s over their hold time (the player waits for the voice, so nothing is cut off). The earlier Jessica-voice commit is in history.

## 25 Sep — Brand thread phase 6, third slice: the Box/PMR/Grounding player's own header and dock
The last piece of chrome still on its own one-off glass numbers instead of the shared recipe was the Box Breathing / PMR / 5-4-3-2-1 Grounding player's own Back/Exit buttons and bottom control dock. Both now use the same `.brand-chrome-btn` / `.brand-chrome-dock` classes as everywhere else, with the light-tone variant kept for the light Grounding world (5a987ea). Extended the brand chrome registry test to guard it (a5a2792). Checked in a real headless-browser run at 375x812 across Box Breathing (dark), 5-4-3-2-1 Grounding (light) and Progressive Muscle Relaxation (dark) — nothing about the icons, colours or layout changed, only the glass they sit in. Updated docs/BRAND_THREAD.md — phase 6 is now done.

## 25 Sep — Box Breathing's images no longer load at every app launch, dead code cleanup
index.html was preloading two ~2MB Box Breathing images with high priority on every single app launch, whether or not anyone ever opened Box Breathing. Moved that warming to fire only when Box Breathing is actually selected, alongside the narration warm-up that already happens at that moment, so it still starts instantly (6af6328). Verified with a real headless-browser network trace: neither image loads at launch, both load within moments of picking Box Breathing. Also cleared out dead code the lint warnings had been flagging in Next Easiest Step and Journal — unused colour constants, two entire unused render functions, a few unused helper functions and catch-block variables — without changing what either screen shows or does (29f923a). Checked both screens in a real headless-browser run afterward; full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as before.

## 25 Sep — Load-speed pass: the two biggest bundles named in the work order
With the brand thread phases done, moved to the next item: loading speed, no new libraries. Found the reset flow (`ResetFlow.jsx`) was statically importing all twelve interventions' own guided-experience components, so starting any single one downloaded the code for every one of them. Only one ever runs per session, so each now loads on demand via React.lazy/Suspense once the pathway is known — covered by the existing brand Threshold curtain, so nothing flashes on screen. Two small helper functions the flow needs synchronously (`isInteractiveFlagship`, `isNewFlagship`) moved into the existing data-only routing module so importing them doesn't pull the heavy components back in eagerly (96c2f61). Drops the reset flow's own bundle from 890.88 kB to 487.67 kB (247.12 kB to 135.41 kB gzip).
Separately, found that the regulation profile page (`RegulationProfile.jsx`) was statically importing `ResetHistory`, the only place in the whole app that uses the `recharts` charting library — so everyone who opened their profile downloaded a full charting library before their history chart, or even the "no resets yet" empty state, needed a single line drawn. That component now loads on demand too, with a small skeleton shown label-first while it loads (1506ac9). Drops the regulation profile's own bundle from 424.98 kB to 9.39 kB (116.98 kB to 3.06 kB gzip); the chart library now lives in its own 416.80 kB chunk that only downloads once there is a chart to draw.
Checked the third named bundle (the main `index` chunk, ~459 kB): it's mostly React, the router, the animation library and the Home screen, all needed for the very first thing anyone sees — nothing "rarely used" was hiding inside it to split out safely.
Verified both changes in real headless-browser runs at 375x812 (Change the Scene, Next Easiest Step, Thought or Fact, Tomorrow Parking Lot, Urge Surfing, and the regulation profile both empty and with seeded history) — no console or page errors, nothing looked different. Full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run.
## 27 Sep — The Good Map added
The owner's Good Map Journey (a card sort, map reveal, one small step, check-ins) is now an intervention in Lift, opens from the Library and from its own card on Home. It is a finished standalone build (public/good-map), tied in from outside like Signal Lock: shared Threshold, Back and Home, and its own logo colourway (jade-champagne). The showcase page around the prototype (jump list, store listing, web-quiz mock, card bank) is hidden, the phone mock fills the screen, Google Fonts links are removed (offline rule, so fonts fall back to system serif and sans), and it starts on Mixed cards. Not yet reviewed: the file says the quiz is made by a practising psychologist and includes a support screen for low scores; both need the owner's confirmation before release.

## 27 Sep — Good Map narration
Every Good Map screen speaks one brief line in the new narrator voice (19 clips in public/good-map/audio, lines in lines.json), started from the prototype's own screen-change hook. A small sound button (top right) turns it off and remembers the choice. The support screen (with the crisis numbers) and the psychologist-sharing screen are deliberately silent: safety wording is not ours to write without the owner.

## 27 Sep — Accessibility and robustness pass
Brand thread phases 1–6 and the load-speed/dead-code items from the last two runs are all done, so this block moved to the next item in the work order: accessibility and robustness. Found the app had no top-level error boundary anywhere — a bug in any single screen would take the whole app down to a blank white page. Added one calm, on-brand recovery screen ("Something didn't load right", Try again / Go home, styled like the existing 404 page) that catches any render error and resets automatically when the person navigates away (c01b0f7). Verified by forcing a real error and confirming it caught cleanly, then reverted the test change.
Also found the Box/PMR/Grounding player's floating popups (ambient sound, the soundscape mixer, the sleep timer, the "this isn't helping" switch sheet) had no keyboard way to close except tapping their own control, and the soundscape mixer's per-sound mute button and volume slider only ever announced "layer" with no name. All four now close on Escape and carry proper dialog/menu roles and names; the mixer's controls now name the actual sound (e.g. "Mute Rain") (2e57b9a). Checked in a real headless-browser run: opened and Escape-closed the ambient picker and the switch sheet inside a live Box Breathing session, nothing visually changed.
Last, found Home's Journal entry card and three of Next Easiest Step's primary controls (the active-step card and both "continue the ladder" cards) were plain clickable divs — unreachable and untriggerable from a keyboard, and not announced as interactive to a screen reader. The Journal card is now a real button; the other three keep their exact look but now take focus and respond to Enter/Space (0ad3c7d). Checked in a real headless-browser run: focusing and pressing Enter on the active-step card gave the identical result as clicking it with a mouse.
Full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run; three new regression tests guard all of the above.

## 27 Sep — Visual polish pass: the shared "in-between" screens
With the brand thread phases and the earlier fallback items all done, surveyed every one of the 12 interventions with a real headless-browser run at 375x812 (opening screen, and further into several flows) looking for the next visual polish target. Most of the app already holds up well; found two real problems in the screens shared by every intervention rather than any one intervention's own world. First: the "Your N-minute reset" screen shown after picking a single practice from the Library put the activity card near the top and the Begin button pinned to the very bottom, leaving a large dead gap between them — worse than it looked in the code, because in light mode the "gradient" background it used was actually two identical colours, so the whole gap was flat, empty cream (cbce105). The content now centres as one composed group instead. Second, pulling that thread further: that same flat-in-light-mode background was copied across eleven more places — Settings, Privacy, the Regulation Profile, and every step of the adaptive reset builder (check-in, question and finishing screens) in `ResetFlow.jsx` — all of them a plain, textureless colour instead of the soft radial glow already used elsewhere in the app. All of them now reuse that same existing `.calmbg` recipe instead of duplicating the flat gradient (9866418). Checked each affected screen (Settings, Privacy, Insights/Regulation Profile, the adaptive reset's check-in and question steps, Box Breathing's and 5-4-3-2-1 Grounding's overview cards) in a real headless-browser run — same layout and content everywhere, just a touch of depth instead of flatness. Also looked closely at Change the Scene, Tomorrow Parking Lot, The Happy Bump, Next Easiest Step and Vector Shift's own screens for genuine visual bugs; found none — Tomorrow Parking Lot's suggestion-chip row that looked cut off on the right turned out to be a deliberate scrollable row with a fade edge, not a bug. Found one wording issue (Change the Scene's opening line reads like web-app instructions, "Click the play button below…") and logged it in SUGGESTIONS.md rather than editing it, since wording is the owner's call. Full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run.

## 27 Sep — Visual polish pass: Tomorrow Parking Lot
With the brand thread and every earlier fallback item done, this block's visual-polish turn went to Tomorrow Parking Lot, one of the interventions the owner named as feeling clunky. Walked the whole flow in a real headless-browser run at 375x812 (both the night capture flow and the daytime review) and found two real problems, both scoped to this one intervention's own files. First: the opening "What are you holding onto?" screen, before you answer whether it can wait, and the "It's parked" screen right after saving, both packed their content to the top of the screen and left a large empty gap below — on the opening screen, over half the phone was blank until you picked an answer. The Back/Close buttons stay exactly where they were; the content below them now composes as one centred group in the space that's left, so a short answer no longer looks like a half-finished page, while the fuller states (once you're actually writing, or the "needs attention" card appears) already filled the space and look exactly as before (4f96373). Second, and more serious: a leftover style rule was quietly forcing every button in this intervention to use whatever text colour its surrounding card happened to have, instead of its own intended colour. Most of the time that went unnoticed because the colours were close enough, but it made the "Not tonight" button on the "Something to listen to" card render in almost the same dark shade as its own dark background — the text was there, but unreadable. The same bug was also flattening the coral highlight that's supposed to show which answer you picked (the "It can wait" / "It needs attention now" chips), and muting the header's icon buttons very slightly. Removed the one redundant style line responsible; every button already sets its own colour, so nothing needed to be added (b0154eb). Checked the previously-invisible button, the now-visible selected-chip colour, and every other screen in the flow (capture, seal, parked, darkness, the daytime review and its Edit/Organise/Delete panels) in a real headless-browser run — nothing else changed, only the colours that were supposed to show all along. Full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run.

## 27 Sep — Visual polish pass: Change the Scene
With every earlier fallback item done, this block's visual-polish turn went to Change the Scene, the intervention the owner named first as feeling clunky. Walked the entire nine-step flow in a real headless-browser run at 375x812 (every step, both suggestion panels, and the closing pathway screen) and found three real, verified problems, all scoped to this one intervention's own file. First: the small caption under each step's action button (e.g. "2 of 6 - keep going") had no space above it, so the button's own solid drop-shadow -- a deliberate 3D "pressed" edge -- painted straight over the top of the caption on every single step, leaving only a sliver of half-legible text peeking out underneath. Gave the caption a small top margin so it always sits clearly below the button now. Second, and more serious: the header title and its three icon buttons were hardcoded to a dark green colour for every step except the very first -- correct for the intervention's light-background steps, but three steps (Soften, Plan, and the closing reflection) share the same near-black maroon world as the opening screen, where that dark green text was nearly invisible against the dark background. Those three steps now keep the light header colour the opening screen already uses correctly. Third: the closing "Relax & Shift" / "Keep Moving" screen packs a title, an eight-option two-column list, a text field and three shortcut buttons into less space than they need on a 375x812 phone, and with no scroll that content quietly ran behind the fixed action button and "This is not helping" link at the bottom -- the last two of eight options were genuinely hidden under the button, not just crowded. Made that one screen scroll within its own card so every option is reachable and nothing overlaps (be895e7). Checked all three fixes across every step of a fresh walkthrough, plus the "This is not helping" and accessibility panels on both a light and a dark step, to confirm nothing else regressed. Also found, while stepping through the closing screen, that its "Happy Bump" and "Dear 2100" shortcut buttons only show a "Launching..." toast and don't actually open either one -- logged in SUGGESTIONS.md rather than wiring navigation myself, since where they should lead is a product call (a7539bb). Full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run.

## 27 Sep — Visual polish pass: Next Easiest Step
Brand thread phases, the load-speed/dead-code/accessibility items and Change the Scene and Tomorrow Parking Lot's visual passes were already done, so this block's turn went to Next Easiest Step, next in the owner's named order and not yet given its own pass. Walked the whole flow in a real headless-browser run at 375x812 (opener, task picker, focus player, pause overlay, and the post-ladder dashboard) and found four real, verified navigation bugs, all scoped to this one intervention's own file. First and most serious: the ladder's "Active Step" card on the opener, the dashboard's post-ladder "start a new task" button, and the Pause overlay's "Back to Ladder" button each sent the app to a screen name ("brain-check" or "ladder") that has no matching screen anywhere in the file -- tapping any of them left a person on a blank page with nothing but the Home button and no way forward except leaving the intervention entirely. All three now go to the existing screens they clearly meant to reach (0099395, 1a465e8, 14130b6). Second, a related logic bug on the dashboard: the check meant to tell a finished ladder apart from an unfinished one was always true once any ladder had been started, so the dashboard -- which is only ever shown once a ladder is fully done -- kept offering "CONTINUE LADDER" instead of "START NEW TASK"; tapping it reopened the very last, already-completed step as if it were still live, and pressing Done there again would silently count as another win. Removed the dead branch so the dashboard always offers starting fresh (1a465e8). Third: the focus player's own Pause button and the shared floating Home button that appears on every screen both landed in the same top-right corner, nearly on top of each other; Home is drawn on top, so a tap there always hit Home instead of Pause, making Pause effectively untappable. Gave Pause a right margin to clear Home and an aria-label, with a regression test guarding the gap (c6478ec). Also fixed a plain misspelling of the brand wordmark ("MentiCation") in this screen's own header (6487e1a). Checked every fix in a real headless-browser run, including a full walkthrough (opener through Pause, Back to Ladder, resuming, completing a whole 5-step ladder, and starting a new task from the dashboard) with zero console errors throughout. Did not touch the Momentum Dashboard's colours or Change the Scene's non-working shortcut buttons -- both already flagged in SUGGESTIONS.md as the owner's call. Full test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run; a new regression test guards the Pause/Home fix and the existing keyboard-accessibility tests were updated to match the corrected navigation.
## 28 Sep — Urge Surfing wave, higher quality
Rewrote the wave animation (UrgeWave.jsx): the surface now uses layered noise instead of pure sine waves, so it never looks tiled; the curl is a real barrel shape (the face overshoots and hooks back on itself) instead of one smooth bezier; added a soft specular highlight so the water reads as translucent, a lit rim along the crest, and physically falling spray droplets flung off the lip when the wave pitches. No steps, wording or timing changed.

## 28 Sep — Urge Surfing wave, second pass
Pushed the wave further after feedback: caustic light shafts drifting under the surface, ambient airborne mist near a tall crest even without a full break, and a persistent whitewater trail that rides the surface and slowly dissolves instead of a static foam band redrawn each frame. Same steps and wording.

## 28 Sep — Urge Surfing wave, real hollow barrel
Reworked the curl into an actual hollow tube instead of a folding lip: a dark cave (radial-gradient shadow, with a cool reflected-light rim) sits under a separate bright, curling tongue of water that pitches out and drops back onto the face. Sized so the hollow reads as large — big enough for a rider — at the wave's peak curl. Spray and foam anchors updated to the new geometry. Sound was left off; the wave was checked with the preview server muted.

## 28 Sep — Urge Surfing wave, fixed the barrel
The previous attempt at a hollow barrel (a second overlapping tongue/cave shape) self-intersected and threw stray lines on screen — reverted that. The barrel is back to one continuous, self-consistent curve like the earlier working version, just with a much bigger overshoot at full curl, plus a single plain radial shadow (clipped to the wave, so it can never paint outside it) to sell the hollow. Checked clean through a full Notice-to-Pass cycle with no stray shapes.

## 28 Sep — Urge Surfing wave, rebuilt to match a reference
Started over after the owner shared a flat-illustration wave reference: rewrote the whole animation as a calm, flat shape instead of a noisy/photoreal one. The curl is now a proper rolled scroll — an outer and inner curve winding around one point with a steadily SHRINKING radius, so it can never cross itself or glitch, however tightly wound. A small dark hollow shows through near the tightly-wound tip, matching the reference. Removed all the noise-texture, caustics and random particle bursts from the last two passes; foam is now a small, fixed, smoothly fading cap. Checked clean through a full cycle.

## 28 Sep — Urge Surfing wave, fixed the pop-in
Found why the curl looked like it "formed all at once": the spiral's size and wind amount had a built-in minimum, so the instant any curl appeared it jumped straight to a half-wound shape instead of starting from nothing. Both now start at zero and grow with an eased curve, so on screen it visibly begins as a small hook and winds tighter frame by frame into the full scroll, then unwinds the same way as the wave passes. Watched Rise through Crest closely to confirm.

## 28 Sep — Urge Surfing wave, delayed the hook to just before crashing
After feedback that the hook appeared too early and looked like a separate loop scaling up: the curl amount is no longer tied to the exercise's curl keyframe (which started ramping right at the start of the Crest hold, far too early). It's now tied to overall time directly and stays at exactly zero through Notice, Allow, Rise and roughly the first 60% of the Crest hold - a plain wave, no lean at all - only starting to fold over itself in the last stretch before the crash, finishing and crashing right around Soften. Verified by sampling the canvas's own pixels through a full session: zero change for the first ~58% of the session, then the fold and crash, then settling foam. Body and curl remain one shape/one gradient (from the previous fix).

## 28 Sep — Urge Surfing: a repeat button
Added "Ride it again" to the finished screen, next to the existing options. It restarts the same wave (same length as the one just done) from the very beginning, ready to rate again at the end. Verified it actually resets the wave animation to its first stage rather than just navigating home.

## 28 Sep — Dear 2100 replaced with the updated build
Swapped /dear-2100 to the owner's newer build (originally made with ChatGPT's own app tools). It's a full app (React 19, Tailwind v4, ~15 screens: cover, journey map, threat-detection walkthrough, values, chapter pages, a saved book). Compiled it into a plain static bundle (public/dear2100-updated) with no new dependency added to Mentication itself: the build tooling only lives in a scratch project outside the repo. The one real change from the supplied build: it originally signed people in through a ChatGPT account and saved reflections to a server; that's replaced with saving to this device only (localStorage), matching Mentication's no-account, no-server rule. Everything else — screens, wording, art, fonts, motion — is exactly as supplied. Added one small Home button, floating at the middle of the right edge (the only spot clear on every screen of the flow), since the original had no way back to Mentication's own Home. The old hand-ported Dear 2100 flow's files are left in the repo, unused, in case of rollback.

## 28 Sep — Dear 2100: step list now visible on phone too
The step-by-step list that only showed in the left column on a wide screen now also shows on a normal phone: laid out as a compact, scrollable row of numbered steps under the header, current step highlighted, instead of hidden. Rebuilt in the same scratch build project and redeployed the static bundle; no change to wording or the flow itself.

## 28 Sep — Dear 2100 fixes from real-phone testing
Found and fixed a real crash: crypto.randomUUID() only works over HTTPS or localhost, so on a real phone (or any plain http:// address) it threw and silently broke saving, including the "Done for now" button. Replaced with a safe fallback that always works.
Also found and fixed the deeper cause of the missing threat-detection image and the mismatched book font: every image, font and icon in this build was referenced by an absolute path (like /art/foo.webp), which only resolves correctly when the app sits at the very root of a site. Once embedded under Mentication's own /dear2100-updated/ folder, every one of those silently 404d - the fonts fell back to look-alike system fonts (masking the bug) and the images just failed outright. Fixed by routing every one of them through Vite's own asset pipeline instead, so they resolve correctly wherever the build is mounted - this fixed the missing image, and also fixed the book screen using a different, unavailable font ("Nanum Pen Script") instead of the bundled handwritten "Caveat" used everywhere else.
Also: the "How survival became social" entry point is now named plainly on its own big button instead of buried behind a details disclosure; the field a person still needs to answer now pulses with a clear red glow instead of a faint blue one; and the finishing screen has a clear "Done - return to Mentication" button plus a "Here's what you have so far" heading.

## 28 Sep — Tier 2, item 1: Mentication Plus (subscription)
Added a subscription, Mentication Plus, through Apple only (StoreKit via @capgo/native-purchases; no server of ours, no third party). Everyday tools stay free; Dear 2100 and The Good Map are Plus. Non-members see a short honest preview of each with "Try it free", which opens the Plus screen (what is included, yearly/monthly plans, 7-day free trial wording, Restore purchases, Terms of Use and Privacy links, which Apple requires). After subscribing, it returns to the journey the person was trying to open. The app asks Apple once per launch whether Plus is active and remembers the answer on the device, so Plus works offline and does not lock out a paying person when there is no signal. Home cards show a small PLUS tag for non-members; Settings has a Plus section; the Privacy page says purchases are handled entirely by Apple. In the browser (no App Store) a clearly-labelled test purchase exists in development builds only. 6 new tests cover the entitlement rules.
OWNER TO DO before this can take real money: in App Store Connect create two auto-renewable subscriptions in one group with these exact IDs: com.mentation.app.plus.annual and com.mentation.app.plus.monthly; add a 7-day free-trial introductory offer to both; set prices (the A$59.99/yr and A$9.99/mo shown are placeholders until Apple returns real prices).

## 28 Sep — Tier 2, item 2: a reason to come back
Daily reminder: Settings has an On/Off and a time (default 7:30pm). It is scheduled on the phone itself (@capacitor/local-notifications), one per weekday with its own gentle wording, never guilt or streak threats. If the person has turned notifications off, it says how to turn them back on. "Your week" on Home: the seven days of this week lit up on the days a practice was done, plus a kind line ("Your week starts whenever you do." / "3 days in a row. Nice rhythm."), tapping opens the progress screen. It reads its own longer history window; the recommendation engine keeps its original 30-session input untouched. 5 new tests.

## 28 Sep — Tier 2, item 3: programmes
Three multi-day programmes made only of existing exercises (unchanged): Seven calmer days (free), Five days of small lifts (Plus), Five better nights (Plus). One day opens at a time; the next opens the following calendar day, a gentle reason to return. Progress is worked out from the sessions the app already saves, so ResetFlow and the recommendation engine are untouched and there is no second tracker to drift. Home shows today's day (or an invitation to start the free one); /programmes lists them; each has a day-by-day page with today's day glowing. Plus programmes send non-members to the Plus screen and back. 9 new tests. New framing copy listed in SUGGESTIONS.md for the owner.

## 2026-09-28 — Tier 2, item 4: "What's helping you"
- The Insights tab now opens with a plain-English story from the person's own check-ins:
  how much better they usually feel after a practice this month, their top three helpers,
  a six-week rhythm chart, and (once there's enough data) the time of day that helps most.
- The older detail (rated fit, by direction, by location) stays below under "The detail".
- Uses only data already on the phone. Recommendation engine untouched.
- Note: 3 pre-existing lint errors (unused imports) in src/components/dear2100/Barriers.jsx
  and Coping.jsx, from the earlier rescue commit. Not changed here.

## 2026-09-28 — Tier 2, item 5: first-minute onboarding
- Welcome already sends a new person straight into a calm reset (the first-minute result). Kept as is,
  including the safety footer.
- New: after their first finished reset, Home shows a one-time card: "You did it", with an evening
  reminder, the free seven-day programme, and a gentle Plus free-trial link. Close with the X; it never
  returns. Only people with 1–3 sessions see it, so existing users won't.
- Wording listed in SUGGESTIONS.md.

## 2026-09-28 — Tier 2, item 6: backup (step 1 of 2)
- Settings → Backup: "Save a backup" hands one file to the iPhone share sheet (choose Save to Files →
  iCloud Drive). "Restore from a backup" reads it back, asks first, keeps practices already on the phone.
- No new libraries. Plus status and reminder settings are never in a backup (Plus always comes from Apple).
- Privacy page: one sentence added saying backups are files you save yourself.
- NOT YET TESTED ON A REAL IPHONE: whether the share sheet offers the file needs checking once Xcode is installed.
- Step 2 (later, needs Xcode + Apple settings): automatic iCloud backup.

## 2026-09-28 — Tier 2, item 7: reliability pass (browser part)
- Opened all 23 screens at iPhone size (390×844): every one loads, no errors, nothing wider than the phone.
  Night Channel, Signal Lock and Vector Shift load their inner pages correctly.
- Fixed: Profile now counts practices even when ratings were skipped, and invites a rating next time.
- Still to do, needs Xcode: the same pass on a real iPhone/simulator, plus checking the share sheet
  (backup), notifications (reminders) and Apple's purchase sheet (Plus).

## 2026-09-28 — Reduce motion / High contrast / Captions toggles fixed
The brand thread's next phases in docs/BRAND_THREAD.md (2 through 6) were already all done, and the
earlier fallback items (preload, load speed, dead code, the error boundary) were already done too, so
this block surveyed the app in a real headless-browser run at 375x812, checking specifically for
whether "skipped entirely when Reduce motion is on" (a brand doc rule) actually held up. It didn't:
with the phone's own Reduce Motion setting simulated, the brand Threshold still played in full every
time. Traced it to two separate, disconnected places the app remembers accessibility choices: Settings'
Reduce motion / High contrast / Captions on by default toggles wrote to one of them, but the brand
Threshold and Closing, and every one of the 12 interventions' own players, only ever read the other one.
Flipping those three switches in Settings visibly moved, but changed nothing anywhere else in the app —
High contrast in particular had no matching styling at all under its old name, so it could never have
done anything even before that. Settings now writes to the same store everything else already reads
(ddef3ab). Also added something the real store was missing entirely: on a first run with no saved
Mentication preference, Reduce motion now starts from the phone's own setting, which is what the brand
doc promises and what nothing previously delivered. Verified with a real headless-browser run: simulating
the phone's Reduce Motion setting now correctly skips the Threshold before even opening the app, and
tapping Reduce motion / High contrast in Settings now visibly does what it says (checked Box Breathing's
threshold-skip and the resulting `high-contrast` class landing on the page). 6 new tests guard the
first-run default and that an explicit save always wins over it. Also looked closely at Box Breathing,
Progressive Muscle Relaxation, Thought or Fact, The Happy Bump, Vector Shift and Night Channel's own
screens for further visual problems; found none worth changing — Box Breathing's long quiet opening
turned out to be the narration simply taking longer than its nominal timing, not a stuck screen, and
resolves into its full breathing-square visual as expected. Found a smaller, related split (Settings'
three-step Text size and the in-session panel's separate Larger-text switch don't agree with each other)
and logged it in SUGGESTIONS.md rather than reshaping either control myself. Full test/typecheck/lint/build
suite passes with the same baseline dear2100 failures as every prior run.

## 2026-09-28 — Text size controls now agree
- Settings' Text size and the in-session "Larger text" switch are now one setting: changing either
  updates the other, and Reset clears both. Also fixed a timing clash that stopped the in-session
  switch from actually enlarging text. Checked both directions in the browser (16px → 18px → 21px → 16px).

## 2026-09-28 — Change the Scene: readable by VoiceOver
- Its word-by-word animated text had no real spaces (spacing was visual only), so VoiceOver would read
  "Noticeanydifferenceinhowyoufeel". Added a hidden, properly spaced copy for screen readers and hid the
  animated words from them. Looks identical on screen (same layout, checked).
- Also checked the "three broken buttons" note in SUGGESTIONS.md: that row is hidden by styling, so no one
  can reach it. Updated the note; nothing changed in the app.

## 2026-09-28 — Next Easiest Step: a leftover header, and missing screen-reader labels
With the brand thread phases and every earlier fallback item already done, checked in a real
headless-browser run at 375x812 whether the brand chrome sweep had actually reached every screen of
every one of the 12 interventions, not just the ones already named in past runs. It hadn't: the screen
you land on once you actually start a task in Next Easiest Step (reached a few taps in, past the opener
and the category picker, so easy to miss at a glance) still carried its old, pre-brand-thread header — a
small raw logo image in an off-brand green, next to plain "Mentication" text, instead of the "Mentication
· Focus" label already used on this same intervention's own opener screen. Replaced it with that same
label (dae9e97). Nothing about the ladder, its steps, timing or colours changed — checked a full walkthrough
(pick a task category, sub-category and task, work the ladder, pause and resume) with the same burgundy/
gold/cream world exactly as before, just the header text.
While in that file, found and fixed three icon-only buttons with no screen-reader label: the back arrows
on the "What are you trying to do?" and post-start focus screens, and the close button on the "Choose your
tiny start" popup (dae9e97).
Then ran a systematic accessibility scan (every button on every top-level screen, plus a full walkthrough
into each of the 12 interventions' own opening and player screens, plus the Box/PMR/Grounding player's
ambient-sound popup) checking for any button with no accessible name. Found none anywhere else — the
earlier accessibility pass was thorough. Also walked the entirety of Thought or Fact end to end (write a
thought, sort it, charge it against thinking patterns, weigh evidence for and against, reach a balanced
reframe, choose how to close) looking for genuine visual bugs; found none, so left it unchanged. Full
test/typecheck/lint/build suite passes with the same baseline dear2100 failures as every prior run.

## 28 Sep — Library no longer shows Signal Lock twice, plus a full walkthrough of two more interventions
With the brand thread phases and every earlier fallback item already done, this block started with a
close look at the Intervention Library's own search and filters (a real headless-browser run at 375x812)
and found a genuine bug: Signal Lock had a second, hardcoded "Focus session" card pinned above the search
results, always visible no matter what someone searched for or which category/filter was picked —
searching "Progressive Muscle" still showed Signal Lock at the top, and it showed up a second time,
correctly filtered, in its normal place in the Focus category. Removed the leftover pinned card; Signal
Lock now appears once, in its normal place, and disappears and reappears with search and filters like
every other practice (88d6fa4). Checked search terms, each category tab, each filter chip, and the
"No practices match" empty state before and after.
Then walked two more interventions end to end in the browser that hadn't had their own dedicated pass yet
— Progressive Muscle Relaxation (the full ~4-minute guided session, all four body sections, watching the
word-by-word narration captions and body-glow tracking match each step) and The Happy Bump (its full
11-step interactive flow: energy check-in, hydrate, step outside, the walk screen, reaching out, one small
task, three reflection prompts, a wellbeing area and step, planning what's next, re-rating, and the closing
"bump" screen). Both held up well — no layout, overlap or accessibility problems, and no console errors
across either full session. One real inconsistency found in Happy Bump: the Library lists it as "5 min",
but its own opening screen says "about 10–15 minutes," and the full walkthrough (including its own
five-minute walk timer) really does take closer to that. Logged for the owner rather than changed, since
this is a timing question (90072ce). Full test/typecheck/lint/build suite passes with the same baseline
dear2100 failures as every prior run.

## 28 Sep — A misleading button found in a full walkthrough of 5-4-3-2-1 Grounding
With the brand thread phases and every earlier fallback item already done, gave 5-4-3-2-1 Grounding its
own dedicated real headless-browser walkthrough at 375x812 (it had only had a partial pass before — a
glow effect added a few runs back, but never a full walk of every sense stage). The practice itself looks
and plays beautifully end to end (all five senses plus the closing recenter stage, each with its own soft
glow, narration and progress dot) — no visual problems found there. But testing the "Next" chip next to
"This isn't helping" turned up a real, verified problem: tapping it while on the very first sense
("Five things you can see") didn't move to the next sense as the word "Next" and the six-dot progress row
right above it both suggest — it immediately ended the whole five-minute practice and dropped straight
into the "How are you now?" check-in, skipping the other four senses entirely. Reading the code confirmed
why: that button has always meant "end this technique now," not "next stage" — Progressive Muscle
Relaxation's own player already knew this and labelled it "Next intervention" for exactly that reason, but
every other multi-stage practice (Grounding, Box Breathing and any other technique that shares this same
player) still showed the plain, misleading "Next". Gave all of them the same honest label PMR already had,
plus a new "Finish here" for when there's nothing left afterwards (6bce1b6). Nothing about what the button
does, or any technique's steps, order or timing, changed — checked the corrected label in both a
single-practice session (Grounding) and reasoned through the multi-practice case from the same code path
PMR already used successfully. Also swept My Plan, Progress, Insights, Settings (scrolled to the bottom),
Plus and Programmes in the browser and watched Box Breathing's own player, including its ambient-sound
popup; found nothing else broken. Full test/typecheck/lint/build suite passes with the same baseline
dear2100 failures as every prior run.

## 29 Sep — Three small, verified fixes after confirming the brand thread and every fallback item are done
Got a real headless browser working again (a fresh checkout each run needs its own Chromium) and checked
docs/BRAND_THREAD.md first: phases 1–6 are all marked done, and the one open item (Signal Lock's two
different-looking builds) is already flagged in SUGGESTIONS.md as needing the owner's decision, not an
agent's. A dedicated search confirmed no intervention can be reached without going through the shared
Threshold or one of the standalone builds' own frame. So this block moved to genuine bugs found by walking
real screens end to end at 375x812.
First: Signal Lock was the only one of the twelve interventions that reached out to the internet on every
single open, fetching a Google-hosted font live. Everything else in the app works offline; this was quietly
depending on a network connection for its very first paint. Removed the one line that fetched it; the text
already falls back to the system font the instant that fetch is slow or missing, so nothing about how it
looks changes, it just no longer waits on or depends on a server outside the phone (3c79ec3). Checked
before and after in the browser -- identical.
Second, in Next Easiest Step: two callback props the screen accepted were never actually used anywhere in
the file -- the screen already manages its own way out. Removed them and the two call sites that pointlessly
passed them in (e48bfb0). Checked the intervention still opens and plays exactly the same.
Third, and the more real one: opening any of the three Programmes (Seven calmer days, Five days of small
lifts, Five better nights) from the list, before tapping "Start this programme", showed every day's practice
by its internal code name instead of its real one -- "Day 4 . factCheck" and "Day 6 . urgeSurf" instead of
"Thought or Fact?" and "Urge Surfing". The moment you joined, the exact same rows correctly switched to the
real names; only the "not yet joined" view was missing that lookup. Gave it the same one (bd8ca01). Checked
all three programmes, both before and after joining, in the browser -- real names everywhere now, and the
"in progress" view is unchanged. Full test/typecheck/lint/build suite passes clean with no failures at all
(nothing baseline-excused this run).

## 29 Sep — Home was quietly downloading the whole recommendation engine on every single launch
Checked docs/BRAND_THREAD.md again first: all six phases are still done, so this block moved to the
load-speed work. A real production build showed the app's very first download -- the JavaScript every
phone has to fetch and run before Home can even appear -- was 726KB, and Vite's own build output pointed
at why: Home already goes out of its way to fetch the intervention data only when it's actually needed
(it does this the same way already for a couple of other things), but two other things Home always
loads -- the "days in a row" streak and the "is a programme active" check -- were pulling in that entire
dataset anyway, unconditionally, defeating the whole point. Split the streak calculation and the
programme bookkeeping into their own small files that don't need the intervention data, and moved the
two spots that do need it (working out which day of a programme is open, and starting a programme's
exercise) to fetch it only at the moment they're actually used -- the exact same pattern already used
elsewhere in this file (9f4d736). Nothing about what Home shows or does changed. Checked in the browser:
a brand-new Home, and a Home with an active programme showing "Ready for day 1?" and a working "Day 1"
button that correctly opens Box Breathing -- both identical to before. A real production build confirms
the fix: the first download shrank from 726KB to 504KB (from 220KB to 163KB compressed), and the
recommendation engine now shows up as its own separate piece that only loads when it's actually needed,
with no more of Vite's own build warnings about it. Full test/typecheck/lint/build suite passes clean.

## 29 Sep — Two more things loading for everyone that only two practices ever use
Checked docs/BRAND_THREAD.md again: all six phases are still done, with the one open item (Signal Lock's
two different-looking builds) already flagged in SUGGESTIONS.md for the owner. Continued the load-speed
work from the same block. Found two more cases of the same shape of bug as the Box Breathing image
preload and the Home streak/programme fix from earlier runs -- something used by only one or two
practices, loaded for everyone regardless.
First: opening ANY reset at all -- Box Breathing, Progressive Muscle Relaxation, 5-4-3-2-1 Grounding,
Vector Shift, Signal Lock, Change the Scene, Next Easiest Step, Tomorrow Parking Lot, The Happy Bump --
downloaded a 123KB stylesheet meant only for Thought or Fact and Urge Surfing, because the shared reset
screen (`ResetFlow.jsx`) imported both interventions' styling at the top of the file, and loaded Thought
or Fact's own entry screen eagerly instead of on demand like every other intervention's experience
already does. Moved each stylesheet into the component that actually needs it, and made that entry
screen load on demand too (5bbf2d2). The shared reset screen's own stylesheet is now gone entirely --
folded into the two interventions' own on-demand styling instead.
Second: the app's very first download, on every single launch, included a 16KB stylesheet that's only
ever used by The Happy Bump -- the exact same mistake the Box Breathing images made before that was
already fixed. Moved it into the one component that uses it, so it only loads when someone actually opens
The Happy Bump, Vector Shift or Signal Lock's own build (2729419). The app's first download is 16KB
smaller as a result.
Checked both in a real headless-browser run: Thought or Fact, Urge Surfing, Change the Scene (an
unrelated intervention sharing the same shared file) and The Happy Bump all still open fully styled with
no console errors, nothing about how any of them look or play changed.
Also gave The Good Map (added a couple of runs back, never walked end to end since its own narration
pass) a full run through all 16 sort cards and into the rating screen that follows -- sorted correctly,
counted correctly, moved smoothly between cards, no console errors, the rating screen's slider and chips
all worked as expected. Found nothing wrong to fix.
Full test/typecheck/lint/build suite passes clean.

## 29 Sep — Three accessibility fixes for anyone using a screen reader or Reduce motion
Brand thread still fully done and load-speed items already covered, so ran a dedicated accessibility
audit (icon-only buttons, images, custom clickable elements, motion, form labels) across the shared
player and the interventions' own screens. Confirmed most of the app was already in good shape (every
icon-only button already has a label, no missing image alt text, no unlabelled custom clickable divs)
and found three real, narrow gaps.
First: the app's "Reduce motion" setting only ever switched off CSS animations -- it never reached the
spinning rings, pulsing dots and rising particles inside the Box/PMR/Grounding player's own visuals, or
5-4-3-2-1 Grounding's active stage marker, because those are driven by a different animation system
(framer-motion) that setting never touched. Someone who turned Reduce motion on because motion bothers
them was still seeing it, continuously, throughout every one of those three practices. Threaded the
setting all the way down so every one of those animations now holds still instead (e2acff6).
Second: the on/off switches in Settings, the in-session Accessibility panel, and the reset flow's
"Optional preferences" row only ever announced their label to a screen reader, never whether the
setting was on or off -- like being told a light switch's name but not whether the light is on
(a3f7ae2).
Third: six text fields (Thought or Fact's evidence entry, Next Easiest Step's custom task box, Change
the Scene's two custom-activity boxes, and two of Journal's custom-note boxes) only had placeholder
text as their name, which disappears the moment someone starts typing and isn't reliably read by
screen readers at all; four more fields in Journal had a real, visible label sitting right next to
them that was never actually wired up to the field, so a screen reader user focusing the box heard
nothing. Gave all ten a real, connected name (735b2e0).
None of the three changed how anything looks, reads, or behaves for someone not using these settings
-- checked in a real headless-browser run (5-4-3-2-1 Grounding with Reduce motion on and off side by
side, Settings' full toggle list, and the Journal mood-entry screen) and every screen came back
pixel-identical. Full test/typecheck/lint/build suite passes clean, plus three new regression tests
covering each fix.
(Note: the prior run's session also fixed a Thought or Fact Back-button bug, "Fix Thought or Fact:
Back button led to a blank screen" (c6216c6), which reached the branch without a matching log line --
recorded here for the record.)

## 30 Sep -- The single biggest download of any reset, and one more silent Reduce motion gap
Checked docs/BRAND_THREAD.md again: still all six phases done, with the same items already flagged in
SUGGESTIONS.md for the owner (Signal Lock's two builds, Next Easiest Step's Momentum Dashboard colours,
Change the Scene's "Click the play button" line, Vector Shift's "4 STEP" label). Nothing new and safe to
do there this round, so continued the load-speed thread with a fresh look at what each of the biggest
chunks in a real production build actually contains.
First and by far the biggest: the shared reset screen's own bundle was 481KB -- almost as big as the
app's entire first download -- because of one thing inside it: the complete local narration manifest
(every spoken line for every practice that has a voice, with its audio file and word-timing data). It
was only there because the shared reset screen imports Box Breathing's own image/narration warm-up
helper at the top of the file, and that helper needs the manifest. The warm-up itself was already
correctly limited to only run when Box Breathing is the practice someone picked -- but the *import* was
not, so opening Thought or Fact, Next Easiest Step, Tomorrow Parking Lot or any other practice with no
spoken narration at all still downloaded the entire manifest before the screen could even show. Made
that one import happen on demand, inside the same check that already gates the warm-up call (90bb349).
The shared reset screen's own chunk dropped from 481KB to 43KB; the manifest is now its own separate
piece, fetched only the first time a practice that actually speaks (Box Breathing, Progressive Muscle
Relaxation, 5-4-3-2-1 Grounding, Change the Scene, Urge Surfing, The Happy Bump, or the Vector
Shift/Signal Lock/Night Channel step panel) is opened.
Second: while auditing every place in the app with its own continuously-animating visual (the same kind
of check that found the Box/PMR/Grounding player's un-gated animations a couple of runs back), found one
more -- Next Easiest Step's confetti burst when you complete a ladder step draws itself frame by frame
on a canvas from JavaScript, which is the one kind of motion neither the app-wide CSS rule nor the
global framer-motion setting can reach, so it kept playing no matter what Reduce motion was set to.
Gave it the same "do nothing if Reduce motion is on" guard the rest of the app already uses (ad8c121).
Verified both in a real headless-browser run: opening Thought or Fact now loads only the small reset
screen bundle and never the narration manifest; Box Breathing still loads it immediately and starts
exactly as before; Next Easiest Step opens and completes a step cleanly with no console errors with
Reduce motion on or off. Full test/typecheck/lint/build suite passes clean, plus a new regression test
for the confetti fix.

## 30 Sep -- Two crash risks in Next Easiest Step and Change the Scene, plus a visual check
Checked docs/BRAND_THREAD.md again: still all six phases done, same items already flagged in
SUGGESTIONS.md for the owner, nothing new and safe to do there. The launch-time image preload item
and the dead-code items from earlier runs are also both already done, so ran a focused audit of the
12 interventions' own code for real crash risks (corrupted or stale saved state, unguarded storage
writes) rather than style nits, then verified the two real findings in a headless browser before and
after the fix.
First: Next Easiest Step wrote its saved ladder progress to localStorage on every change with no
try/catch -- every other localStorage write in the app already guards against private browsing or a
full storage quota throwing, this was the one unguarded write left, and it would have crashed the whole
practice mid-session for anyone it happened to. It also restored a saved "ladder" straight into state
without checking it was actually a list, so a stale value left over from an older version of the app
could crash the screen the moment it opened. Both now fail safely: the write is wrapped, and a
missing/malformed ladder falls back to empty (d4f16d3).
Second: Change the Scene read its restored step number straight into an array lookup with no bounds
check, so a leftover step number from a previous build could crash the practice on open -- its sibling
component (the shared flagship player) already guards against exactly this with a clamp, Change the
Scene just didn't have it. Added the same clamp (d4f16d3). Added a regression test file for each fix so
neither can silently regress (584dd86).
Also spent time with the headless browser walking Urge Surfing (intensity picker through to the wave
timer screen) and Tomorrow Parking Lot's capture screen (through to typing a note and the suggestion
chips) end to end, looking for anything that looked broken. Found nothing to fix -- both already match
the "one focal thing, full-bleed world" standard the brand doc set, and the different thread colours
(each intervention's own colourway ink, not a mistake) are working as designed.
Full test/typecheck/lint/build suite passes clean.

## 30 Sep -- The Journal's save and delete could crash, plus a wide check that found nothing else
Checked docs/BRAND_THREAD.md again: still all six phases done, same items already flagged in
SUGGESTIONS.md, nothing new and safe to do there. Went looking for the same kind of crash risk the last
two runs found (an unguarded localStorage write, or a restored value trusted without checking) across
every remaining place the app reads or writes on-device storage -- not just the 12 interventions this
time, but Home, Settings, the backup/restore feature, programmes, reminders, and Plus -- plus the
navigator APIs (share, vibrate, microphone) and the speech/narration engine's own error handling.
Found one real gap: the Journal saved and deleted entries by writing the whole diary straight to
localStorage with no try/catch, the one write left in the app without that guard -- private browsing or
a full storage quota would have thrown and broken saving or deleting an entry mid-action. It also
trusted a restored diary to already be a list without checking, so a corrupted or hand-edited entry could
have crashed the Journal the moment it opened. Both now fail safely, with a regression test guarding it
(21376bb).
Everywhere else checked out clean: every other storage write and restore in the app was already wrapped
and validated; the shared session-recording write every reset goes through has no guard of its own but
both places that call it already catch a failure so nothing crashes; every free-text field checked across
Urge Surfing, Tomorrow Parking Lot, The Happy Bump, Settings and the standalone builds already has a real
accessible name; every place with its own continuously-animating visual already stops under Reduce
motion, including one (5-4-3-2-1 Grounding's pearl orb) that turned out to already be covered by the
app-wide CSS rule. Walked Thought or Fact end to end (writing a thought through to editing the exact
claim) and opened 5-4-3-2-1 Grounding, Vector Shift, Night Channel and Signal Lock in a real headless
browser -- all read as intended, nothing broken or out of place.
Full test/typecheck/lint/build suite passes clean.

## 30 Sep -- A visual walkthrough of Box Breathing found one real glass bug
Checked docs/BRAND_THREAD.md: all six phases still done, same owner-decision items in SUGGESTIONS.md,
nothing new and safe to change there. Got a headless browser working (dev server + the pre-installed
Chromium, kept entirely outside the repo) and walked the whole Box Breathing practice end to end --
Library card, the Threshold opening, the breathing player and every one of its dock popups, the
mid-practice check-in, and the closing moment through to "Done" -- screenshotting each step at 375x812
and looking closely at anything that seemed off.
Found one real bug: the "Let's try something else" sheet (opened from "This isn't helping" during Box
Breathing, PMR, Grounding and Vector Shift/Signal Lock/Night Channel) was the one popup built on the
shared glass-surface recipe that never got a blur of its own -- the ambient sound menu, the soundscape
mixer and the sleep timer all pair that translucent background with a backdrop blur so the screen behind
reads as soft glass; this sheet didn't, so the screen's own heading showed through faintly, sharp-edged,
in the gaps between its option rows. Gave it the same blur the other three already use (1f32473).
Verified before and after in the headless browser, in both a dark world (Box Breathing) and the light
5-4-3-2-1 Grounding world -- confirmed the ghosting is gone and nothing else about the sheet's look or
behaviour changed. Added a regression test alongside the existing popup-surface checks, and logged it in
docs/BRAND_THREAD.md as a fourth slice of that same shared-recipe work (bb23620).
Full test/typecheck/lint/build suite passes clean.

## 1 Oct -- Progressive Muscle Relaxation's own dedicated visual-polish pass
With the brand thread phases and every earlier fallback item already done, this run's visual-polish turn
went to Progressive Muscle Relaxation, the one widely-used intervention that had never had a full
dedicated pass of its own (every other shared-player practice, and several standalone ones, already had).
Walked the entire practice end to end in a real headless-browser run at 375x812 (every body-part stage
from hands through to the closing "come back gradually" step, plus every popup in its control dock) and
found two real, verified problems.
First and more serious: below 391px wide -- which covers almost every iPhone in portrait, including the
375px size this whole pass was run at -- a CSS rule built specifically for Progressive Muscle Relaxation
hid its "This isn't helping" button completely and moved the remaining button into a small corner chip.
Box Breathing and 5-4-3-2-1 Grounding, which share the exact same row, kept both buttons at every width.
That left anyone doing Progressive Muscle Relaxation on a real iPhone with no way to say "this isn't
working for me, show me something else" -- only a way to skip to the next thing in their plan. Both
buttons now stay visible and reachable at every width tested (320, 375, 390, 393px), just smaller on the
narrowest phones so they still fit on one line (86d4969).
Second: opening the ambient sound menu during the practice let the "Squeeze both hands"-style headline
text show through behind it, fully readable, not just faintly -- confirmed with a direct check of the
popup's own styling, which already asks for a background blur, but the blur wasn't actually rendering
over this particular screen. Traced it to the player's own glowing body visual, which uses dozens of its
own blur effects elsewhere on the same screen and was confusing the browser's blur sampling for the
popup -- not something safe to unpick without touching the signature glowing-body look used throughout
every practice in this player. Fixed it from the popup's side instead: raised its background from 62% to
94% opaque, so it reads solid no matter whether the blur renders. Still looks like glass, checked side by
side in both a dark world (Progressive Muscle Relaxation) and the light 5-4-3-2-1 Grounding world. This
same popup styling is shared by the ambient sound menu, the sleep soundscape mixer and the sleep timer,
so all three are fixed together (673b75a).
Two new regression tests guard both fixes. Full test/typecheck/lint/build suite passes clean.

## 1 Oct -- A real crossfade bug in the shared Threshold, found via Thought or Fact's own pass
With the brand thread phases and every earlier fallback item already done, this run's visual-polish turn
went to Thought or Fact, the one widely-used shared-player intervention that had never had a full
dedicated pass of its own. Walked the entire practice end to end in a real headless-browser run at 375x812
(writing a thought, confirming the claim, the charge sheet, sorting it, all four evidence lanes, the
ruling screen's "make this mine" editor, and the closing choices) and found two real, verified problems,
plus one thing worth flagging rather than fixing.
First and the more significant one, because it touches every one of the twelve interventions, not just
this one: the shared Threshold that opens every practice fades its whole opaque panel -- logo, wordmark,
name and all -- out over 550ms as it hands off to the practice underneath. The practice itself is already
fully visible by the time that fade starts, so for a real stretch of those 550ms the translucent logo and
intervention name sat directly on top of the practice's own opening buttons -- most visible on Thought or
Fact, where "Mentication" and "Thought or Fact?" crossed right over "Look at a thought" and "Ground
first". Made the mark (logo, name, hairline) fade out together in 250ms, well ahead of the panel's own
550ms dissolve, so it's gone before the panel is translucent enough to show what's behind it (4ede9b6).
Checked before and after across Thought or Fact, 5-4-3-2-1 Grounding, Box Breathing, The Happy Bump,
Change the Scene, Urge Surfing and Vector Shift -- the ghosting is gone everywhere and the rest of the
opening animation is unchanged. Logged in docs/BRAND_THREAD.md (08a391f).
Second, narrower to this one screen: on the "A truer thought" screen, the card's small-caps heading ("A
more balanced thought") and its "Make this mine" button share a row. At phone width both wrapped onto two
lines at once, leaving "A MORE BALANCED / THOUGHT" and "Make this / mine" stacked right on top of each
other with almost no room between them. The button now stays on one line and drops to its own row,
right-aligned, when the heading needs the full width. Checked at 375px before and after, and confirmed the
already-short "Done" state (after tapping in) is unchanged (dba0103).
Also found, while reading the stage logic rather than the screen: Thought or Fact has a complete, tested
"Keep what is useful" ending screen (a private save, a short reminder-phrase box) that nothing in the
current flow ever reaches any more -- every ending choice finishes straight to the shared closing moment
instead. Tried removing it as dead code first, but a "cannot verify, revert" per the run's own rules --
an existing test suite explicitly checks that screen exists, which means this was a deliberate, specified
feature that got disconnected from its trigger rather than an accident. Reverted that change and flagged
it in SUGGESTIONS.md instead, since reconnecting it or deleting it both change how finishing the practice
works, which is the owner's call (d9ddf27).
Full test/typecheck/lint/build suite passes clean on every commit.

## 1 Oct -- A real "Larger text" pass found three genuine overlap bugs
With the brand thread phases and every earlier fallback item done, and every one of the 12 interventions
already having had its own visual-polish pass, this run tried a different angle: a real headless-browser
walkthrough at 375x812 with Settings' "Larger text" turned all the way up, which nothing in the log so far
had checked screen-by-screen. Found and fixed three real, verified overlap bugs, all only visible at the
largest text size -- normal text size is unchanged in every case.
First: Tomorrow Parking Lot's "Tomorrow Parking Lot" title sits inside the page itself, but the Back/Home
buttons float on top of it from a shared component that knows nothing about the title's width. At normal
size there's room; at the largest size the title ran wide enough to hide behind the Home button. Gave the
title enough side clearance to wrap onto two lines instead (33f0a08).
Second: Progressive Muscle Relaxation's opening stage shows a "SETTLE IN" label centred in its own row,
with a "Start with hands" button floating on top from the right edge with no awareness of the label's
width. These are the two longest pieces of text either ever shows, and at the largest size they ran into
each other. Rebuilt the row as three parts -- the button, an invisible mirror of it on the other side, and
the label truly centred between them -- so there's always equal clearance on both sides at any text size,
checked across every stage (e86a8ee).
Third, the most serious: Change the Scene's opening screen has one line of supporting text ("about 4
minutes...") that was the only text on the screen never given a fixed size like everything else already
has. At the largest size it grew and wrapped an extra line, pushing the play button down far enough that
the shared "This isn't helping" dock -- which floats fixed over the whole screen -- rendered its own text
directly on top of the glowing button. Confirmed with real on-screen coordinates before fixing it: gave
that line a fixed size and tightened the spacing around the button, both scoped to the largest text size
only (5981348).
Also walked Box Breathing, 5-4-3-2-1 Grounding, Urge Surfing, The Happy Bump, Next Easiest Step, and
several screens of Thought or Fact at the largest text size and found nothing else broken; the three
standalone builds (Signal Lock, Vector Shift, Night Channel) keep their own chrome clear of overlap, and
their finished inner builds simply don't scale with this setting, which is expected since they're outside
what this app's text-size control reaches. Full test/typecheck/lint/build suite passes clean on every
commit.

## 4 Oct -- The new Home screen redesign hadn't been looked at yet, so this run audited it
This run's merge brought in a substantial Home screen redesign from main (the hero photo, Peace
Palace, ambient music, the "More for you" row) that no earlier run had seen, since it's brand new.
Checked docs/BRAND_THREAD.md first -- all six phases and the remaining owner-decision items are
unchanged -- so spent the block giving this new screen the same kind of real, verified pass every
intervention has already had.
First: `public/home.html` (the built screen users actually get) was stale -- the owner's own source
edits (a smaller "Your week" card, a proper 3-card "More for you" row, routing Home's background
music through the persistent player) were never rebuilt and committed, so the live screen was still
running an older layout and was missing audio behaviour the rest of the app already expected. Rebuilt
it from its own source with the project's existing build script (e9ced6e). Also deleted a second,
unused ambient-music component left over from the same merge that duplicated the one actually in use
and was never wired into anything (e9ced6e).
Second: in a real headless-browser run at 375x812, the mute button -- and, for anyone with a practice
streak, the streak badge too -- floats on top of the hero photo in the exact spot the photo's own
hand-drawn "Mentication" logo sits, hiding it completely once a streak shows. Moved both down and
apart into the clear sky just under the logo, checked with no streak, a one-digit streak, a two-digit
streak, and at a narrower 320px phone width (5469b1f).
Third, the more serious one: the "More for you" row is supposed to show only the cards that earn
their place that day (Journal only when a streak is at risk, Peace Palace only when nothing's been
practiced yet today, Premium only if a launch is genuinely close) -- the code computing that was
already correct, but the card-hiding never actually took effect, because the CSS class every card
uses already sets its own `display:block`, which silently overrides the browser's default rule for
hiding something. Every card kept showing regardless, which is why Premium always appeared to
everyone. Fixed the CSS so hiding actually works, and sized the row so the cards left showing fill
the space properly instead of leaving an empty gap (4196bff). Verified in the browser across a fresh
account (Palace only, full width), an active streak with nothing done yet today (two cards, split
evenly) and having already practiced today (the row disappears cleanly).
Fourth: the home screen's own Reduce motion / Higher contrast / Larger text toggle is cut off from
the rest of the app (it lives in a sandboxed frame that can't read the app's own saved settings), so
turning Reduce motion on in Settings didn't quiet this screen's animations at all even though the
screen's own code already fully supports it. Sent the app's real setting down the same bridge
connection already used for everything else this screen is told, and confirmed it takes effect
immediately (4196bff).
Flagged rather than changed: the Premium card's "Coming soon" wording is baked into its photo rather
than real text, so at the card's actual phone size it's too small to read -- noted in SUGGESTIONS.md
since it's supplied artwork, not something to redraw without asking.
Full test/typecheck/lint/build suite passes clean on every commit.

## 5 Oct -- Night Channel's own dedicated pass found a real session-ending bug
Checked docs/BRAND_THREAD.md: all six phases still done, same owner-decision items already in
SUGGESTIONS.md. Night Channel (one of the three finished standalone builds) had never had its own
full walkthrough the way the other eleven interventions already had, so this run gave it one in a
real headless-browser run at 375x812, walking the opening screen, the channel picker, the Spotify/
Apple Music/Audible connect flows, every duration option, and the volume/texture sliders.
Found one real, serious bug: the screen's own wording promises "tap anywhere to pause," and there's
a dedicated Pause button too, but tapping either one didn't pause anything -- it ended the whole
listening session and dropped straight back to the very first channel-picking screen, losing the
chosen duration, volume and texture along the way. The screen that shows the timer, volume and
texture was wired to disappear the instant audio wasn't playing, instead of just switching its own
label to "Paused" the way the player's own code already clearly intended. Added a proper "session
started" flag kept separate from "is playing right now" so pausing now does exactly what it already
claimed to -- the timer, volume and texture stay on screen and correctly hold still while paused
(d7f5f3e). Checked pausing and resuming from the orb, from the dedicated Pause button, and after
picking a track from Spotify, Apple Music or a channel in the picker while already listening --
every path now pauses in place instead of exiting.
Also found and fixed three icon-only buttons with no name for a screen reader: the channel picker's
close (X), each channel's own play button, and the "attach your own audio" control per channel
(53e5a8c). Checked before and after in the browser -- nothing about how anything looks changed.
Found one gap not fixed this round: Night Channel, Signal Lock and Vector Shift (the three finished
standalone builds) don't receive the app's own Reduce motion setting at all -- there's no connection
between them and it, unlike the rest of the app. Fixing it means wiring a new connection into three
separate finished builds rather than a quick change, so left for a future pass rather than attempted
in the time left this run.
Full test/typecheck/lint/build suite passes clean on every commit.

## 5 Oct -- Reduce motion gaps closed, a real "stuck overlay" bug fixed, dead code cleared
Checked docs/BRAND_THREAD.md: all phases still done, same owner-decision items already in
SUGGESTIONS.md. Ran an accessibility/robustness audit across the nine interventions that aren't the
three finished standalone builds, in a real headless-browser run at 375x812.
Found and fixed: three interventions (Change the Scene, Next Easiest Step, Tomorrow Parking Lot) run
their own looping glow/pulse/drift animations outside the app's shared animation system, so turning on
Mentication's own in-app Reduce motion setting (separate from the phone's own setting) did nothing to
them -- only the phone-level setting was respected. Added the same guard every other intervention's
styling already uses, so the in-app toggle now reaches all three too (4918e5e).
Found and fixed a real bug in Next Easiest Step: when it needs to write AI steps for a task with no
hand-crafted ones and the connection stalls (reachable but never answering), there was no timeout, so
the "Writing your steps..." screen -- which sits on top of the Back and Home buttons -- could stay up
forever with no way out except force-closing the app. Added a 15-second limit so it now always falls
back to the built-in steps instead (4918e5e).
Cleared six pieces of confirmed-unused code the linter had been quietly flagging (an entire unused
visual component, an unused colour table, a few unused variables and one leftover "Saving..." button
state whose setter was never called, so that button could never actually show it) -- checked each one
wasn't read anywhere else first, so nothing about how the app looks or behaves changed (4b8ba36).
Left alone and flagged in SUGGESTIONS.md instead: a reset's "eyes open" answer is collected but never
used anywhere -- deciding whether that should change something about the practice is a product call,
not an agent's to guess at.
Full test/typecheck/lint/build suite passes clean on every commit.

## 5 Oct -- The last known Reduce motion gap closed, two small follow-ups
Checked docs/BRAND_THREAD.md: all six phases still done, same owner-decision items already in
SUGGESTIONS.md. The last run had left one gap on record for a future pass: Night Channel, Signal Lock
and Vector Shift (the three finished standalone builds) never received Mentication's own in-app Reduce
motion setting at all, because each one runs inside its own iframe document, separate from the host
page the setting is actually applied to. Fixed it from the outside, without touching any of the three
builds' own files: their shared wrapper (`StandaloneFrame`) now mirrors the setting into each iframe's
own document at runtime as a small injected style tag, kept in sync on load and whenever the setting
changes (87bf9ae). Verified in a real headless-browser run at 375x812 across all three -- the setting
now reaches every one of them, with nothing visually different when it's off. Added a unit test for the
injection logic itself rather than a source-text check, since this one has real on/off behaviour to get
right.
While following up on Vector Shift, a background audit of every icon-only button across the 12
interventions and the shared chrome came back clean -- one real near-miss found: the native Vector
Shift build's "serpent" stage has four direction buttons that show only an arrow glyph (↑ ← ↓ →) with
nothing else, so a screen reader has nothing reliable to read out. Gave each its own aria-label ("Move
up" etc.) with a regression test (7fec9fa).
Then gave Signal Lock -- one of the three finished standalone builds, and the only one of the twelve
interventions that hadn't had its own dedicated walkthrough yet -- the same full headless-browser pass
Night Channel got last time: signal prompt, the pitch screen, the distraction-lock grid, the
press-and-hold drawer gesture, the reward picker, through to the task picker. The flow itself held up
cleanly, no broken buttons or console errors. One real, new gap found along the way: the pitch screen's
four bullets type themselves out over about 8 seconds no matter what Reduce motion is set to -- the one
place left in the app where that setting makes no difference. Logged in SUGGESTIONS.md rather than
hand-edited, since fixing it means changing behaviour inside that finished, minified build, which needs
the owner's say-so first.
Full test/typecheck/lint/build suite passes clean on every commit.

## 5 Oct -- Vector Shift's own dedicated pass, the last of the three standalone builds
Checked docs/BRAND_THREAD.md: all six phases still done, same owner-decision items already in
SUGGESTIONS.md. Of the twelve interventions, Vector Shift was the one that hadn't had its own full
walkthrough yet (Signal Lock and Night Channel already had theirs). Got a real headless-browser run going
at 375x812 and walked both versions of it end to end: the finished standalone build (`/vector-shift`,
reached from the Library or a direct link) through Align, the Serpent minigame, the word puzzle, Reframe
and the closing "Vector Stabilizing" screen; and the separate, plainer version used when Vector Shift is
one step inside a longer built plan, through the same sequence.
Found and fixed one real accessibility gap in the finished standalone build: the Serpent stage's four
D-pad direction buttons (up/left/down/right) show only an arrow glyph with nothing else, so a screen
reader has nothing to read out for any of them -- the exact same near-miss already fixed in the other
version's own Serpent stage a few runs back, just never carried over to this one. Gave each a real
aria-label (a79d713). Checked before and after in the browser -- nothing about how anything looks changed.
Nothing else broken found in either version -- no console errors, no dead-end screens, no overlap.
Flagged three wording/design gaps in SUGGESTIONS.md rather than guessing at fixes: the plainer version of
Vector Shift repeats the same "4 STEP" vs six-step mismatch already flagged for the finished build, in a
second place; Change the Scene collects a chip choice, a "cozy" toggle and a planned thing that nothing on
screen ever lets anyone actually set; and 5-4-3-2-1 Grounding's player accepts a "discreet" setting it
never reads (4cc7747).
Full test/typecheck/lint/build suite passes clean on every commit.

## 5 Oct -- Home's first download shrank by a quarter, The Happy Bump got its own dedicated pass
Checked docs/BRAND_THREAD.md: all six phases still done, same owner-decision items already in
SUGGESTIONS.md, nothing new and safe to do there. Moved to the load-speed item next in the work order.
A real production build showed the app's first download was still 667KB (202KB compressed) even after
earlier passes trimmed it -- tracing it down, Home.jsx statically imported two functions
(buildRecommendation for "Your reset for today", derivePeacePalace for the Peace Palace level badge) that
both end up pulling in the entire intervention catalog, even though both only ever run inside async
effects, after onboarding and session checks. A static import still bundles that whole catalog into the
one chunk every phone downloads at launch, used or not. Converted both to load on demand at the point
they're actually called, the same pattern already used elsewhere in this same file (f61a0c0). Checked in
a real headless-browser run with a seeded session: Home's Peace Palace badge and "Your reset for today"
card both still appear correctly, nothing about what Home shows or does changed. A real production build
confirms it: the app's first download dropped from 667KB to 449KB (202KB to 147KB compressed) -- the
catalog now loads in its own piece only when a screen that actually needs it opens.
Got a headless-browser run going and gave The Happy Bump -- the one intervention among the twelve that
had never had its own dedicated visual-polish pass -- a full walkthrough at 375x812, start to finish
(energy check-in, hydrate, air and light, the walk, reaching out, one small task, the three reflection
prompts, picking a wellbeing area and a step, planning what's next, re-rating, and the finished-bump
screen). Found one real, verified bug: on the "What are you looking forward to?" reflection step only,
the voice-dictation mic button next to the text field rendered about a third of its circle past the right
edge of a 375px phone -- the same field one step earlier ("What are you grateful for?") and one step
later sized correctly, so this wasn't visible on every screen, only this one. Traced it to the field's
wrapping label having no explicit width, leaving the browser to size it from its suggestion-chip rail's
content instead of stretching it to fit the phone, for that step's particular mix of suggestion text.
Giving the label an explicit full width fixes it for good regardless of what text ends up in it
(02e6d28). Checked every other screen in the flow before and after -- identical, including the two
reflection steps that already looked right.
Full test/typecheck/lint/build suite passes clean on every commit.
- 2026-10-09: No work done — main branch's git history was force-rewritten and is now unrelated to claude/improvement-agent's history, so the automatic merge failed with 'refusing to merge unrelated histories'. Ran git merge --abort equivalent (no merge state was created); branch left untouched at its previous tip. No commit.
- 2026-10-09 (later run): Same main/branch history mismatch as above, still unresolved. As a safety check only, tried a full merge allowing the two unrelated histories to combine, to see whether it could succeed cleanly on its own -- it could not: nearly every file in src/ came back as a conflict with no safe automatic answer, which would mean guessing at code the owner hasn't reviewed. Ran git merge --abort immediately and left the branch exactly as it was. No app code changed; this log line and nothing else was committed and pushed.
- 2026-10-10: Third run in a row blocked by the same main/branch history mismatch -- `git merge origin/main` still fails with "refusing to merge unrelated histories" because main's history was rewritten and shares no common commit with claude/improvement-agent. Did not repeat the unrelated-histories test from the previous run (already shown to conflict on nearly every file in src/). No app code changed; only this log line committed and pushed. This needs the owner to pick a path forward (e.g. re-point claude/improvement-agent at the current main, or restore main's old history) before future runs can merge safely.
