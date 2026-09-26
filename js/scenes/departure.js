// ---------- Harry Reid, or whatever it is called this year ----------
// The airport you leave from. Kerb, check-in, security, the long bright walk
// past everything you cannot afford, and then a gate with a window onto the
// apron where your aeroplane is being fed by four different trucks at once.
//
// It is one continuous side-scrolling building. Two levels, joined by
// escalators, and about a hundred and thirty people in it who are all doing
// something specific.
'use strict';

const DEP_W = 7400;
const DEP_UP = 236, DEP_LO = 452;                  // the two floor lines
const DEP_PAL = {
  wall: '#cfd4dc', wallLo: '#aeb4be', wallHi: '#e8ecf1',
  floor: '#9aa2ae', floorLo: '#868e9a',
  glass: '#2f4a68', steel: '#8a939e', dark: '#12141c',
  green: '#1f6f4a', amber: '#f2a03a', ink: '#1b2230',
  dusk1: '#2a1f3e', dusk2: '#8a4a3a', dusk3: '#e0824a',
};
// where things are, so the signs and the objective can agree with the building
const DEP_ZONES = [
  { id: 'kerb', name: 'KERBSIDE', x0: 0, x1: 700 },
  { id: 'checkin', name: 'CHECK-IN A-K', x0: 700, x1: 2150 },
  { id: 'security', name: 'SECURITY', x0: 2150, x1: 2950 },
  { id: 'duty', name: 'DUTY FREE', x0: 2950, x1: 4000 },
  { id: 'concourse', name: 'CONCOURSE C', x0: 4000, x1: 5500 },
  { id: 'gates', name: 'GATES C1 - C20', x0: 5500, x1: 7400 },
];
function depZoneAt(x) {
  for (let i = 0; i < DEP_ZONES.length; i++) if (x >= DEP_ZONES[i].x0 && x < DEP_ZONES[i].x1) return DEP_ZONES[i];
  return DEP_ZONES[DEP_ZONES.length - 1];
}

// ---------- the sky, seen through a wall of glass ----------
// Dusk, because every airport looks best at the hour you are least able to
// enjoy it.
function depSkyBand(ctx, x, y, w, h, t) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, DEP_PAL.dusk1); g.addColorStop(0.52, '#6a3a4a'); g.addColorStop(0.78, DEP_PAL.dusk2); g.addColorStop(1, DEP_PAL.dusk3);
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  // bands of cloud, lit orange underneath
  const r = makeRng(9021);
  for (let i = 0; i < 22; i++) {
    const cx = x + r.range(0, w), cy = y + r.range(h * 0.1, h * 0.72), cw = r.range(70, 230), ch = r.range(6, 15);
    ctx.globalAlpha = 0.34; ellipsePx(ctx, cx, cy, cw / 2, ch / 2, '#3a2a44');
    ctx.globalAlpha = 0.26; ellipsePx(ctx, cx + 4, cy + ch * 0.4, cw / 2.4, ch / 3, '#c8703a');
    ctx.globalAlpha = 1;
  }
  // a couple of aircraft on approach, strobing
  for (let i = 0; i < 3; i++) {
    const ax = x + ((t * (7 + i * 3) + i * 400) % (w + 200)) - 100, ay = y + h * (0.18 + i * 0.11);
    rect(ctx, ax, ay, 5, 2, '#2a2436');
    if (Math.floor(t * 3 + i) % 2) px(ctx, ax + 5, ay, '#ff6a5a');
  }
}
// The apron: the whole reason a terminal has windows.
function depApron(ctx, x, y, w, h, t, opts) {
  const o = opts || {};
  depSkyBand(ctx, x, y, w, h * 0.46, t);
  const gy = y + h * 0.46;
  // the far city, then the taxiways
  const sk = skylineCanvas(31, Math.max(64, Math.round(w)), 42, { color: '#1a1424', lit: '#ffb060', density: 0.28 });
  ctx.drawImage(sk, x, gy - 42);
  rect(ctx, x, gy, w, h - (gy - y), '#1b1f28');
  rect(ctx, x, gy, w, 3, '#2a3038');
  // taxiway centreline and the hold-short bars
  for (let i = 0; i < w; i += 26) { ctx.globalAlpha = 0.8; rect(ctx, x + i, gy + Math.round(h * 0.2), 14, 2, '#d8b83c'); ctx.globalAlpha = 1; }
  for (let i = 0; i < w; i += 8) rect(ctx, x + i, gy + Math.round(h * 0.34), 4, 2, '#3a4048');
  // the mast lights, and the pools they put down
  for (let i = 0; i < Math.ceil(w / 150); i++) {
    const lx = x + 46 + i * 150;
    rect(ctx, lx - 1, gy - 54, 3, 54, '#2a3038');
    rect(ctx, lx - 7, gy - 60, 15, 6, '#3a4048');
    for (let k = 0; k < 3; k++) { ctx.globalAlpha = 0.85; rect(ctx, lx - 6 + k * 5, gy - 59, 3, 3, '#ffe9a8'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.12; ellipsePx(ctx, lx, gy + h * 0.24, 66, 26, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  // blue edge lights running away into the dark
  for (let i = 0; i < w; i += 34) { ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2 + i); px(ctx, x + i, gy + Math.round(h * 0.42), '#6ac8ff'); ctx.globalAlpha = 1; }
  // ---- the aeroplane, side on, nose to the left
  const px0 = x + (o.planeX != null ? o.planeX : w * 0.16), py = gy + h * 0.2;
  depAircraft(ctx, px0, py, (o.planeW || Math.min(560, w * 0.72)), t);
  // ---- the things feeding it
  depGroundTruck(ctx, px0 + 40, py + 26, t, 'fuel');
  depGroundTruck(ctx, px0 + 250, py + 30, t, 'catering');
  depBagTrain(ctx, px0 + 150, py + 36, t);
  // ---- crew in hi-vis, doing the walk-round
  for (let i = 0; i < 3; i++) {
    const cx = px0 + 90 + i * 70 + Math.sin(t * 0.4 + i) * 14, cy = py + 34;
    ctx.globalAlpha = 0.3; ellipsePx(ctx, cx, cy + 1, 5, 2, '#000'); ctx.globalAlpha = 1;
    rect(ctx, cx - 2, cy - 9, 4, 6, '#d8e84a');
    rect(ctx, cx - 2, cy - 3, 4, 3, '#2a3a5a');
    rect(ctx, cx - 2, cy - 12, 4, 3, '#e8e2d4');
    if (i === 1) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8); rect(ctx, cx + 3, cy - 8, 2, 5, '#ff6a2a'); ctx.globalAlpha = 1; }
  }
  // the terminal's own reflection, faint, over the top of all of it
  ctx.globalAlpha = 0.08; vgrad(ctx, x, y, w, h, '#ffffff', '#000000'); ctx.globalAlpha = 1;
}
// A narrow-body in Dragon Fly colours: white over navy, gold cheatline.
function depAircraft(ctx, x, y, w, t) {
  const h = Math.round(w * 0.14);
  const bodyY = y - h;
  ctx.globalAlpha = 0.34; ellipsePx(ctx, x + w / 2, y + 12, w * 0.44, 6, '#000'); ctx.globalAlpha = 1;
  // fuselage, with a nose cone and a tail cone
  rect(ctx, x + w * 0.1, bodyY, w * 0.78, h, '#eef1f6');
  ctx.fillStyle = '#eef1f6'; ctx.beginPath();
  ctx.moveTo(x + w * 0.1, bodyY); ctx.lineTo(x + w * 0.1, bodyY + h); ctx.lineTo(x, bodyY + h * 0.66); ctx.lineTo(x + w * 0.02, bodyY + h * 0.2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + w * 0.88, bodyY); ctx.lineTo(x + w * 0.88, bodyY + h); ctx.lineTo(x + w, bodyY + h * 0.1); ctx.fill();
  rect(ctx, x + w * 0.02, bodyY, w * 0.96, 3, '#ffffff');
  // the cheatline and the belly
  rect(ctx, x + w * 0.02, bodyY + h * 0.58, w * 0.9, Math.max(2, h * 0.08), DF.gold);
  rect(ctx, x + w * 0.04, bodyY + h * 0.68, w * 0.86, h * 0.32, DF.navy);
  // windows, and the flight deck
  for (let i = 0; i < Math.floor(w / 15); i++) rect(ctx, Math.round(x + w * 0.16 + i * 15), Math.round(bodyY + h * 0.3), 5, 4, '#2a3a5a');
  rect(ctx, Math.round(x + w * 0.06), Math.round(bodyY + h * 0.22), 12, 6, '#1b2a3e');
  rect(ctx, Math.round(x + w * 0.06), Math.round(bodyY + h * 0.22), 12, 2, '#8fc0e4');
  // the door, open, with the bridge nudged up to it
  rect(ctx, Math.round(x + w * 0.2), Math.round(bodyY + h * 0.16), 10, Math.round(h * 0.56), '#12141c');
  // wing and engine
  ctx.fillStyle = '#d8dce2'; ctx.beginPath();
  ctx.moveTo(x + w * 0.44, bodyY + h); ctx.lineTo(x + w * 0.76, bodyY + h * 1.05); ctx.lineTo(x + w * 0.66, bodyY + h * 1.22); ctx.lineTo(x + w * 0.4, bodyY + h * 1.1); ctx.fill();
  const ex = x + w * 0.46, ey = bodyY + h * 1.08;
  ellipsePx(ctx, ex, ey, w * 0.052, h * 0.3, '#c8ccd4');
  ellipsePx(ctx, ex - w * 0.03, ey, w * 0.022, h * 0.26, '#2a2f38');
  rect(ctx, ex - w * 0.05, ey - h * 0.3, w * 0.1, 2, '#9aa0a8');
  // tail
  dfTail(ctx, x + w * 0.8, bodyY + 2, w * 0.2, h * 1.5);
  // the bits that blink
  ctx.globalAlpha = Math.floor(t * 2) % 2 ? 1 : 0.15;
  px(ctx, Math.round(x + w * 0.44), Math.round(bodyY + h * 1.24), '#ff4a3a');
  px(ctx, Math.round(x + w * 0.76), Math.round(bodyY + h * 1.04), '#6be585');
  ctx.globalAlpha = 1;
  // gear
  for (const gx of [x + w * 0.16, x + w * 0.5, x + w * 0.56]) {
    rect(ctx, Math.round(gx), Math.round(bodyY + h), 2, 10, '#5a6472');
    circle(ctx, Math.round(gx + 1), Math.round(bodyY + h + 11), 3, '#1b1f26');
  }
}
function depGroundTruck(ctx, x, y, t, kind) {
  const w = kind === 'catering' ? 46 : 40, h = 16;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x + w / 2, y + 1, w * 0.45, 3, '#000'); ctx.globalAlpha = 1;
  if (kind === 'fuel') {
    rect(ctx, x, y - h, w, h - 4, '#c8402c');
    ellipsePx(ctx, x + w * 0.62, y - h + 4, w * 0.3, 5, '#e8e2d4');
    rect(ctx, x, y - h, 12, h - 4, '#8a2a1c');
    rect(ctx, x + 2, y - h + 2, 8, 5, '#8fc0e4');
  } else {
    rect(ctx, x, y - h - 10, w, h + 6, '#e8e2d4');
    rect(ctx, x, y - h - 10, w, 3, '#f4f1ea');
    rect(ctx, x, y - h - 2, w, 2, '#8a939e');
    rect(ctx, x + w - 12, y - h - 4, 12, 8, '#8a939e');   // the scissor lift
    rect(ctx, x + 1, y - h - 8, 8, 5, '#8fc0e4');
  }
  circle(ctx, x + 6, y - 2, 3, '#1b1f26'); circle(ctx, x + w - 6, y - 2, 3, '#1b1f26');
  ctx.globalAlpha = Math.floor(t * 4) % 2 ? 0.9 : 0.2;
  rect(ctx, x + w / 2 - 2, y - h - (kind === 'catering' ? 13 : 3), 4, 3, '#f2a03a');
  ctx.globalAlpha = 1;
}
function depBagTrain(ctx, x, y, t) {
  const off = (t * 9) % 120;
  const bx = x - off;
  rect(ctx, bx, y - 12, 18, 10, '#3a4250');
  rect(ctx, bx + 2, y - 15, 9, 4, '#8fc0e4');
  circle(ctx, bx + 4, y - 1, 2, '#1b1f26'); circle(ctx, bx + 14, y - 1, 2, '#1b1f26');
  for (let i = 0; i < 3; i++) {
    const cx = bx + 22 + i * 22;
    rect(ctx, cx, y - 11, 18, 9, '#5a6472');
    rect(ctx, cx, y - 11, 18, 2, '#78828e');
    for (let k = 0; k < 3; k++) rect(ctx, cx + 2 + k * 5, y - 16, 4, 5, ['#2f4a8a', '#8a2a1c', '#2f6a4a'][(i + k) % 3]);
    circle(ctx, cx + 4, y - 1, 2, '#1b1f26'); circle(ctx, cx + 14, y - 1, 2, '#1b1f26');
  }
}

// ---------- the building ----------
function depTrussRoof(ctx, x0, x1, y, t) {
  rect(ctx, x0, y - 74, x1 - x0, 74, '#1a1e26');
  rect(ctx, x0, y - 6, x1 - x0, 6, '#2a303a');
  // exposed white trusses, the airport's one honest structural gesture
  for (let x = x0; x < x1; x += 120) {
    rect(ctx, x, y - 70, 4, 64, '#e8ecf1');
    for (let i = 0; i < 5; i++) line(ctx, x + 4, y - 68 + i * 14, x + 118, y - 62 + i * 14, '#c8ccd4');
    line(ctx, x + 4, y - 8, x + 118, y - 68, '#d8dce2');
  }
  rect(ctx, x0, y - 74, x1 - x0, 4, '#f0f3f6');
  // the lights hanging off it
  for (let x = x0 + 60; x < x1; x += 160) {
    rect(ctx, x - 1, y - 6, 2, 12, '#3a4048');
    rect(ctx, x - 14, y + 6, 28, 5, '#e8ecf1');
    ctx.globalAlpha = 0.14; ellipsePx(ctx, x, y + 60, 62, 56, '#ffe9a8'); ctx.globalAlpha = 1;
  }
}
// A departures board: rows that flip, a column of gates, and one red DELAYED.
function depBoard(ctx, x, y, w, h, t, seed) {
  rect(ctx, x - 4, y - 4, w + 8, h + 8, '#0d1018');
  rect(ctx, x, y, w, h, '#05070c');
  frame(ctx, x - 4, y - 4, w + 8, h + 8, '#2a3040');
  const rows = Math.max(3, Math.floor((h - 16) / 13));
  const cities = ['TOKYO NRT', 'SEOUL ICN', 'LONDON LHR', 'PARIS CDG', 'SYDNEY SYD', 'MEXICO MEX', 'DENVER DEN', 'MIAMI MIA', 'SEATTLE SEA', 'OSAKA KIX', 'TAIPEI TPE', 'DUBAI DXB'];
  drawText(ctx, 'DEPARTURES', x + 6, y + 4, DEP_PAL.amber, { scale: 1 });
  drawText(ctx, 'GATE', x + w - 8, y + 4, DEP_PAL.amber, { align: 'right', scale: 1 });
  rect(ctx, x + 4, y + 13, w - 8, 1, '#2a3040');
  const r = makeRng(seed || 17);
  for (let i = 0; i < rows - 1; i++) {
    const ry = y + 17 + i * 13;
    const flip = ((t * 0.5 + i * 0.7) % 9) < 0.35;     // the split-flap moment
    const city = cities[(i + Math.floor(t / 9)) % cities.length];
    const late = i === 2;
    drawText(ctx, 'DF' + pad2(r.int(1, 9)) + r.int(10, 99), x + 6, ry, '#cfd6de', { font: 'small' });
    if (flip) { rect(ctx, x + 46, ry - 1, w - 96, 8, '#1b2230'); for (let k = 0; k < 6; k++) rect(ctx, x + 48 + k * 11, ry, 8, 6, '#3a4250'); }
    else drawText(ctx, city, x + 46, ry, late ? '#ff6a5a' : DEP_PAL.amber, { font: 'small' });
    drawText(ctx, late ? 'DELAYED' : pad2(6 + i) + ':' + pad2((i * 17) % 60), x + w - 40, ry, late ? '#ff6a5a' : '#cfd6de', { align: 'right', font: 'small' });
    drawText(ctx, 'C' + (i + 3), x + w - 8, ry, '#6be585', { align: 'right', font: 'small' });
  }
  ctx.globalAlpha = 0.07; for (let i = 0; i < h; i += 3) rect(ctx, x, y + i, w, 1, '#000'); ctx.globalAlpha = 1;
}
// A check-in desk: a scale, a belt into the floor, a screen, a bell nobody rings.
function depDesk(ctx, x, y, w, t, i, staff) {
  rect(ctx, x, y - 44, w, 44, '#e2e6ec');
  rect(ctx, x, y - 44, w, 4, '#f4f7fa');
  rect(ctx, x, y - 8, w, 8, '#9aa0aa');
  rect(ctx, x + 2, y - 40, w - 4, 3, DF.navy);
  // the scale, sunk into the end, with a bag on it half the time
  rect(ctx, x + w - 44, y - 12, 40, 5, '#5a6472');
  rect(ctx, x + w - 44, y - 14, 40, 2, '#8a939e');
  if (i % 2 === 0) {
    const c = ['#2f4a8a', '#8a2a1c', '#2f6a4a', '#8a6a2a'][i % 4];
    rect(ctx, x + w - 38, y - 32, 26, 18, c);
    rect(ctx, x + w - 38, y - 32, 26, 3, lighten(c, 0.28));
    rect(ctx, x + w - 28, y - 35, 7, 3, '#8a8f98');
    drawText(ctx, 'HVY', x + w - 25, y - 26, '#f4f1ea', { align: 'center', font: 'small' });
  }
  // the screen the agent is actually looking at
  rect(ctx, x + 10, y - 62, 26, 20, '#1b2230');
  rect(ctx, x + 12, y - 60, 22, 15, '#0d2a1a');
  for (let k = 0; k < 4; k++) rect(ctx, x + 13, y - 58 + k * 4, 6 + ((i + k) % 4) * 3, 1, '#6be585');
  // the desk number and the class sign hanging over it
  rect(ctx, x + w / 2 - 22, y - 96, 44, 22, DF.navy);
  rect(ctx, x + w / 2 - 22, y - 96, 44, 2, DF.navyHi);
  drawText(ctx, String.fromCharCode(65 + (i % 11)) + (10 + i), x + w / 2, y - 89, DF.gold, { align: 'center', scale: 2 });
  // and the agent behind it
  if (staff) drawBugAt(ctx, staff, x + 24, y - 44, { pose: Math.floor(t * 1.1 + i) % 3 ? 'idle' : 'talk', scale: 1.25, bounce: 0.35, phase: i });
}
// A retractable-belt queue. The most honest object in any airport.
function depQueue(ctx, x, y, w, t, rows) {
  for (let r2 = 0; r2 < (rows || 2); r2++) {
    const ry = y - r2 * 16;
    for (let i = 0; i <= w; i += 62) {
      rect(ctx, x + i, ry - 34, 4, 34, '#5a6472');
      rect(ctx, x + i - 2, ry - 36, 8, 3, '#8a939e');
      ctx.globalAlpha = 0.3; ellipsePx(ctx, x + i + 2, ry, 6, 2, '#000'); ctx.globalAlpha = 1;
    }
    rect(ctx, x, ry - 30, w, 3, r2 % 2 ? '#2f4a8a' : '#8a2a1c');
    for (let i = 0; i < w; i += 18) rect(ctx, x + i, ry - 30, 6, 3, '#f4f1ea');
  }
}
// Security: trays, a tunnel with a screen showing what is in the bag, an arch.
function depSecurity(ctx, x, y, t) {
  // the roller table in
  rect(ctx, x, y - 34, 150, 8, '#8a939e');
  for (let i = 0; i < 150; i += 9) circle(ctx, x + i + 4, y - 30, 3, '#5a6472');
  rect(ctx, x, y - 26, 150, 26, '#5a6472');
  // grey trays with somebody's whole life in them
  const things = [['#1b1b24', 6, 4], ['#8a6a44', 10, 6], ['#c8402c', 7, 5], ['#e8e2d4', 9, 4]];
  for (let i = 0; i < 4; i++) {
    const tx = x + 8 + ((i * 38 + t * 12) % 140);
    rect(ctx, tx, y - 38, 32, 5, '#6a7079');
    rect(ctx, tx, y - 39, 32, 2, '#9aa0a8');
    const th = things[i % 4];
    rect(ctx, tx + 10, y - 39 - th[2], th[1], th[2], th[0]);
  }
  // the X-ray tunnel
  rect(ctx, x + 150, y - 68, 110, 68, '#c8ccd4');
  rect(ctx, x + 150, y - 68, 110, 5, '#e8ecf1');
  rect(ctx, x + 160, y - 46, 90, 24, '#12141c');
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 6); rect(ctx, x + 160, y - 46, 90, 24, '#2a1f10'); ctx.globalAlpha = 1;
  // the operator's screen, with a bag on it in orange and blue
  rect(ctx, x + 268, y - 76, 52, 38, '#1b2230');
  rect(ctx, x + 271, y - 73, 46, 30, '#06202a');
  const bw = 20 + Math.round(6 * Math.sin(t));
  rect(ctx, x + 278, y - 62, bw, 14, '#2a6a7a');
  rect(ctx, x + 281, y - 59, 7, 7, '#e88a2a');
  rect(ctx, x + 291, y - 57, 4, 9, '#3a3a5a');
  drawText(ctx, 'SCAN', x + 294, y - 70, '#6be585', { align: 'center', font: 'small' });
  // the arch you walk through, and the light on top of it
  rect(ctx, x + 340, y - 116, 12, 116, '#e2e6ec');
  rect(ctx, x + 412, y - 116, 12, 116, '#e2e6ec');
  rect(ctx, x + 340, y - 122, 84, 12, '#d0d5dc');
  const on = Math.floor(t * 0.7) % 4 === 0;
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 9);
  rect(ctx, x + 370, y - 120, 24, 6, on ? '#ff5a4a' : '#6be585');
  ctx.globalAlpha = 1;
  rect(ctx, x + 346, y - 110, 72, 3, '#9aa0aa');
  // the bin of confiscated water, which is the saddest object in the building
  rect(ctx, x + 440, y - 30, 34, 30, '#3a4250');
  rect(ctx, x + 440, y - 33, 34, 4, '#5a6472');
  for (let i = 0; i < 7; i++) {
    const bx = x + 444 + (i % 4) * 8, by = y - 30 + Math.floor(i / 4) * 6;
    rect(ctx, bx, by - 10, 5, 11, '#8fc0e4');
    rect(ctx, bx, by - 12, 5, 2, '#e8503a');
  }
  drawText(ctx, 'NO LIQUIDS', x + 457, y - 44, '#cfd6de', { align: 'center', font: 'small' });
}
// The gate: a desk with a scanner, rows of seating, and the door to the bridge.
function depGateDesk(ctx, x, y, t, num, boarding) {
  rect(ctx, x, y - 48, 120, 48, '#e2e6ec');
  rect(ctx, x, y - 48, 120, 4, '#f4f7fa');
  rect(ctx, x, y - 10, 120, 10, '#9aa0aa');
  rect(ctx, x + 6, y - 44, 108, 3, DF.navy);
  // the two podiums with the scanners that go beep
  for (let i = 0; i < 2; i++) {
    const px2 = x + 20 + i * 62;
    rect(ctx, px2, y - 68, 26, 22, '#c8ccd4');
    rect(ctx, px2 + 3, y - 65, 20, 12, '#12141c');
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5 + i * 2);
    rect(ctx, px2 + 5, y - 63, 16, 8, boarding ? '#6be585' : '#3a4250');
    ctx.globalAlpha = 1;
  }
  // the sign over it
  rect(ctx, x + 10, y - 124, 100, 40, DF.navy);
  rect(ctx, x + 10, y - 124, 100, 3, DF.navyHi);
  drawText(ctx, 'GATE', x + 60, y - 119, DF.cream, { align: 'center', font: 'small' });
  drawText(ctx, num, x + 60, y - 110, DF.gold, { align: 'center', scale: 3 });
  ctx.globalAlpha = boarding ? (0.55 + 0.45 * Math.sin(t * 4)) : 0.5;
  drawText(ctx, boarding ? 'BOARDING' : 'ON TIME', x + 60, y - 92, boarding ? '#6be585' : '#cfd6de', { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
}
function depGateSeats(ctx, x, y, n, t) {
  // A beam of moulded seats on one steel rail, with the armrest that exists
  // for the sole purpose of stopping anybody lying down.
  rect(ctx, x - 6, y - 16, n * 40 + 12, 5, '#6a7280');
  rect(ctx, x - 6, y - 16, n * 40 + 12, 2, '#9aa0aa');
  for (let i = 0; i < n; i++) {
    const sx = x + i * 40;
    rect(ctx, sx + 4, y - 4, 5, 4, '#4a5260');
    rect(ctx, sx, y - 34, 34, 18, '#2f4a68');
    rect(ctx, sx, y - 34, 34, 3, '#5a83ac');
    rect(ctx, sx, y - 18, 34, 3, '#1f3550');
    rect(ctx, sx + 28, y - 62, 7, 30, '#2f4a68');
    rect(ctx, sx + 28, y - 62, 7, 3, '#5a83ac');
    rect(ctx, sx - 2, y - 44, 4, 14, '#8a939e');
    if (i === n - 1) rect(ctx, sx + 35, y - 44, 4, 14, '#8a939e');
    ctx.globalAlpha = 0.22; rect(ctx, sx + 3, y - 31, 28, 4, '#8fc0e4'); ctx.globalAlpha = 1;
  }
}

// ---------- the props this building needs ----------
function depProp(ctx, p, t, S) {
  const x = Math.round(p.x - p.w / 2), w = Math.round(p.w), h = Math.round(p.h || 40);
  const base = Math.round(S.propY(p)), y = base - h;
  switch (p.kind) {
    case 'depdesk': depDesk(ctx, x, base, w, t, p.i || 0, p.staff); return;
    case 'depboard': depBoard(ctx, x, y, w, h, t, p.seed); return;
    case 'depsec': depSecurity(ctx, x, base, t); return;
    case 'depgate': depGateDesk(ctx, x, base, t, p.num || 'C12', !!(S.DEP && S.DEP.boarding)); return;
    case 'depseats': depGateSeats(ctx, x, base, p.n || 6, t); return;
    case 'depqueue': depQueue(ctx, x, base, w, t, p.rows); return;
    case 'deptrolleys': drawTrolleyStack(ctx, p.x, base, p.n || 4); return;
    case 'deptrash': drawTrashPile(ctx, x, base, p.n || 3, p.seed); return;
    case 'depbot': drawCleanBot(ctx, p.x, base, t, { scale: 1, phase: p.seed || 0, range: p.range || 90 }); return;
    case 'depkiosk': {   // a self-service check-in machine
      rect(ctx, x, y, w, h, '#e2e6ec'); rect(ctx, x, y, w, 4, '#f4f7fa');
      rect(ctx, x + 4, y + 8, w - 8, h * 0.44, '#12141c');
      ctx.globalAlpha = 0.9; rect(ctx, x + 6, y + 10, w - 12, h * 0.4, DF.navy); ctx.globalAlpha = 1;
      drawText(ctx, 'TOUCH', p.x, y + 18, DF.gold, { align: 'center', font: 'small' });
      dfStamp(ctx, p.x - 9, y + 26, 18);
      rect(ctx, x + 6, y + h * 0.6, w - 12, 5, '#5a6472');     // the boarding-pass slot
      rect(ctx, x + 8, y + h * 0.72, w - 16, 3, '#8a939e');
      return;
    }
    case 'depcharge': {  // a charging column with every plug and no free socket
      rect(ctx, x, y, w, h, '#3a4250'); rect(ctx, x, y, w, 3, '#5a6472');
      rect(ctx, x + 2, y + 6, w - 4, h - 14, '#242a34');
      for (let i = 0; i < 6; i++) {
        const cx2 = x + 5 + (i % 2) * (w - 14), cy2 = y + 12 + Math.floor(i / 2) * 16;
        rect(ctx, cx2, cy2, 8, 8, '#12141c');
        rect(ctx, cx2 + 2, cy2 + 2, 4, 4, i < 5 ? '#6be585' : '#5a6472');
        if (i < 5) { line(ctx, cx2 + 4, cy2 + 8, cx2 + 4 + (i % 2 ? 10 : -10), cy2 + 22, '#e8e2d4'); }
      }
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 2); rect(ctx, x + w / 2 - 6, y + h - 8, 12, 3, '#8ad8ff'); ctx.globalAlpha = 1;
      return;
    }
    case 'depwater': {   // a bottle filler, with a counter of bottles saved
      rect(ctx, x, y, w, h, '#5a6472'); rect(ctx, x, y, w, 3, '#8a939e');
      rect(ctx, x + 4, y + 10, w - 8, 16, '#1b2230');
      drawText(ctx, String(4100 + Math.floor(t) % 90), p.x, y + 15, '#6be585', { align: 'center', font: 'small' });
      rect(ctx, x + w / 2 - 2, y + 30, 4, 8, '#b9bec6');
      ctx.globalAlpha = 0.5; rect(ctx, x + w / 2 - 1, y + 38, 2, h - 44, '#8ad8ff'); ctx.globalAlpha = 1;
      return;
    }
    case 'depsmoke': {   // the glass box where the smokers are kept
      glassWall(ctx, x, y, w, h, t, { tint: '#3a3a44', top: '#8a8f98', bot: '#2a2a34', mullion: 34 });
      ctx.globalAlpha = 0.34;
      for (let i = 0; i < 5; i++) ellipsePx(ctx, x + 14 + i * 22, y + 20 + Math.sin(t + i) * 6, 14, 9, '#c8c8d0');
      ctx.globalAlpha = 1;
      rect(ctx, x + w / 2 - 26, y - 16, 52, 14, '#3a3a44');
      drawText(ctx, 'SMOKING', p.x, y - 13, '#cfd6de', { align: 'center', font: 'small' });
      return;
    }
    case 'depmassage': { // the chairs that take coins and change nothing
      for (let i = 0; i < 2; i++) {
        const cx2 = x + i * 56;
        rect(ctx, cx2, base - 44, 44, 20, '#2a2434'); rect(ctx, cx2, base - 44, 44, 3, '#4a4058');
        rect(ctx, cx2 + 30, base - 74, 14, 32, '#2a2434');
        rect(ctx, cx2 + 4, base - 24, 6, 24, '#1b1622'); rect(ctx, cx2 + 32, base - 24, 6, 24, '#1b1622');
        rect(ctx, cx2 + 36, base - 70, 6, 8, '#c8402c');
      }
      return;
    }
    case 'depapron': { // a window onto everything you are about to do
      rect(ctx, x - 6, y - 6, w + 12, h + 12, '#6a7280');
      depApron(ctx, x, y, w, h, t, p);
      for (let i = 0; i <= w; i += 108) rect(ctx, x + i, y, 5, h, '#6a7280');
      rect(ctx, x, y, w, 5, '#6a7280'); rect(ctx, x, y + h - 5, w, 5, '#6a7280');
      ctx.globalAlpha = 0.09;
      for (let i = -h; i < w; i += 70) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(x + i, y + h); ctx.lineTo(x + i + 16, y + h); ctx.lineTo(x + i + 16 + h, y); ctx.lineTo(x + i + h, y); ctx.fill(); ctx.restore(); }
      ctx.globalAlpha = 1;
      return;
    }
    case 'depad': {     // a backlit advertisement for something absurd
      rect(ctx, x - 4, y - 4, w + 8, h + 8, '#1b1f28');
      rect(ctx, x, y, w, h, p.col || '#2f4a68');
      ctx.globalAlpha = 0.22; vgrad(ctx, x, y, w, h, '#ffffff', '#000000'); ctx.globalAlpha = 1;
      if (p.mark) brandLogo(ctx, p.x, y + h * 0.36, Math.min(26, h * 0.22), { logo: p.mark, col: p.col2 || '#f4f1ea', col2: p.col || '#2f4a68' }, t);
      drawText(ctx, p.text || 'FLY BETTER', p.x, y + h * 0.62, p.col2 || '#f4f1ea', { align: 'center', scale: 2 });
      if (p.sub) drawText(ctx, p.sub, p.x, y + h * 0.62 + 18, withAlpha(p.col2 || '#f4f1ea', 0.7), { align: 'center', font: 'small' });
      ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 1.7 + p.x); rect(ctx, x, y + h, w, 10, p.col2 || '#f4f1ea'); ctx.globalAlpha = 1;
      return;
    }
    case 'depsign': {   // the overhead wayfinding, green and unambiguous
      rect(ctx, x, y, w, h, DEP_PAL.green);
      rect(ctx, x, y, w, 2, lighten(DEP_PAL.green, 0.3));
      frame(ctx, x, y, w, h, '#0d2a1a');
      rect(ctx, p.x - 1, y - 16, 2, 16, '#5a6472');
      const tx = p.arrow ? (p.arrow > 0 ? -10 : 10) : 0;
      drawText(ctx, p.text || 'GATES', p.x + tx, y + h / 2 - 7, '#f4f1ea', { align: 'center', scale: 2 });
      if (p.arrow) {
        ctx.fillStyle = '#f4f1ea'; const ax = p.arrow > 0 ? x + w - 14 : x + 14, d = Math.sign(p.arrow);
        ctx.beginPath(); ctx.moveTo(ax + d * 7, y + h / 2); ctx.lineTo(ax - d * 5, y + h / 2 - 8); ctx.lineTo(ax - d * 5, y + h / 2 + 8); ctx.fill();
      }
      if (p.sub) drawText(ctx, p.sub, p.x, y + h - 10, '#b8e8cc', { align: 'center', font: 'small' });
      return;
    }
    case 'depbridge': { // the jet bridge door, the last door
      rect(ctx, x, y, w, h, '#3a4250');
      rect(ctx, x + 4, y + 4, w - 8, h - 8, '#12141c');
      ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 2);
      rect(ctx, x + 6, y + 6, w - 12, h - 12, '#8fc0e4'); ctx.globalAlpha = 1;
      rect(ctx, x, y, w, 5, '#5a6472');
      rect(ctx, x + w / 2 - 30, y - 22, 60, 18, DF.navy);
      drawText(ctx, 'DF 0808', p.x, y - 18, DF.gold, { align: 'center', scale: 2 });
      return;
    }
  }
  return false;
}

// The terminal itself now lives in js/scenes/las.js: Harry Reid T3, rebuilt.

// ---------- the last forty metres ----------
// A jet bridge is a corridor that smells of kerosene and carpet. It slopes,
// it has one window, and everybody on it is quiet.
class JetBridgeScene extends SideScene {
  constructor(opts) { super(jbDef(), opts || {}); }
}
function jbDef() {
  return {
    name: 'GATE E12', sub: 'MIND THE STEP', tint: '#1f3f7a',
    w: 1500, zoom: 1.15, yBias: 0.72, hud: false, canLeave: false, heroScale: 1.7, speed: 112,
    start: { x: 80, floor: 0 },
    floors: [{ y: 430, z: 1 }],
    enterLine: 'IT SLOPES. IT ALWAYS SLOPES.',
    sky: function (ctx) { rect(ctx, 0, 0, W, H, '#0a0c12'); },
    mid: function (ctx, S, t) {
      // the tube: ribbed panels, a low ceiling, and one strip light per rib
      rect(ctx, 0, 120, 1500, 340, '#3f4653');
      rect(ctx, 0, 120, 1500, 6, '#5a6472');
      for (let x = 0; x < 1500; x += 58) {
        rect(ctx, x, 120, 4, 310, '#333a46');
        rect(ctx, x + 4, 120, 2, 310, '#4a5260');
        rect(ctx, x + 12, 126, 34, 5, '#e8ecf1');
        ctx.globalAlpha = 0.1; ellipsePx(ctx, x + 29, 300, 46, 170, '#ffe9a8'); ctx.globalAlpha = 1;
      }
      // the handrail down one side
      rect(ctx, 0, 330, 1500, 5, '#8a939e');
      for (let x = 20; x < 1500; x += 120) rect(ctx, x, 335, 4, 24, '#6a7280');
      // the one window, with the aeroplane filling it
      rect(ctx, 520, 190, 300, 130, '#1b1f28');
      depApron(ctx, 526, 196, 288, 118, t, { planeX: 30, planeW: 330 });
      for (let i = 0; i <= 288; i += 96) rect(ctx, 526 + i, 190, 5, 130, '#6a7280');
      rect(ctx, 516, 184, 310, 6, '#8a939e');
      // the carpet, worn down the middle by forty thousand wheeled cases
      sideFloor(ctx, 0, 1500, 430, { h: 120, col: '#3a2f42', col2: '#33293b', tile: 46, shine: false });
      ctx.globalAlpha = 0.2; rect(ctx, 0, 436, 1500, 16, '#6a5a72'); ctx.globalAlpha = 1;
      // the step that everybody trips on, and the plate over the gap
      rect(ctx, 1290, 424, 120, 8, '#8a939e');
      rect(ctx, 1290, 424, 120, 2, '#c8ccd4');
      for (let i = 0; i < 120; i += 8) rect(ctx, 1292 + i, 427, 4, 2, '#5a6472');
      // the aircraft door at the end, open, warm inside
      rect(ctx, 1410, 250, 90, 190, '#e8ecf1');
      rect(ctx, 1418, 262, 74, 170, '#12141c');
      ctx.globalAlpha = 0.5; rect(ctx, 1422, 266, 66, 162, '#f0c88a'); ctx.globalAlpha = 1;
      rect(ctx, 1410, 250, 90, 6, '#c8ccd4');
      dfStamp(ctx, 1436, 226, 22);
    },
    props: [
      { kind: 'depsign', x: 300, y: 250, w: 150, h: 30, floor: 0, over: true, text: 'DF 0808', sub: 'TOKYO NARITA' },
      { kind: 'poster', x: 1050, y: 300, w: 90, h: 120, floor: 0, col: '#2f4a8a', label: 'A SAFETY NOTICE', act: 'notice' },
      { kind: 'door', x: 1455, w: 80, h: 180, floor: 0, col: '#e8ecf1', glow: '#f0c88a', label: 'STEP ON BOARD', act: 'board' },
    ],
    npcs: [
      { name: 'THE PURSER', x: 1380, floor: 0, voice: 'hostess', scale: 1.4, y: 430,
        tag: ['GOOD EVENING. ALL THE WAY DOWN, ON THE LEFT.', 'THIRTY ONE A. YOU ARE OVER THE WING.', 'MIND THE STEP. EVERYBODY MINDS THE STEP.'] },
      { name: 'A PASSENGER', x: 900, floor: 0, voice: 'you', scale: 1.4, carry: 'bag', walk: [860, 1240], speed: 26,
        tag: ['WHY IS IT ALWAYS THIS COLD AND THIS WARM AT ONCE.'] },
      { name: 'ANOTHER PASSENGER', x: 640, floor: 0, voice: 'kid', scale: 1.35, carry: 'suitcase', walk: [600, 1180], speed: 30,
        tag: ['I HAVE NEVER SEEN ONE THIS CLOSE.'] },
    ],
    use: function (S, p) {
      if (p.act === 'notice') { S.say('THE NOTICE', 'IN THE EVENT OF ANYTHING AT ALL, A LIGHT WILL COME ON.', 'tannoy'); return; }
      if (p.act === 'board') {
        S.run([
          { who: 'THE PURSER', text: 'GOOD EVENING. ALL THE WAY DOWN, ON THE LEFT.', voice: 'hostess', at: 'THE PURSER' },
          { who: null, text: 'THE DOOR IS SMALLER THAN YOU EXPECTED. THEY ALWAYS ARE.', voice: false, at: 'you' },
        ], function () {
          if (typeof setChapter === 'function') setChapter('plane');
          S.leave(function () { return new PlaneScene({ seated: true }); }, 'fade', { dur: 1.2 });
        });
        return;
      }
      S.flash(p.label || 'QUIET.');
    },
  };
}
