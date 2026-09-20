// ---------- The capsule hotel, two in the morning ----------
// You have been awake for twenty-nine hours and somebody is still on the desk,
// awake, unbothered, with a cat on the counter and a fan pushing the same warm
// air round the lobby. This place is a machine for putting a tired body
// somewhere clean and horizontal, and it works in a fixed order: pay, shoes
// off, bag away, wash, lie down. You do not get to skip a step. The building
// will not let you, and neither will the clerk.
//
// Two levels: the floor you walk on, and the upper row of capsules you reach
// by a ladder at the far end. Nothing in here is bigger than it needs to be.
'use strict';

const CAPN_W = 2400;
const CAPN_UP = 300;          // the upper walkway / upper row of capsules
const CAPN_DOWN = 440;        // the floor
const CAPN_NUM = '214';       // your number. It is on the band and on the door.
const CAPN_ONE = 26, CAPN_THREE = 66;
// The capsule block is at the east end. One place decides where the shells
// are, so the number painted over a door and the spot you stand at to use it
// cannot drift apart: the props are placed off this, not by eye.
const CAPN_ROW_X0 = 2040, CAPN_ROW_PITCH = 82, CAPN_ROW_N = 4, CAPN_ROW_UP1 = 211;
const CAPN_ROW_X1 = CAPN_ROW_X0 + CAPN_ROW_N * CAPN_ROW_PITCH - 8;
function capnPodX(n) { return CAPN_ROW_X0 + (n - CAPN_ROW_UP1) * CAPN_ROW_PITCH + (CAPN_ROW_PITCH - 8) / 2; }

const CAPN_PAL = {
  wall: '#2b2636', wallHi: '#3d3750', wallLo: '#1c1826',
  floor: '#3a3142', floorHi: '#4e4358', floorLo: '#261f30',
  wood: '#7a5a3a', woodHi: '#9c7550', woodLo: '#4f3824',
  steel: '#8a8f98', steelHi: '#c0c6ce', steelLo: '#5a606a',
  pod: '#ded8c6', podHi: '#f2ecda', podLo: '#9a9382',
  cream: '#f4f1ea', ink: '#241d28',
  gold: '#ffd24a', green: '#6be585', red: '#c8402c',
  tube: '#ffeec4', dim: '#12101c',
};

// ---------- the shell of the building ----------
// A corridor hotel is a long box with a lowered ceiling, a dado rail at the
// height of a shoulder, and a line of fluorescent tubes doing all the lying
// about what time it is.
function capnShell(ctx, S, t, x0, x1) {
  const P = CAPN_PAL;
  // the wall, from well above the camera down to under the floor, so the
  // upper level never opens a hole onto nothing
  rect(ctx, x0, -320, x1 - x0, 900, P.wall);
  // the suspended ceiling: square tiles on a grid, sagging where the damp got in
  rect(ctx, x0, 60, x1 - x0, 44, '#443d54');
  for (let x = Math.floor(x0 / 52) * 52; x < x1; x += 52) {
    rect(ctx, x, 60, 2, 44, '#332e42');
    const sag = ((x / 52) | 0) % 7 === 3 ? 2 : 0;
    rect(ctx, x + 2, 62 + sag, 48, 40, ((x / 52) | 0) % 5 === 1 ? '#4d4660' : '#48415a');
  }
  rect(ctx, x0, 102, x1 - x0, 4, P.wallLo);
  rect(ctx, x0, 106, x1 - x0, 2, P.wallHi);
  // the tubes. Two out of every seven have given up and buzz instead.
  for (let x = Math.floor(x0 / 340) * 340; x < x1; x += 340) {
    const n = Math.abs(Math.round(x / 340));
    const dying = n % 7 === 4;
    const on = dying ? (Math.sin(t * 27 + n) > -0.8 ? 1 : 0.18) : 1;
    rect(ctx, x + 60, 100, 150, 8, '#5a5468');
    ctx.globalAlpha = on; rect(ctx, x + 64, 102, 142, 5, P.tube); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.09 * on; rect(ctx, x + 40, 108, 190, 130, P.tube); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.05 * on; ellipsePx(ctx, x + 135, CAPN_DOWN - 4, 130, 22, P.tube); ctx.globalAlpha = 1;
  }
  // the dado rail and the paint change under it, the colour of every corridor
  // in every cheap building on earth
  rect(ctx, x0, 340, x1 - x0, 5, P.woodLo);
  rect(ctx, x0, 340, x1 - x0, 2, P.wood);
  ctx.globalAlpha = 0.5; rect(ctx, x0, 345, x1 - x0, CAPN_DOWN - 345, '#241f30'); ctx.globalAlpha = 1;
  // the skirting, and the little grey scuff line where a thousand suitcases went past
  rect(ctx, x0, CAPN_DOWN - 14, x1 - x0, 14, '#241f2e');
  rect(ctx, x0, CAPN_DOWN - 14, x1 - x0, 2, '#3a3448');
  ctx.globalAlpha = 0.18; rect(ctx, x0, CAPN_DOWN - 28, x1 - x0, 5, '#8a8f98'); ctx.globalAlpha = 1;
}

// The floor: carpet tile in the corridor, hard vinyl where the water is.
function capnFloor(ctx, S, t, x0, x1) {
  const P = CAPN_PAL;
  sideFloor(ctx, x0, x1, CAPN_DOWN, { h: 180, col: P.floor, col2: P.floorLo, tile: 44, lip: P.floorHi, shine: false });
  // the washroom end is wet-look vinyl, so it gets the sheen and the corridor does not
  ctx.save();
  ctx.beginPath(); ctx.rect(1420, CAPN_DOWN, 530, 60); ctx.clip();
  rect(ctx, 1420, CAPN_DOWN, 530, 60, '#4a5560');
  rect(ctx, 1420, CAPN_DOWN, 530, 3, '#7a8894');
  for (let x = 1420; x < 1950; x += 36) { ctx.globalAlpha = 0.12; rect(ctx, x, CAPN_DOWN + 3, 1, 50, '#000'); ctx.globalAlpha = 1; }
  sideSheen(ctx, 1420, 1950, CAPN_DOWN, 0.13);
  ctx.restore();
  // the genkan: the step you take your shoes off at, one wooden lip across
  // the corridor, and the old dark floor on the street side of it
  rect(ctx, 0, CAPN_DOWN - 6, 500, 6, P.woodLo);
  rect(ctx, 0, CAPN_DOWN - 6, 500, 2, P.woodHi);
  rect(ctx, 494, CAPN_DOWN - 6, 8, 20, P.wood);
}

// ---------- a sleeping cat ----------
// Curled on the counter with its nose under its own tail, breathing at about
// a third of the speed of everything else in the building.
function capnCat(ctx, cx, base, s, t) {
  const br = Math.sin(t * 0.9) * 0.6;
  const body = '#d8cdb8', dark = '#b2a58c', ink = '#3a3128';
  ctx.globalAlpha = 0.24; ellipsePx(ctx, cx, base + 1, 15 * s, 3 * s, '#000'); ctx.globalAlpha = 1;
  // the body, a flattened heap
  ellipsePx(ctx, cx, base - 6 * s + br, 15 * s, (7 + br * 0.4) * s, body);
  ellipsePx(ctx, cx - 3 * s, base - 8 * s + br, 11 * s, 5 * s, lighten(body, 0.12));
  // the tail round the front
  for (let i = 0; i < 9; i++) {
    const a = i / 8;
    px(ctx, cx + 12 * s - a * 22 * s, base - 1 * s - Math.sin(a * 2.2) * 3 * s, dark);
    rect(ctx, cx + 12 * s - a * 22 * s, base - 2 * s - Math.sin(a * 2.2) * 3 * s, 2 * s, 2 * s, dark);
  }
  // the head, tucked
  ellipsePx(ctx, cx - 10 * s, base - 8 * s + br, 6 * s, 5 * s, body);
  // ears, two little triangles
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.moveTo(cx - 14 * s, base - 11 * s + br); ctx.lineTo(cx - 12 * s, base - 16 * s + br); ctx.lineTo(cx - 10 * s, base - 11 * s + br); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - 8 * s, base - 11 * s + br); ctx.lineTo(cx - 6 * s, base - 15 * s + br); ctx.lineTo(cx - 4 * s, base - 11 * s + br); ctx.fill();
  // the eyes, which are two shut lines, and the one whisker you can see
  rect(ctx, cx - 14 * s, base - 8 * s + br, 4 * s, 1, ink);
  rect(ctx, cx - 8 * s, base - 8 * s + br, 3 * s, 1, ink);
  rect(ctx, cx - 16 * s, base - 6 * s + br, 5 * s, 1, withAlpha('#ffffff', 0.5));
  // three stripes, because a cat with no stripes reads as a bread roll
  for (let i = 0; i < 3; i++) rect(ctx, cx - 2 * s + i * 6 * s, base - 12 * s + br, 2 * s, 5 * s, dark);
}

// ---------- the desk fan ----------
// Oscillating, doing nothing for anybody, plastic gone the colour of tea.
function capnFan(ctx, cx, base, s, t) {
  const sw = Math.sin(t * 0.7);
  rect(ctx, cx - 9 * s, base - 3 * s, 18 * s, 3 * s, '#a8a08c');
  rect(ctx, cx - 2 * s, base - 22 * s, 4 * s, 19 * s, '#c4bca8');
  const hx = cx + sw * 5 * s, r = 11 * s;
  // the cage: two rings and the blur inside
  ringPx(ctx, hx, base - 30 * s, r, '#8e8878');
  ringPx(ctx, hx, base - 30 * s, r - 4, '#8e8878');
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) {
    const a = t * 22 + i * 2.09;
    line(ctx, hx, base - 30 * s, hx + Math.cos(a) * (r - 2), base - 30 * s + Math.sin(a) * (r - 2), '#e6e0cc');
  }
  ctx.globalAlpha = 1;
  circle(ctx, hx, base - 30 * s, 3 * s, '#6a6456');
  // the flex, hanging off the back of it
  for (let i = 0; i < 7; i++) px(ctx, cx + 10 * s + i, base - 4 * s + Math.sin(i * 0.8) * 2, '#3a3428');
}

// ---------- the key rack ----------
// A board of hooks with a wooden tag on each. One hook is empty from the
// moment you check in, and that empty hook is the whole transaction.
function capnKeyRack(ctx, x, y, w, h, t, taken) {
  const P = CAPN_PAL;
  rect(ctx, x, y, w, h, P.woodLo);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, P.wood);
  rect(ctx, x + 2, y + 2, w - 4, 2, P.woodHi);
  const cols = 8, rows = 3;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const kx = x + 7 + c * ((w - 14) / cols), ky = y + 8 + r * ((h - 12) / rows);
    rect(ctx, kx, ky, 2, 3, '#c9c3b0');                       // the hook
    const n = 201 + r * cols + c;
    if (taken && String(n) === CAPN_NUM) {
      ctx.globalAlpha = 0.5; rect(ctx, kx - 1, ky, 4, 2, '#7a7364'); ctx.globalAlpha = 1;
      continue;
    }
    rect(ctx, kx - 3, ky + 3, 9, 11, '#d8c9a4');
    rect(ctx, kx - 3, ky + 3, 9, 1, '#f0e4c4');
    drawText(ctx, String(n % 100), kx + 1, ky + 6, '#5a4a2a', { align: 'center', font: 'small' });
  }
}

// ---------- the laminated rules ----------
// Six rules in a language you do not have, and one line in English at the
// bottom that somebody added later, by hand, because it kept happening.
function capnRules(ctx, x, base, w, h, t) {
  const y = base - h;
  ctx.globalAlpha = 0.3; rect(ctx, x + 2, y + 3, w, h, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, y, w, h, '#f2eede');
  frame(ctx, x, y, w, h, '#b9b2a0');
  rect(ctx, x + 4, y + 4, w - 8, 10, '#c8402c');
  drawText(ctx, 'RULES', x + w / 2, y + 6, '#fff2e0', { align: 'center', font: 'small' });
  const r = makeRng(4411);
  for (let i = 0; i < 6; i++) {
    const ry = y + 19 + i * 11;
    rect(ctx, x + 5, ry + 2, 4, 4, '#c8402c');
    for (let k = 0; k < 5; k++) drawKanaBlock(ctx, x + 12 + k * 10, ry, 8, '#3a3444', r.int(0, 5));
  }
  drawText(ctx, 'NO SHOES', x + 6, y + h - 20, '#3a3444', { font: 'small' });
  drawText(ctx, 'NO VOICES', x + 6, y + h - 13, '#3a3444', { font: 'small' });
  // the laminate itself, which is the bit that makes it a laminated sign
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(x + 6, y + h); ctx.lineTo(x + 20, y + h); ctx.lineTo(x + 20 + h * 0.5, y); ctx.lineTo(x + 6 + h * 0.5, y); ctx.fill();
  ctx.globalAlpha = 1;
}

// ---------- the little television, on mute ----------
// A talk show at two in the morning: four faces in boxes, all of them
// laughing at something, none of it audible.
function capnTv(ctx, x, y, w, h, t, mute) {
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#2a2630');
  rect(ctx, x - 3, y - 3, w + 6, 2, '#453f52');
  rect(ctx, x, y, w, h, '#0b0d14');
  // four panes, each with a head in it, each with its own caption bar
  for (let i = 0; i < 4; i++) {
    const px2 = x + 3 + (i % 2) * ((w - 6) / 2), py = y + 3 + ((i / 2) | 0) * ((h - 6) / 2);
    const pw = (w - 6) / 2 - 2, ph = (h - 6) / 2 - 2;
    rect(ctx, px2, py, pw, ph, ['#2f4a68', '#5a3a48', '#3f5a3a', '#4a4058'][i]);
    const bob = Math.sin(t * 3 + i * 1.7) > 0.4 ? 1 : 0;
    ellipsePx(ctx, px2 + pw / 2, py + ph * 0.58 - bob, pw * 0.22, ph * 0.26, '#2a2230');
    ellipsePx(ctx, px2 + pw / 2, py + ph * 0.36 - bob, pw * 0.18, ph * 0.2, '#e0b89a');
    rect(ctx, px2, py + ph - 5, pw, 5, i === 1 ? '#f2c94c' : '#c8402c');
    for (let k = 0; k < 3; k++) drawKanaBlock(ctx, px2 + 2 + k * 5, py + ph - 4, 4, '#1b1622', (i + k) % 6);
  }
  // scanlines and the refresh band, which is what a TV looks like on camera
  ctx.globalAlpha = 0.1; for (let i = 0; i < h; i += 3) rect(ctx, x, y + i, w, 1, '#000'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.07; rect(ctx, x, y + ((t * 40) % h), w, 9, '#ffffff'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.09; ellipsePx(ctx, x + w / 2, y + h + 34, w * 0.8, 40, '#8ad8ff'); ctx.globalAlpha = 1;
  // the mute icon, sitting in the corner the way it does for hours
  if (mute !== false) {
    const mx = x + w - 15, my = y + 5;
    rect(ctx, mx, my + 3, 3, 4, '#e8e4dc');
    ctx.fillStyle = '#e8e4dc'; ctx.beginPath();
    ctx.moveTo(mx + 3, my + 5); ctx.lineTo(mx + 8, my + 1); ctx.lineTo(mx + 8, my + 9); ctx.fill();
    line(ctx, mx, my, mx + 10, my + 10, '#e8503a');
  }
}

// ---------- the shoe lockers ----------
// Small wooden doors, a wooden key in each, and a row of shoes underneath
// belonging to people who are already asleep.
function capnShoeLockers(ctx, x, base, w, h, t, S, yours) {
  const P = CAPN_PAL, y = base - h;
  rect(ctx, x, y, w, h, P.woodLo);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, P.wood);
  rect(ctx, x + 2, y + 2, w - 4, 2, P.woodHi);
  const cols = 7, rows = 4, cw = (w - 8) / cols, ch = (h - 8) / rows;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const dx = x + 4 + c * cw, dy = y + 4 + r * ch;
    const n = r * cols + c;
    const mine = yours && n === 13;
    rect(ctx, dx + 1, dy + 1, cw - 2, ch - 2, mine ? lighten(P.wood, 0.16) : P.wood);
    rect(ctx, dx + 1, dy + 1, cw - 2, 1, P.woodHi);
    rect(ctx, dx + 1, dy + ch - 2, cw - 2, 1, P.woodLo);
    // the wooden key, sticking out of the face of the door
    rect(ctx, dx + cw - 7, dy + ch / 2 - 3, 3, 7, mine ? '#8a7a58' : '#d8c9a4');
    drawText(ctx, String(n + 1), dx + 4, dy + 3, withAlpha('#f0e4c4', 0.6), { font: 'small' });
  }
  // the shoes on the shelf under it: five pairs, one of them yours
  rect(ctx, x - 4, base - 16, w + 8, 4, P.woodLo);
  const pairs = [['#2a2430', 1], ['#5a3a2a', 0], ['#e8e4dc', 1], ['#2f4a68', 0], ['#3a3a44', 1]];
  for (let i = 0; i < pairs.length; i++) {
    const sx = x + 14 + i * ((w - 28) / pairs.length);
    for (let k = 0; k < 2; k++) {
      const c = pairs[i][0];
      rect(ctx, sx + k * 8, base - 12, 7, 5, c);
      rect(ctx, sx + k * 8, base - 12, 7, 1, lighten(c, 0.2));
      if (pairs[i][1]) rect(ctx, sx + k * 8 + 1, base - 14, 5, 2, darken(c, 0.2));
    }
  }
  // yours, last on the shelf, once you have taken them off
  if (yours) {
    const sx = x + w - 22;
    for (let k = 0; k < 2; k++) {
      rect(ctx, sx + k * 8, base - 12, 7, 5, '#6a4a2e');
      rect(ctx, sx + k * 8, base - 13, 7, 2, '#8a6440');
    }
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 3);
    rect(ctx, sx - 2, base - 20, 20, 2, CAPN_PAL.gold);
    ctx.globalAlpha = 1;
  }
}

// ---------- the big lockers ----------
// Grey steel, a lot of them, full-length, with a shelf of folded yukata and a
// stack of thin towels beside them.
function capnLockers(ctx, x, base, w, h, t, S, open) {
  const P = CAPN_PAL, y = base - h;
  ctx.globalAlpha = 0.26; ellipsePx(ctx, x + w / 2, base + 1, w * 0.5, 5, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, y, w, h, P.steelLo);
  const cols = 5, cw = (w - 6) / cols;
  for (let c = 0; c < cols; c++) {
    const dx = x + 3 + c * cw;
    const mine = c === 3;
    const swing = mine && open ? 1 : 0;
    rect(ctx, dx + 1, y + 3, cw - 2, h - 6, swing ? '#1b1826' : '#9aa0aa');
    if (!swing) {
      rect(ctx, dx + 1, y + 3, cw - 2, 2, P.steelHi);
      rect(ctx, dx + 1, y + h - 5, cw - 2, 2, '#6a7079');
      // the vent slots near the top, and the dial
      for (let i = 0; i < 4; i++) rect(ctx, dx + 5, y + 10 + i * 4, cw - 10, 2, '#6a7079');
      circle(ctx, dx + cw / 2, y + h * 0.5, 4, '#4a5058');
      circle(ctx, dx + cw / 2, y + h * 0.5, 2, '#c0c6ce');
    } else {
      // your one, standing open: the inside is empty and slightly too clean
      rect(ctx, dx + 2, y + 5, cw - 4, h - 10, '#241f2e');
      rect(ctx, dx + 2, y + 5, cw - 4, 2, '#3a3448');
      ctx.globalAlpha = 0.16; rect(ctx, dx + 2, y + 5, cw - 4, 18, '#ffe9a8'); ctx.globalAlpha = 1;
      rect(ctx, dx + cw - 3, y + 3, 3, h - 6, '#b0b6c0');
    }
    drawText(ctx, String(211 + c), dx + 3, y + 5, '#3a4048', { font: 'small' });
  }
  // the shelf beside it: folded yukata, then towels, thin as paper
  rect(ctx, x + w + 4, base - 66, 62, 5, P.woodLo);
  rect(ctx, x + w + 4, base - 30, 62, 5, P.woodLo);
  for (let i = 0; i < 4; i++) {
    rect(ctx, x + w + 8 + i * 14, base - 78, 12, 12, i % 2 ? '#3a4a68' : '#4a5a78');
    rect(ctx, x + w + 8 + i * 14, base - 78, 12, 2, '#6a7a98');
    rect(ctx, x + w + 8 + i * 14, base - 72, 12, 1, '#2a3448');
  }
  for (let i = 0; i < 5; i++) rect(ctx, x + w + 8 + i * 11, base - 42, 9, 12, i % 2 ? '#e6e2d8' : '#f2eee4');
  drawText(ctx, 'TAKE ONE', x + w + 36, base - 92, withAlpha(P.cream, 0.55), { align: 'center', font: 'small' });
}

// ---------- a noren ----------
// Split curtain over a doorway. It is the only thing between the corridor and
// a room full of hot water, and it does the job.
function capnNoren(ctx, x, y, w, h, col, t, seed) {
  rect(ctx, x, y - 4, w, 4, '#5a4a38');
  const panels = 3, pw = w / panels;
  for (let i = 0; i < panels; i++) {
    const sway = Math.sin(t * 0.9 + i * 1.3) * 2;
    const px2 = x + i * pw + sway * (i === 1 ? 0.4 : 1);
    rect(ctx, px2 + 1, y, pw - 2, h, col);
    rect(ctx, px2 + 1, y, pw - 2, 2, lighten(col, 0.22));
    rect(ctx, px2 + 1, y + h - 3, pw - 2, 3, darken(col, 0.25));
    ctx.globalAlpha = 0.9;
    drawKanaBlock(ctx, px2 + pw / 2 - 6, y + h * 0.3, 12, CAPN_PAL.cream, (seed || 0) + i);
    ctx.globalAlpha = 1;
  }
  // the light and the steam coming out from under it
  ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 1.4);
  rect(ctx, x, y + h, w, CAPN_DOWN - (y + h), '#ffe9c0');
  ctx.globalAlpha = 1;
}

// ---------- the row of sinks ----------
// Mirrors, a shelf of amenities in wicker baskets, hair dryers on curly flex,
// and a smell of cheap green soap you can practically see.
function capnSinks(ctx, x, base, w, t, S) {
  const P = CAPN_PAL;
  const top = base - 150;
  // the tiled wall behind, small square tiles with grubby grout
  rect(ctx, x, top, w, 150, '#c8ccd0');
  for (let gx = x; gx < x + w; gx += 14) rect(ctx, gx, top, 1, 150, '#a4aab0');
  for (let gy = top; gy < base; gy += 14) rect(ctx, x, gy, w, 1, '#a4aab0');
  ctx.globalAlpha = 0.12; rect(ctx, x, base - 40, w, 40, '#6a7078'); ctx.globalAlpha = 1;
  // the mirrors: one long sheet, with a strip light over it
  rect(ctx, x + 6, top + 12, w - 12, 62, '#78848c');
  rect(ctx, x + 8, top + 14, w - 16, 58, '#9fb4bc');
  ctx.globalAlpha = 0.5; vgrad(ctx, x + 8, top + 14, w - 16, 58, '#cfe0e8', '#61757e'); ctx.globalAlpha = 1;
  rect(ctx, x + 6, top + 6, w - 12, 5, '#e8e4dc');
  ctx.globalAlpha = 0.85; rect(ctx, x + 8, top + 7, w - 16, 3, P.tube); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.1; rect(ctx, x + 6, top + 12, w - 12, 62, P.tube); ctx.globalAlpha = 1;
  // the diagonal flare and the fogged corner, so it reads as glass not paint
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < w; i += 90) {
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.moveTo(x + i, top + 74); ctx.lineTo(x + i + 14, top + 74); ctx.lineTo(x + i + 48, top + 14); ctx.lineTo(x + i + 34, top + 14); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // the counter, and the basins cut into it
  rect(ctx, x, base - 44, w, 12, '#dcd6c8');
  rect(ctx, x, base - 44, w, 3, '#f0ece0');
  rect(ctx, x, base - 32, w, 5, '#a8a294');
  const n = Math.max(2, Math.floor(w / 86));
  for (let i = 0; i < n; i++) {
    const cx = x + (w / n) * (i + 0.5);
    ellipsePx(ctx, cx, base - 40, 24, 7, '#c0bcb0');
    ellipsePx(ctx, cx, base - 41, 21, 5, '#8e8a80');
    circle(ctx, cx, base - 41, 2, '#5a5850');
    // the tap and the mixer lever
    rect(ctx, cx - 2, base - 62, 4, 20, P.steelHi);
    rect(ctx, cx - 2, base - 62, 10, 3, P.steelHi);
    rect(ctx, cx + 4, base - 68, 3, 8, '#9aa0aa');
    // the drip, on whichever tap is having a bad night
    if (i === 1) { const d = (t * 0.7) % 1; ctx.globalAlpha = 1 - d; rect(ctx, cx + 6, base - 58 + d * 16, 1, 2, '#bfe0ff'); ctx.globalAlpha = 1; }
    // a toothbrush glass and a bar of soap on alternate basins
    if (i % 2 === 0) { rect(ctx, cx + 28, base - 52, 8, 10, withAlpha('#dff0ff', 0.7)); rect(ctx, cx + 30, base - 58, 2, 8, '#6be585'); }
    else rect(ctx, cx + 28, base - 46, 11, 4, '#e8e0c8');
    // the plumbing under the counter, which nobody bothered to box in
    rect(ctx, cx - 2, base - 27, 4, 14, '#9aa0aa');
    rect(ctx, cx - 6, base - 15, 12, 5, '#7a8088');
  }
  // the amenity baskets, in a row on a shelf above the mirror
  rect(ctx, x + 10, top - 16, w - 20, 5, '#8a7a5a');
  for (let i = 0; i < 4; i++) {
    const bx = x + 20 + i * ((w - 50) / 4);
    rect(ctx, bx, top - 30, 40, 14, '#a88a5e');
    rect(ctx, bx, top - 30, 40, 2, '#c8a878');
    for (let k = 0; k < 5; k++) rect(ctx, bx + 3 + k * 7, top - 34, 5, 6, ['#6be585', '#f2c94c', '#e8503a', '#8ad8ff', '#f4f1ea'][(k + i) % 5]);
    drawText(ctx, ['SOAP', 'RAZOR', 'BRUSH', 'COMB'][i], bx + 20, top - 24, '#3a2f22', { align: 'center', font: 'small' });
  }
  // two hair dryers on curly flex, hung on the end of the run
  for (let i = 0; i < 2; i++) {
    const hx = x + w - 34 + i * 18, hy = base - 96;
    rect(ctx, hx, hy, 12, 7, '#e0dcd2');
    rect(ctx, hx, hy, 12, 2, '#f4f1ea');
    rect(ctx, hx + 3, hy + 7, 5, 9, '#c8c4ba');
    for (let k = 0; k < 8; k++) px(ctx, hx + 5 + Math.sin(k * 1.2) * 3, hy + 16 + k * 2, '#5a5850');
  }
}

// ---------- the towel machine ----------
// Coin-operated, lit, and entirely defeating the tourist standing at it.
function capnTowelMachine(ctx, x, base, w, h, t) {
  const y = base - h;
  ctx.globalAlpha = 0.26; ellipsePx(ctx, x + w / 2, base + 1, w * 0.5, 4, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, y, w, h, '#2f6a8a');
  rect(ctx, x, y, w, 4, '#4a8ab0');
  frame(ctx, x, y, w, h, '#16323f');
  rect(ctx, x + 4, y + 8, w - 8, h * 0.4, '#0d1620');
  ctx.globalAlpha = 0.25; rect(ctx, x + 4, y + 8, w - 8, h * 0.4, '#bfe0ff'); ctx.globalAlpha = 1;
  for (let i = 0; i < 3; i++) rect(ctx, x + 8 + i * ((w - 16) / 3), y + 14, (w - 20) / 3, 14, '#f2eee4');
  // the coin slot, the buttons and the green light that means it is willing
  rect(ctx, x + w - 14, y + h * 0.5, 8, 2, '#c0c6ce');
  for (let i = 0; i < 4; i++) rect(ctx, x + 7 + (i % 2) * 12, y + h * 0.56 + ((i / 2) | 0) * 9, 9, 6, '#c8402c');
  ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3);
  rect(ctx, x + w - 13, y + h * 0.62, 5, 4, '#6be585');
  ctx.globalAlpha = 1;
  rect(ctx, x + 5, base - 16, w - 10, 9, '#1b1b24');
  drawText(ctx, '200', x + w / 2, base - 27, '#ffd24a', { align: 'center', font: 'small' });
}

// ---------- the capsules ----------
// Two rows of moulded plastic shells, stacked, with a steel walkway along the
// upper one and a ladder at the end. Each mouth is a lit rectangle with a
// blind pulled most of the way down, and the number glowing over it.
function capnCapsuleRow(ctx, S, t, x0, x1, base, first, yours) {
  const P = CAPN_PAL;
  const h = 108, pitch = CAPN_ROW_PITCH;
  // the carcass the shells are set into
  rect(ctx, x0 - 10, base - h - 6, (x1 - x0) + 20, h + 6, '#4a4458');
  rect(ctx, x0 - 10, base - h - 6, (x1 - x0) + 20, 3, '#5f5870');
  for (let x = x0; x < x1; x += pitch) {
    const n = first + Math.round((x - x0) / pitch);
    const mine = String(n) === CAPN_NUM;
    const w = pitch - 8;
    // the shell: three tones, with the moulded lip round the mouth
    rect(ctx, x, base - h, w, h, P.podLo);
    rect(ctx, x + 3, base - h + 3, w - 6, h - 8, P.pod);
    rect(ctx, x + 3, base - h + 3, w - 6, 3, P.podHi);
    rect(ctx, x + 3, base - 8, w - 6, 3, darken(P.podLo, 0.2));
    // the mouth, and whatever light is on inside it
    const mx = x + 8, my = base - h + 14, mw = w - 16, mh = h - 30;
    rect(ctx, mx, my, mw, mh, '#14121c');
    const occupied = !mine && (n % 3 !== 1);
    const lit = mine ? (yours ? 1 : 0.55) : (occupied ? 0.14 : 0.3);
    ctx.globalAlpha = lit;
    vgrad(ctx, mx + 1, my + 1, mw - 2, mh - 2, mine ? '#ffe4a8' : '#8a9ab0', '#20202c');
    ctx.globalAlpha = 1;
    // the blind, rolled down as far as its owner wanted it
    const drop = mine ? (yours ? 0.14 : 0.1) : (occupied ? 0.78 + 0.1 * Math.sin(n * 1.7) : 0.06);
    const bh = Math.round(mh * drop);
    if (bh > 1) {
      rect(ctx, mx, my, mw, bh, '#3a3448');
      for (let i = 0; i < bh; i += 4) rect(ctx, mx, my + i, mw, 1, '#2a2538');
      rect(ctx, mx, my + bh - 2, mw, 2, '#5a5470');
    }
    // somebody's feet, or a bag, in the ones that are taken
    if (occupied && bh < mh - 18) {
      rect(ctx, mx + 6, my + mh - 12, 14, 10, '#4a5468');
      rect(ctx, mx + 22, my + mh - 12, 12, 10, '#3f4858');
    }
    // the number plate over the mouth
    const lab = String(n);
    rect(ctx, x + w / 2 - 17, base - h - 4, 34, 15, mine ? '#5a3a10' : '#2a2634');
    frame(ctx, x + w / 2 - 17, base - h - 4, 34, 15, mine ? P.gold : '#3f3a4c');
    ctx.globalAlpha = mine ? 0.7 + 0.3 * Math.sin(t * 2.4) : 1;
    drawText(ctx, lab, x + w / 2, base - h - 1, mine ? P.gold : '#8a84a0', { align: 'center', scale: 2 });
    ctx.globalAlpha = 1;
    // the grab handle and the little step moulded into every one of them
    rect(ctx, x + 6, base - 20, 12, 3, P.podLo);
    if (mine) {
      ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 2.4);
      rect(ctx, x - 4, base - h - 10, w + 8, h + 14, P.gold);
      ctx.globalAlpha = 1;
    }
  }
}
// The walkway along the upper row: steel deck, a rail, and the strip of light
// under it that lands on everybody walking below.
function capnWalkway(ctx, S, t, x0, x1) {
  const P = CAPN_PAL;
  rect(ctx, x0, CAPN_UP, x1 - x0, 12, '#5a606a');
  rect(ctx, x0, CAPN_UP, x1 - x0, 3, '#8a9098');
  for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) rect(ctx, x, CAPN_UP + 3, 11, 7, '#4a5058');
  rect(ctx, x0, CAPN_UP + 12, x1 - x0, 5, '#3a4048');
  ctx.globalAlpha = 0.5; rect(ctx, x0, CAPN_UP + 17, x1 - x0, 2, P.tube); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.07; rect(ctx, x0, CAPN_UP + 19, x1 - x0, 60, P.tube); ctx.globalAlpha = 1;
}
// The rail is on the near side of the walkway, so it belongs in front of
// everything up there, including you. It is at shin height and it has caught
// everybody who has ever stayed here at least once.
function capnWalkRail(ctx, x0, x1) {
  rect(ctx, x0, CAPN_UP - 26, x1 - x0, 4, '#9aa0aa');
  rect(ctx, x0, CAPN_UP - 26, x1 - x0, 1, '#cdd3db');
  rect(ctx, x0, CAPN_UP - 14, x1 - x0, 2, '#6f757e');
  for (let x = Math.floor(x0 / 74) * 74; x < x1; x += 74) {
    rect(ctx, x, CAPN_UP - 26, 4, 28, '#7a8088');
    rect(ctx, x, CAPN_UP - 26, 1, 28, '#a2a8b2');
  }
  // the shadow it drops across the deck, which is what sells it as in front
  ctx.globalAlpha = 0.22;
  rect(ctx, x0, CAPN_UP + 1, x1 - x0, 2, '#000');
  ctx.globalAlpha = 1;
}
// The ladder. Steel, bolted at the top, and it rings when you put a foot on it.
function capnLadder(ctx, x, base, w, t) {
  const top = CAPN_UP - 6;
  rect(ctx, x - w / 2, top, 4, base - top, '#8a9098');
  rect(ctx, x + w / 2 - 4, top, 4, base - top, '#8a9098');
  for (let y = base - 14; y > top; y -= 22) {
    rect(ctx, x - w / 2, y, w, 4, '#b0b6c0');
    rect(ctx, x - w / 2, y, w, 1, '#d8dee6');
    ctx.globalAlpha = 0.2; rect(ctx, x - w / 2, y + 4, w, 1, '#000'); ctx.globalAlpha = 1;
  }
  // the hoop at the top, and the yellow paint on the first rung
  rect(ctx, x - w / 2 - 3, top - 4, w + 6, 4, '#7a8088');
  rect(ctx, x - w / 2, base - 14, w, 4, '#e0b23c');
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x, base + 1, w, 4, '#000'); ctx.globalAlpha = 1;
}

// ---------- the inside of your capsule ----------
// Drawn in screen space, because when you are in it there is no outside. The
// whole shot is one piece of moulded plastic with a light in it, a shelf, a
// mirror the size of a postcard, and a ceiling you could touch without
// straightening your arm.
function capnInside(ctx, S, t, k, st) {
  const P = CAPN_PAL;
  const a = clamp(k, 0, 1);
  const lamp = st.lamp != null ? st.lamp : 1;          // 1 bright, 0.35 dim, 0 off
  const blind = clamp(st.blind || 0, 0, 1);
  ctx.globalAlpha = a;
  // the shell. Flat cream, going darker towards the corners, with the moulded
  // ribs running front to back the way the real ones do.
  rect(ctx, 0, 0, W, H, mixColor(P.podLo, '#12101c', 1 - lamp * 0.85));
  vgrad(ctx, 0, 0, W, H, mixColor(P.podHi, '#1a1824', 1 - lamp), mixColor('#8a8474', '#0e0c16', 1 - lamp));
  // the ceiling, six inches from your face: a band across the top with a rib
  // every so often and one recessed light dead centre
  const ceil = 104;
  rect(ctx, 0, 0, W, ceil, mixColor(P.pod, '#191722', 1 - lamp));
  rect(ctx, 0, ceil - 5, W, 5, mixColor(P.podLo, '#12101c', 1 - lamp));
  for (let x = 40; x < W; x += 96) rect(ctx, x, 0, 4, ceil - 5, mixColor(P.podLo, '#141220', 1 - lamp * 0.9));
  rect(ctx, W / 2 - 54, 16, 108, 16, '#b0aa98');
  ctx.globalAlpha = a * (0.25 + 0.7 * lamp);
  rect(ctx, W / 2 - 50, 19, 100, 10, P.tube);
  ctx.globalAlpha = a * 0.1 * lamp;
  ellipsePx(ctx, W / 2, 150, 300, 160, P.tube);
  ctx.globalAlpha = a;
  // the side walls, angled in, because the shell is a tube and not a box
  ctx.fillStyle = mixColor('#c4bda8', '#141220', 1 - lamp * 0.8);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(130, ceil); ctx.lineTo(130, H); ctx.lineTo(0, H); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - 130, ceil); ctx.lineTo(W - 130, H); ctx.lineTo(W, H); ctx.fill();
  rect(ctx, 130, ceil, 3, H - ceil, mixColor(P.podLo, '#0e0c16', 1 - lamp));
  rect(ctx, W - 133, ceil, 3, H - ceil, mixColor(P.podLo, '#0e0c16', 1 - lamp));

  // ---- the control panel, moulded into the left wall where your hand is
  const cpx = 22, cpy = 208;
  rect(ctx, cpx, cpy, 96, 122, mixColor('#3a3644', '#100e18', 1 - lamp * 0.7));
  rect(ctx, cpx, cpy, 96, 3, '#5a5468');
  frame(ctx, cpx, cpy, 96, 122, '#1a1622');
  const rocker = (i, lab, on) => {
    const ry = cpy + 10 + i * 26;
    rect(ctx, cpx + 8, ry, 34, 18, '#1b1826');
    rect(ctx, cpx + 9, ry + (on ? 9 : 1), 32, 8, on ? '#6be585' : '#6a6478');
    drawText(ctx, lab, cpx + 46, ry + 6, on ? '#cfe8d4' : '#8a84a0', { font: 'small' });
  };
  rocker(0, 'LIGHT', lamp > 0.5);
  rocker(1, 'RADIO', !!st.radio);
  rocker(2, 'ALARM', st.alarm != null);
  // the dial for the radio, with a needle that drifts
  circle(ctx, cpx + 48, cpy + 100, 15, '#1b1826');
  ringPx(ctx, cpx + 48, cpy + 100, 15, '#6a6478');
  const na = -2.2 + (st.radio ? Math.sin(t * 0.4) * 0.5 : 0);
  line(ctx, cpx + 48, cpy + 100, cpx + 48 + Math.cos(na) * 12, cpy + 100 + Math.sin(na) * 12, st.radio ? P.gold : '#5a5468');
  // the speaker grille, three rows of holes in the plastic
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) px(ctx, cpx + 12 + c * 5, cpy + 92 + r * 5, '#241f2e');

  // ---- the shelf on the right: a phone charging, the wristband, glasses
  const sx = W - 190, sy = 250;
  rect(ctx, sx, sy, 150, 8, mixColor('#b6ae9a', '#171522', 1 - lamp));
  rect(ctx, sx, sy, 150, 2, mixColor(P.podHi, '#1d1b28', 1 - lamp));
  rect(ctx, sx + 12, sy - 26, 20, 26, '#1b1b24');
  rect(ctx, sx + 14, sy - 24, 16, 22, '#2a3f5a');
  ctx.globalAlpha = a * (0.4 + 0.5 * Math.sin(t * 1.6));
  rect(ctx, sx + 16, sy - 22, 12, 4, '#6be585');
  ctx.globalAlpha = a;
  // the wristband with your number, curled on the shelf
  ringPx(ctx, sx + 62, sy - 9, 10, '#c8402c');
  ringPx(ctx, sx + 62, sy - 9, 9, '#e8604a');
  drawText(ctx, CAPN_NUM, sx + 62, sy - 12, '#fff2e0', { align: 'center', font: 'small' });
  // a bottle of water, three-quarters gone
  rect(ctx, sx + 100, sy - 30, 11, 30, withAlpha('#dff0ff', 0.55));
  rect(ctx, sx + 100, sy - 14, 11, 14, withAlpha('#9fd8ff', 0.7));
  rect(ctx, sx + 103, sy - 35, 5, 5, '#4a86f7');

  // ---- the mirror, postcard sized, on the right wall above the shelf
  const mx = W - 172, my = 128;
  rect(ctx, mx - 3, my - 3, 104, 84, mixColor('#8a8474', '#15131e', 1 - lamp));
  rect(ctx, mx, my, 98, 78, mixColor('#6e7f88', '#0d0f16', 1 - lamp * 0.9));
  ctx.globalAlpha = a * (0.35 + 0.5 * lamp);
  // you, in it, looking exactly as well as you would expect
  drawBugAt(ctx, S.you.spec, mx + 49, my + 74, { pose: 'idle', scale: 1.5, bounce: 0.35, expr: 'sad' });
  ctx.globalAlpha = a * 0.2;
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(mx + 10, my + 78); ctx.lineTo(mx + 26, my + 78); ctx.lineTo(mx + 66, my); ctx.lineTo(mx + 50, my); ctx.fill();
  ctx.globalAlpha = a;
  frame(ctx, mx, my, 98, 78, '#3a3444');

  // ---- the foot end: the blind, and the corridor on the other side of it
  const fx = 236, fw = W - 472, fy = 150, fh = 250;
  rect(ctx, fx - 8, fy - 8, fw + 16, fh + 16, mixColor('#b6ae9a', '#171522', 1 - lamp));
  rect(ctx, fx, fy, fw, fh, '#0d0c14');
  // what is out there: the walkway light, and the row opposite
  ctx.globalAlpha = a * 0.55;
  rect(ctx, fx, fy, fw, fh, '#272232');
  rect(ctx, fx + 20, fy + 40, fw - 40, 120, '#1a1724');
  rect(ctx, fx + 20, fy + 40, fw - 40, 4, '#3e3850');
  ctx.globalAlpha = a * 0.3;
  rect(ctx, fx, fy + fh - 40, fw, 40, CAPN_PAL.tube);
  ctx.globalAlpha = a;
  // the blind itself, slats, pulled down by however much you pulled it
  const bh = Math.round(fh * blind);
  if (bh > 0) {
    rect(ctx, fx, fy, fw, bh, mixColor('#4a4458', '#1a1622', 1 - lamp * 0.6));
    for (let i = 0; i < bh; i += 6) rect(ctx, fx, fy + i, fw, 1, '#332e40');
    rect(ctx, fx, fy + bh - 3, fw, 3, '#6a6478');
    rect(ctx, fx + fw / 2 - 12, fy + bh, 24, 6, '#6a6478');
  }
  // the pillow and the edge of the duvet, along the very bottom of the frame
  rect(ctx, 0, H - 58, W, 58, mixColor('#4a5a7a', '#14131e', 1 - lamp * 0.8));
  rect(ctx, 0, H - 58, W, 3, mixColor('#6a7f9e', '#1d1c2a', 1 - lamp));
  ellipsePx(ctx, W / 2, H - 22, 210, 34, mixColor('#e8e4da', '#1f1d29', 1 - lamp * 0.9));
  ellipsePx(ctx, W / 2, H - 28, 190, 24, mixColor('#f4f1ea', '#23212e', 1 - lamp * 0.9));
  // a coat hook and a socket, because a room is made of the small fittings
  rect(ctx, 150, 180, 6, 14, '#9a9382'); rect(ctx, 146, 178, 14, 4, '#9a9382');
  rect(ctx, W - 160, 350, 20, 16, '#c4bda8'); rect(ctx, W - 155, 355, 4, 6, '#2a2634'); rect(ctx, W - 149, 355, 4, 6, '#2a2634');
  ctx.globalAlpha = 1;
}

// ---------- brushing your teeth ----------
// Twenty-odd seconds of a thing you do every night without thinking about it,
// which is exactly why it is worth making you think about it. A metronome
// swings; you sweep with it, not faster; you do the top row and the bottom
// row. Going at it like a madman gets you nothing. You may leave after ten
// seconds and the game will not stop you, but it will notice.
class CapsuleBrushGame {
  constructor(spec, opts) {
    const o = opts || {};
    this.spec = spec;
    this.t = 0; this.dur = o.dur || 23; this.hz = 0.62;
    this.bx = 0; this.vx = 0; this.row = 0;
    this.keys = new Set(); this.drag = null;
    this.teeth = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) this.teeth.push({ r: r, x: -0.86 + i * 0.215, clean: 0 });
    this.streak = 0; this.best = 0; this.stillT = 0; this.tick = -1;
    this.warn = ''; this.warnT = 0;
    this.foam = [];
    this.over = false; this.skipped = false; this.score = 0; this.endT = 0; this.done = false;
    this.switches = 0;
  }
  get metX() { return Math.sin(this.t * this.hz * Math.PI * 2); }
  get metV() { return Math.cos(this.t * this.hz * Math.PI * 2); }
  get meter() { let s = 0; for (let i = 0; i < this.teeth.length; i++) s += this.teeth[i].clean; return s / this.teeth.length; }
  get canSkip() { return this.t >= 10; }

  finish(skipped) {
    if (this.over) return;
    this.over = true; this.skipped = !!skipped; this.score = this.meter;
    Audio.ui(skipped ? 'back' : (this.score > 0.75 ? 'levelup' : 'select'));
  }
  key(code) {
    if (this.over) { if (['Enter', 'Space', 'KeyZ', 'KeyX', 'Escape'].indexOf(code) >= 0) this.done = true; return; }
    if (code === 'Escape' || code === 'KeyX') {
      if (this.canSkip) this.finish(true);
      else { this.warn = 'TEN SECONDS. THAT IS THE DEAL.'; this.warnT = 1.2; Audio.ui('error'); }
      return;
    }
    if (code === 'ArrowUp' || code === 'KeyW') { if (this.row !== 0) { this.row = 0; this.switches++; Audio.ui('move'); } return; }
    if (code === 'ArrowDown' || code === 'KeyS') { if (this.row !== 1) { this.row = 1; this.switches++; Audio.ui('move'); } return; }
    this.keys.add(code);
  }
  keyUp(code) { this.keys.delete(code); }
  // the mouth sits in a known box, so a drag maps straight onto it
  pointerDown(x, y, id) {
    if (this.over) { this.done = true; return; }
    if (this.canSkip && x > W - 132 && y > H - 44) { this.finish(true); return; }
    this.row = y > 300 ? 1 : 0;
    this.drag = clamp((x - W / 2) / 240, -1, 1);
  }
  pointerMove(x, y, id) { if (this.drag != null) this.drag = clamp((x - W / 2) / 240, -1, 1); }
  pointerUp() { this.drag = null; }

  update(dt) {
    if (this.over) { this.endT += dt; return; }
    this.t += dt;
    this.warnT = Math.max(0, this.warnT - dt);
    // the metronome's own click, twice a cycle, so you have something to be late for
    const n = Math.floor(this.t * this.hz * 2);
    if (n !== this.tick) { this.tick = n; Audio.ui('tick'); }
    // input
    let ax = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) ax -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) ax += 1;
    if (this.drag != null) ax = clamp((this.drag - this.bx) * 5, -1, 1);
    this.vx += (ax * 1.9 - this.vx) * Math.min(1, dt * 9);
    this.bx += this.vx * dt;
    if (this.bx < -1) { this.bx = -1; this.vx *= -0.2; }
    if (this.bx > 1) { this.bx = 1; this.vx *= -0.2; }
    const sp = Math.abs(this.vx);
    const withIt = sp > 0.35 && Math.abs(this.metV) > 0.25 && Math.sign(this.vx) === Math.sign(this.metV);
    let gain = 0;
    if (sp > 2.55) {
      gain = 0.25; this.streak = 0;
      if (this.warnT <= 0) { this.warn = 'EASY. IT IS NOT A RACE.'; this.warnT = 0.9; }
    } else if (sp < 0.16) {
      this.stillT += dt;
      if (this.stillT > 0.45) { this.streak = 0; if (this.warnT <= 0) { this.warn = 'KEEP GOING.'; this.warnT = 0.7; } }
    } else {
      this.stillT = 0;
      gain = withIt ? 1.0 : 0.52;
      if (withIt) { this.streak += dt; this.best = Math.max(this.best, this.streak); }
      else this.streak = Math.max(0, this.streak - dt * 0.7);
    }
    // the brushing itself: whatever is under the head, on the row you are on
    if (gain > 0) {
      for (let i = 0; i < this.teeth.length; i++) {
        const T = this.teeth[i];
        if (T.r !== this.row) continue;
        const d = Math.abs(T.x - this.bx);
        if (d > 0.19) continue;
        T.clean = Math.min(1, T.clean + gain * dt * 1.15 * (1 - d / 0.24));
      }
      // foam, which is the only evidence any of this is happening
      if (Math.random() < dt * 26) this.foam.push({ x: this.bx + (Math.random() - 0.5) * 0.14, y: (Math.random() - 0.5) * 12, r: this.row, t: 0, life: 0.6 + Math.random() * 0.7 });
    }
    for (let i = 0; i < this.foam.length; i++) { this.foam[i].t += dt; this.foam[i].y += dt * 14; }
    this.foam = this.foam.filter(f => f.t < f.life);
    if (this.t >= this.dur) this.finish(false);
  }

  rating() {
    if (this.skipped) return 'YOU SPAT, LOOKED AT YOURSELF, AND LEFT.';
    if (this.score >= 0.92) return 'A DENTIST WOULD WEEP.';
    if (this.score >= 0.75) return 'CLEAN ENOUGH.';
    if (this.score >= 0.5) return 'CLEAN-ISH. THE BACK ONES KNOW.';
    return 'YOU RINSED. THAT IS NOT THE SAME THING.';
  }

  // ---- drawing
  draw(ctx) {
    const t = this.t, P = CAPN_PAL;
    // the washroom goes away and it is just you and the mirror
    rect(ctx, 0, 0, W, H, 'rgba(8,8,14,0.82)');
    vignette(ctx, 0.5, '#05040a');
    drawText(ctx, 'BRUSH YOUR TEETH', 20, 18, P.cream, { scale: 2 });
    drawText(ctx, 'LEFT / RIGHT WITH THE BAR.  UP AND DOWN SWAPS ROWS.', 20, 40, withAlpha(P.cream, 0.5), { font: 'small' });
    this.drawMouth(ctx, W / 2, 268, t);
    this.drawMetronome(ctx, W / 2, 452, t);
    // the meter, filling from nothing, the whole point of the exercise
    const m = this.meter;
    drawText(ctx, 'CLEAN', 20, H - 74, withAlpha(P.cream, 0.6), { font: 'small' });
    uiBar(ctx, 20, H - 64, 200, 14, m, m > 0.75 ? P.green : m > 0.4 ? '#f2c94c' : '#c8402c', { segments: 4 });
    drawText(ctx, Math.round(m * 100) + '%', 228, H - 62, P.cream, { scale: 2 });
    // the clock running down, and the streak you are or are not holding
    const left = Math.max(0, this.dur - t);
    drawText(ctx, 'TIME', W - 210, H - 74, withAlpha(P.cream, 0.6), { align: 'right', font: 'small' });
    uiBar(ctx, W - 202, H - 64, 180, 14, left / this.dur, '#8ad8ff');
    if (this.streak > 1.2) {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8);
      drawText(ctx, 'IN TIME  x' + (1 + Math.floor(this.streak / 2)), W / 2, 96, P.green, { align: 'center', scale: 2, outline: '#0d2016' });
      ctx.globalAlpha = 1;
    }
    if (this.warnT > 0) {
      ctx.globalAlpha = clamp(this.warnT * 2, 0, 1);
      drawText(ctx, this.warn, W / 2, 120, '#f2c94c', { align: 'center', scale: 2, outline: '#2a1f08' });
      ctx.globalAlpha = 1;
    }
    // the way out, once the game is willing to admit there is one
    if (this.canSkip && !this.over) {
      ctx.globalAlpha = 0.72;
      rect(ctx, W - 132, H - 40, 112, 24, '#241f2e');
      frame(ctx, W - 132, H - 40, 112, 24, '#5a5468');
      drawText(ctx, Game.touch ? 'THAT WILL DO' : 'ESC: ENOUGH', W - 76, H - 34, '#9a93b0', { align: 'center', font: 'small' });
      ctx.globalAlpha = 1;
    }
    if (this.over) this.drawResult(ctx);
  }

  drawMouth(ctx, cx, cy, t) {
    const P = CAPN_PAL, hw = 250, hh = 112;
    // the lips: a dark ring with a lit top edge, the way a mouth reads at size
    ellipsePx(ctx, cx, cy, hw + 16, hh + 14, '#6a2a30');
    ellipsePx(ctx, cx, cy - 2, hw + 12, hh + 8, '#8a3a40');
    ellipsePx(ctx, cx, cy, hw, hh, '#2a0f14');
    ctx.globalAlpha = 0.25; ellipsePx(ctx, cx, cy - hh * 0.72, hw * 0.7, 10, '#e0808a'); ctx.globalAlpha = 1;
    // the dark of the back of it, and the tongue sitting in the bottom
    ellipsePx(ctx, cx, cy + 16, hw * 0.74, hh * 0.58, '#1a0810');
    ellipsePx(ctx, cx, cy + hh * 0.52, hw * 0.62, hh * 0.34, '#b8545e');
    ellipsePx(ctx, cx, cy + hh * 0.48, hw * 0.54, hh * 0.26, '#cc6670');
    rect(ctx, cx - 1, cy + hh * 0.3, 2, hh * 0.32, '#9a3f4a');
    // gums, then the teeth themselves, top row hanging, bottom row standing
    for (let r = 0; r < 2; r++) {
      const gy = r === 0 ? cy - hh * 0.64 : cy + hh * 0.2;
      ellipsePx(ctx, cx, gy + (r === 0 ? 6 : 6), hw * 0.9, 22, '#b04a56');
      ellipsePx(ctx, cx, gy + (r === 0 ? 4 : 8), hw * 0.86, 18, '#c85c68');
    }
    for (let i = 0; i < this.teeth.length; i++) {
      const T = this.teeth[i];
      const tx = cx + T.x * (hw * 0.86);
      const ty = T.r === 0 ? cy - hh * 0.58 : cy + hh * 0.2;
      const tw = 40, th = 34;
      const col = mixColor('#c9bd86', '#fbf8ef', T.clean);
      rect(ctx, tx - tw / 2, ty, tw, th, col);
      // the lit face and the shadowed bottom, so it is not a flat white brick
      rect(ctx, tx - tw / 2, ty + (T.r === 0 ? 0 : 0), tw, 4, lighten(col, 0.22));
      rect(ctx, tx - tw / 2, ty + th - 4, tw, 4, darken(col, 0.2));
      rect(ctx, tx - tw / 2, ty, 3, th, darken(col, 0.12));
      rect(ctx, tx + tw / 2 - 3, ty, 3, th, darken(col, 0.16));
      // a plaque smear on whatever is still dirty, and a twinkle when it is not
      if (T.clean < 0.7) {
        ctx.globalAlpha = 0.5 * (1 - T.clean);
        rect(ctx, tx - tw / 2 + 4, ty + (T.r === 0 ? th - 12 : 4), tw - 8, 8, '#9a8c4a');
        ctx.globalAlpha = 1;
      }
      if (T.clean > 0.95) {
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + i);
        rect(ctx, tx - 6, ty + 8, 5, 1, '#ffffff'); rect(ctx, tx - 4, ty + 6, 1, 5, '#ffffff');
        ctx.globalAlpha = 1;
      }
    }
    // the foam, sitting where it was left
    for (let i = 0; i < this.foam.length; i++) {
      const f = this.foam[i];
      const fx = cx + f.x * (hw * 0.86), fy = (f.r === 0 ? cy - hh * 0.58 + 16 : cy + hh * 0.2 + 16) + f.y;
      ctx.globalAlpha = clamp(1 - f.t / f.life, 0, 1) * 0.9;
      rect(ctx, fx, fy, 3, 3, '#f4f8ff');
      ctx.globalAlpha = 1;
    }
    // the brush, held at the angle everybody holds one
    const bx = cx + this.bx * (hw * 0.86);
    const by = this.row === 0 ? cy - hh * 0.58 + 18 : cy + hh * 0.2 + 16;
    const tilt = clamp(this.vx * 0.12, -0.35, 0.35);
    ctx.save();
    ctx.translate(Math.round(bx), Math.round(by));
    ctx.rotate(tilt);
    rect(ctx, -26, -6, 52, 9, '#e8e4dc');                    // the head
    rect(ctx, -26, -6, 52, 3, '#ffffff');
    for (let i = 0; i < 9; i++) rect(ctx, -24 + i * 6, this.row === 0 ? -14 : 3, 4, 9, '#bfe0ff');
    rect(ctx, 24, -5, 90, 7, '#4a86f7');                     // the handle, off to the right
    rect(ctx, 24, -5, 90, 2, '#7fb0ff');
    rect(ctx, 104, -7, 12, 11, '#2f5ac0');
    ctx.restore();
    // a little pressure glow when you are on the beat
    if (this.streak > 0.8) {
      ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 9);
      ellipsePx(ctx, bx, by, 60, 34, CAPN_PAL.green);
      ctx.globalAlpha = 1;
    }
    // which row you are on, said plainly, because it matters
    drawText(ctx, this.row === 0 ? 'UPPER' : 'LOWER', cx - hw - 26, cy - 6, withAlpha(P.cream, 0.7), { align: 'right', scale: 2 });
    // and you, in the mirror over the basin, doing this in a foreign country
    const mvx = W - 104;
    rect(ctx, mvx - 40, 62, 84, 96, '#3a4048');
    rect(ctx, mvx - 37, 65, 78, 90, '#61757e');
    ctx.globalAlpha = 0.75;
    drawBugAt(ctx, this.spec, mvx, 152, { pose: this.streak > 1 ? 'play' : 'idle', scale: 1.5, bounce: 0.4, phase: 1.2 });
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.moveTo(mvx - 30, 155); ctx.lineTo(mvx - 16, 155); ctx.lineTo(mvx + 24, 65); ctx.lineTo(mvx + 10, 65); ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawMetronome(ctx, cx, y, t) {
    const P = CAPN_PAL, w = 520;
    rect(ctx, cx - w / 2, y, w, 22, '#1b1826');
    frame(ctx, cx - w / 2, y, w, 22, '#4a4460');
    // the beat marks, so you can see the ends it is swinging between
    for (let i = 0; i <= 8; i++) rect(ctx, cx - w / 2 + (w / 8) * i, y + 2, 1, 18, '#332e44');
    // where the brush actually is, as a ghost, under the ball
    rect(ctx, cx + this.bx * (w / 2 - 14) - 8, y + 4, 16, 14, withAlpha('#8ad8ff', 0.35));
    // the ball
    const mx = cx + this.metX * (w / 2 - 14);
    const good = Math.sign(this.vx) === Math.sign(this.metV) && Math.abs(this.vx) > 0.35;
    rect(ctx, mx - 6, y + 3, 12, 16, good ? P.green : P.gold);
    rect(ctx, mx - 6, y + 3, 12, 3, '#ffffff');
    // the arrow saying which way it is going right now
    ctx.fillStyle = good ? P.green : P.gold;
    const d = Math.sign(this.metV) || 1;
    ctx.beginPath();
    ctx.moveTo(mx + d * 22, y + 11); ctx.lineTo(mx + d * 10, y + 4); ctx.lineTo(mx + d * 10, y + 18); ctx.fill();
    drawText(ctx, 'GO WITH THE BAR', cx, y + 28, withAlpha(P.cream, 0.4), { align: 'center', font: 'small' });
  }

  drawResult(ctx) {
    const a = clamp(this.endT * 2.4, 0, 1);
    ctx.globalAlpha = a * 0.7; rect(ctx, 0, 0, W, H, '#0a0812'); ctx.globalAlpha = a;
    const w = 460, h = 168, x = W / 2 - w / 2, y = H / 2 - h / 2;
    uiPanel(ctx, x, y, w, h, { color: '#1b2230' });
    drawText(ctx, Math.round(this.score * 100) + '%', W / 2, y + 22, this.score > 0.75 ? '#2f7a4a' : '#b0521c', { align: 'center', scale: 5 });
    drawText(ctx, this.rating(), W / 2, y + 74, CAPN_PAL.ink, { align: 'center', scale: 2 });
    if (this.skipped) drawText(ctx, 'THE MIRROR SAW ALL OF IT.', W / 2, y + 98, '#8a5a3a', { align: 'center', font: 'small' });
    else drawText(ctx, 'BEST STREAK ' + this.best.toFixed(1) + 'S  -  ' + this.switches + ' ROW SWAPS', W / 2, y + 98, '#6a6478', { align: 'center', font: 'small' });
    ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(this.endT * 5));
    drawText(ctx, Game.touch ? 'TAP' : 'PRESS Z', W / 2, y + h - 26, '#5a5468', { align: 'center', scale: 2 });
    ctx.globalAlpha = 1;
  }
}

// ---------- what is in the building ----------
function capnProps() {
  const P = [];
  // the sliding door you came in by, with the cold street still behind it
  P.push({ kind: 'capnentry', x: 74, w: 96, h: 156, floor: 1, label: 'LOOK BACK OUT', act: 'out', reach: 46 });
  // the desk. The counter is drawn after the clerk so he is behind it.
  P.push({ kind: 'capndesk', x: 300, w: 220, h: 78, floor: 1, solid: false, reach: 30, label: 'CHECK IN', act: 'checkin' });
  // the bell lives at the far end of the counter and has to beat the desk on
  // distance to be offered at all, which is why it is out here on its own
  P.push({ kind: 'capnbell', x: 400, w: 40, h: 16, floor: 1, y: 362, label: 'RING THE BELL', act: 'bell', reach: 30 });
  P.push({ kind: 'capnrules', x: 486, w: 78, h: 100, floor: 1, y: 330, label: 'READ THE RULES', act: 'rules', reach: 40 });
  // shoes, then bag, in that order, because that is the order
  P.push({ kind: 'capnshoe', x: 600, w: 200, h: 118, floor: 1, label: 'SHOES OFF', act: 'shoes', reach: 66 });
  P.push({ kind: 'capnlock', x: 830, w: 190, h: 148, floor: 1, label: 'LOCKER ' + CAPN_NUM, act: 'locker', reach: 72 });
  // the lounge nobody is using except the one man who never left it
  P.push({ kind: 'plant', x: 960, w: 40, h: 56, floor: 1 });
  P.push({ kind: 'capnchair', x: 1030, w: 76, h: 62, floor: 1 });
  P.push({ kind: 'capntvset', x: 1120, w: 92, h: 66, floor: 1, y: 324, over: true, label: 'WATCH IT FOR A SECOND', act: 'tv', reach: 60 });
  P.push({ kind: 'vending', x: 1240, w: 62, h: 104, floor: 1, label: 'HOT CAN OF COFFEE', act: 'vend' });
  P.push({ kind: 'bin', x: 1300, w: 26, h: 32, floor: 1 });
  P.push({ kind: 'fireext', x: 1330, w: 14, h: 34, floor: 1, y: 402 });
  P.push({ kind: 'capnsign', x: 1400, w: 190, h: 30, floor: 1, y: 236, over: true, text: 'BATH   CAPSULES', arrow: 1 });
  P.push({ kind: 'poster', x: 1418, w: 46, h: 62, floor: 1, y: 356, col: '#2f6a8a' });
  // the washroom
  P.push({ kind: 'capnsinks', x: 1570, w: 280, h: 150, floor: 1, label: 'BRUSH YOUR TEETH', act: 'brush', reach: 84 });
  P.push({ kind: 'capntowel', x: 1752, w: 56, h: 92, floor: 1, label: 'TOWEL MACHINE', act: 'towel', reach: 42 });
  P.push({ kind: 'capnbath', x: 1866, w: 110, h: 132, floor: 1, label: 'THE BATH', act: 'bath', reach: 54 });
  // up. ride() drops you at x + dir * (w/2 + 24), so the two ends of the
  // ladder are placed to hand you to each other and nowhere else.
  P.push({ kind: 'capnladder', x: 1976, w: 44, h: 146, floor: 1, toFloor: 0, dir: 1, rideTime: 1.8, label: 'UP THE LADDER', act: 'ladder', reach: 52 });
  P.push({ kind: 'capnladder', x: 2022, w: 44, h: 62, floor: 0, toFloor: 1, dir: -1, rideTime: 1.8, label: 'DOWN', act: 'ladder', reach: 52 });
  // the capsules you can stand at, placed off the same numbers the shells are
  // painted with: three that are somebody else's, and the one that is yours
  for (let n = CAPN_ROW_UP1; n < CAPN_ROW_UP1 + CAPN_ROW_N; n++) {
    const mine = String(n) === CAPN_NUM;
    P.push({
      kind: 'capnpod', x: capnPodX(n), w: 70, h: 118, floor: 0, num: n, mine: mine,
      label: mine ? 'CAPSULE ' + CAPN_NUM : 'SOMEBODY ELSE',
      act: mine ? 'capsule' : 'notyours', reach: mine ? 46 : 32,
    });
  }
  // fences: you cannot walk off either end of the walkway, and the corridor
  // below stops where the lower row of shells starts, because they are a wall
  P.push({ kind: 'blank', x: 1996, w: 26, h: 10, floor: 0, solid: true, hidden: true });
  P.push({ kind: 'blank', x: CAPN_ROW_X1 - 2, w: 30, h: 10, floor: 0, solid: true, hidden: true });
  P.push({ kind: 'blank', x: CAPN_ROW_X0 - 10, w: 30, h: 10, floor: 1, solid: true, hidden: true });
  return P;
}

function capnNpcs() {
  return [
    // the night clerk, awake because this is simply when he works
    {
      name: 'NIGHT CLERK', x: 330, floor: 1, y: 436, scale: 1.45, voice: 'clerk',
      act: 'checkin', pose: 'idle', tag: 'YOU NEED KEY FIRST.',
    },
    // the man who has been in that chair since the news finished
    {
      name: 'THE MAN IN THE CHAIR', x: 1030, floor: 1, y: 420, scale: 1.4, voice: 'oldman', pose: 'sad',
      tag: ['...', 'HE IS NOT ASLEEP.', 'HE IS WATCHING IT ON MUTE.', 'YOU LEAVE HIM TO IT.'],
    },
    // somebody in the corridor being quiet at a phone, badly
    {
      name: 'A BUG ON THE PHONE', x: 1370, floor: 1, scale: 1.4, voice: 'you', carry: 'phone',
      walk: [1344, 1400], speed: 9,
      tag: ['NO. NO, I GOT IN. I GOT IN FINE.', 'IT IS TWO IN THE MORNING HERE.', 'NO, I AM NOT CRYING. IT IS THE FAN.'],
    },
    // the salaryman, eyes shut, doing this on autopilot
    {
      name: 'SALARYMAN', x: 1494, floor: 1, scale: 1.45, voice: 'guard', pose: 'play',
      tag: ['...', 'HIS EYES ARE SHUT.', 'HE HAS DONE THIS NINE THOUSAND TIMES.', 'HE COULD DO IT DEAD.'],
    },
    // and the tourist, losing to a machine
    {
      name: 'TOURIST', x: 1716, floor: 1, scale: 1.4, voice: 'kid',
      tag: ['IT ATE MY COIN.', 'IT ATE MY COIN AND SAID THANK YOU.', 'I HAVE A DEGREE.'],
    },
  ];
}

// ---------- the scene ----------
function capsuleNightDef() {
  const P = CAPN_PAL;
  return {
    name: 'CAPSULE HOTEL - 2AM',
    sub: 'SHOES OFF. VOICES DOWN.',
    tint: '#3a2f5a',
    w: CAPN_W, zoom: 1, yBias: 0.62, heroScale: 1.6,
    hud: false, canLeave: false, freeFloors: false,
    carry: 'suitcase',
    start: { x: 150, floor: 1 },
    floors: [{ y: CAPN_UP, z: 0.9 }, { y: CAPN_DOWN, z: 1 }],
    enterLine: 'THE DOOR SLIDES SHUT. IT IS WARM IN HERE.',
    props: capnProps(),
    npcs: capnNpcs(),

    init: function (S) {
      S.step = 0;                      // 0 desk, 1 shoes, 2 locker, 3 wash, 4 capsule, 5 done
      S.capShoes = true;               // still wearing them
      S.capTowel = false;
      S.capKey = false;
      S.capBrushed = -1;               // -1 not done, else the score
      S.capSkipped = false;
      S.brush = null;
      S.capIn = null;                  // the view from inside the capsule
      S.night = null;                  // the night pass
      S.copyT = 0;                     // the photocopier flash
      S.bellT = 0;
      S.capNights = 0;
      S.capOwed = 0;                   // what the book says you still owe
      if (S.capnRelabel) S.capnRelabel(S);
      Voice.chime('shop');
    },

    // ---- a lobby at night is not lit by the sky, it is lit by tubes
    sky: function (ctx, S, t) {
      vgrad(ctx, 0, 0, W, H, '#191527', '#0d0b14');
    },

    mid: function (ctx, S, t) {
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      capnShell(ctx, S, t, x0, x1);
      // ---- the street, seen through the entrance glass. Blue, and a long
      // way away already.
      if (S.cam.visible(74, 260)) {
        rect(ctx, 10, 284, 130, 156, '#0e1626');
        ctx.globalAlpha = 0.5; vgrad(ctx, 10, 284, 130, 156, '#2a3f68', '#0a1020'); ctx.globalAlpha = 1;
        for (let i = 0; i < 5; i++) rect(ctx, 16 + i * 26, 300 + (i % 3) * 20, 18, 60, '#16223a');
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 1.3);
        rect(ctx, 96, 306, 6, 30, '#e8503a'); rect(ctx, 44, 322, 5, 22, '#8ad8ff');
        ctx.globalAlpha = 1;
        // rain on the glass, which you did not notice on the way in
        const r = makeRng(3311);
        for (let i = 0; i < 40; i++) {
          const rx = 12 + r.range(0, 126), ry = 286 + ((r.range(0, 150) + t * 40) % 150);
          ctx.globalAlpha = 0.3; rect(ctx, rx, ry, 1, 4, '#bfe0ff'); ctx.globalAlpha = 1;
        }
      }
      // ---- behind the desk: the key rack, the fan, the little TV, the sweets
      if (S.cam.visible(300, 420)) {
        rect(ctx, 180, 300, 250, 140, '#342e44');
        rect(ctx, 180, 300, 250, 3, '#463f58');
        capnKeyRack(ctx, 196, 312, 132, 74, t, S.capKey);
        // the jar of sweets, on a shelf, free, nobody takes one
        rect(ctx, 344, 384, 34, 4, P.woodLo);
        rect(ctx, 350, 360, 22, 24, withAlpha('#dff0ff', 0.55));
        for (let i = 0; i < 7; i++) rect(ctx, 353 + (i % 3) * 6, 368 + ((i / 3) | 0) * 6, 5, 5, ['#e8503a', '#6be585', '#f2c94c', '#8ad8ff'][i % 4]);
        rect(ctx, 350, 356, 22, 5, '#c8402c');
        // the small television, on mute, showing a talk show to nobody
        capnTv(ctx, 344, 306, 70, 46, t, true);
        // the photocopier, which is the loudest object in the building
        rect(ctx, 196, 396, 64, 44, '#c8c4ba');
        rect(ctx, 196, 396, 64, 4, '#e8e4dc');
        rect(ctx, 200, 402, 56, 10, '#2a2d33');
        ctx.globalAlpha = clamp(S.copyT * 3, 0, 1) * (Math.sin(t * 40) > 0 ? 1 : 0.4);
        rect(ctx, 200, 402, 56, 10, '#ffffff');
        ctx.globalAlpha = 1;
        rect(ctx, 204, 416, 40, 12, '#9a968c');
        // the fan, on the end of the desk, sweeping nothing at nobody
        capnFan(ctx, 420, 440, 1, t);
      }
      // ---- the corridor wall: a clock that is telling the truth for once
      if (S.cam.visible(700, 300)) {
        circle(ctx, 700, 250, 26, '#e8e4da');
        ringPx(ctx, 700, 250, 26, '#2a2f3a');
        ringPx(ctx, 700, 250, 25, '#b8b2a6');
        for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; rect(ctx, 700 + Math.cos(a) * 20 - 1, 250 + Math.sin(a) * 20 - 1, 2, 2, '#4a4f58'); }
        const ha = (2 / 12) * Math.PI * 2 - Math.PI / 2, ma = (6 / 60) * Math.PI * 2 - Math.PI / 2;
        line(ctx, 700, 250, 700 + Math.cos(ha) * 11, 250 + Math.sin(ha) * 11, '#241d28');
        line(ctx, 700, 250, 700 + Math.cos(ma) * 19, 250 + Math.sin(ma) * 19, '#241d28');
        line(ctx, 700, 250, 700 + Math.cos(t * 0.1047 - Math.PI / 2) * 21, 250 + Math.sin(t * 0.1047 - Math.PI / 2) * 21, '#c8402c');
        circle(ctx, 700, 250, 2, '#241d28');
        drawText(ctx, '02:06', 700, 286, withAlpha(P.cream, 0.4), { align: 'center', font: 'small' });
      }
      // ---- the bath, behind its noren, steaming quietly to itself
      if (S.cam.visible(1866, 260)) {
        rect(ctx, 1810, 306, 112, 134, '#13202a');
        ctx.globalAlpha = 0.4; vgrad(ctx, 1810, 306, 112, 134, '#4a7a8a', '#0d1620'); ctx.globalAlpha = 1;
        for (let i = 0; i < 4; i++) {
          const sy = 440 - ((t * 16 + i * 34) % 134);
          ctx.globalAlpha = 0.12 * clamp((sy - 300) / 60, 0, 1);
          ellipsePx(ctx, 1840 + Math.sin(t * 0.7 + i) * 18, sy, 26, 12, '#dff0ff');
          ctx.globalAlpha = 1;
        }
      }
      // ---- the floor, last, so everything above sits on it
      capnFloor(ctx, S, t, x0, x1);
      // ---- the capsule block: the lower row is part of the wall down here,
      // the upper row is the floor you climb to
      if (S.cam.visible(2200, 500)) {
        capnCapsuleRow(ctx, S, t, CAPN_ROW_X0, CAPN_ROW_X1, CAPN_DOWN, 111, false);
        capnCapsuleRow(ctx, S, t, CAPN_ROW_X0, CAPN_ROW_X1, CAPN_UP, CAPN_ROW_UP1, S.step >= 4);
        // the deck and its rail go on last, in front of the shells, or the
        // rail disappears behind them and the walkway reads as a shelf
        capnWalkway(ctx, S, t, 1944, CAPN_ROW_X1 + 14);
      }
    },

    fore: function (ctx, S, t) {
      // the near pillar that crops the frame, and the steam drifting out of
      // the washroom across everything in front of it
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      for (let x = Math.floor(x0 / 1180) * 1180; x < x1; x += 1180) {
        ctx.globalAlpha = 0.95;
        rect(ctx, x + 520, 60, 34, 520, '#1d1926');
        rect(ctx, x + 520, 60, 6, 520, '#2e2839');
        rect(ctx, x + 548, 60, 6, 520, '#15121d');
        ctx.globalAlpha = 1;
      }
      // the walkway rail crosses in front of whoever is up there
      if (S.cam.visible(2200, 500)) capnWalkRail(ctx, 1944, CAPN_ROW_X1 + 14);
      if (S.cam.visible(1800, 500)) {
        for (let i = 0; i < 6; i++) {
          const sx = 1700 + ((t * 9 + i * 60) % 260);
          ctx.globalAlpha = 0.05;
          ellipsePx(ctx, sx, 380 - Math.sin(t * 0.4 + i) * 20, 40, 22, '#dff0ff');
          ctx.globalAlpha = 1;
        }
      }
    },

    after: function (ctx, S, t) {
      // the building at two in the morning is warm and slightly green
      grade(ctx, 0, 0, W, H, '#3a4a3a', 0.05);
      vignette(ctx, 0.42, '#07060d');
      // once you are inside the capsule, that is the whole picture
      if (S.capIn) capnInside(ctx, S, t, S.capIn.k, S.capIn);
      // and once you are asleep, it is not a picture at all for a while
      if (S.night) capnNightWash(ctx, S, t);
    },

    overlay: function (ctx, S, t) {
      capnObjective(ctx, S, t);
      if (S.night) capnNightLines(ctx, S, t);
      if (S.brush) S.brush.draw(ctx);
    },

    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'capnentry': {
          // the sliding doors, shut, with the rain on the far side of them
          const x = p.x - p.w / 2, y = base - p.h;
          rect(ctx, x - 6, y - 8, p.w + 12, p.h + 8, '#3a3444');
          rect(ctx, x - 6, y - 8, p.w + 12, 4, '#524b62');
          rect(ctx, x, y, p.w, p.h, '#1b2230');
          ctx.globalAlpha = 0.22; rect(ctx, x + 2, y + 2, p.w - 4, p.h - 4, '#bfe0ff'); ctx.globalAlpha = 1;
          rect(ctx, x + p.w / 2 - 2, y, 4, p.h, '#6a7280');
          rect(ctx, x, y + p.h - 26, p.w, 4, '#6a7280');
          rect(ctx, x, y + 40, p.w, 4, '#6a7280');
          // the hours, and the little sticker nobody has scraped off
          rect(ctx, x + 8, y + 52, 40, 22, '#12101c');
          drawText(ctx, '24H', x + 28, y + 58, CAPN_PAL.green, { align: 'center', scale: 2 });
          rect(ctx, x + p.w - 30, y + 90, 18, 14, '#c8402c');
          ctx.globalAlpha = 0.12; rect(ctx, x, y, p.w, p.h, '#2a3f68'); ctx.globalAlpha = 1;
          return true;
        }
        case 'capndesk': {
          // the counter, the mat, the bell's shadow, and the cat on top of it
          const x = p.x - p.w / 2, y = base - p.h;
          rect(ctx, x, y, p.w, p.h, '#5f4732');
          rect(ctx, x, y, p.w, 6, '#7f6146');
          rect(ctx, x, y + 6, p.w, 3, '#452f1f');
          rect(ctx, x, base - 10, p.w, 10, '#3a2718');
          for (let i = 0; i < p.w; i += 26) { ctx.globalAlpha = 0.12; rect(ctx, x + i, y + 9, 1, p.h - 19, '#000'); ctx.globalAlpha = 1; }
          // the counter top, worn pale where every forearm has ever rested
          ctx.globalAlpha = 0.16; rect(ctx, x + 20, y + 1, p.w - 40, 4, '#e0d4bc'); ctx.globalAlpha = 1;
          // the ledger, the pen on a string, the little stand of cards
          rect(ctx, x + 18, y - 7, 44, 8, '#e8e2d2');
          rect(ctx, x + 18, y - 7, 44, 2, '#f6f2e6');
          rect(ctx, x + 40, y - 11, 2, 12, '#2a2634');
          rect(ctx, x + 74, y - 16, 20, 16, '#c8402c');
          drawText(ctx, '24', x + 84, y - 12, '#fff2e0', { align: 'center', font: 'small' });
          // and the cat, which owns this counter
          capnCat(ctx, x + p.w - 42, y, 0.85, t);
          return true;
        }
        case 'capnbell': {
          // a chrome dome on a base, worn shiny on the top
          ellipsePx(ctx, p.x, base, 9, 3, '#8a8f98');
          ellipsePx(ctx, p.x, base - 5, 8, 6, '#c0c6ce');
          ellipsePx(ctx, p.x, base - 7, 6, 4, '#eef2f6');
          rect(ctx, p.x - 1, base - 11, 2, 4, '#9aa0aa');
          if (S.bellT > 0) { ctx.globalAlpha = clamp(S.bellT * 2, 0, 1); ringPx(ctx, p.x, base - 6, 10 + (1 - S.bellT) * 12, '#fff2cc'); ctx.globalAlpha = 1; }
          return true;
        }
        case 'capnrules': capnRules(ctx, p.x - p.w / 2, base, p.w, p.h, t); return true;
        case 'capnshoe': capnShoeLockers(ctx, p.x - p.w / 2, base, p.w, p.h, t, S, !S.capShoes); return true;
        case 'capnlock': capnLockers(ctx, p.x - p.w / 2, base, p.w, p.h, t, S, S.step === 2); return true;
        case 'capnchair': {
          // a lounge chair with the stuffing going, and a blanket over one arm
          const x = p.x - p.w / 2, y = base - p.h;
          ctx.globalAlpha = 0.26; ellipsePx(ctx, p.x, base + 1, p.w * 0.5, 5, '#000'); ctx.globalAlpha = 1;
          rect(ctx, x, y + 18, p.w, p.h - 18, '#5a4a52');
          rect(ctx, x, y + 18, p.w, 3, '#77646e');
          rect(ctx, x - 4, y, 12, p.h, '#4a3c44');                 // the back
          rect(ctx, x + p.w - 8, y + 10, 12, p.h - 10, '#4a3c44');  // the near arm
          rect(ctx, x + p.w - 8, y + 10, 12, 3, '#67545e');
          rect(ctx, x + 4, base - 6, 6, 6, '#2a2028');
          rect(ctx, x + p.w - 12, base - 6, 6, 6, '#2a2028');
          // the blanket, folded once, which is the hotel's one kindness
          rect(ctx, x + p.w - 14, y + 4, 22, 10, '#8a5a3a');
          rect(ctx, x + p.w - 14, y + 4, 22, 2, '#a87450');
          return true;
        }
        case 'capntvset': {
          // the lounge TV, up on a bracket, on mute, on all night
          const x = p.x - p.w / 2, y = base - p.h;
          rect(ctx, p.x - 5, y + p.h, 10, 22, '#4a4458');
          capnTv(ctx, x, y, p.w, p.h, t, true);
          return true;
        }
        case 'capnsign': {
          const x = p.x - p.w / 2, y = base - p.h;
          rect(ctx, x, y, p.w, p.h, '#1f5f4a');
          rect(ctx, x, y, p.w, 2, '#3f8f6a');
          frame(ctx, x, y, p.w, p.h, '#0d1a14');
          drawText(ctx, p.text, p.x - 10, y + 8, '#f0f6f0', { align: 'center', scale: 2 });
          ctx.fillStyle = '#f0f6f0';
          ctx.beginPath(); ctx.moveTo(x + p.w - 8, y + p.h / 2); ctx.lineTo(x + p.w - 18, y + p.h / 2 - 6); ctx.lineTo(x + p.w - 18, y + p.h / 2 + 6); ctx.fill();
          rect(ctx, p.x - 2, y - 14, 4, 14, '#5a5468');
          return true;
        }
        case 'capnsinks': capnSinks(ctx, p.x - p.w / 2, base, p.w, t, S); return true;
        case 'capntowel': capnTowelMachine(ctx, p.x - p.w / 2, base, p.w, p.h, t); return true;
        case 'capnbath': {
          // the doorway, and the noren hanging in front of it
          const x = p.x - p.w / 2, y = base - p.h;
          rect(ctx, x - 6, y - 6, p.w + 12, 8, '#4a4458');
          capnNoren(ctx, x, y, p.w, 62, '#2f6a8a', t, 3);
          drawText(ctx, 'BATH', p.x, y - 22, withAlpha(CAPN_PAL.cream, 0.55), { align: 'center', font: 'small' });
          return true;
        }
        case 'capnladder': { if (p.floor === 1) capnLadder(ctx, p.x, base, p.w, t); return true; }
        case 'capnpod': {
          // the shells themselves are painted into mid(); this is only the
          // step in front of yours and the light coming out of it
          if (p.mine) {
            ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 2.4);
            ellipsePx(ctx, p.x, base + 1, 40, 8, CAPN_PAL.gold);
            ctx.globalAlpha = 1;
          }
          return true;
        }
      }
      return false;
    },

    use: function (S, e) {
      switch (e.act) {
        case 'out': {
          S.say('YOU', S.step === 0 ? 'STILL RAINING. STILL TOKYO.' : 'NOT GOING BACK OUT THERE.', 'you');
          return;
        }
        case 'bell': {
          S.bellT = 0.8; Audio.ui('pop');
          if (S.step === 0) S.run([
            { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'I AM HERE. I AM ALWAYS HERE.' },
            { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'THE BELL IS FOR DECORATION.' },
          ]);
          else S.say('NIGHT CLERK', 'YOU HAVE A KEY. GO TO BED.', 'clerk');
          return;
        }
        case 'rules': {
          S.run([
            { who: '', voice: false, think: true, at: 'you', text: 'SIX RULES. YOU CANNOT READ FIVE.' },
            { who: '', voice: false, think: true, at: 'you', text: 'THE PICTURES ARE CLEAR ENOUGH.' },
            { who: '', voice: false, think: true, at: 'you', text: 'NO SHOES. NO VOICES. NO SMOKING.' },
            { who: '', voice: false, think: true, at: 'you', text: 'AND ONE WITH A GUITAR CROSSED OUT.' },
          ]);
          return;
        }
        case 'checkin': { capnCheckIn(S); return; }
        case 'shoes': { capnShoesOff(S); return; }
        case 'locker': { capnLocker(S); return; }
        case 'brush': { capnWash(S); return; }
        case 'towel': {
          if (S.step < 3) { S.say('YOU', 'ONE THING AT A TIME.', 'you'); return; }
          S.say('YOU', 'YOU HAVE A TOWEL. IT IS THIN, BUT IT IS YOURS.', 'you');
          return;
        }
        case 'bath': {
          S.run([
            { who: '', voice: false, think: true, at: 'you', text: 'HOT WATER. VERY HOT WATER.' },
            { who: '', voice: false, think: true, at: 'you', text: 'IF YOU GET IN THERE NOW YOU WILL' },
            { who: '', voice: false, think: true, at: 'you', text: 'FALL ASLEEP IN IT AND DIE.' },
            { who: '', voice: false, think: true, at: 'you', text: 'TOMORROW. TOMORROW YOU WILL.' },
          ]);
          return;
        }
        case 'tv': {
          S.run([
            { who: '', voice: false, think: true, at: 'you', text: 'FOUR PEOPLE IN BOXES, LAUGHING.' },
            { who: '', voice: false, think: true, at: 'you', text: 'NO SOUND. IT IS STILL FUNNY.' },
            { who: '', voice: false, think: true, at: 'you', text: 'THAT IS A GOOD SIGN ABOUT SOMETHING.' },
          ]);
          return;
        }
        case 'vend': {
          const r = Game.run;
          if (r && r.money >= 2) {
            r.money -= 2; r.stamina = clamp((r.stamina || 0) + 8, 0, r.staminaMax || 240);
            Audio.ui('coin'); r.save();
            S.flash('HOT CAN OF CORN SOUP. -$2. IT IS THREE IN THE MORNING SOMEWHERE.');
            S.fx.burst(S.cam.sx(e.x), S.cam.sy(S.floorY(e.floor) - 40), 9, { color: ['#f2a03a', '#f4f1ea'], speed: 52, life: 0.5, size: 2 });
          } else { Audio.ui('error'); S.flash('TWO DOLLARS. YOU DO NOT HAVE TWO DOLLARS.'); }
          return;
        }
        case 'ladder': {
          if (S.riding) return;
          if (S.step < 4) {
            S.say('YOU', capnGateLine(S), 'you');
            return;
          }
          S.ride(e);
          return;
        }
        case 'notyours': {
          S.run([
            { who: '', voice: false, think: true, at: 'you', text: 'BLIND DOWN. A PAIR OF FEET.' },
            { who: '', voice: false, think: true, at: 'you', text: 'NOT YOURS. MOVE ALONG.' },
          ]);
          return;
        }
        case 'capsule': { capnEnterCapsule(S); return; }
      }
    },

    tick: function (S, dt) {
      S.copyT = Math.max(0, (S.copyT || 0) - dt);
      S.bellT = Math.max(0, (S.bellT || 0) - dt);
      // the brushing game is driven by the scene's own update(), which returns
      // before this ever runs; nothing else in here should tick under it
      if (S.brush) return;
      if (S.capIn) { S.capIn.k = Math.min(1, S.capIn.k + dt * 1.6); if (S.capIn.wait > 0) { S.capIn.wait -= dt; if (S.capIn.wait <= 0 && S.capIn.then) { const f = S.capIn.then; S.capIn.then = null; f(); } } }
      if (S.night) capnNightTick(S, dt);
    },
  };
}

// ---------- the five things you have to do, in order ----------
// Every one of them is a gate. The building is not being difficult; it is
// just that there is a way this is done and everybody here already knows it.
function capnGateLine(S) {
  switch (S.step) {
    case 0: return 'KEY FIRST. HE IS WATCHING YOU.';
    case 1: return 'NOT IN SHOES. NOT IN HERE.';
    case 2: return 'NOT DRAGGING THAT UP A LADDER.';
    case 3: return 'TEETH. THEN BED. THAT IS THE ORDER.';
  }
  return 'ALREADY DONE.';
}
// What money actually changes hands. If you have not got it, he writes it in
// the book and you pay in the morning, which is worse.
function capnPay(S, amount) {
  const r = Game.run;
  if (!r) return { paid: true, owed: 0 };
  if (r.money >= amount) { r.money -= amount; Audio.ui('cash'); r.save(); return { paid: true, owed: 0 }; }
  const owed = amount - Math.max(0, r.money);
  r.money = Math.max(0, r.money - amount);
  if (!r.flags) r.flags = {};
  r.flags.capsuleOwes = (r.flags.capsuleOwes || 0) + owed;
  Audio.ui('error'); r.save();
  return { paid: false, owed: owed };
}

// ---- 1. the desk
function capnCheckIn(S) {
  if (S.step > 0) {
    S.run([
      { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'BAND ON WRIST. KEY IN HAND.' },
      { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'YOU ARE ' + CAPN_NUM + ' NOW. GO UP.' },
    ]);
    return;
  }
  const nights = function (n, cost) {
    return function (dlg) {
      const res = capnPay(S, cost);
      S.capNights = n; S.capOwed = res.owed;
      if (Game.run) { if (!Game.run.flags) Game.run.flags = {}; Game.run.flags.capsuleNights = n; Game.run.save(); }
    };
  };
  S.run([
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'WELCOME. ONE PERSON.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'ONE.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'IS ALWAYS ONE AT THIS HOUR.' },
    {
      id: 'ask1', who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'HOW MANY NIGHT.',
      choices: [
        { label: 'ONE NIGHT', note: fmtMoney(CAPN_ONE), go: nights(1, CAPN_ONE), next: 'pay' },
        { label: 'THREE NIGHTS', note: fmtMoney(CAPN_THREE), go: nights(3, CAPN_THREE), next: 'pay' },
        { label: 'DO YOU HAVE A LOCKER FOR A GUITAR', next: 'guitar' },
      ],
    },
    { id: 'guitar', who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'GUITAR.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'IT IS NOT WITH ME. NOT YET.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'THEN IS EASY LOCKER.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'BEHIND DESK. NO CHARGE.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'IS GOOD GUITAR?' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'NO.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'THEN IS VERY SAFE HERE.' },
    {
      id: 'ask2', who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'HOW MANY NIGHT.',
      choices: [
        { label: 'ONE NIGHT', note: fmtMoney(CAPN_ONE), go: nights(1, CAPN_ONE), next: 'pay' },
        { label: 'THREE NIGHTS', note: fmtMoney(CAPN_THREE), go: nights(3, CAPN_THREE), next: 'pay' },
      ],
    },
    // ---- paid, or not quite paid
    {
      id: 'pay', who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK',
      text: 'PASSPORT. I COPY. IS THE LAW.',
    },
    {
      who: '', voice: false, at: { x: 240, y: 380 }, think: false,
      text: 'THE MACHINE LIGHTS UP THE WHOLE LOBBY.',
      do: function () { S.copyT = 1.3; Audio.ui('stamp'); S.cam.kick(2, 0.22); },
    },
    {
      when: function () { return S.capOwed > 0; }, who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK',
      text: 'YOU ARE SHORT. IT HAPPENS.',
    },
    {
      when: function () { return S.capOwed > 0; }, who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK',
      text: 'I WRITE IT IN BOOK. YOU PAY MORNING.',
    },
    { when: function () { return S.capOwed > 0; }, who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'DO NOT MAKE ME FIND YOU.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'BAND. DO NOT TAKE OFF.' },
    {
      who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: CAPN_NUM + '. SHOE LOCKER SAME NUMBER.',
      do: function () {
        S.capKey = true; S.step = 1; S.capnRelabel(S);
        Audio.ui('coin');
        if (Game.run) { if (!Game.run.flags) Game.run.flags = {}; Game.run.flags.capsule = CAPN_NUM; Game.run.save(); }
        S.fx.burst(S.cam.sx(340), S.cam.sy(400), 10, { color: ['#ffd24a', '#f4f1ea'], speed: 50, life: 0.6, size: 2 });
      },
    },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'SHOES OFF AT THE STEP. THEN BAG.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'THEN WASH. THEN SLEEP.' },
    { who: 'NIGHT CLERK', voice: 'clerk', at: 'NIGHT CLERK', text: 'IS NOT DIFFICULT. EVERYBODY MANAGE.' },
    {
      who: '', voice: false, at: 'you', think: true, text: 'THE CAT HAS NOT MOVED ONCE.',
      do: function () { S.flash('WRISTBAND ' + CAPN_NUM + '. SHOES OFF AT THE STEP.', 4); },
    },
  ]);
}

// ---- 2. the shoes
function capnShoesOff(S) {
  if (S.step < 1) { S.say('YOU', capnGateLine(S), 'you'); return; }
  if (S.step > 1) { S.say('YOU', 'YOUR SHOES ARE IN THERE. NUMBER ' + CAPN_NUM + '.', 'you'); return; }
  S.lock(0.8);
  S.run([
    { who: '', voice: false, at: 'you', think: true, text: 'THE STEP UP IS THE BORDER.' },
    { who: '', voice: false, at: 'you', think: true, text: 'OUTSIDE IS OUTSIDE. THIS IS INSIDE.' },
    {
      who: '', voice: false, at: 'you', text: 'YOU TAKE THEM OFF. THE FLOOR IS WARM.',
      do: function () {
        S.capShoes = false; S.step = 2; S.capnRelabel(S);
        Audio.ui('pop');
        S.fx.burst(S.cam.sx(S.body.x), S.cam.sy(S.floorY(S.body.fk) - 6), 8, { color: ['#8a8478', '#5a5468'], speed: 40, life: 0.5, size: 2, gravity: 90 });
      },
    },
    { who: '', voice: false, at: 'you', think: true, text: 'YOUR SOCKS HAVE BEEN ON SINCE VEGAS.' },
    { who: '', voice: false, at: 'you', think: true, text: 'NOBODY IS GOING TO MENTION IT.' },
  ]);
}

// ---- 3. the locker
function capnLocker(S) {
  if (S.step < 2) { S.say('YOU', capnGateLine(S), 'you'); return; }
  if (S.step > 2) { S.say('YOU', 'EVERYTHING YOU OWN IS IN ' + CAPN_NUM + '. IT SHUTS.', 'you'); return; }
  S.lock(1.2);
  S.run([
    { who: '', voice: false, at: 'you', text: 'THE DOOR IS AS WIDE AS YOUR SHOULDERS.' },
    {
      who: '', voice: false, at: 'you', text: 'THE CASE GOES IN. THE CASE JUST FITS.',
      do: function () {
        S.body.carry = null;
        Audio.ui('back');
        S.fx.burst(S.cam.sx(S.body.x + 20), S.cam.sy(S.floorY(S.body.fk) - 40), 6, { color: ['#8a8f98'], speed: 34, life: 0.4, size: 2 });
      },
    },
    { who: '', voice: false, at: 'you', think: true, text: 'EVERYTHING YOU OWN, IN A TIN BOX,' },
    { who: '', voice: false, at: 'you', think: true, text: 'IN A BUILDING YOU CANNOT SPELL.' },
    {
      who: '', voice: false, at: 'you', text: 'ONE TOWEL. ONE YUKATA. TAKE BOTH.',
      do: function () {
        S.capTowel = true; S.step = 3; S.capnRelabel(S);
        Audio.ui('select');
        if (Game.run) { Game.run.stamina = clamp((Game.run.stamina || 0) + 6, 0, Game.run.staminaMax || 240); Game.run.save(); }
        S.flash('TOWEL AND YUKATA. THE WASHROOM IS EAST.', 4);
      },
    },
    { who: '', voice: false, at: 'you', think: true, text: 'THE TOWEL IS THE SIZE OF A NAPKIN.' },
    { who: '', voice: false, at: 'you', think: true, text: 'APPARENTLY THAT IS THE POINT.' },
  ]);
}

// ---- 4. the washroom
function capnWash(S) {
  if (S.step < 3) { S.say('YOU', capnGateLine(S), 'you'); return; }
  if (S.step > 3) {
    S.say('YOU', S.capSkipped ? 'YOU COULD GO BACK AND DO IT PROPERLY.' : 'DONE. THEY FEEL LIKE SOMEBODY ELSES.', 'you');
    return;
  }
  S.run([
    { who: '', voice: false, at: 'you', think: true, text: 'A ROW OF SINKS. ONE OTHER BUG.' },
    { who: 'SALARYMAN', voice: 'guard', at: 'SALARYMAN', text: '...' },
    { who: '', voice: false, at: 'you', think: true, text: 'HIS EYES ARE SHUT. HE IS ASLEEP' },
    { who: '', voice: false, at: 'you', think: true, text: 'AND HIS ARM IS STILL GOING.' },
    { who: '', voice: false, at: 'you', text: 'THE BASKET HAS A BRUSH IN IT. TAKE ONE.' },
  ], function () { capnStartBrush(S); });
}
function capnStartBrush(S) {
  S.brush = new CapsuleBrushGame(S.you.spec, { dur: 23 });
  S.prompt = null;
  S.input.clear();
  Audio.ui('select');
}
// What the building thinks of how you did, which is not nothing.
function capnAfterBrush(S, g) {
  S.step = 4;
  S.capBrushed = g.score;
  S.capSkipped = g.skipped;
  S.capnRelabel(S);
  const r = Game.run;
  if (r) {
    if (!r.buffs) r.buffs = {};
    if (!r.flags) r.flags = {};
    r.flags.capsuleBrush = Math.round(g.score * 100);
    // a small buff, and it is small on purpose: you feel like a person
    const st = g.skipped ? 4 : Math.round(8 + g.score * 16);
    r.stamina = clamp((r.stamina || 0) + st, 0, r.staminaMax || 240);
    if (!g.skipped && g.score >= 0.75) r.buffs.mult = (r.buffs.mult || 0) + 1;
    r.save();
  }
  if (g.skipped) {
    S.run([
      { who: '', voice: false, at: 'you', text: 'YOU SPIT, RINSE, AND PUT IT DOWN.' },
      { who: 'SALARYMAN', voice: 'guard', at: 'SALARYMAN', text: '...' },
      { who: '', voice: false, at: 'you', think: true, text: 'HE IS STILL GOING. EYES SHUT.' },
      { who: '', voice: false, at: 'you', think: true, text: 'HE HAS BEEN GOING THE WHOLE TIME.' },
      { who: '', voice: false, at: 'you', think: true, text: 'YOU ARE NOT GOING TO THINK ABOUT IT.' },
      { who: '', voice: false, at: 'you', think: true, text: 'YOU ARE GOING TO THINK ABOUT IT.' },
    ], function () { S.flash('CAPSULE ' + CAPN_NUM + '. UP THE LADDER, EAST END.', 4.2); });
  } else {
    S.run([
      { who: '', voice: false, at: 'you', text: g.rating() },
      { who: 'SALARYMAN', voice: 'guard', at: 'SALARYMAN', text: 'MM.' },
      { who: '', voice: false, at: 'you', think: true, text: 'THAT WAS APPROVAL. YOU WILL TAKE IT.' },
    ], function () { S.flash('CAPSULE ' + CAPN_NUM + '. UP THE LADDER, EAST END.', 4.2); });
  }
}

// ---- 5. the capsule
function capnEnterCapsule(S) {
  if (S.step < 4) { S.say('YOU', capnGateLine(S), 'you'); return; }
  if (S.capIn) return;
  Audio.ui('back');
  S.lock(99);
  S.cam.focus(S.body.x, S.floorY(0) - 40, 1.15);
  S.capIn = { k: 0, lamp: 1, blind: 0, radio: false, alarm: null, wait: 0, then: null };
  S.run([
    { who: '', voice: false, at: 'you', think: true, text: 'YOU GO IN FEET FIRST. EVERYBODY DOES.' },
    { who: '', voice: false, at: 'you', think: true, text: 'THE CEILING IS SIX INCHES AWAY.' },
    { who: '', voice: false, at: 'you', think: true, text: 'IT IS CLEAN. IT IS BEIGE. IT IS FINE.' },
    { who: '', voice: false, at: 'you', think: true, text: 'IT IS THE BEST BED SINCE VEGAS.' },
    {
      id: 'panel', who: '', voice: false, at: 'you', text: 'THERE IS A LITTLE PANEL BY YOUR HEAD.',
      choices: [
        { label: 'SET THE ALARM', next: 'alarm' },
        { label: 'TURN THE RADIO ON', next: 'radio' },
        { label: 'PULL THE BLIND DOWN', next: 'blind' },
      ],
    },
    // ---- the radio
    {
      id: 'radio', who: '', voice: false, at: 'you', text: 'ONE STATION. A MAN TALKING VERY SLOWLY.',
      do: function () { S.capIn.radio = true; capnRadioBlip(); },
    },
    { who: '', voice: false, at: 'you', think: true, text: 'YOU DO NOT UNDERSTAND A WORD OF IT.' },
    { who: '', voice: false, at: 'you', think: true, text: 'YOU LEAVE IT ON.', next: 'panel2' },
    // ---- the blind
    {
      id: 'blind', who: '', voice: false, at: 'you', text: 'THE BLIND COMES DOWN WITH A RATTLE.',
      do: function () { S.capIn.blind = 1; Audio.ui('move'); },
    },
    { who: '', voice: false, at: 'you', think: true, text: 'A DOOR WOULD BE A FIRE RISK.' },
    { who: '', voice: false, at: 'you', think: true, text: 'A CURTAIN IS ENOUGH OF A DOOR.', next: 'panel2' },
    // ---- the alarm, which is the one that actually matters
    {
      id: 'alarm', who: '', voice: false, at: 'you', text: 'WHAT TIME ARE YOU GETTING UP.',
      choices: [
        { label: 'SIX. GO AND FIND A CORNER.', note: 'LONG DAY', go: function () { capnSetAlarm(S, 6); }, next: 'panel2' },
        { label: 'EIGHT. BE A PERSON ABOUT IT.', note: 'FINE', go: function () { capnSetAlarm(S, 8); }, next: 'panel2' },
        { label: 'ELEVEN. BE HONEST.', note: 'RESTED', go: function () { capnSetAlarm(S, 11); }, next: 'panel2' },
      ],
    },
    // ---- back round, until the alarm is set
    {
      id: 'panel2', who: '', voice: false, at: 'you', text: 'ANYTHING ELSE BEFORE THE LIGHT GOES.',
      choices: [
        { label: 'SET THE ALARM', next: 'alarm' },
        { label: 'RADIO', next: 'radio' },
        { label: 'BLIND', next: 'blind' },
        { label: 'THAT IS ENOUGH. SLEEP.', next: 'sleep' },
      ],
    },
    {
      id: 'sleep', when: function () { return S.capIn.alarm == null; },
      who: '', voice: false, at: 'you', think: true, text: 'SET THE ALARM FIRST. YOU KNOW YOURSELF.', next: 'alarm',
    },
    {
      who: '', voice: false, at: 'you', text: 'YOU PUT YOUR HAND ON THE LIGHT.',
      do: function () { S.capIn.blind = 1; },
    },
  ], function () { capnSleep(S); });
}
function capnSetAlarm(S, hour) {
  S.capIn.alarm = hour;
  Audio.ui('tally');
  if (Game.run) { if (!Game.run.flags) Game.run.flags = {}; Game.run.flags.wakeHour = hour; Game.run.save(); }
  S.flash('ALARM SET FOR ' + pad2(hour) + ':00.', 2.6);
}
// The little burst of somebody else's language, from a speaker the size of a coin.
function capnRadioBlip() {
  if (!Audio.ctx || Audio.muted) return;
  Voice.say('AND SO THE WEATHER FOR TOMORROW', 'tannoy', { gain: 0.5, speed: 0.7 });
}

// ---------- 6. the night ----------
// You do not sleep through a night in a capsule hotel. You lie in it and
// listen to a building full of people doing the same thing, and somewhere in
// there a few hours go past.
const CAPN_NIGHT = [
  [0.9, 'THE LIGHT GOES OUT WITH A CLICK.', 'click'],
  [3.4, 'THE AIR CONDITIONING FINDS A NOTE AND HOLDS IT.', 'hum'],
  [6.2, 'THE BUG IN 211 SNORES. IT IS ALMOST A RHYTHM.', 'snore'],
  [9.0, 'SOMEBODY COMES IN AT THREE AND IS VERY QUIET ABOUT IT.', 'door'],
  [11.8, 'A TRAIN, SOMEWHERE. THE LAST ONE OR THE FIRST ONE.', 'train'],
  [14.6, 'AT FOUR THE BUILDING SIGHS AND SETTLES.', 'settle'],
  [17.4, 'THE GREY GETS IN ROUND THE EDGE OF THE BLIND.', null],
  [20.2, 'TOKYO. DAY ONE.', 'birds'],
];
const CAPN_NIGHT_END = 24.4;

function capnSleep(S) {
  if (S.night) return;
  S.night = { t: 0, i: 0, line: '', lineAt: -99, left: false };
  S.capIn.blind = 1;
  S.locked = 999;
  Audio.ui('back');
  if (Game.run) { if (typeof setChapter === 'function') setChapter('morning'); }
}
function capnNightTick(S, dt) {
  const N = S.night;
  N.t += dt;
  // the lamp goes out over the first second and stays out until the sky does
  // the work instead
  if (S.capIn) {
    const dawn = clamp((N.t - 17.0) / 6.0, 0, 1);
    S.capIn.lamp = Math.max(0, 1 - clamp(N.t / 1.1, 0, 1)) + dawn * 0.34;
  }
  while (N.i < CAPN_NIGHT.length && N.t >= CAPN_NIGHT[N.i][0]) {
    const row = CAPN_NIGHT[N.i];
    N.line = row[1]; N.lineAt = N.t;
    if (row[2]) capnNightSfx(row[2]);
    N.i++;
  }
  if (N.t >= CAPN_NIGHT_END && !N.left) {
    N.left = true;
    if (Game.run) { Game.run.day = (Game.run.day || 1) + 1; Game.run.chapter = 'morning'; Game.run.save(); }
    S.leave(function () {
      if (typeof MorningScene !== 'undefined') return new MorningScene();
      if (typeof gameHub === 'function') return gameHub();
      return new CityScene();
    }, 'fade', { dur: 1.4 });
  }
}
// The building has a sound for every hour of the night and none of them are
// loud. All of them are made out of the same three oscillators as the songs.
function capnNightSfx(kind) {
  if (!Audio.ctx || Audio.muted) return;
  const now = Audio.ctx.currentTime;
  switch (kind) {
    case 'click': Audio.ui('pop'); break;
    case 'hum':
      // one note, held, slightly out of tune with itself
      Audio.note('bass', 29, now, 5.2, 0.05);
      Audio.note('bass', 29.4, now + 0.1, 5.0, 0.035);
      break;
    case 'snore':
      for (let i = 0; i < 3; i++) {
        Audio.note('bass', 33, now + i * 1.5, 0.55, 0.07);
        Audio.note('bass', 28, now + i * 1.5 + 0.6, 0.35, 0.05);
      }
      break;
    case 'door': Audio.ui('tick'); Audio.note('piano', 44, now + 0.5, 0.2, 0.05); Audio.ui('move'); break;
    case 'train': Audio.ui('whoosh'); Audio.note('bass', 34, now + 0.1, 1.6, 0.045); break;
    case 'settle': Audio.note('piano', 38, now, 1.4, 0.05); Audio.note('piano', 41, now + 0.4, 1.2, 0.04); break;
    case 'birds':
      // four short high notes, which is all a bird is at this resolution
      [84, 88, 86, 91].forEach(function (n, i) { Audio.note('piano', n, now + i * 0.28, 0.18, 0.07); });
      break;
  }
}
// The dark itself, and the grey that ends it.
function capnNightWash(ctx, S, t) {
  const N = S.night, k = clamp(N.t / 1.6, 0, 1);
  const dawn = clamp((N.t - 17.0) / 6.0, 0, 1);
  ctx.globalAlpha = k * (0.94 - dawn * 0.5);
  rect(ctx, 0, 0, W, H, '#05040a');
  ctx.globalAlpha = 1;
  // the one seam of light round the blind, which is how you know time passed
  if (dawn > 0) {
    ctx.globalAlpha = dawn * 0.3;
    rect(ctx, 236, 142, W - 472, 6, '#9fb8d8');
    rect(ctx, 230, 148, 6, 258, '#9fb8d8');
    rect(ctx, W - 236, 148, 6, 258, '#9fb8d8');
    ctx.globalAlpha = dawn * 0.13;
    rect(ctx, 0, 0, W, H, '#6a86b8');
    ctx.globalAlpha = 1;
  }
  // the very end: white, and then it is a different day
  if (N.t > CAPN_NIGHT_END - 2.2) {
    ctx.globalAlpha = clamp((N.t - (CAPN_NIGHT_END - 2.2)) / 1.8, 0, 1) * 0.8;
    rect(ctx, 0, 0, W, H, '#e8eef8');
    ctx.globalAlpha = 1;
  }
}
// The lines themselves, typed out along the bottom the way the narrator does.
function capnNightLines(ctx, S, t) {
  const N = S.night;
  const age = N.t - N.lineAt;
  if (!N.line || age > 2.6) return;
  const fade = clamp(age / 0.35, 0, 1) * clamp((2.6 - age) / 0.5, 0, 1);
  const shown = N.line.slice(0, Math.floor(age * 36));
  ctx.globalAlpha = fade;
  drawText(ctx, shown, W / 2, H - 96, '#cfd8ea', { align: 'center', scale: 2, outline: '#0a0a12' });
  ctx.globalAlpha = 1;
}

// ---------- the little strip that says what you are supposed to be doing ----------
// The HUD is off in here because a money bar over a man taking his shoes off
// is a joke that is not worth it. This is what replaces it.
const CAPN_TASKS = [
  'CHECK IN AT THE DESK',
  'SHOES OFF AT THE STEP',
  'BAG IN THE LOCKER',
  'WASH. BRUSH YOUR TEETH.',
  'CAPSULE ' + CAPN_NUM + ', UP THE LADDER',
  '',
];
function capnObjective(ctx, S, t) {
  if (S.capIn || S.night || S.brush) return;
  const task = CAPN_TASKS[clamp(S.step, 0, 5)];
  if (!task) return;
  const w = textWidth(task, { scale: 2 }) + 108;
  ctx.globalAlpha = 0.9;
  rect(ctx, 12, 12, w, 26, 'rgba(8,8,16,0.8)');
  ctx.globalAlpha = 1;
  frame(ctx, 12, 12, w, 26, '#4a4460');
  rect(ctx, 12, 12, 4, 26, CAPN_PAL.gold);
  // the tick boxes, one per step, so the order is visible and not just felt
  for (let i = 0; i < 5; i++) {
    const bx = 22 + i * 9;
    rect(ctx, bx, 20, 7, 9, i < S.step ? CAPN_PAL.green : '#3a3448');
    if (i === S.step) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 5); rect(ctx, bx, 20, 7, 9, CAPN_PAL.gold); ctx.globalAlpha = 1; }
  }
  drawText(ctx, task, 76, 18, CAPN_PAL.cream, { scale: 2 });
  // and the money, small, in the corner, because you did just spend some
  const money = (Game.run && Game.run.money != null) ? Game.run.money : 0;
  ctx.globalAlpha = 0.82; rect(ctx, W - 116, 12, 104, 24, 'rgba(8,8,16,0.8)'); ctx.globalAlpha = 1;
  frame(ctx, W - 116, 12, 104, 24, '#5a4a20');
  drawText(ctx, fmtMoney(money), W - 20, 18, CAPN_PAL.gold, { align: 'right', scale: 2 });
  if (S.capOwed > 0) drawText(ctx, 'OWES ' + fmtMoney(S.capOwed), W - 20, 42, '#e8503a', { align: 'right', font: 'small' });
}

// ---------- the scene class ----------
// Everything above is paint and script. This is the twenty lines that make it
// a place you can be in: what the labels say right now, what your bug is
// wearing, and who gets the keyboard while the brushing game is up.
class CapsuleNightScene extends SideScene {
  constructor(opts) {
    super(capsuleNightDef(), opts || {});
    if (opts && opts.at != null) { this.body.x = opts.at; this.cam.snapTo(this.body.x, this.floorY(this.body.fk)); }
  }

  // The prompts have to tell the truth about what is possible right now, or
  // the whole gated order reads as the game being broken instead of strict.
  capnRelabel(S) {
    const step = S.step;
    for (let i = 0; i < S.props.length; i++) {
      const p = S.props[i];
      switch (p.act) {
        case 'checkin': p.label = step === 0 ? 'CHECK IN' : 'THE DESK'; break;
        case 'shoes': p.label = step === 1 ? 'SHOES OFF' : (step < 1 ? 'SHOE LOCKERS' : 'YOUR SHOES ARE IN ' + CAPN_NUM); break;
        case 'locker': p.label = step === 2 ? 'LOCKER ' + CAPN_NUM : 'LOCKERS'; break;
        case 'brush': p.label = step === 3 ? 'BRUSH YOUR TEETH' : 'THE SINKS'; break;
        case 'ladder': p.label = step >= 4 ? (p.floor === 1 ? 'UP THE LADDER' : 'DOWN') : 'NOT YET'; break;
        case 'capsule': p.label = step >= 4 ? 'CAPSULE ' + CAPN_NUM : 'CAPSULE ' + CAPN_NUM + ' - LOCKED'; break;
      }
    }
    // the clerk stops being a transaction and starts being a man on a night shift
    for (let i = 0; i < S.npcs.length; i++) {
      const n = S.npcs[i];
      if (n.name !== 'NIGHT CLERK') continue;
      n.tag = step === 0 ? 'YOU NEED A KEY FIRST.' : ['THE CAT IS CALLED NOTHING.', 'SHE CAME WITH THE BUILDING.', 'SHE IS ON THE LEASE, PROBABLY.'];
    }
  }

  // Your bug, plus the two things about it that change tonight: the shoes it
  // is wearing until the step, and the towel it carries after the locker.
  drawHero(ctx) {
    const b = this.body, y = this.floorY(b.fk), z = this.floorZ(b.fk), s = b.scale * z;
    super.drawHero(ctx);
    if (this.capShoes) {
      // two dark blocks on the ground line, which at this size is a pair of shoes
      const sp = b.moving ? Math.sin(b.t * 14) * 3 * s : 0;
      for (let i = 0; i < 2; i++) {
        const ox = b.x + (i ? 4 : -6) * s + (i ? sp : -sp);
        rect(ctx, ox - 4 * s, y - 4, 9 * s, 5, '#241f28');
        rect(ctx, ox - 4 * s, y - 4, 9 * s, 1, '#3f3748');
        rect(ctx, ox + (b.face > 0 ? 3 : -1) * s, y - 5, 3 * s, 2, '#4a4058');
      }
    }
    if (this.capTowel) {
      // a rolled towel over the shoulder and a folded yukata under the arm
      const ox = b.x - b.face * 11 * s, oy = y - 30 * s;
      rect(ctx, ox - 4 * s, oy, 8 * s, 15 * s, '#f0ece2');
      rect(ctx, ox - 4 * s, oy, 8 * s, 2, '#ffffff');
      rect(ctx, ox - 4 * s, oy + 7 * s, 8 * s, 1, '#c8c2b4');
      rect(ctx, ox - 5 * s, oy + 16 * s, 10 * s, 8 * s, '#3a4a68');
      rect(ctx, ox - 5 * s, oy + 16 * s, 10 * s, 2, '#5a6a88');
    }
  }

  // ---- while the brushing game is up it owns everything
  key(code) { if (this.brush) { this.brush.key(code); return; } super.key(code); }
  keyUp(code) { if (this.brush) { this.brush.keyUp(code); return; } super.keyUp(code); }
  pointerDown(x, y, id) { if (this.brush) { this.brush.pointerDown(x, y, id); return; } super.pointerDown(x, y, id); }
  pointerMove(x, y, id) { if (this.brush) { this.brush.pointerMove(x, y, id); return; } super.pointerMove(x, y, id); }
  pointerUp(x, y, id) { if (this.brush) { this.brush.pointerUp(x, y, id); return; } super.pointerUp(x, y, id); }
  click(x, y) { if (this.brush) { this.brush.pointerDown(x, y, 991); return; } super.click(x, y); }

  update(dt) {
    if (this.brush) {
      // the world keeps ticking over behind it, quietly, so it still feels
      // like a washroom and not a menu
      this.t += dt;
      this.msgT = Math.max(0, this.msgT - dt);
      this.fx.update(dt);
      this.prompt = null;
      this.brush.update(dt);
      if (this.brush.done) { const g = this.brush; this.brush = null; capnAfterBrush(this, g); }
      for (let i = 0; i < this.npcs.length; i++) this.stepNpc(this.npcs[i], dt);
      this.cam.follow(dt, this.body.x, this.floorY(this.body.fk), 0);
      return;
    }
    super.update(dt);
  }

  // the touch pads are noise once you are lying down
  draw(ctx) {
    if (this.capIn || this.night || this.brush) { const l = this.input.layout; this.input.layout = function () { return null; }; super.draw(ctx); this.input.layout = l; return; }
    super.draw(ctx);
  }
}
