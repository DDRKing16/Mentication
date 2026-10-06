import {expect,it} from 'vitest';
import {subscribeAccessibilityPreferences} from './accessibilitySubscription';
it('responds to owned preference and OS changes then removes all listeners',()=>{
 const target=new EventTarget(),page=new EventTarget(),media=new EventTarget();target.matchMedia=()=>media;page.visibilityState='visible';let count=0;
 const dispose=subscribeAccessibilityPreferences(()=>count++,target,page);
 const event=new Event('storage');event.key='haven.a11y.v2';target.dispatchEvent(event);target.dispatchEvent(new Event('mentation:accessibility-changed'));media.dispatchEvent(new Event('change'));target.dispatchEvent(new Event('focus'));page.dispatchEvent(new Event('visibilitychange'));expect(count).toBe(5);
 dispose();target.dispatchEvent(event);media.dispatchEvent(new Event('change'));target.dispatchEvent(new Event('focus'));page.dispatchEvent(new Event('visibilitychange'));expect(count).toBe(5);
});
