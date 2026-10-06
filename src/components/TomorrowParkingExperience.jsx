import JourneyOptions from '@/components/journey/JourneyOptions';
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import ThoughtLines from "@/components/tomorrow-parking/ThoughtLines";
import Shutter from "@/components/tomorrow-parking/Shutter";
import ParkedObject from "@/components/tomorrow-parking/ParkedObject";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { clearActiveFlagship, rememberFlagshipEvent } from "@/lib/flagshipMemory";
import { GOAL_ASSESSMENTS, captureGoalBaseline, hasGoalBaseline } from "@/lib/goalAssessment";
import { formatDate } from "@/lib/tomorrowParking/dates";
import { RETENTION_DAYS, RECORDS_KEY, clearDraft, newId, parkNote, readDraft, writeDraft, readParkingReturn, writeParkingReturn, getRecord } from "@/lib/tomorrowParking/storage";
import "@/styles/tomorrow-parking.css";

const ID = "tomorrowParking";

export default function TomorrowParkingExperience({ intervention, answers, onGoalBaseline, onAttemptEvent, onComplete, onExit }) {
  const navigate = useNavigate();
  const { prefs } = useAccessibilityPrefs();
  const [restored] = useState(()=>{try{return {draft:readDraft(),parked:readParkingReturn(),error:false};}catch{return {draft:readDraft(),parked:null,error:true};}});
  const [step, setStep] = useState(restored.parked?.step || restored.draft?.step || "capture");
  const [draft] = useState(restored.draft);
  const [text, setText] = useState(restored.parked?.record.text || draft?.text || "");
  const [suitability, setSuitability] = useState(restored.parked || draft?.canWait ? 'wait' : null);
  const [saved, setSaved] = useState(restored.parked?.record || null);
  const [returnOk,setReturnOk] = useState(true);
  const [readNotice,setReadNotice] = useState('');
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [helpfulness, setHelpfulness] = useState(null);
  const [checkIn, setCheckIn] = useState(false);
  const [baseline, setBaseline] = useState(() => hasGoalBaseline(answers) ? answers.goal_baseline : null);
  const [rating, setRating] = useState(5);
  const identity = useRef(restored.parked?.record.id || draft?.recordId || newId());
  const inFlight = useRef(false);
  const completionReported = useRef(!!restored.parked);
  const startedAt = useRef(Date.now());
  const title = useRef(null);
  const assessment = GOAL_ASSESSMENTS[answers?.direction || "sleep"];
  const reducedMotion = !!prefs.reducedMotion;

  useEffect(() => {
    if(step==='seal' && saved?.text===text.trimEnd()) setReturnOk(writeParkingReturn(saved.id,'parked'));
    else if (step === "capture" || step === "seal") setDraftAvailable(writeDraft(text, identity.current,undefined,{step,canWait:suitability==='wait'}));
    else if(saved) setReturnOk(writeParkingReturn(saved.id,step));
  }, [text, step, suitability, saved]);
  useEffect(() => { title.current?.focus({ preventScroll: true }); window.scrollTo(0, 0); }, [step]);
  useEffect(()=>{
    if(!saved)return;
    const check=event=>{
      if(event.type==='storage' && event.key!==null && event.key!==RECORDS_KEY)return;
      try {
        const latest=getRecord(saved.id);
        if(!latest) {
          const dirty=['capture','seal'].includes(step) && text.trimEnd()!==saved.text;
          const allRemoved=event.type==='storage' && event.newValue===null;
          setSaved(null);
          if(!dirty || allRemoved){setText('');clearDraft();setStep('capture');setSuitability(null);}
          setReadNotice(dirty && !allRemoved?'The saved version was removed elsewhere. Your current edits are still an unsaved draft.':'This saved note was removed elsewhere. Nothing has been saved again.');
        } else if(JSON.stringify(latest)!==JSON.stringify(saved)) {
          setSaved(latest);if(['parked','quiet'].includes(step))setText(latest.text);setReadNotice('');
        }
      } catch {setReadNotice('Your saved note could not be read. Nothing has been replaced. Review Your parking lot before leaving.');}
    };
    window.addEventListener('storage',check);window.addEventListener('focus',check);
    return ()=>{window.removeEventListener('storage',check);window.removeEventListener('focus',check);};
  },[saved,step,text]);

  const attemptSave = useCallback(() => {
    if (inFlight.current) return false;
    inFlight.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      const record = parkNote({ id: identity.current, text });
      setSaved(record);
      clearDraft();
      setReturnOk(writeParkingReturn(record.id,'parked'));
      rememberFlagshipEvent({ interventionId: ID, completed: true, options: { parkingItem: "captured" } });
      clearActiveFlagship(ID);
      if (!completionReported.current) onAttemptEvent?.({ interventionId: ID, mechanism: intervention?.mechanism, action: "completed", completedPercentage: 1, timestamp: Date.now() });
      completionReported.current = true;
      return true;
    } catch {
      setSaveError("We couldn’t confirm this save. Your words are still here. Try again or return to editing; a retry won’t create another note.");
      setSaving(false);
      inFlight.current = false;
      return false;
    }
  }, [text, intervention?.mechanism, onAttemptEvent]);

  const finish = (navigateTo, reassess = false) => {
    if (saved) onComplete?.({ interventionId: ID, skipReflection: true, requireGoalReassessment: reassess && !!baseline, helpfulness, outcome: { parked: true, durationSec: Math.round((Date.now() - startedAt.current) / 1000) }, navigateTo });
    else onExit?.();
  };
  const reopen = () => {
    inFlight.current = false;
    setSaving(false);
    setSaveError(null);
    setSuitability("wait");
    setStep("capture");
  };
  const leave = () => {
    if (text.trim() && saved?.text !== text.trimEnd() && (step === "capture" || step === "seal")) setLeaving(true);
    else finish();
  };
  const heading = (content) => <h1 ref={title} tabIndex={-1} className="tpl-display tpl-h1">{content}</h1>;

  return <main className="tpl tpl--bedside" data-intervention={ID} data-reduced-motion={reducedMotion}>
    {step !== "quiet" && <ThoughtLines still={reducedMotion} intensity={0.25} />}
    <div className="tpl-frame">
      <header className="tpl-topbar tpl-night-header">
        <button type="button" className="tpl-icon-btn" aria-label={step === "seal" ? "Back to edit the note" : "Leave Tomorrow Parking Lot"} disabled={saving} onClick={step === "seal" ? reopen : leave}><ArrowLeft size={20} aria-hidden="true" /></button>
        <p className="tpl-eyebrow">Tomorrow Parking Lot</p>
        <button type="button" className="tpl-icon-btn" aria-label="Exit" disabled={saving} onClick={leave}><X size={18} aria-hidden="true" /></button>
      </header>

      {readNotice && <p role="status" className="tpl-xs tpl-muted">{readNotice}</p>}
      {restored.error && <p role="alert" className="tpl-alert">Your saved return could not be read. Existing notes have not been replaced. You can review them in Your parking lot.</p>}
      {step === "capture" && <div className="tpl-rise tpl-capture">
        <p className="tpl-kicker">A little less to carry tonight</p>
        {heading("Leave tomorrow here.")}
        <p className="tpl-lede">One unfinished thought. One place to put it.</p>
        <fieldset className="tpl-urgency">
          <legend>Can this wait until tomorrow?</legend>
          <div className="tpl-row">
            <button className={`tpl-btn tpl-btn--secondary${suitability === "wait" ? " tpl-selected" : ""}`} aria-pressed={suitability === "wait"} onClick={() => setSuitability("wait")}>It can wait</button>
            <button className="tpl-btn tpl-btn--outline" aria-expanded={suitability === "help"} onClick={() => setSuitability(suitability === "help" ? null : "help")}>Not sure / urgent</button>
          </div>
        </fieldset>
        {suitability === "help" && <section className="tpl-panel" aria-label="Needs attention tonight">
          <p>If something needs action tonight, deal with it directly. If you or someone else isn’t safe, support comes first.</p>
          <div className="tpl-stack"><button className="tpl-btn tpl-btn--primary tpl-btn--block" onClick={() => navigate("/support")}>Support options</button><button className="tpl-link" onClick={leave}>Leave for now</button></div>
        </section>}
        {suitability !== "help" && <>
          <section className="tpl-writing" aria-label="Your note">
            <label htmlFor="tpl-note" className="tpl-writing__label">What can wait?</label>
            <textarea id="tpl-note" className="tpl-writing__input" value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="A task, a worry, something to remember…" spellCheck autoComplete="off" aria-describedby="tpl-draft-status" />
          </section>
          <p id="tpl-draft-status" className="tpl-xs tpl-muted">{saved ? "Editing your parked note. The saved version stays until you save again." : draft?.text ? "Recovered an unfinished draft. It is not parked yet." : "Not saved yet."} {draftAvailable ? "Draft recovery is limited to this tab, for up to 24 hours." : "Draft recovery is unavailable. Keep this tab open until you save."}</p>
          <button className="tpl-btn tpl-btn--primary tpl-btn--block tpl-btn--lg" disabled={!text.trim() || suitability !== "wait"} onClick={() => setStep("seal")}>Ready to put it away</button>
          {suitability !== "wait" && <p className="tpl-xs tpl-muted">Choose “It can wait” before parking. A blank note cannot be saved.</p>}
          {!baseline && !saved && assessment && <details className="tpl-details"><summary>Optional starting check-in</summary><p className="tpl-small">{assessment.question}</p><input aria-label={assessment.question} type="range" min="0" max="10" value={rating} onChange={(e) => setRating(Number(e.target.value))} /><div className="tpl-scale"><span>0 · {assessment.left}</span><span>10 · {assessment.right}</span></div><button className="tpl-link" onClick={() => { const next = captureGoalBaseline(answers?.direction || "sleep", rating); setBaseline(next); onGoalBaseline?.(next); }}>Confirm starting rating: {rating}</button><p className="tpl-xs tpl-muted">Unanswered until confirmed. You can skip this.</p></details>}
          {baseline && <p className="tpl-xs tpl-muted">Starting {baseline.scale}: {baseline.value}/10. An optional matching check-in is available after saving.</p>}
        </>}
      </div>}

      {step === "seal" && <div className="tpl-rise tpl-seal">
        <p className="tpl-kicker">Keep the note. Set down the thought.</p>
        {heading("Close it for tonight.")}
        <p className="tpl-lede">Pull the shutter to save, or use the button.</p>
        <StorageDetail />
        <Shutter noteText={text} reducedMotion={reducedMotion} onClosed={attemptSave} onSettled={() => { setSaving(false); setStep("parked"); }} disabled={saving} retry={!!saveError} />
        {saveError && <div className="tpl-alert" role="alert"><p>{saveError}</p><button className="tpl-link" onClick={reopen}>Edit the note</button></div>}
        <button className="tpl-link" disabled={saving} onClick={reopen}>Keep writing</button>
      </div>}

      {step === "parked" && <div className="tpl-rise tpl-parked">
        <p className="tpl-kicker">Saved on this device</p>
        {heading("It’s parked.")}
        <p className="tpl-lede" role="status">Your words are here. You can stop holding them.</p>
        <ParkedObject />
        <details className="tpl-details tpl-parked-preview"><summary>My parked note</summary><p>{saved.text}</p></details>
        <details className="tpl-details tpl-practice-guide"><summary>If the thought returns tonight</summary><p>You have put these words somewhere you can find them. You do not need to solve them again here. Notice one ordinary detail in the room, or let the app go quiet and rest.</p><p>When you want to deal with it, reopen your own note or review it in daylight. Parking it does not create a reminder or say how you will sleep.</p></details>
        {!returnOk && <p role="status" className="tpl-xs tpl-muted">Your note is saved, but this tab could not remember this screen. Find the note in Your parking lot if you leave.</p>}
        <button className="tpl-btn tpl-btn--primary tpl-btn--block tpl-btn--lg" onClick={() => setStep("quiet")}>Let the app go quiet</button>
        <p className="tpl-xs tpl-muted tpl-center">Find it in “Your parking lot” on Home or in Library.</p>
        <div className="tpl-row"><button className="tpl-link" onClick={reopen}>Reopen note</button><button className="tpl-link" onClick={() => finish("/parking-lot")}>Review in daylight</button></div>
        <button className="tpl-link" aria-expanded={checkIn} onClick={() => setCheckIn(!checkIn)}>Optional check-in</button>
        {checkIn && <section className="tpl-panel" aria-label="Optional feedback">
          <p className="tpl-small">Was parking this helpful?</p><div className="tpl-wrap">{[["helpful", "Helpful"], ["same", "Same"], ["worse", "Worse"], ["unsure", "Unsure"]].map(([value, label]) => <button key={value} className="tpl-chip" aria-pressed={helpfulness === value} onClick={() => setHelpfulness(value)}>{label}</button>)}</div>
          {baseline ? <button className="tpl-link" onClick={() => finish(undefined, true)}>Repeat the starting check-in</button> : <p className="tpl-xs tpl-muted">No starting rating was answered, so there is no before-and-after comparison.</p>}
        </section>}
      </div>}

      {step === "quiet" && <div className="tpl-darkness">
        {heading("Leave it here for now.")}
        <span aria-hidden="true" className="tpl-darkness__dot" />
        <div className="tpl-stack"><button className="tpl-btn tpl-btn--outline" onClick={() => finish()}>Exit to Home</button><details className="tpl-details"><summary>More options</summary><div className="tpl-stack"><button className="tpl-link" onClick={reopen}>Reopen note</button><button className="tpl-link" onClick={() => finish("/parking-lot")}>Review in daylight</button><button className="tpl-link" onClick={() => finish("/night-channel")}>Open Night Channel</button></div></details></div>
        <p className="tpl-xs tpl-muted">Your screen may lock as usual. No audio is playing.<br />Kept until {saved ? formatDate(saved.expiresAt) : "you return"}. No reminder was created.</p>
      </div>}

      <JourneyOptions id={ID} />
      {leaving && <LeaveDraftDialog draftAvailable={draftAvailable} onCancel={() => setLeaving(false)} onLeave={() => finish()} onDiscard={() => { clearDraft(); finish(); }} />}

    </div>
  </main>;
}

function StorageDetail() {
  return <div className="tpl-storage" id="tpl-storage-summary"><p>Saved only on this device for {RETENTION_DAYS} days. No reminder.</p><details className="tpl-details"><summary>Storage & privacy</summary><p>Your words and save times stay in local browser storage. No account, server or AI service receives them. This is not encryption or backup. Clearing app/browser data removes them. Editing restarts the 30 days; reading does not. Reopen, edit or delete in Your parking lot on Home or in Library.</p></details></div>;
}

function LeaveDraftDialog({ draftAvailable, onCancel, onLeave, onDiscard }) {
  const dialog = useRef(null);
  useEffect(() => { const el = dialog.current; el.showModal(); return () => el.close(); }, []);
  return <dialog ref={dialog} onCancel={(event) => { event.preventDefault(); onCancel(); }} aria-labelledby="tpl-leave-title" className="tpl-leave tpl-card"><h2 id="tpl-leave-title" className="tpl-display">Leave this draft?</h2><p>Your latest words have not been saved. {draftAvailable ? "They can be recovered in this tab for up to 24 hours." : "They may be lost if you leave."}</p><div className="tpl-stack"><button autoFocus className="tpl-btn tpl-btn--primary tpl-btn--block" onClick={onCancel}>Keep writing</button><button className="tpl-link" onClick={onLeave}>Leave without saving changes</button><button className="tpl-link" onClick={onDiscard}>Discard draft and leave</button></div></dialog>;
}
