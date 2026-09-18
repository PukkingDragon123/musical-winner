// ---------- Playing in the street ----------
// You find somewhere, you put your gear down piece by piece, and then you
// play there. The camera never leaves the street: the set happens in the
// exact square of pavement you chose, with the crowd filling in around it.
'use strict';
const BUSK_GEAR = [
  { key: 'case',  name: 'OPEN THE CASE',    hint: 'Nothing happens without somewhere to put the money.' },
  { key: 'amp',   name: 'STAND THE AMP UP', hint: 'Small, battered, loud enough.' },
  { key: 'mic',   name: 'SET THE MIC',      hint: 'One stand, borrowed, slightly bent.' },
  { key: 'rig',   name: 'SET UP YOUR GEAR', hint: 'Whatever it is you play.' },
  { key: 'sign',  name: 'PUT THE SIGN OUT', hint: 'THE BUG BUSKER ORCHESTRA, in marker pen.' },
];
function drawBuskGear(ctx, g, t) {
  const x = g.x, y = g.y;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x + 2, y + 4, 12, 5, '#000'); ctx.globalAlpha = 1;
  switch (g.key) {
    case 'case': {
      rect(ctx, x - 14, y - 6, 28, 14, '#4a3524'); rect(ctx, x - 14, y - 6, 28, 3, '#6a4f36');
      rect(ctx, x - 11, y - 3, 22, 9, '#8a2a3a');
      // the coins that have landed in it so far
      for (let i = 0; i < (g.coins || 0) && i < 14; i++) { const cx = x - 9 + (i * 5) % 19, cy = y + 1 + ((i * 3) % 4); circle(ctx, cx, cy, 2, '#f2c94c'); px(ctx, cx - 1, cy - 1, '#fff2c0'); }
      break;
    }
    case 'amp': {
      rect(ctx, x - 11, y - 18, 22, 22, '#241f2e'); rect(ctx, x - 11, y - 18, 22, 3, '#3f3850');
      rect(ctx, x - 8, y - 14, 16, 13, '#3a3448');
      for (let gy = y - 13; gy < y - 2; gy += 3) for (let gx = x - 7; gx < x + 7; gx += 3) px(ctx, gx, gy, '#262034');
      rect(ctx, x - 8, y, 16, 3, '#8a8a98');
      if (g.on) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 6); circle(ctx, x + 7, y - 16, 2, '#e8503a'); ctx.globalAlpha = 1; }
      break;
    }
    case 'mic': {
      rect(ctx, x - 7, y, 14, 3, '#3a3444');
      rect(ctx, x - 1, y - 26, 2, 26, '#6a6a7a');
      rect(ctx, x - 4, y - 30, 8, 5, '#2a2434'); ellipsePx(ctx, x, y - 31, 4, 4, '#8a8a98');
      break;
    }
    case 'rig': {
      const k = (Game.run && Game.run.members[0] && Game.run.members[0].instrument) || 'guitar';
      if (k === 'drums') {
        ellipsePx(ctx, x, y - 8, 15, 11, '#c8402c'); ellipsePx(ctx, x, y - 10, 13, 9, '#e8e2d4');
        rect(ctx, x - 18, y - 16, 3, 16, '#8a8a98'); ellipsePx(ctx, x - 17, y - 18, 8, 3, '#e0b83c');
        rect(ctx, x + 15, y - 14, 3, 14, '#8a8a98');
      } else if (k === 'piano') {
        rect(ctx, x - 20, y - 10, 40, 12, '#241f2e'); rect(ctx, x - 18, y - 9, 36, 6, '#f0ece2');
        for (let i = 0; i < 9; i++) rect(ctx, x - 16 + i * 4, y - 9, 2, 4, '#1b1826');
        rect(ctx, x - 16, y + 2, 4, 8, '#8a8a98'); rect(ctx, x + 12, y + 2, 4, 8, '#8a8a98');
      } else {
        rect(ctx, x - 3, y - 30, 4, 24, '#4a3524');
        ellipsePx(ctx, x, y - 4, 10, 12, '#c8402c'); ellipsePx(ctx, x, y - 6, 4, 4, '#2a1f16');
        rect(ctx, x - 5, y - 33, 7, 5, '#2a1f16');
      }
      break;
    }
    case 'sign': {
      rect(ctx, x - 16, y - 20, 32, 18, '#f0ece2'); frame(ctx, x - 16, y - 20, 32, 18, '#8a7a5e');
      for (let i = 0; i < 3; i++) rect(ctx, x - 13 + (i % 2) * 2, y - 16 + i * 5, 26 - i * 5, 2, '#3a3444');
      rect(ctx, x - 1, y - 2, 2, 4, '#8a7a5e');
      break;
    }
  }
}
class BuskScene {
  constructor(spot, back) {
    const r = Game.run;
    this.t = 0; this.phase = 'setup'; this.phaseT = 0;
    this.spot = spot;                                  // {x, y} in map pixels
    this.backTo = back || (() => new CityScene());
    this.sf = buildSF(); this.grid = tileGrid();
    this.you = r.members[0];
    this.cam = new WorldCam({ z: 3, view: { x: 0, y: 0, w: W, h: H }, bounds: { w: MAPW, h: MAPH }, lead: 0.08 });
    this.body = new Walker(spot.x, spot.y, { r: 8, speed: 100, accel: 1000, friction: 1100, spec: this.you.spec, scale: 1.5 });
    this.input = new WorldInput();
    this.cam.snapTo(this.body.x, this.body.y);
    this.solid = (x, y) => !tileWalkable(this.grid, Math.floor(x / TILE), Math.floor(y / TILE));
    this.gear = []; this.next = 0;
    this.msg = null; this.msgT = 0;
    this.fx = new Particles();
    this.crowd = [];
    this.watchers = 0; this.tips = 0;
    this.startBtn = null;
    this.flash('FIND A SPOT AND PUT YOUR GEAR DOWN.');
  }
  flash(m) { this.msg = m; this.msgT = 3; }
  leave() { if (this.left) return; this.left = true; Game.run.save(); Game.go(this.backTo, 'fade', { dur: 0.5 }); }
  // ---- setup
  placeNext() {
    if (this.next >= BUSK_GEAR.length) return;
    const g = BUSK_GEAR[this.next];
    // in front of you if there is room, otherwise wherever there is
    const dir = this.body.facing;
    const tries = [[dir.dx * 18, dir.dy * 16], [16, 0], [-16, 0], [0, 16], [0, -16], [14, 14], [-14, 14], [-14, -14], [14, -14], [0, 0]];
    let gx = null, gy = null;
    for (const [ox, oy] of tries) {
      const px2 = clamp(this.body.x + ox, 20, MAPW - 20), py2 = clamp(this.body.y + oy, 20, MAPH - 20);
      if (this.solid(px2, py2)) continue;
      if (this.gear.some(o => Math.hypot(o.x - px2, o.y - py2) < 13)) continue;
      gx = px2; gy = py2; break;
    }
    if (gx == null) { this.flash('NO ROOM. MOVE ALONG A BIT.'); Audio.ui('error'); return; }
    this.gear.push({ key: g.key, x: gx, y: gy, t: 0, coins: 0, on: true });
    this.next++;
    Audio.ui('select'); Game.shake.hit(2, 0.1);
    this.fx.burst(this.cam.sx(gx), this.cam.sy(gy), 8, { color: ['#cfc6ae', '#fff'], speed: 50, life: 0.4, kind: 'px', size: 2, gravity: 160 });
    this.flash(this.next < BUSK_GEAR.length ? BUSK_GEAR[this.next].name : 'THAT IS EVERYTHING. PLAY WHEN YOU ARE READY.');
  }
  canStart() { return this.gear.length >= 3; }
  startSet() {
    if (!this.canStart()) { this.flash('PUT MORE OF IT DOWN FIRST.'); Audio.ui('error'); return; }
    const r = Game.run;
    Audio.init(); Audio.setStageReverb(false);
    // the band stands round the gear
    const anchor = this.gear.find(g => g.key === 'rig') || this.gear[0];
    this.anchor = anchor;
    this.mates = r.members.slice(1, 4).map((m, i) => ({ m, x: anchor.x + (i - 1) * 26 - 8, y: anchor.y - 6 + (i % 2) * 8 }));
    // the set itself, on whatever the band plays
    const tune = r.lastTune && TUNES[r.lastTune] ? r.lastTune : Object.keys(TUNES)[0];
    const song = songFromTune(tune, { bpm: 112 });
    const instr = gearInstrument(this.you.instrument, this.you.quality || 1);
    const sections = [{ instrument: this.you.instrument, instr, startBar: 0, endBar: song.bars }];
    const notes = chartFromMelody(song, sections, clamp(1 + r.day, 1, 4), makeRng(Date.now() & 0xffff), { starRate: 0.12, bombMult: 0.6 });
    this.mods = collectMods(r, { difficulty: clamp(1 + r.day, 1, 4), fx: { shake: Game.shake }, windowMult: 1.2 });
    this.rhythm = new RhythmGame(song, sections, notes, this.mods, {
      onJudge: (n, j) => { if (j === 'perfect' || j === 'great') this.tipDrop(j === 'perfect' ? 2 : 1); },
    });
    const start = Audio.now() + 0.6 + song.leadIn;
    this.rhythm.begin(start);
    this.backing = new Backing(song, start - song.leadIn, () => ({ drums: true, bass: true, pad: false }));
    this.song = song;
    this.S = new ScoreState(r, { mods: this.mods, instrument: this.you.instrument, genre: song.genre, performers: r.members.length, band: r.members });
    // the street keeps the top of the frame; the play surface takes the rest
    this.playTop = H - (Game.touch ? 300 : 210);
    this.cam.view = { x: 0, y: 0, w: W, h: this.playTop };
    this.phase = 'play'; this.phaseT = 0;
    this.pads = Game.touch ? buildPads(instr, { x: 4, y: H - 132, w: W - 8, h: 128 }, false) : [];
    this.padPointers = new Map();
    // the crowd that will gather, generated once and revealed as it arrives
    this.pool = makeBugCrowd(180, hashStr('busk' + Math.round(this.spot.x) + Math.round(this.spot.y)), { glowRate: 0.3, cols: ['#2f2743', '#3a3050', '#262038', '#43385c', '#1f1a2e'] });
    this.crowdN = 0;
  }
  tipDrop(n) {
    const c = this.gear.find(g => g.key === 'case');
    this.tips += n * 0.25 * (this.mods.tipMult || 1);
    if (c) { c.coins = (c.coins || 0) + 1; }
    if (c && Math.random() < 0.5) this.fx.add({ x: this.cam.sx(c.x), y: this.cam.sy(c.y) - 30, vx: (Math.random() - 0.5) * 30, vy: -40, life: 0.6, color: '#f2c94c', kind: 'star', size: 2, gravity: 320 });
  }
  finish() {
    const r = Game.run;
    this.backing.stop();
    const res = this.rhythm.results();
    const total = this.S.finish({ combo: this.rhythm.combo, maxCombo: res.maxCombo, misses: res.miss, watchers: this.crowdN, hype: this.rhythm.hype, acc: res.acc });
    const pay = Math.round((total * 0.5 + this.tips * 4) * 10) / 10;
    this.pay = Math.max(1, Math.round(pay));
    r.money += this.pay;
    r.today.earned = (r.today.earned || 0) + this.pay;
    r.today.gigs = (r.today.gigs || 0) + 1;
    r.today.bestCombo = Math.max(r.today.bestCombo || 0, res.maxCombo);
    r.today.perfects = (r.today.perfects || 0) + res.perfect;
    if (res.acc > 0.85) r.gratitude = (r.gratitude || 0) + 1;
    checkGoals(r); r.save();
    this.acc = res.acc; this.phase = 'tally'; this.phaseT = 0;
    Audio.ui('fanfare');
  }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.msgT = Math.max(0, this.msgT - dt); this.fx.update(dt);
    for (const g of this.gear) g.t += dt;
    if (this.phase === 'setup') {
      const v = this.input.vector({ x: this.body.x, y: this.body.y });
      this.body.step(dt, v.x, v.y, this.solid);
      this.cam.follow(dt, this.body.x, this.body.y, this.body.vx, this.body.vy);
      return;
    }
    if (this.phase === 'play') {
      this.backing.update(); this.rhythm.update(dt);
      this.cam.follow(dt, this.anchor.x, this.anchor.y + 4, 0, 0);
      // the crowd builds while you are going well and drifts off when you are not
      const want = clamp(Math.round(6 + this.rhythm.hype * 0.9 + (this.rhythm.combo || 0) * 0.5), 0, this.pool.length);
      if (this.crowdN < want && Math.random() < dt * 6) this.crowdN++;
      else if (this.crowdN > want && Math.random() < dt * 1.2) this.crowdN--;
      this.layout();
      if (this.rhythm.finished) this.finish();
      return;
    }
    if (this.phase === 'tally') { this.layout(); if (this.phaseT > 6) this.leave(); }
  }
  layout() {
    const a = this.anchor;
    this.shown = layoutCrowdArc(this.pool.slice(0, this.crowdN), a.x, a.y, { rows: 7, spread: 120, depth: 62, near: 24, far: 10, gap: 22 });
  }
  key(code) {
    if (this.phase === 'setup') {
      if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.placeNext(); return; }
      if (code === 'KeyP' && this.canStart()) { this.startSet(); return; }
      if (code === 'Escape') { this.leave(); return; }
      this.input.key(code); return;
    }
    if (this.phase === 'play') { this.rhythm.keyDown(code); return; }
    if (['Enter', 'Space', 'KeyZ', 'Escape'].includes(code)) this.leave();
  }
  keyUp(code) { if (this.phase === 'play') this.rhythm.keyUp(code); else this.input.keyUp(code); }
  padAt(x, y) { return this.pads ? this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) : null; }
  pointerDown(x, y, id) {
    if (this.phase === 'setup') {
      if (this.startBtn && this.startBtn.hit(x, y) && this.canStart()) { this.startSet(); return; }
      if (this.placeBtn && this.placeBtn.hit(x, y)) { this.placeNext(); return; }
      if (this.leaveBtn && this.leaveBtn.hit(x, y)) { this.leave(); return; }
      if (Game.touch) { this.input.down(x, y, id); this.dragId = id; this.dragAt = { x, y }; this.dragMoved = 0; return; }
      this.input.tapGoal = { x: this.cam.wx(x), y: this.cam.wy(y) };
      return;
    }
    if (this.phase === 'play') {
      if (this.rhythm.instrument.view === 'kit') { kitPointerDown(this, x, y, id); return; }
      const p = this.padAt(x, y); if (p) { this.padPointers.set(id, p.code); this.rhythm.keyDown(p.code); }
      return;
    }
    this.leave();
  }
  pointerMove(x, y, id) {
    if (this.phase === 'setup') { if (this.input.move(x, y, id) && this.dragAt) this.dragMoved = Math.max(this.dragMoved, Math.hypot(x - this.dragAt.x, y - this.dragAt.y)); return; }
    if (this.phase !== 'play') return;
    if (this.rhythm.instrument.view === 'kit') { kitPointerMove(this, x, y, id); return; }
    const prev = this.padPointers.get(id); if (prev === undefined) return;
    const pad = this.padAt(x, y); const next = pad ? pad.code : null;
    if (next === prev) return; this.rhythm.keyUp(prev);
    if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id);
  }
  pointerUp(x, y, id) {
    if (this.phase === 'setup') { if (this.dragId === id) { const moved = this.dragMoved; this.input.up(id); this.dragId = null; if (moved < 6) this.input.tapGoal = { x: this.cam.wx(x), y: this.cam.wy(y) }; return; } this.input.up(id); return; }
    if (this.phase === 'play' && this.rhythm.instrument.view === 'kit') kitPointerUp(this, id);
    const c = this.padPointers && this.padPointers.get(id);
    if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); }
  }
  click(x, y) { this.pointerDown(x, y, 999); }
  hover(x, y) { for (const b of [this.startBtn, this.placeBtn, this.leaveBtn]) if (b) b.hover(x, y); }
  // ---------- drawing ----------
  draw(ctx) {
    const cam = this.cam, t = this.t, r = Game.run;
    rect(ctx, 0, 0, W, H, '#1b2230');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.sf.canvas, -Math.round(cam.x), -Math.round(cam.y), Math.round(MAPW * cam.z), Math.round(MAPH * cam.z));
    // everything on the street, sorted so near things cover far ones
    const items = [];
    for (const g of this.gear) items.push({ y: g.y, d: () => { const s = { x: cam.sx(g.x), y: cam.sy(g.y) }; ctx.save(); ctx.translate(s.x, s.y); ctx.scale(cam.z / 1.45, cam.z / 1.45); drawBuskGear(ctx, { key: g.key, x: 0, y: 0, coins: g.coins, on: g.on }, t); ctx.restore(); } });
    if (this.shown) for (const b of this.shown) items.push({ y: b.y, d: () => drawBugSilhouette(ctx, b, cam.sx(b.x), cam.sy(b.y), b.s * (cam.z / 2.2), t, this.phase === 'tally' ? 'flat' : 'happy', b.s > 20 ? 1 : 0) });
    if (this.mates) for (const m of this.mates) items.push({ y: m.y, d: () => {
      const s = { x: cam.sx(m.x), y: cam.sy(m.y) };
      drawShadow(ctx, s.x, s.y + 6, 20, 0.3);
      drawBugAt(ctx, m.m.spec, s.x, s.y + 8, { pose: this.phase === 'play' ? (Math.floor(t * 6) % 2 ? 'play' : 'play2') : 'idle', scale: 1.2, instrument: m.m.instrument !== 'drums' && m.m.instrument !== 'piano' ? m.m.instrument : null });
    } });
    const b = this.body;
    items.push({ y: b.y, d: () => {
      const s = { x: cam.sx(b.x), y: cam.sy(b.y) };
      drawShadow(ctx, s.x, s.y + 7, 24, 0.34);
      const pose = this.phase === 'play' ? (Math.floor(t * 7) % 2 ? 'play' : 'play2') : b.pose;
      drawBugAt(ctx, this.you.spec, s.x, s.y + 9, { pose, scale: 1.6, flip: b.flip, instrument: this.you.instrument !== 'drums' && this.you.instrument !== 'piano' ? this.you.instrument : null });
    } });
    items.sort((p, q) => p.y - q.y);
    for (const it of items) it.d();
    this.fx.draw(ctx);
    if (this.phase === 'setup') this.drawSetup(ctx);
    else if (this.phase === 'play') this.drawPlay(ctx);
    else this.drawTally(ctx);
    if (this.msgT > 0 && this.phase !== 'tally') {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = Math.min(W - 40, textWidth(this.msg, { scale: 2 }) + 28);
      rect(ctx, W / 2 - w2 / 2, 14, w2, 24, '#152a18'); frame(ctx, W / 2 - w2 / 2, 14, w2, 24, '#6be585');
      drawText(ctx, this.msg, W / 2, 21, '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    this.input.drawStick(ctx);
  }
  drawSetup(ctx) {
    // the checklist of what is still in the bag
    const bx = 14, by = 60;
    rect(ctx, bx, by, 226, 24 + BUSK_GEAR.length * 20, 'rgba(10,8,20,0.82)');
    frame(ctx, bx, by, 226, 24 + BUSK_GEAR.length * 20, '#c8a03a');
    drawText(ctx, 'PLACE TOOLS', bx + 10, by + 7, '#ffd24a', { scale: 2 });
    BUSK_GEAR.forEach((g, i) => {
      const y = by + 24 + i * 20, done = i < this.next, now = i === this.next;
      rect(ctx, bx + 10, y + 2, 10, 10, done ? '#6be585' : now ? '#ffd24a' : '#2a2438');
      if (done) { line(ctx, bx + 12, y + 7, bx + 14, y + 10, '#0f1a0f'); line(ctx, bx + 14, y + 10, bx + 18, y + 4, '#0f1a0f'); }
      drawText(ctx, g.name, bx + 26, y + 3, done ? '#6a7a68' : now ? '#fff4d8' : '#8a82a8', { font: 'small' });
    });
    if (this.next < BUSK_GEAR.length) drawText(ctx, BUSK_GEAR[this.next].hint, bx + 10, by + 30 + BUSK_GEAR.length * 20 - 10, '#8a82a8', { font: 'small' });
    this.placeBtn = this.placeBtn || new Btn(W - 400, H - 60, 180, 44, 'PUT IT DOWN', () => this.placeNext(), { scale: 3 });
    this.startBtn = this.startBtn || new Btn(W - 208, H - 60, 190, 44, 'START THE SET', () => this.startSet(), { scale: 3, color: UI.gold, hi: UI.goldHi, lo: UI.goldLo, ol: UI.goldOl });
    this.leaveBtn = this.leaveBtn || new Btn(14, H - 60, 120, 44, 'PACK UP', () => this.leave(), { scale: 3, color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1410' });
    this.placeBtn.draw(ctx, this.next >= BUSK_GEAR.length ? 'disabled' : undefined);
    this.startBtn.draw(ctx, this.canStart() ? undefined : 'disabled');
    this.leaveBtn.draw(ctx);
  }
  drawPlay(ctx) {
    const L = { rhythmY: this.playTop, rhythmH: Game.touch ? 172 : 200, padY: H - 128, padH: 124 };
    // the play surface sits over the bottom of the street; the street stays put
    ctx.globalAlpha = 0.72; rect(ctx, 0, L.rhythmY - 6, W, H - L.rhythmY + 6, '#080614'); ctx.globalAlpha = 1;
    rect(ctx, 0, L.rhythmY - 6, W, 2, '#c8a03a');
    this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads, overlay: true,
      kit: this.rhythm.instrument.view === 'kit' ? { cx: W / 2, baseY: H - 60, width: W, zoom: 1 } : null });
    if (Game.touch) drawPadStrip(ctx, L, this.pads, this.rhythm.keysDown);
    // takings and the size of the crowd
    rect(ctx, W - 186, 12, 172, 44, 'rgba(10,8,20,0.78)'); frame(ctx, W - 186, 12, 172, 44, '#3a3560');
    ctx.drawImage(icon('heart'), W - 180, 18, 12, 10); drawText(ctx, String(this.crowdN), W - 164, 19, '#cfc9e6', { scale: 2 });
    ctx.drawImage(icon('coin'), W - 180, 36, 13, 12); drawText(ctx, fmtMoney(this.tips), W - 162, 37, '#ffd24a', { scale: 2 });
  }
  drawTally(ctx) {
    ctx.globalAlpha = 0.6; rect(ctx, 0, 0, W, H, '#05040c'); ctx.globalAlpha = 1;
    const acc = Math.round((this.acc || 0) * 100);
    drawText(ctx, 'THAT IS THE SET', W / 2, 120, '#fff4d8', { align: 'center', scale: 5, outline: '#2a1a08' });
    drawText(ctx, acc + '%', W / 2, 190, acc > 80 ? '#6be585' : '#ffd24a', { align: 'center', scale: 8 });
    drawText(ctx, String(this.crowdN) + ' STOPPED TO LISTEN', W / 2, 280, '#cfc9e6', { align: 'center', scale: 2 });
    drawText(ctx, 'THE CASE HAS ' + fmtMoney(this.pay || 0) + ' IN IT', W / 2, 314, '#ffd24a', { align: 'center', scale: 3 });
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 5);
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, H - 70, '#cfc9e6', { align: 'center', scale: 2 });
    ctx.globalAlpha = 1;
  }
}
