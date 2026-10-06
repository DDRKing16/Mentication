import { describe, it, expect } from 'vitest';
import { createBookStore, BOOK_KEY } from './storage.js';
const setup = () => {
  const data = new Map();
  const storage = {getItem:k=>data.get(k) ?? null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  let chain = Promise.resolve();
  const locks={request:(_name,action)=>{const result=chain.then(action);chain=result.catch(()=>{});return result;}};
  const parse = book => {if(!book || ![6,7].includes(book.format))throw Error('format');return {...book,format:7};};
  return {data,storage,store:()=>createBookStore(storage,parse,()=>({format:7}),locks)};
};
describe('Dear 2100 local book protection',()=>{
  it('blocks corrupt and unsupported data without overwriting original',async()=>{
    for(const original of ['broken','{"book":{"format":99},"version":1}','{"book":{"format":7},"version":"bad"}']){
      const {store,storage}=setup();storage.setItem(BOOK_KEY,original);const s=store();await expect(s.load()).rejects.toThrow('not been changed');await expect(s.save({format:7},0)).rejects.toThrow('Nothing was overwritten');expect(storage.getItem(BOOK_KEY)).toBe(original);
    }
  });
  it('serializes simultaneous saves and rejects a stale writer',async()=>{
    const {store,storage}=setup(),a=store(),b=store();await a.load();await b.load();const results=await Promise.allSettled([a.save({format:7,text:'A'},0),b.save({format:7,text:'B'},0)]);expect(results.map(r=>r.status)).toEqual(['fulfilled','rejected']);expect(JSON.parse(storage.getItem(BOOK_KEY)).book.text).toBe('A');
  });
  it('does not recreate a deleted book from a stale tab',async()=>{
    const {store,storage}=setup(),a=store();await a.load();await a.save({format:7},0);const b=store();await b.load();await a.remove();await expect(b.save({format:7,text:'stale'},1)).rejects.toThrow('Nothing was overwritten');expect(storage.getItem(BOOK_KEY)).toBeNull();
  });
  it('keeps original legacy data before writing a migrated book',async()=>{
    const {store,storage}=setup();const original=JSON.stringify({book:{format:6,text:'legacy'},version:4});storage.setItem(BOOK_KEY,original);const a=store();const loaded=await a.load();await a.save(loaded.book,loaded.version);expect(storage.getItem(`${BOOK_KEY}-before-migration`)).toBe(original);expect(JSON.parse(storage.getItem(BOOK_KEY)).version).toBe(5);
  });
  it('backs up unreadable data only on explicit recovery',async()=>{
    const {store,storage,data}=setup();storage.setItem(BOOK_KEY,'broken');await store().recover();expect(storage.getItem(BOOK_KEY)).toBeNull();expect([...data.values()]).toEqual(['broken']);
  });
  it('reports quota failure without changing the expected version',async()=>{
    const {store,storage}=setup(),a=store();await a.load();const write=storage.setItem;storage.setItem=()=>{throw Error('quota')};await expect(a.save({format:7},0)).rejects.toThrow('quota');storage.setItem=write;await expect(a.save({format:7},0)).resolves.toEqual({version:1});
  });
});
