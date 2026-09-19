// ---------- Side-view art kit ----------
// Everything a side-scrolling scene needs to look like a place: floors,
// glass, shopfronts with real logos on them, neon, escalators, crowds,
// parallax. Scenes add their own one-offs; everything shared lives here.
'use strict';

// ---------- floors ----------
function sideFloor(ctx, x0, x1, y, opts = {}) {
  const h = opts.h || 420, a = opts.col || '#3a3f4c', b = opts.col2 || darken(opts.col || '#3a3f4c', 0.12);
  rect(ctx, x0, y, x1 - x0, h, a);
  rect(ctx, x0, y, x1 - x0, 3, opts.lip || lighten(a, 0.3));
  const step = opts.tile || 48;
  for (let x = Math.floor(x0 / step) * step; x < x1; x += step) {
    rect(ctx, x, y + 3, step / 2, 10, b);
    ctx.globalAlpha = 0.16; rect(ctx, x, y + 3, 1, h - 3, '#000'); ctx.globalAlpha = 1;
  }
  // a wet-looking sheen, because polished floors are what airports are
  if (opts.shine !== false) { ctx.globalAlpha = 0.07; rect(ctx, x0, y + 4, x1 - x0, 16, '#ffffff'); ctx.globalAlpha = 1; }
  if (opts.grout) for (let x = Math.floor(x0 / step) * step; x < x1; x += step) { ctx.globalAlpha = 0.1; rect(ctx, x, y, step, 1, '#fff'); ctx.globalAlpha = 1; }
}
// a reflection of whatever is standing on it, cheap and convincing
function sideSheen(ctx, x0, x1, y, alpha = 0.1) {
  ctx.globalAlpha = alpha;
  for (let i = 0; i < 4; i++) rect(ctx, x0, y + 6 + i * 7, x1 - x0, 2, '#ffffff');
  ctx.globalAlpha = 1;
}

// ---------- glass, the material every terminal is made of ----------
function glassWall(ctx, x, y, w, h, t, opts = {}) {
  const tintc = opts.tint || '#2f4a68';
  rect(ctx, x, y, w, h, tintc);
  ctx.globalAlpha = 0.35; vgrad(ctx, x, y, w, h, opts.top || '#8fc0e4', opts.bot || '#1b2a3e'); ctx.globalAlpha = 1;
  const m = opts.mullion || 60;
  for (let i = 0; i <= w; i += m) rect(ctx, x + i, y, 3, h, '#6a7280');
  for (let i = 0; i <= h; i += opts.rail || 80) rect(ctx, x, y + i, w, 3, '#6a7280');
  // the diagonal flare across it
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < w + h; i += 64) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + 18, y + h); ctx.lineTo(x + i + 18 + h, y); ctx.lineTo(x + i + h, y); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = 1;
}

// ---------- brands ----------
// A brand is a name, two colours and a mark. Every shop in the game is one of
// these, so a shopfront, a cup, a bag and a sign all agree with each other.
function brandLogo(ctx, cx, cy, s, b, t) {
  const c1 = b.col || '#0b6b4a', c2 = b.col2 || '#f4f1ea';
  const R = Math.round(s);
  switch (b.logo) {
    case 'ring':        // a coffee roundel with a bug in the middle
      circle(ctx, cx, cy, R, c1); circle(ctx, cx, cy, R - 2, c2); circle(ctx, cx, cy, R - 5, c1);
      ellipsePx(ctx, cx, cy + 1, R * 0.42, R * 0.5, c2);
      ellipsePx(ctx, cx, cy - R * 0.28, R * 0.28, R * 0.26, c2);
      rect(ctx, cx - Math.round(R * 0.16), cy - Math.round(R * 0.36), 2, 3, c1); rect(ctx, cx + Math.round(R * 0.1), cy - Math.round(R * 0.36), 2, 3, c1);
      for (let i = -1; i <= 1; i += 2) line(ctx, cx + i * R * 0.2, cy - R * 0.5, cx + i * R * 0.45, cy - R * 0.85, c2);
      break;
    case 'crown':       // a burger place that thinks a lot of itself
      rect(ctx, cx - R, cy - R * 0.4, R * 2, R * 0.8, c1);
      rect(ctx, cx - R + 2, cy - R * 0.28, R * 2 - 4, R * 0.56, c2);
      ctx.fillStyle = '#f2c94c'; ctx.beginPath();
      ctx.moveTo(cx - R * 0.8, cy - R * 0.5); ctx.lineTo(cx - R * 0.5, cy - R); ctx.lineTo(cx - R * 0.2, cy - R * 0.55);
      ctx.lineTo(cx + R * 0.1, cy - R); ctx.lineTo(cx + R * 0.4, cy - R * 0.55); ctx.lineTo(cx + R * 0.7, cy - R); ctx.lineTo(cx + R * 0.8, cy - R * 0.4); ctx.lineTo(cx - R * 0.8, cy - R * 0.4); ctx.fill();
      break;
    case 'pretzel':     // a twist, in a hot orange
      ringPx(ctx, cx - R * 0.35, cy, R * 0.45, c1); ringPx(ctx, cx + R * 0.35, cy, R * 0.45, c1);
      ringPx(ctx, cx - R * 0.35, cy, R * 0.45 - 1, c1); ringPx(ctx, cx + R * 0.35, cy, R * 0.45 - 1, c1);
      rect(ctx, cx - R * 0.1, cy - R * 0.7, R * 0.2, R * 0.6, c1);
      break;
    case 'leaf':
      ellipsePx(ctx, cx, cy, R * 0.75, R, c1); ellipsePx(ctx, cx - 1, cy - 1, R * 0.5, R * 0.7, c2); rect(ctx, cx - 1, cy - R, 2, R * 2, c1);
      break;
    case 'store':       // a convenience store's three-stripe awning mark
      rect(ctx, cx - R, cy - R * 0.7, R * 2, R * 0.46, '#2f8f4a');
      rect(ctx, cx - R, cy - R * 0.24, R * 2, R * 0.46, '#e8503a');
      rect(ctx, cx - R, cy + R * 0.22, R * 2, R * 0.46, '#2f6fc0');
      break;
    case 'bolt': ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(cx + R * 0.4, cy - R); ctx.lineTo(cx - R * 0.5, cy + R * 0.12); ctx.lineTo(cx, cy + R * 0.12); ctx.lineTo(cx - R * 0.35, cy + R); ctx.lineTo(cx + R * 0.6, cy - R * 0.2); ctx.lineTo(cx + R * 0.05, cy - R * 0.2); ctx.fill(); break;
    case 'star': ctx.fillStyle = c1; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.fill(); break;
    case 'bag': rect(ctx, cx - R * 0.7, cy - R * 0.4, R * 1.4, R * 1.3, c1); rect(ctx, cx - R * 0.7, cy - R * 0.4, R * 1.4, 3, c2); ringPx(ctx, cx, cy - R * 0.5, R * 0.45, c1); break;
    case 'bottle': rect(ctx, cx - R * 0.35, cy - R * 0.4, R * 0.7, R * 1.3, c1); rect(ctx, cx - R * 0.18, cy - R, R * 0.36, R * 0.62, c1); rect(ctx, cx - R * 0.3, cy - R * 0.1, R * 0.6, R * 0.4, c2); break;
    case 'watch': ringPx(ctx, cx, cy, R * 0.8, c1); ringPx(ctx, cx, cy, R * 0.78, c1); rect(ctx, cx - 1, cy - R * 0.5, 2, R * 0.5, c1); rect(ctx, cx, cy - 1, R * 0.4, 2, c1); rect(ctx, cx - R * 0.22, cy - R, R * 0.44, R * 0.24, c1); break;
    case 'book': rect(ctx, cx - R, cy - R * 0.75, R * 0.95, R * 1.5, c1); rect(ctx, cx + 0.05 * R, cy - R * 0.75, R * 0.95, R * 1.5, darken(c1, 0.2)); rect(ctx, cx - 1, cy - R * 0.75, 2, R * 1.5, c2); break;
    case 'pill': ellipsePx(ctx, cx, cy, R, R * 0.55, c2); ctx.save(); ctx.beginPath(); ctx.rect(cx - R, cy - R, R, R * 2); ctx.clip(); ellipsePx(ctx, cx, cy, R, R * 0.55, c1); ctx.restore(); break;
    case 'plane': ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 0.2); ctx.lineTo(cx + R * 0.3, cy - R * 0.25); ctx.lineTo(cx + R, cy - R * 0.1); ctx.lineTo(cx + R * 0.3, cy + R * 0.3); ctx.lineTo(cx - R * 0.2, cy + R * 0.8); ctx.fill(); break;
    default: {          // a wordmark tile: the first letter, big, in a box
      rect(ctx, cx - R, cy - R, R * 2, R * 2, c1);
      rect(ctx, cx - R, cy - R, R * 2, 3, lighten(c1, 0.3));
      drawText(ctx, (b.name || '?')[0], cx, cy - Math.round(R * 0.55), c2, { align: 'center', scale: Math.max(2, Math.round(R / 4)) });
    }
  }
}
// The sign board over a shop: brand colour, the mark, the name, and the
// little tagline nobody reads.
function brandBoard(ctx, x, y, w, h, b, t, opts = {}) {
  const c1 = b.col || '#2f4a68', c2 = b.col2 || '#f4f1ea';
  rect(ctx, x, y, w, h, darken(c1, 0.35));
  rect(ctx, x + 2, y + 2, w - 4, h - 4, c1);
  rect(ctx, x + 2, y + 2, w - 4, 2, lighten(c1, 0.35));
  // lit from under, the way every shop sign is
  ctx.globalAlpha = 0.16 + 0.05 * Math.sin(t * 2 + x); rect(ctx, x, y + h, w, 8, c2); ctx.globalAlpha = 1;
  const ls = Math.min(h * 0.34, 15);
  brandLogo(ctx, x + 6 + ls, y + h / 2, ls, b, t);
  const sc = h > 34 ? 3 : 2;
  drawText(ctx, b.name, x + 12 + ls * 2, y + Math.round(h / 2) - (b.tag ? 10 : 4) * (sc / 2), c2, { scale: sc });
  if (b.tag && h > 30) drawText(ctx, b.tag, x + 12 + ls * 2, y + Math.round(h / 2) + 5, withAlpha(c2, 0.7), { font: 'small' });
}
// A whole shopfront: board, glass, what is inside it, and somebody working.
function sideShopFront(ctx, x, yBase, w, h, b, t, S) {
  const c1 = b.col || '#2f4a68', c2 = b.col2 || '#f4f1ea';
  const top = yBase - h;
  rect(ctx, x, top, w, h, '#20242e');
  rect(ctx, x + 3, top + 3, w - 6, h - 6, '#161a22');
  // the lit interior, seen through the glass
  const inH = h - 46;
  rect(ctx, x + 6, top + 40, w - 12, inH, b.inner || '#3a3446');
  ctx.globalAlpha = 0.2; vgrad(ctx, x + 6, top + 40, w - 12, inH, c2, '#000'); ctx.globalAlpha = 1;
  // shelves and stock
  const rows = Math.max(1, Math.floor((inH - 26) / 22));
  for (let r = 0; r < rows; r++) {
    const ry = top + 48 + r * 22;
    rect(ctx, x + 12, ry + 15, w - 24, 3, '#6a5f78');
    const n = Math.max(2, Math.floor((w - 30) / 13));
    for (let i = 0; i < n; i++) {
      const px2 = x + 15 + i * 13, hh = 8 + ((i * 7 + r * 5) % 6);
      rect(ctx, px2, ry + 15 - hh, 9, hh, [c1, c2, '#f2c94c', '#e8503a', '#6be585', '#8ad8ff'][(i + r) % 6]);
      ctx.globalAlpha = 0.3; rect(ctx, px2, ry + 15 - hh, 9, 2, '#fff'); ctx.globalAlpha = 1;
    }
  }
  // the counter and whoever is behind it
  rect(ctx, x + 8, yBase - 30, w - 16, 26, darken(c1, 0.2));
  rect(ctx, x + 8, yBase - 30, w - 16, 3, lighten(c1, 0.2));
  if (b.staff !== false && w > 90) {
    const sp = cachedBrandStaff(b);
    drawBugAt(ctx, sp, x + w * 0.72, yBase - 26, { pose: Math.floor(t * 1.4 + x) % 2 ? 'idle' : 'talk', scale: 1.15, bounce: 0.4, phase: x * 0.01 });
  }
  // the glass over all of it
  ctx.globalAlpha = 0.16; rect(ctx, x + 6, top + 40, w - 12, inH, '#bfe0ff'); ctx.globalAlpha = 1;
  for (let i = 30; i < w; i += 54) { ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + i, yBase - 6); ctx.lineTo(x + i + 12, yBase - 6); ctx.lineTo(x + i + 12 + inH * 0.5, top + 40); ctx.lineTo(x + i + inH * 0.5, top + 40); ctx.fill(); ctx.globalAlpha = 1; }
  rect(ctx, x + 6, top + 40, w - 12, 2, '#8a939e'); rect(ctx, x + 6, yBase - 6, w - 12, 3, '#8a939e');
  // the board
  brandBoard(ctx, x + 2, top + 4, w - 4, 34, b, t);
  // the doorway, dark, in the middle
  const dw = Math.min(54, w * 0.3), dx = x + w / 2 - dw / 2;
  rect(ctx, dx, yBase - 62, dw, 62, '#0d0f16');
  rect(ctx, dx, yBase - 62, dw, 3, '#4a4a58');
  ctx.globalAlpha = 0.25; rect(ctx, dx + 2, yBase - 58, dw - 4, 54, c2); ctx.globalAlpha = 1;
  // a welcome mat, and the open sign
  rect(ctx, dx - 6, yBase - 3, dw + 12, 3, darken(c1, 0.3));
  rect(ctx, x + 10, yBase - 56, 22, 12, '#12101c');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + x * 0.02);
  drawText(ctx, 'OPEN', x + 12, yBase - 53, '#6be585', { font: 'small' });
  ctx.globalAlpha = 1;
}
const _brandStaff = {};
function cachedBrandStaff(b) {
  const k = b.name || 'x';
  if (!_brandStaff[k]) { const s = randomBugSpec(makeRng(hashStr(k + 'staff'))); s.name = k; _brandStaff[k] = s; }
  return _brandStaff[k];
}

// ---------- neon ----------
function neonSign(ctx, x, y, text, col, t, opts = {}) {
  const sc = opts.scale || 4, w = textWidth(text, { scale: sc });
  const flick = opts.flicker ? (Math.sin(t * 31 + x) > -0.9 ? 1 : 0.3) : 1;
  const pulse = (0.72 + 0.28 * Math.sin(t * 2.2 + x * 0.01)) * flick;
  if (opts.box !== false) { rect(ctx, x - 8, y - 6, w + 16, sc * 7 + 12, '#0d0b14'); frame(ctx, x - 8, y - 6, w + 16, sc * 7 + 12, darken(col, 0.4)); }
  ctx.globalAlpha = 0.16 * pulse;
  for (let r = 7; r > 0; r -= 2) drawText(ctx, text, x, y, col, { scale: sc });
  ctx.globalAlpha = 1;
  drawText(ctx, text, x, y, col, { scale: sc, outline: darken(col, 0.5) });
  ctx.globalAlpha = pulse;
  drawText(ctx, text, x, y - 1, lighten(col, 0.42), { scale: sc });
  ctx.globalAlpha = 1;
}
// a vertical strip of characters you cannot read, lit up
function neonStrip(ctx, x, y, w, h, col, t, seed) {
  rect(ctx, x, y, w, h, '#0d0b14'); frame(ctx, x, y, w, h, darken(col, 0.4));
  const r = makeRng(seed || 7);
  const n = Math.max(1, Math.floor(h / (w + 4)));
  for (let i = 0; i < n; i++) {
    const cy = y + 4 + i * (w + 2);
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + i + (seed || 0));
    drawKanaBlock(ctx, x + 3, cy, w - 6, col, r.int(0, 5));
    ctx.globalAlpha = 1;
  }
}
function drawKanaBlock(ctx, x, y, s, col, kind) {
  const u = Math.max(1, Math.round(s / 6));
  switch (kind % 6) {
    case 0: rect(ctx, x, y + s * 0.2, s, u, col); rect(ctx, x + s * 0.4, y, u, s, col); break;
    case 1: rect(ctx, x, y, s, u, col); rect(ctx, x, y + s * 0.45, s, u, col); rect(ctx, x + s * 0.3, y, u, s, col); break;
    case 2: rect(ctx, x + s * 0.4, y, u, s * 0.8, col); rect(ctx, x, y + s * 0.6, s, u, col); rect(ctx, x, y + s * 0.15, s * 0.5, u, col); break;
    case 3: rect(ctx, x, y + s * 0.1, s, u, col); rect(ctx, x + s * 0.15, y + s * 0.4, u, s * 0.5, col); rect(ctx, x + s * 0.65, y + s * 0.4, u, s * 0.5, col); break;
    case 4: rect(ctx, x, y, u, s, col); rect(ctx, x + s - u, y, u, s, col); rect(ctx, x, y + s * 0.45, s, u, col); break;
    default: rect(ctx, x + s * 0.1, y + s * 0.15, s * 0.8, u, col); rect(ctx, x + s * 0.45, y, u, s, col); rect(ctx, x + s * 0.1, y + s * 0.7, s * 0.8, u, col);
  }
}

// ---------- parallax ----------
function sideParallax(ctx, cam, par, draw) {
  ctx.save();
  ctx.translate(Math.round(-cam.x * par), 0);
  draw(ctx, cam.x * par);
  ctx.restore();
}

// ---------- background crowd ----------
function makeSideCrowd(n, seed, opts = {}) {
  const r = makeRng(seed >>> 0), out = [];
  for (let i = 0; i < n; i++) out.push({
    spec: randomBugSpec(makeRng((seed >>> 0) + i * 2654435761)),
    x: r.range(opts.x0 || 0, opts.x1 || 2000),
    floor: opts.floors ? r.int(0, opts.floors - 1) : 0,
    sp: r.range(14, 34) * (r.chance(0.5) ? 1 : -1),
    sc: r.range(opts.min || 0.9, opts.max || 1.4),
    o: r.range(0, 6.3),
    carry: r.chance(0.5) ? r.pick(['bag', 'case', 'suitcase', 'coffee', 'phone', null]) : null,
    dim: r.range(0.12, 0.4),
  });
  return out;
}
function drawSideCrowd(ctx, S, crowd, t, opts = {}) {
  const x0 = opts.x0 || 0, x1 = opts.x1 != null ? opts.x1 : (S.D.w || 2400);
  for (const c of crowd) {
    let x = c.x + t * c.sp;
    const span = x1 - x0;
    x = x0 + ((x - x0) % span + span) % span;
    if (!S.cam.visible(x, 90)) continue;
    const y = opts.y != null ? opts.y : S.floorY(c.floor);
    drawShadow(ctx, x, y + 2, 20 * c.sc, 0.2);
    drawBugAt(ctx, c.spec, x, y + 2, { pose: Math.floor(t * 6 + c.o) % 2 ? 'walk1' : 'walk2', scale: c.sc, flip: c.sp < 0, bounce: 0.7, phase: c.o });
    if (c.carry) drawSideCarry(ctx, c.carry, x, y, c.sp > 0 ? 1 : -1, c.sc, t);
    if (opts.dim) { ctx.globalAlpha = c.dim * opts.dim; rect(ctx, x - 20 * c.sc, y - 52 * c.sc, 40 * c.sc, 54 * c.sc, '#0a0814'); ctx.globalAlpha = 1; }
  }
}

// ---------- the shared prop library ----------
// A scene can always paint its own; these are the ones every place needs.
function drawSideProp(ctx, p, t, S) {
  const x = Math.round(p.x - p.w / 2), w = Math.round(p.w), h = Math.round(p.h || 40);
  const base = Math.round(S ? S.propY(p) : (p.y || 430));
  const y = base - h;
  const sh = () => { ctx.globalAlpha = 0.28; ellipsePx(ctx, p.x, base + 1, w * 0.5, 5, '#000'); ctx.globalAlpha = 1; };
  switch (p.kind) {
    case 'door': {
      rect(ctx, x, y, w, h, p.col || '#3a2f4a');
      rect(ctx, x + 3, y + 3, w - 6, h - 6, '#12101c');
      ctx.globalAlpha = 0.3 + 0.1 * Math.sin(t * 2); rect(ctx, x + 4, y + 4, w - 8, h - 8, p.glow || '#ffd88a'); ctx.globalAlpha = 1;
      rect(ctx, x, y, w, 4, lighten(p.col || '#3a2f4a', 0.3));
      if (p.text) { rect(ctx, x - 4, y - 20, w + 8, 18, '#12101c'); frame(ctx, x - 4, y - 20, w + 8, 18, p.glow || '#c8a03a'); drawText(ctx, p.text, p.x, y - 16, p.glow || '#ffd24a', { align: 'center', scale: 2 }); }
      break;
    }
    case 'sign': {
      rect(ctx, x, y, w, h, p.col || '#1f6f4a');
      rect(ctx, x, y, w, 2, lighten(p.col || '#1f6f4a', 0.3));
      frame(ctx, x, y, w, h, '#0d1018');
      if (p.text) drawText(ctx, p.text, p.x, y + h / 2 - 7, '#f4f1ea', { align: 'center', scale: p.scale || 2 });
      if (p.arrow) { ctx.fillStyle = '#f4f1ea'; const ax = p.arrow > 0 ? x + w - 12 : x + 12, d = Math.sign(p.arrow); ctx.beginPath(); ctx.moveTo(ax + d * 6, y + h / 2); ctx.lineTo(ax - d * 4, y + h / 2 - 6); ctx.lineTo(ax - d * 4, y + h / 2 + 6); ctx.fill(); }
      break;
    }
    case 'bench': sh(); rect(ctx, x, y, w, h * 0.5, '#2f4a68'); rect(ctx, x, y, w, 3, '#4a6f96'); for (let i = 0; i < w; i += 18) rect(ctx, x + i, y + 2, 1, h * 0.5 - 4, '#24384f'); rect(ctx, x + 4, y + h * 0.5, 5, h * 0.5, '#3a3f4a'); rect(ctx, x + w - 9, y + h * 0.5, 5, h * 0.5, '#3a3f4a'); break;
    case 'bin': sh(); rect(ctx, x, y, w, h, '#4a5260'); rect(ctx, x - 2, y, w + 4, 5, '#6a7280'); rect(ctx, x + 3, y + 8, w - 6, h - 11, '#3a4250'); break;
    case 'plant': sh(); rect(ctx, x + 2, base - 14, w - 4, 14, '#8a5f3a'); rect(ctx, x + 2, base - 14, w - 4, 3, '#a87a50'); for (let i = 0; i < 9; i++) { const a = i * 0.7; ellipsePx(ctx, p.x + Math.cos(a) * w * 0.4, base - 20 - Math.abs(Math.sin(a)) * h * 0.5, 8, 5, i % 2 ? '#2f8f4a' : '#43a85c'); } break;
    case 'pillar': rect(ctx, x, y, w, h, '#b9bec6'); rect(ctx, x, y, 4, h, '#dfe4ea'); rect(ctx, x + w - 4, y, 4, h, '#8a8f98'); rect(ctx, x - 3, y, w + 6, 6, '#cfd6de'); rect(ctx, x - 3, base - 8, w + 6, 8, '#a0a6ae'); break;
    case 'barrier': for (let i = 0; i < w; i += 40) { rect(ctx, x + i, base - 34, 4, 34, '#8a8f98'); ellipsePx(ctx, x + i + 2, base - 36, 5, 4, '#3a3f4a'); } rect(ctx, x, base - 30, w, 3, '#2f4a68'); break;
    case 'poster': rect(ctx, x, y, w, h, '#f4f1ea'); frame(ctx, x, y, w, h, '#8a8478'); rect(ctx, x + 3, y + 3, w - 6, h * 0.55, p.col || '#e8503a'); ctx.globalAlpha = 0.4; ellipsePx(ctx, p.x, y + h * 0.3, w * 0.24, h * 0.16, '#fff'); ctx.globalAlpha = 1; for (let i = 0; i < 3; i++) rect(ctx, x + 5, y + h * 0.62 + i * 6, w - 10 - i * 8, 3, '#5a5468'); break;
    case 'screen': {
      rect(ctx, x, y, w, h, '#1b2230'); rect(ctx, x + 3, y + 3, w - 6, h - 6, '#0d1018');
      const rows = Math.max(1, Math.floor((h - 10) / 12));
      for (let r = 0; r < rows; r++) { const ry = y + 6 + r * 12; drawKanaBlock(ctx, x + 6, ry, 8, '#6be585', r * 3); for (let i = 0; i < 4; i++) drawKanaBlock(ctx, x + 20 + i * 11, ry, 8, r === 0 ? '#f2a03a' : '#8ad8ff', r + i * 2); drawText(ctx, pad2((6 + r * 3) % 24) + ':' + pad2((r * 17) % 60), x + w - 8, ry + 1, '#f4f1ea', { align: 'right', font: 'small' }); }
      ctx.globalAlpha = 0.08; for (let i = 0; i < h; i += 3) rect(ctx, x, y + i, w, 1, '#000'); ctx.globalAlpha = 1;
      break;
    }
    case 'vending': {
      sh(); rect(ctx, x, y, w, h, '#c8402c'); rect(ctx, x, y, w, 6, '#e8604a'); frame(ctx, x, y, w, h, '#6a1a12');
      rect(ctx, x + 4, y + 10, w - 8, h * 0.52, '#12101c');
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) rect(ctx, x + 7 + i * ((w - 14) / 4), y + 14 + r * ((h * 0.52 - 8) / 3), 7, 11, ['#f2c94c', '#6be585', '#8ad8ff', '#f4f1ea'][(i + r) % 4]);
      ctx.globalAlpha = 0.2; rect(ctx, x + 4, y + 10, w - 8, h * 0.52, '#bfe0ff'); ctx.globalAlpha = 1;
      rect(ctx, x + 5, base - 20, w - 10, 8, '#2a2d33'); rect(ctx, x + 5, base - 10, w - 10, 6, '#1b1b24');
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 4 + x); rect(ctx, x + w - 12, y + h * 0.58, 6, 4, '#6be585'); ctx.globalAlpha = 1;
      break;
    }
    case 'lift': {
      rect(ctx, x, y, w, h, '#8a8f98'); rect(ctx, x + 3, y + 3, w - 6, h - 6, '#5a6472');
      const o = p.open ? clamp(p.open, 0, 1) : 0, half = Math.round((w - 6) / 2 * (1 - o));
      rect(ctx, x + 3, y + 3, w - 6, h - 6, '#12101c');
      rect(ctx, x + 3, y + 3, half, h - 6, '#cfd6de'); rect(ctx, x + w - 3 - half, y + 3, half, h - 6, '#cfd6de');
      rect(ctx, x + 3, y + 3, half, 3, '#e8eef4'); rect(ctx, x + w - 3 - half, y + 3, half, 3, '#e8eef4');
      rect(ctx, x + w / 2 - 16, y - 16, 32, 14, '#12101c'); drawText(ctx, p.level != null ? String(p.level) : '1', p.x, y - 12, '#f2a03a', { align: 'center', scale: 2 });
      break;
    }
    case 'escalator': {
      // a run of steps going up to the next floor, drawn as a ramp
      const toY = p.toY != null ? p.toY : base - 120;
      const dir = p.dir || 1;                       // 1 = up to the right
      const x0 = dir > 0 ? x : x + w, x1 = dir > 0 ? x + w : x;
      ctx.fillStyle = '#4a5260'; ctx.beginPath();
      ctx.moveTo(x0, base); ctx.lineTo(x1, toY); ctx.lineTo(x1, toY + 18); ctx.lineTo(x0, base + 18); ctx.fill();
      // the steps, marching
      const n = 12, off = ((t * (p.speed || 0.35)) % 1);
      for (let i = 0; i < n; i++) {
        const k = ((i + off) / n);
        const sx2 = lerp(x0, x1, k), sy2 = lerp(base, toY, k);
        rect(ctx, sx2 - 8, sy2 - 4, 17, 5, '#8a939e');
        rect(ctx, sx2 - 8, sy2 - 4, 17, 1, '#c0c6ce');
      }
      // the balustrade and the moving handrail
      ctx.strokeStyle = '#1b2230'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x0, base - 34); ctx.lineTo(x1, toY - 34); ctx.stroke(); ctx.lineWidth = 1;
      ctx.globalAlpha = 0.5; ctx.strokeStyle = '#8fc0e4'; ctx.beginPath(); ctx.moveTo(x0, base - 30); ctx.lineTo(x1, toY - 30); ctx.stroke(); ctx.globalAlpha = 1;
      // the arrow that tells you which way it is going
      const ax = lerp(x0, x1, 0.5), ay = lerp(base, toY, 0.5);
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3);
      ctx.fillStyle = '#6be585'; ctx.beginPath();
      ctx.moveTo(ax, ay - 52); ctx.lineTo(ax - 7 * dir, ay - 44); ctx.lineTo(ax + 7 * dir, ay - 44); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'stairs': {
      const toY = p.toY != null ? p.toY : base - 120, n = 10, dir = p.dir || 1;
      for (let i = 0; i < n; i++) {
        const k = i / n, sx2 = dir > 0 ? x + (w * k) : x + w - (w * k), sy2 = lerp(base, toY, k);
        rect(ctx, Math.min(sx2, sx2 + dir * (w / n)), sy2 - 5, w / n + 1, 6, '#b4ab96');
        rect(ctx, Math.min(sx2, sx2 + dir * (w / n)), sy2 - 5, w / n + 1, 1, '#d4cbb6');
        rect(ctx, sx2, sy2, 2, base - sy2, '#8f8877');
      }
      break;
    }
    case 'travelator': {
      rect(ctx, x, base - 10, w, 12, '#3a4250'); rect(ctx, x, base - 10, w, 2, '#6a7280');
      const off = (t * 30) % 20;
      for (let i = -20; i < w; i += 20) { ctx.globalAlpha = 0.6; rect(ctx, x + i + off, base - 8, 9, 8, '#2a3040'); ctx.globalAlpha = 1; }
      rect(ctx, x, base - 44, 3, 36, '#1b2230'); rect(ctx, x + w - 3, base - 44, 3, 36, '#1b2230');
      ctx.globalAlpha = 0.4; rect(ctx, x, base - 44, w, 3, '#8fc0e4'); ctx.globalAlpha = 1;
      break;
    }
    case 'belt': {   // a baggage carousel, seen side on
      rect(ctx, x, base - 30, w, 30, '#2a2d33');
      rect(ctx, x, base - 34, w, 6, '#4a5260');
      const off = (t * 26) % 26;
      for (let i = -26; i < w; i += 26) { rect(ctx, x + i + off, base - 33, 22, 4, '#3a3f46'); }
      // the bags going round
      for (let i = 0; i < Math.floor(w / 90); i++) {
        const bx = x + ((i * 90 + t * 26) % w);
        const c = ['#2f4a8a', '#8a2a1c', '#2f6a4a', '#3a3550', '#8a6a2a'][i % 5];
        rect(ctx, bx, base - 52, 26, 19, c); rect(ctx, bx, base - 52, 26, 3, lighten(c, 0.25)); rect(ctx, bx + 9, base - 55, 8, 4, '#8a8f98');
      }
      break;
    }
    case 'trolley': sh(); rect(ctx, x, base - 30, w, 5, '#b9bec6'); rect(ctx, x + 2, base - 25, w - 4, 4, '#8a8f98'); rect(ctx, x + w - 6, base - 50, 4, 26, '#8a8f98'); rect(ctx, x + w - 14, base - 52, 14, 4, '#6a7079'); circle(ctx, x + 6, base - 3, 4, '#2a2d33'); circle(ctx, x + w - 8, base - 3, 4, '#2a2d33'); break;
    case 'counter': sh(); rect(ctx, x, y, w, h, p.col || '#d8d2c4'); rect(ctx, x, y, w, 5, '#f0ece2'); rect(ctx, x, base - 6, w, 6, darken(p.col || '#d8d2c4', 0.3)); if (p.text) drawText(ctx, p.text, p.x, y - 14, '#f4f1ea', { align: 'center', scale: 2, outline: '#12101c' }); break;
    case 'table': sh(); rect(ctx, x, y, w, 6, p.col || '#a8784a'); rect(ctx, x, y, w, 2, lighten(p.col || '#a8784a', 0.25)); rect(ctx, x + 4, y + 6, 5, h - 6, darken(p.col || '#a8784a', 0.3)); rect(ctx, x + w - 9, y + 6, 5, h - 6, darken(p.col || '#a8784a', 0.3)); break;
    case 'stool': sh(); rect(ctx, x, y, w, 5, '#8a4a2a'); rect(ctx, x + w / 2 - 2, y + 5, 4, h - 5, '#4a4a52'); rect(ctx, x, base - 3, w, 3, '#4a4a52'); break;
    case 'lamp': rect(ctx, p.x - 2, y, 4, h, '#2f3742'); ellipsePx(ctx, p.x, y, 12, 6, '#3a4250'); ctx.globalAlpha = 0.14; ellipsePx(ctx, p.x, y + 40, 44, 42, '#ffe9a8'); ctx.globalAlpha = 1; ellipsePx(ctx, p.x, y + 3, 9, 4, '#ffe9a8'); break;
    case 'cone': ctx.fillStyle = '#e06020'; ctx.beginPath(); ctx.moveTo(p.x, base - h); ctx.lineTo(p.x - w / 2, base); ctx.lineTo(p.x + w / 2, base); ctx.fill(); rect(ctx, x + 2, base - h * 0.55, w - 4, 5, '#f4f1ea'); break;
    case 'luggage': { sh(); const c = p.col || '#2f4a8a'; rect(ctx, x, y, w, h, c); rect(ctx, x, y, w, 3, lighten(c, 0.25)); rect(ctx, x, y + h * 0.45, w, 2, darken(c, 0.3)); rect(ctx, x + w / 2 - 5, y - 5, 10, 5, '#8a8f98'); break; }
    case 'crate': sh(); rect(ctx, x, y, w, h, '#6a4a2e'); rect(ctx, x, y, w, 3, '#8a6440'); for (let i = 0; i < w - 6; i += 8) rect(ctx, x + 3 + i, y + 5, 6, h - 10, '#7a5636'); break;
    case 'fireext': rect(ctx, x, y, w, h, '#c8402c'); rect(ctx, x, y, w, 3, '#e8604a'); rect(ctx, x + w / 2 - 2, y - 6, 4, 6, '#3a3f4a'); break;
    case 'payphone': rect(ctx, x, y, w, h, '#2f6a4a'); rect(ctx, x + 3, y + 5, w - 6, h * 0.4, '#1b2230'); rect(ctx, x - 3, y + 10, 5, 12, '#1b2230'); break;
    case 'atm': rect(ctx, x, y, w, h, '#3a4250'); rect(ctx, x + 4, y + 6, w - 8, h * 0.4, '#0d1018'); ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2); rect(ctx, x + 6, y + 8, w - 12, h * 0.34, '#2f6fc0'); ctx.globalAlpha = 1; for (let i = 0; i < 9; i++) rect(ctx, x + 8 + (i % 3) * 9, y + h * 0.56 + Math.floor(i / 3) * 8, 7, 6, '#6a7079'); break;
    case 'window': {  // a window onto somewhere else (a plane, a train, a room)
      rect(ctx, x - 3, y - 3, w + 6, h + 6, p.frame || '#cfd6de');
      rect(ctx, x, y, w, h, '#0d1420');
      if (p.draw) p.draw(ctx, x, y, w, h, t, S);
      ctx.globalAlpha = 0.14; rect(ctx, x + 2, y + 2, w - 4, h * 0.3, '#ffffff'); ctx.globalAlpha = 1;
      break;
    }
    default: { sh(); rect(ctx, x, y, w, h, p.col || '#6a6478'); rect(ctx, x, y, w, 3, lighten(p.col || '#6a6478', 0.25)); if (p.text) drawText(ctx, p.text, p.x, y + 4, '#f4f1ea', { align: 'center', font: 'small' }); }
  }
  if (p.tag) { rect(ctx, p.x - textWidth(p.tag, { font: 'small' }) / 2 - 4, y - 14, textWidth(p.tag, { font: 'small' }) + 8, 11, 'rgba(10,8,18,0.8)'); drawText(ctx, p.tag, p.x, y - 12, '#cfc9e6', { align: 'center', font: 'small' }); }
}
