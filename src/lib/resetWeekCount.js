const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Preserve ResetFlow's existing meaning: every saved session record since the
// rolling seven-day cutoff, not unique days or only fully completed practices.
// Call with all retained sessions. Store upserts make save retries idempotent.
export function countRecentResets(sessions, now = Date.now()) {
  const since = now - WEEK_MS;
  return sessions.filter(session => new Date(session.created_date).getTime() >= since).length;
}
