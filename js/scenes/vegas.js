// ---------- The Strip, about nine at night ----------
// This is where the game starts now, and it starts at the end of something
// rather than the beginning. Four years of playing to people walking to a
// buffet. One guitar case, eleven dollars, and a ticket east that cost more
// than everything else the player owns put together.
//
// The Strip is drawn as one long side-scrolling strip of world: casinos on a
// raised plaza at the back, a sidewalk in front of them, a road in front of
// that with the traffic barely moving. Behind all of it, filling the sky, the
// Sphere - a screen the size of a hill that spends its whole life pulling
// faces at people who are not looking up.
//
// Walk right. The shuttle goes at nine.
'use strict';

// ---------- the shape of the place ----------
const VEGAS_W = 3520;          // how long the Strip is, end to end
const VEGAS_F0 = 352;          // the raised plaza the casinos stand on
const VEGAS_F1 = 440;          // the sidewalk, one step down, where you walk
const VEGAS_KERB = 478;        // where the sidewalk gives up
const VEGAS_ROAD = 486;        // where the road starts
const VEGAS_ROAD_BOT = 614;
const VEGAS_SHUTTLE_X = 3380;  // the door at the far end, which is the exit

// The Sphere is painted in SCREEN space with its own parallax, because it is
// a mile away and nothing about it should agree with the buildings in front.
const VEGAS_SPHERE_CX = 546;   // where it sits when the camera is at zero
const VEGAS_SPHERE_CY = 144;
const VEGAS_SPHERE_R = 136;
const VEGAS_SPHERE_PAR = 0.22;
const VEGAS_SPHERE_WORLD = 780;  // the world x it is roughly standing over
const VEGAS_WIPE_DUR = 0.7;      // how long one face takes to become another

// The palette. Vegas at night is four colours pretending to be forty.
const VEGAS_PAL = {
  night: '#0a0818', night2: '#2e1338', haze: '#6a2a3a',
  shell: '#15121f', steel: '#3a3350', gold: '#ffd24a', goldLo: '#c8a03a',
  ice: '#8ad8ff', pink: '#ff8ad8', green: '#6be585', red: '#e8503a', cream: '#f4f1ea',
};

// ---------- the Sphere's head ----------
// One mutable lump of state, because a face has to remember what it was doing
// last frame. Blinks are deliberately not on a metronome: it blinks, waits a
// while, and now and then blinks twice like it thought of something.
const VEGAS_SPHERE = {
  lt: -1, clock: 0,
  blink: 0, blinkIn: 1.6,
  look: 0, lookGoal: 0, lookIn: 1.2,
  gaze: 0, gazeY: 0,
  idx: 0, from: 0, wipe: 1, faceT: 0, hold: 6.5,
  talk: 0, mouth: 0,
};
// Called by the scene when you walk under it and it decides to say something.
function vegasSphereSpeak(secs) { VEGAS_SPHERE.talk = secs || 2.6; }

// ---------- the mouth, shared by every face that has one ----------
// A slab of dark LEDs that opens. When it is shut it is a line; when it talks
// it is a hole with a lit rim, which is as close to lips as a stadium gets.
function vegasSphereMouth(ctx, cx, my, w, open, col, lip) {
  const o = clamp(open, 0, 1);
  const h = Math.round(3 + o * w * 0.34);
  const ww = Math.round(w * (0.52 + o * 0.22));
  rect(ctx, cx - ww / 2, my - h / 2, ww, h, col || '#140c14');
  rect(ctx, cx - ww / 2, my - h / 2, ww, 2, lip || '#4a2038');
  if (o > 0.25) {
    // the tongue, one flat bar, which is all the resolution it has
    rect(ctx, cx - ww / 2 + 4, my + h / 2 - 5, ww - 8, 4, '#8a2a3a');
    ctx.globalAlpha = 0.5; rect(ctx, cx - ww / 2, my + h / 2 - 2, ww, 2, '#ff9ab0'); ctx.globalAlpha = 1;
  }
}

// ---------- the seven faces ----------
// A GIANT EYEBALL. The iris follows the player along the street, which is the
// single most unsettling thing the Sphere does and it does it constantly.
function vegasFaceEye(ctx, cx, cy, R, t, F) {
  const ey = cy - R * 0.12;
  ellipsePx(ctx, cx, ey, R * 0.90, R * 0.66, '#efe9dc');
  ctx.globalAlpha = 0.16; ellipsePx(ctx, cx, ey + R * 0.28, R * 0.86, R * 0.34, '#8a7a90'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.4, x0 = cx + Math.cos(a) * R * 0.86, y0 = ey + Math.sin(a) * R * 0.6;
    line(ctx, x0, y0, cx + Math.cos(a) * R * 0.5, ey + Math.sin(a) * R * 0.34, '#c86a6a');
  }
  ctx.globalAlpha = 1;
  const ix = cx + (F.gaze * 0.7 + F.look * 0.28) * R * 0.46;
  const iy = ey + F.gazeY * R * 0.12 + Math.sin(t * 0.8) * 2;
  const ir = R * 0.31;
  ellipsePx(ctx, ix, iy, ir, ir, '#123a6a');
  ellipsePx(ctx, ix, iy, ir - 3, ir - 3, '#2f6fc0');
  ctx.globalAlpha = 0.35;
  for (let i = 0; i < 12; i++) { const a = i * 0.524; line(ctx, ix + Math.cos(a) * ir * 0.3, iy + Math.sin(a) * ir * 0.3, ix + Math.cos(a) * ir * 0.9, iy + Math.sin(a) * ir * 0.9, '#0d2a4a'); }
  ctx.globalAlpha = 1;
  const pr = ir * (0.42 + 0.06 * Math.sin(t * 1.7));
  ellipsePx(ctx, ix, iy, pr, pr, '#080610');
  ellipsePx(ctx, ix - ir * 0.34, iy - ir * 0.38, ir * 0.17, ir * 0.14, '#ffffff');
  px(ctx, ix + ir * 0.26, iy + ir * 0.3, '#ffffff');
  if (F.mouth > 0.02) vegasSphereMouth(ctx, cx, cy + R * 0.72, R * 0.7, F.mouth, '#0d0a14', '#3a2a4a');
}

// A SMILEY. The face every screen defaults to when nobody is paying it.
function vegasFaceSmile(ctx, cx, cy, R, t, F) {
  ellipsePx(ctx, cx, cy, R * 0.90, R * 0.90, '#c89a1a');
  ellipsePx(ctx, cx, cy, R * 0.86, R * 0.86, '#ffd24a');
  ctx.globalAlpha = 0.28; ellipsePx(ctx, cx - R * 0.26, cy - R * 0.3, R * 0.4, R * 0.3, '#fff0b0'); ctx.globalAlpha = 1;
  const ox = F.look * R * 0.06;
  for (const d of [-1, 1]) {
    const ex = cx + d * R * 0.33 + ox, ey = cy - R * 0.22;
    rect(ctx, ex - R * 0.075, ey - R * 0.2, R * 0.15, R * 0.4, '#241d28');
    ellipsePx(ctx, ex, ey - R * 0.2, R * 0.075, R * 0.075, '#241d28');
    ellipsePx(ctx, ex, ey + R * 0.2, R * 0.075, R * 0.075, '#241d28');
    ctx.globalAlpha = 0.6; rect(ctx, ex - R * 0.05, ey - R * 0.16, R * 0.05, R * 0.1, '#6a5a70'); ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.35;
  for (const d of [-1, 1]) ellipsePx(ctx, cx + d * R * 0.58, cy + R * 0.16, R * 0.15, R * 0.09, '#ff7a5a');
  ctx.globalAlpha = 1;
  // the smile, built out of square LEDs along an arc, because that is what it is
  const n = 15, sp = R * 0.085, blk = Math.max(3, Math.round(R * 0.085));
  if (F.mouth > 0.3) {
    vegasSphereMouth(ctx, cx, cy + R * 0.38, R * 0.86, F.mouth, '#3a1c10', '#7a3a1a');
  } else {
    for (let i = 0; i < n; i++) {
      const k = (i / (n - 1)) * 2 - 1;
      const bx = cx + k * sp * (n / 2), by = cy + R * 0.26 + (1 - k * k) * R * 0.26;
      rect(ctx, bx - blk / 2, by - blk / 2, blk, blk, '#241d28');
    }
  }
}

// A WINK. Same face, one eye shut, and a little star because it thinks it is
// charming. It is not charming. It is forty metres tall.
function vegasFaceWink(ctx, cx, cy, R, t, F) {
  ellipsePx(ctx, cx, cy, R * 0.90, R * 0.90, '#c86a2a');
  ellipsePx(ctx, cx, cy, R * 0.86, R * 0.86, '#f2a03a');
  ctx.globalAlpha = 0.24; ellipsePx(ctx, cx - R * 0.26, cy - R * 0.32, R * 0.4, R * 0.3, '#ffe0a0'); ctx.globalAlpha = 1;
  // the open eye
  const ex = cx + R * 0.34, ey = cy - R * 0.2;
  rect(ctx, ex - R * 0.085, ey - R * 0.2, R * 0.17, R * 0.4, '#241d28');
  ellipsePx(ctx, ex, ey - R * 0.2, R * 0.085, R * 0.085, '#241d28');
  ellipsePx(ctx, ex, ey + R * 0.2, R * 0.085, R * 0.085, '#241d28');
  // the shut one: a hook of blocks
  const wx = cx - R * 0.34, blk = Math.max(3, Math.round(R * 0.08));
  for (let i = -4; i <= 4; i++) {
    const k = i / 4;
    rect(ctx, wx + k * R * 0.26 - blk / 2, ey + Math.abs(k) * R * 0.1 - blk / 2, blk, blk, '#241d28');
  }
  // a sparkle, ticking over
  const sp = 0.6 + 0.4 * Math.sin(t * 5);
  ctx.globalAlpha = sp;
  const sx = wx - R * 0.3, sy = ey - R * 0.26, sr = R * 0.12;
  rect(ctx, sx - sr, sy - 1.5, sr * 2, 3, '#fff6c8'); rect(ctx, sx - 1.5, sy - sr, 3, sr * 2, '#fff6c8');
  ctx.globalAlpha = 1;
  // a crooked half-smile
  const n = 11;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const bx = cx - R * 0.36 + k * R * 0.78, by = cy + R * 0.3 + Math.sin(k * 2.6) * R * 0.16;
    rect(ctx, bx - blk / 2, by - blk / 2, blk, blk, '#241d28');
  }
  if (F.mouth > 0.3) vegasSphereMouth(ctx, cx + R * 0.1, cy + R * 0.42, R * 0.7, F.mouth, '#3a1c10', '#7a3a1a');
}

// A LADYBUG. Red shell, seven spots, two white eyes. Nobody in Vegas knows
// why the Sphere does this one. The player is about to find out.
function vegasFaceLadybug(ctx, cx, cy, R, t, F) {
  ellipsePx(ctx, cx, cy, R * 0.92, R * 0.92, '#7a1a16');
  ellipsePx(ctx, cx, cy, R * 0.88, R * 0.88, '#d8382c');
  ctx.globalAlpha = 0.3; ellipsePx(ctx, cx - R * 0.3, cy - R * 0.1, R * 0.34, R * 0.4, '#ff8a70'); ctx.globalAlpha = 1;
  // the seam, lit, splitting the shell
  rect(ctx, cx - 2, cy - R * 0.5, 4, R * 1.4, '#3a0c0c');
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2.4); rect(ctx, cx - 1, cy - R * 0.5, 2, R * 1.4, '#ffd24a'); ctx.globalAlpha = 1;
  const SP = [[-0.44, 0.06, 0.15], [0.44, 0.06, 0.15], [-0.28, 0.46, 0.13], [0.28, 0.46, 0.13], [-0.58, 0.38, 0.1], [0.58, 0.38, 0.1], [0, 0.66, 0.12]];
  for (let i = 0; i < SP.length; i++) {
    const u = SP[i][0], v = SP[i][1], rr = SP[i][2];
    ellipsePx(ctx, cx + u * R, cy + v * R, R * rr * (1 - Math.abs(u) * 0.34), R * rr, '#1b0a10');
  }
  // the head band across the top, and two headlamp eyes in it
  ctx.save(); ctx.beginPath(); ctx.rect(cx - R, cy - R, R * 2, R * 0.58); ctx.clip();
  ellipsePx(ctx, cx, cy, R * 0.9, R * 0.9, '#1b1218');
  ctx.restore();
  const ox = F.look * R * 0.07 + F.gaze * R * 0.05;
  for (const d of [-1, 1]) {
    const ex = cx + d * R * 0.3, ey = cy - R * 0.44;
    ellipsePx(ctx, ex, ey, R * 0.15, R * 0.13, '#f4f1ea');
    ellipsePx(ctx, ex + ox, ey + 1, R * 0.07, R * 0.07, '#1b1218');
    px(ctx, ex + ox - 2, ey - 2, '#ffffff');
  }
  // antennae, drawn as lit LED runs off the top of the band
  for (const d of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      const ax = cx + d * (R * 0.22 + k * R * 0.26), ay = cy - R * 0.62 - k * R * 0.18;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.8 + d);
      rect(ctx, ax - 2, ay - 2, 5, 5, '#ffd24a'); ctx.globalAlpha = 1;
    }
  }
  if (F.mouth > 0.02) vegasSphereMouth(ctx, cx, cy + R * 0.84, R * 0.5, F.mouth, '#3a0c0c', '#8a2a2a');
}

// o_O. The face of a machine that has just seen the bank balance.
function vegasFaceOhO(ctx, cx, cy, R, t, F) {
  const jitter = Math.sin(t * 17) > 0.86 ? 2 : 0;
  const col = '#dfe8ff';
  // the small eye
  const lx = cx - R * 0.42 + jitter, ly = cy - R * 0.06;
  ellipseRingPx(ctx, lx, ly, R * 0.14, R * 0.14, col);
  ellipseRingPx(ctx, lx, ly, R * 0.115, R * 0.115, col);
  // the big one
  const rx = cx + R * 0.38, ry = cy - R * 0.1 - jitter;
  ellipseRingPx(ctx, rx, ry, R * 0.33, R * 0.33, col);
  ellipseRingPx(ctx, rx, ry, R * 0.30, R * 0.30, col);
  ellipseRingPx(ctx, rx, ry, R * 0.27, R * 0.27, withAlpha(col, 0.4));
  ctx.globalAlpha = 0.55; ellipsePx(ctx, rx, ry, R * 0.1, R * 0.1, col); ctx.globalAlpha = 1;
  // the underscore between them, which is the whole joke
  rect(ctx, cx - R * 0.16, cy + R * 0.06, R * 0.32, Math.max(3, R * 0.045), col);
  // a flat line of a mouth, unless it is talking
  if (F.mouth > 0.02) vegasSphereMouth(ctx, cx, cy + R * 0.54, R * 0.56, F.mouth, '#0d1020', '#3a4a6a');
  else rect(ctx, cx - R * 0.24, cy + R * 0.52, R * 0.48, 4, withAlpha(col, 0.8));
  // a scanline roll, because this one is meant to look like a glitch
  ctx.globalAlpha = 0.1;
  const ry2 = cy - R + ((t * 90) % (R * 2));
  rect(ctx, cx - R, ry2, R * 2, 8, '#8ad8ff');
  ctx.globalAlpha = 1;
}

// A HEART, with a real heartbeat: two thumps then a wait, not a sine wave.
function vegasFaceHeart(ctx, cx, cy, R, t, F) {
  const p = (t * 1.05) % 1;
  const thump = p < 0.12 ? Math.sin(p / 0.12 * Math.PI) : p < 0.34 ? Math.sin((p - 0.22) / 0.12 * Math.PI) * 0.6 : 0;
  const s = R * (0.62 + Math.max(0, thump) * 0.13);
  const heart = (sc, col) => {
    const hw = sc, hh = sc * 0.92;
    ellipsePx(ctx, cx - hw * 0.44, cy - hh * 0.3, hw * 0.48, hh * 0.44, col);
    ellipsePx(ctx, cx + hw * 0.44, cy - hh * 0.3, hw * 0.48, hh * 0.44, col);
    ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(cx - hw * 0.92, cy - hh * 0.22); ctx.lineTo(cx + hw * 0.92, cy - hh * 0.22); ctx.lineTo(cx, cy + hh * 0.86); ctx.fill();
  };
  ctx.globalAlpha = 0.18 + Math.max(0, thump) * 0.2; heart(s * 1.2, '#ff5a6a'); ctx.globalAlpha = 1;
  heart(s * 1.04, '#8a1020');
  heart(s, '#e8304a');
  ctx.globalAlpha = 0.35; heart(s * 0.6, '#ff8a9a'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.6; ellipsePx(ctx, cx - s * 0.42, cy - s * 0.4, s * 0.2, s * 0.14, '#ffd0d8'); ctx.globalAlpha = 1;
  // the trace along the bottom, the way every hospital monitor in every film does
  const bx = cx - R * 0.8, by = cy + R * 0.7;
  ctx.globalAlpha = 0.8;
  for (let i = 0; i < 40; i++) {
    const k = i / 39, tx = bx + k * R * 1.6;
    const q = (k - (t * 0.5 % 1) + 1) % 1;
    const ty = by - (q < 0.06 ? 16 : q < 0.1 ? -8 : q < 0.14 ? 22 : 0);
    rect(ctx, tx, ty, 3, 2, '#6be585');
  }
  ctx.globalAlpha = 1;
}

// And the one where the whole ball gives up on being a face and becomes a
// slot machine. Three reels, decelerating, and it never quite pays.
const VEGAS_REEL_STOPS = [2, 3, 2];   // lands on BAR BAR CHERRY. So close. Every time.
function vegasSlotSymbol(ctx, x, y, s, kind, t) {
  switch (kind % 5) {
    case 0:  // a seven
      rect(ctx, x - s * 0.4, y - s * 0.5, s * 0.8, s * 0.2, '#e8304a');
      ctx.fillStyle = '#e8304a'; ctx.beginPath();
      ctx.moveTo(x + s * 0.4, y - s * 0.3); ctx.lineTo(x + s * 0.1, y + s * 0.5); ctx.lineTo(x - s * 0.16, y + s * 0.5); ctx.lineTo(x + s * 0.16, y - s * 0.3); ctx.fill();
      break;
    case 1:  // cherries
      for (const d of [-1, 1]) { ellipsePx(ctx, x + d * s * 0.26, y + s * 0.22, s * 0.24, s * 0.24, '#c8202c'); ellipsePx(ctx, x + d * s * 0.26 - 2, y + s * 0.14, s * 0.08, s * 0.06, '#ff8a80'); line(ctx, x + d * s * 0.26, y + s * 0.02, x, y - s * 0.44, '#2f8f4a'); }
      ellipsePx(ctx, x + s * 0.1, y - s * 0.44, s * 0.16, s * 0.08, '#2f8f4a');
      break;
    case 2:  // a bell
      ctx.fillStyle = '#f2c94c'; ctx.beginPath();
      ctx.moveTo(x, y - s * 0.46); ctx.lineTo(x + s * 0.42, y + s * 0.24); ctx.lineTo(x - s * 0.42, y + s * 0.24); ctx.fill();
      ellipsePx(ctx, x, y + s * 0.24, s * 0.42, s * 0.12, '#f2c94c');
      rect(ctx, x - s * 0.5, y + s * 0.3, s, s * 0.1, '#c8a03a');
      ellipsePx(ctx, x, y + s * 0.44, s * 0.1, s * 0.1, '#c8a03a');
      ctx.globalAlpha = 0.5; rect(ctx, x - s * 0.22, y - s * 0.24, s * 0.1, s * 0.4, '#fff0b0'); ctx.globalAlpha = 1;
      break;
    case 3:  // a BAR, the most boring symbol ever printed
      rect(ctx, x - s * 0.5, y - s * 0.34, s, s * 0.68, '#241d28');
      rect(ctx, x - s * 0.46, y - s * 0.3, s * 0.92, s * 0.6, '#f4f1ea');
      drawText(ctx, 'BAR', x, y - s * 0.2, '#241d28', { align: 'center', scale: Math.max(1, Math.round(s / 14)) });
      break;
    default:  // a ladybug, which pays nothing and is not on the paytable
      ellipsePx(ctx, x, y + s * 0.06, s * 0.42, s * 0.4, '#d8382c');
      rect(ctx, x - 1, y - s * 0.3, 2, s * 0.7, '#1b0a10');
      ellipsePx(ctx, x - s * 0.18, y + s * 0.1, s * 0.11, s * 0.11, '#1b0a10');
      ellipsePx(ctx, x + s * 0.18, y + s * 0.1, s * 0.11, s * 0.11, '#1b0a10');
      ctx.save(); ctx.beginPath(); ctx.rect(x - s * 0.5, y - s * 0.4, s, s * 0.22); ctx.clip();
      ellipsePx(ctx, x, y + s * 0.06, s * 0.42, s * 0.4, '#1b1218'); ctx.restore();
      break;
  }
}
function vegasFaceSlots(ctx, cx, cy, R, t, F) {
  const ft = F.faceT;
  const cabW = R * 1.72, cabH = R * 1.12;
  rect(ctx, cx - cabW / 2 - 6, cy - cabH / 2 - 6, cabW + 12, cabH + 12, '#2a1c10');
  rect(ctx, cx - cabW / 2 - 3, cy - cabH / 2 - 3, cabW + 6, cabH + 6, '#c8a03a');
  rect(ctx, cx - cabW / 2, cy - cabH / 2, cabW, cabH, '#0d0b14');
  const rw = cabW / 3 - 6;
  let allStopped = true;
  for (let i = 0; i < 3; i++) {
    const rx = cx - cabW / 2 + 3 + i * (cabW / 3) + rw / 2;
    rect(ctx, rx - rw / 2, cy - cabH / 2 + 4, rw, cabH - 8, '#f0ece2');
    ctx.globalAlpha = 0.22; vgrad(ctx, rx - rw / 2, cy - cabH / 2 + 4, rw, cabH - 8, '#241d28', '#ffffff'); ctx.globalAlpha = 1;
    const dur = 2.1 + i * 0.85;
    const k = clamp(ft / dur, 0, 1);
    const travel = 11 + i * 4;
    const pos = (1 - Math.pow(1 - k, 3)) * travel;
    if (k < 1) allStopped = false;
    const step = cabH * 0.5;
    ctx.save(); ctx.beginPath(); ctx.rect(rx - rw / 2, cy - cabH / 2 + 4, rw, cabH - 8); ctx.clip();
    for (let s = -2; s <= 2; s++) {
      const idx = Math.floor(pos) + s + VEGAS_REEL_STOPS[i];
      const off = (pos - Math.floor(pos)) * step;
      vegasSlotSymbol(ctx, rx, cy + s * step + off, rw * 0.62, ((idx % 5) + 5) % 5, t);
    }
    ctx.restore();
    rect(ctx, rx - rw / 2, cy - cabH / 2 + 4, rw, 3, '#8a8478');
  }
  // the payline, and the honest verdict
  ctx.globalAlpha = 0.7; rect(ctx, cx - cabW / 2, cy - 1, cabW, 2, '#e8304a'); ctx.globalAlpha = 1;
  if (allStopped) {
    const fl = Math.sin(t * 9) > 0;
    ctx.globalAlpha = fl ? 1 : 0.35;
    drawText(ctx, 'SO CLOSE', cx, cy + cabH / 2 + 10, '#ffd24a', { align: 'center', scale: 3, outline: '#3a2408' });
    ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) {
      const a = i * 0.524 + t * 1.4;
      ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + i);
      rect(ctx, cx + Math.cos(a) * R * 0.86 - 2, cy + Math.sin(a) * R * 0.7 - 2, 5, 5, i % 2 ? '#ffd24a' : '#ff8ad8');
      ctx.globalAlpha = 1;
    }
  }
}

// The table. Order matters: this is the rotation the Sphere runs all night.
const SPHERE_FACES = [
  { id: 'eye',     label: 'THE EYE',  bg: '#0b0a16', lids: true,  draw: vegasFaceEye },
  { id: 'smile',   label: 'SMILE',    bg: '#120e04', lids: true,  draw: vegasFaceSmile },
  { id: 'slots',   label: 'REELS',    bg: '#0a0c10', lids: false, draw: vegasFaceSlots },
  { id: 'wink',    label: 'WINK',     bg: '#140e04', lids: true,  draw: vegasFaceWink },
  { id: 'ladybug', label: 'LADYBUG',  bg: '#1a0608', lids: true,  draw: vegasFaceLadybug },
  { id: 'oho',     label: 'O UNDER O',bg: '#060912', lids: true,  draw: vegasFaceOhO },
  { id: 'heart',   label: 'HEART',    bg: '#16060c', lids: false, draw: vegasFaceHeart },
];

// ---------- driving the head ----------
// One step function, fed the scene clock. It works out its own dt so that
// drawVegasSphere can be called from anywhere without a tick being wired up.
function vegasSphereStep(F, t, S) {
  const dt = (F.lt < 0 || t < F.lt) ? 0 : Math.min(0.1, t - F.lt);
  F.lt = t; F.clock += dt; F.faceT += dt;
  // where it is looking: mostly at you, partly wherever it feels like
  if (S && S.body) {
    const want = clamp((S.body.x - VEGAS_SPHERE_WORLD) / 620, -1, 1);
    F.gaze += (want - F.gaze) * Math.min(1, dt * 2.2);
    F.gazeY += ((S.body.floor > 0 ? 0.35 : -0.1) - F.gazeY) * Math.min(1, dt * 1.6);
  }
  F.lookIn -= dt;
  if (F.lookIn <= 0) {
    F.lookGoal = [-1, -0.55, 0, 0, 0.55, 1][Math.floor(Math.random() * 6)];
    F.lookIn = 1.3 + Math.random() * 2.8;
  }
  F.look += (F.lookGoal - F.look) * Math.min(1, dt * 4.5);
  // blinking, on no schedule anybody could dance to
  F.blinkIn -= dt;
  if (F.blinkIn <= 0) {
    F.blink = 0.2;
    F.blinkIn = Math.random() < 0.26 ? 0.3 : 1.1 + Math.random() * 4.1;
  }
  F.blink = Math.max(0, F.blink - dt);
  // the expression rotation
  F.hold -= dt;
  F.wipe = Math.min(1, F.wipe + dt / VEGAS_WIPE_DUR);
  if (F.hold <= 0) {
    F.from = F.idx;
    F.idx = (F.idx + 1) % SPHERE_FACES.length;
    F.wipe = 0; F.faceT = 0;
    F.hold = 7.4 + Math.random() * 1.8;
  }
  // the mouth. Shut unless it is talking at you, then flapping.
  F.talk = Math.max(0, F.talk - dt);
  const flap = F.talk > 0 ? 0.3 + 0.7 * Math.abs(Math.sin(t * 15)) : 0;
  F.mouth += (flap - F.mouth) * Math.min(1, dt * 18);
}

// The eyelids. Not a fade - two shells of dark LED that actually come down
// and up, with a lit edge on them so you can see the lid move.
function vegasSphereLids(ctx, cx, cy, R, F) {
  const k = F.blink > 0 ? Math.sin((1 - F.blink / 0.2) * Math.PI) : 0;
  if (k <= 0.01) return;
  const drop = k * R * 1.06;
  rect(ctx, cx - R, cy - R, R * 2, drop, VEGAS_PAL.shell);
  rect(ctx, cx - R, cy - R + drop - 3, R * 2, 3, '#4a3f66');
  ctx.globalAlpha = 0.4; rect(ctx, cx - R, cy - R + drop - 6, R * 2, 3, '#8a7ab0'); ctx.globalAlpha = 1;
  const rise = k * R * 0.92;
  rect(ctx, cx - R, cy + R - rise, R * 2, rise, VEGAS_PAL.shell);
  rect(ctx, cx - R, cy + R - rise, R * 2, 3, '#4a3f66');
}

// Changing face. Half the time a bar wipes down the ball; the other half it
// dissolves in blocks, the way a big LED wall does when it loses a frame.
function vegasSphereWipe(ctx, cx, cy, R, k, seed, paint) {
  ctx.save();
  ctx.beginPath();
  if (seed % 2 === 0) {
    ctx.rect(cx - R, cy - R, R * 2, Math.round(2 * R * k) + 1);
  } else {
    const n = 13, s = (R * 2) / n, rr = makeRng(4242);
    for (let iy = 0; iy < n; iy++) {
      for (let ix = 0; ix < n; ix++) {
        if (rr() < k) ctx.rect(cx - R + ix * s, cy - R + iy * s, Math.ceil(s) + 1, Math.ceil(s) + 1);
      }
    }
  }
  ctx.clip();
  paint();
  ctx.restore();
  if (seed % 2 === 0 && k > 0.02 && k < 0.99) {
    const y = cy - R + 2 * R * k;
    ctx.globalAlpha = 0.9; rect(ctx, cx - R, y - 3, R * 2, 3, '#ffe9a8'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.3; rect(ctx, cx - R, y - 12, R * 2, 9, '#ffd24a'); ctx.globalAlpha = 1;
  }
}

// The LED grid, laid over whatever the face is doing. Longitudes squashed
// toward the edge so the thing reads as a ball and not a circle.
function vegasSphereLeds(ctx, cx, cy, R, t) {
  ctx.globalAlpha = 0.22;
  for (let i = -6; i <= 6; i++) {
    const rx = Math.max(1.5, R * 0.085 * Math.abs(i));
    ellipseRingPx(ctx, cx + i * (R / 6) * 0.64, cy, rx, R, '#05040a');
  }
  for (let i = -7; i <= 7; i++) rect(ctx, cx - R, Math.round(cy + i * (R / 6.4)), R * 2, 1, '#05040a');
  ctx.globalAlpha = 0.07;
  for (let y = -R; y < R; y += 3) rect(ctx, cx - R, cy + y, R * 2, 1, '#000000');
  ctx.globalAlpha = 1;
}

// ---------- THE SPHERE ----------
// Legs first, then the plaza it stands on, then the ball, then whatever it has
// decided its face is this minute. Everything inside the shell is clipped to
// the shell, so the face wraps instead of sitting on it like a sticker.
function drawVegasSphere(ctx, cx, cy, R, t, S) {
  const F = VEGAS_SPHERE;
  vegasSphereStep(F, t, S);
  const cur = SPHERE_FACES[F.idx], prev = SPHERE_FACES[F.from];

  // the stain it puts on the sky for half a mile in every direction
  ctx.globalAlpha = 0.09 + 0.035 * Math.sin(t * 1.3);
  ellipsePx(ctx, cx, cy + R * 0.1, R * 2.1, R * 1.65, '#5a2a7a');
  ctx.globalAlpha = 0.06 + 0.03 * Math.sin(t * 1.3 + 1);
  ellipsePx(ctx, cx, cy, R * 1.4, R * 1.35, mixColor('#ffffff', cur.bg, 0.4));
  ctx.globalAlpha = 1;

  // the scaffolding: four splayed legs and the bracing between them
  const legY0 = cy + R * 0.58, legY1 = cy + R * 1.46;
  for (const d of [-1, -0.36, 0.36, 1]) {
    const x0 = cx + d * R * 0.7, x1 = cx + d * R * 1.14;
    ctx.fillStyle = '#17141f'; ctx.beginPath();
    ctx.moveTo(x0 - 6, legY0); ctx.lineTo(x0 + 6, legY0); ctx.lineTo(x1 + 9, legY1); ctx.lineTo(x1 - 9, legY1); ctx.fill();
    ctx.globalAlpha = 0.6; line(ctx, x0 - 5, legY0, x1 - 8, legY1, '#3f3858'); ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.7;
  for (let i = 1; i < 4; i++) {
    const k = i / 4, y = lerp(legY0, legY1, k);
    line(ctx, cx - lerp(R * 0.7, R * 1.14, k), y, cx + lerp(R * 0.7, R * 1.14, k), y, '#241f36');
  }
  ctx.globalAlpha = 1;

  // the plaza underneath, where the tour buses stop and nobody looks down
  const py = legY1;
  rect(ctx, cx - R * 1.75, py, R * 3.5, 30, '#221c33');
  rect(ctx, cx - R * 1.75, py, R * 3.5, 3, '#4a3e66');
  ctx.globalAlpha = 0.2; ellipsePx(ctx, cx, py + 4, R * 1.5, 22, '#ffd8a0'); ctx.globalAlpha = 1;
  for (let i = 0; i < 9; i++) {
    const lx = cx - R * 1.6 + i * (R * 3.2 / 8);
    rect(ctx, lx - 1, py - 14, 3, 14, '#2f2a44');
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 2 + i); ellipsePx(ctx, lx, py - 15, 4, 3, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  // the little black dots that are people, looking up
  const rr = makeRng(9191);
  for (let i = 0; i < 22; i++) {
    const hx = cx - R * 1.6 + rr.range(0, R * 3.2), hy = py + rr.range(4, 22);
    rect(ctx, hx, hy, 2, 4, '#0d0a14');
  }

  // the shell
  ellipsePx(ctx, cx, cy, R + 4, R + 4, '#06050c');
  ellipsePx(ctx, cx, cy, R, R, VEGAS_PAL.shell);

  ctx.save();
  ctx.beginPath(); ctx.ellipse(cx, cy, R - 2, R - 2, 0, 0, 6.2832); ctx.clip();
  const paintCur = () => { rect(ctx, cx - R, cy - R, R * 2, R * 2, cur.bg); cur.draw(ctx, cx, cy, R, t, F); };
  if (F.wipe < 1 && prev !== cur) {
    rect(ctx, cx - R, cy - R, R * 2, R * 2, prev.bg);
    prev.draw(ctx, cx, cy, R, t, F);
    vegasSphereWipe(ctx, cx, cy, R, F.wipe, F.idx, paintCur);
  } else paintCur();
  if (cur.lids) vegasSphereLids(ctx, cx, cy, R, F);
  vegasSphereLeds(ctx, cx, cy, R, t);
  // the sheen: a fixed highlight top left, plus one slow band travelling round
  ctx.globalAlpha = 0.1; ellipsePx(ctx, cx - R * 0.34, cy - R * 0.4, R * 0.44, R * 0.3, '#ffffff');
  ctx.globalAlpha = 0.05; ellipsePx(ctx, cx - R * 0.26, cy - R * 0.32, R * 0.64, R * 0.52, '#cfe4ff');
  ctx.globalAlpha = 0.05;
  const bx = cx - R + ((t * 26) % (R * 3)) - R * 0.5;
  ctx.fillStyle = '#dff0ff'; ctx.beginPath();
  ctx.moveTo(bx, cy + R); ctx.lineTo(bx + 26, cy + R); ctx.lineTo(bx + 26 + R * 1.2, cy - R); ctx.lineTo(bx + R * 1.2, cy - R); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // the rim, which is the only thing telling you it is a solid object
  ellipseRingPx(ctx, cx, cy, R, R, '#332c4a');
  ctx.globalAlpha = 0.55; ellipseRingPx(ctx, cx, cy, R - 1, R - 1, '#6a5f8a'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.35; ellipseRingPx(ctx, cx, cy, R - 3, R - 3, mixColor(cur.bg, '#ffffff', 0.5)); ctx.globalAlpha = 1;

  // the aircraft warning light, blinking on top, for the planes it is under
  ctx.globalAlpha = Math.sin(t * 2.4) > 0.6 ? 1 : 0.15;
  circle(ctx, cx, cy - R - 4, 3, '#ff3a3a');
  ctx.globalAlpha = 1;
}

// ---------- bits every casino needs ----------
// Centred neon, because neonSign wants a left edge and every sign on this
// street is centred on its own building.
function vegasNeon(ctx, cx, y, text, col, t, opts) {
  const o = Object.assign({ scale: 4 }, opts || {});
  neonSign(ctx, Math.round(cx - textWidth(text, { scale: o.scale }) / 2), Math.round(y), text, col, t, o);
}
// A frame of bulbs that chase round the edge. Old Vegas ran on these.
function vegasBulbFrame(ctx, x, y, w, h, t, col, step) {
  const s = step || 14, dim = darken(col, 0.45);
  const pts = [];
  for (let i = x; i < x + w; i += s) pts.push([i, y]);
  for (let i = y; i < y + h; i += s) pts.push([x + w, i]);
  for (let i = x + w; i > x; i -= s) pts.push([i, y + h]);
  for (let i = y + h; i > y; i -= s) pts.push([x, i]);
  const ch = Math.floor(t * 7);
  for (let i = 0; i < pts.length; i++) {
    const on = (i + ch) % 3 === 0;
    circle(ctx, pts[i][0], pts[i][1], on ? 3 : 2, on ? col : dim);
    if (on) { ctx.globalAlpha = 0.25; circle(ctx, pts[i][0], pts[i][1], 6, col); ctx.globalAlpha = 1; }
  }
}
// The wash a lit building throws down onto the plaza in front of it.
function vegasUplight(ctx, x, w, base, col, amt) {
  ctx.globalAlpha = amt != null ? amt : 0.12;
  ellipsePx(ctx, x + w / 2, base + 4, w * 0.6, 26, col);
  ctx.globalAlpha = 1;
}
// What all that neon actually lands on. Every casino up on the plaza is a
// lamp aimed at a pavement, and the pavement is the only thing on this street
// that looks good in the light it is given. Drawn under everybody's feet.
function vegasSpill(ctx, S, t) {
  for (let i = 0; i < VEGAS_CASINOS.length; i++) {
    const c = VEGAS_CASINOS[i];
    const cx = c.x + c.w / 2;
    if (!S.cam.visible(cx, c.w)) continue;
    ctx.globalAlpha = 0.08 + 0.025 * Math.sin(t * 1.1 + i * 1.7);
    ellipsePx(ctx, cx, VEGAS_F1 + 12, c.w * 0.46, 28, c.neon);
    ctx.globalAlpha = 0.05;
    ellipsePx(ctx, cx, VEGAS_F1 + 6, c.w * 0.22, 14, '#ffffff');
    ctx.globalAlpha = 0.09;
    rect(ctx, cx - c.w * 0.3, VEGAS_F1 + 3, c.w * 0.6, 2, c.neon);
    ctx.globalAlpha = 1;
  }
}
// The pavement itself, which four years of walking on has taught the player
// in detail: the grates, the taped-over cracks, the gum, and the handbills
// that get dropped the moment they are handed over.
function vegasGutter(ctx, S, t) {
  const r = makeRng(3141);
  for (let i = 0; i < 44; i++) {
    const gx = r.range(40, VEGAS_W - 40);
    const kind = r.int(0, 4);
    const gy = VEGAS_F1 + r.range(6, VEGAS_KERB - VEGAS_F1 - 4);
    const wob = r.range(0, 6.28);
    if (!S.cam.visible(gx, 60)) continue;
    if (kind === 0) {
      // a drain grate, sunk a little, with the dark under it
      rect(ctx, gx - 15, gy - 5, 30, 11, '#2f2b3a');
      rect(ctx, gx - 13, gy - 3, 26, 7, '#15131d');
      for (let b = 0; b < 5; b++) rect(ctx, gx - 11 + b * 5, gy - 3, 2, 7, '#3f3a52');
      rect(ctx, gx - 15, gy - 5, 30, 1, '#6a6280');
    } else if (kind === 1) {
      // a crack somebody taped instead of fixing
      for (let b = 0; b < 5; b++) rect(ctx, gx + b * 6, gy + Math.round(Math.sin(b + wob) * 2), 6, 1, '#2f2b3a');
    } else if (kind === 2) {
      // gum. There is no cleaning this off, so nobody has.
      ctx.globalAlpha = 0.5; ellipsePx(ctx, gx, gy, 3, 2, '#3a3648'); ctx.globalAlpha = 1;
    } else if (kind === 3) {
      // a dropped handbill, face down, the way they all end up
      ctx.globalAlpha = 0.28; ellipsePx(ctx, gx + 1, gy + 3, 7, 3, '#000000'); ctx.globalAlpha = 1;
      rect(ctx, gx - 6, gy - 4, 13, 8, '#d8d2c2');
      rect(ctx, gx - 6, gy - 4, 13, 2, '#f0ead8');
      rect(ctx, gx - 4, gy, 9, 1, '#8a8478');
    } else {
      // a smear of something wet, catching whatever colour is overhead
      ctx.globalAlpha = 0.1 + 0.04 * Math.sin(t * 1.6 + wob);
      ellipsePx(ctx, gx, gy, 14, 4, '#8ad8ff'); ctx.globalAlpha = 1;
    }
  }
}
// A palm. Vegas planted thousands of them in a desert that never asked.
function vegasPalm(ctx, x, base, h, seed, t) {
  const r = makeRng(seed);
  const lean = r.range(-0.1, 0.1);
  const top = base - h;
  for (let i = 0; i < 12; i++) {
    const k = i / 12, y = lerp(base, top, k), tx = x + lean * h * k * k;
    rect(ctx, tx - 5 + k * 2, y - h / 12, 10 - k * 4, h / 12 + 1, i % 2 ? '#5a4432' : '#6a5240');
    rect(ctx, tx - 5 + k * 2, y - h / 12, 3, h / 12 + 1, '#7a6250');
  }
  const tx = x + lean * h, sway = Math.sin(t * 0.9 + seed) * 3;
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI / 2 + (i - 4) * 0.42 + sway * 0.01;
    const L = h * (0.34 + (i % 3) * 0.05);
    const ex = tx + Math.cos(a) * L + sway, ey = top + Math.sin(a) * L * 0.72;
    const col = i % 2 ? '#2f6a3a' : '#3d8a4a';
    line(ctx, tx, top, ex, ey, col);
    for (let f = 2; f < 9; f++) {
      const k = f / 9;
      const fx = lerp(tx, ex, k), fy = lerp(top, ey, k) + Math.sin(k * 3) * 4;
      rect(ctx, fx - 3, fy - 1, 7, 3, col);
    }
  }
  ellipsePx(ctx, tx, top - 2, 6, 5, '#4a3a28');
}
// A limo or a taxi, seen side on, crawling.
function vegasCar(ctx, c, t) {
  const x = c.x, y = c.y, w = c.w, h = 26;
  ctx.globalAlpha = 0.34; ellipsePx(ctx, x + w / 2, y + 2, w * 0.46, 5, '#000000'); ctx.globalAlpha = 1;
  rect(ctx, x, y - h, w, h, c.col);
  rect(ctx, x, y - h, w, 3, lighten(c.col, 0.28));
  rect(ctx, x, y - 6, w, 6, darken(c.col, 0.3));
  // the cabin, which is the bit that tells you what kind of car it is
  const cw = c.kind === 'limo' ? w * 0.3 : w * 0.46, cx0 = c.kind === 'limo' ? x + w * 0.62 : x + w * 0.26;
  rect(ctx, cx0, y - h - 15, cw, 16, darken(c.col, 0.2));
  rect(ctx, cx0 + 2, y - h - 13, cw - 4, 12, '#1b2436');
  ctx.globalAlpha = 0.35; rect(ctx, cx0 + 2, y - h - 13, cw - 4, 5, '#8fc0e4'); ctx.globalAlpha = 1;
  if (c.kind === 'taxi') {
    rect(ctx, cx0 + cw * 0.3, y - h - 22, cw * 0.4, 7, '#f2c94c');
    drawText(ctx, 'TAXI', cx0 + cw * 0.5, y - h - 21, '#241d28', { align: 'center', font: 'small' });
    for (let i = 0; i < 4; i++) rect(ctx, x + 6 + i * 14, y - h + 5, 8, 6, i % 2 ? '#241d28' : '#f2c94c');
  }
  if (c.kind === 'limo') {
    for (let i = 0; i < 5; i++) { rect(ctx, x + 8 + i * (w * 0.1), y - h - 12, w * 0.06, 11, '#0d1018'); }
    ctx.globalAlpha = 0.4; rect(ctx, x + 4, y - h + 8, w - 8, 2, '#8ad8ff'); ctx.globalAlpha = 1;
  }
  // wheels, lights, and the brake lamps that have been on for nine minutes
  circle(ctx, x + w * 0.16, y - 2, 6, '#1b1b24'); circle(ctx, x + w * 0.16, y - 2, 3, '#4a4a58');
  circle(ctx, x + w * 0.84, y - 2, 6, '#1b1b24'); circle(ctx, x + w * 0.84, y - 2, 3, '#4a4a58');
  const fx = c.face > 0 ? x + w : x;
  rect(ctx, fx - (c.face > 0 ? 4 : 0), y - h + 4, 4, 5, '#fff2c0');
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3 + x); rect(ctx, c.face > 0 ? x : x + w - 4, y - h + 4, 4, 5, '#e8303a'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.1; ellipsePx(ctx, fx, y - 4, 40, 10, '#fff2c0'); ctx.globalAlpha = 1;
}

// ---------- the casinos ----------
// Eleven buildings, all of them lying about what they are. Names are bugs,
// because everything in this game is a bug, and because a real one would be
// a lawsuit.
const VEGAS_CASINOS = [
  { kind: 'pyramid',  x: 40,   w: 330, h: 280, name: 'LARVA',     neon: '#8ad8ff' },
  { kind: 'fountain', x: 400,  w: 500, h: 132, name: 'BEETLAGIO', neon: '#8ad8ff' },
  { kind: 'palace',   x: 930,  w: 350, h: 240, name: "KAISER'S",  neon: '#ffd24a' },
  { kind: 'tower',    x: 1310, w: 220, h: 284, name: 'STRATOSWARM', neon: '#f2c94c' },
  { kind: 'mirage',   x: 1560, w: 250, h: 236, name: 'MIRAGE',    neon: '#6be585' },
  { kind: 'cowboy',   x: 1840, w: 220, h: 224, name: 'HOWDY',     neon: '#e8503a' },
  { kind: 'marquee',  x: 2090, w: 280, h: 238, name: 'SILVER CICADA', neon: '#ffd24a' },
  { kind: 'chapel',   x: 2400, w: 195, h: 188, name: 'LITTLE WINGS', neon: '#ff8ad8' },
  { kind: 'pawn',     x: 2620, w: 180, h: 176, name: 'SIX LEGS',  neon: '#6be585' },
  { kind: 'flamingo', x: 2825, w: 210, h: 218, name: 'FLAMINGBUG', neon: '#ff8ad8' },
  { kind: 'buffet',   x: 3060, w: 230, h: 196, name: 'MOTH BUFFET', neon: '#f2a03a' },
];

// LARVA: black glass, gold edges, and a beam out of the apex that you can see
// from the plane. They aimed it at nothing in particular.
function vegasPyramid(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, apex = base - h;
  ctx.globalAlpha = 0.1 + 0.035 * Math.sin(t * 0.9);
  ctx.fillStyle = '#dff0ff'; ctx.beginPath();
  ctx.moveTo(cx - 9, apex); ctx.lineTo(cx + 9, apex); ctx.lineTo(cx + 58, -520); ctx.lineTo(cx - 58, -520); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#0c0f17'; ctx.beginPath(); ctx.moveTo(cx, apex); ctx.lineTo(x, base); ctx.lineTo(x + w, base); ctx.fill();
  ctx.fillStyle = '#141c2a'; ctx.beginPath(); ctx.moveTo(cx, apex); ctx.lineTo(x + w, base); ctx.lineTo(cx, base); ctx.fill();
  for (let i = 1; i < 16; i++) {
    const k = i / 16, yy = lerp(apex, base, k), hw = (w / 2) * k;
    ctx.globalAlpha = 0.22; rect(ctx, cx - hw, yy, hw * 2, 1, '#2f4a68'); ctx.globalAlpha = 1;
  }
  const r = makeRng(hashStr('larva'));
  for (let i = 0; i < 90; i++) {
    const k = r.range(0.14, 0.99), yy = lerp(apex, base, k), hw = (w / 2) * k * 0.92;
    const wx = cx + r.range(-hw, hw);
    if (Math.sin(t * 0.7 + i * 2.3) > -0.4) rect(ctx, wx, yy - 4, 2, 3, i % 5 ? '#ffd8a0' : '#8ad8ff');
  }
  line(ctx, cx, apex, x, base, VEGAS_PAL.goldLo);
  line(ctx, cx, apex, x + w, base, VEGAS_PAL.goldLo);
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4); circle(ctx, cx, apex, 5, '#ffffff'); ctx.globalAlpha = 1;
  // the sphinx, which is a beetle with its legs tucked under and no comment
  const sx = x + w * 0.12, sy = base;
  ellipsePx(ctx, sx, sy - 22, 30, 15, '#c8a86a'); rect(ctx, sx - 30, sy - 22, 60, 22, '#c8a86a');
  rect(ctx, sx - 30, sy - 22, 60, 3, '#e0c088');
  ellipsePx(ctx, sx - 22, sy - 46, 13, 14, '#c8a86a');
  rect(ctx, sx - 34, sy - 52, 24, 9, '#2f4a8a'); rect(ctx, sx - 34, sy - 52, 24, 2, '#4a6fb0');
  rect(ctx, sx - 27, sy - 44, 3, 3, '#241d28'); rect(ctx, sx - 20, sy - 44, 3, 3, '#241d28');
  vegasUplight(ctx, x, w, base, '#8ad8ff', 0.14);
  vegasNeon(ctx, cx, base - 68, 'LARVA', c.neon, t, { scale: 5 });
  drawText(ctx, 'HOTEL AND CASINO', cx, base - 24, withAlpha('#8ad8ff', 0.8), { align: 'center', scale: 2 });
}

// BEETLAGIO: a lake, a colonnade, and jets that go up on a schedule nobody
// has ever caught the start of. The one honest beautiful thing on the street.
function vegasFountainWater(ctx, c, t) {
  const x = c.x, w = c.w, top = VEGAS_F0 + 6, bot = VEGAS_F1 - 14;
  rect(ctx, x, top, w, bot - top, '#102a3e');
  ctx.globalAlpha = 0.5; vgrad(ctx, x, top, w, bot - top, '#1f5a7a', '#081a2a'); ctx.globalAlpha = 1;
  // the surface: flat bands that shuffle, which is all water needs to be
  for (let i = 0; i < 10; i++) {
    const yy = top + 3 + i * ((bot - top - 6) / 10);
    const off = Math.sin(t * 1.4 + i * 0.9) * 10;
    ctx.globalAlpha = 0.12 + (i % 3) * 0.05;
    rect(ctx, x + 6 + off, yy, w - 12, 2, '#9fd8ff');
    ctx.globalAlpha = 1;
  }
  // the jets
  for (let i = 0; i < 11; i++) {
    const jx = x + 26 + i * ((w - 52) / 10);
    const ph = Math.sin(t * 0.72 + i * 0.52) + Math.sin(t * 0.31 + i * 1.7) * 0.5;
    const jh = Math.max(0, ph) * (58 + (i % 3) * 30);
    if (jh < 3) continue;
    const jy = top + 6;
    for (let s = 0; s < 10; s++) {
      const k = s / 10, yy = jy - jh * k;
      const ww = Math.max(1, 5 * (1 - k * 0.7));
      ctx.globalAlpha = 0.5 + 0.3 * (1 - k);
      rect(ctx, jx - ww / 2, yy - 5, ww, 6, '#cfeaff');
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.28; ellipsePx(ctx, jx, jy - jh - 3, 7, 5, '#eaf6ff'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.16; ellipsePx(ctx, jx, jy + 2, 12, 4, '#ffffff'); ctx.globalAlpha = 1;
  }
  // the coping round the edge and the reflection of the lights on it
  rect(ctx, x, top - 4, w, 5, '#8a8478'); rect(ctx, x, top - 4, w, 2, '#b4ac9c');
  rect(ctx, x, bot - 4, w, 6, '#6a6458'); rect(ctx, x, bot - 4, w, 2, '#8a8478');
}
function vegasFountainHouse(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, top = base - h;
  rect(ctx, x, top, w, h, '#3a3244');
  rect(ctx, x, top, w, 4, '#5f5474');
  glassWall(ctx, x + 10, top + 16, w - 20, h - 34, t, { tint: '#233a52', top: '#7fb0d4', bot: '#14202e', mullion: 46, rail: 40 });
  for (let i = 0; i < 9; i++) {
    const px0 = x + 14 + i * ((w - 28) / 8);
    rect(ctx, px0 - 5, base - 40, 10, 40, '#cfc6b4');
    rect(ctx, px0 - 5, base - 40, 3, 40, '#e8e0cc');
    rect(ctx, px0 - 8, base - 44, 16, 5, '#e0d6c0');
  }
  ctx.globalAlpha = 0.5; rect(ctx, x, top + 10, w, 2, '#c8a03a'); ctx.globalAlpha = 1;
  vegasUplight(ctx, x, w, base, '#8ad8ff', 0.1);
  vegasNeon(ctx, x + w / 2, top - 34, 'BEETLAGIO', c.neon, t, { scale: 4 });
}

// KAISER'S PALACE: columns, statues, and the strong impression that somebody
// read one page about Rome and stopped.
function vegasPalace(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, top = base - h, cx = x + w / 2;
  rect(ctx, x, top + 46, w, h - 46, '#d8cfb8');
  rect(ctx, x, top + 46, w, 4, '#f0e8d4');
  ctx.globalAlpha = 0.22; vgrad(ctx, x, top + 46, w, h - 46, '#ffffff', '#5a5044'); ctx.globalAlpha = 1;
  // the pediment
  ctx.fillStyle = '#e8e0cc'; ctx.beginPath();
  ctx.moveTo(cx, top); ctx.lineTo(x + 4, top + 48); ctx.lineTo(x + w - 4, top + 48); ctx.fill();
  ctx.fillStyle = '#b8ae96'; ctx.beginPath();
  ctx.moveTo(cx, top + 10); ctx.lineTo(x + 26, top + 44); ctx.lineTo(x + w - 26, top + 44); ctx.fill();
  drawText(ctx, 'MMIX', cx, top + 28, '#6a6050', { align: 'center', scale: 2 });
  // the colonnade
  for (let i = 0; i < 7; i++) {
    const px0 = x + 22 + i * ((w - 44) / 6);
    rect(ctx, px0 - 9, top + 50, 18, h - 56, '#efe7d2');
    for (let f = -3; f <= 3; f++) { ctx.globalAlpha = 0.25; rect(ctx, px0 + f * 2.4, top + 54, 1, h - 64, '#8a8070'); ctx.globalAlpha = 1; }
    rect(ctx, px0 - 12, top + 46, 24, 8, '#f4eddc');
    rect(ctx, px0 - 12, base - 10, 24, 10, '#cfc6b0');
  }
  // two statues, lit from below, doing nothing in particular for ever
  for (const d of [-1, 1]) {
    const sx = cx + d * w * 0.34;
    rect(ctx, sx - 12, base - 18, 24, 18, '#cfc6b0'); rect(ctx, sx - 12, base - 18, 24, 3, '#e8e0cc');
    ellipsePx(ctx, sx, base - 38, 9, 20, '#f0e8d4');
    ellipsePx(ctx, sx, base - 60, 7, 7, '#f4eddc');
    rect(ctx, sx - (d > 0 ? 2 : 14), base - 56, 16, 3, '#f0e8d4');
    ctx.globalAlpha = 0.16; ellipsePx(ctx, sx, base - 42, 22, 34, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  vegasUplight(ctx, x, w, base, '#ffd8a0', 0.16);
  // one long sign, the way the real ones are. Two stacked signs used to sit
  // on top of each other up here, which read as a printing error.
  vegasNeon(ctx, cx, top - 40, "KAISER'S PALACE", c.neon, t, { scale: 3 });
}

// STRATOSWARM: a needle with a pod on it and a ride on top that spins. You
// can hear the screaming from the sidewalk. It is a long way up.
function vegasTower(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x + w * 0.2, base - 70, w * 0.6, 70, '#3f3a52');
  rect(ctx, x + w * 0.2, base - 70, w * 0.6, 3, '#6a6288');
  glassWall(ctx, x + w * 0.24, base - 62, w * 0.52, 52, t, { tint: '#2a2a44', mullion: 30, rail: 26 });
  // the shaft
  ctx.fillStyle = '#4a4360'; ctx.beginPath();
  ctx.moveTo(cx - 20, base - 60); ctx.lineTo(cx - 9, top + 60); ctx.lineTo(cx + 9, top + 60); ctx.lineTo(cx + 20, base - 60); ctx.fill();
  ctx.globalAlpha = 0.5; line(ctx, cx - 16, base - 60, cx - 7, top + 60, '#7a7098'); ctx.globalAlpha = 1;
  for (let i = 0; i < 16; i++) {
    const k = i / 16, yy = lerp(base - 60, top + 60, k);
    ctx.globalAlpha = 0.4; rect(ctx, cx - lerp(20, 9, k), yy, lerp(40, 18, k), 1, '#241f36'); ctx.globalAlpha = 1;
  }
  // the lift, going up because somebody paid
  const ly = lerp(base - 66, top + 64, ((t * 0.12) % 1));
  rect(ctx, cx - 14, ly - 8, 9, 12, '#f2c94c');
  // the pod
  rect(ctx, cx - 40, top + 28, 80, 34, '#5a5170');
  rect(ctx, cx - 40, top + 28, 80, 4, '#8a80a8');
  rect(ctx, cx - 44, top + 42, 88, 8, '#3f3a52');
  for (let i = 0; i < 10; i++) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); rect(ctx, cx - 36 + i * 8, top + 33, 5, 7, '#ffe9a8'); ctx.globalAlpha = 1; }
  // the spinning arm on the roof, with three little screaming dots on it
  const a = t * 1.6;
  rect(ctx, cx - 3, top + 4, 6, 26, '#8a8f98');
  for (let i = 0; i < 3; i++) {
    const aa = a + i * 2.09;
    const ax = cx + Math.cos(aa) * 26, ay = top + 8 + Math.sin(aa) * 7;
    line(ctx, cx, top + 6, ax, ay, '#6a7079');
    rect(ctx, ax - 3, ay - 3, 6, 7, '#e8503a');
  }
  // the spire and the light on the end of it
  rect(ctx, cx - 2, top - 44, 4, 48, '#9aa0aa');
  ctx.globalAlpha = Math.sin(t * 2.4 + 1) > 0.5 ? 1 : 0.18;
  circle(ctx, cx, top - 46, 3, '#ff3a3a'); ctx.globalAlpha = 1;
  vegasUplight(ctx, x, w, base, '#f2c94c', 0.12);
  vegasNeon(ctx, cx, base - 96, 'STRATOSWARM', c.neon, t, { scale: 3 });
}

// MIRAGE: palms, a rock, and a volcano that erupts every forty seconds for
// people who have never seen one and never will.
function vegasMirage(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x, top + 40, w, h - 40, '#3a3a2e');
  ctx.globalAlpha = 0.3; vgrad(ctx, x, top + 40, w, h - 40, '#8a8a60', '#1a1a12'); ctx.globalAlpha = 1;
  glassWall(ctx, x + 12, top + 52, w - 24, h - 104, t, { tint: '#2a3a2a', top: '#a0c890', bot: '#141d14', mullion: 40, rail: 34 });
  // the rock, and the fire out of the top of it
  const erupt = Math.max(0, Math.sin(t * 0.16) - 0.86) / 0.14;
  ctx.fillStyle = '#2a241c'; ctx.beginPath();
  ctx.moveTo(x + 18, base); ctx.lineTo(x + w * 0.3, base - 52); ctx.lineTo(x + w * 0.46, base - 40); ctx.lineTo(x + w * 0.58, base); ctx.fill();
  rect(ctx, x + w * 0.26, base - 54, 28, 3, '#3f382c');
  if (erupt > 0.01) {
    for (let i = 0; i < 18; i++) {
      const k = i / 18, fy = base - 54 - k * 80 * erupt;
      const fw = Math.max(2, 14 * (1 - k)) * erupt;
      ctx.globalAlpha = (1 - k) * erupt;
      rect(ctx, x + w * 0.3 + Math.sin(t * 9 + i) * 8 * k - fw / 2, fy, fw, 6, k < 0.3 ? '#fff2b0' : k < 0.6 ? '#ff8a20' : '#c8402c');
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.2 * erupt; ellipsePx(ctx, x + w * 0.3, base - 60, 70, 50, '#ff8a20'); ctx.globalAlpha = 1;
  }
  vegasPalm(ctx, x + w * 0.74, base, 104, 21, t);
  vegasPalm(ctx, x + w * 0.88, base, 78, 22, t);
  vegasUplight(ctx, x, w, base, '#6be585', 0.1);
  vegasNeon(ctx, cx, top + 8, 'MIRAGE', c.neon, t, { scale: 4 });
}

// A cowboy bug the size of a house, waving at cars. He has waved at every car
// on this street since before the player was hatched.
function vegasCowboy(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x, base - 92, w, 92, '#2f2a3e');
  rect(ctx, x, base - 92, w, 3, '#544c70');
  glassWall(ctx, x + 10, base - 84, w - 20, 54, t, { tint: '#2a2436', mullion: 34, rail: 28 });
  // the sign frame
  rect(ctx, cx - 6, top + 110, 12, base - top - 200, '#3a3346');
  rect(ctx, x + 14, top, w - 28, 120, '#1a1526');
  frame(ctx, x + 14, top, w - 28, 120, '#c8402c');
  vegasBulbFrame(ctx, x + 18, top + 4, w - 36, 112, t, '#ffd24a', 16);
  // the cowboy himself: hat, grin, and one arm on a hinge
  const bx = cx - 20, by = top + 60;
  ellipsePx(ctx, bx, by, 22, 24, '#d8b088');
  rect(ctx, bx - 30, by - 22, 60, 9, '#8a3a2a'); rect(ctx, bx - 16, by - 36, 32, 16, '#8a3a2a');
  rect(ctx, bx - 16, by - 26, 32, 4, '#e8c860');
  rect(ctx, bx - 10, by - 6, 5, 5, '#241d28'); rect(ctx, bx + 5, by - 6, 5, 5, '#241d28');
  for (let i = -3; i <= 3; i++) rect(ctx, bx + i * 4 - 1, by + 8 + Math.abs(i) * 1.4, 4, 3, '#241d28');
  rect(ctx, bx - 20, by + 26, 40, 34, '#2f6a4a'); rect(ctx, bx - 20, by + 26, 40, 3, '#4a8f6a');
  rect(ctx, bx - 22, by + 30, 44, 4, '#f4f1ea');
  const wave = Math.sin(t * 3.2);
  const ax = bx + 30, ay = by + 30;
  const hx = ax + 20 + wave * 6, hy = ay - 26 - Math.abs(wave) * 12;
  line(ctx, ax, ay, hx, hy, '#2f6a4a'); line(ctx, ax, ay + 1, hx, hy + 1, '#2f6a4a');
  ellipsePx(ctx, hx, hy, 7, 7, '#d8b088');
  ctx.globalAlpha = 0.35 + 0.25 * Math.abs(wave);
  ellipsePx(ctx, hx, hy, 14, 14, '#ffd24a'); ctx.globalAlpha = 1;
  vegasNeon(ctx, cx + 46, top + 44, 'HOWDY', c.neon, t, { scale: 3, flicker: true, box: false });
  vegasUplight(ctx, x, w, base, '#e8503a', 0.12);
}

// The marquee. Plastic letters on runners, changed by a man on a ladder at
// four in the morning, saying whatever the lounge could afford this week.
const VEGAS_MARQUEE_LINES = [
  ['SILVER CICADA', 'LOUNGE OPEN ALL NITE', 'NO COVER NO CLASS'],
  ['TONITE ONLY', 'THE HUSK BROTHERS', 'TWO DRINK MINIMUM'],
  ['BREAKFAST 99 CENTS', 'SERVED 24 HOURS', 'YOU LOOK TIRED'],
  ['GOOD LUCK', 'TO SOMEBODY', 'ELSE'],
  ['NOW HIRING', 'MUST HAVE OWN SHOES', 'SEE MANAGER'],
];
function vegasMarquee(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x, base - 104, w, 104, '#2a2434');
  rect(ctx, x, base - 104, w, 3, '#514868');
  glassWall(ctx, x + 12, base - 96, w - 24, 58, t, { tint: '#241f36', mullion: 36, rail: 30 });
  // the board
  const by = top, bh = 118;
  rect(ctx, x + 8, by, w - 16, bh, '#120f1c');
  rect(ctx, x + 12, by + 4, w - 24, bh - 8, '#f0ead8');
  vegasBulbFrame(ctx, x + 8, by, w - 16, bh, t, '#ffd24a', 15);
  const lines = VEGAS_MARQUEE_LINES[Math.floor(t / 6.5) % VEGAS_MARQUEE_LINES.length];
  // the letters, black on a lit board, slightly wonky because they are plastic
  for (let i = 0; i < lines.length; i++) {
    const sc = i === 0 ? 3 : 2;
    const yy = by + 16 + i * 32;
    drawText(ctx, lines[i], cx, yy + (i === 1 ? 2 : 0), '#241d28', { align: 'center', scale: sc });
    ctx.globalAlpha = 0.12; rect(ctx, x + 14, yy + (sc === 3 ? 22 : 16), w - 28, 1, '#8a8478'); ctx.globalAlpha = 1;
  }
  // the arrow underneath that points at the door, in case you missed a casino
  const ay = base - 118;
  rect(ctx, cx - 60, ay, 120, 22, '#1a1526');
  frame(ctx, cx - 60, ay, 120, 22, '#c8a03a');
  const ch = Math.floor(t * 8) % 6;
  for (let i = 0; i < 6; i++) {
    const on = i === ch || i === (ch + 3) % 6;
    ctx.fillStyle = on ? '#ffd24a' : '#4a3a14';
    ctx.beginPath();
    const ax2 = cx - 48 + i * 18;
    ctx.moveTo(ax2 + 8, ay + 11); ctx.lineTo(ax2 - 4, ay + 4); ctx.lineTo(ax2 - 4, ay + 18); ctx.fill();
  }
  vegasUplight(ctx, x, w, base, '#ffd24a', 0.16);
}

// A wedding chapel wedged between a pawn shop and a casino, open all night,
// which tells you everything about the order people do things in here.
function vegasChapel(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x + 10, top + 46, w - 20, h - 46, '#e8e2d2');
  rect(ctx, x + 10, top + 46, w - 20, 4, '#fbf6ea');
  ctx.globalAlpha = 0.18; vgrad(ctx, x + 10, top + 46, w - 20, h - 46, '#ffffff', '#5a5448'); ctx.globalAlpha = 1;
  ctx.fillStyle = '#d8d0be'; ctx.beginPath();
  ctx.moveTo(cx, top + 4); ctx.lineTo(x + 4, top + 50); ctx.lineTo(x + w - 4, top + 50); ctx.fill();
  // the steeple and the bell in it
  rect(ctx, cx - 14, top - 44, 28, 48, '#e8e2d2');
  ctx.fillStyle = '#c8bfa8'; ctx.beginPath();
  ctx.moveTo(cx, top - 76); ctx.lineTo(cx - 16, top - 42); ctx.lineTo(cx + 16, top - 42); ctx.fill();
  const sw = Math.sin(t * 2.6) * 3;
  ellipsePx(ctx, cx + sw, top - 26, 7, 8, '#c8a03a'); rect(ctx, cx + sw - 7, top - 20, 14, 3, '#8a6a20');
  rect(ctx, cx - 2, top - 42, 4, 12, '#8a8070');
  // arched windows, warm inside, somebody getting married right now
  for (const d of [-1, 1]) {
    const wx = cx + d * w * 0.24;
    rect(ctx, wx - 10, top + 62, 20, 34, '#3a2a44');
    ellipsePx(ctx, wx, top + 62, 10, 9, '#3a2a44');
    ctx.globalAlpha = 0.7 + 0.2 * Math.sin(t * 1.4 + d); rect(ctx, wx - 7, top + 62, 14, 30, '#ffd8a0'); ctx.globalAlpha = 1;
  }
  rect(ctx, cx - 18, base - 56, 36, 56, '#8a5a3a');
  rect(ctx, cx - 18, base - 56, 36, 3, '#a87a50');
  rect(ctx, cx - 1, base - 52, 2, 48, '#5a3a24');
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
  ellipsePx(ctx, cx, base - 66, 26, 10, '#ffd8a0'); ctx.globalAlpha = 1;
  // the neon heart, half of which has been out for years
  const hx = cx, hy = top + 18;
  ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2.2);
  for (const d of [-1, 1]) ellipsePx(ctx, hx + d * 9, hy, 10, 9, d < 0 || Math.sin(t * 31) > -0.9 ? '#ff5a9a' : '#4a1a2a');
  ctx.fillStyle = '#ff5a9a'; ctx.beginPath();
  ctx.moveTo(hx - 19, hy + 2); ctx.lineTo(hx + 19, hy + 2); ctx.lineTo(hx, hy + 24); ctx.fill();
  ctx.globalAlpha = 1;
  vegasNeon(ctx, cx, base - 96, 'WED NOW', c.neon, t, { scale: 3, flicker: true });
  drawText(ctx, 'CHAPEL OF THE LITTLE WINGS', cx, base - 14, withAlpha('#ff8ad8', 0.85), { align: 'center', font: 'small' });
  vegasUplight(ctx, x, w, base, '#ff8ad8', 0.14);
}

// SIX LEGS PAWN. Bars on the window, three gold balls, and a sign that the
// player is going to read twice before he walks past it.
function vegasPawn(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x, top, w, h, '#2a3a2e');
  rect(ctx, x, top, w, 4, '#4a6a52');
  rect(ctx, x + 6, top + 34, w - 12, h - 76, '#101a14');
  ctx.globalAlpha = 0.35; rect(ctx, x + 6, top + 34, w - 12, h - 76, '#6be585'); ctx.globalAlpha = 1;
  // what is in the window: a trumpet, a watch, a ring, and a guitar
  const wy = top + 48;
  rect(ctx, x + 16, wy + 26, w - 32, 3, '#4a5a4a');
  rect(ctx, x + 22, wy + 8, 6, 18, '#c8a03a'); ellipsePx(ctx, x + 25, wy + 6, 8, 5, '#c8a03a');
  ringPx(ctx, x + 50, wy + 16, 8, '#e0d8c0'); rect(ctx, x + 48, wy + 4, 5, 6, '#8a8478');
  ellipsePx(ctx, x + w - 52, wy + 18, 11, 9, '#8a4a2a'); rect(ctx, x + w - 44, wy + 2, 3, 18, '#5a3a24');
  ringPx(ctx, x + w - 24, wy + 14, 5, '#ffd24a');
  for (let i = 0; i < 9; i++) rect(ctx, x + 10 + i * ((w - 20) / 8), top + 34, 3, h - 76, '#3a4a3a');
  // the three balls
  for (let i = 0; i < 3; i++) {
    const bx = cx - 26 + i * 26, by = top - 12 - (i === 1 ? 8 : 0);
    circle(ctx, bx, by, 9, '#8a6a20'); circle(ctx, bx, by, 7, '#e0b23c');
    ctx.globalAlpha = 0.4; circle(ctx, bx - 2, by - 3, 3, '#fff0b0'); ctx.globalAlpha = 1;
  }
  rect(ctx, x + 14, base - 40, w - 28, 40, '#1a2418');
  vegasNeon(ctx, cx, base - 34, 'WE BUY GUITARS', c.neon, t, { scale: 2, flicker: true, box: false });
  vegasNeon(ctx, cx, top + 8, 'SIX LEGS PAWN', c.neon, t, { scale: 2 });
  vegasUplight(ctx, x, w, base, '#6be585', 0.1);
}

// FLAMINGBUG. The oldest sign on the street. Pink, enormous, and running a
// chase pattern that was state of the art when it went up.
function vegasFlamingo(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x, base - 86, w, 86, '#2e2438');
  rect(ctx, x, base - 86, w, 3, '#564268');
  glassWall(ctx, x + 10, base - 78, w - 20, 48, t, { tint: '#2f2440', top: '#c890c0', bot: '#1a1226', mullion: 34, rail: 28 });
  rect(ctx, x + 10, top + 8, w - 20, base - top - 96, '#1a1226');
  frame(ctx, x + 10, top + 8, w - 20, base - top - 96, '#8a3a6a');
  // the bird: a body, a neck that bends, one leg, and a chase along the neck
  const bxc = cx - 6, byc = top + 74;
  ellipsePx(ctx, bxc, byc, 26, 17, '#ff5a9a');
  ctx.globalAlpha = 0.4; ellipsePx(ctx, bxc - 6, byc - 5, 14, 7, '#ffb0d0'); ctx.globalAlpha = 1;
  const neck = [[bxc + 14, byc - 8], [bxc + 26, byc - 26], [bxc + 22, byc - 42], [bxc + 8, byc - 48]];
  for (let i = 0; i < neck.length; i++) {
    const on = (Math.floor(t * 6) + i) % 4 !== 0;
    ctx.globalAlpha = on ? 1 : 0.3;
    circle(ctx, neck[i][0], neck[i][1], 6, '#ff5a9a');
    if (i) line(ctx, neck[i - 1][0], neck[i - 1][1], neck[i][0], neck[i][1], '#ff5a9a');
    ctx.globalAlpha = 1;
  }
  ellipsePx(ctx, bxc + 2, byc - 52, 8, 6, '#ff5a9a');
  rect(ctx, bxc - 8, byc - 54, 10, 3, '#241d28');
  rect(ctx, bxc + 2, byc - 55, 3, 3, '#241d28');
  line(ctx, bxc - 4, byc + 16, bxc - 4, byc + 40, '#ff8ad8');
  rect(ctx, bxc - 9, byc + 40, 12, 3, '#ff8ad8');
  // feathers out the back, chasing
  for (let i = 0; i < 5; i++) {
    ctx.globalAlpha = 0.4 + 0.6 * (Math.floor(t * 7 + i) % 3 === 0 ? 1 : 0.3);
    line(ctx, bxc - 22, byc + 2, bxc - 44 - i * 4, byc - 14 + i * 7, '#ff8ad8');
    ctx.globalAlpha = 1;
  }
  vegasNeon(ctx, cx, base - 116, 'FLAMINGBUG', c.neon, t, { scale: 3 });
  vegasUplight(ctx, x, w, base, '#ff8ad8', 0.15);
}

// MOTH BUFFET. Open 24 hours, eight ninety-nine, and the only sign on the
// street that has ever told the truth about anything.
function vegasBuffet(ctx, c, base, t) {
  const x = c.x, w = c.w, h = c.h, cx = x + w / 2, top = base - h;
  rect(ctx, x, top + 44, w, h - 44, '#3a2e2a');
  rect(ctx, x, top + 44, w, 4, '#6a5448');
  rect(ctx, x + 8, top + 62, w - 16, h - 112, '#1a1210');
  ctx.globalAlpha = 0.45; rect(ctx, x + 8, top + 62, w - 16, h - 112, '#f2a03a'); ctx.globalAlpha = 1;
  // the steam trays, seen through the glass, glowing under their lamps
  for (let i = 0; i < 5; i++) {
    const tx = x + 18 + i * ((w - 36) / 5);
    rect(ctx, tx, top + 96, (w - 36) / 5 - 6, 8, '#b9bec6');
    rect(ctx, tx, top + 96, (w - 36) / 5 - 6, 2, '#e0e6ec');
    ctx.globalAlpha = 0.5; rect(ctx, tx + 2, top + 92, (w - 36) / 5 - 10, 4, ['#c8402c', '#6be585', '#f2c94c', '#a87a50', '#f4f1ea'][i]); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 2 + i); ellipsePx(ctx, tx + 10, top + 84, 16, 12, '#ffffff'); ctx.globalAlpha = 1;
    rect(ctx, tx + 4, top + 70, 3, 6, '#5a4a3a');
    ctx.globalAlpha = 0.6; ellipsePx(ctx, tx + 10, top + 74, 12, 3, '#ffd8a0'); ctx.globalAlpha = 1;
  }
  // the awning
  for (let i = 0; i < 8; i++) rect(ctx, x + i * (w / 8), top + 40, w / 16, 14, i % 2 ? '#c8402c' : '#f0ead8');
  rect(ctx, x, top + 54, w, 4, '#8a6448');
  // the signs
  rect(ctx, x + 6, top, w - 12, 38, '#120f1c');
  frame(ctx, x + 6, top, w - 12, 38, VEGAS_PAL.goldLo);
  vegasNeon(ctx, cx, top + 8, 'MOTH BUFFET', c.neon, t, { scale: 3, box: false });
  const b24 = x + w - 44;
  rect(ctx, b24 - 4, top - 58, 48, 56, '#120f1c');
  frame(ctx, b24 - 4, top - 58, 48, 56, '#c8402c');
  ctx.globalAlpha = Math.sin(t * 3.4) > -0.5 ? 1 : 0.25;
  drawText(ctx, '24', b24 + 20, top - 50, '#e8503a', { align: 'center', scale: 4 });
  drawText(ctx, 'HOUR', b24 + 20, top - 18, '#ffd24a', { align: 'center', scale: 2 });
  ctx.globalAlpha = 1;
  drawText(ctx, 'ALL U CAN EAT 8.99', cx, base - 18, withAlpha('#f2c94c', 0.9), { align: 'center', scale: 2, outline: '#2a1a08' });
  vegasUplight(ctx, x, w, base, '#f2a03a', 0.16);
}

function drawVegasCasino(ctx, c, base, t, S) {
  switch (c.kind) {
    case 'pyramid': vegasPyramid(ctx, c, base, t); break;
    case 'fountain': vegasFountainHouse(ctx, c, base, t); break;
    case 'palace': vegasPalace(ctx, c, base, t); break;
    case 'tower': vegasTower(ctx, c, base, t); break;
    case 'mirage': vegasMirage(ctx, c, base, t); break;
    case 'cowboy': vegasCowboy(ctx, c, base, t); break;
    case 'marquee': vegasMarquee(ctx, c, base, t); break;
    case 'chapel': vegasChapel(ctx, c, base, t); break;
    case 'pawn': vegasPawn(ctx, c, base, t); break;
    case 'flamingo': vegasFlamingo(ctx, c, base, t); break;
    default: vegasBuffet(ctx, c, base, t); break;
  }
}

// ---------- the end of the street ----------
// A concrete canopy, a sodium light, a timetable nobody has updated, and a
// door. Everything before this is scenery. This is the only thing that moves
// the story.
function vegasShuttleBay(ctx, x, base, t) {
  const w = 190, top = base - 150;
  rect(ctx, x, top + 30, w, 150 - 30, '#2a2a34');
  rect(ctx, x, top + 30, w, 4, '#4f4f60');
  rect(ctx, x - 14, top, w + 28, 32, '#3a3a46');
  rect(ctx, x - 14, top, w + 28, 4, '#666678');
  rect(ctx, x - 14, top + 30, w + 28, 4, '#1b1b24');
  for (let i = 0; i < 3; i++) {
    const lx = x + 34 + i * 60;
    rect(ctx, lx - 10, top + 34, 20, 5, '#1b1b24');
    ctx.globalAlpha = 0.85; rect(ctx, lx - 8, top + 36, 16, 3, '#ffe9a8'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.12; ellipsePx(ctx, lx, base - 4, 40, 34, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  // the door, lit from inside, waiting
  rect(ctx, x + w / 2 - 34, base - 92, 68, 92, '#12101c');
  rect(ctx, x + w / 2 - 30, base - 88, 60, 88, '#1f2c3e');
  ctx.globalAlpha = 0.35 + 0.08 * Math.sin(t * 1.6);
  rect(ctx, x + w / 2 - 28, base - 86, 56, 84, '#8fc0e4'); ctx.globalAlpha = 1;
  rect(ctx, x + w / 2 - 1, base - 88, 2, 88, '#0d1018');
  rect(ctx, x + w / 2 - 34, base - 92, 68, 4, '#5a5a6a');
  // the board over it
  rect(ctx, x + 12, top + 44, w - 24, 34, '#0d1018');
  frame(ctx, x + 12, top + 44, w - 24, 34, DF.goldLo);
  dfStamp(ctx, x + 18, top + 50, 22, null);
  drawText(ctx, 'AIRPORT SHUTTLE', x + 46, top + 50, DF.gold, { scale: 2 });
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 4);
  drawText(ctx, '21:00  ON TIME', x + 46, top + 64, '#6be585', { font: 'small' });
  ctx.globalAlpha = 1;
  // a bent timetable on a pole nobody reads
  rect(ctx, x + w - 26, base - 60, 3, 60, '#6a6a78');
  rect(ctx, x + w - 40, base - 84, 30, 26, '#e8e2d2');
  frame(ctx, x + w - 40, base - 84, 30, 26, '#8a8478');
  for (let i = 0; i < 5; i++) rect(ctx, x + w - 36, base - 79 + i * 5, 22 - (i % 3) * 5, 2, '#8a8478');
}

// The monorail, which runs above the whole street and which almost nobody
// uses because it goes from one place you are not to another.
function vegasMonorail(ctx, S, t) {
  const y = 118, w = VEGAS_W;
  for (let x = 60; x < w; x += 420) {
    if (!S.cam.visible(x, 220)) continue;
    rect(ctx, x - 9, y + 22, 18, VEGAS_F0 - y - 32, '#221d33');
    rect(ctx, x - 9, y + 22, 4, VEGAS_F0 - y - 32, '#3a3350');
    rect(ctx, x - 16, VEGAS_F0 - 12, 32, 12, '#2a2440');
    rect(ctx, x - 22, y + 14, 44, 12, '#2f2846');
  }
  rect(ctx, 0, y, w, 22, '#2a2440');
  rect(ctx, 0, y, w, 4, '#4a4066');
  rect(ctx, 0, y + 19, w, 3, '#141026');
  ctx.globalAlpha = 0.3;
  for (let x = 0; x < w; x += 40) rect(ctx, x, y + 8, 22, 2, '#5f548a');
  ctx.globalAlpha = 1;
  // a train, every so often, going the other way
  const period = 26;
  const k = (t % period) / period;
  if (k < 0.62) {
    const tx = lerp(-420, w + 200, k / 0.62);
    if (S.cam.visible(tx + 180, 420)) {
      for (let i = 0; i < 4; i++) {
        const cxx = tx + i * 96;
        rect(ctx, cxx, y - 34, 92, 36, '#cfd6de');
        rect(ctx, cxx, y - 34, 92, 4, '#f0f4f8');
        rect(ctx, cxx, y - 8, 92, 6, '#2f4a8a');
        rect(ctx, cxx + 6, y - 28, 80, 15, '#1b2436');
        ctx.globalAlpha = 0.45; rect(ctx, cxx + 6, y - 28, 80, 6, '#8fc0e4'); ctx.globalAlpha = 1;
        for (let s = 0; s < 5; s++) rect(ctx, cxx + 12 + s * 16, y - 24, 5, 8, '#3a3550');
      }
      ctx.globalAlpha = 0.5; rect(ctx, tx + 380, y - 24, 6, 6, '#fff2c0'); ctx.globalAlpha = 1;
    }
  }
}

// ---------- the street's own props ----------
// The Dragon Fly billboard. A navy board on two legs with a gold dragonfly
// and a price on it that is exactly what the player has, minus everything.
function vegasBillboard(ctx, p, base, t) {
  const w = p.w, h = p.h, x = p.x - w / 2, top = base - h;
  rect(ctx, x + 12, top + h - 8, 8, 8, '#2a2434');
  rect(ctx, x + w - 20, top + h - 8, 8, 8, '#2a2434');
  rect(ctx, x - 4, top - 4, w + 8, h - 4, '#0d1018');
  rect(ctx, x, top, w, h - 12, DF.navy);
  rect(ctx, x, top, w, 3, DF.navyHi);
  ctx.globalAlpha = 0.16; vgrad(ctx, x, top, w, h - 12, '#ffffff', '#000000'); ctx.globalAlpha = 1;
  dfStamp(ctx, x + 10, top + 12, 30, null);
  dfWordmark(ctx, x + 10, top + 52, 2, { tag: true });
  drawText(ctx, 'LAS VEGAS - TOKYO', x + 10, top + 76, DF.cream, { scale: 2 });
  drawText(ctx, 'NONSTOP. NIGHTLY.', x + 10, top + 92, withAlpha(DF.sky, 0.85), { font: 'small' });
  drawText(ctx, 'ONE WAY', x + w - 12, top + 62, withAlpha(DF.cream, 0.6), { align: 'right', font: 'small' });
  drawText(ctx, '$611', x + w - 12, top + 72, DF.gold, { align: 'right', scale: 3 });
  // the strip lights along the top, and what they throw on the board
  for (let i = 0; i < 4; i++) {
    const lx = x + 22 + i * ((w - 44) / 3);
    rect(ctx, lx - 8, top - 12, 16, 5, '#3a3a46');
    rect(ctx, lx - 3, top - 8, 6, 5, '#6a6a78');
    ctx.globalAlpha = 0.12; ellipsePx(ctx, lx, top + 22, 34, 30, '#ffe9a8'); ctx.globalAlpha = 1;
  }
}
// A bus stop, which in Vegas means a bench, a roof, and an advert for a show
// that closed.
function vegasBusStop(ctx, p, base, t) {
  const w = p.w, h = p.h, x = p.x - w / 2, top = base - h;
  rect(ctx, x, top, w, 8, '#3a4250'); rect(ctx, x, top, w, 3, '#5f6a7c');
  rect(ctx, x + 4, top + 8, 5, h - 8, '#3a4250');
  rect(ctx, x + w - 9, top + 8, 5, h - 8, '#3a4250');
  glassWall(ctx, x + 10, top + 12, w - 22, h - 34, t, { tint: '#26364a', mullion: 40, rail: 50 });
  rect(ctx, x + 12, base - 26, w - 26, 5, '#2f4a68');
  rect(ctx, x + 12, base - 26, w - 26, 2, '#4a6f96');
  rect(ctx, x + 16, base - 21, 4, 21, '#3a3f4a');
  rect(ctx, x + w - 24, base - 21, 4, 21, '#3a3f4a');
  // the lit poster in the end panel
  rect(ctx, x + w - 8, top + 12, 6, h - 24, '#12101c');
  ctx.globalAlpha = 0.5 + 0.1 * Math.sin(t * 2); rect(ctx, x + w - 7, top + 14, 4, h - 28, '#ff8ad8'); ctx.globalAlpha = 1;
}
// A slot machine bolted to the pavement outside the buffet, because there is
// no surface in this town that is not one.
function vegasSlotProp(ctx, p, base, t) {
  const w = p.w, h = p.h, x = p.x - w / 2, top = base - h;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base + 1, w * 0.55, 5, '#000000'); ctx.globalAlpha = 1;
  rect(ctx, x, top, w, h, '#8a2a2a');
  rect(ctx, x, top, w, 4, '#c04a4a');
  frame(ctx, x, top, w, h, '#3a1010');
  rect(ctx, x + 4, top + 8, w - 8, 22, '#120f1c');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3);
  drawText(ctx, 'LUCKY', p.x, top + 14, '#ffd24a', { align: 'center', scale: 2 });
  ctx.globalAlpha = 1;
  rect(ctx, x + 5, top + 34, w - 10, 22, '#f0ead8');
  for (let i = 0; i < 3; i++) {
    const rx = x + 10 + i * ((w - 20) / 3) + (w - 20) / 6;
    vegasSlotSymbol(ctx, rx, top + 45, 9, (Math.floor(t * (3 + i)) + i) % 5, t);
    rect(ctx, rx - (w - 20) / 6, top + 34, 1, 22, '#b9b2a0');
  }
  rect(ctx, x + 6, top + 62, w - 12, 12, '#3a1010');
  for (let i = 0; i < 3; i++) rect(ctx, x + 10 + i * 12, top + 65, 8, 6, ['#6be585', '#ffd24a', '#8ad8ff'][i]);
  rect(ctx, x + w - 2, top + 18, 4, 26, '#8a8f98');
  circle(ctx, x + w + 1, top + 16, 5, '#c8402c');
  rect(ctx, x + 6, base - 14, w - 12, 8, '#241d28');
}
// The walk of fame, which is a star in the pavement with somebody's name on
// it that even the people who cleaned it have never heard of.
function vegasStar(ctx, p, base, t) {
  const r = p.w / 2;
  rect(ctx, p.x - r, base - 1, r * 2, 3, '#8a7a5e');
  ctx.fillStyle = '#c8a03a'; ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? r * 0.42 : r) * 1;
    ctx[i ? 'lineTo' : 'moveTo'](p.x + Math.cos(a) * rr, base + 4 + Math.sin(a) * rr * 0.34);
  }
  ctx.fill();
  ctx.globalAlpha = 0.4; ellipsePx(ctx, p.x, base + 4, r * 0.5, r * 0.18, '#ffd24a'); ctx.globalAlpha = 1;
  drawText(ctx, 'B. BUSKER', p.x, base + 1, '#2a1a08', { align: 'center', font: 'small' });
}
// A showgirl's headdress: three feet of feather that costs more than a month
// of rent and weighs about as much as she does.
function vegasFeathers(ctx, x, y, t, seed, col) {
  const sw = Math.sin(t * 1.6 + seed) * 4;
  for (let i = -4; i <= 4; i++) {
    const a = -Math.PI / 2 + i * 0.16;
    const L = 34 - Math.abs(i) * 3.4;
    const ex = x + Math.cos(a) * L + sw * (i / 4), ey = y + Math.sin(a) * L;
    line(ctx, x, y, ex, ey, darken(col, 0.2));
    for (let f = 3; f < 8; f++) {
      const k = f / 8;
      rect(ctx, lerp(x, ex, k) - 2, lerp(y, ey, k) - 1, 4, 3, f % 2 ? col : lighten(col, 0.25));
    }
    ctx.globalAlpha = 0.6; rect(ctx, ex - 2, ey - 2, 4, 4, lighten(col, 0.4)); ctx.globalAlpha = 1;
  }
  rect(ctx, x - 9, y - 2, 18, 6, '#c8a03a');
  rect(ctx, x - 9, y - 2, 18, 2, '#ffd24a');
}
// A souvenir cup the size of a tourist, with a curly straw and about a pint
// of melted ice left in the bottom.
function vegasBigCup(ctx, x, y, face, s, t) {
  const cx = x + face * 15 * s, by = y - 2, hgt = 42 * s, wdt = 19 * s;
  ctx.fillStyle = '#eae4da'; ctx.beginPath();
  ctx.moveTo(cx - wdt / 2, by - hgt); ctx.lineTo(cx + wdt / 2, by - hgt);
  ctx.lineTo(cx + wdt * 0.34, by); ctx.lineTo(cx - wdt * 0.34, by); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#3aa0d8'; ctx.beginPath();
  ctx.moveTo(cx - wdt * 0.44, by - hgt * 0.62); ctx.lineTo(cx + wdt * 0.44, by - hgt * 0.62);
  ctx.lineTo(cx + wdt * 0.34, by - 2); ctx.lineTo(cx - wdt * 0.34, by - 2); ctx.fill();
  ctx.globalAlpha = 1;
  rect(ctx, cx - wdt / 2 - 2, by - hgt - 3, wdt + 4, 5, '#c8402c');
  rect(ctx, cx - wdt * 0.42, by - hgt * 0.34, wdt * 0.84, 3, '#c8402c');
  drawText(ctx, 'XL', cx, by - hgt * 0.26, '#c8402c', { align: 'center', font: 'small' });
  // the straw, curling, because of course it curls
  const sx = cx + wdt * 0.2;
  rect(ctx, sx, by - hgt - 20, 3, 20, '#ff5a9a');
  for (let i = 0; i < 6; i++) {
    const a = i * 0.9 + Math.sin(t) * 0.1;
    rect(ctx, sx + Math.cos(a) * 7, by - hgt - 26 - i * 2, 3, 3, '#ff5a9a');
  }
}

// A stable bug with a few things changed about it. Built off randomBugSpec so
// every field the sprite code wants is definitely there.
function vegasSpec(seed, name, over) {
  const s = randomBugSpec(makeRng(hashStr('vegas|' + seed)));
  s.name = name;
  if (over) {
    for (const k in over) {
      if (k === 'colors' || k === 'outfit') Object.assign(s[k], over[k]);
      else s[k] = over[k];
    }
  }
  return s;
}

// ---------- everything you can stand in front of ----------
function vegasProps() {
  return [
    // --- the plaza, up at the back
    { kind: 'vbillboard', x: 300, w: 220, h: 126, floor: 0, label: 'READ THE BILLBOARD', act: 'billboard', reach: 50 },
    { kind: 'plant', x: 470, w: 34, h: 40, floor: 0 },
    { kind: 'plant', x: 880, w: 34, h: 40, floor: 0 },
    { kind: 'barrier', x: 650, w: 200, h: 34, floor: 0 },
    { kind: 'door', x: 1105, w: 54, h: 74, floor: 0, col: '#8a6a20', glow: '#ffd8a0', text: 'CASINO', label: 'TRY THE DOOR', act: 'door', doorMsg: 'casino' },
    { kind: 'bin', x: 1180, w: 24, h: 34, floor: 0 },
    { kind: 'door', x: 2230, w: 52, h: 72, floor: 0, col: '#6a2a4a', glow: '#ffd24a', text: 'LOUNGE', label: 'TRY THE DOOR', act: 'door', doorMsg: 'lounge' },
    { kind: 'door', x: 2497, w: 44, h: 64, floor: 0, col: '#8a5a3a', glow: '#ff9ad0', text: 'CHAPEL', label: 'PEEK IN', act: 'door', doorMsg: 'chapel' },
    { kind: 'door', x: 2706, w: 44, h: 64, floor: 0, col: '#2a4a32', glow: '#6be585', text: 'PAWN', label: 'PEEK IN', act: 'door', doorMsg: 'pawn' },
    { kind: 'vslot', x: 3010, w: 42, h: 78, floor: 0, label: 'PULL THE ARM', act: 'slot' },
    { kind: 'door', x: 3175, w: 50, h: 70, floor: 0, col: '#6a4430', glow: '#f2c94c', text: 'BUFFET', label: 'SMELL IT', act: 'door', doorMsg: 'buffet' },
    // --- the sidewalk, down at the front, where you actually are
    { kind: 'vpalm', x: 215, w: 30, h: 152, floor: 1, seed: 3 },
    { kind: 'vpalm', x: 700, w: 30, h: 138, floor: 1, seed: 7 },
    { kind: 'bench', x: 1055, w: 84, h: 32, floor: 1 },
    { kind: 'bin', x: 1125, w: 24, h: 34, floor: 1 },
    { kind: 'vbusstop', x: 1240, w: 156, h: 100, floor: 1, label: 'READ THE TIMETABLE', act: 'busstop', reach: 46 },
    { kind: 'vpalm', x: 1345, w: 30, h: 160, floor: 1, seed: 11 },
    { kind: 'vstar', x: 1500, w: 48, h: 8, floor: 1, label: 'READ THE STAR', act: 'star', reach: 38 },
    { kind: 'poster', x: 1900, w: 42, h: 62, floor: 1, col: '#ff5a9a' },
    { kind: 'vending', x: 2020, w: 48, h: 72, floor: 1, label: 'BUY A WATER', act: 'vending' },
    { kind: 'vpalm', x: 2130, w: 30, h: 146, floor: 1, seed: 17 },
    { kind: 'bench', x: 2320, w: 84, h: 32, floor: 1 },
    { kind: 'atm', x: 2560, w: 42, h: 62, floor: 1, label: 'CHECK YOUR BALANCE', act: 'atm' },
    { kind: 'payphone', x: 2770, w: 26, h: 54, floor: 1 },
    { kind: 'vpalm', x: 2960, w: 30, h: 150, floor: 1, seed: 23 },
    { kind: 'cone', x: 3120, w: 22, h: 26, floor: 1 },
    { kind: 'vshuttle', x: VEGAS_SHUTTLE_X, w: 74, h: 94, floor: 1, label: 'CATCH THE SHUTTLE', act: 'shuttle', reach: 46 },
  ];
}
function vegasNpcs() {
  return [
    { name: 'A LOST BUG', x: 620, floor: 1, voice: 'clerk', walk: [580, 700], speed: 22, carry: 'phone',
      spec: vegasSpec('lost', 'A LOST BUG'),
      tag: ['IS THIS STILL THE STRIP?', 'I HAVE BEEN WALKING FOR AN HOUR.', 'THE NEXT HOTEL IS ALWAYS RIGHT THERE.'] },
    { name: 'DOORMAN', x: 1000, floor: 0, voice: 'guard', pose: 'idle', scale: 1.5,
      spec: vegasSpec('doorman', 'DOORMAN', { eyes: 'shades', outfit: { jacket: '#8a1a22', jacketTrim: '#ffd24a', hat: 'cap', hatColor: '#8a1a22' } }),
      tag: ['CASE STAYS OUTSIDE, BUDDY.', 'YOU PLAY, YOU PLAY ON THE STREET.', 'NOTHING PERSONAL. I LIKE THE SONGS.'] },
    { name: 'A TOURIST', x: 980, floor: 1, voice: 'kid', walk: [900, 1120], speed: 19, vcup: '#3aa0d8',
      spec: vegasSpec('tourist1', 'A TOURIST'),
      tag: ['IT IS THIRTY SIX OUNCES.', 'I HAVE HAD TWO.'] },
    { name: 'THE KING', x: 1430, floor: 1, voice: 'oldman', pose: 'play', scale: 1.6, act: 'elvis',
      spec: vegasSpec('king', 'THE KING', { eyes: 'shades', body: 'bulk', outfit: { jacket: '#f4f1ea', jacketTrim: '#ffd24a', shirt: '#f4f1ea' }, colors: { trim: '#ffd24a' } }) },
    { name: 'FLYER BUG', x: 1720, floor: 1, voice: 'clerk', walk: [1660, 1800], speed: 26, act: 'flyer',
      spec: vegasSpec('flyer', 'FLYER BUG') },
    { name: 'A TOURIST', x: 1960, floor: 1, voice: 'guard', walk: [1880, 2060], speed: 16, vcup: '#e8503a',
      spec: vegasSpec('tourist2', 'A TOURIST'),
      tag: ['WE ARE HERE FOR A CONFERENCE.', 'THE CONFERENCE WAS TUESDAY.'] },
    { name: 'SHOWGIRL', x: 2155, floor: 0, voice: 'hostess', pose: 'cheer', scale: 1.5, vfeather: '#ff8ad8',
      spec: vegasSpec('girl1', 'SHOWGIRL', { outfit: { vest: '#ffd24a', vestTrim: '#ff5a9a' } }),
      tag: ['SIX SHOWS A WEEK. TEN POUNDS OF FEATHER.', 'YOU GET USED TO THE NECK.', 'GOOD LUCK OUT THERE. MEAN IT.'] },
    { name: 'SHOWGIRL', x: 2215, floor: 0, voice: 'hostess', pose: 'cheer', scale: 1.5, vfeather: '#8ad8ff',
      spec: vegasSpec('girl2', 'SHOWGIRL', { outfit: { vest: '#8ad8ff', vestTrim: '#f4f1ea' } }),
      tag: ['HE PLAYS THE SAME FOUR SONGS.', 'THEY ARE GOOD SONGS.'] },
    { name: 'A BRIDE', x: 2450, floor: 0, voice: 'clerk', pose: 'cheer', scale: 1.45,
      spec: vegasSpec('bride', 'A BRIDE', { outfit: { blouse: '#f8f4ea', vest: '#f8f4ea' } }),
      tag: ['WE MET ON THE SHUTTLE.', 'FORTY MINUTES AGO.', 'BEST DECISION I HAVE MADE ALL YEAR.'] },
    { name: 'A GROOM', x: 2492, floor: 0, voice: 'driver', scale: 1.45,
      spec: vegasSpec('groom', 'A GROOM', { outfit: { jacket: '#2a2a3a', shirt: '#f4f1ea' } }),
      tag: ['I AGREE WITH EVERYTHING SHE SAID.'] },
    { name: 'LIMO DRIVER', x: 2880, floor: 1, voice: 'driver', scale: 1.5, carry: 'coffee',
      spec: vegasSpec('limo', 'LIMO DRIVER', { eyes: 'sleepy', outfit: { jacket: '#1b1b28', shirt: '#f4f1ea', hat: 'cap', hatColor: '#1b1b28' } }),
      tag: ['AIRPORT RUN IS NINETY.', 'SHUTTLE IS FOUR.', 'TAKE THE SHUTTLE, KID.'] },
    { name: 'A GUARD', x: 3230, floor: 1, voice: 'guard', scale: 1.5,
      spec: vegasSpec('guard', 'A GUARD', { eyes: 'shades', outfit: { jacket: '#242430', shirt: '#8ad8ff' } }),
      tag: ['SHUTTLE BAY IS RIGHT THERE.', 'DO NOT MISS IT. THEY DO NOT WAIT.'] },
  ];
}

// ---------- the scene ----------
function vegasDef() {
  return {
    name: 'LAS VEGAS - THE STRIP',
    sub: 'NINE AT NIGHT. WALK RIGHT.',
    tint: '#6a1a4a',
    w: VEGAS_W, zoom: 1, yBias: 0.70,
    hud: false, canLeave: false,
    heroScale: 1.6, carry: 'case',
    start: { x: 120, floor: 1 },
    floors: [{ y: VEGAS_F0, z: 0.86 }, { y: VEGAS_F1, z: 1 }],
    props: vegasProps(),
    npcs: vegasNpcs(),

    // ---- the sky over the desert, which is orange at the bottom all night
    sky: function (ctx, S, t) {
      vgrad(ctx, 0, 0, W, H, VEGAS_PAL.night, VEGAS_PAL.night2);
      const r = makeRng(5150);
      for (let i = 0; i < 130; i++) {
        const sx = r.int(0, W), sy = r.int(0, 220);
        if (Math.sin(t * 1.6 + i) > 0.1) px(ctx, sx, sy, i % 4 ? '#8a86b0' : '#ffffff');
      }
      ctx.globalAlpha = 0.5; vgrad(ctx, 0, 150, W, 200, 'rgba(0,0,0,0)', VEGAS_PAL.haze); ctx.globalAlpha = 1;
      // the moon, which nobody in this town has looked at since 1961
      const sky68 = mixColor(VEGAS_PAL.night, VEGAS_PAL.night2, 68 / H);
      circle(ctx, 118, 68, 17, '#f4f0d8'); circle(ctx, 126, 62, 15, sky68);
      ctx.globalAlpha = 0.06; circle(ctx, 118, 68, 34, '#f4f0d8'); ctx.globalAlpha = 1;
    },

    // ---- behind everything: mountains, the far skyline, THE SPHERE
    back: function (ctx, S, t) {
      const cam = S.cam;
      // the ring of mountains, which is the only reason this valley exists
      ctx.save(); ctx.translate(Math.round(-cam.x * 0.045), 0);
      const mr = makeRng(818);
      ctx.fillStyle = '#191230'; ctx.beginPath(); ctx.moveTo(-200, 300);
      for (let x = -200; x < W * 2 + 200; x += 46) ctx.lineTo(x, 226 + Math.sin(x * 0.011) * 26 + mr.range(-12, 12));
      ctx.lineTo(W * 2 + 200, 300); ctx.fill();
      ctx.restore();
      // the rest of the Strip, a long way off
      const sk = skylineCanvas(4141, W, 128, { color: '#150f28', lit: '#ffd0a0', tall: true, density: 0.42 });
      const off = Math.round(-cam.x * 0.1) % W;
      ctx.drawImage(sk, off, 172); ctx.drawImage(sk, off + W, 172); ctx.drawImage(sk, off - W, 172);
      // searchlights sweeping the haze, from somewhere you never get to
      for (let i = 0; i < 3; i++) {
        const a = Math.sin(t * 0.23 + i * 2.1) * 0.5;
        const bx = 180 + i * 300 - cam.x * 0.1;
        ctx.globalAlpha = 0.055; ctx.fillStyle = ['#8ad8ff', '#ffd24a', '#ff8ad8'][i];
        ctx.beginPath(); ctx.moveTo(bx - 6, 300); ctx.lineTo(bx + 6, 300);
        ctx.lineTo(bx + Math.sin(a) * 420 + 40, -40); ctx.lineTo(bx + Math.sin(a) * 420 - 40, -40); ctx.fill();
        ctx.globalAlpha = 1;
      }
      drawVegasSphere(ctx, Math.round(VEGAS_SPHERE_CX - cam.x * VEGAS_SPHERE_PAR),
        Math.round(VEGAS_SPHERE_CY - cam.y * 0.08), VEGAS_SPHERE_R, t, S);
    },

    // ---- the buildings and the ground they stand on
    mid: function (ctx, S, t) {
      for (let i = 0; i < VEGAS_CASINOS.length; i++) {
        const c = VEGAS_CASINOS[i];
        if (!S.cam.visible(c.x + c.w / 2, c.w)) continue;
        drawVegasCasino(ctx, c, VEGAS_F0, t, S);
      }
      // the plaza, and the wall it drops away down to the sidewalk
      sideFloor(ctx, -60, VEGAS_W + 60, VEGAS_F0, { h: VEGAS_F1 - VEGAS_F0, col: '#38314a', col2: '#2d2740', tile: 58, lip: '#6a5f88', shine: false });
      ctx.globalAlpha = 0.18;
      for (let x = -60; x < VEGAS_W + 60; x += 58) rect(ctx, x, VEGAS_F0 + 6, 2, VEGAS_F1 - VEGAS_F0 - 6, '#000000');
      ctx.globalAlpha = 1;
      // the lake, set into that wall
      for (let i = 0; i < VEGAS_CASINOS.length; i++) {
        const c = VEGAS_CASINOS[i];
        if (c.kind === 'fountain' && S.cam.visible(c.x + c.w / 2, c.w)) vegasFountainWater(ctx, c, t);
      }
      // two flights of steps down, which are decoration: up and down do the work
      for (const sx of [760, 2470]) {
        if (!S.cam.visible(sx, 120)) continue;
        for (let i = 0; i < 6; i++) {
          const y = VEGAS_F0 + 8 + i * ((VEGAS_F1 - VEGAS_F0 - 8) / 6);
          rect(ctx, sx - 40 - i * 4, y, 80 + i * 8, 6, '#4c4460');
          rect(ctx, sx - 40 - i * 4, y, 80 + i * 8, 2, '#6f6490');
        }
      }
      // the sidewalk
      sideFloor(ctx, -60, VEGAS_W + 60, VEGAS_F1, { h: VEGAS_KERB - VEGAS_F1, col: '#4a4456', col2: '#3e394c', tile: 46, lip: '#857aa4' });
      vegasSpill(ctx, S, t);
      vegasGutter(ctx, S, t);
      vegasShuttleBay(ctx, VEGAS_SHUTTLE_X - 95, VEGAS_F1, t);
      // everybody else, dimmed, so the street is never empty
      drawSideCrowd(ctx, S, S.vegCrowd0, t, { x0: 40, x1: VEGAS_W - 60, dim: 0.5 });
      drawSideCrowd(ctx, S, S.vegCrowd1, t, { x0: 40, x1: VEGAS_W - 60, dim: 0.25 });
    },

    // ---- in front of the lot: the kerb, the road, the traffic, the monorail
    fore: function (ctx, S, t) {
      rect(ctx, -60, VEGAS_KERB, VEGAS_W + 120, 8, '#6a6478');
      rect(ctx, -60, VEGAS_KERB, VEGAS_W + 120, 3, '#8f88a6');
      vgrad(ctx, -60, VEGAS_ROAD, VEGAS_W + 120, VEGAS_ROAD_BOT - VEGAS_ROAD, '#2f2c3a', '#16141d');
      ctx.globalAlpha = 0.4;
      for (let x = -60; x < VEGAS_W + 60; x += 76) rect(ctx, x, 556, 40, 3, '#e8e6dc');
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.07;
      for (let i = 0; i < 5; i++) rect(ctx, -60, VEGAS_ROAD + 4 + i * 9, VEGAS_W + 120, 2, '#ffd8a0');
      ctx.globalAlpha = 1;
      for (let i = 0; i < S.vegCars.length; i++) {
        const c = S.vegCars[i];
        if (!S.cam.visible(c.x + c.w / 2, c.w + 120)) continue;
        vegasCar(ctx, c, t);
      }
      vegasMonorail(ctx, S, t);
      // desert grit, blowing along the street all night
      const gr = makeRng(6161);
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 40; i++) {
        const gx = (gr.range(0, VEGAS_W) + t * gr.range(20, 70)) % VEGAS_W;
        const gy = VEGAS_F1 - gr.range(0, 60) + Math.sin(t * 3 + i) * 6;
        if (!S.cam.visible(gx, 40)) continue;
        px(ctx, gx, gy, '#c8b8a0');
      }
      ctx.globalAlpha = 1;
    },

    // ---- the grade over the top of the whole thing
    after: function (ctx, S, t) {
      grade(ctx, 0, 0, W, H, '#ff9a4a', 0.05);
      grade(ctx, 0, 0, W, H / 2, '#6a2a8a', 0.06);
      vignette(ctx, 0.42, '#0a0612');
      if (S.t < 7.2) letterbox(ctx, Math.round(46 * clamp((7.2 - S.t) / 1.4, 0, 1)));
    },

    // ---- the corner of the screen that says what you have
    overlay: function (ctx, S, t) {
      // Top left, not bottom left: on a phone the walk pads live down there
      // and this plate was sitting straight on top of them.
      const money = (Game.run && Game.run.money != null) ? Game.run.money : 11;
      ctx.globalAlpha = 0.9;
      rect(ctx, 10, 10, 220, 36, 'rgba(10,8,20,0.82)');
      frame(ctx, 10, 10, 220, 36, DF.goldLo);
      ctx.globalAlpha = 1;
      dfStamp(ctx, 16, 15, 26, null);
      drawText(ctx, fmtMoney(money), 48, 15, VEGAS_PAL.gold, { scale: 3 });
      drawText(ctx, 'ONE TICKET. ONE CASE.', 48, 36, withAlpha(VEGAS_PAL.cream, 0.6), { font: 'small' });
      // the boarding pass, once you have asked about the shuttle
      if (S.vegPassT > 0) {
        const k = popIn(Math.min(S.vegPassT, 0.4), 0.4);
        ctx.save();
        ctx.translate(W / 2, 96); ctx.scale(k, k); ctx.translate(-W / 2, -96);
        dfBoardingPass(ctx, W / 2 - 190, 34, 380, 124, { name: 'BUSKER / B', from: 'LAS VEGAS  LAS', to: 'TOKYO NARITA  NRT', flight: 'DF 0808', seat: '31A', gate: 'C12' }, t);
        ctx.restore();
      }
      // a nudge, once the opening is done and you are still dithering
      if (S.vegHint && !S.dlg && S.body.x < 3200) {
        const a = 0.45 + 0.35 * Math.sin(t * 4);
        ctx.globalAlpha = a;
        drawText(ctx, 'EAST', W - 66, H / 2 - 24, VEGAS_PAL.gold, { align: 'center', scale: 2, outline: '#2a1a08' });
        ctx.fillStyle = VEGAS_PAL.gold;
        for (let i = 0; i < 3; i++) {
          const ax = W - 84 + i * 16 + Math.sin(t * 5 - i * 0.7) * 3;
          ctx.beginPath(); ctx.moveTo(ax + 9, H / 2); ctx.lineTo(ax - 4, H / 2 - 9); ctx.lineTo(ax - 4, H / 2 + 9); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    },

    // ---- the props the shared library does not know about
    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'vbillboard': vegasBillboard(ctx, p, base, t); return true;
        case 'vbusstop': vegasBusStop(ctx, p, base, t); return true;
        case 'vslot': vegasSlotProp(ctx, p, base, t); return true;
        case 'vstar': vegasStar(ctx, p, base, t); return true;
        case 'vpalm': vegasPalm(ctx, p.x, base, p.h, p.seed || 1, t); return true;
        case 'vshuttle': {
          // just the ground marking: the shelter itself is painted into mid
          ctx.globalAlpha = 0.16 + 0.05 * Math.sin(t * 2);
          ellipsePx(ctx, p.x, base + 2, 44, 12, '#8fc0e4'); ctx.globalAlpha = 1;
          rect(ctx, p.x - 30, base - 2, 60, 4, '#2f4a68');
          rect(ctx, p.x - 30, base - 2, 60, 1, '#6a8fb8');
          ctx.fillStyle = VEGAS_PAL.gold;
          for (let i = 0; i < 3; i++) {
            const on = (Math.floor(t * 4) + i) % 3 === 0;
            ctx.globalAlpha = on ? 0.95 : 0.3;
            const ax = p.x - 22 + i * 18;
            ctx.beginPath(); ctx.moveTo(ax + 7, base - 8); ctx.lineTo(ax - 4, base - 14); ctx.lineTo(ax - 4, base - 2); ctx.fill();
          }
          ctx.globalAlpha = 1;
          return true;
        }
      }
      return false;
    },

    // ---- pressing the button on something
    use: function (S, e) {
      switch (e.act) {
        case 'shuttle': {
          S.vegPassT = 0.001;
          let boarding = false;
          Voice.chime('station');
          S.run([
            { who: 'YOU', text: 'DF 0808. SEAT 31A. GATE C12.', voice: 'you', at: 'you' },
            { who: 'YOU', text: 'NINE HOURS AND A LANGUAGE I DO NOT HAVE A WORD OF.', voice: 'you', think: true, at: 'you',
              choices: [
                { label: 'GET ON THE SHUTTLE', note: 'ONE WAY', next: 'board', go: function () { boarding = true; } },
                { label: 'NOT YET', note: 'LOOK AROUND', next: 'stay' },
              ] },
            { id: 'board', who: 'DRIVER', text: 'AIRPORT. LAST CALL. PUT THE CASE UNDER.', voice: 'driver', at: 'you' },
            { id: 'stay', when: function () { return !boarding; }, who: 'YOU', text: 'ONE MORE LOOK AT THE LIGHTS.', voice: 'you', at: 'you' },
          ], function () {
            if (!boarding) { S.vegPassT = 0; return; }
            Audio.ui('stamp');
            if (typeof DepartureScene === 'function') S.leave(function () { return new DepartureScene(); }, 'fade', { dur: 1 });
            else if (typeof PlaneScene === 'function') S.leave(function () { return new PlaneScene({ seated: true }); }, 'fade', { dur: 1 });
            else S.flash('THE SHUTTLE IS NOT HERE YET. TRY AGAIN.', 3);
          });
          break;
        }
        case 'elvis': {
          // four notes, then the only advice anybody on this street gives you
          e.pose = 'cheer'; S.vegElvis = 3.2;
          const ac = Audio.ctx, now = ac ? ac.currentTime : 0;
          const mel = [57, 60, 62, 65];
          for (let i = 0; i < mel.length; i++) Audio.note('vox8', mel[i], now + 0.14 + i * 0.36, 0.34, 0.6);
          S.fx.burst(S.cam.sx(e._x), S.cam.sy(S.floorY(e.floor) - 60), 14, { color: ['#ffd24a', '#fff6c8', '#ff8ad8'], speed: 70, up: 40, life: 0.8, kind: 'star', size: 2 });
          S.run([
            { who: 'THE KING', text: 'WELL SINCE MY BABY LEFT ME', voice: 'oldman', at: 'THE KING' },
            { who: 'THE KING', text: 'I FOUND A NEW PLACE TO PLAY.', voice: 'oldman', at: 'THE KING' },
            { who: 'THE KING', text: 'IT IS OUTSIDE A BUFFET. TWENTY YEARS.', voice: 'oldman', at: 'THE KING' },
            { who: 'THE KING', text: 'GO EAST, KID. BEFORE THIS GETS COMFORTABLE.', voice: 'oldman', at: 'THE KING' },
          ]);
          break;
        }
        case 'flyer': {
          S.run([
            { who: 'FLYER BUG', text: 'GIRLS GIRLS GIRLS. TAKE ONE. TAKE FOUR.', voice: 'clerk', at: 'FLYER BUG' },
            { who: 'FLYER BUG', text: 'I DO NINE HOURS. I HAVE NOT READ ONE.', voice: 'clerk', at: 'FLYER BUG' },
            { who: 'YOU', text: 'WHAT DOES IT SAY?', voice: 'you', at: 'you' },
            { who: 'FLYER BUG', text: 'A PHONE NUMBER AND A PROMISE. SAME AS ANYTHING.', voice: 'clerk', at: 'FLYER BUG' },
          ]);
          break;
        }
        case 'billboard': {
          S.vegPassT = 0.001;
          S.run([
            { who: 'YOU', text: 'SIX HUNDRED AND ELEVEN DOLLARS.', voice: 'you', at: 'you' },
            { who: 'YOU', text: 'THE AMP WENT. THE PEDALS WENT. THE COUCH WENT.', voice: 'you', think: true, at: 'you' },
            { who: 'YOU', text: 'THE CASE STAYS.', voice: 'you', at: 'you' },
          ], function () { S.vegPassT = 0; });
          break;
        }
        case 'slot': {
          Audio.ui('coin');
          S.fx.burst(S.cam.sx(e.x), S.cam.sy(S.propY(e) - 40), 10, { color: ['#ffd24a', '#c8a03a'], speed: 60, up: 30, life: 0.6, size: 2 });
          S.run([
            { who: 'THE MACHINE', text: 'BAR. BAR. CHERRY.', voice: 'robot', at: { x: e.x, y: S.propY(e) - 90 } },
            { who: 'YOU', text: 'THAT IS THE STORY OF THIS WHOLE TOWN.', voice: 'you', at: 'you' },
          ]);
          break;
        }
        case 'atm': {
          S.say('THE MACHINE', 'BALANCE: ' + fmtMoney(Game.run && Game.run.money != null ? Game.run.money : 11) + '. FEE: THREE FIFTY.', 'robot');
          break;
        }
        case 'vending': {
          S.say('YOU', 'SIX DOLLARS FOR WATER. THERE IS A TAP AT THE AIRPORT.', 'you');
          break;
        }
        case 'busstop': {
          S.run([
            { who: 'YOU', text: 'AIRPORT SHUTTLE. EVERY TWENTY MINUTES.', voice: 'you', at: 'you' },
            { who: 'YOU', text: 'STOPS AT THE FAR END OF THE STRIP.', voice: 'you', at: 'you' },
            { who: 'YOU', text: 'KEEP WALKING RIGHT.', voice: 'you', think: true, at: 'you' },
          ]);
          break;
        }
        case 'star': {
          S.run([
            { who: 'YOU', text: 'SOMEBODY SCRATCHED MY NAME INTO THE CEMENT.', voice: 'you', at: 'you' },
            { who: 'YOU', text: 'IT WAS ME. IT WAS A BAD WEEK.', voice: 'you', think: true, at: 'you' },
          ]);
          break;
        }
        case 'door': {
          const lines = {
            casino: ['THE DOORMAN DOES NOT MOVE.', 'CASE STAYS OUTSIDE.'],
            lounge: ['THE LOUNGE SMELLS OF CARPET AND SMOKE.', 'A PIANO, BADLY TUNED, PLAYING ITSELF.'],
            chapel: ['ORGAN MUSIC ON A CD.', 'TWO BUGS, VERY HAPPY, VERY FAST.'],
            pawn: ['A WALL OF GUITARS NOBODY CAME BACK FOR.', 'YOU DO NOT GO IN.'],
            buffet: ['CRAB LEGS. FOUR IN THE MORNING. EIGHT NINETY NINE.', 'YOU HAVE ELEVEN DOLLARS AND NINE HOURS TO FLY.'],
          };
          const set = lines[e.doorMsg] || ['LOCKED.'];
          S.run(set.map(function (l) { return { who: 'YOU', text: l, voice: 'you', at: 'you' }; }));
          break;
        }
      }
    },

    // ---- the street, running by itself
    tick: function (S, dt) {
      // the traffic, which creeps and stops and creeps
      for (let i = 0; i < S.vegCars.length; i++) {
        const c = S.vegCars[i];
        const crawl = 0.18 + 0.82 * Math.max(0, Math.sin(S.t * 0.26 + c.lane * 1.7 + c.o));
        c.x += c.face * c.sp * crawl * dt;
        if (c.face > 0 && c.x > VEGAS_W + 220) c.x = -300;
        if (c.face < 0 && c.x < -300) c.x = VEGAS_W + 220;
      }
      // the Sphere notices you, once, and says something about it
      if (!S.vegSpoke && !S.dlg && S.body.x > 700 && S.body.x < 1040) {
        S.vegSpoke = true;
        vegasSphereSpeak(4.2);
        const F = VEGAS_SPHERE;
        F.from = F.idx; F.idx = 0; F.wipe = 0; F.faceT = 0; F.hold = 10;
        S.cam.kick(2, 0.25);
        S.run([
          { who: 'THE SPHERE', text: 'HELLO DOWN THERE. SMALL PERSON. BIG CASE.', voice: 'robot', at: { x: VEGAS_SPHERE_WORLD, y: 210 } },
          { who: 'THE SPHERE', text: 'I HAVE WATCHED YOU PLAY HERE FOUR YEARS.', voice: 'robot', at: { x: VEGAS_SPHERE_WORLD, y: 210 } },
          { who: 'THE SPHERE', text: 'GO. I WILL KEEP THE LIGHTS ON.', voice: 'robot', at: { x: VEGAS_SPHERE_WORLD, y: 210 } },
        ]);
      }
      if (S.vegElvis > 0) {
        S.vegElvis -= dt;
        if (S.vegElvis <= 0) { for (let i = 0; i < S.npcs.length; i++) if (S.npcs[i].act === 'elvis') S.npcs[i].pose = 'play'; }
      }
      if (S.vegPassT > 0) S.vegPassT += dt;
    },

    init: function (S) {
      S.vegCrowd0 = makeSideCrowd(16, 5150, { x0: 60, x1: VEGAS_W - 80, floors: 1, min: 1.0, max: 1.25 });
      for (let i = 0; i < S.vegCrowd0.length; i++) S.vegCrowd0[i].floor = 0;
      S.vegCrowd1 = makeSideCrowd(10, 7788, { x0: 60, x1: VEGAS_W - 80, floors: 1, min: 1.1, max: 1.4 });
      for (let i = 0; i < S.vegCrowd1.length; i++) S.vegCrowd1[i].floor = 1;
      // the jam. Two lanes, going nowhere, all night, for ever.
      const cr = makeRng(2727);
      S.vegCars = [];
      for (let i = 0; i < 16; i++) {
        const lane = i % 2;
        const kind = cr.chance(0.34) ? 'limo' : cr.chance(0.5) ? 'taxi' : 'car';
        S.vegCars.push({
          x: cr.range(-200, VEGAS_W), lane: lane,
          y: lane ? 594 : 552, w: kind === 'limo' ? cr.range(180, 230) : cr.range(92, 116),
          kind: kind, face: lane ? -1 : 1, sp: cr.range(26, 54), o: cr.range(0, 6.3),
          col: kind === 'limo' ? '#14141c' : kind === 'taxi' ? '#e0b23c' : cr.pick(['#8a2a2a', '#2f4a8a', '#3a3a46', '#6a6a78', '#2f6a4a', '#c8c2b4']),
        });
      }
      S.vegCars.sort(function (a, b) { return a.y - b.y; });   // far lane first
      S.vegSpoke = false; S.vegPassT = 0; S.vegElvis = 0; S.vegHint = false;
      if (typeof setChapter === 'function') setChapter('vegas');
      // the opening. Short, because the street says the rest of it.
      S.run([
        { who: 'YOU', text: 'FOUR YEARS ON THIS CORNER.', voice: 'you', at: 'you' },
        { who: 'YOU', text: 'ONE CASE. ONE TICKET. ELEVEN DOLLARS.', voice: 'you', at: 'you' },
        { who: 'YOU', text: 'THE AIRPORT SHUTTLE IS AT THE FAR END.', voice: 'you', think: true, at: 'you' },
      ], function () {
        S.vegHint = true;
        S.flash('WALK RIGHT. THE SHUTTLE GOES AT NINE.', 4.5);
      });
    },

    enterLine: 'THE HEAT COMES OFF THE PAVEMENT ALL NIGHT.',
  };
}

// ---------- LAS VEGAS ----------
class VegasScene extends SideScene {
  constructor(opts) {
    super(vegasDef(), opts || {});
    // the Sphere keeps its own clock between scenes; start it fresh here so
    // the first face you see is the eye, looking straight at you
    VEGAS_SPHERE.lt = -1; VEGAS_SPHERE.idx = 0; VEGAS_SPHERE.from = 0;
    VEGAS_SPHERE.wipe = 1; VEGAS_SPHERE.faceT = 0; VEGAS_SPHERE.hold = 6.5;
    VEGAS_SPHERE.talk = 0; VEGAS_SPHERE.mouth = 0;
  }
  // the extras some of the street's people are wearing or carrying, which the
  // shared bug sprite has no idea about
  drawNpc(ctx, n) {
    const y = n.y != null ? n.y : this.floorY(n.floor), z = this.floorZ(n.floor);
    if (n.vfeather) vegasFeathers(ctx, n._x, y - 44 * n.scale * z, this.t, hashStr(n.name + n.x) % 10, n.vfeather);
    super.drawNpc(ctx, n);
    if (n.vcup) vegasBigCup(ctx, n._x, y, n.face || 1, n.scale * z * 0.85, this.t);
  }
}
