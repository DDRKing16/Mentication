// Real provider transports. No client secrets, tokens in storage, or simulated success.
const timeout = (promise, ms = 20000) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('The service did not respond. Please retry.')), ms);
  Promise.resolve(promise).then(value => { clearTimeout(timer); resolve(value); }, error => { clearTimeout(timer); reject(error); });
});
async function checked(response) {
  if (!response.ok) throw new Error(response.status === 401 ? 'Authorization expired. Connect again.' : response.status === 403 ? 'Playback is unavailable for this account. Check subscription and app access.' : `Service request failed (${response.status}). Please retry.`);
  return response.status === 204 ? null : response.json();
}
const request = (url, options = {}) => timeout(fetch(url, {
  ...options,
  signal: AbortSignal.timeout(20000)
})).then(checked);
const scripts = new Map();
function loadScript(url, ready) {
  if (ready()) return Promise.resolve();
  if (scripts.has(url)) return scripts.get(url);
  const job = timeout(new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => ready() ? resolve() : reject(new Error('Playback SDK is unavailable.'));
    script.onerror = () => {
      script.remove();
      reject(new Error('Could not load the playback SDK. Please retry.'));
    };
    document.head.append(script);
  })).catch(error => {
    scripts.delete(url);
    throw error;
  });
  scripts.set(url, job);
  return job;
}
const random = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join('');
export function spotifyUri(value) {
  if (/^spotify:track:[A-Za-z0-9]{22}$/.test(value)) return value;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/track\/([A-Za-z0-9]{22})$/);
    if (url.hostname === 'open.spotify.com' && match) return `spotify:track:${match[1]}`;
  } catch {}
  throw new Error('Paste a Spotify track link or spotify:track URI.');
}
export class SpotifyAdapter {
  constructor(config, report) {
    this.config = config;
    this.report = report;
    this.player = null;
    this.device = null;
    this.token = null;
  }
  get configured() {
    return !!(this.config.clientId && this.config.redirectUri);
  }
  async authorize() {
    if (!this.configured) throw new Error('Spotify needs an owner-configured public client ID and registered redirect URL.');
    const redirect = new URL(this.config.redirectUri);
    if (redirect.origin !== location.origin || redirect.pathname !== '/night-channel/spotify-callback.html') throw new Error('Spotify redirect must be this site’s /night-channel/spotify-callback.html.');
    if (redirect.protocol !== 'https:' && redirect.hostname !== '127.0.0.1') throw new Error('Spotify requires HTTPS or an approved loopback redirect.');
    // Open synchronously within the explicit Connect gesture, before PKCE hashing.
    const popup = window.open('about:blank', 'night-spotify-auth', 'width=500,height=700');
    if (!popup) throw new Error('Allow the Spotify sign-in window, then retry.');
    const verifier = random(),
      state = random();
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
      const challenge = btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const code = await new Promise((resolve, reject) => {
        let timer, closed;
        const cleanup = () => {
          clearTimeout(timer);
          clearInterval(closed);
          window.removeEventListener('message', receive);
        };
        const receive = event => {
          if (event.origin !== location.origin || event.source !== popup || event.data?.type !== 'night-spotify-callback' || event.data.state !== state) return;
          cleanup();
          event.data.code ? resolve(event.data.code) : reject(new Error('Spotify authorization was declined.'));
        };
        window.addEventListener('message', receive);
        timer = setTimeout(() => {
          cleanup();
          reject(new Error('Sign-in timed out. Try Connect again.'));
        }, 180000);
        closed = setInterval(() => {
          if (popup.closed) {
            cleanup();
            reject(new Error('Sign-in window was closed.'));
          }
        }, 500);
        const params = new URLSearchParams({
          client_id: this.config.clientId,
          response_type: 'code',
          redirect_uri: redirect.href,
          state,
          code_challenge_method: 'S256',
          code_challenge: challenge,
          scope: 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state'
        });
        popup.location = `https://accounts.spotify.com/authorize?${params}`;
      });
      this.token = await this.exchange({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirect.href,
        code_verifier: verifier
      });
      await this.prepare();
    } finally {
      popup.close();
    }
  }
  async exchange(fields) {
    const token = await request('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        ...fields
      })
    });
    return {
      ...token,
      expires: Date.now() + token.expires_in * 1000
    };
  }
  async accessToken() {
    if (!this.token) throw new Error('Connect Spotify first.');
    if (this.token.expires < Date.now() + 60000) this.token = {
      ...this.token,
      ...(await this.exchange({
        grant_type: 'refresh_token',
        refresh_token: this.token.refresh_token
      }))
    };
    return this.token.access_token;
  }
  async prepare() {
    window.onSpotifyWebPlaybackSDKReady = () => {};
    await loadScript('https://sdk.scdn.co/spotify-player.js', () => !!window.Spotify);
    this.player?.disconnect();
    this.player = new window.Spotify.Player({
      name: 'Mentication Night Channel',
      volume: 0.5,
      enableMediaSession: true,
      getOAuthToken: cb => {
        this.accessToken().then(cb).catch(e => this.report('unauthorized', e.message));
      }
    });
    const player = this.player;
    const ready = new Promise((resolve, reject) => {
      player.addListener('ready', ({
        device_id
      }) => {
        this.device = device_id;
        this.report('ready');
        resolve();
      });
      player.addListener('not_ready', () => {
        this.device = null;
        this.report('error', 'Spotify player is offline. Connect again.');
      });
      for (const name of ['initialization_error', 'authentication_error', 'account_error', 'playback_error']) player.addListener(name, () => {
        const error = new Error(name === 'account_error' ? 'Spotify Premium and app access are required.' : 'Spotify playback failed. Connect again or retry.');
        this.report(name === 'authentication_error' ? 'unauthorized' : 'error', error.message);
        reject(error);
      });
      player.addListener('autoplay_failed', () => this.report('error', 'Playback needs another tap on Play.'));
      player.addListener('player_state_changed', state => {
        if (state) this.report(state.paused ? 'paused' : 'playing', '', state.track_window?.current_track?.name);
      });
    });
    if (!(await player.connect())) throw new Error('Spotify could not connect.');
    await timeout(ready);
  }
  async play(value) {
    if (!this.device) throw new Error('Connect Spotify before playing.');
    const uri = spotifyUri(value);
    await this.player.activateElement();
    const token = await this.accessToken();
    await request(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(this.device)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: [uri]
      })
    });
    // A successful HTTP command alone is not evidence of playback.
    await this.confirmPlaying();
  }
  async confirmPlaying() {
    for (let n = 0; n < 20; n++) {
      const state = await this.player.getCurrentState();
      if (state && !state.paused) {
        this.report('playing', '', state.track_window?.current_track?.name);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    throw new Error('Spotify has not confirmed playback. Tap Retry.');
  }
  async pause() {
    if (this.player && this.device) {
      const state = await timeout(this.player.getCurrentState());
      if (state && !state.paused) await timeout(this.player.pause());
    }
  }
  async resume() {
    await timeout(this.player.resume());
    await this.confirmPlaying();
  }
  async disconnect() {
    await this.pause();
    this.player?.disconnect();
    this.player = null;
    this.device = null;
    this.token = null;
    this.report('unauthorized');
  }
}
export function appleSongId(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'music.apple.com') throw new Error();
    const id = url.searchParams.get('i') || (url.pathname.includes('/song/') ? url.pathname.split('/').pop() : '');
    if (/^[0-9]+$/.test(id)) return id;
  } catch {}
  throw new Error('Paste an Apple Music song link, not an album or playlist.');
}
export class AppleAdapter {
  constructor(config, report) {
    this.config = config;
    this.report = report;
    this.music = null;
  }
  get configured() {
    return !!this.config.tokenEndpoint;
  }
  async authorize() {
    if (!this.configured) throw new Error('Apple Music needs an owner-configured developer-token endpoint. No private key belongs in this app.');
    const endpoint = new URL(this.config.tokenEndpoint, location.origin);
    if (endpoint.origin !== location.origin) throw new Error('Use a same-origin Apple developer-token endpoint.');
    await loadScript('https://js-cdn.music.apple.com/musickit/v3/musickit.js', () => !!window.MusicKit);
    const {
      developerToken
    } = await request(endpoint.href, {
      credentials: 'same-origin',
      cache: 'no-store'
    });
    if (typeof developerToken !== 'string' || !developerToken) throw new Error('Apple developer token is unavailable.');
    await window.MusicKit.configure({
      developerToken,
      app: {
        name: 'Mentication Night Channel',
        build: '1'
      }
    });
    this.music = window.MusicKit.getInstance();
    if (!this.bound) {
      this.music.addEventListener('playbackStateDidChange', () => {
        const s = this.music.playbackState,
          states = window.MusicKit.PlaybackStates;
        if (s === states.playing) this.report('playing', '', this.music.nowPlayingItem?.title);else if (s === states.paused || s === states.stopped || s === states.ended) this.report('paused');
      });
      this.music.addEventListener('mediaPlaybackError', () => this.report('error', 'Apple Music cannot play this item. Check subscription, region and authorization.'));
      this.bound = true;
    }
    await timeout(this.music.authorize(), 180000);
    if (!this.music.isAuthorized) throw new Error('Apple Music authorization was not completed.');
    this.report('ready');
  }
  async play(value) {
    if (!this.music?.isAuthorized) throw new Error('Connect Apple Music first.');
    const song = appleSongId(value);
    await timeout(this.music.setQueue({
      song
    }));
    await timeout(this.music.play());
    if (this.music.playbackState !== window.MusicKit.PlaybackStates.playing) throw new Error('Apple Music has not confirmed playback. Check your subscription and retry.');
    this.report('playing', '', this.music.nowPlayingItem?.title);
  }
  async pause() {
    if (this.music && ![window.MusicKit.PlaybackStates.paused, window.MusicKit.PlaybackStates.stopped, window.MusicKit.PlaybackStates.ended, window.MusicKit.PlaybackStates.none].includes(this.music.playbackState)) await timeout(this.music.pause());
  }
  async resume() {
    await timeout(this.music.play());
    if (this.music.playbackState !== window.MusicKit.PlaybackStates.playing) throw new Error('Apple Music has not confirmed playback.');
  }
  async disconnect() {
    await this.pause();
    if (this.music) await this.music.unauthorize();
    this.report('unauthorized');
  }
}
