// ---------- Dragon Fly 0808, Las Vegas to Tokyo Narita ----------
// Eleven hours in a tube. You never see the aeroplane from outside, because
// you are in it: three rows stacked into the screen, an aisle you walk down,
// a trolley coming the other way, and a seat-back screen with an advert on it
// that will not let you leave. The plane is the only place in this game where
// nothing is expected of you and there is nowhere to go, which is why it is
// the last time anybody is kind to you for free.
'use strict';

// ---------- what is playing on the seat-back ----------
// Eight films nobody chose and three adverts nobody can skip. The ratings and
// runtimes matter more than the titles: a menu of films is a menu of numbers.
const PLANE_MOVIES = [
  { title: 'THE LAST VOICEMAIL', genre: 'DRAMA', rate: 'PG13', mins: 118, look: 'noir', col: '#3a4f6a', col2: '#c8a03a',
    subs: [[0, 'I KEPT IT. OF COURSE I KEPT IT.'], [5, 'YOU PLAYED IT HOW MANY TIMES?'], [10, 'ENOUGH TO WEAR IT OUT.'], [15, 'TAPES DO NOT WEAR OUT.']] },
  { title: 'ASTEROID COUNTY', genre: 'SCI-FI', rate: 'PG', mins: 132, look: 'space', col: '#1b2450', col2: '#8ad8ff',
    subs: [[0, 'SIGNAL IS COMING FROM THE ROCK.'], [6, 'THE ROCK IS NOT A ROCK.'], [12, 'IT NEVER IS.'], [16, '[ LOW HUM CONTINUES ]']] },
  { title: 'TWO WEEKS IN HANEDA', genre: 'ROMANCE', rate: 'PG', mins: 101, look: 'romance', col: '#7a3a58', col2: '#ffb0c8',
    subs: [[0, 'MY FLIGHT IS AT SIX.'], [5, 'MINE IS AT SEVEN.'], [10, 'THAT IS A WHOLE HOUR.'], [15, 'THAT IS A WHOLE HOUR.']] },
  { title: 'FURY ROUTE NINE', genre: 'ACTION', rate: 'R', mins: 96, look: 'action', col: '#6a2a1c', col2: '#ff9a3a',
    subs: [[0, 'GET OFF THE ROAD!'], [4, '[ ENGINE NOISE ]'], [9, 'I SAID GET OFF THE ROAD!'], [14, '[ SOMETHING LARGE EXPLODES ]']] },
  { title: 'BEETLE BUDDIES 3', genre: 'FAMILY', rate: 'U', mins: 88, look: 'kids', col: '#2f7a4a', col2: '#ffd24a',
    subs: [[0, 'FRIENDSHIP IS A KIND OF GLUE!'], [5, 'IT IS ACTUALLY GLUE.'], [10, 'THAT IS THE WHOLE PLOT.'], [15, 'SING IT WITH ME!']] },
  { title: 'THE THING IN THE HOLD', genre: 'HORROR', rate: 'R', mins: 104, look: 'horror', col: '#241d33', col2: '#c8402c',
    subs: [[0, 'CARGO SAYS THE BOX IS EMPTY.'], [6, 'CARGO IS WRONG A LOT.'], [11, '[ SOMETHING MOVES BELOW ]'], [16, 'DO NOT OPEN THE BOX.']] },
  { title: 'SALT: A HISTORY', genre: 'DOCUMENTARY', rate: 'U', mins: 74, look: 'doc', col: '#5a5a48', col2: '#f4f1ea',
    subs: [[0, 'SALT BUILT EVERY ROAD YOU KNOW.'], [7, 'IT PAID EVERY SOLDIER ON THEM.'], [13, 'AND THEN IT BECAME CHEAP.'], [17, 'NOTHING SURVIVES BEING CHEAP.']] },
  { title: 'KAIJU KARAOKE', genre: 'MONSTER', rate: '12', mins: 141, look: 'kaiju', col: '#1f3a3a', col2: '#6be585',
    subs: [[0, 'IT IS HEADING FOR THE HARBOUR.'], [6, 'IT IS HEADING FOR THE BAR.'], [11, 'IT HAS BOOKED A ROOM.'], [16, 'IT HAS BOOKED THE BIG ROOM.']] },
];
// Three adverts on a loop. The skip counter is the joke: it counts down, then
// thinks better of it. Nobody in the history of flight has skipped one.
const PLANE_ADS = [
  { name: 'COLONY MART', tag: 'OPEN. ALWAYS. EVEN NOW.', col: '#2f8f4a', col2: '#f4f1ea', look: 'store',
    lines: [[0.4, 'YOU ARE NEVER MORE THAN'], [2.4, 'NINETY SECONDS FROM A COLONY MART.'], [5.2, 'EGG SANDWICH. HOT CAN. UMBRELLA.'], [8.2, 'COLONY MART. WE ARE ALREADY OPEN.']] },
  { name: 'NOCTURNE', tag: 'GENEVE - SINCE 1861', col: '#c8a03a', col2: '#12101c', look: 'watch',
    lines: [[0.4, 'YOU DO NOT OWN A NOCTURNE.'], [3.4, 'YOU LOOK AFTER IT'], [5.0, 'FOR THE NEXT BUG.'], [8.4, 'NOCTURNE. SOMEBODY ELSE WILL WEAR IT.']] },
  { name: 'ROYAL JELLY GOLD', tag: 'DRINK THE FUTURE', col: '#e8a020', col2: '#3a2a08', look: 'bottle',
    lines: [[0.4, 'SIX VITAMINS. ONE OF THEM IS REAL.'], [3.6, 'DRINK THE FUTURE.'], [6.0, 'THE FUTURE IS SLIGHTLY THICK.'], [8.6, 'ROYAL JELLY GOLD. NOW WITH LESS.']] },
];
// The home screen. Six tiles, and only four of them do anything, which is
// exactly the right ratio for an aeroplane.
const PLANE_TV_HOME = [
  { key: 'movies', name: 'MOVIES', ic: 'film', col: '#c8402c' },
  { key: 'music', name: 'MUSIC', ic: 'note', col: '#8a4ac8' },
  { key: 'map', name: 'FLIGHT MAP', ic: 'globe', col: '#2f6fc0' },
  { key: 'games', name: 'GAMES', ic: 'pad', col: '#2f8f4a' },
  { key: 'safety', name: 'SAFETY', ic: 'vest', col: '#e0b23c' },
  { key: 'shop', name: 'SHOP', ic: 'bag', col: '#b0446a' },
];
const PLANE_MUSIC = [
  { ch: 'CH 1', name: 'CLASSICAL FOR TAKEOFF', now: 'NOCTURNE IN E FLAT' },
  { ch: 'CH 2', name: 'TOKYO CITY POP', now: 'MIDNIGHT EXPRESSWAY' },
  { ch: 'CH 3', name: 'JAZZ FOR ONE', now: 'NOBODY CAME IN TONIGHT' },
  { ch: 'CH 4', name: 'RELAX AND BREATHE', now: 'RAIN ON A WINDOW (58 MIN)' },
  { ch: 'CH 5', name: 'KIDS SING ALONG', now: 'THE GLUE SONG' },
  { ch: 'CH 6', name: 'DRAGON FLY THEME', now: 'THE LONG WAY ROUND' },
];
const PLANE_GAMES = ['SKY SOLITAIRE', 'CARGO TETRIS', 'TRIVIA: WORLD CAPITALS', 'CHESS (EASY)'];
const PLANE_DUTY = [
  { name: 'NOCTURNE WATCH', price: 4200, note: 'SOLD OUT' },
  { name: 'ROYAL JELLY GOLD', price: 9, note: '' },
  { name: 'DF MODEL PLANE', price: 24, note: '' },
  { name: 'CIGARS (6)', price: 48, note: 'SOLD OUT' },
  { name: 'NECK PILLOW', price: 14, note: '' },
  { name: 'DF PLAYING CARDS', price: 6, note: '' },
];
// which advert you get is whichever one you have not had yet
let plAdTurn = 0;

// ---------- the cabin, drawn from the inside ----------
const PLANE_W = 1900;
const PLANE_SEAT_X0 = 160, PLANE_SEAT_PITCH = 94, PLANE_SEAT_N = 15, PLANE_SEAT_SKIP = 11;
const PLANE_CAM_Y = 30;                // the cabin never moves: only your row does

// The roof, which on a real aircraft is a series of flat panels pretending to
// be a curve. Drawn the same way here, because that is what it is.
function plCeiling(ctx, S, t, x0, x1) {
  const P = S.PL;
  rect(ctx, x0, -120, x1 - x0, 210, '#1a1c28');
  // the vault, four bands stepping down to the sides
  const bands = [[6, '#3f4354'], [16, '#353948'], [30, '#2c303e'], [48, '#252834']];
  for (let i = 0; i < bands.length; i++) rect(ctx, x0, bands[i][0], x1 - x0, 14, bands[i][1]);
  rect(ctx, x0, 4, x1 - x0, 2, '#565c72');
  // the centre light strip, dimmed for the night crossing and dimmed further
  // once they start the descent
  const lit = 0.34 * (1 - P.dim);
  ctx.globalAlpha = 0.5 + lit;
  rect(ctx, x0, 20, x1 - x0, 5, mixColor('#2a2f3e', '#ffe9b0', 0.35 + lit));
  ctx.globalAlpha = 1;
  // the joins between panels, every eight feet or so
  for (let x = Math.floor(x0 / 64) * 64; x < x1; x += 64) {
    ctx.globalAlpha = 0.35; rect(ctx, x, 6, 1, 62, '#12141c'); ctx.globalAlpha = 1;
  }
}
// The lockers. Some are open because somebody has been up to them twice
// already and is going to go up again before the seatbelt sign.
function plBins(ctx, S, t, x0, x1) {
  const P = S.PL;
  const top = 74, h = 58;
  rect(ctx, x0, top - 6, x1 - x0, h + 10, '#2f3342');
  for (let i = Math.floor(x0 / 92); i < Math.ceil(x1 / 92); i++) {
    const x = i * 92;
    const open = (i % 7 === 3) || (i % 11 === 5);
    rect(ctx, x + 2, top, 88, h, '#4a4f60');
    rect(ctx, x + 2, top, 88, 3, '#6a7084');
    rect(ctx, x + 2, top + h - 3, 88, 3, '#2a2e3a');
    if (open) {
      // the door hinged up, and the bags leaning out of the hole
      rect(ctx, x + 2, top - 22, 88, 22, '#12141c');
      rect(ctx, x + 4, top - 20, 84, 18, '#3a3f4e');
      rect(ctx, x + 2, top + 6, 88, h - 9, '#14161e');
      const cols = ['#2f4a8a', '#8a2a1c', '#6a5a2a', '#2f6a4a'];
      for (let b = 0; b < 3; b++) rect(ctx, x + 8 + b * 27, top + 14, 24, h - 22, cols[(i + b) % 4]);
      for (let b = 0; b < 3; b++) rect(ctx, x + 8 + b * 27, top + 14, 24, 3, '#8a8f98');
    } else {
      rect(ctx, x + 34, top + h - 14, 24, 8, '#22262f');
      rect(ctx, x + 36, top + h - 12, 20, 4, '#9aa0ae');
    }
    // the row number on a little placard under the bin
    drawText(ctx, String(28 + i), x + 8, top + h + 2, withAlpha('#cfd6de', 0.5), { font: 'small' });
  }
  // the service unit: reading lights, air vents, and the two signs that decide
  // whether anybody is allowed to stand up
  const psu = top + h;
  rect(ctx, x0, psu, x1 - x0, 14, '#23262f');
  rect(ctx, x0, psu, x1 - x0, 2, '#3a3f4e');
  for (let x = Math.floor(x0 / 46) * 46; x < x1; x += 46) {
    circle(ctx, x + 12, psu + 7, 3, '#12141c');
    circle(ctx, x + 12, psu + 7, 2, '#3f4654');
    const on = ((x / 46) | 0) % 5 === 2;
    circle(ctx, x + 30, psu + 7, 3, on ? '#ffe9b0' : '#2a2e38');
    if (on) { ctx.globalAlpha = 0.09; ellipsePx(ctx, x + 30, psu + 60, 26, 58, '#ffe9a8'); ctx.globalAlpha = 1; }
  }
  // seatbelt and no-smoking, spaced along the cabin
  for (let x = Math.floor(x0 / 240) * 240; x < x1; x += 240) plSeatbeltSign(ctx, x + 60, psu + 2, P.belt, t);
}
function plSeatbeltSign(ctx, x, y, on, t) {
  rect(ctx, x, y, 44, 12, '#12141c');
  frame(ctx, x, y, 44, 12, '#3a3f4e');
  const a = on ? 0.75 + 0.25 * Math.sin(t * 3) : 0.16;
  ctx.globalAlpha = a;
  rect(ctx, x + 2, y + 2, 18, 8, '#e8a83a');
  rect(ctx, x + 24, y + 2, 18, 8, '#e8503a');
  ctx.globalAlpha = 1;
  // the buckle and the cigarette, as pictograms, because words are expensive
  rect(ctx, x + 6, y + 5, 10, 2, '#12101c');
  rect(ctx, x + 27, y + 5, 12, 2, '#12101c');
  if (on) { ctx.globalAlpha = 0.12; ellipsePx(ctx, x + 22, y + 26, 34, 24, '#ffd24a'); ctx.globalAlpha = 1; }
}
// The wall behind the far row: windows, and whatever is outside them at this
// hour, which for most of the crossing is nothing at all.
function plWall(ctx, S, t, x0, x1) {
  const P = S.PL;
  rect(ctx, x0, 146, x1 - x0, 116, '#3a3f52');
  rect(ctx, x0, 146, x1 - x0, 3, '#535a70');
  rect(ctx, x0, 254, x1 - x0, 6, '#262a36');
  // the sidewall panel joins
  for (let x = Math.floor(x0 / 92) * 92; x < x1; x += 92) { ctx.globalAlpha = 0.3; rect(ctx, x, 150, 1, 104, '#161822'); ctx.globalAlpha = 1; }
  for (let i = Math.floor(x0 / 92); i < Math.ceil(x1 / 92); i++) {
    const x = i * 92 + 46;
    plWindow(ctx, x, 190, t, S, i);
  }
}
// One window: the frame, the shade, the night outside, and once every second
// the wingtip strobe hitting the cloud deck. Never the aeroplane. Just the
// light it throws.
function plWindow(ctx, x, cy, t, S, i) {
  const P = S.PL;
  const rx = 15, ry = 25;
  ellipsePx(ctx, x, cy, rx + 4, ry + 4, '#2a2e3a');
  ellipsePx(ctx, x, cy, rx + 2, ry + 2, '#5a6172');
  const blind = P.shadeDown && i === P.shadeIdx ? 1 : 0;
  ctx.save();
  ctx.beginPath(); ctx.ellipse(x, cy, rx, ry, 0, 0, 6.2832); ctx.clip();
  if (P.land >= 2 && P.landT > 6) {
    // below the cloud, the world turns into orange sodium and standing water
    rect(ctx, x - rx, cy - ry, rx * 2, ry * 2, '#0b1018');
    const r = makeRng(i * 71 + 5);
    for (let k = 0; k < 9; k++) {
      const gx = x - rx + ((r.range(0, rx * 2) + t * 190) % (rx * 2));
      rect(ctx, gx, cy - ry + r.range(6, ry * 1.8), 2, 6, r.chance(0.4) ? '#ffd24a' : '#ff9a3a');
    }
    ctx.globalAlpha = 0.25; rect(ctx, x - rx, cy + ry * 0.4, rx * 2, ry, '#2a3a4a'); ctx.globalAlpha = 1;
  } else {
    vgrad(ctx, x - rx, cy - ry, rx * 2, ry * 2, '#0b1230', '#1d2b52');
    const r = makeRng(i * 31 + 3);
    for (let k = 0; k < 7; k++) px(ctx, x - rx + r.int(0, rx * 2), cy - ry + r.int(0, ry), '#cfd8f0');
    // the cloud deck, moving very slowly because it is eleven miles away
    for (let k = 0; k < 3; k++) {
      const cxx = x - rx + (((k * 23 + i * 13) - t * 5) % (rx * 2 + 30) + rx * 2 + 30) % (rx * 2 + 30);
      ctx.globalAlpha = 0.5;
      ellipsePx(ctx, cxx - 14, cy + ry * 0.42 + k * 3, 14, 4, '#39456e');
      ctx.globalAlpha = 1;
    }
    ctx.globalAlpha = 0.35; ellipsePx(ctx, x, cy + ry * 0.7, rx * 1.4, ry * 0.5, '#46548a'); ctx.globalAlpha = 1;
  }
  // the strobe. one window in five is far enough aft to catch it
  if (i % 5 === 2) {
    const flash = (t % 1.2) < 0.08;
    if (flash) { ctx.globalAlpha = 0.7; ellipsePx(ctx, x + 6, cy + ry * 0.55, 10, 6, '#ff6a5a'); ctx.globalAlpha = 1; px(ctx, x + 6, cy + ry * 0.55, '#fff2e8'); }
  }
  if (blind) { rect(ctx, x - rx, cy - ry, rx * 2, ry * 2, '#4a5060'); rect(ctx, x - rx, cy + ry - 4, rx * 2, 4, '#5f6678'); }
  ctx.restore();
  ellipseRingPx(ctx, x, cy, rx, ry, '#1b1e28');
  // the shade rail and its little tab
  rect(ctx, x - rx - 2, cy - ry - 6, rx * 2 + 4, 4, '#4a5060');
  rect(ctx, x - 4, cy - ry - 3 + blind * (ry * 2), 8, 3, '#6a7080');
  ctx.globalAlpha = 0.14; rect(ctx, x - rx + 2, cy - ry + 3, rx, ry * 0.8, '#ffffff'); ctx.globalAlpha = 1;
}
// One seat, seen from the side, facing the front of the aeroplane. Navy
// fabric, a cream headrest cover with the mark on it, an armrest polished
// down to the metal by eleven years of elbows.
function plSeat(ctx, x, base, z, t, o) {
  o = o || {};
  const s = z;
  const bw = Math.round(24 * s), bh = Math.round(46 * s);
  const bx = Math.round(x + 6 * s), by = Math.round(base - 62 * s);
  const navy = o.dark ? '#141a2c' : '#22305a';
  // the backrest, and the frame behind it
  rect(ctx, bx, by, bw, bh + Math.round(18 * s), '#161c2e');
  rect(ctx, bx + 1, by + 1, bw - 2, bh, navy);
  rect(ctx, bx + 1, by + 1, bw - 2, 2, lighten(navy, 0.16));
  rect(ctx, bx + 1, by + bh - 3, bw - 2, 3, darken(navy, 0.2));
  // the fabric, which is a pattern of tiny gold dashes nobody looks at
  if (s > 0.85) for (let k = 0; k < 5; k++) rect(ctx, bx + 4 + (k % 2) * 8, by + 10 + k * 7, 3, 1, withAlpha('#c8a03a', 0.3));
  // the headrest cover
  const hy = by - Math.round(2 * s), hh = Math.round(16 * s);
  rect(ctx, bx - 2, hy, bw + 4, hh, DF.cream);
  rect(ctx, bx - 2, hy, bw + 4, 2, '#ffffff');
  rect(ctx, bx - 2, hy + hh - 2, bw + 4, 2, '#cfc8b6');
  if (s > 0.8) { const m = dfMark(Math.max(8, Math.round(11 * s)), { flat: true, mono: DF.navy }); ctx.drawImage(m, Math.round(bx + bw / 2 - m.width / 2), Math.round(hy + 3)); }
  // the screen on the back of it, nearly edge on, throwing light backwards
  if (o.screen !== false) {
    const sy = by + Math.round(9 * s), sh2 = Math.round(22 * s);
    rect(ctx, bx + bw, sy, Math.max(2, Math.round(3 * s)), sh2, '#0b0e16');
    const glow = o.screenOff ? '#1b2230' : (o.screenCol || '#4a86f7');
    ctx.globalAlpha = o.screenOff ? 0.4 : 0.7 + 0.25 * Math.sin(t * 9 + x);
    rect(ctx, bx + bw + 1, sy + 1, Math.max(1, Math.round(2 * s)), sh2 - 2, glow);
    ctx.globalAlpha = 1;
    if (!o.screenOff) { ctx.globalAlpha = 0.12; ellipsePx(ctx, bx + bw + 14 * s, sy + sh2 / 2, 22 * s, 16 * s, glow); ctx.globalAlpha = 1; }
  }
  // the tray, down, with somebody's cup on it
  if (o.tray) {
    const ty = base - Math.round(34 * s);
    rect(ctx, bx + bw, ty, Math.round(30 * s), Math.max(2, Math.round(3 * s)), '#b9bec6');
    rect(ctx, bx + bw, ty, Math.round(30 * s), 1, '#e0e6ee');
    rect(ctx, bx + bw + Math.round(10 * s), ty - Math.round(9 * s), Math.round(7 * s), Math.round(9 * s), '#f0ece2');
    rect(ctx, bx + bw + Math.round(10 * s), ty - Math.round(9 * s), Math.round(7 * s), 2, '#c8402c');
  }
  // the cushion and the front of the seat, drawn last so they cover the legs
  const cx0 = Math.round(x - 28 * s), cw = Math.round(36 * s);
  rect(ctx, cx0, base - Math.round(26 * s), cw, Math.round(11 * s), navy);
  rect(ctx, cx0, base - Math.round(26 * s), cw, 2, lighten(navy, 0.2));
  rect(ctx, cx0, base - Math.round(16 * s), cw - Math.round(4 * s), Math.round(12 * s), darken(navy, 0.25));
  // armrest, worn shiny on the top edge
  rect(ctx, cx0 - Math.round(2 * s), base - Math.round(33 * s), Math.round(40 * s), Math.max(3, Math.round(5 * s)), '#2a3040');
  rect(ctx, cx0 - Math.round(2 * s), base - Math.round(33 * s), Math.round(40 * s), 1, '#7d8598');
  // the leg, and the shadow it stands in
  rect(ctx, Math.round(x - 6 * s), base - Math.round(6 * s), Math.round(10 * s), Math.round(6 * s), '#1b1f2a');
  ctx.globalAlpha = 0.3; rect(ctx, cx0, base - 1, cw + Math.round(20 * s), 2, '#000'); ctx.globalAlpha = 1;
  // a life vest label, because the placard has to be somewhere
  if (s > 0.9 && o.label) drawText(ctx, o.label, cx0 + 2, base - Math.round(45 * s), withAlpha('#cfd6de', 0.4), { font: 'small' });
}
// Whoever is in it. Most of them are asleep, which is the correct answer to
// eleven hours.
function plPax(ctx, S, p, base, z, t) {
  const sc = p.sc * z;
  if (p.mode === 'gone') return;
  const y = base - 24 * z;
  if (p.mode === 'huge') {
    // one bug, two seats, no apology, and a perfectly reasonable explanation
    drawBugAt(ctx, p.spec, p.x + 42 * z, y, { pose: 'idle', scale: sc * 1.8, bounce: 0.25, phase: p.o });
    return;
  }
  const cheer = S.PL.clap > 0;
  let pose = 'idle', bounce = 0.4, tilt = 0;
  if (cheer) { pose = 'cheer'; bounce = 1.1; }
  else if (p.mode === 'sleep') { bounce = 0.12; tilt = Math.sin(p.o) > 0 ? 0.13 : -0.11; }
  else if (p.mode === 'cry') { bounce = 1.6; pose = 'shock'; }
  else if (p.mode === 'watch') { bounce = 0.2; }
  drawBugAt(ctx, p.spec, p.x, y, { pose: pose, scale: sc, bounce: bounce, phase: p.o, tilt: tilt, flip: true });
  if (cheer) return;
  if (p.mode === 'sleep') {
    // three Zs, rising, because there is no other way to draw it
    for (let k = 0; k < 3; k++) {
      const a = ((t * 0.5 + p.o + k * 0.33) % 1);
      ctx.globalAlpha = (1 - a) * 0.8;
      drawText(ctx, 'Z', p.x + 14 * z + a * 10, base - 66 * z - a * 22, '#bfd8ff', { font: 'small' });
      ctx.globalAlpha = 1;
    }
  } else if (p.mode === 'watch') {
    // the screen light on a face, which is the only light in the cabin
    ctx.globalAlpha = 0.16 + 0.06 * Math.sin(t * 8 + p.o);
    ellipsePx(ctx, p.x - 6 * z, base - 52 * z, 16 * z, 12 * z, '#8ad8ff');
    ctx.globalAlpha = 1;
  } else if (p.mode === 'read') {
    const px0 = Math.round(p.x - 30 * z), py0 = Math.round(base - 58 * z);
    rect(ctx, px0, py0, Math.round(24 * z), Math.round(30 * z), '#e8e2cf');
    rect(ctx, px0, py0, Math.round(24 * z), 2, '#fdf8ea');
    for (let k = 0; k < 5; k++) rect(ctx, px0 + 2, py0 + 5 + k * 5 * z, Math.round(20 * z), 1, '#8a8478');
    if (z > 0.85) for (let k = 0; k < 4; k++) rect(ctx, px0 + 3 + k * 5, py0 + 20, 4, 4, k === 1 ? '#3a3040' : '#c8c2b0');
  } else if (p.mode === 'cry') {
    if (Math.sin(t * 2.4 + p.o) > 0.5) {
      ctx.globalAlpha = 0.9;
      drawText(ctx, 'WAAA', p.x + 4 * z, base - 76 * z, '#ff9ab0', { font: 'small' });
      ctx.globalAlpha = 1;
    }
  } else if (p.mode === 'shoes') {
    // shoes off, in the aisle, where everybody has to step over them
    rect(ctx, p.x - 40 * z, base - 8 * z, 16 * z, 7 * z, '#6a4a2e');
    rect(ctx, p.x - 40 * z, base - 8 * z, 16 * z, 2, '#8a6440');
    rect(ctx, p.x - 21 * z, base - 8 * z, 16 * z, 7 * z, '#6a4a2e');
    rect(ctx, p.x - 21 * z, base - 8 * z, 16 * z, 2, '#8a6440');
  }
}
// A whole row: the seats, the people in them, and the carpet they are bolted
// to. Far rows are smaller and higher, which is all the perspective this
// engine has and all it needs.
function plRow(ctx, S, t, f, x0, x1) {
  const P = S.PL;
  const base = S.floorY(f), z = S.floorZ(f);
  // the floor the row stands on
  rect(ctx, x0, base, x1 - x0, Math.round(80 * z), '#1c2436');
  rect(ctx, x0, base, x1 - x0, 3, '#2c3750');
  for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) {
    ctx.globalAlpha = 0.14; rect(ctx, x, base + 4, 2, 2, '#6a7aa0'); rect(ctx, x + 17, base + 11, 2, 2, '#6a7aa0'); ctx.globalAlpha = 1;
  }
  const dark = P.dim > 0.4;
  for (const p of P.pax) {
    if (p.floor !== f) continue;
    if (p.x < x0 - 110 || p.x > x1 + 110) continue;
    if (p.mode === 'huge') { plSeat(ctx, p.x, base, z, t, { screenOff: true, dark: dark }); plSeat(ctx, p.x + PLANE_SEAT_PITCH, base, z, t, { screenOff: true, dark: dark }); }
    else plSeat(ctx, p.x, base, z, t, { tray: p.tray, screenOff: p.mode !== 'watch' && !p.screenOn, dark: dark, label: p.seat });
    plPax(ctx, S, p, base, z, t);
  }
}
// The aisle. Blue carpet with a gold fleck, worn down the middle by a decade
// of people going to the toilet they do not need.
function plAisle(ctx, S, t, x0, x1) {
  const base = S.floorY(2);
  rect(ctx, x0, base, x1 - x0, 170, '#1b2338');
  rect(ctx, x0, base, x1 - x0, 4, '#2e3a58');
  ctx.globalAlpha = 0.09; rect(ctx, x0, base + 6, x1 - x0, 30, '#ffffff'); ctx.globalAlpha = 1;
  for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) {
    const k = (Math.abs(x * 7919) % 97) / 97;
    ctx.globalAlpha = 0.18;
    rect(ctx, x, base + 10 + k * 60, 2, 2, k > 0.7 ? '#c8a03a' : '#3d4a6a');
    ctx.globalAlpha = 1;
  }
  // the aisle lighting strip down the floor, which only matters once
  ctx.globalAlpha = S.PL.dim > 0.3 ? 0.6 : 0.16;
  for (let x = Math.floor(x0 / 40) * 40; x < x1; x += 40) rect(ctx, x, base + 74, 6, 3, '#6be585');
  ctx.globalAlpha = 1;
}

// ---------- the fittings ----------
function plDeckDoor(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  rect(ctx, x - 6, base - 150, p.w + 12, 150, '#2b3040');
  rect(ctx, x, base - 128, p.w, 128, '#39405a');
  rect(ctx, x, base - 128, p.w, 4, '#545d7e');
  rect(ctx, x + 3, base - 124, p.w - 6, 120, '#2a3044');
  // the keypad, the peephole, and the placard nobody is allowed to read
  rect(ctx, x + p.w - 16, base - 86, 12, 20, '#161a24');
  for (let i = 0; i < 6; i++) rect(ctx, x + p.w - 14 + (i % 2) * 5, base - 83 + Math.floor(i / 2) * 6, 4, 4, i === 2 ? '#6be585' : '#4a5264');
  circle(ctx, x + 12, base - 98, 3, '#12141c');
  circle(ctx, x + 12, base - 98, 2, '#8ad8ff');
  rect(ctx, x + 6, base - 68, p.w - 14, 14, '#c8402c');
  drawText(ctx, 'CREW', x + p.w / 2 - 3, base - 64, '#fff2e8', { align: 'center', font: 'small' });
  // a coat rail with two jackets on it, and a jumpseat folded flat
  rect(ctx, x - 40, base - 118, 34, 3, '#8a8f98');
  rect(ctx, x - 36, base - 115, 12, 40, '#2a3a5a');
  rect(ctx, x - 22, base - 115, 12, 36, '#5a3a2a');
  rect(ctx, x - 44, base - 60, 8, 56, '#3a4050');
  rect(ctx, x - 48, base - 62, 16, 5, '#4a5264');
}
function plBulkhead(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  rect(ctx, x - 4, base - 160, p.w + 8, 160, '#2a3044');
  rect(ctx, x, base - 156, p.w, 156, '#39405a');
  rect(ctx, x, base - 156, p.w, 3, '#5a6280');
  const m = dfMark(22, { flat: true });
  ctx.drawImage(m, Math.round(p.x - 11), Math.round(base - 120));
  ctx.globalAlpha = 0.5;
  drawText(ctx, 'DF', p.x, base - 92, DF.gold, { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
}
function plExit(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  rect(ctx, x - 4, base - 134, p.w + 8, 134, '#2a3044');
  rect(ctx, x, base - 128, p.w, 128, '#414a64');
  rect(ctx, x, base - 128, p.w, 3, '#626c8a');
  // the window in the door, the handle, and the instructions in four steps
  ellipsePx(ctx, p.x, base - 96, 13, 20, '#0d1420');
  ellipseRingPx(ctx, p.x, base - 96, 13, 20, '#6a7288');
  ctx.globalAlpha = 0.45; ellipsePx(ctx, p.x - 3, base - 102, 7, 9, '#39456e'); ctx.globalAlpha = 1;
  rect(ctx, x + 6, base - 62, p.w - 12, 12, '#c8402c');
  rect(ctx, x + 6, base - 62, p.w - 12, 2, '#e8604a');
  rect(ctx, x + p.w / 2 - 14, base - 60, 28, 8, '#f4f1ea');
  for (let i = 0; i < 4; i++) {
    rect(ctx, x + 5 + i * 14, base - 42, 11, 14, '#e8e2cf');
    rect(ctx, x + 7 + i * 14, base - 39, 7, 8, '#3a4050');
  }
  // the lit sign over it, the only thing in here that is truly green
  rect(ctx, x - 2, base - 168, p.w + 4, 22, '#0d2218');
  frame(ctx, x - 2, base - 168, p.w + 4, 22, '#1f5f3a');
  ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 2);
  drawText(ctx, 'EXIT', p.x, base - 161, '#6be585', { align: 'center', scale: 2 });
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.1; ellipsePx(ctx, p.x, base - 140, 46, 34, '#6be585'); ctx.globalAlpha = 1;
}
function plToilet(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  const occ = p.occupied;
  rect(ctx, x - 3, base - 142, p.w + 6, 142, '#2a3044');
  rect(ctx, x, base - 136, p.w, 136, '#5c6478');
  rect(ctx, x, base - 136, p.w, 3, '#7e8698');
  rect(ctx, x + 3, base - 132, p.w - 6, 128, '#4e566a');
  // the concertina fold down the middle, and the ashtray they never removed
  rect(ctx, x + p.w / 2 - 1, base - 132, 2, 128, '#3a4152');
  rect(ctx, x + 6, base - 64, 10, 3, '#8a919e');
  // the little sign, which is the whole point of a toilet door
  rect(ctx, x + 6, base - 110, p.w - 12, 16, '#12141c');
  frame(ctx, x + 6, base - 110, p.w - 12, 16, occ ? '#8a2a20' : '#1f5f3a');
  drawText(ctx, occ ? 'OCCUPIED' : 'VACANT', p.x, base - 106, occ ? '#e8604a' : '#6be585', { align: 'center', font: 'small' });
  if (occ) { ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 1.5); rect(ctx, x + 6, base - 110, p.w - 12, 16, withAlpha('#c8402c', 0.18)); ctx.globalAlpha = 1; }
  // a queue of one, always, forever
  if (occ) drawText(ctx, 'WAIT', p.x, base - 152, withAlpha('#cfd6de', 0.4), { align: 'center', font: 'small' });
}
function plGalley(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  rect(ctx, x - 6, base - 160, p.w + 12, 160, '#2a3044');
  rect(ctx, x, base - 154, p.w, 154, '#8a919e');
  rect(ctx, x, base - 154, p.w, 4, '#b4bcc8');
  // stainless everything: ovens, a coffee pot, and the carts in their bays
  for (let i = 0; i < 3; i++) {
    const ox = x + 8 + i * 44;
    rect(ctx, ox, base - 146, 38, 42, '#6b7280');
    rect(ctx, ox + 2, base - 144, 34, 38, '#3f4654');
    rect(ctx, ox + 6, base - 128, 26, 3, '#8a919e');
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2 + i); rect(ctx, ox + 30, base - 142, 4, 3, i === 1 ? '#e8503a' : '#6be585'); ctx.globalAlpha = 1;
  }
  rect(ctx, x + 6, base - 100, p.w - 12, 6, '#b4bcc8');
  // the coffee pot on the hotplate, with the hotplate light on
  rect(ctx, x + 14, base - 96, 16, 4, '#2a2e38');
  rect(ctx, x + 16, base - 118, 12, 22, '#2a2e38');
  rect(ctx, x + 17, base - 114, 10, 12, '#4a2a18');
  rect(ctx, x + 28, base - 114, 4, 10, '#6b7280');
  ctx.globalAlpha = 0.5; ellipsePx(ctx, x + 22, base - 94, 10, 3, '#e8503a'); ctx.globalAlpha = 1;
  // the cart bays, two full, one empty because it is out in the aisle
  for (let i = 0; i < 3; i++) {
    const ox = x + 10 + i * 44;
    rect(ctx, ox, base - 90, 38, 86, '#5c6478');
    if (i !== 1) { rect(ctx, ox + 3, base - 86, 32, 80, '#9aa2ae'); for (let k = 0; k < 6; k++) rect(ctx, ox + 5, base - 82 + k * 13, 28, 2, '#6b7280'); }
    else rect(ctx, ox + 3, base - 86, 32, 80, '#2a2e38');
  }
  // the curtain, half drawn, which is all the privacy anybody gets up here
  rect(ctx, x - 22, base - 158, 16, 158, '#22305a');
  for (let k = 0; k < 8; k++) rect(ctx, x - 22 + (k % 2) * 4, base - 158 + k * 20, 3, 20, '#18264a');
}
function plCurtain(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  rect(ctx, x - 26, base - 172, 52, 6, '#4a5264');
  const sway = Math.sin(t * 0.8) * 2;
  for (let k = 0; k < 7; k++) {
    const cw = 8;
    rect(ctx, x - 24 + k * 8 + sway * (k / 7), base - 166, cw, 150, k % 2 ? '#22305a' : '#1b2748');
  }
  rect(ctx, x - 24, base - 166, 56, 3, '#33447a');
}
// The trolley. Heavy, badly steered, and always exactly where you want to be.
function plTrolley(ctx, p, t, S) {
  const base = S.propY(p), x = p.x - p.w / 2;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base, 26, 5, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, base - 66, 40, 62, '#8a919e');
  rect(ctx, x, base - 66, 40, 3, '#c0c8d2');
  rect(ctx, x + 2, base - 62, 36, 54, '#a8b0bc');
  for (let k = 0; k < 5; k++) { rect(ctx, x + 3, base - 58 + k * 11, 34, 2, '#767e8c'); ctx.globalAlpha = 0.25; rect(ctx, x + 3, base - 56 + k * 11, 34, 8, '#ffffff'); ctx.globalAlpha = 1; }
  // the top: cups, cans, and the pot of coffee that has been there since Vegas
  rect(ctx, x - 3, base - 70, 46, 5, '#c0c8d2');
  for (let k = 0; k < 4; k++) rect(ctx, x + 2 + k * 9, base - 78, 6, 8, k === 3 ? '#c8402c' : '#f0ece2');
  rect(ctx, x + 32, base - 84, 10, 14, '#2a2e38');
  rect(ctx, x + 33, base - 80, 8, 8, '#4a2a18');
  circle(ctx, x + 5, base - 2, 3, '#22262f');
  circle(ctx, x + 35, base - 2, 3, '#22262f');
  // the bin bag hanging off the end, which is the real job
  rect(ctx, x + 40, base - 46, 12, 26, '#2f3442');
  rect(ctx, x + 40, base - 46, 12, 2, '#4a5060');
}
function plSeat31A(ctx, p, t, S) {
  const base = S.propY(p), z = S.floorZ(p.floor);
  plSeat(ctx, p.x, base, z, t, { screenOff: !S.PL.watched, screenCol: '#ffd24a', tray: S.PL.ate, label: '31A' });
  // the only empty seat in the cabin, with your jacket on it
  rect(ctx, p.x - 20 * z, base - 44 * z, 22 * z, 18 * z, '#6a3a2a');
  rect(ctx, p.x - 20 * z, base - 44 * z, 22 * z, 2, '#8a5a40');
  if (!S.PL.sat) {
    ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 3);
    frame(ctx, p.x - 30 * z, base - 66 * z, 60 * z, 66 * z, '#ffd24a');
    ctx.globalAlpha = 1;
  }
  drawText(ctx, '31A', p.x - 26 * z, base - 74 * z, withAlpha(DF.gold, 0.7), { font: 'small' });
}
function plOverheadBin(ctx, p, t, S) {
  const y = S.propY(p) - p.h;
  rect(ctx, p.x - p.w / 2, y, p.w, p.h, '#4a4f60');
  rect(ctx, p.x - p.w / 2, y, p.w, 3, '#767e94');
  rect(ctx, p.x - p.w / 2 + 30, y + p.h - 14, 26, 8, '#22262f');
  rect(ctx, p.x - p.w / 2 + 32, y + p.h - 12, 22, 4, '#9aa0ae');
  if (S.PL.binOpen) {
    rect(ctx, p.x - p.w / 2, y - 22, p.w, 22, '#12141c');
    rect(ctx, p.x - p.w / 2 + 2, y - 20, p.w - 4, 18, '#3a3f4e');
    rect(ctx, p.x - 18, y + 8, 30, 26, '#8a2a1c');
    rect(ctx, p.x - 18, y + 8, 30, 3, '#b04a38');
  }
}

// ---------- the seat-back interface ----------
// A real one: it boots, it lies to you about the advert, and the map is the
// only screen anybody actually looks at.
function plTvIcon(ctx, cx, cy, s, kind, col) {
  switch (kind) {
    case 'film':
      rect(ctx, cx - s, cy - s * 0.7, s * 2, s * 1.4, col);
      rect(ctx, cx - s, cy - s * 0.7, s * 2, 3, lighten(col, 0.3));
      for (let i = 0; i < 4; i++) { rect(ctx, cx - s + 3 + i * (s * 0.5), cy - s * 0.62, 4, 4, '#12101c'); rect(ctx, cx - s + 3 + i * (s * 0.5), cy + s * 0.44, 4, 4, '#12101c'); }
      break;
    case 'note':
      rect(ctx, cx + s * 0.2, cy - s, 3, s * 1.5, col);
      rect(ctx, cx + s * 0.2, cy - s, s * 0.7, 3, col);
      ellipsePx(ctx, cx - s * 0.1, cy + s * 0.5, s * 0.45, s * 0.34, col);
      break;
    case 'globe':
      circle(ctx, cx, cy, s * 0.9, col);
      ctx.globalAlpha = 0.45; ellipsePx(ctx, cx, cy, s * 0.9, s * 0.35, '#12101c'); ctx.globalAlpha = 1;
      rect(ctx, cx - 1, cy - s * 0.9, 2, s * 1.8, withAlpha('#12101c', 0.4));
      break;
    case 'pad':
      rect(ctx, cx - s, cy - s * 0.5, s * 2, s, col);
      rect(ctx, cx - s * 0.7, cy - 1, s * 0.5, 3, '#12101c'); rect(ctx, cx - s * 0.5, cy - s * 0.25, 3, s * 0.5, '#12101c');
      circle(ctx, cx + s * 0.5, cy, 3, '#12101c');
      break;
    case 'vest':
      ctx.fillStyle = col; ctx.beginPath();
      ctx.moveTo(cx - s * 0.8, cy - s * 0.6); ctx.lineTo(cx + s * 0.8, cy - s * 0.6);
      ctx.lineTo(cx + s * 0.6, cy + s * 0.8); ctx.lineTo(cx - s * 0.6, cy + s * 0.8); ctx.fill();
      rect(ctx, cx - 2, cy - s * 0.6, 4, s * 1.4, '#12101c');
      break;
    default:
      rect(ctx, cx - s * 0.7, cy - s * 0.4, s * 1.4, s * 1.2, col);
      ringPx(ctx, cx, cy - s * 0.5, s * 0.45, col);
  }
}
function plTvChrome(ctx, r, title, t) {
  rect(ctx, r.x, r.y, r.w, 22, DF.navy);
  rect(ctx, r.x, r.y + 21, r.w, 1, DF.goldLo);
  dfStamp(ctx, r.x + 4, r.y + 3, 16, null);
  drawText(ctx, title, r.x + 26, r.y + 8, DF.cream, { scale: 1 });
  drawText(ctx, 'DF0808   LAS - NRT', r.x + r.w - 6, r.y + 8, withAlpha(DF.gold, 0.8), { align: 'right', font: 'small' });
}
function plTvBoot(ctx, r, t) {
  rect(ctx, r.x, r.y, r.w, r.h, DF.navyLo);
  const m = dfMark(54);
  ctx.drawImage(m, Math.round(r.x + r.w / 2 - 27), Math.round(r.y + r.h / 2 - 58));
  dfWordmark(ctx, r.x + r.w / 2 - 68, r.y + r.h / 2 + 4, 3, { tag: true });
  const bw = 200, bx = r.x + r.w / 2 - bw / 2, by = r.y + r.h / 2 + 46;
  rect(ctx, bx, by, bw, 8, '#1b2440');
  frame(ctx, bx, by, bw, 8, DF.goldLo);
  rect(ctx, bx + 1, by + 1, Math.round((bw - 2) * clamp(t / 2.1, 0, 1)), 6, DF.gold);
  drawText(ctx, 'INFLIGHT ENTERTAINMENT  V4.2.1', r.x + r.w / 2, by + 16, withAlpha(DF.cream, 0.5), { align: 'center', font: 'small' });
}
// The advert. Twelve seconds, and a counter that goes down, then up, then down
// again, and is never once telling the truth.
const PLANE_AD_SKIP = [5, 4, 3, 4, 3, 2, 3, 5, 4, 3, 2, 1];
function plTvAd(ctx, r, ad, t) {
  rect(ctx, r.x, r.y, r.w, r.h, darken(ad.col, 0.55));
  // the product, doing the one thing it does, forever
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2 - 10;
  const pulse = 1 + Math.sin(t * 2.4) * 0.05;
  ctx.globalAlpha = 0.18; ellipsePx(ctx, cx, cy, 150 * pulse, 90 * pulse, ad.col); ctx.globalAlpha = 1;
  if (ad.look === 'store') {
    rect(ctx, cx - 90, cy - 40, 180, 80, '#f4f1ea');
    rect(ctx, cx - 90, cy - 40, 180, 14, '#2f8f4a');
    rect(ctx, cx - 90, cy - 26, 180, 10, '#e8503a');
    rect(ctx, cx - 90, cy - 16, 180, 10, '#2f6fc0');
    for (let i = 0; i < 6; i++) rect(ctx, cx - 82 + i * 28, cy + 4, 20, 28, ['#ffd24a', '#6be585', '#8ad8ff', '#f0ece2', '#e8503a', '#c58bff'][i]);
    ctx.globalAlpha = 0.25 + 0.2 * Math.sin(t * 6); rect(ctx, cx - 90, cy - 40, 180, 80, '#ffffff'); ctx.globalAlpha = 1;
  } else if (ad.look === 'watch') {
    circle(ctx, cx, cy, 52, '#1b1b24');
    circle(ctx, cx, cy, 46, '#f4f1ea');
    circle(ctx, cx, cy, 42, '#12101c');
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; rect(ctx, cx + Math.cos(a) * 36 - 1, cy + Math.sin(a) * 36 - 1, 3, 3, DF.gold); }
    line(ctx, cx, cy, cx + Math.cos(t * 0.6 - 1.57) * 30, cy + Math.sin(t * 0.6 - 1.57) * 30, DF.goldHi);
    line(ctx, cx, cy, cx + Math.cos(t * 2.1 - 1.57) * 38, cy + Math.sin(t * 2.1 - 1.57) * 38, DF.cream);
    rect(ctx, cx - 14, cy - 64, 28, 14, '#5a4a2a'); rect(ctx, cx - 14, cy + 50, 28, 14, '#5a4a2a');
  } else {
    rect(ctx, cx - 20, cy - 54, 40, 96, ad.col);
    rect(ctx, cx - 20, cy - 54, 40, 4, lighten(ad.col, 0.3));
    rect(ctx, cx - 10, cy - 70, 20, 18, darken(ad.col, 0.2));
    rect(ctx, cx - 12, cy - 74, 24, 6, '#c0c8d2');
    rect(ctx, cx - 16, cy - 20, 32, 30, DF.cream);
    drawText(ctx, 'JELLY', cx, cy - 12, ad.col, { align: 'center', font: 'small' });
    for (let i = 0; i < 4; i++) { const a = ((t * 0.7 + i * 0.25) % 1); ctx.globalAlpha = 1 - a; circle(ctx, cx + Math.sin(a * 9 + i) * 26, cy - 74 - a * 40, 3, '#ffe9a8'); ctx.globalAlpha = 1; }
  }
  // the wordmark, and whichever line of copy is due
  drawText(ctx, ad.name, cx, r.y + 30, ad.col2 === '#12101c' ? DF.gold : DF.cream, { align: 'center', scale: 3, outline: '#12101c' });
  drawText(ctx, ad.tag, cx, r.y + 54, withAlpha(DF.cream, 0.7), { align: 'center', font: 'small' });
  let copy = '';
  for (let i = 0; i < ad.lines.length; i++) if (t >= ad.lines[i][0]) copy = ad.lines[i][1];
  if (copy) {
    const lw = textWidth(copy, { scale: 2 }) + 16;
    rect(ctx, cx - lw / 2, r.y + r.h - 54, lw, 22, 'rgba(6,5,12,0.75)');
    drawText(ctx, copy, cx, r.y + r.h - 48, DF.cream, { align: 'center', scale: 2 });
  }
  // the counter, lying
  const n = PLANE_AD_SKIP[clamp(Math.floor(t), 0, PLANE_AD_SKIP.length - 1)];
  const done = t >= 12;
  const bw = 112, bx = r.x + r.w - bw - 8, by = r.y + r.h - 26;
  rect(ctx, bx, by, bw, 20, done ? '#1f5f3a' : 'rgba(10,8,18,0.8)');
  frame(ctx, bx, by, bw, 20, done ? '#6be585' : '#5a5468');
  drawText(ctx, done ? 'SKIP >' : 'SKIP IN ' + n, bx + bw / 2, by + 6, done ? '#6be585' : withAlpha(DF.cream, 0.7), { align: 'center', scale: 1 });
  drawText(ctx, 'ADVERTISEMENT', r.x + 8, r.y + r.h - 20, withAlpha(DF.cream, 0.35), { font: 'small' });
}
function plPoster(ctx, x, y, w, h, m, t, sel) {
  rect(ctx, x, y, w, h, darken(m.col, 0.4));
  rect(ctx, x + 2, y + 2, w - 4, h - 4, m.col);
  // a different bad poster for every genre, built out of four shapes
  const cx = x + w / 2, cy = y + h * 0.42;
  if (m.look === 'noir') { rect(ctx, x + 2, y + h * 0.5, w - 4, h * 0.5, darken(m.col, 0.3)); ellipsePx(ctx, cx, cy + 6, 9, 12, '#12101c'); rect(ctx, cx - 3, cy - 12, 6, 8, m.col2); for (let i = 0; i < 5; i++) rect(ctx, x + 3 + i * 9, y + 3, 4, h - 6, withAlpha('#000', 0.18)); }
  else if (m.look === 'space') { for (let i = 0; i < 12; i++) px(ctx, x + 4 + (i * 13) % (w - 8), y + 4 + (i * 29) % (h - 20), '#fff'); circle(ctx, cx + 8, cy, 13, m.col2); ctx.globalAlpha = 0.4; ellipsePx(ctx, cx + 8, cy, 20, 4, '#fff'); ctx.globalAlpha = 1; }
  else if (m.look === 'romance') { vgrad(ctx, x + 2, y + 2, w - 4, h - 4, '#f2a0b8', m.col); ellipsePx(ctx, cx - 7, cy + 4, 6, 9, '#3a2030'); ellipsePx(ctx, cx + 7, cy + 4, 6, 9, '#3a2030'); }
  else if (m.look === 'action') { ctx.fillStyle = m.col2; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.2832; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24); ctx.lineTo(cx + Math.cos(a + 0.4) * 24, cy + Math.sin(a + 0.4) * 24); ctx.fill(); } rect(ctx, cx - 14, cy + 12, 28, 9, '#12101c'); }
  else if (m.look === 'kids') { circle(ctx, cx, cy, 14, m.col2); circle(ctx, cx - 5, cy - 3, 2, '#12101c'); circle(ctx, cx + 5, cy - 3, 2, '#12101c'); rect(ctx, cx - 5, cy + 4, 10, 2, '#12101c'); }
  else if (m.look === 'horror') { rect(ctx, x + 2, y + 2, w - 4, h - 4, '#10101a'); rect(ctx, cx - 9, cy - 14, 18, 30, '#1b1b26'); ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5); rect(ctx, cx - 2, cy - 14, 4, 30, m.col2); ctx.globalAlpha = 1; }
  else if (m.look === 'doc') { for (let i = 0; i < 4; i++) rect(ctx, x + 3, y + 8 + i * 9, w - 6, 5, withAlpha(m.col2, 0.3 + i * 0.12)); ctx.fillStyle = '#e8e2cf'; ctx.beginPath(); ctx.moveTo(x + 4, y + h * 0.7); ctx.lineTo(cx, cy - 4); ctx.lineTo(x + w - 4, y + h * 0.7); ctx.fill(); }
  else { rect(ctx, x + 2, y + h * 0.55, w - 4, h * 0.45, '#1b2430'); for (let i = 0; i < 6; i++) rect(ctx, x + 4 + i * 9, y + h * 0.55 - (4 + (i % 3) * 7), 6, 4 + (i % 3) * 7, '#2f3a4a'); ellipsePx(ctx, cx, cy, 15, 11, m.col2); rect(ctx, cx - 5, cy - 3, 3, 3, '#c8402c'); rect(ctx, cx + 3, cy - 3, 3, 3, '#c8402c'); }
  // the band along the bottom with everything you actually decide on
  rect(ctx, x + 2, y + h - 22, w - 4, 20, 'rgba(6,5,12,0.82)');
  const title = m.title.length > 17 ? m.title.slice(0, 16) + '.' : m.title;
  drawText(ctx, title, x + 5, y + h - 19, DF.cream, { font: 'small' });
  drawText(ctx, m.genre + '  ' + m.mins + 'M', x + 5, y + h - 11, withAlpha(DF.cream, 0.55), { font: 'small' });
  rect(ctx, x + w - 22, y + h - 20, 18, 9, '#c8402c');
  drawText(ctx, m.rate, x + w - 13, y + h - 19, '#fff2e8', { align: 'center', font: 'small' });
  if (sel) { frame(ctx, x - 2, y - 2, w + 4, h + 4, '#ffd24a'); frame(ctx, x - 1, y - 1, w + 2, h + 2, '#fff6c8'); }
}
// Twenty seconds of a film, which is the same as two hours of it.
function plMovieFrame(ctx, r, m, k, t) {
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  rect(ctx, r.x, r.y, r.w, r.h, '#05060a');
  const vh = r.h - 40, vy = r.y + 20;
  rect(ctx, r.x, vy, r.w, vh, darken(m.col, 0.5));
  if (m.look === 'noir') {
    // rain on a window, blinds, and one bug not saying anything
    vgrad(ctx, r.x, vy, r.w, vh, '#22304a', '#0d1420');
    for (let i = 0; i < 14; i++) rect(ctx, r.x, vy + 6 + i * 11, r.w, 5, withAlpha('#000', 0.3));
    for (let i = 0; i < 30; i++) { const rx = (i * 61 + t * 240) % r.w; rect(ctx, r.x + rx, vy + ((i * 37 + t * 320) % vh), 1, 7, withAlpha('#8ad8ff', 0.4)); }
    ellipsePx(ctx, cx + 30, cy + 26, 26, 40, '#0a0c12');
    ellipsePx(ctx, cx + 30, cy - 18, 17, 15, '#0a0c12');
    ctx.globalAlpha = 0.5; rect(ctx, cx - 60, vy, 3, vh, '#ffd24a'); ctx.globalAlpha = 1;
  } else if (m.look === 'space') {
    rect(ctx, r.x, vy, r.w, vh, '#05060f');
    const rr = makeRng(9);
    for (let i = 0; i < 70; i++) { const sx = r.x + rr.int(0, r.w), sy = vy + rr.int(0, vh); px(ctx, sx, sy, rr.chance(0.2) ? '#8ad8ff' : '#f4f1ea'); }
    circle(ctx, cx - 30 + Math.sin(t * 0.2) * 12, cy, 52, '#2a3f6a');
    ctx.globalAlpha = 0.5; ellipsePx(ctx, cx - 30, cy, 64, 10, '#6a8ac8'); ctx.globalAlpha = 1;
    const px0 = r.x + ((t * 26) % (r.w + 40)) - 20;
    rect(ctx, px0, cy - 30, 14, 4, '#c0c8d2'); rect(ctx, px0 - 6, cy - 29, 6, 2, '#ff9a3a');
  } else if (m.look === 'romance') {
    vgrad(ctx, r.x, vy, r.w, vh, '#f0a06a', '#6a3a68');
    circle(ctx, cx + 40, vy + vh * 0.45, 24, '#ffd8a0');
    rect(ctx, r.x, vy + vh * 0.72, r.w, vh * 0.3, '#2a1c30');
    rect(ctx, cx - 60, vy + vh * 0.7, 120, 5, '#3a2a40');
    ellipsePx(ctx, cx - 22, vy + vh * 0.62, 12, 20, '#1b1020');
    ellipsePx(ctx, cx + 4, vy + vh * 0.62, 12, 20, '#1b1020');
  } else if (m.look === 'action') {
    rect(ctx, r.x, vy, r.w, vh, '#3a2418');
    for (let i = 0; i < 10; i++) rect(ctx, r.x, vy + (i * 23 + (t * 300) % 23), r.w, 2, withAlpha('#8a5a2a', 0.5));
    speedLines(ctx, cx, cy, 30, 220, 20, '#ffd24a', t, 0.35);
    if ((t % 3) < 0.5) { ctx.globalAlpha = 0.85; circle(ctx, cx + 40, cy, 40 + (t % 3) * 60, '#ffb03a'); circle(ctx, cx + 40, cy, 24 + (t % 3) * 40, '#fff2c0'); ctx.globalAlpha = 1; }
    rect(ctx, cx - 70, cy + 24, 60, 18, '#c8402c'); rect(ctx, cx - 70, cy + 24, 60, 3, '#e8604a');
    circle(ctx, cx - 58, cy + 44, 6, '#12101c'); circle(ctx, cx - 22, cy + 44, 6, '#12101c');
  } else if (m.look === 'kids') {
    vgrad(ctx, r.x, vy, r.w, vh, '#8ad8ff', '#6be585');
    circle(ctx, r.x + 60, vy + 40, 22, '#ffd24a');
    for (let i = 0; i < 5; i++) {
      const bx = r.x + 70 + i * 62, by = cy + 30 + Math.sin(t * 3 + i) * 16;
      ellipsePx(ctx, bx, by, 16, 13, ['#e8503a', '#4a86f7', '#ffd24a', '#c58bff', '#f28ab0'][i]);
      circle(ctx, bx - 5, by - 3, 2, '#12101c'); circle(ctx, bx + 5, by - 3, 2, '#12101c');
    }
  } else if (m.look === 'horror') {
    rect(ctx, r.x, vy, r.w, vh, '#08080e');
    const open = clamp((k - 0.3) * 3, 0, 1);
    rect(ctx, cx - 40, cy - 60, 80, 120, '#141420');
    rect(ctx, cx - 40, cy - 60, Math.round(80 * open), 120, '#02020a');
    if (k > 0.72 && Math.sin(t * 40) > 0) { ctx.globalAlpha = 0.9; rect(ctx, r.x, vy, r.w, vh, '#c8402c'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.5; ellipsePx(ctx, cx, cy + 48, 120, 22, '#000'); ctx.globalAlpha = 1;
  } else if (m.look === 'doc') {
    vgrad(ctx, r.x, vy, r.w, vh, '#c8c0a0', '#6a6450');
    const off = (t * 10) % 120;
    for (let i = -1; i < 5; i++) {
      ctx.fillStyle = ['#4a4838', '#5a5844', '#6a6850'][(i + 1) % 3];
      ctx.beginPath();
      const bx = r.x + i * 120 - off;
      ctx.moveTo(bx, vy + vh); ctx.lineTo(bx + 60, vy + vh * 0.35); ctx.lineTo(bx + 120, vy + vh); ctx.fill();
    }
  } else {
    rect(ctx, r.x, vy, r.w, vh, '#0d1a20');
    for (let i = 0; i < 12; i++) { const bx = r.x + 10 + i * 38; rect(ctx, bx, cy + 10 - (i % 4) * 16, 26, vh, '#16232c'); for (let w2 = 0; w2 < 5; w2++) rect(ctx, bx + 4 + (w2 % 2) * 12, cy + 18 - (i % 4) * 16 + w2 * 9, 5, 5, withAlpha('#ffd24a', 0.5)); }
    const gx = cx + Math.sin(t * 0.4) * 50;
    ellipsePx(ctx, gx, cy - 10, 44, 54, '#0a1410');
    circle(ctx, gx - 14, cy - 34, 5, '#6be585'); circle(ctx, gx + 14, cy - 34, 5, '#6be585');
  }
  // the letterbox this film was never shot for
  rect(ctx, r.x, r.y, r.w, 20, '#000'); rect(ctx, r.x, r.y + r.h - 20, r.w, 20, '#000');
  // subtitles, burned in, slightly out of sync
  let sub = '';
  for (let i = 0; i < m.subs.length; i++) if (t >= m.subs[i][0]) sub = m.subs[i][1];
  if (sub) drawText(ctx, sub, cx, r.y + r.h - 34, '#fff8e0', { align: 'center', scale: 2, outline: '#12101c' });
}
// The map, which is the channel everybody watches for eleven hours.
function plTvMap(ctx, r, k, t, S) {
  vgrad(ctx, r.x, r.y, r.w, r.h, '#071026', '#0d1c3a');
  const cx = r.x + r.w / 2, cy = r.y + r.h * 0.62, R = Math.min(r.w, r.h) * 0.46;
  // the globe: a dark ocean with a few continents that are the wrong shape
  circle(ctx, cx, cy, R, '#14335e');
  circle(ctx, cx, cy, R - 2, '#123056');
  const rr = makeRng(1717);
  for (let i = 0; i < 12; i++) {
    const a = rr.range(0, 6.28), d = rr.range(0, R * 0.8);
    ellipsePx(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, rr.range(10, 34), rr.range(6, 18), '#2f6a4a');
  }
  // the grid, the terminator, and the night side you are flying across
  for (let i = -3; i <= 3; i++) {
    const w2 = R * Math.sqrt(Math.max(0.02, 1 - (i / 3.6) * (i / 3.6)));
    ctx.globalAlpha = 0.16; ellipseRingPx(ctx, cx, cy + i * (R / 3.6), w2, Math.max(2, w2 * 0.16), '#8ad8ff'); ctx.globalAlpha = 1;
  }
  for (let i = -3; i <= 3; i++) { ctx.globalAlpha = 0.1; ellipseRingPx(ctx, cx + i * (R / 3.4), cy, Math.max(2, R * 0.12 * Math.abs(i) || 2), R, '#8ad8ff'); ctx.globalAlpha = 1; }
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.2832); ctx.clip();
  ctx.globalAlpha = 0.38; rect(ctx, cx - R, cy - R, R * 1.1, R * 2, '#050810'); ctx.globalAlpha = 1;
  ctx.restore();
  ellipseRingPx(ctx, cx, cy, R, R, '#4a86f7');
  // the route, from a desert to a wet runway, over a lot of water
  const ax = cx - R * 0.72, bx = cx + R * 0.68, ay = cy - R * 0.1, by = cy - R * 0.02;
  for (let i = 0; i <= 44; i++) {
    const u = i / 44;
    const px0 = lerp(ax, bx, u), py0 = lerp(ay, by, u) - Math.sin(u * Math.PI) * R * 0.62;
    if (i % 2 === 0) rect(ctx, px0, py0, 2, 2, withAlpha('#ffd24a', u <= k ? 0.95 : 0.3));
  }
  const pu = clamp(k, 0, 1);
  const pxp = lerp(ax, bx, pu), pyp = lerp(ay, by, pu) - Math.sin(pu * Math.PI) * R * 0.62;
  // the aeroplane icon, which is the only picture of the aeroplane you get
  ctx.fillStyle = DF.cream;
  ctx.beginPath();
  ctx.moveTo(pxp + 9, pyp); ctx.lineTo(pxp - 5, pyp - 6); ctx.lineTo(pxp - 3, pyp); ctx.lineTo(pxp - 5, pyp + 6); ctx.fill();
  ctx.globalAlpha = 0.25; circle(ctx, pxp, pyp, 10 + Math.sin(t * 3) * 2, '#ffd24a'); ctx.globalAlpha = 1;
  rect(ctx, ax - 2, ay - 2, 5, 5, '#6be585'); drawText(ctx, 'LAS', ax - 10, ay + 6, '#6be585', { font: 'small' });
  rect(ctx, bx - 2, by - 2, 5, 5, '#e8503a'); drawText(ctx, 'NRT', bx - 4, by + 6, '#e8503a', { font: 'small' });
  // the four numbers, in their wells along the bottom
  const rem = Math.max(0, (1 - k) * 11);
  const readout = [
    ['ALTITUDE', Math.round(37000 + Math.sin(t * 0.3) * 200) + ' FT'],
    ['GROUND SPEED', Math.round(508 + Math.sin(t * 0.7) * 9) + ' KT'],
    ['TIME TO NRT', Math.floor(rem) + 'H ' + pad2(Math.floor((rem % 1) * 60)) + 'M'],
    ['OUTSIDE AIR', '-' + Math.round(52 + Math.sin(t * 0.2) * 3) + ' C'],
  ];
  const cw = Math.floor((r.w - 16) / 4);
  for (let i = 0; i < 4; i++) {
    const bxp = r.x + 8 + i * cw;
    rect(ctx, bxp, r.y + r.h - 34, cw - 6, 28, 'rgba(6,10,22,0.8)');
    frame(ctx, bxp, r.y + r.h - 34, cw - 6, 28, '#22406a');
    drawText(ctx, readout[i][0], bxp + 4, r.y + r.h - 30, withAlpha('#8ad8ff', 0.6), { font: 'small' });
    drawText(ctx, readout[i][1], bxp + 4, r.y + r.h - 20, DF.cream, { scale: 1 });
  }
  drawText(ctx, 'DF0808   LAS VEGAS - TOKYO NARITA', r.x + r.w / 2, r.y + 30, withAlpha(DF.cream, 0.7), { align: 'center', scale: 1 });
}
// The safety card, as four pictures, because it has to work in every language
// and nobody is reading it anyway.
function plTvSafety(ctx, r, t) {
  rect(ctx, r.x, r.y, r.w, r.h, '#f4f1ea');
  drawText(ctx, 'SAFETY ON BOARD', r.x + r.w / 2, r.y + 30, DF.navy, { align: 'center', scale: 2 });
  const cells = ['BELT', 'VEST', 'MASK', 'EXIT'];
  const cw = Math.floor((r.w - 40) / 4), ch = 110;
  for (let i = 0; i < 4; i++) {
    const x = r.x + 20 + i * cw, y = r.y + 50;
    rect(ctx, x, y, cw - 8, ch, '#e4e0d4');
    frame(ctx, x, y, cw - 8, ch, '#b9b2a0');
    rect(ctx, x, y, cw - 8, 3, '#ffffff');
    const cx = x + (cw - 8) / 2, cy = y + 50;
    if (i === 0) { ellipsePx(ctx, cx, cy + 10, 20, 12, '#2f3a50'); rect(ctx, cx - 22, cy + 4, 44, 6, '#c8402c'); rect(ctx, cx - 6, cy + 2, 12, 10, '#8a8f98'); ellipsePx(ctx, cx, cy - 16, 11, 11, '#2f3a50'); }
    else if (i === 1) { ellipsePx(ctx, cx, cy - 14, 10, 10, '#2f3a50'); ctx.fillStyle = '#e8a83a'; ctx.beginPath(); ctx.moveTo(cx - 16, cy - 2); ctx.lineTo(cx + 16, cy - 2); ctx.lineTo(cx + 12, cy + 30); ctx.lineTo(cx - 12, cy + 30); ctx.fill(); rect(ctx, cx - 2, cy - 2, 4, 32, '#2f3a50'); }
    else if (i === 2) { ellipsePx(ctx, cx, cy - 8, 12, 12, '#2f3a50'); ellipsePx(ctx, cx, cy + 4, 10, 8, '#f4f1ea'); rect(ctx, cx - 1, cy + 10, 3, 22, '#8a8f98'); rect(ctx, cx - 10, cy + 30, 20, 8, '#c8c2b0'); }
    else { rect(ctx, cx - 18, cy - 24, 36, 54, '#2f8f4a'); rect(ctx, cx - 14, cy - 20, 28, 46, '#f4f1ea'); ellipsePx(ctx, cx - 4, cy - 8, 6, 7, '#2f8f4a'); ctx.fillStyle = '#2f8f4a'; ctx.beginPath(); ctx.moveTo(cx + 2, cy + 4); ctx.lineTo(cx + 14, cy + 4); ctx.lineTo(cx + 8, cy + 16); ctx.fill(); }
    drawText(ctx, cells[i], cx, y + ch - 14, DF.navy, { align: 'center', font: 'small' });
  }
  drawText(ctx, 'YOUR NEAREST EXIT MAY BE BEHIND YOU', r.x + r.w / 2, r.y + r.h - 34, '#8a8478', { align: 'center', font: 'small' });
  drawText(ctx, 'IT IS. IT IS TWELVE ROWS BEHIND YOU.', r.x + r.w / 2, r.y + r.h - 24, '#b9b2a0', { align: 'center', font: 'small' });
}

// ---------- the seat-back scene ----------
// Its own scene, because the cabin goes dark around it and the only thing in
// the world is a screen eleven inches from your face.
class PlaneTvScene {
  constructor(plane) {
    this.plane = plane || null;
    this.t = 0; this.modeT = 0;
    this.mode = 'boot'; this.stack = [];
    this.sel = 0; this.rects = []; this.hot = -1;
    this.vol = 6; this.paused = false;
    this.play = null; this.sawMovie = false;
    this.cur = { x: W / 2, y: H / 2, on: false };
    this.note = null; this.noteT = 0;
    this.left = false;
    this.ad = PLANE_ADS[plAdTurn % PLANE_ADS.length];
    plAdTurn++;
    this.adSpoke = -1;
  }
  enter() { Voice.chime('shop'); }
  screenRect() { return { x: 250, y: 108, w: 460, h: 272 }; }
  flash(m) { this.note = m; this.noteT = 2.4; }
  cols() { return this.mode === 'home' ? 3 : this.mode === 'movies' ? 4 : this.mode === 'shop' ? 3 : 1; }
  count() {
    if (this.mode === 'home') return PLANE_TV_HOME.length;
    if (this.mode === 'movies') return PLANE_MOVIES.length;
    if (this.mode === 'music') return PLANE_MUSIC.length;
    if (this.mode === 'games') return PLANE_GAMES.length;
    if (this.mode === 'shop') return PLANE_DUTY.length;
    return 0;
  }
  go(mode) { this.stack.push(this.mode); this.mode = mode; this.modeT = 0; this.sel = 0; Audio.ui('select'); }
  back() {
    if (this.mode === 'ad' || this.mode === 'boot') { Audio.ui('error'); this.flash('PLEASE WAIT'); return; }
    if (this.mode === 'play') { this.play = null; this.mode = 'movies'; this.modeT = 0; Audio.ui('back'); return; }
    if (this.stack.length) { this.mode = this.stack.pop(); this.modeT = 0; this.sel = 0; Audio.ui('back'); return; }
    this.leave();
  }
  leave() {
    if (this.left) return; this.left = true;
    const P = this.plane;
    if (P && P.PL) { if (this.sawMovie || this.t > 30) P.PL.watched = true; P.PL.screenOn = true; }
    Audio.ui('back');
    Game.go(() => (this.plane ? this.plane : (typeof gameHub === 'function' ? gameHub() : new PlaneScene())), 'fade', { dur: 0.5 });
  }
  select() {
    if (this.mode === 'home') { this.go(PLANE_TV_HOME[this.sel].key); return; }
    if (this.mode === 'movies') {
      const m = PLANE_MOVIES[this.sel];
      this.play = { m: m, t: 0 }; this.stack.push('movies'); this.mode = 'play'; this.modeT = 0;
      this.sawMovie = true; this.paused = false; Audio.ui('select');
      if (this.plane && this.plane.PL) this.plane.PL.watched = true;
      return;
    }
    if (this.mode === 'music') { Audio.ui('select'); this.flash('NOW PLAYING: ' + PLANE_MUSIC[this.sel].now); return; }
    if (this.mode === 'games') { Audio.ui('error'); this.flash('NOT AVAILABLE ON THIS AIRCRAFT'); return; }
    if (this.mode === 'shop') {
      const it = PLANE_DUTY[this.sel];
      if (it.note === 'SOLD OUT') { Audio.ui('error'); this.flash('SOLD OUT SINCE LOS ANGELES'); return; }
      const r = Game.run;
      if (!r || r.money < it.price) { Audio.ui('error'); this.flash('CARD DECLINED AT 37000 FEET'); return; }
      r.money -= it.price;
      if (it.name === 'ROYAL JELLY GOLD' && r.consumables.length < 6) r.consumables.push('energyBar');
      Audio.ui('coin'); this.flash('ORDERED. THEY BRING IT AT LANDING.');
      r.save();
      return;
    }
    if (this.mode === 'play') { this.paused = !this.paused; Audio.ui('select'); return; }
  }
  update(dt) {
    this.t += dt; this.modeT += dt; this.noteT = Math.max(0, this.noteT - dt);
    if (this.mode === 'boot' && this.modeT > 2.3) { this.mode = 'ad'; this.modeT = 0; this.adSpoke = -1; }
    if (this.mode === 'ad') {
      // the lines read themselves out, in the voice of a man being paid
      for (let i = 0; i < this.ad.lines.length; i++) {
        if (this.modeT >= this.ad.lines[i][0] && this.adSpoke < i) { this.adSpoke = i; Voice.say(this.ad.lines[i][1], 'tv', {}); }
      }
      if (this.modeT > 12.6) { this.mode = 'home'; this.modeT = 0; this.stack = []; }
    }
    if (this.mode === 'play' && this.play && !this.paused) {
      this.play.t += dt;
      if (this.play.t > 20) { this.play = null; this.mode = 'movies'; this.modeT = 0; this.flash('YOU HAVE NOT FINISHED THIS FILM'); }
    }
  }
  key(code) {
    if (code === 'Escape' || code === 'KeyX' || code === 'Backspace') { this.back(); return; }
    if (code === 'Minus' || code === 'BracketLeft') { this.vol = clamp(this.vol - 1, 0, 10); Audio.ui('move'); return; }
    if (code === 'Equal' || code === 'BracketRight') { this.vol = clamp(this.vol + 1, 0, 10); Audio.ui('move'); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.select(); return; }
    const n = this.count(); if (!n) return;
    const c = this.cols();
    if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % n; Audio.ui('move'); }
    else if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + n) % n; Audio.ui('move'); }
    else if (code === 'ArrowDown' || code === 'KeyS') { this.sel = Math.min(n - 1, this.sel + c); Audio.ui('move'); }
    else if (code === 'ArrowUp' || code === 'KeyW') { this.sel = Math.max(0, this.sel - c); Audio.ui('move'); }
  }
  keyUp() {}
  hitRects(x, y) { for (let i = 0; i < this.rects.length; i++) { const r = this.rects[i]; if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i; } return -1; }
  pointerDown(x, y) {
    this.cur.x = x; this.cur.y = y; this.cur.on = true;
    if (this.backBtn && x >= this.backBtn.x && x < this.backBtn.x + this.backBtn.w && y >= this.backBtn.y && y < this.backBtn.y + this.backBtn.h) { this.back(); return; }
    if (this.volBtns) {
      for (let i = 0; i < 2; i++) { const b = this.volBtns[i]; if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { this.vol = clamp(this.vol + (i ? 1 : -1), 0, 10); Audio.ui('move'); return; } }
    }
    const i = this.hitRects(x, y);
    if (i >= 0) { this.sel = i; this.select(); return; }
    const r = this.screenRect();
    const inside = x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
    if (!inside) { this.back(); return; }
    if (this.mode === 'play') this.select();
  }
  pointerUp() {}
  pointerMove(x, y) { this.cur.x = x; this.cur.y = y; this.cur.on = true; this.hot = this.hitRects(x, y); }
  hover(x, y) { this.pointerMove(x, y); }
  click(x, y) { this.pointerDown(x, y); }
  isPlaying() { return false; }
  // ---- the thing the screen is bolted to
  drawSeatBack(ctx, r, t) {
    rect(ctx, 0, 0, W, H, '#080a12');
    // a sliver of the cabin at the top, so you know where you are
    rect(ctx, 0, 0, W, 34, '#1b1f2c');
    rect(ctx, 0, 32, W, 2, '#2a3040');
    ctx.globalAlpha = 0.1; ellipsePx(ctx, W / 2, 20, 200, 90, '#ffe9a8'); ctx.globalAlpha = 1;
    // the seat back itself, filling the frame
    const sx = 150, sy = 44, sw = 660, sh = 460;
    rect(ctx, sx, sy, sw, sh, '#161c30');
    rect(ctx, sx + 6, sy + 6, sw - 12, sh - 12, '#22305a');
    rect(ctx, sx + 6, sy + 6, sw - 12, 3, '#33447a');
    // fabric: the tiny gold dashes, up close this time
    for (let y = sy + 14; y < sy + sh - 10; y += 14) for (let x = sx + 14; x < sx + sw - 14; x += 22) {
      ctx.globalAlpha = 0.16; rect(ctx, x + ((y / 14) % 2) * 11, y, 5, 2, '#c8a03a'); ctx.globalAlpha = 1;
    }
    // headrest cover with the mark on it
    rect(ctx, sx + 6, sy + 6, sw - 12, 46, DF.cream);
    rect(ctx, sx + 6, sy + 50, sw - 12, 3, '#cfc8b6');
    dfWordmark(ctx, sx + sw / 2 - 74, sy + 22, 3, { col: DF.navy, accent: DF.gold });
    // the bezel round the screen, and the two speaker grilles
    rect(ctx, r.x - 12, r.y - 12, r.w + 24, r.h + 40, '#12141c');
    rect(ctx, r.x - 10, r.y - 10, r.w + 20, r.h + 36, '#2a2e3a');
    rect(ctx, r.x - 10, r.y - 10, r.w + 20, 2, '#4a5060');
    for (let i = 0; i < 18; i++) rect(ctx, r.x + 8 + i * 8, r.y + r.h + 10, 3, 10, '#181c26');
    for (let i = 0; i < 18; i++) rect(ctx, r.x + r.w - 150 + i * 8, r.y + r.h + 10, 3, 10, '#181c26');
    drawText(ctx, 'DRAGON FLY', r.x + r.w / 2, r.y + r.h + 14, withAlpha(DF.gold, 0.5), { align: 'center', font: 'small' });
    // the pocket under it, with the card, the bag and a magazine nobody moved
    const py = sy + sh - 96;
    rect(ctx, sx + 30, py, sw - 60, 86, '#1b2748');
    rect(ctx, sx + 30, py, sw - 60, 4, '#33447a');
    rect(ctx, sx + 56, py - 26, 74, 40, '#e8e2cf');
    rect(ctx, sx + 56, py - 26, 74, 8, '#c8402c');
    drawText(ctx, 'SAFETY', sx + 62, py - 24, '#fff2e8', { font: 'small' });
    drawText(ctx, 'ON BOARD', sx + 62, py - 14, '#3a3040', { font: 'small' });
    rect(ctx, sx + 150, py - 20, 56, 34, '#c8c2b0');
    drawText(ctx, 'FOR USE', sx + 156, py - 16, '#5a5448', { font: 'small' });
    rect(ctx, sx + 224, py - 30, 62, 44, '#f0b83c');
    rect(ctx, sx + 224, py - 30, 62, 6, '#c8902a');
    drawText(ctx, 'SKYWARD', sx + 228, py - 22, '#5a3a08', { font: 'small' });
    // the ports, the hook, and the cable of the headphones you did not bring
    rect(ctx, r.x + r.w - 40, r.y + r.h + 24, 26, 12, '#181c26');
    circle(ctx, r.x + r.w - 32, r.y + r.h + 30, 3, '#4a5060');
    rect(ctx, r.x + r.w - 22, r.y + r.h + 27, 6, 5, '#4a5060');
    rect(ctx, sx + 20, sy + 70, 8, 30, '#1b2340');
    // your knees, at the bottom of frame, because you are sitting behind all this
    ctx.globalAlpha = 0.95;
    ellipsePx(ctx, 300, H + 24, 130, 58, '#151a2a');
    ellipsePx(ctx, 660, H + 24, 130, 58, '#151a2a');
    ctx.globalAlpha = 1;
    // the reading light, doing its best
    ctx.globalAlpha = 0.07; ellipsePx(ctx, W / 2, 120, 300, 200, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  draw(ctx) {
    const t = this.t, r = this.screenRect();
    this.rects = [];
    this.drawSeatBack(ctx, r, t);
    ctx.save(); ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (this.mode === 'boot') plTvBoot(ctx, r, this.modeT);
    else if (this.mode === 'ad') plTvAd(ctx, r, this.ad, this.modeT);
    else if (this.mode === 'play' && this.play) this.drawPlay(ctx, r);
    else if (this.mode === 'map') plTvMap(ctx, r, this.flightK(), t, this.plane);
    else if (this.mode === 'safety') plTvSafety(ctx, r, t);
    else this.drawMenu(ctx, r, t);
    // the screen itself: scanlines, a greasy fingerprint, and the glass
    ctx.globalAlpha = 0.07; for (let y = r.y; y < r.y + r.h; y += 3) rect(ctx, r.x, y, r.w, 1, '#000'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.05; ellipsePx(ctx, r.x + r.w * 0.68, r.y + r.h * 0.3, 40, 30, '#ffffff'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(r.x, r.y + r.h); ctx.lineTo(r.x + r.w * 0.55, r.y); ctx.lineTo(r.x + r.w * 0.8, r.y); ctx.lineTo(r.x, r.y + r.h * 0.5); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    vignetteRect(ctx, r.x, r.y, r.w, r.h, 0.35);
    // the note it flashes at you when it wants you to know it said no
    if (this.noteT > 0) {
      ctx.globalAlpha = clamp(this.noteT, 0, 1);
      const w2 = textWidth(this.note, { scale: 2 }) + 24;
      rect(ctx, W / 2 - w2 / 2, r.y + r.h - 64, w2, 24, 'rgba(8,6,14,0.9)');
      frame(ctx, W / 2 - w2 / 2, r.y + r.h - 64, w2, 24, DF.gold);
      drawText(ctx, this.note, W / 2, r.y + r.h - 57, DF.goldHi, { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    this.drawControls(ctx, r);
    // a cursor, for the finger or the mouse, because it is a touchscreen
    if (this.cur.on) {
      const cx = this.cur.x, cy = this.cur.y;
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = '#ffd24a'; ctx.beginPath();
      ctx.moveTo(cx, cy); ctx.lineTo(cx + 9, cy + 6); ctx.lineTo(cx + 4, cy + 7); ctx.lineTo(cx + 7, cy + 13); ctx.lineTo(cx + 4, cy + 14); ctx.lineTo(cx + 1, cy + 9); ctx.fill();
      ctx.globalAlpha = 1;
    }
    drawText(ctx, Game.touch ? 'TAP THE SCREEN.  TAP OUTSIDE TO GO BACK.' : 'ARROWS + ENTER.  ESC GOES BACK.  - AND + FOR VOLUME.', W / 2, H - 16, '#5a5478', { align: 'center', font: 'small' });
  }
  flightK() { return this.plane && this.plane.PL ? this.plane.PL.k : 0.42; }
  drawMenu(ctx, r, t) {
    const m = this.mode;
    if (m === 'home') {
      vgrad(ctx, r.x, r.y, r.w, r.h, DF.navy, '#0a1228');
      plTvChrome(ctx, r, 'WELCOME ON BOARD', t);
      const cw = 140, ch = 96, gx = r.x + 16, gy = r.y + 40;
      PLANE_TV_HOME.forEach((it, i) => {
        const x = gx + (i % 3) * (cw + 10), y = gy + Math.floor(i / 3) * (ch + 10);
        const on = i === this.sel;
        this.rects.push({ x: x, y: y, w: cw, h: ch });
        rect(ctx, x, y, cw, ch, on ? lighten(it.col, 0.12) : darken(it.col, 0.28));
        rect(ctx, x, y, cw, 3, lighten(it.col, 0.34));
        frame(ctx, x, y, cw, ch, on ? '#fff6c8' : '#12101c');
        plTvIcon(ctx, x + cw / 2, y + 36, 18, it.ic, on ? '#fff8e0' : withAlpha('#f4f1ea', 0.8));
        drawText(ctx, it.name, x + cw / 2, y + ch - 22, on ? '#fff8e0' : withAlpha('#f4f1ea', 0.75), { align: 'center', scale: 1 });
        if (on) { ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 5); rect(ctx, x, y, cw, ch, '#ffffff'); ctx.globalAlpha = 1; }
      });
      drawText(ctx, 'GOOD EVENING, PASSENGER IN 31A', r.x + r.w / 2, r.y + r.h - 18, withAlpha(DF.gold, 0.55), { align: 'center', font: 'small' });
      return;
    }
    if (m === 'movies') {
      rect(ctx, r.x, r.y, r.w, r.h, '#0d1020');
      plTvChrome(ctx, r, 'MOVIES  -  8 TITLES', t);
      const pw = 104, ph = 104, gx = r.x + 14, gy = r.y + 32;
      PLANE_MOVIES.forEach((mv, i) => {
        const x = gx + (i % 4) * (pw + 10), y = gy + Math.floor(i / 4) * (ph + 12);
        this.rects.push({ x: x, y: y, w: pw, h: ph });
        plPoster(ctx, x, y, pw, ph, mv, t, i === this.sel);
      });
      const sel = PLANE_MOVIES[this.sel];
      drawText(ctx, sel.title + '  -  ' + sel.genre + '  -  ' + sel.mins + ' MIN  -  ' + sel.rate, r.x + r.w / 2, r.y + r.h - 16, DF.cream, { align: 'center', font: 'small' });
      return;
    }
    if (m === 'music') {
      vgrad(ctx, r.x, r.y, r.w, r.h, '#241a3a', '#100c1c');
      plTvChrome(ctx, r, 'MUSIC  -  6 CHANNELS', t);
      PLANE_MUSIC.forEach((ch, i) => {
        const y = r.y + 34 + i * 36, on = i === this.sel;
        this.rects.push({ x: r.x + 12, y: y, w: r.w - 24, h: 32 });
        rect(ctx, r.x + 12, y, r.w - 24, 32, on ? '#3a2a5a' : '#1b1430');
        frame(ctx, r.x + 12, y, r.w - 24, 32, on ? '#c58bff' : '#2a2040');
        drawText(ctx, ch.ch, r.x + 20, y + 6, withAlpha('#c58bff', 0.9), { font: 'small' });
        drawText(ctx, ch.name, r.x + 60, y + 5, on ? '#fff8e0' : '#cfc9e6', { scale: 1 });
        drawText(ctx, ch.now, r.x + 60, y + 18, withAlpha('#cfc9e6', 0.5), { font: 'small' });
        // a VU meter that is not connected to anything
        for (let b = 0; b < 8; b++) {
          const h = 3 + ((Math.sin(t * 6 + b + i) + 1) * 9);
          rect(ctx, r.x + r.w - 40 + b * 4, y + 24 - h, 3, h, on ? '#c58bff' : '#4a3a6a');
        }
      });
      return;
    }
    if (m === 'games') {
      vgrad(ctx, r.x, r.y, r.w, r.h, '#0d2418', '#08140e');
      plTvChrome(ctx, r, 'GAMES', t);
      PLANE_GAMES.forEach((g, i) => {
        const y = r.y + 46 + i * 44, on = i === this.sel;
        this.rects.push({ x: r.x + 24, y: y, w: r.w - 48, h: 38 });
        rect(ctx, r.x + 24, y, r.w - 48, 38, on ? '#1f5f3a' : '#123222');
        frame(ctx, r.x + 24, y, r.w - 48, 38, on ? '#6be585' : '#1c4a30');
        plTvIcon(ctx, r.x + 46, y + 19, 11, 'pad', on ? '#6be585' : '#3a7a52');
        drawText(ctx, g, r.x + 68, y + 14, on ? '#fff8e0' : '#9ecab0', { scale: 1 });
        drawText(ctx, 'LOADING...', r.x + r.w - 40, y + 15, withAlpha('#6be585', 0.4), { align: 'right', font: 'small' });
      });
      drawText(ctx, 'IT HAS BEEN LOADING SINCE NEVADA.', r.x + r.w / 2, r.y + r.h - 18, withAlpha('#6be585', 0.5), { align: 'center', font: 'small' });
      return;
    }
    if (m === 'shop') {
      vgrad(ctx, r.x, r.y, r.w, r.h, '#2a1430', '#140a18');
      plTvChrome(ctx, r, 'SKY SHOP  -  DUTY FREE', t);
      const cw = 140, ch = 92;
      PLANE_DUTY.forEach((it, i) => {
        const x = r.x + 16 + (i % 3) * (cw + 10), y = r.y + 40 + Math.floor(i / 3) * (ch + 10), on = i === this.sel;
        this.rects.push({ x: x, y: y, w: cw, h: ch });
        rect(ctx, x, y, cw, ch, on ? '#4a2a54' : '#26162c');
        frame(ctx, x, y, cw, ch, on ? '#f0a0d0' : '#3a2440');
        rect(ctx, x + cw / 2 - 18, y + 12, 36, 38, ['#c8a03a', '#e8a020', '#2f4a8a', '#5a3a2a', '#c8c2b0', '#c8402c'][i]);
        rect(ctx, x + cw / 2 - 18, y + 12, 36, 3, '#ffffff');
        drawText(ctx, it.name.length > 16 ? it.name.slice(0, 15) + '.' : it.name, x + cw / 2, y + 56, on ? '#fff8e0' : '#cfc9e6', { align: 'center', font: 'small' });
        drawText(ctx, it.note === 'SOLD OUT' ? 'SOLD OUT' : fmtMoney(it.price), x + cw / 2, y + 70, it.note === 'SOLD OUT' ? '#8a7a90' : '#ffd24a', { align: 'center', scale: 1 });
      });
      drawText(ctx, 'YOU HAVE ' + (Game.run ? fmtMoney(Game.run.money) : '$0'), r.x + r.w / 2, r.y + r.h - 18, withAlpha('#f0a0d0', 0.7), { align: 'center', font: 'small' });
      return;
    }
    rect(ctx, r.x, r.y, r.w, r.h, DF.navyLo);
    drawText(ctx, 'NO SIGNAL', r.x + r.w / 2, r.y + r.h / 2, DF.cream, { align: 'center', scale: 3 });
  }
  drawPlay(ctx, r) {
    const p = this.play, k = clamp(p.t / 20, 0, 1);
    plMovieFrame(ctx, r, p.m, k, p.t);
    // the transport bar, which appears because you touched something
    const bar = this.modeT < 4 || this.paused || this.cur.on;
    if (bar) {
      rect(ctx, r.x, r.y + r.h - 30, r.w, 30, 'rgba(6,5,12,0.8)');
      rect(ctx, r.x + 10, r.y + r.h - 12, r.w - 20, 4, '#3a3450');
      rect(ctx, r.x + 10, r.y + r.h - 12, Math.round((r.w - 20) * k), 4, DF.gold);
      circle(ctx, r.x + 10 + (r.w - 20) * k, r.y + r.h - 10, 4, DF.goldHi);
      drawText(ctx, this.paused ? '> PLAY' : '|| PAUSE', r.x + 12, r.y + r.h - 27, DF.cream, { scale: 1 });
      const el = Math.floor(p.t / 20 * p.m.mins);
      drawText(ctx, pad2(Math.floor(el / 60)) + ':' + pad2(el % 60) + ' / ' + pad2(Math.floor(p.m.mins / 60)) + ':' + pad2(p.m.mins % 60), r.x + r.w - 12, r.y + r.h - 27, withAlpha(DF.cream, 0.7), { align: 'right', font: 'small' });
      drawText(ctx, p.m.title, r.x + r.w / 2, r.y + 6, withAlpha(DF.cream, 0.8), { align: 'center', font: 'small' });
    }
    if (this.paused) {
      ctx.globalAlpha = 0.4; rect(ctx, r.x, r.y, r.w, r.h, '#05060a'); ctx.globalAlpha = 1;
      rect(ctx, r.x + r.w / 2 - 14, r.y + r.h / 2 - 18, 9, 36, DF.cream);
      rect(ctx, r.x + r.w / 2 + 5, r.y + r.h / 2 - 18, 9, 36, DF.cream);
    }
  }
  drawControls(ctx, r) {
    // a real back button and a real volume rocker, under the glass
    const bx = r.x - 10, by = r.y + r.h + 26;
    this.backBtn = { x: bx, y: by, w: 78, h: 22 };
    rect(ctx, bx, by, 78, 22, '#2a2e3a');
    frame(ctx, bx, by, 78, 22, '#4a5060');
    rect(ctx, bx, by, 78, 2, '#5a6172');
    drawText(ctx, '< BACK', bx + 39, by + 7, DF.cream, { align: 'center', scale: 1 });
    const vx = r.x + r.w - 130;
    this.volBtns = [{ x: vx, y: by, w: 22, h: 22 }, { x: vx + 108, y: by, w: 22, h: 22 }];
    for (let i = 0; i < 2; i++) {
      const b = this.volBtns[i];
      rect(ctx, b.x, b.y, b.w, b.h, '#2a2e3a'); frame(ctx, b.x, b.y, b.w, b.h, '#4a5060');
      drawText(ctx, i ? '+' : '-', b.x + 11, b.y + 7, DF.cream, { align: 'center', scale: 1 });
    }
    for (let i = 0; i < 10; i++) rect(ctx, vx + 26 + i * 8, by + 6, 6, 10, i < this.vol ? DF.gold : '#2a2e3a');
    drawText(ctx, 'VOL', vx + 26, by - 8, withAlpha(DF.cream, 0.4), { font: 'small' });
  }
}

// ---------- the cabin scene ----------
class PlaneScene extends SideScene {
  constructor(opts) {
    super(plPlaneDef(), opts || {});
    this.cam.y = PLANE_CAM_Y;
  }
  enter() { this.input.clear(); this.PL.pass = false; }
  // the boarding pass lives in your pocket, and B is your pocket
  key(code) {
    if (this.PL.pass) {
      if (['KeyB', 'Escape', 'Enter', 'Space', 'KeyZ'].includes(code)) { this.PL.pass = false; Audio.ui('back'); return; }
    }
    if (code === 'KeyB' && !this.dlg) { this.PL.pass = true; Audio.ui('select'); return; }
    super.key(code);
  }
  pointerDown(x, y, id) {
    if (this.PL.pass) { this.PL.pass = false; Audio.ui('back'); return; }
    super.pointerDown(x, y, id);
  }
  update(dt) {
    super.update(dt);
    // The cabin does not slide up and down when you change rows: only the
    // depth changes, so the ceiling stays where a ceiling should be. The
    // camera's own follow() is overruled outright rather than leaned against,
    // because two springs pulling at one number settle somewhere neither of
    // them wanted.
    const P = this.PL;
    P.camY += ((PLANE_CAM_Y + P.camNudge) - P.camY) * Math.min(1, dt * 4);
    this.cam.y = P.camY;
  }
}

// Everything about the flight, in one object, because the scene is a shell
// round a definition and this is where the aeroplane actually lives.
function plPlaneDef() {
  return {
    name: 'DRAGON FLY DF0808', sub: 'LAS VEGAS - TOKYO NARITA', tint: '#12203f',
    w: PLANE_W, zoom: 1, yBias: 0.74, hud: false, canLeave: false, heroScale: 1.6, speed: 132,
    start: { x: 210, floor: 2 },
    floors: [{ y: 258, z: 0.78 }, { y: 336, z: 0.9 }, { y: 432, z: 1 }],
    sky: function (ctx) { rect(ctx, 0, 0, W, H, '#0a0c14'); },
    props: [
      { kind: 'pldeck', x: 62, w: 56, h: 128, floor: 2, label: 'FLIGHT DECK', reach: 40 },
      { kind: 'plbulk', x: 126, w: 22, h: 156, floor: 2 },
      { kind: 'plseat', x: 536, w: 70, h: 62, floor: 0, label: 'SIT DOWN', reach: 52 },
      { kind: 'plbin', x: 880, y: 132, w: 90, h: 58, floor: 2, over: true, label: 'LOCKER', reach: 44 },
      { kind: 'plexit', x: 1194, w: 64, h: 128, floor: 2, label: 'EMERGENCY EXIT', reach: 40 },
      { kind: 'plcurtain', x: 1540, w: 52, h: 166, floor: 2 },
      { kind: 'pltoilet', x: 1620, w: 54, h: 136, floor: 2, label: 'TOILET', occupied: false },
      { kind: 'pltoilet', x: 1700, w: 54, h: 136, floor: 2, label: 'TOILET', occupied: true },
      { kind: 'plgalley', x: 1820, w: 150, h: 154, floor: 2, label: 'GALLEY', reach: 66 },
      { kind: 'pltrolley', x: 300, w: 44, h: 70, floor: 2 },
    ],
    npcs: [
      { name: 'AYA', x: 620, floor: 2, voice: 'hostess', scale: 1.5, speed: 24, walk: [340, 1440], act: 'meal', face: 1 },
      { name: '32C', x: 442, floor: 2, voice: 'you', scale: 1.5, hidden: true, y: 432,
        tag: ['THIRTY ONE A? THAT IS THE WING.', 'YOU WILL NOT SEE ANYTHING.', 'I HAVE DONE THIS ROUTE NINE TIMES.'] },
      { name: 'CROSSWORD', x: 724, floor: 0, voice: 'oldman', scale: 1.5, hidden: true, y: 258,
        tag: ['SEVEN DOWN. NINE LETTERS.', 'A PLACE YOU GO TO BE SOMEBODY ELSE.', 'NO. IT IS NOT AEROPLANE.'] },
      { name: 'THE BABY', x: 630, floor: 1, voice: 'kid', scale: 1.5, hidden: true, y: 336,
        tag: ['WAAAAAAAAAAAA', 'WAAAAA', 'WAAAAAAAAAAAAAAAAA'] },
      { name: 'BIG BUG', x: 1006, floor: 1, voice: 'guard', scale: 1.5, hidden: true, y: 336,
        tag: ['I BOOKED BOTH. I ALWAYS BOOK BOTH.', 'IT IS CHEAPER THAN THE APOLOGY.'] },
      { name: 'SHOES OFF', x: 1288, floor: 2, voice: 'driver', scale: 1.5, hidden: true, y: 432,
        tag: ['ELEVEN HOURS IS A LONG TIME IN SHOES.', 'YOU WILL UNDERSTAND BY HOUR SIX.'] },
    ],
    // ---------- setup ----------
    init: function (S) {
      const P = {
        k: 0.06, cap: 0, ate: false, watched: false, slept: false, sat: false,
        belt: true, dim: 0, tilt: 0, tiltTo: 0, camNudge: 0, clap: 0,
        turb: 0, turbT: 0, land: 0, landT: 0, landStep: 0, pass: false, camY: PLANE_CAM_Y,
        chicken: true, fish: false, binOpen: false, shadeDown: false, shadeIdx: 5,
        pending: null, sleep: 0, sleepT: 0, dreamRun: false, pax: [], hostess: null,
        trolley: null, screenOn: false, hint: 0,
      };
      S.PL = P;
      // everybody in the cabin, seated, at a fixed pitch so the talkers and
      // the scenery agree about where a seat is
      const r = makeRng(80808);
      for (let f = 0; f < 3; f++) {
        for (let i = 0; i < PLANE_SEAT_N; i++) {
          if (i === PLANE_SEAT_SKIP) continue;                 // the exit row
          const x = PLANE_SEAT_X0 + i * PLANE_SEAT_PITCH;
          const roll = r();
          const mode = roll < 0.42 ? 'sleep' : roll < 0.62 ? 'watch' : roll < 0.74 ? 'read' : roll < 0.84 ? 'none' : 'sit';
          P.pax.push({
            x: x, floor: f, mode: mode, seat: String(28 + i) + 'ABC'[f],
            spec: randomBugSpec(makeRng(hashStr('df0808|' + f + '|' + i))),
            o: r.range(0, 6.28), sc: r.range(0.92, 1.08), tray: r.chance(0.3), screenOn: mode === 'watch',
          });
        }
      }
      const mark = function (x, f, mode) {
        for (let i = 0; i < P.pax.length; i++) { const p = P.pax[i]; if (p.floor === f && Math.abs(p.x - x) < 8) { p.mode = mode; return p; } }
        return null;
      };
      mark(536, 0, 'gone');            // 31A is yours, and it is empty
      mark(724, 0, 'read');
      mark(630, 1, 'cry');
      mark(1006, 1, 'huge');
      mark(1100, 1, 'gone');           // because the big bug booked that one too
      mark(1288, 2, 'shoes');
      mark(442, 2, 'watch');
      for (let i = 0; i < S.npcs.length; i++) if (S.npcs[i].name === 'AYA') P.hostess = S.npcs[i];
      for (let i = 0; i < S.props.length; i++) if (S.props[i].kind === 'pltrolley') P.trolley = S.props[i];
      S.cam.y = PLANE_CAM_Y;
      if (typeof setChapter === 'function') setChapter('plane');
    },
    // ---------- the shape of eleven hours ----------
    tick: function (S, dt) {
      const P = S.PL;
      P.k = clamp(0.06 + S.t / 520, 0, 0.99);
      P.tilt += (P.tiltTo - P.tilt) * Math.min(1, dt * 1.6);
      if (P.clap > 0) P.clap -= dt;
      // the trolley goes where she goes
      if (P.trolley && P.hostess) P.trolley.x = P.hostess._x + (P.hostess.face || 1) * 34;
      // the toilet changes its mind every forty seconds, as toilets do
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind === 'pltoilet' && p.x > 1660) p.occupied = Math.floor(S.t / 38) % 2 === 0;
      }
      // ---- the captain, before anything else happens
      if (P.cap === 0 && S.t > 1.1) { P.cap = 1; Voice.chime('plane'); S.locked = 1.4; S.cam.focus(120, 360, 1); }
      if (P.cap === 1 && S.t > 2.5) {
        P.cap = 2;
        S.run([
          { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'GOOD EVENING. THIS IS YOUR CAPTAIN.' },
          { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'WE ARE NUMBER FOUR FOR THE RUNWAY.' },
          { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'TOKYO IS ELEVEN DEGREES AND RAINING. IT IS ALWAYS RAINING WHEN YOU ARRIVE.' },
          { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'CABIN CREW, DOORS TO AUTOMATIC AND CROSS CHECK.' },
        ], function () {
          S.cam.release(1); P.belt = false;
          S.flash('ELEVEN HOURS. FIND SOMETHING TO DO.', 4.5);
        });
      }
      // ---- the chicken runs out, the way it always does
      if (P.chicken && S.t > 96) { P.chicken = false; }
      // ---- turbulence, unannounced, somewhere over nothing
      if (P.cap === 2 && !P.turb && !S.dlg && !P.sleep && !P.land && S.t > 58) {
        P.turb = 1; P.turbT = 0; P.belt = true;
        Voice.chime('plane');
        Audio.ui('error');
        if (P.hostess) { P.hostess._walk = P.hostess.walk; P.hostess.walk = null; P.hostess.pose = 'shock'; }
        S.flash('FASTEN SEAT BELT', 3);
      }
      if (P.turb === 1) {
        P.turbT += dt;
        const m = 5 * Math.max(0, 1 - P.turbT / 3.6);
        Game.shake.hit(m, 0.16);
        S.cam.kick(m * 0.6, 0.16);
        // a drink going over the edge of a tray, twice
        if (P.turbT > 0.5 && P.turbT < 0.62) S.fx.burst(S.body.x + 40, S.floorY(2) - 60, 10, { color: ['#c8402c', '#ffd24a'], speed: 60, life: 0.7, gravity: 320, size: 2 });
        if (P.turbT > 2.1 && P.turbT < 2.22) S.fx.burst(S.body.x - 60, S.floorY(1) - 40, 8, { color: ['#8ad8ff'], speed: 50, life: 0.6, gravity: 300, size: 2 });
        if (P.turbT > 3.6 && !S.dlg) {
          P.turb = 2;
          if (P.hostess) { P.hostess.walk = P.hostess._walk; P.hostess.pose = null; }
          S.run([
            { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'THAT WAS NOT THE ENGINES. THAT WAS AIR.' },
            { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'AIR HAS LUMPS IN IT. NOBODY LIKES TO SAY SO.' },
          ], function () { P.belt = false; });
        }
      }
      // ---- the dream, which happens on its own once you close your eyes
      if (P.sleep === 1) {
        P.sleepT += dt;
        if (P.sleepT > 1.6 && !P.dreamRun) {
          P.dreamRun = true;
          S.run([
            { who: '', voice: false, think: true, at: 'you', text: 'YOU ARE PLAYING A STAGE MADE OF TRAY TABLES.' },
            { who: '', voice: false, think: true, at: 'you', text: 'EVERY FACE IN THE CROWD IS THE SAME FACE.' },
            { who: '', voice: false, think: true, at: 'you', text: 'IT IS ASKING ABOUT DUTY FREE.' },
            { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'DUTY FREE? ANYTHING FROM THE CART?' },
          ], function () {
            P.sleep = 2; P.slept = true; P.sleepT = 0;
            S.flash('SIX HOURS. YOUR NECK DISAGREES.', 4);
            if (Game.run) { Game.run.stamina = clamp(Game.run.stamina + 60, 0, Game.run.staminaMax); Game.run.save(); }
          });
        }
      }
      if (P.sleep === 2) { P.sleepT += dt; if (P.sleepT > 1.2) P.sleep = 0; }
      P.dim = P.land >= 1 ? Math.min(0.75, P.dim + dt * 0.18) : P.sleep === 1 ? Math.min(0.92, P.dim + dt * 0.7) : Math.max(0, P.dim - dt * 0.9);
      // ---- the descent, once you have eaten and done something with the time
      if (!P.land && P.ate && (P.watched || P.slept) && !S.dlg && !P.sleep && S.t > 24) {
        P.land = 1; P.belt = true;
        Voice.chime('plane');
        S.run([
          { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'WE HAVE BEGUN OUR DESCENT INTO TOKYO NARITA.' },
          { who: 'CAPTAIN', voice: 'captain', at: { x: 90, y: 300 }, text: 'LOCAL TIME IS TEN PAST FOUR. IT IS RAINING.' },
          { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'SEATS UPRIGHT. TRAYS STOWED. SIT DOWN PLEASE.' },
        ], function () { P.land = 2; P.landT = 0; P.landStep = 0; S.locked = 999; S.flash('SIT DOWN. HOLD ON.', 3); });
      }
      if (P.land === 2) {
        P.landT += dt;
        const step = function (n, at, fn) { if (P.landStep === n && P.landT >= at) { P.landStep = n + 1; fn(); } };
        // the nose goes down, the cabin goes quiet, the ears go first
        step(0, 0.6, function () { P.tiltTo = -0.045; P.camNudge = 14; });
        step(1, 4.0, function () { S.flash('YOUR EARS GO FIRST.', 2.4); Audio.ui('whoosh'); });
        step(2, 6.6, function () { Audio.ui('stamp'); Game.shake.hit(5, 0.5); S.flash('THE GEAR COMES DOWN LIKE A DOOR.', 2.6); });
        step(3, 9.4, function () { P.tiltTo = -0.02; P.camNudge = 8; });
        step(4, 11.4, function () { P.tiltTo = 0.03; P.camNudge = -6; });     // the flare
        step(5, 13.0, function () {
          // and then the bang, which is always louder than anybody expects
          P.tiltTo = 0; P.camNudge = 0;
          Game.shake.hit(11, 0.9); S.cam.kick(8, 0.8);
          Audio.ui('pyro'); Audio.ui('stamp');
          S.fx.burst(S.body.x, S.floorY(2), 26, { color: ['#cfd6de', '#8a8f98'], speed: 180, life: 0.6, gravity: 200, size: 2 });
          P.binOpen = true;
          S.flash('NARITA. FOUR TEN IN THE AFTERNOON.', 3.5);
        });
        step(6, 14.4, function () { Game.shake.hit(5, 1.4); Audio.roar(2.2, 0.35); });
        step(7, 15.6, function () { P.clap = 4.5; Audio.applause(1, 2.6); });
        step(8, 17.0, function () {
          S.run([{ who: 'SHOES OFF', voice: 'driver', at: { x: S.body.x + 40, y: 380 }, text: 'THEY ALWAYS CLAP. I DO NOT KNOW WHY.' }]);
        });
        step(9, 21.5, function () {
          if (typeof setChapter === 'function') setChapter('narita');
          S.leave(function () {
            if (typeof NaritaArrivalScene !== 'undefined') return new NaritaArrivalScene();
            if (typeof NaritaTerminalScene !== 'undefined') return new NaritaTerminalScene();
            return typeof gameHub === 'function' ? gameHub() : new CityScene();
          }, 'fade', { dur: 1.2 });
        });
      }
      // ---- whatever the last menu choice asked for, once the bubble is gone
      if (P.pending && !S.dlg) {
        const job = P.pending; P.pending = null;
        if (job === 'tv') { Game.go(function () { return new PlaneTvScene(S); }, 'fade', { dur: 0.5 }); }
        else if (job === 'sleep') { P.sleep = 1; P.sleepT = 0; P.dreamRun = false; S.locked = 6; }
        else if (job === 'pass') { P.pass = true; }
      }
    },
    // ---------- what the cabin looks like ----------
    mid: function (ctx, S, t) {
      const P = S.PL;
      // tilting the world here and never restoring it is deliberate: the
      // camera's own save/restore puts it back, so the props, the people and
      // you all tip with the aeroplane instead of sliding about on top of it
      if (Math.abs(P.tilt) > 0.0006) {
        const pvx = S.cam.wx(W / 2), pvy = S.cam.wy(H / 2);
        ctx.translate(pvx, pvy); ctx.rotate(P.tilt); ctx.translate(-pvx, -pvy);
      }
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      plCeiling(ctx, S, t, x0, x1);
      plBins(ctx, S, t, x0, x1);
      plWall(ctx, S, t, x0, x1);
      plRow(ctx, S, t, 0, x0, x1);
      plRow(ctx, S, t, 1, x0, x1);
      plRow(ctx, S, t, 2, x0, x1);
      plAisle(ctx, S, t, x0, x1);
    },
    fore: function (ctx, S, t) {
      const P = S.PL;
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      // the row behind you, too close to be in focus, cropped by the frame
      for (let i = Math.floor(x0 / 116) - 1; i < Math.ceil(x1 / 116); i++) {
        const x = i * 116 + 40;
        rect(ctx, x, 496, 92, 160, '#0a0e1a');
        rect(ctx, x, 496, 92, 4, '#1b2440');
        rect(ctx, x + 10, 484, 72, 16, '#1b2036');
        ctx.globalAlpha = 0.5; rect(ctx, x + 10, 484, 72, 2, '#3a4668'); ctx.globalAlpha = 1;
      }
      // the dim of the night cabin, laid over the world so the lit things glow
      if (P.dim > 0.01) {
        ctx.globalAlpha = P.dim * 0.7;
        rect(ctx, x0, -200, x1 - x0, 1000, '#050814');
        ctx.globalAlpha = 1;
      }
    },
    after: function (ctx, S, t) {
      const P = S.PL;
      // the dream, which is drawn over the top of everything because that is
      // what a dream does to a room
      if (P.sleep) {
        const a = P.sleep === 1 ? clamp(P.sleepT / 1.4, 0, 1) : clamp(1 - P.sleepT / 1.2, 0, 1);
        ctx.globalAlpha = a * 0.93; rect(ctx, 0, 0, W, H, '#05040c'); ctx.globalAlpha = 1;
        if (a > 0.5) {
          ctx.globalAlpha = (a - 0.5) * 2;
          // a stage made of tray tables, and a moon with a shell on it
          const dy = 300 + Math.sin(t * 0.7) * 10;
          for (let i = 0; i < 7; i++) rect(ctx, 260 + i * 62, dy + Math.sin(t + i) * 8, 56, 8, '#3a4668');
          ellipsePx(ctx, 740, 140, 62, 62, '#5a1a20');
          ellipsePx(ctx, 740, 140, 58, 58, '#c8402c');
          for (let i = 0; i < 5; i++) ellipsePx(ctx, 712 + (i % 3) * 30, 118 + Math.floor(i / 3) * 34, 9, 8, '#2a0a10');
          for (let i = 0; i < 9; i++) {
            const fx = 180 + i * 72, fy = 420 + Math.sin(t * 1.4 + i) * 6;
            ellipsePx(ctx, fx, fy, 14, 12, '#151a2e');
            circle(ctx, fx - 5, fy - 3, 2, '#8ad8ff'); circle(ctx, fx + 5, fy - 3, 2, '#8ad8ff');
          }
          ctx.globalAlpha = 1;
        }
      }
      // the landing lights, the grade, and the frame round all of it
      if (P.land >= 2) {
        ctx.globalAlpha = 0.1 + 0.05 * Math.sin(t * 2);
        rect(ctx, 0, 0, W, H, P.landStep > 5 ? '#6a7a9a' : '#2a3a6a');
        ctx.globalAlpha = 1;
        letterbox(ctx, Math.round(clamp((P.landT - 10) * 14, 0, 44)), 1);
      }
      grade(ctx, 0, 0, W, H, '#1a2444', 0.1);
      vignette(ctx, 0.42, '#05060e');
    },
    // ---------- the corner of the screen that never leaves ----------
    overlay: function (ctx, S, t) {
      const P = S.PL;
      // the mark, the flight and the hour, top left, always
      rect(ctx, 6, 6, 152, 26, 'rgba(8,10,20,0.62)');
      frame(ctx, 6, 6, 152, 26, withAlpha(DF.gold, 0.35));
      dfStamp(ctx, 10, 9, 19, null);
      drawText(ctx, 'DF0808', 34, 10, DF.cream, { scale: 1 });
      const hr = Math.min(11, Math.floor(P.k * 11) + 1);
      drawText(ctx, 'HOUR ' + hr + ' OF 11', 34, 22, withAlpha(DF.gold, 0.8), { font: 'small' });
      plSeatbeltSign(ctx, 166, 10, P.belt, t);
      // what you still have to do before they will let you land
      if (!P.land) {
        const jobs = [['EAT SOMETHING', P.ate], ['WATCH OR SLEEP', P.watched || P.slept]];
        for (let i = 0; i < jobs.length; i++) {
          const y = 42 + i * 14;
          drawText(ctx, (jobs[i][1] ? '+ ' : '- ') + jobs[i][0], 10, y, jobs[i][1] ? '#6be585' : withAlpha('#cfd6de', 0.5), { font: 'small' });
        }
      }
      if (!Game.touch && !P.land) drawText(ctx, 'UP AND DOWN CHANGE ROWS.  B FOR YOUR BOARDING PASS.', W / 2, H - 14, '#4a4a68', { align: 'center', font: 'small' });
      // the boarding pass, held up to the reading light
      if (P.pass) {
        ctx.globalAlpha = 0.72; rect(ctx, 0, 0, W, H, '#05060e'); ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.08; ellipsePx(ctx, W / 2, 250, 300, 180, '#ffe9a8'); ctx.globalAlpha = 1;
        dfBoardingPass(ctx, W / 2 - 220, 170, 440, 160, {
          name: (Game.run && Game.run.members[0] ? String(Game.run.members[0].name).toUpperCase() : 'BUSKER') + ' / B',
          from: 'LAS VEGAS  LAS', to: 'TOKYO NARITA  NRT', flight: 'DF 0808', seat: '31A', gate: 'C12',
        }, t);
        drawText(ctx, 'IT COST EVERYTHING YOU HAD.', W / 2, 348, withAlpha(DF.cream, 0.6), { align: 'center', scale: 2 });
        drawText(ctx, Game.touch ? 'TAP TO PUT IT AWAY' : 'B TO PUT IT AWAY', W / 2, 376, '#8a82a8', { align: 'center', font: 'small' });
      }
    },
    // ---------- the fittings, painted by hand ----------
    prop: function (ctx, p, t, S) {
      switch (p.kind) {
        case 'pldeck': plDeckDoor(ctx, p, t, S); return true;
        case 'plbulk': plBulkhead(ctx, p, t, S); return true;
        case 'plseat': plSeat31A(ctx, p, t, S); return true;
        case 'plbin': plOverheadBin(ctx, p, t, S); return true;
        case 'plexit': plExit(ctx, p, t, S); return true;
        case 'pltoilet': plToilet(ctx, p, t, S); return true;
        case 'plgalley': plGalley(ctx, p, t, S); return true;
        case 'plcurtain': plCurtain(ctx, p, t, S); return true;
        case 'pltrolley': plTrolley(ctx, p, t, S); return true;
      }
      return false;
    },
    // ---------- what happens when you press the button ----------
    use: function (S, p) {
      const P = S.PL, r = Game.run;
      if (p.act === 'meal') { plMeal(S); return; }
      switch (p.kind) {
        case 'pldeck':
          S.say('', 'THE DOOR IS LOCKED FROM THE INSIDE. IT HAS BEEN SINCE 2001.', false);
          return;
        case 'plseat': {
          P.sat = true;
          S.run([
            { id: 'sit', who: '', voice: false, at: 'you', text: 'THIRTY ONE A. IT IS EXACTLY AS WIDE AS YOU ARE.', choices: [
              { label: 'TURN ON THE TV', note: 'SEAT-BACK', go: function () { P.pending = 'tv'; }, next: 'end' },
              { label: 'GO TO SLEEP', note: P.slept ? 'AGAIN' : '+STAMINA', go: function () { P.pending = 'sleep'; }, next: 'end' },
              { label: 'CHECK YOUR POCKET', go: function () { P.pending = 'pass'; }, next: 'end' },
              { label: 'LOOK OUT OF THE WINDOW', next: 'win' },
              { label: 'STAND UP AGAIN', next: 'end' },
            ] },
            { id: 'win', who: '', voice: false, at: 'you', text: 'BLACK. AND A RED LIGHT ON THE WING, EVERY SECOND, FOR ELEVEN HOURS.',
              do: function () { P.shadeDown = false; } },
            { who: '', voice: false, at: 'you', text: 'YOU WATCH IT UNTIL YOU STOP COUNTING.', next: 'end' },
            { id: 'end' },
          ]);
          return;
        }
        case 'plbin':
          P.binOpen = !P.binOpen;
          Audio.ui(P.binOpen ? 'select' : 'back');
          S.flash(P.binOpen ? 'SOMEBODY ELSE HAS PUT A COAT ON YOUR CASE.' : 'YOU CLOSE IT. IT DOES NOT CLICK.', 3);
          return;
        case 'plexit':
          S.say('', 'DO NOT. THE WHOLE CABIN IS WATCHING YOU STAND HERE.', false);
          return;
        case 'pltoilet':
          if (p.occupied) { Audio.ui('error'); S.flash('OCCUPIED. IT HAS BEEN OCCUPIED FOR TWENTY MINUTES.', 3); return; }
          Audio.ui('select');
          S.run([
            { who: '', voice: false, at: 'you', text: 'A ROOM THE SIZE OF A CUPBOARD, AT SIX HUNDRED MILES AN HOUR.' },
            { who: '', voice: false, at: 'you', text: 'YOU LOOK AT YOURSELF FOR LONGER THAN YOU MEANT TO.',
              do: function () { if (r) { r.stamina = clamp(r.stamina + 8, 0, r.staminaMax); r.save(); } } },
          ]);
          return;
        case 'plgalley':
          S.run([
            { who: 'AYA', voice: 'hostess', at: { x: 1820, y: 380 }, text: 'YOU CANNOT STAND HERE. IT IS THE ONLY PLACE I CAN STAND.' },
            { who: '', voice: false, at: 'you', text: 'SHE HANDS YOU A CUP OF WATER ANYWAY.',
              do: function () { if (r) { r.stamina = clamp(r.stamina + 5, 0, r.staminaMax); r.save(); } } },
          ]);
          return;
      }
    },
    enterLine: 'THE DOORS ARE CLOSED. THE PHONE GOES OFF.',
  };
}

// ---------- beef or chicken ----------
// The only decision anybody makes in eleven hours, and it is not a real one,
// and one of the options has already run out.
function plMeal(S) {
  const P = S.PL, r = Game.run;
  const give = function (st, msg) {
    P.ate = true;
    if (r) { r.stamina = clamp(r.stamina + st, 0, r.staminaMax); r.save(); }
    S.flash(msg, 3.6);
    Audio.ui('eat');
  };
  if (P.ate) {
    S.run([
      { who: 'AYA', voice: 'hostess', at: 'AYA', text: P.fish ? 'STILL THINKING ABOUT THE FISH?' : 'I WILL COME ROUND WITH DRINKS AGAIN.' },
      { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'GO AND SIT DOWN. THIRTY ONE A.' },
    ]);
    return;
  }
  const gone = !P.chicken;
  S.run([
    { id: 'ask', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'CHICKEN OR BEEF?', choices: [
      { label: 'BEEF', next: 'beef' },
      { label: 'CHICKEN', note: gone ? 'GONE' : 'WHILE IT LASTS', next: gone ? 'nochicken' : 'chicken' },
      { label: 'WHAT IS THE FISH', next: 'fish' },
      { label: 'JUST A DRINK', next: 'drink' },
    ] },

    { id: 'beef', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'BEEF. GOOD.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'IS IT BEEF?' },
    { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'IT IS BEEF THE WAY A CHAIR IS A TREE.',
      do: function () { give(18, 'BEEF. THE TRAY IS WARM IN ONE CORNER. +18 STAMINA'); }, next: 'end' },

    { id: 'chicken', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'CHICKEN. THAT WAS THE LAST ONE.' },
    { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'DO NOT TELL ROW THIRTY TWO.',
      do: function () {
        give(26, 'THE LAST CHICKEN ON THE AIRCRAFT. +26 STAMINA');
        if (r && r.consumables.length < 6) { r.consumables.push('energyBar'); S.flash('SHE SLIPS YOU A SPARE ENERGY BAR.', 3.6); r.save(); }
      }, next: 'end' },

    { id: 'nochicken', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'WE RAN OUT AT ROW TWENTY NINE.' },
    { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'THERE IS BEEF. THERE IS ALWAYS BEEF.', choices: [
      { label: 'TAKE THE BEEF', next: 'beef' },
      { label: 'NOTHING, THEN', next: 'nothing' },
    ] },

    { id: 'fish', who: 'YOU', voice: 'you', at: 'you', text: 'WHAT IS THE FISH?' },
    { who: 'AYA', voice: 'hostess', at: 'AYA', text: '...' },
    { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'THE FISH IS FISH.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'RIGHT. THE FISH, THEN.' },
    { who: 'AYA', voice: 'hostess', at: 'AYA', text: 'NOBODY HAS EVER ASKED ME THAT. ELEVEN YEARS.',
      do: function () {
        P.fish = true;
        if (r) { r.karma = (r.karma || 0) + 1; }
        give(12, 'THE FISH IS FISH. IT IS FINE. +12 STAMINA, +1 KARMA');
      }, next: 'end' },

    { id: 'drink', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'DRINK?', choices: [
      { label: 'TOMATO JUICE', next: 'tom' },
      { label: 'GINGER ALE', next: 'ale' },
      { label: 'WATER. JUST WATER.', next: 'wat' },
    ] },
    { id: 'tom', who: '', voice: false, at: 'you', text: 'NOBODY DRINKS THIS ON THE GROUND. UP HERE IT IS THE ONLY THING THAT TASTES OF ANYTHING.',
      do: function () { give(9, 'TOMATO JUICE AT THIRTY SEVEN THOUSAND FEET. +9 STAMINA'); }, next: 'end' },
    { id: 'ale', who: '', voice: false, at: 'you', text: 'THE CAN IS COLD AND THE CUP IS FULL OF ICE AND YOU GET ABOUT A THIRD OF IT.',
      do: function () { give(8, 'HALF A CAN AND A CUP OF ICE. +8 STAMINA'); }, next: 'end' },
    { id: 'wat', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'GOOD. NOBODY DRINKS ENOUGH UP HERE.',
      do: function () { give(11, 'WATER. SHE LEAVES THE BOTTLE. +11 STAMINA'); }, next: 'end' },

    { id: 'nothing', who: 'AYA', voice: 'hostess', at: 'AYA', text: 'I WILL COME BACK ROUND.', next: 'end' },
    { id: 'end' },
  ]);
}
