/* MentiCation home. No dependencies, tracking, remote fonts, or account data. */
(() => {
  'use strict';
  const root = document.documentElement;
  const ROUTES = Object.freeze({
    home: 'Home', lift: 'Lift', focus: 'Focus', calm: 'Calm', ground: 'Ground', sleep: 'Sleep',
    guide: 'Guide me', begin: 'Begin', 'seven-calmer-days': '7 calmer days',
    restructure: 'Restructure', journal: 'Check in with yourself',
    'good-map': 'See what makes life feel good', 'dear-2100': 'Go after what you’ve avoided',
    library: 'Library', 'my-plan': 'My Plan', profile: 'Profile', insights: 'Insights', settings: 'Settings'
  });
  const preferenceKey = 'mentication.home.accessibility.v1';
  const preferenceNames = ['large-text', 'high-contrast', 'reduce-motion'];
  let navigateHandler = null;
  let storageAvailable = true;
  let bridgeConnected = false;
  let parentOrigin = null;
  let bridgeId = null;
  let activeOpener = null;
  let resizeFrame = 0;
  const prefersStillness = () => root.dataset.reduceMotion === 'true' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const status = document.getElementById('status');
  const track = document.getElementById('more-track');
  const previous = document.getElementById('more-previous');
  const next = document.getElementById('more-next');

  function readPreferences() {
    try { return JSON.parse(localStorage.getItem(preferenceKey) || '{}') || {}; }
    catch { storageAvailable = false; return {}; }
  }
  function applyPreferences(preferences) {
    preferenceNames.forEach(name => {
      const value = preferences[name] === true;
      root.setAttribute(`data-${name}`, String(value));
      document.getElementById(name).checked = value;
    });
    refreshCarousel();
    reportHeight();
  }
  function savePreferences() {
    const preferences = Object.fromEntries(preferenceNames.map(name => [name, document.getElementById(name).checked]));
    applyPreferences(preferences);
    try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); }
    catch {
      storageAvailable = false;
      document.getElementById('preference-note').textContent = 'Your preferences apply while this page is open.';
    }
  }
  function openDialog(id, opener) {
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    activeOpener = opener || document.activeElement;
    document.getElementById(id).showModal();
  }
  function closeDialog(dialog) {
    if (dialog.open) dialog.close();
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) closeDialog(dialog);
      if (event.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
      }
    });
    dialog.addEventListener('close', () => {
      if (!document.querySelector('dialog[open]') && activeOpener?.isConnected) activeOpener.focus({ preventScroll: true });
      reportHeight();
    });
  });
  document.getElementById('menu-open').addEventListener('click', event => openDialog('menu-dialog', event.currentTarget));
  document.getElementById('accessibility-open').addEventListener('click', event => openDialog('accessibility-dialog', event.currentTarget));
  preferenceNames.forEach(name => document.getElementById(name).addEventListener('change', savePreferences));

  function sendBridge(type, payload = {}) {
    if (window.parent === window || !bridgeConnected || !parentOrigin || !bridgeId) return;
    window.parent.postMessage({ namespace: 'mentication-home', version: 1, bridgeId, type, ...payload }, parentOrigin);
  }
  function showDestinationPreview(route, opener) {
    document.getElementById('destination-title').textContent = ROUTES[route];
    openDialog('destination-dialog', opener);
  }
  function navigate(route, opener) {
    if (!Object.hasOwn(ROUTES, route)) return;
    if (route === 'home') {
      document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
      window.scrollTo({ top: 0, behavior: prefersStillness() ? 'instant' : 'smooth' });
      if (bridgeConnected) sendBridge('home', { reduceMotion: prefersStillness() });
      status.textContent = 'Home';
      return;
    }
    document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());
    // Host callbacks own the destination. Opening an experience never completes a day.
    if (navigateHandler) {
      try {
        const result = navigateHandler(route);
        Promise.resolve(result).catch(() => { status.textContent = 'This experience could not open. Please try again.'; });
      } catch { status.textContent = 'This experience could not open. Please try again.'; }
      return;
    }
    const event = new CustomEvent('mentication:navigate', { bubbles: true, cancelable: true, detail: { route, label: ROUTES[route] } });
    if (!window.dispatchEvent(event)) return;
    if (bridgeConnected) { sendBridge('navigate', { route }); return; }
    showDestinationPreview(route, opener);
  }
  // Lava-lamp layer drawn inside each goal's own clip shape, so only the blob lights up.
  const SVG_NS = 'http://www.w3.org/2000/svg';
  // Squash ratios vary per ball so each one reads as a blob, not a circle.
  const LAVA_BALLS = [
    { x: .28, r: 22, squash: 1.35, dur: 6.2, delay: 0 },
    { x: .62, r: 15, squash: .78, dur: 5.1, delay: -2.4 },
    { x: .80, r: 11, squash: 1.25, dur: 4.4, delay: -1.1 },
    { x: .44, r: 9, squash: 1.08, dur: 3.8, delay: -3.2 }
  ];
  // Each card's balls take a deep shade of the card's own colour, via multiply.
  const BALL_COLOURS = {
    lift: '#c96a2e', focus: '#3f6fd1', calm: '#7d55bd',
    ground: '#3f8f52', sleep: '#4a7fd9', guide: '#c08a2d'
  };
  document.querySelectorAll('.goal .artwork g[clip-path]').forEach(group => {
    const { width, height } = group.ownerSVGElement.viewBox.baseVal;
    const colour = BALL_COLOURS[group.closest('.goal').dataset.route];
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('class', 'lava-glow');
    glow.setAttribute('width', width);
    glow.setAttribute('height', height);
    group.append(glow);
    LAVA_BALLS.forEach(ball => {
      const blob = document.createElementNS(SVG_NS, 'ellipse');
      blob.setAttribute('class', 'lava-ball');
      blob.setAttribute('fill', colour);
      blob.setAttribute('cx', ball.x * width);
      blob.setAttribute('cy', -ball.r * 1.6);
      blob.setAttribute('rx', ball.r);
      blob.setAttribute('ry', ball.r * ball.squash);
      blob.style.setProperty('--dur', `${ball.dur}s`);
      blob.style.setProperty('--delay', `${ball.delay}s`);
      group.append(blob);
    });
  });

  document.querySelectorAll('[data-route]').forEach(button => button.addEventListener('click', () => {
    // Goal blobs play a short lava-lamp pulse before the destination opens;
    // skipped when the visitor prefers stillness.
    if (button.classList.contains('goal') && !prefersStillness()) {
      button.classList.add('is-blobbing');
      setTimeout(() => {
        button.classList.remove('is-blobbing');
        navigate(button.dataset.route, button);
      }, 460);
      return;
    }
    navigate(button.dataset.route, button);
  }));

  function refreshCarousel() {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = max < 2 || track.scrollLeft < 2;
    next.disabled = max < 2 || track.scrollLeft >= max - 2;
    track.tabIndex = max > 2 ? 0 : -1;
  }
  function scrollCards(direction) {
    const card = track.querySelector('.discovery');
    const gap = parseFloat(getComputedStyle(track).columnGap) || 12;
    track.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: prefersStillness() ? 'instant' : 'smooth' });
  }
  previous.addEventListener('click', () => scrollCards(-1));
  next.addEventListener('click', () => scrollCards(1));
  track.addEventListener('scroll', refreshCarousel, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.target !== track || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault(); scrollCards(event.key === 'ArrowRight' ? 1 : -1);
  });

  function setWeek({ currentDay = null, completedDays = [] } = {}) {
    if (!(currentDay === null || Number.isInteger(currentDay) && currentDay >= 0 && currentDay <= 6)) throw new TypeError('currentDay must be null or an integer from 0 through 6.');
    if (!Array.isArray(completedDays) || completedDays.some(day => !Number.isInteger(day) || day < 0 || day > 6)) throw new TypeError('completedDays must contain zero-based day indexes from 0 through 6.');
    const completed = new Set(completedDays);
    document.querySelectorAll('.week-day').forEach((day, index) => {
      const isCurrent = currentDay === index;
      day.classList.toggle('is-current', isCurrent);
      day.classList.toggle('is-complete', completed.has(index));
      if (isCurrent) day.setAttribute('aria-current', 'step'); else day.removeAttribute('aria-current');
      day.setAttribute('aria-label', `Day ${index + 1}, ${completed.has(index) ? 'completed' : 'not completed'}${isCurrent ? ', current' : ''}`);
    });
    let contiguous = 0;
    while (completed.has(contiguous)) contiguous++;
    document.querySelector('.week-track').style.setProperty('--progress', `${Math.max(0, contiguous - 1) / 6 * 100}%`);
  }
  function reportHeight() {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => sendBridge('height', { height: Math.ceil(document.getElementById('home-shell').getBoundingClientRect().height) }));
  }
  window.addEventListener('message', event => {
    const data = event.data;
    if (event.source !== window.parent || window.parent === window || !data || data.namespace !== 'mentication-host' || data.version !== 1) return;
    if (data.type === 'connect' && typeof data.bridgeId === 'string' && data.bridgeId.length >= 16 && typeof data.parentOrigin === 'string' && event.origin === data.parentOrigin) {
      if (parentOrigin && parentOrigin !== event.origin) return;
      parentOrigin = event.origin;
      bridgeId = data.bridgeId;
      bridgeConnected = true;
      root.dataset.embedded = 'true';
      sendBridge('ready'); reportHeight();
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'viewport' && Number.isFinite(data.top) && data.top >= 0 && Number.isFinite(data.height) && data.height >= 1 && data.height <= 20000) {
      root.style.setProperty('--dialog-top', `${data.top + data.height / 2}px`);
      root.style.setProperty('--dialog-max-height', `${Math.max(100, data.height - 32)}px`);
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'week') {
      try { setWeek(data.week); } catch { sendBridge('error', { code: 'INVALID_WEEK' }); }
    }
  });
  window.MenticationHome = Object.freeze({
    version: '1.0.0',
    routes: ROUTES,
    configure({ navigate: handler, week } = {}) {
      if (handler !== undefined && typeof handler !== 'function') throw new TypeError('navigate must be a function.');
      if (handler) navigateHandler = handler;
      if (week !== undefined) setWeek(week);
    },
    setWeek
  });
  applyPreferences(readPreferences());
  if (!storageAvailable) document.getElementById('preference-note').textContent = 'Your preferences apply while this page is open.';
  // The supplied image highlights its fifth circle. Preserve that visual in the preview.
  // Base44 must supply actual user/week state; the image is not evidence of completion.
  const resizeObserver = new ResizeObserver(() => { refreshCarousel(); reportHeight(); });
  resizeObserver.observe(document.getElementById('home-shell'));
  resizeObserver.observe(track);
  window.addEventListener('load', () => { refreshCarousel(); reportHeight(); });
  window.addEventListener('pagehide', () => { resizeObserver.disconnect(); cancelAnimationFrame(resizeFrame); }, { once: true });
})();
