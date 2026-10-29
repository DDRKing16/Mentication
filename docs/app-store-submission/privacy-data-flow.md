# Privacy and data flow — candidate review, not final declaration

Original source audit: PR34; updated with tested PR35 fixes based on `bf171387009ce955e8fa60427a11a46b36b7fa24`. See [source validation](../privacy-source-readiness/README.md). Native device/network capture, archive privacy report and provider-retention verification remain pending.

## Observed flows

| Data / operation | Source behavior | Disclosure / remaining verification |
|---|---|---|
| Sessions and optional ratings | `localData.js` stores up to 500 sessions in localStorage, plus saved takeaways separately | Device-local storage is not an app-server upload. Do not imply all stored content is coarse: authored notes exist. |
| Private drafts, plans and journal | Backup prefixes include authored journey data and `daybook`; exports are JSON | Explain optional authored content, local retention and access by someone with device/file access. No encryption claim. |
| Manual backup | `backup.js` uses a selected share destination or download; restore merges history | Destination may be a cloud provider chosen by the person. In-app deletion does not erase previously exported files. OS backup behavior remains device-test work. |
| Web push opt-in | `webCheckIns.js` sends random plan ID, subscription endpoint/keys, start/end/interval to configured HTTPS API; no plan words in that request | Browser notification provider and app push service receive delivery data. Document separately from native local notifications. Hosted logs/backups/provider retention unverified. |
| Push storage / expiry | `server/web-checkins/store.mjs` stores token hash, plan ID, subscription and schedule; validation bounds schedule to two hours; pruning occurs during API/worker operation | Two-hour schedule bound is not a guarantee that all hosting logs/backups are erased within two hours. Do not promise absolute retention without deployment evidence. |
| Cancellation | Native queues cancel locally. Web cancellation retains opaque local ownership until server deletion succeeds; reconciliation retries | Explain pending cancellation when offline; do not promise instantaneous remote erasure. Keep this ownership out of portable backups. |
| Native reminders | Approved LocalNotifications plugin schedules bounded generic notifications on device after permission | No APNs server is required for this native local-notification path. Verify locked-device delivery, denial, revocation and deletion on hardware. |
| Subscription status | Native startup queries Apple entitlements; restore/manage existing purchases remain reachable; all journeys are free | Apple handles existing subscription status. No new purchase flow needed to use journeys. Do not remove existing management or imply free access cancels an old subscription. |
| Fonts/media/narration | README/config describe bundled resources; audio owner has pending work | Verify final bundle and network trace. Optional external audio/support destinations have their own privacy terms. No claim of runtime voice-provider use without actual evidence. |
| Development task relay | `aiSteps.js` now requires browser development mode and a configured URL; production/native requests are blocked | No active callers found. Mocked tests cover production/native denial. Confirm final candidate network behavior on device. |
| Analytics/tracking | App manifest declares no tracking; no analytics dependency appears in inspected package.json | Provisional source finding only. Inspect whole built app and included SDKs before completing App Store privacy answers. |

## Backup ownership fix implemented in PR35

`src/lib/backup.js` now excludes `mentation.web-checkins.v1` through the shared export/restore filter. It rejects ownership in older or hand-edited backups while preserving the destination's existing cancellation record. No scheduling/server changes were needed.

Passing regression cases: ordinary notes/history export without token; legacy restore into an empty destination; byte-for-byte preservation of active and pending destination ownership; existing merge/malformed-file/write-failure rollback cases. Actual native share-sheet and device restore verification remain pending.

## Privacy disclosure reference (source implemented; legal policy unapproved)

PR35 updates the in-app page and Settings backup summary while preserving Back/route behavior. The following remains reference wording for owner legal-policy review; `src/pages/Privacy.jsx` is the implemented source.

**Your data in Mentication**
Mentication works without an account. Your practice history, optional ratings, preferences, and saved notes and plans are stored on this device. Some journeys keep unfinished drafts so you can return to them. Sensitive free-text is kept separately from recommendation memory.

**Backups you choose**
A backup can contain your personal notes and plans. You choose where to save or share the file. The destination may be a cloud service with its own privacy terms. Deleting data in Mentication does not delete copies you exported.

**Notifications**
In the iPhone app, optional reminders and plan check-ins are scheduled on your device after you allow notifications. On a supported website or Home Screen web app, optional background check-ins use a server and your browser's notification provider. That service receives a random plan ID, timing and push-subscription details, not your situation or plan text. If cancellation cannot reach the server, the app keeps the minimum local information needed to retry.

**Apple and external destinations**
All journeys are free. The iPhone app can check or restore an existing subscription through Apple, and Apple handles subscription management. Opening a support link or optional external source takes you to a service with its own privacy terms.

**Your control**
Use Profile → Delete all my data to remove app data from this device. A pending web-notification cancellation may need a connection to finish. Manage previously exported files separately.

The source now gates the relay and implements the described cancellation behavior; verify the final integrated native release with network/device evidence, including any separately owned audio changes. Add the owner's approved privacy contact and effective date; do not invent a legal entity/contact or publish an incomplete policy.

## App Store privacy answer worksheet

Do not submit “Data Not Collected” solely because the app manifest's arrays are empty. For the native candidate, verify:
- No optional browser-push path runs natively (current host branches on native LocalNotifications support).
- No development AI relay, remote analytics or remote narration endpoint is enabled.
- Included SDK privacy reports match their actual code and any required-reason APIs.
- Apple subscription behavior and user-chosen external destinations are classified using Apple's current guidance.
- Hosting/provider retention is assessed for any web feature included in the actual distribution.

Source: [Apple app privacy details](https://developer.apple.com/app-store/app-privacy-details/). The final answer is an owner-reviewed candidate-specific disclosure, not established by this package.
