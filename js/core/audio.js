// ---------- Procedural WebAudio synth ----------
'use strict';
const Audio = {
  ctx: null, master: null, noiseBuf: null, muted: false, volume: 0.6, musicGain: null, sfxGain: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.volume;
    const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; comp.knee.value = 10;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
    const len = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    // reverb-ish feedback delay for the big stage
    this.delay = this.ctx.createDelay(1); this.delay.delayTime.value = 0.23; this.delayGain = this.ctx.createGain(); this.delayGain.gain.value = 0;
    this.delayFilter = this.ctx.createBiquadFilter(); this.delayFilter.type = 'lowpass'; this.delayFilter.frequency.value = 2200;
    this.musicGain.connect(this.delay); this.delay.connect(this.delayFilter); this.delayFilter.connect(this.delayGain); this.delayGain.connect(this.delay); this.delayGain.connect(this.master);
    // distortion curve
    const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 4) * 0.8; } this.distCurve = curve;
  },
  setStageReverb(on) { if (this.delayGain) this.delayGain.gain.value = on ? 0.32 : 0; },
  now() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000; },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : this.volume; },
  freq(midi) { return 440 * Math.pow(2, (midi - 69) / 12); },
  _env(g, t, a, peak, d, sus, holdTo, r) {
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + d);
    if (holdTo != null) { const h = Math.max(holdTo, t + a + d); g.gain.setValueAtTime(Math.max(0.0001, peak * sus), h); g.gain.exponentialRampToValueAtTime(0.0001, h + r); }
  },
  _noise(t, dur, filterType, freq, q, vel, dest) {
    const c = this.ctx; const src = c.createBufferSource(); src.buffer = this.noiseBuf; src.loop = true;
    const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q || 1;
    const g = c.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(dest || this.sfxGain); src.start(t); src.stop(t + dur + 0.05);
  },
  note(instr, midi, when, dur = 0.4, vel = 0.5) {
    if (!this.ctx || this.muted) return { off() { } };
    const c = this.ctx, t = Math.max(when || c.currentTime, c.currentTime), f0 = this.freq(midi);
    const out = c.createGain(); out.connect(this.musicGain);
    const oscs = []; let filt = c.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 4000;
    let chainIn = filt; filt.connect(out);
    const mk = (type, f, det = 0, g = 1) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = det; const og = c.createGain(); og.gain.value = g; o.connect(og); og.connect(chainIn); oscs.push(o); return o; };
    const vib = (o, rate, depth) => { const l = c.createOscillator(); l.frequency.value = rate; const lg = c.createGain(); lg.gain.value = depth; l.connect(lg); lg.connect(o.detune); oscs.push(l); };
    let endAt = t + dur + 0.3, release = 0.1;
    switch (instr) {
      case 'guitar': mk('triangle', f0, 0, 0.6); mk('sawtooth', f0, 6, 0.35); mk('sine', f0 * 2, 0, 0.15);
        filt.frequency.setValueAtTime(3500, t); filt.frequency.exponentialRampToValueAtTime(700, t + 0.5);
        this._env(out, t, 0.004, vel, 0.5, 0.15, t + Math.min(dur, 1.2), 0.15); endAt = t + Math.min(dur, 1.2) + 0.3; break;
      case 'eguitar': { // distorted rock guitar
        const ws = c.createWaveShaper(); ws.curve = this.distCurve; ws.oversample = '2x'; const pre = c.createGain(); pre.gain.value = 2.2; pre.connect(ws); ws.connect(filt); chainIn = pre;
        mk('sawtooth', f0, 0, 0.5); mk('sawtooth', f0, -8, 0.4); mk('square', f0 / 2, 0, 0.2);
        filt.frequency.setValueAtTime(2600, t); filt.frequency.exponentialRampToValueAtTime(1200, t + 0.6); filt.Q.value = 1.2;
        this._env(out, t, 0.005, vel * 0.55, 0.3, 0.55, t + Math.min(dur, 2), 0.12); endAt = t + Math.min(dur, 2) + 0.3; break; }
      case 'bass': mk('sine', f0, 0, 0.8); mk('square', f0, 0, 0.25); mk('sawtooth', f0 * 2, 0, 0.08);
        filt.frequency.setValueAtTime(900, t); filt.frequency.exponentialRampToValueAtTime(250, t + 0.3);
        this._env(out, t, 0.006, vel * 1.1, 0.25, 0.4, t + dur, 0.12); break;
      case 'piano': mk('sine', f0, 0, 0.7); mk('triangle', f0 * 2, 0, 0.25); mk('sine', f0 * 3, 0, 0.08); mk('sine', f0 * 4.01, 0, 0.04);
        filt.frequency.setValueAtTime(5000, t); filt.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
        this._env(out, t, 0.003, vel, 0.6, 0.12, t + Math.min(dur, 1.5), 0.2); endAt = t + Math.min(dur, 1.5) + 0.4; break;
      case 'sax': { const o = mk('sawtooth', f0, 0, 0.5); mk('square', f0, -5, 0.2); mk('sine', f0 * 2, 0, 0.1); vib(o, 5.5, 10);
        filt.frequency.setValueAtTime(600, t); filt.frequency.linearRampToValueAtTime(2200, t + 0.08); filt.Q.value = 3;
        this._env(out, t, 0.05, vel * 0.8, 0.1, 0.8, t + dur, 0.12); release = 0.12; break; }
      case 'trumpet': { const o = mk('square', f0, 0, 0.35); mk('sawtooth', f0, 4, 0.4); mk('sine', f0 * 3, 0, 0.05); vib(o, 6, 6);
        filt.frequency.setValueAtTime(1200, t); filt.frequency.linearRampToValueAtTime(3800, t + 0.05); filt.Q.value = 2;
        this._env(out, t, 0.03, vel * 0.75, 0.08, 0.85, t + dur, 0.08); release = 0.08; break; }
      case 'violin': { const o = mk('sawtooth', f0, 0, 0.5); mk('sawtooth', f0, 8, 0.3); mk('triangle', f0 * 2, 0, 0.12); vib(o, 5.2, 14);
        filt.frequency.value = 3200; filt.Q.value = 1.5; this._env(out, t, 0.09, vel * 0.7, 0.1, 0.9, t + dur, 0.15); release = 0.15; endAt = t + dur + 0.4; break; }
      case 'tambourine': this._noise(t, 0.15, 'highpass', 5000, 1, vel * 0.7, this.musicGain); mk('sine', 3200, 0, 0.15); mk('sine', 4700, 0, 0.1);
        this._env(out, t, 0.002, vel * 0.5, 0.12, 0.01, t + 0.1, 0.05); endAt = t + 0.3; break;
      case 'organ': mk('sine', f0, 0, 0.5); mk('sine', f0 * 2, 0, 0.35); mk('sine', f0 * 3, 0, 0.18); mk('sine', f0 * 4, 0, 0.12); mk('sine', f0 / 2, 0, 0.2);
        filt.frequency.value = 3000; this._env(out, t, 0.02, vel * 0.5, 0.1, 0.9, t + dur, 0.1); break;
      case 'choir': { const o = mk('sawtooth', f0, 0, 0.3); mk('sawtooth', f0, 9, 0.3); mk('triangle', f0 * 2, 0, 0.15); mk('sawtooth', f0 * 0.5, -4, 0.15); vib(o, 4.5, 8);
        filt.type = 'bandpass'; filt.frequency.value = f0 * 2.2; filt.Q.value = 1.4; this._env(out, t, 0.12, vel * 0.6, 0.15, 0.85, t + dur, 0.25); release = 0.25; endAt = t + dur + 0.5; break; }
      case 'pad': mk('triangle', f0, 0, 0.5); mk('triangle', f0, 7, 0.4); mk('sine', f0 / 2, 0, 0.2); filt.frequency.value = 1400;
        this._env(out, t, 0.15, vel * 0.5, 0.2, 0.8, t + dur, 0.3); endAt = t + dur + 0.6; break;
      case 'vox': { const o = mk('sawtooth', f0, 0, 0.35); mk('triangle', f0, 6, 0.3); mk('sine', f0 * 2, 0, 0.12); vib(o, 5.8, 16);
        filt.type = 'bandpass'; filt.frequency.value = f0 * 2.6; filt.Q.value = 1.8; this._env(out, t, 0.06, vel * 0.65, 0.1, 0.85, t + dur, 0.18); release = 0.18; endAt = t + dur + 0.4; break; }
      // ---- the 8-bit voice: a square-wave lead with a fast vibrato and a hard
      // edge, the way a chip singer sounds. Two of them, slightly apart.
      case 'vox8': { const o = mk('square', f0, 0, 0.42); mk('square', f0, 9, 0.3); mk('triangle', f0, -6, 0.14); vib(o, 6.4, 22);
        filt.frequency.setValueAtTime(2600, t); filt.frequency.linearRampToValueAtTime(3600, t + 0.06); filt.Q.value = 1.1;
        this._env(out, t, 0.012, vel * 0.62, 0.06, 0.88, t + dur, 0.07); release = 0.07; break; }
      // ---- and a whole room of them, an octave down, none of them in tune
      case 'crowd8': { for (let i = 0; i < 5; i++) mk('square', f0 / 2, (i - 2) * 17, 0.14); mk('triangle', f0, 0, 0.1);
        filt.frequency.value = 1500; filt.Q.value = 0.8;
        this._env(out, t, 0.07, vel * 0.5, 0.12, 0.85, t + dur, 0.2); release = 0.2; endAt = t + dur + 0.4; break; }
      case 'harmonica': { const o = mk('square', f0, 0, 0.25); mk('sawtooth', f0 * 2, 3, 0.2); vib(o, 6, 12); filt.frequency.value = 3000; this._env(out, t, 0.03, vel * 0.5, 0.1, 0.8, t + dur, 0.1); break; }
      // ---- shamisen: a hard plectrum strike on gut, with the buzzing sawari
      case 'shamisen': { mk('triangle', f0, 0, 0.55); mk('sawtooth', f0, 11, 0.3); mk('square', f0 * 2, 0, 0.12); mk('sawtooth', f0 * 3.02, 0, 0.06);
        filt.frequency.setValueAtTime(4200, t); filt.frequency.exponentialRampToValueAtTime(600, t + 0.35); filt.Q.value = 2;
        this._noise(t, 0.03, 'highpass', 2600, 1, vel * 0.35, this.musicGain);   // the plectrum itself
        this._env(out, t, 0.002, vel, 0.42, 0.1, t + Math.min(dur, 0.9), 0.12); endAt = t + Math.min(dur, 0.9) + 0.3; break; }
      // ---- koto: a long, clean plucked string with a slow bloom
      case 'koto': { mk('sine', f0, 0, 0.6); mk('triangle', f0 * 2, 0, 0.22); mk('sine', f0 * 3, 0, 0.1); mk('sine', f0 * 4.02, 0, 0.05);
        filt.frequency.setValueAtTime(5200, t); filt.frequency.exponentialRampToValueAtTime(900, t + 0.9);
        this._env(out, t, 0.004, vel * 0.95, 0.8, 0.1, t + Math.min(dur, 1.6), 0.25); endAt = t + Math.min(dur, 1.6) + 0.4; break; }
      // ---- shakuhachi: breath first, then a hollow tone that wavers
      case 'shakuhachi': { const o = mk('sine', f0, 0, 0.5); mk('triangle', f0, 7, 0.2); mk('sine', f0 * 2, 0, 0.07); vib(o, 4.4, 18);
        this._noise(t, Math.min(dur, 0.5), 'bandpass', f0 * 3, 0.8, vel * 0.22, this.musicGain);   // the breath across the edge
        filt.type = 'bandpass'; filt.frequency.value = f0 * 2.1; filt.Q.value = 1.1;
        this._env(out, t, 0.1, vel * 0.7, 0.12, 0.85, t + dur, 0.22); release = 0.22; endAt = t + dur + 0.45; break; }
      default: mk('triangle', f0, 0, 0.7); this._env(out, t, 0.01, vel, 0.3, 0.3, t + dur, 0.1);
    }
    oscs.forEach(o => { o.start(t); o.stop(endAt + 0.1); });
    return { off: (when) => { const tt = Math.max(when || c.currentTime, c.currentTime); out.gain.cancelScheduledValues(tt); out.gain.setValueAtTime(Math.max(0.0001, out.gain.value), tt); out.gain.exponentialRampToValueAtTime(0.0001, tt + release); oscs.forEach(o => { try { o.stop(tt + release + 0.05); } catch (e) { } }); } };
  },
  // A drum you can feel. `punch` is what a struck kit gets and a backing track
  // does not: a sub under the fundamental, a click of stick on skin, and a
  // short slap of the room behind it. It is what makes a hit sound loud rather
  // than merely be loud.
  drum(kind, when, vel = 0.6, punch = 0) {
    if (!this.ctx || this.muted) return;
    const c = this.ctx, t = Math.max(when || c.currentTime, c.currentTime), dest = this.musicGain;
    if (punch > 0) vel *= 1 + punch * 0.5;
    const tone = (f1, f2, dur, type, v) => { const o = c.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); };
    if (punch > 0) {
      const lowKinds = { kick: 54, bigkick: 46, don: 62, odaiko: 44, timpani: 40, stomp: 38, bucket: 58, floortom: 62, tom: 84, crate: 70, snare: 0, shime: 0 };
      const sub = lowKinds[kind];
      // a sine an octave under the shell, which is the part you feel
      if (sub) tone(sub * 1.6, sub, 0.26, 'sine', vel * 0.5 * punch);
      // stick on skin: a very short tick of noise right at the front
      this._noise(t, 0.012, 'highpass', 4200, 0.8, vel * 0.3 * punch, dest);
      // and the room answering, a few milliseconds late
      this._noise(t + 0.022, 0.13, 'bandpass', 900, 0.6, vel * 0.13 * punch, dest);
    }
    switch (kind) {
      case 'kick': tone(150, 45, 0.18, 'sine', vel); break;
      case 'bigkick': tone(120, 38, 0.32, 'sine', vel * 1.2); this._noise(t, 0.08, 'lowpass', 400, 1, vel * 0.5, dest); break;
      case 'snare': tone(220, 120, 0.12, 'triangle', vel * 0.5); this._noise(t, 0.16, 'highpass', 1500, 1, vel * 0.6, dest); break;
      case 'hat': this._noise(t, 0.05, 'highpass', 8000, 1, vel * 0.35, dest); break;
      case 'ohat': this._noise(t, 0.18, 'highpass', 7000, 1, vel * 0.3, dest); break;
      case 'don': tone(190, 70, 0.22, 'sine', vel * 1.1); this._noise(t, 0.08, 'lowpass', 500, 1, vel * 0.4, dest); break;
      case 'ka': tone(900, 500, 0.06, 'square', vel * 0.25); this._noise(t, 0.09, 'highpass', 3000, 2, vel * 0.7, dest); break;
      case 'crash': this._noise(t, 0.9, 'highpass', 4000, 0.5, vel * 0.5, dest); break;
      case 'tom': tone(260, 120, 0.2, 'sine', vel * 0.8); break;
      case 'timpani': tone(110, 80, 0.7, 'sine', vel * 0.9); this._noise(t, 0.1, 'lowpass', 300, 1, vel * 0.3, dest); break;
      case 'clap': for (let i = 0; i < 3; i++) this._noise(t + i * 0.012, 0.08, 'bandpass', 1800, 1.5, vel * 0.5, dest); break;
      case 'clunk': tone(120, 60, 0.1, 'sawtooth', vel * 0.3); this._noise(t, 0.06, 'lowpass', 700, 1, vel * 0.4, dest); break;
      case 'stomp': tone(90, 40, 0.25, 'sine', vel); this._noise(t, 0.12, 'lowpass', 300, 1, vel * 0.6, dest); break;
      // ---- the junk kit: a paint bucket, a stock pot, a milk crate
      case 'bucket': tone(95, 62, 0.16, 'sine', vel * 0.8); this._noise(t, 0.1, 'bandpass', 420, 1.4, vel * 0.55, dest); tone(310, 180, 0.06, 'triangle', vel * 0.2); break;
      case 'pot': tone(620, 380, 0.09, 'square', vel * 0.3); this._noise(t, 0.24, 'bandpass', 2600, 2.2, vel * 0.5, dest); this._noise(t, 0.5, 'highpass', 4200, 0.7, vel * 0.16, dest); break;
      case 'crate': tone(180, 90, 0.1, 'square', vel * 0.35); this._noise(t, 0.12, 'bandpass', 900, 1.1, vel * 0.5, dest); break;
      case 'floortom': tone(180, 78, 0.3, 'sine', vel * 0.9); this._noise(t, 0.07, 'lowpass', 400, 1, vel * 0.2, dest); break;
      case 'ride': this._noise(t, 0.5, 'highpass', 6000, 0.6, vel * 0.28, dest); tone(2400, 2100, 0.12, 'square', vel * 0.07); break;
      // ---- a big taiko: a deep skin with the rim shot beside it
      case 'odaiko': tone(110, 52, 0.42, 'sine', vel * 1.25); tone(220, 90, 0.14, 'triangle', vel * 0.3); this._noise(t, 0.1, 'lowpass', 500, 1, vel * 0.45, dest); break;
      case 'shime': tone(420, 260, 0.1, 'triangle', vel * 0.5); this._noise(t, 0.1, 'bandpass', 2200, 2, vel * 0.5, dest); break;
      case 'kane': tone(1900, 1750, 0.5, 'square', vel * 0.16); tone(2840, 2700, 0.7, 'sine', vel * 0.1); break;   // the temple hand-gong
      case 'woodblock': tone(1500, 900, 0.05, 'square', vel * 0.4); this._noise(t, 0.03, 'highpass', 3000, 1, vel * 0.3, dest); break;
    }
  },
  ui(kind) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const beep = (f1, f2, dur, type, v, dt = 0) => { const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f1, t + dt); o.frequency.exponentialRampToValueAtTime(f2, t + dt + dur); const g = this.ctx.createGain(); g.gain.setValueAtTime(v, t + dt); g.gain.exponentialRampToValueAtTime(0.0001, t + dt + dur); o.connect(g); g.connect(this.sfxGain); o.start(t + dt); o.stop(t + dt + dur + 0.02); };
    switch (kind) {
      case 'move': beep(700, 900, 0.05, 'square', 0.1); break;
      // the little tick a line of dialogue makes as it types itself out
      case 'type': beep(1500, 1400, 0.015, 'square', 0.035); break;
      case 'select': beep(600, 1200, 0.08, 'square', 0.13); beep(900, 1600, 0.1, 'square', 0.1, 0.06); break;
      case 'back': beep(500, 300, 0.1, 'square', 0.1); break;
      case 'coin': beep(1400, 2100, 0.07, 'sine', 0.18); beep(2100, 2600, 0.12, 'sine', 0.13, 0.06); break;
      case 'bill': beep(900, 1800, 0.1, 'triangle', 0.18); beep(1800, 2400, 0.15, 'triangle', 0.13, 0.08); break;
      case 'cash': beep(1200, 1600, 0.08, 'sine', 0.18); beep(1600, 2400, 0.15, 'sine', 0.18, 0.08); beep(2400, 3000, 0.2, 'sine', 0.13, 0.16); break;
      case 'tally': beep(800 + Math.random() * 400, 1200, 0.04, 'square', 0.08); break;
      case 'stamp': beep(300, 120, 0.12, 'square', 0.2); this._noise(t, 0.08, 'lowpass', 900, 1, 0.3); break;
      case 'mult': beep(400, 1600, 0.25, 'sawtooth', 0.15); break;
      case 'error': beep(200, 120, 0.2, 'sawtooth', 0.13); break;
      case 'eat': beep(300, 500, 0.08, 'triangle', 0.13); beep(350, 550, 0.08, 'triangle', 0.13, 0.12); beep(400, 700, 0.12, 'triangle', 0.13, 0.24); break;
      case 'levelup': [0, 4, 7, 12].forEach((n, i) => beep(this.freq(72 + n), this.freq(72 + n), 0.15, 'square', 0.1, i * 0.08)); break;
      case 'fanfare': [0, 4, 7, 12, 7, 12].forEach((n, i) => beep(this.freq(67 + n), this.freq(67 + n), 0.2, 'square', 0.1, i * 0.1)); break;
      case 'sad': [7, 5, 3, 0].forEach((n, i) => beep(this.freq(60 + n), this.freq(60 + n) * 0.98, 0.3, 'triangle', 0.13, i * 0.25)); break;
      case 'hurt': beep(400, 100, 0.25, 'sawtooth', 0.18); break;
      case 'whoosh': this._noise(t, 0.4, 'bandpass', 600, 0.7, 0.35); break;
      case 'pyro': this._noise(t, 0.6, 'lowpass', 900, 0.8, 0.6); beep(200, 60, 0.4, 'sawtooth', 0.15); break;
      case 'boo': for (let i = 0; i < 8; i++) beep(160 + Math.random() * 60, 120, 0.5, 'sawtooth', 0.05, Math.random() * 0.4); break;
      case 'pop': beep(600, 1400, 0.06, 'sine', 0.15); break;
      case 'tick': beep(2000, 1800, 0.02, 'square', 0.06); break;
    }
  },
  applause(intensity = 0.5, dur = 1.2) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime; const n = Math.floor(6 + intensity * 16);
    for (let i = 0; i < n; i++) this._noise(t + Math.random() * dur, 0.04 + Math.random() * 0.03, 'bandpass', 1200 + Math.random() * 1500, 2, 0.06 + intensity * 0.1);
  },
  roar(dur = 2.5, vel = 0.5) { // stadium crowd
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime; this._noise(t, dur, 'bandpass', 500, 0.6, vel); this._noise(t + 0.2, dur * 0.8, 'bandpass', 1100, 0.8, vel * 0.5); this.applause(1, dur);
  },
};
