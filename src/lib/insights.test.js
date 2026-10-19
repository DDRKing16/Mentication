import {it,expect} from 'vitest';
import {computeEffectivenessInsights} from './insights';
it('does not substitute zero for omitted ratings or invert mood in location summaries',()=>{
  const sessions=[{direction:'calm',intensity_start:8,intensity_end:null},{direction:'lift',intensity_start:5,intensity_end:0,location:'work'},{direction:'ground',intensity_start:0,intensity_end:0,location:'outside'}];
  const result=computeEffectivenessInsights(sessions);
  expect(result.directionStats.find(x=>x.direction==='calm').avgImprovement).toBeNull();
  expect(result.directionStats.find(x=>x.direction==='lift').avgImprovement).toBe(-5);
  expect(result.locationStats.find(x=>x.location==='work').avgImprovement).toBe(-5);
  expect(result.locationStats.find(x=>x.location==='outside').avgImprovement).toBe(0);
});
