import { writeVerified } from '../../src/lib/verifiedStorage.js';
import { SleepClock } from './playback.js';
export const NIGHT_SETUP_KEY = 'mentation.nightChannel.setup.v1';
const TTL = 24 * 60 * 60 * 1000;
export function readNightSetup(channelIds, storage = globalThis.sessionStorage, now = Date.now()) {
  try {
    const value = JSON.parse(storage?.getItem(NIGHT_SETUP_KEY) || 'null');
    if (!value || value.version !== 1 || value.expiresAt <= now || !Number.isFinite(value.expiresAt) || !channelIds.includes(value.channel) || ![15,30,45,60].includes(value.minutes) || !Number.isInteger(value.seconds) || value.seconds < 0 || value.seconds > value.minutes * 60 || !['local','spotify','apple'].includes(value.source) || !['preview','file','provider'].includes(value.kind)) return null;
    return {channel:value.channel,minutes:value.minutes,seconds:value.seconds,source:value.source,kind:value.kind,volume:typeof value.volume==='number' && value.volume>=0 && value.volume<=1?value.volume:.5,texture:typeof value.texture==='number' && value.texture>=0 && value.texture<=1?value.texture:.38,view:value.view===true,noteId:typeof value.noteId==='string'?value.noteId:null};
  } catch { return null; }
}
export function writeNightSetup(value, storage = globalThis.sessionStorage, now = Date.now()) {
  try {
    // Only selected controls travel across interruption: no file, URL, provider token or rating.
    const record = {version:1,expiresAt:now+TTL,channel:value.channel,minutes:value.minutes,seconds:value.seconds,source:value.source,kind:value.kind,volume:value.volume,texture:value.texture,view:value.view===true,noteId:value.noteId || null};
    writeVerified(storage,NIGHT_SETUP_KEY,JSON.stringify(record));return true;
  } catch { return false; }
}
export function clockForSetup(setup) {
  const clock = new SleepClock(setup?.minutes || 15);
  if (setup) clock.remainingMs = setup.seconds * 1000;
  return clock;
}
export function nightSetupNote({channelName,channelId,minutes,source,kind}) {
  if (!channelName || ![15,30,45,60].includes(minutes)) return '';
  const choice = source==='spotify'?'Spotify':source==='apple'?'Apple Music':kind==='file'?'My attached audio file':`${channelName} · ${['podcast','documentary','audible'].includes(channelId)?'recording not added yet':'generated noise preview'}`;
  return `Listening choice I want to return to: ${choice}. Stop point: ${minutes} minutes. ${kind==='file'?'Attach the file again after leaving; it is not kept. ':source!=='local'?'Open the provider settings to authorize and choose a song. ':''}I can stop or choose quiet rest. This is a setup to try again, not a sleep result.`;
}
