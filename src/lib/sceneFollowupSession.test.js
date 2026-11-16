import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionStore } from './localData';
import { loadSceneFollowupSession } from './sceneFollowupSession';

const key = 'mentation.sessions.v1';
const token = 'b6586e61-8ef6-4bc7-9761-f68d46381502';
const target = { id:'scene-target', created_date:'2026-11-10T10:00:00Z', pathway:['changeScene'], intervention_outcome:{handoffToken:token} };
let encoded, local;
beforeEach(() => {
  encoded = JSON.stringify([target]);
  local = { getItem:vi.fn(() => encoded), setItem:vi.fn(), removeItem:vi.fn() };
  vi.stubGlobal('window', {localStorage:local});
});
afterEach(() => vi.unstubAllGlobals());

describe('retained Change the Scene handoff lookup', () => {
  it('finds an exact matching session beyond the newest 100 records without changing history', async () => {
    const recent=Array.from({length:105},(_,i)=>({id:`newer-${i}`,created_date:'2026-11-15T10:00:00Z',pathway:['boxV2']}));
    encoded=JSON.stringify([...recent,target]);
    expect((await sessionStore.list('-created_date',100)).find(record=>record.id===target.id)).toBeUndefined();
    expect(await loadSceneFollowupSession(token)).toEqual(target);
    expect(local.getItem).toHaveBeenCalledWith(key);
    expect(local.setItem).not.toHaveBeenCalled();expect(local.removeItem).not.toHaveBeenCalled();
  });
  it('requires both exact token and an actual Change the Scene pathway', async () => {
    encoded=JSON.stringify([
      {...target,id:'wrong-practice',pathway:['boxV2']},
      {...target,id:'malformed-pathway',pathway:'changeScene'},
      {...target,id:'wrong-token',intervention_outcome:{handoffToken:`${token}-other`}},
      target,
    ]);
    expect(await loadSceneFollowupSession(token)).toEqual(target);
    expect(await loadSceneFollowupSession('missing')).toBeNull();
  });
  it.each([null,undefined,'',42])('does not guess a session from missing/invalid token %j', async value => {
    expect(await loadSceneFollowupSession(value)).toBeNull();expect(local.getItem).not.toHaveBeenCalled();
  });
  it('keeps exact lookup compatibility for already-saved legacy tokens', async () => {
    const legacy={...target,intervention_outcome:{handoffToken:'scene-1731234567890'}};
    encoded=JSON.stringify([legacy]);
    expect(await loadSceneFollowupSession('scene-1731234567890')).toEqual(legacy);
  });
  it.each(['{broken','null','{}','[null]'])('propagates corrupt history without repairing it: %s', async value => {
    encoded=value;
    await expect(loadSceneFollowupSession(token)).rejects.toThrow();
    expect(encoded).toBe(value);expect(local.setItem).not.toHaveBeenCalled();expect(local.removeItem).not.toHaveBeenCalled();
  });
  it('propagates blocked reads and supports a subsequent successful retry', async () => {
    local.getItem.mockImplementationOnce(()=>{throw Error('read blocked');});
    await expect(loadSceneFollowupSession(token)).rejects.toThrow('read blocked');
    expect(await loadSceneFollowupSession(token)).toEqual(target);
    expect(local.setItem).not.toHaveBeenCalled();
  });
});
