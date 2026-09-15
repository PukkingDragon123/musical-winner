// ---------- Instrument UI: perspective fretboard, keyboard, drums, horns ----------
'use strict';
const P_K = 2.0;
const persp = (k) => 1 / (1 + k * P_K);
const P_FAR = persp(1);
const perspY = (k, nearY, farY) => lerp(nearY, farY, (1 - persp(k)) / (1 - P_FAR));

// A highway view: lanes converging to a vanishing point.
class Highway {
  constructor(A, lanes, opts = {}) {
    this.A = A; this.L = lanes;
    this.cx = A.x + A.w / 2;
    this.nearY = opts.nearY != null ? opts.nearY : A.y + A.h - (opts.touch ? 46 : 40);
    this.farY = A.y + (opts.farPad != null ? opts.farPad : 16);
    this.nearW = opts.nearW != null ? opts.nearW : Math.min(A.w - 30, lanes * (opts.touch ? 68 : 66));
    if (opts.pads && opts.pads.length === lanes) { this.nearW = opts.pads[lanes - 1].x + opts.pads[lanes - 1].w - opts.pads[0].x; this.cx = opts.pads[0].x + this.nearW / 2; }
    this.laneW = this.nearW / lanes;
  }
  laneCx(l) { return this.cx - this.nearW / 2 + this.laneW * (l + 0.5); }
  pos(l, k) { const p = persp(k); return { x: this.cx + (this.laneCx(l) - this.cx) * p, y: perspY(k, this.nearY, this.farY), w: this.laneW * p, p }; }
  edge(side, k) { const p = persp(k); const x = this.cx + (this.cx - this.nearW / 2 - this.cx) * p; return side < 0 ? x : this.cx + (this.nearW / 2) * p; }
}
function fillTrapezoid(ctx, hw, l0, l1, k0, k1, color) {
  const a = hw.pos(l0, k0), b = hw.pos(l1, k1);
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(Math.round(a.x - a.w / 2), Math.round(a.y)); ctx.lineTo(Math.round(hw.pos(l1, k0).x + a.w / 2), Math.round(a.y));
  ctx.lineTo(Math.round(hw.pos(l1, k1).x + b.w / 2), Math.round(b.y)); ctx.lineTo(Math.round(b.x - b.w / 2), Math.round(b.y));
  ctx.closePath(); ctx.fill();
}

// ---------- GUITAR / BASS: wooden fretboard, real strings that ring ----------
const STRING_COLS = ['#e8d9a8', '#d8c48a', '#c9b478', '#b9a468', '#a89458', '#988448'];
function drawFretboard(ctx, hw, R, opts = {}) {
  const A = hw.A, isBass = opts.bass;
  // body below the nut: wood, pickups, bridge
  const bodyTop = hw.nearY + 6, col = opts.bodyColor || '#8a3a22';
  const bw = hw.nearW + 120, bh = A.y + A.h - bodyTop;
  ellipsePx(ctx, hw.cx, bodyTop + bh * 0.5, bw / 2, bh * 1.05, darken(col, 0.3));
  ellipsePx(ctx, hw.cx, bodyTop + bh * 0.5, bw / 2 - 3, bh * 1.05 - 3, col);
  ctx.globalAlpha = 0.3; ellipsePx(ctx, hw.cx - bw * 0.2, bodyTop + 6, bw / 5, 4, lighten(col, 0.3)); ctx.globalAlpha = 1;
  const pw = hw.nearW + 26;
  for (let i = 0; i < 2; i++) { const py = bodyTop + 7 + i * 12; rect(ctx, hw.cx - pw / 2, py, pw, 7, '#2a2430'); rect(ctx, hw.cx - pw / 2, py, pw, 2, '#6a6478'); for (let s = 0; s < hw.L; s++) { const x = hw.laneCx(s); circle(ctx, x, py + 3, 2, '#d8d0b0'); } }
  rect(ctx, hw.cx - pw / 2 - 10, bodyTop + 32, pw + 20, 4, '#c8b070'); rect(ctx, hw.cx - pw / 2 - 10, bodyTop + 32, pw + 20, 1, '#f0e0a0');
  // fretboard wood
  ctx.save(); ctx.beginPath();
  ctx.moveTo(hw.cx - hw.nearW / 2 - 8, hw.nearY + 8); ctx.lineTo(hw.cx + hw.nearW / 2 + 8, hw.nearY + 8);
  ctx.lineTo(hw.cx + (hw.nearW / 2 + 8) * P_FAR, hw.farY); ctx.lineTo(hw.cx - (hw.nearW / 2 + 8) * P_FAR, hw.farY); ctx.closePath(); ctx.clip();
  vgrad(ctx, A.x, hw.farY, A.w, hw.nearY + 8 - hw.farY, '#2e1d12', '#5a3a22');
  // wood grain
  for (let i = 0; i < 26; i++) { const g = (i * 37) % 100 / 100; const x0 = hw.cx + (g - 0.5) * (hw.nearW + 16), x1 = hw.cx + (g - 0.5) * (hw.nearW + 16) * P_FAR; ctx.globalAlpha = 0.16; line(ctx, x0, hw.nearY + 8, x1, hw.farY, i % 2 ? '#7a5230' : '#24160e'); ctx.globalAlpha = 1; }
  ctx.restore();
  // frets
  const beat = opts.beat || 0.5, now = opts.now || 0, approach = opts.approach || 1.4;
  for (let b = Math.ceil(now / beat); ; b++) {
    const k = (b * beat - now) / approach; if (k > 1) break; if (k < -0.05) continue;
    const p = persp(k), y = perspY(k, hw.nearY, hw.farY), hwid = (hw.nearW / 2 + 8) * p;
    const major = b % 4 === 0;
    rect(ctx, hw.cx - hwid, y, hwid * 2, major ? 2 : 1, major ? '#d8d4c8' : '#9a9488');
    rect(ctx, hw.cx - hwid, y, hwid * 2, 1, major ? '#fff8e8' : '#b8b2a4');
    if (major) { circle(ctx, hw.cx, y + 6 * p, Math.max(1, 3 * p), '#f0e8d0'); }
  }
  // strings
  for (let l = 0; l < hw.L; l++) {
    const vib = R.stringVib[l] || 0;
    const col = STRING_COLS[isBass ? l : Math.min(5, l + (6 - hw.L))];
    const thick = isBass ? 3 : (hw.L <= 4 ? 2 : 1) + (l >= hw.L - 1 ? 1 : 0);
    const steps = 22;
    for (let i = 0; i < steps; i++) {
      const k0 = i / steps, k1 = (i + 1) / steps;
      const a = hw.pos(l, k0), b2 = hw.pos(l, k1);
      const w0 = Math.max(1, Math.round(thick * a.p)), amp = vib * 5 * Math.sin(k0 * Math.PI);
      const off = amp * Math.sin(k0 * 16 + (opts.time || 0) * 46);
      ctx.fillStyle = i % 2 ? col : lighten(col, 0.12);
      const yy = Math.round(a.y), hh = Math.max(1, Math.round(a.y - b2.y));
      ctx.fillRect(Math.round(a.x + off - w0 / 2), yy - hh, w0, hh + 1);
    }
    // nut slot + tuning glow
    const n = hw.pos(l, 0);
    rect(ctx, n.x - 3, hw.nearY - 2, 6, 4, '#e8e0c8');
    if (vib > 0.05) { ctx.globalAlpha = vib * 0.5; circle(ctx, n.x, hw.nearY, 8, opts.laneColors[l]); ctx.globalAlpha = 1; }
  }
  // nut
  rect(ctx, hw.cx - hw.nearW / 2 - 10, hw.nearY - 4, hw.nearW + 20, 6, '#f0e6cc'); rect(ctx, hw.cx - hw.nearW / 2 - 10, hw.nearY - 4, hw.nearW + 20, 2, '#fffaf0');
  // A pick riding the last string you struck, throwing sparks off it, and the
  // amp cone underneath breathing with the low end. An electric guitar should
  // look like it is doing something to the air.
  let loud = 0, lastL = 0;
  for (let l = 0; l < hw.L; l++) { const v = R.stringVib[l] || 0; if (v > loud) { loud = v; lastL = l; } }
  if (loud > 0.04) {
    const px2 = hw.laneCx(lastL), py2 = hw.nearY + 2 + Math.sin((opts.time || 0) * 40) * loud * 3;
    const pcol = opts.laneColors ? opts.laneColors[lastL] : '#ffd24a';
    ctx.globalAlpha = clamp(loud * 1.4, 0, 1);
    // the plectrum itself, a little triangle held against the string
    for (let i = 0; i < 7; i++) rect(ctx, px2 - (6 - i), py2 + 4 + i, (6 - i) * 2 + 1, 1, i < 2 ? '#fff4c8' : '#d9b45a');
    rect(ctx, px2 - 7, py2 + 2, 15, 2, '#2a1e08');
    ctx.globalAlpha = 1;
    if (Math.random() < loud * 0.9) for (let i = 0; i < 2; i++)
      R.fx.add({ x: px2 + (Math.random() - 0.5) * 10, y: py2, vx: (Math.random() - 0.5) * 90, vy: -30 - Math.random() * 50, life: 0.3, color: i ? '#fff8e0' : pcol, kind: 'spark', size: 2, gravity: 220 });
  }
  // the speaker cone in the body, pumping on the beat
  const pump = 1 + loud * 0.35 + (R.beatPulse || 0) * 0.12;
  const coneY = bodyTop + bh * 0.62;
  ellipsePx(ctx, hw.cx, coneY, 26 * pump, 10 * pump, darken(col, 0.45));
  ellipsePx(ctx, hw.cx, coneY, 23 * pump, 8.5 * pump, '#2a2430');
  ellipsePx(ctx, hw.cx, coneY, 9 * pump, 3.4 * pump, darken(col, 0.1));
  ctx.globalAlpha = 0.35 + loud * 0.5;
  ellipsePx(ctx, hw.cx - 7, coneY - 3, 7 * pump, 2.4 * pump, lighten(col, 0.4));
  ctx.globalAlpha = 1;
}

// ---------- PIANO: real keyboard at the receptor ----------
function drawKeyboard(ctx, hw, R, opts = {}) {
  const A = hw.A, top = hw.nearY - 2, h = A.y + A.h - top - 4;
  const whiteW = hw.laneW;
  rect(ctx, A.x, top - 6, A.w, 6, '#2a2430'); rect(ctx, A.x, top - 6, A.w, 2, '#4a4458');
  for (let l = 0; l < hw.L; l++) {
    const x = hw.laneCx(l) - whiteW / 2, down = R.keysDown.has(opts.keys[l]) || (R.flashes[l] || 0) > 0;
    rect(ctx, x + 1, top, whiteW - 2, h, down ? '#e8dfc8' : '#f6f2e6');
    rect(ctx, x + 1, top, whiteW - 2, 2, down ? '#c8bfa8' : '#ffffff');
    rect(ctx, x + 1, top + h - 3, whiteW - 2, 3, down ? '#a89880' : '#d8d0c0');
    rect(ctx, x, top, 1, h, '#3a3440');
    if (down) { ctx.globalAlpha = 0.5; rect(ctx, x + 1, top, whiteW - 2, h, opts.laneColors[l]); ctx.globalAlpha = 1; }
  }
  // black keys between some whites
  for (let l = 0; l < hw.L - 1; l++) { if (l % 3 === 1) continue; const x = hw.laneCx(l) + whiteW / 2 - 5; rect(ctx, x, top, 10, Math.round(h * 0.6), '#1a1620'); rect(ctx, x, top, 10, 2, '#4a4450'); }
  rect(ctx, A.x, A.y + A.h - 4, A.w, 4, '#3a2a2a');
}
// ---------- TAIKO drum body ----------
// A proper odaiko: a barrel of hollowed wood, a tacked hide head, and the
// lacquered X-stand it sits in. The centre is the skin, the ring is the rim,
// and the two sound nothing like each other.
function drawTaikoDrum(ctx, x, y, r, hitDon, hitKa, t) {
  const sq = hitDon > 0 || hitKa > 0 ? 1 + Math.max(hitDon, hitKa) * 0.1 : 1;
  const rr = Math.round(r * sq);
  x = Math.round(x); y = Math.round(y);
  // the stand behind it: two lacquered legs and a crossbar
  for (const d of [-1, 1]) {
    line(ctx, x + d * (rr + 4), y + rr - 4, x + d * (rr + 20), y + rr + 26, '#2e1a14');
    line(ctx, x + d * (rr + 5), y + rr - 4, x + d * (rr + 21), y + rr + 26, '#4a2c20');
  }
  rect(ctx, x - rr - 16, y + rr + 22, (rr + 16) * 2, 3, '#3a2218');
  rect(ctx, x - rr - 16, y + rr + 22, (rr + 16) * 2, 1, '#5e3a28');
  // the shell, a barrel seen end-on
  ellipsePx(ctx, x, y + 4, rr + 9, rr + 9, '#241209');
  ellipsePx(ctx, x, y, rr + 9, rr + 9, '#6a3a1e');
  ellipsePx(ctx, x, y, rr + 8, rr + 8, '#8a5228');
  // the grain of the wood around the rim
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; const c = (i % 3) ? '#7a4622' : '#96602f';
    ellipseRingPx(ctx, x, y, rr + 7 - (i % 2), rr + 7 - (i % 2), null);
    px(ctx, Math.round(x + Math.cos(a) * (rr + 6)), Math.round(y + Math.sin(a) * (rr + 6)), c); }
  ellipsePx(ctx, x, y, rr + 4, rr + 4, '#5a3018');
  // the hide head, pale and slightly warm, darkening where it is struck
  const headCol = hitDon > 0 ? '#fff0d4' : '#f2e6d0';
  ellipsePx(ctx, x, y, rr, rr, headCol);
  ellipsePx(ctx, x, y, rr - 1, rr - 1, hitDon > 0 ? '#fff8ea' : '#f8f0e0');
  // the worn spot in the middle where every stroke lands
  ellipsePx(ctx, x, y, Math.round(rr * 0.44), Math.round(rr * 0.44), hitDon > 0 ? '#ffeab8' : '#eee0c6');
  ctx.globalAlpha = 0.22; ellipsePx(ctx, x - rr / 3, y - rr / 3, Math.round(rr / 2), Math.round(rr / 2.4), '#ffffff'); ctx.globalAlpha = 1;
  // the tacks that hold the hide on, all the way round
  for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + 0.17;
    const tx = Math.round(x + Math.cos(a) * (rr + 2)), ty = Math.round(y + Math.sin(a) * (rr + 2));
    px(ctx, tx, ty, hitKa > 0 ? '#fff4c8' : '#e0b040'); px(ctx, tx, ty + 1, '#8a6420'); }
  // the rim itself lights when you hit the edge
  if (hitKa > 0) { ctx.globalAlpha = clamp(hitKa * 3, 0, 1); ellipseRingPx(ctx, x, y, rr + 5, rr + 5, '#d8e8ff'); ellipseRingPx(ctx, x, y, rr + 6, rr + 6, '#8ab8f0'); ctx.globalAlpha = 1; }
  if (hitDon > 0) { ctx.globalAlpha = clamp(hitDon * 2.2, 0, 1); ellipseRingPx(ctx, x, y, Math.round(rr * 0.6), Math.round(rr * 0.6), '#ffd8a0'); ctx.globalAlpha = 1; }
  // a pair of bachi, thick and tapered, resting either side
  const sw = Math.sin(t * 9) * 3;
  for (const s of [-1, 1]) {
    const bx = x + s * (rr + 17), by = y + 8 + (s > 0 ? sw : -sw);
    for (let i = 0; i < 20; i++) {
      const px2 = Math.round(bx - s * i * 0.4), py2 = Math.round(by + 12 - i * 0.9);
      const thick = i > 12 ? 3 : 2;
      rect(ctx, px2, py2, thick, 2, i > 15 ? '#f0e2c0' : '#ddc79a');
      rect(ctx, px2, py2 + 2, thick, 1, '#a8895e');
    }
  }
}
// ---------- SAX / TRUMPET / VIOLIN bodies ----------
// ---------- Real instruments, built like the kit is ----------
// The horns and the strings used to be a handful of raw circles drawn straight
// to the canvas, which looked nothing like the rest of the game. They are now
// cached Pix sprites at final size with the same treatment as everything else:
// brass gets metal, wood gets grain, and every one of them has an outline.

// An alto: mouthpiece, crook, body, bow, and a bell that flares up and right.
function saxSprite() {
  return cached('sax|body', () => {
    const P = new Pix(46, 108);
    const brass = '#d9a83c', dark = '#6e4c0e';
    // the bow, the U-turn at the bottom
    let m = P.mask();
    P.mEllipse(m, 23, 86, 13, 11); P.mRect(m, 10, 68, 26, 18);
    const cut = P.mask(); P.mEllipse(cut, 23, 84, 7, 7); P.mRect(cut, 16, 60, 14, 24);
    P.mSub(m, cut);
    // the body tube
    P.mRound(m, 15, 26, 13, 50, 3);
    // the bell: a cone opening up to the right
    for (let i = 0; i < 42; i++) {
      const y = 78 - i, half = 4 + i * 0.19;
      P.mRect(m, Math.round(29 - half * 0.25), y, Math.round(half * 1.5), 1);
    }
    P.fill(m, brass, { outline: '#241804', hi: '#ffeeae', lo: dark });
    P.metal(m, 7, 0.14);
    P.grain(m, 0.03, 11);
    // the bell mouth, a dark throat with a rolled rim
    const mouth = P.mask(); P.mEllipse(mouth, 33, 36, 10, 4);
    P.fill(mouth, '#2a1c06', { shade: false });
    const rim = P.mask(); P.mEllipse(rim, 33, 36, 10, 4); const inner = P.mask(); P.mEllipse(inner, 33, 36, 8, 3); P.mSub(rim, inner);
    P.fill(rim, '#ffeeae', { shade: false });
    // an engraved band around the bell, the way a good horn is decorated
    for (const yy of [44, 46]) for (let x = 24; x < 43; x++) if (P.get(x, yy) != null && (x + yy) % 3) P._shift(x, yy, -0.22);
    // the crook, curving left and up to the mouthpiece
    const cr = P.mask();
    for (let i = 0; i < 24; i++) { const t = i / 23; P.mEllipse(cr, 21 - t * 10 + Math.sin(t * 2.2) * 2, 26 - i, 4 - t, 3 - t * 0.8); }
    P.fill(cr, brass, { outline: '#241804', hi: '#ffeeae', lo: dark });
    P.metal(cr, 3, 0.12);
    // key cups and the rods that link them
    for (let i = 0; i < 7; i++) {
      const yy = 32 + i * 6, xx = i % 2 ? 26 : 13;
      const k = P.mask(); P.mEllipse(k, xx, yy, 3, 2.4);
      P.fill(k, '#efd77e', { outline: '#3a2806' });
      const rod = P.mask(); P.mLine(rod, xx, yy, i % 2 ? 22 : 19, yy, 1);
      P.fill(rod, '#b8912e', { shade: false });
    }
    // the mouthpiece and its reed
    const mp = P.mask(); P.mRound(mp, 7, 1, 9, 12, 3);
    P.fill(mp, '#241f2c', { outline: '#0c0a12', hi: '#5a5468' });
    const reed = P.mask(); P.mPoly(reed, [[8, 4], [13, 3], [13, 11], [8, 12]]);
    P.fill(reed, '#c9a56a', { shade: false });
    const lig = P.mask(); P.mRect(lig, 7, 7, 9, 2);
    P.fill(lig, '#cfc6b0', { shade: false });
    return P.toCanvas();
  });
}
// A length of bamboo with five holes and a cut blowing edge. Nothing like a sax.
function shakuhachiSprite() {
  return cached('shaku|body', () => {
    const P = new Pix(18, 112);
    const m = P.mask();
    for (let y = 0; y < 112; y++) { const half = 3 + (y / 111) * 2.6; P.mRect(m, Math.round(9 - half), y, Math.round(half * 2), 1); }
    P.fill(m, '#c9ad78', { outline: '#3a2c14', hi: '#efd9a8', lo: '#8a6f3e' });
    P.wood(m, 5, 0.07);
    P.grain(m, 0.045, 17);
    // the nodes: bamboo grows in sections and every joint shows
    for (const ny of [22, 47, 71, 95]) {
      const n = P.mask(); P.mRect(n, 0, ny, 18, 3);
      const keep = P.mask(); for (let i = 0; i < n.length; i++) if (n[i] && m[i]) keep[i] = 1;
      P.fill(keep, '#8a6f3e', { shade: false });
      const lip = P.mask(); for (let x = 0; x < 18; x++) if (m[ny * 18 + x]) lip[ny * 18 + x] = 1;
      P.fill(lip, '#efd9a8', { shade: false });
    }
    // four holes at the front, one at the back
    for (const [hy, hx] of [[36, 9], [54, 9], [66, 9], [82, 9], [90, 6]]) {
      const h = P.mask(); P.mEllipse(h, hx, hy, 2.2, 2);
      P.fill(h, '#2a1e0c', { shade: false });
      const sh = P.mask(); P.mEllipse(sh, hx, hy - 1, 2.2, 1); const in2 = P.mask(); P.mEllipse(in2, hx, hy, 1.6, 1.4); P.mSub(sh, in2);
      P.fill(sh, '#5a4420', { shade: false });
    }
    // the utaguchi: the blowing edge, cut away at an angle and inlaid
    const u = P.mask(); P.mPoly(u, [[4, 0], [13, 0], [13, 5], [7, 3]]);
    P.fill(u, '#1c1406', { shade: false });
    const inlay = P.mask(); P.mLine(inlay, 4, 1, 13, 4, 1);
    P.fill(inlay, '#efe6d0', { shade: false });
    // the root end flares, because it is cut from the bottom of the stalk
    const root = P.mask(); P.mEllipse(root, 9, 109, 8, 3);
    P.fill(root, '#b09055', { outline: '#3a2c14' });
    return P.toCanvas();
  });
}
// A Bb trumpet lying on its side: leadpipe, three casings, tuning slide, bell.
function trumpetSprite() {
  return cached('trumpet|body', () => {
    const P = new Pix(104, 48);
    const brass = '#e4b64a', dark = '#7a5610';
    const m = P.mask();
    P.mRect(m, 8, 20, 62, 7);                        // leadpipe and the run to the bell
    P.mRound(m, 66, 17, 12, 13, 4);                  // the first bend
    for (let i = 0; i < 26; i++) { const half = 4 + i * 0.62; P.mRect(m, 76 + i, Math.round(23 - half), 1, Math.round(half * 2)); }
    P.mRect(m, 8, 30, 52, 5);                        // the bottom run back
    P.mRound(m, 4, 19, 9, 17, 4);                    // the tuning slide crook
    const hole = P.mask(); P.mRect(hole, 10, 27, 48, 3); P.mEllipse(hole, 8, 27, 3, 3);
    P.mSub(m, hole);
    P.fill(m, brass, { outline: '#2a1c04', hi: '#fff0b0', lo: dark });
    P.metal(m, 9, 0.15);
    // the bell mouth and its rolled rim
    const mouth = P.mask(); P.mEllipse(mouth, 101, 23, 3, 15);
    P.fill(mouth, '#301f04', { shade: false });
    const rim = P.mask(); P.mEllipse(rim, 101, 23, 3, 15); const in3 = P.mask(); P.mEllipse(in3, 100, 23, 2, 13); P.mSub(rim, in3);
    P.fill(rim, '#fff0b0', { shade: false });
    // three valve casings standing up off the tube
    for (let v = 0; v < 3; v++) {
      const vx = 26 + v * 13, c = P.mask();
      P.mRound(c, vx, 6, 9, 26, 3);
      P.fill(c, '#d6ab44', { outline: '#2a1c04', hi: '#fff0b0', lo: dark });
      P.metal(c, 13 + v, 0.14);
      const cap = P.mask(); P.mRound(cap, vx - 1, 3, 11, 5, 2);
      P.fill(cap, '#efe4c0', { outline: '#2a1c04' });
    }
    // the mouthpiece
    const mp = P.mask(); P.mEllipse(mp, 2, 23, 3, 5); P.mRect(mp, 2, 21, 6, 5);
    P.fill(mp, '#dcd6c4', { outline: '#2a1c04', hi: '#ffffff' });
    return P.toCanvas();
  });
}
// A fiddle: two bouts, a carved waist, f-holes, a scroll, and four strings.
function violinSprite() {
  return cached('violin|body', () => {
    const P = new Pix(44, 122);
    const top = '#b4652c';
    const m = P.mask();
    P.mEllipse(m, 22, 84, 18, 20);      // lower bout
    P.mEllipse(m, 22, 52, 14, 15);      // upper bout
    P.mRect(m, 10, 52, 24, 34);
    const waist = P.mask(); P.mEllipse(waist, -2, 68, 12, 10); P.mEllipse(waist, 46, 68, 12, 10);
    P.mSub(m, waist);
    P.fill(m, top, { outline: '#2c1406', hi: '#e79a58', lo: '#6e360f' });
    P.wood(m, 21, 0.08);
    P.grain(m, 0.035, 31);
    // purfling: the inlaid line that follows the edge all the way round
    const edge = P.mCopy(m), inn = P.mask();
    for (let y = 1; y < 121; y++) for (let x = 1; x < 43; x++)
      if (m[y * 44 + x] && m[y * 44 + x - 1] && m[y * 44 + x + 1] && m[(y - 1) * 44 + x] && m[(y + 1) * 44 + x]) inn[y * 44 + x] = 1;
    P.mSub(edge, inn);
    P.fill(edge, '#3a1c08', { shade: false });
    // two f-holes either side of the bridge
    for (const sx of [13, 31]) {
      const f = P.mask();
      P.mLine(f, sx, 64, sx + (sx < 22 ? 1 : -1), 82, 1);
      P.mEllipse(f, sx, 62, 2, 2); P.mEllipse(f, sx + (sx < 22 ? 1 : -1), 84, 2, 2);
      P.fill(f, '#2a1406', { shade: false });
    }
    // bridge, tailpiece and chin rest
    const br = P.mask(); P.mPoly(br, [[14, 74], [30, 74], [28, 70], [16, 70]]);
    P.fill(br, '#d9bd84', { outline: '#5a3c14' });
    const tp = P.mask(); P.mPoly(tp, [[17, 88], [27, 88], [25, 104], [19, 104]]);
    P.fill(tp, '#2a2028', { outline: '#120c10', hi: '#5a4c58' });
    const cr = P.mask(); P.mRound(cr, 9, 96, 12, 14, 4);
    P.fill(cr, '#241a20', { outline: '#0e0a0e', hi: '#4a3c46' });
    // neck, fingerboard, pegbox and the scroll
    const nk = P.mask(); P.mRect(nk, 18, 20, 8, 34);
    P.fill(nk, '#8a4a20', { outline: '#2c1406' });
    const fb = P.mask(); P.mPoly(fb, [[18, 20], [26, 20], [28, 60], [16, 60]]);
    P.fill(fb, '#231a20', { outline: '#0e0a0e', hi: '#453846' });
    const pb = P.mask(); P.mRound(pb, 17, 6, 10, 16, 3);
    P.fill(pb, '#8a4a20', { outline: '#2c1406', hi: '#c2763a' });
    const sc = P.mask(); P.mEllipse(sc, 22, 5, 6, 5); const sh = P.mask(); P.mEllipse(sh, 23, 5, 2, 2); P.mSub(sc, sh);
    P.fill(sc, '#a05a26', { outline: '#2c1406', hi: '#d8834a' });
    for (let i = 0; i < 4; i++) { const pg = P.mask(); P.mEllipse(pg, i % 2 ? 29 : 15, 10 + Math.floor(i / 2) * 7, 3, 2); P.fill(pg, '#1c1418', { outline: '#0a0708' }); }
    // four strings running the length of it
    for (let i = 0; i < 4; i++) { const st = P.mask(); P.mLine(st, 19 + i * 2, 14, 18 + i * 3, 88, 1); P.fill(st, i > 1 ? '#cfc4a0' : '#efe8d0', { shade: false }); }
    return P.toCanvas();
  });
}
function bowSprite() {
  return cached('bow|stick', () => {
    const P = new Pix(116, 12);
    const st = P.mask();
    for (let x = 0; x < 116; x++) P.mRect(st, x, Math.round(4 + Math.sin(x / 116 * Math.PI) * 1.6), 1, 2);
    P.fill(st, '#5a3416', { outline: '#1e1006', hi: '#8a5426' });
    const hair = P.mask(); P.mRect(hair, 6, 2, 104, 2);
    P.fill(hair, '#efe6cc', { shade: false });
    const frog = P.mask(); P.mRound(frog, 0, 1, 11, 9, 2);
    P.fill(frog, '#221a20', { outline: '#0c080c', hi: '#4a3c48' });
    const tip = P.mask(); P.mPoly(tip, [[108, 1], [115, 3], [115, 7], [108, 9]]);
    P.fill(tip, '#cfc4a8', { outline: '#2a2018' });
    return P.toCanvas();
  });
}
// A shamisen: a square drum of a body with a skin head, and a long fretless neck.
function shamisenSprite() {
  return cached('shamisen|body', () => {
    const P = new Pix(62, 58);
    const frame = P.mask(); P.mRound(frame, 1, 1, 60, 56, 4);
    P.fill(frame, '#5a2f18', { outline: '#1e0e06', hi: '#8a4a24', lo: '#33190c' });
    P.wood(frame, 41, 0.09);
    const skin = P.mask(); P.mRound(skin, 5, 5, 52, 48, 3);
    P.fill(skin, '#efe2c6', { outline: '#8a6f44', hi: '#fbf3de', lo: '#cbb896' });
    P.grain(skin, 0.03, 7);
    P.ditherTo(skin, '#dccfae', (x, y) => clamp((y - 5) / 48, 0, 1) * 0.5);
    // the bachi-gawa: a patch stuck on where the plectrum lands, every time
    const patch = P.mask(); P.mPoly(patch, [[26, 12], [54, 16], [54, 40], [26, 44]]);
    P.fill(patch, '#d9c49a', { shade: false });
    P.grain(patch, 0.04, 19);
    const edge = P.mask(); P.mPoly(edge, [[26, 12], [54, 16], [54, 40], [26, 44]]);
    const in4 = P.mask(); P.mPoly(in4, [[28, 14], [52, 18], [52, 38], [28, 42]]); P.mSub(edge, in4);
    P.fill(edge, '#b09a6e', { shade: false });
    // the bridge, standing on the skin, and the tailpiece the strings tie to
    const brg = P.mask(); P.mPoly(brg, [[16, 34], [24, 34], [23, 28], [17, 28]]);
    P.fill(brg, '#e0cfa0', { outline: '#6a5428' });
    const tail = P.mask(); P.mRect(tail, 4, 26, 6, 8);
    P.fill(tail, '#2a1c14', { outline: '#0e0806' });
    return P.toCanvas();
  });
}
function bachiSprite() {
  return cached('bachi|plectrum', () => {
    const P = new Pix(40, 30);
    const m = P.mask(); P.mPoly(m, [[0, 12], [16, 8], [39, 0], [39, 29], [16, 21]]);
    P.fill(m, '#f0e6cc', { outline: '#3a2c18', hi: '#ffffff', lo: '#c2b28c' });
    P.grain(m, 0.03, 23);
    const grip = P.mask(); P.mPoly(grip, [[0, 12], [12, 9], [12, 20], [0, 17]]);
    P.fill(grip, '#3a2418', { outline: '#160c06', hi: '#6a4630' });
    return P.toCanvas();
  });
}
// A koto: thirteen strings over movable bridges on a long paulownia board.
function kotoBridgeSprite() {
  return cached('koto|ji', () => {
    const P = new Pix(11, 14);
    const m = P.mask(); P.mPoly(m, [[5, 0], [7, 0], [10, 13], [7, 13], [5, 7], [3, 13], [0, 13]]);
    P.fill(m, '#f2e8d2', { outline: '#4a3c24', hi: '#ffffff', lo: '#c4b696' });
    return P.toCanvas();
  });
}

// The strip the horns and the fiddle play in used to be a flat purple void
// with a few gridlines in it. It is a stage now: a graded back wall, slow
// haze for the beams to show up in, a warm pool where the player stands, and
// a floor that throws a little of it back.
function drawPlayerStrip(ctx, A, R, opts = {}) {
  const top = opts.top, bot = opts.bot, t = R.now || 0;
  const h = bot - top;
  vgrad(ctx, A.x, top - 10, A.w, h * 0.58 + 10, '#2e2154', '#1a1330');
  vgrad(ctx, A.x, top - 10 + h * 0.58, A.w, h * 0.42 + 14, '#171026', '#0c0816');
  // a row of flats behind, catching the edge of the light
  for (let x = A.x; x < A.x + A.w; x += 46) {
    ctx.globalAlpha = 0.14; rect(ctx, x, top - 8, 2, h * 0.5, '#5a4a92');
    ctx.globalAlpha = 0.07; rect(ctx, x + 2, top - 8, 42, h * 0.5, '#463a78'); ctx.globalAlpha = 1;
  }
  // haze bands, drifting, positioned straight off the clock so there is no
  // state to keep and no chance of them freezing when the song does
  for (let i = 0; i < 5; i++) {
    const bw = 200 + i * 60, bx = ((t * (7 + i * 3) + i * 260) % (A.w + bw)) - bw;
    const by = top + h * (0.12 + i * 0.17), bh2 = 24 + i * 7;
    const g = ctx.createLinearGradient(0, by, 0, by + bh2);
    g.addColorStop(0, 'rgba(200,176,255,0)'); g.addColorStop(0.5, 'rgba(200,176,255,0.035)'); g.addColorStop(1, 'rgba(200,176,255,0)');
    ctx.fillStyle = g; ctx.fillRect(A.x + bx, by, bw, bh2);
  }
  // the floor, and the seam where it meets the wall
  rect(ctx, A.x, bot + 2, A.w, 2, '#3a2e60');
  rect(ctx, A.x, bot + 4, A.w, 3, '#1a1228');
  // the pool of light the player stands in
  if (opts.lightX != null) {
    lightPool(ctx, opts.lightX, bot - 6, 110, opts.lightColor || '#ffd08a', 0.16 + (R.beatPulse || 0) * 0.06);
    ctx.globalAlpha = 0.2;
    ellipsePx(ctx, opts.lightX, bot + 3, 54, 9, opts.lightColor || '#ffd08a');
    ctx.globalAlpha = 1;
  }
}
// ---------- The horns, drawn with their sprites ----------
function drawSaxBody(ctx, x, y, breath, playing, t, kind, sc = 1) {
  // The shakuhachi is a stick of bamboo, not a brass instrument, and drawing
  // one as the other was the laziest thing in here.
  const bamboo = kind === 'shakuhachi';
  const c = bamboo ? shakuhachiSprite() : saxSprite();
  const sway = playing ? Math.sin(t * 3.4) * 1.5 : 0;
  const px0 = Math.round(x - c.width / 2 + sway), py0 = Math.round(y - c.height);
  ctx.save();
  if (sc !== 1) { ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y); }
  ctx.save(); ctx.translate(px0 + c.width / 2, py0 + c.height);
  ctx.rotate((bamboo ? -0.14 : 0.06) + sway * 0.006);
  ctx.translate(-c.width / 2, -c.height);
  ctx.globalAlpha = 0.3; ctx.drawImage(c, 3, 4); ctx.globalAlpha = 1;   // its own shadow
  ctx.drawImage(c, 0, 0);
  // fingers working: a key cup or a hole goes dark as it is covered
  if (playing) {
    const n = bamboo ? 5 : 7;
    for (let i = 0; i < n; i++) {
      if ((Math.floor(t * 7) + i * 2) % 3) continue;
      const hy = bamboo ? 36 + i * 13 : 32 + i * 6, hx = bamboo ? 9 : (i % 2 ? 26 : 13);
      ctx.globalAlpha = 0.75; ellipsePx(ctx, hx, hy, 3, 2.4, bamboo ? '#1a1206' : '#fff8d0'); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
  // breath: air leaving the bell, thinning as the lungs empty
  if (playing) {
    const bx = bamboo ? px0 + 9 : px0 + 33, by = bamboo ? py0 + 106 : py0 + 36;
    const heat = 0.35 + breath * 0.55;
    for (let i = 0; i < 5; i++) {
      const k = ((t * 1.6 + i * 0.2) % 1);
      ctx.globalAlpha = (1 - k) * heat * 0.4;
      ellipsePx(ctx, bx + (bamboo ? 0 : k * 26), by - k * (bamboo ? 8 : 22), 4 + k * 13, 3 + k * 9, bamboo ? '#d8e8f0' : '#ffd98a');
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.16 + 0.1 * Math.sin(t * 11);
    ellipsePx(ctx, bx, by, 20, 13, bamboo ? '#a8d8e8' : '#ffc44a');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawTrumpetBody(ctx, x, y, mask, t, sc = 1) {
  const c = trumpetSprite();
  ctx.save(); if (sc !== 1) { ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y); }
  const px0 = Math.round(x - c.width / 2), py0 = Math.round(y - c.height / 2);
  ctx.globalAlpha = 0.3; ctx.drawImage(c, px0 + 3, py0 + 4); ctx.globalAlpha = 1;
  ctx.drawImage(c, px0, py0);
  // the valves themselves ride in their casings and go down when pressed
  for (let v = 0; v < 3; v++) {
    const on = (mask >> v) & 1, vx = px0 + 26 + v * 13, vy = py0 + (on ? 7 : 1);
    rect(ctx, vx - 1, vy, 11, 5, on ? '#fff8d0' : '#efe4c0');
    rect(ctx, vx - 1, vy, 11, 2, '#ffffff');
    rect(ctx, vx - 1, vy + 5, 11, 1, '#8a6a18');
  }
  if (mask) {
    ctx.globalAlpha = 0.2 + 0.12 * Math.sin(t * 13);
    ellipsePx(ctx, px0 + 101, py0 + 23, 16, 22, '#ffd166');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
function drawViolinBody(ctx, x, y, dir, hold, t, sc = 1) {
  const c = violinSprite(), b = bowSprite();
  ctx.save(); if (sc !== 1) { ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y); }
  const px0 = Math.round(x - c.width / 2), py0 = Math.round(y - c.height / 2);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.22); ctx.translate(-x, -y);
  ctx.globalAlpha = 0.3; ctx.drawImage(c, px0 + 3, py0 + 5); ctx.globalAlpha = 1;
  ctx.drawImage(c, px0, py0);
  ctx.restore();
  // the bow, drawn across the strings in whichever direction is being asked
  const stroke = hold ? Math.sin(t * 7) * 9 : 0;
  const by = y + (dir > 0 ? -10 : 14) + (hold ? Math.sin(t * 7) * 1.5 : 0);
  ctx.save(); ctx.translate(x + stroke, by); ctx.rotate(dir > 0 ? -0.06 : 0.06); ctx.translate(-b.width / 2, -b.height / 2);
  ctx.globalAlpha = 0.28; ctx.drawImage(b, 2, 5); ctx.globalAlpha = 1;
  ctx.drawImage(b, 0, 0);
  ctx.restore();
  // rosin dust coming off the strings while a long note is held
  if (hold && Math.random() < 0.5)
    for (let i = 0; i < 2; i++) rect(ctx, x - 6 + Math.random() * 12, by + 4 + Math.random() * 6, 1, 1, '#e8dcc0');
  ctx.restore();
}

// ---------- The shamisen: a fretless neck running up the highway ----------
function drawShamisenNeck(ctx, hw, R, opts = {}) {
  const A = hw.A;
  // The body starts right at the nut and is allowed to run a little past the
  // bottom of the strip: a split-screen stage leaves so little room under the
  // neck that anything stricter shrinks it to a postage stamp.
  const bodyTop = hw.nearY + 2, bh = (A.y + A.h + 10) - bodyTop;
  // the neck, receding: rosewood, dark, and deliberately without a single fret
  ctx.save(); ctx.beginPath();
  ctx.moveTo(hw.cx - hw.nearW / 2 - 10, hw.nearY + 10); ctx.lineTo(hw.cx + hw.nearW / 2 + 10, hw.nearY + 10);
  ctx.lineTo(hw.cx + (hw.nearW / 2 + 10) * P_FAR, hw.farY); ctx.lineTo(hw.cx - (hw.nearW / 2 + 10) * P_FAR, hw.farY); ctx.closePath(); ctx.clip();
  vgrad(ctx, A.x, hw.farY, A.w, hw.nearY + 10 - hw.farY, '#1d1009', '#432412');
  for (let i = 0; i < 22; i++) { const g = (i * 43) % 100 / 100; const x0 = hw.cx + (g - 0.5) * (hw.nearW + 20), x1 = hw.cx + (g - 0.5) * (hw.nearW + 20) * P_FAR; ctx.globalAlpha = 0.14; line(ctx, x0, hw.nearY + 10, x1, hw.farY, i % 2 ? '#6e4020' : '#180c06'); ctx.globalAlpha = 1; }
  ctx.restore();
  // position marks, not frets: a shamisen has none, so the beat is the guide
  const beat = opts.beat || 0.5, now = opts.now || 0, approach = opts.approach || 1.4;
  for (let b = Math.ceil(now / beat); ; b++) {
    const k = (b * beat - now) / approach; if (k > 1) break; if (k < -0.05) continue;
    const p = persp(k), y = perspY(k, hw.nearY, hw.farY), major = b % 4 === 0;
    ctx.globalAlpha = major ? 0.55 : 0.2;
    rect(ctx, hw.cx - (hw.nearW / 2 + 10) * p, y, (hw.nearW + 20) * p, 1, major ? '#e8c98a' : '#8a6e4a');
    ctx.globalAlpha = 1;
    if (major) rect(ctx, hw.cx - 2 * p, y - 1, Math.max(1, 4 * p), 2, '#f0e0b0');
  }
  // three silk strings, thickest first, ringing when struck
  for (let l = 0; l < hw.L; l++) {
    const vib = R.stringVib[l] || 0, thick = 3 - l;
    for (let i = 0; i < 20; i++) {
      const k0 = i / 20, a = hw.pos(l, k0), b2 = hw.pos(l, (i + 1) / 20);
      const w0 = Math.max(1, Math.round(thick * a.p)), amp = vib * 6 * Math.sin(k0 * Math.PI);
      ctx.fillStyle = i % 2 ? '#efe4c0' : '#cfc09a';
      const off = amp * Math.sin(k0 * 15 + (opts.time || 0) * 52);
      ctx.fillRect(Math.round(a.x + off - w0 / 2), Math.round(b2.y), w0, Math.max(1, Math.round(a.y - b2.y)) + 1);
    }
  }
  // the sawari: the notch at the top that makes the low string buzz on purpose
  rect(ctx, hw.cx - hw.nearW / 2 - 12, hw.nearY - 3, hw.nearW + 24, 5, '#2a1a10');
  rect(ctx, hw.cx - hw.nearW / 2 - 12, hw.nearY - 3, hw.nearW + 24, 2, '#6a4a2c');
  // The body sits under the neck, scaled to whatever room the layout leaves —
  // a split-screen stage gives it far less than an open one.
  const s = shamisenSprite();
  const sc = clamp(bh / s.height, 0.5, 1.4);
  const bw2 = Math.round(s.width * sc), bh2 = Math.round(s.height * sc);
  const bx = Math.round(hw.cx - bw2 / 2), byy = Math.round(bodyTop + Math.max(0, (bh - bh2) / 2));
  ctx.globalAlpha = 0.32; ctx.drawImage(s, bx + 4, byy + 5, bw2, bh2); ctx.globalAlpha = 1;
  ctx.drawImage(s, bx, byy, bw2, bh2);
  // the bachi, resting on the skin and kicking up off it on every strike
  const struck = Math.max(0, ...Object.values(R.stringVib || {}));
  const bc = bachiSprite(), cw = Math.round(bc.width * sc), ch = Math.round(bc.height * sc);
  ctx.save();
  ctx.translate(bx + bw2 * 0.76, byy + bh2 * 0.4 + struck * 7 * sc); ctx.rotate(-0.35 + struck * 0.5);
  ctx.drawImage(bc, -cw + Math.round(8 * sc), -ch / 2, cw, ch);
  ctx.restore();
}
// ---------- The koto: five live strings over movable bridges ----------
function drawKotoBoard(ctx, hw, R, opts = {}) {
  const A = hw.A;
  // the board: paulownia, pale and wide, curving away from you
  ctx.save(); ctx.beginPath();
  ctx.moveTo(hw.cx - hw.nearW / 2 - 22, A.y + A.h); ctx.lineTo(hw.cx + hw.nearW / 2 + 22, A.y + A.h);
  ctx.lineTo(hw.cx + (hw.nearW / 2 + 22) * P_FAR, hw.farY); ctx.lineTo(hw.cx - (hw.nearW / 2 + 22) * P_FAR, hw.farY); ctx.closePath(); ctx.clip();
  vgrad(ctx, A.x, hw.farY, A.w, A.y + A.h - hw.farY, '#6a5228', '#c9a765');
  for (let i = 0; i < 30; i++) { const g = (i * 29) % 100 / 100; const x0 = hw.cx + (g - 0.5) * (hw.nearW + 44), x1 = hw.cx + (g - 0.5) * (hw.nearW + 44) * P_FAR; ctx.globalAlpha = 0.12; line(ctx, x0, A.y + A.h, x1, hw.farY, i % 3 ? '#e0c48a' : '#4a3818'); ctx.globalAlpha = 1; }
  ctx.restore();
  // beat lines read as the ribs under the board
  const beat = opts.beat || 0.5, now = opts.now || 0, approach = opts.approach || 1.4;
  for (let b = Math.ceil(now / beat); ; b++) {
    const k = (b * beat - now) / approach; if (k > 1) break; if (k < -0.05) continue;
    const p = persp(k), y = perspY(k, hw.nearY, hw.farY), major = b % 4 === 0;
    ctx.globalAlpha = major ? 0.4 : 0.16;
    rect(ctx, hw.cx - (hw.nearW / 2 + 22) * p, y, (hw.nearW + 44) * p, 1, major ? '#fff0c0' : '#7a5e30');
    ctx.globalAlpha = 1;
  }
  // the strings, waxed silk, and a movable bridge standing under each one
  const ji = kotoBridgeSprite();
  for (let l = 0; l < hw.L; l++) {
    const vib = R.stringVib[l] || 0;
    for (let i = 0; i < 20; i++) {
      const k0 = i / 20, a = hw.pos(l, k0), b2 = hw.pos(l, (i + 1) / 20);
      const w0 = Math.max(1, Math.round(2 * a.p)), amp = vib * 5 * Math.sin(k0 * Math.PI);
      const off = amp * Math.sin(k0 * 13 + (opts.time || 0) * 46);
      ctx.fillStyle = i % 2 ? '#f4ecd4' : '#d8ccae';
      ctx.fillRect(Math.round(a.x + off - w0 / 2), Math.round(b2.y), w0, Math.max(1, Math.round(a.y - b2.y)) + 1);
    }
    // each bridge sits at its own place along the board, as they really do
    const k = 0.18 + ((l * 37) % 100) / 100 * 0.42, pos = hw.pos(l, k), sc = Math.max(0.4, pos.p);
    const w2 = Math.max(3, Math.round(ji.width * sc)), h2 = Math.max(4, Math.round(ji.height * sc));
    ctx.globalAlpha = 0.3; ctx.drawImage(ji, Math.round(pos.x - w2 / 2) + 1, Math.round(pos.y - h2) + 2, w2, h2); ctx.globalAlpha = 1;
    ctx.drawImage(ji, Math.round(pos.x - w2 / 2), Math.round(pos.y - h2), w2, h2);
    if (vib > 0.05) { ctx.globalAlpha = vib * 0.5; ellipsePx(ctx, pos.x, hw.nearY, 9, 4, opts.laneColors[l]); ctx.globalAlpha = 1; }
  }
  // the near edge of the instrument, with the silk cord wrapped round it
  rect(ctx, hw.cx - hw.nearW / 2 - 26, hw.nearY - 2, hw.nearW + 52, 7, '#7a5c2c');
  rect(ctx, hw.cx - hw.nearW / 2 - 26, hw.nearY - 2, hw.nearW + 52, 2, '#c9a765');
  for (let x = hw.cx - hw.nearW / 2 - 24; x < hw.cx + hw.nearW / 2 + 24; x += 7) rect(ctx, x, hw.nearY, 3, 4, '#a8322c');
}

// ---------- A real drum kit drawn into the play area ----------
// Each lane's receptor IS a drum, so hitting a note means hitting that drum.
// Each drum is a cached pixel sprite at its final size, so the kit is always
// drawn 1:1 and never scales into a blurry or oversized mess.
// ---------- The kit ----------
// Every piece is its own pixel sprite, built at final size and drawn 1:1, with
// a real material on it: dented galvanised steel on the bucket, battered
// aluminium on the pot, wrapped ply on a proper shell, hammered brass on the
// cymbals. `surf` is where the playing surface sits inside the sprite and
// `grab` is how far from it a tap still counts, so the whole thing is one
// clickable object rather than a button with a picture on it.
const PIECE_GEO = {
  bucket: { w: 46, h: 56, surf: 10, grab: 25 },
  pot:    { w: 44, h: 38, surf: 9,  grab: 23 },
  crate:  { w: 50, h: 42, surf: 9,  grab: 25 },
  kick:   { w: 78, h: 62, surf: 11, grab: 36 },
  snare:  { w: 56, h: 40, surf: 9,  grab: 27 },
  tom:    { w: 48, h: 38, surf: 8,  grab: 24 },
  hat:    { w: 54, h: 32, surf: 13, grab: 26 },
  crash:  { w: 70, h: 22, surf: 11, grab: 33 },
  ride:   { w: 76, h: 22, surf: 11, grab: 36 },
  floor:  { w: 60, h: 54, surf: 10, grab: 29 },
  pan:    { w: 42, h: 28, surf: 8,  grab: 21 },
};
const KIT_SIZE = PIECE_GEO;   // kept under the old name for anything still asking

// A struck drumhead: cream mylar with a dented rim and a worn patch where the
// stick lands, plus a coat of arms of scratches.
function _head(P, cx, cy, rx, ry, lit, seed) {
  const OLD = '#1d1620';
  const hd = P.mask(); P.mEllipse(hd, cx, cy, rx, ry);
  P.fill(hd, lit ? '#fff8dc' : '#e4dcc8', { outline: OLD, shade: false });
  P.ditherTo(hd, lit ? '#ffefbc' : '#cfc5ae', (x, y) => (y - (cy - ry)) / (ry * 2));
  P.grain(hd, 0.05, seed);
  // the worn spot, just off centre, where a stick actually lands
  const wr = P.mask(); P.mEllipse(wr, cx + rx * 0.12, cy, rx * 0.34, ry * 0.42);
  P.paint(wr, () => lit ? '#fff2c8' : '#e4dbc6');
  P.scuff(hd, seed + 3, 5, 0.08);
  // counter-hoop around the edge
  const rim = P.mask(); P.mEllipse(rim, cx, cy, rx, ry);
  const in2 = P.mask(); P.mEllipse(in2, cx, cy, rx - 3, ry - 2);
  P.mSub(rim, in2); P.fill(rim, '#c2c6d2', { shade: false }); P.metal(rim, seed, 0.12);
  return hd;
}

function pieceSprite(piece, col, lit, chrome) {
  return cached('piece|' + piece + '|' + col + '|' + lit + '|' + !!chrome, () => {
    const OLD = '#1d1620', G = PIECE_GEO[piece] || PIECE_GEO.tom;
    const W2 = G.w, H2 = G.h, P = new Pix(W2, H2);
    const cx = W2 / 2, seed = hashStr(piece) & 255;
    const base = lit ? lighten(col, 0.2) : col;

    switch (piece) {
      // ---- a five-gallon paint bucket, upturned. Dented, paint-flecked.
      case 'bucket': {
        const top = G.surf, bot = H2 - 3;
        const body = P.mask();
        P.mPoly(body, [[cx - 16, top], [cx + 16, top], [cx + 20, bot], [cx - 20, bot]]);
        P.mEllipse(body, cx, bot, 20, 5);
        P.fill(body, base, { outline: OLD, shade: false });
        P.ditherTo(body, darken(base, 0.2), (x, y) => (y - top) / (bot - top) * 0.9);
        P.paint(body, (x) => x < cx - 11 ? lighten(base, 0.22) : x > cx + 12 ? darken(base, 0.2) : null);
        // moulded ribs around the body
        for (const ry2 of [top + 10, top + 20, top + 30, top + 40]) P.paint(body, (x, y) => y === Math.round(ry2) ? darken(base, 0.24) : y === Math.round(ry2) + 1 ? lighten(base, 0.16) : null);
        P.grain(body, 0.06, seed); P.scuff(body, seed, 9, 0.2);
        // splashes of dried paint down one side
        const sp = makeRng(seed + 9);
        for (let i = 0; i < 9; i++) { const x = Math.round(cx + sp.range(-17, 17)), y = Math.round(sp.range(top + 6, bot - 4)); const c2 = sp.pick(['#c8453a', '#3a6ec2', '#e8c23a']); for (let k = 0; k < sp.int(2, 5); k++) P.set(x, y + k, k ? darken(c2, 0.15) : c2); }
        // the base, which is now the top, is what you hit
        _head(P, cx, top, 16, G.surf - 2, lit, seed);
        // wire handle looped over the side
        for (let i = -1; i <= 1; i++) P.set(cx - 18 + i, top + 14, '#8a8a96');
        P.mLine(P.mask(), 0, 0, 0, 0);
        const hl = P.mask(); P.mLine(hl, cx - 19, top + 13, cx - 23, top + 25); P.mLine(hl, cx - 23, top + 25, cx - 20, top + 36);
        P.fill(hl, '#9a9aa6', { outline: OLD, shade: false });
        break;
      }
      // ---- a stock pot flipped over: dull aluminium, one big dent, two lugs
      case 'pot': {
        const top = G.surf, bot = H2 - 3;
        const body = P.mask();
        P.mPoly(body, [[cx - 18, top], [cx + 18, top], [cx + 15, bot], [cx - 15, bot]]);
        P.fill(body, base, { outline: OLD, shade: false });
        P.metal(body, seed, 0.14);
        P.ditherTo(body, darken(base, 0.24), (x, y) => (y - top) / (bot - top));
        P.paint(body, (x) => x < cx - 13 ? lighten(base, 0.26) : x > cx + 10 ? darken(base, 0.22) : null);
        // soot up the sides, because it has been on a stove
        P.ditherTo(body, '#3a3238', (x, y) => clamp((y - top - 11) / 20, 0, 1) * 0.5);
        P.scuff(body, seed, 10, 0.2);
        // a proper dent
        const dn = P.mask(); P.mEllipse(dn, cx + 9, top + 15, 5, 4); P.paint(dn, () => darken(base, 0.3));
        P.paint(dn, (x, y) => y === top + 11 ? lighten(base, 0.2) : null);
        // side lugs where the handles bolt on
        for (const lx of [cx - 18, cx + 16]) { const lg = P.mask(); P.mRect(lg, Math.round(lx), top + 8, 3, 5); P.fill(lg, '#7a7e88', { outline: OLD, shade: false }); }
        _head(P, cx, top, 18, G.surf - 2, lit, seed + 1);
        break;
      }
      // ---- a milk crate on its side: moulded plastic lattice
      case 'crate': {
        const top = G.surf, bot = H2 - 3;
        const body = P.mask(); P.mRound(body, Math.round(cx - 23), top, 46, bot - top, 3);
        P.fill(body, base, { outline: OLD, shade: false });
        P.ditherTo(body, darken(base, 0.22), (x, y) => (y - top) / (bot - top) * 0.8);
        // the lattice: square holes with a lip of shadow under each
        for (let gy = top + 5; gy < bot - 5; gy += 9) for (let gx = Math.round(cx - 19); gx < cx + 16; gx += 9) {
          for (let y = gy; y < gy + 5; y++) for (let x = gx; x < gx + 5; x++) P.set(x, y, y === gy ? darken(base, 0.42) : '#1f1a18');
          for (let x = gx; x < gx + 5; x++) P.set(x, gy + 5, lighten(base, 0.18));
        }
        P.grain(body, 0.05, seed); P.scuff(body, seed, 6, 0.14);
        _head(P, cx, top, 23, G.surf - 2, lit, seed + 2);
        break;
      }
      // ---- cymbals: hammered brass, lathed rings, a bell in the middle
      case 'crash': case 'ride': case 'hat': {
        const ry = G.surf - 2, rx = W2 / 2 - 2;
        const m = P.mask(); P.mEllipse(m, cx, G.surf, rx, ry);
        P.fill(m, chrome ? lighten(base, 0.14) : base, { outline: OLD, shade: false });
        // lathing: concentric grooves turned on a lathe
        for (let r = 8; r < rx; r += 5) P.paint(m, (x, y) => Math.abs(Math.abs(x - cx) - r) < 0.6 ? darken(base, 0.16) : Math.abs(Math.abs(x - cx) - r - 1) < 0.6 ? lighten(base, 0.2) : null);
        // hammer marks
        const hr = makeRng(seed + 5);
        for (let i = 0; i < Math.round(rx * ry * 0.55); i++) { const x = Math.round(cx + hr.range(-rx, rx)), y = Math.round(G.surf + hr.range(-ry, ry)); if (P.get(x, y)) P.set(x, y, hr.chance(0.5) ? lighten(base, 0.24) : darken(base, 0.18)); }
        P.paint(m, (x, y) => y > G.surf + 1 ? darken(base, 0.34) : null);
        P.paint(m, (x, y) => y === G.surf + ry || y === G.surf + ry - 1 ? darken(base, 0.5) : null);
        P.paint(m, (x, y) => y < G.surf - 1 && x > cx - rx * 0.6 && x < cx - rx * 0.1 ? lighten(base, 0.3) : null);
        // the bell
        const b = P.mask(); P.mEllipse(b, cx, G.surf - 1, 6, 2.6);
        P.fill(b, lighten(base, 0.26), { outline: OLD, shade: false });
        P.set(Math.round(cx), Math.round(G.surf - 1), '#6a5a2a');
        if (piece === 'hat') {
          // the bottom cymbal peeking out underneath
          const b2 = P.mask(); P.mEllipse(b2, cx, G.surf + 7, rx - 3, ry - 1);
          P.fill(b2, darken(base, 0.24), { outline: OLD, shade: false });
          P.metal(b2, seed, 0.1);
        }
        break;
      }
      // ---- proper shells: wrapped ply, chrome hoops, lugs, tension rods
      default: {
        const isKick = piece === 'kick', isFloor = piece === 'floor';
        const rx = W2 / 2 - 2, ry = G.surf - 1;
        const headY = G.surf, depth = H2 - headY - 4;
        const sh = P.mask();
        P.mRect(sh, Math.round(cx - rx), headY, Math.round(rx * 2), depth);
        P.mEllipse(sh, cx, headY + depth, rx, ry * 0.7);
        P.fill(sh, base, { outline: OLD, shade: false });
        // a lacquered barrel: light down the left, dark to the right
        P.ditherTo(sh, lighten(base, 0.22), (x) => clamp(1 - (x - (cx - rx)) / (rx * 0.55), 0, 1) * 0.75);
        P.ditherTo(sh, darken(base, 0.32), (x) => clamp((x - cx * 1.0) / (rx * 0.85), 0, 1) * 0.95);
        if (chrome) P.metal(sh, seed, 0.16); else P.wood(sh, seed, 0.07);
        P.grain(sh, 0.04, seed);
        P.scuff(sh, seed, isKick ? 8 : 5, 0.14);
        // hoops top and bottom
        const hoop = P.mask();
        P.mRect(hoop, Math.round(cx - rx), headY - 1, Math.round(rx * 2), 3);
        P.mRect(hoop, Math.round(cx - rx), headY + depth - 4, Math.round(rx * 2), 3);
        P.fill(hoop, chrome ? '#dfe4ee' : '#d9c37a', { outline: OLD, shade: false });
        P.metal(hoop, seed + 1, 0.18);
        // lugs, each with a tension rod above and below
        const lugs = isKick ? 5 : 3;
        for (let i = 0; i < lugs; i++) {
          const lx = Math.round(cx - rx + 5 + i * ((rx * 2 - 13) / (lugs - 1)));
          const lg = P.mask(); P.mRound(lg, lx, headY + Math.round(depth * 0.22), 3, Math.round(depth * 0.56), 1);
          P.fill(lg, '#8f94a4', { outline: OLD, shade: false }); P.metal(lg, seed + i, 0.22);
          P.set(lx + 1, headY + 3, '#d6dae6'); P.set(lx + 1, headY + depth - 6, '#d6dae6');
        }
        // a strip of badge on the kick
        if (isKick) { const bd = P.mask(); P.mRound(bd, Math.round(cx - 10), headY + Math.round(depth * 0.45), 20, 10, 2); P.fill(bd, '#2a2230', { outline: OLD, shade: false }); P.paint(bd, (x, y) => (x + y) % 3 === 0 ? '#c8a94a' : null); }
        if (isFloor) for (const lx of [cx - rx - 1, cx + rx - 1]) { const lg = P.mask(); P.mRect(lg, Math.round(lx), headY + 4, 2, depth + 2); P.fill(lg, '#c0c4d0', { outline: OLD, shade: false }); }
        _head(P, cx, headY, rx, ry, lit, seed);
        // the beater patch on a kick head
        if (isKick) { const pd = P.mask(); P.mEllipse(pd, cx, headY + 1, 9, 3); P.fill(pd, '#2e2a36', { shade: false }); P.grain(pd, 0.1, seed); }
        // snares, stretched under the shell
        if (piece === 'snare') for (let i = 0; i < 8; i++) P.set(Math.round(cx - 11 + i * 3), headY + depth - 1, '#d8dce6');
        break;
      }
    }
    return P.toCanvas();
  });
}

// Lay the kit out the way a drummer sees it: the low pieces in front, the
// cymbals up and out to the sides. Returns a hit target per piece so a tap
// lands on the drum itself and there is no button anywhere.
function kitLayout(pieces, cx, baseY, width, zoom) {
  const n = pieces.length;
  // Where each piece stands, as a fraction of the half-spread, and how high it
  // rides. Laid out the way a kit actually is: kick in front on the floor,
  // snare to the left under your hand, tom mounted above, cymbals up and out.
  const SPOT = {
    kick:  { x:  0.00, y:  16, z: 0 }, bucket: { x: -0.30, y: 14, z: 1 },
    pot:   { x:  0.34, y:  -4, z: 1 }, crate:  { x:  0.02, y: 14, z: 0 },
    snare: { x: -0.46, y:  -2, z: 1 }, tom:    { x:  0.31, y: -26, z: 2 },
    floor: { x:  0.62, y:   8, z: 1 }, hat:    { x: -0.94, y: -34, z: 3 },
    crash: { x:  0.93, y: -44, z: 3 }, ride:   { x:  0.95, y: -32, z: 3 },
    pan:   { x: -0.66, y: -14, z: 2 },
  };
  // `zoom` is a whole number on purpose: the pieces are cached pixel sprites,
  // and drawing one at 2x on a pixelated canvas keeps every edge hard. At 1x
  // the kit is a prop in a scene; at 2x it fills the bottom of the screen and
  // becomes the thing you are looking at — and a target a thumb cannot miss.
  const z = Math.max(1, Math.round(zoom || 1));
  const spread = clamp(width * 0.28, 120, 178) * (z > 1 ? z * 0.92 : 1);
  const out = pieces.map((p, i) => {
    const G0 = PIECE_GEO[p] || PIECE_GEO.tom;
    const G = z === 1 ? G0 : { w: G0.w * z, h: G0.h * z, surf: G0.surf * z, grab: G0.grab * z };
    const s = SPOT[p] || { x: (i / Math.max(1, n - 1) - 0.5) * 1.6, y: 0, z: 1 };
    // Two or three pieces of junk get fanned evenly instead: a bucket and a
    // pot standing in a real kit's footprint would just sit far apart.
    const fx = n <= 3 ? (n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.15) : s.x;
    const fy = n <= 3 ? (i % 2 ? -6 : 10) : s.y;
    return { piece: p, i, G, G0, zoom: z, x: Math.round(cx + fx * spread), y: Math.round(baseY + fy * z), z: s.z };
  });
  // Nudge anything that would sit on top of its neighbour.
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      if (Math.abs(a.y - b.y) > 26 * a.zoom) continue;
      const need = (a.G.w + b.G.w) / 2 - 8 * a.zoom, gap = Math.abs(a.x - b.x);
      if (gap >= need) continue;
      const push = Math.ceil((need - gap) / 2), dir = a.x <= b.x ? -1 : 1;
      a.x += push * dir; b.x -= push * dir;
    }
  }
  out.sort((a, b) => b.z - a.z || a.y - b.y);   // far pieces drawn first
  return out;
}
// Is (px,py) on this piece's playing surface?
function kitHit(spot, px2, py) {
  const dx = (px2 - spot.x) / spot.G.grab, dy = (py - spot.y) / (spot.G.grab * 0.62);
  return dx * dx + dy * dy <= 1;
}
// Draw the kit. `R` supplies flashes and receptors; returns the layout so the
// scene can route pointer taps to the right drum.
function drawDrumKit(ctx, A, R, opts = {}) {
  const pieces = opts.pieces || ['kick', 'snare', 'hat', 'tom', 'crash'];
  const cx = opts.cx != null ? opts.cx : A.x + A.w / 2;
  const baseY = opts.baseY != null ? opts.baseY : A.y + A.h - 70;
  const z = Math.max(1, Math.round(opts.zoom || 1));
  const spots = kitLayout(pieces, cx, baseY, opts.width || A.w, z);
  const chrome = !!opts.chrome;
  // What the kit stands on says as much as the kit does: a busker on a bucket
  // works off flattened cardboard, a working band gets a proper rug.
  const junk = !!opts.junk;
  const noMat = !!opts.noMat;
  const half = Math.max(110 * z, Math.round(Math.max(...spots.map(s => Math.abs(s.x - cx) + s.G.w / 2)) + 22 * z));
  const matTop = baseY + 16 * z, matBot = baseY + (junk ? 46 : 60) * z;
  for (let y = matTop; !noMat && y < matBot; y++) {
    const k = (y - matTop) / (matBot - matTop);
    const hwid = Math.round(half * (0.84 + k * 0.24));
    for (let x = cx - hwid; x < cx + hwid; x += 1) {
      const w2 = ((x * 7 + y * 13) >>> 0) % 11;
      if (junk) rect(ctx, x, y, 1, 1, k > 0.88 ? '#6a4a2c' : (w2 < 2 ? '#a8814e' : w2 > 8 ? '#957141' : '#9c7745'));
      else rect(ctx, x, y, 1, 1, k > 0.9 ? '#2a131f' : (Math.floor(y / 6) % 2 ? (w2 < 3 ? '#432030' : '#3a1c2b') : (w2 > 8 ? '#4c2537' : '#442131')));
    }
  }
  if (noMat) { /* a riser needs no rug */ }
  else if (junk) {
    // creases and a torn corner, so it reads as a broken-down box
    for (const fx of [-0.42, 0.1, 0.55]) { const x = Math.round(cx + half * fx); rect(ctx, x, matTop + 2, 1, matBot - matTop - 4, '#7d5c34'); }
    rect(ctx, cx - half, matTop, half * 2, 1, '#b58c55');
    for (let x = cx - Math.round(half * 0.9); x < cx + half * 0.9; x += 5) rect(ctx, x, matBot, 3, 1, '#5e4126');
  } else {
    for (let x = cx - Math.round(half * 1.08); x < cx + half * 1.08; x += 3) rect(ctx, x, matBot, 2, 3, '#6a3550');
  }
  // each piece, with its stand
  for (const sp of spots) {
    const flash = R.flashes[sp.i] || 0, lit = flash > 0.02;
    const col = PIECE_COLORS[sp.piece] || '#c2c8d6';
    const isCym = sp.piece === 'crash' || sp.piece === 'ride' || sp.piece === 'hat';
    const c = pieceSprite(sp.piece, col, lit, chrome);
    const wob = lit ? Math.round(Math.sin(R.now * 44) * (isCym ? 2 : 0)) : 0;
    const squash = lit && !isCym ? Math.round(flash * 3 * z) : 0;
    // A drum that owes a hit rises through the count before its own and is
    // back down exactly on the count, so the kit itself keeps the time.
    const cue = (opts.cue && opts.cue[sp.i]) || 0;
    const rise = cue > 0.02 ? -Math.round(Math.sin(cue * Math.PI) * 3 * z) : 0;
    // stands: a tube down to the rug with a tripod foot
    if (isCym || sp.piece === 'snare' || sp.piece === 'tom' || sp.piece === 'pot') {
      const legTop = sp.y + sp.G.surf + (isCym ? 2 : sp.G.h - sp.G.surf - 2);
      const legBot = matTop + 10;
      if (legBot > legTop) {
        rect(ctx, sp.x - z, legTop, z * 2 + 1, legBot - legTop, '#6e7280');
        rect(ctx, sp.x - z, legTop, z, legBot - legTop, '#a2a6b4');
        for (const d of [-1, 1]) line(ctx, sp.x, legBot - 2, sp.x + d * 11 * z, legBot + 8 * z, '#5e626e');
        line(ctx, sp.x, legBot - 2, sp.x, legBot + 9 * z, '#5e626e');
      }
    }
    ctx.drawImage(c, Math.round(sp.x - sp.G.w / 2), Math.round(sp.y - sp.G.surf + squash + wob + rise), sp.G.w, sp.G.h);
    // the receptor is the playing surface itself
    R.receptors[sp.i] = { x: sp.x, y: sp.y + squash };
    sp.hx = sp.x; sp.hy = sp.y;
    if (lit) { ctx.globalAlpha = flash * 0.75; ellipsePx(ctx, sp.x, sp.y + squash, sp.G.grab * 0.8, sp.G.grab * 0.36, lighten(col, 0.4)); ctx.globalAlpha = 1; }
  }
  // A spare stick lying on the mat, because you only ever have the one pair.
  const sx = cx - half + 14 * z, sy = matBot - 6 * z;
  if (!noMat)
  { for (let i = 0; i < 22 * z; i++) { const c2 = i > 17 * z ? '#f0e3c4' : i < 3 * z ? '#a8845a' : '#d9c191'; rect(ctx, sx + i, sy - Math.round(i * 0.12), 1, 2 * z, c2); }
    rect(ctx, sx, sy + 2 * z, 22 * z, z, 'rgba(0,0,0,0.25)'); }
  return spots;
}

// ---------- SHEET MUSIC ----------
// For the players who read: a real stave on real paper, scrolling right to
// left past a playhead. No highway, no perspective, no falling gems.
const CLEF_G = [
  '...##...', '..#..#..', '..#..#..', '..#.##..', '.###....', '#..#....',
  '#..#....', '.#.#....', '..###...', '...#....', '...#....', '.#.#....',
  '..#.....',
];
function staveSprite(w, h, seed) {
  return cached('stave|' + w + '|' + h + '|' + seed, () => {
    const P = new Pix(w, h);
    // aged paper with a little fibre and a couple of foxing spots
    const m = P.mask(); P.mRect(m, 0, 0, w, h);
    P.fill(m, '#efe3c2', { shade: false });
    P.ditherTo(m, '#e2d3ad', (x, y) => clamp((y / h) * 0.8 + 0.1, 0, 1) * 0.5);
    P.grain(m, 0.035, seed);
    const r = makeRng(hashStr('paper' + seed));
    for (let i = 0; i < 7; i++) { const sx = r.int(0, w - 4), sy = r.int(0, h - 4); const sp = P.mask(); P.mEllipse(sp, sx, sy, r.range(1, 3), r.range(1, 2.4)); P.paint(sp, () => '#ddc9a0'); }
    // a soft shadow down each long edge, like a page lifting
    P.paint(m, (x, y) => y < 2 ? '#f6ecd2' : y > h - 3 ? '#d4c299' : null);
    return P.toCanvas();
  });
}
// Draw the five-line stave and return the geometry the notes need.
function drawStave(ctx, x, y, w, h, opts = {}) {
  const paper = staveSprite(Math.round(w), Math.round(h), opts.seed || 1);
  ctx.drawImage(paper, Math.round(x), Math.round(y));
  rect(ctx, x, y, w, 1, '#c3ae84'); rect(ctx, x, y + h - 1, w, 1, '#b09b74');
  // Five lines, spaced so the whole stave sits in the middle half of the page
  // and there is room above and below for ledger lines.
  const step = clamp(Math.round(h * 0.062), 5, 10);     // one step = half a space
  const midY = Math.round(y + h * 0.5);
  const lines = [];
  for (let i = -2; i <= 2; i++) { const ly = midY + i * step * 2; lines.push(ly); rect(ctx, x + 4, ly, w - 8, 1, '#4a4038'); }
  // clef, drawn as pixels rather than a glyph, scaled to the stave
  const cs = Math.max(1, Math.round(step * 2 / 3.2));
  const cx0 = Math.round(x + 28), cy0 = Math.round(midY - CLEF_G.length * cs / 2);
  CLEF_G.forEach((row, ry) => { for (let rx = 0; rx < row.length; rx++) if (row[rx] === '#') rect(ctx, cx0 + rx * cs, cy0 + ry * cs, cs, cs, '#33291f'); });
  // time signature
  const tsx = cx0 + 8 * cs + 6;
  drawText(ctx, '4', tsx, midY - step * 2 - 2, '#33291f', { scale: 2 });
  drawText(ctx, '4', tsx, midY + 2, '#33291f', { scale: 2 });
  return { step, midY, lines, top: lines[0], bot: lines[4], left: x, right: x + w, padLeft: tsx + 18 };
}
// Where on the stave does this note sit? Lane 0 is the bottom line.
// Where on the stave does this note sit? Lane 0 sits low, the top lane high,
// spread over the stave plus a ledger line either side.
function stavePos(S, lane, lanes) {
  const spread = Math.max(1, lanes - 1);
  const steps = Math.round((lane / spread) * 10) - 5;   // -5..+5 half-spaces
  return Math.round(S.midY - steps * S.step);
}
// One notehead with its stem, plus ledger lines when it runs off the stave.
function drawNotehead(ctx, S, x, ny, col, opts = {}) {
  x = Math.round(x); ny = Math.round(ny);
  const filled = opts.hold !== true;
  // ledger lines above and below the stave
  for (let ly = S.top - S.step * 2; ly >= ny - 1; ly -= S.step * 2) rect(ctx, x - 7, ly, 15, 1, '#4a4038');
  for (let ly = S.bot + S.step * 2; ly <= ny + 1; ly += S.step * 2) rect(ctx, x - 7, ly, 15, 1, '#4a4038');
  // the head, tipped the way a written note is
  const dark = opts.judged ? '#8a8078' : '#2a2118';
  ellipsePx(ctx, x, ny, 5, 3.4, dark);
  ellipsePx(ctx, x, ny, 4, 2.6, filled ? col : '#f2e8cc');
  if (filled) ellipsePx(ctx, x - 1, ny - 1, 2, 1.2, lighten(col, 0.35));
  // stem: up if the note sits low, down if it sits high, like real notation
  const up = ny > S.midY;
  const sx = up ? x + 4 : x - 5, sy = up ? ny - 3 : ny + 3, len = S.step * 7;
  rect(ctx, sx, up ? sy - len : sy, 1, len, dark);
  if (opts.flag) { const fy = up ? sy - len : sy + len - 5; for (let i = 0; i < 5; i++) rect(ctx, sx + (up ? 1 : 1), fy + (up ? i : -i), Math.max(1, 4 - Math.floor(i / 2)), 1, dark); }
  if (opts.star) { drawText(ctx, '★', x, ny - S.step * 2 - 6, '#d9a520', { align: 'center', outline: '#f2e8cc' }); }
}
