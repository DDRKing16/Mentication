import { describe, expect, it } from "vitest";
import { applyReduceMotion, REDUCE_MOTION_STYLE_ID } from "./StandaloneFrame";

// Night Channel, Vector Shift and Signal Lock render as same-origin iframes
// with their own document, so the host page's in-app Reduce motion class
// never reaches their CSS on its own. applyReduceMotion is what mirrors the
// preference into that document from the outside, without touching the
// finished build's own file.
function fakeDocument() {
  const elements = new Map();
  return {
    getElementById(id) {
      return elements.get(id) || null;
    },
    createElement() {
      const el = {
        id: "",
        textContent: "",
        remove() {
          elements.delete(el.id);
        },
      };
      return el;
    },
    head: {
      appendChild(el) {
        elements.set(el.id, el);
      },
    },
  };
}

describe("applyReduceMotion mirrors the in-app setting into a standalone build's iframe", () => {
  it("adds a stilling style tag when turned on", () => {
    const doc = fakeDocument();
    applyReduceMotion(doc, true);
    const style = doc.getElementById(REDUCE_MOTION_STYLE_ID);
    expect(style).toBeTruthy();
    expect(style.textContent).toMatch(/animation-duration/);
    expect(style.textContent).toMatch(/transition-duration/);
  });

  it("removes the style tag when turned back off", () => {
    const doc = fakeDocument();
    applyReduceMotion(doc, true);
    applyReduceMotion(doc, false);
    expect(doc.getElementById(REDUCE_MOTION_STYLE_ID)).toBeNull();
  });

  it("does nothing on repeated calls instead of stacking duplicate style tags", () => {
    const doc = fakeDocument();
    applyReduceMotion(doc, true);
    applyReduceMotion(doc, true);
    expect(doc.getElementById(REDUCE_MOTION_STYLE_ID)).toBeTruthy();
  });

  it("does nothing when the iframe's document isn't reachable yet", () => {
    expect(() => applyReduceMotion(null, true)).not.toThrow();
    expect(() => applyReduceMotion(undefined, false)).not.toThrow();
  });
});
