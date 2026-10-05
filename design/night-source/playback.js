// The timer measures wall time while playing and freezes on pause; expiry is silent.
export class SleepClock {
  constructor(minutes = 15, now = () => Date.now()) {
    this.now = now;
    this.set(minutes);
  }
  set(minutes) {
    this.remainingMs = minutes * 60000;
    this.deadline = null;
  }
  start() {
    if (this.remainingMs > 0 && this.deadline === null) this.deadline = this.now() + this.remainingMs;
  }
  pause() {
    this.remainingMs = this.remaining();
    this.deadline = null;
  }
  remaining() {
    return Math.max(0, this.deadline === null ? this.remainingMs : this.deadline - this.now());
  }
  get seconds() {
    return Math.ceil(this.remaining() / 1000);
  }
}
export class LocalAudio {
  constructor(report) {
    this.report = report;
    this.context = null;
    this.audio = null;
    this.source = null;
    this.file = null;
    this.volume = 0.5;
    this.texture = 0.38;
  }
  async play(channel, file) {
    await this.dispose();
    this.file = file;
    if (file) {
      const audio = this.audio = new Audio(file);
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = this.volume;
      audio.onerror = () => this.report('error', 'This file could not be decoded. Choose a supported audio file or retry.');
      audio.onended = () => this.report('paused', 'End of your file.');
      audio.onwaiting = () => this.report('loading', 'Buffering your file…');
      audio.onplaying = () => this.report('playing');
      await audio.play();
    } else {
      if (['podcast', 'documentary', 'audible'].includes(channel.id)) throw new Error('Recording not added yet. Attach your own audio file, or choose Spotify / Apple Music.');
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) throw new Error('Audio is unavailable in this browser.');
      const context = this.context = new AudioContext();
      this.gain = context.createGain();
      this.gain.gain.value = this.volume;
      this.gain.connect(context.destination);
      const buffer = context.createBuffer(1, context.sampleRate * 6, context.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        last = (last + (Math.random() * 2 - 1) * 0.02) * 0.998;
        data[i] = last * 3.5;
      }
      this.source = context.createBufferSource();
      this.source.buffer = buffer;
      this.source.loop = true;
      this.filter = context.createBiquadFilter();
      this.filter.type = channel.filterType;
      this.baseFrequency = channel.freq;
      this.filter.frequency.value = channel.freq * (0.7 + this.texture);
      this.source.connect(this.filter);
      this.filter.connect(this.gain);
      this.source.start();
      await context.resume();
      if (context.state !== 'running') throw new Error('Tap Play again to allow audio.');
    }
  }
  async pause() {
    this.audio?.pause();
    if (this.context?.state === 'running') await this.context.suspend();
  }
  async resume() {
    if (this.audio) await this.audio.play();else if (this.context) {
      await this.context.resume();
      if (this.context.state !== 'running') throw new Error('Audio is suspended. Tap Retry.');
    } else throw new Error('Choose a channel first.');
  }
  setVolume(volume) {
    this.volume = volume;
    if (this.audio) this.audio.volume = volume;
    if (this.gain && this.context?.state !== 'closed') this.gain.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
  }
  setTexture(value) {
    this.texture = value;
    if (this.filter) this.filter.frequency.value = this.baseFrequency * (0.7 + value);
  }
  async dispose() {
    this.audio?.pause();
    if (this.audio) {
      this.audio.onerror = this.audio.onended = this.audio.onwaiting = this.audio.onplaying = null;
      this.audio.removeAttribute('src');
      this.audio.load();
    }
    this.audio = null;
    try {
      this.source?.stop();
    } catch {}
    if (this.context && this.context.state !== 'closed') await this.context.close();
    this.context = null;
    this.source = null;
    this.filter = null;
    this.gain = null;
  }
}
