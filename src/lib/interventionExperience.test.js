import { describe, expect, it } from "vitest";
import { getInterventionSpotlight } from "./interventionExperience";

describe("getInterventionSpotlight", () => {
  it("returns premium spotlight copy for the remaining signature guided core interventions", () => {
    expect(getInterventionSpotlight({ id: "boxV2" })?.eyebrow).toBe("SIGNATURE BREATH");
    expect(getInterventionSpotlight({ id: "grounding54321V2" })?.eyebrow).toBe("SIGNATURE GROUNDING");
    expect(getInterventionSpotlight({ id: "progressive-muscle-relaxation-v2" })?.eyebrow).toBe("SIGNATURE BODY RESET");
  });

  it("returns null for interventions without spotlight copy", () => {
    expect(getInterventionSpotlight({ id: "factCheck" })).toBeNull();
  });
});
