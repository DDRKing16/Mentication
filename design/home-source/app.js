import { openAccessibleDialog as openHomeDialog } from '../../src/lib/accessibleDialog.js';
/* MentiCation home. No dependencies, tracking, remote fonts, or account data. */
(() => {
  'use strict';
  const root = document.documentElement;
  const ROUTES = Object.freeze({
    home: 'Home', support: 'Urgent support', lift: 'Lift', focus: 'Focus', calm: 'Calm', ground: 'Ground', sleep: 'Sleep',
    guide: 'Guide me', restore: 'Restore', begin: 'Begin', 'seven-calmer-days': '7 calmer days',
    restructure: 'Restructure', foundations: 'Foundations', journal: 'Check in with yourself',
    palace: 'Peace Palace',
    'good-map': 'See what makes life feel good', 'dear-2100': 'Go after what you’ve avoided',
    'return-points': 'Return points', library: 'Library', 'my-plan': 'My Plan', profile: 'Profile', insights: 'Insights', settings: 'Settings',
    recommended: 'Your reset for today', 'parking-lot': 'Your parking lot'
  });
  const preferenceKey = 'mentication.home.accessibility.v1';
  const preferenceNames = ['large-text', 'high-contrast', 'reduce-motion'];
  let navigateHandler = null;
  let storageAvailable = true;
  let bridgeConnected = false;
  let pendingNavigation = null;
  let parentOrigin = null;
  let bridgeId = null;
  const dialogCleanups = new Map();
  const dialogLayers = new Map();
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
    root.dataset.textScale = [1, 1.15, 1.3].includes(preferences.textScale) ? String(preferences.textScale) : (preferences['large-text'] ? '1.15' : '1');
    refreshCarousel();
    reportHeight();
  }
  function savePreferences(event) {
    const preferences = Object.fromEntries(preferenceNames.map(name => [name, document.getElementById(name).checked]));
    applyPreferences(preferences);
    if (bridgeConnected) {
      document.getElementById('preference-note').textContent = 'Saving your preference…';
      sendBridge('accessibility-change', { name: event.target.id, value: event.target.checked });
      return;
    }
    try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); }
    catch {
      storageAvailable = false;
      document.getElementById('preference-note').textContent = 'Your preferences apply while this page is open.';
    }
  }
  function openDialog(id, opener) {
    document.querySelectorAll('dialog[open]').forEach(closeDialog);
    const dialog = document.getElementById(id);
    const cleanup = openHomeDialog(dialog, dialogLayers.get(dialog), {
      opener: opener || document.activeElement, onClose: () => closeDialog(dialog),
    });
    dialogCleanups.set(dialog, cleanup);
  }
  function closeDialog(dialog) {
    const cleanup = dialogCleanups.get(dialog);
    dialogCleanups.delete(dialog);
    cleanup?.();
    reportHeight();
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    const layer = document.createElement('div');
    layer.className = 'mcn-modal-layer home-modal-layer';
    dialog.before(layer);
    layer.append(dialog);
    dialogLayers.set(dialog, layer);
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    layer.addEventListener('click', event => {
      if (event.target === layer && layer.dataset.fallback === 'true') closeDialog(dialog);
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      if (event.target.closest('[data-close]')) closeDialog(dialog);
      if (event.target === dialog) {
        const box = dialog.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
      }
    });
    dialog.addEventListener('close', () => { if (!dialog.open) closeDialog(dialog); });
  });
  document.getElementById('menu-open').addEventListener('click', event => openDialog('menu-dialog', event.currentTarget));
  document.getElementById('accessibility-open').addEventListener('click', event => openDialog('accessibility-dialog', event.currentTarget));
  // Premium: a quiet notify-me capture, stored on this device only.
  const notifyKey = 'mentication.plus.notify.v1';
  const premiumCard = document.getElementById('premium-card');
  const premiumForm = document.getElementById('premium-notify-form');
  const premiumEmail = document.getElementById('premium-email');
  const premiumNote = document.getElementById('premium-note');
  function readNotify() {
    try { return JSON.parse(localStorage.getItem(notifyKey) || 'null'); } catch { return null; }
  }
  function applyNotify(saved) {
    const savedEmail = typeof saved?.email === 'string' ? saved.email : '';
    const on = Boolean(savedEmail);
    document.getElementById('premium-signup').hidden = on;
    document.getElementById('premium-confirmed').hidden = !on;
    if (on) document.getElementById('premium-confirmed-email').textContent = savedEmail;
    const cardStatus = document.getElementById('premium-card-status');
    if (cardStatus) cardStatus.hidden = !on;
    if (on) premiumCard.setAttribute('aria-label', 'Premium content. You’re on the notification list');
    reportHeight();
  }
  premiumCard.addEventListener('click', event => openDialog('premium-dialog', event.currentTarget));
  premiumForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = premiumEmail.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { premiumEmail.reportValidity?.(); return; }
    try { localStorage.setItem(notifyKey, JSON.stringify({ email, savedAt: new Date().toISOString() })); }
    catch {
      storageAvailable = false;
      if (premiumNote) premiumNote.textContent = 'Your email applies while this page is open — it could not be saved in this browser.';
    }
    applyNotify({ email });
  });
  applyNotify(readNotify());
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
    if (!Object.prototype.hasOwnProperty.call(ROUTES, route)) return;
    if (route === 'home') {
      document.querySelectorAll('dialog[open]').forEach(closeDialog);
      window.scrollTo({ top: 0, behavior: prefersStillness() ? 'instant' : 'smooth' });
      if (bridgeConnected) sendBridge('home', { reduceMotion: prefersStillness() });
      status.textContent = 'Home';
      return;
    }
    document.querySelectorAll('dialog[open]').forEach(closeDialog);
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
    if (bridgeConnected) {
      sendBridge('navigate', {
        route,
        ambient: {
          currentTime: Number.isFinite(bgMusic.currentTime) ? bgMusic.currentTime : 0,
          volume: bgMusic.volume,
          playing: !bgMusic.paused,
        },
      });
      if (!bgMusic.paused) bgMusic.pause();
      return;
    }
    if (window.parent !== window) {
      pendingNavigation = route;
      status.textContent = 'Opening…';
      return;
    }
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
    ground: '#3f8f52', sleep: '#4a7fd9', guide: '#c08a2d', restore: '#577c70'
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
    // Navigate immediately. Avoid delaying route changes for decorative tap
    // feedback because the pause is perceptible and can cause audio stutter.
    navigate(button.dataset.route, button);
  }));

  function refreshCarousel() {
    const max = Math.max(0, track.scrollWidth - track.clientWidth);
    previous.disabled = max < 2 || track.scrollLeft < 2;
    next.disabled = max < 2 || track.scrollLeft >= max - 2;
    track.tabIndex = max > 2 ? 0 : -1;
  }
  function scrollCards(direction) {
    const card = track.querySelector('.discovery:not([hidden])');
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

  // The host owns connections. Only a small token-free view model crosses the
  // existing window/origin/per-mount-token bridge. Never fetch health APIs here.
  let wellnessSources = [];
  const sourceList = document.getElementById('wellness-sources');
  const summary = document.getElementById('wellness-summary');
  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function wellnessAction(action, provider, consent = false) {
    sendBridge('wellness-action', { action, provider, consent });
  }
  function renderWellness() {
    const source = wellnessSources.find(item => item.id === 'oura');
    const connected = source?.connected === true;
    document.querySelector('.week-panel').classList.toggle('has-wellness-connection', connected);
    const state = document.getElementById('wellness-status');
    state.textContent = source?.status === 'loading' ? (connected ? 'Syncing…' : 'Connecting…')
      : source?.status === 'error' ? 'Connection needs attention'
      : connected ? 'Connected' : source?.status === 'setup' || !source ? 'Not available yet' : 'Not connected';
    summary.hidden = !(connected || source?.error);
    summary.replaceChildren();
    if (connected) {
      if (source.error) summary.append(element('p', source.error, 'wellness-note'));
      const snapshot = source.snapshot;
      if (snapshot) {
        const sync = new Date(snapshot.syncedAt);
        const stale = Date.now() - sync.getTime() > 36 * 3600000;
        summary.append(element('p', `Last sync ${sync.toLocaleString()}${stale ? ' · Update needed' : ''}`, 'wellness-note'));
        const metrics = element('div', undefined, 'wellness-metrics');
        snapshot.metrics.forEach(metric => {
          const tile = element('div', undefined, 'wellness-metric');
          const units = { score: '/100', percent: '%', hours: 'h', steps: 'steps', bpm: 'bpm', ms: 'ms', strain: '/21' };
          tile.append(element('span', metric.label), element('strong', metric.value === null ? '—' : `${metric.value} ${units[metric.unit] || ''}`), element('small', metric.day));
          if (metric.value === null) tile.append(element('small', 'Not shared'));
          metrics.append(tile);
        });
        summary.append(metrics);
        if (!snapshot.metrics.length || snapshot.metrics.every(metric => metric.value === null)) summary.append(element('p', 'No summaries shared yet. Check your source app and permissions.', 'wellness-note'));
        else if (snapshot.metrics.some(metric => metric.day < new Date().toLocaleDateString('en-CA'))) summary.append(element('p', 'Some readings are from an earlier day. Check the dates above.', 'wellness-note'));
      } else if (source.status !== 'loading') summary.append(element('p', 'No summaries shared yet. Sync when your source app has data.', 'wellness-note'));
      const refresh = element('button', 'Sync now', 'wellness-button');
      refresh.type = 'button'; refresh.disabled = source.status === 'loading';
      refresh.addEventListener('click', () => wellnessAction('sync', source.id)); summary.append(refresh);
    } else if (source?.error) summary.append(element('p', source.error, 'wellness-note'));
    sourceList.replaceChildren();
    wellnessSources.forEach(item => {
      const row = element('section', undefined, 'wellness-source');
      row.append(element('h3', item.name), element('p', item.detail));
      if (item.error) row.append(element('p', item.error, 'wellness-note'));
      if (item.status === 'setup') row.append(element('span', 'Not available in this version. No connection action is needed from you.', 'wellness-note'));
      else if (item.connected) {
        const disconnect = element('button', 'Disconnect & remove summaries', 'wellness-button');
        disconnect.type = 'button'; disconnect.disabled = item.status === 'loading';
        disconnect.addEventListener('click', () => wellnessAction('disconnect', item.id)); row.append(disconnect);
      } else {
        const label = element('label', undefined, 'wellness-consent');
        const consent = document.createElement('input'); consent.type = 'checkbox';
        label.append(consent, element('span', item.consent));
        const connect = element('button', item.status === 'loading' ? 'Connecting…' : `Connect ${item.name}`, 'wellness-button');
        connect.type = 'button'; connect.disabled = true;
        consent.addEventListener('change', () => { connect.disabled = !consent.checked || item.status === 'loading'; });
        connect.addEventListener('click', () => { if (consent.checked) wellnessAction('connect', item.id, true); });
        row.append(label, connect);
      }
      sourceList.append(row);
    });
    reportHeight();
  }
  function setWellness(wellness) {
    if (!wellness || !Array.isArray(wellness.sources) || wellness.sources.length > 12) return;
    wellnessSources = wellness.sources.filter(source => source && typeof source.id === 'string' && typeof source.name === 'string');
    renderWellness();
  }
  document.getElementById('wellness-open').addEventListener('click', event => openDialog('wellness-dialog', event.currentTarget));

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
  function setToday(today) {
    if (!today || typeof today !== 'object' || Array.isArray(today)) throw new TypeError('today must be an object.');
    const title = typeof today.title === 'string' ? today.title.trim() : '';
    if (!title || title.length > 80) throw new TypeError('today.title must be a string of 1 to 80 characters.');
    const meta = typeof today.meta === 'string' ? today.meta.trim().slice(0, 60) : '';
    document.getElementById('today-title').textContent = title;
    document.getElementById('today-meta').textContent = meta;
    document.getElementById('today-card').hidden = false;
    reportHeight();
  }
  // Peace Palace: the same drawing as the app's Palace page (palaceSvg is
  // inlined from src/lib/palaceArt.js by scripts/build-home-document.mjs).
  function setPalace(palace) {
    if (!palace || typeof palace !== 'object') throw new TypeError('palace must be an object.');
    const level = palace.level;
    if (!Number.isInteger(level) || level < 0 || level > 6) throw new TypeError('palace.level must be an integer from 0 through 6.');
    const name = typeof palace.name === 'string' ? palace.name.trim().slice(0, 40) : '';
    const nextName = typeof palace.nextName === 'string' ? palace.nextName.trim().slice(0, 40) : '';
    const toNext = Number.isInteger(palace.stonesToNext) && palace.stonesToNext > 0 ? palace.stonesToNext : 0;
    const progress = Number.isFinite(palace.progress) ? Math.max(0, Math.min(1, palace.progress)) : 0;
    const levelText = `Level ${level + 1} of 7`;
    // A tight crop per stage so the badge thumb always shows the building
    // itself, whether it is one sprout or the full palace. Placeholder only:
    // the owner will supply real palace artwork images to swap in here.
    const badgeCrops = [
      '150 148 100 127', '138 122 128 140', '105 100 190 165',
      '90 72 245 193', '75 52 275 213', '65 36 310 229', '58 22 335 243'
    ];
    document.getElementById('palace-card-art').innerHTML = palaceSvg(level, { id: 'home-palace-card', viewBox: '40 8 320 272' });
    document.getElementById('palace-badge-art').innerHTML = palaceSvg(level, { id: 'home-palace-badge', viewBox: badgeCrops[level] });
    document.getElementById('palace-card-chip').textContent = levelText;
    document.getElementById('palace-badge-level').textContent = levelText;
    // Earn the tap: the card previews the stage you will walk into next.
    document.getElementById('palace-card-name').textContent = nextName || name;
    const badgeLine = nextName ? `${toNext} stone${toNext === 1 ? '' : 's'} to ${nextName.toLowerCase()}` : 'Your palace is complete';
    document.getElementById('palace-badge-next').textContent = badgeLine;
    document.getElementById('palace-card-next').textContent = nextName ? `${toNext} stone${toNext === 1 ? '' : 's'} from here` : badgeLine;
    const stages = document.getElementById('palace-card-stages');
    if (stages) {
      stages.innerHTML = Array.from({ length: 7 }, (_, i) =>
        `<span class="${i < level ? 'is-built' : i === level ? 'is-current' : ''}"></span>`).join('');
    }
    document.getElementById('palace-card').setAttribute('aria-label', `PEACE PALACE. ${levelText}${nextName ? `. Next up, ${nextName}` : name ? `, ${name}` : ''}`);
    document.getElementById('palace-badge-icon').setAttribute('aria-label', `Your Peace Palace, ${levelText.toLowerCase()}`);
  }
  // Journal card: a quiet, on-device line about the archive ("Last entry
  // 3 days ago"), never anything about what was written.
  function setJournal(journal) {
    if (!journal || typeof journal !== 'object' || Array.isArray(journal)) throw new TypeError('journal must be an object.');
    const caption = typeof journal.caption === 'string' ? journal.caption.trim().slice(0, 60) : '';
    const line = typeof journal.line === 'string' ? journal.line.trim().replace(/\s+/g, ' ').slice(0, 70) : '';
    if (!caption && !line) return;
    const status = document.getElementById('journal-card-status');
    if (!status) return;
    // Earn the tap: preview the first line of the last entry on the card.
    status.textContent = line ? `\u201C${line}\u201D` : caption;
    document.querySelector('.journal-card')?.setAttribute('aria-label', `JOURNAL. Check in with yourself. ${status.textContent}`);
    reportHeight();
  }
  // Sort and cull the row: a card earns its place on the day (Journal when
  // the streak is at risk, Palace when a practice is pending, Premium when a
  // launch is genuinely imminent). If nothing qualifies the row steps aside.
  function layoutCards() {
    const cards = {
      palace: document.getElementById('palace-card'),
      journal: document.querySelector('.journal-card'),
      premium: premiumCard
    };
    const visible = Object.keys(cards).filter(key => !cards[key].hidden);
    track.dataset.count = String(visible.length);
    document.querySelector('.more').hidden = visible.length === 0;
    refreshCarousel();
    reportHeight();
  }
  function setMore(more) {
    if (!more || typeof more !== 'object' || Array.isArray(more)) throw new TypeError('more must be an object.');
    const cards = {
      palace: document.getElementById('palace-card'),
      journal: document.querySelector('.journal-card'),
      premium: premiumCard
    };
    for (const key of ['palace', 'journal', 'premium']) {
      const rule = more[key];
      if (!rule || typeof rule !== 'object') continue;
      if (typeof rule.show === 'boolean') cards[key].hidden = !rule.show;
      if (key === 'premium' && typeof rule.title === 'string' && rule.title.trim()) {
        document.getElementById('premium-card-title').textContent = rule.title.trim().slice(0, 60);
      }
    }
    layoutCards();
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
      if (pendingNavigation) { const route = pendingNavigation; pendingNavigation = null; navigate(route); }
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'viewport' && Number.isFinite(data.top) && data.top >= 0 && Number.isFinite(data.height) && data.height >= 1 && data.height <= 20000) {
      root.style.setProperty('--dialog-top', `${data.top + data.height / 2}px`);
      root.style.setProperty('--dialog-max-height', `${Math.max(100, data.height - 32)}px`);
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'accessibility') {
      if (!data.preferences || !preferenceNames.every(name => typeof data.preferences[name] === 'boolean')) return;
      applyPreferences(data.preferences);
      if (data.saved === false) document.getElementById('preference-note').textContent = 'Could not save this change. Your previous preferences have been restored. Please try again.';
      else document.getElementById('preference-note').textContent = 'These preferences are saved on this device and apply across Mentication.';
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'wellness') {
      setWellness(data.wellness);
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'week') {
      try { setWeek(data.week); } catch { sendBridge('error', { code: 'INVALID_WEEK' }); }
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'today') {
      try { setToday(data.today); } catch { sendBridge('error', { code: 'INVALID_TODAY' }); }
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'palace') {
      try { setPalace(data.palace); } catch { sendBridge('error', { code: 'INVALID_PALACE' }); }
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'journal') {
      try { setJournal(data.journal); } catch { sendBridge('error', { code: 'INVALID_JOURNAL' }); }
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'parking') {
      document.getElementById('parking-return').hidden = data.parking !== true;
      reportHeight();
    } else if (bridgeConnected && event.origin === parentOrigin && data.bridgeId === bridgeId && data.type === 'more') {
      try { setMore(data.more); } catch { sendBridge('error', { code: 'INVALID_MORE' }); }
    }
  });
  window.MenticationHome = Object.freeze({
    version: '1.0.0',
    routes: ROUTES,
    configure({ navigate: handler, week, today, palace, journal, more, wellness } = {}) {
      if (handler !== undefined && typeof handler !== 'function') throw new TypeError('navigate must be a function.');
      if (handler) navigateHandler = handler;
      if (week !== undefined) setWeek(week);
      if (today !== undefined) setToday(today);
      if (palace !== undefined) setPalace(palace);
      if (journal !== undefined) setJournal(journal);
      if (more !== undefined) setMore(more);
      if (wellness !== undefined) setWellness(wellness);
    },
    setWellness,
    setWeek,
    setToday,
    setPalace,
    setJournal,
    setMore
  });
  setPalace({ level: 0, name: 'The quiet clearing', nextName: 'The shack', stonesToNext: 4, progress: 0 });
  applyPreferences(readPreferences());
  // Timezone-aware greeting. The crisp HTML overlay replaces the erased
  // baked-in text, so it always renders sharp above the ambient blur.
  const greeting = document.getElementById('hero-greeting');
  const greetingText = document.getElementById('hero-greeting-text');
  if (greeting && greetingText) {
    const GREETINGS = { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' };
    const hour = new Date().getHours();
    const part = hour < 5 ? 'evening' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    greeting.dataset.part = part;
    greetingText.textContent = GREETINGS[part];
  }
  // The journal card's illustrated page carries today's real date.
  const journalDate = document.getElementById('journal-card-date');
  if (journalDate) journalDate.textContent = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
  if (!storageAvailable) document.getElementById('preference-note').textContent = 'Your preferences apply while this page is open.';
  // The supplied image highlights its fifth circle. Preserve that visual in the preview.
  // Base44 must supply actual user/week state; the image is not evidence of completion.
  const resizeObserver = new ResizeObserver(() => { refreshCarousel(); reportHeight(); });
  resizeObserver.observe(document.getElementById('home-shell'));
  resizeObserver.observe(track);
  window.addEventListener('load', () => { refreshCarousel(); reportHeight(); });
  window.addEventListener('pagehide', () => { resizeObserver.disconnect(); cancelAnimationFrame(resizeFrame); }, { once: true });
  // Background music. Browsers block sound until the visitor interacts, so
  // playback starts on the first tap or keypress anywhere in the home document.
  const bgMusic = document.getElementById('bg-music');
  bgMusic.volume = 0.175;
  const startMusic = () => {
    // In the real app the parent owns the persistent audio element so music
    // survives route changes and resumes from the same position.
    if (bridgeConnected) {
      sendBridge('ambient-start');
      document.removeEventListener('pointerdown', startMusic, true);
      document.removeEventListener('keydown', startMusic, true);
      return;
    }
    bgMusic.play().then(() => {
      document.removeEventListener('pointerdown', startMusic, true);
      document.removeEventListener('keydown', startMusic, true);
    }).catch(error => {
      // Surface the reason (autoplay policy, missing file) instead of failing silently.
      console.error('[home] background music could not start:', error?.name, error?.message);
    });
  };
  document.addEventListener('pointerdown', startMusic, true);
  document.addEventListener('keydown', startMusic, true);
})();
