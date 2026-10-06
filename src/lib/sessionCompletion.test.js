import {describe, expect, it, vi} from 'vitest';
import {createSessionCompletion} from './sessionCompletion';

const payload = {id:'same-session',created_date:'2026-10-06T15:00:00.000Z',intensity_end:null,duration_sec:30,attempts:[{intervention_id:'changeScene',completed_percentage:1/6,exit_reason:'completed'}]};
describe('verified session completion handoff', () => {
  it('allows handoff only after the history write resolves', async () => {
    let resolve;
    const write=vi.fn(()=>new Promise(done=>{resolve=done;}));
    const transaction=createSessionCompletion(payload,write);
    const handedOff=vi.fn();
    const result=transaction.save().then(handedOff);
    await Promise.resolve();
    expect(handedOff).not.toHaveBeenCalled();
    resolve({...payload,storage_scope:'device'});
    await result;
    expect(handedOff).toHaveBeenCalledWith({...payload,storage_scope:'device'});
  });
  it('retains the exact original completion for retry without counting retry delay', async () => {
    const write=vi.fn().mockRejectedValueOnce(new Error('Quota')).mockResolvedValue(payload);
    const transaction=createSessionCompletion(payload,write);
    await expect(transaction.save()).rejects.toThrow('Quota');
    await transaction.save();
    expect(write.mock.calls[0][0]).toEqual(write.mock.calls[1][0]);
    expect(transaction.payload).toEqual(payload);
    expect(transaction.payload.intensity_end).toBeNull();
    expect(transaction.payload.attempts[0].completed_percentage).toBe(1/6);
  });
  it('consolidates double taps and never writes again after a verified save', async () => {
    const write=vi.fn().mockResolvedValue(payload);
    const transaction=createSessionCompletion(payload,write);
    const first=transaction.save();
    expect(transaction.save()).toBe(first);
    await first;
    await transaction.save();
    expect(write).toHaveBeenCalledTimes(1);
  });
  it('isolates the confirmed payload from later caller or failed-writer mutations', async () => {
    const original=structuredClone(payload);
    const write=vi.fn().mockImplementationOnce(value=>{value.attempts[0].completed_percentage=1;throw new Error('Quota');}).mockResolvedValue(payload);
    const transaction=createSessionCompletion(original,write);
    original.attempts[0].completed_percentage=0;
    transaction.payload.attempts[0].completed_percentage=0;
    await expect(transaction.save()).rejects.toThrow('Quota');
    await transaction.save();
    expect(write.mock.calls[1][0]).toEqual(payload);
  });
});
