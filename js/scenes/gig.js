// ---------- A street set: play, tally, draft an ability ----------
'use strict';
class GigScene {
  constructor(node) {
    const r = Game.run; this.node = node; this.venue = VENUES[node.venue] || VENUES.corner; this.t = 0; this.phase = 'prep';
    this.mode = node.icon === 'elite' ? 'elite' : node.venue === 'bridge' ? 'boss' : 'gig';
    this.bossMod = this.mode !== 'gig' ? (node.bossMod || (node.bossMod = r.rng.pick(BOSS_MOD_KEYS))) : null;
    this.difficulty = clamp(Math.round(1 + r.day * 0.8 + (this.mode === 'elite' ? 1 : 0) + (this.mode === 'boss' ? 2 : 0)), 1, 7);
    const leader = r.members[0], fam = INSTRUMENTS[leader.instrument].family;
    const pool = r.buffs.genre ? TUNE_BY_GENRE(r.buffs.genre) : TUNE_KEYS.filter(k => this.difficulty >= 4 || !TUNES[k].hard);
    this.tuneKey = r.rng.pick(pool.length ? pool : TUNE_KEYS);
    this.song = songFromTune(this.tuneKey, { bpm: TUNES[this.tuneKey].bpm + r.day * 2 });
    this.bars = this.mode === 'boss' ? Math.max(12, this.song.bars) : this.song.bars;
    this.V = buildVenue(this.venue, hashStr(node.id + r.seed), r.day / 5);
    this.active = r.members.map(m => m.stamina >= 15 || m.leader); this.useItems = {};
    this.layout(); this.buildPrepMenu(); this.pads = []; this.padPointers = new Map(); this.fx = new Particles();
    this.train = { x: -700, t: r.rng.range(4, 9) };
  }
  layout() {
    const t = Game.touch;
    this.L = t ? { top: true, stageTop: 18, stageBottom: 98, groundY: 78, rows: [0, -5, -10], streetY: null, rhythmY: 100, rhythmH: 192, padY: 296, padH: 60, compact: true }
      : { top: false, stageTop: 216, stageBottom: 360, groundY: 300, rows: [0, -6, -12], streetY: 318, streetH: 42, rhythmY: 16, rhythmH: 196, padY: 0, padH: 0 };
    this.stageX = 150; this.hatX = this.stageX + 64;
  }
  isPlaying() { return this.phase === 'play'; }
  buildPrepMenu() {
    const r = Game.run, items = [];
    r.members.forEach((m, i) => { if (!m.leader) items.push({ label: (this.active[i] ? 'ON' : 'OFF') + '  ' + m.name, right: INSTRUMENTS[m.instrument].name, icon: 'note', onSelect: () => { if (m.stamina < 15) { Audio.ui('error'); return; } this.active[i] = !this.active[i]; const k = this.menu.idx; this.buildPrepMenu(); this.menu.idx = k; } }); });
    const seen = new Set();
    r.consumables.forEach(k => { const c = CONSUMABLES[k]; if (seen.has(k) || c.target !== 'run') return; seen.add(k); items.push({ label: (this.useItems[k] ? 'USE  ' : '     ') + c.name, right: c.desc.slice(0, 22), icon: c.icon, onSelect: () => { this.useItems[k] = !this.useItems[k]; const i2 = this.menu.idx; this.buildPrepMenu(); this.menu.idx = i2; } }); });
    items.push({ label: 'START THE SET', icon: 'gig', onSelect: () => this.startPlay() });
    const keep = this.menu ? this.menu.idx : items.length - 1; this.menu = new Menu(items); this.menu.idx = Math.min(keep, items.length - 1);
  }
  startPlay() {
    const r = Game.run; Audio.init(); Audio.setStageReverb(false);
    for (const k in this.useItems) if (this.useItems[k]) { const i = r.consumables.indexOf(k); if (i >= 0) { r.consumables.splice(i, 1); CONSUMABLES[k].use(r); } }
    this.performers = r.members.filter((m, i) => this.active[i]); if (!this.performers.length) this.performers = [r.members[0]];
    const leader = r.members[0], mates = this.performers.filter(m => !m.leader);
    const sections = []; let mi = 0;
    for (let b = 0; b < this.bars; b += 4) { const spot = (b / 4) % 2 === 1 && mates.length; if (spot) { const m = mates[mi++ % mates.length]; sections.push({ instrument: m.instrument, startBar: b, endBar: Math.min(this.bars, b + 4), qte: true, member: m }); } else sections.push({ instrument: leader.instrument, startBar: b, endBar: Math.min(this.bars, b + 4), member: leader }); }
    this.sections = sections;
    const mods = r.gigMods(this.performers, this.difficulty, this.bossMod); mods.fx = { shake: Game.shake };
    const notes = chartFromMelody(this.song, sections, this.difficulty, r.rng, { bombMult: (this.bossMod === 'heckler' ? 3 : 1) * (mods.bombMult || 1), starRate: mods.starRate || 0.08 });
    this.mods = mods;
    this.S = new ScoreState(r, { instrument: leader.instrument, genre: this.song.genre, tune: this.tuneKey, performers: this.performers.length, band: this.performers, venue: this.venue, mode: this.mode, bossMod: this.bossMod, mods, battle: !!(r.pendingGig && r.pendingGig.battle) });
    this.rhythm = new RhythmGame(this.song, sections, notes, mods, {
      onJudge: (n, j, info) => { const a = this.S.onHit(n, j, info); if (a) this.fx.text(this.hatX + 24, this.L.groundY - 52, '+' + a, n.star ? '#ffd24a' : '#fff', { life: 0.55, font: 'small' }); },
      onCheer: () => this.S.onCheer(), onQte: (j) => this.S.onQte(j), onRoll: () => this.S.onRoll(),
      onBombDodged: () => { this.S.onBombDodged(); if (this.mods.dodgeMult) this.S.multAdd += this.mods.dodgeMult; },
      onSection: (sec, isLast) => this.S.setSection(isLast),
    });
    const wmul = (WEATHERS[r.weather] || WEATHERS.clear).tipMult;
    this.crowd = new Crowd(this.venue, Object.assign({}, mods, { bossMod: this.bossMod, range: 1, crowd: mods.crowd * wmul }), r.rng, { groundY: this.L.groundY, rows: this.L.rows, streetY: this.L.streetY, streetH: this.L.streetH, stageX: this.stageX, hatX: this.hatX, hatY: this.L.groundY - 4 });
    const start = Audio.now() + 0.6 + this.song.leadIn; this.rhythm.begin(start);
    this.backing = new Backing(this.song, start - this.song.leadIn, (t) => { const sec = sections.find(s => t - start >= s.start - this.song.leadIn - 0.001 && t - start < s.end - this.song.leadIn); const ins = sec ? sec.instrument : null; return { drums: ins === 'drums', bass: ins === 'bass' }; });
    this.phase = 'play'; this.padKey = null; this.quakeT = 3;
    this.pauseBtn = new Btn(6, this.L.rhythmY + 4, 24, 14, 'II', () => this.togglePause(), { color: '#3a3560', hi: '#5a5490', lo: '#2a2540', ol: '#1a1430' });
    this.pauseButtons = [new Btn(W / 2 - 100, 150, 92, 26, 'RESUME', () => this.togglePause()), new Btn(W / 2 + 8, 150, 92, 26, 'BAIL OUT', () => this.quit(), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14' })];
  }
  update(dt) {
    this.t += dt; this.fx.update(dt, Game.wind.px);
    if (this.phase === 'play') {
      if (this.paused) return;
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch) { const k = this.rhythm.section.qte ? 'qte' : this.rhythm.section.instrument; if (this.padKey !== k) { this.padKey = k; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, this.rhythm.section.qte); } }
      this.crowd.update(dt, this.rhythm.hype, this.rhythm.events, Game.wind.v);
      this.S.watcherTick(dt, this.crowd.watchers.length);
      if (this.bossMod === 'quake') { this.quakeT -= dt; if (this.quakeT <= 0) { this.quakeT = 4 + Math.random() * 5; Game.shake.hit(6, 0.6); Audio.drum('stomp', 0, 0.6); } }
      this.train.t -= dt; if (this.train.t < 0 && this.venue.kind === 'subway') { this.train.x += dt * 300; if (this.train.x > W + 400) { this.train.x = -700; this.train.t = 7 + Math.random() * 8; } }
      if (this.rhythm.finished) this.finish();
    } else if (this.phase === 'tally') { this.tallyT += dt; this.advanceTally(); }
  }
  finish() {
    const r = Game.run, res = this.rhythm.results(); this.res = res;
    const total = this.S.finish({ combo: this.rhythm.combo, maxCombo: res.maxCombo, misses: res.miss, watchers: this.crowd.watchers.length, hype: this.rhythm.hype, acc: res.acc });
    const tips = Math.round(this.crowd.earned * (this.mods.tipMult || 1) * 4) / 4;
    this.tips = tips; this.earned = total + tips;
    r.money += this.earned; r.stats.earned += this.earned; r.stats.gigs++; r.stats.bestCombo = Math.max(r.stats.bestCombo, res.maxCombo); r.stats.perfects += res.perfect; r.stats.bestPayout = Math.max(r.stats.bestPayout, this.earned);
    r.lastTune = this.tuneKey; r.pendingGig = null; r.buffs = {};
    const st = 20 * (r.perks.stamina || 1) + (this.mods.staminaExtra || 0); this.xpLines = [];
    for (const m of this.performers) { m.stamina = Math.max(0, m.stamina - st * (m.hunger ? 1.4 : 1)); m.gigs++; const xp = 0.5 + res.acc * 1.5; m.xp += xp; let up = 0; while (m.xp >= 3 && m.skill < 10) { m.xp -= 3; m.skill++; up++; } if (up) this.xpLines.push(m.name + ' LV' + m.skill); }
    this.grade = res.acc >= 0.95 ? 'S' : res.acc >= 0.85 ? 'A' : res.acc >= 0.7 ? 'B' : res.acc >= 0.5 ? 'C' : 'D';
    this.phase = 'tally'; this.tallyT = 0; this.tallyStep = 0; this.tallyDone = false;
    if (res.acc >= 0.7) Audio.applause(clamp(res.acc, 0.3, 1), 1.5);
    r.save();
  }
  advanceTally() {
    const steps = this.S.steps, per = 0.4, target = Math.min(steps.length + 1, Math.floor(this.tallyT / per));
    while (this.tallyStep < target) {
      const st = steps[this.tallyStep];
      if (st) { Audio.ui(st.kind === 'mult' ? 'stamp' : st.kind === 'times' ? 'mult' : st.kind === 'cash' ? 'coin' : 'tally'); this.fx.burst(W / 2, 110, 8, { color: st.kind === 'mult' || st.kind === 'times' ? '#ff5a5a' : '#5bc0ff', speed: 60, life: 0.4, kind: 'spark' }); }
      else if (!this.tallyDone) { this.tallyDone = true; Audio.ui('cash'); this.fx.burst(W / 2, 150, 34, { color: ['#ffd24a', '#fff', '#6be585'], speed: 130, life: 0.8, kind: 'star', size: 2, gravity: 60 }); }
      this.tallyStep++;
    }
  }
  next() { Game.setScene(new DraftScene(this)); }
  key(code) {
    if (this.phase === 'prep') { this.menu.key(code); return; }
    if (this.phase === 'tally') { if (!this.tallyDone) { if (['Enter', 'Space'].includes(code)) this.tallyT = 999; return; } if (['Enter', 'Space'].includes(code)) this.next(); return; }
    if (code === 'Escape') { this.togglePause(); return; }
    if (this.paused) { if (code === 'KeyQ') this.quit(); return; }
    this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play' && !this.paused) this.rhythm.keyUp(code); }
  togglePause() { this.paused = !this.paused; if (Audio.ctx) { if (this.paused) Audio.ctx.suspend(); else Audio.ctx.resume(); } this.rhythm.keysDown.clear(); }
  quit() { if (Audio.ctx) Audio.ctx.resume(); this.backing.stop(); this.rhythm.finished = true; this.paused = false; this.S.applause *= 0.5; this.finish(); }
  padAt(x, y) { return this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h); }
  pointerDown(x, y, id) {
    if (this.phase === 'prep') { this.menu.click(x, y); return; }
    if (this.phase === 'tally') { if (!this.tallyDone) { this.tallyT = 999; return; } this.next(); return; }
    if (this.paused) { for (const b of this.pauseButtons) if (b.hit(x, y)) { b.onTap(); return; } return; }
    if (this.pauseBtn.hit(x, y)) { this.pauseBtn.onTap(); return; }
    const pad = this.padAt(x, y); if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); }
    else if (Game.touch && this.rhythm.section.qte) { this.padPointers.set(id, 'Space'); this.rhythm.keyDown('Space'); }
  }
  pointerMove(x, y, id) { if (this.phase !== 'play' || this.paused) return; const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { const c = this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); } }
  hover(x, y) { if (this.phase === 'prep') this.menu.hover(x, y); }
  drawStage(ctx) {
    const L = this.L; drawVenue(ctx, this.V, L, this.t, Game.wind, this.venue);
    ctx.save(); ctx.beginPath(); ctx.rect(0, L.stageTop, W, L.stageBottom - L.stageTop); ctx.clip();
    if (this.venue.kind === 'subway' && this.train.t < 0 && L.streetY) { const tx = Math.round(this.train.x), ty = L.streetY + 4; rect(ctx, tx, ty, 700, 34, '#c8c8d0'); rect(ctx, tx, ty, 700, 3, '#e8e8f0'); rect(ctx, tx, ty + 26, 700, 5, '#2a4a9a'); for (let x = tx + 10; x < tx + 700; x += 34) { rect(ctx, x, ty + 7, 22, 14, '#ffe8a0'); } }
    const perf = this.performers || Game.run.members, cur = this.rhythm ? this.rhythm.section.member : null;
    const onBeat = this.rhythm ? (this.rhythm.onBeat || this.rhythm.beatPulse > 0.78) : false;
    if (this.crowd) { this.crowd.drawCars(ctx, 0); this.crowd.drawPeds(ctx, [2]); }
    drawBand(ctx, perf, cur, this.stageX, L.groundY + L.rows[1], this.t, onBeat, this.hatX, 0);
    if (this.crowd) this.crowd.drawPigeons(ctx);
    drawBand(ctx, perf, cur, this.stageX, L.groundY + L.rows[1], this.t, onBeat, this.hatX, 1);
    if (this.crowd) { this.crowd.drawPeds(ctx, [1, 0]); this.crowd.drawCars(ctx, 1); this.crowd.drawCoins(ctx); }
    this.fx.draw(ctx); ctx.restore();
    const wk = WEATHERS[Game.run.weather] || WEATHERS.clear;
    if (wk.tint) { ctx.fillStyle = wk.tint; ctx.fillRect(0, L.stageTop, W, L.stageBottom - L.stageTop); }
    if (this.rhythm) {
      const hx = W - 16, hy = L.stageTop + 6, hh = Math.min(84, L.stageBottom - L.stageTop - 22);
      rect(ctx, hx - 1, hy - 1, 10, hh + 2, '#1a1410'); const fill = hh * this.rhythm.hype / 100;
      rect(ctx, hx, hy + hh - fill, 8, fill, this.rhythm.hype > 70 ? '#ff5a9a' : this.rhythm.hype > 40 ? '#ffd166' : '#6fb8ff'); frame(ctx, hx - 1, hy - 1, 10, hh + 2, '#888');
      if (this.rhythm.hype > 80 && Math.random() < 0.5) this.fx.add({ x: hx + 4, y: hy + hh - fill, vx: 0, vy: -30, life: 0.4, color: '#ff9030', kind: 'fire', size: 2, gravity: 0 });
      rect(ctx, W - 120, L.stageTop + 4, 96, 28, 'rgba(10,8,20,0.72)'); frame(ctx, W - 120, L.stageTop + 4, 96, 28, '#3a3560');
      drawText(ctx, fmtNum(this.S.applause), W - 28, L.stageTop + 7, '#fff', { align: 'right', scale: 2 });
      ctx.drawImage(icon('heart'), W - 116, L.stageTop + 22, 8, 7); drawText(ctx, this.crowd.watchers.length + '', W - 104, L.stageTop + 23, '#cfc9e6', { font: 'small' });
      ctx.drawImage(icon('coin'), W - 84, L.stageTop + 21, 9, 8); drawText(ctx, fmtMoney(this.crowd.earned), W - 72, L.stageTop + 23, '#ffd24a', { font: 'small' });
    }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0b0916'); const L = this.L;
    if (this.phase === 'prep') {
      this.drawStage(ctx);
      const rows = Game.run.members.length > 1 ? 1 : 0;
      const PH = 116 + (this.bossMod ? 15 : 0) + this.menu.items.length * (Game.touch ? 15 : 13);
      const PY = L.top ? 102 : Math.max(20, L.stageTop - PH - 12);
      const inner = uiPanel(ctx, 16, PY, W - 32, Math.min(PH, L.top ? H - 106 : L.stageTop - 26), { title: this.node.name });
      const G = GENRES[this.song.genre];
      drawText(ctx, this.song.name.toUpperCase(), inner.x + 8, inner.y + 5, '#7a4a10', { scale: 2 });
      drawText(ctx, this.song.composer.toUpperCase(), inner.x + 8, inner.y + 24, UI.inkSoft, { font: 'small' });
      rect(ctx, inner.x + 8 + textWidth(this.song.composer.toUpperCase(), { font: 'small' }) + 8, inner.y + 23, textWidth(G.name.toUpperCase(), { font: 'small' }) + 8, 8, G.color);
      drawText(ctx, G.name.toUpperCase(), inner.x + 8 + textWidth(this.song.composer.toUpperCase(), { font: 'small' }) + 12, inner.y + 24, '#1a1410', { font: 'small' });
      for (let i = 0; i < this.difficulty; i++) ctx.drawImage(icon('star'), inner.x + inner.w - 14 - i * 13, inner.y + 6, 11, 10);
      ctx.drawImage(icon('coin'), inner.x + inner.w - 92, inner.y + 20, 9, 8); drawText(ctx, this.venue.wealth >= 1.5 ? 'RICH' : this.venue.wealth >= 1 ? 'OK' : 'THIN', inner.x + inner.w - 80, inner.y + 22, UI.ink, { font: 'small' });
      ctx.drawImage(icon('heart'), inner.x + inner.w - 44, inner.y + 21, 8, 7); drawText(ctx, this.venue.traffic >= 1.3 ? 'BUSY' : 'QUIET', inner.x + inner.w - 33, inner.y + 22, UI.ink, { font: 'small' });
      let y = inner.y + 36;
      if (this.bossMod) { const bm = BOSS_MODS[this.bossMod]; rect(ctx, inner.x + 8, y, inner.w - 16, 12, bm.color); ctx.drawImage(icon('skull'), inner.x + 11, y + 2, 8, 8); drawText(ctx, bm.name.toUpperCase() + ': ' + bm.desc, inner.x + 22, y + 3, '#1a1410', { font: 'small' }); y += 15; }
      // lineup portraits
      const r = Game.run;
      r.members.forEach((m, i) => { const x = inner.x + 10 + i * 34; const on = this.active[i];
        circle(ctx, x + 12, y + 14, 13, on ? '#4f8032' : '#5a5060'); ctx.save(); ctx.beginPath(); ctx.arc(x + 12, y + 14, 12, 0, Math.PI * 2); ctx.clip(); drawBugAt(ctx, m.spec, x + 12, y + 27, { pose: on ? 'play' : 'idle', scale: 1.1 }); ctx.restore();
        if (!on) { ctx.globalAlpha = 0.45; circle(ctx, x + 12, y + 14, 12, '#101018'); ctx.globalAlpha = 1; }
        uiBar(ctx, x, y + 29, 24, 4, m.stamina / 100, m.stamina > 50 ? '#6fbf4a' : '#ff5a5a');
      });
      this.menu.draw(ctx, inner.x + 10, y + 38, inner.w - 20, Game.touch ? 15 : 13, 'list');
      Game.drawHud(ctx); return;
    }
    if (this.phase === 'play') {
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: L.top, pads: this.pads, backdrop: this.V.far });
      this.drawStage(ctx);
      const p = clamp(this.rhythm.now / this.song.length, 0, 1), barY = L.top ? L.stageBottom : L.stageTop - 3;
      rect(ctx, 0, barY, W, 3, '#241d2e'); rect(ctx, 0, barY, W * p, 3, '#ffd24a');
      const sec = this.rhythm.section, lbl = sec.qte ? sec.member.name.toUpperCase() : this.song.name.toUpperCase();
      const lblY = L.top ? L.stageBottom - 12 : L.stageTop + 6;
      rect(ctx, 2, lblY - 2, textWidth(lbl, { font: 'small' }) + 8, 10, 'rgba(0,0,0,0.6)'); drawText(ctx, lbl, 6, lblY, '#fff', { font: 'small' });
      if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      this.pauseBtn.draw(ctx);
      if (this.paused) { rect(ctx, 0, 0, W, H, 'rgba(0,0,0,0.75)'); uiRibbon(ctx, W / 2, 100, 'PAUSED', { scale: 2 }); for (const b of this.pauseButtons) b.draw(ctx); }
      return;
    }
    // tally
    this.drawStage(ctx);
    const PY = L.top ? 102 : 22, PH = L.top ? H - 106 : L.stageTop - 28;
    const inner = uiPanel(ctx, 34, PY, W - 68, PH, { title: 'SET COMPLETE' });
    const S = this.S, steps = S.steps, shown = Math.min(this.tallyStep, steps.length);
    let multAdd = 0, times = 1;
    for (let i = 0; i < shown; i++) { const st = steps[i]; if (st.kind === 'mult') multAdd += st.value; if (st.kind === 'times') times *= st.value; }
    const vis = steps.slice(Math.max(0, shown - 8), shown); let y = inner.y + 6;
    for (const st of vis) {
      const col = st.kind === 'applause' ? '#2a5ab0' : (st.kind === 'mult' || st.kind === 'times') ? '#b02a2a' : st.kind === 'cash' ? '#2a7a3a' : UI.inkSoft;
      const val = st.kind === 'applause' ? '+' + fmtNum(st.value) : st.kind === 'mult' ? '+' + st.value : st.kind === 'times' ? 'x' + st.value : st.kind === 'cash' ? '+' + fmtMoney(st.value) : '';
      drawText(ctx, st.label, inner.x + 8, y, UI.ink, { font: 'small' }); drawText(ctx, val, inner.x + 180, y, col, { font: 'small', align: 'right' }); y += 9;
    }
    const bx = inner.x + inner.w - 152, by = inner.y + 6;
    rect(ctx, bx, by, 144, 28, '#2a5ab0'); frame(ctx, bx, by, 144, 28, '#1a1410'); ctx.drawImage(icon('heart'), bx + 5, by + 10, 9, 8); drawText(ctx, fmtNum(shown ? S.applause : 0), bx + 138, by + 8, '#fff', { align: 'right', scale: 2 });
    const mult = Math.round(((shown ? S.baseMult : 1) + multAdd) * times * 100) / 100;
    rect(ctx, bx, by + 32, 144, 28, '#b02a2a'); frame(ctx, bx, by + 32, 144, 28, '#1a1410'); ctx.drawImage(icon('mult'), bx + 5, by + 40, 9, 9); drawText(ctx, 'x' + mult.toFixed(2), bx + 138, by + 34, '#fff', { align: 'right', scale: 2 });
    if (this.tallyDone) {
      rect(ctx, bx, by + 64, 144, 30, '#2a7a3a'); frame(ctx, bx, by + 64, 144, 30, '#1a1410'); ctx.drawImage(icon('coin'), bx + 5, by + 74, 10, 9); drawText(ctx, fmtMoney(this.earned), bx + 138, by + 68, '#fff', { align: 'right', scale: 2 });
      drawText(ctx, this.grade, bx - 34, by + 66, { S: '#d9a520', A: '#4f8032', B: '#2a5ab0', C: '#b07030', D: '#b02a2a' }[this.grade], { scale: 4, outline: '#1a1410' });
      let yy = inner.y + inner.h - 26;
      drawText(ctx, Math.round(this.res.acc * 100) + '%  x' + this.res.maxCombo + '  MISS ' + this.res.miss + (this.xpLines.length ? '   ' + this.xpLines.join(' ') : ''), inner.x + 8, yy, UI.inkSoft, { font: 'small' });
      const b = new Btn(inner.x + inner.w - 120, inner.y + inner.h - 24, 112, 20, 'PICK AN ABILITY', () => this.next()); b.draw(ctx);
    } else drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', inner.x + inner.w / 2, inner.y + inner.h - 12, UI.inkFaint, { align: 'center', font: 'small' });
    this.fx.draw(ctx); Game.drawHud(ctx);
  }
}

// ---------- Ability draft ----------
class DraftScene {
  constructor(gig) {
    const r = Game.run; this.t = 0; this.gig = gig; this.sel = 0; this.taken = false;
    const picks = []; for (let i = 0; i < 3; i++) { const k = r.randomCharm(picks); if (k) picks.push(k); }
    this.picks = picks; this.cards = [];
  }
  choose(i) {
    const r = Game.run; if (this.taken) return;
    if (i < this.picks.length) {
      const k = this.picks[i];
      if (r.charms.length >= r.charmSlots) { this.full = k; this.sel = i; Audio.ui('error'); return; }
      r.addCharm(k); Audio.ui('fanfare');
    } else { r.money += 15; Audio.ui('cash'); }
    this.taken = true; r.save(); setTimeout(() => Game.setScene(new CityScene()), 320);
  }
  swap(slot) { const r = Game.run; r.removeCharm(r.charms[slot]); r.addCharm(this.full); this.full = null; this.taken = true; Audio.ui('fanfare'); r.save(); setTimeout(() => Game.setScene(new CityScene()), 320); }
  update(dt) { this.t += dt; }
  key(code) {
    if (this.full != null) { const r = Game.run; if (code === 'ArrowLeft') this.sel = (this.sel + r.charms.length - 1) % r.charms.length; else if (code === 'ArrowRight') this.sel = (this.sel + 1) % r.charms.length; else if (['Enter', 'Space'].includes(code)) this.swap(this.sel); else if (code === 'Escape') this.full = null; return; }
    if (code === 'ArrowLeft' || code === 'KeyA') this.sel = (this.sel + this.cards.length - 1) % this.cards.length;
    else if (code === 'ArrowRight' || code === 'KeyD') this.sel = (this.sel + 1) % this.cards.length;
    else if (['Enter', 'Space'].includes(code)) this.choose(this.sel);
  }
  click(x, y) {
    if (this.full != null) { const r = Game.run; for (let i = 0; i < r.charms.length; i++) { const cx = W / 2 - r.charms.length * 18 + i * 36; if (x >= cx && x < cx + 32 && y >= 250 && y < 282) { this.swap(i); return; } } return; }
    this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.choose(i); else { this.sel = i; Audio.ui('move'); } } });
  }
  hover(x, y) { this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; }); }
  draw(ctx) {
    const r = Game.run;
    vgrad(ctx, 0, 0, W, H, '#1d1330', '#0b0818');
    for (let i = 0; i < 4; i++) { const rr = ((this.t * 70 + i * 90) % 400); ctx.globalAlpha = clamp(1 - rr / 400, 0, 1) * 0.16; ringPx(ctx, W / 2, 150, rr, '#ffd24a'); ctx.globalAlpha = 1; }
    uiRibbon(ctx, W / 2, 14, 'PICK AN ABILITY', { scale: 2, color: '#4a6e3a' });
    this.cards = []; const n = this.picks.length + 1, cw = 116, gap = 14, x0 = Math.round((W - (n * cw + (n - 1) * gap)) / 2);
    for (let i = 0; i < n; i++) {
      const isCash = i >= this.picks.length, k = this.picks[i], c = k ? CHARMS[k] : null;
      const sel = i === this.sel, x = x0 + i * (cw + gap), y = 54 - (sel ? 6 : 0), ch = 168;
      this.cards.push({ x, y, w: cw, h: ch });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 4, y + 5, cw, ch);
      rect(ctx, x, y, cw, ch, sel ? UI.goldHi : UI.woodLo); rect(ctx, x + 3, y + 3, cw - 6, ch - 6, UI.paper);
      const rar = isCash ? 'cash' : c.rarity, rc = { common: '#4d86c6', uncommon: '#4f8032', rare: '#c8433a', cash: '#2a7a3a' }[rar];
      rect(ctx, x + 3, y + 3, cw - 6, 12, rc); drawText(ctx, rar.toUpperCase(), x + cw / 2, y + 6, '#fff', { align: 'center', font: 'small' });
      uiSlot(ctx, x + cw / 2 - 21, y + 22, 42);
      const ic = icon(isCash ? 'money' : c.icon); ctx.drawImage(ic, x + cw / 2 - 15, y + 30, 30, 26);
      drawWrapped(ctx, (isCash ? 'TAKE $15' : c.name.toUpperCase()), x + 8, y + 72, 16, UI.ink, 9);
      drawWrapped(ctx, isCash ? 'Skip the ability. Cash is dinner.' : c.desc, x + 8, y + 98, 22, UI.inkSoft, 8, { font: 'small' });
      if (sel) { const k2 = Math.floor(this.t * 8) % 2; frame(ctx, x - 2 + k2, y - 2, cw + 4, ch + 4, '#fff8e8'); }
    }
    // current charms
    drawText(ctx, 'YOUR ABILITIES  ' + r.charms.length + '/' + r.charmSlots, W / 2, 236, '#cfc9e6', { align: 'center', font: 'small' });
    for (let i = 0; i < r.charmSlots; i++) { const cx = W / 2 - r.charmSlots * 18 + i * 36, k = r.charms[i]; uiSlot(ctx, cx, 250, 32, { empty: !k, selected: this.full != null && this.sel === i }); if (k) ctx.drawImage(icon(CHARMS[k].icon), cx + 9, 258, 14, 12); }
    if (this.full != null) { rect(ctx, 0, 292, W, 34, 'rgba(20,10,10,0.9)'); drawText(ctx, 'FULL - PICK ONE TO REPLACE', W / 2, 300, '#ff9f68', { align: 'center' }); drawText(ctx, Game.touch ? 'TAP A SLOT' : 'ARROWS + ENTER', W / 2, 312, '#cfc9e6', { align: 'center', font: 'small' }); }
    else drawText(ctx, Game.touch ? 'TAP A CARD' : 'ARROWS + ENTER', W / 2, 300, '#8a86b0', { align: 'center', font: 'small' });
  }
}
