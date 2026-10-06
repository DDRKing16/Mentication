import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { confirmedJourneyTakeaway, happyBumpTakeaway, journeyTakeawayId } from './confirmedJourneyTakeaway';
import { takeawayStore, deleteAllLocalAppData } from './localData';

describe('takeaway candidates use confirmed content without inferring outcomes', () => {
  it('does not turn Happy Bump ratings, elapsed time or completion into a note', () => {
    expect(happyBumpTakeaway({scene:'complete',baseline:2,current:8,walkStatus:'done',elapsedBeforePause:100})).toBe('');
  });
  it('carries a chosen activity and optional intent, without claiming it was performed', () => {
    expect(happyBumpTakeaway({nextActivity:' Read a page ',nextMode:'productive',pairing:'Tea',reward:'Rest'}))
      .toBe('My chosen next activity: Read a page\nPair it with: Tea\nAfterward: Rest');
    expect(happyBumpTakeaway({areaAction:'Call a friend',comfortIdea:'Warm mug',customComfortIdea:'Soft blanket'}))
      .toBe('A small step I chose: Call a friend\nA comfort idea I chose: Soft blanket');
  });
  it('does not carry stale productive additions into a relaxing choice', () => {
    expect(happyBumpTakeaway({nextActivity:'Rest',nextMode:'relaxing',pairing:'Work',reward:'Coffee'})).toBe('My chosen next activity: Rest');
  });
  it('carries only known Scene actions the user marked tried', () => {
    expect(confirmedJourneyTakeaway('changeScene',{confirmedActions:99,actions:{1:{choice:'alternative',status:'done'},2:{choice:'primary',status:'chosen'},3:{choice:'primary',status:'skipped'},4:{choice:'primary',status:'done'},5:{choice:'private text',status:'done'}}}))
      .toBe('Changes I marked as tried:\n• I changed position\n• I sent a message');
    expect(confirmedJourneyTakeaway('changeScene',{confirmedActions:6})).toBe('');
  });
  it('keeps the actual PMR setup, skipped areas and uncomfortable answer', () => {
    expect(confirmedJourneyTakeaway('progressive-muscle-relaxation-v2',{type:'pmr',mode:'release',length:'short',skippedRegions:['hands','hands','secret'],tensionResponse:'more_uncomfortable',stopped:true}))
      .toBe('My PMR setup: release only · short session.\nAreas I chose to skip: hands.\nMy tension check-in: More uncomfortable.');
    expect(confirmedJourneyTakeaway('progressive-muscle-relaxation-v2',{type:'other',mode:'release'})).toBe('');
  });
  it('never converts a timer or skipped answer into relief', () => {
    expect(confirmedJourneyTakeaway('progressive-muscle-relaxation-v2',{type:'pmr',completed:true,duration:200,tensionResponse:null})).toBe('');
    expect(confirmedJourneyTakeaway('boxV2',{completion:'completed'})).toBe('');
  });
  it('retains worse grounding feedback and explicit Urge next actions', () => {
    expect(confirmedJourneyTakeaway('grounding54321V2',{presence:'more_unsettled'})).toContain('More unsettled');
    expect(confirmedJourneyTakeaway('urgeSurf',{action:'support'})).toBe('My chosen next step: Reach out for support.');
    expect(confirmedJourneyTakeaway('urgeSurf',{action:'wait',intensityBefore:5,intensityNow:0})).toBe('');
  });
  it('keeps Tapping zero and missing answers on their own authored question/scale', () => {
    const source={mode:'grounding',ratingQuestion:'How intense is the discomfort right now?',ratingMin:0,ratingMax:10,before:0,after:0};
    expect(confirmedJourneyTakeaway('eftTapping',source)).toContain('Before: 0/10 · Now: 0/10');
    expect(confirmedJourneyTakeaway('eftTapping',{...source,before:null,after:4})).toContain('Now: 4/10');
    expect(confirmedJourneyTakeaway('eftTapping',{...source,ratingQuestion:'Shared distress'})).not.toContain('/10');
    expect(confirmedJourneyTakeaway('eftTapping',{...source,before:'0',after:11})).not.toContain('/10');
  });
});

describe('one explicitly saved note per practice in a reset', () => {
  const session='ab3bdaee-1d52-4bdb-a937-d294c543b952';
  const entry=(id,phase='guiding',sessionId=session)=>({usr:{reset_session_id:sessionId,reset_phase:phase,pathway:[id]}});
  it('keeps identity across the practice/final check-in, distinct across sessions and practices', () => {
    const first=journeyTakeawayId('changeScene',entry('changeScene'));
    expect(first).toBe(journeyTakeawayId('changeScene',entry('changeScene','goalReassessment')));
    expect(first).not.toBe(journeyTakeawayId('happyBump',entry('happyBump')));
    expect(first).not.toBe(journeyTakeawayId('changeScene',entry('changeScene','guiding','session-1791290000000')));
  });
  it('does not put private text, other pathways or invalid identities into note IDs', () => {
    for(const input of [null,entry('changeScene','questions'),entry('changeScene','guiding','private thought'),entry('happyBump')])
      expect(journeyTakeawayId('changeScene',input)).toBe(null);
    expect(journeyTakeawayId('unknown',entry('unknown'))).toBe(null);
  });
  beforeEach(() => {
    const map=new Map(); const events=[];
    globalThis.window={localStorage:{get length(){return map.size;},key:n=>[...map.keys()][n],getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)},dispatchEvent:event=>events.push(event.type),__events:events};
    globalThis.CustomEvent=class {constructor(type){this.type=type;}};
  });
  afterEach(() => { delete globalThis.window; delete globalThis.CustomEvent; });
  it('candidate creation alone never saves; explicit saves reuse a note and preserve its creation date', () => {
    const candidate=happyBumpTakeaway({nextActivity:'Synthetic activity'});
    expect(takeawayStore.list()).toEqual([]);
    const id=journeyTakeawayId('happyBump',entry('happyBump'));
    const first=takeawayStore.save({id,interventionId:'happyBump',text:candidate});
    const next=takeawayStore.save({id,interventionId:'happyBump',text:'My edited next step'});
    expect(takeawayStore.list()).toEqual([next]);
    expect(next.createdAt).toBe(first.createdAt);
    expect(window.localStorage.getItem('mentation.sessions.v1')).toBe(null);
  });
  it('notifies mounted views only after a verified write/deletion', () => {
    takeawayStore.save({id:'note',interventionId:'changeScene',text:'Synthetic'});
    expect(window.__events).toEqual(['mentation:takeaways-changed']);
    window.localStorage.setItem=()=>{};
    expect(()=>takeawayStore.delete('note')).toThrow();
    expect(window.__events).toHaveLength(1);
    window.localStorage.removeItem=key=>{};
    expect(()=>deleteAllLocalAppData()).toThrow();
    expect(window.__events).toHaveLength(1);
  });
});
