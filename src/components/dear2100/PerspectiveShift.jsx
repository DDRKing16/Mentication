// @ts-check
import React, { useState } from 'react';
import {
  Screen, Btn, Headline, Sub, SuggestionField, ContrastList, Pill, Card, Glyph,
  EvolutionIllustration, BrainPathwayIllustration, UrgeWave, URGE_POINTS, RED, NAVY, GOLD,
} from './shared';
import { BANK_LIFENOW, FUTURE20_AVOID, FUTURE20_ACT, JUDGED_OPTIONS, POV_STEPS, BANK_SAFETY, TURNING_FLOW_BASE, LANE_INFO } from '@/lib/dear2100Content';

export const S11_LifeNow = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'FUTURE SELF · RIGHT NOW', pct: 60, onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>} footNote="NO YEARS AWAY — JUST IF YOU STARTED">
    <Headline dark={false} size="lg">What would life look like right now, if you did it?</Headline>
    <div className="mt-4">
      <SuggestionField placeholder="I'd feel…" suggestions={BANK_LIFENOW} value={answers.lifeNow} onChange={(v) => update({ lifeNow: v })} />
    </div>
  </Screen>
);

/* 3-step internal wizard, as in the locked design — one FLOW_DATA entry,
   local step state, not three separate screens. */
export const S13_Future20 = ({ answers, update, onNext, onBack }) => {
  const [step, setStep] = useState(0);
  const f20 = answers.future20;
  const toggle = (key, t) => {
    const list = f20[key];
    const next = list.includes(t) ? list.filter((x) => x !== t) : list.length >= 3 ? list : [...list, t];
    update({ future20: { ...f20, [key]: next } });
  };
  const back = () => (step === 0 ? onBack?.() : setStep((s) => s - 1));

  if (step === 0) {
    return (
      <Screen dark header={{ left: 'FUTURE SELF · 20 YEARS · IF YOU AVOID', onBack: back }} button={<Btn variant="outlineWhite" onClick={() => setStep(1)}>Continue</Btn>} footNote="PICK UP TO THREE">
        <Headline dark size="md">If you keep avoiding it, what would life look like in 20 years?</Headline>
        <p className="font-d2100-sans text-[12.5px] mt-1.5" style={{ color: 'rgba(251,247,236,0.45)' }}>Select up to three · <span className="font-semibold">{f20.avoidPicks.length} selected</span></p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FUTURE20_AVOID.map((t) => (
            <Pill key={t} dark selected={f20.avoidPicks.includes(t)} size="sm" onClick={() => toggle('avoidPicks', t)}>{t}</Pill>
          ))}
        </div>
      </Screen>
    );
  }
  if (step === 1) {
    return (
      <Screen dark header={{ left: 'FUTURE SELF · 20 YEARS · IF YOU ACT', onBack: back }} button={<Btn variant="outlineWhite" onClick={() => setStep(2)}>Continue</Btn>} footNote="PICK UP TO THREE">
        <Headline dark size="md">And what if you acted on it?</Headline>
        <p className="font-d2100-sans text-[12.5px] mt-1.5" style={{ color: 'rgba(251,247,236,0.45)' }}>Select up to three · <span className="font-semibold">{f20.actPicks.length} selected</span></p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FUTURE20_ACT.map((t) => (
            <Pill key={t} dark selected={f20.actPicks.includes(t)} size="sm" onClick={() => toggle('actPicks', t)}>{t}</Pill>
          ))}
        </div>
      </Screen>
    );
  }
  return (
    <Screen dark header={{ left: 'FUTURE SELF · 20 YEARS · YOUR CHOICE', onBack: back }} button={<Btn variant="outlineWhite" onClick={onNext}>I choose action</Btn>} footNote="NOBODY GETS BOTH">
      <Headline dark size="xl">Twenty years.</Headline>
      <Sub dark className="text-[16px]">Nobody gets both roads. Which one do you want?</Sub>
      <div className="mt-6">
        <ContrastList
          dark
          avoidTitle="IF I KEEP AVOIDING"
          avoidItems={f20.avoidPicks.length ? f20.avoidPicks : ['Nothing selected']}
          actTitle="IF I ACT ON IT"
          actItems={f20.actPicks.length ? f20.actPicks : ['Nothing selected']}
        />
      </div>
      <p className="font-d2100-sans text-[11px] font-semibold uppercase tracking-wide mt-5 mb-2" style={{ color: 'rgba(251,247,236,0.5)' }}>Which would you prefer?</p>
      <div className="grid grid-cols-2 gap-2.5">
        {[{ key: 'avoid', label: 'Keep avoiding it' }, { key: 'act', label: 'Act on it' }].map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => update({ future20: { ...f20, preferred: o.key } })}
            className="no-tap relative rounded-2xl px-3 py-3 text-left"
            style={{
              background: f20.preferred === o.key ? (o.key === 'act' ? `linear-gradient(180deg, #E42115, ${RED})` : 'rgba(255,255,255,0.1)') : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${f20.preferred === o.key ? (o.key === 'act' ? RED : 'rgba(255,255,255,0.4)') : 'rgba(255,255,255,0.14)'}`,
            }}
          >
            {f20.preferred === o.key && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>
                <svg width="12" height="12" viewBox="0 0 14 14"><path d="M3 7.2l2.5 2.5 5.5-5.4" stroke={o.key === 'act' ? RED : NAVY} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </span>
            )}
            <p className="font-d2100-sans text-[12.5px] font-semibold" style={{ color: '#FBF7EC' }}>{o.label}</p>
          </button>
        ))}
      </div>
    </Screen>
  );
};

export const S14_RadicalAcceptance = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'RADICAL ACCEPTANCE', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>} footNote="PAUSE · REFLECT · CHOOSE">
    <h1 className="font-d2100-display font-extrabold text-[44px] leading-[1.05] tracking-tight mt-2 text-navy-900" style={{ color: NAVY }}>
      You'll be judged regardless<span style={{ color: RED }}>.</span>
    </h1>
    <p className="font-d2100-read italic text-[22px] leading-relaxed mt-4" style={{ color: 'rgba(26,26,26,0.85)' }}>
      So the real question was never whether. It's what for.
    </p>
    <p className="font-d2100-sans text-[12px] font-bold tracking-widest mt-8 mb-4 uppercase" style={{ color: 'rgba(0,56,160,0.6)' }}>
      Which do you want to be judged for?
    </p>
    <div className="flex flex-col gap-3">
      {JUDGED_OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => update({ radicalAcceptanceChoice: o.id })}
          className="no-tap text-left rounded-2xl border px-5 py-4 font-d2100-sans text-[15px] font-bold transition-all relative overflow-hidden"
          style={{
            background: answers.radicalAcceptanceChoice === o.id ? `linear-gradient(180deg, #1349C7, ${NAVY})` : 'rgba(255,255,255,0.7)',
            borderColor: answers.radicalAcceptanceChoice === o.id ? NAVY : 'rgba(0,56,160,0.18)',
            color: answers.radicalAcceptanceChoice === o.id ? '#fff' : 'rgba(0,56,160,0.82)',
            boxShadow: answers.radicalAcceptanceChoice === o.id ? `0 12px 24px -8px ${NAVY}99` : '0 2px 4px rgba(0,56,160,0.04)',
          }}
        >
          {answers.radicalAcceptanceChoice === o.id && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-sm">
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7.2l2.5 2.5 5.5-5.4" stroke={RED} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          )}
          <span className="block pr-8">{o.text}</span>
        </button>
      ))}
    </div>
    <div className="w-12 h-[3px] mt-10 mx-auto rounded-full" style={{ background: RED }} />
  </Screen>
);

export const S15_Evolution = ({ onNext, onBack }) => {
  const [focus, setFocus] = useState(0);
  return (
    <Screen
      dark={false}
      align="start"
      header={{ left: 'EVOLUTIONARY MODEL · SYSTEM 1', onBack }}
      illustration={
        <div className="px-6 pt-4">
          <Headline dark={false} size="md">Your brain wants to keep you safe, not happy.</Headline>
          <EvolutionIllustration step={focus} />
        </div>
      }
      button={<Btn variant="solidNavy" onClick={onNext}>Continue</Btn>}
    >
      <div className="flex-1 flex flex-col justify-between py-2">
        <div>
          <p className="font-d2100-read italic text-[17px] leading-relaxed" style={{ color: 'rgba(26,26,26,0.58)' }}>Your brain moved before you did.</p>
          <Sub dark={false} className="mt-1 text-[14px]">300,000 years in the making. Tap a step to see why.</Sub>
        </div>
        <div className="space-y-2.5 my-3">
          {POV_STEPS.map((s, i) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setFocus(i)}
              className="no-tap flex gap-3.5 items-start w-full text-left rounded-2xl px-4 py-3 transition-all"
              style={{
                background: focus === i ? 'rgba(216,16,8,0.06)' : 'rgba(255,255,255,0.35)',
                border: focus === i ? '1px solid rgba(216,16,8,0.22)' : '1px solid rgba(0,56,160,0.05)',
                boxShadow: focus === i ? '0 4px 12px rgba(216,16,8,0.04)' : 'none'
              }}
            >
              <span className="font-d2100-sans text-[11px] font-bold mt-0.5" style={{ color: RED }}>{s.n}</span>
              <div>
                <p className="font-d2100-sans text-[14px] font-bold" style={{ color: NAVY }}>{s.t}</p>
                <p className="font-d2100-sans text-[12px] mt-0.5" style={{ color: 'rgba(26,26,26,0.55)' }}>{s.d}</p>
                {focus === i && <p className="font-d2100-sans text-[11.5px] font-semibold mt-1.5" style={{ color: RED }}>{s.plain}</p>}
              </div>
            </button>
          ))}
        </div>
        <div>
          <Card accent>
            <p className="font-d2100-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: RED }}>Why it matters</p>
            <p className="font-d2100-sans text-[12.5px] leading-snug mt-1" style={{ color: 'rgba(26,26,26,0.68)' }}>Old software, doing its job — there just aren't tigers left to run from.</p>
          </Card>
        </div>
      </div>
    </Screen>
  );
};

export const S16_Safety = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'SAFETY BEHAVIOURS', onBack }} button={<Btn variant="solidRed" onClick={onNext}>These are mine</Btn>} footNote="RECOGNISING THEM IS THE WHOLE STEP">
    <Headline dark={false}>The things you do to feel safe.</Headline>
    <Sub dark={false}>Each one works for a minute — and teaches your brain the fear was right.</Sub>
    <SuggestionField placeholder="One thing I do is… (optional)" suggestions={BANK_SAFETY} value={answers.safetyBehavior} onChange={(v) => update({ safetyBehavior: v })} />
  </Screen>
);

export const S17_Override = ({ onNext, onBack }) => {
  const [stop, setStop] = useState(0);
  return (
    <Screen dark={false} header={{ left: 'OVERRIDE · PAUSE MODE', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>I feel the urge — pause 60 seconds</Btn>} footNote="BREATHE · OBSERVE · CHOOSE">
      <Headline dark={false}>Notice, don't react.</Headline>
      <Sub dark={false}>Tap through the wave — the urge always peaks, then it passes.</Sub>
      <UrgeWave stop={stop} onAdvance={() => setStop((s) => Math.min(s + 1, URGE_POINTS.length - 1))} />
      <div className="mt-4"><Card>
        <p className="font-d2100-read text-[16px]" style={{ color: NAVY }}>Let the urge travel upstairs.</p>
        <p className="font-d2100-sans text-[12.5px] mt-2 leading-relaxed" style={{ color: 'rgba(26,26,26,0.55)' }}>Your prefrontal cortex handles planning and choice — it just arrives a few seconds after the alarm. Wait for it.</p>
      </Card></div>
      <div className="grid grid-cols-3 gap-2.5 mt-5">
        {[
          { icon: 'clock', label: 'Slows the reaction' },
          { icon: 'shield', label: 'Builds real control' },
          { icon: 'spark', label: 'Retrains the alarm' },
        ].map((b) => (
          <div key={b.label} className="rounded-2xl px-2.5 py-3.5 flex flex-col items-center gap-2 text-center" style={{ background: 'rgba(0,56,160,0.05)', border: '1px solid rgba(0,56,160,0.10)' }}>
            <Glyph name={b.icon} color={`${NAVY}b0`} size={16} />
            <span className="font-d2100-sans text-[10px] font-semibold leading-tight" style={{ color: 'rgba(0,56,160,0.7)' }}>{b.label}</span>
          </div>
        ))}
      </div>
    </Screen>
  );
};

export const S18_TurningPoint = ({ answers, update, onNext, onBack }) => {
  const [lane, setLane] = useState('Fast');
  const turningFlow = TURNING_FLOW_BASE.map((n) => (n.label === 'Want' ? { ...n, v: answers.goal || 'my goal' } : n.label === 'Intended action' ? { ...n, v: answers.actionPlan || 'The first small step' } : n));
  return (
    <Screen dark={true} header={{ left: 'BRAIN SCIENCE · THE TURNING POINT', onBack }} button={<Btn variant="outlineWhite" onClick={onNext}>Continue</Btn>} footNote="THE EGO PROTECTS YOU FROM RISK, NOT FROM REGRET">
      <div className="flex-1 flex flex-col justify-between py-1">
        {/* Top: Title and Lanes Illustration */}
        <div className="space-y-3 shrink-0">
          <Headline dark={true} size="sm">Your brain has two lanes — and the ego can hijack either one.</Headline>
          <BrainPathwayIllustration />
        </div>

        {/* Middle: Lane Selector & Clearer Cursive description */}
        <div className="space-y-3 shrink-0">
          <div className="flex gap-2 justify-center">
            {Object.keys(LANE_INFO).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLane(l)}
                className="no-tap flex items-center gap-2 px-3.5 py-1.5 rounded-full font-d2100-sans text-[11px] font-bold uppercase tracking-wider transition-all"
                style={{
                  background: lane === l ? (l === 'Fast' ? RED : GOLD) : 'rgba(255,255,255,0.04)',
                  color: lane === l ? (l === 'Fast' ? '#fff' : '#1A2A55') : 'rgba(251,247,236,0.5)',
                  border: `1px solid ${lane === l ? 'transparent' : 'rgba(255,255,255,0.15)'}`
                }}
              >
                <Glyph name={LANE_INFO[l].icon} color={lane === l ? (l === 'Fast' ? '#fff' : '#1A2A55') : 'rgba(251,247,236,0.5)'} size={11} />
                {l} lane
              </button>
            ))}
          </div>
          <div className="rounded-2xl px-4 py-3 text-center min-h-[72px] flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="font-d2100-hand text-[18px] leading-snug font-medium" style={{ color: 'rgba(251,247,236,0.9)' }}>
              {LANE_INFO[lane].body}
            </p>
          </div>
        </div>

        {/* Bottom: The moment it turns (interactive flow map & consequences) */}
        <div className="space-y-3 pt-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-[0.16em] mb-2.5 text-center" style={{ color: 'rgba(251,247,236,0.4)' }}>The moment it turns</p>
            <div className="relative flex items-center gap-1 justify-center px-1">
              <svg className="absolute" style={{ left: '16%', top: -11, width: '26%', height: 12 }} viewBox="0 0 100 30" preserveAspectRatio="none">
                <path d="M92 26 Q50 -14 8 26" fill="none" stroke={RED} strokeWidth="2" strokeDasharray="2.5 3" strokeLinecap="round" />
                <path d="M8 26 l-4 -7 M8 26 l7 -3" fill="none" stroke={RED} strokeWidth="2" strokeLinecap="round" />
              </svg>
              {turningFlow.map((n, i) => (
                <React.Fragment key={n.label}>
                  {i > 0 && <div className="flex-1 h-[1.5px]" style={{ background: n.label === 'Turning point' || turningFlow[i - 1].label === 'Turning point' ? RED : 'rgba(255,255,255,0.15)' }} />}
                  <div className="flex flex-col items-center shrink-0" style={{ width: 44 }}>
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95"
                      style={{ background: n.label === 'Turning point' ? `linear-gradient(180deg, #E42115, ${RED})` : 'rgba(255,255,255,0.06)', border: n.label === 'Turning point' ? 'none' : '1px solid rgba(255,255,255,0.18)' }}
                    >
                      <Glyph name={n.icon} color={n.label === 'Turning point' ? '#fff' : 'rgba(251,247,236,0.7)'} size={12} />
                    </div>
                    <p className="font-d2100-sans text-[7.5px] font-bold uppercase tracking-tight mt-1 text-center leading-tight shrink-0" style={{ color: n.label === 'Turning point' ? RED : 'rgba(251,247,236,0.4)' }}>{n.label}</p>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="font-d2100-sans text-[8px] italic text-center mt-1.5" style={{ color: 'rgba(216,16,8,0.7)' }}>↺ loops back to the same behavior, until something breaks it</p>
          </div>

          <SuggestionField placeholder="Right at that moment, what do you actually do?" dark suggestions={BANK_SAFETY} value={answers.pathwayBehavior} onChange={(v) => update({ pathwayBehavior: v })} maxHeight={45} compact />

          <div className="rounded-2xl px-3.5 py-2 flex items-center justify-between gap-3" style={{ background: 'rgba(216,16,8,0.08)', border: '1px solid rgba(216,16,8,0.15)' }}>
            <div>
              <p className="font-d2100-sans text-[7px] font-bold uppercase tracking-widest" style={{ color: RED }}>Long-term consequence</p>
              <p className="font-d2100-read italic text-[11px] leading-snug mt-0.5" style={{ color: 'rgba(251,247,236,0.8)' }}>The fear never gets tested — so it stays in charge.</p>
            </div>
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(216,16,8,0.15)' }}>
              <Glyph name="warning" color={RED} size={11} />
            </div>
          </div>
        </div>
      </div>
    </Screen>
  );
};

const AWARENESS_NODES = [
  { key: 'want', icon: 'compass', label: 'The want' },
  { key: 'fear', icon: 'shield', label: 'The fear underneath' },
];

export const S19_Awareness = ({ answers, update, onNext, onBack }) => {
  const fear = answers.fearChain[3] || 'I’m not worthy of it';
  const values = { want: answers.goal || 'the thing you’ve always wanted to do', fear };
  return (
    <Screen dark={false} header={{ left: 'AWARENESS', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
      <div className="flex-1 flex flex-col justify-between py-1">
        {/* Top: Headline */}
        <div className="shrink-0">
          <Headline dark={false} size="md">You can see it now.</Headline>
        </div>

        {/* Middle: Awareness Flow Card */}
        <div
          className="relative rounded-[22px] p-4 shrink-0 transition-all"
          style={{
            background: 'linear-gradient(160deg, #FBF7EC 0%, #F1EBDC 100%)',
            border: '1px solid rgba(0,56,160,0.08)',
            boxShadow: '0 12px 24px -16px rgba(0,56,160,0.15), inset 0 1px 0 rgba(255,255,255,0.85)'
          }}
        >
          {AWARENESS_NODES.map((n, i) => (
            <div key={n.key} className="relative flex gap-3 pb-3">
              <div className="absolute left-[13px] top-7 bottom-0 w-[1.5px]" style={{ background: 'rgba(216,16,8,0.15)' }} />
              <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: 'rgba(216,16,8,0.08)' }}>
                <Glyph name={n.icon} color={RED} size={12} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-[0.14em]" style={{ color: 'rgba(0,56,160,0.5)' }}>{n.label}</p>
                <p className="font-d2100-read italic text-[14.5px] leading-snug mt-0.5" style={{ color: NAVY }}>{values[n.key]}</p>
              </div>
            </div>
          ))}
          <div className="relative flex gap-3">
            <div className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 z-10" style={{ background: `linear-gradient(180deg, #E42115, ${RED})` }}>
              <Glyph name="mask" color="#fff" size={12} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-[0.14em]" style={{ color: RED }}>Safety behavior — avoids testing it</p>
              <div className="mt-1">
                <SuggestionField placeholder="What do you do instead?" suggestions={BANK_SAFETY} value={answers.safetyBehavior} onChange={(v) => update({ safetyBehavior: v })} compact />
              </div>
            </div>
          </div>
        </div>

        {/* Middle 2: Explanation Block */}
        <div className="rounded-2xl px-4 py-3 shrink-0" style={{ background: 'rgba(0,56,160,0.03)', border: '1px solid rgba(0,56,160,0.05)' }}>
          <p className="font-d2100-read italic text-[12px] leading-relaxed text-center" style={{ color: 'rgba(26,26,26,0.65)' }}>
            This protects you from the fear coming true — relief now, quiet dissonance later. This voice isn't really you. It's your brain's self-protective alarm, running old software designed to keep you safe from a perceived threat that doesn't actually exist.
          </p>
        </div>

        {/* Bottom: Reframe Card */}
        <div className="shrink-0">
          <Card accent>
            <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest" style={{ color: RED }}>The reframe</p>
            <p className="font-d2100-read italic text-[13.5px] leading-snug mt-1.5" style={{ color: NAVY }}>
              My performance on this doesn't define my worth. If I make mistakes doing it, that's an expected part of learning. I've made a values-based decision — so I can be at peace no matter what happens.
            </p>
          </Card>
        </div>
      </div>
    </Screen>
  );
};
