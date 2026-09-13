// ---------- Call and response: hear it, then play it back ----------
// This is how anybody actually learns a tune. The band plays you a phrase and
// you watch where it lands on the instrument; then it goes quiet and you play
// the same phrase back from memory. Get the pitches right and get them in
// time. The hints thin out as the run goes on until you are working by ear.
'use strict';

const EAR_JUDGE = { perfect: 0.07, great: 0.13, good: 0.2 };
// How much help you get, by difficulty. Early on the keys are outlined for
// you; later you are only told the first note; at the top, nothing.
function earHints(difficulty) {
  // One listen, always: hearing the same bar twice is dead air. What changes
  // with difficulty is how much the instrument tells you afterwards.
  if (difficulty <= 1) return { ghosts: 'all', callRepeats: 1 };
  if (difficulty <= 2) return { ghosts: 'all', callRepeats: 1 };
  if (difficulty <= 4) return { ghosts: 'first', callRepeats: 1 };
  return { ghosts: 'none', callRepeats: 1 };
}

class EarGame {
  // song: {beat, bars, tune:{notes}}; surface: PianoSurface|FretSurface
  constructor(song, surface, mods = {}, hooks = {}) {
    this.song = song; this.surface = surface; this.mods = mods; this.hooks = hooks;
    this.difficulty = mods.difficulty || 1;
    this.hint = earHints(this.difficulty);
    this.beat = song.beat;
    this.barsPerPhrase = this.difficulty >= 5 ? 4 : 2;
    this.phrases = this.buildPhrases();
    // In a three-song set each number is a few phrases: the show has to move.
    if (mods.maxPhrases) this.phrases = this.phrases.slice(0, mods.maxPhrases);
    this.pi = 0; this.phase = 'lead'; this.phaseT = 0; this.repeat = 0;
    this.now = -song.leadIn; this.startTime = null; this.finished = false;
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.combo = 0; this.maxCombo = 0; this.hype = 25; this.lastMilestone = 0;
    this.events = { perfects: 0, misses: 0, cheer: 0 };
    this.popups = []; this.bursts = []; this.fx = new Particles();
    this.lit = {}; this.held = {}; this.receptors = {}; this.flashes = {};
    this.beatPulse = 0; this.lastBeat = -1; this.onBeat = false;
    this.safetyLeft = mods.safetyNet || 0;
    this.notesTotal = this.phrases.reduce((n, p) => n + p.notes.length, 0);
    this.hypeScale = clamp(190 / Math.max(1, this.notesTotal), 1, 3);
    this.wrongT = 0; this.lastWrong = null;
  }
  // Chop the tune into singable phrases, dropping rests off the ends so each
  // one starts on a note the way a phrase you would hum does.
  buildPhrases() {
    const src = this.song.melody || [];
    const span = this.beat * 4 * this.barsPerPhrase;
    const out = []; let t = 0, cur = { notes: [], start: 0, end: span };
    for (const [midi, beats] of src) {
      const dur = beats * this.beat;
      if (t >= cur.end) { if (cur.notes.length) out.push(cur); cur = { notes: [], start: Math.floor(t / span) * span, end: (Math.floor(t / span) + 1) * span }; }
      if (midi > 0) cur.notes.push({ midi, t: t - cur.start, dur: Math.min(dur, this.beat * 1.5) });
      t += dur;
    }
    if (cur.notes.length) out.push(cur);
    // A phrase of one note is not a phrase; fold it into its neighbour.
    const merged = [];
    for (const p of out) {
      if (p.notes.length <= 1 && merged.length) { const last = merged[merged.length - 1]; const off = p.start - last.start; for (const n of p.notes) last.notes.push({ midi: n.midi, t: n.t + off, dur: n.dur }); last.len = Math.max(last.len || span, off + span); }
      else merged.push(Object.assign({ len: span }, p));
    }
    return merged.length ? merged : [{ notes: [{ midi: 60, t: 0, dur: this.beat }], start: 0, len: span }];
  }
  get phrase() { return this.phrases[Math.min(this.pi, this.phrases.length - 1)]; }
  // How far through the set you are: phrases done, plus where you are in this
  // one. The song's own clock is no use here because every phrase runs twice.
  get progress() {
    const n = Math.max(1, this.phrases.length);
    const within = clamp(this.phaseT / Math.max(0.001, this.phraseLen), 0, 1);
    const half = this.phase === 'response' ? 0.5 + within * 0.5 : this.phase === 'call' ? within * 0.5 : 0;
    return clamp((this.pi + half) / n, 0, 1);
  }
  // Roughly how long the whole thing runs, so the band knows how much to play.
  get totalLength() {
    return this.song.leadIn + this.phrases.reduce((a, p) => a + (p.len || 0) * (1 + this.hint.callRepeats), 0) + 2;
  }
  get phraseLen() { return this.phrase.len || this.beat * 4 * this.barsPerPhrase; }
  // What the scene shows in the corner: what you are meant to be doing.
  get prompt() {
    if (this.phase === 'lead') return { text: 'LISTEN', color: '#6fb8ff' };
    if (this.phase === 'call') return { text: 'LISTEN', color: '#6fb8ff' };
    if (this.phase === 'response') return { text: 'YOUR TURN', color: '#ffd24a' };
    return { text: '', color: '#fff' };
  }
  // ---- what the gig scene expects of any play mode
  get instrument() { return this.instr || INSTRUMENTS.piano; }
  get section() { return this._sec || (this._sec = { instrument: this.instrKey || 'piano', qte: false, member: this.member || null, start: 0, end: this.song.length }); }
  get sections() { return this.phrases.map((p, i) => ({ start: p.start, end: p.start + (p.len || 0), qte: false, idx: i })); }
  get notes() { return []; }
  // The computer keyboard is laid out the way a tracker lays one out, so the
  // same two rows are an octave apart and the black keys sit where they look.
  static get KEYMAP() {
    return EarGame._km || (EarGame._km = (() => {
      const rows = ['KeyZ', 'KeyS', 'KeyX', 'KeyD', 'KeyC', 'KeyV', 'KeyG', 'KeyB', 'KeyH', 'KeyN', 'KeyJ', 'KeyM',
                    'KeyQ', 'Digit2', 'KeyW', 'Digit3', 'KeyE', 'KeyR', 'Digit5', 'KeyT', 'Digit6', 'KeyY', 'Digit7', 'KeyU'];
      const m = {}; rows.forEach((c, i) => { m[c] = i; }); return m;
    })());
  }
  baseNote() {
    if (this._base != null) return this._base;
    const s2 = this.surface;
    this._base = s2.lo != null ? s2.lo : s2.S[0];
    return this._base;
  }
  keyDown(code) {
    const off = EarGame.KEYMAP[code];
    if (off == null) return;
    const midi = this.baseNote() + off;
    if (this.held[midi]) return;
    let sp = null;
    if (this.surface.slotOf) { const sl = this.surface.slotOf(midi); if (sl) sp = { x: sl.cx, y: sl.y + 16 }; }
    else { const s3 = this.surface.spotsFor(midi)[0]; if (s3) sp = s3; }
    this.press(midi, sp);
  }
  keyUp(code) { const off = EarGame.KEYMAP[code]; if (off != null) this.release(this.baseNote() + off); }
  begin(audioTime) { this.startTime = audioTime; }
  win(k) { return EAR_JUDGE[k] * (this.mods.windowMult || 1); }
  judgeDt(dt) { const a = Math.abs(dt); if (a <= this.win('perfect')) return 'perfect'; if (a <= this.win('great')) return 'great'; if (a <= this.win('good')) return this.mods.tuner ? 'great' : 'good'; return 'miss'; }

  // ---- what should be lit right now, and what the player is allowed a hint on
  ghostsNow() {
    if (this.phase !== 'response') return {};
    const g = {}; const ns = this.expect || [];
    if (this.hint.ghosts === 'all') { for (const n of ns) if (!n.judged) g[n.midi] = 1; }
    else if (this.hint.ghosts === 'first') { const n = ns.find(x => !x.judged); if (n) g[n.midi] = 1; }
    return g;
  }

  update(dt) {
    if (this.startTime != null) this.now = Audio.now() - this.startTime;
    // `events` is what happened THIS frame, not a running total: the crowd
    // reads it every tick to decide whether to cheer, tip or walk off.
    this.events = { perfects: 0, misses: 0, cheer: 0 };
    this.phaseT += dt;
    const beatPos = ((this.now % this.beat) + this.beat) % this.beat;
    this.beatPulse = 1 - beatPos / this.beat;
    const bi = Math.floor(this.now / this.beat);
    this.onBeat = bi !== this.lastBeat; this.lastBeat = bi;
    for (const k in this.lit) { this.lit[k] -= dt * 3.5; if (this.lit[k] <= 0) delete this.lit[k]; }
    for (const k in this.flashes) { this.flashes[k] = Math.max(0, this.flashes[k] - dt); }
    for (const p of this.popups) p.t += dt; this.popups = this.popups.filter(p => p.t < (p.big ? 1.1 : 0.6));
    for (const b of this.bursts) b.t += dt * 1.4; this.bursts = this.bursts.filter(b => b.t < 1);
    this.wrongT = Math.max(0, this.wrongT - dt);
    this.fx.update(dt);

    switch (this.phase) {
      case 'lead':
        // count the band in, then start the first call
        if (this.now >= 0) { this.startCall(); }
        break;
      case 'call': {
        // play the phrase at the player, lighting each note as it sounds
        const p = this.phrase;
        for (const n of p.notes) {
          if (n.played) continue;
          if (this.phaseT >= n.t) {
            n.played = true; this.lit[n.midi] = 1;
            Audio.note(this.mods.voiceOverride || this.voice || 'piano', n.midi, 0, Math.max(0.22, n.dur), 0.5);
            if (this.hooks.onDemo) this.hooks.onDemo(n);
          }
        }
        if (this.phaseT >= this.phraseLen) {
          this.repeat++;
          if (this.repeat < this.hint.callRepeats) { for (const n of p.notes) n.played = false; this.phaseT = 0; }
          else this.startResponse();
        }
        break;
      }
      case 'response': {
        // anything you did not play in time is a missed note
        for (const n of this.expect) {
          if (n.judged) continue;
          if (this.phaseT > n.t + this.win('good') + 0.02) { n.judged = true; this.applyJudge('miss', n); }
        }
        if (this.phaseT >= this.phraseLen + 0.25) this.endPhrase();
        break;
      }
    }
  }
  startCall() {
    const p = this.phrase; for (const n of p.notes) n.played = false;
    this.phase = 'call'; this.phaseT = 0; this.repeat = 0;
    if (this.hooks.onPhase) this.hooks.onPhase('call', this.pi, this.phrases.length);
  }
  startResponse() {
    this.phase = 'response'; this.phaseT = 0;
    this.expect = this.phrase.notes.map(n => ({ midi: n.midi, t: n.t, dur: n.dur, judged: false }));
    if (this.hooks.onPhase) this.hooks.onPhase('response', this.pi, this.phrases.length);
  }
  endPhrase() {
    this.pi++;
    if (this.pi >= this.phrases.length) { this.finished = true; this.phase = 'done'; return; }
    this.startCall();
  }
  // ---- the player played a pitch
  press(midi, spot) {
    if (this.finished) return null;
    this.held[midi] = true;
    if (this.phase !== 'response') {
      // noodling between phrases still makes a sound, it just does not score
      Audio.note(this.voice || 'piano', midi, 0, 0.3, 0.3);
      this.lit[midi] = 0.6;
      return null;
    }
    // the nearest note still owed, that this pitch could be
    let best = null, bestD = Infinity;
    for (const n of this.expect) {
      if (n.judged || n.midi !== midi) continue;
      const d = Math.abs(this.phaseT - n.t); if (d < bestD) { bestD = d; best = n; }
    }
    const w = this.win('good') + 0.06;
    if (best && bestD <= w) {
      const j = this.judgeDt(this.phaseT - best.t);
      best.judged = true; best.hit = j !== 'miss';
      Audio.note(this.voice || 'piano', midi, 0, Math.max(0.25, best.dur), j === 'perfect' ? 0.6 : 0.45);
      this.lit[midi] = 1;
      this.applyJudge(j, best, { spot });
      return j;
    }
    // Wrong note, or right note at the wrong moment. Both cost you, and the
    // game says which so you can hear what you did.
    const owed = this.expect.find(n => !n.judged);
    const wrongPitch = !best;
    Audio.note(this.voice || 'piano', midi, 0, 0.22, 0.3);
    Audio.ui('error');
    this.lit[midi] = 0.8;
    this.wrongT = 0.6; this.lastWrong = { midi, want: owed ? owed.midi : null, pitch: wrongPitch };
    this.applyJudge('miss', owed || { midi, t: this.phaseT }, { wrong: true, spot, pitch: wrongPitch });
    if (owed && wrongPitch) owed.judged = true;
    return 'miss';
  }
  release(midi) { delete this.held[midi]; }

  // Two judgements in the same instant would print on top of each other and
  // read as neither, so a new popup steps up off any that are still on screen.
  pushPopup(p) {
    let y = p.y;
    for (let guard = 0; guard < 6; guard++) {
      if (!this.popups.some(q => Math.abs(q.y - y) < 11 && Math.abs((q.x || 0) - (p.x || 0)) < 80)) break;
      y -= 12;
    }
    p.y = y; this.popups.push(p);
  }
  applyJudge(j, note, opts = {}) {
    this.counts[j]++;
    const sp = opts.spot || this.receptors.main || { x: W / 2, y: H - 120 };
    if (j === 'miss') {
      if (this.safetyLeft > 0 && this.combo > 0) { this.safetyLeft--; this.popups.push({ text: 'SAFETY NET!', color: '#6fb8ff', t: 0, big: true }); }
      else this.combo = 0;
      this.events.misses++;
      this.hype = clamp(this.hype - 7 * (this.mods.missMult || 1), 0, 100);
      this.fx.burst(sp.x, sp.y, 7, { color: '#ff5a5a', speed: 50, life: 0.4, kind: 'px', gravity: 150 });
      const label = opts.wrong ? (opts.pitch ? 'WRONG NOTE' : 'OFF THE BEAT') : 'MISSED';
      this.pushPopup({ text: label, color: '#ff5a5a', t: 0, x: sp.x, y: sp.y - 18 });
    } else {
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (j === 'perfect') this.events.perfects++;
      let gain = (j === 'perfect' ? 2.6 : j === 'great' ? 1.5 : 0.5) * this.hypeScale;
      if (j === 'great' && this.mods.earplugs) gain = 2.6 * this.hypeScale;
      this.hype = clamp(this.hype + gain, 0, 100);
      const col = j === 'perfect' ? '#ffe14d' : j === 'great' ? '#6ff08a' : '#6fb8ff';
      this.fx.burst(sp.x, sp.y, j === 'perfect' ? 12 : 6, { color: [col, '#fff'], speed: j === 'perfect' ? 90 : 55, life: 0.45, kind: j === 'perfect' ? 'spark' : 'px', gravity: 60, size: 2 });
      this.fx.ring(sp.x, sp.y, col, 3, j === 'perfect' ? 18 : 12, 0.28);
      this.pushPopup({ text: j.toUpperCase(), color: col, t: 0, x: sp.x, y: sp.y - 18 });
      for (const ms of [10, 25, 50, 100]) if (this.combo === ms && this.lastMilestone < ms) {
        this.lastMilestone = ms;
        this.bursts.push({ x: sp.x, y: sp.y - 44, t: 0, text: ms >= 100 ? 'BY EAR!' : ms >= 50 ? 'LOCKED IN!' : ms >= 25 ? 'GOT IT!' : 'NICE!', color: ms >= 50 ? '#ff5a5a' : '#ffd24a', scale: 1 + ms / 160 });
        this.events.cheer++;
        if (this.mods.fx) this.mods.fx.shake.hit(4 + ms / 25, 0.25);
        if (this.hooks.onMilestone) this.hooks.onMilestone(ms);
      }
    }
    if (this.hooks.onJudge) this.hooks.onJudge(note, j, {});
  }
  // ---------- Rendering ----------
  // The instrument fills the bottom of the frame at a size you could actually
  // play, the venue stays visible behind it, and the only readout is a slim
  // strip showing the shape of the phrase you are working on.
  draw(ctx, A) {
    const isKeys = this.surface instanceof PianoSurface;
    // The instrument sits right down on the bottom edge of the frame, the way
    // it would if you were behind it: everything above it is the room.
    const kh = A.touch ? 112 : 104;
    const ky = A.y + A.h - kh - (A.touch ? 4 : 6);
    const kw = Math.min(A.w - 60, isKeys ? 740 : 490);
    const kx = A.x + (A.w - kw) / 2;
    const g = this.surface.layout(kx, ky, kw, kh);
    // a pool of light on the instrument, so it reads as the lit thing on stage
    lightPool(ctx, g.x + g.w / 2, g.y + g.h / 2, g.w * 0.7, '#ffe0a0', 0.1);
    this.receptors.main = { x: g.x + g.w / 2, y: g.y - 10 };

    const ghosts = this.ghostsNow();
    if (isKeys) {
      this.surface.draw(ctx, { lit: this.lit, ghost: ghosts, held: this.held });
      for (const m in this.lit) { const sl = this.surface.slotOf(+m); if (sl) this.receptors[m] = { x: sl.cx, y: sl.y + 12 }; }
    } else {
      // on a neck, a pitch can live in more than one place: show the easiest
      const lit = {}, gh = {};
      for (const m in this.lit) { const sp = this.surface.spotsFor(+m)[0]; if (sp) { lit[m] = { sp, k: this.lit[m] }; this.receptors[m] = { x: sp.x, y: sp.y }; } }
      for (const m in ghosts) { const sp = this.surface.spotsFor(+m)[0]; if (sp) gh[m] = sp; }
      this.surface.draw(ctx, { lit, ghost: gh, t: this.now });
    }

    this.drawPhraseStrip(ctx, A, g);
    this.drawPrompt(ctx, A, g);
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
    this.fx.draw(ctx);
    for (const b of this.bursts) { speedLines(ctx, b.x, b.y, 26 * b.scale, 70 * b.scale, 14, b.color, this.now, 0.35 * (1 - b.t)); comicBurst(ctx, b.x, b.y, b.text, b.color, b.t, b.scale); }
    ctx.restore();
    for (const p of this.popups) {
      const k = p.t / (p.big ? 1.1 : 0.6), pop = k < 0.15 ? 1 + (0.15 - k) * 4 : 1;
      ctx.globalAlpha = clamp(1 - k * 0.85 + 0.15, 0, 1);
      ctx.save(); ctx.translate(Math.round(p.x != null ? p.x : A.x + A.w / 2), Math.round((p.y != null ? p.y : A.y + 60) - k * 14));
      ctx.scale(pop, 1 / Math.max(0.7, pop));
      drawText(ctx, p.text, 0, 0, p.color, { align: 'center', scale: p.big ? 2 : 1, outline: '#1a1410' });
      ctx.restore(); ctx.globalAlpha = 1;
    }
    if (this.now < 0) {
      const left = Math.ceil(-this.now / this.beat), s2 = left > 0 ? String(left) : 'GO';
      ctx.globalAlpha = 0.9;
      drawText(ctx, s2, A.x + A.w / 2, A.y + A.h / 2 - 60, '#fff', { align: 'center', scale: 6, outline: '#1a1410' });
      ctx.globalAlpha = 1;
    }
  }
  // The phrase, written out as dots on a pitch ladder: how high each note sits
  // and when it lands. During your turn the dots you have already played fill
  // in, and the ones you have not are blank, so you can see what you owe.
  drawPhraseStrip(ctx, A, g) {
    const ns = this.phrase.notes; if (!ns.length) return;
    const w = Math.min(A.w - 120, 400), h = 58;
    const x = Math.round(A.x + (A.w - w) / 2), y = Math.round(g.y - h - 18);
    rect(ctx, x, y, w, h, 'rgba(10,8,18,0.86)');
    frame(ctx, x, y, w, h, '#6a5f9a');
    rect(ctx, x + 1, y + h - 2, w - 2, 1, '#2a2440');
    rect(ctx, x + 1, y + 1, w - 2, 1, '#6a5f9a');
    const lo = Math.min(...ns.map(n => n.midi)), hi = Math.max(...ns.map(n => n.midi));
    const span = Math.max(7, hi - lo);
    const px0 = x + 10, px1 = x + w - 10, len = this.phraseLen;
    // pitch rails, one per octave, so you can see the shape rise and fall
    for (let m = Math.ceil(lo / 12) * 12; m <= hi; m += 12) {
      const ry = Math.round(y + h - 8 - ((m - lo) / span) * (h - 18));
      ctx.globalAlpha = 0.22; rect(ctx, px0, ry, px1 - px0, 1, '#9a90d0'); ctx.globalAlpha = 1;
      drawText(ctx, 'C' + octaveOf(m), px0 - 2, ry - 3, '#6a5f9a', { align: 'right', font: 'small' });
    }
    const answering = this.phase === 'response';
    const exp = this.expect || [];
    ns.forEach((n, i) => {
      const nx = Math.round(px0 + (n.t / len) * (px1 - px0));
      const ny = Math.round(y + h - 8 - ((n.midi - lo) / span) * (h - 18));
      const e = answering ? exp[i] : null;
      const done = e && e.judged, ok = e && e.hit;
      let col = '#5a5490';
      if (this.phase === 'call') col = n.played ? '#6fb8ff' : '#3a3560';
      else if (answering) col = done ? (ok ? '#6be585' : '#ff5a5a') : '#ffd24a';
      rect(ctx, nx - 3, ny - 3, 7, 7, '#12101c');
      rect(ctx, nx - 2, ny - 2, 5, 5, col);
      rect(ctx, nx - 2, ny - 2, 5, 1, lighten(col, 0.3));
      if (!done && answering) { ctx.globalAlpha = 0.5; rect(ctx, nx - 1, ny - 1, 3, 1, '#fff6c8'); ctx.globalAlpha = 1; }
    });
    // the playhead, running through the phrase
    const k = clamp(this.phaseT / len, 0, 1);
    const hx = Math.round(px0 + k * (px1 - px0));
    rect(ctx, hx, y + 2, 1, h - 4, this.phase === 'call' ? '#6fb8ff' : '#ffd24a');
    rect(ctx, hx - 2, y + 2, 5, 2, this.phase === 'call' ? '#6fb8ff' : '#ffd24a');
  }
  drawPrompt(ctx, A, g) {
    const p = this.prompt; if (!p.text) return;
    const beat = this.phase === 'call' ? 0 : this.beatPulse * 2;
    const sc = this.phaseT < 0.4 ? 3 + (0.4 - this.phaseT) * 6 : 3;
    const pw = textWidth(p.text, { scale: Math.round(sc) }) + 28;
    const py2 = Math.round(g.y - 126 - beat);
    rect(ctx, A.x + A.w / 2 - pw / 2, py2 - 6, pw, Math.round(sc) * 7 + 12, 'rgba(10,8,18,0.8)');
    frame(ctx, A.x + A.w / 2 - pw / 2, py2 - 6, pw, Math.round(sc) * 7 + 12, p.color);
    drawText(ctx, p.text, A.x + A.w / 2, py2, p.color, { align: 'center', scale: Math.round(sc), outline: '#1a1410' });
    // how far through the tune you are
    const n = this.phrases.length, cw2 = 8;
    const bx = Math.round(A.x + A.w / 2 - (n * cw2) / 2);
    for (let i = 0; i < n; i++) rect(ctx, bx + i * cw2, Math.round(g.y - 100 - beat), cw2 - 2, 4, i < this.pi ? '#6be585' : i === this.pi ? '#ffd24a' : '#3a3560');
    // and what went wrong, named, for the half second after it happens
    if (this.wrongT > 0 && this.lastWrong) {
      ctx.globalAlpha = clamp(this.wrongT / 0.6, 0, 1);
      const lw = this.lastWrong;
      const msg = lw.pitch && lw.want != null
        ? 'YOU PLAYED ' + noteName(lw.midi) + '  -  IT WANTED ' + noteName(lw.want)
        : 'RIGHT NOTE, WRONG TIME';
      drawText(ctx, msg, A.x + A.w / 2, Math.round(g.y - 90), '#ff8a6a', { align: 'center', outline: '#1a1410' });
      ctx.globalAlpha = 1;
    }
  }
  // A whole phrase played clean is worth saying out loud.
  results() {
    const c = this.counts, total = c.perfect + c.great + c.good + c.miss;
    return { ...c, total, acc: total ? (c.perfect + c.great * 0.75 + c.good * 0.4) / total : 0, maxCombo: this.maxCombo };
  }
}
