import {ACCESSIBILITY_CHANGED_EVENT} from './accessibilityEvents';
export function subscribeAccessibilityPreferences(refresh,target=window,page=document) {
  const storage=event=>{if(event.key===null||event.key==='haven.a11y.v2')refresh();};
  const visible=()=>{if(page.visibilityState==='visible')refresh();};
  const media=target.matchMedia?.('(prefers-reduced-motion: reduce)');
  target.addEventListener(ACCESSIBILITY_CHANGED_EVENT,refresh);
  target.addEventListener('storage',storage);target.addEventListener('focus',refresh);
  page.addEventListener('visibilitychange',visible);
  media?.addEventListener?.('change',refresh);
  return ()=>{target.removeEventListener(ACCESSIBILITY_CHANGED_EVENT,refresh);target.removeEventListener('storage',storage);target.removeEventListener('focus',refresh);page.removeEventListener('visibilitychange',visible);media?.removeEventListener?.('change',refresh);};
}
