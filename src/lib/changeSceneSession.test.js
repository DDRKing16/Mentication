import { describe,it,expect } from 'vitest';
import {restoreSceneSession,sceneAction,sceneOutcome,SCENE_ACTIONS} from './changeSceneSession';
describe('Change Scene confirmed actions',()=>{
  it('restores valid records and rejects old fabricated completion fields',()=>{
    expect(restoreSceneSession({step:99,completedStep:8,selectedTaskChoice:{1:'primary'}})).toEqual({step:7,actions:{},helpfulness:null});
    expect(restoreSceneSession({step:-1,actions:{1:{choice:'invented',status:'done'}}})).toEqual({step:0,actions:{},helpfulness:null});
  });
  it.each(SCENE_ACTIONS.map((_,i)=>[i+1]))('keeps choice, done, undo, skip and refresh separate for action %i',step=>{
    let s=restoreSceneSession(null);
    s=sceneAction(s,step,'alternative');expect(sceneOutcome(s).confirmedActions).toBe(0);
    s=sceneAction(s,step,'done');expect(sceneOutcome(s).confirmedActions).toBe(1);
    s=restoreSceneSession(JSON.parse(JSON.stringify(s)));expect(s.actions[step]).toEqual({choice:'alternative',status:'done'});
    s=sceneAction(s,step,'undo');expect(sceneOutcome(s).confirmedActions).toBe(0);
    s=sceneAction(s,step,'skip');expect(sceneOutcome(s).skippedActions).toBe(1);
    s=sceneAction(s,step,'primary');expect(sceneOutcome(s).skippedActions).toBe(0);
  });
  it('does not double-count repeat confirmations',()=>{
    let s=restoreSceneSession(null);s=sceneAction(s,1,'done');s=sceneAction(s,1,'done');expect(sceneOutcome(s).confirmedActions).toBe(1);
  });
  it('retains explicit unchanged feedback and leaves missing feedback null',()=>{
    expect(restoreSceneSession({helpfulness:'same'}).helpfulness).toBe('same');expect(restoreSceneSession({helpfulness:0}).helpfulness).toBeNull();
  });
});
