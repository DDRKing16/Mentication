# Mentication iOS and App Store release

## What is already in the repository

- A native Capacitor iOS project in `ios/`.
- Bundle ID configuration, version/build-number settings and iOS 15 minimum.
- App lifecycle, status bar and splash-screen integration.
- A privacy manifest declaring no tracking or collected data.
- Non-exempt encryption declared false.
- An in-app privacy summary and direct device-data deletion.
- Account-free access, so account deletion and third-party-login requirements
  do not apply to V1.
- All digital features included in V1, with no external checkout in the app.
- Bundled fonts and local-only narration playback. Missing narration clips fall
  back to on-screen text; the app never calls a runtime voice service.

## Before the first archive

1. Install the current supported Xcode release.
2. Run `npm run ios:sync`, then `npm run ios:open`.
3. In the App target, select the Apple Developer signing team.
4. Confirm or replace `com.mentation.app` with the registered bundle ID.
5. Review the included branded app icon and launch artwork at device size;
   replace them only if a newer approved brand master is selected.
6. Set the marketing version and increment the build number.
7. Test on small and large iPhones and at least one supported iPad if iPad
   distribution remains enabled.
8. Archive using a generic iOS device destination and run Xcode validation.

## App Store Connect material still supplied outside code

- App name availability, subtitle, description, keywords and categories.
- Support URL and public privacy-policy URL.
- Screenshots for each required device class.
- Age-rating and health/wellbeing declarations.
- Review notes explaining that the app is a wellbeing aid, not emergency or
  medical care, and that no login is required.
- Pricing, countries and release timing.

## Monetisation boundary

V1 is configured as a complete free application. If premium digital features
are introduced, the iOS application must use Apple In-App Purchase and provide
restore-purchases behaviour. A web card checkout must not be inserted into the
native build for feature unlocking.

## Repeatable release commands

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
npm run ios:sync
```

Xcode signing and archive validation cannot be completed until Xcode and an
Apple Developer signing team are available on the machine.
