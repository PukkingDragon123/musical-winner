// ---------- Tokyo: a living map, travelled on a train pass ----------
'use strict';
const MAP_C = { land: '#f3efe4', landHi: '#faf7ee', park: '#c9e6b0', parkDk: '#b2d795', water: '#a6d0ee', waterDk: '#8fc0e4',
  road: '#ffffff', roadBig: '#ffe9a8', roadEdge: '#ddd7c8', bldg: '#e4dfd2', bldgEdge: '#d0c9b8', ink: '#5d6a5d', inkSoft: '#8a927f', hill: '#eae3d0' };
let _sfCache = null;
// ---------- Tile sprites ----------
// One 24x24 pixel tile per kind, cut so the whole city is drawn from squares.
function cityTile(kind, variant, mask) {
  return cached('ctile|' + kind + '|' + variant + '|' + mask, () => {
    const P = new Pix(TILE, TILE), rng = makeRng(kind * 97 + variant * 31 + mask * 7 + 11);
    const flood = (c) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) P.set(x, y, c); };
    const speck = (c, n) => { for (let i = 0; i < n; i++) P.set(rng.int(0, TILE - 1), rng.int(0, TILE - 1), c); };
    switch (kind) {
      case T_WATER: {
        flood(MAP_C.water);
        for (let y = 2; y < TILE; y += 6) for (let x = (y * 5) % 10; x < TILE; x += 10) { P.set(x, y, MAP_C.waterDk); P.set(x + 1, y, MAP_C.waterDk); P.set(x + 2, y, MAP_C.waterDk); }
        speck('#b6dcf4', 4);
        break;
      }
      case T_SHORE: {
        flood(MAP_C.water);
        for (let y = 3; y < TILE; y += 7) for (let x = (y * 3) % 9; x < TILE; x += 9) { P.set(x, y, MAP_C.waterDk); P.set(x + 1, y, MAP_C.waterDk); }
        // a pale surf edge on whichever sides face land
        if (mask & 1) for (let x = 0; x < TILE; x++) { P.set(x, 0, '#d7ecf8'); P.set(x, 1, '#c2e2f4'); }
        if (mask & 2) for (let y = 0; y < TILE; y++) { P.set(TILE - 1, y, '#d7ecf8'); P.set(TILE - 2, y, '#c2e2f4'); }
        if (mask & 4) for (let x = 0; x < TILE; x++) { P.set(x, TILE - 1, '#d7ecf8'); P.set(x, TILE - 2, '#c2e2f4'); }
        if (mask & 8) for (let y = 0; y < TILE; y++) { P.set(0, y, '#d7ecf8'); P.set(1, y, '#c2e2f4'); }
        break;
      }
      case T_PARK: {
        flood(MAP_C.park);
        speck(MAP_C.parkDk, 26); speck('#dcf0c6', 10);
        if (variant % 3 === 0) { const m = P.mask(); P.mEllipse(m, 11, 11, 7, 7); P.fill(m, MAP_C.parkDk, { outline: '#6f9a5a', shade: false }); P.paint(m, (x, y) => (x + y) % 5 === 0 ? '#a8d68e' : null); P.set(11, 19, '#7a5a34'); P.set(12, 19, '#7a5a34'); }
        else if (variant % 3 === 1) { for (let i = 0; i < 5; i++) { const bx = rng.int(2, 19), by = rng.int(2, 19); P.set(bx, by, rng.pick(['#e8563f', '#f2cf4a', '#e07ab0'])); } }
        break;
      }
      case T_PLAZA: {
        flood(MAP_C.land);
        for (let y = 0; y < TILE; y += 8) for (let x = 0; x < TILE; x++) P.set(x, y, '#e6e0cf');
        for (let x = 0; x < TILE; x += 8) for (let y = 0; y < TILE; y++) P.set(x, y, '#e6e0cf');
        speck('#eae4d4', 8);
        break;
      }
      case T_LAND: {
        flood(MAP_C.land); speck(MAP_C.landHi, 8); speck('#e8e2d2', 6);
        break;
      }
      case T_BLDG: {
        flood(MAP_C.land);
        const dense = variant >= 8, v = variant % 6;
        const w = dense ? 20 : 16 + (v % 3) * 2, h = dense ? 20 : 15 + (v % 2) * 4;
        const x0 = Math.floor((TILE - w) / 2), y0 = Math.floor((TILE - h) / 2);
        const roof = ['#e4dfd2', '#d8cfc0', '#e9e0c8', '#cfd2cc', '#ece4cf', '#d4cdbe', '#e0d4c4', '#dbd8cd'][(variant * 3 + v) % 8];
        const m = P.mask(); P.mRect(m, x0, y0, w, h); P.fill(m, roof, { outline: '#c0b8a4', shade: false });
        P.paint(m, (x, y) => y === y0 ? '#f2eee2' : y === y0 + h - 1 ? '#c8c0ac' : x === x0 + w - 1 ? '#cec6b2' : null);
        // roof furniture so the blocks are not flat
        if (v % 3 === 0) { const t2 = P.mask(); P.mRect(t2, x0 + 3, y0 + 3, 5, 4); P.fill(t2, '#c4bca8', { shade: false }); }
        if (v % 4 === 1) { const t2 = P.mask(); P.mRect(t2, x0 + w - 8, y0 + h - 7, 6, 5); P.fill(t2, '#cfc7b3', { shade: false }); }
        if (dense && v % 2 === 0) for (let i = 0; i < 3; i++) P.set(x0 + 4 + i * 5, y0 + h - 3, '#b8b0a0');
        // drop shadow to the south-east
        for (let x = x0 + 2; x < x0 + w + 2 && x < TILE; x++) P.set(x, Math.min(TILE - 1, y0 + h), '#d8d2c2');
        for (let y = y0 + 2; y < y0 + h + 2 && y < TILE; y++) P.set(Math.min(TILE - 1, x0 + w), y, '#d8d2c2');
        break;
      }
      case T_ROAD: case T_BIGROAD: {
        const big = kind === T_BIGROAD;
        flood(MAP_C.land);
        const road = big ? MAP_C.roadBig : MAP_C.road, edge = MAP_C.roadEdge;
        const halfW = big ? 9 : 7, c = TILE / 2;
        const band = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < TILE && y < TILE) P.set(x, y, road); };
        const casing = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < TILE && y < TILE) P.set(x, y, edge); };
        const n = mask & 1, e = mask & 2, so = mask & 4, we = mask & 8;
        // casing first, then the carriageway
        if (n) casing(c - halfW - 1, 0, halfW * 2 + 2, c + halfW + 1);
        if (so) casing(c - halfW - 1, c - halfW - 1, halfW * 2 + 2, TILE - c + halfW + 1);
        if (we) casing(0, c - halfW - 1, c + halfW + 1, halfW * 2 + 2);
        if (e) casing(c - halfW - 1, c - halfW - 1, TILE - c + halfW + 1, halfW * 2 + 2);
        if (!mask) casing(c - halfW - 1, c - halfW - 1, halfW * 2 + 2, halfW * 2 + 2);
        if (n) band(c - halfW, 0, halfW * 2, c + halfW);
        if (so) band(c - halfW, c - halfW, halfW * 2, TILE - c + halfW);
        if (we) band(0, c - halfW, c + halfW, halfW * 2);
        if (e) band(c - halfW, c - halfW, TILE - c + halfW, halfW * 2);
        if (!mask) band(c - halfW, c - halfW, halfW * 2, halfW * 2);
        // centre line only on straight runs
        const straightV = n && so && !e && !we, straightH = we && e && !n && !so;
        if (big && straightV) for (let y = 2; y < TILE; y += 8) { P.set(c - 1, y, '#f0cf7a'); P.set(c - 1, y + 1, '#f0cf7a'); P.set(c - 1, y + 2, '#f0cf7a'); }
        if (big && straightH) for (let x = 2; x < TILE; x += 8) { P.set(x, c - 1, '#f0cf7a'); P.set(x + 1, c - 1, '#f0cf7a'); P.set(x + 2, c - 1, '#f0cf7a'); }
        if (!big && straightV) for (let y = 3; y < TILE; y += 9) P.set(c - 1, y, '#e6e0d0');
        if (!big && straightH) for (let x = 3; x < TILE; x += 9) P.set(x, c - 1, '#e6e0d0');
        // crossing stripes at junctions
        const arms = (n ? 1 : 0) + (e ? 1 : 0) + (so ? 1 : 0) + (we ? 1 : 0);
        if (arms >= 3) { for (let i = -halfW + 2; i < halfW - 1; i += 3) { if (n) { P.set(c + i, 2, '#e8e2d0'); P.set(c + i, 3, '#e8e2d0'); } if (so) { P.set(c + i, TILE - 3, '#e8e2d0'); P.set(c + i, TILE - 4, '#e8e2d0'); } } }
        break;
      }
    }
    return P.toCanvas();
  });
}
function buildSF() {
  if (_sfCache) return _sfCache;
  const TM = cityTiles();
  const c = makeCanvas(MAPW, MAPH), x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.fillStyle = MAP_C.land; x.fillRect(0, 0, MAPW, MAPH);
  const kindAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? T_LAND : TM.kind[ty * GW + tx];
  const isRoad = (k) => k === T_ROAD || k === T_BIGROAD;
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const k = TM.kind[ty * GW + tx], v = TM.variant[ty * GW + tx];
    let mask = 0;
    if (isRoad(k)) {
      if (isRoad(kindAt(tx, ty - 1))) mask |= 1;
      if (isRoad(kindAt(tx + 1, ty))) mask |= 2;
      if (isRoad(kindAt(tx, ty + 1))) mask |= 4;
      if (isRoad(kindAt(tx - 1, ty))) mask |= 8;
    } else if (k === T_SHORE) {
      if (kindAt(tx, ty - 1) !== T_WATER && kindAt(tx, ty - 1) !== T_SHORE) mask |= 1;
      if (kindAt(tx + 1, ty) !== T_WATER && kindAt(tx + 1, ty) !== T_SHORE) mask |= 2;
      if (kindAt(tx, ty + 1) !== T_WATER && kindAt(tx, ty + 1) !== T_SHORE) mask |= 4;
      if (kindAt(tx - 1, ty) !== T_WATER && kindAt(tx - 1, ty) !== T_SHORE) mask |= 8;
    }
    x.drawImage(cityTile(k, v, mask), tx * TILE, ty * TILE);
  }
  // ---- the outskirts. Everything outside the named districts was bare
  // cream, which read as nothing at all, so the quiet blocks get low houses
  // with coloured roofs, gardens and blossom, the way the real ones do.
  {
    const rr = makeRng(5150);
    const ROOFS = ['#c8564a', '#4a7fc0', '#3f8f6a', '#c8a03a', '#8a6ad0', '#c87a4a', '#5a8fa8'];
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      if (TM.kind[ty * GW + tx] !== T_LAND) continue;
      const bx = tx * TILE, by = ty * TILE;
      const roll = rr();
      if (roll < 0.42) {
        // a house: a footprint, a pitched roof over it, a doorway and a window
        const hw = rr.int(9, 14), hh = rr.int(8, 12);
        const hx = bx + rr.int(2, TILE - hw - 2), hy = by + rr.int(3, TILE - hh - 3);
        const roof = ROOFS[rr.int(0, ROOFS.length - 1)];
        rect(x, hx + 1, hy + 2, hw, hh, 'rgba(0,0,0,0.12)');
        rect(x, hx, hy, hw, hh, '#efe8d8');
        rect(x, hx, hy, hw, Math.ceil(hh * 0.55), roof);
        rect(x, hx, hy, hw, 1, lighten(roof, 0.25));
        rect(x, hx, hy + Math.ceil(hh * 0.55), hw, 1, darken(roof, 0.3));
        rect(x, hx + 2, hy + hh - 4, 3, 4, '#8a6a4a');
        rect(x, hx + hw - 5, hy + hh - 4, 3, 3, '#a8d0e8');
        if (rr.chance(0.35)) { ellipsePx(x, hx + hw + 4, hy + hh - 2, 3.5, 3, '#5aa055'); rect(x, hx + hw + 4, hy + hh - 1, 1, 2, '#6a4a30'); }
      } else if (roll < 0.56) {
        ellipsePx(x, bx + 12, by + 13, 7, 5.6, '#d9829f');
        ellipsePx(x, bx + 12, by + 11, 7, 5.6, '#f2a7c2');
        ellipsePx(x, bx + 10, by + 9, 3.6, 3, '#ffd0e2');
      } else if (roll < 0.66) {
        rect(x, bx + 4, by + 5, TILE - 9, TILE - 11, MAP_C.park);
        for (let i = 0; i < 5; i++) rect(x, bx + 6 + (i * 5) % (TILE - 12), by + 7 + (i * 7) % (TILE - 15), 2, 2, MAP_C.parkDk);
      } else if (roll < 0.70) {
        // a little car on a driveway, for colour
        const cc = ROOFS[rr.int(0, ROOFS.length - 1)];
        rect(x, bx + 7, by + 10, 11, 6, darken(cc, 0.35)); rect(x, bx + 7, by + 10, 11, 5, cc);
        rect(x, bx + 10, by + 11, 5, 3, '#a8d0e8');
      }
    }
  }
  // ---- landmarks that are bigger than one tile
  x.strokeStyle = '#c8432a'; x.lineWidth = 9; x.beginPath(); x.moveTo(225, 132); x.lineTo(90, 30); x.stroke();
  x.strokeStyle = '#9aa0b0'; x.lineWidth = 8; x.beginPath(); x.moveTo(1342, 705); x.lineTo(1500, 645); x.stroke();
  circle(x, 1350, 195, 24, '#d8d2c0'); circle(x, 1350, 195, 20, MAP_C.bldg); x.fillStyle = '#b8b2a0'; x.fillRect(1338, 186, 24, 12);
  // ---- labels last, so they sit on top of the tiles
  x.save();
  for (const st of STREETS) {
    const i = Math.floor(st.pts.length / 2) - 1, a = st.pts[Math.max(0, i)], b = st.pts[Math.min(st.pts.length - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    x.save(); x.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); x.rotate(Math.abs(ang) > Math.PI / 2 ? ang + Math.PI : ang);
    drawText(x, st.name, 0, -2, MAP_C.ink, { align: 'center', font: 'small' }); x.restore();
  }
  x.restore();
  for (const d of DISTRICTS) drawText(x, d.name.split('').join(' '), d.x, d.y, MAP_C.inkSoft, { align: 'center' });
  for (const w of WATER) if (w.name) { const xs = w.poly.map(p => p[0]), ys = w.poly.map(p => p[1]); drawText(x, w.name.split('').join(' '), (Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, '#6f9cc4', { align: 'center' }); }
  // Everything a real city map has on it and this one did not: stations on
  // the loop, painted crossings, torii at the shrines, bridges over the
  // water, clumps of trees in the parks, and the towers marked where they
  // actually stand.
  for (const d of MAP_DETAILS) {
    if (d.kind === 'label') { drawText(x, d.text, d.x, d.y, '#6f9cc4', { align: 'center' }); continue; }
    if (d.kind === 'station') {
      rect(x, d.x - 6, d.y - 6, 13, 13, '#ffffff');
      frame(x, d.x - 6, d.y - 6, 13, 13, '#2f4a68'); frame(x, d.x - 4, d.y - 4, 9, 9, '#2f4a68');
      rect(x, d.x - 2, d.y - 2, 5, 5, '#2f4a68');
      drawText(x, d.text, d.x, d.y + 10, '#41648a', { align: 'center', font: 'small' });
      continue;
    }
    if (d.kind === 'crossing') {
      for (let i = -3; i <= 3; i++) { rect(x, d.x + i * 4, d.y - 9, 2, 18, '#ffffff'); rect(x, d.x - 9, d.y + i * 4, 18, 2, '#ffffff'); }
      continue;
    }
    if (d.kind === 'torii') {
      rect(x, d.x - 9, d.y - 7, 19, 3, '#c8402c'); rect(x, d.x - 7, d.y - 3, 15, 2, '#c8402c');
      rect(x, d.x - 5, d.y - 7, 3, 12, '#c8402c'); rect(x, d.x + 3, d.y - 7, 3, 12, '#c8402c');
      continue;
    }
    if (d.kind === 'bridge') {
      x.save(); x.translate(d.x, d.y); x.rotate(d.a || 0);
      rect(x, -16, -3, 32, 6, '#e8e4dc'); rect(x, -16, -3, 32, 1, '#ffffff');
      for (let i = -14; i < 15; i += 6) rect(x, i, -6, 2, 12, '#b8b2a8');
      x.restore(); continue;
    }
    if (d.kind === 'trees') {
      for (const [ox, oy, r] of [[0, 0, 6], [9, 4, 5], [-8, 5, 4], [4, -7, 4]]) {
        ellipsePx(x, d.x + ox, d.y + oy + 1, r, r * 0.8, '#3f7a44');
        ellipsePx(x, d.x + ox, d.y + oy, r, r * 0.8, '#5aa055');
        ellipsePx(x, d.x + ox - r * 0.3, d.y + oy - r * 0.3, r * 0.45, r * 0.35, '#7cc06a');
      }
      continue;
    }
    if (d.kind === 'sakura') {
      // blossom from above: a pink canopy, a paler crown and a few loose
      // petals on the ground under it
      const r = d.r || 1;
      ellipsePx(x, d.x, d.y + 2, 7 * r, 5.6 * r, '#d9829f');
      ellipsePx(x, d.x, d.y, 7 * r, 5.6 * r, '#f2a7c2');
      ellipsePx(x, d.x - 2 * r, d.y - 2 * r, 4 * r, 3.2 * r, '#ffd0e2');
      ellipsePx(x, d.x + 3 * r, d.y + 1 * r, 2.4 * r, 2 * r, '#ffe4ef');
      for (let i = 0; i < 3; i++) rect(x, d.x + (i * 5 % 9) - 5, d.y + 6 + (i % 2) * 2, 1, 1, '#ffc6dd');
      continue;
    }
    if (d.kind === 'flowers') {
      const cols = [['#e8506a', '#ffb0c0'], ['#e8a020', '#ffd88a'], ['#6a5ad0', '#b8a8f0'], ['#e0e0e0', '#ffffff']][d.c % 4];
      ellipsePx(x, d.x, d.y, 6, 4, '#7fb85f');
      for (let i = 0; i < 7; i++) { const a = i * 0.9, fx = d.x + Math.cos(a) * 4, fy = d.y + Math.sin(a) * 2.6; rect(x, fx, fy, 2, 2, cols[i % 2]); }
      continue;
    }
    if (d.kind === 'awning') {
      const cols = ['#e0523c', '#3f7fd0', '#e09030', '#2fa36b', '#9b59d0', '#d9a520'][d.c % 6];
      x.save(); x.translate(d.x, d.y); x.rotate(d.a || 0);
      rect(x, -6, -4, 12, 8, darken(cols, 0.3));
      rect(x, -6, -4, 12, 6, cols);
      for (let i = -6; i < 6; i += 4) rect(x, i, -4, 2, 6, lighten(cols, 0.25));
      rect(x, -6, 2, 12, 1, '#fff6e8');
      x.restore(); continue;
    }
    if (d.kind === 'parked') {
      const cols = ['#e8e4dc', '#2f4a68', '#c8402c', '#e8c040', '#3f8f6a', '#8a4fd0', '#ffffff'][d.c % 7];
      x.save(); x.translate(d.x, d.y); x.rotate(d.a || 0);
      rect(x, -7, -3, 14, 7, darken(cols, 0.35));
      rect(x, -7, -3, 14, 6, cols);
      rect(x, -3, -2, 6, 4, '#8fc0e4');
      rect(x, 6, -2, 2, 2, '#ffe9a8');
      x.restore(); continue;
    }
    if (d.kind === 'mascot') { drawMascotSmall(x, d.x, d.y, d.m, d.c, 0.62); continue; }
    if (d.kind === 'tower') {
      const c2 = landmarkCanvas(d.text === 'SKYTREE' ? 'skytree' : 'tokyotower');
      const h2 = 30, w2 = Math.round(c2.width * h2 / c2.height);
      x.globalAlpha = 0.9; x.drawImage(c2, d.x - w2 / 2, d.y - h2, w2, h2); x.globalAlpha = 1;
      drawText(x, d.text, d.x, d.y + 3, '#41648a', { align: 'center', font: 'small' });
      continue;
    }
  }
  _sfCache = { canvas: c, graph: buildGraph(), tiles: TM };
  return _sfCache;
}
// Every district in this city has something round with a face on it standing
// outside a shop, so the map has them too: a little chibi mascot, waving.
function drawMapMascot(ctx, x, y, kind, ci = 0) {
  const body = ['#f2a7c2', '#8fd8f0', '#ffd24a', '#a8e08a', '#f0a070', '#c8b0f0'][ci % 6];
  const dk = darken(body, 0.3), hi = lighten(body, 0.3);
  ellipsePx(ctx, x, y + 9, 8, 3, 'rgba(0,0,0,0.2)');
  // legs and the little feet
  rect(ctx, x - 5, y + 4, 4, 5, dk); rect(ctx, x + 1, y + 4, 4, 5, dk);
  // the body, which on a mascot is nearly all of it
  ellipsePx(ctx, x, y - 3, 10, 10, dk);
  ellipsePx(ctx, x, y - 4, 9, 9, body);
  ellipsePx(ctx, x - 3, y - 8, 4, 3, hi);
  // whatever it is supposed to be
  if (kind === 'cat') { for (const s2 of [-1, 1]) { rect(ctx, x + s2 * 6 - 1, y - 15, 3, 5, body); rect(ctx, x + s2 * 6, y - 14, 1, 3, '#e8708f'); } }
  else if (kind === 'bird') { rect(ctx, x - 1, y - 4, 3, 3, '#e8a020'); rect(ctx, x - 9, y - 6, 3, 6, hi); rect(ctx, x + 7, y - 6, 3, 6, hi); }
  else if (kind === 'bean') { rect(ctx, x - 1, y - 16, 2, 5, '#5a8a3a'); rect(ctx, x + 1, y - 17, 5, 3, '#6aa04a'); }
  else if (kind === 'fish') { rect(ctx, x - 13, y - 7, 4, 8, dk); rect(ctx, x - 12, y - 6, 3, 6, body); }
  else { for (const s2 of [-1, 1]) { ellipsePx(ctx, x + s2 * 7, y - 11, 3.5, 3.5, body); ellipsePx(ctx, x + s2 * 7, y - 11, 2, 2, '#e8708f'); } }
  // the face: two dots, a blush and a permanent smile
  rect(ctx, x - 4, y - 6, 2, 2, '#241a2e'); rect(ctx, x + 3, y - 6, 2, 2, '#241a2e');
  rect(ctx, x - 7, y - 3, 3, 2, '#ff9ab0'); rect(ctx, x + 5, y - 3, 3, 2, '#ff9ab0');
  rect(ctx, x - 2, y - 2, 4, 1, '#241a2e'); rect(ctx, x - 3, y - 3, 1, 1, '#241a2e'); rect(ctx, x + 2, y - 3, 1, 1, '#241a2e');
  // one arm up, permanently mid-wave
  rect(ctx, x + 8, y - 9, 4, 3, body); rect(ctx, x + 11, y - 12, 3, 4, body);
}
// The mascot at full size is a big cartoon; on the map it needs to be the
// size of a person. Drawn once into a sprite, then blitted down with
// smoothing off so it stays pixel art instead of turning to mush.
const _mascotCache = {};
function mascotCanvas(kind, ci) {
  const key = kind + ci;
  if (_mascotCache[key]) return _mascotCache[key];
  const c = makeCanvas(40, 36), g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  drawMapMascot(g, 18, 24, kind, ci);
  _mascotCache[key] = c;
  return c;
}
function drawMascotSmall(ctx, x, y, kind, ci, sc) {
  const c = mascotCanvas(kind, ci), w = Math.round(c.width * sc), h = Math.round(c.height * sc);
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, Math.round(x - 18 * sc), Math.round(y - 24 * sc), w, h);
  ctx.imageSmoothingEnabled = sm;
}
const PIN_COLOR = { venue: '#e0523c', shop: '#3f7fd0', food: '#e09030', recruit: '#9b59d0', event: '#2fa36b', rest: '#3fa8b8', pickup: '#d9a520', mystery: '#8a4fd0', inside: '#2f7a86', home: '#666' };
function drawPin(ctx, x, y, node, opts = {}) {
  const col = opts.done ? '#9a9a94' : (PIN_COLOR[node.type] || '#e0523c'), big = opts.sel ? 1 : 0;
  // A question mark does not sit still. It bobs, and it throws a little light,
  // because it is the only pin on the map that will not tell you what it is.
  const myst = node.type === 'mystery' && !opts.done;
  if (myst) {
    const ph = (x * 0.13 + y * 0.07);
    y += Math.round(Math.sin(ANIM_T * 2.4 + ph) * 2);
    ctx.globalAlpha = 0.16 + 0.12 * (0.5 + 0.5 * Math.sin(ANIM_T * 3.1 + ph));
    ellipsePx(ctx, x, y - 24, 19, 19, '#c58bff');
    ctx.globalAlpha = 1;
  }
  const h = 30 + big * 4, w = 24 + big * 3;
  ellipsePx(ctx, x, y + 1, 9 + big, 3.5, 'rgba(0,0,0,0.22)');
  // teardrop, built from a pixel disc and a stepped point
  const hr2 = Math.round(w / 2), headY = Math.round(y - h + 6 + hr2 * 0.2);
  circle(ctx, x, headY, hr2, col);
  for (let i = 0; i <= Math.round(h * 0.55); i++) {
    const k = i / Math.max(1, Math.round(h * 0.55));
    const hwid = Math.max(1, Math.round(hr2 * (1 - k * k) * 0.98));
    ctx.fillStyle = col; ctx.fillRect(Math.round(x) - hwid, headY + hr2 - 1 + i, hwid * 2, 1);
  }
  ctx.strokeStyle = darken(col, 0.25); ctx.lineWidth = 1; ctx.stroke();
  circle(ctx, x, y - h + 6, w / 2 - 4, '#fff8ee');
  const ic = icon(node.icon || 'event'); ctx.drawImage(ic, Math.round(x - ic.width * 0.7), Math.round(y - h + 6 - ic.height * 0.7), Math.round(ic.width * 1.4), Math.round(ic.height * 1.4));
  if (opts.done) { ctx.globalAlpha = 0.5; circle(ctx, x, y - h + 6, w / 2 - 4, '#fff'); ctx.globalAlpha = 1; ctx.drawImage(icon('check'), Math.round(x - 5), Math.round(y - h + 2), 11, 9); }
  if (myst) {
    // three sparks going round it, so it catches the eye across the map
    for (let i = 0; i < 3; i++) {
      const a2 = ANIM_T * 1.5 + i * 2.1, sx = x + Math.cos(a2) * 15, sy = y - 24 + Math.sin(a2) * 9;
      ctx.globalAlpha = 0.45 + 0.4 * Math.sin(ANIM_T * 5 + i);
      rect(ctx, sx - 1, sy, 3, 1, '#f0d8ff'); rect(ctx, sx, sy - 1, 1, 3, '#f0d8ff');
      ctx.globalAlpha = 1;
    }
  }
}
class CityScene {
  constructor(arrive) {
    const r = Game.run; this.t = 0; this.sf = buildSF(); this.G = this.sf.graph;
    this.arriveT = (arrive || Game.run.today && Game.run.today.gigs === 0 && Game.run.today.tiles === 0) ? 3.4 : 0; this.travel = null; this.msg = null; this.msgT = 0;
    this.cam = { x: 0, y: 0 };
    const here = this.G[r.pos] || this.G.ggb; this.centerOn(here, true);
    this.cars = []; const rr = makeRng(9);
    for (let i = 0; i < 16; i++) { const e = rr.pick(EDGES); this.cars.push({ a: e[0], b: e[1], k: rr.range(0, 1), sp: rr.range(0.05, 0.12), seed: rr.int(1, 9999), dir: rr.sign() }); }
    // the pavements: office workers, school kids, somebody in a mascot suit,
    // a dog on a lead, a courier going too fast. Every one of them bobs.
    this.people = [];
    for (let i = 0; i < 96; i++) {
      const e = rr.pick(EDGES);
      const roll = rr();
      const kind = roll < 0.06 ? 'mascot' : roll < 0.14 ? 'dog' : roll < 0.22 ? 'kid' : 'walker';
      this.people.push({ a: e[0], b: e[1], k: rr.range(0, 1), sp: rr.range(0.012, 0.032) * (kind === 'dog' ? 1.5 : 1),
        col: rr.pick(NPC_PALETTES), hair: rr.pick(['#3a3040', '#241a2e', '#6a4a30', '#8a2a4a', '#c8a03a']),
        kind, mc: rr.int(0, 5), ph: rr.range(0, 6.3), bag: rr.chance(0.3) });
    }
    // blossom on the wind, right across the viewport
    this.petals = [];
    for (let i = 0; i < 70; i++) this.petals.push({ x: rr.range(0, W), y: rr.range(26, H), sp: rr.range(14, 34), sw: rr.range(0.6, 1.6), ph: rr.range(0, 6.3), s: rr.int(2, 3) });
    this.fx = new Particles(); this.sel = 0;
    this.grid = tileGrid();
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
    const r = Game.run; this.t += dt; this.msgT = Math.max(0, this.msgT - dt); this.arriveT = Math.max(0, this.arriveT - dt); this.goalPop = Math.max(0, (this.goalPop || 0) - dt);
    this.cam.x = lerp(this.cam.x, this.target.x, Math.min(1, dt * 4)); this.cam.y = lerp(this.cam.y, this.target.y, Math.min(1, dt * 4));
    for (const c of this.cars) { c.k += c.sp * dt; if (c.k > 1) { c.k = 0; const e = EDGES[Math.floor(Math.random() * EDGES.length)]; c.a = e[0]; c.b = e[1]; } }
    for (const p of this.people) { p.k += p.sp * dt; if (p.k > 1) { p.k = 0; const e = EDGES[Math.floor(Math.random() * EDGES.length)]; p.a = e[0]; p.b = e[1]; } }
    // petals cross the viewport regardless of where the camera is, because
    // the wind does not care which street you are looking at
    for (const pt of this.petals) {
      pt.x -= pt.sp * dt * 0.7; pt.y += pt.sp * dt;
      if (pt.y > H || pt.x < -6) { pt.x = Math.random() * (W + 120); pt.y = 20 - Math.random() * 60; }
    }
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
      r.today.tiles = (r.today.tiles || 0) + 1;
      const gh = checkGoals(r); if (gh) this.goalDone(gh);
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
      case 'mystery': Game.go(() => new MysteryScene(n), 'iris'); break;
      case 'inside': Game.go(() => new InteriorScene(n), 'iris'); break;
      case 'rest': Game.go(() => new RestScene(n), 'fade'); break;
      case 'pickup': {
        if (done[n.id] === r.day) { this.flash('NOTHING LEFT HERE'); break; }
        done[n.id] = r.day;
        const roll = r.rng();
        if (roll < 0.4) { const c = 6 + r.day * 3; r.money += c; this.flash('FOUND ' + fmtMoney(c)); Audio.ui('coin'); }
        else if (roll < 0.7) { r.tickets += 2; this.flash('+2 TRAIN RIDES'); Audio.ui('select'); }
        else if (roll < 0.88) { const k = r.rng.pick(CONSUMABLE_KEYS); if (r.consumables.length < 6) { r.consumables.push(k); this.flash('FOUND ' + CONSUMABLES[k].name.toUpperCase()); } else { r.money += 8; this.flash('POCKETS FULL. +$8'); } Audio.ui('coin'); }
        else { const k = r.randomCharm(); if (k && r.addCharm(k)) { this.flash('FOUND ' + CHARMS[k].name.toUpperCase()); Audio.ui('fanfare'); } else { r.money += 12; this.flash('+$12'); } }
        this.refresh(); r.save(); break;
      }
      default: this.refresh();
    }
  }
  goalDone(g) { this.flash(GOALS[g.key].name + '  ' + goalRewardText(g)); Audio.ui('fanfare'); this.goalPop = 1.6; }
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
    for (const p2 of this.people) {
      const p = this.edgePos(p2.a, p2.b, p2.k), s = { x: Math.round(p.x - cam.x), y: Math.round(p.y - cam.y + 26) };
      if (s.x < -8 || s.x > W + 8 || s.y < 20 || s.y > H) continue;
      const bob = Math.sin(this.t * 7 + p2.ph) > 0 ? 1 : 0;
      const y2 = s.y - bob;
      ellipsePx(ctx, s.x + 1, s.y + 1, 3, 1.4, 'rgba(0,0,0,0.18)');
      if (p2.kind === 'mascot') { drawMascotSmall(ctx, s.x, y2, ['cat', 'bird', 'bean', 'fish', 'bear'][p2.mc % 5], p2.mc, 0.5); continue; }
      if (p2.kind === 'dog') {
        rect(ctx, s.x - 3, y2 - 4, 6, 3, p2.hair); rect(ctx, s.x + 3, y2 - 5, 2, 2, p2.hair);
        rect(ctx, s.x - 3, y2 - 1, 1, 2, p2.hair); rect(ctx, s.x + 1, y2 - 1, 1, 2, p2.hair);
        continue;
      }
      const hh = p2.kind === 'kid' ? 4 : 6;
      rect(ctx, s.x - 1, y2 - hh, 4, hh, p2.col);                 // body
      rect(ctx, s.x - 1, y2 - hh, 4, 2, lighten(p2.col, 0.2));    // collar
      rect(ctx, s.x - 1, y2 - hh - 3, 4, 3, '#f0d0b0');           // head
      rect(ctx, s.x - 1, y2 - hh - 4, 4, 2, p2.hair);             // hair
      if (bob) rect(ctx, s.x + 3, y2 - hh + 1, 1, 2, p2.col);     // the arm swinging
      if (p2.bag) rect(ctx, s.x + 3, y2 - hh + 2, 2, 3, '#c8402c');
      if (p2.kind === 'kid') rect(ctx, s.x - 2, y2 - hh - 5, 6, 1, '#e8c040');
    }
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
    // How the city looks depends on how far you have climbed back. Day one
    // is cold and washed out; by the end it has colour again.
    const lift = clamp((r.day * 0.2) + (r.members.length - 1) * 0.1 + clamp(r.money / 220, 0, 0.3), 0, 1);
    grade(ctx, 0, 26, W, H - 60, lift > 0.5 ? '#ffd9a0' : '#5f7ea8', lift > 0.5 ? (lift - 0.5) * 0.24 : (0.5 - lift) * 0.42);
    if (lift < 0.45) { ctx.globalAlpha = (0.45 - lift) * 0.5; ctx.fillStyle = '#8e93a6'; ctx.fillRect(0, 26, W, H - 60); ctx.globalAlpha = 1; }
    vignetteRect(ctx, 0, 26, W, H - 60, 0.3 + (1 - lift) * 0.2, lift > 0.5 ? '#1a2416' : '#141a26');
    // blossom over the top of everything, heavier on a petal-fall day
    const petalN = r.weather === 'sakura' ? this.petals.length : Math.floor(this.petals.length * 0.45);
    for (let i = 0; i < petalN; i++) {
      const pt = this.petals[i];
      const px2 = Math.round(pt.x + Math.sin(this.t * pt.sw + pt.ph) * 9), py2 = Math.round(pt.y);
      if (py2 < 26 || py2 > H - 34) continue;
      ctx.globalAlpha = 0.75;
      rect(ctx, px2, py2, pt.s, pt.s, i % 3 ? '#ffc6dd' : '#ffe4ef');
      rect(ctx, px2 + 1, py2 + pt.s, 1, 1, '#f2a7c2');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    this.drawHud(ctx);
    if (this.arriveT > 0) {
      const a = clamp(this.arriveT / 2.6, 0, 1);
      ctx.globalAlpha = a;
      rect(ctx, 0, 120, W, 230, 'rgba(10,14,22,0.86)');
      rect(ctx, 0, 120, W, 2, '#c8a03a'); rect(ctx, 0, 348, W, 2, '#c8a03a');
      halftone(ctx, 0, 120, W, 230, '#5f7ea8', 8, 0.12);
      uiRibbon(ctx, W / 2, 134, DAY_NAMES[Math.min(4, r.day)] + '  -  DAY ' + (r.day + 1) + ' OF 5', { scale: 3, color: '#8a2a3a' });
      drawText(ctx, 'TODAY YOU NEED TO', W / 2, 176, '#9aa6bc', { align: 'center' });
      (r.goals || []).forEach((g, i) => {
        const gy = 198 + i * 40;
        ctx.drawImage(itemCanvas(charmArt(GOALS[g.key].icon)), 0, 0, 32, 32, W / 2 - 280, gy - 4, 30, 30);
        drawText(ctx, goalText(g), W / 2 - 240, gy, '#f2e8cc', { scale: 2 });
        drawText(ctx, goalRewardText(g), W / 2 + 280, gy + 4, '#6be585', { align: 'right' });
      });
      ctx.globalAlpha = 1;
    }
    if (this.msgT > 0) { ctx.globalAlpha = clamp(this.msgT, 0, 1); const sc2 = popIn(2.2 - this.msgT, 0.25); const w = textWidth(this.msg, { scale: 2 }) + 30; ctx.save(); ctx.translate(W / 2, 130); ctx.scale(sc2, sc2); rect(ctx, -w / 2, -14, w, 28, '#1a2a1a'); frame(ctx, -w / 2, -14, w, 28, '#6be585'); drawText(ctx, this.msg, 0, -7, '#6be585', { align: 'center', scale: 2 }); ctx.restore(); ctx.globalAlpha = 1; }
  }
  // Today's goals, on a clipboard pinned to the corner of the map.
  drawGoals(ctx) {
    const r = Game.run; if (!r.goals || !r.goals.length) return;
    const w = 226, h = 30 + r.goals.length * 26, x = 10, y = 36;
    const pop = this.goalPop ? 1 + Math.sin(this.goalPop * 12) * 0.06 : 1;
    if (this.goalPop > 0) speedLines(ctx, x + w / 2, y + h / 2, w * 0.55, w * 0.85, 14, '#ffd24a', this.t || 0, 0.28 * clamp(this.goalPop / 1.6, 0, 1));
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.translate(-(x + w / 2), -(y + h / 2));
    ctx.fillStyle = 'rgba(16,12,20,0.3)'; ctx.fillRect(x + 3, y + 4, w, h);
    rect(ctx, x, y, w, h, '#f2e8cc'); frame(ctx, x, y, w, h, '#7a6a48');
    rect(ctx, x, y, w, 20, '#3c4f3a'); rect(ctx, x + 1, y + 1, w - 2, 1, '#5f7a58');
    drawText(ctx, "TODAY'S GOALS", x + w / 2, y + 6, '#f2e8cc', { align: 'center' });
    rect(ctx, x + w / 2 - 12, y - 4, 24, 8, '#b9b3a2'); rect(ctx, x + w / 2 - 10, y - 3, 20, 4, '#d6d0bd');
    r.goals.forEach((g, i) => {
      const gy = y + 24 + i * 26, k = goalProgress(r, g);
      ctx.drawImage(icon(GOALS[g.key].icon), x + 6, gy + 3, 13, 12);
      drawText(ctx, goalText(g), x + 24, gy + 2, g.done ? '#4f8032' : '#4a3a26', { font: 'small' });
      // a little progress rail, and a tick when it lands
      rect(ctx, x + 24, gy + 12, 150, 6, '#d8ccae'); rect(ctx, x + 24, gy + 12, Math.round(150 * k), 6, g.done ? '#5fbf4f' : '#c8a03a');
      frame(ctx, x + 24, gy + 12, 150, 6, '#9a8a66');
      if (g.done) ctx.drawImage(icon('check'), x + 182, gy + 9, 12, 10);
      if (g.done && this.goalPop > 0 && GOALS[g.key].name === (this.msg || '').split('  ')[0])
        comicBurst(ctx, x + w - 6, gy + 12, 'DONE!', '#5fbf4f', clamp(1 - this.goalPop / 1.6, 0, 1), 0.55);
      else drawText(ctx, Math.floor(GOALS[g.key].get(r)) + '/' + g.n, x + 182, gy + 11, '#8a7a58', { font: 'small' });
    });
    ctx.restore();
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
    let cx = bx - 12; for (let i = r.charms.length - 1; i >= 0; i--) { cx -= 20; uiSlotMini(ctx, cx, 4, false, 18); ctx.drawImage(itemCanvas(charmArt(CHARMS[r.charms[i]].icon)), 0, 0, 32, 32, cx + 2, 6, 14, 14); }
    rect(ctx, 0, H - 34, W, 34, 'rgba(250,247,238,0.95)'); rect(ctx, 0, H - 34, W, 2, '#c8c2b0');
    this.drawGoals(ctx);
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
    const sections = [{ instrument: me.instrument, instr: gearInstrument(me.instrument, me.quality), startBar: 0, endBar: Math.min(8, song.bars) }];
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
      ellipsePx(ctx, lx + sw, 36, 15, 18, lc);
      ctx.fillStyle = darken(lc, 0.2); for (let k = -2; k <= 2; k++) rect(ctx, lx + sw - 15, 36 + k * 7, 30, 1, darken(lc, 0.25));
      ellipsePx(ctx, lx + sw - 5, 30, 4, 5, '#f6d98a');
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
      { label: 'Invite to the band', right: fmtMoney(this.price), icon: 'openmic', disabled: r.money < this.price || r.members.length >= 6, onSelect: () => { r.money -= this.price; r.members.push(this.cand); r.today.recruited = (r.today.recruited || 0) + 1; checkGoals(r); Audio.ui('fanfare'); this.done(this.cand.name.toUpperCase() + ' JOINS'); } },
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
      ellipsePx(ctx, tb.x, tb.y, 30, 11, '#8a5f36'); ellipsePx(ctx, tb.x, tb.y - 4, 30, 11, '#a8763c');
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
