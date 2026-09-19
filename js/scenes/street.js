// ---------- The street outside the dome ----------
// One street, drawn once and used twice: it is what the menu sits on, and it
// is what the game opens with. Fifty thousand bugs walking the same way on a
// Friday night, the dome lit up at the end of the road, and the four of them
// crossing in front of it all.
'use strict';
const STREET_W = 2800;                 // how long the street is, before it repeats
let _streetCrowd = null;
function streetCrowd() {
  if (_streetCrowd) return _streetCrowd;
  const r = makeRng(7171);
  const out = [];
  // three lanes of pavement, the near one biggest
  for (let i = 0; i < 90; i++) {
    const lane = i % 3;
    out.push({
      spec: randomBugSpec(makeRng(9000 + i)),
      x: r.range(0, STREET_W), lane,
      sp: r.range(13, 26) + lane * 2,
      o: r.range(0, 6.3),
      // what they are carrying to a concert: a light stick, a banner on a
      // pole, a tote of merch, or nothing but their own excitement
      item: r.pick(['glow', 'glow', 'banner', 'tote', null, null, 'glow']),
      col: r.pick(['#ff5a9a', '#8ad8ff', '#ffd24a', '#6be585', '#c58bff', '#ff8a4a']),
      sc: 0.82 + lane * 0.3,
    });
  }
  _streetCrowd = out.sort((a, b) => a.lane - b.lane);
  return out;
}
// where each lane's feet land on screen
const STREET_LANE_Y = [352, 372, 398];
function drawStreetBug(ctx, m, sx, t) {
  const y = STREET_LANE_Y[m.lane];
  const bob = Math.sin(t * 6 + m.o) > 0 ? 1 : 0;
  drawShadow(ctx, sx, y, 22 * m.sc, 0.2);
  drawBugAt(ctx, m.spec, sx, y - bob, { pose: Math.floor(t * 6 + m.o) % 2 ? 'walk1' : 'walk2', scale: m.sc, bounce: 0.5 });
  const hy = y - Math.round(26 * m.sc);
  if (m.item === 'glow') {
    // a light stick, held up and waved, with a little bloom on it
    const a = Math.sin(t * 3 + m.o) * 0.5;
    const gx = sx + Math.round(12 * m.sc + a * 4), gy = hy - Math.round(a * 6);
    const gh = Math.round(18 * m.sc);
    ctx.globalAlpha = 0.2; circle(ctx, gx + 1, gy + gh / 2, Math.round(5 * m.sc), m.col); ctx.globalAlpha = 1;
    rect(ctx, gx, gy, 3, gh, m.col);
    rect(ctx, gx + 1, gy + 1, 1, gh - 2, '#fff8e8');
    rect(ctx, gx, gy + gh, 3, Math.round(4 * m.sc), '#2a2436');
  } else if (m.item === 'banner') {
    const bw = Math.round(30 * m.sc), bh = Math.round(16 * m.sc);
    rect(ctx, sx + Math.round(10 * m.sc), hy - bh - 4, 2, bh + 18, '#6a4a2a');
    rect(ctx, sx + Math.round(12 * m.sc), hy - bh - 4, bw, bh, m.col);
    rect(ctx, sx + Math.round(12 * m.sc), hy - bh - 4, bw, 2, '#fff8e8');
    for (let i = 0; i < 3; i++) rect(ctx, sx + Math.round(15 * m.sc) + i * Math.round(8 * m.sc), hy - bh + 2, Math.round(5 * m.sc), 3, '#1a1626');
  } else if (m.item === 'tote') {
    rect(ctx, sx + Math.round(11 * m.sc), y - Math.round(14 * m.sc), Math.round(11 * m.sc), Math.round(12 * m.sc), m.col);
    rect(ctx, sx + Math.round(11 * m.sc), y - Math.round(14 * m.sc), Math.round(11 * m.sc), 2, '#fff8e8');
  }
}
// opts: { camX, crowd (default true), band (default true), dome (default true) }
function drawConcertStreet(ctx, t, opts = {}) {
  const cam = opts.camX || 0;
  const wrap = (x, par) => { const v = (x - cam * par) % STREET_W; return v < -200 ? v + STREET_W : v; };
  // ---- sky
  const [c1, c2] = skyColors(0.93); vgrad(ctx, 0, 0, W, H, c1, c2);
  const rs = makeRng(7);
  for (let i = 0; i < 150; i++) { const sx = rs.int(0, W), sy = rs.int(0, 250); if (Math.sin(t * 2 + i) > 0.25) px(ctx, sx, sy, i % 3 ? '#8a86b0' : '#fff'); }
  circle(ctx, 786, 72, 22, '#f4f0d8'); circle(ctx, 795, 66, 20, c1);
  // ---- the skyline behind everything, barely moving
  ctx.drawImage(skylineCanvas(11, W, 130, { color: '#191534', lit: '#ffe6a0', tall: true, density: 0.32 }), Math.round(-cam * 0.12) % W, 198);
  ctx.drawImage(skylineCanvas(11, W, 130, { color: '#191534', lit: '#ffe6a0', tall: true, density: 0.32 }), (Math.round(-cam * 0.12) % W) + W, 198);
  ctx.drawImage(landmarkCanvas('skytree'), wrap(1180, 0.3), 150, 34, 176);
  ctx.drawImage(landmarkCanvas('tokyotower'), wrap(1890, 0.3), 232, 42, 104);
  // ---- THE LADYBUG, at the end of the street, which is where everyone is going
  // Not a dome. A sphere the size of a hill with a shell on it, lit from the
  // inside, and a black head at the bottom with two screens for eyes.
  if (opts.dome !== false) {
    const cx = (opts.domeX != null ? opts.domeX : 520) - cam * 0.16 + 268, cy = 236, R = 150;
    // the glow it puts into the sky over the whole block
    ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 1.7);
    ellipsePx(ctx, cx, cy - 40, R * 2.1, R * 1.7, '#ff6a58'); ctx.globalAlpha = 1;
    // the searchlights off the top of it
    for (let i = 0; i < 3; i++) {
      const a = t * 0.5 + i * 2.1;
      ctx.globalAlpha = 0.09; ctx.fillStyle = ['#8ad8ff', '#ffd24a', '#ff8ad8'][i];
      ctx.beginPath(); ctx.moveTo(cx - 5, cy - R); ctx.lineTo(cx + 5, cy - R);
      ctx.lineTo(cx + Math.cos(a) * 420 + 30, -20); ctx.lineTo(cx + Math.cos(a) * 420 - 30, -20);
      ctx.fill(); ctx.globalAlpha = 1;
    }
    // the shell, and the curve of it, built out of flattened passes
    ellipsePx(ctx, cx, cy, R + 3, R + 3, '#3a0a12');
    ellipsePx(ctx, cx, cy, R, R, '#ee4a3c');
    for (let i = 0; i < 14; i++) {
      const k = i / 14;
      ctx.globalAlpha = 0.05;
      ellipsePx(ctx, cx + R * 0.30 * k, cy + R * 0.26 * k, R * (1 - k * 0.5), R * (1 - k * 0.5), '#6a0e18');
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.5; ellipsePx(ctx, cx - R * 0.34, cy - R * 0.40, R * 0.34, R * 0.26, '#ff9a80'); ctx.globalAlpha = 1;
    // the LED grid, clipped to the shell
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, R, R, 0, 0, 6.2832); ctx.clip();
    ctx.globalAlpha = 0.1;
    for (let i = -5; i <= 5; i++) ellipsePx(ctx, cx + i * (R / 5) * 0.62, cy, Math.max(2, R * 0.1 * Math.abs(i) || 2), R, '#ffd8c8');
    for (let i = -4; i <= 4; i++) rect(ctx, cx - R, Math.round(cy + i * (R / 4.6)), R * 2, 1, '#ffd8c8');
    ctx.globalAlpha = 1;
    // the seam down the middle, lit gold
    rect(ctx, cx - 2, cy - R, 4, R * 2, '#2a0810');
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2); rect(ctx, cx - 1, cy - R, 2, R * 2, '#ffd24a'); ctx.globalAlpha = 1;
    // the spots, flattened toward the edges the way a sphere does it
    const SP = [[-0.46, -0.30, 0.19], [0.40, -0.36, 0.16], [-0.30, 0.28, 0.21], [0.34, 0.24, 0.18], [-0.62, 0.10, 0.12], [0.64, 0.02, 0.12], [0.02, 0.56, 0.14]];
    for (const [u, v, rr] of SP) {
      const px0 = cx + u * R, py0 = cy + v * R;
      ellipsePx(ctx, px0, py0, R * rr * (1 - Math.abs(u) * 0.5), R * rr, '#1b0810');
      ctx.globalAlpha = 0.25; ellipsePx(ctx, px0 - R * rr * 0.3, py0 - R * rr * 0.35, R * rr * 0.3, R * rr * 0.22, '#7a3040'); ctx.globalAlpha = 1;
    }
    ctx.restore();
    // the head: a black cap at the bottom with two screens for eyes
    ctx.save(); ctx.beginPath(); ctx.rect(cx - R, cy + R * 0.52, R * 2, R); ctx.clip();
    ellipsePx(ctx, cx, cy, R * 1.01, R * 1.01, '#141018');
    ctx.restore();
    for (const sx2 of [-0.34, 0.34]) {
      rect(ctx, cx + sx2 * R - 17, cy + R * 0.66, 34, 20, '#0a0810');
      ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 3 + sx2); rect(ctx, cx + sx2 * R - 15, cy + R * 0.66 + 2, 30, 16, '#8ad8ff'); ctx.globalAlpha = 1;
      rect(ctx, cx + sx2 * R - 7, cy + R * 0.66 + 6, 14, 8, '#12203a');
    }
    // antennae
    for (const sx2 of [-1, 1]) {
      line(ctx, cx + sx2 * R * 0.30, cy - R * 0.92, cx + sx2 * R * 0.56, cy - R * 1.22, '#141018');
      circle(ctx, cx + sx2 * R * 0.56, cy - R * 1.22, 5, '#141018');
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 4 + sx2); circle(ctx, cx + sx2 * R * 0.56, cy - R * 1.22, 3, '#ffd24a'); ctx.globalAlpha = 1;
    }
    // the concourse under it, and the doors people are going in through
    rect(ctx, cx - R * 1.25, cy + R * 0.86, R * 2.5, 46, '#241c2c');
    rect(ctx, cx - R * 1.25, cy + R * 0.86, R * 2.5, 3, '#4a3a58');
    for (let i = 0; i < 14; i++) rect(ctx, cx - R * 1.18 + i * (R * 2.36 / 14), cy + R * 0.86 + 14, 12, 22, i % 2 ? '#ffd24a' : '#ffb340');
    // the marquee
    rect(ctx, cx - 74, cy + R * 0.86 - 30, 148, 28, '#12101c'); frame(ctx, cx - 74, cy + R * 0.86 - 30, 148, 28, '#c8a03a');
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5);
    drawText(ctx, 'TONIGHT', cx, cy + R * 0.86 - 21, '#ffd24a', { align: 'center', scale: 2 });
    ctx.globalAlpha = 1;
  }
  // ---- the shopfronts along the street, and the lanterns strung over it
  const rf = makeRng(313);
  for (let i = 0; i < 26; i++) {
    const wf = 96 + (i % 4) * 26;
    const fx0 = wrap(i * 112, 1);
    if (fx0 > W + 40 || fx0 < -180) { rf.int(0, 5); continue; }
    const f = facadeCanvas(['shitamachi', 'showa', 'kawaii', 'neon'][i % 4], 313 + i, wf);
    ctx.drawImage(f, fx0, 336 - f.height * 1.34, wf * 1.34, f.height * 1.34);
  }
  for (let i = 0; i < 40; i++) {
    const lx = wrap(i * 74, 1);
    if (lx < -30 || lx > W + 30) continue;
    rect(ctx, lx, 196, 74, 1, '#3a3040');
    ctx.drawImage(propCanvas('lantern2', i % 3), lx + 24, 196, 15, 23);
  }
  // ---- the pavement the crowd is on
  rect(ctx, 0, 336, W, 72, '#8b867c'); rect(ctx, 0, 336, W, 3, '#b2ac9f');
  for (let x = -(cam % 44); x < W; x += 44) rect(ctx, x, 340, 2, 66, 'rgba(0,0,0,0.12)');
  // street lamps, with their pools on the pavement
  for (let i = 0; i < 26; i++) {
    const lx = wrap(i * 230 + 60, 1);
    if (lx < -40 || lx > W + 40) continue;
    ctx.drawImage(propCanvas('lamp'), lx, 262, 17, 76);
    ctx.globalAlpha = 0.12; circle(ctx, lx + 8, 292, 56, '#ffe680'); ctx.globalAlpha = 1;
  }
  // ---- everybody, walking the same way
  if (opts.crowd !== false) {
    for (const m of streetCrowd()) {
      const sx = wrap(m.x + t * m.sp, 1);
      if (sx < -40 || sx > W + 40) continue;
      drawStreetBug(ctx, m, sx, t);
    }
  }
  // ---- the road, and the jam sitting on it
  // Friday night. Nothing has moved in four minutes. Two lanes of it, bumper
  // to bumper, brake lights on, one scooter getting away with murder.
  const roadTop = 404;
  vgrad(ctx, 0, roadTop, W, H - roadTop, '#3c3c48', '#26262f');
  rect(ctx, 0, roadTop, W, 3, '#d8d2c4');
  rect(ctx, 0, roadTop + 3, W, 2, '#8a8478');
  // the lane markings the jam is sitting between
  for (let x = -(cam % 60); x < W; x += 60) { ctx.globalAlpha = 0.4; rect(ctx, x, 446, 34, 3, '#e8e6dc'); ctx.globalAlpha = 1; }
  // the crossing, in front of everything, which is the bit that matters
  for (let x = -(cam % 54) - 46; x < W; x += 54) { ctx.globalAlpha = 0.78; rect(ctx, x, 484, 30, H - 484, '#e8e6dc'); ctx.globalAlpha = 1; }
  rect(ctx, 0, 480, W, 2, '#d8d2c4');
  // the manholes, breathing
  for (let i = 0; i < 4; i++) {
    const mx = wrap(i * 620 + 180, 1); if (mx < -30 || mx > W + 30) continue;
    ellipsePx(ctx, mx, roadTop + 40, 13, 5, '#2a2a33'); ellipsePx(ctx, mx, roadTop + 39, 11, 4, '#33333e');
    ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 1.3 + i); ellipsePx(ctx, mx, roadTop + 26 - (t * 6 + i * 20) % 20, 15, 12, '#cfd6e8'); ctx.globalAlpha = 1;
  }
  for (const v of streetJam()) {
    // the jam creeps. it does not move.
    const crawl = Math.max(0, Math.sin(t * 0.22 + v.lane) - 0.72) * 60;
    const vx = wrap(v.x + crawl, 1) - v.w;
    if (vx < -v.w - 20 || vx > W + 20) continue;
    const vy = v.lane ? 470 : 424;
    ctx.globalAlpha = 0.3; ellipsePx(ctx, vx + v.w / 2, vy + v.h - 2, v.w * 0.46, 5, '#000'); ctx.globalAlpha = 1;
    if (v.kind === 'scooter') { drawScooter(ctx, vx, vy, t, v); continue; }
    ctx.drawImage(carCanvas(v.seed, v.dir), vx, vy - v.h, v.w, v.h);
    // brake lights, and the pair of pools they throw on the tarmac
    const bx = v.dir > 0 ? vx + 2 : vx + v.w - 6;
    const on = v.hazard ? (Math.sin(t * 4 + v.seed) > 0) : true;
    if (on) {
      rect(ctx, bx, vy - Math.round(v.h * 0.44), 5, 4, v.hazard ? '#ff9a2a' : '#ff4a3a');
      ctx.globalAlpha = 0.22; ellipsePx(ctx, bx + 2, vy + 2, 13, 5, v.hazard ? '#ff9a2a' : '#ff4a3a'); ctx.globalAlpha = 1;
    }
    // headlights out the front, pushing into the car in front of it
    const hx = v.dir > 0 ? vx + v.w - 4 : vx + 2;
    ctx.globalAlpha = 0.16; ellipsePx(ctx, hx + v.dir * 22, vy + 1, 28, 7, '#ffe6a0'); ctx.globalAlpha = 1;
    rect(ctx, hx, vy - Math.round(v.h * 0.44), 4, 4, '#fff2c0');
    // a lit taxi sign, and somebody's head against the glass
    if (v.taxi) { rect(ctx, vx + v.w / 2 - 7, vy - v.h - 6, 14, 6, '#f0c020'); ctx.globalAlpha = 0.3; ellipsePx(ctx, vx + v.w / 2, vy - v.h - 3, 12, 6, '#ffd24a'); ctx.globalAlpha = 1; }
    if (v.head) ellipsePx(ctx, vx + v.w * (v.dir > 0 ? 0.42 : 0.58), vy - Math.round(v.h * 0.68), 5, 4, '#2a2340');
    // exhaust
    if (Math.sin(t * 2.2 + v.seed) > 0.8) { ctx.globalAlpha = 0.16; ellipsePx(ctx, v.dir > 0 ? vx - 4 : vx + v.w + 4, vy - 3, 9, 5, '#cfd6e8'); ctx.globalAlpha = 1; }
  }
  // the signal on the kerb, stuck on red, and the guard waving his baton at it
  const sg = wrap(760, 1);
  if (sg > -40 && sg < W + 40) {
    rect(ctx, sg, 344, 12, 62, '#2a2a34'); rect(ctx, sg, 344, 3, 62, '#3f3f4e');
    rect(ctx, sg - 8, 310, 28, 36, '#1b1b24'); frame(ctx, sg - 8, 310, 28, 36, '#3f3f4e');
    const green = Math.sin(t * 0.5) > 0.3;
    circle(ctx, sg + 6, 322, 7, green ? '#1e3a24' : '#ff4a3a');
    circle(ctx, sg + 6, 338, 7, green ? '#6be585' : '#1e3a24');
    ctx.globalAlpha = 0.18; circle(ctx, sg + 6, green ? 338 : 322, 18, green ? '#6be585' : '#ff4a3a'); ctx.globalAlpha = 1;
  }
  // ---- the near corner, out of the depth of field: a pole and a lantern
  // hanging into frame, which is what puts you in the street instead of over it
  ctx.globalAlpha = 0.9;
  rect(ctx, -4, 0, 26, H, '#100e1a');
  rect(ctx, 20, 0, 4, H, '#1d1a2c');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.72;
  const lz = 84 + Math.sin(t * 0.9) * 5, lcx = W - 78;
  rect(ctx, lcx - 1, 0, 4, lz - 34, '#100e1a');
  rect(ctx, lcx - 20, lz - 36, 40, 7, '#181422');
  ellipsePx(ctx, lcx, lz, 32, 36, '#5e0e18');
  ellipsePx(ctx, lcx, lz, 27, 31, '#a8202c');
  ellipsePx(ctx, lcx - 6, lz - 8, 13, 14, '#d84a48');
  for (let i = -2; i <= 2; i++) { ctx.globalAlpha = 0.5; rect(ctx, lcx - 28, lz + i * 12, 56, 2, '#4a0a12'); ctx.globalAlpha = 0.72; }
  rect(ctx, lcx - 12, lz + 32, 24, 6, '#181422');
  rect(ctx, lcx - 3, lz + 38, 6, 16, '#c8a03a');
  ctx.globalAlpha = 1;
}
// Two lanes of stationary traffic, built once.
let _streetJam = null;
function streetJam() {
  if (_streetJam) return _streetJam;
  const r = makeRng(5150);
  const out = [];
  for (let lane = 0; lane < 2; lane++) {
    const dir = lane ? -1 : 1, sc = lane ? 1.95 : 1.5;
    let x = r.range(0, 60);
    while (x < STREET_W) {
      const scooter = r.chance(0.12);
      const seed = r.int(1, 999);
      const w = Math.round((scooter ? 30 : 44) * sc), h = Math.round((scooter ? 22 : 20) * sc);
      out.push({ x, lane, dir, w, h, seed, kind: scooter ? 'scooter' : 'car',
        taxi: !scooter && r.chance(0.22), hazard: !scooter && r.chance(0.16),
        head: !scooter && r.chance(0.6), col: r.pick(['#e8503a', '#4a86f7', '#f2c94c', '#f0ece2', '#6be585']) });
      x += w + (scooter ? r.range(26, 60) : r.range(6, 20));
    }
  }
  _streetJam = out;
  return out;
}
// the one vehicle in this whole street that is actually moving
function drawScooter(ctx, x, y, t, v) {
  const w = v.w, weave = Math.round(Math.sin(t * 2 + v.seed) * 3), yy = y + weave;
  const r = Math.max(4, Math.round(w * 0.16));
  const rw = x + Math.round(w * 0.18), fw = x + Math.round(w * 0.82);
  circle(ctx, rw, yy - r, r, '#202024'); circle(ctx, rw, yy - r, Math.max(1, r - 3), '#3a3a44');
  circle(ctx, fw, yy - r, r, '#202024'); circle(ctx, fw, yy - r, Math.max(1, r - 3), '#3a3a44');
  // floorboard, body, seat
  rect(ctx, x + Math.round(w * 0.2), yy - r - 5, Math.round(w * 0.6), 5, '#2a2a34');
  rect(ctx, x + Math.round(w * 0.24), yy - r - 15, Math.round(w * 0.36), 11, v.col);
  rect(ctx, x + Math.round(w * 0.24), yy - r - 15, Math.round(w * 0.36), 2, '#fff8e8');
  rect(ctx, x + Math.round(w * 0.2), yy - r - 20, Math.round(w * 0.3), 6, '#1b1b24');
  // the front, the bars and the light
  rect(ctx, fw - 3, yy - r - 24, 6, 20, '#2a2a34');
  rect(ctx, fw - 9, yy - r - 26, 18, 4, '#3f3f4e');
  rect(ctx, fw - 2, yy - r - 12, 6, 5, '#fff2c0');
  ctx.globalAlpha = 0.18; ellipsePx(ctx, fw + 22, yy - r - 9, 24, 7, '#ffe6a0'); ctx.globalAlpha = 1;
  // the rider, leaning into a gap that is not there
  ellipsePx(ctx, x + Math.round(w * 0.42), yy - r - 26, 9, 11, '#2f3a5a');
  ellipsePx(ctx, x + Math.round(w * 0.48), yy - r - 39, 8, 8, '#e8e2d4');
  rect(ctx, x + Math.round(w * 0.42), yy - r - 43, 16, 4, '#c83a3a');
  rect(ctx, x + Math.round(w * 0.5), yy - r - 28, Math.round(w * 0.3), 3, '#2f3a5a');
}
// the four of them, crossing in front of all of it
function drawStreetBand(ctx, t, opts = {}) {
  const span = opts.span != null ? opts.span : (W + 420);
  const walk = opts.x != null ? opts.x : (((t * 34) % span) - 120);
  ROSTER.forEach((c, i) => {
    const x = walk - i * 92, y = H - 26 + (i % 2) * 4;
    if (x < -70 || x > W + 70) return;
    ctx.globalAlpha = 0.22; ctx.fillStyle = '#0a0a12';
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y); ctx.lineTo(x - 30, y + 46); ctx.lineTo(x - 54, y + 46); ctx.fill();
    ctx.globalAlpha = 1;
    drawShadow(ctx, x, y, 34, 0.32);
    drawBugAt(ctx, HERO_PRESETS[c.key], x, y + Math.round(Math.sin(t * 6 + i * 1.7) * 2), {
      pose: Math.floor(t * 6 + i * 1.7) % 2 ? 'walk1' : 'walk2',
      instrument: c.instrument !== 'drums' && c.instrument !== 'piano' ? c.instrument : null, scale: 1.7 });
  });
}
