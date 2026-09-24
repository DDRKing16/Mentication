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
