// Box's 4 × 4-second cadence is active time only. Lifecycle interruptions
// invalidate the timestamp rather than letting a throttled RAF skip phases.
export const BOX_PHASE_MS = 4000;
export const BOX_ROUND_MS = BOX_PHASE_MS * 4;
export const BOX_MAX_FRAME_GAP_MS = 1000;

export function createBoxBreathingClock(rounds = 4) {
  const totalMs = rounds * BOX_ROUND_MS;
  let elapsed = 0;
  let last = null;
  let interrupted = false;
  return {
    suspend() { last = null; interrupted = false; },
    tick(now, running = true, visible = true) {
      let interruption = false;
      if (!running) {
        last = null;
        interrupted = false;
      } else if (!visible || (last !== null && now - last > BOX_MAX_FRAME_GAP_MS)) {
        interruption = !interrupted;
        interrupted = true;
        last = null;
      } else if (!interrupted) {
        if (last !== null) elapsed = Math.min(totalMs, elapsed + Math.max(0, now - last));
        last = now;
      }
      const complete = elapsed >= totalMs;
      const round = Math.min(rounds, Math.floor(elapsed / BOX_ROUND_MS) + 1);
      const inRound = complete ? BOX_ROUND_MS : elapsed % BOX_ROUND_MS;
      const phase = Math.min(3, Math.floor(inRound / BOX_PHASE_MS));
      const progress = (inRound - phase * BOX_PHASE_MS) / BOX_PHASE_MS;
      return { elapsed, phase, progress, round, remainingRounds: complete ? 0 : rounds - round + 1,
        seconds: complete ? 0 : Math.ceil((1 - progress) * 4), complete, interruption };
    },
  };
}
