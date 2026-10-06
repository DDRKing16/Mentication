import { useEffect, useRef, useState } from 'react';
import { careClick, careOutcome, freshCareState, restoreCareState } from '@/lib/carePractices';
import * as store from '@/lib/carePracticeStorage';
const DEFAULT_ADAPTER = { readDraft: store.readCareDraft, writeDraft: store.writeCareDraft, deleteDraft: store.deleteCareDraft, readSaved: store.readCareSaved, writeSaved: store.writeCareSaved, deleteSaved: store.deleteCareSaved };

export default function useCarePractice(id, props) {
  const adapter = useRef(props.persistence || DEFAULT_ADAPTER);
  const [initialDraft] = useState(() => adapter.current.readDraft(id));
  const [state, setState] = useState(() => initialDraft ? restoreCareState(initialDraft) : freshCareState());
  const [returning, setReturning] = useState(!!initialDraft);
  const [saved, setSaved] = useState(() => adapter.current.readSaved(id));
  const [viewingSaved, setViewingSaved] = useState(false);
  const [draftOk, setDraftOk] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const finished = useRef(false);
  const heading = useRef(null);
  const persist = useRef(() => true);
  const patch = values => setState(current => ({ ...current, ...values }));
  const go = (stage, values = {}) => { setError(''); setMessage(''); patch({ ...values, stage }); };
  useEffect(() => {
    persist.current = () => {
      if (returning || viewingSaved || finished.current) return true;
      const result = adapter.current.writeDraft(id, state);
      setDraftOk(result); return result;
    };
    persist.current();
  }, [id, state, returning, viewingSaved]);
  useEffect(() => { const flush = () => persist.current(); window.addEventListener('pagehide', flush); return () => window.removeEventListener('pagehide', flush); }, []);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [state.stage, returning, viewingSaved]);
  const countClick = event => {
    const button = event.target.closest('button');
    if (button && !button.disabled && !button.closest('[data-care-tools]')) setState(current => careClick(current, id));
  };
  const exit = () => { persist.current(); props.onExit?.(); };
  const discard = () => {
    if (!adapter.current.deleteDraft(id)) { setError('The draft could not be deleted. Please try again.'); return; }
    finished.current = true; props.onExit?.();
  };
  const finish = () => {
    if (finished.current) return;
    if (!adapter.current.deleteDraft(id)) { setError('The draft could not be cleared. Try Finish again.'); return; }
    finished.current = true;
    if (viewingSaved) { props.onExit?.(); return; }
    props.onAttemptEvent?.({ interventionId: id, mechanism: props.intervention?.mechanism, action: 'completed', completedPercentage: 1, timestamp: Date.now() });
    props.onComplete?.({ requireGoalReassessment: true, outcome: careOutcome(id, state) });
  };
  const save = () => {
    if (adapter.current.writeSaved(id, state)) { setSaved(state); setError(''); setMessage('Saved on this device. You can find it in Return points.'); }
    else { setMessage(''); setError('Saving did not work. Your card has not been saved. Try again.'); }
  };
  const deleteSaved = () => {
    if (!adapter.current.deleteSaved(id)) { setError('The saved card could not be deleted. Please try again.'); return; }
    setSaved(null); setError(''); setMessage('Saved card deleted from this device.');
    if (viewingSaved) { setViewingSaved(false); setState(freshCareState()); }
  };
  const restart = () => { finished.current = false; setReturning(false); setViewingSaved(false); setState(freshCareState()); setError(''); setMessage(''); };
  const openSaved = () => { setViewingSaved(true); setState({ ...restoreCareState(saved), stage: 'complete' }); setError(''); setMessage(''); };
  const stages = ['arrival', 'baseline', 'notice', 'perspective', 'practice', 'action', 'rerate', 'complete'];
  const back = () => {
    if (returning || viewingSaved || state.stage === 'arrival') return exit();
    go(state.stage === 'orient' ? 'action' : stages[Math.max(0, stages.indexOf(state.stage) - 1)]);
  };
  return { id, s: state, patch, go, returning, resume: () => setReturning(false), saved, viewingSaved, draftOk, error, message, heading, countClick, exit, discard, finish, save, deleteSaved, restart, openSaved, back };
}
