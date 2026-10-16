// Detect only the latest contact after a stalled frame, never replay missed beats.
export function createTappingContactClock({ beatMs, contactMs }) {
  let previous = -1, previousPhase = 0;
  return phase => {
    const contact = Math.floor((phase - contactMs) / beatMs);
    if (phase < previousPhase - beatMs / 2) previous = contact - 1;
    previousPhase = phase;
    if (contact < 0 || contact <= previous) return null;
    previous = contact;
    return contact * beatMs + contactMs;
  };
}

export function isFreshTappingContact(phase, contactAt) {
  const delay = phase - contactAt;
  return delay >= 0 && delay <= 80;
}
