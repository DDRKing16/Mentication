# Urge Surfing rebuild — Steps 26–30

## Steps 26–29 — Screen 1 completion

The microphone never requests device access or pretends to transcribe. It is
labelled as unavailable, and activation announces: “Voice entry isn’t available
on this device. Choose a category below instead.” The untouched visual state
retains the supplied microphone affordance.

Continue is disabled until intensity and one category are present. The reducer
allows its `urge.name` → `urge.body` transition only after the safety answer is
No, and preserves selected intensity/category values.

Keyboard verification at 390 × 844 confirmed this sequence: header controls,
intensity range, unavailable voice control, category controls, then Continue.
Selecting Send it with the keyboard enabled Continue and opened Find the pull.

The Screen 1 comparison capture confirms the reference’s core hierarchy:
header, prompt, central wave/value/waveform, microphone, five icon controls,
helper copy, primary control, and bottom progress. The screen remains a real
semantic interface; no reference screen image is rendered.

## Step 30 — Screen 2 body-map foundation

Find the pull now uses the supplied body-map base and matching selected-region
layers as the real selection surface. Each body area is a semantic 44 px or
larger hotspot, with an accessible name and pressed state. Selecting Chest was
verified live: the Chest overlay and hotspot state changed together.

The supplied 2 × 2 sensation controls remain beneath the map. The visually
compact non-visual region fallback is in place as an interim semantic list;
Step 31 will turn it into the complete visible/accessibility-equivalent route
and resolve the remaining source-comparison refinements for Screen 2.
