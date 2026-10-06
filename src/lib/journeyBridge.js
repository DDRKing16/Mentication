// No private exercise content crosses this bridge. A matching acknowledgement
// is required before covering a running standalone practice.
export function pauseJourneyFrame(frame, { timeoutMs = 1500 } = {}) {
  return new Promise((resolve, reject) => {
    const target = frame?.contentWindow;
    if (!target) { reject(new Error('Practice is still loading.')); return; }
    const requestId = globalThis.crypto?.randomUUID?.() || `pause-${Date.now()}`;
    let timer;
    const finish = (ready) => {
      window.clearTimeout(timer);
      window.removeEventListener('message', receive);
      if (ready) resolve(true);
      else reject(new Error('The practice could not confirm it is paused. Use its pause or exit controls, then try again.'));
    };
    const receive = event => {
      if (event.origin !== window.location.origin || event.source !== target) return;
      if (event.data?.type === 'mentication:alternative-ready' && event.data.requestId === requestId) finish(true);
    };
    window.addEventListener('message', receive);
    timer = window.setTimeout(() => finish(false), timeoutMs);
    target.postMessage({ type: 'mentication:pause-for-alternative', requestId }, window.location.origin);
  });
}
