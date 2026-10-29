// Read-only preflight: no key generation, disk writes, provider calls or values logged.
import { createECDH } from 'node:crypto';
import { createRequire } from 'node:module';
import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
const require = createRequire(import.meta.url);
export function checkReadiness(env = process.env, resolve = name => require.resolve(name)) {
  const blockers = [];
  for (const name of ['CHECKIN_ORIGIN', 'CHECKIN_DATA_DIR', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']) {
    if (!env[name]) blockers.push(`Missing ${name}`);
  }
  if (env.CHECKIN_ORIGIN) {
    try { const url = new URL(env.CHECKIN_ORIGIN); if (url.protocol !== 'https:' || url.origin !== env.CHECKIN_ORIGIN) throw new Error(); }
    catch { blockers.push('CHECKIN_ORIGIN must be an exact HTTPS origin'); }
  }
  if (env.CHECKIN_DATA_DIR && !isAbsolute(env.CHECKIN_DATA_DIR)) blockers.push('CHECKIN_DATA_DIR must be an absolute persistent mount path');
  if (env.VAPID_SUBJECT) {
    try { if (!['mailto:', 'https:'].includes(new URL(env.VAPID_SUBJECT).protocol)) throw new Error(); }
    catch { blockers.push('VAPID_SUBJECT must be an owner-approved mailto or HTTPS contact'); }
  }
  if (env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) {
    try {
      const pair = createECDH('prime256v1');
      pair.setPrivateKey(Buffer.from(env.VAPID_PRIVATE_KEY, 'base64url'));
      if (!pair.getPublicKey().equals(Buffer.from(env.VAPID_PUBLIC_KEY, 'base64url'))) throw new Error();
    } catch { blockers.push('VAPID keys are invalid or do not match'); }
  }
  try { resolve('web-push'); } catch { blockers.push('Approved server-only web-push dependency is not installed'); }
  return { status: blockers.length ? 'blocked' : 'configuration-present', blockers,
    deliveryVerified: false, note: 'Disk persistence, provider delivery and physical-device behavior require separate verification.' };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = checkReadiness();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.blockers.length ? 1 : 0;
}
