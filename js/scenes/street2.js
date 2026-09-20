// ---------- The quiet street ----------
// Not the big road. The one behind it: four metres of asphalt with no kerb, a
// drainage channel down each side, and every single thing in your day within
// three hundred paces of the hotel door. A shuttered shop nobody has opened in
// two years, a laundrette that is always lit, a barber with the pole still
// turning, a police box with one bored officer in it, a shrine the size of a
// wardrobe, and a wall of vending machines humming like a fridge.
//
// This is the hub. Everywhere you can go is a door on this street or one stop
// away down the subway stairs, which is what a back street actually is: not a
// place you pass through, a place your whole life is parked on.
//
// The same street reads three ways depending on when you stand in it, so the
// time of day is an argument and the windows, the sky and the grade all take
// it. Morning is grey and blue and nobody is out. Night is the vending
// machines doing all the lighting.
'use strict';

const QS_W = 4200;            // how long the street is
const QS_Y = 455;             // the line you walk on
// yBias is set so world y and screen y come out the same number, which makes
// every building in this file authorable against the 960x540 frame directly.
const QS_BIAS = QS_Y / 540;
const QS_MORNING = 0.16, QS_AFTERNOON = 0.46, QS_NIGHT = 0.92;

const QS_PAL = {
  concrete: '#8d8676', concreteHi: '#a8a08c', concreteLo: '#5f5a4e',
  tileWall: '#6f6a60', tileHi: '#8a857a', tileLo: '#48443d',
  cream: '#b6ae9a', creamHi: '#d0c8b2', creamLo: '#7c7566',
  steel: '#8a8f98', steelHi: '#c0c6ce', steelLo: '#575d66',
  asphalt: '#43434c', asphaltHi: '#55555f', asphaltLo: '#2c2c34',
  wood: '#7a5a3a', woodHi: '#9c7550', woodLo: '#452f1e',
  ink: '#241d28', paper: '#f4f1ea',
  gold: '#ffd24a', green: '#6be585', red: '#c8402c', blue: '#4a86f7', sky: '#8ad8ff',
  vermilion: '#c8402c', vermilionHi: '#e8604a', vermilionLo: '#7a1f14',
  lamp: '#ffe9a8', dim: '#12101c',
};

// ---------- the doors ----------
// One list, because the street, the prompts and the phone's MAPS app all have
// to agree about what is on this road and where. `act` is what the scene's
// use() switches on; `x` is where the door actually is.
const STREET_DOORS = [
  { id: 'capsule', x: 210, act: 'capsule', name: 'ELEVEN HOURS', sub: 'CAPSULE HOTEL - YOUR BED', tint: '#2f4a68', icon: 'bed', walk: 0 },
  { id: 'laundry', x: 620, act: 'laundry', name: 'COIN LAUNDRY', sub: 'OPEN 24H - NOBODY IN IT', tint: '#2f6fc0', icon: 'wash', walk: 0 },
  { id: 'mart', x: 1050, act: 'mart', name: 'COLONY MART', sub: 'RICE BALLS AND SOCKS', tint: '#2f8f4a', icon: 'store', walk: 0 },
  { id: 'barber', x: 1430, act: 'barber', name: 'BARBER SHIMA', sub: 'CUT AND A SHAVE - 1800', tint: '#c8402c', icon: 'cut', walk: 0 },
  { id: 'tonkatsu', x: 1760, act: 'tonkatsu', name: 'TONKATSU AKIYAMA', sub: 'SIX SEATS AND A COUNTER', tint: '#8a4a1c', icon: 'food', walk: 0 },
  { id: 'koban', x: 2200, act: 'koban', name: 'THE KOBAN', sub: 'POLICE BOX - ONE OFFICER', tint: '#2a3a66', icon: 'badge', walk: 0 },
  { id: 'busk', x: 2430, act: 'busk', name: 'THE WIDE BIT', sub: 'BUSKING SPOT BY THE STATION', tint: '#c8a03a', icon: 'music', walk: 0 },
  { id: 'subway', x: 2680, act: 'subway', name: 'THE SUBWAY', sub: 'GREEN LINE - GO ANYWHERE', tint: '#1f6f4a', icon: 'train', walk: 0 },
  { id: 'shrine', x: 2950, act: 'shrine', name: 'THE LITTLE SHRINE', sub: 'ONE COIN. ONE WISH.', tint: '#c8402c', icon: 'torii', walk: 0 },
  { id: 'music', x: 3380, act: 'music', name: 'AMP OFF', sub: 'USED GEAR - SOLD AS SEEN', tint: '#f2c40c', icon: 'amp', walk: 0 },
  { id: 'yakitori', x: 3620, act: 'yakitori', name: 'YAKITORI HACHI', sub: 'SIX STOOLS - OPENS AT FIVE', tint: '#c8602c', icon: 'food', walk: 0 },
  { id: 'crossing', x: 4060, act: 'crossing', name: 'THE LEVEL CROSSING', sub: 'THE END OF THE STREET', tint: '#e8b03a', icon: 'rail', walk: 0 },
];
function streetDoorById(id) {
  for (let i = 0; i < STREET_DOORS.length; i++) if (STREET_DOORS[i].id === id) return STREET_DOORS[i];
  return null;
}
// The music shop is not in the shop catalogue, so it carries its own row. If
// somebody adds an 'ampoff' entry to js/data/shops.js this quietly defers.
const QS_AMPOFF = {
  id: 'ampoff', name: 'AMP OFF', tag: 'USED GEAR. SOLD AS SEEN.', kind: 'music', logo: 'bolt',
  col: '#f2c40c', col2: '#241d28', inner: '#3a3446', w: 240, enter: true,
  blurb: 'Four rooms of other bugs giving up, priced in felt pen and stuck to the neck.',
};
const QS_HOTEL = {
  id: 'elevenhours', name: 'ELEVEN HOURS', tag: 'CAPSULE HOTEL', kind: 'hotel', logo: 'watch',
  col: '#2f4a68', col2: '#f4f1ea', inner: '#1b2a3e',
};

// ---------- light ----------
// One number decides everything: how dark it is, how many windows are on, how
// hard the vending machines have to work, and what colour the air is.
function qsNight(time) { return clamp((time - 0.48) / 0.34, 0, 1); }
function qsDusk(time) { return clamp((time - 0.38) / 0.22, 0, 1); }
// How strongly an artificial light reads against the daylight behind it.
function qsLit(time) { return 0.22 + 0.78 * qsNight(time); }
// A cheap pool of light, pixel-shaped, because the whole game refuses gradients.
function qsGlow(ctx, x, y, rx, ry, col, a) {
  if (a <= 0.004) return;
  ctx.globalAlpha = a; ellipsePx(ctx, x, y, rx, ry, col);
  ctx.globalAlpha = a * 0.55; ellipsePx(ctx, x, y, rx * 0.6, ry * 0.6, col);
  ctx.globalAlpha = 1;
}

// ==========================================================================
//  THE BUILDINGS
// ==========================================================================
// Nothing on this road is above three storeys and nothing was designed. Each
// lot is a concrete or tiled box built right up against the one next to it,
// with the kit of parts every one of them has: a balcony with a futon over the
// rail, a washing pole, two air-con units on brackets, a satellite dish aimed
// at the same bit of sky, a downpipe, and a water tank on the roof.

let _qsLots = null;
function qsLots() {
  if (_qsLots) return _qsLots;
  const r = makeRng(hashStr('quiet-street-lots'));
  const out = [];
  let x = -240;
  while (x < QS_W + 240) {
    const w = r.int(150, 262);
    const storeys = r.chance(0.42) ? 3 : 2;
    out.push({
      x: x, w: w, storeys: storeys,
      style: r.pick(['concrete', 'tile', 'cream', 'concrete', 'tile']),
      seed: r.int(1, 99999),
      stair: r.chance(0.34),          // an external staircase bolted to the side
      tank: storeys === 3 && r.chance(0.55),
      dish: r.chance(0.5),
      top: 455 - (storeys === 3 ? r.int(300, 340) : r.int(200, 236)),
    });
    x += w;
  }
  _qsLots = out;
  return out;
}
// One floor of windows, balcony and all the junk hanging off it.
function qsStorey(ctx, b, fy, fh, idx, t, time) {
  const r = makeRng(b.seed + idx * 7717);
  const night = qsNight(time), lit = qsLit(time);
  const x = b.x, w = b.w;
  // the slab edge between floors, lit on top and dark underneath
  rect(ctx, x, fy, w, 5, QS_PAL.concreteHi);
  rect(ctx, x, fy + 5, w, 3, QS_PAL.concreteLo);
  // the windows: two or three per lot, sliding aluminium, half of them with
  // the curtain shut and a television going behind it
  const n = w > 210 ? 3 : 2;
  const pitch = w / n;
  for (let i = 0; i < n; i++) {
    const wx = Math.round(x + pitch * i + pitch * 0.16);
    const ww = Math.round(pitch * 0.46), wh = Math.round(fh * 0.46);
    const wy = Math.round(fy + fh * 0.22);
    const on = r.chance(0.55) && night > 0.15;
    const tv = on && r.chance(0.3);
    rect(ctx, wx - 3, wy - 3, ww + 6, wh + 6, darken(QS_PAL.concrete, 0.3));
    rect(ctx, wx, wy, ww, wh, on ? '#3a3020' : '#232833');
    if (on) {
      const warm = tv ? (Math.sin(t * 9 + i) > 0.2 ? '#8ad8ff' : '#5a86c0') : '#ffdca0';
      ctx.globalAlpha = 0.5 + 0.5 * night;
      rect(ctx, wx + 1, wy + 1, ww - 2, wh - 2, warm);
      ctx.globalAlpha = 1;
      // the curtain, drawn most of the way across, which is most of the light
      if (r.chance(0.6)) { ctx.globalAlpha = 0.72; rect(ctx, wx + 1, wy + 1, Math.round(ww * 0.62), wh - 2, '#e8e2d2'); ctx.globalAlpha = 1; }
      qsGlow(ctx, wx + ww / 2, wy + wh / 2, ww * 1.3, wh * 1.1, warm, 0.1 * night);
    } else {
      // daylight: glass is just a cold reflection of the sky and the roofline
      ctx.globalAlpha = 0.3; rect(ctx, wx + 1, wy + 1, ww - 2, Math.round(wh * 0.42), '#9fc4e0'); ctx.globalAlpha = 1;
    }
    // the aluminium slider bar and the frame, always the same grey
    rect(ctx, wx + Math.round(ww / 2) - 1, wy, 2, wh, QS_PAL.steel);
    frame(ctx, wx, wy, ww, wh, QS_PAL.steelLo);
    rect(ctx, wx, wy, ww, 1, QS_PAL.steelHi);
  }
  // the balcony: a concrete lip, a steel rail, a futon over it and a pole
  if (idx > 0 || b.storeys === 2) {
    const by = Math.round(fy + fh * 0.78);
    rect(ctx, x + 6, by, w - 12, 6, QS_PAL.concrete);
    rect(ctx, x + 6, by, w - 12, 2, QS_PAL.concreteHi);
    rect(ctx, x + 6, by + 6, w - 12, 3, QS_PAL.concreteLo);
    // the rail, drawn as uprights so it reads as steel and not a block
    for (let i = x + 10; i < x + w - 10; i += 9) rect(ctx, i, by - 16, 2, 16, QS_PAL.steelLo);
    rect(ctx, x + 8, by - 18, w - 16, 3, QS_PAL.steel);
    rect(ctx, x + 8, by - 18, w - 16, 1, QS_PAL.steelHi);
    // a futon, folded over the rail to air, which is the single most Japanese
    // thing a building can have on it at eight in the morning
    if (r.chance(0.6)) {
      const fw = r.int(46, 74), fx = Math.round(x + 18 + r.range(0, Math.max(4, w - 40 - fw)));
      const fc = r.pick(['#d8d2c4', '#c8a8b8', '#a8bcd0', '#e0d0a0']);
      rect(ctx, fx, by - 22, fw, 26, fc);
      rect(ctx, fx, by - 22, fw, 3, lighten(fc, 0.3));
      rect(ctx, fx, by + 1, fw, 3, darken(fc, 0.28));
      for (let i = 0; i < fw; i += 11) rect(ctx, fx + i, by - 20, 1, 22, darken(fc, 0.14));
    }
    // the washing pole: two brackets and a bamboo-coloured rod with shirts on it
    if (r.chance(0.55)) {
      const py = by - 34;
      rect(ctx, x + 12, py - 6, 3, 10, QS_PAL.steelLo);
      rect(ctx, x + w - 15, py - 6, 3, 10, QS_PAL.steelLo);
      rect(ctx, x + 12, py, w - 24, 3, '#c8b078');
      rect(ctx, x + 12, py, w - 24, 1, '#e0cc98');
      const items = r.int(2, 5);
      for (let i = 0; i < items; i++) {
        const ix = Math.round(x + 24 + i * ((w - 50) / items));
        const ic = r.pick(['#f4f1ea', '#8ad8ff', '#e8e2d2', '#c8402c', '#3a4a6a']);
        const ih = r.int(14, 24), iw = r.int(10, 16);
        const sway = Math.sin(t * 1.1 + i + b.seed) * 1.2;
        rect(ctx, ix + sway, py + 3, iw, ih, ic);
        rect(ctx, ix + sway, py + 3, iw, 2, lighten(ic, 0.3));
        rect(ctx, ix + sway + 1, py + 1, 2, 3, QS_PAL.steelLo);   // the peg
        rect(ctx, ix + sway + iw - 3, py + 1, 2, 3, QS_PAL.steelLo);
      }
    }
    // the air-con unit and its bracket, and the pipe taped down the wall
    if (r.chance(0.7)) {
      const ax = Math.round(x + w - r.int(40, 70)), ay = Math.round(fy + fh * 0.3);
      rect(ctx, ax, ay, 30, 20, '#d8d4c8');
      rect(ctx, ax, ay, 30, 3, '#eeeae0');
      rect(ctx, ax, ay + 17, 30, 3, '#9a968c');
      for (let i = 0; i < 5; i++) rect(ctx, ax + 4, ay + 5 + i * 3, 22, 1, '#a8a49a');
      rect(ctx, ax - 3, ay + 20, 5, 6, QS_PAL.steelLo);
      rect(ctx, ax + 28, ay + 20, 5, 6, QS_PAL.steelLo);
      // the drain pipe, wrapped in grey tape, running down and off to nowhere
      rect(ctx, ax + 26, ay + 20, 3, fh * 0.6, '#b8b4a8');
    }
  }
}
// A whole lot: ground floor recess, storeys, roof, parapet, tank, dish.
function qsLot(ctx, b, t, time) {
  const r = makeRng(b.seed);
  const body = b.style === 'tile' ? QS_PAL.tileWall : b.style === 'cream' ? QS_PAL.cream : QS_PAL.concrete;
  const hi = b.style === 'tile' ? QS_PAL.tileHi : b.style === 'cream' ? QS_PAL.creamHi : QS_PAL.concreteHi;
  const lo = b.style === 'tile' ? QS_PAL.tileLo : b.style === 'cream' ? QS_PAL.creamLo : QS_PAL.concreteLo;
  const top = b.top, base = QS_Y;
  rect(ctx, b.x, top, b.w, base - top, body);
  rect(ctx, b.x, top, b.w, 4, hi);
  // the party wall each side, because these are built touching
  rect(ctx, b.x, top, 3, base - top, lo);
  rect(ctx, b.x + b.w - 3, top, 3, base - top, darken(body, 0.2));
  // tile buildings get their tiles, and the grout line is the whole look
  if (b.style === 'tile') {
    ctx.globalAlpha = 0.16;
    for (let y = top + 8; y < base; y += 12) rect(ctx, b.x + 3, y, b.w - 6, 1, '#000');
    for (let x = b.x + 3; x < b.x + b.w - 3; x += 12) rect(ctx, x, top + 4, 1, base - top - 4, '#000');
    ctx.globalAlpha = 1;
  } else {
    // concrete: the shutter joints and the rain streaks under every sill
    ctx.globalAlpha = 0.1;
    for (let y = top + 22; y < base; y += 46) rect(ctx, b.x + 3, y, b.w - 6, 1, '#000');
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 5; i++) rect(ctx, b.x + 14 + ((b.seed + i * 37) % (b.w - 30)), top + 10, 3, base - top - 40, '#1a1a20');
    ctx.globalAlpha = 1;
  }
  // the storeys above the shopfronts
  const gh = 92;                       // the ground floor the shops live in
  const upper = base - gh - top;
  const per = upper / b.storeys;
  for (let i = 0; i < b.storeys; i++) qsStorey(ctx, b, top + i * per, per, i, t, time);
  // the ground floor, left dark: whatever is in it gets drawn over the top
  rect(ctx, b.x + 3, base - gh, b.w - 6, gh, darken(body, 0.45));
  rect(ctx, b.x + 3, base - gh, b.w - 6, 4, darken(body, 0.25));
  // the tiled skirt everything down here has, up to knee height
  rect(ctx, b.x + 3, base - 22, b.w - 6, 22, darken(body, 0.55));
  ctx.globalAlpha = 0.2;
  for (let x = b.x + 6; x < b.x + b.w - 6; x += 10) rect(ctx, x, base - 22, 1, 22, '#000');
  ctx.globalAlpha = 1;
  // the parapet, and the mess on the roof
  rect(ctx, b.x - 2, top - 12, b.w + 4, 12, body);
  rect(ctx, b.x - 2, top - 12, b.w + 4, 3, hi);
  rect(ctx, b.x - 2, top - 1, b.w + 4, 3, lo);
  if (b.tank) {
    // the water tank on legs, which is every skyline in this city
    const tx = b.x + Math.round(b.w * 0.6), ty = top - 44;
    for (let i = 0; i < 4; i++) rect(ctx, tx - 20 + i * 13, ty + 22, 3, 12, QS_PAL.steelLo);
    rect(ctx, tx - 24, ty, 52, 24, '#9aa0a8');
    rect(ctx, tx - 24, ty, 52, 3, '#c4cad2');
    rect(ctx, tx - 24, ty + 21, 52, 3, '#6a7079');
    rect(ctx, tx - 6, ty - 6, 12, 6, '#7a8088');
  }
  if (b.dish) {
    const dx = b.x + Math.round(b.w * 0.24), dy = top - 20;
    rect(ctx, dx, dy, 3, 20, QS_PAL.steelLo);
    ellipsePx(ctx, dx + 7, dy - 3, 10, 9, '#d8d4c8');
    ellipsePx(ctx, dx + 8, dy - 3, 7, 6, '#b0aca0');
    rect(ctx, dx + 1, dy - 5, 8, 2, QS_PAL.steelLo);
  }
  // a TV aerial, bent, on the ones with no dish
  if (!b.dish && r.chance(0.6)) {
    const ax = b.x + Math.round(b.w * 0.34);
    rect(ctx, ax, top - 34, 2, 34, '#5a5a62');
    for (let i = 0; i < 4; i++) rect(ctx, ax - 8 - i, top - 32 + i * 6, 18 + i * 2, 1, '#5a5a62');
  }
  // the external staircase: steel, zigzagging up the side, rust at the bolts
  if (b.stair) {
    const sx = b.x + b.w - 34;
    const runs = b.storeys;
    for (let i = 0; i < runs; i++) {
      const y0 = base - gh - i * per, y1 = y0 - per;
      const dir = i % 2 ? -1 : 1;
      for (let s = 0; s < 9; s++) {
        const k = s / 9;
        const px2 = dir > 0 ? sx + k * 28 : sx + 28 - k * 28;
        rect(ctx, Math.round(px2), Math.round(lerp(y0, y1, k)), 5, 3, QS_PAL.steel);
        rect(ctx, Math.round(px2), Math.round(lerp(y0, y1, k)), 5, 1, QS_PAL.steelHi);
      }
      // the handrail, one line, and the landing at the top of the run
      line(ctx, sx + (dir > 0 ? 0 : 28), y0 - 26, sx + (dir > 0 ? 28 : 0), y1 - 26, QS_PAL.steelLo);
      rect(ctx, sx - 4, Math.round(y1) - 3, 36, 4, QS_PAL.steel);
      ctx.globalAlpha = 0.3; rect(ctx, sx - 4, Math.round(y1) + 1, 36, 2, '#8a5a2a'); ctx.globalAlpha = 1;
    }
  }
  // the downpipe, grey plastic, clipped to the wall every metre
  const px3 = b.x + 5;
  rect(ctx, px3, top - 10, 4, base - top + 8, '#a8a49a');
  rect(ctx, px3, top - 10, 1, base - top + 8, '#c8c4ba');
  for (let y = top; y < base - 30; y += 44) rect(ctx, px3 - 1, y, 6, 3, '#7a7670');
}

// ==========================================================================
//  THE WIRES
// ==========================================================================
// The reason a Japanese back street looks like a Japanese back street is that
// nobody buried the cables. Concrete poles every thirty metres, two grey
// transformer cans bolted near the top, a crossarm with white insulators on
// it, and then eleven separate wires going off in six directions, sagging.

const QS_POLE_GAP = 296;
function qsPoleX(i) { return -120 + i * QS_POLE_GAP; }
function qsPoleCount() { return Math.ceil((QS_W + 320) / QS_POLE_GAP) + 1; }

function qsPole(ctx, x, t, time) {
  const base = QS_Y, top = 96;
  // the pole itself, tapered by drawing it as two widths
  rect(ctx, x - 6, top + 40, 12, base - top - 40, '#9a968c');
  rect(ctx, x - 5, top, 10, 48, '#a8a49a');
  rect(ctx, x - 6, top, 3, base - top, '#c0bcb0');
  rect(ctx, x + 3, top, 3, base - top, '#6f6b62');
  // the maker's plate and the number every pole has stapled to it
  rect(ctx, x - 5, base - 150, 10, 22, '#e8e2d2');
  ctx.globalAlpha = 0.7;
  drawText(ctx, '4', x, base - 146, '#3a3444', { align: 'center', font: 'small' });
  drawText(ctx, '7', x, base - 138, '#3a3444', { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
  // the two transformer cans, which are the heaviest thing up there
  rect(ctx, x - 22, top + 18, 17, 30, '#8a8f98');
  rect(ctx, x - 22, top + 18, 17, 3, '#b6bcc4');
  rect(ctx, x - 22, top + 45, 17, 3, '#5a606a');
  rect(ctx, x + 6, top + 22, 17, 30, '#8a8f98');
  rect(ctx, x + 6, top + 22, 17, 3, '#b6bcc4');
  rect(ctx, x + 6, top + 49, 17, 3, '#5a606a');
  // the crossarms and the insulators sat on them like eggs
  for (let a = 0; a < 2; a++) {
    const ay = top + 4 + a * 26;
    rect(ctx, x - 34, ay, 68, 4, '#7a746a');
    rect(ctx, x - 34, ay, 68, 1, '#a09a90');
    for (let i = -1; i <= 1; i++) {
      const ix = x + i * 24;
      rect(ctx, ix - 3, ay - 6, 6, 6, '#c8c4b8');
      rect(ctx, ix - 4, ay - 8, 8, 3, '#e0dcd0');
    }
  }
  // the streetlight on its bent arm, and what it does to the road at night
  const lamp = qsLit(time);
  rect(ctx, x + 5, top + 58, 26, 3, '#7a746a');
  rect(ctx, x + 28, top + 58, 4, 10, '#7a746a');
  rect(ctx, x + 22, top + 66, 16, 6, '#6a655c');
  ctx.globalAlpha = 0.4 + 0.6 * lamp;
  rect(ctx, x + 24, top + 71, 12, 3, '#ffeec4');
  ctx.globalAlpha = 1;
  qsGlow(ctx, x + 30, top + 78, 34, 22, QS_PAL.lamp, 0.14 * lamp);
  qsGlow(ctx, x + 30, QS_Y - 4, 74, 16, QS_PAL.lamp, 0.13 * lamp);
}
// One span of cable between two poles, sagging, drawn as flat segments.
function qsCable(ctx, x0, y0, x1, y1, sag, col, w) {
  const n = 10;
  let px0 = x0, py0 = y0;
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    const px1 = lerp(x0, x1, k);
    const py1 = lerp(y0, y1, k) + Math.sin(Math.PI * k) * sag;
    rect(ctx, Math.round(Math.min(px0, px1)), Math.round(Math.min(py0, py1)), Math.max(1, Math.abs(px1 - px0)), Math.max(w || 1, Math.abs(py1 - py0)), col);
    px0 = px1; py0 = py1;
  }
}
// The wires behind the poles: the fat ones, high up, going the length of the
// street with a different sag on every line.
function qsWiresBack(ctx, x0, x1, t) {
  const i0 = Math.max(0, Math.floor((x0 + 120) / QS_POLE_GAP) - 1);
  const i1 = Math.min(qsPoleCount(), Math.ceil((x1 + 120) / QS_POLE_GAP) + 1);
  for (let i = i0; i < i1; i++) {
    const a = qsPoleX(i), b = qsPoleX(i + 1);
    for (let k = 0; k < 4; k++) {
      const y = 100 + k * 9;
      qsCable(ctx, a, y, b, y, 12 + k * 4, '#2a2630', 2);
    }
    for (let k = 0; k < 3; k++) {
      const y = 132 + k * 7;
      qsCable(ctx, a, y, b, y, 18 + k * 5, '#332f3a', 1);
    }
    // the drop into somebody's house, which is what makes it a tangle
    if ((i % 3) === 1) qsCable(ctx, a + 8, 128, a + 90, 196, 10, '#332f3a', 1);
  }
}
// The wires in FRONT of everything, low across the frame. This is the one
// thing that sells the whole street, so it gets drawn last and stays dark.
function qsWiresFront(ctx, x0, x1, t) {
  const i0 = Math.max(0, Math.floor((x0 + 120) / QS_POLE_GAP) - 1);
  const i1 = Math.min(qsPoleCount(), Math.ceil((x1 + 120) / QS_POLE_GAP) + 1);
  for (let i = i0; i < i1; i++) {
    const a = qsPoleX(i), b = qsPoleX(i + 1);
    qsCable(ctx, a, 158, b, 158, 26, '#1b1822', 2);
    qsCable(ctx, a, 170, b, 170, 34, '#1b1822', 2);
  }
}
// A crow. It has been on that wire since before you got here and it will be
// there when you leave. Every so often it shuffles two inches along.
function qsCrow(ctx, x, y, t) {
  const shuffle = Math.round(Math.sin(t * 0.21) * 4);
  const cx = Math.round(x + shuffle);
  const flap = Math.sin(t * 0.6) > 0.985 ? 1 : 0;
  const body = '#14121a', sheen = '#2e2a3c';
  ellipsePx(ctx, cx, y - 7, 7, 6, body);
  ellipsePx(ctx, cx - 2, y - 9, 4, 3, sheen);
  ellipsePx(ctx, cx + 5, y - 12, 4, 4, body);            // the head
  rect(ctx, cx + 8, y - 12, 5, 2, '#3a3444');             // the beak
  px(ctx, cx + 6, y - 13, '#8a8478');                     // the one white eye pixel
  if (flap) { rect(ctx, cx - 8, y - 16, 12, 3, body); rect(ctx, cx - 10, y - 14, 10, 2, sheen); }
  else rect(ctx, cx - 7, y - 8, 9, 3, sheen);
  rect(ctx, cx - 10, y - 6, 8, 2, body);                  // the tail
  rect(ctx, cx - 1, y - 2, 1, 3, '#5a5464'); rect(ctx, cx + 2, y - 2, 1, 3, '#5a5464');
}

// ==========================================================================
//  THE GROUND
// ==========================================================================
// No kerb. The road is the pavement is the road, with a white line painted a
// foot from the wall and a concrete drainage channel outside that. You walk
// down the middle of it and step aside for a van once an hour.
function qsGround(ctx, x0, x1, t, time) {
  const y = QS_Y;
  vgrad(ctx, x0, y, x1 - x0, 130, QS_PAL.asphalt, QS_PAL.asphaltLo);
  rect(ctx, x0, y, x1 - x0, 2, QS_PAL.asphaltHi);
  // the asphalt is patched, and every patch is a slightly different grey
  const r = makeRng(4242);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 40; i++) {
    const px2 = x0 + ((r.range(0, QS_W) + 0) % Math.max(1, x1 - x0));
    rect(ctx, px2, y + r.range(10, 70), r.range(30, 110), r.range(5, 14), r.pick(['#3c3c46', '#4a4a54', '#37373f']));
  }
  ctx.globalAlpha = 1;
  // the white edge line, worn through where the tyres run
  for (let x = Math.floor(x0 / 8) * 8; x < x1; x += 8) {
    ctx.globalAlpha = ((x / 8) | 0) % 7 === 3 ? 0.3 : 0.75;
    rect(ctx, x, y + 26, 7, 3, '#ded8c8');
    ctx.globalAlpha = 1;
  }
  // the drainage channel: a concrete gutter with a steel grate every so often
  rect(ctx, x0, y + 4, x1 - x0, 16, '#9a968c');
  rect(ctx, x0, y + 4, x1 - x0, 2, '#b8b4a8');
  rect(ctx, x0, y + 18, x1 - x0, 3, '#5f5b52');
  rect(ctx, x0, y + 8, x1 - x0, 9, '#6a665e');
  ctx.globalAlpha = 0.3;
  for (let x = Math.floor(x0 / 60) * 60; x < x1; x += 60) rect(ctx, x, y + 9, 40, 2, '#2a2a30');
  ctx.globalAlpha = 1;
  // water in the bottom of it, catching whatever light there is
  ctx.globalAlpha = 0.18;
  for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) rect(ctx, x + ((t * 3) % 9), y + 14, 14, 2, '#8ad8ff');
  ctx.globalAlpha = 1;
  // and moss, in the corner, where it always is
  ctx.globalAlpha = 0.35;
  for (let x = Math.floor(x0 / 120) * 120; x < x1; x += 120) rect(ctx, x + 12, y + 16, 26, 4, '#3f6a3a');
  ctx.globalAlpha = 1;
  // manhole covers and the painted kana telling you to stop at the end
  for (let i = 0; i < 16; i++) {
    const mx = 180 + i * 268;
    if (mx < x0 - 40 || mx > x1 + 40) continue;
    ellipsePx(ctx, mx, y + 58, 17, 6, '#39393f');
    ellipsePx(ctx, mx, y + 57, 15, 5, '#45454c');
    ctx.globalAlpha = 0.3;
    for (let k = -2; k <= 2; k++) rect(ctx, mx - 13, y + 55 + k * 2, 26, 1, '#2a2a30');
    ctx.globalAlpha = 1;
  }
  // STOP, painted on the road in a language you cannot read yet
  for (let i = 0; i < 4; i++) {
    const sx = 520 + i * 1100;
    if (sx < x0 - 120 || sx > x1 + 120) continue;
    ctx.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) drawKanaBlock(ctx, sx + k * 30, y + 74, 24, '#e8e2d2', k + 2);
    ctx.globalAlpha = 1;
  }
  // the night grade on the tarmac: wet-looking, because it always looks wet
  const night = qsNight(time);
  if (night > 0.05) { ctx.globalAlpha = 0.16 * night; rect(ctx, x0, y, x1 - x0, 130, '#1a2038'); ctx.globalAlpha = 1; }
}
// Potted plants. There is no door on this street without three of them.
function qsPots(ctx, x, n, seed, t) {
  const r = makeRng(seed);
  for (let i = 0; i < n; i++) {
    const px2 = Math.round(x + i * r.int(18, 26));
    const ph = r.int(14, 22), pw = r.int(13, 19);
    const col = r.pick(['#8a5f3a', '#6a6a72', '#a86a4a', '#5a6a5a']);
    ctx.globalAlpha = 0.26; ellipsePx(ctx, px2, QS_Y + 1, pw * 0.6, 4, '#000'); ctx.globalAlpha = 1;
    rect(ctx, px2 - pw / 2, QS_Y - ph, pw, ph, col);
    rect(ctx, px2 - pw / 2, QS_Y - ph, pw, 3, lighten(col, 0.3));
    rect(ctx, px2 - pw / 2, QS_Y - 3, pw, 3, darken(col, 0.35));
    // whatever is in it: a spindly thing, a fat succulent, or a dead stick
    const kind = r.int(0, 2);
    if (kind === 0) {
      for (let k = 0; k < 7; k++) {
        const a = k * 0.85 + r.range(0, 0.4);
        ellipsePx(ctx, px2 + Math.cos(a) * pw * 0.45, QS_Y - ph - 5 - Math.abs(Math.sin(a)) * 12, 6, 4, k % 2 ? '#2f7a4a' : '#43a85c');
      }
    } else if (kind === 1) {
      ellipsePx(ctx, px2, QS_Y - ph - 7, pw * 0.5, 9, '#3f8f5a');
      ellipsePx(ctx, px2 - 2, QS_Y - ph - 9, pw * 0.28, 5, '#63b878');
    } else {
      rect(ctx, px2 - 1, QS_Y - ph - 16, 2, 16, '#7a6a52');
      rect(ctx, px2 - 6, QS_Y - ph - 12, 5, 1, '#7a6a52');
      rect(ctx, px2 + 1, QS_Y - ph - 15, 5, 1, '#7a6a52');
    }
  }
}

// ==========================================================================
//  THE THINGS ON THE GROUND FLOOR
// ==========================================================================
// Every shopfront here is the same three moves: a dark recess, something lit
// inside it, and a sign that has been there longer than the shop has been
// good. What changes is the material and how tired it is.

// A noren: the split curtain hung in a doorway, which means OPEN and nothing
// else. When it is down the place is shut and everybody knows it.
function qsNoren(ctx, x, y, w, h, col, t, seed) {
  const n = 3, pw = Math.floor(w / n) - 2;
  rect(ctx, x - 2, y - 3, w + 4, 4, '#3a2f22');
  for (let i = 0; i < n; i++) {
    const sway = Math.sin(t * 1.3 + i * 1.7 + (seed || 0)) * 1.5;
    const px2 = Math.round(x + i * (pw + 3) + sway);
    rect(ctx, px2, y, pw, h, col);
    rect(ctx, px2, y, pw, 3, lighten(col, 0.28));
    rect(ctx, px2, y + h - 3, pw, 3, darken(col, 0.3));
    ctx.globalAlpha = 0.85;
    drawKanaBlock(ctx, px2 + Math.round(pw / 2) - 6, y + Math.round(h * 0.3), 12, '#f4f1ea', i + (seed || 0));
    ctx.globalAlpha = 1;
  }
}
// A paper lantern. Off in the day, a small orange sun at night.
function qsLantern(ctx, x, y, s, t, time, col) {
  const lit = qsLit(time);
  const c = col || '#e8503a';
  rect(ctx, x - 1, y - s - 6, 2, 7, '#3a2f22');
  ellipsePx(ctx, x, y, s * 0.62, s, lit > 0.45 ? '#ffd8a0' : '#d8cdb8');
  ctx.globalAlpha = 0.5;
  for (let i = -2; i <= 2; i++) ellipsePx(ctx, x, y + i * Math.round(s * 0.34), s * 0.62, 1, '#a89878');
  ctx.globalAlpha = 1;
  rect(ctx, x - Math.round(s * 0.34), y - s, Math.round(s * 0.68), 3, '#3a2f22');
  rect(ctx, x - Math.round(s * 0.34), y + s - 3, Math.round(s * 0.68), 3, '#3a2f22');
  ctx.globalAlpha = 0.8;
  drawKanaBlock(ctx, x - 5, y - 6, 11, c, 3);
  ctx.globalAlpha = 1;
  qsGlow(ctx, x, y, s * 2.2, s * 2, '#ffb460', 0.2 * lit);
}
// A hand-painted signboard bolted flat to the wall over a door.
function qsSignBoard(ctx, x, y, w, h, text, col, ink, t, time) {
  rect(ctx, x, y, w, h, darken(col, 0.4));
  rect(ctx, x + 2, y + 2, w - 4, h - 4, col);
  rect(ctx, x + 2, y + 2, w - 4, 2, lighten(col, 0.3));
  rect(ctx, x + 2, y + h - 4, w - 4, 2, darken(col, 0.25));
  const sc = h > 30 ? 2 : 1;
  drawText(ctx, text, x + w / 2, y + Math.round(h / 2) - (sc === 2 ? 7 : 4), ink, { align: 'center', scale: sc, font: sc === 1 ? 'small' : undefined });
  // the strip light under it, which is the only reason you can read it at all
  const lit = qsLit(time);
  ctx.globalAlpha = 0.3 + 0.5 * lit;
  rect(ctx, x + 6, y + h, w - 12, 2, '#ffeec4');
  ctx.globalAlpha = 1;
  qsGlow(ctx, x + w / 2, y + h + 8, w * 0.5, 12, QS_PAL.lamp, 0.13 * lit);
}
// The shutter. Corrugated steel, rust at the bottom, a padlock through the
// hasp, and the ghost of a sign for a shop that closed before you landed.
function qsShutterFront(ctx, x, base, w, h, t, time) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#4a4a52');
  rect(ctx, x + 4, top + 26, w - 8, h - 30, '#7a766e');
  for (let i = top + 28; i < base - 4; i += 6) {
    rect(ctx, x + 4, i, w - 8, 3, '#8f8a80');
    rect(ctx, x + 4, i + 3, w - 8, 3, '#625e58');
  }
  // rust, creeping up from the road, and a run of it under the lock
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 9; i++) rect(ctx, x + 8 + i * ((w - 20) / 9), base - 26 - (i % 3) * 7, 10, 26 + (i % 3) * 7, '#8a5024');
  ctx.globalAlpha = 1;
  rect(ctx, x + w / 2 - 12, base - 22, 24, 12, '#3a3a42');
  rect(ctx, x + w / 2 - 4, base - 28, 8, 8, '#9a9aa2');
  // the stickers nobody has scraped off
  const r = makeRng(hashStr('shut' + x));
  for (let i = 0; i < 5; i++) {
    const sx = x + 10 + r.range(0, w - 40), sy = top + 40 + r.range(0, h - 80);
    const c = r.pick(['#e8503a', '#f2c94c', '#8ad8ff', '#f4f1ea']);
    rect(ctx, sx, sy, r.int(14, 26), r.int(9, 14), c);
    ctx.globalAlpha = 0.5; rect(ctx, sx, sy, 18, 2, '#fff'); ctx.globalAlpha = 1;
  }
  // the old sign: lettering gone, plastic gone yellow, one tube still in it
  rect(ctx, x, top, w, 26, '#3a3640');
  rect(ctx, x + 3, top + 3, w - 6, 20, '#a89c72');
  ctx.globalAlpha = 0.42;
  for (let i = 0; i < 4; i++) drawKanaBlock(ctx, x + 14 + i * 20, top + 7, 13, '#5a4e38', i);
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.2; rect(ctx, x + 3, top + 3, w - 6, 20, '#2a2620'); ctx.globalAlpha = 1;
  // a pile of junk mail wedged behind the downpipe
  rect(ctx, x + 10, base - 12, 22, 12, '#e8e2d2');
  rect(ctx, x + 12, base - 16, 20, 5, '#d8d2c4');
}
// The laundrette. Always lit, never anybody in it, and the one warm rectangle
// on this street at four in the morning.
function qsLaundry(ctx, x, base, w, h, t, time, S) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#2a3040');
  rect(ctx, x + 4, top + 34, w - 8, h - 38, '#e8ecf0');
  // the fluorescent ceiling, three tubes, one of them going
  for (let i = 0; i < 3; i++) {
    const bad = i === 1 && Math.sin(t * 27) < -0.8;
    ctx.globalAlpha = bad ? 0.35 : 1;
    rect(ctx, x + 12 + i * ((w - 30) / 3), top + 38, Math.round((w - 40) / 3), 4, '#ffffff');
    ctx.globalAlpha = 1;
  }
  // the machines: a row of front loaders with round doors, one of them turning
  const n = Math.max(3, Math.floor((w - 24) / 46));
  for (let i = 0; i < n; i++) {
    const mx = Math.round(x + 12 + i * ((w - 24) / n)), mw = Math.round((w - 24) / n) - 6;
    rect(ctx, mx, base - 78, mw, 74, '#d8dce0');
    rect(ctx, mx, base - 78, mw, 3, '#f4f6f8');
    rect(ctx, mx, base - 8, mw, 4, '#9aa0a6');
    rect(ctx, mx + 2, base - 74, mw - 4, 12, '#b4bac0');
    circle(ctx, mx + mw / 2, base - 40, Math.min(15, mw * 0.36), '#8a9098');
    circle(ctx, mx + mw / 2, base - 40, Math.min(13, mw * 0.3), '#1b2230');
    // the drum going round, seen as a slow smear of somebody's washing
    if (i === 1) {
      const a = t * 2.2;
      for (let k = 0; k < 3; k++) {
        const aa = a + k * 2.1;
        ellipsePx(ctx, mx + mw / 2 + Math.cos(aa) * 6, base - 40 + Math.sin(aa) * 6, 5, 4, ['#8ad8ff', '#e8503a', '#f4f1ea'][k]);
      }
      ctx.globalAlpha = 0.25; circle(ctx, mx + mw / 2, base - 40, Math.min(13, mw * 0.3), '#bfe0ff'); ctx.globalAlpha = 1;
    }
    // the coin slot, lit green if it is free
    rect(ctx, mx + 4, base - 70, 8, 3, '#3a4048');
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i);
    rect(ctx, mx + mw - 10, base - 70, 4, 3, i === 1 ? '#e8503a' : '#6be585');
    ctx.globalAlpha = 1;
  }
  // a plastic chair and a magazine somebody left open on it in 2019
  rect(ctx, x + w - 44, base - 34, 26, 5, '#3f6a9a');
  rect(ctx, x + w - 44, base - 52, 5, 22, '#3f6a9a');
  rect(ctx, x + w - 42, base - 29, 4, 25, '#8a8f98');
  rect(ctx, x + w - 25, base - 29, 4, 25, '#8a8f98');
  rect(ctx, x + w - 42, base - 38, 20, 5, '#e8e2d2');
  // the glass, the frame, and the blue sign over it
  ctx.globalAlpha = 0.14; rect(ctx, x + 4, top + 34, w - 8, h - 38, '#bfe0ff'); ctx.globalAlpha = 1;
  // the diagonal streaks on the glass, cut as scanlines so the edges stay hard
  for (let i = 40; i < w; i += 58) {
    ctx.globalAlpha = 0.1;
    for (let gy = top + 34; gy < base - 6; gy += 2) {
      const k = (base - 6 - gy) / Math.max(1, base - 40 - top);
      rect(ctx, x + i + k * (h - 44) * 0.5, gy, 11, 2, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
  rect(ctx, x + 4, top + 34, w - 8, 3, '#8a939e');
  rect(ctx, x + w / 2 - 22, top + 34, 3, h - 38, '#8a939e');
  qsSignBoard(ctx, x, top, w, 30, 'COIN LAUNDRY', '#2f6fc0', '#f4f1ea', t, time);
  qsGlow(ctx, x + w / 2, base - 30, w * 0.72, 56, '#dfeaff', 0.12 + 0.2 * qsNight(time));
}
// The barber. The pole is the whole business: three stripes going up forever
// and never arriving, which is the best sign anybody ever designed.
function qsBarberPole(ctx, x, y, t, time) {
  rect(ctx, x - 7, y - 4, 14, 5, '#8a8f98');
  rect(ctx, x - 7, y + 48, 14, 5, '#8a8f98');
  rect(ctx, x - 6, y, 12, 48, '#f4f1ea');
  const off = (t * 17) % 12;
  for (let i = -12; i < 52; i += 12) {
    for (let k = 0; k < 4; k++) {
      const yy = y + i + off + k;
      if (yy < y || yy > y + 47) continue;
      rect(ctx, x - 6, yy, 12, 1, '#c8402c');
      rect(ctx, x - 6, yy + 4, 12, 1, '#2f4a9a');
    }
  }
  ctx.globalAlpha = 0.22; rect(ctx, x - 6, y, 4, 48, '#ffffff'); ctx.globalAlpha = 1;
  frame(ctx, x - 7, y - 1, 14, 50, '#6a6f78');
  qsGlow(ctx, x, y + 24, 22, 32, '#ffd8c8', 0.16 * qsLit(time));
}
function qsBarber(ctx, x, base, w, h, t, time) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#3a2f2a');
  rect(ctx, x + 5, top + 30, w - 10, h - 34, '#e0d8c8');
  // inside: one chair, one mirror, one barber standing doing nothing
  rect(ctx, x + 10, top + 36, w - 20, h - 46, '#c8bca8');
  rect(ctx, x + 16, top + 44, Math.round(w * 0.32), Math.round(h * 0.3), '#9fb4c4');
  frame(ctx, x + 16, top + 44, Math.round(w * 0.32), Math.round(h * 0.3), '#8a7a5e');
  rect(ctx, x + w / 2 - 14, base - 48, 28, 10, '#6a3a30');
  rect(ctx, x + w / 2 - 4, base - 38, 8, 34, '#8a8f98');
  rect(ctx, x + w / 2 - 14, base - 6, 28, 4, '#6a6f78');
  rect(ctx, x + w / 2 - 16, base - 66, 32, 20, '#6a3a30');
  const sp = cachedBrandStaff({ name: 'BARBER SHIMA' });
  drawBugAt(ctx, sp, x + w * 0.74, base - 6, { pose: Math.floor(t * 0.7) % 2 ? 'idle' : 'talk', scale: 1.15, bounce: 0.3, phase: x * 0.01 });
  ctx.globalAlpha = 0.16; rect(ctx, x + 5, top + 30, w - 10, h - 34, '#bfe0ff'); ctx.globalAlpha = 1;
  rect(ctx, x + 5, top + 30, w - 10, 3, '#8a939e');
  qsSignBoard(ctx, x, top, w, 28, 'BARBER SHIMA', '#8a2a1c', '#f4f1ea', t, time);
  qsBarberPole(ctx, x + w + 12, base - 74, t, time);
}

// Tonkatsu Akiyama. Six seats, one fryer, a man who has made the same thing
// forty thousand times and would like you to eat it while it is hot.
function qsTonkatsu(ctx, x, base, w, h, t, time, S) {
  const top = base - h;
  // the timber front, dark, oiled by forty years of frying
  rect(ctx, x, top, w, h, QS_PAL.woodLo);
  rect(ctx, x + 4, top + 34, w - 8, h - 38, '#2a1f18');
  for (let i = x + 4; i < x + w - 4; i += 14) rect(ctx, i, top + 34, 2, h - 38, '#3a2c20');
  // the lit doorway and the counter inside it
  const dx = x + 16, dw = w - 32;
  rect(ctx, dx, base - 96, dw, 92, '#3f2e1e');
  rect(ctx, dx + 4, base - 92, dw - 8, 88, '#6a4a2e');
  ctx.globalAlpha = 0.35; rect(ctx, dx + 4, base - 92, dw - 8, 88, '#ffb460'); ctx.globalAlpha = 1;
  rect(ctx, dx + 8, base - 46, dw - 16, 8, '#a8784a');
  rect(ctx, dx + 8, base - 46, dw - 16, 2, '#c89a68');
  for (let i = 0; i < 3; i++) { rect(ctx, dx + 18 + i * 34, base - 38, 12, 4, '#8a6a4a'); rect(ctx, dx + 22 + i * 34, base - 34, 4, 22, '#8a6a4a'); }
  const chef = cachedBrandStaff({ name: 'AKIYAMA' });
  drawBugAt(ctx, chef, dx + dw * 0.72, base - 50, { pose: Math.floor(t * 1.1) % 2 ? 'idle' : 'play', scale: 1.1, bounce: 0.35, phase: 2 });
  // the plastic food case, which is the menu and the window display and the
  // single most convincing object in the country
  const cx0 = x + 6, cw = Math.round(w * 0.36);
  rect(ctx, cx0, base - 130, cw, 44, '#3a3440');
  rect(ctx, cx0 + 3, base - 127, cw - 6, 38, '#f0ece2');
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < 3; i++) {
    const px2 = cx0 + 10 + i * Math.round((cw - 20) / 3);
    ellipsePx(ctx, px2 + 8, base - 100, 10, 4, '#e8e2d2');
    rect(ctx, px2 + 2, base - 110, 16, 9, '#c8823a');
    rect(ctx, px2 + 2, base - 110, 16, 2, '#e0a058');
    rect(ctx, px2 + 4, base - 103, 12, 2, '#8a5220');
    rect(ctx, px2 + 2, base - 116, 5, 6, '#6be585');
  }
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.18; rect(ctx, cx0 + 3, base - 127, cw - 6, 38, '#bfe0ff'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.5 + 0.5 * qsLit(time);
  rect(ctx, cx0 + 5, base - 125, cw - 10, 2, '#ffeec4');
  ctx.globalAlpha = 1;
  // the noren across the door, and the lanterns each side of it
  qsNoren(ctx, dx + 6, base - 96, dw - 12, 34, '#2f4a68', t, 3);
  qsLantern(ctx, x + w - 22, base - 116, 13, t, time, '#c8402c');
  // the sign, and the extractor fan blowing the whole street's dinner outside
  qsSignBoard(ctx, x, top, w, 32, 'TONKATSU AKIYAMA', '#8a4a1c', '#ffd8a0', t, time);
  rect(ctx, x + w - 44, top + 40, 30, 26, '#6a665e');
  rect(ctx, x + w - 41, top + 43, 24, 20, '#3a3830');
  const fa = t * 6;
  for (let i = 0; i < 3; i++) { const a = fa + i * 2.1; line(ctx, x + w - 29, top + 53, x + w - 29 + Math.cos(a) * 9, top + 53 + Math.sin(a) * 8, '#8a8680'); }
}
// Colony Mart. The catalogue knows what this place is, so let it draw it.
function qsMart(ctx, x, base, w, h, t, time, S) {
  let B = null;
  if (typeof shopById === 'function') B = shopById('colonymart');
  if (!B) B = { id: 'colonymart', name: 'COLONY MART', tag: 'OPEN. ALWAYS. EVEN NOW.', logo: 'store', col: '#2f8f4a', col2: '#f4f1ea', inner: '#e8ecec' };
  sideShopFront(ctx, x, base, w, h, B, t, S);
  // the thing the airport version does not need: the wash of light a 24-hour
  // shop throws across a dark street, which is why anybody walks past it
  qsGlow(ctx, x + w / 2, base - 20, w * 0.8, 62, '#e8fff0', 0.1 + 0.26 * qsNight(time));
  // the bin cage and the stack of crates outside the door, always
  rect(ctx, x + w + 4, base - 30, 34, 30, '#3a4a54');
  for (let i = 0; i < 4; i++) rect(ctx, x + w + 6, base - 28 + i * 7, 30, 3, '#5f7080');
  rect(ctx, x + w + 4, base - 34, 34, 5, '#6a7a86');
}
// Amp Off. Four rooms of other people giving up, priced in felt pen.
function qsAmpOff(ctx, x, base, w, h, t, time, S) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#2a2634');
  rect(ctx, x + 5, top + 38, w - 10, h - 42, '#3a3446');
  // guitars hanging in the window, necks down, in a row
  for (let i = 0; i < 5; i++) {
    const gx = Math.round(x + 18 + i * ((w - 40) / 5));
    const gy = top + 48;
    const col = ['#c8402c', '#f2c94c', '#2f4a8a', '#e8e2d2', '#6a3a24'][i];
    rect(ctx, gx - 6, gy, 12, 5, '#3a3444');
    rect(ctx, gx - 2, gy + 5, 4, 34, '#6a4a2e');
    for (let k = 0; k < 5; k++) rect(ctx, gx - 2, gy + 10 + k * 6, 4, 1, '#c0b8a8');
    ellipsePx(ctx, gx, gy + 50, 11, 13, col);
    ellipsePx(ctx, gx, gy + 48, 4, 4, '#1b1822');
    rect(ctx, gx - 8, gy + 44, 16, 1, '#e8e2d2');
    // the price, felt pen on card, taped to the neck
    rect(ctx, gx - 9, gy + 22, 18, 9, '#f4f1ea');
    drawText(ctx, ['8', '12', '5', '20', '3'][i] + 'K', gx, gy + 24, '#c8402c', { align: 'center', font: 'small' });
  }
  // a stack of amps along the bottom, with one pilot light on
  for (let i = 0; i < 3; i++) {
    const ax = Math.round(x + 14 + i * ((w - 28) / 3));
    const aw = Math.round((w - 28) / 3) - 8;
    rect(ctx, ax, base - 42, aw, 38, '#241f2e');
    rect(ctx, ax, base - 42, aw, 3, '#3f3850');
    rect(ctx, ax + 4, base - 36, aw - 8, 24, '#3a3448');
    for (let gy = base - 35; gy < base - 13; gy += 3) for (let gx = ax + 5; gx < ax + aw - 5; gx += 3) px(ctx, gx, gy, '#262034');
    if (i === 1) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5); circle(ctx, ax + aw - 7, base - 39, 2, '#e8503a'); ctx.globalAlpha = 1; }
  }
  ctx.globalAlpha = 0.14; rect(ctx, x + 5, top + 38, w - 10, h - 42, '#bfe0ff'); ctx.globalAlpha = 1;
  rect(ctx, x + 5, top + 38, w - 10, 3, '#8a939e');
  // the sign: yellow and black, the way every used-gear shop on earth is
  rect(ctx, x, top, w, 34, '#241d28');
  rect(ctx, x + 2, top + 2, w - 4, 30, '#f2c40c');
  for (let i = 0; i < w; i += 16) { ctx.globalAlpha = 0.25; rect(ctx, x + i, top + 28, 8, 4, '#241d28'); ctx.globalAlpha = 1; }
  brandLogo(ctx, x + 20, top + 17, 11, QS_AMPOFF, t);
  drawText(ctx, 'AMP OFF', x + 38, top + 6, '#241d28', { scale: 3 });
  drawText(ctx, 'USED GEAR - SOLD AS SEEN', x + 38, top + 24, '#5a4a08', { font: 'small' });
  qsGlow(ctx, x + w / 2, base - 24, w * 0.7, 48, '#fff2c0', 0.08 + 0.2 * qsNight(time));
}
// The standing bar. Shut until five, which in the morning is a crate of
// empties, a rolled-up mat and a lantern with nothing in it.
function qsYakitori(ctx, x, base, w, h, t, time) {
  const top = base - h, open = qsNight(time) > 0.35;
  rect(ctx, x, top, w, h, '#3a2f26');
  // the shutter, pulled down two thirds, which is how it waits
  const sh = open ? 14 : Math.round(h * 0.62);
  rect(ctx, x + 4, base - h + 30, w - 8, h - 34, open ? '#3a2418' : '#5a564e');
  if (open) {
    ctx.globalAlpha = 0.4; rect(ctx, x + 6, base - h + 32, w - 12, h - 38, '#ffb460'); ctx.globalAlpha = 1;
    rect(ctx, x + 12, base - 40, w - 24, 7, '#a8784a');
    for (let i = 0; i < 4; i++) rect(ctx, x + 18 + i * 32, base - 33, 8, 29, '#6a4a2e');
    qsNoren(ctx, x + 14, base - 86, w - 28, 30, '#8a2a1c', t, 7);
  }
  for (let i = base - h + 30; i < base - h + 30 + sh; i += 6) {
    rect(ctx, x + 4, i, w - 8, 3, '#7a766e');
    rect(ctx, x + 4, i + 3, w - 8, 3, '#55524c');
  }
  // the crate of empty bottles, the mat, the ashtray on a brick
  rect(ctx, x + w - 42, base - 22, 34, 20, '#3a5a8a');
  for (let i = 0; i < 5; i++) { rect(ctx, x + w - 39 + i * 6, base - 30, 4, 10, '#4a7a5a'); px(ctx, x + w - 38 + i * 6, base - 30, '#8adfa8'); }
  rect(ctx, x + 8, base - 8, 26, 8, '#6a5a44');
  qsLantern(ctx, x + w / 2, base - h + 14, 12, t, time, '#c8402c');
  qsSignBoard(ctx, x, top - 4, w, 28, 'YAKITORI HACHI', '#6a2a1c', '#ffd8a0', t, time);
}

// The shrine. It is the size of a wardrobe, it is wedged between two houses,
// and somebody puts a fresh cup of water on it every single morning.
function qsShrine(ctx, x, base, w, h, t, time) {
  const cx = x + w / 2;
  // the gravel apron and the low stone wall it sits behind
  rect(ctx, x, base - 10, w, 10, '#a8a496');
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 26; i++) px(ctx, x + ((i * 37) % w), base - 8 + ((i * 13) % 8), '#7a7668');
  ctx.globalAlpha = 1;
  rect(ctx, x, base - 24, 10, 24, '#8a8678'); rect(ctx, x + w - 10, base - 24, 10, 24, '#8a8678');
  // the torii: two pillars, the nuki through them, the kasagi on top with the
  // ends turned up, which is the only curve this street is allowed
  const ty = base - 120, tw = Math.round(w * 0.62), tx = cx - tw / 2;
  rect(ctx, tx, ty, 11, 120, QS_PAL.vermilion);
  rect(ctx, tx, ty, 4, 120, QS_PAL.vermilionHi);
  rect(ctx, tx + 8, ty, 3, 120, QS_PAL.vermilionLo);
  rect(ctx, tx + tw - 11, ty, 11, 120, QS_PAL.vermilion);
  rect(ctx, tx + tw - 11, ty, 4, 120, QS_PAL.vermilionHi);
  rect(ctx, tx + tw - 3, ty, 3, 120, QS_PAL.vermilionLo);
  rect(ctx, tx - 4, base - 6, 19, 6, '#4a4640'); rect(ctx, tx + tw - 15, base - 6, 19, 6, '#4a4640');
  rect(ctx, tx - 2, ty + 22, tw + 4, 9, QS_PAL.vermilion);
  rect(ctx, tx - 2, ty + 22, tw + 4, 2, QS_PAL.vermilionHi);
  // the kasagi, stepped up at each end so it reads as a curve at this size
  rect(ctx, tx - 14, ty + 6, tw + 28, 8, QS_PAL.vermilion);
  rect(ctx, tx - 14, ty + 6, tw + 28, 2, QS_PAL.vermilionHi);
  rect(ctx, tx - 18, ty + 2, 10, 5, QS_PAL.vermilion);
  rect(ctx, tx + tw + 8, ty + 2, 10, 5, QS_PAL.vermilion);
  rect(ctx, tx - 10, ty - 1, tw + 20, 6, '#241d28');
  rect(ctx, tx - 10, ty - 1, tw + 20, 2, '#4a4048');
  // the shimenawa: a fat rope across the middle with paper zigzags on it
  rect(ctx, tx + 6, ty + 36, tw - 12, 7, '#d8cba0');
  ctx.globalAlpha = 0.4;
  for (let i = tx + 8; i < tx + tw - 12; i += 7) rect(ctx, i, ty + 36, 3, 7, '#a89870');
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const zx = tx + 18 + i * Math.round((tw - 40) / 2);
    const sway = Math.sin(t * 1.4 + i) * 1;
    rect(ctx, zx + sway, ty + 43, 7, 6, '#f8f6ee');
    rect(ctx, zx + sway + 3, ty + 49, 7, 6, '#f8f6ee');
    rect(ctx, zx + sway, ty + 55, 7, 6, '#f8f6ee');
  }
  // the hokora itself: a little wooden house on a plinth with a tiled roof
  const hy = base - 74, hw = 46;
  rect(ctx, cx - hw / 2, hy, hw, 66, QS_PAL.wood);
  rect(ctx, cx - hw / 2, hy, hw, 3, QS_PAL.woodHi);
  rect(ctx, cx - hw / 2 + 5, hy + 10, hw - 10, 40, '#241d28');
  ctx.globalAlpha = 0.28; rect(ctx, cx - hw / 2 + 5, hy + 10, hw - 10, 40, '#ffb460'); ctx.globalAlpha = 1;
  rect(ctx, cx - hw / 2 - 8, hy - 12, hw + 16, 13, '#3a3a44');
  rect(ctx, cx - hw / 2 - 8, hy - 12, hw + 16, 3, '#5a5a66');
  rect(ctx, cx - hw / 2 - 12, hy + 1, hw + 24, 4, '#2a2a34');
  // the offering box, slatted, with a coin slot you cannot see the bottom of
  rect(ctx, cx - 26, base - 32, 52, 28, '#5a4530');
  rect(ctx, cx - 26, base - 32, 52, 3, '#7a6244');
  rect(ctx, cx - 26, base - 7, 52, 3, '#3a2c1e');
  for (let i = 0; i < 7; i++) rect(ctx, cx - 23 + i * 7, base - 30, 3, 24, '#4a3726');
  rect(ctx, cx - 20, base - 34, 40, 4, '#241d28');
  // the cup of water, fresh this morning, and a mandarin next to it
  rect(ctx, cx - 38, base - 16, 9, 10, '#e8e4d8');
  ellipsePx(ctx, cx - 34, base - 17, 4, 2, '#8ad8ff');
  ellipsePx(ctx, cx + 34, base - 10, 6, 5, '#e8903a');
  rect(ctx, cx + 34, base - 15, 2, 3, '#4a7a3a');
  // two stone lanterns, squat, with a small light in them after dark
  for (const s of [-1, 1]) {
    const lx = cx + s * Math.round(w * 0.36);
    rect(ctx, lx - 9, base - 12, 18, 12, '#8f8a7e');
    rect(ctx, lx - 6, base - 26, 12, 14, '#9a9488');
    rect(ctx, lx - 11, base - 38, 22, 12, '#a49e90');
    rect(ctx, lx - 8, base - 36, 16, 8, '#241d28');
    ctx.globalAlpha = qsLit(time);
    rect(ctx, lx - 6, base - 34, 12, 5, '#ffcf80');
    ctx.globalAlpha = 1;
    rect(ctx, lx - 13, base - 44, 26, 7, '#8f8a7e');
    rect(ctx, lx - 13, base - 44, 26, 2, '#b0aa9c');
    rect(ctx, lx - 4, base - 50, 8, 6, '#8f8a7e');
    qsGlow(ctx, lx, base - 32, 26, 22, '#ffcf80', 0.2 * qsLit(time));
  }
  // the rack of wooden plaques, hung up and tapping each other in the wind
  rect(ctx, x + 12, base - 78, 4, 54, QS_PAL.woodLo);
  rect(ctx, x + 12, base - 80, 54, 4, QS_PAL.woodLo);
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(t * 1.9 + i * 0.8) * 1.2;
    const ex = x + 18 + i * 12 + sway;
    rect(ctx, ex, base - 76, 10, 12, '#c8a878');
    rect(ctx, ex, base - 76, 10, 2, '#e0c496');
    ctx.globalAlpha = 0.6; drawKanaBlock(ctx, ex + 2, base - 73, 6, '#5a4026', i); ctx.globalAlpha = 1;
  }
}
// The koban. Two floors of nothing much, a red lamp that never goes off, a
// noticeboard of faces, and a bicycle nobody has ridden since March.
function qsKoban(ctx, x, base, w, h, t, time) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#d8d4cc');
  rect(ctx, x, top, w, 4, '#f0ece4');
  rect(ctx, x, base - 26, w, 26, '#5a6480');
  rect(ctx, x, base - 26, w, 3, '#7a84a0');
  // the blue band across the middle, which is what says police from a hundred
  // metres away in every town in the country
  rect(ctx, x, top + 30, w, 18, '#2a3a76');
  rect(ctx, x, top + 30, w, 2, '#4a5aa0');
  drawText(ctx, 'KOBAN', x + w / 2, top + 34, '#f4f1ea', { align: 'center', scale: 2 });
  // the upstairs window, curtains shut, somebody's kettle on
  rect(ctx, x + 14, top + 56, w - 28, 30, '#2a3040');
  ctx.globalAlpha = 0.5 + 0.4 * qsLit(time);
  rect(ctx, x + 16, top + 58, w - 32, 26, '#e0d8b8');
  ctx.globalAlpha = 1;
  frame(ctx, x + 14, top + 56, w - 28, 30, QS_PAL.steelLo);
  // the downstairs window, and the officer's desk inside it under a strip light
  rect(ctx, x + 10, base - 92, w - 20, 66, '#20262f');
  ctx.globalAlpha = 0.9; rect(ctx, x + 12, base - 90, w - 24, 62, '#e6ecf2'); ctx.globalAlpha = 1;
  rect(ctx, x + 12, base - 88, w - 24, 3, '#ffffff');
  rect(ctx, x + 22, base - 46, w - 44, 7, '#a8a49a');
  rect(ctx, x + 26, base - 40, 5, 14, '#8a8680');
  rect(ctx, x + w - 34, base - 58, 18, 13, '#3a4050');
  ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2.6);
  rect(ctx, x + w - 32, base - 56, 14, 9, '#6be585');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.16; rect(ctx, x + 10, base - 92, w - 20, 66, '#bfe0ff'); ctx.globalAlpha = 1;
  // the red lamp on the roof, on in every weather at every hour
  rect(ctx, x + w / 2 - 14, top - 16, 28, 14, '#8a3028');
  rect(ctx, x + w / 2 - 12, top - 14, 24, 10, '#e8503a');
  ctx.globalAlpha = 0.65 + 0.35 * Math.sin(t * 1.6);
  rect(ctx, x + w / 2 - 10, top - 12, 20, 6, '#ff8a70');
  ctx.globalAlpha = 1;
  qsGlow(ctx, x + w / 2, top - 8, 34, 22, '#ff6a4a', 0.16 + 0.12 * qsNight(time));
  // the noticeboard, with four faces on it and a map of the ward
  rect(ctx, x + w + 6, base - 76, 54, 52, '#6a5a44');
  rect(ctx, x + w + 8, base - 74, 50, 48, '#e8e2d2');
  for (let i = 0; i < 4; i++) {
    const fx = x + w + 12 + (i % 2) * 24, fy = base - 70 + Math.floor(i / 2) * 22;
    rect(ctx, fx, fy, 18, 18, '#b0aca0');
    ellipsePx(ctx, fx + 9, fy + 9, 5, 6, '#8a8478');
    ctx.globalAlpha = 0.5; rect(ctx, fx, fy + 15, 18, 3, '#5a5468'); ctx.globalAlpha = 1;
  }
  rect(ctx, x + w + 6, base - 24, 4, 24, '#6a5a44');
  rect(ctx, x + w + 56, base - 24, 4, 24, '#6a5a44');
  // the police bicycle, white, leaning on its stand outside
  qsBike(ctx, x - 34, base, '#f0ece2', t, 3);
}
// A mamachari: step-through frame, a basket the size of a bin, a saddle in a
// carrier bag, and a stand it will fall off eventually.
function qsBike(ctx, x, base, col, t, seed) {
  const r = makeRng(hashStr('bike' + seed));
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x + 16, base + 1, 20, 4, '#000'); ctx.globalAlpha = 1;
  const lean = (seed % 3) - 1;
  circle(ctx, x + 4, base - 9, 9, '#2a2a30'); circle(ctx, x + 4, base - 9, 6, '#3a3a42');
  circle(ctx, x + 30, base - 9, 9, '#2a2a30'); circle(ctx, x + 30, base - 9, 6, '#3a3a42');
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) { const a = i * 0.52 + t * 0.1; line(ctx, x + 4, base - 9, x + 4 + Math.cos(a) * 7, base - 9 + Math.sin(a) * 7, '#8a8f98'); }
  ctx.globalAlpha = 1;
  // the frame, low in the middle so you can step through it in a skirt
  line(ctx, x + 4, base - 9, x + 14, base - 22, col);
  line(ctx, x + 14, base - 22, x + 30, base - 9, col);
  line(ctx, x + 14, base - 22, x + 26, base - 30, col);
  rect(ctx, x + 24, base - 34, 3, 12, col);
  rect(ctx, x + 20, base - 36, 11, 4, '#3a3444');           // the saddle
  rect(ctx, x + 2, base - 32, 3, 22, col);
  rect(ctx, x - 2, base - 34, 12, 3, '#3a3444');            // the bars
  // the basket, wire, with somebody's umbrella in it
  rect(ctx, x - 4, base - 32, 18, 13, '#9a9690');
  for (let i = 0; i < 5; i++) rect(ctx, x - 3 + i * 4, base - 32, 1, 13, '#c0bcb4');
  for (let i = 0; i < 3; i++) rect(ctx, x - 4, base - 30 + i * 5, 18, 1, '#c0bcb4');
  if (r.chance(0.5)) { rect(ctx, x + 2, base - 44, 2, 14, '#2f6a4a'); ellipsePx(ctx, x + 3, base - 45, 4, 2, '#2f6a4a'); }
  // the child seat on the back, on half of them
  if (r.chance(0.4)) { rect(ctx, x + 28, base - 32, 14, 12, '#c8402c'); rect(ctx, x + 28, base - 32, 14, 2, '#e8604a'); rect(ctx, x + 40, base - 38, 3, 10, '#c8402c'); }
  if (lean) { ctx.globalAlpha = 0.14; rect(ctx, x - 4, base - 40, 46, 40, '#000'); ctx.globalAlpha = 1; }
}
// The rack: six of them jammed in at an angle, front wheels in the slots, one
// of them with a flat and a ticket on the bars from the ward office.
function qsBikeRack(ctx, x, base, w, t, seed) {
  for (let i = 0; i < 5; i++) rect(ctx, x + 6 + i * ((w - 12) / 5), base - 12, 5, 12, '#7a7670');
  rect(ctx, x, base - 4, w, 4, '#6a665e');
  const n = Math.max(3, Math.floor(w / 42));
  for (let i = 0; i < n; i++) qsBike(ctx, Math.round(x + i * ((w - 40) / n)), base - 2, ['#2f4a68', '#3a3a42', '#6a3a30', '#2f6a4a', '#8a8f98'][i % 5], t, seed + i);
}

// The vending machines. A wall of them, humming, glowing, warm to lean on,
// and the only thing on this street that is genuinely pleased to see you.
function qsVendWall(ctx, x, base, w, t, time) {
  const cols = ['#c8402c', '#2f6fc0', '#2f8f4a', '#e8e2d2'];
  const n = 4, mw = Math.floor(w / n) - 4, h = 96;
  for (let i = 0; i < n; i++) {
    const mx = x + i * (mw + 4), c = cols[i], top = base - h;
    rect(ctx, mx, top, mw, h, c);
    rect(ctx, mx, top, mw, 5, lighten(c, 0.3));
    rect(ctx, mx, base - 4, mw, 4, darken(c, 0.4));
    frame(ctx, mx, top, mw, h, darken(c, 0.5));
    // the display window, the rack of cans, and the little HOT/COLD tabs
    rect(ctx, mx + 4, top + 10, mw - 8, 46, '#12101c');
    for (let r2 = 0; r2 < 3; r2++) for (let k = 0; k < 4; k++) {
      const cx = mx + 7 + k * ((mw - 14) / 4), cy = top + 14 + r2 * 14;
      const cc = ['#f2c94c', '#6be585', '#8ad8ff', '#f4f1ea', '#e8503a'][(k + r2 + i) % 5];
      rect(ctx, cx, cy, 6, 11, cc);
      rect(ctx, cx, cy, 6, 2, lighten(cc, 0.35));
      rect(ctx, cx, cy + 11, 6, 2, '#8a8f98');
      rect(ctx, cx - 1, cy + 12, 8, 2, r2 === 0 ? '#e8503a' : '#2f6fc0');
    }
    ctx.globalAlpha = 0.2; rect(ctx, mx + 4, top + 10, mw - 8, 46, '#bfe0ff'); ctx.globalAlpha = 1;
    // the buttons, the coin slot, the change tray, the sold-out lamp
    for (let k = 0; k < 4; k++) {
      ctx.globalAlpha = (k === 2 && i === 1) ? 0.3 : 0.7 + 0.3 * Math.sin(t * 3 + k + i);
      rect(ctx, mx + 7 + k * ((mw - 14) / 4), top + 60, 7, 4, (k === 2 && i === 1) ? '#6a6a72' : '#ff5a4a');
      ctx.globalAlpha = 1;
    }
    rect(ctx, mx + mw - 14, top + 68, 9, 14, '#2a2d33');
    rect(ctx, mx + mw - 12, top + 70, 5, 2, '#8a8f98');
    rect(ctx, mx + 5, base - 24, mw - 10, 9, '#2a2d33');
    rect(ctx, mx + 5, base - 13, mw - 10, 7, '#1b1b24');
    // the light inside, which is the whole point of them
    qsGlow(ctx, mx + mw / 2, top + 34, mw * 0.9, 46, lighten(c, 0.5), 0.1 + 0.24 * qsNight(time));
  }
  qsGlow(ctx, x + w / 2, base - 10, w * 0.62, 30, '#ffeec4', 0.1 + 0.3 * qsNight(time));
  // the bin for the empties, chained to the end machine
  rect(ctx, x + w + 4, base - 40, 26, 40, '#4a5260');
  rect(ctx, x + w + 2, base - 44, 30, 5, '#6a7280');
  rect(ctx, x + w + 10, base - 44, 14, 5, '#1b1b24');
  // moths at night, which is the sort of detail that costs nothing
  if (qsNight(time) > 0.4) {
    for (let i = 0; i < 5; i++) {
      const a = t * (1.4 + i * 0.3) + i * 2;
      const mx2 = x + w * 0.5 + Math.cos(a) * (28 + i * 9);
      const my2 = base - 60 + Math.sin(a * 1.7) * 16;
      rect(ctx, Math.round(mx2), Math.round(my2), 2, 2, '#e8e2c8');
      ctx.globalAlpha = 0.5; rect(ctx, Math.round(mx2) - 2, Math.round(my2), 6, 1, '#cfc8a8'); ctx.globalAlpha = 1;
    }
  }
}
// The blue crates, on the right morning, with a green net over them held down
// by four bricks that live on this corner all week.
function qsCrates(ctx, x, base, w, t) {
  for (let i = 0; i < 3; i++) {
    const cx = x + (i % 2) * 34, cy = base - 22 - Math.floor(i / 2) * 20;
    rect(ctx, cx, cy, 32, 20, '#2f6fc0');
    rect(ctx, cx, cy, 32, 3, '#5a92e0');
    rect(ctx, cx, cy + 17, 32, 3, '#1f4a90');
    for (let k = 0; k < 4; k++) rect(ctx, cx + 3 + k * 7, cy + 4, 4, 13, '#255fa8');
    // the bottles and cans in them, at every angle
    for (let k = 0; k < 4; k++) {
      const bc = ['#4a7a5a', '#8ad8ff', '#e8e2d2', '#c8402c'][(k + i) % 4];
      rect(ctx, cx + 4 + k * 7, cy - 7, 4, 9, bc);
      px(ctx, cx + 5 + k * 7, cy - 7, lighten(bc, 0.4));
    }
  }
  // the net, drawn as a cross-hatch, with the bricks at the corners
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 8; i++) line(ctx, x - 4 + i * 9, base - 46, x + 6 + i * 9, base - 2, '#3f7a4a');
  for (let i = 0; i < 8; i++) line(ctx, x + 6 + i * 9, base - 46, x - 4 + i * 9, base - 2, '#3f7a4a');
  ctx.globalAlpha = 1;
  for (const bx of [x - 6, x + 62]) { rect(ctx, bx, base - 8, 14, 8, '#9a5a44'); rect(ctx, bx, base - 8, 14, 2, '#b87a60'); }
}
// The grate over the channel, with the water going somewhere underneath it.
function qsGrate(ctx, x, base, w, t) {
  rect(ctx, x, base + 2, w, 18, '#5a5650');
  rect(ctx, x, base + 2, w, 2, '#7a766e');
  for (let i = 0; i < w - 4; i += 7) {
    rect(ctx, x + 2 + i, base + 4, 4, 14, '#8a8680');
    rect(ctx, x + 2 + i, base + 4, 4, 1, '#a8a49c');
  }
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < w - 4; i += 7) rect(ctx, x + 6 + i, base + 4, 3, 14, '#14141a');
  ctx.globalAlpha = 1;
  // a leaf stuck in it since autumn, and the light on the water below
  ctx.globalAlpha = 0.2; rect(ctx, x + 6, base + 12, w - 12, 3, '#8ad8ff'); ctx.globalAlpha = 1;
  ellipsePx(ctx, x + w - 12, base + 6, 5, 3, '#8a6a30');
}
// The cat. Asleep on the wall, has been for an hour, will be for three more.
function qsCat(ctx, x, y, t, awake) {
  const breathe = Math.sin(t * 1.5) * 0.6;
  const g = '#9a948a', gd = '#6f6a62', gl = '#b8b2a6';
  ellipsePx(ctx, x, y - 6 + breathe, 17, 8 + breathe * 0.4, g);
  ellipsePx(ctx, x - 3, y - 9 + breathe, 12, 4, gl);
  // the stripes, which is what stops it reading as a bread roll
  ctx.globalAlpha = 0.5;
  for (let i = -2; i <= 2; i++) rect(ctx, x + i * 6 - 1, y - 13 + breathe, 2, 9, gd);
  ctx.globalAlpha = 1;
  // the head, tucked in, and the two ears. The ears are stepped rather than
  // drawn as triangles because a filled path on this canvas comes out soft
  // and one soft edge on a 40px animal is the whole illusion gone.
  ellipsePx(ctx, x + 13, y - 8 + breathe, 8, 7, g);
  for (let i = 0; i < 4; i++) {
    const ey = y - 14 - i + breathe, ew = 6 - i;
    rect(ctx, x + 8, ey, ew, 1, g);
    rect(ctx, x + 16, ey, ew, 1, g);
    if (i < 2) { px(ctx, x + 9, ey, '#c88a90'); px(ctx, x + 17, ey, '#c88a90'); }
  }
  if (awake) {
    rect(ctx, x + 12, y - 9 + breathe, 3, 2, '#3f8f5a');
    rect(ctx, x + 17, y - 9 + breathe, 3, 2, '#3f8f5a');
  } else {
    rect(ctx, x + 11, y - 8 + breathe, 4, 1, gd);
    rect(ctx, x + 17, y - 8 + breathe, 4, 1, gd);
  }
  rect(ctx, x + 19, y - 6 + breathe, 2, 1, '#c88a90');
  // the tail, wrapped all the way round the front
  ellipsePx(ctx, x - 12, y - 3 + breathe, 9, 3, g);
  ellipsePx(ctx, x - 2, y - 1 + breathe, 12, 3, gd);
}
// The convex mirror on the blind corner, orange frame, and a smeared little
// picture of the street in it that is not quite where the street is.
function qsMirror(ctx, x, base, t, time) {
  rect(ctx, x - 3, base - 150, 6, 150, '#8a8680');
  rect(ctx, x - 3, base - 150, 2, 150, '#a8a49c');
  ellipsePx(ctx, x, base - 168, 30, 30, '#e07020');
  ellipsePx(ctx, x, base - 168, 26, 26, '#c8c4bc');
  // whatever is reflected: sky at the top, road at the bottom, a smear between
  ellipsePx(ctx, x, base - 176, 24, 14, '#9fc4e0');
  ellipsePx(ctx, x, base - 158, 24, 12, '#4a4a54');
  ctx.globalAlpha = 0.5; ellipsePx(ctx, x - 8, base - 176, 8, 5, '#ffffff'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.3; rect(ctx, x - 24, base - 168, 48, 2, '#e8e2d2'); ctx.globalAlpha = 1;
  rect(ctx, x - 16, base - 138, 32, 12, '#e8b03a');
  drawText(ctx, 'SLOW', x, base - 135, '#241d28', { align: 'center', font: 'small' });
}
// The post box: a red cylinder that has been on this corner since before the
// war and will be here after everything else on the street is a car park.
function qsPostBox(ctx, x, base, t) {
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x, base + 1, 14, 4, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x - 11, base - 54, 22, 54, '#c8402c');
  rect(ctx, x - 11, base - 54, 5, 54, '#e8604a');
  rect(ctx, x + 6, base - 54, 5, 54, '#8a2a1c');
  ellipsePx(ctx, x, base - 56, 12, 6, '#d84a36');
  ellipsePx(ctx, x, base - 58, 11, 5, '#e8604a');
  rect(ctx, x - 8, base - 44, 16, 4, '#5a1a10');
  rect(ctx, x - 9, base - 26, 18, 10, '#f4f1ea');
  ctx.globalAlpha = 0.7; drawKanaBlock(ctx, x - 4, base - 24, 8, '#c8402c', 2); ctx.globalAlpha = 1;
  rect(ctx, x - 11, base - 4, 22, 4, '#6a2016');
}
// The post scooter: red, three wheels at the back, two crates strapped on.
function qsScooter(ctx, x, base, t, face) {
  const f = face || 1;
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x, base + 1, 24, 5, '#000'); ctx.globalAlpha = 1;
  circle(ctx, x - 16 * f, base - 8, 8, '#1f1f26'); circle(ctx, x - 16 * f, base - 8, 4, '#8a8f98');
  circle(ctx, x + 15 * f, base - 8, 8, '#1f1f26'); circle(ctx, x + 15 * f, base - 8, 4, '#8a8f98');
  rect(ctx, x - 18, base - 26, 36, 18, '#c8402c');
  rect(ctx, x - 18, base - 26, 36, 3, '#e8604a');
  rect(ctx, x - 18, base - 11, 36, 3, '#8a2a1c');
  rect(ctx, x - 4 * f, base - 38, 14, 12, '#c8402c');       // the seat back
  rect(ctx, x + 12 * f, base - 46, 4, 20, '#3a3a44');       // the column
  rect(ctx, x + 6 * f, base - 48, 16, 3, '#3a3a44');        // the bars
  rect(ctx, x + 16 * f, base - 44, 6, 6, '#f2e4b0');        // the headlamp
  // the two mail crates bungeed on the back, one of them overfull
  rect(ctx, x - 26 * f, base - 40, 18, 14, '#2f4a68');
  rect(ctx, x - 26 * f, base - 40, 18, 3, '#4a6f96');
  rect(ctx, x - 24 * f, base - 46, 14, 7, '#e8e2d2');
  rect(ctx, x - 26 * f, base - 26, 18, 12, '#2f4a68');
}

// The payphone. Green, on a stainless shelf, with a phone book chained to it
// that nobody has opened since the book stopped being how you found anybody.
// The shared prop library has a payphone in it; it is three rectangles, which
// is fine in the back of a station and not fine when it has a name on it.
function qsPayphone(ctx, x, base, t, time) {
  const lit = qsLit(time);
  // the shelf and the leg it stands on
  rect(ctx, x - 20, base - 44, 40, 7, '#8a8f98');
  rect(ctx, x - 20, base - 44, 40, 2, '#c0c6ce');
  rect(ctx, x - 20, base - 38, 40, 3, '#575d66');
  rect(ctx, x - 5, base - 37, 10, 37, '#6a7079');
  rect(ctx, x - 5, base - 37, 3, 37, '#8f959e');
  rect(ctx, x - 12, base - 4, 24, 4, '#3f434a');
  // the body: the cream-green every one of these has gone in twenty years
  rect(ctx, x - 17, base - 100, 34, 58, '#2f6a4a');
  rect(ctx, x - 17, base - 100, 34, 3, '#4f9a6a');
  rect(ctx, x - 17, base - 46, 34, 4, '#1c4830');
  rect(ctx, x + 13, base - 100, 4, 58, '#1c4830');
  // the handset on its hook down the left side, cord looping under it
  rect(ctx, x - 23, base - 92, 8, 26, '#1b2230');
  rect(ctx, x - 23, base - 92, 8, 4, '#3a4450');
  rect(ctx, x - 23, base - 70, 8, 4, '#3a4450');
  rect(ctx, x - 21, base - 88, 4, 20, '#141a24');
  for (let i = 0; i < 5; i++) rect(ctx, x - 21 + (i % 2) * 3, base - 64 + i * 4, 5, 3, '#1b2230');
  // the screen, the slot, the buttons, the card reader
  rect(ctx, x - 12, base - 95, 22, 9, '#12281c');
  ctx.globalAlpha = 0.4 + 0.5 * lit;
  rect(ctx, x - 10, base - 93, 18, 5, '#6be585');
  ctx.globalAlpha = 1;
  rect(ctx, x - 3, base - 84, 12, 3, '#1b2230');          // the coin slot
  rect(ctx, x - 12, base - 84, 7, 4, '#c8402c');          // the emergency key
  for (let r2 = 0; r2 < 4; r2++) for (let k = 0; k < 3; k++) {
    rect(ctx, x - 12 + k * 8, base - 78 + r2 * 7, 6, 5, '#d8d4c8');
    rect(ctx, x - 12 + k * 8, base - 78 + r2 * 7, 6, 1, '#f0ece2');
  }
  rect(ctx, x - 12, base - 50, 22, 4, '#1b2230');          // the change cup
  // the phone book on the shelf, chained, swollen with damp
  rect(ctx, x + 2, base - 54, 18, 10, '#c8b078');
  rect(ctx, x + 2, base - 54, 18, 2, '#e0cc98');
  rect(ctx, x + 2, base - 46, 18, 2, '#8a7648');
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 4; i++) rect(ctx, x + 4, base - 52 + i * 2, 14, 1, '#9a8858');
  ctx.globalAlpha = 1;
  line(ctx, x + 11, base - 44, x + 4, base - 38, '#8a8f98');
  // the little hood over it, and the light under the hood
  rect(ctx, x - 22, base - 112, 44, 12, '#e8e2d2');
  rect(ctx, x - 22, base - 112, 44, 3, '#ffffff');
  rect(ctx, x - 22, base - 101, 44, 3, '#a8a49a');
  ctx.globalAlpha = 0.5 + 0.5 * lit;
  rect(ctx, x - 18, base - 100, 36, 2, '#ffeec4');
  ctx.globalAlpha = 1;
  drawText(ctx, 'NTT', x, base - 110, '#2f6a4a', { align: 'center', font: 'small' });
  qsGlow(ctx, x, base - 86, 30, 40, '#9fe0b8', 0.12 * lit);
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x, base + 1, 18, 4, '#000'); ctx.globalAlpha = 1;
}

// Eleven Hours. The capsule hotel: a narrow glass door, a lit board of the
// rates, and a vending machine in the lobby you can see from the street.
function qsHotelFront(ctx, x, base, w, h, t, time) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#1b2a3e');
  rect(ctx, x + 4, top + 44, w - 8, h - 48, '#22344c');
  glassWall(ctx, x + 6, top + 46, w - 12, h - 56, t, { tint: '#24384f', top: '#8fc0e4', bot: '#1b2a3e', mullion: 34, rail: 60 });
  // the lobby behind the glass: a counter, a lamp, the key rack, a cat
  rect(ctx, x + 12, base - 44, w - 24, 22, '#6a5a44');
  rect(ctx, x + 12, base - 44, w - 24, 3, '#8a7458');
  ctx.globalAlpha = 0.4 + 0.4 * qsLit(time);
  rect(ctx, x + 10, base - 92, w - 20, 44, '#ffdca0');
  ctx.globalAlpha = 1;
  for (let i = 0; i < 12; i++) rect(ctx, x + 16 + (i % 6) * 12, base - 86 + Math.floor(i / 6) * 10, 8, 7, i % 3 ? '#c8a03a' : '#3a4a58');
  // the door, dark, in the middle, with the mat and the umbrella stand
  const dw = 54, dx = x + w / 2 - dw / 2;
  rect(ctx, dx, base - 74, dw, 74, '#0d0f16');
  rect(ctx, dx, base - 74, dw, 3, '#4a5a68');
  ctx.globalAlpha = 0.3; rect(ctx, dx + 3, base - 70, dw - 6, 66, '#8fc0e4'); ctx.globalAlpha = 1;
  rect(ctx, dx + dw / 2 - 1, base - 70, 2, 66, '#3a4a58');
  rect(ctx, dx - 8, base - 4, dw + 16, 4, '#2a3a48');
  rect(ctx, dx + dw + 12, base - 26, 14, 26, '#3a4a58');
  for (let i = 0; i < 3; i++) { rect(ctx, dx + dw + 14 + i * 4, base - 42, 2, 18, ['#2f6a4a', '#c8402c', '#3a3a52'][i]); }
  // the rates board, which is the only thing anybody reads
  rect(ctx, x + 6, base - 118, 74, 34, '#12101c');
  frame(ctx, x + 6, base - 118, 74, 34, '#c8a03a');
  drawText(ctx, '1 NIGHT', x + 12, base - 114, '#ffd24a', { font: 'small' });
  drawText(ctx, '3400', x + 12, base - 104, '#f4f1ea', { scale: 2 });
  drawText(ctx, 'BATH FREE', x + 12, base - 92, '#8a8478', { font: 'small' });
  // the sign: a watch face, because the name is a joke about how long you get
  rect(ctx, x, top, w, 40, '#0f1a2a');
  rect(ctx, x + 2, top + 2, w - 4, 36, '#2f4a68');
  rect(ctx, x + 2, top + 2, w - 4, 2, '#4a6f96');
  brandLogo(ctx, x + 22, top + 20, 12, QS_HOTEL, t);
  drawText(ctx, 'ELEVEN HOURS', x + 40, top + 8, '#f4f1ea', { scale: 2 });
  drawText(ctx, 'CAPSULE HOTEL - MEN AND WOMEN', x + 40, top + 26, withAlpha('#f4f1ea', 0.6), { font: 'small' });
  qsGlow(ctx, x + w / 2, top + 20, w * 0.6, 26, '#8fc0e4', 0.12 + 0.2 * qsNight(time));
}
// The subway. A hole in the pavement with a rail round it, steps going down
// into a light that is on at every hour, and a green lozenge on a pole.
function qsSubway(ctx, x, base, w, h, t, time) {
  // the canopy over the top of the stairs
  const cx = x + w / 2;
  rect(ctx, x - 6, base - h, w + 12, 16, '#2a3a40');
  rect(ctx, x - 6, base - h, w + 12, 4, '#3f5a60');
  rect(ctx, x - 6, base - h + 14, w + 12, 3, '#18242a');
  rect(ctx, x + 4, base - h + 16, 6, h - 30, '#3a4a50');
  rect(ctx, x + w - 10, base - h + 16, 6, h - 30, '#3a4a50');
  // the hole and the steps, drawn as a stack going away from you
  rect(ctx, x + 10, base - 14, w - 20, 14, '#0a0c10');
  for (let i = 0; i < 7; i++) {
    const sw = (w - 26) - i * 5;
    const sx = x + 13 + i * 2.5;
    const sy = base - 12 + i * 2;
    rect(ctx, Math.round(sx), Math.round(sy), Math.round(sw), 3, lerp(0.7, 0.2, i / 7) > 0.4 ? '#8a8680' : '#4a4640');
    ctx.globalAlpha = 0.6 - i * 0.07;
    rect(ctx, Math.round(sx), Math.round(sy), Math.round(sw), 1, '#b0aca4');
    ctx.globalAlpha = 1;
  }
  // the light coming up out of it, which is what tells you it is open
  qsGlow(ctx, cx, base + 4, w * 0.4, 16, '#e8f2ff', 0.2 + 0.2 * qsNight(time));
  // the handrail down the middle and the yellow tactile strip round the lip
  rect(ctx, cx - 1, base - 34, 3, 22, QS_PAL.steel);
  rect(ctx, x + 14, base - 36, w - 28, 3, QS_PAL.steel);
  rect(ctx, x + 14, base - 36, w - 28, 1, QS_PAL.steelHi);
  for (let i = x + 8; i < x + w - 8; i += 11) rect(ctx, i, base - 20, 8, 4, '#d8b23a');
  // the green sign on its pole: the line letter in a ring and the station name
  const px2 = x + w + 20;
  rect(ctx, px2 - 3, base - 150, 6, 150, '#8a8f98');
  rect(ctx, px2 - 3, base - 150, 2, 150, '#c0c6ce');
  rect(ctx, px2 - 54, base - 186, 108, 40, '#0f2a20');
  rect(ctx, px2 - 52, base - 184, 104, 36, '#1f6f4a');
  rect(ctx, px2 - 52, base - 184, 104, 2, '#3f9f6a');
  ringPx(ctx, px2 - 34, base - 166, 13, '#f4f1ea');
  ringPx(ctx, px2 - 34, base - 166, 12, '#f4f1ea');
  drawText(ctx, 'G', px2 - 34, base - 173, '#f4f1ea', { align: 'center', scale: 2 });
  drawText(ctx, 'SUBWAY', px2 - 16, base - 180, '#f4f1ea', { scale: 2 });
  drawText(ctx, 'HACHIMOTH  G-09', px2 - 16, base - 162, withAlpha('#f4f1ea', 0.75), { font: 'small' });
  ctx.globalAlpha = 0.5 + 0.4 * qsLit(time);
  rect(ctx, px2 - 50, base - 150, 100, 2, '#6be585');
  ctx.globalAlpha = 1;
  qsGlow(ctx, px2, base - 166, 70, 34, '#3fbf80', 0.1 + 0.2 * qsNight(time));
  // the timetable case bolted to the pole, lit, with nothing readable in it
  rect(ctx, px2 + 6, base - 118, 34, 44, '#2a3040');
  rect(ctx, px2 + 8, base - 116, 30, 40, '#e8ecf0');
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 6; i++) rect(ctx, px2 + 11, base - 112 + i * 6, 24 - (i % 3) * 5, 2, '#4a5060');
  ctx.globalAlpha = 1;
}
// The wide bit. A place, not a thing: the pavement gets two metres fatter
// where the station spat everybody out, and that is why you can stand here.
function qsBuskSpot(ctx, x, base, w, t, time) {
  const cx = x + w / 2, lit = qsLit(time);
  // the paving, newer than everything either side of it, laid in a pattern,
  // with two slabs replaced at some point in a slightly wrong grey
  rect(ctx, x, base - 4, w, 26, '#9a968c');
  rect(ctx, x, base - 4, w, 3, '#b6b2a6');
  rect(ctx, x + 44, base - 4, 22, 26, '#8f8b80');
  rect(ctx, x + 110, base + 5, 22, 17, '#a49f92');
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < w; i += 22) rect(ctx, x + i, base - 4, 1, 26, '#3a3a40');
  for (let i = 0; i < 26; i += 9) rect(ctx, x, base - 4 + i, w, 1, '#3a3a40');
  ctx.globalAlpha = 1;
  // one slab cracked corner to corner with a weed up through it, because the
  // ward office has known about it for two years
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 14; i++) px(ctx, x + 46 + i * 1.5, base + 2 + ((i * 5) % 7), '#4a463e');
  ctx.globalAlpha = 1;
  rect(ctx, x + 58, base + 2, 1, 5, '#3f7a4a');
  ellipsePx(ctx, x + 58, base + 1, 3, 2, '#4f9a5a');
  // the worn patch where everybody who does this has stood, and the chalk
  // ring somebody drew round where the case goes
  ctx.globalAlpha = 0.2;
  ellipsePx(ctx, cx, base + 6, w * 0.22, 9, '#5a564e');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.24;
  ellipseRingPx(ctx, cx + 26, base + 10, 17, 6, '#e8e2d2');
  ctx.globalAlpha = 1;
  // the tactile strip along the back, the yellow gone chalky
  for (let i = 0; i < w - 8; i += 10) {
    rect(ctx, x + 4 + i, base - 8, 7, 5, '#c9ae55');
    rect(ctx, x + 4 + i, base - 8, 7, 1, '#e4c96c');
  }
  // the bollards that make it a pitch instead of a pavement
  for (const bx of [x + 14, x + w - 14]) {
    rect(ctx, bx - 4, base - 32, 8, 32, '#c8c4bc');
    rect(ctx, bx - 4, base - 32, 3, 32, '#e4e0d8');
    rect(ctx, bx - 5, base - 34, 10, 4, '#8a8680');
    rect(ctx, bx - 4, base - 20, 8, 3, '#e8503a');
    ctx.globalAlpha = 0.2; ellipsePx(ctx, bx, base + 1, 8, 3, '#000'); ctx.globalAlpha = 1;
  }
  // a guard rail along the back of the pitch, which is what you lean the case
  // against and what the three people who stop hold on to
  rect(ctx, x + 22, base - 40, w - 44, 4, '#8a8f98');
  rect(ctx, x + 22, base - 40, w - 44, 1, '#c0c6ce');
  for (let i = x + 26; i < x + w - 26; i += 34) {
    rect(ctx, i, base - 40, 4, 34, '#7a8088');
    rect(ctx, i, base - 40, 1, 34, '#a0a6ae');
  }
  // a planter, a bin with the lid chained on, and a flyer nobody picked up
  rect(ctx, x + w - 60, base - 22, 44, 22, '#7a7670');
  rect(ctx, x + w - 60, base - 22, 44, 3, '#9a9690');
  rect(ctx, x + w - 60, base - 3, 44, 3, '#5a564e');
  for (let i = 0; i < 6; i++) ellipsePx(ctx, x + w - 54 + i * 8, base - 28, 6, 4, i % 2 ? '#2f8f4a' : '#43a85c');
  rect(ctx, x + 26, base - 34, 20, 34, '#4a5260');
  rect(ctx, x + 26, base - 34, 20, 3, '#6a7280');
  rect(ctx, x + 24, base - 38, 24, 5, '#6a7280');
  rect(ctx, x + 32, base - 38, 8, 5, '#1b1b24');
  const flap = Math.sin(t * 2.4) * 1.5;
  rect(ctx, x + 74 + flap, base + 12, 13, 9, '#f0ece2');
  rect(ctx, x + 74 + flap, base + 12, 13, 2, '#e8503a');
  // the pool of light the station sign throws across it, which is the only
  // reason anybody stands here after six rather than twenty feet either side
  qsGlow(ctx, cx + 40, base + 4, w * 0.4, 18, '#cfe8ff', 0.1 + 0.16 * qsNight(time));
  ctx.globalAlpha = 0.2 + 0.14 * lit;
  drawText(ctx, 'THANK YOU', cx, base + 8, '#e8e2d2', { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
}
// The level crossing at the dead end. It is up most of the time. When it is
// down the bell starts and the whole street stops for ninety seconds.
function qsCrossing(ctx, x, base, w, h, t, time, phase, k) {
  // the rails, the ballast, the fence, the far side of everything
  rect(ctx, x - 10, base - 6, w + 20, 6, '#5a564e');
  for (let i = 0; i < 6; i++) rect(ctx, x + 6 + i * 34, base - 8, 22, 5, '#4a3a2a');
  rect(ctx, x, base - 10, w, 3, '#8a8f98');
  rect(ctx, x, base - 18, w, 3, '#8a8f98');
  // the striped hatching painted on the road at the stop line
  for (let i = 0; i < 9; i++) { ctx.globalAlpha = 0.7; rect(ctx, x - 70 + i * 8, base + 6, 4, 16, '#e8e2d2'); ctx.globalAlpha = 1; }
  // the signal: yellow and black post, two red lamps that alternate, the bell
  const sx = x - 44;
  rect(ctx, sx - 6, base - 132, 12, 132, '#f2c40c');
  for (let i = 0; i < 9; i++) rect(ctx, sx - 6, base - 128 + i * 14, 12, 7, '#241d28');
  rect(ctx, sx - 30, base - 158, 60, 26, '#241d28');
  const on = phase > 0 ? (Math.sin(t * 6) > 0 ? 0 : 1) : -1;
  for (let i = 0; i < 2; i++) {
    const lx = sx - 15 + i * 30;
    circle(ctx, lx, base - 145, 10, '#1b1620');
    circle(ctx, lx, base - 145, 8, on === i ? '#ff4a3a' : '#5a2020');
    if (on === i) { circle(ctx, lx, base - 145, 4, '#ffb0a0'); qsGlow(ctx, lx, base - 145, 26, 22, '#ff4a3a', 0.24); }
  }
  // the X, and the bell housing under it, shaking while it rings
  const shake = phase > 0 ? Math.round(Math.sin(t * 38) * 1) : 0;
  line(ctx, sx - 24, base - 178, sx + 24, base - 160, '#f2c40c');
  line(ctx, sx - 24, base - 160, sx + 24, base - 178, '#f2c40c');
  rect(ctx, sx - 8 + shake, base - 124, 16, 12, '#8a8680');
  ellipsePx(ctx, sx + shake, base - 112, 9, 4, '#a8a49a');
  // the barrier, coming down or going up, with the red and white on it
  const ang = clamp(k, 0, 1);
  const bx = sx + 8, by = base - 108;
  const len = 120;
  const ex = bx + len * (1 - ang * 0.02), ey = by + ang * 96;
  const steps = 14;
  for (let i = 0; i < steps; i++) {
    const k0 = i / steps;
    const px2 = lerp(bx, ex, k0), py2 = lerp(by, ey, k0);
    rect(ctx, Math.round(px2), Math.round(py2), Math.ceil(len / steps) + 1, 6, i % 2 ? '#f4f1ea' : '#c8402c');
    rect(ctx, Math.round(px2), Math.round(py2), Math.ceil(len / steps) + 1, 1, i % 2 ? '#ffffff' : '#e8604a');
  }
  if (ang > 0.6) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6); rect(ctx, Math.round(ex) - 8, Math.round(ey) - 4, 6, 5, '#ff4a3a'); ctx.globalAlpha = 1; }
  rect(ctx, bx - 6, by - 4, 14, 14, '#3a3a44');
  // the train itself, going through, seen as a fast stack of lit windows
  if (phase === 2) {
    const tx = x + w + 200 - ((t * 1400) % 1900);
    for (let c = 0; c < 8; c++) {
      const cxx = tx + c * 150;
      if (cxx < x - 260 || cxx > x + w + 260) continue;
      rect(ctx, cxx, base - 96, 140, 88, '#8a9098');
      rect(ctx, cxx, base - 96, 140, 4, '#c0c6ce');
      rect(ctx, cxx, base - 40, 140, 8, '#2f8f4a');
      for (let i = 0; i < 5; i++) {
        rect(ctx, cxx + 10 + i * 26, base - 84, 20, 26, '#2a3040');
        ctx.globalAlpha = 0.9; rect(ctx, cxx + 11 + i * 26, base - 83, 18, 24, '#ffecc0'); ctx.globalAlpha = 1;
        if ((i + c) % 3 === 0) ellipsePx(ctx, cxx + 20 + i * 26, base - 68, 5, 6, '#3a3550');
      }
      rect(ctx, cxx + 138, base - 96, 4, 88, '#5a606a');
    }
    // the blur of it, and the wind it drags down the street
    ctx.globalAlpha = 0.14; rect(ctx, x - 200, base - 100, w + 460, 96, '#cfd6e8'); ctx.globalAlpha = 1;
  }
  // the fence and the dead end behind everything
  rect(ctx, x - 90, base - 46, 70, 4, '#8a8f98');
  rect(ctx, x - 90, base - 30, 70, 4, '#8a8f98');
  for (let i = 0; i < 4; i++) rect(ctx, x - 88 + i * 22, base - 50, 4, 50, '#7a8088');
}
// A light van, squeezing past, mostly cut off by the bottom of the frame.
function qsVan(ctx, x, t, dir) {
  const base = 542, w = 240, h = 108;
  const x0 = Math.round(x - w / 2);
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x, base - 2, w * 0.44, 9, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x0, base - h, w, h, '#e4e0d6');
  rect(ctx, x0, base - h, w, 5, '#f6f2e8');
  rect(ctx, x0, base - 26, w, 6, '#b4b0a6');
  // the cab end, the window, and the head of whoever has been awake since four
  const cab = dir > 0 ? x0 + w - 78 : x0;
  rect(ctx, cab, base - h - 10, 78, 34, '#d8d4ca');
  rect(ctx, cab + 8, base - h - 6, 60, 24, '#2a3444');
  ctx.globalAlpha = 0.3; rect(ctx, cab + 8, base - h - 6, 60, 9, '#bfe0ff'); ctx.globalAlpha = 1;
  ellipsePx(ctx, cab + 38, base - h + 8, 6, 6, '#3a3550');
  // the company's name on the side, which is three unreadable blocks and a bug
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 3; i++) drawKanaBlock(ctx, x0 + 40 + i * 30, base - h + 26, 24, '#2f6a9a', i + 1);
  ctx.globalAlpha = 1;
  rect(ctx, x0 + 140, base - h + 24, 46, 28, '#2f6a9a');
  ellipsePx(ctx, x0 + 163, base - h + 38, 12, 9, '#f4f1ea');
  circle(ctx, x0 + 38, base - 6, 16, '#1b1b22'); circle(ctx, x0 + 38, base - 6, 7, '#8a8f98');
  circle(ctx, x0 + w - 44, base - 6, 16, '#1b1b22'); circle(ctx, x0 + w - 44, base - 6, 7, '#8a8f98');
  // hazards on, because it is parked where it should not be and knows it
  const on = Math.sin(t * 5) > 0;
  ctx.globalAlpha = on ? 1 : 0.2;
  rect(ctx, x0 + 3, base - 42, 7, 7, '#ff9a2a'); rect(ctx, x0 + w - 10, base - 42, 7, 7, '#ff9a2a');
  ctx.globalAlpha = 1;
}

// ==========================================================================
//  SKY AND DISTANCE
// ==========================================================================
// You can see about eighty pixels of sky on this street and that is being
// generous. What is in it: the colour of the hour, a few stars if it is late,
// and the top forty metres of the buildings on the next road over.
function qsSky(ctx, S, t, time) {
  const c = skyColors(clamp(time, 0, 1));
  vgrad(ctx, 0, 0, W, H, c[0], c[1]);
  const night = qsNight(time);
  if (night > 0.2) {
    const r = makeRng(9081);
    ctx.globalAlpha = night;
    for (let i = 0; i < 90; i++) {
      const sx = r.int(0, W), sy = r.int(0, 150);
      if (Math.sin(t * 1.6 + i) > 0) px(ctx, sx, sy, i % 4 ? '#9a94c0' : '#ffffff');
    }
    ctx.globalAlpha = 1;
    // the moon, low, half behind the wires, which is where it always is here
    ctx.globalAlpha = 0.9 * night;
    circle(ctx, 740, 54, 17, '#f0ecd6');
    circle(ctx, 748, 48, 15, mixColor(c[0], '#000000', 0.15));
    ctx.globalAlpha = 1;
  } else {
    // daytime: a flat overcast with two holes in it, which is Tokyo in March
    ctx.globalAlpha = 0.22;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 260 + t * 3) % (W + 300)) - 150;
      ellipsePx(ctx, cx, 40 + (i % 3) * 22, 90, 22, '#ffffff');
      ellipsePx(ctx, cx + 40, 34 + (i % 3) * 22, 60, 18, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
}
// The next road over, and the one after that. Two layers, barely moving, so
// the street reads as a slot cut through a city rather than a stage flat.
function qsParallax(ctx, S, t, time) {
  const night = qsNight(time);
  sideParallax(ctx, S.cam, 0.1, function (c2) {
    const r = makeRng(5150);
    for (let i = 0; i < 40; i++) {
      const bx = i * 140, bw = r.int(80, 130), bh = r.int(70, 150);
      rect(c2, bx, 150 - bh, bw, bh + 40, mixColor('#2a2c3c', night > 0.4 ? '#14162a' : '#8a90a4', night > 0.4 ? 0.3 : 0.45));
      rect(c2, bx, 150 - bh, bw, 3, mixColor('#3a3d52', '#a0a6ba', night > 0.4 ? 0.1 : 0.45));
      if (night > 0.25) for (let k = 0; k < 8; k++) {
        if (!r.chance(0.35)) { r.int(0, 3); continue; }
        c2.globalAlpha = 0.5 * night;
        rect(c2, bx + 8 + (k % 4) * 22, 150 - bh + 12 + Math.floor(k / 4) * 22, 9, 11, '#ffd8a0');
        c2.globalAlpha = 1;
      }
    }
  });
  // one tall thing in the gap, far enough away to move at a different rate
  sideParallax(ctx, S.cam, 0.2, function (c2) {
    const tx = 1420;
    rect(c2, tx, 20, 26, 170, mixColor('#3a3d52', '#1a1c30', night));
    rect(c2, tx, 20, 5, 170, mixColor('#4c5068', '#24263c', night));
    rect(c2, tx - 8, 44, 42, 6, mixColor('#3a3d52', '#1a1c30', night));
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2);
    rect(c2, tx + 10, 12, 5, 9, '#e8503a');
    ctx.globalAlpha = 1;
  });
}

// ==========================================================================
//  THE STREET, AS A LIST OF THINGS
// ==========================================================================
function qsProps() {
  const P = [];
  P.push({ kind: 'qsmirror', x: 60, w: 30, h: 180, floor: 0 });
  P.push({ kind: 'qshotel', x: 210, w: 150, h: 210, floor: 0, reach: 62, label: 'ELEVEN HOURS', act: 'capsule' });
  P.push({ kind: 'qspots', x: 330, w: 70, h: 30, floor: 0, n: 3, seed: 11 });
  P.push({ kind: 'qsbikes', x: 440, w: 170, h: 46, floor: 0, reach: 70, label: 'THE BIKES', act: 'bikes' });
  P.push({ kind: 'qslaundry', x: 620, w: 180, h: 190, floor: 0, reach: 66, label: 'COIN LAUNDRY', act: 'laundry' });
  P.push({ kind: 'qspots', x: 730, w: 50, h: 30, floor: 0, n: 2, seed: 19 });
  P.push({ kind: 'qsvend', x: 840, w: 200, h: 100, floor: 0, reach: 76, label: 'VENDING MACHINES', act: 'vend' });
  P.push({ kind: 'qsmart', x: 1050, w: 230, h: 180, floor: 0, reach: 78, label: 'COLONY MART', act: 'mart' });
  P.push({ kind: 'qscrates', x: 1230, w: 76, h: 48, floor: 0, reach: 42, label: 'THE BLUE CRATES', act: 'crates' });
  P.push({ kind: 'qsgrate', x: 1330, w: 70, h: 16, floor: 0, reach: 40, label: 'THE DRAIN', act: 'drain' });
  P.push({ kind: 'qsbarber', x: 1430, w: 160, h: 180, floor: 0, reach: 66, label: 'BARBER SHIMA', act: 'barber' });
  P.push({ kind: 'qslowwall', x: 1600, w: 110, h: 76, floor: 0 });
  P.push({ kind: 'qscat', x: 1600, y: 385, w: 44, h: 26, floor: 0, reach: 40, label: 'THE CAT', act: 'cat' });
  P.push({ kind: 'qstonkatsu', x: 1760, w: 220, h: 196, floor: 0, reach: 76, label: 'TONKATSU AKIYAMA', act: 'tonkatsu' });
  P.push({ kind: 'qspots', x: 1890, w: 60, h: 30, floor: 0, n: 3, seed: 31 });
  P.push({ kind: 'qsshutter', x: 2000, w: 180, h: 180, floor: 0, reach: 66, label: 'THE SHUTTER', act: 'shutter' });
  P.push({ kind: 'qskoban', x: 2200, w: 130, h: 200, floor: 0, reach: 64, label: 'THE KOBAN', act: 'koban' });
  P.push({ kind: 'qsbusk', x: 2430, w: 220, h: 34, floor: 0, reach: 96, label: 'PLAY HERE', act: 'busk' });
  P.push({ kind: 'qssubway', x: 2680, w: 200, h: 150, floor: 0, reach: 86, label: 'THE SUBWAY', act: 'subway' });
  P.push({ kind: 'qsshrine', x: 2950, w: 210, h: 200, floor: 0, reach: 78, label: 'THE SHRINE', act: 'shrine' });
  P.push({ kind: 'qspots', x: 3080, w: 60, h: 30, floor: 0, n: 3, seed: 47 });
  P.push({ kind: 'qsbikes', x: 3180, w: 140, h: 46, floor: 0, reach: 62, label: 'MORE BIKES', act: 'bikes' });
  P.push({ kind: 'qsmusic', x: 3380, w: 230, h: 190, floor: 0, reach: 78, label: 'AMP OFF', act: 'music' });
  P.push({ kind: 'qsyakitori', x: 3620, w: 150, h: 178, floor: 0, reach: 62, label: 'YAKITORI HACHI', act: 'yakitori' });
  P.push({ kind: 'qspostbox', x: 3790, w: 26, h: 58, floor: 0, reach: 38, label: 'THE POST BOX', act: 'post' });
  P.push({ kind: 'qspayphone', x: 3850, w: 44, h: 112, floor: 0, reach: 40, label: 'THE PAYPHONE', act: 'payphone' });
  P.push({ kind: 'qsscooter', x: 3930, w: 60, h: 50, floor: 0 });
  P.push({ kind: 'qscrossing', x: 4080, w: 200, h: 200, floor: 0, reach: 96, label: 'THE CROSSING', act: 'crossing' });
  // the things hung over the street, drawn in front of everybody
  P.push({ kind: 'qsblade', x: 700, y: 268, w: 30, h: 96, floor: 0, over: true, text: 'LAUNDRY', col: '#2f6fc0' });
  P.push({ kind: 'qsblade', x: 1500, y: 262, w: 30, h: 110, floor: 0, over: true, text: 'BARBER', col: '#8a2a1c' });
  P.push({ kind: 'qsblade', x: 3450, y: 256, w: 34, h: 122, floor: 0, over: true, text: 'AMP OFF', col: '#f2c40c' });
  P.push({ kind: 'qsarrow', x: 2560, y: 236, w: 170, h: 30, floor: 0, over: true, text: 'SUBWAY', arrow: 1 });
  return P;
}
function qsNpcs() {
  return [
    {
      name: 'A SCHOOLKID', x: 700, floor: 0, voice: 'kid', scale: 1.32, speed: 96, walk: [520, 1980], extra: 'satchel',
      tag: ['I AM NOT LATE. THE TRAIN IS LATE.', 'THE TRAIN IS NEVER LATE.', 'OK. I AM LATE.'],
    },
    {
      name: 'THE SWEEPER', x: 1320, floor: 0, voice: 'oldman', scale: 1.36, speed: 7, walk: [1308, 1338], extra: 'broom',
      tag: function (S) {
        const n = qsNight(S.qsTime);
        if (n > 0.5) return 'THE LEAVES COME BACK AT NIGHT TOO.';
        return ['SAME THREE FEET. EVERY MORNING.', 'IT IS NOT ABOUT THE LEAVES.', 'YOU ARE THE ONE WITH THE GUITAR.'];
      },
    },
    {
      name: 'A RIDER', x: 2080, floor: 0, voice: 'driver', scale: 1.4, speed: 52, walk: [1990, 2330], extra: 'cube',
      tag: ['FOURTH FLOOR. NO LIFT.', 'THE SOUP IS ALREADY COLD.', 'THIS IS THE JOB.'],
    },
    {
      name: 'SALARYMAN', x: 2520, floor: 0, voice: 'guard', scale: 1.45, speed: 18, walk: [2470, 2610], carry: 'phone',
      tag: ['YES. YES. NO. YES.', 'I AM WALKING TO THE STATION NOW.', 'I HAVE BEEN WALKING TO THE STATION FOR FORTY MINUTES.'],
    },
    {
      name: 'A WOMAN AND HER DOG', x: 3080, floor: 0, voice: 'clerk', scale: 1.42, speed: 24, walk: [2880, 3520], extra: 'dog',
      tag: ['HE IS EIGHT. HE IS NOT A PUPPY.', 'HE WALKS THIS WAY BECAUSE OF THE CAT.', 'HE IS AFRAID OF THE CAT.'],
    },
    {
      name: 'THE OFFICER', x: 2290, floor: 0, voice: 'guard', scale: 1.45, pose: 'idle', face: -1,
      tag: function (S) {
        if (S.qsAsked) return 'STILL SECOND ON THE LEFT.';
        S.qsAsked = true;
        return ['LOST? EVERYBODY IS.', 'THE STATION IS THAT WAY. GREEN SIGN.', 'AND DO NOT PLAY AFTER TEN.'];
      },
    },
    {
      name: 'THE POSTMAN', x: 3900, floor: 0, voice: 'driver', scale: 1.4, extra: 'mailbag', face: -1,
      tag: ['NOBODY ON THIS STREET GETS POST.', 'THEY GET BILLS. IT IS DIFFERENT.', 'YOU ARE AT ELEVEN HOURS? THERE IS ONE FOR YOU.'],
    },
  ];
}

// The low wall the cat sleeps on, with the hedge of somebody's garden over it.
function qsLowWall(ctx, x, base, w, h, t) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#a49e90');
  rect(ctx, x, top, w, 5, '#c0baaa');
  rect(ctx, x, top + 5, w, 3, '#7c766a');
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < w; i += 26) rect(ctx, x + i, top + 8, 1, h - 8, '#3a3630');
  for (let i = 12; i < h; i += 18) rect(ctx, x, top + i, w, 1, '#3a3630');
  ctx.globalAlpha = 1;
  // the hedge behind it, and the one branch that has got out over the street
  for (let i = 0; i < 9; i++) ellipsePx(ctx, x + 8 + i * ((w - 16) / 8), top - 8 - ((i * 5) % 9), 13, 10, i % 2 ? '#2f6a3a' : '#3f8a4a');
  ellipsePx(ctx, x + w + 14, top - 4, 12, 8, '#3f8a4a');
  rect(ctx, x + w - 4, top - 4, 18, 2, '#5a4a30');
  // the moss at the bottom and the rust stain under the old bracket
  ctx.globalAlpha = 0.3; rect(ctx, x, base - 6, w, 6, '#3f6a3a'); ctx.globalAlpha = 1;
}
// A blade sign: the tall narrow one bolted at right angles to the wall so you
// can read it from down the street. Every second building has one.
function qsBlade(ctx, p, t, time) {
  const x = p.x - p.w / 2, y = p.y;
  rect(ctx, x - 10, y + 6, 12, 4, '#6a665e');
  rect(ctx, x - 10, y + p.h - 16, 12, 4, '#6a665e');
  rect(ctx, x, y, p.w, p.h, darken(p.col, 0.5));
  rect(ctx, x + 2, y + 2, p.w - 4, p.h - 4, p.col);
  rect(ctx, x + 2, y + 2, p.w - 4, 2, lighten(p.col, 0.3));
  const ink = p.col === '#f2c40c' ? '#241d28' : '#f4f1ea';
  const s = String(p.text || '');
  for (let i = 0; i < s.length; i++) {
    drawText(ctx, s[i], p.x, y + 8 + i * 13, ink, { align: 'center', scale: 2 });
  }
  const lit = qsLit(time);
  ctx.globalAlpha = 0.25 + 0.55 * lit;
  rect(ctx, x + 2, y + 2, 2, p.h - 4, lighten(p.col, 0.5));
  ctx.globalAlpha = 1;
  qsGlow(ctx, p.x, y + p.h / 2, p.w * 1.8, p.h * 0.6, lighten(p.col, 0.4), 0.14 * lit);
}
// The green overhead sign pointing at the station, the one you actually follow.
function qsArrowSign(ctx, p, t, time) {
  const x = p.x - p.w / 2, y = p.y;
  rect(ctx, x - 6, y - 14, 4, 16, '#6a665e');
  rect(ctx, x + p.w + 2, y - 14, 4, 16, '#6a665e');
  rect(ctx, x, y, p.w, p.h, '#0f2a20');
  rect(ctx, x + 2, y + 2, p.w - 4, p.h - 4, '#1f6f4a');
  rect(ctx, x + 2, y + 2, p.w - 4, 2, '#3f9f6a');
  drawText(ctx, p.text, x + 14, y + Math.round(p.h / 2) - 7, '#f4f1ea', { scale: 2 });
  // the arrow, stepped a row at a time, which is how every real pictogram on
  // a station sign is drawn anyway
  const ax = x + p.w - 20, ay = Math.round(y + p.h / 2);
  for (let i = 0; i < 8; i++) rect(ctx, ax + i, ay - 7 + i, 2, 15 - i * 2, '#f4f1ea');
  rect(ctx, ax - 8, ay - 2, 9, 5, '#f4f1ea');
  qsGlow(ctx, p.x, y + p.h / 2, p.w * 0.6, p.h, '#3fbf80', 0.1 * qsLit(time));
}
// The crossing runs on a clock of its own. This says where it is in it.
function qsCrossState(ct) {
  const T = ct % 52;
  if (T < 34) return { phase: 0, k: 0 };
  if (T < 38) return { phase: 1, k: (T - 34) / 4 };
  if (T < 40) return { phase: 1, k: 1 };
  if (T < 44) return { phase: 2, k: 1 };
  if (T < 46) return { phase: 1, k: 1 };
  if (T < 50) return { phase: 1, k: 1 - (T - 46) / 4 };
  return { phase: 0, k: 0 };
}

// ==========================================================================
//  GOING SOMEWHERE
// ==========================================================================
// One function, used by the prompts and by anything else that wants to send
// you through a door on this street - the phone's map, a goal, a cutscene.
// Every cross-file scene is optional, because they are built by other hands
// and this street has to stand up whether or not they exist yet.
function qsBack(S) {
  const time = S.qsTime, at = Math.round(S.body.x);
  return function () { return new QuietStreetScene({ time: time, at: at }); };
}
function qsEnterDoor(S, id) {
  const back = qsBack(S);
  switch (id) {
    case 'capsule': {
      // Going to bed ends the day, so it asks once, and only while there is
      // still light outside worth wasting.
      const early = qsNight(S.qsTime) < 0.4;
      const script = [
        { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'THAT IS THE DOOR. THAT IS BED.' },
      ];
      if (early) {
        script.push({
          who: '', voice: false, at: 'you', think: true, text: 'IT IS NOT EVEN DARK YET.',
          choices: [
            { label: 'GO IN ANYWAY', note: 'END THE DAY', next: 'in' },
            { label: 'NOT YET', note: 'THERE IS STILL LIGHT', next: 'out' },
          ],
        });
      }
      script.push({ id: 'in', who: '', voice: false, at: 'you', think: true, text: 'SHOES OFF. BAG IN THE LOCKER. LIE DOWN.', next: 'done' });
      script.push({ id: 'out', who: '', voice: false, at: 'you', think: true, text: 'NOT YET.', do: function () { S.qsBail = true; }, next: 'done' });
      script.push({ id: 'done' });
      S.qsBail = false;
      S.run(script, function () {
        if (S.qsBail) { S.qsBail = false; return; }
        if (typeof setChapter === 'function') setChapter('capsule');
        S.leave(function () {
          if (typeof CapsuleNightScene !== 'undefined') return new CapsuleNightScene();
          return new QuietStreetScene({ time: QS_NIGHT });
        }, 'fade', { dur: 1 });
      });
      return;
    }
    case 'mart': {
      if (typeof ShopInteriorScene === 'undefined') { S.flash('THE DOOR CHIMES. NOBODY HAS BUILT THE INSIDE YET.'); return; }
      const shop = (typeof shopById === 'function' && shopById('colonymart')) || 'colonymart';
      Audio.ui('select'); Voice.chime('shop');
      Game.go(function () { return new ShopInteriorScene(shop, back); }, 'iris');
      return;
    }
    case 'tonkatsu': {
      if (typeof TonkatsuScene === 'undefined') { S.flash('SHUT UNTIL ELEVEN. THE FRYER IS ALREADY ON.'); return; }
      Audio.ui('select');
      // TonkatsuScene takes an opts bag and reads opts.back for its own exit,
      // which is the SideScene convention, not a bare factory.
      Game.go(function () { return new TonkatsuScene({ back: back }); }, 'fade');
      return;
    }
    case 'subway': {
      Voice.chime('station');
      if (typeof SubwaySideScene !== 'undefined') { Game.go(function () { return new SubwaySideScene(back); }, 'slideL'); return; }
      if (typeof SubwayScene !== 'undefined') { Game.go(function () { return new SubwayScene(back); }, 'slideL'); return; }
      S.flash('THE STAIRS GO DOWN. THE STATION IS NOT OPEN YET.');
      return;
    }
    case 'music': {
      if (typeof ShopInteriorScene !== 'undefined') {
        const row = (typeof shopById === 'function' && shopById('ampoff')) || QS_AMPOFF;
        Audio.ui('select');
        Game.go(function () { return new ShopInteriorScene(row, back); }, 'iris');
        return;
      }
      // MusicShopScene still exists but it is a top-down room and this game
      // is not top-down any more, so there is no fallback worth taking.
      S.flash('SHUT. THERE IS A BASS IN THE WINDOW WITH NO STRINGS.');
      return;
    }
    case 'busk': {
      // The old BuskScene wants a tile map and a WorldCam, neither of which
      // this street has any more. Only the side version gets to take you.
      if (typeof BuskSideScene !== 'undefined') { Audio.ui('select'); Game.go(function () { return new BuskSideScene(back); }, 'fade'); return; }
      S.flash('THE WIDE BIT. NOBODY HAS PUT A CROWD IN IT YET.');
      return;
    }
    case 'crossing': {
      S.run([
        { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'THE STREET STOPS HERE.' },
        { who: '', voice: false, at: 'you', think: true, text: 'THE OTHER SIDE IS A CAR PARK AND A VERY LOUD BELL.' },
      ]);
      return;
    }
    default: return;
  }
}

// Where the crow is sitting, which is on the front cable, which sags.
function qsCrowY(x) {
  const i = Math.floor((x + 120) / QS_POLE_GAP);
  const a = qsPoleX(i), b = qsPoleX(i + 1);
  const k = clamp((x - a) / Math.max(1, b - a), 0, 1);
  return 158 + Math.sin(Math.PI * k) * 26;
}
// The strip along the bottom: every door on this street, where it is, and
// where you are between them. Four thousand pixels is a long way to guess.
function qsDoorStrip(ctx, S, t) {
  // On a phone the walk pads live in the bottom corners, so the strip pulls
  // its ends in rather than hiding underneath somebody's thumb.
  const pad = Game.touch ? 90 : 0;
  const bw = W - 160 - pad * 2, bx = 80 + pad, by = H - 24;
  ctx.globalAlpha = 0.5; rect(ctx, bx - 6, by - 6, bw + 12, 16, '#07060c'); ctx.globalAlpha = 1;
  rect(ctx, bx, by + 2, bw, 2, '#4a4458');
  let near = null, nd = 1e9;
  for (let i = 0; i < STREET_DOORS.length; i++) {
    const d = STREET_DOORS[i];
    const px2 = Math.round(bx + (d.x / QS_W) * bw);
    const dist = Math.abs(d.x - S.body.x);
    if (dist < nd) { nd = dist; near = d; }
    ctx.globalAlpha = dist < 140 ? 1 : 0.55;
    rect(ctx, px2 - 1, by - 2, 3, 8, dist < 140 ? d.tint : '#6a6478');
    rect(ctx, px2 - 1, by - 2, 3, 2, dist < 140 ? lighten(d.tint, 0.4) : '#8a84a0');
    ctx.globalAlpha = 1;
  }
  // you, as a little stepped chevron pointing down at where you actually are
  const yx = Math.round(bx + (clamp(S.body.x, 0, QS_W) / QS_W) * bw);
  for (let i = 0; i < 5; i++) rect(ctx, yx - 4 + i, by - 12 + i, 9 - i * 2, 1, QS_PAL.gold);
  rect(ctx, yx - 4, by - 13, 9, 1, '#fff2c0');
  if (near && nd < 260) {
    ctx.globalAlpha = clamp(1 - nd / 260, 0, 1);
    drawText(ctx, near.name, W / 2, by - 26, near.tint === '#f2c40c' ? '#ffe98a' : lighten(near.tint, 0.5), { align: 'center', scale: 2, outline: '#0a0810' });
    drawText(ctx, near.sub, W / 2, by - 12, '#8a84a0', { align: 'center', font: 'small' });
    ctx.globalAlpha = 1;
  }
}

// ==========================================================================
//  THE SCENE
// ==========================================================================
function qsStreetDef(o) {
  const time = clamp(o && o.time != null ? o.time : QS_MORNING, 0, 1);
  const night = qsNight(time);
  const when = night > 0.55 ? 'LATE' : night > 0.12 ? 'EVENING' : time > 0.3 ? 'AFTERNOON' : 'MORNING';
  return {
    name: 'THE QUIET STREET', sub: when + ' - EVERYTHING IS ON THIS ROAD', tint: '#3a4a6a',
    w: QS_W, zoom: 1, yBias: QS_BIAS, hud: true, canLeave: false, freeFloors: false,
    heroScale: 1.6, speed: 124,
    start: { x: (o && o.at != null) ? o.at : 300, floor: 0 },
    floors: [{ y: QS_Y, z: 1 }],
    enterLine: night > 0.5 ? 'THE VENDING MACHINES ARE DOING ALL THE LIGHTING.' : 'SOMEBODY IS ALREADY SWEEPING.',

    // The two lists are built fresh every time the street is entered, because
    // a prop carries live state (the cat's eye, the crossing's clock) and a
    // shared array would quietly remember yesterday.
    props: qsProps(),
    npcs: qsNpcs(),

    init: function (S) {
      S.qsTime = time;
      S.qsX = 26;                 // the crossing's own clock, started part way
      S.qsVanX = null; S.qsVanWait = 22; S.qsVanDir = -1;
      S.qsBell = 0; S.qsCat = 0; S.qsAsked = false; S.qsWished = false; S.qsBail = false;
      S.qsDust = 0;
      if (o && o.at != null) { S.body.x = o.at; S.cam.snapTo(S.body.x, S.floorY(S.body.fk)); }
      if (Game.run) { Game.run.pos = 'quietstreet'; if (typeof setChapter === 'function') setChapter('tokyo'); }
    },

    tick: function (S, dt) {
      S.qsX += dt;
      const X = qsCrossState(S.qsX);
      // the bell. you hear it from anywhere on the street, quieter far off.
      if (X.phase > 0) {
        S.qsBell -= dt;
        if (S.qsBell <= 0) { S.qsBell = 0.46; if (Math.abs(S.body.x - 4080) < 1400) Audio.ui('tally'); }
      } else S.qsBell = 0;
      // the cat opens one eye if you are standing right at it, then does not
      S.qsCat = Math.max(0, S.qsCat - dt);
      // a van comes past about twice a minute and takes the whole road
      if (S.qsVanX == null) {
        S.qsVanWait -= dt;
        if (S.qsVanWait <= 0) { S.qsVanDir = Math.random() < 0.5 ? 1 : -1; S.qsVanX = S.qsVanDir > 0 ? -220 : QS_W + 220; S.qsVanWait = 34 + Math.random() * 40; }
      } else {
        S.qsVanX += S.qsVanDir * 56 * dt;
        if (S.qsVanX < -320 || S.qsVanX > QS_W + 320) S.qsVanX = null;
      }
      // Dust, and at night the colder version of it. The particle list is
      // drawn after the camera has been popped, so everything that goes into
      // it is in SCREEN space - world pixels here would put the whole lot four
      // thousand pixels off the right-hand edge and nobody would ever see it.
      S.qsDust -= dt;
      if (S.qsDust <= 0) {
        S.qsDust = 0.5;
        const wx = S.body.x + (Math.random() - 0.5) * 460;
        S.fx.add({
          x: S.cam.sx(wx), y: S.cam.sy(200 + Math.random() * 220),
          vx: (Math.random() - 0.5) * 7, vy: 5 + Math.random() * 7, life: 3.4,
          color: night > 0.4 ? '#6a6480' : '#cfc8b0', size: 1, gravity: 0, kind: 'px',
        });
      }
    },

    sky: function (ctx, S, t) { qsSky(ctx, S, t, time); },
    back: function (ctx, S, t) { qsParallax(ctx, S, t, time); },

    mid: function (ctx, S, t) {
      const x0 = S.cam.wx(-260), x1 = S.cam.wx(W + 260);
      const lots = qsLots();
      for (let i = 0; i < lots.length; i++) {
        const b = lots[i];
        if (b.x + b.w < x0 - 40 || b.x > x1 + 40) continue;
        qsLot(ctx, b, t, time);
      }
      qsWiresBack(ctx, x0, x1, t);
      qsGround(ctx, x0, x1, t, time);
      const i0 = Math.max(0, Math.floor((x0 + 120) / QS_POLE_GAP) - 1);
      const i1 = Math.min(qsPoleCount(), Math.ceil((x1 + 120) / QS_POLE_GAP) + 1);
      for (let i = i0; i < i1; i++) qsPole(ctx, qsPoleX(i), t, time);
    },

    fore: function (ctx, S, t) {
      const x0 = S.cam.wx(-260), x1 = S.cam.wx(W + 260);
      qsWiresFront(ctx, x0, x1, t);
      if (S.cam.visible(1510, 200)) qsCrow(ctx, 1510, qsCrowY(1510), t);
      if (S.cam.visible(3240, 200)) qsCrow(ctx, 3240, qsCrowY(3240), t + 3.1);
      if (S.qsVanX != null && S.cam.visible(S.qsVanX, 320)) qsVan(ctx, S.qsVanX, t, S.qsVanDir);
    },

    after: function (ctx, S, t) {
      const night = qsNight(time), dusk = qsDusk(time) * (1 - night);
      // the half hour where the sky has gone and the machines have not taken
      // over yet, when the whole street is the colour of the inside of a lamp
      if (dusk > 0.02) grade(ctx, 0, 0, W, H, '#e08a4a', 0.16 * dusk);
      if (night > 0.05) grade(ctx, 0, 0, W, H, '#2a3a6a', 0.1 + 0.16 * night);
      else grade(ctx, 0, 0, W, H, '#b8c4d0', 0.08);
      vignette(ctx, 0.34 + 0.16 * night, '#07080f');
    },

    overlay: function (ctx, S, t) { qsDoorStrip(ctx, S, t); },

    prop: function (ctx, p, t, S) {
      const base = S.propY(p), x = p.x - p.w / 2;
      switch (p.kind) {
        case 'qsmirror': qsMirror(ctx, p.x, base, t, time); return true;
        case 'qshotel': qsHotelFront(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qspots': qsPots(ctx, x, p.n || 3, p.seed || 1, t); return true;
        case 'qsbikes': qsBikeRack(ctx, x, base, p.w, t, p.x); return true;
        case 'qslaundry': qsLaundry(ctx, x, base, p.w, p.h, t, time, S); return true;
        case 'qsvend': qsVendWall(ctx, x, base, p.w, t, time); return true;
        case 'qsmart': qsMart(ctx, x, base, p.w, p.h, t, time, S); return true;
        case 'qscrates': qsCrates(ctx, x, base, p.w, t); return true;
        case 'qsgrate': qsGrate(ctx, x, base, p.w, t); return true;
        case 'qsbarber': qsBarber(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qslowwall': qsLowWall(ctx, x, base, p.w, p.h, t); return true;
        case 'qscat': qsCat(ctx, p.x, base, t, S.qsCat > 0); return true;
        case 'qstonkatsu': qsTonkatsu(ctx, x, base, p.w, p.h, t, time, S); return true;
        case 'qsshutter': qsShutterFront(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qskoban': qsKoban(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qsbusk': qsBuskSpot(ctx, x, base, p.w, t, time); return true;
        case 'qssubway': qsSubway(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qsshrine': qsShrine(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qsmusic': qsAmpOff(ctx, x, base, p.w, p.h, t, time, S); return true;
        case 'qsyakitori': qsYakitori(ctx, x, base, p.w, p.h, t, time); return true;
        case 'qspostbox': qsPostBox(ctx, p.x, base, t); return true;
        case 'qspayphone': qsPayphone(ctx, p.x, base, t, time); return true;
        case 'qsscooter': qsScooter(ctx, p.x, base, t, -1); return true;
        case 'qscrossing': { const X = qsCrossState(S.qsX); qsCrossing(ctx, x, base, p.w, p.h, t, time, X.phase, X.k); return true; }
        case 'qsblade': qsBlade(ctx, p, t, time); return true;
        case 'qsarrow': qsArrowSign(ctx, p, t, time); return true;
      }
      return false;
    },

    use: function (S, p) {
      switch (p.act) {
        case 'capsule': case 'mart': case 'tonkatsu': case 'subway': case 'music': case 'busk': case 'crossing':
          qsEnterDoor(S, p.act); return;
        case 'vend': {
          const r = Game.run;
          if (r && r.money >= 2) {
            r.money -= 2;
            r.stamina = clamp((r.stamina || 0) + 10, 0, r.staminaMax || 240);
            r.save(); Audio.ui('coin');
            S.fx.burst(S.cam.sx(S.body.x + 16), S.cam.sy(QS_Y - 28), 8, { color: ['#f2c94c', '#ffeec4'], speed: 40, up: 30, life: 0.5 });
            S.flash(qsNight(time) > 0.4 ? 'HOT CORN SOUP. THE CAN IS TOO HOT TO HOLD. -$2' : 'COLD TEA IN A BOTTLE. -$2');
          } else { Audio.ui('error'); S.flash('THE MACHINE IS NOT INTERESTED IN YOUR POCKETS.'); }
          return;
        }
        case 'laundry': {
          S.run([
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'NOBODY IN THERE. THERE IS NEVER ANYBODY IN THERE.' },
            { who: '', voice: false, at: 'you', think: true, text: 'ONE MACHINE IS RUNNING. IT HAS BEEN RUNNING SINCE YESTERDAY.' },
          ]);
          return;
        }
        case 'barber': {
          S.say('BARBER SHIMA', 'OPEN AT TEN. SIT IF YOU LIKE. I AM NOT CUTTING YET.', 'oldman');
          return;
        }
        case 'yakitori': {
          if (qsNight(time) > 0.35) { S.say('HACHI', 'SIX STOOLS. FIVE OF THEM ARE TAKEN. TAKE THE END ONE.', 'driver'); return; }
          S.say('YOU', 'OPENS AT FIVE. IT SAYS SO IN THREE PLACES.', 'you');
          return;
        }
        case 'shrine': {
          const r = Game.run;
          if (S.qsWished) { S.say('YOU', 'ONE WISH A DAY. THAT IS THE DEAL YOU MADE WITH IT.', 'you'); return; }
          if (!r || r.money < 1) { Audio.ui('error'); S.flash('NOT EVEN ONE COIN. THE BOX WAITS.'); return; }
          S.qsWished = true;
          r.money -= 1; r.gratitude = (r.gratitude || 0) + 1; r.save();
          Audio.ui('coin'); Voice.chime('shop');
          S.fx.burst(S.cam.sx(2950), S.cam.sy(QS_Y - 40), 12, { color: ['#ffd24a', '#f4f1ea'], speed: 50, up: 40, life: 0.8 });
          S.run([
            { who: '', voice: false, at: { x: 2950, y: QS_Y - 110 }, think: true, text: 'THE COIN GOES IN. IT DOES NOT MAKE MUCH OF A NOISE.' },
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'TWO CLAPS. ONE BOW. YOU DO NOT KNOW THE ORDER.' },
            { who: '', voice: false, at: 'you', think: true, text: 'YOU ASK FOR THE SAME THING YOU ALWAYS ASK FOR.' },
          ], function () { S.flash('GRATITUDE +1. THE CUP OF WATER IS STILL FULL.'); });
          return;
        }
        case 'koban': {
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'A MAP OF THE WARD, AND FOUR FACES NOBODY HAS FOUND.' },
            { who: 'THE OFFICER', voice: 'guard', at: 'THE OFFICER', text: 'IF YOU ARE PLAYING, PLAY BY THE STATION.' },
            { who: 'THE OFFICER', voice: 'guard', at: 'THE OFFICER', text: 'NOT HERE. THE OLD MAN AT SIX COMPLAINS.' },
          ]);
          return;
        }
        case 'cat': {
          S.qsCat = 2.6; Audio.ui('pop');
          S.run([
            { who: '', voice: false, at: { x: 1600, y: 360 }, think: true, text: 'ONE EYE. THAT IS ALL YOU GET.' },
            { who: 'YOU', voice: 'you', at: 'you', text: 'GOOD MORNING.' },
            { who: '', voice: false, at: { x: 1600, y: 360 }, think: true, text: 'THE EYE CLOSES.' },
          ]);
          return;
        }
        case 'bikes': { S.say('YOU', 'SIX BIKES. ONE FLAT TYRE. ONE TICKET FROM THE WARD OFFICE.', 'you'); return; }
        case 'crates': { S.say('YOU', 'TUESDAY IS BOTTLES. THE BRICKS ARE SO THE CROWS CANNOT.', 'you'); return; }
        case 'drain': { S.say('YOU', 'YOU CAN HEAR WATER UNDER THE WHOLE STREET.', 'you'); return; }
        case 'shutter': {
          S.run([
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'THE SIGN IS STILL UP. THE LETTERS ARE GONE.' },
            { who: '', voice: false, at: 'you', think: true, text: 'SOMEBODY SPENT THIRTY YEARS BEHIND THAT SHUTTER.' },
          ]);
          return;
        }
        case 'post': { S.say('YOU', 'LAST COLLECTION 16:00. THE SLOT IS WARM.', 'you'); return; }
        case 'payphone': {
          if (typeof openPhoneScene === 'function' && Game.run) {
            S.say('YOU', 'YOU HAVE A PHONE. IT IS IN YOUR POCKET. PRESS P.', 'you');
            return;
          }
          S.say('YOU', 'IT STILL WORKS. THAT IS THE STRANGE PART.', 'you');
          return;
        }
      }
    },
  };
}

// The hub. It takes a time of day so the same street can be your morning,
// your afternoon and the walk home, and an x so a door can put you back down
// exactly where you left from.
class QuietStreetScene extends SideScene {
  constructor(opts) {
    const o = opts || {};
    super(qsStreetDef(o), o);
    this.qsOpts = o;
  }
  // The people here carry things the engine does not know about: a broom, a
  // delivery cube, a dog on a lead, a satchel, a bag of other people's bills.
  drawNpc(ctx, n) {
    super.drawNpc(ctx, n);
    const y = n.y != null ? n.y : this.floorY(n.floor);
    const x = n._x, f = n.face || 1, t = this.t;
    switch (n.extra) {
      case 'broom': {
        const sweep = Math.sin(t * 2.2) * 5;
        const hx = x + f * 14;
        line(ctx, hx, y - 36, hx + f * 10 + sweep, y - 2, '#8a6a42');
        rect(ctx, Math.round(hx + f * 8 + sweep - 8), y - 6, 18, 7, '#9a7a42');
        for (let i = 0; i < 9; i++) rect(ctx, Math.round(hx + f * 8 + sweep - 8 + i * 2), y - 2, 1, 4, '#c8a868');
        // the dustpan, propped against her ankle, and the little pile
        rect(ctx, x - f * 16, y - 8, 10, 8, '#3a5a8a');
        ctx.globalAlpha = 0.5; ellipsePx(ctx, hx + f * 12 + sweep, y + 1, 8, 2, '#6a5a3a'); ctx.globalAlpha = 1;
        break;
      }
      case 'cube': {
        // the insulated cube on his back, bigger than he is, strapped twice
        const bx = x - f * 16;
        rect(ctx, bx - 13, y - 58, 26, 30, '#2f7a4a');
        rect(ctx, bx - 13, y - 58, 26, 3, '#4fa86a');
        rect(ctx, bx - 13, y - 31, 26, 3, '#1c5230');
        rect(ctx, bx - 10, y - 54, 20, 13, '#f4f1ea');
        ctx.globalAlpha = 0.8; drawKanaBlock(ctx, bx - 5, y - 52, 9, '#2f7a4a', 4); ctx.globalAlpha = 1;
        rect(ctx, bx - 13, y - 46, 26, 2, '#1c5230');
        break;
      }
      case 'dog': {
        // a very small dog, four pixels of leg, on a lead that is always taut
        const dx = x + f * 30 + Math.sin(t * 3) * 2;
        line(ctx, x + f * 10, y - 30, dx - f * 5, y - 10, '#c8402c');
        ellipsePx(ctx, dx, y - 7, 8, 5, '#e0d0b0');
        ellipsePx(ctx, dx + f * 7, y - 10, 5, 4, '#e0d0b0');
        rect(ctx, dx + f * 10, y - 10, 3, 2, '#3a3038');
        px(ctx, dx + f * 7, y - 11, '#241d28');
        rect(ctx, dx + f * 4, y - 14, 3, 4, '#c8b898');
        rect(ctx, dx - 5, y - 3, 2, 3, '#c8b898'); rect(ctx, dx + 3, y - 3, 2, 3, '#c8b898');
        const wag = Math.sin(t * 9) * 3;
        line(ctx, dx - f * 7, y - 9, dx - f * 11, y - 13 + wag, '#e0d0b0');
        break;
      }
      case 'satchel': {
        rect(ctx, x - f * 15, y - 46, 17, 20, '#8a2a1c');
        rect(ctx, x - f * 15, y - 46, 17, 3, '#b04a38');
        rect(ctx, x - f * 15, y - 34, 17, 3, '#5a160e');
        rect(ctx, x - f * 9, y - 48, 4, 4, '#3a3444');
        break;
      }
      case 'mailbag': {
        rect(ctx, x + f * 14, y - 30, 20, 22, '#2f4a68');
        rect(ctx, x + f * 14, y - 30, 20, 3, '#4a6f96');
        for (let i = 0; i < 4; i++) rect(ctx, x + f * 16 + i * 4, y - 34, 3, 6, '#e8e2d2');
        line(ctx, x + f * 8, y - 44, x + f * 22, y - 28, '#2f4a68');
        break;
      }
    }
  }
}
