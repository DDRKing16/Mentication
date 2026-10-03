import React, { useEffect, useRef, useState } from 'react';

// The home document is a self-contained static HTML asset (public/home.html,
// built from design/home-source). Serving it as `src` lets the browser stream
// and parse it directly — no JS bundle chunk carries the document anymore.
const homeSrc = `${import.meta.env.BASE_URL}home.html`;

const routes = new Set([
  'lift', 'focus', 'calm', 'ground', 'sleep', 'guide', 'begin',
  'seven-calmer-days', 'restructure', 'journal', 'good-map', 'dear-2100',
  'library', 'my-plan', 'profile', 'insights', 'settings', 'recommended'
]);

/**
 * Isolated adapter for an existing React / Base44 host.
 * onNavigate receives a route ID, never an untrusted URL.
 * The host supplies its existing navigation function, authoritative week state
 * and — for returning users — the "Your reset for today" card payload.
 * No database, authentication, router package, or page names are assumed.
 */
export default function HomeFrame({ onNavigate, week = { currentDay: null, completedDays: [] }, today = null }) {
  const frame = useRef(null);
  const callbacks = useRef({ onNavigate, week, today });
  callbacks.current = { onNavigate, week, today };
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
        setReady(true);
        send('week', { week: callbacks.current.week });
        if (callbacks.current.today) send('today', { today: callbacks.current.today });
        reportViewport();
      } else if (data.type === 'height' && Number.isFinite(data.height) && data.height > 0 && data.height < 20000) {
        setHeight(Math.ceil(data.height));
      } else if (data.type === 'home') {
        frame.current?.scrollIntoView({ block: 'start', behavior: data.reduceMotion ? 'instant' : 'smooth' });
      } else if (data.type === 'navigate' && routes.has(data.route)) {
        Promise.resolve().then(() => callbacks.current.onNavigate(data.route)).catch(() => {
          setError('This experience could not open. Please try again.');
        });
      } else if (data.type === 'error') {
        setError('Weekly progress could not be displayed.');
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

  if (typeof onNavigate !== 'function') {
    throw new TypeError('HomeFrame requires the host onNavigate(routeId) function.');
  }
  return (
    <section aria-label="MentiCation home" style={{ background: '#49392f', minHeight: '100svh' }}>
      {error && <p role="alert" style={{ color: '#fff4e9', padding: '12px 20px', margin: 0 }}>{error}</p>}
      <iframe
        ref={frame}
        title="MentiCation home"
        src={homeSrc}
        allow="autoplay"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        onLoad={() => { setReady(false); send('connect'); }}
        style={{ display: 'block', width: '100%', height, border: 0, maxWidth: 949, margin: '0 auto' }}
      />
    </section>
  );
}
