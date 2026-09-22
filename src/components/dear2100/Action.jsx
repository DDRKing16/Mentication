// @ts-check
import React from 'react';
import { Screen, Btn, Headline, Sub, Pill, SuggestionField, ContrastList, PathwayMap, Card, RED, NAVY } from './shared';
import { CONTEXT_QUESTIONS, ACTION_PLAN_BANK, BANK_REWARD, BANK_FEELING, PATHWAY_NODES } from '@/lib/dear2100Content';

export const S25_SmallestAction = ({ answers, update, onNext, onBack }) => {
  const ctx = answers.actionContext;
  return (
    <Screen dark={false} header={{ left: 'ACTION · BREAKDOWN ENGINE', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Build my options</Btn>} footNote="SMALL ENOUGH THAT FEAR HAS NOTHING TO GRAB">
      <Headline dark={false} size="lg">Small bold action beats a perfect plan.</Headline>
      <Sub dark={false}>A few quick questions, so what we build actually fits your life.</Sub>
      <div className="mt-5 space-y-4">
        {CONTEXT_QUESTIONS.map((cq) => (
          <div key={cq.key}>
            <p className="font-d2100-sans text-[12px] font-semibold mb-1.5" style={{ color: 'rgba(0,56,160,0.68)' }}>{cq.q}</p>
            <div className="flex gap-2 flex-wrap">
              {cq.options.map((o) => (
                <Pill key={o} size="sm" selected={ctx[cq.key] === o} onClick={() => update({ actionContext: { ...ctx, [cq.key]: o } })}>{o}</Pill>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
};

export const S25b_ActionPlan = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'ACTION · YOUR SMALLEST STEP', pct: 82, onBack }} button={<Btn variant="solidRed" onClick={onNext} disabled={!answers.actionPlan.trim()}>This one</Btn>} footNote="SMALL ENOUGH THAT FEAR HAS NOTHING TO GRAB">
    <Headline dark={false} size="lg">Here's your smallest next step.</Headline>
    <Sub dark={false}>Built around what you just told us. Pick one, or write your own.</Sub>
    <div className="mt-4">
      <SuggestionField placeholder="Or type your own smallest step…" suggestions={ACTION_PLAN_BANK} value={answers.actionPlan} onChange={(v) => update({ actionPlan: v })} />
    </div>
  </Screen>
);

export const S26_Commit = ({ answers, update, onNext, onBack }) => {
  const c = answers.commit;
  return (
    <Screen dark={false} header={{ left: 'ACTION · COMMIT', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>Commit</Btn>} footNote="NO ONE IS CHECKING — THAT'S THE POINT">
      <Headline dark={false} size="lg">When will you do it?</Headline>
      <div className="flex gap-2 mt-4">{['Today', 'Tomorrow', 'This week'].map((o) => (<Pill key={o} selected={c.when === o} size="sm" onClick={() => update({ commit: { ...c, when: o } })}>{o}</Pill>))}</div>
      <div className="flex gap-2 mt-2">{['Morning', 'Afternoon', 'Evening'].map((o) => (<Pill key={o} selected={c.timeOfDay === o} size="sm" onClick={() => update({ commit: { ...c, timeOfDay: o } })}>{o}</Pill>))}</div>
      <div className="mt-4"><Card accent>
        <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest" style={{ color: RED }}>The commitment</p>
        <p className="font-d2100-read italic text-[17px] mt-1.5" style={{ color: NAVY }}>
          {(c.when || 'Today').toLowerCase() === 'today' ? 'This' : `On ${c.when.toLowerCase()},`} {(c.timeOfDay || 'afternoon').toLowerCase()} I'll {(answers.actionPlan || 'take my smallest step').toLowerCase()}.
        </p>
      </Card></div>
      <div className="mt-4">
        <p className="font-d2100-sans text-[13px] font-semibold mb-1" style={{ color: 'rgba(0,56,160,0.72)' }}>When I complete this, I will allow myself to…</p>
        <SuggestionField placeholder="…as a reward" suggestions={BANK_REWARD} value={c.reward} onChange={(v) => update({ commit: { ...c, reward: v } })} maxHeight={94} />
      </div>
    </Screen>
  );
};

export const S26b_PathwayRevisited = ({ answers, onNext, onBack }) => (
  <Screen dark={true} header={{ left: 'THE PATTERN · REVISITED', onBack }} button={<Btn variant="outlineWhite" onClick={onNext}>Continue</Btn>} footNote="THE LOOP DOESN'T CLOSE THE SAME WAY ANYMORE">
    <Headline dark={true} size="sm">Same pattern. Different ending.</Headline>
    <Sub dark={true} className="mt-1">The exact loop from before — with your plan spliced into the middle of it.</Sub>
    <PathwayMap nodes={PATHWAY_NODES.slice(0, 4)} compact highlightLast={false} showLoop={false} />
    <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-widest mt-0.5 pl-[30px]" style={{ color: 'rgba(251,247,236,0.4)' }}>This is where it used to turn into avoidance. Now:</p>
    <div className="mt-2.5 rounded-2xl px-3 py-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <ContrastList
        dark
        avoidTitle="OLD PATH"
        avoidItems={['Avoidance', 'Relief now', 'Wound reinforced']}
        actTitle="WITH YOUR PLAN"
        actItems={[answers.actionPlan || 'Your smallest step', 'Discomfort, on purpose', 'Wound starts to unlearn']}
      />
    </div>
    <p className="font-d2100-read italic text-[11.5px] leading-snug mt-2 text-center" style={{ color: 'rgba(251,247,236,0.55)' }}>Same fear. Different link in the chain — and a different ending.</p>
  </Screen>
);

const OVERRIDE_ROWS = [
  { label: 'OLD PATTERN', dim: true, steps: ['Fear', 'Safety behavior', 'Fear stays in charge'] },
  { label: 'WHAT JUST HAPPENED', dim: false, steps: ['Fear', 'Opposite action', 'Fear pathway weakens'] },
];

export const S27_ActionDone = ({ answers, update, onNext, onBack }) => (
  <Screen dark={true} header={{ left: 'ACTION · DONE', onBack }} button={<Btn variant="outlineWhite" onClick={onNext}>Add to my evidence</Btn>} footNote="ADDS TO YOUR EVIDENCE LOG">
    <div className="flex-1 flex flex-col items-center text-center px-2" style={{ paddingTop: '4px' }}>
      <svg width="36" height="36" viewBox="0 0 52 52" className="mb-1.5"><circle cx="26" cy="26" r="24" stroke={RED} strokeWidth="2" fill="none" /><path d="M15 27l7 7 15-16" stroke={RED} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <Headline dark={true} size="md">You did the thing you'd been avoiding.</Headline>
      <Sub dark={true} className="mt-1.5">Not the whole dream. Just the part fear said you wouldn't. That counts — and it's going in your book.</Sub>
      <div className="mt-3 w-full text-left rounded-2xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
        {OVERRIDE_ROWS.map((r, ri) => (
          <div key={r.label} className={ri > 0 ? 'mt-1.5 pt-1.5' : ''} style={ri > 0 ? { borderTop: '1px solid rgba(255,255,255,0.08)' } : {}}>
            <p className="font-d2100-sans text-[7px] font-bold uppercase tracking-[0.1em] whitespace-nowrap mb-1" style={{ color: r.dim ? 'rgba(251,247,236,0.35)' : RED }}>{r.label}</p>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {r.steps.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <span className="font-d2100-sans text-[8px] shrink-0" style={{ color: r.dim ? 'rgba(251,247,236,0.25)' : 'rgba(251,247,236,0.4)' }}>→</span>}
                  <span
                    className="font-d2100-sans text-[8px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: r.dim ? 'rgba(255,255,255,0.05)' : 'rgba(216,16,8,0.14)', color: r.dim ? 'rgba(251,247,236,0.45)' : '#FBF7EC' }}
                  >
                    {s}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 w-full text-left">
        <p className="font-d2100-sans text-[13px] font-semibold" style={{ color: 'rgba(251,247,236,0.6)' }}>How did that feel?</p>
        <SuggestionField placeholder="It felt…" dark suggestions={BANK_FEELING} value={answers.actionDoneFeeling} onChange={(v) => update({ actionDoneFeeling: v })} maxHeight={60} />
      </div>
    </div>
  </Screen>
);
