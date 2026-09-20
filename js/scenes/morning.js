// ---------- Day one, seven in the morning ----------
// A capsule is a moulded plastic box with a blind on the end of it, and what
// wakes you up in one is a noise designed by somebody who has never had to
// hear it. You lie there. You do the sum about how much sleep you got. Then
// you slide the blind, climb down a cold ladder, and the building is already
// going: the urn gurgling, the television talking to nobody, a bug in a vest
// ironing a shirt he will sweat through by ten.
//
// Three things happen in here and they are the whole shape of a day. You write
// down what you want. You decide what you are going to look like while you
// fail to get it. Then you go outside.
'use strict';

const MORN_W = 1800;              // the corridor, end to end
const MORN_FLOOR = 438;           // the one floor there is
const MORN_NUM = '214';           // your capsule. Same number as last night.
const MORN_EXIT_X = 1706;

// Whether you have already climbed down TODAY. This used to be a plain
// boolean, which meant the morning happened once in a whole run and every day
// after it started with you standing in the corridor like a ghost.
function mornUpAlready() {
  const r = Game.run;
  return !!(r && r.flags && r.flags.gotUpDay === r.day);
}
// And whether the list on the pad is today's list. The run rolls itself three
// goals at dawn, so counting them proved nothing: you have to have written.
function mornWroteList() {
  const r = Game.run;
  return !!(r && r.flags && r.flags.wroteGoalsDay === r.day);
}

const MORN_PAL = {
  wall: '#2f2a3a', wallHi: '#433c54', wallLo: '#1e1a29',
  floor: '#3d3446', floorHi: '#544961', floorLo: '#281f33',
  carpet: '#4a3a44', carpetHi: '#63505c',
  pod: '#ded7c4', podHi: '#f4eedc', podLo: '#9a927f',
  wood: '#7a5a3a', woodHi: '#a07a52', woodLo: '#4e3724',
  steel: '#8a8f98', steelHi: '#c2c8d0', steelLo: '#5a606a',
  cream: '#f4f1ea', ink: '#241d28',
  sun: '#ffd8a0', sunHot: '#fff0cc', sunLo: '#e0a45a',
  gold: '#ffd24a', green: '#6be585', red: '#c8402c', blue: '#8ad8ff',
};

// ============================================================
//  THE VIEW FROM INSIDE THE BOX
// ============================================================

// The shell. Cream plastic, moulded in one piece, with ribs running front to
// back and a light in the ceiling that you are not going to turn on because
// there is already daylight leaking round the blind.
function mornCapsuleIn(ctx, S, t, pod) {
  const P = MORN_PAL;
  const a = clamp(pod.k, 0, 1);
  if (a <= 0) return;
  const open = clamp(pod.blind, 0, 1);        // 0 shut, 1 rolled all the way up
  const day = 0.24 + open * 0.66;             // how much light is in here
  ctx.globalAlpha = a;

  // ---- the plastic itself
  rect(ctx, 0, 0, W, H, mixColor('#5a5468', P.pod, day));
  vgrad(ctx, 0, 0, W, H, mixColor('#3a3444', P.podHi, day), mixColor('#241f30', '#9a927f', day));
  const ceil = 106;
  rect(ctx, 0, 0, W, ceil, mixColor('#3a3448', P.pod, day * 0.92));
  rect(ctx, 0, ceil - 5, W, 5, mixColor('#241f30', P.podLo, day));
  for (let x = 34; x < W; x += 92) rect(ctx, x, 0, 4, ceil - 5, mixColor('#221d2e', P.podLo, day * 0.8));
  // the ceiling light, off, a dead grey rectangle with your face not in it
  rect(ctx, W / 2 - 52, 15, 104, 15, mixColor('#3a3444', '#b0a894', day));
  rect(ctx, W / 2 - 48, 18, 96, 9, mixColor('#2a2536', '#cfc6ae', day));
  // the walls, angled in, because it is a tube and not a room
  ctx.fillStyle = mixColor('#3f3950', '#c8c0aa', day * 0.9);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(126, ceil); ctx.lineTo(126, H); ctx.lineTo(0, H); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W, 0); ctx.lineTo(W - 126, ceil); ctx.lineTo(W - 126, H); ctx.lineTo(W, H); ctx.fill();
  rect(ctx, 126, ceil, 3, H - ceil, mixColor('#241f30', P.podLo, day));
  rect(ctx, W - 129, ceil, 3, H - ceil, mixColor('#241f30', P.podLo, day));

  // ---- the mattress you are lying on, seen down the length of your own body
  const mat = 404;
  rect(ctx, 96, mat, W - 192, H - mat, mixColor('#2f4a5e', '#5a86a0', day));
  rect(ctx, 96, mat, W - 192, 4, mixColor('#3f5f78', '#8ab4cc', day));
  for (let x = 110; x < W - 100; x += 46) { ctx.globalAlpha = a * 0.16; rect(ctx, x, mat + 6, 2, H - mat - 6, '#000'); ctx.globalAlpha = a; }
  // the quilt, thrown back off you in the night, in a heap on the left
  ctx.fillStyle = mixColor('#3a3a52', '#a8a4c0', day);
  ctx.beginPath(); ctx.moveTo(96, H); ctx.lineTo(96, mat + 10); ctx.lineTo(240, mat - 4);
  ctx.lineTo(330, mat + 26); ctx.lineTo(300, H); ctx.fill();
  ctx.globalAlpha = a * 0.3; rect(ctx, 120, mat + 14, 160, 3, '#fff'); ctx.globalAlpha = a;

  // ---- the foot end: the blind, and the corridor behind it
  const fx = 232, fw = W - 464, fy = 146, fh = 252;
  rect(ctx, fx - 9, fy - 9, fw + 18, fh + 18, mixColor('#3a3448', '#b2aa96', day));
  rect(ctx, fx - 9, fy - 9, fw + 18, 3, mixColor('#4e4660', P.podHi, day));
  // what is out there, once the blind is up: the walkway lights and the row opposite
  rect(ctx, fx, fy, fw, fh, '#161320');
  ctx.globalAlpha = a * (0.3 + open * 0.6);
  rect(ctx, fx, fy, fw, fh, '#2a2436');
  rect(ctx, fx + 16, fy + 52, fw - 32, 104, '#1d1a28');
  rect(ctx, fx + 16, fy + 52, fw - 32, 4, '#4a4360');
  for (let i = 0; i < 3; i++) { rect(ctx, fx + 36 + i * 150, fy + 60, 118, 88, '#cfc6ae'); rect(ctx, fx + 40 + i * 150, fy + 64, 110, 80, '#2a2536'); }
  rect(ctx, fx, fy + fh - 60, fw, 60, '#3a3346');
  ctx.globalAlpha = a;
  // the blind itself, a ribbed roll that goes up and stays up
  const bh = Math.round(fh * (1 - open));
  if (bh > 2) {
    rect(ctx, fx, fy, fw, bh, mixColor('#6a6478', '#c8bea4', day * 0.7));
    for (let y = fy + 4; y < fy + bh; y += 9) rect(ctx, fx, y, fw, 2, mixColor('#4e4860', '#a89e84', day * 0.7));
    rect(ctx, fx, fy + bh - 5, fw, 5, mixColor('#3a3448', '#8a8270', day));
    // the one seam of morning that gets past it no matter what
    ctx.globalAlpha = a * 0.7;
    rect(ctx, fx, fy + bh, fw, 3, P.sunHot);
    ctx.globalAlpha = a * 0.13;
    rect(ctx, fx - 40, fy + bh, fw + 80, 90, P.sun);
    ctx.globalAlpha = a;
    // the pull cord, swinging a little from the last time it was touched
    const sw = Math.sin(t * 1.4) * 3;
    line(ctx, fx + fw - 22, fy + bh, fx + fw - 22 + sw, fy + bh + 46, '#8a8270');
    rect(ctx, fx + fw - 25 + sw, fy + bh + 46, 6, 9, '#c8402c');
  } else {
    // rolled up: the light comes in flat and low and lands on everything
    ctx.globalAlpha = a * 0.5; rect(ctx, fx, fy, fw, 14, '#6a6478'); ctx.globalAlpha = a;
  }
  frame(ctx, fx, fy, fw, fh, mixColor('#241f30', '#7a7260', day));

  // ---- the panel in the left wall, where your hand already is
  const cx0 = 18, cy0 = 200;
  rect(ctx, cx0, cy0, 92, 116, mixColor('#2a2536', '#4a4454', day * 0.5));
  rect(ctx, cx0, cy0, 92, 3, mixColor('#4a4460', '#6a6478', day * 0.5));
  frame(ctx, cx0, cy0, 92, 116, '#191622');
  const rocker = function (i, lab, on, col) {
    const ry = cy0 + 10 + i * 25;
    rect(ctx, cx0 + 7, ry, 32, 17, '#16131f');
    rect(ctx, cx0 + 8, ry + (on ? 8 : 1), 30, 8, on ? (col || P.green) : '#635d73');
    drawText(ctx, lab, cx0 + 43, ry + 6, on ? '#e0dcea' : '#7d7691', { font: 'small' });
  };
  rocker(0, 'LIGHT', false);
  rocker(1, 'RADIO', false);
  rocker(2, 'ALARM', pod.ringing, P.red);
  rocker(3, 'FAN', true, P.blue);

  // ---- the shelf on the right: the phone, the wristband, last night's water
  const sx0 = W - 196, sy0 = 250;
  rect(ctx, sx0, sy0, 156, 8, mixColor('#5a5468', '#b8b09a', day));
  rect(ctx, sx0, sy0, 156, 2, mixColor('#7a7490', P.podHi, day));
  mornShelfPhone(ctx, sx0 + 14, sy0, t, pod, a);
  // the wristband with your number on it, off your wrist, curled up
  ringPx(ctx, sx0 + 78, sy0 - 9, 10, '#c8402c');
  ringPx(ctx, sx0 + 78, sy0 - 9, 9, '#e8604a');
  drawText(ctx, MORN_NUM, sx0 + 78, sy0 - 12, '#fff2e0', { align: 'center', font: 'small' });
  // the bottle, finished, which you will carry all day rather than bin
  rect(ctx, sx0 + 114, sy0 - 29, 11, 29, withAlpha('#dff0ff', 0.4));
  rect(ctx, sx0 + 114, sy0 - 6, 11, 6, withAlpha('#9fd8ff', 0.5));
  rect(ctx, sx0 + 117, sy0 - 34, 5, 5, '#4a86f7');

  // ---- the light itself, which is the only thing in here doing any acting
  if (open > 0.04) {
    ctx.globalAlpha = a * open * 0.2;
    ctx.fillStyle = P.sun; ctx.beginPath();
    ctx.moveTo(fx, fy + 20); ctx.lineTo(fx + fw, fy + 20);
    ctx.lineTo(fx + fw + 120, H); ctx.lineTo(fx - 120, H); ctx.fill();
    ctx.globalAlpha = a;
    lightPool(ctx, W / 2, fy + 90, 340, P.sun, 0.1 * open);
    // dust, because low sun in a small box is mostly dust
    for (let i = 0; i < 26; i++) {
      const dx = fx + ((i * 137 + t * 9) % fw);
      const dy2 = fy + 30 + ((i * 61 + t * 5) % (fh + 90));
      ctx.globalAlpha = a * open * (0.1 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.9 + i)));
      rect(ctx, dx, dy2, 2, 2, '#fff4d8');
    }
    ctx.globalAlpha = a;
  }
  // a vignette, because you are looking out of a hole
  vignetteRect(ctx, 0, 0, W, H, 0.44 * a, '#100c18');
  ctx.globalAlpha = 1;
}

// The phone on the shelf: face up, charging, screen lit, with the alarm
// standing on it in numbers twice the size of anything else.
function mornShelfPhone(ctx, x, base, t, pod, a) {
  const P = MORN_PAL;
  const h = 46, w = 26;
  rect(ctx, x, base - h, w, h, '#15131c');
  rect(ctx, x, base - h, w, 2, '#3a3648');
  rect(ctx, x + 2, base - h + 3, w - 4, h - 7, pod.ringing ? '#1b3a5a' : '#101828');
  // the time, which is the only thing on the screen that matters
  const mins = (pod.snoozes || 0) * 9;
  const clock = '07:' + pad2(mins);
  ctx.globalAlpha = a * (pod.ringing ? 0.7 + 0.3 * Math.sin(t * 8) : 0.5);
  drawText(ctx, clock, x + w / 2, base - h + 12, pod.ringing ? '#ffffff' : '#8aa8c8', { align: 'center', font: 'small' });
  ctx.globalAlpha = a;
  if (pod.ringing) {
    ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(t * 6)));
    rect(ctx, x + 4, base - h + 21, w - 8, 9, P.red);
    drawText(ctx, 'OFF', x + w / 2, base - h + 23, '#fff2e0', { align: 'center', font: 'small' });
    ctx.globalAlpha = a;
  } else {
    rect(ctx, x + 4, base - h + 22, w - 8, 2, '#2a3a52');
    rect(ctx, x + 4, base - h + 27, w - 12, 2, '#2a3a52');
  }
  // the charging lead, going off the edge of the shelf
  rect(ctx, x + w / 2 - 1, base - 3, 2, 3, '#c8c2b4');
  for (let i = 0; i < 9; i++) px(ctx, x + w / 2 + i, base + 1 + Math.sin(i * 0.9) * 2, '#9a9488');
  // the little green charge bead
  ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(t * 1.5));
  rect(ctx, x + w - 8, base - h + 5, 4, 3, P.green);
  ctx.globalAlpha = a;
}

// The alarm. Two notes, a fifth apart, over and over, out of a speaker the
// size of a fingernail. Everybody's phone makes this noise and everybody
// hates their own version of it most.
function mornAlarmBeep() {
  if (!Audio.ctx || Audio.muted) return;
  const now = Audio.ctx.currentTime;
  Audio.note('vox8', 84, now, 0.11, 0.1);
  Audio.note('vox8', 79, now + 0.14, 0.11, 0.09);
  Audio.note('vox8', 84, now + 0.3, 0.11, 0.08);
}

// ============================================================
//  THE CORRIDOR
// ============================================================

// The shell of the floor: wall, suspended ceiling, dado rail, skirting. Same
// building as last night, six hours of daylight later.
function mornShell(ctx, S, t, x0, x1) {
  const P = MORN_PAL;
  rect(ctx, x0, -320, x1 - x0, 900, P.wall);
  // the ceiling tiles, and the tubes, which are still on because nobody has
  // been told they can be off
  rect(ctx, x0, 58, x1 - x0, 46, '#473f58');
  for (let x = Math.floor(x0 / 54) * 54; x < x1; x += 54) {
    rect(ctx, x, 58, 2, 46, '#352f46');
    rect(ctx, x + 2, 60, 50, 42, ((x / 54) | 0) % 5 === 2 ? '#514a66' : '#4b445e');
  }
  rect(ctx, x0, 102, x1 - x0, 4, P.wallLo);
  for (let x = Math.floor(x0 / 360) * 360; x < x1; x += 360) {
    rect(ctx, x + 70, 100, 150, 8, '#5c5570');
    ctx.globalAlpha = 0.72; rect(ctx, x + 74, 102, 142, 5, '#ffeec4'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.05; rect(ctx, x + 50, 108, 190, 120, '#ffeec4'); ctx.globalAlpha = 1;
  }
  // the dado rail and the darker paint under it that every cheap corridor has
  rect(ctx, x0, 338, x1 - x0, 5, P.woodLo);
  rect(ctx, x0, 338, x1 - x0, 2, P.wood);
  ctx.globalAlpha = 0.45; rect(ctx, x0, 343, x1 - x0, MORN_FLOOR - 343, '#241f30'); ctx.globalAlpha = 1;
  rect(ctx, x0, MORN_FLOOR - 15, x1 - x0, 15, '#241f2e');
  rect(ctx, x0, MORN_FLOOR - 15, x1 - x0, 2, '#3c3550');
  ctx.globalAlpha = 0.16; rect(ctx, x0, MORN_FLOOR - 30, x1 - x0, 5, P.steel); ctx.globalAlpha = 1;
}

// Carpet tile in the corridor, hard vinyl at the desk end. Both of them have
// had about nine thousand suitcases over them.
function mornFloor(ctx, S, t, x0, x1) {
  const P = MORN_PAL;
  sideFloor(ctx, x0, x1, MORN_FLOOR, { h: 170, col: P.floor, col2: P.floorLo, tile: 46, lip: P.floorHi, shine: false });
  ctx.save();
  ctx.beginPath(); ctx.rect(340, MORN_FLOOR, 900, 60); ctx.clip();
  rect(ctx, 340, MORN_FLOOR, 900, 60, P.carpet);
  rect(ctx, 340, MORN_FLOOR, 900, 3, P.carpetHi);
  for (let x = 340; x < 1240; x += 40) { ctx.globalAlpha = 0.1; rect(ctx, x, MORN_FLOOR + 3, 1, 50, '#000'); ctx.globalAlpha = 1; }
  // the worn strip down the middle, which is where everybody walks
  ctx.globalAlpha = 0.1; rect(ctx, 340, MORN_FLOOR + 16, 900, 12, '#d8cbb0'); ctx.globalAlpha = 1;
  ctx.restore();
  ctx.globalAlpha = 0.09; sideSheen(ctx, 1240, 1800, MORN_FLOOR, 0.14); ctx.globalAlpha = 1;
}

// The row of capsules you came out of, seen from the corridor: two high, the
// doors in a grid, a number on every one and a light on over about half.
function mornPodWall(ctx, x0, w, t, yours) {
  const P = MORN_PAL;
  const top = 128, ph = 132, pw = 148;
  rect(ctx, x0 - 6, top - 10, w + 12, ph * 2 + 20, '#3a3348');
  rect(ctx, x0 - 6, top - 10, w + 12, 3, '#544b68');
  for (let r = 0; r < 2; r++) for (let c = 0; c * pw < w; c++) {
    const px2 = x0 + c * pw, py = top + r * ph;
    if (px2 + pw > x0 + w) break;
    const n = 214 + r * 4 + c;
    const mine = String(n) === yours;
    rect(ctx, px2 + 3, py + 3, pw - 8, ph - 8, P.podLo);
    rect(ctx, px2 + 5, py + 5, pw - 12, ph - 12, P.pod);
    rect(ctx, px2 + 5, py + 5, pw - 12, 3, P.podHi);
    // the opening, which is a dark rounded hole with a blind over it
    const oy = py + 22, oh = ph - 44, ow = pw - 34;
    rect(ctx, px2 + 17, oy, ow, oh, '#151220');
    const shut = ((n * 7) % 5) < 3;
    if (shut) {
      rect(ctx, px2 + 17, oy, ow, oh, '#b8ae96');
      for (let y = oy + 4; y < oy + oh; y += 8) rect(ctx, px2 + 17, y, ow, 2, '#9a9078');
    } else {
      ctx.globalAlpha = 0.5; rect(ctx, px2 + 21, oy + 6, ow - 8, oh - 12, '#2e2840'); ctx.globalAlpha = 1;
    }
    frame(ctx, px2 + 17, oy, ow, oh, '#6a6254');
    // the number plate and the little occupied lamp
    rect(ctx, px2 + 17, py + 8, 34, 12, mine ? '#c8402c' : '#4a4358');
    drawText(ctx, String(n), px2 + 34, py + 10, '#f4f1ea', { align: 'center', font: 'small' });
    ctx.globalAlpha = shut ? 0.9 : 0.25;
    rect(ctx, px2 + pw - 24, py + 10, 6, 6, shut ? P.red : P.green);
    ctx.globalAlpha = 1;
  }
  // the strip of carpet tape along the bottom edge, curling, walked on by
  // everybody who has ever swung down out of the bottom row
  ctx.globalAlpha = 0.5; rect(ctx, x0 - 6, top + ph * 2 + 12, w + 12, 4, '#1f1b2a'); ctx.globalAlpha = 1;
}

// The window at the quiet end of the corridor. Low sun, a building opposite,
// and one aerial. This is where all the light in the scene comes from.
function mornWindow(ctx, x, yTop, w, h, t) {
  const P = MORN_PAL;
  rect(ctx, x - 8, yTop - 8, w + 16, h + 16, '#4a4358');
  rect(ctx, x - 8, yTop - 8, w + 16, 3, '#655c7a');
  // the sky: white at the bottom where the sun is, blue going up
  vgrad(ctx, x, yTop, w, h, '#9fc4e8', '#ffe6bc');
  // the building over the road, close enough to wave at and nobody ever does
  rect(ctx, x + 6, yTop + h * 0.34, w - 12, h * 0.66, '#7d8798');
  rect(ctx, x + 6, yTop + h * 0.34, w - 12, 3, '#98a2b2');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const wx = x + 14 + c * ((w - 28) / 4), wy = yTop + h * 0.4 + r * 26;
    const lit = ((r * 4 + c) * 5) % 7 < 2;
    rect(ctx, wx, wy, 16, 18, lit ? '#ffe9a8' : '#4e5a6e');
    rect(ctx, wx, wy, 16, 2, lit ? '#fff4d0' : '#5e6a7e');
  }
  // the sun itself, sitting on the roof opposite, doing all the work
  const sy = yTop + h * 0.32;
  ctx.globalAlpha = 0.5; circle(ctx, x + w * 0.62, sy, 34, P.sun); ctx.globalAlpha = 1;
  circle(ctx, x + w * 0.62, sy, 15, '#fff6de');
  // a crow on the aerial, and the aerial
  rect(ctx, x + w * 0.22, yTop + h * 0.2, 2, h * 0.16, '#3a4150');
  for (let i = 0; i < 3; i++) rect(ctx, x + w * 0.22 - 6, yTop + h * 0.22 + i * 5, 14, 1, '#3a4150');
  const hop = Math.sin(t * 0.7) > 0.93 ? 2 : 0;
  ellipsePx(ctx, x + w * 0.22 + 1, yTop + h * 0.2 - 4 - hop, 4, 3, '#1f1c28');
  px(ctx, x + w * 0.22 + 5, yTop + h * 0.2 - 5 - hop, '#2a2636');
  // the glass: frame bars, a diagonal flare, and the grime nobody cleans
  for (let i = 1; i < 3; i++) rect(ctx, x + (w / 3) * i - 2, yTop, 4, h, '#57506a');
  rect(ctx, x, yTop + h * 0.5 - 2, w, 4, '#57506a');
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(x + 10, yTop + h); ctx.lineTo(x + 40, yTop + h); ctx.lineTo(x + w - 14, yTop); ctx.lineTo(x + w - 44, yTop); ctx.fill();
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < h; i += 7) rect(ctx, x, yTop + i, w, 1, '#c8b890');
  ctx.globalAlpha = 1;
  frame(ctx, x, yTop, w, h, '#332d42');
}

// The shaft of light the window throws across the corridor, and the panel of
// it that lands on the carpet. Everything in it goes warm.
function mornShaft(ctx, S, t, x, yTop, w, h) {
  const P = MORN_PAL;
  const fx = x + 70, fw = w + 150;
  ctx.globalAlpha = 0.11;
  ctx.fillStyle = P.sun; ctx.beginPath();
  ctx.moveTo(x, yTop + 10); ctx.lineTo(x + w, yTop + 10);
  ctx.lineTo(fx + fw, MORN_FLOOR); ctx.lineTo(fx, MORN_FLOOR); ctx.fill();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = P.sunHot; ctx.beginPath();
  ctx.moveTo(x + w * 0.34, yTop + 10); ctx.lineTo(x + w * 0.66, yTop + 10);
  ctx.lineTo(fx + fw * 0.7, MORN_FLOOR); ctx.lineTo(fx + fw * 0.3, MORN_FLOOR); ctx.fill();
  ctx.globalAlpha = 1;
  // the bright patch on the floor, with the window bars printed on it
  ctx.globalAlpha = 0.17;
  rect(ctx, fx, MORN_FLOOR, fw, 46, P.sunHot);
  ctx.globalAlpha = 0.1;
  for (let i = 1; i < 3; i++) rect(ctx, fx + (fw / 3) * i - 5, MORN_FLOOR, 10, 46, '#3a2f20');
  rect(ctx, fx, MORN_FLOOR + 20, fw, 6, '#3a2f20');
  ctx.globalAlpha = 1;
  lightPool(ctx, x + w / 2 + 60, MORN_FLOOR - 40, 260, P.sun, 0.09);
}

// ---------- the free coffee ----------
// An urn with a tap, a tower of paper cups, a jar of whitener, and a sign
// asking you to take one. It gurgles about every ten seconds and nobody who
// works here has heard it in years.
function mornUrn(ctx, x, base, t, gurgle) {
  const P = MORN_PAL;
  // the side table it is bolted to
  rect(ctx, x - 62, base - 62, 124, 8, P.wood);
  rect(ctx, x - 62, base - 62, 124, 2, P.woodHi);
  rect(ctx, x - 56, base - 54, 6, 54, P.woodLo);
  rect(ctx, x + 50, base - 54, 6, 54, P.woodLo);
  ctx.globalAlpha = 0.26; ellipsePx(ctx, x, base + 1, 62, 6, '#000'); ctx.globalAlpha = 1;
  // the urn: a brushed steel drum with a black lid and a sight glass
  const uh = 74, uw = 46;
  rect(ctx, x - uw / 2, base - 62 - uh, uw, uh, P.steel);
  hgrad(ctx, x - uw / 2 + 2, base - 62 - uh + 2, uw - 4, uh - 4, P.steelHi, P.steelLo);
  rect(ctx, x - uw / 2, base - 62 - uh, uw, 4, P.steelHi);
  rect(ctx, x - uw / 2 - 3, base - 62 - uh - 8, uw + 6, 9, '#2a2d33');
  rect(ctx, x - 5, base - 62 - uh - 14, 10, 6, '#3a3f46');
  // the sight glass down the side, with the level in it dropping all morning
  rect(ctx, x + uw / 2 - 9, base - 62 - uh + 12, 5, uh - 24, '#1b1b24');
  const lvl = 0.62 + Math.sin(t * 0.3) * 0.02;
  rect(ctx, x + uw / 2 - 8, base - 62 - uh + 12 + (uh - 24) * (1 - lvl), 3, (uh - 24) * lvl, '#5a3a22');
  // the tap, and the drip tray under it with its little grille
  rect(ctx, x - 4, base - 70, 8, 10, '#3a3f46');
  rect(ctx, x - 2, base - 62, 4, 6, P.steelLo);
  rect(ctx, x - 16, base - 54, 32, 5, '#4a5260');
  for (let i = 0; i < 6; i++) rect(ctx, x - 14 + i * 5, base - 54, 2, 5, '#2a2d33');
  // steam, and the shudder when it gurgles
  const g = clamp(gurgle || 0, 0, 1);
  ctx.globalAlpha = 0.14 + g * 0.2;
  for (let i = 0; i < 4; i++) {
    const sy = base - 62 - uh - 16 - i * 9 - (t * 7 % 9);
    ellipsePx(ctx, x + Math.sin(t * 1.2 + i) * 6, sy, 6 - i, 3, '#f4f1ea');
  }
  ctx.globalAlpha = 1;
  // the cups, a leaning tower of them, and the whitener nobody trusts
  for (let i = 0; i < 6; i++) rect(ctx, x + 30 - i * 0.4, base - 68 - i * 4, 15, 6, i % 2 ? '#f0ece2' : '#e2ded2');
  rect(ctx, x + 30, base - 68, 15, 7, '#f4f1ea');
  rect(ctx, x - 48, base - 76, 16, 14, '#d8cdb0');
  rect(ctx, x - 48, base - 78, 16, 3, '#8a7a5a');
  // the sign, laminated, curling at one corner
  rect(ctx, x - 44, base - 100, 52, 20, '#f2eede');
  frame(ctx, x - 44, base - 100, 52, 20, '#b9b2a0');
  drawText(ctx, 'FREE', x - 18, base - 97, '#c8402c', { align: 'center', font: 'small' });
  drawText(ctx, 'TAKE ONE', x - 18, base - 89, '#5a5448', { align: 'center', font: 'small' });
}

// A soft, apologetic gurgle from something that has been on all night.
function mornGurgleSfx() {
  if (!Audio.ctx || Audio.muted) return;
  const now = Audio.ctx.currentTime;
  Audio.note('bass', 31, now, 0.7, 0.04);
  Audio._noise(now + 0.05, 0.5, 'lowpass', 520, 1.1, 0.05);
  Audio.note('bass', 28, now + 0.42, 0.5, 0.03);
}

// ---------- the television ----------
// Bracketed to the wall at an angle nobody can watch comfortably, showing the
// morning weather: a bug in a jacket, a pointer, a shape that is almost a
// country, and a number that decides what everyone wears.
function mornTv(ctx, x, yTop, w, h, t, S) {
  const P = MORN_PAL;
  // the bracket
  rect(ctx, x + w / 2 - 4, yTop - 22, 8, 22, '#3a3f46');
  rect(ctx, x + w / 2 - 14, yTop - 24, 28, 5, '#4a5260');
  // the box
  rect(ctx, x - 5, yTop - 5, w + 10, h + 10, '#1b1b24');
  rect(ctx, x - 5, yTop - 5, w + 10, 3, '#3a3a46');
  rect(ctx, x, yTop, w, h, '#0d1424');
  // the studio: a blue wall, a weather chart, a bug with a stick
  vgrad(ctx, x + 2, yTop + 2, w - 4, h - 4, '#12395e', '#0b2036');
  // the chart: an island shape made of blocks, which is what a map is at
  // this size, with a front drawn over it
  const map = [[10, 6, 8, 5], [16, 11, 10, 6], [24, 16, 12, 7], [34, 22, 10, 6], [40, 28, 7, 5]];
  for (const m of map) {
    rect(ctx, x + m[0], yTop + m[1], m[2], m[3], '#2f7a4a');
    rect(ctx, x + m[0], yTop + m[1], m[2], 1, '#43a85c');
  }
  // sun over the south, a cloud over the north, because that is always the news
  const blink = Math.sin(t * 2) > 0 ? 1 : 0.7;
  ctx.globalAlpha = blink; circle(ctx, x + 40, yTop + 26, 4, '#ffd24a'); ctx.globalAlpha = 1;
  ellipsePx(ctx, x + 18, yTop + 10, 6, 3, '#cfd6de');
  for (let i = 0; i < 3; i++) rect(ctx, x + 15 + i * 4, yTop + 13, 1, 4, '#8ad8ff');
  // the temperature, which is the only readable thing on the screen
  rect(ctx, x + w - 34, yTop + 6, 28, 16, '#0a1828');
  drawText(ctx, '24', x + w - 20, yTop + 9, '#ffd24a', { align: 'center', font: 'small' });
  drawText(ctx, 'C', x + w - 10, yTop + 9, '#8ad8ff', { align: 'center', font: 'small' });
  // the presenter, in a jacket, with the pointer that swings on the beat
  if (S) {
    const sp = mornTvBugSpec();
    drawBugAt(ctx, sp, x + w - 26, yTop + h - 6, { pose: Math.floor(t * 1.6) % 2 ? 'point' : 'idle2', scale: 0.72, bounce: 0.4, phase: 1.3 });
    const a = -0.9 + Math.sin(t * 1.5) * 0.4;
    line(ctx, x + w - 30, yTop + h - 24, x + w - 30 + Math.cos(a) * 18, yTop + h - 24 + Math.sin(a) * 18, '#f4f1ea');
  }
  // the ticker along the bottom, in a language you do not have
  rect(ctx, x + 2, yTop + h - 12, w - 4, 10, '#c8402c');
  const off = (t * 22) % 28;
  for (let i = -1; i < (w - 4) / 14; i++) drawKanaBlock(ctx, x + 4 + i * 14 + (14 - off * 0.5) % 14, yTop + h - 11, 8, '#fff2e0', i + 2);
  // the scanlines and the reflection of the corridor tube in the glass
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < h; i += 3) rect(ctx, x, yTop + i, w, 1, '#000');
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(x + 8, yTop + h); ctx.lineTo(x + 26, yTop + h); ctx.lineTo(x + 62, yTop); ctx.lineTo(x + 44, yTop); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.07; ellipsePx(ctx, x + w / 2, yTop + h + 70, w * 0.8, 46, '#8ad8ff'); ctx.globalAlpha = 1;
}
let _mornTvBug = null, _mornPasser = null;
function mornTvBugSpec() {
  if (!_mornTvBug) {
    _mornTvBug = randomBugSpec(makeRng(hashStr('morning-weather-bug')));
    _mornTvBug.outfit = Object.assign({}, _mornTvBug.outfit || {}, { jacket: '#2f4a8a', shirt: '#f4f1ea' });
  }
  return _mornTvBug;
}
// Whoever walks past the front door. Not the bug off the television: one of
// them is up a mountain in front of a green screen and the other is outside.
function mornPasserSpec() {
  if (!_mornPasser) _mornPasser = randomBugSpec(makeRng(hashStr('morning-passer-by')));
  return _mornPasser;
}

// ---------- the ironing board ----------
// Set up in the corridor because there is nowhere else, with a shirt on it
// that is going to be worn straight off the board.
function mornIroning(ctx, x, base, t) {
  const P = MORN_PAL;
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x, base + 1, 54, 5, '#000'); ctx.globalAlpha = 1;
  // the legs, an X of thin steel
  line(ctx, x - 34, base, x + 14, base - 56, P.steelLo);
  line(ctx, x + 34, base, x - 14, base - 56, P.steelLo);
  rect(ctx, x - 36, base - 3, 6, 3, '#2a2d33'); rect(ctx, x + 30, base - 3, 6, 3, '#2a2d33');
  // the board, padded, with a scorched patch near the pointed end
  const by = base - 62;
  rect(ctx, x - 52, by, 104, 9, '#c8c2b0');
  rect(ctx, x - 52, by, 104, 3, '#e4dfcc');
  rect(ctx, x + 52, by + 1, 10, 7, '#c8c2b0');
  ctx.globalAlpha = 0.3; rect(ctx, x + 22, by + 3, 18, 4, '#a08a60'); ctx.globalAlpha = 1;
  // the shirt: white, half pressed, one sleeve hanging off the side
  rect(ctx, x - 40, by - 12, 56, 12, '#f4f1ea');
  rect(ctx, x - 40, by - 12, 56, 2, '#ffffff');
  ctx.globalAlpha = 0.25; rect(ctx, x - 40, by - 4, 56, 3, '#b9b2a0'); ctx.globalAlpha = 1;
  rect(ctx, x - 44, by - 2, 10, 16, '#eeeadf');
  rect(ctx, x - 16, by - 16, 12, 5, '#e6e2d6');
  // the iron, being pushed, with steam off the nose of it
  const push = Math.sin(t * 1.6) * 14;
  const ix = x - 6 + push;
  rect(ctx, ix - 11, by - 20, 22, 8, '#4a5260');
  rect(ctx, ix - 13, by - 13, 26, 4, '#8a8f98');
  rect(ctx, ix - 13, by - 13, 26, 1, '#c2c8d0');
  rect(ctx, ix - 4, by - 26, 10, 7, '#2a2d33');
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 3; i++) ellipsePx(ctx, ix + 14 + i * 5, by - 22 - i * 5 - (t * 6 % 6), 5 - i, 3, '#ffffff');
  ctx.globalAlpha = 1;
  // the flex, trailing off to a socket somewhere down the corridor
  for (let i = 0; i < 26; i++) px(ctx, ix - 13 - i, by - 11 + Math.sin(i * 0.4) * 3 + i * 0.4, '#3a3428');
}

// ---------- the lockers ----------
// Where your bag went last night, and where you are going to stand and decide
// what you look like today.
function mornLockers(ctx, x, base, w, t, open) {
  const P = MORN_PAL;
  const h = 168, y = base - h;
  rect(ctx, x, y, w, h, '#3f5a6a');
  rect(ctx, x, y, w, 4, '#5c7f92');
  rect(ctx, x, base - 6, w, 6, '#2a3d4a');
  const cols = Math.floor(w / 56);
  for (let c = 0; c < cols; c++) {
    const dx = x + 4 + c * ((w - 8) / cols), dw = (w - 8) / cols - 4;
    for (let r = 0; r < 2; r++) {
      const dy = y + 6 + r * ((h - 16) / 2), dh = (h - 16) / 2 - 4;
      const mine = c === 1 && r === 0;
      const ajar = mine && open > 0.02;
      rect(ctx, dx, dy, dw, dh, ajar ? '#22323c' : '#47677a');
      rect(ctx, dx, dy, dw, 2, ajar ? '#33495a' : '#6a90a4');
      if (ajar) {
        // the door swung back, and the inside of it: a mirror, a hook, a bag
        rect(ctx, dx + dw - 6, dy, 8, dh, '#5c7f92');
        rect(ctx, dx + 5, dy + 5, dw - 14, dh - 12, '#18242c');
        rect(ctx, dx + 8, dy + dh - 26, dw - 22, 20, '#5a3a2a');
        rect(ctx, dx + 8, dy + dh - 26, dw - 22, 3, '#7a5a40');
      } else {
        // the vent slots and the little round lock with a number on it
        for (let i = 0; i < 3; i++) rect(ctx, dx + 6, dy + 8 + i * 5, dw - 12, 2, '#33505f');
        circle(ctx, dx + dw / 2, dy + dh - 16, 5, '#2a3d4a');
        circle(ctx, dx + dw / 2, dy + dh - 16, 3, '#c9c3b0');
        drawText(ctx, String(11 + c * 2 + r), dx + dw / 2, dy + dh - 32, '#cfe0e8', { align: 'center', font: 'small' });
      }
    }
  }
  // a mirror screwed to the end of the run, because there is nowhere else
  rect(ctx, x + w - 2, y + 24, 5, 92, '#8a7a5a');
  ctx.globalAlpha = 0.24; rect(ctx, x + w + 3, y + 26, 2, 88, '#dff0ff'); ctx.globalAlpha = 1;
}

// ---------- the noticeboard ----------
// Six rules, a bus timetable, a poster for a live house nobody here goes to,
// and one card in English somebody put up years ago.
function mornBoard(ctx, x, base, w, h, t) {
  const y = base - h;
  rect(ctx, x - 4, y - 4, w + 8, h + 8, MORN_PAL.woodLo);
  rect(ctx, x, y, w, h, '#8a7a56');
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < w; i += 3) rect(ctx, x + i, y, 1, h, '#5a4a30');
  ctx.globalAlpha = 1;
  const pin = function (px2, py, pw, ph, col) {
    ctx.globalAlpha = 0.25; rect(ctx, px2 + 2, py + 2, pw, ph, '#000'); ctx.globalAlpha = 1;
    rect(ctx, px2, py, pw, ph, col);
    rect(ctx, px2, py, pw, 2, lighten(col, 0.3));
    circle(ctx, px2 + pw / 2, py + 3, 2, '#c8402c');
  };
  pin(x + 8, y + 10, 62, 46, '#f2eede');
  for (let i = 0; i < 5; i++) rect(ctx, x + 12, y + 20 + i * 7, 52 - i * 6, 2, '#8a8478');
  pin(x + 78, y + 14, 54, 38, '#dfe8f0');
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) drawText(ctx, pad2((6 + r * 2) % 24), x + 82 + c * 13, y + 20 + r * 8, '#3a4a5a', { font: 'small' });
  pin(x + 140, y + 8, 46, 56, '#c8402c');
  drawText(ctx, 'LIVE', x + 163, y + 18, '#ffd24a', { align: 'center', font: 'small' });
  neonStrip(ctx, x + 152, y + 28, 22, 28, '#ffd24a', t, 41);
  // the English card, biro, taped on: the one thing you can read
  pin(x + 8, y + 62, 110, 20, '#fdf6d8');
  drawText(ctx, 'NO PLAYING IN THE', x + 12, y + 66, '#3a4a6a', { font: 'small' });
  drawText(ctx, 'CORRIDOR. THANK YOU.', x + 12, y + 73, '#3a4a6a', { font: 'small' });
}

// ---------- the front desk, minus the clerk ----------
function mornDesk(ctx, x, base, w, t) {
  const P = MORN_PAL;
  const h = 62, y = base - h;
  rect(ctx, x, y, w, h, P.wood);
  rect(ctx, x, y, w, 5, P.woodHi);
  rect(ctx, x, base - 8, w, 8, P.woodLo);
  ctx.globalAlpha = 0.18; rect(ctx, x + 6, y + 10, w - 12, h - 22, '#000'); ctx.globalAlpha = 1;
  // the bell, the pen on a string, the tray of leaflets nobody takes
  circle(ctx, x + 26, y - 6, 8, '#c8a03a');
  circle(ctx, x + 26, y - 8, 6, '#ffd97a');
  rect(ctx, x + 22, y - 1, 9, 3, '#8a6a1a');
  rect(ctx, x + 54, y - 3, 3, 3, '#3a3f46');
  for (let i = 0; i < 8; i++) px(ctx, x + 55 + i * 0.4, y - i, '#6a6478');
  rect(ctx, x + 78, y - 6, 44, 7, '#3f6f8a');
  rect(ctx, x + 80, y - 10, 40, 5, '#f2eede');
  rect(ctx, x + 82, y - 13, 36, 4, '#e8e2d2');
  // a sign on the counter with a bell-hours line on it
  rect(ctx, x + w - 78, y - 26, 62, 24, '#f2eede');
  frame(ctx, x + w - 78, y - 26, 62, 24, '#b9b2a0');
  drawText(ctx, 'BACK AT', x + w - 47, y - 22, '#5a5448', { align: 'center', font: 'small' });
  drawText(ctx, '09:00', x + w - 47, y - 13, '#c8402c', { align: 'center', font: 'small' });
  // the key rack behind, with more hooks empty than last night
  const rx = x + 14, ry = y - 106, rw = w - 28, rh = 68;
  rect(ctx, rx, ry, rw, rh, P.woodLo);
  rect(ctx, rx + 2, ry + 2, rw - 4, rh - 4, P.wood);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) {
    const kx = rx + 8 + c * ((rw - 16) / 8), ky = ry + 8 + r * ((rh - 12) / 3);
    rect(ctx, kx, ky, 2, 3, '#c9c3b0');
    if (((r * 8 + c) * 3) % 5 < 2) continue;
    rect(ctx, kx - 3, ky + 3, 9, 11, '#d8c9a4');
    rect(ctx, kx - 3, ky + 3, 9, 1, '#f0e4c4');
  }
}

// ---------- the way out ----------
function mornExitDoor(ctx, x, base, t) {
  const P = MORN_PAL;
  const w = 108, h = 152, y = base - h;
  rect(ctx, x - w / 2 - 8, y - 8, w + 16, h + 8, '#4a4358');
  rect(ctx, x - w / 2, y, w, h, '#1b2432');
  // the glass, with the street behind it: white, and a bit of pavement
  vgrad(ctx, x - w / 2 + 6, y + 6, w - 12, h - 12, '#fff2d0', '#cfd8dc');
  ctx.globalAlpha = 0.5;
  rect(ctx, x - w / 2 + 6, y + h - 46, w - 12, 40, '#9aa2a8');
  rect(ctx, x - w / 2 + 6, y + h - 46, w - 12, 3, '#c2c8cc');
  ctx.globalAlpha = 1;
  // somebody going past outside, every so often, as a silhouette
  const pass = ((t * 26) % 260) - 40;
  if (pass > -30 && pass < w) {
    ctx.save(); ctx.beginPath(); ctx.rect(x - w / 2 + 6, y + 6, w - 12, h - 12); ctx.clip();
    ctx.globalAlpha = 0.34;
    drawBugAt(ctx, mornPasserSpec(), x - w / 2 + pass, y + h - 12, { pose: Math.floor(t * 6) % 2 ? 'walk1' : 'walk2', scale: 1.1, bounce: 0.7, alpha: 0.5 });
    ctx.globalAlpha = 1; ctx.restore();
  }
  rect(ctx, x - 3, y + 6, 6, h - 12, '#2a3442');
  rect(ctx, x - w / 2 + 6, y + 6, w - 12, 3, '#8a939e');
  rect(ctx, x - 24, y + h * 0.5, 12, 3, '#c9c3b0');
  rect(ctx, x + 12, y + h * 0.5, 12, 3, '#c9c3b0');
  // the green running-bug sign over the top, which every building on earth has
  rect(ctx, x - 30, y - 36, 60, 26, '#0e3a24');
  frame(ctx, x - 30, y - 36, 60, 26, '#1f6f4a');
  ctx.globalAlpha = 0.9;
  ellipsePx(ctx, x - 14, y - 27, 4, 4, '#6be585');
  rect(ctx, x - 16, y - 22, 6, 8, '#6be585');
  rect(ctx, x - 8, y - 20, 7, 3, '#6be585');
  drawText(ctx, 'EXIT', x + 12, y - 27, '#6be585', { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.12; ellipsePx(ctx, x, base - 10, 76, 30, '#fff2d0'); ctx.globalAlpha = 1;
  // the umbrella stand by the door, holding four of somebody else's umbrellas
  rect(ctx, x + 74, base - 34, 22, 34, '#3a4250');
  rect(ctx, x + 74, base - 34, 22, 3, '#5a626e');
  for (let i = 0; i < 4; i++) {
    rect(ctx, x + 78 + i * 4, base - 62 + i * 2, 3, 30, ['#c8402c', '#2f4a8a', '#3a3440', '#2f7a4a'][i]);
    rect(ctx, x + 77 + i * 4, base - 64 + i * 2, 5, 3, '#6a6478');
  }
}

// ---------- the slippers ----------
// Rows of them, all the same, all facing the wall, which is somehow the
// saddest thing in the building.
function mornSlippers(ctx, x, base, n, t) {
  for (let i = 0; i < n; i++) {
    const sx = x + i * 26, lift = (i % 3 === 1) ? 1 : 0;
    ctx.globalAlpha = 0.2; ellipsePx(ctx, sx + 8, base + 1, 10, 3, '#000'); ctx.globalAlpha = 1;
    rect(ctx, sx, base - 6 - lift, 18, 6, i % 2 ? '#c8b8a0' : '#bfae96');
    rect(ctx, sx, base - 6 - lift, 18, 2, '#e0d4bc');
    rect(ctx, sx + 1, base - 10 - lift, 11, 5, '#8a7a62');
    rect(ctx, sx + 1, base - 10 - lift, 11, 1, '#a89678');
  }
}

// ---------- the wall furniture ----------
// A corridor is not a colour, it is the things screwed to it. This is the run
// between the capsules and the front desk: the staff door with the keypad, the
// aircon box that drips into a takeaway tub, the hose reel behind glass, the
// sockets the iron is plugged into, the laundry trolley, the wall phone that
// only dials the desk, and forty years of suitcase corners along the dado.
function mornWallKit(ctx, t) {
  const P = MORN_PAL, F = MORN_FLOOR;

  // ---- the staff door, between the last capsule and the window
  const dx = 780, dw = 58, dh = 176, dy = F - dh;
  rect(ctx, dx - 5, dy - 6, dw + 10, dh + 6, '#3a3348');
  rect(ctx, dx - 5, dy - 6, dw + 10, 3, '#544b68');
  rect(ctx, dx, dy, dw, dh, '#4a4258');
  rect(ctx, dx, dy, dw, 3, '#665c7e');
  rect(ctx, dx + 6, dy + 8, dw - 12, 62, '#413a4f');
  rect(ctx, dx + 6, dy + 80, dw - 12, 62, '#413a4f');
  ctx.globalAlpha = 0.3; rect(ctx, dx + 6, dy + 8, dw - 12, 2, '#000'); rect(ctx, dx + 6, dy + 80, dw - 12, 2, '#000'); ctx.globalAlpha = 1;
  rect(ctx, dx + dw - 14, dy + 86, 8, 4, '#c9c3b0');                 // the lever handle
  rect(ctx, dx + dw - 16, dy + 72, 11, 14, '#2a2d33');               // the keypad
  for (let i = 0; i < 6; i++) rect(ctx, dx + dw - 14 + (i % 2) * 5, dy + 75 + ((i / 2) | 0) * 4, 3, 3, i === 2 ? '#6be585' : '#5a606a');
  rect(ctx, dx + 8, dy + 22, 34, 12, '#f2eede');                     // STAFF, taped on
  frame(ctx, dx + 8, dy + 22, 34, 12, '#b9b2a0');
  drawText(ctx, 'STAFF', dx + 25, dy + 25, '#5a5448', { align: 'center', font: 'small' });
  ctx.globalAlpha = 0.24; rect(ctx, dx - 8, F - 3, dw + 16, 3, '#000'); ctx.globalAlpha = 1;

  // ---- the aircon box, high, on brackets, with a tub under the drip
  const ax = 1016, ay = 136, aw = 86, ah = 40;
  rect(ctx, ax, ay, aw, ah, '#cfc9ba');
  rect(ctx, ax, ay, aw, 4, '#e8e2d2');
  rect(ctx, ax, ay + ah - 4, aw, 4, '#9a9488');
  for (let i = 0; i < 9; i++) { ctx.globalAlpha = 0.5; rect(ctx, ax + 8, ay + 10 + i * 3, aw - 16, 1, '#7a7468'); ctx.globalAlpha = 1; }
  rect(ctx, ax + aw - 26, ay + 6, 8, 5, '#3a3f46');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2.2); rect(ctx, ax + aw - 24, ay + 7, 4, 3, '#6be585'); ctx.globalAlpha = 1;
  rect(ctx, ax + 12, ay + ah, 5, 9, '#8a8f98'); rect(ctx, ax + aw - 17, ay + ah, 5, 9, '#8a8f98');
  // the pipe, taped, going down the wall into a hole nobody made neatly
  for (let i = 0; i < 26; i++) rect(ctx, ax + aw - 10 + Math.sin(i * 0.5) * 2, ay + ah + i * 5, 5, 5, i % 5 === 3 ? '#b9b2a0' : '#6a6478');
  // a drip, on its own slow clock, landing in the tub
  const drip = (t * 0.6) % 1;
  rect(ctx, ax + 26, ay + ah + drip * (F - ay - ah - 16), 2, 4, '#9fd8ff');
  rect(ctx, ax + 18, F - 12, 22, 12, '#e8e2d2');
  rect(ctx, ax + 18, F - 12, 22, 2, '#f6f2e4');
  ctx.globalAlpha = 0.5; rect(ctx, ax + 20, F - 6, 18, 5, '#8ad8ff'); ctx.globalAlpha = 1;

  // ---- the hose reel, behind a glass door, the way a building has to
  const hx = 1030, hy = 206, hw = 56, hh = 76;
  rect(ctx, hx - 4, hy - 4, hw + 8, hh + 8, '#8a2a20');
  rect(ctx, hx - 4, hy - 4, hw + 8, 3, '#b03c2c');
  rect(ctx, hx, hy, hw, hh, '#24202e');
  for (let r = 19; r > 6; r -= 4) ringPx(ctx, hx + hw / 2, hy + hh / 2, r, r % 8 === 3 ? '#c8402c' : '#a8342a');
  circle(ctx, hx + hw / 2, hy + hh / 2, 7, '#5a606a');
  circle(ctx, hx + hw / 2, hy + hh / 2, 4, '#8a8f98');
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#ffffff'; ctx.beginPath();
  ctx.moveTo(hx + 4, hy + hh); ctx.lineTo(hx + 22, hy + hh); ctx.lineTo(hx + hw - 4, hy); ctx.lineTo(hx + hw - 22, hy); ctx.fill();
  ctx.globalAlpha = 1;
  frame(ctx, hx, hy, hw, hh, '#5a5468');
  drawText(ctx, 'HOSE', hx + hw / 2, hy + hh + 6, '#c8402c', { align: 'center', font: 'small' });

  // ---- the sockets, and the flex the iron has been plugged into for years
  rect(ctx, 968, F - 62, 20, 26, '#e0dacc');
  rect(ctx, 968, F - 62, 20, 2, '#f4f0e4');
  for (let i = 0; i < 2; i++) { rect(ctx, 971 + i * 9, F - 56, 6, 9, '#3a3444'); rect(ctx, 972 + i * 9, F - 54, 1, 4, '#c9c3b0'); rect(ctx, 975 + i * 9, F - 54, 1, 4, '#c9c3b0'); }
  ctx.globalAlpha = 0.9;
  for (let i = 0; i < 40; i++) px(ctx, 978 + i * 0.9, F - 36 + Math.sin(i * 0.3) * 5 + i * 0.32, '#3a3428');
  ctx.globalAlpha = 1;

  // ---- the laundry trolley, parked where it is always parked
  const tx = 1452, tb = F;
  ctx.globalAlpha = 0.26; ellipsePx(ctx, tx, tb + 1, 46, 5, '#000'); ctx.globalAlpha = 1;
  rect(ctx, tx - 42, tb - 62, 84, 52, '#5a6470');
  rect(ctx, tx - 42, tb - 62, 84, 4, '#7c8896');
  rect(ctx, tx - 42, tb - 14, 84, 4, '#3f4752');
  for (let i = 0; i < 5; i++) rect(ctx, tx - 36 + i * 18, tb - 56, 3, 40, '#47505c');
  // the sheets in it, going grey a wash at a time
  ctx.fillStyle = '#e4e0d4'; ctx.beginPath();
  ctx.moveTo(tx - 38, tb - 58); ctx.lineTo(tx - 22, tb - 74); ctx.lineTo(tx + 4, tb - 66);
  ctx.lineTo(tx + 26, tb - 78); ctx.lineTo(tx + 38, tb - 58); ctx.fill();
  ctx.globalAlpha = 0.3; rect(ctx, tx - 30, tb - 66, 40, 3, '#a8a49a'); ctx.globalAlpha = 1;
  for (let i = -1; i <= 1; i += 2) { circle(ctx, tx + i * 30, tb - 5, 5, '#2a2d33'); circle(ctx, tx + i * 30, tb - 5, 2, '#6a7079'); }

  // ---- the wall phone, cream, with one number written beside it in pencil
  const px0 = 1160, py0 = 274;
  rect(ctx, px0, py0, 26, 44, '#e6dfcc');
  rect(ctx, px0, py0, 26, 3, '#f6f2e4');
  rect(ctx, px0 + 4, py0 + 8, 18, 14, '#c9c2ae');
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) rect(ctx, px0 + 6 + c * 6, py0 + 10 + r * 4, 4, 3, '#8a8478');
  rect(ctx, px0 - 8, py0 + 4, 9, 30, '#dad3c0');                      // the handset on its hook
  rect(ctx, px0 - 8, py0 + 4, 9, 3, '#f0ead8');
  for (let i = 0; i < 12; i++) px(ctx, px0 - 4 + Math.sin(i * 0.9) * 4, py0 + 34 + i * 2, '#b9b2a0');
  drawText(ctx, '9 FOR DESK', px0 - 10, py0 - 10, '#7d7691', { font: 'small' });

  // ---- and the damage: suitcase corners along the dado, all the way down
  for (let x = 240; x < 1700; x += 37) {
    const k = ((x * 7) % 11);
    if (k > 6) continue;
    ctx.globalAlpha = 0.14 + (k % 3) * 0.04;
    rect(ctx, x, F - 46 + (k % 4) * 3, 8 + k, 3, '#0d0a14');
    ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.1;
  for (let x = 200; x < 1740; x += 23) rect(ctx, x, F - 18 + ((x * 3) % 5), 11, 2, '#d8cbb0');
  ctx.globalAlpha = 1;
}

// ============================================================
//  THE SCENE
// ============================================================

function mornDef(opts) {
  const O = opts || {};
  const P = MORN_PAL;
  const startPod = O.phase !== 'corridor' && !mornUpAlready();
  return {
    name: 'CAPSULE ' + MORN_NUM, sub: 'TOKYO - DAY ONE - 07:00',
    tint: '#3f5a6a',
    w: MORN_W, zoom: 1, yBias: 0.66,
    hud: false, canLeave: false, freeFloors: false,
    heroScale: 1.6,
    start: { x: O.at != null ? O.at : 168, floor: 0 },
    floors: [{ y: MORN_FLOOR, z: 1 }],
    sky: ['#221d30', '#171322'],

    init: function (S) {
      S.mo = {
        phase: startPod ? 'pod' : 'corridor',
        pod: { k: startPod ? 1 : 0, blind: 0, ringing: startPod, snoozes: 0, beat: 0, up: false, t: 0 },
        step: startPod ? 'wake' : 'free',
        wait: startPod ? 1.1 : 0,
        gurgle: 0, gurgleT: 3.4,
        tvT: 6, dust: [],
        toGoals: false, toDress: false,
        rng: makeRng(hashStr('morning' + ((Game.run && Game.run.day) || 0))),
      };
      const r = S.mo.rng;
      // the shaft falls from the window at 856 onto the carpet around 1200,
      // so that is where the dust has to be
      for (let i = 0; i < 46; i++) S.mo.dust.push({
        x: r.range(872, 1204), y: r.range(150, MORN_FLOOR), vx: r.range(-4, 5), vy: r.range(-9, -1), s: r.range(0.7, 2.1), p: r.range(0, 6.3),
      });
      if (startPod) { S.locked = 999; mornAlarmBeep(); }
      else if (O.said) S.flash(O.said, 3.2);
    },

    // ---------- painters ----------
    back: function (ctx, S, t) {
      // There used to be a parallax far wall here. mornShell paints an opaque
      // rectangle over the whole world, so not one pixel of it was ever seen.
      // What the sky layer is actually for in an interior is the colour the
      // room sits in, so that is all it does now.
      vgrad(ctx, 0, 0, W, H, '#241f33', '#15111f');
      ctx.globalAlpha = 0.16; rect(ctx, 0, H * 0.62, W, H * 0.38, '#0b0812'); ctx.globalAlpha = 1;
    },

    mid: function (ctx, S, t) {
      mornShell(ctx, S, t, -200, MORN_W + 200);
      mornPodWall(ctx, 56, 720, t, MORN_NUM);
      mornWindow(ctx, 856, 132, 168, 190, t);
      mornFloor(ctx, S, t, -200, MORN_W + 200);
      mornWallKit(ctx, t);
      mornShaft(ctx, S, t, 856, 132, 168, 190);
      // the little signs the building talks to you with, hung off one rail
      rect(ctx, 1286, 146, 128, 6, '#4a4358');
      rect(ctx, 1286, 146, 128, 2, '#6a6284');
      rect(ctx, 1294, 152, 3, 6, '#3a3348');
      rect(ctx, 1332, 152, 3, 6, '#3a3348');
      neonStrip(ctx, 1296, 156, 16, 64, '#8ad8ff', t, 19);
      neonStrip(ctx, 1318, 156, 16, 48, '#ffd24a', t, 23);
      ctx.globalAlpha = 0.07;
      rect(ctx, 1280, 160, 60, 150, '#8ad8ff');
      ctx.globalAlpha = 1;
    },

    fore: function (ctx, S, t) {
      // dust in the shaft: slow, stupid, beautiful. It lives where the sun
      // actually is - it used to drift about four hundred pixels to the left
      // of the window, in the dark, doing nothing for anybody.
      const M = S.mo; if (!M) return;
      for (const d of M.dust) {
        const a = 0.1 + 0.26 * (0.5 + 0.5 * Math.sin(t * 1.6 + d.p));
        ctx.globalAlpha = a * clamp((MORN_FLOOR - d.y) / 260, 0.2, 1);
        rect(ctx, d.x, d.y, Math.max(1, Math.round(d.s)), Math.max(1, Math.round(d.s)), '#fff0cc');
      }
      ctx.globalAlpha = 1;
      // a pillar down the near side of the frame, to sell the corridor. It is
      // a boxed-in service riser, so it gets a capital, a base, an inspection
      // plate and the extinguisher every riser in the country wears.
      const px1 = 1198, pw1 = 28, pt = 52, pb = MORN_FLOOR + 8;
      rect(ctx, px1, pt, pw1, pb - pt, '#2a2436');
      rect(ctx, px1, pt, 6, pb - pt, '#3f3654');
      rect(ctx, px1 + pw1 - 5, pt, 5, pb - pt, '#1b1726');
      rect(ctx, px1 - 6, pt, pw1 + 12, 12, '#342c46');
      rect(ctx, px1 - 6, pt, pw1 + 12, 3, '#483f5e');
      rect(ctx, px1 - 7, MORN_FLOOR - 22, pw1 + 14, 22, '#231e30');
      rect(ctx, px1 - 7, MORN_FLOOR - 22, pw1 + 14, 3, '#3a3350');
      // the inspection plate, four screws, never opened
      rect(ctx, px1 + 7, 214, 17, 42, '#3a3348');
      frame(ctx, px1 + 7, 214, 17, 42, '#211c2d');
      for (let i = 0; i < 4; i++) px(ctx, px1 + 9 + (i % 2) * 13, 216 + ((i / 2) | 0) * 38, '#6a6278');
      // the extinguisher, on its bracket, with its little tag
      rect(ctx, px1 - 12, 300, 11, 30, '#a8281e');
      rect(ctx, px1 - 12, 300, 11, 3, '#d8463a');
      rect(ctx, px1 - 10, 292, 7, 9, '#2a2d33');
      rect(ctx, px1 - 14, 296, 5, 3, '#5a606a');
      rect(ctx, px1 - 12, 310, 11, 7, '#e8e2d2');
      rect(ctx, px1 - 13, 306, 13, 3, '#3a3f46');
      ctx.globalAlpha = 0.3; rect(ctx, px1 - 3, 302, 3, 26, '#000'); ctx.globalAlpha = 1;
    },

    after: function (ctx, S, t) {
      const M = S.mo; if (!M) return;
      // the morning grade: everything a half-step warmer than it deserves
      grade(ctx, 0, 0, W, H, '#ffb45a', 0.07, 'overlay');
      if (M.phase === 'corridor') {
        vignette(ctx, 0.36, '#0d0a16');
        if (Game.run) Game.drawHud(ctx);
      }
      if (M.pod.k > 0.002) mornCapsuleIn(ctx, S, t, M.pod);
    },

    overlay: function (ctx, S, t) {
      const M = S.mo; if (!M) return;
      // the clock, top right, while you are still lying down
      if (M.phase === 'pod') {
        const mins = M.pod.snoozes * 9;
        const lab = '07:' + pad2(mins);
        rect(ctx, W - 106, 16, 90, 30, 'rgba(8,6,14,0.7)');
        frame(ctx, W - 106, 16, 90, 30, '#4a4358');
        drawText(ctx, lab, W - 61, 24, M.pod.ringing ? '#e8503a' : '#cfc9e6', { align: 'center', scale: 2 });
        if (M.pod.snoozes) drawText(ctx, 'SNOOZED ' + M.pod.snoozes, W - 61, 50, '#8a82a8', { align: 'center', font: 'small' });
      }
    },

    // ---------- props ----------
    props: [
      { kind: 'mo_ladder', x: 96, y: MORN_FLOOR, w: 50, h: 312 },
      { kind: 'mo_slippers', x: 300, w: 160, h: 14 },
      { kind: 'sign', x: 300, y: 250, w: 118, h: 30, col: '#1f6f4a', text: 'WASH', arrow: -1, over: true },
      { kind: 'bin', x: 430, w: 30, h: 44 },
      { kind: 'mo_urn', x: 560, w: 130, h: 110, label: 'COFFEE', act: 'coffee', reach: 46 },
      { kind: 'table', x: 712, w: 96, h: 40, col: '#7a5a3a' },
      { kind: 'stool', x: 668, w: 26, h: 34 },
      { kind: 'stool', x: 758, w: 26, h: 34 },
      { kind: 'mo_tv', x: 900, y: 200, w: 132, h: 96, label: 'WATCH', act: 'tv', over: true, reach: 70 },
      { kind: 'mo_iron', x: 1010, w: 110, h: 70 },
      { kind: 'vending', x: 1130, w: 56, h: 108, label: 'LOOK', act: 'vending' },
      { kind: 'mo_lockers', x: 1300, w: 172, h: 168, label: 'GET DRESSED', act: 'dress', reach: 62 },
      { kind: 'mo_board', x: 1470, y: 300, w: 200, h: 92, label: 'READ', act: 'board' },
      { kind: 'mo_desk', x: 1600, w: 180, h: 62 },
      { kind: 'plant', x: 1660, w: 34, h: 54 },
      { kind: 'mo_exit', x: MORN_EXIT_X, w: 120, h: 152, label: 'GO OUTSIDE', act: 'leave', reach: 56 },
    ],

    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'mo_ladder': {
          // it has to reach the top row, which is the whole reason it is here
          const lh = p.h, top = base - lh;
          rect(ctx, p.x - 18, top, 5, lh, MORN_PAL.steel);
          rect(ctx, p.x - 18, top, 2, lh, MORN_PAL.steelHi);
          rect(ctx, p.x + 14, top, 5, lh, MORN_PAL.steel);
          rect(ctx, p.x + 14, top, 2, lh, MORN_PAL.steelHi);
          for (let i = 0; i * 24 < lh - 10; i++) {
            const ry = top + 10 + i * 24;
            rect(ctx, p.x - 18, ry, 37, 4, MORN_PAL.steelHi);
            rect(ctx, p.x - 18, ry + 3, 37, 2, MORN_PAL.steelLo);
            ctx.globalAlpha = 0.22; rect(ctx, p.x - 18, ry + 5, 37, 2, '#000'); ctx.globalAlpha = 1;
          }
          // the bolts into the wall, and the rubber foot that has flattened
          for (let i = 0; i < 3; i++) { const by = top + 20 + i * (lh / 3); rect(ctx, p.x - 24, by, 6, 8, '#3a3f46'); rect(ctx, p.x + 19, by, 6, 8, '#3a3f46'); }
          rect(ctx, p.x - 20, base - 4, 9, 4, '#1f1c26');
          rect(ctx, p.x + 12, base - 4, 9, 4, '#1f1c26');
          return true;
        }
        case 'mo_slippers': mornSlippers(ctx, p.x - p.w / 2, base, 6, t); return true;
        case 'mo_urn': mornUrn(ctx, p.x, base, t, S.mo ? S.mo.gurgle : 0); return true;
        case 'mo_tv': mornTv(ctx, p.x - p.w / 2, p.y - p.h, p.w, p.h, t, S); return true;
        case 'mo_iron': mornIroning(ctx, p.x, base, t); return true;
        case 'mo_lockers': mornLockers(ctx, p.x - p.w / 2, base, p.w, t, (Game.run && Game.run.outfit && Game.run.outfit.top) ? 0 : 1); return true;
        case 'mo_board': mornBoard(ctx, p.x - p.w / 2, p.y, p.w, p.h, t); return true;
        case 'mo_desk': mornDesk(ctx, p.x - p.w / 2, base, p.w, t); return true;
        case 'mo_exit': mornExitDoor(ctx, p.x, base, t); return true;
      }
      return false;
    },

    // ---------- the other guests ----------
    npcs: [
      {
        name: 'BUSKER', x: 646, floor: 0, voice: 'barista', carry: 'case', scale: 1.45,
        tag: [
          'MORNING. YOU ARE NEW.',
          'THE COFFEE IS FREE AND IT TASTES LIKE IT.',
          'DO NOT SET UP BY THE STATION MOUTH.',
          'THEY MOVE YOU ON BY TEN.',
        ],
      },
      {
        name: 'SALARY BUG', x: 742, floor: 0, voice: 'guard', scale: 1.4, pose: 'sad',
        tag: ['...', 'SORRY. I AM NOT AWAKE YET.', 'TALK TO ME AFTER THE TRAIN.'],
      },
      {
        name: 'IRONING BUG', x: 1062, floor: 0, voice: 'oldman', scale: 1.45, pose: 'play',
        tag: [
          'ONE SHIRT. EVERY MORNING.',
          'IT IS THE SAME SHIRT.',
          'IT IS NOT THE SAME MORNING.',
        ],
      },
      { name: 'CLEANER', x: 1420, floor: 0, voice: 'clerk', scale: 1.4, carry: 'tray', walk: [1380, 1520], speed: 22, tag: 'CHECKOUT IS TEN. NOT TEN PAST.' },
    ],

    // ---------- what the button does ----------
    use: function (S, p) {
      const r = Game.run;
      switch (p.act) {
        case 'coffee': {
          if (S.mo.coffee) { S.flash('THAT WAS ENOUGH COFFEE.'); Audio.ui('error'); return; }
          S.mo.coffee = true;
          mornGurgleSfx(); Audio.ui('eat');
          if (r) { r.rest(18); r.save(); }
          S.body.carry = 'coffee';
          S.fx.burst(p.x, S.propY(p) - 130, 8, { color: ['#f4f1ea', '#cfc9b0'], speed: 22, life: 1.2, gravity: -16, size: 2 });
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'IT IS HOT AND IT IS BROWN.' },
            { who: '', voice: false, at: 'you', think: true, text: 'THAT IS AS FAR AS IT GOES.' },
          ], function () { S.flash('FREE COFFEE.  +18 STAMINA'); });
          return;
        }
        case 'tv': {
          Voice.say('AND IT STAYS DRY UNTIL THE EVENING', 'tv', { gain: 0.5, speed: 0.85 });
          S.run([
            { who: 'TV', voice: 'tv', at: { x: 900, y: 190 }, text: 'TWENTY FOUR TODAY. DRY UNTIL SIX.' },
            { who: '', voice: false, at: 'you', think: true, text: 'SO PLAY OUTSIDE UNTIL SIX.' },
          ]);
          if (r) { r.weather = 'clear'; r.save(); }
          return;
        }
        case 'vending': {
          S.say('', 'EVERYTHING IN IT COSTS MORE THAN THE COFFEE THAT IS FREE.', false);
          return;
        }
        case 'board': {
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'A TIMETABLE. SIX RULES.' },
            { who: '', voice: false, at: 'you', think: true, text: 'AND ONE CARD IN ENGLISH:' },
            { who: '', voice: false, at: 'you', text: 'NO PLAYING IN THE CORRIDOR.' },
            { who: '', voice: false, at: 'you', think: true, text: 'SOMEBODY LEARNED THAT THE HARD WAY.' },
          ]);
          return;
        }
        case 'dress': {
          if (S.mo.leaving) return;
          S.mo.toDress = true;
          return;
        }
        case 'leave': {
          if (S.mo.leaving) return;
          const dressed = r && r.outfit && r.outfit.top;
          const written = mornWroteList();
          if (!written) { Audio.ui('error'); S.flash('WRITE THE LIST FIRST.'); S.mo.toGoals = true; return; }
          if (!dressed) {
            Audio.ui('error');
            S.run([
              { who: '', voice: false, at: 'you', think: true, text: 'YOU ARE IN LAST NIGHT.' },
              { who: '', voice: false, at: 'you', think: true, text: 'GET SOMETHING OUT OF THE LOCKER.' },
            ]);
            return;
          }
          S.mo.leaving = true;
          S.lock(1.4);
          Audio.ui('back');
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'RIGHT.' },
            { who: '', voice: false, at: 'you', think: true, text: 'GO AND EARN THE BED.' },
          ], function () {
            if (typeof setChapter === 'function') setChapter('tokyo');
            if (Game.run) Game.run.save();
            S.leave(function () {
              if (typeof QuietStreetScene !== 'undefined') return new QuietStreetScene();
              if (typeof gameHub === 'function') return gameHub();
              return new CityScene();
            }, 'fade', { dur: 0.9 });
          });
          return;
        }
      }
    },

    // ---------- the clock of the scene ----------
    tick: function (S, dt) {
      const M = S.mo; if (!M) return;
      const P2 = M.pod;
      P2.t += dt;

      // ---- the dust, which drifts up because the radiator is under the window
      for (const d of M.dust) {
        d.x += d.vx * dt; d.y += d.vy * dt;
        if (d.y < 146) { d.y = MORN_FLOOR - 4; d.x = 872 + Math.random() * 332; }
        if (d.x < 866) d.x = 1204; if (d.x > 1210) d.x = 872;
      }
      // ---- the urn, gurgling to itself on a long slow loop
      M.gurgleT -= dt;
      M.gurgle = Math.max(0, M.gurgle - dt * 1.4);
      if (M.gurgleT <= 0) { M.gurgleT = 9 + Math.random() * 6; M.gurgle = 1; if (M.phase === 'corridor') mornGurgleSfx(); }
      // ---- the television, saying the same thing to an empty corridor
      if (M.phase === 'corridor') {
        M.tvT -= dt;
        if (M.tvT <= 0) { M.tvT = 17 + Math.random() * 9; if (Math.abs(S.body.x - 900) < 420) Voice.say('AND A FINE DAY ACROSS THE KANTO PLAIN', 'tv', { gain: 0.32, speed: 0.8 }); }
      }

      // ---- the alarm, and everything that follows it
      if (M.phase === 'pod') {
        if (P2.ringing) {
          P2.beat -= dt;
          if (P2.beat <= 0) { P2.beat = 1.15; mornAlarmBeep(); }
        }
        if (M.wait > 0) {
          M.wait -= dt;
          if (M.wait <= 0) {
            if (M.step === 'wake') { M.step = 'asking'; mornWakeChoice(S); }
            else if (M.step === 'snoozing') { M.step = 'asking'; P2.ringing = true; P2.beat = 0; mornWakeChoice(S); }
          }
        }
        if (M.step === 'rising') {
          P2.blind = Math.min(1, P2.blind + dt * 0.8);
          if (P2.blind >= 1 && !M.roseSaid) {
            M.roseSaid = true;
            S.run([
              { who: '', voice: false, at: 'you', think: true, text: 'THE WHOLE CORRIDOR IS GOLD.' },
              { who: '', voice: false, at: 'you', think: true, text: 'IT WILL BE GREY BY NINE.' },
            ], function () { M.step = 'climbing'; });
          }
        }
        if (M.step === 'climbing') {
          P2.k = Math.max(0, P2.k - dt * 1.3);
          if (P2.k <= 0) {
            M.step = 'landed';
            M.phase = 'corridor';
            S.locked = 0.9;
            if (Game.run) { if (!Game.run.flags) Game.run.flags = {}; Game.run.flags.gotUpDay = Game.run.day; Game.run.save(); }
            Audio.ui('move');
            S.flash('YOU CLIMB DOWN. THE LADDER IS COLD.', 3.0);
            M.wait2 = 2.1;
          }
        }
      }

      // ---- the phone, which has been awake longer than you have
      if (M.step === 'landed') {
        M.wait2 -= dt;
        if (M.wait2 <= 0) {
          M.step = 'phone';
          Audio.ui('pop');
          S.body.carry = 'phone';
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'THE PHONE HAS BEEN AWAKE LONGER THAN YOU.' },
            { who: '', voice: false, at: 'you', think: true, text: 'THREE THINGS. WRITE THEM DOWN.' },
            { who: '', voice: false, at: 'you', think: true, text: 'IF YOU DO NOT WRITE THEM DOWN THE DAY WRITES THEM FOR YOU.' },
          ], function () { M.step = 'free'; M.toGoals = true; });
        }
      }

      // ---- the two scenes this one hands off to
      if (M.toGoals && !S.left) {
        M.toGoals = false; S.left = true;
        const at = S.body.x;
        Game.go(function () { return new GoalsScene(function () { return new MorningScene({ phase: 'corridor', at: at, said: 'THREE THINGS. IN INK.' }); }); }, 'fade', { dur: 0.5 });
      }
      if (M.toDress && !S.left) {
        M.toDress = false; S.left = true;
        Game.go(function () { return new DressUpScene(function () { return new MorningScene({ phase: 'corridor', at: 1300, said: 'THAT WILL DO.' }); }); }, 'fade', { dur: 0.5 });
      }
    },

    enterLine: null,
  };
}

// The one question the morning asks you.
function mornWakeChoice(S) {
  const M = S.mo, P = M.pod;
  const first = P.snoozes === 0;
  const lines = [
    {
      who: '', voice: false, at: 'you', think: true,
      text: first ? 'SEVEN. THE NOISE IS A BIRD PRETENDING TO BE POLITE.'
        : P.snoozes === 1 ? 'AGAIN. THE SAME BIRD. LESS POLITE.'
          : 'THE BIRD HAS STOPPED PRETENDING.',
    },
    {
      id: 'ask', who: '', voice: false, at: 'you',
      text: first ? 'IT IS THE FIRST DAY.' : 'YOU HAVE HAD ' + (P.snoozes * 9) + ' MORE MINUTES.',
      choices: P.snoozes >= 2
        ? [{ label: 'GET UP.', note: 'FINE', go: function () { mornGetUp(S); } }]
        : [
          { label: 'GET UP.', note: 'SEVEN, THEN', go: function () { mornGetUp(S); } },
          { label: 'NINE MORE MINUTES.', note: '+STAMINA, -MORNING', go: function () { mornSnooze(S); } },
        ],
    },
  ];
  S.run(lines);
}

function mornSnooze(S) {
  const M = S.mo, P = M.pod;
  P.snoozes++; P.ringing = false;
  Audio.ui('back');
  if (Game.run) { Game.run.rest(14); if (!Game.run.flags) Game.run.flags = {}; Game.run.flags.lateStart = P.snoozes; Game.run.save(); }
  M.step = 'snoozing'; M.wait = 2.6;
  S.flash('+14 STAMINA. NINE FEWER MINUTES OF DAYLIGHT.', 2.4);
}

function mornGetUp(S) {
  const M = S.mo, P = M.pod;
  P.ringing = false;
  Audio.ui('select');
  M.step = 'rising';
  S.flash('YOU SLIDE THE BLIND.', 2.4);
  if (Audio.ctx && !Audio.muted) Audio._noise(Audio.ctx.currentTime, 0.5, 'bandpass', 900, 0.8, 0.1);
}

class MorningScene extends SideScene {
  constructor(opts) {
    super(mornDef(opts || {}), {});
  }
  // While you are still in the box, the walking pads are a lie: hide them.
  draw(ctx) {
    if (this.mo && this.mo.phase === 'pod') {
      const l = this.input.layout;
      this.input.layout = function () { return null; };
      super.draw(ctx);
      this.input.layout = l;
      return;
    }
    super.draw(ctx);
  }
}

// ============================================================
//  THE LIST
// ============================================================

// The candidates. Each one is a real goal out of js/data/goals.js with a line
// short enough to write on a page, a difficulty, and a reason.
function mornGoalCards(run) {
  const d = (run && run.day) || 0;
  const pick = function (arr) { return arr[Math.min(arr.length - 1, d)]; };
  const cards = [
    { id: 'gig', key: 'play', n: 1, line: 'GET A GIG', icon: 'gig', diff: 2, why: 'NOTHING ELSE HAPPENS UNTIL THIS DOES.', fixed: true },
    { id: 'earn', key: 'earn', n: pick([18, 30, 46, 64, 86]), line: 'EARN $' + pick([18, 30, 46, 64, 86]), icon: 'coin', diff: 2, why: 'THE BED IS NOT FREE TOMORROW EITHER.' },
    { id: 'combo', key: 'combo', n: pick([14, 20, 26, 34, 42]), line: 'HOLD A ' + pick([14, 20, 26, 34, 42]) + ' COMBO', icon: 'note', diff: 3, why: 'ANYBODY CAN START A SONG.' },
    { id: 'perfect', key: 'perfect', n: pick([18, 28, 40, 55, 70]), line: 'LAND ' + pick([18, 28, 40, 55, 70]) + ' PERFECTS', icon: 'elite', diff: 3, why: 'CLEAN HANDS. NO EXCUSES.' },
    { id: 'walk', key: 'walk', n: pick([14, 20, 26, 32, 38]), line: 'WALK ' + pick([14, 20, 26, 32, 38]) + ' BLOCKS', icon: 'fire', diff: 1, why: 'YOU WILL DO IT ANYWAY. MIGHT AS WELL COUNT.' },
    { id: 'recruit', key: 'recruit', n: 1, line: 'FIND ONE MORE BUG', icon: 'openmic', diff: 3, why: 'A BAND IS EASIER TO IGNORE ALONE.' },
    { id: 'feed', key: 'feed', n: 1, line: 'FEED EVERYBODY', icon: 'food', diff: 2, why: 'HUNGRY PLAYERS PLAY HUNGRY.' },
    { id: 'upgrade', key: 'upgrade', n: 1, line: 'BUY BETTER GEAR', icon: 'treasure', diff: 3, why: 'THE BUCKET HAS DONE ENOUGH.' },
  ];
  return cards.filter(function (c) {
    if (c.id === 'upgrade' && d === 0) return false;     // no shop money on day one
    if (c.id === 'recruit' && d > 3) return false;       // too late to be fair
    return true;
  });
}

// The pen. A cheap hotel biro with the name of the hotel down the side,
// drawn at whatever angle a pen is held at, with the nib on the last letter.
function mornPen(ctx, nx, ny, t, writing) {
  const lift = writing ? 0 : 5;
  const wob = writing ? Math.sin(t * 34) * 0.8 : 0;
  const ax = 0.72, dx = Math.cos(ax), dy = -Math.sin(ax);
  const x0 = nx + wob, y0 = ny - lift;
  // the shadow it throws on the page, because the light is off to the left
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 52; i++) rect(ctx, x0 + dx * i + 4, y0 + dy * i + 5, 3, 3, '#000');
  ctx.globalAlpha = 1;
  for (let i = 0; i < 54; i++) {
    const w = i < 8 ? 2 : 4;
    const col = i < 8 ? '#3a3a44' : i < 16 ? '#c8c2b0' : i < 46 ? '#2f6a8a' : '#1b3a52';
    rect(ctx, x0 + dx * i, y0 + dy * i, w, w, col);
  }
  rect(ctx, x0 + dx * 22, y0 + dy * 22, 4, 4, '#f4f1ea');
  // the clip
  rect(ctx, x0 + dx * 46, y0 + dy * 46, 3, 8, '#c9c3b0');
  if (writing) {
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 26);
    rect(ctx, nx - 1, ny - 1, 2, 2, '#1b3a52');
    ctx.globalAlpha = 1;
  }
}

// The scratch of a biro on a cheap page.
function mornScratch(v) {
  if (!Audio.ctx || Audio.muted) return;
  Audio._noise(Audio.ctx.currentTime, 0.03, 'bandpass', 1900 + Math.random() * 1600, 3.4, 0.045 * (v || 1));
}

class GoalsScene {
  constructor(back) {
    this.t = 0;
    this.back = back || function () { return new MorningScene({ phase: 'corridor' }); };
    this.run = Game.run;
    this.cards = mornGoalCards(this.run);
    this.sel = 0;
    this.left = false;
    this.stamp = -1;                                   // when the page got stamped
    this.msg = null; this.msgT = 0;
    this.hoverIdx = -1; this.hoverBtn = false;
    // three lines. The first one is already written, because it is not
    // actually a choice: you came four thousand miles to do it.
    this.slots = [
      { card: this.cards[0], n: 0, target: this.cards[0].line },
      { card: null, n: 0, target: '' },
      { card: null, n: 0, target: '' },
    ];
    this.scratchT = 0;
    this.confirmBtn = new Btn(W - 226, H - 62, 202, 46, 'THAT IS THE DAY', () => this.confirm(), { scale: 2 });
    Audio.ui('pop');
  }
  get picked() { return this.slots.filter(function (s) { return s.card; }).length; }
  get writing() { return this.slots.some(function (s) { return s.n < s.target.length || s.erase; }); }
  cardRects() {
    const x = 566, y = 92, w = 372, h = 36, gap = 5;
    return this.cards.map(function (c, i) { return { c: c, x: x, y: y + i * (h + gap), w: w, h: h }; });
  }
  slotFor(card) { for (const s of this.slots) if (s.card && s.card.id === card.id) return s; return null; }
  toggle(i) {
    const c = this.cards[i]; if (!c) return;
    if (c.fixed) { Audio.ui('error'); this.flash('THAT ONE IS NOT A CHOICE.'); return; }
    const on = this.slotFor(c);
    if (on) { on.erase = true; Audio.ui('back'); return; }
    const free = this.slots.find(function (s) { return !s.card && !s.erase; });
    if (!free) { Audio.ui('error'); this.flash('THREE. THAT IS WHAT A DAY HOLDS.'); return; }
    free.card = c; free.target = c.line; free.n = 0;
    Audio.ui('select');
  }
  flash(m) { this.msg = m; this.msgT = 2.4; }
  confirm() {
    if (this.left || this.stamp >= 0) return;
    if (this.picked < 3) { Audio.ui('error'); this.flash('THREE LINES. NOT TWO.'); return; }
    if (this.writing) return;
    const r = this.run;
    if (r) {
      r.goals = this.slots.map(function (s) { return { key: s.card.key, n: s.card.n, done: false, paid: false }; });
      if (!r.flags) r.flags = {};
      r.flags.wroteGoalsDay = r.day;                   // the front door checks this, not the count
      r.save();
    }
    this.stamp = this.t;
    Audio.ui('stamp');
  }
  leave() {
    if (this.left) return; this.left = true;
    Game.go(this.back, 'fade', { dur: 0.5 });
  }
  update(dt) {
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt);
    this.confirmBtn.update(dt);
    // the pen, one character at a time, with the sound of it
    for (const s of this.slots) {
      if (s.erase) {
        s.n = Math.max(0, s.n - dt * 58);
        if (s.n <= 0) { s.erase = false; s.card = null; s.target = ''; }
      } else if (s.card && s.n < s.target.length) {
        const before = Math.floor(s.n);
        s.n = Math.min(s.target.length, s.n + dt * 21);
        if (Math.floor(s.n) !== before) mornScratch(0.8 + Math.random() * 0.5);
      }
    }
    if (this.stamp >= 0 && this.t - this.stamp > 1.5) this.leave();
  }
  key(code) {
    if (this.stamp >= 0) return;
    if (code === 'ArrowUp' || code === 'KeyW') { this.sel = (this.sel - 1 + this.cards.length) % this.cards.length; Audio.ui('move'); return; }
    if (code === 'ArrowDown' || code === 'KeyS') { this.sel = (this.sel + 1) % this.cards.length; Audio.ui('move'); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.toggle(this.sel); return; }
    if (code === 'KeyX' || code === 'Escape') { this.confirm(); return; }
  }
  keyUp() {}
  pointerDown(x, y) { this.click(x, y); }
  pointerMove(x, y) { this.hover(x, y); }
  pointerUp() {}
  click(x, y) {
    if (this.stamp >= 0) return;
    if (this.confirmBtn.hit(x, y)) { this.confirmBtn.flash = 1; this.confirm(); return; }
    const rs = this.cardRects();
    for (let i = 0; i < rs.length; i++) {
      const r = rs[i];
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { this.sel = i; this.toggle(i); return; }
    }
  }
  hover(x, y) {
    this.hoverBtn = this.confirmBtn.hit(x, y);
    this.hoverIdx = -1;
    const rs = this.cardRects();
    for (let i = 0; i < rs.length; i++) { const r = rs[i]; if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { this.hoverIdx = i; this.sel = i; } }
  }
  // ---- the page
  drawPage(ctx) {
    const t = this.t;
    const x = 34, y = 60, w = 496, h = 420;
    // the shadow it casts on the table, and the page itself
    ctx.globalAlpha = 0.34; rect(ctx, x + 7, y + 9, w, h, '#000'); ctx.globalAlpha = 1;
    rect(ctx, x, y, w, h, '#f6f0dc');
    rect(ctx, x, y, w, 3, '#fffaea');
    rect(ctx, x, y + h - 3, w, 3, '#d8cdae');
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.globalAlpha = 0.5; ctx.fillStyle = paperTexture(); ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
    ctx.restore();
    // the ruled lines and the red margin
    for (let i = 0; i < 16; i++) { ctx.globalAlpha = 0.5; rect(ctx, x + 12, y + 74 + i * 22, w - 24, 1, '#a8c0d0'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.6; rect(ctx, x + 56, y + 8, 1, h - 16, '#d88a8a'); ctx.globalAlpha = 1;
    // the spiral binding down the left edge
    for (let i = 0; i < 13; i++) {
      const sy = y + 16 + i * 32;
      rect(ctx, x - 5, sy, 18, 3, '#a8a29a');
      rect(ctx, x - 5, sy, 18, 1, '#d0cac0');
      rect(ctx, x + 6, sy - 2, 3, 7, '#8a8478');
    }
    // the header, in a hand that is trying
    const day = ((this.run && this.run.day) || 0) + 1;
    drawText(ctx, 'DAY ' + day, x + 68, y + 20, '#2f4a6a', { scale: 3 });
    drawText(ctx, 'TOKYO', x + w - 18, y + 22, '#8a8478', { align: 'right', scale: 2 });
    rect(ctx, x + 68, y + 46, w - 92, 2, '#2f4a6a');
    drawText(ctx, 'TODAY I AM GOING TO:', x + 68, y + 54, '#5a6a7a', { font: 'small' });
    // the three lines
    this.slots.forEach((s, i) => {
      const ly = y + 96 + i * 62;
      drawText(ctx, String(i + 1) + '.', x + 24, ly - 4, '#3a4a5a', { scale: 2 });
      ctx.globalAlpha = 0.5; rect(ctx, x + 68, ly + 20, w - 92, 1, '#a8c0d0'); ctx.globalAlpha = 1;
      if (!s.card) {
        if (i === this.picked && this.stamp < 0) {
          ctx.globalAlpha = 0.3 + 0.3 * Math.sin(t * 4);
          rect(ctx, x + 68, ly + 16, 12, 3, '#2f4a6a');
          ctx.globalAlpha = 1;
        }
        return;
      }
      const shown = s.target.slice(0, Math.floor(s.n));
      drawText(ctx, shown, x + 68, ly - 4, '#1b3a52', { scale: 3 });
      // the icon inked in the margin next to a finished line
      if (s.n >= s.target.length) {
        const ic = icon(s.card.icon);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(ic, x + 26, ly + 14, Math.round(ic.width * 0.9), Math.round(ic.height * 0.9));
        ctx.globalAlpha = 1;
        drawText(ctx, goalRewardText({ key: s.card.key, n: s.card.n }), x + w - 18, ly + 2, '#4a7a5a', { align: 'right', font: 'small' });
      }
    });
    // the pen: on the last letter if it is writing, resting on the page if not
    let nx = x + 300, ny = y + h - 46, writing = false;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (s.card && (s.n < s.target.length || s.erase)) {
        nx = x + 68 + textWidth(s.target.slice(0, Math.floor(s.n)), { scale: 3 });
        ny = y + 96 + i * 62 + 18; writing = true; break;
      }
    }
    mornPen(ctx, nx, ny, t, writing);
    // the stamp at the end, which is just a biro box round the lot
    if (this.stamp >= 0) {
      const k = clamp((this.t - this.stamp) / 0.3, 0, 1);
      ctx.globalAlpha = k;
      ctx.save(); ctx.translate(x + w / 2, y + h - 64); ctx.rotate(-0.08);
      rect(ctx, -96, -22, 192, 44, 'rgba(200,64,44,0.12)');
      frame(ctx, -96, -22, 192, 44, '#c8402c');
      frame(ctx, -93, -19, 186, 38, '#c8402c');
      drawText(ctx, 'IN INK', 0, -8, '#c8402c', { align: 'center', scale: 3 });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }
  draw(ctx) {
    const t = this.t;
    // the table: dark wood, low sun across it from the left
    vgrad(ctx, 0, 0, W, H, '#3a2a20', '#1d1510');
    for (let i = 0; i < 26; i++) { ctx.globalAlpha = 0.08; rect(ctx, 0, i * 22 + (i % 3) * 3, W, 3, '#000'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = MORN_PAL.sun; ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W * 0.5, 0); ctx.lineTo(W * 0.78, H); ctx.lineTo(0, H); ctx.fill();
    ctx.globalAlpha = 1;
    lightPool(ctx, 140, 90, 420, MORN_PAL.sun, 0.14);

    // the phone, face up beside the page, alarm off, nothing else to say
    rect(ctx, 566, H - 132, 66, 118, '#15131c');
    rect(ctx, 570, H - 128, 58, 106, '#101828');
    ctx.globalAlpha = 0.5;
    drawText(ctx, '07:12', 599, H - 118, '#8aa8c8', { align: 'center', font: 'small' });
    drawText(ctx, 'NO NEW', 599, H - 100, '#4a5a70', { align: 'center', font: 'small' });
    drawText(ctx, 'MESSAGES', 599, H - 92, '#4a5a70', { align: 'center', font: 'small' });
    ctx.globalAlpha = 1;

    this.drawPage(ctx);

    // ---- the candidates, down the right hand side
    drawText(ctx, 'WHAT IS TODAY FOR', 566, 62, '#ffd24a', { scale: 2, outline: '#3a2a10' });
    drawText(ctx, this.picked + ' OF 3', 938, 64, this.picked >= 3 ? '#6be585' : '#cfc9e6', { align: 'right', scale: 2 });
    for (const [i, r] of this.cardRects().entries()) {
      const c = r.c, on = i === this.sel, taken = !!this.slotFor(c);
      rect(ctx, r.x + 3, r.y + 4, r.w, r.h, 'rgba(6,4,12,0.45)');
      rect(ctx, r.x, r.y, r.w, r.h, taken ? '#1e3324' : on ? '#3a3050' : '#241d33');
      frame(ctx, r.x, r.y, r.w, r.h, taken ? '#6be585' : on ? '#ffd24a' : '#443c5e');
      if (on) rect(ctx, r.x, r.y, 4, r.h, '#c8402c');
      const ic = icon(c.icon);
      ctx.drawImage(ic, r.x + 12, r.y + Math.round((r.h - ic.height) / 2));
      drawText(ctx, c.line, r.x + 44, r.y + 7, taken ? '#cfe8d4' : '#fff4d8', { scale: 2 });
      drawText(ctx, goalRewardText({ key: c.key, n: c.n }), r.x + 44, r.y + 24, taken ? '#6be585' : '#b8aed0', { font: 'small' });
      // difficulty, as pips, because a number would be a lie
      for (let d = 0; d < 3; d++) rect(ctx, r.x + r.w - 20 - d * 9, r.y + 8, 6, 6, d < c.diff ? '#e8503a' : '#443c5e');
      if (c.fixed) drawText(ctx, 'FIXED', r.x + r.w - 14, r.y + 22, '#ffd24a', { align: 'right', font: 'small' });
      else if (taken) drawText(ctx, 'ON THE PAGE', r.x + r.w - 14, r.y + 22, '#6be585', { align: 'right', font: 'small' });
    }
    // the reason under the selected one, small, like a note to yourself
    const selC = this.cards[this.sel];
    if (selC) {
      const by = 92 + this.cards.length * 41 + 4;
      rect(ctx, 566, by, 372, 30, 'rgba(8,6,14,0.6)');
      frame(ctx, 566, by, 372, 30, '#443c5e');
      drawWrapped(ctx, selC.why, 576, by + 8, 58, '#b8aed0', 10, { font: 'small' });
    }

    // ---- the button, and the line telling you what the keys do
    this.confirmBtn.label = this.picked >= 3 ? 'THAT IS THE DAY' : 'PICK ' + (3 - this.picked) + ' MORE';
    this.confirmBtn.draw(ctx, this.picked >= 3 ? (this.hoverBtn ? 'hover' : 'normal') : 'disabled');
    drawText(ctx, Game.touch ? 'TAP A LINE TO ADD IT' : 'UP / DOWN - ENTER TO ADD', 34, H - 30, '#8a82a8', { font: 'small' });

    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = textWidth(this.msg, { scale: 2 }) + 28;
      rect(ctx, W / 2 - w2 / 2, H - 112, w2, 26, 'rgba(8,20,12,0.9)');
      frame(ctx, W / 2 - w2 / 2, H - 112, w2, 26, '#6be585');
      drawText(ctx, this.msg, W / 2, H - 104, '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    vignette(ctx, 0.4, '#100a08');
  }
  isPlaying() { return false; }
}

// ============================================================
//  WHAT YOU ARE GOING TO LOOK LIKE
// ============================================================

// Where the sprite's parts land on screen, so a hat can sit on a head instead
// of near one. The sprite generator is left alone: everything here is painted
// over the top of it.
function mornBugGeo(spec, x, y, s, dy) {
  const geo = (typeof BODY_GEO !== 'undefined' && BODY_GEO[spec.body]) || { rx: 12, ry: 12, cy: 44 };
  const hr = (typeof HEAD_GEO !== 'undefined' && HEAD_GEO[spec.head]) || { rx: 11.5, ry: 11.5 };
  const sx = function (v) { return x + (v - BUG_CX) * s; };
  const sy = function (v) { return y + dy + (v - BUG_H) * s; };
  const bcy = geo.cy, headCy = bcy - geo.ry - hr.ry + 5;
  return {
    s: s, sx: sx, sy: sy,
    cx: sx(BUG_CX),
    headY: sy(headCy), headRx: hr.rx * s, headRy: hr.ry * s,
    bodyY: sy(bcy), bodyRx: geo.rx * s, bodyRy: geo.ry * s,
    shoulderY: sy(bcy - geo.ry + 4),
    hipY: sy(bcy + geo.ry - 4),
    feetY: sy(BUG_FEET),
  };
}

// Every rack in the room. Each option paints itself twice: small, on a hanger
// in the rack, and full size on the bug standing in front of the mirror.
const MORN_RACKS = [
  {
    key: 'hat', name: 'HAT',
    options: [
      {
        id: 'none', name: 'BARE HEAD', note: 'THE WIND WILL FIND YOU.',
        swatch: function (ctx, x, y, w, h) { drawText(ctx, '-', x + w / 2, y + h / 2 - 8, '#6a6478', { align: 'center', scale: 3 }); },
        wear: function () {},
      },
      {
        id: 'cap', name: 'FLAT CAP', note: 'PEOPLE TRUST A CAP.', tips: 1,
        swatch: function (ctx, x, y, w, h) {
          ellipsePx(ctx, x + w / 2, y + h / 2, 13, 7, '#6a5a3a'); rect(ctx, x + w / 2 - 4, y + h / 2 + 3, 20, 4, '#59492e');
        },
        wear: function (ctx, G, t) {
          const c = '#6a5a3a';
          ellipsePx(ctx, G.cx, G.headY - G.headRy * 0.62, G.headRx * 1.02, G.headRy * 0.46, c);
          ellipsePx(ctx, G.cx - G.headRx * 0.2, G.headY - G.headRy * 0.8, G.headRx * 0.5, G.headRy * 0.24, lighten(c, 0.2));
          rect(ctx, G.cx + G.headRx * 0.3, G.headY - G.headRy * 0.46, G.headRx * 0.95, G.s * 2, darken(c, 0.25));
        },
      },
      {
        id: 'beanie', name: 'WOOL BEANIE', note: 'IT IS COLDER AT SIX AM.', stamina: 1,
        swatch: function (ctx, x, y, w, h) {
          ellipsePx(ctx, x + w / 2, y + h / 2, 11, 9, '#3a7ac0'); rect(ctx, x + w / 2 - 11, y + h / 2 + 5, 22, 4, '#2a5a94');
        },
        wear: function (ctx, G) {
          const c = '#3a7ac0';
          ellipsePx(ctx, G.cx, G.headY - G.headRy * 0.44, G.headRx * 1.04, G.headRy * 0.72, c);
          rect(ctx, G.cx - G.headRx, G.headY - G.headRy * 0.44, G.headRx * 2, G.s * 3, darken(c, 0.24));
          for (let i = -2; i <= 2; i++) rect(ctx, G.cx + i * G.headRx * 0.36, G.headY - G.headRy * 1.1, G.s, G.headRy * 0.6, darken(c, 0.14));
          circle(ctx, G.cx, G.headY - G.headRy * 1.2, G.s * 2.4, lighten(c, 0.3));
        },
      },
      {
        id: 'bucket', name: 'BUCKET HAT', note: 'NOBODY KNOWS WHY IT WORKS.', charm: 1,
        swatch: function (ctx, x, y, w, h) {
          ellipsePx(ctx, x + w / 2, y + h / 2 - 2, 9, 8, '#6be585'); ellipsePx(ctx, x + w / 2, y + h / 2 + 5, 15, 4, '#4aa864');
        },
        wear: function (ctx, G) {
          const c = '#4aa864';
          ellipsePx(ctx, G.cx, G.headY - G.headRy * 0.6, G.headRx * 0.9, G.headRy * 0.6, c);
          ellipsePx(ctx, G.cx, G.headY - G.headRy * 0.3, G.headRx * 1.3, G.headRy * 0.26, lighten(c, 0.15));
          rect(ctx, G.cx - G.headRx * 0.9, G.headY - G.headRy * 0.66, G.headRx * 1.8, G.s * 2, darken(c, 0.22));
        },
      },
      {
        id: 'band', name: 'SWEAT BAND', note: 'YOU WILL NEED IT BY NOON.', stamina: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 13, y + h / 2 - 2, 26, 7, '#e8503a'); rect(ctx, x + w / 2 - 13, y + h / 2 - 2, 26, 2, '#ff7a5a'); },
        wear: function (ctx, G) {
          rect(ctx, G.cx - G.headRx * 0.96, G.headY - G.headRy * 0.44, G.headRx * 1.92, G.s * 4, '#e8503a');
          rect(ctx, G.cx - G.headRx * 0.96, G.headY - G.headRy * 0.44, G.headRx * 1.92, G.s, '#ff8a6a');
          rect(ctx, G.cx - G.headRx * 0.2, G.headY - G.headRy * 0.44, G.headRx * 0.4, G.s * 4, '#f4f1ea');
        },
      },
    ],
  },
  {
    key: 'top', name: 'TOP',
    options: [
      {
        id: 'tee', name: 'TOUR TEE', note: 'A BAND THAT SPLIT UP.', charm: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 12, y + h / 2 - 11, 24, 24, '#241d28'); rect(ctx, x + w / 2 - 6, y + h / 2 - 4, 12, 4, '#ffd24a'); },
        wear: function (ctx, G) {
          const c = '#241d28';
          ellipsePx(ctx, G.cx, G.bodyY + G.bodyRy * 0.14, G.bodyRx * 0.94, G.bodyRy * 0.78, c);
          rect(ctx, G.cx - G.bodyRx * 0.5, G.bodyY - G.bodyRy * 0.1, G.bodyRx, G.s * 3, '#ffd24a');
          rect(ctx, G.cx - G.bodyRx * 0.3, G.bodyY + G.bodyRy * 0.2, G.bodyRx * 0.6, G.s * 2, '#c8402c');
          ellipsePx(ctx, G.cx, G.shoulderY + G.s, G.bodyRx * 0.34, G.s * 2, '#3a3344');
        },
      },
      {
        id: 'denim', name: 'DENIM JACKET', note: 'IT HAS POCKETS. THAT IS THE POINT.', tips: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 13, y + h / 2 - 11, 26, 24, '#3f6a9a'); rect(ctx, x + w / 2 - 1, y + h / 2 - 11, 2, 24, '#2a4a70'); },
        wear: function (ctx, G) {
          const c = '#3f6a9a';
          ellipsePx(ctx, G.cx, G.bodyY + G.bodyRy * 0.1, G.bodyRx * 1.04, G.bodyRy * 0.82, c);
          rect(ctx, G.cx - G.s, G.bodyY - G.bodyRy * 0.5, G.s * 2, G.bodyRy * 1.2, darken(c, 0.3));
          rect(ctx, G.cx - G.bodyRx * 0.8, G.bodyY + G.bodyRy * 0.3, G.bodyRx * 0.5, G.s * 3, darken(c, 0.2));
          rect(ctx, G.cx + G.bodyRx * 0.3, G.bodyY + G.bodyRy * 0.3, G.bodyRx * 0.5, G.s * 3, darken(c, 0.2));
          rect(ctx, G.cx - G.bodyRx * 0.9, G.shoulderY + G.s * 2, G.bodyRx * 1.8, G.s * 2, lighten(c, 0.2));
        },
      },
      {
        id: 'cardi', name: 'GREY CARDIGAN', note: 'SOMEBODY ELSE MISSES IT.', stamina: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 12, y + h / 2 - 11, 24, 24, '#8a8494'); rect(ctx, x + w / 2 - 12, y + h / 2 - 11, 5, 24, '#6a6478'); },
        wear: function (ctx, G) {
          const c = '#8a8494';
          ellipsePx(ctx, G.cx, G.bodyY + G.bodyRy * 0.12, G.bodyRx * 1.02, G.bodyRy * 0.86, c);
          rect(ctx, G.cx - G.bodyRx * 0.18, G.bodyY - G.bodyRy * 0.6, G.bodyRx * 0.36, G.bodyRy * 1.5, darken(c, 0.26));
          for (let i = 0; i < 3; i++) circle(ctx, G.cx, G.bodyY - G.bodyRy * 0.3 + i * G.bodyRy * 0.46, G.s * 1.3, '#f0ece2');
          for (let i = -3; i <= 3; i++) rect(ctx, G.cx + i * G.bodyRx * 0.26, G.bodyY - G.bodyRy * 0.5, G.s, G.bodyRy * 1.3, darken(c, 0.08));
        },
      },
      {
        id: 'robe', name: 'HOTEL ROBE', note: 'IT IS NOT YOURS. IT IS NOT LEAVING.', stamina: 2, tips: -1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 13, y + h / 2 - 11, 26, 24, '#e4ddc8'); rect(ctx, x + w / 2 - 13, y + h / 2 + 4, 26, 4, '#c8402c'); },
        wear: function (ctx, G) {
          const c = '#e4ddc8';
          ellipsePx(ctx, G.cx, G.bodyY + G.bodyRy * 0.2, G.bodyRx * 1.1, G.bodyRy * 0.96, c);
          rect(ctx, G.cx - G.bodyRx * 1.1, G.bodyY + G.bodyRy * 0.5, G.bodyRx * 2.2, G.s * 4, '#c8402c');
          ctx.fillStyle = darken(c, 0.16); ctx.beginPath();
          ctx.moveTo(G.cx - G.bodyRx * 0.7, G.shoulderY);
          ctx.lineTo(G.cx, G.bodyY + G.bodyRy * 0.4);
          ctx.lineTo(G.cx + G.bodyRx * 0.7, G.shoulderY); ctx.fill();
        },
      },
      {
        id: 'happi', name: 'HAPPI COAT', note: 'A FESTIVAL YOU WERE NOT AT.', charm: 2,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 13, y + h / 2 - 11, 26, 24, '#1f3f7a'); rect(ctx, x + w / 2 - 4, y + h / 2 - 11, 3, 24, '#f4efe4'); rect(ctx, x + w / 2 + 3, y + h / 2 - 11, 3, 24, '#f4efe4'); },
        wear: function (ctx, G) {
          const c = '#1f3f7a';
          ellipsePx(ctx, G.cx, G.bodyY + G.bodyRy * 0.1, G.bodyRx * 1.08, G.bodyRy * 0.9, c);
          rect(ctx, G.cx - G.bodyRx * 0.34, G.bodyY - G.bodyRy * 0.7, G.s * 2.5, G.bodyRy * 1.6, '#f4efe4');
          rect(ctx, G.cx + G.bodyRx * 0.2, G.bodyY - G.bodyRy * 0.7, G.s * 2.5, G.bodyRy * 1.6, '#f4efe4');
          rect(ctx, G.cx - G.bodyRx, G.bodyY + G.bodyRy * 0.52, G.bodyRx * 2, G.s * 3, '#c8402c');
          drawKanaBlock(ctx, G.cx - G.s * 3, G.bodyY - G.bodyRy * 0.2, G.s * 6, '#f4efe4', 3);
        },
      },
    ],
  },
  {
    key: 'legs', name: 'LEGS',
    options: [
      {
        id: 'jeans', name: 'BLUE JEANS', note: 'THEY HAVE BEEN EVERYWHERE YOU HAVE.',
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 9, y + h / 2 - 10, 18, 22, '#2f4a7a'); rect(ctx, x + w / 2 - 1, y + h / 2 - 2, 2, 14, '#1f3560'); },
        wear: function (ctx, G) {
          const c = '#2f4a7a';
          rect(ctx, G.cx - G.bodyRx * 0.76, G.hipY, G.bodyRx * 1.52, (G.feetY - G.hipY) * 0.74, c);
          rect(ctx, G.cx - G.s, G.hipY, G.s * 2, (G.feetY - G.hipY) * 0.74, darken(c, 0.3));
          rect(ctx, G.cx - G.bodyRx * 0.76, G.hipY, G.bodyRx * 1.52, G.s * 2, lighten(c, 0.2));
        },
      },
      {
        id: 'work', name: 'WORK TROUSERS', note: 'FOUR POCKETS AND A LOOP FOR A HAMMER.', tips: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 9, y + h / 2 - 10, 18, 22, '#5a5a3a'); rect(ctx, x + w / 2 + 2, y + h / 2 - 2, 6, 7, '#4a4a2e'); },
        wear: function (ctx, G) {
          const c = '#5a5a3a';
          rect(ctx, G.cx - G.bodyRx * 0.8, G.hipY, G.bodyRx * 1.6, (G.feetY - G.hipY) * 0.78, c);
          rect(ctx, G.cx + G.bodyRx * 0.2, G.hipY + G.s * 4, G.bodyRx * 0.5, G.s * 6, darken(c, 0.24));
          rect(ctx, G.cx - G.bodyRx * 0.7, G.hipY + G.s * 4, G.bodyRx * 0.5, G.s * 6, darken(c, 0.24));
          rect(ctx, G.cx - G.bodyRx * 0.8, G.hipY, G.bodyRx * 1.6, G.s * 2, lighten(c, 0.18));
        },
      },
      {
        id: 'track', name: 'TRACK PANTS', note: 'TWO STRIPES. NOT THREE.', stamina: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 9, y + h / 2 - 10, 18, 22, '#2a2a36'); rect(ctx, x + w / 2 - 8, y + h / 2 - 10, 2, 22, '#f4f1ea'); rect(ctx, x + w / 2 + 5, y + h / 2 - 10, 2, 22, '#f4f1ea'); },
        wear: function (ctx, G) {
          const c = '#2a2a36';
          rect(ctx, G.cx - G.bodyRx * 0.78, G.hipY, G.bodyRx * 1.56, (G.feetY - G.hipY) * 0.82, c);
          rect(ctx, G.cx - G.bodyRx * 0.78, G.hipY, G.s, (G.feetY - G.hipY) * 0.82, '#f4f1ea');
          rect(ctx, G.cx + G.bodyRx * 0.68, G.hipY, G.s, (G.feetY - G.hipY) * 0.82, '#f4f1ea');
          rect(ctx, G.cx - G.bodyRx * 0.78, G.hipY, G.bodyRx * 1.56, G.s * 2, lighten(c, 0.22));
        },
      },
      {
        id: 'shorts', name: 'CUT OFF SHORTS', note: 'BOLD, IN TOKYO, IN THE MORNING.', charm: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 9, y + h / 2 - 10, 18, 12, '#6a86a8'); for (let i = 0; i < 6; i++) px(ctx, x + w / 2 - 9 + i * 3, y + h / 2 + 2, '#8aa4c0'); },
        wear: function (ctx, G) {
          const c = '#6a86a8';
          rect(ctx, G.cx - G.bodyRx * 0.8, G.hipY, G.bodyRx * 1.6, (G.feetY - G.hipY) * 0.36, c);
          rect(ctx, G.cx - G.bodyRx * 0.8, G.hipY, G.bodyRx * 1.6, G.s * 2, lighten(c, 0.2));
          for (let i = 0; i < 7; i++) rect(ctx, G.cx - G.bodyRx * 0.8 + i * G.bodyRx * 0.26, G.hipY + (G.feetY - G.hipY) * 0.36, G.s, G.s, lighten(c, 0.3));
        },
      },
    ],
  },
  {
    key: 'case', name: 'CASE',
    options: [
      {
        id: 'bare', name: 'BARE CASE', note: 'HONEST. GREY.',
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 7, y + h / 2 - 12, 14, 26, '#3a2a3a'); rect(ctx, x + w / 2 - 3, y + h / 2 - 16, 6, 5, '#8a7a5e'); },
        wear: function (ctx, G) {
          rect(ctx, G.cx + G.bodyRx * 1.1, G.bodyY - G.bodyRy * 0.4, G.s * 8, G.s * 22, '#3a2a3a');
          rect(ctx, G.cx + G.bodyRx * 1.1, G.bodyY - G.bodyRy * 0.4, G.s * 8, G.s * 2, '#5a4a5a');
        },
      },
      {
        id: 'stickers', name: 'STICKER CASE', note: 'EVERY TOWN LEAVES ONE.', charm: 1,
        swatch: function (ctx, x, y, w, h) {
          rect(ctx, x + w / 2 - 7, y + h / 2 - 12, 14, 26, '#3a2a3a');
          rect(ctx, x + w / 2 - 5, y + h / 2 - 8, 5, 5, '#ffd24a'); rect(ctx, x + w / 2 + 1, y + h / 2, 5, 5, '#6be585'); rect(ctx, x + w / 2 - 4, y + h / 2 + 5, 4, 4, '#8ad8ff');
        },
        wear: function (ctx, G) {
          const bx = G.cx + G.bodyRx * 1.1;
          rect(ctx, bx, G.bodyY - G.bodyRy * 0.4, G.s * 8, G.s * 22, '#3a2a3a');
          rect(ctx, bx, G.bodyY - G.bodyRy * 0.4, G.s * 8, G.s * 2, '#5a4a5a');
          const cols = ['#ffd24a', '#6be585', '#8ad8ff', '#e8503a'];
          for (let i = 0; i < 6; i++) rect(ctx, bx + (i % 2) * G.s * 4 + G.s, G.bodyY - G.bodyRy * 0.2 + i * G.s * 3.2, G.s * 3, G.s * 3, cols[i % 4]);
        },
      },
      {
        id: 'sign', name: 'CARDBOARD SIGN', note: 'IT SAYS WHAT YOU DO. IN TWO LANGUAGES.', tips: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 11, y + h / 2 - 8, 22, 16, '#c8a878'); for (let i = 0; i < 3; i++) rect(ctx, x + w / 2 - 8, y + h / 2 - 5 + i * 4, 16 - i * 4, 2, '#5a4a30'); },
        wear: function (ctx, G) {
          const bx = G.cx + G.bodyRx * 1.0;
          rect(ctx, bx, G.bodyY - G.bodyRy * 0.2, G.s * 12, G.s * 9, '#c8a878');
          rect(ctx, bx, G.bodyY - G.bodyRy * 0.2, G.s * 12, G.s, '#e0c498');
          for (let i = 0; i < 3; i++) rect(ctx, bx + G.s * 2, G.bodyY - G.bodyRy * 0.2 + G.s * (2 + i * 2), G.s * (8 - i * 2), G.s, '#5a4a30');
        },
      },
      {
        id: 'tarp', name: 'TARP AND BUCKET', note: 'RAIN IS A BUSINESS DECISION.', tips: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 10, y + h / 2 - 6, 20, 14, '#2f6a8a'); rect(ctx, x + w / 2 - 5, y + h / 2 + 4, 10, 8, '#8a8f98'); },
        wear: function (ctx, G) {
          const bx = G.cx + G.bodyRx * 1.05;
          rect(ctx, bx, G.bodyY - G.bodyRy * 0.3, G.s * 9, G.s * 10, '#2f6a8a');
          rect(ctx, bx, G.bodyY - G.bodyRy * 0.3, G.s * 9, G.s, '#4a8aaa');
          rect(ctx, bx + G.s, G.bodyY + G.bodyRy * 0.5, G.s * 7, G.s * 8, '#8a8f98');
          rect(ctx, bx + G.s, G.bodyY + G.bodyRy * 0.5, G.s * 7, G.s, '#c2c8d0');
        },
      },
      {
        id: 'tote', name: 'CANVAS TOTE', note: 'A BOOKSHOP THAT CLOSED.', stamina: 1,
        swatch: function (ctx, x, y, w, h) { rect(ctx, x + w / 2 - 9, y + h / 2 - 6, 18, 18, '#d8cdb0'); ringPx(ctx, x + w / 2, y + h / 2 - 8, 6, '#b9ae90'); },
        wear: function (ctx, G) {
          const bx = G.cx + G.bodyRx * 1.1;
          rect(ctx, bx, G.bodyY, G.s * 9, G.s * 12, '#d8cdb0');
          rect(ctx, bx, G.bodyY, G.s * 9, G.s, '#efe6c8');
          ringPx(ctx, bx + G.s * 4.5, G.bodyY - G.s * 4, G.s * 4, '#b9ae90');
          rect(ctx, bx + G.s * 2, G.bodyY + G.s * 4, G.s * 5, G.s * 2, '#8a8070');
        },
      },
    ],
  },
];

// Paint the chosen clothes over a bug that has already been drawn.
function mornWearOutfit(ctx, G, outfit, t) {
  for (const rack of MORN_RACKS) {
    const id = outfit ? outfit[rack.key] : null;
    if (!id) continue;
    const opt = rack.options.find(function (o) { return o.id === id; });
    if (opt && opt.wear) opt.wear(ctx, G, t);
  }
}

// What a set of clothes is worth, added up.
function mornOutfitStats(outfit) {
  const out = { tips: 0, stamina: 0, charm: 0 };
  for (const rack of MORN_RACKS) {
    const id = outfit ? outfit[rack.key] : null;
    if (!id) continue;
    const opt = rack.options.find(function (o) { return o.id === id; });
    if (!opt) continue;
    out.tips += opt.tips || 0; out.stamina += opt.stamina || 0; out.charm += opt.charm || 0;
  }
  return out;
}

class DressUpScene {
  constructor(back) {
    this.t = 0;
    this.back = back || function () { return new MorningScene({ phase: 'corridor', at: 1300 }); };
    this.run = Game.run;
    this.you = (this.run && this.run.members[0]) || { spec: HERO_PRESETS.buzz };
    this.left = false;
    this.row = 0;
    this.msg = null; this.msgT = 0;
    this.hoverBtn = false;
    // start from what you wore yesterday, or from the bottom of the bag
    const worn = (this.run && this.run.outfit) || {};
    this.sel = {};
    for (const rack of MORN_RACKS) {
      const i = rack.options.findIndex(function (o) { return o.id === worn[rack.key]; });
      this.sel[rack.key] = i >= 0 ? i : 0;
    }
    this.pop = {};                       // a little bounce when a garment changes
    this.confirmBtn = new Btn(W - 214, H - 58, 192, 44, 'WEAR IT', () => this.confirm(), { scale: 3 });
    Audio.ui('move');
  }
  get outfit() {
    const o = {};
    for (const rack of MORN_RACKS) o[rack.key] = rack.options[this.sel[rack.key]].id;
    return o;
  }
  flash(m) { this.msg = m; this.msgT = 2.2; }
  rackRects() {
    const x = 470, y = 74, h = 88, gap = 8;
    return MORN_RACKS.map(function (r, i) { return { r: r, x: x, y: y + i * (h + gap), w: 466, h: h }; });
  }
  optRects(ri) {
    const R = this.rackRects()[ri];
    const n = MORN_RACKS[ri].options.length;
    const ow = Math.floor((R.w - 108) / n) - 4;
    return MORN_RACKS[ri].options.map(function (o, i) { return { o: o, i: i, x: R.x + 104 + i * (ow + 4), y: R.y + 22, w: ow, h: 58 }; });
  }
  move(d) {
    const rack = MORN_RACKS[this.row];
    const n = rack.options.length;
    this.sel[rack.key] = (this.sel[rack.key] + d + n) % n;
    this.pop[rack.key] = this.t;
    Audio.ui('move');
  }
  confirm() {
    if (this.left) return;
    const o = this.outfit, st = mornOutfitStats(o);
    if (this.run) {
      this.run.outfit = Object.assign({}, o, { tips: st.tips, stamina: st.stamina, charm: st.charm });
      if (st.stamina > 0) this.run.rest(st.stamina * 6);
      this.run.save();
    }
    this.left = true;
    Audio.ui('fanfare');
    Game.go(this.back, 'fade', { dur: 0.5 });
  }
  update(dt) {
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt);
    this.confirmBtn.update(dt);
  }
  key(code) {
    if (code === 'ArrowUp' || code === 'KeyW') { this.row = (this.row - 1 + MORN_RACKS.length) % MORN_RACKS.length; Audio.ui('move'); return; }
    if (code === 'ArrowDown' || code === 'KeyS') { this.row = (this.row + 1) % MORN_RACKS.length; Audio.ui('move'); return; }
    if (code === 'ArrowLeft' || code === 'KeyA') { this.move(-1); return; }
    if (code === 'ArrowRight' || code === 'KeyD') { this.move(1); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) {
      if (this.row < MORN_RACKS.length - 1) { this.row++; Audio.ui('move'); }
      else this.confirm();
      return;
    }
    if (code === 'KeyX' || code === 'Escape') { this.confirm(); return; }
  }
  keyUp() {}
  pointerDown(x, y) { this.click(x, y); }
  pointerMove(x, y) { this.hover(x, y); }
  pointerUp() {}
  click(x, y) {
    if (this.confirmBtn.hit(x, y)) { this.confirmBtn.flash = 1; this.confirm(); return; }
    for (let ri = 0; ri < MORN_RACKS.length; ri++) {
      for (const o of this.optRects(ri)) {
        if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) {
          this.row = ri;
          const key = MORN_RACKS[ri].key;
          if (this.sel[key] !== o.i) { this.sel[key] = o.i; this.pop[key] = this.t; Audio.ui('select'); }
          return;
        }
      }
    }
  }
  hover(x, y) { this.hoverBtn = this.confirmBtn.hit(x, y); }
  // ---- you, on the riser, front on
  drawYou(ctx, x, base, s, alpha, t) {
    const o = this.outfit;
    // the little bounce a changed garment gives the whole figure
    let pop = 0;
    for (const k in this.pop) { const dt2 = t - this.pop[k]; if (dt2 >= 0 && dt2 < 0.4) pop = Math.max(pop, Math.sin(dt2 / 0.4 * Math.PI) * 0.06); }
    const sc = s * (1 + pop);
    if (alpha != null) ctx.globalAlpha = alpha;
    drawShadow(ctx, x, base + 2, 26 * sc, 0.3 * (alpha != null ? alpha : 1));
    const dy = drawBugAt(ctx, this.you.spec, x, base, { pose: 'idle', scale: sc, bounce: 0.6, phase: 0.4 });
    const G = mornBugGeo(this.you.spec, x, base, sc, dy);
    mornWearOutfit(ctx, G, o, t);
    if (alpha != null) ctx.globalAlpha = 1;
    return G;
  }
  draw(ctx) {
    const t = this.t;
    const P = MORN_PAL;
    // ---- the corner of the changing room
    vgrad(ctx, 0, 0, W, H, '#3a3348', '#1d1a28');
    // tiled wall, half height, the way every wet room in the world is
    for (let x = 0; x < W; x += 34) for (let y = 120; y < 330; y += 34) {
      rect(ctx, x, y, 33, 33, (x / 34 + y / 34) % 2 ? '#4a5a62' : '#44545c');
      rect(ctx, x, y, 33, 1, '#5c6e76');
    }
    rect(ctx, 0, 330, W, 6, '#6a7a82');
    rect(ctx, 0, 112, W, 8, '#6a7a82');
    // the floor, and a strip of morning coming in from off to the left
    rect(ctx, 0, 410, W, H - 410, '#42394e');
    rect(ctx, 0, 410, W, 4, '#584d66');
    for (let x = 0; x < W; x += 46) { ctx.globalAlpha = 0.12; rect(ctx, x, 414, 1, H - 414, '#000'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.11;
    ctx.fillStyle = P.sun; ctx.beginPath();
    ctx.moveTo(0, 130); ctx.lineTo(120, 130); ctx.lineTo(320, H); ctx.lineTo(0, H); ctx.fill();
    ctx.globalAlpha = 1;
    lightPool(ctx, 90, 200, 300, P.sun, 0.12);

    // ---- the mirror: tall, screwed to the wall, a bit foxed at the corners
    const mx = 44, my = 96, mw = 176, mh = 330;
    rect(ctx, mx - 8, my - 8, mw + 16, mh + 16, '#7a5a3a');
    rect(ctx, mx - 8, my - 8, mw + 16, 4, '#a07a52');
    rect(ctx, mx - 8, my + mh + 4, mw + 16, 4, '#4e3724');
    rect(ctx, mx, my, mw, mh, '#5e6f78');
    vgrad(ctx, mx, my, mw, mh, '#6d7f88', '#3f4c55');
    ctx.save(); ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();
    // the room reflected, roughly, and then you in the middle of it
    for (let x = mx; x < mx + mw; x += 34) for (let y = my + 20; y < my + 220; y += 34) { ctx.globalAlpha = 0.25; rect(ctx, x, y, 33, 33, '#4a5a62'); ctx.globalAlpha = 1; }
    this.drawYou(ctx, mx + mw / 2, my + mh - 26, 2.5, 0.7, t);
    // the foxing, and the diagonal flare
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff'; ctx.beginPath();
    ctx.moveTo(mx + 10, my + mh); ctx.lineTo(mx + 46, my + mh); ctx.lineTo(mx + mw, my + 30); ctx.lineTo(mx + mw - 36, my + 30); ctx.fill();
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 40; i++) rect(ctx, mx + ((i * 71) % mw), my + ((i * 127) % mh), 2, 2, '#1b1b24');
    ctx.globalAlpha = 1;
    ctx.restore();
    frame(ctx, mx, my, mw, mh, '#2a2436');
    drawText(ctx, 'THAT IS YOU', mx + mw / 2, my + mh + 16, '#8a82a8', { align: 'center', font: 'small' });

    // ---- the riser, and you standing on it
    const sx = 330, sbase = 452;
    ctx.globalAlpha = 0.3; ellipsePx(ctx, sx, sbase + 4, 74, 12, '#000'); ctx.globalAlpha = 1;
    ellipsePx(ctx, sx, sbase, 72, 13, '#6a4a5a');
    ellipsePx(ctx, sx, sbase - 6, 72, 13, '#8a5f70');
    ellipsePx(ctx, sx, sbase - 7, 62, 10, '#a3788a');
    for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ctx.globalAlpha = 0.18; px(ctx, sx + Math.cos(a) * 66, sbase - 7 + Math.sin(a) * 11, '#e0b0c0'); ctx.globalAlpha = 1; }
    this.drawYou(ctx, sx, sbase - 10, 3.6, null, t);
    // a rail of empty hangers behind you, because this is a corridor, not a shop
    rect(ctx, 250, 150, 180, 4, MORN_PAL.steel);
    for (let i = 0; i < 5; i++) {
      const hx = 264 + i * 34;
      rect(ctx, hx, 150, 2, 12, MORN_PAL.steelLo);
      ctx.strokeStyle = MORN_PAL.steelLo; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx - 10, 168); ctx.lineTo(hx + 1, 162); ctx.lineTo(hx + 12, 168); ctx.stroke();
    }

    // ---- the racks
    uiRibbon(ctx, 700, 26, 'WHAT ARE YOU WEARING', { scale: 2, color: '#7a1a2a' });
    for (const [ri, R] of this.rackRects().entries()) {
      const on = ri === this.row;
      rect(ctx, R.x + 3, R.y + 4, R.w, R.h, 'rgba(6,4,12,0.45)');
      rect(ctx, R.x, R.y, R.w, R.h, on ? '#2f2745' : '#241d33');
      frame(ctx, R.x, R.y, R.w, R.h, on ? '#ffd24a' : '#443c5e');
      drawText(ctx, R.r.name, R.x + 10, R.y + 10, on ? '#ffd24a' : '#8a82a8', { scale: 2 });
      const cur = R.r.options[this.sel[R.r.key]];
      drawText(ctx, cur.name, R.x + 10, R.y + 34, '#fff4d8', { font: 'small' });
      const bits = [];
      if (cur.tips) bits.push((cur.tips > 0 ? '+' : '') + cur.tips + ' TIPS');
      if (cur.stamina) bits.push((cur.stamina > 0 ? '+' : '') + cur.stamina + ' STAM');
      if (cur.charm) bits.push((cur.charm > 0 ? '+' : '') + cur.charm + ' CHARM');
      drawText(ctx, bits.length ? bits.join('  ') : 'NOTHING EITHER WAY', R.x + 10, R.y + 46, bits.length ? '#6be585' : '#6a6478', { font: 'small' });
      drawWrapped(ctx, cur.note, R.x + 10, R.y + 58, 22, '#8a82a8', 7, { font: 'small' });
      for (const o of this.optRects(ri)) {
        const picked = this.sel[R.r.key] === o.i;
        rect(ctx, o.x, o.y, o.w, o.h, picked ? '#3d3358' : '#1b1728');
        frame(ctx, o.x, o.y, o.w, o.h, picked ? '#ffd24a' : '#3a3450');
        ctx.save(); ctx.beginPath(); ctx.rect(o.x + 1, o.y + 1, o.w - 2, o.h - 2); ctx.clip();
        o.o.swatch(ctx, o.x, o.y, o.w, o.h - 12);
        ctx.restore();
        drawText(ctx, o.o.name.split(' ')[0], o.x + o.w / 2, o.y + o.h - 10, picked ? '#ffd24a' : '#8a82a8', { align: 'center', font: 'small' });
        if (picked) rect(ctx, o.x, o.y + o.h - 2, o.w, 2, '#ffd24a');
      }
    }

    // ---- the total, and the button
    const st = mornOutfitStats(this.outfit);
    const line = '+' + st.tips + ' TIPS   +' + st.stamina + ' STAMINA   +' + st.charm + ' CHARM';
    rect(ctx, 470, H - 56, 240, 30, 'rgba(8,6,14,0.7)');
    frame(ctx, 470, H - 56, 240, 30, '#443c5e');
    drawText(ctx, line, 590, H - 47, '#6be585', { align: 'center', font: 'small' });
    drawText(ctx, 'NOBODY ELSE WILL NOTICE', 590, H - 36, '#6a6478', { align: 'center', font: 'small' });
    this.confirmBtn.draw(ctx, this.hoverBtn ? 'hover' : 'normal');
    drawText(ctx, Game.touch ? 'TAP A GARMENT' : 'ARROWS - ENTER WHEN YOU ARE DONE', 34, H - 26, '#8a82a8', { font: 'small' });

    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = textWidth(this.msg, { scale: 2 }) + 28;
      rect(ctx, W / 2 - w2 / 2, H - 112, w2, 26, 'rgba(8,20,12,0.9)');
      frame(ctx, W / 2 - w2 / 2, H - 112, w2, 26, '#6be585');
      drawText(ctx, this.msg, W / 2, H - 104, '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    grade(ctx, 0, 0, W, H, '#ffb45a', 0.06, 'overlay');
    vignette(ctx, 0.38, '#0d0a16');
  }
  isPlaying() { return false; }
}
