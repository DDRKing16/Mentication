# Gentle Tapping redesign review

Branch `design/tapping-sculpted-v2`, starting from integrated main `6ce94730424ba67bb27281fc846ce2bec2606949`. Only Tapping internals, its existing adapter and its review/test artifacts are changed. Catalogue, algorithm, shared routing, session credit and shared saving components retain their existing contracts. The adapter consumes the host’s already supplied `answers` to honor No audio / Discreet; its completion payload is unchanged.

## Concrete transformations

Inspected the real Library → ResetFlow → Tapping mobile journey before editing. The actual prior entry screenshot is `before/integrated-entry.png`. Other before views were reproduced from the exact component source at the starting main commit, using a temporary review harness; they are not invented mockups.

- Original sculpture replaces the flat contour diagram. Layered light and shade distinguish the nose bridge, brow, orbital bone, lips/chin, collarbone and torso. Artwork is authored SVG, with no external asset/service.
- Facial points get close framing, the setup gets a dedicated palm/side-of-hand view, and under-arm guidance exposes the side of the torso with an arm lifted. One marker is illuminated. Each marker and its drawing share one coordinate space.
- The top-level draft paragraph and oversized alternative button become a compact utility header and storage disclosure. Practice point, placement instruction and bodily rhythm carry the hierarchy.
- Preparation becomes a brief second-activation reveal, followed by two-fingertip guidance and a single begin action. Settings are disclosed only on request.
- Active pause is a quiet outlined control; resuming is a clear warm action. No point-advance phone taps are required. No extra progress clicks are introduced during body tapping.
- Outcome appears before the optional takeaway. Lower, unchanged, higher and skipped ratings get truthful language; no biological progress or guaranteed benefit is implied.
- Reduced motion honors both OS and app preferences, and turns off touch cues. No audio / Discreet from the host disable sound activation and silence shared button feedback for the practice. Still-light/text guidance remains sufficient without any hardware cues.
- Optional sound and touch have independent controls, both off by default. A single warm beat shares the round tick with the visual pulse; two gentle cues mark each point change during placement. Web Audio starts only after a setting-button gesture. Native haptics use the existing approved Capacitor plugin; browser vibration is feature-detected.
- There is no second rhythm clock. Pause, stop, hidden-tab, alternative, exit and unmount cancel active audio and browser vibration, plus pending native impacts. Resume waits for the next tick instead of replaying one; repeat starts one new setup cue. Unsupported or suspended hardware leaves the visible placement guide available.
- Failed completion restores the valid local draft. Unreadable drafts remain protected until explicit deletion; a fresh start is immediately available through the storage disclosure.

## Protocol and mapping

Point wording, sequence, scale, setup/reminder and modes are preserved from integrated main. The existing protocol sources remain [EFT International's instructions](https://eftinternational.org/discover-eft-tapping/what-is-eft-tapping/) and its [illustrated chart](https://eftinternational.org/wp-content/uploads/Free-EFT-Tapping-Points-Chart.pdf). The side-of-hand setup is repeated three times, then the short sequence uses a reminder at each point. Setup wording is a gentler self-kindness adaptation, not a verbatim clinical manual. EFT-style and grounding adaptation remain distinct.

Coordinates are presentation data for the new 400-unit artwork, not invented additional EFT points: hand (286,315), crown (200,61), inner brow (176,157), outer orbital bone (136,170), under-eye bone in line with pupil (157,184), philtrum (200,215), crease below lower lip (200,243), below collarbone lateral to sternum (174,342), exposed side torso below armpit (116,428). Visually reviewed all point screenshots; browser assertions verify markers remain inside every active frame at each tested width.

Pacing remains 30s setup then eight 12s points; spacious mode remains 16s per body point. Grounding setup remains 12s. The initial 3s on the hand allows placement before the rhythm cue. Ratings retain the identical question “How intense is the discomfort right now?” and 0–10 scale. Skipped answers remain null. Pacing is a UX choice, not a prescribed or independently validated clinical dose. Timer completion represents a guided round, not sensed body taps or clinical benefit.

## Cue implementation references

[Capacitor v8 Haptics](https://capacitorjs.com/docs/apis/haptics) documents light impacts and that unsupported hardware can resolve without producing a sensation. [Web Audio resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume) and the [Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) support the gesture activation and cancellation behavior used here. Neither native capability flags nor successful browser calls prove a physical sensation; no such claim is made.

## Review artifacts

Open `/design/tapping/redesign/comparison.html` in the existing Vite server. `comparison.png` is the visual review board. `after/` contains the integrated route at 320/390/430 widths, including every point, pause, alternative return and outcomes. `before/` retains the pre-redesign evidence. Local paths should not be assumed to exist in another cloud execution environment.

## Validation

Results are captured in `validation.txt`. `integrated-check.cjs` uses the real Library and ResetFlow route; it does not bypass the host adapter. `resilience-check.cjs` exercises shared saving and real local-storage failures. Existing preview browser/edge/pacing scripts are updated for this design. Tests use the execution environment's Playwright/Chromium, with no added app dependency.

Limits: native VoiceOver, physical-device haptics/audio and clinical benefit cannot be established by desktop Chromium. No push, merge or deployment is included in this review batch.
