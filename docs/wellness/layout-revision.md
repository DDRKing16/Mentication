# Compact stacked Home card

Based on main `1795205eff40b1123890bb72d2358cf56eba0cbc`. This layout supersedes the original weekly-versus-Oura source selector.

- Removed the top Your week selector and its duplicate wording. The existing Your week heading remains once.
- Oura's region sits above the Monday–Sunday progress row in the same card. Connected metrics take the full card width; the weekday row, actual programme progress and weekly actions remain visible through all wellness states.
- The connection dialog remains available through a secondary, keyboard-labelled settings icon. Consent and disconnect controls retain their existing host actions and privacy gates. No bridge, backend, recommendation or Restore source changed.
- The real setup state still says Setup required and renders no sample scores or live Connect button. Connected/loading/stale/empty/error/disconnected fixtures are render-only tests, not an enabled grant. Zero provider network requests were observed.
- Default setup height at 320 and 390 px is 130 px versus 153 px before (23 px / 15% smaller). At 1280 px it is approximately 119 px versus 135 px. The card can grow for real scores, errors and larger text rather than clipping content.
- Settings, Begin, Palace and seven-day actions have at least 44 px rendered hit areas without overlap. Desktop controls compensate for the existing 0.78 shell zoom. Keyboard Enter/Escape/focus return, large text/high contrast and zero horizontal overflow were checked at 320/390/768/1280 px.

Canonical edits: `design/home-source/index.html`, `app.js`, `styles.css`; `public/home.html` regenerated using `scripts/build-home-document.mjs`. Updated `qa/home-wellness-browser.py` verifies stacked ordering, preserved current/completed days, connection states, controls and the smaller setup card. Browser evidence and screenshots: `/tmp/stacked-oura-evidence/`; before screenshots: `/tmp/stacked-oura-before/`.

This is a layout change only. Live Oura activation and infrastructure cost approval remain pending separately; the user's layout correction did not authorize a backend purchase. Publication is left to the parent after review.
