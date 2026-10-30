// Read-only asset handoff: no provider calls, credentials or generated audio.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { URGE_SURF_NARRATION } from '../src/lib/urgeSurfNarration.js';
const root = new URL('../', import.meta.url);
const read = path => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const contract = read('design/tapping/narration/requests.json');
const entries = Object.values(read('narration-manifest.json'));
const normalize = text => text.trim().replace(/\s+/g, ' ');
function inspect({ keys, text }) {
  const entry = entries.find(item => normalize(item.text) === normalize(text) && item.voice_id === contract.preset.voice_id);
  const localPath = entry?.audio?.match(/^\/audio\/narration\/[a-zA-Z0-9_-]+\.mp3$/) ? fileURLToPath(new URL('public' + entry.audio, root)) : null;
  let duration = null;
  if (localPath && existsSync(localPath)) {
    const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', localPath], { encoding: 'utf8' });
    if (probe.status === 0) duration = Number(JSON.parse(probe.stdout).format?.duration) || null;
  }
  const words = entry?.alignment;
  const aligned = Boolean(duration && words?.length && normalize(words.map(word => word.word).join(' ')) === normalize(text) && words.every((word, index) => Number.isFinite(word.start) && Number.isFinite(word.end) && word.start >= 0 && word.end >= word.start && word.end <= duration + 0.05 && (!index || word.start >= words[index - 1].end)));
  const ready = Boolean(entry?.v3 && duration && aligned);
  return { keys, text, status: ready ? 'existing_asset_verified' : 'missing_or_unverified', audio: entry?.audio || null, duration, aligned, approvedV3: entry?.v3 === true, requestText: ready ? null : contract.preset.delivery_cue + text, requestCharacters: ready ? 0 : (contract.preset.delivery_cue + text).length };
}
const tapping = contract.recordings.map(inspect);
const urge = Object.entries(URGE_SURF_NARRATION).flatMap(([key, value]) => Array.isArray(value) ? value.map((text, index) => ({ keys: [`stages.${index}`], text })) : [{ keys: [key], text: value }]).map(inspect);
const summary = items => ({ uniqueRecordings: items.length, verified: items.filter(item => item.status === 'existing_asset_verified').length, missing: items.filter(item => item.status !== 'existing_asset_verified').length, missingRequestCharacters: items.reduce((total, item) => total + item.requestCharacters, 0), recordings: items });
const config = read('public/night-channel/provider-config.json');
const report = {
  status: tapping.concat(urge).every(item => item.status === 'existing_asset_verified') ? 'recordings_ready_for_audition' : 'recordings_incomplete',
  preset: contract.preset,
  generation: 'Not performed. Provider allowance/cost unverified; requires authorized access and specific approval before paid usage. Preserve the known preset; document provider defaults for unspecified options.',
  tapping: summary(tapping), urgeSurfing: summary(urge),
  nightChannel: {
    spotifyPublicClientIdConfigured: Boolean(config.spotify?.clientId), spotifyRedirectConfigured: Boolean(config.spotify?.redirectUri), appleTokenEndpointConfigured: Boolean(config.apple?.tokenEndpoint),
    recordings: 'No intended channel recordings supplied. Six labelled generated-noise previews; podcast, documentary and audiobook slots require user files. No substitutes installed.',
    providerPlayback: 'Not verified live. Requires owner-approved provider configuration, eligible listener account and explicit user connection. No new service or credentials created.',
  },
};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && report.status !== 'recordings_ready_for_audition') process.exitCode = 1;
