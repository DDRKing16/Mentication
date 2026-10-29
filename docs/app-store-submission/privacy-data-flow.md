# Privacy and data flow — candidate review, not final declaration

Inspected baseline: `f6cbdaa71535a4c99f42e0ec54e05e99b260040f`. Source-only review, 29 October 2026. No device/network capture, archive privacy report or provider-retention verification was possible.

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
| Development task relay | `aiSteps.js` posts task text when `VITE_AI_URL` is nonempty | Candidate must keep this disabled unless specifically reviewed/disclosed. Trace callers and built artifact in working executor. |
| Analytics/tracking | App manifest declares no tracking; no analytics dependency appears in inspected package.json | Provisional source finding only. Inspect whole built app and included SDKs before completing App Store privacy answers. |

## Demonstrated backup issue and minimal source fix to implement

Current `includeKey` accepts `mentation.web-checkins.v1`; that record contains a cancellation bearer token. Add this exact key to the existing `EXCLUDED` set in `src/lib/backup.js`. Because both create and restore use `includeKey`, this excludes new exports and rejects ownership imported from older/hand-edited backup files.

Do NOT remove the active local record: it is needed to cancel an existing schedule. Do NOT change scheduling/server files owned by the web-push owner.

Required tests in `src/lib/backup.test.js`, using synthetic tokens only:
1. Create a backup containing ordinary session/journal data plus web ownership. Ordinary data survives; ownership/token is absent.
2. Restore a legacy backup containing the excluded key into an empty destination: key remains absent.
3. Restore it into a destination with its own active/pending-cancel ownership: destination key remains byte-for-byte unchanged.
4. Existing merge, malformed-file and write-failure rollback tests still pass.

This proposed fix is NOT applied by this documentation PR. Runtime verification is blocked by executor startup failure.

## Privacy-page replacement draft (needs implementation and review)

Preserve existing page design, Back behavior and route. Suggested content:

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

Before using this draft, verify the final integrated release has the task relay disabled, contains no undisclosed remote media requests and implements the described cancellation behavior. Add the owner's approved privacy contact and effective date; do not invent a legal entity/contact or publish an incomplete policy.

## App Store privacy answer worksheet

Do not submit “Data Not Collected” solely because the app manifest's arrays are empty. For the native candidate, verify:
- No optional browser-push path runs natively (current host branches on native LocalNotifications support).
- No development AI relay, remote analytics or remote narration endpoint is enabled.
- Included SDK privacy reports match their actual code and any required-reason APIs.
- Apple subscription behavior and user-chosen external destinations are classified using Apple's current guidance.
- Hosting/provider retention is assessed for any web feature included in the actual distribution.

Source: [Apple app privacy details](https://developer.apple.com/app-store/app-privacy-details/). The final answer is an owner-reviewed candidate-specific disclosure, not established by this package.
