// ---------- The cinematic: arena concert, the fall, backstage, the flight ----------
'use strict';
// Short beat-based dialogue. {who, text} - kept to one line each.
function bubble(ctx, x, y, text, opts = {}) {
  const w = textWidth(text) + 16, h = 20;
  const bx = Math.round(clamp(x - w / 2, 6, W - w - 6)), by = Math.round(y - h);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx + 2, by + 3, w, h);
  rect(ctx, bx, by, w, h, opts.dark ? '#1a1228' : '#f6f2e6'); frame(ctx, bx, by, w, h, opts.color || '#1a1410');
  for (let i = 0; i < 5; i++) rect(ctx, x - 4 + i, by + h + i, 8 - i * 2, 1, opts.dark ? '#1a1228' : '#f6f2e6');
  drawText(ctx, text, bx + w / 2, by + 6, opts.dark ? '#fff' : UI.ink, { align: 'center' });
}
const MONARCH_CREW = [{ key: 'dot', instrument: 'drums' }, { key: 'hopper', instrument: 'piano' }];

const PLATE_H = 136;
class ConcertScene {
  constructor() {
    this.t = 0; this.phase = 'rise'; this.phaseT = 0; this.moveIdx = 0; this.fx = new Particles(); this.lightT = 0; this.strobe = 0; this.results = [];
    this.rng = makeRng(777); this.crowd = [];
    for (let i = 0; i < 260; i++) this.crowd.push({ x: this.rng.range(-10, W + 10), row: this.rng.int(0, 4), o: this.rng.range(0, 6), lighter: this.rng.chance(0.32), col: this.rng.pick(['#171224', '#1e1830', '#12101c']) });
    this.layout(); this.pyroT = 0; this.throwables = []; this.booT = 0;
    this.you = Game.run ? Game.run.members[0] : new Member({ name: 'STAG', presetKey: 'stag', spec: HERO_PRESETS.stag, instrument: 'guitar' });
    this.heroKey = Game.run ? Game.run.hero : 'stag';
    this.mates = ROSTER.filter(r => r.key !== this.heroKey).map(r => ({ key: r.key, spec: HERO_PRESETS[r.key], instrument: r.instrument, name: HERO_PRESETS[r.key].name }));
    this.singer = this.mates.find(m => m.instrument === 'piano') || this.mates[0];
    Audio.setStageReverb(true);
    this.beats = [{ who: 'singer', text: 'FORTY THOUSAND BUGS OUT THERE.' }];
    this.stageLights = ['#c58bff', '#5bc0ff'];
  }
  layout() { const t = Game.touch; this.L = t ? { rhythmY: 150, rhythmH: 250, stageTop: 20, stageBottom: 148, padY: 404, padH: 130 } : { rhythmY: 16, rhythmH: 296, stageTop: 316, stageBottom: 540, padY: 0, padH: 0 }; }
  isPlaying() { return this.phase === 'play'; }
  get mv() { return OPERA.movements[this.moveIdx]; }
  // everything except the playable movement is framed full-screen like a film
  get cinematic() { const p = this.phase; return p !== 'play'; }
  stageRect() {
    if (!this.cinematic) return { top: this.L.stageTop, bottom: this.L.stageBottom };
    const plated = this.phase === 'card' || this.phase === 'done';
    return { top: 0, bottom: plated ? H - PLATE_H : H };
  }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.lightT += dt; this.fx.update(dt); this.pyroT = Math.max(0, this.pyroT - dt);
    for (const o of this.throwables) { o.t += dt; o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 420 * dt; o.rot += dt * 9; }
    this.throwables = this.throwables.filter(o => o.y < H + 20 && o.t < 3);
    if (this.phase === 'rise') { if (this.phaseT > 2.6) { this.phase = 'hello'; this.phaseT = 0; Audio.roar(2.5, 0.5); } }
    else if (this.phase === 'hello') { if (this.phaseT > 3.4) this.startMovement(0); }
    else if (this.phase === 'card') { if (this.phaseT > 30) this.startPlay(); }
    else if (this.phase === 'play') {
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch) { const k = this.rhythm.section.qte ? 'qte' : this.rhythm.section.instrument; if (this.padKey !== k) { this.padKey = k; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, this.rhythm.section.qte); } }
      if (this.rhythm.events.perfects && Math.random() < 0.3) this.pyro(1);
      if (this.mv.impossible) { this.strobe = Math.floor(this.t * 14) % 2; if (this.rhythm.counts.miss >= 10 || this.rhythm.finished) { this.meltdown(); return; } }
      else if (this.rhythm.finished) this.finishMovement();
    }
    else if (this.phase === 'fail') {
      this.booT += dt;
      const SB = this.stageRect().bottom;
      if (Math.random() < dt * 26) this.fx.add({ x: Math.random() * W, y: SB - 20 - Math.random() * 60, vx: (Math.random() - 0.5) * 70, vy: -70 - Math.random() * 90, life: 0.9, kind: 'fire', size: 3 + Math.random() * 3, gravity: 60 });
      if (Math.random() < dt * 5) this.fx.add({ x: Math.random() * W, y: SB - 60, vx: 0, vy: -22, life: 3, kind: 'smoke', color: '#4a4450', size: 7, grow: 16, alpha: 0.5 });
      if (this.booT > 0.4 && Math.random() < dt * 9) this.throwItem();
      if (this.booT > 5.2 && !this.left) { this.left = true; Game.go(() => new BackstageScene(), 'fade', { dur: 0.7 }); }
    }
  }
  throwItem() {
    const kind = this.rng.pick(['tomato', 'can', 'cabbage', 'boot', 'fish', 'tomato']);
    const fromX = this.rng.range(60, W - 60), fromY = H - 20;
    const SB = this.stageRect().bottom;
    const tx = W / 2 - 90 + this.rng.range(-60, 60), ty = SB - 150;
    const time = 0.75;
    this.throwables.push({ kind, x: fromX, y: fromY, vx: (tx - fromX) / time, vy: (ty - fromY) / time - 0.5 * 420 * time, rot: 0, t: 0 });
    Audio.ui('whoosh');
    setTimeout(() => { Game.shake.hit(5, 0.2); Audio.drum('clunk', 0, 0.6); this.fx.burst(tx, ty, 14, { color: kind === 'tomato' ? ['#d83a2a', '#f06a4a'] : kind === 'cabbage' ? ['#6fc050', '#a8e090'] : ['#c8c8d0', '#fff'], speed: 110, life: 0.6, kind: 'px', size: 3, gravity: 280 }); this.fx.text(tx, ty - 20, 'OOF', '#ff5a5a', { life: 0.7, scale: 2 }); }, time * 1000);
  }
  startMovement(i) {
    this.moveIdx = i; this.phase = 'card'; this.phaseT = 0;
    this.stageLights = this.mv.lights;
    this.cardBtn = new Btn(W - 246, H - 104, 182, 38, i === 0 ? 'PLAY' : 'NEXT', () => this.startPlay(), { scale: 3 });
  }
  startPlay() {
    const mv = this.mv; Audio.init();
    const song = songFromMovement(mv);
    const sections = [{ instrument: this.you.instrument, instr: gearInstrument(this.you.instrument, this.you.quality), startBar: 0, endBar: song.bars }];
    const diff = mv.impossible ? 7 : mv.difficulty;
    const notes = chartFromMelody(song, sections, diff, this.rng, { starRate: 0.12, bombMult: mv.key === 'solo' ? 1.5 : 0.6 });
    if (mv.impossible) { const extra = []; for (let bar = 1; bar < song.bars; bar++) for (let s = 0; s < 16; s++) extra.push({ t: song.leadIn + bar * 4 * song.beat + s * song.beat / 4, lane: this.rng.int(0, 3), dur: 0, type: 'tap', midi: song.root + 24 + this.rng.int(0, 12) }); notes.push(...extra); notes.sort((a, b) => a.t - b.t); notes.forEach((n, i) => { n.id = i; n.judged = false; n.hit = false; }); }
    const mods = collectMods(null, { difficulty: diff, fx: { shake: Game.shake }, windowMult: mv.impossible ? 0.75 : 1.25, voiceOverride: sections[0].instrument === 'guitar' ? 'eguitar' : null });
    this.rhythm = new RhythmGame(song, sections, notes, mods, { onCheer: () => this.pyro(3) });
    const start = Audio.now() + 0.5 + song.leadIn; this.rhythm.begin(start);
    this.backing = new Backing(song, start - song.leadIn, () => ({ drums: mv.instrument === 'drums', pad: mv.instrument === 'piano' }));
    this.song = song; this.phase = 'play'; this.phaseT = 0; this.padKey = null; this.pads = []; this.padPointers = new Map();
    this.pyro(mv.pyro);
  }
  pyro(n) { for (let k = 0; k < n; k++) { const x = k % 2 ? 76 : W - 76; for (let i = 0; i < 14; i++) this.fx.add({ x: x + (Math.random() - 0.5) * 8, y: this.L.stageBottom - 26, vx: (Math.random() - 0.5) * 34, vy: -170 - Math.random() * 130, life: 0.7 + Math.random() * 0.4, kind: 'fire', size: 4, gravity: 130 }); } if (n) { Audio.ui('pyro'); Game.shake.hit(2, 0.15); this.pyroT = 0.3; } }
  finishMovement() {
    this.backing.stop(); this.results.push(this.rhythm.results()); this.phase = 'done'; this.phaseT = 0;
    for (let i = 0; i < 70; i++) this.fx.add({ x: Math.random() * W, y: this.L.stageTop - 10, vx: (Math.random() - 0.5) * 34, vy: 34 + Math.random() * 44, life: 3, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][i % 5], kind: 'confetti', gravity: 10 });
    Audio.roar(2.5, 0.5); this.pyro(2);
    this.doneBtn = new Btn(W - 246, H - 104, 182, 38, 'NEXT', () => this.startMovement(this.moveIdx + 1), { scale: 3 });
  }
  meltdown() { this.phase = 'fail'; this.booT = 0; this.backing.stop(); Audio.setStageReverb(false); Audio.ui('pyro'); Audio.ui('boo'); Game.shake.hit(11, 0.9); for (let i = 0; i < 90; i++) this.fx.add({ x: Math.random() * W, y: this.stageRect().bottom - 120, vx: (Math.random() - 0.5) * 220, vy: -110 - Math.random() * 210, life: 1.2, kind: 'fire', size: 5, gravity: 110 }); }
  key(code) {
    if (this.phase === 'card') { if (['Enter', 'Space'].includes(code)) this.startPlay(); return; }
    if (this.phase === 'done') { if (['Enter', 'Space'].includes(code)) this.doneBtn.onTap(); return; }
    if (this.phase === 'hello' || this.phase === 'rise') { if (['Enter', 'Space'].includes(code)) { this.phase = 'card'; this.startMovement(0); } return; }
    if (this.phase === 'play') this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play') this.rhythm.keyUp(code); }
  padAt(x, y) { return this.pads ? this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) : null; }
  pointerDown(x, y, id) {
    if (this.phase === 'card') { this.startPlay(); return; }
    if (this.phase === 'done') { this.doneBtn.onTap(); return; }
    if (this.phase === 'play') { const pad = this.padAt(x, y); if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); } }
  }
  pointerMove(x, y, id) { if (this.phase !== 'play') return; const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { const c = this.padPointers && this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); } }
  drawStadium(ctx) {
    const L = this.L, S = this.stageRect(), top = S.top, bottom = S.bottom, h = bottom - top;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
    const rise = this.phase === 'rise' ? easeOut(clamp(this.phaseT / 2.2, 0, 1)) : 1;
    const floorY = drawStageBack(ctx, this.t, { top, bottom, floorY: bottom - Math.round(h * 0.36), lights: this.stageLights });
    if (this.phase === 'play' && this.mv.pyro >= 3) { for (let i = 0; i < 10; i++) { const lx = W / 2 + Math.sin(this.t * 2.6 + i * 0.8) * 460; ctx.globalAlpha = 0.45; line(ctx, W / 2, top + 20, lx, bottom, i % 2 ? '#6be585' : '#ff5ab0'); ctx.globalAlpha = 1; } }
    const beat = this.rhythm ? (this.rhythm.onBeat || this.rhythm.beatPulse > 0.78) : Math.floor(this.t * 4) % 2 === 0;
    const dead = this.phase === 'fail';
    const won = this.phase === 'done';
    // the band reacts to how the set is going
    const combo = this.rhythm ? this.rhythm.combo || 0 : 0;
    const bandExpr = dead ? 'sad' : won ? 'happy' : (this.phase === 'play' ? (combo > 20 ? 'happy' : combo === 0 && this.rhythm && this.rhythm.counts.miss > 2 ? 'shock' : null) : null);
    const bandPose = (def) => dead ? 'sad' : won ? 'cheer' : def;
    // riser
    rect(ctx, W / 2 + 118, floorY - 20, 150, 20, '#33293f'); rect(ctx, W / 2 + 118, floorY - 20, 150, 3, '#6a6080');
    // the three mates
    const spots = [{ x: W / 2 + 190, y: floorY - 22 }, { x: W / 2 + 40, y: floorY }, { x: W / 2 - 230, y: floorY }];
    this.mates.forEach((m, i) => {
      const sp = spots[i] || spots[2]; const pose = bandPose(m.instrument === 'piano' ? 'sing' : (beat ? 'play' : 'play2'));
      if (m.instrument === 'piano') ctx.drawImage(propCanvas('micstand'), sp.x - 46, sp.y - 66, 14, 54);
      drawShadow(ctx, sp.x, sp.y, 40);
      drawBugAt(ctx, m.spec, sp.x, sp.y + (beat && !dead ? -2 : 0), { pose, instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.9, expr: bandExpr, rate: won ? 4.2 : 2.4, phase: i * 1.7, bounce: won ? 2.4 : dead ? 0.35 : 1 });
      if (m.instrument === 'drums') ctx.drawImage(propInstrument('drums'), sp.x - 42, sp.y - 48, 84, 63);
      if (m.instrument === 'piano') ctx.drawImage(propInstrument('piano'), sp.x - 40, sp.y - 34, 80, 43);
    });
    // you, front left
    const yx = W / 2 - 90, yy = floorY + 8;
    drawShadow(ctx, yx, yy, 46, 0.35);
    const youPose = bandPose(beat ? 'play' : 'play2');
    if (this.you.instrument === 'drums') { drawBugAt(ctx, this.you.spec, yx, yy - 10, { pose: youPose, scale: 2.1, expr: bandExpr, rate: won ? 4.2 : 2.4, bounce: won ? 2.4 : dead ? 0.35 : 1 }); ctx.drawImage(propInstrument('drums'), yx - 46, yy - 52, 92, 69); }
    else if (this.you.instrument === 'piano') { ctx.drawImage(propCanvas('micstand'), yx - 52, yy - 76, 16, 62); drawBugAt(ctx, this.you.spec, yx, yy - 4, { pose: youPose, scale: 2.1, expr: bandExpr, rate: won ? 4.2 : 2.4, bounce: won ? 2.4 : dead ? 0.35 : 1 }); ctx.drawImage(propInstrument('piano'), yx - 44, yy - 38, 88, 47); }
    else drawBugAt(ctx, this.you.spec, yx, yy, { pose: youPose, instrument: this.you.instrument, scale: 2.1, expr: bandExpr, squash: beat && !dead ? 1.04 : 1, rate: won ? 4.2 : 2.4, bounce: won ? 2.4 : dead ? 0.35 : 1 });
    ctx.drawImage(propCanvas('amp'), yx - 84, yy - 24, 32, 28);
    for (const cx of [110, W - 110]) { rect(ctx, cx - 7, floorY - 12, 14, 12, '#444'); rect(ctx, cx - 4, floorY - 18, 8, 6, '#666'); if (this.pyroT > 0) circle(ctx, cx, floorY - 22, 10, '#fff4b0'); }
    drawArenaCrowd(ctx, this.crowd, this.t, bottom - Math.round(h * 0.22), bottom, dead ? 'angry' : 'happy', won ? 1.8 : 1);
    if (dead && Math.floor(this.t * 3) % 2 === 0) for (let i = 0; i < 8; i++) drawText(ctx, 'BOO', (i * 137 + 50) % W, bottom - Math.round(h * 0.22) - 10 - (i % 3) * 12, '#ff5a5a', { align: 'center' });
    for (const o of this.throwables) { const c = propCanvas(o.kind); ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y)); ctx.rotate(o.rot); ctx.drawImage(c, -c.width, -c.height, c.width * 2, c.height * 2); ctx.restore(); }
    this.fx.draw(ctx);
    ctx.restore();
    if (this.phase === 'play' && this.mv.impossible && this.strobe) { ctx.globalAlpha = 0.1; rect(ctx, 0, top, W, h, '#fff'); ctx.globalAlpha = 1; }
    if (this.phase === 'rise') { ctx.globalAlpha = 1 - rise; rect(ctx, 0, top, W, h, '#000'); ctx.globalAlpha = 1; }
  }
  // a wide cinematic plate across the lower third
  cinePlate(ctx, y, h) {
    ctx.globalAlpha = 0.82; rect(ctx, 0, y, W, h, '#0b0914'); ctx.globalAlpha = 1;
    rect(ctx, 0, y, W, 2, '#c8a03a'); rect(ctx, 0, y + h - 2, W, 2, '#3a2c14');
    hgrad(ctx, 0, y + 2, W, h - 4, 'rgba(40,24,60,0.5)', 'rgba(10,8,20,0.1)');
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#06051a'); const L = this.L;
    this.drawStadium(ctx);
    if (this.cinematic) { vignette(ctx, 0.44); if (this.phase !== 'card' && this.phase !== 'done') letterbox(ctx, 24); }

    if (this.phase === 'rise' || this.phase === 'hello') {
      const k = clamp(this.phaseT / 1.1, 0, 1), pop = popIn(this.phaseT - 0.3, 0.5);
      ctx.globalAlpha = clamp(k, 0, 1);
      ctx.save(); ctx.translate(W / 2, 118); ctx.scale(pop, pop);
      drawText(ctx, OPERA.title, 0, -26, '#ffd24a', { align: 'center', scale: 6, outline: '#4a1e08' });
      ctx.restore();
      uiRibbon(ctx, W / 2, 176, OPERA.subtitle + '  -  SOLD OUT', { scale: 3, color: '#7a1a4a' });
      ctx.globalAlpha = 1;
      if (this.phase === 'hello') bubble(ctx, W / 2 + 170, 300, this.beats[0].text, { dark: true, color: '#8a2a5a' });
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.t * 4);
      drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, H - 54, '#cfc9e6', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
      return;
    }

    if (this.phase === 'card') {
      const mv = this.mv, ins = INSTRUMENTS[this.you.instrument];
      const pop = popIn(this.phaseT, 0.3), py = H - PLATE_H + (1 - pop) * 70;
      const parts = mv.title.split('. '), num = parts[0], name = parts.slice(1).join('. ');
      this.cinePlate(ctx, py, PLATE_H + 40);
      // giant roman numeral
      ctx.globalAlpha = 0.24; drawText(ctx, num, 44, py + 26, '#ffd24a', { scale: 11 }); ctx.globalAlpha = 1;
      drawText(ctx, name, 150, py + 18, '#fff4d8', { scale: 5, outline: '#2a1a08' });
      // instrument + keycaps, drawn not described
      ctx.drawImage(icon('note'), 152, py + 62, 20, 18);
      drawText(ctx, ins.name.toUpperCase(), 180, py + 66, '#ffd24a', { scale: 2 });
      let kx = 180 + textWidth(ins.name.toUpperCase(), { scale: 2 }) + 22;
      for (const kn of ins.keyNames.slice(0, 6)) { const kw = textWidth(kn, { scale: 2 }) + 14; rect(ctx, kx, py + 58, kw, 26, '#2c2440'); frame(ctx, kx, py + 58, kw, 26, '#8a7ab0'); rect(ctx, kx + 1, py + 59, kw - 2, 3, '#4a4068'); drawText(ctx, kn, kx + kw / 2, py + 66, '#e8e0ff', { align: 'center', scale: 2 }); kx += kw + 8; }
      // difficulty as stars, and the hook line in one short row
      const pips = mv.impossible ? 5 : Math.min(5, mv.difficulty);
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = i < pips ? (mv.impossible ? 0.6 + 0.4 * Math.sin(this.t * 8 + i) : 1) : 0.15; ctx.drawImage(icon('star'), 152 + i * 24, py + 98, 20, 18); }
      ctx.globalAlpha = 1;
      drawText(ctx, mv.tutorial, 292, py + 102, mv.impossible ? '#ff7a6a' : '#b8aed0', { scale: 2 });
      this.cardBtn.draw(ctx);
      return;
    }

    if (this.phase === 'done') {
      const res = this.results[this.results.length - 1], acc = Math.round(res.acc * 100);
      const pop = popIn(this.phaseT, 0.34), py = H - PLATE_H + (1 - pop) * 70;
      const grade2 = acc > 95 ? 'S' : acc > 88 ? 'A' : acc > 78 ? 'B' : acc > 65 ? 'C' : 'D';
      const gc = acc > 88 ? '#6be585' : acc > 70 ? '#ffd24a' : '#e0785a';
      this.cinePlate(ctx, py, PLATE_H + 40);
      const bs = bounceScale(this.phaseT, 0.22, 11);
      ctx.save(); ctx.translate(96, py + 66); ctx.scale(bs, bs);
      drawText(ctx, grade2, 0, -34, gc, { align: 'center', scale: 9, outline: '#1a1208' });
      ctx.restore();
      drawText(ctx, acc + '%', 180, py + 24, '#fff4d8', { scale: 5, outline: '#2a1a08' });
      drawText(ctx, 'COMBO', 180, py + 76, '#8a82a8', { scale: 2 });
      drawText(ctx, String(res.maxCombo), 180 + textWidth('COMBO', { scale: 2 }) + 16, py + 72, '#ffd24a', { scale: 3 });
      const bar = clamp(res.acc, 0, 1) * 420;
      rect(ctx, 180, py + 106, 420, 10, '#241d2e'); rect(ctx, 180, py + 106, bar * Math.min(1, this.phaseT * 2), 10, gc);
      frame(ctx, 180, py + 106, 420, 10, '#4a4068');
      this.doneBtn.draw(ctx);
      return;
    }

    if (this.phase === 'fail') {
      ctx.globalAlpha = Math.min(0.5, this.booT * 0.3); rect(ctx, 0, 0, W, H, '#3a0000'); ctx.globalAlpha = 1;
      if (this.booT > 0.5) {
        const sh = Math.sin(this.booT * 22) * 3;
        drawText(ctx, 'THE SOLO COLLAPSES', W / 2 + sh, 128, '#ff5a5a', { align: 'center', scale: 6, outline: '#1a0000' });
      }
      return;
    }

    // ---- playing
    this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads });
    const p = clamp(this.rhythm.now / this.song.length, 0, 1);
    rect(ctx, 0, L.rhythmY + L.rhythmH - 3, W, 3, '#241d2e'); rect(ctx, 0, L.rhythmY + L.rhythmH - 3, W * p, 3, '#ffd24a');
    drawText(ctx, this.mv.title, 10, L.rhythmY + 8, '#ffd24a', { outline: '#1a1410' });
    if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
    if (this.mv.impossible && this.strobe) { ctx.globalAlpha = 0.08; rect(ctx, 0, 0, W, H, '#fff'); ctx.globalAlpha = 1; }
  }
}

// ---------- Backstage: the awkward room ----------
class BackstageScene {
  constructor() {
    this.t = 0; this.step = 0; this.fx = new Particles(); this.motes = new Motes(30, 12);
    this.you = Game.run.members[0];
    this.mates = ROSTER.filter(r => r.key !== Game.run.hero).map(r => ({ key: r.key, spec: HERO_PRESETS[r.key], name: HERO_PRESETS[r.key].name, instrument: r.instrument }));
    this.beats = [
      { who: null, text: '' }, { who: 'mate0', text: '...' }, { who: 'you', text: 'I CAN FIX IT.' },
      { who: 'mate0', text: 'PACK YOUR CASE.' }, { who: 'mate1', text: 'SORRY.' }, { who: null, text: 'THE DOOR' },
    ];
    this.stepT = 0; this.rng = makeRng(404);
    this.costumes = [{ c: '#c8a83a', h: 30 }, { c: '#8a2a5a', h: 36 }, { c: '#2c6ec0', h: 28 }, { c: '#d8d0c0', h: 34 }];
  }
  advance() {
    this.step++; this.stepT = 0; Audio.ui('select');
    Game.shake.hit(2, 0.12);
    if (this.step === 3) { drawDust(this.fx, 250, 470, 10, '#6a5a70'); Audio.ui('hurt'); }
    if (this.step >= this.beats.length) Game.go(() => new FlightScene(), 'slideL', { dur: 0.5 });
  }
  update(dt) { this.t += dt; this.stepT += dt; this.fx.update(dt); this.motes.update(dt, this.t); if (Math.random() < dt * 0.7) this.fx.add({ x: 200 + Math.random() * 560, y: 386, vx: 0, vy: -6, life: 3, kind: 'smoke', color: '#4a4256', size: 3, grow: 5, alpha: 0.2 }); }
  key(code) { if (['Enter', 'Space', 'KeyZ'].includes(code)) this.advance(); }
  click() { this.advance(); }
  draw(ctx) {
    const floorY = 388;
    // ---- wall: panelling, dado rail, wallpaper stripe
    vgrad(ctx, 0, 0, W, floorY, '#3b3048', '#221a30');
    for (let x = 0; x < W; x += 48) { rect(ctx, x, 0, 2, floorY, '#2b2239'); rect(ctx, x + 24, 0, 1, floorY, '#453a55'); }
    rect(ctx, 0, 300, W, 5, '#4e3f5e'); rect(ctx, 0, 305, W, 2, '#1d1728');
    vgrad(ctx, 0, 307, W, floorY - 307, '#312842', '#251e34');
    // ---- floor: boards in light perspective
    vgrad(ctx, 0, floorY, W, H - floorY, '#4a3528', '#2b1e16');
    rect(ctx, 0, floorY - 6, W, 6, '#6a4d3a'); rect(ctx, 0, floorY - 6, W, 2, '#8a6a50');
    for (let i = 0; i < 26; i++) { const k = i / 26, x = W / 2 + (k - 0.5) * W * 2.1; line(ctx, W / 2 + (k - 0.5) * W * 0.9, floorY, x, H, '#231a14'); }
    for (let y = floorY + 14; y < H; y += 26) { ctx.globalAlpha = 0.35; rect(ctx, 0, y, W, 1, '#20170f'); ctx.globalAlpha = 1; }
    // ---- ceiling strip light + its pool on the floor
    rect(ctx, 300, 0, 340, 10, '#1c1626'); rect(ctx, 316, 8, 308, 5, '#fff2c0');
    lightPool(ctx, 470, 60, 300, '#ffe6a0', 0.1);
    lightPool(ctx, 470, floorY + 40, 260, '#ffd88a', 0.07);
    // ---- vanity: mirror, bulbs, counter, clutter
    rect(ctx, 44, 84, 268, 186, '#15121c'); frame(ctx, 44, 84, 268, 186, '#7a6440'); frame(ctx, 47, 87, 262, 180, '#4a3a22');
    vgrad(ctx, 54, 94, 248, 166, '#4a4a60', '#2e2e40');
    ctx.globalAlpha = 0.18; for (let i = 0; i < 6; i++) line(ctx, 54 + i * 46, 94, 54 + i * 46 - 40, 260, '#ffffff'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5; drawBugAt(ctx, this.you.spec, 178, 258, { pose: 'sad', scale: 2.3, expr: 'sad', t: this.t, rate: 0.9, bounce: 0.5 }); ctx.globalAlpha = 1;
    for (let i = 0; i < 10; i++) {
      const bx = 58 + i * 27, on = Math.floor(this.t * 2.2 + i * 1.7) % 9 !== 0;
      circle(ctx, bx + 6, 74, 6, on ? '#ffeeb0' : '#5a5040'); circle(ctx, bx + 4, 72, 2, on ? '#fffbe8' : '#6a6050');
      if (on) lightPool(ctx, bx + 6, 74, 34, '#ffe680', 0.13);
    }
    rect(ctx, 38, 270, 282, 12, '#6a4d3a'); rect(ctx, 38, 270, 282, 3, '#8f6a50'); rect(ctx, 38, 282, 282, 4, '#392719');
    // counter clutter
    ctx.drawImage(propCanvas('can'), 70, 250, 10, 20); ctx.drawImage(propCanvas('can'), 88, 254, 8, 16);
    rect(ctx, 116, 256, 22, 14, '#c83a5a'); rect(ctx, 116, 256, 22, 3, '#e8687a');
    circle(ctx, 160, 264, 7, '#e8e0d0'); circle(ctx, 158, 262, 2, '#fff');
    rect(ctx, 186, 252, 6, 18, '#6be585'); rect(ctx, 200, 258, 30, 12, '#2a2434'); rect(ctx, 202, 260, 26, 8, '#4a4256');
    ctx.drawImage(propCanvas('stool'), 156, 286, 32, 36);
    // ---- gold records + setlist on the wall
    for (let i = 0; i < 3; i++) { const gx = 348 + i * 62; ctx.drawImage(propCanvas('goldrecord'), gx, 96 + (i % 2) * 10, 48, 48); ctx.globalAlpha = 0.18; circle(ctx, gx + 24, 120 + (i % 2) * 10, 30, '#ffd24a'); ctx.globalAlpha = 1; }
    rect(ctx, 548, 100, 46, 62, '#efe6cc'); frame(ctx, 548, 100, 46, 62, '#9a8a68');
    for (let i = 0; i < 7; i++) rect(ctx, 553, 108 + i * 8, 30 - (i % 3) * 6, 2, '#6a6058');
    rect(ctx, 564, 96, 14, 8, '#d8d0b0'); ctx.globalAlpha = 0.6; rect(ctx, 564, 96, 14, 8, '#efe6cc'); ctx.globalAlpha = 1;
    ctx.drawImage(propCanvas('clock'), 624, 104, 36, 36);
    // ---- clothes rack
    rect(ctx, 356, 196, 190, 4, '#8a8a98'); rect(ctx, 358, 200, 3, 104, '#6a6a78'); rect(ctx, 540, 200, 3, 104, '#6a6a78');
    this.costumes.forEach((c, i) => {
      const cx = 378 + i * 42, sway = Math.sin(this.t * 1.1 + i) * 1.5;
      rect(ctx, cx + 5 + sway, 196, 2, 8, '#b0b0c0');
      ctx.fillStyle = '#b8b8c8'; ctx.beginPath(); ctx.moveTo(cx + 6 + sway, 202); ctx.lineTo(cx - 9 + sway, 210); ctx.lineTo(cx + 21 + sway, 210); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(cx + 6 + sway, 204); ctx.lineTo(cx - 11 + sway, 214); ctx.lineTo(cx - 8 + sway, 214 + c.h); ctx.lineTo(cx + 20 + sway, 214 + c.h); ctx.lineTo(cx + 23 + sway, 214); ctx.closePath(); ctx.fill();
      rect(ctx, cx - 9 + sway, 214, 30, 3, lighten(c.c, 0.25)); rect(ctx, cx + 4 + sway, 218, 2, c.h - 8, darken(c.c, 0.22));
    });
    // ---- couch against the wall
    const cy = floorY - 4;
    rect(ctx, 372, cy - 74, 236, 44, '#7a3a4e'); rect(ctx, 372, cy - 74, 236, 5, '#a4526a');
    for (let i = 0; i < 3; i++) { const bx = 382 + i * 74; rect(ctx, bx, cy - 68, 66, 34, '#8e4459'); rect(ctx, bx + 2, cy - 66, 62, 4, '#ad5a72'); }
    rect(ctx, 362, cy - 66, 22, 54, '#6a3244'); rect(ctx, 596, cy - 66, 22, 54, '#6a3244');
    rect(ctx, 372, cy - 34, 236, 24, '#8e4459'); rect(ctx, 372, cy - 34, 236, 4, '#a4526a');
    rect(ctx, 380, cy - 10, 12, 12, '#33221c'); rect(ctx, 588, cy - 10, 12, 12, '#33221c');
    // jacket thrown over the arm
    rect(ctx, 586, cy - 78, 34, 40, '#2c6ec0'); rect(ctx, 586, cy - 78, 34, 4, '#4a8ce0'); rect(ctx, 594, cy - 40, 18, 10, '#245ba0');
    // ---- flight cases + guitar case + cables
    ctx.drawImage(propCanvas('flightcase'), 646, floorY - 44, 90, 60);
    ctx.drawImage(propCanvas('flightcase'), 660, floorY - 82, 62, 41);
    ctx.drawImage(propCanvas('amp'), 300, floorY - 10, 64, 56);
    ctx.drawImage(propCanvas('guitarcase'), 96, floorY - 64, 34, 94);
    ctx.drawImage(propCanvas('cooler'), 748, floorY + 14, 60, 45);
    ctx.strokeStyle = '#191319'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(340, floorY + 40); ctx.bezierCurveTo(470, floorY + 76, 560, floorY + 12, 700, floorY + 52); ctx.stroke();
    ctx.strokeStyle = '#2a2028'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(120, floorY + 72); ctx.bezierCurveTo(260, floorY + 30, 330, floorY + 92, 480, floorY + 66); ctx.stroke(); ctx.lineWidth = 1;
    // ---- door + EXIT
    rect(ctx, 774, 104, 152, 284, '#2a1c12');
    rect(ctx, 782, 112, 136, 276, '#4e3520'); frame(ctx, 782, 112, 136, 276, '#2a1a10');
    rect(ctx, 794, 126, 112, 110, '#5c4029'); frame(ctx, 794, 126, 112, 110, '#3a2818');
    rect(ctx, 794, 246, 112, 128, '#5c4029'); frame(ctx, 794, 246, 112, 128, '#3a2818');
    circle(ctx, 898, 256, 6, '#e8c25a'); circle(ctx, 896, 254, 2, '#fff2c0');
    const open = this.step >= 5 ? clamp(this.stepT * 1.1, 0, 1) : 0;
    if (open > 0) { const w = Math.round(open * 120); rect(ctx, 782 + 136 - w, 112, w, 276, '#0e0c14'); vgrad(ctx, 782 + 136 - w, 112, w, 276, '#1a2a3a', '#0a0810'); ctx.globalAlpha = 0.5 * open; rect(ctx, 782 + 136 - w, 360, w, 28, '#9fd8ff'); ctx.globalAlpha = 1; }
    const eg = this.step >= 5 ? 0.5 + 0.3 * Math.sin(this.t * 6) : 0.2;
    rect(ctx, 806, 74, 88, 26, '#123018'); frame(ctx, 806, 74, 88, 26, '#0a1a0e');
    ctx.globalAlpha = eg; rect(ctx, 810, 78, 80, 18, '#6be585'); ctx.globalAlpha = 1;
    drawText(ctx, 'EXIT', 850, 80, '#0b2412', { align: 'center', scale: 2 });
    lightPool(ctx, 850, 96, 120, '#6be585', 0.1 + eg * 0.12);
    if (this.step >= 5) lightPool(ctx, 850, floorY + 10, 190, '#8fe0ff', 0.12);
    // ---- cast
    const you = { x: 236, y: 472 };
    const sagging = this.step >= 3;
    drawShadow(ctx, you.x, you.y, 52, 0.34);
    drawBugAt(ctx, this.you.spec, you.x, you.y, { pose: 'sad', instrument: sagging ? null : this.you.instrument, scale: 2.3, expr: 'sad', t: this.t, rate: 0.8, bounce: 0.6 });
    if (sagging) { ctx.drawImage(propCanvas('suitcase'), you.x + 34, you.y - 26, 46, 36); }
    this.mates.forEach((m, i) => {
      const x = 596 + i * 92, pointing = this.step >= 3 && i === 0;
      drawShadow(ctx, x, 472, 46, 0.3);
      drawBugAt(ctx, m.spec, x, 472, { pose: pointing ? 'point' : 'idle', flip: true, scale: 2.1, expr: this.step >= 3 ? 'angry' : (this.step >= 1 ? 'sad' : 'none'), t: this.t, rate: 1.6 + i * 0.2, phase: i * 1.9, bounce: pointing ? 1.8 : 0.8, tilt: pointing ? Math.sin(this.t * 7) * 0.05 - 0.06 : 0 });
      if (pointing) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.t * 7); drawText(ctx, '>', x - 62, 392, '#ff6b6b', { scale: 3 }); ctx.globalAlpha = 1; }
    });
    // ---- atmosphere
    this.fx.draw(ctx); this.motes.draw(ctx, this.t, '#d8c8ff');
    vignette(ctx, 0.5);
    // ---- the line
    const b = this.beats[this.step];
    if (b && b.text) {
      const pop = popIn(this.stepT, 0.24);
      ctx.save(); ctx.translate(0, (1 - pop) * 8);
      if (b.who === 'you') bubble(ctx, you.x + 62, 330, b.text, {});
      else if (b.who === 'mate0') bubble(ctx, 596, 322, b.text, { dark: true, color: '#8a2a5a' });
      else if (b.who === 'mate1') bubble(ctx, 716, 296, b.text, {});
      else uiRibbon(ctx, W / 2, 26, b.text, { scale: 3, color: '#c8433a' });
      ctx.restore();
    }
    if (this.step <= 1) for (let i = 0; i < 3; i++) { const a = 0.3 + 0.35 * Math.sin(this.t * 2.4 - i * 0.8); ctx.globalAlpha = clamp(a, 0, 1); circle(ctx, 470 + i * 16, 350, 3, '#b8b0e0'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.45 + 0.25 * Math.sin(this.t * 3);
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W - 54, H - 24, '#9a92b8', { align: 'right', font: 'small' });
    ctx.globalAlpha = 1;
  }
}

// ---------- The flight: one last practice ----------
class FlightScene {
  constructor() {
    this.t = 0; this.phase = 'board'; this.phaseT = 0; this.fx = new Particles(); this.clouds = [];
    const r = makeRng(21); for (let i = 0; i < 14; i++) this.clouds.push({ x: r.range(0, W), y: r.range(30, 200), s: r.range(0.6, 1.6), sp: r.range(20, 50) });
    this.you = Game.run.members[0];
    this.layout();
  }
  layout() { const t = Game.touch; this.L = t ? { rhythmY: 150, rhythmH: 250, padY: 404, padH: 130, seatTop: 18, seatH: 128 } : { rhythmY: 150, rhythmH: 300, padY: 0, padH: 0, seatTop: 18, seatH: 130 }; }
  isPlaying() { return this.phase === 'play'; }
  startPlay() {
    Audio.init(); Audio.setStageReverb(false);
    const tune = this.you.instrument === 'drums' ? 'saints' : this.you.instrument === 'piano' ? 'furElise' : 'odeToJoy';
    const song = songFromTune(tune, { bpm: 96 });
    const sections = [{ instrument: this.you.instrument, instr: gearInstrument(this.you.instrument, this.you.quality), startBar: 0, endBar: song.bars }];
    const notes = chartFromMelody(song, sections, 2, makeRng(7), { starRate: 0.14, bombMult: 0 });
    const mods = collectMods(null, { difficulty: 2, fx: { shake: Game.shake }, windowMult: 1.35 });
    this.rhythm = new RhythmGame(song, sections, notes, mods, {});
    const start = Audio.now() + 0.5 + song.leadIn; this.rhythm.begin(start);
    this.backing = new Backing(song, start - song.leadIn, () => ({ drums: true, bass: false, pad: false }));
    this.song = song; this.phase = 'play'; this.padKey = null; this.pads = []; this.padPointers = new Map();
  }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.fx.update(dt);
    for (const c of this.clouds) { c.x -= c.sp * dt; if (c.x < -60) { c.x = W + 40; c.y = 30 + Math.random() * 170; } }
    if (this.phase === 'board' && this.phaseT > 3.2) { this.phase = 'intro'; this.phaseT = 0; }
    else if (this.phase === 'intro' && this.phaseT > 3.4) this.startPlay();
    else if (this.phase === 'play') {
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch) { const k = this.rhythm.section.instrument; if (this.padKey !== k) { this.padKey = k; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, false); } }
      if (this.rhythm.finished) { this.backing.stop(); this.phase = 'land'; this.phaseT = 0; const res = this.rhythm.results(); Game.run.money += Math.round(res.acc * 10); Game.run.practiceAcc = res.acc; }
    }
    else if (this.phase === 'land' && this.phaseT > 3.6 && !this.left) { this.left = true; Game.run.save(); Game.go(() => new CityScene(true), 'iris', { dur: 0.6 }); }
  }
  key(code) { if (this.phase === 'play') { this.rhythm.keyDown(code); return; } if (['Enter', 'Space'].includes(code)) { if (this.phase === 'board') { this.phase = 'intro'; this.phaseT = 0; } else if (this.phase === 'intro') this.startPlay(); else if (this.phase === 'land' && !this.left) { this.left = true; Game.run.save(); Game.go(() => new CityScene(true), 'iris', { dur: 0.6 }); } } }
  keyUp(code) { if (this.phase === 'play') this.rhythm.keyUp(code); }
  padAt(x, y) { return this.pads ? this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) : null; }
  pointerDown(x, y, id) { if (this.phase === 'play') { const p = this.padAt(x, y); if (p) { this.padPointers.set(id, p.code); this.rhythm.keyDown(p.code); } return; } this.key('Enter'); }
  pointerMove(x, y, id) { if (this.phase !== 'play') return; const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { const c = this.padPointers && this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); } }
  drawCabin(ctx, top, h) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
    vgrad(ctx, 0, top, W, h, '#d8d4cc', '#b0aca4');
    rect(ctx, 0, top, W, 6, '#e8e4dc');
    // windows with sky
    for (let i = 0; i < 6; i++) {
      const wx = 56 + i * 152, wy = top + 20;
      rect(ctx, wx - 8, wy - 8, 76, 62, '#c0bcb4'); rect(ctx, wx - 6, wy - 6, 72, 58, '#9a968e');
      ctx.save(); ctx.beginPath(); ctx.ellipse(wx + 30, wy + 22, 32, 25, 0, 0, Math.PI * 2); ctx.clip();
      const dawn = this.phase === 'land';
      vgrad(ctx, wx - 6, wy - 6, 72, 58, dawn ? '#f0a060' : '#6ab8f0', dawn ? '#f8d0a0' : '#cfe8ff');
      for (const c of this.clouds) { const cx = ((c.x + i * 60) % (W + 120)) - 60; if (Math.abs(cx - (wx + 30)) < 56) { ctx.globalAlpha = 0.9; ctx.drawImage(propCanvas('cloud'), Math.round(wx + 30 + (cx - wx - 30) * 0.5 - 28), Math.round(wy + 6 + (c.y % 26)), Math.round(52 * c.s), Math.round(18 * c.s)); ctx.globalAlpha = 1; } }
      if (this.phase === 'land') {
        rect(ctx, wx - 6, wy + 32, 72, 22, '#3a6a9a');
        for (let b = 0; b < 12; b++) rect(ctx, wx - 2 + b * 7, wy + 28 - (b % 3) * 5, 5, 18, '#8a90a8');
        rect(ctx, wx + 8, wy + 20, 22, 3, '#c8432a');
      }
      ctx.restore();
      ringPx(ctx, wx + 30, wy + 22, 31, '#e8e4dc');
    }
    rect(ctx, 0, top + h - 14, W, 14, '#8a867e');
    ctx.restore();
  }
  // ---- SFO, an hour before the flight
  drawGate(ctx) {
    const t = this.t;
    if (!this.gate) {
      const r = makeRng(515);
      this.gate = {
        waiting: [0, 1, 2, 3, 4, 5, 6].map(i => ({ spec: randomBugSpec(r), row: i, asleep: r.chance(0.3), kid: r.chance(0.3), o: r.range(0, 6) })),
        walkers: [0, 1, 2].map(i => ({ spec: randomBugSpec(r), x: r.range(0, W), sp: r.range(14, 26) * r.sign(), bag: r.chance(0.6), o: r.range(0, 6) })),
        clerk: randomBugSpec(r), barista: randomBugSpec(r),
      };
    }
    const G = this.gate;
    // ---- terminal shell
    vgrad(ctx, 0, 0, W, 330, '#e6e6ee', '#c6c8d4');
    rect(ctx, 0, 0, W, 34, '#b8bcc8'); rect(ctx, 0, 32, W, 3, '#8f94a2');
    for (let x = 24; x < W; x += 120) { rect(ctx, x, 0, 6, 34, '#9aa0ae'); }
    // strip lights in the ceiling
    for (let x = 60; x < W; x += 150) { rect(ctx, x, 6, 90, 6, '#fffbe8'); lightPool(ctx, x + 45, 20, 130, '#fff4c0', 0.12); }
    // ---- glass wall onto the apron, with the plane
    rect(ctx, 0, 34, W, 250, '#7fb3dc');
    vgrad(ctx, 4, 38, W - 8, 242, '#b9dcf2', '#7fb3dc');
    // distant hills and runway
    ctx.fillStyle = '#9ab89a'; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(200, 120); ctx.lineTo(420, 152); ctx.lineTo(700, 118); ctx.lineTo(W, 148); ctx.lineTo(W, 200); ctx.lineTo(0, 200); ctx.fill();
    rect(ctx, 0, 196, W, 88, '#8f97a4'); rect(ctx, 0, 196, W, 3, '#a8b0bc');
    for (let x = 0; x < W; x += 60) rect(ctx, x, 238, 34, 3, '#e8e4d0');
    // the aircraft
    const px0 = 230 + Math.sin(t * 0.4) * 6;
    rect(ctx, px0, 186, 392, 46, '#f2f2f8'); rect(ctx, px0, 186, 392, 6, '#ffffff');
    rect(ctx, px0, 214, 392, 8, '#2f5a9a');
    ctx.fillStyle = '#f2f2f8'; ctx.beginPath(); ctx.moveTo(px0 + 392, 186); ctx.lineTo(px0 + 452, 200); ctx.lineTo(px0 + 452, 224); ctx.lineTo(px0 + 392, 232); ctx.fill();
    ctx.fillStyle = '#2f5a9a'; ctx.beginPath(); ctx.moveTo(px0 + 352, 186); ctx.lineTo(px0 + 402, 138); ctx.lineTo(px0 + 424, 138); ctx.lineTo(px0 + 400, 186); ctx.fill();
    for (let i = 0; i < 13; i++) rect(ctx, px0 + 30 + i * 26, 198, 13, 11, '#8ec8f0');
    rect(ctx, px0 + 96, 232, 150, 30, '#c8c8d4'); circle(ctx, px0 + 120, 250, 13, '#3a3a48'); circle(ctx, px0 + 120, 250, 7, '#8a8a98');
    rect(ctx, px0 + 8, 224, 34, 16, '#c8c8d4');
    // jet bridge reaching in from the right
    rect(ctx, px0 + 300, 196, 320, 26, '#b8bcc8'); rect(ctx, px0 + 300, 196, 320, 4, '#d4d8e2');
    for (let x = px0 + 310; x < px0 + 620; x += 26) rect(ctx, x, 200, 10, 16, '#8ec8f0');
    // ground crew
    for (const gx of [px0 + 60, px0 + 300]) { drawShadow(ctx, gx, 268, 20, 0.2); drawBugAt(ctx, G.clerk, gx, 268, { pose: Math.floor(t * 2) % 2 ? 'point' : 'idle', scale: 0.8, rate: 1.6 }); }
    // mullions
    rect(ctx, 0, 280, W, 8, '#8f94a2');
    for (let x = 0; x < W; x += 128) { rect(ctx, x, 34, 7, 250, '#c8ccd8'); rect(ctx, x + 1, 34, 2, 250, '#eef0f6'); }
    ctx.globalAlpha = 0.16; for (let x = -200; x < W; x += 160) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x, 284); ctx.lineTo(x + 70, 34); ctx.lineTo(x + 110, 34); ctx.lineTo(x + 40, 284); ctx.fill(); } ctx.globalAlpha = 1;
    // ---- floor
    vgrad(ctx, 0, 288, W, H - 288, '#d8d4cc', '#b0aca6');
    for (let x = 0; x < W; x += 48) rect(ctx, x, 288, 1, H - 288, '#c4c0b8');
    for (let y = 300; y < H; y += 34) rect(ctx, 0, y, W, 1, '#c4c0b8');
    ctx.globalAlpha = 0.12; for (let x = 0; x < W; x += 90) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 300, 30, H - 300); } ctx.globalAlpha = 1;
    // ---- duty free, left
    rect(ctx, 12, 210, 300, 150, '#f2ead6'); frame(ctx, 12, 210, 300, 150, '#8a7450');
    rect(ctx, 12, 210, 300, 26, '#7a2a5a'); rect(ctx, 14, 212, 296, 2, '#a8467e');
    drawText(ctx, 'DUTY FREE', 162, 217, '#ffd9ea', { align: 'center', scale: 2, shadow: '#4a1636' });
    for (let i = 0; i < 3; i++) {
      const sy = 262 + i * 34; rect(ctx, 20, sy, 284, 5, '#b09a6e'); rect(ctx, 20, sy, 284, 2, '#d8c79c');
      const rr = makeRng(60 + i * 3);
      for (let x = 26; x < 296; x += 30) {
        const k = rr.pick(['bottle', 'bottle', 'coffee', 'book', 'poster']);
        ctx.drawImage(itemCanvas(k), 0, 0, 32, 32, x, sy - 28, 28, 28);
      }
    }
    drawShadow(ctx, 268, 360, 28, 0.2);
    drawBugAt(ctx, G.barista, 268, 360, { pose: 'idle', expr: 'happy', scale: 1.1, rate: 1.4 });
    rect(ctx, 236, 344, 62, 18, '#8a5f36'); rect(ctx, 236, 344, 62, 4, '#b5834f');
    // ---- gate desk, right
    rect(ctx, 660, 258, 284, 102, '#31537f'); rect(ctx, 660, 258, 284, 6, '#4a75a8');
    rect(ctx, 668, 266, 268, 30, '#12213a');
    const blink = Math.floor(t * 2) % 2 === 0;
    drawText(ctx, 'GATE A12', 678, 272, '#ffb340', { scale: 2 });
    if (blink) drawText(ctx, 'BOARDING', 838, 272, '#6be585', { align: 'center', scale: 2 });
    for (let i = 0; i < 3; i++) drawText(ctx, ['SFO  0740  ON TIME', 'LAX  0815  DELAYED', 'PDX  0905  ON TIME'][i], 676, 302 + i * 16, i === 1 ? '#e0785a' : '#cfe0f0', { font: 'small' });
    drawShadow(ctx, 790, 372, 30, 0.2);
    drawBugAt(ctx, G.clerk, 790, 372, { pose: 'idle', expr: 'happy', scale: 1.2, rate: 1.3 });
    // ---- planters
    for (const bx of [340, 620]) {
      rect(ctx, bx, 300, 54, 32, '#9a7a52'); rect(ctx, bx, 300, 54, 4, '#b89a70'); frame(ctx, bx, 300, 54, 32, '#6a5236');
      circle(ctx, bx + 16, 294, 15, '#4f8a56'); circle(ctx, bx + 36, 290, 13, '#3f7a48'); circle(ctx, bx + 26, 280, 12, '#6fae72');
      circle(ctx, bx + 12, 284, 7, '#6fae72');
    }
    // ---- seating rows with travellers
    const rowY = [402, 470];
    for (let r2 = 0; r2 < 2; r2++) {
      const y = rowY[r2];
      rect(ctx, 60, y, 840, 8, '#5f6672'); rect(ctx, 60, y, 840, 3, '#7d8493');
      for (let i = 0; i < 8; i++) { const sx = 72 + i * 106; rect(ctx, sx, y - 26, 84, 26, '#3f6ea8'); rect(ctx, sx, y - 26, 84, 3, '#5b8fcc'); rect(ctx, sx + 38, y + 8, 8, 22, '#5f6672'); }
      rect(ctx, 88, y + 30, 8, 6, '#4a5058'); rect(ctx, 864, y + 30, 8, 6, '#4a5058');
    }
    G.waiting.forEach((p, i) => {
      const row = i < 4 ? 0 : 1, y = rowY[row] - 4;
      const x = 104 + (i % 4) * 212 + (row ? 60 : 0);
      drawShadow(ctx, x, y + 4, 26, 0.18);
      drawBugAt(ctx, p.spec, x, y + 2, { pose: p.asleep ? 'sad' : 'idle', expr: p.asleep ? 'sleepy' : null, scale: p.kid ? 0.85 : 1.25, rate: p.asleep ? 0.7 : 1.6, phase: p.o });
      if (p.asleep) { ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + i); drawText(ctx, 'Z', x + 18, y - 48 - (t * 8 % 14), '#6a7080', { scale: 2 }); ctx.globalAlpha = 1; }
      // backpack on the floor beside them
      if (i % 2 === 0) ctx.drawImage(itemCanvas('bag'), 0, 0, 32, 32, x + 22, y - 20, 26, 26);
      if (p.kid) { const kx = x + 34; drawShadow(ctx, kx, y + 6, 16, 0.16); drawBugAt(ctx, p.spec, kx, y + 4, { pose: Math.floor(t * 3 + i) % 2 ? 'cheer' : 'idle2', expr: 'happy', scale: 0.6, rate: 4.2, phase: i }); }
    });
    // ---- travellers walking past
    G.walkers.forEach((wk, i) => {
      wk.x += wk.sp * (1 / 60); if (wk.x < -40) wk.x = W + 40; if (wk.x > W + 40) wk.x = -40;
      drawShadow(ctx, wk.x, 520, 30, 0.2);
      drawBugAt(ctx, wk.spec, wk.x, 518, { pose: Math.floor(t * 5 + i) % 2 ? 'walk1' : 'walk2', flip: wk.sp < 0, scale: 1.35, rate: 3.4, phase: wk.o });
      if (wk.bag) { ctx.drawImage(itemCanvas('bag'), 0, 0, 32, 32, wk.x + (wk.sp < 0 ? -34 : 12), 492, 24, 24); rect(ctx, wk.x + (wk.sp < 0 ? -22 : 22), 470, 2, 24, '#4a4050'); }
    });
    // ---- you, with your case, heading for the gate
    const yx = 470 + Math.sin(t * 0.5) * 10;
    drawShadow(ctx, yx, 520, 46, 0.28);
    drawBugAt(ctx, this.you.spec, yx, 518, { pose: Math.floor(t * 4) % 2 ? 'walk1' : 'walk2', instrument: this.you.instrument, scale: 2.1, expr: 'sad', rate: 3.2 });
    ctx.drawImage(itemCanvas('bag'), 0, 0, 32, 32, yx + 30, 492, 30, 30);
    if (t > 1.2) bubble(ctx, yx + 54, 404, 'ONE WAY.', {});
    // ---- hanging sign
    rect(ctx, 380, 34, 220, 34, '#12213a'); frame(ctx, 380, 34, 220, 34, '#3a4050');
    rect(ctx, 470, 34, 2, 10, '#8a8a98'); rect(ctx, 510, 34, 2, 10, '#8a8a98');
    drawText(ctx, 'GATES A1 - A20', 490, 44, '#ffd9a0', { align: 'center', scale: 2 });
    ctx.drawImage(icon('arrowR'), 578, 44, 10, 18);
    grade(ctx, 0, 0, W, H, '#cfe0ff', 0.1);
    vignette(ctx, 0.36);
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0d0b18'); const L = this.L;
    this.drawCabin(ctx, L.seatTop, L.seatH);
    if (this.phase === 'board') { this.drawGate(ctx); return; }
    // cabin seats
    const seatY = L.seatTop + L.seatH;
    vgrad(ctx, 0, seatY, W, H - seatY, '#2a3040', '#1a1f2b');
    for (let i = 0; i < 6; i++) ctx.drawImage(propCanvas('seat'), 26 + i * 160, seatY + 8, 56, 62);
    drawShadow(ctx, 480, seatY + 78, 40, 0.3);
    drawBugAt(ctx, this.you.spec, 480, seatY + 78, { pose: this.phase === 'play' ? 'play' : 'idle', instrument: this.you.instrument, scale: 2.1 });
    if (this.phase === 'intro') {
      const inner = uiPanel(ctx, W / 2 - 230, L.rhythmY + 30, 460, 110, { title: 'ONE LAST PRACTICE' });
      drawText(ctx, TUNES[this.you.instrument === 'drums' ? 'saints' : this.you.instrument === 'piano' ? 'furElise' : 'odeToJoy'].title.toUpperCase(), inner.x + inner.w / 2, inner.y + 16, '#7a4a10', { align: 'center', scale: 2 });
      drawText(ctx, Game.touch ? 'TAP TO PLAY' : 'PRESS ENTER', inner.x + inner.w / 2, inner.y + 54, UI.inkSoft, { align: 'center' });
      return;
    }
    if (this.phase === 'play') {
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads });
      drawText(ctx, this.song.name.toUpperCase() + '   ' + this.song.composer.toUpperCase(), 10, L.rhythmY + 8, '#ffd24a', { outline: '#1a1410' });
      if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      return;
    }
    if (this.phase === 'land') {
      const inner = uiPanel(ctx, W / 2 - 230, L.rhythmY + 40, 460, 120, { title: 'WELCOME TO SAN FRANCISCO' });
      drawText(ctx, Math.round((Game.run.practiceAcc || 0) * 100) + '%  STILL GOT IT', inner.x + inner.w / 2, inner.y + 16, '#4f8032', { align: 'center', scale: 3 });
      drawText(ctx, 'THE FOG SMELLS LIKE SOURDOUGH', inner.x + inner.w / 2, inner.y + 58, UI.inkSoft, { align: 'center' });
      drawText(ctx, Game.touch ? 'TAP' : 'ENTER', inner.x + inner.w / 2, inner.y + 82, UI.inkFaint, { align: 'center' });
    }
  }
}
