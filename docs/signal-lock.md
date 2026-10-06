# Signal Lock integration

Signal Lock is the protected `/signal-lock` route. `src/pages/SignalLock.jsx`
embeds `public/signal-lock/index.html` through the existing `StandaloneFrame`.
The library now describes it under **Ground**, as a gentle external visual
attention game. Vector Shift remains a different intervention and is unchanged.

## Approved change

The previous supplied build was a productivity task scaffold and timed sprint,
not the owner's intended external-focus grounding activity. The owner explicitly
authorized replacing that Signal Lock flow after the initial completion-honesty
investigation. The separate `SignalLockExperience` in
`src/components/NewFlagshipExperiences.jsx` is an old stand-in; the actual route
and single-intervention ResetFlow use the standalone document instead.

The replacement retains the supplied room artwork, Signal Lock identity,
cream/green palette, rounded presentation, and local offline delivery. It starts
with one button and asks for one signal at a time. Every two distinct, ordered
signal taps illuminate a connection and reveal more of the room. There are no
penalties, visible countdowns, mandatory check-ins, audio, reward dismissals,
or external requests. Six connections reveal a complete scene. Users can keep
playing immediately or explicitly finish that scene; they can pause or stop at
any point. Elapsed time is hidden until requested.

The catalogue description/mechanism/directions now match this experience. The
obsolete timed-task handoffs to/from Signal Lock are removed. Existing intensity
bounds and immediate rescue selection are unchanged. The old task-scaffolding
`B+` evidence label is not carried over to this newly designed game (`Unrated`).
This implementation does not establish clinical efficacy or claim to end panic.

## Progress and honesty

`session.js` is a pure state model, shared by the browser and Vitest tests.
`app.js` owns rendering and browser lifecycle events; `styles.css` supplies the
responsive scene. Vite copies all three alongside the HTML into `dist`.

- Only two valid signal taps produce a connection. Repeating the first signal,
  pressing the disabled second signal early, or pausing earns nothing.
- States distinguish ready, active, paused, skipped, ended, and completed.
  `completed` requires six (or a multiple of six) recorded connections plus an
  explicit **Finish this scene** action. Timer passage never completes a scene.
- Time means active foreground **session time**, not proof of attention or calm.
  It uses monotonic time. Pause, window blur, hidden document, page exit, and
  refresh exclude time away. Gaps over 2.5 seconds pause conservatively instead
  of crediting suspended time. Abrupt process loss can undercount up to the last
  500 ms checkpoint; it cannot credit the time the app was closed.
- An unfinished first tap is preserved on interruption and reported on exit.
  Feelings are optional, explicit self-reports, never defaulted to a success.
- The versioned local key `mentation.signal-lock.grounding.v1` stores the current
  session plus up to 50 ended/skipped/completed records, updated by session ID.
  Other application storage, history, points, and rewards are untouched. No
  global completion events or payout requests are emitted. Existing records
  are not reinterpreted as grounding outcomes. The old standalone build did not
  persist its task list.
- Refresh resumes in a paused state; **Begin another scene** retains prior
  records and starts fresh counters. Storage denial falls back to an explicitly
  unsaved in-memory session. This is local state, not cross-device sync.

OS reduced motion and the saved `haven.a11y.v2` preferences are respected. The
**Still scene** control also persists locally. Both motion modes show the same
recorded reveals. Native buttons, visible focus, automatic focus handoff between
signals, live announcements, and at least 44 px targets support keyboard and
touch operation. The scene has no rapid flashes or time pressure.

## Verification

- Historical repro: `python tests/signal-lock/reproduce-baseline.py` while
  serving `public/` on port 4174. It injects only synthetic initial task state
  into the original committed artifact and activates Skip by keyboard. The old
  mobile overlay blocks pointer access. Result: no timer start or task checks,
  yet “Lock complete”, all planned steps complete, and “8 min locked”.
- Unit/contract checks: `npm test -- --run` (includes `tests/signal-lock/`).
- Browser: serve `public/`, then
  `python tests/signal-lock/browser.py http://localhost:4175`. Uses an existing
  Python Playwright installation and system Chromium; no package added.
- Built-route check: `python tests/signal-lock/host-browser.py` with the Vite
  preview on port 4176 verifies the real iframe, Home exit saving, route return,
  and Library description.
- Standard checks: `npm run lint`, `npm run typecheck`, `npm run build`,
  `node scripts/verify-v3-algorithm.mjs`.

Final automated run: 55 test files / 417 tests pass; lint, typecheck, build,
and V3 algorithm verification pass. The build retains the existing large-chunk
warning. The standalone JavaScript also passes ESLint recommended rules with
browser globals (the repository lint config otherwise targets `src/`).

Browser coverage includes 320×568 through desktop, landscape, full and partial
scenes, repeated sessions, exact tap gating, optional time/check-in, keyboard,
reduced motion, saved accessibility preferences, refresh, interruption, history,
and denied storage. Captures are written to `/tmp/signal-lock-evidence/`.

Remaining validation: physical iOS/WebKit, native suspend/terminate behavior,
screen-reader testing on a device, and user assessment of whether the reveal is
absorbing enough during distress. `ios:sync`, publication, and app-wide reward or
shared return-flow integration are outside this branch. The parent owns those
integration decisions.
