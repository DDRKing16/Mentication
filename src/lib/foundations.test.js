import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const context = vm.createContext({});
for (const file of ['checkpoints.js', 'storage.js']) {
  vm.runInContext(readFileSync(new URL(`../../public/interventions/foundations/${file}`, import.meta.url), 'utf8'), context);
}
const ids = ['sleep', 'nutrition', 'movement', 'recovery', 'structure', 'activation', 'support', 'stability'];
const domains = ids.map(id => ({ id, actions: [[], [], [], []] }));
const items = [{ id: 'overall', context: 'The whole picture' }, ...ids.flatMap(id => [0, 1].map(n => ({ id: `${id}-${n}`, domainId: id, context: `${id} question ${n + 1}` })))];
const reflection = options => context.FoundationsCheckpoints.describe({ items, responses: {}, ...options });
const memory = () => {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
};
const storeFor = storage => context.FoundationsStorage.create(storage, domains, items);
const legacy = { version: 1, domain: 'sleep', action: 0, size: 'regular', savedAt: '2026-10-01T08:00:00Z' };

describe('Foundations answer-grounded checkpoints', () => {
  it('awards a piece only for each uniquely confirmed, valid answer', () => {
    const responses = { overall: 3, 'sleep-0': 1, 'sleep-1': 5, 'movement-0': 0, 'support-0': '4', unknown: 5 };
    const first = reflection({ responses, lastId: 'sleep-1' });
    expect(first.count).toBe(3);
    expect(first.answered.filter(Boolean)).toHaveLength(3);
    expect(reflection({ responses, lastId: 'sleep-1', revised: true }).count).toBe(3);
  });
  it('gives a first-answer reflection without pretending to know the other answer', () => {
    const result = reflection({ responses: { 'sleep-0': 1 }, lastId: 'sleep-0' });
    expect(result.title).toBe('One piece revealed');
    expect(result.copy).toContain('sleep timing');
    expect(result.copy).toContain('mostly working against you');
    expect(result.copy).not.toContain('higher than');
    expect(result.next).toBe('Next: sleep question 2.');
  });
  it('compares explicit paired answers, including ties, without causal or improvement claims', () => {
    expect(reflection({ responses: { 'sleep-0': 1, 'sleep-1': 5 }, lastId: 'sleep-1' }).copy).toContain('restfulness higher than sleep timing');
    expect(reflection({ responses: { 'sleep-0': 5, 'sleep-1': 1 }, lastId: 'sleep-1', revised: true }).title).toBe('Connection updated');
    expect(reflection({ responses: { 'sleep-0': 3, 'sleep-1': 3 }, lastId: 'sleep-1' }).copy).toContain('alike: mixed');
    for (const id of ids) expect(reflection({ responses: { [`${id}-0`]: 2, [`${id}-1`]: 4 }, lastId: `${id}-1` }).copy).not.toContain('undefined');
  });
  it('does not award missing answers and anticipates only an actual next stage', () => {
    expect(reflection({ responses: { overall: null }, lastId: 'overall' }).count).toBe(0);
    const complete = reflection({ responses: Object.fromEntries(items.map(item => [item.id, 3])), lastId: 'stability-1' });
    expect(complete.count).toBe(17);
    expect(complete.next).toBe('Next: bring your answers together and choose a focus.');
  });
});

describe('Foundations device storage', () => {
  it('reads an existing v1 plan without deleting it or inventing answers or outcomes', () => {
    const storage = memory(), store = storeFor(storage), raw = JSON.stringify(legacy);
    storage.setItem(store.keys.legacy, raw);
    expect(store.readPlan().value).toMatchObject({ version: 2, domain: 'sleep', action: 0, size: 'regular', savedAt: legacy.savedAt, reviews: [] });
    expect(storage.getItem(store.keys.legacy)).toBe(raw);
    expect(store.readDraft().value).toBeNull();
    expect(storage.getItem(store.keys.plan)).toBeNull();
  });
  it('round-trips the exact position, pending unconfirmed choice, answers and review draft', () => {
    const store = storeFor(memory());
    expect(store.writeDraft({ version: 2, screen: 'scan', checkpointId: 'sleep-1', state: { q: 3, responses: { overall: 4, 'sleep-0': 1, 'sleep-1': 5 }, pendingResponse: 2, priority: 'sleep', selected: 1, dose: { id: 'tiny' }, cue: 'After a meal', time: '14:30', review: { tried: 1 }, history: ['intro'] } })).toBe(true);
    expect(store.readDraft().value).toMatchObject({ screen: 'scan', checkpointId: 'sleep-1', state: { q: 3, responses: { overall: 4, 'sleep-0': 1, 'sleep-1': 5 }, pendingResponse: 2, dose: { id: 'tiny' }, cue: 'After a meal', time: '14:30', review: { tried: 1 } } });
    expect(store.readDraft().value.state.responses['nutrition-0']).toBeUndefined();
  });
  it('restores each split planning or review screen without changing recorded answers', () => {
    const store = storeFor(memory());
    for (const screen of ['cue', 'time', 'review', 'review-effort', 'review-help']) {
      expect(store.writeDraft({ version: 2, screen, state: { priority: 'sleep', selected: 0, dose: { id: 'tiny' }, cue: 'After a meal', time: '19:30', review: { tried: 3, effort: 2 }, history: ['plan', 'cue', 'time', 'review', 'review-effort'] } })).toBe(true);
      expect(store.readDraft().value).toMatchObject({ screen, state: { cue: 'After a meal', time: '19:30', review: { tried: 3, effort: 2 }, history: ['plan', 'cue', 'time', 'review', 'review-effort'] } });
      expect(store.readDraft().value.state.review.help).toBeUndefined();
    }
  });
  it('retains a review with the actual plan that was tried when its new size changes', () => {
    const store = storeFor(memory());
    const plan = { ...store.plan(legacy), size: 'tiny', revision: 2, reviews: [{ id: 'review-one', ratings: { tried: 4, effort: 1, help: 4 }, plan: { domain: 'sleep', action: 0, size: 'regular' }, decision: 'tiny' }] };
    expect(store.writePlan(plan)).toBe(true);
    expect(store.readPlan().value).toMatchObject({ size: 'tiny', revision: 2, reviews: [{ id: 'review-one', plan: { size: 'regular' }, ratings: { effort: 1 }, decision: 'tiny' }] });
    expect(store.completeReview({ tried: 1 })).toBe(true);
    expect(store.completeReview({ tried: 4, effort: 2 })).toBe(false);
  });
  it('never overwrites corrupt or newer records and never reports a silent failed write as saved', () => {
    const storage = memory(), store = storeFor(storage);
    for (const raw of ['{broken', '{"version":99,"state":{"responses":{"overall":4}}}']) {
      storage.setItem(store.keys.draft, raw);
      expect(store.writeDraft({ version: 2, state: { q: 0 } })).toBe(false);
      expect(storage.getItem(store.keys.draft)).toBe(raw);
    }
    expect(storeFor({ getItem: () => null, setItem() {} }).writePlan(legacy)).toBe(false);
    expect(storeFor({ getItem() { throw Error('Denied'); }, setItem() {} }).readPlan().error).toBeTruthy();
    expect(storeFor({ getItem: () => null, setItem() { throw Error('Full'); } }).writeDraft({ version: 2, state: {} })).toBe(false);
  });
  it('rejects invalid choices and ratings instead of fabricating neutral scores', () => {
    const store = storeFor(memory());
    expect(store.plan({ ...legacy, domain: 'unknown' })).toBeNull();
    expect(store.plan({ ...legacy, action: 10 })).toBeNull();
    expect(store.draft({ version: 2, state: { responses: { overall: 0, 'sleep-0': 5, 'sleep-1': '3' }, pendingResponse: 9, time: '25:00' } }).state).toMatchObject({ responses: { 'sleep-0': 5 }, pendingResponse: null, time: '' });
  });
});
