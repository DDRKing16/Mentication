import { getNarration } from './narrationService';

// Missing revised scripts must not leave the soundscape ducked indefinitely.
// Keep the existing voice player and rate; never substitute an older sentence.
export function startUrgeGuide(text, { enabled, preload, speak, stop, setActive, lookup = getNarration }) {
  const available = Boolean(enabled && lookup(text)?.url);
  setActive(available);
  if (!available) {
    stop();
    return stop;
  }
  preload(text);
  speak(text, { rate: 1, onEnd: () => setActive(false) });
  return stop;
}
