// ---------- Effects: particles, screen shake, wind, floating text, tweens ----------
'use strict';
class Particles {
  constructor() { this.list = []; }
  // p: {x,y,vx,vy,life,color,size,gravity,drag,kind:'px'|'spark'|'ring'|'leaf'|'confetti'|'smoke'|'fire'|'star', rot, spin}
  add(p) { p.t = 0; p.life = p.life || 0.6; p.size = p.size || 1; this.list.push(p); return p; }
  burst(x, y, n, opts = {}) {
    for (let i = 0; i < n; i++) {
      const a = opts.angle != null ? opts.angle + (Math.random() - 0.5) * (opts.spread || Math.PI * 2) : Math.random() * Math.PI * 2;
      const sp = (opts.speed || 60) * (0.4 + Math.random() * 0.8);
      this.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opts.up || 0), life: (opts.life || 0.5) * (0.6 + Math.random() * 0.7), color: Array.isArray(opts.color) ? opts.color[Math.floor(Math.random() * opts.color.length)] : (opts.color || '#fff'), size: opts.size || 1, gravity: opts.gravity != null ? opts.gravity : 120, drag: opts.drag || 0.98, kind: opts.kind || 'px' });
    }
  }
  ring(x, y, color, r0 = 2, r1 = 14, life = 0.3) { this.add({ x, y, vx: 0, vy: 0, life, color, kind: 'ring', r0, r1, gravity: 0 }); }
  update(dt, wind = 0) {
    for (const p of this.list) {
      p.t += dt;
      p.vy += (p.gravity || 0) * dt;
      if (p.kind === 'leaf' || p.kind === 'confetti' || p.kind === 'smoke' || p.kind === 'fog') { p.vx += wind * dt * (p.kind === 'fog' ? 0.4 : 1.5); p.vx *= 0.99; }
      else p.vx *= (p.drag || 0.98);
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.kind === 'leaf') p.y += Math.sin(p.t * 6 + p.x * 0.05) * 12 * dt;
      if (p.kind === 'confetti') p.x += Math.sin(p.t * 8) * 10 * dt;
      if (p.kind === 'fire') { p.vy -= 60 * dt; p.vx += (Math.random() - 0.5) * 30 * dt; }
    }
    this.list = this.list.filter(p => p.t < p.life);
  }
  draw(ctx) {
    for (const p of this.list) {
      const k = clamp(p.t / p.life, 0, 1), fade = 1 - k;
      switch (p.kind) {
        case 'ring': { ctx.globalAlpha = fade; ringPx(ctx, p.x, p.y, lerp(p.r0, p.r1, easeOut(k)), p.color); if (p.r1 > 8) ringPx(ctx, p.x, p.y, lerp(p.r0, p.r1, easeOut(k)) - 1, p.color); ctx.globalAlpha = 1; break; }
        case 'spark': { ctx.globalAlpha = fade; const l = Math.max(1, p.size * 2 * fade); rect(ctx, p.x, p.y, l, 1, p.color); rect(ctx, p.x, p.y, 1, l, p.color); ctx.globalAlpha = 1; break; }
        case 'star': { ctx.globalAlpha = fade; const s = Math.max(1, Math.round(p.size * (1 - k * 0.5))); rect(ctx, p.x - s, p.y, s * 2 + 1, 1, p.color); rect(ctx, p.x, p.y - s, 1, s * 2 + 1, p.color); px(ctx, p.x, p.y, '#fff'); ctx.globalAlpha = 1; break; }
        case 'smoke': case 'fog': { ctx.globalAlpha = fade * (p.alpha || 0.5); const s = p.size + k * (p.grow || 6); circle(ctx, p.x, p.y, s, p.color); ctx.globalAlpha = 1; break; }
        case 'fire': { const s = Math.max(1, Math.round(p.size * (1 - k))); const col = k < 0.3 ? '#fff4b0' : k < 0.6 ? '#ffb030' : k < 0.85 ? '#ff5020' : '#803020'; ctx.globalAlpha = k < 0.85 ? 1 : fade * 4; circle(ctx, p.x, p.y, s, col); ctx.globalAlpha = 1; break; }
        case 'leaf': { ctx.globalAlpha = Math.min(1, fade * 3); ctx.drawImage(propCanvas('leaf'), Math.round(p.x), Math.round(p.y)); ctx.globalAlpha = 1; break; }
        case 'confetti': { ctx.globalAlpha = Math.min(1, fade * 3); const flip = Math.sin(p.t * 10) > 0; rect(ctx, p.x, p.y, flip ? 3 : 1, 2, p.color); ctx.globalAlpha = 1; break; }
        case 'text': { ctx.globalAlpha = Math.min(1, fade * 2.5); drawText(ctx, p.text, p.x, p.y, p.color, { align: 'center', outline: p.outline || '#1a1410', scale: p.scale || 1, font: p.font }); ctx.globalAlpha = 1; break; }
        default: { ctx.globalAlpha = fade; rect(ctx, p.x, p.y, p.size, p.size, p.color); ctx.globalAlpha = 1; }
      }
    }
  }
  text(x, y, text, color, opts = {}) { return this.add({ x, y, vx: opts.vx || 0, vy: opts.vy != null ? opts.vy : -24, life: opts.life || 0.9, color, kind: 'text', text, gravity: opts.gravity || 0, scale: opts.scale, font: opts.font, outline: opts.outline }); }
}
class Shake {
  constructor() { this.t = 0; this.mag = 0; this.x = 0; this.y = 0; }
  hit(mag = 3, dur = 0.2) { this.mag = Math.max(this.mag, mag); this.t = Math.max(this.t, dur); }
  update(dt) { if (this.t > 0) { this.t -= dt; const m = this.mag * clamp(this.t / 0.2, 0, 1); this.x = Math.round((Math.random() - 0.5) * 2 * m); this.y = Math.round((Math.random() - 0.5) * 2 * m); if (this.t <= 0) { this.mag = 0; this.x = 0; this.y = 0; } } }
}
// Global wind: slowly varying value in [-1, 1] with gusts
class Wind {
  constructor(seed = 1) { this.t = seed; this.v = 0; this.gust = 0; }
  update(dt) { this.t += dt; this.gust = Math.max(0, this.gust - dt * 0.6); if (Math.random() < dt * 0.15) this.gust = 0.6 + Math.random() * 0.6; this.v = Math.sin(this.t * 0.35) * 0.5 + Math.sin(this.t * 1.3) * 0.25 + this.gust * Math.sin(this.t * 4); }
  get px() { return this.v * 40; }          // pixels/sec drift for particles
  frame(offset = 0) { return ((Math.round((this.v + 1) * 1.49) + offset) % 3 + 3) % 3; } // 0..2 tree sway frame
}
// Lightweight tween list
class Tweens {
  constructor() { this.list = []; }
  add(obj, key, to, dur, ease = easeOut, done) { this.list.push({ obj, key, from: obj[key], to, dur, t: 0, ease, done }); }
  update(dt) { for (const tw of this.list) { tw.t += dt; const k = clamp(tw.t / tw.dur, 0, 1); tw.obj[tw.key] = lerp(tw.from, tw.to, tw.ease(k)); if (k >= 1 && tw.done) { tw.done(); tw.done = null; } } this.list = this.list.filter(t => t.t < t.dur); }
}
// Sky gradient by time of day 0..1 (0 morning, 0.5 sunset, 1 night)
function skyColors(t) {
  const stops = [
    [0.0, ['#7ec0ee', '#dbeeff']], [0.35, ['#6aa8e0', '#f2d8b8']], [0.55, ['#e07a5a', '#f8c890']], [0.75, ['#3a2a6a', '#c05070']], [1.0, ['#0a0a24', '#2a2a58']],
  ];
  for (let i = 0; i < stops.length - 1; i++) { const [a, ca] = stops[i], [b, cb] = stops[i + 1]; if (t >= a && t <= b) { const k = (t - a) / (b - a); return [mixColor(ca[0], cb[0], k), mixColor(ca[1], cb[1], k)]; } }
  return stops[stops.length - 1][1];
}

// ---------- Scene transitions ----------
// kinds: 'iris', 'curtain', 'slideL', 'slideR', 'fade', 'vinyl', 'bars'
class Transition {
  constructor() { this.t = 0; this.dur = 0; this.kind = 'fade'; this.phase = 'idle'; this.mid = null; this.label = null; }
  get active() { return this.phase !== 'idle'; }
  start(kind, mid, opts = {}) { this.kind = kind || 'fade'; this.dur = opts.dur || 0.42; this.t = 0; this.phase = 'out'; this.mid = mid; this.label = opts.label || null; this.color = opts.color || '#0a0814'; }
  update(dt) {
    if (this.phase === 'idle') return;
    this.t += dt;
    if (this.phase === 'out' && this.t >= this.dur) { this.t = 0; this.phase = 'in'; if (this.mid) { const f = this.mid; this.mid = null; f(); } }
    else if (this.phase === 'in' && this.t >= this.dur) { this.phase = 'idle'; this.t = 0; }
  }
  draw(ctx) {
    if (this.phase === 'idle') return;
    const k = clamp(this.t / this.dur, 0, 1), cover = this.phase === 'out' ? k : 1 - k;
    const c = this.color;
    switch (this.kind) {
      case 'iris': {
        const maxR = Math.hypot(W, H) / 2 + 10, r = maxR * (1 - easeInOut(cover));
        ctx.fillStyle = c; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(W / 2, H / 2, Math.max(0, r), 0, Math.PI * 2, true); ctx.fill();
        ringPx(ctx, W / 2, H / 2, Math.max(0, r), '#ffd24a'); break;
      }
      case 'curtain': {
        const h = H / 2 * easeInOut(cover);
        vgrad(ctx, 0, 0, W, h, '#6a1020', '#3a0812'); vgrad(ctx, 0, H - h, W, h, '#3a0812', '#6a1020');
        for (let x = 0; x < W; x += 16) { ctx.globalAlpha = 0.25; rect(ctx, x, 0, 6, h, '#2a0610'); rect(ctx, x + 8, H - h, 6, h, '#2a0610'); ctx.globalAlpha = 1; }
        rect(ctx, 0, h - 3, W, 3, '#d9a520'); rect(ctx, 0, H - h, W, 3, '#d9a520'); break;
      }
      case 'slideL': case 'slideR': {
        const dir = this.kind === 'slideL' ? -1 : 1, x = dir * W * (1 - easeInOut(cover));
        rect(ctx, x, 0, W, H, c);
        for (let i = 0; i < 6; i++) rect(ctx, x + (dir > 0 ? -6 - i * 5 : W + i * 5), 0, 4, H, withAlpha('#ffd24a', 0.1 + i * 0.03)); break;
      }
      case 'vinyl': {
        const r = Math.hypot(W, H) / 2 * easeInOut(cover), cx = W / 2, cy = H / 2;
        circle(ctx, cx, cy, r, '#14121c');
        for (let rr = 10; rr < r; rr += 7) ringPx(ctx, cx, cy, rr, '#1e1b28');
        if (r > 30) { circle(ctx, cx, cy, 24, '#d9a520'); circle(ctx, cx, cy, 4, '#14121c'); }
        break;
      }
      case 'bars': { const n = 10, bh = H / n; for (let i = 0; i < n; i++) { const w = W * easeInOut(clamp(cover * 1.6 - i * 0.06, 0, 1)); rect(ctx, i % 2 ? W - w : 0, i * bh, w, bh + 1, c); } break; }
      default: { ctx.globalAlpha = cover; rect(ctx, 0, 0, W, H, c); ctx.globalAlpha = 1; }
    }
    if (this.label && cover > 0.55) { ctx.globalAlpha = clamp((cover - 0.55) / 0.4, 0, 1); drawText(ctx, this.label, W / 2, H / 2 - 10, '#ffd24a', { align: 'center', scale: 3, outline: '#5a2a10' }); ctx.globalAlpha = 1; }
  }
}
// Cartoon helpers
function bounceScale(t, amp = 0.18, freq = 9) { return 1 + Math.sin(t * freq) * amp * Math.exp(-t * 4); }
function squashOnLand(t) { return t < 0.12 ? 1 - (0.12 - t) * 2.2 : 1; }
function popIn(t, dur = 0.3) { return clamp(easeOutBack(clamp(t / dur, 0, 1)), 0, 1.3); }
function drawDust(fx, x, y, n = 6, col = '#e8e0d0') { for (let i = 0; i < n; i++) fx.add({ x, y, vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 30, life: 0.4, color: col, kind: 'smoke', size: 2, grow: 4, alpha: 0.6, gravity: 40 }); }

// ---- cinematic helpers ----
function vignette(ctx, strength = 0.45, color = '#050409') {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, withAlpha(color, strength));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function letterbox(ctx, h, alpha = 1) {
  if (h <= 0) return; ctx.globalAlpha = alpha; rect(ctx, 0, 0, W, h, '#07060c'); rect(ctx, 0, H - h, W, h, '#07060c'); ctx.globalAlpha = 1;
}
// warm pool of light from a source, drawn additively
function lightPool(ctx, x, y, r, color, alpha = 0.22) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(color, alpha)); g.addColorStop(1, withAlpha(color, 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// slow drifting motes: purely decorative, seeded so they are stable
class Motes {
  constructor(n = 26, seed = 5, opts = {}) {
    const r = makeRng(seed); this.m = []; this.o = opts;
    for (let i = 0; i < n; i++) this.m.push({ x: r.range(0, W), y: r.range(0, H), s: r.range(0.6, 2.2), vx: r.range(-7, 7), vy: r.range(-13, -3), p: r.range(0, 6.3) });
  }
  update(dt, t) { for (const m of this.m) { m.x += m.vx * dt; m.y += m.vy * dt; if (m.y < -6) { m.y = H + 4; m.x = Math.random() * W; } if (m.x < -6) m.x = W + 4; if (m.x > W + 6) m.x = -4; } }
  draw(ctx, t, color = '#ffe8b0') {
    for (const m of this.m) { ctx.globalAlpha = 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(t * 1.7 + m.p)); circle(ctx, m.x, m.y, m.s, color); }
    ctx.globalAlpha = 1;
  }
}

// vignette confined to a rectangle (for scenes drawn into a clipped band)
function vignetteRect(ctx, x, y, w, h, strength = 0.4, color = '#050409') {
  const cx = x + w / 2, cy = y + h / 2;
  const g = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.3, cx, cy, Math.max(w, h) * 0.66);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, withAlpha(color, strength));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}
// warm/cool colour grade over a rectangle
function grade(ctx, x, y, w, h, color, alpha = 0.08, mode = 'overlay') {
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(x, y, w, h); ctx.restore();
}

// ---------- Camera: push in, drift and kick during a set ----------
class Camera {
  constructor() { this.zoom = 1; this.tz = 1; this.x = 0; this.y = 0; this.tx = 0; this.ty = 0; this.roll = 0; this.troll = 0; this.kick = 0; }
  push(z, x, y, roll) { this.tz = z; this.tx = x || 0; this.ty = y || 0; this.troll = roll || 0; }
  reset() { this.push(1, 0, 0, 0); }
  hit(n) { this.kick = Math.max(this.kick, n); }
  update(dt) {
    const k = Math.min(1, dt * 5);
    this.zoom += (this.tz - this.zoom) * k;
    this.x += (this.tx - this.x) * k; this.y += (this.ty - this.y) * k;
    this.roll += (this.troll - this.roll) * k;
    this.kick = Math.max(0, this.kick - dt * 4);
  }
  // Wrap a draw in the current camera. cx/cy is what stays put on screen.
  apply(ctx, cx, cy) {
    const z = this.zoom * (1 + this.kick * 0.04);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(this.roll); ctx.scale(z, z); ctx.translate(-cx - this.x, -cy - this.y);
  }
  done(ctx) { ctx.restore(); }
}
// ---------- Comic effects ----------
// A jagged impact star with a word in it.
function comicBurst(ctx, x, y, text, color, t, scale = 1) {
  const k = clamp(t, 0, 1), pop = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8 * 0.25;
  const s = scale * pop, spikes = 11, r1 = 30 * s, r2 = 17 * s;
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(Math.sin(t * 3) * 0.05);
  ctx.globalAlpha = clamp(1.3 - k * 1.3, 0, 1);
  const path = (r, rr, col) => {
    ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / spikes, rad = i % 2 ? rr : r;
      const px2 = Math.round(Math.cos(a) * rad), py = Math.round(Math.sin(a) * rad);
      if (i === 0) ctx.moveTo(px2, py); else ctx.lineTo(px2, py); }
    ctx.closePath(); ctx.fill();
  };
  path(r1 + 3, r2 + 3, '#1a1410');
  path(r1, r2, color);
  path(r1 * 0.62, r2 * 0.62, lighten(color, 0.3));
  drawText(ctx, text, 0, -Math.round(4 * s), '#1a1410', { align: 'center', scale: Math.max(1, Math.round(2 * s)) });
  ctx.globalAlpha = 1; ctx.restore();
}
// Radiating speed lines, for the moments that need to feel fast.
function speedLines(ctx, x, y, r0, r1, n, color, t, alpha = 0.5) {
  ctx.save(); ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + t * 0.6, len = r1 * (0.6 + ((i * 37) % 10) / 14);
    const x0 = x + Math.cos(a) * r0, y0 = y + Math.sin(a) * r0;
    const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
    ctx.strokeStyle = color; ctx.lineWidth = 1 + (i % 3); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.lineWidth = 1; ctx.globalAlpha = 1; ctx.restore();
}
// A halftone dot field, the cheap trick that makes anything look like a comic.
function halftone(ctx, x, y, w, h, color, step = 6, alpha = 0.18) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  for (let yy = y; yy < y + h; yy += step) for (let xx = x + ((yy / step) % 2 ? step / 2 : 0); xx < x + w; xx += step) {
    const k = 1 - (yy - y) / h; const r = Math.max(0, Math.round(k * (step / 2.4)));
    if (r > 0) ctx.fillRect(Math.round(xx), Math.round(yy), r, r);
  }
  ctx.globalAlpha = 1; ctx.restore();
}
// An angled inset panel, like a comic cut-in.
function comicPanel(ctx, x, y, w, h, angle, draw) {
  ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(angle); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(10,8,14,0.5)'; ctx.fillRect(6, 8, w, h);
  rect(ctx, -3, -3, w + 6, h + 6, '#f4ecd6');
  rect(ctx, 0, 0, w, h, '#1a1622');
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, w, h); ctx.clip();
  draw(ctx, w, h);
  ctx.restore();
  ctx.restore();
}
