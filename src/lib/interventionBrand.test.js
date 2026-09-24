import { describe, expect, it } from "vitest";
import {
  BRAND_CORAL,
  INTERVENTION_ATMOSPHERE,
  getBrandAtmosphere,
  getBrandCoral,
  getBrandInk,
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

  it("uses the deeper coral only on the light atmosphere", () => {
    expect(getBrandCoral("grounding54321V2")).toBe(BRAND_CORAL.onLight);
    ACTIVE_IDS.filter((id) => id !== "grounding54321V2").forEach((id) => {
      expect(getBrandCoral(id), id).toBe(BRAND_CORAL.onDark);
    });
  });

  it("uses dark ink on the light atmosphere and cream ink on dark ones", () => {
    expect(getBrandInk("grounding54321V2")).not.toBe(getBrandInk("boxV2"));
  });

  it("falls back to Mentication navy for unknown ids", () => {
    expect(getBrandAtmosphere("not-a-real-id").tone).toBe("dark");
    expect(getBrandAtmosphere(undefined).background).toBe("#0A1F3D");
  });
});
