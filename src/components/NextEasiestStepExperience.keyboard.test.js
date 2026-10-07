import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Native task buttons and form submit support keyboard activation.
describe("Next Easiest Step's primary controls are keyboard-reachable", () => {
  const src = readFileSync("src/components/NextEasiestStepExperience.jsx", "utf8");

  it("task choices use native buttons and custom tasks use form submit", () => {
    expect(src).toContain("<button onClick={() => handleSelectCategoryTask('cleaning'");
    expect(src).toContain('onSubmit={event => {event.preventDefault();handleCustomTaskGo();}}');
  });

  it('the review task return uses a native button with keyboard activation', () => {
    const review = readFileSync("src/components/next-step/NextStepPractice.jsx", "utf8");
    expect(review).toMatch(/<button type="button"[^>]+onClick=\{onNewTask\}>Back to tasks<\/button>/);
  });
});
