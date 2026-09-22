// @ts-check
import React, { useState } from 'react';
import { Screen, Btn, Headline, Sub, Pill, TextInput, SuggestionField, Card, RED, NAVY } from './shared';
import { planStepsFor, BANK_PRIDE } from '@/lib/dear2100Content';

export const S28_Alignment = ({ answers, update, onNext, onBack }) => {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState('');
  const planSteps = planStepsFor(answers.actionPlan);
  const choices = answers.alignmentChoices;
  const choose = (o) => {
    update({ alignmentChoices: [...choices, o] });
    setDraft('');
    if (step + 1 >= planSteps.length) return;
    setStep((s) => s + 1);
  };
  return (
    <Screen dark={false} header={{ left: 'ACTION · MAKING IT HAPPEN', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>Save this plan</Btn>} footNote="YOU AND THE PLAN, BUILT TOGETHER">
      <Headline dark={false} size="md">Let's make it happen.</Headline>
      <Sub dark={false}>You pick the moves — I'll help shape them into a plan.</Sub>
      <div className="mt-4 space-y-3">
        {planSteps.slice(0, step + 1).map((s, i) => (
          <div key={i}>
            <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 inline-block max-w-[88%]" style={{ background: 'rgba(0,56,160,0.06)' }}>
              <p className="font-d2100-sans text-[12.5px] leading-snug" style={{ color: NAVY }}>{s.ai}</p>
            </div>
            {choices[i] && (
              <div className="flex justify-end mt-2">
                <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5" style={{ background: `linear-gradient(180deg, #1349C7, ${NAVY})` }}>
                  <p className="font-d2100-sans text-[12.5px] font-medium text-white">{choices[i]}</p>
                </div>
              </div>
            )}
            {i === step && !choices[i] && s.options.length > 0 && (
              <>
                <div className="mt-2.5"><TextInput placeholder="Or tell me in your own words…" compact value={draft} onChange={setDraft} /></div>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {s.options.map((o) => (
                    <Pill key={o} size="sm" onClick={() => choose(o)}>{o}</Pill>
                  ))}
                  {draft.trim() && <Pill size="sm" onClick={() => choose(draft.trim())}>Use my own</Pill>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
};

export const S29_Evidence = ({ answers, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'REFLECTION · EVIDENCE', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>Continue</Btn>} footNote="THE ARGUMENT AGAINST THE OLD VOICE">
    <Headline dark={false}>Evidence I can do it.</Headline>
    <p className="font-d2100-sans text-[10.5px] font-bold uppercase tracking-widest mt-4" style={{ color: RED }}>{answers.evidence.length} entries</p>
    <div className="mt-3.5 space-y-4">
      {answers.evidence.length ? answers.evidence.map((e) => (
        <div key={e.date} className="pb-4" style={{ borderBottom: '1px solid rgba(0,56,160,0.1)' }}>
          <p className="font-d2100-sans text-[10px]" style={{ color: 'rgba(26,26,26,0.4)' }}>{new Date(e.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}</p>
          <p className="font-d2100-read italic text-[14.5px] mt-1" style={{ color: NAVY }}>{e.text}</p>
        </div>
      )) : (
        <p className="font-d2100-read italic text-[14.5px]" style={{ color: 'rgba(26,26,26,0.45)' }}>Nothing here yet — it fills up as you take real action through this flow.</p>
      )}
      <p className="font-d2100-sans text-[11.5px] text-center" style={{ color: 'rgba(0,56,160,0.32)' }}>New entries land here each time you act</p>
    </div>
  </Screen>
);

export const S29b_Pride = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'REFLECTION · WHAT YOU’RE PROUD OF', onBack }} button={<Btn variant="solidNavy" onClick={onNext}>Continue</Btn>}>
    <Headline dark={false} size="lg">What are you most proud of?</Headline>
    <Sub dark={false}>Anything counts — big or small.</Sub>
    <div className="mt-4">
      <SuggestionField placeholder="I'm proud that I…" suggestions={BANK_PRIDE} value={answers.pride} onChange={(v) => update({ pride: v })} />
    </div>
  </Screen>
);

export const S29c_PrideScared = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'REFLECTION · THE PATTERN', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
    <Headline dark={false} size="lg">Did that involve taking action even though you were scared?</Headline>
    <div className="flex gap-2 mt-5">
      {['Yes', 'Some of it', 'Not really'].map((o) => (
        <Pill key={o} selected={answers.prideScared === o} onClick={() => update({ prideScared: o })}>{o}</Pill>
      ))}
    </div>
    <div className="mt-5"><Card accent>
      <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest" style={{ color: RED }}>The pattern</p>
      <p className="font-d2100-read italic text-[15px] leading-relaxed mt-1.5" style={{ color: NAVY }}>
        It's not that the fear was missing — it's that you moved anyway. That's exactly what's going in your book.
      </p>
    </Card></div>
  </Screen>
);

export const S30_Book = ({ answers, onNext, onBack }) => {
  const values = answers.valuesChosen.length ? answers.valuesChosen : ['Courage', 'Kindness', 'Freedom'];
  const totalFields = 12;
  const filledFields = [answers.goal, answers.selfTalk, answers.voiceSource, answers.lifeNow, answers.safetyBehavior, answers.actionPlan, answers.commit.reward, answers.actionDoneFeeling, answers.pride, answers.successFeeling, answers.valuesChosen.length ? 'x' : '', answers.evidence.length ? 'x' : ''].filter(Boolean).length;
  const pct = Math.round((filledFields / totalFields) * 100);
  return (
    <Screen dark={false} header={{ left: 'YOUR 2100 BOOK', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Continue</Btn>}>
      <div className="flex items-center justify-between">
        <Headline dark={false} size="md">Your 2100 Book</Headline>
        <span className="font-d2100-sans text-[9.5px] font-bold tracking-wide px-2 py-0.5 rounded-full" style={{ color: RED, background: 'rgba(216,16,8,0.08)' }}>{pct}% COMPLETE</span>
      </div>
      <div className="h-1.5 w-full rounded-full mt-3 overflow-hidden" style={{ background: 'rgba(0,56,160,0.1)' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: RED }} />
      </div>

      <div
        className="mt-5 relative rounded-[26px] pt-6 pb-5 px-5 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #FBF7EC 0%, #F1EBDC 100%)', border: '1px solid rgba(0,56,160,0.08)', boxShadow: '0 20px 40px -26px rgba(0,56,160,0.28), inset 0 1px 0 rgba(255,255,255,0.85)' }}
      >
        <svg className="absolute -right-8 -top-8" width="130" height="130" viewBox="0 0 140 140" opacity="0.06">
          <circle cx="70" cy="70" r="68" fill="none" stroke={NAVY} strokeWidth="1" />
          <circle cx="70" cy="70" r="48" fill="none" stroke={NAVY} strokeWidth="1" />
        </svg>
        <p className="relative font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest" style={{ color: RED }}>Who I am, right now</p>
        <p className="relative font-d2100-read italic text-[17px] mt-2 leading-snug" style={{ color: NAVY }}>
          I'm someone who lives by {values.join(', ').toLowerCase()} — proving it a little more each week.
        </p>
        <div className="relative grid grid-cols-2 gap-4 mt-5 pt-5" style={{ borderTop: '1px solid rgba(0,56,160,0.08)' }}>
          <div>
            <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(0,56,160,0.5)' }}>What I want</p>
            <p className="font-d2100-sans text-[11.5px] mt-1.5 leading-snug" style={{ color: 'rgba(26,26,26,0.65)' }}>{answers.goal || 'Not written yet'}</p>
          </div>
          <div>
            <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(0,56,160,0.5)' }}>My smallest step</p>
            <p className="font-d2100-sans text-[11.5px] mt-1.5 leading-snug" style={{ color: 'rgba(26,26,26,0.65)' }}>{answers.actionPlan || 'Not chosen yet'}</p>
          </div>
        </div>
        <div className="relative mt-5 pt-5 flex gap-1.5 flex-wrap" style={{ borderTop: '1px solid rgba(0,56,160,0.08)' }}>
          {values.map((v) => (
            <span key={v} className="rounded-full border px-2.5 py-1 text-[10.5px] font-d2100-sans font-semibold" style={{ borderColor: 'rgba(0,56,160,0.25)', color: NAVY }}>{v}</span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[20px] p-4" style={{ background: 'rgba(0,56,160,0.04)', border: '1px solid rgba(0,56,160,0.08)' }}>
        <div className="flex items-center justify-between">
          <p className="font-d2100-sans text-[9.5px] font-bold uppercase tracking-widest" style={{ color: RED }}>Evidence so far</p>
          <p className="font-d2100-sans text-[9.5px]" style={{ color: 'rgba(26,26,26,0.4)' }}>{answers.evidence.length} entries</p>
        </div>
        <div className="flex gap-4 mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,56,160,0.08)' }}>
          <div className="flex-1">
            <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(0,56,160,0.5)' }}>Proudest so far</p>
            <p className="font-d2100-read italic text-[12.5px] mt-1 leading-snug" style={{ color: NAVY }}>{answers.pride || 'Not written yet'}</p>
          </div>
          <div className="flex-1">
            <p className="font-d2100-sans text-[9px] font-bold uppercase tracking-widest" style={{ color: 'rgba(0,56,160,0.5)' }}>Reward when I do it</p>
            <p className="font-d2100-read italic text-[12.5px] mt-1 leading-snug" style={{ color: NAVY }}>{answers.commit.reward || 'Not chosen yet'}</p>
          </div>
        </div>
      </div>

      <p className="font-d2100-read italic text-[13px] leading-relaxed text-center mt-5" style={{ color: 'rgba(26,26,26,0.4)' }}>
        Every page here is evidence — proof for the next time fear tries to tell you otherwise.
      </p>
    </Screen>
  );
};

export const S31_Export = ({ answers, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'YOUR 2100 BOOK · EXPORT', onBack }} button={<Btn variant="solidRed" onClick={onNext}>Finish</Btn>}>
    <Headline dark={false} size="md">Take the whole thing with you.</Headline>
    <Sub dark={false}>Every answer you gave, in order, saved to your device.</Sub>
    <div className="mt-5"><Card>
      <div className="flex items-center justify-between mb-2.5">
        <p className="font-d2100-read text-[15px] font-semibold" style={{ color: NAVY }}>Workbook preview</p>
      </div>
      {[
        `What I want — ${answers.goal || 'not written yet'}`,
        `Barriers — ${answers.barriers.selected.length} identified`,
        `What I saw — the voice sounded like ${answers.voiceSource || 'someone unnamed'}`,
        `Values & charter — ${answers.valuesChosen.join(', ') || 'not chosen yet'}`,
        `Evidence — ${answers.evidence.length} entries so far`,
      ].map((l) => (
        <p key={l} className="font-d2100-sans text-[12px] mt-1.5" style={{ color: 'rgba(26,26,26,0.62)' }}>{l}</p>
      ))}
    </Card></div>
    <p className="font-d2100-sans text-[11px] mt-4 text-center" style={{ color: 'rgba(0,56,160,0.4)' }}>
      Saved to your device — find it any time from your plan.
    </p>
  </Screen>
);
