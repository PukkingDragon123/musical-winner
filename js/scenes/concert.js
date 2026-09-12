// ---------- The opening stadium concert: tutorial and the fall ----------
'use strict';
const MONARCH_BAND = [
  { key: 'dot', instrument: 'drums' }, { key: 'slim', instrument: 'bass' }, { key: 'hopper', instrument: 'piano' }, { key: 'fitz', instrument: 'trumpet' }, { key: 'duke', instrument: 'sax' },
];
class ConcertScene {
  constructor() {
    this.t = 0; this.phase = 'cutscene'; this.moveIdx = 0; this.fx = new Particles(); this.crowdFx = new Particles(); this.picked = []; this.lightT = 0; this.strobe = 0;
    this.rng = makeRng(777); this.crowd = []; for (let i = 0; i < 160; i++) this.crowd.push({ x: this.rng.range(-10, W + 10), y: 322 + this.rng.range(0, 34), o: this.rng.range(0, 6), lighter: this.rng.chance(0.25), col: this.rng.pick(['#1a1626', '#221c30', '#141020']) });
    this.layout(); this.pyroT = 0; this.results = []; this.stageLights = ['#c58bff', '#5bc0ff'];
    Audio.setStageReverb(true);
    this.startCutscene(STORY.concert.intro, () => this.beginPick());
  }
  layout() { const touch = Game.touch; this.L = touch ? { rhythmY: 96, rhythmH: 196, stageTop: 18, stageBottom: 96, padY: 296, padH: 60 } : { rhythmY: 18, rhythmH: 196, stageTop: 214, stageBottom: 360, padY: 0, padH: 0 }; }
  isPlaying() { return this.phase === 'play'; }
  startCutscene(steps, onDone) { this.phase = 'cutscene'; this.cut = new CutsceneScene(steps, { bg: (ctx, t) => this.drawStadium(ctx, true), onDone }); }
  beginPick() {
    this.phase = 'pick'; this.picked = [];
    this.pickMenu = new Menu(MONARCH_BAND.map(b => ({ label: HERO_PRESETS[b.key].name + ' - ' + INSTRUMENTS[b.instrument].name, icon: null, b, onSelect: (it) => { const i = this.picked.indexOf(it.b); if (i >= 0) this.picked.splice(i, 1); else if (this.picked.length < 2) this.picked.push(it.b); else Audio.ui('error'); this.refreshPick(); } })).concat([{ label: 'TAKE THE STAGE', disabled: true, onSelect: () => this.startMovement(0) }]));
  }
  refreshPick() { this.pickMenu.items.forEach(it => { if (it.b) it.label = (this.picked.includes(it.b) ? '[x] ' : '[ ] ') + HERO_PRESETS[it.b.key].name + ' - ' + INSTRUMENTS[it.b.instrument].name; }); this.pickMenu.items[this.pickMenu.items.length - 1].disabled = this.picked.length !== 2; }
  get performers() { return [{ name: 'Buzz', spec: HERO_PRESETS.buzz, instrument: 'guitar', leader: true }].concat(this.picked.map(b => ({ name: HERO_PRESETS[b.key].name, spec: HERO_PRESETS[b.key], instrument: b.instrument, presetKey: b.key }))); }
  startMovement(i) {
    this.moveIdx = i; this.mv = CONCERT_MOVEMENTS[i]; this.phase = 'card'; this.cardT = 0;
    this.stageLights = { ballad: ['#c58bff', '#5bc0ff'], guitar: ['#ff5a5a', '#ffb340'], opera: ['#ffd24a', '#ffffff'], horns: ['#ffe14d', '#ff9f68'], band: ['#6be585', '#5bc0ff', '#ff5a5a'], solo: ['#ff2a2a', '#ffffff'] }[this.mv.key];
    this.cardBtn = new Btn(W / 2 - 60, this.L.rhythmY + this.L.rhythmH - 44, 120, 22, i === 0 ? 'BEGIN' : 'PLAY', () => this.startPlay(), { scale: 1 });
  }
  startPlay() {
    const mv = this.mv; Audio.init();
    const song = makeSong(this.rng, { genre: mv.genre, bpm: mv.bpm, bars: mv.bars, root: mv.root, prog: mv.prog, style: mv.style, name: mv.title });
    let sections;
    if (mv.band) { const mates = this.picked; sections = [{ instrument: 'guitar', startBar: 0, endBar: 2 }, { instrument: mates[0].instrument, startBar: 2, endBar: 4, qte: true, member: this.performers[1] }, { instrument: 'guitar', startBar: 4, endBar: 6 }, { instrument: mates[1].instrument, startBar: 6, endBar: 8, qte: true, member: this.performers[2] }]; }
    else sections = [{ instrument: mv.instrument, startBar: 0, endBar: mv.bars }];
    const diff = mv.impossible ? 6 : mv.difficulty;
    const notes = generateChart(song, sections, diff, this.rng, { bombMult: mv.key === 'guitar' ? 2 : 1, starRate: 0.12 });
    if (mv.impossible) { // the solo: after two bars it becomes a wall
      const extra = []; for (let bar = 2; bar < mv.bars; bar++) for (let s = 0; s < 16; s++) { const t = song.leadIn + bar * 4 * song.beat + s * song.beat / 4; extra.push({ t, lane: this.rng.int(0, 3), dur: 0, type: 'tap', midi: song.root + 24 + this.rng.int(0, 12) }); }
      notes.push(...extra); notes.sort((a, b) => a.t - b.t); notes.forEach((n, i) => { n.id = i; n.hit = false; n.judged = false; });
    }
    const mods = collectMods(null, { difficulty: diff, fx: { shake: Game.shake }, windowMult: mv.impossible ? 0.8 : 1.15, voiceOverride: mv.instrument === 'guitar' ? 'eguitar' : null });
    this.rhythm = new RhythmGame(song, sections, notes, mods, { onCheer: () => this.pyro(3), onJudge: (n, j) => { if (j === 'perfect' && Math.random() < 0.25) this.pyro(1); } });
    const start = Audio.now() + 0.5 + song.leadIn; this.rhythm.begin(start);
    this.backing = new Backing(song, start - song.leadIn, (t) => ({ drums: mv.instrument === 'drums' && !mv.band, pad: mv.instrument === 'piano' }));
    this.song = song; this.phase = 'play'; this.padInstr = null; this.pads = []; this.padPointers = new Map(); this.failT = 0;
    this.pyro(4);
  }
  pyro(n) { for (let k = 0; k < n; k++) { const x = k % 2 ? 90 : W - 90; for (let i = 0; i < 14; i++) this.fx.add({ x: x + (Math.random() - 0.5) * 8, y: this.L.stageBottom - 30, vx: (Math.random() - 0.5) * 30, vy: -160 - Math.random() * 120, life: 0.7 + Math.random() * 0.4, kind: 'fire', size: 4, gravity: 120 }); } Audio.ui('pyro'); Game.shake.hit(2, 0.15); this.pyroT = 0.3; }
  update(dt) {
    this.t += dt; this.lightT += dt; this.fx.update(dt); this.pyroT = Math.max(0, this.pyroT - dt);
    if (this.phase === 'cutscene') { this.cut.update(dt); return; }
    if (this.phase === 'card') { this.cardT += dt; return; }
    if (this.phase === 'play') {
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch) { const key = this.rhythm.section.qte ? 'qte' : this.rhythm.section.instrument; if (this.padInstr !== key) { this.padInstr = key; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, this.rhythm.section.qte); } }
      if (this.mv.impossible) {
        this.strobe = Math.floor(this.t * 12) % 2;
        if (this.rhythm.counts.miss >= 14 || this.rhythm.finished) { this.meltdown(); return; }
      } else if (this.rhythm.finished) { this.finishMovement(); return; }
    }
    if (this.phase === 'done') { this.cardT += dt; }
    if (this.phase === 'fail') { this.failT += dt; if (Math.random() < dt * 30) this.fx.add({ x: Math.random() * W, y: this.L.stageBottom - 20 - Math.random() * 60, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 90, life: 0.9, kind: 'fire', size: 3 + Math.random() * 3, gravity: 60 }); if (Math.random() < dt * 4) this.fx.add({ x: Math.random() * W, y: this.L.stageBottom - 60, vx: 0, vy: -20, life: 3, kind: 'smoke', color: '#555', size: 6, grow: 14, alpha: 0.5 }); if (this.failT > 3.2) { this.backing.stop(); Audio.setStageReverb(false); this.startCutscene(STORY.concert.fail, () => this.wakeUp()); } }
  }
  finishMovement() {
    this.backing.stop(); const res = this.rhythm.results(); this.results.push(res); this.phase = 'done'; this.cardT = 0;
    for (let i = 0; i < 60; i++) this.fx.add({ x: Math.random() * W, y: this.L.stageTop - 10, vx: (Math.random() - 0.5) * 30, vy: 30 + Math.random() * 40, life: 3, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][i % 5], kind: 'confetti', gravity: 10 });
    Audio.roar(2.5, 0.45); this.pyro(2);
    this.doneBtn = new Btn(W / 2 - 60, this.L.rhythmY + this.L.rhythmH - 44, 120, 22, 'NEXT', () => { if (this.moveIdx + 1 === 5) this.startCutscene(STORY.concert.beforeSolo, () => this.startMovement(5)); else this.startMovement(this.moveIdx + 1); });
  }
  meltdown() { this.phase = 'fail'; this.failT = 0; Audio.ui('pyro'); Audio.ui('boo'); Game.shake.hit(10, 0.8); for (let i = 0; i < 80; i++) this.fx.add({ x: Math.random() * W, y: this.L.stageBottom - 30, vx: (Math.random() - 0.5) * 200, vy: -100 - Math.random() * 200, life: 1.2, kind: 'fire', size: 5, gravity: 100 }); }
  wakeUp() {
    const bg = (ctx, t) => { const [c1, c2] = skyColors(0.05); vgrad(ctx, 0, 0, W, H, c1, c2); ctx.drawImage(skylineCanvas(21, W, 70, { color: '#9aa0b8', lit: '#fff', density: 0.05 }), 0, 140); let x = -10; const r = makeRng(9); let i = 0; while (x < W + 20) { const w = r.int(50, 90); const f = facadeCanvas(['victorian', 'pastel'][i % 2], 30 + i, w); ctx.drawImage(f, x, 260 - f.height); x += w + 1; i++; } rect(ctx, 0, 260, W, 36, '#a8a49a'); rect(ctx, 0, 260, W, 2, '#c8c4b8'); rect(ctx, 0, 296, W, 64, '#3f3f48'); ctx.drawImage(propCanvas('bench'), 280, 246); ctx.drawImage(propCanvas('lamp'), 100, 214); ctx.drawImage(treeCanvas('round', Game.wind.frame()), 470, 208); ctx.drawImage(propCanvas('trash'), 420, 246); drawBugAt(ctx, HERO_PRESETS.buzz, 300, 258, { pose: 'idle', instrument: 'guitar' }); ctx.drawImage(propCanvas('pigeon'), 330, 253); };
    this.phase = 'cutscene'; this.cut = new CutsceneScene(STORY.concert.wake, { bg, onDone: () => { Game.run = RunState.newRun(); Game.run.save(); Game.setScene(new MapScene(true)); } });
  }
  key(code) {
    if (this.phase === 'cutscene') { this.cut.key(code); return; }
    if (this.phase === 'pick') { this.pickMenu.key(code); return; }
    if (this.phase === 'card') { if (['Enter', 'Space'].includes(code)) this.startPlay(); return; }
    if (this.phase === 'done') { if (['Enter', 'Space'].includes(code)) this.doneBtn.onTap(); return; }
    if (this.phase === 'play') this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play') this.rhythm.keyUp(code); }
  padAt(x, y) { return this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h); }
  pointerDown(x, y, id) {
    if (this.phase === 'cutscene') { this.cut.click(); return; }
    if (this.phase === 'pick') { this.pickMenu.click(x, y); return; }
    if (this.phase === 'card') { if (this.cardBtn.hit(x, y) || !Game.touch) this.startPlay(); return; }
    if (this.phase === 'done') { if (this.doneBtn.hit(x, y) || !Game.touch) this.doneBtn.onTap(); return; }
    if (this.phase === 'play') { const pad = this.padAt(x, y); if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); } else if (this.rhythm.section.qte) { this.padPointers.set(id, 'Space'); this.rhythm.keyDown('Space'); } }
  }
  pointerMove(x, y, id) { if (this.phase !== 'play') return; const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { const code = this.padPointers && this.padPointers.get(id); if (code !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(code); } }
  hover(x, y) { if (this.phase === 'pick') this.pickMenu.hover(x, y); }
  // ---------- drawing ----------
  drawStadium(ctx, full) {
    const L = this.L; const top = full ? 0 : L.stageTop, bottom = full ? H : L.stageBottom; const h = bottom - top;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
    vgrad(ctx, 0, top, W, h, '#07061a', '#1a1030');
    const floorY = bottom - (full ? 70 : Math.round(h * 0.42)); // stage floor line
    // backdrop screen + truss
    rect(ctx, 60, top + 4, W - 120, floorY - top - 40, '#0e0c24'); frame(ctx, 60, top + 4, W - 120, floorY - top - 40, '#2a2450');
    const glow = 0.5 + 0.5 * Math.sin(this.t * 2); drawText(ctx, 'MONARCH', W / 2, top + Math.round((floorY - top - 40) / 2) - 8, mixColor('#8a2a5a', '#ff5ab0', glow), { align: 'center', scale: full ? 4 : 2, outline: '#2a0a20' });
    for (let x = 60; x < W - 60; x += 16) ctx.drawImage(propCanvas('truss'), x, top + 2, 16, 16);
    // light beams
    const cols = this.stageLights; const n = cols.length + 3;
    for (let i = 0; i < n; i++) { const lx = 80 + i * ((W - 160) / (n - 1)); const ang = Math.sin(this.lightT * (0.7 + i * 0.13) + i) * 0.9; const col = cols[i % cols.length]; ctx.globalAlpha = (this.phase === 'play' && this.mv && this.mv.impossible && this.strobe) ? 0.35 : 0.14 + 0.06 * Math.sin(this.t * 3 + i); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(lx - 4, top + 18); ctx.lineTo(lx + 4, top + 18); ctx.lineTo(lx + Math.sin(ang) * 200 + 40, bottom); ctx.lineTo(lx + Math.sin(ang) * 200 - 40, bottom); ctx.fill(); ctx.globalAlpha = 1; ctx.drawImage(propCanvas('light', i), lx - 5, top + 16); }
    if (this.mv && this.mv.key === 'opera' && this.phase === 'play') { for (let i = 0; i < 6; i++) { const lx = W / 2 + Math.sin(this.t * 3 + i * 1.1) * 260; ctx.globalAlpha = 0.6; line(ctx, W / 2, top + 20, lx, bottom, i % 2 ? '#6be585' : '#ff5ab0'); ctx.globalAlpha = 1; } }
    // speaker stacks
    for (const sx of [14, W - 34]) { ctx.drawImage(propCanvas('speaker'), sx, floorY - 68); ctx.drawImage(propCanvas('speaker'), sx, floorY - 34); }
    // stage floor
    rect(ctx, 0, floorY, W, bottom - floorY, '#2a2230'); rect(ctx, 0, floorY, W, 2, '#5a5070'); for (let x = 0; x < W; x += 40) rect(ctx, x, floorY + 2, 1, bottom - floorY, '#221c28');
    // riser + drums
    rect(ctx, W / 2 + 40, floorY - 12, 90, 12, '#3a3048'); rect(ctx, W / 2 + 40, floorY - 12, 90, 2, '#6a6080');
    // band
    const perf = this.phase === 'pick' || this.phase === 'cutscene' && this.moveIdx === 0 ? this.performers : this.performers;
    const beat = this.rhythm ? this.rhythm.onBeat : Math.floor(this.t * 4) % 2 === 0;
    // Monarch centre
    ctx.drawImage(propCanvas('micstand'), W / 2 - 4, floorY - 30);
    drawShadow(ctx, W / 2, floorY, 24); drawBugAt(ctx, HERO_PRESETS.monarch, W / 2 + 10, floorY + (beat ? -1 : 0), { pose: this.phase === 'fail' ? 'idle' : 'sing', instrument: 'mic' });
    // Buzz left
    const buzzPose = this.phase === 'fail' ? 'idle' : (this.rhythm && this.rhythm.section && !this.rhythm.section.qte ? (beat ? 'play' : 'idle') : 'play');
    drawShadow(ctx, W / 2 - 70, floorY, 22); drawBugAt(ctx, HERO_PRESETS.buzz, W / 2 - 70, floorY, { pose: buzzPose, instrument: 'guitar' });
    ctx.drawImage(propCanvas('amp'), W / 2 - 120, floorY - 14);
    // picked mates right
    perf.slice(1).forEach((m, i) => { const x = W / 2 + 75 + i * 60; if (m.instrument === 'drums') { ctx.drawImage(propInstrument('drums'), x - 20, floorY - 40); drawBugAt(ctx, m.spec, x, floorY - 12, { pose: beat ? 'play' : 'idle' }); } else if (m.instrument === 'piano') { ctx.drawImage(propInstrument('piano'), x - 20, floorY - 22); drawBugAt(ctx, m.spec, x, floorY - 2, { pose: beat ? 'play' : 'idle' }); } else { drawShadow(ctx, x, floorY, 20); drawBugAt(ctx, m.spec, x, floorY, { pose: beat ? 'play' : 'idle', instrument: m.instrument, flip: true }); } });
    // pyro cannons
    for (const cx of [90, W - 90]) { rect(ctx, cx - 5, floorY - 8, 10, 8, '#444'); rect(ctx, cx - 3, floorY - 12, 6, 4, '#666'); if (this.pyroT > 0) circle(ctx, cx, floorY - 14, 6, '#fff4b0'); }
    // crowd silhouettes in front
    if (full || h > 100) {
      const crowdTop = full ? 316 : bottom - Math.round(h * 0.26);
      vgrad(ctx, 0, crowdTop - 20, W, bottom - crowdTop + 20, 'rgba(10,8,24,0)', 'rgba(10,8,24,0.9)');
      for (const c of this.crowd) { const y = crowdTop + (c.y - 322) * (full ? 1 : 0.5) + Math.round(Math.sin(this.t * 5 + c.o) * (this.phase === 'fail' ? 0 : 2)); circle(ctx, c.x, y, 4, c.col); rect(ctx, c.x - 3, y + 3, 7, 10, c.col); if (c.lighter && Math.sin(this.t * 3 + c.o) > 0) { px(ctx, c.x + 3, y - 4, '#ffd24a'); px(ctx, c.x + 3, y - 5, '#fff8c0'); } if (this.phase === 'fail' && c.o < 2) drawText(ctx, 'BOO', c.x, y - 14, '#ff5a5a', { font: 'small', align: 'center' }); }
    }
    this.fx.draw(ctx);
    ctx.restore();
    // strobing overlay for the solo
    if (this.phase === 'play' && this.mv.impossible && this.strobe) { ctx.globalAlpha = 0.08; rect(ctx, 0, top, W, h, '#fff'); ctx.globalAlpha = 1; }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#07061a');
    if (this.phase === 'cutscene') { this.cut.draw(ctx); return; }
    const L = this.L;
    this.drawStadium(ctx, false);
    if (this.phase === 'pick') {
      const inner = uiPanel(ctx, W / 2 - 170, L.rhythmY + 6, 340, L.rhythmH - 12, { title: 'WHO GOES ON STAGE WITH YOU?' });
      drawText(ctx, 'Pick TWO of Monarch\'s band. During their spotlight you back them up with quick taps.', inner.x + 8, inner.y + 4, UI.inkSoft, { font: 'small' });
      this.pickMenu.draw(ctx, inner.x + 8, inner.y + 14, inner.w - 16, 14, 'list');
      // portraits
      MONARCH_BAND.forEach((b, i) => { const on = this.picked.includes(b); const x = inner.x + inner.w - 30 - i * 0; });
      const it = this.pickMenu.current; if (it && it.b) { drawBugAt(ctx, HERO_PRESETS[it.b.key], inner.x + inner.w - 40, inner.y + inner.h - 24, { pose: 'play', instrument: it.b.instrument, scale: 1.5 }); }
      return;
    }
    if (this.phase === 'card' || this.phase === 'done') {
      const mv = this.mv; const inner = uiPanel(ctx, W / 2 - 200, L.rhythmY + 8, 400, L.rhythmH - 16, { title: mv.title });
      if (this.phase === 'card') {
        drawText(ctx, INSTRUMENTS[mv.instrument].name.toUpperCase() + '  -  ' + INSTRUMENTS[mv.instrument].keyNames.join(' ') + (mv.band ? '  +  BACKUP TAPS' : ''), inner.x + inner.w / 2, inner.y + 6, '#7a4a10', { align: 'center' });
        drawWrapped(ctx, mv.tutorial, inner.x + 16, inner.y + 22, 60, UI.ink, 10);
        drawText(ctx, mv.bpm + ' BPM  -  ' + mv.bars + ' BARS  -  ' + (mv.impossible ? '??? DIFFICULTY' : '★'.repeat(mv.difficulty)), inner.x + inner.w / 2, inner.y + inner.h - 58, UI.inkSoft, { align: 'center', font: 'small' });
        this.cardBtn.draw(ctx);
      } else {
        const res = this.results[this.results.length - 1]; const acc = Math.round(res.acc * 100);
        drawText(ctx, 'MOVEMENT COMPLETE', inner.x + inner.w / 2, inner.y + 8, '#7a4a10', { align: 'center', scale: 2 });
        drawText(ctx, 'ACCURACY ' + acc + '%   MAX COMBO ' + res.maxCombo, inner.x + inner.w / 2, inner.y + 32, UI.ink, { align: 'center' });
        drawText(ctx, acc >= 90 ? 'The crowd is losing its mind.' : acc >= 70 ? 'Monarch nods. Barely.' : 'Monarch is glaring at you.', inner.x + inner.w / 2, inner.y + 46, UI.inkSoft, { align: 'center' });
        this.doneBtn.draw(ctx);
      }
      return;
    }
    if (this.phase === 'play' || this.phase === 'fail') {
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads });
      const p = clamp(this.rhythm.now / this.song.length, 0, 1); rect(ctx, 0, L.rhythmY + L.rhythmH - 3, W, 3, '#222'); rect(ctx, 0, L.rhythmY + L.rhythmH - 3, W * p, 3, '#ffd24a');
      drawText(ctx, this.mv.title, 6, L.rhythmY + 4, '#ffd24a', { outline: '#1a1410' });
      if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      if (this.phase === 'fail') { ctx.globalAlpha = Math.min(0.6, this.failT * 0.3); rect(ctx, 0, 0, W, H, '#400'); ctx.globalAlpha = 1; drawText(ctx, 'THE SOLO COLLAPSES', W / 2, L.rhythmY + L.rhythmH / 2 - 10, '#ff5a5a', { align: 'center', scale: 3, outline: '#1a0000' }); }
    }
  }
}
