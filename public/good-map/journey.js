/* Production journey. The original illustration/layout helpers stay in index.html. */
(function () {
  const M = GoodMapModel,
    KEY = 'goodmap-journey-v4';
  let recoveryBlocked = false;
  let phase = 'intro',
    loading = true,
    dirty = false,
    savedAt = null,
    maps = [],
    undo = [],
    lastAction = null;
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'mentication:pause-for-alternative' || typeof event.data.requestId !== 'string') return;
    document.querySelectorAll('audio,video').forEach(media => media.pause());
    window.speechSynthesis?.cancel();
    // This is a self-paced map. Keeping it mounted retains its current inputs.
    window.parent.postMessage({ type: 'mentication:alternative-ready', requestId: event.data.requestId }, location.origin);
  });
  const clone = x => JSON.parse(JSON.stringify(x));
  const fresh = clone(JST);
  const uid = () => crypto.randomUUID();
  const historyKey = 'good-map-screen-v1';
  const historySession = history.state?.[historyKey]?.session || uid();
  let historyDepth = history.state?.[historyKey]?.depth || 0;
  const embedded = window.parent !== window;
  let bridgeStarted = false;
  const cursor = () => ({ phase, RI, satCursor: JST.satCursor || 0 });
  function rememberScreen(push = false) {
    if (embedded) {
      window.parent.postMessage({ type: 'mentication:screen', journeyId: 'goodMap', mode: bridgeStarted ? push ? 'push' : 'replace' : 'init', screen: { id: phase, cursors: { moment: RI, satisfaction: JST.satCursor || 0 } } }, location.origin);
      bridgeStarted = true;
      return;
    }
    const data = { [historyKey]: { session: historySession, depth: push ? ++historyDepth : historyDepth, ...cursor() } };
    if (push) history.pushState(data, ''); else history.replaceState(data, '');
  }
  let mapId = uid(),
    createdAt = new Date().toISOString();
  const nav = document.createElement('nav');
  nav.className = 'gm-nav';
  nav.setAttribute('aria-label', 'Good Map controls');
  nav.innerHTML = '<button id="gmBack">Back</button><button id="gmUndo">Undo</button><button id="gmMenu">Menu</button><button id="gmExit">Save and exit</button><span class="gm-status" id="gmStatus" role="status" aria-live="polite"></span>';
  SCR().prepend(nav);
  const el = id => document.getElementById(id);
  function status(message, error = false) {
    el('gmStatus').textContent = message;
    el('gmStatus').classList.toggle('error', error);
  }
  function state() {
    return {
      scr: phase,
      G,
      ORDER,
      i,
      hist,
      counts,
      RQ: RQ.map(x => x.k),
      RATE,
      LOSS,
      RHY,
      TOV,
      RI,
      JST,
      mapId,
      createdAt
    };
  }
  function envelope() {
    return {
      version: 4,
      savedAt: new Date().toISOString(),
      state: state(),
      maps,
      undo: undo.slice(-30)
    };
  }
  function save(quiet = false) {
    if (loading) return false;
    if (recoveryBlocked) {
      status('Saved data could not be read. It has not been overwritten. Use Menu to delete it only if you want to start again.', true);
      return false;
    }
    try {
      const data = envelope();
      M.write(localStorage, KEY, data);
      savedAt = data.savedAt;
      dirty = false;
      if (!quiet) status('Saved on this device · ' + new Date(savedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      }));
      return true;
    } catch {
      dirty = true;
      status('Not saved. Device storage is unavailable or full. Keep this page open and retry Save and exit.', true);
      return false;
    }
  }
  jSave = function (scr) {
    if (loading) return false;
    if (scr) phase = scr;
    return save();
  };
  function apply(s) {
    G = s.G || 'x';
    ORDER = s.ORDER.slice();
    i = s.i;
    hist = s.hist.slice();
    counts = {
      ...s.counts
    };
    RQ = (s.RQ || []).map(k => DECK.find(x => x.k === k)).filter(Boolean);
    RATE = {
      ...s.RATE
    };
    LOSS = {
      ...s.LOSS
    };
    RHY = {
      ...s.RHY
    };
    TOV = {
      ...s.TOV
    };
    RI = s.RI || 0;
    Object.keys(JST).forEach(k => delete JST[k]);
    Object.assign(JST, clone(fresh), clone(s.JST || {}));
    // Sharing is always a one-time user-controlled export, never an enabled connection.
    delete JST.shareOn;
    mapId = s.mapId || uid();
    createdAt = s.createdAt || new Date().toISOString();
    phase = s.scr || 'intro';
    busy = false;
    jApplyPhotos(JST.photo || {});
  }
  function render() {
    loading = true;
    if (!['clinician', 'sharePreview'].includes(phase)) exportRecipient = '';
    jSheetClose(true);
    SCR().querySelectorAll('.jpeek').forEach(node => node.remove());
    SCR().querySelector('.jtoast')?.classList.remove('show');
    SCR().classList.remove('home');
    SCR().classList.toggle('gm-large', !!JST.largeText);
    if (phase === 'sort') {
      SCR().classList.remove('rating', 'journey', 'light');
      RT().hidden = true;
      layout();
      paint();
    } else if (phase === 'rate') {
      SCR().classList.add('rating');
      RT().hidden = false;
      renderRate();
    } else if (phase === 'map') {
      SCR().classList.add('rating');
      RT().hidden = false;
      renderMap();
    } else if (JS[phase]) JS[phase]();else {
      phase = 'intro';
      JS.intro();
    }
    loading = false;
    document.dispatchEvent(new CustomEvent('good-map:phase', {
      detail: phase
    }));
    el('gmUndo').disabled = !undo.length;
    el('gmBack').disabled = false;
    const heading = RT().hidden ? SCR().querySelector('.hd .q') : RT().querySelector('.jq,.gm-q');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
  function go(id) {
    const previous = phase;
    if (previous !== id) {
      JST.stack = JST.stack || [];
      JST.stack.push(previous);
    }
    phase = id;
    render();
    save();
    rememberScreen(previous !== id);
    window.scrollTo(0, 0);
  }
  jgo = id => go(id);
  jre = id => {
    phase = id;
    render();
    save();
    rememberScreen();
  };
  function checkpoint() {
    lastAction = clone(state());
    undo.push({
      state: lastAction,
      maps: clone(maps)
    });
    if (undo.length > 30) undo.shift();
    el('gmUndo').disabled = false;
  }
  function back() {
    if (busy) return;
    if (phase === 'sort' && i > 0) { undoAction(); return; }
    if (historyDepth > 0) {
      if (embedded) window.parent.postMessage({ type: 'mentication:screen-back', journeyId: 'goodMap' }, location.origin); else history.back();
      return;
    }
    if (phase === 'intro') {
      if (window.parent !== window) window.parent.postMessage({ type: 'good-map:exit' }, location.origin);
      else history.back();
      return;
    }
    if (phase === 'sat' && JST.satCursor > 0) {
      JST.satCursor--; render(); save(); rememberScreen(); return;
    }

    if (phase === 'map') {
      RI = Math.max(0, RQ.length - 1);
      phase = 'rate';
      render();
      save();
      rememberScreen();
      return;
    }
    if (phase === 'rate') {
      if (RI > 0) {
        RI--;
        render();
        save();
        rememberScreen();
        return;
      }
      phase = 'sort'; render(); save(); rememberScreen();
      return;
    }
    const target = JST.stack?.pop();
    phase = target || (phase === 'sort' ? 'intro' : 'sort');
    render();
    save();
    rememberScreen();
  }
  function undoAction() {
    if (busy || !undo.length) return;
    const s = undo.pop();
    if (s.state) {
      maps = s.maps;
      apply(s.state);
    } else apply(s);
    render();
    save();
    rememberScreen();
  }
  function restoreScreen(screen) {
    if (!screen || !(['intro', 'sort', 'rate', 'map'].includes(screen.phase) || JS[screen.phase])) return;
    historyDepth = Number.isSafeInteger(screen.depth) && screen.depth >= 0 ? screen.depth : 0;
    phase = screen.phase;
    if (!RQ.length && !['intro', 'sort', 'menu', 'paused', 'empty', 'care', 'compare', 'remap'].includes(phase)) phase = 'intro';
    if (['when', 'whenTime', 'set', 'home', 'chk', 'win', 'helpfulness', 'step', 'ownStep'].includes(phase) && !JST.plan.length) phase = jItems().length ? 'map' : 'intro';
    RI = Math.max(0, Math.min(RQ.length - 1, Number.isSafeInteger(screen.RI) ? screen.RI : 0));
    JST.satCursor = Number.isSafeInteger(screen.satCursor) && screen.satCursor >= 0 ? screen.satCursor : 0;
    if (JST.stack?.at(-1) === phase) JST.stack.pop();
    render(); save(); rememberScreen(); window.scrollTo(0, 0);
  }
  window.addEventListener('popstate', event => {
    const screen = event.state?.[historyKey];
    if (!embedded && screen?.session === historySession) restoreScreen(screen);
  });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent || event.data?.journeyId !== 'goodMap') return;
    if (event.data.type === 'mentication:screen-history-error') {
      status('Browser navigation is unavailable. You can keep using this practice.', true);
      return;
    }
    if (event.data.type !== 'mentication:restore-screen') return;
    const screen = event.data.screen;
    if (!screen || typeof screen.id !== 'string' || !screen.cursors) return;
    restoreScreen({ phase: screen.id, RI: screen.cursors.moment, satCursor: screen.cursors.satisfaction, depth: screen.depth });
  });
  el('gmBack').onclick = back;
  el('gmUndo').onclick = undoAction;
  el('gmMenu').onclick = () => go('menu');
  el('gmExit').onclick = () => {
    if (busy) {
      status('Finishing this card. Save again in a moment.');
      return;
    }
    if (!save()) return;
    if (window.parent !== window) window.parent.postMessage({
      type: 'good-map:exit'
    }, location.origin);else go('paused');
  };
  window.addEventListener('beforeunload', event => {
    if (dirty) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  // Capture a reversible snapshot before user changes; save after the existing handler has run.
  document.addEventListener('click', e => {
    if (e.target.closest('.gm-nav') || e.target.closest('#gmDeleteConfirm') || e.target.closest('.tray')) return;
    if (e.target.closest('button') && !busy) checkpoint();
  }, true);
  document.addEventListener('click', event => {
    if (event.target.closest('#gmDeleteConfirm')) return;
    queueMicrotask(() => {
      if (!loading) save(true);
    });
  });
  document.addEventListener('input', () => {
    if (!loading) save(true);
  });
  document.addEventListener('change', () => {
    if (!loading) save(true);
  });
  const originalChoose = choose;
  choose = function (v, node) {
    if (busy || i >= N) return;
    checkpoint();
    if (hist[i] !== undefined) counts[hist[i]]--;
    originalChoose(v, node);
  };
  const originalLayout = layout;
  layout = function () {
    originalLayout();
    if (i >= N) {
      paint();
      el('torate').textContent = hist.some(x => x > 0) ? 'Rate what matters' : 'Review my choices';
      el('torate').onclick = startRating;
    }
    if (!loading) {
      phase = 'sort';
      save();
    }
  };
  startRating = function () {
    RQ = ORDER.slice(0, N).filter((_, n) => hist[n] === 3).map(di => DECK[di]);
    if (!RQ.length) RQ = ORDER.slice(0, N).filter((_, n) => hist[n] === 1).map(di => DECK[di]);
    RI = 0;
    go(RQ.length ? 'rate' : 'empty');
  };
  // Only answered importance contributes; optional answers never get imputed.
  tiers = items => items.map(d => TOV[d.k] ?? (d.s >= .7 ? 0 : d.s >= .4 ? 1 : 2));
  score = k => M.rating(RATE[k]) === null ? 0 : RATE[k] / 10;
  jItems = () => RQ.filter(d => M.rating(RATE[d.k]) !== null).map(d => ({
    ...d,
    s: score(d.k)
  })).sort((a, b) => b.s - a.s);
  jSat = k => M.rating(JST.sat[k]);
  function page(kick, q, sub, body, foot = '') {
    jMode(true);
    RT().innerHTML = jPage({
      kick,
      q,
      sub: jEsc(sub),
      body,
      foot
    });
  }
  const button = (id, text) => `<button class="rcta" id="${id}">${text}<span class="ar"></span></button>`;
  function choices(name, value, extra = '') {
    return `<div class="gm-options gm-rating-options" role="group" aria-label="${jEsc(name)}">${Array.from({
      length: 11
    }, (_, n) => `<button type="button" data-rating="${n}" ${extra} aria-pressed="${value === n}">${n}</button>`).join('')}</div>`;
  }
  const display = value => M.rating(value) === null ? 'Not answered' : value + '/10';
  JS.intro = () => {
    page('THE GOOD MAP', 'What matters<br><em>to you?</em>', 'Sort 16 illustrated moments, choose what matters, then try one small step. You can pause at any time.', `<img class="gm-photo" src="data:image/webp;base64,${jImg('move')}" alt="Moving my body"><p class="jtip">Your answers stay in this browser on this device. No account or automatic sharing. Clearing browser data removes your saved maps.</p>`, button('gmStart', 'Start sorting'));
    el('gmStart').onclick = () => go('sort');
  };
  JS.paused = () => {
    page('SAVED ON THIS DEVICE', 'Take your<br><em>time.</em>', 'You can close this page. Your last screen and answers are saved here.', '', button('gmResume', 'Resume'));
    el('gmResume').onclick = () => {
      phase = JST.stack.pop() || 'sort';
      render();
      save();
      rememberScreen();
    };
  };
  JS.empty = () => {
    page('NO RATINGS YET', 'Nothing has<br><em>to fit.</em>', 'You can revisit the cards or leave this map unrated. We will not invent a focus or scores.', '', button('gmReview', 'Review cards') + '<button class="jlink" id="gmKeepEmpty">Keep an empty map</button>');
    el('gmReview').onclick = () => {
      i = 0;
      go('sort');
    };
    el('gmKeepEmpty').onclick = () => {
      if (recordMap()) go('remap');
    };
  };
  renderRate = function () {
    jMode(true);
    const d = RQ[RI];
    if (!d) {
      phase = 'empty';
      JS.empty();
      return;
    }
    phase = 'rate';
    page(`IMPORTANCE · MOMENT ${RI + 1} OF ${RQ.length}`, 'How much does this<br><em>add to your life?</em>', d.w, `<img class="gm-photo" alt="${jEsc(d.w)}" src="data:image/webp;base64,${jImg(d.k)}"><p class="gm-scale">0 · A little <span>10 · A huge amount</span></p><p id="gmRatingValue">${display(RATE[d.k])}</p>${JST.legacyReview ? `<p class="jtip">Previous unverified value: ${display(JST.legacyRatings?.[d.k])}. Choose a number or Skip to confirm your own answer.</p>` : ''}${choices('How much ' + d.w + ' adds to your life', RATE[d.k])}`, button('rnext', RI === RQ.length - 1 ? 'Reveal my map' : 'Next moment') + '<button class="jlink" id="gmSkipRating">Skip this rating</button>');
    el('rnext').disabled = M.rating(RATE[d.k]) === null;
    RT().querySelectorAll('[data-rating]').forEach(b => b.onclick = () => {
      RATE[d.k] = +b.dataset.rating;
      RT().querySelectorAll('[data-rating]').forEach(option => option.setAttribute('aria-pressed', option === b));
      el('gmRatingValue').textContent = display(RATE[d.k]);
      el('rnext').disabled = false;
      save();
    });
    const next = () => {
      if (RI < RQ.length - 1) {
        RI++;
        render();
        save();
        rememberScreen(true);
        window.scrollTo(0, 0);
      } else go(jItems().length ? 'map' : 'empty');
    };
    el('rnext').onclick = next;
    el('gmSkipRating').onclick = () => {
      RATE[d.k] = null;
      next();
    };
  };
  const originalMap = renderMap;
  renderMap = function () {
    phase = 'map';
    if (!jItems().length) {
      phase = 'empty';
      JS.empty();
      return;
    }
    const stack = JST.stack.slice();
    originalMap();
    JST.stack = stack;
    phase = 'map';
    RT().querySelector('.gm-q').innerHTML = 'Your map,<br><em>your interpretation.</em>';
    RT().querySelector('.gm-ins').textContent = 'Rings are suggestions from your explicit importance ratings. Tap a moment to change its ring. Missing ratings stay unanswered.';
    el('mapok').onclick = () => {
      if (recordMap()) go('type');
    };
    el('gmsave').setAttribute('aria-label', 'Preview a map export');
    el('gmsave').onclick = () => go('clinician');
    RT().querySelectorAll('.rrow').forEach(b => {
      b.tabIndex = 0;
      b.setAttribute('role', 'button');
      b.onkeydown = e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          b.click();
        }
      };
    });
  };
  openSheet = function (k, items, t) {
    const d = items.find(x => x.k === k);
    const s = jSheet(`<h3 class="jsh">Which ring fits<br>this moment?</h3><p>${jEsc(d.w)}</p><p>Importance: ${display(RATE[k])}</p><p>Without it: ${LOSS[k] == null ? 'Not answered' : LOSSO[LOSS[k]]}</p><p>How often: ${RHY[k] == null ? 'Not answered' : RHYO[RHY[k]]}</p><div class="gm-options gm-answer-list" role="group" aria-label="Which ring fits this moment?">${TN.map((label, n) => `<button data-ring="${n}" aria-pressed="${t[items.indexOf(d)] === n}">${label}</button>`).join('')}</div><button class="jlink" id="gmEditContext">Optional context about this moment</button><button class="jsec" id="gmEditRating">Edit rating</button><button class="jsec" data-x>Close</button>`);
    s.querySelectorAll('[data-ring]').forEach(b => b.onclick = () => {
      TOV[k] = +b.dataset.ring;
      jSheetClose(true);
      renderMap();
      save();
    });
    el('gmEditContext').onclick = () => {
      JST.contextKey = k; go('contextLoss');
    };
    el('gmEditRating').onclick = () => {
      RI = RQ.findIndex(x => x.k === k);
      go('rate');
    };
  };
  function contextQuestion(field, options, title, next) {
    const d = DECK.find(item => item.k === JST.contextKey);
    if (!d) { phase = 'map'; renderMap(); return; }
    const values = field === 'loss' ? LOSS : RHY;
    page('OPTIONAL CONTEXT', title, d.w + ' · Kept separate from importance.', `<div class="gm-options gm-answer-list" role="group" aria-label="${jEsc(title.replace(/<[^>]*>/g, ''))}">${options.map((text, n) => `<button data-context="${n}" aria-pressed="${values[d.k] === n}">${jEsc(text)}</button>`).join('')}</div>`, button('jnext', 'Continue') + '<button class="jlink" id="gmSkipContext">Leave this unanswered</button>');
    RT().querySelectorAll('[data-context]').forEach(b => b.onclick = () => {
      values[d.k] = +b.dataset.context;
      RT().querySelectorAll('[data-context]').forEach(option => option.setAttribute('aria-pressed', option === b));
      save();
    });
    el('jnext').onclick = () => go(next);
    el('gmSkipContext').onclick = () => { values[d.k] = null; go(next); };
  }
  JS.contextLoss = () => contextQuestion('loss', LOSSO, 'If this stopped for a month,<br><em>how would you feel?</em>', 'contextRhythm');
  JS.contextRhythm = () => contextQuestion('rhythm', RHYO, 'How often do you<br><em>need this?</em>', 'map');
  function recordMap() {
    const record = {
      id: mapId,
      at: createdAt,
      updatedAt: new Date().toISOString(),
      ratings: clone(RATE),
      satisfaction: clone(JST.sat),
      rings: clone(TOV),
      sort: ORDER.slice(0, N).map((n, j) => ({
        key: DECK[n].k,
        answer: hist[j] ?? null
      })),
      interpretation: JST.interpretation || '',
      log: clone(JST.log)
    };
    const old = maps;
    maps = maps.some(x => x.id === mapId) ? maps.map(x => x.id === mapId ? record : x) : [...maps, record];
    if (!save()) {
      maps = old;
      return false;
    }
    return true;
  }
  jStartType = () => go('type');
  jStartFromMap = () => go('sat');
  JS.type = () => {
    const suggested = jType().main;
    page('YOUR INTERPRETATION', 'What does your map<br><em>mean to you?</em>', 'Your answers may suggest “' + suggested.n + '”. Change it, or leave it blank.', `<label class="gm-field">What does your map mean to you?<textarea id="gmInterpretation" maxlength="500">${jEsc(JST.interpretation || '')}</textarea></label><p class="jtip">This is a reflection tool, not a personality test. Your meaning is what matters.</p>`, button('jnext', "How is it going lately?"));
    el('gmInterpretation').oninput = e => {
      JST.interpretation = e.target.value;
      save();
    };
    el('jnext').onclick = () => {
      if (recordMap()) go('sat');
    };
  };
  JS.sat = () => {
    const items = jItems();
    if (!items.length) { phase = 'empty'; JS.empty(); return; }
    JST.satCursor = Math.max(0, Math.min(items.length - 1, JST.satCursor || 0));
    const d = items[JST.satCursor], q = M.question(d.w);
    page(`SATISFACTION · MOMENT ${JST.satCursor + 1} OF ${items.length}`, jEsc(q.question), 'Use the same question now and at each follow-up.', `<img class="gm-photo" alt="${jEsc(d.w)}" src="data:image/webp;base64,${jImg(d.k)}"><p class="gm-scale">0 · ${q.anchors[0]} <span>10 · ${q.anchors[1]}</span></p><p id="gmSatValue">${display(JST.sat[d.k])}</p>${choices(q.question, JST.sat[d.k], `data-key="${d.k}"`)}`, button('jnext', JST.satCursor === items.length - 1 ? 'Choose my focus' : 'Next moment') + '<button class="jlink" id="gmSkipSat">Leave this unanswered</button>');
    RT().querySelectorAll('[data-rating]').forEach(b => b.onclick = () => {
      JST.sat[d.k] = +b.dataset.rating;
      RT().querySelectorAll('[data-rating]').forEach(option => option.setAttribute('aria-pressed', option === b));
      el('gmSatValue').textContent = display(JST.sat[d.k]); save();
    });
    const next = () => {
      if (!Object.hasOwn(JST.sat, d.k)) JST.sat[d.k] = null;
      if (!Object.hasOwn(JST.base, d.k)) JST.base[d.k] = JST.sat[d.k];
      if (JST.satCursor < items.length - 1) {
        JST.satCursor++; render(); save(); rememberScreen(true); window.scrollTo(0, 0);
      } else if (recordMap()) go('focus');
    };
    el('jnext').onclick = next;
    el('gmSkipSat').onclick = () => { JST.sat[d.k] = null; next(); };
  };
  JS.focus = () => {
    const items = jItems();
    page('CHOOSE YOUR FOCUS', 'Where would you<br><em>like to start?</em>', 'Choose for yourself. Unanswered satisfaction ratings cannot show a gap.', items.map(d => `<button class="jopt2" data-focus="${d.k}" aria-pressed="${JST.focus === d.k}">${jm(d, 36)}<span class="jo-t"><b>${jEsc(d.w)}</b><small>Importance ${display(RATE[d.k])} · Satisfaction ${display(JST.sat[d.k])}</small></span></button>`).join(''), button('jnext', 'Work on this'));
    el('jnext').disabled = !items.some(x => x.k === JST.focus);
    RT().querySelectorAll('[data-focus]').forEach(b => b.onclick = () => {
      if (JST.focus !== b.dataset.focus) {
        JST.focus = b.dataset.focus;
        JST.works = [];
        JST.bars = [];
        JST.up = null;
        JST.upText = '';
      }
      jre('focus');
    });
    el('jnext').onclick = () => go('help');
  };
  // Preserve the illustrated plan library, but avoid treating missing satisfaction as zero.
  const oldHelp = JS.help,
    oldUp = JS.up,
    oldWay = JS.way,
    oldBuild = jBuildPlan;
  JS.way = () => {
    oldWay();
    RT().querySelector('.jrul')?.remove();
  };
  JS.help = () => {
    oldHelp();
    RT().querySelector('.jq').innerHTML = 'What already<br><em>helps you?</em>';
    RT().querySelector('.jsub').textContent = 'Choose any that fit. You can leave this blank.';
    RT().querySelector('.jrul')?.remove();
    if (jSat(JST.focus) === null) {
      RT().querySelector('.jq').innerHTML = 'What used to help,<br><em>even a little?</em>';
      RT().querySelector('.jrul')?.remove();
    }
  };
  JS.up = () => {
    oldUp();
    RT().querySelector('.jq').innerHTML = 'What would you like<br><em>to be different?</em>';
    RT().querySelector('.jsub').textContent = 'Picture one small, useful change.';
    RT().querySelector('.jrul')?.remove();
    if (jSat(JST.focus) === null) {
      RT().querySelector('.jq').innerHTML = 'What would<br><em>feel different?</em>';
      RT().querySelector('.jsub').textContent = 'Picture a small, useful change.';
      RT().querySelector('.jrul')?.remove();
    }
  };
  jBuildPlan = function () {
    oldBuild();
    JST.attemptId = uid();
    JST.baseline = jSat(JST.focus);
  };
  const oldStep = JS.step;
  JS.step = () => {
    oldStep();
    const reward = RT().querySelector('.jrew');
    if (reward) reward.textContent = 'Something to try; notice what happens for you.';
    RT().querySelector('.jsub').innerHTML = 'Your aim: ' + jGoal();
    const later = RT().querySelector('.jlad');
    if (later) {
      const label = RT().querySelector('.jlbl');
      const details = document.createElement('details');
      details.className = 'gm-later-steps'; details.innerHTML = '<summary>See later steps</summary>';
      later.before(details); details.append(later); label?.remove();
    }
    el('jmine').onclick = () => go('ownStep');
    el('jnext').onclick = () => {
      JST.attemptId = uid();
      JST.baseline = jSat(JST.focus);
      go('when');
    };
  };
  JS.ownStep = () => {
    page('YOUR STEP', 'What small step<br><em>would you choose?</em>', 'Write something you could realistically try.', `<label class="gm-field">Your small step<textarea id="gmOwnStep" maxlength="200">${jEsc(JST.customDraft ?? JST.own ?? '')}</textarea></label>`, button('gmUseStep', 'Use this step'));
    el('gmUseStep').disabled = !el('gmOwnStep').value.trim();
    el('gmOwnStep').oninput = e => {
      JST.customDraft = e.target.value;
      el('gmUseStep').disabled = !e.target.value.trim();
      save();
    };
    el('gmUseStep').onclick = () => {
      JST.own = el('gmOwnStep').value.trim();
      const index = jSteps().length - 1;
      JST.plan[JST.pstep] = index;
      if (!JST.order.includes(index)) JST.order.push(index);
      go('step');
    };
  };
  JS.when = () => {
    const w = JST.wk;
    // Date and time are two parts of one answer to "When?", not extra questions.
    page('MAKE A PLAN', 'When would you<br><em>try this step?</em>', jStep(JST.pstep)[0], `<label class="gm-field">Date<input id="gmDate" type="date" value="${jEsc(w.date || M.localDate())}"></label><label class="gm-field">Local time<input id="gmTime" type="time" value="${jEsc(w.time || '18:00')}"></label><p class="jtip">Times use ${jEsc(Intl.DateTimeFormat().resolvedOptions().timeZone)}. A saved plan does not create a notification. You can export a calendar file next.</p>`, button('jnext', 'Save this plan'));
    el('gmDate').oninput = e => { w.date = e.target.value; save(); };
    el('gmTime').oninput = e => { w.time = e.target.value; save(); };
    el('jnext').onclick = () => {
      try {
        const date = M.scheduled(el('gmDate').value, el('gmTime').value);
        if (date <= new Date()) throw Error('Choose a future date and time.');
        w.date = el('gmDate').value; w.time = el('gmTime').value;
        w.atISO = date.toISOString();
        w.zone = Intl.DateTimeFormat().resolvedOptions().timeZone; w.exportedAt = null;
        if (save()) go('set');
      } catch (error) { status(error.message, true); }
    };
  };
  // A draft from an interrupted local preview retains the same combined answer.
  JS.whenTime = () => { phase = 'when'; JS.when(); };
  const when = () => JST.wk.atISO ? new Date(JST.wk.atISO).toLocaleString() : 'No date chosen';
  function download(text, type, name) {
    const a = document.createElement('a'),
      url = URL.createObjectURL(new Blob([text], {
        type
      }));
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function exportCalendar(at = JST.wk.atISO) {
    try {
      const content = M.calendar({
        at,
        id: JST.attemptId || mapId
      });
      download(content, 'text/calendar;charset=utf-8', 'good-map-reminder.ics');
      JST.wk.exportedAt = new Date().toISOString();
      if (!save()) return;
      status('Calendar file download requested. Open it and confirm import in your calendar; no reminder has been added by this app.');
    } catch (e) {
      status(e.message, true);
    }
  }
  JS.set = () => {
    page('YOUR PLAN', 'Ready to<br><em>try.</em>', jStep(JST.pstep)[0], `<div class="gm-record"><b>${jEsc(when())}</b><p>No notification is scheduled by Mentication. Export the private calendar file, then open and import it. Your calendar controls alerts.</p><p>The calendar event says only “Your small step”; your answers and notes are not included.</p></div>`, button('jnext', 'Go to my map home') + '<button class="jlink" id="jcal">Download calendar file</button>');
    el('jcal').onclick = () => exportCalendar();
    el('jnext').onclick = () => go('home');
  };
  JS.home = () => {
    const d = jFocus();
    page('YOUR GOOD MAP', 'One small<br><em>step.</em>', d ? d.w : 'Your map', `<div class="gm-record"><b>${jEsc(jStep(JST.pstep)[0])}</b><p>${jEsc(when())}</p><p>${JST.wk.exportedAt ? 'A calendar file was requested. Import and alerts are controlled by your calendar.' : 'No reminder is scheduled. You can export a calendar file.'}</p></div><p>${JST.log.length} saved check-in${JST.log.length === 1 ? '' : 's'}. Results are your own reports, not proof the step caused a change.</p><button class="jsec" id="gmHistory">Dated map history</button>`, button('jnext', 'Check in on this step') + '<button class="jlink" id="gmTimeEdit">Change date or export reminder</button>');
    el('jnext').onclick = () => {
      if (JST.log.some(x => x.id === JST.attemptId)) {
        JST.attemptId = uid();
        JST.baseline = jSat(JST.focus);
      }
      JST.chk = {
        did: null
      };
      JST.newsat = null;
      JST.helpfulness = null;
      go('chk');
    };
    el('gmHistory').onclick = () => {
      if (recordMap()) go('remap');
    };
    el('gmTimeEdit').onclick = () => go('when');
  };
  JS.chk = () => {
    page('CHECK-IN', 'Did you<br><em>try it?</em>', jStep(JST.pstep)[0], `<div class="gm-options gm-answer-list" role="group" aria-label="Did you try it?">${[['yes', 'Did it'], ['part', 'Partly'], ['no', 'Not yet']].map(([v, label]) => `<button data-did="${v}">${label}</button>`).join('')}</div>`, '<button class="jlink" id="gmHour">Download a calendar reminder for one hour from now</button>');
    RT().querySelectorAll('[data-did]').forEach(b => b.onclick = () => {
      JST.chk.did = b.dataset.did;
      go('win');
    });
    el('gmHour').onclick = () => exportCalendar(new Date(Date.now() + 3600000).toISOString());
  };
  JS.win = () => {
    const q = M.question(jFocus().w);
    page('SAME QUESTION · SAME SCALE', jEsc(q.question), 'No particular result is expected.', `<p class="gm-scale">0 · ${q.anchors[0]} <span>10 · ${q.anchors[1]}</span></p><p>Before this attempt: ${display(JST.baseline)} · This answer: <span id="gmFollowupValue">${display(JST.newsat)}</span></p>${choices(q.question, JST.newsat)}`, button('jnext', 'Continue') + '<button class="jlink" id="gmSkipFollowup">Leave this rating unanswered</button>');
    RT().querySelectorAll('[data-rating]').forEach(b => b.onclick = () => {
      JST.newsat = +b.dataset.rating;
      RT().querySelectorAll('[data-rating]').forEach(option => option.setAttribute('aria-pressed', option === b));
      el('gmFollowupValue').textContent = display(JST.newsat); save();
    });
    el('jnext').onclick = () => go('helpfulness');
    el('gmSkipFollowup').onclick = () => { JST.newsat = null; go('helpfulness'); };
  };
  JS.helpfulness = () => {
    const d = jFocus();
    page('ABOUT THE STEP · OPTIONAL', 'How helpful was<br><em>trying this step?</em>', 'This is separate from your satisfaction rating.', `<div class="gm-options gm-answer-list" role="group" aria-label="How helpful was trying this step?">${[['better', 'Helpful'], ['same', 'No difference'], ['worse', 'Unhelpful'], ['skipped', 'Did not try / prefer not to answer']].map(([v, label]) => `<button data-helpful="${v}" aria-pressed="${JST.helpfulness === v}">${label}</button>`).join('')}</div>`, button('jnext', 'Save check-in'));
    RT().querySelectorAll('[data-helpful]').forEach(b => b.onclick = () => {
      JST.helpfulness = b.dataset.helpful;
      RT().querySelectorAll('[data-helpful]').forEach(option => option.setAttribute('aria-pressed', option === b)); save();
    });
    el('jnext').onclick = () => {
      const record = M.outcome({
        id: JST.attemptId,
        key: d.k,
        label: d.w,
        before: JST.baseline,
        after: JST.newsat,
        did: JST.chk.did,
        helpfulness: JST.helpfulness,
        step: jStep(JST.pstep)[0]
      });
      const previous = clone(JST);
      JST.log = M.appendOnce(JST.log, record);
      if (JST.newsat !== null) JST.sat[d.k] = JST.newsat;
      if (JST.chk.did === 'yes' && !JST.done.includes(JST.attemptId)) JST.done.push(JST.attemptId);
      if (!recordMap()) {
        Object.assign(JST, previous);
        return;
      }
      go('result');
    };
  };
  JS.result = () => {
    const r = JST.log.find(x => x.id === JST.attemptId) || JST.log.at(-1);
    const delta = r && M.rating(r.baseline) !== null && M.rating(r.endpoint) !== null ? r.endpoint - r.baseline : null;
    page('CHECK-IN SAVED', 'Useful information,<br><em>either way.</em>', delta === null ? 'No change score: one or both ratings were unanswered.' : delta === 0 ? 'Your satisfaction rating stayed the same.' : `Your satisfaction rating ${delta > 0 ? 'rose' : 'fell'} by ${Math.abs(delta)}.`, '<p class="jtip">Many things can affect a rating. Keep what helps, adjust the step, take a break, or reach out for support.</p>', button('gmHome', 'Keep this plan') + '<button class="jlink" id="gmNextStep">Choose another step</button><button class="jlink" id="gmSupport">Get support</button>');
    el('gmNextStep').onclick = () => {
      if (JST.pstep < 2) JST.pstep++;
      JST.attemptId = uid();
      JST.baseline = jSat(JST.focus);
      go('step');
    };
    el('gmHome').onclick = () => go('home');
    el('gmSupport').onclick = () => go('care');
  };
  JS.adjust = JS.win;
  JS.remap = () => {
    const records = maps.slice().reverse();
    const latest = records[0],
      prior = records[1];
    const rows = prior && latest ? M.comparison(prior.ratings, latest.ratings).map(r => `<p>${jEsc(DECK.find(d => d.k === r.key)?.w || r.key)}: ${display(r.before)} → ${display(r.after)}${r.delta === null ? ' · no comparison' : ''}</p>`).join('') : '<p>Save two different maps to compare importance ratings. No example improvements are shown.</p>';
    page('DATED MAP HISTORY', 'Your real<br><em>saved maps.</em>', 'Saved in this browser only. Make a new map whenever it feels useful.', `<div class="gm-record">${rows}</div>${records.map(r => `<article class="gm-record"><b>${jEsc(new Date(r.at).toLocaleString())}</b><p>${Object.values(r.ratings).filter(x => M.rating(x) !== null).length} explicit ratings · ${(r.log || []).length} check-ins</p><p>${jEsc(r.interpretation || 'No written interpretation')}</p><details><summary>View this map’s saved ratings</summary>${Object.entries(r.ratings).map(([key, value]) => `<p>${jEsc(DECK.find(d => d.k === key)?.w || key)}: importance ${display(value)} · satisfaction ${display(r.satisfaction?.[key])}</p>`).join('')}</details>${(r.log || []).map(x => `<p>${jEsc(new Date(x.at).toLocaleString())}: ${display(x.baseline)} → ${display(x.endpoint)} · ${jEsc(x.did || 'Not answered')}</p>`).join('')}<button class="jsec" data-delete-map="${jEsc(r.id)}">Delete this saved map</button></article>`).join('')}`, button('gmNewMap', 'Start a new map'));
    el('gmNewMap').onclick = () => {
      if (!recordMap()) return;
      Object.keys(JST).forEach(k => delete JST[k]);
      Object.assign(JST, clone(fresh));
      mapId = uid();
      createdAt = new Date().toISOString();
      RATE = {};
      LOSS = {};
      RHY = {};
      TOV = {};
      RQ = [];
      RI = 0;
      i = 0;
      hist = [];
      counts = {
        0: 0,
        1: 0,
        3: 0
      };
      ORDER = OPEN.map(k => DECK.findIndex(d => d.k === k));
      undo = [];
      go('sort');
    };
    RT().querySelectorAll('[data-delete-map]').forEach(b => b.onclick = () => deletePrompt(b.dataset.deleteMap));
  };
  function shareText() {
    return ['The Good Map — private export', `Map date: ${new Date(createdAt).toLocaleString()}`, ...jItems().map(d => `${d.w}: importance ${display(RATE[d.k])}; satisfaction ${display(JST.sat[d.k])}`), ...JST.log.map(r => `${r.at}: satisfaction ${display(r.baseline)} → ${display(r.endpoint)}; tried: ${r.did}; helpfulness: ${r.helpfulness || 'Not answered'}`), 'No notes, custom steps, or interpretation text are included.'].join('\n');
  }
  let exportRecipient = '';
  JS.clinician = () => {
    page('OPTIONAL ONE-TIME EXPORT', 'Who is this<br><em>summary for?</em>', 'Nothing is sent. This name labels a file you can choose to share.', `<label class="gm-field">Intended recipient<input id="gmRecipient" maxlength="120" placeholder="Name or email" value="${jEsc(exportRecipient)}"></label>`, button('gmPreviewExport', 'Preview my summary') + '<button class="jlink" id="gmCancelShare">Cancel and clear recipient</button>');
    el('gmPreviewExport').disabled = !exportRecipient.trim();
    el('gmRecipient').oninput = () => { exportRecipient = el('gmRecipient').value; el('gmPreviewExport').disabled = !exportRecipient.trim(); };
    el('gmPreviewExport').onclick = () => { if (exportRecipient.trim()) go('sharePreview'); };
    el('gmCancelShare').onclick = () => { exportRecipient = ''; go('menu'); };
  };
  JS.sharePreview = () => {
    // Refresh or re-entry cannot restore a recipient or reuse earlier consent.
    if (!exportRecipient.trim()) { phase = 'clinician'; JS.clinician(); return; }
    const text = 'Intended recipient: ' + exportRecipient.trim() + '\n\n' + shareText();
    page('EXACT EXPORT PREVIEW', 'Save this summary<br><em>as a file?</em>', 'No notes, custom steps or interpretation are included.', `<pre class="gm-preview" id="gmExportPreview">${jEsc(text)}</pre><label class="gm-check"><input type="checkbox" id="gmConsent"><span>I choose to download this exact summary for ${jEsc(exportRecipient.trim())}.</span></label><p class="jtip">Nothing is sent. You choose how to share the file. Copies you give someone cannot be revoked; ask them to delete them. No ongoing access is granted.</p>`, button('gmExport', 'Download summary') + '<button class="jlink" id="gmCancelShare">Cancel and clear recipient</button>');
    el('gmExport').disabled = true;
    el('gmConsent').onchange = () => { el('gmExport').disabled = !el('gmConsent').checked; };
    el('gmExport').onclick = () => {
      if (!el('gmConsent').checked || !exportRecipient.trim()) return;
      try { download(text, 'text/plain;charset=utf-8', 'good-map-summary.txt'); }
      catch { status('Could not create the export file. Nothing was sent. Try again.', true); return; }
      exportRecipient = ''; go('clinician');
      status('Summary file download requested. Nothing has been sent; recipient and consent cleared.');
    };
    el('gmCancelShare').onclick = () => { exportRecipient = ''; go('menu'); };
  };
  JS.compare = () => {
    page('COMPARE WITH SOMEONE', 'A conversation,<br><em>with consent.</em>', 'Automatic person-to-person comparison is unavailable: this app has no accounts, invite links, or connected recipients.', '<p class="jtip">You can choose to export your own summary, then compare it together with a summary they independently choose to share. No other person’s ratings are supplied here.</p>', button('gmShareInstead', 'Preview my summary'));
    el('gmShareInstead').onclick = () => go('clinician');
  };
  saveMap = jShareCard = () => go('clinician');
  function deletePrompt(id) {
    const s = jSheet(`<h3 class="jsh">Delete ${id ? 'this map' : 'all Good Map data'}?</h3><p>This removes ${id ? 'the saved map and its check-ins' : 'your draft, history and undo data'} from this device. Exported files and copies held by other people are unaffected.</p><button class="jsec" data-x>Cancel</button><button class="rcta" id="gmDeleteConfirm">Delete from this device</button>`);
    s.querySelector('#gmDeleteConfirm').onclick = () => {
      try {
        if (id) {
          const previous = {
            state: clone(state()),
            maps: clone(maps),
            undo: clone(undo)
          };
          maps = maps.filter(r => r.id !== id);
          undo = [];
          if (id === mapId) {
            mapId = uid();
            createdAt = new Date().toISOString();
            Object.keys(JST).forEach(k => delete JST[k]);
            Object.assign(JST, clone(fresh));
            RATE = {};
            LOSS = {};
            RHY = {};
            TOV = {};
            RQ = [];
            RI = 0;
            i = 0;
            hist = [];
            counts = {
              0: 0,
              1: 0,
              3: 0
            };
            ORDER = OPEN.map(k => DECK.findIndex(d => d.k === k));
          }
          if (!save()) {
            apply(previous.state);
            maps = previous.maps;
            undo = previous.undo;
            return;
          }
          jSheetClose(true);
          go('remap');
        } else {
          localStorage.removeItem(KEY);
          localStorage.removeItem(JKEY);
          if (localStorage.getItem(KEY) !== null || localStorage.getItem(JKEY) !== null) throw Error();
          recoveryBlocked = false;
          loading = true;
          maps = [];
          undo = [];
          mapId = uid();
          createdAt = new Date().toISOString();
          Object.keys(JST).forEach(k => delete JST[k]);
          Object.assign(JST, clone(fresh));
          RATE = {};
          LOSS = {};
          RHY = {};
          TOV = {};
          RQ = [];
          RI = 0;
          i = 0;
          hist = [];
          counts = {
            0: 0,
            1: 0,
            3: 0
          };
          ORDER = OPEN.map(k => DECK.findIndex(d => d.k === k));
          phase = 'intro';
          loading = false;
          render();
          save();
          rememberScreen();
          status('Good Map answers and history deleted from this device.');
        }
      } catch {
        status('Could not delete device data. Try again when storage is available.', true);
      }
    };
  }
  JS.menu = () => {
    const links = [['remap', 'Dated map history'], ...(jItems().length ? [['map', 'Edit my map'], ['clinician', 'Preview a private export'], ['compare', 'Compare with someone']] : []), ...(JST.plan.length ? [['home', 'My current plan'], ['when', 'Change date / calendar export']] : []), ['care', 'Get support']];
    page('MENU', 'Your map,<br><em>your choice.</em>', 'Answers stay on this device. Save and exit keeps your current screen.', links.map(([id, label]) => `<button class="jopt2" data-page="${id}">${label}</button>`).join(''), `<button class="jlink" id="gmTextSize">${JST.largeText ? 'Use standard text' : 'Use larger text'}</button><button class="jlink" id="gmDelete">Delete all Good Map data</button>`);
    RT().querySelectorAll('[data-page]').forEach(b => b.onclick = () => go(b.dataset.page));
    el('gmTextSize').onclick = () => {
      JST.largeText = !JST.largeText;
      render();
      save();
    };
    el('gmDelete').onclick = () => deletePrompt();
  };
  jMenu = () => go('menu');
  // Keyboard-operable sheets with focus return and Escape. No keyboard is trapped behind a scrim.
  const sheet = jSheet,
    close = jSheetClose;
  let returnFocus = null;
  jSheet = function (html) {
    returnFocus = document.activeElement;
    const s = sheet(html);
    s.querySelector('.jpanel').setAttribute('aria-label', 'Good Map options');
    s.querySelector('button,input,select,textarea')?.focus();
    return s;
  };
  jSheetClose = function (now) {
    close(now);
    returnFocus?.focus?.();
    returnFocus = null;
  };
  document.addEventListener('keydown', e => {
    const s = SCR().querySelector('.jsheet:not([hidden])');
    if (!s) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      jSheetClose(true);
    }
    if (e.key === 'Tab') {
      const nodes = [...s.querySelectorAll('button,input,textarea,select,a[href]')].filter(x => !x.disabled);
      const first = nodes[0],
        last = nodes.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  let recovery = '';
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.version !== 4 || !Array.isArray(data.state?.ORDER) || !Array.isArray(data.state?.hist) || !Array.isArray(data.maps)) throw Error();
      apply(data.state);
      maps = data.maps;
      undo = data.undo || [];
      savedAt = data.savedAt;
    } else {
      G = 'x';
      const legacy = JSON.parse(localStorage.getItem(JKEY) || 'null');
      if (legacy && Array.isArray(legacy.ORDER) && Array.isArray(legacy.hist)) {
        apply(legacy);
        JST.legacyRatings = clone(RATE);
        JST.legacyReview = true;
        JST.log = [];
        JST.done = [];
        JST.sat = {};
        JST.base = {};
        JST.newsat = null;
        // v3 did not distinguish defaults from answers. Preserve its exact raw record at JKEY.
        RATE = Object.fromEntries(RQ.map(d => [d.k, null]));
        if (legacy.scr !== 'sort') {
          RI = 0;
          phase = RQ.length ? 'rate' : 'sort';
        }
        recovery = 'Your older draft and written notes are retained. Please confirm ratings: the previous version filled some automatically. Its original record is kept on this device.';
      }
    }
  } catch {
    recoveryBlocked = true;
    phase = 'intro';
    recovery = 'Saved data could not be read. Use Delete all Good Map data in Menu only if you want to replace it.';
  }
  loading = false;
  try {
    render();
  } catch {
    recoveryBlocked = true;
    phase = 'intro';
    Object.keys(JST).forEach(k => delete JST[k]);
    Object.assign(JST, clone(fresh));
    RQ = [];
    RATE = {};
    maps = [];
    undo = [];
    render();
    recovery = 'Saved data could not be displayed. It has not been overwritten. Use Menu to delete it only if you want to start again.';
  }
  rememberScreen();
  if (recovery) {
    status(recovery, true);
    dirty = true;
  } else if (savedAt) status('Resumed your saved screen and answers on this device.');else status('Private to this device.');
})();
