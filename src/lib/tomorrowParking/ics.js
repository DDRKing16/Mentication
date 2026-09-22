// Calendar export. Produces a file for the user to import themselves. It is
// NOT a delivered reminder, notification or scheduling service — nothing is
// sent anywhere. The event title is generic and the parked note text is
// excluded unless the user explicitly opts in.

export const GENERIC_EVENT_TITLE = "Follow up on a parked note";

const pad = (n) => String(n).padStart(2, "0");

const toUtcStamp = (d) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

const escapeIcs = (value) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function buildIcs({ start, uid, includeText, text }) {
  const end = new Date(start.getTime() + 30 * 60_000);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mentication//Tomorrow Parking Lot//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcs(GENERIC_EVENT_TITLE)}`,
  ];
  if (includeText && text) lines.push(`DESCRIPTION:${escapeIcs(text)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename, contents) {
  const blob = new Blob([contents], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
