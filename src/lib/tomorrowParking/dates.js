// Date labelling for parked notes. Labels derive from the saved timestamp in
// the viewer's current local time zone. "Last night" is only used for a
// genuinely recent overnight record. Nothing here is clock-forced: the daytime
// review is always user-initiated.

export function localTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "your device time zone";
  } catch {
    return "your device time zone";
  }
}

export function timeZoneLabel(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat(undefined, { timeZoneName: "short" }).formatToParts(date);
    return parts.find((p) => p.type === "timeZoneName")?.value ?? localTimeZone();
  } catch {
    return localTimeZone();
  }
}

export function formatDateTime(iso) {
  return new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDate(iso) {
  return new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(new Date(iso));
}

const startOfLocalDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * "Last night" requires: saved during night hours (18:00–05:59 local) AND less
 * than 20 hours ago AND on today's or yesterday's local calendar day.
 */
export function savedWhenLabel(iso, now = new Date()) {
  const saved = new Date(iso);
  const hoursAgo = (now.getTime() - saved.getTime()) / 3_600_000;
  const dayDelta = Math.round((startOfLocalDay(now) - startOfLocalDay(saved)) / 86_400_000);
  const savedHour = saved.getHours();
  const nightHours = savedHour >= 18 || savedHour < 6;

  if (nightHours && hoursAgo < 20 && dayDelta <= 1) return "Last night";
  if (dayDelta === 0) return `Earlier today, ${formatDateTime(iso)}`;
  if (dayDelta === 1) return `Yesterday, ${formatDateTime(iso)}`;
  return formatDateTime(iso);
}

export function daysRemaining(expiresAtIso, now = new Date()) {
  return Math.max(0, Math.ceil((Date.parse(expiresAtIso) - now.getTime()) / 86_400_000));
}
