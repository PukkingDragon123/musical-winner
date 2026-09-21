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

// ---------- laying the building out ----------
function depShopAt(i) {
  if (typeof SHOPS !== 'undefined' && SHOPS.length) return SHOPS[i % SHOPS.length];
  return { name: 'SHOP', tag: 'THINGS', logo: 'bag', col: '#2f4a68', col2: '#f4f1ea' };
}
const DEP_ADS = [
  { text: 'DRAGON FLY', sub: 'THE LONG WAY ROUND', col: DF.navy, col2: DF.gold, mark: 'plane' },
  { text: 'SEE TOKYO', sub: 'NINE HOURS THAT WAY', col: '#8a2a1c', col2: '#f4f1ea', mark: 'star' },
  { text: 'BUG BANK', sub: 'RATES THAT INSULT YOU', col: '#1f4f3a', col2: '#f2c94c', mark: 'watch' },
  { text: 'HIVE MOBILE', sub: 'ROAMING FROM $9', col: '#2f4a8a', col2: '#8ad8ff', mark: 'bolt' },
  { text: 'LARVA RESORT', sub: 'POOL. BUFFET. REGRET.', col: '#c8402c', col2: '#ffd24a', mark: 'leaf' },
  { text: 'DUTY FLY', sub: 'SAME PRICE, NICER BAG', col: '#3a2a50', col2: '#e8c8ff', mark: 'bottle' },
];
function depProps() {
  const P = [];
  const add = function (o) { P.push(o); return o; };
  // ---- kerbside
  add({ kind: 'depsign', x: 180, y: 300, w: 180, h: 34, floor: 1, over: true, text: 'DEPARTURES', arrow: 1, sub: 'TERMINAL 3' });
  add({ kind: 'deptrolleys', x: 300, w: 60, h: 54, floor: 1, n: 5, label: 'TAKE A TROLLEY', act: 'trolley' });
  add({ kind: 'deptrash', x: 470, w: 60, h: 20, floor: 1, n: 4, seed: 4 });
  add({ kind: 'depbot', x: 600, w: 46, h: 26, floor: 1, seed: 1, range: 120 });
  // ---- check-in
  add({ kind: 'depboard', x: 900, y: 252, w: 300, h: 128, floor: 1, over: true, seed: 3, label: 'READ THE BOARD', act: 'board', reach: 150 });
  for (let i = 0; i < 7; i++) add({ kind: 'depdesk', x: 1010 + i * 150, w: 128, h: 44, floor: 1, i: i, solid: false,
    staff: randomBugSpec(makeRng(7000 + i)), label: i === 3 ? 'CHECK IN' : null, act: i === 3 ? 'checkin' : null, reach: 66 });
  add({ kind: 'depqueue', x: 1300, w: 460, h: 34, floor: 1, rows: 2 });
  for (let i = 0; i < 3; i++) add({ kind: 'depkiosk', x: 790 + i * 56, w: 44, h: 96, floor: 1, label: i === 1 ? 'SELF CHECK-IN' : null, act: i === 1 ? 'kiosk' : null });
  add({ kind: 'depad', x: 2050, y: 250, w: 150, h: 92, floor: 1, over: true, col: DEP_ADS[0].col, col2: DEP_ADS[0].col2, text: DEP_ADS[0].text, sub: DEP_ADS[0].sub, mark: DEP_ADS[0].mark });
  // ---- security
  add({ kind: 'depsign', x: 2180, y: 290, w: 200, h: 34, floor: 1, over: true, text: 'SECURITY', arrow: 1, sub: 'HAVE PASS READY' });
  add({ kind: 'depqueue', x: 2200, w: 300, h: 34, floor: 1, rows: 3 });
  add({ kind: 'depsec', x: 2700, w: 480, h: 122, floor: 1, label: 'GO THROUGH SECURITY', act: 'security', reach: 210 });
  // ---- duty free and the concourse, both levels
  for (let i = 0; i < 6; i++) add({ kind: 'depshop', x: 3080 + i * 240, w: 220, h: 196, floor: 1, shop: depShopAt(i + 12), label: null, act: 'shop', reach: 90 });
  for (let i = 0; i < 6; i++) add({ kind: 'depshop', x: 3160 + i * 250, w: 230, h: 160, floor: 0, shop: depShopAt(i + 22), act: 'shop', reach: 90 });
  add({ kind: 'escalator', x: 4560, w: 240, h: 10, floor: 1, toY: DEP_UP, toFloor: 0, dir: 1, label: 'UP TO THE FOOD COURT', act: 'ride' });
  add({ kind: 'escalator', x: 4880, w: 240, h: 10, floor: 1, toY: DEP_UP, toFloor: 0, dir: -1, label: 'DOWN', act: 'ride' });
  add({ kind: 'depcharge', x: 4380, w: 34, h: 108, floor: 1, label: 'CHARGING POINT', act: 'charge' });
  add({ kind: 'depwater', x: 4440, w: 30, h: 96, floor: 1, label: 'WATER', act: 'water' });
  add({ kind: 'depmassage', x: 5120, w: 100, h: 74, floor: 1, label: 'MASSAGE CHAIR', act: 'massage' });
  add({ kind: 'depsmoke', x: 5300, w: 140, h: 130, floor: 1 });
  add({ kind: 'deptrash', x: 4300, w: 70, h: 20, floor: 1, n: 5, seed: 9 });
  add({ kind: 'deptrash', x: 5460, w: 50, h: 20, floor: 1, n: 3, seed: 11 });
  add({ kind: 'depbot', x: 4700, w: 46, h: 26, floor: 1, seed: 5, range: 150 });
  add({ kind: 'depbot', x: 3600, w: 46, h: 26, floor: 0, seed: 7, range: 110 });
  add({ kind: 'vending', x: 4230, w: 46, h: 100, floor: 1, label: 'VENDING MACHINE', act: 'vend' });
  add({ kind: 'vending', x: 4278, w: 46, h: 100, floor: 1, label: 'HOT DRINKS', act: 'vend' });
  for (let i = 0; i < 4; i++) add({ kind: 'depad', x: 3400 + i * 620, y: 330, w: 130, h: 84, floor: 1, over: true,
    col: DEP_ADS[(i + 1) % DEP_ADS.length].col, col2: DEP_ADS[(i + 1) % DEP_ADS.length].col2,
    text: DEP_ADS[(i + 1) % DEP_ADS.length].text, sub: DEP_ADS[(i + 1) % DEP_ADS.length].sub, mark: DEP_ADS[(i + 1) % DEP_ADS.length].mark });
  add({ kind: 'depsign', x: 4000, y: 300, w: 230, h: 34, floor: 1, over: true, text: 'GATES C1-C20', arrow: 1, sub: '12 MINUTE WALK' });
  add({ kind: 'travelator', x: 5700, w: 420, h: 12, floor: 1 });
  // ---- the gates
  add({ kind: 'depapron', x: 6760, y: 386, w: 900, h: 216, floor: 1, planeX: 260, planeW: 480 });
  add({ kind: 'depgate', x: 6060, w: 120, h: 48, floor: 1, num: 'C12', label: 'THE GATE DESK', act: 'gate', reach: 76 });
  for (let i = 0; i < 4; i++) add({ kind: 'depseats', x: 6420 + i * 215, w: 200, h: 44, floor: 1, n: 6 });
  add({ kind: 'depbridge', x: 7240, w: 90, h: 140, floor: 1, label: 'BOARD THE FLIGHT', act: 'board2', reach: 60 });
  add({ kind: 'deptrash', x: 7130, w: 40, h: 20, floor: 1, n: 2, seed: 21 });
  add({ kind: 'depsign', x: 6100, y: 300, w: 160, h: 34, floor: 1, over: true, text: 'C12', sub: 'TOKYO NARITA' });
  return P;
}
function depNpcs() {
  return [
    { name: 'A CHECK-IN AGENT', x: 1466, floor: 1, voice: 'clerk', scale: 1.3, y: DEP_LO,
      tag: ['WINDOW OR AISLE? IT IS A WINDOW. IT IS ALWAYS A WINDOW.', 'ONE BAG. TWENTY THREE KILOS. YOU ARE AT NINETEEN.', 'GATE C12. IT IS A WALK. START NOW.'] },
    { name: 'SECURITY', x: 2620, floor: 1, voice: 'guard', scale: 1.35, y: DEP_LO,
      tag: ['LAPTOP OUT. BELT OFF. SHOES ON, THIS IS NOT THE NINETIES.', 'IS THERE ANYTHING SHARP IN THE CASE.', 'A PLECTRUM IS NOT SHARP. GO ON.'] },
    { name: 'A CLEANER', x: 4880, floor: 1, voice: 'oldman', scale: 1.25, y: DEP_LO,
      tag: ['I HAVE DONE THIS FLOOR FOUR TIMES TONIGHT.', 'IT IS THE SAME FLOOR.'] },
    { name: 'A GATE AGENT', x: 6215, floor: 1, voice: 'hostess', scale: 1.3, y: DEP_LO,
      tag: function (S) { return S.DEP.boarding ? 'GROUP FOUR. THAT IS YOU. THAT IS EVERYBODY.' : 'WE BOARD IN TWENTY. SIT DOWN. HAVE A MINUTE.'; } },
    { name: 'A TOUR GUIDE', x: 3900, floor: 1, voice: 'kid', scale: 1.3, carry: 'umbrella', walk: [3760, 4120], speed: 22,
      tag: ['GROUP SEVEN! GROUP SEVEN, THIS WAY!', 'IF YOU CAN SEE THE FLAG YOU ARE FINE.'] },
    { name: 'A MAN AT THE BAR', x: 5060, floor: 1, voice: 'driver', scale: 1.3, y: DEP_LO,
      tag: ['IT IS FIVE IN THE AFTERNOON IN THE PLACE I AM GOING.', 'THAT IS HOW IT WORKS.'] },
    { name: 'A BUG WITH A BASS', x: 4460, floor: 1, voice: 'you', scale: 1.4, carry: 'case', y: DEP_LO,
      tag: ['THEY MADE ME CHECK IT.', 'THEY ALWAYS MAKE YOU CHECK IT.', 'GOOD LUCK OUT THERE.'] },
    { name: 'AN OLD COUPLE', x: 6700, floor: 1, voice: 'oldman', scale: 1.3, y: DEP_LO,
      tag: ['FORTY ONE YEARS. FIRST TIME EITHER OF US HAS FLOWN.', 'SHE IS NOT NERVOUS. I AM NERVOUS.'] },
    { name: 'A CREW', x: 3320, floor: 1, voice: 'hostess', scale: 1.3, carry: 'suitcase', walk: [3200, 3900], speed: 40,
      tag: ['FOUR SECTORS TODAY. THIS IS THE LAST ONE.', 'SEE YOU ON BOARD.'] },
  ];
}

// ---------- the scene ----------
class DepartureScene extends SideScene {
  constructor(opts) {
    super(depDef(), opts || {});
    this.DEP = this.D.DEP;
    // walking out of a shop should put you back outside that shop
    const o = opts || {};
    if (o.at != null) { this.body.x = o.at; this.body.floor = o.floor != null ? o.floor : 1; this.body.fk = this.body.floor; this.cam.snapTo(this.body.x, this.floorY(this.body.fk)); }
    if (Game.run && Game.run.flags && Game.run.flags.checkedIn) { this.D.DEP.pass = true; }
    this.crowdLo = makeLifeCrowd(78, 1717, { x0: 60, x1: DEP_W - 120, floor: 1, y: DEP_LO, min: 1.0, max: 1.5 });
    this.crowdUp = makeLifeCrowd(34, 9119, { x0: 3000, x1: 5400, floor: 0, y: DEP_UP, min: 0.86, max: 1.15,
      acts: ['walk', 'phone', 'eat', 'eat', 'talk', 'sit', 'wait', 'shop'] });
    if (typeof setChapter === 'function') setChapter('departure');
  }
  update(dt) {
    super.update(dt);
    const D = this.DEP;
    D.t += dt;
    const fame = 1;
    updateLifeCrowd(this.crowdLo, dt, this.t, this, { x0: 60, x1: DEP_W - 120, fame: fame });
    updateLifeCrowd(this.crowdUp, dt, this.t, this, { x0: 3000, x1: 5400, fame: 0.3 });
    // the tannoy, every so often, in a voice nobody has ever understood
    D.paT -= dt;
    if (D.paT <= 0) {
      D.paT = 26 + (Math.floor(this.t) % 11);
      D.pa = DEP_PA[D.paI % DEP_PA.length]; D.paI++;
      D.paShow = 6;
      Voice.chime('plane'); Voice.say(D.pa, 'tannoy', { speed: 0.9 });
    }
    D.paShow = Math.max(0, D.paShow - dt);
    // boarding opens once you have a pass and have cleared security
    if (D.pass && D.cleared && !D.boarding && this.body.x > 5600) { D.boarding = true; Voice.chime('plane'); this.flash('BOARDING: DF0808 TO TOKYO NARITA. GATE C12.', 5); }
    // the objective keeps up with you
    D.obj = !D.pass ? 'CHECK IN. DESK D13.' : !D.cleared ? 'GET THROUGH SECURITY.' : !D.boarding ? 'FIND GATE C12. IT IS A WALK.' : 'BOARD THE FLIGHT.';
  }
  draw(ctx) {
    super.draw(ctx);
    const D = this.DEP;
    // the objective, top left, out of the title card's way
    const w = textWidth(D.obj, { scale: 2 }) + 22;
    rect(ctx, 10, 30, w, 24, 'rgba(8,14,10,0.86)');
    frame(ctx, 10, 30, w, 24, DEP_PAL.green);
    drawText(ctx, D.obj, 20, 37, '#6be585', { scale: 2 });
    // where you are in the building
    const z = depZoneAt(this.body.x);
    drawText(ctx, z.name, W - 14, 34, '#cfd6de', { align: 'right', scale: 2, outline: '#12101c' });
    const bw = 220, bx = W - bw - 14;
    rect(ctx, bx, 50, bw, 6, '#1b2230');
    rect(ctx, bx, 50, Math.round(bw * clamp(this.body.x / DEP_W, 0, 1)), 6, DEP_PAL.amber);
    for (let i = 0; i < DEP_ZONES.length; i++) rect(ctx, bx + Math.round(bw * DEP_ZONES[i].x0 / DEP_W), 48, 1, 10, '#5a6472');
    // the announcement, as a strip along the top of the frame
    if (D.paShow > 0) {
      const a = clamp(D.paShow, 0, 1);
      ctx.globalAlpha = a;
      const pw = Math.min(W - 40, textWidth(D.pa, { scale: 2 }) + 44);
      rect(ctx, W / 2 - pw / 2, H - 64, pw, 26, 'rgba(10,8,18,0.9)');
      frame(ctx, W / 2 - pw / 2, H - 64, pw, 26, DEP_PAL.amber);
      rect(ctx, W / 2 - pw / 2 + 5, H - 58, 4, 14, DEP_PAL.amber);
      rect(ctx, W / 2 - pw / 2 + 11, H - 55, 3, 8, withAlpha(DEP_PAL.amber, 0.6));
      drawText(ctx, D.pa, W / 2 + 8, H - 57, '#ffd88a', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
  }
}
const DEP_PA = [
  'PASSENGER MOTH, PLEASE COME TO THE INFORMATION DESK.',
  'THIS IS A FINAL CALL FOR FLIGHT DF FOUR ONE TWO.',
  'PLEASE DO NOT LEAVE BAGGAGE UNATTENDED.',
  'THE MOVING WALKWAY IS NOW ENDING.',
  'WOULD THE OWNER OF A SMALL BROWN CASE.',
  'DF ZERO EIGHT ZERO EIGHT TO TOKYO NARITA IS NOW BOARDING AT GATE C TWELVE.',
  'THE SMOKING ROOM IS ON LEVEL TWO.',
];

function depDef() {
  const DEP = { t: 0, pass: false, cleared: false, boarding: false, obj: 'CHECK IN. DESK D13.', paT: 8, paI: 0, pa: '', paShow: 0, trolley: false };
  return {
    name: 'HARRY REED INTERNATIONAL', sub: 'TERMINAL 3 - DEPARTURES', tint: '#1f4f7a',
    w: DEP_W, zoom: 1, yBias: 0.80, freeFloors: false, heroScale: 1.65, speed: 132,
    start: { x: 150, floor: 1 },
    floors: [{ y: DEP_UP, z: 0.84 }, { y: DEP_LO, z: 1 }],
    enterLine: 'NINE HOURS EARLY. IT IS THAT OR THE STREET.',
    DEP: DEP,
    sky: function (ctx) { vgrad(ctx, 0, 0, W, H, '#10131b', '#1c2029'); },
    mid: function (ctx, S, t) {
      // ---- the shell
      depTrussRoof(ctx, 0, DEP_W, 96, t);
      rect(ctx, 0, 96, DEP_W, DEP_UP - 96, DEP_PAL.wall);
      rect(ctx, 0, 96, DEP_W, 3, DEP_PAL.wallHi);
      // the upper floor slab and its balustrade
      rect(ctx, 2950, DEP_UP, 2550, 16, DEP_PAL.wallLo);
      rect(ctx, 2950, DEP_UP - 2, 2550, 3, DEP_PAL.wallHi);
      sideFloor(ctx, 2950, 5500, DEP_UP, { h: 16, col: DEP_PAL.floor, col2: DEP_PAL.floorLo, tile: 60 });
      for (let x = 2950; x < 5500; x += 30) { rect(ctx, x, DEP_UP - 34, 2, 34, '#8a939e'); }
      rect(ctx, 2950, DEP_UP - 36, 2550, 3, '#b9bec6');
      ctx.globalAlpha = 0.18; rect(ctx, 2950, DEP_UP - 34, 2550, 32, '#8fc0e4'); ctx.globalAlpha = 1;
      // ---- the back wall: glass where it can be, panels where it cannot
      glassWall(ctx, 0, 120, 700, 300, t, { mullion: 84, rail: 120 });
      rect(ctx, 700, 120, 2250, 300, DEP_PAL.wall);
      for (let x = 700; x < 2950; x += 90) rect(ctx, x, 120, 2, 300, DEP_PAL.wallLo);
      rect(ctx, 5500, 120, 1000, 300, DEP_PAL.wall);
      // ---- the underside of the upper floor, which is a ceiling to everyone
      // standing below it: panels, a service run, and a line of downlights
      rect(ctx, 2950, DEP_UP + 16, 2550, 26, '#232833');
      rect(ctx, 2950, DEP_UP + 16, 2550, 3, '#3a4250');
      for (let x = 2960; x < 5500; x += 46) rect(ctx, x, DEP_UP + 20, 2, 18, '#1b1f28');
      for (let x = 3010; x < 5500; x += 138) {
        rect(ctx, x - 13, DEP_UP + 40, 26, 5, '#e8ecf1');
        ctx.globalAlpha = 0.12; ellipsePx(ctx, x, DEP_UP + 130, 56, 110, '#ffe9a8'); ctx.globalAlpha = 1;
      }
      // ---- the floor, all the way along, polished to a fault
      sideFloor(ctx, 0, DEP_W, DEP_LO, { h: 300, col: DEP_PAL.floor, col2: DEP_PAL.floorLo, tile: 64, lip: '#c8ccd4' });
      sideSheen(ctx, 0, DEP_W, DEP_LO, 0.05);
      // the grid, the expansion joints, and the yellow line nobody stands behind
      for (let x = 0; x < DEP_W; x += 64) { ctx.globalAlpha = 0.14; rect(ctx, x, DEP_LO, 1, 150, '#ffffff'); ctx.globalAlpha = 1; }
      for (let y2 = DEP_LO + 24; y2 < DEP_LO + 150; y2 += 30) { ctx.globalAlpha = 0.1; rect(ctx, 0, y2, DEP_W, 1, '#ffffff'); ctx.globalAlpha = 1; }
      for (let x = 0; x < DEP_W; x += 512) { ctx.globalAlpha = 0.22; rect(ctx, x, DEP_LO, 3, 150, '#6a7280'); ctx.globalAlpha = 1; }
      ctx.globalAlpha = 0.6; rect(ctx, 0, DEP_LO + 92, DEP_W, 4, '#c8a83a'); ctx.globalAlpha = 1;
      // scuffs, a dropped boarding pass, a coffee ring: forty thousand people a day
      const rf = makeRng(88);
      for (let i = 0; i < 260; i++) {
        const sx = rf.range(0, DEP_W), sy = DEP_LO + rf.range(6, 140);
        ctx.globalAlpha = rf.range(0.05, 0.14);
        rect(ctx, sx, sy, rf.int(4, 22), 1, rf.chance(0.5) ? '#ffffff' : '#3a4048');
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 26; i++) {
        const sx = rf.range(100, DEP_W - 100), sy = DEP_LO + rf.range(20, 120);
        if (rf.chance(0.5)) { ctx.globalAlpha = 0.5; rect(ctx, sx, sy, 9, 6, '#f4f1ea'); rect(ctx, sx, sy, 9, 2, DF.navy); ctx.globalAlpha = 1; }
        else { ctx.globalAlpha = 0.18; ellipseRingPx(ctx, sx, sy, 6, 3, '#6a5a44'); ctx.globalAlpha = 1; }
      }
      // a strip of carpet through the gate area, because airports do that
      rect(ctx, 6100, DEP_LO, 1300, 26, '#2a3550');
      for (let x = 6100; x < 7400; x += 12) { ctx.globalAlpha = 0.16; rect(ctx, x, DEP_LO + 2, 6, 22, '#4a5a80'); ctx.globalAlpha = 1; }
      // ---- the shops, drawn from the catalogue
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'depshop') continue;
        sideShopFront(ctx, p.x - p.w / 2, S.propY(p), p.w, p.h, p.shop, t, S);
      }
      // ---- everybody
      drawLifeCrowd(ctx, S, S.crowdUp, t);
      drawLifeCrowd(ctx, S, S.crowdLo, t);
    },
    after: function (ctx, S, t) {
      // The floor is polished, so it owes everybody standing on it a copy of
      // themselves. Mirror the band just above the floor line back down into it.
      const fy = S.cam.sy(DEP_LO);
      if (fy > 40 && fy < H - 20) deckReflection(ctx, Math.max(0, fy - 130), Math.min(130, fy), fy, Math.min(120, H - fy), 0.13, '#39404e');
    },
    fore: function (ctx, S, t) {
      // a pillar or two in front, so the building has depth instead of a wall
      for (let x = 880; x < DEP_W; x += 1420) {
        rect(ctx, x, 60, 40, DEP_LO + 40 - 60, '#b9bec6');
        rect(ctx, x, 60, 8, DEP_LO - 20, '#dfe4ea');
        rect(ctx, x + 32, 60, 8, DEP_LO - 20, '#8a8f98');
        rect(ctx, x - 6, DEP_LO + 18, 52, 12, '#9aa0aa');
      }
    },
    prop: function (ctx, p, t, S) {
      if (p.kind === 'depshop') return true;                 // drawn in mid, under the crowd
      return depProp(ctx, p, t, S);
    },
    props: depProps(),
    npcs: depNpcs(),
    tick: function (S, dt) {},
    use: function (S, p) {
      const D = S.DEP, r = Game.run;
      switch (p.act) {
        case 'trolley': S.flash(D.trolley ? 'YOU ALREADY HAVE ONE.' : 'A DOLLAR. FOR A TROLLEY.'); D.trolley = true; return;
        case 'board': S.say('THE BOARD', 'DF0808. TOKYO NARITA. GATE C12. ON TIME, WHICH IS ITS OWN KIND OF THREAT.', 'tannoy'); return;
        case 'kiosk': S.flash(D.pass ? 'YOU HAVE A PASS.' : 'IT WANTS A BOOKING REFERENCE YOU DO NOT HAVE.'); return;
        case 'checkin':
          if (D.pass) { S.flash('CHECKED IN. GATE C12.'); return; }
          S.run([
            { who: 'THE AGENT', text: 'GOOD EVENING. PASSPORT AND THE CASE ON THE BELT.', voice: 'clerk', at: { x: p.x, y: DEP_LO - 70 } },
            { who: 'THE AGENT', text: 'ONE BAG TO TOKYO. WINDOW OR AISLE?', voice: 'clerk', at: { x: p.x, y: DEP_LO - 70 },
              choices: [
                { label: 'WINDOW', note: '31A', go: function () { D.seat = '31A'; } },
                { label: 'AISLE', note: '31C', go: function () { D.seat = '31C'; } },
                { label: 'WHATEVER IS CHEAPEST', note: 'THE BACK', go: function () { D.seat = '48F'; } },
              ] },
            { who: 'THE AGENT', text: 'THIRTY ONE A. THAT IS OVER THE WING. YOU WILL SEE NOTHING.', voice: 'clerk', at: { x: p.x, y: DEP_LO - 70 } },
            { who: 'THE AGENT', text: 'GATE C12. BOARDING AT TEN PAST. IT IS A WALK.', voice: 'clerk', at: { x: p.x, y: DEP_LO - 70 } },
          ], function () {
            D.pass = true; Audio.ui('stamp');
            if (r) { r.flags = r.flags || {}; r.flags.checkedIn = true; r.save(); }
            S.body.carry = null;
            S.flash('BAG GONE. YOU WILL SEE IT IN A DIFFERENT COUNTRY.', 4);
          });
          return;
        case 'security':
          if (!D.pass) { S.flash('THEY WANT A BOARDING PASS. CHECK IN FIRST.'); return; }
          if (D.cleared) { S.flash('YOU ARE THROUGH. KEEP GOING.'); return; }
          S.run([
            { who: 'SECURITY', text: 'LAPTOP OUT. BELT OFF. IS THERE ANYTHING SHARP.', voice: 'guard', at: { x: 2620, y: DEP_LO - 70 } },
            { who: 'YOU', text: 'A PLECTRUM.', voice: 'you', at: 'you',
              choices: [
                { label: 'HAND OVER THE PLECTRUM', note: 'COMPLY' },
                { label: 'IT IS NOT SHARP', note: 'ARGUE' },
                { label: 'SAY NOTHING', note: 'THE CLASSIC' },
              ] },
            { who: 'SECURITY', text: 'A PLECTRUM IS NOT SHARP. GO ON.', voice: 'guard', at: { x: 2620, y: DEP_LO - 70 } },
          ], function () {
            D.cleared = true; Audio.ui('coin');
            S.flash('THROUGH. YOUR BELT IS IN A TRAY SOMEWHERE BEHIND YOU.', 4);
          });
          return;
        case 'ride': S.ride(p); return;
        case 'shop': {
          const sh = p.shop;
          if (typeof ShopInteriorScene === 'function' && sh && sh.enter !== false) {
            const at = S.body.x, fl = S.body.floor;
            Game.go(function () { return new ShopInteriorScene(sh, function () { return new DepartureScene({ at: at, floor: fl }); }); }, 'iris', { dur: 0.5 });
          } else S.say(sh ? sh.name : 'THE SHOP', sh && sh.blurb ? sh.blurb : 'SHUT. OR NEARLY SHUT. HARD TO TELL.', 'clerk');
          return;
        }
        case 'charge': S.flash('EVERY SOCKET IS TAKEN. ONE OF THEM BY A LAMP.'); return;
        case 'water': S.flash('COLD, FREE, AND FOUR THOUSAND BOTTLES SAVED.'); if (r) r.stamina = Math.min(r.staminaMax, r.stamina + 6); return;
        case 'vend':
          if (!r) return;
          if (r.money >= 3) { r.money -= 3; r.stamina = Math.min(r.staminaMax, r.stamina + 10); Audio.ui('eat'); S.flash('AIRPORT PRICES. -$3, +10 STAMINA.'); }
          else S.flash('THREE DOLLARS FOR THAT. AND YOU DO NOT HAVE IT.');
          return;
        case 'massage': S.flash('IT TAKES COINS. IT CHANGES NOTHING. YOU FEEL WORSE.'); return;
        case 'gate':
          if (!D.pass) { S.flash('CHECK IN FIRST.'); return; }
          D.boarding = true;
          S.say('THE GATE AGENT', 'GROUP FOUR. THAT IS YOU. THAT IS, IN FACT, EVERYBODY.', 'hostess');
          return;
        case 'board2':
          if (!D.pass) { S.flash('NO PASS, NO AEROPLANE.'); return; }
          if (!D.cleared) { S.flash('YOU HAVE NOT BEEN THROUGH SECURITY.'); return; }
          S.run([
            { who: 'THE GATE AGENT', text: 'PASS AND PASSPORT. THANK YOU.', voice: 'hostess', at: { x: 7240, y: DEP_LO - 80 } },
            { who: null, text: 'THE SCANNER GOES GREEN. IT IS THE FIRST THING ALL WEEK THAT HAS.', voice: false, at: 'you' },
          ], function () {
            Audio.ui('coin');
            if (typeof setChapter === 'function') setChapter('plane');
            S.leave(function () { return typeof JetBridgeScene === 'function' ? new JetBridgeScene() : new PlaneScene(); }, 'fade', { dur: 1 });
          });
          return;
      }
      S.flash(p.label || 'NOTHING HERE.');
    },
  };
}

// ---------- the last forty metres ----------
// A jet bridge is a corridor that smells of kerosene and carpet. It slopes,
// it has one window, and everybody on it is quiet.
class JetBridgeScene extends SideScene {
  constructor(opts) { super(jbDef(), opts || {}); }
}
function jbDef() {
  return {
    name: 'GATE C12', sub: 'MIND THE STEP', tint: '#1f3f7a',
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
