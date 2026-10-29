import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
vi.mock('@/hooks/useAppBack', () => ({ useAppBack: () => () => {} }));
import Privacy from '../pages/Privacy';
it('discloses authored data, optional web processing, backup destinations and pending cancellation', () => {
  const html = renderToStaticMarkup(<Privacy />);
  for (const text of ['journal entries', 'unfinished drafts', 'cloud service', 'browser’s notification provider', 'random token', 'not your situation, answers or plan text', 'minimum cancellation information', 'Free access does not cancel an existing subscription']) expect(html).toContain(text);
  expect(html).not.toContain('Mentication never uploads');
  expect(html).not.toContain('Mentication has no');
});
