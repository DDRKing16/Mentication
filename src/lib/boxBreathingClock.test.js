import { describe, expect, it } from "vitest";
import { createBoxBreathingClock } from "./boxBreathingClock";

function advance(clock, from, to, step = 20) {
  let frame;
  for (let now = from; now <= to; now += step) frame = clock.tick(now);
  return frame;
}

describe("Box Breathing active-time clock", () => {
  it("keeps four exact four-second phases and completes four rounds at 64 seconds", () => {
    const clock = createBoxBreathingClock();
    expect(advance(clock, 0, 3980)).toMatchObject({ phase: 0, round: 1, seconds: 1, complete: false });
    expect(clock.tick(4000)).toMatchObject({ phase: 1, progress: 0, seconds: 4 });
    expect(advance(clock, 4020, 8000)).toMatchObject({ phase: 2, progress: 0 });
    expect(advance(clock, 8020, 12000)).toMatchObject({ phase: 3, progress: 0 });
    expect(advance(clock, 12020, 16000)).toMatchObject({ phase: 0, round: 2, remainingRounds: 3 });
    expect(advance(clock, 16020, 63980)).toMatchObject({ complete: false, round: 4, seconds: 1 });
    expect(clock.tick(64000)).toMatchObject({ complete: true, elapsed: 64000, remainingRounds: 0 });
    expect(clock.tick(64100)).toMatchObject({ complete: true, elapsed: 64000 });
  });

  it("retains the exact phase position across repeated pause/resume and control-effect restarts", () => {
    const clock = createBoxBreathingClock();
    advance(clock, 0, 6500);
    for (let repeat = 0; repeat < 5; repeat++) {
      clock.tick(100000 + repeat * 100000, false);
      clock.suspend();
      expect(clock.tick(150000 + repeat * 100000)).toMatchObject({ elapsed: 6500, phase: 1, progress: 0.625 });
    }
    expect(clock.tick(550020)).toMatchObject({ elapsed: 6520, phase: 1 });
  });

  it("never counts hidden time, and waits for explicit resume", () => {
    const clock = createBoxBreathingClock();
    advance(clock, 0, 2200);
    expect(clock.tick(2300, true, false)).toMatchObject({ interruption: true, elapsed: 2200 });
    expect(clock.tick(500000, true, false)).toMatchObject({ interruption: false, elapsed: 2200 });
    expect(clock.tick(500100, true, true)).toMatchObject({ elapsed: 2200 });
    clock.tick(500200, false);
    expect(clock.tick(500300)).toMatchObject({ elapsed: 2200, phase: 0 });
    expect(clock.tick(500320)).toMatchObject({ elapsed: 2220 });
  });

  it("treats a suspended RAF as an interruption, never a phase jump or instant completion", () => {
    const clock = createBoxBreathingClock();
    advance(clock, 0, 15980);
    expect(clock.tick(999999)).toMatchObject({ elapsed: 15980, phase: 3, interruption: true, complete: false });
    expect(clock.tick(1000019)).toMatchObject({ elapsed: 15980, interruption: false });
    clock.tick(1000020, false);
    clock.tick(1000040);
    expect(clock.tick(1000060)).toMatchObject({ elapsed: 16000, phase: 0, round: 2 });
  });
});
