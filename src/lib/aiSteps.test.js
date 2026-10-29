import { afterEach, expect, it, vi } from 'vitest';
const platform = vi.hoisted(() => ({ native: false }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => platform.native } }));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.resetModules(); });
it.each([{ dev: false, native: false }, { dev: false, native: true }, { dev: true, native: true }])('never sends authored text with %j', async ({ dev, native }) => {
  platform.native = native; vi.stubEnv('DEV', dev); vi.stubEnv('VITE_AI_URL', 'https://relay.example.test');
  const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
  const { aiStepsAvailable, generateTaskSteps } = await import('./aiSteps');
  expect(aiStepsAvailable()).toBe(false);
  expect(await generateTaskSteps('synthetic authored text')).toBeNull(); expect(fetch).not.toHaveBeenCalled();
});
it('preserves configured browser development relay behavior with mocked transport', async () => {
  platform.native = false; vi.stubEnv('DEV', true); vi.stubEnv('VITE_AI_URL', 'https://relay.example.test');
  const steps = Array.from({ length: 5 }, () => ({ title: 'Example', micro: 'Example step' }));
  const fetch = vi.fn(async () => ({ ok: true, json: async () => ({ steps }) })); vi.stubGlobal('fetch', fetch);
  const { aiStepsAvailable, generateTaskSteps } = await import('./aiSteps');
  expect(aiStepsAvailable()).toBe(true); expect(await generateTaskSteps(' synthetic task ')).toHaveLength(5);
  expect(fetch.mock.calls[0][1].body).toBe(JSON.stringify({ task: 'synthetic task', pathLength: 'regular' }));
});
