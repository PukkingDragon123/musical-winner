// ---------- The city map: oblique San Francisco with Spire paths ----------
'use strict';
let _cityCache = null;
function zoneOfRow(r) { return r >= 15 ? 'bridge' : r >= 12 ? 'park' : r >= 9 ? 'water' : r >= 6 ? 'china' : r >= 3 ? 'down' : 'mission'; }
function buildCity(map) {
  if (_cityCache && _cityCache.seed === map.citySeed) return _cityCache;
  const rng = makeRng(map.citySeed); const c = makeCanvas(W, MAP_HEIGHT); const x = c.getContext('2d');
  const rowY = (r) => MAP_TOP + (MAP_ROWS - r) * MAP_ROW_H + 40, colX = (cc) => MAP_X0 + cc * MAP_COL_W;
  const water = [], trees = [], lamps = [];
  // ground
  x.fillStyle = '#4c4a52'; x.fillRect(0, 0, W, MAP_HEIGHT);
  // zone ground tints (sidewalk colour)
  for (let r = -1; r <= MAP_ROWS; r++) { const z = zoneOfRow(Math.max(0, r)); const col = { mission: '#b8ac98', down: '#a8a8ac', china: '#b8a08a', water: '#b0a690', park: '#6fa25a', bridge: '#8a8a94' }[z]; x.fillStyle = col; x.fillRect(0, rowY(r + 1) + 6, W, MAP_ROW_H - 12); }
  // water: bay right side for rows >= 5, ocean left for rows >= 9; all of the bridge row
  const bayX = 572; x.fillStyle = '#3a6a9a'; x.fillRect(bayX, 0, W - bayX, rowY(5) + 30); water.push({ x: bayX, y: 0, w: W - bayX, h: rowY(5) + 30 });
  x.fillRect(0, 0, 44, rowY(9) + 30); water.push({ x: 0, y: 0, w: 44, h: rowY(9) + 30 });
  x.fillRect(0, 0, W, rowY(15) + 24); water.push({ x: 0, y: 0, w: W, h: rowY(15) + 24 });
  // shoreline sand
  x.fillStyle = '#c8b890'; x.fillRect(bayX - 3, 0, 3, rowY(5) + 30); x.fillRect(44, 0, 3, rowY(9) + 30);
  // blocks between avenues and streets
  for (let r = 0; r < MAP_ROWS; r++) for (let cc = -1; cc <= MAP_COLS - 1; cc++) {
    const z = zoneOfRow(r + 1);
    const bx0 = cc < 0 ? 48 : colX(cc) + 9, bx1 = cc >= MAP_COLS - 1 ? bayX - 6 : colX(cc + 1) - 9;
    const by0 = rowY(r + 1) + 8, by1 = rowY(r) - 8;
    if (bx1 - bx0 < 14 || by1 - by0 < 10) continue;
    if (z === 'water' && cc >= MAP_COLS - 1) { // piers
      x.fillStyle = '#8a6a4a'; x.fillRect(bx0, by0 + 6, bx1 - bx0 + 24, 14); x.fillStyle = '#6a4a2a'; for (let px2 = bx0; px2 < bx1 + 24; px2 += 4) x.fillRect(px2, by0 + 6, 1, 14); continue;
    }
    if (z === 'park' || (z === 'mission' && r === 1 && cc === 1)) { // park cells
      x.fillStyle = '#5f9a4a'; x.fillRect(bx0, by0, bx1 - bx0, by1 - by0); x.fillStyle = '#7fb85a'; for (let i = 0; i < 12; i++) x.fillRect(bx0 + rng.int(0, bx1 - bx0 - 2), by0 + rng.int(0, by1 - by0 - 1), 2, 1);
      const n = rng.int(2, 4); for (let i = 0; i < n; i++) trees.push({ x: bx0 + rng.int(4, Math.max(5, bx1 - bx0 - 14)), y: by0 + rng.int(8, Math.max(9, by1 - by0 - 2)), v: rng.pick(['round', 'round', 'light', 'palm', 'pine']) });
      if (rng.chance(0.4)) { x.fillStyle = '#6fa8d8'; x.fillRect(bx0 + 10, by0 + 8, Math.min(30, bx1 - bx0 - 20), 8); }
      continue;
    }
    // buildings in the block
    const style = { mission: rng.pick(['victorian', 'pastel']), down: 'downtown', china: rng.pick(['chinatown', 'brick']), water: rng.pick(['brick', 'victorian']), bridge: 'victorian' }[z];
    let px2 = bx0; const depth = 10;
    while (px2 < bx1 - 10) {
      const bw = Math.min(bx1 - px2, rng.int(18, 40)); if (bw < 12) break;
      const hgt = z === 'down' ? rng.int(24, 46) : z === 'china' ? rng.int(14, 26) : rng.int(12, 22);
      const b = blockCanvas(rng.int(1, 99999), bw - 2, depth, hgt, style);
      x.drawImage(b, px2, by1 - b.height + 2); px2 += bw;
    }
    if (rng.chance(0.5)) lamps.push({ x: bx0 + 2, y: by1 - 2 });
  }
  // streets
  x.fillStyle = '#3f3f48';
  for (let r = 0; r <= MAP_ROWS; r++) { const y = rowY(r); if (r === MAP_ROWS) continue; x.fillRect(0, y - 7, bayX, 14); }
  for (let cc = 0; cc < MAP_COLS; cc++) { const xx = colX(cc); x.fillRect(xx - 7, rowY(MAP_ROWS - 1) - 7, 14, rowY(0) - rowY(MAP_ROWS - 1) + 14); }
  x.fillStyle = '#d8c860';
  for (let r = 0; r < MAP_ROWS; r++) { const y = rowY(r); for (let xx = 0; xx < bayX; xx += 12) x.fillRect(xx, y, 6, 1); }
  for (let cc = 0; cc < MAP_COLS; cc++) { const xx = colX(cc); for (let yy = rowY(MAP_ROWS - 1); yy < rowY(0); yy += 12) x.fillRect(xx, yy, 1, 6); }
  // crosswalks at node intersections
  x.fillStyle = '#e8e8e0'; for (const n of map.nodes) { if (n.type === 'boss') continue; for (let k = -6; k <= 6; k += 3) { x.fillRect(n.x + k, n.y - 12, 2, 4); x.fillRect(n.x + k, n.y + 8, 2, 4); } }
  // landmarks
  x.drawImage(landmarkCanvas('sutro'), 6, rowY(2) - 70, 30, 60);
  x.drawImage(landmarkCanvas('transamerica'), bayX - 28, rowY(7) - 66);
  x.drawImage(landmarkCanvas('coit'), bayX - 30, rowY(10) - 40);
  x.drawImage(landmarkCanvas('ferry'), bayX - 2, rowY(9) - 62);
  // painted ladies row on the left of downtown
  const cols = ['#c86a8a', '#6a9ac8', '#c8b06a', '#8ac86a', '#a86ac8', '#e0a070']; for (let i = 0; i < 6; i++) { const b = blockCanvas(500 + i, 10, 6, 16, 'pastel'); x.drawImage(b, 50 + i * 12 - 2, rowY(4) - 30); x.fillStyle = cols[i]; x.fillRect(50 + i * 12, rowY(4) - 22, 8, 12); }
  // Alcatraz
  x.fillStyle = '#6a6a5a'; x.fillRect(bayX + 14, rowY(12) - 8, 40, 14); x.fillStyle = '#d8d0c0'; x.fillRect(bayX + 22, rowY(12) - 16, 22, 10); x.fillStyle = '#e8e0d0'; x.fillRect(bayX + 30, rowY(12) - 22, 6, 6);
  // bridge across the top
  x.drawImage(landmarkCanvas('bridge'), 40, rowY(15) - 60, 280, 98); x.drawImage(landmarkCanvas('bridge'), 320, rowY(15) - 60, 280, 98);
  // trees & lamps
  for (const t of trees) x.drawImage(treeCanvas(t.v, 0), t.x - 10, t.y - 34, 20, 28);
  for (const l of lamps) x.drawImage(propCanvas('lamp'), l.x, l.y - 18, 5, 18);
  // labels
  const lbl = (txt, r, side) => { const y = rowY(r) - 28; const tx = side === 'l' ? 52 : bayX - 8; };
  _cityCache = { seed: map.citySeed, canvas: c, water, trees, rowY, colX, bayX };
  return _cityCache;
}
class MapScene {
  constructor(intro) {
    this.t = 0; this.dayBanner = intro ? 3 : 0; this.city = buildCity(Game.run.map);
    this.cars = []; const r = makeRng(5); for (let i = 0; i < 10; i++) this.cars.push({ row: r.int(0, MAP_ROWS - 1), x: r.range(0, 560), dir: r.sign(), sp: r.range(16, 32), seed: r.int(1, 9999) });
    this.peds = []; for (let i = 0; i < 40; i++) this.peds.push({ row: r.int(0, MAP_ROWS - 1), x: r.range(50, 560), dir: r.sign(), sp: r.range(5, 10), col: r.pick(NPC_PALETTES), o: r.range(0, 6) });
    this.clouds = []; for (let i = 0; i < 8; i++) this.clouds.push({ x: r.range(-40, W), y: r.range(0, MAP_HEIGHT), sp: r.range(4, 9) });
    this.refresh(); this.travel = null;
    this.buttons = [new Btn(W - 118, H - 20, 112, 18, 'BAND & BAG', () => Game.setScene(new BandScene())), new Btn(W - 236, H - 20, 112, 18, 'SAVE & QUIT', () => { Game.run.save(); Game.setScene(new TitleScene()); }, { color: '#8a6a3a', hi: '#b08a50', lo: '#5a4020', ol: '#3a2810' })];
  }
  enter() { const r = Game.run; if (r.dayBannerPending) { this.dayBanner = 3; r.dayBannerPending = false; } }
  refresh() { const r = Game.run, cur = r.current; this.avail = cur ? cur.next.slice() : r.map.grid[0].filter(Boolean); this.sel = Math.floor(this.avail.length / 2); this.camY = clamp((cur ? cur.y : this.avail[0].y) - 200, 0, MAP_HEIGHT - (H - 18)); }
  update(dt) {
    this.t += dt; this.dayBanner = Math.max(0, this.dayBanner - dt); this.userPan = Math.max(0, (this.userPan || 0) - dt);
    const cur = Game.run.current; const focusY = this.travel ? lerp(this.travel.from.y, this.travel.to.y, this.travel.t) : (cur ? cur.y : this.avail[0].y);
    if (this.userPan <= 0) this.camY = lerp(this.camY, clamp(focusY - 200, 0, MAP_HEIGHT - (H - 18)), Math.min(1, dt * 4));
    for (const c of this.cars) { c.x += c.dir * c.sp * dt; if (c.x < -30) { c.x = 590; c.row = Math.floor(Math.random() * MAP_ROWS); } if (c.x > 590) { c.x = -30; c.row = Math.floor(Math.random() * MAP_ROWS); } }
    for (const p of this.peds) { p.x += p.dir * p.sp * dt; if (p.x < 50 || p.x > 560) p.dir *= -1; }
    for (const cl of this.clouds) { cl.x += cl.sp * dt * (0.5 + Game.wind.v); if (cl.x > W + 50) cl.x = -60; if (cl.x < -70) cl.x = W + 40; }
    if (this.travel) { this.travel.t += dt / 0.9; if (this.travel.t >= 1) { const n = this.travel.to; this.travel = null; this.enterNode(n); } }
  }
  key(code) {
    if (this.travel) return;
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + this.avail.length) % this.avail.length; Audio.ui('move'); }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % this.avail.length; Audio.ui('move'); }
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) this.go(this.avail[this.sel]);
    else if (code === 'Tab' || code === 'KeyB') Game.setScene(new BandScene());
    else if (code === 'Escape') { Game.run.save(); Game.setScene(new TitleScene()); }
  }
  tap(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { Audio.ui('select'); b.onTap(); return; }
    const reach = Game.touch ? 18 : 12; let best = null, bestD = Infinity;
    for (const n of this.avail) { const d = Math.hypot(x - n.x, y - (n.y - this.camY + 18)); if (d < reach && d < bestD) { best = n; bestD = d; } }
    if (best) this.go(best);
  }
  pointerDown(x, y, id) { this.drag = { y, camY: this.camY, moved: 0, id }; }
  pointerMove(x, y, id) { if (!this.drag || this.drag.id !== id) return; const dy = y - this.drag.y; this.drag.moved = Math.max(this.drag.moved, Math.abs(dy)); if (this.drag.moved > 5) { this.camY = clamp(this.drag.camY - dy, 0, MAP_HEIGHT - (H - 18)); this.userPan = 3; } }
  pointerUp(x, y, id) { if (!this.drag || this.drag.id !== id) return; const moved = this.drag.moved; this.drag = null; if (moved <= 5 && x >= 0 && !this.travel) this.tap(x, y); }
  hover(x, y) { this.avail.forEach((n, i) => { if (Math.hypot(x - n.x, y - (n.y - this.camY + 18)) < 12) this.sel = i; }); this.hoverNode = Game.run.map.nodes.find(n => Math.hypot(x - n.x, y - (n.y - this.camY + 18)) < 10) || null; }
  go(node) {
    const r = Game.run; if (!node || this.travel) return; Audio.ui('select');
    const from = r.current || { x: node.x, y: node.y + 50 }; this.travel = { from, to: node, t: 0 };
  }
  enterNode(node) {
    const r = Game.run; node.visited = true; r.current = node; r.save();
    switch (node.type) {
      case 'gig': case 'elite': case 'boss': case 'openmic': Game.setScene(new PerformScene(node)); break;
      case 'shop': Game.setScene(new ShopScene(node)); break;
      case 'event': Game.setScene(new EventScene(node)); break;
      case 'rest': Game.setScene(new RestScene(node)); break;
      case 'treasure': Game.setScene(new TreasureScene(node)); break;
    }
  }
  nodeColor(n) { return { gig: '#5bc0ff', elite: '#ffd24a', boss: '#ff5a5a', shop: '#f0a050', event: '#8ad8ff', rest: '#d05070', treasure: '#ffd24a', openmic: '#c58bff' }[n.type] || '#fff'; }
  nodeLabel(n) { return { gig: 'GIG', elite: 'BIG GIG', boss: 'THE FINALE', shop: 'MUSIC SHOP', event: '???', rest: 'REST STOP', treasure: 'LOST & FOUND', openmic: 'OPEN MIC' }[n.type]; }
  draw(ctx) {
    const r = Game.run, cam = Math.round(this.camY), city = this.city;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 18, W, H - 18); ctx.clip();
    ctx.drawImage(city.canvas, 0, -cam + 18);
    // animated water
    for (const wr of city.water) { for (let yy = wr.y; yy < wr.y + wr.h; yy += 6) { const sy = yy - cam + 18; if (sy < 18 || sy > H) continue; const off = Math.floor((this.t * 12 + yy * 0.7) % 24); for (let xx = wr.x + off - 24; xx < wr.x + wr.w; xx += 24) { if (xx > wr.x && xx + 8 < wr.x + wr.w) rect(ctx, xx, sy, 8, 1, '#6a9ac8'); } } }
    // boats
    ctx.drawImage(propCanvas('sailboat'), 590 + Math.sin(this.t * 0.5) * 10, city.rowY(8) - cam + 18 - 20); ctx.drawImage(propCanvas('boat'), 580, city.rowY(13) - cam + 18 + 6);
    // cars & peds
    for (const c of this.cars) { const y = city.rowY(c.row) - cam + 18 - (c.dir > 0 ? 6 : 0); if (y < 10 || y > H) continue; ctx.drawImage(carCanvas(c.seed, c.dir), Math.round(c.x), Math.round(y - 4), 22, 10); }
    for (const p of this.peds) { const y = city.rowY(p.row) - cam + 18 - 9 + Math.round(Math.sin(this.t * 8 + p.o)) * 0; if (y < 10 || y > H) continue; rect(ctx, p.x, y - 3, 2, 3, p.col); rect(ctx, p.x, y - 4, 2, 1, '#1a1410'); rect(ctx, p.x + (Math.floor(this.t * 6 + p.o) % 2), y, 1, 1, '#1a1410'); }
    // trees sway overlay
    for (const t of city.trees) { const y = t.y - cam + 18; if (y < 0 || y > H + 20) continue; ctx.drawImage(treeCanvas(t.v, Game.wind.frame(Math.floor(t.x / 20))), t.x - 10, y - 34, 20, 28); }
    // day separators
    for (let d = 1; d <= 5; d++) { const y = city.rowY(d * ROWS_PER_DAY - 0.5) - cam + 18; if (y < 18 || y > H) continue; dashedLine(ctx, 46, y, 570, y, '#ffe680', 4, 4, this.t * 10); rect(ctx, 48, y - 10, 92, 9, 'rgba(20,16,30,0.8)'); drawText(ctx, 'NIGHT ' + d + ' - DINNER', 52, y - 8, '#ffe680', { font: 'small' }); if (d < 5) { rect(ctx, 48, y + 2, 100, 9, 'rgba(20,16,30,0.8)'); drawText(ctx, 'DAY ' + (d + 1) + ': ' + DAY_NAMES[d].toUpperCase(), 52, y + 4, '#cfc9e6', { font: 'small' }); } }
    // edges
    for (const n of r.map.nodes) for (const m of n.next) { const onPath = n.visited && m.visited, avail = n === r.current && this.avail.includes(m); const col = onPath ? '#ffe680' : avail ? '#fff' : 'rgba(255,255,255,0.35)'; dashedLine(ctx, n.x, n.y - cam + 18, m.x, m.y - cam + 18, col, 3, 4, avail ? this.t * 14 : 0); }
    // nodes
    for (const n of r.map.nodes) {
      const y = n.y - cam + 18; if (y < 8 || y > H + 10) continue;
      const isCur = n === r.current, isAvail = this.avail.includes(n) && !this.travel; const big = n.type === 'boss' || n.type === 'elite';
      const bob = isAvail ? Math.round(Math.sin(this.t * 5 + n.c) * 2) : 0;
      drawShadow(ctx, n.x, y + 8, 14, 0.3);
      if (isAvail) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(this.t * 6); circle(ctx, n.x, y, 14, this.avail[this.sel] === n ? '#fff' : this.nodeColor(n)); ctx.globalAlpha = 1; }
      // signpost marker
      const my = y - 6 + bob; rect(ctx, n.x - 1, my + 6, 3, 8, UI.woodLo);
      circle(ctx, n.x, my, big ? 10 : 8, UI.woodLo); circle(ctx, n.x, my, big ? 9 : 7, n.visited && !isCur ? '#6b5f6a' : n.type === 'boss' ? '#5a1a2a' : UI.paper);
      ringPx(ctx, n.x, my, big ? 9 : 7, n.visited && !isCur ? '#3a3040' : this.nodeColor(n));
      const ic = icon(n.type); ctx.globalAlpha = n.visited && !isCur ? 0.5 : 1; ctx.drawImage(ic, n.x - Math.floor(ic.width / 2), my - Math.floor(ic.height / 2)); ctx.globalAlpha = 1;
      if (n.bossMod && !n.visited) { const bm = BOSS_MODS[n.bossMod]; rect(ctx, n.x - 6, my - 20, 12, 8, bm.color); frame(ctx, n.x - 6, my - 20, 12, 8, '#1a1410'); ctx.drawImage(icon('skull'), n.x - 3, my - 19, 7, 6); }
    }
    // party
    const cur = r.current; const px0 = this.travel ? lerp(this.travel.from.x, this.travel.to.x, easeInOut(this.travel.t)) : (cur ? cur.x : this.avail[this.sel].x), py0 = (this.travel ? lerp(this.travel.from.y, this.travel.to.y, easeInOut(this.travel.t)) : (cur ? cur.y : this.avail[this.sel].y + 40)) - cam + 18;
    const walking = !!this.travel; const dirX = this.travel ? Math.sign(this.travel.to.x - this.travel.from.x) || 1 : 1;
    r.members.slice().reverse().forEach((m, k) => { const i = r.members.length - 1 - k; const ox = -i * 14 * dirX, oy = i * 3 + (walking ? 0 : 0); drawShadow(ctx, px0 + ox, py0 + 2 + oy, 14, 0.3); drawBugAt(ctx, m.spec, px0 + ox, py0 - 8 + oy + (walking ? 0 : Math.round(Math.sin(this.t * 5 + i))), { pose: walking ? (Math.floor(this.t * 8 + i) % 2 ? 'walk1' : 'walk2') : 'idle', flip: dirX < 0, scale: 0.75, instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null }); });
    if (!cur && !this.travel) drawText(ctx, 'START HERE', this.avail[this.sel].x, this.avail[this.sel].y - cam + 18 + 14, '#ffe680', { align: 'center', outline: '#1a1410' });
    // clouds
    for (const cl of this.clouds) { const y = cl.y - cam * 0.5 + 18; if (y < -20 || y > H) continue; ctx.globalAlpha = 0.18; rect(ctx, cl.x + 8, y + 8, 40, 10, '#000'); ctx.globalAlpha = 0.85; ctx.drawImage(propCanvas('cloud'), Math.round(cl.x), Math.round(y)); ctx.globalAlpha = 1; }
    ctx.restore();
    // tooltip for selected / hovered node
    const s = (this.hoverNode && !this.avail.includes(this.hoverNode)) ? this.hoverNode : this.avail[this.sel];
    if (s && !this.travel) {
      const lines = [this.nodeLabel(s) + (s.venue ? ': ' + VENUES[s.venue].name.toUpperCase() : '')];
      if (s.bossMod) { const bm = BOSS_MODS[s.bossMod]; lines.push(bm.name.toUpperCase() + ' - ' + bm.desc); }
      const w = Math.max(...lines.map(l => textWidth(l, { font: 'small' }))) + 12; const tx = clamp(s.x - w / 2, 4, W - w - 4), ty = s.y - cam + 18 - 34 - (lines.length - 1) * 8;
      rect(ctx, tx, ty - 2, w, 8 + lines.length * 8, 'rgba(20,16,30,0.9)'); frame(ctx, tx, ty - 2, w, 8 + lines.length * 8, s.bossMod ? BOSS_MODS[s.bossMod].color : this.nodeColor(s));
      lines.forEach((l, i) => drawText(ctx, l, tx + 6, ty + 1 + i * 8, i === 0 ? this.nodeColor(s) : '#f4efe0', { font: 'small' }));
    }
    // bottom bar
    rect(ctx, 0, H - 24, W, 24, 'rgba(20,16,30,0.85)'); for (const b of this.buttons) b.draw(ctx);
    drawText(ctx, Game.touch ? 'DRAG TO SCROLL - TAP A GLOWING STOP' : 'LEFT/RIGHT + ENTER TO TRAVEL   -   TAB: BAND', 8, H - 15, '#cfc9e6', { font: 'small' });
    drawText(ctx, 'DINNER TONIGHT: ' + fmtMoney(r.mealPrice()) + ' x ' + r.members.length + ' = ' + fmtMoney(r.mealPrice() * r.members.length), 8, H - 8, r.money >= r.mealPrice() * r.members.length ? '#6be585' : '#ff9f68', { font: 'small' });
    Game.drawHud(ctx);
    if (this.dayBanner > 0) { ctx.globalAlpha = clamp(this.dayBanner, 0, 1); rect(ctx, 0, 130, W, 60, 'rgba(10,8,20,0.85)'); uiRibbon(ctx, W / 2, 138, 'DAY ' + (r.day + 1) + ' - ' + DAY_NAMES[Math.min(4, r.day)].toUpperCase(), { scale: 2 }); drawText(ctx, r.day === 0 ? 'Six dollars. One guitar. Let\'s go.' : 'Dinner costs ' + fmtMoney(r.mealPrice()) + ' per bug tonight.', W / 2, 172, '#f4efe0', { align: 'center' }); ctx.globalAlpha = 1; }
  }
}
