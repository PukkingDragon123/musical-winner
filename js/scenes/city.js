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
    this.fx = new Particles(); this.sel = 0; this.refresh();
    this.buttons = [];
  }
  centerOn(n, snap) { const tx = clamp(n.x - W / 2, 0, MAPW - W), ty = clamp(n.y - (H - 60) / 2 - 26, 0, MAPH - (H - 60)); if (snap) { this.cam.x = tx; this.cam.y = ty; } this.target = { x: tx, y: ty }; }
  get here() { return this.G[Game.run.pos]; }
  refresh() { const r = Game.run; this.reach = this.here.links.map(id => this.G[id]).filter(n => this.canEnter(n)); this.sel = 0; if (this.reach.length) this.centerOn(this.here); }
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
    if (this.travel) {
      this.travel.t += dt / 1.05;
      const tr = this.travel, k = easeInOut(clamp(tr.t, 0, 1));
      this.target = { x: clamp(lerp(tr.from.x, tr.to.x, k) - W / 2, 0, MAPW - W), y: clamp(lerp(tr.from.y, tr.to.y, k) - (H - 60) / 2 - 26, 0, MAPH - (H - 60)) };
      if (tr.t >= 1) { const n = tr.to; this.travel = null; Game.run.pos = n.id; this.arrive(n); }
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
    const r = Game.run; if (this.travel || !n) return;
    const cost = this.hopCost(n);
    if (r.tickets < cost) { this.flash('OUT OF TICKETS - REST FOR THE NIGHT'); Audio.ui('error'); return; }
    r.tickets -= cost; Audio.ui('select'); Audio.ui('whoosh');
    this.travel = { from: this.here, to: n, t: 0 };
  }
  endDay() { const r = Game.run; r.nightPending = true; r.save(); Game.go(() => new NightScene(), 'fade', { dur: 0.6 }); }
  key(code) {
    if (this.travel) return;
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + this.reach.length) % this.reach.length; Audio.ui('move'); }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % this.reach.length; Audio.ui('move'); }
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) this.go(this.reach[this.sel]);
    else if (code === 'Tab' || code === 'KeyB') Game.setScene(new BandScene());
    else if (code === 'KeyN') this.endDay();
    else if (code === 'Escape') { Game.run.save(); Game.setScene(new TitleScene()); }
  }
  screen(n) { return { x: n.x - this.cam.x, y: n.y - this.cam.y + 26 }; }
  tap(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { Audio.ui('select'); b.onTap(); return; }
    let best = null, bd = 1e9;
    for (const n of this.reach) { const s = this.screen(n); const d = Math.hypot(x - s.x, y - (s.y - 10)); if (d < 24 && d < bd) { best = n; bd = d; } }
    if (best) { if (this.reach[this.sel] === best) this.go(best); else { this.sel = this.reach.indexOf(best); Audio.ui('move'); } }
  }
  pointerDown(x, y, id) { this.drag = { x, y, cx: this.cam.x, cy: this.cam.y, moved: 0, id }; }
  pointerMove(x, y, id) { if (!this.drag || this.drag.id !== id) return; const dx = x - this.drag.x, dy = y - this.drag.y; this.drag.moved = Math.max(this.drag.moved, Math.hypot(dx, dy)); if (this.drag.moved > 5) { this.cam.x = clamp(this.drag.cx - dx, 0, MAPW - W); this.cam.y = clamp(this.drag.cy - dy, 0, MAPH - (H - 60)); this.target = { x: this.cam.x, y: this.cam.y }; } }
  pointerUp(x, y, id) { if (!this.drag || this.drag.id !== id) return; const m = this.drag.moved; this.drag = null; if (m <= 5 && x >= 0 && !this.travel) this.tap(x, y); }
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
    // route highlights
    if (!this.travel) for (const n of this.reach) { const a = this.screen(this.here), b = this.screen(n); const selNode = this.reach[this.sel] === n;
      dashedLine(ctx, a.x, a.y - 6, b.x, b.y - 6, selNode ? '#2a7ad0' : 'rgba(42,122,208,0.45)', 7, 6, -this.t * 30);
      if (selNode) { ctx.globalAlpha = 0.5; dashedLine(ctx, a.x, a.y - 8, b.x, b.y - 8, '#7ab8ff', 7, 6, -this.t * 30); ctx.globalAlpha = 1; } }
    // pins
    const done = r.doneNodes || {};
    for (const n of NODES) {
      const s = this.screen(n); if (s.x < -30 || s.x > W + 30 || s.y < 0 || s.y > H + 30) continue;
      const reachable = this.reach.includes(n), isHere = n.id === r.pos;
      if (n.id === 'ggb' && r.day < 4) { drawPin(ctx, s.x, s.y, n, { done: true }); ctx.drawImage(icon('lock'), s.x - 5, s.y - 28, 11, 10); continue; }
      if (reachable && !this.travel) { const pulse = 18 + Math.sin(this.t * 5) * 4; ctx.globalAlpha = 0.25; circle(ctx, s.x, s.y - 14, pulse, this.reach[this.sel] === n ? '#2a7ad0' : '#8ab8e8'); ctx.globalAlpha = 1; }
      drawPin(ctx, s.x, s.y, n, { sel: reachable && this.reach[this.sel] === n, done: n.type === 'pickup' && done[n.id] === r.day });
      if (reachable || isHere || n.type === 'venue') {
        const lw = textWidth(n.name) + 10;
        rect(ctx, s.x - lw / 2, s.y + 3, lw, 11, 'rgba(255,255,255,0.86)'); frame(ctx, s.x - lw / 2, s.y + 3, lw, 11, 'rgba(120,130,120,0.35)');
        drawText(ctx, n.name, s.x, s.y + 5, '#3f4f3f', { align: 'center' });
      }
      if (reachable && this.reach[this.sel] === n) {
        const cost = this.hopCost(n), cw = 54;
        rect(ctx, s.x - cw / 2, s.y - 50, cw, 15, '#2a7ad0'); frame(ctx, s.x - cw / 2, s.y - 50, cw, 15, '#0e3a68');
        ctx.drawImage(icon('phone'), s.x - cw / 2 + 4, s.y - 48, 11, 11);
        drawText(ctx, '-' + cost, s.x + 12, s.y - 46, '#fff', { align: 'center' });
      }
    }
    // player token
    const pos = this.travel ? { x: lerp(this.travel.from.x, this.travel.to.x, easeInOut(clamp(this.travel.t, 0, 1))), y: lerp(this.travel.from.y, this.travel.to.y, easeInOut(clamp(this.travel.t, 0, 1))) } : this.here;
    const ps = { x: pos.x - cam.x, y: pos.y - cam.y + 26 };
    if (this.travel) { const dir = this.travel.to.x >= this.travel.from.x ? 1 : -1; ctx.drawImage(carCanvas(3, dir), Math.round(ps.x - 16), Math.round(ps.y - 7), 33, 15); if (Math.random() < 0.4) this.fx.add({ x: ps.x - dir * 10, y: ps.y + 2, vx: -dir * 20, vy: -10, life: 0.5, kind: 'smoke', color: '#d8d8e0', size: 2, grow: 4, alpha: 0.4 }); }
    const bob = Math.round(Math.sin(this.t * 4) * 2);
    drawShadow(ctx, ps.x, ps.y - 4, 30 - bob * 2, 0.22);
    ctx.globalAlpha = 0.28; circle(ctx, ps.x + 2, ps.y - 31 + bob, 17, '#1a2a3a'); ctx.globalAlpha = 1;
    circle(ctx, ps.x, ps.y - 34 + bob, 17, '#fff'); circle(ctx, ps.x, ps.y - 34 + bob, 16, '#2a7ad0'); circle(ctx, ps.x, ps.y - 34 + bob, 13, '#fff8ee');
    ctx.save(); ctx.beginPath(); ctx.arc(ps.x, ps.y - 34 + bob, 13, 0, Math.PI * 2); ctx.clip();
    drawBugAt(ctx, r.members[0].spec, ps.x, ps.y - 18 + bob, { pose: this.travel ? 'idle' : (Math.floor(this.t * 3) % 2 ? 'idle' : 'play'), scale: 0.85 }); ctx.restore();
    ctx.fillStyle = '#2a7ad0'; ctx.beginPath(); ctx.moveTo(ps.x - 6, ps.y - 20 + bob); ctx.lineTo(ps.x + 6, ps.y - 20 + bob); ctx.lineTo(ps.x, ps.y - 9 + bob); ctx.fill();
    r.members.slice(1, 4).forEach((m, i) => { const a = this.t * 2 + i * 1.6; const fx2 = ps.x + Math.cos(a) * (24 + i * 7), fy2 = ps.y + Math.sin(a) * 8; drawShadow(ctx, fx2, fy2 + 1, 18, 0.2); drawBugAt(ctx, m.spec, fx2, fy2, { pose: Math.sin(a * 2) > 0 ? 'walk1' : 'walk2', flip: Math.cos(a) < 0, scale: 0.6, rate: 3.2, phase: i * 2.1 }); });
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
    ctx.drawImage(icon('phone'), 132, 7, 12, 12); drawText(ctx, r.tickets + ' TICKETS', 150, 9, r.tickets > 0 ? '#2a5ab0' : '#b02a2a');
    drawText(ctx, 'DAY ' + (r.day + 1) + '/5', 310, 9, '#5d6a5d');
    ctx.drawImage(icon(wk.icon === 'rain' ? 'rain' : wk.icon === 'fog' ? 'rain' : 'star'), 396, 7, 12, 11); drawText(ctx, wk.name, 414, 9, '#5d6a5d');
    let bx = W - 10;
    for (let i = r.members.length - 1; i >= 0; i--) { const m = r.members[i]; bx -= 28; circle(ctx, bx + 12, 13, 12, m.hunger >= 2 ? '#c8433a' : m.hunger === 1 ? '#d9a520' : '#4f8032'); ctx.save(); ctx.beginPath(); ctx.arc(bx + 12, 13, 11, 0, Math.PI * 2); ctx.clip(); drawBugAt(ctx, m.spec, bx + 12, 29, { pose: 'idle', scale: 0.65, bounce: 0 }); ctx.restore(); }
    let cx = bx - 12; for (let i = r.charms.length - 1; i >= 0; i--) { cx -= 20; uiSlotMini(ctx, cx, 4, false, 18); ctx.drawImage(icon(CHARMS[r.charms[i]].icon), cx + 3, 7, 12, 11); }
    rect(ctx, 0, H - 34, W, 34, 'rgba(250,247,238,0.95)'); rect(ctx, 0, H - 34, W, 2, '#c8c2b0');
    const sel = this.reach[this.sel];
    if (sel && !this.travel) {
      ctx.drawImage(icon(sel.icon || 'event'), 10, H - 27, 18, 16);
      drawText(ctx, sel.name, 36, H - 28, '#2a3a2a');
      drawText(ctx, sel.sub || '', 36, H - 15, '#7a8a7a');
    } else if (this.travel) drawText(ctx, 'ON THE WAY...', 16, H - 22, '#2a5ab0');
    this.buttons = [
      new Btn(W - 104, H - 28, 96, 24, 'BAND', () => Game.go(() => new BandScene(), 'slideL'), { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050' }),
      new Btn(W - 212, H - 28, 102, 24, r.tickets > 0 ? 'END DAY' : 'REST', () => this.endDay(), { color: '#8a6a3a', hi: '#b08a50', lo: '#5a4020', ol: '#3a2810' }),
      new Btn(W - 318, H - 28, 100, 24, 'GO', () => this.go(this.reach[this.sel]), { color: UI.green }),
    ];
    for (const b of this.buttons) b.draw(ctx);
  }
}
// ---------- Food shop ----------
class FoodScene {
  constructor(node) {
    this.node = node; this.t = 0; const r = Game.run;
    const price = Math.max(3, 5 + r.day);
    this.menu = new Menu([
      { label: 'Feed everyone', right: fmtMoney(price * r.members.length), icon: 'food', disabled: r.money < price * r.members.length, onSelect: () => { r.money -= price * r.members.length; r.members.forEach(m => { m.hunger = 0; m.stamina = Math.min(100, m.stamina + 40); }); Audio.ui('eat'); this.done('EVERYONE IS FULL'); } },
      { label: 'Snack for one', right: fmtMoney(price), icon: 'bread', disabled: r.money < price, onSelect: () => { const m = r.members.slice().sort((a, b) => b.hunger - a.hunger)[0]; r.money -= price; m.hunger = Math.max(0, m.hunger - 1); m.stamina = Math.min(100, m.stamina + 30); Audio.ui('eat'); this.done(m.name.toUpperCase() + ' IS HAPPY'); } },
      { label: 'Buy 3 Uber tickets', right: fmtMoney(9), icon: 'phone', disabled: r.money < 9, onSelect: () => { r.money -= 9; r.tickets += 3; Audio.ui('cash'); this.done('+3 TICKETS'); } },
      { label: 'Leave', icon: 'arrowL', onSelect: () => Game.go(() => new CityScene(), 'slideR') },
    ]);
  }
  done(msg) { this.msg = msg; Game.run.save(); this.menu = new Menu([{ label: 'Leave', icon: 'arrowL', onSelect: () => Game.go(() => new CityScene(), 'slideR') }]); }
  update(dt) { this.t += dt; }
  key(code) { if (code === 'Escape') { Game.go(() => new CityScene(), 'slideR'); return; } this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const r = Game.run; drawTownBackdrop(ctx, this.t, 'day', hashStr(this.node.id) % 40 + 1);
    // storefront
    rect(ctx, 120, 90, 400, 172, '#7a2a2a'); frame(ctx, 120, 90, 400, 172, '#4a1a1a');
    rect(ctx, 130, 100, 380, 40, '#d8b040'); drawText(ctx, this.node.name, 320, 112, '#5a2a10', { align: 'center', scale: 2 });
    for (let i = 0; i < 6; i++) ctx.drawImage(propCanvas('lantern'), 140 + i * 62, 146);
    rect(ctx, 160, 170, 120, 92, '#f0d890'); rect(ctx, 360, 170, 120, 92, '#f0d890');
    drawText(ctx, 'OPEN', 220, 200, '#8a2a2a', { align: 'center', scale: 2 });
    for (let i = 0; i < 4; i++) ctx.drawImage(icon('food'), 380 + (i % 2) * 40, 190 + Math.floor(i / 2) * 34, 30, 26);
    drawParty(ctx, 90, 300, this.t);
    const inner = uiPanel(ctx, 150, 176, 340, 120, { title: this.node.sub || 'FOOD' });
    if (!this.msg) this.menu.draw(ctx, inner.x + 8, inner.y + 6, inner.w - 16, Game.touch ? 16 : 14, 'list');
    else { drawText(ctx, this.msg, inner.x + inner.w / 2, inner.y + 14, '#4f8032', { align: 'center', scale: 2 }); this.menu.draw(ctx, inner.x + 8, inner.y + inner.h - 20, inner.w - 16, 14, 'list'); }
    Game.drawHud(ctx);
  }
}
// ---------- Recruit / open mic ----------
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
  key(code) { if (code === 'Escape') { Game.go(() => new CityScene(), 'slideR'); return; } this.menu.key(code); }
  click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawTownBackdrop(ctx, this.t, 'night', 27);
    rect(ctx, 0, 120, W, 150, 'rgba(20,10,30,0.6)');
    ctx.drawImage(propCanvas('micstand'), 300, 232); ctx.drawImage(propCanvas('speaker'), 200, 228); ctx.drawImage(propCanvas('speaker'), 420, 228);
    ctx.globalAlpha = 0.16; ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.moveTo(300, 90); ctx.lineTo(330, 90); ctx.lineTo(400, 268); ctx.lineTo(240, 268); ctx.fill(); ctx.globalAlpha = 1;
    drawShadow(ctx, 316, 268, 24); drawBugAt(ctx, this.cand.spec, 316, 268, { pose: Math.floor(this.t * 4) % 2 ? 'play' : 'idle', instrument: this.cand.instrument, scale: 1.6 });
    drawParty(ctx, 60, 300, this.t);
    const inner = uiPanel(ctx, 150, 24, 340, 130, { title: this.node.name });
    if (!this.msg) {
      drawText(ctx, this.cand.name.toUpperCase(), inner.x + 14, inner.y + 10, '#7a4a10', { scale: 3 });
      drawText(ctx, INSTRUMENTS[this.cand.instrument].name.toUpperCase(), inner.x + 14, inner.y + 40, UI.ink);
      for (let i = 0; i < this.cand.skill; i++) ctx.drawImage(icon('star'), inner.x + 14 + i * 20, inner.y + 56, 16, 14);
      this.menu.draw(ctx, inner.x + 14, inner.y + 80, inner.w - 28, Game.touch ? 26 : 24, 'list');
    } else { drawText(ctx, this.msg, inner.x + inner.w / 2, inner.y + 40, '#4f8032', { align: 'center', scale: 3 }); this.menu.draw(ctx, inner.x + 14, inner.y + inner.h - 34, inner.w - 28, 24, 'list'); }
    Game.drawHud(ctx);
  }
}
