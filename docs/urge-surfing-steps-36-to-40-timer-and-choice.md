# Urge Surfing — Steps 36–40

## Scope completed

36. Added the real `Ride the crest` Choice Window screen. Its countdown is calculated from the persisted end timestamp, so returning to the app cannot stretch the chosen pause.
37. Connected the active and final-seconds approved wave assets to the live clock. The countdown, starting-intensity readout, waveform, and guidance are semantic UI—not a screenshot of the supplied board.
38. Added a persistent `Stop and choose what’s next` route. Stopping preserves elapsed time and moves to reflection; it never treats stopping as failure. The haptic treatment is explicitly unavailable in this web/device preview rather than pretending hardware haptics are running.
39. Added a choice-first post-window question. `Yes, some room`, `Not yet`, and `I’d rather not say` are all valid outcomes; a lower score is not required.
40. Added the completion screen with an optional current-intensity control, truthful elapsed-duration card, a single protected ten-minute extension, and next-step actions to leave, reach support, or choose a substitute.

## Verification

- Unit coverage confirms timestamp countdown restoration, one-time elapsed completion, protected one-extension behaviour, and early stop retention of elapsed time.
- The active screen provides the same written guidance without haptics, sound, drag, or animation as a required input.
- The supplied screen references remain comparisons only. The live screens use delivered atomic assets plus responsive, accessible controls.
