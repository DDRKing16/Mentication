# Tapping narration handoff

`requests.json` is the exact 18-recording / 19-key request contract extracted from
`tappingAudioManifest.json` at `eed6d05`. It totals 1,455 request characters,
including the approved delivery cue on every unique recording.

No exact text matches exist among the 754 approved narrator manifest entries.
The older tapping MP3s are Piper recordings, documented in their `NOTICE.md`;
they are not substitutes for the approved narrator. No recordings were generated.
The build environment has no configured ElevenLabs credential. Existing authorized
provider access and sufficient allowance are the outstanding generation requirement.
Unspecified provider settings can use documented defaults with an audition; recovering
undocumented historical values is not required. Never retry denied secret listing.

Tapping narration now uses a media element at the approved 0.8 playback rate with
pitch preservation (standard or WebKit property). It is routed into the existing
voice gain/ducking path. Music and contact buffers retain their native rate and
cadence. Activation unlocks the same media element in the gesture using a muted
real approved clip, then rewinds. Pause stores media time; replacement, muting,
interruption and disposal cancel the voice. Playback failure disables only voice.
Unsupported pitch preservation fails without playing a transposed recording.

Validation: 106 test files / 917 tests passed; lint, typecheck and production build
passed (existing chunk-size advisory). Headless Chromium played an existing
approved recording solely as test input: observed rate 0.8007, preservesPitch true,
paused position stable, resume advanced from that position, music/contact rates 1,
and no audio errors. This does not certify the missing tapping recordings or
physical iOS playback. Once recordings arrive, check actual durations/alignment,
audition them, and verify the complete tapping flow before any merge to main.
