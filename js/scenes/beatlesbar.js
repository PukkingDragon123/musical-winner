// ---------- THE BEATLES ----------
// A live house the size of somebody's front room, down a stair off a street
// that has no reason to have one. Eight stools, a stage you could step onto
// by accident, and every band that ever played here stapled to the wall.
// Ringo the Tingo owns it, pours it, books it and polishes the same glass all
// the way through the conversation. He is closed. He says so twice. Then he
// sees the case, and the rest of the evening happens.
//
// The job application is the set piece and it is slow on purpose: a paper
// form in a language you cannot read, a phone with a translate app that is
// confidently wrong the first time, and a clock that keeps going up while he
// tells you to take your time.
'use strict';

const BB_W = 1900;                 // how long the room is
const BB_Y = 400;                  // the floor you walk on
const BB_STAGE_Y = 374;            // the top of the riser
const BB_CEIL = 150;               // the underside of the ceiling
const BB_BAR_X0 = 280, BB_BAR_X1 = 800;
// The counter sits two pixels behind the aisle you walk down, which is the
// whole trick: everything on the bar side sorts behind you, so walking the
// length of it never buries you in mahogany.
const BB_BAR_BASE = BB_Y - 2;
const BB_BAR_TOP = BB_BAR_BASE - 58;   // the surface things stand on
const BB_STAGE_X0 = 1280, BB_STAGE_X1 = 1620;

const BB_PAL = {
  wall: '#2a2028', wallHi: '#3a2e38', wallLo: '#1a1420',
  wood: '#5a3a24', woodHi: '#7a5236', woodLo: '#3a2416',
  brass: '#c8a03a', brassHi: '#ffd24a',
  lamp: '#ffd8a0', red: '#c8402c', green: '#6be585',
  cream: '#f4f1ea', ink: '#241d28',
  bottle: ['#6be585', '#8ad8ff', '#ffd24a', '#e8503a', '#c58bff', '#f4f1ea'],
};

// The line-up chalked up for the rest of the week. Every one of these bands
// has three members and one van between them.
const BB_BANDS = [
  { day: 'FRI', name: 'THE WET SOCKS' },
  { day: 'SAT', name: 'MOTHBALL SUPERSTAR' },
  { day: 'SUN', name: 'CANNED COFFEE FUNERAL' },
];
// Cheap, and all of it is real. Nobody here is drinking anything with a name.
const BB_DRINKS = [
  { name: 'DRAFT - ONE SIZE', cost: 4, line: 'COLD. THE GLASS IS COLDER.', stam: 8 },
  { name: 'HIGHBALL', cost: 3, line: 'WHISKY, SODA, ONE ICE CUBE THE SIZE OF A FIST.', stam: 10 },
  { name: 'OOLONG TEA', cost: 2, line: 'THE DRIVER ORDER. NOBODY JUDGES IT HERE.', stam: 6 },
  { name: 'HOT SAKE - SMALL', cost: 4, line: 'IT ARRIVES TOO HOT AND YOU DRINK IT ANYWAY.', stam: 12 },
];

// Ringo, drawn out longhand so he is the same bug every time you come back.
const BB_RINGO_SPEC = {
  name: 'Ringo the Tingo', species: 'Bug', body: 'round', head: 'round',
  eyes: 'calm', antennae: 'curve', wings: 'none', pattern: 'belly', horns: 'none',
  colors: {
    body: '#8a5a34', body2: '#5e3a20', head: '#96643a', limb: '#4a2e18',
    wing: '#dfe9ff', wing2: '#5e3a20', eye: '#2a1a10', trim: '#c89a5a',
  },
  outfit: { shirt: '#f2ece0', vest: '#3a3a46', vestTrim: '#c8402c' },
};

// ==========================================================================
//  ART
// ==========================================================================

// A run of unreadable characters, the way a sign or a form label looks when
// you have been in the country for eleven hours.
function bbGlyphRun(ctx, x, y, n, s, col, seed) {
  const r = makeRng((seed || 3) >>> 0);
  for (let i = 0; i < n; i++) drawKanaBlock(ctx, x + i * (s + 3), y, s, col, r.int(0, 5));
  return n * (s + 3);
}

// The back wall: plaster that was white in the eighties, a dado rail, and the
// sort of damp patch everybody has agreed not to mention.
function bbWall(ctx, x0, x1, t) {
  rect(ctx, x0, BB_CEIL, x1 - x0, BB_Y - BB_CEIL + 40, BB_PAL.wall);
  ctx.globalAlpha = 0.5;
  vgrad(ctx, x0, BB_CEIL, x1 - x0, 120, BB_PAL.wallHi, BB_PAL.wall);
  ctx.globalAlpha = 1;
  // the dado rail, and the darker panelling under it
  rect(ctx, x0, 316, x1 - x0, BB_Y - 316, BB_PAL.wallLo);
  rect(ctx, x0, 314, x1 - x0, 4, BB_PAL.wood);
  rect(ctx, x0, 314, x1 - x0, 1, BB_PAL.woodHi);
  for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
    ctx.globalAlpha = 0.25; rect(ctx, x, 318, 1, BB_Y - 318, '#0d0a12'); ctx.globalAlpha = 1;
  }
  // damp, and the old paint over it
  const r = makeRng(4141);
  for (let i = 0; i < 26; i++) {
    const px2 = r.range(x0, x1), py = r.range(BB_CEIL + 10, 300);
    ctx.globalAlpha = 0.08;
    ellipsePx(ctx, px2, py, r.range(10, 34), r.range(6, 18), i % 3 ? '#0d0a12' : '#6a5a48');
    ctx.globalAlpha = 1;
  }
}

// The ceiling: low, black, and full of things somebody ran along it in 1979.
function bbCeiling(ctx, x0, x1, t) {
  rect(ctx, x0, 0, x1 - x0, BB_CEIL, '#120e16');
  rect(ctx, x0, BB_CEIL - 8, x1 - x0, 8, '#1c1620');
  rect(ctx, x0, BB_CEIL - 8, x1 - x0, 2, '#2e2634');
  // the pipe, and the cable taped to the pipe
  rect(ctx, x0, BB_CEIL - 26, x1 - x0, 7, '#3a3240');
  rect(ctx, x0, BB_CEIL - 26, x1 - x0, 2, '#524858');
  for (let x = Math.floor(x0 / 160) * 160; x < x1; x += 160) {
    rect(ctx, x, BB_CEIL - 28, 9, 11, '#241e2a');
    rect(ctx, x, BB_CEIL - 28, 9, 2, '#3a3240');
  }
  ctx.globalAlpha = 0.7;
  for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) rect(ctx, x, BB_CEIL - 17, 22, 3, '#191420');
  ctx.globalAlpha = 1;
}

// Fairy lights, strung twice across the room because one run was not enough
// and nobody ever took the first one down.
function bbFairyLights(ctx, x0, x1, t) {
  const cols = ['#ffd24a', '#6be585', '#8ad8ff', '#e8503a', '#c58bff'];
  for (let run = 0; run < 2; run++) {
    const baseY = BB_CEIL + 6 + run * 22, span = 150, sag = 16 + run * 5;
    for (let x = Math.floor(x0 / span) * span; x < x1; x += span) {
      for (let k = 0; k < 10; k++) {
        const ax = x + (span * k) / 10, ay = baseY + Math.sin((k / 10) * Math.PI) * sag;
        const bx = x + (span * (k + 1)) / 10, by2 = baseY + Math.sin(((k + 1) / 10) * Math.PI) * sag;
        line(ctx, ax, ay, bx, by2, '#1a1620');
      }
      for (let k = 1; k < 10; k++) {
        const kx = Math.round(x + (span * k) / 10), ky = Math.round(baseY + Math.sin((k / 10) * Math.PI) * sag);
        // x runs negative at the left end of the room, and a negative
        // remainder indexes off the front of the array and hands darken() an
        // undefined colour, which takes the whole frame down with it
        const ci = (k + run + Math.floor(x / span)) % cols.length;
        const c = cols[(ci + cols.length) % cols.length];
        const on = 0.55 + 0.45 * Math.sin(t * 2.2 + k * 1.3 + run * 2 + x * 0.01);
        ctx.globalAlpha = 0.16 * on; circle(ctx, kx, ky + 3, 7, c); ctx.globalAlpha = 1;
        rect(ctx, kx - 1, ky, 3, 4, darken(c, 0.4));
        ctx.globalAlpha = on; rect(ctx, kx, ky + 1, 2, 3, lighten(c, 0.4)); ctx.globalAlpha = 1;
      }
    }
  }
}

// The wall of everybody who has ever played here: posters, set lists torn off
// the floor and flattened, photographs with the flash in them.
function bbPosterWall(ctx, x0, y0, w, h, t) {
  const c = cached('bb-posterwall|' + w + 'x' + h, function () {
    const cv = makeCanvas(w + 8, h + 8);
    bbPaintPosterWall(cv.getContext('2d'), 4, 4, w, h);
    return cv;
  });
  ctx.drawImage(c, Math.round(x0) - 4, Math.round(y0) - 4);
}
function bbPaintPosterWall(ctx, x0, y0, w, h) {
  const r = makeRng(hashStr('beatles-posters'));
  rect(ctx, x0 - 4, y0 - 4, w + 8, h + 8, '#1e1822');
  const cols = ['#c8402c', '#2f6a9a', '#3f7a4a', '#c8a03a', '#7a3a6a', '#2a2a34'];
  for (let i = 0; i < 46; i++) {
    const pw = r.int(28, 52), ph = r.int(34, 62);
    const px2 = Math.round(x0 + r.range(0, w - pw)), py = Math.round(y0 + r.range(0, h - ph));
    const kind = r.int(0, 9);
    if (kind < 5) {
      // a gig poster: a block of colour, a band name that is four glyphs, a date
      const c = cols[r.int(0, cols.length - 1)];
      rect(ctx, px2 + 1, py + 2, pw, ph, '#0d0a12');
      rect(ctx, px2, py, pw, ph, c);
      rect(ctx, px2, py, pw, 2, lighten(c, 0.3));
      rect(ctx, px2 + 3, py + 4, pw - 6, Math.round(ph * 0.42), darken(c, 0.35));
      bbGlyphRun(ctx, px2 + 5, py + 7, Math.max(2, Math.floor((pw - 10) / 9)), 6, withAlpha(BB_PAL.cream, 0.85), i * 7 + 1);
      for (let l = 0; l < 3; l++) rect(ctx, px2 + 4, py + Math.round(ph * 0.55) + l * 5, pw - 8 - l * 6, 2, withAlpha(BB_PAL.cream, 0.6));
    } else if (kind < 8) {
      // a set list: lined paper, biro, six songs, the last one crossed out
      rect(ctx, px2, py, pw, ph, '#e8e2cc');
      frame(ctx, px2, py, pw, ph, '#b4ab90');
      for (let l = 0; l < Math.floor((ph - 8) / 7); l++) {
        const lw = pw - 10 - ((l * 13) % 12);
        rect(ctx, px2 + 5, py + 6 + l * 7, lw, 2, '#2f4a8a');
      }
      rect(ctx, px2 + 4, py + ph - 10, pw - 8, 2, '#c8402c');
    } else {
      // a photograph, white border, everybody blinking
      rect(ctx, px2, py, pw, ph, '#f4f1ea');
      rect(ctx, px2 + 3, py + 3, pw - 6, ph - 12, '#2a3244');
      ctx.globalAlpha = 0.5;
      ellipsePx(ctx, px2 + pw * 0.4, py + ph * 0.4, pw * 0.16, ph * 0.12, '#ffe9c0');
      ctx.globalAlpha = 1;
      for (let b = 0; b < 3; b++) ellipsePx(ctx, px2 + 8 + b * ((pw - 16) / 2), py + ph * 0.6, 4, 6, ['#8a5a34', '#4a6f96', '#3f7a4a'][b]);
      rect(ctx, px2 + 5, py + ph - 7, pw - 14, 2, '#8a8478');
    }
    // the pin, or the browning strip of tape
    if (r.chance(0.5)) { rect(ctx, px2 + pw / 2 - 1, py - 2, 3, 4, '#c8a03a'); }
    else { ctx.globalAlpha = 0.5; rect(ctx, px2 + pw / 2 - 7, py - 3, 14, 5, '#d8c89a'); ctx.globalAlpha = 1; }
  }
  // the one signed photo that has its own frame, because it is the owner's
  const fx0 = Math.round(x0 + w * 0.5) - 26, fy0 = Math.round(y0 + h * 0.5) - 20;
  rect(ctx, fx0 - 3, fy0 - 3, 58, 46, '#c8a03a');
  rect(ctx, fx0 - 1, fy0 - 1, 54, 42, '#3a2e2a');
  rect(ctx, fx0 + 2, fy0 + 2, 48, 30, '#1b2434');
  drawBugAt(ctx, BB_RINGO_SPEC, fx0 + 26, fy0 + 32, { pose: 'cheer', scale: 0.62, bounce: 0 });
  drawText(ctx, '1979', fx0 + 26, fy0 + 34, '#ffd24a', { align: 'center', font: 'small' });
}

// The chalkboard by the door. Tonight, and the three nights after it.
function bbChalkboard(ctx, x, y, w, h, t) {
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#4a3020');
  rect(ctx, x - 3, y - 3, w + 6, 3, '#6a462e');
  rect(ctx, x, y, w, h, '#1c2420');
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 9; i++) ellipsePx(ctx, x + 10 + i * 17, y + 20 + (i % 3) * 22, 22, 9, '#ffffff');
  ctx.globalAlpha = 1;
  drawText(ctx, 'TONIGHT', x + 8, y + 7, '#ffd24a', { scale: 2 });
  rect(ctx, x + 8, y + 22, w - 16, 1, withAlpha('#f4f1ea', 0.5));
  drawText(ctx, '7PM  ONE ACT', x + 8, y + 27, '#e8e2cc', { font: 'small' });
  drawText(ctx, 'NO NAME YET', x + 8, y + 36, '#8ad8ff', { font: 'small' });
  let ly = y + 48;
  for (let i = 0; i < BB_BANDS.length; i++) {
    const b = BB_BANDS[i];
    drawText(ctx, b.day, x + 8, ly, '#a8c8a0', { font: 'small' });
    drawText(ctx, b.name, x + 28, ly, '#f4f1ea', { font: 'small' });
    ly += 11;
  }
  drawText(ctx, 'DOORS 7. SUNDAY 6.', x + 8, y + 82, '#8a9a8a', { font: 'small' });
  // the prices, small, in the corner, because they have not changed in years
  drawText(ctx, 'DRAFT 4 HIGH 3 TEA 2 SAKE 4', x + 8, y + h - 7, '#d8d0b0', { font: 'small' });
}

// The bar itself, seen side on: the top, the apron, the brass foot rail.
function bbCounter(ctx, x0, x1, base, t) {
  const h = 58;
  const top = base - h;
  rect(ctx, x0, top, x1 - x0, h, BB_PAL.wood);
  rect(ctx, x0, top, x1 - x0, 7, BB_PAL.woodHi);
  rect(ctx, x0, top + 7, x1 - x0, 2, '#2a1a0e');
  // the grain, and forty years of glasses put down without a mat
  const r = makeRng(9090);
  for (let i = 0; i < 48; i++) {
    const gx = r.range(x0, x1);
    ctx.globalAlpha = 0.18; rect(ctx, gx, top + 1, r.range(12, 46), 1, '#2a1a0e'); ctx.globalAlpha = 1;
  }
  for (let i = 0; i < 9; i++) {
    const rx = x0 + 30 + i * ((x1 - x0 - 60) / 9);
    ctx.globalAlpha = 0.14; ellipseRingPx(ctx, rx, top + 4, 9, 3, '#1a0f06'); ctx.globalAlpha = 1;
  }
  // the apron, panelled
  rect(ctx, x0, top + 9, x1 - x0, h - 9, BB_PAL.woodLo);
  for (let x = x0 + 8; x < x1 - 20; x += 58) {
    rect(ctx, x, top + 16, 44, h - 30, darken(BB_PAL.woodLo, 0.2));
    rect(ctx, x, top + 16, 44, 1, '#4a301c');
  }
  // the brass rail your foot has been on since you sat down
  rect(ctx, x0, base - 12, x1 - x0, 4, BB_PAL.brass);
  rect(ctx, x0, base - 12, x1 - x0, 1, BB_PAL.brassHi);
  for (let x = x0 + 26; x < x1; x += 120) rect(ctx, x, base - 12, 4, 12, '#8a6a22');
  ctx.globalAlpha = 0.1; rect(ctx, x0, base - 4, x1 - x0, 4, '#ffffff'); ctx.globalAlpha = 1;
  bbBarTopJunk(ctx, x0, top, t);
}

// What is actually on the bar between the things you can pick up: a rubber
// drip mat with three glasses drying on it upside down, a folded towel that
// has been folded since lunch, and the bell. Nobody rings the bell.
function bbBarTopJunk(ctx, x0, top, t) {
  // the drip mat, ribbed, with a puddle at the low end
  rect(ctx, x0 + 16, top - 4, 64, 4, '#2a3a34');
  rect(ctx, x0 + 16, top - 4, 64, 1, '#3e5248');
  for (let i = 0; i < 8; i++) rect(ctx, x0 + 19 + i * 8, top - 3, 1, 3, '#1a2620');
  ctx.globalAlpha = 0.22; rect(ctx, x0 + 14, top, 70, 2, '#8ad8ff'); ctx.globalAlpha = 1;
  // three glasses upside down on it, each one a slightly different survivor
  for (let i = 0; i < 3; i++) {
    const gx = x0 + 24 + i * 20, gh = 15 + (i % 2) * 3;
    rect(ctx, gx, top - 4 - gh, 12, gh, withAlpha('#bfe0ff', 0.26));
    rect(ctx, gx, top - 4 - gh, 2, gh, withAlpha('#ffffff', 0.42));
    rect(ctx, gx + 10, top - 4 - gh, 2, gh, withAlpha('#7aa0b8', 0.35));
    rect(ctx, gx - 1, top - 4 - gh, 14, 3, withAlpha('#dfeeff', 0.5));
    frame(ctx, gx, top - 4 - gh, 12, gh, '#6a8490');
  }
  // the towel, folded in four, the fold facing him
  rect(ctx, x0 + 164, top - 7, 34, 7, '#e8e2cc');
  rect(ctx, x0 + 164, top - 7, 34, 2, '#f4f1ea');
  rect(ctx, x0 + 164, top - 3, 34, 1, '#4a6f96');
  rect(ctx, x0 + 164, top - 7, 2, 7, '#c8c0aa');
  // the bell, brass, with the one pip of ceiling in it
  const bx = x0 + 400;
  ellipsePx(ctx, bx, top - 6, 9, 7, BB_PAL.brass);
  ellipsePx(ctx, bx - 2, top - 8, 4, 3, BB_PAL.brassHi);
  rect(ctx, bx - 9, top - 4, 18, 3, '#8a6a22');
  rect(ctx, bx - 1, top - 16, 2, 5, '#8a6a22');
  rect(ctx, bx - 2, top - 18, 4, 2, BB_PAL.brassHi);
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 1.3);
  px(ctx, Math.round(bx + 3), Math.round(top - 9), '#fff6c8');
  ctx.globalAlpha = 1;
}

// The back bar: three shelves of bottles with a strip light behind them, which
// is the only reason anybody can see anything in here.
function bbBottleShelf(ctx, x0, x1, t) {
  const top = 214, h = 100;
  rect(ctx, x0, top, x1 - x0, h, '#1a1218');
  rect(ctx, x0, top, x1 - x0, 3, BB_PAL.woodHi);
  // the light behind the glass
  ctx.globalAlpha = 0.22;
  vgrad(ctx, x0 + 2, top + 2, x1 - x0 - 4, h - 4, '#ffb45a', '#3a1f14');
  ctx.globalAlpha = 1;
  const r = makeRng(hashStr('beatles-bottles'));
  for (let s = 0; s < 3; s++) {
    const sy = top + 22 + s * 28;
    rect(ctx, x0 + 3, sy, x1 - x0 - 6, 4, BB_PAL.wood);
    rect(ctx, x0 + 3, sy, x1 - x0 - 6, 1, BB_PAL.woodHi);
    ctx.globalAlpha = 0.16; rect(ctx, x0 + 3, sy + 4, x1 - x0 - 6, 5, '#000'); ctx.globalAlpha = 1;
    for (let bx = x0 + 9; bx < x1 - 12; bx += r.int(9, 14)) {
      const bh = r.int(14, 22), bw = r.int(5, 8);
      const c = BB_PAL.bottle[r.int(0, BB_PAL.bottle.length - 1)];
      rect(ctx, bx, sy - bh, bw, bh, withAlpha(c, 0.85));
      rect(ctx, bx, sy - bh, 1, bh, lighten(c, 0.45));
      rect(ctx, bx + Math.floor(bw / 2) - 1, sy - bh - 5, 2, 5, darken(c, 0.35));
      if (r.chance(0.5)) rect(ctx, bx, sy - Math.round(bh * 0.55), bw, 4, '#f4f1ea');
      // the light coming through the glass and landing on the shelf
      ctx.globalAlpha = 0.14; rect(ctx, bx - 1, sy, bw + 2, 3, c); ctx.globalAlpha = 1;
    }
  }
  // the strip light itself, along the top
  ctx.globalAlpha = 0.5 + 0.06 * Math.sin(t * 9);
  rect(ctx, x0 + 4, top + 6, x1 - x0 - 8, 3, '#ffd8a0');
  ctx.globalAlpha = 0.1; rect(ctx, x0 + 4, top + 9, x1 - x0 - 8, 14, '#ffd8a0'); ctx.globalAlpha = 1;
}

// The till: mechanical, heavy, and the drawer does not shut first time.
function bbTill(ctx, x, base, t, ringing) {
  const w = 54, h = 44, y = base - h;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x, base + 1, 30, 5, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x - w / 2, y, w, h, '#3a2e34');
  rect(ctx, x - w / 2, y, w, 3, '#5a4a52');
  rect(ctx, x - w / 2 + 3, y + 5, w - 6, 14, '#12101c');
  const amt = ringing ? '  38' : '   0';
  drawText(ctx, amt, x + 18, y + 9, ringing ? '#6be585' : '#3f7a4a', { align: 'right', font: 'small' });
  for (let r2 = 0; r2 < 3; r2++) for (let i = 0; i < 5; i++) {
    rect(ctx, x - 22 + i * 9, y + 23 + r2 * 7, 7, 5, (i + r2) % 3 ? '#8a8078' : '#c8c0b0');
    rect(ctx, x - 22 + i * 9, y + 23 + r2 * 7, 7, 1, '#e0d8c8');
  }
  const open = ringing ? 8 : 0;
  rect(ctx, x - w / 2 - open, base - 10, w, 10, '#4a3a40');
  rect(ctx, x - w / 2 - open, base - 10, w, 2, '#6a5a60');
}

// The tip jar. A pickle jar with a slot cut in the lid and one label on it.
function bbTipJar(ctx, x, base, t, coins) {
  const h = 34;
  ctx.globalAlpha = 0.25; ellipsePx(ctx, x, base + 1, 13, 4, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x - 11, base - h, 22, h, withAlpha('#bfe0ff', 0.28));
  rect(ctx, x - 11, base - h, 2, h, withAlpha('#ffffff', 0.4));
  frame(ctx, x - 11, base - h, 22, h, '#7a8a96');
  rect(ctx, x - 12, base - h - 4, 24, 5, '#8a8f98');
  rect(ctx, x - 4, base - h - 3, 8, 2, '#2a2d33');
  // the coins, and the one note somebody folded into a crane
  const n = clamp(coins || 0, 0, 7);
  for (let i = 0; i < n; i++) {
    const cy = base - 3 - Math.floor(i / 3) * 4;
    rect(ctx, x - 8 + (i % 3) * 6, cy, 5, 3, i % 2 ? '#c8a03a' : '#b9bec6');
  }
  if (n >= 4) { rect(ctx, x - 7, base - 16, 14, 7, '#e8e2cc'); rect(ctx, x - 7, base - 16, 14, 2, '#f4f1ea'); }
  drawText(ctx, 'TIPS', x, base - h + 12, '#2a1a08', { align: 'center', font: 'small' });
}

// The dartboard, with the three darts still in it from last night and the
// arc of holes in the wall around it from everything that missed.
function bbDartboard(ctx, x, y, t) {
  const c = cached('bb-dartboard', function () {
    const cv = makeCanvas(96, 88);
    bbPaintDartboard(cv.getContext('2d'), 48, 44);
    return cv;
  });
  ctx.drawImage(c, Math.round(x) - 48, Math.round(y) - 44);
}
function bbPaintDartboard(ctx, x, y) {
  const R = 22;
  const r = makeRng(2211);
  for (let i = 0; i < 24; i++) {
    ctx.globalAlpha = 0.5;
    px(ctx, x + r.range(-R - 16, R + 16), y + r.range(-R - 14, R + 14), '#12101c');
    ctx.globalAlpha = 1;
  }
  circle(ctx, x, y, R + 4, '#3a2a1e');
  circle(ctx, x, y, R, '#e8e2cc');
  // the alternating wedges, walked pixel by pixel so the edges step
  for (let dy = -R; dy <= R; dy++) {
    for (let dx = -R; dx <= R; dx++) {
      if (dx * dx + dy * dy > R * R) continue;
      const a = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
      if (Math.floor(a / (Math.PI / 10)) % 2 === 0) px(ctx, x + dx, y + dy, '#241d28');
    }
  }
  ringPx(ctx, x, y, Math.round(R * 0.62), '#c8402c');
  ringPx(ctx, x, y, Math.round(R * 0.61), '#c8402c');
  circle(ctx, x, y, 5, '#3f7a4a');
  circle(ctx, x, y, 2, '#c8402c');
  // three darts, one of them barely in
  const darts = [[-6, -4, -1], [3, -8, 1], [8, 5, 1]];
  for (let i = 0; i < darts.length; i++) {
    const d = darts[i];
    rect(ctx, x + d[0], y + d[1], 2, 2, '#b9bec6');
    rect(ctx, x + d[0] + d[2] * 2, y + d[1] - 2, 9 * d[2], 2, '#8a8f98');
    rect(ctx, x + d[0] + d[2] * 10, y + d[1] - 4, 4 * d[2], 5, ['#c8402c', '#6be585', '#8ad8ff'][i]);
  }
}

// Four bugs on a crossing, in a row, out of step. Everybody who comes in looks
// at it and nobody ever says anything about it.
function bbCrossingPoster(ctx, x, y, w, h, t) {
  rect(ctx, x + 2, y + 3, w, h, '#0d0a12');
  rect(ctx, x, y, w, h, '#e8e2cc');
  frame(ctx, x, y, w, h, '#8a8478');
  // the sky and the road
  vgrad(ctx, x + 4, y + 4, w - 8, Math.round(h * 0.42), '#bcd0e0', '#e0e6ec');
  rect(ctx, x + 4, y + 4 + Math.round(h * 0.42), w - 8, h - 8 - Math.round(h * 0.42), '#4a4a52');
  // the white bars of the crossing, running away
  const roadY = y + 4 + Math.round(h * 0.42);
  for (let i = 0; i < 6; i++) {
    const by = roadY + 6 + i * ((h - 16 - Math.round(h * 0.42)) / 6);
    rect(ctx, x + 6, by, w - 12, 3 + i * 0.6, '#e8e6dc');
  }
  // four of them, walking, one out of step and one barefoot
  const cols = ['#8a5a34', '#4a6f96', '#3f7a4a', '#c8a03a'];
  for (let i = 0; i < 4; i++) {
    const bx = x + 10 + i * ((w - 22) / 4), by = y + h - 12 - (i === 2 ? 2 : 0);
    ellipsePx(ctx, bx + 5, by - 12, 5, 7, cols[i]);
    ellipsePx(ctx, bx + 5, by - 21, 4, 4, lighten(cols[i], 0.2));
    rect(ctx, bx + 2, by - 5, 2, 5, '#241d28');
    rect(ctx, bx + 7, by - 5, 2, 5, '#241d28');
  }
  drawText(ctx, 'FOUR OF THEM', x + w / 2, y + h - 9, '#241d28', { align: 'center', font: 'small' });
}

// The stage. Six inches off the floor, carpeted in something that was a rug in
// another building, and every inch of it taped.
function bbStage(ctx, x0, x1, base, t) {
  const h = base - BB_STAGE_Y;
  rect(ctx, x0, BB_STAGE_Y, x1 - x0, h, '#2e2430');
  rect(ctx, x0, BB_STAGE_Y, x1 - x0, 4, '#4a3c48');
  rect(ctx, x0, BB_STAGE_Y + 4, x1 - x0, 2, '#1a1420');
  // the front lip, scuffed white where every amp has been dragged over it
  ctx.globalAlpha = 0.3;
  for (let x = x0 + 4; x < x1; x += 13) rect(ctx, x, BB_STAGE_Y + 1, 7, 2, '#c8c0b0');
  ctx.globalAlpha = 1;
  rect(ctx, x0, base - 4, x1 - x0, 4, '#1a1420');
  // the rug: red, worn through in the middle, gaffer tape on the edge
  const rx0 = x0 + 44, rx1 = x1 - 64;
  rect(ctx, rx0, BB_STAGE_Y - 4, rx1 - rx0, 6, '#7a2a24');
  rect(ctx, rx0, BB_STAGE_Y - 4, rx1 - rx0, 2, '#9a3a30');
  ctx.globalAlpha = 0.5;
  rect(ctx, rx0 + 52, BB_STAGE_Y - 4, 70, 3, '#5a3a34');
  ctx.globalAlpha = 1;
  for (let x = rx0; x < rx1; x += 24) rect(ctx, x, BB_STAGE_Y - 5, 12, 2, '#2a2a30');
}

// The backline: one combo amp that has been re-covered, and a kit nobody owns.
function bbBackline(ctx, x, base, t) {
  // the amp
  const w = 62, h = 48;
  rect(ctx, x - w / 2, base - h, w, h, '#2a2028');
  rect(ctx, x - w / 2, base - h, w, 3, '#463a44');
  rect(ctx, x - w / 2 + 5, base - h + 7, w - 10, h - 16, '#1a1520');
  // the grille cloth, cross hatched
  for (let i = 0; i < w - 10; i += 3) { ctx.globalAlpha = 0.35; rect(ctx, x - w / 2 + 5 + i, base - h + 7, 1, h - 16, '#6a5a50'); ctx.globalAlpha = 1; }
  for (let i = 0; i < h - 16; i += 3) { ctx.globalAlpha = 0.25; rect(ctx, x - w / 2 + 5, base - h + 7 + i, w - 10, 1, '#6a5a50'); ctx.globalAlpha = 1; }
  // the control panel and the one light that works
  rect(ctx, x - w / 2 + 5, base - h + 2, w - 10, 6, '#c8a03a');
  for (let i = 0; i < 5; i++) circle(ctx, x - 20 + i * 10, base - h + 5, 2, '#3a2e24');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2.6);
  rect(ctx, x + w / 2 - 10, base - h + 3, 3, 3, '#e8503a');
  ctx.globalAlpha = 1;
  rect(ctx, x - w / 2 + 6, base - 5, w - 12, 5, '#1a1520');
  // the lead, coiled on the floor where somebody will trip on it
  for (let k = 0; k < 20; k++) {
    const ax = x + 30 + k * 2.4, ay = base - 3 + Math.sin(k * 0.9) * 4;
    const bx = x + 30 + (k + 1) * 2.4, by = base - 3 + Math.sin((k + 1) * 0.9) * 4;
    line(ctx, ax, ay, bx, by, '#141018');
    line(ctx, ax, ay + 1, bx, by + 1, '#0d0a12');
  }
}

// The house kit: a kick, a snare, one rack tom, a hat and a ride with a crack
// in it that everybody says they can hear.
function bbKit(ctx, x, base, t) {
  // kick drum, seen from the side
  ellipsePx(ctx, x, base - 20, 22, 20, '#e8e2cc');
  ellipsePx(ctx, x, base - 20, 19, 17, '#d8d0b4');
  ringPx(ctx, x, base - 20, 22, '#3a2a1e');
  drawText(ctx, 'B', x, base - 25, '#8a2a24', { align: 'center', scale: 2 });
  rect(ctx, x - 26, base - 3, 52, 3, '#3a3040');
  // the snare on its stand
  rect(ctx, x + 24, base - 30, 20, 9, '#b9bec6');
  rect(ctx, x + 24, base - 30, 20, 2, '#e0e6ec');
  rect(ctx, x + 24, base - 22, 20, 2, '#8a8f98');
  rect(ctx, x + 33, base - 21, 2, 21, '#4a4a52');
  // rack tom over the kick
  rect(ctx, x - 10, base - 48, 20, 12, '#7a4a2a');
  rect(ctx, x - 10, base - 48, 20, 2, '#9a6a44');
  rect(ctx, x - 1, base - 38, 2, 10, '#4a4a52');
  // hi-hat and the cracked ride
  rect(ctx, x - 40, base - 44, 22, 2, '#c8a03a');
  rect(ctx, x - 40, base - 40, 22, 2, '#c8a03a');
  rect(ctx, x - 30, base - 40, 2, 40, '#4a4a52');
  // the ride, tilted the way a cymbal on a cheap stand always is, drawn as
  // steps rather than a rotated rectangle so the edge stays hard
  for (let i = -16; i < 16; i++) {
    const cy2 = base - 52 + Math.round(-i * 0.16);
    rect(ctx, x + 46 + i, cy2, 1, 2, '#e0b23c');
    rect(ctx, x + 46 + i, cy2 + 2, 1, 1, '#8a6a1a');
  }
  rect(ctx, x + 45, base - 50, 2, 50, '#4a4a52');
  // the stool, and the sticks left crossed on the snare
  rect(ctx, x + 70, base - 24, 18, 5, '#3a2a30');
  rect(ctx, x + 78, base - 19, 2, 19, '#4a4a52');
  rect(ctx, x + 26, base - 32, 16, 2, '#d8c0a0');
  rect(ctx, x + 27, base - 34, 16, 2, '#d8c0a0');
}

// The piano: an upright with the lid up, four rings burned into the top and a
// metronome nobody has wound since the nineties.
function bbPiano(ctx, x, base, t) {
  const w = 96, h = 62;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x, base + 1, w * 0.5, 5, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x - w / 2, base - h, w, h, '#3a2018');
  rect(ctx, x - w / 2, base - h, w, 4, '#5a3626');
  rect(ctx, x - w / 2, base - h + 4, w, 2, '#22120c');
  // the lid, and the rings on it
  rect(ctx, x - w / 2 - 3, base - h - 5, w + 6, 6, '#4a2a1e');
  rect(ctx, x - w / 2 - 3, base - h - 5, w + 6, 2, '#6a4030');
  for (let i = 0; i < 4; i++) {
    ctx.globalAlpha = 0.3;
    ellipseRingPx(ctx, x - 32 + i * 22, base - h - 2, 8, 3, '#1a0d08');
    ctx.globalAlpha = 1;
  }
  // the keys
  const ky = base - 30;
  rect(ctx, x - w / 2 + 5, ky, w - 10, 11, '#f4f1ea');
  rect(ctx, x - w / 2 + 5, ky, w - 10, 2, '#ffffff');
  for (let i = 0; i < 15; i++) rect(ctx, x - w / 2 + 6 + i * 6, ky, 1, 11, '#b4ab96');
  for (let i = 0; i < 15; i++) if (i % 7 !== 2 && i % 7 !== 6) rect(ctx, x - w / 2 + 9 + i * 6, ky, 3, 7, '#241d28');
  // the front panel and the pedals
  rect(ctx, x - w / 2 + 5, ky + 12, w - 10, 18, '#2e1a12');
  rect(ctx, x - 8, base - 6, 5, 6, '#c8a03a');
  rect(ctx, x + 2, base - 6, 5, 6, '#c8a03a');
  // the metronome on the lid, stopped
  rect(ctx, x + 32, base - h - 19, 10, 14, '#6a4a2a');
  rect(ctx, x + 32, base - h - 19, 10, 2, '#8a6440');
  rect(ctx, x + 36, base - h - 17, 2, 11, '#c8c0b0');
  // a glass, obviously
  rect(ctx, x - 40, base - h - 13, 8, 9, withAlpha('#bfe0ff', 0.35));
  rect(ctx, x - 40, base - h - 9, 8, 5, withAlpha('#c8a03a', 0.5));
}

// A PAR can on a stand. When it is on it throws a cone into the haze and a
// pool on the rug, because every light in this game has to do something.
function bbParCan(ctx, x, base, t, col, on, aim) {
  const stand = 76;
  rect(ctx, x - 12, base - 3, 24, 3, '#2a2430');
  rect(ctx, x - 2, base - stand, 4, stand, '#3a3440');
  rect(ctx, x - 2, base - stand, 1, stand, '#4e4658');
  const cy = base - stand - 6;
  rect(ctx, x - 9, cy - 8, 18, 16, '#241e2a');
  rect(ctx, x - 9, cy - 8, 18, 2, '#3a3240');
  rect(ctx, x + 7 * (aim || 1), cy - 7, 5, 14, '#1a1620');
  if (on) {
    ctx.globalAlpha = 0.55 + 0.1 * Math.sin(t * 7 + x);
    rect(ctx, x + 8 * (aim || 1), cy - 5, 3, 10, lighten(col, 0.5));
    ctx.globalAlpha = 1;
    // the cone, painted as three flat wedges because nothing here is smooth
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.05 + i * 0.015;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x + 8 * (aim || 1), cy - 5);
      ctx.lineTo(x + 8 * (aim || 1), cy + 5);
      ctx.lineTo(x + (aim || 1) * (120 + i * 40), BB_STAGE_Y - 4);
      ctx.lineTo(x + (aim || 1) * (40 + i * 40), BB_STAGE_Y - 4);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    lightPool(ctx, x + (aim || 1) * 80, BB_STAGE_Y - 2, 54, col, 0.14);
  }
}

// One bare bulb on a flex over the middle of the stage. It is the whole
// lighting rig on a Tuesday.
function bbBulb(ctx, x, t) {
  const sway = Math.sin(t * 0.8) * 3;
  const y = BB_CEIL + 74;
  line(ctx, x, BB_CEIL - 14, x + sway, y - 8, '#1a1620');
  rect(ctx, x + sway - 3, y - 10, 6, 6, '#8a8f98');
  ellipsePx(ctx, x + sway, y, 6, 8, '#fff0c0');
  ellipsePx(ctx, x + sway - 1, y - 1, 3, 4, '#ffffff');
  ctx.globalAlpha = 0.12 + 0.02 * Math.sin(t * 3);
  ellipsePx(ctx, x + sway, y + 2, 26, 26, '#ffd8a0');
  ctx.globalAlpha = 1;
  lightPool(ctx, x + sway, BB_STAGE_Y - 2, 70, '#ffd8a0', 0.1);
}

// The flight cases by the door, stacked, all of them somebody else's.
function bbFlightCases(ctx, x, base, t) {
  const boxes = [
    { w: 74, h: 34, c: '#2a2a34', tag: 'FRAGILE' },
    { w: 62, h: 28, c: '#3a2a24', tag: 'HEAD' },
    { w: 48, h: 22, c: '#24303a', tag: '' },
  ];
  let y = base;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x, base + 1, 42, 6, '#000'); ctx.globalAlpha = 1;
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    rect(ctx, x - b.w / 2, y - b.h, b.w, b.h, b.c);
    rect(ctx, x - b.w / 2, y - b.h, b.w, 3, lighten(b.c, 0.25));
    rect(ctx, x - b.w / 2, y - 3, b.w, 3, darken(b.c, 0.3));
    // the aluminium edging and the two catches
    rect(ctx, x - b.w / 2, y - b.h, 4, b.h, '#8a8f98');
    rect(ctx, x + b.w / 2 - 4, y - b.h, 4, b.h, '#8a8f98');
    rect(ctx, x - 9, y - Math.round(b.h * 0.5), 8, 6, '#b9bec6');
    rect(ctx, x + 2, y - Math.round(b.h * 0.5), 8, 6, '#b9bec6');
    if (b.tag) {
      rect(ctx, x - 20, y - b.h + 6, 40, 9, '#e8e2cc');
      drawText(ctx, b.tag, x, y - b.h + 8, '#241d28', { align: 'center', font: 'small' });
    }
    y -= b.h;
  }
}

// The fire door, with the sign over it that is the brightest thing in the room.
function bbFireDoor(ctx, x, base, t) {
  const w = 62, h = 118;
  rect(ctx, x - w / 2 - 4, base - h - 4, w + 8, h + 4, '#1c1620');
  rect(ctx, x - w / 2, base - h, w, h, '#3a4a44');
  rect(ctx, x - w / 2, base - h, w, 3, '#52645c');
  rect(ctx, x - w / 2 + 3, base - h + 3, w - 6, h - 6, '#2e3c38');
  // the push bar
  rect(ctx, x - w / 2 + 4, base - 62, w - 8, 7, '#b9bec6');
  rect(ctx, x - w / 2 + 4, base - 62, w - 8, 2, '#dfe4ea');
  rect(ctx, x - w / 2 + 8, base - 55, 5, 9, '#8a8f98');
  rect(ctx, x + w / 2 - 13, base - 55, 5, 9, '#8a8f98');
  // the running man, in green, above it
  const sy = base - h - 26;
  rect(ctx, x - 26, sy, 52, 22, '#0d2a18');
  frame(ctx, x - 26, sy, 52, 22, '#1e4a30');
  ctx.globalAlpha = 0.7 + 0.1 * Math.sin(t * 5);
  rect(ctx, x - 24, sy + 2, 48, 18, '#1f6f4a');
  ctx.globalAlpha = 1;
  drawText(ctx, 'EXIT', x + 6, sy + 7, '#d8ffe4', { align: 'center', scale: 2 });
  ellipsePx(ctx, x - 17, sy + 7, 2, 2, '#d8ffe4');
  rect(ctx, x - 18, sy + 10, 3, 6, '#d8ffe4');
  rect(ctx, x - 21, sy + 15, 3, 4, '#d8ffe4');
  rect(ctx, x - 15, sy + 15, 4, 3, '#d8ffe4');
  ctx.globalAlpha = 0.1; ellipsePx(ctx, x, sy + 24, 46, 16, '#6be585'); ctx.globalAlpha = 1;
}

// The stair up to the street: the only door in or out, and the reason nobody
// finds this place twice without being told how.
function bbStairwell(ctx, x, base, t) {
  const top = BB_CEIL - 4;
  rect(ctx, x - 70, top, 140, base - top, '#16121c');
  for (let i = 0; i < 7; i++) {
    const sy = base - 8 - i * 22, sw = 96 - i * 6;
    rect(ctx, x - sw / 2, sy, sw, 7, '#2e2836');
    rect(ctx, x - sw / 2, sy, sw, 2, '#443c50');
    ctx.globalAlpha = 0.4; rect(ctx, x - sw / 2, sy + 7, sw, 4, '#0d0a12'); ctx.globalAlpha = 1;
  }
  // daylight, or what is left of it, coming down from the street door
  ctx.globalAlpha = 0.12 + 0.03 * Math.sin(t * 0.7);
  ctx.fillStyle = '#8fb0d8';
  ctx.beginPath();
  ctx.moveTo(x - 24, top); ctx.lineTo(x + 24, top);
  ctx.lineTo(x + 60, base); ctx.lineTo(x - 60, base);
  ctx.fill();
  ctx.globalAlpha = 1;
  rect(ctx, x - 26, top, 52, 8, '#0d0a12');
  // the handrail
  for (let k = 0; k < 3; k++) line(ctx, x - 52 + k, base - 40, x - 22 + k, top + 30, k ? '#4a3c24' : '#6a5a3a');
  // the handwritten sign taped at the bottom, which is the only sign there is
  rect(ctx, x + 34, base - 96, 40, 30, '#e8e2cc');
  frame(ctx, x + 34, base - 96, 40, 30, '#b4ab90');
  drawText(ctx, 'THE', x + 54, base - 92, '#241d28', { align: 'center', font: 'small' });
  drawText(ctx, 'BEATLES', x + 54, base - 84, '#c8402c', { align: 'center', font: 'small' });
  drawText(ctx, 'DOWN', x + 54, base - 75, '#241d28', { align: 'center', font: 'small' });
}

// A stool. Eight of them, all different heights, all wobbling differently.
function bbStool(ctx, x, base, i) {
  const h = 30 + (i % 3) * 2;
  ctx.globalAlpha = 0.25; ellipsePx(ctx, x, base + 1, 13, 4, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x - 13, base - h, 26, 6, i % 2 ? '#7a2a24' : '#6a2620');
  rect(ctx, x - 13, base - h, 26, 2, i % 2 ? '#9a3a30' : '#8a342a');
  rect(ctx, x - 3, base - h + 6, 6, h - 6, '#3a3440');
  rect(ctx, x - 3, base - h + 6, 2, h - 6, '#4e4658');
  rect(ctx, x - 10, base - 10, 20, 2, '#8a6a22');
  rect(ctx, x - 9, base - 2, 18, 2, '#2a2430');
}

// Ringo's own details, which the shared bug sprite has never heard of: the
// moustache, the towel over one shoulder, and the sticks in the back pocket.
function bbRingoExtras(ctx, x, y, s, t, face, polishing) {
  const f = face || 1;
  // the moustache, which is the first thing anybody notices
  const my = y - 39 * s;
  rect(ctx, x - 7 * s, my, 14 * s, 2.4 * s, '#3a2314');
  rect(ctx, x - 9 * s, my + 1 * s, 3 * s, 2 * s, '#3a2314');
  rect(ctx, x + 6 * s, my + 1 * s, 3 * s, 2 * s, '#3a2314');
  rect(ctx, x - 6 * s, my, 12 * s, 1 * s, '#54341e');
  // the bar towel, over the shoulder away from you
  const ty = y - 34 * s;
  rect(ctx, x - f * 13 * s, ty, 7 * s, 16 * s, '#e8e2cc');
  rect(ctx, x - f * 13 * s, ty, 7 * s, 2 * s, '#f4f1ea');
  rect(ctx, x - f * 13 * s, ty + 7 * s, 7 * s, 1.5 * s, '#4a6f96');
  // the sticks, in the back pocket, crossed
  const sy = y - 22 * s;
  for (let i = 0; i < 2; i++) {
    ctx.save();
    ctx.translate(Math.round(x - f * 10 * s), Math.round(sy));
    ctx.rotate((i ? 0.3 : 0.14) * f);
    rect(ctx, 0, 0, 2 * s, 15 * s, '#d8c0a0');
    rect(ctx, 0, 0, 1 * s, 15 * s, '#f0e2c8');
    ctx.restore();
  }
  // the glass and the cloth, going round and round
  if (polishing) {
    const spin = Math.sin(t * 3.2);
    const gx = x + f * 11 * s, gy = y - 30 * s;
    rect(ctx, gx - 3 * s, gy, 7 * s, 11 * s, withAlpha('#bfe0ff', 0.4));
    rect(ctx, gx - 3 * s, gy, 1.5 * s, 11 * s, withAlpha('#ffffff', 0.55));
    frame(ctx, gx - 3 * s, gy, 7 * s, 11 * s, '#8aa0b0');
    rect(ctx, gx - 5 * s + spin * 2 * s, gy + 2 * s, 5 * s, 6 * s, '#f4f1ea');
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6);
    px(ctx, Math.round(gx + 2 * s), Math.round(gy + 2 * s), '#ffffff');
    ctx.globalAlpha = 1;
  }
}

// ---------- THE BEER MAT ----------
// He writes the address on a beer mat because that is what is on the bar. It
// gets kept, so it has to be a real object you can look at twice.
function beatlesBeerMat(ctx, cx, cy, s, t, mat) {
  const m = mat || (Game.run && Game.run.beermat) || {};
  const R = Math.round(44 * s);
  // the mat: a cream disc with the corners knocked off, and a cardboard edge
  ctx.globalAlpha = 0.35; ellipsePx(ctx, cx + 2 * s, cy + 4 * s, R, R * 0.96, '#000'); ctx.globalAlpha = 1;
  ellipsePx(ctx, cx, cy, R, R * 0.96, '#d8cfb4');
  ellipsePx(ctx, cx, cy - 1 * s, R - 2, R * 0.92, '#efe9d6');
  ellipseRingPx(ctx, cx, cy, R - 5, Math.round((R - 5) * 0.92), '#c8402c');
  // the ring a wet glass left on it, off centre, because of course
  ctx.globalAlpha = 0.22;
  ellipseRingPx(ctx, cx + 10 * s, cy + 8 * s, 15 * s, 13 * s, '#8a5a34');
  ctx.globalAlpha = 1;
  // the printed side: the bar's own name, which is all the printing it gets
  drawText(ctx, 'THE BEATLES', cx, cy - R + 12 * s, '#c8402c', { align: 'center', scale: Math.max(1, Math.round(s)) });
  ctx.globalAlpha = 0.6;
  rect(ctx, cx - R + 12 * s, cy - R + 22 * s, (R - 12 * s) * 2, 1, '#b4ab90');
  ctx.globalAlpha = 1;
  // and the biro, which is the part that matters
  const lines = m.lines || ['SHIMOKITAZAWA 2-14-8', 'SOUTH EXIT. NOT WEST.', 'LEFT SIDE OF THE ROAD.', 'GREY DOOR. NO SIGN. DOWN.'];
  for (let i = 0; i < lines.length; i++) {
    drawText(ctx, lines[i], cx, cy - R + 28 * s + i * 9 * s, '#2f4a8a', { align: 'center', font: 'small' });
  }
  drawText(ctx, m.time || '19:00', cx, cy + R - 20 * s, '#2f4a8a', { align: 'center', scale: Math.max(1, Math.round(s)) });
  if (m.fee) drawText(ctx, fmtMoney(m.fee) + ' A SET', cx, cy + R - 10 * s, '#3f7a4a', { align: 'center', font: 'small' });
}

// ==========================================================================
//  THE FORM
// ==========================================================================
// Five fields. Each one is a label you cannot read, a phone that gets it wrong
// the first time on purpose, and four answers of which one is right and one is
// the way you would talk to a friend.
function bbFormFields() {
  const r = Game.run;
  const me = (r && r.members && r.members[0]) || null;
  const nm = String((me && me.name) || 'BUSKER').toUpperCase();
  const ins = (me && typeof INSTRUMENTS !== 'undefined' && INSTRUMENTS[me.instrument])
    ? String(INSTRUMENTS[me.instrument].name).toUpperCase() : 'GUITAR';
  return [
    {
      n: 5, seed: 11,
      wrong: 'NAME OF YOUR HORSE?',
      right: 'FULL NAME. FAMILY NAME FIRST.',
      ringo: 'YOU DO NOT HAVE A HORSE.',
      opts: [
        { label: nm + '  (FAMILY NAME FIRST)', ok: true },
        { label: 'NO HORSE' },
        { label: 'TO WHOM IT MAY CONCERN', bad: true },
        { label: nm + ' THE THIRD' },
      ],
    },
    {
      n: 7, seed: 23,
      wrong: 'WHAT IS YOUR FAVOURITE SOUP?',
      right: 'INSTRUMENT. AND YEARS PLAYED.',
      ringo: 'IT DOES NOT SAY SOUP. I KNOW IT SAYS SOUP.',
      opts: [
        { label: ins + ' - ELEVEN YEARS', ok: true },
        { label: 'MISO. WITH THE LITTLE CLAMS.' },
        { label: 'ANYTHING WITH STRINGS, BOSS', bad: true },
        { label: ins + ' - SINCE TUESDAY' },
      ],
    },
    {
      n: 6, seed: 37,
      wrong: 'WHERE DOES YOUR MOTHER SLEEP?',
      right: 'ADDRESS WHILE YOU ARE IN JAPAN.',
      ringo: 'LEAVE YOUR MOTHER OUT OF IT.',
      opts: [
        { label: 'CAPSULE HOTEL. POD 118.', ok: true },
        { label: 'LAS VEGAS. SHE IS FINE.' },
        { label: 'HERE, IF YOU LET ME', bad: true },
        { label: 'NOWHERE YET' },
      ],
    },
    {
      n: 8, seed: 51,
      wrong: 'WHO WILL CLAIM THE BODY?',
      right: 'EMERGENCY CONTACT. ANY NUMBER.',
      ringo: 'IT IS A FORM. IT IS NOT PERSONAL.',
      opts: [
        { label: 'MUM - AND THE AREA CODE', ok: true },
        { label: 'NOBODY. THAT IS THE POINT.' },
        { label: 'THE EMBASSY, PROBABLY' },
        { label: 'YOU, I SUPPOSE', bad: true },
      ],
    },
    {
      n: 6, seed: 67,
      wrong: 'HOW MANY MOONS UNTIL YOU ARE FREE?',
      right: 'WHICH NIGHTS CAN YOU PLAY?',
      ringo: 'THE MOON ONE IS NEW. I LIKE THE MOON ONE.',
      opts: [
        { label: 'ANY NIGHT. TONIGHT. SEVEN.', ok: true },
        { label: 'THREE MOONS' },
        { label: 'WHENEVER, MAN', bad: true },
        { label: 'NOT MONDAYS' },
      ],
    },
  ];
}
// What he says while the clock goes up, in the order he says it.
const BB_NAGS = [
  { at: 4, line: 'TAKE YOUR TIME.' },
  { at: 9, line: 'REALLY. TAKE YOUR TIME.' },
  { at: 16, line: 'THE GLASS IS CLEAN. I KNOW.' },
  { at: 24, line: 'WE OPEN AT FIVE. IT IS TWO.' },
  { at: 33, line: 'I HAVE SEEN WORSE FORMS THAN THAT.' },
  { at: 42, line: 'NOT MANY. BUT I HAVE.' },
  { at: 52, line: 'THE ONE ON THE LEFT IS NOT A WORD.' },
];

class TranslateMiniScene {
  constructor(bar) {
    this.bar = bar;
    this.t = 0; this.mins = 0; this.nag = 0;
    this.fields = bbFormFields();
    this.answers = [];
    for (let i = 0; i < this.fields.length; i++) this.answers.push(null);
    this.i = 0;
    this.phase = 'point';            // point scan wrong scan2 read pick write done
    this.scanT = 0; this.writeT = 0;
    this.sel = 0; this.rows = [];
    this.right = 0; this.bad = 0; this.pen = null;
    this.line = 'HE DOES NOT LOOK UP.';
    this.lineT = 3.4;
    this.fx = new Particles();
    this.flash = 0;
    this.outT = 0;
    this.left = false;
    this.btn = { x: 630, y: 348, w: 132, h: 28 };
    Voice.chime('shop');
  }
  // ---- the clock, and the man behind it
  say(line, secs) { this.line = line; this.lineT = secs || 3.2; }
  update(dt) {
    this.t += dt; this.fx.update(dt);
    this.lineT = Math.max(0, this.lineT - dt);
    this.flash = Math.max(0, this.flash - dt);
    if (this.phase !== 'done') {
      this.mins += dt / 0.55;
      while (this.nag < BB_NAGS.length && this.mins >= BB_NAGS[this.nag].at) {
        this.say(BB_NAGS[this.nag].line, 4);
        Voice.say(BB_NAGS[this.nag].line, 'barista', { gain: 0.8 });
        this.nag++;
      }
    }
    if (this.phase === 'scan' || this.phase === 'scan2') {
      this.scanT += dt;
      const need = this.phase === 'scan' ? 1.25 : 0.95;
      if (this.scanT >= need) {
        if (this.phase === 'scan') {
          this.phase = 'wrong'; Audio.ui('error');
          this.say(this.fields[this.i].ringo, 4);
          Voice.say(this.fields[this.i].ringo, 'barista', { gain: 0.8 });
        } else {
          this.phase = 'pick'; this.sel = 0; Audio.ui('select');
        }
        this.scanT = 0;
      }
    }
    if (this.phase === 'write') {
      this.writeT += dt;
      if (this.writeT >= 0.85) {
        this.writeT = 0;
        this.answers[this.i] = this.pen; this.pen = null;
        this.i++;
        if (this.i >= this.fields.length) { this.finish(); return; }
        this.phase = 'point';
      }
    }
    if (this.phase === 'done') {
      this.outT += dt;
      if (this.outT > 2.6) this.leave();
    }
  }
  // ---- the button, whatever it means this second
  act() {
    if (this.phase === 'point') { this.phase = 'scan'; this.scanT = 0; Audio.ui('type'); return; }
    if (this.phase === 'wrong') { this.phase = 'scan2'; this.scanT = 0; Audio.ui('type'); return; }
    if (this.phase === 'pick') { this.choose(this.sel); return; }
    if (this.phase === 'done') { this.leave(); return; }
  }
  choose(n) {
    const f = this.fields[this.i], o = f.opts[n];
    if (!o) return;
    this.pen = o.label;
    if (o.ok) { this.right++; Audio.ui('stamp'); this.say('THAT IS THE ONE.', 3); }
    else if (o.bad) {
      this.bad++; Audio.ui('pop');
      this.say('THAT IS HOW YOU TALK TO A FRIEND.', 3.4);
      Voice.say('THAT IS HOW YOU TALK TO A FRIEND', 'barista', { gain: 0.8 });
    } else { Audio.ui('tally'); this.say('WRITE IT. IT IS MY FORM.', 3); }
    this.mins += 2 + (o.ok ? 0 : 3);
    this.phase = 'write'; this.writeT = 0;
    this.fx.burst(300, 208 + this.i * 38, 6, { color: ['#2f4a8a', '#8aa0d0'], speed: 26, life: 0.5, gravity: 40, size: 1 });
  }
  finish() {
    this.phase = 'done'; this.outT = 0;
    Audio.ui('stamp'); Game.shake.hit(2, 0.2);
    Voice.chime('shop');
  }
  leave() {
    if (this.left) return; this.left = true;
    const bar = this.bar;
    bar.bbFormDone(this.right, Math.round(this.mins), this.bad);
    Game.go(function () { return bar; }, 'fade', { dur: 0.5 });
  }
  // ---- input
  key(code) {
    if (this.phase === 'pick') {
      const n = this.fields[this.i].opts.length;
      if (code === 'ArrowUp' || code === 'KeyW') { this.sel = (this.sel - 1 + n) % n; Audio.ui('move'); return; }
      if (code === 'ArrowDown' || code === 'KeyS') { this.sel = (this.sel + 1) % n; Audio.ui('move'); return; }
    }
    if (code === 'Escape') { this.say('YOU ARE FILLING IN A FORM.', 2.4); Audio.ui('error'); return; }
    if (['Enter', 'Space', 'KeyZ', 'KeyX'].includes(code)) this.act();
  }
  keyUp() {}
  pointerDown(x, y) {
    if (this.phase === 'pick') {
      for (let i = 0; i < this.rows.length; i++) {
        const r = this.rows[i];
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { this.sel = i; this.choose(i); return; }
      }
    }
    this.act();
  }
  pointerMove() {} pointerUp() {}
  click(x, y) { this.pointerDown(x, y); }
  hover() {}
  isPlaying() { return false; }

  // ---- drawing
  draw(ctx) {
    const t = this.t;
    rect(ctx, 0, 0, W, H, '#1a1118');
    this.drawBackBar(ctx, t);
    this.drawCounter(ctx, t);
    this.drawForm(ctx, t);
    this.drawPhone(ctx, t);
    this.drawJunk(ctx, t);
    this.fx.draw(ctx);
    this.drawClock(ctx, t);
    this.drawOptions(ctx, t);
    this.drawRingoLine(ctx, t);
    if (this.phase === 'done') this.drawStamp(ctx, t);
    grade(ctx, 0, 0, W, H, '#ffb45a', 0.1, 'overlay');
    vignette(ctx, 0.42, '#0a0610');
  }
  drawBackBar(ctx, t) {
    // the far side of the bar, out of focus, with him standing in it
    vgrad(ctx, 0, 0, W, 150, '#231a20', '#150f18');
    const r = makeRng(hashStr('bb-form-bottles'));
    for (let x = 20; x < W - 20; x += r.int(11, 17)) {
      const bh = r.int(22, 40), bw = r.int(7, 11);
      const c = BB_PAL.bottle[r.int(0, BB_PAL.bottle.length - 1)];
      ctx.globalAlpha = 0.42;
      rect(ctx, x, 96 - bh, bw, bh, c);
      rect(ctx, x, 96 - bh, 2, bh, lighten(c, 0.4));
      ctx.globalAlpha = 1;
    }
    rect(ctx, 0, 96, W, 5, '#3a2416');
    rect(ctx, 0, 96, W, 2, '#5a3a24');
    ctx.globalAlpha = 0.16; rect(ctx, 0, 60, W, 4, '#ffd8a0'); ctx.globalAlpha = 1;
    // Ringo, leaning on his side of it, polishing
    const rx = 690;
    drawBugAt(ctx, BB_RINGO_SPEC, rx, 148, { pose: 'idle', scale: 1.7, flip: true, bounce: 0.35, phase: 1.1 });
    bbRingoExtras(ctx, rx, 148, 1.7, t, -1, true);
  }
  drawCounter(ctx, t) {
    // the bar top, filling the bottom of the frame: this is your whole world
    // for the next forty minutes
    vgrad(ctx, 0, 101, W, H - 101, '#6a4428', '#3e2718');
    rect(ctx, 0, 101, W, 4, '#8a5c38');
    rect(ctx, 0, 105, W, 2, '#2a1a0e');
    const r = makeRng(1717);
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.14;
      rect(ctx, r.range(0, W), r.range(110, H), r.range(26, 120), 1, '#2a1a0e');
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.12;
      ellipseRingPx(ctx, 120 + i * 190, 130 + (i % 2) * 28, 17, 6, '#1a0f06');
      ctx.globalAlpha = 1;
    }
  }
  drawForm(ctx, t) {
    const x = 40, y = 150, w = 480, h = 236;
    ctx.globalAlpha = 0.4; rect(ctx, x + 5, y + 7, w, h, '#000'); ctx.globalAlpha = 1;
    rect(ctx, x, y, w, h, '#efe9d6');
    frame(ctx, x, y, w, h, '#c0b79c');
    rect(ctx, x, y, w, 2, '#fdf8ea');
    ctx.globalAlpha = 0.4; ctx.fillStyle = paperTexture(); ctx.fillRect(x + 2, y + 2, w - 4, h - 4); ctx.globalAlpha = 1;
    // the header: a red rule, a box of glyphs, and a reference number
    rect(ctx, x + 10, y + 8, w - 20, 3, '#c8402c');
    bbGlyphRun(ctx, x + 12, y + 16, 9, 9, '#241d28', 5);
    drawText(ctx, 'FORM 7-B', x + w - 12, y + 18, '#8a8478', { align: 'right', font: 'small' });
    rect(ctx, x + 10, y + 30, w - 20, 1, '#c0b79c');
    // five rows
    for (let i = 0; i < this.fields.length; i++) {
      const f = this.fields[i], ry = y + 40 + i * 38;
      const cur = i === this.i && this.phase !== 'done';
      if (cur) {
        ctx.globalAlpha = 0.22 + 0.12 * Math.sin(this.t * 5);
        rect(ctx, x + 6, ry - 4, w - 12, 34, '#ffd24a');
        ctx.globalAlpha = 1;
      }
      // the label, which is the problem
      bbGlyphRun(ctx, x + 14, ry, f.n, 10, cur ? '#241d28' : '#4a4450', f.seed);
      rect(ctx, x + 14, ry + 14, f.n * 13, 1, '#b4ab90');
      // the line you have to write on
      const lx = x + 216, lw = w - 232;
      rect(ctx, lx, ry + 18, lw, 1, '#8a8478');
      const a = this.answers[i];
      if (a) {
        drawText(ctx, a.slice(0, 30), lx + 4, ry + 8, '#2f4a8a', { font: 'small' });
        // the biro pressed too hard, the way everybody does on a form
        ctx.globalAlpha = 0.3;
        drawText(ctx, a.slice(0, 30), lx + 5, ry + 9, '#2f4a8a', { font: 'small' });
        ctx.globalAlpha = 1;
      } else if (cur && this.phase === 'write' && this.pen) {
        const k = clamp(this.writeT / 0.7, 0, 1);
        const txt = String(this.pen).slice(0, Math.floor(30 * k));
        drawText(ctx, txt, lx + 4, ry + 8, '#2f4a8a', { font: 'small' });
      }
      // the little box at the end that wants a stamp nobody has
      rect(ctx, x + w - 26, ry, 14, 16, '#f6f2e4');
      frame(ctx, x + w - 26, ry, 14, 16, '#b4ab90');
      if (a) drawText(ctx, 'X', x + w - 19, ry + 5, '#c8402c', { align: 'center', font: 'small' });
    }
    // the pen, lying across it, moving while you write
    const pk = this.phase === 'write' ? clamp(this.writeT / 0.7, 0, 1) : 0;
    const py = y + 40 + this.i * 38 + 16;
    const pxx = this.phase === 'write' ? (x + 216 + pk * 200) : (x + w - 120);
    const pyy = this.phase === 'write' ? py : (y + h - 14);
    ctx.save();
    ctx.translate(Math.round(pxx), Math.round(pyy));
    ctx.rotate(this.phase === 'write' ? -0.5 : -0.12);
    rect(ctx, 0, 0, 52, 5, '#2f4a8a');
    rect(ctx, 0, 0, 52, 2, '#5a78b8');
    rect(ctx, 52, 1, 8, 3, '#b9bec6');
    rect(ctx, -6, 1, 6, 3, '#c8402c');
    ctx.restore();
  }
  drawPhone(ctx, t) {
    const x = 600, y = 140, w = 160, h = 254;
    // propped against the sugar jar, so it leans a couple of degrees
    ctx.save();
    ctx.translate(x + w / 2, y + h);
    ctx.rotate(-0.045);
    ctx.translate(-(x + w / 2), -(y + h));
    ctx.globalAlpha = 0.4; rect(ctx, x + 5, y + 8, w, h, '#000'); ctx.globalAlpha = 1;
    rect(ctx, x, y, w, h, '#1a1620');
    rect(ctx, x, y, w, 3, '#3a3444');
    frame(ctx, x, y, w, h, '#0d0a12');
    const sx = x + 8, sy = y + 10, sw = w - 16, sh = h - 22;
    rect(ctx, sx, sy, sw, sh, '#0d1018');
    // the app's own bar
    rect(ctx, sx, sy, sw, 14, '#2f6a9a');
    drawText(ctx, 'TRANSLATE', sx + 4, sy + 4, '#e8f4ff', { font: 'small' });
    drawText(ctx, '61%', sx + sw - 4, sy + 4, '#8ad8ff', { align: 'right', font: 'small' });
    // the viewfinder, looking at the label it cannot read
    const vy = sy + 18, vh = 78;
    rect(ctx, sx + 4, vy, sw - 8, vh, '#141a24');
    frame(ctx, sx + 4, vy, sw - 8, vh, '#2f4a68');
    const f = this.fields[Math.min(this.i, this.fields.length - 1)];
    bbGlyphRun(ctx, sx + 10, vy + 24, Math.min(f.n, 8), 12, '#cfe4f4', f.seed);
    // the corner brackets, which is how you know it is looking
    for (let c = 0; c < 4; c++) {
      const cx2 = c % 2 ? sx + sw - 16 : sx + 8, cy2 = c < 2 ? vy + 4 : vy + vh - 12;
      rect(ctx, cx2, cy2, 8, 2, '#6be585');
      rect(ctx, c % 2 ? cx2 + 6 : cx2, cy2, 2, 8, '#6be585');
    }
    if (this.phase === 'scan' || this.phase === 'scan2') {
      const need = this.phase === 'scan' ? 1.25 : 0.95;
      const k = clamp(this.scanT / need, 0, 1);
      ctx.globalAlpha = 0.8;
      rect(ctx, sx + 4, vy + 3 + k * (vh - 8), sw - 8, 2, '#6be585');
      ctx.globalAlpha = 0.12;
      rect(ctx, sx + 4, vy, sw - 8, 3 + k * (vh - 8), '#6be585');
      ctx.globalAlpha = 1;
    }
    // the result, which is either wrong or not wrong enough
    const ry = vy + vh + 8, rh = 84;
    rect(ctx, sx + 4, ry, sw - 8, rh, '#f4f1ea');
    frame(ctx, sx + 4, ry, sw - 8, rh, '#8a8478');
    let msg = 'POINT IT AT THE LINE.';
    let col = '#8a8478';
    if (this.phase === 'scan' || this.phase === 'scan2') { msg = 'READING' + '.'.repeat(1 + (Math.floor(this.t * 4) % 3)); col = '#3f7a4a'; }
    else if (this.phase === 'wrong') { msg = f.wrong; col = '#c8402c'; }
    else if (this.phase === 'pick' || this.phase === 'write') { msg = f.right; col = '#241d28'; }
    else if (this.phase === 'done') { msg = 'NO MORE LINES.'; col = '#3f7a4a'; }
    const lines = wrapText(msg, 20);
    for (let i = 0; i < lines.length && i < 5; i++) drawText(ctx, lines[i], sx + 8, ry + 6 + i * 9, col, { font: 'small' });
    if (this.phase === 'wrong') drawText(ctx, 'LOW CONFIDENCE', sx + 8, ry + rh - 11, '#c8402c', { font: 'small' });
    if (this.phase === 'pick') drawText(ctx, 'BETTER', sx + 8, ry + rh - 11, '#3f7a4a', { font: 'small' });
    // the button
    const b = this.btn;
    let lab = 'TRANSLATE';
    if (this.phase === 'wrong') lab = 'AGAIN';
    else if (this.phase === 'pick') lab = 'NOW WRITE IT';
    else if (this.phase === 'write' || this.phase === 'scan' || this.phase === 'scan2') lab = 'WAIT';
    else if (this.phase === 'done') lab = 'DONE';
    const live = this.phase === 'point' || this.phase === 'wrong' || this.phase === 'done';
    rect(ctx, b.x, b.y, b.w, b.h, live ? '#2f6a9a' : '#3a3444');
    rect(ctx, b.x, b.y, b.w, 2, live ? '#5a9ad0' : '#4a4458');
    frame(ctx, b.x, b.y, b.w, b.h, '#0d1018');
    ctx.globalAlpha = live ? 0.7 + 0.3 * Math.sin(this.t * 5) : 0.5;
    drawText(ctx, lab, b.x + b.w / 2, b.y + 9, '#e8f4ff', { align: 'center', scale: 2 });
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  drawJunk(ctx, t) {
    // the sugar jar the phone is leaning on, the ashtray nobody uses any more,
    // and the glass he has been polishing since you walked in
    rect(ctx, 778, 300, 46, 60, withAlpha('#bfe0ff', 0.3));
    rect(ctx, 778, 300, 4, 60, withAlpha('#ffffff', 0.45));
    frame(ctx, 778, 300, 46, 60, '#8aa0b0');
    rect(ctx, 774, 292, 54, 9, '#b9bec6');
    rect(ctx, 774, 292, 54, 2, '#dfe4ea');
    rect(ctx, 782, 330, 38, 30, '#f2ede0');
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 20; i++) px(ctx, 784 + (i * 7) % 34, 332 + (i * 11) % 26, '#d8d0b4');
    ctx.globalAlpha = 1;
    drawText(ctx, 'SUGAR', 801, 344, '#8a8478', { align: 'center', font: 'small' });
    // the ashtray, with the old scorch on the rim
    ellipsePx(ctx, 880, 420, 34, 14, '#3a4048');
    ellipsePx(ctx, 880, 418, 28, 10, '#22262c');
    ctx.globalAlpha = 0.5; rect(ctx, 858, 410, 10, 2, '#8a7a5e'); ctx.globalAlpha = 1;
    // a coaster with the bar's ring on it
    ellipsePx(ctx, 120, 470, 40, 16, '#d8cfb4');
    ellipseRingPx(ctx, 120, 470, 34, 13, '#c8402c');
    drawText(ctx, 'THE BEATLES', 120, 466, '#c8402c', { align: 'center', font: 'small' });
  }
  drawClock(ctx, t) {
    const w = 132, x = W - w - 12, y = 10;
    rect(ctx, x, y, w, 34, 'rgba(8,6,14,0.75)');
    frame(ctx, x, y, w, 34, '#4a4358');
    const m = Math.floor(this.mins), s = Math.floor((this.mins - m) * 60);
    drawText(ctx, 'TIME TAKEN', x + 6, y + 5, '#8a82a8', { font: 'small' });
    const late = this.mins > 20;
    drawText(ctx, pad2(m) + ':' + pad2(s), x + w - 6, y + 14, late ? '#e8503a' : '#cfc9e6', { align: 'right', scale: 2 });
    // the second hand, ticking, because a number alone is not a clock
    const a = (this.mins * Math.PI * 2) % (Math.PI * 2);
    const cx = x + 18, cy = y + 22;
    ringPx(ctx, cx, cy, 8, '#6a6480');
    line(ctx, cx, cy, cx + Math.cos(a - Math.PI / 2) * 6, cy + Math.sin(a - Math.PI / 2) * 6, late ? '#e8503a' : '#8ad8ff');
  }
  drawOptions(ctx, t) {
    this.rows = [];
    if (this.phase !== 'pick') {
      // the hint strip, so the button is never a mystery
      const hint = this.phase === 'point' ? (Game.touch ? 'TAP THE PHONE' : 'Z: POINT THE PHONE AT THE LINE')
        : this.phase === 'wrong' ? (Game.touch ? 'TAP AGAIN' : 'Z: TRY IT AGAIN')
          : this.phase === 'done' ? '' : '';
      if (hint) {
        rect(ctx, 0, H - 26, W, 26, 'rgba(6,5,12,0.66)');
        drawText(ctx, hint, W / 2, H - 19, '#ffd24a', { align: 'center', scale: 2 });
      }
      return;
    }
    const f = this.fields[this.i];
    const bw = 620, bx = W / 2 - bw / 2, rowH = Game.touch ? 32 : 28;
    const by = H - 10 - f.opts.length * rowH;
    ctx.fillStyle = 'rgba(6,5,12,0.7)'; ctx.fillRect(0, by - 22, W, H - by + 22);
    drawText(ctx, 'WRITE:', bx, by - 16, '#8a82a8', { font: 'small' });
    for (let i = 0; i < f.opts.length; i++) {
      const o = f.opts[i], y = by + i * rowH, on = i === this.sel;
      this.rows.push({ x: bx, y: y, w: bw, h: rowH - 4 });
      rect(ctx, bx, y, bw, rowH - 4, on ? '#ffd24a' : '#1b1728');
      frame(ctx, bx, y, bw, rowH - 4, on ? '#fff6c8' : '#4a4068');
      if (on) rect(ctx, bx, y, 5, rowH - 4, '#c8402c');
      drawText(ctx, o.label, bx + 14, y + Math.floor((rowH - 4 - 14) / 2), on ? '#2a1a08' : '#cfc9e6', { scale: 2 });
    }
  }
  drawRingoLine(ctx, t) {
    if (this.lineT <= 0) return;
    ctx.globalAlpha = clamp(this.lineT, 0, 1);
    const w = Math.min(W - 40, textWidth(this.line, { scale: 2 }) + 60);
    const x = 20, y = 108;
    rect(ctx, x, y, w, 26, 'rgba(10,6,14,0.86)');
    frame(ctx, x, y, w, 26, '#c8a03a');
    rect(ctx, x, y, 4, 26, '#c8402c');
    drawText(ctx, 'RINGO', x + 10, y + 3, '#c8a03a', { font: 'small' });
    drawText(ctx, this.line, x + 10, y + 12, '#f4f1ea', { scale: 2 });
    ctx.globalAlpha = 1;
  }
  drawStamp(ctx, t) {
    const k = clamp(this.outT / 0.4, 0, 1);
    const s = 1 + (1 - easeOut(k)) * 2.4;
    ctx.save();
    ctx.translate(W / 2, H / 2 - 30);
    ctx.rotate(-0.16);
    ctx.scale(s, s);
    ctx.globalAlpha = clamp(this.outT * 3, 0, 1);
    rect(ctx, -96, -26, 192, 52, 'rgba(200,64,44,0.14)');
    frame(ctx, -96, -26, 192, 52, '#c8402c');
    frame(ctx, -93, -23, 186, 46, '#c8402c');
    drawText(ctx, 'ACCEPTED', 0, -14, '#c8402c', { align: 'center', scale: 3 });
    drawText(ctx, this.right + ' OF 5 IN THE RIGHT BOX', 0, 10, '#c8402c', { align: 'center', font: 'small' });
    ctx.globalAlpha = 1;
    ctx.restore();
    if (this.outT > 0.9) {
      const m = Math.round(this.mins);
      drawText(ctx, 'THAT TOOK ' + m + ' MINUTES', W / 2, H - 52, '#ffd24a', { align: 'center', scale: 2, outline: '#12101c' });
    }
  }
}

// ==========================================================================
//  THE ROOM
// ==========================================================================
function bbProp(S, act) {
  for (let i = 0; i < S.props.length; i++) if (S.props[i].act === act) return S.props[i];
  return null;
}
function bbBack(S) {
  if (S.opts && S.opts.back) return S.opts.back;
  return function () {
    if (typeof gameHub === 'function') return gameHub({ time: typeof QS_NIGHT !== 'undefined' ? QS_NIGHT : 0.8 });
    if (typeof QuietStreetScene !== 'undefined') return new QuietStreetScene({});
    return new BeatlesBarScene({});
  };
}
// The gig this room books you for, in the shape the performance scene reads.
function bbGigNode() {
  return { id: 'beatles-set', type: 'venue', venue: 'yokocho', name: 'THE BEATLES', icon: 'gig' };
}

function beatlesBarDef(o) {
  const opts = o || {};
  return {
    name: 'THE BEATLES', sub: 'SHIMOKITAZAWA - DOWN THE STAIR', tint: '#7a1a2a',
    w: BB_W, zoom: 1.25, yBias: 0.72, hud: true, canLeave: false, freeFloors: false,
    heroScale: 1.6, speed: 116, carry: 'case',
    start: { x: opts.at != null ? opts.at : 120, floor: 0 },
    floors: [{ y: BB_Y, z: 1 }],
    sky: ['#120e16', '#1c1420'],
    enterLine: 'THE DOOR AT THE TOP SHUTS. IT GETS WARMER.',

    init: function (S) {
      const r = Game.run;
      S.bb = {
        stage: 0,              // 0 not spoken to, 1 mid conversation, 2 booked, 3 paid
        pending: null,         // a script waiting for the room to be quiet
        drinks: 0,
        looked: {},
        glassT: 0,
      };
      if (r) {
        if (!r.flags) r.flags = {};
        r.pos = 'beatles';
        if (typeof setChapter === 'function') setChapter('tokyo');
        if (r.flags.beatlesPaid) S.bb.stage = 3;
        else if (r.flags.beatlesBooked) S.bb.stage = 2;
        // you came back from the set: he owes you money and an opinion
        if (r.flags.beatlesAwaitingPay) S.bb.pending = 'pay';
        if (r.beermat) { const m = bbProp(S, 'mat'); if (m) m.hidden = false; }
      }
      // the room is never empty, even when it is closed
      S.bbHaze = new Haze(5, 21);
      // dust lives in world space and is painted with the room, not with the
      // screen: S.fx draws after the camera has been popped, so anything put
      // in it has to be in screen pixels.
      S.bbDust = new Particles();
    },

    tick: function (S, dt) {
      S.bb.glassT += dt;
      if (S.bbHaze) S.bbHaze.update(dt);
      // whatever the room owes you happens the moment nobody is talking
      if (S.bb.pending && !S.dlg && S.locked <= 0) {
        const p = S.bb.pending; S.bb.pending = null;
        if (p === 'address') bbGiveAddress(S);
        else if (p === 'pay') bbPayOut(S);
      }
      // dust in the par can, which is the only reason you can see the beam
      if (S.bbDust) {
        S.bbDust.update(dt);
        if (Math.random() < dt * 5 && S.cam.visible(1450, 320)) {
          S.bbDust.add({
            x: BB_STAGE_X0 + 20 + Math.random() * (BB_STAGE_X1 - BB_STAGE_X0 - 40),
            y: BB_CEIL + 60 + Math.random() * 180,
            vx: (Math.random() - 0.5) * 5, vy: 4 + Math.random() * 6, life: 3.6,
            color: '#ffe9c0', size: 1, gravity: 0, kind: 'px',
          });
        }
      }
    },

    // ---------- painters ----------
    back: function (ctx, S, t) {
      vgrad(ctx, 0, 0, W, H, '#1a1220', '#0d0a12');
    },

    mid: function (ctx, S, t) {
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      bbCeiling(ctx, x0, x1, t);
      bbWall(ctx, x0, x1, t);
      bbFairyLights(ctx, x0, x1, t);
      // the stairwell you came down
      if (x0 < 220) bbStairwell(ctx, 70, BB_Y, t);
      // the wall of everybody who has played here
      if (x1 > 890 && x0 < 1180) bbPosterWall(ctx, 920, 186, 232, 128, t);
      if (x1 > 820 && x0 < 940) bbDartboard(ctx, 872, 252, t);
      // the back bar, behind the counter
      if (x1 > BB_BAR_X0 - 60 && x0 < BB_BAR_X1 + 60) bbBottleShelf(ctx, BB_BAR_X0 + 6, BB_BAR_X1 + 10, t);
      // the stage riser, behind everything that stands on it
      if (x1 > BB_STAGE_X0 - 80 && x0 < BB_STAGE_X1 + 80) bbStage(ctx, BB_STAGE_X0, BB_STAGE_X1, BB_Y, t);
      // the floor: boards, beer, forty years of it
      sideFloor(ctx, x0, x1, BB_Y, { h: 180, col: '#2e2028', col2: '#241a20', lip: '#4a3640', tile: 54, shine: false });
      ctx.globalAlpha = 0.1;
      for (let x = Math.floor(x0 / 54) * 54; x < x1; x += 54) rect(ctx, x, BB_Y + 3, 2, 170, '#000');
      ctx.globalAlpha = 1;
      // the light the bar throws on the floor in front of it
      lightPool(ctx, (BB_BAR_X0 + BB_BAR_X1) / 2, BB_Y + 4, 260, '#ffb45a', 0.1);
      bbBulb(ctx, (BB_STAGE_X0 + BB_STAGE_X1) / 2, t);
    },

    fore: function (ctx, S, t) {
      // the beam that runs across the front of the frame: the ceiling is low
      // and you should feel it the whole time
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      rect(ctx, x0, BB_CEIL - 40, x1 - x0, 14, '#0d0a12');
      rect(ctx, x0, BB_CEIL - 28, x1 - x0, 3, '#1c1620');
      if (S.bbDust) S.bbDust.draw(ctx);
    },

    after: function (ctx, S, t) {
      // smoke that has not been legal in here for years, hanging in the par can
      if (S.bbHaze) S.bbHaze.draw(ctx, 0, 40, W, 300, '#ffd8a0');
      grade(ctx, 0, 0, W, H, '#ffa040', 0.12, 'overlay');
      vignette(ctx, 0.46, '#08050c');
    },

    // ---------- what is in the room ----------
    // Depth in here is decided entirely by y. Anything with a y smaller than
    // the floor line sorts behind you; the bar, the stools and the back wall
    // all live there, so the aisle you walk down is always in front.
    props: [
      { kind: 'bb_door', x: 70, y: BB_Y, w: 120, h: 150, label: 'UP TO THE STREET', act: 'leave', reach: 54 },
      { kind: 'bb_cases', x: 210, y: BB_Y, w: 84, h: 88, label: 'LOOK', act: 'cases', reach: 40 },
      { kind: 'bb_board', x: 214, y: 216, w: 132, h: 96, label: 'READ THE BOARD', act: 'board', reach: 56 },
      { kind: 'bb_counter', x: (BB_BAR_X0 + BB_BAR_X1) / 2, y: BB_BAR_BASE, w: BB_BAR_X1 - BB_BAR_X0, h: 58 },
      { kind: 'bb_stool', x: 312, y: BB_BAR_BASE, w: 28, h: 34, n: 0 },
      { kind: 'bb_stool', x: 372, y: BB_BAR_BASE, w: 28, h: 34, n: 1 },
      { kind: 'bb_stool', x: 432, y: BB_BAR_BASE, w: 28, h: 34, n: 2 },
      { kind: 'bb_stool', x: 492, y: BB_BAR_BASE, w: 28, h: 34, n: 3 },
      { kind: 'bb_stool', x: 552, y: BB_BAR_BASE, w: 28, h: 34, n: 4 },
      { kind: 'bb_stool', x: 612, y: BB_BAR_BASE, w: 28, h: 34, n: 5 },
      { kind: 'bb_stool', x: 672, y: BB_BAR_BASE, w: 28, h: 34, n: 6 },
      { kind: 'bb_stool', x: 732, y: BB_BAR_BASE, w: 28, h: 34, n: 7 },
      { kind: 'bb_drinks', x: 400, y: BB_BAR_TOP, w: 90, h: 40, label: 'BUY A DRINK', act: 'drink', reach: 44 },
      { kind: 'bb_mat', x: 500, y: BB_BAR_TOP, w: 40, h: 40, label: 'THE BEER MAT', act: 'mat', reach: 30, hidden: true },
      { kind: 'bb_jar', x: 640, y: BB_BAR_TOP, w: 30, h: 42, label: 'THE TIP JAR', act: 'jar', reach: 32 },
      { kind: 'bb_till', x: 762, y: BB_BAR_TOP, w: 58, h: 48 },
      { kind: 'bb_posters', x: 1036, y: 316, w: 232, h: 130, label: 'READ THE WALL', act: 'posters', reach: 90 },
      { kind: 'bb_crossing', x: 1206, y: 320, w: 74, h: 96, label: 'LOOK', act: 'crossing', reach: 44 },
      { kind: 'bb_par', x: 1292, y: BB_STAGE_Y, w: 26, h: 84, aim: 1 },
      { kind: 'bb_amp', x: 1330, y: BB_STAGE_Y, w: 64, h: 48 },
      { kind: 'bb_mic', x: 1400, y: BB_STAGE_Y, w: 30, h: 96, label: 'PLAY THE SET', act: 'play', reach: 52 },
      { kind: 'bb_kit', x: 1476, y: BB_STAGE_Y, w: 130, h: 56 },
      { kind: 'bb_par', x: 1602, y: BB_STAGE_Y, w: 26, h: 84, aim: -1 },
      // the piano never made it onto the riser. It is on the floor, against
      // the wall, where two people have to move it to get a bass rig past.
      { kind: 'bb_piano', x: 1706, y: BB_Y, w: 100, h: 70, label: 'THE PIANO', act: 'piano', reach: 50 },
      { kind: 'fireext', x: 1790, y: BB_Y, w: 14, h: 34 },
      { kind: 'bb_fire', x: 1846, y: BB_Y, w: 70, h: 120, label: 'THE FIRE DOOR', act: 'fire', reach: 44 },
      { kind: 'bin', x: 268, y: BB_Y, w: 24, h: 34 },
    ],

    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'bb_door': return true;                       // drawn with the stairwell
        case 'bb_cases': bbFlightCases(ctx, p.x, base, t); return true;
        case 'bb_board': bbChalkboard(ctx, p.x - p.w / 2, p.y, p.w, p.h, t); return true;
        case 'bb_counter': bbCounter(ctx, BB_BAR_X0, BB_BAR_X1, base, t); return true;
        case 'bb_stool': bbStool(ctx, p.x, base, p.n || 0); return true;
        case 'bb_drinks': {
          // the menu card standing on the bar, and the two taps behind it
          rect(ctx, p.x - 30, base - 26, 60, 26, '#e8e2cc');
          frame(ctx, p.x - 30, base - 26, 60, 26, '#b4ab90');
          drawText(ctx, 'DRINKS', p.x, base - 23, '#c8402c', { align: 'center', font: 'small' });
          for (let i = 0; i < 3; i++) rect(ctx, p.x - 25, base - 14 + i * 5, 50 - i * 8, 2, '#8a8478');
          rect(ctx, p.x + 36, base - 34, 6, 34, '#c8a03a');
          rect(ctx, p.x + 36, base - 34, 2, 34, '#ffd24a');
          rect(ctx, p.x + 33, base - 36, 12, 4, '#8a6a22');
          return true;
        }
        case 'bb_jar': bbTipJar(ctx, p.x, base, t, (Game.run && Game.run.flags && Game.run.flags.beatlesTips) || 2); return true;
        case 'bb_till': bbTill(ctx, p.x, base, t, S.bb && S.bb.stage >= 3); return true;
        case 'bb_mat': beatlesBeerMat(ctx, p.x, base - 20, 0.38, t, Game.run && Game.run.beermat); return true;
        case 'bb_posters': return true;                    // painted with the wall
        case 'bb_crossing': bbCrossingPoster(ctx, p.x - p.w / 2, p.y - p.h, p.w, p.h, t); return true;
        case 'bb_par': bbParCan(ctx, p.x, base, t, p.aim > 0 ? '#ffd8a0' : '#ff9a6a', true, p.aim); return true;
        case 'bb_amp': bbBackline(ctx, p.x, base, t); return true;
        case 'bb_kit': bbKit(ctx, p.x, base, t); return true;
        case 'bb_piano': bbPiano(ctx, p.x, base, t); return true;
        case 'bb_mic': {
          // the mic stand, and the X of tape on the floor under it
          ctx.globalAlpha = 0.5;
          rect(ctx, p.x - 10, base - 3, 20, 2, '#d8d0b0');
          rect(ctx, p.x - 1, base - 11, 2, 18, '#d8d0b0');
          ctx.globalAlpha = 1;
          rect(ctx, p.x - 9, base - 3, 18, 3, '#2a2430');
          rect(ctx, p.x - 2, base - 88, 4, 86, '#3a3440');
          rect(ctx, p.x - 2, base - 88, 1, 86, '#4e4658');
          rect(ctx, p.x - 3, base - 92, 12, 4, '#2a2430');
          ellipsePx(ctx, p.x + 9, base - 92, 5, 6, '#4a4452');
          ellipsePx(ctx, p.x + 9, base - 93, 4, 5, '#8a8f98');
          // the lead, dropping off the front of the stage
          for (let k = 0; k < 2; k++) {
            line(ctx, p.x + 9 + k, base - 86, p.x + 2 + k, base - 40, '#141018');
            line(ctx, p.x + 2 + k, base - 40, p.x - 18 + k, base - 2, '#141018');
          }
          return true;
        }
        case 'bb_fire': bbFireDoor(ctx, p.x, base, t); return true;
      }
      return false;
    },

    // ---------- who is in
    npcs: [
      {
        name: 'RINGO', x: 560, floor: 0, y: BB_Y - 34, scale: 1.55,
        spec: BB_RINGO_SPEC, voice: 'barista', act: 'ringo', pose: 'idle',
      },
      {
        name: 'THE REGULAR', x: 700, floor: 0, y: BB_Y - 1, scale: 1.4,
        voice: 'oldman', pose: 'sad',
        tag: [
          'MMM.',
          'HE TELLS EVERYBODY THE SAME THING.',
          'THE FORM. THE SEVEN O CLOCK. THE STATION EXIT.',
          'HE IS RIGHT ABOUT THE EXIT.',
        ],
      },
    ],

    // ---------- the button
    use: function (S, p) {
      const r = Game.run;
      switch (p.act) {
        case 'ringo': bbTalkToRingo(S); return;
        case 'leave': {
          if (S.bb.stage === 0) {
            S.run([
              { who: '', voice: false, at: 'you', think: true, text: 'YOU CAME DOWN A STAIR TO GET HERE.' },
              { who: '', voice: false, at: 'you', think: true, text: 'GOING BACK UP IT NOW WOULD BE A CHOICE.' },
            ]);
            return;
          }
          S.run([
            S.bb.stage >= 3
              ? { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'MIND THE FOURTH STAIR. EVERYBODY DOES NOT.' }
              : { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'SEVEN. NOT TEN PAST.' },
          ], function () { S.leave(bbBack(S), 'fade', { dur: 0.7 }); });
          return;
        }
        case 'board': {
          S.run([
            { who: '', voice: false, at: { x: 232, y: 230 }, think: true, text: 'FRI - THE WET SOCKS.' },
            { who: '', voice: false, at: { x: 232, y: 230 }, think: true, text: 'SAT - MOTHBALL SUPERSTAR.' },
            { who: '', voice: false, at: { x: 232, y: 230 }, think: true, text: 'SUN - CANNED COFFEE FUNERAL.' },
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'TONIGHT IS BLANK. TONIGHT SAYS NO NAME YET.' },
          ]);
          return;
        }
        case 'cases': {
          S.say('YOU', 'SOMEBODY ELSE LOADED OUT AND LEFT THE HEAVY ONE.', 'you');
          return;
        }
        case 'posters': {
          if (!S.bb.looked.posters) {
            S.bb.looked.posters = true;
            if (r) { r.gratitude = (r.gratitude || 0) + 1; r.save(); }
            S.run([
              { who: '', voice: false, at: { x: 1036, y: 240 }, think: true, text: 'EVERY BAND THAT EVER PLAYED HERE IS ON THIS WALL.' },
              { who: '', voice: false, at: { x: 1036, y: 240 }, think: true, text: 'SET LISTS. PHOTOGRAPHS. ONE SIGNED NAPKIN.' },
              { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'MOST OF THEM ONLY PLAYED HERE ONCE.' },
              { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'ONCE IS STILL ONCE.' },
            ], function () { S.flash('GRATITUDE +1.'); });
            return;
          }
          S.say('YOU', 'THE NAPKIN IS FROM 1981. IT IS STILL A NAPKIN.', 'you');
          return;
        }
        case 'crossing': {
          S.run([
            { who: '', voice: false, at: { x: 1206, y: 250 }, think: true, text: 'FOUR BUGS ON A CROSSING. NOT IN STEP.' },
            { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'ONE OF THEM HAS NO SHOES.' },
            { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NOBODY HAS EVER ASKED ME WHY.' },
          ]);
          return;
        }
        case 'jar': {
          S.say('YOU', 'TWO COINS AND A NOTE FOLDED INTO A BIRD.', 'you');
          return;
        }
        case 'mat': {
          S.bbShowMat = 4.5;
          Audio.ui('select');
          S.say('YOU', 'HIS HANDWRITING IS BETTER THAN THE FORM DESERVED.', 'you');
          return;
        }
        case 'drink': bbBuyDrink(S); return;
        case 'piano': {
          // three notes, because you cannot walk past a piano and not
          const now = Audio.now ? Audio.now() : 0;
          const seq = [60, 64, 67, 71];
          for (let i = 0; i < seq.length; i++) Audio.note('piano', seq[i], now + 0.02 + i * 0.16, 0.5, 0.3);
          S.run([
            { who: '', voice: false, at: { x: 1706, y: 330 }, think: true, text: 'IT IS A SEMITONE FLAT AND IT HAS BEEN FOR YEARS.' },
            { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THE TUNER COMES IN MARCH.' },
            { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'HE HAS COME IN MARCH SINCE 2004.' },
          ]);
          return;
        }
        case 'fire': {
          S.say('YOU', 'PUSH BAR TO OPEN. IT COMES OUT IN THE ALLEY.', 'you');
          return;
        }
        case 'play': bbPlayTheSet(S); return;
      }
    },
  };
}

// ---------- the conversation ----------
// He is closed. He says it without looking up, which is the whole character.
function bbTalkToRingo(S) {
  const r = Game.run;
  const me = (r && r.members && r.members[0]) || null;
  const ins = (me && typeof INSTRUMENTS !== 'undefined' && INSTRUMENTS[me.instrument])
    ? String(INSTRUMENTS[me.instrument].name).toUpperCase() : 'GUITAR';

  if (S.bb.stage >= 3) {
    S.run([
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'SAME TIME NEXT WEEK IF YOU WANT IT.' },
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'BRING THE FORM. I WILL LOSE IT AGAIN.' },
    ]);
    return;
  }
  if (S.bb.stage === 2) {
    S.run([
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'SEVEN. THREE SONGS. FORTY MINUTES.' },
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THE STAGE IS THERE. IT IS NOT FAR.' },
    ]);
    return;
  }

  const script = [
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'WE ARE CLOSED.' },
    { who: '', voice: false, at: 'RINGO', think: true, text: 'HE DOES NOT LOOK UP. THE GLASS GOES ROUND.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'FIVE. WE OPEN AT FIVE.' },
    { who: '', voice: false, at: 'you', think: true, text: 'THEN HE SEES THE CASE.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'AH.' },
    {
      id: 'who', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'YOU ARE THE ONE WHO SENT THE MESSAGE.',
      choices: [
        { label: 'I AM THE SEVEN O CLOCK.', next: 'play' },
        { label: 'I SENT IT AT FOUR IN THE MORNING.', next: 'four' },
        { label: 'SORRY. WRONG DOOR.', next: 'wrong' },
      ],
    },
    { id: 'four', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'I READ IT AT FOUR IN THE MORNING.', next: 'play' },
    { id: 'wrong', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THERE IS ONE DOOR. IT IS THIS ONE.', next: 'play' },
    {
      id: 'play', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'WHAT DO YOU PLAY.',
      choices: [
        { label: ins + '.', next: 'tokyo' },
        { label: ins + '. BADLY, BEFORE COFFEE.', next: 'coffee' },
        { label: 'WHATEVER THE ROOM WANTS.', next: 'room' },
      ],
    },
    { id: 'coffee', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'EVERYBODY PLAYS BADLY BEFORE COFFEE.', next: 'tokyo' },
    { id: 'room', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THE ROOM WANTS THREE SONGS AND NO SPEECHES.', next: 'tokyo' },
    {
      id: 'tokyo', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'HAVE YOU PLAYED IN TOKYO BEFORE.',
      choices: [
        { label: 'NO.', note: 'TRUE', next: 'no' },
        { label: 'ONCE. IT WENT BADLY.', note: 'ALSO TRUE', next: 'once' },
        { label: 'ALL THE TIME.', note: 'NOT TRUE', next: 'lie' },
      ],
    },
    { id: 'no', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'GOOD. THEN YOU WILL BE NERVOUS AND THAT SHOWS.', next: 'form' },
    { id: 'once', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THEN YOU KNOW WHERE THE PLUG SOCKET IS.', next: 'form' },
    { id: 'lie', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NO YOU HAVE NOT. THAT IS FINE.', next: 'form' },
    { who: '', voice: false, at: 'RINGO', think: true, text: 'HE PUTS A PIECE OF PAPER ON THE BAR.' },
    { id: 'form', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THEN YOU FILL IN THE FORM.' },
    { who: '', voice: false, at: 'you', think: true, text: 'THE FORM IS ENTIRELY IN A LANGUAGE YOU CANNOT READ.' },
    {
      id: 'ask', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'CAN YOU READ IT.',
      choices: [
        { label: 'I CAN TRY.', next: 'try' },
        { label: 'NOT ONE WORD OF IT.', next: 'nope' },
        { label: 'COULD YOU FILL IT IN?', next: 'no-chance' },
      ],
    },
    { id: 'no-chance', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'IT IS YOUR FORM. I ONLY OWN THE BAR.', next: 'phone' },
    { id: 'nope', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NOBODY CAN. THE MAN WHO WROTE IT IS DEAD.', next: 'phone' },
    { id: 'try', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NO YOU CANNOT. USE THE PHONE.', next: 'phone' },
    { id: 'phone', who: '', voice: false, at: 'you', think: true, text: 'HE PROPS HIS PHONE AGAINST THE SUGAR JAR.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'TAKE YOUR TIME. I AM NOT GOING ANYWHERE.' },
  ];
  S.bb.stage = 1;
  S.run(script, function () {
    S.locked = 0.2;
    Game.go(function () { return new TranslateMiniScene(S); }, 'fade', { dur: 0.6 });
  });
}

// He writes the address on a beer mat, because that is what is on the bar.
function bbGiveAddress(S) {
  const r = Game.run;
  const F = S.bb.form || { right: 5, mins: 12, fee: 38, good: true };
  const lines = [
    'SHIMOKITAZAWA 2-14-8',
    'SOUTH EXIT. NOT WEST.',
    'LEFT SIDE OF THE ROAD.',
    'GREY DOOR. NO SIGN. DOWN.',
  ];
  const mat = {
    venue: 'THE BEATLES', lines: lines, time: '19:00', fee: F.fee,
    note: 'HE WROTE IT WITH THE BAR PEN.',
  };
  const WORDS = ['NONE', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
  const got = WORDS[clamp(F.right | 0, 0, 5)];
  const head = F.good
    ? [
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: got + ' OUT OF FIVE. THAT IS A RECORD.' },
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THE LAST ONE PUT A HORSE ON IT.' },
    ]
    : [
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THAT IS THE WORST ONE I HAVE HAD.' },
      { who: '', voice: false, at: 'RINGO', think: true, text: 'HE IS SMILING. HE HAS BEEN SMILING FOR A WHILE.' },
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'I AM STILL GIVING YOU THE NIGHT.' },
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'IT PAYS LESS. THAT IS THE FORM, NOT ME.' },
    ];
  const tail = [
    { who: '', voice: false, at: 'RINGO', think: true, text: 'HE TAKES A BEER MAT OFF THE STACK AND WRITES ON IT.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'SHIMOKITAZAWA STATION. SOUTH EXIT.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NOT WEST. WEST IS A DIFFERENT TOWN.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'LEFT SIDE OF THE ROAD. GREY DOOR.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NO SIGN. THAT IS HOW YOU KNOW.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'SEVEN. THREE SONGS. ' + fmtMoney(F.fee) + ' A SET.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'THANK YOU.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THANK ME AFTER. THE STAGE IS THERE.' },
  ];
  S.run(head.concat(tail), function () {
    const m = bbProp(S, 'mat'); if (m) m.hidden = false;
    S.bb.stage = 2;
    S.bbShowMat = 5.5;
    Audio.ui('fanfare');
    S.fx.burst(S.cam.sx(500), S.cam.sy(BB_Y - 50), 12, { color: ['#ffd24a', '#f4f1ea'], speed: 44, up: 30, life: 0.8 });
    if (r) {
      if (!r.flags) r.flags = {};
      r.beermat = mat;
      r.flags.beatlesBooked = true;
      r.flags.beatlesFee = F.fee;
      // the shape the performance scene already reads, plus what this room
      // needs to know when you come back through the door
      r.pendingGig = {
        battle: false, venue: 'yokocho', from: 'beatles',
        fee: F.fee, songs: 3,
        note: 'THE BEATLES - THREE SONGS, FORTY MINUTES, ' + fmtMoney(F.fee) + '.',
      };
      r.save();
    }
    S.flash('THE ADDRESS IS ON A BEER MAT IN YOUR POCKET.');
  });
}

// ---------- the set ----------
function bbPlayTheSet(S) {
  const r = Game.run;
  if (!r) return;
  if (S.bb.stage < 2) {
    S.run([
      { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'THE STAGE IS SIX INCHES OFF THE FLOOR.' },
      { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'NOT YET. FORM FIRST.' },
    ]);
    return;
  }
  if (S.bb.stage >= 3) {
    S.say('RINGO', 'YOU PLAYED. GO HOME. COME BACK.', 'barista');
    return;
  }
  S.bbGo = false;
  S.run([
    { who: '', voice: false, at: 'you', think: true, text: 'SIX INCHES OFF THE FLOOR AND IT STILL FEELS LIKE A STAGE.' },
    {
      who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'READY.',
      choices: [
        { label: 'READY.', next: 'go' },
        { label: 'ONE MINUTE.', next: 'wait' },
      ],
    },
    { id: 'wait', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'TAKE YOUR TIME. I AM NOT GOING ANYWHERE.', next: 'end' },
    { id: 'go', who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THEN PLAY. I WILL BE POLISHING.', do: function () { S.bbGo = true; } },
    { id: 'end' },
  ], function () {
    if (!S.bbGo) return;
    if (!r.flags) r.flags = {};
    if (!r.stats) r.stats = { earned: 0, gigs: 0, bestCombo: 0, perfects: 0, bestPayout: 0 };
    r.flags.beatlesAwaitingPay = true;
    r.flags.beatlesBefore = {
      earned: (r.stats && r.stats.earned) || 0,
      perfects: (r.stats && r.stats.perfects) || 0,
      combo: (r.stats && r.stats.bestCombo) || 0,
      gigs: (r.stats && r.stats.gigs) || 0,
    };
    r.save();
    Audio.ui('levelup');
    S.leave(function () {
      if (typeof GigScene !== 'undefined') return new GigScene(bbGigNode());
      return new BeatlesBarScene({});
    }, 'curtain', { label: 'THE BEATLES' });
  });
}

// ---------- afterwards ----------
// He pays out of the till and then says the one true thing about the set, which
// is the part you will remember and not the money.
function bbPayOut(S) {
  const r = Game.run;
  if (!r) return;
  if (!r.flags) r.flags = {};
  if (!r.stats) r.stats = { earned: 0, gigs: 0, bestCombo: 0, perfects: 0, bestPayout: 0 };
  if (!r.today) r.today = { earned: 0, gigs: 0, bestCombo: 0, perfects: 0, tiles: 0, recruited: 0, upgrades: 0 };
  const before = r.flags.beatlesBefore || { perfects: 0, combo: 0, gigs: 0 };
  const stats = r.stats;
  const dPerf = Math.max(0, (stats.perfects || 0) - (before.perfects || 0));
  const dCombo = Math.max(0, (stats.bestCombo || 0) - (before.combo || 0));
  const fee = (r.flags && r.flags.beatlesFee) || 38;
  // what he says depends on what actually happened up there
  let truth;
  if (dPerf > 60) truth = 'YOU STOPPED WATCHING YOUR HANDS IN THE SECOND ONE.';
  else if (dCombo > 40) truth = 'THE MIDDLE ONE. YOU HELD THAT ONE TOGETHER.';
  else if (dPerf > 20) truth = 'THE THIRD SONG WAS THE ONE YOU MEANT.';
  else truth = 'YOU PLAYED THE FIRST ONE AT THE FLOOR. NOT AT US.';
  S.run([
    { who: '', voice: false, at: 'RINGO', think: true, text: 'THE TILL DOES NOT SHUT FIRST TIME. IT NEVER DOES.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: fmtMoney(fee) + '. COUNT IT. EVERYBODY SHOULD.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: truth },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THAT IS NOT A CRITICISM. IT IS A THING THAT HAPPENED.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'CAN I COME BACK.' },
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'THE DOOR IS GREY. IT DOES NOT MOVE.' },
  ], function () {
    r.money += fee;
    r.stats.earned = (r.stats.earned || 0) + fee;
    r.today.earned = (r.today.earned || 0) + fee;
    r.fame = (r.fame || 0) + 1;
    r.flags.beatlesAwaitingPay = false;
    r.flags.beatlesPaid = true;
    r.save();
    S.bb.stage = 3;
    Audio.ui('cash');
    S.fx.burst(S.cam.sx(762), S.cam.sy(BB_BAR_TOP - 10), 16, { color: ['#ffd24a', '#6be585', '#f4f1ea'], speed: 70, up: 40, life: 0.9, kind: 'star', size: 2 });
    S.flash('PAID ' + fmtMoney(fee) + ' AT THE BAR.');
  });
}

// ---------- the drinks, which are real and cheap ----------
function bbBuyDrink(S) {
  const r = Game.run;
  if (!r) return;
  const choices = [];
  for (let i = 0; i < BB_DRINKS.length; i++) {
    const d = BB_DRINKS[i];
    choices.push({
      label: d.name, note: fmtMoney(d.cost),
      go: (function (drink) {
        return function () {
          if (r.money < drink.cost) { Audio.ui('error'); S.flash('NOT EVEN ' + fmtMoney(drink.cost) + '.'); return; }
          r.money -= drink.cost;
          r.stamina = clamp((r.stamina || 0) + drink.stam, 0, r.staminaMax || 240);
          if (!r.flags) r.flags = {};
          r.flags.beatlesTips = ((r.flags.beatlesTips || 2) + 1);
          r.save();
          Audio.ui('coin');
          S.bb.drinks++;
          S.fx.burst(S.cam.sx(S.body.x), S.cam.sy(BB_BAR_TOP - 8), 8, { color: ['#ffd24a', '#f4f1ea'], speed: 32, up: 24, life: 0.6 });
          S.flash(drink.line + '  -' + fmtMoney(drink.cost));
        };
      })(d),
    });
  }
  choices.push({ label: 'NOTHING, THANKS', note: '' });
  S.run([
    { who: 'RINGO', voice: 'barista', at: 'RINGO', text: 'DRINK.' },
    {
      who: '', voice: false, at: 'RINGO', think: true,
      text: 'THE LIST HAS FOUR THINGS ON IT AND NONE OF THEM IS EXPENSIVE.',
      choices: choices,
    },
  ]);
}

// ==========================================================================
//  THE SCENE
// ==========================================================================
class BeatlesBarScene extends SideScene {
  constructor(opts) {
    const o = opts || {};
    super(beatlesBarDef(o), o);
    this.bbOpts = o;
    this.bbShowMat = 0;
  }
  // Ringo gets his moustache, his towel and his sticks painted on top of the
  // shared sprite, and the glass never stops going round.
  drawNpc(ctx, n) {
    super.drawNpc(ctx, n);
    if (n.name !== 'RINGO') return;
    const y = n.y != null ? n.y : this.floorY(n.floor), z = this.floorZ(n.floor);
    bbRingoExtras(ctx, n._x, y, n.scale * z, this.t, -1, true);
  }
  update(dt) {
    super.update(dt);
    if (this.bbShowMat > 0) this.bbShowMat = Math.max(0, this.bbShowMat - dt);
  }
  findPrompt() {
    const hid = [];
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (!p.hidden) continue;
      hid.push({ p: p, label: p.label, act: p.act });
      p.label = null; p.act = null;
    }
    const out = super.findPrompt();
    for (let i = 0; i < hid.length; i++) { hid[i].p.label = hid[i].label; hid[i].p.act = hid[i].act; }
    return out;
  }
  draw(ctx) {
    super.draw(ctx);
    // the mat, held up where you can actually read it
    if (this.bbShowMat > 0) {
      const k = clamp(this.bbShowMat, 0, 1);
      ctx.globalAlpha = k * 0.6;
      rect(ctx, 0, 0, W, H, '#07050c');
      ctx.globalAlpha = k;
      beatlesBeerMat(ctx, W / 2, H / 2 - 10, 2.1, this.t, Game.run && Game.run.beermat);
      drawText(ctx, Game.touch ? 'TAP TO PUT IT AWAY' : 'THE ADDRESS, IN BIRO', W / 2, H - 44, '#ffd24a', { align: 'center', scale: 2, outline: '#12101c' });
      ctx.globalAlpha = 1;
    }
  }
  // Coming back off the form. Getting it right earns the gig; getting it
  // comically wrong earns the gig as well, because he decided about you the
  // moment he saw the case. It is only the number on the mat that changes.
  bbFormDone(right, mins, bad) {
    const r = Game.run;
    const good = right >= 4;
    const fee = good ? 38 : 26;
    this.bb.form = { right: right, mins: mins, bad: bad, fee: fee, good: good };
    if (r) {
      if (!r.flags) r.flags = {};
      r.flags.beatlesForm = { right: right, mins: mins, fee: fee };
      r.save();
    }
    this.bb.pending = 'address';
  }
  key(code) {
    if (this.bbShowMat > 0 && !this.dlg) { this.bbShowMat = 0; Audio.ui('back'); return; }
    super.key(code);
  }
  pointerDown(x, y, id) {
    if (this.bbShowMat > 0 && !this.dlg) { this.bbShowMat = 0; Audio.ui('back'); return; }
    super.pointerDown(x, y, id);
  }
}
