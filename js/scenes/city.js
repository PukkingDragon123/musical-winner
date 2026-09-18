// ---------- Tokyo: a living map, travelled on a train pass ----------
'use strict';
// A map of a place, not a diagram of one: ground you could walk on, asphalt
// that is actually asphalt, and water with a bottom to it.
// ---------- Tokyo from above ----------
// The map is drawn the way a top-down city game draws one: grass, asphalt
// with painted lines, a kerb and a pavement between the two, and buildings
// that are buildings — a roof, a front with windows in it, a door with an
// awning over it — rather than coloured footprints.
const MAP_C = {
  land: '#27a37c', landHi: '#37b88c', landLo: '#1d8465', soil: '#a8895f', soilLo: '#8b6f4a',
  ground: '#9aa1ab', groundHi: '#b6bcc4', groundLo: '#7b828c',     // pavement
  park: '#2f9e63', parkDk: '#237f4e',
  water: '#2f7fc0', waterDk: '#2467a0', waterLo: '#1b4f7d', waterHi: '#4fa3dd',
  road: '#262b3d', roadBig: '#2b3145', roadEdge: '#9aa1ab', roadLine: '#e8ecef', roadLineBig: '#f2c94c',
  bldg: '#e8e4da', bldgEdge: '#c8c4b8', ink: '#123024', inkSoft: '#2f5f44', hill: '#eae3d0',
};
// walls, roofs and awnings, picked so a block of them still reads as a block
const WALL_COLS = ['#f0ece2', '#e8dcc8', '#c8d2d8', '#d8c0b0', '#b9c8d0', '#e0d0c0', '#cfd8cf', '#e6dce8'];
const ROOF_COLS = ['#4a5260', '#b4483c', '#3f6f9e', '#5f6a52', '#8a5f7a', '#7a6a58', '#43606a', '#9a5a4a'];
const AWNING_COLS = ['#d8483c', '#2f7fc0', '#e0a02a', '#3f9a5a', '#8a4fd0', '#d8683c'];
let _sfCache = null;
// How close the map sits to your eye. The whole city at 1:1 was a diagram you
// squinted at; half again as big is a place.
const MAP_Z = 2.2;
const MAP_VW = () => MAPW * MAP_Z, MAP_VH = () => MAPH * MAP_Z;
// ---------- Ground tiles ----------
// Only the ground is tiled now. Roads, pavements and buildings are drawn over
// the top of it as real objects, because a building cut into 24px squares is
// how you end up with a diagram.
function cityTile(kind, variant, mask) {
  return cached('ctile|' + kind + '|' + variant + '|' + mask, () => {
    const P = new Pix(TILE, TILE), rng = makeRng(kind * 97 + variant * 31 + mask * 7 + 11);
    const flood = (c) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) P.set(x, y, c); };
    const box = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < TILE && y < TILE) P.set(x, y, c); };
    const speck = (c, n) => { for (let i = 0; i < n; i++) P.set(rng.int(0, TILE - 1), rng.int(0, TILE - 1), c); };
    const grain = (a, b, density) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (rng.chance(density)) P.set(x, y, (x + y) % 2 ? a : b); };
    switch (kind) {
      case T_WATER: {
        flood(MAP_C.water);
        for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
          const n = (Math.sin((x + variant * 3) * 0.5) + Math.cos((y - variant) * 0.42)) * 0.5;
          if (n > 0.45) P.set(x, y, MAP_C.waterDk); else if (n < -0.55) P.set(x, y, MAP_C.waterLo);
        }
        for (let y = 2; y < TILE; y += 5) for (let x = (y * 5) % 9; x < TILE; x += 9) box(x, y, 3, 1, MAP_C.waterHi);
        speck('#7fc0ea', 4);
        break;
      }
      case T_SHORE: {
        flood(MAP_C.water);
        for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (((x * 3 + y * 5 + variant) % 11) === 0) P.set(x, y, MAP_C.waterDk);
        const sand = '#d8c496', wet = '#a68f68', foam = '#eaf8ff';
        if (mask & 1) { box(0, 0, TILE, 4, MAP_C.waterHi); box(0, 0, TILE, 2, sand); box(0, 2, TILE, 1, wet); for (let x = (variant % 4); x < TILE; x += 5) P.set(x, 3, foam); }
        if (mask & 2) { box(TILE - 4, 0, 4, TILE, MAP_C.waterHi); box(TILE - 2, 0, 2, TILE, sand); box(TILE - 3, 0, 1, TILE, wet); for (let y = (variant % 4); y < TILE; y += 5) P.set(TILE - 4, y, foam); }
        if (mask & 4) { box(0, TILE - 4, TILE, 4, MAP_C.waterHi); box(0, TILE - 2, TILE, 2, sand); box(0, TILE - 3, TILE, 1, wet); for (let x = (variant % 4); x < TILE; x += 5) P.set(x, TILE - 4, foam); }
        if (mask & 8) { box(0, 0, 4, TILE, MAP_C.waterHi); box(0, 0, 2, TILE, sand); box(2, 0, 1, TILE, wet); for (let y = (variant % 4); y < TILE; y += 5) P.set(3, y, foam); }
        break;
      }
      case T_PARK: {
        flood(MAP_C.park);
        for (let y = 0; y < TILE; y++) if (((y + variant * 3) % 8) < 4) for (let x = 0; x < TILE; x++) P.set(x, y, '#38ac6e');
        grain(MAP_C.parkDk, '#48bd7c', 0.26);
        if (variant % 4 === 3) for (let i = 0; i < TILE; i++) { const py = Math.round(10 + Math.sin((i / (TILE - 1)) * Math.PI * (variant % 2 ? 1 : 2)) * 4); box(i, py, 1, 5, '#c8b789'); box(i, py, 1, 1, '#ddd0a8'); box(i, py + 5, 1, 1, '#9e8d63'); }
        break;
      }
      case T_PLAZA: {
        flood(MAP_C.ground);
        for (let y = 0; y < TILE; y += 6) for (let x = ((y / 6) % 2) * 6; x < TILE; x += 12) box(x, y, 11, 5, rng.chance(0.5) ? MAP_C.groundHi : MAP_C.ground);
        for (let y = 5; y < TILE; y += 6) box(0, y, TILE, 1, MAP_C.groundLo);
        for (let x = 11; x < TILE; x += 12) box(x, 0, 1, TILE, MAP_C.groundLo);
        grain(MAP_C.groundLo, MAP_C.groundHi, 0.12);
        break;
      }
      default: {          // grass: under the blocks, the roads and everything else
        flood(MAP_C.land);
        grain(MAP_C.landLo, MAP_C.landHi, 0.3);
        if (kind === T_LAND && variant % 5 === 0) { for (let y = 1; y < TILE; y += 3) box(0, y, TILE, 2, MAP_C.soil); for (let y = 2; y < TILE; y += 3) box(0, y, TILE, 1, MAP_C.soilLo); }
        else if (kind === T_LAND && variant % 5 === 1) { const m = P.mask(); P.mEllipse(m, rng.int(6, 17), rng.int(6, 17), rng.int(4, 8), rng.int(4, 7)); P.fill(m, MAP_C.soil, { shade: false }); }
        for (let i = 0; i < 5; i++) { const gx = rng.int(1, TILE - 3), gy = rng.int(1, TILE - 3); P.set(gx, gy, MAP_C.landLo); P.set(gx + 1, gy - 1, MAP_C.landHi); }
        break;
      }
    }
    return P.toCanvas();
  });
}
// ---------- The big egg is a beetle ----------
// Seen from the air the stadium is a rhinoceros beetle: the bowl is the wing
// case, split down the middle by the roof seam; the entrance hall is the
// thorax with the horn of the main canopy over the doors; six ramps come off
// it like legs; two lighting masts stand where the antennae would be. It is
// still a stadium — that is the joke and the point.
function drawBeetleStadium(x, cx, cy) {
  const R = 190, W2 = 150;                       // how big the shell is
  // ---- the plaza it stands in
  ellipsePx(x, cx, cy + 10, R + 70, W2 + 62, '#9aa1ab');
  for (let i = 0; i < 700; i++) { const a = (i * 2.399), r2 = Math.sqrt(i / 700) * (R + 66); const px2 = cx + Math.cos(a) * r2, py2 = cy + 10 + Math.sin(a) * r2 * 0.78; if ((i % 7) === 0) rect(x, px2, py2, 2, 2, '#8a919b'); }
  ellipsePx(x, cx, cy + 10, R + 52, W2 + 46, '#b6bcc4');
  // paths radiating out to the streets
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (0.18 + i * 0.22);
    x.save(); x.translate(cx, cy + 10); x.rotate(a);
    rect(x, -10, 0, 20, R + 78, '#cfd4da'); rect(x, -10, 0, 2, R + 78, '#e0e4ea');
    x.restore();
  }
  // ---- six legs, angled off the body, which are the entrance ramps
  for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
    const ay = cy - 60 + i * 66, len = 120 + i * 18, ang = side * (0.5 + i * 0.16);
    x.save(); x.translate(cx + side * (R * 0.62), ay); x.rotate(ang);
    rect(x, 0, -13, len, 26, '#4a5260'); rect(x, 0, -13, len, 4, '#6a7280');
    for (let k = 10; k < len - 8; k += 16) rect(x, k, -9, 8, 18, '#5f6a78');
    rect(x, len - 26, -18, 26, 36, '#39414e');            // the foot
    rect(x, len - 26, -18, 26, 4, '#5a6270');
    x.restore();
  }
  // ---- the shell: two wing cases, meeting down a seam, narrower at the top
  // the way a beetle's are, with the bowl of the stadium open between them
  ellipsePx(x, cx + 8, cy + 14, R + 4, W2 + 4, '#1c212b');            // the shadow under the whole thing
  for (const side of [-1, 1]) {
    const wx = cx + side * R * 0.44;
    x.save();
    x.translate(wx, cy + 6); x.rotate(side * 0.09);
    // the case itself: a rounded shell, wider at the bottom
    ellipsePx(x, 0, 0, R * 0.56, W2 * 0.98, '#28303c');
    ellipsePx(x, 0, -2, R * 0.52, W2 * 0.94, '#48566a');
    ellipsePx(x, side * -R * 0.06, -W2 * 0.22, R * 0.4, W2 * 0.6, '#5a6c82');
    // the ribs, running down the length of it
    x.globalAlpha = 0.4;
    for (let i = -4; i <= 4; i++) {
      const rx = i * R * 0.1;
      ellipseRingPx(x, rx * 0.4, 0, Math.abs(R * 0.5 - Math.abs(rx) * 0.7), W2 * 0.9, '#323b49');
    }
    x.globalAlpha = 1;
    // the outer rim, catching the light
    x.globalAlpha = 0.55; ellipseRingPx(x, 0, -3, R * 0.52, W2 * 0.94, '#8a9ab0'); x.globalAlpha = 1;
    // a few pinpricks of light along the roof edge
    for (let i = 0; i < 14; i++) { const a = i * 0.45; rect(x, Math.cos(a) * R * 0.5, Math.sin(a) * W2 * 0.9, 2, 2, '#ffe9a8'); }
    x.restore();
  }
  // the seam between them, lit down its length
  rect(x, cx - 5, cy - W2 * 0.92, 10, W2 * 1.9, '#1e242e');
  rect(x, cx - 1, cy - W2 * 0.86, 2, W2 * 1.78, '#8ad8ff');
  ellipsePx(x, cx, cy - W2 * 0.92, 7, 5, '#39414e');
  // ---- the bowl: the open middle, where the pitch is
  ellipsePx(x, cx, cy + 12, R * 0.46, W2 * 0.56, '#12161f');
  ellipsePx(x, cx, cy + 12, R * 0.42, W2 * 0.5, '#1b2230');
  // tiers of seats round it
  for (let i = 0; i < 5; i++) { x.globalAlpha = 0.65; ellipseRingPx(x, cx, cy + 12, R * (0.42 - i * 0.03), W2 * (0.5 - i * 0.035), i % 2 ? '#8a3a2c' : '#2f4a8a'); x.globalAlpha = 1; }
  ellipsePx(x, cx, cy + 12, R * 0.28, W2 * 0.33, '#2f7a4a');
  for (let i = 0; i < 8; i++) { x.globalAlpha = 0.16; rect(x, cx - R * 0.26 + i * (R * 0.52 / 8), cy + 12 - W2 * 0.31, R * 0.26 / 8, W2 * 0.62, '#ffffff'); x.globalAlpha = 1; }
  ellipsePx(x, cx, cy + 12, R * 0.12, W2 * 0.13, '#e8e4f0');          // the stage in the middle
  x.globalAlpha = 0.3; ellipsePx(x, cx, cy + 12, R * 0.2, W2 * 0.22, '#cfe4ff'); x.globalAlpha = 1;
  // ---- the thorax: the entrance hall at the north end
  ellipsePx(x, cx, cy - W2 - 30, 86, 46, '#2f3a48');
  ellipsePx(x, cx, cy - W2 - 32, 78, 40, '#4a5768');
  rect(x, cx - 60, cy - W2 - 36, 120, 8, '#5f6e82');
  for (let i = 0; i < 7; i++) rect(x, cx - 52 + i * 17, cy - W2 - 18, 11, 16, '#ffd24a');   // the doors, lit
  // the horn over the doors
  x.fillStyle = '#5f6e82';
  x.beginPath();
  x.moveTo(cx - 16, cy - W2 - 52); x.lineTo(cx + 16, cy - W2 - 52);
  x.lineTo(cx + 8, cy - W2 - 118); x.lineTo(cx + 22, cy - W2 - 132);
  x.lineTo(cx, cy - W2 - 126); x.lineTo(cx - 22, cy - W2 - 132);
  x.lineTo(cx - 8, cy - W2 - 118); x.fill();
  rect(x, cx - 14, cy - W2 - 52, 28, 5, '#8a98ac');
  // ---- the antennae: two lighting masts
  for (const side of [-1, 1]) {
    const mx = cx + side * 72, my = cy - W2 - 60;
    x.save(); x.translate(mx, my); x.rotate(side * 0.34);
    rect(x, -3, -96, 6, 96, '#6a7280'); rect(x, -3, -96, 2, 96, '#98a2b0');
    rect(x, -16, -110, 32, 16, '#39414e');
    for (let i = 0; i < 4; i++) rect(x, -13 + i * 8, -107, 5, 10, '#fff2c0');
    x.restore();
  }
  // ---- the name, on the plaza
  x.globalAlpha = 0.5; drawText(x, 'B E E T L E   D O M E', cx, cy + W2 + 28, '#ffffff', { align: 'center', scale: 2 }); x.globalAlpha = 1;
  x.globalAlpha = 0.9; drawText(x, 'B E E T L E   D O M E', cx, cy + W2 + 27, '#26301f', { align: 'center', scale: 2 }); x.globalAlpha = 1;
}
// ---------- A building ----------
// Roof at the top, front wall with windows below it, a door with an awning
// over it and a sign beside the door. Drawn in map pixels, over however many
// tiles the block gave it.
function drawMapBuilding(x, bx, by, bw, bh, rng) {
  const inset = 3;
  const X = bx + inset, Y = by + inset, W2 = bw - inset * 2, H2 = bh - inset * 2;
  if (W2 < 10 || H2 < 12) return;
  const wall = WALL_COLS[rng.int(0, WALL_COLS.length - 1)];
  const roof = ROOF_COLS[rng.int(0, ROOF_COLS.length - 1)];
  const awn = AWNING_COLS[rng.int(0, AWNING_COLS.length - 1)];
  const faceH = clamp(Math.round(H2 * 0.46), 12, 34);         // how much front you can see
  const roofH = H2 - faceH;
  // ---- the shadow it throws
  x.fillStyle = 'rgba(10,26,20,0.3)'; x.fillRect(X + 4, Y + 5, W2, H2);
  // ---- roof
  rect(x, X, Y, W2, roofH, roof);
  rect(x, X, Y, W2, 2, lighten(roof, 0.2));
  rect(x, X, Y, 2, roofH, lighten(roof, 0.1));
  rect(x, X + W2 - 2, Y, 2, roofH, darken(roof, 0.2));
  // felt texture, laid in strips
  for (let yy = Y + 3; yy < Y + roofH - 1; yy += 4) { x.globalAlpha = 0.25; rect(x, X + 2, yy, W2 - 4, 1, darken(roof, 0.3)); x.globalAlpha = 1; }
  // roof furniture: plant, vents, a tank, a skylight
  const units = Math.max(1, Math.floor(W2 / 26));
  for (let i = 0; i < units; i++) {
    const ux = X + 5 + i * Math.floor((W2 - 10) / units), uy = Y + 4;
    if (roofH < 12) break;
    const kind = rng.int(0, 3);
    if (kind === 0) { rect(x, ux, uy, 13, 8, '#b9bec6'); rect(x, ux, uy, 13, 2, '#d6dae0'); for (let j = 0; j < 4; j++) rect(x, ux + 2 + j * 3, uy + 3, 1, 4, '#7d838c'); }
    else if (kind === 1) { rect(x, ux + 1, uy + 1, 9, 7, '#8f959d'); rect(x, ux + 1, uy, 9, 2, '#b9bec6'); rect(x, ux + 3, uy + 8, 5, 2, '#6a7079'); }
    else if (kind === 2) { rect(x, ux, uy, 12, 8, '#3f6f9e'); rect(x, ux + 1, uy + 1, 10, 6, '#6fa8e8'); rect(x, ux + 1, uy + 1, 10, 2, '#a8d0f8'); }
    else { rect(x, ux, uy + 1, 10, 7, darken(roof, 0.28)); rect(x, ux, uy + 1, 10, 1, lighten(roof, 0.1)); }
  }
  if (roofH > 16 && rng.chance(0.4)) { rect(x, X + W2 - 9, Y + roofH - 9, 6, 6, '#b9bec6'); rect(x, X + W2 - 9, Y + roofH - 9, 6, 1, '#d6dae0'); }
  // ---- the parapet, then the front wall
  rect(x, X, Y + roofH - 2, W2, 2, lighten(roof, 0.28));
  rect(x, X, Y + roofH, W2, faceH, wall);
  rect(x, X, Y + roofH, W2, 2, lighten(wall, 0.18));
  rect(x, X, Y + roofH + faceH - 2, W2, 2, darken(wall, 0.3));
  rect(x, X, Y + roofH, 1, faceH, lighten(wall, 0.12));
  rect(x, X + W2 - 1, Y + roofH, 1, faceH, darken(wall, 0.22));
  // ---- windows, in floors
  const floors = Math.max(1, Math.floor((faceH - 8) / 11));
  const cols = Math.max(1, Math.floor((W2 - 8) / 12));
  const winW = 8, winH = 7;
  const padX = Math.floor((W2 - cols * 12) / 2) + 2;
  for (let f = 0; f < floors; f++) {
    const wy = Y + roofH + 5 + f * 11;
    if (wy + winH > Y + roofH + faceH - 5) break;
    for (let cc = 0; cc < cols; cc++) {
      const wx = X + padX + cc * 12;
      const lit = rng.chance(0.25);
      rect(x, wx - 1, wy - 1, winW + 2, winH + 2, darken(wall, 0.35));
      rect(x, wx, wy, winW, winH, lit ? '#ffe9a8' : '#4a86f7');
      rect(x, wx, wy, winW, 2, lit ? '#fff6d8' : '#8fc0ff');
      rect(x, wx, wy + winH - 1, winW, 1, lit ? '#d8b860' : '#2a5fc0');
    }
    // the string course between floors
    if (f < floors - 1) { x.globalAlpha = 0.35; rect(x, X + 1, wy + winH + 2, W2 - 2, 1, darken(wall, 0.25)); x.globalAlpha = 1; }
  }
  // ---- the door, with an awning over it and a sign beside it
  const dw = 12, dx = X + Math.floor(W2 / 2) - dw / 2, dy = Y + roofH + faceH - 11;
  rect(x, dx - 1, dy - 1, dw + 2, 12, darken(wall, 0.4));
  rect(x, dx, dy, dw, 11, '#3a4a58');
  rect(x, dx + 1, dy + 1, dw - 2, 8, '#6fa8c8');
  rect(x, dx + dw / 2 - 1, dy + 1, 2, 9, darken(wall, 0.4));
  rect(x, dx - 3, dy - 4, dw + 6, 4, awn);
  rect(x, dx - 3, dy - 4, dw + 6, 1, lighten(awn, 0.3));
  for (let i = 0; i < 4; i++) rect(x, dx - 2 + i * 4, dy - 4, 1, 4, lighten(awn, 0.2));
  if (W2 > 44 && rng.chance(0.75)) {
    const sw = Math.min(26, Math.floor(W2 / 3)), sx2 = X + 4, sy2 = Y + roofH + faceH - 13;
    rect(x, sx2, sy2, sw, 10, '#1b2230'); rect(x, sx2, sy2, sw, 1, '#3f4a5c');
    for (let i = 0; i < 3; i++) rect(x, sx2 + 3 + i * Math.floor((sw - 6) / 3), sy2 + 3, Math.floor((sw - 6) / 3) - 2, 4, rng.pick(['#f2c94c', '#4a86f7', '#e8503a', '#6be585']));
  }
  // a hard edge all round, so it sits on the ground instead of floating
  frame(x, X, Y, W2, H2, 'rgba(10,26,20,0.35)');
}
// the same tree in April, which is the only thing this city agrees on
function sakuraTreeCanvas(v) {
  return cached('sakuratree|' + v, () => {
    const R = 12, S = R * 2 + 6;
    const P = new Pix(S, S);
    const sh = P.mask(); P.mEllipse(sh, R + 4, R + 5, R - 1, R - 2); P.fill(sh, '#1a6b4e', { shade: false });
    const m = P.mask();
    P.mEllipse(m, R + 1, R + 1, R - 1, R - 1);
    P.mEllipse(m, R - 4, R - 3, R - 5, R - 5); P.mEllipse(m, R + 6, R + 4, R - 6, R - 6);
    P.fill(m, '#ef9fbe', { outline: '#8a4560' });
    P.paint(m, (x, y) => ((x * 5 + y * 3 + v) % 7 === 0) ? '#ffc6dd' : ((x * 3 + y * 7) % 11 === 0) ? '#d9829f' : null);
    P.paint(m, (x, y) => (x < R - 2 && y < R - 2 && (x + y) % 3 !== 0) ? '#ffd8e8' : null);
    return P.toCanvas();
  });
}
// a tree seen from above: a dark trunk, a canopy in three greens, a shadow
function mapTreeCanvas(v) {
  return cached('maptree|' + v, () => {
    const R = 13, S = R * 2 + 6;
    const P = new Pix(S, S), rng = makeRng(400 + v * 37);
    const sh = P.mask(); P.mEllipse(sh, R + 4, R + 5, R - 1, R - 2); P.fill(sh, '#1a6b4e', { shade: false });
    const m = P.mask();
    P.mEllipse(m, R + 1, R + 1, R - 1, R - 1);
    P.mEllipse(m, R - 4, R - 3, R - 5, R - 5); P.mEllipse(m, R + 6, R + 4, R - 6, R - 6);
    P.fill(m, '#2f8f4a', { outline: '#14432a' });
    P.paint(m, (x, y) => ((x * 5 + y * 3) % 7 === 0) ? '#43a85c' : ((x * 3 + y * 7) % 11 === 0) ? '#226b38' : null);
    P.paint(m, (x, y) => (x < R - 2 && y < R - 2 && (x + y) % 3 !== 0) ? '#54bd6c' : null);
    P.paint(m, (x, y) => (x > R + 4 && y > R + 4 && (x + y) % 4 === 0) ? '#1d5c31' : null);
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
  const R = makeRng(20260917);
  // Squares with roads on all eight sides are not roads, they are car parks:
  // rasterising every travel edge left whole districts as one sheet of tarmac.
  // Those get paved as plazas, which breaks the sheet back into streets.
  const draw = new Uint8Array(GW * GH);
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const i = ty * GW + tx; let k = TM.kind[i];
    if (isRoad(k)) {
      let ring = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) if (isRoad(kindAt(tx + dx, ty + dy))) ring++;
      if (ring === 8) k = T_PLAZA;
    }
    draw[i] = k;
  }
  const dAt = (tx, ty) => (tx < 0 || ty < 0 || tx >= GW || ty >= GH) ? T_LAND : draw[ty * GW + tx];
  // ---- 1. the ground everything stands on
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const i = ty * GW + tx, k = draw[i], v = TM.variant[i];
    let mask = 0;
    if (k === T_SHORE) {
      if (kindAt(tx, ty - 1) !== T_WATER && kindAt(tx, ty - 1) !== T_SHORE) mask |= 1;
      if (kindAt(tx + 1, ty) !== T_WATER && kindAt(tx + 1, ty) !== T_SHORE) mask |= 2;
      if (kindAt(tx, ty + 1) !== T_WATER && kindAt(tx, ty + 1) !== T_SHORE) mask |= 4;
      if (kindAt(tx - 1, ty) !== T_WATER && kindAt(tx - 1, ty) !== T_SHORE) mask |= 8;
    }
    x.drawImage(cityTile(k, v, mask), tx * TILE, ty * TILE);
  }
  // ---- 2. the streets: pavement, kerb, asphalt, paint
  const HALF = { [T_ROAD]: 7, [T_BIGROAD]: 8 };
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const k = dAt(tx, ty); if (!isRoad(k)) continue;
    const bx = tx * TILE, by = ty * TILE, hw = HALF[k], c2 = TILE / 2;
    const n = isRoad(dAt(tx, ty - 1)), e = isRoad(dAt(tx + 1, ty)), so = isRoad(dAt(tx, ty + 1)), we = isRoad(dAt(tx - 1, ty));
    // the pavement runs under the whole square, so corners are always paved
    rect(x, bx, by, TILE, TILE, MAP_C.ground);
    for (let py = 0; py < TILE; py += 4) rect(x, bx, by + py, TILE, 1, MAP_C.groundLo);
    for (let px2 = 6; px2 < TILE; px2 += 8) rect(x, bx + px2, by, 1, TILE, MAP_C.groundHi);
    // the carriageway, one arm at a time
    const arm = (ax, ay, aw, ah) => { rect(x, bx + ax, by + ay, aw, ah, k === T_BIGROAD ? MAP_C.roadBig : MAP_C.road); };
    if (n) arm(c2 - hw, 0, hw * 2, c2 + hw); else arm(c2 - hw, c2 - hw, hw * 2, hw * 2);
    if (so) arm(c2 - hw, c2 - hw, hw * 2, TILE - c2 + hw);
    if (we) arm(0, c2 - hw, c2 + hw, hw * 2);
    if (e) arm(c2 - hw, c2 - hw, TILE - c2 + hw, hw * 2);
    // kerbs: a light lip on the pavement and a dark line on the tarmac
    if (n || so) {
      const top = n ? 0 : c2 - hw, bot = so ? TILE : c2 + hw;
      rect(x, bx + c2 - hw - 1, by + top, 1, bot - top, MAP_C.groundHi);
      rect(x, bx + c2 + hw, by + top, 1, bot - top, MAP_C.groundHi);
    }
    if (we || e) {
      const lef = we ? 0 : c2 - hw, rig = e ? TILE : c2 + hw;
      rect(x, bx + lef, by + c2 - hw - 1, rig - lef, 1, MAP_C.groundHi);
      rect(x, bx + lef, by + c2 + hw, rig - lef, 1, MAP_C.groundHi);
    }
    // tarmac is patchy and the wheel tracks are polished lighter
    for (let i = 0; i < 26; i++) { const px3 = bx + R.int(c2 - hw, c2 + hw - 1), py3 = by + R.int(0, TILE - 1); if (R.chance(0.5)) rect(x, px3, py3, 1, 1, 'rgba(255,255,255,0.05)'); else rect(x, px3, py3, 1, 1, 'rgba(0,0,0,0.12)'); }
    const straightV = n && so && !e && !we, straightH = we && e && !n && !so;
    const line = k === T_BIGROAD ? MAP_C.roadLineBig : MAP_C.roadLine;
    if (straightV) {
      for (let yy = 2; yy < TILE; yy += 8) rect(x, bx + c2 - 1, by + yy, 2, 5, line);
      x.globalAlpha = 0.07; rect(x, bx + c2 - hw + 2, by, 3, TILE, '#fff'); rect(x, bx + c2 + hw - 5, by, 3, TILE, '#fff'); x.globalAlpha = 1;
    }
    if (straightH) {
      for (let xx = 2; xx < TILE; xx += 8) rect(x, bx + xx, by + c2 - 1, 5, 2, line);
      x.globalAlpha = 0.07; rect(x, bx, by + c2 - hw + 2, TILE, 3, '#fff'); rect(x, bx, by + c2 + hw - 5, TILE, 3, '#fff'); x.globalAlpha = 1;
    }
    // zebra crossings on the approaches to a junction
    const arms = (n ? 1 : 0) + (e ? 1 : 0) + (so ? 1 : 0) + (we ? 1 : 0);
    if (arms >= 3 && (k === T_BIGROAD || R.chance(0.35))) {
      for (let i = -hw + 1; i < hw - 1; i += 3) {
        if (n) rect(x, bx + c2 + i, by + 1, 2, 5, '#e8ecef');
        if (so) rect(x, bx + c2 + i, by + TILE - 6, 2, 5, '#e8ecef');
        if (we) rect(x, bx + 1, by + c2 + i, 5, 2, '#e8ecef');
        if (e) rect(x, bx + TILE - 6, by + c2 + i, 5, 2, '#e8ecef');
      }
    }
  }
  // ---- 3. the blocks. Building squares are merged into real buildings, so a
  // block is a row of shops and offices rather than a grid of identical stamps.
  {
    const used = new Uint8Array(GW * GH);
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      const i = ty * GW + tx;
      if (draw[i] !== T_BLDG || used[i]) continue;
      let bw = 1;
      while (bw < 3 && tx + bw < GW && draw[i + bw] === T_BLDG && !used[i + bw] && R.chance(0.7)) bw++;
      let bh = 1;
      outer: while (bh < 3 && ty + bh < GH) {
        for (let kx = 0; kx < bw; kx++) { const j = (ty + bh) * GW + tx + kx; if (draw[j] !== T_BLDG || used[j]) break outer; }
        if (!R.chance(0.55)) break;
        bh++;
      }
      for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) used[(ty + yy) * GW + tx + xx] = 1;
      drawMapBuilding(x, tx * TILE, ty * TILE, bw * TILE, bh * TILE, R);
    }
  }
  // ---- 4. street furniture and planting, on the pavement and the grass
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const k = dAt(tx, ty), bx = tx * TILE, by = ty * TILE;
    if (isRoad(k)) {
      const n = isRoad(dAt(tx, ty - 1)), e = isRoad(dAt(tx + 1, ty)), so = isRoad(dAt(tx, ty + 1)), we = isRoad(dAt(tx - 1, ty));
      const straightV = n && so && !e && !we, straightH = we && e && !n && !so;
      const post = (px3, py3) => {
        // a lamp post from above: the pole, the arm and the pool of light
        x.globalAlpha = 0.12; ellipsePx(x, px3, py3 + 1, 9, 9, '#ffe9a8'); x.globalAlpha = 1;
        rect(x, px3 - 1, py3 - 1, 3, 3, '#2f3742'); rect(x, px3 - 1, py3 - 1, 3, 1, '#59626e');
        rect(x, px3 + 2, py3, 4, 1, '#2f3742');
      };
      if (straightV && ty % 3 === 0) { post(bx + 2, by + 12); post(bx + TILE - 3, by + 12); }
      if (straightH && tx % 3 === 0) { post(bx + 12, by + 2); post(bx + 12, by + TILE - 3); }
      if (straightV && ty % 7 === 3) { rect(x, bx + 1, by + 6, 4, 9, '#6a5a44'); rect(x, bx + 1, by + 6, 4, 1, '#8a7a5e'); rect(x, bx + 1, by + 10, 4, 1, '#4a3f30'); }
      if (straightH && tx % 7 === 5) { rect(x, bx + 6, by + TILE - 5, 9, 4, '#6a5a44'); rect(x, bx + 6, by + TILE - 5, 9, 1, '#8a7a5e'); }
      if ((straightV || straightH) && R.chance(0.08)) { rect(x, bx + 2, by + 2, 4, 5, '#3f4a56'); rect(x, bx + 2, by + 2, 4, 1, '#6f7a86'); }
    } else if (k === T_LAND || k === T_PARK) {
      if (R.chance(k === T_PARK ? 0.5 : 0.22)) {
        const t2 = mapTreeCanvas(R.int(0, 5));
        x.drawImage(t2, bx + R.int(-2, TILE - t2.width + 2), by + R.int(-2, TILE - t2.height + 2));
      }
      if (k === T_LAND && R.chance(0.1)) { const fx2 = bx + R.int(4, 16), fy2 = by + R.int(4, 16); for (let i = 0; i < 7; i++) rect(x, fx2 + (i * 3) % 9, fy2 + (i * 5) % 7, 2, 2, R.pick(['#e8506a', '#f2cf4a', '#e07ab0', '#ffffff'])); }
    } else if (k === T_PLAZA) {
      // a paved square is not one grey sheet: it is parking bays, planted
      // islands, benches and the odd delivery van
      const roll = R();
      if (roll < 0.26) {
        rect(x, bx, by, TILE, TILE, '#3a4150');
        for (let i = 0; i < 3; i++) rect(x, bx + 2 + i * 8, by + 3, 1, 18, '#cfd6de');
        rect(x, bx + 2, by + 3, 20, 1, '#cfd6de');
        if (R.chance(0.45)) { const cc = ['#e8e4dc', '#2f4a68', '#c8402c', '#e8c040'][R.int(0, 3)]; rect(x, bx + 3, by + 6, 6, 12, darken(cc, 0.4)); rect(x, bx + 3, by + 5, 6, 12, cc); rect(x, bx + 4, by + 8, 4, 5, '#8fc0e4'); }
      } else if (roll < 0.46) {
        rect(x, bx + 2, by + 2, TILE - 4, TILE - 4, MAP_C.land);
        rect(x, bx + 2, by + 2, TILE - 4, 1, MAP_C.landHi);
        const t2 = mapTreeCanvas(R.int(0, 5)); x.drawImage(t2, bx - 1, by - 1);
      } else if (roll < 0.56) {
        rect(x, bx + 5, by + 8, 14, 6, '#6a5a44'); rect(x, bx + 5, by + 8, 14, 1, '#8a7a5e'); rect(x, bx + 5, by + 12, 14, 1, '#4a3f30');
        rect(x, bx + 17, by + 3, 4, 5, '#3f4a56');
      } else if (roll < 0.62) {
        for (let i = 0; i < 4; i++) { rect(x, bx + 4 + (i % 2) * 10, by + 4 + ((i / 2) | 0) * 10, 8, 8, '#8a8f98'); rect(x, bx + 5 + (i % 2) * 10, by + 5 + ((i / 2) | 0) * 10, 6, 6, MAP_C.land); }
      }
    }
  }
  // ---- the outskirts. Everything outside the districts was bare ground,
  // which read as nothing at all, so the quiet blocks get low houses with
  // gardens and a car on the drive, drawn the same way the city is.
  {
    const rr = makeRng(5150);
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      if (draw[ty * GW + tx] !== T_LAND) continue;
      const bx = tx * TILE, by = ty * TILE, roll = rr();
      if (roll < 0.36) {
        drawMapBuilding(x, bx + rr.int(0, 3), by + rr.int(1, 4), TILE - rr.int(2, 6), TILE - rr.int(3, 7), rr);
      } else if (roll < 0.44) {
        // a car on the drive, for colour and for scale
        const cc = ['#e8e4dc', '#2f4a68', '#c8402c', '#e8c040', '#3f8f6a', '#8a4fd0'][rr.int(0, 5)];
        rect(x, bx + 7, by + 9, 11, 7, darken(cc, 0.4)); rect(x, bx + 7, by + 9, 11, 6, cc);
        rect(x, bx + 10, by + 10, 5, 4, '#8fc0e4'); rect(x, bx + 8, by + 8, 9, 1, lighten(cc, 0.3));
      }
    }
  }
  // ---- landmarks that are bigger than one tile
  // these were drawn against the old sketch size, so they scale with it
  const LS = MAP_SCALE / 1.5;
  x.strokeStyle = '#c8432a'; x.lineWidth = 9 * LS; x.beginPath(); x.moveTo(225 * LS, 132 * LS); x.lineTo(90 * LS, 30 * LS); x.stroke();
  x.strokeStyle = '#9aa0b0'; x.lineWidth = 8 * LS; x.beginPath(); x.moveTo(1342 * LS, 705 * LS); x.lineTo(1500 * LS, 645 * LS); x.stroke();
  circle(x, 1350 * LS, 195 * LS, 24 * LS, '#d8d2c0'); circle(x, 1350 * LS, 195 * LS, 20 * LS, MAP_C.bldg); x.fillStyle = '#b8b2a0'; x.fillRect(1338 * LS, 186 * LS, 24 * LS, 12 * LS);
  // ---- the stadium, which is a beetle
  {
    const dome = NODES.find(n => n.id === 'dome');
    if (dome) drawBeetleStadium(x, dome.x, dome.y + 30);
  }
  // ---- labels last, so they sit on top of the tiles
  x.save();
  for (const st of STREETS) {
    const i = Math.floor(st.pts.length / 2) - 1, a = st.pts[Math.max(0, i)], b = st.pts[Math.min(st.pts.length - 1, i + 1)];
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    x.save(); x.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); x.rotate(Math.abs(ang) > Math.PI / 2 ? ang + Math.PI : ang);
    x.globalAlpha = 0.5; drawText(x, st.name, 0, -1, '#ffffff', { align: 'center', font: 'small' });
    x.globalAlpha = 0.85; drawText(x, st.name, 0, -2, MAP_C.ink, { align: 'center', font: 'small' });
    x.globalAlpha = 1; x.restore();
  }
  x.restore();
  // district names, painted on the ground with a light behind them so they
  // read over grass, tarmac and roof alike
  for (const d of DISTRICTS) {
    const nm = d.name.split('').join(' ');
    x.globalAlpha = 0.45; drawText(x, nm, d.x, d.y + 1, '#ffffff', { align: 'center' });
    x.globalAlpha = 0.8; drawText(x, nm, d.x, d.y, '#26301f', { align: 'center' });
    x.globalAlpha = 1;
  }
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
      const t2 = sakuraTreeCanvas(Math.abs(Math.round(d.x * 7 + d.y)) % 6);
      x.drawImage(t2, Math.round(d.x - t2.width / 2), Math.round(d.y - t2.height / 2));
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
  // ---- the finish. One pass over the whole sheet so it reads as one picture
  // taken at one time of day, instead of a few thousand tiles laid next to
  // each other: a grain that ties the palettes together, a warm-to-cool tilt
  // across the city, and the edges of the world falling away into haze.
  {
    const nz = makeCanvas(64, 64), ng = nz.getContext('2d'), nr = makeRng(4242);
    for (let i = 0; i < 64 * 64; i++) {
      const gx = i % 64, gy = (i / 64) | 0;
      if (!nr.chance(0.5)) continue;
      ng.fillStyle = nr.chance(0.5) ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
      ng.fillRect(gx, gy, 1, 1);
    }
    x.save();
    x.globalAlpha = 0.07; x.fillStyle = x.createPattern(nz, 'repeat'); x.fillRect(0, 0, MAPW, MAPH);
    x.globalAlpha = 1;
    // the light across the city: warm in the south-west, cool in the north-east
    const g2 = x.createLinearGradient(0, MAPH, MAPW, 0);
    g2.addColorStop(0, 'rgba(255,196,120,0.13)');
    g2.addColorStop(0.5, 'rgba(255,240,210,0.03)');
    g2.addColorStop(1, 'rgba(90,120,190,0.14)');
    x.fillStyle = g2; x.fillRect(0, 0, MAPW, MAPH);
    // and the haze at the edge of the map
    const band = 150;
    for (const [gx0, gy0, gx1, gy1, gw, gh] of [[0, 0, band, 0, band, MAPH], [MAPW, 0, MAPW - band, 0, band, MAPH]]) {
      const g3 = x.createLinearGradient(gx0, 0, gx1, 0);
      g3.addColorStop(0, 'rgba(214,224,236,0.5)'); g3.addColorStop(1, 'rgba(214,224,236,0)');
      x.fillStyle = g3; x.fillRect(Math.min(gx0, gx1), 0, gw, gh);
    }
    for (const [gy0, gy1] of [[0, band], [MAPH, MAPH - band]]) {
      const g3 = x.createLinearGradient(0, gy0, 0, gy1);
      g3.addColorStop(0, 'rgba(214,224,236,0.5)'); g3.addColorStop(1, 'rgba(214,224,236,0)');
      x.fillStyle = g3; x.fillRect(0, Math.min(gy0, gy1), MAPW, band);
    }
    x.restore();
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
const PIN_COLOR = { home: '#d8b83c', place: '#2f9a8a', venue: '#e0523c', shop: '#3f7fd0', food: '#e09030', recruit: '#9b59d0', event: '#2fa36b', rest: '#3fa8b8', pickup: '#d9a520', mystery: '#8a4fd0', inside: '#2f7a86', home: '#666' };
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
    this.cars = []; const rr = makeRng(9);
    for (let i = 0; i < 34; i++) { const e = rr.pick(EDGES); this.cars.push({ a: e[0], b: e[1], k: rr.range(0, 1), sp: rr.range(0.05, 0.12), seed: rr.int(1, 9999), dir: rr.sign() }); }
    // the pavements: office workers, school kids, somebody in a mascot suit,
    // a dog on a lead, a courier going too fast. Every one of them bobs.
    // Everybody out here is going somewhere in particular. A commuter walks
    // between a station and an office; a shopper does the shops; a tourist
    // works through the landmarks; a courier never stops. When they arrive
    // they stand about for a bit and then pick the next place.
    this.people = [];
    const byType = (t) => NODES.filter(n => n.type === t).map(n => n.id).filter(id => this.G[id]);
    const PURPOSE = {
      commuter: { pool: byType('inside').concat(byType('venue')), wait: [2, 6], sp: 0.026, carry: 0.5 },
      shopper:  { pool: byType('shop').concat(byType('place'), byType('food')), wait: [4, 10], sp: 0.018, carry: 0.8 },
      tourist:  { pool: byType('event').concat(byType('rest'), byType('venue')), wait: [5, 12], sp: 0.014, carry: 0.3 },
      diner:    { pool: byType('food').concat(byType('home')), wait: [6, 14], sp: 0.02, carry: 0.2 },
      courier:  { pool: Object.keys(this.G), wait: [0.2, 1], sp: 0.05, carry: 1 },
    };
    this.purposes = PURPOSE;
    const kinds = ['commuter', 'commuter', 'shopper', 'tourist', 'diner', 'courier'];
    for (let i = 0; i < 110; i++) {
      const e = rr.pick(EDGES);
      const roll = rr();
      const kind = roll < 0.05 ? 'mascot' : roll < 0.11 ? 'dog' : roll < 0.2 ? 'kid' : 'walker';
      const purpose = kind === 'walker' || kind === 'kid' ? rr.pick(kinds) : 'courier';
      const P = PURPOSE[purpose];
      this.people.push({ a: e[0], b: e[1], k: rr.range(0, 1), sp: P.sp * rr.range(0.8, 1.25) * (kind === 'dog' ? 1.4 : 1),
        col: rr.pick(NPC_PALETTES), hair: rr.pick(['#3a3040', '#241a2e', '#6a4a30', '#8a2a4a', '#c8a03a']),
        kind, purpose, mc: rr.int(0, 5), ph: rr.range(0, 6.3), bag: rr.chance(P.carry), side: rr.sign(), lane: rr.int(0, 1),
        goal: P.pool.length ? rr.pick(P.pool) : null, wait: 0 });
    }
    // blossom on the wind, right across the viewport
    this.petals = [];
    for (let i = 0; i < 70; i++) this.petals.push({ x: rr.range(0, W), y: rr.range(26, H), sp: rr.range(14, 34), sw: rr.range(0.6, 1.6), ph: rr.range(0, 6.3), s: rr.int(2, 3) });
    this.fx = new Particles(); this.sel = 0;
    this.you = (Game.run.members && Game.run.members[0]) || null;
    this.grid = tileGrid();
    for (const n of NODES) { const g = this.G[n.id]; if (g) { g.tx = n.tx; g.ty = n.ty; } }
    const r0 = Game.run;
    if (!r0.tile || !tileWalkable(this.grid, r0.tile.tx, r0.tile.ty)) { const h = NODES.find(n => n.id === r0.pos) || NODES[0]; r0.tile = { tx: h.tx, ty: h.ty }; }
    this.tile = { tx: r0.tile.tx, ty: r0.tile.ty };
    this.pos = { x: (this.tile.tx + 0.5) * TILE, y: (this.tile.ty + 0.5) * TILE };
    // ---- You walk the city yourself now. Eight directions, acceleration, a
    // slide along walls, and a camera that runs a little ahead of you.
    this.cam = new WorldCam({ z: MAP_Z, view: { x: 0, y: 26, w: W, h: H - 60 }, bounds: { w: MAPW, h: MAPH } });
    this.body = new Walker(this.pos.x, this.pos.y, { r: 8, speed: 104, accel: 900, friction: 1000, spec: this.you ? this.you.spec : null, scale: 1.45 });
    this.input = new WorldInput();
    this.cam.snapTo(this.body.x, this.body.y);
    this.walkDist = 0; this.tileDist = 0;
    this.solid = (x, y) => !tileWalkable(this.grid, Math.floor(x / TILE), Math.floor(y / TILE));
    this.facing = 1;
    this.refresh();
    this.buttons = [];
  }
  centerOn(p, snap) { if (!this.cam) return; if (snap) this.cam.snapTo(p.x, p.y); }
  get here() { return this.G[Game.run.pos]; }
  refresh() { this.reach = NODES.filter(n => this.canEnter(n)); this.sel = 0; this.centerOn(this.pos); }
  nodeAtTile(tx, ty) { return NODES.find(n => n.tx === tx && n.ty === ty && this.canEnter(n)); }
  staminaFor(tiles) { let c = 0; for (const t of tiles) c += tileCost(this.grid, t.tx, t.ty); return c; }
  hopCost(n) { const d = Math.hypot(n.x - this.here.x, n.y - this.here.y); let c = d > 165 ? 2 : 1; if (collectMods(Game.run).cheapTravel) c = Math.max(1, c - 1); return c; }
  canEnter(n) { if (n.id === 'ggb' && Game.run.day < 4) return false; return true; }
  update(dt) {
    const r = Game.run; this.t += dt; this.msgT = Math.max(0, this.msgT - dt); this.arriveT = Math.max(0, this.arriveT - dt); this.goalPop = Math.max(0, (this.goalPop || 0) - dt);
    this.walkStep(dt);
    for (const c of this.cars) { c.k += c.sp * dt; if (c.k > 1) { c.k = 0; const e = EDGES[Math.floor(Math.random() * EDGES.length)]; c.a = e[0]; c.b = e[1]; } }
    for (const p of this.people) {
      if (p.wait > 0) { p.wait -= dt; continue; }
      p.k += p.sp * dt;
      if (p.k <= 1) continue;
      // arrived at the end of this street: turn toward wherever they are going
      p.k = 0; p.a = p.b;
      const here = this.G[p.a];
      if (!here) { const e = EDGES[Math.floor(Math.random() * EDGES.length)]; p.a = e[0]; p.b = e[1]; continue; }
      if (p.goal === p.a) {
        // they are there. Stand about, then pick somewhere else to be.
        const P = this.purposes[p.purpose] || this.purposes.courier;
        p.wait = P.wait[0] + Math.random() * (P.wait[1] - P.wait[0]);
        p.goal = P.pool.length ? P.pool[Math.floor(Math.random() * P.pool.length)] : null;
      }
      const g = p.goal && this.G[p.goal];
      const links = here.links || [];
      if (!links.length) { const e = EDGES[Math.floor(Math.random() * EDGES.length)]; p.a = e[0]; p.b = e[1]; continue; }
      if (!g) { p.b = links[Math.floor(Math.random() * links.length)]; continue; }
      // greedy, which is how most people navigate a city anyway
      let best = links[0], bd = 1e9;
      for (const l of links) { const n2 = this.G[l]; if (!n2) continue; const d = Math.hypot(n2.x - g.x, n2.y - g.y) + Math.random() * 40; if (d < bd) { bd = d; best = l; } }
      p.b = best;
    }
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
  }
  // ---- Walking.
  // Not a route you draw and then watch: you hold a direction and you go.
  // Stamina is spent by the metre rather than by the square, so crossing a
  // wide street costs what it looks like it should.
  walkStep(dt) {
    const r = Game.run;
    if (this.arriveT > 1.4) { this.cam.follow(dt, this.body.x, this.body.y, 0, 0); return; }
    const v = this.input.vector({ x: this.body.x, y: this.body.y });
    const tired = r.stamina <= 0;
    if (tired) { this.body.speed = 58; } else this.body.speed = 104;
    const moved = this.body.step(dt, v.x, v.y, this.solid);
    if (moved > 0) {
      this.walkDist += moved; this.tileDist += moved;
      // a block of walking is a block on the step counter
      while (this.tileDist >= TILE) { this.tileDist -= TILE; r.today.tiles = (r.today.tiles || 0) + 1; const gh = checkGoals(r); if (gh) this.goalDone(gh); }
      // and a stamina point every couple of blocks
      while (this.walkDist >= TILE * 2.4) {
        this.walkDist -= TILE * 2.4;
        if (r.stamina > 0) { r.stamina = Math.max(0, r.stamina - 1); if (r.stamina === 0) this.flash('YOU ARE WALKING ON EMPTY'); }
      }
      // dust under the feet, in step
      if (Math.floor(this.body.walkT * 7) !== this._lastStep) {
        this._lastStep = Math.floor(this.body.walkT * 7);
        if (this._lastStep % 2 === 0) drawDust(this.fx, this.cam.sx(this.body.x), this.cam.sy(this.body.y) + 6, 2, '#cfc6ae');
      }
    }
    this.facing = this.body.flip ? -1 : 1;
    this.pos.x = this.body.x; this.pos.y = this.body.y;
    const tx = Math.floor(this.body.x / TILE), ty = Math.floor(this.body.y / TILE);
    if (tx !== this.tile.tx || ty !== this.tile.ty) { this.tile = { tx, ty }; r.tile = { tx, ty }; }
    this.cam.follow(dt, this.body.x, this.body.y, this.body.vx, this.body.vy);
    // what you are standing in front of
    this.atNode = null;
    let bd = 34;
    for (const n of this.reach) {
      const d = Math.hypot(n.x - this.body.x, n.y - this.body.y);
      if (d < bd) { bd = d; this.atNode = n; }
    }
    if (this.atNode !== this._lastAt) { this._lastAt = this.atNode; if (this.atNode) Audio.ui('move'); }
  }
  enterHere() {
    const n = this.atNode; if (!n) return;
    Game.run.pos = n.id; this.arrive(n);
  }
  arrive(n) {
    const r = Game.run; r.save();
    const done = r.doneNodes || (r.doneNodes = {});
    switch (n.type) {
      case 'venue': Game.go(() => new GigScene(n), 'curtain', { label: n.name }); break;
      case 'shop': Game.go(() => new MusicShopScene(n), 'iris', { dur: 0.5 }); break;
      case 'food': Game.go(() => new RamenScene(n), 'iris', { dur: 0.5 }); break;
      case 'recruit': Game.go(() => new RecruitScene(n), 'iris'); break;
      case 'event': Game.go(() => new EventScene(n), 'iris'); break;
      case 'mystery': Game.go(() => new MysteryScene(n), 'iris'); break;
      case 'inside': Game.go(() => new InteriorScene(n), 'iris'); break;
      case 'place': Game.go(() => new PlaceScene(n), 'iris'); break;
      case 'home': Game.go(() => new CapsuleScene(n), 'iris', { dur: 0.5 }); break;
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
  // the GO button points you at the nearest door and starts you walking
  go(n) {
    if (!n) return;
    if (Math.hypot(n.x - this.body.x, n.y - this.body.y) < 34) { Game.run.pos = n.id; this.arrive(n); return; }
    this.input.tapGoal = { x: n.x, y: n.y }; Audio.ui('select');
  }
  // ---- Somewhere to play.
  // Anywhere you can stand that is not a carriageway and is not somebody
  // else's doorway. The city is full of corners; that is the whole point.
  busk() {
    const tx = Math.floor(this.body.x / TILE), ty = Math.floor(this.body.y / TILE);
    const k = this.sf.tiles.kind[ty * GW + tx];
    if (k === T_ROAD || k === T_BIGROAD) { this.flash('NOT IN THE ROAD.'); Audio.ui('error'); return; }
    if (!tileWalkable(this.grid, tx, ty)) { this.flash('YOU CANNOT SET UP THERE.'); Audio.ui('error'); return; }
    if (this.atNode) { this.flash('TOO CLOSE TO ' + this.atNode.name + '. WALK ON A BIT.'); Audio.ui('error'); return; }
    if (Game.run.stamina < 10) { this.flash('TOO TIRED TO CARRY IT ALL OUT.'); Audio.ui('error'); return; }
    const spot = { x: this.body.x, y: this.body.y };
    Game.run.save();
    Game.go(() => new BuskScene(spot, () => new CityScene()), 'fade', { dur: 0.5 });
  }
  endDay() { const r = Game.run; r.nightPending = true; r.save(); Game.go(() => new NightScene(), 'fade', { dur: 0.6 }); }
  key(code) {
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { if (this.atNode) this.enterHere(); return; }
    if (code === 'Tab' || code === 'KeyB') { Game.setScene(new BandScene()); return; }
    if (code === 'KeyN') { this.endDay(); return; }
    if (code === 'KeyT') { this.busk(); return; }
    if (code === 'Escape') { Game.run.save(); Game.setScene(new TitleScene()); return; }
    this.input.key(code);
  }
  keyUp(code) { this.input.keyUp(code); }
  nearestNode() { let best = null, bd = 1e9; for (const n of this.reach) { const d = Math.hypot(n.x - this.body.x, n.y - this.body.y); if (d < bd) { bd = d; best = n; } } return bd < 340 ? best : null; }
  screen(n) { return { x: this.cam.sx(n.x), y: this.cam.sy(n.y) }; }
  tileAt(sx, sy) { return { tx: Math.floor(this.cam.wx(sx) / TILE), ty: Math.floor(this.cam.wy(sy) / TILE) }; }
  tileScreen(t) { return { x: this.cam.sx((t.tx + 0.5) * TILE), y: this.cam.sy((t.ty + 0.5) * TILE) }; }
  tap(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { Audio.ui('select'); b.onTap(); return; }
    // tapping the door you are standing at goes in; anywhere else walks there
    if (this.atNode) { const s = this.screen(this.atNode); if (Math.hypot(x - s.x, y - (s.y - 12)) < 34) { this.enterHere(); return; } }
    let best = null, bd = 1e9;
    for (const n of this.reach) { const s = this.screen(n); const d = Math.hypot(x - s.x, y - (s.y - 12)); if (d < 26 && d < bd) { best = n; bd = d; } }
    const wx = this.cam.wx(x), wy = this.cam.wy(y);
    if (best) { this.sel = this.reach.indexOf(best); this.input.tapGoal = { x: best.x, y: best.y }; Audio.ui('move'); return; }
    if (y > 26 && y < H - 34) { this.input.tapGoal = { x: wx, y: wy }; Audio.ui('move'); }
  }
  pointerDown(x, y, id) {
    for (const b of this.buttons) if (b.hit(x, y)) { Audio.ui('select'); b.onTap(); return; }
    if (this.atNode) { const s = this.screen(this.atNode); if (Math.hypot(x - s.x, y - (s.y - 12)) < 34) { this.enterHere(); return; } }
    // on a phone the thumb is the stick, wherever it lands in the world view
    if (Game.touch && y > 26 && y < H - 34) { this.input.down(x, y, id); this.dragId = id; this.dragMoved = 0; this.dragAt = { x, y }; return; }
    this.tap(x, y);
  }
  pointerMove(x, y, id) {
    if (this.input.move(x, y, id)) { if (this.dragAt) this.dragMoved = Math.max(this.dragMoved, Math.hypot(x - this.dragAt.x, y - this.dragAt.y)); return; }
  }
  pointerUp(x, y, id) {
    if (this.dragId === id) { const moved = this.dragMoved; this.input.up(id); this.dragId = null; if (moved < 6) this.tap(x, y); return; }
    this.input.up(id);
  }
  hover(x, y) { this.reach.forEach((n, i) => { const s = this.screen(n); if (Math.hypot(x - s.x, y - (s.y - 12)) < 20) this.sel = i; }); }
  edgePos(a, b, k) { const na = this.G[a], nb = this.G[b]; if (!na || !nb) return { x: 0, y: 0 }; return { x: lerp(na.x, nb.x, k), y: lerp(na.y, nb.y, k) }; }
  draw(ctx) {
    const r = Game.run, cam = this.cam;
    rect(ctx, 0, 0, W, H, '#2a3340');
    ctx.save(); ctx.beginPath(); ctx.rect(0, 26, W, H - 60); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.sf.canvas, -Math.round(cam.x), -Math.round(cam.y) + cam.view.y, Math.round(MAPW * cam.z), Math.round(MAPH * cam.z));
    // water shimmer
    for (let i = 0; i < 60; i++) { const wx = 1245 + (i * 53) % 240, wy = (i * 79 + Math.floor(this.t * 8)) % MAPH; const s = { x: cam.sx(wx), y: cam.sy(wy) }; if (s.x > -10 && s.x < W && s.y > 26 && s.y < H) rect(ctx, s.x, s.y, 13, 3, MAP_C.waterDk); }
    // cars + people on roads
    for (const c of this.cars) {
      const p = this.edgePos(c.a, c.b, c.k), na = this.G[c.a], nb = this.G[c.b];
      const len = Math.hypot(nb.x - na.x, nb.y - na.y) || 1;
      const nx = -(nb.y - na.y) / len, ny = (nb.x - na.x) / len;
      const s = { x: cam.sx(p.x + nx * 3.5), y: cam.sy(p.y + ny * 3.5) };
      if (s.x < -20 || s.x > W + 20 || s.y < 10 || s.y > H) continue;
      const dir = (nb.x - na.x) >= 0 ? 1 : -1;
      ctx.globalAlpha = 0.28; ellipsePx(ctx, s.x, s.y + 4, 14, 5, '#06100c'); ctx.globalAlpha = 1;
      ctx.drawImage(carCanvas(c.seed, dir), Math.round(s.x - 16), Math.round(s.y - 7), 33, 15);
    }
    for (const p2 of this.people) {
      const p = this.edgePos(p2.a, p2.b, p2.k);
      // they walk the pavement, not the middle of the road
      const na = this.G[p2.a], nb = this.G[p2.b];
      const len = Math.hypot(nb.x - na.x, nb.y - na.y) || 1;
      const nx = -(nb.y - na.y) / len, ny = (nb.x - na.x) / len;
      const off = p2.side * (10 + p2.lane * 3);
      const s = { x: cam.sx(p.x + nx * off), y: cam.sy(p.y + ny * off) };
      if (s.x < -8 || s.x > W + 8 || s.y < 20 || s.y > H) continue;
      const bob = Math.sin(this.t * 7 + p2.ph) > 0 ? 1 : 0;
      const y2 = s.y - bob;
      ellipsePx(ctx, s.x + 1, s.y + 2, 4, 2, 'rgba(6,26,18,0.3)');
      if (p2.kind === 'mascot') { drawMascotSmall(ctx, s.x, y2 + 2, ['cat', 'bird', 'bean', 'fish', 'bear'][p2.mc % 5], p2.mc, 0.55); continue; }
      if (p2.kind === 'dog') {
        rect(ctx, s.x - 3, y2 - 3, 7, 4, p2.hair); rect(ctx, s.x + 4, y2 - 4, 3, 3, p2.hair);
        rect(ctx, s.x - 3, y2 + 1, 2, 2, darken(p2.hair, 0.3)); rect(ctx, s.x + 2, y2 + 1, 2, 2, darken(p2.hair, 0.3));
        continue;
      }
      // a person from above: hair, shoulders, arms, and shoes that alternate
      const hh = p2.kind === 'kid' ? 3 : 4;
      rect(ctx, s.x - 3, y2 - 2, 7, hh + 3, p2.col);                       // body
      rect(ctx, s.x - 3, y2 - 2, 7, 1, lighten(p2.col, 0.25));
      rect(ctx, s.x - 4, y2 - 1, 1, 3, darken(p2.col, 0.2));               // arms
      rect(ctx, s.x + 4, y2 - 1, 1, 3, darken(p2.col, 0.2));
      rect(ctx, s.x - 2, y2 - 5, 5, 4, '#f0c9a0');                         // head
      rect(ctx, s.x - 2, y2 - 6, 5, 2, p2.hair);                           // hair
      rect(ctx, s.x - 2, y2 - 6, 5, 1, lighten(p2.hair, 0.22));
      rect(ctx, s.x + (bob ? -2 : 1), y2 + hh + 1, 2, 1, '#2a2434');       // the foot that is forward
      if (p2.bag) rect(ctx, s.x + 4, y2, 2, 3, '#c8402c');
      if (p2.kind === 'kid') rect(ctx, s.x - 3, y2 - 7, 7, 1, '#e8c040');
    }
    // ---- where you told yourself to go, if you tapped somewhere
    if (this.input.tapGoal) {
      const g = this.input.tapGoal, gx = cam.sx(g.x), gy = cam.sy(g.y);
      const k = (this.t * 2) % 1;
      ctx.globalAlpha = 0.6 - k * 0.5; ringPx(ctx, gx, gy, 6 + k * 14, '#8ad8ff'); ctx.globalAlpha = 1;
      rect(ctx, gx - 1, gy - 8, 2, 8, '#8ad8ff'); rect(ctx, gx - 6, gy - 12, 12, 6, '#8ad8ff');
    }
    // ---- pins. Distance now reads as walking cost, not a ticket price.
    const done = r.doneNodes || {};
    for (const n of NODES) {
      const s2 = this.screen(n); if (s2.x < -40 || s2.x > W + 40 || s2.y < 0 || s2.y > H + 40) continue;
      const near = this.atNode === n || Math.hypot(n.x - this.body.x, n.y - this.body.y) < 150;
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
    const ps = { x: cam.sx(this.body.x), y: cam.sy(this.body.y) };
    const moving = this.body.moving, phase = this.body.walkT * 7;
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
      // you do not need anybody's permission to play in the street
      new Btn(W - 452, H - 28, 128, 24, 'PLACE TOOLS', () => this.busk(), { color: '#8a4fd0', hi: '#b98ce8', lo: '#5a2f90', ol: '#33165a' }),
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
