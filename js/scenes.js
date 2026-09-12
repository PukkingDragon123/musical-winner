// ---------- Scenes: title, map, band, shop, event, rest, treasure, night, endings ----------
'use strict';

function drawBackdropCity(ctx, t, opts = {}) {
  // night sky + bay + hills. Used by title and map.
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0820'); grad.addColorStop(0.6, '#1c1640'); grad.addColorStop(1, '#3a2a58');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  // stars
  const r = makeRng(7);
  for (let i = 0; i < 70; i++) { const x = r.int(0, W), y = r.int(0, 120); const tw = Math.sin(t * 2 + i) > 0.6; rect(ctx, x, y, 1, 1, tw ? '#fff' : '#8a86b0'); }
  // moon
  circle(ctx, 400, 36, 12, '#f4f0d8'); circle(ctx, 405, 33, 11, opts.moonBg || '#0f0c2a');
}

class TitleScene {
  constructor() {
    this.t = 0; this.page = 'main'; this.hasSave = !!RunState.load();
    this.menu = new Menu([
      { label: 'NEW RUN', onSelect: () => { RunState.clearSave(); Game.run = RunState.newRun(); Game.run.save(); Game.setScene(new MapScene(true)); } },
      { label: 'CONTINUE', disabled: !this.hasSave, onSelect: () => { const r = RunState.load(); if (r) { Game.run = r; Game.setScene(r.nightPending ? new NightScene() : new MapScene()); } } },
      { label: 'HOW TO PLAY', onSelect: () => { this.page = 'help'; } },
      { label: 'SOUND: ON', onSelect: (it) => { Game.muted = !Game.muted; Audio.setMuted(Game.muted); it.label = 'SOUND: ' + (Game.muted ? 'OFF' : 'ON'); } },
    ]);
    if (Game.touch) this.menu.items.push({ label: 'SCREEN: TURN', onSelect: () => { Game.rotateOverride = !Game.rotated; Game.resize(); } });
    this.bugs = []; const r = makeRng(3);
    for (let i = 0; i < 7; i++) this.bugs.push({ x: 40 + i * 60, sp: r.pick(SPECIES_KEYS), inst: r.pick(INSTRUMENT_KEYS), o: r.range(0, 6) });
  }
  update(dt) { this.t += dt; }
  key(code) {
    if (this.page === 'help') { if (code === 'Escape' || code === 'Enter' || code === 'Space') { this.page = 'main'; Audio.ui('back'); } return; }
    this.menu.key(code);
  }
  click(x, y) { if (this.page === 'help') { this.page = 'main'; return; } this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawBackdropCity(ctx, this.t);
    // bridge silhouette
    rect(ctx, 0, 150, W, 3, '#8a2a1a');
    for (let x = 60; x < W; x += 200) { rect(ctx, x, 90, 6, 70, '#a03020'); rect(ctx, x + 12, 90, 6, 70, '#a03020'); rect(ctx, x - 2, 88, 22, 4, '#a03020'); }
    for (let x = 0; x < W; x++) { const c = Math.abs(((x + 40) % 200) - 100) / 100; const y = 150 - Math.round((1 - c * c) * 0 + c * c * 58); if (x % 2 === 0) rect(ctx, x, y, 1, 1, '#c04030'); if (x % 12 === 0) rect(ctx, x, y, 1, 150 - y, '#7a2a1a'); }
    // fog bank
    ctx.globalAlpha = 0.35; for (let i = 0; i < 6; i++) { const fx = ((this.t * 8 + i * 90) % (W + 100)) - 50; rect(ctx, fx, 140 + (i % 3) * 5, 70, 8, '#c8c8e0'); } ctx.globalAlpha = 1;
    // ground
    rect(ctx, 0, 200, W, 70, '#2a2438'); rect(ctx, 0, 200, W, 2, '#4a4468');
    // marching bugs
    for (const b of this.bugs) {
      const x = ((b.x + this.t * 18) % (W + 40)) - 20;
      const pose = Math.floor(this.t * 6 + b.o) % 2 ? 'walk' : 'stand';
      drawBug(ctx, b.sp, x, 178 + Math.round(Math.sin(this.t * 6 + b.o)), { pose, instrument: b.inst });
    }
    if (this.page === 'help') { this.drawHelp(ctx); return; }
    drawText(ctx, 'BUG BUSKER', W / 2, 28, '#ffe14d', { align: 'center', scale: 4, shadow: '#6a3a10' });
    drawText(ctx, 'ORCHESTRA', W / 2, 52, '#ff9f68', { align: 'center', scale: 3, shadow: '#6a2a10' });
    drawText(ctx, 'a rhythm roguelike on the streets of san francisco', W / 2, 74, '#cfc9e6', { align: 'center' });
    panel(ctx, W / 2 - 64, 98, 128, 60);
    this.menu.draw(ctx, W / 2 - 58, 106, 116, 12);
    drawText(ctx, Game.touch ? 'TAP TO CHOOSE' : 'ARROWS + ENTER  /  MOUSE  /  M = MUTE', W / 2, 232, '#8a86b0', { align: 'center' });
  }
  drawHelp(ctx) {
    panel(ctx, 20, 14, W - 40, H - 28);
    let y = 22;
    drawText(ctx, 'HOW TO PLAY', W / 2, y, '#ffe14d', { align: 'center', scale: 2 }); y += 16;
    const lines = [
      'You lead a street band of bug musicians. Travel the map of San Francisco (Slay the Spire style paths), busk for tips, and feed your band a full meal every night.',
      '',
      'GIGS are skill-based rhythm games. Each instrument plays differently:',
      'GUITAR / BASS / KEYBOARD / TAMBOURINE: falling notes in lanes (Guitar Hero). Hold long notes.',
      'TAIKO DRUMS: red DON = F or J, blue KA = D or K. Big notes: hit F+J together. Mash the ROLL bars.',
      'SAXOPHONE: hold SPACE for each phrase, release on the end marker. Manage your breath meter.',
      'TRUMPET: press the lit valve combination (J K L) together, on the beat.',
      'VIOLIN: bow UP (arrow up / W) or DOWN (arrow down / S) on the marker. Hold long bows.',
      '',
      'With several band members, the song switches instruments every 4 bars. Watch the SWITCH warning!',
      'Hype rises with PERFECT hits and drops with misses. Hyped crowds stop, watch and tip. Combos trigger cheers.',
      'Each night dinner costs money per member. A starving bug leaves. If YOU starve, the run ends.',
      'Shops sell instruments, relics and snacks. Events, rests and open mics hold surprises and recruits.',
      '',
      'On a phone or tablet: tap anything to choose it, drag the map to scroll, and play gigs with the big pads along the bottom of the screen. Hold a pad for hold notes.',
      '',
      'Press ENTER or tap to go back.',
    ];
    for (const l of lines) { y += drawWrapped(ctx, l, 28, y, 108, l.startsWith('GIG') || l.includes(':') && l === l.toUpperCase() ? '#ffe680' : '#e0dcf0', 7) * 7 + 1; }
  }
}

// ---------- Map ----------
class MapScene {
  constructor(intro) {
    this.t = 0; this.camY = 0; this.introT = intro ? 2.2 : 0; this.dayBanner = intro ? 2.5 : 0;
    this.refresh();
  }
  enter() { const r = Game.run; if (r.dayBannerPending) { this.dayBanner = 2.5; r.dayBannerPending = false; } }
  refresh() {
    const r = Game.run; const cur = r.current;
    this.avail = cur ? cur.next.slice() : r.map.grid[0].filter(Boolean);
    this.sel = 0;
    const focusY = cur ? cur.y : 480;
    this.camY = clamp(focusY - 175, 0, 300);
  }
  update(dt) {
    this.t += dt; this.introT = Math.max(0, this.introT - dt); this.dayBanner = Math.max(0, this.dayBanner - dt);
    this.userPan = Math.max(0, (this.userPan || 0) - dt);
    if (this.userPan > 0) return;
    const cur = Game.run.current; const focusY = cur ? cur.y : 480;
    const target = clamp(focusY - 175, 0, 300);
    this.camY = lerp(this.camY, target, Math.min(1, dt * 4));
  }
  key(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + this.avail.length) % this.avail.length; Audio.ui('move'); }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % this.avail.length; Audio.ui('move'); }
    else if (code === 'Enter' || code === 'Space' || code === 'KeyZ') { this.go(this.avail[this.sel]); }
    else if (code === 'Tab' || code === 'KeyB') { Game.setScene(new BandScene()); }
    else if (code === 'Escape') { Game.run.save(); Game.setScene(new TitleScene()); }
  }
  click(x, y) { this.tap(x, y); }
  tap(x, y) {
    if (y >= H - 14 && x >= W - 148) { Game.setScene(new BandScene()); return; }
    if (y >= H - 14 && x >= W - 300 && x < W - 152) { Game.run.save(); Game.setScene(new TitleScene()); return; }
    const reach = Game.touch ? 16 : 10;
    let best = null, bestD = Infinity;
    for (const n of this.avail) {
      const sy = n.y - this.camY; const d = Math.hypot(x - n.x, y - sy);
      if (d < reach && d < bestD) { best = n; bestD = d; }
    }
    if (best) this.go(best);
  }
  pointerDown(x, y, id) { this.drag = { y, camY: this.camY, moved: 0, id }; }
  pointerMove(x, y, id) {
    if (!this.drag || this.drag.id !== id) return;
    const dy = y - this.drag.y;
    this.drag.moved = Math.max(this.drag.moved, Math.abs(dy));
    if (this.drag.moved > 5 && x < 332) { this.camY = clamp(this.drag.camY - dy, 0, 300); this.userPan = 2.5; }
  }
  pointerUp(x, y, id) {
    if (!this.drag || this.drag.id !== id) return;
    const moved = this.drag.moved; this.drag = null;
    if (moved <= 5 && x >= 0) this.tap(x, y);
  }
  hover(x, y) { this.avail.forEach((n, i) => { const sy = n.y - this.camY; if (Math.abs(x - n.x) < 10 && Math.abs(y - sy) < 10) this.sel = i; }); }
  go(node) {
    const r = Game.run; Audio.ui('select');
    node.visited = true; r.current = node;
    switch (node.type) {
      case 'gig': case 'elite': case 'boss': case 'openmic': Game.setScene(new PerformScene(node)); break;
      case 'shop': Game.setScene(new ShopScene(node)); break;
      case 'event': Game.setScene(new EventScene(node)); break;
      case 'rest': Game.setScene(new RestScene(node)); break;
      case 'treasure': Game.setScene(new TreasureScene(node)); break;
    }
  }
  nodeColor(n) { return { gig: '#6fb8ff', elite: '#ffd040', boss: '#ff5a5a', shop: '#f0a050', event: '#80d0ff', rest: '#d05070', treasure: '#ffd040', openmic: '#c58bff' }[n.type] || '#fff'; }
  nodeLabel(n) { return { gig: 'GIG', elite: 'BIG GIG', boss: 'FINALE', shop: 'MUSIC SHOP', event: '???', rest: 'REST', treasure: 'TREASURE', openmic: 'OPEN MIC' }[n.type]; }
  draw(ctx) {
    const r = Game.run; const cam = this.camY;
    drawBackdropCity(ctx, this.t, { moonBg: '#0d0a26' });
    // bay water on the right of map area, hills left
    ctx.save(); ctx.beginPath(); ctx.rect(0, 13, 330, H - 13); ctx.clip();
    for (let y = 0; y < H; y += 1) { const wy = y + cam; if ((wy + Math.floor(this.t * 6)) % 8 === 0) rect(ctx, 250 + Math.sin(wy * 0.05) * 20, y, 80, 1, '#2a3a70'); }
    rect(ctx, 0, 13, 330, H, 'rgba(20,16,44,0.35)');
    // districts / streets grid faint
    for (let gy = -((cam) % 30); gy < H; gy += 30) rect(ctx, 0, gy, 330, 1, 'rgba(120,110,170,0.12)');
    for (let gx = 0; gx < 330; gx += 40) rect(ctx, gx + 8, 13, 1, H, 'rgba(120,110,170,0.12)');
    this.drawLandmarks(ctx, cam);
    // day separators
    for (let d = 1; d <= 5; d++) {
      const rowY = (MAP_ROWS - (d * ROWS_PER_DAY - 0.5)) * MAP_ROW_H + 30 - cam;
      if (rowY < 13 || rowY > H) continue;
      dashedLine(ctx, 0, rowY, 330, rowY, '#6b5f9a', 4, 4, this.t * 10);
      rect(ctx, 2, rowY - 8, textWidth('NIGHTFALL: DINNER ' + d) + 4, 8, '#0a0820');
      drawText(ctx, 'NIGHTFALL: DINNER ' + d, 4, rowY - 7, '#9a8fd0');
      if (d < 5) { const lbl = 'DAY ' + (d + 1) + ': ' + DAY_NAMES[d].toUpperCase(); rect(ctx, 2, rowY + 2, textWidth(lbl) + 4, 8, '#0a0820'); drawText(ctx, lbl, 4, rowY + 3, '#6b5f9a'); }
    }
    // edges
    for (const n of r.map.nodes) for (const m of n.next) {
      const onPath = n.visited && m.visited;
      const avail = n === r.current && this.avail.includes(m);
      const col = onPath ? '#ffe680' : avail ? '#cfc9e6' : '#4a4470';
      dashedLine(ctx, n.x, n.y - cam, m.x, m.y - cam, col, 2, 3, avail ? this.t * 12 : 0);
    }
    // nodes
    for (const n of r.map.nodes) {
      const y = n.y - cam; if (y < 8 || y > H + 8) continue;
      const isCur = n === r.current, isAvail = this.avail.includes(n);
      const big = n.type === 'boss' || n.type === 'elite';
      const rad = big ? 9 : 7;
      const pulse = isAvail ? Math.round(Math.sin(this.t * 6) * 1.5 + 1.5) : 0;
      if (isAvail) ringPx(ctx, n.x, y, rad + 3 + pulse, this.avail[this.sel] === n ? '#fff' : '#cfc9e6');
      circle(ctx, n.x, y, rad, isCur ? '#ffe680' : n.visited ? '#3a3560' : '#1a1730');
      ringPx(ctx, n.x, y, rad, n.visited && !isCur ? '#6b5f9a' : this.nodeColor(n));
      const ic = iconSprite(n.type);
      ctx.globalAlpha = n.visited && !isCur ? 0.5 : 1;
      ctx.drawImage(ic, n.x - 4, y - 4); ctx.globalAlpha = 1;
    }
    // party marker
    if (r.current) { const y = r.current.y - cam; drawBug(ctx, r.members[0].species, r.current.x - 8, y - 26 + Math.round(Math.sin(this.t * 5)), { pose: 'stand', instrument: r.members[0].instrument }); }
    else { const n = this.avail[this.sel]; drawText(ctx, 'START HERE', n.x, n.y - cam + 12, '#ffe680', { align: 'center', shadow: '#000' }); }
    // selected tooltip
    const s = this.avail[this.sel];
    if (s) {
      const ty = s.y - cam - 22 - (s.type === 'boss' ? 6 : 0);
      const label = this.nodeLabel(s) + (s.venue ? ': ' + VENUES[s.venue].name.toUpperCase() : '');
      const tw = textWidth(label) + 8; const tx = clamp(s.x - tw / 2, 2, 330 - tw);
      rect(ctx, tx, ty - 2, tw, 9, '#000'); drawText(ctx, label, tx + 4, ty, this.nodeColor(s));
    }
    ctx.restore();
    // right panel
    this.drawPanel(ctx);
    Game.drawRunHud(ctx);
    if (this.dayBanner > 0) {
      ctx.globalAlpha = clamp(this.dayBanner, 0, 1);
      rect(ctx, 0, 110, W, 40, '#000');
      drawText(ctx, 'DAY ' + (r.day + 1), W / 2, 116, '#ffe14d', { align: 'center', scale: 2 });
      drawText(ctx, DAY_NAMES[Math.min(4, r.day)].toUpperCase(), W / 2, 134, '#fff', { align: 'center' });
      ctx.globalAlpha = 1;
    }
  }
  drawLandmarks(ctx, cam) {
    // world-space decorations kept clear of the node columns (nodes span x 43..295)
    const y0 = -cam;
    // Golden Gate bridge at the top
    rect(ctx, 0, y0 + 40, 330, 2, '#c03a2a');
    for (const bx of [70, 210]) { rect(ctx, bx, y0 + 8, 4, 34, '#c03a2a'); rect(ctx, bx + 8, y0 + 8, 4, 34, '#c03a2a'); rect(ctx, bx - 1, y0 + 8, 14, 2, '#c03a2a'); }
    for (let x = 0; x < 330; x += 3) { const c = Math.abs(((x + 70) % 140) - 70) / 70; rect(ctx, x, y0 + 12 + Math.round(c * c * 28), 1, 1, '#e05040'); }
    // Coit tower + Transamerica pyramid on the bay side
    rect(ctx, 318, y0 + 150, 5, 22, '#d8d0c0'); rect(ctx, 317, y0 + 148, 7, 3, '#e8e0d0');
    for (let i = 0; i < 12; i++) rect(ctx, 302 + i / 2, y0 + 205 + i, 12 - i, 1, '#c8c8d8');
    rect(ctx, 307, y0 + 195, 2, 10, '#e0e0f0');
    // painted ladies
    const cols = ['#c86a8a', '#6a9ac8', '#c8b06a', '#8ac86a', '#a86ac8'];
    for (let i = 0; i < 5; i++) { const x = 300 + i * 6; rect(ctx, x, y0 + 382, 5, 14, cols[i]); rect(ctx, x + 1, y0 + 379, 3, 3, shade(cols[i], -30)); rect(ctx, x + 2, y0 + 386, 1, 3, '#fff0c0'); }
    // Sutro tower on the ocean side
    rect(ctx, 14, y0 + 430, 2, 40, '#c04040'); rect(ctx, 20, y0 + 430, 2, 40, '#c04040'); rect(ctx, 8, y0 + 436, 20, 2, '#c04040'); rect(ctx, 10, y0 + 450, 16, 2, '#c04040');
    // Dolores park palms
    for (let i = 0; i < 2; i++) ctx.drawImage(propSprite('tree'), 302 + i * 14, y0 + 440);
    drawText(ctx, 'BAY', 308, y0 + 300, '#3a5aa0'); drawText(ctx, 'OCEAN', 4, y0 + 240, '#3a5aa0');
  }
  drawPanel(ctx) {
    const r = Game.run;
    panel(ctx, 332, 14, W - 334, H - 16);
    let y = 20;
    drawText(ctx, 'THE BAND', 340, y, '#ffe14d'); y += 9;
    for (const m of r.members) {
      drawBug(ctx, m.species, 338, y - 2, { pose: 'stand', instrument: m.instrument });
      drawText(ctx, m.name.toUpperCase(), 358, y, '#fff');
      drawText(ctx, INSTRUMENTS[m.instrument].name, 358, y + 7, '#cfc9e6');
      // stamina bar
      rect(ctx, 358, y + 14, 60, 3, '#222'); rect(ctx, 358, y + 14, 60 * m.stamina / 100, 3, m.stamina > 50 ? '#6be585' : m.stamina > 25 ? '#ffd166' : '#ff5a5a');
      drawText(ctx, 'SK' + m.skill, 422, y + 7, '#9a8fd0');
      drawText(ctx, '★'.repeat(m.quality), 422, y, '#ffe680');
      if (m.hunger > 0) drawText(ctx, m.hunger >= 2 ? 'STARVING' : 'HUNGRY', 422, y + 13, m.hunger >= 2 ? '#ff5a5a' : '#ff9f68');
      y += 20;
    }
    y += 2; drawText(ctx, 'RELICS', 340, y, '#ffe14d'); y += 8;
    r.relics.forEach((k, i) => ctx.drawImage(iconSprite(ITEMS[k].icon), 340 + (i % 14) * 10, y + Math.floor(i / 14) * 10));
    if (!r.relics.length) drawText(ctx, '(none yet)', 340, y, '#6b5f9a');
    y += 10 + Math.floor(Math.max(0, r.relics.length - 1) / 14) * 10;
    drawText(ctx, 'ITEMS', 340, y, '#ffe14d'); y += 8;
    r.consumables.forEach((k, i) => ctx.drawImage(iconSprite(ITEMS[k].icon), 340 + i * 10, y));
    if (!r.consumables.length) drawText(ctx, '(none)', 340, y, '#6b5f9a');
    y += 12;
    drawText(ctx, 'TONIGHT\'S DINNER:', 340, y, '#cfc9e6'); y += 7;
    drawText(ctx, fmtMoney(r.mealPrice()) + ' x ' + r.members.length + ' = ' + fmtMoney(r.mealPrice() * r.members.length), 340, y, r.money >= r.mealPrice() * r.members.length ? '#6be585' : '#ff9f68'); y += 10;
    rect(ctx, W - 148, H - 14, 146, 12, '#3a3560'); frame(ctx, W - 148, H - 14, 146, 12, '#8a80c0');
    drawText(ctx, Game.touch ? 'BAND & ITEMS' : 'TAB: BAND & ITEMS', W - 75, H - 11, '#fff', { align: 'center' });
    rect(ctx, W - 300, H - 14, 148, 12, '#241f38'); frame(ctx, W - 300, H - 14, 148, 12, '#6b5f9a');
    drawText(ctx, Game.touch ? 'SAVE & QUIT' : 'ESC: SAVE & QUIT', W - 226, H - 11, '#cfc9e6', { align: 'center' });
    if (Game.touch) drawText(ctx, 'DRAG TO SCROLL - TAP A GLOWING STOP', 4, H - 11, '#6b5f9a');
  }
}

// ---------- Band management ----------
class BandScene {
  constructor() { this.sel = 0; this.buildMenu(); }
  buildMenu() {
    const r = Game.run; const m = r.members[this.sel];
    const items = [];
    r.consumables.forEach((k, i) => {
      if (k === 'bread') items.push({ label: 'Use Bread Crumbs on ' + m.name, icon: 'bread', disabled: m.hunger === 0, onSelect: () => { m.hunger = Math.max(0, m.hunger - 1); r.consumables.splice(i, 1); Audio.ui('eat'); this.buildMenu(); } });
      if (k === 'bar') items.push({ label: 'Use Energy Bar on ' + m.name, icon: 'bar', disabled: m.stamina >= 100, onSelect: () => { m.stamina = Math.min(100, m.stamina + 40); r.consumables.splice(i, 1); Audio.ui('eat'); this.buildMenu(); } });
    });
    r.spareInstruments.forEach((s, i) => {
      items.push({ label: 'Give ' + INSTRUMENTS[s.kind].name + ' ' + '★'.repeat(s.quality) + ' to ' + m.name, icon: 'case', onSelect: () => { const old = { kind: m.instrument, quality: m.quality }; m.instrument = s.kind; m.quality = s.quality; r.spareInstruments.splice(i, 1, old); this.buildMenu(); } });
    });
    if (r.members.length > 1 && !m.leader) items.push({ label: 'Part ways with ' + m.name, icon: 'event', onSelect: () => { r.members.splice(this.sel, 1); this.sel = 0; this.buildMenu(); } });
    items.push({ label: 'Sound: ' + (Game.muted ? 'OFF' : 'ON'), icon: 'metronome', onSelect: () => { Game.muted = !Game.muted; Audio.setMuted(Game.muted); this.buildMenu(); } });
    items.push({ label: 'Back to map', onSelect: () => { r.save(); Game.setScene(new MapScene()); } });
    this.menu = new Menu(items);
  }
  update() { }
  key(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + Game.run.members.length) % Game.run.members.length; this.buildMenu(); Audio.ui('move'); return; }
    if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % Game.run.members.length; this.buildMenu(); Audio.ui('move'); return; }
    if (code === 'Escape' || code === 'Tab') { Game.run.save(); Game.setScene(new MapScene()); return; }
    this.menu.key(code);
  }
  click(x, y) {
    Game.run.members.forEach((m, i) => { if (x >= 12 + i * 76 && x < 12 + i * 76 + 72 && y >= 24 && y < 96) { this.sel = i; this.buildMenu(); } });
    this.menu.click(x, y);
  }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const r = Game.run;
    rect(ctx, 0, 0, W, H, '#14112a');
    Game.drawRunHud(ctx);
    drawText(ctx, 'THE BAND  (LEFT/RIGHT to pick a member)', 12, 16, '#ffe14d');
    r.members.forEach((m, i) => {
      const x = 12 + i * 76; const sel = i === this.sel;
      panel(ctx, x, 24, 72, 74, sel ? { border: '#ffe680' } : {});
      drawBug(ctx, m.species, x + 4, 30, { pose: sel ? 'play' : 'stand', instrument: m.instrument });
      drawText(ctx, m.name.toUpperCase() + (m.leader ? ' (YOU)' : ''), x + 22, 30, '#fff');
      drawText(ctx, SPECIES[m.species].name, x + 22, 37, '#cfc9e6');
      drawText(ctx, INSTRUMENTS[m.instrument].name, x + 4, 50, '#ffe680');
      drawText(ctx, 'QUALITY ' + '★'.repeat(m.quality), x + 4, 58, '#ffe680');
      drawText(ctx, 'SKILL ' + m.skill + '  XP ' + m.xp.toFixed(1) + '/3', x + 4, 66, '#9a8fd0');
      drawText(ctx, 'STAMINA ' + Math.round(m.stamina), x + 4, 74, m.stamina > 50 ? '#6be585' : '#ff9f68');
      rect(ctx, x + 4, 82, 64, 3, '#222'); rect(ctx, x + 4, 82, 64 * m.stamina / 100, 3, m.stamina > 50 ? '#6be585' : m.stamina > 25 ? '#ffd166' : '#ff5a5a');
      drawText(ctx, ['FED', 'HUNGRY', 'STARVING'][m.hunger] || 'STARVING', x + 4, 89, ['#6be585', '#ff9f68', '#ff5a5a'][Math.min(2, m.hunger)]);
    });
    const m = r.members[this.sel];
    panel(ctx, 12, 104, 250, 60);
    drawText(ctx, INSTRUMENTS[m.instrument].name.toUpperCase() + ': ' + INSTRUMENTS[m.instrument].keyNames.join(' '), 18, 110, '#ffe680');
    drawWrapped(ctx, INSTRUMENTS[m.instrument].desc, 18, 118, 58, '#e0dcf0');
    drawWrapped(ctx, 'Skill boosts tips when they back you up. Stamina and hunger shrink your timing windows. STARVING bugs leave at dawn.', 18, 138, 58, '#9a8fd0');
    panel(ctx, 270, 104, 198, 60);
    drawText(ctx, 'RELICS', 276, 110, '#ffe14d');
    r.relics.forEach((k, i) => { ctx.drawImage(iconSprite(ITEMS[k].icon), 276 + (i % 9) * 20, 118 + Math.floor(i / 9) * 10); });
    if (this.hoverRelic != null) { }
    const relicIdx = Math.floor((Game.mouse.x - 276) / 20) + Math.floor((Game.mouse.y - 118) / 10) * 9;
    if (Game.mouse.x >= 276 && Game.mouse.y >= 118 && Game.mouse.y < 138 && r.relics[relicIdx]) { drawWrapped(ctx, ITEMS[r.relics[relicIdx]].name + ': ' + ITEMS[r.relics[relicIdx]].desc, 276, 140, 46, '#e0dcf0'); }
    else drawText(ctx, 'hover a relic for details', 276, 140, '#6b5f9a');
    panel(ctx, 12, 170, W - 24, H - 176);
    drawText(ctx, 'ACTIONS', 18, 176, '#ffe14d');
    this.menu.draw(ctx, 18, 186, W - 36, 10);
  }
}

// ---------- Shop ----------
class ShopScene {
  constructor(node) {
    this.node = node; const r = Game.run;
    if (!node.stock) {
      const rng = r.rng; const pm = 1 + r.day * 0.12;
      const stock = [];
      const ik = rng.shuffle(INSTRUMENT_KEYS.filter(k => k !== 'tambourine')).slice(0, 2);
      for (const k of ik) { const q = rng.int(1, Math.min(3, 1 + r.day)); stock.push({ kind: 'instrument', key: k, quality: q, price: Math.round(INSTRUMENTS[k].price * (0.7 + q * 0.3) * pm) }); }
      const relics = rng.shuffle(RELIC_KEYS.filter(k => !r.relics.includes(k))).slice(0, 3);
      for (const k of relics) stock.push({ kind: 'relic', key: k, price: Math.round(ITEMS[k].price * pm) });
      for (const k of rng.shuffle(USE_KEYS).slice(0, 2)) stock.push({ kind: 'use', key: k, price: Math.round(ITEMS[k].price * pm) });
      if (rng.chance(0.45)) { const m = r.makeMember(); stock.push({ kind: 'recruit', member: m, price: 18 + r.day * 7 + m.skill * 2 }); }
      node.stock = stock;
    }
    this.mode = 'shop'; this.msg = 'Welcome! Everything is slightly overpriced. It\'s San Francisco.'; this.buildMenu();
  }
  buildMenu() {
    const r = Game.run; const items = [];
    for (const s of this.node.stock) {
      if (s.sold) continue;
      const afford = r.money >= s.price;
      if (s.kind === 'instrument') items.push({ label: INSTRUMENTS[s.key].name + ' ' + '★'.repeat(s.quality), right: fmtMoney(s.price), icon: 'case', disabled: !afford, stock: s, onSelect: () => this.pickMember(s) });
      else if (s.kind === 'recruit') items.push({ label: 'HIRE ' + s.member.name + ' the ' + SPECIES[s.member.species].name + ' (' + INSTRUMENTS[s.member.instrument].name + ', skill ' + s.member.skill + ')', right: fmtMoney(s.price), icon: 'openmic', disabled: !afford || r.members.length >= 6, stock: s, onSelect: () => { r.money -= s.price; s.sold = true; r.members.push(s.member); Audio.ui('cash'); this.msg = s.member.name + ' joins the band!'; this.buildMenu(); } });
      else items.push({ label: ITEMS[s.key].name, right: fmtMoney(s.price), icon: ITEMS[s.key].icon, disabled: !afford || (s.kind === 'use' && r.consumables.length >= 6), stock: s, onSelect: () => { r.money -= s.price; s.sold = true; if (s.kind === 'relic') r.addRelic(s.key); else r.consumables.push(s.key); Audio.ui('cash'); this.msg = 'Bought ' + ITEMS[s.key].name + '.'; this.buildMenu(); } });
    }
    items.push({ label: 'Leave the shop', onSelect: () => Game.afterNode() });
    this.menu = new Menu(items);
  }
  pickMember(s) {
    const r = Game.run; this.mode = 'member';
    this.sub = new Menu(r.members.map(m => ({ label: m.name + ' (' + INSTRUMENTS[m.instrument].name + ' ★'.repeat(m.quality) + ')', onSelect: () => {
      r.money -= s.price; s.sold = true; r.spareInstruments.push({ kind: m.instrument, quality: m.quality }); m.instrument = s.key; m.quality = s.quality; Audio.ui('cash');
      this.msg = m.name + ' now plays ' + INSTRUMENTS[s.key].name + '. Old instrument stored as a spare.'; this.mode = 'shop'; this.buildMenu();
    } })).concat([{ label: 'Cancel', onSelect: () => { this.mode = 'shop'; } }]));
  }
  update() { }
  key(code) {
    if (this.mode === 'member') { if (code === 'Escape') { this.mode = 'shop'; return; } this.sub.key(code); return; }
    if (code === 'Escape') { Game.afterNode(); return; }
    this.menu.key(code);
  }
  click(x, y) { (this.mode === 'member' ? this.sub : this.menu).click(x, y); }
  hover(x, y) { (this.mode === 'member' ? this.sub : this.menu).hover(x, y); }
  draw(ctx) {
    const r = Game.run;
    rect(ctx, 0, 0, W, H, '#1a1420');
    // shop interior
    rect(ctx, 0, 13, W, 110, '#2a1e2a'); rect(ctx, 0, 123, W, H, '#3a2a20');
    for (let x = 0; x < W; x += 24) rect(ctx, x, 123, 1, H, '#2a1a10');
    for (let i = 0; i < 12; i++) { const k = INSTRUMENT_KEYS[i % INSTRUMENT_KEYS.length]; const s = instrumentSprite(k); ctx.drawImage(s, 260 + (i % 6) * 34, 30 + Math.floor(i / 6) * 40); }
    rect(ctx, 250, 26, 220, 1, '#6a4a30'); rect(ctx, 250, 66, 220, 1, '#6a4a30'); rect(ctx, 250, 106, 220, 1, '#6a4a30');
    drawBug(ctx, 'weevil', 300, 100, { pose: 'stand', hat: 'top' });
    rect(ctx, 280, 118, 60, 14, '#5a3a20'); drawText(ctx, 'COUNTER', 310, 122, '#c0a080', { align: 'center' });
    drawText(ctx, 'WEEVIL\'S MUSIC EMPORIUM', 12, 18, '#ffe14d', { scale: 2 });
    panel(ctx, 8, 32, 236, 130);
    (this.mode === 'member' ? this.sub : this.menu).draw(ctx, 14, 38, 224, 10);
    // details
    panel(ctx, 8, 166, W - 16, H - 170);
    const it = this.mode === 'member' ? null : this.menu.items[this.menu.idx];
    if (this.mode === 'member') drawText(ctx, 'Who gets the new instrument?', 14, 172, '#ffe680');
    else if (it && it.stock) {
      const s = it.stock;
      if (s.kind === 'instrument') { drawText(ctx, INSTRUMENTS[s.key].name.toUpperCase() + ' - ' + INSTRUMENTS[s.key].keyNames.join(' '), 14, 172, '#ffe680'); drawWrapped(ctx, INSTRUMENTS[s.key].desc + ' Quality stars raise tips.', 14, 180, 110, '#e0dcf0'); }
      else if (s.kind === 'recruit') { drawText(ctx, 'SESSION MUSICIAN', 14, 172, '#ffe680'); drawWrapped(ctx, 'A new band member. More members = more instruments to juggle, bigger backing bonus, and one more mouth to feed each night.', 14, 180, 110, '#e0dcf0'); drawBug(ctx, s.member.species, W - 40, 176, { pose: 'play', instrument: s.member.instrument }); }
      else { drawText(ctx, ITEMS[s.key].name.toUpperCase() + (s.kind === 'relic' ? ' (RELIC)' : ' (CONSUMABLE)'), 14, 172, '#ffe680'); drawWrapped(ctx, ITEMS[s.key].desc, 14, 180, 110, '#e0dcf0'); }
    } else drawText(ctx, this.msg, 14, 172, '#e0dcf0');
    drawText(ctx, this.msg, 14, H - 12, '#9a8fd0');
    Game.drawRunHud(ctx);
  }
}

// ---------- Event ----------
class EventScene {
  constructor(node) {
    const r = Game.run; r.seenEvents = r.seenEvents || [];
    let pool = EVENTS.filter(e => !r.seenEvents.includes(e.id));
    if (!pool.length) { r.seenEvents = []; pool = EVENTS; }
    this.ev = r.rng.pick(pool); r.seenEvents.push(this.ev.id);
    this.log = []; this.done = false; this.t = 0;
    this.menu = new Menu(this.ev.choices.map(c => ({ label: c.label, disabled: c.req ? !c.req(r) : false, onSelect: () => {
      c.apply(r, (s) => this.log.push(s)); this.done = true; Audio.ui('select');
      this.menu = new Menu([{ label: 'Continue', onSelect: () => Game.afterNode() }]);
    } })));
  }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawBackdropCity(ctx, this.t);
    rect(ctx, 0, 200, W, 70, '#2a2438');
    const r = Game.run;
    r.members.forEach((m, i) => drawBug(ctx, m.species, 30 + i * 22, 182 + Math.round(Math.sin(this.t * 3 + i)), { pose: 'stand', instrument: m.instrument }));
    panel(ctx, 40, 24, W - 80, 160);
    ctx.drawImage(iconSprite(this.ev.icon), 48, 30);
    drawText(ctx, this.ev.title.toUpperCase(), 60, 30, '#ffe14d', { scale: 2 });
    let y = 48;
    y += drawWrapped(ctx, this.ev.text, 48, y, 96, '#e0dcf0') * 7 + 6;
    if (!this.done) { drawText(ctx, 'WHAT DO YOU DO?', 48, y, '#9a8fd0'); y += 9; this.menu.draw(ctx, 48, y, W - 100, 11); }
    else { for (const l of this.log) { y += drawWrapped(ctx, l, 48, y, 96, '#ffe680') * 7 + 2; } this.menu.draw(ctx, 48, y + 6, W - 100, 11); }
    Game.drawRunHud(ctx);
  }
}

// ---------- Rest ----------
class RestScene {
  constructor(node) {
    const r = Game.run; this.t = 0; this.log = null;
    this.menu = new Menu([
      { label: 'Nap in the sun: +45 stamina for everyone', icon: 'rest', onSelect: () => { r.members.forEach(m => m.stamina = Math.min(100, m.stamina + 45)); this.finish('Everyone dozes off. Zzz. Stamina restored.'); } },
      { label: 'Jam session: +1 skill to your least skilled member (-10 stamina all)', icon: 'metronome', onSelect: () => { const m = r.members.slice().sort((a, b) => a.skill - b.skill)[0]; m.skill = Math.min(10, m.skill + 1); r.members.forEach(x => x.stamina = Math.max(0, x.stamina - 10)); Audio.ui('levelup'); this.finish(m.name + ' finally nails that tricky part. Skill +1!'); } },
      { label: 'Repair instruments: +1 quality to a random 1★ instrument (or +$6)', icon: 'case', onSelect: () => { const c = r.members.filter(m => m.quality < 3); if (c.length) { const m = r.rng.pick(c); m.quality++; this.finish(m.name + '\'s ' + INSTRUMENTS[m.instrument].name + ' sounds better than ever. Quality +1!'); } else { r.money += 6; this.finish('Nothing to fix, so you polish everything and find $6 in a case pocket.'); } } },
    ]);
  }
  finish(msg) { this.log = msg; Audio.ui('select'); this.menu = new Menu([{ label: 'Continue', onSelect: () => Game.afterNode() }]); }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const g = Game.run;
    const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#f0a060'); grad.addColorStop(1, '#6a3a80'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    circle(ctx, 380, 60, 16, '#fff0a0');
    rect(ctx, 0, 150, W, 120, '#3f8a3f'); rect(ctx, 0, 150, W, 2, '#6ab04a');
    for (let i = 0; i < 5; i++) ctx.drawImage(propSprite('tree'), 20 + i * 100, 132);
    ctx.drawImage(propSprite('bench'), 300, 168);
    g.members.forEach((m, i) => drawBug(ctx, m.species, 60 + i * 30, 170, { pose: Math.floor(this.t * 2 + i) % 2 ? 'stand' : 'play', instrument: m.instrument }));
    panel(ctx, 30, 20, W - 60, 90);
    drawText(ctx, 'A QUIET MOMENT', 38, 26, '#ffe14d', { scale: 2 });
    if (!this.log) { drawText(ctx, 'The band finds a patch of grass. How do you spend the afternoon?', 38, 44, '#e0dcf0'); this.menu.draw(ctx, 38, 58, W - 76, 11); }
    else { drawWrapped(ctx, this.log, 38, 44, 100, '#ffe680'); this.menu.draw(ctx, 38, 70, W - 76, 11); }
    Game.drawRunHud(ctx);
  }
}

// ---------- Treasure ----------
class TreasureScene {
  constructor(node) {
    const r = Game.run; this.t = 0;
    const picks = []; for (let i = 0; i < 3; i++) { const k = r.randomNewRelic(picks); if (k) picks.push(k); }
    this.picks = picks;
    const items = picks.map(k => ({ label: ITEMS[k].name, icon: ITEMS[k].icon, key: k, onSelect: () => { r.addRelic(k); Audio.ui('fanfare'); Game.afterNode(); } }));
    items.push({ label: picks.length ? 'Take $25 instead' : 'Take $40', onSelect: () => { r.money += picks.length ? 25 : 40; Audio.ui('cash'); Game.afterNode(); } });
    this.menu = new Menu(items);
  }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#1a1428');
    drawText(ctx, 'LOST & FOUND', W / 2, 24, '#ffe14d', { align: 'center', scale: 2 });
    drawText(ctx, 'Someone left a box of goodies by the cable car turnaround. Pick one.', W / 2, 44, '#e0dcf0', { align: 'center' });
    ctx.drawImage(iconSprite('treasure'), W / 2 - 16, 60 + Math.round(Math.sin(this.t * 3)), 32, 32);
    panel(ctx, W / 2 - 110, 100, 220, 70);
    this.menu.draw(ctx, W / 2 - 104, 106, 208, 12);
    const it = this.menu.items[this.menu.idx];
    if (it && it.key) drawWrapped(ctx, ITEMS[it.key].desc, W / 2 - 104, 180, 52, '#ffe680');
    Game.drawRunHud(ctx);
  }
}

// ---------- Night / dinner ----------
class NightScene {
  constructor() {
    const r = Game.run; this.t = 0; this.phase = 'dinner'; this.log = [];
    const price = r.mealPrice(), n = r.members.length, total = price * n;
    const canFeed = Math.min(n, Math.floor(r.money / price));
    this.menu = new Menu([
      { label: 'Full meal for everyone', right: fmtMoney(total), icon: 'food', disabled: r.money < total, onSelect: () => { r.money -= total; r.members.forEach(m => { m.hunger = 0; m.stamina = Math.min(100, m.stamina + 65); }); Audio.ui('eat'); this.log.push('Burritos the size of a bug\'s head. Everyone is fed and happy.'); this.morning(); } },
      { label: 'Feed the hungriest ' + canFeed + ' member' + (canFeed === 1 ? '' : 's') + ', others go without', right: fmtMoney(price * canFeed), icon: 'bread', disabled: canFeed === 0 || canFeed === n, onSelect: () => {
        const sorted = r.members.slice().sort((a, b) => b.hunger - a.hunger || a.stamina - b.stamina);
        sorted.forEach((m, i) => { if (i < canFeed) { m.hunger = 0; m.stamina = Math.min(100, m.stamina + 65); } else { m.hunger++; m.stamina = Math.min(100, m.stamina + 25); } });
        r.money -= price * canFeed; Audio.ui('eat'); this.log.push(canFeed + ' ate. ' + sorted.slice(canFeed).map(m => m.name).join(', ') + ' went hungry.'); this.morning(); } },
      { label: 'Cheap snacks for all (hunger stays as it is)', right: fmtMoney(Math.ceil(price / 2) * n), icon: 'bar', disabled: r.money < Math.ceil(price / 2) * n, onSelect: () => { r.money -= Math.ceil(price / 2) * n; r.members.forEach(m => { m.stamina = Math.min(100, m.stamina + 40); }); Audio.ui('eat'); this.log.push('Vending machine chips. Nobody is full, nobody starves.'); this.morning(); } },
      { label: 'Skip dinner (everyone +1 hunger)', icon: 'event', onSelect: () => { r.members.forEach(m => { m.hunger++; m.stamina = Math.min(100, m.stamina + 25); }); Audio.ui('sad'); this.log.push('Stomachs growl in a minor key.'); this.morning(); } },
    ]);
  }
  morning() {
    const r = Game.run; this.phase = 'morning';
    const leaving = r.members.filter(m => m.hunger >= 2);
    for (const m of leaving) {
      if (m.leader) { this.gameOver = 'You collapsed from hunger on the sidewalk. The orchestra disbands.'; continue; }
      r.members.splice(r.members.indexOf(m), 1);
      this.log.push(m.name + ' the ' + SPECIES[m.species].name + ' left at dawn to find food elsewhere.');
    }
    if (!this.gameOver && r.members.some(m => m.hunger === 1)) this.log.push('Hungry bugs play with shaky hands (smaller timing windows).');
    r.day++; r.nightPending = false; r.dayBannerPending = true; r.buffs = r.buffs || {};
    if (!this.gameOver) this.log.push('A new day. ' + DAY_NAMES[Math.min(4, r.day)] + ' awaits.');
    r.save();
    this.menu = new Menu([{ label: this.gameOver ? '...' : 'Continue to the map', onSelect: () => { if (this.gameOver) Game.setScene(new GameOverScene(this.gameOver)); else Game.setScene(new MapScene()); } }]);
  }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const r = Game.run;
    rect(ctx, 0, 0, W, H, this.phase === 'dinner' ? '#0a0818' : '#3a3a68');
    if (this.phase === 'dinner') { drawBackdropCity(ctx, this.t); rect(ctx, 0, 160, W, 110, '#1e1a2e'); }
    else { const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#5a6ab0'); grad.addColorStop(1, '#f0b070'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H); rect(ctx, 0, 160, W, 110, '#3a3448'); }
    // table
    rect(ctx, 120, 190, 240, 6, '#7a4a2a'); rect(ctx, 130, 196, 6, 30, '#5a3a1a'); rect(ctx, 344, 196, 6, 30, '#5a3a1a');
    ctx.drawImage(propSprite('lamp'), 100, 150);
    r.members.forEach((m, i) => { drawBug(ctx, m.species, 130 + i * 36, 172 + Math.round(Math.sin(this.t * 2 + i) * 0.5), { pose: 'stand' }); if (this.phase === 'morning' && m.hunger === 0) circle(ctx, 146 + i * 36, 188, 3, '#e0c080'); });
    panel(ctx, 30, 20, W - 60, 120);
    if (this.phase === 'dinner') {
      drawText(ctx, 'NIGHTFALL - DAY ' + (r.day + 1), 38, 26, '#ffe14d', { scale: 2 });
      drawText(ctx, 'Meals cost ' + fmtMoney(r.mealPrice()) + ' per bug tonight. You have ' + fmtMoney(r.money) + '.', 38, 44, '#e0dcf0');
      drawText(ctx, 'A full meal resets hunger and restores 65 stamina. STARVING bugs (hunger 2) leave at dawn.', 38, 52, '#9a8fd0');
      this.menu.draw(ctx, 38, 66, W - 76, 12);
      const hungry = r.members.filter(m => m.hunger > 0);
      if (hungry.length) drawText(ctx, 'Already hungry: ' + hungry.map(m => m.name + (m.hunger >= 2 ? ' (STARVING)' : '')).join(', '), 38, 124, '#ff9f68');
    } else {
      drawText(ctx, 'MORNING', 38, 26, '#ffe14d', { scale: 2 });
      let y = 44; for (const l of this.log) y += drawWrapped(ctx, l, 38, y, 100, '#e0dcf0') * 7 + 2;
      this.menu.draw(ctx, 38, Math.max(y + 4, 118), W - 76, 12);
    }
    Game.drawRunHud(ctx);
  }
}

class GameOverScene {
  constructor(reason) { this.reason = reason; this.t = 0; RunState.clearSave(); Audio.ui('sad'); this.menu = new Menu([{ label: 'Back to title', onSelect: () => { Game.run = null; Game.setScene(new TitleScene()); } }]); }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#100c14');
    const r = Game.run;
    drawText(ctx, 'THE SHOW IS OVER', W / 2, 40, '#ff5a5a', { align: 'center', scale: 3 });
    drawWrapped(ctx, this.reason, W / 2 - 150, 74, 75, '#e0dcf0');
    if (r) {
      drawText(ctx, 'Days survived: ' + (r.day + 1), W / 2, 110, '#cfc9e6', { align: 'center' });
      drawText(ctx, 'Total tips earned: ' + fmtMoney(r.stats.earned), W / 2, 120, '#cfc9e6', { align: 'center' });
      drawText(ctx, 'Gigs played: ' + r.stats.gigs + '   Best combo: ' + r.stats.bestCombo, W / 2, 130, '#cfc9e6', { align: 'center' });
      drawBug(ctx, r.members[0].species, W / 2 - 8, 150, { pose: 'stand' });
    }
    this.menu.draw(ctx, W / 2 - 50, 200, 100, 12);
  }
}

class VictoryScene {
  constructor() { this.t = 0; const r = Game.run; RunState.clearSave(); Audio.ui('fanfare'); r.day = 5; this.menu = new Menu([{ label: 'Play again', onSelect: () => { Game.run = null; Game.setScene(new TitleScene()); } }]); }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); }
  draw(ctx) {
    const r = Game.run;
    const grad = ctx.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, '#f0a060'); grad.addColorStop(1, '#3a2a58'); ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    rect(ctx, 0, 170, W, 100, '#8a2a1a'); rect(ctx, 0, 170, W, 3, '#c04030');
    for (let x = 40; x < W; x += 160) { rect(ctx, x, 60, 8, 110, '#a03020'); rect(ctx, x + 14, 60, 8, 110, '#a03020'); }
    drawText(ctx, 'ENCORE!', W / 2, 20, '#ffe14d', { align: 'center', scale: 4, shadow: '#6a3a10' });
    drawText(ctx, 'Your orchestra headlined the Golden Gate. San Francisco hums your tunes.', W / 2, 50, '#fff', { align: 'center' });
    r.members.forEach((m, i) => drawBug(ctx, m.species, W / 2 - r.members.length * 12 + i * 24, 150 + Math.round(Math.sin(this.t * 5 + i) * 2), { pose: 'play', instrument: m.instrument }));
    for (let i = 0; i < 20; i++) { const x = (i * 97 + this.t * 30) % W, y = (i * 53 + this.t * 40) % 170; rect(ctx, x, y, 2, 2, ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][i % 5]); }
    panel(ctx, W / 2 - 100, 70, 200, 60);
    drawText(ctx, 'FINAL SCORE: ' + fmtMoney(r.money), W / 2, 76, '#ffe680', { align: 'center', scale: 2 });
    drawText(ctx, 'Total tips: ' + fmtMoney(r.stats.earned) + '   Gigs: ' + r.stats.gigs, W / 2, 96, '#e0dcf0', { align: 'center' });
    drawText(ctx, 'Best combo: ' + r.stats.bestCombo + '   Perfects: ' + r.stats.perfects + '   Band size: ' + r.members.length, W / 2, 106, '#e0dcf0', { align: 'center' });
    this.menu.draw(ctx, W / 2 - 50, 118, 100, 12);
  }
}
