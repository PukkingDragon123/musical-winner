// ---------- Harry Reid International, Terminal 3 ----------
// The real one, as closely as a side-scroller can hold it. T3 opened in June
// 2012: a long east-west building on a stacked roadway, departures kerb on
// Level 2, a ticketing lobby at the west end behind a giant cable-tensioned
// window wall hung with dichroic glass, terrazzo underfoot the whole way, one
// security checkpoint, and then the E gates - E1 to E12, then E14 and E15,
// because there is no E13. Runways 8L/26R and 8R/26L run east-west in front of
// it, and past them, across the desert, the Strip.
//
// It is compressed, not shrunk: the real building is the best part of a
// kilometre long. Everything that is in it is in here, in the right order.
//
// Nothing big is drawn with rectangles at runtime. The building is baked in
// 480-pixel tiles through TexBuf, pixel by pixel, the first time the camera
// comes near each one.
'use strict';

const LAS_W = 9900;
const LAS_F = 452;            // the floor line everybody stands on
const LAS_T = 480;            // tile width
const LAS_TH = 590;           // tile height: world y 0 .. 590
const LAS_ZONES = [
  { id: 'kerb', name: 'LEVEL 2 - DEPARTURES KERB', x0: 0, x1: 1150 },
  { id: 'lobby', name: 'TICKETING LOBBY', x0: 1150, x1: 3250 },
  { id: 'security', name: 'SECURITY CHECKPOINT', x0: 3250, x1: 4300 },
  { id: 'center', name: 'E GATES', x0: 4300, x1: 5650 },
  { id: 'gates', name: 'E GATES', x0: 5650, x1: LAS_W },
];
// fourteen gates, and the one that is not there
const LAS_GATES = (function () {
  const names = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E14', 'E15'];
  return names.map(function (n, i) { return { name: n, x: 5860 + i * 290 }; });
})();
const LAS_MY_GATE = 'E12';
function lasZone(x) { for (let i = 0; i < LAS_ZONES.length; i++) if (x >= LAS_ZONES[i].x0 && x < LAS_ZONES[i].x1) return LAS_ZONES[i]; return LAS_ZONES[LAS_ZONES.length - 1]; }
function lasGateX(name) { const g = LAS_GATES.find(function (q) { return q.name === name; }); return g ? g.x : 9000; }

// the palette, kept small on purpose: a pixel artist picks colours, not values
const LP = {
  ink: '#141018', steel: '#9aa3ae', steelHi: '#d5dbe2', steelLo: '#5b636e',
  white: '#eef1f5', ceil: '#dde2e9', ceilLo: '#b7bec8',
  terr: '#d8d0c1', terrLo: '#bdb4a4', brass: '#c8a454',
  glass: '#6f9fb8', glassDk: '#27435a',
  wood: '#9a6a44', woodLo: '#6e4a2e', stone: '#b9ae9c',
  navy: '#1c2a4a', red: '#c8402c', gold: '#e0b23c',
  duskA: '#140f2a', duskB: '#2a1b4a', duskC: '#4e2466', duskD: '#8a3068', duskE: '#c9505e', duskF: '#ef8456', duskG: '#ffbe6e', duskH: '#ffe2a0',
};

// ---------- the sky: a Mojave dusk ----------
function lasSkyCanvas() {
  return cached('las|sky', function () {
    const b = new TexBuf(W, H, 0, 0);
    b.ditherV(0, 0, W, 330, [LP.duskA, LP.duskB, LP.duskC, LP.duskD, LP.duskE, LP.duskF, LP.duskG, LP.duskH]);
    b.ditherV(0, 330, W, H - 330, [LP.duskH, LP.duskG]);
    // stars, only where it is dark enough for them
    for (let i = 0; i < 160; i++) {
      const x = (hash2(i, 1, 51) * W) | 0, y = (hash2(i, 2, 51) * 130) | 0;
      const s = hash2(i, 3, 51);
      b.put(x, y, s > 0.8 ? rgbOf('#ffffff') : rgbOf('#b8b0e0'));
      if (s > 0.94) { b.put(x + 1, y, rgbOf('#8a82c0')); b.put(x - 1, y, rgbOf('#8a82c0')); b.put(x, y + 1, rgbOf('#8a82c0')); b.put(x, y - 1, rgbOf('#8a82c0')); }
    }
    // long flat desert clouds, lit orange underneath by a sun already down
    for (let i = 0; i < 16; i++) {
      const cx = hash2(i, 5, 52) * W, cy = 120 + hash2(i, 6, 52) * 170, cw = 90 + hash2(i, 7, 52) * 220, ch = 5 + hash2(i, 8, 52) * 9;
      for (let y = -ch; y <= ch; y++) for (let x = -cw; x <= cw; x++) {
        const d = (x * x) / (cw * cw) + (y * y) / (ch * ch);
        if (d > 1) continue;
        const px0 = (cx + x) | 0, py0 = (cy + y) | 0;
        if (d > 0.7 && bayerAt(px0, py0) > (1 - d) * 3) continue;
        const under = y > ch * 0.2;
        b.put(px0, py0, rgbOf(under ? (cy > 220 ? '#ffb070' : '#e0785e') : (cy > 220 ? '#a8506a' : '#5a3474')));
      }
    }
    return b.toCanvas();
  });
}
// ---------- the Spring Mountains and the Strip, across the airfield ----------
const LAS_FAR_W = 2400;
function lasFarCanvas() {
  return cached('las|far', function () {
    const HH = 170, b = new TexBuf(LAS_FAR_W, HH, 0, 0);
    // two ranges, the far one bluer, both hazed toward the horizon
    for (let layer = 0; layer < 2; layer++) {
      const base = layer ? rgbOf('#5a3a6a') : rgbOf('#7a4e7a'), top = layer ? 38 : 70;
      for (let x = 0; x < LAS_FAR_W; x++) {
        const hgt = top + Math.sin(x * 0.006 + layer * 2) * 18 + Math.sin(x * 0.021 + layer) * 9 + (hash2(x >> 2, layer, 60) - 0.5) * 6;
        for (let y = hgt | 0; y < HH; y++) {
          const k = (y - hgt) / (HH - hgt);
          b.put(x, y, k > bayerAt(x, y) * 1.6 ? shadeRGB(base, 0.82) : base);
        }
      }
    }
    // the haze band where the desert meets the sky, over everything
    for (let y = HH - 26; y < HH; y++) for (let x = 0; x < LAS_FAR_W; x++) if ((y - (HH - 26)) / 26 > bayerAt(x, y)) b.mix(x, y, rgbOf('#e89a70'), 0.5);
    const tower = function (x, w, h, col, lit, seed) {
      const y0 = HH - h, C = rgbOf(col), L = rgbOf(lit);
      b.rect(x, y0, w, h, C);
      b.grain(x, y0, w, h, 0.06, seed);
      b.vline(x, y0, h, shadeRGB(C, 1.3)); b.vline(x + w - 1, y0, h, shadeRGB(C, 0.7));
      for (let y = y0 + 3; y < HH - 4; y += 3) for (let i = x + 2; i < x + w - 2; i += 2) if (hash2(i, y, seed) < 0.42) b.put(i, y, L);
    };
    // generic towers, then the ones anybody would know
    for (let i = 0; i < 40; i++) {
      const x = 60 + i * 58 + (hash2(i, 1, 61) * 30 | 0), w = 12 + (hash2(i, 2, 61) * 16 | 0), h = 30 + (hash2(i, 3, 61) * 60 | 0);
      tower(x, w, h, i % 3 ? '#2a2038' : '#342a44', i % 4 ? '#ffd88a' : '#ffe8c0', i);
    }
    // MANTIS BAY: the gold towers at the south end, nearest the runway
    const gold = function (x, h) {
      const y0 = HH - h;
      for (let wing = 0; wing < 3; wing++) {
        const wx = x + wing * 10, wh = h - wing * 12;
        b.ditherH(wx, HH - wh, 14, wh, ['#f6d27a', '#c8903a', '#8a5a24']);
        for (let y = HH - wh + 2; y < HH; y += 2) b.hline(wx, y, 14, rgbOf('#7a4e1e'), 170);
      }
      b.rect(x + 8, y0 - 6, 18, 6, rgbOf('#2a2038'));
      for (let i = 0; i < 16; i += 2) b.put(x + 10 + i, y0 - 4, rgbOf('#ffe8a0'));
    };
    gold(180, 118); gold(236, 96);
    // LARVA: black glass pyramid, a sphinx out front, and the beam
    const pyr = function (cx, h) {
      for (let y = 0; y < h; y++) {
        const half = (y / h) * h * 0.95;
        for (let x = -half; x <= half; x++) {
          const px0 = (cx + x) | 0, py0 = HH - h + y;
          const lit = x < 0 ? '#2a2640' : '#1a1628';
          b.put(px0, py0, rgbOf(lit));
          if ((py0 % 5 === 0) && hash2(px0, py0, 70) < 0.3) b.put(px0, py0, rgbOf('#6a5a8a'));
        }
      }
    };
    pyr(420, 74);
    // the beam goes up out of the canvas; it is drawn live, this is its base glow
    for (let y = 0; y < 12; y++) for (let x = -6; x <= 6; x++) if (Math.abs(x) < 6 - y * 0.4) b.mix(420 + x, HH - 74 + y, rgbOf('#fff6d0'), 0.5);
    // EXCALIBUG: a castle with coloured turrets
    const castle = function (x) {
      b.box(x, HH - 44, 50, 44, '#e6dccb', { ol: false });
      for (let i = 0; i < 4; i++) {
        const tx = x + 2 + i * 13;
        b.rect(tx, HH - 58, 8, 16, rgbOf('#e6dccb'));
        for (let k = 0; k < 6; k++) b.hline(tx + (k < 3 ? 3 - k : k - 3) * 0, HH - 64 + k, 8 - Math.abs(3 - k) * 2 + 0, rgbOf(['#c8402c', '#2f6fc0', '#e0b23c', '#2f8a4a'][i]));
      }
    };
    castle(520);
    // the Sphere, with its ladybug face, round and red in a flat skyline
    const sphere = function (cx, r) {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = (x * x + y * y) / (r * r); if (d > 1) continue;
        const px0 = cx + x, py0 = HH - r - 8 + y;
        let c = d < 0.5 ? '#ff5a4a' : '#d8382e';
        if (x > r * 0.3 && d > 0.4) c = '#a01a22';
        if ((x + r * 0.3) * (x + r * 0.3) + (y + r * 0.35) * (y + r * 0.35) < r * r * 0.05) c = '#ff9a80';
        b.put(px0, py0, rgbOf(c));
      }
      const spots = [[-0.4, -0.2], [0.35, -0.3], [-0.2, 0.35], [0.4, 0.3]];
      for (let i = 0; i < spots.length; i++) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y < 9) b.put(cx + spots[i][0] * r + x, HH - r - 8 + spots[i][1] * r + y, rgbOf('#1b0a12'));
      b.rect(cx - 3, HH - 8, 6, 8, rgbOf('#2a2038'));
    };
    sphere(900, 34);
    // STRATOSWARM: the needle, far to the north, with its pod
    b.rect(1500, HH - 150, 5, 150, rgbOf('#3a3050'));
    b.vline(1500, HH - 150, 150, rgbOf('#5a4a70'));
    b.box(1493, HH - 164, 19, 14, '#4a3e62', { ol: false });
    for (let i = 0; i < 17; i += 2) b.put(1494 + i, HH - 158, rgbOf('#ffe8a0'));
    b.vline(1502, HH - 176, 12, rgbOf('#8a82a0'));
    // a few more generic blocks in front, and the lit crowns
    for (let i = 0; i < 14; i++) tower(640 + i * 110, 22, 40 + (hash2(i, 9, 62) * 40 | 0), '#3a2a4a', '#ffc870', 90 + i);
    return b.toCanvas();
  });
}
// ---------- the airfield: desert, runway 8L/26R, taxiways, the tower ----------
const LAS_AF_W = 5400;
function lasAirfieldCanvas() {
  return cached('las|airfield', function () {
    const HH = 150, b = new TexBuf(LAS_AF_W, HH, 0, 0);
    // desert scrub, flat and pale, dithered from haze to sand
    b.ditherV(0, 0, LAS_AF_W, HH, ['#d8a07a', '#c89272', '#a8805e', '#8a6a4e']);
    b.grain(0, 0, LAS_AF_W, HH, 0.07, 81);
    // the runway: dark asphalt, rubber marks, centreline, edge lights
    b.rect(0, 58, LAS_AF_W, 30, rgbOf('#3a3a42'));
    b.grain(0, 58, LAS_AF_W, 30, 0.12, 82);
    for (let x = 0; x < LAS_AF_W; x += 34) b.rect(x, 72, 18, 2, rgbOf('#e8e6dc'));
    b.hline(0, 59, LAS_AF_W, rgbOf('#e8e6dc')); b.hline(0, 86, LAS_AF_W, rgbOf('#e8e6dc'));
    for (let x = 0; x < LAS_AF_W; x += 60) if (hash2(x, 1, 83) < 0.5) b.blend(x, 64, 40, 18, rgbOf('#1b1b22'), 0.35);   // rubber
    // the painted numbers at each end, and the threshold piano keys
    for (let e = 0; e < 3; e++) {
      const tx = 400 + e * 1800;
      for (let i = 0; i < 8; i++) b.rect(tx + i * 7, 62, 4, 22, rgbOf('#e8e6dc'));
    }
    // the taxiway, nearer, with its yellow line and blue edge lights
    b.rect(0, 104, LAS_AF_W, 16, rgbOf('#4a4650'));
    b.grain(0, 104, LAS_AF_W, 16, 0.1, 84);
    b.hline(0, 112, LAS_AF_W, rgbOf('#e0b23c'));
    for (let x = 0; x < LAS_AF_W; x += 22) { b.put(x, 103, rgbOf('#5ab0ff')); b.put(x, 121, rgbOf('#5ab0ff')); }
    for (let x = 11; x < LAS_AF_W; x += 22) b.put(x, 60, rgbOf('#ffffff'));
    // the apron edge, concrete in slabs
    b.concrete(0, 124, LAS_AF_W, 26, '#9a9488', 85);
    for (let x = 0; x < LAS_AF_W; x += 48) b.vline(x, 124, 26, rgbOf('#7a756a'));
    // hangars, low and long, far side of the runway
    for (let i = 0; i < 6; i++) {
      const hx = 200 + i * 860, hw = 180;
      b.box(hx, 26, hw, 30, '#c8c2b4', { ol: false, tex: 'concrete', seed: i });
      for (let k = 0; k < hw; k += 6) b.vline(hx + k, 30, 24, rgbOf('#a8a294'));
      b.rect(hx + 20, 38, 60, 18, rgbOf('#3a3a44'));
      b.rect(hx, 24, hw, 3, rgbOf('#8a8478'));
    }
    // the control tower: a slender shaft and a wide glass cab, the one
    // silhouette on the field everybody recognises
    const tx = 2700;
    b.ditherH(tx, 0, 10, 56, ['#e8e2d4', '#b8b0a0', '#8a8272']);
    b.rect(tx - 12, 0, 34, 4, rgbOf('#3a3a44'));
    b.glass(tx - 10, 4, 30, 9, '#2a4a60', 1, 3, { band: 12 });
    b.rect(tx - 12, 13, 34, 3, rgbOf('#d8d2c4'));
    b.vline(tx + 5, 0, 1, rgbOf('#ff4a3a'));
    return b.toCanvas();
  });
}
// ---------- aircraft, baked big ----------
// A twin-engine widebody side on. The livery is data, so the same sprite
// flies for Dragon Fly and parks at gates for three other airlines.
const LAS_LIVERY = {
  df: { body: '#f0f2f6', belly: DF.navy, line: DF.gold, tail: DF.navy, tailB: DF.navyHi, eng: '#d8dce2', mark: 'df' },
  hive: { body: '#f4f1ea', belly: '#c8402c', line: '#c8402c', tail: '#c8402c', tailB: '#e8604a', eng: '#e8e2d4', mark: 'hive' },
  moth: { body: '#e8ecf2', belly: '#2f6a4a', line: '#6be585', tail: '#2f6a4a', tailB: '#3f8a5e', eng: '#d0d6de', mark: 'moth' },
  jet: { body: '#ffffff', belly: '#2f4a8a', line: '#8ad8ff', tail: '#2f4a8a', tailB: '#8ad8ff', eng: '#e0e6ee', mark: 'jet' },
};
function lasAircraft(livery) {
  return cached('las|plane|' + livery, function () {
    const L = LAS_LIVERY[livery] || LAS_LIVERY.df;
    const w = 560, h = 190, b = new TexBuf(w, h, 0, 0);
    const bodyY = 92, bh = 42, x0 = 40, x1 = 470;
    // fuselage: a dithered cylinder, light on top, the belly in the livery colour
    b.ditherV(x0, bodyY, x1 - x0, bh, [L.body, L.body, lerpRGB(rgbOf(L.body), rgbOf('#9aa3ae'), 0.5)]);
    b.rect(x0, bodyY + 28, x1 - x0, 14, rgbOf(L.belly));
    b.ditherV(x0, bodyY + 34, x1 - x0, 8, [L.belly, shadeRGB(rgbOf(L.belly), 0.6)]);
    b.rect(x0, bodyY + 25, x1 - x0, 3, rgbOf(L.line));
    // the nose: a curve built row by row
    for (let y = 0; y < bh; y++) {
      const k = Math.abs(y - bh * 0.62) / (bh * 0.62), len = 40 * Math.sqrt(Math.max(0, 1 - k * k));
      for (let x = 0; x < len; x++) {
        const px0 = x0 - x - 1, py0 = bodyY + y;
        b.put(px0, py0, rgbOf(y > 28 ? L.belly : y > 25 ? L.line : L.body));
      }
    }
    // the tail cone, tapering upward
    for (let y = 0; y < bh; y++) {
      const len = (1 - y / bh) * 70;
      for (let x = 0; x < len; x++) b.put(x1 + x, bodyY + y - (x * 0.3) * (y < 20 ? 0 : 0), rgbOf(y > 28 ? L.belly : y > 25 ? L.line : L.body));
    }
    // outline the whole body in one dark pass
    const ol = rgbOf('#1b2230');
    for (let y = bodyY - 1; y < bodyY + bh + 1; y++) for (let x = 0; x < w; x++) {
      const c = b.get(x, y); if (!c || c[3] !== 0) continue;
      const n = b.get(x, y - 1), s = b.get(x, y + 1), e = b.get(x + 1, y), wv = b.get(x - 1, y);
      if ((n && n[3] > 200) || (s && s[3] > 200) || (e && e[3] > 200) || (wv && wv[3] > 200)) b.put(x, y, ol);
    }
    // cabin windows, and the flight deck
    for (let x = x0 + 34; x < x1 - 10; x += 9) b.rect(x, bodyY + 12, 4, 5, rgbOf('#2a3a52'));
    for (let x = x0 + 34; x < x1 - 10; x += 9) b.put(x, bodyY + 12, rgbOf('#8fb8d8'));
    b.rect(x0 - 26, bodyY + 9, 18, 7, rgbOf('#1b2a3e'));
    b.hline(x0 - 26, bodyY + 9, 18, rgbOf('#9ac8e8'));
    // doors, with their outlines
    for (const dx of [x0 + 18, x0 + 190, x1 - 30]) { b.frame(dx, bodyY + 6, 10, 22, rgbOf('#8a939e')); b.put(dx + 7, bodyY + 16, rgbOf('#5a636e')); }
    // the airline's name along the crown, in the tail colour
    // wing, swept, seen almost edge on, and the engine hung under it
    for (let i = 0; i < 18; i++) b.hline(x0 + 170 + i * 2, bodyY + bh - 4 + i, 150 - i * 5, rgbOf(i < 3 ? '#e8ecf0' : '#b9c0ca'));
    const ex = x0 + 172, ey = bodyY + bh + 8;
    b.ditherV(ex, ey, 70, 30, [L.eng, lerpRGB(rgbOf(L.eng), rgbOf('#6a7280'), 0.6)]);
    b.frame(ex, ey, 70, 30, ol);
    b.rect(ex + 1, ey + 3, 8, 24, rgbOf('#2a2f38'));
    for (let y = ey + 5; y < ey + 26; y += 3) b.hline(ex + 2, y, 6, rgbOf('#4a525e'));
    b.hline(ex + 12, ey + 2, 50, rgbOf('#ffffff'), 140);
    // the tail fin, tall and raked, in the livery
    for (let y = 0; y < 86; y++) {
      const xl = x1 + 18 + y * 0.72, xr = x1 + 78 + y * 0.1;
      for (let x = xl | 0; x < xr; x++) b.put(x, bodyY - y + 4, rgbOf(y > 70 ? L.tailB : L.tail));
    }
    for (let y = 0; y < 86; y++) b.put((x1 + 18 + y * 0.72) | 0, bodyY - y + 4, ol);
    // the horizontal stabiliser
    for (let i = 0; i < 6; i++) b.hline(x1 + 36 + i * 3, bodyY + 20 + i, 60 - i * 6, rgbOf('#c8ced6'));
    // gear, down and chocked
    for (const gx of [x0 + 6, x0 + 200, x0 + 226]) {
      b.rect(gx, bodyY + bh, 3, 20, rgbOf('#5a636e'));
      b.rect(gx - 5, bodyY + bh + 18, 13, 9, rgbOf('#1b1f26'));
      b.put(gx - 3, bodyY + bh + 20, rgbOf('#5a636e'));
    }
    const cv = b.toCanvas(), cx = cv.getContext('2d');
    // the tail mark, drawn with the proper brand art on top of the bake
    if (L.mark === 'df') { const m = dfMark(40, { flat: true }); cx.drawImage(m, x1 + 42, bodyY - 60); }
    else { cx.fillStyle = '#ffffff'; brandLogo(cx, x1 + 62, bodyY - 38, 14, { logo: L.mark === 'hive' ? 'star' : L.mark === 'moth' ? 'leaf' : 'plane', col: '#ffffff', col2: L.tail }, 0); }
    drawText(cx, L.mark === 'df' ? 'DRAGON FLY' : L.mark === 'hive' ? 'HIVE AIR' : L.mark === 'moth' ? 'MOTHWAYS' : 'JETBUG', x0 + 110, bodyY + 2, L.tail, { scale: 2 });
    return cv;
  });
}

// ---------- the building, baked in tiles ----------
const _lasTiles = new Map();
function lasTile(i) {
  let c = _lasTiles.get(i);
  if (c) return c;
  const x0 = i * LAS_T, b = new TexBuf(LAS_T, LAS_TH, x0, 0);
  for (let k = 0; k < LAS_ZONES.length; k++) {
    const z = LAS_ZONES[k];
    if (z.x1 <= x0 || z.x0 >= x0 + LAS_T) continue;
    const P = LAS_PAINT[z.id]; if (P) P(b, Math.max(z.x0, x0), Math.min(z.x1, x0 + LAS_T), z);
  }
  c = b.toCanvas();
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  ctx.save(); ctx.translate(-x0, 0);
  lasDecorate(ctx, x0, x0 + LAS_T);
  ctx.restore();
  _lasTiles.set(i, c);
  return c;
}
// ---- the ceiling of the tall halls: a white steel roof, a skylight run the
// length of it that shows the actual sky, girders, light strips, sprinklers
function lasCeilingHigh(b, xa, xb) {
  const w = xb - xa;
  b.rect(xa, 0, w, 126, rgbOf(LP.ceil));
  b.grain(xa, 0, w, 126, 0.035, 101);
  // the skylight: glass, mostly clear, so the dusk shows through
  b.glass(xa, 12, w, 30, '#7a6a9a', 0.22, 3, { band: 120, hi: '#ffe8d0' });
  for (let x = Math.ceil(xa / 60) * 60; x < xb; x += 60) b.rect(x, 12, 3, 30, rgbOf(LP.steel));
  b.hline(xa, 11, w, rgbOf(LP.steelLo)); b.hline(xa, 42, w, rgbOf(LP.steelLo));
  // the box girders, hung every 240, with a lattice you can count
  for (let gx = Math.floor(xa / 240) * 240; gx < xb + 240; gx += 240) {
    b.box(gx - 6, 42, 12, 34, LP.white, { ol: '#9aa3ae', tex: 'brushed', seed: 7 });
    b.brushed(gx + 6, 58, 228, 6, LP.white, 11);
    b.hline(gx + 6, 58, 228, rgbOf(LP.steelHi)); b.hline(gx + 6, 63, 228, rgbOf(LP.ceilLo));
    for (let k = 0; k < 228; k += 38) {
      for (let s = 0; s < 16; s++) { b.put(gx + 6 + k + s, 64 + s, rgbOf(LP.steel)); b.put(gx + 44 + k - s, 64 + s, rgbOf(LP.steel)); }
    }
  }
  // the lower plane of the ceiling, with light strips and their glow
  b.rect(xa, 84, w, 26, rgbOf('#e6e9ee'));
  b.grain(xa, 84, w, 26, 0.03, 102);
  for (let x = Math.floor(xa / 160) * 160 + 20; x < xb; x += 160) {
    b.rect(x, 92, 90, 3, rgbOf('#fff6dc'));
    b.hline(x - 1, 91, 92, rgbOf('#c8ccd4')); b.hline(x - 1, 95, 92, rgbOf('#c8ccd4'));
  }
  for (let x = Math.floor(xa / 80) * 80 + 40; x < xb; x += 80) { b.put(x, 104, rgbOf('#c8402c')); b.put(x, 103, rgbOf(LP.steel)); }
  for (let x = Math.floor(xa / 200) * 200 + 130; x < xb; x += 200) { b.rect(x, 99, 30, 2, rgbOf('#4a525e')); b.rect(x, 102, 30, 1, rgbOf('#9aa3ae')); }
  // the bulkhead where ceiling meets wall, and its shadow
  b.box(xa - 2, 110, w + 4, 14, '#cfd5dd', { ol: false });
  b.hline(xa, 124, w, rgbOf('#8a939e'));
  b.blend(xa, 125, w, 3, rgbOf('#000000'), 0.18);
}
// ---- the dropped ceiling over security: acoustic tiles and troffers
function lasCeilingLow(b, xa, xb) {
  const w = xb - xa;
  b.rect(xa, 0, w, 160, rgbOf('#cfd3da'));
  // seen from below at an angle: rows closer together the further back they are
  const rows = [0, 30, 56, 78, 97, 113, 127, 139, 149, 158];
  for (let r = 0; r < rows.length - 1; r++) {
    const y0 = rows[r], y1 = rows[r + 1];
    b.ditherV(xa, y0, w, y1 - y0, ['#e2e5ea', '#c8cdd5']);
    b.hline(xa, y1 - 1, w, rgbOf('#9aa0aa'));
    for (let x = Math.floor(xa / 40) * 40; x < xb; x += 40) b.vline(x + ((r * 7) % 40), y0, y1 - y0, rgbOf('#aab0ba'));
    // the pinholes in acoustic tile, the most boring texture in the world
    for (let j = y0 + 2; j < y1 - 2; j += 3) for (let i = xa + ((j * 3) % 4); i < xb; i += 4) if (hash2(i, j, 110) < 0.5) b.put(i, j, rgbOf('#b8bdc6'));
  }
  for (let x = Math.floor(xa / 120) * 120 + 30; x < xb; x += 120) {
    b.box(x, 97, 60, 14, '#f4f6f8', { ol: '#8a909a', tex: false });
    for (let k = 3; k < 57; k += 6) b.vline(x + k, 99, 10, rgbOf('#fffbea'));
    b.pool(x + 30, 118, 60, 26, '#fff6d0', 0.18);
  }
  b.box(xa - 2, 158, w + 4, 8, '#b8bec8', { ol: false });
  b.blend(xa, 166, w, 3, rgbOf('#000000'), 0.2);
}
// ---- the floor: terrazzo, brass divider strips, a skirting, and a sheen
function lasFloor(b, xa, xb) {
  const w = xb - xa;
  b.brushed(xa, LAS_F - 8, w, 8, '#6a727e', 120);
  b.hline(xa, LAS_F - 8, w, rgbOf('#9aa3ae'));
  b.terrazzo(xa, LAS_F, w, LAS_TH - LAS_F, LP.terr, ['#f6f2ea', '#5a5650', '#9a6a4a', '#8a9a80', '#2a2a2e', '#c8b89a'], 121);
  // depth: receding brass strips closer together near the wall
  const bands = [LAS_F + 16, LAS_F + 38, LAS_F + 70, LAS_F + 112];
  for (let i = 0; i < bands.length; i++) { b.hline(xa, bands[i], w, rgbOf(LP.brass)); b.hline(xa, bands[i] + 1, w, rgbOf('#8a6e34'), 160); }
  for (let x = Math.floor(xa / 360) * 360; x < xb; x += 360) for (let y = LAS_F; y < LAS_TH; y++) b.put(x + ((y - LAS_F) * 0.35 | 0), y, rgbOf(LP.brass));
  // the sheen, strongest just in front of the wall, dithered away
  for (let y = LAS_F + 2; y < LAS_F + 30; y++) for (let x = xa; x < xb; x++) if ((1 - (y - LAS_F) / 30) * 0.7 > bayerAt(x, y) + 0.1) b.mix(x, y, rgbOf('#ffffff'), 0.16);
  b.blend(xa, LAS_F, w, 3, rgbOf('#000000'), 0.22);
}
// light from a window, lying on a polished floor as a long dithered streak
function lasFloorStreak(b, x, w, col, strength) {
  for (let y = LAS_F + 1; y < LAS_F + 90; y++) {
    const k = (1 - (y - LAS_F) / 90) * strength;
    for (let i = x; i < x + w; i++) if (k > bayerAt(i, y) * 0.9) b.mix(i, y, rgbOf(col), Math.min(0.55, k));
  }
}

// ---------- the kerb: outside, Level 2 ----------
function lasPaintKerb(b, xa, xb) {
  const w = xb - xa;
  // everything above the canopy is left clear: that is the real sky
  // ---- the facade behind the canopy: curtain wall with aluminium louvres,
  // and the lit lobby glowing through it
  b.ditherV(xa, 134, w, LAS_F - 134, ['#f0c890', '#e0a870', '#c88a5e', '#8a6a5a']);
  for (let x = Math.floor(xa / 90) * 90; x < xb; x += 90) { b.rect(x + 20, 190, 50, 90, rgbOf('#7a5a50')); b.rect(x + 24, 196, 42, 5, rgbOf('#fff0c0')); }
  b.glass(xa, 134, w, LAS_F - 134, '#5a7a90', 0.42, 5, { band: 90 });
  for (let x = Math.floor(xa / 36) * 36; x < xb; x += 36) {
    b.brushed(x, 134, 6, LAS_F - 142, '#b8c0ca', 131, true);
    b.vline(x, 134, LAS_F - 142, rgbOf(LP.steelHi)); b.vline(x + 5, 134, LAS_F - 142, rgbOf(LP.steelLo));
  }
  for (const ty of [228, 330]) { b.brushed(xa, ty, w, 5, '#aab2bc', 132); b.hline(xa, ty, w, rgbOf(LP.steelHi)); b.hline(xa, ty + 4, w, rgbOf(LP.steelLo)); }
  // the entrances: pairs of sliding doors, dark frames, the lobby inside
  for (let k = 0; k < 4; k++) {
    const dx = 230 + k * 290; if (dx + 110 < xa || dx > xb) continue;
    b.box(dx, 300, 110, LAS_F - 300, '#3a414c', { tex: 'brushed', seed: k });
    b.ditherV(dx + 4, 304, 102, LAS_F - 304, ['#ffe0a8', '#f0b878', '#b88a6a']);
    b.glass(dx + 4, 304, 50, LAS_F - 304, '#8ab0c8', 0.35, k, { band: 40 });
    b.glass(dx + 56, 304, 50, LAS_F - 304, '#8ab0c8', 0.35, k + 2, { band: 40 });
    b.vline(dx + 55, 304, LAS_F - 304, rgbOf('#2a2f38'));
    b.rect(dx + 46, 360, 3, 30, rgbOf(LP.steelHi)); b.rect(dx + 61, 360, 3, 30, rgbOf(LP.steelHi));
    b.box(dx - 6, 280, 122, 20, '#1c2a4a', { tex: false });
  }
  // ---- the canopy: a deep white fascia and the underside with its lights
  b.box(xa - 2, 76, w + 4, 46, LP.white, { ol: '#6a727e', tex: 'brushed', seed: 133 });
  b.hline(xa, 78, w, rgbOf('#ffffff'));
  for (let x = Math.floor(xa / 120) * 120; x < xb; x += 120) b.vline(x, 78, 42, rgbOf('#c8ced6'));
  b.ditherV(xa, 122, w, 12, ['#b8bec8', '#7a828e']);
  for (let x = Math.floor(xa / 64) * 64 + 20; x < xb; x += 64) { b.rect(x, 127, 10, 3, rgbOf('#fff8e0')); b.pool(x + 5, 140, 34, 12, '#fff0c8', 0.35); }
  // ---- the columns holding it up, round and brushed
  for (let cx = 160; cx < 1150; cx += 320) {
    if (cx + 12 < xa || cx - 12 > xb) continue;
    b.ditherH(cx - 9, 134, 18, LAS_F - 134, ['#e8ecf0', '#b8c0ca', '#8a939e', '#5b636e']);
    b.rect(cx - 12, LAS_F - 14, 24, 14, rgbOf('#6a727e'));
    b.hline(cx - 12, LAS_F - 14, 24, rgbOf(LP.steelHi));
    b.rect(cx - 12, 132, 24, 6, rgbOf('#9aa3ae'));
  }
  // ---- the pavement: concrete pavers, a granite kerb, and the road
  b.concrete(xa, LAS_F, w, 18, '#b8b0a2', 134);
  for (let x = Math.floor(xa / 30) * 30; x < xb; x += 30) b.vline(x, LAS_F, 18, rgbOf('#8a8274'));
  b.hline(xa, LAS_F + 9, w, rgbOf('#9a9284'));
  b.blend(xa, LAS_F, w, 3, rgbOf('#000000'), 0.2);
  b.rect(xa, LAS_F + 18, w, 7, rgbOf('#d8d2c8'));
  b.grain(xa, LAS_F + 18, w, 7, 0.1, 135);
  b.hline(xa, LAS_F + 18, w, rgbOf('#f4efe6')); b.hline(xa, LAS_F + 24, w, rgbOf('#6a645c'));
  b.rect(xa, LAS_F + 25, w, LAS_TH - LAS_F - 25, rgbOf('#34343c'));
  b.grain(xa, LAS_F + 25, w, LAS_TH - LAS_F - 25, 0.16, 136);
  for (let x = Math.floor(xa / 90) * 90; x < xb; x += 90) b.rect(x, LAS_F + 80, 46, 3, rgbOf('#e8e6dc'));
  b.hline(xa, LAS_F + 30, w, rgbOf('#e0b23c'));
  for (let x = Math.floor(xa / 150) * 150; x < xb; x += 150) if (hash2(x, 3, 137) < 0.6) b.blend(x + 30, LAS_F + 46 + (hash2(x, 4, 137) * 40 | 0), 34, 10, rgbOf('#15151a'), 0.4);
  // a zebra crossing between the doors and the far kerb
  for (let x = 700; x < 790; x += 12) if (x >= xa && x < xb) b.rect(x, LAS_F + 26, 7, LAS_TH - LAS_F - 26, rgbOf('#e8e6dc'), 235);
}

// ---------- the ticketing lobby, behind the west window wall ----------
function lasPaintLobby(b, xa, xb) {
  const w = xb - xa;
  lasCeilingHigh(b, xa, xb);
  // ---- what is outside the window wall: the lower half is the parking
  // structure and the roadway viaduct, lit; the upper half is left for the sky
  b.concrete(xa, 300, w, LAS_F - 300, '#8a8278', 140);
  for (let lv = 0; lv < 4; lv++) {
    const ly = 306 + lv * 34;
    b.rect(xa, ly, w, 6, rgbOf('#b8b0a4'));
    b.hline(xa, ly, w, rgbOf('#d8d0c4'));
    for (let x = Math.floor(xa / 40) * 40; x < xb; x += 40) { b.pool(x + 20, ly + 12, 18, 8, '#ffe8b0', 0.4); if (hash2(x, lv, 141) < 0.4) { b.rect(x + 8, ly + 18, 20, 9, rgbOf(['#c8402c', '#2f4a8a', '#e8e2d4', '#3a3a44'][(x / 40 + lv) % 4 | 0])); b.put(x + 9, ly + 22, rgbOf('#ff6a5a')); } }
  }
  // ---- the glass itself: spider-glazed panes, tension cables, fittings
  b.glass(xa, 126, w, LAS_F - 134, '#6f9fb8', 0.24, 7, { band: 110, slope: 0.4 });
  for (let x = Math.floor(xa / 80) * 80; x < xb; x += 80) b.vline(x, 126, LAS_F - 134, rgbOf('#9aa8b4'), 170);
  for (let y = 126; y < LAS_F - 10; y += 64) b.hline(xa, y, w, rgbOf('#9aa8b4'), 170);
  for (let x = Math.floor(xa / 80) * 80; x < xb + 1; x += 80) for (let y = 126; y < LAS_F - 10; y += 64) {
    // the spider fitting at each corner: a small steel cross
    for (let k = -3; k <= 3; k++) { b.put(x + k, y + k, rgbOf(LP.steelHi)); b.put(x + k, y - k, rgbOf(LP.steelHi)); }
    b.put(x, y, rgbOf(LP.steelLo));
  }
  // the tension cables, doubled, with struts between: the wall is held up by them
  for (let x = Math.floor(xa / 320) * 320 + 160; x < xb; x += 320) {
    b.vline(x - 8, 126, LAS_F - 134, rgbOf('#5b636e')); b.vline(x + 8, 126, LAS_F - 134, rgbOf('#5b636e'));
    for (let y = 150; y < LAS_F - 10; y += 48) b.hline(x - 8, y, 17, rgbOf('#8a939e'));
  }
  b.box(xa - 2, LAS_F - 10, w + 4, 10, '#4a525e', { ol: false, tex: 'brushed' });
  // ---- the check-in islands, four of them, 130 positions in the real hall
  for (let k = 0; k < 4; k++) {
    const ix = 1330 + k * 480, iw = 380;
    if (ix + iw < xa || ix > xb) continue;
    // the back wall of the island: a wood-grain laminate panel
    b.brushed(ix, 262, iw, 136, LP.wood, 150 + k, true);
    for (let x = ix; x < ix + iw; x += 3) if (hash2(x, k, 151) < 0.25) b.vline(x, 262, 136, rgbOf(LP.woodLo), 120);
    b.frame(ix, 262, iw, 136, rgbOf(LP.ink));
    b.hline(ix + 1, 263, iw - 2, rgbOf('#c8906a'));
    // the backlit sign band along the top
    b.box(ix - 4, 244, iw + 8, 26, LP.navy, { tex: false });
    b.pool(ix + iw / 2, 272, iw * 0.6, 14, '#8ab0ff', 0.25);
    // two flight screens per island
    for (let s = 0; s < 2; s++) {
      const sx = ix + 60 + s * 200;
      b.box(sx, 292, 74, 44, '#12141c', { ol: '#2a2f38', tex: false });
      for (let r = 0; r < 5; r++) { b.hline(sx + 4, 298 + r * 7, 20 + (r * 13) % 30, rgbOf(r === 0 ? '#f2a03a' : '#8ad8ff')); b.hline(sx + 50, 298 + r * 7, 18, rgbOf('#6be585')); }
    }
    // the island's floor shadow
    b.blend(ix - 10, LAS_F, iw + 20, 4, rgbOf('#000000'), 0.22);
  }
  lasFloor(b, xa, xb);
  for (let x = Math.floor(xa / 80) * 80 + 10; x < xb; x += 80) lasFloorStreak(b, x, 60, '#ffd9a8', 0.28);
}

// ---------- security ----------
function lasPaintSecurity(b, xa, xb) {
  const w = xb - xa;
  lasCeilingLow(b, xa, xb);
  // the frosted partition that hides the E gates until you have earned them
  b.ditherV(xa, 166, w, LAS_F - 174, ['#e8eef4', '#d4dde6', '#c2ccd8']);
  b.grain(xa, 166, w, LAS_F - 174, 0.03, 160);
  for (let y = 200; y < LAS_F - 20; y += 22) for (let x = xa; x < xb; x++) if (bayerAt(x, y) < 0.5) b.put(x, y, rgbOf('#f4f8fb'));
  for (let x = Math.floor(xa / 120) * 120; x < xb; x += 120) { b.brushed(x, 166, 5, LAS_F - 174, '#8a939e', 161, true); b.vline(x, 166, LAS_F - 174, rgbOf(LP.steelHi)); }
  // the sign band, navy, with the seal space the decorator fills in
  b.box(xa - 2, 172, w + 4, 30, '#1c2a4a', { tex: false, ol: '#0a1020' });
  b.hline(xa, 173, w, rgbOf('#3a4f7a'));
  b.box(xa - 2, LAS_F - 10, w + 4, 10, '#6a727e', { ol: false, tex: 'brushed' });
  lasFloor(b, xa, xb);
  // rubber matting under the machines, ribbed
  const m0 = Math.max(xa, 3560), m1 = Math.min(xb, 4250);
  if (m1 > m0) {
    for (let mx = m0; mx < m1; mx++) for (let y = LAS_F + 4; y < LAS_F + 34; y++) {
      const rib = (y - LAS_F) % 3 === 0;
      b.put(mx, y, rgbOf(rib ? '#6a6e78' : '#4e525c'));
      if (hash2(mx, y, 162) < 0.05) b.put(mx, y, rgbOf('#5a5e68'));
    }
    b.hline(m0, LAS_F + 3, m1 - m0, rgbOf('#8a8e98')); b.hline(m0, LAS_F + 34, m1 - m0, rgbOf('#2a2d33'));
  }
}
// ---------- the centre, just past security: shops, food, and the machines ----------
const LAS_STORES = [
  { x: 4330, w: 230, name: 'VEGAS NEWS', sub: 'BOOKS & SNACKS', col: '#1c2a4a', acc: '#e0b23c', stock: ['#e8503a', '#4a86f7', '#f2c94c', '#f4f1ea', '#6be585'] },
  { x: 4580, w: 210, name: 'STARBUGS', sub: 'COFFEE', col: '#0b5a3e', acc: '#f4f1ea', stock: ['#f4f1ea', '#8a5a34', '#0b5a3e', '#c8a06a'] },
  { x: 4810, w: 240, name: 'LUCKY DUTY FREE', sub: 'LIQUOR - FRAGRANCE', col: '#3a2250', acc: '#ffd24a', stock: ['#ffd24a', '#c58bff', '#8ad8ff', '#e8503a', '#f4f1ea'] },
  { x: 5070, w: 190, name: 'BURGER MONARCH', sub: 'FLAME GRILLED', col: '#7a1c14', acc: '#f2c94c', stock: ['#f2c94c', '#e8503a', '#f4f1ea', '#6a3a1a'] },
];
function lasStorefront(b, s) {
  const x = s.x, w = s.w, top = 214;
  // the frame: brushed steel posts and a deep header
  b.box(x, top, w, LAS_F - top, '#8a939e', { tex: 'brushed', seed: x });
  // inside, lit and full: shelves with product, the back wall, a counter
  b.ditherV(x + 8, top + 42, w - 16, LAS_F - top - 50, ['#fff4dc', '#f0dcb8', '#c8a888']);
  for (let r = 0; r < 5; r++) {
    const sy = top + 60 + r * 30;
    b.rect(x + 12, sy + 16, w - 24, 3, rgbOf('#8a6a4a'));
    b.hline(x + 12, sy + 16, w - 24, rgbOf('#c8a06a'));
    for (let i = x + 14; i < x + w - 14; i += 5) {
      const hgt = 6 + (hash2(i, r, 170) * 9 | 0), c = rgbOf(s.stock[(hash2(i, r, 171) * s.stock.length) | 0]);
      b.rect(i, sy + 16 - hgt, 4, hgt, c);
      b.put(i, sy + 16 - hgt, shadeRGB(c, 1.3)); b.vline(i + 3, sy + 17 - hgt, hgt - 1, shadeRGB(c, 0.7));
    }
  }
  b.box(x + w * 0.55, LAS_F - 46, w * 0.4, 38, '#5a4a3a', { tex: 'brushed', seed: x + 1 });
  // the glass shopfront over it, and the open doorway left of centre
  b.glass(x + 8, top + 42, w - 16, LAS_F - top - 50, '#b8d8e8', 0.2, x, { band: 60 });
  b.rect(x + 30, LAS_F - 96, 58, 96, rgbOf('#f0dcb8'));
  b.ditherV(x + 30, LAS_F - 96, 58, 96, ['#fff0d0', '#e0c498']);
  b.frame(x + 30, LAS_F - 96, 58, 96, rgbOf('#5b636e'));
  // the sign header, in the brand's colours
  b.box(x - 4, top, w + 8, 42, s.col, { tex: false });
  b.hline(x - 3, top + 1, w + 6, shadeRGB(rgbOf(s.col), 1.5));
  b.pool(x + w / 2, top + 48, w * 0.5, 12, s.acc, 0.3);
  b.blend(x, LAS_F, w, 4, rgbOf('#000000'), 0.2);
}
function lasPaintCenter(b, xa, xb) {
  const w = xb - xa;
  lasCeilingHigh(b, xa, xb);
  // the back wall: a tall stone-clad plane above the shops
  b.rect(xa, 126, w, 90, rgbOf(LP.stone));
  for (let y = 126; y < 216; y += 18) { b.hline(xa, y, w, rgbOf('#9a9080')); }
  for (let y = 126; y < 216; y += 18) for (let x = Math.floor(xa / 60) * 60 + ((y / 18) % 2) * 30; x < xb; x += 60) b.vline(x, y, 18, rgbOf('#9a9080'));
  b.grain(xa, 126, w, 90, 0.07, 172);
  b.rect(xa, 214, w, LAS_F - 214, rgbOf('#8a939e'));
  for (let i = 0; i < LAS_STORES.length; i++) { const s = LAS_STORES[i]; if (s.x + s.w >= xa && s.x <= xb) lasStorefront(b, s); }
  // the restrooms: a tiled return with the doorway set back in it
  if (5270 < xb && 5430 > xa) {
    b.rect(5270, 214, 160, LAS_F - 214, rgbOf('#dfe4ea'));
    for (let y = 214; y < LAS_F; y += 10) b.hline(5270, y, 160, rgbOf('#b8c0ca'));
    for (let y = 214; y < LAS_F; y += 10) for (let x = 5270 + ((y / 10) % 2) * 10; x < 5430; x += 20) b.vline(x, y, 10, rgbOf('#b8c0ca'));
    b.rect(5310, LAS_F - 110, 80, 110, rgbOf('#2a2f38'));
    b.ditherV(5314, LAS_F - 106, 72, 106, ['#5a6472', '#2a2f38']);
  }
  // a mural of the desert at night, painted on the last wall before the gates
  if (5440 < xb && 5650 > xa) {
    const mx = 5440, mw = 210, my = 226, mh = 200;
    b.ditherV(mx, my, mw, mh * 0.6, ['#1a1030', '#3a1a50', '#8a3a6a', '#e0785e']);
    b.ditherV(mx, my + mh * 0.6, mw, mh * 0.4, ['#6a3a3a', '#3a2028']);
    for (let i = 0; i < mw; i++) { const hh = 14 + Math.sin(i * 0.05) * 8 + Math.sin(i * 0.13) * 4; b.vline(mx + i, my + mh * 0.6 - hh, hh, rgbOf('#2a1a30')); }
    for (let i = 0; i < 5; i++) { const cx = mx + 30 + i * 40; b.rect(cx, my + mh * 0.6 - 30, 4, 30, rgbOf('#1a3a2a')); b.rect(cx - 6, my + mh * 0.6 - 24, 6, 3, rgbOf('#1a3a2a')); b.rect(cx + 4, my + mh * 0.6 - 18, 6, 3, rgbOf('#1a3a2a')); }
    b.frame(mx - 1, my - 1, mw + 2, mh + 2, rgbOf('#5a5040'));
  }
  lasFloor(b, xa, xb);
  // a terrazzo medallion where the centre opens out: an eight-point brass
  // star on midnight blue, seen flattened because you look across the floor
  const MX = 4990, MY = LAS_F + 37, RX = 112, RY = 30;
  const blue = rgbOf('#223052'), blue2 = rgbOf('#2e4270'), cream = rgbOf('#e8dcc0'), brass = rgbOf(LP.brass), brassLo = rgbOf('#8a6a2a'), red = rgbOf('#b83a2a');
  for (let y = MY - RY - 1; y <= MY + RY + 1; y++) for (let x = MX - RX - 1; x <= MX + RX + 1; x++) {
    if (x < xa || x >= xb) continue;
    const dx = (x - MX) / RX, dy = (y - MY) / RY, d = Math.sqrt(dx * dx + dy * dy);
    if (d > 1) continue;
    const a = Math.atan2(dy, dx), s4 = Math.abs(Math.cos(4 * a));
    const c2 = Math.cos(2 * a), star = 0.16 + (0.34 + 0.3 * c2 * c2) * Math.pow(s4, 6);   // long points on the compass bearings
    let c;
    if (d > 0.955) c = brass;                                   // the outer brass ring
    else if (d > 0.93) c = brassLo;
    else if (d > 0.8) {                                         // a cream band, speckled, with sixteen brass ticks
      c = cream; const tk = Math.abs(((a / (Math.PI * 2)) * 32 % 1 + 1) % 1 - 0.5);
      if (tk < 0.08 && d > 0.84 && d < 0.9) c = brass;
    }
    else if (d > 0.78) c = brassLo;
    else if (d < star) c = Math.sin(4 * a) * Math.cos(4 * a) > 0 ? brass : lerpRGB(brass, cream, 0.55);   // two-tone facets
    else c = (hash2(x >> 1, y, 61) < 0.5) ? blue : blue2;
    if (d < 0.1) c = red;
    if (d < 0.04) c = brass;
    const g = hash2(x, y, 62);                                  // the aggregate: chips of stone in everything
    if (g > 0.93) c = shadeRGB(c, 1.18); else if (g < 0.05) c = shadeRGB(c, 0.7);
    b.put(x, y, c);
  }
}
// ---------- the E gates: windows onto the airfield ----------
function lasPaintGates(b, xa, xb) {
  const w = xb - xa;
  lasCeilingHigh(b, xa, xb);
  // the window wall runs the whole concourse, broken only by columns
  b.glass(xa, 128, w, LAS_F - 140, '#6f9fb8', 0.2, 11, { band: 130, slope: 0.35 });
  for (let x = Math.floor(xa / 72) * 72; x < xb; x += 72) { b.vline(x, 128, LAS_F - 140, rgbOf('#9aa8b4'), 200); b.vline(x + 1, 128, LAS_F - 140, rgbOf('#5b636e'), 120); }
  for (const ty of [236, 334]) { b.brushed(xa, ty, w, 4, '#8a939e', 180); b.hline(xa, ty, w, rgbOf(LP.steelHi)); }
  b.box(xa - 2, LAS_F - 12, w + 4, 12, '#3a414c', { ol: false, tex: 'brushed', seed: 181 });
  for (let x = Math.floor(xa / 8) * 8; x < xb; x += 8) b.rect(x, LAS_F - 8, 5, 2, rgbOf('#1b1f26'));
  // the columns between the gates, clad in white panels, each with an ad
  for (let g = 0; g < LAS_GATES.length + 1; g++) {
    const cx = 5715 + g * 290;
    if (cx + 22 < xa || cx - 22 > xb) continue;
    b.ditherH(cx - 20, 124, 40, LAS_F - 124, ['#f4f6f8', '#dde2e8', '#b8c0ca', '#8a939e']);
    b.frame(cx - 20, 124, 40, LAS_F - 124, rgbOf('#6a727e'));
    for (let y = 150; y < LAS_F; y += 60) b.hline(cx - 19, y, 38, rgbOf('#a8b0ba'));
    b.rect(cx - 22, LAS_F - 16, 44, 16, rgbOf('#5b636e'));
    b.hline(cx - 22, LAS_F - 16, 44, rgbOf(LP.steelHi));
  }
  // the jet-bridge doors, one per gate, with the number over each
  for (let g = 0; g < LAS_GATES.length; g++) {
    const G = LAS_GATES[g], dx = G.x + 70;
    if (dx + 60 < xa || dx > xb) continue;
    b.box(dx, 314, 60, LAS_F - 314, '#2a2f38', { tex: 'brushed', seed: g });
    b.ditherV(dx + 4, 318, 52, LAS_F - 318, ['#3a4250', '#1b1f26']);
    b.glass(dx + 6, 322, 20, 80, '#8ab0c8', 0.4, g, { band: 24 });
    b.rect(dx + 44, 360, 6, 10, rgbOf('#12141c')); b.put(dx + 46, 362, rgbOf('#6be585'));
    b.box(dx + 4, 290, 52, 22, '#1c2a4a', { tex: false });
  }
  lasFloor(b, xa, xb);
  for (let x = Math.floor(xa / 72) * 72 + 6; x < xb; x += 72) lasFloorStreak(b, x, 58, '#ffc890', 0.3);
}
const LAS_PAINT = { kerb: lasPaintKerb, lobby: lasPaintLobby, security: lasPaintSecurity, center: lasPaintCenter, gates: lasPaintGates };

// ---------- sprites: every object, drawn once, pixel by pixel ----------
// A Mexican fan palm in a concrete planter: diamond-cut bark, a skirt of dead
// fronds nobody has trimmed, and a crown of fans with ragged tips.
function lasPalm(v) {
  return texSprite('palm' + v, 110, 230, function (b) {
    const cx = 55, top = 58;
    for (let y = top; y < 206; y++) {
      const sway = Math.sin((y - top) * 0.018 + v) * 3 | 0, half = 4 + ((y - top) / 150) * 3 | 0;
      for (let x = -half; x <= half; x++) {
        const band = ((y + (x + half) * 2) % 8 < 4);
        const c = x < -half + 2 ? '#a88060' : x > half - 2 ? '#4a3424' : band ? '#8a6444' : '#6e4e34';
        b.put(cx + x + sway, y, rgbOf(c));
      }
    }
    // the skirt of old fronds
    for (let i = 0; i < 90; i++) {
      const a = (i / 90) * Math.PI - Math.PI, r = 16 + hash2(i, v, 190) * 12;
      for (let k = 0; k < r; k++) b.put(cx + Math.cos(a + 1.5) * k * 0.7, top + 8 + Math.abs(Math.sin(a)) * k, rgbOf(k > r * 0.7 ? '#6a4e30' : '#8a6a40'));
    }
    // the crown: fans radiating out, each a spray of pointed segments
    for (let f = 0; f < 14; f++) {
      const a = -Math.PI + (f / 13) * Math.PI + (hash2(f, v, 191) - 0.5) * 0.2, len = 34 + hash2(f, v, 192) * 14;
      for (let s = -3; s <= 3; s++) {
        const aa = a + s * 0.07;
        for (let k = 6; k < len - Math.abs(s) * 2; k++) {
          const droop = (k / len) * (k / len) * 16;
          const px0 = cx + Math.cos(aa) * k, py0 = top + Math.sin(aa) * k * 0.55 + droop;
          b.put(px0, py0, rgbOf(s === 0 ? '#9ac86a' : k > len * 0.75 ? '#3a6a3a' : (s + f) % 2 ? '#4f8a44' : '#63a452'));
        }
      }
    }
    // the planter: poured concrete, a lip, river rock on top
    b.box(22, 204, 66, 26, '#b8b0a2', { tex: 'concrete', seed: v });
    for (let i = 0; i < 40; i++) b.put(26 + hash2(i, 1, 193) * 58, 206 + hash2(i, 2, 193) * 3, rgbOf(i % 2 ? '#8a7a64' : '#d8ccb8'));
  });
}
function lasAgave() {
  return texSprite('agave', 56, 40, function (b) {
    for (let i = 0; i < 13; i++) {
      const a = -Math.PI + (i / 12) * Math.PI, len = 18 + (i % 3) * 5;
      for (let k = 0; k < len; k++) for (let t = -1; t <= 1; t++) b.put(28 + Math.cos(a) * k + t * (1 - k / len), 36 + Math.sin(a) * k * 0.9, rgbOf(t === 0 ? '#8ab8a0' : k > len - 3 ? '#c8a060' : '#5a8a78'));
    }
  });
}
// A curbside check-in podium: steel, a screen, a sign on a post
function lasCurbPodium(air) {
  return texSprite('curb|' + air.name, 90, 120, function (b) {
    b.box(40, 0, 5, 50, '#6a727e', { tex: 'brushed', ol: false });
    b.box(4, 2, 82, 22, air.col, { tex: false });
    b.box(22, 50, 46, 70, '#a8b0ba', { tex: 'brushed', seed: 3 });
    b.box(26, 56, 38, 22, '#12141c', { tex: false });
    b.ditherV(28, 58, 34, 18, [air.col, '#12141c']);
    b.rect(30, 86, 30, 4, rgbOf('#2a2f38'));
    b.rect(18, 50, 54, 4, rgbOf('#e6e0d4'));
  });
}
function lasKiosk(col) {
  return texSprite('kiosk|' + col, 40, 96, function (b) {
    b.box(4, 6, 32, 90, '#e8ecf0', { tex: false });
    b.ditherH(5, 7, 30, 88, ['#ffffff', '#e8ecf0', '#b8c0ca']);
    b.box(0, 0, 40, 10, col, { tex: false });
    b.box(8, 16, 24, 30, '#12141c', { tex: false });
    b.ditherV(10, 18, 20, 26, ['#2f5a9a', '#1c2a4a']);
    b.rect(12, 22, 16, 3, rgbOf('#e0b23c')); b.rect(12, 28, 10, 2, rgbOf('#cfe0ff')); b.rect(12, 32, 12, 2, rgbOf('#cfe0ff'));
    b.box(12, 38, 16, 5, '#6be585', { tex: false, ol: '#12141c' });
    b.rect(10, 54, 20, 3, rgbOf('#2a2f38'));
    b.box(12, 62, 16, 10, '#8a939e', { tex: 'brushed' });
    b.rect(14, 64, 12, 2, rgbOf('#12141c'));
    b.rect(6, 92, 28, 4, rgbOf('#5b636e'));
  });
}
// Retractable belt queue posts, two lines of them, belts navy with a stripe
function lasStanchions(w) {
  return texSprite('stan|' + w, w, 48, function (b) {
    for (let row = 0; row < 2; row++) {
      const y0 = row * 10;
      b.rect(0, y0 + 10, w, 4, rgbOf('#1c2a4a'));
      for (let x = 0; x < w; x += 12) b.rect(x, y0 + 11, 5, 2, rgbOf('#e8e6dc'));
      for (let x = 2; x < w; x += 58) {
        b.ditherH(x, y0 + 6, 6, 38 - y0, ['#f0f3f6', '#9aa3ae', '#5b636e']);
        b.rect(x - 2, y0 + 4, 10, 3, rgbOf('#d5dbe2'));
        b.rect(x - 4, 44, 14, 4, rgbOf('#3a414c'));
      }
    }
  });
}
// The CT scanner: the big beige box every bag in the country goes through
function lasCT() {
  return texSprite('ct', 190, 104, function (b) {
    b.box(8, 70, 174, 12, '#8a939e', { tex: 'brushed' });
    for (let x = 10; x < 180; x += 7) { b.rect(x, 72, 5, 3, rgbOf('#5b636e')); b.put(x + 1, 72, rgbOf('#d5dbe2')); }
    b.box(40, 8, 110, 74, '#d8d2c4', { tex: 'concrete', seed: 5 });
    b.ditherV(41, 9, 108, 72, ['#ece6d8', '#d8d2c4', '#b8b0a0']);
    b.box(56, 36, 78, 40, '#2a2d33', { tex: false });
    for (let x = 58; x < 132; x += 4) b.vline(x, 38, 36, rgbOf(x % 8 ? '#3a3e46' : '#1b1d22'));
    b.box(128, 14, 18, 14, '#12141c', { tex: false }); b.rect(130, 16, 14, 10, rgbOf('#1a4a3a'));
    b.hline(131, 18, 8, rgbOf('#6be585')); b.hline(131, 21, 11, rgbOf('#6be585'));
    b.rect(44, 12, 24, 4, rgbOf('#2f5a9a'));
    b.box(2, 82, 186, 22, '#5b636e', { tex: 'brushed' });
  });
}
function lasBodyScanner() {
  return texSprite('mmw', 96, 140, function (b) {
    b.box(6, 124, 84, 14, '#9aa3ae', { tex: 'brushed' });
    b.rect(30, 126, 10, 8, rgbOf('#f2c94c')); b.rect(54, 126, 10, 8, rgbOf('#f2c94c'));
    for (const sx of [6, 72]) {
      b.box(sx, 14, 18, 112, '#e8ecf0', { tex: false });
      b.ditherH(sx + 1, 15, 16, 110, ['#ffffff', '#c8d0da', '#8a939e']);
      b.glass(sx + 3, 30, 12, 80, '#8ab0c8', 0.5, sx, { band: 20 });
    }
    b.box(2, 4, 92, 14, '#d8dce2', { tex: 'brushed' });
    b.rect(38, 7, 20, 7, rgbOf('#12141c')); b.rect(40, 9, 16, 3, rgbOf('#6be585'));
  });
}
function lasTSAPodium() {
  return texSprite('tsapod', 48, 80, function (b) {
    b.box(6, 20, 36, 60, '#3a414c', { tex: 'brushed' });
    b.box(2, 16, 44, 8, '#e6e0d4', { tex: false });
    b.box(10, 4, 16, 12, '#12141c', { tex: false }); b.rect(12, 6, 12, 8, rgbOf('#2f5a9a'));
    b.rect(30, 8, 3, 8, rgbOf('#5b636e')); b.rect(27, 4, 9, 4, rgbOf('#f2c94c'));
    b.box(12, 34, 24, 16, '#1c2a4a', { tex: false });
  });
}
function lasDivest() {
  return texSprite('divest', 160, 64, function (b) {
    b.box(0, 34, 160, 8, '#c8ced6', { tex: 'brushed' });
    for (let x = 4; x < 156; x += 8) b.rect(x, 36, 5, 3, rgbOf('#8a939e'));
    b.rect(8, 42, 4, 22, rgbOf('#5b636e')); b.rect(148, 42, 4, 22, rgbOf('#5b636e')); b.rect(78, 42, 4, 22, rgbOf('#5b636e'));
    const stuff = [['#1b1b24', 12, 6], ['#8a6a44', 16, 8], ['#c8402c', 10, 7], ['#e8e2d4', 14, 5], ['#2f4a8a', 12, 9]];
    for (let i = 0; i < 4; i++) {
      const tx = 8 + i * 38;
      b.box(tx, 24, 34, 12, '#8a939e', { tex: false, ol: '#3a414c' });
      b.hline(tx + 1, 25, 32, rgbOf('#b8c0ca'));
      const s = stuff[i]; b.box(tx + 8, 24 - s[2], s[1], s[2], s[0], { tex: false });
    }
  });
}
function lasBinStack() {
  return texSprite('bins', 44, 60, function (b) {
    for (let i = 0; i < 6; i++) { b.box(2, 54 - i * 8, 40, 9, '#8a939e', { tex: false, ol: '#3a414c' }); b.hline(3, 55 - i * 8, 38, rgbOf('#b8c0ca')); }
    b.rect(4, 58, 36, 2, rgbOf('#2a2f38'));
  });
}
// A row of gate seating: black upholstery on a steel beam, power at every arm
function lasSeatRow(n) {
  return texSprite('seats|' + n, n * 42 + 8, 70, function (b) {
    b.box(0, 44, n * 42 + 8, 6, '#8a939e', { tex: 'brushed' });
    for (let i = 0; i < n; i++) {
      const sx = 4 + i * 42;
      b.box(sx, 30, 36, 16, '#2a2d38', { tex: false });
      b.ditherV(sx + 1, 31, 34, 14, ['#4a5064', '#2a2d38']);
      b.box(sx + 2, 0, 32, 32, '#2a2d38', { tex: false });
      b.ditherV(sx + 3, 1, 30, 30, ['#4a5064', '#343846', '#23262f']);
      for (let y = 6; y < 30; y += 8) b.hline(sx + 4, y, 28, rgbOf('#1b1d24'));
      b.box(sx + 36, 18, 5, 26, '#9aa3ae', { tex: 'brushed' });
      b.rect(sx + 37, 26, 3, 3, rgbOf('#12141c')); b.put(sx + 38, 27, rgbOf('#6be585'));
    }
    b.rect(8, 50, 5, 20, rgbOf('#5b636e')); b.rect(n * 42 - 6, 50, 5, 20, rgbOf('#5b636e'));
    b.rect(2, 66, 18, 4, rgbOf('#3a414c')); b.rect(n * 42 - 12, 66, 18, 4, rgbOf('#3a414c'));
  });
}
function lasGatePodium() {
  return texSprite('gatepod', 130, 80, function (b) {
    b.box(0, 30, 130, 50, '#3a414c', { tex: 'brushed', seed: 9 });
    b.box(-2, 26, 134, 8, '#e6e0d4', { tex: false });
    for (let i = 0; i < 2; i++) {
      const sx = 16 + i * 66;
      b.box(sx, 4, 34, 24, '#12141c', { tex: false });
      b.ditherV(sx + 2, 6, 30, 20, ['#1c3a6a', '#12203a']);
    }
    b.box(10, 44, 110, 22, '#1c2a4a', { tex: false });
  });
}
function lasBinPair() {
  return texSprite('binpair', 70, 60, function (b) {
    const one = function (x, col, lid) {
      b.box(x, 12, 30, 48, col, { tex: 'brushed' });
      b.box(x - 2, 6, 34, 9, lid, { tex: false });
      b.rect(x + 8, 9, 14, 3, rgbOf('#12141c'));
    };
    one(2, '#5b636e', '#3a414c'); one(38, '#2f5a9a', '#1c2a4a');
    b.rect(44, 30, 18, 12, rgbOf('#f4f1ea')); b.rect(48, 33, 10, 6, rgbOf('#2f5a9a'));
  });
}
function lasFiller() {
  return texSprite('filler', 44, 96, function (b) {
    b.box(6, 0, 32, 96, '#c8ced6', { tex: 'brushed' });
    b.box(10, 8, 24, 14, '#12141c', { tex: false }); b.rect(12, 12, 20, 6, rgbOf('#1a4a3a'));
    b.rect(14, 14, 16, 2, rgbOf('#6be585'));
    b.box(12, 30, 20, 30, '#8a939e', { tex: false });
    b.rect(20, 32, 4, 6, rgbOf('#d5dbe2'));
    b.box(0, 66, 44, 10, '#9aa3ae', { tex: 'brushed' });
    b.rect(16, 70, 12, 3, rgbOf('#12141c'));
  });
}
function lasChargePost() {
  return texSprite('charge', 32, 100, function (b) {
    b.box(6, 0, 20, 100, '#2a2f38', { tex: 'brushed' });
    b.box(2, 0, 28, 10, '#e0b23c', { tex: false });
    for (let i = 0; i < 4; i++) { b.box(9, 18 + i * 16, 14, 10, '#12141c', { tex: false }); b.put(15, 22 + i * 16, rgbOf(i < 3 ? '#6be585' : '#5b636e')); }
  });
}
function lasCase() {
  return texSprite('case', 140, 120, function (b) {
    b.box(0, 80, 140, 40, '#3a2e24', { tex: 'brushed', seed: 4 });
    b.box(4, 6, 132, 76, '#1b2230', { tex: false });
    b.ditherV(6, 8, 128, 72, ['#2a3a52', '#1b2230']);
    // a silver model of an old airliner, the kind that flew here in 1960
    for (let x = 30; x < 110; x++) { b.put(x, 44, rgbOf('#d5dbe2')); b.put(x, 45, rgbOf('#b8c0ca')); b.put(x, 46, rgbOf('#8a939e')); }
    for (let i = 0; i < 22; i++) b.hline(58 + i, 47 + i * 0.4, 30 - i, rgbOf('#b8c0ca'));
    for (let y = 30; y < 44; y++) b.put(104 + (44 - y) * 0.4, y, rgbOf('#c8402c'));
    b.rect(66, 46, 4, 20, rgbOf('#5b636e')); b.rect(58, 64, 20, 3, rgbOf('#5b636e'));
    b.glass(6, 8, 128, 72, '#cfe8ff', 0.18, 2, { band: 50 });
    b.frame(4, 6, 132, 76, rgbOf('#c8a454'));
  });
}
// A slot cabinet: the body is baked, the screen and the lights are live
function lasSlotCabinet(col) {
  return texSprite('slot|' + col, 52, 124, function (b) {
    const C = rgbOf(col);
    b.box(4, 30, 44, 94, col, { tex: false });
    b.ditherH(5, 31, 42, 92, [shadeRGB(C, 1.35), C, shadeRGB(C, 0.6)]);
    b.box(0, 0, 52, 32, '#12141c', { tex: false });
    b.ditherV(2, 2, 48, 28, [shadeRGB(C, 1.5), shadeRGB(C, 0.8)]);
    b.box(8, 38, 36, 30, '#0a0a10', { tex: false });              // the reel window, filled live
    b.box(6, 74, 40, 12, '#2a2d38', { tex: false });
    for (let i = 0; i < 4; i++) b.rect(9 + i * 9, 77, 6, 6, rgbOf(['#e8503a', '#f2c94c', '#6be585', '#4a86f7'][i]));
    b.box(10, 92, 32, 10, '#8a939e', { tex: 'brushed' });
    b.rect(16, 95, 20, 3, rgbOf('#12141c'));
    b.box(2, 112, 48, 12, '#1b1d24', { tex: false });
    b.rect(48, 44, 4, 30, rgbOf('#9aa3ae'));                        // the arm
    b.box(46, 38, 8, 8, '#c8402c', { tex: false });
  });
}
// ---------- vehicles on the kerb road, textured, lit ----------
function lasVehicle(kind) {
  return texSprite('veh|' + kind, kind === 'limo' ? 200 : kind === 'bus' ? 220 : 136, 64, function (b) {
    const w = kind === 'limo' ? 200 : kind === 'bus' ? 220 : 136;
    const body = kind === 'taxi' ? '#f2c230' : kind === 'limo' ? '#15151c' : kind === 'bus' ? '#eef1f5' : '#8a1c1c';
    const C = rgbOf(body);
    const roofY = kind === 'bus' ? 4 : 18, beltY = kind === 'bus' ? 34 : 32;
    // lower body
    b.box(2, beltY, w - 4, 22, body, { tex: false });
    b.ditherV(3, beltY + 1, w - 6, 20, [shadeRGB(C, 1.25), C, shadeRGB(C, 0.62)]);
    // cabin
    if (kind === 'bus') { b.box(4, roofY, w - 8, beltY - roofY + 2, body, { tex: false }); b.ditherV(5, roofY + 1, w - 10, beltY - roofY, [shadeRGB(C, 1.1), C]); }
    else { b.box(w * 0.2, roofY, w * 0.56, beltY - roofY + 2, body, { tex: false }); b.ditherV(w * 0.2 + 1, roofY + 1, w * 0.56 - 2, beltY - roofY, [shadeRGB(C, 1.3), C]); }
    // glass, reflecting the canopy lights
    const gx0 = kind === 'bus' ? 10 : w * 0.24, gx1 = kind === 'bus' ? w - 12 : w * 0.72, gy = roofY + 4;
    for (let x = gx0 | 0; x < gx1; x++) for (let y = gy; y < beltY - 2; y++) {
      const edge = (x - gx0) % (kind === 'bus' ? 26 : 40) < 2;
      b.put(x, y, rgbOf(edge ? '#12141c' : (x + y * 0.6) % 22 < 4 ? '#b8d8f0' : '#2a3a52'));
    }
    if (kind === 'taxi') { b.box(w * 0.4, roofY - 8, 30, 8, '#f4f1ea', { tex: false }); b.rect(w * 0.4 + 4, roofY - 6, 22, 4, rgbOf('#c8402c')); }
    if (kind === 'limo') for (let x = 20; x < w - 20; x += 3) b.put(x, beltY + 8, rgbOf('#5a5a6a'));
    // wheels with hubcaps
    for (const wx of kind === 'bus' ? [34, w - 40] : [w * 0.2, w * 0.8]) {
      for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) {
        const d = x * x + y * y; if (d > 81) continue;
        b.put(wx + x, 54 + y, rgbOf(d < 16 ? '#b8c0ca' : d < 25 ? '#6a727e' : '#1b1b22'));
      }
    }
    b.rect(w - 8, beltY + 4, 5, 5, rgbOf('#fff2c0')); b.rect(3, beltY + 4, 4, 5, rgbOf('#e8403a'));
  });
}
// a foreground planter: nearer than you, so it is drawn last
function lasPlanter() {
  return texSprite('planter', 110, 50, function (b) {
    b.box(4, 22, 102, 28, '#b8b0a2', { tex: 'concrete', seed: 3 });
    b.hline(5, 23, 100, rgbOf('#d8d2c6'));
    for (let i = 0; i < 26; i++) {
      const x = 10 + i * 3.6, h = 8 + hash2(i, 1, 194) * 16;
      for (let k = 0; k < h; k++) b.put(x + Math.sin(k * 0.3 + i) * 2, 22 - k, rgbOf(k > h - 3 ? '#9ac86a' : i % 2 ? '#3f7a3a' : '#5a9a48'));
    }
  });
}

// ---------- dressing the tiles ----------
const LAS_AIRLINES = [
  { name: 'DRAGON FLY', col: '#1c2a4a', acc: '#e0b23c', logo: 'plane' },
  { name: 'HIVE AIR', col: '#8a1c14', acc: '#f4f1ea', logo: 'star' },
  { name: 'MOTHWAYS', col: '#1f4f3a', acc: '#9ae8b0', logo: 'leaf' },
  { name: 'JETBUG', col: '#2f4a8a', acc: '#8ad8ff', logo: 'bolt' },
];
const LAS_WALKWAYS = [{ x0: 6470, x1: 7000 }, { x0: 8200, x1: 8720 }];
const LAS_SLOTS = [
  { x: 4340, n: 5, cols: ['#8a1c3a', '#2a3a8a', '#6a1c8a', '#1c6a4a', '#8a5a1c'] },
  { x: 7650, n: 4, cols: ['#1c4a8a', '#8a1c1c', '#5a1c7a', '#1c6a6a'] },
];
function lasOnWalkway(x) { for (let i = 0; i < LAS_WALKWAYS.length; i++) if (x > LAS_WALKWAYS[i].x0 && x < LAS_WALKWAYS[i].x1) return true; return false; }
function lasInSlots(x0, x1) { for (let i = 0; i < LAS_SLOTS.length; i++) { const s = LAS_SLOTS[i]; if (x1 > s.x - 10 && x0 < s.x + s.n * 54 + 10) return true; } return false; }
// a hanging wayfinding sign: charcoal panel, yellow for gates, white for the rest
function lasSign(ctx, x, y, text, opts) {
  const o = opts || {}, sc = o.scale || 2, tw = textWidth(text, { scale: sc }) + (o.arrow ? 34 : 18), h = sc * 7 + 12;
  const px0 = Math.round(x - tw / 2);
  ctx.drawImage(texSprite('sign|' + tw + '|' + h, tw, h, function (b) {
    b.box(0, 0, tw, h, '#23262e', { tex: 'brushed', seed: tw });
    b.hline(1, 1, tw - 2, rgbOf('#4a505c'));
  }), px0, y);
  rect(ctx, x - 1, y - 18, 2, 18, '#6a727e');
  rect(ctx, px0 + 4, y - 18, 2, 18, '#6a727e'); rect(ctx, px0 + tw - 6, y - 18, 2, 18, '#6a727e');
  const col = o.col || '#f2c94c';
  drawText(ctx, text, px0 + 9, y + 6, col, { scale: sc });
  if (o.arrow) {
    ctx.fillStyle = col; const ax = px0 + tw - 16, ay = y + h / 2, d = o.arrow;
    ctx.beginPath(); ctx.moveTo(ax + d * 7, ay); ctx.lineTo(ax - d * 3, ay - 7); ctx.lineTo(ax - d * 3, ay - 3); ctx.lineTo(ax - d * 8, ay - 3); ctx.lineTo(ax - d * 8, ay + 3); ctx.lineTo(ax - d * 3, ay + 3); ctx.lineTo(ax - d * 3, ay + 7); ctx.fill();
  }
}
function lasDecorate(ctx, x0, x1) {
  const inR = function (a, bw) { return a + bw > x0 - 40 && a < x1 + 40; };
  // ---- kerb
  if (x0 < 1200) {
    for (let x = 90; x < 1150; x += 600) if (inR(x, 400)) { drawText(ctx, 'TERMINAL 3', x + 1, 87, '#8a939e', { scale: 4 }); drawText(ctx, 'TERMINAL 3', x, 86, '#1c2a4a', { scale: 4 }); }
    for (let k = 0; k < 4; k++) { const dx = 230 + k * 290; if (inR(dx, 110)) drawText(ctx, 'DEPARTURES', dx + 55, 286, '#f2c94c', { align: 'center', scale: 1 }); }
    const palms = [[80, 0], [720, 1], [1110, 2]];
    for (let i = 0; i < palms.length; i++) if (inR(palms[i][0] - 55, 110)) ctx.drawImage(lasPalm(palms[i][1]), palms[i][0] - 55, LAS_F - 226);
    for (const ax of [150, 660, 780]) if (inR(ax - 28, 56)) ctx.drawImage(lasAgave(), ax - 28, LAS_F - 38);
    const pods = [[430, 0], [1010, 1]];
    for (let i = 0; i < pods.length; i++) {
      const px0 = pods[i][0], A = LAS_AIRLINES[pods[i][1]];
      if (!inR(px0 - 45, 90)) continue;
      ctx.drawImage(lasCurbPodium(A), px0 - 45, LAS_F - 120);
      drawText(ctx, A.name, px0, LAS_F - 113, A.acc, { align: 'center', font: 'small' });
      drawText(ctx, 'CURBSIDE', px0, LAS_F - 60, '#cfe0ff', { align: 'center', font: 'small' });
    }
  }
  // ---- lobby
  if (x1 > 1150 && x0 < 3300) {
    for (let k = 0; k < 4; k++) {
      const ix = 1330 + k * 480, A = LAS_AIRLINES[k];
      if (!inR(ix, 380)) continue;
      brandLogo(ctx, ix + 22, 257, 8, { logo: A.logo, col: A.acc, col2: A.col }, 0);
      drawText(ctx, A.name, ix + 38, 251, A.acc, { scale: 2 });
      drawText(ctx, 'CHECK-IN ' + String.fromCharCode(65 + k * 2) + ' - ' + String.fromCharCode(66 + k * 2), ix + 372, 253, '#cfe0ff', { align: 'right', font: 'small' });
    }
    const kiosks = [1180, 1224, 1268, 1722, 1766, 2202, 2246, 2682, 2726, 3160, 3204];
    for (let i = 0; i < kiosks.length; i++) if (inR(kiosks[i], 40)) ctx.drawImage(lasKiosk(LAS_AIRLINES[i % 4].col), kiosks[i], LAS_F - 96);
    if (inR(1700, 300)) lasSign(ctx, 1850, 138, 'TICKETING', { col: '#ffffff' });
    if (inR(2900, 300)) lasSign(ctx, 3050, 138, 'SECURITY  E GATES', { arrow: 1 });
  }
  // ---- security
  if (x1 > 3250 && x0 < 4320) {
    if (inR(3300, 800)) { drawText(ctx, 'SECURITY CHECKPOINT', 3470, 180, '#ffffff', { scale: 2 }); drawText(ctx, 'ALL PASSENGERS AND BAGS MUST BE SCREENED', 3900, 183, '#9ab0d8', { font: 'small' }); }
    if (inR(3260, 230)) {
      ctx.drawImage(lasStanchions(220), 3262, LAS_F - 46);
      ctx.drawImage(texSprite('waitled', 110, 34, function (b) { b.box(0, 0, 110, 34, '#12141c', { tex: false, ol: '#3a414c' }); }), 3300, 216);
      drawText(ctx, 'WAIT TIME', 3355, 222, '#f2a03a', { align: 'center', font: 'small' });
      drawText(ctx, '12 MIN', 3355, 232, '#6be585', { align: 'center', scale: 2 });
    }
    if (inR(3500, 50)) ctx.drawImage(lasTSAPodium(), 3500, LAS_F - 80);
    if (inR(3570, 160)) ctx.drawImage(lasDivest(), 3570, LAS_F - 64);
    if (inR(3730, 190)) { ctx.drawImage(lasCT(), 3730, LAS_F - 104); drawText(ctx, 'CT', 3830, LAS_F - 92, '#1c2a4a', { align: 'center', scale: 2 }); }
    if (inR(3930, 44)) ctx.drawImage(lasBinStack(), 3930, LAS_F - 60);
    if (inR(3990, 96)) ctx.drawImage(lasBodyScanner(), 3990, LAS_F - 140);
    if (inR(4110, 140)) ctx.drawImage(lasSeatRow(3), 4110, LAS_F - 70);
    if (inR(4150, 200)) lasSign(ctx, 4200, 180, 'E GATES', { arrow: 1 });
  }
  // ---- the centre
  if (x1 > 4300 && x0 < 5660) {
    for (let i = 0; i < LAS_STORES.length; i++) {
      const s = LAS_STORES[i]; if (!inR(s.x, s.w)) continue;
      drawText(ctx, s.name, s.x + s.w / 2, 222, s.acc, { align: 'center', scale: 2, outline: darken(s.col, 0.4) });
      drawText(ctx, s.sub, s.x + s.w / 2, 242, withAlpha(s.acc, 0.8), { align: 'center', font: 'small' });
    }
    if (inR(5270, 160)) {
      drawText(ctx, 'RESTROOMS', 5350, 226, '#1c2a4a', { align: 'center', scale: 2 });
      for (let k = 0; k < 2; k++) { const px0 = 5328 + k * 44; circle(ctx, px0, 250, 4, '#1c2a4a'); rect(ctx, px0 - 4, 256, 8, 14, '#1c2a4a'); if (k) { ctx.fillStyle = '#1c2a4a'; ctx.beginPath(); ctx.moveTo(px0 - 7, 270); ctx.lineTo(px0 + 7, 270); ctx.lineTo(px0, 256); ctx.fill(); } }
    }
    if (inR(5440, 210)) { drawText(ctx, 'THE DESERT AT NIGHT', 5545, 432, '#c8b890', { align: 'center', font: 'small' }); for (let i = 0; i < 30; i++) px(ctx, 5445 + hash2(i, 1, 200) * 200, 230 + hash2(i, 2, 200) * 60, '#fff8e0'); }
    if (inR(5450, 300)) lasSign(ctx, 5560, 138, 'GATES E1 - E15', { arrow: 1 });
  }
  // ---- the gates
  if (x1 > 5650) {
    for (let g = 0; g < LAS_GATES.length; g++) {
      const G = LAS_GATES[g];
      if (!inR(G.x - 150, 320)) continue;
      drawText(ctx, G.name, G.x + 100, 295, '#f2c94c', { align: 'center', scale: 2 });
      lasSign(ctx, G.x + 100, 138, 'GATE ' + G.name, {});
      // the holdroom: seats unless a walkway or a slot bank has the floor
      const sx = G.x - 132;
      if (!lasOnWalkway(sx + 90) && !lasInSlots(sx, sx + 180)) ctx.drawImage(lasSeatRow(4), sx, LAS_F - 70);
      if (!lasOnWalkway(G.x + 110) && !lasInSlots(G.x + 40, G.x + 170)) ctx.drawImage(lasGatePodium(), G.x + 42, LAS_F - 80);
      if (g % 3 === 1 && !lasOnWalkway(G.x - 140)) ctx.drawImage(lasBinPair(), G.x - 206, LAS_F - 60);
      if (g % 4 === 2 && !lasOnWalkway(G.x - 170)) ctx.drawImage(lasFiller(), G.x - 190, LAS_F - 96);
      if (g % 3 === 0 && g > 0 && !lasOnWalkway(G.x + 20)) ctx.drawImage(lasChargePost(), G.x + 10, LAS_F - 100);
    }
    if (inR(5700, 150)) { ctx.drawImage(lasCase(), 5700, LAS_F - 120); drawText(ctx, 'LAS VEGAS, 1960', 5770, LAS_F - 34, '#e0c888', { align: 'center', font: 'small' }); }
  }
}

// ---------- live layers, drawn every frame ----------
// Dichroic glass: panels hung on cables in front of the window wall that
// change colour as you move past them, because that is what dichroic glass does.
function lasDichroic(ctx, S, t) {
  const cx = S.cam.x;
  for (let i = 0; i < 9; i++) {
    const x = 1240 + i * 220, y = 150 + (i % 3) * 26, w = 34, h = 130 + (i % 2) * 40;
    if (!S.cam.visible(x, 80)) continue;
    rect(ctx, x + w / 2, 126, 1, y - 126, '#5b636e');
    const hue = ((x - cx * 1.6) * 0.004 + t * 0.05) % 1;
    const cols = [
      rgbToHex.apply(null, hslToRgb(hue, 0.9, 0.62)),
      rgbToHex.apply(null, hslToRgb(hue + 0.18, 0.9, 0.55)),
      rgbToHex.apply(null, hslToRgb(hue + 0.36, 0.85, 0.5)),
    ];
    ctx.drawImage(texSprite('dich|' + (i % 2), w, h, function (b) { b.frame(0, 0, w, h, rgbOf('#9aa3ae')); }), x, y);
    ctx.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) rect(ctx, x + 1, y + 1 + k * ((h - 2) / 3), w - 2, Math.ceil((h - 2) / 3), cols[k]);
    ctx.globalAlpha = 0.35; rect(ctx, x + 3, y + 3, 4, h - 6, '#ffffff'); ctx.globalAlpha = 1;
    // and the colour it throws on the floor
    ctx.globalAlpha = 0.12; rect(ctx, x - 10, LAS_F + 6, w + 20, 18, cols[1]); ctx.globalAlpha = 1;
  }
}
// The departures board over the centre: split-flap rows that genuinely flip.
function lasFids(ctx, x, y, t) {
  ctx.drawImage(texSprite('fids', 260, 86, function (b) { b.box(0, 0, 260, 86, '#0a0c12', { tex: false, ol: '#3a414c' }); b.hline(1, 1, 258, rgbOf('#2a2f38')); }), x, y);
  drawText(ctx, 'DEPARTURES', x + 8, y + 5, '#f2a03a');
  drawText(ctx, 'GATE', x + 250, y + 5, '#f2a03a', { align: 'right' });
  const rows = [['DF 0808', 'TOKYO NARITA', 'E12', 'BOARDING'], ['HA 0019', 'HONOLULU', 'E7', 'ON TIME'], ['MW 0442', 'LONDON LHR', 'E3', 'ON TIME'],
    ['JB 1170', 'MEXICO CITY', 'E9', 'DELAYED'], ['HA 0233', 'SEOUL ICN', 'E14', 'ON TIME'], ['DF 0911', 'TAIPEI', 'E1', 'GATE OPEN']];
  for (let i = 0; i < rows.length; i++) {
    const ry = y + 18 + i * 11, R = rows[i], flip = ((t * 0.4 + i * 0.83) % 7) < 0.3;
    if (flip) { for (let k = 0; k < 14; k++) rect(ctx, x + 60 + k * 8, ry, 6, 7, k % 2 ? '#2a2f38' : '#3a414c'); continue; }
    drawText(ctx, R[0], x + 8, ry, '#cfd6de', { font: 'small' });
    drawText(ctx, R[1], x + 60, ry, '#f2c94c', { font: 'small' });
    drawText(ctx, R[3], x + 196, ry, R[3] === 'DELAYED' ? '#ff6a5a' : R[3] === 'BOARDING' ? '#6be585' : '#cfd6de', { align: 'right', font: 'small' });
    drawText(ctx, R[2], x + 250, ry, '#6be585', { align: 'right', font: 'small' });
  }
}
const SLOT_SYM = ['7', 'BAR', 'BUG', 'BELL', 'CHERRY'];
function lasSlotSymbol(ctx, x, y, k, s) {
  switch (SLOT_SYM[k % SLOT_SYM.length]) {
    case '7': drawText(ctx, '7', x, y - 7 * s / 2, '#e8303a', { align: 'center', scale: s, outline: '#5a0a10' }); break;
    case 'BAR': rect(ctx, x - 5 * s, y - 2 * s, 10 * s, 4 * s, '#12141c'); drawText(ctx, 'BAR', x, y - 1.5 * s, '#f4f1ea', { align: 'center', scale: Math.max(1, s - 1) }); break;
    case 'BUG': ellipsePx(ctx, x, y, 3 * s, 3.5 * s, '#d8382e'); rect(ctx, x - 0.5, y - 3.5 * s, 1, 7 * s, '#1b0a12'); px(ctx, x - s, y - s, '#1b0a12'); px(ctx, x + s, y + s, '#1b0a12'); break;
    case 'BELL': ellipsePx(ctx, x, y, 3 * s, 3 * s, '#f2c94c'); rect(ctx, x - 3 * s, y + 2 * s, 6 * s, s, '#c8903a'); break;
    default: circle(ctx, x - s, y + s, 2 * s, '#c8202a'); circle(ctx, x + 2 * s, y + s, 2 * s, '#c8202a'); line(ctx, x, y - 3 * s, x + s, y - s, '#2f8a3a');
  }
}
function lasSlots(ctx, S, t) {
  for (let b = 0; b < LAS_SLOTS.length; b++) {
    const B = LAS_SLOTS[b];
    if (!S.cam.visible(B.x, 300)) continue;
    for (let i = 0; i < B.n; i++) {
      const x = B.x + i * 54, y = LAS_F - 124;
      ctx.drawImage(lasSlotCabinet(B.cols[i]), x, y);
      // the topper, lit, cycling
      const on = Math.floor(t * 3 + i) % 3;
      drawText(ctx, i % 2 ? 'LUCKY' : 'JACKPOT', x + 26, y + 11, ['#ffd24a', '#ffffff', '#ff8ad8'][on], { align: 'center', font: 'small' });
      for (let k = 0; k < 6; k++) px(ctx, x + 4 + k * 8, y + 2, (Math.floor(t * 8) + k + i) % 3 === 0 ? '#ffffff' : '#ffd24a');
      // three reels, idling, with the win line
      for (let r = 0; r < 3; r++) {
        const rx = x + 14 + r * 12, sym = Math.floor(t * 0.5 + i * 3 + r * 2) % SLOT_SYM.length;
        rect(ctx, rx - 5, y + 40, 10, 26, '#f4f1ea');
        lasSlotSymbol(ctx, rx, y + 53, sym, 1);
      }
      rect(ctx, x + 8, y + 52, 36, 1, '#e8303a');
      ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 4 + i); rect(ctx, x - 4, LAS_F + 2, 60, 14, B.cols[i]); ctx.globalAlpha = 1;
    }
  }
}
// Moving walkways, seen from the concourse: the far balustrade behind the
// people riding, the pallets they stand on, and a low glass side in front.
// The rubber handrail loops round a rounded steel newel at each end.
function lasNewel(b, x0, y0, h, right) {
  const R = 14;
  for (let j = 0; j < h; j++) for (let i = 0; i < 22; i++) {
    const ii = right ? 21 - i : i;                  // ii grows away from the outer edge
    let inside = true, d = 0;
    if (ii < R && j < R) { d = Math.hypot(R - ii, R - j); inside = d <= R; }
    if (!inside) continue;
    const rim = (ii < R && j < R) ? d > R - 4 : (j < 4 || ii < 4);
    let c;
    if (rim) c = (d > R - 1.5 || (j < 1 && ii >= R) || (ii < 1 && j >= R)) ? rgbOf('#4a525e') : rgbOf('#1b1f26');
    else { const k = 0.86 + hash2(0, j, 41) * 0.16 + (hash2(ii, j, 42) - 0.5) * 0.05; c = shadeRGB(rgbOf(j > h - 8 ? '#6a727e' : '#b8c0ca'), k); }
    b.put(x0 + i, y0 + j, c);
  }
  // the comb-plate warning stripe down the newel's inner face
  for (let j = h - 7; j < h - 1; j++) b.put(right ? x0 + 2 : x0 + 19, y0 + j, rgbOf(j % 2 ? '#e0b23c' : '#1b1f26'));
}
function lasWalkFar(w) {
  return texSprite('walkfar|' + w, w, 48, function (b) {
    b.box(8, 30, w - 16, 16, '#8a939e', { tex: 'brushed', seed: 31, ol: '#2a2f38' });
    b.hline(9, 31, w - 18, rgbOf('#d4dae2'));
    for (let x = 40; x < w - 30; x += 48) { b.rect(x, 36, 6, 2, rgbOf('#5b636e')); b.put(x + 2, 36, rgbOf('#c8ced6')); }
    b.glass(12, 8, w - 24, 22, '#9ac0d8', 0.28, 7, { band: 46, slope: 0.7 });
    for (let x = 60; x < w - 40; x += 96) { b.rect(x, 26, 5, 4, rgbOf('#5b636e')); b.rect(x, 7, 5, 3, rgbOf('#5b636e')); }
    b.rect(14, 3, w - 28, 5, rgbOf('#1b1f26')); b.hline(14, 3, w - 28, rgbOf('#4a525e')); b.hline(14, 7, w - 28, rgbOf('#0e1014'));
    lasNewel(b, 0, 2, 44, false); lasNewel(b, w - 22, 2, 44, true);
  });
}
function lasWalkNear(w) {
  return texSprite('walknear|' + w, w, 40, function (b) {
    b.box(8, 26, w - 16, 14, '#7a828e', { tex: 'brushed', seed: 33, ol: '#1b1f26' });
    b.hline(9, 27, w - 18, rgbOf('#c8ced6'));
    b.glass(12, 6, w - 24, 20, '#b8d8f0', 0.14, 9, { band: 58, slope: 0.8 });
    for (let x = 12; x < w - 12; x += 120) b.vline(x, 6, 20, rgbOf('#8a939e'), 150);
    b.rect(14, 1, w - 28, 5, rgbOf('#1b1f26')); b.hline(14, 1, w - 28, rgbOf('#5b636e')); b.hline(14, 5, w - 28, rgbOf('#0e1014'));
    lasNewel(b, 0, 0, 40, false); lasNewel(b, w - 22, 0, 40, true);
  });
}
function lasWalkTread(w) {
  return texSprite('walktread|' + w, w, 22, function (b) {
    for (let j = 0; j < 22; j++) for (let i = 0; i < w; i++) {
      let c = rgbOf(j % 2 ? '#2c3038' : '#3e434c');
      if (j < 2 || j > 19) c = rgbOf(((i >> 3) + (j < 2 ? 0 : 1)) % 2 ? '#e0b23c' : '#c89a28');
      b.put(i, j, shadeRGB(c, 0.94 + hash2(i, j, 51) * 0.1));
    }
    // the comb plates at each end, teeth pointing into the pallets
    for (const cx of [0, w - 20]) {
      b.box(cx, 0, 20, 22, '#c8ced6', { tex: 'brushed', seed: 52, ol: '#5b636e' });
      for (let j = 2; j < 20; j += 2) b.put(cx ? cx : cx + 19, j, rgbOf('#e0b23c'));
    }
  });
}
function lasWalkways(ctx, S, t) {
  for (let i = 0; i < LAS_WALKWAYS.length; i++) {
    const K = LAS_WALKWAYS[i], w = K.x1 - K.x0;
    if (!S.cam.visible(K.x0 + w / 2, w / 2 + 60)) continue;
    ctx.drawImage(lasWalkFar(w), K.x0, LAS_F - 46);
    // the handrail runs with the pallets: little light ticks sliding along
    const off = (t * 64) % 32;
    for (let x = 16 + off; x < w - 16; x += 32) rect(ctx, K.x0 + x, LAS_F - 43, 5, 1, '#5b636e');
    ctx.drawImage(lasWalkTread(w - 12), K.x0 + 6, LAS_F - 2);
    // the pallet seams moving under your feet
    const po = (t * 64) % 14;
    for (let x = 22 + po; x < w - 32; x += 14) { rect(ctx, K.x0 + 6 + x, LAS_F, 1, 18, '#15181e'); rect(ctx, K.x0 + 7 + x, LAS_F, 1, 18, '#555b66'); }
    // entry sign on each end: a lit pictogram box on a short post
    for (const e of [0, 1]) {
      const sx = e ? K.x1 - 12 : K.x0 + 12;
      rect(ctx, sx - 1, LAS_F - 70, 2, 24, '#5b636e');
      ctx.drawImage(texSprite('walksign', 26, 18, function (b) {
        b.box(0, 0, 26, 18, '#1c2a4a', { tex: false });
        b.rect(2, 2, 22, 14, rgbOf('#f2c94c'));
        b.rect(6, 4, 3, 3, rgbOf('#1b1f26')); b.rect(5, 7, 5, 5, rgbOf('#1b1f26')); b.rect(5, 12, 2, 3, rgbOf('#1b1f26')); b.rect(8, 12, 2, 3, rgbOf('#1b1f26'));
        b.rect(12, 8, 8, 2, rgbOf('#1b1f26')); b.rect(18, 6, 2, 6, rgbOf('#1b1f26')); b.rect(20, 7, 1, 4, rgbOf('#1b1f26'));
        b.hline(3, 14, 20, rgbOf('#1b1f26'));
      }), sx - 13, LAS_F - 88);
    }
  }
}
// the near side of each walkway, drawn in front of whoever is riding it
function lasWalkwaysNear(ctx, S, t) {
  for (let i = 0; i < LAS_WALKWAYS.length; i++) {
    const K = LAS_WALKWAYS[i], w = K.x1 - K.x0;
    if (!S.cam.visible(K.x0 + w / 2, w / 2 + 60)) continue;
    ctx.drawImage(lasWalkNear(w), K.x0, LAS_F - 18);
    const off = (t * 64) % 32;
    for (let x = 16 + off; x < w - 16; x += 32) rect(ctx, K.x0 + x, LAS_F - 17, 5, 1, '#6a727e');
  }
}
function lasGateScreens(ctx, S, t) {
  for (let g = 0; g < LAS_GATES.length; g++) {
    const G = LAS_GATES[g], x = G.x + 42;
    if (!S.cam.visible(x, 150) || lasOnWalkway(G.x + 110) || lasInSlots(G.x + 40, G.x + 170)) continue;
    const mine = G.name === LAS_MY_GATE;
    const dest = mine ? 'TOKYO NRT' : ['HONOLULU', 'LONDON', 'SEOUL', 'MEXICO', 'TAIPEI', 'SYDNEY', 'PARIS'][g % 7];
    drawText(ctx, G.name, x + 33, LAS_F - 73, '#f2c94c', { align: 'center', font: 'small' });
    drawText(ctx, mine ? 'DF0808' : 'HA' + (100 + g * 7), x + 99, LAS_F - 73, '#ffffff', { align: 'center', font: 'small' });
    drawText(ctx, dest, x + 33, LAS_F - 64, '#cfe0ff', { align: 'center', font: 'small' });
    const st = mine ? (S.T && S.T.boarding ? 'BOARDING' : 'ON TIME') : (g % 5 === 2 ? 'DELAYED' : 'ON TIME');
    ctx.globalAlpha = st === 'BOARDING' ? 0.6 + 0.4 * Math.sin(t * 5) : 1;
    drawText(ctx, st, x + 99, LAS_F - 64, st === 'DELAYED' ? '#ff6a5a' : '#6be585', { align: 'center', font: 'small' });
    ctx.globalAlpha = 1;
    drawText(ctx, 'GATE ' + G.name, x + 65, LAS_F - 30, '#f2c94c', { align: 'center', scale: 1 });
  }
}
// Behind the glass: the aircraft at their gates, with the jet bridges out to them.
const LAS_PARKED = [{ gate: 'E2', liv: 'hive' }, { gate: 'E5', liv: 'jet' }, { gate: 'E8', liv: 'moth' }, { gate: 'E12', liv: 'df' }, { gate: 'E15', liv: 'hive' }];
function lasApronLayer(ctx, S, t) {
  for (let i = 0; i < LAS_PARKED.length; i++) {
    const P = LAS_PARKED[i], gx = lasGateX(P.gate), px0 = gx + 36;
    if (!S.cam.visible(px0 + 280, 420)) continue;
    // the jet bridge: a corrugated tube from the door out to the aircraft
    ctx.drawImage(texSprite('bridge', 110, 70, function (b) {
      b.box(0, 0, 110, 56, '#8a939e', { tex: false });
      for (let x = 2; x < 108; x += 4) b.vline(x, 2, 52, rgbOf(x % 8 ? '#9aa3ae' : '#6a727e'));
      b.rect(0, 20, 110, 10, rgbOf('#2a3a52')); for (let x = 4; x < 106; x += 14) b.rect(x, 22, 8, 6, rgbOf('#8ab0c8'));
      b.box(84, 52, 10, 18, '#5b636e', { tex: 'brushed' });
    }), gx + 20, 250);
    ctx.drawImage(lasAircraft(P.liv), px0, 180);
    // the beacon on the belly, and the one on the tail, blinking out of step
    if (Math.floor(t * 1.4 + i) % 2) { px(ctx, px0 + 250, 317, '#ff3a2a'); px(ctx, px0 + 251, 317, '#ff3a2a'); }
  }
}
// Reflections in the terrazzo: everybody standing on it, upside down and faint.
function lasReflect(ctx, S, spec, x, y, sc, flip, pose, t) {
  if (x < 1160 || lasOnWalkway(x)) return;   // pavement, road, rubber treads: nothing to reflect in
  // polished, not a mirror: the feet and legs, fading out in two steps
  for (let k = 0; k < 2; k++) {
    ctx.save();
    ctx.beginPath(); ctx.rect(x - 60, LAS_F + 1 + k * 14, 120, 14 + k * 12); ctx.clip();
    ctx.translate(0, 2 * LAS_F + 2); ctx.scale(1, -1);
    ctx.globalAlpha = k ? 0.045 : 0.1;
    drawBugAt(ctx, spec, x, LAS_F + (LAS_F - y), { pose: pose, scale: sc, flip: flip, bounce: 0.4 });
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// ---------- things drawn live because somebody stands behind them ----------
// The check-in counter goes over the agents, so the agents can stand behind it.
function lasCounterFront(k) {
  return texSprite('counter|' + k, 400, 66, function (b) {
    b.box(0, 0, 400, 10, '#e6e0d4', { tex: false, ol: '#5a5650' });
    b.hline(1, 1, 398, rgbOf('#fbf8f0'));
    b.box(2, 10, 396, 56, '#a8b0ba', { tex: 'brushed', seed: 152 + k });
    for (let p = 0; p < 4; p++) {
      const px0 = 30 + p * 92;
      b.box(px0 + 50, 18, 34, 36, '#3a414c', { tex: 'brushed', seed: p });
      b.rect(px0 + 54, 22, 26, 3, rgbOf('#1b1f26'));
      b.rect(px0 + 60, 28, 14, 6, rgbOf('#12301a')); b.rect(px0 + 62, 30, 10, 2, rgbOf('#6be585'));
      b.vline(px0 + 96, 10, 56, rgbOf('#7a828e'));
    }
  });
}
function lasCounterMonitors(ctx, ix, t) {
  for (let p = 0; p < 4; p++) {
    const px0 = ix + 20 + p * 92;
    ctx.drawImage(texSprite('agentmon', 24, 22, function (b) { b.box(0, 0, 24, 20, '#1b1f26', { tex: false }); b.rect(2, 2, 20, 14, rgbOf('#1a3a4a')); b.rect(10, 20, 4, 2, rgbOf('#3a414c')); }), px0, 370);
    for (let r = 0; r < 3; r++) rect(ctx, px0 + 3, 374 + r * 4, 6 + ((r * 5 + Math.floor(t * 0.7 + p)) % 9), 1, '#6be585');
  }
}
// The building's front wall, cut through where you walk in: the lintel over
// your head and the plinth under the floor line, so the road ends somewhere.
function lasThreshold() {
  return texSprite('threshold', 64, LAS_TH, function (b) {
    // the end of the canopy: aluminium cladding panels with shadow joints,
    // a bolted end plate, and the gutter lip
    b.box(0, 44, 64, 92, '#4a525e', { tex: 'brushed', seed: 5 });
    for (let y = 58; y < 134; y += 15) { b.hline(2, y, 60, rgbOf('#1b1f26')); b.hline(2, y + 1, 60, rgbOf('#7a828e')); }
    for (const bx of [6, 56]) for (let y = 62; y < 132; y += 15) b.rect(bx, y, 2, 2, rgbOf('#c8ced6'));
    b.rect(0, 44, 64, 8, rgbOf('#2a2f38')); b.hline(0, 44, 64, rgbOf('#8a939e')); b.hline(0, 51, 64, rgbOf('#12141c'));
    // the door head: the air curtain's grille and the sensor, blinking green
    b.box(0, 134, 64, 38, '#a8b0ba', { tex: 'brushed', seed: 7 });
    for (let y = 142; y < 164; y += 3) b.rect(6, y, 52, 1, rgbOf('#3a414c'));
    b.rect(28, 165, 8, 4, rgbOf('#1b1f26')); b.rect(31, 166, 2, 2, rgbOf('#6be585'));
    // the jambs, and the sliding leaves stacked open against them
    b.box(0, 172, 9, LAS_F - 172, '#8a939e', { tex: 'brushed', seed: 8 });
    b.box(55, 172, 9, LAS_F - 172, '#8a939e', { tex: 'brushed', seed: 9 });
    b.glass(9, 174, 11, LAS_F - 176, '#a8d0e8', 0.32, 3, { band: 30, slope: 0.4 });
    b.glass(44, 174, 11, LAS_F - 176, '#a8d0e8', 0.32, 5, { band: 30, slope: 0.4 });
    b.vline(19, 174, LAS_F - 176, rgbOf('#c8ced6')); b.vline(44, 174, LAS_F - 176, rgbOf('#c8ced6'));
    b.rect(16, 290, 2, 60, rgbOf('#e8eef4')); b.rect(46, 290, 2, 60, rgbOf('#e8eef4'));
    b.rect(10, 250, 9, 3, rgbOf('#e0b23c'), 200); b.rect(45, 250, 9, 3, rgbOf('#e0b23c'), 200);   // the manifestation strip at eye level
    // the track in the floor
    b.box(0, LAS_F - 3, 64, 6, '#c8ced6', { tex: 'brushed', seed: 10, ol: '#3a414c' });
    // below the floor line: the facade pier, black granite on a steel plinth
    for (let j = LAS_F + 3; j < LAS_TH; j++) for (let i = 4; i < 60; i++) {
      const g = hash2(i, j, 11); let c = rgbOf(g > 0.92 ? '#6a6470' : g > 0.8 ? '#3a3640' : '#26232c');
      if (i < 6 || i > 57) c = rgbOf('#15131a');
      b.put(i, j, c);
    }
    for (let j = LAS_F + 3; j < LAS_TH; j += 34) b.hline(4, j, 56, rgbOf('#4a4652'));
    b.rect(0, LAS_F + 3, 4, LAS_TH - LAS_F - 3, rgbOf('#5b636e')); b.rect(60, LAS_F + 3, 4, LAS_TH - LAS_F - 3, rgbOf('#5b636e'));
  });
}

// ---------- props: what you can press the button on ----------
function lasShopFor(name) {
  if (typeof SHOPS === 'undefined') return null;
  const n = name.toUpperCase();
  return SHOPS.find(function (s) { return s.name === n; }) || SHOPS.find(function (s) { return n.indexOf(s.name.split(' ')[0]) >= 0; }) || null;
}
function lasProps() {
  const P = [];
  const hit = function (x, w, label, act, extra) { P.push(Object.assign({ kind: 'lasnone', x: x, w: w, h: 60, floor: 0, label: label, act: act, reach: 30 }, extra || {})); };
  hit(430, 70, 'CURBSIDE CHECK-IN', 'curb');
  hit(1520, 200, 'CHECK IN - DRAGON FLY', 'checkin', { reach: 20 });
  hit(1224, 100, 'SELF-SERVICE KIOSK', 'kiosk');
  hit(2480, 200, 'CHECK IN - MOTHWAYS', 'otherdesk');
  hit(3355, 110, 'WAIT TIME', 'wait');
  hit(3830, 190, 'GO THROUGH SECURITY', 'security', { reach: 20 });
  P.push({ kind: 'lasnone', x: 4262, w: 30, h: 60, floor: 0, solid: true, id: 'barrier' });
  hit(4475, 260, 'PLAY A SLOT - $1', 'slot', { reach: 10 });
  hit(4685, 120, 'GO INTO STARBUGS', 'shop', { shop: 'STARBUGS' });
  hit(4880, 110, 'GO INTO DUTY FREE', 'shop', { shop: 'DUTY FLY' });
  hit(5040, 60, 'READ THE BOARD', 'fids');
  hit(5165, 170, 'GO INTO BURGER MONARCH', 'shop', { shop: 'BURGER MONARCH' });
  hit(5350, 90, 'RESTROOMS', 'restroom');
  hit(5545, 150, 'THE MURAL', 'mural');
  hit(5770, 130, 'THE DISPLAY CASE', 'case');
  hit(7758, 210, 'PLAY A SLOT - $1', 'slot', { reach: 10 });
  for (let g = 0; g < LAS_GATES.length; g++) {
    const G = LAS_GATES[g];
    if (G.name === LAS_MY_GATE) hit(G.x + 100, 60, 'BOARD DF0808', 'board', { reach: 24 });
    else hit(G.x + 100, 60, 'GATE ' + G.name, 'gatedoor', { gate: G.name });
    if (g % 4 === 2) hit(G.x - 168, 44, 'BOTTLE FILLER', 'water');
  }
  return P;
}
function lasNpcs() {
  return [
    { name: 'THE SKYCAP', x: 486, floor: 0, voice: 'driver', scale: 1.4, y: LAS_F,
      tag: ['CURBSIDE IS FOR PEOPLE WHO TIP.', 'INSIDE, TO YOUR LEFT. DRAGON FLY IS THE FIRST ISLAND.', 'GOOD LUCK OVER THERE.'] },
    { name: 'THE AGENT', x: 1540, floor: 0, voice: 'clerk', scale: 1.3, y: LAS_F - 40, hidden: true, act: 'checkin', tag: 'x' },
    { name: 'A LOST TOURIST', x: 2600, floor: 0, voice: 'kid', scale: 1.35, y: LAS_F, carry: 'suitcase',
      tag: ['IS THIS TERMINAL ONE? IT SAYS THREE.', 'SO WHERE IS TERMINAL TWO?', 'THERE IS NO TERMINAL TWO? SINCE WHEN?'] },
    { name: 'TSA', x: 3470, floor: 0, voice: 'guard', scale: 1.4, y: LAS_F,
      tag: ['BOARDING PASS AND ID.', 'LAPTOPS CAN STAY IN THE BAG. SHOES STAY ON. IT IS NOT 2006.', 'NEXT.'] },
    { name: 'A SLOT PLAYER', x: 4560, floor: 0, voice: 'oldman', scale: 1.35, y: LAS_F,
      tag: ['ONE MORE PULL AND I GO TO MY GATE.', 'THAT WAS FORTY MINUTES AGO.', 'SHE IS WARM. I CAN FEEL IT.'] },
    { name: 'A CLEANER', x: 5000, floor: 0, voice: 'clerk', scale: 1.3, y: LAS_F, walk: [4700, 5500], speed: 14,
      tag: ['EIGHT HUNDRED THOUSAND SQUARE FEET OF TERRAZZO.', 'I HAVE MET MOST OF IT.'] },
    { name: 'A PILOT', x: 6000, floor: 0, voice: 'captain', scale: 1.4, y: LAS_F, carry: 'suitcase', walk: [5700, 9700], speed: 36,
      tag: ['RUNWAY TWO SIX RIGHT TONIGHT. LONG ONE.', 'NICE AND SMOOTH ALL THE WAY TO NARITA. PROBABLY.'] },
    { name: 'A FIRST OFFICER', x: 5940, floor: 0, voice: 'hostess', scale: 1.35, y: LAS_F, carry: 'suitcase', walk: [5640, 9640], speed: 36,
      tag: ['HE SAYS PROBABLY ABOUT EVERYTHING.'] },
    { name: 'A KID AT THE WINDOW', x: 7450, floor: 0, voice: 'kid', scale: 1.2, y: LAS_F,
      tag: ['THAT ONE IS RED. THAT ONE IS GREEN. THAT ONE IS GOING.', 'WHY IS THERE NO E THIRTEEN?'] },
    { name: 'THE GATE AGENT', x: lasGateX(LAS_MY_GATE) + 22, floor: 0, voice: 'hostess', scale: 1.35, y: LAS_F,
      tag: function (S) { return S.T.boarding ? 'GROUP FOUR. THAT IS YOU, AND ALSO EVERYBODY.' : 'WE BOARD IN TEN. HAVE A SEAT. HAVE A PULL, EVEN.'; } },
  ];
}

// ---------- the scene ----------
class DepartureScene extends SideScene {
  constructor(opts) {
    const o = opts || {};
    super(lasDef(), o);
    this.T = this.D.T;
    const r = Game.run;
    if (r && r.flags && r.flags.checkedIn) this.T.pass = true;
    if (r && r.flags && r.flags.cleared) { this.T.cleared = true; }
    if (o.at != null) { this.body.x = o.at; this.body.floor = 0; this.body.fk = 0; this.cam.snapTo(this.body.x, LAS_F); }
    else if (!this.T.pass) this.body.carry = 'suitcase';
    this.syncBarrier();
    // the crowd: people with things to do, spread through the building in lanes
    const zones = [[40, 1100, 10, ['walk', 'case', 'case', 'phone', 'late']], [1200, 3200, 34, ['walk', 'case', 'case', 'phone', 'wait', 'talk', 'push']],
      [3250, 4250, 12, ['wait', 'wait', 'phone', 'walk']], [4320, 5620, 22, ['walk', 'eat', 'eat', 'phone', 'talk', 'shop', 'photo']],
      [5700, 9800, 34, ['walk', 'walk', 'phone', 'eat', 'late', 'case', 'stretch', 'talk']]];
    this.crowd = [];
    for (let z = 0; z < zones.length; z++) {
      const Z = zones[z], c = makeLifeCrowd(Z[2], 7700 + z * 131, { x0: Z[0], x1: Z[1], y: LAS_F, min: 1.05, max: 1.4, acts: Z[3] });
      for (let i = 0; i < c.length; i++) { const lane = i % 3; c[i].y = LAS_F - lane * 7; c[i].sc *= 1 - lane * 0.09; c[i].zx0 = Z[0]; c[i].zx1 = Z[1]; c[i].acts = Z[3]; }
      this.crowd = this.crowd.concat(c);
    }
    // people sitting in the gate seats, asleep, eating, on the phone
    this.seated = [];
    const sit = makeLifeCrowd(40, 8811, { x0: 0, x1: 10, y: LAS_F, min: 1.0, max: 1.2, acts: ['phone', 'sleep', 'eat', 'phone', 'sleep'] });
    let k = 0;
    for (let g = 0; g < LAS_GATES.length && k < sit.length; g++) {
      const sx = LAS_GATES[g].x - 132;
      if (lasOnWalkway(sx + 90) || lasInSlots(sx, sx + 180)) continue;
      for (let i = 0; i < 4 && k < sit.length; i++) if (hash2(g, i, 9) < 0.6) { const p = sit[k++]; p.x = sx + 22 + i * 42; p.y = LAS_F - 30; p.dir = hash2(g, i, 10) < 0.5 ? 1 : -1; p.moving = false; this.seated.push(p); }
    }
    // the check-in agents, behind their counters
    this.agents = [];
    for (let isl = 0; isl < 4; isl++) for (let a = 0; a < 2; a++) this.agents.push({ spec: randomBugSpec(makeRng(900 + isl * 7 + a)), x: 1330 + isl * 480 + 60 + a * 184, isl: isl });
    // traffic on the kerb road
    this.cars = [];
    const kinds = ['taxi', 'limo', 'bus', 'taxi', 'car', 'taxi'];
    for (let i = 0; i < 6; i++) this.cars.push({ kind: kinds[i], x: i * 240 - 200, lane: i % 2, v: (i % 2 ? -1 : 1) * (26 + (i * 7) % 20) });
    if (typeof setChapter === 'function') setChapter('departure');
  }
  syncBarrier() { const b = this.props.find(function (p) { return p.id === 'barrier'; }); if (b) b.solid = !this.T.cleared; }
  update(dt) {
    // the slot machine, if you are playing it, has all of your attention
    if (this.slot) { this.slot.t += dt; this.t += dt; this.fx.update(dt); return; }
    super.update(dt);
    const T = this.T;
    // moving walkways carry you, and everybody else
    if (lasOnWalkway(this.body.x) && !this.dlg) this.body.x += 64 * dt;
    // bake the next tile ahead of the camera so nothing pops in
    const iR = Math.floor((this.cam.x + W) / LAS_T) + 1;
    if (iR * LAS_T < LAS_W && !_lasTiles.has(iR)) lasTile(iR);
    else { const iL = Math.floor(this.cam.x / LAS_T) - 1; if (iL >= 0 && !_lasTiles.has(iL)) lasTile(iL); }
    // the crowd
    updateLifeCrowd(this.crowd, dt, this.t, this, { x0: 20, x1: LAS_W - 20, fame: 1 });
    for (let i = 0; i < this.crowd.length; i++) {
      const p = this.crowd[i];
      if (p.x < p.zx0) { p.x = p.zx0; p.dir = 1; } else if (p.x > p.zx1) { p.x = p.zx1; p.dir = -1; }
      if (lasOnWalkway(p.x) && p.moving) p.x += 40 * dt;
    }
    for (let i = 0; i < this.cars.length; i++) { const c = this.cars[i]; c.x += c.v * dt; if (c.x > 1350) c.x = -260; if (c.x < -260) c.x = 1350; }
    // boarding opens when you get near the gate with a pass and a clear bag
    if (T.pass && T.cleared && !T.boarding && this.body.x > lasGateX(LAS_MY_GATE) - 700) { T.boarding = true; Voice.chime('plane'); this.flash('NOW BOARDING: DRAGON FLY 0808 TO TOKYO NARITA. GATE E12.', 5); }
    // the airport speaks, every so often, to nobody in particular
    T.paT -= dt;
    if (T.paT <= 0) { T.paT = 28 + (Math.floor(this.t) % 9); T.pa = LAS_PA[T.paI++ % LAS_PA.length]; T.paShow = 6; Voice.chime('plane'); Voice.say(T.pa, 'tannoy', { speed: 0.9 }); }
    T.paShow = Math.max(0, T.paShow - dt);
    T.obj = !T.pass ? 'CHECK IN. DRAGON FLY, FIRST ISLAND.' : !T.cleared ? 'GO THROUGH SECURITY.' : !T.boarding ? 'FIND GATE E12. IT IS A LONG WAY.' : 'BOARD AT GATE E12.';
  }
  key(code) {
    if (this.slot) { if (this.slot.t > 2.4 && ['Enter', 'Space', 'KeyZ', 'Escape', 'KeyX'].indexOf(code) >= 0) this.slot = null; return; }
    super.key(code);
  }
  pointerDown(x, y, id) { if (this.slot) { if (this.slot.t > 2.4) this.slot = null; return; } super.pointerDown(x, y, id); }
  draw(ctx) {
    super.draw(ctx);
    const T = this.T;
    // the objective, and where you are
    // the objective and where you are, kept to a thin line under the top bar
    const w = textWidth(T.obj) + 16;
    rect(ctx, 6, 27, w, 15, 'rgba(10,12,18,0.82)'); rect(ctx, 6, 27, 3, 15, '#f2c94c');
    drawText(ctx, T.obj, 14, 31, '#f2c94c');
    const z = lasZone(this.body.x), zw = Math.max(textWidth(z.name) + 16, 150), zx = W - zw - 6;
    rect(ctx, zx, 27, zw, 15, 'rgba(10,12,18,0.82)');
    drawText(ctx, z.name, zx + 8, 29, '#ffffff');
    rect(ctx, zx + 8, 38, zw - 16, 2, '#2a2f38');
    rect(ctx, zx + 8, 38, Math.round((zw - 16) * clamp(this.body.x / LAS_W, 0, 1)), 2, '#f2c94c');
    const mg = lasGateX(LAS_MY_GATE); rect(ctx, zx + 8 + Math.round((zw - 16) * mg / LAS_W) - 1, 36, 2, 6, '#6be585');
    if (T.paShow > 0) {
      ctx.globalAlpha = clamp(T.paShow, 0, 1);
      const lines = wrapText(T.pa, Math.floor((W - 100) / (FONT5.adv * 2)));
      const pw = Math.max.apply(null, lines.map(function (l) { return textWidth(l, { scale: 2 }); })) + 32, ph = lines.length * 20 + 8, py = H - 38 - ph;
      rect(ctx, W / 2 - pw / 2, py, pw, ph, 'rgba(10,8,18,0.9)'); frame(ctx, W / 2 - pw / 2, py, pw, ph, '#f2a03a');
      rect(ctx, W / 2 - pw / 2 + 4, py + 4, 3, ph - 8, '#f2a03a');
      for (let l = 0; l < lines.length; l++) drawText(ctx, lines[l], W / 2 + 2, py + 6 + l * 20, '#ffd88a', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    if (this.slot) lasSlotOverlay(ctx, this.slot, this.t);
  }
}
const LAS_PA = [
  'WELCOME TO LAS VEGAS. THE SLOT MACHINES ARE FOR PASSENGERS TWENTY ONE AND OVER.',
  'DRAGON FLY 0808 TO TOKYO NARITA WILL BOARD FROM GATE E12.',
  'PLEASE DO NOT LEAVE BAGGAGE UNATTENDED.',
  'THE MOVING WALKWAY IS NOW ENDING. PLEASE WATCH YOUR STEP.',
  'THE RED LINE TRAM TO THE D GATES IS SOUTH OF SECURITY.',
  'WOULD THE OWNER OF A SMALL BROWN GUITAR CASE PLEASE RETURN TO GATE E7.',
];
function lasSlotOverlay(ctx, s, t) {
  ctx.globalAlpha = 0.72; rect(ctx, 0, 0, W, H, '#05040a'); ctx.globalAlpha = 1;
  const x = W / 2 - 170, y = 90;
  ctx.drawImage(texSprite('slotbig', 340, 330, function (b) {
    b.box(0, 60, 340, 270, '#8a1c3a', { tex: false });
    b.ditherH(2, 62, 336, 266, ['#c83a5a', '#8a1c3a', '#4a0a1c']);
    b.box(10, 0, 320, 66, '#12141c', { tex: false });
    b.ditherV(12, 2, 316, 62, ['#ff6a8a', '#8a1c3a']);
    b.box(30, 96, 280, 120, '#0a0a10', { tex: false });
    b.box(40, 240, 260, 40, '#2a2d38', { tex: 'brushed' });
    b.box(330, 120, 10, 100, '#9aa3ae', { tex: 'brushed', ol: false });
  }), x, y);
  const lit = Math.floor(t * 6) % 2;
  drawText(ctx, 'MEGA BUGS', W / 2, y + 16, lit ? '#ffd24a' : '#ffffff', { align: 'center', scale: 4, outline: '#5a0a10' });
  for (let r = 0; r < 3; r++) {
    const rx = x + 70 + r * 100, stopAt = 1.0 + r * 0.4, done = s.t > stopAt;
    rect(ctx, rx - 38, y + 104, 76, 104, '#f4f1ea');
    frame(ctx, rx - 38, y + 104, 76, 104, '#8a8478');
    if (done) lasSlotSymbol(ctx, rx, y + 156, s.res[r], 4);
    else { for (let k = -1; k <= 1; k++) lasSlotSymbol(ctx, rx, y + 156 + k * 36 + ((s.t * 900) % 36) - 18, Math.floor(s.t * 25 + r * 3 + k) % SLOT_SYM.length, 3); }
  }
  rect(ctx, x + 30, y + 155, 280, 2, '#e8303a');
  if (s.t > 2.2) {
    const a = s.res[0], b = s.res[1], c = s.res[2];
    const three = a === b && b === c, pay = three ? (SLOT_SYM[a] === '7' ? 50 : 20) : (a === 4 && b === 4) ? 2 : 0;
    if (!s.paid) {
      s.paid = true; s.pay = pay;
      if (Game.run && pay) { Game.run.money += pay; Audio.ui('cash'); } else Audio.ui('sad');
    }
    drawText(ctx, s.pay ? 'YOU WIN $' + s.pay : 'NOTHING. OF COURSE.', W / 2, y + 250, s.pay ? '#ffd24a' : '#cfc9e6', { align: 'center', scale: 3 });
    if (s.t > 2.4) drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, y + 300, '#8a82a8', { align: 'center', font: 'small' });
  } else drawText(ctx, 'SPINNING', W / 2, y + 250, '#ffffff', { align: 'center', scale: 3 });
}
function lasDef() {
  const T = { pass: false, cleared: false, boarding: false, obj: '', paT: 9, paI: 0, pa: '', paShow: 0 };
  return {
    name: 'HARRY REID INTERNATIONAL', sub: 'TERMINAL 3 - LEVEL 2 - DEPARTURES', tint: '#1c2a4a',
    w: LAS_W, zoom: 1, yBias: 0.8, freeFloors: false, heroScale: 1.65, speed: 138,
    start: { x: 110, floor: 0 },
    floors: [{ y: LAS_F, z: 1 }],
    enterLine: 'TERMINAL 3. THE INTERNATIONAL ONE. THE LONG ONE.',
    T: T,
    sky: function (ctx) { ctx.drawImage(lasSkyCanvas(), 0, 0); },
    back: function (ctx, S, t) {
      const fx = Math.round(-S.cam.x * 0.12), fy = 50;
      // the beam out of the top of the pyramid, the brightest thing in Nevada
      const bx = fx + 420, by = fy + 96;
      if (bx > -20 && bx < W + 20) {
        for (let y = 0; y < by; y++) {
          const k = y / by;
          ctx.globalAlpha = 0.06 + k * 0.14; rect(ctx, bx - 6, y, 12, 1, '#fff2c0');
          ctx.globalAlpha = 0.5 + k * 0.4; rect(ctx, bx - 1, y, 3, 1, '#ffffff');
        }
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(lasFarCanvas(), fx, fy);
      const ax = Math.round(-S.cam.x * 0.45);
      ctx.drawImage(lasAirfieldCanvas(), ax, 220);
      // an aircraft on its takeoff roll down 26R, every so often
      const cyc = (t % 26) / 26, rx = W + 200 - cyc * (W + 700), ry = 220 + 70 - Math.max(0, (cyc - 0.55)) * 170;
      if (cyc < 0.9) { ctx.drawImage(lasAircraft('jet'), rx, ry - 118, 150, 51); if (Math.floor(t * 3) % 2) px(ctx, rx + 70, ry - 64, '#ff4a3a'); }
    },
    mid: function (ctx, S, t) {
      lasApronLayer(ctx, S, t);
      const i0 = Math.max(0, Math.floor(S.cam.x / LAS_T)), i1 = Math.min(Math.floor((S.cam.x + W) / LAS_T), Math.floor((LAS_W - 1) / LAS_T));
      for (let i = i0; i <= i1; i++) ctx.drawImage(lasTile(i), i * LAS_T, 0);
      lasDichroic(ctx, S, t);
      if (S.cam.visible(4990, 300)) lasFids(ctx, 4860, 132, t);
      lasWalkways(ctx, S, t);
      lasSlots(ctx, S, t);
      // the agents, then the counters over them, then the queue belts in front
      for (let k = 0; k < 4; k++) {
        const ix = 1330 + k * 480;
        if (!S.cam.visible(ix + 190, 300)) continue;
        lasCounterMonitors(ctx, ix, t);
        for (let a = 0; a < S.agents.length; a++) { const A = S.agents[a]; if (A.isl === k) drawBugAt(ctx, A.spec, A.x, LAS_F - 34, { pose: Math.floor(t * 0.8 + a) % 3 ? 'idle' : 'talk', scale: 1.25, bounce: 0.35, phase: a }); }
        if (k === 0) { const n = S.npcs.find(function (q) { return q.name === 'THE AGENT'; }); if (n) drawBugAt(ctx, n.spec, n._x, LAS_F - 34, { pose: S.dlg ? 'talk' : 'idle', scale: 1.3, bounce: 0.4 }); }
        ctx.drawImage(lasCounterFront(k), ix - 10, LAS_F - 60);
        ctx.drawImage(lasStanchions(300), ix + 40, LAS_F - 46 + 6);
      }
      lasGateScreens(ctx, S, t);
      // reflections first, then the people who cast them
      for (let i = 0; i < S.crowd.length; i++) { const p = S.crowd[i]; if (S.cam.visible(p.x, 80) && S.body) lasReflect(ctx, S, p.spec, p.x, p.y, p.sc, p.dir < 0, 'idle', t); }
      for (let i = 0; i < S.npcs.length; i++) { const n = S.npcs[i]; if (!n.hidden && S.cam.visible(n._x, 80)) lasReflect(ctx, S, n.spec, n._x, LAS_F, n.scale, n.face < 0, 'idle', t); }
      lasReflect(ctx, S, S.you.spec, S.body.x, LAS_F, S.body.scale, S.body.flip, S.body.pose, t);
      drawLifeCrowd(ctx, S, S.seated, t);
      const sorted = S.crowd.slice().sort(function (a, b) { return a.y - b.y; });
      drawLifeCrowd(ctx, S, sorted, t);
    },
    fore: function (ctx, S, t) {
      // the kerb road: taxis, limos, the shuttle, in front of you
      if (S.cam.x < 1300) {
        ctx.save(); ctx.beginPath(); ctx.rect(-10, LAS_F + 25, 1160, 200); ctx.clip();
        const cs = S.cars.slice().sort(function (a, b) { return a.lane - b.lane; });
        for (let i = 0; i < cs.length; i++) {
          const c = cs[i], cv = lasVehicle(c.kind), y = LAS_F + (c.lane ? 112 : 70) - 60;
          ctx.globalAlpha = 0.3; ellipsePx(ctx, c.x + cv.width / 2, y + 62, cv.width * 0.45, 5, '#000'); ctx.globalAlpha = 1;
          ctx.drawImage(c.v < 0 ? cached('vehflip|' + c.kind, function () { return flipCanvas(cv); }) : cv, Math.round(c.x), y);
          ctx.globalAlpha = 0.18; ellipsePx(ctx, c.v > 0 ? c.x + cv.width + 24 : c.x - 24, y + 42, 30, 7, '#fff0c0'); ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      lasWalkwaysNear(ctx, S, t);
      if (S.cam.visible(1150, 100)) ctx.drawImage(lasThreshold(), 1136, 0);
      for (const px0 of [2150, 3130, 5620]) if (S.cam.visible(px0, 120)) ctx.drawImage(lasPlanter(), px0 - 55, LAS_F + 26);
    },
    after: function (ctx, S, t) {
      grade(ctx, 0, 0, W, H, '#ff9a60', 0.05, 'soft-light');
      vignette(ctx, 0.34);
    },
    prop: function (ctx, p) { return p.kind === 'lasnone' ? true : false; },
    props: lasProps(),
    npcs: lasNpcs(),
    use: function (S, p) {
      const T = S.T, r = Game.run;
      switch (p.act) {
        case 'curb': S.say('THE SKYCAP', 'CURBSIDE IS DOMESTIC ONLY TONIGHT. TOKYO IS INSIDE, FIRST ISLAND.', 'driver', { at: 'THE SKYCAP' }); return;
        case 'kiosk': S.flash(T.pass ? 'YOU ALREADY HAVE A PASS.' : 'IT WANTS A PASSPORT SCAN. IT DOES NOT LIKE YOURS. USE THE DESK.'); return;
        case 'otherdesk': S.flash('MOTHWAYS. LONDON. NOT YOURS.'); return;
        case 'checkin':
          if (T.pass) { S.flash('CHECKED IN. GATE E12.'); return; }
          S.run([
            { who: 'THE AGENT', text: 'GOOD EVENING. DRAGON FLY. PASSPORT, AND THE CASE ON THE BELT.', voice: 'clerk', at: { x: 1540, y: LAS_F - 90 } },
            { who: 'THE AGENT', text: 'TOKYO NARITA. WINDOW OR AISLE?', voice: 'clerk', at: { x: 1540, y: LAS_F - 90 },
              choices: [{ label: 'WINDOW', note: '31A' }, { label: 'AISLE', note: '31C' }, { label: 'THE CHEAPEST ONE', note: 'STILL 31A' }] },
            { who: 'THE AGENT', text: 'THIRTY ONE A. OVER THE WING. YOU WILL SEE THE WING.', voice: 'clerk', at: { x: 1540, y: LAS_F - 90 } },
            { who: 'THE AGENT', text: 'GATE E12. IT IS THE FAR END. THERE IS NO E13, SO DO NOT LOOK FOR IT.', voice: 'clerk', at: { x: 1540, y: LAS_F - 90 } },
          ], function () {
            T.pass = true; S.body.carry = null; Audio.ui('stamp');
            if (r) { r.flags = r.flags || {}; r.flags.checkedIn = true; r.save(); }
            S.flash('THE CASE GOES DOWN THE BELT. YOU WILL SEE IT IN JAPAN.', 4);
          });
          return;
        case 'wait': S.flash('TWELVE MINUTES, IT SAYS. IT HAS SAID TWELVE SINCE 2012.'); return;
        case 'security':
          if (!T.pass) { S.flash('BOARDING PASS FIRST. CHECK IN AT DRAGON FLY.'); return; }
          if (T.cleared) { S.flash('YOU ARE THROUGH. THE GATES ARE THAT WAY.'); return; }
          S.run([
            { who: 'TSA', text: 'BAG IN THE BIN. ANYTHING SHARP?', voice: 'guard', at: 'TSA',
              choices: [{ label: 'A PLECTRUM', note: 'HONEST' }, { label: 'NOTHING', note: 'MOSTLY TRUE' }, { label: 'MY WIT', note: 'NO' }] },
            { who: 'TSA', text: 'A PLECTRUM IS NOT SHARP. STEP IN. ARMS UP. HOLD IT.', voice: 'guard', at: 'TSA' },
            { who: null, text: 'THE SCANNER GOES ROUND YOU TWICE AND DECIDES YOU ARE FINE.', voice: false, at: 'you' },
          ], function () {
            T.cleared = true; S.syncBarrier(); Audio.ui('coin');
            if (r) { r.flags = r.flags || {}; r.flags.cleared = true; r.save(); }
            S.flash('THROUGH. PUT YOUR BELT BACK ON SOMEWHERE LESS PUBLIC.', 4);
          });
          return;
        case 'slot':
          if (!r || r.money < 1) { S.flash('ONE DOLLAR. YOU DO NOT HAVE ONE DOLLAR.'); return; }
          r.money -= 1; Audio.ui('coin');
          {
            // the house wins, mostly
            const roll = Math.random(), res = [0, 1, 2].map(function () { return Math.floor(Math.random() * SLOT_SYM.length); });
            if (roll < 0.04) res[0] = res[1] = res[2] = 0;
            else if (roll < 0.12) res[1] = res[2] = res[0];
            else if (roll < 0.22) { res[0] = 4; res[1] = 4; }
            S.slot = { t: 0, res: res };
          }
          return;
        case 'shop': {
          const sh = lasShopFor(p.shop);
          if (sh && typeof ShopInteriorScene === 'function') {
            const at = S.body.x;
            Game.go(function () { return new ShopInteriorScene(sh, function () { return new DepartureScene({ at: at }); }); }, 'iris', { dur: 0.5 });
          } else S.flash(p.shop + '. CLOSED FOR RESTOCKING, WHICH MEANS NOBODY IS HERE.');
          return;
        }
        case 'fids': S.say('THE BOARD', 'DF 0808. TOKYO NARITA. GATE E12. BOARDING.', 'tannoy', { at: { x: 4990, y: 200 } }); return;
        case 'restroom': S.flash('CLEAN. COLD. A HAND DRYER LOUD ENOUGH TO BE A WEATHER EVENT.'); return;
        case 'mural': S.say('THE MURAL', 'THE DESERT AT NIGHT, BY SOMEBODY WHO HAD CLEARLY SLEPT IN IT.', 'tannoy', { at: { x: 5545, y: 330 } }); return;
        case 'case': S.say('THE CASE', 'A MODEL OF A 1960 AIRLINER, AND A PLAQUE ABOUT WHEN THIS WAS ALL SAND.', 'tannoy', { at: { x: 5770, y: 340 } }); return;
        case 'water': if (r) r.stamina = Math.min(r.staminaMax, r.stamina + 6); Audio.ui('eat'); S.flash('COLD WATER. THE COUNTER CLICKS OVER ONE MORE BOTTLE SAVED.'); return;
        case 'gatedoor': S.flash('GATE ' + p.gate + '. NOT YOURS. YOURS IS E12.'); return;
        case 'board':
          if (!T.pass) { S.flash('NO PASS. CHECK IN FIRST.'); return; }
          if (!T.cleared) { S.flash('YOU HAVE NOT BEEN THROUGH SECURITY.'); return; }
          S.run([
            { who: 'THE GATE AGENT', text: 'PASS AND PASSPORT. GROUP FOUR. THANK YOU.', voice: 'hostess', at: 'THE GATE AGENT' },
            { who: null, text: 'THE SCANNER BEEPS GREEN. THE FIRST THING ALL WEEK THAT HAS.', voice: false, at: 'you' },
          ], function () {
            Audio.ui('coin');
            if (typeof setChapter === 'function') setChapter('plane');
            S.leave(function () { return typeof JetBridgeScene === 'function' ? new JetBridgeScene() : new PlaneScene({ seated: true }); }, 'fade', { dur: 1 });
          });
          return;
      }
      if (p.act === 'checkin' || p.name === 'THE AGENT') return;
      S.flash(p.label || '');
    },
  };
}

// ---------- the near apron, outside the gate windows ----------
// Concrete in slabs with the joints sealed black, stand lines in yellow, a
// stop bar, and the equipment that services an aircraft on the ground.
function lasNearApron() {
  return cached('las|nearapron', function () {
    const w = 870, h = 130, b = new TexBuf(w, h, 0, 0);
    b.concrete(0, 0, w, h, '#a8a296', 210);
    b.ditherV(0, 0, w, 16, ['#8a8478', '#a8a296']);
    for (let x = 0; x < w; x += 58) b.vline(x, 0, h, rgbOf('#5a564e'));
    for (let y = 18; y < h; y += 28) b.hline(0, y, w, rgbOf('#6a665e'));
    for (let x = 0; x < w; x += 4) b.put(x, 40, rgbOf('#e0b23c'));
    b.rect(0, 70, w, 3, rgbOf('#e0b23c'));
    for (let x = 60; x < w; x += 290) { b.rect(x, 50, 3, 40, rgbOf('#e8e6dc')); b.rect(x - 12, 88, 27, 3, rgbOf('#e8e6dc')); }
    for (let x = 0; x < w; x += 120) if (hash2(x, 1, 211) < 0.6) b.blend(x + 20, 80 + (hash2(x, 2, 211) * 30 | 0), 40, 12, rgbOf('#3a362e'), 0.35);
    return b.toCanvas();
  });
}
function lasGSE(kind) {
  return texSprite('gse|' + kind, kind === 'loader' ? 120 : kind === 'carts' ? 150 : 70, 60, function (b) {
    if (kind === 'tug') {
      b.box(4, 26, 62, 22, '#e0b23c', { tex: false }); b.ditherV(5, 27, 60, 20, ['#f6d27a', '#c8903a']);
      b.box(40, 8, 24, 20, '#2a2f38', { tex: false }); b.glass(42, 10, 20, 14, '#8ab0c8', 0.6, 1, { band: 10 });
      b.rect(0, 40, 8, 6, rgbOf('#3a414c'));
      for (const wx of [16, 54]) for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 49) b.put(wx + x, 50 + y, rgbOf(x * x + y * y < 9 ? '#8a939e' : '#1b1b22'));
    } else if (kind === 'loader') {
      b.box(10, 34, 70, 16, '#eef1f5', { tex: false }); b.ditherV(11, 35, 68, 14, ['#ffffff', '#b8c0ca']);
      for (let i = 0; i < 40; i++) { b.put(40 + i * 2, 34 - i, rgbOf('#2a2f38')); b.put(40 + i * 2, 35 - i, rgbOf('#2a2f38')); b.put(41 + i * 2, 36 - i, rgbOf('#5b636e')); }
      for (let i = 0; i < 40; i += 5) b.rect(42 + i * 2, 28 - i, 6, 4, rgbOf(['#2f4a8a', '#8a2a1c', '#2f6a4a'][i % 3]));
      for (const wx of [22, 70]) for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) b.put(wx + x, 52 + y, rgbOf(x * x + y * y < 6 ? '#8a939e' : '#1b1b22'));
    } else {
      for (let c = 0; c < 3; c++) {
        const cx = c * 50;
        b.box(cx + 2, 20, 44, 26, '#5b636e', { tex: 'brushed', seed: c });
        b.rect(cx + 4, 22, 40, 3, rgbOf('#8a939e'));
        for (let k = 0; k < 3; k++) b.box(cx + 6 + k * 13, 6 + (k % 2) * 4, 12, 16 - (k % 2) * 4, ['#2f4a8a', '#8a2a1c', '#2f6a4a', '#8a6a2a'][(c + k) % 4], { tex: false });
        b.rect(cx + 44, 40, 8, 2, rgbOf('#3a414c'));
        for (const wx of [cx + 10, cx + 38]) for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) if (x * x + y * y <= 16) b.put(wx + x, 52 + y, rgbOf('#1b1b22'));
      }
    }
  });
}
const _lasApronBase = lasApronLayer;
lasApronLayer = function (ctx, S, t) {
  // the concrete first, along the whole run of windows
  if (S.cam.x + W > 5650) {
    const ap = lasNearApron(), x0 = Math.max(5650, Math.floor(S.cam.x / ap.width) * ap.width);
    for (let x = x0; x < S.cam.x + W + ap.width; x += ap.width) ctx.drawImage(ap, x, 330);
  }
  _lasApronBase(ctx, S, t);
  // and the equipment standing round each parked aircraft
  for (let i = 0; i < LAS_PARKED.length; i++) {
    const gx = lasGateX(LAS_PARKED[i].gate);
    if (!S.cam.visible(gx + 300, 420)) continue;
    ctx.drawImage(lasGSE('loader'), gx + 250, 312);
    ctx.drawImage(lasGSE('carts'), gx + 380, 318);
    ctx.drawImage(lasGSE('tug'), gx + 540 + Math.sin(t * 0.3 + i) * 20, 318);
    for (let c = 0; c < 3; c++) { const cx = gx + 110 + c * 170; ctx.fillStyle = '#e06020'; ctx.beginPath(); ctx.moveTo(cx, 358); ctx.lineTo(cx - 4, 368); ctx.lineTo(cx + 4, 368); ctx.fill(); rect(ctx, cx - 3, 362, 6, 2, '#f4f1ea'); }
  }
};
// Dichroic panels, textured: a dithered sweep through three colours that
// slides as you move, a bright edge, and the cable fittings top and bottom.
const LAS_DICH = (function () {
  const out = [];
  // tall ones in the aisles between the islands, down to head height...
  // (the two at either end of the hall stop short of the kiosks under them)
  for (const x of [1250, 1738, 2218, 2698, 3178]) { const y = 140 + (out.length % 2) * 12, end = x === 1250 || x === 3178; out.push({ x: x, y: y, h: (end ? 326 : 370) - y }); }
  // ...short ones over the islands, stopping above the airline signs
  for (let k = 0; k < 4; k++) for (let s = 0; s < 2; s++) { const y = 132 + ((k + s) % 2) * 10; out.push({ x: 1330 + k * 480 + 80 + s * 176, y: y, h: 236 - y }); }
  return out;
})();
lasDichroic = function (ctx, S, t) {
  const cx = S.cam.x;
  for (let i = 0; i < LAS_DICH.length; i++) {
    const D = LAS_DICH[i], x = D.x, y = D.y, w = 44, h = D.h;
    if (!S.cam.visible(x, 80)) continue;
    rect(ctx, x + 6, 126, 1, y - 126, '#5b636e'); rect(ctx, x + w - 7, 126, 1, y - 126, '#5b636e');
    const hue = (((x - cx * 1.6) * 0.0035 + t * 0.04) % 1 + 1) % 1;
    const q = Math.floor(hue * 24);                       // 24 baked colourings, stepped like a palette
    ctx.drawImage(cached('dich|' + w + '|' + h + '|' + q, function () {
      const b = new TexBuf(w, h, 0, 0), hh = q / 24;
      const c0 = hslToRgb(hh, 0.9, 0.64), c1 = hslToRgb(hh + 0.16, 0.92, 0.56), c2 = hslToRgb(hh + 0.33, 0.85, 0.48), c3 = hslToRgb(hh + 0.5, 0.8, 0.42);
      b.ditherV(1, 1, w - 2, h - 2, [c0, c1, c2, c3]);
      for (let j = 1; j < h - 1; j++) for (let k = 1; k < w - 1; k++) { const d = b.d, o = (j * w + k) * 4; d[o + 3] = 150; }
      // the diagonal flare across the glass
      for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) { const u = (k + j * 0.5) % 34; if (u < 3) b.mix(k, j, [255, 255, 255], 0.55); else if (u < 5 && bayerAt(k, j) < 0.5) b.mix(k, j, [255, 255, 255], 0.3); }
      b.frame(0, 0, w, h, rgbOf('#c8ced6'));
      b.vline(1, 1, h - 2, rgbOf('#ffffff'), 200);
      for (const fy of [2, h - 4]) { b.rect(4, fy, 5, 3, rgbOf('#8a939e')); b.rect(w - 9, fy, 5, 3, rgbOf('#8a939e')); }
      return b.toCanvas();
    }), x, y);
    // the colour it throws across the floor
    if (h < 150) continue;
    const c = hslToRgb(hue + 0.16, 0.9, 0.6);
    ctx.globalAlpha = 0.1; rect(ctx, x - 14, LAS_F + 4, w + 28, 22, rgbToHex(c[0], c[1], c[2])); ctx.globalAlpha = 1;
  }
};
