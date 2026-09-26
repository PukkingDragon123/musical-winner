// ---------- Texture: pixel art at the scale of a building ----------
// Plain rectangles are what made the old airport look like a diagram. Every
// surface here is painted pixel by pixel into an ImageData buffer instead:
// terrazzo with its chips, steel with its brushing, glass with the sky in it,
// gradients laid down as ordered dither the way a pixel artist would, never
// as a smooth ramp. The buffers are baked once and cached, so a wall that
// took a million pixel writes costs one drawImage a frame.
//
// Coordinates are world coordinates. A TexBuf covers [ox, ox + w) x [oy, oy + h)
// of the world, and anything painted outside that window is simply clipped,
// which is what lets a long building be baked in tiles that meet seamlessly.
'use strict';

const _rgbC = new Map();
function rgbOf(hex) {
  let c = _rgbC.get(hex);
  if (!c) { const h = hex.charAt(0) === '#' ? hex.slice(1) : hex; c = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; _rgbC.set(hex, c); }
  return c;
}
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function bayerAt(x, y) { return BAYER4[((y & 3) << 2) | (x & 3)] / 16; }
// A hash of a world position: the same pixel always gets the same grain, so
// tiles baked minutes apart still line up.
function hash2(x, y, s) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function lerpRGB(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function shadeRGB(c, k) { return [c[0] * k, c[1] * k, c[2] * k]; }

class TexBuf {
  constructor(w, h, ox, oy) {
    this.w = w | 0; this.h = h | 0; this.ox = ox | 0; this.oy = oy | 0;
    this.img = new ImageData(this.w, this.h); this.d = this.img.data;
  }
  // write one pixel, opaque or with alpha (0..255), no blending
  put(x, y, c, a) {
    const X = (x | 0) - this.ox, Y = (y | 0) - this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return;
    const i = (Y * this.w + X) * 4, d = this.d;
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = a == null ? 255 : a;
  }
  // composite one pixel over what is already there (a is 0..1)
  mix(x, y, c, a) {
    const X = (x | 0) - this.ox, Y = (y | 0) - this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h || a <= 0) return;
    const i = (Y * this.w + X) * 4, d = this.d;
    const da = d[i + 3] / 255, oa = a + da * (1 - a);
    if (oa <= 0) return;
    d[i] = (c[0] * a + d[i] * da * (1 - a)) / oa;
    d[i + 1] = (c[1] * a + d[i + 1] * da * (1 - a)) / oa;
    d[i + 2] = (c[2] * a + d[i + 2] * da * (1 - a)) / oa;
    d[i + 3] = oa * 255;
  }
  get(x, y) {
    const X = (x | 0) - this.ox, Y = (y | 0) - this.oy;
    if (X < 0 || Y < 0 || X >= this.w || Y >= this.h) return null;
    const i = (Y * this.w + X) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]];
  }
  // the part of a world rectangle that lies inside this buffer
  clip(x, y, w, h) {
    const x0 = Math.max(x | 0, this.ox), y0 = Math.max(y | 0, this.oy);
    const x1 = Math.min((x + w) | 0, this.ox + this.w), y1 = Math.min((y + h) | 0, this.oy + this.h);
    return x1 > x0 && y1 > y0 ? [x0, y0, x1, y1] : null;
  }
  rect(x, y, w, h, c, a) { const r = this.clip(x, y, w, h); if (!r) return; for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) this.put(i, j, c, a); }
  blend(x, y, w, h, c, a) { const r = this.clip(x, y, w, h); if (!r) return; for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) this.mix(i, j, c, a); }
  hline(x, y, w, c, a) { this.rect(x, y, w, 1, c, a); }
  vline(x, y, h, c, a) { this.rect(x, y, 1, h, c, a); }
  frame(x, y, w, h, c) { this.hline(x, y, w, c); this.hline(x, y + h - 1, w, c); this.vline(x, y, h, c); this.vline(x + w - 1, y, h, c); }
  // A vertical gradient through a list of colours, laid down as ordered
  // dither. This is the single biggest difference between a pixel-art sky
  // and a web page with a gradient on it.
  ditherV(x, y, w, h, stops, a) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const S = stops.map(function (s) { return typeof s === 'string' ? rgbOf(s) : s; }), n = S.length - 1;
    for (let j = r[1]; j < r[3]; j++) {
      const p = clamp((j - y) / Math.max(1, h - 1), 0, 1) * n, k = Math.min(n - 1, Math.floor(p)), f = p - k;
      for (let i = r[0]; i < r[2]; i++) this.put(i, j, f > bayerAt(i, j) ? S[Math.min(n, k + 1)] : S[k], a);
    }
  }
  ditherH(x, y, w, h, stops, a) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const S = stops.map(function (s) { return typeof s === 'string' ? rgbOf(s) : s; }), n = S.length - 1;
    for (let i = r[0]; i < r[2]; i++) {
      const p = clamp((i - x) / Math.max(1, w - 1), 0, 1) * n, k = Math.min(n - 1, Math.floor(p)), f = p - k;
      for (let j = r[1]; j < r[3]; j++) this.put(i, j, f > bayerAt(i, j) ? S[Math.min(n, k + 1)] : S[k], a);
    }
  }
  // Brightness grain: every pixel nudged up or down by its own hash.
  grain(x, y, w, h, amp, seed) {
    const r = this.clip(x, y, w, h); if (!r) return; const d = this.d;
    for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) {
      const X = i - this.ox, Y = j - this.oy, q = (Y * this.w + X) * 4;
      if (d[q + 3] === 0) continue;
      const k = 1 + (hash2(i, j, seed) - 0.5) * 2 * amp;
      d[q] = d[q] * k; d[q + 1] = d[q + 1] * k; d[q + 2] = d[q + 2] * k;
    }
  }
  // Terrazzo: a poured floor of chips in a cement matrix. Thirteen acres of
  // it at the real terminal, polished until the ceiling shows in it.
  terrazzo(x, y, w, h, base, chips, seed) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const B = rgbOf(base), C = chips.map(rgbOf);
    for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) {
      const n = hash2(i, j, seed);
      let c = shadeRGB(B, 0.96 + hash2(i >> 1, j >> 1, seed + 7) * 0.08);
      if (n < 0.07) c = C[(n * 1000 | 0) % C.length];
      else if (n < 0.1) c = lerpRGB(c, C[(n * 777 | 0) % C.length], 0.5);
      this.put(i, j, c);
    }
  }
  // Brushed steel: streaks that run the length of the metal, each row its own
  // shade, and a fine grain across them.
  brushed(x, y, w, h, base, seed, vertical) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const B = rgbOf(base);
    for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) {
      const line = vertical ? hash2(i, 0, seed) : hash2(0, j, seed);
      const k = 0.9 + line * 0.18 + (hash2(i, j, seed + 3) - 0.5) * 0.06;
      this.put(i, j, shadeRGB(B, k));
    }
  }
  // Cast concrete: noise at two sizes, and the odd pit.
  concrete(x, y, w, h, base, seed) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const B = rgbOf(base);
    for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) {
      const big = hash2(i >> 3, j >> 3, seed), small = hash2(i, j, seed + 1);
      let k = 0.92 + big * 0.1 + (small - 0.5) * 0.08;
      if (small > 0.992) k = 0.72;
      this.put(i, j, shadeRGB(B, k));
    }
  }
  // Glass: mostly the colour of what is behind it, so it is drawn with alpha,
  // plus a gradient of tint and the long diagonal bands of reflection that
  // tell you it is there at all.
  glass(x, y, w, h, tint, alpha, seed, opts) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const o = opts || {}, T = rgbOf(tint), Hi = rgbOf(o.hi || '#e8f4ff');
    const band = o.band || 70, slope = o.slope || 0.55;
    for (let j = r[1]; j < r[3]; j++) {
      const v = (j - y) / Math.max(1, h);
      for (let i = r[0]; i < r[2]; i++) {
        let a = alpha * (0.85 + v * 0.35);
        let c = T;
        // the reflection bands, laid diagonally, dithered at their edges
        const u = ((i + (j - y) * slope + (seed | 0) * 13) % band + band) % band;
        if (u < 6) { const e = u < 1 || u > 4 ? 0.5 : 1; if (e > bayerAt(i, j) - 0.2) { c = Hi; a = Math.min(1, a + 0.28 * e); } }
        else if (u < 9 && bayerAt(i, j) < 0.4) { c = lerpRGB(T, Hi, 0.4); a = Math.min(1, a + 0.1); }
        // composited, not written: glass over a lit room shows the room,
        // glass over nothing shows the sky behind the building
        this.mix(i, j, c, clamp(a, 0, 1));
      }
    }
  }
  // Carpet: a woven repeat, a border, and wear down the middle.
  carpet(x, y, w, h, pal, seed) {
    const r = this.clip(x, y, w, h); if (!r) return;
    const P = pal.map(rgbOf);
    for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) {
      const cx = ((i - x) % 12 + 12) % 12, cy = ((j - y) % 12 + 12) % 12;
      let c = P[0];
      if ((cx === 5 || cx === 6) && (cy === 5 || cy === 6)) c = P[2] || P[1];
      else if ((cx + cy) % 6 === 0) c = P[1];
      if (hash2(i, j, seed) < 0.18) c = shadeRGB(c, 0.9);
      this.put(i, j, c);
    }
  }
  // Paint over whatever is there with a light pool, dithered at the edge.
  pool(cx, cy, rx, ry, col, strength) {
    const C = rgbOf(col), r = this.clip(cx - rx, cy - ry, rx * 2, ry * 2); if (!r) return;
    for (let j = r[1]; j < r[3]; j++) for (let i = r[0]; i < r[2]; i++) {
      const dx = (i - cx) / rx, dy = (j - cy) / ry, dd = dx * dx + dy * dy;
      if (dd >= 1) continue;
      const k = (1 - dd) * strength;
      if (k * 1.6 > bayerAt(i, j) * 0.6) this.mix(i, j, C, clamp(k, 0, 0.9));
    }
  }
  // An outlined, three-tone box: the building block of every machine here.
  box(x, y, w, h, base, opts) {
    const o = opts || {}, B = rgbOf(base);
    const hi = o.hi ? rgbOf(o.hi) : shadeRGB(B, 1.22), lo = o.lo ? rgbOf(o.lo) : shadeRGB(B, 0.72), ol = rgbOf(o.ol || '#141018');
    this.rect(x, y, w, h, B);
    if (o.tex === 'brushed') this.brushed(x + 1, y + 1, w - 2, h - 2, base, o.seed || 1);
    else if (o.tex === 'concrete') this.concrete(x + 1, y + 1, w - 2, h - 2, base, o.seed || 1);
    else if (o.tex !== false) this.grain(x, y, w, h, 0.05, o.seed || 1);
    this.hline(x + 1, y + 1, w - 2, hi); this.vline(x + 1, y + 1, h - 2, hi);
    this.hline(x + 1, y + h - 2, w - 2, lo); this.vline(x + w - 2, y + 1, h - 2, lo);
    if (o.ol !== false) this.frame(x, y, w, h, ol);
  }
  toCanvas() { const c = makeCanvas(this.w, this.h); c.getContext('2d').putImageData(this.img, 0, 0); return c; }
}
// Bake a sprite once through a TexBuf: fn(buf) paints in local coordinates.
function texSprite(key, w, h, fn) {
  return cached('tex|' + key, function () { const b = new TexBuf(w, h, 0, 0); fn(b); return b.toCanvas(); });
}
