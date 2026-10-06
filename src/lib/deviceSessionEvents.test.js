import {describe,expect,it} from 'vitest';
import {subscribeDeviceSessions} from './deviceSessionEvents';
describe('device-history lifecycle',()=>{
 it('refreshes actual same-tab, cross-tab, clearing, focus and visible events and cleans up',()=>{
  const target=new EventTarget(),page=new EventTarget();page.visibilityState='hidden';let count=0;
  const dispose=subscribeDeviceSessions(()=>count++,target,page);
  target.dispatchEvent(new Event('mentation:sessions-changed'));expect(count).toBe(1);
  const storage=key=>{const event=new Event('storage');event.key=key;target.dispatchEvent(event);};
  storage('unrelated');expect(count).toBe(1);storage('mentation.sessions.v1');storage(null);expect(count).toBe(3);
  target.dispatchEvent(new Event('focus'));expect(count).toBe(4);page.dispatchEvent(new Event('visibilitychange'));expect(count).toBe(4);page.visibilityState='visible';page.dispatchEvent(new Event('visibilitychange'));expect(count).toBe(5);
  dispose();target.dispatchEvent(new Event('focus'));target.dispatchEvent(new Event('mentation:sessions-changed'));page.dispatchEvent(new Event('visibilitychange'));expect(count).toBe(5);
 });
});
