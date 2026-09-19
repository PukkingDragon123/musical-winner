// ---------- A crowd of bugs, however many you need ----------
// Close up they are the same bugs as everybody else. Further back they become
// silhouettes — but silhouettes with shape to them: horns, antennae, wing
// cases, tall ones, round ones. That is what lets a stadium hold forty
// thousand of them without turning into soup.
'use strict';
function makeBugCrowd(n, seed, opts = {}) {
  const r = makeRng(seed >>> 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    // These are the same bugs as everybody else in the game. Each one gets a
    // real spec, so the shape you see in the back row is a shape that could
    // have walked past you in the street.
    const spec = randomBugSpec(makeRng((seed >>> 0) + i * 2654435761));
    out.push({
      spec,
      h: r.range(0.85, 1.3),
      o: r.range(0, 6.3),
      hype: r.range(0.75, 1.25),
      glow: r.chance(opts.glowRate != null ? opts.glowRate : 0.34) ? r.pick(['#ffd24a', '#8ad8ff', '#ff5a9a', '#6be585', '#c58bff']) : null,
      dark: r.pick(opts.cols || ['#241d33', '#2e2542', '#1b1728', '#382c50']),
      flip: r.chance(0.5),
      x: 0, y: 0, s: 16,
    });
  }
  return out;
}
// The same sprite, flattened to one colour. Cached per bug and per shade, so a
// crowd of two hundred costs two hundred small canvases once and nothing after.
function bugShadowCanvas(spec, pose, col) {
  const src = bugCanvas(spec, pose, null, null);
  return cached('bugsil|' + (spec.name || '') + JSON.stringify(spec) + '|' + pose + '|' + col, () => {
    const c = makeCanvas(src.width, src.height), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-in';
    x.fillStyle = col; x.fillRect(0, 0, c.width, c.height);
    return c;
  });
}
// one member of the crowd. `s` is roughly how tall they are on screen: 40 is
// somebody in the front row, 12 is somebody a long way back.
function drawBugSilhouette(ctx, b, x, y, s, t, mood = 'happy', detail = 0) {
  const bounce = mood === 'flat' ? 0 : Math.sin(t * 5 * b.hype + b.o);
  const up = bounce < -0.35 && mood !== 'flat';
  const yy = y + (mood === 'flat' ? 0 : bounce * s * 0.1);
  const pose = mood === 'flat' ? 'idle' : up ? 'cheer' : (Math.floor(t * 4 * b.hype + b.o) % 2 ? 'idle' : 'idle2');
  // near enough to make out: the bug as it really is. Further back: the same
  // sprite as a solid shape, which keeps every silhouette a real silhouette.
  ctx.globalAlpha = 0.24; ellipsePx(ctx, x, y + s * 0.42, s * 0.3, s * 0.1, '#000'); ctx.globalAlpha = 1;
  if (detail > 0) {
    drawBugAt(ctx, b.spec, x, y + s * 0.42, { pose, scale: s / 34 * b.h, flip: b.flip, bounce: 0, t, phase: b.o });
  } else {
    const c = bugShadowCanvas(b.spec, pose, b.dark);
    const sc = s / 34 * b.h;
    const w = Math.max(2, Math.round(c.width * sc)), h = Math.max(3, Math.round(c.height * sc));
    const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
    if (b.flip) { ctx.save(); ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(c, Math.round(-w / 2), Math.round(yy + s * 0.42 - h), w, h); ctx.restore(); }
    else ctx.drawImage(c, Math.round(x - w / 2), Math.round(yy + s * 0.42 - h), w, h);
    ctx.imageSmoothingEnabled = sm;
  }
  // and the light stick, which is the only colour in the back rows
  if (b.glow && mood !== 'flat') {
    const wag = Math.sin(t * 3 + b.o) * s * 0.07;
    const gx = x + s * 0.3 * (b.flip ? -1 : 1) + wag, gy = yy + (up ? -s * 0.28 : -s * 0.02);
    const gw = Math.max(1, Math.round(s * 0.07));
    rect(ctx, gx, gy, gw, s * 0.3, b.glow);
    rect(ctx, gx, gy, gw, s * 0.1, '#fff8e0');
    ctx.globalAlpha = 0.18; circle(ctx, gx, gy + s * 0.12, s * 0.16, b.glow); ctx.globalAlpha = 1;
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
