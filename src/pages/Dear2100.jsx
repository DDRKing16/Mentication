// @ts-check
// Dear 2100 — a 15-minute reflective flow that walks someone from an
// avoided goal through to a real, committed smallest step. Ported from the
// locked design in Dear_2100_V2_Copilot_Handoff.zip: screen order, copy,
// spacing and interaction patterns are kept verbatim (see
// INTEGRATION_GUIDE.md §5 golden rules); this page adds real navigation,
// controlled answer state and device-local persistence in place of the
// original's throwaway ?step=N dev harness.
import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FLOW_DATA } from '@/lib/dear2100Flow';
import { createInitialDear2100Answers, pushEvidence } from '@/lib/dear2100Answers';
import { sessionStore } from '@/lib/localData';
import '@/styles/dear2100.css';

export default function Dear2100() {
  const navigate = useNavigate();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState(createInitialDear2100Answers);
  const flowStack = useRef([0]);
  const stepParam = useMemo(() => parseInt(new URLSearchParams(location.search).get('step') || '0', 10) || 0, [location.search]);
  const startTimeRef = useRef(Date.now());

  React.useEffect(() => {
    if (stepParam < flowStack.current.length - 1) {
      flowStack.current = flowStack.current.slice(0, stepParam + 1);
      setStepIndex(flowStack.current[flowStack.current.length - 1]);
    }
  }, [stepParam]);

  const update = (patch) => setAnswers((prev) => ({ ...prev, ...patch }));

  const advanceTo = (nextIndex) => {
    flowStack.current.push(nextIndex);
    setStepIndex(nextIndex);
    navigate(`/dear-2100?step=${flowStack.current.length - 1}`, { replace: false });
  };

  const goBack = () => {
    if (flowStack.current.length > 1) navigate(-1);
    else navigate('/');
  };

  const completeSession = () => {
    sessionStore.create({
      type: 'dear2100',
      state: 'reflect',
      state_label: 'Dear 2100',
      goal: answers.goal,
      values: answers.valuesChosen,
      action_plan: answers.actionPlan,
      commit: answers.commit,
      evidence_count: answers.evidence.length,
      answers,
      duration_sec: Math.round((Date.now() - startTimeRef.current) / 1000),
    }).catch(() => {
      // non-blocking — the flow continues regardless
    });
  };

  const currentItem = FLOW_DATA[stepIndex] || FLOW_DATA[0];
  const id = currentItem.id;

  const goNext = () => {
    // Side effects tied to specific screens, kept out of the ported screen
    // components themselves (mirrors ResetFlow's centralised phase logic).
    if (id === '27') update({ evidence: pushEvidence(answers, `Did it: ${answers.actionPlan || 'my smallest step'}.${answers.actionDoneFeeling ? ` Felt ${answers.actionDoneFeeling.toLowerCase()}.` : ''}`) });
    if (id === '31') { completeSession(); advanceTo(stepIndex + 1); return; }
    if (id === '32') { navigate('/plan', { replace: true }); return; }
    const nextIndex = Math.min(stepIndex + 1, FLOW_DATA.length - 1);
    advanceTo(nextIndex);
  };

  const Cmp = currentItem.C;

  return <Cmp answers={answers} update={update} onNext={goNext} onBack={goBack} />;
}
