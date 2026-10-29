# App Store preparation — 29 October 2026

Status: **review package prepared; NOT submission-ready**.

Source inspected through the connected GitHub repository at main `f6cbdaa71535a4c99f42e0ec54e05e99b260040f` (accepted PR32). PR32 outcome fixes are historical baseline, not reopened. Before publication, main advanced to `bf171387009ce955e8fa60427a11a46b36b7fa24` (notification PR33). Its changed-file comparison was checked: the privacy, backup, AI and native files inspected here are unchanged. This documentation branch is based on that newer main. See [the notification owner's evidence](../checkin-release-readiness/README.md) separately; its tests were not rerun by this audit. This change adds documentation only. No application/native files, hosting, audience, pricing, credentials or legal agreements changed; no archive, upload, approval review or public release performed.

## Completed in this audit

- Read current root agent instructions, README, existing release checklist, Capacitor config, Xcode project, Info.plist, app privacy manifest, app/scene delegates and generated SPM dependency list.
- Traced the actual privacy page, free-access policy, retained StoreKit status/restore controls, backup/restore implementation and native versus web check-in paths.
- Prepared [metadata and reviewer notes](metadata-draft.md), [privacy/data-flow findings and proposed fixes](privacy-data-flow.md), and [native/device evidence checklist](device-validation.md).
- Checked current Apple primary guidance; references and date-sensitive requirements are below.
- Confirmed the tracked tree contains an app-icon catalogue, launch images/storyboards and privacy-manifest Resources membership. Binary assets were NOT decoded or visually validated in this run. No shared Xcode scheme, App Store screenshot package or metadata automation was found in the inspected tracked tree.

## Why source fixes and execution are blocked

The selected cloud environment failed startup: “failed to query executor configuration capabilities”; the waiter subsequently reported an executor preparation/connection failure. A shell probe returned “No usable execution environment is available.” No checkout, local agent-skill directories, installed SDK manifests, builds, tests, native sync or browser checks could be executed. Repository reads and this documentation-only draft use the connected GitHub application.

The user's Mac is not attached. No Xcode, signing identity, physical iPhone or App Store Connect session is available here. Prior PR32 tests are historical evidence only; they are not new verification of this submission package or parallel audio/push/rating changes.

## Concrete release findings

| Finding | Evidence | Next action / owner |
|---|---|---|
| Backup exports browser notification ownership | `src/lib/backup.js` includes all `mentation.` keys except two; `mentation.web-checkins.v1` contains a bearer cancellation token and identifiers | Exclude this key from export AND restore; preserve destination ownership. Precise regression cases in privacy document. Source change awaits executable environment; coordinate with web-push owner. |
| Privacy summary overstates absence of server and omits authored content | `src/pages/Privacy.jsx` versus `webCheckIns.js`, `localData.js`, `backup.js` | Update disclosure using draft below. No public policy replacement has been made. |
| Development AI relay can be configured in a build | `src/lib/aiSteps.js` reads `VITE_AI_URL` without a development-only gate and posts task text | Trace active callers in checkout; ensure candidate native build has relay disabled, or gate development code and test. Do not claim all authored text remains local if enabled. No endpoint value inspected. |
| Native Apple entitlement query remains active | `App.jsx` calls `refreshPlus()`; `subscription.js` queries StoreKit; `Plus.jsx` offers restore/manage, while `accessPolicy.js` keeps journeys free | Disclose retained status checks without suggesting a new purchase is required. Do not delete existing subscription management or change billing. |
| Background audio not established | Info.plist has no `UIBackgroundModes`; inspected delegates do not implement an audio session | Audio owner must supply coherent native audio integration before locked-screen playback claims. Declaring a mode alone is insufficient. |
| Manifest is present, but aggregated SDK report unverified | App manifest has false tracking and empty collection/API lists; project includes it in Resources; SPM includes Capacitor plugins and NativePurchases | Inspect installed SDK manifests and archive privacy report; determine required-reason coverage from actual code. Do not add guessed API reasons. |
| Device coverage includes iPad | Xcode `TARGETED_DEVICE_FAMILY = "1,2"`, deployment target 15.0 | Keep audience unchanged; include iPad QA/screenshots unless owner separately authorizes distribution change. |
| Release identity not verified | Bundle ID `com.mentation.app`, version 1.0/build 1, automatic signing without an assigned team in inspected project | Match existing App Store record/team and choose next unused build number on Mac. Do not invent or create identifiers. |
| Public policy/contact and screenshots unresolved | In-app `/privacy` route exists; `/support` is crisis support, not verified developer customer support | Owner supplies approved legal/contact details and public URLs; capture genuine candidate screenshots. Do not use emergency support as developer support. |

## Integration boundaries

Audio/narration, web-push scheduling/server code, and contextual rating wording/construct persistence have separate owners. This audit changes none of those files. Re-run the native/privacy checks on their final integrated head, especially outbound requests, optional push consent/deletion, exported data, audio interruptions and saved progress. Do not reuse a result from one commit as evidence for another.

## Smallest remaining access and decisions

1. A working cloud executor with the repository/dependencies, to implement the demonstrated privacy/backup fixes and run full checks plus mobile QA.
2. The existing Mac with supported Xcode, existing signing team and a connected iPhone; an iPad or appropriate simulator for current iPad support. Use existing accounts; do not send credentials in chat.
3. Existing App Store Connect access with the appropriate role and approved developer contact/privacy URLs. Confirm the existing audience, age questionnaire, storefronts, privacy answers and intended release version. Do not accept agreements or change availability automatically.
4. Specific approval for any upload/submission/public release once the exact candidate, metadata, privacy answers and test evidence are reviewable. This package is not that approval.

## Apple guidance checked 29 October 2026

- [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/): currently Xcode 26+ and iOS/iPadOS 26 SDK+ for uploads; iOS 13+ deployment minimum. The inspected iOS 15 deployment setting is a source value, not proof of a compatible archive. [Submission guidance](https://developer.apple.com/app-store/submitting/) lists another minimum-SDK change for April 2027; recheck on upload day.
- [App privacy details](https://developer.apple.com/app-store/app-privacy-details/): inventory the app and integrated partners; a local-only data item and an off-device retained item are different. Final answers depend on the actual candidate and SDKs.
- [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/): inspect the included dependencies and their manifests/signatures, not only the app's empty manifest.
- [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/): current required families include iPhone Dynamic Island medium and iPad 13-inch when iPad is supported. Capture actual app UI at accepted sizes; prior 320/390px browser evidence is not submission artwork.
- [Accessibility labels](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels): only claim support verified against Apple's criteria.
- [Review guidelines](https://developer.apple.com/app-store/review/guidelines/): complete, accurate metadata/privacy information and a working candidate still require review. This source audit is not legal certification or an acceptance prediction.
