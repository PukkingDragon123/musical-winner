// ---------- Playable instruments: you touch the note, not a button ----------
// Every surface here answers the same two questions: draw yourself, and tell me
// which note is under this finger. Nothing has a letter on it, because a real
// instrument does not either — you find the note by where it sits.
'use strict';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const IS_BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
const noteName = (m) => NOTE_NAMES[((m % 12) + 12) % 12];
const octaveOf = (m) => Math.floor(m / 12) - 1;

// ---------- PIANO ----------
// A real keyboard: white keys with the black ones sitting between them in the
// right places, so the shape of the octave is the thing you learn to read.
class PianoSurface {
  // lo/hi are MIDI notes; the keyboard covers whole octaves around them
  constructor(lo, hi) {
    this.lo = Math.max(21, lo - ((lo % 12) === 0 ? 0 : (lo % 12)));    // start on a C
    this.hi = Math.min(108, hi + (11 - (hi % 12)));                    // end on a B
    this.whites = []; this.blacks = [];
    for (let m = this.lo; m <= this.hi; m++) (IS_BLACK[m % 12] ? this.blacks : this.whites).push(m);
  }
  layout(x, y, w, h) {
    const nW = this.whites.length;
    const kw = Math.max(9, Math.floor(w / nW)), used = kw * nW;
    const x0 = Math.round(x + (w - used) / 2);
    this.geo = { x: x0, y: Math.round(y), w: used, h: Math.round(h), kw, bw: Math.max(5, Math.round(kw * 0.62)), bh: Math.round(h * 0.6) };
    this.slots = {};
    this.whites.forEach((m, i) => { this.slots[m] = { m, x: x0 + i * kw, y: this.geo.y, w: kw, h: this.geo.h, black: false, cx: x0 + i * kw + kw / 2 }; });
    // a black key hangs on the seam between the two whites it sits between
    for (const m of this.blacks) {
      const wi = this.whites.filter(w2 => w2 < m).length;          // whites to its left
      const bx = x0 + wi * kw - Math.round(this.geo.bw / 2);
      this.slots[m] = { m, x: bx, y: this.geo.y, w: this.geo.bw, h: this.geo.bh, black: true, cx: bx + this.geo.bw / 2 };
    }
    return this.geo;
  }
  // Black keys sit on top, so they get first refusal on a tap.
  noteAt(px2, py) {
    const g = this.geo; if (!g) return null;
    if (py < g.y || py > g.y + g.h) return null;
    for (const m of this.blacks) { const s = this.slots[m]; if (px2 >= s.x && px2 < s.x + s.w && py < s.y + s.h) return m; }
    for (const m of this.whites) { const s = this.slots[m]; if (px2 >= s.x && px2 < s.x + s.w) return m; }
    return null;
  }
  slotOf(m) { return this.slots ? this.slots[m] : null; }
  // lit: {midi: strength}. ghost: notes to outline as a hint, without filling.
  draw(ctx, opts = {}) {
    const g = this.geo; if (!g) return;
    const lit = opts.lit || {}, ghost = opts.ghost || {}, held = opts.held || {};
    // the case the keys are set into
    rect(ctx, g.x - 6, g.y - 9, g.w + 12, g.h + 15, '#2a2029');
    rect(ctx, g.x - 6, g.y - 9, g.w + 12, 2, '#4a3c48');
    rect(ctx, g.x - 5, g.y - 7, g.w + 10, 5, '#16121a');
    rect(ctx, g.x - 5, g.y - 3, g.w + 10, 1, '#5c4a58');
    for (const m of this.whites) {
      const s = this.slots[m], on = lit[m] || 0, hd = held[m], down = on > 0 || hd;
      const dy = down ? 2 : 0;
      rect(ctx, s.x, s.y + dy, s.w - 1, s.h, '#1a1418');
      const face = hd ? '#ffe9a8' : on > 0 ? mixColor('#f6f2e6', '#ffd24a', clamp(on, 0, 1)) : '#f6f2e6';
      rect(ctx, s.x + 1, s.y + 1 + dy, s.w - 3, s.h - 2, face);
      // ivory: warm at the top, worn grey along the front lip
      rect(ctx, s.x + 1, s.y + 1 + dy, s.w - 3, 2, lighten(face, 0.08));
      rect(ctx, s.x + 1, s.y + s.h - 4 + dy, s.w - 3, 3, darken(face, 0.1));
      rect(ctx, s.x + s.w - 3, s.y + 1 + dy, 1, s.h - 2, darken(face, 0.16));
      if (ghost[m]) { frame(ctx, s.x + 2, s.y + s.h - 16 + dy, s.w - 5, 13, '#4d86c6'); rect(ctx, s.x + 3, s.y + s.h - 15 + dy, s.w - 7, 11, 'rgba(77,134,198,0.3)'); }
      // C is marked, the way a beginner marks their own keyboard
      if (m % 12 === 0) drawText(ctx, 'C' + octaveOf(m), s.cx, s.y + s.h - 11 + dy, '#b0a694', { align: 'center', font: 'small' });
    }
    for (const m of this.blacks) {
      const s = this.slots[m], on = lit[m] || 0, hd = held[m], down = on > 0 || hd;
      const dy = down ? 2 : 0;
      rect(ctx, s.x, s.y + dy, s.w, s.h, '#0e0b12');
      const face = hd ? '#e0b040' : on > 0 ? mixColor('#332c3a', '#ffd24a', clamp(on, 0, 1)) : '#332c3a';
      rect(ctx, s.x + 1, s.y + dy, s.w - 2, s.h - 3, face);
      rect(ctx, s.x + 1, s.y + dy, s.w - 2, 1, lighten(face, 0.22));
      rect(ctx, s.x + 1, s.y + s.h - 5 + dy, s.w - 2, 2, darken(face, 0.3));
      if (ghost[m]) frame(ctx, s.x, s.y + s.h - 14 + dy, s.w, 12, '#4d86c6');
    }
  }
}

// ---------- GUITAR ----------
// A fretboard laid flat: six strings, five frets. You pick the spot, which
// means you have to know where a note lives on the neck.
const GTR_TUNING = [40, 45, 50, 55, 59, 64];     // E A D G B e, low string first
class FretSurface {
  constructor(strings, frets) { this.S = strings || GTR_TUNING.slice(); this.F = frets || 5; }
  midiAt(str, fret) { return this.S[str] + fret; }
  layout(x, y, w, h) {
    const nutW = 12, fw = Math.floor((w - nutW) / this.F), sh = Math.floor(h / this.S.length);
    this.geo = { x: Math.round(x), y: Math.round(y), w: nutW + fw * this.F, h: sh * this.S.length, fw, sh, nutW };
    return this.geo;
  }
  // Where a stopped note sits: the middle of the fret, on its string.
  spot(str, fret) {
    const g = this.geo; if (!g) return null;
    const sy = g.y + g.sh * (this.S.length - 1 - str) + g.sh / 2;
    const sx = fret === 0 ? g.x + g.nutW / 2 : g.x + g.nutW + (fret - 1) * g.fw + g.fw / 2;
    return { x: Math.round(sx), y: Math.round(sy), str, fret, m: this.midiAt(str, fret) };
  }
  // Every place on the neck that sounds this pitch, nearest the nut first.
  spotsFor(midi) {
    const out = [];
    for (let s = 0; s < this.S.length; s++) { const f = midi - this.S[s]; if (f >= 0 && f <= this.F) out.push(this.spot(s, f)); }
    return out.sort((a, b) => a.fret - b.fret);
  }
  noteAt(px2, py) {
    const g = this.geo; if (!g) return null;
    if (px2 < g.x || px2 > g.x + g.w || py < g.y || py > g.y + g.h) return null;
    const row = clamp(Math.floor((py - g.y) / g.sh), 0, this.S.length - 1);
    const str = this.S.length - 1 - row;
    const fret = px2 < g.x + g.nutW ? 0 : clamp(Math.floor((px2 - g.x - g.nutW) / g.fw) + 1, 1, this.F);
    return { m: this.midiAt(str, fret), str, fret };
  }
  draw(ctx, opts = {}) {
    const g = this.geo; if (!g) return;
    const lit = opts.lit || {}, ghost = opts.ghost || {};
    const n = this.S.length;
    // the neck: bound edges, a rosewood board, and the body butting in at the
    // end, so what you are looking at is a guitar and not a brown rectangle
    rect(ctx, g.x - 5, g.y - 7, g.w + 10, g.h + 14, '#2a1a12');
    rect(ctx, g.x - 4, g.y - 6, g.w + 8, 4, '#e8dcc0');        // binding, top
    rect(ctx, g.x - 4, g.y + g.h + 2, g.w + 8, 4, '#cdbf9e');  // binding, bottom
    rect(ctx, g.x - 4, g.y - 6, g.w + 8, 1, '#fff6e2');
    const board = cached('fbd2|' + g.w + '|' + g.h, () => {
      const P = new Pix(g.w, g.h), m = P.mask(); P.mRect(m, 0, 0, g.w, g.h);
      P.fill(m, '#5c3b2c', { shade: false });
      P.wood(m, 7, 0.12); P.grain(m, 0.06, 3);
      P.ditherTo(m, '#472c21', (x, y) => clamp(Math.abs(y - g.h / 2) / (g.h / 2), 0, 1) * 0.6);
      return P.toCanvas();
    });
    ctx.drawImage(board, g.x, g.y);
    // the nut, then fretwire with a shadow under each one
    for (let f = 1; f <= this.F; f++) {
      const fx = g.x + g.nutW + f * g.fw;
      rect(ctx, fx - 2, g.y, 1, g.h, 'rgba(0,0,0,0.35)');
      rect(ctx, fx - 1, g.y, 2, g.h, '#b9bcc8'); rect(ctx, fx - 1, g.y, 1, g.h, '#eef2fa');
    }
    rect(ctx, g.x + g.nutW - 4, g.y, 4, g.h, '#efe6ce');
    rect(ctx, g.x + g.nutW - 4, g.y, 1, g.h, '#fffaea');
    rect(ctx, g.x + g.nutW, g.y, 1, g.h, 'rgba(0,0,0,0.4)');
    // position dots where a guitar actually has them, doubled at the twelfth
    for (const f of [3, 5, 7, 9, 12]) {
      if (f > this.F) continue;
      const sp = this.spot(0, f), cy = g.y + g.h / 2;
      const ys = f === 12 ? [cy - g.sh, cy + g.sh] : [cy];
      for (const yy of ys) { ellipsePx(ctx, sp.x, yy, 3, 3, '#b8ab8a'); ellipsePx(ctx, sp.x, yy - 1, 3, 2, '#eee4c6'); }
    }
    // strings: thick and bronze at the bottom, thin and bright at the top
    for (let s2 = 0; s2 < n; s2++) {
      const row = n - 1 - s2, sy = Math.round(g.y + g.sh * row + g.sh / 2);
      const th = s2 < 2 ? 3 : s2 < 4 ? 2 : 1;
      const col = s2 < 3 ? '#cdb079' : '#e2e2ea';
      rect(ctx, g.x, sy + th, g.w, 1, 'rgba(0,0,0,0.4)');
      rect(ctx, g.x, sy, g.w, th, col);
      rect(ctx, g.x, sy, g.w, 1, lighten(col, 0.3));
      // the winding on a wound string, as a fine stripe
      if (s2 < 3) for (let x = g.x; x < g.x + g.w; x += 3) rect(ctx, x, sy + th - 1, 1, 1, darken(col, 0.22));
    }
    // a hint ring, then the finger that lands on it
    for (const key in ghost) { const sp = ghost[key]; if (!sp) continue; ellipseRingPx(ctx, sp.x, sp.y, 9, 8, '#4d86c6'); ellipseRingPx(ctx, sp.x, sp.y, 8, 7, '#2f5a8a'); }
    for (const key in lit) {
      const l = lit[key]; if (!l || !l.sp) continue;
      const k = clamp(l.k, 0, 1);
      ellipsePx(ctx, l.sp.x, l.sp.y, 10, 9, withAlpha('#ffd24a', 0.3 * k));
      ellipsePx(ctx, l.sp.x, l.sp.y, 7, 6, '#1d1620');
      ellipsePx(ctx, l.sp.x, l.sp.y, 6, 5, '#ffe9a8');
      ellipsePx(ctx, l.sp.x - 1, l.sp.y - 1, 3, 2, '#fff8e0');
    }
    // string names down the nut, the one label a real neck does carry
    const NAMES = ['E', 'A', 'D', 'G', 'B', 'e'];
    for (let s2 = 0; s2 < n; s2++) {
      const row = n - 1 - s2, sy = Math.round(g.y + g.sh * row + g.sh / 2);
      drawText(ctx, NAMES[s2] || noteName(this.S[s2]), g.x - 7, sy - 2, '#8a7f6a', { align: 'right', font: 'small' });
    }
  }
}

// Build the surface an instrument is played on, sized to the range of the tune
// so every note in it is reachable without scrolling the neck or the keyboard.
function makeSurface(instr, song) {
  const ns = ((song && song.melody) || []).filter(n => n[0] > 0).map(n => n[0]);
  const lo = ns.length ? Math.min(...ns) : 60, hi = ns.length ? Math.max(...ns) : 72;
  if (instr.view === 'fret') {
    const tuning = instr.tuning || GTR_TUNING;
    const frets = instr.frets || 5;
    // slide the whole neck so the tune sits on it, the way a capo would
    const open = tuning[0], top = tuning[tuning.length - 1] + frets;
    let shift = 0;
    if (lo < open) shift = -Math.ceil((open - lo) / 12) * 12;
    else if (hi > top) shift = Math.ceil((hi - top) / 12) * 12;
    return new FretSurface(tuning.map(t => t + shift), frets);
  }
  const octs = instr.octaves || 2;
  // centre the keyboard on the tune, then widen until the tune fits inside it
  const mid = Math.round((lo + hi) / 2);
  let start = clamp(Math.floor((mid - octs * 6) / 12) * 12, 36, 84);
  let end = start + octs * 12 - 1;
  while (lo < start && start > 24) start -= 12;
  while (hi > end && end < 103) end += 12;
  return new PianoSurface(start, end);
}
// How far a tune has to move to sit on a given surface at all.
function fitToSurface(surface, notes) {
  if (!notes.length) return 0;
  const lo = Math.min(...notes), hi = Math.max(...notes);
  const sLo = surface.lo != null ? surface.lo : surface.S[0];
  const sHi = surface.hi != null ? surface.hi : surface.S[surface.S.length - 1] + surface.F;
  let shift = 0;
  while (lo + shift < sLo) shift += 12;
  while (hi + shift > sHi) shift -= 12;
  return shift;
}
