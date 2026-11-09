import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import InterventionLibrary from './InterventionLibrary';
import NeedStart from './NeedStart';
import Restore from './Restore';

const render = (Page, route) => renderToStaticMarkup(<MemoryRouter initialEntries={[route]}><Page /></MemoryRouter>);
describe('Restore discovery screens', () => {
  it('renders all ten separately labelled restoring activities in Library', () => {
    const html = render(InterventionLibrary, '/library?category=restore');
    expect(html).toContain('10 options');
    expect(html).toContain('Comfortable breathing');
    expect(html).toContain('Protect a sleep routine');
    expect(html).toContain('separate from clinical practices');
  });
  it('searches authored titles and respects time refinements', () => {
    expect(render(InterventionLibrary, '/library?q=tea')).toContain('Mindful tea break');
    const html = render(InterventionLibrary, '/library?category=restore&filter=quick');
    expect(html).toContain('Mindful tea break');
    expect(html).not.toContain('Gentle outdoor walk');
  });
  it('offers a depleted/rest starting point alongside the original paths', () => {
    const html = render(NeedStart, '/start');
    expect(html).toContain('Rest &amp; replenish');
    expect(html).toContain('Feeling depleted');
    expect(html).toContain('Settle &amp; reconnect');
  });
  it('opens saved-history deep links without falling into a new activity', () => {
    const html = render(Restore, '/restore?view=history');
    expect(html).toContain('Saved breaks &amp; plans');
    expect(html).toContain('Review the records saved on this device');
    expect(html).not.toContain('What would feel restful?');
  });
});
