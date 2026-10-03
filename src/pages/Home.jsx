// @ts-check
// Home — the approved MentiCation home screen, delivered as the isolated
// HomeFrame document (original artwork, weekly panel, goal cards, discovery
// cards and bottom navigation are all inside it). This page only bridges the
// document's route IDs to the app's real destinations and feeds it real
// weekly progress. Presentation of the document itself is untouched.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeFrame from "@/components/home/HomeFrame";
import { sessionStore } from "@/lib/localData";
import {
  activeProgrammeId,
  getProgramme,
  programmeStartedAt,
  startProgramme,
} from "@/lib/programmeStore";

const WEEK_PROGRAMME_ID = "calmer-seven";

const DIRECTION_LABELS = {
  lift: "Lift",
  focus: "Focus",
  calm: "Calm",
  ground: "Ground",
  sleep: "Sleep",
};

// The document's weekly panel is the seven calmer days, so its circles show
// that programme's real progress: completed day indexes and the current day
// (never marked complete by touching Home — read-only here).
async function readWeekState() {
  const id = activeProgrammeId();
  if (id !== WEEK_PROGRAMME_ID) return { currentDay: null, completedDays: [] };
  const sessions = await sessionStore.list("-created_date", 200);
  const { programmeProgress } = await import("@/lib/programmes");
  const programme = getProgramme(WEEK_PROGRAMME_ID);
  if (!programme) return { currentDay: null, completedDays: [] };
  const progress = programmeProgress(programme, sessions, programmeStartedAt(id));
  const completedDays = progress.days
    .map((day, index) => (day.status === "done" ? index : null))
    .filter((index) => index !== null);
  return {
    currentDay: progress.finished ? null : Math.max(progress.todayIndex, 0),
    completedDays,
  };
}

export default function Home() {
  const navigate = useNavigate();
  const [week, setWeek] = useState({ currentDay: null, completedDays: [] });

  useEffect(() => {
    let live = true;
    readWeekState()
      .then((state) => { if (live) setWeek(state); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  // Begin starts (or continues) the seven calmer days and opens today's
  // practice the same way the Programmes page does. If the week is finished
  // or today's day hasn't opened yet, it shows the programme itself.
  const beginWeek = useCallback(async () => {
    const programme = getProgramme(WEEK_PROGRAMME_ID);
    if (!programme) return;
    if (!programmeStartedAt(WEEK_PROGRAMME_ID)) startProgramme(WEEK_PROGRAMME_ID);
    const { programmeProgress, launchStateFor } = await import("@/lib/programmes");
    const sessions = await sessionStore.list("-created_date", 200);
    const progress = programmeProgress(programme, sessions, programmeStartedAt(WEEK_PROGRAMME_ID));
    const today = progress.finished ? null : progress.days[progress.todayIndex];
    if (!today || today.status !== "today") {
      navigate("/programmes/calmer-seven");
      return;
    }
    const state = launchStateFor(today.id, programme);
    if (state) navigate("/reset", { state });
    else navigate("/programmes/calmer-seven");
  }, [navigate]);

  const onNavigate = useCallback((route) => {
    if (route === "home") return; // the document scrolls itself to the top
    if (route === "begin") { void beginWeek(); return; }
    if (route === "seven-calmer-days") { navigate("/programmes/calmer-seven"); return; }
    if (route === "restructure") { navigate("/restructure"); return; }
    if (route === "journal") { navigate("/journal"); return; }
    if (route === "good-map") { navigate("/good-map"); return; }
    if (route === "dear-2100") { navigate("/dear-2100"); return; }
    if (route === "library") { navigate("/library"); return; }
    if (route === "my-plan") { navigate("/plan"); return; }
    if (route === "profile") { navigate("/profile"); return; }
    if (route === "insights") { navigate("/insights"); return; }
    if (route === "settings") { navigate("/settings"); return; }
    if (route === "guide") { navigate("/reset", { state: { unsure: true } }); return; }
    if (DIRECTION_LABELS[route]) {
      navigate("/reset", { state: { direction: route, directionLabel: DIRECTION_LABELS[route] } });
    }
  }, [beginWeek, navigate]);

  return <HomeFrame onNavigate={onNavigate} week={week} />;
}
