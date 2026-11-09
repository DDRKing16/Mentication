import { describe, expect, it, vi } from 'vitest';
import { createSecureId } from './secureId';
describe('secure identifiers on supported WebKit versions', () => {
  it('uses native randomUUID with its crypto receiver', () => {
    const source = { randomUUID() { expect(this).toBe(source); return 'native-id'; }, getRandomValues: vi.fn() };
    expect(createSecureId(source)).toBe('native-id'); expect(source.getRandomValues).not.toHaveBeenCalled();
  });
  it('creates RFC 4122 v4 IDs with secure random bytes on older iOS', () => {
    const source = { getRandomValues(bytes) { expect(this).toBe(source); bytes.fill(255); } };
    expect(createSecureId(source)).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
    expect(createSecureId({ getRandomValues: bytes => bytes.fill(0) })).toBe('00000000-0000-4000-8000-000000000000');
  });
  it('does not weaken randomness if Web Crypto is unavailable or fails', () => {
    expect(() => createSecureId(null)).toThrow('Secure identifiers are unavailable');
    expect(() => createSecureId({})).toThrow('Secure identifiers are unavailable');
    expect(() => createSecureId({ getRandomValues() { throw Error('unavailable'); } })).toThrow('unavailable');
  });
});
