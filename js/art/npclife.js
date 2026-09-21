// ---------- People with something to do ----------
// A crowd used to be sprites sliding left and right. This gives every one of
// them a thing they are doing and a reason to be standing where they are
// standing: on the phone, dragging a case, eating something at the wrong time
// of day, mopping the same square metre, or leaning in to tell their friend
// that the bug with the guitar was on television once.
//
// They also notice you. Walk past enough of them and somebody points.
'use strict';

const LIFE_ACTS = [
  'walk', 'phone', 'case', 'eat', 'talk', 'photo', 'sit', 'sleep', 'late',
  'board', 'shop', 'clean', 'stretch', 'wait', 'kid', 'push',
];
// how long each one holds your attention before they go and do something else
const LIFE_DUR = {
  walk: [4, 11], phone: [3.5, 9], case: [5, 12], eat: [4, 9], talk: [5, 13],
  photo: [2.5, 5], sit: [8, 22], sleep: [14, 40], late: [3, 6], board: [10, 30],
  shop: [4, 10], clean: [6, 14], stretch: [2, 4], wait: [5, 16], kid: [3, 7], push: [6, 14],
};

// ---------- building a crowd ----------
// opts: { x0, x1, floors, min, max, acts, y, seed, density }
function makeLifeCrowd(n, seed, opts) {
  const o = opts || {};
  const r = makeRng((seed >>> 0) || 1);
  const acts = o.acts || ['walk', 'walk', 'walk', 'phone', 'case', 'case', 'eat', 'talk', 'photo', 'wait', 'late', 'stretch'];
  const out = [];
  for (let i = 0; i < n; i++) {
    const act = r.pick(acts);
    const p = {
      spec: randomBugSpec(makeRng(((seed >>> 0) + i * 2654435761) >>> 0)),
      x: r.range(o.x0 != null ? o.x0 : 0, o.x1 != null ? o.x1 : 2000),
      y: o.y != null ? o.y : null,
      floor: o.floors ? r.int(0, o.floors - 1) : (o.floor || 0),
      sc: r.range(o.min || 1.0, o.max || 1.45),
      dir: r.chance(0.5) ? 1 : -1,
      speed: r.range(16, 40),
      o: r.range(0, 6.3),
      act: act, actT: 0, hold: r.range(LIFE_DUR[act][0], LIFE_DUR[act][1]),
      carry: null, bag: r.chance(0.42), hat: r.chance(0.18),
      col: r.pick(['#e8503a', '#4a86f7', '#f2c94c', '#6be585', '#c58bff', '#ff8ad8', '#f4f1ea', '#8a8f98']),
      caseCol: r.pick(['#2f4a8a', '#8a2a1c', '#2f6a4a', '#3a3550', '#8a6a2a', '#b9bec6', '#c8402c']),
      seen: 0, look: 0, buzz: 0, said: null, saidT: 0,
      partner: null, seat: null, blink: r.range(0, 4),
      rng: r.range(0, 1000),
    };
    out.push(p);
  }
  // pair the talkers up so they face each other instead of the wall
  for (let i = 0; i < out.length; i++) {
    const a = out[i];
    if (a.act !== 'talk' || a.partner) continue;
    const b = out.find(function (q) { return q !== a && !q.partner && Math.abs(q.x - a.x) < 200 && q.floor === a.floor; });
    if (b) { b.act = 'talk'; b.partner = a; a.partner = b; b.x = a.x + (a.dir > 0 ? 34 : -34); a.dir = 1; b.dir = -1; }
    else a.act = 'phone';
  }
  return out;
}

// the little things they say, by what they are doing
const LIFE_MUTTER = {
  phone: ['MM. MM. NO, I LANDED.', 'IT SAYS GATE 41.', 'I WILL CALL YOU BACK.', 'THE WIFI IS TERRIBLE.', 'SIX PERCENT.'],
  eat: ['THIS COST ELEVEN DOLLARS.', 'IT IS FOUR IN THE MORNING SOMEWHERE.', 'MM.'],
  talk: ['...AND THEN SHE SAID NO.', 'DID YOU PACK THE CHARGER?', 'WE HAVE FORTY MINUTES.', 'I TOLD YOU IT WAS TERMINAL TWO.'],
  late: ['SORRY. SORRY. SORRY.', 'HOLD THE DOOR.', 'EXCUSE ME.'],
  wait: ['THEY HAVE NOT CALLED IT YET.', 'DELAYED. OF COURSE.'],
  clean: ['MIND THE FLOOR.', 'WET. MIND THE FLOOR.'],
  shop: ['DO YOU HAVE THIS IN A SMALL?', 'HOW MUCH IS THAT IN YEN?'],
  kid: ['ARE WE ON THE PLANE YET?', 'I NEED THE TOILET.', 'THAT ONE IS BIG.'],
};
// and what they say about you, once they work out where they know you from
const LIFE_BUZZ = [
  'IS THAT NOT THE ONE FROM THE BAND?', 'HE WAS ON TELEVISION.', 'THE ONE WHO RUINED IT.',
  'DO NOT STARE.', 'I AM NOT STARING.', 'THAT IS THE GUITAR ONE.', 'PUT YOUR PHONE DOWN.',
  'IT IS DEFINITELY HIM.', 'HE LOOKS SMALLER.', 'POOR THING.',
];

// ---------- their lives, one frame at a time ----------
function updateLifeCrowd(crowd, dt, t, S, opts) {
  const o = opts || {};
  const x0 = o.x0 != null ? o.x0 : 0, x1 = o.x1 != null ? o.x1 : (S && S.D ? S.D.w : 2400);
  const px = S && S.body ? S.body.x : -9999;
  const pf = S && S.body ? Math.round(S.body.floor) : -1;
  const fame = o.fame != null ? o.fame : 1;
  for (let i = 0; i < crowd.length; i++) {
    const p = crowd[i];
    p.actT += dt; p.saidT = Math.max(0, p.saidT - dt);
    if (p.saidT <= 0) p.said = null;
    // do they know who you are
    const near = Math.abs(p.x - px) < 150 && p.floor === pf;
    if (near) {
      p.look = Math.min(1, p.look + dt * 2.4);
      p.seen += dt;
      if (p.seen > 0.7 && !p.buzz && fame > 0 && ((i * 37 + Math.floor(p.rng)) % 100) < 26 * fame) {
        p.buzz = 1;
        p.said = LIFE_BUZZ[(i * 7 + Math.floor(p.rng)) % LIFE_BUZZ.length];
        p.saidT = 3.4;
        if (p.act === 'walk' || p.act === 'wait') { p.act = ((i % 3) === 0) ? 'photo' : 'talk'; p.actT = 0; p.hold = 4; }
      }
    } else {
      p.look = Math.max(0, p.look - dt * 1.6);
      p.seen = Math.max(0, p.seen - dt * 0.5);
    }
    // whoever they are looking at decides which way they face
    if (p.look > 0.4) p.dir = px > p.x ? 1 : -1;

    switch (p.act) {
      case 'walk': case 'late': case 'case': case 'push': {
        const sp = p.speed * (p.act === 'late' ? 3.1 : p.act === 'push' ? 0.55 : 1) * (p.look > 0.5 ? 0.35 : 1);
        p.x += p.dir * sp * dt;
        if (p.x > x1 - 20) { p.x = x1 - 20; p.dir = -1; }
        if (p.x < x0 + 20) { p.x = x0 + 20; p.dir = 1; }
        p.moving = true;
        break;
      }
      case 'clean': {
        p.x += p.dir * 12 * dt;
        if (p.x > (p.homeX || p.x) + 90) p.dir = -1;
        if (p.x < (p.homeX || p.x) - 90) p.dir = 1;
        if (p.homeX == null) p.homeX = p.x;
        p.moving = true;
        break;
      }
      case 'shop': { p.moving = false; break; }
      default: p.moving = false;
    }
    // say something, occasionally, about whatever they are doing
    if (!p.said && p.saidT <= 0 && LIFE_MUTTER[p.act] && ((t * 7 + i * 13) % 61 | 0) === 0 && Math.abs(p.x - px) < 420) {
      const L = LIFE_MUTTER[p.act];
      p.said = L[(i + Math.floor(t / 3)) % L.length]; p.saidT = 2.6;
    }
    // and then they get bored and do something else
    if (p.actT > p.hold && p.act !== 'board' && p.act !== 'sleep') {
      const pool = o.acts || ['walk', 'walk', 'phone', 'case', 'eat', 'photo', 'wait', 'stretch', 'talk'];
      const nx = pool[(i * 17 + Math.floor(t * 3)) % pool.length];
      if (nx !== 'talk' || p.partner) { p.act = nx; p.actT = 0; p.hold = LIFE_DUR[nx] ? (LIFE_DUR[nx][0] + (i % 5)) : 6; }
      else { p.act = 'phone'; p.actT = 0; p.hold = 6; }
    }
  }
}

// ---------- drawing one of them ----------
// The sprite is the game's own bug. Everything else - the case, the cup, the
// phone, the mop, the sleeping head - is drawn around it so the same twenty
// sprites read as two hundred different people.
function drawLifePerson(ctx, p, x, y, t, S) {
  const s = p.sc;
  const bob = p.moving ? 1 : 0;
  const pose = p.act === 'sleep' ? 'idle'
    : p.act === 'sit' ? 'idle'
      : p.moving ? (Math.floor(t * (p.act === 'late' ? 11 : 6) + p.o) % 2 ? 'walk1' : 'walk2')
        : (p.said || p.act === 'talk') ? (Math.floor(t * 4 + p.o) % 2 ? 'talk' : 'idle') : 'idle';
  drawShadow(ctx, x, y + 2, 20 * s, 0.26);
  // anybody asleep or sitting is lower and tipped over
  const dy = p.act === 'sleep' ? 8 * s : p.act === 'sit' ? 6 * s : 0;
  const tilt = p.act === 'sleep' ? (p.dir > 0 ? 0.22 : -0.22) : 0;
  drawBugAt(ctx, p.spec, x, y + 2 - dy * 0, {
    pose: pose, scale: s, flip: p.dir < 0, bounce: bob ? 0.95 : (p.act === 'sleep' ? 0.15 : 0.5),
    phase: p.o, tilt: tilt,
  });
  const hx = x + p.dir * 12 * s, hy = y - 26 * s;      // roughly where a hand is
  switch (p.act) {
    case 'phone': lifePhone(ctx, x, y, p, t, s); break;
    case 'case': lifeCase(ctx, x, y, p, t, s); break;
    case 'push': lifeCart(ctx, x, y, p, t, s); break;
    case 'eat': lifeFood(ctx, x, y, p, t, s); break;
    case 'photo': lifeCamera(ctx, x, y, p, t, s, S); break;
    case 'clean': lifeMop(ctx, x, y, p, t, s); break;
    case 'late': lifeRunning(ctx, x, y, p, t, s); break;
    case 'sleep': lifeSleep(ctx, x, y, p, t, s); break;
    case 'talk': if (p.look > 0.5) lifeWhisper(ctx, x, y, p, t, s); break;
    case 'stretch': lifeStretch(ctx, x, y, p, t, s); break;
    case 'kid': lifeBalloon(ctx, x, y, p, t, s); break;
  }
  if (p.bag && (p.act === 'walk' || p.act === 'phone' || p.act === 'wait')) lifeShoulderBag(ctx, x, y, p, s);
  // the little line over their head
  if (p.said && p.saidT > 0) lifeMutter(ctx, x, y - 48 * s, p, t);
  // and the sideways look, which is the whole point of a crowd
  if (p.look > 0.3 && !p.said) {
    ctx.globalAlpha = p.look * 0.85;
    rect(ctx, x + p.dir * 15 * s, y - 50 * s, 3, 3, '#ffd24a');
    rect(ctx, x + p.dir * 19 * s, y - 53 * s, 2, 2, '#ffd24a');
    ctx.globalAlpha = 1;
  }
}

// ---- the things they are holding
function lifePhone(ctx, x, y, p, t, s) {
  const d = p.dir, hx = Math.round(x + d * 9 * s), hy = Math.round(y - 27 * s);
  rect(ctx, hx - 3, hy, 6, 10, '#1b1b24');
  rect(ctx, hx - 2, hy + 1, 4, 8, ((t * 3 + p.o) % 4) < 3.7 ? '#8ad8ff' : '#2a3a5a');
  // the light it throws back up onto the face, which is the giveaway
  ctx.globalAlpha = 0.16; ellipsePx(ctx, hx, hy - 6, 9, 7, '#8ad8ff'); ctx.globalAlpha = 1;
  // a thumb going
  if (Math.floor(t * 4 + p.o) % 2) rect(ctx, hx - 1, hy + 2, 2, 2, '#f4f1ea');
}
function lifeCase(ctx, x, y, p, t, s) {
  const d = -p.dir;                                   // the case trails behind
  const cx = Math.round(x + d * 16 * s), w = Math.round(13 * s), h = Math.round(17 * s);
  const wob = Math.round(Math.sin(t * 9 + p.o) * 1);
  rect(ctx, cx - w / 2, y - h - 1 + wob, w, h, p.caseCol);
  rect(ctx, cx - w / 2, y - h - 1 + wob, w, 2, lighten(p.caseCol, 0.28));
  rect(ctx, cx - w / 2, y - Math.round(h * 0.52) + wob, w, 1, darken(p.caseCol, 0.35));
  // wheels, a telescoping handle, and a luggage tag that flicks about
  circle(ctx, cx - w / 2 + 2, y - 1, Math.max(1, s), '#1b1b24');
  circle(ctx, cx + w / 2 - 2, y - 1, Math.max(1, s), '#1b1b24');
  const hh = Math.round(14 * s);
  rect(ctx, cx - 1, y - h - hh + wob, 2, hh, '#9aa0a8');
  rect(ctx, cx - Math.round(4 * s), y - h - hh - 2 + wob, Math.round(8 * s), 2, '#6a7079');
  rect(ctx, cx + w / 2 - 3, y - h + 2 + wob + Math.round(Math.sin(t * 6 + p.o) * 1), 3, 4, '#f2c94c');
}
function lifeCart(ctx, x, y, p, t, s) {
  const d = p.dir, cx = Math.round(x + d * 24 * s);
  rect(ctx, cx - 14 * s, y - 20 * s, 28 * s, 4, '#b9bec6');
  rect(ctx, cx - 12 * s, y - 16 * s, 24 * s, 3, '#8a8f98');
  rect(ctx, cx + d * 13 * s, y - 34 * s, 3, 20 * s, '#8a8f98');
  rect(ctx, cx + d * 8 * s, y - 36 * s, 10 * s, 3, '#6a7079');
  circle(ctx, cx - 10 * s, y - 2, 2.5 * s, '#2a2d33');
  circle(ctx, cx + 10 * s, y - 2, 2.5 * s, '#2a2d33');
  // whatever they piled on it
  const n = 2 + (Math.floor(p.rng) % 3);
  for (let i = 0; i < n; i++) {
    const c = ['#2f4a8a', '#8a2a1c', '#2f6a4a', '#8a6a2a'][i % 4];
    rect(ctx, cx - 11 * s + i * 8 * s, y - 20 * s - 11 * s, 9 * s, 11 * s, c);
    rect(ctx, cx - 11 * s + i * 8 * s, y - 20 * s - 11 * s, 9 * s, 2, lighten(c, 0.3));
  }
}
function lifeFood(ctx, x, y, p, t, s) {
  const d = p.dir, hx = Math.round(x + d * 10 * s);
  const bite = Math.sin(t * 2.2 + p.o) > 0.55;
  const hy = Math.round(y - (bite ? 33 : 26) * s);
  const kind = Math.floor(p.rng) % 3;
  if (kind === 0) {                                   // a paper cup with a lid
    rect(ctx, hx - 4, hy, 8, 10, '#f4f1ea');
    rect(ctx, hx - 5, hy - 2, 10, 3, '#c8c2b4');
    rect(ctx, hx - 4, hy + 4, 8, 3, '#8a6a44');
    rect(ctx, hx - 1, hy - 4, 2, 2, '#e8eef4');
  } else if (kind === 1) {                            // something in a wrapper
    rect(ctx, hx - 5, hy + 1, 11, 7, '#e8c88a');
    rect(ctx, hx - 5, hy + 1, 11, 2, '#f4e0b0');
    rect(ctx, hx - 6, hy + 4, 13, 4, '#f4f1ea');
    rect(ctx, hx - 2, hy + 3, 5, 2, '#c8402c');
  } else {                                            // a noodle pot, with steam
    rect(ctx, hx - 5, hy, 10, 9, '#f4f1ea');
    rect(ctx, hx - 5, hy, 10, 3, '#c8402c');
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 3; i++) rect(ctx, hx - 2 + i * 2, hy - 5 - ((t * 9 + i * 3 + p.o) % 6), 1, 3, '#e8eef4');
    ctx.globalAlpha = 1;
  }
  if (bite) { ctx.globalAlpha = 0.5; rect(ctx, hx - d * 4, hy + 10, 1, 1, '#c8b898'); ctx.globalAlpha = 1; }
}
function lifeCamera(ctx, x, y, p, t, s, S) {
  const d = p.dir, hx = Math.round(x + d * 11 * s), hy = Math.round(y - 32 * s);
  rect(ctx, hx - 4, hy, 8, 12, '#12141c');
  rect(ctx, hx - 3, hy + 1, 6, 9, '#2a3a5a');
  rect(ctx, hx - 3, hy + 1, 6, 2, '#6a9fd8');
  // the flash, which goes off at the worst moment
  const k = (t * 1.4 + p.o) % 5;
  if (k < 0.09) {
    ctx.globalAlpha = 0.85 - k * 8;
    ellipsePx(ctx, hx + d * 6, hy + 5, 26, 20, '#ffffff');
    ctx.globalAlpha = 1;
  }
}
function lifeMop(ctx, x, y, p, t, s) {
  const d = p.dir, mx = Math.round(x + d * 13 * s);
  const sweep = Math.sin(t * 2.6 + p.o) * 5 * s;
  line(ctx, mx, y - 30 * s, mx + sweep, y - 1, '#8a6a44');
  line(ctx, mx + 1, y - 30 * s, mx + sweep + 1, y - 1, '#a88a5e');
  // the strands, splayed and damp
  for (let i = -3; i <= 3; i++) rect(ctx, Math.round(mx + sweep + i * 2), y - 4, 1, 5, i % 2 ? '#c8c2b4' : '#a8a294');
  ctx.globalAlpha = 0.16; ellipsePx(ctx, mx + sweep, y + 1, 14, 4, '#8ad8ff'); ctx.globalAlpha = 1;
}
function lifeRunning(ctx, x, y, p, t, s) {
  // speed lines behind, and a bag that has given up
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 3; i++) rect(ctx, x - p.dir * (16 + i * 9) * s, y - (14 + i * 7) * s, 8 * s, 1, '#cfd6de');
  ctx.globalAlpha = 1;
  const bx = Math.round(x - p.dir * 14 * s);
  rect(ctx, bx - 5, y - 30 * s + Math.round(Math.sin(t * 14 + p.o) * 2), 10, 9, p.col);
  rect(ctx, bx - 5, y - 30 * s + Math.round(Math.sin(t * 14 + p.o) * 2), 10, 2, lighten(p.col, 0.3));
}
function lifeSleep(ctx, x, y, p, t, s) {
  for (let i = 0; i < 3; i++) {
    const k = (t * 0.6 + i * 0.33 + p.o) % 1;
    ctx.globalAlpha = (1 - k) * 0.8;
    drawText(ctx, 'Z', Math.round(x + 12 * s + k * 12), Math.round(y - 42 * s - k * 20), '#cfe4ff', { scale: 1 + Math.round(k * 2) });
    ctx.globalAlpha = 1;
  }
}
function lifeWhisper(ctx, x, y, p, t, s) {
  // a hand up beside the mouth. it fools nobody.
  const d = p.dir;
  rect(ctx, Math.round(x + d * 7 * s), Math.round(y - 33 * s), Math.round(4 * s), Math.round(6 * s), '#f0d8b8');
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 3; i++) rect(ctx, Math.round(x + d * (11 + i * 3) * s), Math.round(y - 34 * s - i), 2, 1, '#cfc9e6');
  ctx.globalAlpha = 1;
}
function lifeStretch(ctx, x, y, p, t, s) {
  const up = Math.sin(t * 1.6 + p.o) * 0.5 + 0.5;
  ctx.globalAlpha = 0.9;
  rect(ctx, Math.round(x - 9 * s), Math.round(y - (34 + up * 10) * s), Math.round(3 * s), Math.round(10 * s), '#f0d8b8');
  rect(ctx, Math.round(x + 6 * s), Math.round(y - (34 + up * 10) * s), Math.round(3 * s), Math.round(10 * s), '#f0d8b8');
  ctx.globalAlpha = 1;
}
function lifeBalloon(ctx, x, y, p, t, s) {
  const bx = Math.round(x + p.dir * 9 * s), by = Math.round(y - 58 * s + Math.sin(t * 1.7 + p.o) * 3);
  line(ctx, bx, y - 26 * s, bx, by + 8, '#cfc9e6');
  ellipsePx(ctx, bx, by, 7 * s, 8 * s, p.col);
  ellipsePx(ctx, bx - 2 * s, by - 2 * s, 2 * s, 2 * s, '#ffffff');
}
function lifeShoulderBag(ctx, x, y, p, s) {
  const d = -p.dir;
  rect(ctx, Math.round(x + d * 9 * s), Math.round(y - 22 * s), Math.round(8 * s), Math.round(10 * s), p.col);
  rect(ctx, Math.round(x + d * 9 * s), Math.round(y - 22 * s), Math.round(8 * s), 2, lighten(p.col, 0.3));
  line(ctx, Math.round(x + d * 9 * s), Math.round(y - 22 * s), Math.round(x - d * 3 * s), Math.round(y - 34 * s), darken(p.col, 0.3));
}
// a short line over somebody's head, small, so a crowd can all talk at once
function lifeMutter(ctx, x, y, p, t) {
  const w = textWidth(p.said, { font: 'small' }) + 10;
  const a = clamp(p.saidT, 0, 1);
  ctx.globalAlpha = a * 0.92;
  rect(ctx, Math.round(x - w / 2), Math.round(y), w, 12, p.buzz ? '#3a2a12' : '#15131f');
  frame(ctx, Math.round(x - w / 2), Math.round(y), w, 12, p.buzz ? '#c8a03a' : '#3a3450');
  ctx.fillStyle = p.buzz ? '#3a2a12' : '#15131f';
  ctx.beginPath(); ctx.moveTo(x - 3, y + 12); ctx.lineTo(x + 3, y + 12); ctx.lineTo(x, y + 17); ctx.fill();
  drawText(ctx, p.said, Math.round(x), Math.round(y + 3), p.buzz ? '#ffd24a' : '#cfc9e6', { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
}

// ---------- the whole crowd ----------
function drawLifeCrowd(ctx, S, crowd, t, opts) {
  const o = opts || {};
  const sorted = crowd.slice().sort(function (a, b) { return (a.floor - b.floor) || (a.sc - b.sc); });
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (S && S.cam && !S.cam.visible(p.x, 110)) continue;
    const y = p.y != null ? p.y : (S ? S.floorY(p.floor) : 430);
    drawLifePerson(ctx, p, Math.round(p.x), Math.round(y), t, S);
  }
}

// ---------- the machines that also live here ----------
// A cleaning robot: a lozenge with a lit strip, a spinning brush, and the
// patience of something that has never once been thanked.
function drawCleanBot(ctx, x, y, t, o) {
  const s = (o && o.scale) || 1, sweep = Math.sin(t * 0.7 + (o && o.phase || 0)) * ((o && o.range) || 90);
  const cx = Math.round(x + sweep);
  ctx.globalAlpha = 0.28; ellipsePx(ctx, cx, y + 1, 22 * s, 5 * s, '#000'); ctx.globalAlpha = 1;
  rect(ctx, cx - 20 * s, y - 24 * s, 40 * s, 22 * s, '#d8dce2');
  rect(ctx, cx - 20 * s, y - 24 * s, 40 * s, 3 * s, '#f0f3f6');
  rect(ctx, cx - 20 * s, y - 6 * s, 40 * s, 5 * s, '#5a6472');
  // the face nobody asked for
  rect(ctx, cx - 12 * s, y - 20 * s, 24 * s, 9 * s, '#12141c');
  const blink = ((t * 1.3 + (o && o.phase || 0)) % 5) < 0.12;
  rect(ctx, cx - 7 * s, y - 18 * s, 4 * s, blink ? 1 : 5 * s, '#6be585');
  rect(ctx, cx + 3 * s, y - 18 * s, 4 * s, blink ? 1 : 5 * s, '#6be585');
  // the status light, and the brush going round under it
  ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3);
  rect(ctx, cx + 15 * s, y - 27 * s, 4 * s, 3 * s, '#f2a03a'); ctx.globalAlpha = 1;
  const br = Math.floor(t * 12) % 4;
  for (let i = 0; i < 4; i++) {
    const a = (i + br) * Math.PI / 2;
    rect(ctx, Math.round(cx - 14 * s + Math.cos(a) * 5 * s), Math.round(y - 3 * s + Math.sin(a) * 2 * s), 3 * s, 2 * s, '#8a8f98');
  }
  ctx.globalAlpha = 0.14; ellipsePx(ctx, cx - 14 * s, y, 14 * s, 4 * s, '#8ad8ff'); ctx.globalAlpha = 1;
  drawText(ctx, 'CLEAN', cx, y - 14 * s, '#2a3a2a', { align: 'center', font: 'small' });
}
// The bags of rubbish that pile up by every bin in every airport on earth.
function drawTrashPile(ctx, x, y, n, seed) {
  const r = makeRng(seed || 3);
  for (let i = 0; i < n; i++) {
    const bx = x + i * 17 + r.int(-3, 3), w = r.int(15, 21), h = r.int(13, 19);
    const c = i % 3 === 0 ? '#2a2f38' : i % 3 === 1 ? '#3a4048' : '#242830';
    ctx.globalAlpha = 0.28; ellipsePx(ctx, bx, y + 1, w * 0.55, 4, '#000'); ctx.globalAlpha = 1;
    ellipsePx(ctx, bx, y - h / 2, w / 2, h / 2, c);
    ellipsePx(ctx, bx - 2, y - h * 0.68, w / 3.2, h / 3.4, lighten(c, 0.12));
    rect(ctx, bx - 2, y - h - 2, 4, 4, darken(c, 0.3));
    ctx.globalAlpha = 0.25; rect(ctx, bx - w / 4, y - h * 0.7, 3, 6, '#ffffff'); ctx.globalAlpha = 1;
  }
}
// A stack of luggage trolleys, nested, with a coin slot nobody has change for.
function drawTrolleyStack(ctx, x, y, n) {
  for (let i = n - 1; i >= 0; i--) {
    const bx = x + i * 9;
    rect(ctx, bx - 22, y - 30, 44, 4, '#b9bec6');
    rect(ctx, bx - 20, y - 26, 40, 2, '#8a8f98');
    rect(ctx, bx + 16, y - 52, 3, 24, '#8a8f98');
    rect(ctx, bx + 8, y - 54, 14, 3, '#6a7079');
    circle(ctx, bx - 16, y - 2, 3, '#2a2d33');
    circle(ctx, bx + 16, y - 2, 3, '#2a2d33');
    if (i === 0) { rect(ctx, bx + 14, y - 46, 6, 8, '#3a4250'); rect(ctx, bx + 15, y - 44, 4, 1, '#f2c94c'); }
  }
}
