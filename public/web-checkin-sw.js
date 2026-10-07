/* Dedicated opt-in worker: no fetch handler and no caching of personal data. */
const ID = /^[a-f0-9-]{36}$/;
function state(mode, value) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('mentation-web-checkins', 1);
    open.onupgradeneeded = () => open.result.createObjectStore('state');
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction('state', mode);
      const store = tx.objectStore('state');
      const request = mode === 'readonly' ? store.get('active') : store.put(value, 'active');
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
  });
}
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type !== 'web-checkin-state' || !event.source?.url || new URL(event.source.url).origin !== self.location.origin) return;
  const active = event.data.active;
  if (active !== null && (!ID.test(active?.planId) || !Number.isSafeInteger(active?.endsAt))) return;
  event.waitUntil((async () => {
    await state('readwrite', active === null ? null : { planId: active.planId, endsAt: active.endsAt });
    for (const notification of await self.registration.getNotifications()) {
      if (notification.tag?.startsWith('web-checkin:')) notification.close();
    }
    event.ports[0]?.postMessage({ ok: true });
  })().catch(() => event.ports[0]?.postMessage({ ok: false })));
});
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    let data;
    try { data = event.data?.json(); } catch { return; }
    if (!ID.test(data?.planId) || !Number.isSafeInteger(data?.expiresAt) || data.expiresAt <= Date.now()) return;
    const active = await state('readonly');
    if (active?.planId !== data.planId || active.endsAt < Date.now()) return;
    await self.registration.showNotification('Mentication', {
      body: 'A check-in is ready. Open Mentication when you’re ready.',
      tag: `web-checkin:${data.planId}`, data: { planId: data.planId },
      icon: '/media/brand/mentation-primary.png',
    });
  })());
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const planId = event.notification.data?.planId;
    if (!ID.test(planId)) return;
    const active = await state('readonly');
    // Stale or cancelled taps lead to the app, never resurrect a plan.
    const url = new URL('/', self.location.origin);
    if (active?.planId === planId && active.endsAt >= Date.now()) url.hash = `web-checkin=${planId}`;
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === url.origin);
    if (existing) { await existing.navigate(url.href); await existing.focus(); }
    else await self.clients.openWindow(url.href);
  })());
});
