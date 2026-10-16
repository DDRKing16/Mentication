// Bind once to the real CSS epoch, then let the audible loop's output clock
// advance the wrist, knuckles and location light together. Without contact
// sound the CSS animation continues normally, including mute/unmute mid-point.
const registered = new WeakMap();

export function synchronizeTappingAnimations(element, readPhase, {
  requestFrame = requestAnimationFrame,
  cancelFrame = cancelAnimationFrame,
} = {}) {
  const animations = element.closest('svg').getAnimations({ subtree: true })
    .filter(item => ['tap-wrist-contact', 'tap-knuckle-contact', 'tap-light-contact'].includes(item.animationName));
  let frame = null, controlled = false, cancelled = false;
  const update = () => {
    if (cancelled || !element.isConnected || !element.classList.contains('is-tapping')) return;
    const phase = readPhase();
    if (Number.isFinite(phase) && phase >= 0) {
      for (const animation of animations) {
        if (animation.playState !== 'paused') animation.pause();
        animation.currentTime = phase;
      }
      controlled = true;
      element.dataset.clock = 'audio';
    } else if (controlled) {
      for (const animation of animations) animation.play();
      controlled = false;
      element.dataset.clock = 'visual';
    }
    frame = requestFrame(update);
  };
  update();
  return () => { cancelled = true; if (frame !== null) cancelFrame(frame); };
}

export function observeTappingAnimationStart(element, onStart) {
  const animation = element.getAnimations().find(item => item.animationName === 'tap-wrist-contact');
  if (!animation) return;
  let cancelled = false, cleanup = null;
  const publish = () => {
    if (cancelled || !element.isConnected || !element.classList.contains('is-tapping') || animation.playState === 'idle' || !element.getAnimations().includes(animation)) return;
    if (Number.isFinite(animation.startTime) && registered.get(element) !== animation) {
      registered.set(element, animation);
      const readPhase = onStart(animation.startTime, () => Number(animation.currentTime || 0));
      if (typeof readPhase === 'function') cleanup = synchronizeTappingAnimations(element, readPhase);
    }
  };
  if (Number.isFinite(animation.startTime)) publish();
  else animation.ready.then(publish, () => {});
  return () => { cancelled = true; cleanup?.(); if (registered.get(element) === animation) registered.delete(element); };
}
