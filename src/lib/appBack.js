// Router indices describe app-created entries; history.length also counts other sites.
export function appBackTarget(historyState,fallback='/') {
  return Number.isInteger(historyState?.idx) && historyState.idx>0 ? -1 : fallback;
}
