import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

const { navigate, back } = vi.hoisted(() => ({ navigate: vi.fn(), back: vi.fn() }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));
vi.mock('@/hooks/useAppBack', () => ({ useAppBack: () => back }));
vi.mock('@/lib/utils', () => ({ cn: (...values) => values.filter(Boolean).join(' ') }));
import Crisis from './Crisis';

const render = () => renderToStaticMarkup(<Crisis />);
const descendants = node => !React.isValidElement(node) ? [] : [node, ...React.Children.toArray(node.props.children).flatMap(descendants)];

describe('location-aware crisis support', () => {
  it('puts urgent local-number guidance and international support before Australian phone links', () => {
    const html = render();
    const urgent = html.indexOf('call your local emergency number now.');
    const international = html.indexOf('href="https://findahelpline.com"');
    const australian = html.indexOf('id="australian-support-heading"');
    const firstPhone = html.indexOf('href="tel:');
    expect(urgent).toBeGreaterThan(0);
    expect(international).toBeGreaterThan(urgent);
    expect(australian).toBeGreaterThan(international);
    expect(firstPhone).toBeGreaterThan(australian);
  });
  it('identifies Australia in every phone link without changing or adding numbers', () => {
    const links = descendants(Crisis()).filter(node => node.type === 'a' && node.props.href.startsWith('tel:'));
    expect(links.map(node => node.props.href)).toEqual(['tel:000', 'tel:131114', 'tel:1300224636', 'tel:1300659467']);
    for (const link of links) expect(renderToStaticMarkup(link)).toContain('Australia');
  });
  it('offers a labeled international directory with safe new-tab behavior', () => {
    const link = descendants(Crisis()).find(node => node.type === 'a' && node.props.href.startsWith('https:'));
    expect(link.props).toMatchObject({ href: 'https://findahelpline.com', target: '_blank', rel: 'noreferrer' });
    expect(link.props.children).toContain('your country');
    expect(link.props.children).toContain('opens in a new tab');
    const html = render();
    expect(html).toContain('aria-labelledby="international-support-heading"');
    expect(html).toContain('aria-labelledby="australian-support-heading"');
    expect(html).not.toContain('opacity:0');
  });
  it('keeps Back and the explicitly optional practice available after urgent help', () => {
    const nodes = descendants(Crisis());
    nodes.find(node => node.type === 'button').props.onClick();
    expect(back).toHaveBeenCalledOnce();
    const practice = nodes.find(node => node.props.children === 'Optional calming practice');
    practice.props.onClick();
    expect(navigate).toHaveBeenCalledWith('/reset', { state: { immediate: true, direction: 'calm', directionLabel: 'Calm down' } });
    const html = render();
    expect(html.indexOf('Optional calming practice')).toBeGreaterThan(html.lastIndexOf('href="tel:'));
    expect(html).toContain('does not replace urgent care');
    expect(practice.props.className).toContain('h-auto');
    expect(practice.props.className).toContain('whitespace-normal');
  });
  it('keeps crisis text light on its fixed dark surface in either system theme', () => {
    expect(Crisis().props.style['--cream']).toBe('37 41% 87%');
  });
});
