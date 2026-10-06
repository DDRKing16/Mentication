export const DEVICE_SESSION_KEY = 'mentation.sessions.v1';
// Refresh only from actual local lifecycle changes. No network, polling or text.
export function subscribeDeviceSessions(refresh, target=globalThis.window, page=globalThis.document) {
  const storage=event=>{if(event.key===null || event.key===DEVICE_SESSION_KEY)refresh();};
  const visible=()=>{if(page.visibilityState==='visible')refresh();};
  target.addEventListener('mentation:sessions-changed',refresh);
  target.addEventListener('storage',storage);
  target.addEventListener('focus',refresh);
  page.addEventListener('visibilitychange',visible);
  return ()=>{
    target.removeEventListener('mentation:sessions-changed',refresh);
    target.removeEventListener('storage',storage);
    target.removeEventListener('focus',refresh);
    page.removeEventListener('visibilitychange',visible);
  };
}
