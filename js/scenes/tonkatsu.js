// ---------- Six seats, one fryer, and an old spider ----------
// A tonkatsu counter down a side street: a plank of hinoki worn pale in the
// middle where thirty-one years of elbows have been, six stools, and a spider
// behind it who cooks with all eight legs at once because he has never once
// thought of it as a trick. The room is tiny on purpose. The camera sits close
// so you can see the oil move.
//
// It is also where the game asks you the only question it is not going to
// answer: where does the pork come from. He does not know. He has never known.
// Play it warm. The joke is not on him.
'use strict';

// ---------- the room, in numbers ----------
// Everything is authored in world pixels at zoom 1.3, so the whole place is
// about 738px wide on screen and a bug fills a decent slice of it.
const TON_W = 1100;
const TON_Y = 412;          // the aisle floor line - where you stand
const TON_SEATY = TON_Y - 27;  // the top of a stool, where you sit
const TON_CT = 344;         // the far edge of the counter: its working surface
const TON_CBOT = 400;       // the near edge of the counter apron
const TON_CHEF = 330;       // the duckboard behind the counter, where he stands
const TON_BACK = 316;       // the back bench line, where the machines live
const TON_CX0 = 196, TON_CX1 = 824;   // the run of the counter
const TON_SEATS = [258, 348, 438, 528, 618, 708];
const TON_SEAT = 438;       // the third stool, the one with the worn spot
const TON_DOOR = 80;
const TON_TILL = 780;

const TON_PAL = {
  wood: '#c2a06a', woodHi: '#e0c48e', woodLo: '#8a6e42', woodWorn: '#e8d6ae',
  wall: '#d8c9a6', wallLo: '#b8a684', wallTop: '#efe4c6',
  steel: '#a8aeb8', steelHi: '#d4dae2', steelLo: '#6a7078',
  oil: '#d8a13a', oilHi: '#ffd97a', oilLo: '#8a5f12',
  coat: '#f2eee2', coatHi: '#ffffff', coatLo: '#c4bdac',
  spider: '#6f5744', spiderHi: '#907254', spiderLo: '#3e3025',
  cream: '#f4f1ea', ink: '#241d28', gold: '#ffd24a', red: '#c8402c',
  green: '#6be585', cab: '#dfeacb', cabLo: '#9fc088',
  tea: '#8fa84a', night: '#1b2a3e',
};

// The four things on the board, and what each one does to you. The prices are
// cheap because the place is cheap, which is the point of the place.
const TON_DISHES = [
  { id: 'rosu', name: 'ROSU KATSU', note: 'LOIN. THE FAT EDGE.', price: 9, bites: 6, st: 26,
    blurb: 'THE FAT EDGE IS THE BEST PART AND EVERYBODY KNOWS IT.', col: '#d9a05a' },
  { id: 'hire', name: 'HIRE KATSU', note: 'FILLET. LEAN.', price: 11, bites: 5, st: 22,
    blurb: 'LEAN, PALE, AND SO SOFT IT ARGUES WITH THE CRUST.', col: '#e0b077' },
  { id: 'curry', name: 'KATSU CURRY', note: 'ON RICE. BROWN.', price: 10, bites: 7, st: 30,
    blurb: 'BROWN, AND THAT IS ALL THE DESCRIPTION IT NEEDS.', col: '#a86a2a' },
  { id: 'set', name: 'THE SET WITH OYSTERS', note: 'FIVE OF THEM. WINTER ONLY.', price: 13, bites: 7, st: 32,
    blurb: 'FIVE FRIED OYSTERS. HE COUNTS THEM IN TWICE.', col: '#c79a63' },
];

// The cook, in stages, each one its own length and its own noise. It runs a
// bit over half a minute, which is long enough to feel like waiting and short
// enough that nobody puts the controller down.
const TON_COOK = [
  { k: 'flour', secs: 3.0, at: 'board', line: 'FLOUR' },
  { k: 'egg', secs: 2.8, at: 'board', line: 'EGG' },
  { k: 'panko', secs: 3.4, at: 'board', line: 'PANKO' },
  { k: 'in', secs: 1.4, at: 'fryer', line: 'INTO THE OIL' },
  { k: 'fry', secs: 9.5, at: 'fryer', line: 'FRYING' },
  { k: 'out', secs: 2.0, at: 'fryer', line: 'OUT' },
  { k: 'drain', secs: 4.0, at: 'rack', line: 'DRAINING' },
  { k: 'slice', secs: 4.4, at: 'board', line: 'SLICING' },
  { k: 'plate', secs: 2.6, at: 'board', line: 'ON THE PLATE' },
  { k: 'serve', secs: 1.8, at: 'seat', line: 'HERE IT COMES' },
];
// where he stands for each of those
const TON_STATION = { board: 466, fryer: 296, rack: 382, seat: TON_SEAT, till: TON_TILL, idle: 470 };

// ---------- small sounds ----------
// None of these are samples. A fryer is filtered noise, a knife is filtered
// noise with a click on it, and humming is a man who cannot hold a tune.
function tonSizzle(v) {
  if (!Audio.ctx || Audio.muted) return;
  Audio._noise(Audio.ctx.currentTime, 0.14, 'highpass', 4200 + Math.random() * 2200, 0.7, 0.028 * (v || 1));
}
function tonChop() {
  if (!Audio.ctx || Audio.muted) return;
  const t = Audio.ctx.currentTime;
  Audio._noise(t, 0.035, 'bandpass', 2600, 3.2, 0.11);
  Audio._noise(t + 0.02, 0.09, 'lowpass', 700, 1.0, 0.05);
}
function tonThud(v) {
  if (!Audio.ctx || Audio.muted) return;
  const t = Audio.ctx.currentTime;
  Audio._noise(t, 0.09, 'lowpass', 420, 1.1, 0.16 * (v || 1));
  Audio._noise(t, 0.03, 'bandpass', 1400, 2.2, 0.07 * (v || 1));
}
function tonPour() {
  if (!Audio.ctx || Audio.muted) return;
  Audio._noise(Audio.ctx.currentTime, 0.55, 'bandpass', 1500, 1.6, 0.045);
}
// He hums the same four notes he has hummed since before you were born, and
// he is flat on the third one every single time.
const TON_HUM = [62, 65, 67, 65, 62, 60, 62];
function tonHum(i, vel) {
  if (!Audio.ctx || Audio.muted) return;
  const n = TON_HUM[((i % TON_HUM.length) + TON_HUM.length) % TON_HUM.length];
  Audio.note('shakuhachi', n + (i % 4 === 2 ? -0.6 : 0), 0, 0.42, (vel || 0.16));
}

// ==========================================================================
//  THE SPIDER
// ==========================================================================
// He is not a bug sprite. Every other body in this game comes out of the bug
// factory, and he does not, because the whole point of him is the eight legs
// doing eight jobs, and the factory only knows about two.

// A thick pixel segment with a lit top and a shadowed bottom, which is the
// minimum this game accepts for anything.
function tonLimb(ctx, x0, y0, x1, y1, w, col, hi, lo) {
  const d = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0)));
  for (let i = 0; i <= d; i++) {
    const k = i / d, cx = lerp(x0, x1, k), cy = lerp(y0, y1, k);
    rect(ctx, cx - w / 2, cy - w / 2 + 1, w, w, lo);
  }
  for (let i = 0; i <= d; i++) {
    const k = i / d, cx = lerp(x0, x1, k), cy = lerp(y0, y1, k);
    rect(ctx, cx - w / 2, cy - w / 2, w, w, col);
  }
  for (let i = 0; i <= d; i += 2) {
    const k = i / d, cx = lerp(x0, x1, k), cy = lerp(y0, y1, k);
    rect(ctx, cx - w / 2, cy - w / 2, Math.max(1, w - 1), 1, hi);
  }
}
// One leg: shoulder, a knee thrown up in the air the way a spider does it,
// and a small hard foot on whatever it is working.
function tonSpiderLeg(ctx, sx, sy, fx, fy, lift, col, hi, lo) {
  const mx = (sx + fx) / 2, my = (sy + fy) / 2 - lift;
  tonLimb(ctx, sx, sy, mx, my, 4, col, hi, lo);
  tonLimb(ctx, mx, my, fx, fy, 3, col, hi, lo);
  rect(ctx, mx - 2, my - 2, 4, 4, hi);           // the knuckle catches the light
  rect(ctx, fx - 2, fy - 1, 4, 3, lo);
  rect(ctx, fx - 2, fy - 2, 4, 2, col);
}

// The eight jobs, in the order the legs come off him. dx/dy are relative to
// where he is standing, rate is how fast that particular leg fidgets, and
// lift is how high the knee goes - the fryer leg has to reach over the tank.
const TON_LEGS = [
  { job: 'fryer', dx: -64, dy: -26, rate: 1.55, lift: 24, amp: 3.0 },
  { job: 'cabA', dx: -30, dy: -12, rate: 2.70, lift: 15, amp: 4.2 },
  { job: 'cabB', dx: -38, dy: -4, rate: 3.10, lift: 13, amp: 4.6 },
  { job: 'slice', dx: -8, dy: -10, rate: 3.60, lift: 17, amp: 5.4 },
  { job: 'back', dx: 6, dy: -44, rate: 0.85, lift: 26, amp: 2.2 },
  { job: 'tea', dx: 34, dy: -18, rate: 1.05, lift: 19, amp: 2.6 },
  { job: 'wipe', dx: 52, dy: 2, rate: 1.35, lift: 12, amp: 7.0 },
  { job: 'till', dx: 74, dy: -14, rate: 0.62, lift: 18, amp: 2.0 },
];

// busy: which job is getting the attention right now - 'fryer', 'slice',
// 'cabA', 'tea', 'till', 'wipe', or null for a man at rest, which he is not.
function drawSpiderChef(ctx, x, y, t, busy) {
  const P = TON_PAL;
  const bodyY = y - 34, headY = y - 56;
  // his shadow on the duckboard, wide, because he is wide
  ctx.globalAlpha = 0.26; ellipsePx(ctx, x, y + 1, 24, 5, '#000'); ctx.globalAlpha = 1;

  // ---- the legs go on first, so the body sits over the shoulders
  for (let i = 0; i < TON_LEGS.length; i++) {
    const L = TON_LEGS[i];
    const left = i < 4;
    const sx = x + (left ? -10 : 10) + (left ? -1 : 1) * (i % 4) * 2;
    const sy = bodyY - 8 + (i % 4) * 5;
    const hot = busy === L.job ? 1 : 0;
    const rate = L.rate * (1 + hot * 1.4);
    const amp = L.amp * (1 + hot * 1.5);
    const ph = i * 1.31;
    const fx = x + L.dx + Math.sin(t * rate + ph) * amp;
    const fy = y + L.dy + Math.sin(t * rate * 1.37 + ph * 1.7) * amp * 0.45;
    tonSpiderLeg(ctx, sx, sy, fx, fy, L.lift + Math.sin(t * rate * 0.7 + ph) * 3, P.spider, P.spiderHi, P.spiderLo);
  }

  // ---- the body: a round abdomen in a chef's coat that used to be white
  ellipsePx(ctx, x, bodyY + 1, 19, 17, P.spiderLo);
  ellipsePx(ctx, x, bodyY, 18, 16, P.coat);
  ctx.globalAlpha = 0.5; ellipsePx(ctx, x - 5, bodyY - 5, 9, 7, P.coatHi); ctx.globalAlpha = 1;
  ellipsePx(ctx, x + 6, bodyY + 7, 11, 7, '#ded7c6');
  // the double-breasted front, and the knots he does up by feel
  rect(ctx, x - 3, bodyY - 12, 3, 24, '#cfc7b4');
  for (let i = 0; i < 4; i++) rect(ctx, x - 8, bodyY - 10 + i * 7, 4, 3, '#b6ae9a');
  // an apron, tied, with today's oil on it and last week's underneath
  rect(ctx, x - 14, bodyY + 4, 28, 14, '#5a6a7a');
  rect(ctx, x - 14, bodyY + 4, 28, 2, '#7c8c9c');
  ctx.globalAlpha = 0.45;
  rect(ctx, x - 9, bodyY + 9, 5, 4, '#3a3020'); rect(ctx, x + 3, bodyY + 12, 7, 3, '#3a3020');
  ctx.globalAlpha = 1;

  // ---- the head: small, round, and entirely made of eyebrows
  const nod = Math.sin(t * 0.9) * 1.2;
  const hy = headY + nod;
  ellipsePx(ctx, x + 1, hy + 1, 12, 11, P.spiderLo);
  ellipsePx(ctx, x + 1, hy, 11, 10, P.spider);
  ctx.globalAlpha = 0.5; ellipsePx(ctx, x - 2, hy - 4, 5, 4, P.spiderHi); ctx.globalAlpha = 1;
  // the two big kind eyes, and the six little ones above that nobody mentions
  const blink = (Math.sin(t * 0.61) > 0.985 || Math.sin(t * 0.37 + 2) > 0.99) ? 1 : 0;
  for (let i = -1; i <= 1; i += 2) {
    const ex = x + 1 + i * 4;
    if (blink) { rect(ctx, ex - 3, hy - 1, 6, 2, P.spiderLo); continue; }
    ellipsePx(ctx, ex, hy - 1, 3, 3, '#f6f2e0');
    ellipsePx(ctx, ex + (i > 0 ? 1 : 0), hy - 1, 2, 2, P.ink);
    px(ctx, ex - 1, hy - 2, '#ffffff');
  }
  for (let i = 0; i < 6; i++) {
    const ex = x - 6 + (i % 3) * 5, ey = hy - 6 - Math.floor(i / 3) * 3;
    px(ctx, ex, ey, blink ? P.spiderLo : '#2a2028');
  }
  // THE EYEBROWS. They are the size of the eyes again and they move on their
  // own, like two old dogs asleep on a shelf.
  const brow = Math.sin(t * 0.8) * 1.4 + (busy === 'slice' ? -1.5 : 0);
  for (let i = -1; i <= 1; i += 2) {
    const bx = x + 1 + i * 6;
    for (let r = 0; r < 3; r++) {
      const w = 11 - r * 2;
      rect(ctx, bx - w / 2 - i, hy - 7 - r * 2 + brow * (r * 0.3 + 0.4), w, 2, r === 0 ? '#efe9dc' : r === 1 ? '#dcd4c4' : '#c6bdab');
    }
    // the one hair that escapes every eyebrow of that age
    rect(ctx, bx + i * 5, hy - 13 + brow * 0.6, 2, 5, '#efe9dc');
  }
  // ---- the hachimaki, and its two tails, which move before he does
  rect(ctx, x - 11, hy - 11, 24, 6, P.cream);
  rect(ctx, x - 11, hy - 11, 24, 2, '#ffffff');
  rect(ctx, x - 11, hy - 6, 24, 1, '#c8c0ac');
  circle(ctx, x + 1, hy - 8, 3, P.red);
  circle(ctx, x + 1, hy - 8, 2, '#e8503a');
  for (let i = 0; i < 2; i++) {
    const w = Math.sin(t * 2.2 + i * 1.1) * 4;
    const tx = x - 12 - i * 2, ty = hy - 9 + i * 4;
    for (let s = 0; s < 12; s++) {
      const k = s / 12;
      rect(ctx, tx - s, ty + s * 0.5 + Math.sin(t * 3 + i + k * 4) * 2 + w * k * 0.4, 2, 2, s % 3 ? P.cream : '#ded6c2');
    }
  }
  // his collar, because a coat needs a collar to read as a coat
  rect(ctx, x - 7, hy + 8, 16, 4, P.coatHi);
  rect(ctx, x - 7, hy + 11, 16, 2, '#d0c8b6');
}

// ==========================================================================
//  THE ROOM
// ==========================================================================

// The wall: tongue-and-groove up to a rail, plaster above, forty years of
// fryer on all of it.
function tonWall(ctx, x0, x1, t) {
  const P = TON_PAL;
  rect(ctx, x0, 40, x1 - x0, 306, P.wall);
  ctx.globalAlpha = 0.3; vgrad(ctx, x0, 40, x1 - x0, 306, '#8a7a56', '#ffffff'); ctx.globalAlpha = 1;
  // the boards, below the rail, all the way down to where the floor starts -
  // they used to stop in mid air and leave the bottom of the room empty
  rect(ctx, x0, 258, x1 - x0, 86, P.woodLo);
  for (let x = Math.floor(x0 / 22) * 22; x < x1; x += 22) {
    rect(ctx, x, 258, 2, 86, '#6e5634');
    rect(ctx, x + 2, 258, 3, 86, '#9c7c4c');
  }
  rect(ctx, x0, 254, x1 - x0, 6, '#a8874e');
  rect(ctx, x0, 254, x1 - x0, 2, '#cfa968');
  // the smoke-stain gradient that lives over every fryer in the world
  ctx.globalAlpha = 0.16;
  vgrad(ctx, 250, 96, 240, 170, '#4a3820', 'rgba(74,56,32,0)');
  ctx.globalAlpha = 1;
  // The ceiling. The camera only ever sees this room from about y 80 down, so
  // the soffit and the battens sit right on that cut - which is also exactly
  // where a ceiling this low belongs.
  rect(ctx, x0, 58, x1 - x0, 32, '#b2a486');
  rect(ctx, x0, 58, x1 - x0, 4, '#c8bb9c');
  rect(ctx, x0, 88, x1 - x0, 5, '#8a7c62');
  rect(ctx, x0, 93, x1 - x0, 2, '#6e6250');
  for (let x = Math.floor(x0 / 210) * 210; x < x1; x += 210) {
    // a bare fluorescent batten, yellowed, one of them a half tone cooler
    // than the others because it got changed and the others did not
    rect(ctx, x + 40, 96, 112, 9, '#6a6254');
    rect(ctx, x + 40, 96, 112, 2, '#8a8272');
    ctx.globalAlpha = 0.92;
    rect(ctx, x + 44, 99, 104, 5, Math.abs(Math.round(x / 210)) % 2 ? '#f2f6ea' : '#fff6dc');
    ctx.globalAlpha = 0.11;
    ellipsePx(ctx, x + 95, 236, 128, 150, '#ffeeba');
    ctx.globalAlpha = 1;
  }
}

// ---------- the floor ----------
// This room is only about seventy pixels deep in this projection: the wall
// lands just under the lip of the counter and everything after that is tile
// coming toward you. The courses get taller and paler as they come, which is
// the only perspective trick this game owns.
const TON_ROWS = [344, 352, 362, 376, 394, 416, 446, 484, 544];
function tonFloor(ctx, x0, x1, t) {
  // the kick board where the wall lands, and the dark line under it
  rect(ctx, x0, 336, x1 - x0, 8, '#6e5838');
  rect(ctx, x0, 336, x1 - x0, 2, '#96774a');
  rect(ctx, x0, 343, x1 - x0, 2, '#2a2620');
  // the courses of tile
  for (let r = 0; r < TON_ROWS.length - 1; r++) {
    const y = TON_ROWS[r], h = TON_ROWS[r + 1] - TON_ROWS[r];
    const k = r / (TON_ROWS.length - 2);
    const body = mixColor('#4c4e46', '#8c8c7e', k);
    rect(ctx, x0, y, x1 - x0, h, body);
    rect(ctx, x0, y, x1 - x0, 1, lighten(body, 0.18));
    const tw = 20 + r * 7, off = (r % 2) * Math.round(tw / 2);
    for (let x = Math.floor((x0 - off) / tw) * tw + off; x < x1; x += tw) rect(ctx, x, y, 1, h, darken(body, 0.26));
    rect(ctx, x0, y + h - 1, x1 - x0, 1, darken(body, 0.32));
  }
  // the speckle in the terrazzo, fixed in world space so it does not crawl
  const r2 = makeRng(5150);
  for (let i = 0; i < 260; i++) {
    const sx = r2.range(0, TON_W), sy = r2.range(346, 542);
    if (sx < x0 - 4 || sx > x1 + 4) continue;
    rect(ctx, sx, sy, r2.chance(0.3) ? 2 : 1, 1, r2.chance(0.5) ? '#a8a898' : '#3a3c36');
  }
  // the duckboard he stands on, which is why he is a head above the counter
  rect(ctx, 246, 326, 620, 22, '#7a6142');
  rect(ctx, 246, 326, 620, 3, '#a2825a');
  for (let x = 250; x < 862; x += 13) {
    rect(ctx, x, 326, 9, 3, '#8e7150');
    rect(ctx, x + 9, 326, 4, 3, '#5e4a30');
  }
  rect(ctx, 246, 336, 620, 3, '#4e3d26');
  // thirty one years of feet in front of the counter, polished pale
  ctx.globalAlpha = 0.18;
  ellipsePx(ctx, (TON_CX0 + TON_CX1) / 2, 418, (TON_CX1 - TON_CX0) / 2, 22, '#d8d4bc');
  ctx.globalAlpha = 0.12;
  ellipsePx(ctx, TON_SEAT, 424, 70, 18, '#f0ecd0');
  ctx.globalAlpha = 1;
  // the drain by the door, which is where the mop bucket goes
  rect(ctx, 118, 440, 58, 22, '#5a6068');
  rect(ctx, 118, 440, 58, 2, '#868e98');
  rect(ctx, 122, 444, 50, 15, '#23272d');
  for (let i = 0; i < 6; i++) rect(ctx, 124 + i * 8, 444, 5, 15, '#4a5058');
  // the counter putting its weight on the tile
  ctx.globalAlpha = 0.34;
  rect(ctx, TON_CX0 - 4, 407, TON_CX1 - TON_CX0 + 10, 7, '#1c1b16');
  ctx.globalAlpha = 0.16;
  rect(ctx, TON_CX0 - 4, 414, TON_CX1 - TON_CX0 + 10, 6, '#1c1b16');
  ctx.globalAlpha = 1;
  // and the cold that comes in under the door, blue on a warm floor
  ctx.globalAlpha = 0.1;
  ellipsePx(ctx, TON_DOOR, 424, 62, 26, '#8ad8ff');
  ctx.globalAlpha = 1;
}
// The wall of handwritten strips. You cannot read a single one of them and
// you can read every price, which is exactly how it is.
function tonMenuWall(ctx, x0, t) {
  const r = makeRng(9911);
  const prices = [900, 1200, 1400, 750, 1600, 980, 1100, 850, 1300, 700, 1250, 1500, 880, 1050];
  for (let i = 0; i < 14; i++) {
    const x = x0 + i * 42, y = 132 + (i % 3) * 8;
    const h = 96 + (i % 4) * 9;
    // the strip itself, curling off the wall at one corner
    rect(ctx, x + 1, y + 2, 30, h, 'rgba(40,30,16,0.28)');
    rect(ctx, x, y, 30, h, i % 5 === 3 ? '#efe2c0' : '#f6efd8');
    rect(ctx, x, y, 30, 2, '#fffbe8');
    rect(ctx, x, y + h - 2, 30, 2, '#d8cba8');
    ctx.globalAlpha = 0.14; rect(ctx, x, y, 30, h, '#8a6a30'); ctx.globalAlpha = 1;
    // four glyphs nobody in this room needs to read out loud
    for (let g = 0; g < 4; g++) drawKanaBlock(ctx, x + 8, y + 8 + g * 17, 15, '#2a2028', r.int(0, 5));
    // and the number, in the one hand he has always had
    drawText(ctx, String(prices[i]), x + 15, y + h - 16, '#a8341f', { align: 'center', font: 'small' });
    // the drawing pin
    circle(ctx, x + 15, y + 3, 2, '#8a8f98');
    px(ctx, x + 14, y + 2, '#dfe4ea');
  }
  // the one strip that is newer than the others, and whiter, and higher
  rect(ctx, x0 + 176, 108, 62, 22, '#fffbe8');
  frame(ctx, x0 + 176, 108, 62, 22, '#c8bda0');
  drawText(ctx, 'OYSTERS', x0 + 207, 114, '#a8341f', { align: 'center', font: 'small' });
}
// A calendar from a builders' merchant, two months out of date, because it
// has a good picture on it and nobody is paying him to know the date.
function tonCalendar(ctx, x, y, t) {
  rect(ctx, x + 2, y + 3, 54, 74, 'rgba(30,22,10,0.3)');
  rect(ctx, x, y, 54, 74, '#f2ead6');
  frame(ctx, x, y, 54, 74, '#b8ab8c');
  // the picture: a mountain, in three flat tones, badly registered
  rect(ctx, x + 3, y + 3, 48, 28, '#8fb6d8');
  ctx.fillStyle = '#4a6a86'; ctx.beginPath();
  ctx.moveTo(x + 8, y + 31); ctx.lineTo(x + 26, y + 9); ctx.lineTo(x + 46, y + 31); ctx.fill();
  rect(ctx, x + 21, y + 11, 11, 5, '#eef4f8');
  ctx.globalAlpha = 0.3; rect(ctx, x + 5, y + 4, 48, 27, '#e05a4a'); ctx.globalAlpha = 1;
  // the month, and the grid, and the one day with a ring round it
  drawText(ctx, 'MAY', x + 27, y + 34, '#8a3020', { align: 'center', scale: 2 });
  for (let r2 = 0; r2 < 5; r2++) for (let c = 0; c < 7; c++) {
    rect(ctx, x + 5 + c * 7, y + 48 + r2 * 5, 4, 3, (c === 0 || c === 6) ? '#c08a80' : '#6a6458');
  }
  ctx.globalAlpha = 0.85;
  ringPx(ctx, x + 5 + 3 * 7 + 2, y + 48 + 2 * 5 + 1, 5, '#c8402c');
  ctx.globalAlpha = 1;
  // and the two months of pages underneath it that never got torn off
  rect(ctx, x - 2, y + 74, 58, 3, '#ded2b4');
  rect(ctx, x - 1, y + 77, 56, 2, '#cfc2a2');
}
// A small television on a bracket in the corner, angled down, showing the
// ball game with the sound off and the subtitles on.
function tonTV(ctx, x, y, t, S) {
  // the bracket
  rect(ctx, x + 46, y + 8, 16, 5, '#5a5a62');
  rect(ctx, x + 56, y + 4, 6, 26, '#6a6a72');
  // the box: an old one, deep, with a grille down the side
  rect(ctx, x + 2, y + 3, 64, 50, 'rgba(20,16,10,0.35)');
  rect(ctx, x, y, 64, 50, '#3a3a42');
  rect(ctx, x, y, 64, 3, '#5c5c66');
  rect(ctx, x + 52, y + 6, 9, 38, '#2c2c34');
  for (let i = 0; i < 7; i++) rect(ctx, x + 53, y + 8 + i * 5, 7, 2, '#44444e');
  // the picture
  const sx = x + 4, sy = y + 5, sw = 45, sh = 38;
  rect(ctx, sx, sy, sw, sh, '#1b3a20');
  // the infield, seen from the high camera behind home
  ctx.fillStyle = '#3f7a44'; ctx.beginPath();
  ctx.moveTo(sx + 22, sy + 34); ctx.lineTo(sx + 5, sy + 17); ctx.lineTo(sx + 22, sy + 6); ctx.lineTo(sx + 40, sy + 17); ctx.fill();
  rect(ctx, sx + 4, sy + 14, 37, 2, '#8a6a42');
  for (let i = 0; i < 4; i++) {
    const a = [[22, 33], [7, 18], [22, 7], [37, 18]][i];
    rect(ctx, sx + a[0] - 1, sy + a[1] - 1, 3, 3, '#e8e4d8');
  }
  // two players, doing nothing, for a very long time
  const b = Math.floor(t * 0.7) % 4;
  rect(ctx, sx + 21, sy + 29 + (b === 1 ? -1 : 0), 2, 5, '#e8e4d8');
  rect(ctx, sx + 22, sy + 15, 2, 5, '#dcd0b0');
  // the score bug, which is the only part anybody actually reads
  rect(ctx, sx + 2, sy + 2, 41, 8, 'rgba(10,14,22,0.82)');
  drawText(ctx, 'MOTHS 2', sx + 4, sy + 3, '#f4f1ea', { font: 'small' });
  drawText(ctx, 'HORNETS 3', sx + 41, sy + 3, '#ffd24a', { align: 'right', font: 'small' });
  drawText(ctx, 'B7', sx + 4, sy + 31, '#8ad8ff', { font: 'small' });
  // the scanlines and the glow it throws back onto the wall
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < sh; i += 3) rect(ctx, sx, sy + i, sw, 1, '#000');
  ctx.globalAlpha = 0.09 + 0.02 * Math.sin(t * 9);
  ellipsePx(ctx, sx + 22, sy + 40, 58, 42, '#9fd8ff');
  ctx.globalAlpha = 1;
}
// The cat, waving, with a battery in it that is nearly done. Its arm has been
// going since before the till was electric.
function tonNeko(ctx, x, y, t) {
  const wave = Math.sin(t * 1.9);
  // the shelf it sits on
  rect(ctx, x - 16, y + 2, 34, 4, TON_PAL.woodLo);
  rect(ctx, x - 16, y + 2, 34, 1, TON_PAL.woodHi);
  ellipsePx(ctx, x, y - 8, 10, 9, '#f6f2e8');
  ellipsePx(ctx, x, y - 20, 8, 7, '#f6f2e8');
  ctx.globalAlpha = 0.35; ellipsePx(ctx, x - 3, y - 22, 4, 3, '#ffffff'); ctx.globalAlpha = 1;
  // ears, one orange patch, two dot eyes, and a red collar with a gold bell
  for (let i = -1; i <= 1; i += 2) { rect(ctx, x + i * 6 - 1, y - 27, 4, 5, '#f6f2e8'); rect(ctx, x + i * 6, y - 26, 2, 3, '#e8a09a'); }
  rect(ctx, x + 2, y - 26, 6, 5, '#e08a3a');
  px(ctx, x - 3, y - 21, TON_PAL.ink); px(ctx, x + 3, y - 21, TON_PAL.ink);
  rect(ctx, x - 1, y - 19, 3, 2, '#e8a09a');
  rect(ctx, x - 7, y - 14, 15, 3, '#c8402c');
  circle(ctx, x, y - 12, 2, '#ffd24a');
  // the arm, which is the whole point of the cat
  const ax = x + 7, ay = y - 14;
  rect(ctx, ax, ay - 4 - wave * 5, 4, 9, '#f6f2e8');
  rect(ctx, ax, ay - 4 - wave * 5, 4, 2, '#ffffff');
  rect(ctx, x - 10, y - 10, 5, 8, '#f6f2e8');
  // the little gold plate it holds, worn smooth
  rect(ctx, x - 5, y - 4, 11, 6, '#e0b23c');
  rect(ctx, x - 5, y - 4, 11, 2, '#ffd97a');
}
// The fryer. The one machine in the room that gets looked after.
function tonFryer(ctx, x, y, t, S) {
  const P = TON_PAL, w = 78, h = 46;
  const T = S && S.ton;
  const down = T ? T.basket : 0;           // 0 up, 1 in the oil
  // the tank
  rect(ctx, x - w / 2, y - h, w, h, P.steelLo);
  rect(ctx, x - w / 2 + 2, y - h + 2, w - 4, h - 4, P.steel);
  rect(ctx, x - w / 2 + 2, y - h + 2, w - 4, 2, P.steelHi);
  rect(ctx, x - w / 2, y - 4, w, 4, '#5a6068');
  // the oil, which is the only thing in this game that is allowed to move
  const oy = y - h + 10;
  rect(ctx, x - w / 2 + 4, oy, w - 8, h - 14, P.oilLo);
  rect(ctx, x - w / 2 + 4, oy + 2, w - 8, h - 16, P.oil);
  // the surface: three scanlines that will not sit still
  for (let i = 0; i < 4; i++) {
    const yy = oy + 2 + i;
    for (let sx = x - w / 2 + 4; sx < x + w / 2 - 4; sx += 3) {
      const wob = Math.sin(t * (3.1 + i * 0.6) + sx * 0.17) * 1.4;
      rect(ctx, sx, yy + wob, 3, 1, i === 0 ? P.oilHi : i === 1 ? '#f0bf58' : P.oil);
    }
  }
  // the bubbles, rising and going at the top, faster when there is food in it
  const n = down > 0.5 ? 16 : 7;
  for (let i = 0; i < n; i++) {
    const sp = 0.34 + (i % 5) * 0.12 + down * 0.4;
    const k = ((t * sp + i * 0.371) % 1);
    const bx = x - w / 2 + 9 + ((i * 13 + (i % 3) * 5) % (w - 18));
    const by = y - 8 - k * (h - 22);
    const r = 1 + k * 1.8 + (i % 3) * 0.4;
    ctx.globalAlpha = 0.55 + k * 0.4;
    circle(ctx, bx, by, r, '#ffe9a8');
    ctx.globalAlpha = 1;
    if (k > 0.94) ringPx(ctx, bx, oy + 3, Math.round(2 + (k - 0.94) * 40), '#fff3c8');
  }
  // the basket, hanging on its hook or lowered in
  const by = lerp(y - h - 16, y - h + 18, clamp(down, 0, 1));
  rect(ctx, x - 24, by, 48, 3, P.steelHi);
  for (let i = 0; i <= 48; i += 5) rect(ctx, x - 24 + i, by, 2, 18, P.steel);
  for (let i = 0; i < 4; i++) rect(ctx, x - 24, by + i * 5, 48, 2, P.steelLo);
  rect(ctx, x + 22, by - 10, 3, 12, '#6a7078');
  rect(ctx, x + 22, by - 12, 14, 4, '#3a3f46');
  // whatever is in the basket
  if (T && (T.cookK === 'in' || T.cookK === 'fry' || T.cookK === 'out')) {
    const k = T.cookK === 'fry' ? clamp(T.cookT / 9.5, 0, 1) : (T.cookK === 'out' ? 1 : 0);
    const col = mixColor('#f0e6c8', '#c07a2a', k);
    rect(ctx, x - 13, by + 5, 27, 9, darken(col, 0.18));
    rect(ctx, x - 13, by + 5, 27, 7, col);
    rect(ctx, x - 13, by + 5, 27, 2, lighten(col, 0.2));
    // panko reads as noise on the edge, not as texture on the face
    for (let i = 0; i < 12; i++) px(ctx, x - 12 + i * 2.2, by + 4 + (i % 3), lighten(col, 0.3));
  }
  // the steam off the top, always, even when there is nothing in it
  for (let i = 0; i < 5; i++) {
    const k = ((t * 0.32 + i * 0.2) % 1);
    ctx.globalAlpha = (1 - k) * (down > 0.5 ? 0.3 : 0.13);
    ellipsePx(ctx, x - 16 + i * 9 + Math.sin(t * 1.3 + i) * 5, oy - 6 - k * 46, 8 + k * 11, 5 + k * 8, '#e8e2d4');
    ctx.globalAlpha = 1;
  }
  // the heat it throws up the wall
  ctx.globalAlpha = 0.07 + 0.02 * Math.sin(t * 5);
  ellipsePx(ctx, x, oy - 40, 52, 60, '#ffb45a');
  ctx.globalAlpha = 1;
  // the dial, and the little red lamp that says the thermostat is holding
  circle(ctx, x - w / 2 - 6, y - 20, 5, '#3a3f46');
  rect(ctx, x - w / 2 - 7, y - 23, 2, 4, '#dfe4ea');
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 1.6);
  rect(ctx, x - w / 2 - 8, y - 32, 4, 4, '#e8503a');
  ctx.globalAlpha = 1;
}
// The board, the knife, and whatever stage the cutlet is at.
function tonBoard(ctx, x, y, t, S) {
  const P = TON_PAL, T = S && S.ton;
  // a slab of end-grain, scrubbed into a dip in the middle
  rect(ctx, x - 44, y - 10, 88, 12, '#a88a58');
  rect(ctx, x - 44, y - 10, 88, 3, '#d0b078');
  rect(ctx, x - 26, y - 8, 52, 4, '#bb9c68');
  // the three trays: flour, egg, panko, in that order, always
  const trays = [['#efe7d2', 'FLOUR'], ['#f0c24a', 'EGG'], ['#e8dcb8', 'PANKO']];
  for (let i = 0; i < 3; i++) {
    const tx = x - 40 + i * 28;
    rect(ctx, tx, y - 18, 24, 9, '#8a8f98');
    rect(ctx, tx + 1, y - 17, 22, 7, trays[i][0]);
    rect(ctx, tx + 1, y - 17, 22, 2, lighten(trays[i][0], 0.2));
    if (T && T.cookK === ['flour', 'egg', 'panko'][i]) {
      ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 9);
      frame(ctx, tx - 1, y - 19, 26, 11, '#ffd24a');
      ctx.globalAlpha = 1;
      // the dust off it, which is the whole reason the stage exists
      for (let d = 0; d < 6; d++) {
        const k = ((t * 1.4 + d * 0.17) % 1);
        ctx.globalAlpha = (1 - k) * 0.5;
        px(ctx, tx + 4 + d * 3 + Math.sin(t * 6 + d) * 3, y - 20 - k * 14, trays[i][0]);
        ctx.globalAlpha = 1;
      }
    }
  }
  // the knife, long and thin, on its magnetic strip except when it is not
  const slicing = T && T.cookK === 'slice';
  const kx = slicing ? x + 12 + Math.sin(t * 9) * 9 : x + 34;
  const ky = slicing ? y - 22 - Math.abs(Math.sin(t * 9)) * 9 : y - 40;
  rect(ctx, kx - 1, ky, 3, 26, '#3a3028');
  rect(ctx, kx - 1, ky + 20, 3, 8, '#5a4a38');
  rect(ctx, kx - 4, ky - 2, 8, 22, '#cfd6de');
  rect(ctx, kx - 4, ky - 2, 3, 22, '#eef2f6');
  // and the cutlet itself, at whatever stage it has got to
  if (T && T.dish) {
    const st = T.cookK;
    if (st === 'flour' || st === 'egg' || st === 'panko') {
      const col = st === 'flour' ? '#e8c8a0' : st === 'egg' ? '#e8b468' : '#eadfc0';
      rect(ctx, x - 14, y - 13, 28, 5, darken(col, 0.2));
      rect(ctx, x - 14, y - 14, 28, 4, col);
      rect(ctx, x - 14, y - 14, 28, 1, lighten(col, 0.25));
    } else if (st === 'slice' || st === 'plate') {
      // the seven cuts, opening one at a time
      const cuts = st === 'plate' ? 7 : Math.floor(clamp(T.cookT / 4.4, 0, 1) * 7);
      for (let i = 0; i < 7; i++) {
        const sx2 = x - 15 + i * 5 + (i < cuts ? i * 0.9 : 0);
        rect(ctx, sx2, y - 15, 4, 8, i < cuts ? '#f0d8a8' : '#c88a3a');
        rect(ctx, sx2, y - 15, 4, 2, '#e8b45a');
        if (i < cuts) rect(ctx, sx2 + 1, y - 13, 2, 4, '#e8c4b0');
      }
    }
  }
}
// The draining rack: wire over a tray, where the oil comes back off.
function tonRack(ctx, x, y, t, S) {
  const T = S && S.ton;
  rect(ctx, x - 22, y - 8, 44, 8, '#8a8f98');
  rect(ctx, x - 22, y - 8, 44, 2, '#cfd6de');
  for (let i = 0; i < 9; i++) rect(ctx, x - 20 + i * 5, y - 12, 2, 5, '#b9bec6');
  if (T && T.cookK === 'drain') {
    rect(ctx, x - 14, y - 18, 28, 6, '#b06a1e');
    rect(ctx, x - 14, y - 19, 28, 5, '#c8862a');
    rect(ctx, x - 14, y - 19, 28, 1, '#e8a84a');
    // the oil coming off it, one drip at a time, which is what draining is
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.9 + i * 0.33) % 1);
      ctx.globalAlpha = 0.7 - k * 0.5;
      rect(ctx, x - 8 + i * 8, y - 13 + k * 12, 1, 3, '#e8b45a');
      ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.5 + i * 0.3) % 1);
      ctx.globalAlpha = (1 - k) * 0.22;
      ellipsePx(ctx, x + Math.sin(t + i) * 6, y - 22 - k * 30, 7 + k * 8, 4 + k * 5, '#e8e2d4');
      ctx.globalAlpha = 1;
    }
  }
}
// The cabbage mountain. It is not a garnish, it is a landscape, and it is
// free, which is the single best fact about this whole country.
function tonCabbage(ctx, x, y, t, S) {
  const P = TON_PAL;
  const T = S && S.ton;
  const shredding = T && (T.cookK === 'flour' || T.cookK === 'egg' || T.cookK === 'panko');
  // the steel bowl it lives in
  rect(ctx, x - 30, y - 12, 60, 12, P.steelLo);
  rect(ctx, x - 29, y - 13, 58, 11, P.steel);
  rect(ctx, x - 29, y - 13, 58, 2, P.steelHi);
  // the mountain, built out of flattened passes so it curves without an arc
  const h = 26;
  for (let i = 0; i < 9; i++) {
    const k = i / 9;
    ellipsePx(ctx, x, y - 12 - k * h, 28 * (1 - k * 0.72), 9 * (1 - k * 0.5), i % 2 ? P.cab : '#eef4e2');
  }
  ctx.globalAlpha = 0.5; ellipsePx(ctx, x - 8, y - 26, 10, 5, '#f6fbee'); ctx.globalAlpha = 1;
  // the shreds: short white lines all going the same way, which is what
  // makes a pile of cabbage read as cabbage and not as a pile of anything
  const r = makeRng(4242);
  for (let i = 0; i < 90; i++) {
    const a = r.range(0, 6.283), rr = r.range(0, 1);
    const sx = x + Math.cos(a) * 26 * (1 - rr * 0.6);
    const sy = y - 13 - rr * h - Math.abs(Math.sin(a)) * 3;
    rect(ctx, sx, sy, r.chance(0.5) ? 4 : 3, 1, r.chance(0.3) ? P.cabLo : '#f4f8ec');
  }
  // a half head of it on the board next to the bowl, being turned to snow
  rect(ctx, x + 34, y - 18, 18, 18, '#cfe0b8');
  ellipsePx(ctx, x + 43, y - 18, 9, 5, '#e4efd4');
  for (let i = 0; i < 5; i++) rect(ctx, x + 36 + i * 3, y - 16, 1, 14, '#b4cc9a');
  if (shredding) {
    for (let i = 0; i < 7; i++) {
      const k = ((t * 1.8 + i * 0.14) % 1);
      ctx.globalAlpha = 1 - k;
      rect(ctx, x + 32 - k * 26 + Math.sin(i) * 4, y - 22 - Math.sin(k * 3.14) * 14, 3, 1, '#f4f8ec');
      ctx.globalAlpha = 1;
    }
  }
}
// The rice cooker, which is the quietest thing in the room and the one that
// is always on.
function tonRice(ctx, x, y, t) {
  rect(ctx, x - 20, y - 26, 40, 26, '#e4e0d6');
  rect(ctx, x - 20, y - 26, 40, 3, '#f8f6f0');
  rect(ctx, x - 20, y - 6, 40, 6, '#b8b4aa');
  rect(ctx, x - 22, y - 32, 44, 7, '#d0ccc2');
  rect(ctx, x - 22, y - 32, 44, 2, '#f0ece2');
  rect(ctx, x + 12, y - 31, 8, 4, '#8a8f98');
  // the little panel with two lamps: one keeping warm, one that never lights
  rect(ctx, x - 14, y - 20, 22, 9, '#3a3a42');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 1.1);
  rect(ctx, x - 12, y - 18, 4, 4, '#e8503a');
  ctx.globalAlpha = 0.25;
  rect(ctx, x - 5, y - 18, 4, 4, '#6be585');
  ctx.globalAlpha = 1;
  drawText(ctx, 'ON', x + 4, y - 19, '#8a8f98', { font: 'small' });
  // the steam out of the vent, thin and constant
  for (let i = 0; i < 4; i++) {
    const k = ((t * 0.42 + i * 0.25) % 1);
    ctx.globalAlpha = (1 - k) * 0.3;
    ellipsePx(ctx, x + 16 + Math.sin(t * 2 + i) * 4, y - 34 - k * 40, 4 + k * 8, 3 + k * 6, '#eef2f6');
    ctx.globalAlpha = 1;
  }
}
// The beer fridge, glass door, lit from inside, humming louder than the fryer.
function tonFridge(ctx, x, y, t) {
  const P = TON_PAL;
  rect(ctx, x - 31, y - 126, 62, 126, '#3a4048');
  rect(ctx, x - 31, y - 126, 62, 4, '#5c636c');
  rect(ctx, x - 28, y - 118, 56, 110, '#12181c');
  ctx.globalAlpha = 0.55; vgrad(ctx, x - 28, y - 118, 56, 110, '#cfe8f4', '#2a4450'); ctx.globalAlpha = 1;
  // four shelves of tall cans and two big brown bottles on the bottom
  for (let r2 = 0; r2 < 3; r2++) {
    const ry = y - 110 + r2 * 26;
    rect(ctx, x - 26, ry + 20, 52, 2, '#7a8490');
    for (let i = 0; i < 7; i++) {
      const cx = x - 25 + i * 7.4;
      const col = ['#c8b04a', '#8ab0d8', '#c8402c', '#e8e4da', '#3f7a54'][(i + r2) % 5];
      rect(ctx, cx, ry + 4, 6, 16, col);
      rect(ctx, cx, ry + 4, 6, 2, lighten(col, 0.3));
      rect(ctx, cx, ry + 10, 6, 2, '#f4f1ea');
    }
  }
  for (let i = 0; i < 4; i++) {
    rect(ctx, x - 24 + i * 13, y - 30, 8, 22, '#6a4218');
    rect(ctx, x - 24 + i * 13, y - 30, 8, 2, '#9a6a34');
    rect(ctx, x - 22 + i * 13, y - 36, 4, 7, '#6a4218');
    rect(ctx, x - 24 + i * 13, y - 22, 8, 6, '#e8e0c8');
  }
  // the glass, the handle, and the cold light spilling out of the bottom
  ctx.globalAlpha = 0.16; rect(ctx, x - 28, y - 118, 56, 110, '#bfe0ff'); ctx.globalAlpha = 1;
  for (let i = 0; i < 2; i++) {
    ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; ctx.beginPath();
    ctx.moveTo(x - 24 + i * 30, y - 10); ctx.lineTo(x - 14 + i * 30, y - 10);
    ctx.lineTo(x + 30 + i * 30, y - 118); ctx.lineTo(x + 20 + i * 30, y - 118); ctx.fill();
    ctx.globalAlpha = 1;
  }
  rect(ctx, x + 22, y - 90, 4, 44, '#b9bec6');
  rect(ctx, x - 31, y - 126, 62, 4, '#5c636c');
  rect(ctx, x - 26, y - 134, 52, 10, '#c8402c');
  drawText(ctx, 'COLD', x, y - 132, '#ffe9b0', { align: 'center', font: 'small' });
  ctx.globalAlpha = 0.1; ellipsePx(ctx, x, y + 2, 40, 12, '#8ad8ff'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x, y + 1, 32, 6, '#15140f'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.16; rect(ctx, x - 31, y - 4, 62, 4, '#15140f'); ctx.globalAlpha = 1;
}
// The counter. Hinoki, twenty years of wiping, and a pale patch in the middle
// where everybody's elbows go. It is the best thing in the room.
function tonCounterSlab(ctx, t) {
  const P = TON_PAL;
  // the working top, seen almost edge on
  rect(ctx, TON_CX0, TON_CT, TON_CX1 - TON_CX0, 14, P.woodHi);
  ctx.globalAlpha = 0.3; hgrad(ctx, TON_CX0, TON_CT, TON_CX1 - TON_CX0, 14, '#ffffff', 'rgba(255,255,255,0)'); ctx.globalAlpha = 1;
  // the worn patch: not a stain, an absence
  ctx.globalAlpha = 0.55;
  ellipsePx(ctx, TON_SEAT, TON_CT + 7, 96, 8, P.woodWorn);
  ellipsePx(ctx, TON_SEAT + 190, TON_CT + 7, 62, 6, P.woodWorn);
  ctx.globalAlpha = 1;
  // the front face, and the grain in it
  rect(ctx, TON_CX0, TON_CT + 14, TON_CX1 - TON_CX0, TON_CBOT - TON_CT - 14, P.wood);
  ctx.globalAlpha = 0.22;
  const r = makeRng(1717);
  for (let i = 0; i < 34; i++) {
    const gx = TON_CX0 + r.range(0, TON_CX1 - TON_CX0);
    rect(ctx, gx, TON_CT + 16 + r.range(0, 34), r.range(14, 60), 1, r.chance(0.5) ? P.woodLo : P.woodHi);
  }
  ctx.globalAlpha = 1;
  rect(ctx, TON_CX0, TON_CT + 14, TON_CX1 - TON_CX0, 2, '#e8cf9e');
  rect(ctx, TON_CX0, TON_CBOT - 5, TON_CX1 - TON_CX0, 5, P.woodLo);
  rect(ctx, TON_CX0, TON_CBOT - 5, TON_CX1 - TON_CX0, 1, '#a8874e');
  // the brass foot rail, which is the only bright metal in the building
  rect(ctx, TON_CX0, TON_CBOT + 4, TON_CX1 - TON_CX0, 3, '#b08a32');
  rect(ctx, TON_CX0, TON_CBOT + 4, TON_CX1 - TON_CX0, 1, '#e0b23c');
  // the ends, squared off
  rect(ctx, TON_CX0 - 4, TON_CT, 6, TON_CBOT - TON_CT, P.woodLo);
  rect(ctx, TON_CX1 - 2, TON_CT, 6, TON_CBOT - TON_CT, P.woodLo);
}
function tonStool(ctx, x, y, i, worn) {
  const P = TON_PAL;
  ctx.globalAlpha = 0.26; ellipsePx(ctx, x, y + 1, 15, 4, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x - 3, y - 24, 6, 24, '#4a4a52');
  rect(ctx, x - 3, y - 24, 2, 24, '#6c6c76');
  rect(ctx, x - 11, y - 2, 22, 3, '#3a3a42');
  rect(ctx, x - 9, y - 11, 18, 2, '#5a5a62');
  // the seat: red vinyl, cracked, with a patch of tape on the third one
  ellipsePx(ctx, x, y - 25, 15, 6, '#7a2418');
  ellipsePx(ctx, x, y - 27, 15, 6, '#b8382a');
  ctx.globalAlpha = 0.4; ellipsePx(ctx, x - 4, y - 29, 7, 3, '#e06050'); ctx.globalAlpha = 1;
  if (worn) {
    rect(ctx, x - 6, y - 29, 9, 3, '#c8b8a0');
    rect(ctx, x - 6, y - 29, 9, 1, '#e0d2b8');
  } else if (i % 2) {
    rect(ctx, x + 3, y - 28, 5, 1, '#6a1c12');
  }
}
// The noren over the door, split in two, which is how you know he is open.
function tonNoren(ctx, x, y, t) {
  rect(ctx, x - 48, y, 96, 5, TON_PAL.woodLo);
  rect(ctx, x - 48, y, 96, 2, TON_PAL.woodHi);
  for (let half = 0; half < 2; half++) {
    const x0 = x - 46 + half * 48;
    for (let c = 0; c < 22; c++) {
      const sway = Math.sin(t * 1.3 + c * 0.22 + half * 2) * (1.2 + c * 0.05);
      rect(ctx, x0 + c * 2 + sway * 0.5, y + 5, 2, 54 + Math.sin(c * 0.7) * 2, '#2f4a6a');
      if (c < 2 || c > 19) rect(ctx, x0 + c * 2 + sway * 0.5, y + 5, 2, 54, '#26405c');
    }
    // two glyphs on each half that you are not meant to be able to read
    for (let g = 0; g < 2; g++) drawKanaBlock(ctx, x0 + 14, y + 14 + g * 20, 16, '#e8e4d8', half * 2 + g);
  }
}
// The window, and the plastic food in it, faded to the colour of a photograph
// of food. The katsu in there has been on that plate since 1994.
function tonDisplay(ctx, x, y, t) {
  const P = TON_PAL;
  // the case: aluminium, glass, one fluorescent tube that hums
  rect(ctx, x - 34, y - 98, 68, 98, '#8a8f98');
  rect(ctx, x - 31, y - 95, 62, 92, '#2a2e34');
  ctx.globalAlpha = 0.9; rect(ctx, x - 29, y - 92, 58, 4, '#fff6dc'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.14; ellipsePx(ctx, x, y - 60, 44, 48, '#ffeeba'); ctx.globalAlpha = 1;
  // three shelves of plastic dinners, each one wrong in a way you like
  for (let r2 = 0; r2 < 3; r2++) {
    const ry = y - 84 + r2 * 27;
    rect(ctx, x - 29, ry + 20, 58, 3, '#6a7078');
    for (let i = 0; i < 2; i++) {
      const px2 = x - 20 + i * 30;
      ellipsePx(ctx, px2, ry + 18, 13, 5, '#e8e4da');
      ellipsePx(ctx, px2, ry + 16, 13, 5, '#f6f2e8');
      // the cutlet, sliced, standing up at an angle no food stands at
      for (let s = 0; s < 4; s++) {
        rect(ctx, px2 - 8 + s * 4, ry + 8 - s, 4, 9, ['#d89a3a', '#e0a84a'][s % 2]);
        rect(ctx, px2 - 8 + s * 4, ry + 8 - s, 4, 2, '#f0c46a');
      }
      // and the cabbage, which in plastic is simply green
      ellipsePx(ctx, px2 + 8, ry + 13, 6, 4, '#8fc06a');
      if (r2 === 2) rect(ctx, px2 - 10, ry + 10, 5, 6, '#a8682a');
    }
    // the little price flags, curling
    rect(ctx, x - 26, ry + 10, 14, 9, '#f6efd8');
    drawText(ctx, ['900', '1200', '750'][r2], x - 25, ry + 12, '#a8341f', { font: 'small' });
  }
  // the glass, and the dust on the outside of it
  ctx.globalAlpha = 0.18; rect(ctx, x - 31, y - 95, 62, 92, '#bfe0ff'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#fff'; ctx.beginPath();
  ctx.moveTo(x - 24, y - 4); ctx.lineTo(x - 12, y - 4); ctx.lineTo(x + 24, y - 95); ctx.lineTo(x + 12, y - 95); ctx.fill();
  ctx.globalAlpha = 1;
  rect(ctx, x - 34, y - 102, 68, 8, '#c8402c');
  drawText(ctx, 'TONKATSU', x, y - 100, '#ffe9b0', { align: 'center', font: 'small' });
}
// The sauce rack, the toothpick tin, the tea pot: the small furniture of a
// counter, all of it within one arm's reach of any seat.
function tonSauceRack(ctx, x, y, t, whacks, sauced) {
  const wob = whacks > 0 ? Math.sin(t * 26) * Math.max(0, 1 - (t - whacks) * 4) * 4 : 0;
  // the little wooden caddy
  rect(ctx, x - 16, y - 3, 34, 9, TON_PAL.woodLo);
  rect(ctx, x - 16, y - 3, 34, 2, TON_PAL.wood);
  // the big brown bottle, the one that never pours
  const bx = x - 7 + wob;
  rect(ctx, bx - 5, y - 24, 11, 22, '#4a2a14');
  rect(ctx, bx - 5, y - 24, 11, 3, '#6a4020');
  rect(ctx, bx - 4, y - 18, 9, 10, sauced ? '#7a4a20' : '#8a5a28');
  rect(ctx, bx - 4, y - 18, 9, 9, '#f0e6cc');
  drawText(ctx, 'S', bx, y - 17, '#8a3020', { align: 'center', font: 'small' });
  rect(ctx, bx - 3, y - 30, 7, 7, '#4a2a14');
  rect(ctx, bx - 4, y - 31, 9, 3, '#e8b45a');
  // the thin one: the lighter sauce, for people who do not know better
  rect(ctx, x + 8, y - 19, 8, 17, '#7a4a18');
  rect(ctx, x + 8, y - 19, 8, 2, '#a86a28');
  rect(ctx, x + 9, y - 24, 6, 6, '#3a2410');
  // the mustard pot, tiny, with a spoon in it
  rect(ctx, x + 20, y - 10, 9, 8, '#d8d2c4');
  rect(ctx, x + 20, y - 11, 9, 3, '#e8c84a');
  rect(ctx, x + 27, y - 18, 2, 9, '#b9bec6');
}
function tonToothpicks(ctx, x, y, t, taken) {
  rect(ctx, x - 5, y - 11, 11, 11, '#c8b070');
  rect(ctx, x - 5, y - 11, 11, 2, '#e0cc94');
  rect(ctx, x - 5, y - 2, 11, 2, '#9a854e');
  for (let i = 0; i < 6; i++) {
    if (taken && i > 2) continue;
    rect(ctx, x - 4 + i * 1.6, y - 16 - (i % 3), 1, 6, '#e8dcb8');
  }
}
function tonTeacup(ctx, x, y, t, level) {
  // a chunky brown yunomi with no handle, filled a bit too full
  rect(ctx, x - 7, y - 13, 15, 13, '#5a4030');
  rect(ctx, x - 7, y - 13, 15, 2, '#7c5c44');
  rect(ctx, x - 6, y - 4, 13, 3, '#412d20');
  if (level > 0) {
    const h = Math.round(9 * clamp(level, 0, 1));
    rect(ctx, x - 5, y - 3 - h, 11, h, TON_PAL.tea);
    rect(ctx, x - 5, y - 3 - h, 11, 1, '#b8cc72');
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.45 + i * 0.33) % 1);
      ctx.globalAlpha = (1 - k) * 0.28;
      ellipsePx(ctx, x + Math.sin(t * 1.8 + i) * 3, y - 5 - h - k * 22, 3 + k * 5, 2 + k * 4, '#eef2f6');
      ctx.globalAlpha = 1;
    }
  }
}
function tonOshibori(ctx, x, y, t, used) {
  // rolled, on a lacquer tray, steaming until it is not
  rect(ctx, x - 13, y - 4, 27, 5, '#3a1f18');
  rect(ctx, x - 13, y - 4, 27, 1, '#5c362a');
  if (used) {
    rect(ctx, x - 10, y - 8, 20, 5, '#ded8c8');
    rect(ctx, x - 10, y - 8, 20, 1, '#f0ece0');
    return;
  }
  rect(ctx, x - 11, y - 11, 23, 8, '#e8e4d8');
  rect(ctx, x - 11, y - 11, 23, 2, '#ffffff');
  rect(ctx, x - 11, y - 6, 23, 1, '#c8c2b0');
  for (let i = 0; i < 3; i++) {
    const k = ((t * 0.5 + i * 0.33) % 1);
    ctx.globalAlpha = (1 - k) * 0.3;
    ellipsePx(ctx, x - 5 + i * 5, y - 13 - k * 20, 3 + k * 5, 2 + k * 4, '#eef2f6');
    ctx.globalAlpha = 1;
  }
}
// The dinner, on its plate, losing pieces of itself.
function tonPlate(ctx, x, y, t, T) {
  const d = T.dish;
  if (!d) return;
  const bites = T.bites, total = d.bites;
  // the plate, oval, and the little dish of sauce beside it
  ctx.globalAlpha = 0.22; ellipsePx(ctx, x, y + 1, 30, 6, '#000'); ctx.globalAlpha = 1;
  ellipsePx(ctx, x, y - 2, 29, 9, '#cfc8b8');
  ellipsePx(ctx, x, y - 4, 29, 9, '#f2eee2');
  ctx.globalAlpha = 0.4; ellipsePx(ctx, x - 9, y - 6, 10, 3, '#ffffff'); ctx.globalAlpha = 1;
  // the free cabbage, refilled as often as you want it
  const cab = 6 + T.cabbage * 3;
  for (let i = 0; i < cab; i++) {
    const a = i * 0.9;
    rect(ctx, x + 10 + Math.cos(a) * 11, y - 8 - Math.abs(Math.sin(a)) * 7 - (i % 3), 4, 1, i % 4 ? '#f4f8ec' : TON_PAL.cabLo);
  }
  ellipsePx(ctx, x + 15, y - 8, 11, 4, 'rgba(223,234,203,0.55)');
  if (d.id === 'curry') {
    // curry does not get slices, it gets a brown lake with rice beside it
    const left = clamp(1 - bites / total, 0, 1);
    ellipsePx(ctx, x - 8, y - 8, 15 * left + 3, 5 * left + 2, '#f6f2e8');
    ellipsePx(ctx, x - 4, y - 7, 16 * left + 2, 5 * left + 2, '#8a5a24');
    ctx.globalAlpha = 0.5; ellipsePx(ctx, x - 6, y - 9, 8 * left, 2, '#b07a34'); ctx.globalAlpha = 1;
  }
  // the cutlet, in slices, each bite taking one away
  const n = d.id === 'curry' ? Math.max(0, 4 - Math.floor(bites * 4 / total)) : total - bites;
  for (let i = 0; i < n; i++) {
    const sx = x - 18 + i * 6, h = 11;
    rect(ctx, sx, y - 8 - h, 5, h, darken(d.col, 0.22));
    rect(ctx, sx, y - 9 - h, 5, h, d.col);
    rect(ctx, sx, y - 9 - h, 5, 2, lighten(d.col, 0.24));
    rect(ctx, sx + 1, y - 5 - h, 3, 5, '#e8c8b8');       // the pork, pale, inside the crust
    if (T.sauced) { ctx.globalAlpha = 0.6; rect(ctx, sx, y - 9 - h, 5, 3, '#5a3010'); ctx.globalAlpha = 1; }
  }
  if (d.id === 'set') {
    // the five oysters, counted in twice
    for (let i = 0; i < Math.max(0, 5 - bites); i++) ellipsePx(ctx, x - 14 + i * 8, y - 6, 4, 3, '#b08a52');
  }
  // the bowl of rice and the bowl of miso, which come with everything
  ellipsePx(ctx, x - 34, y - 6, 9, 5, '#e8e2d4');
  ellipsePx(ctx, x - 34, y - 8, 9, 4, '#f8f6f0');
  ellipsePx(ctx, x + 38, y - 6, 8, 4, '#3a1f18');
  ellipsePx(ctx, x + 38, y - 8, 8, 4, '#6a4a22');
  // chopsticks, across the near edge, on their little rest
  rect(ctx, x - 20, y + 3, 44, 1, '#a8784a');
  rect(ctx, x - 20, y + 5, 44, 1, '#a8784a');
  rect(ctx, x + 18, y + 2, 5, 5, '#3a2f4a');
  if (T.steam > 0) {
    for (let i = 0; i < 4; i++) {
      const k = ((t * 0.4 + i * 0.25) % 1);
      ctx.globalAlpha = (1 - k) * 0.3 * clamp(T.steam, 0, 1);
      ellipsePx(ctx, x - 12 + i * 9 + Math.sin(t * 1.6 + i) * 4, y - 22 - k * 34, 5 + k * 8, 3 + k * 6, '#eef2f6');
      ctx.globalAlpha = 1;
    }
  }
}
// The till: a mechanical one, the drawer worn silver at the corner.
function tonTill(ctx, x, y, t) {
  rect(ctx, x - 22, y - 30, 44, 30, '#7a6a52');
  rect(ctx, x - 22, y - 30, 44, 3, '#a89272');
  rect(ctx, x - 20, y - 26, 40, 12, '#2a2620');
  for (let i = 0; i < 4; i++) drawKanaBlock(ctx, x - 16 + i * 9, y - 24, 7, '#8fd8a8', i);
  for (let r2 = 0; r2 < 2; r2++) for (let i = 0; i < 5; i++) rect(ctx, x - 18 + i * 8, y - 11 + r2 * 5, 6, 4, '#d8d2c4');
  rect(ctx, x - 22, y - 4, 44, 4, '#5a4c38');
  rect(ctx, x + 10, y - 3, 10, 2, '#cfc6b0');
  // the spike of paid bills beside it, three inches deep
  rect(ctx, x + 28, y - 4, 2, 4, '#8a8f98');
  rect(ctx, x + 24, y - 22, 11, 19, '#f2ead6');
  rect(ctx, x + 24, y - 22, 11, 1, '#ffffff');
  rect(ctx, x + 29, y - 26, 2, 24, '#b9bec6');
}

// ==========================================================================
//  WIRING
// ==========================================================================

// The things on the counter are not props you walk to - you are sitting down.
// They are a list you scroll along with left and right, and the one you are
// on gets the yellow prompt over it. This is the list, in counter order.
const TON_HAND = [
  { act: 'towel', x: TON_SEAT - 58, y: TON_CT + 2, h: 18, label: 'THE HOT TOWEL' },
  { act: 'tea', x: TON_SEAT - 32, y: TON_CT + 1, h: 18, label: 'THE TEA' },
  { act: 'order', x: TON_SEAT - 6, y: TON_CT, h: 18, label: 'ORDER' },
  { act: 'eat', x: TON_SEAT + 24, y: TON_CT + 2, h: 22, label: 'EAT' },
  { act: 'sauce', x: TON_SEAT + 46, y: TON_CT + 2, h: 30, label: 'THE SAUCE' },
  { act: 'cabbage', x: TON_SEAT + 72, y: TON_CT + 1, h: 20, label: 'MORE CABBAGE' },
  { act: 'pick', x: TON_SEAT + 94, y: TON_CT, h: 18, label: 'A TOOTHPICK' },
  { act: 'chef', x: TON_SEAT, y: TON_CHEF - 4, h: 62, label: 'THE OLD MAN' },
  { act: 'pay', x: TON_SEAT + 116, y: TON_CT, h: 18, label: 'PAY' },
  { act: 'stand', x: TON_SEAT, y: TON_Y, h: 18, label: 'STAND UP' },
];

function tonProps() {
  const P = [];
  P.push({ kind: 'tondoor', x: TON_DOOR, w: 84, h: 150, floor: 0, label: 'OUT INTO THE COLD', act: 'leave', reach: 46 });
  P.push({ kind: 'tondisplay', x: 176, w: 68, h: 104, floor: 0, label: 'THE PLASTIC FOOD', act: 'display', reach: 40 });
  for (let i = 0; i < TON_SEATS.length; i++) {
    const s = TON_SEATS[i];
    P.push({ kind: 'tonstool', x: s, w: 30, h: 30, floor: 0, n: i,
      label: s === TON_SEAT ? 'SIT DOWN' : null, act: s === TON_SEAT ? 'sit' : null, reach: 30 });
  }
  P.push({ kind: 'tonfridge', x: 908, w: 62, h: 134, floor: 0, label: 'THE BEER FRIDGE', act: 'beer', reach: 46 });
  P.push({ kind: 'tonbin', x: 986, w: 26, h: 40, floor: 0 });
  P.push({ kind: 'tonumbrella', x: 148, w: 22, h: 46, floor: 0 });
  // every counter action is a hidden hitbox: it never draws itself, the room
  // draws it, and the seated hand-cursor is what decides which one is live
  for (let i = 0; i < TON_HAND.length; i++) {
    const h = TON_HAND[i];
    P.push({ kind: 'tonhand', x: h.x, y: h.y, w: 20, h: h.h, floor: 0, hidden: true, act: h.act, label: h.label, reach: 999 });
  }
  return P;
}

function tonProp(S, act) {
  for (let i = 0; i < S.props.length; i++) if (S.props[i].act === act) return S.props[i];
  return null;
}

// Which counter actions are live right now. The order of this list is the
// order left and right walk through, so it reads along the counter.
function tonHandList(S) {
  const T = S.ton, out = [];
  const add = (act) => { const p = tonProp(S, act); if (p) out.push(p); };
  if (T.stage >= 1) {
    if (!T.towel) add('towel');
    add('tea');
  }
  if (T.stage === 1) add('order');
  if (T.stage >= 3 && T.dish && T.bites < T.dish.bites) { add('eat'); add('sauce'); add('cabbage'); }
  if (T.stage >= 1) add('chef');
  if (T.stage >= 4) add('pick');
  if (T.stage >= 4 && !T.paid) add('pay');
  // you can get off the stool before you have ordered, and after you have paid
  if ((T.stage === 1 && !T.dish) || T.stage >= 5) add('stand');
  return out;
}

// He moves along the back of the counter to whatever he is doing next. He
// does not hurry, because he has never in his life needed to.
function tonChefTo(S, x, snap) {
  S.ton.chefTo = x;
  if (snap) S.ton.chefX = x;
}

// ---------- the scripts ----------

// Sitting down. He does not greet you; he puts a towel in front of you, which
// is the same thing said better.
function tonSitScript(S) {
  const T = S.ton;
  tonChefTo(S, TON_SEAT);
  T.busy = 'tea';
  return [
    { who: '', voice: false, at: 'you', think: true, text: 'THE THIRD STOOL. THE WORN ONE.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: { x: TON_SEAT, y: TON_CHEF - 62 }, text: 'MM.',
      do: function () { T.towelUp = true; tonThud(0.7); } },
    { who: '', voice: false, at: 'you', think: true, text: 'A HOT TOWEL. TIGHTLY ROLLED. STEAMING.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: { x: TON_SEAT, y: TON_CHEF - 62 }, text: 'TEA IS COMING. IT IS ALWAYS COMING.',
      do: function () { T.teaLevel = 1; tonPour(); } },
  ];
}

// The order. Four things on the board, and he has opinions about all of them
// that he will not be sharing.
function tonOrderScript(S) {
  const T = S.ton;
  const pick = function (d) {
    return function () {
      T.dish = d; T.stage = 2; T.cook = 0; T.cookT = 0; T.cookK = TON_COOK[0].k;
      T.said = {}; T.hand = 0;
      tonChefTo(S, TON_STATION.board);
      S.flash(d.name + '. ' + fmtMoney(d.price) + '. HE DOES NOT WRITE IT DOWN.');
      Audio.ui('select');
    };
  };
  const beats = [
    { id: 'ask', who: 'THE OLD MAN', voice: 'oldman', at: { x: TON_SEAT, y: TON_CHEF - 62 }, text: 'WELL?',
      choices: TON_DISHES.map(function (d) {
        return { label: d.name, note: fmtMoney(d.price), go: pick(d), next: d.id };
      }).concat([{ label: 'ONE MINUTE', note: 'READ THE WALL AGAIN', next: 'wait' }]) },
    { id: 'wait', who: '', voice: false, at: 'you', think: true, text: 'THE PRICES ARE IN YEN. YOUR HEAD IS STILL IN DOLLARS.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: { x: TON_SEAT, y: TON_CHEF - 62 }, text: 'TAKE YOUR TIME. THE OIL IS HOT ANYWAY.', next: 'end' },
  ];
  for (let i = 0; i < TON_DISHES.length; i++) {
    const d = TON_DISHES[i];
    beats.push({ id: d.id, who: 'THE OLD MAN', voice: 'oldman', at: { x: TON_SEAT, y: TON_CHEF - 62 }, text: d.blurb, next: 'end' });
  }
  beats.push({ id: 'end' });
  return beats;
}

// THE QUESTION. Four beats and a long look at the ceiling. Nothing about this
// is a punchline; he is not embarrassed and he is not lying. He simply does
// not know, and he has made his peace with not knowing, and the peace is the
// part that gets you.
function tonPorkScript(S) {
  const T = S.ton;
  const at = { x: T.chefX, y: TON_CHEF - 62 };
  T.asked = true;
  return [
    { who: 'YOU', voice: 'you', at: 'you', text: 'WHERE IS THE PORK FROM?' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'THE PORK.',
      do: function () { T.look = 5.2; T.busy = null; tonChefTo(S, T.chefX, true); } },
    { who: '', voice: false, at: 'you', think: true, text: 'HE HAS STOPPED. HE IS LOOKING AT THE CEILING.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'I DO NOT KNOW.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'I HAVE NEVER KNOWN. A VAN COMES.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'THIRTY ONE YEARS. THE SAME VAN.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'YOU NEVER ASKED?' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'IT IS BETTER THIS WAY.' },
    { who: '', voice: false, at: 'you', think: true, text: 'HE IS NOT JOKING. HE IS NOT SAD EITHER.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'EAT IT WHILE IT IS HOT.',
      do: function () { T.look = 0; T.busy = 'fryer'; } },
  ];
}

// Everything else he will say, which is a lot less than you would think and
// exactly as much as is needed.
function tonSmallTalk(S) {
  const T = S.ton;
  const at = { x: T.chefX, y: TON_CHEF - 62 };
  const said = T.said || (T.said = {});
  const opts = [];
  // The pork question is its own scene, so it does not branch here: it sets a
  // flag, closes this conversation, and the scene opens the other one.
  if (!T.asked) opts.push({ label: 'WHERE IS THE PORK FROM?', note: 'ASK HIM', next: 'end',
    go: function () { T.wantPork = true; } });
  if (!said.years) opts.push({ label: 'HOW LONG HAVE YOU BEEN HERE?', next: 'years' });
  if (!said.legs) opts.push({ label: 'EIGHT AT ONCE?', next: 'legs' });
  if (!said.tv) opts.push({ label: 'WHO IS WINNING?', next: 'tv' });
  if (!said.cal) opts.push({ label: 'YOUR CALENDAR SAYS MAY.', next: 'cal' });
  if (T.stage === 2) opts.push({ label: 'HOW LONG?', next: 'long' });
  opts.push({ label: 'NOTHING. SORRY.', next: 'end' });
  const beats = [
    { id: 'top', who: 'THE OLD MAN', voice: 'oldman', at: at, text: T.stage === 2 ? 'IT IS IN THE OIL. SIT.' : 'MM?', choices: opts },
  ];
  // each answer is its own little block, ending back at nothing
  const say = function (id, lines, mark) {
    for (let i = 0; i < lines.length; i++) {
      const b = { who: 'THE OLD MAN', voice: 'oldman', at: at, text: lines[i] };
      if (i === 0) { b.id = id; b.do = function () { said[mark] = true; }; }
      if (i === lines.length - 1) b.next = 'end';
      beats.push(b);
    }
  };
  say('years', ['THIRTY ONE YEARS IN MARCH.', 'THE FLOOR WAS DIFFERENT THEN.'], 'years');
  say('legs', ['EIGHT WHAT?', 'OH. I DO NOT COUNT THEM.'], 'legs');
  say('tv', ['HORNETS. THEY ALWAYS ARE.', 'I DO NOT MIND. IT IS ON FOR THE NOISE.'], 'tv');
  say('cal', ['IT IS A GOOD MOUNTAIN.', 'I WILL TURN IT WHEN I AM TIRED OF IT.'], 'cal');
  say('long', ['IT IS READY WHEN IT IS BROWN.', 'THAT IS THE WHOLE OF THE RECIPE.'], 'long');
  beats.push({ id: 'end' });
  return beats;
}

// Paying. He is cheap and then he is cheaper, and the last part is not a
// discount, it is a thing he is doing on purpose and would deny.
function tonPayScript(S) {
  const T = S.ton, d = T.dish;
  const at = { x: T.chefX, y: TON_CHEF - 62 };
  const waved = d.price >= 11 ? 2 : 1;
  const pay = Math.max(0, d.price - waved);
  return [
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: fmtMoney(d.price) + '. ROUND IT DOWN.',
      do: function () { tonChefTo(S, TON_STATION.till); T.busy = 'till'; } },
    { who: 'YOU', voice: 'you', at: 'you', text: 'KEEP THE CHANGE.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'NO.' },
    { who: '', voice: false, at: 'you', think: true, text: 'HE PUTS THE COINS BACK IN YOUR HAND AND CLOSES IT.' },
    { who: 'THE OLD MAN', voice: 'oldman', at: at, text: 'COME BACK. I MEAN IT.',
      do: function () { tonSettle(S, pay); } },
    { who: '', voice: false, at: 'you', think: true, text: 'HE MEANS IT.' },
  ];
}

// What the meal actually did to you, once the talking is over.
function tonSettle(S, pay) {
  const T = S.ton, r = Game.run;
  T.paid = true; T.stage = 5; T.hand = 0;
  Audio.ui('cash');
  if (!r) { S.flash('PAID. WARM. FULL.'); return; }
  r.money = Math.max(0, r.money - pay);
  // the big restore: this is the cheapest stamina in the game and it should be
  r.rest(96);
  for (let i = 0; i < r.members.length; i++) {
    const m = r.members[i];
    m.stamina = Math.min(100, (m.stamina || 0) + 34);
    m.hunger = 0;
  }
  // the small buff: not power, steadiness. You are not hungry any more.
  r.buffs = r.buffs || {};
  r.buffs.window = Math.max(r.buffs.window || 1, 1.08);
  r.gratitude = (r.gratitude || 0) + 1;
  // and his number, if the phone knows what to do with it
  if (typeof CONTACTS !== 'undefined' && CONTACTS.tonkatsu && r.contacts && r.contacts.indexOf('tonkatsu') < 0) {
    r.contacts.push('tonkatsu');
    S.flash('HE WRITES A NUMBER ON A TOOTHPICK WRAPPER.  NEW CONTACT');
  } else {
    S.flash('PAID ' + fmtMoney(pay) + '. +96 STAMINA. STEADIER HANDS.');
  }
  if (typeof checkGoals === 'function') checkGoals(r);
  r.save();
}

// The old man's number, added only if the phone's contact book exists and is
// shaped the way it was when this was written.
if (typeof CONTACTS !== 'undefined' && !CONTACTS.tonkatsu) {
  CONTACTS.tonkatsu = {
    name: 'THE OLD SPIDER', who: 'THE KATSU COUNTER', icon: 'food', tint: '#e8b45a',
    desc: 'Feeds the band off the books. Nobody asks what it is.',
    use: function (s, log) {
      for (let i = 0; i < s.members.length; i++) { s.members[i].stamina = 100; s.members[i].hunger = 0; }
      s.rest(120);
      s.buffs = s.buffs || {};
      s.buffs.window = Math.max(s.buffs.window || 1, 1.08);
      log('He is already frying when you come through the noren. Nobody pays. (Everyone full, steadier hands)');
    },
  };
}

// ==========================================================================
//  THE DEFINITION
// ==========================================================================
function tonkatsuDef(opts) {
  return {
    name: 'KATSU - SIX SEATS', sub: 'NO SIGN OUTSIDE. THAT IS THE SIGN.', tint: '#8a4a1a',
    w: TON_W, zoom: 1.3, yBias: 0.80, heroScale: 1.25, speed: 100,
    // Escape does not get to walk out on a man who is already frying for you.
    // The class routes it through the door, which says so and refuses.
    freeFloors: false, canLeave: false,
    start: { x: (opts && opts.at != null) ? opts.at : 150, floor: 0 },
    floors: [{ y: TON_Y, z: 1 }],
    props: tonProps(),
    npcs: [],
    enterLine: 'THE DOOR RATTLES. SOMETHING IS ALREADY FRYING.',
    sky: function (ctx) { rect(ctx, 0, 0, W, H, '#1a1410'); },

    init: function (S) {
      S.ton = {
        stage: 0,          // 0 standing, 1 seated, 2 cooking, 3 eating, 4 finished, 5 paid
        hand: 0,
        dish: null, cook: 0, cookT: 0, cookK: null,
        basket: 0, steam: 0,
        towel: false, towelUp: false, teaLevel: 0, teaPours: 0,
        bites: 0, cabbage: 0, sauce: 0, sauceT: -9, sauced: false, pick: false,
        asked: false, paid: false, look: 0, said: {},
        chefX: TON_STATION.idle, chefTo: TON_STATION.idle, busy: 'wipe',
        hum: 0, humI: 0, sizzle: 0, chop: 0,
        line: '', lineT: 0,
      };
      if (opts && opts.at != null) { S.body.x = opts.at; S.cam.snapTo(S.body.x, S.floorY(S.body.fk)); }
      Voice.chime('shop');
    },

    tick: function (S, dt) {
      const T = S.ton;
      // while you are on the stool you are on the stool
      if (T.stage >= 1) { S.body.x = TON_SEAT; S.body.vx = 0; S.body.face = 1; S.body.moving = false; }
      // he drifts to whatever he is doing next, at the speed of a man of his age
      const d = T.chefTo - T.chefX;
      if (Math.abs(d) > 1) T.chefX += clamp(d, -58 * dt, 58 * dt);
      // the invisible hitbox that puts the TALK prompt over his actual head
      const cp = tonProp(S, 'chef');
      if (cp) { cp.x = T.chefX; cp.y = TON_CHEF - 4; }
      if (T.look > 0) T.look -= dt;
      T.steam = Math.max(0, T.steam - dt * 0.05);
      T.lineT = Math.max(0, T.lineT - dt);

      // ---- the fryer is always on, and it is always saying so
      T.sizzle -= dt;
      if (T.sizzle <= 0) { T.sizzle = T.basket > 0.5 ? 0.11 : 0.34; tonSizzle(T.basket > 0.5 ? 1.6 : 0.6); }
      // ---- and he hums, badly, when he has nothing to say
      T.hum -= dt;
      if (T.hum <= 0 && !S.dlg) { T.hum = T.stage === 2 ? 0.62 : 1.9; tonHum(T.humI++, T.stage === 2 ? 0.17 : 0.1); }

      if (T.stage !== 2) { T.basket += (0 - T.basket) * Math.min(1, dt * 3); return; }

      // ---- THE COOK. Ten stages, each with its own noise and its own leg.
      const st = TON_COOK[T.cook];
      T.cookT += dt;
      T.cookK = st.k;
      T.basket += (((st.k === 'fry' || st.k === 'in') ? 1 : 0) - T.basket) * Math.min(1, dt * (st.k === 'in' ? 2.4 : 4));
      T.busy = st.at === 'fryer' ? 'fryer' : st.k === 'slice' ? 'slice' : st.at === 'board' ? 'cabA' : 'wipe';
      tonChefTo(S, TON_STATION[st.at]);
      if (st.k === 'slice') {
        T.chop -= dt;
        if (T.chop <= 0) { T.chop = 0.24; tonChop(); }
      }
      if (T.cookT >= st.secs) {
        T.cookT = 0; T.cook++;
        if (T.cook >= TON_COOK.length) {
          // it is in front of you. It is enormous. It cost nine dollars.
          T.stage = 3; T.steam = 1; T.hand = 0;
          T.cookK = null; T.busy = 'wipe';
          tonChefTo(S, TON_STATION.idle);
          Audio.ui('pop'); tonThud(1);
          S.cam.kick(2, 0.14);
          S.flash(T.dish.name + '. IT IS THE SIZE OF A PAPERBACK.');
          S.say('THE OLD MAN', 'SAUCE IS THERE. CABBAGE IS FREE.', 'oldman');
        } else {
          const n = TON_COOK[T.cook];
          if (n.k === 'in') { tonThud(1.2); S.cam.kick(1.6, 0.12); }
          if (n.k === 'out') tonThud(0.6);
          if (n.k !== 'fry') Audio.ui('type');
          T.line = n.line; T.lineT = 2.0;
        }
      }
    },

    // ---- everything behind the counter, drawn strictly back to front
    mid: function (ctx, S, t) {
      const T = S.ton;
      const x0 = S.cam.wx(-60), x1 = S.cam.wx(W + 60);
      tonWall(ctx, x0, x1, t);
      tonFloor(ctx, x0, x1, t);
      // the window onto the street, cold and blue, with the evening in it
      rect(ctx, 136, 150, 128, 152, '#3a3428');
      rect(ctx, 142, 156, 116, 140, TON_PAL.night);
      ctx.globalAlpha = 0.5; vgrad(ctx, 142, 156, 116, 140, '#2a3f5e', '#0e1620'); ctx.globalAlpha = 1;
      neonStrip(ctx, 152, 168, 14, 76, '#ff5a9a', t, 31);
      neonStrip(ctx, 230, 176, 12, 62, '#8ad8ff', t, 77);
      // somebody going past outside who is not coming in
      const pw = ((t * 26) % 260) - 40;
      ctx.globalAlpha = 0.5;
      rect(ctx, 154 + pw * 0.4, 246, 9, 24, '#1b2230');
      circle(ctx, 158 + pw * 0.4, 242, 5, '#1b2230');
      ctx.globalAlpha = 1;
      rect(ctx, 142, 274, 116, 22, '#1a2430');
      ctx.globalAlpha = 0.25; rect(ctx, 142, 274, 116, 3, '#6a8ab0'); ctx.globalAlpha = 1;
      rect(ctx, 136, 298, 128, 6, TON_PAL.woodLo);
      rect(ctx, 136, 298, 128, 2, TON_PAL.wood);
      // the condensation on the inside of it, because it is warm in here
      ctx.globalAlpha = 0.18;
      const rr = makeRng(88);
      for (let i = 0; i < 40; i++) rect(ctx, 144 + rr.range(0, 112), 158 + rr.range(0, 60), 2, 2, '#ffffff');
      ctx.globalAlpha = 1;

      tonMenuWall(ctx, 268, t);
      tonCalendar(ctx, 862, 150, t);
      tonTV(ctx, 936, 96, t, S);
      // the back bench and the machines standing on it
      rect(ctx, 240, TON_BACK, 620, 8, TON_PAL.steelLo);
      rect(ctx, 240, TON_BACK, 620, 3, TON_PAL.steel);
      tonRice(ctx, 632, TON_BACK, t);
      tonFridge(ctx, 908, TON_Y, t);
      tonNeko(ctx, 826, 300, t);

      // ---- HIM. Behind the counter, in the middle of eight jobs.
      const busy = T.look > 0 ? null : T.busy;
      drawSpiderChef(ctx, T.chefX, TON_CHEF, t, busy);
      // when he is looking at the ceiling, everything else stops with him
      if (T.look > 0) {
        ctx.globalAlpha = 0.25 + 0.1 * Math.sin(t * 2);
        for (let i = 0; i < 3; i++) rect(ctx, T.chefX - 1, TON_CHEF - 78 - i * 7, 2, 4, '#e8e2d4');
        ctx.globalAlpha = 1;
      }

      // ---- the working end of the counter, in front of him
      tonFryer(ctx, TON_STATION.fryer, TON_BACK + 34, t, S);
      tonRack(ctx, TON_STATION.rack, TON_BACK + 26, t, S);
      tonCabbage(ctx, 540, TON_BACK + 30, t, S);
      tonBoard(ctx, TON_STATION.board, TON_BACK + 32, t, S);
      tonTill(ctx, TON_TILL, TON_CT + 2, t);

      // ---- the counter itself, and everything standing on it
      tonCounterSlab(ctx, t);
      tonSauceRack(ctx, TON_SEAT + 46, TON_CT + 8, t, T.sauceT, T.sauced);
      tonToothpicks(ctx, TON_SEAT + 94, TON_CT + 8, t, T.pick);
      tonSauceRack(ctx, TON_SEAT + 250, TON_CT + 8, t, -9, false);
      tonToothpicks(ctx, TON_SEAT + 210, TON_CT + 8, t, false);
      if (T.towelUp) tonOshibori(ctx, TON_SEAT - 58, TON_CT + 8, t, T.towel);
      if (T.teaLevel > 0) tonTeacup(ctx, TON_SEAT - 32, TON_CT + 10, t, T.teaLevel);
      if (T.stage >= 3) tonPlate(ctx, TON_SEAT + 24, TON_CT + 11, t, T);
      // the small pot of tea he leaves out for whoever wants it
      rect(ctx, TON_CX0 + 28, TON_CT - 4, 20, 14, '#4a3226');
      rect(ctx, TON_CX0 + 28, TON_CT - 4, 20, 2, '#6c4d38');
      rect(ctx, TON_CX0 + 46, TON_CT + 1, 7, 3, '#4a3226');
      rect(ctx, TON_CX0 + 34, TON_CT - 9, 8, 5, '#4a3226');
    },

    // in front of everybody: the hood over the fryer, the noren, the light
    fore: function (ctx, S, t) {
      // The extractor hood, big and black, hanging low enough that he ducks
      // under it and you can see him decide not to mind.
      rect(ctx, 298, 40, 36, 52, '#454b53');          // the duct, up and gone
      rect(ctx, 298, 40, 6, 52, '#5c636c');
      rect(ctx, 294, 84, 44, 6, '#3a3f46');
      rect(ctx, 232, 88, 200, 42, '#3a3f46');
      rect(ctx, 232, 88, 200, 4, '#5c636c');
      rect(ctx, 236, 94, 192, 2, '#2e333a');
      rect(ctx, 232, 124, 200, 7, '#23272d');
      rect(ctx, 232, 130, 200, 2, '#14171b');
      // the grease filters: six dull steel louvres, the end two darker with it
      for (let i = 0; i < 6; i++) {
        const fx2 = 238 + i * 32;
        rect(ctx, fx2, 98, 28, 25, i < 1 || i > 4 ? '#4a5058' : '#5a6068');
        rect(ctx, fx2, 98, 28, 2, '#7c848e');
        for (let s2 = 0; s2 < 5; s2++) rect(ctx, fx2 + 2, 101 + s2 * 4, 24, 2, '#3f454c');
        ctx.globalAlpha = 0.18; rect(ctx, fx2 + 2, 101, 24, 20, '#2a1c0a'); ctx.globalAlpha = 1;
      }
      // the strip under the front lip. This is the light that is on his hands.
      ctx.globalAlpha = 0.92; rect(ctx, 238, 122, 188, 2, '#ffeec8'); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.09 + 0.012 * Math.sin(t * 3);
      ellipsePx(ctx, 332, 220, 118, 110, '#ffd9a0');
      ctx.globalAlpha = 1;
      // the smoke it is supposed to be taking away, most of which it is
      for (let i = 0; i < 4; i++) {
        const k = ((t * 0.26 + i * 0.25) % 1);
        ctx.globalAlpha = (1 - k) * 0.12;
        ellipsePx(ctx, 280 + i * 34, 178 - k * 42, 14 + k * 12, 8 + k * 7, '#cfc8b8');
        ctx.globalAlpha = 1;
      }
      // the three bulbs down the counter, and the pools they put on the wood
      for (let i = 0; i < 3; i++) {
        const lx = [470, 650, 812][i];
        rect(ctx, lx - 1, 96, 2, 28, '#3a3f46');
        ellipsePx(ctx, lx, 128, 13, 7, '#6a5a3a');
        ellipsePx(ctx, lx, 126, 13, 6, '#8a7548');
        rect(ctx, lx - 13, 126, 26, 1, '#b49a62');
        ctx.globalAlpha = 0.85; ellipsePx(ctx, lx, 132, 6, 3, '#fff2c8'); ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.1 + 0.015 * Math.sin(t * 2 + i);
        ellipsePx(ctx, lx, 240, 66, 120, '#ffe0a0');
        ctx.globalAlpha = 1;
      }
      // the noren, hanging in the doorway, and the cold coming in under it
      tonNoren(ctx, TON_DOOR, 240, t);
    },

    after: function (ctx, S, t) {
      grade(ctx, 0, 0, W, H, '#c88a3a', 0.1);
      vignette(ctx, 0.5, '#100a06');
    },

    overlay: function (ctx, S, t) {
      const T = S.ton;
      // the only UI in the room: what he is doing, while he is doing it
      if (T.stage === 2) {
        const k = (T.cook + clamp(T.cookT / TON_COOK[T.cook].secs, 0, 1)) / TON_COOK.length;
        const w = 240, x = W / 2 - w / 2, y = H - 46;
        ctx.globalAlpha = 0.8; rect(ctx, x, y, w, 24, 'rgba(10,8,6,0.85)'); ctx.globalAlpha = 1;
        frame(ctx, x, y, w, 24, '#8a6a30');
        rect(ctx, x + 2, y + 18, Math.round((w - 4) * k), 4, '#e8a84a');
        rect(ctx, x + 2, y + 18, Math.round((w - 4) * k), 1, '#ffd97a');
        drawText(ctx, TON_COOK[T.cook].line, x + w / 2, y + 5, '#f4e0b8', { align: 'center', scale: 2 });
      }
      if (T.stage >= 3 && T.dish && T.bites < T.dish.bites) {
        const left = T.dish.bites - T.bites;
        drawText(ctx, left + ' LEFT', W - 16, H - 40, '#e8c48a', { align: 'right', font: 'small' });
      }
      // the hint that the counter is a list, said once and then never again
      if (T.stage === 1 && S.t < 16 && !S.dlg) {
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3);
        drawText(ctx, Game.touch ? '< >  ALONG THE COUNTER' : 'LEFT / RIGHT ALONG THE COUNTER', W / 2, H - 70, '#cfc9b6', { align: 'center', font: 'small' });
        ctx.globalAlpha = 1;
      }
    },

    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'tondoor': {
          // a sliding aluminium door with frosted glass and the cold behind it
          rect(ctx, p.x - 44, base - 150, 88, 150, '#6a6a72');
          rect(ctx, p.x - 40, base - 146, 80, 142, '#2a3440');
          ctx.globalAlpha = 0.45; vgrad(ctx, p.x - 40, base - 146, 80, 142, '#9fc4d8', '#2a3440'); ctx.globalAlpha = 1;
          rect(ctx, p.x - 2, base - 146, 4, 142, '#8a8f98');
          rect(ctx, p.x - 40, base - 92, 80, 4, '#8a8f98');
          for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.1; rect(ctx, p.x - 38 + i * 17, base - 144, 7, 138, '#ffffff'); ctx.globalAlpha = 1; }
          rect(ctx, p.x + 10, base - 82, 5, 20, '#cfd6de');
          rect(ctx, p.x - 44, base - 4, 88, 4, '#4a4a52');
          // the grubby red plastic step, and the umbrella stand beside it
          rect(ctx, p.x - 30, base - 8, 60, 6, '#8a3a2a');
          rect(ctx, p.x - 30, base - 8, 60, 2, '#b04a34');
          ctx.globalAlpha = 0.26; rect(ctx, p.x - 44, base - 2, 88, 4, '#15140f'); ctx.globalAlpha = 1;
          return true;
        }
        case 'tondisplay': tonDisplay(ctx, p.x, base, t); return true;
        case 'tonstool': tonStool(ctx, p.x, base, p.n, p.x === TON_SEAT); return true;
        case 'tonfridge': return true;      // drawn in mid, behind the counter line
        case 'tonbin': {
          ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base + 1, 15, 4, '#15140f'); ctx.globalAlpha = 1;
          rect(ctx, p.x - 13, base - 40, 26, 40, '#4a5260');
          rect(ctx, p.x - 15, base - 42, 30, 5, '#6a7280');
          rect(ctx, p.x - 10, base - 34, 20, 30, '#3a4250');
          return true;
        }
        case 'tonumbrella': {
          ctx.globalAlpha = 0.28; ellipsePx(ctx, p.x, base + 1, 13, 4, '#15140f'); ctx.globalAlpha = 1;
          rect(ctx, p.x - 11, base - 40, 22, 40, '#5a6068');
          rect(ctx, p.x - 11, base - 40, 22, 3, '#8a9098');
          for (let i = 0; i < 3; i++) {
            rect(ctx, p.x - 7 + i * 6, base - 62, 3, 24, ['#2f4a68', '#3a3550', '#6a4a2a'][i]);
            rect(ctx, p.x - 7 + i * 6, base - 64, 3, 4, '#8a8f98');
          }
          return true;
        }
      }
      return false;
    },

    // ---- what the button does
    use: function (S, p) {
      const T = S.ton, r = Game.run;
      switch (p.act) {
        case 'leave': {
          // he is not going to stop you. He is simply going to say a thing
          // that makes leaving impossible.
          if (T.dish && !T.paid) { Audio.ui('error'); S.say('THE OLD MAN', 'IT IS IN THE OIL. SIT DOWN.', 'oldman'); return; }
          S.leave(null, 'fade', { dur: 0.7 });
          return;
        }
        case 'display': {
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'THE PLASTIC KATSU HAS FADED ORANGE.' },
            { who: '', voice: false, at: 'you', think: true, text: 'IT HAS BEEN ON THAT PLATE SINCE 1994.' },
            { who: '', voice: false, at: 'you', think: true, text: 'YOU WANT IT ANYWAY.' },
          ]);
          return;
        }
        case 'beer': {
          if (!r) { S.say('YOU', 'NOT TONIGHT.', 'you'); return; }
          if (r.money < 4) { Audio.ui('error'); S.flash('FOUR DOLLARS. YOU DO NOT HAVE FOUR DOLLARS.'); return; }
          r.money -= 4; r.rest(10); r.save();
          Audio.ui('coin');
          S.flash('A TALL ONE, OPENED ON THE COUNTER EDGE. -$4');
          S.say('THE OLD MAN', 'GLASS IS BEHIND YOU. USE THE GLASS.', 'oldman');
          return;
        }
        case 'sit': {
          if (T.stage >= 1) return;
          T.hand = 0;
          S.body.x = TON_SEAT; S.body.vx = 0;
          Audio.ui('select'); tonThud(0.5);
          S.cam.focus(TON_SEAT + 30, TON_CT + 42, 1.42);
          if (T.sat) {
            // getting back on the stool does not start the evening over
            T.stage = T.paid ? 5 : 1;
            S.cam.release(1.3);
            S.flash('BACK ON THE STOOL. THE TEA IS STILL THERE.');
            return;
          }
          T.sat = true; T.stage = 1;
          S.run(tonSitScript(S), function () { S.cam.release(1.3); });
          return;
        }
        case 'stand': {
          T.stage = 0; T.hand = 0;
          S.cam.release(1.3);
          Audio.ui('back');
          S.flash('YOU GET DOWN OFF THE STOOL. YOUR LEGS DISAGREE.');
          return;
        }
        case 'towel': {
          if (T.towel) return;
          T.towel = true;
          Audio.ui('pop');
          S.run([
            { who: '', voice: false, at: 'you', think: true, text: 'TOO HOT. THE RIGHT AMOUNT OF TOO HOT.' },
            { who: '', voice: false, at: 'you', think: true, text: 'HANDS. THEN THE BACK OF YOUR NECK.' },
            { who: '', voice: false, at: 'you', think: true, text: 'TEN HOURS OF AEROPLANE COMES OFF IN ONE GO.' },
          ], function () {
            if (r) { r.rest(8); r.save(); }
            S.flash('+8 STAMINA. IT IS ONLY A TOWEL.');
          });
          return;
        }
        case 'tea': {
          if (T.teaLevel <= 0.05) {
            T.teaLevel = 1; T.teaPours++;
            tonPour(); T.busy = 'tea';
            S.flash(T.teaPours > 2 ? 'HE FILLS IT AGAIN WITHOUT LOOKING.' : 'HOT. GREEN. FREE.');
            return;
          }
          T.teaLevel = Math.max(0, T.teaLevel - 0.5);
          Audio.ui('eat');
          if (r) { r.rest(3); }
          S.flash(T.teaLevel <= 0.05 ? 'EMPTY. IT WILL NOT BE EMPTY LONG.' : 'IT SCALDS THE ROOF OF YOUR MOUTH. WORTH IT.');
          return;
        }
        case 'order': {
          if (T.stage !== 1) return;
          S.run(tonOrderScript(S));
          return;
        }
        case 'chef': {
          if (T.stage === 1 && !T.dish) { S.run(tonOrderScript(S)); return; }
          T.wantPork = false;
          S.run(tonSmallTalk(S), function () {
            // the pork question is its own scene, so it gets its own run
            if (S.ton.wantPork) { S.ton.wantPork = false; S.run(tonPorkScript(S)); }
          });
          return;
        }
        case 'sauce': {
          // the bottle is full and will not pour. It takes three whacks. It
          // always takes three whacks. Everybody in here knows about it.
          if (T.sauced) { S.flash('IT IS ALREADY DROWNED. LEAVE IT.'); return; }
          T.sauce++; T.sauceT = S.t;
          tonThud(1.1); S.cam.kick(1.6, 0.1);
          if (T.sauce >= 3) {
            T.sauced = true;
            Audio.ui('pop');
            S.fx.burst(S.cam.sx(TON_SEAT + 24), S.cam.sy(TON_CT - 4), 10, { color: ['#5a3010', '#8a5a28'], speed: 50, life: 0.5, size: 2, gravity: 180 });
            S.flash('ALL OF IT AT ONCE. OF COURSE.');
            S.say('THE OLD MAN', 'EVERYBODY DOES THAT.', 'oldman');
          } else {
            S.flash(T.sauce === 1 ? 'NOTHING. NOT A DROP.' : 'STILL NOTHING. HARDER.');
          }
          return;
        }
        case 'cabbage': {
          T.cabbage++;
          T.busy = 'cabB';
          Audio.ui('pop');
          if (r) { r.rest(5); }
          if (T.cabbage === 1) S.flash('HE REFILLS IT BEFORE YOU FINISH ASKING.');
          else if (T.cabbage === 3) { S.say('THE OLD MAN', 'IT IS FREE. IT IS ALWAYS FREE.', 'oldman'); }
          else if (T.cabbage >= 5) S.flash('THERE IS MORE CABBAGE. THERE IS ALWAYS MORE CABBAGE.');
          else S.flash('MORE CABBAGE. +5 STAMINA.');
          return;
        }
        case 'eat': {
          if (!T.dish || T.bites >= T.dish.bites) return;
          T.bites++;
          T.steam = Math.max(0, T.steam - 0.18);
          Audio.ui('eat');
          S.cam.kick(1.2, 0.08);
          S.fx.burst(S.cam.sx(TON_SEAT + 14), S.cam.sy(TON_CT - 6), 5, { color: ['#ffd97a', '#f0c46a'], speed: 40, life: 0.4, size: 2, gravity: 120 });
          const gain = Math.round(T.dish.st * (T.sauced ? 1.12 : 1));
          if (r) { r.rest(gain); }
          const lines = [
            'THE CRUST GOES FIRST. IT SHATTERS.',
            'NOBODY WARNED YOU IT WOULD BE THIS GOOD.',
            'CABBAGE. RICE. BACK TO THE KATSU.',
            'YOU HAVE STOPPED THINKING ABOUT MONEY.',
            'THE MUSTARD IS A MISTAKE AND YOU KEEP DOING IT.',
            'YOU ARE NOT IN A HURRY ANY MORE.',
            'THERE IS NONE LEFT. THAT IS NOT FAIR.',
          ];
          S.flash(lines[Math.min(lines.length - 1, T.bites - 1)] + '  +' + gain);
          if (T.bites >= T.dish.bites) {
            T.stage = 4; T.hand = 0;
            tonChefTo(S, TON_SEAT); T.busy = 'wipe';
            S.run([
              { who: '', voice: false, at: 'you', think: true, text: 'THE PLATE IS EMPTY AND SO IS THE BOWL.' },
              { who: 'THE OLD MAN', voice: 'oldman', at: { x: TON_SEAT, y: TON_CHEF - 62 }, text: 'MM.' },
            ], function () { S.flash('PAY WHEN YOU WANT. HE IS NOT WATCHING.'); });
          }
          return;
        }
        case 'pick': {
          T.pick = true;
          Audio.ui('move');
          S.flash('YOU TAKE ONE AND DO NOT USE IT. IT LIVES IN YOUR POCKET NOW.');
          return;
        }
        case 'pay': {
          if (T.paid || !T.dish) return;
          S.run(tonPayScript(S));
          return;
        }
      }
    },
  };
}

// ==========================================================================
//  THE SCENE
// ==========================================================================
// The only things the class adds on top of the definition: sitting down means
// your legs stop being the controls and the counter becomes the controls, and
// a seated bug has to be drawn sitting or the whole room reads wrong.
class TonkatsuScene extends SideScene {
  constructor(opts) {
    super(tonkatsuDef(opts || {}), opts || {});
  }

  // On a stool, left and right walk along the counter instead of the floor.
  // On your feet it is the ordinary scan, minus the counter hitboxes, which
  // have an infinite reach and would otherwise win every time.
  findPrompt() {
    const T = this.ton;
    if (T && T.stage >= 1) {
      const list = tonHandList(this);
      if (!list.length) return null;
      T.hand = ((T.hand % list.length) + list.length) % list.length;
      return { kind: 'prop', p: list[T.hand] };
    }
    const b = this.body;
    let best = null, bd = 1e9;
    for (let i = 0; i < this.props.length; i++) {
      const p = this.props[i];
      if (p.kind === 'tonhand') continue;
      if (!p.label && !p.act) continue;
      if (Math.round(p.floor) !== Math.round(b.floor)) continue;
      const d = Math.abs(b.x - p.x) - (p.w || 40) / 2;
      if (d < (p.reach || 34) && d < bd) { bd = d; best = { kind: 'prop', p: p }; }
    }
    return best;
  }

  key(code) {
    const T = this.ton;
    // Escape goes out through the door, which means it gets the door's answer
    if (code === 'Escape' && !this.dlg) { const d = tonProp(this, 'leave'); if (d) this.D.use(this, d); return; }
    if (!this.dlg && T && T.stage >= 1 && this.locked <= 0) {
      if (code === 'ArrowLeft' || code === 'KeyA') { T.hand--; Audio.ui('move'); return; }
      if (code === 'ArrowRight' || code === 'KeyD') { T.hand++; Audio.ui('move'); return; }
      if (code === 'ArrowUp' || code === 'KeyW' || code === 'ArrowDown' || code === 'KeyS') { this.interact(); return; }
    }
    super.key(code);
  }

  pointerDown(x, y, id) {
    const T = this.ton;
    if (this.dlg || !T || T.stage < 1) { super.pointerDown(x, y, id); return; }
    const h = this.input.hit(x, y, id);
    this.input.up(id);
    if (h === 'l') { T.hand--; Audio.ui('move'); return; }
    if (h === 'r') { T.hand++; Audio.ui('move'); return; }
    this.interact();
  }
  pointerMove(x, y, id) {
    const T = this.ton;
    if (T && T.stage >= 1) return;
    super.pointerMove(x, y, id);
  }

  // Sitting: he goes up onto the stool, and his shadow stays on the floor
  // where his feet are not.
  drawHero(ctx) {
    const T = this.ton;
    if (!T || T.stage < 1) { super.drawHero(ctx); return; }
    const b = this.body;
    const eat = T.stage >= 3 && T.dish && T.bites > 0 && T.bites < T.dish.bites;
    const pose = this.dlg ? 'talk' : (T.stage === 2 ? 'idle' : eat ? 'cheer' : 'idle');
    drawShadow(ctx, TON_SEAT, TON_Y + 1, 26 * b.scale, 0.3);
    drawBugAt(ctx, this.you.spec, TON_SEAT, TON_SEATY + 3, {
      pose: pose, scale: b.scale, flip: false, bounce: 0.45, phase: 1.3,
    });
    // an elbow on the counter, which is what the worn patch is made of
    rect(ctx, TON_SEAT + 12, TON_CT + 4, 10, 4, '#4a3c32');
    rect(ctx, TON_SEAT + 12, TON_CT + 4, 10, 1, '#7a6858');
  }
}
