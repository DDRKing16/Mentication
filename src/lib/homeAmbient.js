let audio = null;
let resumeArmed = false;
let muted = false;

const MUSIC_URL = "/audio/home-ambient.mp3";
const MUSIC_VOLUME = 0.35;

function ensureAudio() {
  if (typeof window === "undefined") return null;
  if (!audio) {
    audio = new Audio(MUSIC_URL);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = MUSIC_VOLUME;
    audio.muted = muted;
  }
  return audio;
}

function armResume() {
  if (resumeArmed || typeof document === "undefined") return;
  resumeArmed = true;
  const retry = () => {
    resumeArmed = false;
    const current = ensureAudio();
    if (current?.paused) current.play().catch(() => {});
    document.removeEventListener("pointerdown", retry, true);
    document.removeEventListener("keydown", retry, true);
  };
  document.addEventListener("pointerdown", retry, true);
  document.addEventListener("keydown", retry, true);
}

export function handoffHomeAmbient({ currentTime = 0, volume = MUSIC_VOLUME } = {}) {
  const current = ensureAudio();
  if (!current) return;
  if (Number.isFinite(currentTime) && currentTime >= 0) {
    try { current.currentTime = currentTime; } catch { /* metadata may not be ready yet */ }
  }
  current.volume = Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : MUSIC_VOLUME;
  current.muted = muted;
  if (!muted) current.play().catch(() => armResume());
}

export function resumeHomeAmbient() {
  const current = ensureAudio();
  if (!current || muted || !current.paused) return;
  current.muted = false;
  current.play().catch(() => armResume());
}

export function setHomeAmbientMuted(nextMuted) {
  muted = Boolean(nextMuted);
  const current = ensureAudio();
  if (current) {
    current.muted = muted;
    if (muted) current.pause();
    else if (current.paused) current.play().catch(() => armResume());
  }
  return muted;
}

export function isHomeAmbientMuted() {
  return muted;
}

export function pauseHomeAmbient() {
  if (!audio) return;
  try { audio.pause(); } catch { /* no-op */ }
}

export function stopHomeAmbient() {
  if (!audio) return;
  try { audio.pause(); } catch { /* no-op */ }
}
