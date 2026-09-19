// ---------- 8-bit voices ----------
// Nobody in this game has a recorded line. What they have is a voice: a base
// note, a wave, and a way of jumping about. A line of dialogue is played as
// one short blip per couple of characters, pitched off the letters, so the
// same sentence always sounds the same and two characters never sound alike.
'use strict';
const Voice = {
  PRESETS: {
    // ---- the people you meet on the way
    captain:  { midi: 40, type: 'square',   jump: 2.0, rate: 11, len: 0.062, filt: 760,  q: 3.0, vib: 0,   gain: 0.9 },  // over a PA, bassy
    hostess:  { midi: 67, type: 'square',   jump: 4.0, rate: 15, len: 0.042, filt: 2400, q: 1.4, vib: 14,  gain: 0.7 },
    tannoy:   { midi: 55, type: 'triangle', jump: 1.5, rate: 12, len: 0.055, filt: 1100, q: 2.2, vib: 0,   gain: 0.6 },
    guard:    { midi: 44, type: 'square',   jump: 2.0, rate: 12, len: 0.05,  filt: 1000, q: 1.6, vib: 0,   gain: 0.75 },
    clerk:    { midi: 71, type: 'square',   jump: 5.0, rate: 17, len: 0.036, filt: 2900, q: 1.2, vib: 18,  gain: 0.6 },
    barista:  { midi: 62, type: 'sawtooth', jump: 3.5, rate: 14, len: 0.046, filt: 1800, q: 1.3, vib: 8,   gain: 0.6 },
    driver:   { midi: 47, type: 'triangle', jump: 2.5, rate: 10, len: 0.058, filt: 1300, q: 1.1, vib: 4,   gain: 0.7 },
    oldman:   { midi: 43, type: 'triangle', jump: 2.0, rate: 9,  len: 0.07,  filt: 900,  q: 1.0, vib: 22,  gain: 0.75 },  // the spider, wobbly
    you:      { midi: 64, type: 'square',   jump: 3.0, rate: 15, len: 0.04,  filt: 2100, q: 1.2, vib: 6,   gain: 0.55 },
    tv:       { midi: 69, type: 'square',   jump: 6.0, rate: 19, len: 0.03,  filt: 3200, q: 0.9, vib: 0,   gain: 0.45 },
    kid:      { midi: 76, type: 'square',   jump: 6.0, rate: 19, len: 0.03,  filt: 3400, q: 0.9, vib: 20,  gain: 0.5 },
    robot:    { midi: 52, type: 'square',   jump: 0.4, rate: 14, len: 0.05,  filt: 1500, q: 6.0, vib: 0,   gain: 0.6 },
  },
  // Pick a stable voice for a name we have no preset for.
  forName(name) {
    const P = Object.keys(this.PRESETS);
    return this.PRESETS[P[hashStr(String(name || 'x')) % P.length]];
  },
  get(key) { return (key && this.PRESETS[key]) || this.PRESETS.you; },
  // Speak a line. Returns a handle you can stop() when the box is dismissed.
  say(text, key, opts = {}) {
    const stop = { on: true, stop() { this.on = false; } };
    if (!Audio.ctx || Audio.muted) return stop;
    const v = typeof key === 'object' ? key : this.get(key);
    const s = String(text || '').toUpperCase();
    const c = Audio.ctx;
    let t = c.currentTime + 0.02;
    const rate = (opts.rate || v.rate) * (opts.speed || 1);
    const step = 1 / rate;
    let n = 0;
    for (let i = 0; i < s.length && n < 90; i += 2) {
      const ch = s.charCodeAt(i);
      if (s[i] === ' ') { t += step * 0.7; continue; }
      // vowels sit low and open, consonants sit high and short
      const vowel = 'AEIOU'.indexOf(s[i]) >= 0;
      const note = v.midi + ((ch % 7) - 3) * v.jump * 0.5 + (vowel ? -1 : 2) + (opts.pitch || 0);
      this.blip(c, t, Audio.freq(note), v, vowel ? v.len * 1.25 : v.len, (opts.gain || 1) * v.gain);
      t += step; n++;
    }
    stop.until = t;
    return stop;
  },
  blip(c, t, f, v, len, gain) {
    const o = c.createOscillator(); o.type = v.type; o.frequency.setValueAtTime(f, t);
    o.frequency.linearRampToValueAtTime(f * 1.04, t + len);
    const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = v.filt; flt.Q.value = v.q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16 * gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    if (v.vib) { const l = c.createOscillator(); l.frequency.value = 6.5; const lg = c.createGain(); lg.gain.value = v.vib; l.connect(lg); lg.connect(o.detune); l.start(t); l.stop(t + len + 0.02); }
    o.connect(flt); flt.connect(g); g.connect(Audio.sfxGain || Audio.master);
    o.start(t); o.stop(t + len + 0.02);
  },
  // The two-tone chime before every announcement anybody has ever ignored.
  chime(kind = 'plane') {
    if (!Audio.ctx || Audio.muted) return;
    const c = Audio.ctx, t = c.currentTime;
    const seq = kind === 'plane' ? [[880, 0], [660, 0.26]]
      : kind === 'station' ? [[988, 0], [1319, 0.16], [988, 0.32], [660, 0.48]]
      : [[660, 0], [880, 0.2], [1100, 0.4]];
    for (const [f, d] of seq) {
      const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = f;
      const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.01;
      const g = c.createGain(); g.gain.setValueAtTime(0.0001, t + d);
      g.gain.linearRampToValueAtTime(0.16, t + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5);
      o.connect(g); o2.connect(g); g.connect(Audio.sfxGain || Audio.master);
      o.start(t + d); o.stop(t + d + 0.55); o2.start(t + d); o2.stop(t + d + 0.55);
    }
  },
};
