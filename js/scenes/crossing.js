// ---------- The crossing ----------
// Four of them, in a line, over the Shibuya scramble. It is the shot every
// band takes, and Tokyo has the most famous crossing on earth to take it on.
'use strict';
class CrossingScene {
  constructor(next) {
    this.t = 0; this.next = next || (() => new CityScene(true)); this.left = false;
    this.rng = makeRng(8181);
    // the other three hundred people crossing at the same time
    this.walkers = [];
    for (let i = 0; i < 46; i++) this.walkers.push({
      spec: randomBugSpec(makeRng(7000 + i)),
      x: this.rng.range(-120, W + 120), y: this.rng.chance(0.78) ? this.rng.range(262, 352) : this.rng.range(486, 520),
      vx: this.rng.chance(0.5) ? this.rng.range(24, 54) : -this.rng.range(24, 54),
      o: this.rng.range(0, 6), sc: this.rng.range(0.9, 1.3),
    });
    this.dur = 11.5;
  }
  skip() { if (this.left) return; this.left = true; Game.run && Game.run.save(); Game.go(this.next, 'fade', { dur: 0.7 }); }
  update(dt) {
    this.t += dt;
    for (const w of this.walkers) { w.x += w.vx * dt; if (w.x < -140) w.x = W + 130; if (w.x > W + 140) w.x = -130; }
    if (this.t > this.dur) this.skip();
  }
  key(code) { if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(code)) this.skip(); }
  click() { this.skip(); }
  draw(ctx) {
    const t = this.t, r = Game.run;
    // the walk: they come in from the left and cross the whole frame
    const k = clamp((t - 1.2) / 8.4, 0, 1);
    const baseX = lerp(-140, W + 150, k);
    // ---- the far side of the crossing: towers, screens, neon
    const [c1, c2] = skyColors(0.86); vgrad(ctx, 0, 0, W, 300, c1, c2);
    ctx.drawImage(skylineCanvas(23, W, 120, { color: '#241f3a', lit: '#ffe6a0', tall: true, density: 0.3 }), 0, 90);
    // the buildings facing the crossing, with their big screens
    const faces = [[0, 210], [214, 180], [400, 250], [656, 190], [852, 160]];
    faces.forEach(([fx, fw], i) => {
      const fh = 230 - (i % 2) * 34, fy = 196 - fh;
      rect(ctx, fx, fy, fw, fh + 80, '#1d1930'); rect(ctx, fx, fy, fw, 4, '#3a3352');
      // a screen on the front of it, playing something
      const sw = fw - 28, sh = Math.round(fh * 0.5), sx = fx + 14, sy = fy + 20;
      rect(ctx, sx, sy, sw, sh, '#0c0a18'); frame(ctx, sx, sy, sw, sh, '#453e66');
      const hue = ['#ff5a9a', '#8ad8ff', '#ffd24a', '#6be585', '#c58bff'][i];
      ctx.globalAlpha = 0.85;
      for (let b2 = 0; b2 < 5; b2++) { const bh = ((Math.sin(t * 2 + b2 + i) + 1) / 2) * sh * 0.8;
        rect(ctx, sx + 6 + b2 * ((sw - 12) / 5), sy + sh - 6 - bh, Math.max(2, (sw - 12) / 5 - 4), bh, hue); }
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.12; rect(ctx, sx, sy, sw, sh, hue); ctx.globalAlpha = 1;
      // vertical signage down the side
      for (let s2 = 0; s2 < 4; s2++) { const gy = fy + sh + 30 + s2 * 26;
        rect(ctx, fx + 6, gy, 18, 22, ['#c8302a', '#e0b040', '#2a5ab8', '#3f9a52'][(i + s2) % 4]);
        rect(ctx, fx + 8, gy + 2, 14, 18, '#12101c'); }
      // windows
      for (let wy = fy + sh + 26; wy < fy + fh + 70; wy += 12) for (let wx = fx + 34; wx < fx + fw - 10; wx += 10)
        if ((wx + wy) % 3) rect(ctx, wx, wy, 6, 7, ((wx * 7 + wy) % 5) ? '#2a2440' : '#ffe6a0');
    });
    // ---- the crossing itself
    rect(ctx, 0, 196, W, 40, '#2a2a34');                      // the far kerb
    rect(ctx, 0, 232, W, 4, '#d8d2c4');
    rect(ctx, 0, 236, W, H - 236, '#33333e');                 // the road
    // the painted stripes, in both directions, because it is a scramble
    for (let x = -40; x < W + 40; x += 46) { ctx.globalAlpha = 0.92; rect(ctx, x, 244, 28, H - 250, '#e8e6dc'); ctx.globalAlpha = 1; }
    // and the diagonal one straight across the middle, which is the bit that
    // makes a scramble a scramble
    ctx.save(); ctx.beginPath(); ctx.rect(0, 240, W, H - 240); ctx.clip();
    ctx.translate(W / 2, 396); ctx.rotate(-0.62);
    ctx.globalAlpha = 0.9; ctx.fillStyle = '#e8e6dc';
    for (let i = -9; i < 9; i++) ctx.fillRect(i * 52 - 13, -74, 26, 148);
    ctx.globalAlpha = 1; ctx.restore();
    ctx.globalAlpha = 0.18; rect(ctx, 0, 236, W, H - 236, '#1a1a26'); ctx.globalAlpha = 1;
    // stopped traffic either side, headlights on
    for (const [cx2, flip] of [[-30, false], [W - 60, true]]) {
      ctx.drawImage(propCanvas('taxi'), cx2, 250, 96, 44);
      ctx.globalAlpha = 0.3; ellipsePx(ctx, cx2 + (flip ? 8 : 88), 276, 30, 10, '#ffe6a0'); ctx.globalAlpha = 1;
    }
    // everybody else, held back behind the band so the shot still reads
    for (const w of this.walkers) {
      if (w.y > 460) continue;
      ctx.globalAlpha = 0.72;
      drawShadow(ctx, w.x, w.y, 20 * w.sc, 0.18);
      drawBugAt(ctx, w.spec, w.x, w.y + Math.round(Math.sin(t * 6 + w.o) * 2), {
        pose: Math.floor(t * 6 + w.o) % 2 ? 'walk1' : 'walk2', scale: 1.0 * w.sc, flip: w.vx < 0 });
      ctx.globalAlpha = 1;
    }
    // a couple of phone flashes going off in the crowd, because it is them
    for (let i = 0; i < 3; i++) {
      const ft = (t * 0.7 + i * 0.41) % 1;
      if (ft > 0.08) continue;
      const fx2 = 120 + ((i * 331) % (W - 240)), fy2 = 280 + (i * 37) % 60;
      ctx.globalAlpha = 1 - ft / 0.08;
      circle(ctx, fx2, fy2, 7, '#fffbe8'); ctx.globalAlpha = 1;
    }
    // ---- the band, in a line, in step
    const members = (r && r.members.length ? r.members : ROSTER.map(x => ({ spec: HERO_PRESETS[x.key], instrument: x.instrument })));
    members.slice(0, 5).forEach((m, i) => {
      const x = baseX - i * 96, y = 432 + (i % 2) * 3;
      if (x < -90 || x > W + 90) return;
      // the lamps over the crossing throw a long shadow back down the road
      ctx.globalAlpha = 0.2; ctx.fillStyle = '#0a0a12';
      ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.lineTo(x + 14, y);
      ctx.lineTo(x - 34, y + 62); ctx.lineTo(x - 62, y + 62); ctx.fill(); ctx.globalAlpha = 1;
      drawShadow(ctx, x, y, 40, 0.38);
      drawBugAt(ctx, m.spec, x, y + Math.round(Math.sin(t * 6 + i * 1.7) * 2), {
        pose: Math.floor(t * 6 + i * 1.7) % 2 ? 'walk1' : 'walk2',
        instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.95 });
    });
    // the near kerb, dark across the bottom, so the frame has a foreground
    rect(ctx, 0, H - 26, W, 26, '#1b1b26');
    rect(ctx, 0, H - 26, W, 3, '#d8d2c4');
    // ---- the frame
    letterbox(ctx, 54, 1);
    vignette(ctx, 0.42);
    grade(ctx, 0, 0, W, H, '#4a2a8a', 0.08);
    // the title, printed over it the way a sleeve is
    const tk = clamp((t - 2.2) / 0.8, 0, 1);
    if (tk > 0) {
      const fade = tk * clamp((this.dur - 1 - t) * 1.4, 0, 1);
      // a black band under it: the buildings behind are far too busy to print
      // a title straight over
      const tw = textWidth('BUG BUSKER ORCHESTRA', { scale: 4 }) + 64;
      ctx.globalAlpha = fade * 0.82; rect(ctx, W / 2 - tw / 2, 58, tw, 72, '#0a0812'); ctx.globalAlpha = fade;
      rect(ctx, W / 2 - tw / 2, 58, tw, 2, '#e03a4a'); rect(ctx, W / 2 - tw / 2, 128, tw, 2, '#e03a4a');
      drawText(ctx, 'BUG BUSKER ORCHESTRA', W / 2, 72, '#f6f2e6', { align: 'center', scale: 4, outline: '#12101c' });
      drawText(ctx, 'SHIBUYA CROSSING, 11:40PM', W / 2, 108, '#e0a0a8', { align: 'center', scale: 2, outline: '#12101c' });
      ctx.globalAlpha = 1;
    }
    drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', W - 16, H - 30, '#6a6488', { align: 'right', font: 'small' });
  }
}
