import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CalendarPlus, ListTree, Pencil, SunMedium, Trash2 } from "lucide-react";
import ParkedObject from "@/components/tomorrow-parking/ParkedObject";
import { daysRemaining, formatDate, savedWhenLabel, timeZoneLabel } from "@/lib/tomorrowParking/dates";
import { GENERIC_EVENT_TITLE, buildIcs, downloadIcs } from "@/lib/tomorrowParking/ics";
import {
  RETENTION_DAYS, deleteRecord, migrateLegacyPending, newId, readLegacyPending, setOrganisation,
  stageNextStepHandoff, tryLoadRecords, updateNoteText,
} from "@/lib/tomorrowParking/storage";
import "@/styles/tomorrow-parking.css";

const NIGHT_ENTRY_STATE = { prebuilt: true, pathway: ["tomorrowParking"], direction: "sleep", startedFrom: "parkingLot" };

// Daytime review. Never reached automatically from the night flow: it is a
// separate visit, and nothing here is sorted, rated or analysed on the user's
// behalf.
export default function ParkingLot() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [view, setView] = useState("arrival");
  const [records, setRecords] = useState([]);
  const [legacyFound, setLegacyFound] = useState(false);
  const [notice, setNotice] = useState(null);

  const refresh = () => setRecords(tryLoadRecords().records);

  useEffect(() => {
    refresh();
    setLegacyFound(Boolean(readLegacyPending()));
    setReady(true);
  }, []);

  const latest = records[0];
  const goNight = () => navigate("/reset", { state: NIGHT_ENTRY_STATE });

  return (
    <main className="tpl tpl--daylight">
      <div className="tpl-frame" style={{ paddingTop: "2rem" }}>
        <p className="tpl-eyebrow tpl-center">Tomorrow Parking Lot</p>

        {!ready && <p className="tpl-small tpl-muted tpl-center" style={{ marginTop: "3rem" }}>Loading…</p>}

        {ready && view === "arrival" && (
          <div className="tpl-rise" style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", paddingBlock: "1rem" }}>
            <h1 className="tpl-display tpl-h1 tpl-h1--center" style={{ marginTop: "1.5rem" }}>
              {latest && savedWhenLabel(latest.createdAt) === "Last night" ? "Last night’s parking lot" : records.length > 0 ? "Your parking lot" : "Nothing is parked"}
            </h1>
            <p className="tpl-lede tpl-lede--center" style={{ marginTop: "0.75rem" }}>
              {records.length > 0 ? "It is ready when you are." : "Whenever you park something at night, it will wait for you here."}
            </p>

            <ParkedObject caption={records.length > 0 ? "Held overnight" : "Empty"} />

            {records.length > 0 && (
              <p className="tpl-small tpl-muted tpl-center" style={{ marginTop: "1.5rem" }}>
                {records.length === 1 ? "One note" : `${records.length} notes`}
                {latest ? `, held since ${savedWhenLabel(latest.createdAt).toLowerCase()}` : ""}.
              </p>
            )}

            <div className="tpl-stack" style={{ marginTop: "2rem" }}>
              <button type="button" className="tpl-btn tpl-btn--primary tpl-btn--block tpl-btn--lg" onClick={() => setView("review")}>
                {records.length > 0 ? "Open when ready" : "Open the review"}
              </button>
              <button type="button" className="tpl-link" style={{ width: "100%" }} onClick={() => setView("closed")}>Come back later</button>
            </div>

            {legacyFound && (
              <div className="tpl-card" style={{ marginTop: "2rem" }}>
                <p className="tpl-small" style={{ margin: 0 }}>An older parked item from a previous version of this app is still on this device. You can bring it across as a note.</p>
                <button
                  type="button"
                  className="tpl-btn tpl-btn--outline"
                  style={{ marginTop: "0.75rem" }}
                  onClick={() => {
                    try {
                      migrateLegacyPending();
                      refresh();
                      setLegacyFound(Boolean(readLegacyPending()));
                      setNotice("The older item was brought across as a note.");
                    } catch {
                      setNotice("The older item could not be brought across. It has been left exactly where it was.");
                    }
                  }}
                >
                  Bring it across
                </button>
              </div>
            )}

            <div className="tpl-center" style={{ marginTop: "auto", paddingTop: "2.5rem" }}>
              <Link to="/" className="tpl-link">Back home</Link>
              <span className="tpl-muted" style={{ padding: "0 0.5rem", opacity: 0.5 }}>·</span>
              <button type="button" className="tpl-link" onClick={goNight}>Go to the night space</button>
            </div>
          </div>
        )}

        {ready && view === "closed" && (
          <div className="tpl-rise tpl-center" style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <h1 className="tpl-display tpl-h1">Still parked</h1>
            <p className="tpl-small tpl-muted" style={{ marginTop: "0.75rem", maxWidth: "20rem", lineHeight: 1.8 }}>
              Nothing was changed or deleted. Everything is kept for {RETENTION_DAYS} days from when you saved or last edited it.
            </p>
            <div className="tpl-row" style={{ marginTop: "2rem" }}>
              <button type="button" className="tpl-btn tpl-btn--secondary" onClick={() => setView("arrival")}>Back</button>
              <Link to="/" className="tpl-btn tpl-btn--outline">Home</Link>
            </div>
          </div>
        )}

        {ready && view === "review" && (
          <div className="tpl-rise" style={{ display: "flex", flex: 1, flexDirection: "column" }}>
            <h1 className="tpl-display tpl-h1 tpl-h1--center" style={{ marginTop: "1.5rem" }}>What you parked</h1>
            <p className="tpl-lede tpl-lede--center" style={{ marginTop: "0.75rem" }}>Organise it now — or leave it for later.</p>

            {notice && <p role="status" className="tpl-status">{notice}</p>}

            {records.length === 0 ? (
              <div className="tpl-card tpl-center" style={{ marginTop: "2.5rem" }}>
                <p className="tpl-small tpl-muted" style={{ margin: 0 }}>There are no parked notes on this device right now.</p>
                <button type="button" className="tpl-btn tpl-btn--outline" style={{ marginTop: "1rem" }} onClick={goNight}>Open the night space</button>
              </div>
            ) : (
              <ul className="tpl-stack" style={{ listStyle: "none", margin: "1.75rem 0 0", padding: 0, gap: "1.25rem" }}>
                {records.map((record) => (
                  <li key={record.id}>
                    <RecordCard record={record} onChanged={(message) => { refresh(); setNotice(message); }} />
                  </li>
                ))}
              </ul>
            )}

            <p className="tpl-xs tpl-muted tpl-center" style={{ marginTop: "2rem", lineHeight: 1.7 }}>
              Nothing was required from you overnight. Nothing here was sorted, counted, rated or analysed — any grouping below is one you chose yourself. Times shown in {timeZoneLabel()}.
            </p>

            <div className="tpl-center" style={{ marginTop: "auto", paddingTop: "2rem" }}>
              <button type="button" className="tpl-link" onClick={() => setView("closed")}>Leave everything parked</button>
              <span className="tpl-muted" style={{ padding: "0 0.5rem", opacity: 0.5 }}>·</span>
              <Link to="/" className="tpl-link">Back home</Link>
            </div>
          </div>
        )}

        <div style={{ marginTop: "2.5rem", display: "flex", justifyContent: "center" }}>
          <span className="tpl-pill"><SunMedium aria-hidden="true" size={16} /> Daytime only</span>
        </div>
      </div>
    </main>
  );
}

/* ------------------------------ record card -------------------------------- */

function RecordCard({ record, onChanged }) {
  const [panel, setPanel] = useState("none");
  const [draft, setDraft] = useState(record.text);
  const [error, setError] = useState(null);

  const open = (next) => { setError(null); setDraft(record.text); setPanel(next); };

  return (
    <article className="tpl-card">
      <header style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: "0.5rem" }}>
        <h2 className="tpl-small" style={{ margin: 0, fontWeight: 600 }}>{savedWhenLabel(record.createdAt)}</h2>
        <p className="tpl-xs tpl-muted" style={{ margin: 0 }}>Kept {daysRemaining(record.expiresAt)} more days · until {formatDate(record.expiresAt)}</p>
      </header>

      <p className="tpl-prewrap" style={{ margin: "1rem 0 0", fontSize: "1rem", lineHeight: 2 }}>{record.text}</p>

      {record.organisation && (
        <div className="tpl-panel" style={{ marginTop: "1.25rem" }}>
          <p className="tpl-eyebrow" style={{ margin: 0 }}>Your grouping</p>
          <ul style={{ margin: "0.75rem 0 0", padding: 0, listStyle: "none", display: "grid", gap: "0.5rem" }}>
            {record.organisation.items.map((item) => (
              <li key={item.id} className="tpl-small" style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                <span aria-hidden="true" style={{ marginTop: "0.5rem", width: 6, height: 6, borderRadius: 999, background: "var(--tpl-primary)", flexShrink: 0 }} />
                <span>{item.text}<span className="tpl-xs tpl-muted" style={{ marginLeft: "0.5rem" }}>{groupLabel(item.group)}</span></span>
              </li>
            ))}
          </ul>
          <p className="tpl-xs tpl-muted" style={{ margin: "0.75rem 0 0" }}>Confirmed by you on {formatDate(record.organisation.confirmedAt)}. Your original note above is unchanged.</p>
        </div>
      )}

      <div className="tpl-wrap" style={{ marginTop: "1.25rem" }}>
        <button type="button" className="tpl-chip" onClick={() => open("edit")}><Pencil aria-hidden="true" size={16} /> Edit</button>
        <button type="button" className="tpl-chip" onClick={() => open("organise")}><ListTree aria-hidden="true" size={16} /> Organise</button>
        <button type="button" className="tpl-chip" onClick={() => open("handoff")}><ArrowRight aria-hidden="true" size={16} /> Next easiest step</button>
        <button type="button" className="tpl-chip" onClick={() => open("calendar")}><CalendarPlus aria-hidden="true" size={16} /> Add to calendar</button>
        <button type="button" className="tpl-chip" style={{ color: "var(--tpl-destructive)", borderColor: "color-mix(in oklab, var(--tpl-destructive) 40%, transparent)" }} onClick={() => open("delete")}><Trash2 aria-hidden="true" size={16} /> Delete</button>
      </div>

      {error && <p role="alert" className="tpl-small" style={{ marginTop: "1rem", color: "var(--tpl-destructive)" }}>{error}</p>}

      {panel === "edit" && (
        <div style={{ marginTop: "1.25rem" }}>
          <label htmlFor={`tpl-edit-${record.id}`} className="tpl-small tpl-muted">Your note. Changes are only kept when you save them.</label>
          <textarea id={`tpl-edit-${record.id}`} className="tpl-textarea" style={{ marginTop: "0.5rem" }} value={draft} onChange={(e) => setDraft(e.target.value)} rows={6} />
          <div className="tpl-row" style={{ marginTop: "0.75rem" }}>
            <button
              type="button"
              className="tpl-btn tpl-btn--primary"
              style={{ flex: 1 }}
              onClick={() => {
                try {
                  updateNoteText(record.id, draft);
                  setPanel("none");
                  onChanged("Your edit was saved.");
                } catch {
                  setError("The edit could not be saved on this device. Your note is unchanged and your text is still in the box.");
                }
              }}
            >
              Save changes
            </button>
            <button type="button" className="tpl-btn tpl-btn--secondary" style={{ flex: 1 }} onClick={() => setPanel("none")}>Cancel</button>
          </div>
        </div>
      )}

      {panel === "organise" && (
        <OrganisePanel
          record={record}
          onCancel={() => setPanel("none")}
          onConfirm={(items) => {
            try {
              setOrganisation(record.id, items);
              setPanel("none");
              onChanged("Your grouping was saved. The original note was kept as written.");
            } catch {
              setError("The grouping could not be saved. Your note is unchanged.");
            }
          }}
        />
      )}

      {panel === "delete" && (
        <div role="alertdialog" aria-label="Delete this note" className="tpl-panel" style={{ marginTop: "1.25rem", borderColor: "color-mix(in oklab, var(--tpl-destructive) 50%, transparent)" }}>
          <p className="tpl-small" style={{ margin: 0 }}>Delete this note permanently from this device? This cannot be undone, and the text is not reused anywhere afterwards.</p>
          <div className="tpl-row" style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="tpl-btn tpl-btn--destructive"
              style={{ flex: 1 }}
              onClick={() => {
                try {
                  deleteRecord(record.id);
                  onChanged("The note was deleted from this device.");
                } catch {
                  setError("The note could not be deleted. It is still stored.");
                }
              }}
            >
              Delete permanently
            </button>
            <button type="button" className="tpl-btn tpl-btn--secondary" style={{ flex: 1 }} onClick={() => setPanel("none")}>Keep it</button>
          </div>
        </div>
      )}

      {panel === "calendar" && <CalendarPanel record={record} onClose={() => setPanel("none")} />}
      {panel === "handoff" && <HandoffPanel record={record} onClose={() => setPanel("none")} />}
    </article>
  );
}

function groupLabel(group) {
  if (group === "remember") return "Remember";
  if (group === "deal-with") return "Deal with";
  return "Can wait";
}

/* ----------------------------- organise panel ------------------------------ */

function OrganisePanel({ record, onCancel, onConfirm }) {
  const [items, setItems] = useState(() =>
    record.organisation
      ? record.organisation.items
      : record.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).map((line) => ({ id: newId(), text: line, group: "can-wait", done: false })),
  );
  const update = (id, patch) => setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  return (
    <div className="tpl-panel" style={{ marginTop: "1.25rem" }}>
      <p className="tpl-small" style={{ margin: 0 }}>Your note was split by line as a starting point. Nothing is saved until you confirm, and you choose every label yourself.</p>
      <ul style={{ listStyle: "none", margin: "1rem 0 0", padding: 0, display: "grid", gap: "1rem" }}>
        {items.map((item, index) => (
          <li key={item.id} className="tpl-panel" style={{ padding: "0.75rem" }}>
            <label className="tpl-sr-only" htmlFor={`tpl-item-${item.id}`}>Item {index + 1} text</label>
            <input id={`tpl-item-${item.id}`} className="tpl-input" value={item.text} onChange={(e) => update(item.id, { text: e.target.value })} />
            <div className="tpl-wrap" style={{ marginTop: "0.75rem", alignItems: "center" }}>
              {["remember", "deal-with", "can-wait"].map((group) => (
                <button key={group} type="button" aria-pressed={item.group === group} className={`tpl-chip tpl-chip--sm${item.group === group ? " tpl-chip--selected" : ""}`} onClick={() => update(item.id, { group })}>
                  {groupLabel(group)}
                </button>
              ))}
              <button type="button" className="tpl-link" style={{ marginLeft: "auto", fontSize: "0.8rem" }} onClick={() => setItems((prev) => prev.filter((p) => p.id !== item.id))}>Remove from grouping</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="tpl-row" style={{ marginTop: "1rem" }}>
        <button type="button" className="tpl-btn tpl-btn--primary" style={{ flex: 1 }} disabled={items.length === 0} onClick={() => onConfirm(items)}>Confirm this grouping</button>
        <button type="button" className="tpl-btn tpl-btn--secondary" style={{ flex: 1 }} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

/* ----------------------------- calendar panel ------------------------------ */

function CalendarPanel({ record, onClose }) {
  const tomorrow = new Date(Date.now() + 86_400_000);
  const [date, setDate] = useState(`${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`);
  const [time, setTime] = useState("09:00");
  const [includeText, setIncludeText] = useState(false);
  const [done, setDone] = useState(false);

  const start = new Date(`${date}T${time}`);
  const valid = !Number.isNaN(start.getTime());

  return (
    <div className="tpl-panel" style={{ marginTop: "1.25rem" }}>
      <p className="tpl-small" style={{ margin: 0 }}>This creates a calendar file for you to import yourself. It is not a reminder service: nothing is sent, scheduled or delivered by this app, and no notification is switched on.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginTop: "1rem" }}>
        <label className="tpl-small tpl-muted">Date<input type="date" className="tpl-input" style={{ marginTop: "0.25rem" }} value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <label className="tpl-small tpl-muted">Time<input type="time" className="tpl-input" style={{ marginTop: "0.25rem" }} value={time} onChange={(e) => setTime(e.target.value)} /></label>
      </div>

      <div className="tpl-panel tpl-small tpl-muted" style={{ marginTop: "1rem", padding: "0.75rem" }}>
        <p style={{ margin: 0, color: "var(--tpl-fg)" }}>Exactly what the file will contain</p>
        <p style={{ margin: "0.5rem 0 0" }}>Title: “{GENERIC_EVENT_TITLE}”</p>
        <p style={{ margin: 0 }}>When: {valid ? start.toLocaleString() : "choose a valid date and time"} ({timeZoneLabel()})</p>
        <p style={{ margin: 0 }}>Length: 30 minutes</p>
        <p style={{ margin: 0 }}>Note text included: {includeText ? "yes, by your choice" : "no"}</p>
      </div>

      <label className="tpl-small" style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", marginTop: "1rem" }}>
        <input type="checkbox" className="tpl-checkbox" checked={includeText} onChange={(e) => setIncludeText(e.target.checked)} />
        <span>Include my note text in the calendar entry. It will then be visible in your calendar and anywhere that calendar is shared.</span>
      </label>

      <div className="tpl-row" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className="tpl-btn tpl-btn--primary"
          style={{ flex: 1 }}
          disabled={!valid}
          onClick={() => {
            downloadIcs("tomorrow-parking-lot.ics", buildIcs({ start, uid: `${record.id}@mentication.local`, includeText, ...(includeText ? { text: record.text } : {}) }));
            setDone(true);
          }}
        >
          Download the file
        </button>
        <button type="button" className="tpl-btn tpl-btn--secondary" style={{ flex: 1 }} onClick={onClose}>Close</button>
      </div>
      {done && <p role="status" className="tpl-small tpl-muted" style={{ marginTop: "0.75rem" }}>The file was downloaded. Import it into your own calendar to make it real. Your note stays parked here either way.</p>}
    </div>
  );
}

/* ----------------------------- handoff panel ------------------------------- */

function HandoffPanel({ record, onClose }) {
  const navigate = useNavigate();
  const lines = record.text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const [excerpt, setExcerpt] = useState(lines[0] ?? record.text);
  const [error, setError] = useState(null);

  const go = (withExcerpt) => {
    // Only the chosen excerpt travels, for this session only; the parked record stays untouched.
    const staged = stageNextStepHandoff(withExcerpt ? excerpt : "");
    if (withExcerpt && excerpt.trim() && !staged) {
      setError("The excerpt could not be handed over. Your parked note is still stored exactly as it was.");
      return;
    }
    navigate("/next-easiest-step");
  };

  return (
    <div className="tpl-panel" style={{ marginTop: "1.25rem" }}>
      <p className="tpl-small" style={{ margin: 0 }}>Next Easiest Step is a separate experience. You decide exactly what is passed on — one line, an edited version, or nothing at all.</p>

      {lines.length > 1 && (
        <div className="tpl-wrap" style={{ marginTop: "1rem" }}>
          {lines.map((line, i) => (
            <button key={`${line}-${i}`} type="button" aria-pressed={excerpt === line} className={`tpl-chip tpl-chip--sm${excerpt === line ? " tpl-chip--selected" : ""}`} onClick={() => setExcerpt(line)}>
              {line.length > 32 ? `${line.slice(0, 32)}…` : line}
            </button>
          ))}
        </div>
      )}

      <label htmlFor={`tpl-excerpt-${record.id}`} className="tpl-small tpl-muted" style={{ display: "block", marginTop: "1rem" }}>What will be shared (you can edit it)</label>
      <textarea id={`tpl-excerpt-${record.id}`} className="tpl-textarea" style={{ marginTop: "0.5rem" }} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={3} />

      {error && <p role="alert" className="tpl-small" style={{ marginTop: "0.75rem", color: "var(--tpl-destructive)" }}>{error}</p>}

      <div className="tpl-stack" style={{ marginTop: "1rem" }}>
        <div className="tpl-row">
          <button type="button" className="tpl-btn tpl-btn--primary" style={{ flex: 1 }} onClick={() => go(true)}>Continue with this excerpt</button>
          <button type="button" className="tpl-btn tpl-btn--secondary" style={{ flex: 1 }} onClick={() => go(false)}>Continue without details</button>
        </div>
        <button type="button" className="tpl-link" style={{ width: "100%" }} onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}
