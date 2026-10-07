import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import WebCheckInSetup from '../components/web-checkins/WebCheckInSetup';
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
it('does not promise availability before deployment', () => {
  vi.stubEnv('VITE_WEB_CHECKIN_API', ''); vi.stubEnv('VITE_WEB_CHECKIN_PUBLIC_KEY', '');
  const html = renderToStaticMarkup(<WebCheckInSetup />);
  expect(html).toContain('not available on this website yet'); expect(html).not.toContain('<button');
});
it('requires installed iPhone app and explains separate saved data before permission', () => {
  vi.stubEnv('VITE_WEB_CHECKIN_API', 'https://api.example.test'); vi.stubEnv('VITE_WEB_CHECKIN_PUBLIC_KEY', 'example');
  vi.stubGlobal('navigator', { userAgent: 'iPhone' });
  const html = renderToStaticMarkup(<WebCheckInSetup />);
  expect(html).toContain('Add to Home Screen'); expect(html).toContain('separate saved data'); expect(html).not.toContain('<button');
});
