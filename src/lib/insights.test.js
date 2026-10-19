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
it('never presents recommendation priors or skipped ratings as observed helpful results',()=>{
  const skipped={direction:'lift',pathway:['happyBump'],completed_pathway:[],attempts:[{intervention_id:'happyBump',exit_reason:'skipped',completed_percentage:0,response:'not_answered'}],context_snapshot:{location:'home'}};
  for(const row of [skipped,{...skipped,intensity_start:0,intensity_end:8}]) {
    const result=computeEffectivenessInsights([row]);
    expect(result.topInterventions).toEqual([]);expect(result.contextPatterns).toEqual([]);
  }
});
it('only claims positive observed averages, retaining negative and missing evidence in mixed cases',()=>{
  const make=(id,start,end)=>({direction:'calm',completed_pathway:[id],intensity_start:start,intensity_end:end,context_snapshot:{location:'home'}});
  const rows=[make('boxV2',8,4),make('boxV2',4,6),make('boxV2',8,null),make('happyBump',0,5),make('happyBump',0,5),make('grounding54321V2',0,0)];
  const result=computeEffectivenessInsights(rows);
  expect(result.topInterventions).toEqual([{id:'boxV2',name:'Box Breathing',avgShift:1,ratedUses:2}]);
  expect(result.contextPatterns).toEqual([{direction:'calm',location:'home',intervention:'Box Breathing',avgShift:1,ratedUses:2}]);
});
