import { createSession, advance, durationText, PAIRS_PER_SCENE, TERMINAL, FEELINGS, readSaved, saveSession } from './session.js';
const $ = id => document.getElementById(id);
// Coordinates keep both large targets inside the scene, including narrow phones.
const PATHS = [
  [[25,38],[53,28]], [[53,28],[77,44]], [[77,44],[66,65]],
  [[66,65],[40,74]], [[40,74],[23,57]], [[23,57],[25,38]],
];
const GIFTS = [
  ['','One detail comes into focus'], ['','Two details, joined by a path'],
  ['','A third detail joins the room'], ['','Four places for your attention'],
  ['','One more part of the scene'], ['','Your path through the room'],
];
const SCENES = ['THE WINDOW ROOM', 'LIGHT THROUGH LEAVES', 'A QUIET CORNER'];
let storage;
try { storage = window.localStorage; } catch { /* A private browser can deny storage. */ }
const saved = readSaved(storage);
let session = saved.current || createSession(crypto.randomUUID());
let history = saved.history;
let lastTick = performance.now();
let showTime = false;
let manualStill = false;
try { manualStill = storage?.getItem('mentation.signal-lock.still') === 'true'; } catch { /* defaults */ }
let saveOK = true;
let renderedScene = '';
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');

function preferences() {
  let prefs = {};
  try { prefs = JSON.parse(storage?.getItem('haven.a11y.v2') || '{}') || {}; } catch { /* defaults */ }
  const still = manualStill || motionQuery.matches || prefs.reducedMotion === true;
  document.documentElement.classList.toggle('still', still);
  document.documentElement.classList.toggle('large-text', prefs.largeText === true);
  document.documentElement.classList.toggle('high-contrast', prefs.highContrast === true);
  $('motion').setAttribute('aria-pressed', String(still));
  $('motion').disabled = motionQuery.matches || prefs.reducedMotion === true;
  $('motion').textContent = still ? 'Still scene on' : 'Still scene';
}
function persist() {
  const result = saveSession(storage, session, history);
  history = result.history;
  saveOK = result.saved;
  $('save-status').textContent = saveOK ? 'Progress saved on this device.' : 'Progress is available in this open session only.';
}
function announce(text) { $('announcement').textContent = text; }
function tick() {
  const now = performance.now();
  const wasActive = session.status === 'active';
  session = advance(session, { type: 'tick', ms: now - lastTick });
  lastTick = now;
  if (wasActive) {
    persist();
    if (session.status === 'paused') { render(); announce('Paused while you were away. Continue when you want.'); }
  }
  $('elapsed').textContent = durationText(session.elapsedMs);
}
function act(action, focus = false) {
  tick();
  session = advance(session, action);
  lastTick = performance.now();
  persist();
  render();
  if (focus) (TERMINAL.includes(session.status) ? $('summary-title') : session.halfPair ? $('target-two') : $('target-one')).focus({ preventScroll: true });
}
function sceneProgress() {
  const boundary = session.pairs > 0 && session.pairs % PAIRS_PER_SCENE === 0 && !session.halfPair;
  return { boundary, count: boundary ? PAIRS_PER_SCENE : session.pairs % PAIRS_PER_SCENE,
    number: Math.floor(Math.max(0, session.pairs - (boundary ? 1 : 0)) / PAIRS_PER_SCENE) };
}
function drawScene() {
  const { count, number } = sceneProgress();
  const signature = `${number}:${count}`;
  if (signature !== renderedScene) {
    renderedScene = signature;
    $('lines').replaceChildren();
    $('reveals').replaceChildren();
    for (let i = 0; i < count; i++) {
      const [from, to] = PATHS[i];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', `M ${from[0]} ${from[1]} Q ${(from[0]+to[0])/2+4} ${(from[1]+to[1])/2+3} ${to[0]} ${to[1]}`);
      line.setAttribute('class', 'connection');
      // Previously earned reveals do not replay on each render.
      if (i < count - 1) line.style.animation = 'none';
      $('lines').append(line);
      const gift = document.createElement('span');
      gift.className = i === 5 ? 'reveal halo' : 'reveal';
      gift.classList.add('room-discovery');
      gift.style.backgroundPosition = `${to[0]}% ${to[1]}%`;
      gift.style.setProperty('--discovery-index', i);
      gift.style.left = `${i === 5 ? 50 : to[0]}%`;
      gift.style.top = `${i === 5 ? 48 : to[1]}%`;
      if (i < count - 1) gift.style.animation = 'none';
      $('reveals').append(gift);
    }
    const room = document.querySelector('.room');
    room.style.opacity = String(.25 + count * .085);
    room.style.filter = `blur(${Math.max(0, 3-count*.5)}px) saturate(${.45+count*.07})`;
  }
  $('scene-name').textContent = SCENES[number % SCENES.length];
  $('scene-number').textContent = String(number + 1).padStart(2, '0');
  $('reveal-label').textContent = count ? GIFTS[count-1][1] : 'A place to put your attention';
  const path = PATHS[session.pairs % PAIRS_PER_SCENE];
  ['target-one', 'target-two'].forEach((id, i) => {
    $(id).style.left = `${path[i][0]}%`;
    $(id).style.top = `${path[i][1]}%`;
  });
}
function render() {
  const { boundary } = sceneProgress();
  const active = session.status === 'active';
  const paused = session.status === 'paused';
  const terminal = TERMINAL.includes(session.status);
  document.body.classList.toggle('at-summary', terminal);
  $('start-controls').hidden = session.status !== 'ready';
  $('play-controls').hidden = !active;
  $('paused-controls').hidden = !paused;
  $('summary').hidden = !terminal;
  $('targets').hidden = !active;
  $('scene-overlay').hidden = active || terminal;
  $('overlay-text').textContent = paused ? 'Your place is kept.\nContinue when you want.' : 'One small connection\nat a time.';
  $('overlay-text').style.whiteSpace = 'pre-line';
  $('complete').hidden = !boundary;
  document.querySelector('.guidance').hidden = terminal;
  $('instruction').textContent = paused ? 'The signal can wait.' : active ? session.halfPair ? 'Now tap signal 2.' : boundary ? 'Tap signal 1 for another scene.' : 'Tap signal 1.' : 'Tap two signals. See what appears.';
  $('detail').textContent = paused ? 'Paused time is not counted.' : boundary ? 'Or finish here. There is no target to beat.' : 'No rush. Nothing to get wrong.';
  $('target-one').disabled = session.halfPair;
  $('target-one').classList.toggle('chosen', session.halfPair);
  $('target-one').setAttribute('aria-label', session.halfPair ? 'First signal connected' : 'First signal');
  $('target-two').disabled = !session.halfPair;
  $('target-two').classList.toggle('next', !session.halfPair);
  $('elapsed').hidden = !showTime;
  $('elapsed').textContent = durationText(session.elapsedMs);
  if (terminal) {
    $('summary-title').textContent = session.status === 'skipped' ? 'Session skipped' : session.status === 'completed' ? 'Scene completed' : 'Session ended';
    const completed = Math.floor(session.pairs / PAIRS_PER_SCENE);
    $('summary-detail').textContent = `${durationText(session.elapsedMs)} of active session time · ${session.pairs} connection${session.pairs === 1 ? '' : 's'} made · ${completed} scene${completed === 1 ? '' : 's'} connected.`;
    $('unfinished').textContent = session.halfPair ? 'One signal was tapped; its connection is unfinished.' : session.pairs % PAIRS_PER_SCENE ? 'The last scene is partly connected. That is okay.' : session.status === 'skipped' ? 'No activity was recorded.' : 'You can leave it here.';
    $('feeling-note').textContent = session.feeling ? `You chose “${session.feeling}”. ${saveOK ? 'Saved on this device.' : 'Kept in this open session.'}` : 'There is no right answer. You can leave this unanswered.';
    for (const button of $('feelings').children) button.setAttribute('aria-pressed', String(button.textContent === session.feeling));
  }
  drawScene();
}
$('start').onclick = $('resume').onclick = () => {
  act({ type: 'start' }, true);
  announce(session.halfPair ? 'Now tap signal 2.' : 'Tap signal 1.');
};
$('pause').onclick = () => { act({ type: 'pause' }); $('resume').focus(); announce('Paused. Your place is kept.'); };
function finish(complete = false) { act({ type: 'finish', complete, now: Date.now() }, true); }
$('stop').onclick = $('end-paused').onclick = $('skip').onclick = () => finish();
$('complete').onclick = () => finish(true);
for (const [id, target] of [['target-one', 1], ['target-two', 2]]) {
  $(id).onclick = () => {
    const pairsBefore = session.pairs;
    act({ type: 'tap', target }, true);
    if (session.pairs > pairsBefore) announce(`${GIFTS[(session.pairs - 1) % PAIRS_PER_SCENE][1]}. ${$('instruction').textContent}`);
    else if (session.status === 'active') announce('Now tap signal 2.');
  };
}
$('again').onclick = () => {
  session = createSession(crypto.randomUUID());
  renderedScene = '';
  persist(); render(); $('start').focus();
};
$('time-toggle').onclick = () => {
  showTime = !showTime;
  $('time-toggle').setAttribute('aria-pressed', String(showTime));
  $('time-toggle').setAttribute('aria-label', showTime ? 'Hide elapsed time' : 'Show elapsed time');
  render();
};
$('motion').onclick = () => {
  manualStill = !manualStill;
  try { storage?.setItem('mentation.signal-lock.still', String(manualStill)); } catch { /* usable without storage */ }
  preferences();
};
for (const feeling of FEELINGS) {
  const button = document.createElement('button');
  button.textContent = feeling;
  button.setAttribute('aria-pressed', 'false');
  button.onclick = () => { act({ type: 'feeling', value: feeling }); announce($('feeling-note').textContent); };
  $('feelings').append(button);
}
function interrupt() {
  if (session.status !== 'active') return;
  act({ type: 'pause' });
  announce('Paused while you were away. Continue when you want.');
}
document.addEventListener('visibilitychange', () => { if (document.hidden) interrupt(); });
window.addEventListener('pagehide', interrupt);
window.addEventListener('blur', interrupt);
window.addEventListener('pageshow', () => { lastTick = performance.now(); render(); });
window.addEventListener('storage', preferences);
motionQuery.addEventListener('change', preferences);
preferences(); persist(); render();
setInterval(tick, 500);

window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'mentication:pause-for-alternative') return;
  interrupt();
  window.parent.postMessage({ type: 'mentication:alternative-ready', requestId: event.data.requestId }, window.location.origin);
});
