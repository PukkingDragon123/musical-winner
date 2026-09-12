// ---------- Performance scene: prep -> play -> results ----------
'use strict';
const STAGE_Y = 168, GROUND_Y = 256;

// Static venue backgrounds (drawn once to an offscreen canvas)
function buildBackground(venueKey, rng) {
  const v = VENUES[venueKey]; const c = document.createElement('canvas'); c.width = W; c.height = H - STAGE_Y; const ctx = c.getContext('2d');
  const h = c.height, gy = GROUND_Y - STAGE_Y;
  const r = makeRng(rng.int(1, 99999));
  switch (v.bg) {
    case 'subway': {
      rect(ctx, 0, 0, W, h, '#2a2a34');
      for (let x = 0; x < W; x += 8) for (let y = 0; y < gy - 20; y += 6) rect(ctx, x, y, 7, 5, (x / 8 + y / 6) % 2 ? '#c8c0a8' : '#b8b09a');
      rect(ctx, 0, 24, W, 8, '#2a4a9a'); drawText(ctx, 'MISSION ST      MISSION ST      MISSION ST', 8, 25, '#fff');
      for (let x = 30; x < W; x += 120) { rect(ctx, x, 0, 12, gy, '#7a7a8a'); rect(ctx, x + 2, 0, 3, gy, '#9a9aaa'); }
      rect(ctx, 0, gy - 20, W, 20, '#3a3a44'); rect(ctx, 0, gy - 20, W, 1, '#ffe040');
      rect(ctx, 0, gy, W, h - gy, '#4a4a54'); for (let x = 0; x < W; x += 16) rect(ctx, x, gy, 1, h - gy, '#3a3a44');
      ctx.drawImage(propSprite('bench'), 300, gy - 6); ctx.drawImage(propSprite('trash'), 400, gy - 6); ctx.drawImage(propSprite('sign'), 200, gy - 30);
      break;
    }
    case 'park': {
      const grad = ctx.createLinearGradient(0, 0, 0, gy); grad.addColorStop(0, '#7ab8e8'); grad.addColorStop(1, '#d8e8f0'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, gy);
      circle(ctx, 400, 18, 10, '#fff8c0');
      for (let i = 0; i < 6; i++) { const x = r.int(0, W), y = r.int(6, 30); rect(ctx, x, y, 16, 4, '#fff'); rect(ctx, x + 4, y - 3, 8, 3, '#fff'); }
      // skyline far
      for (let x = 0; x < W; x += 14) { const bh = r.int(8, 26); rect(ctx, x, gy - 30 - bh, 12, bh, '#98a8c8'); }
      rect(ctx, 0, gy - 30, W, 30, '#5aa050'); rect(ctx, 0, gy - 30, W, 1, '#7ac060');
      for (let i = 0; i < 6; i++) ctx.drawImage(propSprite('tree'), 10 + i * 85 + r.int(0, 20), gy - 40);
      rect(ctx, 0, gy, W, h - gy, '#8a8a70'); for (let x = 0; x < W; x += 20) rect(ctx, x, gy, 1, h - gy, '#7a7a60');
      ctx.drawImage(propSprite('bench'), 360, gy - 6); ctx.drawImage(propSprite('pigeon'), 420, gy - 4);
      break;
    }
    case 'chinatown': {
      rect(ctx, 0, 0, W, gy, '#3a1a2a');
      for (let x = 0; x < W; x += 60) { rect(ctx, x, 0, 56, gy, x % 120 ? '#8a2a2a' : '#6a2a3a'); for (let y = 8; y < gy - 24; y += 20) for (let wx = 6; wx < 50; wx += 14) rect(ctx, x + wx, y, 8, 10, r.chance(0.6) ? '#ffd070' : '#302030'); rect(ctx, x, 0, 56, 4, '#d0a030'); }
      for (let x = 20; x < W; x += 45) ctx.drawImage(propSprite('lantern'), x, 10 + (x % 90 ? 0 : 6));
      rect(ctx, 0, 6, W, 1, '#552'); rect(ctx, 0, gy - 24, W, 24, '#4a2a2a'); rect(ctx, 0, gy - 24, W, 2, '#d0a030');
      rect(ctx, 0, gy, W, h - gy, '#5a5050'); for (let x = 0; x < W; x += 12) rect(ctx, x, gy, 1, h - gy, '#4a4040');
      ctx.drawImage(propSprite('trash'), 440, gy - 6);
      break;
    }
    case 'pier': {
      const grad = ctx.createLinearGradient(0, 0, 0, gy); grad.addColorStop(0, '#f0a060'); grad.addColorStop(0.5, '#e0c0a0'); grad.addColorStop(1, '#6aa0c0'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, gy);
      circle(ctx, 80, 22, 9, '#fff0b0');
      // alcatraz / bridge silhouette
      rect(ctx, 200, 34, 60, 6, '#6a7a8a'); rect(ctx, 220, 28, 10, 8, '#6a7a8a');
      rect(ctx, 0, 40, W, gy - 60, '#3a6a9a'); for (let y = 42; y < gy - 20; y += 5) for (let x = (y * 7) % 20; x < W; x += 20) rect(ctx, x, y, 8, 1, '#5a8ab8');
      rect(ctx, 320, 44, 24, 10, '#f0f0f0'); rect(ctx, 316, 54, 32, 4, '#c04040'); // boat
      rect(ctx, 0, gy - 20, W, 20, '#8a6a4a'); for (let x = 0; x < W; x += 10) rect(ctx, x, gy - 20, 1, 20, '#6a4a2a');
      for (let x = 0; x < W; x += 36) { rect(ctx, x, gy - 36, 3, 16, '#5a3a1a'); }
      rect(ctx, 0, gy - 22, W, 2, '#5a3a1a');
      rect(ctx, 0, gy, W, h - gy, '#7a5a3a'); for (let x = 0; x < W; x += 10) rect(ctx, x, gy, 1, h - gy, '#5a3a1a');
      ctx.drawImage(propSprite('seal'), 420, gy - 26); ctx.drawImage(propSprite('lamp'), 250, gy - 32);
      break;
    }
    case 'bridge': {
      const grad = ctx.createLinearGradient(0, 0, 0, gy); grad.addColorStop(0, '#2a1a4a'); grad.addColorStop(0.6, '#c05060'); grad.addColorStop(1, '#f0a060'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, gy);
      circle(ctx, 240, 50, 14, '#ffd080');
      rect(ctx, 0, 56, W, gy - 76, '#4a4a8a');
      // bridge
      rect(ctx, 0, 60, W, 4, '#c03a2a');
      for (let x = 90; x < W; x += 200) { rect(ctx, x, 6, 8, 60, '#c03a2a'); rect(ctx, x + 14, 6, 8, 60, '#c03a2a'); rect(ctx, x - 2, 4, 26, 3, '#c03a2a'); rect(ctx, x - 2, 30, 26, 3, '#c03a2a'); }
      for (let x = 0; x < W; x++) { const cc = Math.abs(((x + 110) % 200) - 100) / 100; const y = 8 + Math.round(cc * cc * 50); rect(ctx, x, y, 1, 1, '#e05040'); if (x % 10 === 0) rect(ctx, x, y, 1, 60 - y, '#a03020'); }
      // fog
      for (let i = 0; i < 12; i++) { ctx.globalAlpha = 0.4; rect(ctx, r.int(-20, W), 40 + r.int(0, 30), r.int(30, 90), 6, '#e0e0f0'); } ctx.globalAlpha = 1;
      rect(ctx, 0, gy - 20, W, 20, '#5a5a6a'); rect(ctx, 0, gy - 20, W, 2, '#c03a2a');
      rect(ctx, 0, gy, W, h - gy, '#6a6a74'); for (let x = 0; x < W; x += 14) rect(ctx, x, gy, 1, h - gy, '#5a5a64');
      ctx.drawImage(propSprite('lamp'), 14, gy - 32); ctx.drawImage(propSprite('lamp'), 400, gy - 32);
      break;
    }
    default: { // street
      const grad = ctx.createLinearGradient(0, 0, 0, gy); grad.addColorStop(0, v.tall ? '#5a6a9a' : '#f0b070'); grad.addColorStop(1, '#e0d0c0'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, gy);
      const cols = v.colorful ? ['#d05070', '#50a0d0', '#e0b040', '#60b060', '#a060c0'] : v.tall ? ['#4a5a7a', '#5a6a8a', '#3a4a6a'] : ['#c8b8a8', '#b0a090', '#d8c8b8', '#a8b8c8'];
      let x = 0;
      while (x < W) {
        const bw = r.int(40, 70), bh = v.tall ? r.int(60, gy - 30) : r.int(30, 58);
        const col = r.pick(cols);
        rect(ctx, x, gy - 24 - bh, bw, bh, col); rect(ctx, x, gy - 24 - bh, bw, 3, shade(col, -30));
        for (let wy = gy - 24 - bh + 8; wy < gy - 30; wy += 12) for (let wx = x + 5; wx < x + bw - 6; wx += 10) rect(ctx, wx, wy, 5, 7, r.chance(0.5) ? '#fff0c0' : '#403050');
        if (!v.tall && r.chance(0.5)) { rect(ctx, x + 4, gy - 24 - bh - 6, bw - 8, 6, shade(col, -20)); } // bay window / cornice
        rect(ctx, x, gy - 34, bw, 10, shade(col, -50)); // storefront
        x += bw + 2;
      }
      rect(ctx, 0, gy - 24, W, 24, '#9a9a9a'); rect(ctx, 0, gy - 24, W, 1, '#c0c0c0'); // sidewalk back
      rect(ctx, 0, gy, W, h - gy, '#a8a8a0'); for (let x = 0; x < W; x += 24) rect(ctx, x, gy, 1, h - gy, '#909088');
      ctx.drawImage(propSprite('lamp'), 14, gy - 32); ctx.drawImage(propSprite('hydrant'), 300, gy - 6); ctx.drawImage(propSprite('trash'), 440, gy - 6);
      if (v.hills) { rect(ctx, 0, gy - 24, W, 1, '#8a6a4a'); rect(ctx, 0, gy - 22, W, 1, '#8a6a4a'); }
      break;
    }
  }
  return c;
}

class PerformScene {
  constructor(node) {
    const r = Game.run; this.node = node; this.venue = VENUES[node.venue] || VENUES.corner;
    this.mode = node.type; this.t = 0; this.phase = 'prep'; this.paused = false;
    this.bg = buildBackground(node.venue || 'corner', r.rng);
    this.difficulty = clamp(Math.round(1 + r.day * 0.9 + (this.mode === 'elite' ? 1 : 0) + (this.mode === 'boss' ? 1.5 : 0) - (this.mode === 'openmic' ? 0.5 : 0)), 1, 6);
    this.bars = this.mode === 'boss' ? 20 : this.mode === 'elite' ? 16 : this.mode === 'openmic' ? 8 : 12;
    this.bpm = r.rng.int(this.venue.bpm[0], this.venue.bpm[1]) + r.day * 2;
    this.song = makeSong(r.rng, this.bpm, this.bars);
    this.active = r.members.map(m => m.stamina >= 15 || m.leader);
    this.useCoffee = false; this.useFlyer = false;
    this.buildPrepMenu();
    this.train = { x: -600, t: r.rng.range(3, 8) };
    this.layout();
    this.pads = []; this.padPointers = new Map(); this.buttons = [];
  }
  // Touch play squeezes the street scene and hands the bottom strip to the pads.
  layout() {
    const touch = Game.touch;
    // On touch the street scene moves to a strip up top so the pads can sit
    // directly under the note receptor, where your thumbs already are.
    this.L = touch
      ? { top: true, stageY: 0, groundY: 56, stageBottom: 62, rhythmY: 64, rhythmH: 148, padY: 214, padH: 54 }
      : { top: false, stageY: STAGE_Y, groundY: GROUND_Y, stageBottom: H, rhythmY: 0, rhythmH: STAGE_Y, padY: 0, padH: 0 };
  }
  buildPrepMenu() {
    const r = Game.run; const items = [];
    r.members.forEach((m, i) => items.push({ label: (this.active[i] ? '[x] ' : '[ ] ') + m.name + ' - ' + INSTRUMENTS[m.instrument].name + ' (' + INSTRUMENTS[m.instrument].keyNames.join(' ') + ')', right: 'STA ' + Math.round(m.stamina), rightColor: m.stamina < 30 ? '#ff5a5a' : '#6be585', disabled: m.leader, onSelect: () => { if (m.stamina < 15) { Audio.ui('error'); return; } this.active[i] = !this.active[i]; this.buildPrepMenu(); this.menu.idx = i; } }));
    if (r.consumables.includes('coffee')) items.push({ label: (this.useCoffee ? '[x] ' : '[ ] ') + 'Drink Espresso (+30% timing windows)', icon: 'coffee', onSelect: () => { this.useCoffee = !this.useCoffee; this.buildPrepMenu(); this.menu.idx = items.length - 1; } });
    if (r.consumables.includes('flyer')) items.push({ label: (this.useFlyer ? '[x] ' : '[ ] ') + 'Hand out Gig Flyers (2x passers-by)', icon: 'flyer', onSelect: () => { this.useFlyer = !this.useFlyer; this.buildPrepMenu(); } });
    items.push({ label: 'START THE SHOW', onSelect: () => this.startPlay() });
    const keep = this.menu ? this.menu.idx : items.length - 1;
    this.menu = new Menu(items); this.menu.idx = Math.min(keep, items.length - 1);
  }
  startPlay() {
    const r = Game.run; Audio.init();
    this.performers = r.members.filter((m, i) => this.active[i]);
    if (!this.performers.length) this.performers = [r.members[0]];
    if (this.useCoffee) { r.consumables.splice(r.consumables.indexOf('coffee'), 1); r.buffs.coffee = true; }
    if (this.useFlyer) { r.consumables.splice(r.consumables.indexOf('flyer'), 1); r.buffs.flyer = true; }
    // sections of 4 bars rotating through performers
    const sections = [];
    for (let b = 0, i = 0; b < this.bars; b += 4, i++) { const m = this.performers[i % this.performers.length]; sections.push({ instrument: m.instrument, startBar: b, endBar: Math.min(this.bars, b + 4), member: m }); }
    this.sections = sections;
    const notes = generateChart(this.song, sections, this.difficulty, r.rng);
    this.mods = r.gigMods(this.performers, this.difficulty);
    // backing bonus from non-active members' skill
    const others = r.members.filter(m => !this.performers.includes(m));
    this.mods.tips *= 1 + others.reduce((a, m) => a + m.skill, 0) * 0.03 + this.performers.reduce((a, m) => a + m.skill, 0) * 0.015;
    this.rhythm = new RhythmGame(this.song, sections, notes, this.mods);
    this.crowd = new Crowd(this.venue, this.mods, r.rng);
    this.crowd.stageX = 70 + this.performers.length * 13; this.crowd.hatX = 58 + this.performers.length * 26; this.crowd.hatY = this.L.groundY - 4; this.crowd.groundY = this.L.groundY;
    const start = Audio.now() + 0.6 + this.song.leadIn;
    this.rhythm.begin(start);
    this.backing = new Backing(this.song, start - this.song.leadIn, (t) => { const sec = sections.find(s => t - start >= s.start - this.song.leadIn - 0.001 && t - start < s.end - this.song.leadIn); return sec ? { drums: sec.instrument === 'drums', bass: sec.instrument === 'bass' } : {}; });
    this.phase = 'play'; this.playT = 0;
    this.padInstr = sections[0].instrument;
    this.pads = buildPads(INSTRUMENTS[this.padInstr], { x: 2, y: this.L.padY, w: W - 4, h: this.L.padH });
    this.pauseBtn = new Btn(2, 2, 22, 14, 'II', () => this.togglePause(), { bg: '#1a1728' });
    this.buttons = [
      new Btn(W / 2 - 92, 88, 84, 26, 'RESUME', () => this.togglePause(), { scale: 2, activeBg: '#6be585' }),
      new Btn(W / 2 + 8, 88, 84, 26, 'BAIL OUT', () => this.quit(), { scale: 1, bg: '#3a1a24', border: '#ff5a5a', sub: 'HALF THE TIPS' }),
    ];
  }
  update(dt) {
    this.t += dt;
    if (this.phase === 'play') {
      if (this.paused) return;
      this.backing.update();
      this.rhythm.update(dt);
      if (Game.touch && this.padInstr !== this.rhythm.section.instrument) {
        this.padInstr = this.rhythm.section.instrument;
        this.pads = buildPads(this.rhythm.instrument, { x: 2, y: this.L.padY, w: W - 4, h: this.L.padH });
      }
      this.crowd.update(dt, this.rhythm.hype, this.rhythm.events);
      this.train.t -= dt; if (this.train.t < 0 && this.venue.bg === 'subway') { this.train.x += dt * 260; if (this.train.x > W + 300) { this.train.x = -600; this.train.t = 6 + Math.random() * 8; } }
      if (this.rhythm.finished) this.finish();
    }
  }
  finish() {
    const r = Game.run; const res = this.rhythm.results(); this.res = res;
    let earned = Math.round(this.crowd.earned * 4) / 4;
    this.bonusLines = [];
    if (this.mode === 'boss') { const b = Math.round(60 * res.acc); earned += b; this.bonusLines.push('Festival fee: +' + fmtMoney(b)); }
    if (this.mode === 'elite') { const b = Math.round(20 * res.acc); earned += b; this.bonusLines.push('Venue bonus: +' + fmtMoney(b)); }
    if (r.pendingGig && r.pendingGig.battle) { if (res.acc >= 0.8) { earned += 30; this.bonusLines.push('BUSKER BATTLE WON: +$30!'); Audio.ui('fanfare'); } else this.bonusLines.push('Busker battle lost (needed 80% accuracy).'); }
    if (r.pendingGig && r.pendingGig.bonus) this.bonusLines.push('Tourist fans boosted your tips.');
    r.pendingGig = null; r.buffs = {};
    this.earned = earned; r.money += earned; r.stats.earned += earned; r.stats.gigs++; r.stats.bestCombo = Math.max(r.stats.bestCombo, res.maxCombo); r.stats.perfects += res.perfect; r.stats.tips += this.crowd.tipCount;
    // stamina & xp
    const stCost = 22 * (r.hasRelic('strings') ? 0.7 : 1);
    this.xpLines = [];
    for (const m of this.performers) {
      m.stamina = Math.max(0, m.stamina - stCost * (m.hunger ? 1.4 : 1)); m.gigs++;
      let xp = (0.5 + res.acc * 1.5) * (r.hasRelic('medal') ? 2 : 1); m.xp += xp;
      let ups = 0; while (m.xp >= 3 && m.skill < 10) { m.xp -= 3; m.skill++; ups++; }
      this.xpLines.push(m.name + ': +' + xp.toFixed(1) + ' xp' + (ups ? '  SKILL UP! (' + m.skill + ')' : ''));
      if (ups) Audio.ui('levelup');
    }
    this.grade = res.acc >= 0.95 ? 'S' : res.acc >= 0.85 ? 'A' : res.acc >= 0.7 ? 'B' : res.acc >= 0.5 ? 'C' : 'D';
    // open mic recruit
    this.recruit = null;
    if (this.mode === 'openmic' && res.acc >= 0.6 && r.members.length < 6) this.recruit = r.makeMember();
    this.phase = 'results';
    const items = [];
    if (this.recruit) {
      items.push({ label: 'Welcome ' + this.recruit.name + ' the ' + SPECIES[this.recruit.species].name + ' (' + INSTRUMENTS[this.recruit.instrument].name + ', skill ' + this.recruit.skill + ') to the band!', icon: 'openmic', onSelect: () => { r.members.push(this.recruit); Audio.ui('fanfare'); Game.afterNode(); } });
      items.push({ label: 'Politely decline. One more mouth is one more meal.', onSelect: () => Game.afterNode() });
    } else items.push({ label: 'Continue', onSelect: () => Game.afterNode() });
    this.menu = new Menu(items);
    if (res.acc >= 0.7) Audio.applause(clamp(res.acc, 0.3, 1), 1.5);
    r.save();
  }
  key(code) {
    if (this.phase === 'prep') { if (code === 'Escape') { /* cannot back out of a gig */ } this.menu.key(code); return; }
    if (this.phase === 'results') { this.menu.key(code); return; }
    if (code === 'Escape') { this.togglePause(); return; }
    if (this.paused) { if (code === 'KeyQ') { this.quit(); } return; }
    this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play' && !this.paused) this.rhythm.keyUp(code); }
  togglePause() { this.paused = !this.paused; if (Audio.ctx) { if (this.paused) Audio.ctx.suspend(); else Audio.ctx.resume(); } this.rhythm.keysDown.clear(); }
  quit() { if (Audio.ctx) Audio.ctx.resume(); this.backing.stop(); this.rhythm.finished = true; this.paused = false; this.crowd.earned *= 0.5; this.finish(); this.bonusLines.push('You bailed on the set. Half the tips walked off.'); }
  click(x, y) { if (this.phase !== 'play') this.menu.click(x, y); }
  hover(x, y) { if (this.phase !== 'play') this.menu.hover(x, y); }
  padAt(x, y) { return this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h); }
  pointerDown(x, y, id) {
    if (this.phase !== 'play') { this.menu.click(x, y); return; }
    if (this.paused) { for (const b of this.buttons) if (b.hit(x, y)) { b.flash = 0.5; b.onTap(); return; } return; }
    if (this.pauseBtn && this.pauseBtn.hit(x, y)) { this.pauseBtn.onTap(); return; }
    const pad = this.padAt(x, y);
    if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); }
  }
  pointerMove(x, y, id) {
    if (this.phase !== 'play' || this.paused) return;
    const prev = this.padPointers.get(id);
    if (prev === undefined) return;
    const pad = this.padAt(x, y);
    const next = pad ? pad.code : null;
    if (next === prev) return;
    this.rhythm.keyUp(prev);
    if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); }
    else this.padPointers.delete(id);
  }
  pointerUp(x, y, id) {
    const code = this.padPointers.get(id);
    if (code !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(code); }
  }

  drawStage(ctx) {
    const L = this.L, GY = L.groundY;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, L.stageY, W, L.stageBottom - L.stageY); ctx.clip();
    ctx.drawImage(this.bg, 0, GY - (GROUND_Y - STAGE_Y));
    if (this.venue.bg === 'subway' && this.train.t < 0) {
      const tx = this.train.x, ty = GY - 62;
      rect(ctx, tx, ty, 600, 40, '#c8c8d0'); rect(ctx, tx, ty + 30, 600, 6, '#2a4a9a');
      for (let x = tx + 10; x < tx + 600; x += 30) rect(ctx, x, ty + 8, 18, 14, '#ffe8a0');
    }
    const perf = this.performers || Game.run.members;
    const cur = this.rhythm ? this.rhythm.section.member : null;
    this.crowd && this.crowd.drawPeds(ctx, GY - 2, 0);
    perf.forEach((m, i) => {
      const x = 58 + i * 26, isCur = m === cur;
      const bob = isCur && this.rhythm ? Math.round(this.rhythm.beatPulse > 0.7 ? -1 : 0) : 0;
      drawBug(ctx, m.species, x, GY - 24 + bob, { pose: isCur ? 'play' : 'stand', instrument: m.instrument });
      if (isCur) drawText(ctx, '↓', x + 6, GY - 34 + Math.round(Math.sin(this.t * 8)), '#ffe14d', { align: 'center', shadow: '#000' });
      if (!isCur && this.rhythm && Math.floor(this.t * 2 + i) % 3 === 0) ctx.drawImage(propSprite('note'), x + 14, GY - 30);
    });
    if (this.crowd) ctx.drawImage(propSprite('hat'), this.crowd.hatX - 2, this.crowd.hatY - 2);
    this.crowd && this.crowd.drawPeds(ctx, GY + 6, 1);
    this.crowd && this.crowd.drawCoins(ctx);
    ctx.restore();
    if (this.rhythm) {
      const hx = W - 14, hy = L.stageY + 6, hh = Math.min(70, L.stageBottom - L.stageY - (L.top ? 8 : 18));
      rect(ctx, hx, hy, 8, hh, '#111'); const fill = hh * this.rhythm.hype / 100;
      rect(ctx, hx, hy + hh - fill, 8, fill, this.rhythm.hype > 70 ? '#ff5a9a' : this.rhythm.hype > 40 ? '#ffd166' : '#6fb8ff'); frame(ctx, hx, hy, 8, hh, '#888');
      if (!L.top) drawText(ctx, 'HYPE', hx + 4, hy + hh + 3, '#fff', { align: 'center', shadow: '#000' });
      rect(ctx, W - 100, L.stageY + 4, 78, 26, 'rgba(0,0,0,0.65)');
      drawText(ctx, 'TIPS', W - 96, L.stageY + 7, '#cfc9e6');
      drawText(ctx, fmtMoney(this.crowd.earned), W - 26, L.stageY + 6, '#ffe680', { align: 'right', scale: 2, shadow: '#000' });
      drawText(ctx, this.crowd.watchers.length + ' WATCHING', W - 96, L.stageY + 20, '#cfc9e6');
    }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0d0b18');
    const PY0 = this.L.top ? 66 : 14, PH = this.L.top ? H - 70 : this.L.stageY - 20;
    if (this.phase === 'prep') {
      this.drawStage(ctx);
      panel(ctx, 20, PY0, W - 40, PH);
      ctx.save(); ctx.translate(0, PY0 - 14);
      const title = { gig: 'GIG', elite: 'BIG GIG', boss: 'THE FINALE', openmic: 'OPEN MIC' }[this.mode];
      drawText(ctx, title + ': ' + this.venue.name.toUpperCase(), 28, 20, '#ffe14d', { scale: 2 });
      drawText(ctx, '"' + this.song.name + '"  ' + this.bpm + ' BPM  ' + this.bars + ' BARS   DIFFICULTY ' + '★'.repeat(this.difficulty) + '☆'.repeat(6 - this.difficulty).replace(/☆/g, '.'), 28, 36, '#cfc9e6');
      drawText(ctx, 'Crowd: ' + (this.venue.traffic >= 1.3 ? 'BUSY' : this.venue.traffic >= 1 ? 'STEADY' : 'QUIET') + '   Wallets: ' + (this.venue.wealth >= 1.5 ? 'FAT' : this.venue.wealth >= 1 ? 'AVERAGE' : 'THIN'), 28, 44, '#9a8fd0');
      if (this.mode === 'openmic') drawText(ctx, 'Score 60%+ accuracy and a new musician may ask to join.', 28, 52, '#c58bff');
      if (Game.run.pendingGig && Game.run.pendingGig.note) drawText(ctx, Game.run.pendingGig.note, 28, 52, '#ff9f68');
      drawText(ctx, 'LINEUP (toggle who plays; the song rotates instruments every 4 bars):', 28, 62, '#e0dcf0');
      this.menu.draw(ctx, 28, 72, W - 56, Game.touch ? 13 : 10);
      const it = this.menu.items[this.menu.idx];
      if (it && it.label.includes(' - ')) { const m = Game.run.members[this.menu.idx]; if (m) drawWrapped(ctx, INSTRUMENTS[m.instrument].desc, 28, PH - 8, 110, '#ffe680'); }
      ctx.restore();
      this.menu.rects.forEach(r => { if (r) r.y += PY0 - 14; });
      Game.drawRunHud(ctx);
      return;
    }
    if (this.phase === 'play') {
      const L = this.L;
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: L.top, pads: this.pads });
      this.drawStage(ctx);
      const p = clamp(this.rhythm.now / this.song.length, 0, 1);
      const barY = L.top ? L.stageBottom : L.stageY - 3;
      rect(ctx, 0, barY, W, 2, '#222'); rect(ctx, 0, barY, W * p, 2, '#ffe14d');
      const lbl = this.rhythm.section.member.name.toUpperCase() + ' ON ' + this.rhythm.instrument.name.toUpperCase();
      const lblY = L.top ? L.stageBottom - 10 : L.stageY + 5;
      rect(ctx, 2, lblY - 2, textWidth(lbl) + 6, 9, 'rgba(0,0,0,0.65)');
      drawText(ctx, lbl, 5, lblY, '#fff');
      if (Game.touch) {
        rect(ctx, 0, L.padY - 2, W, H - L.padY + 2, '#0a0814');
        drawPads(ctx, this.pads, this.rhythm.keysDown, this.t);
        this.pauseBtn.draw(ctx);
      }
      if (this.paused) {
        rect(ctx, 0, 0, W, H, 'rgba(0,0,0,0.75)');
        drawText(ctx, 'PAUSED', W / 2, 60, '#fff', { align: 'center', scale: 3 });
        if (Game.touch) this.buttons.forEach(b => b.draw(ctx));
        else drawText(ctx, 'ESC: RESUME    Q: BAIL ON THE SET (HALF TIPS)', W / 2, 100, '#cfc9e6', { align: 'center' });
      }
      return;
    }
    // results
    this.drawStage(ctx);
    panel(ctx, 20, PY0, W - 40, PH);
    ctx.save(); ctx.translate(0, PY0 - 10);
    const res = this.res;
    drawText(ctx, 'SET COMPLETE', 28, 16, '#ffe14d', { scale: 2 });
    drawText(ctx, this.grade, W - 50, 14, { S: '#ffe14d', A: '#6be585', B: '#6fb8ff', C: '#ffd166', D: '#ff5a5a' }[this.grade], { scale: 4, shadow: '#000' });
    let y = 34;
    drawText(ctx, 'PERFECT ' + res.perfect + '   GREAT ' + res.great + '   GOOD ' + res.good + '   MISS ' + res.miss, 28, y, '#e0dcf0'); y += 8;
    drawText(ctx, 'ACCURACY ' + Math.round(res.acc * 100) + '%   MAX COMBO ' + res.maxCombo + (res.rollHits ? '   ROLL HITS ' + res.rollHits : ''), 28, y, '#e0dcf0'); y += 10;
    drawText(ctx, 'TIPS: ' + fmtMoney(this.crowd.earned) + ' from ' + this.crowd.tipCount + ' tips', 28, y, '#ffe680', { scale: 2 }); y += 14;
    for (const l of this.bonusLines) { drawText(ctx, l, 28, y, '#ff9f68'); y += 7; }
    drawText(ctx, 'EARNED ' + fmtMoney(this.earned) + '  ->  WALLET ' + fmtMoney(Game.run.money), 28, y, '#6be585'); y += 9;
    for (const l of this.xpLines) { drawText(ctx, l, 28, y, '#9a8fd0'); y += 7; }
    if (this.recruit) { y += 2; drawText(ctx, 'Someone from the crowd wants to join!', 28, y, '#c58bff'); drawBug(ctx, this.recruit.species, W - 60, y - 6, { pose: 'play', instrument: this.recruit.instrument }); y += 8; }
    this.menu.draw(ctx, 28, Math.max(y + 2, PH - 30), W - 56, Game.touch ? 13 : 10);
    ctx.restore();
    this.menu.rects.forEach(r => { if (r) r.y += PY0 - 10; });
    Game.drawRunHud(ctx);
  }
}
