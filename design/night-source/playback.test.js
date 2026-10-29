import { describe, it, expect, vi, afterEach } from 'vitest';
import { SleepClock, LocalAudio } from './playback.js';
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
    const s=new SpotifyAdapter({},vi.fn());s.device='test-device';s.requestedUri='spotify:track:1234567890123456789012';
    s.player={pause:vi.fn(),getCurrentState:vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({paused:true})};
    await s.pause();expect(s.player.pause).toHaveBeenCalledOnce();expect(s.player.getCurrentState).toHaveBeenCalledTimes(2);
  });
  it.each([null,{paused:false}])('rejects unconfirmed Spotify pause (%j)', async state => {
    vi.useFakeTimers();const s=new SpotifyAdapter({},vi.fn());s.device='test-device';s.requestedUri='spotify:track:1234567890123456789012';
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
