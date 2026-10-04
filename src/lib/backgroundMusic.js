// @ts-check
// Host-side continuation of the home document's ambient music. The home frame
// owns the track while the visitor is on Home; when an intervention entry
// opens the frame is torn down, so Home.jsx pauses the frame's audio and hands
// the position over here to keep the track continuous. ResetFlow stops it the
// moment the actual practice begins — the mood questions are setup, not the
// intervention.
const audio = new Audio(`${import.meta.env.BASE_URL}audio/home-ambient.mp3`);
audio.loop = true;
audio.volume = 0.35;
// Attached to the document (renderless, no controls) so playback state stays
// observable in devtools and end-to-end checks.
document.head.appendChild(audio);

export const backgroundMusic = {
  /** Continue the frame's track from where it paused. */
  async handoff(from = 0) {
    try {
      if (Math.abs(audio.currentTime - from) > 0.25) audio.currentTime = from;
      await audio.play();
    } catch { /* a user gesture always precedes this call; nothing to recover */ }
  },
  stop() {
    audio.pause();
    audio.currentTime = 0;
  },
};
