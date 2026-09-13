// ---------- San Francisco: a living map, travelled with Uber tickets ----------
'use strict';
const MAP_C = { land: '#f3efe4', landHi: '#faf7ee', park: '#c9e6b0', parkDk: '#b2d795', water: '#a6d0ee', waterDk: '#8fc0e4',
  road: '#ffffff', roadBig: '#ffe9a8', roadEdge: '#ddd7c8', bldg: '#e4dfd2', bldgEdge: '#d0c9b8', ink: '#5d6a5d', inkSoft: '#8a927f', hill: '#eae3d0' };
let _sfCache = null;
function buildSF() {
  if (_sfCache) return _sfCache;
  const c = makeCanvas(MAPW, MAPH), x = c.getContext('2d'); const r = makeRng(4242);
  x.fillStyle = MAP_C.land; x.fillRect(0, 0, MAPW, MAPH);
  const poly = (ctx2, pts, fill) => { ctx2.fillStyle = fill; ctx2.beginPath(); ctx2.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx2.lineTo(pts[i][0], pts[i][1]); ctx2.closePath(); ctx2.fill(); };
  for (const w of WATER) poly(x, w.poly, MAP_C.water);
  // district grounds
  for (const d of DISTRICTS) { if (d.park) poly(x, d.poly, MAP_C.park); else if (d.hill) poly(x, d.poly, MAP_C.hill); }
  // building footprints
  for (const d of DISTRICTS) {
    if (d.park) continue;
    const xs = d.poly.map(p => p[0]), ys = d.poly.map(p => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const dense = /FINANCIAL|SOMA|CHINATOWN|NORTH BEACH|NOB/.test(d.name);
    for (let by = y0 + 8; by < y1 - 12; by += dense ? 16 : 22) for (let bx = x0 + 8; bx < x1 - 12; bx += dense ? 19 : 27) {
      if (r.chance(dense ? 0.8 : 0.5)) { const w = r.int(9, dense ? 16 : 21), h = r.int(7, dense ? 13 : 16);
        x.fillStyle = MAP_C.bldgEdge; x.fillRect(bx + 1, by + 1, w, h); x.fillStyle = MAP_C.bldg; x.fillRect(bx, by, w, h); }
    }
  }
  // park detail: trees and paths
  for (const d of DISTRICTS) { if (!d.park) continue; const xs = d.poly.map(p => p[0]), ys = d.poly.map(p => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let i = 0; i < (x1 - x0) / 9; i++) { const tx = r.int(x0 + 6, x1 - 6), ty = r.int(y0 + 6, y1 - 6); circle(x, tx, ty, r.int(3, 6), MAP_C.parkDk); circle(x, tx - 1, ty - 2, r.int(1, 2), '#dcf0c6'); }
    x.strokeStyle = '#e8e2cc'; x.lineWidth = 5; x.beginPath(); x.moveTo(x0 + 4, (y0 + y1) / 2); for (let px2 = x0 + 4; px2 < x1; px2 += 30) x.lineTo(px2, (y0 + y1) / 2 + Math.sin(px2 * 0.05) * 10); x.stroke();
  }
  // streets: casing then fill
  const drawRoad = (st, pass) => {
    x.lineJoin = 'round'; x.lineCap = 'round'; x.beginPath(); x.moveTo(st.pts[0][0], st.pts[0][1]);
    for (let i = 1; i < st.pts.length; i++) x.lineTo(st.pts[i][0], st.pts[i][1]);
    x.lineWidth = (st.big ? 16 : 10) - (pass ? 4 : 0); x.strokeStyle = pass ? (st.big ? MAP_C.roadBig : MAP_C.road) : MAP_C.roadEdge; x.stroke();
  };
  // graph roads (travel network) drawn as real streets too
  const G = buildGraph();
  for (const pass of [0, 1]) {
    for (const [a, b] of EDGES) { const na = G[a], nb = G[b]; if (!na || !nb) continue;
      x.lineCap = 'round'; x.beginPath(); x.moveTo(na.x, na.y); x.lineTo(nb.x, nb.y); x.lineWidth = 12 - (pass ? 4 : 0); x.strokeStyle = pass ? MAP_C.road : MAP_C.roadEdge; x.stroke(); }
    for (const st of STREETS) drawRoad(st, pass);
  }
  // bridges
  x.strokeStyle = '#c8432a'; x.lineWidth = 9; x.beginPath(); x.moveTo(225, 132); x.lineTo(90, 30); x.stroke();
  x.strokeStyle = '#9aa0b0'; x.lineWidth = 8; x.beginPath(); x.moveTo(1342, 705); x.lineTo(1500, 645); x.stroke();
  // alcatraz
  circle(x, 1350, 195, 24, '#d8d2c0'); circle(x, 1350, 195, 20, MAP_C.bldg); x.fillStyle = '#b8b2a0'; x.fillRect(1338, 186, 24, 12);
  // street labels
  x.save();
  for (const st of STREETS) {
    const i = Math.floor(st.pts.length / 2) - 1, a = st.pts[Math.max(0, i)], b = st.pts[Math.min(st.pts.length - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    x.save(); x.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); x.rotate(Math.abs(ang) > Math.PI / 2 ? ang + Math.PI : ang);
    drawText(x, st.name, 0, -2, MAP_C.ink, { align: 'center', font: 'small' }); x.restore();
  }
  x.restore();
  // district labels
  for (const d of DISTRICTS) { const t = d.name.split('').join(' '); drawText(x, t, d.x, d.y, MAP_C.inkSoft, { align: 'center' }); }
  for (const w of WATER) if (w.name) { const xs = w.poly.map(p => p[0]), ys = w.poly.map(p => p[1]); drawText(x, w.name.split('').join(' '), (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, '#6f9cc4', { align: 'center' }); }
  for (const d of MAP_DETAILS) if (d.kind === 'label') drawText(x, d.text, d.x, d.y, '#6f9cc4', { align: 'center' });
  _sfCache = { canvas: c, graph: G };
  return _sfCache;
}
const PIN_COLOR = { venue: '#e0523c', shop: '#3f7fd0', food: '#e09030', recruit: '#9b59d0', event: '#2fa36b', rest: '#3fa8b8', pickup: '#d9a520', home: '#666' };
function drawPin(ctx, x, y, node, opts = {}) {
  const col = opts.done ? '#9a9a94' : (PIN_COLOR[node.type] || '#e0523c'), big = opts.sel ? 1 : 0;
  const h = 30 + big * 4, w = 24 + big * 3;
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y + 1, 9 + big, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w / 2, y - h * 0.55); ctx.lineTo(x - w / 2, y - h + 4);
  ctx.arc(x, y - h + 6, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y - h * 0.55); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = darken(col, 0.25); ctx.lineWidth = 1; ctx.stroke();
  circle(ctx, x, y - h + 6, w / 2 - 4, '#fff8ee');
  const ic = icon(node.icon || 'event'); ctx.drawImage(ic, Math.round(x - ic.width * 0.7), Math.round(y - h + 6 - ic.height * 0.7), Math.round(ic.width * 1.4), Math.round(ic.height * 1.4));
  if (opts.done) { ctx.globalAlpha = 0.5; circle(ctx, x, y - h + 6, w / 2 - 4, '#fff'); ctx.globalAlpha = 1; ctx.drawImage(icon('check'), Math.round(x - 5), Math.round(y - h + 2), 11, 9); }
}
class CityScene {
  constructor(arrive) {
    const r = Game.run; this.t = 0; this.sf = buildSF(); this.G = this.sf.graph;
    this.arriveT = arrive ? 2.6 : 0; this.travel = null; this.msg = null; this.msgT = 0;
    this.cam = { x: 0, y: 0 };
    const here = this.G[r.pos] || this.G.ggb; this.centerOn(here, true);
    this.cars = []; const rr = makeRng(9);
    for (let i = 0; i < 16; i++) { const e = rr.pick(EDGES); this.cars.push({ a: e[0], b: e[1], k: rr.range(0, 1), sp: rr.range(0.05, 0.12), seed: rr.int(1, 9999), dir: rr.sign() }); }
    this.people = []; for (let i = 0; i < 40; i++) { const e = rr.pick(EDGES); this.people.push({ a: e[0], b: e[1], k: rr.range(0, 1), sp: rr.range(0.012, 0.03), col: rr.pick(NPC_PALETTES) }); }
    this.fx = new Particles(); this.sel = 0;
    this.grid = tileGrid(this.sf.canvas);
    for (const n of NODES) { const g = this.G[n.id]; if (g) { g.tx = n.tx; g.ty = n.ty; } }
    const r0 = Game.run;
    if (!r0.tile || !tileWalkable(this.grid, r0.tile.tx, r0.tile.ty)) { const h = NODES.find(n => n.id === r0.pos) || NODES[0]; r0.tile = { tx: h.tx, ty: h.ty }; }
    this.tile = { tx: r0.tile.tx, ty: r0.tile.ty };
    this.pos = { x: (this.tile.tx + 0.5) * TILE, y: (this.tile.ty + 0.5) * TILE };
    this.path = [];            // tiles queued by a drag
    this.walking = null;       // {from, to, t}
    this.facing = 1;
    this.refresh();
    this.buttons = [];
  }
  centerOn(p, snap) { const tx = clamp(p.x - W / 2, 0, MAPW - W), ty = clamp(p.y - (H - 60) / 2 - 26, 0, MAPH - (H - 60)); if (snap) { this.cam.x = tx; this.cam.y = ty; } this.target = { x: tx, y: ty }; }
  get here() { return this.G[Game.run.pos]; }
  refresh() { this.reach = NODES.filter(n => this.canEnter(n)); this.sel = 0; this.centerOn(this.pos); }
  nodeAtTile(tx, ty) { return NODES.find(n => n.tx === tx && n.ty === ty && this.canEnter(n)); }
  staminaFor(tiles) { let c = 0; for (const t of tiles) c += tileCost(this.grid, t.tx, t.ty); return c; }
  hopCost(n) { const d = Math.hypot(n.x - this.here.x, n.y - this.here.y); let c = d > 165 ? 2 : 1; if (collectMods(Game.run).cheapTravel) c = Math.max(1, c - 1); return c; }
  canEnter(n) { if (n.id === 'ggb' && Game.run.day < 4) return false; return true; }
  update(dt) {
    const r = Game.run; this.t += dt; this.msgT = Math.max(0, this.msgT - dt); this.arriveT = Math.max(0, this.arriveT - dt);
    this.cam.x = lerp(this.cam.x, this.target.x, Math.min(1, dt * 4)); this.cam.y = lerp(this.cam.y, this.target.y, Math.min(1, dt * 4));
    for (const c of this.cars) { c.k += c.sp * dt; if (c.k > 1) { c.k = 0; const e = EDGES[Math.floor(Math.random() * EDGES.length)]; c.a = e[0]; c.b = e[1]; } }
    for (const p of this.people) { p.k += p.sp * dt; if (p.k > 1) { p.k = 0; const e = EDGES[Math.floor(Math.random() * EDGES.length)]; p.a = e[0]; p.b = e[1]; } }
    this.fx.update(dt, Game.wind.px);
    const W_ = WEATHERS[r.weather] || WEATHERS.clear;
    if (r.weather === 'rain' && Math.random() < dt * 40) this.fx.add({ x: Math.random() * W, y: -4, vx: -20, vy: 260, life: 1.4, color: '#9ec8ee', kind: 'px', size: 1, gravity: 0 });
    if (r.weather === 'fog' && Math.random() < dt * 1.6) this.fx.add({ x: -40, y: 30 + Math.random() * (H - 80), vx: 26, vy: 0, life: 22, kind: 'fog', color: '#e8ecf4', size: 22, grow: 16, alpha: 0.3, gravity: 0 });
    this.stepWalk(dt);
  }
  // ---- tile walking: one step at a time, stamina paid on arrival
  stepWalk(dt) {
    const r = Game.run;
    if (!this.walking && this.path.length) {
      const next = this.path[0];
      const cost = tileCost(this.grid, next.tx, next.ty);
      if (r.stamina < cost) { this.path.length = 0; this.flash('TOO TIRED'); Audio.ui('error'); return; }
      this.walking = { from: { x: this.pos.x, y: this.pos.y }, to: { x: (next.tx + 0.5) * TILE, y: (next.ty + 0.5) * TILE }, t: 0, cost };
      this.facing = this.walking.to.x >= this.walking.from.x ? 1 : -1;
    }
    if (!this.walking) return;
    const wk = this.walking;
    wk.t += dt * 4.4;
    const k = clamp(wk.t, 0, 1);
    this.pos.x = lerp(wk.from.x, wk.to.x, k);
    this.pos.y = lerp(wk.from.y, wk.to.y, k) - Math.sin(k * Math.PI) * 3;   // a little hop per tile
    this.centerOn(this.pos);
    if (k >= 1) {
      const t = this.path.shift();
      this.tile = { tx: t.tx, ty: t.ty }; r.tile = { tx: t.tx, ty: t.ty };
      r.stamina = Math.max(0, r.stamina - wk.cost);
      this.walking = null; this.stepT = (this.stepT || 0) + 1;
      if (this.stepT % 2 === 0) drawDust(this.fx, this.pos.x - this.cam.x, this.pos.y - this.cam.y + 26 + 6, 3, '#cfc6ae');
      const n = this.nodeAtTile(t.tx, t.ty);
      if (n) { this.path.length = 0; r.pos = n.id; this.arrive(n); return; }
      if (r.stamina <= 0) { this.path.length = 0; this.flash('OUT OF STAMINA'); }
    }
  }
  arrive(n) {
    const r = Game.run; r.save();
    const done = r.doneNodes || (r.doneNodes = {});
    switch (n.type) {
      case 'venue': Game.go(() => new GigScene(n), 'curtain', { label: n.name }); break;
      case 'shop': Game.go(() => new ShopScene(n), 'slideL'); break;
      case 'food': Game.go(() => new FoodScene(n), 'slideL'); break;
      case 'recruit': Game.go(() => new RecruitScene(n), 'iris'); break;
      case 'event': Game.go(() => new EventScene(n), 'iris'); break;
      case 'rest': Game.go(() => new RestScene(n), 'fade'); break;
      case 'pickup': {
        if (done[n.id] === r.day) { this.flash('NOTHING LEFT HERE'); break; }
        done[n.id] = r.day;
        const roll = r.rng();
        if (roll < 0.4) { const c = 6 + r.day * 3; r.money += c; this.flash('FOUND ' + fmtMoney(c)); Audio.ui('coin'); }
        else if (roll < 0.7) { r.tickets += 2; this.flash('+2 UBER TICKETS'); Audio.ui('select'); }
        else if (roll < 0.88) { const k = r.rng.pick(CONSUMABLE_KEYS); if (r.consumables.length < 6) { r.consumables.push(k); this.flash('FOUND ' + CONSUMABLES[k].name.toUpperCase()); } else { r.money += 8; this.flash('POCKETS FULL. +$8'); } Audio.ui('coin'); }
        else { const k = r.randomCharm(); if (k && r.addCharm(k)) { this.flash('FOUND ' + CHARMS[k].name.toUpperCase()); Audio.ui('fanfare'); } else { r.money += 12; this.flash('+$12'); } }
        this.refresh(); r.save(); break;
      }
      default: this.refresh();
    }
  }
  flash(msg) { this.msg = msg; this.msgT = 2.2; this.fx.burst(W / 2, 120, 14, { color: ['#ffd24a', '#fff'], speed: 90, life: 0.6, kind: 'star', size: 2, gravity: 120 }); }
  go(n) {
    const r = Game.run; if (this.walking || this.path.length || !n) return;
    const route = tileRoute(this.grid, this.tile.tx, this.tile.ty, n.tx, n.ty);
    if (!route || !route.length) { this.flash('NO WAY THROUGH'); Audio.ui('error'); return; }
    const need = this.staminaFor(route);
    if (need > r.stamina) { this.flash('TOO FAR - ' + need + ' STAMINA'); Audio.ui('error'); return; }
    this.path = route; Audio.ui('select');
  }
  // Drag a path by hand: extend tile by tile from wherever the finger is.
  extendPath(tx, ty) {
    const r = Game.run;
    if (!tileWalkable(this.grid, tx, ty)) return;
    const tail = this.path.length ? this.path[this.path.length - 1] : this.tile;
    if (tail.tx === tx && tail.ty === ty) return;
    // stepping back onto the previous tile rubs the last step out
    if (this.path.length > 1) { const prev = this.path[this.path.length - 2]; if (prev.tx === tx && prev.ty === ty) { this.path.pop(); return; } }
    if (this.path.length === 1 && this.tile.tx === tx && this.tile.ty === ty) { this.path.pop(); return; }
    const d = Math.abs(tail.tx - tx) + Math.abs(tail.ty - ty);
    const seg = d === 1 ? [{ tx, ty }] : tileRoute(this.grid, tail.tx, tail.ty, tx, ty, 900);
    if (!seg || seg.length > 14) return;
    for (const st of seg) {
      if (this.staminaFor(this.path) + tileCost(this.grid, st.tx, st.ty) > r.stamina) { this.pathFull = 0.5; return; }
      this.path.push(st);
      if (this.nodeAtTile(st.tx, st.ty)) return;    // a path always ends at a door
    }
  }
  endDay() { const r = Game.run; r.nightPending = true; r.save(); Game.go(() => new NightScene(), 'fade', { dur: 0.6 }); }
  step(dx, dy) {
    const r = Game.run; if (this.walking || this.path.length) return;
    const tx = this.tile.tx + dx, ty = this.tile.ty + dy;
    if (!tileWalkable(this.grid, tx, ty)) { Audio.ui('error'); return; }
    if (r.stamina < tileCost(this.grid, tx, ty)) { this.flash('OUT OF STAMINA'); Audio.ui('error'); return; }
    this.path = [{ tx, ty }];
  }
  key(code) {
    if (code === 'ArrowLeft' || code === 'KeyA') this.step(-1, 0);
    else if (code === 'ArrowRight' || code === 'KeyD') this.step(1, 0);
    else if (code === 'ArrowUp' || code === 'KeyW') this.step(0, -1);
    else if (code === 'ArrowDown' || code === 'KeyS') this.step(0, 1);
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) { const n = this.nodeAtTile(this.tile.tx, this.tile.ty) || this.nearestNode(); if (n) this.go(n); }
    else if (code === 'Tab' || code === 'KeyB') Game.setScene(new BandScene());
    else if (code === 'KeyN') this.endDay();
    else if (code === 'Escape') { Game.run.save(); Game.setScene(new TitleScene()); }
  }
  nearestNode() { let best = null, bd = 1e9; for (const n of this.reach) { const d = Math.hypot(n.tx - this.tile.tx, n.ty - this.tile.ty); if (d < bd) { bd = d; best = n; } } return bd < 14 ? best : null; }
  screen(n) { return { x: n.x - this.cam.x, y: n.y - this.cam.y + 26 }; }
  tileAt(sx, sy) { return { tx: Math.floor((sx + this.cam.x) / TILE), ty: Math.floor((sy - 26 + this.cam.y) / TILE) }; }
  tileScreen(t) { return { x: (t.tx + 0.5) * TILE - this.cam.x, y: (t.ty + 0.5) * TILE - this.cam.y + 26 }; }
  tap(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { Audio.ui('select'); b.onTap(); return; }
    let best = null, bd = 1e9;
    for (const n of this.reach) { const s = this.screen(n); const d = Math.hypot(x - s.x, y - (s.y - 10)); if (d < 26 && d < bd) { best = n; bd = d; } }
    if (best) { this.sel = this.reach.indexOf(best); this.go(best); return; }
    const t = this.tileAt(x, y);
    if (tileWalkable(this.grid, t.tx, t.ty)) { const route = tileRoute(this.grid, this.tile.tx, this.tile.ty, t.tx, t.ty);
      if (route && this.staminaFor(route) <= Game.run.stamina) { this.path = route; Audio.ui('move'); } else { this.flash('TOO FAR'); Audio.ui('error'); } }
  }
  pointerDown(x, y, id) {
    if (this.walking || y < 26 || y > H - 34) { this.drag = { x, y, cx: this.cam.x, cy: this.cam.y, moved: 0, id, pan: true }; return; }
    const t = this.tileAt(x, y);
    // starting the drag on yourself means "draw me a route"
    const onSelf = Math.abs(t.tx - this.tile.tx) <= 1 && Math.abs(t.ty - this.tile.ty) <= 1;
    this.drag = { x, y, cx: this.cam.x, cy: this.cam.y, moved: 0, id, pan: !onSelf, draw: onSelf };
    if (onSelf) { this.path = []; Audio.ui('move'); }
  }
  pointerMove(x, y, id) {
    if (!this.drag || this.drag.id !== id) return;
    const dx = x - this.drag.x, dy = y - this.drag.y;
    this.drag.moved = Math.max(this.drag.moved, Math.hypot(dx, dy));
    if (this.drag.draw) { const t = this.tileAt(x, y); this.extendPath(t.tx, t.ty); return; }
    if (this.drag.moved > 5) { this.cam.x = clamp(this.drag.cx - dx, 0, MAPW - W); this.cam.y = clamp(this.drag.cy - dy, 0, MAPH - (H - 60)); this.target = { x: this.cam.x, y: this.cam.y }; }
  }
  pointerUp(x, y, id) {
    if (!this.drag || this.drag.id !== id) return;
    const d = this.drag; this.drag = null;
    if (d.draw) { if (this.path.length) Audio.ui('select'); else if (d.moved <= 5) this.tap(x, y); return; }
    if (d.moved <= 5 && x >= 0) this.tap(x, y);
  }
  hover(x, y) { this.reach.forEach((n, i) => { const s = this.screen(n); if (Math.hypot(x - s.x, y - (s.y - 10)) < 20) this.sel = i; }); }
  edgePos(a, b, k) { const na = this.G[a], nb = this.G[b]; if (!na || !nb) return { x: 0, y: 0 }; return { x: lerp(na.x, nb.x, k), y: lerp(na.y, nb.y, k) }; }
  draw(ctx) {
    const r = Game.run, cam = this.cam;
    rect(ctx, 0, 0, W, H, MAP_C.land);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 26, W, H - 60); ctx.clip();
    ctx.drawImage(this.sf.canvas, -Math.round(cam.x), -Math.round(cam.y) + 26);
    // water shimmer
    for (let i = 0; i < 60; i++) { const wx = 1245 + (i * 53) % 240, wy = (i * 79 + Math.floor(this.t * 8)) % MAPH; const s = { x: wx - cam.x, y: wy - cam.y + 26 }; if (s.x > -10 && s.x < W && s.y > 26 && s.y < H) rect(ctx, s.x, s.y, 9, 2, MAP_C.waterDk); }
    // cars + people on roads
    for (const c of this.cars) { const p = this.edgePos(c.a, c.b, c.k), s = { x: p.x - cam.x, y: p.y - cam.y + 26 }; if (s.x < -20 || s.x > W + 20 || s.y < 10 || s.y > H) continue; const na = this.G[c.a], nb = this.G[c.b]; const dir = (nb.x - na.x) >= 0 ? 1 : -1; ctx.drawImage(carCanvas(c.seed, dir), Math.round(s.x - 11), Math.round(s.y - 5), 22, 10); }
    for (const p2 of this.people) { const p = this.edgePos(p2.a, p2.b, p2.k), s = { x: p.x - cam.x, y: p.y - cam.y + 26 }; if (s.x < 0 || s.x > W || s.y < 20 || s.y > H) continue; rect(ctx, s.x, s.y - 5, 3, 5, p2.col); rect(ctx, s.x, s.y - 7, 3, 2, '#3a3040'); }
    // ---- the route you drew, as a continuous ribbon with chevrons
    if (this.path.length) {
      const pts = [this.tileScreen(this.tile)].concat(this.path.map(t => this.tileScreen(t)));
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(13,58,104,0.45)'; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      ctx.strokeStyle = '#3d8fe0'; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      ctx.lineWidth = 1;
      // chevrons flowing along it
      for (let i = 1; i < pts.length; i++) {
        const a2 = pts[i - 1], b2 = pts[i], ang = Math.atan2(b2.y - a2.y, b2.x - a2.x);
        const k = ((this.t * 1.6 + i * 0.34) % 1);
        const mx = lerp(a2.x, b2.x, k), my = lerp(a2.y, b2.y, k);
        ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-3, -4); ctx.lineTo(-1, 0); ctx.lineTo(-3, 4); ctx.fill(); ctx.restore();
      }
      // the destination flag and what the walk will cost
      const end = pts[pts.length - 1], cost = this.staminaFor(this.path);
      circle(ctx, end.x, end.y, 7, '#fff'); circle(ctx, end.x, end.y, 5, '#1b63b8');
      const cw = textWidth(String(cost), { scale: 2 }) + 24;
      rect(ctx, end.x - cw / 2, end.y - 36, cw, 18, '#1b63b8'); frame(ctx, end.x - cw / 2, end.y - 36, cw, 18, '#0d3a68');
      rect(ctx, end.x - cw / 2 + 1, end.y - 35, cw - 2, 1, '#5ba0e8');
      ctx.drawImage(icon('fire'), end.x - cw / 2 + 4, end.y - 34, 10, 13);
      drawText(ctx, String(cost), end.x + 7, end.y - 31, '#fff', { align: 'center', scale: 2 });
    }
    // where you could still step, while you are drawing
    if (this.drag && this.drag.draw) {
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const tx = this.tile.tx + dx, ty = this.tile.ty + dy;
        if (!tileWalkable(this.grid, tx, ty)) continue;
        const c = this.tileScreen({ tx, ty });
        ctx.globalAlpha = 0.16; rect(ctx, c.x - 10, c.y - 10, 20, 20, '#2a7ad0'); ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.3; frame(ctx, c.x - 10, c.y - 10, 20, 20, '#fff'); ctx.globalAlpha = 1;
      }
    }
    // ---- pins. Distance now reads as walking cost, not a ticket price.
    const done = r.doneNodes || {};
    for (const n of NODES) {
      const s2 = this.screen(n); if (s2.x < -40 || s2.x > W + 40 || s2.y < 0 || s2.y > H + 40) continue;
      const near = Math.abs(n.tx - this.tile.tx) + Math.abs(n.ty - this.tile.ty) < 9;
      if (n.id === 'ggb' && r.day < 4) { drawPin(ctx, s2.x, s2.y, n, { done: true }); ctx.drawImage(icon('lock'), s2.x - 5, s2.y - 28, 11, 10); continue; }
      const spent = n.type === 'pickup' && done[n.id] === r.day;
      if (near && !spent) { const pulse = 16 + Math.sin(this.t * 5 + n.tx) * 3; ctx.globalAlpha = 0.2; circle(ctx, s2.x, s2.y - 14, pulse, '#8ab8e8'); ctx.globalAlpha = 1; }
      drawPin(ctx, s2.x, s2.y, n, { sel: near && !spent, done: spent });
      if (near || n.type === 'venue') {
        const lw = textWidth(n.name) + 10;
        rect(ctx, s2.x - lw / 2, s2.y + 3, lw, 11, 'rgba(255,255,255,0.86)'); frame(ctx, s2.x - lw / 2, s2.y + 3, lw, 11, 'rgba(120,130,120,0.35)');
        drawText(ctx, n.name, s2.x, s2.y + 5, '#3f4f3f', { align: 'center' });
      }
    }
    // ---- the band, walking the streets on foot
    const ps = { x: this.pos.x - cam.x, y: this.pos.y - cam.y + 26 };
    const moving = !!this.walking, phase = this.t * 7;
    const dirX = this.facing;
    r.members.slice(1, 4).forEach((m, i) => {
      const lag = (i + 1) * 15;
      const fx2 = ps.x - dirX * lag, fy2 = ps.y + 3 + Math.sin(phase - i * 1.1) * (moving ? 1.4 : 0.6);
      drawShadow(ctx, fx2, fy2 + 2, 15, 0.22);
      drawBugAt(ctx, m.spec, fx2, fy2, { pose: moving ? (Math.floor(phase - i) % 2 ? 'walk1' : 'walk2') : 'idle', flip: dirX < 0, scale: 0.62, rate: 3.4, phase: i * 1.7 });
    });
    drawShadow(ctx, ps.x, ps.y + 2, 22, 0.28);
    drawBugAt(ctx, r.members[0].spec, ps.x, ps.y + 1, {
      pose: moving ? (Math.floor(phase) % 2 ? 'walk1' : 'walk2') : (Math.floor(this.t * 1.6) % 4 === 0 ? 'idle2' : 'idle'),
      flip: dirX < 0, instrument: r.members[0].instrument !== 'drums' && r.members[0].instrument !== 'piano' ? r.members[0].instrument : null,
      scale: 0.78, rate: 3.2 });
    // a soft marker ring so you never lose yourself on a busy map
    ctx.globalAlpha = 0.35 + 0.15 * Math.sin(this.t * 4);
    ringPx(ctx, ps.x, ps.y + 3, 13, '#2a7ad0'); ringPx(ctx, ps.x, ps.y + 3, 14, '#2a7ad0');
    ctx.globalAlpha = 1;
    this.fx.draw(ctx);
    const wk = WEATHERS[r.weather] || WEATHERS.clear;
    if (wk.tint) { ctx.fillStyle = wk.tint; ctx.fillRect(0, 26, W, H - 60); }
    vignetteRect(ctx, 0, 26, W, H - 60, 0.3, '#1a2416');
    ctx.restore();
    this.drawHud(ctx);
    if (this.arriveT > 0) { ctx.globalAlpha = clamp(this.arriveT / 2.6, 0, 1); rect(ctx, 0, 180, W, 100, 'rgba(10,20,30,0.8)'); uiRibbon(ctx, W / 2, 194, 'SAN FRANCISCO', { scale: 4, color: '#c8433a' }); drawText(ctx, 'FIVE DAYS TO BUILD A BAND', W / 2, 246, '#fff', { align: 'center', scale: 2 }); ctx.globalAlpha = 1; }
    if (this.msgT > 0) { ctx.globalAlpha = clamp(this.msgT, 0, 1); const sc2 = popIn(2.2 - this.msgT, 0.25); const w = textWidth(this.msg, { scale: 2 }) + 30; ctx.save(); ctx.translate(W / 2, 130); ctx.scale(sc2, sc2); rect(ctx, -w / 2, -14, w, 28, '#1a2a1a'); frame(ctx, -w / 2, -14, w, 28, '#6be585'); drawText(ctx, this.msg, 0, -7, '#6be585', { align: 'center', scale: 2 }); ctx.restore(); ctx.globalAlpha = 1; }
  }
  drawHud(ctx) {
    const r = Game.run, wk = WEATHERS[r.weather] || WEATHERS.clear;
    // top bar
    rect(ctx, 0, 0, W, 26, '#fbf8f0'); rect(ctx, 0, 26, W, 2, '#c8c2b0');
    ctx.drawImage(icon('coin'), 10, 7, 13, 12); drawText(ctx, fmtMoney(r.money), 28, 9, '#3a6a3a');
    // stamina, shown as a bar rather than a number you have to read
    const sw = 150, st = clamp(r.stamina / r.staminaMax, 0, 1);
    ctx.drawImage(icon('fire'), 128, 6, 11, 14);
    rect(ctx, 144, 8, sw + 2, 11, '#4a4438'); rect(ctx, 145, 9, sw, 9, '#241f1a');
    const sc = st > 0.5 ? '#5fbf4f' : st > 0.22 ? '#e0a828' : '#cf4436';
    rect(ctx, 145, 9, Math.round(sw * st), 9, sc); rect(ctx, 145, 9, Math.round(sw * st), 1, lighten(sc, 0.3));
    for (let i = 1; i < 4; i++) rect(ctx, 145 + Math.round(sw * i / 4), 9, 1, 9, 'rgba(0,0,0,0.3)');
    drawText(ctx, 'DAY ' + (r.day + 1) + '/5', 320, 9, '#5d6a5d');
    ctx.drawImage(icon(wk.icon === 'rain' ? 'rain' : wk.icon === 'fog' ? 'rain' : 'star'), 400, 7, 12, 11); drawText(ctx, wk.name, 418, 9, '#5d6a5d');
    let bx = W - 10;
    for (let i = r.members.length - 1; i >= 0; i--) { const m = r.members[i]; bx -= 28; circle(ctx, bx + 12, 13, 12, m.hunger >= 2 ? '#c8433a' : m.hunger === 1 ? '#d9a520' : '#4f8032'); ctx.save(); ctx.beginPath(); ctx.arc(bx + 12, 13, 11, 0, Math.PI * 2); ctx.clip(); drawBugAt(ctx, m.spec, bx + 12, 29, { pose: 'idle', scale: 0.65, bounce: 0 }); ctx.restore(); }
    let cx = bx - 12; for (let i = r.charms.length - 1; i >= 0; i--) { cx -= 20; uiSlotMini(ctx, cx, 4, false, 18); ctx.drawImage(icon(CHARMS[r.charms[i]].icon), cx + 3, 7, 12, 11); }
    rect(ctx, 0, H - 34, W, 34, 'rgba(250,247,238,0.95)'); rect(ctx, 0, H - 34, W, 2, '#c8c2b0');
    const under = this.nodeAtTile(this.tile.tx, this.tile.ty) || this.nearestNode();
    if (under) {
      ctx.drawImage(icon(under.icon || 'event'), 10, H - 27, 18, 16);
      drawText(ctx, under.name, 36, H - 28, '#2a3a2a');
      drawText(ctx, under.sub || '', 36, H - 15, '#7a8a7a');
    }
    this.buttons = [
      new Btn(W - 104, H - 28, 96, 24, 'BAND', () => Game.go(() => new BandScene(), 'slideL'), { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050' }),
      new Btn(W - 212, H - 28, 102, 24, r.stamina > 6 ? 'END DAY' : 'REST', () => this.endDay(), { color: '#8a6a3a', hi: '#b08a50', lo: '#5a4020', ol: '#3a2810' }),
      new Btn(W - 318, H - 28, 100, 24, 'GO', () => this.go(this.reach[this.sel]), { color: UI.green }),
    ];
    for (const b of this.buttons) b.draw(ctx);
  }
}
// ---------- Food shop ----------
const DISHES = [
  { key: 'dumpling', name: 'DUMPLING BASKET', art: 'dumpling', price: 6, feeds: 'all', stam: 10, note: 'EIGHT, STEAMED' },
  { key: 'noodles', name: 'HOT NOODLES', art: 'noodles', price: 9, feeds: 'all', stam: 20, note: 'BROTH TO THE BRIM' },
  { key: 'burrito', name: 'MISSION BURRITO', art: 'burrito', price: 12, feeds: 'all', stam: 30, note: 'BIGGER THAN A BUG' },
  { key: 'bread', name: 'SOURDOUGH BOWL', art: 'bread', price: 5, feeds: 'one', stam: 8, note: 'CHOWDER INSIDE' },
];
class FoodScene {
  constructor(node) {
    this.node = node; this.t = 0; this.phase = 'browse'; this.sel = 0; this.msg = '';
    this.waitT = 0; this.order = null; this.chatted = {}; this.practiceDone = false;
    const rr = makeRng(hashStr(node.id));
    this.diners = [0, 1].map(i => ({ spec: randomBugSpec(rr), x: 700 + i * 110, o: rr.range(0, 6) }));
    this.cook = randomBugSpec(rr);
    this.price = (d) => Math.max(3, d.price + Game.run.day);
  }
  // ---- ordering
  place(d) {
    const r = Game.run, cost = this.price(d) * (d.feeds === 'all' ? Math.max(1, r.members.length) : 1);
    if (r.money < cost) { this.msg = 'NOT ENOUGH'; Audio.ui('error'); return; }
    r.money -= cost; this.order = d; this.phase = 'wait'; this.waitT = 13; Audio.ui('select');
    this.msg = '';
  }
  serve() {
    const r = Game.run, d = this.order;
    if (d.feeds === 'all') r.members.forEach(m => { m.hunger = 0; m.stamina = Math.min(100, m.stamina + 40); });
    else { const m = r.members.slice().sort((a, b) => b.hunger - a.hunger)[0]; m.hunger = Math.max(0, m.hunger - 1); m.stamina = Math.min(100, m.stamina + 30); }
    r.rest(d.stam); r.save(); this.phase = 'served'; Audio.ui('eat');
  }
  chat(i) {
    const r = Game.run; if (this.chatted[i] || this.phase !== 'wait') return;
    this.chatted[i] = true; const m = r.members[i]; if (m) { m.stamina = Math.min(100, m.stamina + 12); r.rest(3); }
    Audio.ui('select'); this.msg = (m ? m.name.toUpperCase() : 'THEY') + ' PERKS UP';
    this.bubble = { i, t: 2.4, text: ['NICE SET EARLIER.', 'MY HANDS ACHE.', 'ORDER ME ONE TOO.', 'WE SOUND GOOD.'][i % 4] };
  }
  startPractice() {
    if (this.phase !== 'wait' || this.practiceDone) return;
    Audio.init(); Audio.setStageReverb(false);
    const me = Game.run.members[0];
    const tune = me.instrument === 'drums' ? 'saints' : me.instrument === 'piano' ? 'furElise' : 'camptown';
    const song = songFromTune(tune, { bpm: 104 });
    const sections = [{ instrument: me.instrument, startBar: 0, endBar: Math.min(8, song.bars) }];
    const notes = chartFromMelody(song, sections, 2, makeRng(5), { starRate: 0.1, bombMult: 0 });
    const mods = collectMods(null, { difficulty: 2, fx: { shake: Game.shake }, windowMult: 1.3 });
    this.rhythm = new RhythmGame(song, sections, notes, mods, {});
    const start = Audio.now() + 0.4 + song.leadIn; this.rhythm.begin(start);
    this.backing = new Backing(song, start - song.leadIn, () => ({ drums: true }));
    this.song = song; this.phase = 'practice'; this.pads = []; this.padPointers = new Map();
  }
  endPractice() {
    if (this.backing) this.backing.stop();
    const res = this.rhythm.results(); const r = Game.run;
    r.buffs.practice = Math.max(r.buffs.practice || 0, res.acc);
    this.practiceDone = true; this.phase = 'wait';
    this.msg = 'WARMED UP - ' + Math.round(res.acc * 100) + '%';
    this.waitT = Math.min(this.waitT, 2.5);
    this.rhythm = null;
  }
  isPlaying() { return this.phase === 'practice'; }
  update(dt) {
    this.t += dt;
    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
    if (this.phase === 'wait') { this.waitT -= dt; if (this.waitT <= 0) this.serve(); }
    if (this.phase === 'practice') {
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch && !this.pads.length) this.pads = buildPads(this.rhythm.instrument, { x: 4, y: 404, w: W - 8, h: 130 }, false);
      if (this.rhythm.finished) this.endPractice();
    }
  }
  leave() { Game.run.save(); Game.go(() => new CityScene(), 'slideR'); }
  key(code) {
    if (this.phase === 'practice') { this.rhythm.keyDown(code); return; }
    if (code === 'Escape') { this.leave(); return; }
    if (this.phase === 'browse') {
      if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel + DISHES.length - 1) % DISHES.length; Audio.ui('move'); }
      else if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % DISHES.length; Audio.ui('move'); }
      else if (['Enter', 'Space'].includes(code)) this.place(DISHES[this.sel]);
    } else if (this.phase === 'served' && ['Enter', 'Space'].includes(code)) this.leave();
    else if (this.phase === 'wait' && ['Enter', 'Space'].includes(code)) this.startPractice();
  }
  keyUp(code) { if (this.phase === 'practice') this.rhythm.keyUp(code); }
  padAt(x, y) { return this.pads ? this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) : null; }
  pointerDown(x, y, id) {
    if (this.phase === 'practice') { const p = this.padAt(x, y); if (p) { this.padPointers.set(id, p.code); this.rhythm.keyDown(p.code); } return; }
    this.click(x, y);
  }
  pointerMove(x, y, id) { if (this.phase !== 'practice') return; const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { const c = this.padPointers && this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); } }
  click(x, y) {
    for (const b of (this.buttons || [])) if (b.hit(x, y)) { b.onTap(); return; }
    if (this.phase === 'browse') { (this.dishRects || []).forEach((d, i) => { if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) { if (this.sel === i) this.place(DISHES[i]); else { this.sel = i; Audio.ui('move'); } } }); return; }
    if (this.phase === 'wait') { (this.seatRects || []).forEach((sr) => { if (x >= sr.x && x < sr.x + sr.w && y >= sr.y && y < sr.y + sr.h) this.chat(sr.i); }); return; }
    if (this.phase === 'served') this.leave();
  }
  hover(x, y) { if (this.phase === 'browse') (this.dishRects || []).forEach((d, i) => { if (x >= d.x && x < d.x + d.w && y >= d.y && y < d.y + d.h) this.sel = i; }); }
  seatX(i) { return 168 + i * 92; }
  drawRoom(ctx) {
    const t = this.t;
    // ---- walls, lanterns, kitchen pass
    vgrad(ctx, 0, 0, W, 300, '#8a3630', '#63241f');
    for (let x = 0; x < W; x += 30) rect(ctx, x, 0, 2, 300, '#57201c');
    rect(ctx, 0, 286, W, 10, '#c8a24a'); rect(ctx, 0, 286, W, 3, '#e8c470');
    // paper lanterns
    for (let i = 0; i < 7; i++) { const lx = 70 + i * 140, sw = Math.sin(t * 0.8 + i) * 2;
      rect(ctx, lx - 1 + sw * 0.4, 0, 2, 24, '#3a1a16');
      const lc = i % 2 ? '#e8563f' : '#e8a33a';
      ctx.fillStyle = lc; ctx.beginPath(); ctx.ellipse(lx + sw, 36, 15, 18, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = darken(lc, 0.2); for (let k = -2; k <= 2; k++) rect(ctx, lx + sw - 15, 36 + k * 7, 30, 1, darken(lc, 0.25));
      ctx.fillStyle = '#f6d98a'; ctx.beginPath(); ctx.ellipse(lx + sw - 5, 30, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
      rect(ctx, lx + sw - 4, 53, 8, 4, '#c8a24a');
      lightPool(ctx, lx + sw, 40, 90, lc, 0.12);
    }
    // ---- kitchen pass with the cook
    rect(ctx, 620, 96, 300, 130, '#3f2420'); frame(ctx, 620, 96, 300, 130, '#2a1613');
    vgrad(ctx, 626, 102, 288, 118, '#5d3a2c', '#3a221b');
    rect(ctx, 620, 214, 300, 14, '#a8763c'); rect(ctx, 620, 214, 300, 3, '#d09a58');
    drawBugAt(ctx, this.cook, 770, 216, { pose: Math.floor(t * 3) % 2 ? 'play' : 'play2', expr: 'focus', scale: 1.5, rate: 2.6 });
    for (let i = 0; i < 3; i++) { const bx = 650 + i * 90; ctx.drawImage(itemCanvas('noodles'), 0, 0, 32, 32, bx, 188, 28, 28);
      if (Math.random() < 0.06) this.steam = this.steam || []; }
    rect(ctx, 636, 110, 60, 44, '#c8a24a'); drawText(ctx, 'HOT', 666, 126, '#5a2a10', { align: 'center', scale: 2 });
    // ---- menu board on the wall
    rect(ctx, 60, 92, 220, 132, '#2f3a2c'); frame(ctx, 60, 92, 220, 132, '#1b2419');
    for (let i = 0; i < 5; i++) { drawText(ctx, ['TODAY', 'DUMPLING  6', 'NOODLES   9', 'BURRITO  12', 'BOWL      5'][i], 76, 104 + i * 24, i ? '#e8dcb0' : '#f2cf4a', { scale: i ? 1 : 2 }); }
    // ---- a window onto the street, and a plant, so the wall is not bare
    rect(ctx, 316, 96, 250, 150, '#3a2a24'); frame(ctx, 316, 96, 250, 150, '#241713');
    vgrad(ctx, 322, 102, 238, 138, '#9fd0e8', '#d8e6c8');
    for (let i = 0; i < 5; i++) { const bx = 330 + i * 48, bh = 40 + (i % 3) * 22; rect(ctx, bx, 240 - bh, 38, bh, '#8fa8bc'); rect(ctx, bx, 240 - bh, 38, 2, '#a8c0d0');
      for (let wy = 240 - bh + 6; wy < 236; wy += 10) for (let wx = bx + 4; wx < bx + 34; wx += 10) rect(ctx, wx, wy, 5, 5, '#d8e8f0'); }
    rect(ctx, 316, 166, 250, 4, '#241713'); rect(ctx, 438, 96, 4, 150, '#241713');
    rect(ctx, 310, 244, 262, 8, '#6b4526');
    // a potted plant under it
    rect(ctx, 592, 210, 26, 34, '#a8643a'); rect(ctx, 592, 210, 26, 4, '#c07e4c');
    circle(ctx, 605, 200, 16, '#4f8a56'); circle(ctx, 594, 190, 10, '#6fae72'); circle(ctx, 617, 192, 9, '#3f7a48');
    // ---- floor and tables
    vgrad(ctx, 0, 296, W, H - 296, '#7a5a3e', '#4a3524');
    for (let y = 320; y < H; y += 34) { ctx.globalAlpha = 0.25; rect(ctx, 0, y, W, 1, '#3a2718'); ctx.globalAlpha = 1; }
    // other diners at the back
    this.diners.forEach((d, i) => {
      rect(ctx, d.x - 40, 300, 80, 10, '#6b4526'); rect(ctx, d.x - 40, 300, 80, 3, '#8f6136');
      rect(ctx, d.x - 3, 310, 6, 24, '#5a3a20');
      drawShadow(ctx, d.x, 334, 30, 0.2);
      drawBugAt(ctx, d.spec, d.x, 330, { pose: Math.floor(t * 1.5 + i) % 3 ? 'idle' : 'sing', scale: 1.2, rate: 1.6, phase: d.o });
      ctx.drawImage(itemCanvas('dumpling'), 0, 0, 32, 32, d.x - 12, 282, 24, 24);
    });
  }
  drawTable(ctx) {
    const r = Game.run, t = this.t;
    // your booth, front and centre. The band sits BEHIND the table so the
    // tabletop cuts them off at the waist, the way a table actually works.
    const ty = 452;
    // bench back
    rect(ctx, 92, ty - 96, 432, 12, '#7a3a34'); rect(ctx, 92, ty - 96, 432, 4, '#a4524a');
    rect(ctx, 100, ty - 84, 416, 36, '#6a322d');
    this.seatRects = [];
    r.members.slice(0, 4).forEach((m, i) => {
      const x = this.seatX(i);
      const chatted = this.chatted[i];
      const pose = this.phase === 'served' ? 'cheer' : chatted ? 'idle2' : 'idle';
      drawBugAt(ctx, m.spec, x, ty + 6, { pose, expr: this.phase === 'served' ? 'happy' : m.hunger >= 2 ? 'sad' : null, scale: 1.45, rate: 1.8, phase: i * 1.3 });
      this.seatRects.push({ x: x - 26, y: ty - 90, w: 52, h: 96, i });
    });
    // tabletop over their laps
    rect(ctx, 92, ty - 14, 432, 16, '#9a6a3c'); rect(ctx, 92, ty - 14, 432, 5, '#c08e52');
    rect(ctx, 92, ty + 2, 432, 8, '#6b4526');
    rect(ctx, 126, ty + 10, 12, 52, '#5a3a20'); rect(ctx, 478, ty + 10, 12, 52, '#5a3a20');
    rect(ctx, 100, ty - 12, 416, 3, 'rgba(255,255,255,0.12)');
    r.members.slice(0, 4).forEach((m, i) => {
      const x = this.seatX(i), chatted = this.chatted[i];
      if (this.phase === 'wait' && !chatted) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5 + i); for (let k = 0; k < 3; k++) circle(ctx, x + k * 6 - 6, ty - 104, 3, '#ffd24a'); ctx.globalAlpha = 1; }
      if (this.phase === 'served') ctx.drawImage(itemCanvas(this.order.art), 0, 0, 32, 32, x - 15, ty - 42, 30, 30);
    });
    // condiments live on the table too
    ctx.drawImage(itemCanvas('bottle'), 0, 0, 32, 32, 470, ty - 40, 26, 26);
    rect(ctx, 440, ty - 24, 14, 10, '#e8dcc0'); rect(ctx, 440, ty - 26, 14, 3, '#c8bca0');
    if (this.bubble) { const m = r.members[this.bubble.i]; if (m) bubble(ctx, this.seatX(this.bubble.i), ty - 86, this.bubble.text, {}); }
  }
  draw(ctx) {
    const r = Game.run, t = this.t;
    if (this.phase === 'practice') {
      this.drawRoom(ctx);
      this.rhythm.draw(ctx, { x: 0, y: 16, w: W, h: 300, touch: Game.touch, pads: this.pads });
      this.drawTable(ctx);
      if (Game.touch) { rect(ctx, 0, 401, W, H - 401, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      vignette(ctx, 0.4);
      return;
    }
    this.drawRoom(ctx);
    this.drawTable(ctx);
    this.motes || (this.motes = new Motes(20, 44));
    this.motes.update(1 / 60, t); this.motes.draw(ctx, t, '#ffd9a0');
    grade(ctx, 0, 0, W, H, '#ffb070', 0.12);
    vignette(ctx, 0.45);

    this.buttons = [];
    if (this.phase === 'browse') this.drawMenuCard(ctx);
    else if (this.phase === 'wait') this.drawWaiting(ctx);
    else if (this.phase === 'served') this.drawServed(ctx);
    for (const b of this.buttons) b.draw(ctx);
    Game.drawHud(ctx);
  }
  // A paper menu, hand-lettered, held up over the table.
  drawMenuCard(ctx) {
    const r = Game.run, t = this.t;
    const mw = 520, mh = 268, mx = Math.round(W / 2 - mw / 2), my = 92 + Math.round(Math.sin(t * 1.2) * 2);
    ctx.fillStyle = 'rgba(20,12,8,0.4)'; ctx.fillRect(mx + 6, my + 8, mw, mh);
    rect(ctx, mx, my, mw, mh, '#f6ecd0');
    // torn deckle edge
    for (let i = 0; i < mh; i += 5) { rect(ctx, mx - 1, my + i, 2, 3, '#f6ecd0'); rect(ctx, mx + mw - 1, my + i + 2, 2, 3, '#f6ecd0'); }
    frame(ctx, mx + 4, my + 4, mw - 8, mh - 8, '#b8a274');
    frame(ctx, mx + 6, my + 6, mw - 12, mh - 12, '#d8c79c');
    ctx.globalAlpha = 0.35; ctx.fillStyle = paperTexture(); ctx.fillRect(mx + 2, my + 2, mw - 4, mh - 4); ctx.globalAlpha = 1;
    drawText(ctx, this.node.name, W / 2, my + 18, '#8a3630', { align: 'center', scale: 3 });
    drawText(ctx, this.node.sub || 'TODAY ONLY', W / 2, my + 44, '#a08a5e', { align: 'center' });
    rect(ctx, mx + 60, my + 58, mw - 120, 1, '#c8b48a');
    this.dishRects = [];
    DISHES.forEach((d, i) => {
      const x = mx + 22, y = my + 64 + i * 46, w = mw - 44, h = 44;
      const sel = i === this.sel;
      const cost = this.price(d) * (d.feeds === 'all' ? Math.max(1, r.members.length) : 1);
      const afford = r.money >= cost;
      if (sel) { rect(ctx, x, y, w, h, '#efe0b8'); frame(ctx, x, y, w, h, '#c8a24a'); }
      ctx.drawImage(itemCanvas(d.art), 0, 0, 32, 32, x + 5, y + 5, 34, 34);
      drawText(ctx, d.name, x + 48, y + 6, afford ? '#4a3420' : '#a89878', { scale: 2 });
      drawText(ctx, d.note + (d.feeds === 'all' ? '  -  FEEDS THE BAND' : '  -  ONE HUNGRY BUG'), x + 48, y + 28, '#9a8660', { font: 'small' });
      drawText(ctx, fmtMoney(cost), x + w - 8, y + 12, afford ? '#4f8032' : '#b02a2a', { align: 'right', scale: 2 });
      if (sel) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); drawText(ctx, '>', x - 10, y + 12, '#c8433a', { scale: 2 }); ctx.globalAlpha = 1; }
      this.dishRects.push({ x, y, w, h });
    });
    if (this.msg) drawText(ctx, this.msg, W / 2, my + mh - 16, '#b02a2a', { align: 'center' });
    this.buttons.push(new Btn(W / 2 - 148, H - 44, 140, 30, 'ORDER', () => this.place(DISHES[this.sel]), { scale: 2 }));
    this.buttons.push(new Btn(W / 2 + 8, H - 44, 140, 30, 'LEAVE', () => this.leave(), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14', scale: 2 }));
  }
  drawWaiting(ctx) {
    const t = this.t;
    // an order ticket clipped over the pass, counting down
    const k = clamp(1 - this.waitT / 13, 0, 1);
    const bx = W / 2 - 150, by = 42;
    rect(ctx, bx, by, 300, 44, '#f6ecd0'); frame(ctx, bx, by, 300, 44, '#b8a274');
    ctx.drawImage(itemCanvas(this.order.art), 0, 0, 32, 32, bx + 6, by + 6, 32, 32);
    drawText(ctx, 'COOKING', bx + 46, by + 8, '#8a3630', { scale: 2 });
    rect(ctx, bx + 46, by + 28, 240, 10, '#d8c79c'); rect(ctx, bx + 46, by + 28, Math.round(240 * k), 10, '#e8563f');
    rect(ctx, bx + 46, by + 28, Math.round(240 * k), 1, '#ff8a70');
    frame(ctx, bx + 46, by + 28, 240, 10, '#8a7450');
    if (Math.random() < 0.3) this.motes && null;
    // what you can do while it cooks, shown as two things in the room
    const hint = this.practiceDone ? 'TALK TO THE BAND' : 'TAP A BANDMATE  -  OR WARM UP';
    drawText(ctx, hint, W / 2, H - 52, '#f0dcb0', { align: 'center', outline: '#3a2018' });
    if (this.msg) drawText(ctx, this.msg, W / 2, H - 36, '#6be585', { align: 'center', outline: '#12301c' });
    if (!this.practiceDone) this.buttons.push(new Btn(W - 190, H - 40, 180, 30, 'WARM UP', () => this.startPractice(), { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050', scale: 2 }));
  }
  drawServed(ctx) {
    const t = this.t;
    if (Math.random() < 0.4) this.fx || (this.fx = new Particles());
    uiRibbon(ctx, W / 2, 44, 'DINNER', { scale: 4, color: '#4f8032' });
    drawText(ctx, this.order.name, W / 2, 86, '#f4e2b0', { align: 'center', scale: 2, outline: '#3a2018' });
    this.buttons.push(new Btn(W / 2 - 80, H - 48, 160, 30, 'BACK OUT', () => this.leave(), { scale: 2 }));
  }
}
class RecruitScene {
  constructor(node) {
    this.node = node; this.t = 0; const r = Game.run;
    this.cand = r.makeMember(); this.price = 14 + r.day * 8 + this.cand.skill * 3;
    this.menu = new Menu([
      { label: 'Invite to the band', right: fmtMoney(this.price), icon: 'openmic', disabled: r.money < this.price || r.members.length >= 6, onSelect: () => { r.money -= this.price; r.members.push(this.cand); Audio.ui('fanfare'); this.done(this.cand.name.toUpperCase() + ' JOINS'); } },
      { label: 'Jam for free (+1 skill all)', icon: 'note', onSelect: () => { r.members.forEach(m => { m.skill = Math.min(10, m.skill + 1); m.stamina = Math.max(0, m.stamina - 10); }); Audio.ui('levelup'); this.done('EVERYONE LEVELLED UP'); } },
      { label: 'Leave', icon: 'arrowL', onSelect: () => Game.go(() => new CityScene(), 'slideR') },
    ]);
  }
  done(msg) { this.msg = msg; Game.run.save(); this.menu = new Menu([{ label: 'Leave', icon: 'arrowL', onSelect: () => Game.go(() => new CityScene(), 'slideR') }]); }
  update(dt) { this.t += dt; }
  key(code) {
    if (code === 'Escape') { Game.go(() => new CityScene(), 'slideR'); return; }
    if (['Enter', 'Space'].includes(code) && this.buttons && this.buttons.length) this.buttons[0].onTap();
  }
  click(x, y) { for (const b of (this.buttons || [])) if (b.hit(x, y)) { b.onTap(); return; } }
  hover() {}
  draw(ctx) {
    const t = this.t, r = Game.run;
    // ---- a small cafe with an open mic in the corner
    vgrad(ctx, 0, 0, W, 320, '#2f2438', '#241b2c');
    for (let x = 0; x < W; x += 34) rect(ctx, x, 0, 2, 320, '#241b2c');
    rect(ctx, 0, 300, W, 8, '#5a4632'); rect(ctx, 0, 300, W, 3, '#7a6044');
    // brick back wall behind the stage
    rect(ctx, 200, 40, 560, 268, '#4a2f2a');
    for (let by = 46; by < 302; by += 13) for (let bx = 206 + ((by / 13) % 2 ? 0 : 14); bx < 754; bx += 28) rect(ctx, bx, by, 26, 11, (bx + by) % 3 ? '#573830' : '#4a2f2a');
    // gig posters taped up
    for (let i = 0; i < 4; i++) { const px2 = 224 + i * 38, py = 58 + (i % 2) * 16;
      ctx.save(); ctx.translate(px2, py); ctx.rotate((i % 2 ? 1 : -1) * 0.05);
      rect(ctx, 0, 0, 30, 40, '#e8dcc0'); rect(ctx, 3, 4, 24, 10, ['#c4402f', '#3f7fa8', '#4f8a56', '#8a5a9a'][i]);
      for (let k = 0; k < 3; k++) rect(ctx, 4, 20 + k * 6, 22, 2, '#a89878'); ctx.restore(); }
    // a low stage with a rug, stand and speakers
    rect(ctx, 236, 268, 300, 40, '#3a2b22'); rect(ctx, 236, 262, 300, 8, '#5b4436'); rect(ctx, 236, 262, 300, 3, '#7a6044');
    ctx.fillStyle = '#5e2f44'; ctx.beginPath(); ctx.moveTo(250, 262); ctx.lineTo(522, 262); ctx.lineTo(500, 240); ctx.lineTo(272, 240); ctx.fill();
    ctx.drawImage(propCanvas('speaker'), 214, 202, 30, 51); ctx.drawImage(propCanvas('speaker'), 528, 202, 30, 51);
    ctx.drawImage(propCanvas('micstand'), 362, 198, 14, 54);
    // the spotlight and the bug in it
    ctx.globalAlpha = 0.14; ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.moveTo(370, 30); ctx.lineTo(404, 30); ctx.lineTo(470, 264); ctx.lineTo(300, 264); ctx.fill(); ctx.globalAlpha = 1;
    lightPool(ctx, 386, 250, 120, '#ffd24a', 0.16);
    drawShadow(ctx, 386, 262, 40, 0.3);
    drawBugAt(ctx, this.cand.spec, 386, 260, { pose: Math.floor(t * 4) % 2 ? 'play' : 'play2', expr: 'happy', instrument: this.cand.instrument, scale: 2.1, rate: 2.8 });
    // ---- cafe floor, tables and a listening crowd
    vgrad(ctx, 0, 308, W, H - 308, '#6a4a34', '#432c1f');
    for (let y = 330; y < H; y += 32) { ctx.globalAlpha = 0.25; rect(ctx, 0, y, W, 1, '#33200f'); ctx.globalAlpha = 1; }
    this.tables || (this.tables = (() => { const rr = makeRng(hashStr(this.node.id) + 5); return [0, 1, 2].map(i => ({ spec: randomBugSpec(rr), spec2: randomBugSpec(rr), x: 650 + i * 110, y: 360 + i * 46, o: rr.range(0, 6) })); })());
    this.tables.forEach((tb, i) => {
      circle(ctx, tb.x, tb.y, 30, '#8a5f36'); circle(ctx, tb.x, tb.y - 3, 30, '#a8763c');
      rect(ctx, tb.x - 3, tb.y + 6, 6, 26, '#5a3a20'); rect(ctx, tb.x - 12, tb.y + 30, 24, 4, '#5a3a20');
      ctx.drawImage(itemCanvas('coffee'), 0, 0, 32, 32, tb.x - 10, tb.y - 22, 22, 22);
      drawBugAt(ctx, tb.spec, tb.x - 40, tb.y + 4, { pose: 'idle', scale: 1.1, rate: 1.5, phase: tb.o });
      drawBugAt(ctx, tb.spec2, tb.x + 40, tb.y + 4, { pose: 'idle', flip: true, scale: 1.1, rate: 1.5, phase: tb.o + 2 });
    });
    // your band at the front table
    drawParty(ctx, 120, 470, t);
    this.motes || (this.motes = new Motes(18, 12));
    this.motes.update(1 / 60, t); this.motes.draw(ctx, t, '#ffd9a0');
    grade(ctx, 0, 0, W, H, '#ffb070', 0.1);
    vignette(ctx, 0.46);
    // ---- a name card taped beside the stage, and one strip of chrome
    const nm = this.cand.name.toUpperCase();
    const cw = Math.max(200, textWidth(nm, { scale: 3 }) + 30);
    ctx.save(); ctx.translate(600, 96); ctx.rotate(0.03);
    rect(ctx, 0, 0, cw, 84, '#f6ecd0'); frame(ctx, 3, 3, cw - 6, 78, '#b8a274');
    drawText(ctx, nm, 14, 12, '#8a3630', { scale: 3 });
    drawText(ctx, INSTRUMENTS[this.cand.instrument].name.toUpperCase(), 14, 42, '#8a7450');
    for (let i = 0; i < this.cand.skill; i++) ctx.drawImage(icon('star'), 14 + i * 18, 58, 15, 13);
    ctx.restore();
    rect(ctx, 0, H - 40, W, 40, 'rgba(24,18,28,0.88)'); rect(ctx, 0, H - 40, W, 2, '#c8a03a');
    if (this.msg) drawText(ctx, this.msg, 14, H - 26, '#6be585', { scale: 2 });
    else drawText(ctx, this.node.name + '  -  OPEN MIC', 14, H - 26, '#cfc6b0', { scale: 2 });
    this.buttons = [];
    if (!this.msg) {
      const canHire = r.money >= this.price && r.members.length < 6;
      this.buttons.push(new Btn(W - 420, H - 34, 180, 28, 'HIRE ' + fmtMoney(this.price), () => { if (!canHire) { Audio.ui('error'); return; } r.money -= this.price; r.members.push(this.cand); Audio.ui('fanfare'); this.done(this.cand.name.toUpperCase() + ' JOINS'); }, { scale: 2, color: canHire ? UI.green : '#8a8a7a' }));
      this.buttons.push(new Btn(W - 232, H - 34, 140, 28, 'JAM FREE', () => { r.members.forEach(m => { m.skill = Math.min(10, m.skill + 1); m.stamina = Math.max(0, m.stamina - 10); }); Audio.ui('levelup'); this.done('EVERYONE LEVELLED UP'); }, { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050', scale: 2 }));
    }
    this.buttons.push(new Btn(W - 84, H - 34, 76, 28, 'LEAVE', () => Game.go(() => new CityScene(), 'slideR'), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14', scale: 2 }));
    for (const b of this.buttons) b.draw(ctx);
    Game.drawHud(ctx);
  }
}
