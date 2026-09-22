import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { INTERVENTIONS } from "../src/lib/interventions.js";
import { spokenFor } from "../src/lib/spoken.js";
import { HAPPY_BUMP_NARRATION } from "../src/lib/happyBumpNarration.js";
import { CHANGE_SCENE_NARRATION } from "../src/lib/changeSceneNarration.js";

const ENV_PATH = ".env.local";
const MANIFEST_PATH = "narration-manifest.json";
const AUDIO_DIR = "public/audio/narration";

// Locked Mentication narration preset. Keep this aligned with
// docs/mentation-narration-preset.md and the approved backend snapshot.
const VOICE_ID = "qKsErzZyZLoLSAUfEopJ";
const MODEL_ID = "eleven_multilingual_v2";
const OUTPUT_FORMAT = "mp3_44100_128";
const SPEED = 0.82;
const VOICE_SETTINGS = {
  stability: 0.39,
  similarity_boost: 0.85,
  style: 0.15,
  use_speaker_boost: true,
  speed: SPEED,
};

const mode = process.argv.includes("--generate") ? "generate" : "audit";

function normalize(text) {
  return typeof text === "string" ? text.trim().replace(/\s+/g, " ") : "";
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const splitAt = line.indexOf("=");
    if (splitAt === -1) continue;
    const key = line.slice(0, splitAt).trim();
    let value = line.slice(splitAt + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function narrationKey(text) {
  return crypto.createHash("sha256").update(`${VOICE_ID}|${text}||${SPEED}`).digest("hex");
}

function collectLines() {
  const byText = new Map();
  for (const intervention of INTERVENTIONS) {
    for (const step of intervention.steps || []) {
      const spoken = spokenFor(step, intervention, intervention.primaryDirection);
      const normalised = normalize(spoken);
      if (!normalised) continue;
      if (!byText.has(normalised)) byText.set(normalised, { text: spoken.trim(), interventionIds: [] });
      const entry = byText.get(normalised);
      if (!entry.interventionIds.includes(intervention.id)) entry.interventionIds.push(intervention.id);
    }
  }
  Object.values(HAPPY_BUMP_NARRATION).forEach((text) => {
    const normalised = normalize(text);
    if (!byText.has(normalised)) byText.set(normalised, { text, interventionIds: ["happyBump"] });
  });
  Object.values(CHANGE_SCENE_NARRATION).forEach((text) => {
    const normalised = normalize(text);
    if (!byText.has(normalised)) byText.set(normalised, { text, interventionIds: ["changeScene"] });
  });
  return [...byText.values()];
}

function manifestLookup(manifest) {
  const lookup = new Map();
  for (const [key, entry] of Object.entries(manifest)) {
    const normalised = normalize(entry?.text);
    if (!normalised || lookup.has(normalised)) continue;
    lookup.set(normalised, { key, ...entry });
  }
  return lookup;
}

function inspectCoverage(lines, manifest) {
  const lookup = manifestLookup(manifest);
  const missing = [];
  const withoutAlignment = [];
  const ready = [];

  for (const line of lines) {
    const entry = lookup.get(normalize(line.text));
    const audioFile = entry?.audio?.startsWith("/") ? path.join("public", entry.audio.slice(1)) : null;
    if (!entry?.audio || !audioFile || !fs.existsSync(audioFile)) {
      missing.push(line);
      continue;
    }
    if (!Array.isArray(entry.alignment) || entry.alignment.length === 0) {
      withoutAlignment.push(line);
    }
    ready.push(line);
  }

  return { ready, missing, withoutAlignment };
}

function toWordAlignment(text, alignment) {
  if (
    !alignment ||
    !Array.isArray(alignment.characters) ||
    !Array.isArray(alignment.character_start_times_seconds) ||
    !Array.isArray(alignment.character_end_times_seconds)
  ) {
    throw new Error("ElevenLabs returned no usable timestamp alignment.");
  }

  const characters = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  if (characters.length !== starts.length || characters.length !== ends.length) {
    throw new Error("ElevenLabs alignment arrays have mismatched lengths.");
  }
  if (characters.join("") !== text) {
    throw new Error(`Alignment text mismatch for ${JSON.stringify(text)}`);
  }

  const words = [];
  const pattern = /\S+/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length - 1;
    words.push({
      word: match[0],
      start: Number(starts[startIndex].toFixed(3)),
      end: Number(ends[endIndex].toFixed(3)),
    });
  }
  return words;
}

async function requestNarration(text, apiKey) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS }),
    },
  );
  if (!response.ok) throw new Error(`ElevenLabs ${response.status}: ${await response.text()}`);
  const payload = await response.json();
  if (!payload.audio_base64) throw new Error("ElevenLabs returned no audio data.");
  return {
    audio: Buffer.from(payload.audio_base64, "base64"),
    alignment: toWordAlignment(text, payload.alignment),
  };
}

async function generateMissing(lines, manifest) {
  const env = { ...readEnvFile(ENV_PATH), ...process.env };
  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY in .env.local or the process environment.");

  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const key = narrationKey(line.text);
    const audioPath = path.join(AUDIO_DIR, `${key}.mp3`);
    const publicPath = `/audio/narration/${key}.mp3`;
    console.log(`[${index + 1}/${lines.length}] ${line.interventionIds.join(", ")}`);

    const generated = await requestNarration(line.text, apiKey);
    fs.writeFileSync(audioPath, generated.audio);
    manifest[key] = {
      text: line.text,
      voice_id: VOICE_ID,
      audio: publicPath,
      alignment: generated.alignment,
    };
    // Checkpoint after each paid request so an interrupted run can resume.
    fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  }
}

async function main() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Cannot find ${MANIFEST_PATH}. Run this script from the Mentication project root.`);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const lines = collectLines();
  let coverage = inspectCoverage(lines, manifest);

  console.log(`Core-25 narration lines: ${lines.length}`);
  console.log(`Ready locally: ${coverage.ready.length}`);
  console.log(`Missing local audio: ${coverage.missing.length}`);
  console.log(`Ready without word alignment: ${coverage.withoutAlignment.length}`);

  if (mode === "audit") {
    for (const line of coverage.missing) {
      console.log(`MISSING [${line.interventionIds.join(", ")}] ${normalize(line.text)}`);
    }
    if (coverage.missing.length) process.exitCode = 1;
    return;
  }

  if (!coverage.missing.length) {
    console.log("No narration generation required.");
    return;
  }

  console.log(`Generating ${coverage.missing.length} missing clips with the locked preset.`);
  await generateMissing(coverage.missing, manifest);
  coverage = inspectCoverage(lines, JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8")));
  if (coverage.missing.length) throw new Error(`${coverage.missing.length} narration clips are still missing.`);
  console.log(`Narration verified: ${coverage.ready.length}/${lines.length}`);
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
