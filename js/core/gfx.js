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
