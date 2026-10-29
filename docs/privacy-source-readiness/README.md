# Privacy source readiness — 29 October 2026

Based on remote main `bf171387009ce955e8fa60427a11a46b36b7fa24`.
Reviewed the four documentation files in PR34 at
`5bfcd5e09cd2d1d068c841d5f1db8d80d637df47` before implementing these fixes.
PR34 is not merged or copied into this branch: its executor-failure account and
pending-source-fix statements remain historical, while metadata/legal/contact
and real-device assertions still need their owner's review. This document
records this branch's actual source work, not App Store submission readiness.

## Demonstrated fixes

- `backup.js` excludes `mentation.web-checkins.v1` from both create and restore.
  Existing destination ownership is not deleted or overwritten; source ownership
  stays available for cancellation. Tests cover ordinary notes/history export,
  legacy-file restore into an empty destination, and active/pending destination
  tokens. Existing rollback, malformed-file and merge tests remain passing.
- The in-app privacy page now describes authored notes/plans/drafts, potentially
  cloud-hosted backup destinations, optional website check-in server/provider
  metadata, pending cancellation, and retained Apple subscription management.
  It makes no blanket claim that nothing leaves the device or that schedule
  expiry deletes every provider log/backup. It is an in-app explanation, not an
  owner-approved public legal policy with invented entity/contact/effective date.
- `aiSteps.js` explicitly disables the relay in production and native builds,
  even when `VITE_AI_URL` is set. A search for `generateTaskSteps` and
  `aiStepsAvailable` found only their definitions (and now tests), no active
  callers. NextEasiestStep uses bundled/library steps; its files are unchanged.
  Browser development behavior remains available with configured URL and mocked
  tests. No endpoint value, secret, or live provider call was inspected/created.
- Large-text privacy-page wrapping prevents horizontal overflow. Back behavior,
  page route and existing styles are retained.

No rating, intervention wording, audio-owner, native project, privacy manifest,
subscription, server scheduling, dependency or credential files were changed.
No deployment, archive, upload, review approval, agreement or paid action occurred.

## Installed SDK/source inventory

The installed packages used for validation match package-lock versions:

| Package | Version | Separate installed privacy manifest found |
| --- | --- | --- |
| @capacitor/ios | 8.5.0 | Capacitor and CapacitorCordova PrivacyInfo.xcprivacy |
| @capacitor/app | 8.1.1 | No |
| @capacitor/haptics | 8.0.2 | No |
| @capacitor/local-notifications | 8.3.1 | No |
| @capacitor/splash-screen | 8.0.2 | No |
| @capacitor/status-bar | 8.0.3 | No |
| @capgo/native-purchases | 8.8.1 | No |

Parsed the app, Capacitor and Cordova manifests as plist: all declare tracking
false and empty collected-data/accessed-API/tracking-domain arrays. The app
manifest has Xcode Resources membership. These are source observations, not
proof that all actual SDK APIs are covered. Absence of a separate plugin manifest
is not by itself proof of a violation or permission to invent reason codes.
The actual SwiftPM-resolved packages and final .app/archive were not built or
inspected here. Xcode's aggregate privacy report and any required SDK signatures
remain required. Apple lists Capacitor and Cordova in its
[third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/).

Info.plist parses and contains no UIBackgroundModes. App-owned native source has
no AVAudioSession setup. No audio/background entitlement was added: declarations,
session configuration, interruptions and locked playback need a coherent change
from the audio owner and physical-device evidence. Local notifications are a
separate path; browser tests do not prove native presentation.

Current source retains iOS 15 deployment and iPhone+iPad family `1,2`. No signing
team assignment was found in the inspected Xcode project. Do not change audience,
identifiers, version/build or native privacy answers based on this Linux audit.

## Validation

- `npm test -- --run`: 996 tests in 116 files passed.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build`: passed, existing large-chunk warning only.
- Production-preview privacy route: 320px/390px, default/200% text, horizontal
  overflow and Back checks; see final browser result in this directory.
- `git diff --check`: passed.

Repeat the browser check after `npm run build` with `npm run preview -- --host
127.0.0.1 --port 5230`, then `node scripts/privacy-disclosure.browser.mjs` in a
second terminal. It uses the existing Chromium/Playwright tooling; output goes to
`/tmp/mentation-privacy` unless `PRIVACY_EVIDENCE_DIR` is set.

Source tests mock network and native capability. No true notification delivery,
Xcode build, archive privacy report or device accessibility test was performed.
CI results belong to the pushed head and must be checked independently.

## Exact remaining device/account/owner needs

1. Existing Mac with supported Xcode and existing signing team; resolve SwiftPM,
   run `npm run ios:sync` on the final integrated candidate, inspect generated
   diff, build/install, then inspect actual bundle/archive manifests and Xcode
   privacy report. Keep signing credentials in the existing secure tooling.
2. Physical iPhone: network capture of production native build, authored-data
   storage/export/delete/restore, notification lock/cold tap, audio interruptions,
   VoiceOver and larger text. iPad validation remains needed for supported family.
   Record commit/build/device/OS and observed evidence; no simulated pass labels.
3. Audio owner supplies its native background/interruptions integration; rating
   owner supplies its independent source. Rerun privacy/network checks on that
   combined candidate; this branch does not certify those changes.
4. Existing App Store Connect access and approved public privacy/support URLs,
   developer contact/legal details, current metadata/privacy/age/accessibility
   answers and next unused build number. PR34's copy is draft input only.
5. Hosted push remains separately gated on provider/data-flow/dependency and
   persistent-credential approval. Its optional wording does not activate it.
   Final metadata must reflect the actual enabled native/web distribution.

No new account, paid resource, secret generation/configuration, App Store upload
or public release is necessary to review these source fixes.
