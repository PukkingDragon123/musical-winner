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

class ConcertScene {
  constructor() {
    this.t = 0; this.phase = 'rise'; this.phaseT = 0; this.moveIdx = 0; this.fx = new Particles(); this.lightT = 0; this.strobe = 0; this.results = [];
    this.rng = makeRng(777); this.crowd = [];
    for (let i = 0; i < 220; i++) this.crowd.push({ x: this.rng.range(-10, W + 10), row: this.rng.int(0, 4), o: this.rng.range(0, 6), lighter: this.rng.chance(0.3), col: this.rng.pick(['#171224', '#1e1830', '#12101c']) });
    this.layout(); this.pyroT = 0; this.throwables = []; this.booT = 0;
    this.you = Game.run ? Game.run.members[0] : new Member({ name: 'Buzz', presetKey: 'buzz', spec: HERO_PRESETS.buzz, instrument: 'guitar' });
    Audio.setStageReverb(true);
    this.beats = [{ who: 'monarch', text: 'FORTY THOUSAND BUGS. DO NOT EMBARRASS ME.' }];
    this.stageLights = ['#c58bff', '#5bc0ff'];
  }
  layout() { const t = Game.touch; this.L = t ? { rhythmY: 104, rhythmH: 190, stageTop: 18, stageBottom: 104, padY: 298, padH: 58 } : { rhythmY: 14, rhythmH: 196, stageTop: 212, stageBottom: 360, padY: 0, padH: 0 }; }
  isPlaying() { return this.phase === 'play'; }
  get mv() { return OPERA.movements[this.moveIdx]; }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.lightT += dt; this.fx.update(dt); this.pyroT = Math.max(0, this.pyroT - dt);
    for (const o of this.throwables) { o.t += dt; o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 320 * dt; o.rot += dt * 8; }
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
      if (Math.random() < dt * 26) this.fx.add({ x: Math.random() * W, y: this.L.stageBottom - 20 - Math.random() * 60, vx: (Math.random() - 0.5) * 70, vy: -70 - Math.random() * 90, life: 0.9, kind: 'fire', size: 3 + Math.random() * 3, gravity: 60 });
      if (Math.random() < dt * 5) this.fx.add({ x: Math.random() * W, y: this.L.stageBottom - 60, vx: 0, vy: -22, life: 3, kind: 'smoke', color: '#4a4450', size: 7, grow: 16, alpha: 0.5 });
      if (this.booT > 0.4 && Math.random() < dt * 9) this.throwItem();
      if (this.booT > 5.2) Game.setScene(new BackstageScene());
    }
  }
  throwItem() {
    const kind = this.rng.pick(['tomato', 'can', 'cabbage', 'boot', 'fish', 'tomato']);
    const fromX = this.rng.range(40, W - 40), fromY = H - 30;
    const tx = W / 2 - 70 + this.rng.range(-40, 40), ty = this.L.stageBottom - 40;
    const time = 0.75;
    this.throwables.push({ kind, x: fromX, y: fromY, vx: (tx - fromX) / time, vy: (ty - fromY) / time - 0.5 * 320 * time, rot: 0, t: 0 });
    Audio.ui('whoosh');
    setTimeout(() => { Game.shake.hit(3, 0.16); Audio.drum('clunk', 0, 0.5); this.fx.burst(tx, ty, 8, { color: kind === 'tomato' ? '#d83a2a' : '#c8c8d0', speed: 70, life: 0.5, kind: 'px', size: 2, gravity: 200 }); }, time * 1000);
  }
  startMovement(i) {
    this.moveIdx = i; this.phase = 'card'; this.phaseT = 0;
    this.stageLights = this.mv.lights;
    this.cardBtn = new Btn(W / 2 - 70, this.L.rhythmY + this.L.rhythmH - 40, 140, 24, i === 0 ? 'PLAY' : 'NEXT', () => this.startPlay(), { scale: 1 });
  }
  startPlay() {
    const mv = this.mv; Audio.init();
    const song = songFromMovement(mv);
    const sections = [{ instrument: mv.instrument === 'guitar' ? this.you.instrument : mv.instrument, startBar: 0, endBar: song.bars }];
    const diff = mv.impossible ? 7 : mv.difficulty;
    const notes = chartFromMelody(song, sections, diff, this.rng, { starRate: 0.12, bombMult: mv.key === 'solo' ? 1.5 : 0.6 });
    if (mv.impossible) { const extra = []; for (let bar = 1; bar < song.bars; bar++) for (let s = 0; s < 16; s++) extra.push({ t: song.leadIn + bar * 4 * song.beat + s * song.beat / 4, lane: this.rng.int(0, 3), dur: 0, type: 'tap', midi: song.root + 24 + this.rng.int(0, 12) }); notes.push(...extra); notes.sort((a, b) => a.t - b.t); notes.forEach((n, i) => { n.id = i; n.judged = false; n.hit = false; }); }
    const mods = collectMods(null, { difficulty: diff, fx: { shake: Game.shake }, windowMult: mv.impossible ? 0.75 : 1.2, voiceOverride: sections[0].instrument === 'guitar' ? 'eguitar' : null });
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
    this.doneBtn = new Btn(W / 2 - 70, this.L.rhythmY + this.L.rhythmH - 40, 140, 24, 'NEXT', () => this.startMovement(this.moveIdx + 1));
  }
  meltdown() { this.phase = 'fail'; this.booT = 0; this.backing.stop(); Audio.setStageReverb(false); Audio.ui('pyro'); Audio.ui('boo'); Game.shake.hit(11, 0.9); for (let i = 0; i < 90; i++) this.fx.add({ x: Math.random() * W, y: this.L.stageBottom - 30, vx: (Math.random() - 0.5) * 220, vy: -110 - Math.random() * 210, life: 1.2, kind: 'fire', size: 5, gravity: 110 }); }
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
    const L = this.L, top = L.stageTop, bottom = L.stageBottom, h = bottom - top;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
    vgrad(ctx, 0, top, W, h, '#06051a', '#1a0f2e');
    const rise = this.phase === 'rise' ? easeOut(clamp(this.phaseT / 2.2, 0, 1)) : 1;
    const floorY = bottom - Math.round(h * 0.40);
    // video wall
    rect(ctx, 44, top + 4, W - 88, floorY - top - 34, '#0c0a20'); frame(ctx, 44, top + 4, W - 88, floorY - top - 34, '#2a2450');
    const glow = 0.5 + 0.5 * Math.sin(this.t * 2);
    drawText(ctx, 'MONARCH', W / 2, top + Math.round((floorY - top - 34) / 2) - 10, mixColor('#7a1a4a', '#ff5ab0', glow), { align: 'center', scale: 4, outline: '#20081a' });
    for (let i = 0; i < 30; i++) { const bx = 48 + i * 18; ctx.globalAlpha = 0.12 + 0.1 * Math.sin(this.t * 4 + i); rect(ctx, bx, top + 8, 14, floorY - top - 42, i % 2 ? '#3a2a6a' : '#20183a'); ctx.globalAlpha = 1; }
    // truss + lights
    for (let x = 40; x < W - 40; x += 16) ctx.drawImage(propCanvas('truss'), x, top + 2, 16, 14);
    const cols = this.stageLights, n = cols.length + 4;
    for (let i = 0; i < n; i++) {
      const lx = 64 + i * ((W - 128) / (n - 1)), ang = Math.sin(this.lightT * (0.7 + i * 0.13) + i) * 1.0, col = cols[i % cols.length];
      ctx.globalAlpha = (this.phase === 'play' && this.mv.impossible && this.strobe) ? 0.4 : (0.13 + 0.07 * Math.sin(this.t * 3 + i)) * rise;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(lx - 4, top + 16); ctx.lineTo(lx + 4, top + 16); ctx.lineTo(lx + Math.sin(ang) * 230 + 46, bottom); ctx.lineTo(lx + Math.sin(ang) * 230 - 46, bottom); ctx.fill(); ctx.globalAlpha = 1;
      ctx.drawImage(propCanvas('light', i), lx - 5, top + 14);
    }
    if (this.phase === 'play' && this.mv.pyro >= 3) { for (let i = 0; i < 8; i++) { const lx = W / 2 + Math.sin(this.t * 2.6 + i * 0.9) * 300; ctx.globalAlpha = 0.5; line(ctx, W / 2, top + 18, lx, bottom, i % 2 ? '#6be585' : '#ff5ab0'); ctx.globalAlpha = 1; } }
    for (const sx of [10, W - 30]) { ctx.drawImage(propCanvas('speaker'), sx, floorY - 70); ctx.drawImage(propCanvas('speaker'), sx, floorY - 36); }
    rect(ctx, 0, floorY, W, bottom - floorY, '#241d2e'); rect(ctx, 0, floorY, W, 2, '#5a5070');
    for (let x = 0; x < W; x += 44) rect(ctx, x, floorY + 2, 1, bottom - floorY, '#1d1726');
    rect(ctx, W / 2 + 60, floorY - 12, 96, 12, '#33293f'); rect(ctx, W / 2 + 60, floorY - 12, 96, 2, '#6a6080');
    // band of four: drums, keys, singer, you
    const beat = this.rhythm ? (this.rhythm.onBeat || this.rhythm.beatPulse > 0.78) : Math.floor(this.t * 4) % 2 === 0;
    const stage = this.phase === 'fail' ? 'idle' : null;
    ctx.drawImage(propInstrument('drums'), W / 2 + 92, floorY - 44);
    drawBugAt(ctx, HERO_PRESETS.dot, W / 2 + 112, floorY - 14, { pose: stage || (beat ? 'play' : 'idle') });
    ctx.drawImage(propInstrument('piano'), W / 2 + 172, floorY - 24);
    drawBugAt(ctx, HERO_PRESETS.hopper, W / 2 + 192, floorY - 2, { pose: stage || (beat ? 'play' : 'idle') });
    ctx.drawImage(propCanvas('micstand'), W / 2 + 6, floorY - 30);
    drawShadow(ctx, W / 2 + 20, floorY, 26); drawBugAt(ctx, HERO_PRESETS.monarch, W / 2 + 20, floorY + (beat ? -1 : 0), { pose: this.phase === 'fail' ? 'idle' : 'sing', instrument: 'mic' });
    const yx = W / 2 - 76;
    drawShadow(ctx, yx, floorY, 24);
    const youPose = this.phase === 'fail' ? 'idle' : (beat ? 'play' : 'idle');
    if (this.you.instrument === 'drums') { ctx.drawImage(propInstrument('drums'), yx - 20, floorY - 44); drawBugAt(ctx, this.you.spec, yx, floorY - 14, { pose: youPose }); }
    else if (this.you.instrument === 'piano') { ctx.drawImage(propInstrument('piano'), yx - 20, floorY - 24); drawBugAt(ctx, this.you.spec, yx, floorY - 2, { pose: youPose }); }
    else drawBugAt(ctx, this.you.spec, yx, floorY, { pose: youPose, instrument: this.you.instrument });
    ctx.drawImage(propCanvas('amp'), yx - 48, floorY - 14);
    for (const cx of [76, W - 76]) { rect(ctx, cx - 5, floorY - 8, 10, 8, '#444'); rect(ctx, cx - 3, floorY - 12, 6, 4, '#666'); if (this.pyroT > 0) circle(ctx, cx, floorY - 14, 7, '#fff4b0'); }
    // crowd
    const crowdTop = bottom - Math.round(h * 0.24);
    vgrad(ctx, 0, crowdTop - 24, W, bottom - crowdTop + 24, 'rgba(8,6,20,0)', 'rgba(8,6,20,0.92)');
    for (const c of this.crowd) {
      const y = crowdTop + c.row * 7 + Math.round(Math.sin(this.t * 5 + c.o) * (this.phase === 'fail' ? 0 : 2));
      circle(ctx, c.x, y, 4, c.col); rect(ctx, c.x - 3, y + 3, 7, 12, c.col);
      if (c.lighter && this.phase !== 'fail' && Math.sin(this.t * 3 + c.o) > 0) { px(ctx, c.x + 3, y - 5, '#ffd24a'); px(ctx, c.x + 3, y - 6, '#fff8c0'); }
      if (this.phase === 'fail' && c.o < 1.6) { rect(ctx, c.x - 2, y - 2, 5, 3, '#2a0a0a'); }
    }
    if (this.phase === 'fail' && Math.floor(this.t * 3) % 2 === 0) { for (let i = 0; i < 6; i++) drawText(ctx, 'BOO', (i * 113 + 40) % W, crowdTop - 6 - (i % 3) * 9, '#ff5a5a', { font: 'small', align: 'center' }); }
    for (const o of this.throwables) { const c = propCanvas(o.kind); ctx.drawImage(c, Math.round(o.x - c.width / 2), Math.round(o.y - c.height / 2)); }
    this.fx.draw(ctx);
    ctx.restore();
    if (this.phase === 'play' && this.mv.impossible && this.strobe) { ctx.globalAlpha = 0.1; rect(ctx, 0, top, W, h, '#fff'); ctx.globalAlpha = 1; }
    if (this.phase === 'rise') { ctx.globalAlpha = 1 - rise; rect(ctx, 0, top, W, h, '#000'); ctx.globalAlpha = 1; }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#06051a'); const L = this.L;
    this.drawStadium(ctx);
    if (this.phase === 'rise' || this.phase === 'hello') {
      const k = clamp(this.phaseT / 1.2, 0, 1);
      if (this.phase === 'rise') { ctx.globalAlpha = clamp(1.6 - this.phaseT, 0, 1); rect(ctx, 0, 0, W, L.rhythmY + L.rhythmH, '#000'); ctx.globalAlpha = 1; }
      uiRibbon(ctx, W / 2, L.rhythmY + 30, 'ORACLE PARK  -  SOLD OUT', { scale: 2, color: '#7a1a4a' });
      drawText(ctx, OPERA.title, W / 2, L.rhythmY + 62, '#ffd24a', { align: 'center', scale: 3, outline: '#5a2a10' });
      if (this.phase === 'hello') bubble(ctx, W / 2 + 40, L.stageTop - 6, this.beats[0].text, { dark: true, color: '#8a2a5a' });
      drawText(ctx, Game.touch ? 'TAP TO BEGIN' : 'PRESS ENTER', W / 2, L.rhythmY + L.rhythmH - 24, '#cfc9e6', { align: 'center', font: 'small' });
      return;
    }
    if (this.phase === 'card' || this.phase === 'done') {
      const mv = this.mv, inner = uiPanel(ctx, W / 2 - 190, L.rhythmY + 10, 380, L.rhythmH - 20, { title: mv.title });
      if (this.phase === 'card') {
        const ins = INSTRUMENTS[mv.instrument === 'guitar' ? this.you.instrument : mv.instrument];
        ctx.drawImage(icon('note'), inner.x + 10, inner.y + 6, 14, 12);
        drawText(ctx, ins.name.toUpperCase() + '   ' + ins.keyNames.join('  '), inner.x + 30, inner.y + 8, '#7a4a10');
        drawWrapped(ctx, mv.tutorial, inner.x + 12, inner.y + 26, 52, UI.ink, 10);
        for (let i = 0; i < mv.difficulty; i++) ctx.drawImage(icon('star'), inner.x + 12 + i * 14, inner.y + inner.h - 44, 12, 10);
        this.cardBtn.draw(ctx);
      } else {
        const res = this.results[this.results.length - 1], acc = Math.round(res.acc * 100);
        drawText(ctx, acc + '%', inner.x + inner.w / 2, inner.y + 10, acc > 85 ? '#4f8032' : '#b07030', { align: 'center', scale: 4 });
        drawText(ctx, 'MAX COMBO ' + res.maxCombo, inner.x + inner.w / 2, inner.y + 44, UI.inkSoft, { align: 'center', font: 'small' });
        this.doneBtn.draw(ctx);
      }
      return;
    }
    if (this.phase === 'play' || this.phase === 'fail') {
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads });
      const p = clamp(this.rhythm.now / this.song.length, 0, 1);
      rect(ctx, 0, L.rhythmY + L.rhythmH - 3, W, 3, '#241d2e'); rect(ctx, 0, L.rhythmY + L.rhythmH - 3, W * p, 3, '#ffd24a');
      drawText(ctx, this.mv.title, 8, L.rhythmY + 6, '#ffd24a', { outline: '#1a1410', font: 'small' });
      if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      if (this.phase === 'fail') { ctx.globalAlpha = Math.min(0.55, this.booT * 0.35); rect(ctx, 0, 0, W, H, '#3a0000'); ctx.globalAlpha = 1; if (this.booT > 0.5) drawText(ctx, 'THE SOLO COLLAPSES', W / 2, L.rhythmY + L.rhythmH / 2 - 12, '#ff5a5a', { align: 'center', scale: 3, outline: '#1a0000' }); }
    }
  }
}

// ---------- Backstage: the awkward room ----------
class BackstageScene {
  constructor() {
    this.t = 0; this.step = 0; this.fx = new Particles();
    this.beats = [
      { who: null, text: '' }, { who: 'monarch', text: '...' }, { who: 'you', text: 'I can fix it.' },
      { who: 'monarch', text: 'Pack your case.' }, { who: 'dot', text: 'Sorry, Buzz.' }, { who: null, text: 'THE DOOR' },
    ];
    this.you = Game.run.members[0];
  }
  advance() { this.step++; Audio.ui('select'); if (this.step >= this.beats.length) Game.setScene(new FlightScene()); }
  update(dt) { this.t += dt; this.fx.update(dt); }
  key(code) { if (['Enter', 'Space', 'KeyZ'].includes(code)) this.advance(); }
  click() { this.advance(); }
  draw(ctx) {
    // dressing room
    vgrad(ctx, 0, 0, W, H, '#2a2230', '#181320');
    for (let x = 0; x < W; x += 40) { rect(ctx, x, 0, 2, 250, '#221a28'); }
    rect(ctx, 0, 250, W, H - 250, '#3a2a24'); rect(ctx, 0, 250, W, 3, '#5a4238');
    for (let x = 0; x < W; x += 26) rect(ctx, x, 253, 1, H - 253, '#2e2018');
    // mirror with bulbs
    rect(ctx, 40, 60, 190, 130, '#1a1620'); frame(ctx, 40, 60, 190, 130, '#6a5a3a'); rect(ctx, 46, 66, 178, 118, '#3a3a4a');
    for (let i = 0; i < 9; i++) { const bx = 46 + i * 21, on = Math.floor(this.t * 2 + i) % 7 !== 0; circle(ctx, bx + 4, 54, 4, on ? '#ffe8a0' : '#5a5040'); if (on) { ctx.globalAlpha = 0.1; circle(ctx, bx + 4, 54, 14, '#ffe680'); ctx.globalAlpha = 1; } }
    // reflection of you
    ctx.globalAlpha = 0.5; drawBugAt(ctx, this.you.spec, 135, 178, { pose: 'idle', scale: 1.6 }); ctx.globalAlpha = 1;
    // door
    rect(ctx, 520, 80, 90, 172, '#4a3420'); frame(ctx, 520, 80, 90, 172, '#2a1a10'); rect(ctx, 528, 88, 74, 156, '#5a4028');
    circle(ctx, 596, 170, 4, '#d8b040');
    const exitGlow = this.step >= 5 ? 0.35 + 0.25 * Math.sin(this.t * 6) : 0.1;
    ctx.globalAlpha = exitGlow; rect(ctx, 520, 60, 90, 22, '#6be585'); ctx.globalAlpha = 1;
    drawText(ctx, 'EXIT', 565, 66, '#0e2a14', { align: 'center' });
    // couch + clutter
    rect(ctx, 250, 200, 150, 52, '#6a3a4a'); rect(ctx, 250, 196, 150, 8, '#8a4a5a'); rect(ctx, 256, 252, 10, 12, '#3a2018'); rect(ctx, 384, 252, 10, 12, '#3a2018');
    ctx.drawImage(propCanvas('suitcase'), 430, 238);
    // cast: you left, others clustered right, all facing away
    const you = { x: 150, y: 300 };
    drawShadow(ctx, you.x, you.y, 22); drawBugAt(ctx, this.you.spec, you.x, you.y, { pose: 'idle', instrument: this.you.instrument, scale: 1.5 });
    const crew = [{ k: 'monarch', x: 400 }, { k: 'dot', x: 460 }, { k: 'hopper', x: 510 }];
    crew.forEach((c, i) => { drawShadow(ctx, c.x, 300, 20); drawBugAt(ctx, HERO_PRESETS[c.k], c.x, 300, { pose: 'idle', flip: true, scale: 1.5, instrument: c.k === 'monarch' ? 'mic' : null }); });
    // awkward silence marks
    if (this.step <= 1) { for (let i = 0; i < 3; i++) { const a = 0.4 + 0.3 * Math.sin(this.t * 2 + i); ctx.globalAlpha = a; drawText(ctx, '.', 300 + i * 12, 150, '#8a86b0', { scale: 2 }); ctx.globalAlpha = 1; } }
    const b = this.beats[this.step];
    if (b && b.text) {
      if (b.who === 'you') bubble(ctx, you.x + 30, 244, b.text, {});
      else if (b.who === 'monarch') bubble(ctx, 400, 244, b.text, { dark: true, color: '#8a2a5a' });
      else if (b.who === 'dot') bubble(ctx, 470, 230, b.text, {});
      else { uiRibbon(ctx, W / 2, 24, b.text, { scale: 2, color: '#c8433a' }); }
    }
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W - 40, H - 14, '#6a6480', { align: 'right', font: 'small' });
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
  layout() { const t = Game.touch; this.L = t ? { rhythmY: 96, rhythmH: 196, padY: 296, padH: 60, seatTop: 16, seatH: 78 } : { rhythmY: 106, rhythmH: 200, padY: 0, padH: 0, seatTop: 16, seatH: 88 }; }
  isPlaying() { return this.phase === 'play'; }
  startPlay() {
    Audio.init(); Audio.setStageReverb(false);
    const tune = this.you.instrument === 'drums' ? 'saints' : this.you.instrument === 'piano' ? 'furElise' : 'odeToJoy';
    const song = songFromTune(tune, { bpm: 96 });
    const sections = [{ instrument: this.you.instrument, startBar: 0, endBar: song.bars }];
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
    else if (this.phase === 'land' && this.phaseT > 3.6) { Game.run.save(); Game.setScene(new CityScene(true)); }
  }
  key(code) { if (this.phase === 'play') { this.rhythm.keyDown(code); return; } if (['Enter', 'Space'].includes(code)) { if (this.phase === 'board') { this.phase = 'intro'; this.phaseT = 0; } else if (this.phase === 'intro') this.startPlay(); else if (this.phase === 'land') { Game.run.save(); Game.setScene(new CityScene(true)); } } }
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
    for (let i = 0; i < 5; i++) {
      const wx = 44 + i * 122, wy = top + 14;
      rect(ctx, wx - 6, wy - 6, 52, 42, '#c0bcb4'); rect(ctx, wx - 4, wy - 4, 48, 38, '#9a968e');
      ctx.save(); ctx.beginPath(); ctx.ellipse(wx + 20, wy + 15, 22, 17, 0, 0, Math.PI * 2); ctx.clip();
      const dawn = this.phase === 'land';
      vgrad(ctx, wx - 4, wy - 4, 48, 38, dawn ? '#f0a060' : '#6ab8f0', dawn ? '#f8d0a0' : '#cfe8ff');
      for (const c of this.clouds) { const cx = ((c.x + i * 40) % (W + 80)) - 40; if (Math.abs(cx - (wx + 20)) < 40) { ctx.globalAlpha = 0.9; ctx.drawImage(propCanvas('cloud'), Math.round(wx + 20 + (cx - wx - 20) * 0.5 - 20), Math.round(wy + 4 + (c.y % 20)), Math.round(34 * c.s), Math.round(12 * c.s)); ctx.globalAlpha = 1; } }
      if (this.phase === 'land') { // the city below
        rect(ctx, wx - 4, wy + 22, 48, 14, '#3a6a9a');
        for (let b = 0; b < 9; b++) rect(ctx, wx - 2 + b * 6, wy + 20 - (b % 3) * 3, 4, 12, '#8a90a8');
        rect(ctx, wx + 6, wy + 14, 14, 2, '#c8432a');
      }
      ctx.restore();
      ringPx(ctx, wx + 20, wy + 15, 21, '#e8e4dc');
    }
    rect(ctx, 0, top + h - 10, W, 10, '#8a867e');
    ctx.restore();
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0d0b18'); const L = this.L;
    this.drawCabin(ctx, L.seatTop, L.seatH);
    if (this.phase === 'board') {
      // airport gate
      vgrad(ctx, 0, 0, W, H, '#2a3448', '#151a26');
      rect(ctx, 0, 200, W, H - 200, '#3a4050'); rect(ctx, 0, 200, W, 3, '#5a6070');
      for (let x = 0; x < W; x += 30) rect(ctx, x, 203, 1, H - 203, '#2e3440');
      rect(ctx, 0, 40, W, 150, '#1a2030');
      for (let i = 0; i < 6; i++) { const wx = 30 + i * 105; rect(ctx, wx, 50, 86, 120, '#4a7ab0'); rect(ctx, wx + 2, 52, 82, 116, '#6aa0d8'); }
      // plane outside
      const px0 = 120 + Math.sin(this.t * 0.6) * 6;
      rect(ctx, px0, 120, 260, 30, '#e8e8f0'); rect(ctx, px0 + 240, 108, 46, 24, '#e8e8f0'); rect(ctx, px0 + 60, 148, 90, 22, '#c8c8d4');
      for (let i = 0; i < 9; i++) rect(ctx, px0 + 24 + i * 22, 130, 10, 8, '#8ec8f0');
      // departure board
      rect(ctx, 180, 14, 280, 26, '#12161f'); frame(ctx, 180, 14, 280, 26, '#3a4050');
      const blink = Math.floor(this.t * 2) % 2 === 0;
      drawText(ctx, 'SFO   SAN FRANCISCO', 190, 20, '#ffb340');
      drawText(ctx, blink ? 'BOARDING' : '', 400, 20, '#6be585');
      // you with suitcase
      drawShadow(ctx, 200, 300, 22); drawBugAt(ctx, this.you.spec, 200, 300, { pose: Math.floor(this.t * 4) % 2 ? 'walk1' : 'walk2', instrument: this.you.instrument, scale: 1.6 });
      ctx.drawImage(propCanvas('suitcase'), 222, 282);
      bubble(ctx, 240, 250, 'ONE WAY.', {});
      return;
    }
    // cabin seats
    const seatY = L.seatTop + L.seatH;
    vgrad(ctx, 0, seatY, W, H - seatY, '#2a3040', '#1a1f2b');
    for (let i = 0; i < 5; i++) ctx.drawImage(propCanvas('seat'), 20 + i * 128, seatY + 6, 36, 40);
    drawShadow(ctx, 320, seatY + 52, 24, 0.3);
    drawBugAt(ctx, this.you.spec, 320, seatY + 52, { pose: this.phase === 'play' ? 'play' : 'idle', instrument: this.you.instrument, scale: 1.6 });
    if (this.phase === 'intro') {
      const inner = uiPanel(ctx, W / 2 - 170, L.rhythmY + 10, 340, 74, { title: 'ONE LAST PRACTICE' });
      drawText(ctx, TUNES[this.you.instrument === 'drums' ? 'saints' : this.you.instrument === 'piano' ? 'furElise' : 'odeToJoy'].title.toUpperCase(), inner.x + inner.w / 2, inner.y + 8, '#7a4a10', { align: 'center' });
      drawText(ctx, Game.touch ? 'TAP TO PLAY' : 'PRESS ENTER', inner.x + inner.w / 2, inner.y + 28, UI.inkSoft, { align: 'center', font: 'small' });
      return;
    }
    if (this.phase === 'play') {
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads });
      drawText(ctx, this.song.name.toUpperCase() + '  -  ' + this.song.composer.toUpperCase(), 8, L.rhythmY + 6, '#ffd24a', { outline: '#1a1410', font: 'small' });
      if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      return;
    }
    if (this.phase === 'land') {
      const inner = uiPanel(ctx, W / 2 - 150, L.rhythmY + 20, 300, 76, { title: 'WELCOME TO SAN FRANCISCO' });
      drawText(ctx, Math.round((Game.run.practiceAcc || 0) * 100) + '% - STILL GOT IT', inner.x + inner.w / 2, inner.y + 10, '#4f8032', { align: 'center' });
      drawText(ctx, 'THE FOG SMELLS LIKE SOURDOUGH', inner.x + inner.w / 2, inner.y + 28, UI.inkSoft, { align: 'center', font: 'small' });
      drawText(ctx, Game.touch ? 'TAP' : 'ENTER', inner.x + inner.w / 2, inner.y + 44, UI.inkFaint, { align: 'center', font: 'small' });
    }
  }
}
