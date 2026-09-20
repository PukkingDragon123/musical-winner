// ---------- The subway, which is two places pretending to be one ----------
// A station is a tiled room with a hole at each end and a yellow line you are
// told not to cross. Nothing happens in it for four minutes and then the air
// moves, which is how you know. The train arrives before the sound of it does.
//
// The carriage is the other place. It is seen side-on because that is the only
// way you ever see it: a wall of shoulders, a row of straps all leaning the
// same way, and somebody's bag against your case. You cannot walk in it. That
// is not a bug in the controls, that is the 8:40.
//
//   SubwayPlatformScene  - wait, notice the wind, board
//   SubwaySideScene      - five stops on the green loop, and you have to
//                          notice yours, because nobody is going to help you
'use strict';

// ---------- the palette of underground things ----------
// Two greys for tile, one for grout, a cold white for the strip lights, and
// the green that the line owns and nothing else is allowed to use.
const SUB2_PAL = {
  tile: '#cfd3cc', tileLo: '#aeb3ad', tileHi: '#e6e9e2', grout: '#8b9089',
  wall: '#3d4450', wallLo: '#2a303a', wallHi: '#535c6b',
  deep: '#141821', black: '#090b11',
  floor: '#8e8a80', floorLo: '#77736a', floorHi: '#a9a59a',
  steel: '#b9bec6', steelHi: '#e2e6ec', steelLo: '#8a8f98',
  yellow: '#f2c037', yellowHi: '#ffe07a', yellowLo: '#a87e12',
  green: '#2f9e5e', greenHi: '#6be585', greenLo: '#16603a',
  cream: '#f4f1ea', ink: '#241d28', amber: '#f2a03a', red: '#c8402c',
  moq: '#3a5a8a', moqHi: '#4f74a8', moqLo: '#25406a',
  prio: '#7a4a8a', prioHi: '#9a6aaa',
  car: '#c6cbd2', carHi: '#e8ecf0', carLo: '#8d939c',
  lamp: '#fff6d8',
};

// ---------- the line ----------
// A loop, like the good ones are. Miss your stop and the punishment is not
// that you are lost, it is that you will be back here in twenty minutes with
// everyone who watched you miss it.
const SUB2_LINE = { letter: 'G', name: 'GREEN LOOP', col: SUB2_PAL.green };
const SUB2_STOPS = [
  { name: 'KOMAGOME', code: 'G 09', note: 'WHERE THE STAIRS CAME DOWN' },
  { name: 'SENDAGI', code: 'G 10', note: 'TWO EXITS. BOTH WRONG.' },
  { name: 'NEZU', code: 'G 11', note: 'EVERYBODY GETS OFF HERE' },
  { name: 'UENO', code: 'G 12', note: 'PARK, ZOO, AND THE BIG ROAD' },
  { name: 'AKIHABARA', code: 'G 13', note: 'NOISE, FOUR FLOORS OF IT' },
];
function sub2StopIndex(name) {
  if (!name) return 3;
  const n = String(name).toUpperCase();
  for (let i = 0; i < SUB2_STOPS.length; i++) if (SUB2_STOPS[i].name === n) return i;
  return 3;
}
// Both classes are called from three different places with three different
// ideas of what the arguments are. Sort it out once, here, quietly.
function sub2Opts(a, b) {
  const o = { back: null, dest: null };
  if (typeof a === 'function') o.back = a;
  else if (typeof a === 'string') o.dest = a;
  else if (a && typeof a === 'object') { o.back = a.back || null; o.dest = a.dest || a.destination || null; }
  if (typeof b === 'function') o.back = b;
  else if (typeof b === 'string') o.dest = b;
  else if (b && typeof b === 'object' && b.back) o.back = b.back;
  return o;
}
// Where you end up if nobody told us where you came from. SideScene.leave()
// falls back to a scene this game does not have, so the subway never hands it
// a null and hopes: it always names somewhere real.
function sub2Home(o) {
  if (o && o.back) return o.back;
  return function () {
    if (typeof QuietStreetScene !== 'undefined') return new QuietStreetScene({});
    if (typeof CityScene !== 'undefined') return new CityScene();
    return new TitleScene();
  };
}

// ==========================================================================
//  SHARED UNDERGROUND FURNITURE
// ==========================================================================

// The wall. Four hundred identical tiles with one cracked one, because there
// is always one and you will find it while you wait.
function sub2TileWall(ctx, x0, x1, y0, y1, seed) {
  const tw = 26, th = 18;
  rect(ctx, x0, y0, x1 - x0, y1 - y0, SUB2_PAL.grout);
  const r = makeRng((seed || 3) >>> 0);
  let row = 0;
  for (let y = y0; y < y1; y += th) {
    const off = (row % 2) ? tw / 2 : 0;
    for (let x = Math.floor((x0 - off) / tw) * tw + off; x < x1; x += tw) {
      const k = r();
      const c = k < 0.06 ? SUB2_PAL.tileLo : k > 0.94 ? SUB2_PAL.tileHi : SUB2_PAL.tile;
      rect(ctx, x + 1, y + 1, tw - 2, th - 2, c);
      rect(ctx, x + 1, y + 1, tw - 2, 1, lighten(c, 0.25));
      rect(ctx, x + 1, y + th - 2, tw - 2, 1, darken(c, 0.18));
      if (k > 0.985) { line(ctx, x + 4, y + 3, x + tw - 6, y + th - 5, SUB2_PAL.grout); }
    }
    row++;
  }
  // the grime line at shoulder height, which every tiled wall on earth has
  ctx.globalAlpha = 0.1;
  rect(ctx, x0, y1 - 46, x1 - x0, 20, '#40381f');
  ctx.globalAlpha = 1;
}

// A hole in the wall with a curve at the top of it and nothing at the back.
// The rails run out of it and the air comes out of it first.
function sub2Tunnel(ctx, cx, base, w, h, t, glow) {
  const x = cx - w / 2;
  // the concrete surround, stepped rather than curved, because pixels
  rect(ctx, x - 10, base - h - 12, w + 20, h + 12, '#5a5f68');
  rect(ctx, x - 10, base - h - 12, w + 20, 3, '#7a8089');
  for (let i = 0; i < 6; i++) {
    const k = i / 6, ww = w * (1 - k * 0.12);
    rect(ctx, cx - ww / 2, base - h + i * 4, ww, 5, i % 2 ? '#4a4f58' : '#3f444c');
  }
  // the mouth itself: black, with the arch cut in steps
  rect(ctx, x, base - h + 22, w, h - 22, SUB2_PAL.black);
  for (let i = 0; i < 8; i++) {
    const k = i / 8, ww = w * Math.sqrt(1 - k * k * 0.9);
    rect(ctx, cx - ww / 2, base - h + 22 - i * 3, ww, 4, SUB2_PAL.black);
  }
  // the ribs going away, which is what makes it a tunnel and not a doorway
  for (let i = 1; i < 5; i++) {
    const k = i / 5, ww = w * (1 - k * 0.5), hh = (h - 22) * (1 - k * 0.42);
    ctx.globalAlpha = 0.5 - k * 0.34;
    frame(ctx, cx - ww / 2, base - hh, ww, hh, '#2a303a');
    ctx.globalAlpha = 1;
  }
  // rails, disappearing into it
  rect(ctx, x + 6, base - 5, w - 12, 2, '#5f646c');
  rect(ctx, x + 6, base - 12, w - 12, 2, '#5f646c');
  // the headlight of something a long way off, arriving before it does
  if (glow > 0.01) {
    ctx.globalAlpha = clamp(glow, 0, 1) * 0.6;
    ellipsePx(ctx, cx, base - h * 0.45, w * 0.34 * glow, h * 0.3 * glow, '#ffe9a8');
    ctx.globalAlpha = clamp(glow, 0, 1);
    circle(ctx, cx - 7, base - h * 0.46, 3, '#fff6d8');
    circle(ctx, cx + 7, base - h * 0.46, 3, '#fff6d8');
    ctx.globalAlpha = 1;
  }
}

// The yellow strip with the bumps on it, which is the only thing in the
// station that is trying to save your life.
function sub2Tactile(ctx, x0, x1, y) {
  rect(ctx, x0, y, x1 - x0, 13, SUB2_PAL.yellow);
  rect(ctx, x0, y, x1 - x0, 2, SUB2_PAL.yellowHi);
  rect(ctx, x0, y + 11, x1 - x0, 2, SUB2_PAL.yellowLo);
  for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) {
    rect(ctx, x + 3, y + 4, 5, 5, SUB2_PAL.yellowLo);
    rect(ctx, x + 3, y + 4, 5, 2, '#ffffff');
  }
}
// Where the doors will be, painted on the floor in the confident way of a
// railway that has never once been wrong about it.
function sub2QueueMarks(ctx, doors, y, t, open) {
  for (let i = 0; i < doors.length; i++) {
    const dx = doors[i];
    ctx.globalAlpha = 0.85;
    for (let s = -1; s <= 1; s += 2) {
      rect(ctx, dx + s * 30 - 12, y, 24, 3, SUB2_PAL.cream);
      rect(ctx, dx + s * 30 - 12, y + 11, 24, 3, SUB2_PAL.cream);
      // the arrow that tells you which way to stand, pointing at the door
      ctx.fillStyle = SUB2_PAL.cream;
      ctx.beginPath();
      ctx.moveTo(dx + s * 18, y + 7); ctx.lineTo(dx + s * 28, y + 1); ctx.lineTo(dx + s * 28, y + 13);
      ctx.fill();
    }
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3 + i);
    rect(ctx, dx - 9, y + 3, 18, 8, open > 0.4 ? SUB2_PAL.greenHi : SUB2_PAL.yellow);
    ctx.globalAlpha = 1;
  }
}

// The station name board. You can read the numbers and nothing else, which is
// exactly how much of it you need.
function sub2NameBoard(ctx, x, y, w, h, stop, prev, next) {
  rect(ctx, x, y, w, h, SUB2_PAL.cream);
  frame(ctx, x, y, w, h, '#6a6a62');
  rect(ctx, x, y, w, 3, '#ffffff');
  rect(ctx, x, y + h - 4, w, 4, SUB2_LINE.col);
  // the line roundel with its letter and its number, the two readable things
  const cx = x + 26, cy = y + Math.round(h * 0.42);
  circle(ctx, cx, cy, 15, SUB2_LINE.col);
  circle(ctx, cx, cy, 12, SUB2_PAL.cream);
  circle(ctx, cx, cy, 10, SUB2_LINE.col);
  drawText(ctx, stop.code.split(' ')[1], cx, cy - 6, SUB2_PAL.cream, { align: 'center', scale: 2 });
  drawText(ctx, stop.name, x + 50, y + 10, SUB2_PAL.ink, { scale: 3 });
  // the unreadable line underneath, which is the same thing said properly
  for (let i = 0; i < 4; i++) drawKanaBlock(ctx, x + 50 + i * 13, y + 36, 11, '#4a4a52', i * 2 + 1);
  // the two neighbours, with their arrows, in smaller everything
  drawText(ctx, '< ' + prev.name, x + 8, y + h - 18, '#7a7a72', { font: 'small' });
  drawText(ctx, next.name + ' >', x + w - 8, y + h - 18, '#7a7a72', { align: 'right', font: 'small' });
}

// An ad panel hung off the ceiling on two chains. It swings when the train
// comes, a beat after the air does.
function sub2AdPanel(ctx, x, yTop, w, h, t, seed, sway) {
  const r = makeRng((seed || 1) >>> 0);
  const lean = Math.round(sway * 3);
  rect(ctx, x + 6, yTop - 16, 2, 16, SUB2_PAL.steelLo);
  rect(ctx, x + w - 8, yTop - 16, 2, 16, SUB2_PAL.steelLo);
  const bx = x + lean;
  rect(ctx, bx, yTop, w, h, '#1b1f28');
  const bg = r.pick(['#e8503a', '#2f6fc0', '#f2c94c', '#6be585', '#d86a90', '#f4f1ea']);
  rect(ctx, bx + 2, yTop + 2, w - 4, h - 4, bg);
  rect(ctx, bx + 2, yTop + 2, w - 4, 2, lighten(bg, 0.3));
  // a face, a product, and a column of writing nobody reads at speed
  const fx = bx + 12;
  ellipsePx(ctx, fx + 9, yTop + h * 0.5, 10, 12, '#f4d8c0');
  ellipsePx(ctx, fx + 9, yTop + h * 0.32, 11, 8, r.pick(['#3a2a28', '#6a4a2a', '#241d28']));
  px(ctx, fx + 5, yTop + h * 0.48, SUB2_PAL.ink); px(ctx, fx + 13, yTop + h * 0.48, SUB2_PAL.ink);
  const kc = darken(bg, 0.55);
  for (let i = 0; i < 3; i++) drawKanaBlock(ctx, bx + w - 20, yTop + 7 + i * 13, 11, kc, r.int(0, 5));
  for (let i = 0; i < 2; i++) drawKanaBlock(ctx, bx + w - 34, yTop + 12 + i * 13, 9, kc, r.int(0, 5));
  // a price, which is the one part of an advert that is always legible
  const price = r.int(2, 9) + ',' + pad2(r.int(0, 9)) + '0';
  drawText(ctx, price, bx + w - 6, yTop + h - 13, kc, { align: 'right', scale: 2 });
  ctx.globalAlpha = 0.12;
  rect(ctx, bx + 2, yTop + 2, w - 4, Math.round(h * 0.34), '#ffffff');
  ctx.globalAlpha = 1;
}

// The LED strip. Orange dots on black, one line at a time, and it will hold
// the thing you need for one second and the thing you do not for nine.
function sub2Led(ctx, x, y, w, h, t, text, col, scroll) {
  rect(ctx, x, y, w, h, '#0a0b10');
  frame(ctx, x, y, w, h, '#2a2f38');
  ctx.save();
  ctx.beginPath(); ctx.rect(x + 3, y + 3, w - 6, h - 6); ctx.clip();
  const tw = textWidth(text, { scale: 2 });
  const sx = scroll ? x + w - ((t * 58) % (tw + w + 40)) : x + 8;
  drawText(ctx, text, Math.round(sx), y + Math.round(h / 2) - 7, col || SUB2_PAL.amber, { scale: 2 });
  ctx.restore();
  // the dot matrix, which is what makes it an LED and not a poster
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < w; i += 3) rect(ctx, x + i, y, 1, h, '#000');
  for (let i = 0; i < h; i += 3) rect(ctx, x, y + i, w, 1, '#000');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.1;
  rect(ctx, x, y + h, w, 5, col || SUB2_PAL.amber);
  ctx.globalAlpha = 1;
}

// A convex mirror on a pole at the end of the platform, so the driver can see
// what he is about to be late because of.
function sub2Mirror(ctx, x, base, t, S) {
  rect(ctx, x - 3, base - 118, 6, 118, '#4a5058');
  rect(ctx, x - 3, base - 118, 2, 118, '#6a7079');
  rect(ctx, x - 9, base - 4, 18, 4, '#3a3f46');
  circle(ctx, x, base - 132, 23, '#2a2f38');
  circle(ctx, x, base - 132, 20, '#7f8a94');
  // what is in it: the platform, squeezed, and two smears that are people
  ctx.globalAlpha = 0.55;
  ellipsePx(ctx, x, base - 126, 18, 9, '#9aa6b0');
  rect(ctx, x - 18, base - 134, 36, 3, '#c8cfd6');
  ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) {
    const o = Math.sin(t * 0.6 + i * 2) * 11;
    ctx.globalAlpha = 0.5;
    ellipsePx(ctx, x + o, base - 130, 3, 6, '#3a4048');
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.3;
  ellipsePx(ctx, x - 7, base - 140, 7, 5, '#ffffff');
  ctx.globalAlpha = 1;
}

// The kiosk: a hole in the wall selling four newspapers, six drinks and the
// exact stamp you needed three stations ago.
function sub2Kiosk(ctx, x, base, w, h, t) {
  const top = base - h;
  rect(ctx, x, top, w, h, '#2c3038');
  rect(ctx, x + 3, top + 3, w - 6, h - 6, '#1b1f26');
  // the lit box of it
  rect(ctx, x + 6, top + 30, w - 12, h - 62, '#4a4030');
  ctx.globalAlpha = 0.35;
  vgrad(ctx, x + 6, top + 30, w - 12, h - 62, '#ffe9a8', '#1a1408');
  ctx.globalAlpha = 1;
  // magazines on a rack, all facing out, all the same size
  for (let r = 0; r < 2; r++) {
    const ry = top + 40 + r * 30;
    rect(ctx, x + 10, ry + 24, w - 20, 3, '#6a5f4a');
    for (let i = 0; i < Math.floor((w - 24) / 17); i++) {
      const c = ['#c8402c', '#2f6fc0', '#f2c94c', '#6be585', '#d86a90'][(i + r) % 5];
      rect(ctx, x + 13 + i * 17, ry + 4, 14, 20, c);
      rect(ctx, x + 13 + i * 17, ry + 4, 14, 3, lighten(c, 0.35));
      drawKanaBlock(ctx, x + 16 + i * 17, ry + 10, 8, darken(c, 0.5), (i * 3 + r) % 6);
    }
  }
  // the counter, the till, and the man who has not looked up
  rect(ctx, x + 4, base - 34, w - 8, 30, '#6a5236');
  rect(ctx, x + 4, base - 34, w - 8, 4, '#8a6f4a');
  rect(ctx, x + w - 34, base - 46, 22, 14, '#3a3f46');
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2.4);
  rect(ctx, x + w - 31, base - 43, 16, 7, '#6be585');
  ctx.globalAlpha = 1;
  drawBugAt(ctx, cachedBrandStaff({ name: 'KIOSK' }), x + w * 0.35, base - 30, {
    pose: Math.floor(t * 0.7) % 3 ? 'idle' : 'talk', scale: 1.2, bounce: 0.35, phase: 2.2,
  });
  // the awning and the one word of it you can read
  rect(ctx, x - 5, top, w + 10, 22, SUB2_PAL.green);
  rect(ctx, x - 5, top, w + 10, 3, SUB2_PAL.greenHi);
  for (let i = 0; i < 3; i++) drawKanaBlock(ctx, x + 10 + i * 15, top + 5, 12, SUB2_PAL.cream, i + 2);
  drawText(ctx, '24H', x + w - 10, top + 6, SUB2_PAL.cream, { align: 'right', scale: 2 });
}

// Two benches back to back, which is the only honest piece of furniture in
// the whole system: it admits that nobody here is together.
function sub2Bench(ctx, x, base, w, t) {
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x + w / 2, base + 1, w * 0.48, 5, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, base - 26, w, 8, '#2f4a68');
  rect(ctx, x, base - 26, w, 3, '#4f74a8');
  rect(ctx, x, base - 19, w, 2, '#1f3550');
  // the back, which two people are leaning on from opposite directions
  rect(ctx, x + w * 0.5 - 3, base - 58, 6, 34, '#38414e');
  rect(ctx, x + 4, base - 58, w - 8, 6, '#2f4a68');
  rect(ctx, x + 4, base - 58, w - 8, 2, '#4f74a8');
  // the armrests in the middle, put there so you cannot lie down
  for (let i = 1; i < 3; i++) {
    rect(ctx, x + (w / 3) * i - 2, base - 38, 4, 14, SUB2_PAL.steelLo);
    rect(ctx, x + (w / 3) * i - 2, base - 38, 4, 2, SUB2_PAL.steelHi);
  }
  rect(ctx, x + 6, base - 18, 5, 18, '#3a3f46');
  rect(ctx, x + w - 11, base - 18, 5, 18, '#3a3f46');
  // seat numbers, painted on and worn off
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) drawText(ctx, String(i + 1), x + 14 + i * (w / 3), base - 24, '#9ab4d0', { font: 'small' });
  ctx.globalAlpha = 1;
}

// A roof column. Tiled like the wall for the first two metres and painted
// above that, because that is how high a person can reach with a bucket.
// Painted with the station rather than kept as a prop: props are drawn after
// the scenery, and a pillar that is drawn after the fire extinguisher bolted
// to it is a pillar with a fire extinguisher inside it.
function sub2Pillar(ctx, x, top, base) {
  const w = 46, hx = x - w / 2;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x, base + 1, 30, 6, '#000'); ctx.globalAlpha = 1;
  rect(ctx, hx, top, w, base - top, '#5d6069');
  rect(ctx, hx, top, 4, base - top, '#787c86');
  rect(ctx, hx + w - 5, top, 5, base - top, '#3f434b');
  // the tiled skirt, which stops at shoulder height and is chipped at the
  // corners where every trolley in the city has hit it
  sub2TileWall(ctx, hx + 4, hx + w - 5, base - 150, base - 14, hashStr('pil' + x));
  rect(ctx, hx + 4, base - 152, w - 9, 3, SUB2_PAL.steelLo);
  rect(ctx, hx - 4, base - 14, w + 8, 14, '#4a4e56');
  rect(ctx, hx - 4, base - 14, w + 8, 3, '#6a6e77');
  rect(ctx, hx - 3, top, w + 6, 8, '#6a6e77');
  rect(ctx, hx - 3, top, w + 6, 2, '#8a8e97');
  // the number stencilled on every column of every platform, and the strip
  // of tape somebody put under it in 1998 and nobody has dared remove
  drawText(ctx, String(6 + ((x / 460) | 0)), x, base - 190, '#9aa0a8', { align: 'center', scale: 2 });
  rect(ctx, hx + 6, base - 168, w - 14, 4, SUB2_PAL.yellowLo);
  ctx.globalAlpha = 0.12;
  rect(ctx, hx + 4, top + 8, w - 9, base - top - 22, '#ffffff');
  ctx.globalAlpha = 1;
}

// ---------- the train ----------
// Three cars, silver, with the line's green through the middle of them, and
// a nose that is flat because it spends its life in a pipe.
const SUB2_CAR_L = 800, SUB2_CARS = 3, SUB2_TRAIN_L = SUB2_CAR_L * SUB2_CARS;
const SUB2_DOOR_OFF = [188, 388, 588];        // doors within one car
function sub2TrainDoors(trainX) {
  const out = [];
  for (let c = 0; c < SUB2_CARS; c++) for (let i = 0; i < SUB2_DOOR_OFF.length; i++) out.push(trainX + c * SUB2_CAR_L + SUB2_DOOR_OFF[i]);
  return out;
}
// One sliding pair of doors, with the glass, the rubber, and the light that
// falls out of them onto the platform.
function sub2Doors(ctx, dx, top, bot, open, t, spill) {
  const w = 96, half = Math.round((w / 2) * (1 - clamp(open, 0, 1)));
  const h = bot - top;
  // the pocket, dark, with the lit interior behind it
  rect(ctx, dx - w / 2, top, w, h, '#161a22');
  rect(ctx, dx - w / 2 + 3, top + 3, w - 6, h - 6, '#4a4436');
  ctx.globalAlpha = 0.5;
  vgrad(ctx, dx - w / 2 + 3, top + 3, w - 6, h - 6, '#ffe9a8', '#241d18');
  ctx.globalAlpha = 1;
  // two or three people in the doorway, because there always are
  if (open > 0.25) {
    for (let i = -1; i <= 1; i++) {
      ctx.globalAlpha = 0.55;
      ellipsePx(ctx, dx + i * 22, top + h * 0.62, 11, 17, '#241d28');
      ellipsePx(ctx, dx + i * 22, top + h * 0.38, 8, 8, '#241d28');
      ctx.globalAlpha = 1;
    }
  }
  // the leaves
  for (const s of [-1, 1]) {
    const lx = s < 0 ? dx - w / 2 : dx + w / 2 - half;
    rect(ctx, lx, top, half, h, SUB2_PAL.car);
    rect(ctx, lx, top, half, 3, SUB2_PAL.carHi);
    rect(ctx, lx, bot - 4, half, 4, SUB2_PAL.carLo);
    if (half > 14) {
      rect(ctx, lx + 5, top + 12, half - 10, Math.round(h * 0.42), '#26313f');
      ctx.globalAlpha = 0.22;
      rect(ctx, lx + 5, top + 12, half - 10, Math.round(h * 0.2), '#bfe0ff');
      ctx.globalAlpha = 1;
      // the sticker of a hand being caught in it
      rect(ctx, lx + 6, top + Math.round(h * 0.6), 12, 10, SUB2_PAL.yellow);
    }
    rect(ctx, s < 0 ? lx + half - 2 : lx, top, 2, h, '#3a3f46');
  }
  // the warning lamp over the door, going while they are not shut
  if (open > 0.02 && open < 0.99) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 12);
    rect(ctx, dx - 8, top - 9, 16, 6, SUB2_PAL.amber);
    ctx.globalAlpha = 1;
  }
  // light on the platform, which is how you find a door without looking up
  if (spill && open > 0.1) {
    ctx.globalAlpha = 0.14 * open;
    ctx.fillStyle = SUB2_PAL.lamp;
    ctx.beginPath();
    ctx.moveTo(dx - w / 2, bot); ctx.lineTo(dx + w / 2, bot);
    ctx.lineTo(dx + w * 0.9, bot + 46); ctx.lineTo(dx - w * 0.9, bot + 46);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
// The whole train, side on, at whatever x it has got to.
function sub2Train(ctx, S, t, trainX, open, moving) {
  const bot = SUB2_P_RAIL, top = bot - 192;
  for (let c = 0; c < SUB2_CARS; c++) {
    const x = trainX + c * SUB2_CAR_L;
    if (!S.cam.visible(x + SUB2_CAR_L / 2, SUB2_CAR_L)) continue;
    // body, roof, skirt
    rect(ctx, x + 4, top, SUB2_CAR_L - 8, bot - top, SUB2_PAL.car);
    rect(ctx, x + 4, top, SUB2_CAR_L - 8, 4, SUB2_PAL.carHi);
    rect(ctx, x + 4, top + 12, SUB2_CAR_L - 8, 2, lighten(SUB2_PAL.car, 0.18));
    rect(ctx, x + 4, bot - 26, SUB2_CAR_L - 8, 26, darken(SUB2_PAL.car, 0.34));
    rect(ctx, x + 4, bot - 26, SUB2_CAR_L - 8, 2, SUB2_PAL.carLo);
    // the roof furniture: aircon, and the cable that feeds it
    rect(ctx, x + 40, top - 12, SUB2_CAR_L - 80, 12, '#9aa0a8');
    rect(ctx, x + 40, top - 12, SUB2_CAR_L - 80, 2, '#c0c6ce');
    for (let i = 0; i < 3; i++) rect(ctx, x + 120 + i * 200, top - 22, 78, 11, '#7a8089');
    // the line stripe, which is the only colour on it
    rect(ctx, x + 4, top + 118, SUB2_CAR_L - 8, 14, SUB2_LINE.col);
    rect(ctx, x + 4, top + 118, SUB2_CAR_L - 8, 2, SUB2_PAL.greenHi);
    rect(ctx, x + 4, top + 136, SUB2_CAR_L - 8, 4, darken(SUB2_LINE.col, 0.3));
    // the windows, and the heads in them
    const doors = SUB2_DOOR_OFF;
    let wx = x + 30;
    while (wx < x + SUB2_CAR_L - 70) {
      let clash = false;
      for (let i = 0; i < doors.length; i++) if (Math.abs(wx + 34 - (x + doors[i])) < 84) clash = true;
      if (!clash) {
        rect(ctx, wx, top + 26, 68, 74, '#26313f');
        rect(ctx, wx + 2, top + 28, 64, 70, '#3c4a2e');
        ctx.globalAlpha = 0.55;
        vgrad(ctx, wx + 2, top + 28, 64, 70, '#ffe9a8', '#2a2418');
        ctx.globalAlpha = 1;
        // shoulders and heads, packed, all facing the same way
        const r = makeRng(hashStr('sub2win' + c + Math.round(wx)));
        for (let i = 0; i < 4; i++) {
          const hx = wx + 10 + i * 16 + r.int(-2, 2);
          ctx.globalAlpha = 0.72;
          ellipsePx(ctx, hx, top + 82, 9, 16, darken(r.pick(['#3a4a6a', '#5a3a3a', '#2f4a3a', '#3a3550']), 0.2));
          ellipsePx(ctx, hx, top + 60, 7, 7, '#2a2028');
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = 0.18;
        rect(ctx, wx + 2, top + 28, 64, 22, '#bfe0ff');
        ctx.globalAlpha = 1;
        rect(ctx, wx, top + 96, 68, 4, SUB2_PAL.carLo);
      }
      wx += 78;
    }
    // the car number, stencilled, and a little unreadable plate next to it
    drawText(ctx, SUB2_LINE.letter + '-' + (1100 + c * 7), x + 30, bot - 20, '#5a6068', { font: 'small' });
    for (let i = 0; i < 2; i++) drawKanaBlock(ctx, x + SUB2_CAR_L - 70 + i * 12, bot - 22, 9, '#5a6068', i + 3);
    // the gap between cars, where the concertina is
    if (c > 0) {
      rect(ctx, x - 14, top, 20, bot - top, '#181c24');
      for (let i = 0; i < 10; i++) rect(ctx, x - 12, top + 8 + i * 18, 16, 6, '#2a2f38');
    }
    // the bogies, mostly hidden by the platform but not entirely
    for (const bo of [0.2, 0.8]) {
      rect(ctx, x + SUB2_CAR_L * bo - 40, bot - 8, 80, 14, '#1f242c');
      circle(ctx, x + SUB2_CAR_L * bo - 22, bot + 1, 8, '#31363e');
      circle(ctx, x + SUB2_CAR_L * bo + 22, bot + 1, 8, '#31363e');
    }
  }
  // the nose, on the leading car, pointing at the far tunnel
  const nx = trainX;
  rect(ctx, nx - 26, top + 10, 34, bot - top - 10, SUB2_PAL.car);
  rect(ctx, nx - 26, top + 10, 34, 4, SUB2_PAL.carHi);
  rect(ctx, nx - 30, top + 30, 8, bot - top - 42, darken(SUB2_PAL.car, 0.2));
  rect(ctx, nx - 24, top + 30, 30, 56, '#1b232e');
  ctx.globalAlpha = 0.3; rect(ctx, nx - 22, top + 32, 26, 20, '#bfe0ff'); ctx.globalAlpha = 1;
  ellipsePx(ctx, nx - 10, top + 62, 6, 8, '#3a3550');      // the driver, alone in there
  rect(ctx, nx - 28, bot - 34, 10, 8, '#fff6d8');
  rect(ctx, nx - 28, top + 96, 10, 8, SUB2_PAL.red);
  ctx.globalAlpha = 0.16;
  ellipsePx(ctx, nx - 60, bot - 30, 60, 24, '#ffe9a8');
  ctx.globalAlpha = 1;
  // the destination board, which says one word you know and three you do not
  rect(ctx, nx + 14, top + 22, 92, 22, '#0a0b10');
  drawText(ctx, SUB2_LINE.letter, nx + 18, top + 26, SUB2_PAL.greenHi, { scale: 2 });
  for (let i = 0; i < 3; i++) drawKanaBlock(ctx, nx + 36 + i * 14, top + 26, 12, SUB2_PAL.amber, i + 1);
  drawText(ctx, 'LOOP', nx + 100, top + 30, SUB2_PAL.amber, { align: 'right', font: 'small' });
  // the doors
  const dl = sub2TrainDoors(trainX);
  for (let i = 0; i < dl.length; i++) {
    if (!S.cam.visible(dl[i], 140)) continue;
    sub2Doors(ctx, dl[i], top + 24, bot, open, t, true);
  }
  // moving: streaks along the flank, and the whole thing smeared a little
  if (moving > 0.02) {
    ctx.globalAlpha = 0.18 * clamp(moving, 0, 1);
    for (let i = 0; i < 26; i++) {
      const sy = top + 14 + (i * 37) % (bot - top - 20);
      rect(ctx, trainX - 140, sy, SUB2_TRAIN_L + 200, 2, '#ffffff');
    }
    ctx.globalAlpha = 1;
  }
}

// ---------- people who are not you ----------
// A bug drawn from a plain record, used for the rows the engine does not sort
// for us: the back of the carriage and the front of it.
function sub2Pax(ctx, p, t, opts) {
  const o = opts || {};
  const y = p.y + (o.dy || 0);
  const lean = Math.round((p.lean || 0) * 2);
  drawShadow(ctx, p.x + lean, y + 2, 20 * p.sc, o.dim ? 0.14 : 0.24);
  drawBugAt(ctx, p.spec, p.x + lean, y + 2, {
    pose: p.pose || (p.moving ? (Math.floor(t * 6 + p.o) % 2 ? 'walk1' : 'walk2') : 'idle'),
    scale: p.sc, flip: p.face < 0, bounce: p.moving ? 0.8 : 0.32, phase: p.o,
    tilt: (p.lean || 0) * 0.05,
  });
  if (p.carry) drawSideCarry(ctx, p.carry, p.x + lean, y, p.face || 1, p.sc, t);
  if (o.dim) {
    ctx.globalAlpha = o.dim;
    rect(ctx, p.x + lean - 19 * p.sc, y - 50 * p.sc, 38 * p.sc, 52 * p.sc, '#0a0814');
    ctx.globalAlpha = 1;
  }
}
// The one dog on the platform, sitting, entirely unbothered, on a lead that
// its owner is holding much too tightly.
function sub2Shiba(ctx, x, y, t, face) {
  const f = face || 1;
  const breathe = Math.sin(t * 2.2) * 1;
  line(ctx, x - f * 26, y - 34, x - f * 7, y - 16, '#c8402c');
  // haunches down, chest up: a shiba waiting is a triangle
  ellipsePx(ctx, x, y - 8 + breathe * 0.3, 11, 8, '#e0b070');
  ellipsePx(ctx, x + f * 7, y - 15 + breathe * 0.3, 8, 9, '#e8bc80');
  ellipsePx(ctx, x + f * 10, y - 22, 7, 6, '#f0cf9c');
  rect(ctx, x + f * 14, y - 22, 4, 3, '#2a2028');
  px(ctx, x + f * 12, y - 24, SUB2_PAL.ink);
  px(ctx, x + f * 8, y - 24, SUB2_PAL.ink);
  // ears, which are the whole point of the animal
  rect(ctx, x + f * 6, y - 30, 4, 6, '#e0b070');
  rect(ctx, x + f * 12, y - 30, 4, 6, '#e0b070');
  rect(ctx, x + f * 7, y - 28, 2, 3, '#f4e0c0');
  rect(ctx, x + f * 13, y - 28, 2, 3, '#f4e0c0');
  // the white front, the paws, the curl of the tail
  ellipsePx(ctx, x + f * 6, y - 10, 5, 6, '#f6ecd8');
  rect(ctx, x + f * 8, y - 3, 4, 3, '#f6ecd8');
  rect(ctx, x + f * 2, y - 3, 4, 3, '#f6ecd8');
  const wag = Math.sin(t * 5) * 2;
  ellipsePx(ctx, x - f * 10, y - 18 + wag, 6, 5, '#f0d8b0');
  ellipsePx(ctx, x - f * 10, y - 18 + wag, 4, 3, '#e0b070');
}
// White gloves and a whistle, on whoever is running the platform. The gloves
// are the job. Everything else about him is a uniform.
function sub2StaffKit(ctx, x, y, t, face, point) {
  const f = face || 1;
  const up = point ? -14 : 0;
  rect(ctx, x + f * 13, y - 34 + up, 7, 6, '#ffffff');
  rect(ctx, x + f * 13, y - 34 + up, 7, 2, '#dfe4ea');
  rect(ctx, x - f * 15, y - 30, 7, 6, '#ffffff');
  // the cap, which sits flat because he irons it
  rect(ctx, x - 11, y - 62, 22, 6, '#1f2a3a');
  rect(ctx, x + f * 6, y - 58, 9, 3, '#2a3548');
  rect(ctx, x - 11, y - 62, 22, 2, '#3a4a60');
  // the whistle on a lanyard, and the breath of it when he uses it
  line(ctx, x - 5, y - 52, x + 3, y - 40, '#c8402c');
  rect(ctx, x + 2, y - 41, 7, 4, SUB2_PAL.steelHi);
  if (point) {
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 22);
    circle(ctx, x + f * 20, y - 44, 4, '#ffffff');
    ctx.globalAlpha = 1;
  }
}

// ==========================================================================
//  ONE - THE PLATFORM
// ==========================================================================
const SUB2_P_W = 2600;
const SUB2_P_FLOOR = 452;          // where your feet are
const SUB2_P_RAIL = 404;           // platform edge, which is also the train floor
const SUB2_P_EDGE = 404;
const SUB2_P_HERE = 0;             // the stop the platform belongs to

function sub2PlatformDef(o) {
  const back = sub2Home(o);
  const pHere = SUB2_STOPS[SUB2_P_HERE];
  const pPrev = SUB2_STOPS[(SUB2_P_HERE + SUB2_STOPS.length - 1) % SUB2_STOPS.length];
  const pNext = SUB2_STOPS[(SUB2_P_HERE + 1) % SUB2_STOPS.length];
  return {
    name: 'KOMAGOME STATION', sub: 'GREEN LOOP - PLATFORM 2', tint: '#16603a',
    w: SUB2_P_W, zoom: 1, yBias: 0.78, heroScale: 1.6, speed: 116,
    canLeave: false, freeFloors: false,
    start: { x: 250, floor: 0 },
    floors: [{ y: SUB2_P_FLOOR, z: 1 }],
    enterLine: 'DOWN HERE IT IS ALWAYS THE SAME TEMPERATURE.',
    sky: function (ctx) { rect(ctx, 0, 0, W, H, SUB2_PAL.deep); },

    props: [
      { kind: 'sub2exit', x: 150, w: 150, h: 190, label: 'EXIT', act: 'exit', to: back, trans: 'slideR', reach: 70 },
      // a bench sorts by its y, and so does the man asleep on it. Give the
      // bench a y a little above the floor so he lands in front of it instead
      // of behind the backrest, and tell the painter where the legs really go.
      { kind: 'sub2bench', x: 620, w: 170, h: 60, y: SUB2_P_FLOOR - 30, base: SUB2_P_FLOOR, label: 'SIT DOWN', reach: 70 },
      { kind: 'sub2bench', x: 1780, w: 170, h: 60, y: SUB2_P_FLOOR - 30, base: SUB2_P_FLOOR, label: 'SIT DOWN', reach: 70 },
      { kind: 'sub2kiosk', x: 980, w: 190, h: 176, label: 'THE KIOSK', reach: 80, solid: false },
      { kind: 'vending', x: 1230, w: 62, h: 118, label: 'A COLD DRINK', reach: 44 },
      { kind: 'vending', x: 1300, w: 62, h: 118, label: 'A HOT DRINK', reach: 44, hot: true },
      { kind: 'sub2mirror', x: 2320, w: 46, h: 160, label: 'THE MIRROR', reach: 44 },
      // the map stands on the platform on its own two legs. Hung on the far
      // wall it would spend half its life behind a train, and the other half
      // being read by nobody.
      { kind: 'sub2map', x: 1520, w: 140, h: 128, label: 'THE MAP', reach: 70 },
      { kind: 'bin', x: 1420, w: 34, h: 52 },
      { kind: 'bin', x: 2060, w: 34, h: 52 },
      { kind: 'payphone', x: 2140, w: 34, h: 70 },
      // bolted to the pillars, which are painted with the station itself so
      // that nothing bolted to them ever gets drawn behind them
      { kind: 'fireext', x: 448, w: 18, h: 40, y: 330 },
      { kind: 'poster', x: 2242, w: 42, h: 90, y: 330 },
      { kind: 'sub2name', x: 700, y: 210, w: 250, h: 76, over: true },
      { kind: 'sub2name', x: 2000, y: 210, w: 250, h: 76, over: true },
      { kind: 'sub2led', x: 1200, y: 150, w: 420, h: 40, over: true },
      { kind: 'sub2ad', x: 320, y: 120, w: 132, h: 66, over: true, seed: 11 },
      { kind: 'sub2ad', x: 860, y: 120, w: 132, h: 66, over: true, seed: 23 },
      { kind: 'sub2ad', x: 1480, y: 120, w: 132, h: 66, over: true, seed: 47 },
      { kind: 'sub2ad', x: 2120, y: 120, w: 132, h: 66, over: true, seed: 61 },
      { kind: 'sub2hang', x: 1080, y: 168, w: 170, h: 36, over: true },
      { kind: 'sub2hang', x: 2400, y: 168, w: 170, h: 36, over: true },
    ],

    npcs: [
      {
        name: 'STATION STAFF', x: 1120, floor: 0, voice: 'guard', scale: 1.5, speed: 20, walk: [1060, 1340],
        extra: 'staff', carry: null,
        tag: function (S) {
          const P = S.SUB;
          if (P.phase === 'open' || P.phase === 'hold') return ['DOORS ARE OPEN. STAND CLEAR.', 'MIND THE GAP AT THE FRONT.', 'IT IS WIDER THAN IT LOOKS.'];
          if (P.phase === 'wind' || P.phase === 'in') return ['BEHIND THE YELLOW LINE PLEASE.', 'THANK YOU. BEHIND IT.'];
          return ['NEXT ONE IS TWO MINUTES.', 'IT IS ALWAYS TWO MINUTES.', 'THAT IS HOW WE KEEP IT TRUE.'];
        },
      },
      {
        name: 'A MAN AND A SHIBA', x: 1600, floor: 0, voice: 'oldman', scale: 1.48, extra: 'shiba',
        tag: ['SHE LIKES THE WIND BIT.', 'SHE DOES NOT LIKE THE TRAIN BIT.', 'WE COMPROMISE. WE GET THE NEXT ONE.'],
      },
      {
        name: 'QUEUE ONE', x: 1364, floor: 0, voice: 'clerk', scale: 1.44, carry: 'bag',
        tag: ['I HAVE STOOD ON THIS MARK EVERY DAY FOR SIX YEARS.', 'THE DOOR HAS NEVER ONCE MISSED IT.'],
      },
      {
        name: 'STUDENT', x: 1940, floor: 0, voice: 'kid', scale: 1.4, carry: 'phone',
        tag: ['IS THAT A CASE.', 'WHAT IS IN THE CASE.', 'OH. NICE. OK. BYE.'],
      },
      {
        name: 'SOMEBODY LEAVING', x: 830, floor: 0, voice: 'driver', scale: 1.46, carry: 'case',
        tag: ['GOING UP?', 'DO NOT. IT IS RAINING AND IT IS NOT STOPPING.'],
      },
      {
        name: 'THE SLEEPER', x: 660, floor: 0, voice: 'oldman', scale: 1.42, pose: 'sad', y: SUB2_P_FLOOR - 24,
        tag: ['...', 'THIS IS NOT MY STOP.', 'IT HAS NOT BEEN MY STOP FOR SOME TIME.'],
      },
    ],

    // ---------- setup ----------
    init: function (S) {
      S.SUB = {
        phase: 'wait', timer: 7.5, trainX: SUB2_P_W + 400, door: 0, moving: 0,
        wind: 0, rumble: 0, glow: 0, boarded: false, held: 0, missed: 0,
        alight: [], onto: [], dest: o.dest || 'UENO', announced: false, whistle: 0,
      };
      S.crowd = makeSideCrowd(14, 4242, { x0: 300, x1: SUB2_P_W - 300, floors: 1, min: 1.0, max: 1.3 });
      // six door props, parked off-world until a train turns up to own them
      for (let i = 0; i < SUB2_CARS * SUB2_DOOR_OFF.length; i++) {
        S.props.push({ kind: 'sub2door', x: -900, w: 96, h: 1, y: SUB2_P_EDGE, floor: 0, hidden: true, label: 'BOARD', reach: 52, idx: i });
      }
      S.flash('THE BOARD SAYS TWO MINUTES. IT ALWAYS SAYS TWO MINUTES.', 4);
    },

    // ---------- the wait, the wind, the train ----------
    tick: function (S, dt) {
      const P = S.SUB;
      P.timer -= dt;
      const doors = sub2TrainDoors(P.trainX);

      if (P.phase === 'wait') {
        P.wind = Math.max(0, P.wind - dt * 0.8);
        P.glow = Math.max(0, P.glow - dt);
        if (P.timer <= 0) { P.phase = 'wind'; P.timer = 2.8; P.announced = false; }
      } else if (P.phase === 'wind') {
        // the air arrives first. it moves the ad panels, then the litter,
        // then the hair of everybody who is not from here.
        P.wind = Math.min(1, P.wind + dt * 0.6);
        P.glow = clamp(1 - P.timer / 2.8, 0, 1);
        P.rumble = P.glow * 0.7;
        // The particle layer is drawn after the camera has been popped, so it
        // lives in screen space. Blow the litter in from the right-hand edge
        // of the frame rather than from a spot in the world nobody is at.
        if (Math.random() < dt * 22 * P.wind) {
          S.fx.add({
            x: W + 12, y: H - 70 - Math.random() * 150,
            vx: -260 - Math.random() * 200, vy: -20 + Math.random() * 30,
            life: 1.6, color: Math.random() < 0.3 ? '#cfc9b6' : '#8a8f98',
            size: 1 + (Math.random() < 0.2 ? 1 : 0), gravity: 6, kind: 'px', drag: 0.995,
          });
        }
        if (!P.announced && P.timer < 1.9) {
          P.announced = true;
          Voice.chime('station');
          Voice.say('THE NEXT TRAIN IS THE GREEN LOOP. PLEASE STAND BEHIND THE YELLOW LINE.', 'tannoy');
          S.flash('STAND BEHIND THE YELLOW LINE.', 3);
          P.whistle = 1.2;
        }
        if (P.timer <= 0) { P.phase = 'in'; P.timer = 3.4; Game.shake.hit(2, 0.5); }
      } else if (P.phase === 'in') {
        const k = clamp(1 - P.timer / 3.4, 0, 1);
        P.trainX = lerp(SUB2_P_W + 420, 120, easeOut(k));
        P.moving = 1 - easeOut(k);
        P.rumble = 0.4 + 0.6 * (1 - k);
        P.wind = Math.max(0.2, 1 - k * 0.8);
        if (k > 0.86 && P.moving > 0.02) Game.shake.hit(1, 0.12);
        if (P.timer <= 0) {
          P.phase = 'open'; P.timer = 1.2; P.moving = 0; P.trainX = 120;
          Audio.ui('pop');
        }
      } else if (P.phase === 'open') {
        P.door = clamp(1 - P.timer / 1.2, 0, 1);
        P.wind = Math.max(0, P.wind - dt * 1.4);
        P.rumble = Math.max(0.08, P.rumble - dt);
        if (P.timer <= 0) {
          P.phase = 'hold'; P.timer = 16; P.door = 1; P.held = 0;
          Voice.chime('station');
          S.flash('DOORS OPEN. EVERYBODY GETS OFF FIRST. THAT IS THE RULE.', 3.4);
          // people come out: they head for the stairs and do not look back
          const r = makeRng(hashStr('alight' + Math.round(S.t * 10)));
          for (let i = 0; i < 9; i++) {
            const d = doors[r.int(0, doors.length - 1)];
            P.alight.push({
              x: d + r.range(-20, 20), y: SUB2_P_FLOOR, tx: 90, face: -1, moving: true,
              spec: randomBugSpec(makeRng(hashStr('al' + i + Math.round(S.t)))),
              sc: r.range(1.24, 1.5), o: r.range(0, 6.3), wait: r.range(0, 1.1),
              carry: r.chance(0.5) ? r.pick(['bag', 'case', 'coffee', 'phone', 'umbrella']) : null,
            });
          }
        }
      } else if (P.phase === 'hold') {
        P.held += dt;
        P.door = 1;
        // and after a moment the people who were waiting get on
        if (P.held > 3.4 && P.onto.length === 0) {
          const r = makeRng(hashStr('onto' + Math.round(S.t)));
          for (let i = 0; i < 6; i++) {
            const d = doors[r.int(0, doors.length - 1)];
            P.onto.push({
              x: d + r.range(-160, 160), y: SUB2_P_FLOOR, tx: d, face: 1, moving: true,
              spec: randomBugSpec(makeRng(hashStr('on' + i + Math.round(S.t)))),
              sc: r.range(1.22, 1.48), o: r.range(0, 6.3), wait: r.range(0, 1.6),
              carry: r.chance(0.4) ? r.pick(['bag', 'case', 'suitcase']) : null,
            });
          }
        }
        if (P.timer < 5 && !P.warned) { P.warned = true; Audio.ui('error'); S.flash('DOORS CLOSING.', 2.2); P.whistle = 1.4; }
        if (P.timer <= 0) { P.phase = 'close'; P.timer = 1.5; P.warned = false; }
      } else if (P.phase === 'close') {
        P.door = clamp(P.timer / 1.5, 0, 1);
        if (P.timer <= 0) {
          P.phase = 'out'; P.timer = 3.2; P.door = 0; P.missed++;
          if (P.missed === 1) S.flash('IT GOES WITHOUT YOU. THERE IS ANOTHER ONE.', 3.4);
          else S.flash('THAT IS TWICE NOW.', 3);
        }
      } else if (P.phase === 'out') {
        const k = clamp(1 - P.timer / 3.2, 0, 1);
        P.trainX = lerp(120, -SUB2_TRAIN_L - 400, easeIn(k));
        P.moving = easeIn(k);
        P.wind = Math.min(0.8, k);
        P.rumble = 0.5 * (1 - k);
        if (P.timer <= 0) {
          P.phase = 'wait'; P.timer = 12; P.moving = 0; P.wind = 0;
          P.trainX = SUB2_P_W + 420; P.alight.length = 0; P.onto.length = 0;
        }
      }

      // the doors, as things you can actually walk up to and use
      const open = P.door > 0.66 && (P.phase === 'open' || P.phase === 'hold');
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'sub2door') continue;
        p.hidden = true;
        p.x = doors[p.idx] != null ? doors[p.idx] : -900;
        p.label = open ? 'BOARD' : null;
        p.act = null;
      }

      // everybody coming off and getting on, walking their own errand
      const walk = function (list, sp, arrive) {
        for (let i = list.length - 1; i >= 0; i--) {
          const m = list[i];
          if (m.wait > 0) { m.wait -= dt; m.moving = false; continue; }
          const d = m.tx - m.x;
          m.face = d < 0 ? -1 : 1;
          m.moving = Math.abs(d) > 4;
          m.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt);
          if (Math.abs(d) <= 4) { if (arrive) arrive(m); list.splice(i, 1); }
        }
      };
      walk(P.alight, 92, null);
      walk(P.onto, 84, null);
      if (P.whistle > 0) P.whistle -= dt;

      // the ambient shove of a station: a hum, and the lights fighting it
      if (P.rumble > 0.3 && Math.random() < dt * 4) Game.shake.hit(1, 0.1);
    },

    // ---------- what the place is made of ----------
    mid: function (ctx, S, t) {
      const P = S.SUB;
      const x0 = Math.max(-80, S.cam.wx(0) - 120), x1 = Math.min(SUB2_P_W + 80, S.cam.wx(W) + 120);
      // ceiling: a slab, ducts, and the strip lights that make everybody look ill
      rect(ctx, -100, -60, SUB2_P_W + 200, 170, SUB2_PAL.wallLo);
      rect(ctx, -100, 104, SUB2_P_W + 200, 6, SUB2_PAL.wall);
      for (let x = Math.floor(x0 / 240) * 240; x < x1; x += 240) {
        rect(ctx, x, 44, 190, 20, '#4a5058');
        rect(ctx, x, 44, 190, 3, '#6a7079');
        for (let i = 0; i < 4; i++) rect(ctx, x + 12 + i * 46, 64, 6, 10, '#2f353d');
      }
      for (let x = Math.floor(x0 / 170) * 170; x < x1; x += 170) {
        rect(ctx, x + 20, 92, 126, 12, '#2a2f38');
        ctx.globalAlpha = 0.85 + 0.12 * Math.sin(t * 40 + x);
        rect(ctx, x + 23, 94, 120, 8, SUB2_PAL.lamp);
        ctx.globalAlpha = 0.07;
        ellipsePx(ctx, x + 83, 300, 150, 230, SUB2_PAL.lamp);
        ctx.globalAlpha = 1;
      }
      // the back wall, tiled, from the ceiling down to the track
      sub2TileWall(ctx, -100, SUB2_P_W + 100, 110, SUB2_P_EDGE - 4, 991);
      // the two holes
      sub2Tunnel(ctx, 40, SUB2_P_EDGE, 210, 250, t, 0);
      sub2Tunnel(ctx, SUB2_P_W - 40, SUB2_P_EDGE, 210, 250, t, P.glow);
      // the trench: ballast, rails, and the rubbish that lives down there
      rect(ctx, -100, SUB2_P_EDGE - 6, SUB2_P_W + 200, 50, '#1a1d24');
      rect(ctx, -100, SUB2_P_EDGE - 6, SUB2_P_W + 200, 3, '#2a2f38');
      for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) rect(ctx, x, SUB2_P_EDGE + 2, 22, 4, '#3a3028');
      rect(ctx, -100, SUB2_P_EDGE + 8, SUB2_P_W + 200, 3, '#6a7079');
      rect(ctx, -100, SUB2_P_EDGE + 20, SUB2_P_W + 200, 3, '#5f646c');
      // the train, in front of the wall and behind the platform
      if (P.trainX < SUB2_P_W + 420 && P.trainX > -SUB2_TRAIN_L - 420) {
        sub2Train(ctx, S, t, P.trainX, P.door, P.moving);
      }
      // the platform itself: the edge, the tactile strip, the marks, the floor
      rect(ctx, -100, SUB2_P_EDGE, SUB2_P_W + 200, 4, SUB2_PAL.cream);
      rect(ctx, -100, SUB2_P_EDGE + 4, SUB2_P_W + 200, 3, '#9aa0a8');
      sub2Tactile(ctx, -100, SUB2_P_W + 100, SUB2_P_EDGE + 7);
      rect(ctx, -100, SUB2_P_EDGE + 20, SUB2_P_W + 200, SUB2_P_FLOOR - SUB2_P_EDGE - 20, SUB2_PAL.floorLo);
      sideFloor(ctx, -100, SUB2_P_W + 100, SUB2_P_FLOOR, {
        h: 120, col: SUB2_PAL.floor, col2: SUB2_PAL.floorLo, tile: 52, lip: SUB2_PAL.floorHi, grout: true,
      });
      sub2QueueMarks(ctx, sub2TrainDoors(120), SUB2_P_EDGE + 26, t, P.door);
      // the light out of an open door, landing on the deck. It has to be
      // painted after the deck or the deck paints over it, which is how you
      // end up with a lit train and a platform nobody can find a door on.
      if (P.door > 0.1 && P.trainX > -SUB2_TRAIN_L && P.trainX < SUB2_P_W) {
        const dl = sub2TrainDoors(P.trainX);
        for (let i = 0; i < dl.length; i++) {
          if (!S.cam.visible(dl[i], 160)) continue;
          ctx.globalAlpha = 0.17 * P.door;
          ctx.fillStyle = SUB2_PAL.lamp;
          ctx.beginPath();
          ctx.moveTo(dl[i] - 48, SUB2_P_EDGE + 6); ctx.lineTo(dl[i] + 48, SUB2_P_EDGE + 6);
          ctx.lineTo(dl[i] + 96, SUB2_P_FLOOR + 8); ctx.lineTo(dl[i] - 96, SUB2_P_FLOOR + 8);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      // the columns, painted with the station and not hung off it
      sub2Pillar(ctx, 460, 106, SUB2_P_FLOOR);
      sub2Pillar(ctx, 1660, 106, SUB2_P_FLOOR);
      sub2Pillar(ctx, 2240, 106, SUB2_P_FLOOR);
      // the crowd waiting, behind everything, dimmed by the distance
      drawSideCrowd(ctx, S, S.crowd, t, { x0: 300, x1: SUB2_P_W - 300, y: SUB2_P_FLOOR - 14, dim: 0.5 });
      // the people coming off the train and the people getting on
      for (let i = 0; i < P.alight.length; i++) sub2Pax(ctx, P.alight[i], t, {});
      for (let i = 0; i < P.onto.length; i++) sub2Pax(ctx, P.onto[i], t, {});
    },

    // ---------- the near edge of the world ----------
    fore: function (ctx, S, t) {
      const P = S.SUB;
      // the bits of kit that belong to particular people
      for (let i = 0; i < S.npcs.length; i++) {
        const n = S.npcs[i];
        if (!n.extra || n.hidden) continue;
        const y = n.y != null ? n.y : S.floorY(n.floor);
        if (n.extra === 'staff') sub2StaffKit(ctx, n._x, y, t, n.face || 1, P.whistle > 0);
        else if (n.extra === 'shiba') sub2Shiba(ctx, n._x - 30, y, t, -1);
      }
      // a steel column in the very front, out of focus, holding the roof up
      ctx.globalAlpha = 0.92;
      const cx = Math.round(S.cam.wx(W - 70));
      rect(ctx, cx, -60, 30, 700, '#1a1f28');
      rect(ctx, cx, -60, 5, 700, '#2c333e');
      rect(ctx, cx + 25, -60, 5, 700, '#11151b');
      ctx.globalAlpha = 1;
    },

    // ---------- the grade ----------
    after: function (ctx, S, t) {
      const P = S.SUB;
      grade(ctx, 0, 0, W, H, '#1a2a2a', 0.1);
      vignette(ctx, 0.42, '#05070b');
      // the whole frame breathes with the rumble, very slightly
      if (P.rumble > 0.1) {
        ctx.globalAlpha = 0.05 * P.rumble;
        rect(ctx, 0, 0, W, H, '#ffffff');
        ctx.globalAlpha = 1;
      }
    },

    // ---------- the panel that tells you what is happening ----------
    overlay: function (ctx, S, t) {
      const P = S.SUB;
      const x = 14, y = 40, w = 236, h = 50;
      rect(ctx, x, y, w, h, 'rgba(8,10,16,0.82)');
      frame(ctx, x, y, w, h, SUB2_PAL.greenLo);
      rect(ctx, x, y, w, 2, SUB2_LINE.col);
      circle(ctx, x + 22, y + 24, 13, SUB2_LINE.col);
      circle(ctx, x + 22, y + 24, 10, '#0a0b10');
      drawText(ctx, SUB2_LINE.letter, x + 22, y + 18, SUB2_PAL.greenHi, { align: 'center', scale: 2 });
      const line1 = P.phase === 'wait' ? 'NEXT TRAIN  ' + Math.max(0, Math.ceil(P.timer)) + 'S'
        : P.phase === 'wind' ? 'APPROACHING'
          : P.phase === 'in' ? 'ARRIVING'
            : (P.phase === 'open' || P.phase === 'hold') ? 'DOORS OPEN  ' + Math.max(0, Math.ceil(P.timer)) + 'S'
              : P.phase === 'close' ? 'DOORS CLOSING' : 'DEPARTING';
      drawText(ctx, line1, x + 42, y + 10, P.phase === 'hold' && P.timer < 6 ? SUB2_PAL.red : SUB2_PAL.amber, { scale: 2 });
      drawText(ctx, 'FOR ' + P.dest, x + 42, y + 30, SUB2_PAL.cream, { font: 'small' });
      if (P.phase === 'hold' || P.phase === 'open') {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5);
        drawText(ctx, 'STAND AT A DOOR AND BOARD', W / 2, H - 138, SUB2_PAL.greenHi, { align: 'center', scale: 2, outline: '#08140c' });
        ctx.globalAlpha = 1;
      }
    },

    // ---------- the scene's own props ----------
    prop: function (ctx, p, t, S) {
      const P = S.SUB;
      const base = S.propY(p);
      switch (p.kind) {
        case 'sub2exit': {
          // stairs going up, and the one word in the station you can read
          const x = p.x - p.w / 2;
          rect(ctx, x - 6, base - p.h - 10, p.w + 12, p.h + 10, '#20252e');
          rect(ctx, x, base - p.h, p.w, p.h, SUB2_PAL.black);
          for (let i = 0; i < 9; i++) {
            const k = i / 9;
            rect(ctx, x + 6, base - 14 - i * 16, p.w - 12 - i * 8, 7, lerp(0.2, 1, k) > 0.6 ? '#4a5058' : '#3a4048');
            rect(ctx, x + 6, base - 14 - i * 16, p.w - 12 - i * 8, 2, '#6a7079');
          }
          ctx.globalAlpha = 0.16;
          ellipsePx(ctx, p.x, base - p.h + 30, p.w * 0.5, 60, '#cfe4ff');
          ctx.globalAlpha = 1;
          rect(ctx, x - 10, base - p.h - 44, p.w + 20, 32, '#0d3a24');
          frame(ctx, x - 10, base - p.h - 44, p.w + 20, 32, SUB2_PAL.greenHi);
          drawText(ctx, 'EXIT', p.x - 22, base - p.h - 36, SUB2_PAL.greenHi, { align: 'center', scale: 3 });
          for (let i = 0; i < 2; i++) drawKanaBlock(ctx, p.x + 26 + i * 16, base - p.h - 36, 14, SUB2_PAL.cream, i + 4);
          ctx.fillStyle = SUB2_PAL.greenHi;
          ctx.beginPath();
          ctx.moveTo(p.x + p.w / 2 + 2, base - p.h - 28); ctx.lineTo(p.x + p.w / 2 - 6, base - p.h - 36); ctx.lineTo(p.x + p.w / 2 - 6, base - p.h - 20);
          ctx.fill();
          return true;
        }
        case 'sub2bench': sub2Bench(ctx, p.x - p.w / 2, p.base != null ? p.base : base, p.w, t); return true;
        case 'sub2kiosk': sub2Kiosk(ctx, p.x - p.w / 2, base, p.w, p.h, t); return true;
        case 'sub2mirror': sub2Mirror(ctx, p.x, base, t, S); return true;
        case 'sub2name': {
          sub2NameBoard(ctx, p.x - p.w / 2, p.y, p.w, p.h, pHere, pPrev, pNext);
          // hung off the ceiling on two thin rods
          rect(ctx, p.x - p.w / 2 + 20, p.y - 100, 3, 100, SUB2_PAL.steelLo);
          rect(ctx, p.x + p.w / 2 - 23, p.y - 100, 3, 100, SUB2_PAL.steelLo);
          return true;
        }
        case 'sub2led': {
          const txt = P.phase === 'wait' ? '1  ' + SUB2_LINE.letter + ' LOOP   FOR ' + P.dest + '   ' + Math.max(0, Math.ceil(P.timer)) + ' MIN      2  LOCAL   6 MIN'
            : P.phase === 'wind' || P.phase === 'in' ? '1  ' + SUB2_LINE.letter + ' LOOP   ARRIVING NOW   DO NOT RUN'
              : P.phase === 'close' || P.phase === 'out' ? '1  ' + SUB2_LINE.letter + ' LOOP   DEPARTED      2  LOCAL   4 MIN'
                : '1  ' + SUB2_LINE.letter + ' LOOP   BOARDING   ' + Math.max(0, Math.ceil(P.timer)) + ' S';
          rect(ctx, p.x - p.w / 2 - 6, p.y - 48, p.w + 12, 48, 'rgba(0,0,0,0)');
          rect(ctx, p.x - p.w / 2 + 14, p.y - 40, 3, 40, SUB2_PAL.steelLo);
          rect(ctx, p.x + p.w / 2 - 17, p.y - 40, 3, 40, SUB2_PAL.steelLo);
          sub2Led(ctx, p.x - p.w / 2, p.y, p.w, p.h, t, txt, P.phase === 'hold' ? SUB2_PAL.greenHi : SUB2_PAL.amber, true);
          return true;
        }
        case 'sub2ad': sub2AdPanel(ctx, p.x - p.w / 2, p.y, p.w, p.h, t, p.seed, P.wind * Math.sin(t * 6 + p.seed)); return true;
        case 'sub2hang': {
          // a direction sign: an arrow, a number, and three glyphs
          const x = p.x - p.w / 2;
          rect(ctx, x + 16, p.y - 30, 3, 30, SUB2_PAL.steelLo);
          rect(ctx, x + p.w - 19, p.y - 30, 3, 30, SUB2_PAL.steelLo);
          rect(ctx, x, p.y, p.w, p.h, '#12331f');
          frame(ctx, x, p.y, p.w, p.h, '#0a2214');
          rect(ctx, x, p.y, p.w, 2, '#2f6a45');
          drawText(ctx, '2', x + 10, p.y + 10, SUB2_PAL.cream, { scale: 2 });
          for (let i = 0; i < 3; i++) drawKanaBlock(ctx, x + 30 + i * 15, p.y + 10, 13, SUB2_PAL.cream, i + 1);
          ctx.fillStyle = SUB2_PAL.cream;
          ctx.beginPath();
          ctx.moveTo(x + p.w - 10, p.y + p.h / 2); ctx.lineTo(x + p.w - 24, p.y + 8); ctx.lineTo(x + p.w - 24, p.y + p.h - 8);
          ctx.fill();
          return true;
        }
        case 'sub2map': {
          // A board on two legs: the line as a green worm with five beads on
          // it, a lit backing that has been on since the station opened, and
          // the print rubbed pale where everybody points at their own stop.
          const x = p.x - p.w / 2, top = base - p.h, bh = p.h - 26;
          ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base + 1, p.w * 0.4, 6, '#000'); ctx.globalAlpha = 1;
          rect(ctx, x + 14, top + bh, 8, p.h - bh, '#4a4e56');
          rect(ctx, x + p.w - 22, top + bh, 8, p.h - bh, '#4a4e56');
          rect(ctx, x + 14, top + bh, 3, p.h - bh, '#6a6e77');
          rect(ctx, x + 8, base - 4, 20, 4, '#3a3e46');
          rect(ctx, x + p.w - 28, base - 4, 20, 4, '#3a3e46');
          rect(ctx, x - 4, top - 4, p.w + 8, bh + 8, '#2a2f38');
          rect(ctx, x - 4, top - 4, p.w + 8, 3, '#4a505a');
          rect(ctx, x, top, p.w, bh, SUB2_PAL.cream);
          rect(ctx, x, top, p.w, 3, '#ffffff');
          rect(ctx, x, top + bh - 4, p.w, 4, SUB2_LINE.col);
          drawText(ctx, SUB2_LINE.letter + ' LOOP', x + 6, top + 7, SUB2_PAL.ink, { font: 'small' });
          for (let i = 0; i < 4; i++) drawKanaBlock(ctx, x + 10 + i * 12, top + 20, 10, '#7a7a72', i);
          const my = top + Math.round(bh * 0.54);
          rect(ctx, x + 12, my, p.w - 24, 5, SUB2_LINE.col);
          rect(ctx, x + 12, my, p.w - 24, 1, SUB2_PAL.greenHi);
          for (let i = 0; i < SUB2_STOPS.length; i++) {
            const sx = x + 16 + i * ((p.w - 32) / (SUB2_STOPS.length - 1));
            const mine = SUB2_STOPS[i].name === P.dest;
            const you = i === SUB2_P_HERE;
            circle(ctx, sx, my + 2, mine ? 6 : 4, mine ? SUB2_PAL.red : SUB2_PAL.cream);
            circle(ctx, sx, my + 2, mine ? 4 : 2, mine ? SUB2_PAL.yellowHi : SUB2_LINE.col);
            if (you) {
              ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4);
              ringPx(ctx, sx, my + 2, 8, SUB2_PAL.amber);
              ctx.globalAlpha = 1;
              drawText(ctx, 'HERE', sx, my - 16, SUB2_PAL.red, { align: 'center', font: 'small' });
            }
            drawText(ctx, SUB2_STOPS[i].code.split(' ')[1], sx, my + 12, '#5a5a52', { align: 'center', font: 'small' });
          }
          // the strip light in the hood over it, and the pool it throws down
          rect(ctx, x - 6, top - 12, p.w + 12, 9, '#3a4048');
          ctx.globalAlpha = 0.8; rect(ctx, x - 2, top - 6, p.w + 4, 3, SUB2_PAL.lamp); ctx.globalAlpha = 1;
          ctx.globalAlpha = 0.09;
          ellipsePx(ctx, p.x, top + bh * 0.6, p.w * 0.6, bh * 0.8, SUB2_PAL.lamp);
          ctx.globalAlpha = 1;
          return true;
        }
        case 'sub2door': return true;                       // painted by the train
        case 'vending': return false;
        default: return false;
      }
    },

    // ---------- what the buttons do ----------
    use: function (S, p) {
      const P = S.SUB;
      if (p.kind === 'sub2door') {
        if (!(P.phase === 'open' || P.phase === 'hold') || P.door < 0.6) { S.flash('SHUT.'); Audio.ui('error'); return; }
        if (P.boarded) return;
        P.boarded = true;
        Audio.ui('select');
        Voice.chime('station');
        S.lock(0.8);
        S.flash('YOU GET ON. SO DOES EVERYBODY ELSE.', 2);
        S.leave(function () { return new SubwaySideScene(P.dest, back); }, 'slideL', { dur: 0.7 });
        return;
      }
      if (p.kind === 'sub2bench') {
        // a thought is a property of the beat, not of the Dialogue, so this
        // goes through run() rather than say()
        const r = makeRng(hashStr('bench' + Math.round(S.t)));
        S.run([{
          who: 'YOU', voice: 'you', think: true,
          text: r.pick([
            'THE BENCH IS COLD AND IT IS MEANT TO BE.',
            'THE ARMREST IS IN THE MIDDLE ON PURPOSE.',
            'YOU CAN SEE THE WHOLE PLATFORM. IT IS NOT MUCH.',
          ]),
        }]);
        return;
      }
      if (p.kind === 'sub2kiosk') {
        const r = Game.run;
        if (r && r.money >= 3) {
          S.run([
            { who: 'KIOSK', text: 'COFFEE? PAPER? BOTH?', voice: 'clerk' },
            {
              who: 'KIOSK', text: 'THREE HUNDRED. SMALL COINS PLEASE.', voice: 'clerk',
              choices: [
                { label: 'BUY A COFFEE', note: '-$3', go: function () { r.money -= 3; Audio.ui('coin'); S.body.carry = 'coffee'; S.flash('HOT. TOO HOT. CORRECT.'); } },
                { label: 'JUST LOOKING', go: function () { S.flash('HE HAS ALREADY LOOKED AWAY.'); } },
              ],
            },
          ]);
        } else S.say('KIOSK', 'CASH ONLY. IT HAS ALWAYS BEEN CASH ONLY.', 'clerk');
        return;
      }
      if (p.kind === 'vending') {
        const r = Game.run;
        if (r && r.money >= 2) { r.money -= 2; Audio.ui('coin'); S.flash(p.hot ? 'A HOT CAN. IT IS GENUINELY HOT.  -$2' : 'IT FALLS A VERY LONG WAY.  -$2'); }
        else { Audio.ui('error'); S.flash('IT TAKES COINS AND YOU HAVE NONE.'); }
        return;
      }
      if (p.kind === 'sub2mirror') { S.say('YOU', 'THAT IS YOU. WITH A CASE. UNDER A CITY.', 'you'); return; }
      if (p.kind === 'sub2map') {
        S.run([
          { who: 'THE MAP', text: 'GREEN LOOP. FIVE STOPS. IT COMES BACK.', voice: 'tannoy' },
          { who: 'THE MAP', text: 'YOU WANT ' + P.dest + '. THAT IS THE RED BEAD.', voice: 'tannoy' },
        ]);
        return;
      }
    },
  };
}

class SubwayPlatformScene extends SideScene {
  constructor(a, b) {
    const o = sub2Opts(a, b);
    super(sub2PlatformDef(o), o);
    this.cam.snapTo(this.body.x, SUB2_P_FLOOR);
  }
  // The platform edge is a wall you are allowed to see over and not walk
  // through. The rest of the station is open.
  solid(x, floor) {
    if (x < 90 || x > SUB2_P_W - 80) return true;
    return super.solid(x, floor);
  }
}

// ==========================================================================
//  TWO - THE CARRIAGE
// ==========================================================================
// Eight hundred pixels of car, of which you occupy about forty. The whole
// design problem here is that a train is not a level. It is a queue that
// happens to be moving.
const SUB2_C_W = 1520;
const SUB2_C_CEIL = 96;
const SUB2_C_RACK = 158;
const SUB2_C_RAIL = 196;           // where the straps hang from
const SUB2_C_WINTOP = 218;
const SUB2_C_WINBOT = 300;
const SUB2_C_SEATBACK = 306;
const SUB2_C_SEAT = 378;           // the cushion
const SUB2_C_FAR = 412;
const SUB2_C_NEAR = 452;
const SUB2_C_DOORS = [390, 1120];

// the eight things people say when you tread on them
const SUB2_BUMPS = [
  'SORRY. SORRY.', 'MM.', 'IT IS THE CASE. IT IS FINE.', 'AH. SORRY.',
  'EXCUSE ME.', 'THAT IS MY FOOT.', 'NO NO. FINE.', 'HM.',
  'YOU CAN GO ROUND.', 'THERE IS NO ROUND.',
];

// A hanging strap: a loop of webbing, a bar, and a lag of about a beat.
function sub2Strap(ctx, x, yTop, len, ang) {
  const dx = Math.round(Math.sin(ang) * len * 0.42);
  const by = yTop + Math.round(Math.cos(ang) * len);
  line(ctx, x, yTop, x + dx, by, '#5a4f42');
  rect(ctx, x + dx - 1, yTop, 3, Math.max(2, by - yTop), '#6a5f4a');
  // the triangle ring and the plastic grip at the bottom of it
  rect(ctx, x + dx - 7, by, 15, 4, '#8a8f98');
  rect(ctx, x + dx - 9, by + 3, 19, 12, '#d8d2c4');
  rect(ctx, x + dx - 9, by + 3, 19, 3, '#f2ece0');
  rect(ctx, x + dx - 6, by + 7, 13, 5, '#b4ae9e');
}
// A grab pole, floor to ceiling, worn shiny where hands go.
function sub2Pole(ctx, x, y0, y1) {
  rect(ctx, x - 3, y0, 6, y1 - y0, SUB2_PAL.steelLo);
  rect(ctx, x - 3, y0, 2, y1 - y0, SUB2_PAL.steelHi);
  rect(ctx, x + 1, y0, 2, y1 - y0, '#6a7079');
  ctx.globalAlpha = 0.3;
  rect(ctx, x - 3, y0 + 120, 6, 70, '#ffffff');
  ctx.globalAlpha = 1;
  rect(ctx, x - 7, y0, 14, 5, '#5a6068');
  rect(ctx, x - 7, y1 - 5, 14, 5, '#5a6068');
}
// The rack over the seats, with everything on it that nobody will remember.
function sub2Rack(ctx, x0, x1, y, seed, tilt) {
  rect(ctx, x0, y, x1 - x0, 4, SUB2_PAL.steelLo);
  rect(ctx, x0, y, x1 - x0, 2, SUB2_PAL.steelHi);
  for (let x = x0; x < x1; x += 18) {
    ctx.globalAlpha = 0.6;
    line(ctx, x, y + 4, x + 8, y + 16, SUB2_PAL.steelLo);
    ctx.globalAlpha = 1;
  }
  const r = makeRng((seed || 5) >>> 0);
  let x = x0 + 40;
  while (x < x1 - 60) {
    if (r.chance(0.62)) {
      const w = r.int(34, 74), h = r.int(16, 26);
      const c = r.pick(['#2f4a8a', '#8a2a1c', '#3a5a3a', '#3a3550', '#8a6a2a', '#5a5a66']);
      const dy = Math.round(tilt * ((x - (x0 + x1) / 2) / 400));
      rect(ctx, x, y - h + dy, w, h, c);
      rect(ctx, x, y - h + dy, w, 3, lighten(c, 0.26));
      rect(ctx, x + w * 0.35, y - h - 4 + dy, w * 0.3, 5, darken(c, 0.3));
      if (r.chance(0.3)) rect(ctx, x + 4, y - h + 6 + dy, w - 8, 3, SUB2_PAL.cream);
      x += w + r.int(18, 60);
    } else x += r.int(50, 120);
  }
}
// The route map over the door: the same worm as the platform map, smaller,
// with a light next to the one you are going to.
function sub2RouteMap(ctx, x, y, w, h, stops, idx, dest, t) {
  rect(ctx, x, y, w, h, SUB2_PAL.cream);
  frame(ctx, x, y, w, h, '#8a8478');
  rect(ctx, x, y, w, 2, '#ffffff');
  rect(ctx, x, y + h - 3, w, 3, SUB2_LINE.col);
  const my = y + Math.round(h * 0.52);
  rect(ctx, x + 8, my, w - 16, 4, SUB2_LINE.col);
  for (let i = 0; i < stops.length; i++) {
    const sx = x + 12 + i * ((w - 24) / (stops.length - 1));
    const on = i === idx, mine = i === dest;
    circle(ctx, sx, my + 2, mine ? 6 : 4, mine ? SUB2_PAL.red : '#8a8478');
    circle(ctx, sx, my + 2, mine ? 4 : 2, mine ? SUB2_PAL.yellowHi : SUB2_PAL.cream);
    if (on) {
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5);
      ringPx(ctx, sx, my + 2, 8, SUB2_PAL.amber);
      ringPx(ctx, sx, my + 2, 7, SUB2_PAL.amber);
      ctx.globalAlpha = 1;
    }
    drawText(ctx, stops[i].code.split(' ')[1], sx, my + 10, '#5a5a52', { align: 'center', font: 'small' });
  }
  for (let i = 0; i < 3; i++) drawKanaBlock(ctx, x + 8 + i * 11, y + 5, 9, '#7a7a72', i + 2);
  drawText(ctx, SUB2_LINE.letter, x + w - 8, y + 5, SUB2_LINE.col, { align: 'right', scale: 2 });
}
// The moquette. A pattern designed in 1988 to hide everything.
function sub2Moquette(ctx, x, y, w, h, col, seed) {
  rect(ctx, x, y, w, h, col);
  rect(ctx, x, y, w, 2, lighten(col, 0.24));
  rect(ctx, x, y + h - 2, w, 2, darken(col, 0.3));
  const r = makeRng((seed || 2) >>> 0);
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < w; i += 14) {
    for (let j = 0; j < h; j += 11) {
      if ((i / 14 + j / 11) % 2 < 1) rect(ctx, x + i + 3, y + j + 3, 4, 4, lighten(col, 0.16));
      else px(ctx, x + i + 8, y + j + 6, darken(col, 0.24));
    }
  }
  ctx.globalAlpha = 1;
  r.int(0, 3);
}

function sub2CarriageDef(o) {
  const destIdx = sub2StopIndex(o.dest);
  const home = sub2Home(o);
  return {
    name: 'THE 8:40', sub: 'GREEN LOOP - FOR ' + SUB2_STOPS[destIdx].name, tint: '#16603a',
    w: SUB2_C_W, zoom: 1, yBias: 0.80, heroScale: 1.55, speed: 46,
    canLeave: false, freeFloors: false, hud: true,
    start: { x: 700, floor: 1 },
    floors: [{ y: SUB2_C_FAR, z: 0.9 }, { y: 432, z: 1 }, { y: SUB2_C_NEAR, z: 1.08 }],
    enterLine: 'THE DOORS SHUT BEHIND YOU AND THE ROOM GETS SMALLER.',
    sky: function (ctx) { rect(ctx, 0, 0, W, H, '#14161e'); },

    // ---------- the seven people you can actually talk to ----------
    npcs: [
      {
        name: 'SALARYBUG', x: 560, floor: 1, voice: 'driver', scale: 1.5, pose: 'sad', role: 'sleep',
        tag: ['...', 'MM. YES. NO.', 'I AM AWAKE. I AM STANDING UP.', 'THAT IS HOW YOU KNOW.'],
      },
      {
        name: 'STUDENT', x: 900, floor: 2, voice: 'kid', scale: 1.52, role: 'head', carry: 'phone',
        tag: ['I CAN HEAR YOU. I JUST DO NOT WANT TO.', 'IT IS NOT PERSONAL.', 'IT IS A REALLY GOOD ALBUM.'],
      },
      {
        name: 'THE READER', x: 300, floor: 0, y: SUB2_C_SEAT + 12, voice: 'oldman', scale: 1.34, role: 'read',
        tag: ['ONE HAND. YOU LEARN IT.', 'THE OTHER HAND IS FOR THE TRAIN.', 'PAGE TWO HUNDRED AND ELEVEN SINCE MARCH.'],
      },
      {
        name: 'THE BAG', x: 1020, floor: 2, voice: 'clerk', scale: 1.54, role: 'bag', carry: 'bag',
        tag: ['IT IS PEARS.', 'ALL OF IT IS PEARS.', 'THEY ARE A GIFT. DO NOT LEAN ON THEM.'],
      },
      {
        name: 'NOT LOOKING', x: 760, floor: 1, voice: 'guard', scale: 1.5, role: 'phone', carry: 'phone',
        tag: ['I AM NOT LOOKING AT IT.', 'I AM HOLDING IT. THERE IS A DIFFERENCE.'],
      },
      {
        name: 'A TOURIST', x: 1200, floor: 0, y: SUB2_C_SEAT + 12, voice: 'you', scale: 1.34, role: 'count',
        tag: ['FOUR. NO. THREE.', 'IS UENO THREE OR FOUR.', 'I HAVE RUN OUT OF THE GOOD FINGERS.'],
      },
      {
        name: 'SOMEBODY WITH A CASE', x: 1320, floor: 1, voice: 'barista', scale: 1.52, role: 'muso', carry: 'case',
        tag: function (S) {
          const M = S.SUB;
          if (!M.nodded) { M.nodded = true; return ['THAT IS A CASE.', 'SO IS THIS.', 'GOOD. GOOD. CARRY ON THEN.']; }
          return ['WHERE ARE YOU PLAYING.', 'THAT IS THE RIGHT ANSWER.', 'NOBODY EVER KNOWS.'];
        },
      },
    ],

    props: [
      { kind: 'sub2cdoor', x: SUB2_C_DOORS[0], w: 128, h: 1, y: SUB2_C_FAR, floor: 1, reach: 60, idx: 0 },
      { kind: 'sub2cdoor', x: SUB2_C_DOORS[1], w: 128, h: 1, y: SUB2_C_FAR, floor: 1, reach: 60, idx: 1 },
      // the maps sit off to one side of each door and are given a narrow
      // hitbox on purpose: a 200px prop parked over a doorway wins every
      // prompt contest it is in, and then you can never get off the train
      { kind: 'sub2cmap', x: SUB2_C_DOORS[0] + 160, y: SUB2_C_WINTOP - 58, w: 44, h: 52, floor: 1, over: true, label: 'THE ROUTE MAP', reach: 34 },
      { kind: 'sub2cmap', x: SUB2_C_DOORS[1] + 160, y: SUB2_C_WINTOP - 58, w: 44, h: 52, floor: 1, over: true, label: 'THE ROUTE MAP', reach: 34 },
    ],

    // ---------- setup ----------
    init: function (S) {
      const r = makeRng(840840);
      const M = {
        idx: 0, destIdx: destIdx, phase: 'run', timer: 11, door: 0, speed: 1,
        light: 0, tilt: 0, tiltTo: 0, tiltT: 2.4, lean: 0, shift: 0,
        strap: 0, strapV: 0, load: 0.9, mutter: null, nodded: false,
        rode: 0, missed: false, arrived: false, off: false,
        back: [], front: [], seats: [], bumpT: 0, announced: false, laps: 0,
        dest: SUB2_STOPS[destIdx].name,
      };
      S.SUB = M;
      // the three depths. back row against the seats, front row between you
      // and the camera, and everybody named in the middle with you.
      const mk = function (n, y, sc0, sc1, x0, x1, tag) {
        const out = [];
        for (let i = 0; i < n; i++) {
          out.push({
            x: r.range(x0, x1), y: y, sc: r.range(sc0, sc1), o: r.range(0, 6.3),
            spec: randomBugSpec(makeRng(hashStr(tag + i))), face: r.chance(0.6) ? 1 : -1,
            carry: r.chance(0.45) ? r.pick(['bag', 'case', 'phone', 'umbrella', 'coffee']) : null,
            lean: 0, state: 'in', tx: 0, moving: false, hold: r.chance(0.6),
          });
        }
        return out;
      };
      M.back = mk(7, SUB2_C_FAR, 1.2, 1.34, 120, SUB2_C_W - 140, 'sub2back');
      M.front = mk(6, SUB2_C_NEAR + 8, 1.5, 1.66, 140, SUB2_C_W - 160, 'sub2front');
      // and the ones who got a seat, who are not moving for anybody
      for (let i = 0; i < 9; i++) {
        const sx = 120 + i * 150 + r.int(-8, 8);
        if (Math.abs(sx - SUB2_C_DOORS[0]) < 100 || Math.abs(sx - SUB2_C_DOORS[1]) < 100) continue;
        M.seats.push({
          x: sx, y: SUB2_C_SEAT + 12, sc: r.range(1.26, 1.38), o: r.range(0, 6.3),
          spec: randomBugSpec(makeRng(hashStr('sub2seat' + i))), face: 1, lean: 0,
          pose: r.chance(0.35) ? 'sad' : 'idle', state: 'in', carry: null, hold: false,
        });
      }
      const togo = (M.destIdx - M.idx + SUB2_STOPS.length) % SUB2_STOPS.length;
      S.flash(togo + ' STOPS. YOURS IS ' + M.dest + '. NOBODY WILL REMIND YOU.', 4.5);
    },

    // ---------- the journey ----------
    tick: function (S, dt) {
      const M = S.SUB;
      M.timer -= dt;
      const here = SUB2_STOPS[M.idx];
      const next = SUB2_STOPS[(M.idx + 1) % SUB2_STOPS.length];

      // ---- the sway. a curve every few seconds, and everything lagging it
      M.tiltT -= dt;
      if (M.tiltT <= 0 && M.phase === 'run') {
        M.tiltT = 2.6 + Math.random() * 3.4;
        M.tiltTo = (Math.random() - 0.5) * 2 * (0.5 + Math.random() * 0.5);
      }
      if (M.phase !== 'run') M.tiltTo *= 0.9;
      M.tilt += (M.tiltTo - M.tilt) * Math.min(1, dt * 2.2);
      M.shift = M.tilt * 3 * M.speed;
      // the straps are a pendulum hanging off the tilt, half a beat behind
      M.strapV += (M.tilt * 0.5 - M.strap) * dt * 9 - M.strapV * dt * 1.6;
      M.strap += M.strapV * dt;
      M.lean += (M.tilt * 0.8 - M.lean) * Math.min(1, dt * 3.4);
      const lean = M.lean;
      const leanAll = function (list) {
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          p.lean += ((p.hold ? lean * 0.5 : lean) - p.lean) * Math.min(1, dt * (p.hold ? 5 : 2.6));
        }
      };
      leanAll(M.back); leanAll(M.front); leanAll(M.seats);

      // ---- the running, the slowing, the stopping
      if (M.phase === 'run') {
        M.speed += (1 - M.speed) * Math.min(1, dt * 1.2);
        // between NEZU and UENO the line comes up for air for about nine
        // seconds, and the whole carriage looks different for all of it
        const day = (M.idx === 2) ? clamp(1 - Math.abs(M.timer - 6.5) / 4.5, 0, 1) : 0;
        M.light += (day - M.light) * Math.min(1, dt * 2.4);
        if (!M.announced && M.timer < 5) {
          M.announced = true;
          Voice.chime('station');
          const mine = ((M.idx + 1) % SUB2_STOPS.length) === M.destIdx;
          Voice.say('NEXT STOP ' + next.name + '. DOORS ON THE LEFT.', 'tannoy');
          S.flash('NEXT STOP - ' + next.name + (mine ? '   THIS IS YOURS.' : ''), mine ? 4.5 : 3);
          if (mine) Audio.ui('levelup');
        }
        if (M.timer <= 0) { M.phase = 'slow'; M.timer = 2.4; }
      } else if (M.phase === 'slow') {
        M.speed = Math.max(0, M.timer / 2.4);
        M.light += (0 - M.light) * Math.min(1, dt * 3);
        if (M.timer <= 0) {
          M.phase = 'stop'; M.timer = 7.5; M.idx = (M.idx + 1) % SUB2_STOPS.length;
          if (M.idx === 0) M.laps++;
          M.speed = 0; M.announced = false;
          Voice.chime('station');
          const st = SUB2_STOPS[M.idx];
          const mine = M.idx === M.destIdx;
          S.flash(st.code + '  ' + st.name + (mine ? '  -  GET OFF' : ''), mine ? 5 : 3);
          if (mine) { Audio.ui('fanfare'); M.arrived = true; }
          else if (M.arrived) { M.missed = true; }
          Audio.ui('pop');
          sub2Exchange(S, mine ? 5 : 3, mine ? 3 : 4);
        }
      } else if (M.phase === 'stop') {
        // open over a second, hold, then shut over a second: the door is the
        // only clock in here that anybody actually obeys
        M.door = clamp(Math.min(M.timer / 1.2, (7.5 - M.timer) / 1.1), 0, 1);
        if (M.timer < 1.3 && !M.warned) { M.warned = true; Audio.ui('error'); }
        if (M.timer <= 0) {
          M.phase = 'run'; M.timer = 11 + Math.random() * 2.5; M.door = 0; M.warned = false;
          M.announced = false; M.rode++;
          if (M.idx === M.destIdx && !M.off) {
            M.missed = true;
            S.flash('THAT WAS ' + M.dest + '. YOU ARE STILL ON THE TRAIN.', 4);
            Audio.ui('sad');
          }
        }
      }

      // ---- people walking to and from the doors
      for (const list of [M.back, M.front]) {
        for (let i = list.length - 1; i >= 0; i--) {
          const p = list[i];
          if (p.state === 'in') { p.moving = false; continue; }
          const d = p.tx - p.x;
          p.face = d < 0 ? -1 : 1;
          p.moving = Math.abs(d) > 4;
          p.x += Math.sign(d) * Math.min(Math.abs(d), 76 * dt);
          if (Math.abs(d) <= 4) {
            if (p.state === 'off') list.splice(i, 1);
            else { p.state = 'in'; p.moving = false; }
          }
        }
      }

      // ---- the doors, as something you press a button at
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'sub2cdoor') continue;
        const open = M.phase === 'stop' && M.door > 0.55;
        p.label = open ? (M.idx === M.destIdx ? 'GET OFF HERE' : 'GET OFF') : null;
      }

      if (M.bumpT > 0) M.bumpT -= dt;
      if (M.mutter) { M.mutter.t -= dt; if (M.mutter.t <= 0) M.mutter = null; }

      // the floor of a moving train is never still and neither is the camera
      if (M.speed > 0.2 && Math.random() < dt * 2.4) Game.shake.hit(1, 0.09);
    },

    // ---------- the carriage, behind everybody ----------
    mid: function (ctx, S, t) {
      const M = S.SUB;
      const tilt = M.tilt;
      const tl = function (x) { return Math.round(tilt * ((x - SUB2_C_W / 2) / 340)); };
      const x0 = -120, x1 = SUB2_C_W + 120;
      // ---- the shell
      rect(ctx, x0, SUB2_C_CEIL - 70, x1 - x0, 400, '#c9c4b6');
      vgrad(ctx, x0, SUB2_C_CEIL, x1 - x0, 120, '#e4e0d4', '#b6b1a2');
      rect(ctx, x0, SUB2_C_CEIL, x1 - x0, 4, '#f2eee2');
      // ceiling lights, in a long row, cold and total
      for (let x = 60; x < SUB2_C_W; x += 168) {
        rect(ctx, x, SUB2_C_CEIL + 6, 128, 14, '#dad6ca');
        ctx.globalAlpha = 0.92;
        rect(ctx, x + 3, SUB2_C_CEIL + 8, 122, 9, SUB2_PAL.lamp);
        ctx.globalAlpha = 0.08;
        ellipsePx(ctx, x + 64, SUB2_C_SEAT, 120, 190, SUB2_PAL.lamp);
        ctx.globalAlpha = 1;
      }
      // ---- the wall behind: rack, window band, seats
      rect(ctx, x0, SUB2_C_RACK - 2, x1 - x0, SUB2_C_FAR - SUB2_C_RACK + 4, '#d6d1c2');
      rect(ctx, x0, SUB2_C_RACK - 2, x1 - x0, 3, '#eae6da');
      sub2Rack(ctx, 40, SUB2_C_DOORS[0] - 84, SUB2_C_RACK, 77, tilt);
      sub2Rack(ctx, SUB2_C_DOORS[0] + 84, SUB2_C_DOORS[1] - 84, SUB2_C_RACK, 131, tilt);
      sub2Rack(ctx, SUB2_C_DOORS[1] + 84, SUB2_C_W - 40, SUB2_C_RACK, 199, tilt);
      // the ad panels hung off the ceiling, swinging a beat behind the car.
      // They hang nearer the camera than the rack does, so they are painted
      // after it - otherwise the wall takes the bottom third of every one.
      for (let i = 0; i < 6; i++) {
        const ax = 120 + i * 250;
        if (ax > SUB2_C_W - 40) break;
        sub2AdPanel(ctx, ax, SUB2_C_CEIL + 26, 120, 58, t, 17 + i * 13, M.strap * 1.6);
      }
      // ---- the windows
      sub2CarWindows(ctx, S, t, tl);
      // ---- the seats, long benches with moulded dividers in them
      sub2CarSeats(ctx, S, t);
      // ---- the doors and their pockets
      for (let i = 0; i < SUB2_C_DOORS.length; i++) sub2CarDoor(ctx, S, t, SUB2_C_DOORS[i], M.door);
      // ---- the floor
      rect(ctx, x0, SUB2_C_FAR, x1 - x0, 20, '#6f6a60');
      sideFloor(ctx, x0, x1, SUB2_C_FAR + 18, {
        h: 120, col: '#7d7870', col2: '#6b675f', tile: 40, lip: '#959086', shine: false,
      });
      // the yellow line along the door pocket, which nobody stands behind
      for (let i = 0; i < SUB2_C_DOORS.length; i++) {
        rect(ctx, SUB2_C_DOORS[i] - 66, SUB2_C_FAR + 22, 132, 4, SUB2_PAL.yellow);
      }
      // ---- the back row: people against the seats, dimmed by one depth
      for (let i = 0; i < M.seats.length; i++) sub2Pax(ctx, M.seats[i], t, { dim: 0 });
      for (let i = 0; i < M.back.length; i++) sub2Pax(ctx, M.back[i], t, { dim: 0.14 });
      // ---- the poles, in front of the back row, behind you
      sub2Pole(ctx, 250, SUB2_C_RAIL - 4, SUB2_C_FAR + 16);
      sub2Pole(ctx, SUB2_C_DOORS[0] - 74, SUB2_C_RAIL - 4, SUB2_C_FAR + 16);
      sub2Pole(ctx, SUB2_C_DOORS[0] + 74, SUB2_C_RAIL - 4, SUB2_C_FAR + 16);
      sub2Pole(ctx, 860, SUB2_C_RAIL - 4, SUB2_C_FAR + 16);
      sub2Pole(ctx, SUB2_C_DOORS[1] - 74, SUB2_C_RAIL - 4, SUB2_C_FAR + 16);
      sub2Pole(ctx, SUB2_C_DOORS[1] + 74, SUB2_C_RAIL - 4, SUB2_C_FAR + 16);
      // ---- the strap rail and everything hanging off it
      rect(ctx, x0, SUB2_C_RAIL, x1 - x0, 5, SUB2_PAL.steelLo);
      rect(ctx, x0, SUB2_C_RAIL, x1 - x0, 2, SUB2_PAL.steelHi);
      for (let x = 70; x < SUB2_C_W - 40; x += 46) {
        const phase = (x - SUB2_C_W / 2) * 0.0016;
        sub2Strap(ctx, x, SUB2_C_RAIL + 4, 30, M.strap * 0.55 + Math.sin(t * 1.6 + phase) * 0.03 * (0.4 + M.speed));
      }
    },

    // ---------- the front row, which is in your way ----------
    fore: function (ctx, S, t) {
      const M = S.SUB;
      for (let i = 0; i < M.front.length; i++) sub2Pax(ctx, M.front[i], t, { dim: 0.2 });
      // the one strap that is right in front of the camera
      ctx.globalAlpha = 0.9;
      sub2Strap(ctx, Math.round(S.cam.wx(150)), SUB2_C_RAIL + 6, 44, M.strap * 0.7);
      ctx.globalAlpha = 1;
    },

    after: function (ctx, S, t) {
      const M = S.SUB;
      // daylight floods the whole carriage, not just the window
      if (M.light > 0.02) {
        ctx.globalAlpha = 0.2 * M.light;
        rect(ctx, 0, 0, W, H, '#cfe4ff');
        ctx.globalAlpha = 1;
      }
      grade(ctx, 0, 0, W, H, M.light > 0.3 ? '#cfe4ff' : '#20242e', 0.1);
      vignette(ctx, 0.4, '#05070b');
    },

    // ---------- the strip, the counter, and whatever anybody just said ----------
    overlay: function (ctx, S, t) {
      const M = S.SUB;
      const here = SUB2_STOPS[M.idx], next = SUB2_STOPS[(M.idx + 1) % SUB2_STOPS.length];
      const mine = ((M.idx + 1) % SUB2_STOPS.length) === M.destIdx;
      const txt = M.phase === 'stop'
        ? here.code + '   ' + here.name + '   DOORS OPEN   ' + (M.idx === M.destIdx ? 'THIS IS YOUR STOP' : 'NEXT  ' + next.name)
        : 'NEXT  ' + next.code + '  ' + next.name + '      FOR ' + M.dest + '      ' + (M.idx + 1) + ' / ' + SUB2_STOPS.length;
      // the strip sits under the money bar, not through it
      sub2Led(ctx, 0, 27, W, 26, t, txt, M.phase === 'stop' && M.idx === M.destIdx ? SUB2_PAL.greenHi : (mine ? SUB2_PAL.yellowHi : SUB2_PAL.amber), true);
      // the little counter in the corner: stops gone, stops left
      const bx = W - 96, by = 62;
      rect(ctx, bx, by, 82, 34, 'rgba(8,10,16,0.8)');
      frame(ctx, bx, by, 82, 34, SUB2_PAL.greenLo);
      drawText(ctx, 'STOP', bx + 6, by + 5, '#8a9098', { font: 'small' });
      drawText(ctx, String(M.idx + 1) + '/' + SUB2_STOPS.length, bx + 76, by + 16, SUB2_PAL.greenHi, { align: 'right', scale: 2 });
      if (M.missed && !M.off) {
        ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4);
        drawText(ctx, 'IT LOOPS. GO ROUND AGAIN.', W / 2, H - 136, SUB2_PAL.red, { align: 'center', scale: 2, outline: '#2a0a08' });
        ctx.globalAlpha = 1;
      }
      sub2Mutter(ctx, S);
    },

    // ---------- the scene's own props ----------
    prop: function (ctx, p, t, S) {
      const M = S.SUB;
      if (p.kind === 'sub2cdoor') return true;               // painted with the wall
      if (p.kind === 'sub2cmap') {
        // drawn at the size it wants to be read at, not the size of its hitbox
        sub2RouteMap(ctx, p.x - 100, p.y, 200, p.h, SUB2_STOPS, M.idx, M.destIdx, t);
        return true;
      }
      return false;
    },

    use: function (S, p) {
      const M = S.SUB;
      if (p.kind === 'sub2cmap') {
        S.run([
          { who: 'THE MAP', text: 'YOU ARE AT ' + SUB2_STOPS[M.idx].code + '.', voice: 'tannoy' },
          { who: 'THE MAP', text: 'YOU WANT ' + SUB2_STOPS[M.destIdx].code + '. ' + M.dest + '.', voice: 'tannoy' },
          { who: 'THE MAP', text: SUB2_STOPS[M.destIdx].note + '.', voice: 'tannoy' },
        ]);
        return;
      }
      if (p.kind === 'sub2cdoor') {
        if (!(M.phase === 'stop' && M.door > 0.55)) { Audio.ui('error'); S.flash('THE DOORS ARE SHUT AND THE TRAIN IS MOVING.'); return; }
        if (M.idx === M.destIdx) {
          M.off = true;
          Audio.ui('select');
          Voice.chime('station');
          S.flash('YOU GET OFF AT ' + M.dest + '. YOU MADE IT.', 2.4);
          S.lock(0.7);
          S.leave(home, 'slideR', { dur: 0.7 });
          return;
        }
        S.run([
          { who: 'YOU', text: 'THIS IS ' + SUB2_STOPS[M.idx].name + '. NOT ' + M.dest + '.', voice: 'you', think: true },
          {
            who: 'YOU', text: 'GET OFF ANYWAY?', voice: 'you', think: true,
            choices: [
              {
                label: 'NO. STAY ON.', note: 'SENSIBLE',
                go: function () { S.flash('YOU STAY WHERE YOU ARE. SO DOES EVERYONE.'); },
              },
              {
                label: 'YES. GET OFF HERE.', note: 'WRONG STOP',
                go: function () {
                  M.off = true;
                  Audio.ui('back');
                  S.flash('WRONG PLATFORM. WRONG CITY, NEARLY.', 3);
                  S.leave(function () { return new SubwayPlatformScene({ back: home, dest: M.dest }); }, 'slideR', { dur: 0.7 });
                },
              },
            ],
          },
        ]);
        return;
      }
    },
  };
}

// ---------- the window, which is the only thing that tells you anything ----------
// Dark for most of it, with the tunnel's cable brackets whipping past close
// enough to strobe, and then, for nine seconds, a sky.
function sub2CarWindows(ctx, S, t, tl) {
  const M = S.SUB;
  const segs = [[40, SUB2_C_DOORS[0] - 84], [SUB2_C_DOORS[0] + 84, SUB2_C_DOORS[1] - 84], [SUB2_C_DOORS[1] + 84, SUB2_C_W - 40]];
  for (let s = 0; s < segs.length; s++) {
    const a = segs[s][0], b = segs[s][1];
    // the frame, the rubber, the sliding vent at the top
    rect(ctx, a, SUB2_C_WINTOP - 10, b - a, SUB2_C_WINBOT - SUB2_C_WINTOP + 22, '#b9b4a6');
    rect(ctx, a, SUB2_C_WINTOP - 10, b - a, 3, '#d8d4c8');
    let wx = a + 12;
    while (wx < b - 80) {
      const ww = Math.min(150, b - 12 - wx);
      sub2OneWindow(ctx, S, t, wx, SUB2_C_WINTOP, ww, SUB2_C_WINBOT - SUB2_C_WINTOP, M);
      wx += ww + 16;
    }
  }
}
function sub2OneWindow(ctx, S, t, x, y, w, h, M) {
  const dark = 1 - M.light;
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#8f8a7c');
  rect(ctx, x - 3, y - 3, w + 6, 2, '#c2bdaf');
  rect(ctx, x, y, w, h, dark > 0.5 ? '#0e1219' : '#9fc6e8');
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (M.light < 0.55) {
    // the tunnel: cable trays, brackets, and the odd blue service lamp,
    // all of it going past far too fast to be anything but a rhythm
    ctx.globalAlpha = 1 - M.light;
    const sp = 900 * (0.2 + M.speed);
    const off = (t * sp) % 64;
    for (let i = -1; i < w / 64 + 2; i++) {
      const bx = x + w - (i * 64 + off);
      rect(ctx, bx, y + 10, 5, h - 20, '#242a34');
      rect(ctx, bx, y + 26, 5, 4, '#39414e');
    }
    rect(ctx, x, y + 18, w, 3, '#1a1f28');
    rect(ctx, x, y + h - 26, w, 3, '#1a1f28');
    const loff = (t * sp * 1.3) % 240;
    for (let i = -1; i < w / 240 + 2; i++) {
      const lx = x + w - (i * 240 + loff);
      ctx.globalAlpha = (1 - M.light) * 0.9;
      rect(ctx, lx, y + 30, 6, 12, '#7fd8ff');
      ctx.globalAlpha = (1 - M.light) * 0.22;
      ellipsePx(ctx, lx + 3, y + 36, 26, 20, '#7fd8ff');
    }
    ctx.globalAlpha = 1;
  }
  if (M.light > 0.05) {
    // daylight: a flat sky, a row of roofs, and a line of poles ticking by
    ctx.globalAlpha = M.light;
    vgrad(ctx, x, y, w, h, '#bcd9f2', '#e6eef4');
    const off = (t * 560) % 120;
    for (let i = -1; i < w / 120 + 2; i++) {
      const bx = x + w - (i * 120 + off);
      rect(ctx, bx, y + h * 0.42, 54, h * 0.6, '#8c95a4');
      rect(ctx, bx, y + h * 0.42, 54, 3, '#a8b1bf');
      rect(ctx, bx + 8, y + h * 0.52, 10, 10, '#d6e2ec');
      rect(ctx, bx + 30, y + h * 0.52, 10, 10, '#d6e2ec');
      rect(ctx, bx + 70, y + h * 0.3, 4, h * 0.7, '#6a7079');
    }
    rect(ctx, x, y + h * 0.9, w, h * 0.12, '#7a8290');
    ctx.globalAlpha = 1;
  }
  // the reflection of the carriage in the glass, which is what you look at
  if (dark > 0.35) {
    ctx.globalAlpha = 0.16 * dark;
    for (let i = 0; i < M.front.length; i++) {
      const p = M.front[i];
      const rx = p.x - (p.x - (x + w / 2)) * 0.12;
      if (rx < x - 30 || rx > x + w + 30) continue;
      ellipsePx(ctx, rx, y + h * 0.66, 13, 20, '#cfe4ff');
      ellipsePx(ctx, rx, y + h * 0.36, 9, 9, '#cfe4ff');
    }
    // and you, out of focus, with the case
    const bx = S.body.x - (S.body.x - (x + w / 2)) * 0.12;
    if (bx > x - 30 && bx < x + w + 30) {
      ctx.globalAlpha = 0.2 * dark;
      ellipsePx(ctx, bx, y + h * 0.62, 14, 22, '#e4f0ff');
      ellipsePx(ctx, bx, y + h * 0.32, 10, 10, '#e4f0ff');
    }
    ctx.globalAlpha = 0.07 * dark;
    for (let i = 0; i < 3; i++) rect(ctx, x, y + 8 + i * 22, w, 6, '#ffffff');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  // the handrail across the glass, and the sticker on it
  rect(ctx, x, y + h - 14, w, 5, SUB2_PAL.steelLo);
  rect(ctx, x, y + h - 14, w, 2, SUB2_PAL.steelHi);
  rect(ctx, x + w - 34, y + 6, 26, 14, SUB2_PAL.cream);
  drawKanaBlock(ctx, x + w - 30, y + 8, 9, '#c8402c', 3);
  drawKanaBlock(ctx, x + w - 19, y + 8, 9, '#c8402c', 1);
}

// ---------- the seats ----------
// Long benches with a moulded divider every seat's width, put there in 2004
// to stop three people sitting in the space of two. It did not work.
function sub2CarSeats(ctx, S, t) {
  const segs = [[36, SUB2_C_DOORS[0] - 84], [SUB2_C_DOORS[0] + 84, SUB2_C_DOORS[1] - 84], [SUB2_C_DOORS[1] + 84, SUB2_C_W - 36]];
  for (let s = 0; s < segs.length; s++) {
    const a = segs[s][0], b = segs[s][1];
    // the end panels, which are glass with a steel hoop round them
    for (const e of [a, b]) {
      rect(ctx, e - 5, SUB2_C_SEATBACK - 36, 10, SUB2_C_FAR - SUB2_C_SEATBACK + 36, '#8d939c');
      ctx.globalAlpha = 0.3;
      rect(ctx, e - 3, SUB2_C_SEATBACK - 30, 6, 70, '#bfe0ff');
      ctx.globalAlpha = 1;
      rect(ctx, e - 5, SUB2_C_SEATBACK - 36, 10, 4, SUB2_PAL.steelHi);
    }
    // priority seats live at the two ends of the car, in the other colour
    const prio = (s === 0) || (s === segs.length - 1);
    const col = prio ? SUB2_PAL.prio : SUB2_PAL.moq;
    sub2Moquette(ctx, a + 6, SUB2_C_SEATBACK, b - a - 12, SUB2_C_SEAT - SUB2_C_SEATBACK, col, 31 + s * 7);
    // the cushion, which sticks out toward us and catches the light
    rect(ctx, a + 4, SUB2_C_SEAT, b - a - 8, 20, lighten(col, 0.1));
    rect(ctx, a + 4, SUB2_C_SEAT, b - a - 8, 3, lighten(col, 0.34));
    rect(ctx, a + 4, SUB2_C_SEAT + 17, b - a - 8, 3, darken(col, 0.32));
    // the kick panel under it and the heater grille in the kick panel
    rect(ctx, a + 6, SUB2_C_SEAT + 20, b - a - 12, SUB2_C_FAR - SUB2_C_SEAT - 20, '#9d9890');
    for (let x = a + 14; x < b - 14; x += 9) rect(ctx, x, SUB2_C_SEAT + 26, 4, 10, '#6e6a62');
    // the dividers: a chrome loop every seat, and a worn patch between them
    for (let x = a + 6 + 52; x < b - 20; x += 52) {
      rect(ctx, x - 2, SUB2_C_SEATBACK + 6, 4, SUB2_C_SEAT - SUB2_C_SEATBACK + 12, SUB2_PAL.steelLo);
      rect(ctx, x - 2, SUB2_C_SEATBACK + 6, 2, SUB2_C_SEAT - SUB2_C_SEATBACK + 12, SUB2_PAL.steelHi);
      ellipsePx(ctx, x, SUB2_C_SEATBACK + 4, 4, 4, SUB2_PAL.steel);
    }
    // the priority sticker, which is a shape and a promise
    if (prio) {
      const px0 = a + 14;
      rect(ctx, px0, SUB2_C_SEATBACK - 26, 46, 22, SUB2_PAL.cream);
      frame(ctx, px0, SUB2_C_SEATBACK - 26, 46, 22, '#6a4a7a');
      for (let i = 0; i < 3; i++) {
        circle(ctx, px0 + 9 + i * 14, SUB2_C_SEATBACK - 18, 3, '#6a4a7a');
        rect(ctx, px0 + 6 + i * 14, SUB2_C_SEATBACK - 14, 7, 9, '#6a4a7a');
      }
    }
  }
}
// The door, from inside: two leaves, a window in each, a pocket, and the
// little screen above it that is always one station behind.
function sub2CarDoor(ctx, S, t, dx, open) {
  const top = SUB2_C_WINTOP - 34, bot = SUB2_C_FAR + 18;
  const w = 128, h = bot - top;
  const half = Math.round((w / 2) * (1 - clamp(open, 0, 1)));
  rect(ctx, dx - w / 2 - 8, top - 8, w + 16, h + 8, '#a9a496');
  rect(ctx, dx - w / 2 - 8, top - 8, w + 16, 3, '#cbc6b8');
  // what is behind the doors when they are open: a platform, briefly
  rect(ctx, dx - w / 2, top, w, h, '#181c24');
  if (open > 0.05) {
    rect(ctx, dx - w / 2, top, w, h, '#2a3038');
    sub2TileWall(ctx, dx - w / 2, dx + w / 2, top, top + h - 70, 55);
    rect(ctx, dx - w / 2, top + h - 70, w, 70, '#6f6a60');
    rect(ctx, dx - w / 2, top + h - 70, w, 3, '#8f8a80');
    sub2Tactile(ctx, dx - w / 2, dx + w / 2, top + h - 56);
    // somebody on the platform, deciding whether to run for it
    ctx.globalAlpha = 0.8;
    ellipsePx(ctx, dx + 22, top + h - 34, 10, 16, '#3a4050');
    ellipsePx(ctx, dx + 22, top + h - 54, 8, 8, '#2a2f38');
    ctx.globalAlpha = 1;
  }
  for (const s of [-1, 1]) {
    const lx = s < 0 ? dx - w / 2 : dx + w / 2 - half;
    if (half <= 0) continue;
    rect(ctx, lx, top, half, h, '#cfcabc');
    rect(ctx, lx, top, half, 3, '#e8e4d8');
    rect(ctx, lx, bot - 5, half, 5, '#a09b8e');
    if (half > 18) {
      rect(ctx, lx + 6, top + 26, half - 12, 86, '#2a3038');
      ctx.globalAlpha = 0.22; rect(ctx, lx + 6, top + 26, half - 12, 30, '#bfe0ff'); ctx.globalAlpha = 1;
      rect(ctx, lx + 6, top + 118, half - 12, 4, SUB2_PAL.steelLo);
      // the sticker with the hand in it, and a strip of unreadable warning
      rect(ctx, lx + 8, top + 132, 16, 20, SUB2_PAL.yellow);
      rect(ctx, lx + 10, top + 136, 12, 12, SUB2_PAL.ink);
      for (let i = 0; i < 2; i++) drawKanaBlock(ctx, lx + 10 + i * 12, top + 160, 10, '#7a7568', i + 1);
    }
    rect(ctx, s < 0 ? lx + half - 2 : lx, top, 2, h, '#8d8a80');
  }
  // the gap the doors close on, marked in yellow on the floor of the car
  if (open > 0.02 && open < 0.98) {
    ctx.globalAlpha = 0.4 + 0.5 * Math.sin(t * 14);
    rect(ctx, dx - w / 2 - 8, top - 16, w + 16, 6, SUB2_PAL.amber);
    ctx.globalAlpha = 1;
  }
}

// People getting off and people getting on, at every stop, visibly.
function sub2Exchange(S, off, on) {
  const M = S.SUB;
  const r = makeRng(hashStr('ex' + M.idx + M.rode));
  const doors = SUB2_C_DOORS;
  const lists = [M.back, M.front];
  for (let i = 0; i < off; i++) {
    const L = lists[r.int(0, 1)];
    if (L.length <= 2) continue;
    const p = L[r.int(0, L.length - 1)];
    if (p.state !== 'in') continue;
    p.state = 'off';
    p.tx = Math.abs(doors[0] - p.x) < Math.abs(doors[1] - p.x) ? doors[0] : doors[1];
  }
  for (let i = 0; i < on; i++) {
    const L = lists[r.int(0, 1)];
    const d = doors[r.int(0, 1)];
    const far = L === M.back;
    L.push({
      x: d, y: far ? SUB2_C_FAR : SUB2_C_NEAR + 8, sc: far ? r.range(1.2, 1.34) : r.range(1.5, 1.66),
      o: r.range(0, 6.3), spec: randomBugSpec(makeRng(hashStr('on' + M.idx + i + M.rode))),
      face: 1, carry: r.chance(0.45) ? r.pick(['bag', 'case', 'phone', 'umbrella']) : null,
      lean: 0, state: 'on', tx: clamp(d + r.range(-220, 220), 110, SUB2_C_W - 120),
      moving: true, hold: r.chance(0.5),
    });
  }
  M.load = clamp(M.load + (on - off) * 0.06, 0.3, 1);
}

// The small bubble that appears when you tread on somebody. It does not stop
// the game, because on a packed train nothing stops for you.
function sub2Mutter(ctx, S) {
  const M = S.SUB;
  if (!M.mutter) return;
  const m = M.mutter;
  const a = clamp(m.t * 2, 0, 1);
  const sx = S.cam.sx(m.x), sy = S.cam.sy(m.y) - 60;
  const w = textWidth(m.text, { scale: 2 }) + 16;
  ctx.globalAlpha = a;
  rect(ctx, sx - w / 2 + 3, sy + 3, w, 24, 'rgba(6,5,12,0.4)');
  rect(ctx, sx - w / 2, sy, w, 24, '#f6f2e0');
  frame(ctx, sx - w / 2, sy, w, 24, SUB2_PAL.ink);
  rect(ctx, sx - w / 2 + 1, sy + 1, w - 2, 2, '#ffffff');
  ctx.fillStyle = '#f6f2e0';
  ctx.beginPath();
  ctx.moveTo(sx - 5, sy + 23); ctx.lineTo(sx + 5, sy + 23); ctx.lineTo(sx, sy + 32);
  ctx.fill();
  drawText(ctx, m.text, sx, sy + 6, SUB2_PAL.ink, { align: 'center', scale: 2 });
  ctx.globalAlpha = 1;
}

class SubwaySideScene extends SideScene {
  constructor(a, b) {
    const o = sub2Opts(a, b);
    super(sub2CarriageDef(o), o);
  }

  // On a packed train everybody is within arm's reach and nobody is on your
  // level, so the floor test that every other scene wants is dropped here.
  findPrompt() {
    const b = this.body;
    let best = null, bd = 1e9;
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (!p.label && !p.act) continue;
      const d = Math.abs(b.x - p.x) - (p.w || 40) / 2;
      if (d < (p.reach || 34) && d < bd) { bd = d; best = { kind: 'prop', p: p }; }
    }
    for (let i = 0; i < this.npcs.length; i++) {
      const n = this.npcs[i];
      if (!n.tag && !n.act) continue;
      const d = Math.abs(b.x - n._x) - 18;
      if (d < 30 && d < bd) { bd = d; best = { kind: 'npc', n: n }; }
    }
    return best;
  }

  // Only the ends of the car are walls. People are not walls: a packed train
  // works because everybody gives way by exactly as much as they have to, and
  // a scene where they were solid would be a scene with a door you can never
  // reach. So you shove, slowly, and they shuffle, and they say something.
  solid(x) {
    return x < 96 || x > SUB2_C_W - 96;
  }
  sub2Shove(dt) {
    const M = this.SUB;
    if (!M) return;
    const bx = this.body.x, moving = this.body.moving;
    const nudge = function (p, px2, set) {
      const d = px2 - bx;
      if (Math.abs(d) > 26) return false;
      const push = (26 - Math.abs(d)) * (d < 0 ? -1 : 1) * dt * 3.4;
      set(px2 + push);
      return moving;
    };
    for (let i = 0; i < this.npcs.length; i++) {
      const n = this.npcs[i];
      if (n.hidden || n.floor === 0) continue;
      if (n.home == null) n.home = n._x;
      // they drift back to where they were standing, because they were there
      // first and they have not forgotten it
      n._x += (n.home - n._x) * Math.min(1, dt * 0.7);
      if (nudge(n, n._x, function (v) { n._x = v; })) this.sub2Bump(n._x, n.voice);
    }
    const lists = [M.back, M.front];
    for (let L = 0; L < 2; L++) {
      const list = lists[L];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        if (p.state !== 'in') continue;
        if (p.home == null) p.home = p.x;
        p.x += (p.home - p.x) * Math.min(1, dt * 0.7);
        if (nudge(p, p.x, function (v) { p.x = v; })) this.sub2Bump(p.x, null);
      }
    }
  }
  sub2Bump(x, voice) {
    const M = this.SUB;
    if (!M || M.bumpT > 0) return;
    M.bumpT = 1.6 + Math.random() * 1.2;
    const r = makeRng(hashStr('bump' + Math.round(this.t * 7)));
    const text = r.pick(SUB2_BUMPS);
    M.mutter = { text: text, x: x, y: SUB2_C_FAR - 6, t: 1.7 };
    Voice.say(text, voice || 'driver', { gain: 0.7 });
    Audio.ui('move');
  }

  // Everybody in the carriage leans, including you, and the train leans first.
  drawHero(ctx) {
    const M = this.SUB, b = this.body;
    const y = this.floorY(b.fk), z = this.floorZ(b.fk);
    const lean = M ? M.lean : 0;
    drawShadow(ctx, b.x, y + 2, 24 * b.scale * z, 0.28);
    drawBugAt(ctx, this.you.spec, b.x + Math.round(lean * 2), y + 3, {
      pose: b.pose, scale: b.scale * z, flip: b.flip, bounce: b.moving ? 1 : 0.5, tilt: lean * 0.05,
    });
    if (b.carry) drawSideCarry(ctx, b.carry, b.x + Math.round(lean * 2), y, b.face, b.scale * z, this.t);
  }
  drawNpc(ctx, n) {
    const M = this.SUB;
    const lean = M ? M.lean * (n.role === 'sleep' ? 1.5 : n.floor === 0 ? 0.3 : 1) : 0;
    const y = n.y != null ? n.y : this.floorY(n.floor), z = this.floorZ(n.floor);
    const lx = n._x + Math.round(lean * 2);
    drawShadow(ctx, lx, y + 2, 22 * n.scale * z, 0.22);
    // a sleeping salarybug has no pose in the sheet, so he is an idle bug
    // leaning at an angle no awake bug would ever choose
    const pose = n.pose || (n.role === 'read' ? 'idle' : n.role === 'count' ? 'talk' : 'idle');
    drawBugAt(ctx, n.spec, lx, y + 3, {
      pose: pose, scale: n.scale * z, flip: n.face < 0, bounce: n.role === 'sleep' ? 0.2 : 0.4,
      phase: n.t, tilt: lean * 0.05 + (n.role === 'sleep' ? 0.13 : 0),
    });
    if (n.carry) drawSideCarry(ctx, n.carry, lx, y, n.face || 1, n.scale * z, this.t);
    this.sub2Kit(ctx, n, lx, y);
  }
  // The props that belong to one person and nobody else.
  sub2Kit(ctx, n, x, y) {
    const t = this.t;
    switch (n.role) {
      case 'head': {
        // headphones, the big kind, worn as a hat as much as a thing that works
        rect(ctx, x - 13, y - 62, 26, 4, '#241d28');
        rect(ctx, x - 16, y - 60, 7, 13, '#2f3540');
        rect(ctx, x + 9, y - 60, 7, 13, '#2f3540');
        rect(ctx, x - 16, y - 60, 7, 3, '#4a5260');
        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 9);
        for (let i = 0; i < 3; i++) px(ctx, x + 20 + i * 4, y - 58 - i * 3, SUB2_PAL.greenHi);
        ctx.globalAlpha = 1;
        break;
      }
      case 'read': {
        // a paperback, held open one-handed, with a bus ticket in it
        const flap = Math.sin(t * 0.7) > 0.9 ? 2 : 0;
        rect(ctx, x + 11, y - 40, 15, 20, '#e8e2d0');
        rect(ctx, x + 11, y - 40, 15, 2, '#f6f2e6');
        rect(ctx, x + 11 + flap, y - 40, 2, 20, '#8a8478');
        for (let i = 0; i < 4; i++) rect(ctx, x + 15, y - 36 + i * 4, 9, 1, '#a09a8e');
        rect(ctx, x + 22, y - 42, 3, 6, '#c8402c');
        break;
      }
      case 'bag': {
        // an enormous shopping bag, held in front, taking a seat's worth of air
        rect(ctx, x + 12, y - 40, 32, 38, '#f0ead8');
        rect(ctx, x + 12, y - 40, 32, 3, '#ffffff');
        rect(ctx, x + 12, y - 4, 32, 4, '#cfc8b4');
        for (let i = 0; i < 2; i++) drawKanaBlock(ctx, x + 17 + i * 13, y - 32, 11, '#c8402c', i + 2);
        ctx.strokeStyle = '#b9b2a0'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x + 20, y - 40); ctx.lineTo(x + 24, y - 50); ctx.lineTo(x + 34, y - 50); ctx.lineTo(x + 38, y - 40); ctx.stroke();
        ctx.lineWidth = 1;
        break;
      }
      case 'count': {
        // fingers, being counted, and recounted
        const n2 = 2 + Math.floor((t * 0.8) % 4);
        for (let i = 0; i < n2; i++) rect(ctx, x + 12 + i * 4, y - 44 - (i % 2) * 2, 3, 9, '#f4d8c0');
        rect(ctx, x + 10, y - 36, 18, 5, '#e8c8a8');
        break;
      }
      case 'sleep': {
        // the head that has gone, and the tiny Z nobody else has noticed
        ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 1.4);
        drawText(ctx, 'Z', x + 18, y - 74 - (t * 5 % 10), '#cfc9e6', { font: 'small' });
        ctx.globalAlpha = 1;
        break;
      }
      case 'muso': {
        // he nods at the case when you are near enough to see him do it
        const near = Math.abs(this.body.x - x) < 120;
        if (near) {
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3);
          ctx.fillStyle = SUB2_PAL.greenHi;
          ctx.beginPath();
          ctx.moveTo(x, y - 76); ctx.lineTo(x - 5, y - 84); ctx.lineTo(x + 5, y - 84);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        break;
      }
    }
  }

  // The carriage shifts on the curves and takes everything in it with it.
  update(dt) {
    super.update(dt);
    const M = this.SUB;
    if (!M) return;
    this.sub2Shove(dt);
    // The carriage is what moves on a curve, so the whole view moves and
    // everything standing in it goes along: two pixels sideways, one down.
    // Nobody notices it happening. Everybody notices when it stops.
    this.cam.view.x = Math.round(M.shift);
    this.cam.view.y = Math.round(Math.sin(this.t * 7.4) * 1.4 * M.speed + Math.abs(M.tilt) * 2);
  }
}
