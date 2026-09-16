// ---------- The ? scenes ----------
// Every question mark plays out as a drawn scene with somebody in it, acting,
// while you decide. No wall of text over a static backdrop: a vendor holds the
// skewer out, the cat's tail moves, the rain actually falls. Some choices hand
// you something to play, and those can be lost.
'use strict';
// How far the whole scene is lifted so the choice panel can sit under it.
const LIFT = 108;

// A shared stage for all of them: a Tokyo street at whatever hour it is, with
// the band standing at the left where they always stand.
function drawMysteryStreet(ctx, t, seed, opts = {}) {
  const r = Game.run;
  const night = !!opts.night, wet = !!opts.wet;
  const [c1, c2] = skyColors(night ? 0.95 : clamp(0.18 + (r ? r.day : 1) * 0.12, 0, 0.66));
  vgrad(ctx, 0, 0, W, H, c1, c2);
  ctx.drawImage(skylineCanvas(seed + 3, W, 116, { color: night ? '#1e1a3a' : '#7d8398', lit: '#ffe6a0', density: night ? 0.4 : 0.1 }), 0, 206);
  // a run of shophouses, in the styles this city is actually built from
  let x = -12; const rr = makeRng(seed * 31 + 7); let i = 0;
  const styles = ['shitamachi', 'showa', 'kawaii', 'neon', 'showa', 'shitamachi'];
  while (x < W + 24) {
    const w = rr.int(62, 112), f = facadeCanvas(styles[i % styles.length], seed * 13 + i, w);
    ctx.drawImage(f, x, 372 - f.height * 1.4, w * 1.4, f.height * 1.4);
    x += w * 1.4 + 2; i++;
  }
  // pavement, kerb, road
  rect(ctx, 0, 372, W, 58, '#a29d94'); rect(ctx, 0, 372, W, 3, '#c4bfb4');
  for (let sx = 0; sx < W; sx += 36) rect(ctx, sx, 376, 2, 54, 'rgba(0,0,0,0.11)');
  rect(ctx, 0, 428, W, 6, '#d8d2c4'); rect(ctx, 0, 434, W, H - 434, '#3c3c46');
  for (let sx = 0; sx < W; sx += 50) rect(ctx, sx, 486, 28, 3, '#d8c860');
  // street furniture
  ctx.drawImage(propCanvas(night ? 'lamp' : 'lampOff'), 38, 306, 17, 67);
  ctx.drawImage(propCanvas('vending'), 862, 318, 42, 56);
  if (night) { ctx.globalAlpha = 0.16; circle(ctx, 46, 336, 60, '#ffe680'); ctx.globalAlpha = 1; }
  if (wet) {
    // the road turns into a mirror, which is most of what rain looks like
    ctx.globalAlpha = 0.16; rect(ctx, 0, 434, W, H - 434, '#8ab0e0'); ctx.globalAlpha = 1;
    for (let k = 0; k < 90; k++) {
      const rx = (k * 137 + Math.floor(t * 900)) % W, ry = ((k * 71 + Math.floor(t * 1300)) % (H + 40)) - 20;
      ctx.globalAlpha = 0.35; rect(ctx, rx, ry, 1, 9, '#bcd4f4'); ctx.globalAlpha = 1;
    }
  }
}

// ---- the vignettes. One distinctive thing and one character, each doing
// something, rather than ten half-drawn backdrops.
const MYSTERY_ART = {
  purikura(ctx, t) {
    // a wall of photo booths, each screaming a different jingle in pink
    vgrad(ctx, 0, 0, W, H, '#3a1f40', '#1c0f22');
    for (let i = 0; i < 5; i++) {
      const bx = 60 + i * 190, lit = Math.sin(t * (3 + i * 0.7)) > -0.2;
      rect(ctx, bx, 96, 168, 330, i % 2 ? '#e05a9a' : '#f07ab0');
      rect(ctx, bx, 96, 168, 8, '#fff0f8');
      rect(ctx, bx + 8, 112, 152, 96, '#2a1430');
      ctx.globalAlpha = lit ? 0.85 : 0.35;
      rect(ctx, bx + 12, 116, 144, 88, ['#ffd24a', '#8ad8ff', '#ff9fef', '#6be585', '#ffffff'][i]);
      ctx.globalAlpha = 1;
      // the curtain
      for (let c = 0; c < 6; c++) { const sw = Math.sin(t * 2 + c + i) * 2; rect(ctx, bx + 10 + c * 25 + sw, 212, 22, 200, c % 2 ? '#8a2a5a' : '#a03a6a'); }
      // bulbs round the frame
      for (let bl = 0; bl < 7; bl++) { const on = (Math.floor(t * 6) + bl + i) % 3 === 0; ellipsePx(ctx, bx + 12 + bl * 24, 104, 4, 4, on ? '#fff8d0' : '#c08aa8'); }
    }
    rect(ctx, 0, 426, W, H - 426, '#2a1830'); rect(ctx, 0, 426, W, 3, '#4a2a48');
    // three of them, bouncing, one holding the curtain
    for (let i = 0; i < 3; i++) {
      const gx = 560 + i * 74, bob = Math.round(Math.abs(Math.sin(t * 4 + i * 1.3)) * 7);
      drawShadow(ctx, gx, 426, 26);
      drawBugAt(ctx, MYSTERY_BUGS.schoolgirls[i], gx, 426 - bob, { pose: 'cheer', scale: 1.4, flip: i === 2 });
    }
    // the strip of photos, dangling
    const sx = 300, sy = 150 + Math.sin(t * 1.5) * 4;
    rect(ctx, sx - 2, sy - 6, 34, 150, '#f6f2e6'); frame(ctx, sx - 2, sy - 6, 34, 150, '#c8b8a0');
    for (let f = 0; f < 4; f++) { rect(ctx, sx + 2, sy + f * 36, 26, 30, ['#ffd7e8', '#d7f0ff', '#fff0c8', '#e0ffd7'][f]); rect(ctx, sx + 6, sy + 6 + f * 36, 18, 18, '#8a6a7a'); }
    drawParty(ctx, 110, 426, t);
  },
  kaiten(ctx, t) {
    // a counter, a belt, and plates going past at walking pace
    vgrad(ctx, 0, 0, W, H, '#241c1a', '#16100f');
    rect(ctx, 0, 60, W, 120, '#3a2c24'); rect(ctx, 0, 60, W, 4, '#5e4a3a');
    for (let i = 0; i < 8; i++) { rect(ctx, 30 + i * 120, 72, 92, 44, '#f4ecd8'); frame(ctx, 30 + i * 120, 72, 92, 44, '#8a6a48');
      drawText(ctx, ['MAGURO', 'TAMAGO', 'EBI', 'SAKE', 'IKA', 'UNI', 'TORO', 'ANAGO'][i], 76 + i * 120, 88, '#8a3a2a', { align: 'center' }); }
    // the kitchen slot, with somebody's hands in it
    rect(ctx, 0, 180, W, 96, '#4a382c'); rect(ctx, 0, 180, W, 3, '#6e5844');
    // the belt itself, moving
    const beltY = 276;
    rect(ctx, 0, beltY, W, 46, '#2a2430'); rect(ctx, 0, beltY, W, 3, '#4a4458');
    for (let x = -((t * 46) % 26); x < W; x += 26) rect(ctx, x, beltY + 4, 14, 38, '#3a3446');
    // plates under their domes
    for (let i = 0; i < 9; i++) {
      const px2 = ((i * 116 + t * 46) % (W + 116)) - 58;
      const col = ['#4a7fd0', '#4a7fd0', '#d04a5a', '#4a7fd0', '#e0b040', '#4a7fd0', '#5aa050', '#4a7fd0', '#d04a5a'][i];
      ellipsePx(ctx, px2, beltY + 30, 26, 9, darken(col, 0.3));
      ellipsePx(ctx, px2, beltY + 28, 26, 8, col);
      ellipsePx(ctx, px2, beltY + 27, 20, 6, lighten(col, 0.25));
      // the food, and the plastic dome over it
      ellipsePx(ctx, px2 - 5, beltY + 23, 7, 4, '#f0e4d0'); ellipsePx(ctx, px2 - 5, beltY + 21, 7, 3, '#e06a5a');
      ellipsePx(ctx, px2 + 6, beltY + 23, 7, 4, '#f0e4d0'); ellipsePx(ctx, px2 + 6, beltY + 21, 7, 3, '#e8a050');
      ctx.globalAlpha = 0.28; ellipsePx(ctx, px2, beltY + 18, 24, 14, '#cfe4ff'); ctx.globalAlpha = 1;
      ellipsePx(ctx, px2, beltY + 6, 3, 2, '#e8f4ff');
    }
    // the counter you are sitting at
    rect(ctx, 0, beltY + 46, W, 24, '#7a5434'); rect(ctx, 0, beltY + 46, W, 4, '#a8794e');
    rect(ctx, 0, beltY + 70, W, H - beltY - 70, '#241c20');
    // a tea tap and a stack of the day's plates
    rect(ctx, 830, beltY + 22, 16, 26, '#8a8a98'); rect(ctx, 826, beltY + 16, 24, 8, '#a8a8b8');
    for (let i = 0; i < 4; i++) ellipsePx(ctx, 130, beltY + 46 - i * 5, 24, 7, i % 2 ? '#4a7fd0' : '#d04a5a');
    drawParty(ctx, 300, beltY + 68, t, 'idle');
  },
  hanami(ctx, t) {
    // an afternoon under the blossom, four hours in
    const [c1, c2] = skyColors(0.42); vgrad(ctx, 0, 0, W, H, c1, c2);
    ctx.drawImage(skylineCanvas(19, W, 90, { color: '#9aa0b8', lit: '#fff', density: 0.04 }), 0, 190);
    rect(ctx, 0, 268, W, H - 268, '#6aa855'); rect(ctx, 0, 268, W, 4, '#86c46a');
    for (let i = 0; i < 120; i++) rect(ctx, (i * 73) % W, 276 + (i * 41) % 250, 3, 2, '#82bc62');
    // the trees
    for (let i = 0; i < 5; i++) {
      const tx = 70 + i * 210, ty = 262;
      rect(ctx, tx - 7, ty - 60, 14, 62, '#5a3a28'); rect(ctx, tx - 7, ty - 60, 5, 62, '#7a5238');
      for (const [ox, oy, r] of [[0, -84, 42], [-34, -64, 30], [34, -66, 32], [-14, -104, 26], [18, -102, 24]]) {
        ellipsePx(ctx, tx + ox, ty + oy + 2, r, r * 0.66, '#e88ab0');
        ellipsePx(ctx, tx + ox, ty + oy, r, r * 0.66, '#f8b6d0');
        ellipsePx(ctx, tx + ox - r * 0.3, ty + oy - r * 0.26, r * 0.4, r * 0.26, '#ffd6e6');
      }
    }
    // petals coming down
    for (let i = 0; i < 44; i++) {
      const px2 = ((i * 151 + t * 22) % (W + 40)) - 20 + Math.sin(t * 1.4 + i) * 14;
      const py = ((i * 97 + t * 44) % (H + 40)) - 20;
      rect(ctx, px2, py, 3, 2, i % 3 ? '#f8b6d0' : '#ffd6e6');
    }
    // the blue sheet, and an entire office on it
    const sy = 400;
    ctx.globalAlpha = 0.25; rect(ctx, 356, sy + 4, 500, 90, '#0a2a5a'); ctx.globalAlpha = 1;
    rect(ctx, 352, sy, 500, 88, '#2a5ab8'); rect(ctx, 352, sy, 500, 4, '#4a7ad8');
    for (let i = 0; i < 9; i++) rect(ctx, 360 + i * 56, sy + 8, 40, 76, 'rgba(255,255,255,0.05)');
    // shoes off at the edge, because of course
    for (let i = 0; i < 6; i++) rect(ctx, 356 + i * 22, sy - 10, 16, 8, i % 2 ? '#2a2430' : '#5a3a2a');
    // the party
    for (let i = 0; i < 6; i++) {
      const gx = 400 + i * 78, bob = Math.round(Math.sin(t * 2.4 + i * 0.8) * 3);
      drawBugAt(ctx, MYSTERY_BUGS.office[i % MYSTERY_BUGS.office.length], gx, sy + 26 + bob, { pose: i % 3 ? 'cheer' : 'idle', scale: 1.25, flip: i % 2 === 1 });
      if (i % 2) { rect(ctx, gx + 12, sy + 6 + bob, 7, 12, '#e8b040'); rect(ctx, gx + 12, sy + 6 + bob, 7, 3, '#fff0b0'); }
    }
    // somebody bellowing
    for (let i = 0; i < 3; i++) { const k = ((t * 0.7 + i * 0.33) % 1); ctx.globalAlpha = (1 - k) * 0.8;
      drawText(ctx, '♪', 560 + Math.sin(k * 6) * 16, sy - 20 - k * 60, '#fff0b0', { scale: 2, outline: '#4a2a10' }); ctx.globalAlpha = 1; }
    drawParty(ctx, 110, 430, t);
  },
  lostcase(ctx, t) {
    drawMysteryStreet(ctx, t, 31);
    // the bench, and the case somebody left on it
    const bx = 560, by = 430;
    ctx.drawImage(propCanvas('bench'), bx - 46, by - 22, 92, 43);
    const cx = bx + 6, cy = by - 34;
    rect(ctx, cx - 54, cy - 2, 108, 34, '#1a1620');
    rect(ctx, cx - 52, cy, 104, 30, '#2e2736'); rect(ctx, cx - 52, cy, 104, 3, '#4e4558');
    rect(ctx, cx - 52, cy + 14, 104, 2, '#12101a');
    for (const d of [-1, 1]) { rect(ctx, cx + d * 34 - 4, cy + 10, 9, 9, '#cfc4a8'); rect(ctx, cx + d * 34 - 3, cy + 11, 7, 3, '#f0e8d0'); }
    rect(ctx, cx - 8, cy + 28, 17, 6, '#1a1620');
    // stickers from eleven countries
    const cols = ['#e0503c', '#e8b840', '#3f6fb0', '#6be585', '#c58bff', '#ff9fef'];
    for (let i = 0; i < 9; i++) { const sx2 = cx - 44 + (i % 5) * 20, sy2 = cy + 3 + Math.floor(i / 5) * 12;
      rect(ctx, sx2, sy2, 13, 8, cols[i % cols.length]); rect(ctx, sx2, sy2, 13, 2, lighten(cols[i % cols.length], 0.3)); }
    // him, running, badly
    const run = clamp((t % 4) / 4, 0, 1), rx = 940 - run * 300;
    drawShadow(ctx, rx, by, 28);
    drawBugAt(ctx, MYSTERY_BUGS.rival, rx, by - Math.abs(Math.sin(t * 9)) * 6, { pose: 'cheer', scale: 1.5, flip: true });
    // his coat, half off, and the dust of him
    for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.3 - i * 0.08; ellipsePx(ctx, rx + 22 + i * 13, by - 4, 7 - i, 3, '#cfc4b0'); ctx.globalAlpha = 1; }
    for (let i = 0; i < 2; i++) { const k = ((t * 1.4 + i * 0.5) % 1); ctx.globalAlpha = (1 - k) * 0.85;
      drawText(ctx, '!', rx - 16, by - 56 - k * 20, '#ff5a5a', { scale: 3, outline: '#2a1010' }); ctx.globalAlpha = 1; }
    drawParty(ctx, 110, 430, t);
  },
  dango(ctx, t) {
    drawMysteryStreet(ctx, t, 4, { night: true });
    const cx = 600, gy = 430;
    // the yatai: a wheeled cart with a grill, a counter and a noren
    rect(ctx, cx - 92, gy - 62, 184, 52, '#6a4228'); rect(ctx, cx - 92, gy - 62, 184, 4, '#9a6a40');
    rect(ctx, cx - 96, gy - 66, 192, 6, '#8a5a34'); rect(ctx, cx - 96, gy - 66, 192, 2, '#bd8a58');
    rect(ctx, cx - 88, gy - 10, 176, 10, '#4a2c18');
    for (const wx of [cx - 70, cx + 62]) { ellipsePx(ctx, wx, gy + 2, 11, 11, '#2a1a10'); ellipsePx(ctx, wx, gy + 2, 6, 6, '#6a4228'); }
    // the roof and its poles
    for (const px2 of [cx - 88, cx + 84]) rect(ctx, px2, gy - 150, 5, 86, '#6a4228');
    rect(ctx, cx - 102, gy - 156, 206, 10, '#9c2f22'); rect(ctx, cx - 102, gy - 156, 206, 3, '#c85a44');
    // noren curtains, moving a little
    for (let i = 0; i < 7; i++) {
      const sx = cx - 96 + i * 28, sw = 24, sway = Math.sin(t * 1.6 + i * 0.6) * 2;
      rect(ctx, sx + sway, gy - 146, sw, 26, i % 2 ? '#1e3f6a' : '#24497a');
      rect(ctx, sx + sway, gy - 146, sw, 2, '#3f6ba8');
    }
    // the grill: coals and smoke
    rect(ctx, cx + 16, gy - 74, 62, 12, '#2a2028');
    for (let i = 0; i < 10; i++) { const k = (Math.sin(t * 3 + i) + 1) / 2; rect(ctx, cx + 20 + i * 6, gy - 70, 4, 4, k > 0.6 ? '#ff8a30' : '#c04818'); }
    for (let i = 0; i < 6; i++) {
      const k = ((t * 0.7 + i * 0.17) % 1);
      ctx.globalAlpha = (1 - k) * 0.3;
      ellipsePx(ctx, cx + 30 + i * 8 + Math.sin(t * 2 + i) * 5, gy - 78 - k * 60, 5 + k * 12, 4 + k * 9, '#e8e0d0');
      ctx.globalAlpha = 1;
    }
    // the lantern, swinging
    const sw2 = Math.sin(t * 1.3) * 0.13;
    ctx.save(); ctx.translate(cx - 74, gy - 146); ctx.rotate(sw2);
    ctx.drawImage(propCanvas('lantern2'), -11, 0, 22, 30); ctx.restore();
    // the vendor, leaning over the counter with the skewer held out
    const bob = Math.sin(t * 2.2) * 2;
    drawBugAt(ctx, MYSTERY_BUGS.vendor, cx + 50, gy - 62 + bob, { pose: 'idle', scale: 1.6, flip: true });
    // The dango itself, held out across the counter. It is the thing the scene
    // is about, so it is drawn big enough to be the thing you look at.
    const ax = cx - 42 + Math.sin(t * 2.2) * 4, ay = gy - 104 + bob;
    ctx.globalAlpha = 0.28; ellipsePx(ctx, ax + 20, ay + 6, 34, 16, '#ffd9a0'); ctx.globalAlpha = 1;
    rect(ctx, ax - 6, ay + 5, 44, 4, '#8a6238'); rect(ctx, ax - 6, ay + 5, 44, 2, '#c49a62');
    for (let i = 0; i < 3; i++) {
      const c = ['#f4ecd8', '#f0a8c0', '#9ed46a'][i], px2 = ax + 8 + i * 13;
      ellipsePx(ctx, px2, ay + 8, 8, 8, '#2a1e12');
      ellipsePx(ctx, px2, ay + 6, 8, 8, darken(c, 0.22));
      ellipsePx(ctx, px2, ay + 5, 7, 7, c);
      ellipsePx(ctx, px2 - 2, ay + 2, 3, 2, lighten(c, 0.4));
    }
    // and the price, chalked on the cart, because he did say two dollars
    rect(ctx, cx - 84, gy - 50, 42, 26, '#2a2028'); frame(ctx, cx - 84, gy - 50, 42, 26, '#6a5a48');
    drawText(ctx, '$2', cx - 63, gy - 44, '#f4ecd8', { align: 'center', scale: 2 });
    drawParty(ctx, 86, 430, t);
  },
  cat(ctx, t) {
    drawMysteryStreet(ctx, t, 9, { night: true });
    // the amp, with the cat on it
    const ax = 620, ay = 430;
    ctx.drawImage(propCanvas('amp'), ax - 34, ay - 54, 68, 54);
    const breathe = Math.sin(t * 1.4) * 1.2;
    // a very large cat, asleep, tail moving once in a while
    const cy = ay - 62 + breathe;
    ellipsePx(ctx, ax, cy + 6, 40, 15, '#241e28');
    ellipsePx(ctx, ax, cy + 4, 38, 13, '#3a3038');
    // tortoiseshell patches
    for (const [ox, oy, r] of [[-18, 0, 8], [6, 2, 10], [22, -1, 7]]) ellipsePx(ctx, ax + ox, cy + oy + 2, r, r * 0.5, ox > 0 ? '#8a5a2a' : '#c08a3a');
    // head
    ellipsePx(ctx, ax - 30, cy - 4, 12, 10, '#3a3038');
    for (const d of [-1, 1]) { const hx = ax - 30 + d * 7; rect(ctx, hx - 2, cy - 16, 4, 7, '#3a3038'); rect(ctx, hx - 1, cy - 14, 2, 4, '#8a5a2a'); }
    rect(ctx, ax - 36, cy - 5, 4, 1, '#1a161c'); rect(ctx, ax - 26, cy - 5, 4, 1, '#1a161c');   // closed eyes
    // the tail, which moves exactly once every couple of seconds
    const flick = Math.sin(t * 0.8) > 0.86 ? Math.sin(t * 22) * 8 : 0;
    for (let i = 0; i < 16; i++) rect(ctx, ax + 34 + i * 2, cy + 6 - i * 0.4 + Math.sin(i * 0.4 + t) * 2 + flick * (i / 16), 3, 3, i % 2 ? '#3a3038' : '#4a4048');
    drawParty(ctx, 86, 430, t, 'idle');
  },
  salaryman(ctx, t) {
    drawMysteryStreet(ctx, t, 12, { night: true });
    const sx = 640, sy = 430, sway = Math.sin(t * 1.1) * 9;
    drawShadow(ctx, sx + sway, sy, 34);
    drawBugAt(ctx, MYSTERY_BUGS.salaryman, sx + sway, sy, { pose: 'cheer', scale: 1.55, flip: true });
    // a fistful of coins, held up
    for (let i = 0; i < 5; i++) {
      const cx2 = sx + sway - 22 + (i % 3) * 7, cy2 = sy - 54 - Math.floor(i / 3) * 6 + Math.sin(t * 3 + i) * 1.5;
      ellipsePx(ctx, cx2, cy2, 4, 4, '#b8860b'); ellipsePx(ctx, cx2, cy2 - 1, 3, 3, '#ffd24a');
    }
    // the music he is hearing, which is not the music you are playing
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.55 + i * 0.33) % 1);
      ctx.globalAlpha = (1 - k) * 0.8;
      drawText(ctx, '♪', sx + sway + 26 + Math.sin(k * 6 + i) * 9, sy - 66 - k * 52, '#ffd24a', { scale: 2, outline: '#2a2010' });
      ctx.globalAlpha = 1;
    }
    drawParty(ctx, 86, 430, t);
  },
  busker(ctx, t) {
    // an underpass: tiled walls, strip lights, a long tunnel
    vgrad(ctx, 0, 0, W, 300, '#2a2c3a', '#3c3e50');
    for (let y = 0; y < 300; y += 14) for (let x = (y / 14 % 2) * 14; x < W; x += 28) { rect(ctx, x, y, 26, 12, '#464a5e'); rect(ctx, x, y, 26, 1, '#5a6078'); }
    for (let i = 0; i < 6; i++) { rect(ctx, 60 + i * 150, 22, 90, 7, '#e8f0ff'); ctx.globalAlpha = 0.12; rect(ctx, 40 + i * 150, 29, 130, 90, '#cfe0ff'); ctx.globalAlpha = 1; }
    rect(ctx, 0, 300, W, 8, '#5a5e70'); rect(ctx, 0, 308, W, H - 308, '#4a4c5c');
    for (let x = 0; x < W; x += 44) rect(ctx, x, 308, 2, H - 308, '#42444f');
    ctx.globalAlpha = 0.1; for (let i = 0; i < 6; i++) rect(ctx, 44 + i * 150, 308, 120, 160, '#cfe0ff'); ctx.globalAlpha = 1;
    // the other busker, at the far end, playing on the beat
    const bx = 790, by = 424;
    drawShadow(ctx, bx, by, 32);
    drawBugAt(ctx, MYSTERY_BUGS.rival, bx, by + Math.round(Math.sin(t * 4) * 2), { pose: 'play', instrument: 'guitar', scale: 1.5, flip: true });
    rect(ctx, bx - 26, by - 4, 46, 12, '#2a2430'); rect(ctx, bx - 26, by - 4, 46, 2, '#4a4458');
    for (let i = 0; i < 4; i++) {
      const k = ((t * 0.6 + i * 0.25) % 1);
      ctx.globalAlpha = (1 - k) * 0.7;
      drawText(ctx, '♪', bx - 30 - k * 130, by - 46 - Math.sin(k * 4) * 20, '#8ad8ff', { scale: 2, outline: '#12161f' });
      ctx.globalAlpha = 1;
    }
    drawParty(ctx, 86, 424, t, 'play');
  },
  gacha(ctx, t) {
    // an arcade wall under a flickering strip light
    const flick = Math.sin(t * 31) > -0.8 ? 1 : 0.45;
    vgrad(ctx, 0, 0, W, H, '#20182c', '#150f1e');
    ctx.globalAlpha = 0.5 * flick; rect(ctx, 0, 0, W, 240, '#4a3c68'); ctx.globalAlpha = 1;
    rect(ctx, 120, 26, 720, 8, flick > 0.6 ? '#f0f4ff' : '#8a90a8');
    ctx.globalAlpha = 0.14 * flick; rect(ctx, 90, 34, 780, 150, '#cfd8ff'); ctx.globalAlpha = 1;
    rect(ctx, 0, 430, W, H - 430, '#2a2038'); rect(ctx, 0, 430, W, 3, '#4a3c58');
    for (let i = 0; i < 8; i++) ctx.drawImage(propCanvas('gacha', i % 3), 178 + i * 76, 246, 62, 88);
    for (let i = 0; i < 8; i++) ctx.drawImage(propCanvas('gacha', (i + 1) % 3), 178 + i * 76, 336, 62, 88);
    // a capsule rolling out of one of them
    const which = Math.floor(t / 2.6) % 8, k = (t / 2.6) % 1;
    if (k < 0.5) { const px2 = 178 + which * 76 + 31, py = 418 + Math.sin(k * 8) * 3;
      ellipsePx(ctx, px2, py, 7, 7, '#d8a030'); ellipsePx(ctx, px2, py - 2, 7, 5, '#ffd24a'); ellipsePx(ctx, px2 - 2, py - 3, 2, 1.4, '#fff4c0'); }
    drawParty(ctx, 86, 430, t, 'idle');
  },
  monk(ctx, t) {
    // temple steps at dawn
    const [c1, c2] = skyColors(0.12); vgrad(ctx, 0, 0, W, H, c1, c2);
    ctx.drawImage(landmarkCanvas('torii'), 120, 150, 150, 170);
    ctx.drawImage(landmarkCanvas('torii'), 760, 176, 118, 134);
    // the hall behind, with a tiled roof
    rect(ctx, 300, 176, 380, 150, '#7a3a2a'); rect(ctx, 300, 176, 380, 6, '#a05a3a');
    for (let x = 300; x < 680; x += 16) { rect(ctx, x, 168, 14, 10, '#3a3a48'); rect(ctx, x, 168, 14, 3, '#5a5a6a'); }
    rect(ctx, 286, 160, 408, 10, '#2e2e3c'); rect(ctx, 286, 160, 408, 3, '#50505f');
    for (let i = 0; i < 5; i++) rect(ctx, 320 + i * 76, 186, 12, 140, '#8a4a34');
    // steps
    for (let i = 0; i < 6; i++) { rect(ctx, 220 + i * 6, 326 + i * 16, 540 - i * 12, 16, i % 2 ? '#a8a49a' : '#b8b4aa'); rect(ctx, 220 + i * 6, 326 + i * 16, 540 - i * 12, 2, '#cfcbc0'); }
    rect(ctx, 0, 422, W, H - 422, '#9a968c');
    // the monk, perfectly still, and the bell he rings
    const mx = 610, my = 422;
    drawShadow(ctx, mx, my, 30);
    drawBugAt(ctx, MYSTERY_BUGS.monk, mx, my, { pose: 'idle', scale: 1.55, flip: true });
    const ring = Math.sin(t * 0.9) > 0.93;
    ellipsePx(ctx, mx - 22, my - 40, 11, 8, '#b8860b'); ellipsePx(ctx, mx - 22, my - 42, 10, 6, '#e0b040');
    if (ring) { ctx.globalAlpha = 0.5; for (let i = 1; i < 4; i++) ellipsePx(ctx, mx - 22, my - 44, 11 + i * 7, 5 + i * 3, '#fff0b0'); ctx.globalAlpha = 1; }
    // incense
    for (let i = 0; i < 5; i++) { const k = ((t * 0.5 + i * 0.2) % 1); ctx.globalAlpha = (1 - k) * 0.24; ellipsePx(ctx, 420 + Math.sin(t + i) * 8, 400 - k * 120, 4 + k * 10, 3 + k * 8, '#e8e0d0'); ctx.globalAlpha = 1; }
    drawParty(ctx, 86, 422, t, 'idle');
  },
  scout(ctx, t) {
    drawMysteryStreet(ctx, t, 21);
    const sx = 650, sy = 430;
    drawShadow(ctx, sx, sy, 32);
    drawBugAt(ctx, MYSTERY_BUGS.scout, sx, sy, { pose: 'idle', scale: 1.55, flip: true });
    // the card, held out, catching the light
    const cx2 = sx - 30, cy2 = sy - 48 + Math.sin(t * 2) * 1.5;
    rect(ctx, cx2 - 15, cy2 - 9, 30, 19, '#12101a'); rect(ctx, cx2 - 14, cy2 - 8, 28, 17, '#f6f2e6');
    rect(ctx, cx2 - 11, cy2 - 5, 16, 2, '#2a3a8a'); rect(ctx, cx2 - 11, cy2, 20, 1, '#8a86a0'); rect(ctx, cx2 - 11, cy2 + 3, 14, 1, '#8a86a0');
    ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 4); rect(ctx, cx2 - 14 + ((t * 40) % 28), cy2 - 8, 3, 17, '#ffffff'); ctx.globalAlpha = 1;
    // a phone, filming, because she was filming before she said anything
    rect(ctx, sx + 20, sy - 56, 12, 20, '#1a1620'); rect(ctx, sx + 21, sy - 55, 10, 16, '#3a4a6a');
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 9); rect(ctx, sx + 22, sy - 54, 3, 3, '#ff5a5a'); ctx.globalAlpha = 1;
    drawParty(ctx, 86, 430, t);
  },
  rain(ctx, t) {
    drawMysteryStreet(ctx, t, 6, { night: true, wet: true });
    // umbrellas going up all at once
    for (let i = 0; i < 6; i++) {
      const ux = 420 + i * 92, uy = 404 - (i % 2) * 8, open = clamp(t * 1.6 - i * 0.22, 0, 1);
      const w = Math.round(6 + open * 30);
      drawShadow(ctx, ux, uy + 24, 24);
      drawBugAt(ctx, MYSTERY_BUGS.crowd[i % MYSTERY_BUGS.crowd.length], ux, uy + 24, { pose: 'idle', scale: 1.25 });
      rect(ctx, ux - 1, uy - 26, 2, 30, '#5a4a3a');
      ellipsePx(ctx, ux, uy - 26, w, Math.round(4 + open * 10), ['#c8402c', '#2a4a8a', '#f0f0e8', '#3a8a5a', '#d8a030', '#8a4fd0'][i % 6]);
      ellipsePx(ctx, ux, uy - 28, w - 2, Math.round(3 + open * 8), lighten(['#c8402c', '#2a4a8a', '#f0f0e8', '#3a8a5a', '#d8a030', '#8a4fd0'][i % 6], 0.22));
    }
    drawParty(ctx, 86, 430, t, 'idle');
  },
  crane(ctx, t) {
    // a game centre, lit like an altar
    vgrad(ctx, 0, 0, W, H, '#1a1430', '#0e0a1a');
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.1; rect(ctx, 40 + i * 190, 0, 120, H, ['#ff5a9a', '#5ac8ff', '#ffd24a', '#8a4fd0', '#6be585'][i]); ctx.globalAlpha = 1; }
    rect(ctx, 0, 440, W, H - 440, '#241c34'); rect(ctx, 0, 440, W, 3, '#443a58');
    // the cabinet
    const cx = 560, cy = 440;
    rect(ctx, cx - 110, cy - 250, 220, 250, '#2a2040'); rect(ctx, cx - 110, cy - 250, 220, 5, '#ff5a9a');
    rect(ctx, cx - 100, cy - 236, 200, 150, '#0c1420');
    ctx.globalAlpha = 0.2; rect(ctx, cx - 100, cy - 236, 200, 150, '#8ad8ff'); ctx.globalAlpha = 1;
    frame(ctx, cx - 100, cy - 236, 200, 150, '#5ac8ff');
    // the claw, tracking left and right
    const clx = cx + Math.sin(t * 0.8) * 70;
    rect(ctx, cx - 100, cy - 232, 200, 4, '#6a6a86');
    rect(ctx, clx - 2, cy - 228, 4, 34, '#8a8aa8');
    for (const d of [-1, 1]) { line(ctx, clx, cy - 194, clx + d * 9, cy - 180, '#c8c8e0'); line(ctx, clx + d * 9, cy - 180, clx + d * 12, cy - 168, '#c8c8e0'); }
    // the frog, wedged against the glass, unmoved
    const fx = cx + 34, fy = cy - 108;
    ellipsePx(ctx, fx, fy, 34, 28, '#2a6a30'); ellipsePx(ctx, fx, fy - 2, 33, 26, '#4aa044');
    for (const d of [-1, 1]) { ellipsePx(ctx, fx + d * 15, fy - 22, 10, 9, '#4aa044'); ellipsePx(ctx, fx + d * 15, fy - 22, 6, 6, '#f4f0e0'); ellipsePx(ctx, fx + d * 15, fy - 21, 3, 3, '#1a1620'); }
    rect(ctx, fx - 14, fy + 6, 28, 2, '#2a6a30');
    // coin slot and the panel
    rect(ctx, cx - 60, cy - 72, 120, 40, '#3a2c50'); rect(ctx, cx - 60, cy - 72, 120, 2, '#6a5a88');
    ellipsePx(ctx, cx - 30, cy - 52, 9, 9, '#c83a4a'); ellipsePx(ctx, cx - 30, cy - 54, 8, 8, '#ff5a6a');
    rect(ctx, cx + 22, cy - 60, 3, 14, '#1a1620');
    drawParty(ctx, 86, 440, t, 'idle');
  },
  train(ctx, t) {
    // a platform at forty minutes past midnight
    vgrad(ctx, 0, 0, W, 240, '#141020', '#1e1830');
    rect(ctx, 0, 0, W, 60, '#20203a');
    for (let i = 0; i < 7; i++) { rect(ctx, 46 + i * 140, 44, 80, 6, '#e8f0ff'); ctx.globalAlpha = 0.1; rect(ctx, 30 + i * 140, 50, 112, 70, '#cfe0ff'); ctx.globalAlpha = 1; }
    // the board
    rect(ctx, 320, 66, 320, 46, '#0c0c14'); frame(ctx, 320, 66, 320, 46, '#3a3a50');
    drawText(ctx, '00:42  LAST', 336, 78, '#ffb340', { scale: 2 });
    ctx.globalAlpha = Math.sin(t * 6) > 0 ? 1 : 0.25; drawText(ctx, 'DEPARTING', 336, 96, '#ff5a5a'); ctx.globalAlpha = 1;
    // the train, with its doors closing
    const close = clamp((Math.sin(t * 0.7) + 1) / 2, 0, 1);
    rect(ctx, 0, 210, W, 150, '#7a8090'); rect(ctx, 0, 210, W, 6, '#aab0c0'); rect(ctx, 0, 348, W, 12, '#3a3e4a');
    for (let i = 0; i < 5; i++) { rect(ctx, 30 + i * 190, 226, 74, 54, '#1a2434'); frame(ctx, 30 + i * 190, 226, 74, 54, '#5a6070'); }
    rect(ctx, 0, 280, W, 4, '#4aa0d0');
    for (let i = 0; i < 4; i++) {
      const dx = 120 + i * 190, gap = Math.round(30 * (1 - close));
      rect(ctx, dx - 34, 226, 34 - gap, 96, '#969caa'); rect(ctx, dx + gap, 226, 34 - gap, 96, '#969caa');
      rect(ctx, dx - 34, 226, 34 - gap, 3, '#c0c6d4'); rect(ctx, dx + gap, 226, 34 - gap, 3, '#c0c6d4');
    }
    // the platform itself
    rect(ctx, 0, 360, W, H - 360, '#8a8880'); rect(ctx, 0, 360, W, 4, '#a8a69c');
    for (let x = 0; x < W; x += 12) rect(ctx, x, 372, 8, 8, '#d8c020');
    drawParty(ctx, 120, 452, t, 'idle');
  },
  vending(ctx, t) {
    drawMysteryStreet(ctx, t, 17, { night: true });
    // one machine, humming, in an otherwise empty street
    const vx = 560, vy = 430;
    ctx.globalAlpha = 0.2; ellipsePx(ctx, vx, vy - 60, 90, 70, '#8ad8ff'); ctx.globalAlpha = 1;
    ctx.drawImage(propCanvas('vending'), vx - 48, vy - 130, 96, 128);
    ctx.globalAlpha = 0.18 + 0.05 * Math.sin(t * 37); rect(ctx, vx - 44, vy - 126, 88, 78, '#cfe8ff'); ctx.globalAlpha = 1;
    // the two dollars it kept
    for (let i = 0; i < 2; i++) { const cy2 = vy - 18 + Math.sin(t * 2 + i) * 1.5; ellipsePx(ctx, vx - 8 + i * 16, cy2, 5, 5, '#b8860b'); ellipsePx(ctx, vx - 8 + i * 16, cy2 - 1, 4, 4, '#ffd24a'); }
    drawText(ctx, 'z', vx + 54 + Math.sin(t) * 3, vy - 120 - (t * 14 % 30), '#6a6a88', { scale: 2 });
    drawParty(ctx, 86, 430, t, 'idle');
  },
  koban(ctx, t) {
    drawMysteryStreet(ctx, t, 26, { night: true });
    const kx = 660, ky = 430;
    ctx.drawImage(propCanvas('koban'), kx - 56, ky - 118, 112, 118);
    // the light on top, turning
    ctx.globalAlpha = 0.28 + 0.2 * Math.sin(t * 5); ellipsePx(ctx, kx, ky - 124, 34, 16, '#ff5a5a'); ctx.globalAlpha = 1;
    const ox = kx - 74;
    drawShadow(ctx, ox, ky, 30);
    drawBugAt(ctx, MYSTERY_BUGS.officer, ox, ky + Math.round(Math.sin(t * 1.6)), { pose: 'idle', scale: 1.5, flip: true });
    drawParty(ctx, 86, 430, t, 'idle');
  },
};

// The people in these scenes, built once and kept, so the same vendor is the
// same vendor every time you meet him.
const MYSTERY_BUGS = (() => {
  const mk = (seed, over) => Object.assign(randomBugSpec(makeRng(seed)), over || {});
  return {
    vendor: mk(9101, { outfit: { happi: '#2a4a8a', happiTrim: '#f0e8d0', hachimaki: '#f0f0e8', apron: '#e8e0cc' } }),
    salaryman: mk(9102, { outfit: { jacket: '#2a2c38', shirt: '#f4f4ee', tie: '#8a2c2c', trousers: '#2a2c38' } }),
    rival: mk(9103, { outfit: { jacket: '#1a1620', tee: '#c8302a', hat: 'beanie', hatColor: '#2a2430' } }),
    monk: mk(9104, { outfit: { robe: '#7a4a1a', robeTrim: '#d9a520' } }),
    scout: mk(9105, { outfit: { jacket: '#2a2438', shirt: '#f0f0f4', trousers: '#2a2438', wristband: '#c58bff' } }),
    officer: mk(9106, { outfit: { jacket: '#1e2a58', shirt: '#dfe4f0', hat: 'cap', hatColor: '#16204a', trousers: '#1e2a58' } }),
    crowd: [mk(9110), mk(9111), mk(9112), mk(9113), mk(9114), mk(9115)],
    schoolgirls: [mk(9120, { outfit: { jacket: '#2a2c4a', shirt: '#f4f4ee', skirt: '#8a2c4a', wristband: '#ff9fef' } }),
                  mk(9121, { outfit: { jacket: '#2a2c4a', shirt: '#f4f4ee', skirt: '#8a2c4a', wristband: '#8ad8ff' } }),
                  mk(9122, { outfit: { jacket: '#2a2c4a', shirt: '#f4f4ee', skirt: '#8a2c4a', wristband: '#ffd24a' } })],
    office: [mk(9130, { outfit: { jacket: '#2a2c38', shirt: '#f4f4ee', tie: '#8a2c2c' } }),
             mk(9131, { outfit: { jacket: '#38323c', shirt: '#eef0f4', tie: '#2c4a8a' } }),
             mk(9132, { outfit: { jacket: '#2c3830', shirt: '#f4f0e6', tie: '#7a6a2a' } }),
             mk(9133, { outfit: { jacket: '#382c34', shirt: '#f0eef4', tie: '#4a2c6a' } })],
  };
})();

// ---------- The scene ----------
class MysteryScene {
  constructor(node) {
    const r = Game.run;
    r.seenMysteries = r.seenMysteries || [];
    let pool = MYSTERIES.filter(m => !r.seenMysteries.includes(m.id));
    if (!pool.length) { r.seenMysteries = []; pool = MYSTERIES.slice(); }
    this.m = r.rng.pick(pool); r.seenMysteries.push(this.m.id);
    this.node = node; this.t = 0; this.phase = 'reveal'; this.log = []; this.game = null;
    this.fx = new Particles();
    // Every encounter opens as a scene: whoever is there says their piece
    // before you are handed a menu. The choices are the end of a conversation,
    // not the whole of it.
    const sp = MYSTERY_BUGS[this.m.speaker] || null;
    this.cut = new Cutscene((this.m.beats || []).map(bt => ({
      name: bt.who || (this.m.speakerName || null), spec: bt.self ? (Game.run && Game.run.members[0] || {}).spec : sp,
      text: bt.text, tint: bt.self ? '#6be585' : (this.m.tint || '#ffd24a'), flip: !bt.self, expr: bt.expr, pose: bt.pose,
    })), { onEnd: () => { this.phase = 'choose'; } });
    if (!this.cut.beats.length) this.cut = null;
    this.buildChoices();
  }
  buildChoices() {
    const r = Game.run;
    this.menu = new Menu(this.m.choices.map((c) => ({
      label: c.label, icon: c.game ? 'note' : null,
      disabled: c.req ? !c.req(r) : false,
      onSelect: () => { if (c.game) this.startGame(c); else this.resolve(c.apply); },
    })));
  }
  resolve(apply) {
    const r = Game.run;
    apply(r, (s) => this.log.push(s));
    this.phase = 'done'; r.save(); Audio.ui('select');
    this.menu = new Menu([{ label: 'CONTINUE', onSelect: () => Game.go(() => new CityScene(), 'slideR') }]);
  }
  // ---- the two things you can be asked to actually play ----
  startGame(c) {
    this.phase = 'game'; this.choice = c;
    if (c.game === 'timing') this.game = { kind: 'timing', p: 0, dir: 1, speed: 0.95, zone: 0.34 + Math.random() * 0.3, half: 0.085, over: false };
    else this.game = { kind: 'copy', seq: [], you: [], step: 0, showAt: 0, shown: -1, over: false, t: 0 };
    if (this.game.kind === 'copy') { const n = 4; for (let i = 0; i < n; i++) this.game.seq.push(Math.floor(Math.random() * 4)); }
    Audio.ui('select');
  }
  endGame(won) {
    if (this.game.over) return;
    this.game.over = true; this.game.won = won;
    Audio.ui(won ? 'fanfare' : 'error');
    if (this.mods) this.mods = null;
    setTimeout(() => { }, 0);
    this.pending = won ? this.choice.good : this.choice.bad;
    this.gameEndT = 0;
  }
  update(dt) {
    this.t += dt; this.fx.update(dt);
    if (this.phase === 'reveal' && this.t > 0.5) this.phase = this.cut ? 'talk' : 'choose';
    if (this.phase === 'talk' && this.cut) this.cut.update(dt);
    const g = this.game;
    if (this.phase === 'game' && g && !g.over) {
      if (g.kind === 'timing') {
        g.p += g.dir * g.speed * dt;
        if (g.p > 1) { g.p = 1; g.dir = -1; } else if (g.p < 0) { g.p = 0; g.dir = 1; }
      } else {
        g.t += dt;
        // play the phrase, then hand it back
        if (g.step === 0) {
          const i = Math.floor(g.t / 0.45);
          if (i !== g.shown && i < g.seq.length) { g.shown = i; Audio.note('piano', 60 + g.seq[i] * 4, 0, 0.32, 0.5); }
          if (g.t > g.seq.length * 0.45 + 0.25) { g.step = 1; g.shown = -1; }
        }
      }
    }
    if (g && g.over) { this.gameEndT += dt; if (this.gameEndT > 0.9 && this.pending) { const f = this.pending; this.pending = null; this.resolve(f); } }
  }
  // the four pads of the copy game, and the bar of the timing game
  pads() { const y = 344, w = 92, gap = 14, total = 4 * w + 3 * gap, x0 = Math.round((W - total) / 2); return [0, 1, 2, 3].map(i => ({ i, x: x0 + i * (w + gap), y, w, h: 72 })); }
  hitGame(x, y) {
    const g = this.game; if (!g || g.over) return;
    if (g.kind === 'timing') { this.stopNeedle(); return; }
    if (g.step !== 1) return;
    const p = this.pads().find(q => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
    if (!p) return;
    this.tapPad(p.i);
  }
  tapPad(i) {
    const g = this.game; if (!g || g.over || g.step !== 1) return;
    Audio.note('piano', 60 + i * 4, 0, 0.3, 0.55);
    g.flash = { i, t: 0.18 };
    g.you.push(i);
    const k = g.you.length - 1;
    if (g.seq[k] !== i) { this.endGame(false); return; }
    if (g.you.length === g.seq.length) this.endGame(true);
  }
  stopNeedle() {
    const g = this.game; if (!g || g.over) return;
    const hit = Math.abs(g.p - g.zone) <= g.half;
    const cx = 200 + g.p * 560;
    this.fx.burst(cx, 318, hit ? 16 : 6, { color: hit ? ['#6be585', '#fff'] : ['#ff5a5a', '#8a3030'], speed: hit ? 140 : 70, life: 0.45, kind: 'spark', gravity: 120, size: 2 });
    this.endGame(hit);
  }
  key(code) {
    if (this.phase === 'talk') { if (['Enter', 'Space', 'KeyZ'].includes(code)) this.cut.advance(); return; }
    if (this.phase === 'choose') {
      const n = this.menu.items.length;
      if (code === 'ArrowLeft' || code === 'KeyA') { this.menu.idx = (this.menu.idx + n - 1) % n; Audio.ui('move'); return; }
      if (code === 'ArrowRight' || code === 'KeyD') { this.menu.idx = (this.menu.idx + 1) % n; Audio.ui('move'); return; }
      if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.menu.select(); return; }
      return;
    }
    if (this.phase === 'game') {
      const g = this.game; if (!g || g.over) return;
      if (g.kind === 'timing') { if (['Space', 'Enter'].includes(code)) this.stopNeedle(); return; }
      const i = ['KeyD', 'KeyF', 'KeyJ', 'KeyK'].indexOf(code);
      if (i >= 0) this.tapPad(i);
      return;
    }
    this.menu.key(code);
  }
  click(x, y) {
    if (this.phase === 'talk') { this.cut.advance(); return; }
    if (this.phase === 'game') { this.hitGame(x, y); return; }
    if (this.phase === 'choose' && this.cards) {
      for (const k of this.cards) if (x >= k.x && x < k.x + k.w && y >= k.y - 12 && y < k.y + k.h) { this.menu.idx = k.i; this.menu.select(); return; }
      return;
    }
    this.menu.click(x, y);
  }
  hover(x, y) {
    if (this.phase === 'choose' && this.cards) { for (const k of this.cards) if (x >= k.x && x < k.x + k.w && y >= k.y - 12 && y < k.y + k.h) this.menu.idx = k.i; return; }
    if (this.phase !== 'game') this.menu.hover(x, y);
  }
  draw(ctx) {
    const art = MYSTERY_ART[this.m.scene] || MYSTERY_ART.dango;
    // Right in. These are the only scenes in the game with one thing happening
    // in them, so the camera pushes past the wide shot and holds on it: about
    // a 1.7x punch centred on the action, drifting slowly so it never sits
    // still. Everything below is drawn on top of it, unscaled.
    rect(ctx, 0, 0, W, H, '#120e1e');
    // The action in every vignette sits around (560, 360) in its own space —
    // the cart, the bench, the machine, whoever is talking — so that is what
    // the camera is pointed at, not the middle of a mostly empty frame.
    const z = 1.7;
    const fx2 = 560 + Math.sin(this.t * 0.2) * 18, fy2 = 352 + Math.cos(this.t * 0.15) * 8;
    ctx.save();
    ctx.translate(W / 2, H / 2 - 28); ctx.scale(z, z); ctx.translate(-fx2, -fy2);
    art(ctx, this.t);
    ctx.restore();
    // vignette the punch-in, so the eye goes where the camera went
    vignetteRect(ctx, 0, 0, W, H - 150, 0.5, '#0a0812');
    rect(ctx, 0, H - LIFT - 2, W, LIFT + 2, '#241c30');
    rect(ctx, 0, H - LIFT - 2, W, 2, '#3a2e48');
    // a little grade so the panel always reads over whatever is behind it
    vgrad(ctx, 0, H - 250, W, 250, 'rgba(10,8,18,0)', 'rgba(10,8,18,0.62)');
    if (this.phase === 'reveal') {
      // the ? cracking open
      const k = clamp(this.t / 0.5, 0, 1);
      ctx.globalAlpha = 1 - k; rect(ctx, 0, 0, W, H, '#0a0814'); ctx.globalAlpha = 1;
      ctx.globalAlpha = (1 - k) * 0.9;
      drawText(ctx, '?', W / 2, H / 2 - 40 - k * 30, '#c58bff', { align: 'center', scale: Math.round(8 + k * 6), outline: '#1a1030' });
      ctx.globalAlpha = 1;
      Game.drawHud(ctx); return;
    }
    if (this.phase === 'talk') { this.cut.draw(ctx); return; }
    if (this.phase === 'game') { this.drawGame(ctx); this.fx.draw(ctx); Game.drawHud(ctx); return; }
    // The choices are cards across the bottom, not a list of small rows: one
    // banner saying where you are, then two to four fat options you can read
    // across a room and hit with a thumb.
    const title = this.m.title;
    uiRibbon(ctx, W / 2, H - 206, title, { scale: 3, color: '#8a4fd0' });
    if (this.phase === 'done') {
      const inner = uiPanel(ctx, 60, H - 172, W - 120, 152);
      let y = inner.y + 12;
      for (const l of this.log) y += drawWrapped(ctx, l, inner.x + 16, y, 62, '#7a4a10', 20, { scale: 2 }) + 8;
      this.menu.draw(ctx, inner.x + 16, inner.y + inner.h - 44, inner.w - 32, 36, 'buttons');
      this.fx.draw(ctx); Game.drawHud(ctx); return;
    }
    this.drawCards(ctx);
    this.fx.draw(ctx);
    Game.drawHud(ctx);
  }
  // Where each choice card sits. Two, three or four across the bottom.
  cardRects() {
    const n = this.m.choices.length;
    const gap = 12, side = 40, total = W - side * 2;
    const cw = Math.floor((total - gap * (n - 1)) / n), ch = 150;
    return this.m.choices.map((c, i) => ({ i, c, x: side + i * (cw + gap), y: H - ch - 14, w: cw, h: ch }));
  }
  drawCards(ctx) {
    const r = Game.run;
    this.cards = this.cardRects();
    for (const k of this.cards) {
      const dis = k.c.req ? !k.c.req(r) : false, sel = this.menu.idx === k.i;
      const lift = sel && !dis ? 6 : 0;
      const y = k.y - lift;
      const face = dis ? '#2a2736' : sel ? '#33294f' : '#221d38';
      const edge = dis ? '#4a4658' : sel ? '#ffd24a' : '#6a5f9a';
      rect(ctx, k.x + 4, y + 6, k.w, k.h, 'rgba(6,4,12,0.5)');
      rect(ctx, k.x, y, k.w, k.h, face);
      frame(ctx, k.x, k.y - lift, k.w, k.h, edge);
      frame(ctx, k.x + 2, y + 2, k.w - 4, k.h - 4, dis ? '#241f30' : '#2e2748');
      // a colour bar at the head of the card saying what kind of choice it is
      const kind = k.c.game ? { col: '#c58bff', text: 'PLAY FOR IT' } : dis ? { col: '#5a5668', text: 'CANNOT' } : { col: '#3f8a52', text: 'CHOOSE' };
      rect(ctx, k.x + 3, y + 3, k.w - 6, 22, kind.col);
      rect(ctx, k.x + 3, y + 3, k.w - 6, 2, lighten(kind.col, 0.35));
      drawText(ctx, kind.text, k.x + k.w / 2, y + 9, '#12101c', { align: 'center', scale: 2 });
      // the label, as big as it will go
      let sc = 3; while (sc > 1 && textWidth(k.c.label, { scale: sc }) > k.w - 16) sc--;
      const lines = sc > 1 ? [k.c.label] : wrapText(k.c.label, Math.floor((k.w - 16) / 6));
      let ty = y + 40;
      for (const ln of lines.slice(0, 4)) { drawText(ctx, ln, k.x + k.w / 2, ty, dis ? '#6a6480' : '#f2ecff', { align: 'center', scale: sc }); ty += sc > 1 ? 7 * sc + 6 : 12; }
      if (sel && !dis) {
        // the marker, so the keyboard selection is as obvious as the hover
        for (let i = 0; i < 6; i++) rect(ctx, k.x + k.w / 2 - (5 - i), y - 12 + i, (5 - i) * 2 + 1, 1, '#ffd24a');
      }
      if (dis) { ctx.globalAlpha = 0.35; rect(ctx, k.x + 3, y + 3, k.w - 6, k.h - 6, '#12101c'); ctx.globalAlpha = 1; }
    }
    drawText(ctx, Game.touch ? 'TAP A CARD' : 'LEFT / RIGHT     ENTER', W / 2, H - 172, '#a79ce0', { align: 'center', font: 'small' });
  }
  drawGame(ctx) {
    const g = this.game;
    rect(ctx, 0, 240, W, 190, 'rgba(10,8,18,0.72)');
    rect(ctx, 0, 240, W, 2, '#6a5f9a'); rect(ctx, 0, 428, W, 2, '#6a5f9a');
    uiRibbon(ctx, W / 2, 252, this.choice.gameLabel || 'PLAY IT', { scale: 2 });
    if (g.kind === 'timing') {
      const x0 = 200, w = 560, y = 306;
      rect(ctx, x0 - 3, y - 3, w + 6, 30, '#12101c'); rect(ctx, x0, y, w, 24, '#2a2442');
      // the good stretch
      const zx = Math.round(x0 + (g.zone - g.half) * w), zw = Math.max(6, Math.round(g.half * 2 * w));
      rect(ctx, zx, y, zw, 24, '#2f7a48'); rect(ctx, zx, y, zw, 3, '#6be585');
      rect(ctx, zx + zw / 2 - 1, y, 2, 24, '#bdf5cc');
      frame(ctx, x0, y, w, 24, '#6a5f9a');
      // the needle
      const nx = Math.round(x0 + g.p * w);
      rect(ctx, nx - 2, y - 8, 5, 40, '#12101c'); rect(ctx, nx - 1, y - 7, 3, 38, g.over ? (g.won ? '#6be585' : '#ff5a5a') : '#ffd24a');
      drawText(ctx, Game.touch ? 'TAP TO STOP' : 'SPACE TO STOP', W / 2, y + 44, '#cfc9e6', { align: 'center' });
    } else {
      const showing = g.step === 0;
      drawText(ctx, showing ? 'LISTEN' : 'YOUR TURN', W / 2, 300, showing ? '#8ad8ff' : '#ffd24a', { align: 'center', scale: 2, outline: '#12101c' });
      const COLS = ['#e0503c', '#e8b840', '#3f6fb0', '#8a5fb0'];
      for (const p of this.pads()) {
        const lit = (showing && g.shown === g.seq.indexOf(p.i) && g.seq[g.shown] === p.i) || (g.flash && g.flash.i === p.i && g.flash.t > 0);
        const on = showing ? (g.shown >= 0 && g.seq[g.shown] === p.i) : lit;
        rect(ctx, p.x + 3, p.y + 4, p.w, p.h, 'rgba(8,6,14,0.5)');
        rect(ctx, p.x, p.y, p.w, p.h, on ? lighten(COLS[p.i], 0.35) : darken(COLS[p.i], 0.42));
        rect(ctx, p.x, p.y, p.w, 4, on ? '#fff8e0' : darken(COLS[p.i], 0.2));
        frame(ctx, p.x, p.y, p.w, p.h, '#12101c');
        if (!Game.touch) drawText(ctx, ['D', 'F', 'J', 'K'][p.i], p.x + p.w / 2, p.y + p.h - 16, on ? '#12101c' : '#cfc9e6', { align: 'center', scale: 2 });
      }
      // how much of the phrase you have given back
      for (let i = 0; i < g.seq.length; i++) {
        const dx = W / 2 - (g.seq.length - 1) * 9 + i * 18;
        rect(ctx, dx - 5, 424, 11, 8, i < g.you.length ? '#6be585' : '#3a3560');
      }
    }
    if (g.flash) { g.flash.t -= 1 / 60; if (g.flash.t <= 0) g.flash = null; }
    if (g.over) {
      const msg = g.won ? 'NAILED IT' : 'BLEW IT';
      comicBurst(ctx, W / 2, 388, msg, g.won ? '#6be585' : '#ff5a5a', clamp(this.gameEndT / 0.9, 0, 1), 1.5);
    }
  }
}
