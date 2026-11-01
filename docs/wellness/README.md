# Home wellness sources — implementation and release gate

Implemented on `codex/home-wellness`, based on main `cfb14c4b15c2cd6a93a89b2c69f4991ea4268fe3` (confirmed remote main before edits). No changes to recommendation scoring or existing practice content. Restore is a separate newly authorised route; see `docs/restore.md`.

## What ships locally

Latest scope focuses on Oura first and defers other production providers.

- The existing Your week card keeps its programme summary as the default. A compact source control can switch to a connected provider; Oura scores opens connection/privacy details. Returning to Your week preserves its live programme progress.
- No providers are connected or enabled in this version. Only Oura is shown in this release, explicitly marked as requiring setup. Other source definitions remain extension points; no other production connector was added. There are no nonfunctional connect buttons, external health requests, sample scores, new services or added packages.
- Provider-neutral controller, trusted adapter contract, explicit consent, loading/error/disconnect lifecycle and token-free summaries. No health summaries or credentials are persisted in web storage. Summaries are held in memory; source selection returns to Your week on remount.
- Summary metrics preserve provider, label, unit, measurement day and sync timestamp. Oura maps Sleep/Readiness/Activity from the same requested day. Zero remains zero; absent data stays absent. Older syncs/readings, empty data and errors are labelled. No proprietary score is inferred from another provider's measurements.
- The iframe's existing sandbox, source window, opaque origin and per-mount token checks remain. Wellness actions are allowlisted and restricted to known configured providers. The host sends only the sanitized display model. The iframe uses textContent rather than HTML for provider data.

## Code map

- `src/lib/wellness/providers.js`: source catalogue and token-stripping summary validation.
- `src/lib/wellness/oura.js`: Oura V2 daily collection mapping.
- `src/lib/wellness/controller.js`: injectable adapter lifecycle; shipped instance has **zero adapters**.
- `src/hooks/useWellness.js`: host state subscription and configured-source status checks on focus.
- `src/components/home/HomeFrame.jsx`, `src/pages/Home.jsx`: existing authenticated bridge integration.
- `design/home-source/*`: canonical source control, modal and summary UI; generated `public/home.html` rebuilt by script.
- `server/wellness/oura-client.mjs`: **unmounted server-only building blocks**, not a production OAuth service. Random state and S256 PKCE, exact redirect, explicit `daily` scope, bound callback checks, code exchange, rotating refresh token response, bounded pagination and dated daily-score mapping. No credentials configured, requests made or accounts granted.

## Required decision before enabling Oura

This app is account-free and local-first. `AGENTS.md` prohibits adding a hosted backend without an explicit product/privacy decision. The existing AI dev relay and separately configured web check-ins do not supply account-bound OAuth storage. The Render site is static. We therefore do not add an unauthenticated token proxy or put secrets/tokens in browser/native bundles.

To enable a real connection:

1. Approve the account/backend and health-data retention design (no new paid service assumed). Specify an authenticated per-user identity, session/CSRF protection, callback hosting, retention, encryption and deletion policy. Existing audience and privacy notices need review.
2. Owner creates an Oura developer application, sets the **exact HTTPS callback** and provides client credentials through server secret configuration. Never use a VITE variable for the secret. Oura's default application limit is ten users; wider use needs provider approval.
3. Mount authenticated routes behind same-origin HTTPS, validate request origin and CSRF on every mutation, use secure HttpOnly SameSite session cookies, set `Cache-Control: no-store` and `Referrer-Policy: no-referrer`, exclude callback queries and provider requests from logs, and redirect to a clean fixed URL after callback. No arbitrary return URLs.
4. Persist the `begin()` challenge only on the server with ten-minute expiry. On callback atomically consume it **once**, including denial/failure, before `complete()`. Account/session arguments must come from authenticated middleware, never request-supplied IDs. `complete()` checks state/PKCE/session/expiry but deliberately does not itself provide storage/replay prevention.
5. Store both tokens encrypted and bound to the authenticated app account. Serialize refresh across all workers with a distributed per-account/provider lock; atomically save **both** rotated tokens before releasing. An uncertain refresh must require reconnection instead of replaying a single-use refresh token. Never send tokens to the iframe or frontend. Do not depend on deprecated callback `scope`; daily endpoint authorization determines actual access.
6. Implement revoke + deletion. Disconnect must stop sync, revoke Oura access, destroy server token/cached data and pending challenges before resolving. Handle uncertain revocation honestly, permit retry and give the user instructions to revoke from Oura. A local hide is insufficient. Integrate delete-account/delete-all controls with server deletion; local app data deletion alone cannot revoke a remote grant. The toolkit does **not** implement revocation or storage yet.
7. Register a trusted Oura adapter implementing `status`, `connect`, `sync`, `disconnect`; each returns `{connected, snapshot?}`. Only then expose consent/connect. Test denial, revoked/partial scopes, offline, 401/403/429, expired/replayed/mismatched callbacks, concurrent refresh, interrupted refresh, disconnect deletion and account switching against approved test accounts. No live provider calls have been made here.

## Many-app route and verified dependencies (2026-11-01)

| Source | Feasible route and remaining dependency |
| --- | --- |
| Oura | Official direct OAuth2 + daily V2 collections. Preserves proprietary daily scores. Requires owner developer app, credentials, exact callback, authenticated backend and provider approval for wider use. |
| Apple Health | Best initial native iOS aggregation route: reads only types compatible source apps actually write. Requires approved native bridge/plugin (existing allowlist does not include one), HealthKit capability, read-purpose descriptions, explicit type-specific permissions and privacy review, plus signed device/Xcode QA. Does not guarantee Oura Readiness or other proprietary scores. No native bridge or entitlement was added. |
| Health Connect | Native Android SDK aggregation route with per-type permissions and source attribution. Requires an Android app/bridge, permission declarations and distribution review. Repository currently supplies iOS only. Not a browser connection and not implemented. |
| Fitbit / Google Health | Legacy Fitbit Web API was switched off October 30, 2026. New work must use Google Health API. Needs a Google Cloud project, enabled API, web-server OAuth client, least read-only scopes, test users, backend and verification/security review for public/wider use. No legacy Fitbit connect implemented. |
| WHOOP | Official v2 OAuth direct API supplies Recovery, Sleep performance and cycle Strain (0–21), which must keep those labels/units. Needs developer OAuth app, backend and permitted user/launch access. No adapter enabled. |
| Garmin | Current business Starter/Enterprise programme requires an application and approved app. Starter delivers push data, so a production webhook/backend is needed. Commercial terms may apply; personal API access to one's own data is not authority to serve this app's users. No enrollment or paid agreement made. |

Official references checked:

- [Oura OAuth and PKCE, scopes, refresh rotation, User-Agent and revocation](https://cloud.ouraring.com/docs/authentication)
- [Oura application registration and ten-user limit](https://cloud.ouraring.com/docs)
- [Oura V2 daily scores and pagination](https://cloud.ouraring.com/v2/docs) (web search indexed daily_* / score / day / next_token schema; JS docs page has no readable body in the retrieval tool). Only mapped fields are used; live schema/permission verification remains a release gate.
- [Apple HealthKit](https://developer.apple.com/documentation/healthkit)
- [Android Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect)
- [Fitbit API shutdown notice](https://dev.fitbit.com/build/reference/web-api/)
- [Google Health OAuth setup](https://developers.google.com/health/setup), [verification](https://developers.google.com/health/app-verification), [launch checklist](https://developers.google.com/health/developer-checklist)
- [WHOOP official v2 API scopes and schemas](https://developer.whoop.com/api/)
- [Garmin programme overview and access modes](https://developer.garmin.com/gc-developer-program/overview/)

No denied hosted-site access was retried. No personal health data was requested or disclosed. No source push, PR, merge or deployment was performed; parent owns review and integration.

## Local verification

- Full suite: 120 files, 1,069 tests passed (1,048 existing + 12 wellness + 9 Restore).
- Lint, typecheck, production build and V3 algorithm verification passed. Build retains its existing large-chunk warning.
- `python qa/home-wellness-browser.py`: Chromium at 320/390/768/1280 px. Exercises actual hosted Home iframe plus standalone synthetic render-only fixtures: setup gates/no connect buttons, week default, consent, zero/missing scores, dated stale data, loading/error, fallback after disconnection, forged bridge token rejection, dialog focus return and no horizontal overflow. The iframe also waits for its load handshake before enabling controls. No real provider connection is implied by these fixtures.
- Browser screenshots/report: `/tmp/wellness-evidence/` (synthetic score images explicitly QA-only). Native device/Xcode and real-account integration tests remain blocked by the dependencies above.

Independent pre-publication findings, fixes and backend options: see [review.md](review.md).
