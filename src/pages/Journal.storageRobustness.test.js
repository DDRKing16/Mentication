import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// The Journal saves and deletes daybook entries by writing the whole
// daybook to localStorage. That write had no try/catch anywhere -- private
// browsing or a full storage quota throws synchronously, which would have
// crashed saving or deleting an entry mid-write. The restore on open also
// trusted a stored value to already be an array, so a corrupted or
// hand-edited "daybook" entry could crash the Journal the moment it opened.
describe("Journal's saved daybook fails safely", () => {
  const src = readFileSync("src/pages/Journal.jsx", "utf8");

  it("wraps the save-entry write in try/catch", () => {
    expect(src).toMatch(
      /setDaybook\(updatedDaybook\);\s*try \{ localStorage\.setItem\("daybook", JSON\.stringify\(updatedDaybook\)\); \} catch/
    );
  });

  it("wraps the delete-entry write in try/catch", () => {
    expect(src).toMatch(
      /setDaybook\(updated\);\s*try \{ localStorage\.setItem\("daybook", JSON\.stringify\(updated\)\); \} catch/
    );
  });

  it("only restores the saved daybook when it parses to an array", () => {
    expect(src).toMatch(/if \(Array\.isArray\(parsed\)\) setDaybook\(parsed\);/);
  });
});
