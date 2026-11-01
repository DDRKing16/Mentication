import { describe, it, expect, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { createOuraClient } from './oura-client.mjs';
const identity = { accountId: 'account-a', sessionId: 'signed-session-a' };
const tokens = { access_token: 'test-access', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600 };
const make = fetchImpl => createOuraClient({ clientId: 'test-client', clientSecret: 'test-secret', redirectUri: 'https://example.test/oura/callback', fetchImpl });

describe('Oura server building blocks', () => {
  it('uses daily-only scope, random state and S256 PKCE', () => {
    const client = make(vi.fn()); const first = client.begin(identity); const second = client.begin(identity);
    const url = new URL(first.url);
    expect(url.searchParams.get('scope')).toBe('daily');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(createHash('sha256').update(first.challenge.verifier).digest('base64url'));
    expect(first.url).not.toBe(second.url); expect(first.url).not.toContain('test-secret');
  });
  it('rejects mismatched state, account, session, expired callbacks and denial without exchanging tokens', async () => {
    const fetcher = vi.fn(); const client = make(fetcher); const { url, challenge } = client.begin(identity, 0);
    const callback = { state: new URL(url).searchParams.get('state'), code: 'test-code' };
    for (const [cb, ch, who, now] of [
      [{ ...callback, state: 'wrong' }, challenge, identity, 1],
      [callback, challenge, { ...identity, accountId: 'other' }, 1],
      [callback, challenge, { ...identity, sessionId: 'other' }, 1],
      [callback, challenge, identity, 600000],
      [{ ...callback, error: 'access_denied' }, challenge, identity, 1],
    ]) await expect(client.complete(cb, ch, who, now)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('exchanges code server-side with exact callback and verifier, without depending on callback scope', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => tokens }));
    const client = make(fetcher); const { url, challenge } = client.begin(identity);
    const result = await client.complete({ state: new URL(url).searchParams.get('state'), code: 'test-code' }, challenge, identity);
    expect(result.refreshToken).toBe('test-refresh');
    const [endpoint, request] = fetcher.mock.calls[0];
    expect(endpoint).toBe('https://api.ouraring.com/oauth/token');
    expect(request.body.get('redirect_uri')).toBe('https://example.test/oura/callback');
    expect(request.body.get('code_verifier')).toBe(challenge.verifier);
    expect(request.headers['User-Agent']).toBeTruthy();
    expect(request.redirect).toBe('error');
  });
  it('handles paginated daily summaries and carries no tokens into the view model', async () => {
    const fetcher = vi.fn(async (url, request) => {
      expect(request.headers.Authorization).toBe('Bearer test-access');
      const parsed = new URL(url);
      return { ok: true, json: async () => parsed.searchParams.has('next_token')
        ? { data: [{ day: '2026-11-01', score: 88 }], next_token: null }
        : { data: [], next_token: 'page-two' } };
    });
    const result = await make(fetcher).daily('test-access', '2026-11-01');
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(result.metrics.map(metric => metric.value)).toEqual([88, 88, 88]);
    expect(JSON.stringify(result)).not.toContain('test-access');
  });
  it('redacts malformed JSON and transport exceptions before they can reach backend logs', async () => {
    const brokenJson = async () => ({ ok: true, json: async () => { throw new SyntaxError('private provider response'); } });
    const brokenNetwork = async () => { throw new Error('private request credentials'); };
    for (const fetcher of [brokenJson, brokenNetwork]) {
      await expect(make(fetcher).refresh('test-refresh')).rejects.toThrow(/^Oura authorization failed$|^Invalid Oura authorization$/);
      await expect(make(fetcher).daily('test-access', '2026-11-01')).rejects.toThrow(/^Oura sync unavailable$|^Invalid Oura summary$/);
    }
    await expect(make(async () => ({ ok: true, json: async () => null })).refresh('test-refresh')).rejects.toThrow('Invalid Oura authorization');
  });
  it('redacts provider failures and returns both rotated refresh tokens', async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => tokens }));
    expect(await make(fetcher).refresh('old-refresh')).toMatchObject({ accessToken: 'test-access', refreshToken: 'test-refresh' });
    await expect(make(async () => ({ ok: false })).refresh('old-refresh')).rejects.toThrow('Oura authorization failed');
  });
});
