// @ts-check
import React, { useState, useMemo } from 'react';
import { Screen, Btn, Headline, ReadoutBox, TextInput, ValueTriad, Glyph, RED, NAVY, GOLD } from './shared';
import { VALUES_BANK, VALUES_IN_ACTION_DATA, CHARTER_VALUES_DEFAULT } from '@/lib/dear2100Content';

export const S20_Values = ({ answers, update, onNext, onBack }) => {
  const chosen = answers.valuesChosen;
  const toggle = (v) =>
    update({
      valuesChosen: chosen.includes(v) ? chosen.filter((x) => x !== v) : chosen.length >= 3 ? [...chosen.slice(1), v] : [...chosen, v],
    });
  return (
    <Screen dark={false} header={{ left: 'VALUES · INTERNAL COMPASS', onBack }} button={<Btn variant="solidNavy" onClick={onNext} disabled={chosen.length === 0}>Continue</Btn>} footNote="YOU CAN UPDATE THESE ANY TIME">
      <Headline dark={false} size="md">What kind of person do you want to be?</Headline>
      <p className="font-d2100-sans text-[12.5px] mt-2" style={{ color: 'rgba(26,26,26,0.45)' }}>Select 3 that resonate most · <span className="font-semibold">{chosen.length} selected</span></p>
      <ReadoutBox value={chosen.join(' · ')} placeholder="Pick up to three values below…" />
      <div className="mt-3">
        <div
          className="flex flex-wrap gap-2 overflow-y-auto dear2100-hide-scrollbar"
          style={{ maxHeight: 118, maskImage: 'linear-gradient(180deg, black 80%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, black 80%, transparent 100%)' }}
        >
          {VALUES_BANK.map((v) => {
            const sel = chosen.includes(v);
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggle(v)}
                className="no-tap shrink-0 rounded-full border px-3.5 py-2 text-[12px] font-d2100-sans font-medium whitespace-nowrap transition-all"
                style={{
                  background: sel ? `linear-gradient(180deg, #1349C7, ${NAVY})` : 'rgba(255,255,255,0.5)',
                  borderColor: sel ? 'transparent' : 'rgba(0,56,160,0.18)',
                  color: sel ? '#fff' : 'rgba(0,56,160,0.75)',
                  boxShadow: sel ? `0 6px 14px -6px rgba(0,56,160,0.45)` : 'none',
                }}
              >
                {v}
              </button>
            );
          })}
        </div>
        <p className="font-d2100-sans text-[10px] mt-2" style={{ color: 'rgba(0,56,160,0.32)' }}>{VALUES_BANK.length} values — scroll for more</p>
      </div>
      <ValueTriad values={chosen} />
    </Screen>
  );
};

export const S21_ValuesInAction = ({ answers, update, onNext, onBack }) => {
  const chosen = answers.valuesChosen.length ? answers.valuesChosen : CHARTER_VALUES_DEFAULT;
  const [tab, setTab] = useState(chosen[0]);
  const [seed, setSeed] = useState(0);
  const data = VALUES_IN_ACTION_DATA[tab] || VALUES_IN_ACTION_DATA[CHARTER_VALUES_DEFAULT[0]];
  const shown = useMemo(() => {
    const offset = seed % data.items.length;
    return [...data.items.slice(offset), ...data.items.slice(0, offset)].slice(0, 4);
  }, [tab, seed, data.items]);
  const custom = answers.valuesCustomByValue[tab] || '';
  return (
    <Screen dark={false} header={{ left: 'VALUES IN ACTION', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>Add to your daily practice</Btn>}>
      <Headline dark={false} size="md">What your values look like, in real moments.</Headline>
      <div className="flex gap-2 mt-4 mb-1 flex-wrap">
        {chosen.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setSeed(0); }}
            className="no-tap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-d2100-sans text-[11.5px] font-bold"
            style={{ background: tab === t ? NAVY : 'transparent', color: tab === t ? '#fff' : 'rgba(0,56,160,0.5)', border: `1px solid ${tab === t ? NAVY : 'rgba(0,56,160,0.2)'}` }}
          >
            <Glyph name={(VALUES_IN_ACTION_DATA[t] || data).icon} color={tab === t ? '#fff' : 'rgba(0,56,160,0.5)'} size={12} />
            {t}
          </button>
        ))}
      </div>
      <div
        className="relative mt-3 rounded-[24px] p-5 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FBF7EC 0%, #F1EBDC 100%)', border: '1px solid rgba(0,56,160,0.08)', boxShadow: '0 20px 40px -24px rgba(0,56,160,0.32), inset 0 1px 0 rgba(255,255,255,0.85)' }}
      >
        <div className="absolute -top-10 -right-10 w-[130px] h-[130px] rounded-full pointer-events-none" style={{ background: `radial-gradient(closest-side, ${GOLD}22, rgba(216,16,8,0) 72%)` }} />
        <div className="relative flex items-center justify-between">
          <Headline dark={false} size="sm">{tab} looks like:</Headline>
          <button type="button" onClick={() => setSeed((s) => s + 1)} className="no-tap flex items-center gap-1 font-d2100-sans text-[10.5px] font-bold uppercase tracking-wide active:scale-95 transition-all" style={{ color: RED }}>
            <Glyph name="spark" color={RED} size={11} /> Shuffle
          </button>
        </div>
        <ul className="relative mt-3.5 space-y-3">
          {shown.map((t, i) => (
            <li key={t} className="flex gap-2.5 font-d2100-sans text-[13.5px] leading-snug" style={{ color: 'rgba(26,26,26,0.72)' }}>
              <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 font-d2100-sans text-[10px] font-bold" style={{ background: 'rgba(216,16,8,0.1)', color: RED }}>{i + 1}</span>
              {t}
            </li>
          ))}
        </ul>
        <p className="relative font-d2100-sans text-[10px] uppercase tracking-widest mt-4" style={{ color: 'rgba(0,56,160,0.4)' }}>{data.items.length} moments for {tab.toLowerCase()} · tap shuffle for more</p>
      </div>
      <TextInput compact placeholder={`Add your own way to live ${tab.toLowerCase()}…`} value={custom} onChange={(v) => update({ valuesCustomByValue: { ...answers.valuesCustomByValue, [tab]: v } })} />
    </Screen>
  );
};

export const S22_Charter = ({ answers, onNext, onBack }) => {
  const values = answers.valuesChosen.length ? answers.valuesChosen : CHARTER_VALUES_DEFAULT;
  return (
    <Screen dark={false} header={{ left: 'CHARTER', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
      <div className="relative text-center">
        <div
          className="absolute -top-4 left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full pointer-events-none"
          style={{ background: `radial-gradient(closest-side, ${GOLD}20, rgba(216,16,8,0) 72%)`, filter: 'blur(2px)' }}
        />
        <p className="relative font-d2100-sans text-[10.5px] font-bold uppercase tracking-[0.2em]" style={{ color: RED }}>Charter</p>
        <div className="relative w-8 h-[2px] mx-auto my-2" style={{ background: RED }} />
        <h1 className="relative font-d2100-hand font-bold text-[34px] leading-[1.15]" style={{ color: NAVY }}>
          Value-based action over everything.
        </h1>
        <div className="relative font-d2100-read italic text-[15px] leading-relaxed mt-5 space-y-3" style={{ color: 'rgba(26,26,26,0.6)' }}>
          <p>We're all limited in how we understand this world. But I'm doing my best.</p>
          <p>Whatever you think about me, I've probably already thought about myself.</p>
          <p>What matters now are the values I live by. No one's perfect.</p>
          <p>I choose to be a reason someone feels better, feels encouraged.</p>
          <p>I choose to act assertively in following my mission, because I know my mission adds value and is helpful.</p>
        </div>
        <p className="relative font-d2100-sans text-[11px] mt-6" style={{ color: 'rgba(26,26,26,0.4)' }}>{values.length} values, lived out loud</p>
      </div>
    </Screen>
  );
};
