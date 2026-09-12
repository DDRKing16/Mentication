import fs from "fs";
import path from "path";
import crypto from "crypto";

const ENV_PATH = ".env.local";
const MANIFEST_PATH = "narration-manifest.json";
const AUDIO_DIR = "public/audio/narration";

const VOICE_ID = "qKsErzZyZLoLSAUfEopJ";
const SPEED = 0.82;

const TEXTS = [
  "Gently tense your hands and forearms. Hold. Three, two, one. And let go.",
  "Let your hands and forearms soften completely. Notice the warmth and heaviness.",
  "Now tense your arms and shoulders. Lift slightly. Hold. Three, two, one. And release.",
  "Let your arms and shoulders drop and soften. Feel that area loosen.",
  "Gently tense your jaw and face. Hold. Three, two, one. And let everything soften.",
  "Let your jaw, your eyes, and your forehead soften completely.",
  "Gently tighten your chest and stomach. Hold. Three, two, one. And release.",
  "Let your chest and stomach soften. Allow the centre of your body to relax.",
  "Tense your hips and glutes. Hold. Three, two, one. And let go.",
  "Let your hips and glutes soften completely. Feel the weight settling down.",
  "Gently tense your thighs. Hold. Three, two, one. And release.",
  "Let your thighs soften and grow heavy. Notice the release in your legs.",
  "Tense your calves and feet. Hold. Three, two, one. And let go completely.",
  "Let your calves and feet soften. Let them feel warm, heavy, and at rest.",
  "Notice your whole body now. Let every remaining bit of tension soften.",
  "Let your whole body rest. Nothing else to do right now.",
];

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const rawLine of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function narrationKey(text) {
  return crypto
    .createHash("sha256")
    .update(`${VOICE_ID}|${text}||${SPEED}`)
    .digest("hex");
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

  const chars = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;

  if (chars.length !== starts.length || chars.length !== ends.length) {
    throw new Error("ElevenLabs alignment arrays have mismatched lengths.");
  }

  const alignedText = chars.join("");
  if (alignedText !== text) {
    throw new Error(
      `Alignment text mismatch.\nExpected: ${JSON.stringify(text)}\nReceived: ${JSON.stringify(alignedText)}`
    );
  }

  const words = [];
  const re = /\S+/g;
  let match;

  while ((match = re.exec(text)) !== null) {
    const token = match[0];
    const startIndex = match.index;
    const endIndex = startIndex + token.length - 1;

    words.push({
      start: Number(starts[startIndex].toFixed(3)),
      word: token,
      end: Number(ends[endIndex].toFixed(3)),
    });
  }

  return words;
}

async function generate(text, apiKey) {
  const url =
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/with-timestamps` +
    `?output_format=mp3_44100_128`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.39,
        similarity_boost: 0.85,
        style: 0.15,
        use_speaker_boost: true,
        speed: SPEED,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`ElevenLabs ${response.status}: ${body}`);
  }

  const data = await response.json();

  if (!data.audio_base64) {
    throw new Error("ElevenLabs returned no audio_base64.");
  }

  // Prefer original-text alignment. Do not fabricate timestamps.
  const wordAlignment = toWordAlignment(text, data.alignment);

  return {
    audio: Buffer.from(data.audio_base64, "base64"),
    alignment: wordAlignment,
  };
}

async function main() {
  const env = readEnvFile(ENV_PATH);
  const apiKey = env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error("\nMissing ELEVENLABS_API_KEY in .env.local\n");
    console.error("Add this line to .env.local:");
    console.error("ELEVENLABS_API_KEY=your_real_key_here\n");
    process.exit(1);
  }

  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`Cannot find ${MANIFEST_PATH}. Run this from the Mentication project root.`);
  }

  fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  let created = 0;
  let skipped = 0;

  console.log(`Generating ${TEXTS.length} PMR narration clips directly with ElevenLabs...\n`);

  for (let i = 0; i < TEXTS.length; i++) {
    const text = TEXTS[i];
    const key = narrationKey(text);
    const audioPath = path.join(AUDIO_DIR, `${key}.mp3`);
    const publicPath = `/audio/narration/${key}.mp3`;

    const existing = manifest[key];
    const validExisting =
      existing?.text === text &&
      existing?.audio === publicPath &&
      Array.isArray(existing?.alignment) &&
      existing.alignment.length > 0 &&
      fs.existsSync(audioPath);

    if (validExisting) {
      console.log(`[${i + 1}/${TEXTS.length}] already exists — skipping`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${TEXTS.length}] generating: ${text}`);

    const result = await generate(text, apiKey);

    fs.writeFileSync(audioPath, result.audio);

    manifest[key] = {
      text,
      voice_id: VOICE_ID,
      audio: publicPath,
      alignment: result.alignment,
    };

    // Save after every successful clip so progress is never lost.
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    console.log(
      `    saved ${path.basename(audioPath)} (${result.alignment.length} aligned words)`
    );

    created++;
  }

  const checkManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const failures = [];

  for (const text of TEXTS) {
    const key = narrationKey(text);
    const entry = checkManifest[key];
    const audioPath = path.join(AUDIO_DIR, `${key}.mp3`);

    if (
      entry?.text !== text ||
      entry?.voice_id !== VOICE_ID ||
      entry?.audio !== `/audio/narration/${key}.mp3` ||
      !Array.isArray(entry?.alignment) ||
      entry.alignment.length === 0 ||
      !fs.existsSync(audioPath)
    ) {
      failures.push(text);
    }
  }

  if (failures.length) {
    throw new Error(`Verification failed for ${failures.length} line(s).`);
  }

  console.log("\n✅ PMR narration complete");
  console.log(`Created: ${created}`);
  console.log(`Already present: ${skipped}`);
  console.log(`Verified: ${TEXTS.length}/${TEXTS.length}`);
  console.log("Remote application backend used: NO");
}

main().catch((error) => {
  console.error("\n❌ PMR narration generation failed");
  console.error(error?.message || error);
  process.exit(1);
});
