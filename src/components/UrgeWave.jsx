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
    let foamTrail = []; // whitewater that lingers and drifts after the break
    let mist = []; // fine airborne haze near a tall crest, present even without a barrel

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
      // A real barrel: normalised so the wave's peak curl (~0.78) reads as
      // a fully hollow tube, not just a folded lip. The tongue of water
      // pitches out and drops well past the crest before curling back to
      // "kiss" the face, leaving a hollow big enough to read as a real tube.
      const barrelT = clamp(wave.curl / 0.8);
      const reach = amplitude * mix(0.16, 1.05, barrelT);
      const overhang = amplitude * mix(0.05, 1.15, barrelT);
      const throatX = center + reach * 0.24;
      const throatY = crestY - amplitude * mix(0.02, 0.18, barrelT);
      const tipX = center + reach;
      const tipY = crestY + overhang;
      const kissX = center + reach * mix(0.32, 0.6, barrelT);
      const kissY = tipY + amplitude * mix(0.06, 0.3, barrelT);
      // A little thickness so the tongue reads as a sheet of water, not a
      // wire: the "outer" (top, lit) curve and the "inner" (underside)
      // curve share the same tip/kiss anchors but bow apart in the middle.
      const tongue = amplitude * mix(0.08, 0.2, barrelT);

      const traceWave = () => {
        // The wave's plain body: unaffected by the curl, so the cave and
        // the overhanging tongue can be layered on top of a solid mass.
        context.beginPath();
        context.moveTo(-4, height + 4);
        for (let x = -4; x <= center; x += 2) context.lineTo(x, surfaceY(x));
        for (let x = center; x <= width + 4; x += 2) context.lineTo(x, surfaceY(x));
        context.lineTo(width + 4, height + 4);
        context.closePath();
      };

      // The upper (outer, lit) curve of the tongue: crest -> throat -> tip.
      const traceTongueTop = () => {
        context.moveTo(center, crestY);
        context.bezierCurveTo(center + reach * 0.2, crestY - amplitude * 0.06, throatX, throatY, center + reach * 0.66, crestY + overhang * 0.32);
        context.bezierCurveTo(center + reach * 0.88, crestY + overhang * 0.62, tipX - reach * 0.06, tipY - overhang * 0.1, tipX, tipY);
      };
      // The underside (inner, shadowed) curve: tip curling back to the kiss.
      const traceTongueUnder = () => {
        context.bezierCurveTo(tipX + amplitude * 0.06, tipY + amplitude * 0.22, kissX + amplitude * 0.18, kissY - amplitude * 0.16, kissX, kissY);
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

      // Everything below is clipped to the wave's own silhouette, so light
      // and texture only ever sit inside the water, never bleed past it.
      context.save();
      context.clip();

      // Caustic light shafts: soft, slowly drifting bands of brighter water,
      // as if sunlight were passing through the swell from above.
      context.globalCompositeOperation = "screen";
      for (let ray = 0; ray < 3; ray += 1) {
        const rx = center - amplitude * 0.6 + ray * amplitude * 0.55 + Math.sin(time * 0.18 + ray * 2.1) * amplitude * 0.25;
        const rayGrad = context.createLinearGradient(rx, crestY - amplitude * 0.2, rx + amplitude * 0.5, waterline + 60);
        rayGrad.addColorStop(0, "rgba(255,255,255,0)");
        rayGrad.addColorStop(0.5, `rgba(255,255,255,${0.05 + 0.02 * ray})`);
        rayGrad.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = rayGrad;
        context.fillRect(rx - amplitude * 0.16, 0, amplitude * 0.32, height);
      }
      context.globalCompositeOperation = "source-over";

      // A soft specular highlight along the face, brightest just under the
      // crest, so the water reads as translucent rather than a flat fill.
      const shine = context.createRadialGradient(center - amplitude * 0.1, crestY + amplitude * 0.18, 0, center - amplitude * 0.1, crestY + amplitude * 0.18, amplitude * 1.1);
      shine.addColorStop(0, "rgba(255,255,255,0.32)");
      shine.addColorStop(0.4, "rgba(255,255,255,0.08)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = shine;
      context.fillRect(0, 0, width, height);
      context.restore();

      // The barrel: a dark hollow cave overlaid on the face, roofed by a
      // bright overhanging tongue of water — the classic hollow-tube look,
      // sized so the opening is a real fraction of the wave's own height.
      if (barrelT > 0.03 && amplitude > 14) {
        // The cave: the tongue's own outline (top curve out to the tip,
        // under-curve back to the kiss point), then a soft curve back to
        // the face beneath it, closing a large dark hollow.
        context.beginPath();
        traceTongueTop();
        traceTongueUnder();
        context.quadraticCurveTo(center + reach * 0.34, waterline - amplitude * 0.22, throatX, throatY);
        context.closePath();
        context.save();
        context.clip();
        const cave = context.createRadialGradient(kissX, kissY - amplitude * 0.25, 0, tipX - reach * 0.2, crestY + overhang * 0.55, amplitude * 1.2);
        cave.addColorStop(0, "#020a0b");
        cave.addColorStop(0.55, palette.deep);
        cave.addColorStop(1, palette.mid);
        context.fillStyle = cave;
        context.fillRect(0, 0, width, height);
        // A cool rim of reflected light along the top of the cave, as if
        // daylight were glancing off the underside of the tongue above it.
        context.globalCompositeOperation = "screen";
        context.strokeStyle = palette.light;
        context.globalAlpha = 0.22;
        context.lineWidth = amplitude * 0.05;
        context.beginPath();
        context.moveTo(center, crestY);
        traceTongueTop();
        context.stroke();
        context.restore();

        // The tongue itself: a lit sheet of water curling over the cave,
        // with its own gradient (bright rim, glassy underside) so it reads
        // as a thin roof rather than a flat shape.
        context.beginPath();
        context.moveTo(center, crestY);
        traceTongueTop();
        traceTongueUnder();
        // trace back along an inset parallel curve to give the sheet a
        // visible thickness, instead of collapsing to a wire.
        context.bezierCurveTo(kissX - tongue * 0.5, kissY - amplitude * 0.28, tipX - tongue, tipY - amplitude * 0.18, tipX - tongue * 1.1, tipY - overhang * 0.18);
        context.bezierCurveTo(center + reach * 0.7, crestY + overhang * 0.18, center + reach * 0.16, crestY - amplitude * 0.02, center, crestY);
        context.closePath();
        const tongueGrad = context.createLinearGradient(center, crestY, tipX, tipY);
        tongueGrad.addColorStop(0, palette.light);
        tongueGrad.addColorStop(0.45, palette.glass);
        tongueGrad.addColorStop(1, palette.mid);
        context.fillStyle = tongueGrad;
        context.fill();
        context.save();
        context.clip();
        const tongueShine = context.createLinearGradient(center, crestY - amplitude * 0.05, tipX, tipY);
        tongueShine.addColorStop(0, "rgba(255,255,255,0.5)");
        tongueShine.addColorStop(0.3, "rgba(255,255,255,0.12)");
        tongueShine.addColorStop(1, "rgba(255,255,255,0)");
        context.fillStyle = tongueShine;
        context.fillRect(0, 0, width, height);
        context.restore();
      }

      // A crisp lit rim along the crest and, once it's barrelling, the
      // outer edge of the tongue.
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
      if (barrelT > 0.03) {
        context.moveTo(center, crestY);
        traceTongueTop();
      }
      context.stroke();
      context.restore();

      // Spray droplets flung off the lip while the barrel is pitching.
      if (wave.curl > 0.25 && amplitude > 20) {
        const want = Math.round(mix(0, 22, ease((wave.curl - 0.25) / 0.6)));
        while (spray.length < want) {
          spray.push({
            x: tipX + (Math.random() - 0.4) * amplitude * 0.2,
            y: tipY - Math.random() * amplitude * 0.15,
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

      // Fine haze near a tall crest, even without a full barrel: a
      // constant, gentle sense of spray in the air, not just at the break.
      if (amplitude > height * 0.28) {
        const wantMist = Math.round(mix(0, 10, ease((amplitude / height - 0.28) / 0.3)));
        while (mist.length < wantMist) {
          mist.push({ x: center + (Math.random() - 0.5) * amplitude * 0.7, y: crestY - Math.random() * amplitude * 0.1, vy: -mix(0.15, 0.4, Math.random()) * (width / 400), r: mix(0.5, 1.2, Math.random()), life: mix(0.6, 1, Math.random()) });
        }
        if (mist.length > wantMist) mist.length = wantMist;
      } else if (mist.length) mist.length = Math.max(0, mist.length - 1);
      context.fillStyle = palette.light;
      mist = mist.filter((p) => p.life > 0.02);
      mist.forEach((p) => {
        p.y += p.vy;
        p.life -= delta * 0.3;
        context.globalAlpha = clamp(p.life) * 0.28;
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fill();
      });

      // Whitewater from the break: particles that ride the surface, drift
      // outward and slowly dissolve, instead of a fixed band redrawn each
      // frame, so the foam actually spreads and thins the way real foam does.
      if (wave.wash > 0.03 && foamTrail.length < 90) {
        const spawn = Math.round(wave.wash * 6);
        for (let n = 0; n < spawn; n += 1) {
          foamTrail.push({
            x: kissX - amplitude * 0.1 + (Math.random() - 0.3) * amplitude * 0.3,
            bob: Math.random() * Math.PI * 2,
            drift: mix(0.3, 1.1, Math.random()) * (width / 400),
            r: mix(1, 2.6, Math.random()),
            life: 1,
          });
        }
      }
      context.fillStyle = palette.foam;
      foamTrail = foamTrail.filter((p) => p.life > 0.02);
      foamTrail.forEach((p) => {
        p.x += p.drift;
        p.bob += delta * 3;
        p.life -= delta * 0.22;
        const y = surfaceY(p.x) - Math.abs(Math.sin(p.bob)) * 2;
        context.globalAlpha = clamp(p.life) * 0.5;
        context.beginPath();
        context.arc(p.x, y, p.r * clamp(p.life, 0.4, 1), 0, Math.PI * 2);
        context.fill();
      });

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
