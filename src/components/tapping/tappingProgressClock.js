// Guide seconds follow the same output clock as audible contacts. Quiet rounds
// use wall time. A delayed callback advances one step, without skipping words
// or replaying a backlog of narration cues.
export function createTappingProgressClock() {
  let mode = null, previous = 0, remainder = 0;
  return (wallMs, audioTime = null) => {
    const nextMode = Number.isFinite(audioTime) ? 'audio' : 'quiet';
    const time = nextMode === 'audio' ? audioTime * 1000 : wallMs;
    if (mode !== nextMode) {
      mode = nextMode; previous = time; remainder = 0;
      return false;
    }
    remainder += Math.max(0, time - previous);
    previous = Math.max(previous, time);
    if (remainder < 1000 - 1e-6) return false;
    remainder = Math.max(0, remainder - Math.floor((remainder + 1e-6) / 1000) * 1000);
    return true;
  };
}
