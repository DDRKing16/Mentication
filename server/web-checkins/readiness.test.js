import { expect, it } from 'vitest';
import { checkReadiness } from './readiness.mjs';
it('reports missing configuration without generating credentials or claiming delivery', () => {
  const result = checkReadiness({}, () => { throw new Error(); });
  expect(result.status).toBe('blocked'); expect(result.blockers).toHaveLength(6); expect(result.deliveryVerified).toBe(false);
});
it('rejects invalid origins, relative storage and invalid keys without echoing values', () => {
  const result = checkReadiness({ CHECKIN_ORIGIN: 'https://example.test/path?private=value', CHECKIN_DATA_DIR: 'relative',
    VAPID_PUBLIC_KEY: 'synthetic-public', VAPID_PRIVATE_KEY: 'synthetic-private', VAPID_SUBJECT: 'ftp://example.test' }, () => 'installed');
  expect(result.blockers).toHaveLength(4);
  expect(JSON.stringify(result)).not.toMatch(/synthetic|private=value/);
});
