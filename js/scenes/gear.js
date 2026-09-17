// ---------- The counter at the back of the anime store, and the arcade ----------
'use strict';
class SkinShopScene {
  constructor(node, mode) {
    this.node = node; this.mode = mode || 'skin'; this.t = 0;
    this.you = Game.run.members[0];
    this.kind = this.you.instrument;
    this.keys = this.mode === 'skin' ? SKIN_KEYS.slice() : MOD_KEYS.slice();
    this.sel = 0; this.msg = null; this.msgT = 0;
    this.backBtn = new Btn(24, H - 56, 150, 42, 'BACK', () => this.back(), { scale: 3, color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1410' });
    this.takeBtn = new Btn(W - 234, H - 56, 210, 42, 'BUY', () => this.take(), { scale: 3 });
  }
  back() { if (this.left) return; this.left = true; Game.go(() => new PlaceScene(this.node), 'slideR', { dur: 0.4 }); }
  flash(m) { this.msg = m; this.msgT = 2.4; }
  cardRects() {
    const cols = 4, cw = 196, ch = 116, gapX = 14, gapY = 14;
    const x0 = Math.round((W - (cols * cw + (cols - 1) * gapX)) / 2), y0 = 96;
    return this.keys.map((k, i) => ({ k, x: x0 + (i % cols) * (cw + gapX), y: y0 + Math.floor(i / cols) * (ch + gapY), w: cw, h: ch }));
  }
  take() {
    const r = Game.run, k = this.keys[this.sel];
    if (this.mode === 'skin') {
      const S = SKINS[k];
      if (skinOwned(k)) { r.skins = r.skins || {}; r.skins[this.kind] = k; Audio.ui('select'); this.flash('WEARING ' + S.name); r.save(); return; }
      if (r.money < S.cost) { Audio.ui('error'); this.flash('NOT ENOUGH FOR THAT'); return; }
      r.money -= S.cost; r.ownedSkins = r.ownedSkins || []; r.ownedSkins.push(k);
      r.skins = r.skins || {}; r.skins[this.kind] = k;
      Audio.ui('fanfare'); this.flash('BOUGHT ' + S.name); r.save(); return;
    }
    const M = GEAR_MODS[k];
    if (modOwned(k)) { r.gearMods = r.gearMods.filter(x => x !== k); Audio.ui('back'); this.flash('TOOK OFF ' + M.name); r.save(); return; }
    if ((r.gearMods || []).length >= MOD_SLOTS) { Audio.ui('error'); this.flash('ONLY ' + MOD_SLOTS + ' SLOTS. TAKE ONE OFF FIRST.'); return; }
    if (r.money < M.cost) { Audio.ui('error'); this.flash('NOT ENOUGH FOR THAT'); return; }
    r.money -= M.cost; r.gearMods = (r.gearMods || []).concat([k]);
    Audio.ui('fanfare'); this.flash('FITTED ' + M.name); r.save();
  }
  update(dt) { this.t += dt; this.msgT = Math.max(0, this.msgT - dt); }
  key(code) {
    if (code === 'Escape') { this.back(); return; }
    const cols = 4;
    if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % this.keys.length; Audio.ui('move'); }
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + this.keys.length) % this.keys.length; Audio.ui('move'); }
    if (code === 'ArrowDown' || code === 'KeyS') { this.sel = Math.min(this.keys.length - 1, this.sel + cols); Audio.ui('move'); }
    if (code === 'ArrowUp' || code === 'KeyW') { this.sel = Math.max(0, this.sel - cols); Audio.ui('move'); }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) this.take();
  }
  click(x, y) {
    if (this.backBtn.hit(x, y)) { this.back(); return; }
    if (this.takeBtn.hit(x, y)) { this.take(); return; }
    const rs = this.cardRects();
    for (let i = 0; i < rs.length; i++) { const r = rs[i]; if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { if (this.sel === i) this.take(); else { this.sel = i; Audio.ui('move'); } return; } }
  }
  pointerDown(x, y) { this.click(x, y); }
  hover(x, y) { this.backBtn.hover(x, y); this.takeBtn.hover(x, y); }
  draw(ctx) {
    const r = Game.run, t = this.t;
    vgrad(ctx, 0, 0, W, H, '#241a30', '#120d1c');
    // the shop wall behind the counter
    for (let i = 0; i < 22; i++) { ctx.globalAlpha = 0.07; rect(ctx, i * 46, 0, 22, H, '#ff8ad8'); ctx.globalAlpha = 1; }
    uiRibbon(ctx, W / 2, 16, this.mode === 'skin' ? 'DECALS AND FINISHES' : 'PEDALS AND PARTS', { scale: 3, color: '#7a1a2a' });
    drawText(ctx, 'FOR YOUR ' + (INSTRUMENTS[this.kind] ? INSTRUMENTS[this.kind].name.toUpperCase() : 'INSTRUMENT'), W / 2, 46, '#cfc9e6', { align: 'center', scale: 2 });
    drawText(ctx, fmtMoney(r.money), W - 20, 46, '#ffd24a', { align: 'right', scale: 3 });
    if (this.mode === 'mod') drawText(ctx, 'SLOTS ' + (r.gearMods || []).length + '/' + MOD_SLOTS, 20, 46, '#8ad8ff', { scale: 2 });
    for (const [i, c] of this.cardRects().entries()) {
      const on = i === this.sel;
      const owned = this.mode === 'skin' ? skinOwned(c.k) : modOwned(c.k);
      const D = this.mode === 'skin' ? SKINS[c.k] : GEAR_MODS[c.k];
      const worn = this.mode === 'skin' ? runSkin(this.kind) === c.k : owned;
      rect(ctx, c.x + 3, c.y + 4, c.w, c.h, 'rgba(6,4,12,0.5)');
      rect(ctx, c.x, c.y, c.w, c.h, on ? '#3a3050' : '#241d33');
      frame(ctx, c.x, c.y, c.w, c.h, worn ? '#6be585' : on ? '#ffd24a' : '#4a4068');
      // the swatch
      if (this.mode === 'skin') {
        const sw = c.w - 24;
        rect(ctx, c.x + 12, c.y + 10, sw, 30, D.col || '#6a6478');
        rect(ctx, c.x + 12, c.y + 10, sw, 3, lighten(D.col || '#6a6478', 0.3));
        drawSkinOverlay(ctx, { x: c.x + 12, y: c.y + 10, w: sw, h: 30 }, { key: this.kind, _preview: c.k });
      } else {
        ctx.drawImage(icon(D.icon), c.x + 12, c.y + 12, 26, 24);
      }
      drawText(ctx, D.name, c.x + (this.mode === 'skin' ? 12 : 46), c.y + (this.mode === 'skin' ? 48 : 16), '#fff4d8', { scale: 2 });
      drawWrapped(ctx, D.desc, c.x + 12, c.y + (this.mode === 'skin' ? 68 : 46), c.w - 24, 11, '#b8aed0', { font: 'small' });
      const price = owned ? (worn ? 'WORN' : 'OWNED') : fmtMoney(D.cost);
      drawText(ctx, price, c.x + c.w - 10, c.y + c.h - 16, owned ? '#6be585' : (r.money >= D.cost ? '#ffd24a' : '#e0785a'), { align: 'right', scale: 2 });
    }
    this.takeBtn.label = this.mode === 'skin'
      ? (skinOwned(this.keys[this.sel]) ? 'WEAR IT' : 'BUY IT')
      : (modOwned(this.keys[this.sel]) ? 'TAKE IT OFF' : 'FIT IT');
    this.backBtn.draw(ctx); this.takeBtn.draw(ctx);
    if (this.msgT > 0) { ctx.globalAlpha = clamp(this.msgT, 0, 1); const w2 = textWidth(this.msg, { scale: 2 }) + 28; rect(ctx, W / 2 - w2 / 2, H - 100, w2, 26, '#152a18'); frame(ctx, W / 2 - w2 / 2, H - 100, w2, 26, '#6be585'); drawText(ctx, this.msg, W / 2, H - 92, '#6be585', { align: 'center', scale: 2 }); ctx.globalAlpha = 1; }
  }
}
// ---------- The crane game ----------
// One button. The claw goes across, you stop it, it goes down, and it drops
// whatever it picked up about two thirds of the time, like the real ones.
class CraneScene {
  constructor(node) {
    this.node = node; this.t = 0; this.phase = 'move'; this.cx = 60; this.dir = 1;
    this.dropT = 0; this.prize = null; this.result = null; this.left = false;
    this.rng = makeRng(Date.now() & 0xffff);
    this.prizes = [];
    for (let i = 0; i < 11; i++) this.prizes.push({ x: 90 + (i % 6) * ((W - 220) / 5) + (i > 5 ? (W - 220) / 10 : 0), y: 352 + Math.floor(i / 6) * 24, col: ['#e8503a', '#4a86f7', '#f2c94c', '#6be585', '#c58bff', '#ff8ad8'][i % 6], kind: i % 3 });
    this.cost = 3;
    if (Game.run.money >= this.cost) Game.run.money -= this.cost; else { this.phase = 'broke'; }
  }
  back() { if (this.left) return; this.left = true; Game.go(() => new PlaceScene(this.node), 'fade', { dur: 0.4 }); }
  update(dt) {
    this.t += dt;
    if (this.phase === 'move') { this.cx += this.dir * 170 * dt; if (this.cx > W - 90) { this.cx = W - 90; this.dir = -1; } if (this.cx < 60) { this.cx = 60; this.dir = 1; } }
    else if (this.phase === 'drop') {
      this.dropT += dt;
      if (this.dropT > 1.1 && !this.result) {
        // did anything come up with it
        const near = this.prizes.reduce((best, p) => Math.abs(p.x - this.cx) < Math.abs(best.x - this.cx) ? p : best, this.prizes[0]);
        const close = Math.abs(near.x - this.cx) < 26;
        const win = close && this.rng.chance(0.55);
        this.result = win ? 'win' : 'lose';
        this.prize = win ? near : null;
        if (win) {
          Audio.ui('fanfare');
          const roll = this.rng();
          if (roll < 0.5) { const c = this.rng.int(8, 20); Game.run.money += c; this.prizeText = 'A PLUSH WORTH ' + fmtMoney(c); Game.run.money += 0; }
          else if (roll < 0.8) { Game.run.gratitude = (Game.run.gratitude || 0) + 1; this.prizeText = 'A PLUSH. THE BAND CHEERS. +1 GRATITUDE'; }
          else { const k = SKIN_KEYS[this.rng.int(1, SKIN_KEYS.length - 1)]; Game.run.ownedSkins = (Game.run.ownedSkins || []).concat([k]); this.prizeText = 'A DECAL SHEET: ' + SKINS[k].name; }
          Game.run.save();
        } else Audio.ui('error');
      }
      if (this.dropT > 3.2) this.back();
    }
  }
  key(code) { if (this.phase === 'broke') { this.back(); return; } if (['Enter', 'Space', 'KeyZ'].includes(code) && this.phase === 'move') { this.phase = 'drop'; this.dropT = 0; Audio.ui('select'); } else if (code === 'Escape') this.back(); }
  click() { this.key('Enter'); }
  pointerDown() { this.key('Enter'); }
  draw(ctx) {
    const t = this.t;
    vgrad(ctx, 0, 0, W, H, '#2a1f40', '#140e20');
    // the cabinet
    rect(ctx, 40, 60, W - 80, H - 150, '#1b1630'); frame(ctx, 40, 60, W - 80, H - 150, '#6a5a90');
    rect(ctx, 48, 68, W - 96, H - 166, '#0d0a18');
    for (let i = 0; i < 14; i++) { ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 4 + i); rect(ctx, 44 + i * ((W - 88) / 14), 62, 20, 4, ['#ff5a9a', '#8ad8ff', '#ffd24a'][i % 3]); ctx.globalAlpha = 1; }
    drawText(ctx, 'UFO CATCHER', W / 2, 26, '#ff5a9a', { align: 'center', scale: 4, outline: '#2a0a1a' });
    // the pile of prizes
    for (const p of this.prizes) {
      ellipsePx(ctx, p.x, p.y + 12, 16, 5, 'rgba(0,0,0,0.35)');
      ellipsePx(ctx, p.x, p.y, 15, 13, p.col);
      ellipsePx(ctx, p.x - 9, p.y - 9, 5, 5, p.col); ellipsePx(ctx, p.x + 9, p.y - 9, 5, 5, p.col);
      rect(ctx, p.x - 5, p.y - 3, 3, 3, '#241a2e'); rect(ctx, p.x + 3, p.y - 3, 3, 3, '#241a2e');
      rect(ctx, p.x - 2, p.y + 3, 4, 1, '#241a2e');
    }
    // the chute in the corner, where it lands if it lands at all
    rect(ctx, 56, H - 152, 74, 62, '#0a0810'); frame(ctx, 56, H - 152, 74, 62, '#6a5a90');
    drawText(ctx, 'PRIZE', 93, H - 144, '#8a7ab0', { align: 'center', font: 'small' });
    // the rail and the claw
    rect(ctx, 48, 96, W - 96, 5, '#8a8a9a');
    const drop = this.phase === 'drop' ? Math.min(1, this.dropT / 1.1) : 0;
    const back = this.phase === 'drop' && this.dropT > 1.4 ? Math.min(1, (this.dropT - 1.4) / 0.8) : 0;
    const cy = 101 + easeInOut(drop) * 232 - easeInOut(back) * 232;
    rect(ctx, this.cx - 2, 101, 4, cy - 101, '#6a6a7a');
    rect(ctx, this.cx - 14, cy, 28, 8, '#b9bec6'); rect(ctx, this.cx - 14, cy, 28, 2, '#e0e4ea');
    const open = this.phase !== 'drop' || this.dropT < 1.0 || !this.prize;
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#8f959d'; ctx.beginPath();
      ctx.moveTo(this.cx + s * 12, cy + 8);
      ctx.lineTo(this.cx + s * (open ? 20 : 8), cy + 24);
      ctx.lineTo(this.cx + s * (open ? 14 : 3), cy + 24);
      ctx.lineTo(this.cx + s * 5, cy + 8); ctx.fill();
    }
    if (this.prize && back > 0) { const p = this.prize; ellipsePx(ctx, this.cx, cy + 22, 14, 12, p.col); rect(ctx, this.cx - 5, cy + 19, 3, 3, '#241a2e'); rect(ctx, this.cx + 3, cy + 19, 3, 3, '#241a2e'); }
    if (this.phase === 'broke') { drawText(ctx, 'THREE DOLLARS. YOU DO NOT HAVE THREE DOLLARS.', W / 2, H / 2, '#e0785a', { align: 'center', scale: 2 }); }
    else if (this.phase === 'move') { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); drawText(ctx, Game.touch ? 'TAP TO DROP' : 'ENTER TO DROP', W / 2, H - 72, '#ffd24a', { align: 'center', scale: 3 }); ctx.globalAlpha = 1; }
    else if (this.result) {
      const win = this.result === 'win';
      drawText(ctx, win ? 'GOT ONE' : 'IT SLIPS OUT', W / 2, H - 78, win ? '#6be585' : '#e0785a', { align: 'center', scale: 4, outline: '#12101c' });
      if (win && this.prizeText) drawText(ctx, this.prizeText, W / 2, H - 44, '#ffd24a', { align: 'center', scale: 2 });
    }
  }
}
// ---------- The rhythm machine in the corner ----------
// Eight bars on whatever you play, for money. It is the same engine as a gig,
// with none of the consequences.
class ArcadeRhythmScene {
  constructor(node) {
    this.node = node; this.t = 0; this.phase = 'ready'; this.left = false;
    this.you = Game.run.members[0];
    this.cost = 4;
    this.paid = Game.run.money >= this.cost;
    if (this.paid) Game.run.money -= this.cost;
    this.L = Game.touch ? { rhythmY: 96, rhythmH: 300, padY: 404, padH: 130 } : { rhythmY: 96, rhythmH: 380, padY: 0, padH: 0 };
    this.pads = []; this.padPointers = new Map();
  }
  back() { if (this.left) return; this.left = true; Game.run.save(); Game.go(() => new PlaceScene(this.node), 'fade', { dur: 0.4 }); }
  start() {
    Audio.init(); Audio.setStageReverb(false);
    const tune = TUNES.odeToJoy ? 'odeToJoy' : Object.keys(TUNES)[0];
    const song = songFromTune(tune, { bpm: 124 });
    const instr = gearInstrument(this.you.instrument, this.you.quality || 2);
    const sections = [{ instrument: this.you.instrument, instr, startBar: 0, endBar: Math.min(8, song.bars) }];
    const notes = chartFromMelody(song, sections, 2, makeRng(Date.now() & 0xffff), { starRate: 0.18, bombMult: 0 });
    const mods = collectMods(Game.run, { difficulty: 2, fx: { shake: Game.shake }, windowMult: 1.3 });
    this.rhythm = new RhythmGame(song, sections, notes, mods, {});
    const start = Audio.now() + 0.5 + song.leadIn;
    this.rhythm.begin(start);
    this.backing = new Backing(song, start - song.leadIn, () => ({ drums: true, bass: true, pad: false }));
    this.song = song; this.phase = 'play';
    if (Game.touch) this.pads = buildPads(instr, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, false);
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'play') {
      this.backing.update(); this.rhythm.update(dt);
      if (this.rhythm.finished) {
        this.backing.stop(); this.phase = 'done';
        const res = this.rhythm.results();
        this.acc = res.acc;
        this.pay = Math.round(res.acc * 26);
        Game.run.money += this.pay;
        if (res.acc > 0.9) { Game.run.gratitude = (Game.run.gratitude || 0) + 1; }
        Game.run.save(); Audio.ui('fanfare');
      }
    } else if (this.phase === 'done' && this.t > 0 && this.doneT === undefined) this.doneT = this.t;
  }
  key(code) {
    if (this.phase === 'play') { this.rhythm.keyDown(code); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { if (this.phase === 'ready' && this.paid) this.start(); else this.back(); }
    if (code === 'Escape') this.back();
  }
  keyUp(code) { if (this.phase === 'play') this.rhythm.keyUp(code); }
  padAt(x, y) { return this.pads ? this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) : null; }
  pointerDown(x, y, id) {
    if (this.phase === 'play') {
      if (this.rhythm.instrument.view === 'kit') { kitPointerDown(this, x, y, id); return; }
      const p = this.padAt(x, y); if (p) { this.padPointers.set(id, p.code); this.rhythm.keyDown(p.code); }
      return;
    }
    this.key('Enter');
  }
  pointerMove(x, y, id) { if (this.phase !== 'play') return; if (this.rhythm.instrument.view === 'kit') { kitPointerMove(this, x, y, id); return; } const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { if (this.phase === 'play' && this.rhythm.instrument.view === 'kit') kitPointerUp(this, id); const c = this.padPointers && this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); } }
  click(x, y) { this.pointerDown(x, y, 999); }
  draw(ctx) {
    const t = this.t;
    vgrad(ctx, 0, 0, W, H, '#1b1030', '#0b0718');
    for (let i = 0; i < 18; i++) { ctx.globalAlpha = 0.12 + 0.08 * Math.sin(t * 3 + i); rect(ctx, i * 56, 0, 26, H, ['#ff5a9a', '#8ad8ff', '#ffd24a'][i % 3]); ctx.globalAlpha = 1; }
    drawText(ctx, 'RHYTHM MACHINE', W / 2, 16, '#ff5a9a', { align: 'center', scale: 4, outline: '#2a0a1a' });
    if (this.phase === 'ready') {
      if (!this.paid) { drawText(ctx, 'FOUR DOLLARS A GO. YOU ARE SHORT.', W / 2, H / 2, '#e0785a', { align: 'center', scale: 3 }); drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, H / 2 + 40, '#8a82a8', { align: 'center', scale: 2 }); return; }
      drawText(ctx, 'EIGHT BARS. IT PAYS WHAT YOU EARN.', W / 2, H / 2 - 20, '#cfc9e6', { align: 'center', scale: 3 });
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
      drawText(ctx, Game.touch ? 'TAP TO START' : 'ENTER TO START', W / 2, H / 2 + 30, '#ffd24a', { align: 'center', scale: 3 });
      ctx.globalAlpha = 1; return;
    }
    if (this.phase === 'play') {
      const L = this.L;
      const kit = this.rhythm.instrument.view === 'kit';
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads, overlay: kit,
        kit: kit ? { cx: W / 2, baseY: H - 150, width: W, zoom: 2 } : null });
      drawPadStrip(ctx, L, this.pads, this.rhythm.keysDown);
      return;
    }
    const acc = Math.round((this.acc || 0) * 100);
    drawText(ctx, acc + '%', W / 2, 180, '#fff4d8', { align: 'center', scale: 9, outline: '#2a1a08' });
    drawText(ctx, 'THE MACHINE PAYS ' + fmtMoney(this.pay || 0), W / 2, 280, '#ffd24a', { align: 'center', scale: 3 });
    if (acc > 90) drawText(ctx, 'A SMALL CROWD HAS GATHERED. +1 GRATITUDE', W / 2, 320, '#6be585', { align: 'center', scale: 2 });
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, H - 70, '#cfc9e6', { align: 'center', scale: 2 });
    ctx.globalAlpha = 1;
  }
}
