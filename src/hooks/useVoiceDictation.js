import { useCallback, useEffect, useRef, useState } from "react";

const getRecognitionCtor = () => (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

// Hold-to-talk dictation built on the Web Speech API. Purely a progressive
// enhancement: when unsupported, `supported` is false and callers should
// keep their existing text-entry UI unchanged.
export function useVoiceDictation({ onResult } = {}) {
  const Ctor = useRef(getRecognitionCtor()).current;
  const supported = !!Ctor;
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* already stopped */ } }, []);

  const start = useCallback(() => {
    if (!supported || listening) return;
    const recognition = new Ctor();
    recognition.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
      if (transcript) onResult?.(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); } catch { setListening(false); }
  }, [Ctor, supported, listening, onResult]);

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch { /* already stopped */ }
  }, []);

  return { supported, listening, start, stop };
}
