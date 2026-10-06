import {describe,it,expect} from 'vitest';
import {readRecordList,writeVerified} from '../lib/verifiedStorage';
function archive(initial){let value=initial;return {getItem:()=>value,setItem:(_,next)=>{value=next;}};}
describe("Journal's saved daybook fails safely",()=>{
 it('refuses unreadable containers and retains the exact stored content',()=>{
  for(const raw of ['broken','{}','[null]','[{"note":"missing id"}]']){const store=archive(raw);expect(()=>readRecordList(store,'daybook')).toThrow();expect(store.getItem('daybook')).toBe(raw);}
 });
 it('round-trips genuine supplied entries including long private wording',()=>{
  const store=archive(null),entries=[{id:'synthetic',anchor:'Synthetic reflection '.repeat(100)}];writeVerified(store,'daybook',JSON.stringify(entries));expect(readRecordList(store,'daybook')).toEqual(entries);
 });
 it('rejects silent save and delete-list writes without replacing the old archive',()=>{
  const original='[{"id":"existing","anchor":"Synthetic existing entry"}]',store=archive(original);store.setItem=()=>{};
  expect(()=>writeVerified(store,'daybook','[]')).toThrow('confirm');expect(()=>writeVerified(store,'daybook','[{"id":"new"}]')).toThrow('confirm');expect(store.getItem('daybook')).toBe(original);
 });
});
