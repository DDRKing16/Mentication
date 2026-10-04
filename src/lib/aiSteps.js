// AI step generation for tasks that have no hand-crafted steps in the app.
//
// Calls the small AI relay that runs alongside the dev server (VITE_AI_URL).
// The relay holds the provider API key, so no secret ever reaches this bundle
// (AGENTS.md forbids private keys in frontend/native bundles). If the relay
// is unreachable or has no key configured yet, this resolves null and the
// caller falls back to the built-in generic ladder, so the app always works.
const AI_URL = import.meta.env.VITE_AI_URL || "";

export const aiStepsAvailable = () => Boolean(AI_URL);

// Returns a list of steps in the app's ladder shape — { title, micro, time,
// easier: [two easier alternatives] } — or null when AI generation is not
// possible right now.
export async function generateTaskSteps(taskName, { pathLength = "regular" } = {}) {
  if (!AI_URL || !taskName?.trim()) return null;
  try {
    const res = await fetch(`${AI_URL}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: taskName.trim(), pathLength }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const steps = Array.isArray(data?.steps) ? data.steps : null;
    if (!steps?.length) return null;
    const cleaned = steps
      .filter((s) => s && typeof s.title === "string" && typeof s.micro === "string")
      .map((s) => ({
        title: s.title,
        micro: s.micro,
        time: typeof s.time === "string" ? s.time : "<45 sec",
        easier:
          Array.isArray(s.easier) && s.easier.length >= 2
            ? s.easier.slice(0, 2).map(String)
            : ["Do the smallest piece", "Make it easier"],
      }));
    return cleaned.length >= 5 ? cleaned : null;
  } catch {
    return null;
  }
}
