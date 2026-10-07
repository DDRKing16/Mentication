// CSS animations use the document timeline's performance-clock origin. An
// animationstart callback can arrive late, while currentTime is still zero.
// Use the animation's actual startTime, waiting for readiness when necessary.
const registered = new WeakMap();

export function observeTappingAnimationStart(element, onStart) {
  const animation = element.getAnimations().find(item => item.animationName === 'tap-wrist-contact');
  if (!animation) return;
  const publish = () => {
    if (!element.isConnected || !element.classList.contains('is-tapping') || animation.playState === 'idle' || !element.getAnimations().includes(animation)) return;
    if (Number.isFinite(animation.startTime) && registered.get(element) !== animation) {
      registered.set(element, animation);
      onStart(animation.startTime);
    }
  };
  if (Number.isFinite(animation.startTime)) publish();
  else animation.ready.then(publish, () => {});
}
