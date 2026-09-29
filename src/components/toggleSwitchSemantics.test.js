import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Settings, the in-session Accessibility panel and the reset-flow
// "Optional preferences" row all render an on/off control as a plain
// <button> with a decorative track/thumb — a screen reader announced only
// the label text, never whether the setting was on or off. Each one now
// carries role="switch" and aria-checked so assistive tech gets the state
// a sighted user reads from the track's colour and thumb position.
describe("custom toggle switches expose their on/off state", () => {
  const files = {
    settings: readFileSync("src/pages/Settings.jsx", "utf8"),
    accessibilityPanel: readFileSync("src/components/AccessibilityPanel.jsx", "utf8"),
    preferencesRow: readFileSync("src/components/PreferencesRow.jsx", "utf8"),
  };

  it("Settings' Toggle carries role=switch and aria-checked", () => {
    expect(files.settings).toMatch(/role="switch"[\s\S]{0,80}aria-checked=\{on\}/);
  });

  it("AccessibilityPanel's toggle row carries role=switch and aria-checked", () => {
    expect(files.accessibilityPanel).toMatch(/role="switch"[\s\S]{0,80}aria-checked=\{on\}/);
  });

  it("the reset flow's preference buttons carry role=switch and aria-checked", () => {
    expect(files.preferencesRow).toMatch(/role="switch"[\s\S]{0,80}aria-checked=\{on\}/);
  });
});
