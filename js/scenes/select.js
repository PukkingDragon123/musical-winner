// ---------- Title + Street-Fighter style character select ----------
'use strict';
const ROSTER = [
  { key: 'buzz', title: 'THE FALLEN STAR', instrument: 'guitar', stats: [4, 3, 3], charm: 'leatherJacket', money: 6, tagline: 'Fired on live television.' },
  { key: 'dot', title: 'THE HEARTBEAT', instrument: 'drums', stats: [3, 4, 3], charm: 'drumsticks', money: 8, tagline: 'Never drops a beat.' },
  { key: 'slim', title: 'THE GROOVE', instrument: 'bass', stats: [3, 3, 4], charm: 'shield', money: 10, tagline: 'Too deep for Monarch.' },
  { key: 'hopper', title: 'THE PRODIGY', instrument: 'piano', stats: [5, 2, 2], charm: 'sheetMusic', money: 4, tagline: 'Reads music in the dark.' },
  { key: 'duke', title: 'THE CROONER', instrument: 'sax', stats: [2, 5, 3], charm: 'tipJar', money: 12, tagline: 'Charms coins out of pockets.' },
  { key: 'fitz', title: 'THE SHOWOFF', instrument: 'trumpet', stats: [4, 4, 2], charm: 'valveOil', money: 6, tagline: 'Loud. Very loud.' },
  { key: 'cici', title: 'STREET CLASSIC', instrument: 'violin', stats: [3, 4, 3], charm: 'rosin', money: 8, tagline: 'Trained. Then evicted.' },
  { key: 'roly', title: 'THE UNDERDOG', instrument: 'tambourine', stats: [2, 3, 5], charm: 'gigEconomy', money: 20, tagline: 'Nothing left to lose.' },
];
const STAT_NAMES = ['RHYTHM', 'CHARM', 'GRIT'];

class TitleScene {
  constructor() {
    this.t = 0; this.page = 'main';
    const items = [
      { label: 'NEW GAME', onSelect: () => { RunState.clearSave(); Game.run = null; Game.setScene(new SelectScene()); } },
      { label: 'CONTINUE', disabled: !RunState.hasSave(), onSelect: () => { const r = RunState.load(); if (r) { Game.run = r; Game.setScene(r.nightPending ? new NightScene() : new CityScene()); } } },
      { label: 'HOW TO PLAY', onSelect: () => { this.page = 'help'; } },
      { label: Game.muted ? 'SOUND OFF' : 'SOUND ON', onSelect: (it) => { Game.muted = !Game.muted; Audio.setMuted(Game.muted); it.label = Game.muted ? 'SOUND OFF' : 'SOUND ON'; } },
    ];
    if (Game.touch) items.push({ label: 'TURN SCREEN', onSelect: () => { Game.rotateOverride = !Game.rotated; Game.resize(); } });
    this.menu = new Menu(items);
    const r = makeRng(3);
    this.band = ROSTER.map((c, i) => ({ spec: HERO_PRESETS[c.key], x: 40 + i * 82, inst: c.instrument, o: r.range(0, 6) }));
    this.fx = new Particles();
  }
  update(dt) { this.t += dt; this.fx.update(dt, Game.wind.px); if (Math.random() < dt * 2) this.fx.add({ x: Game.wind.v > 0 ? -5 : W + 5, y: 60 + Math.random() * 150, vx: Game.wind.v * 34 + (Game.wind.v > 0 ? 12 : -12), vy: 8, life: 12, kind: 'leaf', gravity: 3 }); }
  key(code) { if (this.page === 'help') { if (['Escape', 'Enter', 'Space'].includes(code)) { this.page = 'main'; Audio.ui('back'); } return; } this.menu.key(code); }
  click(x, y) { if (this.page === 'help') { this.page = 'main'; return; } this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawNightCity(ctx, this.t);
    for (const b of this.band) { const x = ((b.x + this.t * 20) % (W + 70)) - 35; drawShadow(ctx, x, 300, 18); drawBugAt(ctx, b.spec, x, 300 + Math.round(Math.sin(this.t * 6 + b.o)), { pose: Math.floor(this.t * 6 + b.o) % 2 ? 'walk1' : 'walk2', instrument: b.inst !== 'drums' && b.inst !== 'piano' ? b.inst : null }); }
    this.fx.draw(ctx);
    if (this.page === 'help') { drawHelp(ctx); return; }
    const bob = Math.round(Math.sin(this.t * 2) * 2);
    drawText(ctx, 'BUG BUSKER', W / 2, 24 + bob, '#ffd24a', { align: 'center', scale: 5, outline: '#5a2a10', shadow: '#2a1408' });
    drawText(ctx, 'ORCHESTRA', W / 2, 64 + bob, '#ff9f68', { align: 'center', scale: 3, outline: '#5a2a10' });
    const n = this.menu.items.length, inner = uiPanel(ctx, W / 2 - 92, 104, 184, 22 * n + 20);
    this.menu.draw(ctx, inner.x + 12, inner.y + 8, inner.w - 24, 22, 'buttons');
  }
}
function drawHelp(ctx) {
  const inner = uiPanel(ctx, 36, 24, W - 72, H - 48, { title: 'HOW TO PLAY', close: true });
  const rows = [
    ['gig', 'PLAY', 'Notes fall down your instrument. Hit them on the line.'],
    ['star', 'STARS', 'Gold notes pay triple.'],
    ['fire', 'BOMBS', 'Red notes: do not touch.'],
    ['note', 'BAND', 'Tap the closing ring when a bandmate solos.'],
    ['chips', 'SCORE', 'Applause x Mult = cash.'],
    ['phone', 'TRAVEL', 'Each move on the map costs one Uber ticket.'],
    ['food', 'DINNER', 'Feed every bug at night or they leave.'],
    ['star', 'ABILITIES', 'Pick one new ability after every set.'],
  ];
  let y = inner.y + 8;
  for (const [ic, h, t] of rows) { ctx.drawImage(icon(ic), inner.x + 12, y - 1, 14, 12); drawText(ctx, h, inner.x + 32, y, '#7a4a10'); drawText(ctx, t, inner.x + 110, y, UI.ink, { font: 'small' }); y += 16; }
  drawText(ctx, 'KEYS: D F J K / S L / SPACE / ARROWS    -    M MUTES', inner.x + inner.w / 2, inner.y + inner.h - 14, UI.inkFaint, { align: 'center', font: 'small' });
}

class SelectScene {
  constructor() { this.t = 0; this.sel = 0; this.confirmT = 0; this.confirmed = false; this.cells = []; this.fx = new Particles(); }
  update(dt) {
    this.t += dt; this.fx.update(dt);
    if (this.confirmed) { this.confirmT += dt; if (this.confirmT > 1.3) this.start(); }
  }
  start() { const c = ROSTER[this.sel]; Game.run = RunState.newRun(c); Game.run.save(); Game.setScene(new ConcertScene()); }
  move(d) { const cols = 4; let i = this.sel + d; if (i < 0) i += ROSTER.length; if (i >= ROSTER.length) i -= ROSTER.length; this.sel = i; Audio.ui('move'); }
  key(code) {
    if (this.confirmed) return;
    if (code === 'ArrowLeft' || code === 'KeyA') this.move(-1); else if (code === 'ArrowRight' || code === 'KeyD') this.move(1);
    else if (code === 'ArrowUp' || code === 'KeyW') this.move(-4); else if (code === 'ArrowDown' || code === 'KeyS') this.move(4);
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) this.confirm();
    else if (code === 'Escape') Game.setScene(new TitleScene());
  }
  confirm() { if (this.confirmed) return; this.confirmed = true; this.confirmT = 0; Audio.ui('fanfare'); Game.shake.hit(5, 0.3); for (let i = 0; i < 40; i++) this.fx.add({ x: 150, y: 190, vx: (Math.random() - 0.5) * 260, vy: (Math.random() - 0.5) * 260, life: 0.9, color: ['#ffd24a', '#fff', '#ff5a5a'][i % 3], kind: 'star', size: 2, gravity: 120 }); }
  click(x, y) {
    if (this.confirmed) return;
    for (let i = 0; i < this.cells.length; i++) { const c = this.cells[i]; if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.confirm(); else { this.sel = i; Audio.ui('move'); } return; } }
    if (this.readyBtn && this.readyBtn.hit(x, y)) this.confirm();
  }
  hover(x, y) { for (let i = 0; i < this.cells.length; i++) { const c = this.cells[i]; if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; } }
  draw(ctx) {
    const c = ROSTER[this.sel], spec = HERO_PRESETS[c.key];
    // background: diagonal fight-game stripes
    vgrad(ctx, 0, 0, W, H, '#2a1038', '#0e0820');
    for (let i = -20; i < 40; i++) { const x = i * 34 + ((this.t * 24) % 34); ctx.globalAlpha = i % 2 ? 0.05 : 0.09; ctx.fillStyle = i % 3 === 0 ? '#ff5a9a' : '#5bc0ff'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 18, 0); ctx.lineTo(x - 42, H); ctx.lineTo(x - 60, H); ctx.fill(); ctx.globalAlpha = 1; }
    for (let i = 0; i < 3; i++) { const r = ((this.t * 60 + i * 90) % 320); ctx.globalAlpha = clamp(1 - r / 320, 0, 1) * 0.2; ringPx(ctx, 150, 186, r, '#ffd24a'); ctx.globalAlpha = 1; }
    // banner
    uiRibbon(ctx, W / 2, 6, 'CHOOSE YOUR BUSKER', { scale: 2, color: '#c8433a' });
    // big portrait panel
    const px0 = 18, py0 = 40, pw = 232, ph = 250;
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(px0 + 4, py0 + 5, pw, ph);
    rect(ctx, px0, py0, pw, ph, '#1a1228'); frame(ctx, px0, py0, pw, ph, UI.gold); frame(ctx, px0 + 1, py0 + 1, pw - 2, ph - 2, '#4a3a10');
    // spotlight
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(px0 + pw / 2 - 30, py0); ctx.lineTo(px0 + pw / 2 + 30, py0); ctx.lineTo(px0 + pw / 2 + 90, py0 + ph); ctx.lineTo(px0 + pw / 2 - 90, py0 + ph); ctx.fill(); ctx.globalAlpha = 1;
    const pose = this.confirmed ? 'cheer' : (Math.floor(this.t * 4) % 2 ? 'play' : 'idle');
    drawShadow(ctx, px0 + pw / 2, py0 + 196, 60, 0.35);
    drawBugAt(ctx, spec, px0 + pw / 2, py0 + 196, { pose, instrument: c.instrument !== 'drums' && c.instrument !== 'piano' ? c.instrument : null, scale: 4 });
    if (c.instrument === 'drums') ctx.drawImage(propInstrument('drums'), px0 + pw / 2 - 20, py0 + 160);
    if (c.instrument === 'piano') ctx.drawImage(propInstrument('piano'), px0 + pw / 2 - 20, py0 + 176);
    // name plate
    rect(ctx, px0, py0 + ph - 46, pw, 46, 'rgba(10,8,20,0.85)'); rect(ctx, px0, py0 + ph - 46, pw, 2, UI.gold);
    drawText(ctx, spec.name.toUpperCase(), px0 + 10, py0 + ph - 40, '#ffd24a', { scale: 3, outline: '#5a2a10' });
    drawText(ctx, c.title, px0 + 10, py0 + ph - 15, '#fff', { font: 'small' });
    drawText(ctx, spec.species.toUpperCase(), px0 + pw - 10, py0 + ph - 15, '#8a86b0', { align: 'right', font: 'small' });
    // stats + kit
    const sx = 262, sy = 46;
    for (let i = 0; i < 3; i++) {
      drawText(ctx, STAT_NAMES[i], sx, sy + i * 18, '#cfc9e6', { font: 'small' });
      for (let k = 0; k < 5; k++) { const on = k < c.stats[i]; rect(ctx, sx + 56 + k * 16, sy + i * 18 - 2, 13, 9, on ? ['#ff5a5a', '#ffd24a', '#6be585'][i] : '#2a2440'); frame(ctx, sx + 56 + k * 16, sy + i * 18 - 2, 13, 9, '#0e0820'); if (on) rect(ctx, sx + 57 + k * 16, sy + i * 18 - 1, 11, 3, '#fff'); }
    }
    const ins = INSTRUMENTS[c.instrument], ch = CHARMS[c.charm];
    rect(ctx, sx, sy + 60, 140, 20, '#1a1228'); frame(ctx, sx, sy + 60, 140, 20, '#4a3a60');
    ctx.drawImage(icon('note'), sx + 4, sy + 64); drawText(ctx, ins.name.toUpperCase(), sx + 18, sy + 66, '#fff', { font: 'small' }); drawText(ctx, ins.keyNames.join(' '), sx + 18, sy + 73, '#8a86b0', { font: 'small' });
    rect(ctx, sx + 148, sy + 60, 140, 20, '#1a1228'); frame(ctx, sx + 148, sy + 60, 140, 20, '#4a3a60');
    ctx.drawImage(icon(ch.icon), sx + 152, sy + 64); drawText(ctx, ch.name.toUpperCase(), sx + 166, sy + 66, '#ffd24a', { font: 'small' }); drawText(ctx, fmtMoney(c.money) + ' START', sx + 166, sy + 73, '#6be585', { font: 'small' });
    drawText(ctx, '"' + c.tagline + '"', sx, sy + 88, '#cfc9e6', { font: 'small' });
    // roster grid
    this.cells = []; const gx = 262, gy = 148, cw = 70, chh = 62;
    ROSTER.forEach((r, i) => {
      const x = gx + (i % 4) * (cw + 8), y = gy + Math.floor(i / 4) * (chh + 8), sel = i === this.sel;
      this.cells.push({ x, y, w: cw, h: chh });
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 2, y + 3, cw, chh);
      rect(ctx, x, y, cw, chh, sel ? '#3a2a58' : '#181228'); frame(ctx, x, y, cw, chh, sel ? '#ffd24a' : '#4a3a60');
      drawBugAt(ctx, HERO_PRESETS[r.key], x + cw / 2, y + chh - 14, { pose: sel ? 'play' : 'idle', scale: 1.2 });
      rect(ctx, x, y + chh - 11, cw, 11, 'rgba(10,8,20,0.8)');
      drawText(ctx, HERO_PRESETS[r.key].name.toUpperCase(), x + cw / 2, y + chh - 9, sel ? '#ffd24a' : '#cfc9e6', { align: 'center', font: 'small' });
      if (sel) { const k = Math.floor(this.t * 8) % 2; for (const [dx, dy] of [[0, 0], [cw - 6, 0], [0, chh - 6], [cw - 6, chh - 6]]) { rect(ctx, x + dx, y + dy + (k ? 0 : 0), 6, 2, '#fff'); rect(ctx, x + dx, y + dy, 2, 6, '#fff'); } }
    });
    this.readyBtn = new Btn(gx + 100, gy + 2 * (chh + 8) + 4, 178, 22, this.confirmed ? 'READY!' : 'FIGHT THE SILENCE', () => this.confirm(), { color: this.confirmed ? UI.gold : UI.green, hi: this.confirmed ? UI.goldHi : UI.greenHi, lo: this.confirmed ? UI.goldLo : UI.greenLo, ol: '#2a1a08' });
    this.readyBtn.draw(ctx);
    drawText(ctx, Game.touch ? 'TAP A BUSKER' : 'ARROWS  -  ENTER', gx, gy + 2 * (chh + 8) + 10, '#8a86b0', { font: 'small' });
    this.fx.draw(ctx);
    if (this.confirmed) {
      const k = clamp(this.confirmT / 0.35, 0, 1), sc = lerp(9, 4, easeOutBack(k));
      ctx.globalAlpha = clamp(2 - this.confirmT * 1.5, 0, 1);
      drawText(ctx, 'READY!', W / 2, 140, '#fff', { align: 'center', scale: Math.max(2, Math.round(sc)), outline: '#c8433a' });
      ctx.globalAlpha = 1;
    }
  }
}
