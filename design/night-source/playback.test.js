import { describe, it, expect, vi, afterEach } from 'vitest';
import { SleepClock, LocalAudio, settlePlaybackAction } from './playback.js';
import { SpotifyAdapter, AppleAdapter, spotifyUri } from './providers.js';
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
describe('Night sleep timer', () => {
  it('freezes pause/STOP position, resumes remainder, and catches background wall time', () => {
    let now = 0;
    const clock = new SleepClock(15, () => now);
    clock.start();
    now = 73000;
    clock.pause();
    expect(clock.seconds).toBe(827);
    now += 120000;
    expect(clock.seconds).toBe(827);
    clock.start();
    now += 2000;
    expect(clock.seconds).toBe(825);
    now += 900000;
    expect(clock.seconds).toBe(0);
  });
  it('only an explicit new timer selection resets duration', () => {
    let now = 0;
    const clock = new SleepClock(15, () => now);
    clock.start();
    now = 60000;
    clock.pause();
    clock.start();
    expect(clock.seconds).toBe(840);
    clock.set(30);
    expect(clock.seconds).toBe(1800);
  });
});
describe('real provider transports', () => {
  it('does not claim configuration or authorization by default', async () => {
    const report = vi.fn(),
      spotify = new SpotifyAdapter({}, report),
      apple = new AppleAdapter({}, report);
    expect(spotify.configured).toBe(false);
    expect(apple.configured).toBe(false);
    await expect(spotify.authorize()).rejects.toThrow('public client ID');
    await expect(apple.authorize()).rejects.toThrow('developer-token');
    expect(report).not.toHaveBeenCalled();
  });
  it('keeps missing configuration truthful when returning from a local source',async()=>{
    for(const Adapter of [SpotifyAdapter,AppleAdapter]) {
      const report=vi.fn(),adapter=new Adapter({},report);await adapter.disconnect();expect(report).toHaveBeenLastCalledWith('config_missing');
      const configured=new Adapter({clientId:'public',redirectUri:'http://127.0.0.1/night-channel/spotify-callback.html',tokenEndpoint:'/token'},report);await configured.disconnect();expect(report).toHaveBeenLastCalledWith('unauthorized');
    }
  });
  it('validates Spotify track links and rejects fake titles or other hosts', () => {
    expect(spotifyUri('https://open.spotify.com/track/1234567890123456789012?si=x')).toBe('spotify:track:1234567890123456789012');
    expect(() => spotifyUri('Sleepy Songs')).toThrow();
    expect(() => spotifyUri('https://evil.example/track/1234567890123456789012')).toThrow();
  });
  it('sends real device-targeted Spotify playback and waits for SDK evidence', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204
    });
    vi.stubGlobal('fetch', fetch);
    const report = vi.fn(),
      s = new SpotifyAdapter({}, report);
    s.token = {
      access_token: 'test-only',
      expires: Date.now() + 100000
    };
    s.device = 'test-device';
    s.player = {
      activateElement: vi.fn(),
      getCurrentState: vi.fn().mockResolvedValue({
        paused: false,
        track_window: {
          current_track: {
            name: 'Test track', uri: 'spotify:track:1234567890123456789012'
          }
        }
      })
    };
    await s.play('spotify:track:1234567890123456789012');
    expect(fetch.mock.calls[0][0]).toContain('device_id=test-device');
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      uris: ['spotify:track:1234567890123456789012']
    });
    expect(report).toHaveBeenCalledWith('playing', '', 'Test track');
  });
  it('does not report Spotify playing after a rejected API request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403
    }));
    const report = vi.fn(),
      s = new SpotifyAdapter({}, report);
    s.token = {
      access_token: 'test-only',
      expires: Date.now() + 100000
    };
    s.device = 'test-device';
    s.player = {
      activateElement: vi.fn()
    };
    await expect(s.play('spotify:track:1234567890123456789012')).rejects.toThrow('subscription');
    expect(report).not.toHaveBeenCalled();
  });
  it('uses MusicKit queue and confirms playing instead of a connected flag', async () => {
    vi.stubGlobal('window', {
      MusicKit: {
        PlaybackStates: {
          playing: 2
        }
      }
    });
    const report = vi.fn(),
      a = new AppleAdapter({}, report);
    a.music = {
      isAuthorized: true,
      setQueue: vi.fn(),
      play: vi.fn(),
      playbackState: 1
    };
    await expect(a.play('https://music.apple.com/us/song/test/123')).rejects.toThrow('not confirmed');
    expect(report).not.toHaveBeenCalled();
    a.music.playbackState = 2;
    await a.play('https://music.apple.com/us/song/test/123');
    expect(a.music.setQueue).toHaveBeenCalledWith({
      song: '123'
    });
    expect(report).toHaveBeenCalledWith('playing', '', undefined);
  });
});
describe('local file readiness', () => {
  it('never substitutes noise for a missing narration or audiobook', async () => {
    const audio = new LocalAudio(vi.fn());
    for (const id of ['podcast', 'documentary', 'audible']) await expect(audio.play({
      id
    })).rejects.toThrow('Recording not added');
  });
  it('keeps file position when paused and resumes the same element', async () => {
    class Audio {
      constructor() {
        this.currentTime = 37;
        this.play = vi.fn().mockResolvedValue();
        this.pause = vi.fn();
      }
    }
    vi.stubGlobal('Audio', Audio);
    const local = new LocalAudio(vi.fn());
    await local.play({
      id: 'podcast'
    }, 'blob:test');
    const element = local.audio;
    await local.pause();
    await local.resume();
    expect(local.audio).toBe(element);
    expect(element.currentTime).toBe(37);
    expect(element.loop).toBe(false);
    expect(element.play).toHaveBeenCalledTimes(2);
  });
});

describe('provider playback evidence', () => {
  it('rejects an unrelated Spotify track even when the SDK is playing', async () => {
    vi.useFakeTimers();const report=vi.fn(),s=new SpotifyAdapter({},report);
    s.requestedUri='spotify:track:1234567890123456789012';
    s.player={getCurrentState:vi.fn().mockResolvedValue({paused:false,track_window:{current_track:{uri:'spotify:track:9999999999999999999999'}}})};
    const result=expect(s.confirmPlaying()).rejects.toThrow('not confirmed');
    await vi.runAllTimersAsync();await result;expect(report).not.toHaveBeenCalled();
  });
  it('allows the first selection on an idle newly connected Spotify device', async () => {
    const s=new SpotifyAdapter({},vi.fn());s.device='test-device';
    s.player={pause:vi.fn(),getCurrentState:vi.fn().mockResolvedValue(null)};
    await s.pause();expect(s.player.pause).not.toHaveBeenCalled();
  });
  it('requires observed Spotify pause before a caller may switch sources', async () => {
    const s=new SpotifyAdapter({},vi.fn());s.device='test-device';s.requestedUri='spotify:track:1234567890123456789012';s.playbackMayBeActive=true;
    s.player={pause:vi.fn(),getCurrentState:vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({paused:true})};
    await s.pause();expect(s.player.pause).toHaveBeenCalledOnce();expect(s.player.getCurrentState).toHaveBeenCalledTimes(2);
  });
  it.each([null,{paused:false}])('rejects unconfirmed Spotify pause (%j)', async state => {
    vi.useFakeTimers();const s=new SpotifyAdapter({},vi.fn());s.device='test-device';s.requestedUri='spotify:track:1234567890123456789012';s.playbackMayBeActive=true;
    s.player={pause:vi.fn(),getCurrentState:vi.fn().mockResolvedValue(state)};
    const result=expect(s.pause()).rejects.toThrow('not confirmed pause');await vi.runAllTimersAsync();await result;
  });
  it('requires observed Apple pause instead of a fulfilled pause command', async () => {
    vi.useFakeTimers();vi.stubGlobal('window',{MusicKit:{PlaybackStates:{playing:2,paused:3,stopped:4,ended:5,none:0}}});
    const a=new AppleAdapter({},vi.fn());a.music={playbackState:2,pause:vi.fn()};
    const result=expect(a.pause()).rejects.toThrow('not confirmed pause');await vi.runAllTimersAsync();await result;
    a.music.pause.mockImplementation(()=>{a.music.playbackState=3;});await a.pause();
  });
});

describe('Spotify recovery after a rejected first play', () => {
  const uri='spotify:track:1234567890123456789012';
  const idle=()=>{
    const s=new SpotifyAdapter({},vi.fn());s.device='test-device';s.token={access_token:'test-only',expires:Date.now()+100000};
    s.player={activateElement:vi.fn(),pause:vi.fn(),disconnect:vi.fn(),getCurrentState:vi.fn().mockResolvedValue(null)};
    return s;
  };
  it('allows switching and disconnect after a definitive first-play 403', async()=>{
    vi.useFakeTimers();const s=idle();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403}));
    await expect(s.play(uri)).rejects.toThrow('subscription');
    const paused=expect(s.pause()).resolves.toBeUndefined();await vi.runAllTimersAsync();await paused;
    expect(s.player.pause).not.toHaveBeenCalled();const player=s.player;await s.disconnect();expect(player.disconnect).toHaveBeenCalledOnce();
  });
  it.each(['activation','token'])('allows recovery when %s fails before sending a playback command',async failure=>{
    const s=idle();const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
    if(failure==='activation')s.player.activateElement.mockRejectedValue(Error('gesture denied'));else s.accessToken=vi.fn().mockRejectedValue(Error('authorization expired'));
    await expect(s.play(uri)).rejects.toThrow();await s.pause();expect(fetch).not.toHaveBeenCalled();expect(s.playbackMayBeActive).toBe(false);await s.disconnect();
  });
  it('can retry the same selection successfully after a 403',async()=>{
    const s=idle();vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:false,status:403}).mockResolvedValueOnce({ok:true,status:204}));
    await expect(s.play(uri)).rejects.toThrow();await s.pause();
    s.player.getCurrentState.mockResolvedValue({paused:false,track_window:{current_track:{uri,name:'Requested'}}});
    await s.play(uri);expect(s.requestedUri).toBe(uri);expect(s.playbackMayBeActive).toBe(true);
    s.player.getCurrentState.mockResolvedValue({paused:true});await s.pause();expect(s.playbackMayBeActive).toBe(false);
  });
  it.each(['transport',408,500])('keeps ambiguous %s failures blocked until actual pause evidence',async failure=>{
    vi.useFakeTimers();const s=idle();const fetch=vi.fn();
    if(failure==='transport')fetch.mockRejectedValue(Error('connection lost'));else fetch.mockResolvedValue({ok:false,status:failure});vi.stubGlobal('fetch',fetch);
    await expect(s.play(uri)).rejects.toThrow();expect(s.playbackMayBeActive).toBe(true);
    const paused=expect(s.pause()).rejects.toThrow('not confirmed pause');await vi.runAllTimersAsync();await paused;
    s.player.getCurrentState.mockResolvedValue({paused:true});await s.pause();expect(s.playbackMayBeActive).toBe(false);
  });
  it('does not erase earlier potentially active playback when a later request gets 403',async()=>{
    vi.useFakeTimers();const s=idle();s.playbackMayBeActive=true;s.requestedUri=uri;
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,status:403}));await expect(s.play(uri)).rejects.toThrow();
    const paused=expect(s.pause()).rejects.toThrow('not confirmed pause');await vi.runAllTimersAsync();await paused;expect(s.playbackMayBeActive).toBe(true);
  });
  it('retains SDK activity observed while a rejected request was in flight',async()=>{
    const s=idle();vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>{s.playbackEvidenceVersion+=1;return {ok:false,status:403};}));
    await expect(s.play(uri)).rejects.toThrow();expect(s.playbackMayBeActive).toBe(true);
  });

  it('does not allow switching while a playback request remains in flight',async()=>{
    const s=idle();let settle;vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{settle=resolve;})));
    const attempt=expect(s.play(uri)).rejects.toThrow('subscription');
    await vi.waitFor(()=>expect(settle).toBeTypeOf('function'));
    let silenced=false;const stopping=s.pause().then(()=>{silenced=true;});expect(s.player.pause).toHaveBeenCalledOnce();
    await Promise.resolve();expect(silenced).toBe(false);
    settle({ok:false,status:403});await attempt;await stopping;await s.disconnect();expect(s.pendingPlayCommands).toBe(0);
  });
  it('cancels a pre-request token wait even after disconnect resets the player',async()=>{
    const s=idle();let tokenReady;s.accessToken=()=>new Promise(resolve=>{tokenReady=resolve;});const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
    const attempt=expect(s.play(uri)).rejects.toThrow('cancelled');await vi.waitFor(()=>expect(tokenReady).toBeTypeOf('function'));
    await s.disconnect();tokenReady('test-only');await attempt;expect(fetch).not.toHaveBeenCalled();
  });
  it('still attempts STOP if an active SDK loses its device identifier',async()=>{
    const s=idle();s.device=null;s.playbackMayBeActive=true;s.player.getCurrentState.mockResolvedValue({paused:true});
    await s.pause();expect(s.player.pause).toHaveBeenCalledOnce();expect(s.playbackMayBeActive).toBe(false);
  });
  it('keeps accepted but unconfirmed playback blocked after a 204',async()=>{
    vi.useFakeTimers();const s=idle();vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:204}));
    const attempt=expect(s.play(uri)).rejects.toThrow('not confirmed playback');await vi.runAllTimersAsync();await attempt;
    const paused=expect(s.pause()).rejects.toThrow('not confirmed pause');await vi.runAllTimersAsync();await paused;
    expect(s.playbackMayBeActive).toBe(true);expect(s.pendingPlayCommands).toBe(0);
  });

  it.each(['requested','unrelated'])('STOP pauses immediately during %s-track confirmation and suppresses late playing',async track=>{
    vi.useFakeTimers();const s=idle();let observed=false;
    s.player.getCurrentState.mockImplementation(async()=>{observed=true;return {paused:false,track_window:{current_track:{uri:track==='requested'?uri:'spotify:track:9999999999999999999999'}}};});
    // Hold the first state response so STOP arrives inside confirmPlaying.
    let stateReply;s.player.getCurrentState.mockImplementationOnce(()=>new Promise(resolve=>{observed=true;stateReply=resolve;}));
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,status:204}));
    const attempt=expect(s.play(uri)).rejects.toThrow('cancelled');await vi.advanceTimersByTimeAsync(0);expect(observed).toBe(true);
    s.player.pause.mockImplementation(async()=>{s.player.getCurrentState.mockResolvedValue({paused:true});});
    const stopping=s.pause();expect(s.player.pause).toHaveBeenCalledOnce();
    stateReply({paused:false,track_window:{current_track:{uri:track==='requested'?uri:'spotify:track:9999999999999999999999'}}});await vi.runAllTimersAsync();await attempt;await stopping;
    expect(s.player.pause.mock.calls.length).toBeGreaterThanOrEqual(2);expect(s.playbackMayBeActive).toBe(false);expect(s.report).not.toHaveBeenCalledWith('playing',expect.anything(),expect.anything());
  });
  it('re-pauses after a delayed HTTP acceptance so a late play cannot escape STOP',async()=>{
    vi.useFakeTimers();const s=idle();let accept,playing=false;
    vi.stubGlobal('fetch',vi.fn(()=>new Promise(resolve=>{accept=()=>{playing=true;resolve({ok:true,status:204});};})));
    s.player.pause.mockImplementation(async()=>{playing=false;});s.player.getCurrentState.mockImplementation(async()=>({paused:!playing}));
    const attempt=expect(s.play(uri)).rejects.toThrow('cancelled');await vi.advanceTimersByTimeAsync(0);
    let complete=false;const stopping=s.pause().then(()=>{complete=true;});expect(s.player.pause).toHaveBeenCalledOnce();await vi.advanceTimersByTimeAsync(500);expect(complete).toBe(false);
    accept();await vi.runAllTimersAsync();await attempt;await stopping;expect(playing).toBe(false);expect(s.player.pause.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

});

describe('Night pending STOP settlement',()=>{
  it.each([false,true])('cleans up pending STOP after action rejection=%s',async rejected=>{
    const silenceAll=vi.fn();const action=vi.fn(async()=>{if(rejected)throw Error('confirmation rejected');});
    await expect(settlePlaybackAction(action,{isStopped:()=>true,silenceAll})).resolves.toBe(false);expect(silenceAll).toHaveBeenCalledOnce();
  });
  it('does not acknowledge STOP or permit switching when post-rejection cleanup fails',async()=>{
    await expect(settlePlaybackAction(async()=>{throw Error('playback failed');},{isStopped:()=>true,silenceAll:async()=>{throw Error('pause unconfirmed');}})).rejects.toThrow('pause unconfirmed');
  });
  it('preserves normal errors when no STOP was requested',async()=>{
    const silenceAll=vi.fn();await expect(settlePlaybackAction(async()=>{throw Error('playback failed');},{isStopped:()=>false,silenceAll})).rejects.toThrow('playback failed');expect(silenceAll).not.toHaveBeenCalled();
  });
});

describe('Night actions after completed STOP',()=>{
  it.each(['Back','Forward','source change'])('returns confirmed success for %s without clearing STOP',async()=>{
    let stopped=true;const action=vi.fn();const silenceAll=vi.fn();
    await expect(settlePlaybackAction(action,{isStopped:()=>stopped,silenceAll,mayPlay:false})).resolves.toBe(true);
    expect(stopped).toBe(true);expect(action).toHaveBeenCalledOnce();expect(silenceAll).toHaveBeenCalledOnce();
  });
  it('preserves a failed navigation pause even if secondary cleanup succeeds',async()=>{
    await expect(settlePlaybackAction(async()=>{throw Error('pause unconfirmed');},{isStopped:()=>true,silenceAll:vi.fn(),mayPlay:false})).rejects.toThrow('pause unconfirmed');
  });
  it('still rejects navigation when silence cannot be confirmed after STOP',async()=>{
    await expect(settlePlaybackAction(vi.fn(),{isStopped:()=>true,silenceAll:async()=>{throw Error('still playing');},mayPlay:false})).rejects.toThrow('still playing');
  });
  it('keeps stale playback cancelled while confirmed pause succeeds under the same STOP flag',async()=>{
    const state={isStopped:()=>true,silenceAll:vi.fn()};
    await expect(settlePlaybackAction(vi.fn(),{...state,mayPlay:true})).resolves.toBe(false);
    await expect(settlePlaybackAction(vi.fn(),{...state,mayPlay:false})).resolves.toBe(true);
  });
});
