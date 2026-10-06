// @ts-check
import { beforeEach, describe, expect, it } from "vitest";
import { ACCESSIBILITY_DEFAULTS, prefersReducedMotionByDefault, read } from "./useAccessibilityPrefs.js";

class LocalStorageStub {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

beforeEach(() => {
  global.localStorage = new LocalStorageStub();
  global.window = global.window || {};
});

describe("prefersReducedMotionByDefault", () => {
  it("is false when there is no matchMedia", () => {
    global.window.matchMedia = undefined;
    expect(prefersReducedMotionByDefault()).toBe(false);
  });

  it("reflects the OS media query", () => {
    global.window.matchMedia = (query) => ({ matches: query.includes("reduce") });
    expect(prefersReducedMotionByDefault()).toBe(true);
  });

  it("is false when the OS does not ask for reduced motion", () => {
    global.window.matchMedia = () => ({ matches: false });
    expect(prefersReducedMotionByDefault()).toBe(false);
  });
});

describe("read", () => {
  it("on a device with no saved preference yet, starts reducedMotion from the OS setting", () => {
    global.window.matchMedia = () => ({ matches: true });
    expect(read()).toMatchObject({ ...ACCESSIBILITY_DEFAULTS, reducedMotion: true });
  });

  it("once a preference is saved, the OS setting no longer overrides it", () => {
    global.window.matchMedia = () => ({ matches: true });
    localStorage.setItem("haven.a11y.v2", JSON.stringify({ reducedMotion: false }));
    expect(read().reducedMotion).toBe(false);
  });

  it("keeps an explicitly saved reducedMotion: true even if the OS preference is off", () => {
    global.window.matchMedia = () => ({ matches: false });
    localStorage.setItem("haven.a11y.v2", JSON.stringify({ reducedMotion: true }));
    expect(read().reducedMotion).toBe(true);
  });
});

describe('preference fidelity',()=>{
 it('retains OS default when only another preference was previously saved',()=>{window.matchMedia=()=>({matches:true});localStorage.setItem('haven.a11y.v2','{"largeText":true}');expect(read().reducedMotion).toBe(true);});
 it('keeps OS default on unreadable storage and rejects malformed boolean values',()=>{window.matchMedia=()=>({matches:true});localStorage.setItem('haven.a11y.v2','broken');expect(read().reducedMotion).toBe(true);localStorage.setItem('haven.a11y.v2','{"reducedMotion":"false","highContrast":123,"ambientType":"whitenoise"}');expect(read()).toMatchObject({reducedMotion:true,highContrast:false,ambientType:'whitenoise'});});
});
