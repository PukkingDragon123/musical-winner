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
    this.bursts = []; this.lastMilestone = 0;
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
  get instrument() { return this.section.instr || INSTRUMENTS[this.section.instrument]; }
  get game() { return this.section.qte ? 'qte' : this.instrument.game; }
  get nextSection() { return this.sections[this.secIdx + 1]; }
  begin(audioTime) { this.startTime = audioTime; }
  // A kit is forgiving on purpose: what matters is landing on the beat, so the
  // windows are wider than on an instrument where you also pick a pitch.
  get kitEase() { return this.instrument && this.instrument.view === 'kit' ? 2.5 : 1; }
  win(kind) { let m = this.mods.windowMult || 1; return JUDGE[kind] * m * this.kitEase; }
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
      // a sour little comic yelp when a run of notes falls apart
      if (this.combo === 0 && this.counts.miss % 3 === 1)
        this.bursts.push({ x: r.x, y: r.y - 26, t: 0, text: ['OOF!', 'CLANG!', 'OW!'][this.counts.miss % 3], color: '#ff5a5a', scale: 0.7 });
    } else {
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      // a comic burst every time the combo crosses a milestone
      for (const ms of [10, 25, 50, 100, 200]) if (this.combo === ms && this.lastMilestone < ms) {
        this.lastMilestone = ms;
        this.bursts.push({ x: r.x, y: r.y - 40, t: 0, text: ms >= 100 ? 'UNREAL!' : ms >= 50 ? 'ON FIRE!' : ms >= 25 ? 'COOKING!' : 'NICE!', color: ms >= 50 ? '#ff5a5a' : '#ffd24a', scale: 1 + ms / 160 });
        if (this.mods.fx) this.mods.fx.shake.hit(4 + ms / 25, 0.25);
        if (this.hooks.onMilestone) this.hooks.onMilestone(ms);
      }
      if (note.star) this.bursts.push({ x: r.x, y: r.y - 30, t: 0, text: 'GOLD!', color: '#f2cf4a', scale: 0.85 });
      if (j === 'perfect') this.events.perfects++;
      const col = note.star ? '#ffd24a' : JUDGE_COLOR[j];
      this.fx.burst(r.x, r.y, j === 'perfect' ? 12 : 6, { color: [col, '#fff', lighten(col, 0.2)], speed: j === 'perfect' ? 90 : 55, life: 0.45, kind: j === 'perfect' ? 'spark' : 'px', gravity: 60, size: 2 });
      // A kit has no rings on it anywhere, approaching or landing: a struck
      // drum throws sparks off the skin instead.
      if (this.instrument.view === 'kit')
        this.fx.burst(r.x, r.y, j === 'perfect' ? 10 : 5, { color: [col, '#fff8e0'], speed: j === 'perfect' ? 130 : 80, life: 0.3, kind: 'spark', gravity: 30, size: 2 });
      else this.fx.ring(r.x, r.y, col, 3, j === 'perfect' ? 18 : 12, 0.28);
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
  // A kit is rhythm and nothing else. Aiming a mouse at a particular drum
  // inside one beat is a second, harder game bolted on top of the first, so
  // it is gone: this is the drum the chart wants right now, and a strike
  // anywhere — open air, any key — is routed to it and scores in full.
  dueLane() {
    if (!this.instrument || this.instrument.view !== 'kit') return null;
    const n = this.findNote(x => x.type !== 'roll' && x.type !== 'bomb');
    return n ? n.lane : null;
  }
  playHit(note, j, hold) {
    const k = this.section.instrument; const ins = this.section.instr || INSTRUMENTS[k];
    if (k === 'drums') {
      // each lane is a different piece of the kit, so it should sound like one
      const piece = (ins.drumFor && ins.drumFor[note.lane]) || 'snare';
      const v = j === 'perfect' ? 0.95 : j === 'great' ? 0.8 : 0.6;
      Audio.drum(PIECE_VOICE[piece] || piece, 0, v);
      if (piece === 'kick') Audio.drum('kick', 0, v * 0.6);
      if (piece === 'crash') Audio.drum('hat', 0, v * 0.4);
      if (piece === 'bucket') Audio.drum('kick', 0, v * 0.35);   // a bucket still thumps
      return null;
    }
    if (k === 'taiko') {
      // skin in the middle, rim at the edge, and a big one gets both
      const v = j === 'perfect' ? 1 : j === 'great' ? 0.82 : 0.6;
      const don = note.type === 'don' || note.type === 'big';
      Audio.drum(don ? 'odaiko' : 'shime', 0, v);
      if (note.type === 'big') Audio.drum('shime', 0, v * 0.5);
      return null;
    }
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
      // On a kit every key is a stick. One that is not a piece plays whatever
      // the chart is asking for, so nobody loses a beat hunting for a letter.
      if (lane < 0 && instr.view === 'kit') { const d = this.dueLane(); lane = d != null ? d : Math.floor(instr.lanes / 2); }
      if (lane < 0) return;
      const roll = this.notes.find(n => n.type === 'roll' && n.sec === this.secIdx && n.lane === lane && this.now >= n.t - 0.05 && this.now <= n.t + n.dur + 0.05);
      if (roll) { roll.judged = true; roll.hits = (roll.hits || 0) + 1; this.hype = clamp(this.hype + 0.5, 0, 100); this.playHit(roll, 'great'); const r = this.receptorOf(roll); this.fx.burst(r.x, r.y, 4, { color: '#ffd166', speed: 50, life: 0.3 }); this.popups.push({ text: 'ROLL x' + roll.hits, color: '#ffd166', t: 0, x: r.x, y: r.y - 14 }); if (this.hooks.onRoll) this.hooks.onRoll(); this.flashes[lane] = 0.15; return; }
      let n = this.findNote(x => x.lane === lane && x.type !== 'roll');
      // On a kit, hitting the beat is the skill. If there is nothing due on the
      // drum you struck but something is due somewhere on the kit, it still
      // counts — you played the beat, just not the piece the chart asked for,
      // so it caps at GREAT and the drum you actually hit is what sounds.
      let offPiece = false;
      if (!n && instr.view === 'kit') {
        n = this.findNote(x => x.type !== 'roll' && x.type !== 'bomb');
        if (n) offPiece = true;
      }
      if (!n) { if (this.now > 0) { if (instr.view === 'kit') { const pc = (instr.drumFor && instr.drumFor[lane]) || 'snare'; Audio.drum(PIECE_VOICE[pc] || pc, 0, 0.35); } else Audio.drum('clunk', 0, 0.4); this.flashes[lane] = 0.15; } return; }
      if (n.type === 'bomb') { this.hitBomb(n); return; }
      let j = this.judgeDt(this.now - n.t);
      if (offPiece && j === 'perfect') j = 'great';
      n.judged = true; n.hit = j !== 'miss'; n.judge = j; this.flashes[lane] = 0.2;
      // On a kit, two pieces asked for on the same beat is one hand movement
      // you do not have. Striking the beat once resolves the whole stack, so a
      // crash riding a kick reads as flourish instead of as a guaranteed miss.
      if (instr.view === 'kit' && n.hit) {
        for (const o of this.notes) {
          if (o === n || o.judged || o.sec !== this.secIdx) continue;
          if (o.type === 'roll' || o.type === 'bomb') continue;
          if (Math.abs(o.t - n.t) > 0.012) continue;
          o.judged = true; o.hit = true; o.judge = j;
          this.counts[j]++; this.flashes[o.lane] = 0.2;
          this.playHit(o, j, false);
          const r2 = this.receptorOf(o);
          this.fx.burst(r2.x, r2.y, 5, { color: ['#ffd24a', '#fff'], speed: 50, life: 0.35, kind: 'spark', gravity: 60, size: 2 });
          if (this.hooks.onJudge) this.hooks.onJudge(o, j, {});
        }
      }
      this.applyJudge(j, n, offPiece && n.hit ? { suffix: ' (ANY DRUM)' } : {});
      if (n.hit) {
        // the drum under your hand is the one that sounds, not the charted one
        const v = this.playHit(offPiece ? { lane, midi: n.midi, star: n.star } : n, j, !offPiece && n.type === 'hold');
        if (!offPiece && n.type === 'hold') { n.holding = true; this.holds[lane] = n; n.voice = v; }
      }
      else if (n.type === 'hold') { n.tailJudged = true; this.counts.miss++; this.events.misses++; }
    } else if (g === 'taiko') {
      const isDon = code === 'KeyF' || code === 'KeyJ', isKa = code === 'KeyD' || code === 'KeyK'; if (!isDon && !isKa) return;
      this.flashes[isDon ? 'don' : 'ka'] = 0.15;
      const roll = this.notes.find(n => n.type === 'roll' && n.sec === this.secIdx && this.now >= n.t - 0.05 && this.now <= n.t + n.dur + 0.05);
      if (roll) { roll.judged = true; roll.hits = (roll.hits || 0) + 1; this.hype = clamp(this.hype + 0.6, 0, 100); Audio.drum(isDon ? 'odaiko' : 'shime', 0, 0.6); const r = this.receptors.main; this.fx.burst(r.x, r.y, 5, { color: '#ffd166', speed: 60, life: 0.3 }); this.popups.push({ text: 'ROLL x' + roll.hits, color: '#ffd166', t: 0 }); if (this.hooks.onRoll) this.hooks.onRoll(); return; }
      if (isDon && this.lastDon.note && this.now - this.lastDon.t < 0.07 && this.lastDon.code !== code) { const n = this.lastDon.note; this.lastDon.note = null; if (n.type === 'big' && n.hit) { this.hype = clamp(this.hype + 2.5, 0, 100); this.popups.push({ text: 'BIG DON!', color: '#ff9f68', t: 0, big: true }); Audio.drum('odaiko', 0, 1); Audio.drum('shime', 0, 0.5); if (this.mods.fx) this.mods.fx.shake.hit(5, 0.25); } return; }
      const n = this.findNote(x => x.type !== 'roll');
      if (!n) { if (this.now > 0) Audio.drum(isDon ? 'odaiko' : 'shime', 0, 0.25); return; }
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
    for (const b of this.bursts) b.t += dt * 1.4;
    this.bursts = this.bursts.filter(b => b.t < 1);
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
    // In overlay mode the venue behind is the picture: no box, no painted-on
    // stage, just the play surface sitting inside the real scene.
    if (!A.overlay) {
      rect(ctx, A.x, A.y, A.w, A.h, '#0b0916');
      if (A.backdrop) { ctx.globalAlpha = 0.22; ctx.drawImage(A.backdrop, 0, 0, A.backdrop.width, A.backdrop.height, A.x, A.y, A.w, Math.round(A.h * 0.6)); ctx.globalAlpha = 1; }
      vgrad(ctx, A.x, A.y, A.w, A.h, 'rgba(30,20,60,0.55)', 'rgba(8,6,16,0.95)');
      this.drawStageSurround(ctx, A);
    } else {
      // just enough grade so the drums read against a bright pavement
      const gy = A.y + A.h * 0.42;
      vgrad(ctx, A.x, gy, A.w, A.h - (gy - A.y), 'rgba(8,6,16,0)', 'rgba(8,6,16,0.5)');
    }
    const g = this.game;
    if (g === 'qte') this.drawQte(ctx, A); else if (g === 'lanes') this.drawLanes(ctx, A); else if (g === 'taiko') this.drawTaiko(ctx, A);
    else if (g === 'wind') this.drawWind(ctx, A); else if (g === 'valves') this.drawValves(ctx, A); else if (g === 'bow') this.drawBow(ctx, A);
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y - 40, A.w, A.h + 40); ctx.clip(); this.fx.draw(ctx);
    for (const b of this.bursts) { speedLines(ctx, b.x, b.y, 26 * b.scale, 70 * b.scale, 14, b.color, this.now, 0.35 * (1 - b.t)); comicBurst(ctx, b.x, b.y, b.text, b.color, b.t, b.scale); }
    ctx.restore();
    this.drawHud(ctx, A);
  }
  // A lit stage around the play area: truss, moving beams, speaker stacks, a front row.
  drawStageSurround(ctx, A) {
    if (!this._sur) {
      const r = makeRng(hashStr('sur' + (this.song && this.song.name || '')) >>> 0);
      const heads = []; for (let i = 0; i < 90; i++) heads.push({ x: r.range(-10, A.w + 10), row: r.int(0, 2), o: r.range(0, 6.3), lit: r.chance(0.3), col: r.pick(['#171224', '#1e1830', '#12101c', '#241c33']) });
      this._sur = { heads, beams: [0, 1, 2, 3, 4, 5].map(i => ({ x: A.w * (0.08 + i * 0.168), o: r.range(0, 6.3), c: ['#ff5a5a', '#5bc0ff', '#ffd24a', '#c58bff', '#6be585', '#ff9f68'][i] })) };
    }
    const S = this._sur, t = this.now, top = A.y, bot = A.y + A.h;
    const pulse = this.beatPulse != null ? this.beatPulse : 0;
    // beams sweeping from the truss
    ctx.save(); ctx.beginPath(); ctx.rect(A.x, A.y, A.w, A.h); ctx.clip();
    for (const b of S.beams) {
      const sw = Math.sin(t * 0.9 + b.o) * A.w * 0.22, bx = A.x + b.x;
      ctx.globalAlpha = 0.055 + pulse * 0.05;
      ctx.fillStyle = b.c; ctx.beginPath();
      ctx.moveTo(bx - 5, top + 14); ctx.lineTo(bx + 5, top + 14);
      ctx.lineTo(bx + sw + 62, bot); ctx.lineTo(bx + sw - 62, bot); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // truss and lamps
    for (let x = A.x; x < A.x + A.w; x += 24) ctx.drawImage(propCanvas('truss'), x, top + 2, 24, 14);
    S.beams.forEach((b, i) => { const bx = A.x + b.x; ctx.drawImage(propCanvas('light', i % 5), bx - 8, top + 15, 16, 13); ctx.globalAlpha = 0.2 + pulse * 0.25; circle(ctx, bx, top + 22, 9, b.c); ctx.globalAlpha = 1; });
    // speaker stacks hugging the edges
    for (const sx of [A.x + 2, A.x + A.w - 32]) { ctx.drawImage(propCanvas('speaker'), sx, bot - 132, 30, 51); ctx.drawImage(propCanvas('speaker'), sx, bot - 80, 30, 51); }
    // front row silhouettes, only outside the highway
    for (const hd of S.heads) {
      const hx = A.x + hd.x; const k = Math.abs(hd.x - A.w / 2) / (A.w / 2);
      if (k < 0.34) continue;
      const y = bot - 24 + hd.row * 9 + Math.round(Math.sin(t * 5 + hd.o) * (2 + pulse * 3));
      circle(ctx, hx, y, 8, hd.col); rect(ctx, hx - 7, y + 5, 15, 26, hd.col);
      // a couple of antennae so the front row reads as bugs too
      rect(ctx, hx - 4, y - 12, 1, 6, hd.col); rect(ctx, hx + 3, y - 12, 1, 6, hd.col);
      if (hd.lit && Math.sin(t * 2.4 + hd.o) > 0) { rect(ctx, hx + 6, y - 14, 3, 6, '#ffd24a'); ctx.globalAlpha = 0.14; circle(ctx, hx + 7, y - 13, 10, '#ffd24a'); ctx.globalAlpha = 1; }
    }
    vignetteRect(ctx, A.x, A.y, A.w, A.h, 0.42);
    ctx.restore();
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
      const label = ns.qte ? (ns.member ? ns.member.name.toUpperCase() : 'BAND') : (ns.instr || INSTRUMENTS[ns.instrument]).name.toUpperCase();
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
  // ---------- The kit: no highway, no buttons, no rings ----------
  // A kit asks one thing of you: land on the count. So the read is the count.
  // The drum you owe lights up and lifts through the beat before its own, a
  // solid caret drops onto it, and a four-square bar keeps time underneath.
  // Nothing closes in on you and nothing has to be aimed at.
  drawKitView(ctx, A) {
    const instr = this.instrument, pieces = instr.pieces || instr.drumFor || ['kick', 'snare', 'hat', 'tom', 'crash'];
    // The scene decides where the kit stands, so the drums sit on the actual
    // ground next to the band instead of floating in a box.
    const K = A.kit || {};
    const cx = K.cx != null ? K.cx : A.x + A.w / 2;
    const baseY = K.baseY != null ? K.baseY : A.y + A.h - (A.touch ? 84 : 74);
    // How lit each drum is running, worked out before the kit is drawn so the
    // glow belongs to the drum instead of being pasted over the top of it.
    // One count of warning: the drum wakes on the beat before its own.
    const lead = this.song.beat * 1.05, cue = {};
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged || n.type === 'roll' || n.type === 'bomb') continue;
      const away = n.t - this.now; if (away > lead) break; if (away < -0.1) continue;
      const w = clamp(1 - away / lead, 0, 1);   // 0 a count away, 1 on the count
      if (!(cue[n.lane] > w)) cue[n.lane] = w;
    }
    this.kitCue = cue;
    const spots = drawDrumKit(ctx, A, this, { pieces, cx, baseY, width: K.width || A.w, chrome: !!instr.chrome, junk: !!instr.junk, cue });
    this.kitSpots = spots;
    const byLane = {}; for (const sp of spots) byLane[sp.i] = sp;
    // the upcoming bar, read left to right along the top: what is coming and
    // in what order, without a highway anywhere near the drums
    const ribBot = this.drawKitRibbon(ctx, A, pieces, cx, baseY);
    // the cue on each drum that owes a hit
    for (const sp of spots) {
      const w = cue[sp.i] || 0; if (w <= 0.01) continue;
      const col = PIECE_COLORS[sp.piece] || '#c2c8d6', glow = w * w * w;
      const skinY = sp.y - sp.G.grab * 0.5;
      // a pool of light gathering on the head as the count arrives
      ctx.globalAlpha = 0.18 + glow * 0.62;
      ellipsePx(ctx, sp.x, sp.y, sp.G.grab * (0.5 + glow * 0.5), sp.G.grab * 0.62 * (0.5 + glow * 0.5), lighten(col, 0.5));
      ctx.globalAlpha = 1;
      // A solid caret riding down onto the drum at a steady speed: it leaves
      // the top a whole count early and touches the skin on the count, so the
      // beat is something you watch arrive rather than something you aim at.
      // Outlined and bright, because it has to read over a lit street.
      const top = Math.round(sp.y - sp.G.grab * 0.62 - 42);
      const cy = Math.round(top + w * 36), body = w > 0.84 ? '#fffbe8' : lighten(col, 0.55);
      // a dotted thread down to the skin, so the eye joins the two
      ctx.globalAlpha = 0.16 + w * 0.34;
      for (let yy = cy + 10; yy < skinY; yy += 3) rect(ctx, sp.x, yy, 1, 2, body);
      ctx.globalAlpha = 1;
      ctx.globalAlpha = clamp(0.6 + w * 0.4, 0, 1);
      rect(ctx, sp.x - 9, cy - 7, 19, 4, '#12101c');
      rect(ctx, sp.x - 8, cy - 6, 17, 2, body);
      for (let i = 0; i < 9; i++) { const hw = 8 - i; rect(ctx, sp.x - hw - 1, cy - 3 + i, (hw + 1) * 2 + 1, 1, '#12101c'); }
      rect(ctx, sp.x - 1, cy + 6, 3, 1, '#12101c');
      for (let i = 0; i < 8; i++) { const hw = 8 - i; rect(ctx, sp.x - hw, cy - 2 + i, hw * 2 + 1, 1, i < 3 ? body : darken(body, 0.2)); }
      ctx.globalAlpha = 1;
      // and the landing itself, so the exact instant is unmistakable
      if (w > 0.88) { ctx.globalAlpha = (w - 0.88) / 0.12 * 0.95; ellipsePx(ctx, sp.x, sp.y, sp.G.grab * 1.05, sp.G.grab * 0.54, '#fff8e0'); ctx.globalAlpha = 1; }
    }
    // a bomb, if a chart ever asks for one, is a drum to leave alone
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged || n.type !== 'bomb') continue;
      const k = (n.t - this.now) / this.approach; if (k > 1) break; if (k < -0.1) continue;
      const sp = byLane[n.lane]; if (!sp) continue;
      ctx.globalAlpha = clamp(1.1 - k, 0, 1);
      drawText(ctx, 'X', sp.x, sp.y - 4, '#ff8a6a', { align: 'center', scale: 2, outline: '#1a1410' });
      ctx.globalAlpha = 1;
    }
    // a hint only while the first few notes go by
    if (this.now < this.song.beat * 8) {
      ctx.globalAlpha = clamp(1 - this.now / (this.song.beat * 8), 0, 1) * 0.85;
      drawText(ctx, A.touch ? 'TAP ANYWHERE ON THE COUNT - ANY KEY, ANY DRUM' : 'HIT ON THE COUNT - ANYWHERE, ANY KEY',
        cx, ribBot + 7, '#fff2c8', { align: 'center', font: 'small', outline: '#1a1410' });
      ctx.globalAlpha = 1;
    }
  }
  // The bar you are about to play, written out as a rhythm: one rail per drum,
  // a tick on every count, the chips walking into a now-line on the left, and
  // the count itself ticking along the bottom. It is the only place you read
  // ahead, it never moves onto you, and there is not a ring on it anywhere.
  drawKitRibbon(ctx, A, pieces, cx, baseY) {
    // Sits right above the kit, so reading ahead and hitting are the same look.
    const rowH = 9, cntH = 13, h = 10 + pieces.length * rowH + cntH;
    const halfW = Math.min(174, A.w / 2 - 20);
    const x0 = Math.round(cx - halfW), x1 = Math.round(cx + halfW), wid = x1 - x0;
    const y = Math.round(baseY - Math.max(120, 76 + h)), span = this.song.beat * 4;
    const hitX = x0 + 26, endX = x1 - 7, railBot = y + h - cntH;
    // an opaque panel: this has to be readable over a lit street at night
    rect(ctx, x0 + 2, y + 3, wid, h, 'rgba(6,4,12,0.45)');
    rect(ctx, x0, y, wid, h, '#16122a');
    frame(ctx, x0, y, wid, h, '#4a4270');
    rect(ctx, x0 + 1, y + 1, wid - 2, 1, '#6a5f9a');
    // one rail per piece, tinted like the drum it belongs to, with a swatch at
    // the head of it so a rail and a drum are obviously the same thing
    pieces.forEach((p, i) => {
      const ry = y + 8 + i * rowH, col = PIECE_COLORS[p] || '#8a80b0';
      rect(ctx, hitX - 2, ry, endX - hitX + 4, 1, darken(col, 0.55));
      rect(ctx, x0 + 4, ry - 3, 7, 7, '#0c0a16');
      rect(ctx, x0 + 5, ry - 2, 5, 5, col);
      rect(ctx, x0 + 5, ry - 2, 5, 2, lighten(col, 0.35));
    });
    // the counts, so the strip reads as a bar of music rather than a timeline
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
      const bt = b * this.song.beat, k = (bt - this.now) / span; if (k > 1) break; if (k < 0) continue;
      const x = Math.round(hitX + k * (endX - hitX)), one = ((b % 4) + 4) % 4 === 0;
      rect(ctx, x, y + 4, 1, railBot - y - 6, one ? '#6a5c9a' : '#332c52');
      if (one) rect(ctx, x - 1, y + 3, 3, 2, '#e0b040');
    }
    // the now-line: play when a chip touches it
    rect(ctx, hitX - 1, y + 3, 2, railBot - y - 5, '#ffd24a');
    rect(ctx, hitX - 3, y + 3, 6, 2, '#fff2b0'); rect(ctx, hitX - 3, railBot - 4, 6, 2, '#fff2b0');
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue;
      const k = (n.t - this.now) / span; if (k > 1) break; if (k < -0.02) continue;
      const x = Math.round(hitX + k * (endX - hitX));
      const col = n.type === 'bomb' ? '#c8302a' : n.star ? '#ffd24a' : (PIECE_COLORS[pieces[n.lane]] || '#c2c8d6');
      const ny = y + 5 + n.lane * rowH;
      // the nearer it is to the line, the brighter it reads
      const near = clamp(1 - k * 6, 0, 1);
      rect(ctx, x - 3, ny, 7, 7, '#0c0a16');
      rect(ctx, x - 2, ny + 1, 5, 5, near > 0.4 ? lighten(col, 0.25) : col);
      rect(ctx, x - 2, ny + 1, 5, 2, lighten(col, 0.5));
      if (near > 0.6) { ctx.globalAlpha = (near - 0.6) * 2.2; rect(ctx, x - 4, ny - 1, 9, 9, '#fff8e0'); rect(ctx, x - 2, ny + 1, 5, 5, lighten(col, 0.4)); ctx.globalAlpha = 1; }
    }
    // ---- the count along the bottom. Rhythm is the whole instrument, so it
    // gets a read-out of its own: four cells, one filling on each beat and
    // draining until the next. One is marked, so you never lose the bar.
    const beatNo = ((Math.floor(this.now / this.song.beat) % 4) + 4) % 4, pb = this.beatPulse;
    rect(ctx, x0 + 1, railBot, wid - 2, 1, '#3a3560');
    const cw = Math.floor((wid - 10) / 4), cy0 = railBot + 3, ch = cntH - 5;
    for (let i = 0; i < 4; i++) {
      const x = x0 + 5 + i * cw, w2 = cw - 3, on = i === beatNo, one = i === 0;
      rect(ctx, x, cy0, w2, ch, on ? '#3a3462' : '#211c3a');
      if (on) {
        const fw = Math.max(2, Math.round(w2 * pb));
        rect(ctx, x, cy0, fw, ch, one ? '#ffd24a' : '#fff2b0');
        rect(ctx, x, cy0, fw, 2, '#fff8e0');
      }
      frame(ctx, x, cy0, w2, ch, on ? '#ffe9a8' : '#3a3560');
      drawText(ctx, String(i + 1), x + Math.round(w2 / 2), cy0 + 1, on && pb > 0.35 ? '#2a2140' : on ? '#e0d4ff' : '#6a5f9a', { align: 'center', font: 'small' });
    }
    return y + h;
  }
  // ---------- Reading off the page ----------
  // The chart is written out as notation on a sheet of paper that scrolls past
  // a playhead. Pitch is height on the stave; you play what you read.
  drawSheetView(ctx, A) {
    const instr = this.instrument, L = instr.lanes;
    const pw = Math.min(A.w - 60, 800), ph = A.touch ? 118 : 132;
    const px0 = Math.round(A.x + (A.w - pw) / 2), py0 = Math.round(A.y + (A.touch ? 26 : 30));
    // the sheet, propped on a stand, with a shadow under it
    ctx.fillStyle = 'rgba(8,6,14,0.5)'; ctx.fillRect(px0 + 5, py0 + 7, pw, ph);
    const S = drawStave(ctx, px0, py0, pw, ph, { seed: hashStr(this.song.name || 'x') & 31 });
    this.sheet = S;
    // title in the corner of the page, the way a chart is headed
    drawText(ctx, (this.song.name || '').toUpperCase(), px0 + pw - 8, py0 + 6, '#6a5c48', { align: 'right', font: 'small' });
    drawText(ctx, instr.name.toUpperCase(), px0 + pw - 8, py0 + ph - 12, '#6a5c48', { align: 'right', font: 'small' });
    const hitX = S.padLeft + 26, endX = S.right - 14, runW = endX - hitX;
    // bar lines walking past
    for (let b = Math.ceil((this.now - this.approach * 0.2) / (this.song.beat * 4)); ; b++) {
      const bt = b * this.song.beat * 4, k = (bt - this.now) / this.approach;
      if (k > 1.02) break; if (k < -0.2) continue;
      const x = Math.round(hitX + k * runW);
      if (x > S.left && x < S.right) rect(ctx, x, S.top, 1, S.bot - S.top + 1, '#5e5245');
    }
    // the playhead: a bar of light down the page, where now is
    ctx.globalAlpha = 0.2 + this.beatPulse * 0.22;
    rect(ctx, hitX - 7, py0 + 3, 15, ph - 6, '#e0c060'); ctx.globalAlpha = 1;
    rect(ctx, hitX, py0 + 3, 1, ph - 6, '#b8332a');
    rect(ctx, hitX - 2, py0 + 3, 5, 2, '#b8332a'); rect(ctx, hitX - 2, py0 + ph - 5, 5, 2, '#b8332a');
    this.receptors.main = { x: hitX, y: S.midY };
    // notes, written out
    ctx.save(); ctx.beginPath(); ctx.rect(S.left + 2, py0, pw - 4, ph); ctx.clip();
    const vis = [];
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      const k = (n.t - this.now) / this.approach; if (k > 1.04) break;
      if (n.type === 'hold') { if (n.judged && (n.tailJudged || !n.hit)) continue; if ((n.t + n.dur - this.now) / this.approach < -0.16) continue; }
      else { if (n.judged) continue; if (k < -0.16) continue; }
      vis.push({ n, k });
    }
    for (const { n, k } of vis) {
      const x = hitX + k * runW, ny = stavePos(S, n.lane, L);
      const col = n.star ? '#d9a520' : LANE_COLORS[n.lane % LANE_COLORS.length];
      this.receptors[n.lane] = { x: hitX, y: ny };
      if (n.type === 'bomb') { drawText(ctx, 'X', x, ny - 5, '#b8332a', { align: 'center', scale: 2 }); continue; }
      if (n.type === 'hold') {
        // a tie running from the head to where the note lets go
        const k2 = (n.t + n.dur - this.now) / this.approach, x2 = hitX + k2 * runW;
        const th = n.holding ? 3 : 2;
        rect(ctx, Math.round(Math.min(x, x2)), ny - 1, Math.max(2, Math.round(Math.abs(x2 - x))), th, n.holding ? lighten(col, 0.2) : withAlpha(col, 0.85));
        rect(ctx, Math.round(Math.min(x, x2)), ny - 2 - th, Math.max(2, Math.round(Math.abs(x2 - x))), 1, '#6a5c48');
        if (n.holding) { if (Math.random() < 0.5) this.fx.add({ x: hitX, y: ny, vx: 20, vy: -30, life: 0.3, color: col, kind: 'px', gravity: 0 }); continue; }
      }
      drawNotehead(ctx, S, x, ny, col, { star: n.star, hold: n.type === 'hold', flag: n.type !== 'hold' && !n.chord, judged: false });
      if (n.chord) rect(ctx, Math.round(x) - 5, ny - 8, 11, 1, '#2a2118');
    }
    ctx.restore();
    // which finger goes where, printed under the stave like a fingering guide
    if (!A.touch) for (let l = 0; l < L; l++) {
      const ny = stavePos(S, l, L), held = this.keysDown.has(instr.keys[l]) || (this.flashes[l] || 0) > 0.05;
      const bx = S.left + 6;
      rect(ctx, bx, ny - 4, 9, 9, held ? LANE_COLORS[l % LANE_COLORS.length] : 'rgba(240,232,208,0.75)');
      frame(ctx, bx, ny - 4, 9, 9, '#6a5c48');
      drawText(ctx, instr.keyNames[l], bx + 4, ny - 2, held ? '#fff' : '#4a4038', { align: 'center', font: 'small' });
    }
    // the lip of a music stand holding the page up
    const sy2 = py0 + ph;
    rect(ctx, px0 - 6, sy2, pw + 12, 4, '#5e5462');
    rect(ctx, px0 - 6, sy2, pw + 12, 1, '#8e8496');
    for (const d of [-0.3, 0.3]) { const bx = Math.round(px0 + pw / 2 + pw * d); rect(ctx, bx - 1, sy2 + 4, 3, 12, '#6e6472'); rect(ctx, bx - 1, sy2 + 4, 1, 12, '#9a90a0'); }
  }
  drawLanes(ctx, A) {
    if (this.instrument.view === 'kit') return this.drawKitView(ctx, A);
    if (this.instrument.view === 'sheet') return this.drawSheetView(ctx, A);
    const instr = this.instrument, L = instr.lanes, kind = this.section.instrument;
    // a kit needs room under the hit line for the shells and their name plates
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
    // Every lane instrument stands on its own instrument now. The shamisen and
    // the koto used to play on a bare highway with nothing under the notes,
    // which made two of the best-sounding things in the game the dullest to
    // look at.
    const surf = { beat: this.song.beat, now: this.now, approach: this.approach, time: this.now, laneColors: cols };
    if (isString) drawFretboard(ctx, hw, this, Object.assign({ bass: kind === 'bass', bodyColor: kind === 'bass' ? '#3a2a5a' : '#8a3a22' }, surf));
    else if (kind === 'shamisen') drawShamisenNeck(ctx, hw, this, surf);
    else if (kind === 'koto') drawKotoBoard(ctx, hw, this, surf);
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
    const bamboo = this.section.instrument === 'shakuhachi';
    const hitX = A.x + 150, top = A.y + (A.touch ? 22 : 34), bot = A.y + A.h - (A.touch ? 34 : 44);
    drawPlayerStrip(ctx, A, this, { top, bot, lightX: A.x + 74, lightColor: bamboo ? '#a8d8e8' : '#ffd08a' });
    for (let i = 0; i <= 4; i++) { ctx.globalAlpha = 0.35; rect(ctx, A.x, top + (bot - top) * i / 4, A.w, 1, '#3a3068'); ctx.globalAlpha = 1; }
    const pxPerSec = (A.w - 170) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, top - 6, bot - top + 12, pxPerSec);
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
    drawSaxBody(ctx, A.x + 74, bot + 4, this.breath, !!this.breathNote, this.now, this.section.instrument, A.touch ? 1.05 : 1.35);
    const bw = 130, bx = A.x + A.w - bw - 14, by = A.y + A.h - 16;
    uiBar(ctx, bx, by, bw, 9, this.breath, this.breath < 0.25 ? '#ff5a5a' : '#6fb8ff', { label: 'BREATH' });
  }
  drawValves(ctx, A) {
    const hitX = A.x + 96, cy = A.y + A.h * 0.38;
    drawPlayerStrip(ctx, A, this, { top: A.y + 10, bot: A.y + A.h - (A.touch ? 18 : 26), lightX: A.x + A.w / 2, lightColor: '#ffd08a' });
    vgrad(ctx, A.x, cy - 32, A.w, 64, 'rgba(20,14,34,0.72)', 'rgba(12,8,22,0.5)');
    const pxPerSec = (A.w - 120) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, cy - 30, 60, pxPerSec);
    // the receptor: a solid brass gate, not a ring floating in the dark
    rect(ctx, hitX - 3, cy - 26, 6, 52, '#2a2038');
    rect(ctx, hitX - 2, cy - 25, 4, 50, this.flashes.valve > 0 ? '#fff2b0' : '#d9a83c');
    rect(ctx, hitX - 8, cy - 28, 16, 4, '#efd77e'); rect(ctx, hitX - 8, cy + 24, 16, 4, '#efd77e');
    this.receptors.main = { x: hitX, y: cy }; this.receptors[0] = this.receptors.main;
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue; const x = hitX + (n.t - this.now) * pxPerSec; if (x > A.x + A.w + 20) break; if (x < A.x - 20) continue;
      ctx.globalAlpha = this.noteAlpha((n.t - this.now) / this.approach);
      if (n.type === 'bomb') { circle(ctx, x, cy, 10, '#1a1410'); circle(ctx, x, cy, 9, '#c8302a'); ctx.globalAlpha = 1; continue; }
      circle(ctx, x, cy + 2, 17, 'rgba(0,0,0,0.3)'); circle(ctx, x, cy, 17, '#120e1c'); circle(ctx, x, cy, 16, n.star ? '#ffd24a' : '#f0c040'); circle(ctx, x, cy, 14, n.star ? '#e0b030' : '#c89a2a');
      for (let v = 0; v < 3; v++) { const on = (n.combo >> v) & 1; rect(ctx, x - 10 + v * 7, cy - 8, 5, 16, on ? '#fffbe0' : '#5a4210'); if (on) drawText(ctx, this.instrument.keyNames[v], x - 9 + v * 7, cy - 2, '#1a1410', { font: 'small' }); }
      ctx.globalAlpha = 1;
    }
    drawTrumpetBody(ctx, A.x + A.w / 2, A.y + A.h - (A.touch ? 34 : 54), this.valveMask, this.now, A.touch ? 1.05 : 1.4);
  }
  drawBow(ctx, A) {
    const hitX = A.x + 158, top = A.y + (A.touch ? 22 : 32), bot = A.y + A.h - (A.touch ? 30 : 44);
    drawPlayerStrip(ctx, A, this, { top, bot, lightX: A.x + 80, lightColor: '#c8a8ff' });
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.35; rect(ctx, A.x, top + (bot - top) * i / 3, A.w, 1, '#3f3468'); ctx.globalAlpha = 1; }
    const pxPerSec = (A.w - 180) / this.approach; this.beatLinesH(ctx, hitX, A.x + A.w, top - 6, bot - top + 12, pxPerSec);
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
    drawViolinBody(ctx, A.x + 80, A.y + A.h / 2, this.keysDown.has('ArrowUp') || this.keysDown.has('KeyW') ? 1 : -1, !!Object.keys(this.holds).length, this.now, A.touch ? 1.0 : 1.3);
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
