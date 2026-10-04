# Suggestions for the owner

Ideas and observations that need your decision rather than an agent just
changing them. Nothing here has been applied.

- **Next Easiest Step's "Momentum Dashboard" screen uses a different colour
  world than the rest of the intervention.** Every other screen (the opener,
  category picker, focus/task screen, pause overlay) uses the burgundy, gold
  and cream palette marked "Official locked color theme tokens" in
  `src/components/NextEasiestStepExperience.jsx`. The screen shown after you
  finish the ladder switches to cyan text on a dark navy background instead.
  If that was a deliberate "reward" moment, no change needed — flagging it in
  case it was left over from an earlier version and should match the rest.

- **Signal Lock still exists as two different-looking builds.** Opening it on
  its own from the Library (`/signal-lock`) shows the finished iframe build in
  cream and lime (`public/signal-lock/index.html`), which the brand doc treats
  as a finished design not to be recoloured without asking. But when Signal
  Lock is reached as one step inside a longer, multi-intervention plan, a
  second, separate implementation renders instead (`SignalLockExperience` in
  `src/components/NewFlagshipExperiences.jsx`) — a dark-navy screen already
  wired into the shared chrome. The two can look like different apps
  depending on how someone arrives. Bringing them to one look means either
  asking you which one should be the "real" Signal Lock everyone sees, or
  recolouring the iframe build, which is outside what an agent should decide
  alone.

- **Change the Scene's opening line reads like web-app instructions, not
  calm guidance.** It says "Click the play button below to shift the moment
  with a small step." (`src/lib/changeSceneNarration.js` and
  `src/components/ChangeSceneExperience.jsx`) — the exact pattern the brand
  doc's Mentication Standard asks every intervention to move away from
  ("Click the play button…"). It's the only line left in the app that still
  does this. Wording is yours to change, not an agent's, so flagging it
  rather than editing it — something like "A small step, whenever you're
  ready." would keep the meaning and drop the instruction-manual tone.

- ~~Change the Scene's closing screen has three buttons that don't work~~
  **Checked 28 Sep: not visible to anyone.** The screen's own styling hides
  that whole button row (`.pathway-actions { display: none }`), so nobody can
  see or tap them. Nothing to fix unless you want the row back.

- ~~Two different "make text bigger" controls that don't agree~~ **Done
  (28 Sep):** kept both, now linked. Settings "Large"/"Extra large" also turns
  on the in-session "Larger text" switch (and its layout tweaks); flipping that
  switch sets Settings to "Large"; "Default"/off/Reset turn both off.

## Programmes wording (added 28 Sep) — please review
New multi-day programmes use existing exercises unchanged; only this framing
copy is new. Edit freely in `src/lib/programmes.js`.
- **Seven calmer days** (free): "A week of short practices that settle your
  system, one a day." Days: Find a steady breath · Come back to the room · Let
  the body let go · Loosen a sticky thought · Return to your breath · Ride out
  a strong feeling · Close the week softly.
- **Five days of small lifts** (Plus): "When things feel flat: five small,
  doable lifts, one a day." Days: Build a little momentum · Shift the scene ·
  Notice what's around you · Stack another small win · Take the lift with you.
- **Five better nights** (Plus): "An evening practice each night to help your
  mind wind down." Days: Park tomorrow's thoughts · Release the day from your
  body · Set down what's left · Slow the breath before bed · End the week rested.
- Daily reminder messages (one per weekday) are in `src/lib/reminders.js`.

## New wording for review: "first reset" card on Home (2026-09-28)
Shown once, after someone's first finished reset:
- "Your first reset" / "You did it."
- "That's how Mentication works: a few minutes, whenever you need it. A little each day is what makes it stick."
- Buttons: "Remind me each evening", "Try seven calmer days (Free)", "Want to go deeper? Try Plus free for 7 days."

- **The Happy Bump's own time estimate doesn't match what the Library
  promises.** Picking it from the Library (search, or the Lift category)
  shows "5 min" -- that's `durationMin: 5` in
  `src/lib/final50Catalog.js`. But the very first screen of the practice
  itself says "Eleven short steps, about 10–15 minutes." (the opening line
  in `src/components/HappyBumpExperience.jsx`), and walking the whole thing
  end to end (a full walkthrough was done this run: baseline check-in,
  hydrate, step outside, a five-minute walk timer, reaching out to someone,
  one small task, three reflection prompts, picking a wellbeing area and a
  step, planning what's next, then a re-rate and reveal) really does take
  closer to 10-15 minutes than 5, especially with the walk. Someone picking
  it because the Library said "5 min" may feel misled once they're a couple
  of steps in. This is a timing question, so it's for you to decide rather
  than an agent changing either number: either the Library's "5 min" should
  read closer to what the practice actually takes, or the opening line
  should describe the quick path (skip the walk, skip reaching out) if
  that's the more typical 5-minute experience.

- **Vector Shift's opening screen says "4 STEP" but the practice actually has
  six.** The intro card (`public/vector-shift/index.html`, the finished build)
  reads "VECTOR • 4 STEP • FELT SAFE", but the step tabs shown once it starts
  are Terminal, Align, Serpent, Code, Reframe, Lock — six, not four. It's a
  hardcoded label inside a minified, single-file build the brand doc marks as
  your finished design (not to be hand-edited without asking), so flagging
  the mismatch rather than guessing at fixing text inside that file myself.

- **The new Home screen's Premium card carries its "PREMIUM CONTENT / Coming
  soon" wording baked into the photo itself**
  (`design/home-source/assets/preview/premium-felt.jpg`), rather than as
  real on-screen text like the Journal and Peace Palace cards next to it, so
  at the card's actual phone size (about 120×120px) it reads as little gold
  flecks rather than words. Left as supplied since it's provided artwork,
  not something to redraw without asking — but worth knowing the wording on
  that card is close to unreadable in practice. (Fixed a real bug that was
  sitting right next to this: the card's own culling logic, which should
  hide it unless a launch is genuinely imminent, wasn't actually working —
  see AGENT_LOG.md.)

