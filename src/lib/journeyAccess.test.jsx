import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("VITE_FOUNDER_PREVIEW", "");
  vi.stubGlobal("window", { location: { hostname: "mentication-preview.onrender.com" } });
});

describe("journey access and subscription status stay separate", () => {
  it.each([null, '{"active":false}', '{"active":true,"expiresAt":"2000-01-01"}', 'invalid', '{"active":true,"expiresAt":"2099-01-01"}'])("opens the gate with subscription cache %s", async (cache) => {
    const setItem = vi.fn();
    vi.stubGlobal("localStorage", { getItem: () => cache, setItem });
    const { usePlus, getPlus } = await import("./subscription");
    const { default: PlusGate } = await import("../components/plus/PlusGate");
    const { MemoryRouter } = await import("react-router-dom");
    let observed;
    function Probe() { observed = usePlus(); return <PlusGate><p>Journey content</p></PlusGate>; }
    expect(renderToStaticMarkup(<MemoryRouter><Probe /></MemoryRouter>)).toContain("Journey content");
    expect(observed.hasAccess).toBe(true);
    expect(observed.active).toBe(cache?.includes("2099") || false);
    expect(getPlus().active).toBe(observed.active);
    expect(setItem).not.toHaveBeenCalled();
  });
});
