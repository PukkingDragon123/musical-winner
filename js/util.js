// ---------- Utilities: RNG, math, colors ----------
'use strict';
const W = 480, H = 270;

// Mulberry32 seeded RNG
function makeRng(seed) {
  let s = seed >>> 0;
  const r = function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  r.shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  r.range = (a, b) => a + r() * (b - a);
  return r;
}
const RNG = makeRng((Date.now() ^ 0x9E3779B9) >>> 0);

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;
const fmtMoney = (n) => '$' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0);
const pad2 = (n) => (n < 10 ? '0' : '') + n;

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function rgbToHex(r, g, b) {
  const c = (v) => ('0' + clamp(Math.round(v), 0, 255).toString(16)).slice(-2);
  return '#' + c(r) + c(g) + c(b);
}
function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + amt, g + amt, b + amt);
}
function mixColor(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
}

// Draw helpers
function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function frame(ctx, x, y, w, h, color) {
  rect(ctx, x, y, w, 1, color); rect(ctx, x, y + h - 1, w, 1, color);
  rect(ctx, x, y, 1, h, color); rect(ctx, x + w - 1, y, 1, h, color);
}
function panel(ctx, x, y, w, h, opts = {}) {
  const bg = opts.bg || '#1a1728', border = opts.border || '#6b5f9a', inner = opts.inner || '#2a2540';
  rect(ctx, x, y, w, h, border);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, bg);
  frame(ctx, x + 2, y + 2, w - 4, h - 4, inner);
}
function dashedLine(ctx, x1, y1, x2, y2, color, dash = 3, gap = 3, offset = 0) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  if (len < 0.01) return;
  const ux = dx / len, uy = dy / len;
  ctx.fillStyle = color;
  for (let d = offset % (dash + gap) - (dash + gap); d < len; d += dash + gap) {
    for (let k = Math.max(0, d); k < Math.min(len, d + dash); k += 1) {
      ctx.fillRect(Math.round(x1 + ux * k), Math.round(y1 + uy * k), 1, 1);
    }
  }
}
function circle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) {
    const w = Math.floor(Math.sqrt(r * r - y * y));
    ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}
function ringPx(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  const steps = Math.max(12, Math.floor(r * 6));
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1);
  }
}
