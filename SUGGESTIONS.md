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

- **Change the Scene's closing screen has three buttons that promise to open
  something else but don't.** On the very last screen ("You changed the
  scene"), three small buttons read "✦ Happy Bump", "✦ What If I Could" and
  "✦ Dear 2100" (`src/components/ChangeSceneExperience.jsx`, around line
  2492). Tapping "Happy Bump" or "Dear 2100" only shows a toast that says
  "Launching..." and then does nothing else — it doesn't actually open either
  one. "What If I Could" is already marked "(Coming Soon!)", so that one may
  be deliberately a placeholder, but the other two look finished and just
  don't work. Left alone rather than guessed at, since wiring them up means
  deciding where they should actually take someone (and whether that's
  wanted at all on this screen), which felt like your call.

- **Two different "make text bigger" controls that don't agree with each
  other.** Settings has a three-step "Text size" (Default / Large / Extra
  large) that scales the whole app's base font size — this one already works
  everywhere. The accessibility panel you can open during a session (the "T"
  button) has its own separate "Larger text" on/off switch, which turns on a
  handful of extra layout tweaks in a few screens (bigger grids in The Happy
  Bump, roomier spacing in Thought or Fact and the player chrome) that the
  Settings control doesn't reach. The two don't show or affect each other —
  picking "Large" in Settings won't flip the in-session switch on, and vice
  versa. Found this while fixing the Reduce motion / High contrast / Captions
  toggles in this same block (2026-09-28), which had the same kind of split
  but were a mechanical fix (all three now read the one store everything else
  already used). This one needs your call on shape first — should the
  in-session switch become a three-step picker to match Settings, should
  Settings drop to a simple on/off, or should both stay but at least agree
  with each other — before it's safe for an agent to touch.

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
