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
function drawTaikoDrum(ctx, x, y, r, hitDon, hitKa, t) {
  const sq = hitDon > 0 || hitKa > 0 ? 1 + Math.max(hitDon, hitKa) * 0.12 : 1;
  const rr = Math.round(r * sq);
  circle(ctx, x, y + 3, rr + 6, '#2a1a10');
  circle(ctx, x, y, rr + 6, '#6a3a1e'); circle(ctx, x, y, rr + 5, '#8a5228'); circle(ctx, x, y, rr + 3, '#5a3018');
  circle(ctx, x, y, rr, hitDon > 0 ? '#ffd8b0' : hitKa > 0 ? '#d8e8ff' : '#f2e6d0');
  circle(ctx, x, y, rr - 1, hitDon > 0 ? '#ffeede' : hitKa > 0 ? '#eef4ff' : '#f8f0e0');
  ctx.globalAlpha = 0.25; circle(ctx, x - rr / 3, y - rr / 3, Math.round(rr / 2), '#ffffff'); ctx.globalAlpha = 1;
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.3; px(ctx, x + Math.cos(a) * (rr + 4), y + Math.sin(a) * (rr + 4), '#e0b040'); }
  // sticks
  const sw = Math.sin(t * 9) * 3;
  for (const s of [-1, 1]) { const bx = x + s * (rr + 14), by = y + 10 + (s > 0 ? sw : -sw); line(ctx, bx, by + 12, bx - s * 8, by - 6, '#e8d0a0'); line(ctx, bx + 1, by + 12, bx + 1 - s * 8, by - 6, '#c8a870'); }
}
// ---------- SAX / TRUMPET / VIOLIN bodies ----------
function drawSaxBody(ctx, x, y, breath, playing, t) {
  const g = '#e0b040', gd = '#8a6010', gl = '#ffe89a';
  const P = new Pix(1, 1); // draw directly
  // neck + body curve
  for (let i = 0; i < 26; i++) { const yy = y - 54 + i * 2, xx = x + Math.sin(i * 0.12) * 3; rect(ctx, xx, yy, 8, 3, g); rect(ctx, xx, yy, 8, 1, gl); rect(ctx, xx + 6, yy, 2, 3, gd); }
  // bell
  circle(ctx, x + 10, y + 2, 13, gd); circle(ctx, x + 10, y + 2, 12, g); circle(ctx, x + 10, y + 2, 8, '#4a3008'); circle(ctx, x + 11, y + 1, 6, '#2a1a04');
  ctx.globalAlpha = 0.5; circle(ctx, x + 5, y - 4, 4, gl); ctx.globalAlpha = 1;
  // keys light with breath
  for (let i = 0; i < 6; i++) { const yy = y - 48 + i * 7, on = playing && ((Math.floor(t * 8) + i) % 3 === 0); circle(ctx, x + 10, yy, 2, on ? '#fff8d0' : '#c8a030'); }
  // mouthpiece
  rect(ctx, x - 2, y - 60, 6, 8, '#2a2430'); rect(ctx, x - 2, y - 60, 6, 2, '#5a5468');
  if (playing) { ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 12); circle(ctx, x + 10, y + 2, 18, '#ffd166'); ctx.globalAlpha = 1; }
}
function drawTrumpetBody(ctx, x, y, mask, t) {
  const g = '#f0c040', gd = '#8a6a10', gl = '#fff0a0';
  rect(ctx, x - 40, y - 6, 62, 10, g); rect(ctx, x - 40, y - 6, 62, 3, gl); rect(ctx, x - 40, y + 2, 62, 2, gd);
  for (let i = 0; i < 12; i++) { const r2 = 8 + i * 1.6; circle(ctx, x + 22 + i * 1.6, y - 1, r2, i % 2 ? g : gl); }
  circle(ctx, x + 42, y - 1, 20, gd); circle(ctx, x + 41, y - 1, 18, g); circle(ctx, x + 43, y - 1, 14, '#5a4008');
  for (let v = 0; v < 3; v++) { const vx = x - 22 + v * 14, on = (mask >> v) & 1; rect(ctx, vx, y - 20, 8, 16, gd); rect(ctx, vx + 1, y - 19 + (on ? 4 : 0), 6, 14 - (on ? 4 : 0), on ? gl : g); rect(ctx, vx + 1, y - 19 + (on ? 4 : 0), 6, 2, '#fffbe0'); }
  rect(ctx, x - 46, y - 8, 8, 14, '#d8d4c8'); rect(ctx, x - 46, y - 8, 8, 3, '#fff');
}
function drawViolinBody(ctx, x, y, dir, hold, t) {
  const w = '#b05a2a', wl = '#d8834a', wd = '#6a3010';
  circle(ctx, x, y + 14, 15, wd); circle(ctx, x, y + 14, 14, w); circle(ctx, x, y - 10, 12, wd); circle(ctx, x, y - 10, 11, w);
  rect(ctx, x - 10, y - 2, 20, 12, w); rect(ctx, x - 12, y + 2, 24, 4, wd);
  ctx.globalAlpha = 0.35; circle(ctx, x - 5, y + 8, 6, wl); ctx.globalAlpha = 1;
  rect(ctx, x - 2, y - 40, 4, 26, '#3a2010'); rect(ctx, x - 4, y - 46, 8, 8, '#2a1808');
  for (let i = 0; i < 4; i++) rect(ctx, x - 5 + i * 3, y - 38, 1, 48, '#e8e0c8');
  rect(ctx, x - 8, y + 22, 16, 3, '#2a1808');
  // bow
  const by = y + (dir > 0 ? -6 : 10) + Math.sin(t * 10) * (hold ? 2 : 0);
  rect(ctx, x - 46, by, 92, 2, '#6a4020'); rect(ctx, x - 46, by + 2, 92, 1, '#f0e8d0');
  rect(ctx, x + 44, by - 2, 6, 7, '#3a2010');
}

// ---------- A real drum kit drawn into the play area ----------
// Each lane's receptor IS a drum, so hitting a note means hitting that drum.
// Each drum is a cached pixel sprite at its final size, so the kit is always
// drawn 1:1 and never scales into a blurry or oversized mess.
const KIT_SIZE = {
  kick:   { w: 74, h: 58, headH: 18 },
  tom:    { w: 56, h: 44, headH: 15 },
  cymbal: { w: 78, h: 22, headH: 22 },
};
function drumSprite(kind, col, lit) {
  return cached('drum2|' + kind + '|' + col + '|' + lit, () => {
    const OLD = '#1d1620', S = KIT_SIZE[kind] || KIT_SIZE.tom;
    const W2 = S.w, H2 = S.h, rx = W2 / 2 - 1, ry = S.headH / 2;
    const P = new Pix(W2, H2);
    if (kind === 'cymbal') {
      const m = P.mask(); P.mEllipse(m, W2 / 2, H2 / 2, rx, ry - 2);
      P.fill(m, lit ? lighten(col, 0.35) : col, { outline: OLD, shade: false });
      P.paint(m, (x, y) => y > H2 / 2 + 1 ? darken(col, 0.26) : null);
      P.paint(m, (x, y) => y < H2 / 2 - 1 && x > 12 && x < W2 * 0.42 ? lighten(col, 0.3) : null);
      for (let r = 8; r < rx; r += 5) P.paint(m, (x, y) => Math.abs(Math.abs(x - W2 / 2) - r) < 0.6 ? darken(col, 0.15) : null);
      const b = P.mask(); P.mEllipse(b, W2 / 2, H2 / 2 - 1, 6, 2.4); P.fill(b, lighten(col, 0.24), { outline: OLD, shade: false });
      P.set(Math.round(W2 / 2), Math.round(H2 / 2 - 1), '#6a5a2a');
      return P.toCanvas();
    }
    const headY = ry + 1, depth = H2 - headY - 3;
    // shell, with a rounded bottom
    const sh = P.mask();
    P.mRect(sh, 1, headY, W2 - 2, depth);
    P.mEllipse(sh, W2 / 2, headY + depth, rx, ry * 0.72);
    P.fill(sh, lit ? lighten(col, 0.18) : col, { outline: OLD, shade: false });
    P.paint(sh, (x, y) => x < 5 ? lighten(col, 0.26) : x > W2 - 7 ? darken(col, 0.22) : null);
    P.paint(sh, (x, y) => y > headY + depth - 4 ? darken(col, 0.3) : null);
    // hoops top and bottom, and vertical lugs between them
    const hoop = P.mask(); P.mRect(hoop, 1, headY - 1, W2 - 2, 3); P.mRect(hoop, 1, headY + depth - 4, W2 - 2, 3);
    P.fill(hoop, '#d9c37a', { outline: OLD, shade: false });
    const lugs = kind === 'kick' ? 5 : 4;
    for (let i = 0; i < lugs; i++) { const lx = Math.round(7 + i * ((W2 - 16) / (lugs - 1))); const lg = P.mask(); P.mRect(lg, lx, headY + 3, 3, depth - 8); P.fill(lg, '#b9bcc8', { outline: OLD, shade: false }); }
    // head on top: this is the surface the note lands on
    const hd = P.mask(); P.mEllipse(hd, W2 / 2, headY, rx, ry);
    P.fill(hd, lit ? '#fffbe8' : '#efe9da', { outline: OLD, shade: false });
    P.paint(hd, (x, y) => y < headY - 2 ? '#fdf8ec' : y > headY + 2 ? '#dcd4c0' : null);
    const rim = P.mask(); P.mEllipse(rim, W2 / 2, headY, rx, ry);
    const in2 = P.mask(); P.mEllipse(in2, W2 / 2, headY, rx - 3, ry - 2);
    P.mSub(rim, in2); P.fill(rim, '#c8ccd8', { shade: false });
    if (kind === 'kick') { const pd = P.mask(); P.mEllipse(pd, W2 / 2, headY + 1, 8, 3); P.fill(pd, '#2e2a36', { shade: false }); }
    return P.toCanvas();
  });
}
// A real drum kit stood at the near end of the highway. Every head sits on
// the receptor line, so hitting the note is hitting that drum.
function drawDrumKit(ctx, hw, R, opts) {
  const L = hw.L || 4;
  const names = (opts.padNames && opts.padNames.length === L) ? opts.padNames : ['KICK', 'TOM', 'SNARE', 'CRASH'].slice(0, L);
  const palette = opts.colors || ['#e0563f', '#e8a33a', '#c2c8d6', '#f2cf4a'];
  const cols = []; for (let i = 0; i < L; i++) cols.push(palette[Math.round(i * (palette.length - 1) / Math.max(1, L - 1))]);
  const baseY = Math.round(hw.nearY);
  // the rug, wide enough to hold the whole kit
  const first = hw.pos(0, 0).x, last = hw.pos(L - 1, 0).x;
  const rugHalf = Math.max(100, Math.round((last - first) / 2 + 62));
  const rugTop = baseY + 8, rugBot = baseY + 58;
  for (let y = rugTop; y < rugBot; y++) {
    const k = (y - rugTop) / (rugBot - rugTop);
    const hwid = Math.round(rugHalf * (0.86 + k * 0.2));
    rect(ctx, hw.cx - hwid, y, hwid * 2, 1, k > 0.9 ? '#2e1521' : (Math.floor(y / 7) % 2 ? '#3a1c2b' : '#442131'));
  }
  rect(ctx, hw.cx - Math.round(rugHalf * 1.06), rugBot - 3, Math.round(rugHalf * 2.12), 3, '#5e2c44');
  for (let l = 0; l < L; l++) {
    const p = hw.pos(l, 0), cx = Math.round(p.x);
    const flash = R.flashes[l] || 0, lit = flash > 0.02;
    R.receptors[l] = { x: cx, y: baseY };
    const isCymbal = names[l] === 'CRASH' || (L > 1 && l === L - 1 && names[l] !== 'KICK');
    const kind = isCymbal ? 'cymbal' : names[l] === 'KICK' ? 'kick' : 'tom';
    const S = KIT_SIZE[kind], c = drumSprite(kind, cols[l], lit);
    if (isCymbal) {
      const tilt = lit ? Math.round(Math.sin(R.now * 40) * 2) : 0;
      rect(ctx, cx - 1, baseY, 2, 52, '#8a8a98'); rect(ctx, cx - 1, baseY, 1, 52, '#b0b0be');
      rect(ctx, cx - 10, baseY + 50, 20, 3, '#6a6a78');
      ctx.drawImage(c, cx - S.w / 2, baseY - S.h / 2 + tilt);
      if (lit) { ctx.globalAlpha = flash * 0.5; ellipsePx(ctx, cx, baseY + tilt, S.w * 0.5, 5, '#fff6c0'); ctx.globalAlpha = 1; }
    } else {
      // the head is at headH/2 down the sprite; put that on the receptor line
      const squash = lit ? Math.round(flash * 3) : 0;
      ctx.drawImage(c, cx - S.w / 2, baseY - Math.round(S.headH / 2) + 1 + squash);
      if (lit) { ctx.globalAlpha = flash * 0.7; ellipsePx(ctx, cx, baseY + squash, S.w * 0.44, 4, '#fff6c0'); ctx.globalAlpha = 1; }
    }
    // name plate, clear of the shell
    const nw = textWidth(names[l], { font: 'small' }) + 8;
    const ny = baseY + (isCymbal ? 34 : S.h - Math.round(S.headH / 2) + 4);
    rect(ctx, cx - nw / 2, ny, nw, 9, lit ? '#5a4a20' : '#231c30');
    rect(ctx, cx - nw / 2, ny, nw, 1, lit ? '#8a7430' : '#3a3048');
    drawText(ctx, names[l], cx, ny + 2, lit ? '#fff6c0' : '#cfc6e4', { align: 'center', font: 'small' });
  }
}
