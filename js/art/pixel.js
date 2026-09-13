// ---------- Pixel buffer with masks, auto-shading and outlines ----------
'use strict';
class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  idx(x, y) { return y * this.w + x; }
  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  get(x, y) { return this.inb(x, y) ? this.d[this.idx(x, y)] : null; }
  set(x, y, c) { if (this.inb(x, y)) this.d[this.idx(x, y)] = c; }
  mask() { return new Uint8Array(this.w * this.h); }
  // Every pixel that has been drawn: lets a finishing pass texture a whole
  // sprite without knowing how it was built.
  solidMask(skip) { const m = this.mask(); for (let i = 0; i < m.length; i++) if (this.d[i] != null && this.d[i] !== skip) m[i] = 1; return m; }
  mEllipse(m, cx, cy, rx, ry) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / (rx + 0.5), dy = (y - cy) / (ry + 0.5);
      if (dx * dx + dy * dy <= 1 && this.inb(x, y)) m[this.idx(x, y)] = 1;
    }
    return m;
  }
  mRect(m, x0, y0, w, h) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (this.inb(x, y)) m[this.idx(x, y)] = 1; return m; }
  mRound(m, x0, y0, w, h, r) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const cx = x < x0 + r ? x0 + r : x >= x0 + w - r ? x0 + w - 1 - r : x, cy = y < y0 + r ? y0 + r : y >= y0 + h - r ? y0 + h - 1 - r : y;
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r + r * 0.5 && this.inb(x, y)) m[this.idx(x, y)] = 1;
    }
    return m;
  }
  mPoly(m, pts) {
    const ys = pts.map(p => p[1]); const y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((y + 0.5 >= a[1] && y + 0.5 < b[1]) || (y + 0.5 >= b[1] && y + 0.5 < a[1])) xs.push(a[0] + (y + 0.5 - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) if (this.inb(x, y)) m[this.idx(x, y)] = 1;
    }
    return m;
  }
  mLine(m, x1, y1, x2, y2, thick = 1) {
    x1 = Math.round(x1); y1 = Math.round(y1); x2 = Math.round(x2); y2 = Math.round(y2);
    const dx = Math.abs(x2 - x1), dy = -Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1; let err = dx + dy;
    for (let n = 0; n < 500; n++) {
      for (let t = 0; t < thick; t++) { if (this.inb(x1 + t, y1)) m[this.idx(x1 + t, y1)] = 1; }
      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err; if (e2 >= dy) { err += dy; x1 += sx; } if (e2 <= dx) { err += dx; y1 += sy; }
    }
    return m;
  }
  mSub(m, sub) { for (let i = 0; i < m.length; i++) if (sub[i]) m[i] = 0; return m; }
  mCopy(m) { return new Uint8Array(m); }
  // Fill mask with shaded base color. opts: {outline, shade(true), grad(true), light('tl'), hi, lo, noise}
  fill(m, color, opts = {}) {
    const w = this.w, h = this.h;
    let top = h, bot = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { if (y < top) top = y; if (y > bot) bot = y; }
    if (bot < 0) return;
    const has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
    if (opts.outline) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!m[y * w + x] && (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1))) this.d[y * w + x] = opts.outline;
    }
    const hi = opts.hi || lighten(color, opts.shade === false ? 0 : 0.16), lo = opts.lo || darken(color, opts.shade === false ? 0 : 0.16);
    const mid = darken(color, 0.07), hiMid = lighten(color, 0.06);
    const span = Math.max(1, bot - top);
    for (let y = top; y <= bot; y++) for (let x = 0; x < w; x++) {
      if (!m[y * w + x]) continue;
      let c = color;
      if (opts.grad !== false && opts.shade !== false) { const t = (y - top) / span; c = t > 0.66 ? mid : t < 0.22 ? hiMid : color; }
      if (opts.shade !== false) {
        if (!has(x, y - 1) || (!has(x - 1, y) && opts.light !== 'top')) c = hi;
        else if (!has(x, y + 1) || (!has(x + 1, y) && opts.light !== 'top')) c = lo;
      }
      this.d[y * w + x] = c;
    }
  }
  // replace colors inside mask by pattern function (x,y)=>color|null
  paint(m, fn) { for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (m[y * this.w + x]) { const c = fn(x, y); if (c) this.d[y * this.w + x] = c; } }
  // ---------- Material textures ----------
  // Everything below works on whatever colour is already under the mask, so a
  // texture can be layered onto a shaded fill without flattening it.
  _shift(x, y, amt, sat = 0) { const c = this.get(x, y); if (c == null) return; this.set(x, y, amt >= 0 ? lighten(c, amt) : darken(c, -amt)); }
  // Fine grain: a hash-driven speckle, the cheapest way to stop a flat fill
  // reading as plastic. `amt` is how far each pixel is nudged.
  grain(m, amt = 0.05, seed = 1) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!m[y * this.w + x]) continue;
      const n = ((Math.imul(x + seed * 71, 0x9E3779B1) ^ Math.imul(y + seed * 131, 0x85EBCA77)) >>> 24) / 255;
      if (n < 0.34) this._shift(x, y, amt);
      else if (n > 0.72) this._shift(x, y, -amt);
    }
  }
  // Ordered 4x4 dither between the colour underneath and a target, weighted by
  // a 0..1 field. Gives a gradient that still looks hand-placed.
  ditherTo(m, color, field, strength = 1) {
    const B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!m[y * this.w + x]) continue;
      const k = clamp(field(x, y) * strength, 0, 1);
      if (k * 16 > B[(y & 3) * 4 + (x & 3)]) this.set(x, y, color);
    }
  }
  // Horizontal wood grain: long wavering lines plus the odd knot.
  wood(m, seed = 1, amt = 0.09) {
    const r = makeRng(hashStr('wood' + seed));
    const lines = []; for (let i = 0; i < Math.ceil(this.h / 3); i++) lines.push({ y: r.range(0, this.h), a: r.range(0, 6.3), f: r.range(0.1, 0.3), d: r.chance(0.5) ? amt : -amt });
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!m[y * this.w + x]) continue;
      for (const l of lines) if (Math.abs(y - (l.y + Math.sin(x * l.f + l.a) * 1.6)) < 0.6) { this._shift(x, y, l.d); break; }
    }
  }
  // Brushed metal: vertical streaks and a bright specular band.
  metal(m, seed = 1, amt = 0.1) {
    const r = makeRng(hashStr('metal' + seed));
    const cols = []; for (let x = 0; x < this.w; x++) cols.push(r.chance(0.3) ? (r.chance(0.5) ? amt : -amt) : 0);
    let top = this.h, bot = -1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (m[y * this.w + x]) { if (y < top) top = y; if (y > bot) bot = y; }
    const band = top + (bot - top) * 0.3;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!m[y * this.w + x]) continue;
      if (cols[x]) this._shift(x, y, cols[x]);
      if (Math.abs(y - band) < 1.2) this._shift(x, y, amt * 1.6);
    }
  }
  // Woven cloth: a two-pixel checker, very subtle.
  cloth(m, amt = 0.05) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (!m[y * this.w + x]) continue;
      if (((x >> 1) + (y >> 1)) & 1) this._shift(x, y, -amt); else this._shift(x, y, amt * 0.6);
    }
  }
  // Scratches and dents: short strokes, biased toward the edges of the shape.
  scuff(m, seed = 1, n = 6, amt = 0.16) {
    const r = makeRng(hashStr('scuff' + seed));
    for (let i = 0; i < n; i++) {
      const x0 = r.int(0, this.w - 1), y0 = r.int(0, this.h - 1);
      const len = r.int(2, 5), dx = r.pick([-1, 0, 1]), dy = r.pick([-1, 0, 1]);
      const up = r.chance(0.55);
      for (let k = 0; k < len; k++) { const x = x0 + dx * k, y = y0 + dy * k; if (this.inb(x, y) && m[y * this.w + x]) this._shift(x, y, up ? amt : -amt); }
    }
  }
  // Rust and grime creeping in from the bottom edge.
  rust(m, seed = 1, color = '#7a4a22', density = 0.3) {
    const r = makeRng(hashStr('rust' + seed));
    let top = this.h, bot = -1;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (m[y * this.w + x]) { if (y < top) top = y; if (y > bot) bot = y; }
    const span = Math.max(1, bot - top);
    for (let y = top; y <= bot; y++) for (let x = 0; x < this.w; x++) {
      if (!m[y * this.w + x]) continue;
      const k = (y - top) / span;
      if (r() < density * k * k) this.set(x, y, r.chance(0.4) ? darken(color, 0.12) : color);
    }
  }
  // A row of rivets or lugs around a rectangle edge.
  studs(x0, y0, w, h, step, color, hiColor) {
    for (let x = x0; x < x0 + w; x += step) { this.set(x, y0, hiColor || lighten(color, 0.3)); this.set(x, y0 + 1, color); this.set(x, y0 + h - 1, color); }
  }
  outlineAll(color) {
    const w = this.w, h = this.h, src = this.d.slice();
    const has = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[y * w + x] != null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (src[y * w + x] == null && (has(x - 1, y) || has(x + 1, y) || has(x, y - 1) || has(x, y + 1))) this.d[y * w + x] = color;
  }
  blit(src, ox, oy, flip = false) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) { const c = src.d[y * src.w + x]; if (c != null) this.set(ox + (flip ? src.w - 1 - x : x), oy + y, c); }
  }
  toCanvas() {
    const c = makeCanvas(this.w, this.h), ctx = c.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const col = this.d[y * this.w + x]; if (col != null) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); } }
    return c;
  }
}
const _spriteCache = new Map();
function cached(key, fn) { let c = _spriteCache.get(key); if (!c) { c = fn(); _spriteCache.set(key, c); } return c; }
function flipCanvas(c) { const f = makeCanvas(c.width, c.height); const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return f; }
// Tiny helpers for drawing string-defined sprites (legacy style) into a Pix
function pixFromRows(rows, pal) {
  const p = new Pix(rows[0].length, rows.length);
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) { const ch = rows[y][x]; if (ch !== '.' && ch !== ' ' && pal[ch]) p.set(x, y, pal[ch]); }
  return p;
}
