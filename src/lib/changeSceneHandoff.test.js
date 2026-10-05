import {describe,it,expect} from 'vitest';
import {sceneHandoff} from './changeSceneHandoff';
const session={pathway:['changeScene'],context_snapshot:{direction:'lift',location:'home',movement:'seated',audio:'yes',contraindicationTags:[],unsuitableSubstates:[]}};
const check={mood:5,distress:2,location:'home',timeMin:5,confirmed:true};
describe('Change Scene guarded onward practice',()=>{
 it('opens eligible Happy Bump with a new exact answered mood baseline',()=>{const result=sceneHandoff(session,'happyBump',check);expect(result.intervention.id).toBe('happyBump');expect(result.entry.goal_baseline).toMatchObject({value:5,answered:true,direction:'lift'});});
 it.each([{mood:null},{distress:null},{confirmed:false},{timeMin:2},{location:''},{distress:9}])('refuses missing or unsuitable check-in %j',override=>expect(sceneHandoff(session,'happyBump',{...check,...override})).toBeNull());
 it.each([{acute:true},{immediate:true},{disconnected:true},{contraindicationTags:['dizziness']}])('preserves exclusions %j',context=>expect(sceneHandoff({...session,context_snapshot:{...session.context_snapshot,...context}},'happyBump',check)).toBeNull());
 it('never bypasses the Happy Bump prerequisite for Dear 2100',()=>{
  expect(sceneHandoff(session,'dear2100',check)).toBeNull();
  const result=sceneHandoff(session,'dear2100',{...check,timeMin:20,longerJourney:true});expect(result.intervention.id).toBe('happyBump');expect(result.entry.pathway).toEqual(['happyBump']);
  expect(sceneHandoff(session,'dear2100',{...check,timeMin:20,longerJourney:true,location:'work'})).toBeNull();
 });
 it('different mechanism uses existing eligible suggestion',()=>{const result=sceneHandoff(session,'different',{...check,timeMin:10});expect(result.intervention.id).not.toBe('changeScene');expect(result.intervention.mechanism).not.toBe('environment-shift');});
 it('does not accept another journey as a completed Change Scene source',()=>expect(sceneHandoff({...session,pathway:['other']},'happyBump',check)).toBeNull());
});
