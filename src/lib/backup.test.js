import { afterEach, describe, expect, it, vi } from "vitest";
import { backupSessionCount, createBackup, parseBackup, previewBackup, readRestoreCopies, removeRestoreCopy, RESTORE_COPIES_KEY, restoreBackup, saveBackup } from "./backup.js";

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
    expect(()=>restoreBackup({format:'mentication-backup',version:1,data:{daybook:'new','mentation.preference':'added','dear2100-book-v1':'{}'}},phone)).toThrow('previous data');expect(phone.dump()).toEqual({daybook:'old'});
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

  it("merges all unique practices, preserves current fields for duplicate IDs, and is repeatable", () => {
    const current = practices(0, 700);
    const incoming = practices(500, 700).map(record => ({ ...record, direction: "calm" }));
    const backup = createBackup(memoryStorage({ [sessionKey]: JSON.stringify([...incoming, incoming[0]]) }));
    const destination = memoryStorage({ [sessionKey]: JSON.stringify(current) });
    restoreBackup(backup, destination);
    const restored = JSON.parse(destination.getItem(sessionKey));
    expect(restored).toHaveLength(1200);
    expect(restored.map(record => record.id)).toEqual(practices(0, 1200).reverse().map(record => record.id));
    expect(restored.find(record => record.id === "practice-500")).toEqual(current[500]);
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
    expect(() => restoreBackup(backup, destination, {policy: "use-backup"})).toThrow("Your previous data has been kept");
    const { [RESTORE_COPIES_KEY]: archive, ...rest } = destination.dump();
    expect(rest).toEqual(original);
    expect(archive).toBeTruthy();
    expect(readRestoreCopies(destination)[0].data).toEqual({daybook: original.daybook});
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


describe('restore conflict review and recoverable replacement', () => {
  const key = 'mentation.sessions.v1';
  const record = {id: 'same', created_date: '2026-01-01T00:00:00Z', updated_date: '2026-11-17T12:00:00Z', followup: {note: 'newer synthetic answer'}};
  const currentData = { [key]: JSON.stringify([record]), daybook: 'new synthetic note', 'mentication.foundations.weekly-plan.v2': 'new synthetic plan' };
  const incomingData = { [key]: JSON.stringify([{id: 'same', created_date: record.created_date}, {id: 'added', created_date: '2026-11-01T00:00:00Z'}]), daybook: 'old synthetic note', 'mentication.foundations.weekly-plan.v2': 'old synthetic plan' };
  const backup = () => createBackup(memoryStorage(incomingData));

  it('defaults to preserving current conflicting fields, notes and plans, while adding unique sessions', () => {
    const storage = memoryStorage(currentData), preview = previewBackup(backup(), storage);
    expect(preview).toMatchObject({sessionCount: 2, addedSessions: 1, sessionConflicts: 1, dataConflicts: 2, addedDataGroups: 0});
    expect(restoreBackup(backup(), storage, {preview})).toBe(1);
    expect(JSON.parse(storage.getItem(key)).find(item => item.id === 'same')).toEqual(record);
    expect(storage.getItem('daybook')).toBe(currentData.daybook);
    expect(storage.getItem('mentication.foundations.weekly-plan.v2')).toBe(currentData['mentication.foundations.weekly-plan.v2']);
    expect(readRestoreCopies(storage)).toEqual([]);
    const after = storage.dump();
    expect(restoreBackup(backup(), storage)).toBe(0);
    expect(storage.dump()).toEqual(after);
  });

  it('uses backup versions only explicitly and preserves an exportable affected-data copy first', () => {
    const storage = memoryStorage(currentData), preview = previewBackup(backup(), storage);
    expect(restoreBackup(backup(), storage, {policy: 'use-backup', preview})).toBe(3);
    expect(storage.getItem('daybook')).toBe(incomingData.daybook);
    expect(JSON.parse(storage.getItem(key)).find(item => item.id === 'same').followup).toBeUndefined();
    const copies = readRestoreCopies(storage);
    expect(copies).toHaveLength(1);
    expect(copies[0].data).toEqual(currentData);
    const fresh = memoryStorage();
    restoreBackup(parseBackup(JSON.stringify(copies[0])), fresh);
    expect(fresh.dump()).toEqual(currentData);
    const after = storage.dump();
    expect(restoreBackup(backup(), storage, {policy: 'use-backup'})).toBe(0);
    expect(storage.dump()).toEqual(after);
  });

  it('does not infer precedence from newer, missing or equal timestamps', () => {
    for (const updated_date of [undefined, record.updated_date, '2099-01-01T00:00:00Z']) {
      const storage = memoryStorage(currentData);
      const file = createBackup(memoryStorage({[key]: JSON.stringify([{...record, updated_date, followup: {note: 'incoming'}}])}));
      restoreBackup(file, storage);
      expect(JSON.parse(storage.getItem(key))).toEqual([record]);
    }
  });

  it('rejects stale review or a different file without any writes', () => {
    const storage = memoryStorage(currentData), file = backup(), preview = previewBackup(file, storage);
    storage.setItem('daybook', 'edited after review');
    const before = storage.dump();
    expect(() => restoreBackup(file, storage, {policy: 'use-backup', preview})).toThrow('changed after the review');
    expect(storage.dump()).toEqual(before);
    const fresh = previewBackup(file, storage);
    file.data.daybook = 'different incoming file';
    try { restoreBackup(file, storage, {preview: fresh}); throw Error('should reject'); }
    catch (error) { expect(error.code).toBe('RESTORE_REVIEW_CHANGED'); }
    expect(storage.dump()).toEqual(before);
  });

  it('retains every earlier recovery copy and excludes the archive in both directions', () => {
    const storage = memoryStorage({daybook: 'first'});
    restoreBackup(createBackup(memoryStorage({daybook: 'second'})), storage, {policy: 'use-backup'});
    restoreBackup(createBackup(memoryStorage({daybook: 'third'})), storage, {policy: 'use-backup'});
    expect(readRestoreCopies(storage).map(copy => copy.data.daybook)).toEqual(['first', 'second']);
    expect(createBackup(storage).data).toEqual({daybook: 'third'});
    const archive = storage.getItem(RESTORE_COPIES_KEY);
    restoreBackup({format: 'mentication-backup', version: 1, data: {[RESTORE_COPIES_KEY]: 'forged', daybook: 'fourth'}}, storage);
    expect(storage.getItem(RESTORE_COPIES_KEY)).toBe(archive);
    expect(storage.getItem('daybook')).toBe('third');
  });

  it.each(['current', 'incoming'])('rejects differing duplicate IDs in %s history before mutation', side => {
    const storage = memoryStorage(currentData), file = backup();
    const ambiguous = JSON.stringify([{id: '', note: 'one'}, {id: '', note: 'two'}]);
    if (side === 'current') storage.setItem(key, ambiguous); else file.data[key] = ambiguous;
    const before = storage.dump();
    expect(() => restoreBackup(file, storage, {policy: 'use-backup'})).toThrow('different records with the same ID');
    expect(storage.dump()).toEqual(before);
  });

  it('accepts identical legacy duplicates and equivalent field order without inventing conflicts', () => {
    const storage = memoryStorage({[key]: JSON.stringify([{id: '', value: 1}])});
    const file = createBackup(memoryStorage({[key]: JSON.stringify([{value: 1, id: ''}, {id: '', value: 1}])}));
    expect(previewBackup(file, storage)).toMatchObject({sessionCount: 1, addedSessions: 0, sessionConflicts: 0});
    expect(restoreBackup(file, storage)).toBe(0);
  });

  it('blocks replacement if existing recovery copies are unreadable', () => {
    const storage = memoryStorage({...currentData, [RESTORE_COPIES_KEY]: 'broken'}), before = storage.dump();
    expect(() => restoreBackup(backup(), storage, {policy: 'use-backup'})).toThrow('copies could not be read');
    expect(storage.dump()).toEqual(before);
  });

  it.each(['quota', 'unverified'])('does not modify user keys when recovery archive save is %s', mode => {
    const storage = memoryStorage(currentData), set = storage.setItem, get = storage.getItem;
    let verify = false;
    storage.setItem = (name, value) => {
      if (name === RESTORE_COPIES_KEY && mode === 'quota') throw Error('quota');
      set(name, value);
      if (name === RESTORE_COPIES_KEY) verify = true;
    };
    storage.getItem = name => {
      if (name === RESTORE_COPIES_KEY && verify) { verify = false; throw Error('verification read failed'); }
      return get(name);
    };
    expect(() => restoreBackup(backup(), storage, {policy: 'use-backup'})).toThrow('before-restore copy could not be saved');
    expect(storage.dump()).toEqual(currentData);
  });

  it('retains a recovery copy after later quota failure and reuses it on a successful retry', () => {
    const storage = memoryStorage(currentData), set = storage.setItem;
    storage.setItem = (name, value) => { if (name === 'daybook') throw Error('quota'); set(name, value); };
    expect(() => restoreBackup(backup(), storage, {policy: 'use-backup'})).toThrow('previous data has been kept');
    expect(readRestoreCopies(storage)).toHaveLength(1);
    expect(readRestoreCopies(storage)[0].data).toEqual(currentData);
    storage.setItem = set;
    restoreBackup(backup(), storage, {policy: 'use-backup'});
    expect(readRestoreCopies(storage)).toHaveLength(1);
  });

  it('reports incomplete rollback truthfully and keeps the pre-replacement recovery file', () => {
    const storage = memoryStorage(currentData), set = storage.setItem;
    storage.setItem = (name, value) => {
      if (name === 'daybook' || name === key && value === currentData[key]) throw Error('quota');
      set(name, value);
    };
    try { restoreBackup(backup(), storage, {policy: 'use-backup'}); throw Error('should reject'); }
    catch (error) {
      expect(error.code).toBe('RESTORE_UNCERTAIN');
      expect(error.message).toContain('Not every change could be confirmed or rolled back');
    }
    expect(storage.getItem(key)).not.toBe(currentData[key]);
    expect(readRestoreCopies(storage)[0].data).toEqual(currentData);
  });

  it('does not roll back over an observed concurrent edit to a key it wrote', () => {
    const storage = memoryStorage(currentData), set = storage.setItem;
    storage.setItem = (name, value) => {
      if (name === 'daybook') { set(key, 'concurrent edit'); throw Error('quota'); }
      set(name, value);
    };
    expect(() => restoreBackup(backup(), storage, {policy: 'use-backup'})).toThrow('Not every change could be confirmed or rolled back');
    expect(storage.getItem(key)).toBe('concurrent edit');
    expect(readRestoreCopies(storage)[0].data).toEqual(currentData);
  });
});


describe('observed restore races and export handoff', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
  it('rejects a recovery-copy reuse if the archive changed after it was inspected', () => {
    const storage = memoryStorage({daybook: 'before'});
    const file = createBackup(memoryStorage({daybook: 'after'}));
    restoreBackup(file, storage, {policy: 'use-backup'});
    storage.setItem('daybook', 'before');
    const get = storage.getItem;
    let reads = 0;
    storage.getItem = name => {
      if (name === RESTORE_COPIES_KEY && ++reads === 3) storage.removeItem(name);
      return get(name);
    };
    expect(() => restoreBackup(file, storage, {policy: 'use-backup'})).toThrow('changed after the review');
    expect(storage.getItem('daybook')).toBe('before');
  });

  it('never rolls archive verification failure back over another observed archive edit', () => {
    const storage = memoryStorage({daybook: 'before'}), set = storage.setItem;
    const changed = JSON.stringify({version: 1, copies: [createBackup(memoryStorage({daybook: 'other tab'}))]});
    storage.setItem = (name, value) => set(name, name === RESTORE_COPIES_KEY ? changed : value);
    expect(() => restoreBackup(createBackup(memoryStorage({daybook: 'after'})), storage, {policy: 'use-backup'})).toThrow('could not be confirmed or rolled back');
    expect(storage.getItem(RESTORE_COPIES_KEY)).toBe(changed);
    expect(storage.getItem('daybook')).toBe('before');
  });

  it('detects a newer user value immediately before mutation and preserves it', () => {
    const storage = memoryStorage({daybook: 'before'}), set = storage.setItem;
    storage.setItem = (name, value) => {
      set(name, value);
      if (name === RESTORE_COPIES_KEY) set('daybook', 'other tab newer note');
    };
    expect(() => restoreBackup(createBackup(memoryStorage({daybook: 'after'})), storage, {policy: 'use-backup'})).toThrow('changed after the review');
    expect(storage.getItem('daybook')).toBe('other tab newer note');
    expect(readRestoreCopies(storage)[0].data.daybook).toBe('before');
  });

  it('reports an unreadable archive in plain English', () => {
    expect(() => readRestoreCopies({getItem: () => {throw Error('SecurityError');}})).toThrow('Before-restore copies could not be read');
  });

  function exportEnvironment(share) {
    vi.useFakeTimers();
    const link = {click: vi.fn(), remove: vi.fn()};
    vi.stubGlobal('document', {body: {appendChild: vi.fn()}, createElement: () => link});
    vi.stubGlobal('URL', {createObjectURL: vi.fn(() => 'blob:synthetic'), revokeObjectURL: vi.fn()});
    vi.stubGlobal('navigator', {canShare: () => Boolean(share), share});
    return link;
  }
  const file = () => ({format: 'mentication-backup', version: 1, createdAt: '2026-11-17T00:00:00Z', data: {
    daybook: 'synthetic note', 'mentation.web-checkins.v1': 'synthetic ownership', [RESTORE_COPIES_KEY]: 'not exported',
  }});

  it('reports share handoff and exports the selected copy without device ownership or archives', async () => {
    const share = vi.fn().mockResolvedValue(undefined), link = exportEnvironment(share);
    expect(await saveBackup(file(), 'Before restore.json')).toBe('shared');
    const sent = share.mock.calls[0][0].files[0];
    expect(sent.name).toBe('Before restore.json');
    expect(JSON.parse(await sent.text()).data).toEqual({daybook: 'synthetic note'});
    expect(link.click).not.toHaveBeenCalled();
  });

  it('reports cancellation without starting a fallback download', async () => {
    const link = exportEnvironment(vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')));
    expect(await saveBackup(file())).toBe('cancelled');
    expect(link.click).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it.each([undefined, () => Promise.reject(Error('Share unavailable'))])('reports only a requested download and cleans up its URL', async share => {
    const link = exportEnvironment(share);
    expect(await saveBackup(file())).toBe('downloaded');
    expect(link.click).toHaveBeenCalledOnce();
    expect(link.remove).toHaveBeenCalledOnce();
    await vi.runAllTimersAsync();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic');
  });

  it('does not report success when download dispatch throws, and still cleans up', async () => {
    const link = exportEnvironment();
    link.click.mockImplementation(() => {throw Error('Download blocked');});
    await expect(saveBackup(file())).rejects.toThrow('Download blocked');
    expect(link.remove).toHaveBeenCalledOnce();
    await vi.runAllTimersAsync();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic');
  });
});


describe('explicit recovery-copy removal', () => {
  const file = value => createBackup(memoryStorage({daybook: value}));
  function withCopies() {
    const storage = memoryStorage({daybook: 'first'});
    restoreBackup(file('second'), storage, {policy: 'use-backup'});
    restoreBackup(file('third'), storage, {policy: 'use-backup'});
    return storage;
  }
  it('removes only the reviewed copy, then removes the archive key when empty', () => {
    const storage = withCopies(), copies = readRestoreCopies(storage);
    expect(removeRestoreCopy(0, copies[0], storage)).toBe(1);
    expect(readRestoreCopies(storage)).toEqual([copies[1]]);
    expect(storage.getItem('daybook')).toBe('third');
    expect(removeRestoreCopy(0, copies[1], storage)).toBe(0);
    expect(storage.getItem(RESTORE_COPIES_KEY)).toBeNull();
  });
  it('rejects a stale index or changed reviewed copy without removing anything', () => {
    const storage = withCopies(), copies = readRestoreCopies(storage);
    removeRestoreCopy(0, copies[0], storage);
    const before = storage.dump();
    try { removeRestoreCopy(0, copies[0], storage); throw Error('should reject'); }
    catch (error) { expect(error.code).toBe('RESTORE_COPY_CHANGED'); }
    expect(() => removeRestoreCopy(-1, copies[1], storage)).toThrow('copies changed');
    expect(storage.dump()).toEqual(before);
  });
  it('keeps the original archive if removing a copy exceeds storage quota', () => {
    const storage = withCopies(), before = storage.dump(), copies = readRestoreCopies(storage);
    storage.setItem = () => {throw Error('quota');};
    expect(() => removeRestoreCopy(0, copies[0], storage)).toThrow('Existing copies have been kept');
    expect(storage.dump()).toEqual(before);
  });
  it('restores a last-copy deletion when verification is temporarily unavailable', () => {
    const storage = memoryStorage({daybook: 'first'});
    restoreBackup(file('second'), storage, {policy: 'use-backup'});
    const before = storage.dump(), copy = readRestoreCopies(storage)[0], remove = storage.removeItem, get = storage.getItem;
    let failed = false;
    storage.removeItem = name => { remove(name); failed = true; };
    storage.getItem = name => { if (name === RESTORE_COPIES_KEY && failed) {failed = false; throw Error('read failure');} return get(name); };
    expect(() => removeRestoreCopy(0, copy, storage)).toThrow('Existing copies have been kept');
    expect(storage.dump()).toEqual(before);
  });
  it('does not overwrite a concurrent archive edit on removal verification failure', () => {
    const storage = withCopies(), copies = readRestoreCopies(storage), set = storage.setItem;
    const changed = JSON.stringify({version: 1, copies: [file('another tab')]});
    storage.setItem = (name, value) => set(name, name === RESTORE_COPIES_KEY ? changed : value);
    try { removeRestoreCopy(0, copies[0], storage); throw Error('should reject'); }
    catch (error) { expect(error.code).toBe('RESTORE_COPY_UNCERTAIN'); }
    expect(storage.getItem(RESTORE_COPIES_KEY)).toBe(changed);
    expect(storage.getItem('daybook')).toBe('third');
  });
  it('copies only replaced groups, not unrelated additive history', () => {
    const key = 'mentation.sessions.v1';
    const storage = memoryStorage({daybook: 'before', [key]: JSON.stringify([{id: 'current'}])});
    const incoming = createBackup(memoryStorage({daybook: 'after', [key]: JSON.stringify([{id: 'new'}])}));
    restoreBackup(incoming, storage, {policy: 'use-backup'});
    expect(readRestoreCopies(storage)[0].data).toEqual({daybook: 'before'});
    expect(JSON.parse(storage.getItem(key))).toHaveLength(2);
  });
});
