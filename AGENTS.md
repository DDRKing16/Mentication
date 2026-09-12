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
