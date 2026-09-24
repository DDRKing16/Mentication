import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Phase 6 of the brand thread: one glass recipe (border, background, blur,
// shadow) for every intervention's Back/Home button, header icon buttons and
// bottom control dock, so they read as the same chrome no matter which
// world they float over. See docs/BRAND_THREAD.md.
describe("brand chrome (shared glass recipe)", () => {
  const css = readFileSync("src/index.css", "utf8");

  it("defines one glass recipe for chrome buttons and docks, with a light-world variant", () => {
    expect(css).toMatch(/\.brand-chrome-btn[\s\S]{0,40}\.brand-chrome-dock\s*\{/);
    expect(css).toMatch(/\.brand-chrome-btn\[data-tone="light"\]/);
    expect(css).toMatch(/\.brand-chrome-dock\[data-tone="light"\]/);
  });

  it("the shared shell and the Back/Home nav both use the shared glass classes instead of their own one-off values", () => {
    const shell = readFileSync("src/components/InterventionControlShell.jsx", "utf8");
    const nav = readFileSync("src/components/brand/InterventionNav.jsx", "utf8");

    expect(shell).toMatch(/brand-chrome-btn/);
    expect(shell).toMatch(/brand-chrome-dock/);
    expect(nav).toMatch(/brand-chrome-btn/);

    // No leftover one-off glass values for the buttons/dock this test covers.
    expect(shell).not.toMatch(/border-white\/15 bg-black\/20/);
    expect(shell).not.toMatch(/border-white\/10 bg-black\/45/);
    expect(nav).not.toMatch(/border-white\/20 bg-black\/35/);
    expect(nav).not.toMatch(/border-black\/15 bg-white\/70/);
  });

  it("carries a light-tone attribute for the Back/Home nav so cream worlds get ink-on-cream chrome", () => {
    const nav = readFileSync("src/components/brand/InterventionNav.jsx", "utf8");
    expect(nav).toMatch(/data-tone=\{chromeTone\}/);
  });
});
