# Night Channel — Canonical Intervention Design

Status: canonical direction confirmed.

## Core decision

“Familiar Voice” is renamed **Familiar Replay**. It means any already-known media the user finds easy to settle into: a song, album, podcast, audiobook, television episode, video, recorded programme or other familiar audio-led content.

It does **not** mean voice cloning.

Night Channel is an audio-first attentional landing place, not a promise to induce sleep. It offers a finite, low-pressure alternative to bedtime rumination, then removes visual and interaction demands.

## Purpose

Night Channel helps someone whose attention is caught in bedtime rumination settle onto familiar or gently engaging media without creating another task to complete. The user chooses how much attention they need captured, selects a familiar replay or finite low-stakes narrative, and lets the interface fade to near-black while playback remains easy to stop. Audio may support subjective sleep quality for some people, but results vary; Night Channel therefore prioritises personal preference, low stimulation and an automatic stopping point rather than claiming that audio will cause sleep.

## Canonical user flow

HOME + SLEEP

↓

WHAT WOULD BE EASIEST TO DRIFT INTO?

↓

FAMILIAR REPLAY · CONTINUING STORY · GENTLE CURIOSITY

↓

HOW MUCH ATTENTION NEEDS CAPTURING?

↓

LIGHT · STEADY · FULL

↓

CHOOSE SOURCE

↓

MENTICATION AUDIO · SAVED REPLAY · EXTERNAL APP

↓

SET STOP POINT

↓

15 MIN · 30 MIN · 45 MIN · END OF ITEM

↓

PLAYBACK BEGINS

↓

SCREEN FADES TO NEAR-BLACK

↓

PLAYBACK STOPS WITHOUT A COMPLETION SCREEN

Optional feedback belongs to daytime only.

## The three channels

### Familiar Replay

Already-known media with low uncertainty and no need to follow every detail. This may be music, a familiar podcast or audiobook section, a known television episode or video, or another personally selected replay.

Night Channel does not decide that familiar content is calming. The user chooses it and can remove it from saved replays at any time.

### Continuing Story

A finite Mentication-owned narrative that continues across nights without cliffhangers, performance demands or emotionally intense stakes. Each segment must be understandable without remembering the previous one.

### Gentle Curiosity

A finite, softly narrated topic for users who need slightly more cognitive capture. Replace “Interesting Facts,” which implies an endless novelty feed. Topics must avoid breaking news, conflict, fear, self-improvement pressure and algorithmic autoplay.

## Capture level

Capture level changes pacing and complexity—not volume alone.

- **Light:** long pauses, familiar structure, minimal detail.

- **Steady:** continuous but unhurried narration or music.

- **Full:** enough coherent detail to compete with rumination while remaining finite and emotionally low-stakes.

The user can change level during playback without restarting.

## Playback capability contract

### Mentication audio

Native playback supports the complete experience: capture-level adaptation, gradual pacing changes, screen disappearance, stop timer, lock-screen controls, captions/transcript where relevant and optional daytime feedback.

### Saved Replay

A saved replay is a user-created bookmark to content they already use. It stores only the title, source and link or local reference required to find it again. It does not imply that Mentication owns, copies or can analyse the media.

If locally imported audio is supported later, import and storage permissions must be explicit and the user must be able to delete the file.

### External app

Mentication may deep-link or hand off to a supported external app. Unless a platform integration explicitly allows it, Mentication must not claim that it can:

- control the external volume;

- fade, pause or stop external playback;

- remove the external app’s video or interface;

- detect when the user fell asleep;

- know what was played after handoff.

Before handoff, the app should help the user configure the external service’s own sleep timer when one is available.

### Video and television

These are allowed within Familiar Replay because familiarity may matter more to the user than format. The route is labelled **audio-first** and recommends using the source’s screen-off, dimming or audio-only options where available. Night Channel never claims that bright or continuously changing video is inherently sleep-supportive.

## Visual and audio direction

### Visual

A premium midnight broadcasting field with distant frequencies and one selected channel. As playback begins, competing frequencies recede, controls simplify and the field falls to near-black. The final screen contains only a faint waveform and essential pause, volume and stop controls before they too dim.

### Motion

Slow signal tuning followed by progressive disappearance. No equaliser spectacle, pulsing notifications, scrolling transcripts or continuous decorative animation. Reduced-motion mode uses static signal states and fades.

### Sound

No sudden transitions, adverts, notification sounds or triumphant completion cue in Mentication-owned content. Normalise native audio conservatively, preserve dynamic safety, and allow immediate pause/stop. Do not alter or make promises about externally played audio.

## Mentication upgrade

### Familiarity without infinite feeds

The user can return to known content without searching through stimulating home screens. Every route has a visible stopping point and autoplay is off by default.

### Narrative descent

For Mentication-owned audio, emotional stakes, pacing and density gradually soften. Descent must not make the story incoherent or manipulate volume below audibility.

### Personal drift profile

With permission, the system may remember chosen channel, capture level, source type, stop point and optional daytime feedback. It may say **“Familiar music with a 30-minute stop has been your usual choice.”** It may not claim to know when the user slept or which source medically improves their sleep.

### Screen disappearance

The interface removes visual demand quickly while keeping controls accessible through tap, screen reader and lock-screen playback controls.

### Honest source routing

The product clearly labels whether an item plays natively or opens elsewhere. Unsupported platform control is never simulated in the design.

## Safety, privacy and accessibility

- Stop, pause and volume controls remain immediately available.

- Autoplay and endless queues are off by default.

- Native content excludes startling sounds and abrupt intensity changes.

- Saved listening choices are private and removable.

- Captions or transcripts are available before the screen fades when relevant.

- Screen-reader labels, reduced motion, high contrast and screen-lock/background playback are required.

- If the user reports persistent sleep difficulty or safety concerns, the app offers appropriate support information without presenting Night Channel as treatment.

## Final asset brief

Retain:

- midnight broadcast field;

- illuminated frequency/channel metaphor;

- capture-depth control;

- near-black playback state;

- “Nothing to finish” language.

Regenerate or add:

- rename Familiar Voice to Familiar Replay;

- rename Interesting Facts to Gentle Curiosity;

- native-versus-external source labels;

- explicit stop-point selection;

- external handoff preparation screen;

- near-black native playback screen with pause, volume and stop;

- static reduced-motion states;

- separate background, waveform, frequency and glow layers without baked-in UI text.

## Evidence note

Internal reference for the psychoeducation register: music and auditory-intervention research reports mixed results across populations and outcomes, so user-facing claims must remain conditional rather than promising faster sleep or improved sleep quality.

