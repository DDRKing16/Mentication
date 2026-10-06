import {useEffect, useRef} from 'react';
import SelectedPracticeContext from './SelectedPracticeContext';
import {Button} from '@/components/ui/button';

export default function SessionSaveRecovery({practice, saving, onRetry, onLeave}) {
  const heading=useRef(null);
  useEffect(()=>{heading.current?.focus();},[]);
  return <main className="calmbg min-h-[100dvh] px-5 py-8 safe-top-lg text-primary">
    <div className="mx-auto flex max-w-lg flex-col gap-5">
      <SelectedPracticeContext practice={practice} label="Your practice" showTime={false} />
      <h1 ref={heading} tabIndex={-1} className="font-heading text-3xl leading-tight">Your practice has ended.</h1>
      <p role="alert">We could not confirm that its history record was saved on this device.</p>
      <p className="leading-relaxed text-muted-foreground">Your confirmed check-ins are still here. Retry the save, or return Home without trying again. You do not need to repeat the practice. Any note or card you explicitly saved has its own storage.</p>
      <Button className="min-h-12 h-auto whitespace-normal rounded-full px-5 py-3" disabled={saving} onClick={onRetry}>{saving ? 'Saving history…' : 'Retry saving history'}</Button>
      <Button variant="outline" className="min-h-12 h-auto whitespace-normal rounded-full px-5 py-3" disabled={saving} onClick={onLeave}>Return Home without retrying</Button>
      {saving && <p role="status" className="text-sm">Checking the device-local history save…</p>}
    </div>
  </main>;
}
