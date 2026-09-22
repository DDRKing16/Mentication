import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CONSENT_KEY,
  LEGACY_PENDING_KEY,
  RECORDS_KEY,
  RETENTION_DAYS,
  SaveVerificationError,
  StorageUnavailableError,
  consumeNextStepHandoff,
  deleteAllRecords,
  deleteRecord,
  loadRecords,
  migrateLegacyPending,
  parkNote,
  readDraft,
  readLegacyPending,
  setOrganisation,
  stageNextStepHandoff,
  tryLoadRecords,
  updateNoteText,
  writeDraft,
} from "./storage.js";
import { savedWhenLabel, daysRemaining } from "./dates.js";
import { buildIcs, GENERIC_EVENT_TITLE } from "./ics.js";

class MemoryStorage {
  constructor() { this.values = new Map(); }
  get length() { return this.values.size; }
  key(index) { return [...this.values.keys()][index] ?? null; }
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

class BrokenStorage extends MemoryStorage {
  setItem() { throw new Error("QuotaExceededError"); }
}

const NIGHT = new Date("2026-09-13T22:30:00");

describe("Tomorrow Parking Lot storage", () => {
  beforeEach(() => {
    globalThis.window = { localStorage: new MemoryStorage(), sessionStorage: new MemoryStorage() };
  });
  afterEach(() => {
    delete globalThis.window;
  });

  it("parks a note, verifies the write and preserves exact wording and line breaks", () => {
    const text = "Reply to Sam\n\n  Book the dentist  ";
    const record = parkNote({ text }, NIGHT);
    expect(record.text).toBe("Reply to Sam\n\n  Book the dentist");
    expect(loadRecords(NIGHT)).toHaveLength(1);
    expect(record.expiresAt).toBe(new Date(NIGHT.getTime() + RETENTION_DAYS * 86_400_000).toISOString());
  });

  it("refuses blank or whitespace-only input", () => {
    expect(() => parkNote({ text: "   \n " }, NIGHT)).toThrow("Nothing to park yet.");
    expect(loadRecords(NIGHT)).toHaveLength(0);
  });

  it("keeps one saved-record identity across retries and reopen edits", () => {
    const first = parkNote({ id: "session-1", text: "Email the landlord" }, NIGHT);
    const second = parkNote({ id: "session-1", text: "Email the landlord about the heater" }, NIGHT);
    expect(second.id).toBe(first.id);
    expect(loadRecords(NIGHT)).toHaveLength(1);
    expect(loadRecords(NIGHT)[0].text).toBe("Email the landlord about the heater");
  });

  it("never overwrites an older note with a new one", () => {
    parkNote({ text: "Older" }, NIGHT);
    parkNote({ text: "Newer" }, new Date(NIGHT.getTime() + 60_000));
    const records = loadRecords(NIGHT);
    expect(records.map((r) => r.text)).toEqual(["Newer", "Older"]);
  });

  it("applies expiry on load without touching live records", () => {
    parkNote({ text: "Stale" }, new Date("2026-06-01T22:00:00"));
    parkNote({ text: "Live" }, NIGHT);
    const records = loadRecords(new Date("2026-09-14T09:00:00"));
    expect(records.map((r) => r.text)).toEqual(["Live"]);
  });

  it("surfaces storage failure instead of claiming success", () => {
    window.localStorage = new BrokenStorage();
    expect(() => parkNote({ text: "Anything" }, NIGHT)).toThrow(StorageUnavailableError);
    expect(tryLoadRecords().ok).toBe(false);
  });

  it("edits and organises in daytime without altering the original text", () => {
    const record = parkNote({ text: "Line one\nLine two" }, NIGHT);
    const organised = setOrganisation(record.id, [
      { id: "a", text: "Line one", group: "remember", done: false },
      { id: "b", text: "Line two", group: "bogus", done: false },
    ]);
    expect(organised.text).toBe("Line one\nLine two");
    expect(loadRecords()[0].organisation.items[1].group).toBe("can-wait");

    const edited = updateNoteText(record.id, "Line one, revised\nLine two");
    expect(edited.text).toBe("Line one, revised\nLine two");
    expect(() => updateNoteText(record.id, "   ")).toThrow("A note cannot be empty.");
    expect(() => updateNoteText("missing", "x")).toThrow("That note is no longer stored.");
  });

  it("deletes one record or everything belonging to this intervention only", () => {
    const a = parkNote({ text: "A" }, NIGHT);
    parkNote({ text: "B" }, NIGHT);
    window.localStorage.setItem("mentation.flagship.preferences.v1", "{}");
    deleteRecord(a.id);
    expect(loadRecords().map((r) => r.text)).toEqual(["B"]);
    deleteAllRecords();
    expect(window.localStorage.getItem(RECORDS_KEY)).toBeNull();
    expect(window.localStorage.getItem(CONSENT_KEY)).toBeNull();
    expect(window.localStorage.getItem("mentation.flagship.preferences.v1")).toBe("{}");
  });

  it("ignores malformed containers and invalid entries without deleting data", () => {
    window.localStorage.setItem(RECORDS_KEY, "{not json");
    expect(loadRecords()).toEqual([]);
    expect(window.localStorage.getItem(RECORDS_KEY)).toBe("{not json");
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify({ records: [{ id: "x" }, { id: "ok", text: "fine", createdAt: NIGHT.toISOString(), updatedAt: NIGHT.toISOString(), expiresAt: "2099-01-01T00:00:00.000Z" }] }));
    expect(loadRecords().map((r) => r.id)).toEqual(["ok"]);
  });

  it("keeps drafts in the session only and expires them", () => {
    writeDraft("half a thought", undefined, NIGHT);
    expect(readDraft(NIGHT).text).toBe("half a thought");
    expect(readDraft(new Date(NIGHT.getTime() + 25 * 3_600_000))).toBeNull();
    writeDraft("   ");
    expect(readDraft()).toBeNull();
  });

  it("migrates the legacy pending item only after the new record is verified", () => {
    window.localStorage.setItem(LEGACY_PENDING_KEY, JSON.stringify({ item: "Legacy item", createdAt: NIGHT.toISOString() }));
    expect(readLegacyPending().item).toBe("Legacy item");
    const record = migrateLegacyPending(NIGHT);
    expect(record.text).toBe("Legacy item");
    expect(window.localStorage.getItem(LEGACY_PENDING_KEY)).toBeNull();
    expect(migrateLegacyPending()).toBeNull();
  });

  it("hands one excerpt to Next Easiest Step exactly once", () => {
    expect(stageNextStepHandoff("  Book the dentist ")).toBe(true);
    expect(consumeNextStepHandoff()).toBe("Book the dentist");
    expect(consumeNextStepHandoff()).toBeNull();
  });

  it("exposes verification failures as a distinct error", () => {
    expect(new SaveVerificationError().name).toBe("SaveVerificationError");
  });
});

describe("Tomorrow Parking Lot dates and export", () => {
  it("uses 'Last night' only for a genuinely recent overnight record", () => {
    const saved = "2026-09-13T23:10:00";
    expect(savedWhenLabel(saved, new Date("2026-09-14T08:00:00"))).toBe("Last night");
    expect(savedWhenLabel(saved, new Date("2026-09-15T08:00:00"))).not.toBe("Last night");
    expect(savedWhenLabel("2026-09-14T13:00:00", new Date("2026-09-14T15:00:00"))).toMatch(/^Earlier today/);
  });

  it("counts remaining days", () => {
    expect(daysRemaining("2026-09-20T00:00:00.000Z", new Date("2026-09-17T12:00:00.000Z"))).toBe(3);
  });

  it("builds a generic calendar event and excludes note text unless opted in", () => {
    const start = new Date("2026-09-15T09:00:00.000Z");
    const plain = buildIcs({ start, uid: "u1", includeText: false, text: "private" });
    expect(plain).toContain(`SUMMARY:${GENERIC_EVENT_TITLE}`);
    expect(plain).not.toContain("private");
    const withText = buildIcs({ start, uid: "u1", includeText: true, text: "a, b; c\nd" });
    expect(withText).toContain("DESCRIPTION:a\\, b\\; c\\nd");
  });
});
