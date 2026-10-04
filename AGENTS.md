# AGENTS.md

## Project context

Mentication is a standalone React, Vite and Capacitor application. It is
local-first and has no hosted application backend, remote account system or
runtime dependency on a website builder platform.

Start with `README.md` for setup, validation and iOS workflow.

## Key files

- `src/`: application source.
- `src/lib/localData.js`: device-local session persistence.
- `src/lib/interventions.js`: intervention and recommendation runtime.
- `capacitor.config.ts`: native application configuration.
- `ios/`: generated and maintained Xcode project.
- `.env.local`: local-only build values; never commit secrets.

## Working notes

- Use `npm run dev` for local development.
- Use `npm run ios:sync` after web changes before native testing.
- Never add a hosted backend or analytics service without an explicit product
  and privacy decision.
- Never place speech, payment or other private API keys in frontend or native
  application bundles.
- Run the package validation commands before finishing code changes.
- Native plugins approved by the owner: `@capacitor/haptics`,
  `@capacitor/local-notifications` (on-device reminders) and
  `@capgo/native-purchases` (subscriptions; talks only to Apple's StoreKit, no
  third-party server). Ask before adding anything else.

## Home screen

- Home (`src/pages/Home.jsx`) renders the home screen through the isolated
  adapter `src/components/home/HomeFrame.jsx` pointing at the generated
  static asset `public/home.html`. Edit the design in the vanilla source at
  `design/home-source/` (index.html + styles.css + app.js) and regenerate
  with `node scripts/build-home-document.mjs` — never hand-edit the generated
  asset. Route IDs map to app destinations in Home.jsx; the weekly pathway
  shows real `calmer-seven` programme progress (read-only; goal-card clicks
  play a ~460ms lava-lamp pulse before navigating). For returning users
  (onboarding complete + session history), Home.jsx feeds the document's
  "Your reset for today" card via the bridge; it launches /reset with the
  prebuilt recommendation pathway, mirroring My Plan.
- The Peace Palace drawing (`src/lib/palaceArt.js`, a plain SVG-string
  function) is shared: the Palace page renders it, and the home build script
  inlines it into home.html. Home.jsx sends the live level over the bridge
  (`palace` message) for the "More for you" card and the Your week badge.
  Rebuild home.html after editing palaceArt.js.
- Because the document carries its own bottom navigation, AppShell hides the
  host `TabBar` on `/`.
- Pending from the owner (do not invent values): they will upload real palace
  artwork images and the full progression points (stage names/thresholds —
  they mentioned "Four Foundations" and "get to 100 in the Good Map") to
  replace the current SVG placeholder crops and PALACE_STAGES. The home badge
  intentionally shows only "Level N of 7" + "N stones to <next stage>" — no
  stage name; swap artwork in `setPalace` (design/home-source/app.js).

## Base44 dev environment

- `docker-compose.base44.yml` runs the Vite dev server (`web`) plus `ai-relay`
  (`server/ai-proxy.mjs`) — a tiny HTTP relay so AI-written steps for
  custom/unlibrary tasks never need a provider key inside the app bundle.
  The relay reads `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` from the platform
  env file; with none it answers 503 and the app falls back to the built-in
  generic ladder. The browser reaches it via `VITE_AI_URL`.
- Verify after changes: `npm run lint` (must pass) and `npm run typecheck`
  (one pre-existing ResetFlow error at src/pages/ResetFlow.jsx:515 is known
  and not from new work).

## Rules for every AI agent (Copilot, Codex, Claude, others)

See `.github/copilot-instructions.md`. In short: never change `main` directly (work on
a branch and let the owner merge); never run `git pull`, `rebase`, `reset`, `stash` or
switch branches inside the owner's working folder; never replace the finished
Signal Lock, Vector Shift and Night Channel builds with simplified versions; and never
claim anything is live or in `main` unless it has been merged.
