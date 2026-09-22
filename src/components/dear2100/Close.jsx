// @ts-check
import React from 'react';
import { Screen, Btn, Wordmark } from './shared';

export const S32_Complete = ({ onNext }) => (
  <Screen dark={true} header={{ left: 'DEAR 2100 · COMPLETE' }} button={<Btn variant="outlineWhite" onClick={onNext}>Back to my plan</Btn>} footNote="YOUR BOOK IS SAVED · COME BACK ANY TIME" compactHeader={false}>
    <div className="flex-1 flex flex-col items-center text-center px-2" style={{ paddingTop: '150px' }}>
      <Wordmark dark />
      <p className="font-d2100-read italic text-[16px] leading-relaxed mt-6" style={{ color: 'rgba(251,247,236,0.65)' }}>
        You're not quite who you were an hour ago. That's the whole thing.
      </p>
    </div>
  </Screen>
);
