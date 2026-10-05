# Vector Shift refinements

The supplied self-contained build remains `public/vector-shift/index.html`.
Its React/vendor runtime and CSS are retained. `app.js` is the readable extracted
application (including the original drawn artwork), with the approved refinements.
`support.js` owns tab-local progress and the pausable activity clock. `styles.css`
adds readable instructions, controls and responsive refinements around that art.

Regenerate the shipped document after editing these sources:

```sh
node scripts/build-vector-shift.mjs
```

The build validates JavaScript before changing the HTML. It uses only Node built-ins.
Do not edit the generated application section directly. The original vendor prefix
remains in the generated HTML rather than duplicating a second copy in source.

The app route enters the shared explicitly answered goal baseline. `ResetFlow`
mounts `VectorShiftFrame` instead of redirecting out of its session. The iframe's
completion message is checked for exact origin, source window, session ID and a
single completion. It emits `requireGoalReassessment`, optional `helpfulness` and
coarse gameplay outcome; it does not manufacture a mood/distress change from a
score, skip, or game completion. Shared assessment/session persistence owns the
matching end question and measured response.

Progress is scoped to the reset session in `sessionStorage`; returning to the same
session resumes paused. It stores only game state and optional helpfulness, no
thought text, credentials or external data. Pausing freezes activity timers and CSS
motion, not the React runtime. Leaving a step cancels pending game callbacks.

Browser regression (installed Playwright and Chrome, no dependency additions):

```sh
npm run dev -- --host 127.0.0.1 --port 5178
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node scripts/vector-shift.browser.mjs
```

Chrome uses a fresh isolated temporary profile with `--mute-audio`. All host-entry
ratings/checkpoints in that script are synthetic. `VECTOR_TEST_URL` and
`CHROME_PATH` can override local defaults. Tests use real DOM interactions, with
saved-game checkpoints for original completion boundaries; this is not a physical
iPhone, native Capacitor or assistive-technology certification.

`node scripts/vector-shift.navigation.mjs` checks real baseline entry, browser Back,
explicit resume and refresh. Its report names the known shared Forward restoration
issue separately; the parent/shared owner owns that handler and the final-assessment
resume patch. These files intentionally do not change those handlers.
