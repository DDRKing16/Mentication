import { createServer } from 'node:http';
import { tokenHash, validatePlan, deliverDue } from './store.mjs';

export function createCheckInServer({ store, send, origin, now = Date.now }) {
  // Serialise API mutations and the scheduler, including sends, to avoid a queued
  // old send overtaking a confirmed cancellation/reschedule. A provider-accepted
  // notification cannot be recalled; its TTL is <=60 seconds.
  let tail = Promise.resolve();
  const serial = fn => { const result = tail.then(fn); tail = result.catch(() => {}); return result; };
  let windowStart = now(), requests = 0;
  const server = createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const reply = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.url === '/healthz' && req.method === 'GET') return reply(200, { ok: true });
    if (req.headers.origin !== origin) return reply(403, { error: 'origin' });
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'PUT, GET, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
      return reply(204);
    }
    if (req.url !== '/v1/plan') return reply(404, { error: 'not-found' });
    if (!['PUT', 'GET', 'DELETE'].includes(req.method)) return reply(405, { error: 'method' });
    const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
    if (!token) return reply(401, { error: 'unauthorized' });
    // Bounded global limiter. No untrusted forwarded-IP headers or retained IPs.
    if (now() - windowStart >= 60000) { requests = 0; windowStart = now(); }
    if (++requests > 120 && req.method !== 'DELETE') return reply(429, { error: 'try-later' });
    try {
      let body;
      if (req.method === 'PUT') {
        if (req.headers['content-type'] !== 'application/json') return reply(415, { error: 'content-type' });
        let raw = '';
        for await (const chunk of req) { raw += chunk; if (Buffer.byteLength(raw) > 4096) return reply(413, { error: 'too-large' }); }
        try { body = JSON.parse(raw); } catch { return reply(400, { error: 'invalid-request' }); }
      }
      const result = await serial(() => {
        const owner = tokenHash(token);
        store.prune(now());
        if (req.method === 'DELETE') { store.remove(owner); return { status: 'cancelled' }; }
        if (req.method === 'PUT') store.put(owner, validatePlan(body, now()), now());
        const row = store.get(owner);
        return row ? { status: row.nextAt <= row.endsAt ? 'scheduled' : 'ended', planId: row.planId, endsAt: row.endsAt } : { status: 'ended' };
      });
      reply(200, result);
    } catch (error) { reply(error.status || 500, { error: error.status ? 'invalid-request' : 'unavailable' }); }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  async function tick() {
    const owners = await serial(() => { store.prune(now()); return store.due(now()).map(row => row.owner); });
    // Yield the serial queue between individual sends so cancellations don't
    // wait behind the entire batch. Re-read each schedule with a fresh clock.
    for (const owner of owners) await serial(() => deliverDue(store, send, now(), owner));
  }
  return { server, tick, drain: () => tail };
}
