import { useRef, useState, useCallback, useEffect } from "react";
import { SOUNDSCAPE_LAYERS } from "@/lib/sleep";

// Multi-layer procedural soundscape mixer via the Web Audio API.
// Each layer is synthesised on demand; volume is ramped per layer.

function makeNoise(ctx, type) {
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (type === "brown") {
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    } else {
      data[i] = white;
    }
  }
  return buffer;
}

function buildLayer(ctx, master, id) {
  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(master);
  const nodes = [gain];

  if (id === "hum") {
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 108;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 162;
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o1.connect(gain); o2.connect(g2); g2.connect(gain);
    o1.start(); o2.start();
    nodes.push(o1, o2, g2);
  } else if (id === "bowl") {
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 220;
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 330;
    o1.connect(gain); o2.connect(gain);
    o1.start(); o2.start();
    nodes.push(o1, o2);
  } else {
    const src = ctx.createBufferSource();
    src.buffer = makeNoise(ctx, id === "rain" ? "white" : "brown");
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    if (id === "ocean") { filter.type = "lowpass"; filter.frequency.value = 620; }
    else if (id === "rain") { filter.type = "highpass"; filter.frequency.value = 880; }
    else if (id === "brown") { filter.type = "lowpass"; filter.frequency.value = 800; }
    else if (id === "stream") { filter.type = "bandpass"; filter.frequency.value = 520; filter.Q.value = 0.7; }
    else if (id === "fireplace") { filter.type = "lowpass"; filter.frequency.value = 320; }
    else { filter.type = "lowpass"; filter.frequency.value = 420; } // wind
    src.connect(filter); filter.connect(gain);
    src.start();
    nodes.push(src, filter);

    if (id === "ocean") {
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.12;
      const lg = ctx.createGain(); lg.gain.value = 0.05;
      lfo.connect(lg); lg.connect(gain.gain); lfo.start();
      nodes.push(lfo, lg);
    } else if (id === "wind") {
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = 160;
      lfo.connect(lg); lg.connect(filter.frequency); lfo.start();
      nodes.push(lfo, lg);
    } else if (id === "stream" || id === "fireplace") {
      const lfo = ctx.createOscillator(); lfo.frequency.value = id === "stream" ? 0.25 : 0.05;
      const lg = ctx.createGain(); lg.gain.value = 0.06;
      lfo.connect(lg); lg.connect(gain.gain); lfo.start();
      nodes.push(lfo, lg);
    }
  }
  return { gain, nodes };
}

export function useSoundscapeMixer() {
  const ctxRef = useRef(null);
  const masterRef = useRef(null);
  const layersRef = useRef({});
  const [volumes, setVolumes] = useState({});

  const ensureCtx = () => {
    if (!ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { return null; }
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    if (!masterRef.current) {
      const m = ctxRef.current.createGain();
      m.gain.value = 0.5;
      m.connect(ctxRef.current.destination);
      masterRef.current = m;
    }
    return ctxRef.current;
  };

  const setLayer = useCallback((id, volume) => {
    const v = Math.max(0, Math.min(1, volume));
    setVolumes((prev) => ({ ...prev, [id]: v }));
    const ctx = ensureCtx();
    if (!ctx) return;
    const layer = layersRef.current[id];
    if (v === 0) {
      if (layer) { try { layer.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4); } catch { /* */ } }
      return;
    }
    let l = layer;
    if (!l) {
      l = buildLayer(ctx, masterRef.current, id);
      layersRef.current[id] = l;
    }
    try { l.gain.gain.setTargetAtTime(v * 0.16, ctx.currentTime, 0.5); } catch { /* */ }
  }, []);

  const applyPreset = useCallback((preset) => {
    const map = preset.layers || {};
    SOUNDSCAPE_LAYERS.forEach((layer) => {
      setLayer(layer.id, map[layer.id] != null ? map[layer.id] : 0);
    });
  }, [setLayer]);

  const stopAll = useCallback(() => {
    const ctx = ctxRef.current;
    if (ctx) {
      Object.values(layersRef.current).forEach((l) => {
        try { l.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3); } catch { /* */ }
      });
    }
    setVolumes({});
  }, []);

  const setMasterTarget = useCallback((value, timeConst = 0.5) => {
    const ctx = ctxRef.current;
    if (ctx && masterRef.current) {
      try { masterRef.current.gain.setTargetAtTime(Math.max(0, value), ctx.currentTime, timeConst); } catch { /* */ }
    }
  }, []);

  useEffect(() => () => {
    Object.values(layersRef.current).forEach((l) => {
      l.nodes.forEach((n) => { try { n.stop && n.stop(); } catch { /* */ } try { n.disconnect && n.disconnect(); } catch { /* */ } });
    });
    layersRef.current = {};
    try { ctxRef.current && ctxRef.current.close(); } catch { /* */ }
  }, []);

  return { volumes, setLayer, applyPreset, stopAll, setMasterTarget };
}