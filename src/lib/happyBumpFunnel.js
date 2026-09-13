const FUNNEL_KEY = "mentation.happyBump.funnel.v1";
const SCENES = new Set(["arrival", "baseline", "stand", "music", "hydrate", "environment", "move", "connection", "win", "mission", "proud", "grateful", "anticipate", "lifeArea", "areaAction", "nextMode", "nextPlan", "rerate", "reveal", "complete"]);

const read = () => {
  try { return JSON.parse(localStorage.getItem(FUNNEL_KEY) || "") || { version: 1, runs: [] }; } catch { return { version: 1, runs: [] }; }
};
const save = (value) => { try { localStorage.setItem(FUNNEL_KEY, JSON.stringify(value)); } catch { /* private mode / quota */ } };

export function startBumpRun() {
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  recordBumpScene(runId, "arrival");
  return runId;
}

export function recordBumpScene(runId, scene) {
  if (!runId || !SCENES.has(scene)) return;
  const current = read();
  const existing = current.runs.find((run) => run.id === runId);
  if (existing) {
    if (!existing.scenes.includes(scene)) existing.scenes.push(scene);
    existing.updatedAt = new Date().toISOString();
  } else {
    current.runs.push({ id: runId, scenes: [scene], startedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  current.runs = current.runs.slice(-50);
  save(current);
}

export function getBumpFunnel() { return read(); }
export function clearBumpFunnel() { try { localStorage.removeItem(FUNNEL_KEY); } catch { /* private mode */ } }
