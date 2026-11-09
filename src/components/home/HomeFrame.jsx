import React, { useEffect, useMemo, useRef, useState } from 'react';
import { watchHomeLoad } from './homeLoadWatchdog';
import { createSecureId } from '@/lib/secureId';
import { useAccessibilityPrefs } from '@/hooks/useAccessibilityPrefs';
import { useAccessibility } from '@/lib/accessibility';
import { homeAccessibilityState, saveHomeAccessibilityPreference } from '@/lib/homeAccessibility';
import { notifyAccessibilityPreferencesChanged } from '@/lib/accessibilityEvents';
import { handoffHomeAmbient, resumeHomeAmbient } from '@/lib/homeAmbient';

// The home document is a self-contained static HTML asset (public/home.html,
// built from design/home-source). Serving it as `src` lets the browser stream
// and parse it directly — no JS bundle chunk carries the document anymore.
const homeSrc = `${import.meta.env.BASE_URL}home.html`;

const ambientResetRoutes = new Set(['lift', 'focus', 'calm', 'ground', 'sleep', 'guide', 'begin', 'recommended']);

const routes = new Set([
  'lift', 'focus', 'calm', 'ground', 'sleep', 'guide', 'restore', 'begin',
  'seven-calmer-days', 'restructure', 'foundations', 'journal', 'good-map', 'dear-2100', 'palace',
  'support', 'library', 'my-plan', 'profile', 'insights', 'settings', 'recommended', 'parking-lot', 'return-points'
]);

/**
 * Isolated adapter for an existing React / Base44 host.
 * onNavigate receives a route ID, never an untrusted URL.
 * The host supplies its existing navigation function, authoritative week state
 * and — for returning users — the "Your reset for today" card payload.
 * No database, authentication, router package, or page names are assumed.
 */
export default function HomeFrame({ onNavigate, week = { currentDay: null, completedDays: [] }, today = null, palace = null, journal = null, more = null, parking = false, wellness = null, onWellnessAction = null }) {
  const { prefs } = useAccessibilityPrefs();
  const textSize = useAccessibility();
  const accessibility = useMemo(() => homeAccessibilityState(prefs, textSize?.textScale), [prefs, textSize?.textScale]);
  const frame = useRef(null);
  const callbacks = useRef({ onNavigate, week, today, palace, journal, more, parking, wellness, onWellnessAction, accessibility });
  callbacks.current = { onNavigate, week, today, palace, journal, more, parking, wellness, onWellnessAction, accessibility };
  const bridgeId = useRef(null);
  const loaded = useRef(false);
  const [height, setHeight] = useState(1700);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => watchHomeLoad({ ready, onTimeout: () => setLoadFailed(true) }), [ready, attempt]);
  function retryHome() {
    loaded.current = false; bridgeId.current = null;
    setReady(false); setLoadFailed(false); setError('');
    setAttempt(value => value + 1);
  }
  function openFallback(route) {
    Promise.resolve().then(() => callbacks.current.onNavigate(route)).catch(() => {
      setError('This page could not open. Please try again.');
    });
  }

  function send(type, extra = {}) {
    if (!frame.current?.contentWindow || !bridgeId.current) return;
    // The iframe is deliberately sandboxed to an opaque origin. Its WindowProxy
    // and per-mount token identify it; only route IDs / layout metadata cross it.
    frame.current.contentWindow.postMessage({
      namespace: 'mentication-host', version: 1, type,
      bridgeId: bridgeId.current, parentOrigin: window.location.origin, ...extra
    }, '*');
  }

  useEffect(() => {
    bridgeId.current = createSecureId();
    let viewportFrame = 0;
    function reportViewport() {
      cancelAnimationFrame(viewportFrame);
      viewportFrame = requestAnimationFrame(() => {
        const rect = frame.current?.getBoundingClientRect();
        if (!rect) return;
        const top = Math.max(0, -rect.top);
        const bottom = Math.min(rect.height, window.innerHeight - rect.top);
        send('viewport', { top, height: Math.max(1, bottom - top) });
      });
    }
    function receive(event) {
      const data = event.data;
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null' ||
          !data || data.namespace !== 'mentication-home' || data.version !== 1 ||
          data.bridgeId !== bridgeId.current) return;
      if (data.type === 'ready') {
        send('accessibility', { preferences: callbacks.current.accessibility });
        // Show controls after the document reports its hydrated layout.
        if (callbacks.current.wellness) send('wellness', { wellness: callbacks.current.wellness });
        send('parking', { parking: callbacks.current.parking });
        send('week', { week: callbacks.current.week });
        if (callbacks.current.today) send('today', { today: callbacks.current.today });
        if (callbacks.current.palace) send('palace', { palace: callbacks.current.palace });
        if (callbacks.current.journal) send('journal', { journal: callbacks.current.journal });
        if (callbacks.current.more) send('more', { more: callbacks.current.more });
        reportViewport();
      } else if (data.type === 'height' && Number.isFinite(data.height) && data.height > 0 && data.height < 20000) {
        setHeight(Math.ceil(data.height));
        // The child can measure itself before its load event. Wait until the
        // load handshake so that a late onLoad cannot disable a first tap.
        if (loaded.current) { setReady(true); setLoadFailed(false); }
      } else if (data.type === 'accessibility-change') {
        let result;
        try { result = saveHomeAccessibilityPreference(data.name, data.value); }
        catch { result = { ok: false }; }
        if (result.ok) notifyAccessibilityPreferencesChanged();
        send('accessibility', { preferences: result.preferences || callbacks.current.accessibility, saved: result.ok });
      } else if (data.type === 'wellness-action' &&
          ['connect', 'sync', 'disconnect'].includes(data.action) &&
          callbacks.current.wellness?.sources?.some(source => source.id === data.provider && source.status !== 'setup')) {
        Promise.resolve(callbacks.current.onWellnessAction?.({
          action: data.action, provider: data.provider, consent: data.consent === true,
        })).catch(() => setError('Your wellness connection could not be updated.'));
      } else if (data.type === 'home') {
        frame.current?.scrollIntoView({ block: 'start', behavior: data.reduceMotion ? 'instant' : 'smooth' });
      } else if (data.type === 'ambient-start') {
        resumeHomeAmbient();
      } else if (data.type === 'navigate' && routes.has(data.route)) {
        if (ambientResetRoutes.has(data.route) && data.ambient?.playing) {
          handoffHomeAmbient({ currentTime: data.ambient.currentTime, volume: data.ambient.volume });
        }
        Promise.resolve().then(() => callbacks.current.onNavigate(data.route)).catch(() => {
          setError('This experience could not open. Please try again.');
        });
      } else if (data.type === 'error') {
        if (data.code === 'INVALID_MORE') setError('Your cards could not be updated.');
        else if (data.code !== 'INVALID_PALACE') setError('Weekly progress could not be displayed.');
      }
    }
    window.addEventListener('message', receive);
    window.addEventListener('scroll', reportViewport, { passive: true, capture: true });
    window.addEventListener('resize', reportViewport);
    // Covers both a fast iframe load and the normal onLoad path.
    send('connect');
    return () => {
      window.removeEventListener('message', receive);
      window.removeEventListener('scroll', reportViewport, true);
      window.removeEventListener('resize', reportViewport);
      cancelAnimationFrame(viewportFrame);
    };
  }, [attempt]);

  useEffect(() => {
    if (ready) send('week', { week });
  }, [week, ready]);

  useEffect(() => {
    if (ready && today) send('today', { today });
  }, [today, ready]);

  useEffect(() => {
    if (ready && palace) send('palace', { palace });
  }, [palace, ready]);

  useEffect(() => {
    if (ready && journal) send('journal', { journal });
  }, [journal, ready]);

  useEffect(() => {
    if (ready && more) send('more', { more });
  }, [more, ready]);

  useEffect(() => { if (ready) send('accessibility', { preferences: accessibility }); }, [accessibility, ready]);

  useEffect(() => { if (ready && wellness) send('wellness', { wellness }); }, [wellness, ready]);

  useEffect(() => { if (ready) send('parking', { parking }); }, [parking, ready]);

  if (typeof onNavigate !== 'function') {
    throw new TypeError('HomeFrame requires the host onNavigate(routeId) function.');
  }
  return (
    <section aria-busy={!ready && !loadFailed} aria-label="MentiCation home" style={{ background: '#49392f', minHeight: '100svh' }}>
      {!ready && !loadFailed && <p role="status" style={{ color: '#fff4e9', padding: '12px 20px' }}>Loading home…</p>}
      {!ready && loadFailed && <div role="alert" className="mx-auto max-w-lg px-5 py-12" style={{ color: '#fff4e9' }}>
        <h2 className="font-heading text-2xl">Home could not finish loading</h2>
        <p className="mt-3">Try again, or open your practices and settings directly.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={retryHome} className="min-h-11 rounded-full border border-current px-5 py-3">Retry home</button>
          <button type="button" onClick={() => openFallback('library')} className="min-h-11 rounded-full border border-current px-5 py-3">Open practices</button>
          <button type="button" onClick={() => openFallback('settings')} className="min-h-11 rounded-full border border-current px-5 py-3">Open settings</button>
          <button type="button" onClick={() => openFallback('support')} className="min-h-11 rounded-full border border-current px-5 py-3">Urgent support</button>
        </div>
      </div>}
      {error && <p role="alert" style={{ color: '#fff4e9', padding: '12px 20px', margin: 0 }}>{error}</p>}
      <iframe
        key={attempt}
        ref={frame}
        title="MentiCation home"
        aria-hidden={!ready}
        {...(!ready ? { inert: "" } : {})}
        src={homeSrc}
        allow="autoplay"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        onError={() => setLoadFailed(true)}
        onLoad={() => { loaded.current = true; setReady(false); send('connect'); }}
        style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none', display: 'block', width: '100%', height: loadFailed && !ready ? 0 : height, border: 0, maxWidth: 949, margin: '0 auto' }}
      />
    </section>
  );
}
