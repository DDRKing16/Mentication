import { describe, expect, it } from "vitest";
import { backupSessionCount, createBackup, parseBackup, restoreBackup } from "./backup.js";

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    get length() { return map.size; },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    dump: () => Object.fromEntries(map),
  };
}

describe("Backup", () => {
  it("round-trips Foundations drafts, migrated plans, reviews and preferences", () => {
    const data = {
      "mentication.foundations.weekly-plan.v1": '{"version":1,"domain":"sleep","action":0,"size":"tiny"}',
      "mentication.foundations.weekly-plan.v2": '{"version":2,"reviews":[{"id":"synthetic-review"}]}',
      "mentication.foundations.draft.v2": '{"version":2,"state":{"responses":{"overall":4}}}',
      "mentication.foundations.sound.v1": "off",
    };
    const restored = memoryStorage();
    restoreBackup(parseBackup(JSON.stringify(createBackup(memoryStorage(data)))), restored);
    expect(restored.dump()).toEqual(data);
  });
  it("saves the app's data but never the Plus status, reminders or other sites' data", () => {
    const store = memoryStorage({
      "mentation.sessions.v1": "[]",
      "dear2100-book-v1": "{}",
      "goodmap-journey-v3": "{}",
      "haven_onboarded": "1",
      "mentication.plus.v1": '{"active":true}',
      "mentation.reminders.v1": "{}",
      "something-else": "x",
    });
    const keys = Object.keys(createBackup(store).data).sort();
    expect(keys).toEqual(["dear2100-book-v1", "goodmap-journey-v3", "haven_onboarded", "mentation.sessions.v1"]);
  });

  it("rejects files that aren't backups, in plain English", () => {
    expect(() => parseBackup("hello")).toThrow("isn't a Mentication backup");
    expect(() => parseBackup('{"format":"other","data":{}}')).toThrow("isn't a Mentication backup");
    expect(() => parseBackup('{"format":"mentication-backup","version":2,"data":{}}')).toThrow("newer version");
  });

  it("restores without losing practices already on this phone", () => {
    const old = memoryStorage({
      "mentation.sessions.v1": JSON.stringify([{ id: "a", created_date: "2026-09-01T00:00:00Z" }]),
      "dear2100-book-v1": '{"pages":3}',
    });
    const backup = parseBackup(JSON.stringify(createBackup(old)));
    expect(backupSessionCount(backup)).toBe(1);

    const phone = memoryStorage({
      "mentation.sessions.v1": JSON.stringify([{ id: "b", created_date: "2026-09-20T00:00:00Z" }]),
      "mentication.plus.v1": '{"active":false}',
    });
    backup.data["mentication.plus.v1"] = '{"active":true}';
    restoreBackup(backup, phone);
    const sessions = JSON.parse(phone.getItem("mentation.sessions.v1"));
    expect(sessions.map((s) => s.id)).toEqual(["b", "a"]);
    expect(phone.getItem("dear2100-book-v1")).toBe('{"pages":3}');
    expect(phone.getItem("mentication.plus.v1")).toBe('{"active":false}');
  });
});

describe('backup failures and Journal coverage',()=>{
  it('includes device Journal entries',()=>{const store=memoryStorage({daybook:'[{"id":"note"}]'});const phone=memoryStorage();restoreBackup(createBackup(store),phone);expect(phone.getItem('daybook')).toBe(store.getItem('daybook'));});
  it('rejects array containers, missing versions and unreadable values',()=>{
    for(const data of [{format:'mentication-backup',version:1,data:[]},{format:'mentication-backup',data:{}},{format:'mentication-backup',version:1,data:{daybook:{}}}])expect(()=>parseBackup(JSON.stringify(data))).toThrow();
  });
  it('preserves unreadable current history before changing any key',()=>{
    const phone=memoryStorage({'mentation.sessions.v1':'broken',daybook:'old'});
    expect(()=>restoreBackup({format:'mentication-backup',version:1,data:{daybook:'new','mentation.sessions.v1':'[]'}},phone)).toThrow();expect(phone.getItem('daybook')).toBe('old');
  });
  it('rolls back earlier writes when a later key cannot be saved',()=>{
    const phone=memoryStorage({daybook:'old'}),set=phone.setItem;phone.setItem=(key,value)=>{if(key==='dear2100-book-v1')throw new Error('quota');set(key,value);};
    expect(()=>restoreBackup({format:'mentication-backup',version:1,data:{daybook:'new','dear2100-book-v1':'{}'}},phone)).toThrow('previous data');expect(phone.dump()).toEqual({daybook:'old'});
  });
});

describe('device-bound browser notification ownership', () => {
  const key = 'mentation.web-checkins.v1';
  const incoming = JSON.stringify({ token: 'synthetic-source-token', planId: 'source-plan', pendingCancel: true });
  it('exports ordinary history and authored notes without the cancellation token', () => {
    const storage = memoryStorage({ [key]: incoming, daybook: '[{"text":"synthetic note"}]', 'mentation.sessions.v1': '[]' });
    const backup = createBackup(storage);
    expect(backup.data).toEqual({ daybook: '[{"text":"synthetic note"}]', 'mentation.sessions.v1': '[]' });
    expect(JSON.stringify(backup)).not.toContain('synthetic-source-token');
    expect(storage.getItem(key)).toBe(incoming);
  });
  it.each([null, JSON.stringify({ token: 'synthetic-destination-token', pendingCancel: false }), JSON.stringify({ token: 'synthetic-destination-token', pendingCancel: true })])('ignores legacy ownership on restore and preserves destination %s', existing => {
    const storage = memoryStorage(existing === null ? {} : { [key]: existing });
    const legacy = { format: 'mentication-backup', version: 1, data: { [key]: incoming, daybook: '[{"text":"restored note"}]' } };
    expect(restoreBackup(legacy, storage)).toBe(1);
    expect(storage.getItem(key)).toBe(existing);
    expect(storage.getItem('daybook')).toBe(legacy.data.daybook);
  });
});


describe("full practice history backup and restore", () => {
  const sessionKey = "mentation.sessions.v1";
  const practices = (start, length) => Array.from({ length }, (_, index) => ({
    id: `practice-${start + index}`,
    created_date: new Date(Date.UTC(2024, 0, start + index + 1)).toISOString(),
  }));

  it("round-trips more than 500 practices without truncation", () => {
    const history = practices(0, 750);
    const backup = parseBackup(JSON.stringify(createBackup(memoryStorage({ [sessionKey]: JSON.stringify(history) }))));
    expect(backupSessionCount(backup)).toBe(750);
    const destination = memoryStorage();
    restoreBackup(backup, destination);
    expect(JSON.parse(destination.getItem(sessionKey))).toEqual([...history].reverse());
  });

  it("merges all unique practices, preserves backup precedence for duplicate IDs, and is repeatable", () => {
    const current = practices(0, 700);
    const incoming = practices(500, 700).map(record => ({ ...record, direction: "calm" }));
    const backup = createBackup(memoryStorage({ [sessionKey]: JSON.stringify([...incoming, incoming[0]]) }));
    const destination = memoryStorage({ [sessionKey]: JSON.stringify(current) });
    restoreBackup(backup, destination);
    const restored = JSON.parse(destination.getItem(sessionKey));
    expect(restored).toHaveLength(1200);
    expect(restored.map(record => record.id)).toEqual(practices(0, 1200).reverse().map(record => record.id));
    expect(restored.find(record => record.id === "practice-500").direction).toBe("calm");
    expect(restored.find(record => record.id === "practice-0")).toEqual(current[0]);
    restoreBackup(backup, destination);
    expect(JSON.parse(destination.getItem(sessionKey))).toEqual(restored);
  });

  it("does not silently discard a legacy record with an empty string ID", () => {
    const destination = memoryStorage({ [sessionKey]: JSON.stringify([{ id: "", direction: "calm" }]) });
    restoreBackup(createBackup(memoryStorage({ [sessionKey]: JSON.stringify(practices(0, 1)) })), destination);
    expect(JSON.parse(destination.getItem(sessionKey))).toContainEqual({ id: "", direction: "calm" });
  });

  it("keeps existing history and rolls back earlier values when a full-history merge exceeds quota", () => {
    const original = { daybook: "old notes", [sessionKey]: JSON.stringify(practices(0, 750)) };
    const destination = memoryStorage(original);
    const setItem = destination.setItem;
    destination.setItem = (key, value) => {
      if (key === sessionKey) throw new DOMException("Storage full", "QuotaExceededError");
      setItem(key, value);
    };
    const backup = createBackup(memoryStorage({ daybook: "restored notes", "mentation.preference": "new", [sessionKey]: JSON.stringify(practices(750, 750)) }));
    expect(() => restoreBackup(backup, destination)).toThrow("Your previous data has been kept");
    expect(destination.dump()).toEqual(original);
  });

  it("restores the entire old history when a later backup write exceeds quota", () => {
    const original = { [sessionKey]: JSON.stringify(practices(0, 750)), daybook: "old notes" };
    const destination = memoryStorage(original);
    const setItem = destination.setItem;
    destination.setItem = (key, value) => {
      if (key === "daybook") throw new DOMException("Storage full", "QuotaExceededError");
      setItem(key, value);
    };
    const backup = createBackup(memoryStorage({ [sessionKey]: JSON.stringify(practices(750, 750)), daybook: "new notes" }));
    expect(() => restoreBackup(backup, destination)).toThrow("Your previous data has been kept");
    expect(destination.dump()).toEqual(original);
  });
});

describe("device-bound uncertain reminder state", () => {
  const key = "mentation.reminders.uncertain.v1";
  it("does not export the source device's uncertain scheduling marker", () => {
    const source = memoryStorage({ [key]: "true", daybook: "notes" });
    expect(createBackup(source).data).toEqual({ daybook: "notes" });
    expect(source.getItem(key)).toBe("true");
  });
  it("does not import a legacy marker onto a different device", () => {
    const destination = memoryStorage();
    const backup = { format: "mentication-backup", version: 1, data: { [key]: "true", daybook: "notes" } };
    expect(restoreBackup(backup, destination)).toBe(1);
    expect(destination.dump()).toEqual({ daybook: "notes" });
  });
  it("does not let an incoming backup clear the destination device's marker", () => {
    const destination = memoryStorage({ [key]: "true" });
    const backup = { format: "mentication-backup", version: 1, data: { [key]: "false", daybook: "notes" } };
    expect(restoreBackup(backup, destination)).toBe(1);
    expect(destination.dump()).toEqual({ [key]: "true", daybook: "notes" });
  });
});
