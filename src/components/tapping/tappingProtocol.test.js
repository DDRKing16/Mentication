import { describe, it, expect } from 'vitest';
import { makeTappingResult, outcomeText, TAPPING_POINTS } from './tappingProtocol';
describe('tapping outcome integrity', () => {
  it('preserves missing ratings and does not invent improvement', () => {
    const result = makeTappingResult({concern:'worry'});
    expect(result.before).toBeNull(); expect(result.after).toBeNull(); expect(result.completed).toBe(false);
    expect(outcomeText(null,0)).toMatch(/No comparison/);
  });
  it('preserves a genuine zero and correctly distinguishes all outcomes', () => {
    expect(makeTappingResult({concern:'tension',before:0,after:0}).after).toBe(0);
    expect(outcomeText(7,3)).toMatch(/lower/); expect(outcomeText(3,7)).toMatch(/higher/); expect(outcomeText(3,3)).toMatch(/unchanged/);
  });
  it('keeps grounding distinct from EFT and interruption distinct from completion', () => {
    const result = makeTappingResult({concern:'grounding',stopped:true,durationSeconds:12});
    expect(result.mode).toBe('grounding'); expect(result.completed).toBe(false); expect(result.stopped).toBe(true);
    expect(makeTappingResult({concern:'worry',roundsCompleted:1}).completed).toBe(true);
  });
  it('uses the sourced setup and eight-point short sequence', () => {
    expect(TAPPING_POINTS.map(p=>p.id)).toEqual(['hand','crown','brow','sideEye','underEye','nose','chin','collar','arm']);
  });
});
