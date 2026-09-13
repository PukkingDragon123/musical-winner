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
function kitLayout(pieces, cx, baseY, width) {
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
  const spread = clamp(width * 0.28, 120, 178);
  const out = pieces.map((p, i) => {
    const G = PIECE_GEO[p] || PIECE_GEO.tom;
    const s = SPOT[p] || { x: (i / Math.max(1, n - 1) - 0.5) * 1.6, y: 0, z: 1 };
    // Two or three pieces of junk get fanned evenly instead: a bucket and a
    // pot standing in a real kit's footprint would just sit far apart.
    const fx = n <= 3 ? (n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.15) : s.x;
    const fy = n <= 3 ? (i % 2 ? -6 : 10) : s.y;
    return { piece: p, i, G, x: Math.round(cx + fx * spread), y: Math.round(baseY + fy), z: s.z };
  });
  // Nudge anything that would sit on top of its neighbour.
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) {
      const a = out[i], b = out[j];
      if (Math.abs(a.y - b.y) > 26) continue;
      const need = (a.G.w + b.G.w) / 2 - 8, gap = Math.abs(a.x - b.x);
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
  const spots = kitLayout(pieces, cx, baseY, opts.width || A.w);
  const chrome = !!opts.chrome;
  // What the kit stands on says as much as the kit does: a busker on a bucket
  // works off flattened cardboard, a working band gets a proper rug.
  const junk = !!opts.junk;
  const noMat = !!opts.noMat;
  const half = Math.max(110, Math.round(Math.max(...spots.map(s => Math.abs(s.x - cx) + s.G.w / 2)) + 22));
  const matTop = baseY + 16, matBot = baseY + (junk ? 46 : 60);
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
    const squash = lit && !isCym ? Math.round(flash * 3) : 0;
    // stands: a tube down to the rug with a tripod foot
    if (isCym || sp.piece === 'snare' || sp.piece === 'tom' || sp.piece === 'pot') {
      const legTop = sp.y + sp.G.surf + (isCym ? 2 : sp.G.h - sp.G.surf - 2);
      const legBot = matTop + 10;
      if (legBot > legTop) {
        rect(ctx, sp.x - 1, legTop, 3, legBot - legTop, '#6e7280');
        rect(ctx, sp.x - 1, legTop, 1, legBot - legTop, '#a2a6b4');
        for (const d of [-1, 1]) line(ctx, sp.x, legBot - 2, sp.x + d * 11, legBot + 8, '#5e626e');
        line(ctx, sp.x, legBot - 2, sp.x, legBot + 9, '#5e626e');
      }
    }
    ctx.drawImage(c, Math.round(sp.x - sp.G.w / 2), Math.round(sp.y - sp.G.surf + squash + wob));
    // the receptor is the playing surface itself
    R.receptors[sp.i] = { x: sp.x, y: sp.y + squash };
    sp.hx = sp.x; sp.hy = sp.y;
    if (lit) { ctx.globalAlpha = flash * 0.75; ellipsePx(ctx, sp.x, sp.y + squash, sp.G.grab * 0.8, sp.G.grab * 0.36, lighten(col, 0.4)); ctx.globalAlpha = 1; }
  }
  // A spare stick lying on the mat, because you only ever have the one pair.
  const sx = cx - half + 14, sy = matBot - 6;
  if (!noMat)
  { for (let i = 0; i < 22; i++) { const c2 = i > 17 ? '#f0e3c4' : i < 3 ? '#a8845a' : '#d9c191'; rect(ctx, sx + i, sy - Math.round(i * 0.12), 1, 2, c2); }
    rect(ctx, sx, sy + 2, 22, 1, 'rgba(0,0,0,0.25)'); }
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
