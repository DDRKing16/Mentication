// Interventions that ship as finished, self-contained builds in public/<name>/
// (Signal Lock, Vector Shift, Night Channel). They open on their own routes in
// a frame, so every entry point (Library, Home, plan, reset flow) must send
// people there instead of to the simplified in-code stand-ins.
export const STANDALONE_ROUTES = Object.freeze({
  signalLock: "/signal-lock",
  vectorShift: "/vector-shift",
  nightChannel: "/night-channel",
});

/** The route of an intervention's finished build, or null if it has none. */
export function standaloneRouteFor(id) {
  return STANDALONE_ROUTES[id] || null;
}
