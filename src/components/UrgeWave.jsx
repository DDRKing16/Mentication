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

      const surfaceY = (x) => {
        const normal = (x - center) / spread;
        const skew = normal < 0 ? normal * 0.58 : normal * (2.15 + wave.steep);
        const peak = Math.exp(-Math.pow(Math.abs(skew), 2.42) * 1.12);
        const ripple = Math.sin(x * 0.022 + time) * 1.4 + Math.sin(x * 0.061 - time * 1.8) * 0.7;
        return waterline - amplitude * peak + ripple;
      };

      const crestY = surfaceY(center);
      const reach = amplitude * (0.1 + wave.curl * 0.65);
      const lipX = center + reach;
      const lipY = crestY + amplitude * (0.02 + Math.pow(wave.curl, 1.5) * 0.9);
      const traceWave = () => {
        context.beginPath();
        context.moveTo(-4, height + 4);
        for (let x = -4; x <= center; x += 2) context.lineTo(x, surfaceY(x));
        if (wave.curl > 0.03 && amplitude > 12) {
          context.bezierCurveTo(center + reach * 0.3, crestY - amplitude * 0.15 * wave.curl, lipX - reach * 0.1, crestY, lipX, lipY);
          context.bezierCurveTo(lipX + 4, lipY + amplitude * 0.1, center + amplitude * 0.58, waterline - amplitude * 0.1, center + amplitude * 0.7, waterline);
        }
        for (let x = center + amplitude * 0.7; x <= width + 4; x += 2) context.lineTo(x, surfaceY(x));
        context.lineTo(width + 4, height + 4);
        context.closePath();
      };

      context.clearRect(0, 0, width, height);
      for (let layer = 2; layer >= 0; layer -= 1) {
        const line = waterline + 7 + layer * 10;
        context.globalAlpha = 0.12 + layer * 0.07;
        context.fillStyle = layer ? palette.deep : palette.glass;
        context.beginPath();
        context.moveTo(0, line);
        for (let x = 0; x <= width; x += 5) context.lineTo(x, line + Math.sin(x * 0.02 - time * 0.6 + layer) * (3 + layer));
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.fill();
      }

      context.globalAlpha = 1;
      traceWave();
      const gradient = context.createLinearGradient(center - amplitude, crestY, center + amplitude, waterline + 30);
      gradient.addColorStop(0, palette.light);
      gradient.addColorStop(0.26, palette.glass);
      gradient.addColorStop(0.62, palette.mid);
      gradient.addColorStop(1, palette.deep);
      context.fillStyle = gradient;
      context.fill();

      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = palette.light;
      context.globalAlpha = 0.5;
      context.lineWidth = 1.2;
      context.beginPath();
      for (let x = 0; x <= center; x += 3) {
        if (x === 0) context.moveTo(x, surfaceY(x));
        else context.lineTo(x, surfaceY(x));
      }
      if (wave.curl > 0.03) context.quadraticCurveTo(lipX, crestY - amplitude * 0.08, lipX, lipY);
      context.stroke();
      context.restore();

      if (wave.wash > 0.02) {
        context.strokeStyle = palette.foam;
        context.lineCap = "round";
        for (let index = 0; index < 28; index += 1) {
          const ratio = index / 28;
          context.globalAlpha = wave.wash * (0.15 + (index % 5) * 0.05);
          context.lineWidth = 0.7 + (index % 3) * 0.4;
          context.beginPath();
          context.moveTo(lipX - amplitude * 0.18 + ratio * width * 0.28, waterline - Math.sin(ratio * Math.PI) * amplitude * 0.16);
          context.lineTo(lipX - amplitude * 0.15 + ratio * width * 0.28, waterline - Math.sin(ratio * Math.PI) * amplitude * 0.1);
          context.stroke();
        }
      }

      context.globalAlpha = 1;
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
