// ---------- Title + on-stage character select ----------
'use strict';
const ROSTER = [
  { key: 'merc', title: 'THE SHOWMAN', instrument: 'piano', stats: [4, 5, 2], charm: 'tipJar', money: 10, tagline: 'Owns the front of the stage.' },
  { key: 'stag', title: 'THE GUITARIST', instrument: 'guitar', stats: [5, 3, 3], charm: 'luckyPick', money: 6, tagline: 'Built the guitar himself.' },
  { key: 'tank', title: 'THE ENGINE', instrument: 'drums', stats: [3, 3, 5], charm: 'drumsticks', money: 8, tagline: 'Hits everything. Twice.' },
  { key: 'slim', title: 'THE QUIET ONE', instrument: 'bass', stats: [4, 3, 4], charm: 'shield', money: 12, tagline: 'Says nothing. Plays everything.' },
];
const STAT_NAMES = ['RHYTHM', 'CHARM', 'GRIT'];

function drawStageBack(ctx, t, opts = {}) {
  const top = opts.top || 0, bottom = opts.bottom || H, h = bottom - top;
  vgrad(ctx, 0, top, W, h, '#05040f', '#1c1030');
  const floorY = opts.floorY || (bottom - Math.round(h * 0.34));
  rect(ctx, 60, top + 6, W - 120, floorY - top - 46, '#0b0920'); frame(ctx, 60, top + 6, W - 120, floorY - top - 46, '#2a2450');
  for (let i = 0; i < 44; i++) { const bx = 64 + i * 19; ctx.globalAlpha = 0.1 + 0.08 * Math.sin(t * 3 + i * 0.4); rect(ctx, bx, top + 10, 15, floorY - top - 56, i % 2 ? '#3a2a6a' : '#1e1838'); ctx.globalAlpha = 1; }
  const glow = 0.5 + 0.5 * Math.sin(t * 2);
  drawText(ctx, 'MONARCH', W / 2, top + Math.round((floorY - top - 46) / 2) - 16, mixColor('#7a1a4a', '#ff5ab0', glow), { align: 'center', scale: 6, outline: '#20081a' });
  for (let x = 56; x < W - 56; x += 16) ctx.drawImage(propCanvas('truss'), x, top + 2, 16, 14);
  const cols = opts.lights || ['#c58bff', '#5bc0ff', '#ffd24a'];
  for (let i = 0; i < 7; i++) {
    const lx = 90 + i * ((W - 180) / 6), ang = Math.sin(t * (0.6 + i * 0.14) + i) * 0.95, col = cols[i % cols.length];
    ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 3 + i); ctx.fillStyle = col;
    ctx.beginPath(); ctx.moveTo(lx - 5, top + 16); ctx.lineTo(lx + 5, top + 16); ctx.lineTo(lx + Math.sin(ang) * 260 + 60, bottom); ctx.lineTo(lx + Math.sin(ang) * 260 - 60, bottom); ctx.fill(); ctx.globalAlpha = 1;
    ctx.drawImage(propCanvas('light', i), lx - 7, top + 14, 14, 11);
  }
  for (const sx of [14, W - 44]) { ctx.drawImage(propCanvas('speaker'), sx, floorY - 96, 30, 50); ctx.drawImage(propCanvas('speaker'), sx, floorY - 46, 30, 50); }
  rect(ctx, 0, floorY, W, bottom - floorY, '#241d2e'); rect(ctx, 0, floorY, W, 3, '#5f5478');
  for (let x = 0; x < W; x += 54) rect(ctx, x, floorY + 3, 2, bottom - floorY, '#1d1726');
  return floorY;
}
function drawArenaCrowd(ctx, crowd, t, top, bottom, mood, hype = 1) {
  vgrad(ctx, 0, top - 30, W, bottom - top + 30, 'rgba(8,6,20,0)', 'rgba(8,6,20,0.92)');
  for (const c of crowd) {
    const jump = mood === 'angry' ? 0 : Math.sin(t * 5 * hype + c.o) * 3 * hype;
    const y = top + c.row * 9 + Math.round(jump);
    const lit = mood !== 'angry' && c.lighter;
    circle(ctx, c.x, y, 6, c.col); rect(ctx, c.x - 5, y + 4, 11, 18, c.col);
    // arms go up when the crowd is jumping
    if (mood !== 'angry' && jump < -1) { rect(ctx, c.x - 7, y - 4, 2, 8, c.col); rect(ctx, c.x + 5, y - 4, 2, 8, c.col); }
    if (lit && Math.sin(t * 3 + c.o) > 0) {
      const fy = y - 9 - (jump < -1 ? 5 : 0);
      rect(ctx, c.x + 4, fy, 2, 4, '#ffd24a'); px(ctx, c.x + 4, fy - 1, '#fff8c0');
      ctx.globalAlpha = 0.1; circle(ctx, c.x + 5, fy, 7, '#ffd24a'); ctx.globalAlpha = 1;
    }
    if (mood === 'angry' && c.o < 2) rect(ctx, c.x - 3, y - 2, 7, 4, '#2a0a0a');
  }
}
class TitleScene {
  constructor() {
    this.t = 0; this.page = 'main'; this.boot = 1;
    const items = [
      { label: 'NEW GAME', onSelect: () => { RunState.clearSave(); Game.run = null; Game.go(() => new SelectScene(), 'curtain', { dur: 0.55 }); } },
      { label: 'CONTINUE', disabled: !RunState.hasSave(), onSelect: () => { const r = RunState.load(); if (r) { Game.run = r; Game.go(() => r.nightPending ? new NightScene() : new CityScene(), 'iris'); } } },
      { label: 'HOW TO PLAY', onSelect: () => { this.page = 'help'; } },
      { label: Game.muted ? 'SOUND OFF' : 'SOUND ON', onSelect: (it) => { Game.muted = !Game.muted; Audio.setMuted(Game.muted); it.label = Game.muted ? 'SOUND OFF' : 'SOUND ON'; } },
    ];
    if (Game.touch) items.push({ label: 'TURN SCREEN', onSelect: () => { Game.rotateOverride = !Game.rotated; Game.resize(); } });
    this.menu = new Menu(items);
    const r = makeRng(3);
    this.band = ROSTER.concat([{ key: 'duke', instrument: 'sax' }, { key: 'fitz', instrument: 'trumpet' }, { key: 'cici', instrument: 'violin' }, { key: 'roly', instrument: 'tambourine' }, { key: 'elder', instrument: null }, { key: 'glow', instrument: null }, { key: 'pinch', instrument: null }, { key: 'scout', instrument: null }, { key: 'smoke', instrument: null }, { key: 'dot', instrument: 'tambourine' }])
      .map((c, i) => ({ spec: HERO_PRESETS[c.key], x: 60 + i * 118, inst: c.instrument, o: r.range(0, 6) }));
    this.fx = new Particles(); this.motes = new Motes(34, 9);
  }
  update(dt) {
    this.t += dt; this.boot = Math.max(0, this.boot - dt * 0.7); this.fx.update(dt, Game.wind.px); this.motes.update(dt, this.t);
    if (Math.random() < dt * 2.4) this.fx.add({ x: Game.wind.v > 0 ? -6 : W + 6, y: 90 + Math.random() * 220, vx: Game.wind.v * 42 + (Game.wind.v > 0 ? 16 : -16), vy: 10, life: 14, kind: 'leaf', gravity: 3 });
  }
  key(code) { if (this.page === 'help') { if (['Escape', 'Enter', 'Space'].includes(code)) { this.page = 'main'; Audio.ui('back'); } return; } this.menu.key(code); }
  click(x, y) { if (this.page === 'help') { this.page = 'main'; return; } this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawNightCity(ctx, this.t);
    for (const b of this.band) { const x = ((b.x + this.t * 26) % (W + 110)) - 55; const sq = 1 + Math.sin(this.t * 12 + b.o) * 0.04; drawShadow(ctx, x, 452, 26); drawBugAt(ctx, b.spec, x, 452 + Math.round(Math.sin(this.t * 6 + b.o) * 2), { pose: Math.floor(this.t * 6 + b.o) % 2 ? 'walk1' : 'walk2', instrument: b.inst !== 'drums' && b.inst !== 'piano' ? b.inst : null, squash: sq }); }
    this.fx.draw(ctx);
    this.motes.draw(ctx, this.t, '#ffe6a0');
    grade(ctx, 0, 0, W, H, '#3a2a7a', 0.12);
    vignette(ctx, 0.5);
    if (this.page === 'help') { drawHelp(ctx); return; }
    const bob = Math.round(Math.sin(this.t * 2) * 3);
    drawText(ctx, 'BUG BUSKER', W / 2, 38 + bob, '#ffd24a', { align: 'center', scale: 8, outline: '#5a2a10', shadow: '#20100a' });
    drawText(ctx, 'ORCHESTRA', W / 2, 96 + bob, '#ff9f68', { align: 'center', scale: 5, outline: '#5a2a10' });
    const n = this.menu.items.length, inner = uiPanel(ctx, W / 2 - 130, 150, 260, 30 * n + 26);
    this.menu.draw(ctx, inner.x + 16, inner.y + 10, inner.w - 32, 30, 'buttons');
    if (this.boot > 0) { const k = clamp(this.boot / 1, 0, 1); const h = H / 2 * easeInOut(k); vgrad(ctx, 0, 0, W, h, '#6a1020', '#3a0812'); vgrad(ctx, 0, H - h, W, h, '#3a0812', '#6a1020'); rect(ctx, 0, h - 4, W, 4, '#d9a520'); rect(ctx, 0, H - h, W, 4, '#d9a520'); }
  }
}
function drawHelp(ctx) {
  const inner = uiPanel(ctx, 60, 40, W - 120, H - 80, { title: 'HOW TO PLAY' });
  const rows = [
    ['gig', 'PLAY', 'Notes fall down your instrument. Hit them on the line.'],
    ['star', 'STARS', 'Gold notes pay triple.'], ['fire', 'BOMBS', 'Red notes: do not touch.'],
    ['note', 'BAND', 'Tap the closing ring when a bandmate solos.'],
    ['chips', 'SCORE', 'Applause x Mult = cash.'],
    ['phone', 'TRAVEL', 'Every move on the map costs a ride off your train pass.'],
    ['food', 'DINNER', 'Feed every bug at night or they leave.'],
    ['star', 'ABILITIES', 'Draft one new ability after every set.'],
  ];
  let y = inner.y + 14;
  for (const [ic, h, t] of rows) { ctx.drawImage(icon(ic), inner.x + 20, y - 2, 20, 18); drawText(ctx, h, inner.x + 50, y, '#7a4a10', { scale: 2 }); drawText(ctx, t, inner.x + 190, y + 3, UI.ink); y += 26; }
  drawText(ctx, 'D F J K   /   S L   /   SPACE   /   ARROWS        M = MUTE', inner.x + inner.w / 2, inner.y + inner.h - 22, UI.inkFaint, { align: 'center' });
}
// ---------- The opening: house lights down, then the band, then you ----------
// This used to be four bugs standing in a row with a panel beside them. It is
// a sequence now: the room goes black, the lights come up on one member at a
// time with their name thrown across the screen, and only when the whole band
// has been introduced do you get to say which one you are. Then it all goes
// dark again and the show starts.
class SelectScene {
  constructor() {
    this.t = 0; this.sel = 1; this.confirmT = 0; this.confirmed = false; this.fx = new Particles();
    this.rng = makeRng(99); this.crowd = [];
    for (let i = 0; i < 150; i++) this.crowd.push({ x: this.rng.range(-10, W + 10), row: this.rng.int(0, 3), o: this.rng.range(0, 6), lighter: this.rng.chance(0.3), col: this.rng.pick(['#171224', '#1e1830', '#12101c']) });
    this.spot = 1; this.cells = [];
    // ---- the sequence
    this.phase = 'dark'; this.phaseT = 0; this.introIdx = -1; this.lit = [false, false, false, false];
    this.flash = 0; this.smoke = [];
  }
  // How far through the roll call we are. Skipping it drops you straight in.
  skipIntro() { this.phase = 'pick'; this.phaseT = 0; this.lit = [true, true, true, true]; this.introIdx = ROSTER.length; }
  puff(x, y, n) { for (let i = 0; i < n; i++) this.fx.add({ x: x + (Math.random() - 0.5) * 90, y: y + 10, vx: (Math.random() - 0.5) * 70, vy: -18 - Math.random() * 40, life: 1.6 + Math.random(), kind: 'smoke', color: '#6a6482', size: 7, grow: 24, alpha: 0.42, gravity: -6 }); }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.fx.update(dt); this.spot = lerp(this.spot, this.sel, Math.min(1, dt * 8));
    this.flash = Math.max(0, this.flash - dt * 2.6);
    if (this.phase === 'dark') {
      // a black room, a held breath, and somebody testing a light
      if (this.phaseT > 1.9) { this.phase = 'roll'; this.phaseT = 0; this.introIdx = -1; }
    } else if (this.phase === 'roll') {
      // one member every second and a bit: light snaps on, name lands, smoke
      const want = Math.floor(this.phaseT / 1.15);
      if (want !== this.introIdx && want < ROSTER.length) {
        this.introIdx = want; this.lit[want] = true; this.flash = 1;
        Audio.ui('pyro'); Audio.note('eguitar', 40 + want * 5, 0, 0.5, 0.4);
        Game.shake.hit(5, 0.22);
        const x = this.memberX(want);
        this.puff(x, 404, 10);
        for (let i = 0; i < 26; i++) this.fx.add({ x, y: 400, vx: (Math.random() - 0.5) * 240, vy: -Math.random() * 230, life: 0.8, color: ['#ffd24a', '#fff', '#ff5a5a'][i % 3], kind: 'star', size: 3, gravity: 320 });
      }
      if (this.phaseT > ROSTER.length * 1.15 + 0.5) { this.phase = 'pick'; this.phaseT = 0; Audio.roar(1.6, 0.35); }
    } else if (this.phase === 'pick') {
      if (Math.random() < dt * 0.7) this.puff(this.rng.range(60, W - 60), 410, 2);
    } else if (this.phase === 'out') {
      // everything goes dark again, and then the show
      if (this.phaseT > 1.5) { this.phase = 'gone'; Game.go(() => { Game.run = RunState.newRun(ROSTER[this.sel]); Game.run.save(); return new ConcertScene(); }, 'fade', { dur: 0.7 }); }
    }
    if (this.confirmed && this.phase === 'pick') { this.confirmT += dt; if (this.confirmT > 1.4) { this.phase = 'out'; this.phaseT = 0; } }
  }
  memberX(i) { return 150 + i * 220; }
  move(d) {
    if (this.phase !== 'pick' || this.confirmed) return;
    this.sel = (this.sel + d + ROSTER.length) % ROSTER.length; Audio.ui('move');
    this.flash = 0.5; this.puff(this.memberX(this.sel), 404, 4);
    this.fx.burst(this.memberX(this.sel), 400, 10, { color: '#ffd24a', speed: 70, life: 0.4, kind: 'star', size: 2, gravity: 120 });
  }
  confirm() {
    if (this.confirmed || this.phase !== 'pick') return;
    this.confirmed = true; this.confirmT = 0; Audio.ui('fanfare'); Audio.roar(2, 0.4); Game.shake.hit(7, 0.5);
    const x = this.memberX(this.sel);
    this.puff(x, 404, 16);
    for (let i = 0; i < 60; i++) this.fx.add({ x, y: 400, vx: (Math.random() - 0.5) * 320, vy: -Math.random() * 300, life: 1.1, color: ['#ffd24a', '#fff', '#ff5a5a', '#5bc0ff'][i % 4], kind: 'star', size: 3, gravity: 300 });
    for (let i = 0; i < 44; i++) this.fx.add({ x: x + (Math.random() - 0.5) * 60, y: 400, vx: (Math.random() - 0.5) * 60, vy: -260 - Math.random() * 160, life: 0.9, kind: 'fire', size: 5, gravity: 180 });
  }
  key(code) {
    if (this.phase === 'dark' || this.phase === 'roll') { if (['Enter', 'Space', 'KeyZ', 'Escape'].includes(code)) this.skipIntro(); return; }
    if (this.confirmed || this.phase !== 'pick') return;
    if (code === 'ArrowLeft' || code === 'KeyA') this.move(-1); else if (code === 'ArrowRight' || code === 'KeyD') this.move(1);
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) this.confirm();
    else if (code === 'Escape') Game.go(() => new TitleScene(), 'fade');
  }
  click(x, y) {
    if (this.phase === 'dark' || this.phase === 'roll') { this.skipIntro(); return; }
    if (this.confirmed || this.phase !== 'pick') return;
    if (this.arrowL && this.arrowL.hit(x, y)) { this.move(-1); return; }
    if (this.arrowR && this.arrowR.hit(x, y)) { this.move(1); return; }
    for (let i = 0; i < ROSTER.length; i++) { const mx = this.memberX(i); if (Math.abs(x - mx) < 96 && y > 250 && y < 440) { if (this.sel === i) this.confirm(); else { this.sel = i; Audio.ui('move'); this.flash = 0.5; } return; } }
    if (this.readyBtn && this.readyBtn.hit(x, y)) this.confirm();
  }
  hover(x, y) { if (this.phase !== 'pick') return; for (let i = 0; i < ROSTER.length; i++) { const mx = this.memberX(i); if (Math.abs(x - mx) < 96 && y > 250 && y < 440) this.sel = i; } }
  // ---- the stage, drawn the same in every phase; what changes is who is lit
  drawStageAndBand(ctx) {
    const rolling = this.phase === 'roll', picking = this.phase === 'pick' || this.phase === 'out';
    const floorY = drawStageBack(ctx, this.t, { top: 0, bottom: H, floorY: 404, lights: ['#c58bff', '#5bc0ff', '#ffd24a', '#ff5a9a'] });
    // the beam that follows whoever is being shown
    const focus = rolling ? this.introIdx : this.spot;
    if (focus >= 0) {
      const sx = this.memberX(focus);
      ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff4c0';
      ctx.beginPath(); ctx.moveTo(sx - 24, 18); ctx.lineTo(sx + 24, 18); ctx.lineTo(sx + 116, floorY + 10); ctx.lineTo(sx - 116, floorY + 10); ctx.fill(); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.18; ellipsePx(ctx, sx, floorY + 8, 110, 23, '#fff4c0'); ctx.globalAlpha = 1;
    }
    ROSTER.forEach((rr, i) => {
      const x = this.memberX(i), spec2 = HERO_PRESETS[rr.key];
      const shown = this.lit[i];
      const on = picking ? i === this.sel : i === this.introIdx;
      if (!shown) return;                       // not introduced yet: still in the dark
      const step = on ? 16 : 0, bob = Math.round(Math.sin(this.t * 4 + i) * 2);
      const y = floorY + 4 + step;
      // a member arriving gets a moment of being bigger than everybody
      const arrive = rolling && i === this.introIdx ? clamp(1 - (this.phaseT % 1.15) / 0.45, 0, 1) : 0;
      drawShadow(ctx, x, y, on ? 54 : 42, on ? 0.4 : 0.25);
      const sc = (on ? 2.4 : 1.9) + arrive * 0.5;
      if (rr.instrument === 'piano') ctx.drawImage(propCanvas('micstand'), x - 52 * (sc / 2), y - 74, 16, 62);
      const pose = this.confirmed && on ? 'cheer' : on ? (Math.floor(this.t * 4) % 2 ? 'play' : 'play2') : (Math.floor(this.t * 2 + i) % 4 === 0 ? 'idle2' : 'idle');
      const sq = on ? 1 + Math.sin(this.t * 8) * 0.035 : 1;
      drawBugAt(ctx, spec2, x, y + bob, { pose, instrument: rr.instrument !== 'drums' && rr.instrument !== 'piano' ? rr.instrument : null, scale: sc, squash: sq, rate: on ? 3.4 : 2, phase: i * 1.6, bounce: on ? 1.6 : 0.8 });
      if (rr.instrument === 'drums') ctx.drawImage(propInstrument('drums'), x - 52 * (sc / 2), y - 58, 104 * (sc / 2.4), 78 * (sc / 2.4));
      if (rr.instrument === 'piano') ctx.drawImage(propInstrument('piano'), x - 50 * (sc / 2), y - 42, 100 * (sc / 2.4), 53 * (sc / 2.4));
      if (on && picking && !this.confirmed) { for (let k = 0; k < 2; k++) if (Math.random() < 0.12) this.fx.add({ x: x + (Math.random() - 0.5) * 70, y: y - 90, vx: (Math.random() - 0.5) * 24, vy: -26, life: 1.1, color: '#ffd24a', kind: 'star', size: 2, gravity: -8 }); }
    });
    drawArenaCrowd(ctx, this.crowd, this.t, H - 82, H, 'happy');
    return floorY;
  }
  // The name, thrown across the screen the way a fighting game does it.
  drawNameCard(ctx, i, k) {
    const rr = ROSTER[i], spec2 = HERO_PRESETS[rr.key];
    const slide = easeOutBack(clamp(k * 2.4, 0, 1));
    const out = clamp((k - 0.72) / 0.28, 0, 1);
    const y = 150, name = spec2.name.toUpperCase();
    ctx.save();
    ctx.globalAlpha = 1 - out;
    // the slash of colour behind it
    const bw = Math.round(W * slide), bx = Math.round(-W * (1 - slide) * 0.4);
    ctx.save(); ctx.translate(0, y); ctx.rotate(-0.045); ctx.translate(0, -y);
    rect(ctx, bx, y - 6, bw, 56, '#12101c');
    rect(ctx, bx, y, bw, 44, ['#c8433a', '#d9a520', '#3f6fb0', '#8a5fb0'][i % 4]);
    rect(ctx, bx, y, bw, 4, '#fff8e0');
    rect(ctx, bx, y + 40, bw, 3, 'rgba(0,0,0,0.35)');
    // speed lines through the slash
    for (let l = 0; l < 14; l++) { const lx = bx + ((l * 97 + this.t * 300) % Math.max(1, bw)); ctx.globalAlpha = (1 - out) * 0.16; rect(ctx, lx, y + 4, 40, 36, '#ffffff'); ctx.globalAlpha = 1 - out; }
    const tx = Math.round(W / 2 + (1 - slide) * 260);
    drawText(ctx, name, tx, y + 8, '#fff8e0', { align: 'center', scale: 5, outline: '#2a1408' });
    ctx.restore();
    // the subtitle plate under it
    const sub = rr.title + '   -   ' + INSTRUMENTS[rr.instrument].name.toUpperCase();
    const sw = textWidth(sub, { scale: 2 }) + 24;
    ctx.globalAlpha = (1 - out) * clamp((k - 0.18) * 5, 0, 1);
    rect(ctx, Math.round(W / 2 - sw / 2), y + 58, sw, 26, '#12101c');
    frame(ctx, Math.round(W / 2 - sw / 2), y + 58, sw, 26, '#6a5f9a');
    drawText(ctx, sub, W / 2, y + 66, '#ffd24a', { align: 'center', scale: 2 });
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  draw(ctx) {
    const c = ROSTER[this.sel], spec = HERO_PRESETS[c.key];
    // ---- the room before anybody is on it
    if (this.phase === 'dark') {
      rect(ctx, 0, 0, W, H, '#07060c');
      drawArenaCrowd(ctx, this.crowd, this.t, H - 82, H, 'idle');
      ctx.globalAlpha = 0.5; rect(ctx, 0, 0, W, H, '#07060c'); ctx.globalAlpha = 1;
      // a few lighters out there in the dark
      for (let i = 0; i < 26; i++) { const cc = this.crowd[i * 5 % this.crowd.length];
        if (!cc.lighter) continue; ctx.globalAlpha = 0.35 + 0.3 * Math.sin(this.t * 3 + cc.o);
        rect(ctx, Math.round(cc.x), H - 66 - cc.row * 9, 2, 3, '#ffd88a'); ctx.globalAlpha = 1; }
      // somebody testing a light up in the rig
      if (this.phaseT > 0.9 && this.phaseT < 1.1) { ctx.globalAlpha = 0.5; rect(ctx, 0, 0, W, H, '#5bc0ff'); ctx.globalAlpha = 1; }
      const k = clamp((this.phaseT - 0.3) / 0.6, 0, 1);
      ctx.globalAlpha = k * clamp(2 - this.phaseT, 0, 1);
      drawText(ctx, 'TOKYO DOME', W / 2, 220, '#8a80b0', { align: 'center', scale: 4 });
      drawText(ctx, 'FIVE YEARS AGO', W / 2, 262, '#5a5478', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
      letterbox(ctx, 46, 1);
      if (this.phaseT > 1.2) drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', W - 16, H - 30, '#3a3550', { align: 'right', font: 'small' });
      return;
    }
    this.drawStageAndBand(ctx);
    this.fx.draw(ctx);
    // the snap of a light coming on
    if (this.flash > 0) { ctx.globalAlpha = this.flash * 0.5; rect(ctx, 0, 0, W, H, '#fff8e0'); ctx.globalAlpha = 1; }
    if (this.phase === 'roll') {
      letterbox(ctx, 46, 1);
      if (this.introIdx >= 0 && this.introIdx < ROSTER.length) {
        const k = clamp((this.phaseT % 1.15) / 1.15, 0, 1);
        this.drawNameCard(ctx, this.introIdx, k);
      }
      drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', W - 16, H - 30, '#6a6488', { align: 'right', font: 'small' });
      return;
    }
    if (this.phase === 'out') {
      // the blackout before the show
      const k = clamp(this.phaseT / 1.1, 0, 1);
      ctx.globalAlpha = easeIn(k); rect(ctx, 0, 0, W, H, '#07060c'); ctx.globalAlpha = 1;
      if (this.phaseT > 0.7) { ctx.globalAlpha = clamp((this.phaseT - 0.7) * 2, 0, 1);
        drawText(ctx, spec.name.toUpperCase(), W / 2, 240, '#ffd24a', { align: 'center', scale: 4, outline: '#2a1408' }); ctx.globalAlpha = 1; }
      return;
    }
    // ---- picking. Name plates under everybody, big arrows either side.
    ROSTER.forEach((rr, i) => {
      const x = this.memberX(i), on = i === this.sel, spec2 = HERO_PRESETS[rr.key];
      const y = 408 + (on ? 16 : 0);
      const nw = textWidth(spec2.name, { scale: on ? 2 : 1 }) + 20;
      rect(ctx, x - nw / 2, y + 16, nw, on ? 22 : 15, on ? '#d9a520' : 'rgba(10,8,20,0.78)'); frame(ctx, x - nw / 2, y + 16, nw, on ? 22 : 15, on ? '#fff4d0' : '#4a4268');
      drawText(ctx, spec2.name, x, y + (on ? 23 : 20), on ? '#2a1a08' : '#cfc9e6', { align: 'center', scale: on ? 2 : 1 });
    });
    uiRibbon(ctx, W / 2, 10, 'WHO ARE YOU TONIGHT?', { scale: 3, color: '#c8433a' });
    const p = uiPanel(ctx, 24, 62, 268, 150);
    drawText(ctx, spec.name, p.x + 10, p.y + 6, '#7a4a10', { scale: 3 });
    drawText(ctx, c.title, p.x + 10, p.y + 32, UI.ink);
    drawText(ctx, spec.species.toUpperCase(), p.x + 10, p.y + 44, UI.inkSoft, { font: 'small' });
    for (let i = 0; i < 3; i++) {
      drawText(ctx, STAT_NAMES[i], p.x + 10, p.y + 62 + i * 16, UI.inkSoft, { font: 'small' });
      for (let k = 0; k < 5; k++) { const on = k < c.stats[i]; rect(ctx, p.x + 74 + k * 18, p.y + 60 + i * 16, 15, 10, on ? ['#c8433a', '#d9a520', '#4f8032'][i] : '#c8bfa8'); frame(ctx, p.x + 74 + k * 18, p.y + 60 + i * 16, 15, 10, '#6b5138'); if (on) rect(ctx, p.x + 75 + k * 18, p.y + 61 + i * 16, 13, 3, '#fff8e0'); }
    }
    drawText(ctx, '"' + c.tagline + '"', p.x + 10, p.y + 116, UI.inkSoft, { font: 'small' });
    const p2 = uiPanel(ctx, W - 292, 62, 268, 96);
    const ins = INSTRUMENTS[c.instrument], ch = CHARMS[c.charm];
    ctx.drawImage(icon('note'), p2.x + 10, p2.y + 8, 16, 14); drawText(ctx, ins.name.toUpperCase(), p2.x + 34, p2.y + 8, '#7a4a10');
    drawText(ctx, ins.keyNames.join('  '), p2.x + 34, p2.y + 22, UI.inkSoft, { font: 'small' });
    uiSlot(ctx, p2.x + 10, p2.y + 38, 30); ctx.drawImage(icon(ch.icon), p2.x + 18, p2.y + 46, 14, 13);
    drawText(ctx, ch.name.toUpperCase(), p2.x + 48, p2.y + 40, '#7a4a10', { font: 'small' });
    drawWrapped(ctx, ch.desc, p2.x + 48, p2.y + 50, 26, UI.ink, 9, { font: 'small' });
    ctx.drawImage(icon('coin'), p2.x + 214, p2.y + 40, 13, 12); drawText(ctx, fmtMoney(c.money), p2.x + 232, p2.y + 42, '#2a7a3a');
    // big arrows, because this is a character select and they should be obvious
    const ay = 300, aw = 54, ah = 76;
    this.arrowL = new Btn(18, ay, aw, ah, '', () => this.move(-1), { tight: true });
    this.arrowR = new Btn(W - 18 - aw, ay, aw, ah, '', () => this.move(1), { tight: true });
    for (const [bt, dir] of [[this.arrowL, -1], [this.arrowR, 1]]) {
      const pulse = 0.55 + 0.45 * Math.sin(this.t * 4 + (dir > 0 ? 1.6 : 0));
      rect(ctx, bt.x + 3, bt.y + 4, aw, ah, 'rgba(6,4,12,0.45)');
      rect(ctx, bt.x, bt.y, aw, ah, '#241d3e'); frame(ctx, bt.x, bt.y, aw, ah, '#6a5f9a');
      ctx.globalAlpha = 0.25 + pulse * 0.4;
      for (let i = 0; i < 22; i++) { const hw = Math.round(i * 0.8); rect(ctx, bt.x + aw / 2 + dir * (11 - i), bt.y + ah / 2 - hw, 2, hw * 2 + 1, '#ffd24a'); }
      ctx.globalAlpha = 1;
    }
    this.readyBtn = new Btn(W / 2 - 130, H - 58, 260, 40, this.confirmed ? 'READY!' : 'TAKE THE STAGE', () => this.confirm(),
      { color: this.confirmed ? UI.gold : UI.green, hi: this.confirmed ? UI.goldHi : UI.greenHi, lo: this.confirmed ? UI.goldLo : UI.greenLo, ol: '#20180a' });
    this.readyBtn.draw(ctx);
    drawText(ctx, Game.touch ? 'TAP AN ARROW OR A BUG' : 'LEFT / RIGHT     ENTER', W / 2, H - 12, '#8a86b0', { align: 'center', font: 'small' });
    if (this.confirmed) {
      const k = clamp(this.confirmT / 0.4, 0, 1), sc = lerp(12, 6, easeOutBack(k));
      ctx.globalAlpha = clamp(2.2 - this.confirmT * 1.4, 0, 1);
      drawText(ctx, 'LET\'S GO', W / 2, 200, '#fff', { align: 'center', scale: Math.max(3, Math.round(sc)), outline: '#c8433a' });
      ctx.globalAlpha = 1;
    }
  }
}
