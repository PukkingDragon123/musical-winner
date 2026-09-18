// ---------- A crowd of bugs, however many you need ----------
// Close up they are the same bugs as everybody else. Further back they become
// silhouettes — but silhouettes with shape to them: horns, antennae, wing
// cases, tall ones, round ones. That is what lets a stadium hold forty
// thousand of them without turning into soup.
'use strict';
const BUG_SHAPES = ['beetle', 'stag', 'moth', 'mantis', 'roach', 'ladybug', 'cricket', 'rhino'];
function makeBugCrowd(n, seed, opts = {}) {
  const r = makeRng(seed >>> 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({
      shape: r.pick(BUG_SHAPES),
      h: r.range(0.8, 1.35),                 // how tall they are
      o: r.range(0, 6.3),                    // where they are in the bounce
      hype: r.range(0.7, 1.3),
      col: r.pick(opts.cols || ['#1b1728', '#231b38', '#2b2246', '#322648', '#141020']),
      glow: r.chance(opts.glowRate != null ? opts.glowRate : 0.34) ? r.pick(['#ffd24a', '#8ad8ff', '#ff5a9a', '#6be585', '#c58bff']) : null,
      arms: r.chance(0.5),
      x: 0, y: 0, z: 0,
    });
  }
  return out;
}
// one bug, as a solid shape. `s` is pixels per unit: about 8 is a distant
// silhouette, 20 is somebody you could talk to.
function drawBugSilhouette(ctx, b, x, y, s, t, mood = 'happy', detail = 0) {
  const bounce = mood === 'flat' ? 0 : Math.sin(t * 5 * b.hype + b.o);
  const up = bounce < -0.3 && mood !== 'flat';
  const yy = y + (mood === 'flat' ? 0 : bounce * s * 0.14);
  const col = b.col, hi = lighten(col, detail > 0 ? 0.22 : 0.1);
  const bw = s * 0.52, bh = s * 0.72 * b.h;
  // the shadow it stands in
  ctx.globalAlpha = 0.22; ellipsePx(ctx, x, y + bh * 0.62, bw * 0.8, s * 0.1, '#000'); ctx.globalAlpha = 1;
  // body: a wing case with a seam
  ellipsePx(ctx, x, yy + bh * 0.16, bw * 0.62, bh * 0.44, col);
  rect(ctx, Math.round(x), Math.round(yy - bh * 0.1), 1, Math.round(bh * 0.5), darken(col, 0.4));
  // head
  const hy = yy - bh * 0.3;
  ellipsePx(ctx, x, hy, bw * 0.4, bw * 0.36, col);
  if (detail > 0) { ellipsePx(ctx, x - bw * 0.16, hy - bw * 0.06, bw * 0.1, bw * 0.1, hi); ellipsePx(ctx, x + bw * 0.16, hy - bw * 0.06, bw * 0.1, bw * 0.1, hi); }
  // what kind of bug: the bit that makes the silhouette read
  const k = s * 0.1;
  switch (b.shape) {
    case 'stag':                                   // two big jaws off the head
      rect(ctx, x - bw * 0.6, hy - k, k, k * 3, col); rect(ctx, x - bw * 0.7, hy - k * 2, k * 2, k, col);
      rect(ctx, x + bw * 0.5, hy - k, k, k * 3, col); rect(ctx, x + bw * 0.5, hy - k * 2, k * 2, k, col);
      break;
    case 'rhino':                                  // one horn, curving forward
      rect(ctx, x - k / 2, hy - bw * 0.8, k, bw * 0.6, col); rect(ctx, x - k, hy - bw * 0.95, k * 2, k, col);
      break;
    case 'moth':                                   // wings wider than the body
      ellipsePx(ctx, x - bw * 0.75, yy + bh * 0.08, bw * 0.5, bh * 0.3, col);
      ellipsePx(ctx, x + bw * 0.75, yy + bh * 0.08, bw * 0.5, bh * 0.3, col);
      rect(ctx, x - bw * 0.3, hy - bw * 0.7, k, bw * 0.6, col); rect(ctx, x + bw * 0.3, hy - bw * 0.7, k, bw * 0.6, col);
      break;
    case 'mantis':                                 // long, and folded arms up front
      rect(ctx, x - bw * 0.55, yy - bh * 0.1, k, bh * 0.3, col); rect(ctx, x - bw * 0.55, yy - bh * 0.12, bw * 0.4, k, col);
      rect(ctx, x + bw * 0.4, yy - bh * 0.1, k, bh * 0.3, col);
      break;
    case 'cricket':                                // back legs cocked
      rect(ctx, x - bw * 0.7, yy + bh * 0.2, k, bh * 0.28, col); rect(ctx, x + bw * 0.6, yy + bh * 0.2, k, bh * 0.28, col);
      break;
    case 'ladybug':
      if (detail > 0) { ellipsePx(ctx, x - bw * 0.25, yy + bh * 0.1, k, k, darken(col, 0.5)); ellipsePx(ctx, x + bw * 0.25, yy + bh * 0.24, k, k, darken(col, 0.5)); }
      break;
    case 'roach':
      ellipsePx(ctx, x, yy + bh * 0.3, bw * 0.5, bh * 0.2, darken(col, 0.25));
      break;
    default: break;
  }
  // antennae, on everybody
  rect(ctx, x - bw * 0.28, hy - bw * 0.62, k * 0.8, bw * 0.5, col);
  rect(ctx, x - bw * 0.42, hy - bw * 0.72, k * 1.4, k * 0.8, col);
  rect(ctx, x + bw * 0.2, hy - bw * 0.62, k * 0.8, bw * 0.5, col);
  rect(ctx, x + bw * 0.22, hy - bw * 0.72, k * 1.4, k * 0.8, col);
  // arms, up when the room goes up
  if (up || b.arms) {
    const ay = up ? yy - bh * 0.35 : yy + bh * 0.05;
    rect(ctx, x - bw * 0.72, ay, k, bh * 0.3, col);
    rect(ctx, x + bw * 0.62, ay, k, bh * 0.3, col);
  }
  // and a light stick in the hand of about a third of them
  if (b.glow && mood !== 'flat') {
    const wag = Math.sin(t * 3 + b.o) * s * 0.06;
    const gx = x + bw * 0.66 + wag, gy = (up ? yy - bh * 0.5 : yy - bh * 0.1);
    rect(ctx, gx, gy, Math.max(1, k * 0.9), s * 0.3, b.glow);
    rect(ctx, gx, gy, Math.max(1, k * 0.9), s * 0.1, '#fff8e0');
    if (detail > 0) { ctx.globalAlpha = 0.2; circle(ctx, gx, gy + s * 0.1, s * 0.16, b.glow); ctx.globalAlpha = 1; }
  }
}
// Lay a crowd out in an arc in front of something, packed tighter at the front.
// Returns the same array with x/y/scale filled in, sorted back to front.
function layoutCrowdArc(crowd, cx, cy, opts = {}) {
  const rows = opts.rows || 8, spread = opts.spread || 260, depth = opts.depth || 150;
  const near = opts.near || 34, far = opts.far || 9;
  const per = Math.ceil(crowd.length / rows);
  let i = 0;
  for (let row = 0; row < rows && i < crowd.length; row++) {
    const k = row / Math.max(1, rows - 1);
    const y = cy + opts.gap + k * depth;
    const w = spread * (0.5 + k * 0.9);
    const n = Math.min(per + row * 2, crowd.length - i);
    for (let j = 0; j < n; j++, i++) {
      const b = crowd[i];
      const t = n === 1 ? 0.5 : j / (n - 1);
      b.x = cx + (t - 0.5) * w + (b.o % 1 - 0.5) * 10;
      b.y = y + (b.o % 1) * 6;
      b.s = lerp(near, far, k);
      b.row = row;
    }
  }
  return crowd.slice(0, i).sort((a, b) => a.y - b.y);
}
