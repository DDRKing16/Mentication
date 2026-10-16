// Offline release check. Never generates speech or uses provider credentials.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const requests = read('design/tapping/narration/requests.json');
const manifest = read('narration-manifest.json');
const cues = read('src/components/tapping/tappingAudioManifest.json');
const normalize = text => text.trim().replace(/\s+/g, ' ');
const entries = Object.values(manifest);
const recordings = requests.recordings.map(request => {
  const entry = entries.find(item => item.voice_id === requests.preset.voice_id && normalize(item.text) === normalize(request.text));
  const assetExists = Boolean(entry?.audio?.startsWith('/audio/narration/') && existsSync(fileURLToPath(new URL('public' + entry.audio, root))));
  const aligned = Boolean(entry?.alignment?.length && entry.alignment.at(-1).end > 0);
  const scriptMatches = request.keys.every(key => cues[key]?.caption === request.text);
  return { keys: request.keys, scriptMatches, approvedEntry: Boolean(entry), assetExists, aligned, ready: assetExists && aligned && scriptMatches };
});
const missing = recordings.filter(item => !item.ready);
console.log(JSON.stringify({ status: missing.length ? 'blocked' : 'ready_for_audition', preset: requests.preset, uniqueRecordings: recordings.length, cueKeys: recordings.flatMap(item => item.keys).length, missingRecordings: missing.length, recordings }, null, 2));
if (process.argv.includes('--strict') && missing.length) process.exitCode = 1;
