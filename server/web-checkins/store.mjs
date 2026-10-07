import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';

export const opaqueId = /^[a-f0-9-]{36}$/;
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
const fail = () => { throw Object.assign(new Error('Invalid request'), { status: 400 }); };
export function validatePlan(body, now = Date.now()) {
  if (!body || Object.keys(body).some(k => !['planId', 'subscription', 'startedAt', 'endsAt', 'intervalMinutes'].includes(k))) fail();
  const { planId, startedAt, endsAt, intervalMinutes, subscription: s } = body;
  if (!opaqueId.test(planId) || !Number.isSafeInteger(startedAt) || !Number.isSafeInteger(endsAt) ||
      ![10, 20, 30].includes(intervalMinutes) || startedAt > now + 60000 || startedAt < now - 120 * 60000 ||
      endsAt <= now || endsAt <= startedAt || endsAt > startedAt + 120 * 60000) fail();
  if (!s || Object.keys(s).some(k => !['endpoint', 'keys', 'expirationTime'].includes(k))) fail();
  let url;
  try { url = new URL(s.endpoint); } catch { fail(); }
  const allowed = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'];
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hash ||
      !allowed.includes(url.hostname) || s.endpoint.length > 2048) fail();
  if (!s.keys || Object.keys(s.keys).some(k => !['p256dh', 'auth'].includes(k)) ||
      !/^[\w-]{87}$/.test(s.keys.p256dh) || !/^[\w-]{22}$/.test(s.keys.auth) ||
      (s.expirationTime != null && (!Number.isSafeInteger(s.expirationTime) || s.expirationTime <= now))) fail();
  return { planId, startedAt, endsAt, intervalMinutes, subscription: {
    endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth }, expirationTime: s.expirationTime ?? null,
  } };
}

// One process/instance only. SQLite commits before sends; missed attempts are not replayed.
export function createStore(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS plans (owner TEXT PRIMARY KEY, planId TEXT NOT NULL,
    subscription TEXT NOT NULL, startedAt INTEGER NOT NULL, endsAt INTEGER NOT NULL,
    intervalMs INTEGER NOT NULL, nextAt INTEGER NOT NULL);`);
  return {
    put(owner, plan, now) {
      const interval = plan.intervalMinutes * 60000;
      const next = plan.startedAt + (Math.floor(Math.max(0, now - plan.startedAt) / interval) + 1) * interval;
      if (next > plan.endsAt) fail();
      if (!this.get(owner) && db.prepare('SELECT COUNT(*) AS n FROM plans').get().n >= 1000) {
        throw Object.assign(new Error('Capacity reached'), { status: 503 });
      }
      db.prepare('INSERT OR REPLACE INTO plans VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        owner, plan.planId, JSON.stringify(plan.subscription), plan.startedAt, plan.endsAt, interval, next);
    },
    get: owner => db.prepare('SELECT * FROM plans WHERE owner=?').get(owner),
    remove: owner => db.prepare('DELETE FROM plans WHERE owner=?').run(owner),
    prune(now) {
      db.prepare('DELETE FROM plans WHERE endsAt < ? OR (json_extract(subscription, \'$.expirationTime\') IS NOT NULL AND json_extract(subscription, \'$.expirationTime\') <= ?)').run(now, now);
    },
    due: now => db.prepare('SELECT * FROM plans WHERE nextAt <= ? AND endsAt >= ?').all(now, now),
    advance(row, now) {
      const next = row.startedAt + (Math.floor((now - row.startedAt) / row.intervalMs) + 1) * row.intervalMs;
      db.prepare('UPDATE plans SET nextAt=? WHERE owner=?').run(next, row.owner);
    },
    close: () => db.close(),
  };
}

export async function deliverDue(store, send, now = Date.now(), owner) {
  store.prune(now);
  for (const row of store.due(now).filter(row => owner === undefined || row.owner === owner)) {
    // Persist before I/O: an interrupted send may be missed, never replayed on restart.
    store.advance(row, now);
    if (now - row.nextAt > 90000) continue; // Don't send a stale check-in after an outage.
    try {
      await send(JSON.parse(row.subscription), JSON.stringify({ planId: row.planId, expiresAt: Math.min(row.endsAt, now + 60000) }),
        { TTL: Math.max(0, Math.min(60, Math.floor((row.endsAt - now) / 1000))), urgency: 'normal', timeout: 5000 });
    } catch (error) {
      if ([404, 410].includes(error.statusCode)) store.remove(row.owner);
      // Other failures skip this occurrence; next interval tries again, with no retry storm.
      // Never log subscription endpoints, payloads, response bodies or credentials.
    }
  }
}
