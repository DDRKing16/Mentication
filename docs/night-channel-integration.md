# Night Channel implementation and owner configuration

This work is for the approved testing preview. Nothing here establishes live provider playback, native background support, or commercial release approval.

## Source and rebuild

The existing `public/night-channel/index.html` contained the supplied finished React build, but no editable original or source map was present. Its channel catalog, violet artwork, typography, orb and layout were recovered into `design/night-source/app.js` and `shell.html`. Playback, provider adapters, optional assessment and accessibility adjustments are separate source files. The original nine channel concepts remain. Rebuild with:

```
node scripts/build-night-document.mjs
```

Commit the generated HTML after source edits. This script uses the existing esbuild dependency, adds no package/service, and replaces the bundle through a replacement function (preserving literal dollar signs). Do not hand-patch generated HTML.

The six ambient channels currently play explicitly labelled generated noise previews. No intended recordings were supplied. Podcast, documentary and Audible slots require an attached user file; they never substitute noise. Files use tab-local object URLs, play once, are not uploaded, and are released on replacement/unmount. They are not DRM audiobook imports.

## Actual missing configuration

`public/night-channel/provider-config.json` deliberately contains empty values. Both services show `config_missing`; a missing value cannot turn into `ready` through elapsed time.

Spotify needs an owner-approved developer app public client ID and the exact registered redirect URL at `https://<preview-host>/night-channel/spotify-callback.html`. The redirect must match the current origin. The implementation also permits Spotify's approved `127.0.0.1` loopback development exception. No client secret belongs here. Configure only:

```
{"spotify":{"clientId":"PUBLIC_CLIENT_ID","redirectUri":"https://PREVIEW_HOST/night-channel/spotify-callback.html"},"apple":{"tokenEndpoint":"/OWNER_APPROVED_TOKEN_ENDPOINT"}}
```

The owner and test listeners need Spotify Premium; development mode is limited to allowlisted users (currently five). The app requests streaming, user-read-email, user-read-private, user-modify-playback-state and user-read-playback-state scopes. It does not rely on removed `/me.product`. Connect opens a PKCE popup, checks state/origin/opener, exchanges the code, keeps access/refresh tokens in memory, waits for a real SDK ready device, and sends a single chosen track URI to the playback API. A command acknowledgement alone does not mark playing: SDK playback evidence is required. Disconnect drops in-memory Spotify credentials. No token is persisted by this code.

Apple needs an owner-approved, same-origin endpoint returning `{ "developerToken": "SIGNED_JWT" }` with no-store responses. The owner must provision the Media ID and signing key, sign an origin-restricted developer JWT securely, and rotate it outside this frontend. The `.p8` private key must never be placed in source, static JSON, the bundle or chat. No endpoint, signing service or paid account was created by this change. MusicKit v3 is loaded only on explicit Connect; it then requests user authorization. Full playback requires an active Apple Music subscription and available content. MusicKit itself manages its provider user authorization. Song URLs are reduced to one song ID, not an album/playlist queue. Live sign-in/playback remains untested until owner setup and explicit user authorization.

Creating developer apps/keys, accepting terms, issuing grants, importing persistent credentials or incurring costs still requires the proper owner confirmation/secure handoff. Do not connect external user accounts automatically for testing.

Audible remains a named planned audiobook slot, with local file attachment and an explicitly external website link. No public subscriber-streaming integration was established. Audible uses its own timer; Night makes no external pause/stop/fade claim.

## Playback contract and checks

- One active source. Local sound is paused/closed before provider play, provider pause must succeed before local play, and Spotify is disconnected when switching to local/Apple. Failed provider playback retries remain provider retries and never fall through to noise.
- Pause/STOP preserve local file position and remaining timer time. Generated sound suspends the same AudioContext. A new timer choice explicitly resets duration. Defaults and choices are 15 / 30 / 45 / 60 minutes.
- Local sound fades in the final minute. Provider volume/fade is deliberately unavailable, including Spotify's unsupported iOS JS volume case. Timer expiry requests pause without sounds, notifications, completion screens or assessment.
- Browser suspension can delay a JS timer and locked/background playback is unverified. Physical iOS/Capacitor and real-provider tests are still required; do not promise an exact locked-screen stop.
- Readable labels, 44px targets, scrollable picker, visible STOP by the player and reduced-motion CSS preserve the original design without squeezing controls into a fixed viewport.
- Worry-note badge uses the actual Tomorrow Parking Lot storage adapter and only claims a note after valid, nonexpired saved records are found. It creates no note.
- Optional baseline uses the shared strict goal helpers. A valid Reset Flow baseline is passed only for Night, bridged via source/origin-checked messages, and retained with its question/scale. Direct entry may choose an explicit starting check before playback. End check opens only on Finish by choice; no answer is inferred, and the same scale is used. No assessment data is persisted by Night.

## Validation evidence

- `npm test -- --run`: 44 files / 294 tests passed (includes 9 Night tests).
- `npm run lint`, `npm run typecheck`, `npm run build`: passed. Build retains existing large-chunk warning. Home's prebuild regeneration was restored to HEAD and is not part of the Night commit.
- Muted headless Chrome, isolated task-only profile, 390×844 and desktop: no horizontal overflow or runtime exceptions; original nine channels; both missing-config states; actual local start/pause/resume/STOP; frozen timer across pause; silent expiry after simulated wall-time advance; explicit baseline 7→4 = −3; missing narration error; invalid MP3 failure; preserved player on pause; volume selection retained; reduced-motion removes running animations.
- Mock MusicKit browser test: actual adapter queue/play/pause/stop calls, local close before provider play, provider pause before local resume, rejected provider retry never starts local noise, successful retry recovery. These are transport/controller tests, not evidence of live provider playback.
- Unit tests cover Spotify device-targeted requests, rejected HTTP response, real state evidence, Apple queue/play evidence, missing configuration, source URL validation, timer and file position.

## Integration touchpoints

All substantial implementation is Night-owned. Three small host changes are necessary: NightChannel listens for baseline requests; ResetFlow passes valid candidate baseline/direction only on the Night standalone navigation; StandaloneFrame accepts an optional iframe permission string (default unchanged), with Night requesting encrypted-media for provider DRM. Review these small shared-file hunks when integrating alongside other workers.

## Official references

- https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
- https://developer.spotify.com/documentation/web-playback-sdk/reference
- https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
- https://developer.spotify.com/policy
- https://developer.apple.com/musickit/
- https://developer.apple.com/documentation/musickitjs
- https://developer.apple.com/help/account/capabilities/create-a-media-identifier-and-private-key

Spotify content must never overlap ANY other audio. A commercial Web Playback integration requires written approval; this preview implementation does not grant it. Provider account eligibility, user authorization, content availability and real iOS background behavior remain owner/device validation blockers.

Final remote recheck: `Chat-GPT` advanced from this clone’s base `9e4f735` to `8a9ae117e60ab1c90aea996176e5a590d1465292` during Night work. No remote history was rewritten; parent integration should apply the local Night commit to its current head.
