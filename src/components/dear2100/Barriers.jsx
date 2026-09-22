// @ts-check
import React from 'react';
import { Screen, Btn, Headline, Sub, Counter, Grid, Pill, SuggestionField, DownArrow, RED, NAVY } from './shared';
import { BANK_BARRIER_EXTRA, BANK_TRIED_BEFORE, BANK_SELFTALK, VERDICT_TABS, BANK_FEELING, FEAR_CHAIN_STEPS, BANK_VOICE } from '@/lib/dear2100Content';

export const S03_BarriersIntro = ({ onNext, onBack }) => (
  <Screen dark={true} header={{ left: 'BARRIERS · A SHORT INVENTORY', onBack }} button={<Btn variant="outlineWhite" onClick={onNext}>Start</Btn>} footNote="NOTHING HERE IS SHARED WITH ANYONE" align="start" compactHeader={false}>
    <div className="text-center px-2 flex-1 flex flex-col items-center" style={{ paddingTop: '50px' }}>
      <Headline dark={true} size="xl" className="text-center">So what's actually in the way?</Headline>
      <Sub dark={true} className="text-center">A few honest questions. You'll find the reason yourself — I'm not going to tell you what it is.</Sub>
    </div>
  </Screen>
);

const BARRIER_OPTIONS = ['Time', 'Money', 'Fear of failing', 'What people think', 'Not good enough', 'Unsure where to start'];
const BARRIER_ICONS = { Time: 'clock', Money: 'coin', 'Fear of failing': 'warning', 'What people think': 'users', 'Not good enough': 'mask', 'Unsure where to start': 'compass' };

export const S04_BarriersTriedBefore = ({ answers, update, onNext, onBack }) => {
  const b = answers.barriers;
  const toggle = (o) => update({ barriers: { ...b, selected: b.selected.includes(o) ? b.selected.filter((x) => x !== o) : [...b.selected, o] } });
  return (
    <Screen dark={false} header={{ left: 'BARRIERS · 01 / 08', pct: 12, onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
      <Headline dark={false} size="md">What's been stopping you?</Headline>
      <Counter n={b.selected.length} />
      <div className="mt-2.5">
        <Grid options={BARRIER_OPTIONS} selected={b.selected} size="sm" cols={3} icons={BARRIER_ICONS} onToggle={toggle} />
      </div>
      <div className="mt-2">
        <SuggestionField placeholder="Anything else in the way? (optional)" suggestions={BANK_BARRIER_EXTRA} value={b.extra} onChange={(v) => update({ barriers: { ...b, extra: v } })} maxHeight={40} compact />
      </div>
      <div className="mt-2.5 pt-2.5" style={{ borderTop: '1px solid rgba(0,56,160,0.12)' }}>
        <p className="font-d2100-sans text-[13px] font-semibold mb-2" style={{ color: 'rgba(0,56,160,0.75)' }}>Have you tried before?</p>
        <div className="flex gap-2">
          {['Yes', 'No', 'Not sure'].map((o) => (
            <Pill key={o} selected={b.triedBefore === o} size="sm" onClick={() => update({ barriers: { ...b, triedBefore: o } })}>{o}</Pill>
          ))}
        </div>
        {b.triedBefore === 'Yes' && (
          <div className="mt-2">
            <SuggestionField placeholder="What have you tried?" suggestions={BANK_TRIED_BEFORE} value={b.triedWhat} onChange={(v) => update({ barriers: { ...b, triedWhat: v } })} maxHeight={40} compact />
          </div>
        )}
      </div>
    </Screen>
  );
};

export const S05_SelfTalkWatching = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'BARRIERS · 02 / 08', pct: 24, onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
    <Headline dark={false} size="md">What do you tell yourself when you think about starting?</Headline>
    <SuggestionField placeholder="I tell myself…" suggestions={BANK_SELFTALK} value={answers.selfTalk} onChange={(v) => update({ selfTalk: v })} maxHeight={92} />
    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,56,160,0.12)' }}>
      <p className="font-d2100-sans text-[14px] font-semibold mb-2.5" style={{ color: 'rgba(0,56,160,0.75)' }}>Who would see you trying?</p>
      <div className="flex flex-wrap gap-2">
        {['Family', 'Partner', 'Friends', 'No one — just me'].map((o) => (
          <Pill key={o} selected={answers.watchers === o} size="sm" onClick={() => update({ watchers: o })}>{o}</Pill>
        ))}
      </div>
    </div>
  </Screen>
);

export const S06_Verdict = ({ answers, update, onNext, onBack }) => {
  const tab = answers.verdictTab;
  return (
    <Screen dark={false} header={{ left: 'BARRIERS · 03 / 08', pct: 36, onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
      <Headline dark={false} size="md">And what would they say?</Headline>
      <Sub dark={false} className="mt-2">Choose what feels true — we'll come back to it.</Sub>
      <div className="flex mt-4 border-b" style={{ borderColor: 'rgba(0,56,160,0.12)' }}>
        {Object.keys(VERDICT_TABS).map((t) => (
          <button key={t} type="button" onClick={() => update({ verdictTab: t })} className="no-tap pb-2.5 px-1 mr-5 font-d2100-sans text-[11.5px] font-bold uppercase tracking-wider" style={{ color: tab === t ? NAVY : 'rgba(0,56,160,0.32)', borderBottom: tab === t ? `2px solid ${RED}` : 'none' }}>
            {t}
          </button>
        ))}
      </div>
      <SuggestionField key={tab} placeholder="They'd probably say…" suggestions={VERDICT_TABS[tab]} value={answers.verdictAnswers[tab]} onChange={(v) => update({ verdictAnswers: { ...answers.verdictAnswers, [tab]: v } })} maxHeight={150} />
    </Screen>
  );
};

const BODY_OPTIONS = ['Chest tightens', 'Stomach drops', 'Throat closes', 'Shoulders up', 'I go numb', 'Can’t sit still'];
const GIVEUP_OPTIONS = ['Certainty', 'Comfort', 'My excuse', 'Predictability'];

export const S07_BodyCost = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'BARRIERS · 04 / 08', pct: 48, onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
    <Headline dark={false} size="md">Where do you feel that?</Headline>
    <Sub dark={false} className="mt-2">The body answers before the mind does.</Sub>
    <div className="mt-4">
      <Grid options={BODY_OPTIONS} selected={answers.bodyFeeling ? [answers.bodyFeeling] : []} onToggle={(o) => update({ bodyFeeling: o })} />
    </div>
    <div className="mt-7 pt-6" style={{ borderTop: '1px solid rgba(0,56,160,0.12)' }}>
      <p className="font-d2100-sans text-[10px] font-semibold uppercase tracking-[0.18em] mb-2.5" style={{ color: 'rgba(0,56,160,0.38)' }}>Also —</p>
      <p className="font-d2100-sans text-[14px] font-semibold mb-2.5" style={{ color: 'rgba(0,56,160,0.75)' }}>What would you have to give up to go after it?</p>
      <div className="flex flex-wrap gap-2">
        {GIVEUP_OPTIONS.map((o) => (
          <Pill key={o} selected={answers.giveUp === o} size="sm" onClick={() => update({ giveUp: o })}>{o}</Pill>
        ))}
      </div>
    </div>
  </Screen>
);

export const S08_Success = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'BARRIERS · 05 / 08', pct: 60, onBack }} button={<Btn variant="outlineRed" onClick={onNext}>Continue</Btn>} footNote="No one is reading this.">
    <Headline dark={false}>If it went well — how would that make you feel?</Headline>
    <SuggestionField placeholder="It would make me feel…" suggestions={BANK_FEELING} value={answers.successFeeling} onChange={(v) => update({ successFeeling: v })} />
  </Screen>
);

// A single cascading fear-chain step: one small typed line + one horizontal,
// single-row strip of suggestion chips right beneath it — sized to read
// easily without ever needing more than the space one step gets.
const FearChainField = ({ placeholder, value, onChange, bank, dark }) => (
  <div>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none bg-transparent outline-none rounded-xl px-3 py-2 font-d2100-read italic text-[12.5px] leading-snug"
      style={{
        border: `1.5px solid ${value ? RED : 'rgba(216,16,8,0.35)'}`,
        color: '#1A2A55',
        background: 'rgba(255,255,255,0.6)',
      }}
    />
    <div className="mt-1.5 flex gap-1.5 overflow-x-auto dear2100-hide-scrollbar pb-0.5">
      {bank.map((s) => {
        const sel = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className="no-tap shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10.5px] font-d2100-sans font-medium transition-all"
            style={{
              background: sel ? `linear-gradient(180deg, #1349C7, ${NAVY})` : 'rgba(255,255,255,0.5)',
              borderColor: sel ? 'transparent' : 'rgba(0,56,160,0.18)',
              color: sel ? '#fff' : 'rgba(0,56,160,0.75)',
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  </div>
);

export const S09_Fear = ({ answers, update, onNext, onBack }) => {
  const chain = answers.fearChain;
  const setFear = (v) => {
    update({ fearChain: [v, '', '', v] });
  };
  return (
    <Screen dark={false} header={{ left: 'BARRIERS · 06 / 08', pct: 72, onBack }} button={<Btn variant="solidRed" onClick={onNext} disabled={!chain[0].trim()}>That's the one</Btn>}>
      <Headline dark={false} size="sm">And if it went badly — why would that be so bad?</Headline>
      <div className="mt-4">
        <SuggestionField
          placeholder="If it went badly..."
          suggestions={FEAR_CHAIN_STEPS[0].bank}
          value={chain[0]}
          onChange={setFear}
          maxHeight={180}
        />
      </div>
    </Screen>
  );
};

export const S10_Voice = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'BARRIERS · 07 / 08', pct: 84, onBack }} button={<Btn variant="outlineRed" onClick={onNext}>Continue</Btn>} footNote="TAKE YOUR TIME">
    <Headline dark={false}>Whose voice is that, really?</Headline>
    <Sub dark={false}>That verdict didn't start with you. Somewhere, you picked it up from someone — or something. Who does it actually sound like?</Sub>
    <SuggestionField placeholder="It sounds like…" suggestions={BANK_VOICE} value={answers.voiceSource} onChange={(v) => update({ voiceSource: v })} />
  </Screen>
);
