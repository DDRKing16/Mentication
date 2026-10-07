import { describe, expect, it } from 'vitest';
import { INTERVENTIONS } from './interventions';
import { PRACTICE_CATEGORIES, practiceSearchMatches, practiceTimeLabel } from './practiceDiscovery';
import { NEED_ENTRIES } from './journeyExperience';
describe('authored practice discovery',()=>{
 it('labels every current direction, including Reset',()=>{
  const labels=Object.fromEntries(PRACTICE_CATEGORIES);
  for(const practice of INTERVENTIONS)expect(labels[practice.primaryDirection]).toBeTruthy();
  expect(labels.reset).toBe('Reset');
 });
 it('finds each need in the existing practice without claiming matching',()=>{
  for(const need of NEED_ENTRIES)expect(practiceSearchMatches(INTERVENTIONS.find(iv=>iv.id===need.practice),need.label)).toBe(true);
 });
 it('supports plain words, punctuation, direction and acronym searching',()=>{
  expect(practiceSearchMatches(INTERVENTIONS.find(iv=>iv.id==='nextAction'),'cannot get started')).toBe(true);
  expect(practiceSearchMatches(INTERVENTIONS.find(iv=>iv.id==='factCheck'),'stuck in a thought')).toBe(true);
  expect(practiceSearchMatches(INTERVENTIONS.find(iv=>iv.id==='eftTapping'),'EFT tapping')).toBe(true);
  expect(practiceSearchMatches(INTERVENTIONS.find(iv=>iv.id==='taraTactician'),'plan, difficult')).toBe(true);
  expect(practiceSearchMatches(INTERVENTIONS[0],'nonexistent wording')).toBe(false);
 });
 it('distinguishes preparation and self-paced work from timed practice',()=>{
  expect(practiceTimeLabel({id:'taraTactician',durationMin:5})).toContain('to prepare');
  expect(practiceTimeLabel({id:'nextAction',durationMin:3})).toBe('Self-paced steps');
  expect(practiceTimeLabel({id:'dear2100',durationMin:15})).toBe('Self-paced reflection');
  expect(practiceTimeLabel({id:'boxV2',durationMin:2})).toBe('About 2 min');
  expect(practiceTimeLabel({id:'urgeSurf',durationMin:4})).toBe('30–60 sec practice · optional setup');
 });
});

import { NEED_GROUPS, PRACTICE_PREVIEWS, practiceDestination } from './practiceDiscovery';

describe('practice discovery contracts', () => {
  it('keeps every existing need available exactly once, without changing its practice mapping', () => {
    const ids = NEED_GROUPS.flatMap(group => group.needs);
    expect(ids.length).toBe(new Set(ids).size);
    expect([...ids].sort()).toEqual(NEED_ENTRIES.map(item => item.id).sort());
    for (const need of NEED_ENTRIES) expect(practiceDestination(need.practice)).not.toBeNull();
  });
  it('describes and opens every catalogue practice without inventing a starting rating', () => {
    for (const iv of INTERVENTIONS) {
      expect(PRACTICE_PREVIEWS[iv.id]).toBeTruthy();
      const destination = practiceDestination(iv.id);
      expect(destination).not.toBeNull();
      if (destination.to === '/reset') {
        expect(destination.state.pathway).toEqual([iv.id]);
        expect(destination.state.intensity).toBeNull();
        expect(destination.state.goal_baseline).toBeNull();
        expect(destination.state.distress).toBeNull();
      }
    }
  });
  it('preserves standalone routes and the Happy Bump check-in; unknown IDs never launch', () => {
    expect(practiceDestination('signalLock')).toEqual({ to: '/signal-lock' });
    expect(practiceDestination('vectorShift')).toEqual({ to: '/vector-shift' });
    expect(practiceDestination('nightChannel')).toEqual({ to: '/night-channel' });
    expect(practiceDestination('dear2100')).toEqual({ to: '/dear-2100' });
    expect(practiceDestination('happyBump').state.prebuilt).toBe(false);
    expect(practiceDestination('missing')).toBeNull();
    expect(practiceDestination('boxV2').state.audio).toBe('no');
    expect(practiceDestination('boxV2', 'yes').state.audio).toBe('yes');
  });
});
