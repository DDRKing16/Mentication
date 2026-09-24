import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  BRAND_COLOURWAYS,
  INTERVENTION_ATMOSPHERE,
  INTERVENTION_COLOURWAY,
  getBrandAtmosphere,
  getBrandColourway,
  getBrandCoral,
  getBrandInk,
  getBrandLogoParts,
} from "./interventionBrand";

const ACTIVE_IDS = [
  "boxV2",
  "progressive-muscle-relaxation-v2",
  "factCheck",
  "urgeSurf",
  "happyBump",
  "changeScene",
  "grounding54321V2",
  "vectorShift",
  "nextAction",
  "signalLock",
  "tomorrowParking",
  "nightChannel",
];

describe("intervention brand thread", () => {
  it("gives every active intervention its own colour world", () => {
    ACTIVE_IDS.forEach((id) => {
      const atmosphere = INTERVENTION_ATMOSPHERE[id];
      expect(atmosphere, id).toBeTruthy();
      expect(atmosphere.background).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(["dark", "light"]).toContain(atmosphere.tone);
    });
  });

  it("keeps each colour world distinct so the interventions do not blur together", () => {
    const backgrounds = ACTIVE_IDS.map((id) => INTERVENTION_ATMOSPHERE[id].background);
    expect(new Set(backgrounds).size).toBe(backgrounds.length);
  });

  it("uses dark ink on the light atmosphere and cream ink on dark ones", () => {
    expect(getBrandInk("grounding54321V2")).not.toBe(getBrandInk("boxV2"));
  });

  it("gives every intervention its own colourway of the real logo", () => {
    const ids = ACTIVE_IDS.map((id) => INTERVENTION_COLOURWAY[id]);
    ids.forEach((cid, i) => expect(BRAND_COLOURWAYS[cid], ACTIVE_IDS[i]).toBeTruthy());
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("defines all four inks of every colourway as real hex colours", () => {
    Object.entries(BRAND_COLOURWAYS).forEach(([cid, colours]) => {
      ["wordmark", "figure", "swash", "arch"].forEach((role) => {
        expect(colours[role], `${cid}.${role}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  it("uses each intervention's swash colour for its line colour", () => {
    ACTIVE_IDS.forEach((id) => expect(getBrandCoral(id), id).toBe(getBrandColourway(id).swash));
  });

  it("has the real, recoloured artwork on disk for every colourway", () => {
    Object.keys(BRAND_COLOURWAYS).forEach((cid) => {
      ["doorway", "wordmark", "swash"].forEach((part) => {
        expect(existsSync(`public/media/brand/logo/${cid}/${part}.png`), `${cid}/${part}`).toBe(true);
      });
    });
  });

  it("puts the three logo parts back where they sit on the original artwork", () => {
    const parts = getBrandLogoParts("boxV2");
    expect(parts.aspect).toBeGreaterThan(1);
    ["doorway", "wordmark", "swash"].forEach((name) => {
      const p = parts[name];
      expect(p.src).toContain("/media/brand/logo/sky-peach/");
      expect(p.left + p.width).toBeLessThanOrEqual(100.5);
      expect(p.top + p.height).toBeLessThanOrEqual(100.5);
    });
    // the doorway sits above and to the right of the wordmark
    expect(parts.doorway.top).toBeLessThan(parts.wordmark.top);
    expect(parts.doorway.left).toBeGreaterThan(parts.wordmark.left);
  });

  it("reveals the logo with opacity/transform only, never clip-path (some web views drop it)", () => {
    const src = readFileSync("src/components/brand/BrandLockup.jsx", "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "") // ignore comments; only the code matters
      .replace(/\/\/.*$/gm, "");
    expect(src).not.toMatch(/clipPath|clip-path|maskImage|mask-image/);
  });

  it("falls back to Mentication navy for unknown ids", () => {
    expect(getBrandAtmosphere("not-a-real-id").tone).toBe("dark");
    expect(getBrandAtmosphere(undefined).background).toBe("#0A1F3D");
  });
});
