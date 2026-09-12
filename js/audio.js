// ---------- Procedural WebAudio synth ----------
'use strict';
const Audio = {
  ctx: null, master: null, noiseBuf: null, muted: false, volume: 0.6,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    const comp = this.ctx.createDynamicsCompressor();
    comp.threshold.value = -12; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  },
  now() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000; },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : this.volume; },
  freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); },
  _env(g, t, a, peak, d, sus, holdTo, r) {
    // ADSR on gain node g (holdTo = absolute time note releases)
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    if (holdTo != null) {
      g.gain.setValueAtTime(Math.max(0.0001, peak * sus), Math.max(holdTo, t + a + d));
      g.gain.exponentialRampToValueAtTime(0.0001, Math.max(holdTo, t + a + d) + r);
    }
  },
  _noise(t, dur, filterType, freq, q, vel) {
    const c = this.ctx;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(vel, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t); src.stop(t + dur + 0.05);
  },
  // Play a pitched instrument note. dur in seconds (sustain length). Returns handle {off(when)}
  note(instr, midi, when, dur = 0.4, vel = 0.5) {
    if (!this.ctx || this.muted) return { off() {} };
    const c = this.ctx, t = Math.max(when || c.currentTime, c.currentTime);
    const f0 = this.freq(midi);
    const out = c.createGain(); out.connect(this.master);
    const oscs = [];
    let filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 4000; filt.connect(out);
    const mk = (type, f, det = 0, g = 1) => {
      const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det;
      const og = c.createGain(); og.gain.value = g; o.connect(og); og.connect(filt); oscs.push(o); return o;
    };
    let endAt = t + dur + 0.3, release = 0.1;
    const vib = (o, rate, depth) => {
      const l = c.createOscillator(); l.frequency.value = rate; const lg = c.createGain(); lg.gain.value = depth;
      l.connect(lg); lg.connect(o.detune); oscs.push(l);
    };
    switch (instr) {
      case 'guitar':
        mk('triangle', f0, 0, 0.6); mk('sawtooth', f0, 6, 0.35); mk('sine', f0 * 2, 0, 0.15);
        filt.frequency.setValueAtTime(3500, t); filt.frequency.exponentialRampToValueAtTime(700, t + 0.5);
        this._env(out, t, 0.004, vel, 0.5, 0.15, t + Math.min(dur, 1.2), 0.15); endAt = t + Math.min(dur, 1.2) + 0.3; break;
      case 'bass':
        mk('sine', f0, 0, 0.8); mk('square', f0, 0, 0.25); mk('sawtooth', f0 * 2, 0, 0.08);
        filt.frequency.setValueAtTime(900, t); filt.frequency.exponentialRampToValueAtTime(250, t + 0.3);
        this._env(out, t, 0.006, vel * 1.1, 0.25, 0.4, t + dur, 0.12); endAt = t + dur + 0.3; break;
      case 'piano':
        mk('sine', f0, 0, 0.7); mk('triangle', f0 * 2, 0, 0.25); mk('sine', f0 * 3, 0, 0.08); mk('sine', f0 * 4.01, 0, 0.04);
        filt.frequency.setValueAtTime(5000, t); filt.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
        this._env(out, t, 0.003, vel, 0.6, 0.12, t + Math.min(dur, 1.5), 0.2); endAt = t + Math.min(dur, 1.5) + 0.4; break;
      case 'sax': {
        const o = mk('sawtooth', f0, 0, 0.5); mk('square', f0, -5, 0.2); mk('sine', f0 * 2, 0, 0.1);
        vib(o, 5.5, 10);
        filt.frequency.setValueAtTime(600, t); filt.frequency.linearRampToValueAtTime(2200, t + 0.08); filt.Q.value = 3;
        this._env(out, t, 0.05, vel * 0.8, 0.1, 0.8, t + dur, 0.12); release = 0.12; endAt = t + dur + 0.3; break; }
      case 'trumpet': {
        const o = mk('square', f0, 0, 0.35); mk('sawtooth', f0, 4, 0.4); mk('sine', f0 * 3, 0, 0.05);
        vib(o, 6, 6);
        filt.frequency.setValueAtTime(1200, t); filt.frequency.linearRampToValueAtTime(3800, t + 0.05); filt.Q.value = 2;
        this._env(out, t, 0.03, vel * 0.75, 0.08, 0.85, t + dur, 0.08); release = 0.08; endAt = t + dur + 0.3; break; }
      case 'violin': {
        const o = mk('sawtooth', f0, 0, 0.5); mk('sawtooth', f0, 8, 0.3); mk('triangle', f0 * 2, 0, 0.12);
        vib(o, 5.2, 14);
        filt.frequency.value = 3200; filt.Q.value = 1.5;
        this._env(out, t, 0.09, vel * 0.7, 0.1, 0.9, t + dur, 0.15); release = 0.15; endAt = t + dur + 0.4; break; }
      case 'tambourine':
        this._noise(t, 0.15, 'highpass', 5000, 1, vel * 0.7);
        mk('sine', 3200, 0, 0.15); mk('sine', 4700, 0, 0.1);
        this._env(out, t, 0.002, vel * 0.5, 0.12, 0.01, t + 0.1, 0.05); endAt = t + 0.3; break;
      case 'pad':
        mk('triangle', f0, 0, 0.5); mk('triangle', f0, 7, 0.4); mk('sine', f0 / 2, 0, 0.2);
        filt.frequency.value = 1400;
        this._env(out, t, 0.15, vel * 0.5, 0.2, 0.8, t + dur, 0.3); endAt = t + dur + 0.6; break;
      default:
        mk('triangle', f0, 0, 0.7); this._env(out, t, 0.01, vel, 0.3, 0.3, t + dur, 0.1); endAt = t + dur + 0.3;
    }
    oscs.forEach(o => { o.start(t); o.stop(endAt + 0.1); });
    return {
      off: (when) => {
        const tt = Math.max(when || c.currentTime, c.currentTime);
        out.gain.cancelScheduledValues(tt);
        out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), tt);
        out.gain.exponentialRampToValueAtTime(0.0001, tt + release);
        oscs.forEach(o => { try { o.stop(tt + release + 0.05); } catch (e) { } });
      }
    };
  },
  drum(kind, when, vel = 0.6) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = Math.max(when || c.currentTime, c.currentTime);
    const tone = (f1, f2, dur, type, v) => {
      const o = c.createOscillator(); o.type = type || 'sine';
      o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
    };
    switch (kind) {
      case 'kick': tone(150, 45, 0.18, 'sine', vel); break;
      case 'snare': tone(220, 120, 0.12, 'triangle', vel * 0.5); this._noise(t, 0.16, 'highpass', 1500, 1, vel * 0.6); break;
      case 'hat': this._noise(t, 0.05, 'highpass', 8000, 1, vel * 0.35); break;
      case 'ohat': this._noise(t, 0.18, 'highpass', 7000, 1, vel * 0.3); break;
      case 'don': tone(190, 70, 0.22, 'sine', vel * 1.1); this._noise(t, 0.08, 'lowpass', 500, 1, vel * 0.4); break;
      case 'ka': tone(900, 500, 0.06, 'square', vel * 0.25); this._noise(t, 0.09, 'highpass', 3000, 2, vel * 0.7); break;
      case 'crash': this._noise(t, 0.9, 'highpass', 4000, 0.5, vel * 0.5); break;
      case 'tom': tone(260, 120, 0.2, 'sine', vel * 0.8); break;
      case 'clunk': tone(120, 60, 0.1, 'sawtooth', vel * 0.3); this._noise(t, 0.06, 'lowpass', 700, 1, vel * 0.4); break;
    }
  },
  ui(kind) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const beep = (f1, f2, dur, type, v, dt = 0) => {
      const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t + dt);
      o.frequency.exponentialRampToValueAtTime(f2, t + dt + dur);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + dur);
      o.connect(g); g.connect(this.master); o.start(t + dt); o.stop(t + dt + dur + 0.02);
    };
    switch (kind) {
      case 'move': beep(700, 900, 0.05, 'square', 0.12); break;
      case 'select': beep(600, 1200, 0.08, 'square', 0.15); beep(900, 1600, 0.1, 'square', 0.12, 0.06); break;
      case 'back': beep(500, 300, 0.1, 'square', 0.12); break;
      case 'coin': beep(1400, 2100, 0.07, 'sine', 0.2); beep(2100, 2600, 0.12, 'sine', 0.15, 0.06); break;
      case 'bill': beep(900, 1800, 0.1, 'triangle', 0.2); beep(1800, 2400, 0.15, 'triangle', 0.15, 0.08); break;
      case 'cash': beep(1200, 1600, 0.08, 'sine', 0.2); beep(1600, 2400, 0.15, 'sine', 0.2, 0.08); beep(2400, 3000, 0.2, 'sine', 0.15, 0.16); break;
      case 'error': beep(200, 120, 0.2, 'sawtooth', 0.15); break;
      case 'eat': beep(300, 500, 0.08, 'triangle', 0.15); beep(350, 550, 0.08, 'triangle', 0.15, 0.12); beep(400, 700, 0.12, 'triangle', 0.15, 0.24); break;
      case 'levelup': [0, 4, 7, 12].forEach((n, i) => beep(this.freq(72 + n), this.freq(72 + n), 0.15, 'square', 0.12, i * 0.08)); break;
      case 'fanfare': [0, 4, 7, 12, 7, 12].forEach((n, i) => beep(this.freq(67 + n), this.freq(67 + n), 0.2, 'square', 0.12, i * 0.1)); break;
      case 'sad': [7, 5, 3, 0].forEach((n, i) => beep(this.freq(60 + n), this.freq(60 + n) * 0.98, 0.3, 'triangle', 0.15, i * 0.25)); break;
      case 'hurt': beep(400, 100, 0.25, 'sawtooth', 0.2); break;
    }
  },
  applause(intensity = 0.5, dur = 1.2) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const n = Math.floor(6 + intensity * 14);
    for (let i = 0; i < n; i++) {
      const dt = Math.random() * dur;
      this._noise(t + dt, 0.04 + Math.random() * 0.03, 'bandpass', 1200 + Math.random() * 1500, 2, 0.08 + intensity * 0.12);
    }
  },
};
