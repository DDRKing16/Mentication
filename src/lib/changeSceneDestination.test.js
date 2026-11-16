import {afterEach,describe,expect,it,vi} from 'vitest';
import {createSceneDestination} from './changeSceneDestination';
import {resetCompletionSnapshot} from './resetCompletion';
const uuid='2a2a2a2a-2a2a-4a2a-aa2a-2a2a2a2a2a2a';
const snapshot=destination=>({event:{interventionId:'changeScene',action:'completed',exitReason:'completed',completedPercentage:1/6},result:{requireGoalReassessment:true,outcome:{confirmedActions:1,skippedActions:5,handoffToken:destination.handoffToken,privateNote:'must not persist'},navigateTo:destination.navigateTo}});
afterEach(()=>vi.unstubAllGlobals());
describe('secure Scene destinations through the completion checkpoint',()=>{
 it.each(['happyBump','dear2100','different'])('retains generated %s follow-up without randomUUID',target=>{
  const getRandomValues=vi.fn(bytes=>bytes.fill(42));vi.stubGlobal('crypto',{getRandomValues});
  const destination=createSceneDestination(target);
  expect(destination).toEqual({handoffToken:uuid,navigateTo:`/scene-followup?practice=${target}&session=${uuid}`});
  const restored=resetCompletionSnapshot(snapshot(destination),'changeScene');
  expect(restored.result.navigateTo).toBe(destination.navigateTo);
  expect(restored.result.outcome).toEqual({handoffToken:uuid,confirmedActions:1,skippedActions:5});
  expect(restored.event.completedPercentage).toBe(1/6);expect(getRandomValues).toHaveBeenCalledTimes(1);
 });
 it('uses native secure generation and reuses a token during retry without new randomness',()=>{
  const randomUUID=vi.fn(()=>uuid);vi.stubGlobal('crypto',{randomUUID});
  const first=createSceneDestination('happyBump');
  expect(createSceneDestination('different',first.handoffToken).handoffToken).toBe(uuid);
  expect(randomUUID).toHaveBeenCalledTimes(1);
 });
 it.each([null,{}, {getRandomValues(){throw Error('blocked');}}, {randomUUID(){throw Error('blocked');},getRandomValues(){throw Error('must not weaken');}}, {randomUUID(){return 'timestamp';}}])('fails safely rather than fabricating an identifier with %j',crypto=>{
  vi.stubGlobal('crypto',crypto);expect(()=>createSceneDestination('happyBump')).toThrow();
 });
 it('rejects unsupported destinations and weak reused identifiers',()=>{
  vi.stubGlobal('crypto',{randomUUID:()=>uuid});
  expect(()=>createSceneDestination('external')).toThrow();expect(()=>createSceneDestination('happyBump','scene-123')).toThrow();
 });
 it('retains strict privacy validation for weak tokens and injected destination text',()=>{
  const weak={handoffToken:'scene-123',navigateTo:'/scene-followup?practice=happyBump&session=scene-123'};
  const restored=resetCompletionSnapshot(snapshot(weak),'changeScene');
  expect(restored.result.outcome.handoffToken).toBeUndefined();expect(restored.result.navigateTo).toBeUndefined();
  const valid={handoffToken:uuid,navigateTo:`/scene-followup?practice=happyBump&session=${uuid}`};
  for(const navigateTo of [`${valid.navigateTo}&note=private`,`${valid.navigateTo}#private`,`https://external.invalid${valid.navigateTo}`,`/scene-followup?practice=external&session=${uuid}`]){
   expect(resetCompletionSnapshot(snapshot({...valid,navigateTo}),'changeScene').result.navigateTo).toBeUndefined();
  }
 });
});
