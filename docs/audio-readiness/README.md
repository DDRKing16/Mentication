# Audio readiness — current main audit

Baseline: `f6cbdaa71535a4c99f42e0ec54e05e99b260040f` (PR #32), verified against
remote main before work. Its 984 tests passed before changes. No earlier branch
content was restored, and the shipped Tapping 0.8 pitch-preserving player is unchanged.

## Completed source work

Night Channel now checks that Spotify SDK evidence names the requested track,
not merely any playing track. After this app has requested playback, an absent
state or a fulfilled pause command no longer proves silence: Spotify and Apple
must report a paused/stopped state before the controller can switch audio.
A newly connected, idle Spotify device still permits its first selection.
The supplied Night design is retained and rebuilt from `design/night-source`.

Urge Surfing no longer ducks its soundscape for an absent revised recording.
It uses the exact existing line when available and retains the existing voice
player and rate. No old sentence or different voice is substituted.

Run `node scripts/audit-practice-audio.mjs` for the read-only asset inventory and
exact missing scripts. `--strict` deliberately exits 1 while narration is incomplete.
`evidence/assets.json` records the current result, including genuine manifest
alignment checks and MP3 durations measured by ffprobe.

## Assets and remaining requirements

- Tapping: **0 of 18** unique recordings ready (19 cue keys); **1,455** request
  characters with cues. The original Piper files remain rejected. The exact
  scripts and approved preset remain in `design/tapping/narration/requests.json`.
- Revised Urge Surfing: **3 of 13** recordings verified and browser-played:
  `name` (9.76 s), `anchor` (8.88 s), `stages.0` (4.24 s). **10** missing scripts
  total **1,188** request characters with cues, listed in `evidence/assets.json`.
- Total missing: **28 recordings / 2,643 request characters**. This is a workload
  count, not a provider price quote or authorization to spend credits.
- The current managed environment reports no configured secret bindings, runtime
  variables or outbound identities. ElevenLabs and music-provider destinations
  are not in its enforced outbound allowlist. No secret listing was retried,
  account login attempted, key created, or credits spent. Generation requires
  authorized provider access/network configuration, an allowance/cost check,
  and specific approval for any paid usage. Alternatively supply the approved
  MP3s with genuine alignment and generation metadata. Unspecified historical
  options may use documented provider defaults with an audition.
- Night has no supplied intended channel recordings. Six generated-noise previews
  remain clearly labelled; podcast/documentary/audiobook slots need files. Supply
  authorized recordings and their channel mapping, or explicitly choose provider
  playback. No voice, stock content, or noise was installed as a replacement.
- Night Spotify still needs the public client ID and exact registered callback
  for the chosen deployment origin. Apple Music needs an approved same-origin
  developer-token endpoint. Both configuration fields are empty. Eligible listener
  accounts and explicit connection are needed for live testing. No service or
  persistent credentials were provisioned; existing setup details are in
  `docs/night-channel-integration.md`.

## Validation and limits

The updated suite passes **114 files / 1004 tests**; lint, typecheck and production
build pass. Build retains the large-chunk advisory. Night regeneration also emits
existing import.meta/IIFE warnings from imported web-check-in code; its rebuilt
page renders without runtime exceptions in the browser check.

`evidence/browser.json` records actual Chromium playback of the three matching
Urge MP3s, and Night local-file pause/resume/disposal using one existing recording
solely as test input. It was not added as Night content. The rebuilt Night page
renders without overflow or runtime errors. Provider checks use test doubles:
there is no live Spotify/Apple sign-in or playback evidence.

No claim is made that missing narration, full Tapping rhythm/voice integration,
intended Night content, locked-screen/native interruptions, or physical-device
accessibility testing is complete. Those checks require the actual recordings,
provider setup or hardware. No merge, deployment, or PR approval review performed.

## Spotify rejection recovery follow-up

The independent review's first-play HTTP 403 + idle SDK case was reproduced:
`f141d17` left requestedUri set and rejected subsequent pause/disconnect. The
regression failed before this fix and passes afterward. The adapter now separates
requested track identity from potentially active output. Activation/token failures
leave playback untouched. Definitive HTTP rejections restore the previous request
and activity risk; they never erase prior uncertain output or new SDK evidence.
Timeouts, HTTP 408/5xx, accepted-but-unconfirmed commands and in-flight requests
remain blocked from source switching until playback is known to be paused.

Tests cover first-failure switching/disconnect, retry success, activation/token
failure, transport/408/500 ambiguity, previous uncertain playback, SDK evidence
during rejection, pending requests and accepted-but-unconfirmed playback. The
served `public/night-channel/index.html` was rebuilt from the corrected source.

Draft PR creation previously failed with `Post https://api.github.com/graphql:
Forbidden`; no retry or alternative route was attempted. Local checks are the
reported evidence; no GitHub CI success is claimed.
