import { describe, expect, it } from 'vitest';
import { createTappingContactClock, isFreshTappingContact } from './tappingContactClock';

describe('contact-specific haptic timing', () => {
  const plan = { beatMs: 600, contactMs: 240 };
  it.each([700, 1300, 1900, 6100])('skips stale contacts after a first frame at %sms', phase => {
    const detect = createTappingContactClock(plan);
    const contact = detect(phase);
    expect(contact).toBe(phase - 460);
    expect(isFreshTappingContact(phase, contact)).toBe(false);
    expect(detect(phase + 1)).toBeNull();
    const next = phase + 140;
    expect(isFreshTappingContact(next, detect(next))).toBe(true);
  });
  it('emits only the latest fresh contact after multi-beat stalls', () => {
    const detect = createTappingContactClock(plan);
    expect(detect(239)).toBeNull();
    expect(detect(240)).toBe(240);
    expect(detect(2650)).toBe(2640);
    expect(detect(2651)).toBeNull();
    expect(isFreshTappingContact(2650, 2640)).toBe(true);
    expect(isFreshTappingContact(2650, 240)).toBe(false);
  });
  it('bounds eligibility on both sides of the specific contact', () => {
    expect(isFreshTappingContact(239, 240)).toBe(false);
    expect(isFreshTappingContact(240, 240)).toBe(true);
    expect(isFreshTappingContact(320, 240)).toBe(true);
    expect(isFreshTappingContact(321, 240)).toBe(false);
    expect(isFreshTappingContact(850, 240)).toBe(false);
  });
  it('resynchronizes after the rhythm clock restarts', () => {
    const detect = createTappingContactClock(plan);
    expect(detect(2640)).toBe(2640);
    expect(detect(0)).toBeNull();
    expect(detect(240)).toBe(240);
    expect(detect(241)).toBeNull();
  });
});
