import { describe, expect, it, vi } from 'vitest';
import { PMR_RATE } from '@/lib/pmrSession';
import manifest from './tappingAudioManifest.json';
import { tappingNarration, hasTappingNarration, tappingNarrationKeys, TAPPING_VOICE_RATE } from './tappingNarration';

describe('shared Mentication narration for tapping', () => {
  it('uses the exact approved spoken-text lookup and the PMR playback rate', () => {
    const lookup = vi.fn(() => ({ url: '/audio/narration/approved.mp3', alignment: [] }));
    expect(tappingNarration('place-brow', lookup)?.url).toBe('/audio/narration/approved.mp3');
    expect(lookup).toHaveBeenCalledWith(manifest['place-brow'].caption);
    expect(TAPPING_VOICE_RATE).toBe(PMR_RATE);
    expect(tappingNarration('unknown', lookup)).toBeNull();
  });
  it('does not offer a complete voice guide when even one required recording is missing', () => {
    const lookup = text => text === manifest['place-sideEye'].caption ? null : { url: '/audio/narration/approved.mp3' };
    expect(hasTappingNarration('worry', lookup)).toBe(false);
    expect(hasTappingNarration('worry', () => ({ url: '/audio/narration/approved.mp3' }))).toBe(true);
    expect(tappingNarrationKeys('worry')).toContain('worry-setup');
    expect(tappingNarrationKeys('worry')).not.toContain('grounding-setup');
  });
});
