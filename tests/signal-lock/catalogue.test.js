import { describe, expect, it } from 'vitest';
import { INTERVENTIONS } from '../../src/lib/interventions.js';
import { FLAGSHIP_REGISTRY } from '../../src/lib/flagshipRegistry.js';
import { handoffRules } from '../../src/lib/flagshipHandoffs.js';
import { standaloneRouteFor } from '../../src/lib/standaloneInterventions.js';

describe('Signal Lock product identity', () => {
  it('routes the grounding catalogue entry to the approved standalone game', () => {
    const entry = INTERVENTIONS.find(item => item.id === 'signalLock');
    expect(standaloneRouteFor(entry.id)).toBe('/signal-lock');
    expect(entry.directions).toContain('ground');
    expect(entry.directions).not.toContain('focus');
    expect(entry.mechanism).toBe('external-visual-anchoring');
    expect(FLAGSHIP_REGISTRY.signalLock.cognitiveLoad).toBe(1);
    expect(FLAGSHIP_REGISTRY.signalLock.eligibleIntensity).toEqual([0, 7]);
  });
  it('does not promise a task sprint through obsolete handoffs', () => {
    expect(handoffRules().some(rule => rule.from === 'nextAction' && rule.to === 'signalLock')).toBe(false);
    expect(handoffRules().some(rule => rule.from === 'signalLock' && rule.to === 'nextAction')).toBe(false);
  });
});
