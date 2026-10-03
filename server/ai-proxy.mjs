// Tiny AI relay for Mentication's "Next Easiest Step" step generation.
//
// Why this exists: the app itself is local-first and must never carry a
// provider API key in its bundle (AGENTS.md), so the browser asks this relay,
// and the relay alone holds the key and talks to the provider.
//
// Provider is picked from the environment: OPENAI_API_KEY or
// ANTHROPIC_API_KEY (whichever is set). Without a key, /steps answers 503 and
// the app falls back to its built-in generic steps.
//
// Dev infrastructure only — run with: node server/ai-proxy.mjs
import http from "node:http";

const PORT = Number(process.env.PORT || 8000);
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";

const TARGET_STEPS = 20;

function buildPrompt(task, pathLength) {
  const count = pathLength === "speedy" ? 8 : TARGET_STEPS;
  return [
    `Task: "${task}"`,
    "",
    "You write steps for Mentication's Next Easiest Step exercise, which helps",
    "someone who is stuck and overwhelmed finally start a task. Break THIS",
    "SPECIFIC task into exactly " + count + " ordered micro-steps that are only",
    "true for this task — never generic filler like 'prepare your space' or",
    "'open your workspace'. The first steps must be the smallest possible",
    "physical actions (seconds long) that break the ice; later steps progress",
    "towards the task actually being done.",
    "",
    'Each step object: "title" (imperative, under 8 words, names real parts of',
    'the task), "micro" (one concrete sentence of physical guidance, mentions',
    'real UI elements, tools or items for this task), "time" ("<15 sec",',
    '"<30 sec", "<45 sec", "<60 sec" or "<2 min"), "easier" (array of exactly 2',
    'even smaller fallback actions).',
    "",
    'Reply with strict JSON only: {"steps": [...]}',
  ].join("\n");
}

async function callOpenAI(task, pathLength) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildPrompt(task, pathLength) }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

async function callAnthropic(task, pathLength) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: buildPrompt(task, pathLength) + '\nReturn only the raw JSON object.' }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || "{}";
  return JSON.parse(text.replace(/^[^{]*/, "").replace(/[^}]*$/, ""));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => { body += c; if (body.length > 50_000) req.destroy(); });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      provider: OPENAI_KEY ? "openai" : ANTHROPIC_KEY ? "anthropic" : null,
    }));
  }

  if (req.method !== "POST" || req.url !== "/steps") {
    res.writeHead(404); return res.end();
  }

  const provider = OPENAI_KEY ? "openai" : ANTHROPIC_KEY ? "anthropic" : null;
  if (!provider) {
    res.writeHead(503, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: "no provider key configured" }));
  }

  try {
    const body = JSON.parse((await readBody(req)) || "{}");
    const task = String(body.task || "").trim().slice(0, 300);
    const pathLength = body.pathLength === "speedy" ? "speedy" : "regular";
    if (!task) { res.writeHead(400, { "Content-Type": "application/json" }); return res.end(JSON.stringify({ error: "task required" })); }

    const parsed = provider === "openai"
      ? await callOpenAI(task, pathLength)
      : await callAnthropic(task, pathLength);
    const steps = Array.isArray(parsed.steps) ? parsed.steps : null;
    if (!steps?.length) throw new Error("model returned no steps");

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ steps }));
  } catch (err) {
    console.error("[ai-relay]", err.message);
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "generation failed" }));
  }
});

server.listen(PORT, () => {
  const provider = OPENAI_KEY ? "openai" : ANTHROPIC_KEY ? "anthropic" : "none";
  console.log(`[ai-relay] listening on :${PORT} (provider: ${provider})`);
});
