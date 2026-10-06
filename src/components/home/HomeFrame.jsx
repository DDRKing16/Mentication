import React, { useEffect, useRef, useState } from 'react';
import { handoffHomeAmbient, resumeHomeAmbient } from '@/lib/homeAmbient';

// The home document is a self-contained static HTML asset (public/home.html,
// built from design/home-source). Serving it as `src` lets the browser stream
// and parse it directly — no JS bundle chunk carries the document anymore.
const homeSrc = `${import.meta.env.BASE_URL}home.html`;

const ambientResetRoutes = new Set(['lift', 'focus', 'calm', 'ground', 'sleep', 'guide', 'begin', 'recommended']);

const routes = new Set([
  'lift', 'focus', 'calm', 'ground', 'sleep', 'guide', 'begin',
  'seven-calmer-days', 'restructure', 'foundations', 'journal', 'good-map', 'dear-2100', 'palace',
  'library', 'my-plan', 'profile', 'insights', 'settings', 'recommended', 'parking-lot', 'return-points'
]);

/**
 * Isolated adapter for an existing React / Base44 host.
 * onNavigate receives a route ID, never an untrusted URL.
 * The host supplies its existing navigation function, authoritative week state
 * and — for returning users — the "Your reset for today" card payload.
 * No database, authentication, router package, or page names are assumed.
 */
export default function HomeFrame({ onNavigate, week = { currentDay: null, completedDays: [] }, today = null, palace = null, journal = null, more = null, parking = false }) {
  const frame = useRef(null);
  const callbacks = useRef({ onNavigate, week, today, palace, journal, more, parking });
  callbacks.current = { onNavigate, week, today, palace, journal, more, parking };
  const bridgeId = useRef(null);
  const [height, setHeight] = useState(1700);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

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
    bridgeId.current = crypto.randomUUID();
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
        // Show controls after the document reports its hydrated layout.
        send('parking', { parking: callbacks.current.parking });
        send('week', { week: callbacks.current.week });
        if (callbacks.current.today) send('today', { today: callbacks.current.today });
        if (callbacks.current.palace) send('palace', { palace: callbacks.current.palace });
        if (callbacks.current.journal) send('journal', { journal: callbacks.current.journal });
        if (callbacks.current.more) send('more', { more: callbacks.current.more });
        reportViewport();
      } else if (data.type === 'height' && Number.isFinite(data.height) && data.height > 0 && data.height < 20000) {
        setHeight(Math.ceil(data.height));
        setReady(true);
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
  }, []);

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

  useEffect(() => { if (ready) send('parking', { parking }); }, [parking, ready]);

  if (typeof onNavigate !== 'function') {
    throw new TypeError('HomeFrame requires the host onNavigate(routeId) function.');
  }
  return (
    <section aria-busy={!ready} aria-label="MentiCation home" style={{ background: '#49392f', minHeight: '100svh' }}>
      {!ready && <p role="status" style={{ color: '#fff4e9', padding: '12px 20px' }}>Loading home…</p>}
      {error && <p role="alert" style={{ color: '#fff4e9', padding: '12px 20px', margin: 0 }}>{error}</p>}
      <iframe
        ref={frame}
        title="MentiCation home"
        aria-hidden={!ready}
        {...(!ready ? { inert: "" } : {})}
        src={homeSrc}
        allow="autoplay"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => { setReady(false); send('connect'); }}
        style={{ opacity: ready ? 1 : 0, pointerEvents: ready ? 'auto' : 'none', display: 'block', width: '100%', height, border: 0, maxWidth: 949, margin: '0 auto' }}
      />
    </section>
  );
}
