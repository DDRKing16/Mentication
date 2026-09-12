# Mentication narration preset — approved and locked

Locked: 22 August 2026

Runtime model: **bundled audio only**. The application never generates speech
over a network and contains no speech-service credentials.

## Approved generation preset

These settings are used only by the local, build-time narration script:

| Parameter | Value |
|---|---|
| Model | `eleven_multilingual_v2` |
| Voice ID | Local `ELEVENLABS_VOICE_ID` environment value |
| Speed | `0.82` |
| Stability | `0.39` |
| Similarity boost | `0.85` |
| Style | `0.15` |
| Speaker boost | `true` |
| Output | `mp3_44100_128` |

Do not change the voice, accent, pacing, model or generation parameters without
explicit approval. API credentials must remain in the local environment and
must never be placed in frontend source, the iOS project or committed files.

## Runtime delivery

- `narration-manifest.json` maps approved spoken text to bundled audio.
- Audio files live under `public/audio/narration/` and are copied into the iOS
  application by `npm run ios:sync`.
- `src/lib/narrationService.js` performs a local manifest lookup only.
- Missing narration returns `null`; it cannot silently call a remote service.
- Word-level alignment is read from the manifest where an intervention needs
  synchronised visual text.

## Generation workflow

1. Approve any changed spoken text.
2. Run `npm run narration:audit`.
3. Configure `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` locally.
4. Run `npm run narration:generate-final50` to generate missing files.
5. Run the audit again and listen to the changed clips.
6. Commit the approved MP3 files and updated manifest.
7. Run `npm run ios:sync` so the native project receives them.

Production generation remains unseeded for the approved natural voice
variation. Reference seed `408` may be used only when comparing voice character.
