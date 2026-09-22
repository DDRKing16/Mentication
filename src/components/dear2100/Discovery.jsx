// @ts-check
import React from 'react';
import { Screen, Btn, Headline, SuggestionField } from './shared';
import { BANK_DISCOVERY } from '@/lib/dear2100Content';

export const S01_Discovery = ({ answers, update, onNext, onBack }) => (
  <Screen dark={false} header={{ left: 'FIRST STEP · DISCOVERY', pct: 10, onBack }} button={<Btn variant="solidRed" onClick={onNext} disabled={!answers.goal.trim()}>Continue</Btn>} footNote="Type freely, or just tap one below.">
    <Headline dark={false}>What have you always wanted to do, but haven't?</Headline>
    <SuggestionField placeholder="I've always wanted to…" dark={false} suggestions={BANK_DISCOVERY} value={answers.goal} onChange={(v) => update({ goal: v })} />
  </Screen>
);

