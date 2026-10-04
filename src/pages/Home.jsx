// @ts-check
// Home — the approved MentiCation home screen, delivered as the isolated
// HomeFrame document (original artwork, weekly panel, goal cards, discovery
// cards and bottom navigation are all inside it). This page only bridges the
// document's route IDs to the app's real destinations and feeds it real
// weekly progress. Presentation of the document itself is untouched.
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeFrame from "@/components/home/HomeFrame";
import StreakBadge from "@/components/home/StreakBadge";
import { sessionStore } from "@/lib/localData";
import { hasCompletedOnboarding } from "@/lib/onboarding";
import { buildRecommendation } from "@/lib/recommend";
import { derivePeacePalace } from "@/lib/peacePalace";
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
  // "Your reset for today" appears only for returning users: onboarding done
  // and at least one session in history. Payload matches My Plan's card.
  const [today, setToday] = useState(null);
  // The user's current Peace Palace level, shown on the More for you card
  // and the Your week badge.
  const [palace, setPalace] = useState(null);
  // A quiet, on-device-only read of the daybook for the Journal card's
  // "last entry" line — never anything about what was written.
  const [journal, setJournal] = useState(null);

  useEffect(() => {
    try {
      const daybook = JSON.parse(localStorage.getItem("daybook") || "[]");
      const latest = daybook?.[0]?.date;
      if (!latest) return;
      const then = new Date(latest);
      if (Number.isNaN(then.getTime())) return;
      const days = Math.floor((Date.now() - then.getTime()) / 864e5);
      setJournal({
        caption: days <= 0 ? "Entry saved today" : days === 1 ? "Last entry yesterday" : `Last entry ${days} days ago`,
        entries: daybook.length,
      });
    } catch { /* on-device read only */ }
  }, []);

  useEffect(() => {
    let live = true;
    sessionStore.list("-created_date", 500)
      .then((sessions) => {
        if (!live) return;
        const p = derivePeacePalace(sessions);
        setPalace({
          level: p.level,
          name: p.stage.name,
          nextName: p.next?.name || "",
          stonesToNext: p.stonesToNext,
          progress: p.next ? p.growth / p.next.at : 1,
        });
      })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    readWeekState()
      .then((state) => { if (live) setWeek(state); })
      .catch(() => {});
    return () => { live = false; };
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!hasCompletedOnboarding()) return null;
      const sessions = await sessionStore.list("-created_date", 30);
      if (!sessions.length) return null;
      const recommendation = buildRecommendation(sessions);
      return {
        title: recommendation.title,
        meta: `${recommendation.minutes} min · ${recommendation.tag}`,
        pathway: recommendation.pathway,
        direction: recommendation.direction,
        min: recommendation.min,
      };
    })()
      .then((payload) => { if (live) setToday(payload); })
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
    if (route === "recommended" && today?.pathway?.length) {
      navigate("/reset", {
        state: {
          prebuilt: true, pathway: today.pathway, direction: today.direction,
          directionLabel: today.title, intensity: 5, whereFelt: "both",
          timeMin: today.min, audio: "yes", movement: "seated",
        },
      });
      return;
    }
    if (route === "seven-calmer-days") { navigate("/programmes/calmer-seven"); return; }
    if (route === "restructure") { navigate("/restructure"); return; }
    if (route === "journal") { navigate("/journal"); return; }
    if (route === "good-map") { navigate("/good-map"); return; }
    if (route === "dear-2100") { navigate("/dear-2100"); return; }
    if (route === "palace") { navigate("/palace"); return; }
    if (route === "foundations") { navigate("/foundations"); return; }
    if (route === "library") { navigate("/library"); return; }
    if (route === "my-plan") { navigate("/plan"); return; }
    if (route === "profile") { navigate("/profile"); return; }
    if (route === "insights") { navigate("/insights"); return; }
    if (route === "settings") { navigate("/settings"); return; }
    if (route === "guide") { navigate("/reset", { state: { unsure: true } }); return; }
    if (DIRECTION_LABELS[route]) {
      navigate("/reset", { state: { direction: route, directionLabel: DIRECTION_LABELS[route] } });
    }
  }, [beginWeek, navigate, today]);

  return (
    <div className="relative">
      <StreakBadge />
      <HomeFrame onNavigate={onNavigate} week={week} today={today} palace={palace} journal={journal} />
    </div>
  );
}
