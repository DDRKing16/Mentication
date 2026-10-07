import {describe,expect,it} from 'vitest';
import manifest from './tappingAudioManifest.json';
import {tappingPlan,narrationForTick} from './tappingTiming';
import {TAPPING_POINTS} from './tappingProtocol';
describe('spoken placement and shared tapping timing',()=>{
 it.each(TAPPING_POINTS.map(p=>p.id))('allows the full %s placement clip before any tapping',id=>{const plan=tappingPlan(id,'worry');expect(plan.placement).toBeGreaterThan(manifest['place-'+id].duration);expect(narrationForTick(id,'worry',0,plan)).toBe('place-'+id);expect(narrationForTick(id,'worry',plan.placement,plan)).toBe('tap');});
 it('speaks exactly three non-overlapping EFT setup repetitions',()=>{const plan=tappingPlan('hand','overwhelm'),spoken=Array.from({length:plan.total},(_,second)=>({second,key:narrationForTick('hand','overwhelm',second,plan)})).filter(e=>e.key==='overwhelm-setup');expect(spoken).toHaveLength(3);for(let i=0;i<spoken.length-1;i++)expect(spoken[i+1].second-spoken[i].second).toBeGreaterThan(manifest['overwhelm-setup'].duration);expect(spoken.at(-1).second+manifest['overwhelm-setup'].duration).toBeLessThan(plan.total);});
 it('keeps grounding separate and gives Spacious more find-time and four more body taps',()=>{const g=tappingPlan('hand','grounding');expect(Array.from({length:g.total},(_,s)=>narrationForTick('hand','grounding',s,g)).filter(key=>key==='grounding-setup')).toHaveLength(0);const normal=tappingPlan('brow','worry'),slow=tappingPlan('brow','worry',true);expect(slow.placement).toBe(normal.placement+1);expect(slow.beats).toBe(normal.beats+4);});
});
