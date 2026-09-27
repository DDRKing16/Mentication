import { useEffect, useRef } from "react";

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (start, end, amount) => start + (end - start) * amount;
const ease = (value) => {
  const point = clamp(value);
  return point * point * (3 - 2 * point);
};

const WAVE_STATES = [
  { height: 0.08, steep: 0.02, curl: 0, wash: 0, center: 0.08 },
  { height: 0.15, steep: 0.08, curl: 0, wash: 0, center: 0.18 },
  { height: 0.3, steep: 0.24, curl: 0, wash: 0, center: 0.3 },
  { height: 0.9, steep: 0.96, curl: 0.34, wash: 0, center: 0.47 },
  { height: 0.86, steep: 0.98, curl: 0.78, wash: 0.2, center: 0.54 },
  { height: 0.1, steep: 0.03, curl: 0, wash: 0.12, center: 0.79 },
];

function waveStateAt(phase) {
  const position = clamp(phase, 0, 5);
  const index = Math.min(4, Math.floor(position));
  const amount = ease(position - index);
  const from = WAVE_STATES[index];
  const to = WAVE_STATES[index + 1];
  return Object.fromEntries(Object.keys(from).map((key) => [key, mix(from[key], to[key], amount)]));
}

export default function UrgeWave({ stage = 3, progress = 0, paused = false, reducedMotion = false, compact = false }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const targetRef = useRef(stage + progress);
  const pausedRef = useRef(paused);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    targetRef.current = clamp(clamp(stage, 0, 5) + clamp(progress) - 0.16, 0, 5);
    pausedRef.current = paused;
    reducedMotionRef.current = reducedMotion;
  }, [paused, progress, reducedMotion, stage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !wrap || !context) return undefined;

    const systemReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let width = 1;
    let height = 1;
    let frame = 0;
    let time = 0;
    let last = performance.now();
    let phase = targetRef.current;

    const colors = getComputedStyle(wrap);
    const palette = {
      light: colors.getPropertyValue("--urge-wave-light").trim() || "#d7ebe4",
      glass: colors.getPropertyValue("--urge-wave-glass").trim() || "#5da7a0",
      mid: colors.getPropertyValue("--urge-wave-mid").trim() || "#146d6a",
      deep: colors.getPropertyValue("--urge-wave-deep").trim() || "#032f33",
      foam: colors.getPropertyValue("--urge-wave-foam").trim() || "#f1eee5",
    };

    // A small, capped set of foam bits flung from the curling tip. Kept
    // deliberately few and smooth (spawn/fade every frame, never a sudden
    // burst) so nothing "pops" — a flat, calm illustration, not a physics
    // sim.
    let tips = [];

    const resize = () => {
      const bounds = wrap.getBoundingClientRect();
      const density = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * density);
      canvas.height = Math.round(height * density);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(density, 0, 0, density, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);

    const draw = (now) => {
      const delta = Math.min((now - last) / 1000, 0.034);
      last = now;
      const motionReduced = systemReducedMotion || reducedMotionRef.current;
      if (!pausedRef.current && !motionReduced) time += delta;
      phase = motionReduced ? targetRef.current : mix(phase, targetRef.current, 1 - Math.pow(0.16, delta));
      const wave = waveStateAt(phase);
      const waterline = height * 0.84;
      const amplitude = Math.min(height * 0.62, width * 0.42) * wave.height;
      const center = width * wave.center;
      const spread = width * mix(0.235, 0.115, wave.steep);
      // One gentle, smooth breathing motion — no per-pixel noise — so the
      // surface reads as calm and flat, not textured or jittery.
      const bob = Math.sin(time * 0.55) * amplitude * 0.012;

      const surfaceY = (x) => {
        const normal = (x - center) / spread;
        const skew = normal < 0 ? normal * 0.58 : normal * (2.15 + wave.steep);
        const peak = Math.exp(-Math.pow(Math.abs(skew), 2.42) * 1.12);
        return waterline - amplitude * peak + bob;
      };

      const crestY = surfaceY(center);
      // How far into a barrel the wave is, 0 (flat) to 1 (fully wound).
      const barrelT = clamp(wave.curl / 0.8);

      context.clearRect(0, 0, width, height);

      // Distant swell lines behind the main wave, for a sense of depth —
      // one smooth sine each, never noise, so they stay calm.
      for (let layer = 2; layer >= 0; layer -= 1) {
        const line = waterline + 7 + layer * 10;
        context.globalAlpha = 0.08 + layer * 0.05;
        context.fillStyle = layer ? palette.deep : palette.glass;
        context.beginPath();
        context.moveTo(0, line);
        for (let x = 0; x <= width; x += 8) context.lineTo(x, line + Math.sin(x * 0.02 - time * (0.3 + layer * 0.15) + layer * 2) * (2 + layer));
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.fill();
      }
      context.globalAlpha = 1;

      // The wave's plain body: one simple, closed silhouette, always the
      // same shape of curve regardless of curl, so it can never glitch.
      context.beginPath();
      context.moveTo(-4, height + 4);
      for (let x = -4; x <= width + 4; x += 4) context.lineTo(x, surfaceY(x));
      context.lineTo(width + 4, height + 4);
      context.closePath();
      const bodyGrad = context.createLinearGradient(0, crestY, 0, waterline + 20);
      bodyGrad.addColorStop(0, palette.glass);
      bodyGrad.addColorStop(0.55, palette.mid);
      bodyGrad.addColorStop(1, palette.deep);
      context.fillStyle = bodyGrad;
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = palette.deep;
      context.globalAlpha = 0.3;
      context.stroke();
      context.globalAlpha = 1;

      // The barrel: the crest rolls over into a tight scroll, exactly like
      // a rolled sheet of paper — an outer curve and an inner curve that
      // both wind around the same centre with a steadily SHRINKING radius.
      // Because the radius only ever shrinks as the curve is drawn, the two
      // edges of the band can never cross themselves or each other, so the
      // shape can't self-intersect or glitch, however tightly it's wound.
      let tipX = center;
      let tipY = crestY;
      if (barrelT > 0.04 && amplitude > 10) {
        const span = mix(0.55, 2.6, barrelT) * Math.PI; // up to ~1.3 turns
        const outerR = amplitude * mix(0.22, 0.5, barrelT);
        const shrinkTo = mix(0.55, 0.14, barrelT);
        const spiralX = center;
        const spiralY = crestY + outerR;
        const samples = 26;
        const outerPts = [];
        const innerPts = [];
        for (let i = 0; i <= samples; i += 1) {
          const t = i / samples;
          const theta = t * span;
          const r = outerR * mix(1, shrinkTo, t);
          const thickness = outerR * mix(0.36, 0.015, t);
          const dx = Math.sin(theta);
          const dy = -Math.cos(theta);
          outerPts.push({ x: spiralX + r * dx, y: spiralY + r * dy });
          const ri = Math.max(r - thickness, 1);
          innerPts.push({ x: spiralX + ri * dx, y: spiralY + ri * dy });
        }
        tipX = outerPts[outerPts.length - 1].x;
        tipY = outerPts[outerPts.length - 1].y;

        // A hint of shadow at the heart of the scroll — where the tightly
        // wound tip leaves a gap between the coils, exactly as it should.
        context.save();
        const holeR = outerR * shrinkTo * 1.3;
        const holeGrad = context.createRadialGradient(spiralX, spiralY - outerR * shrinkTo * 0.5, 0, spiralX, spiralY - outerR * shrinkTo * 0.5, holeR);
        holeGrad.addColorStop(0, "rgba(2,10,11,0.85)");
        holeGrad.addColorStop(1, "rgba(2,10,11,0)");
        context.fillStyle = holeGrad;
        context.beginPath();
        context.arc(spiralX, spiralY - outerR * shrinkTo * 0.5, holeR, 0, Math.PI * 2);
        context.fill();
        context.restore();

        context.beginPath();
        context.moveTo(outerPts[0].x, outerPts[0].y);
        for (let i = 1; i < outerPts.length; i += 1) context.lineTo(outerPts[i].x, outerPts[i].y);
        for (let i = innerPts.length - 1; i >= 0; i -= 1) context.lineTo(innerPts[i].x, innerPts[i].y);
        context.closePath();
        const bandGrad = context.createRadialGradient(spiralX, spiralY, outerR * shrinkTo * 0.3, spiralX, spiralY, outerR);
        bandGrad.addColorStop(0, palette.mid);
        bandGrad.addColorStop(0.55, palette.glass);
        bandGrad.addColorStop(0.82, palette.foam);
        bandGrad.addColorStop(1, palette.foam);
        context.fillStyle = bandGrad;
        context.fill();
        context.lineWidth = 1.5;
        context.strokeStyle = palette.deep;
        context.globalAlpha = 0.28;
        context.stroke();
        context.globalAlpha = 1;
      }

      // A few foam bits at the curling tip — a fixed small cap, smoothly
      // fading in and out with the curl, never a sudden scatter.
      const wantTips = barrelT > 0.35 ? Math.round(mix(0, 7, ease((barrelT - 0.35) / 0.5))) : 0;
      while (tips.length < wantTips) tips.push({ a: Math.random() * Math.PI * 2, d: mix(4, 14, Math.random()), r: mix(1, 2.2, Math.random()), life: 0 });
      if (tips.length > wantTips) tips.length = wantTips;
      context.fillStyle = palette.foam;
      tips.forEach((p) => {
        p.life = clamp(p.life + delta * 1.6);
        const x = tipX + Math.cos(p.a) * p.d * p.life;
        const y = tipY + Math.sin(p.a) * p.d * p.life * 0.6 + p.life * 3;
        context.globalAlpha = p.life * (1 - p.life * 0.3) * 0.8;
        context.beginPath();
        context.arc(x, y, p.r, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 1;

      // A calm foam wash at the base once the wave has passed — two or
      // three flat, softly-edged blobs that fade with wave.wash, not a
      // busy redrawn band.
      if (wave.wash > 0.03) {
        context.fillStyle = palette.foam;
        for (let i = 0; i < 3; i += 1) {
          const wx = tipX - amplitude * 0.1 + i * width * 0.11 + Math.sin(time * 0.4 + i) * 4;
          const wy = waterline - 2 + Math.sin(time * 0.5 + i * 2) * 2;
          context.globalAlpha = wave.wash * 0.3;
          context.beginPath();
          context.ellipse(wx, wy, 16 + i * 4, 4, 0, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1;
      }

      frame = window.requestAnimationFrame(draw);
    };

    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`urge-wave-export ${compact ? "is-compact" : ""}`} aria-hidden="true">
      <div className={`urge-wave-export__breath ${paused || reducedMotion ? "is-paused" : ""}`} />
      <canvas ref={canvasRef} />
    </div>
  );
}
