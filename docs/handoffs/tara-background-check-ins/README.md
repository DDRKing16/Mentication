# Tara check-in delivery integration

The native notification action listener now starts at app boot, before awaited
cosmetic startup work. Capacitor retains notification taps until that listener
consumes them. The router bridge retains an early tap, remounts the correct Tara
journey and loads the saved plan by its validated opaque ID. Active plans open
the check-in; completed/archived plans open a read-only reflection; missing plans
show a clear message. Viewing a reflection never overwrites a different draft or
records another completion. Reset refresh preserves only coarse routing IDs.

The native plugin is imported as a proxy, without returning the proxy from an
async function. Promise resolution previously tried to call an unsupported
`LocalNotifications.then` method. Scheduling, verification, cancellation and tap
handling now exercise the real proxy path in tests. The bounded absolute-date
OS schedule is retained: explicit permission, at most twelve future reminders,
10/20/30-minute cadence, maximum two hours, generic content and intervention-owned
IDs. Daily reminder IDs remain untouched. App resume also checks expiry and
queue ownership. The foreground timer only updates the visible check-in UI.

The website uses the separate `webCheckIns` transport through
`taraCheckInDelivery.js`; native capability remains native-only. The ready screen
explains the external timing/subscription metadata before its explicit allow-and-use
action. Permission is called before any async web work. The plan is saved before
server registration. An in-app alternative requests no permission and transmits
no metadata. Unconfigured, unsupported, blocked and uninstalled browsers show
their actual setup state. Public configuration is unset in the normal build, so
the current website says background check-ins are unavailable and remains in-app.

Web boot consumes the service worker's opaque hash handoff before constructing
the router. Only a locally mapped, active saved draft can open a check-in. The
hash is removed and local draft IDs/private words never enter server payloads.
Completion, stop, replacement, expiry, revocation, deletion and reconnect use
the same cancellation/reconciliation path. App-wide clear deletes private data
while retaining only the opaque remote-cancellation capability until deletion
succeeds. An actual offline failure shows a pending-stop message across routes;
online retry removes that outbox. It does not claim a successful remote stop.

The separate hosted infrastructure is included unchanged apart from its handoff
description. Deployment, its server-only dependency, paid resources, metadata
flow/retention and persistent VAPID credentials remain approval gates documented
in [the hosted proposal](../hosted-web-checkins/README.md). No backend was created,
no dependency installed, no persistent credentials generated, and no provider
notification or real subscription created during validation.

## Validation

The integrated source passes `npm test -- --run` (873 tests, 102 files),
`npm run typecheck`, `npm run lint`, `npm run build` and `npm run ios:sync`.
The build retains its existing large-chunk warning. Native sync copied the web
assets and found the six existing plugins. No Xcode compiler or physical iPhone
is available here; no signed binary or device notification presentation was tested.

Repeatable browser recipes:

- `scripts/tara-native-notifications.browser.mjs`: real app/router and Capacitor
  proxy with a mocked native bridge; cold startup, outside-Tara/repeated taps,
  consent/denial, refresh, archived/deleted/completed/expired/unreadable plans,
  manual support, cancellation and app-wide deletion at 320/390px.
- `scripts/tara-web-notifications.browser.mjs`: test-only public configuration,
  mocked browser notification/worker/subscription APIs and intercepted
  `push.example.test` requests; explicit consent, private payload, rescheduling,
  cold hash tap, refresh, completion, offline deletion/reconnect, denial and
  in-app alternative. No real server/provider call occurs.
- `scripts/tara-live-support.browser.mjs`: complete foreground plan, practice,
  support, reflection and persistence/error regression coverage; the production
  run exercises actual session completion rather than a component callback.

Browser results and screenshot hashes are recorded in `verification.json`.
Screenshots contain synthetic authored examples only and are retained in the
executor evidence directory, not published in this source branch. Mocked bridge
tests are not proof of physical background delivery.

## Release limits

Native changes require a rebuilt/signed iOS app installed on a consenting tester's
device. A static-site deployment does not update the bundled native app. Test
locked screen, app background, app closed, notification tap at cold startup,
Focus/denial/revocation, reschedule, completion and deletion on that device.
[Apple documents OS delivery of scheduled local notifications while the app is
not running](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/SchedulingandHandlingLocalNotifications.html).
That platform capability is distinct from this release's unperformed device test.

Hosted delivery requires the approval-gated service, dependency, durable store,
VAPID keys and public configuration first, then device tests. On iPhone/iPad the
supported web path is a Home Screen app on iOS/iPadOS 16.4 or later with explicit
permission; installation alone does not activate delivery.
[WebKit describes those requirements](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/).
Keep the website's unavailable/fallback state until those prerequisites are met.

The parent release coordinator owns merging and Render verification against the
exact reviewed remote source SHA. This task has not changed main/Chat-GPT or
deployed any service.
