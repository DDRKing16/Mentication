import { useEffect, useRef } from "react";

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const mix = (start, end, amount) => start + (end - start) * amount;
const ease = (value) => {
  const point = clamp(value);
  return point * point * (3 - 2 * point);
};

// A tiny deterministic value-noise generator (no library): smooth, seeded and
// cheap enough to sample every frame for a natural, never-repeating swell.
function makeNoise1D(seed = 7) {
  let state = seed >>> 0;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
  const table = Array.from({ length: 256 }, rand);
  return (x) => {
    const i = Math.floor(x);
    const f = ease(x - i);
    const a = table[((i % 256) + 256) % 256];
    const b = table[((i + 1) % 256 + 256) % 256];
    return mix(a, b, f) * 2 - 1;
  };
}

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

    // Two independent noise fields: a slow one for the swell's own texture,
    // a faster one for chop and spray, so the surface never looks tiled.
    const swellNoise = makeNoise1D(11);
    const chopNoise = makeNoise1D(53);
    let spray = [];

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
        // Layered noise instead of pure sines: a slow swell texture plus a
        // faster chop, both fading out where the wave is flat (calm water
        // stays glassy; the swell and the barrel get the texture).
        const swellTex = swellNoise(x * 0.006 + time * 0.35) * 3.2 * (0.35 + wave.height);
        const chop = chopNoise(x * 0.05 + time * 1.6) * 1.6 * (0.3 + wave.steep);
        return waterline - amplitude * peak + swellTex + chop;
      };

      const crestY = surfaceY(center);
      const reach = amplitude * (0.14 + wave.curl * 0.72);
      const lipX = center + reach;
      const lipY = crestY + amplitude * (0.02 + Math.pow(wave.curl, 1.5) * 0.95);
      // A real barrel: the face overshoots past vertical and hooks back
      // in on itself, instead of a single smooth bezier to the lip.
      const throatX = center + reach * 0.62;
      const throatY = crestY - amplitude * (0.1 + wave.curl * 0.22);
      const hookX = lipX - reach * 0.22;
      const hookY = lipY - amplitude * 0.05;

      const traceWave = () => {
        context.beginPath();
        context.moveTo(-4, height + 4);
        for (let x = -4; x <= center; x += 2) context.lineTo(x, surfaceY(x));
        if (wave.curl > 0.03 && amplitude > 12) {
          context.bezierCurveTo(center + reach * 0.25, crestY - amplitude * 0.05, throatX, throatY, hookX, hookY);
          context.quadraticCurveTo(lipX, lipY - amplitude * 0.02, lipX, lipY);
          context.bezierCurveTo(lipX + 4, lipY + amplitude * 0.12, center + amplitude * 0.58, waterline - amplitude * 0.1, center + amplitude * 0.7, waterline);
        }
        for (let x = center + amplitude * 0.7; x <= width + 4; x += 2) context.lineTo(x, surfaceY(x));
        context.lineTo(width + 4, height + 4);
        context.closePath();
      };

      context.clearRect(0, 0, width, height);

      // Distant swell lines behind the main wave, for depth.
      for (let layer = 2; layer >= 0; layer -= 1) {
        const line = waterline + 7 + layer * 10;
        context.globalAlpha = 0.1 + layer * 0.06;
        context.fillStyle = layer ? palette.deep : palette.glass;
        context.beginPath();
        context.moveTo(0, line);
        for (let x = 0; x <= width; x += 5) {
          const n = swellNoise(x * 0.012 - time * (0.3 + layer * 0.1) + layer * 40) * (3 + layer * 1.5);
          context.lineTo(x, line + n);
        }
        context.lineTo(width, height);
        context.lineTo(0, height);
        context.fill();
      }

      context.globalAlpha = 1;
      traceWave();
      // Sunlit-water gradient: a bright rim at the crest, a jade mid-tone
      // where light passes through the face, deepening to near-black below.
      const gradient = context.createLinearGradient(center - amplitude * 0.3, crestY - amplitude * 0.1, center + amplitude * 0.5, waterline + 40);
      gradient.addColorStop(0, palette.light);
      gradient.addColorStop(0.16, palette.glass);
      gradient.addColorStop(0.5, palette.mid);
      gradient.addColorStop(1, palette.deep);
      context.fillStyle = gradient;
      context.fill();

      // A soft specular highlight along the face, brightest just under the
      // crest, so the water reads as translucent rather than a flat fill.
      context.save();
      context.clip();
      const shine = context.createRadialGradient(center - amplitude * 0.1, crestY + amplitude * 0.18, 0, center - amplitude * 0.1, crestY + amplitude * 0.18, amplitude * 1.1);
      shine.addColorStop(0, "rgba(255,255,255,0.32)");
      shine.addColorStop(0.4, "rgba(255,255,255,0.08)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = shine;
      context.fillRect(0, 0, width, height);
      context.restore();

      // A crisp lit rim along the crest and the barrel's edge.
      context.save();
      context.globalCompositeOperation = "screen";
      context.strokeStyle = palette.light;
      context.globalAlpha = 0.55;
      context.lineWidth = 1.4;
      context.beginPath();
      for (let x = 0; x <= center; x += 3) {
        if (x === 0) context.moveTo(x, surfaceY(x));
        else context.lineTo(x, surfaceY(x));
      }
      if (wave.curl > 0.03) {
        context.bezierCurveTo(center + reach * 0.25, crestY - amplitude * 0.05, throatX, throatY, hookX, hookY);
        context.quadraticCurveTo(lipX, lipY - amplitude * 0.02, lipX, lipY);
      }
      context.stroke();
      context.restore();

      // Spray droplets flung off the lip while the barrel is pitching.
      if (wave.curl > 0.25 && amplitude > 20) {
        const want = Math.round(mix(0, 22, ease((wave.curl - 0.25) / 0.6)));
        while (spray.length < want) {
          spray.push({
            x: hookX + (Math.random() - 0.4) * amplitude * 0.2,
            y: hookY - Math.random() * amplitude * 0.15,
            vx: mix(0.4, 1.6, Math.random()) * (width / 400),
            vy: -mix(0.6, 2.2, Math.random()) * (width / 400),
            r: mix(0.6, 1.8, Math.random()),
            life: 1,
          });
        }
        if (spray.length > want) spray.length = want;
      } else if (spray.length) {
        spray.length = Math.max(0, spray.length - 1);
      }
      const gravity = 5.2 * (width / 400) * delta;
      context.fillStyle = palette.foam;
      spray = spray.filter((p) => p.life > 0.02);
      spray.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity;
        p.life -= delta * 0.55;
        context.globalAlpha = clamp(p.life) * 0.85;
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
        if (p.y > waterline + 4) p.life = 0;
      });

      // Foam wash spreading from the impact zone, fading as it thins out.
      if (wave.wash > 0.02) {
        context.lineCap = "round";
        for (let index = 0; index < 34; index += 1) {
          const ratio = index / 34;
          const jitter = chopNoise(index * 3.1 + time * 2) * 4;
          const bandY = waterline - Math.sin(ratio * Math.PI) * amplitude * 0.16 + jitter;
          context.strokeStyle = palette.foam;
          context.globalAlpha = wave.wash * (0.18 + (index % 5) * 0.045) * (0.6 + 0.4 * Math.sin(ratio * Math.PI));
          context.lineWidth = 0.7 + (index % 3) * 0.5;
          context.beginPath();
          context.moveTo(lipX - amplitude * 0.18 + ratio * width * 0.3, bandY);
          context.lineTo(lipX - amplitude * 0.13 + ratio * width * 0.3, bandY + 2.4);
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
