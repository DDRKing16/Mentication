import {describe,it,expect} from 'vitest';
import {createUrgeSession,reduceUrgeSession,captureUrgeRuntime,restoreUrgeRuntime} from './urgeSurfSession';
const send=(state,type,fields={})=>reduceUrgeSession(state,{type,nowEpochMs:1000,...fields});
describe('Urge Surfing one question navigation',()=>{
  it('keeps optional intensity unanswered through location, sensation, words and duration',()=>{
    let s=send(createUrgeSession(1000),'SETUP_OPENED');
    s=send(s,'NAVIGATE',{route:'urge.body'});
    expect(s.initialIntensity).toBe(null);
    s=send(s,'BODY_REGION_SET',{key:'chest'});
    s=send(s,'NAVIGATE',{route:'urge.sensation'});
    s=send(s,'SENSATION_TOGGLED',{key:'tight'});
    s=send(s,'NAVIGATE',{route:'urge.anchor'});
    s=send(s,'ANCHOR_CHANGED',{value:'My choice'});
    s=send(s,'NAVIGATE',{route:'urge.duration'});
    s=send(s,'NAVIGATE_BACK');
    expect(s).toMatchObject({currentRoute:'urge.anchor',anchorText:'My choice',initialIntensity:null});
    s=send(s,'NAVIGATE_BACK');
    expect(s).toMatchObject({currentRoute:'urge.sensation',bodyRegionKey:'chest',sensationKeys:['tight']});
    s=send(s,'NAVIGATE',{route:'urge.anchor'});s=send(s,'NAVIGATE',{route:'urge.duration'});
    s=send(s,'GUIDED_PRACTICE_STARTED');
    expect(s).toMatchObject({status:'timer_active',initialIntensity:null,anchorText:'My choice'});
  });
  it('normalizes old setup history with missing private anchors to a visible attention question',()=>{
    for(const route of ['urge.sensation','urge.anchor','urge.duration']) {
      expect(send(createUrgeSession(1000),'SCREEN_RESTORED',{route})).toMatchObject({currentRoute:'urge.body',initialIntensity:null,bodyRegionKey:null});
    }
  });

  it('pauses on a setup Back marker without resetting elapsed practice or making a draft timer',()=>{
    let s=send(createUrgeSession(1000),'QUICK_PRACTICE_STARTED');
    s=reduceUrgeSession(s,{type:'SCREEN_RESTORED',route:'urge.name',nowEpochMs:2000});
    expect(s).toMatchObject({status:'timer_paused',currentRoute:'urge.timer',timer:{pausedRemainingMs:59000,totalElapsedMs:0}});
    s=reduceUrgeSession(s,{type:'TIMER_STOPPED',nowEpochMs:2000});
    expect(s.timer.totalElapsedMs).toBe(1000);
    expect(send(s,'SCREEN_RESTORED',{route:'urge.duration'})).toEqual(s);
  });

  it('refreshes each optional post-practice question without leaking private setup content',()=>{
    let s=send(createUrgeSession(1000),'QUICK_PRACTICE_STARTED');
    s=send(s,'TIMER_STOPPED');
    for(const route of ['urge.postRating','urge.choice','urge.feedback','urge.record','urge.takeaway']){
      s=send(s,'OPTIONAL_ROUTE',{route});
      const raw=captureUrgeRuntime({...s,anchorText:'private',bodyRegionKey:'chest'},'test',2000);
      expect(JSON.stringify(raw)).not.toContain('private');
      expect(restoreUrgeRuntime(raw,'test',3000)).toMatchObject({currentRoute:route,initialIntensity:null,postIntensity:null});
    }
  });
});
