import { describe, it, expect } from 'vitest';
import { checkpointFor, practiceEvent, careCheckpoints, reconcilePracticeEvents } from './practiceCheckpoints';
import { freshCareState } from './carePractices';
describe('earned practice checkpoints',()=>{
 it('does not treat a missing confirmation field as an earned default',()=>{
  expect(practiceEvent('duration','Time chosen','3 minutes',undefined)).toBeNull();
  expect(practiceEvent('duration','Time chosen','3 minutes')).toEqual({id:'duration',label:'Time chosen',detail:'3 minutes'});
 });
 it('reveals at two and four distinct confirmed actions without a dismissal',()=>{
  const e=n=>practiceEvent(String(n),'Confirmed choice',`Choice ${n}`);
  expect(checkpointFor([e(1)]).pairs).toBe(0);
  expect(checkpointFor([e(1),e(2)]).items.map(x=>x.id)).toEqual(['1','2']);
  expect(checkpointFor([e(1),e(2),e(3)]).pairs).toBe(1);
  expect(checkpointFor([e(1),e(2),e(3),e(4)]).items.map(x=>x.id)).toEqual(['3','4']);
 });
 it('does not earn a second checkpoint by repeating, editing, or skipping',()=>{
  const a=practiceEvent('a','Chosen','first');
  expect(checkpointFor([a,a,practiceEvent('skip','Skipped','x',false)]).count).toBe(1);
  expect(checkpointFor([a,practiceEvent('a','Edited','updated')]).all[0].detail).toBe('updated');
 });
 it('does not count defaults, help, an open editor, or raw click counts as care practice',()=>{
  const s={...freshCareState(), clicks:20, notice:'Still typing', careTrail:['intro','options','before','notice-own']};
  expect(checkpointFor(careCheckpoints('selfCompassion',{...s,careTrail:['intro','options','before']})).count).toBe(0);
  const chosen={...s,before:0,noticeConfirmed:true,careTrail:['intro','before','notice']};
  expect(checkpointFor(careCheckpoints('selfCompassion',chosen)).pairs).toBe(1);
  expect(checkpointFor(careCheckpoints('selfCompassion',chosen)).items[0].detail).toBe('0 / 10');
 });
 it('distinguishes an action plan from a completed action and unchanged ratings',()=>{
  const s={...freshCareState(),action:'Get water',actionStatus:'planned',before:6,after:6};
  const events=careCheckpoints('makeRoom',s).filter(Boolean);
  expect(events.find(x=>x.id==='status').detail).toContain('plan');
  expect(events.find(x=>x.id==='after').detail).toBe('6 / 10');
  expect(events.some(x=>x.id==='try')).toBe(false);
 });
});

describe('care route chronology',()=>{
 it('keeps Unhook action and anchor together without changing the earlier tried pair',()=>{
  const s={...freshCareState(),before:6,notice:'A thought',noticeConfirmed:true,perspective:'I notice a thought',responseConfirmed:true,practiceTaken:true,action:'Get water',actionConfirmed:true};
  const before=checkpointFor(careCheckpoints('unhook',s));
  const after=checkpointFor(careCheckpoints('unhook',{...s,anchorType:'object'}));
  expect(before.all.map(e=>e.id)).toEqual(['before','notice','response','try','action']);
  expect(after.items.map(e=>e.id)).toEqual(['action','anchor']);
  expect(after.all.slice(2,4)).toEqual(before.items);
 });
});


describe('checkpoint evidence ordering', () => {
 const e = id => practiceEvent(id, 'Confirmed', id);
 it('appends a later optional answer without changing an already-earned pair', () => {
  const previous = [e('first'), e('second'), e('fourth')];
  const next = reconcilePracticeEvents(previous, [e('first'), e('second'), e('optional'), e('fourth')]);
  expect(next.map(item => item.id)).toEqual(['first', 'second', 'fourth', 'optional']);
  expect(checkpointFor(next).items.map(item => item.id)).toEqual(['fourth', 'optional']);
 });
 it('removes undone evidence and updates edits without creating an extra event', () => {
  const next = reconcilePracticeEvents([e('a'), e('b')], [practiceEvent('a', 'Edited', 'new words'), null]);
  expect(next).toEqual([practiceEvent('a', 'Edited', 'new words')]);
  expect(checkpointFor(next).pairs).toBe(0);
 });
});
