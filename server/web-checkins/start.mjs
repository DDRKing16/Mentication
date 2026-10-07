// Deployment-only entry point. No dependency added to the application package.
// Approve, pin and install web-push in this service before deployment.
import { mkdirSync } from 'node:fs';
import { createStore } from './store.mjs';
import { createCheckInServer } from './api.mjs';
const { CHECKIN_ORIGIN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CHECKIN_DATA_DIR } = process.env;
if (![CHECKIN_ORIGIN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CHECKIN_DATA_DIR].every(Boolean)) throw new Error('Missing check-in service configuration');
if (new URL(CHECKIN_ORIGIN).origin !== CHECKIN_ORIGIN || !CHECKIN_ORIGIN.startsWith('https://')) throw new Error('Invalid frontend origin');
const { default: webpush } = await import('web-push');
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
mkdirSync(CHECKIN_DATA_DIR, { recursive: true, mode: 0o700 });
process.umask(0o077);
const store = createStore(`${CHECKIN_DATA_DIR}/checkins.sqlite`);
const app = createCheckInServer({ store, send: (...args) => webpush.sendNotification(...args), origin: CHECKIN_ORIGIN });
let stopping = false;
let polling = Promise.resolve();
async function poll() {
  try { polling = app.tick(); await polling; } catch { console.error('Check-in scheduler unavailable'); }
  if (!stopping) timer = setTimeout(poll, 15000);
}
let timer = setTimeout(poll, 0);
app.server.listen(Number(process.env.PORT || 10000), '0.0.0.0');
process.on('SIGTERM', () => {
  stopping = true; clearTimeout(timer);
  app.server.close(async () => { await polling.catch(() => {}); await app.drain(); store.close(); });
});
