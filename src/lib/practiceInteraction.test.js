import { describe, expect, it } from 'vitest';
import { createProgressGate, clearPracticeDraft } from './practiceInteraction';
describe('practice interaction boundaries',()=>{
 it('accepts one progress interaction per deliberate tap, not a double tap on a replacement screen',()=>{
  const accept=createProgressGate();
  expect(accept(0)).toBe(true);expect(accept(0)).toBe(false);expect(accept(100)).toBe(false);expect(accept(250)).toBe(true);
 });
 it('checks draft deletion and preserves another intervention',()=>{
  let raw=JSON.stringify({interventionId:'mine'});
  const storage={getItem:()=>raw,removeItem:()=>{raw=null;}};
  expect(clearPracticeDraft(storage,'other')).toBe(true);expect(raw).not.toBeNull();
  expect(clearPracticeDraft(storage,'mine')).toBe(true);expect(raw).toBeNull();
 });
 it('does not report completion after a denied, silently ignored, or unreadable deletion',()=>{
  const getItem=()=>JSON.stringify({interventionId:'mine'});
  expect(clearPracticeDraft({getItem,removeItem:()=>{throw Error('denied')}},'mine')).toBe(false);
  expect(clearPracticeDraft({getItem,removeItem:()=>{}},'mine')).toBe(false);
  expect(clearPracticeDraft({getItem:()=>'{broken',removeItem:()=>{}},'mine')).toBe(false);
 });
});
