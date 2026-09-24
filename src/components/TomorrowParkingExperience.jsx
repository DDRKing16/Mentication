import { useFlowNav } from "@/components/brand/InterventionNav";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import ThoughtLines from "@/components/tomorrow-parking/ThoughtLines";
import Shutter from "@/components/tomorrow-parking/Shutter";
import ParkedObject from "@/components/tomorrow-parking/ParkedObject";
import { useAccessibilityPrefs } from "@/hooks/useAccessibilityPrefs";
import { hapticPattern } from "@/lib/feedback";
import BrandThreadProgress from "@/components/brand/BrandThreadProgress";
import { clearActiveFlagship, recordHandoffDecision, rememberFlagshipEvent } from "@/lib/flagshipMemory";
import { getBrandCoral } from "@/lib/interventionBrand";
import { SUGGESTION_GROUPS } from "@/lib/tomorrowParking/suggestions";
import { formatDate, timeZoneLabel } from "@/lib/tomorrowParking/dates";
import {
  RETENTION_DAYS, clearDraft, newId, parkNote, readConsents, readDraft, writeConsents, writeDraft,
} from "@/lib/tomorrowParking/storage";
import "@/styles/tomorrow-parking.css";

const ID = "tomorrowParking";
const DARKNESS_DELAY_MS = 9000;
// Darkness is a passive, wound-down screen with no chrome at all, so it has no stage.
const STAGE_FOR_STEP = { capture: 1, seal: 2, parked: 3 };

// Night flow: capture → seal → parked (passive) → darkness (passive).
// State stays tied to confirmed persistence: "parked" is only reached after a
// verified write. Draft text lives in this session only and is never claimed
// as saved.
export default function TomorrowParkingExperience({ intervention, onAttemptEvent, onComplete, onExit }) {
  const navigate = useNavigate();
  const { prefs } = useAccessibilityPrefs();
  const reducedMotion = !!prefs.reducedMotion;

  const [ready, setReady] = useState(false);
  const [step, setStep] = useState("capture");
  const [text, setText] = useState("");
  const [recordId, setRecordId] = useState(undefined);
  const [saved, setSaved] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [consents, setConsents] = useState({ nightChannelHandoff: false, soundAndHaptics: false });
  const [backgrounded, setBackgrounded] = useState(false);
  const darknessTimer = useRef(null);
  const inFlight = useRef(false);
  const sessionIdRef = useRef(undefined);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const draft = readDraft();
    if (draft) {
      setText(draft.text);
      if (draft.recordId) setRecordId(draft.recordId);
    }
    setConsents(readConsents());
    setReady(true);
    onAttemptEvent?.({ interventionId: ID, mechanism: intervention?.mechanism, action: "started", completedPercentage: 0, timestamp: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    // Once parked the draft is gone: nothing may re-create it, or a later note
    // would silently overwrite the saved record.
    if (step === "parked" || step === "darkness") return;
    writeDraft(text, recordId);
  }, [text, recordId, ready, step]);

  // Decorative movement stops when the app is hidden and is not replayed.
  useEffect(() => {
    const onVisibility = () => setBackgrounded(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // A confirmed save leads to darkness on its own — no further required action.
  useEffect(() => {
    if (step !== "parked") return undefined;
    darknessTimer.current = window.setTimeout(() => setStep("darkness"), DARKNESS_DELAY_MS);
    return () => { if (darknessTimer.current) window.clearTimeout(darknessTimer.current); };
  }, [step]);

  const stay = () => { if (darknessTimer.current) window.clearTimeout(darknessTimer.current); };

  const attemptSave = useCallback(() => {
    // One session submission maps to one saved-record identity: repeated taps
    // while a write is pending cannot create a second record.
    if (inFlight.current) return;
    inFlight.current = true;
    const id = recordId ?? sessionIdRef.current ?? (sessionIdRef.current = newId());
    setSaving(true);
    setSaveError(null);
    try {
      const record = parkNote({ id, text });
      setRecordId(record.id);
      sessionIdRef.current = record.id;
      setSaved(record);
      clearDraft();
      setStep("parked");
      if (consents.soundAndHaptics) hapticPattern([18]);
      // No note content leaves this component: memory records only that a note was parked.
      rememberFlagshipEvent({ interventionId: ID, completed: true, options: { parkingItem: "captured" } });
      clearActiveFlagship(ID);
      onAttemptEvent?.({ interventionId: ID, mechanism: intervention?.mechanism, action: "completed", completedPercentage: 1, timestamp: Date.now() });
    } catch {
      setSaveError("The note could not be stored on this device. Nothing was saved, and your words are still here.");
    } finally {
      setSaving(false);
      inFlight.current = false;
    }
  }, [recordId, text, consents.soundAndHaptics, intervention?.mechanism, onAttemptEvent]);

  const finish = (navigateTo) => {
    if (saved) {
      onComplete?.({ interventionId: ID, skipReflection: true, outcome: { parked: true, durationSec: Math.round((Date.now() - startedAt.current) / 1000) }, navigateTo });
    } else if (navigateTo) {
      navigate(navigateTo, { replace: true });
    } else {
      onExit?.();
    }
  };

  const leaveWithoutSaving = () => {
    clearDraft();
    onAttemptEvent?.({ interventionId: ID, mechanism: intervention?.mechanism, action: "exited", completedPercentage: step === "seal" ? 0.5 : 0.1, timestamp: Date.now() });
    onExit?.();
  };

  const acceptNightChannel = () => {
    recordHandoffDecision(ID, "nightChannel", "accepted");
    finish("/night-channel");
  };

  if (!ready) {
    return <main className="tpl" aria-busy="true"><span className="tpl-sr-only">Preparing the night space.</span></main>;
  }

  return (
    <main className="tpl" style={{ position: "relative", overflow: "hidden" }} data-intervention={ID}>
      {step !== "darkness" && <ThoughtLines still={backgrounded} intensity={0.5} style={{ opacity: 0.7 }} />}

      <div className="tpl-frame">
        {step !== "darkness" && (
          <>
            <p className="tpl-eyebrow">
              Mentication <span aria-hidden="true" style={{ color: getBrandCoral(ID) }}>·</span> sleep
            </p>
            <BrandThreadProgress id={ID} stage={STAGE_FOR_STEP[step] || 1} stages={3} className="mt-3" />
          </>
        )}

        {step === "capture" && (
          <CaptureScreen
            text={text}
            setText={setText}
            onContinue={() => setStep("seal")}
            onLeave={leaveWithoutSaving}
            onSupport={() => navigate("/support")}
            hasSavedRecord={Boolean(saved)}
          />
        )}

        {step === "seal" && (
          <SealScreen
            text={text}
            saving={saving}
            saveError={saveError}
            reducedMotion={reducedMotion}
            onPark={attemptSave}
            onEdit={() => { setSaveError(null); setStep("capture"); }}
            onLeave={leaveWithoutSaving}
            onSupport={() => navigate("/support")}
          />
        )}

        {step === "parked" && saved && (
          <ParkedScreen
            onReopen={() => { stay(); setRecordId(saved.id); setText(saved.text); setStep("capture"); }}
            onQuiet={() => { stay(); setStep("darkness"); }}
            onInteract={stay}
            onNightChannel={acceptNightChannel}
            consents={consents}
            setConsents={(next) => { setConsents(next); writeConsents(next); }}
          />
        )}

        {step === "darkness" && (
          <DarknessScreen
            savedExpiry={saved?.expiresAt}
            onReopen={() => { if (saved) { setRecordId(saved.id); setText(saved.text); } setStep("capture"); }}
            onReview={() => finish("/parking-lot")}
            onExit={() => finish()}
          />
        )}
      </div>
    </main>
  );
}

/* ------------------------------ screen one -------------------------------- */

function CaptureScreen({ text, setText, onContinue, onLeave, onSupport, hasSavedRecord }) {
  const { goBack } = useFlowNav();
  const [suitability, setSuitability] = useState(text.trim() ? "wait" : null);
  const [group, setGroup] = useState(null);
  const canContinue = text.trim().length > 0;
  const groups = Object.keys(SUGGESTION_GROUPS);

  const chooseSuggestion = (suggestion) => setText(text.trim() ? `${text.trimEnd()}\n${suggestion}` : suggestion);

  return (
    <div className="tpl-rise" style={{ paddingTop: "1.25rem" }}>
      <div className="tpl-topbar" style={{ alignItems: "flex-start" }}>
        <button type="button" className="tpl-icon-btn" aria-label="Back" onClick={goBack} style={{ marginTop: 4, marginRight: 8 }}>
          <ArrowLeft aria-hidden="true" size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="tpl-display tpl-h1">What are you holding onto?</h1>
          <p className="tpl-lede">One short note is enough. No need to organise it.</p>
        </div>
        <button type="button" className="tpl-icon-btn" aria-label="Leave Tomorrow Parking Lot" onClick={onLeave} style={{ marginTop: 4 }}>
          <X aria-hidden="true" size={20} />
        </button>
      </div>

      {/* Suitability check lives on the same screen; nothing is diagnosed from the text. */}
      <fieldset style={{ border: 0, padding: 0, margin: "1.25rem 0 0" }}>
        <legend className="tpl-small tpl-muted" style={{ marginBottom: "0.5rem" }}>Does this need action tonight?</legend>
        <div className="tpl-wrap" role="radiogroup">
          {[["wait", "It can wait"], ["now", "It needs attention now"], ["unsure", "I’m not sure"]].map(([value, label]) => (
            <button key={value} type="button" role="radio" aria-checked={suitability === value} className={`tpl-chip${suitability === value ? " tpl-chip--selected" : ""}`} onClick={() => setSuitability(value)}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {suitability === "now" && (
        <div className="tpl-card" style={{ marginTop: "1.25rem" }} role="status">
          <p style={{ margin: 0, lineHeight: 1.6 }}>If something needs attention tonight, deal with it directly rather than parking it. Parking is for things that can genuinely wait.</p>
          <div className="tpl-stack" style={{ marginTop: "1rem" }}>
            <button type="button" className="tpl-btn tpl-btn--secondary tpl-btn--block" onClick={onSupport}>Support options</button>
            <button type="button" className="tpl-btn tpl-btn--ghost tpl-btn--block" onClick={onLeave}>Leave for now</button>
            <button type="button" className="tpl-link" style={{ width: "100%" }} onClick={() => setSuitability("wait")}>Actually, it can wait</button>
          </div>
        </div>
      )}

      {suitability === "unsure" && (
        <div className="tpl-card" style={{ marginTop: "1.25rem" }} role="status">
          <p style={{ margin: 0, lineHeight: 1.6 }}>That’s fine. If nothing would change by handling it now, it can probably wait. If you’re not safe or someone else isn’t, support comes first.</p>
          <div className="tpl-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="tpl-btn tpl-btn--secondary" onClick={() => setSuitability("wait")}>It can wait</button>
            <button type="button" className="tpl-btn tpl-btn--outline" onClick={onSupport}>Support</button>
          </div>
        </div>
      )}

      {suitability === "wait" && (
        <>
          <section className="tpl-writing" aria-label="Your note">
            <ThoughtLines intensity={0.55} />
            <div aria-hidden="true" className="tpl-writing__hairline" />
            <label htmlFor="tpl-note" className="tpl-writing__label">What can wait until tomorrow?</label>
            <textarea
              id="tpl-note"
              className="tpl-writing__input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              spellCheck
              autoComplete="off"
              placeholder="Write in your own words…"
            />
            {text && <button type="button" className="tpl-writing__clear" onClick={() => setText("")}>Clear</button>}

            <div className="tpl-suggest">
              {group ? (
                <div>
                  <div className="tpl-suggest__head">
                    <button type="button" className="tpl-icon-btn" style={{ width: 36, height: 36 }} aria-label="Back to suggestion categories" onClick={() => setGroup(null)}>
                      <ArrowLeft aria-hidden="true" size={18} />
                    </button>
                    <p className="tpl-small tpl-muted" style={{ margin: 0 }}>{group}</p>
                  </div>
                  <div className="tpl-suggest__wrap">
                    {SUGGESTION_GROUPS[group].map((s) => (
                      <button key={s} type="button" className="tpl-chip" onClick={() => chooseSuggestion(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="tpl-small tpl-muted" style={{ margin: "0 0 0.75rem" }}>Or tap what feels closest</p>
                  <div className="tpl-suggest__row">
                    {groups.map((g) => (
                      <button key={g} type="button" className="tpl-chip tpl-chip--nowrap" onClick={() => setGroup(g)}>{g}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {hasSavedRecord && <p className="tpl-small tpl-muted tpl-center" style={{ marginTop: "0.5rem" }}>You’re editing the same parked note.</p>}

          <div style={{ marginTop: "1rem" }}>
            <button type="button" className="tpl-btn tpl-btn--primary tpl-btn--block tpl-btn--lg" disabled={!canContinue} onClick={onContinue}>
              That’s enough for now
              <ArrowRight aria-hidden="true" size={18} />
            </button>
            {!canContinue && (
              <p className="tpl-small tpl-muted tpl-center" style={{ margin: "0.75rem 0 0" }}>
                A blank note can’t be parked. Write one line, or <button type="button" className="tpl-link" style={{ padding: 0, minHeight: 0 }} onClick={onLeave}>leave without writing</button>.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------ screen two -------------------------------- */

function SealScreen({ text, saving, saveError, reducedMotion, onPark, onEdit, onLeave, onSupport }) {
  const [doorClosed, setDoorClosed] = useState(false);
  const [shutterKey, setShutterKey] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!saveError) return;
    // Restore the unsealed visual so the user can retry, edit or leave.
    setDoorClosed(false);
    setShutterKey((v) => v + 1);
  }, [saveError]);

  return (
    <div className="tpl-rise">
      <div className="tpl-topbar" style={{ marginTop: "0.5rem" }}>
        <button type="button" className="tpl-icon-btn" aria-label="Back to edit the note" onClick={onEdit}><ArrowLeft aria-hidden="true" size={20} /></button>
        <button type="button" className="tpl-icon-btn" aria-label="Leave without saving" onClick={onLeave}><X aria-hidden="true" size={20} /></button>
      </div>

      <h1 className="tpl-display tpl-h1 tpl-h1--center" style={{ marginTop: "1.25rem" }}>Park it for later.</h1>
      <p className="tpl-lede tpl-lede--center" style={{ marginTop: "0.75rem" }}>You can return when you’re ready.</p>

      <div style={{ marginTop: "1.75rem" }}>
        <Shutter key={shutterKey} noteText={text} reducedMotion={reducedMotion} onClosed={() => setDoorClosed(true)} disabled={saving || doorClosed} />
      </div>

      <button type="button" className="tpl-btn tpl-btn--primary tpl-btn--block tpl-btn--lg" style={{ marginTop: "1rem" }} onClick={onPark} disabled={saving || !doorClosed} aria-describedby="tpl-storage-summary">
        {saving ? "Parking…" : "Save and park"}
      </button>
      <p className="tpl-xs tpl-muted tpl-center" style={{ margin: "0.5rem 0 0" }}>
        {doorClosed ? "Tap to save and park. Nothing is saved until you do." : "Slide the shutter down first, or use the button once it’s closed."}
      </p>

      {saveError && (
        <div role="alert" className="tpl-alert">
          <p style={{ margin: 0 }}>{saveError}</p>
          <div className="tpl-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="tpl-btn tpl-btn--primary" onClick={onPark}>Try again</button>
            <button type="button" className="tpl-btn tpl-btn--secondary" onClick={onEdit}>Edit the note</button>
          </div>
          <button type="button" className="tpl-link" style={{ width: "100%", marginTop: "0.5rem" }} onClick={onLeave}>Leave without saving</button>
        </div>
      )}

      <div id="tpl-storage-summary" className="tpl-note-card" style={{ marginTop: "1.5rem" }}>
        <p style={{ margin: 0, fontSize: "1.05rem", lineHeight: 1.7 }}>
          Parking saves your words on this device only, for {RETENTION_DAYS} days, so you can read, edit or delete them in daylight. No reminder is created.
        </p>
        <button type="button" className="tpl-link" style={{ marginTop: "0.25rem" }} aria-expanded={showDetail} onClick={() => setShowDetail((v) => !v)}>
          {showDetail ? "Hide the details" : "What exactly is stored"}
        </button>
        {showDetail && (
          <ul>
            <li>Stored: your text exactly as written, plus save and update times.</li>
            <li>Not stored: any category, priority, urgency, mood or sleep result. Nothing is analysed.</li>
            <li>Destination: this device’s local app storage. No account, no server, no AI service.</li>
            <li>Retention: {RETENTION_DAYS} days from saving or your last edit, unless you delete it sooner.</li>
            <li>Reopen, edit or delete it any time from “Your parking lot” on the home screen.</li>
            <li>Honest limit: local storage is not encryption, authentication or backup.</li>
          </ul>
        )}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "2rem", textAlign: "center" }}>
        <button type="button" className="tpl-link" onClick={onEdit}>Add more first — nothing is saved yet</button>
        <span className="tpl-muted" style={{ padding: "0 0.5rem", opacity: 0.5 }}>·</span>
        <button type="button" className="tpl-link" onClick={onSupport}>Needs attention now</button>
      </div>
    </div>
  );
}

/* ------------------------------- parked ----------------------------------- */

function ParkedScreen({ onReopen, onQuiet, onInteract, onNightChannel, consents, setConsents }) {
  const [showNightChannel, setShowNightChannel] = useState(false);

  return (
    <div className="tpl-rise" onPointerDown={onInteract} onFocus={onInteract}>
      <h1 className="tpl-display tpl-h1 tpl-h1--center" style={{ marginTop: "1.75rem" }}>It’s parked.</h1>
      <p className="tpl-lede tpl-lede--center" style={{ marginTop: "0.75rem" }} role="status">Saved here for when you’re ready.</p>

      <ParkedObject />

      <div className="tpl-stack" style={{ marginTop: "1.5rem" }}>
        <button type="button" className="tpl-btn tpl-btn--secondary tpl-btn--block" onClick={onReopen}>Reopen note</button>
        <button type="button" className="tpl-btn tpl-btn--outline tpl-btn--block" onClick={() => setShowNightChannel(true)}>Something to listen to</button>
        <button type="button" className="tpl-link" style={{ width: "100%" }} onClick={onQuiet}>Let the app go quiet now</button>
      </div>

      {showNightChannel && (
        <div role="dialog" aria-label="Night Channel handoff" className="tpl-note-card" style={{ marginTop: "1rem" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Night Channel opens separately.</p>
          <p style={{ margin: "0.5rem 0 0", lineHeight: 1.6 }}>
            It offers low-pressure audio to drift into, using your own audio app. Nothing autoplays, and your parked words stay here.
          </p>
          <label style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginTop: "0.75rem", fontSize: "0.92rem" }}>
            <input type="checkbox" className="tpl-checkbox" checked={consents.nightChannelHandoff} onChange={(e) => setConsents({ ...consents, nightChannelHandoff: e.target.checked })} />
            <span>I’d like to continue to Night Channel</span>
          </label>
          <div className="tpl-row" style={{ marginTop: "1rem" }}>
            <button type="button" className="tpl-btn tpl-btn--accent" disabled={!consents.nightChannelHandoff} onClick={onNightChannel}>Open Night Channel</button>
            <button type="button" className="tpl-btn tpl-btn--secondary" onClick={() => setShowNightChannel(false)}>Not tonight</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- darkness --------------------------------- */

function DarknessScreen({ savedExpiry, onReopen, onReview, onExit }) {
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="tpl-darkness">
      <p className="tpl-muted" style={{ margin: 0, fontSize: "1.06rem", lineHeight: 2 }}>
        You can leave it here for now.
      </p>
      <span aria-hidden="true" className="tpl-darkness__dot" />

      <div style={{ marginTop: "3.5rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
        {!showControls ? (
          <button type="button" className="tpl-link" onClick={() => setShowControls(true)}>Show controls</button>
        ) : (
          <>
            <button type="button" className="tpl-btn tpl-btn--outline" onClick={onReopen}>Reopen your note</button>
            <button type="button" className="tpl-link" onClick={onReview}>Review in daylight</button>
            <button type="button" className="tpl-link" onClick={onExit}>Exit</button>
          </>
        )}
      </div>

      <p className="tpl-xs tpl-muted" style={{ marginTop: "3.5rem", opacity: 0.9 }}>
        Your screen may lock as usual. Movement has stopped.
        {savedExpiry ? ` Your note is kept until ${formatDate(savedExpiry)}.` : ""}
        <br />
        Daytime review is a separate visit, whenever you choose it — {timeZoneLabel()}.
      </p>
    </div>
  );
}
