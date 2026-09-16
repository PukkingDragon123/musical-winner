// ---------- The shot that opens the game ----------
// A drone above Tokyo at night, the dome lit up below, coming down and in
// while somebody tells you what you are looking at. Then it goes through the
// roof and you are inside.
'use strict';
class DroneScene {
  constructor(next) {
    this.t = 0; this.next = next || (() => new SelectScene());
    this.left = false;
    this.rng = makeRng(4242);
    // the city under the drone: a field of blocks with lit windows
    this.blocks = [];
    for (let i = 0; i < 190; i++) this.blocks.push({
      x: this.rng.range(-1.2, 1.2), z: this.rng.range(0.12, 1), w: this.rng.range(0.02, 0.07),
      h: this.rng.range(0.05, 0.3), lit: this.rng.range(0.1, 0.5), hue: this.rng.int(0, 3),
    });
    this.cars = []; for (let i = 0; i < 26; i++) this.cars.push({ x: this.rng.range(-1.2, 1.2), z: this.rng.range(0.2, 1), s: this.rng.range(0.05, 0.18), c: this.rng.chance(0.5) ? '#ffe6a0' : '#ff8a7a' });
    // what the narrator says, and when
    this.lines = [
      [0.4, 'TOKYO. ELEVEN AT NIGHT.'],
      [3.2, 'FIFTY-FIVE THOUSAND OF THEM IN THERE.'],
      [6.2, 'ALL OF THEM HERE FOR ONE BAND.'],
      [9.4, 'THIS IS THE LAST GOOD NIGHT.'],
    ];
    this.dur = 13.2;
  }
  skip() { if (this.left) return; this.left = true; Game.go(this.next, 'fade', { dur: 0.7 }); }
  update(dt) {
    this.t += dt;
    if (this.t > this.dur) this.skip();
  }
  key(code) { if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(code)) this.skip(); }
  click() { this.skip(); }
  draw(ctx) {
    const t = this.t, k = clamp(t / this.dur, 0, 1);
    // the descent: high and wide, then low and tight on the dome
    const alt = 1 - easeInOut(clamp(t / 10.5, 0, 1));          // 1 high, 0 low
    const zoom = lerp(0.62, 3.4, easeInOut(clamp(t / 10.5, 0, 1)));
    // night sky and a horizon that rises as you come down
    const horizon = lerp(60, 250, 1 - alt);
    vgrad(ctx, 0, 0, W, horizon, '#0a0a1e', '#241a3e');
    for (let i = 0; i < 90; i++) { const sx = (i * 173) % W, sy = (i * 61) % Math.max(1, horizon - 6); if (Math.sin(t * 2 + i) > 0.2) px(ctx, sx, sy, i % 4 ? '#8a86b0' : '#fff'); }
    // the city floor, in a cheap perspective: further blocks smaller and higher
    vgrad(ctx, 0, horizon, W, H - horizon, '#171232', '#0b0818');
    const cx = W / 2, vy = horizon;
    const proj = (o) => { const d = o.z * (0.35 + alt * 0.9); const sc = zoom / (d + 0.22); return { x: cx + o.x * sc * 300, y: vy + (1 / (d + 0.22)) * 46 * zoom, sc }; };
    const drawn = this.blocks.map(b => ({ b, p: proj(b) })).sort((a, b2) => a.p.sc - b2.p.sc);
    for (const { b, p } of drawn) {
      const w = Math.max(2, b.w * p.sc * 300), h = Math.max(3, b.h * p.sc * 380);
      if (p.y < horizon - 4 || p.y > H + 200 || p.x < -200 || p.x > W + 200) continue;
      const base = ['#2a2440', '#241f38', '#2e2748', '#201c30'][b.hue];
      rect(ctx, p.x - w / 2, p.y - h, w, h, base);
      rect(ctx, p.x - w / 2, p.y - h, w, Math.max(1, h * 0.06), lighten(base, 0.2));
      // lit windows, denser on the nearer towers
      // sparse, so the towers read as towers instead of one lit wall
      const cols = Math.max(1, Math.floor(w / 6)), rows = Math.max(1, Math.floor(h / 8));
      for (let r2 = 0; r2 < rows; r2++) for (let c2 = 0; c2 < cols; c2++) {
        if (((r2 * 7 + c2 * 13 + b.hue * 3) % 9) > b.lit * 9) continue;
        rect(ctx, p.x - w / 2 + 2 + c2 * 6, p.y - h + 3 + r2 * 8, 2, 3, (r2 + c2) % 7 ? '#ffe6a0' : '#8ad8ff');
      }
      // a dark side, so each block has a silhouette
      ctx.globalAlpha = 0.45; rect(ctx, p.x + w / 2 - Math.max(1, w * 0.22), p.y - h, Math.max(1, w * 0.22), h, '#0d0a18'); ctx.globalAlpha = 1;
    }
    // traffic, threads of light along the grid
    for (const c of this.cars) {
      const p = proj(c); const along = ((t * c.s + c.x) % 2) - 1;
      const px2 = cx + along * p.sc * 300;
      if (p.y < horizon || p.y > H) continue;
      rect(ctx, px2, p.y - 2, Math.max(1, Math.round(p.sc * 3)), 1, c.c);
    }
    // ---- the dome, growing the whole way in
    const dscale = zoom * 0.9, dy = vy + (1 / (0.34 + alt * 0.9 + 0.22)) * 46 * zoom - 10;
    const dw = 96 * dscale, dh = 44 * dscale;
    // the ring of floodlights round it
    ctx.globalAlpha = 0.16 + 0.06 * Math.sin(t * 3);
    ellipsePx(ctx, cx, dy, dw * 1.5, dh * 1.5, '#8ad8ff'); ctx.globalAlpha = 1;
    ellipsePx(ctx, cx, dy + dh * 0.1, dw, dh * 1.05, '#1a1a2e');
    ellipsePx(ctx, cx, dy, dw, dh, '#cfd6e8');
    ellipsePx(ctx, cx, dy - dh * 0.1, dw * 0.94, dh * 0.86, '#e8eef8');
    // the panelled roof
    for (let i = -5; i <= 5; i++) { ctx.globalAlpha = 0.25; line(ctx, cx + i * dw / 6, dy - dh * 0.1, cx + i * dw / 9, dy + dh * 0.5, '#9aa4bc'); ctx.globalAlpha = 1; }
    for (let i = 1; i < 3; i++) { ctx.globalAlpha = 0.2; ellipseRingPx(ctx, cx, dy - dh * 0.1, dw * (1 - i * 0.3), dh * (0.86 - i * 0.26), '#9aa4bc'); ctx.globalAlpha = 1; }
    // the skirt and the lit concourse under it
    rect(ctx, cx - dw, dy + dh * 0.5, dw * 2, Math.max(2, dh * 0.5), '#2a2a3e');
    for (let i = 0; i < 26; i++) rect(ctx, cx - dw + i * (dw * 2 / 26), dy + dh * 0.62, Math.max(1, dw / 26), Math.max(1, dh * 0.2), i % 2 ? '#ffd24a' : '#ffb340');
    // searchlights sweeping off the roof
    for (let i = 0; i < 3; i++) {
      const a = t * 0.55 + i * 2.1, len = 240 * dscale;
      ctx.globalAlpha = 0.11;
      ctx.fillStyle = ['#8ad8ff', '#ffd24a', '#ff8ad8'][i];
      ctx.beginPath(); ctx.moveTo(cx, dy);
      ctx.lineTo(cx + Math.cos(a) * len, dy - Math.abs(Math.sin(a)) * len - 40);
      ctx.lineTo(cx + Math.cos(a + 0.12) * len, dy - Math.abs(Math.sin(a + 0.12)) * len - 40);
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    }
    // a blimp, because there is always one
    const bx = ((t * 26) % (W + 200)) - 100;
    if (alt > 0.3) { ctx.globalAlpha = alt; ellipsePx(ctx, bx, 64, 22, 8, '#3a3450'); ellipsePx(ctx, bx, 62, 21, 7, '#59527a'); rect(ctx, bx - 6, 70, 12, 4, '#2a2438');
      drawText(ctx, 'MONARCH', bx, 59, '#ffd24a', { align: 'center', font: 'small' }); ctx.globalAlpha = 1; }
    // ---- the finish: through the roof
    if (t > 11) { ctx.globalAlpha = clamp((t - 11) / 1.6, 0, 1); rect(ctx, 0, 0, W, H, '#f6f2ff'); ctx.globalAlpha = 1; }
    // ---- the frame it is all shot in
    letterbox(ctx, 58, 1);
    vignette(ctx, 0.5);
    // a drone HUD, because that is what sells the shot
    ctx.globalAlpha = 0.5;
    for (const [dx, dy2] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const hx = W / 2 + dx * 150, hy = H / 2 + dy2 * 84;
      rect(ctx, hx - dx * 14, hy, 14, 2, '#8ad8ff'); rect(ctx, hx, hy - dy2 * 12, 2, 12, '#8ad8ff');
    }
    drawText(ctx, 'ALT ' + Math.round(20 + alt * 380) + 'M', 22, 70, '#8ad8ff', { font: 'small' });
    drawText(ctx, 'REC', W - 46, 70, Math.sin(t * 4) > 0 ? '#ff5a5a' : '#6a2a2a', { font: 'small' });
    ctx.globalAlpha = 1;
    // ---- the narrator. Not called `line`: that is the global that draws one,
    // and a local of the same name puts it in the dead zone for the whole
    // function, which took out every stroke above it.
    let say = null;
    for (const [at, txt] of this.lines) if (t >= at && t < at + 3.0) say = [at, txt];
    if (say) {
      const lt = t - say[0], fade = clamp(lt / 0.4, 0, 1) * clamp((3.0 - lt) / 0.5, 0, 1);
      const chars = Math.floor(lt * 34);
      ctx.globalAlpha = fade;
      drawText(ctx, say[1].slice(0, chars), W / 2, H - 92, '#f2ecff', { align: 'center', scale: 3, outline: '#12101c' });
      ctx.globalAlpha = 1;
    }
    drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', W - 16, H - 34, '#5a5478', { align: 'right', font: 'small' });
  }
}
