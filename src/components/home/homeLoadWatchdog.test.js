import { afterEach, describe, expect, it, vi } from 'vitest';
import { HOME_LOAD_TIMEOUT_MS, watchHomeLoad } from './homeLoadWatchdog';
afterEach(() => vi.useRealTimers());
describe('Home loading watchdog', () => {
  it('offers recovery when the handshake does not finish', () => {
    vi.useFakeTimers(); const onTimeout = vi.fn(); watchHomeLoad({ ready: false, onTimeout });
    vi.advanceTimersByTime(HOME_LOAD_TIMEOUT_MS - 1); expect(onTimeout).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1); expect(onTimeout).toHaveBeenCalledTimes(1);
  });
  it('does not time out a ready Home', () => {
    const setTimer = vi.fn(); expect(watchHomeLoad({ ready: true, onTimeout: vi.fn(), setTimer })).toBeUndefined(); expect(setTimer).not.toHaveBeenCalled();
  });
  it('cancels old attempts on readiness, retry or unmount', () => {
    vi.useFakeTimers(); const onTimeout = vi.fn(); const cleanup = watchHomeLoad({ ready: false, onTimeout });
    cleanup(); vi.advanceTimersByTime(HOME_LOAD_TIMEOUT_MS); expect(onTimeout).not.toHaveBeenCalled(); expect(vi.getTimerCount()).toBe(0);
  });
});
