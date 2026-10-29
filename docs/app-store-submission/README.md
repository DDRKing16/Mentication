# App Store preparation — 29 October 2026

Status: **review package prepared; NOT submission-ready**.

Originally prepared in documentation-only PR34 at `5bfcd5e09cd2d1d068c841d5f1db8d80d637df47`, based on main `bf171387009ce955e8fa60427a11a46b36b7fa24`. Reviewed and incorporated into PR35 after the demonstrated backup/privacy/relay source fixes. See [current source findings and tests](../privacy-source-readiness/README.md). No native archive, upload, legal/contact approval, signing change, paid action, provider configuration or public release is established by these drafts.

## Completed in this audit

- Read current root agent instructions, README, existing release checklist, Capacitor config, Xcode project, Info.plist, app privacy manifest, app/scene delegates and generated SPM dependency list.
- Traced the actual privacy page, free-access policy, retained StoreKit status/restore controls, backup/restore implementation and native versus web check-in paths.
- Prepared [metadata and reviewer notes](metadata-draft.md), [privacy/data-flow findings and implemented source fixes](privacy-data-flow.md), and [native/device evidence checklist](device-validation.md).
- Retained Apple primary-guidance references from the original audit; date-sensitive submission requirements must be confirmed for the actual archive/upload.
- Confirmed the tracked tree contains an app-icon catalogue, launch images/storyboards and privacy-manifest Resources membership. Binary assets were NOT decoded or visually validated in this run. No shared Xcode scheme, App Store screenshot package or metadata automation was found in the inspected tracked tree.

## Execution scope

PR34's original executor failed preparation, so that audit was documentation-only. PR35's working executor subsequently implemented and tested backup ownership exclusion, truthful privacy disclosure, and production/native relay gating, and checked installed SDK manifests and native source. These source findings supersede the earlier “source fix pending” items. See [validation](../privacy-source-readiness/README.md) for exact scope.

The user's Mac remains unattached. Xcode/signing, the actual resolved native archive, physical iPhone/iPad behavior, and App Store Connect/legal fields are still unverified. Browser/source tests must not be presented as native delivery, audio, accessibility or archive certification. Rating/audio work has separate owners; rerun candidate checks after integration.

## Concrete release findings

| Finding | Evidence | Next action / owner |
|---|---|---|
| Backup ownership exclusion implemented | `backup.js` now excludes `mentation.web-checkins.v1` on export and restore; tests preserve active/pending destination ownership | Source regression tests pass; verify backup/share/restore on the final native device build. |
| Privacy and Settings disclosure corrected | `src/pages/Privacy.jsx` versus `webCheckIns.js`, `localData.js`, `backup.js` | Authored data, optional web delivery and exported copies are disclosed. Owner-approved public legal policy/contact remains required. |
| Development AI relay gated | `aiSteps.js` now requires browser development mode; production/native requests are blocked by tests; no active callers found | Retest the integrated production/native candidate with network capture. No actual relay endpoint or provider call was inspected. |
| Native Apple entitlement query remains active | `App.jsx` calls `refreshPlus()`; `subscription.js` queries StoreKit; `Plus.jsx` offers restore/manage, while `accessPolicy.js` keeps journeys free | Disclose retained status checks without suggesting a new purchase is required. Do not delete existing subscription management or change billing. |
| Background audio not established | Info.plist has no `UIBackgroundModes`; inspected delegates do not implement an audio session | Audio owner must supply coherent native audio integration before locked-screen playback claims. Declaring a mode alone is insufficient. |
| Installed manifests inspected; archive report unverified | App manifest has false tracking and empty collection/API lists; project includes it in Resources; SPM includes Capacitor plugins and NativePurchases | App, installed Capacitor and Cordova manifests parse; package versions match lockfile. No separate manifests found in six plugins. Inspect resolved archive/privacy report; do not add guessed reasons. |
| Device coverage includes iPad | Xcode `TARGETED_DEVICE_FAMILY = "1,2"`, deployment target 15.0 | Keep audience unchanged; include iPad QA/screenshots unless owner separately authorizes distribution change. |
| Release identity not verified | Bundle ID `com.mentation.app`, version 1.0/build 1, automatic signing without an assigned team in inspected project | Match existing App Store record/team and choose next unused build number on Mac. Do not invent or create identifiers. |
| Public policy/contact and screenshots unresolved | In-app `/privacy` route exists; `/support` is crisis support, not verified developer customer support | Owner supplies approved legal/contact details and public URLs; capture genuine candidate screenshots. Do not use emergency support as developer support. |

## Integration boundaries

Audio/narration, web-push scheduling/server code, and contextual rating wording/construct persistence have separate owners. This combined preparation changes none of those owner files. Re-run the native/privacy checks on their final integrated head, especially outbound requests, optional push consent/deletion, exported data, audio interruptions and saved progress. Do not reuse a result from one commit as evidence for another.

## Smallest remaining access and decisions

1. Review the tested PR35 source fixes and rerun checks on the final integrated release candidate; cloud source execution is no longer blocked.
2. The existing Mac with supported Xcode, existing signing team and a connected iPhone; an iPad or appropriate simulator for current iPad support. Use existing accounts; do not send credentials in chat.
3. Existing App Store Connect access with the appropriate role and approved developer contact/privacy URLs. Confirm the existing audience, age questionnaire, storefronts, privacy answers and intended release version. Do not accept agreements or change availability automatically.
4. Specific approval for any upload/submission/public release once the exact candidate, metadata, privacy answers and test evidence are reviewable. This package is not that approval.

## Apple guidance to confirm for the actual submission

These are review references, not approved metadata or evidence of upload eligibility. Recheck on upload day; do not carry forward an unverified SDK, screenshot-family, age-rating or accessibility claim from a draft.

- [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) and [submission guidance](https://developer.apple.com/app-store/submitting/): confirm required Xcode/SDK versions against the actual archive. The inspected iOS 15 deployment setting alone proves no archive compatibility.
- [App privacy details](https://developer.apple.com/app-store/app-privacy-details/): classify actual candidate data flows and integrated partners.
- [Third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/): inspect the resolved archive and aggregated report, not only source manifests.
- [Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/): capture the required iPhone and supported iPad families at currently accepted sizes. Browser viewport checks are not submission artwork.
- [Accessibility labels](https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels): claim only device-verified support.
- [Review guidelines](https://developer.apple.com/app-store/review/guidelines/): final candidate and metadata require owner review; this package is not an acceptance prediction.
