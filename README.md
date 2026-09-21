# Mentication

Mentication is a standalone, local-first wellbeing application built with
React, Vite and Capacitor. V1 contains 25 interventions and requires no user
account or application backend.

## Architecture

- The web application lives in `src/`.
- Session history and personalisation data stay on the device through
  `src/lib/localData.js`.
- Narration resolves only from the checked-in manifest and bundled audio.
- Fonts, visuals and intervention media are bundled into the application.
- Signal Lock is available from the Intervention Library and runs from its
  supplied offline build at `/signal-lock`; its static HTML and scene assets
  are bundled in `public/signal-lock/` so its focus flow has no network or
  third-party runtime dependency.
- `ios/` is the native Xcode project used for App Store builds.
- No hosted application platform, remote database, analytics SDK or external
  checkout is required at runtime.

## Local development

Requirements: Node.js 22 or later and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.

## Validation

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
node scripts/verify-v3-algorithm.mjs
```

## iOS development

Requirements: macOS, the current supported Xcode release and an Apple
Developer account for device signing and distribution.

```bash
npm run ios:sync
npm run ios:open
```

`ios:sync` builds the web application and copies it into the native project.
In Xcode, select the App target, choose the signing team, confirm the bundle ID
and build on a simulator or device.

The default bundle ID is `com.mentation.app`. Change it in
`capacitor.config.ts` and Xcode before creating the production App Store record
if a different registered identifier is required.

## Release model

V1 is complete and account-free: all 25 interventions and local insights are
available without payment. If subscriptions are introduced later, digital
feature unlocks in the iOS build must use Apple In-App Purchase; do not restore
the retired web checkout inside the native application.

See `docs/app-store-release.md` for the release checklist and
`FINAL_50_LOCK.md` for the locked intervention catalogue.
