// @ts-check
import React from 'react';
import { Screen, Btn, WelcomeWordmark } from './shared';

export const S00_Welcome = ({ onNext }) => (
  <Screen dark={false} header={{ left: 'REGULATION PLAN' }} button={<Btn variant="outlineRed" onClick={onNext}>Begin</Btn>} footNote="15 MINUTES · ONE QUESTION AT A TIME" compactHeader={false}>
    <div className="flex-1 flex flex-col items-center text-center px-2" style={{ paddingTop: '50px' }}>
      <WelcomeWordmark />
      <p className="font-d2100-read italic text-[16px] leading-relaxed mt-7" style={{ color: 'rgba(26,26,26,0.6)' }}>
        You've already lived this life. So — now that it's behind you, what actually mattered?
      </p>
    </div>
  </Screen>
);
