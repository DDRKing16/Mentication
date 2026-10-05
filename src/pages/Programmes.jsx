// Programmes: the list, and one programme's day-by-day page.
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Lock, Moon, Sun, Wind } from "lucide-react";
import { sessionStore } from "@/lib/localData";
import { getIntervention } from "@/lib/interventions";
import { usePlus } from "@/lib/subscription";
import {
  PROGRAMMES,
  activeProgrammeId,
  getProgramme,
  launchStateFor,
  leaveProgramme,
  markProgrammeFinished,
  programmeProgress,
  programmeStartedAt,
  startProgramme,
} from "@/lib/programmes";

const ICONS = { calm: Wind, lift: Sun, sleep: Moon };

function useSessions() {
  const [sessions, setSessions] = useState([]);
  useEffect(() => { sessionStore.list("-created_date", 200).then(setSessions).catch(() => {}); }, []);
  return sessions;
}

function Shell({ children, onBack }) {
  return (
    <div className="calmbg min-h-full">
      <main className="mx-auto max-w-xl px-5 pb-20 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button onClick={onBack} className="no-tap flex min-h-11 items-center gap-1 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        {children}
      </main>
    </div>
  );
}

export function ProgrammeList() {
  const navigate = useNavigate();
  const plus = usePlus();
  const sessions = useSessions();
  const active = activeProgrammeId();
  return (
    <Shell onBack={() => navigate(-1)}>
      <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Programmes</p>
      <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-primary">A little each day.</h1>
      <p className="mt-2 text-muted-foreground">Short journeys made of the practices you already know. One opens each day.</p>
      <ul className="mt-7 space-y-4">
        {PROGRAMMES.map((programme) => {
          const Icon = ICONS[programme.goal] || Wind;
          const startedAt = programmeStartedAt(programme.id);
          const progress = startedAt ? programmeProgress(programme, sessions, startedAt) : null;
          const locked = programme.plus && !plus.hasAccess;
          return (
            <li key={programme.id}>
              <button
                type="button"
                onClick={() => navigate(`/programmes/${programme.id}`)}
                className="flex w-full items-start gap-4 rounded-[22px] border border-border bg-card p-5 text-left shadow-[0_12px_30px_-24px_rgba(17,43,80,0.5)]"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold text-primary">
                    {programme.title}
                    {programme.plus && <span className="rounded-full bg-[#E0715C]/15 px-2 py-0.5 text-[0.62rem] font-bold tracking-[0.16em] text-[#B94E3B]">PLUS</span>}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{programme.days.length} days · {programme.promise}</span>
                  {progress && (
                    <span className="mt-3 block">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-primary/10"><span className="block h-full rounded-full bg-[#E0715C]" style={{ width: `${(progress.doneCount / programme.days.length) * 100}%` }} /></span>
                      <span className="mt-1.5 block text-xs text-muted-foreground">{progress.finished ? "Finished" : `${progress.doneCount} of ${programme.days.length} days${active === programme.id ? " · in progress" : ""}`}</span>
                    </span>
                  )}
                </span>
                {locked && <Lock className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" aria-label="Part of Plus" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

export function ProgrammeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plus = usePlus();
  const sessions = useSessions();
  const programme = getProgramme(id);
  const [startedAt, setStartedAt] = useState(() => (programme ? programmeStartedAt(programme.id) : null));
  const progress = programme && startedAt ? programmeProgress(programme, sessions, startedAt) : null;

  useEffect(() => {
    if (programme && progress?.finished) markProgrammeFinished(programme.id);
  }, [programme, progress?.finished]);

  if (!programme) {
    return <Shell onBack={() => navigate("/programmes")}><p className="mt-8 text-muted-foreground">That programme isn't available.</p></Shell>;
  }

  const locked = programme.plus && !plus.hasAccess;
  const begin = () => {
    if (locked) { navigate(`/plus?from=programmes/${programme.id}`); return; }
    startProgramme(programme.id);
    setStartedAt(programmeStartedAt(programme.id));
  };
  const openDay = (day) => {
    const state = launchStateFor(day.id, programme);
    if (state) navigate("/reset", { state });
  };

  return (
    <Shell onBack={() => navigate("/programmes")}>
      <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{programme.days.length}-day programme{programme.plus ? " · Plus" : ""}</p>
      <h1 className="mt-2 font-heading text-3xl font-medium tracking-tight text-primary">{programme.title}</h1>
      <p className="mt-2 text-muted-foreground">{programme.promise}</p>

      {progress?.finished && (
        <div className="mt-6 rounded-[22px] border border-[#E0715C]/30 bg-[#E0715C]/10 p-5">
          <p className="font-heading text-xl text-primary">You finished it. Well done.</p>
          <p className="mt-1 text-sm text-muted-foreground">{programme.days.length} days of showing up for yourself. Keep the ones that helped.</p>
        </div>
      )}

      <ol className="mt-7 space-y-3">
        {(progress?.days || programme.days.map((d) => ({ ...d, name: getIntervention(d.id)?.name || d.id, status: "later" }))).map((day, index) => {
          const isToday = day.status === "today";
          return (
            <li
              key={index}
              className={`rounded-[20px] border p-4 transition ${isToday ? "border-[#E0715C] bg-card shadow-[0_0_0_4px_rgba(224,113,92,0.14),0_14px_30px_-20px_rgba(224,113,92,0.6)]" : "border-border bg-card/70"}`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold ${day.status === "done" ? "bg-[#E0715C] text-white" : isToday ? "border-2 border-[#E0715C] text-primary" : "border border-border text-muted-foreground"}`}>
                  {day.status === "done" ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-medium ${day.status === "later" ? "text-muted-foreground" : "text-primary"}`}>{day.intention}</span>
                  <span className="block text-xs text-muted-foreground">
                    Day {index + 1} · {day.name || day.id}
                    {day.status === "tomorrow" && " · opens tomorrow"}
                  </span>
                </span>
              </div>
              {isToday && (
                <button onClick={() => openDay(day)} className="mt-4 min-h-12 w-full rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  Start day {index + 1}
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {!startedAt && (
        <button onClick={begin} className="mt-7 min-h-[3.25rem] w-full rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {locked ? "Try it free with Plus" : "Start this programme"}
        </button>
      )}
      {startedAt && !progress?.finished && progress?.todayIndex >= 0 && progress.days[progress.todayIndex].status === "tomorrow" && (
        <p className="mt-6 text-center text-sm text-muted-foreground">Today's done. Day {progress.todayIndex + 1} opens tomorrow.</p>
      )}
      {startedAt && (
        <button
          onClick={() => { leaveProgramme(programme.id); setStartedAt(null); }}
          className="mt-6 block w-full text-center text-sm text-muted-foreground underline underline-offset-4"
        >
          {progress?.finished ? "Start it again from day 1" : "Leave this programme"}
        </button>
      )}
    </Shell>
  );
}
