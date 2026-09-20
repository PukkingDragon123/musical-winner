// ---------- The ride in ----------
// Ninety minutes of expressway between the airport and a bed, and you do not
// get to drive any of it. You sit in the back of Yuki's car with the heater on
// your shins, a seat belt across you, and the whole eastern edge of Tokyo
// going past the glass at ninety an hour. There is nothing to press. That is
// the point: the game has had you walking since Las Vegas and this is the bit
// where it lets you put the controller down, talks at you in a language you
// only half have, and then quietly takes your eyelids off you too.
//
// Everything in here is drawn twice over: once out through the window, which
// is the show, and once inside the cabin, which is the frame. The window
// painter is its own function because the capsule hotel's little porthole and
// anything else with night going past it can borrow it.
'use strict';

// ---------- the cabin, in screen pixels ----------
// Front of the car is at frame RIGHT, so the city runs right to left and reads
// as forward motion. The rear parcel shelf is the sliver at frame left.
const UBR = {
  winX: 60, winY: 62, winW: 636, winH: 228,   // the aperture you see the city through
  sill: 290,          // bottom of the glass, where the door card starts
  roof: 58,           // headliner
  floorY: 496,
  pillarX: 692, pillarW: 26,
  seatX: 712, seatW: 164,
  dashX: 872, dashW: 88,
};
// The horizon, a fixed fraction down the window. Everything hangs off it.
const UBR_HZN = 0.58;

// The boards along the expressway. Same parodies as everywhere else in the
// game, because a brand that changes its mind is not a brand.
const UBR_BILLBOARDS = [
  { name: 'COLONY MART', logo: 'store', col: '#2f8f4a', col2: '#f4f1ea', tag: 'ALWAYS OPEN' },
  { name: 'STARBUGS', logo: 'ring', col: '#0b6b4a', col2: '#f4f1ea', tag: 'SINCE THE FIRST ONE' },
  { name: 'BURGER MONARCH', logo: 'crown', col: '#c8402c', col2: '#ffd24a', tag: 'FLAME GRILLED' },
  { name: 'ANTTIES', logo: 'pretzel', col: '#e07a1a', col2: '#f4f1ea', tag: 'TWISTED FRESH' },
  { name: 'DRAGON FLY', logo: 'plane', col: '#12203f', col2: '#e0b23c', tag: 'THE LONG WAY ROUND' },
];

// ---------- a scrolling band ----------
// Every parallax layer is the same shape: cells of a fixed width, each one
// drawn from its own seed so it is the same building every time it comes
// round. `shift` is how far this layer has travelled.
function ubrBand(x, w, span, shift, fn) {
  const c0 = Math.floor(shift / span), c1 = Math.floor((shift + w) / span);
  for (let c = c0; c <= c1; c++) fn(Math.round(x - shift + c * span), c);
}
// Where a one-off set piece is, given the journey position it belongs at.
// Returns a screen x that sweeps the whole window once and then leaves.
function ubrSweep(x, w, k, at, width) {
  const u = (k - at) / width;
  if (u < -0.25 || u > 1.25) return null;
  return Math.round(lerp(x + w + 260, x - 460, u));
}

// ---------- THE WINDOW ----------
// t is distance, not time: the scene feeds it a clock that speeds up and slows
// down with the car, so everything in here slows together. k is how far into
// the journey we are, 0 at the airport fence and 1 at the kerb, and it drives
// the density of the city and the colour of the sky.
//
// Tokyo does not get darker the closer you get to it. It gets oranger. The sky
// lightens all the way in, and none of that light is the sun.
function drawCarWindow(ctx, x, y, w, h, t, k) {
  k = clamp(k || 0, 0, 1);
  const hz = Math.round(y + h * UBR_HZN);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  // ---- sky: three stops, all of them wrong for the hour
  const high = mixColor('#05070f', '#141026', k);
  const mid = mixColor('#0d1526', '#3a2236', k);
  const low = mixColor('#1b2a42', '#8a4a2c', k);
  vgrad(ctx, x, y, w, Math.round(h * 0.34), high, mid);
  vgrad(ctx, x, y + Math.round(h * 0.34), w, hz - (y + Math.round(h * 0.34)) + 2, mid, low);
  // the sodium haze sitting on the horizon, which is the city's own light
  // bouncing back off its own weather
  ctx.globalAlpha = 0.18 + 0.26 * k;
  for (let i = 0; i < 5; i++) rect(ctx, x, hz - 4 - i * 5, w, 5, mixColor('#3a4a7a', '#e08a3a', k));
  ctx.globalAlpha = 1;

  // the moon, hazy, barely moving, losing an argument with the streetlights
  const mx = Math.round(x + w * 0.74 - (t * 0.6) % (w * 2.4));
  if (mx > x - 60 && mx < x + w + 60) {
    ctx.globalAlpha = 0.10; circle(ctx, mx, y + 40, 26, '#ffe9c0'); ctx.globalAlpha = 1;
    circle(ctx, mx, y + 40, 13, mixColor('#f4f0d8', '#e8c89a', k));
    circle(ctx, mx + 5, y + 36, 11, withAlpha(high, 0.85));
  }
  // two aircraft on the approach, lights only. There is always one.
  for (let i = 0; i < 2; i++) {
    const ax = x + ((t * 1.4 + i * 520) % (w + 400)) - 200;
    const ay = y + 22 + i * 26;
    if (Math.sin(t * 2.4 + i * 2) > 0) px(ctx, ax, ay, '#ff5a4a');
    px(ctx, ax + 5, ay, '#cfd6e8');
    ctx.globalAlpha = 0.5; px(ctx, ax + 2, ay + 1, '#8ad8ff'); ctx.globalAlpha = 1;
  }

  // ---- FAR: the skyline, barely moving, red lights on everything tall
  // Aircraft-warning lamps. Once you have noticed them you cannot stop.
  ubrBand(x, w, 420, t * 0.10, function (bx, c) {
    const r = makeRng(hashStr('ubrfar' + c));
    const n = r.int(4, 7);
    let tx = bx + r.int(0, 30);
    for (let i = 0; i < n; i++) {
      const tw = r.int(24, 74);
      const th = Math.round(r.int(26, 92) * (0.45 + k * 0.95));
      const ty = hz - th;
      const body = mixColor('#0c1020', '#241a30', k);
      rect(ctx, tx, ty, tw, th, body);
      rect(ctx, tx, ty, tw, 2, lighten(body, 0.18));
      rect(ctx, tx, ty, 2, th, lighten(body, 0.12));
      // only the lit windows get drawn. A silhouette with holes in it reads
      // better at this size than a full grid ever does.
      const lit = Math.min(22, Math.round(tw * th / 220));
      for (let q = 0; q < lit; q++) {
        const wx = tx + 3 + r.int(0, Math.max(1, tw - 8));
        const wy = ty + 4 + r.int(0, Math.max(1, th - 10));
        ctx.globalAlpha = r.range(0.35, 0.9);
        rect(ctx, wx, wy, 2, 3, r.chance(0.16) ? '#8ad8ff' : '#ffe6a0');
        ctx.globalAlpha = 1;
      }
      if (th > 54) {
        const blink = Math.sin(t * 2.6 + c * 1.7 + i) > 0.1;
        rect(ctx, tx + Math.floor(tw / 2) - 1, ty - 6, 3, 6, darken(body, 0.2));
        if (blink) {
          circle(ctx, tx + Math.floor(tw / 2), ty - 7, 2, '#ff4a3a');
          ctx.globalAlpha = 0.22; circle(ctx, tx + Math.floor(tw / 2), ty - 7, 6, '#ff4a3a'); ctx.globalAlpha = 1;
        }
      }
      tx += tw + r.int(4, 22);
      if (tx > bx + 420) break;
    }
  });

  // the one tower everybody photographs, arriving late and lit orange
  const twr = ubrSweep(x, w, k, 0.70, 0.26);
  if (twr !== null) {
    const base = hz, ht = 150;
    ctx.fillStyle = '#c8602a';
    ctx.beginPath();
    ctx.moveTo(twr - 34, base); ctx.lineTo(twr - 9, base - ht * 0.62);
    ctx.lineTo(twr + 9, base - ht * 0.62); ctx.lineTo(twr + 34, base); ctx.fill();
    for (let i = 0; i < 9; i++) {
      const kk = i / 9, yy = base - ht * 0.62 * kk;
      ctx.globalAlpha = 0.5; rect(ctx, twr - lerp(34, 9, kk), yy, lerp(68, 18, kk), 1, '#ffb45a'); ctx.globalAlpha = 1;
    }
    rect(ctx, twr - 10, base - ht * 0.78, 20, ht * 0.18, '#e07a2a');
    rect(ctx, twr - 2, base - ht, 4, ht * 0.24, '#d8d2c4');
    for (let i = 0; i < 4; i++) rect(ctx, twr - 2, base - ht + i * 8, 4, 4, i % 2 ? '#c8402c' : '#f4f1ea');
    if (Math.sin(t * 3.1) > 0) circle(ctx, twr, base - ht - 3, 2, '#ff4a3a');
    ctx.globalAlpha = 0.12; ellipsePx(ctx, twr, base - ht * 0.4, 60, 70, '#ff9a4a'); ctx.globalAlpha = 1;
  }

  // ---- MID: the bay, the terminal, the sheds, the boards, the blocks
  const gnd = Math.round(y + h * 0.70);
  ubrBand(x, w, 300, t * 0.42, function (bx, c) {
    const r = makeRng(hashStr('ubrmid' + c));
    // what this cell is depends on how far in we are. The water and the
    // container stacks are the first half; after that it is all housing.
    const roll = r();
    let kind;
    if (k < 0.30) kind = roll < 0.34 ? 'bay' : roll < 0.62 ? 'boxes' : roll < 0.84 ? 'shed' : 'board';
    else if (k < 0.60) kind = roll < 0.16 ? 'boxes' : roll < 0.46 ? 'shed' : roll < 0.72 ? 'blocks' : 'board';
    else kind = roll < 0.58 ? 'blocks' : roll < 0.78 ? 'board' : 'shops';

    if (kind === 'bay') {
      // black water with the docks written on it in light
      rect(ctx, bx, hz, 300, gnd - hz + 10, '#080d18');
      for (let i = 0; i < 14; i++) {
        const lx = bx + r.int(0, 298), ll = r.int(6, 30);
        ctx.globalAlpha = r.range(0.12, 0.34);
        rect(ctx, lx, hz + 2, 1, ll, r.chance(0.3) ? '#ff9a4a' : '#8ad8ff');
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.07; rect(ctx, bx, hz + 6 + i * 7, 300, 2, '#cfd6e8'); ctx.globalAlpha = 1; }
      // a ship out there, going nowhere in particular
      if (r.chance(0.5)) {
        const sx2 = bx + r.int(30, 220);
        rect(ctx, sx2, hz - 7, 52, 7, '#141a26');
        rect(ctx, sx2 + 34, hz - 15, 12, 9, '#1b2434');
        px(ctx, sx2 + 40, hz - 17, '#ffe6a0');
        px(ctx, sx2 + 2, hz - 9, '#6be585');
      }
    } else if (kind === 'boxes') {
      // a container terminal, stacked four high, with a gantry over it
      rect(ctx, bx, gnd - 2, 300, 14, '#1a1f2c');
      const cols = ['#2f5a9a', '#8a2a1c', '#2f6a4a', '#8a6a2a', '#5a3a6a', '#b0562a'];
      for (let i = 0; i < 9; i++) {
        const cx2 = bx + 8 + i * 32, stack = r.int(1, 4);
        for (let s = 0; s < stack; s++) {
          const col = cols[r.int(0, cols.length - 1)];
          rect(ctx, cx2, gnd - 10 - s * 11, 30, 10, darken(col, 0.3));
          rect(ctx, cx2, gnd - 10 - s * 11, 30, 2, col);
          ctx.globalAlpha = 0.18; for (let g = 2; g < 30; g += 4) rect(ctx, cx2 + g, gnd - 9 - s * 11, 1, 8, '#000'); ctx.globalAlpha = 1;
        }
      }
      const gx = bx + r.int(40, 180);
      rect(ctx, gx, gnd - 84, 4, 84, '#3a4250'); rect(ctx, gx + 74, gnd - 84, 4, 84, '#3a4250');
      rect(ctx, gx - 14, gnd - 88, 110, 5, '#4a5462');
      rect(ctx, gx - 14, gnd - 88, 110, 1, '#6a7482');
      rect(ctx, gx + 30, gnd - 83, 10, 22, '#2a3040');
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + c); px(ctx, gx + 76, gnd - 90, '#ff4a3a'); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.1; ellipsePx(ctx, gx + 38, gnd - 30, 70, 44, '#ffe6a0'); ctx.globalAlpha = 1;
    } else if (kind === 'shed') {
      // a logistics shed. A hundred metres of corrugated nothing, and one
      // strip of windows where somebody is still on shift.
      const sh = r.int(30, 52);
      rect(ctx, bx + 6, gnd - sh, 288, sh, '#1a2130');
      rect(ctx, bx + 6, gnd - sh, 288, 3, '#2f3a4c');
      for (let i = 0; i < 288; i += 6) { ctx.globalAlpha = 0.12; rect(ctx, bx + 6 + i, gnd - sh + 3, 1, sh - 3, '#000'); ctx.globalAlpha = 1; }
      // saw-tooth roof
      for (let i = 0; i < 9; i++) {
        ctx.fillStyle = '#242c3c'; ctx.beginPath();
        ctx.moveTo(bx + 8 + i * 32, gnd - sh); ctx.lineTo(bx + 8 + i * 32 + 16, gnd - sh - 11);
        ctx.lineTo(bx + 8 + i * 32 + 32, gnd - sh); ctx.fill();
        ctx.globalAlpha = 0.4; rect(ctx, bx + 8 + i * 32 + 16, gnd - sh - 11, 14, 8, '#8ad8ff'); ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 10; i++) if (r.chance(0.55)) rect(ctx, bx + 16 + i * 28, gnd - sh + 12, 18, 9, '#ffe6a0');
      // the loading bay, with one van still backed up to it
      rect(ctx, bx + 40, gnd - 16, 34, 16, '#0d1018');
      if (r.chance(0.6)) { rect(ctx, bx + 76, gnd - 18, 30, 18, '#c8c2b4'); rect(ctx, bx + 76, gnd - 18, 30, 3, '#e8e2d4'); rect(ctx, bx + 100, gnd - 12, 6, 6, '#2a3040'); }
    } else if (kind === 'blocks') {
      // mansion blocks. Every balcony the same, every third one lit, all of
      // them with a washing pole nobody brought in.
      let ax2 = bx + r.int(0, 24);
      for (let b = 0; b < 4; b++) {
        const bw = r.int(52, 86), bh = Math.round(r.int(50, 96) * (0.7 + k * 0.6));
        const col = mixColor('#242a3c', '#38303e', r());
        rect(ctx, ax2, gnd - bh, bw, bh, col);
        rect(ctx, ax2, gnd - bh, bw, 2, lighten(col, 0.2));
        const rows = Math.floor((bh - 8) / 12);
        for (let ry = 0; ry < rows; ry++) {
          const yy = gnd - bh + 6 + ry * 12;
          rect(ctx, ax2 + 2, yy + 7, bw - 4, 2, darken(col, 0.3));
          for (let cx2 = ax2 + 4; cx2 < ax2 + bw - 8; cx2 += 13) {
            if (r.chance(0.42)) {
              rect(ctx, cx2, yy, 9, 7, r.chance(0.2) ? '#bfe0ff' : '#ffd88a');
              ctx.globalAlpha = 0.14; rect(ctx, cx2 - 2, yy - 1, 13, 9, '#ffd88a'); ctx.globalAlpha = 1;
            } else rect(ctx, cx2, yy, 9, 7, darken(col, 0.25));
            if (r.chance(0.16)) rect(ctx, cx2, yy + 8, 9, 1, '#cfd6e8');
          }
        }
        // the water tank on the roof, which every one of them has
        if (r.chance(0.5)) { rect(ctx, ax2 + bw / 2 - 9, gnd - bh - 9, 18, 9, '#3a4250'); rect(ctx, ax2 + bw / 2 - 9, gnd - bh - 9, 18, 2, '#5a6472'); }
        ax2 += bw + r.int(3, 14);
        if (ax2 > bx + 300) break;
      }
    } else if (kind === 'shops') {
      // the low stuff under the expressway: a strip of shutters, a pachinko
      // parlour doing far too well, and one vertical sign per doorway
      rect(ctx, bx, gnd - 34, 300, 34, '#1d2130');
      for (let i = 0; i < 9; i++) {
        const sx2 = bx + 4 + i * 33;
        rect(ctx, sx2, gnd - 28, 28, 28, r.chance(0.5) ? '#2a2f40' : '#242838');
        if (r.chance(0.55)) { rect(ctx, sx2 + 2, gnd - 24, 24, 16, '#ffd88a'); ctx.globalAlpha = 0.16; rect(ctx, sx2 - 2, gnd - 28, 32, 30, '#ffd88a'); ctx.globalAlpha = 1; }
        else for (let g = 0; g < 26; g += 3) rect(ctx, sx2 + 1, gnd - 26 + g, 26, 2, '#3a3f4e');
        if (r.chance(0.4)) neonStrip(ctx, sx2 + 9, gnd - 58, 10, 30, r.pick(['#ff5a9a', '#8ad8ff', '#ffd24a', '#6be585']), t, c * 7 + i);
      }
    } else {
      // a board on legs, lit from underneath, selling something you will buy
      const b = UBR_BILLBOARDS[Math.abs(c + (r.chance(0.5) ? 1 : 0)) % UBR_BILLBOARDS.length];
      const bw = 132, bh = 44, bx2 = bx + r.int(20, 130), by2 = gnd - r.int(58, 96);
      rect(ctx, bx2 + 12, by2 + bh, 6, gnd - by2 - bh, '#2a3040');
      rect(ctx, bx2 + bw - 18, by2 + bh, 6, gnd - by2 - bh, '#2a3040');
      brandBoard(ctx, bx2, by2, bw, bh, b, t);
      ctx.globalAlpha = 0.12; ellipsePx(ctx, bx2 + bw / 2, by2 + bh + 16, bw * 0.7, 26, b.col2 || '#f4f1ea'); ctx.globalAlpha = 1;
      rect(ctx, bx, gnd - 8, 300, 8, '#171c28');
    }
  });

  // the cables, which run right across every cell so the sag never breaks
  ubrBand(x, w, 300, t * 0.42, function (bx, c) {
    ctx.strokeStyle = 'rgba(10,12,22,0.75)'; ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(bx, gnd - 96 + i * 6);
      ctx.quadraticCurveTo(bx + 150, gnd - 70 + i * 7, bx + 300, gnd - 96 + i * 6);
      ctx.stroke();
    }
    if (c % 2 === 0) {
      // a lattice pylon holding them up, drawn as a ladder because at this
      // size that is exactly what a pylon looks like
      const px2 = bx + 40;
      rect(ctx, px2 - 10, gnd - 118, 3, 118, '#161b28');
      rect(ctx, px2 + 9, gnd - 118, 3, 118, '#161b28');
      for (let i = 0; i < 11; i++) rect(ctx, px2 - 10, gnd - 112 + i * 11, 22, 2, '#161b28');
      rect(ctx, px2 - 20, gnd - 112, 42, 3, '#1b2130');
      rect(ctx, px2 - 16, gnd - 96, 34, 3, '#1b2130');
      if (Math.sin(t * 2.2 + c) > 0.2) px(ctx, px2, gnd - 121, '#ff4a3a');
    }
  });

  // the bridge over the bay, once, early, enormous
  const brg = ubrSweep(x, w, k, 0.18, 0.22);
  if (brg !== null) {
    const deck = gnd - 26;
    rect(ctx, brg - 300, deck, 600, 8, '#1b2434');
    rect(ctx, brg - 300, deck, 600, 2, '#33405a');
    for (const s of [-1, 1]) {
      const tx2 = brg + s * 120;
      rect(ctx, tx2 - 5, deck - 104, 4, 104, '#2a3550');
      rect(ctx, tx2 + 3, deck - 104, 4, 104, '#2a3550');
      rect(ctx, tx2 - 8, deck - 76, 18, 4, '#2a3550');
      rect(ctx, tx2 - 8, deck - 104, 18, 4, '#33405a');
      ctx.strokeStyle = 'rgba(80,100,150,0.55)'; ctx.lineWidth = 1;
      for (let i = 1; i < 9; i++) {
        ctx.beginPath(); ctx.moveTo(tx2 + s, deck - 100 + i * 3);
        ctx.lineTo(tx2 + s * (i * 15), deck); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(tx2 + s, deck - 100 + i * 3);
        ctx.lineTo(tx2 - s * (i * 15), deck); ctx.stroke();
      }
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + s); px(ctx, tx2, deck - 106, '#ff4a3a'); ctx.globalAlpha = 1;
    }
    for (let i = -18; i < 18; i++) { ctx.globalAlpha = 0.5; rect(ctx, brg + i * 17, deck - 5, 2, 5, '#ffd88a'); ctx.globalAlpha = 1; }
  }

  // ---- NEAR: the barrier, the posts, the lamps. This is the speed.
  const barTop = Math.round(y + h * 0.80);
  rect(ctx, x, barTop + 12, w, y + h - barTop - 12, '#15161d');   // tarmac below
  // the road itself, smeared into horizontal light because you are doing ninety
  for (let i = 0; i < 9; i++) {
    const ry = barTop + 16 + i * 4;
    ctx.globalAlpha = 0.05 + 0.04 * ((i * 7) % 3);
    rect(ctx, x, ry, w, 1, '#cfd6e8');
    ctx.globalAlpha = 1;
  }
  ubrBand(x, w, 130, t * 3.0, function (bx) {
    // white lane dashes, seen in the gap under the barrier
    ctx.globalAlpha = 0.5; rect(ctx, bx, barTop + 26, 54, 3, '#e8e6dc'); ctx.globalAlpha = 1;
  });
  // the concrete crash barrier, continuous, with a joint every cell
  rect(ctx, x, barTop, w, 14, '#4a4a52');
  rect(ctx, x, barTop, w, 3, '#6f6f79');
  rect(ctx, x, barTop + 11, w, 3, '#2f2f38');
  ubrBand(x, w, 130, t * 3.0, function (bx) {
    rect(ctx, bx, barTop, 2, 14, '#33333c');
    // a delineator, orange, doing its one job
    rect(ctx, bx + 64, barTop - 9, 3, 9, '#8a8f98');
    rect(ctx, bx + 64, barTop - 9, 3, 4, '#ff8a2a');
  });
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 5; i++) rect(ctx, x, barTop + 3 + i, w, 1, '#1a1a22');
  ctx.globalAlpha = 1;

  // the lamp posts, strobing. Each one throws its cone forward and a smear of
  // sodium across the whole pane as it goes.
  ubrBand(x, w, 130, t * 3.0, function (bx, c) {
    if (c % 2) return;
    const lx = bx + 30;
    rect(ctx, lx, y - 10, 5, barTop - y + 10, '#20222c');
    rect(ctx, lx, y - 10, 2, barTop - y + 10, '#33353f');
    rect(ctx, lx - 22, y + 4, 26, 5, '#20222c');
    rect(ctx, lx - 26, y + 7, 16, 4, '#ffdca0');
    ctx.globalAlpha = 0.16; ellipsePx(ctx, lx - 18, y + 12, 26, 16, '#ffdca0'); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,214,150,0.07)';
    ctx.beginPath();
    ctx.moveTo(lx - 26, y + 10); ctx.lineTo(lx - 8, y + 10);
    ctx.lineTo(lx + 54, barTop + 6); ctx.lineTo(lx - 86, barTop + 6); ctx.fill();
  });

  // an overhead sign gantry, green, with an exit you are not taking
  ubrBand(x, w, 130 * 9, t * 3.0, function (bx) {
    const gx = bx + 60;
    rect(ctx, gx - 6, y - 4, 6, barTop - y + 4, '#2a2d38');
    rect(ctx, gx + 152, y - 4, 6, barTop - y + 4, '#2a2d38');
    rect(ctx, gx - 10, y + 16, 172, 6, '#3a3f4c');
    rect(ctx, gx, y + 22, 146, 46, '#0f3f2a');
    frame(ctx, gx, y + 22, 146, 46, '#0a2a1c');
    rect(ctx, gx, y + 22, 146, 2, '#2f7a52');
    for (let i = 0; i < 4; i++) drawKanaBlock(ctx, gx + 10 + i * 15, y + 30, 12, '#f4f1ea', i * 3 + 1);
    drawText(ctx, 'EXIT 9', gx + 78, y + 32, '#f4f1ea', { scale: 2 });
    drawText(ctx, 'SHIOMI  1 KM', gx + 10, y + 54, '#bfe0d0', { font: 'small' });
    ctx.globalAlpha = 0.12; rect(ctx, gx, y + 68, 146, 10, '#6be585'); ctx.globalAlpha = 1;
  });

  // the toll plaza. It happens once. He has opinions about it.
  const toll = ubrSweep(x, w, k, 0.36, 0.055);
  if (toll !== null) {
    rect(ctx, toll - 8, y - 4, 8, barTop - y + 8, '#2a2d38');
    rect(ctx, toll + 168, y - 4, 8, barTop - y + 8, '#2a2d38');
    rect(ctx, toll - 12, y + 6, 190, 10, '#3a3f4c');
    rect(ctx, toll - 12, y + 6, 190, 2, '#5a6070');
    for (let i = 0; i < 3; i++) {
      const cx2 = toll + 6 + i * 56;
      rect(ctx, cx2, y + 16, 46, 26, '#12101c'); frame(ctx, cx2, y + 16, 46, 26, '#2f3a4c');
      ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 6 + i);
      drawText(ctx, 'ETC', cx2 + 23, y + 23, i === 1 ? '#ff8a4a' : '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.14; ellipsePx(ctx, cx2 + 23, y + 46, 30, 18, i === 1 ? '#ff8a4a' : '#6be585'); ctx.globalAlpha = 1;
      // the booth and the barrier arm, already up
      rect(ctx, cx2 + 18, barTop - 40, 12, 40, '#3a4250');
      rect(ctx, cx2 + 16, barTop - 44, 16, 5, '#4a5462');
      rect(ctx, cx2 + 20, barTop - 36, 8, 10, '#ffd88a');
      rect(ctx, cx2 + 30, barTop - 34, 22, 3, '#e8503a');
    }
  }

  // a truck going the other way, which is the fastest thing in the frame
  const tk = ((t * 6.2) % (w * 3.2));
  const tkx = Math.round(x + w + 200 - tk);
  if (tkx > x - 300 && tkx < x + w + 240) {
    const ty2 = barTop - 30;
    rect(ctx, tkx, ty2, 150, 30, '#c8c2b4');
    rect(ctx, tkx, ty2, 150, 3, '#e8e2d4');
    rect(ctx, tkx, ty2 + 26, 150, 4, '#6a6458');
    for (let i = 0; i < 5; i++) rect(ctx, tkx + 12 + i * 28, ty2 + 6, 3, 18, '#a8a294');
    rect(ctx, tkx - 34, ty2 + 6, 34, 24, '#2f5a9a');
    rect(ctx, tkx - 34, ty2 + 6, 34, 3, '#4a7ac0');
    rect(ctx, tkx - 30, ty2 + 10, 14, 9, '#1b2434');
    rect(ctx, tkx - 36, ty2 + 22, 5, 5, '#ffe6a0');
    ctx.globalAlpha = 0.2; ellipsePx(ctx, tkx - 52, ty2 + 24, 30, 9, '#ffe6a0'); ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.55; px(ctx, tkx + 6 + i * 26, ty2 - 2, '#ff9a2a'); ctx.globalAlpha = 1; }
  }

  // ---- speed. Streaks of nothing, torn off the lamps.
  for (let i = 0; i < 16; i++) {
    const r = makeRng(hashStr('ubrstk' + i));
    const sy2 = y + 10 + r.int(0, h - 20);
    const sl = r.int(40, 190);
    const sx2 = x + ((r.range(0, w) + t * r.range(180, 420)) % (w + 260)) - 130;
    ctx.globalAlpha = 0.05 + 0.05 * r();
    rect(ctx, x + w - (sx2 - x), sy2, sl, 1, r.chance(0.3) ? '#ffd88a' : '#cfd6e8');
    ctx.globalAlpha = 1;
  }

  // ---- the glass itself
  // automotive green, the cabin ghosted in it, and the rain going sideways
  ctx.globalAlpha = 0.07; rect(ctx, x, y, w, h, '#2a6a5a'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.05;
  ellipsePx(ctx, x + w * 0.86, y + h * 0.5, 90, 80, '#f4f1ea');       // the headrest, reflected
  rect(ctx, x, y + h - 30, w, 30, '#ffd88a');                          // the door card catching light
  ctx.globalAlpha = 1;
  // the rain. It does not fall on a window at ninety, it crawls backwards.
  for (let i = 0; i < 44; i++) {
    const r = makeRng(hashStr('ubrrain' + i));
    const sp = r.range(70, 260);
    const rx = x + ((r.range(0, w) + t * sp) % (w + 120)) - 60;
    const sx2 = x + w - (rx - x);
    const ry = y + 6 + ((r.range(0, h) + t * 5) % (h - 12));
    const ln = Math.round(r.range(5, 16));
    ctx.globalAlpha = 0.20 + 0.2 * r();
    for (let q = 0; q < ln; q++) rect(ctx, sx2 + q, ry + Math.floor(q * 0.35), 1, 1, '#cfe4f4');
    ctx.globalAlpha = 0.55;
    rect(ctx, sx2 + ln, ry + Math.floor(ln * 0.35), 2, 2, '#eaf4ff');
    ctx.globalAlpha = 1;
  }
  // the beads that have not let go yet, which are the ones you watch
  for (let i = 0; i < 16; i++) {
    const r = makeRng(hashStr('ubrbead' + i));
    const hold = r.range(2, 9);
    const phase = (t * 0.25 + r()) % 1;
    const bx2 = x + r.range(8, w - 12) - phase * hold * 14;
    const by2 = y + r.range(8, h - 14) + phase * hold * 3;
    ctx.globalAlpha = 0.5;
    rect(ctx, bx2, by2, 2, 3, '#dfeefc');
    ctx.globalAlpha = 0.85; px(ctx, bx2, by2, '#ffffff'); ctx.globalAlpha = 1;
  }
  // cold in the corners, because the heater is on your shins and nowhere else
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 90; i++) {
    const r = makeRng(hashStr('ubrmist' + i));
    px(ctx, x + r.range(0, 60) + (r.chance(0.5) ? 0 : w - 60), y + r.range(0, h), '#cfd6e8');
  }
  ctx.globalAlpha = 1;
  vignetteRect(ctx, x, y, w, h, 0.5, '#050409');
  ctx.restore();
}

// ---------- little cabin pieces ----------
// Crochet. Every hire car in this country has it, always white, always
// scalloped along the bottom, always a shade cleaner than the seat under it.
function ubrLace(ctx, x, y, w, h, tone) {
  const cream = tone || '#f2efe4';
  rect(ctx, x, y, w, h, cream);
  rect(ctx, x, y, w, 2, '#ffffff');
  rect(ctx, x, y + h - 2, w, 2, '#d8d4c6');
  // the open weave, a grid of holes with a shadow under each one
  for (let yy = y + 4; yy < y + h - 5; yy += 6) {
    for (let xx = x + 3; xx < x + w - 3; xx += 6) {
      px(ctx, xx + ((yy - y) / 6 % 2 ? 3 : 0), yy, '#cdc8b8');
      px(ctx, xx + ((yy - y) / 6 % 2 ? 3 : 0), yy + 1, '#e2ded0');
    }
  }
  // the scallops along the hem
  for (let xx = x; xx < x + w; xx += 8) {
    ellipsePx(ctx, xx + 4, y + h, 4, 3, cream);
    ellipsePx(ctx, xx + 4, y + h - 1, 2, 2, '#d8d4c6');
  }
}
// The charm off the mirror: a brocade pouch on a cord, with a knot and a
// tassel, swinging a beat behind whatever the car does.
function ubrCharm(ctx, x, y, sway, t) {
  const bx = Math.round(x + sway), cord = 34;
  ctx.strokeStyle = '#b8342c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sway * 0.4, y + cord * 0.55, bx, y + cord); ctx.stroke();
  const py = y + cord;
  rect(ctx, bx - 8, py, 16, 20, '#7a1a26');
  rect(ctx, bx - 8, py, 16, 2, '#a83a44');
  rect(ctx, bx - 8, py + 18, 16, 2, '#4a0e16');
  rect(ctx, bx - 6, py + 4, 12, 3, '#e0b23c');
  rect(ctx, bx - 6, py + 10, 12, 2, '#e0b23c');
  rect(ctx, bx - 2, py + 3, 4, 11, '#ffd97a');
  rect(ctx, bx - 3, py - 3, 6, 4, '#c8a03a');
  // the tassel
  for (let i = -2; i <= 2; i++) rect(ctx, bx + i * 2, py + 20, 1, 6 + (i % 2 ? 2 : 0), '#e0b23c');
  ctx.globalAlpha = 0.16; ellipsePx(ctx, bx, py + 10, 14, 18, '#ffd97a'); ctx.globalAlpha = 1;
}
// A dashboard readout: black box, amber digits, a lens flare on the plastic.
function ubrReadout(ctx, x, y, w, h, label, big, small, col) {
  rect(ctx, x, y, w, h, '#0a0b12');
  frame(ctx, x, y, w, h, '#33353f');
  rect(ctx, x + 1, y + 1, w - 2, 1, '#4a4c58');
  rect(ctx, x + 3, y + 3, w - 6, h - 6, '#05060a');
  if (label) drawText(ctx, label, x + 5, y + 5, '#5a6070', { font: 'small' });
  if (big) {
    ctx.globalAlpha = 0.22; drawText(ctx, big, x + w - 5, y + 13, col, { align: 'right', scale: 2 }); ctx.globalAlpha = 1;
    drawText(ctx, big, x + w - 5, y + 12, col, { align: 'right', scale: 2 });
  }
  if (small) drawText(ctx, small, x + w - 5, y + h - 11, withAlpha(col, 0.7), { align: 'right', font: 'small' });
  ctx.globalAlpha = 0.07; rect(ctx, x + 3, y + 3, w - 6, 4, '#ffffff'); ctx.globalAlpha = 1;
}

// ---------- THE CABIN ----------
// Everything that is not the window. Drawn after it, so the frame sits over
// the show. S is the scene, and it is optional: pass nothing and you get a
// parked car with the radio off.
function drawCarInterior(ctx, t, S) {
  const radio = !!(S && S.radio), vent = !!(S && S.vent);
  const lamp = (t * 2.1) % 1;             // where the last streetlight has got to
  const dash = '#2a2f3c';

  // ---- the rubber seal round the glass, and the chrome sill under it
  rect(ctx, UBR.winX - 8, UBR.winY - 8, UBR.winW + 16, 8, '#171921');
  rect(ctx, UBR.winX - 8, UBR.winY - 8, UBR.winW + 16, 2, '#2b2f3c');
  rect(ctx, UBR.winX - 8, UBR.winY, 8, UBR.winH, '#171921');
  rect(ctx, UBR.winX + UBR.winW, UBR.winY, 8, UBR.winH, '#171921');
  rect(ctx, UBR.winX - 10, UBR.sill - 6, UBR.winW + 20, 6, '#1b1e28');
  rect(ctx, UBR.winX - 10, UBR.sill - 4, UBR.winW + 20, 2, '#8a8f98');
  // a gap of cold at the top if he has cracked it open for you
  if (vent) {
    rect(ctx, UBR.winX, UBR.winY, UBR.winW, 5, '#05060a');
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 9);
    rect(ctx, UBR.winX, UBR.winY + 4, UBR.winW, 1, '#bfe0ff');
    ctx.globalAlpha = 1;
  }

  // ---- the headliner. Grey fabric, a dome light nobody turns on, a handle.
  rect(ctx, -8, -4, W + 16, UBR.roof + 4, '#3a3a44');
  rect(ctx, -8, UBR.roof - 6, W + 16, 6, '#2b2b34');
  rect(ctx, -8, UBR.roof - 1, W + 16, 2, '#191a22');
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < W; i += 3) rect(ctx, i, 0, 1, UBR.roof - 6, '#ffffff');
  ctx.globalAlpha = 1;
  rect(ctx, 432, 8, 74, 20, '#2f2f38');
  rect(ctx, 436, 11, 66, 14, '#4a4a54');
  rect(ctx, 498, 13, 5, 9, '#1b1b24');
  // the grab handle, which is what you hold instead of saying anything
  rect(ctx, 156, 4, 10, 16, '#2b2b34');
  rect(ctx, 236, 4, 10, 16, '#2b2b34');
  rect(ctx, 160, 16, 82, 9, '#3f3f4a');
  rect(ctx, 160, 16, 82, 2, '#56565f');
  rect(ctx, 160, 23, 82, 2, '#24242c');
  // the dash throwing green up onto all of it, from off the right of frame
  ctx.globalAlpha = 0.10; ellipsePx(ctx, 930, 30, 150, 60, '#4ad8a0'); ctx.globalAlpha = 1;
  // and a streetlight, sliding
  ctx.globalAlpha = 0.09;
  rect(ctx, W - lamp * (W + 300), 0, 110, UBR.roof, '#ffd88a');
  ctx.globalAlpha = 1;

  // ---- frame left: the rear quarter panel, the shelf, the tissues
  rect(ctx, -6, UBR.roof, UBR.winX - 54 + 60, UBR.floorY - UBR.roof, '#262933');
  rect(ctx, -6, UBR.roof, 56, 4, '#343846');
  // a triangle of night in the quarter window
  ctx.fillStyle = '#0a0d16';
  ctx.beginPath(); ctx.moveTo(4, 96); ctx.lineTo(50, 82); ctx.lineTo(50, 186); ctx.lineTo(4, 176); ctx.fill();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 5; i++) rect(ctx, 6 + ((t * 22 + i * 13) % 44), 100 + i * 17, 14, 1, '#7a86a8');
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(200,214,232,0.10)';
  ctx.beginPath(); ctx.moveTo(4, 96); ctx.lineTo(50, 82); ctx.lineTo(50, 120); ctx.lineTo(4, 128); ctx.fill();
  rect(ctx, 0, 92, 4, 96, '#1b1e28');
  rect(ctx, 48, 80, 5, 110, '#1b1e28');
  // the parcel shelf, and the box of tissues in its crochet coat
  rect(ctx, -6, 286, 62, 16, '#2f333f');
  rect(ctx, -6, 286, 62, 3, '#42465a');
  rect(ctx, -6, 300, 62, 3, '#1b1e28');
  ctx.globalAlpha = 0.28; ellipsePx(ctx, 26, 288, 26, 5, '#000'); ctx.globalAlpha = 1;
  ubrLace(ctx, 2, 248, 48, 38);
  rect(ctx, 16, 252, 20, 5, '#f8f6ee');
  rect(ctx, 20, 249, 12, 4, '#ffffff');
  drawText(ctx, 'HI', 26, 268, '#c8b8a8', { align: 'center', font: 'small' });

  // ---- the door card, which is most of the bottom of the frame
  rect(ctx, -6, UBR.sill - 2, UBR.pillarX + 6, UBR.floorY - UBR.sill + 4, '#2b2e3a');
  rect(ctx, -6, UBR.sill - 2, UBR.pillarX + 6, 3, '#3c404f');
  // the fabric insert, a shade warmer than the plastic
  rect(ctx, 30, 352, 630, 118, '#3a3340');
  rect(ctx, 30, 352, 630, 2, '#4e4657');
  ctx.globalAlpha = 0.10;
  for (let i = 32; i < 660; i += 4) rect(ctx, i, 354, 1, 114, '#000000');
  ctx.globalAlpha = 1;
  // the armrest
  ctx.globalAlpha = 0.3; rect(ctx, 34, 350, 540, 6, '#000'); ctx.globalAlpha = 1;
  rect(ctx, 34, 322, 540, 28, '#33374a');
  rect(ctx, 34, 322, 540, 3, '#464b63');
  rect(ctx, 34, 346, 540, 4, '#1f2230');
  // window switches, two rockers, one of them does the back door and is a lie
  rect(ctx, 86, 326, 92, 20, '#1e2029');
  frame(ctx, 86, 326, 92, 20, '#101219');
  for (let i = 0; i < 2; i++) {
    rect(ctx, 92 + i * 44, 330, 38, 12, '#3a3e4c');
    rect(ctx, 92 + i * 44, 330, 38, 2, '#525767');
    rect(ctx, 96 + i * 44, 334, 8, 4, '#6a7080');
  }
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2.4); px(ctx, 172, 331, '#ff8a2a'); ctx.globalAlpha = 1;
  // the pull handle
  rect(ctx, 468, 306, 132, 30, '#1c1e27');
  rect(ctx, 472, 310, 124, 22, '#0f1017');
  rect(ctx, 476, 312, 112, 10, '#c0c6d0');
  rect(ctx, 476, 312, 112, 3, '#e8eef4');
  rect(ctx, 476, 321, 112, 2, '#7a8090');
  // the speaker, a grid of holes and a rim
  const spx = 168, spy = 424;
  circle(ctx, spx, spy, 46, '#24262f');
  circle(ctx, spx, spy, 42, '#191b22');
  for (let yy = -36; yy <= 36; yy += 6) {
    const half = Math.floor(Math.sqrt(Math.max(0, 36 * 36 - yy * yy)));
    for (let xx = -half; xx <= half; xx += 6) px(ctx, spx + xx, spy + yy, '#0c0d13');
  }
  ringPx(ctx, spx, spy, 46, '#343845');
  if (radio) {
    // it is not loud. It is just moving.
    const pump = 1 + 0.06 * Math.sin(t * 12);
    ctx.globalAlpha = 0.10 * pump; circle(ctx, spx, spy, 40 * pump, '#8ad8ff'); ctx.globalAlpha = 1;
  }
  // the door pocket, with an umbrella in it he keeps for passengers
  rect(ctx, 258, 396, 262, 74, '#232631');
  rect(ctx, 258, 396, 262, 3, '#343846');
  rect(ctx, 262, 400, 254, 66, '#171921');
  rect(ctx, 300, 372, 7, 96, '#2f5a4a');
  rect(ctx, 300, 372, 3, 96, '#3f7a62');
  rect(ctx, 294, 366, 19, 8, '#1b2a24');
  rect(ctx, 420, 404, 66, 48, '#d8d2c4');
  rect(ctx, 420, 404, 66, 3, '#f0ece2');
  drawText(ctx, 'MAP', 453, 420, '#8a8478', { align: 'center', font: 'small' });
  for (let i = 0; i < 3; i++) rect(ctx, 428, 432 + i * 6, 50 - i * 12, 2, '#a8a294');
  // the ashtray that has not held ash since 2004
  rect(ctx, 598, 360, 58, 34, '#1e202a');
  rect(ctx, 602, 364, 50, 6, '#0d0e14');
  rect(ctx, 602, 372, 50, 18, '#2a2d38');
  // and the sticker by the sill nobody has ever read
  rect(ctx, 56, 296, 104, 14, '#1f2230');
  drawText(ctx, 'FASTEN BELT', 60, 299, '#8a92a4', { font: 'small' });

  // ---- floor and mat
  rect(ctx, -6, UBR.floorY, W + 12, H - UBR.floorY + 6, '#171922');
  rect(ctx, -6, UBR.floorY, W + 12, 3, '#232631');
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < W; i += 5) rect(ctx, i, UBR.floorY + 4, 2, H - UBR.floorY, '#101119');
  ctx.globalAlpha = 1;
  rect(ctx, 250, UBR.floorY + 8, 420, H - UBR.floorY - 8, '#0d0e14');
  rect(ctx, 250, UBR.floorY + 8, 420, 2, '#22242e');
  for (let i = 258; i < 662; i += 12) rect(ctx, i, UBR.floorY + 12, 5, H - UBR.floorY - 14, '#141620');

  // ---- the pillar between you and the front
  rect(ctx, UBR.pillarX, -4, UBR.pillarW, UBR.floorY + 10, '#2f3240');
  rect(ctx, UBR.pillarX, -4, 4, UBR.floorY + 10, '#3f4354');
  rect(ctx, UBR.pillarX + UBR.pillarW - 4, -4, 4, UBR.floorY + 10, '#1e2028');
  ctx.globalAlpha = 0.12; rect(ctx, UBR.pillarX + 4, 0, UBR.pillarW - 8, UBR.floorY, '#ffd88a'); ctx.globalAlpha = 1;
  // the belt loop bolted through it
  rect(ctx, UBR.pillarX + 3, 176, 20, 26, '#1b1d26');
  rect(ctx, UBR.pillarX + 6, 182, 14, 5, '#8a8f98');

  // ---- the front seat, in its lace
  const sx = UBR.seatX, sw = UBR.seatW;
  ctx.globalAlpha = 0.34; rect(ctx, sx - 8, 150, sw + 16, UBR.floorY - 150, '#000'); ctx.globalAlpha = 1;
  rect(ctx, sx, 150, sw, UBR.floorY - 146, '#2b2733');
  rect(ctx, sx, 150, sw, 3, '#3d3848');
  rect(ctx, sx, 150, 4, UBR.floorY - 146, '#3d3848');
  ubrLace(ctx, sx + 8, 162, sw - 18, 190);
  // the seat-back pocket, and the driver's card in its little frame
  rect(ctx, sx + 12, 360, sw - 26, 62, '#221f2a');
  rect(ctx, sx + 12, 360, sw - 26, 3, '#332f3e');
  rect(ctx, sx + 20, 300, 116, 46, '#f0ece0');
  frame(ctx, sx + 20, 300, 116, 46, '#8a8478');
  rect(ctx, sx + 24, 304, 30, 38, '#c8c2b0');
  drawBugAt(ctx, ubrDriverSpec(), sx + 39, 342, { pose: 'idle', scale: 0.62, bounce: 0 });
  drawText(ctx, 'Y. KOGANE', sx + 58, 306, '#3a3440', { font: 'small' });
  drawText(ctx, 'NO. 4417', sx + 58, 316, '#8a8478', { font: 'small' });
  rect(ctx, sx + 58, 326, 70, 12, '#2f6a4a');
  drawText(ctx, 'SAFE DRIVE', sx + 62, 329, '#d8f0e2', { font: 'small' });
  // a folded newspaper in the pocket, and the corner of a route book
  rect(ctx, sx + 24, 348, 58, 24, '#ddd8c8');
  for (let i = 0; i < 3; i++) rect(ctx, sx + 28, 353 + i * 6, 48 - i * 10, 2, '#9a9488');
  rect(ctx, sx + 92, 344, 40, 28, '#3a5a8a');
  rect(ctx, sx + 92, 344, 40, 3, '#5a7ab0');
  // the headrest, also in lace, because of course it is
  ctx.globalAlpha = 0.34; ellipsePx(ctx, sx + 62, 158, 62, 12, '#000'); ctx.globalAlpha = 1;
  rect(ctx, sx + 6, 92, 124, 66, '#2b2733');
  rect(ctx, sx + 6, 92, 124, 3, '#3d3848');
  ubrLace(ctx, sx + 12, 96, 112, 56);
  rect(ctx, sx + 34, 150, 8, 14, '#5a5f6c');
  rect(ctx, sx + 92, 150, 8, 14, '#5a5f6c');

  // ---- the dash, seen past him: the meter, the radio, one gloved hand
  rect(ctx, UBR.dashX - 4, 186, UBR.dashW + 12, UBR.floorY - 186, dash);
  rect(ctx, UBR.dashX - 4, 186, UBR.dashW + 12, 3, lighten(dash, 0.18));
  rect(ctx, UBR.dashX - 4, 186, 3, UBR.floorY - 186, lighten(dash, 0.1));
  ctx.globalAlpha = 0.10; rect(ctx, UBR.dashX - 4, 190, UBR.dashW + 12, 40, '#4ad8a0'); ctx.globalAlpha = 1;
  // the fare meter. It is counting whether or not anybody is paying it.
  const fare = S && S.fare != null ? S.fare : 730;
  const clock = S && S.clockText ? S.clockText : '21:44';
  ubrReadout(ctx, UBR.dashX, 206, UBR.dashW - 4, 44, 'FARE', fmtNum(fare), 'YEN', '#ff9a3a');
  ubrReadout(ctx, UBR.dashX, 254, UBR.dashW - 4, 28, null, clock, null, '#6be585');
  // the radio, with a needle and four bars that only move if it is on
  rect(ctx, UBR.dashX, 288, UBR.dashW - 4, 46, '#0a0b12');
  frame(ctx, UBR.dashX, 288, UBR.dashW - 4, 46, '#33353f');
  if (radio) {
    drawText(ctx, 'FM 81.3', UBR.dashX + 6, 293, '#8ad8ff', { font: 'small' });
    const st = S && S.radioStation ? S.radioStation : 'NIGHT FLIGHT';
    const scroll = Math.floor((t * 6) % (st.length + 8));
    drawText(ctx, (st + '   -   ').slice(scroll) + (st + '   -   ').slice(0, scroll), UBR.dashX + 6, 304, '#4a86f7', { font: 'small' });
    for (let i = 0; i < 9; i++) {
      const bh = 2 + Math.abs(Math.sin(t * 7 + i * 0.9)) * 12;
      rect(ctx, UBR.dashX + 6 + i * 8, 328 - bh, 5, bh, i > 6 ? '#e8503a' : i > 4 ? '#ffd24a' : '#6be585');
    }
    ctx.globalAlpha = 0.14; rect(ctx, UBR.dashX, 288, UBR.dashW - 4, 46, '#8ad8ff'); ctx.globalAlpha = 1;
  } else {
    drawText(ctx, 'FM  - - -', UBR.dashX + 6, 300, '#2f3644', { font: 'small' });
    for (let i = 0; i < 9; i++) rect(ctx, UBR.dashX + 6 + i * 8, 326, 5, 2, '#1c1f28');
  }
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3); circle(ctx, UBR.dashX + UBR.dashW - 14, 293, 2, radio ? '#6be585' : '#5a2020'); ctx.globalAlpha = 1;
  // a sliver of the wheel, and the white glove on it. They all wear them.
  ctx.strokeStyle = '#1b1d26'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(1010, 402, 86, Math.PI * 0.62, Math.PI * 1.42); ctx.stroke();
  ctx.strokeStyle = '#2f3240'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(1010, 402, 88, Math.PI * 0.66, Math.PI * 1.38); ctx.stroke();
  ctx.lineWidth = 1;
  const grip = Math.round(Math.sin(t * 0.8) * 6);
  rect(ctx, 918, 368 + grip, 26, 20, '#f2efe6');
  rect(ctx, 918, 368 + grip, 26, 3, '#ffffff');
  rect(ctx, 918, 385 + grip, 26, 3, '#cdc8b8');
  for (let i = 0; i < 3; i++) rect(ctx, 922 + i * 7, 370 + grip, 5, 10, '#e4e0d4');
  // the vents, blowing the heat at his knees and not at yours
  for (let i = 0; i < 4; i++) rect(ctx, UBR.dashX + 4, 346 + i * 7, UBR.dashW - 12, 4, '#1c1f28');

  // ---- HIM
  // Back of the head, one shoulder, a cap. You will not see his face all
  // night; you will see his eyes about nine times, in a mirror.
  const dsp = ubrDriverSpec();
  const lean = S && S.lean ? S.lean : 0;
  const hx = sx + 66 + Math.round(lean * 3), hy = 118 + Math.round(Math.sin(t * 1.3) * 1);
  // shoulders first, in the jacket
  ctx.globalAlpha = 0.34; ellipsePx(ctx, hx, 200, 96, 16, '#000'); ctx.globalAlpha = 1;
  ellipsePx(ctx, hx + 4, 232, 84, 54, dsp.jacket);
  rect(ctx, hx - 80, 232, 168, 60, dsp.jacket);
  rect(ctx, hx - 80, 226, 168, 3, lighten(dsp.jacket, 0.2));
  ctx.globalAlpha = 0.18; rect(ctx, hx - 80, 262, 168, 30, '#000'); ctx.globalAlpha = 1;
  // his collar, and his own belt over the shoulder
  rect(ctx, hx - 26, 210, 52, 14, '#f0ece0');
  rect(ctx, hx - 26, 210, 52, 3, '#ffffff');
  ctx.fillStyle = '#4a4e5c';
  ctx.beginPath(); ctx.moveTo(hx + 26, 206); ctx.lineTo(hx + 44, 206); ctx.lineTo(hx + 88, 292); ctx.lineTo(hx + 66, 292); ctx.fill();
  rect(ctx, hx + 28, 208, 2, 4, '#6a6f80');
  // the head
  ellipsePx(ctx, hx, hy, 34, 36, dsp.head);
  ellipsePx(ctx, hx - 8, hy - 8, 20, 18, lighten(dsp.head, 0.14));
  ctx.globalAlpha = 0.3; ellipsePx(ctx, hx + 14, hy + 8, 18, 22, '#000'); ctx.globalAlpha = 1;
  // the two antennae, which give a bug away from behind every time
  for (const s of [-1, 1]) {
    const a = Math.sin(t * 1.7 + (s > 0 ? 0 : 1.4)) * 4;
    line(ctx, hx + s * 14, hy - 30, hx + s * 22 + a, hy - 56, dsp.limb);
    line(ctx, hx + s * 15, hy - 30, hx + s * 23 + a, hy - 56, dsp.limb);
    circle(ctx, hx + s * 22 + a, hy - 58, 3, dsp.limb);
  }
  // the cap, peaked, worn indoors, forever
  rect(ctx, hx - 32, hy - 30, 64, 20, dsp.cap);
  ellipsePx(ctx, hx, hy - 30, 32, 14, dsp.cap);
  rect(ctx, hx - 32, hy - 14, 64, 5, darken(dsp.cap, 0.3));
  rect(ctx, hx - 30, hy - 40, 60, 3, lighten(dsp.cap, 0.2));
  rect(ctx, hx - 12, hy - 34, 24, 8, '#e0b23c');
  rect(ctx, hx - 9, hy - 32, 18, 4, '#12203f');
  ctx.globalAlpha = 0.14; ellipsePx(ctx, hx - 20, hy - 6, 30, 26, '#4ad8a0'); ctx.globalAlpha = 1;
  // the streetlight going over him, which is the whole ride in one gesture
  ctx.globalAlpha = 0.13;
  rect(ctx, W - lamp * (W + 300) - 40, 90, 70, 300, '#ffd88a');
  ctx.globalAlpha = 1;

  // ---- the mirror, and the only part of him you will ever really look at
  const mx = 700, my = 18, mw = 112, mh = 46;
  ctx.strokeStyle = '#1b1d26'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(mx + mw - 6, my + 12); ctx.lineTo(mx + mw + 62, my - 14); ctx.stroke();
  ctx.lineWidth = 1;
  rect(ctx, mx - 3, my - 3, mw + 6, mh + 6, '#1b1d26');
  rect(ctx, mx - 3, my - 3, mw + 6, 3, '#2f3240');
  rect(ctx, mx, my, mw, mh, '#0b0e16');
  // the road behind, reduced to two moving smears
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 6; i++) rect(ctx, mx + ((t * 34 + i * 19) % (mw + 20)) - 10, my + 6 + i * 6, 16, 1, '#7a86a8');
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.25; rect(ctx, mx + 2, my + 2, mw - 4, mh - 4, '#2f4a68'); ctx.globalAlpha = 1;
  // his eyes. They are in the mirror when he is talking to you and on the
  // road when he is not, and he does the second one far more.
  const look = S && S.eyes != null ? S.eyes : 0;
  const ex = mx + 34 + Math.round(look * 14);
  const blink = (Math.sin(t * 0.9) > 0.985 || Math.sin(t * 1.7 + 2) > 0.99) ? 1 : 0;
  for (const s of [0, 1]) {
    const cx2 = ex + s * 28;
    ellipsePx(ctx, cx2, my + 24, 11, blink ? 2 : 9, '#f4f1ea');
    if (!blink) {
      ellipsePx(ctx, cx2 + Math.round(look * 3), my + 24, 5, 6, '#2a1f18');
      px(ctx, cx2 + Math.round(look * 3) - 2, my + 21, '#ffffff');
      ctx.globalAlpha = 0.3; rect(ctx, cx2 - 11, my + 17, 22, 2, '#8ad8ff'); ctx.globalAlpha = 1;
    }
    rect(ctx, cx2 - 12, my + 13, 24, 3, darken(dsp.head, 0.25));
  }
  ctx.globalAlpha = 0.09; rect(ctx, mx, my, mw, 12, '#ffffff'); ctx.globalAlpha = 1;
  // the charm, swinging off the corner of it
  const sway = Math.sin(t * 1.6) * 7 + (S && S.lean ? S.lean * 9 : 0);
  ubrCharm(ctx, mx + 6, my + mh + 2, sway, t);

  // ---- your things, on the floor beside you
  ubrDrawBags(ctx, t);

  // ---- the belt across you, nearest thing in the frame
  ctx.globalAlpha = 0.94;
  ctx.strokeStyle = '#33353f'; ctx.lineWidth = 19;
  ctx.beginPath(); ctx.moveTo(UBR.pillarX + 10, 196); ctx.lineTo(258, H + 20); ctx.stroke();
  ctx.strokeStyle = '#3f424e'; ctx.lineWidth = 15;
  ctx.beginPath(); ctx.moveTo(UBR.pillarX + 10, 196); ctx.lineTo(258, H + 20); ctx.stroke();
  ctx.strokeStyle = '#4c5060'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(UBR.pillarX + 4, 194); ctx.lineTo(252, H + 18); ctx.stroke();
  ctx.strokeStyle = '#23252e'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(UBR.pillarX + 18, 200); ctx.lineTo(266, H + 24); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.globalAlpha = 1;
  // the little plastic stopper, at the height it always sits
  rect(ctx, 520, 402, 14, 16, '#1b1d26');
  rect(ctx, 522, 404, 10, 4, '#3f424e');

  // ---- grade. A car at night is one warm light and a great deal of nothing.
  ctx.globalAlpha = 0.10; ellipsePx(ctx, 880, 300, 220, 260, '#4ad8a0'); ctx.globalAlpha = 1;
  grade(ctx, 0, 0, W, H, '#2a2a6a', 0.09);
  vignette(ctx, 0.42);
}

// The driver, as a set of colours. He is a beetle in a black jacket and a
// grey cap, and he has been doing this since before the expressway was paid
// for, which it still is not.
let _ubrDriverSpec = null;
function ubrDriverSpec() {
  if (_ubrDriverSpec) return _ubrDriverSpec;
  const s = randomBugSpec(makeRng(hashStr('yuki-kogane-4417')));
  s.name = 'YUKI';
  s.body = 'beetle'; s.eyes = 'calm'; s.antennae = 'curve';
  s.colors.body = '#4a3a2e'; s.colors.body2 = '#2f241c'; s.colors.head = '#5a483a';
  s.outfit = { jacket: '#242430', shirt: '#f2ece0', hat: 'cap', hatColor: '#3a3f4c' };
  // the flat colours the cabin painter needs, kept beside the sprite so the
  // card in the seat pocket and the head against the headrest agree
  s.head = '#5a483a'; s.limb = '#2f241c'; s.jacket = '#242430'; s.cap = '#3a3f4c';
  _ubrDriverSpec = s;
  return s;
}

// Everything you own, in the footwell. One case, one guitar, one tag from an
// airline you will be arguing with about the guitar for the rest of your life.
function ubrDrawBags(ctx, t) {
  // the guitar case, leaning on the door, the way it leans on everything
  ctx.save();
  ctx.translate(150, 500); ctx.rotate(-0.30);
  ctx.globalAlpha = 0.34; ellipsePx(ctx, 8, 2, 40, 8, '#000'); ctx.globalAlpha = 1;
  const gc = '#2a1f18';
  rect(ctx, -30, -196, 60, 196, gc);
  ellipsePx(ctx, 0, -178, 30, 30, gc);
  ellipsePx(ctx, 0, -46, 38, 48, gc);
  ellipsePx(ctx, 0, -112, 24, 34, gc);
  rect(ctx, -30, -196, 60, 3, lighten(gc, 0.22));
  ctx.globalAlpha = 0.5;
  ellipseRingPx(ctx, 0, -46, 32, 42, '#6a5240');
  ellipseRingPx(ctx, 0, -178, 24, 24, '#6a5240');
  ctx.globalAlpha = 1;
  for (const yy of [-168, -120, -70, -26]) { rect(ctx, -34, yy, 10, 8, '#b9bec6'); rect(ctx, -34, yy, 10, 2, '#e0e5ea'); }
  rect(ctx, 24, -118, 12, 22, '#4a3a2a');
  rect(ctx, 26, -114, 8, 14, '#8a8f98');
  // stickers. Nobody with a case this old has a case with nothing on it.
  rect(ctx, -22, -150, 26, 14, '#c8402c'); drawText(ctx, 'LAS', -20, -147, '#ffd24a', { font: 'small' });
  rect(ctx, -4, -100, 22, 12, '#2f6a4a'); drawText(ctx, 'NRT', -2, -98, '#f4f1ea', { font: 'small' });
  ctx.restore();

  // the suitcase, standing, still wearing the Dragon Fly tag
  const bx = 566, by = 502, bw = 124, bh = 150;
  ctx.globalAlpha = 0.34; ellipsePx(ctx, bx + bw / 2, by, bw * 0.55, 9, '#000'); ctx.globalAlpha = 1;
  rect(ctx, bx, by - bh, bw, bh, '#2f4a8a');
  rect(ctx, bx, by - bh, bw, 4, '#4a6fb0');
  rect(ctx, bx, by - 6, bw, 6, '#1f3568');
  rect(ctx, bx + bw - 5, by - bh, 5, bh, '#22396f');
  for (let i = 0; i < 5; i++) rect(ctx, bx + 8 + i * 24, by - bh + 6, 3, bh - 14, '#27407a');
  rect(ctx, bx, by - Math.round(bh * 0.44), bw, 4, '#1a2c58');
  rect(ctx, bx + 12, by - Math.round(bh * 0.44) + 4, 30, 10, '#8a8f98');
  rect(ctx, bx + 12, by - Math.round(bh * 0.44) + 4, 30, 3, '#c0c6d0');
  rect(ctx, bx + bw / 2 - 20, by - bh - 8, 40, 8, '#6a7079');
  rect(ctx, bx + bw / 2 - 20, by - bh - 8, 40, 2, '#98a0aa');
  rect(ctx, bx + bw / 2 - 3, by - bh - 22, 6, 16, '#8a8f98');
  // the tag, on a loop, still swinging a little from the carousel
  const tg = Math.sin(t * 1.9) * 3;
  ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(bx + 30, by - bh + 4); ctx.lineTo(bx + 30 + tg, by - bh + 22); ctx.stroke();
  rect(ctx, bx + 18 + tg, by - bh + 22, 40, 26, DF.cream);
  frame(ctx, bx + 18 + tg, by - bh + 22, 40, 26, '#8a8478');
  rect(ctx, bx + 18 + tg, by - bh + 22, 40, 7, DF.navy);
  drawText(ctx, 'NRT', bx + 38 + tg, by - bh + 33, DF.navy, { align: 'center', scale: 2 });
  drawText(ctx, 'DF0808', bx + 38 + tg, by - bh + 43, '#8a8478', { align: 'center', font: 'small' });
  ctx.globalAlpha = 0.26; rect(ctx, bx, by - bh, bw, bh, '#000'); ctx.globalAlpha = 1;
}

// ---------- eyelids ----------
// Two bars in from the top and the bottom, with lashes on the inside edge.
// The trick is that they do not meet in the middle: an eye closes more from
// the top than from the bottom, and getting that wrong makes it a letterbox.
function ubrLids(ctx, k) {
  if (k <= 0) return;
  const top = Math.round(H * 0.60 * easeInOut(clamp(k, 0, 1)));
  const bot = Math.round(H * 0.46 * easeInOut(clamp(k, 0, 1)));
  if (top > 0) {
    rect(ctx, 0, 0, W, top, '#05040a');
    rect(ctx, 0, top - 3, W, 3, '#140d12');
    rect(ctx, 0, top - 1, W, 1, '#2a1a20');
    for (let x = 0; x < W; x += 7) {
      const l = 5 + ((x / 7) % 3) * 3;
      ctx.fillStyle = '#05040a';
      ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + 5, top); ctx.lineTo(x + 2, top + l); ctx.fill();
    }
  }
  if (bot > 0) {
    rect(ctx, 0, H - bot, W, bot, '#05040a');
    rect(ctx, 0, H - bot, W, 3, '#140d12');
    rect(ctx, 0, H - bot, W, 1, '#2a1a20');
    for (let x = 3; x < W; x += 9) {
      ctx.fillStyle = '#05040a';
      ctx.beginPath(); ctx.moveTo(x, H - bot); ctx.lineTo(x + 5, H - bot); ctx.lineTo(x + 2, H - bot - 4); ctx.fill();
    }
  }
  // the slit is wet and it catches the streetlights
  if (top > 0 && H - bot > top) {
    ctx.globalAlpha = 0.16;
    rect(ctx, 0, top, W, 2, '#ffd8a0');
    rect(ctx, 0, H - bot - 2, W, 2, '#ffd8a0');
    ctx.globalAlpha = 1;
  }
}

// ---------- the radio loop ----------
// Four bars of something from a long time ago, on a station that plays it at
// this hour because everybody awake at this hour wants it. 8-bit, because
// everything in this game is.
const UBR_TUNE = [
  76, -1, 74, 72, -1, 69, -1, 72,
  74, -1, 72, 69, -1, 67, -1, -1,
  72, -1, 74, 76, -1, 79, -1, 76,
  74, -1, 72, 69, -1, 69, -1, -1,
];
const UBR_BASSLINE = [45, 45, 41, 41, 48, 48, 43, 43];   // Am  F  C  G, two beats each
const UBR_PAD = [57, 53, 60, 55];

// ---------- THE SCENE ----------
class UberScene {
  constructor() {
    this.t = 0;
    this.dist = 0;              // how far the car has gone, in window units
    this.speed = 1;             // 1 is expressway. 0 is the kerb.
    this.phase = 'ride';        // ride -> drowse -> dream -> wake -> done
    this.phaseT = 0;
    this.k = 0;
    this.left = false;
    this.fx = new Particles();
    this.fare = 730;
    this.fareFlash = 0;
    this.clockText = '21:44';
    this.radio = false;
    this.radioStation = 'NIGHT FLIGHT 81.3 - TOKYO';
    this.radioStep = 0;
    this.radioNext = 0;
    this.duck = 1;
    this.lean = 0;              // the body roll of the car, and everything hanging in it
    this.leanT = 2;
    this.eyes = 0;              // -1 road, +1 mirror
    this.lids = 0;
    this.blur = 0;
    this.flash = 0;
    this.vent = false;
    this.liked = false;
    this.tipOffered = false;
    this.hint = 0;
    this.ducked = false;
    if (typeof setChapter === 'function') setChapter('uber');
    this.beats = 0;
    this.dlg = new Dialogue(this.ubrRideScript(), { onEnd: () => this.ubrSleep() });
  }

  // ---- the conversation
  // He talks the whole way. Most of it you follow. The rest of it goes past
  // like the barrier does.
  ubrRideScript() {
    const S = this;
    return [
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'BELT IS ON? GOOD. GOOD.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'NINETY MINUTE. MAYBE SEVENTY.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'DEPEND ON THE JUNCTION.' },
      { do() { S.eyes = 1; } },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'SO. WHERE FROM?',
        choices: [
          { label: 'LAS VEGAS', note: 'TRUE, TECHNICALLY', next: 'vegas' },
          { label: 'NOWHERE YOU WOULD KNOW', next: 'nowhere' },
          { label: 'SAY NOTHING', note: 'YOU ARE VERY TIRED', next: 'quiet' },
        ] },
      { id: 'vegas', who: 'YUKI', voice: 'driver', at: 'driver', text: 'VEGAS! HO. BIG LIGHT.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'TOKYO ALSO BIG LIGHT.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'BUT HERE, LIGHT IS FOR WORK.', next: 'work' },
      { id: 'nowhere', who: 'YUKI', voice: 'driver', at: 'driver', text: 'EVERYBODY IS FROM SOMEWHERE.' },
      { who: 'YOU', voice: 'you', at: 'you', text: 'NOT LATELY.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'HA. OK. OK.', next: 'work' },
      { id: 'quiet', who: '', voice: false, at: 'you', think: true, text: 'THE HEATER IS ON YOUR SHINS.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'AH. TIRED. IS FINE. IS FINE.', next: 'work' },

      { id: 'work', do() { S.eyes = 0; } },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'AND WORK? WHAT IS YOUR WORK?',
        choices: [
          { label: 'A MUSICIAN', note: 'SAY IT OUT LOUD ONCE', next: 'mus' },
          { label: 'I CARRY A GUITAR AROUND', next: 'gtr' },
          { label: 'I DO NOT KNOW YET', next: 'dunno' },
        ] },
      { id: 'mus', do() { S.liked = true; S.eyes = 1; Audio.ui('coin'); },
        who: 'YUKI', voice: 'driver', at: 'driver', text: 'MUSICIAN! HO! HO!' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'MY SON PLAY BASS. VERY LOUD.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'HE IS ACCOUNTANT NOW.' },
      { who: '', voice: false, at: 'you', think: true, text: 'OH.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'BUT STILL LOUD. AT HOME.', next: 'radio' },
      { id: 'gtr', who: 'YUKI', voice: 'driver', at: 'driver', text: 'SAME THING. SAME THING.' },
      { do() { S.liked = true; } },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'I CARRY PEOPLE. YOU CARRY GUITAR.', next: 'radio' },
      { id: 'dunno', who: 'YUKI', voice: 'driver', at: 'driver', text: 'TWENTY-TWO YEAR I DRIVE.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'FIRST YEAR, I ALSO NOT KNOW.', next: 'radio' },

      { id: 'radio', do() { S.eyes = 0; } },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'RADIO? YOU LIKE RADIO?',
        choices: [
          { label: 'YES, PLEASE', next: 'ron' },
          { label: 'WHATEVER YOU LIKE', next: 'rwhat' },
          { label: 'NO, THANK YOU', next: 'roff' },
        ] },
      { id: 'ron', do() { S.ubrRadioOn(true); }, who: 'YUKI', voice: 'driver', at: 'driver', text: 'OK. THIS ONE IS OLD.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'EVERYTHING ON THIS STATION IS OLD.', next: 'toll' },
      { id: 'rwhat', do() { S.ubrRadioOn(true); }, who: 'YUKI', voice: 'driver', at: 'driver', text: 'THEN WE HAVE MY ONE.' },
      { who: '', voice: false, at: 'you', think: true, text: 'IT IS A GOOD ONE.', next: 'toll' },
      { id: 'roff', who: 'YUKI', voice: 'driver', at: 'driver', text: 'OK. QUIET IS ALSO GOOD.' },
      { who: '', voice: false, at: 'you', think: true, text: 'THE TYRES FILL THE GAP.', next: 'toll' },

      // ---- the toll, which is the thing he really wanted to talk about
      { id: 'toll', do() { S.ubrToll(); S.eyes = 1; },
        who: 'YUKI', voice: 'driver', at: 'driver', text: 'AH. HERE. YOU SEE SIGN?' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'TOLL. THREE THOUSAND TWENTY.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'THREE THOUSAND. FOR A ROAD.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'ROAD IS ALREADY THERE!' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'THEY BUILD IT NINETEEN SIXTY-TWO.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'FOR OLYMPIC. IS PAID. LONG PAID.',
        choices: [
          { label: 'THAT IS A LOT', next: 'tollA' },
          { label: 'IS THERE A FREE ROAD?', next: 'tollB' },
          { label: 'I AM SORRY', next: 'tollC' },
        ] },
      { id: 'tollA', who: 'YUKI', voice: 'driver', at: 'driver', text: 'IS A LOT! THANK YOU!' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'MY WIFE SAY I TALK ABOUT IT TOO MUCH.', next: 'mumble1' },
      { id: 'tollB', who: 'YUKI', voice: 'driver', at: 'driver', text: 'FREE ROAD IS FOUR HOUR.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'YOU WANT FOUR HOUR?' },
      { who: 'YOU', voice: 'you', at: 'you', text: 'NO.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'CORRECT.', next: 'mumble1' },
      { id: 'tollC', who: 'YUKI', voice: 'driver', at: 'driver', text: 'NOT YOUR ROAD. NOT YOUR SORRY.', next: 'mumble1' },

      // ---- and then a stretch of it you simply do not have
      { id: 'mumble1', do() { S.eyes = -1; },
        who: 'YUKI', voice: 'driver', at: 'driver', text: 'ANO NE, KONO SAKI NO JANKUSHON GA NE,' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'ITSUMO NE, KONDE RU N DESU YO.' },
      { who: '', voice: false, at: 'you', think: true, text: 'YOU UNDERSTOOD NONE OF THAT.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'NE?' },
      { who: 'YOU', voice: 'you', at: 'you', text: 'NE.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'HO! GOOD!' },

      { do() { S.eyes = 1; }, },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'HEAT OK? TOO HOT?',
        choices: [
          { label: 'IT IS PERFECT', next: 'heatA' },
          { label: 'A LITTLE HOT', next: 'heatB' },
          { label: 'I CANNOT FEEL MY FACE', next: 'heatC' },
        ] },
      { id: 'heatA', who: 'YUKI', voice: 'driver', at: 'driver', text: 'GOOD. I KEEP IT.' },
      { who: '', voice: false, at: 'you', think: true, text: 'THIS IS THE WARMEST YOU HAVE BEEN IN A WEEK.', next: 'city' },
      { id: 'heatB', do() { S.vent = true; Audio.ui('move'); },
        who: 'YUKI', voice: 'driver', at: 'driver', text: 'AH. SMALL WINDOW. LIKE THIS.' },
      { who: '', voice: false, at: 'you', think: true, text: 'COLD BAY AIR. TWO CENTIMETRES OF IT.', next: 'city' },
      { id: 'heatC', who: 'YUKI', voice: 'driver', at: 'driver', text: 'THEN IS WORKING!' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'FACE COMES BACK. ALWAYS DOES.', next: 'city' },

      // ---- the city arriving, which he points out because it is worth it
      { id: 'city', do() { S.eyes = 0; },
        who: 'YUKI', voice: 'driver', at: 'driver', text: 'LOOK. NOW IS THE CITY.' },
      { who: '', voice: false, at: 'you', think: true, text: 'THE BUILDINGS STOP HAVING GAPS.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'FROM HERE, NO MORE DARK.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'ALL THE WAY TO YOUR BED.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'CAPSULE HOTEL, YES? SMALL BOX?' },
      { who: 'YOU', voice: 'you', at: 'you', text: 'IT WAS TWENTY-EIGHT DOLLARS.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'IS FINE. IS CLEAN. IS SMALL.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'YOU ARE ALSO SMALL. IS OK.' },

      { do() { S.eyes = -1; } },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'SHIGOTO WA TAIHEN DA KEDO, MA, NE.' },
      { who: '', voice: false, at: 'you', think: true, text: 'HE IS EITHER COMPLAINING OR NOT.' },
      { who: '', voice: false, at: 'you', think: true, text: 'YOU NOD. IT SEEMS TO COVER IT.' },

      { do() { S.ubrMeterTalk(); } },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'METER IS ONLY FOR SHOW.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'APP ALREADY TAKE YOUR MONEY.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'I LIKE TO WATCH IT ANYWAY.' },
      { who: '', voice: false, at: 'you', think: true, text: 'SO DO YOU. IT IS THE ONLY THING MOVING SLOWLY.' },

      // ---- and now the heater wins
      { who: '', voice: false, at: 'you', think: true, text: 'THE LACE. THE LAMPS. THE TYRES.' },
      { who: '', voice: false, at: 'you', think: true, text: 'DO NOT SLEEP IN A STRANGER\'S CAR.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'SLEEP IF YOU WANT. I WAKE YOU.' },
      { who: '', voice: false, at: 'you', think: true, text: 'WELL. HE SAID IT WAS FINE.' },
    ];
  }

  // ---- the beats that do things
  ubrRadioOn(on) {
    this.radio = !!on;
    if (this.radio) {
      this.radioStep = 0;
      this.radioNext = (Audio.ctx ? Audio.ctx.currentTime : 0) + 0.12;
      Audio.ui('select');
    }
  }
  ubrToll() {
    // he flicks the card reader and the barrier is already up
    this.k = Math.max(this.k, 0.335);
    this.speed = 0.62;
    this.leanT = 0.3;
    Audio.ui('stamp');
  }
  ubrMeterTalk() { this.fareFlash = 1.4; }

  // ---- falling asleep
  ubrSleep() {
    this.dlg = null;
    this.phase = 'drowse';
    this.phaseT = 0;
    this.ubrDuck(0.34);
  }
  ubrDream() {
    const S = this;
    this.phase = 'dream';
    this.phaseT = 0;
    this.dlg = new Dialogue([
      { who: '', voice: 'you', at: 'dream', think: true, text: 'THE SPHERE IS STILL LIT.' },
      { who: '', voice: 'you', at: 'dream', think: true, text: 'SOMEBODY IS COUNTING IN. ONE. TWO.' },
      { who: '', voice: 'you', at: 'dream', think: true, text: 'IT NEVER GETS TO THREE.' },
    ], { onEnd: () => S.ubrWake() });
  }
  ubrWake() {
    const S = this;
    this.phase = 'wake';
    this.phaseT = 0;
    this.dlg = null;
    this.speed = 0;
    this.flash = 1;
    this.ubrDuck(1);
    this.radio = false;
    Game.shake.hit(5, 0.3);
    Audio.ui('pop');
    // Loud, and from about ten centimetres away, and in a language your brain
    // has not booted up for yet.
    Voice.say('OKYAKUSAN. TSUKIMASHITA.', 'driver', { gain: 1.5 });
    this.dlg = new Dialogue([
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'OKYAKUSAN! TSUKIMASHITA!' },
      { who: '', voice: false, at: 'you', think: true, text: 'WHERE.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'ARRIVED. WE ARRIVED.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'YOU SLEEP FROM THE JUNCTION.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'FORTY MINUTE. GOOD SLEEP.' },
      { who: '', voice: false, at: 'you', think: true, text: 'YOUR NECK DISAGREES.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'APP ALREADY PAY. ALL DONE.',
        choices: [
          { label: 'OFFER HIM THE 500 COIN', note: 'IT IS MOST OF WHAT YOU HAVE', next: 'tip' },
          { label: 'JUST SAY THANK YOU', next: 'nothx' },
        ] },
      { id: 'tip', do() { S.tipOffered = true; Audio.ui('coin'); },
        who: 'YUKI', voice: 'driver', at: 'driver', text: 'NO. NO NO NO.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'NO TIP. IS NOT DONE HERE.' },
      { who: 'YOU', voice: 'you', at: 'you', text: 'IT IS NOT MUCH.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'THEN YOU NEED IT MORE. KEEP.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'BUY HOT COFFEE. MACHINE ON CORNER.', next: 'out' },
      { id: 'nothx', who: 'YOU', voice: 'you', at: 'you', text: 'THANK YOU. REALLY.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'IS MY JOB. IS FINE.', next: 'out' },
      { id: 'out', when() { return S.liked; }, who: 'YUKI', voice: 'driver', at: 'driver', text: 'AND. PLAY LOUD.' },
      { when() { return S.liked; }, who: 'YUKI', voice: 'driver', at: 'driver', text: 'LOUD ENOUGH FOR MY SON.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'DOOR OPEN BY ITSELF. DO NOT PULL.' },
      { who: '', voice: false, at: 'you', think: true, text: 'YOU PULL IT.' },
      { who: 'YUKI', voice: 'driver', at: 'driver', text: 'HO! EVERYBODY PULL IT.' },
      { who: '', voice: false, at: 'you', think: true, text: 'TOKYO. ELEVEN FIFTY-ONE AT NIGHT.' },
    ], { onEnd: () => S.ubrDone() });
  }
  ubrDone() {
    if (this.left) return;
    this.left = true;
    this.ubrDuck(1);
    if (typeof setChapter === 'function') setChapter('capsule');
    if (Game.run) {
      Game.run.chapter = 'capsule';
      if (this.liked) Game.run.gratitude = (Game.run.gratitude || 0) + 1;
      Game.run.save();
    }
    Game.go(function () {
      if (typeof CapsuleNightScene !== 'undefined') return new CapsuleNightScene();
      if (typeof gameHub === 'function') return gameHub();
      return new CityScene();
    }, 'fade', { dur: 1 });
  }
  // The music goes far away, the way it does when your ears give up before
  // the rest of you. Restored on the way out so nothing is left quiet.
  ubrDuck(v) {
    this.duck = v;
    if (Audio.ctx && Audio.musicGain) {
      try { Audio.musicGain.gain.setTargetAtTime(v, Audio.ctx.currentTime, 0.4); }
      catch (e) { Audio.musicGain.gain.value = v; }
    }
  }

  // ---- the 8-bit station
  ubrRadioTick() {
    if (!this.radio || !Audio.ctx || Audio.muted) return;
    const now = Audio.ctx.currentTime;
    if (this.radioNext < now) this.radioNext = now + 0.05;
    const step = 0.28;
    while (this.radioNext < now + 0.6) {
      const i = this.radioStep % UBR_TUNE.length;
      const at = this.radioNext;
      const n = UBR_TUNE[i];
      const v = 0.34 * this.duck;
      if (n > 0) Audio.note('vox8', n, at, step * (UBR_TUNE[(i + 1) % UBR_TUNE.length] < 0 ? 1.8 : 0.9), v);
      if (i % 4 === 0) Audio.note('bass', UBR_BASSLINE[Math.floor(i / 4) % UBR_BASSLINE.length], at, step * 1.6, v * 0.8);
      if (i % 8 === 0) Audio.note('pad', UBR_PAD[Math.floor(i / 8) % UBR_PAD.length], at, step * 7, v * 0.4);
      if (i % 4 === 0) Audio.drum('kick', at, 0.24 * this.duck);
      if (i % 4 === 2) Audio.drum('snare', at, 0.16 * this.duck);
      if (i % 2 === 0) Audio.drum('hat', at, 0.09 * this.duck);
      this.radioNext += step;
      this.radioStep++;
    }
  }

  // ---- loop
  update(dt) {
    if (dt > 0.1) dt = 0.1;
    this.t += dt;
    this.phaseT += dt;
    this.fx.update(dt);
    this.fareFlash = Math.max(0, this.fareFlash - dt);
    this.flash = Math.max(0, this.flash - dt * 1.6);
    this.hint += dt;

    // the car: a target speed per phase, eased into, never quite zero while
    // we are still moving so the lamps keep coming
    let want = 1;
    if (this.phase === 'ride') want = 0.86 + 0.14 * Math.sin(this.t * 0.31);
    else if (this.phase === 'drowse') want = lerp(0.9, 0.5, clamp(this.phaseT / 7, 0, 1));
    else if (this.phase === 'dream') want = 0.34;
    else want = 0.02;
    if (this.speed < want) this.speed += Math.min(want - this.speed, dt * 0.5);
    else this.speed -= Math.min(this.speed - want, dt * 0.9);
    this.dist += dt * 62 * Math.max(this.speed, 0.02);

    // where we are on the journey. Time gets you most of the way; the
    // conversation gets you the rest, so a fast reader still arrives.
    const timeK = clamp(this.t / 150, 0, 1);
    const beatK = this.dlg && this.dlg.script ? clamp(this.dlg.i / this.dlg.script.length, 0, 1) : 1;
    if (this.phase === 'ride') this.k = clamp(Math.max(this.k, Math.max(timeK * 0.9, beatK * 0.88)), 0, 0.9);
    else this.k = clamp(this.k + dt * 0.05, 0, 1);

    // the fare. Eighty yen a bump, like every meter in the country.
    const wantFare = 730 + Math.floor(this.k * 224) * 80;
    if (wantFare > this.fare) { this.fare = wantFare; this.fareFlash = 0.4; }
    // the clock, running from a quarter to ten to just before midnight
    const mins = Math.round(21 * 60 + 44 + this.k * 127);
    this.clockText = pad2(Math.floor(mins / 60) % 24) + ':' + pad2(mins % 60);

    // the body roll. A lane change every few seconds, and a constant shiver
    // off the expansion joints.
    this.leanT -= dt;
    if (this.leanT <= 0) { this.leanT = 3 + Math.random() * 5; this.leanTarget = (Math.random() - 0.5) * 2; }
    this.lean += ((this.leanTarget || 0) * this.speed - this.lean) * Math.min(1, dt * 1.6);

    this.ubrRadioTick();
    if (this.dlg) this.dlg.update(dt);

    // eyelids
    if (this.phase === 'drowse') {
      const u = clamp(this.phaseT / 9, 0, 1);
      this.lids = ubrDrowseCurve(u);
      this.blur = clamp((this.phaseT - 2.4) / 6.2, 0, 1);
      if (u >= 1) this.ubrDream();
    } else if (this.phase === 'dream') {
      this.lids = 1;
      this.blur = 1;
    } else if (this.phase === 'wake') {
      this.lids = clamp(1 - this.phaseT / 0.34, 0, 1);
      this.blur = clamp(1 - this.phaseT / 1.1, 0, 1) * 0.5;
    }
  }

  // where the current bubble points
  ubrAnchor() {
    const b = this.dlg && this.dlg.beat ? this.dlg.beat : null;
    const at = b && b.at ? b.at : 'you';
    if (at === 'driver') return { x: UBR.seatX + 66, y: 60 };
    if (at === 'radio') return { x: UBR.dashX + 40, y: 280 };
    if (at === 'dream') return { x: W / 2, y: 340 };
    return { x: 300, y: 522 };
  }

  key(code) {
    if (this.dlg) { this.dlg.key(code); return; }
    if (code === 'KeyR') { this.ubrRadioOn(!this.radio); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) return;
  }
  keyUp() {}
  pointerDown(x, y) {
    // the dash is live: you can reach through and poke his radio
    if (x > UBR.dashX - 6 && y > 284 && y < 338) { this.ubrRadioOn(!this.radio); Audio.ui('select'); return; }
    if (this.dlg) { this.dlg.click(x, y); return; }
  }
  pointerMove() {}
  pointerUp() {}
  click(x, y) { this.pointerDown(x, y); }
  hover() {}
  isPlaying() { return false; }

  draw(ctx) {
    const t = this.t;
    rect(ctx, 0, 0, W, H, '#05060a');
    // the whole car rocks: the suspension over the joints, plus the lean
    const bob = Math.round(Math.sin(t * 7.3) * 0.9 * this.speed + Math.sin(t * 2.1) * 0.7);
    const roll = Math.round(this.lean * 2);
    ctx.save();
    ctx.translate(roll, bob);

    // ---- the show
    drawCarWindow(ctx, UBR.winX, UBR.winY, UBR.winW, UBR.winH, this.dist, this.k);
    // and the same show going soft as you stop being able to hold your head up
    if (this.blur > 0) {
      const b = this.blur;
      bloom(ctx, UBR.winX, UBR.winY, UBR.winW, UBR.winH, 0.08 + b * 0.30, 2 + Math.round(b * 5));
      ctx.globalAlpha = 0.18 * b;
      for (let i = 0; i < UBR.winH; i += 3) rect(ctx, UBR.winX, UBR.winY + i, UBR.winW, 2, '#7a86a8');
      ctx.globalAlpha = 0.28 * b;
      rect(ctx, UBR.winX, UBR.winY, UBR.winW, UBR.winH, '#0a0a16');
      ctx.globalAlpha = 1;
    }

    // ---- the frame
    drawCarInterior(ctx, this.dist, this);
    ctx.restore();

    // ---- the eyelids, and the light that still gets through them
    if (this.lids > 0) {
      if (this.lids >= 0.995) {
        // fully under. All that is left is the lamps going over, orange,
        // through skin.
        rect(ctx, 0, 0, W, H, '#05040a');
        const ph = (this.dist * 2.1) % 1;
        for (let i = 0; i < 3; i++) {
          const lx = W - ((ph + i * 0.34) % 1) * (W + 340);
          ctx.globalAlpha = 0.09;
          ellipsePx(ctx, lx, H * 0.5, 150, 240, '#c8502a');
          ctx.globalAlpha = 0.05;
          ellipsePx(ctx, lx, H * 0.5, 70, 180, '#ff9a4a');
          ctx.globalAlpha = 1;
        }
        ctx.globalAlpha = 0.08;
        halftone(ctx, 0, 0, W, H, '#5a1a10', 7, 0.4);
        ctx.globalAlpha = 1;
      }
      ubrLids(ctx, this.lids);
    }

    // ---- the snap open
    if (this.flash > 0) {
      ctx.globalAlpha = Math.min(1, this.flash * 0.9);
      rect(ctx, 0, 0, W, H, '#fdf8ff');
      ctx.globalAlpha = Math.min(1, this.flash);
      vignette(ctx, 0.3, '#ffffff');
      ctx.globalAlpha = 1;
    }

    this.fx.draw(ctx);

    // ---- the fare meter, echoed big when he points at it
    if (this.fareFlash > 0.5) {
      ctx.globalAlpha = clamp((this.fareFlash - 0.5) * 1.6, 0, 1);
      const s = 'METER: ' + fmtNum(this.fare) + ' YEN';
      const w2 = textWidth(s, { scale: 2 }) + 26;
      rect(ctx, W / 2 - w2 / 2, H - 116, w2, 26, 'rgba(8,6,14,0.86)');
      frame(ctx, W / 2 - w2 / 2, H - 116, w2, 26, '#ff9a3a');
      drawText(ctx, s, W / 2, H - 108, '#ff9a3a', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }

    // ---- the ribbon, briefly, the way every place in this game announces itself
    if (this.t < 4.5) {
      const a = clamp(4.5 - this.t, 0, 1) * clamp(this.t * 2.5, 0, 1);
      ctx.globalAlpha = a;
      uiRibbon(ctx, W / 2, 14, 'THE EXPRESSWAY', { scale: 3, color: '#1f3f6a' });
      drawText(ctx, 'NARITA TO THE CITY - 70 MINUTES', W / 2, 44, '#cfc9e6', { align: 'center', scale: 2, outline: '#12101c' });
      ctx.globalAlpha = 1;
    }

    // ---- the bubbles
    if (this.dlg) {
      const a = this.ubrAnchor();
      this.dlg.draw(ctx, a.x, a.y);
    }
    // a quiet note that the radio is a thing you can touch
    if (this.phase === 'ride' && this.hint > 8 && this.hint < 16 && !this.radio) {
      ctx.globalAlpha = clamp(16 - this.hint, 0, 1) * 0.7;
      drawText(ctx, Game.touch ? 'TAP THE RADIO' : 'R FOR THE RADIO', UBR.dashX - 4, 342, '#6a7080', { font: 'small' });
      ctx.globalAlpha = 1;
    }
  }
}

// The shape of going under. Two blinks that you win, one you do not, and then
// the slow one. Fighting it and losing twice is the whole feeling.
function ubrDrowseCurve(u) {
  if (u < 0.14) return 0;
  if (u < 0.20) return (u - 0.14) / 0.06;                       // blink shut
  if (u < 0.28) return 1 - (u - 0.20) / 0.08;                   // and open again
  if (u < 0.40) return 0.08;
  if (u < 0.47) return 0.08 + (u - 0.40) / 0.07 * 0.92;         // second blink, longer
  if (u < 0.57) return 1 - (u - 0.47) / 0.10 * 0.78;            // barely open
  if (u < 0.74) return lerp(0.22, 0.58, (u - 0.57) / 0.17);     // losing
  if (u < 0.82) return 0.58;                                    // a last stand
  return clamp(lerp(0.58, 1, (u - 0.82) / 0.18), 0, 1);
}
