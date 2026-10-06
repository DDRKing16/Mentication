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
