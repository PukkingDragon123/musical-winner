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
    this.fx = new Particles(); this.beatPulse = 0; this.lastBeat = -1; this.hitLog = [];
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
  noteAlpha(dtToHit) {
    const k = dtToHit / this.approach; // 1 = far, 0 = at receptor
    if (this.mods.bossMod === 'fog') return clamp((k - 0.12) / 0.3, 0, 1);
    if (this.mods.bossMod === 'blackout') return k < 0.35 ? 1 : 0.06;
    return 1;
  }
  draw(ctx, A) {
    rect(ctx, A.x, A.y, A.w, A.h, '#0d0b18');
    if (A.backdrop) { ctx.globalAlpha = 0.28; ctx.drawImage(A.backdrop, 0, 0, A.backdrop.width, A.backdrop.height, A.x, A.y, A.w, A.h); ctx.globalAlpha = 1; vgrad(ctx, A.x, A.y, A.w, A.h, 'rgba(13,11,24,0.2)', 'rgba(13,11,24,0.9)'); }
    rect(ctx, A.x, A.y - 1, A.w, 1, '#3a3560');
    const g = this.game;
    if (g === 'qte') this.drawQte(ctx, A); else if (g === 'lanes') this.drawLanes(ctx, A); else if (g === 'taiko') this.drawTaiko(ctx, A); else if (g === 'wind') this.drawWind(ctx, A); else if (g === 'valves') this.drawValves(ctx, A); else if (g === 'bow') this.drawBow(ctx, A);
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y - 30, A.w, A.h + 30); ctx.clip(); this.fx.draw(ctx); ctx.restore();
    this.drawHud(ctx, A);
  }
  drawHud(ctx, A) {
    if (this.combo >= 5) { const pulse = this.onBeat ? 1 : 0; drawText(ctx, this.combo + ' COMBO', A.x + A.w / 2, A.y + 10 - pulse, this.combo >= 70 ? '#ffd24a' : this.combo >= 30 ? '#ff9f68' : '#fff', { align: 'center', scale: 2, outline: '#1a1410' }); }
    for (const p of this.popups) {
      const k = p.t / (p.big ? 1.2 : 0.55); const scale = p.big ? 2 : 1;
      const pop = k < 0.15 ? 1 + (0.15 - k) * 4 : 1; // squash-stretch pop-in
      ctx.globalAlpha = clamp(1 - k * 0.8 + 0.2, 0, 1);
      const x = p.x != null ? p.x : A.x + A.w / 2, y = (p.y != null ? p.y : A.y + 34) - (p.big ? k * 14 : k * 8);
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(pop, 1 / Math.max(0.7, pop)); drawText(ctx, p.text, 0, 0, p.color, { align: 'center', scale, outline: '#1a1410' }); ctx.restore();
      ctx.globalAlpha = 1;
    }
    if (this.now < 0) {
      const beatsLeft = Math.ceil(-this.now / this.song.beat);
      drawText(ctx, beatsLeft > 0 ? String(beatsLeft) : 'GO!', A.x + A.w / 2, A.y + A.h / 2 - 16, '#fff', { align: 'center', scale: 4, outline: '#1a1410' });
      const ins = this.instrument; drawText(ctx, (this.section.qte ? 'BACK UP ' + (this.section.member ? this.section.member.name.toUpperCase() : 'THE BAND') + ' - SPACE / F / J' : ins.name.toUpperCase() + ' - ' + ins.keyNames.join(' ')), A.x + A.w / 2, A.y + A.h / 2 + 22, '#ffd166', { align: 'center', outline: '#1a1410' });
    }
    if (this.bannerT > 0 && this.now > 0) {
      ctx.globalAlpha = clamp(this.bannerT, 0, 1); rect(ctx, A.x, A.y + A.h / 2 - 14, A.w, 28, 'rgba(0,0,0,0.8)');
      const t = this.section.qte ? (this.section.member ? this.section.member.name.toUpperCase() + ' TAKES THE SPOTLIGHT' : 'BAND SPOTLIGHT') : 'NOW: ' + this.instrument.name.toUpperCase() + ' (' + this.instrument.keyNames.join(' ') + ')';
      drawText(ctx, t, A.x + A.w / 2, A.y + A.h / 2 - 7, '#ffe14d', { align: 'center', scale: 2 }); ctx.globalAlpha = 1;
    }
    if (this.switchWarn) {
      const ns = this.nextSection; const blink = Math.floor(this.now * 6) % 2 === 0;
      rect(ctx, A.x + A.w - 170, A.y + 2, 168, 20, 'rgba(0,0,0,0.75)');
      const label = ns.qte ? 'NEXT: BACK UP ' + (ns.member ? ns.member.name.toUpperCase() : 'BAND') : 'SWITCH: ' + INSTRUMENTS[ns.instrument].name.toUpperCase();
      drawText(ctx, label, A.x + A.w - 86, A.y + 4, blink ? '#ff9f68' : '#fff', { align: 'center' });
      drawText(ctx, ns.qte ? 'SPACE / F / J' : INSTRUMENTS[ns.instrument].keyNames.join(' '), A.x + A.w - 86, A.y + 13, '#ccc', { align: 'center', font: 'small' });
    }
    if (this.mods.metronome) { const r = 3 + Math.round(this.beatPulse * 3); circle(ctx, A.x + 12, A.y + 12, r, this.beatPulse > 0.8 ? '#ffe14d' : '#665'); }
  }
  beatLinesV(ctx, x0, w, top, hitY, pxPerSec) { for (let b = Math.ceil(this.now / this.song.beat); ; b++) { const y = hitY - (b * this.song.beat - this.now) * pxPerSec; if (y < top) break; rect(ctx, x0, y, w, 1, b % 4 === 0 ? '#3a3560' : '#242040'); } }
  beatLinesH(ctx, hitX, xEnd, top, h, pxPerSec) { for (let b = Math.ceil(this.now / this.song.beat); ; b++) { const x = hitX + (b * this.song.beat - this.now) * pxPerSec; if (x > xEnd) break; if (x > hitX - 60) rect(ctx, x, top, 1, h, b % 4 === 0 ? '#4a4070' : '#2a2448'); } }
  drawNoteGem(ctx, x, y, w, h, col, star, alpha = 1) {
    ctx.globalAlpha = alpha;
    rect(ctx, x, y, w, h, darken(col, 0.35)); rect(ctx, x + 1, y + 1, w - 2, h - 2, col); rect(ctx, x + 2, y + 1, w - 4, 1, lighten(col, 0.35)); rect(ctx, x + 1, y + h - 2, w - 2, 1, darken(col, 0.2));
    if (star) { const cx = x + w / 2, cy = y + h / 2; rect(ctx, cx - 3, cy, 7, 1, '#fff'); rect(ctx, cx, cy - 3, 1, 7, '#fff'); px(ctx, cx - 1, cy - 1, '#fff8c0'); px(ctx, cx + 1, cy - 1, '#fff8c0'); px(ctx, cx - 1, cy + 1, '#fff8c0'); px(ctx, cx + 1, cy + 1, '#fff8c0'); }
    ctx.globalAlpha = 1;
  }
  drawBomb(ctx, x, y, r, alpha = 1) { ctx.globalAlpha = alpha; circle(ctx, x, y, r, '#1a1410'); circle(ctx, x, y, r - 1, '#3a2a30'); circle(ctx, x, y, r - 3, '#c8302a'); rect(ctx, x - 1, y - r - 3, 2, 3, '#555'); const sp = Math.floor(this.now * 12) % 2; px(ctx, x, y - r - 4, sp ? '#ffd24a' : '#ff8030'); line(ctx, x - 2, y - 2, x + 2, y + 2, '#fff'); line(ctx, x + 2, y - 2, x - 2, y + 2, '#fff'); ctx.globalAlpha = 1; }
  drawLanes(ctx, A) {
    const instr = this.instrument, L = instr.lanes;
    const padCols = A.touch && A.pads && A.pads.length === L ? A.pads : null;
    const laneW = padCols ? padCols[0].w + 2 : Math.min(56, Math.floor((A.w - 60) / L));
    const x0 = padCols ? padCols[0].x - 1 : A.x + Math.floor((A.w - laneW * L) / 2);
    const laneX = (l) => padCols ? padCols[l].x - 1 : x0 + l * laneW;
    const hitY = A.y + A.h - (A.touch ? 10 : 26), top = A.y + 14;
    for (let l = 0; l < L; l++) {
      const x = laneX(l); rect(ctx, x, top, laneW, hitY - top + 10, l % 2 ? '#141126' : '#181430');
      if (this.flashes[l] > 0) { ctx.globalAlpha = this.flashes[l] * 2.5; vgrad(ctx, x, top, laneW, hitY - top + 10, 'rgba(0,0,0,0)', LANE_COLORS[l]); ctx.globalAlpha = 1; }
      rect(ctx, x, top, 1, hitY - top + 10, '#2a2450');
      const held = this.keysDown.has(instr.keys[l]);
      rect(ctx, x + 3, hitY - 3, laneW - 6, 7, held ? LANE_COLORS[l] : darken(LANE_COLORS[l], 0.35)); frame(ctx, x + 3, hitY - 3, laneW - 6, 7, held ? '#fff' : LANE_COLORS[l]);
      if (!A.touch) drawText(ctx, instr.keyNames[l], x + laneW / 2, hitY + 9, '#ddd', { align: 'center' });
      this.receptors[l] = { x: x + laneW / 2, y: hitY };
    }
    if (!padCols) rect(ctx, x0 + L * laneW, top, 1, hitY - top + 10, '#2a2450');
    const pxPerSec = (hitY - top) / this.approach;
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) { const y = hitY - (b * this.song.beat - this.now) * pxPerSec; if (y < top) break; for (let l = 0; l < L; l++) rect(ctx, laneX(l), y, laneW, 1, b % 4 === 0 ? '#3a3560' : '#242040'); }
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      const y = hitY - (n.t - this.now) * pxPerSec; if (y < top - 12) break;
      const x = laneX(n.lane) + 3, w = laneW - 6, col = LANE_COLORS[n.lane];
      const alpha = this.noteAlpha(n.t - this.now);
      if (n.type === 'roll') { if (n.judged && this.now > n.t + n.dur) continue; const yEnd = hitY - (n.t + n.dur - this.now) * pxPerSec; const yy = Math.max(top, yEnd), hh = Math.min(hitY + 3, Math.max(y, hitY)) - yy; if (hh > 0) { ctx.globalAlpha = alpha; rect(ctx, x + 2, yy, w - 4, hh, '#ffd166'); rect(ctx, x + 4, yy, w - 8, hh, '#fff0a0'); drawText(ctx, 'ROLL', x + w / 2, yy + hh / 2 - 3, '#5a3a00', { align: 'center', font: 'small' }); ctx.globalAlpha = 1; } continue; }
      if (n.type === 'bomb') { if (n.judged) continue; if (y > hitY + 14) continue; this.drawBomb(ctx, x + w / 2, y, 6, alpha); continue; }
      if (n.type === 'hold') {
        const yEnd = hitY - (n.t + n.dur - this.now) * pxPerSec; const yStart = n.holding ? hitY : y;
        if (!(n.tailJudged) && yEnd < hitY + 4) { const yy = Math.max(top, yEnd), hh = Math.min(hitY + 3, yStart) - yy; if (hh > 0) { ctx.globalAlpha = alpha; rect(ctx, x + w / 2 - 4, yy, 8, hh, n.holding ? col : darken(col, 0.4)); rect(ctx, x + w / 2 - 2, yy, 2, hh, n.holding ? lighten(col, 0.3) : darken(col, 0.25)); ctx.globalAlpha = 1; if (n.holding && Math.random() < 0.5) this.fx.add({ x: x + w / 2 + (Math.random() - 0.5) * 8, y: hitY, vx: (Math.random() - 0.5) * 20, vy: -40, life: 0.3, color: col, kind: 'px', gravity: 0 }); } }
        if (n.judged) continue;
      }
      if (n.judged) continue; if (y > hitY + 14) continue;
      this.drawNoteGem(ctx, x, y - 4, w, 8, n.star ? '#ffd24a' : col, n.star, alpha);
    }
  }
  drawTaiko(ctx, A) {
    const hitX = A.x + 60, cy = A.y + A.h * (A.touch ? 0.6 : 0.5) - 4; const lineH = A.touch ? 64 : 52, lineTop = cy - lineH / 2;
    rect(ctx, A.x, lineTop, A.w, lineH, '#1a1428'); rect(ctx, A.x, lineTop, A.w, 1, '#3a3060'); rect(ctx, A.x, lineTop + lineH, A.w, 1, '#3a3060');
    const pxPerSec = (A.w - 70) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, lineTop, lineH, pxPerSec);
    ringPx(ctx, hitX, cy, 14, '#777'); ringPx(ctx, hitX, cy, 13, '#444');
    if (this.flashes.don > 0) circle(ctx, hitX, cy, 12, '#ff6b6b'); else if (this.flashes.ka > 0) circle(ctx, hitX, cy, 12, '#5bc0ff');
    rect(ctx, A.x + 4, cy - 22, 38, 44, '#5a3a1e'); rect(ctx, A.x + 8, cy - 18, 30, 36, '#f0e8d8'); rect(ctx, A.x + 10, cy - 16, 26, 2, '#fff8ee');
    drawText(ctx, 'D K', A.x + 23, cy - 32, '#5bc0ff', { align: 'center' }); drawText(ctx, 'F J', A.x + 23, cy + 26, '#ff6b6b', { align: 'center' });
    this.receptors.main = { x: hitX, y: cy }; this.receptors[0] = this.receptors.main;
    const visible = [];
    for (const n of this.notes) { if (n.sec !== this.secIdx) continue; if (n.judged && n.type !== 'roll') continue; const x = hitX + (n.t - this.now) * pxPerSec; if (x > A.x + A.w + 20) break; if (x < A.x - 20 && n.type !== 'roll') continue; visible.push({ n, x }); }
    for (let i = visible.length - 1; i >= 0; i--) {
      const { n, x } = visible[i]; const alpha = this.noteAlpha(n.t - this.now);
      if (n.type === 'roll') { if (this.now > n.t + n.dur) continue; const xe = hitX + (n.t + n.dur - this.now) * pxPerSec, xs = Math.max(hitX, x); if (xe > A.x) { rect(ctx, xs, cy - 9, Math.max(0, xe - xs), 18, '#ffd166'); rect(ctx, xs, cy - 5, Math.max(0, xe - xs), 10, '#fff0a0'); circle(ctx, xe, cy, 9, '#ffd166'); circle(ctx, xs, cy, 9, '#ffd166'); drawText(ctx, 'ROLL!', (xs + xe) / 2, cy - 20, '#ffd166', { align: 'center', outline: '#1a1410' }); } continue; }
      if (n.type === 'bomb') { this.drawBomb(ctx, x, cy, 8, alpha); continue; }
      const big = n.type === 'big', r = big ? 14 : 10, col = n.type === 'ka' ? '#5bc0ff' : '#ff6b6b';
      ctx.globalAlpha = alpha; circle(ctx, x, cy, r, '#1a1410'); circle(ctx, x, cy, r - 1, n.star ? '#ffd24a' : col); circle(ctx, x, cy, r - 4, lighten(n.star ? '#ffd24a' : col, 0.2)); px(ctx, x - 3, cy - 4, '#fff'); px(ctx, x - 4, cy - 3, '#fff');
      if (big) drawText(ctx, 'FJ', x, cy - 3, '#1a1410', { align: 'center' }); ctx.globalAlpha = 1;
    }
  }
  drawWind(ctx, A) {
    const hitX = A.x + 80, top = A.y + (A.touch ? 16 : 26), bot = A.y + A.h - (A.touch ? 26 : 34);
    rect(ctx, A.x, top - 4, A.w, bot - top + 8, '#141126'); for (let i = 0; i <= 4; i++) rect(ctx, A.x, top + (bot - top) * i / 4, A.w, 1, '#2a2450');
    const pxPerSec = (A.w - 90) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, top - 4, bot - top + 8, pxPerSec);
    rect(ctx, hitX, top - 6, 2, bot - top + 12, this.keysDown.has('Space') ? '#ffe14d' : '#887');
    this.receptors.main = { x: hitX, y: (top + bot) / 2 }; this.receptors[0] = this.receptors.main;
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue; const xs = hitX + (n.t - this.now) * pxPerSec, xe = hitX + (n.t + n.dur - this.now) * pxPerSec; if (xs > A.x + A.w + 10) break; if (xe < A.x - 10) continue;
      const y = bot - (bot - top) * n.pitch; let col = n.star ? '#ffd24a' : '#e0b040'; if (n.judged && !n.hit) col = '#553'; else if (n.holding) col = '#ffe14d'; else if (n.tailJudged) col = '#6ff08a';
      const x1 = Math.max(A.x, xs), x2 = Math.min(A.x + A.w, xe); ctx.globalAlpha = this.noteAlpha(n.t - this.now);
      if (x2 > x1) { rect(ctx, x1, y - 4, x2 - x1, 9, darken(col, 0.3)); rect(ctx, x1, y - 3, x2 - x1, 7, col); rect(ctx, x1, y - 3, x2 - x1, 1, lighten(col, 0.3)); }
      if (xs >= A.x) rect(ctx, xs, y - 6, 3, 13, lighten(col, 0.3)); if (xe <= A.x + A.w) rect(ctx, xe - 2, y - 6, 3, 13, darken(col, 0.3)); ctx.globalAlpha = 1;
      if (n.holding && Math.random() < 0.6) this.fx.add({ x: hitX + 2, y: y + (Math.random() - 0.5) * 6, vx: 30 + Math.random() * 30, vy: (Math.random() - 0.5) * 20, life: 0.4, color: '#fff0a0', kind: 'px' });
    }
    const bw = 120, bx = A.x + A.w / 2 - bw / 2, by = A.y + A.h - 16;
    uiBar(ctx, bx, by, bw, 8, this.breath, this.breath < 0.25 ? '#ff5a5a' : '#6fb8ff', { label: 'BREATH' });
    if (!A.touch) drawText(ctx, 'HOLD SPACE', bx + bw + 8, by + 1, '#aab');
  }
  drawValves(ctx, A) {
    const hitX = A.x + 70, cy = A.y + A.h * (A.touch ? 0.52 : 0.5) - 14;
    rect(ctx, A.x, cy - 24, A.w, 48, '#141126'); const pxPerSec = (A.w - 80) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, cy - 24, 48, pxPerSec);
    ringPx(ctx, hitX, cy, 15, '#777'); this.receptors.main = { x: hitX, y: cy }; this.receptors[0] = this.receptors.main;
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue; const x = hitX + (n.t - this.now) * pxPerSec; if (x > A.x + A.w + 16) break; if (x < A.x - 16) continue;
      ctx.globalAlpha = this.noteAlpha(n.t - this.now);
      if (n.type === 'bomb') { this.drawBomb(ctx, x, cy, 8); ctx.globalAlpha = 1; continue; }
      circle(ctx, x, cy, 14, '#1a1410'); circle(ctx, x, cy, 13, n.star ? '#ffd24a' : '#f0c040'); circle(ctx, x, cy, 12, n.star ? '#e0b030' : '#c89a2a');
      for (let v = 0; v < 3; v++) { const on = (n.combo >> v) & 1; rect(ctx, x - 9 + v * 6, cy - 7, 5, 14, on ? '#fff' : '#5a4210'); if (on) drawText(ctx, this.instrument.keyNames[v], x - 8 + v * 6, cy - 2, '#000', { font: 'small' }); }
      ctx.globalAlpha = 1;
    }
    if (!A.touch) { const names = this.instrument.keyNames; for (let v = 0; v < 3; v++) { const bx = A.x + A.w / 2 - 44 + v * 32, by = A.y + A.h - 34; const on = (this.valveMask >> v) & 1; uiButton(ctx, bx, by + (on ? 2 : 0), 26, 16, names[v], on ? 'down' : 'normal', { color: '#c89a2a', hi: '#ffe080', lo: '#8a6010', ol: '#4a3208' }); } }
    drawText(ctx, 'PRESS THE LIT VALVES TOGETHER', A.x + A.w / 2, A.y + A.h - (A.touch ? 10 : 12), '#aab', { align: 'center', font: 'small' });
  }
  drawBow(ctx, A) {
    const hitX = A.x + 80, top = A.y + (A.touch ? 16 : 28), bot = A.y + A.h - (A.touch ? 18 : 34);
    rect(ctx, A.x, top - 6, A.w, bot - top + 12, '#141126'); for (let i = 0; i < 4; i++) rect(ctx, A.x, top + (bot - top) * i / 3, A.w, 1, '#3a3560');
    const pxPerSec = (A.w - 90) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, top - 6, bot - top + 12, pxPerSec);
    rect(ctx, hitX, top - 8, 2, bot - top + 16, '#887');
    if (this.flashes[1] > 0) rect(ctx, hitX - 3, top - 8, 8, (bot - top) / 2 + 8, '#c58bff'); if (this.flashes[0] > 0) rect(ctx, hitX - 3, top + (bot - top) / 2, 8, (bot - top) / 2 + 8, '#6be585');
    this.receptors[1] = { x: hitX, y: top + (bot - top) * 0.25 }; this.receptors[0] = { x: hitX, y: top + (bot - top) * 0.75 }; this.receptors.main = { x: hitX, y: (top + bot) / 2 };
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue; const xs = hitX + (n.t - this.now) * pxPerSec; if (xs > A.x + A.w + 10) break; const xe = n.dur ? hitX + (n.t + n.dur - this.now) * pxPerSec : xs; if (xe < A.x - 10) continue;
      if (n.judged && !(n.type === 'hold' && n.hit && !n.tailJudged)) continue;
      const y = bot - (bot - top) * n.pitch, col = n.dir > 0 ? '#c58bff' : '#6be585'; ctx.globalAlpha = this.noteAlpha(n.t - this.now);
      if (n.dur) { const x1 = Math.max(A.x, n.holding ? hitX : xs), x2 = Math.min(A.x + A.w, xe); if (x2 > x1) { rect(ctx, x1, y - 3, x2 - x1, 7, n.holding ? '#fff' : darken(col, 0.4)); rect(ctx, x1, y - 1, x2 - x1, 2, n.holding ? col : darken(col, 0.2)); } }
      if (!n.holding) { circle(ctx, xs, y, 8, '#1a1410'); circle(ctx, xs, y, 7, n.star ? '#ffd24a' : col); drawText(ctx, n.dir > 0 ? '↑' : '↓', xs, y - 3, '#1a1410', { align: 'center' }); }
      ctx.globalAlpha = 1;
    }
    if (!A.touch) { drawText(ctx, 'UP BOW = ↑ / W', A.x + 8, A.y + A.h - 14, '#c58bff'); drawText(ctx, 'DOWN BOW = ↓ / S', A.x + A.w - 8, A.y + A.h - 14, '#6be585', { align: 'right' }); }
  }
  drawQte(ctx, A) {
    const cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 4; this.receptors.main = { x: cx, y: cy }; this.receptors[0] = this.receptors.main;
    const m = this.section.member;
    // spotlight cone
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#ffe680'; ctx.beginPath(); ctx.moveTo(cx - 20, A.y); ctx.lineTo(cx + 20, A.y); ctx.lineTo(cx + 120, A.y + A.h); ctx.lineTo(cx - 120, A.y + A.h); ctx.fill(); ctx.globalAlpha = 1;
    drawText(ctx, (m ? m.name.toUpperCase() : 'THE BAND') + ' ON ' + INSTRUMENTS[this.section.instrument].name.toUpperCase(), cx, A.y + A.h - 26, '#ffd166', { align: 'center', outline: '#1a1410' });
    drawText(ctx, 'HIT THE RING AS IT CLOSES  (SPACE / F / J / TAP)', cx, A.y + A.h - 14, '#aab', { align: 'center', font: 'small' });
    if (m) drawBugAt(ctx, m.spec, cx - 110, cy + 30, { pose: this.onBeat ? 'play' : 'idle', instrument: m.instrument });
    // target
    circle(ctx, cx, cy, 16, this.flashes.qte > 0 ? '#ffe14d' : '#2a2540'); ringPx(ctx, cx, cy, 16, '#ffd166'); ringPx(ctx, cx, cy, 17, '#8a7030');
    drawText(ctx, 'TAP', cx, cy - 3, this.flashes.qte > 0 ? '#1a1410' : '#ffd166', { align: 'center' });
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue; const dt = n.t - this.now; if (dt > this.approach) break; if (dt < -0.2) continue;
      const k = clamp(dt / this.approach, 0, 1); const r = 16 + k * 70; const col = k < 0.15 ? '#fff' : '#5bc0ff';
      ringPx(ctx, cx, cy, r, col); ringPx(ctx, cx, cy, r + 1, darken(col, 0.3));
      if (k < 0.3) { ctx.globalAlpha = (0.3 - k) * 2; circle(ctx, cx, cy, r, withAlpha('#5bc0ff', 0.2)); ctx.globalAlpha = 1; }
    }
  }
}
