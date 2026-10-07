import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import TappingPMRSilhouette, { SILHOUETTE_POINTS, TAPPING_BODY_ASSET } from './TappingPMRSilhouette';
import { TAPPING_POINTS } from './tappingProtocol';

describe('PMR silhouette tapping guide', () => {
  it.each(TAPPING_POINTS)('keeps $name visible and uses the existing PMR figure', point => {
    const marker = SILHOUETTE_POINTS[point.id];
    const [x, y, width, height] = marker.frame.split(' ').map(Number);
    expect(marker.x).toBeGreaterThanOrEqual(x);
    expect(marker.x).toBeLessThanOrEqual(x + width);
    expect(marker.y).toBeGreaterThanOrEqual(y);
    expect(marker.y).toBeLessThanOrEqual(y + height);
    const html = renderToStaticMarkup(<TappingPMRSilhouette point={point}/>);
    expect(html).toContain(TAPPING_BODY_ASSET);
    expect(html).toContain('The light marks the place to tap.');
    expect(html).not.toContain('is-tapping');
  });
  it('keeps quiet guides still and gives each selected rhythm its actual animation period', () => {
    for (const beatMs of [600, 800]) {
      const active = renderToStaticMarkup(<TappingPMRSilhouette point={TAPPING_POINTS[2]} paused={false} beatMs={beatMs}/>);
      expect(active).toContain('tap-contact-target is-tapping');
      expect(active).toContain(`--tap-cycle:${beatMs}ms`);
      const quiet = renderToStaticMarkup(<TappingPMRSilhouette point={TAPPING_POINTS[2]} paused={false} quiet beatMs={beatMs}/>);
      expect(quiet).not.toContain('is-tapping');
      expect(quiet).toContain('data-motion="still"');
    }
  });
});
