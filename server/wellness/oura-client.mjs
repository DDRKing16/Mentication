// Server-only building blocks; no server, account store or routes are installed.
// Import only from a future approved authenticated backend, never from src/.
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { validDay } from '../../src/lib/wellness/providers.js';
import { ouraDailySnapshot } from '../../src/lib/wellness/oura.js';

const random = () => randomBytes(32).toString('base64url');
const digest = value => createHash('sha256').update(value).digest('base64url');
const same = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a); const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export function createOuraClient({ clientId, clientSecret, redirectUri, fetchImpl = fetch }) {
  if (!clientId || !clientSecret || new URL(redirectUri).protocol !== 'https:') throw new TypeError('Oura server configuration required');
  const headers = { 'User-Agent': 'Mentication/1.0', Accept: 'application/json' };
  async function request(url, options, failure) {
    try { return await fetchImpl(url, options); } catch { throw new Error(failure); }
  }
  async function json(response, failure) {
    try { return await response.json(); } catch { throw new Error(failure); }
  }
  async function token(parameters) {
    const response = await request('https://api.ouraring.com/oauth/token', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { ...headers, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...parameters, client_id: clientId, client_secret: clientSecret }),
    }, 'Oura authorization failed');
    // Never propagate provider bodies, request URLs or credentials in errors.
    if (!response.ok) throw new Error('Oura authorization failed');
    const data = await json(response, 'Invalid Oura authorization');
    if (!data || typeof data.access_token !== 'string' || !data.access_token || typeof data.refresh_token !== 'string' || !data.refresh_token ||
        !Number.isFinite(data.expires_in) || data.expires_in <= 0 || data.token_type?.toLowerCase() !== 'bearer') throw new Error('Invalid Oura authorization');
    return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt: Date.now() + data.expires_in * 1000 };
  }
  return {
    // Persist this challenge in an expiring server-side session. Never return it
    // to the browser: only url is public. IDs come from authenticated middleware.
    begin({ accountId, sessionId }, now = Date.now()) {
      if (!accountId || !sessionId) throw new TypeError('Authenticated session required');
      const state = random(); const verifier = random();
      const url = new URL('https://cloud.ouraring.com/oauth/authorize');
      url.search = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
        scope: 'daily', state, code_challenge: digest(verifier), code_challenge_method: 'S256' }).toString();
      return { url: url.href, challenge: { stateHash: digest(state), verifier, accountId, sessionId, expiresAt: now + 600000 } };
    },
    // Caller must ATOMICALLY consume the challenge before calling complete,
    // including on denial/failure; it cannot be reused. Bind to signed session.
    async complete({ state, code, error }, challenge, { accountId, sessionId }, now = Date.now()) {
      if (!challenge || typeof state !== 'string' || state.length > 256 ||
          !same(digest(state), challenge.stateHash) || !same(accountId, challenge.accountId) ||
          !same(sessionId, challenge.sessionId) || challenge.expiresAt <= now ||
          typeof challenge.verifier !== 'string') throw new Error('Invalid Oura callback');
      if (error || typeof code !== 'string' || !code || code.length > 4096) throw new Error('Oura authorization not granted');
      // Callback scope is deprecated and may be absent. Actual daily access is
      // checked by fetching daily endpoints; never infer permission from scope.
      return token({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, code_verifier: challenge.verifier });
    },
    // Caller must hold a per-account/provider distributed lock, save BOTH rotated
    // tokens atomically before releasing it, and never retry an uncertain refresh.
    refresh(refreshToken) {
      if (typeof refreshToken !== 'string' || !refreshToken) throw new TypeError('Refresh token required');
      return token({ grant_type: 'refresh_token', refresh_token: refreshToken });
    },
    async daily(accessToken, day) {
      if (typeof accessToken !== 'string' || !accessToken || !validDay(day)) throw new TypeError('Daily request required');
      const collections = await Promise.all(['sleep', 'readiness', 'activity'].map(async kind => {
        const url = new URL(`https://api.ouraring.com/v2/usercollection/daily_${kind}`);
        // Fetch through the following day; mapping still selects only `day`.
        // This is safe with inclusive or exclusive provider end boundaries.
        const nextDay = new Date(Date.parse(day) + 86400000).toISOString().slice(0, 10);
        url.search = new URLSearchParams({ start_date: day, end_date: nextDay, fields: 'day,score' }).toString();
        const rows = []; let cursor = null; const cursors = new Set();
        do {
          if (cursor) url.searchParams.set('next_token', cursor);
          const response = await request(url.href, { redirect: 'error', signal: AbortSignal.timeout(15000),
            headers: { ...headers, Authorization: `Bearer ${accessToken}` } }, 'Oura sync unavailable');
          if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Oura reconnection required' : 'Oura sync unavailable');
          const page = await json(response, 'Invalid Oura summary');
          if (!page || !Array.isArray(page.data)) throw new Error('Invalid Oura summary');
          rows.push(...page.data);
          cursor = page.next_token;
          if (cursor && (typeof cursor !== 'string' || cursors.has(cursor) || cursors.size >= 20)) throw new Error('Invalid Oura pagination');
          if (cursor) cursors.add(cursor);
        } while (cursor);
        return { data: rows };
      }));
      return ouraDailySnapshot({ sleep: collections[0], readiness: collections[1], activity: collections[2] }, day, new Date().toISOString());
    },
  };
}
