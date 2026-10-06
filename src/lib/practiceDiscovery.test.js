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
 });
});
