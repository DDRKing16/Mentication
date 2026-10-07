# Hosted web check-ins — isolated source draft

Prepared on 2026-10-07 from verified `origin/main` / remote main
`fe6d76f9925bdacf5e16ae73986b10252d4ebebd`.
Branch: `codex/hosted-web-checkins`.

**Not deployed, not wired into the app, and actual background delivery has not been verified.**
No credentials, provider resources, subscriptions, paid services, or application
external data flows were created. No dependency was added or installed. The
server entry point deliberately requires the not-yet-approved `web-push` library.
The existing source task `01a110b7-26dd-7108-8eae-ed1301e4400f` was not interrupted
or edited. There was no available cross-thread messaging channel; this document
is the explicit integration contract for its owner and the parent.

## Ownership and integration contract

All changes are additive files. No changes to native notification handling,
`taraCheckInNotifications.js`, Tara components, App boot/routing, manifest,
package manifests, or existing Render configuration. Native routing and the Tara
component remain owned by the other task. The parent should integrate these new
exports after reconciling that task's changes:

1. **Browser-only ready screen slot:** render
   `src/components/web-checkins/WebCheckInSetup.jsx`, outside native Capacitor.
   `getPlan()` must synchronously create and locally persist the same active draft
   used by the journey, then return `{ draftId: draft.id, checkIns }`.
   `checkIns` must contain fresh `startedAt`, `endsAt`, and `intervalMinutes`.
   Use existing `startCheckIns` logic; do not pass situation/plan text. Set
   `preference: 'device'`. `onStatus({status})` saves the result to the local draft.
   Do not call a second native permission/schedule action on web, and do not
   await network/practice work before the explicit permission call. The component
   immediately calls `startWebCheckIns` from its click handler.
2. **Provider selection:** native continues with existing exports. Browser uses
   `startWebCheckIns`, `cancelWebCheckIns`, `verifyWebCheckIns` from
   `src/lib/webCheckIns.js`. `scheduled` means server queue acceptance, not a
   delivery receipt. All non-scheduled results preserve foreground support.
   Do not change the native module's capability predicate to return true on web.
3. **Cancellation/completion/replacement/data deletion:** await
   `cancelWebCheckIns()` for stop, completed event, completed plan, new plan, and
   clear-data actions. Cancellation disables local worker delivery first, closes
   delivered tagged notifications, then deletes server data and unsubscribes.
   A network failure keeps the opaque cancellation capability locally. Show
   “Stopping background check-ins is pending. We’ll retry when you’re online.”
   Never show successful remote cancellation on failure. Do not erase
   `mentation.web-checkins.v1` before cancellation succeeds. With offline data
   deletion, retain this small opaque outbox (no text) until retry succeeds.
4. **Reconciliation:** invoke `reconcileWebCheckIns(loadTara().draft)` at web boot,
   return to visible, `online`, storage changes, and existing
   `mentation:tara-plan-changed`, `mentation:tara-cleared`, and
   `mentation:sessions-changed` events. Catch errors and show pending/unverified
   status. Do not resubscribe or request permission from those events. Expired,
   completed, removed, or different local plans cancel; active plans verify the
   browser subscription and server schedule. An expired subscription renews only
   on a new explicit enable action. Permission revocation is reconciled on return.
5. **Web tap routing:** call `consumeWebCheckInTap()` at application boot before
   routing effects. It consumes `/#web-checkin=<opaque UUID>` and returns only a
   locally mapped draft ID. Use the native task's common routing resolver after
   verifying that the saved draft ID matches, event is still in progress,
   completion is false and check-ins remain active. Open that existing plan's
   check-in screen; never construct a new plan from a tap. Missing/stale IDs
   stay on Home. Reuse the common routing function, not its native listener.
   Service worker tap focuses/navigates a same-origin window or opens one.
   Hash handoff avoids sending the ID to frontend access logs; it is cleared
   before the route handoff. It is not an authentication capability.
6. **App transport status wording:** “Background check-ins are not available on
   this website yet” until API and public-key build values are configured.
   After scheduling say “Check-ins are scheduled. Delivery depends on your
   connection and notification settings.” Never promise exact or guaranteed
   delivery. Foreground due-check logic can continue but should not generate
   an extra browser Notification; the worker is the web notification owner.
7. **Home Screen setup:** existing manifest and icon are retained. iPhone/iPad
   requires a Home Screen web app, iOS/iPadOS 16.4+, and permission from a direct
   user action. Setup explains Share → Add to Home Screen → open that app →
   return to allow notifications. The installed app may have separate local
   storage from the Safari tab: do not promise the tab's plan transfers; create
   or reopen the plan inside the installed app. Validate existing icon/manifest
   installation on the real target devices before release.

Do not register another root-scope service worker alongside this one. Currently
there is no existing root worker. Future PWA work must merge these handlers.
No fetch interception, offline content cache, analytics, or page text storage is
introduced by this worker. Browser APIs and generic worker behavior still need
real-device tests; unit stubs are not proof of platform delivery.

## Protocol and retention

`PUT /v1/plan` atomically replaces the caller's one active schedule; `GET` verifies
it; `DELETE` cancels/completes/deletes it idempotently. A runtime-generated
256-bit random device capability goes in the Authorization header, never a URL;
only its SHA-256 hash is stored server-side. Local draft IDs never leave the device.
Rescheduling generates a new random opaque plan ID so old deliveries cannot match.

The server accepts only `planId`, `startedAt`, `endsAt`, `intervalMinutes` and a
standard push subscription (`endpoint`, `keys`, `expirationTime`). It rejects
extra fields. Encrypted push payload contains only `planId` and transport expiry;
the worker supplies fixed generic title/body. No situation, answers, health text,
intervention name, device-local plan, or local draft ID is transmitted. The API,
Render, and the browser's push provider necessarily receive subscription/routing
and timing metadata, and network infrastructure sees IP addresses. This is a new
external data flow requiring explicit privacy approval before enablement.

Schedules are limited to 10/20/30-minute intervals within two hours. Active server
records are removed on cancellation/completion, 404/410 from provider, subscription
expiry, or schedule expiry (next 15-second sweep while healthy). SQLite uses
secure-delete and a persistent disk; WAL pages and provider disk snapshots can
retain deleted metadata beyond logical deletion. Render documents daily snapshots
retained at least seven days; the final retention/privacy statement must account
for that. Never restore old schedules from snapshots; start with an empty schedule
store after disaster recovery to avoid restoring a cancelled notification.

The scheduler advances each occurrence durably before sending (at-most-once
attempt). A crash during send can miss that check-in; no replay burst occurs on
restart. Attempts >90 seconds late are skipped. Provider TTL is at most 60 seconds
and bounded by plan end. Other provider failures skip that occurrence and retry
only at the next interval. Global request limit and 1,000-record cap bound this
small anonymous pilot. Origin validation is not authentication or full abuse
protection; capability possession owns one record. No public cross-user listing.
Allowlisted push hosts cover Apple, Google and Mozilla; additional browser push
hosts must be reviewed before adding. Egress must remain restricted to HTTPS
trusted push providers, with no arbitrary URL relay.

API mutations and scheduler sends are serialized in one process. Once DELETE
returns, no new send for that schedule starts. A provider-accepted push cannot be
recalled; short TTL plus worker active-ID filtering limit stale delivery. Browsers
may display their own generic notification when a push does not visibly notify,
so local filtering is not an absolute recall guarantee. Clearing browser storage
outside the app can lose cancellation ownership; the server's two-hour maximum
still expires the record. OS Focus, connectivity, force-quit behavior and push
provider policy can delay or prevent delivery.

## Minimum deployment proposal — approval required

Keep `https://mentication-preview.onrender.com` as the existing static frontend.
Add **one paid Render Web Service** (smallest $7/month compute tier) with
**one 1-GB persistent disk** ($0.25/GB/month). Incremental base estimate:
**$7.25/month**, plus applicable taxes and workspace bandwidth/build overages.
No Postgres, Redis, cron job, background-worker service, custom domain, Firebase
project, or Apple developer/APNs certificate is required. Web Push uses browser
provider endpoints and VAPID. The static frontend alone cannot run a scheduler.
Free Render web instances sleep and cannot attach persistent disks, so they are
not suitable for closed-app scheduling. This design is single-instance and has
brief deployment downtime; it is a modest pilot, not a delivery SLA.

Pricing checked 2026-10-07 using Render's public pricing listing. Confirm exact
instance naming/current price and billable workspace limits in the existing
workspace before approving purchase:
- [Render pricing](https://render.com/pricing)
- [Render billing / overages](https://render.com/docs/faq)
- [Persistent disk limits and snapshots](https://render.com/docs/disks)
- [Free service limitations](https://render.com/docs/free)
- [Apple Web Push requirements and no Developer Program requirement](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)

Proposed service configuration (not created):

| Setting | Value |
| --- | --- |
| Source | Owner-reviewed integrated commit, manual deploys only |
| Runtime | Node 24 (tested locally on 24.19.0); native `node:sqlite` |
| Instances | Exactly 1 |
| Root directory | `server/web-checkins` |
| Build | `npm ci` after approved service-only package/lockfile exists |
| Start | `node start.mjs` |
| Port | Render `PORT`, binds `0.0.0.0` |
| Health | `/healthz` |
| Disk mount | `/var/data`, 1 GB |
| `CHECKIN_DATA_DIR` | `/var/data` |
| `CHECKIN_ORIGIN` | `https://mentication-preview.onrender.com` (exact origin) |
| `VAPID_SUBJECT` | Owner-approved `mailto:` contact address |
| `VAPID_PUBLIC_KEY` | Approved generated public key |
| `VAPID_PRIVATE_KEY` | Same keypair's secret; Render secret environment value |
| Frontend build `VITE_WEB_CHECKIN_API` | Actual newly assigned HTTPS service origin |
| Frontend build `VITE_WEB_CHECKIN_PUBLIC_KEY` | Public key only; no secret |

Persistent actions requiring approval, in order:

1. Approve the metadata flow, retention including snapshots, generic lock-screen
   copy, and new server-only `web-push` dependency. Then select/pin a supported
   version, add a separate package and lockfile, audit it, and test real encryption.
   No dependency install was done for this draft because repository rules require
   approval before adding libraries. Existing app dependencies remain unchanged.
2. Approve the $7.25/month base resource purchase, region and operational owner.
   Create the Web Service/disk only after approval; no provider API credential
   creation is needed if using an existing authorized Dashboard session.
3. Approve generating one persistent VAPID keypair and the public contact subject.
   Store the private key solely as a Render service secret with an owner-controlled
   secure recovery copy. Do not put it in chat, repo, frontend `VITE_*`, native
   bundle, or logs. Key rotation requires renewed client subscriptions; cancel
   old schedules and guide users through re-enabling before retiring old keys.
4. Approve setting frontend public configuration and deploying the integrated
   source. These build values enable actual registration and metadata transfer
   only after the user chooses the explicit setup button.
5. Approve a device delivery test using a consenting tester's push subscription.
   Record pass/fail and timestamps without endpoints, capability tokens or text.

No automatic resource-creating Blueprint is supplied. Source remains disabled
until integration, dependency approval, credentials, service creation, and
frontend configuration are deliberately completed.

## Release acceptance evidence still required

- iPhone/iPad Home Screen app: enable using explicit gesture; app closed; phone
  locked; receive generic alert; tap with app killed opens matching existing plan.
- Open-window tap uses the same plan without duplicates; wrong/expired/deleted
  draft stays on Home. Verify this against the other task's routing changes.
- Permission denied/revoked; unsupported browser; Safari tab install guidance;
  Chrome/Firefox desktop and Android where supported.
- Cancel, completion, reschedule, offline stop/reconnect, storage clear, expired
  subscription and provider 410. Verify no future server sends after confirmed stop.
- Restart/redeploy retains pending schedules, skips stale reminders and never
  replays already attempted occurrences. Confirm short TTL on actual devices.
- Confirm worker/content type and HTTPS scope on Render, both public config values,
  exact CORS origin and no request/payload/Authorization logging. Confirm no health
  text leaves the device using network inspection of the integrated app.

These are release blockers, not completed tests. Do not tell the user closed-app
hosted notifications work until deployment and actual device delivery pass.
