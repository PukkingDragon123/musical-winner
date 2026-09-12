// ---------- Title, help, cutscenes ----------
'use strict';
function drawNightCity(ctx, t, opts = {}) {
  const [c1, c2] = skyColors(opts.sky != null ? opts.sky : 0.92); vgrad(ctx, 0, 0, W, H, c1, c2);
  const r = makeRng(7); for (let i = 0; i < 90; i++) { const x = r.int(0, W), y = r.int(0, 150); if (Math.sin(t * 2 + i) > 0.3) px(ctx, x, y, i % 3 ? '#8a86b0' : '#fff'); }
  circle(ctx, 520, 50, 14, '#f4f0d8'); circle(ctx, 526, 46, 13, c1);
  ctx.drawImage(landmarkCanvas('bridge'), 0, 110, 320, 112); ctx.drawImage(landmarkCanvas('bridge'), 320, 110, 320, 112);
  ctx.drawImage(skylineCanvas(11, W, 80, { color: '#1e1a3a', lit: '#ffe6a0', tall: true, density: 0.3 }), 0, 150);
  ctx.drawImage(landmarkCanvas('transamerica'), 440, 160); ctx.drawImage(landmarkCanvas('coit'), 380, 190);
  // fog drift
  ctx.globalAlpha = 0.28; for (let i = 0; i < 8; i++) { const fx = ((t * 10 + i * 110) % (W + 160)) - 80; rect(ctx, fx, 200 + (i % 3) * 8, 90, 10, '#c8c8e0'); } ctx.globalAlpha = 1;
  rect(ctx, 0, 230, W, 130, '#2a2438'); rect(ctx, 0, 230, W, 3, '#4a4468'); for (let x = 0; x < W; x += 28) rect(ctx, x, 233, 1, 40, '#22202f');
  rect(ctx, 0, 272, W, 88, '#1a1826'); for (let x = 0; x < W; x += 34) rect(ctx, x, 312, 18, 2, '#5a5040');
  ctx.drawImage(propCanvas('lamp'), 60, 230 - 46); ctx.drawImage(propCanvas('lamp'), 560, 230 - 46);
  ctx.globalAlpha = 0.12; circle(ctx, 66, 200, 40, '#ffe680'); circle(ctx, 566, 200, 40, '#ffe680'); ctx.globalAlpha = 1;
}
class TitleScene {
  constructor() {
    this.t = 0; this.page = 'main';
    const items = [
      { label: 'NEW GAME', onSelect: () => { RunState.clearSave(); Game.run = null; Game.setScene(new ConcertScene()); } },
      { label: 'CONTINUE', disabled: !RunState.hasSave(), onSelect: () => { const r = RunState.load(); if (r) { Game.run = r; Game.setScene(r.nightPending ? new NightScene() : new MapScene()); } } },
      { label: 'SKIP INTRO (STREETS)', onSelect: () => { RunState.clearSave(); Game.run = RunState.newRun(); Game.run.save(); Game.setScene(new MapScene(true)); } },
      { label: 'HOW TO PLAY', onSelect: () => { this.page = 'help'; } },
      { label: 'SOUND: ' + (Game.muted ? 'OFF' : 'ON'), onSelect: (it) => { Game.muted = !Game.muted; Audio.setMuted(Game.muted); it.label = 'SOUND: ' + (Game.muted ? 'OFF' : 'ON'); } },
    ];
    if (Game.touch) items.push({ label: 'SCREEN: TURN', onSelect: () => { Game.rotateOverride = !Game.rotated; Game.resize(); } });
    this.menu = new Menu(items);
    const r = makeRng(3); this.band = ['buzz', 'dot', 'slim', 'hopper', 'fitz', 'roly', 'skye', 'stag'].map((k, i) => ({ spec: HERO_PRESETS[k], x: 40 + i * 78, inst: { buzz: 'guitar', slim: 'bass', fitz: 'trumpet', roly: 'tambourine', skye: 'keytar', stag: 'guitar' }[k] || null, o: r.range(0, 6) }));
    this.npcs = []; for (let i = 0; i < 6; i++) this.npcs.push({ spec: randomBugSpec(r), x: r.range(0, W), dir: r.sign(), sp: r.range(14, 24), o: r.range(0, 5) });
    this.fx = new Particles();
  }
  update(dt) { this.t += dt; this.fx.update(dt, Game.wind.px); for (const n of this.npcs) { n.x += n.dir * n.sp * dt; if (n.x < -30) { n.x = W + 30; } if (n.x > W + 30) n.x = -30; } if (Math.random() < dt * 2) this.fx.add({ x: Game.wind.v > 0 ? -5 : W + 5, y: 60 + Math.random() * 150, vx: Game.wind.v * 30 + (Game.wind.v > 0 ? 10 : -10), vy: 8, life: 12, kind: 'leaf', gravity: 3 }); }
  key(code) { if (this.page === 'help') { if (['Escape', 'Enter', 'Space'].includes(code)) { this.page = 'main'; Audio.ui('back'); } return; } this.menu.key(code); }
  click(x, y) { if (this.page === 'help') { this.page = 'main'; return; } this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawNightCity(ctx, this.t);
    for (const n of this.npcs) drawBugAt(ctx, n.spec, n.x, 272, { pose: Math.floor(this.t * 5 + n.o) % 2 ? 'walk1' : 'walk2', flip: n.dir < 0 });
    for (const b of this.band) { const x = ((b.x + this.t * 22) % (W + 60)) - 30; drawShadow(ctx, x, 300, 18); drawBugAt(ctx, b.spec, x, 300 + Math.round(Math.sin(this.t * 6 + b.o)), { pose: Math.floor(this.t * 6 + b.o) % 2 ? 'walk1' : 'walk2', instrument: b.inst }); }
    this.fx.draw(ctx);
    if (this.page === 'help') { drawHelp(ctx); return; }
    drawText(ctx, 'BUG BUSKER', W / 2, 26, '#ffd24a', { align: 'center', scale: 4, outline: '#5a2a10', shadow: '#2a1408' });
    drawText(ctx, 'ORCHESTRA', W / 2, 60, '#ff9f68', { align: 'center', scale: 3, outline: '#5a2a10' });
    drawText(ctx, 'A RHYTHM ROGUELIKE ON THE STREETS OF SAN FRANCISCO', W / 2, 88, '#f4efe0', { align: 'center', outline: '#1a1410' });
    const n = this.menu.items.length; const inner = uiPanel(ctx, W / 2 - 90, 104, 180, 22 * n + 22);
    this.menu.draw(ctx, inner.x + 12, inner.y + 10, inner.w - 24, 22, 'buttons');
    drawText(ctx, Game.touch ? 'TAP TO CHOOSE' : 'ARROWS + ENTER  /  MOUSE  /  M = MUTE', W / 2, H - 14, '#8a86b0', { align: 'center', font: 'small' });
  }
}
function drawHelp(ctx) {
  const inner = uiPanel(ctx, 30, 22, W - 60, H - 44, { title: 'HOW TO PLAY', close: true });
  const lines = [
    ['STORY', 'You were MONARCH\'s lead guitarist until The Solo. Now you busk the streets of San Francisco with six dollars and a dream: build a band that puts hers to shame.'],
    ['MAP', 'Pick a path north each stop: gigs, shops, events, rests, open mics and Big Gigs with crowd modifiers. Every three stops it is night and dinner costs money per bug. A starving bug leaves. If YOU starve, the run ends.'],
    ['GIGS', 'Rhythm minigames per instrument. Falling lanes (guitar, bass, keys, tambourine). Taiko drums: DON F/J, KA D/K, big notes both. Sax: hold SPACE, mind your breath. Trumpet: press the lit valves. Violin: bow UP/DOWN.'],
    ['NOTES', 'Gold STARS pay triple. Red BOMBS: let them pass. ROLL bars: mash. Bandmate spotlight: tap the closing ring (SPACE / F / J).'],
    ['PAYOUT', 'Every hit and every watcher adds APPLAUSE. Combos, hype and your CHARMS build MULT. Cash = Applause x Mult. Build around your instruments and genres like a deck.'],
    ['SHOPS', 'Charms are your build (5 slots). Vouchers are permanent upgrades. Consumables buff the next set. Instruments change how you play.'],
  ];
  let y = inner.y + 6;
  for (const [h, t] of lines) { drawText(ctx, h, inner.x + 10, y, '#7a4a10'); y += drawWrapped(ctx, t, inner.x + 64, y, 78, UI.ink, 9) + 5; }
  drawText(ctx, Game.touch ? 'TAP TO GO BACK' : 'PRESS ENTER TO GO BACK', W / 2, inner.y + inner.h - 12, UI.inkSoft, { align: 'center', font: 'small' });
}
// Dialogue cutscene. steps: [{who, text, action?}] ; opts {bg(ctx,t), actors(ctx,t), onDone}
class CutsceneScene {
  constructor(steps, opts) { this.steps = steps; this.opts = opts; this.i = 0; this.t = 0; this.charT = 0; this.done = false; }
  get step() { return this.steps[this.i]; }
  update(dt) { this.t += dt; this.charT += dt * 40; }
  advance() {
    const s = this.step; if (!s) return;
    if (this.charT < s.text.length) { this.charT = s.text.length + 1; return; }
    if (s.action) s.action();
    this.i++; this.charT = 0; Audio.ui('select');
    if (this.i >= this.steps.length) { this.done = true; this.opts.onDone && this.opts.onDone(); }
  }
  key(code) { if (['Enter', 'Space', 'KeyZ', 'Escape'].includes(code)) this.advance(); }
  click() { this.advance(); }
  draw(ctx) {
    if (this.opts.bg) this.opts.bg(ctx, this.t); else rect(ctx, 0, 0, W, H, '#0a0818');
    if (this.opts.actors) this.opts.actors(ctx, this.t);
    const s = this.step; if (!s) return;
    const spec = s.who === 'buzz' ? HERO_PRESETS.buzz : s.who === 'monarch' ? HERO_PRESETS.monarch : (HERO_PRESETS[s.who] || null);
    const boxX = 90, boxY = H - 92, boxW = W - 180, boxH = 74;
    const shown = s.text.slice(0, Math.floor(this.charT));
    const name = spec ? spec.name.toUpperCase() : (s.who || '').toUpperCase();
    uiDialog(ctx, boxX, boxY, boxW, boxH, name, shown, { tagColor: s.who === 'monarch' ? '#8a2a5a' : '#4a6e3a', more: this.charT >= s.text.length });
    if (spec) {
      const left = s.who !== 'monarch'; const px0 = left ? 44 : W - 44;
      rect(ctx, px0 - 34, boxY - 40, 68, 74, UI.woodLo); rect(ctx, px0 - 32, boxY - 38, 64, 70, UI.gold); rect(ctx, px0 - 30, boxY - 36, 60, 66, '#2a2438');
      drawBugAt(ctx, spec, px0, boxY + 26, { pose: this.charT < s.text.length ? (Math.floor(this.t * 8) % 2 ? 'play' : 'idle') : 'idle', scale: 1.5, flip: !left, instrument: s.who === 'buzz' ? 'guitar' : s.who === 'monarch' ? 'mic' : null });
    }
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W - 100, H - 14, '#8a86b0', { font: 'small' });
  }
}
