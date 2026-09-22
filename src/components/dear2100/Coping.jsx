// @ts-check
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Btn, Headline, Sub, Glyph, PathwayMap, RED, NAVY, GOLD } from './shared';
import { TOOLKIT_STEPS, PATHWAY_NODES, DISTORTIONS, PATHWAY_STEPS } from '@/lib/dear2100Content';

export const S23_Toolkit = ({ answers, update, onNext, onBack }) => {
  const tab = answers.toolkitTab;
  const step = TOOLKIT_STEPS[tab];
  return (
    <Screen dark={false} header={{ left: 'YOUR TOOLKIT · IN THE MOMENT', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>Done for now</Btn>} footNote="ANY OF THESE COUNTS AS A WIN">
      <Headline dark={false} size="md">In the moment, here's the plan.</Headline>
      <Sub dark={false} className="mt-1.5">Three steps, in order. Any one of them still counts as a win.</Sub>
      
      <div className="mt-3">
        <SafetyBanner dark={false} />
      </div>

      <div className="mt-4 flex gap-1.5 flex-wrap">
        {Object.keys(TOOLKIT_STEPS).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update({ toolkitTab: t })}
            className="no-tap flex items-center gap-1.5 px-3 py-1.5 rounded-full font-d2100-sans text-[11px] font-bold"
            style={{ background: tab === t ? NAVY : 'transparent', color: tab === t ? '#fff' : 'rgba(0,56,160,0.5)', border: `1px solid ${tab === t ? NAVY : 'rgba(0,56,160,0.2)'}` }}
          >
            <Glyph name={TOOLKIT_STEPS[t].icon} color={tab === t ? '#fff' : 'rgba(0,56,160,0.5)'} size={11} />
            {t}
          </button>
        ))}
      </div>
      <div
        className="mt-3 relative rounded-[20px] p-4 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FBF7EC 0%, #F1EBDC 100%)', border: '1px solid rgba(0,56,160,0.08)', boxShadow: '0 16px 32px -22px rgba(0,56,160,0.28)' }}
      >
        <div className="flex items-center gap-1.5">
          <Glyph name={step.icon} color={RED} size={13} />
          <p className="font-d2100-sans text-[11px] font-bold uppercase tracking-wide" style={{ color: NAVY }}>{step.title}</p>
        </div>
        <p className="font-d2100-read italic text-[13.5px] leading-snug mt-1.5" style={{ color: 'rgba(26,26,26,0.68)' }}>{step.body}</p>
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid rgba(0,56,160,0.08)' }}>
          <p className="font-d2100-sans text-[11.5px] leading-snug" style={{ color: 'rgba(26,26,26,0.55)' }}>{step.sub}</p>
        </div>
      </div>
      <p className="font-d2100-sans text-[11.5px] leading-snug mt-3 text-center" style={{ color: 'rgba(0,56,160,0.45)' }}>
        Whatever you do here still counts. Then take the next easiest step.
      </p>
    </Screen>
  );
};

// Compact safety reminder — shown as a banner atop the first real step,
// not as its own screen (a full screen felt like it was in the way).
const SafetyBanner = ({ dark = false }) => {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate('/support')}
      className="no-tap mb-4 w-full text-left rounded-2xl px-3.5 py-2.5 transition-all active:scale-[0.99] hover:brightness-105"
      style={{
        background: dark ? 'rgba(216,16,8,0.12)' : 'rgba(216,16,8,0.06)',
        border: dark ? '1px solid rgba(216,16,8,0.28)' : '1px solid rgba(216,16,8,0.15)'
      }}
    >
      <div className="flex items-center gap-1.5">
        <Glyph name="shield" color={RED} size={11} />
        <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-widest leading-tight" style={{ color: RED }}>If you're in danger right now</p>
      </div>
      <p className="font-d2100-read italic text-[11px] leading-snug mt-1.5" style={{ color: dark ? 'rgba(251,247,236,0.75)' : 'rgba(26,26,26,0.65)' }}>
        Tap here for crisis support lines and someone to talk to first. What follows is educational — it isn't a substitute for that.
      </p>
    </button>
  );
};

export const PremiumPathwayDiagram = () => {
  const col1 = [
    { label: 'Old wound', icon: 'shield', v: '"I\'m not good enough"', color: GOLD },
    { label: 'Hypervigilance', icon: 'eye', v: 'Scanning for match', color: GOLD },
    { label: 'Trigger', icon: 'warning', v: 'New situation', color: GOLD },
  ];
  const col2 = [
    { label: 'Threat', icon: 'mask', v: 'Worst-case imagery', color: '#ff7a00' },
    { label: 'Surge', icon: 'heart', v: 'Emotional flood', color: '#ff7a00' },
    { label: 'Urge', icon: 'clock', v: 'Pull to make it stop', color: '#ff7a00' },
  ];
  const col3 = [
    { label: 'Avoidance', icon: 'door', v: 'Ego escapes danger', color: RED },
    { label: 'Relief', icon: 'coin', v: 'Brief comfort', color: RED },
    { label: 'Outcome', icon: 'flag', v: 'Wound reinforced', color: RED },
  ];

  return (
    <div className="relative mt-2 flex-1 flex flex-col justify-between py-1">
      {/* 3 Column Grid */}
      <div className="grid grid-cols-3 gap-2.5 relative z-10">
        {/* Column 1 */}
        <div className="flex flex-col gap-1.5">
          <p className="font-d2100-sans text-[8px] font-bold uppercase tracking-[0.16em] text-center" style={{ color: GOLD }}>1. Origin</p>
          <div className="flex-1 flex flex-col justify-between gap-2.5 p-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {col1.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5 text-center items-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(218,165,32,0.1)', border: '1px solid rgba(218,165,32,0.2)' }}>
                  <Glyph name={item.icon} color={GOLD} size={9} />
                </div>
                <div>
                  <p className="font-d2100-sans text-[8.5px] font-bold uppercase tracking-tight" style={{ color: '#FBF7EC' }}>{item.label}</p>
                  <p className="font-d2100-sans text-[7.5px] leading-tight" style={{ color: 'rgba(251,247,236,0.5)' }}>{item.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2 */}
        <div className="flex flex-col gap-1.5">
          <p className="font-d2100-sans text-[8px] font-bold uppercase tracking-[0.16em] text-center" style={{ color: '#ff7a00' }}>2. Alarm</p>
          <div className="flex-1 flex flex-col justify-between gap-2.5 p-2 rounded-2xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {col2.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5 text-center items-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.2)' }}>
                  <Glyph name={item.icon} color="#ff7a00" size={9} />
                </div>
                <div>
                  <p className="font-d2100-sans text-[8.5px] font-bold uppercase tracking-tight" style={{ color: '#FBF7EC' }}>{item.label}</p>
                  <p className="font-d2100-sans text-[7.5px] leading-tight" style={{ color: 'rgba(251,247,236,0.5)' }}>{item.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-1.5">
          <p className="font-d2100-sans text-[8px] font-bold uppercase tracking-[0.16em] text-center" style={{ color: RED }}>3. The Trap</p>
          <div className="flex-1 flex flex-col justify-between gap-2.5 p-2 rounded-2xl animate-[pulse_3s_infinite]" style={{ background: 'rgba(216,16,8,0.03)', border: '1px solid rgba(216,16,8,0.12)' }}>
            {col3.map((item) => (
              <div key={item.label} className="flex flex-col gap-0.5 text-center items-center">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(216,16,8,0.15)', border: '1px solid rgba(216,16,8,0.25)' }}>
                  <Glyph name={item.icon} color={RED} size={9} />
                </div>
                <div>
                  <p className="font-d2100-sans text-[8.5px] font-bold uppercase tracking-tight" style={{ color: RED }}>{item.label}</p>
                  <p className="font-d2100-sans text-[7.5px] leading-tight" style={{ color: 'rgba(251,247,236,0.5)' }}>{item.v}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Connecting Paths with dynamic animations/glow */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} viewBox="0 0 320 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ff7a00" stopOpacity="0.4" />
            <stop offset="100%" stopColor={RED} stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {/* Connecting Arrows between columns */}
        {/* Column 1 to Column 2 */}
        <path d="M96 90 Q120 85 132 90" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3 3" />
        {/* Column 2 to Column 3 */}
        <path d="M192 110 Q216 115 228 110" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Beautiful large feedback loop arrow returning from Column 3 bottom to Column 1 top */}
        <path d="M260 170 Q160 215 60 40" fill="none" stroke="url(#glowGrad)" strokeWidth="1.8" strokeDasharray="4 4" />
        <path d="M60 40 l1 -8 M60 40 l8 2" fill="none" stroke={GOLD} strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      <div className="mt-4 p-2.5 rounded-2xl flex items-center justify-center gap-2" style={{ background: 'rgba(216,16,8,0.06)', border: '1px solid rgba(216,16,8,0.15)' }}>
        <Glyph name="warning" color={RED} size={11} />
        <p className="font-d2100-sans text-[10px] font-bold tracking-wider text-center uppercase" style={{ color: RED }}>
          ↺ Each avoidance loop reinforces the original wound
        </p>
      </div>
    </div>
  );
};

export const S24_Pathway = ({ onNext, onBack }) => {
  const [step, setStep] = useState(0);
  const headerLeft = `THE PATTERN · ${PATHWAY_STEPS[step].toUpperCase()}`;
  const next = () => setStep((s) => Math.min(s + 1, PATHWAY_STEPS.length - 1));
  const back = () => (step === 0 ? onBack?.() : setStep((s) => s - 1));

  if (step === 0) {
    return (
      <Screen dark={true} header={{ left: headerLeft, onBack: back }} button={<Btn variant="outlineWhite" onClick={next}>Continue</Btn>}>
        <Headline dark={true} size="md">An old wound writes the rule.</Headline>
        <div className="mt-4 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="font-d2100-read italic text-[13.5px] leading-relaxed" style={{ color: 'rgba(251,247,236,0.78)' }}>
            Something once taught you a rule — <em>"I'm not good enough,"</em> <em>"I'll be abandoned,"</em> or something close to it. Your brain filed it as dangerous, and it's been running a quiet background scan for anything that matches it ever since.
          </p>
        </div>
        <div className="mt-3 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="font-d2100-sans text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>That's hypervigilance</p>
          <p className="font-d2100-sans text-[12px] leading-snug" style={{ color: 'rgba(251,247,236,0.65)' }}>Not weakness — a very well-trained alarm system, doing exactly what it was built to do.</p>
        </div>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen dark={true} header={{ left: headerLeft, onBack: back }} button={<Btn variant="outlineWhite" onClick={next}>Continue</Btn>}>
        <Headline dark={true} size="sm">The pattern, start to finish.</Headline>
        <Sub dark={true} className="mt-1">The exact loop that turns one old wound into today's avoidance.</Sub>
        <PremiumPathwayDiagram />
      </Screen>
    );
  }

  if (step === 2) {
    return (
      <Screen dark={true} header={{ left: headerLeft, onBack: back }} button={<Btn variant="outlineWhite" onClick={next}>Continue</Btn>}>
        <Headline dark={true} size="sm">The ego reaches for quick relief.</Headline>
        <Sub dark={true} className="mt-1">It grabs distorted thinking to make the discomfort make sense — fast, not accurately.</Sub>
        <div className="mt-3 space-y-2">
          {DISTORTIONS.map((d) => (
            <div key={d.name} className="rounded-2xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center gap-1.5">
                <Glyph name={d.icon} color={GOLD} size={12} />
                <p className="font-d2100-sans text-[11px] font-bold" style={{ color: '#FBF7EC' }}>{d.name}</p>
              </div>
              <p className="font-d2100-read italic text-[11.5px] leading-snug mt-1" style={{ color: 'rgba(251,247,236,0.6)' }}>{d.example}</p>
            </div>
          ))}
        </div>
      </Screen>
    );
  }

  return (
    <Screen dark={true} header={{ left: headerLeft, onBack: back }} button={<Btn variant="outlineWhite" onClick={onNext}>Continue</Btn>} footNote="ON TO BUILDING YOUR PLAN">
      <Headline dark={true} size="sm">This runs deeper than you.</Headline>
      <div className="mt-3 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-d2100-read italic text-[12.5px] leading-snug" style={{ color: 'rgba(251,247,236,0.78)' }}>This happens to confident, successful people too — visible confidence can hide a very active version of this exact loop underneath.</p>
      </div>
      <div className="mt-2.5 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <p className="font-d2100-sans text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>Why it runs so deep</p>
        <p className="font-d2100-sans text-[11.5px] leading-snug" style={{ color: 'rgba(251,247,236,0.65)' }}>For most of human history, the real threats were scarce resources — solved in small groups, with simple, achievable goals. As societies scaled into hierarchies, status and comparison became the new threat: infinite, and never fully satisfied.</p>
      </div>
      <p className="font-d2100-sans text-[10.5px] italic mt-2.5 text-center" style={{ color: 'rgba(251,247,236,0.4)' }}>The old idea of "the devil" offering the world's kingdoms — making status and power look like they matter more than they do.</p>
    </Screen>
  );
};
