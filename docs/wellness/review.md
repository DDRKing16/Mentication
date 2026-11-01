# Independent pre-publication review

Baseline: committed `ad5805b87a985078e6d39fdfef3cf16d61d1566a`. A separate read-only reviewer inspected source and independently reproduced browser cases. No publication, resources, credentials or grants were created.

## Findings and fixes

1. **P2: Restore browser-history state could cross attempts.** Completing breathing A, starting reading B (or another breathing attempt B), then navigating Back to A could enable saving with B's attempt ID and remove B's draft. Fixed by keying each flow on both activity and attempt, carrying attempt IDs across all stages, matching stored drafts/outcomes to that identity, rendering saved history read-only, and deleting only the draft owned by the saved attempt. Independent reviewer verified both cross-activity and same-activity reproductions at 390 px after the fix. `qa/restore-history-browser.py` verifies Back/Forward, refresh, exact new-draft preservation and immutable saved history at 320/390 px.
2. **Planning feedback lacked context.** Recovery-day/sleep-routine planning asked whether the user felt more rested. These flows now ask plan manageability, including an early stop, with a distinct allowed feedback set. Planned and completed outcomes cannot be interchanged by the persistence helper. Feedback still requires selection then save; skipping it remains available.

The review found no shipped live Connect button, secret/provider-token exposure, fake timer completion, unlicensed supplied media or unsupported physiological guarantees. The iframe's window/origin/per-mount-token validation is preserved. The shipped controller has zero installed adapters, shows only Oura setup, retains Your week as default, and contains no health API network path. Oura server helpers are not imported into the browser build.

## What can be released

The existing static frontend can serve the **setup-required Oura UI plus all ten functional Restore activities** without enabling a health-data connection or adding infrastructure. Oura's panel explicitly says setup is required and provides no Connect button. There are no real ring scores or claims of an active grant. Restore is independent of Oura, uses original written guidance, and honestly asks users to supply their own music/reading/video. Apple Health sharing is not represented as access to proprietary Oura Readiness scores.

Live Oura connection remains a separate release gate. Do not set an adapter to available until its account/session binding, token storage, revocation and deletion have passed integration tests.

## Backend options found, without provisioning

Repository evidence:

- The existing hosted frontend is described as the static `mentication-preview.onrender.com` site. No `render.yaml` or production account/auth server is present in this source. A static site cannot privately perform the OAuth client-secret exchange.
- `server/ai-proxy.mjs` is explicitly development-only and has no per-user health grant/account storage. It is not an Oura backend.
- `server/web-checkins/` is a separate, gated push-scheduling service proposal. Its schema stores push metadata under an opaque device capability; it is not account/session authentication for long-lived Oura grants. Its deployment requires separately approved configuration/dependency/storage. Do not reuse push capabilities or data tables as health authorization.
- The connected Render tool successfully exposed workspace discovery. Resource-level inventory was not requested because this subthread has no user-confirmed selected workspace. No workspace was selected or switched, and no hosted-site access was retried. Current service capacity/cost and any reusable approved production backend therefore remain unverified, not denied.

Minimal viable options for the owner to choose:

1. **One same-origin Node web service serving the built frontend and Oura endpoints**, with approved durable encrypted token storage. This avoids cross-site cookie assumptions between separate `onrender.com` services. It could keep the product account-free through an approved pseudonymous browser/device session, or use an approved app account; either identity model needs explicit ownership, reconnect and deletion rules. The backend still must bind every grant and request to that identity.
2. **A separate approved authentication/API backend**, if an existing one is confirmed by the owner, with a carefully configured first-party same-site domain/session or another reviewed authentication model. Existing unrelated dev/push services do not establish this. A free ephemeral process/memory store is unsuitable for persistent rotating refresh tokens. No price, free-tier persistence, paid resource or capacity is assumed here.

Minimum developer/backend work in either option:

- Owner registers the Oura developer application, exact HTTPS redirect and client secret in server secret configuration; use explicit `daily` scope and PKCE. Default application limit is ten users; wider access needs Oura review.
- Implement authenticated session/identity, origin/CSRF checks, atomic single-use callback challenge consumption, private encrypted per-user token storage, serialized refresh rotation with atomic persistence, token-free summary endpoints, no-store responses, log/query redaction and secure session cookies.
- Implement real provider revocation, grant/cache/challenge deletion, retry/uncertain-state handling, and app data-deletion/account controls before exposing Disconnect as successful.
- Test with owner-approved Oura test accounts: denial/partial permission, wrong/replayed/expired callback, 401/403/429, offline, concurrent/interrupted refresh, account switching, revocation and deletion. No such grants or personal health data were used in local testing.

Detailed OAuth dependencies and verified official documentation are in `README.md`. Native HealthKit/Health Connect remain deferred and require separate entitlements/bridge approval; neither replaces direct Oura score access in this release.

Current Render references were verified through their HTML pages after the retrieval tool rejected the Markdown content type: [static sites](https://render.com/docs/static-sites), [web services](https://render.com/docs/web-services), [persistent disks](https://render.com/docs/disks), [free service limits](https://render.com/docs/free). They confirm the static/dynamic distinction and that local files on a default/free web service are ephemeral; persistent disks are for paid services. No current price or account capacity was assumed.

Final local coverage: 120 test files / 1,069 tests; lint, typecheck, production build and V3 algorithm verification. Four-width wellness QA records zero provider network requests. All ten Restore flows pass at 320/390 px, with tablet/desktop coverage at 768/1280 px. The new history regressions, Profile deletion flow and existing Calm/Lift/Focus/Ground/Sleep/Guide me route smoke tests pass. Evidence: `/tmp/restore-review-evidence/`, `/tmp/restore-evidence/`, `/tmp/wellness-evidence/`. Production build has the existing large-chunk advisory. Native device QA and live Oura integration remain outside these local results.
