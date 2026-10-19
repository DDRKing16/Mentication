import { describe, it, expect } from 'vitest';
import { buildProfile, pickLastWorked } from './interventions';
const session = (direction, start, end, id='happyBump') => ({direction,intensity_start:start,intensity_end:end,pathway:[id],completed_pathway:[id]});
describe('profile evidence', () => {
  it('preserves worse and unchanged ratings without claiming a helpful tool or combination', () => {
    const rows=[session('lift',5,0),session('ground',0,0,'grounding54321V2'),session('calm',8,null,'boxV2')];
    const p=buildProfile(rows);
    expect(p.count).toBe(2); expect(p.change).toBe(-2.5); expect(p.topTools).toEqual([]); expect(p.bestCombo).toBeNull(); expect(pickLastWorked(rows)).toBeNull();
  });
  it('does not credit selected or skipped practices for a better rating', () => {
    const row={...session('calm',8,0,'boxV2'),completed_pathway:[],attempts:[{intervention_id:'boxV2',exit_reason:'skipped',completed_percentage:0}]};
    expect(buildProfile([row]).count).toBe(0);expect(pickLastWorked([row])).toBeNull();
  });
  it('credits only confirmed completions with comparable numeric ratings', () => {
    const row=session('lift',0,5); const p=buildProfile([row,session('calm','8',0)]);
    expect(p.count).toBe(1);expect(p.change).toBe(5);expect(p.topTools[0].id).toBe('happyBump');expect(pickLastWorked([row])).toBe(row);
  });
});
