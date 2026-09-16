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
  // ---- THE DOME, at the end of the street, which is where everyone is going
  if (opts.dome !== false) {
    const dx = (opts.domeX != null ? opts.domeX : 520) - cam * 0.16, dy = 232, dw = 420, dh = 128;
    // the glow it puts into the sky over the whole block
    ctx.globalAlpha = 0.13 + 0.04 * Math.sin(t * 1.7);
    ellipsePx(ctx, dx + dw / 2, dy - 10, dw * 0.8, dh * 1.5, '#9fd8ff'); ctx.globalAlpha = 1;
    ellipsePx(ctx, dx + dw / 2, dy, dw / 2, dh, '#25233c');
    ellipsePx(ctx, dx + dw / 2, dy - 4, dw / 2 - 2, dh - 4, '#cfd6e8');
    ellipsePx(ctx, dx + dw / 2, dy - 12, dw / 2 - 16, dh - 18, '#e8eef8');
    for (let i = -6; i <= 6; i++) { ctx.globalAlpha = 0.22; line(ctx, dx + dw / 2 + i * 30, dy - 14, dx + dw / 2 + i * 17, dy + 40, '#98a2bc'); ctx.globalAlpha = 1; }
    rect(ctx, dx, dy + 30, dw, 80, '#2a2a3e'); rect(ctx, dx, dy + 30, dw, 3, '#454560');
    for (let i = 0; i < 32; i++) rect(ctx, dx + 6 + i * 13, dy + 46, 8, 18, i % 2 ? '#ffd24a' : '#ffb340');
    // the searchlights off its roof
    for (let i = 0; i < 3; i++) {
      const a = t * 0.5 + i * 2.1;
      ctx.globalAlpha = 0.1; ctx.fillStyle = ['#8ad8ff', '#ffd24a', '#ff8ad8'][i];
      ctx.beginPath(); ctx.moveTo(dx + dw / 2 - 5, dy); ctx.lineTo(dx + dw / 2 + 5, dy);
      ctx.lineTo(dx + dw / 2 + Math.cos(a) * 420 + 30, -20); ctx.lineTo(dx + dw / 2 + Math.cos(a) * 420 - 30, -20);
      ctx.fill(); ctx.globalAlpha = 1;
    }
    // the marquee over the doors
    rect(ctx, dx + 140, dy + 2, 140, 28, '#12101c'); frame(ctx, dx + 140, dy + 2, 140, 28, '#c8a03a');
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5);
    drawText(ctx, 'TONIGHT', dx + 210, dy + 11, '#ffd24a', { align: 'center', scale: 2 });
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
  // ---- the road, the crossing and the traffic stopped for it
  const roadTop = 410;
  vgrad(ctx, 0, roadTop, W, H - roadTop, '#3c3c48', '#2c2c36');
  rect(ctx, 0, roadTop, W, 3, '#d8d2c4');
  for (let x = -(cam % 54) - 46; x < W; x += 54) { ctx.globalAlpha = 0.78; rect(ctx, x, roadTop + 8, 30, H - roadTop - 16, '#e8e6dc'); ctx.globalAlpha = 1; }
  const tx = wrap(300, 1);
  if (tx > -120 && tx < W + 20) {
    ctx.drawImage(carCanvas(7, 1), tx, roadTop + 14, 92, 42);
    ctx.globalAlpha = 0.22; ellipsePx(ctx, tx + 100, roadTop + 42, 34, 10, '#ffe6a0'); ctx.globalAlpha = 1;
  }
  const sg = wrap(760, 1);
  if (sg > -40 && sg < W + 40) {
    rect(ctx, sg, 344, 12, 68, '#2a2a34');
    rect(ctx, sg - 8, 314, 28, 34, '#1b1b24'); frame(ctx, sg - 8, 314, 28, 34, '#3f3f4e');
    circle(ctx, sg + 6, 330, 8, Math.sin(t * 3) > -0.4 ? '#6be585' : '#1e3a24');
  }
}
// the four of them, crossing in front of all of it
function drawStreetBand(ctx, t, opts = {}) {
  const span = opts.span != null ? opts.span : (W + 420);
  const walk = opts.x != null ? opts.x : (((t * 34) % span) - 210);
  ROSTER.forEach((c, i) => {
    const x = walk - i * 92, y = H - 44 + (i % 2) * 4;
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
