import { describe,it,expect } from 'vitest';
import { taraReportedResult, savedWorkMatches, validSavedDate } from './savedWorkPresentation';
describe('genuine saved-work presentation',()=>{
 it('keeps factual outcomes separate from historical difficulty',()=>{
  expect(taraReportedResult({predictionResult:'partly',comparison:'more'})).toEqual({label:'What you reported',text:'Part of it happened'});
  expect(taraReportedResult({comparison:'more'})).toEqual({label:'Earlier difficulty comparison',text:'More difficult than I expected'});
  expect(taraReportedResult({predictionResult:'successful'})).toBeNull();
 });
 it('searches only supplied saved wording, across fields, without inferred tags',()=>{
  expect(savedWorkMatches('Tara sentence',['Tara Tactician','Write one sentence'])).toBe(true);
  expect(savedWorkMatches('happy',['Write one sentence'])).toBe(false);
  expect(savedWorkMatches('word',[null,undefined,0])).toBe(false);
 });
 it('does not invent a date for undated or invalid legacy records',()=>{
  for(const value of [undefined,null,0,'','not-a-date'])expect(validSavedDate(value)).toBeNull();
  expect(validSavedDate('2026-10-06T12:00:00Z').getFullYear()).toBe(2026);
 });
});
