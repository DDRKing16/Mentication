# Check-in release readiness — 2026-10-29

Baseline verified from remote main: `f6cbdaa71535a4c99f42e0ec54e05e99b260040f`.
This branch does not deploy, configure credentials, create subscriptions, or buy
resources. Audio and App Store packaging are separate workstreams.

## Current evidence and changes

- Native local scheduling and app-boot tap routing are integrated on main. They
  use the already-approved Capacitor local notifications plugin. No hosted
  service, VAPID key, or new recurring hosting charge is needed for the native app.
- Hosted web transport and UI are integrated, but its source-only server still
  lacks an approved `web-push` dependency and persistent VAPID configuration.
- Fixed a server expiry boundary: at `endsAt`, remove the schedule instead of
  sending an already-expired payload with a zero-second TTL. Added regression test.
- Removed the web browser recipe's dependency on a prior executor's fixture.
  Without `TARA_FIXTURE_FILE`, it generates a fresh synthetic fixture from Vite.
- Added `node server/web-checkins/readiness.mjs`. This is read-only, prints only
  blocker names, checks matching supplied VAPID keys without generating any,
  and never claims actual delivery. Current local result: five missing settings
  and missing approved server-only dependency. Exit 1 means blocked.
- `npm test -- --run`: 987 tests / 114 files passed. Lint, typecheck and build pass.
  Existing build chunk-size warning remains.
- Native browser recipe: 11 scenario groups, 12 captures, no page errors.
  Web browser recipe: four scenario groups, five captures, no page errors.
  Both use mocked notification delivery; these are routing/UI/consent evidence,
  **not native or Web Push locked-phone delivery evidence**.

## Live verification limits

The Render connector returned no selected workspace and requires explicit
confirmation before listing services. The only listed workspace is “My Workspace”
(`tea-db0udd5g1s2s73fn5rng`); selection is pending. No service or secret values were
read. Public web-tool attempts to fetch the hosted direct route and worker failed.
The managed shell policy does not allow the Render frontend hostname. Therefore
current deployed commit, rewrite configuration and public build settings are
**unverified in this run**. Earlier accepted live baseline is not fresh evidence.
Do not infer that no backend exists from the local missing configuration.

After workspace confirmation: read service/deploy metadata; confirm frontend live
commit and a `/*` → `/index.html` SPA rewrite (status 200); test direct navigation
and refresh at `/tara-tactician` and `/reset`; inspect only presence/non-secret
public configuration, never dump service secrets. Worker path must return JS,
not the SPA fallback. Backend account inspection and public route fetches remain
required before any hosted-release claim.

## Reproduce source checks

From repository root with existing approved dependencies installed:

```sh
npm test -- --run
npm run lint
npm run typecheck
npm run build
node server/web-checkins/readiness.mjs
```

Separate terminal, native mocked browser suite:

```sh
npm run dev -- --host 127.0.0.1 --port 5225
# another terminal
node scripts/tara-native-notifications.browser.mjs
```

Separate terminal, web mocked browser suite (test-only fake public configuration):

```sh
VITE_WEB_CHECKIN_API=https://push.example.test VITE_WEB_CHECKIN_PUBLIC_KEY=YQ npm run dev -- --host 127.0.0.1 --port 5227
# another terminal
node scripts/tara-web-notifications.browser.mjs
```

Requires Chromium/Playwright already available; override `CHROME_PATH` and
`PLAYWRIGHT_MODULE` if necessary. To test a production preview, first generate the
fixture against Vite, then set `TARA_FIXTURE_FILE` to that generated JSON and
`TARA_APP_ORIGIN` to the preview. Do not put fake public settings in a real deploy.

## Physical native release gate — execute on a consenting tester's iPhone

1. On the Mac build host, check out the reviewed integration commit, run
   `npm run ios:sync`, then `npm run ios:open`. Select the existing signing team,
   install the signed build on the physical iPhone, record commit/build and OS.
2. In Let's get through this, use a synthetic plan, choose 10-minute reminders
   for 30 minutes, explicitly allow notifications, and start the plan. Record
   start time and permission state without recording plan words.
3. Lock the phone. Observe the generic OS notification at a scheduled interval;
   record expected/observed time and screenshot with identifying details removed.
   Tap it and verify the matching existing plan opens to its check-in.
4. Repeat with app backgrounded, then terminated before tap (cold launch). Test
   direct entry/refresh separately. Do not substitute mocked-browser evidence.
5. Stop reminders, reschedule, complete, and delete the plan in separate cases;
   wait through the next original interval and verify no new obsolete reminder.
   Test revoked permission and Focus; record suppressed/delayed outcomes honestly.
6. Confirm app-wide deletion, late tap, archived/expired/missing plan, repeated
   taps, and saved progress do not fabricate completion or overwrite another plan.
   Check VoiceOver focus/announcement and large text on this real build.

No physical device, signed build or Xcode is available in this executor. Keep
all these rows pending until an operator supplies evidence. Push receipt on an
unlocked browser is not enough.

## Hosting alternatives and approval boundary

Prices rechecked against official pages on 2026-10-29:

| Path | Incremental base hosting | Tradeoff / approval |
| --- | --- | --- |
| Existing native local notifications | USD 0/month for notification hosting | Meets native closed/locked phone intent without a backend; physical test still required; existing Apple signing/distribution costs excluded |
| Existing Render architecture | USD 7.25/month: one USD 7 web service + 1-GB disk at USD 0.25/GB-month | Closest to implemented source; resource purchase, library, metadata flow and credentials remain unapproved |
| Cloudflare Worker + SQLite Durable Object alarms | USD 0 on Workers Free within quotas | Preserves hosted background scheduling in principle; requires a port, reviewed push encryption transport, new provider/account authorization and VAPID secrets; not an implemented or verified substitute |

[Render pricing](https://render.com/pricing),
[Render free-service limitations](https://render.com/docs/free),
[Cloudflare Durable Objects pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/),
[Cloudflare alarms](https://developers.cloudflare.com/durable-objects/api/alarms/).
Cloudflare free operations fail when quotas are exceeded; paid Workers starts at
USD 5/month plus usage. Neither option guarantees exact-time notification delivery.
Render Free sleeps and loses local files, so it cannot replace the paid scheduler
as written. No provider was silently changed to avoid an earlier approval gate.

If hosted delivery is chosen, the existing Render approval bundle remains:
one instance plus 1-GB disk, USD 7.25/month base, taxes/usage overages additional,
no upgrade or extra resources. This is not an enforceable total-bill ceiling.
Cancel by deleting the added service/disk; accrued usage remains payable, and
turning reminders off in the app does not cancel hosting. Keep the static frontend.
Approve server-only `web-push`, then pin/audit it with a separate package/lockfile.
Approve generating one VAPID keypair and an owner-selected contact subject; owner
enters the private key in Render's authenticated Environment UI, not chat/source.
Only the public key and actual API origin belong in frontend VITE settings.

Render would receive random plan ID, timing/interval, subscription endpoint and
keys/expiry, authorization capability (stored hashed), and network metadata.
Apple/Google/Mozilla routes encrypted opaque ID/expiry pushes using its browser
subscription; the worker supplies generic visible text. No situation, answers,
local draft ID or plan text leaves the device. The existing proposal documents
snapshot retention and offline cancellation limits. Approve this metadata flow
and a consenting actual-device test before enabling it. A Cloudflare choice
requires a separate explicit provider/retention decision, not just a lower price.
