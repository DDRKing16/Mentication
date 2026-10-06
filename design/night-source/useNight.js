import { useEffect, useRef, useState } from 'react';
import { SpotifyAdapter, AppleAdapter } from './providers.js';
import { LocalAudio } from './playback.js';
import { readNightSetup, writeNightSetup, clockForSetup } from './setup.js';
import { loadRecords } from '../../src/lib/tomorrowParking/storage.js';
export function useNight(channels) {
  const [restored] = useState(()=>readNightSetup(channels.map(channel=>channel.id)));
  const [channel, setChannel] = useState(restored?.channel || channels[0].id),
    [view, setView] = useState(restored?.view || false);
  const [status, setStatus] = useState(restored?'paused':'idle'),
    [message, setMessage] = useState(restored?'Your setup is back. Nothing is playing; choose Play when ready.':'Choose a channel. No recordings have been added yet.');
  const [minutes, setMinutes] = useState(restored?.minutes || 15),
    [seconds, setSeconds] = useState(restored?.seconds ?? 900),
    [volume, setVolume] = useState(restored?.volume ?? 0.5),
    [texture, setTexture] = useState(restored?.texture ?? 0.38);
  const [needsFile,setNeedsFile] = useState(restored?.kind==='file');
  const [noteId,setNoteId] = useState(restored?.noteId || null);
  const [setupOk,setSetupOk] = useState(true);
  const [files, setFiles] = useState({}),
    [panel, setPanel] = useState(null),
    [providerStates, setProviderStates] = useState({
      spotify: 'config_missing',
      apple: 'config_missing'
    });
  const [hasStarted, setHasStarted] = useState(false);
  const [source, setSource] = useState(restored?.source || 'local'),
    [title, setTitle] = useState(null),
    [worries, setWorries] = useState(false),
    [busy, setBusy] = useState(false);
  const clock = useRef(null);
  if (!clock.current) clock.current = clockForSetup(restored);
  const engines = useRef({});
  const active = useRef(restored?.source || 'local');
  const currentStatus = useRef(restored?'paused':'idle');
  const lock = useRef(false);
  const stopped = useRef(false);
  const providerSelection = useRef(null);
  const selected = useRef(null);
  const fileRefs = useRef({});
  const mounted = useRef(true);
  const persistSetup = useRef(()=>true);
  useEffect(()=>{
    persistSetup.current=()=>writeNightSetup({channel,minutes,seconds:clock.current.seconds,volume,texture,source,kind:source!=='local'?'provider':needsFile || fileRefs.current[channel]?'file':'preview',view,noteId});
    setSetupOk(persistSetup.current());
  },[channel,minutes,seconds,volume,texture,source,view,noteId,needsFile]);
  function update(next, detail = '', track) {
    if (!mounted.current) return;
    if (stopped.current && ['playing', 'loading', 'paused'].includes(next)) return;
    currentStatus.current = next;
    setStatus(next);
    setMessage(detail);
    if (next === 'playing') {
      clock.current.start();
      setHasStarted(true);
    } else clock.current.pause();
    setSeconds(clock.current.seconds);
    if (track) setTitle(track);
  }
  if (!engines.current.local) engines.current.local = new LocalAudio((...args) => {
    if (active.current === 'local') update(...args);
  });
  async function run(action) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    try {
      await action();
      if (stopped.current) await silenceAll();
      return true;
    } catch (error) {
      update('error', error.message || 'Playback failed. Please retry.');
      return false;
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  async function silenceAll() {
    // If a provider cannot acknowledge pause, do not start another source.
    for (const engine of Object.values(engines.current)) await engine.pause();
  }
  const pause = () => run(async () => {
    await engines.current[active.current]?.pause();
    update('paused');
  });
  const stop = async () => {
    stopped.current = true;
    clock.current.pause();
    try {
      await silenceAll();
      update('stopped', 'Stopped. Position and remaining time are kept.');
      return true;
    } catch (error) {
      update('error', 'Stop could not be confirmed. Use the provider’s controls. ' + error.message);
      return false;
    }
  };
  const play = id => run(async () => {
    const next = id || channel,
      file = fileRefs.current[next];
    const same = !id && selected.current === next && active.current === 'local';
    const resumeProvider = !id && active.current !== 'local';
    stopped.current = false;
    setView(true);
    update('loading', 'Preparing audio…');
    if (clock.current.seconds === 0) {
      clock.current.set(minutes);
      setSeconds(clock.current.seconds);
    }
    await silenceAll();
    if (stopped.current) return;
    if (resumeProvider) {
      const engine = engines.current[active.current];
      if (selected.current) await engine.resume();else if (providerSelection.current?.kind === active.current) {
        await engine.play(providerSelection.current.link);
        selected.current = active.current;
      } else throw new Error('Open provider settings and choose a song first.');
      update('playing');
      return;
    }
    if (needsFile && !file) throw new Error('Your file was not kept after leaving. Attach it again, or explicitly choose a different channel. No substitute audio has started.');
    if (same) {
      await engines.current.spotify?.disconnect();
      await engines.current.local.resume();
      update('playing');
      return;
    }
    await engines.current.spotify?.disconnect();
    active.current = 'local';
    setSource('local');
    setTitle(null);
    setChannel(next);
    selected.current = null;
    await engines.current.local.play(channels.find(c => c.id === next), file);
    selected.current = next;
    update('playing');
  });
  const changeTimer = value => {
    setMinutes(value);
    clock.current.set(value);
    if (currentStatus.current === 'playing') clock.current.start();
    setSeconds(clock.current.seconds);
  };
  const attach = (id, file) => run(async () => {
    await silenceAll();
    await engines.current.local.dispose();
    if (fileRefs.current[id]) URL.revokeObjectURL(fileRefs.current[id]);
    fileRefs.current[id] = URL.createObjectURL(file);
    setFiles({
      ...fileRefs.current
    });
    setChannel(id);
    setNeedsFile(false);
    selected.current = null;
    active.current = 'local';
    setSource('local');
    setTitle(file.name);
    setView(true);
    update('ready', 'Your file is ready to try. Tap Play; it stays in this tab and is not uploaded.');
  });
  const connect = kind => run(async () => {
    setPanel(kind);
    const engine = engines.current[kind];
    if (!engine?.configured) {
      setMessage(kind === 'spotify' ? 'Spotify configuration missing: public client ID and registered HTTPS redirect URL.' : 'Apple Music configuration missing: secure developer-token endpoint.');
      return;
    }
    await silenceAll();
    update('paused');
    setProviderStates(s => ({
      ...s,
      [kind]: 'loading'
    }));
    try {
      await engine.authorize();
    } catch (error) {
      setProviderStates(s => ({
        ...s,
        [kind]: 'error'
      }));
      throw error;
    }
  });
  const playProvider = (kind, link) => run(async () => {
    await silenceAll();
    await engines.current.local.dispose();
    stopped.current = false;
    active.current = kind;
    setSource(kind);
    setTitle(null);
    setView(true);
    update('loading', 'Waiting for provider playback confirmation…');
    selected.current = null;
    providerSelection.current = {
      kind,
      link
    };
    if (clock.current.seconds === 0) clock.current.set(minutes);
    if (kind !== 'spotify') await engines.current.spotify?.disconnect();
    await engines.current[kind].play(link);
    selected.current = kind;
    update('playing');
    setPanel(null);
  });
  const disconnect = kind => run(async () => {
    await engines.current[kind]?.disconnect();
    if (active.current === kind) {
      selected.current = null;
      update('stopped');
    }
  });
  useEffect(() => {
    mounted.current = true;
    try {
      setWorries(loadRecords().length > 0);
    } catch {
      setWorries(false);
    }
    let cancelled = false;
    fetch('./provider-config.json', {
      cache: 'no-store'
    }).then(r => {
      if (!r.ok) throw new Error('Provider configuration could not be loaded. Reload to retry.');
      return r.json();
    }).then(config => {
      if (cancelled) return;
      for (const [kind, Adapter] of [['spotify', SpotifyAdapter], ['apple', AppleAdapter]]) {
        engines.current[kind] = new Adapter(config[kind] || {}, (state, detail, track) => {
          setProviderStates(s => ({
            ...s,
            [kind]: state
          }));
          if (active.current === kind) update(state, detail, track);else if (detail) setMessage(detail);
        });
        setProviderStates(s => ({
          ...s,
          [kind]: engines.current[kind].configured ? 'unauthorized' : 'config_missing'
        }));
      }
    }).catch(e => setMessage(e.message));
    const tick = () => {
      const remaining = clock.current.seconds;
      setSeconds(remaining);
      if (remaining === 0 && currentStatus.current === 'playing' && !lock.current) stop();
    };
    const interval = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    const pagehide = () => {
      stopped.current = true;
      clock.current.pause();
      persistSetup.current();
      Object.values(engines.current).forEach(e => e.pause().catch(() => {}));
    };
    window.addEventListener('pagehide', pagehide);
    const pageshow=event=>{if(event.persisted){stopped.current=false;pause();}};
    window.addEventListener('pageshow',pageshow);
    return () => {
      cancelled = true;
      mounted.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('pageshow',pageshow);
      engines.current.local.dispose();
      engines.current.spotify?.player?.disconnect();
      engines.current.apple?.pause().catch(() => {});
      Object.values(fileRefs.current).forEach(url => URL.revokeObjectURL(url));
    };
  }, []);
  useEffect(() => {
    const fade = source === 'local' ? Math.min(1, seconds / 60) : 1;
    engines.current.local.setVolume(volume * fade);
    engines.current.local.setTexture(texture);
  }, [seconds, volume, texture, source]);
  const select = id => run(async () => {
    await silenceAll();
    await engines.current.spotify?.disconnect();
    active.current = 'local';
    setSource('local');
    setChannel(id);
    setNeedsFile(false);
    selected.current = null;
    setView(false);
    update('ready', 'Channel selected. Tap Tune In when ready.');
  });
  return {
    needsFile,
    noteId,
    setNoteId,
    setupOk,
    select,
    hasStarted,
    channel,
    view,
    status,
    message,
    minutes,
    seconds,
    volume,
    texture,
    files,
    panel,
    providerStates,
    source,
    title,
    worries,
    busy,
    play,
    pause,
    stop,
    changeTimer,
    attach,
    connect,
    playProvider,
    disconnect,
    setVolume,
    setTexture,
    setPanel,
    setView
  };
}
