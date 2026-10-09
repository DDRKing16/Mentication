import { describe, it, expect } from 'vitest';
import { recordTappingProgress as record } from './tappingCheckpoints';
import { checkpointFor } from '@/lib/practiceCheckpoints';
import { TAPPING_POINTS } from './tappingProtocol';
describe('tapping evidence ledger', () => {
  it('pairs a chosen focus and confirmed zero without counting settings or skipping', () => {
    let events = record([], {type:'focus',concern:'grounding'});
    for (const type of ['back','mute','pause','skip','start']) events = record(events,{type});
    expect(checkpointFor(events).pairs).toBe(0);
    events = record(events,{type:'rating',id:'before',value:0});
    expect(checkpointFor(events).pairs).toBe(1);
    expect(events[1].detail).toBe('0 / 10');
    expect(record(events,{type:'rating',id:'before',value:4})).toHaveLength(2);
    expect(record(events,{type:'rating',id:'before',value:null})).toHaveLength(1);
  });
  it('counts each elapsed point once per round, preserving order through restore', () => {
    let events = [];
    for (const point of TAPPING_POINTS) {
      events = record(events,{type:'point',point:point.id,round:1});
      events = record(JSON.parse(JSON.stringify(events)),{type:'point',point:point.id,round:1});
    }
    expect(events).toHaveLength(9);
    expect(checkpointFor(events).pairs).toBe(4);
    expect(events.every(item=>item.detail.startsWith('Guidance elapsed.'))).toBe(true);
    expect(record(events,{type:'point',point:TAPPING_POINTS[0].id,round:2})).toHaveLength(10);
    expect(record(events,{type:'point',point:TAPPING_POINTS[0].id,round:2,skipped:true})).toHaveLength(9);
  });
});
