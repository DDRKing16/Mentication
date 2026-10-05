import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Every intervention's own CSS keyframe loops (raw @keyframes/animation, not
// framer-motion, which MotionConfig already covers globally) must also honour
// Mentication's in-app Reduce motion toggle (the `html.reduce-motion` class
// set by useAccessibilityPrefs), not only the OS-level
// prefers-reduced-motion media query. A gap here means someone who enables
// the setting from inside the app, without an OS-level setting too, still
// sees looping glows/pulses/drifts that should have stopped.
describe("in-app Reduce motion reaches every intervention's own CSS animations", () => {
  it("Tomorrow Parking Lot's drifting thought lines stop under html.reduce-motion", () => {
    const css = readFileSync("src/styles/tomorrow-parking.css", "utf8");
    expect(css).toMatch(/html\.reduce-motion \.tpl \*/);
  });

  it("Change the Scene's looping glows/pulses stop under html.reduce-motion", () => {
    const jsx = readFileSync("src/components/ChangeSceneExperience.jsx", "utf8");
    expect(jsx).toMatch(/html\.reduce-motion \.change-scene-v2 \*/);
  });

  it("Next Easiest Step's looping glows/pulses stop under html.reduce-motion", () => {
    const jsx = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");
    expect(jsx).toMatch(/html\.reduce-motion \.nes-v2-wrap \*/);
  });
});
