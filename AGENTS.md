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
