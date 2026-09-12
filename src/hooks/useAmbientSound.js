import { useState, useRef, useEffect } from "react";

// Procedural ambient sound via the Web Audio API — no audio assets needed.
// Options: off | ocean | rain | wind | hum

export const AMBIENT_OPTIONS = [
  { id: "off", label: "Off" },
  { id: "ocean", label: "Ocean swell" },
  { id: "rain", label: "Soft rain" },
  { id: "whitenoise", label: "Soft white noise" },
  { id: "wind", label: "Low wind" },
  { id: "hum", label: "Warm hum" },
];

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

export function useAmbientSound() {
  const ctxRef = useRef(null);
  const graphRef = useRef(null);
  const [current, setCurrent] = useState("off");

  const stop = () => {
    const g = graphRef.current;
    const ctx = ctxRef.current;
    if (g && ctx) {
      try { g.master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); } catch { /* */ }
      setTimeout(() => {
        g.nodes.forEach((n) => { try { n.stop && n.stop(); } catch { /* */ } try { n.disconnect && n.disconnect(); } catch { /* */ } });
      }, 400);
    }
    graphRef.current = null;
  };

  const start = (type) => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    master.gain.setTargetAtTime(0.05, ctx.currentTime, 0.6);
    const nodes = [master];

    if (type === "hum") {
      const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = 108;
      const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = 162;
      const g2 = ctx.createGain(); g2.gain.value = 0.22;
      o1.connect(master); o2.connect(g2); g2.connect(master);
      o1.start(); o2.start();
      nodes.push(o1, o2, g2);
    } else {
      const src = ctx.createBufferSource();
      src.buffer = makeNoise(ctx, (type === "rain" || type === "whitenoise") ? "white" : "brown");
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      if (type === "ocean") { filter.type = "lowpass"; filter.frequency.value = 620; }
      else if (type === "rain") { filter.type = "highpass"; filter.frequency.value = 600; }
      else if (type === "whitenoise") { filter.type = "lowpass"; filter.frequency.value = 1400; }
      else { filter.type = "lowpass"; filter.frequency.value = 420; }
      src.connect(filter); filter.connect(master);
      src.start();
      nodes.push(src, filter);

      if (type === "ocean" || type === "wind") {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = type === "ocean" ? 0.12 : 0.07;
        const lfoGain = ctx.createGain();
        if (type === "ocean") { lfoGain.gain.value = 0.05; lfo.connect(lfoGain); lfoGain.connect(master.gain); }
        else { lfoGain.gain.value = 160; lfo.connect(lfoGain); lfoGain.connect(filter.frequency); }
        lfo.start();
        nodes.push(lfo, lfoGain);
      }
    }
    graphRef.current = { nodes, master };
  };

  const set = (type) => {
    if (type === "off") { stop(); setCurrent("off"); return; }
    if (!ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); }
      catch { setCurrent("off"); return; }
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    stop();
    start(type);
    setCurrent(type);
  };

  useEffect(() => () => { try { ctxRef.current && ctxRef.current.close(); } catch { /* */ } }, []);

  return { current, set };
}