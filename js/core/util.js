// ---------- Utilities: RNG, math, colors ----------
'use strict';
const W = 640, H = 360;

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
  r.sign = () => r() < 0.5 ? -1 : 1;
  return r;
}
const RNG = makeRng((Date.now() ^ 0x9E3779B9) >>> 0);
const hashStr = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t);
const easeIn = (t) => t * t;
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const easeOutBack = (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const fmtMoney = (n) => '$' + (Math.round(n * 100) / 100).toFixed(Math.abs(n % 1) > 0.001 ? 2 : 0);
const fmtNum = (n) => Math.round(n).toLocaleString('en-US');
const pad2 = (n) => (n < 10 ? '0' : '') + n;

// ---- colors
function hexToRgb(hex) { const h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbToHex(r, g, b) { const c = (v) => ('0' + clamp(Math.round(v), 0, 255).toString(16)).slice(-2); return '#' + c(r) + c(g) + c(b); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  h = ((h % 1) + 1) % 1;
  if (s === 0) { const v = l * 255; return [v, v, v]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = ((t % 1) + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}
const _colCache = new Map();
// Shift a color: dl lightness (-1..1), ds saturation, dh hue (fraction)
function tint(hex, dl, ds = 0, dh = 0) {
  const key = hex + dl + ',' + ds + ',' + dh; let c = _colCache.get(key); if (c) return c;
  const [r, g, b] = hexToRgb(hex); let [h, s, l] = rgbToHsl(r, g, b);
  l = clamp(l + dl, 0, 1); s = clamp(s + ds, 0, 1); h += dh;
  const o = hslToRgb(h, s, l); c = rgbToHex(o[0], o[1], o[2]); _colCache.set(key, c); return c;
}
// Pixel-art style highlight/shadow: highlights drift warm, shadows drift cool
const lighten = (hex, amt = 0.14) => tint(hex, amt, 0.02, -0.02);
const darken = (hex, amt = 0.14) => tint(hex, -amt, 0.04, 0.03);
function shade(hex, amt) { const [r, g, b] = hexToRgb(hex); return rgbToHex(r + amt, g + amt, b + amt); }
function mixColor(a, b, t) { const A = hexToRgb(a), B = hexToRgb(b); return rgbToHex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function withAlpha(hex, a) { const [r, g, b] = hexToRgb(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; }

// ---- basic canvas draw helpers
function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function frame(ctx, x, y, w, h, color) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  rect(ctx, x, y, w, 1, color); rect(ctx, x, y + h - 1, w, 1, color); rect(ctx, x, y, 1, h, color); rect(ctx, x + w - 1, y, 1, h, color);
}
function px(ctx, x, y, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
function circle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color; cx = Math.round(cx); cy = Math.round(cy);
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y + 0.5)); ctx.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
}
function ringPx(ctx, cx, cy, r, color) {
  ctx.fillStyle = color; const steps = Math.max(12, Math.floor(r * 7));
  for (let i = 0; i < steps; i++) { const a = (i / steps) * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
}
function dashedLine(ctx, x1, y1, x2, y2, color, dash = 3, gap = 3, offset = 0) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy); if (len < 0.01) return;
  const ux = dx / len, uy = dy / len; ctx.fillStyle = color;
  for (let d = offset % (dash + gap) - (dash + gap); d < len; d += dash + gap) for (let k = Math.max(0, d); k < Math.min(len, d + dash); k += 1) ctx.fillRect(Math.round(x1 + ux * k), Math.round(y1 + uy * k), 1, 1);
}
function line(ctx, x1, y1, x2, y2, color) {
  ctx.fillStyle = color; x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
  const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1; let err = dx + dy;
  for (let n = 0; n < 4000; n++) { ctx.fillRect(x1, y1, 1, 1); if (x1 === x2 && y1 === y2) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x1 += sx; } if (e2 <= dx) { err += dx; y1 += sy; } }
}
function vgrad(ctx, x, y, w, h, c1, c2) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
function hgrad(ctx, x, y, w, h, c1, c2) { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
