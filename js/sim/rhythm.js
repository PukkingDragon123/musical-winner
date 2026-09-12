// ---------- Rhythm engine: judging, effects, instrument renderers, QTE ----------
'use strict';
const JUDGE = { perfect: 0.045, great: 0.09, good: 0.14 };
const JUDGE_COLOR = { perfect: '#ffe14d', great: '#6ff08a', good: '#6fb8ff', miss: '#ff5a5a' };
const HYPE_GAIN = { perfect: 2.4, great: 1.3, good: 0.4, miss: -7 };
const COMBO_MILESTONES = [20, 40, 70, 100, 150, 200, 300, 400];

class RhythmGame {
  // sections [{instrument, startBar, endBar, member, qte}] ; mods from collectMods + {difficulty, bossMod, fx:{shake}} ; hooks {onJudge, onCheer, onSection, onQte, onRoll, onBomb}
  constructor(song, sections, notes, mods, hooks = {}) {
    this.song = song; this.sections = sections; this.notes = notes; this.mods = mods; this.hooks = hooks;
    this.startTime = null; this.now = -song.leadIn;
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 }; this.combo = 0; this.maxCombo = 0; this.hype = 25;
    this.events = { perfects: 0, misses: 0, cheer: 0 }; this.popups = []; this.flashes = {}; this.milestoneIdx = 0;
    this.holds = {}; this.keysDown = new Set(); this.breath = 1; this.breathNote = null;
    this.valveMask = 0; this.valveEvalAt = null; this.valveGroupT = null; this.lastDon = { t: -1 };
    this.secIdx = 0; this.finished = false; this.bannerT = 0; this.safetyLeft = mods.safetyNet || 0;
    this.difficulty = mods.difficulty || 1; this.approach = clamp(1.8 - this.difficulty * 0.12, 0.85, 1.8);
    this.notesTotal = notes.filter(n => n.type !== 'bomb' && n.type !== 'roll').length + notes.filter(n => n.type === 'hold').length;
    this.hypeScale = clamp(230 / Math.max(1, this.notesTotal), 1, 2.8);
    this.fx = new Particles(); this.stringVib = {}; this.beatPulse = 0; this.lastBeat = -1; this.hitLog = [];
    sections.forEach((s, i) => { s.start = song.leadIn + s.startBar * 4 * song.beat; s.end = song.leadIn + s.endBar * 4 * song.beat; s.idx = i; });
    notes.forEach(n => { n.sec = sections.findIndex(s => n.t >= s.start - 0.001 && n.t < s.end + 0.001); if (n.sec < 0) n.sec = sections.length - 1; });
    this.receptors = {}; // lane -> {x,y} for effects
  }
  get section() { return this.sections[this.secIdx]; }
  get instrument() { return this.section.qte ? INSTRUMENTS[this.section.instrument] : INSTRUMENTS[this.section.instrument]; }
  get game() { return this.section.qte ? 'qte' : this.instrument.game; }
  get nextSection() { return this.sections[this.secIdx + 1]; }
  begin(audioTime) { this.startTime = audioTime; }
  win(kind) { let m = this.mods.windowMult || 1; return JUDGE[kind] * m; }
  judgeDt(dt) { const a = Math.abs(dt); if (a <= this.win('perfect')) return 'perfect'; if (a <= this.win('great')) return 'great'; if (a <= this.win('good')) return this.mods.tuner ? 'great' : 'good'; return 'miss'; }
  receptorOf(note) { const r = this.receptors[note.lane != null ? note.lane : 0] || this.receptors.main || { x: 0, y: 0 }; return r; }
  applyJudge(j, note, opts = {}) {
    this.counts[j]++;
    let gain = HYPE_GAIN[j];
    if (j === 'great' && this.mods.earplugs) gain = HYPE_GAIN.perfect;
    if (this.mods.bossMod === 'snob' && j !== 'perfect' && j !== 'miss') gain = 0;
    if (j !== 'miss') gain *= this.hypeScale;
    const r = this.receptorOf(note);
    if (j === 'miss') {
      gain *= this.mods.missMult || 1;
      if (this.safetyLeft > 0 && this.combo > 0) { this.safetyLeft--; this.popups.push({ text: 'SAFETY NET!', color: '#6fb8ff', t: 0, big: true }); }
      else this.combo = 0;
      this.events.misses++;
      this.fx.burst(r.x, r.y, 6, { color: '#ff5a5a', speed: 40, life: 0.4, kind: 'px', gravity: 160 });
    } else {
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (j === 'perfect') this.events.perfects++;
      const col = note.star ? '#ffd24a' : JUDGE_COLOR[j];
      this.fx.burst(r.x, r.y, j === 'perfect' ? 12 : 6, { color: [col, '#fff', lighten(col, 0.2)], speed: j === 'perfect' ? 90 : 55, life: 0.45, kind: j === 'perfect' ? 'spark' : 'px', gravity: 60, size: 2 });
      this.fx.ring(r.x, r.y, col, 3, j === 'perfect' ? 18 : 12, 0.28);
      if (note.star && j !== 'miss') { for (let i = 0; i < 8; i++) this.fx.add({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 80, life: 0.8, color: '#ffd24a', kind: 'star', size: 2, gravity: 140 }); if (this.mods.fx) this.mods.fx.shake.hit(2, 0.15); }
      if (note.type === 'big' && this.mods.fx) this.mods.fx.shake.hit(3, 0.2);
      if (this.milestoneIdx < COMBO_MILESTONES.length && this.combo >= COMBO_MILESTONES[this.milestoneIdx]) {
        this.milestoneIdx++; this.events.cheer++;
        this.popups.push({ text: this.combo + ' COMBO!', color: '#ff9fef', t: 0, big: true });
        for (let i = 0; i < 30; i++) this.fx.add({ x: r.x + (Math.random() - 0.5) * 200, y: r.y - 60 - Math.random() * 60, vx: (Math.random() - 0.5) * 40, vy: 20 + Math.random() * 40, life: 1.6, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][i % 5], kind: 'confetti', gravity: 20 });
        if (this.mods.fx) this.mods.fx.shake.hit(4, 0.3);
        if (this.hooks.onCheer) this.hooks.onCheer();
      }
    }
    this.hype = clamp(this.hype + gain, 0, 100);
    const info = { tail: !!opts.tail, qte: !!opts.qte };
    if (this.hooks.onJudge && !opts.qte) this.hooks.onJudge(note, j, info);
    this.popups.push({ text: j.toUpperCase() + (opts.suffix || ''), color: note.star && j !== 'miss' ? '#ffd24a' : JUDGE_COLOR[j], t: 0, x: r.x, y: r.y - 14 });
    this.hitLog.push({ t: this.now, j });
  }
  findNote(pred) {
    let best = null, bestD = Infinity; const w = this.win('good') + 0.05;
    for (const n of this.notes) { if (n.judged || n.sec !== this.secIdx) continue; if (n.t - this.now > w + 0.4) break; if (!pred(n)) continue; const d = Math.abs(n.t - this.now); if (d <= w && d < bestD) { best = n; bestD = d; } }
    return best;
  }
  playHit(note, j, hold) {
    const k = this.section.instrument; const ins = INSTRUMENTS[k];
    if (k === 'drums') { Audio.drum(note.type === 'ka' ? 'ka' : 'don', 0, j === 'perfect' ? 0.9 : 0.7); return null; }
    const vel = j === 'perfect' ? 0.55 : j === 'great' ? 0.45 : 0.35;
    const dur = hold ? Math.max(0.3, note.dur) + 0.3 : (k === 'tambourine' ? 0.1 : 0.35);
    return Audio.note(this.mods.voiceOverride || ins.voice || 'guitar', note.midi, 0, dur, vel);
  }
  hitBomb(n) { n.judged = true; n.hit = false; n.judge = 'bomb'; this.combo = 0; this.hype = clamp(this.hype - 10 * (this.mods.missMult || 1), 0, 100); this.counts.miss++; this.events.misses++; const r = this.receptorOf(n); this.fx.burst(r.x, r.y, 24, { color: ['#ff5a5a', '#ffb030', '#333'], speed: 120, life: 0.6, kind: 'fire', size: 3, gravity: -20 }); this.fx.ring(r.x, r.y, '#ff5a5a', 4, 30, 0.4); if (this.mods.fx) this.mods.fx.shake.hit(6, 0.35); this.popups.push({ text: 'BOMB!', color: '#ff5a5a', t: 0, big: true }); Audio.ui('pyro'); if (this.hooks.onBomb) this.hooks.onBomb(n); if (this.hooks.onJudge) this.hooks.onJudge(n, 'miss', { bomb: true }); }
  keyDown(code) {
    if (this.finished || this.startTime == null || this.keysDown.has(code)) return;
    this.keysDown.add(code);
    const g = this.game, instr = this.instrument;
    if (g === 'qte') {
      if (!['Space', 'KeyF', 'KeyJ', 'Enter', 'KeyD', 'KeyK'].includes(code)) return;
      const n = this.findNote(x => x.type === 'qte'); this.flashes.qte = 0.2;
      if (!n) { if (this.now > 0) Audio.drum('clunk', 0, 0.3); return; }
      const j = this.judgeDt(this.now - n.t); n.judged = true; n.hit = j !== 'miss'; n.judge = j;
      this.applyJudge(j, n, { qte: true, suffix: j !== 'miss' ? '!' : '' });
      if (n.hit) { Audio.note(INSTRUMENTS[this.section.instrument].voice || 'guitar', n.midi, 0, 0.5, 0.5); Audio.ui('pop'); } else Audio.drum('clunk', 0, 0.4);
      if (this.hooks.onQte) this.hooks.onQte(j);
      return;
    }
    if (g === 'lanes' || g === 'bow') {
      let lane = instr.keys.indexOf(code);
      if (g === 'bow') lane = (code === 'ArrowUp' || code === 'KeyW') ? 1 : (code === 'ArrowDown' || code === 'KeyS') ? 0 : -1;
      if (lane < 0) return;
      const roll = this.notes.find(n => n.type === 'roll' && n.sec === this.secIdx && n.lane === lane && this.now >= n.t - 0.05 && this.now <= n.t + n.dur + 0.05);
      if (roll) { roll.judged = true; roll.hits = (roll.hits || 0) + 1; this.hype = clamp(this.hype + 0.5, 0, 100); this.playHit(roll, 'great'); const r = this.receptorOf(roll); this.fx.burst(r.x, r.y, 4, { color: '#ffd166', speed: 50, life: 0.3 }); this.popups.push({ text: 'ROLL x' + roll.hits, color: '#ffd166', t: 0, x: r.x, y: r.y - 14 }); if (this.hooks.onRoll) this.hooks.onRoll(); this.flashes[lane] = 0.15; return; }
      const n = this.findNote(x => x.lane === lane && x.type !== 'roll');
      if (!n) { if (this.now > 0) { Audio.drum('clunk', 0, 0.4); this.flashes[lane] = 0.15; } return; }
      if (n.type === 'bomb') { this.hitBomb(n); return; }
      const j = this.judgeDt(this.now - n.t); n.judged = true; n.hit = j !== 'miss'; n.judge = j; this.flashes[lane] = 0.2;
      this.applyJudge(j, n);
      if (n.hit) { const v = this.playHit(n, j, n.type === 'hold'); if (n.type === 'hold') { n.holding = true; this.holds[lane] = n; n.voice = v; } }
      else if (n.type === 'hold') { n.tailJudged = true; this.counts.miss++; this.events.misses++; }
    } else if (g === 'taiko') {
      const isDon = code === 'KeyF' || code === 'KeyJ', isKa = code === 'KeyD' || code === 'KeyK'; if (!isDon && !isKa) return;
      this.flashes[isDon ? 'don' : 'ka'] = 0.15;
      const roll = this.notes.find(n => n.type === 'roll' && n.sec === this.secIdx && this.now >= n.t - 0.05 && this.now <= n.t + n.dur + 0.05);
      if (roll) { roll.judged = true; roll.hits = (roll.hits || 0) + 1; this.hype = clamp(this.hype + 0.6, 0, 100); Audio.drum(isDon ? 'don' : 'ka', 0, 0.6); const r = this.receptors.main; this.fx.burst(r.x, r.y, 5, { color: '#ffd166', speed: 60, life: 0.3 }); this.popups.push({ text: 'ROLL x' + roll.hits, color: '#ffd166', t: 0 }); if (this.hooks.onRoll) this.hooks.onRoll(); return; }
      if (isDon && this.lastDon.note && this.now - this.lastDon.t < 0.07 && this.lastDon.code !== code) { const n = this.lastDon.note; this.lastDon.note = null; if (n.type === 'big' && n.hit) { this.hype = clamp(this.hype + 2.5, 0, 100); this.popups.push({ text: 'BIG DON!', color: '#ff9f68', t: 0, big: true }); Audio.drum('don', 0, 1); Audio.drum('tom', 0, 0.6); if (this.mods.fx) this.mods.fx.shake.hit(5, 0.25); } return; }
      const n = this.findNote(x => x.type !== 'roll');
      if (!n) { if (this.now > 0) Audio.drum(isDon ? 'don' : 'ka', 0, 0.25); return; }
      if (n.type === 'bomb') { this.hitBomb(n); return; }
      const wantDon = n.type === 'don' || n.type === 'big'; let j = this.judgeDt(this.now - n.t); if (wantDon !== isDon) j = 'miss';
      n.judged = true; n.hit = j !== 'miss'; n.judge = j;
      this.applyJudge(j, n, { suffix: j === 'miss' && wantDon !== isDon && Math.abs(this.now - n.t) < this.win('good') ? ' (WRONG)' : '' });
      if (n.hit) { this.playHit(n, j); if (n.type === 'big') this.lastDon = { t: this.now, code, note: n }; } else Audio.drum('clunk', 0, 0.4);
    } else if (g === 'wind') {
      if (code !== 'Space') return;
      if (this.breath <= 0.02) { Audio.drum('clunk', 0, 0.3); return; }
      const n = this.findNote(() => true); this.flashes.wind = 0.2;
      if (!n) { if (this.now > 0) Audio.drum('clunk', 0, 0.3); return; }
      const j = this.judgeDt(this.now - n.t); n.judged = true; n.hit = j !== 'miss'; n.judge = j; this.applyJudge(j, n);
      if (n.hit) { n.holding = true; this.breathNote = n; n.voice = this.playHit(n, j, true); } else { n.tailJudged = true; this.counts.miss++; this.events.misses++; }
    } else if (g === 'valves') {
      const vi = instr.keys.indexOf(code); if (vi < 0) return;
      this.valveMask |= (1 << vi); if (this.valveGroupT == null) this.valveGroupT = this.now; this.valveEvalAt = this.now + 0.045; this.flashes['v' + vi] = 0.15;
    }
  }
  keyUp(code) {
    this.keysDown.delete(code); if (this.finished || this.startTime == null) return;
    const g = this.game, instr = this.instrument;
    if (g === 'lanes' || g === 'bow') { let lane = instr.keys.indexOf(code); if (g === 'bow') lane = (code === 'ArrowUp' || code === 'KeyW') ? 1 : (code === 'ArrowDown' || code === 'KeyS') ? 0 : -1; const n = this.holds[lane]; if (n && n.holding) this.releaseHold(n, lane); }
    else if (g === 'wind') { if (code === 'Space' && this.breathNote) this.releaseWind(this.breathNote); }
    else if (g === 'valves') { const vi = instr.keys.indexOf(code); if (vi >= 0) this.valveMask &= ~(1 << vi); }
  }
  releaseHold(n, lane) {
    n.holding = false; delete this.holds[lane]; if (n.voice) n.voice.off(); if (n.tailJudged) return; n.tailJudged = true;
    const early = (n.t + n.dur) - this.now;
    if (early > this.win('good')) this.applyJudge('miss', n, { suffix: ' (EARLY)', tail: true }); else this.applyJudge(early > this.win('great') ? 'good' : 'perfect', n, { suffix: ' HOLD', tail: true });
  }
  releaseWind(n) {
    n.holding = false; this.breathNote = null; if (n.voice) n.voice.off(); if (n.tailJudged) return; n.tailJudged = true;
    const dt = this.now - (n.t + n.dur); let j = this.judgeDt(dt); if (dt < -this.win('good')) j = 'miss';
    this.applyJudge(j, n, { suffix: j === 'miss' ? (dt < 0 ? ' (EARLY)' : ' (LATE)') : ' RELEASE', tail: true });
  }
  evalValves() {
    this.valveEvalAt = null; const groupT = this.valveGroupT; this.valveGroupT = null; const mask = this.valveMask;
    const n = this.findNote(() => true); if (!n) { if (this.now > 0) Audio.drum('clunk', 0, 0.3); return; }
    if (n.type === 'bomb') { this.hitBomb(n); return; }
    let j = this.judgeDt(groupT - n.t); const wrong = mask !== n.combo; if (wrong) j = 'miss';
    n.judged = true; n.hit = !wrong && j !== 'miss'; n.judge = j; this.applyJudge(j, n, { suffix: wrong ? ' (VALVES)' : '' });
    if (n.hit) this.playHit(n, j); else Audio.drum('clunk', 0, 0.4);
  }
  update(dt) {
    if (this.startTime == null) return;
    this.now = Audio.now() - this.startTime; this.events = { perfects: 0, misses: 0, cheer: 0 };
    while (this.secIdx < this.sections.length - 1 && this.now >= this.sections[this.secIdx + 1].start) {
      for (const l in this.holds) { const n = this.holds[l]; if (n.holding) this.releaseHold(n, l); }
      if (this.breathNote) this.releaseWind(this.breathNote);
      const prevKey = this.section.qte ? 'qte' : this.section.instrument;
      this.secIdx++; const nowKey = this.section.qte ? 'qte' : this.section.instrument;
      this.bannerT = prevKey !== nowKey ? 1.3 : 0; this.valveMask = 0; this.valveEvalAt = null; this.valveGroupT = null; this.keysDown.clear();
      if (this.hooks.onSection) this.hooks.onSection(this.section, this.secIdx === this.sections.length - 1);
    }
    const ns = this.nextSection;
    this.switchWarn = ns && (ns.qte ? 'qte' : ns.instrument) !== (this.section.qte ? 'qte' : this.section.instrument) && this.now > ns.start - 4 * this.song.beat && this.now < ns.start;
    for (const n of this.notes) {
      if (n.judged) continue; if (n.t - this.now > 0.5) break;
      if (this.now - n.t > this.win('good') + 0.02) {
        n.judged = true; n.hit = false; n.judge = 'miss';
        if (n.type === 'roll') { n.hits = n.hits || 0; continue; }
        if (n.type === 'bomb') { n.judge = 'dodged'; const r = this.receptorOf(n); this.popups.push({ text: 'DODGED', color: '#8ad8ff', t: 0, x: r.x, y: r.y - 14 }); if (this.hooks.onBombDodged) this.hooks.onBombDodged(); continue; }
        if (n.type === 'qte') { this.applyJudge('miss', n, { qte: true }); if (this.hooks.onQte) this.hooks.onQte('miss'); continue; }
        this.applyJudge('miss', n); if (n.type === 'hold') { n.tailJudged = true; this.counts.miss++; }
      }
    }
    for (const l in this.holds) { const n = this.holds[l]; if (n.holding && this.now >= n.t + n.dur) { n.tailJudged = true; n.holding = false; delete this.holds[l]; if (n.voice) n.voice.off(); this.applyJudge('perfect', n, { suffix: ' HOLD', tail: true }); } }
    if (this.breathNote) { const n = this.breathNote; this.breath = Math.max(0, this.breath - dt * 0.28); if (this.now > n.t + n.dur + this.win('good')) { n.tailJudged = true; this.applyJudge('miss', n, { suffix: ' (LATE)', tail: true }); n.holding = false; this.breathNote = null; if (n.voice) n.voice.off(); } else if (this.breath <= 0) { this.popups.push({ text: 'OUT OF BREATH', color: '#ff5a5a', t: 0 }); this.releaseWind(n); } }
    else if (this.keysDown.has('Space') && this.game === 'wind') this.breath = Math.max(0, this.breath - dt * 0.15); else this.breath = Math.min(1, this.breath + dt * 0.45);
    if (this.valveEvalAt != null && this.now >= this.valveEvalAt) this.evalValves();
    if (this.now > 0) this.hype = clamp(this.hype - dt * 0.7 * (this.mods.decay || 1) * (this.mods.bossMod === 'rain' ? 2 : 1), 0, 100);
    for (const p of this.popups) p.t += dt; this.popups = this.popups.filter(p => p.t < (p.big ? 1.2 : 0.55));
    for (const k in this.flashes) this.flashes[k] = Math.max(0, this.flashes[k] - dt);
    for (const k in this.stringVib) this.stringVib[k] = Math.max(0, this.stringVib[k] - dt * 2.6);
    this.bannerT = Math.max(0, this.bannerT - dt);
    const beatPos = ((this.now % this.song.beat) + this.song.beat) % this.song.beat; this.beatPulse = 1 - beatPos / this.song.beat;
    const beatIdx = Math.floor(this.now / this.song.beat); if (beatIdx !== this.lastBeat) { this.lastBeat = beatIdx; this.onBeat = true; } else this.onBeat = false;
    // combo fire along the receptor line
    if (this.combo >= 30 && Math.random() < dt * 40) { const rs = Object.values(this.receptors); const r = rs[Math.floor(Math.random() * rs.length)]; if (r) this.fx.add({ x: r.x + (Math.random() - 0.5) * 30, y: r.y + 2, vx: (Math.random() - 0.5) * 10, vy: -30 - Math.random() * 30, life: 0.5, color: '#ff9030', kind: 'fire', size: this.combo >= 70 ? 3 : 2, gravity: 0 }); }
    this.fx.update(dt);
    if (this.now >= this.song.length) this.finished = true;
  }
  results() { const c = this.counts, total = c.perfect + c.great + c.good + c.miss; return { ...c, total, acc: total ? (c.perfect + c.great * 0.75 + c.good * 0.4) / total : 0, maxCombo: this.maxCombo }; }

  // ---------- Rendering ----------
  noteAlpha(k) {
    if (this.mods.bossMod === 'fog') return clamp((k - 0.1) / 0.3, 0, 1);
    if (this.mods.bossMod === 'blackout') return k < 0.35 ? 1 : 0.08;
    return 1;
  }
  draw(ctx, A) {
    rect(ctx, A.x, A.y, A.w, A.h, '#0b0916');
    if (A.backdrop) { ctx.globalAlpha = 0.22; ctx.drawImage(A.backdrop, 0, 0, A.backdrop.width, A.backdrop.height, A.x, A.y, A.w, Math.round(A.h * 0.6)); ctx.globalAlpha = 1; }
    vgrad(ctx, A.x, A.y, A.w, A.h, 'rgba(30,20,60,0.55)', 'rgba(8,6,16,0.95)');
    const g = this.game;
    if (g === 'qte') this.drawQte(ctx, A); else if (g === 'lanes') this.drawLanes(ctx, A); else if (g === 'taiko') this.drawTaiko(ctx, A);
    else if (g === 'wind') this.drawWind(ctx, A); else if (g === 'valves') this.drawValves(ctx, A); else if (g === 'bow') this.drawBow(ctx, A);
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y - 40, A.w, A.h + 40); ctx.clip(); this.fx.draw(ctx); ctx.restore();
    this.drawHud(ctx, A);
  }
  drawHud(ctx, A) {
    if (this.combo >= 5) {
      const pop = this.onBeat ? 1 : 0, big = this.combo >= 50;
      drawText(ctx, this.combo, A.x + A.w / 2, A.y + 6 - pop, big ? '#ffd24a' : this.combo >= 25 ? '#ff9f68' : '#fff', { align: 'center', scale: big ? 4 : 3, outline: '#1a1410' });
      drawText(ctx, 'COMBO', A.x + A.w / 2, A.y + (big ? 34 : 28) - pop, '#cfc9e6', { align: 'center', font: 'small' });
    }
    for (const p of this.popups) {
      const k = p.t / (p.big ? 1.2 : 0.55), scale = p.big ? 2 : 1;
      const pop = k < 0.15 ? 1 + (0.15 - k) * 4 : 1;
      ctx.globalAlpha = clamp(1 - k * 0.8 + 0.2, 0, 1);
      const x = p.x != null ? p.x : A.x + A.w / 2, y = (p.y != null ? p.y : A.y + 40) - (p.big ? k * 16 : k * 10);
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(pop, 1 / Math.max(0.7, pop));
      drawText(ctx, p.text, 0, 0, p.color, { align: 'center', scale, outline: '#1a1410' }); ctx.restore(); ctx.globalAlpha = 1;
    }
    if (this.now < 0) {
      const beatsLeft = Math.ceil(-this.now / this.song.beat);
      const s = beatsLeft > 0 ? String(beatsLeft) : 'GO';
      const k = 1 - (((-this.now) % this.song.beat) / this.song.beat);
      ctx.globalAlpha = 0.9; drawText(ctx, s, A.x + A.w / 2, A.y + A.h / 2 - 30, '#fff', { align: 'center', scale: 5 + Math.round(k * 2), outline: '#1a1410' }); ctx.globalAlpha = 1;
    }
    if (this.bannerT > 0 && this.now > 0) {
      ctx.globalAlpha = clamp(this.bannerT, 0, 1); rect(ctx, A.x, A.y + A.h / 2 - 16, A.w, 32, 'rgba(0,0,0,0.82)');
      const t = this.section.qte ? (this.section.member ? this.section.member.name.toUpperCase() + '!' : 'BAND!') : this.instrument.name.toUpperCase();
      drawText(ctx, t, A.x + A.w / 2, A.y + A.h / 2 - 8, '#ffe14d', { align: 'center', scale: 2 }); ctx.globalAlpha = 1;
    }
    if (this.switchWarn) {
      const ns = this.nextSection, blink = Math.floor(this.now * 6) % 2 === 0;
      const label = ns.qte ? (ns.member ? ns.member.name.toUpperCase() : 'BAND') : INSTRUMENTS[ns.instrument].name.toUpperCase();
      rect(ctx, A.x + A.w - 120, A.y + 4, 116, 16, 'rgba(0,0,0,0.7)');
      ctx.drawImage(icon('arrowR'), A.x + A.w - 116, A.y + 8);
      drawText(ctx, label, A.x + A.w - 58, A.y + 9, blink ? '#ff9f68' : '#fff', { align: 'center', font: 'small' });
    }
    if (this.mods.metronome) { const r = 3 + Math.round(this.beatPulse * 3); circle(ctx, A.x + 14, A.y + 14, r, this.beatPulse > 0.8 ? '#ffe14d' : '#554a66'); }
  }
  beatLinesH(ctx, hitX, xEnd, top, h, pxPerSec) { for (let b = Math.ceil(this.now / this.song.beat); ; b++) { const x = hitX + (b * this.song.beat - this.now) * pxPerSec; if (x > xEnd) break; if (x > hitX - 60) rect(ctx, x, top, 1, h, b % 4 === 0 ? '#4a4070' : '#2a2448'); } }
  gemColor(n, lane) { return n.star ? '#ffd24a' : LANE_COLORS[lane % LANE_COLORS.length]; }
  drawGem(ctx, x, y, w, h, col, star, alpha, p) {
    ctx.globalAlpha = alpha;
    const r = Math.max(2, Math.round(h / 2));
    rect(ctx, x - w / 2, y - h / 2, w, h, '#120e1c');
    rect(ctx, x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, darken(col, 0.22));
    rect(ctx, x - w / 2 + 2, y - h / 2 + 1, w - 4, Math.max(1, h - 4), col);
    rect(ctx, x - w / 2 + 3, y - h / 2 + 2, w - 6, Math.max(1, Math.round(h / 3)), lighten(col, 0.3));
    if (star && w > 10) { drawText(ctx, '★', x, y - 4, '#fff8c0', { align: 'center', outline: darken(col, 0.4) }); }
    ctx.globalAlpha = 1;
  }
  drawLanes(ctx, A) {
    const instr = this.instrument, L = instr.lanes, kind = this.section.instrument;
    const hw = new Highway(A, L, { touch: A.touch, pads: A.pads });
    this.hw = hw;
    const cols = []; for (let l = 0; l < L; l++) cols.push(LANE_COLORS[l % LANE_COLORS.length]);
    // lane floor glow
    for (let l = 0; l < L; l++) {
      const steps = 10;
      for (let i = 0; i < steps; i++) {
        const k0 = i / steps, k1 = (i + 1) / steps; const a = hw.pos(l, k0), b = hw.pos(l, k1);
        ctx.globalAlpha = 0.1 + (this.flashes[l] > 0 ? this.flashes[l] * 0.5 : 0) * (1 - k0);
        ctx.fillStyle = cols[l]; ctx.beginPath();
        ctx.moveTo(a.x - a.w / 2 + 1, a.y); ctx.lineTo(a.x + a.w / 2 - 1, a.y); ctx.lineTo(b.x + b.w / 2 - 1, b.y); ctx.lineTo(b.x - b.w / 2 + 1, b.y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
    const isString = kind === 'guitar' || kind === 'bass';
    if (isString) drawFretboard(ctx, hw, this, { bass: kind === 'bass', beat: this.song.beat, now: this.now, approach: this.approach, time: this.now, laneColors: cols, bodyColor: kind === 'bass' ? '#3a2a5a' : '#8a3a22' });
    else {
      for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
        const k = (b * this.song.beat - this.now) / this.approach; if (k > 1) break; if (k < 0) continue;
        const p = persp(k), y = perspY(k, hw.nearY, hw.farY), hwid = (hw.nearW / 2) * p;
        rect(ctx, hw.cx - hwid, y, hwid * 2, b % 4 === 0 ? 2 : 1, b % 4 === 0 ? '#4a4278' : '#2a2450');
      }
      for (let l = 0; l <= L; l++) { const steps = 12; for (let i = 0; i < steps; i++) { const k0 = i / steps, k1 = (i + 1) / steps; const x0 = hw.cx + (hw.laneCx(Math.min(l, L - 1)) + (l === L ? hw.laneW / 2 : -hw.laneW / 2) - hw.cx) * persp(k0), x1 = hw.cx + (hw.laneCx(Math.min(l, L - 1)) + (l === L ? hw.laneW / 2 : -hw.laneW / 2) - hw.cx) * persp(k1); line(ctx, x0, perspY(k0, hw.nearY, hw.farY), x1, perspY(k1, hw.nearY, hw.farY), 'rgba(120,110,190,0.35)'); } }
      if (kind === 'piano') drawKeyboard(ctx, hw, this, { keys: instr.keys, laneColors: cols });
    }
    // receptors
    for (let l = 0; l < L; l++) {
      const x = hw.laneCx(l), held = this.keysDown.has(instr.keys[l]) || (this.flashes[l] || 0) > 0.05;
      this.receptors[l] = { x, y: hw.nearY };
      if (!isString && kind !== 'piano') {
        const w = hw.laneW - 8;
        rect(ctx, x - w / 2, hw.nearY - 5, w, 10, held ? cols[l] : '#181430');
        frame(ctx, x - w / 2, hw.nearY - 5, w, 10, held ? '#fff' : cols[l]);
      }
      if (held) { ctx.globalAlpha = 0.5; circle(ctx, x, hw.nearY, 12, cols[l]); ctx.globalAlpha = 1; }
      if (!A.touch && !isString && kind !== 'piano') drawText(ctx, instr.keyNames[l], x, hw.nearY + 12, '#ddd', { align: 'center', font: 'small' });
    }
    // notes, far to near
    const vis = [];
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      const k = (n.t - this.now) / this.approach; if (k > 1.02) break;
      if (n.type === 'hold' || n.type === 'roll') { if (n.judged && (n.tailJudged || !n.hit)) continue; if ((n.t + n.dur - this.now) / this.approach < -0.1) continue; }
      else { if (n.judged) continue; if (k < -0.12) continue; }
      vis.push({ n, k });
    }
    vis.sort((a, b) => b.k - a.k);
    for (const { n, k } of vis) {
      const kk = clamp(k, 0, 1), pos = hw.pos(n.lane, kk), alpha = this.noteAlpha(kk);
      const col = this.gemColor(n, n.lane);
      if (n.type === 'roll') {
        const k2 = clamp((n.t + n.dur - this.now) / this.approach, 0, 1); const p2 = hw.pos(n.lane, k2);
        ctx.globalAlpha = alpha; ctx.fillStyle = '#ffd166'; ctx.beginPath();
        ctx.moveTo(pos.x - pos.w * 0.3, pos.y); ctx.lineTo(pos.x + pos.w * 0.3, pos.y); ctx.lineTo(p2.x + p2.w * 0.3, p2.y); ctx.lineTo(p2.x - p2.w * 0.3, p2.y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff4c0'; ctx.beginPath();
        ctx.moveTo(pos.x - pos.w * 0.15, pos.y); ctx.lineTo(pos.x + pos.w * 0.15, pos.y); ctx.lineTo(p2.x + p2.w * 0.15, p2.y); ctx.lineTo(p2.x - p2.w * 0.15, p2.y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1; drawText(ctx, 'MASH', pos.x, pos.y - 16, '#ffd166', { align: 'center', font: 'small', outline: '#1a1410' }); continue;
      }
      if (n.type === 'bomb') { ctx.globalAlpha = alpha; const r = Math.max(3, 9 * pos.p); circle(ctx, pos.x, pos.y, r, '#1a1410'); circle(ctx, pos.x, pos.y, r - 1, '#c8302a'); circle(ctx, pos.x, pos.y, Math.max(1, r - 4), '#5a1a14'); const sp = Math.floor(this.now * 12) % 2; px(ctx, pos.x, pos.y - r - 2, sp ? '#ffd24a' : '#ff8030'); ctx.globalAlpha = 1; continue; }
      if (n.type === 'hold') {
        const k2 = clamp((n.t + n.dur - this.now) / this.approach, 0, 1); const p2 = hw.pos(n.lane, k2);
        const startK = n.holding ? 0 : kk, ps = hw.pos(n.lane, startK);
        ctx.globalAlpha = alpha * (n.holding ? 1 : 0.85); ctx.fillStyle = n.holding ? lighten(col, 0.2) : darken(col, 0.25); ctx.beginPath();
        ctx.moveTo(ps.x - ps.w * 0.22, ps.y); ctx.lineTo(ps.x + ps.w * 0.22, ps.y); ctx.lineTo(p2.x + p2.w * 0.22, p2.y); ctx.lineTo(p2.x - p2.w * 0.22, p2.y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = n.holding ? '#fff' : col; ctx.beginPath();
        ctx.moveTo(ps.x - ps.w * 0.08, ps.y); ctx.lineTo(ps.x + ps.w * 0.08, ps.y); ctx.lineTo(p2.x + p2.w * 0.08, p2.y); ctx.lineTo(p2.x - p2.w * 0.08, p2.y); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
        if (n.holding) { if (Math.random() < 0.6) this.fx.add({ x: hw.laneCx(n.lane) + (Math.random() - 0.5) * 10, y: hw.nearY, vx: (Math.random() - 0.5) * 30, vy: -50, life: 0.3, color: col, kind: 'px', gravity: 0 }); continue; }
      }
      if (n.judged) continue;
      this.drawGem(ctx, pos.x, pos.y, Math.max(6, pos.w * 0.82), Math.max(4, 11 * pos.p), col, n.star, alpha, pos.p);
    }
  }
  drawTaiko(ctx, A) {
    const hitX = A.x + 86, cy = A.y + A.h * (A.touch ? 0.56 : 0.5); const lineH = A.touch ? 70 : 66, lineTop = cy - lineH / 2;
    vgrad(ctx, A.x, lineTop, A.w, lineH, '#241a30', '#14101f');
    rect(ctx, A.x, lineTop, A.w, 2, '#4a3a60'); rect(ctx, A.x, lineTop + lineH, A.w, 2, '#4a3a60');
    const pxPerSec = (A.w - 100) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, lineTop + 2, lineH - 2, pxPerSec);
    ringPx(ctx, hitX, cy, 20, '#8a80b0'); ringPx(ctx, hitX, cy, 19, '#4a4270');
    this.receptors.main = { x: hitX, y: cy }; this.receptors[0] = this.receptors.main;
    const vis = [];
    for (const n of this.notes) { if (n.sec !== this.secIdx) continue; if (n.judged && n.type !== 'roll') continue; const x = hitX + (n.t - this.now) * pxPerSec; if (x > A.x + A.w + 24) break; if (x < A.x - 24 && n.type !== 'roll') continue; vis.push({ n, x }); }
    for (let i = vis.length - 1; i >= 0; i--) {
      const { n, x } = vis[i], alpha = this.noteAlpha((n.t - this.now) / this.approach);
      if (n.type === 'roll') { if (this.now > n.t + n.dur) continue; const xe = hitX + (n.t + n.dur - this.now) * pxPerSec, xs = Math.max(hitX, x); if (xe > A.x) { rect(ctx, xs, cy - 11, Math.max(0, xe - xs), 22, '#ffd166'); rect(ctx, xs, cy - 6, Math.max(0, xe - xs), 12, '#fff4c0'); circle(ctx, xe, cy, 11, '#ffd166'); circle(ctx, xs, cy, 11, '#ffd166'); drawText(ctx, 'MASH!', (xs + xe) / 2, cy - 24, '#ffd166', { align: 'center', outline: '#1a1410' }); } continue; }
      if (n.type === 'bomb') { ctx.globalAlpha = alpha; circle(ctx, x, cy, 10, '#1a1410'); circle(ctx, x, cy, 9, '#c8302a'); ctx.globalAlpha = 1; continue; }
      const big = n.type === 'big', r = big ? 17 : 12, col = n.type === 'ka' ? '#5bc0ff' : '#ff6b6b';
      ctx.globalAlpha = alpha;
      circle(ctx, x, cy + 2, r, 'rgba(0,0,0,0.35)');
      circle(ctx, x, cy, r, '#120e1c'); circle(ctx, x, cy, r - 1, n.star ? '#ffd24a' : darken(col, 0.15)); circle(ctx, x, cy, r - 4, n.star ? '#ffe89a' : col);
      ctx.globalAlpha = alpha * 0.6; circle(ctx, x - r / 3, cy - r / 3, Math.round(r / 3), '#fff'); ctx.globalAlpha = alpha;
      if (big) drawText(ctx, 'FJ', x, cy - 3, '#1a1410', { align: 'center' });
      ctx.globalAlpha = 1;
    }
    drawTaikoDrum(ctx, hitX, cy, 22, this.flashes.don || 0, this.flashes.ka || 0, this.now);
    drawText(ctx, 'D K', hitX, cy - 44, '#5bc0ff', { align: 'center', font: 'small' }); drawText(ctx, 'F J', hitX, cy + 38, '#ff6b6b', { align: 'center', font: 'small' });
  }
  drawWind(ctx, A) {
    const hitX = A.x + 110, top = A.y + (A.touch ? 22 : 34), bot = A.y + A.h - (A.touch ? 34 : 44);
    vgrad(ctx, A.x, top - 6, A.w, bot - top + 12, '#1c1630', '#120e20');
    for (let i = 0; i <= 4; i++) rect(ctx, A.x, top + (bot - top) * i / 4, A.w, 1, '#2e2650');
    const pxPerSec = (A.w - 130) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, top - 6, bot - top + 12, pxPerSec);
    rect(ctx, hitX, top - 8, 2, bot - top + 16, this.keysDown.has('Space') ? '#ffe14d' : '#7a7290');
    this.receptors.main = { x: hitX, y: (top + bot) / 2 }; this.receptors[0] = this.receptors.main;
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue; const xs = hitX + (n.t - this.now) * pxPerSec, xe = hitX + (n.t + n.dur - this.now) * pxPerSec;
      if (xs > A.x + A.w + 10) break; if (xe < A.x - 10) continue;
      const y = bot - (bot - top) * n.pitch; let col = n.star ? '#ffd24a' : '#e0b040';
      if (n.judged && !n.hit) col = '#4a4438'; else if (n.holding) col = '#ffe14d'; else if (n.tailJudged) col = '#6ff08a';
      const x1 = Math.max(A.x, xs), x2 = Math.min(A.x + A.w, xe); ctx.globalAlpha = this.noteAlpha((n.t - this.now) / this.approach);
      if (x2 > x1) { rect(ctx, x1, y - 6, x2 - x1, 13, darken(col, 0.35)); rect(ctx, x1, y - 5, x2 - x1, 11, col); rect(ctx, x1, y - 5, x2 - x1, 2, lighten(col, 0.3)); }
      if (xs >= A.x) rect(ctx, xs - 1, y - 8, 4, 17, lighten(col, 0.3)); if (xe <= A.x + A.w) rect(ctx, xe - 3, y - 8, 4, 17, darken(col, 0.3));
      ctx.globalAlpha = 1;
      if (n.holding && Math.random() < 0.7) this.fx.add({ x: hitX + 2, y: y + (Math.random() - 0.5) * 8, vx: 40 + Math.random() * 40, vy: (Math.random() - 0.5) * 24, life: 0.4, color: '#fff0a0', kind: 'px' });
    }
    drawSaxBody(ctx, A.x + 44, bot + 6, this.breath, !!this.breathNote, this.now);
    const bw = 130, bx = A.x + A.w - bw - 14, by = A.y + A.h - 16;
    uiBar(ctx, bx, by, bw, 9, this.breath, this.breath < 0.25 ? '#ff5a5a' : '#6fb8ff', { label: 'BREATH' });
  }
  drawValves(ctx, A) {
    const hitX = A.x + 96, cy = A.y + A.h * 0.42;
    vgrad(ctx, A.x, cy - 30, A.w, 60, '#1c1630', '#120e20');
    const pxPerSec = (A.w - 120) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, cy - 30, 60, pxPerSec);
    ringPx(ctx, hitX, cy, 20, '#8a80b0'); this.receptors.main = { x: hitX, y: cy }; this.receptors[0] = this.receptors.main;
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue; const x = hitX + (n.t - this.now) * pxPerSec; if (x > A.x + A.w + 20) break; if (x < A.x - 20) continue;
      ctx.globalAlpha = this.noteAlpha((n.t - this.now) / this.approach);
      if (n.type === 'bomb') { circle(ctx, x, cy, 10, '#1a1410'); circle(ctx, x, cy, 9, '#c8302a'); ctx.globalAlpha = 1; continue; }
      circle(ctx, x, cy + 2, 17, 'rgba(0,0,0,0.3)'); circle(ctx, x, cy, 17, '#120e1c'); circle(ctx, x, cy, 16, n.star ? '#ffd24a' : '#f0c040'); circle(ctx, x, cy, 14, n.star ? '#e0b030' : '#c89a2a');
      for (let v = 0; v < 3; v++) { const on = (n.combo >> v) & 1; rect(ctx, x - 10 + v * 7, cy - 8, 5, 16, on ? '#fffbe0' : '#5a4210'); if (on) drawText(ctx, this.instrument.keyNames[v], x - 9 + v * 7, cy - 2, '#1a1410', { font: 'small' }); }
      ctx.globalAlpha = 1;
    }
    drawTrumpetBody(ctx, A.x + A.w / 2, A.y + A.h - (A.touch ? 26 : 40), this.valveMask, this.now);
  }
  drawBow(ctx, A) {
    const hitX = A.x + 118, top = A.y + (A.touch ? 22 : 32), bot = A.y + A.h - (A.touch ? 30 : 44);
    vgrad(ctx, A.x, top - 6, A.w, bot - top + 12, '#1c1630', '#120e20');
    for (let i = 0; i < 4; i++) rect(ctx, A.x, top + (bot - top) * i / 3, A.w, 1, '#332a58');
    const pxPerSec = (A.w - 140) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, top - 6, bot - top + 12, pxPerSec);
    rect(ctx, hitX, top - 8, 2, bot - top + 16, '#7a7290');
    if (this.flashes[1] > 0) { ctx.globalAlpha = this.flashes[1] * 2; rect(ctx, hitX - 4, top - 8, 10, (bot - top) / 2 + 8, '#c58bff'); ctx.globalAlpha = 1; }
    if (this.flashes[0] > 0) { ctx.globalAlpha = this.flashes[0] * 2; rect(ctx, hitX - 4, top + (bot - top) / 2, 10, (bot - top) / 2 + 8, '#6be585'); ctx.globalAlpha = 1; }
    this.receptors[1] = { x: hitX, y: top + (bot - top) * 0.25 }; this.receptors[0] = { x: hitX, y: top + (bot - top) * 0.75 }; this.receptors.main = { x: hitX, y: (top + bot) / 2 };
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue; const xs = hitX + (n.t - this.now) * pxPerSec; if (xs > A.x + A.w + 12) break;
      const xe = n.dur ? hitX + (n.t + n.dur - this.now) * pxPerSec : xs; if (xe < A.x - 12) continue;
      if (n.judged && !(n.type === 'hold' && n.hit && !n.tailJudged)) continue;
      const y = bot - (bot - top) * n.pitch, col = n.dir > 0 ? '#c58bff' : '#6be585';
      ctx.globalAlpha = this.noteAlpha((n.t - this.now) / this.approach);
      if (n.dur) { const x1 = Math.max(A.x, n.holding ? hitX : xs), x2 = Math.min(A.x + A.w, xe); if (x2 > x1) { rect(ctx, x1, y - 5, x2 - x1, 11, n.holding ? '#fff' : darken(col, 0.4)); rect(ctx, x1, y - 2, x2 - x1, 4, n.holding ? col : darken(col, 0.2)); } }
      if (!n.holding) { circle(ctx, xs, y + 2, 11, 'rgba(0,0,0,0.3)'); circle(ctx, xs, y, 11, '#120e1c'); circle(ctx, xs, y, 10, n.star ? '#ffd24a' : col); drawText(ctx, n.dir > 0 ? '↑' : '↓', xs, y - 3, '#1a1410', { align: 'center' }); }
      ctx.globalAlpha = 1;
    }
    drawViolinBody(ctx, A.x + 52, A.y + A.h / 2, this.keysDown.has('ArrowUp') || this.keysDown.has('KeyW') ? 1 : -1, !!Object.keys(this.holds).length, this.now);
  }
  drawQte(ctx, A) {
    const cx = A.x + A.w / 2, cy = A.y + A.h / 2 - 6; this.receptors.main = { x: cx, y: cy }; this.receptors[0] = this.receptors.main;
    const m = this.section.member;
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.moveTo(cx - 26, A.y); ctx.lineTo(cx + 26, A.y); ctx.lineTo(cx + 150, A.y + A.h); ctx.lineTo(cx - 150, A.y + A.h); ctx.fill(); ctx.globalAlpha = 1;
    if (m) { drawShadow(ctx, cx - 130, cy + 54, 24); drawBugAt(ctx, m.spec, cx - 130, cy + 54, { pose: this.onBeat ? 'play' : 'idle', instrument: m.instrument, scale: 1.4 }); }
    circle(ctx, cx, cy, 22, this.flashes.qte > 0 ? '#ffe14d' : '#231d3a'); ringPx(ctx, cx, cy, 22, '#ffd166'); ringPx(ctx, cx, cy, 23, '#8a7030');
    ctx.drawImage(icon('note'), cx - 3, cy - 8);
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue; const dt = n.t - this.now; if (dt > this.approach) break; if (dt < -0.2) continue;
      const k = clamp(dt / this.approach, 0, 1), r = 22 + k * 86, col = k < 0.12 ? '#fff' : '#5bc0ff';
      ringPx(ctx, cx, cy, r, col); ringPx(ctx, cx, cy, r + 1, darken(col, 0.35));
    }
    drawText(ctx, m ? m.name.toUpperCase() : 'BAND', cx, A.y + A.h - 24, '#ffd166', { align: 'center', outline: '#1a1410' });
  }
}
