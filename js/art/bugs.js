// ---------- Procedural bug musicians ----------
'use strict';
// Sprite grid: 34x44, feet baseline y=40, centre x=17.
const BUG_W = 34, BUG_H = 44, BUG_CX = 17, BUG_FEET = 40;

const HERO_PRESETS = {
  buzz:    { name: 'Buzz', species: 'Bee', body: 'fuzzy', head: 'round', eyes: 'shades', antennae: 'curve', wings: 'bee', pattern: 'stripes',
             colors: { body: '#f2c53d', body2: '#2a2420', head: '#f2c53d', limb: '#3a3020', wing: '#dfe9ff' }, outfit: { jacket: '#e8b830', shirt: '#fff4d0', shades: true } },
  monarch: { name: 'Monarch', species: 'Butterfly', body: 'slim', head: 'round', eyes: 'happy', antennae: 'club', wings: 'butterfly', pattern: 'none',
             colors: { body: '#f4dcc0', body2: '#2a2420', head: '#f4dcc0', limb: '#2a2420', wing: '#f08a2a', wing2: '#2a2420' }, outfit: { cape: '#d83a3a', capeTrim: '#ffd24a', suit: '#2a2420' } },
  dot:     { name: 'Dot', species: 'Ladybug', body: 'beetle', head: 'round', eyes: 'big', antennae: 'curve', wings: 'none', pattern: 'spots',
             colors: { body: '#d83a2f', body2: '#1e1a1a', head: '#8a2a1a', limb: '#2a1a1a' }, outfit: {} },
  slim:    { name: 'Slim', species: 'Mantis', body: 'slim', head: 'tri', eyes: 'big', antennae: 'straight', wings: 'none', pattern: 'none',
             colors: { body: '#7dc25a', body2: '#4a8a3a', head: '#8fd06a', limb: '#4a8a3a' }, outfit: { vest: '#f4efe0', vestTrim: '#d84040' } },
  hopper:  { name: 'Hopper', species: 'Grasshopper', body: 'slim', head: 'oval', eyes: 'big', antennae: 'long', wings: 'none', pattern: 'none',
             colors: { body: '#8fc95a', body2: '#5a9a3a', head: '#9ad06a', limb: '#5a9a3a' }, outfit: { hat: 'cap', hatColor: '#202028', hatText: 'SF' } },
  stag:    { name: 'Stag', species: 'Stag Beetle', body: 'beetle', head: 'round', eyes: 'dot', antennae: 'none', wings: 'none', pattern: 'elytra', horns: 'stag',
             colors: { body: '#4a2a1a', body2: '#6a3a22', head: '#3a2014', limb: '#2a1810' }, outfit: { coat: '#5a4a3a' } },
  roly:    { name: 'Roly', species: 'Pill Bug', body: 'segmented', head: 'round', eyes: 'big', antennae: 'curve', wings: 'none', pattern: 'plates',
             colors: { body: '#5a78c0', body2: '#3a5090', head: '#6a88d0', limb: '#3a5090' }, outfit: {} },
  fitz:    { name: 'Fitz', species: 'Fly', body: 'slim', head: 'wide', eyes: 'compound', antennae: 'none', wings: 'fly', pattern: 'none',
             colors: { body: '#2a2a30', body2: '#c8a030', head: '#2a2a30', limb: '#2a2a30', wing: '#c0c8d8', eye: '#c83030' }, outfit: { vest: '#3a3a44', vestTrim: '#e0b040' } },
  duke:    { name: 'Duke', species: 'Roach', body: 'slim', head: 'oval', eyes: 'big', antennae: 'long', wings: 'none', pattern: 'none',
             colors: { body: '#8a5a3a', body2: '#5a3a20', head: '#9a6a4a', limb: '#5a3a20' }, outfit: { cape: '#f0e8d8', capeTrim: '#d83a3a', suit: '#f4efe0', crown: true } },
  red:     { name: 'Red', species: 'Ant', body: 'slim', head: 'oval', eyes: 'dot', antennae: 'curve', wings: 'none', pattern: 'none',
             colors: { body: '#c8402a', body2: '#8a2a1a', head: '#c8402a', limb: '#8a2a1a' }, outfit: {} },
  rhino:   { name: 'Rhino', species: 'Rhino Beetle', body: 'beetle', head: 'round', eyes: 'dot', antennae: 'none', wings: 'none', pattern: 'elytra', horns: 'rhino',
             colors: { body: '#5a3a24', body2: '#7a5030', head: '#4a2a18', limb: '#3a2010' }, outfit: { coat: '#e0b040' } },
  cici:    { name: 'Cici', species: 'Cicada', body: 'fuzzy', head: 'round', eyes: 'big', antennae: 'straight', wings: 'moth', pattern: 'none',
             colors: { body: '#8a9a6a', body2: '#5a6a4a', head: '#9aaa7a', limb: '#5a6a4a', wing: '#d8e0c8' }, outfit: {} },
  pip:     { name: 'Pip', species: 'Beetle', body: 'round', head: 'round', eyes: 'big', antennae: 'curve', wings: 'none', pattern: 'none',
             colors: { body: '#3a3038', body2: '#1a1418', head: '#3a3038', limb: '#1a1418' }, outfit: {} },
  skye:    { name: 'Skye', species: 'Dragonfly', body: 'slim', head: 'round', eyes: 'big', antennae: 'straight', wings: 'dragonfly', pattern: 'none',
             colors: { body: '#3aa0a0', body2: '#2a7070', head: '#4ab0b0', limb: '#2a7070', wing: '#cfe8ff' }, outfit: {} },
  gary:    { name: 'Gary', species: 'Snail', body: 'round', head: 'round', eyes: 'stalk', antennae: 'none', wings: 'none', pattern: 'none', shell: true,
             colors: { body: '#e0c8a8', body2: '#b0906a', head: '#e8d0b0', limb: '#b0906a', shell: '#a06a3a', shell2: '#6a4020' }, outfit: {} },
};

const NPC_PALETTES = ['#d83a2f', '#f2c53d', '#7dc25a', '#5a78c0', '#c8402a', '#8a5a3a', '#3aa0a0', '#b070c0', '#e08040', '#5a6a4a', '#3a3038', '#e0c8a8', '#d0d0d8', '#90b0e0'];
function randomBugSpec(rng) {
  const body = rng.pick(['beetle', 'slim', 'round', 'segmented', 'fuzzy']);
  const base = rng.pick(NPC_PALETTES);
  const dark = darken(base, 0.28);
  const spec = {
    name: 'Passer-by', species: 'Bug', body,
    head: rng.pick(['round', 'round', 'oval', 'wide', 'tri']),
    eyes: rng.pick(['big', 'big', 'big', 'dot', 'compound', 'shades', 'happy']),
    antennae: rng.pick(['curve', 'straight', 'club', 'long', 'none']),
    wings: rng.chance(0.3) ? rng.pick(['bee', 'fly', 'moth', 'dragonfly', 'butterfly']) : 'none',
    pattern: rng.pick(['none', 'none', 'spots', 'stripes', 'elytra', 'plates']),
    colors: { body: base, body2: dark, head: rng.chance(0.5) ? base : lighten(base, 0.08), limb: dark, wing: rng.pick(['#dfe9ff', '#ffd0e0', '#d8e0c8', '#cfe8ff']), wing2: dark, eye: '#c83030' },
    outfit: {},
  };
  const r = rng();
  if (r < 0.25) spec.outfit.jacket = rng.pick(['#c04040', '#4060b0', '#3a8a5a', '#8a5a3a', '#202028', '#e0a030']), spec.outfit.shirt = '#f4efe0';
  else if (r < 0.4) spec.outfit.vest = rng.pick(['#f4efe0', '#3a3a44', '#8a3a5a']), spec.outfit.vestTrim = rng.pick(['#d84040', '#e0b040']);
  else if (r < 0.5) spec.outfit.coat = rng.pick(['#5a4a3a', '#2a3a5a', '#7a2a2a']);
  const h = rng();
  if (h < 0.15) spec.outfit.hat = 'cap', spec.outfit.hatColor = rng.pick(['#202028', '#c04040', '#3060b0']);
  else if (h < 0.22) spec.outfit.hat = 'top', spec.outfit.hatColor = '#202028';
  else if (h < 0.32) spec.outfit.hat = 'beanie', spec.outfit.hatColor = rng.pick(['#3a7ac0', '#d05070', '#e0b040']);
  else if (h < 0.38) spec.outfit.hat = 'flower';
  if (rng.chance(0.08)) spec.outfit.scarf = rng.pick(['#d84040', '#e0b040', '#40a0d0']);
  if (rng.chance(0.06)) spec.outfit.headphones = true;
  return spec;
}

// ---- part builders ----------------------------------------------------
function _outlineFor(spec) { return darken(spec.colors.body, 0.42); }

function buildBug(spec, pose = 'idle') {
  const P = new Pix(BUG_W, BUG_H);
  const C = spec.colors, O = spec.outfit || {};
  const ol = _outlineFor(spec);
  const cx = BUG_CX;
  const bob = pose === 'walk2' ? 1 : 0;
  const body = spec.body;
  // geometry per body type
  const geo = {
    beetle:    { rx: 8, ry: 9, cy: 27 },
    round:     { rx: 7, ry: 7, cy: 28 },
    slim:      { rx: 5, ry: 8, cy: 27 },
    segmented: { rx: 8, ry: 9, cy: 27 },
    fuzzy:     { rx: 7, ry: 8, cy: 27 },
  }[body];
  const bcy = geo.cy + bob, shoulderY = bcy - geo.ry + 3;
  const headCy = bcy - geo.ry - 5 + bob;
  const headR = spec.head === 'wide' ? { rx: 8, ry: 6 } : spec.head === 'oval' ? { rx: 5, ry: 7 } : spec.head === 'tri' ? { rx: 7, ry: 6 } : { rx: 6, ry: 6 };
  const limb = C.limb || darken(C.body, 0.3);

  // --- cape (behind everything)
  if (O.cape) {
    const m = P.mask();
    const sway = pose === 'walk1' ? 2 : pose === 'walk2' ? -1 : pose === 'play' || pose === 'cheer' ? 3 : 1;
    P.mPoly(m, [[cx - 6, shoulderY], [cx + 6, shoulderY], [cx + 10 + sway, BUG_FEET - 3], [cx - 10 + sway, BUG_FEET - 3]]);
    P.fill(m, O.cape, { outline: ol });
    if (O.capeTrim) P.paint(m, (x, y) => (y === BUG_FEET - 4 || y === BUG_FEET - 5) ? O.capeTrim : null);
  }
  // --- wings (behind body)
  const wingSpread = pose === 'cheer' || pose === 'play' || pose === 'sing' ? 1 : 0;
  if (spec.wings !== 'none') drawWings(P, spec, cx, shoulderY + 1, wingSpread, ol);
  // --- shell (snail)
  if (spec.shell) {
    const sx = cx + 8, sy = bcy - 4;
    const m = P.mask(); P.mEllipse(m, sx, sy, 8, 8); P.fill(m, C.shell, { outline: ol });
    P.paint(m, (x, y) => { const a = Math.atan2(y - sy, x - sx), d = Math.hypot(x - sx, y - sy); return Math.abs(((d - a * 1.1) % 3.2) - 1.6) < 0.6 ? C.shell2 : null; });
    P.set(sx - 3, sy - 4, lighten(C.shell, 0.3)); P.set(sx - 2, sy - 4, lighten(C.shell, 0.3));
  }
  // --- back legs / legs
  const legL = { x: cx - 4, y: bcy + geo.ry - 3 }, legR = { x: cx + 3, y: bcy + geo.ry - 3 };
  let lOff = 0, rOff = 0;
  if (pose === 'walk1') { lOff = -3; rOff = 3; } else if (pose === 'walk2') { lOff = 3; rOff = -3; }
  for (const [leg, off] of [[legL, lOff], [legR, rOff]]) {
    const m = P.mask(); P.mLine(m, leg.x, leg.y, leg.x + off, BUG_FEET - 1, 2); P.fill(m, limb, { outline: ol, shade: false });
    const f = P.mask(); P.mRect(f, leg.x + off - 1, BUG_FEET - 2, 5, 2); P.fill(f, darken(limb, 0.1), { outline: ol, shade: false });
  }
  // --- body
  const bm = P.mask();
  if (body === 'slim') { P.mEllipse(bm, cx, bcy, geo.rx, geo.ry); P.mEllipse(bm, cx, bcy - geo.ry + 3, geo.rx + 1, 3); }
  else P.mEllipse(bm, cx, bcy, geo.rx, geo.ry);
  if (body === 'fuzzy') { for (let i = -geo.rx; i <= geo.rx; i += 2) { const yy = bcy - geo.ry + Math.abs(i) * 0.15; P.mRect(bm, cx + i, Math.round(yy) - 1, 1, 1); } }
  P.fill(bm, C.body, { outline: ol });
  // patterns
  const b2 = C.body2 || darken(C.body, 0.3);
  if (spec.pattern === 'spots') P.paint(bm, (x, y) => ([[cx - 4, bcy - 3], [cx + 3, bcy - 4], [cx - 1, bcy + 1], [cx + 5, bcy + 2], [cx - 6, bcy + 3]].some(([sx, sy]) => Math.abs(x - sx) <= 1 && Math.abs(y - sy) <= 1 && !(Math.abs(x - sx) === 1 && Math.abs(y - sy) === 1))) ? b2 : null);
  if (spec.pattern === 'stripes') P.paint(bm, (x, y) => ((y - bcy + 20) % 4 === 0 || (y - bcy + 20) % 4 === 1) && y > bcy - geo.ry + 2 && y < bcy + geo.ry - 1 ? b2 : null);
  if (spec.pattern === 'plates') P.paint(bm, (x, y) => ((y - bcy + 20) % 3 === 0) && y > bcy - geo.ry + 1 ? darken(C.body, 0.2) : null);
  if (spec.pattern === 'elytra') P.paint(bm, (x, y) => x === cx && y > bcy - geo.ry + 2 ? ol : (x === cx - 3 || x === cx + 3) && y > bcy - geo.ry + 3 && y < bcy + geo.ry - 3 ? lighten(C.body, 0.08) : null);
  if (spec.pattern === 'spots' || body === 'beetle') { // shell split line for beetles
    if (spec.pattern !== 'elytra') P.paint(bm, (x, y) => x === cx && y > bcy - geo.ry + 3 ? darken(C.body, 0.25) : null);
  }
  // --- outfits over body
  if (O.jacket) {
    const m = P.mask(); P.mEllipse(m, cx, bcy - 1, geo.rx, geo.ry - 1); P.mSub(m, (() => { const s = P.mask(); P.mPoly(s, [[cx - 2, bcy - geo.ry], [cx + 3, bcy - geo.ry], [cx + 1, bcy + 3], [cx, bcy + 3]]); return s; })());
    const lower = P.mask(); P.mRect(lower, 0, bcy + geo.ry - 3, BUG_W, 10); P.mSub(m, lower);
    P.fill(m, O.jacket, { outline: ol });
    P.paint(m, (x, y) => (x === cx - 3 || x === cx + 3) && y < bcy + 1 ? lighten(O.jacket, 0.12) : null);
    // shirt in the V
    const sh = P.mask(); P.mPoly(sh, [[cx - 1, bcy - geo.ry + 1], [cx + 2, bcy - geo.ry + 1], [cx + 1, bcy + 2], [cx, bcy + 2]]); P.fill(sh, O.shirt || '#f4efe0', { shade: false });
  }
  if (O.vest) {
    const m = P.mask(); P.mEllipse(m, cx, bcy, geo.rx - 1, geo.ry - 1);
    const cut = P.mask(); P.mPoly(cut, [[cx - 2, bcy - geo.ry], [cx + 3, bcy - geo.ry], [cx + 2, bcy + 1], [cx - 1, bcy + 1]]); P.mSub(m, cut);
    const lower = P.mask(); P.mRect(lower, 0, bcy + geo.ry - 4, BUG_W, 10); P.mSub(m, lower);
    P.fill(m, O.vest, { outline: ol });
    if (O.vestTrim) P.paint(m, (x, y) => (x === cx - 3 || x === cx + 3) && (y - bcy) % 2 === 0 ? O.vestTrim : null);
  }
  if (O.coat) {
    const m = P.mask(); P.mPoly(m, [[cx - geo.rx, bcy - geo.ry + 2], [cx + geo.rx, bcy - geo.ry + 2], [cx + geo.rx + 1, bcy + geo.ry - 1], [cx - geo.rx - 1, bcy + geo.ry - 1]]);
    const cut = P.mask(); P.mRect(cut, cx - 1, bcy - geo.ry + 2, 3, geo.ry * 2); P.mSub(m, cut);
    P.fill(m, O.coat, { outline: ol });
  }
  if (O.suit) {
    const m = P.mask(); P.mEllipse(m, cx, bcy, geo.rx, geo.ry - 1);
    const lower = P.mask(); P.mRect(lower, 0, bcy + geo.ry - 3, BUG_W, 10); P.mSub(m, lower);
    P.fill(m, O.suit, { outline: ol });
    P.paint(m, (x, y) => Math.abs(x - cx) <= 0 && y > bcy - geo.ry + 2 && y < bcy + 2 && (y % 2 === 0) ? '#ffd24a' : null);
  }
  if (O.scarf) { const m = P.mask(); P.mRect(m, cx - geo.rx + 1, shoulderY - 1, geo.rx * 2 - 1, 2); P.mRect(m, cx + 2, shoulderY, 2, 6); P.fill(m, O.scarf, { outline: ol, shade: false }); }
  // --- arms (2px) with pose
  const armY = shoulderY + 1;
  let hands;
  switch (pose) {
    case 'play': hands = [[cx - 7, armY + 7], [cx + 6, armY + 4]]; break;
    case 'cheer': hands = [[cx - 10, armY - 9], [cx + 10, armY - 9]]; break;
    case 'sing': hands = [[cx - 5, armY - 6], [cx + 8, armY + 3]]; break;
    case 'walk1': hands = [[cx - 8, armY + 8], [cx + 7, armY + 5]]; break;
    case 'walk2': hands = [[cx - 7, armY + 5], [cx + 8, armY + 8]]; break;
    default: hands = [[cx - 8, armY + 7], [cx + 8, armY + 7]];
  }
  const armCol = limb;
  hands.forEach(([hx, hy], i) => {
    const sx = i === 0 ? cx - geo.rx + 2 : cx + geo.rx - 3;
    const m = P.mask(); P.mLine(m, sx, armY, hx, hy, 2); P.fill(m, armCol, { outline: ol, shade: false });
    const h = P.mask(); P.mEllipse(h, hx, hy, 1.5, 1.5); P.fill(h, darken(armCol, 0.05), { outline: ol, shade: false });
  });
  // --- head
  const hm = P.mask();
  if (spec.head === 'tri') P.mPoly(hm, [[cx - headR.rx, headCy - headR.ry + 1], [cx + headR.rx, headCy - headR.ry + 1], [cx + 2, headCy + headR.ry], [cx - 2, headCy + headR.ry]]);
  else P.mEllipse(hm, cx, headCy, headR.rx, headR.ry);
  P.fill(hm, C.head || C.body, { outline: ol });
  // horns
  if (spec.horns === 'stag') {
    for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 3, headCy - headR.ry + 1, cx + s * 6, headCy - headR.ry - 5, 2); P.mLine(m, cx + s * 6, headCy - headR.ry - 5, cx + s * 3, headCy - headR.ry - 8, 2); P.fill(m, C.body2 || darken(C.body, 0.2), { outline: ol, shade: false }); }
  } else if (spec.horns === 'rhino') {
    const m = P.mask(); P.mPoly(m, [[cx - 2, headCy - headR.ry + 1], [cx + 2, headCy - headR.ry + 1], [cx + 3, headCy - headR.ry - 7], [cx + 1, headCy - headR.ry - 8]]); P.fill(m, C.body2 || darken(C.body, 0.2), { outline: ol, shade: false });
  }
  // antennae
  drawAntennae(P, spec, cx, headCy - headR.ry, ol, pose);
  // eyes
  drawEyes(P, spec, cx, headCy, headR, ol);
  // mouth
  if (spec.eyes !== 'compound') { const my = headCy + Math.max(2, headR.ry - 3); P.set(cx - 1, my, ol); P.set(cx, my + (spec.eyes === 'happy' ? 1 : 0), ol); P.set(cx + 1, my, ol); }
  // hats
  drawHat(P, spec, cx, headCy - headR.ry, headR, ol);
  if (O.headphones) { const m = P.mask(); P.mLine(m, cx - headR.rx, headCy, cx - headR.rx + 1, headCy - headR.ry - 1, 1); P.mLine(m, cx - headR.rx + 1, headCy - headR.ry - 1, cx + headR.rx - 1, headCy - headR.ry - 1, 1); P.mLine(m, cx + headR.rx - 1, headCy - headR.ry - 1, cx + headR.rx, headCy, 1); P.mRect(m, cx - headR.rx - 1, headCy - 1, 2, 3); P.mRect(m, cx + headR.rx, headCy - 1, 2, 3); P.fill(m, '#d84040', { outline: ol, shade: false }); }
  return P;
}

function drawWings(P, spec, cx, y, spread, ol) {
  const C = spec.colors; const w = C.wing || '#dfe9ff';
  const wl = lighten(w, 0.1), wd = darken(w, 0.15);
  switch (spec.wings) {
    case 'bee': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (7 + spread), y - 3 - spread * 2, 5, 3); P.fill(m, w, { outline: ol, hi: wl, lo: wd }); P.paint(m, (x, yy) => (x + yy) % 3 === 0 ? wd : null); } break;
    case 'fly': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (7 + spread), y - 1 - spread * 2, 4, 7); P.fill(m, w, { outline: ol, hi: wl, lo: wd }); P.paint(m, (x, yy) => x === cx + s * (7 + spread) ? wd : null); } break;
    case 'moth': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (8 + spread), y, 6, 8); P.fill(m, w, { outline: ol, hi: wl, lo: wd }); P.paint(m, (x, yy) => (yy - y) % 4 === 0 ? wd : null); } break;
    case 'dragonfly': for (const s of [-1, 1]) { for (const k of [0, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (11 + spread * 2), y - 6 + k * 7, 10, 2); P.fill(m, w, { outline: ol, hi: wl, lo: wd, shade: false }); P.paint(m, (x, yy) => yy === y - 6 + k * 7 ? wd : null); } } break;
    case 'butterfly': {
      const o = C.wing || '#f08a2a', v = C.wing2 || '#2a2420';
      for (const s of [-1, 1]) {
        const up = P.mask(); P.mEllipse(up, cx + s * (9 + spread * 2), y - 4 - spread, 8, 7); P.fill(up, o, { outline: v, hi: lighten(o, 0.1), lo: darken(o, 0.12) });
        const lo = P.mask(); P.mEllipse(lo, cx + s * (7 + spread * 2), y + 6, 6, 5); P.fill(lo, o, { outline: v, hi: lighten(o, 0.1), lo: darken(o, 0.12) });
        // veins & spots
        P.paint(up, (x, yy) => (Math.abs((x - cx) * 0.7 + (yy - (y - 4)) * 0.5 - s * 3) < 0.6 || Math.abs(yy - (y - 4) - (x - cx) * s * 0.4) < 0.6) ? v : null);
        P.paint(up, (x, yy) => (Math.abs(x - (cx + s * 14)) <= 1 && Math.abs(yy - (y - 6)) <= 0) || (Math.abs(x - (cx + s * 12)) === 0 && Math.abs(yy - (y - 9)) <= 0) ? '#fff4d0' : null);
        P.paint(lo, (x, yy) => Math.abs(yy - (y + 6) - (x - cx) * s * 0.5) < 0.6 ? v : null);
      }
      break;
    }
  }
}
function drawAntennae(P, spec, cx, topY, ol, pose) {
  const col = spec.colors.limb || ol; const wag = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  switch (spec.antennae) {
    case 'curve': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 3, topY, cx + s * 5, topY - 3, 1); P.mLine(m, cx + s * 5, topY - 3, cx + s * (7 + wag), topY - 6, 1); P.fill(m, col, { shade: false }); P.set(cx + s * (7 + wag), topY - 7, col); P.set(cx + s * (8 + wag), topY - 7, col); } break;
    case 'straight': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 3, topY, cx + s * (4 + wag), topY - 8, 1); P.fill(m, col, { shade: false }); } break;
    case 'club': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 2, topY, cx + s * (5 + wag), topY - 7, 1); P.fill(m, col, { shade: false }); const b = P.mask(); P.mEllipse(b, cx + s * (5 + wag), topY - 8, 1.5, 1.5); P.fill(b, col, { shade: false }); } break;
    case 'long': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 3, topY, cx + s * (9 + wag), topY - 6, 1); P.mLine(m, cx + s * (9 + wag), topY - 6, cx + s * (13 + wag), topY - 7, 1); P.fill(m, col, { shade: false }); } break;
  }
}
function drawEyes(P, spec, cx, cy, hr, ol) {
  const ex = Math.max(2, hr.rx - 3), ey = cy - 1;
  switch (spec.eyes) {
    case 'big': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * ex, ey, 2, 2.5); P.fill(m, '#ffffff', { outline: ol, shade: false }); P.set(cx + s * ex + (s > 0 ? 0 : 0), ey + 1, '#141018'); P.set(cx + s * ex, ey, '#141018'); P.set(cx + s * ex - 1, ey - 1, '#ffffff'); } break;
    case 'dot': for (const s of [-1, 1]) { P.set(cx + s * ex, ey, '#141018'); P.set(cx + s * ex, ey - 1, '#141018'); P.set(cx + s * ex - 1, ey - 1, '#ffffff'); } break;
    case 'happy': for (const s of [-1, 1]) { P.set(cx + s * ex - 1, ey, ol); P.set(cx + s * ex, ey - 1, ol); P.set(cx + s * ex + 1, ey, ol); } break;
    case 'compound': { const col = spec.colors.eye || '#c83030'; for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (hr.rx - 2), ey, 3, 3.5); P.fill(m, col, { outline: ol }); P.paint(m, (x, y) => (x + y) % 2 === 0 ? darken(col, 0.12) : null); P.set(cx + s * (hr.rx - 3), ey - 2, lighten(col, 0.35)); } break; }
    case 'shades': { const m = P.mask(); P.mRound(m, cx - hr.rx + 1, ey - 2, hr.rx * 2 - 1, 4, 1); P.fill(m, '#1a1820', { outline: ol, shade: false }); P.paint(m, (x, y) => y === ey - 1 && (x === cx - 3 || x === cx + 2) ? '#5a5870' : null); P.set(cx, ey - 1, '#1a1820'); break; }
    case 'stalk': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 2, cy - hr.ry, cx + s * 4, cy - hr.ry - 6, 1); P.fill(m, spec.colors.head, { shade: false }); const e = P.mask(); P.mEllipse(e, cx + s * 4, cy - hr.ry - 7, 1.5, 1.5); P.fill(e, '#ffffff', { outline: ol, shade: false }); P.set(cx + s * 4, cy - hr.ry - 7, '#141018'); } break;
  }
}
function drawHat(P, spec, cx, topY, hr, ol) {
  const O = spec.outfit || {};
  if (O.hat === 'cap') { const m = P.mask(); P.mEllipse(m, cx, topY + 1, hr.rx, 3); const cut = P.mask(); P.mRect(cut, 0, topY + 2, BUG_W, 10); P.mSub(m, cut); P.mRect(m, cx - 1, topY + 1, hr.rx + 3, 2); P.fill(m, O.hatColor || '#202028', { outline: ol }); if (O.hatText) { P.set(cx - 2, topY - 1, '#d84040'); P.set(cx, topY - 1, '#d84040'); } }
  else if (O.hat === 'top') { const m = P.mask(); P.mRect(m, cx - hr.rx, topY, hr.rx * 2 + 1, 2); P.mRect(m, cx - hr.rx + 2, topY - 7, hr.rx * 2 - 3, 8); P.fill(m, O.hatColor || '#202028', { outline: ol }); P.paint(m, (x, y) => y === topY - 1 ? '#c04040' : null); }
  else if (O.hat === 'beanie') { const m = P.mask(); P.mEllipse(m, cx, topY + 2, hr.rx, 4); const cut = P.mask(); P.mRect(cut, 0, topY + 2, BUG_W, 10); P.mSub(m, cut); P.fill(m, O.hatColor || '#3a7ac0', { outline: ol }); P.set(cx, topY - 3, lighten(O.hatColor || '#3a7ac0', 0.2)); }
  else if (O.hat === 'flower') { const m = P.mask(); P.mEllipse(m, cx + hr.rx - 2, topY, 2, 2); P.fill(m, '#ff70b0', { outline: ol, shade: false }); P.set(cx + hr.rx - 2, topY, '#ffe060'); }
  if (O.crown) { const m = P.mask(); P.mRect(m, cx - 4, topY - 3, 9, 3); for (const x of [-4, -1, 2, 4]) P.mRect(m, cx + x, topY - 5, 1, 2); P.fill(m, '#ffd24a', { outline: ol, shade: false }); P.set(cx, topY - 2, '#d83a3a'); }
}

// ---- instruments held by bugs (drawn onto the sprite) ---------------------
function drawHeldInstrument(P, kind, pose, spec) {
  const cx = BUG_CX; const ol = '#1a1410';
  const playing = pose === 'play' || pose === 'sing';
  switch (kind) {
    case 'guitar': case 'bass': {
      const bodyCol = kind === 'bass' ? '#8a3a5a' : '#d98c3a', neckCol = '#5a3a1e';
      const bx = cx - 3, by = playing ? 27 : 30;
      const n = P.mask(); P.mLine(n, bx + 3, by - 2, bx + 14, by - 11, 2); P.fill(n, neckCol, { outline: ol, shade: false });
      P.paint(n, (x, y) => (x % 3 === 0) ? lighten(neckCol, 0.15) : null);
      const hd = P.mask(); P.mRect(hd, bx + 13, by - 14, 3, 4); P.fill(hd, darken(neckCol, 0.1), { outline: ol, shade: false });
      const b = P.mask(); P.mEllipse(b, bx, by, 5, 4); P.mEllipse(b, bx + 4, by - 2, 3, 3); P.fill(b, bodyCol, { outline: ol });
      P.set(bx, by, '#2a1a0a'); P.set(bx + 1, by, '#2a1a0a'); P.set(bx, by + 1, '#2a1a0a');
      P.paint(b, (x, y) => y === by - 1 && x > bx - 3 && x < bx + 6 ? lighten(bodyCol, 0.25) : null);
      break;
    }
    case 'sax': { const g = '#e0b040'; const m = P.mask(); P.mLine(m, cx + 1, 15, cx + 3, 26, 2); P.mEllipse(m, cx + 5, 28, 3, 3); P.mRect(m, cx + 3, 26, 5, 2); P.fill(m, g, { outline: ol }); P.set(cx + 4, 20, darken(g, 0.2)); P.set(cx + 4, 23, darken(g, 0.2)); break; }
    case 'trumpet': { const g = '#f0c040'; const m = P.mask(); P.mLine(m, cx + 2, 16, cx + 12, 16, 2); P.mRect(m, cx + 5, 18, 5, 2); P.mEllipse(m, cx + 13, 17, 2, 3); P.fill(m, g, { outline: ol }); break; }
    case 'violin': { const v = '#b05a2a'; const m = P.mask(); P.mEllipse(m, cx - 3, 20, 3, 4); P.mLine(m, cx - 2, 18, cx + 6, 12, 2); P.fill(m, v, { outline: ol }); const bw = P.mask(); P.mLine(bw, cx - 8, 26, cx + 2, 14, 1); P.fill(bw, '#e0d0b0', { shade: false }); break; }
    case 'tambourine': { const m = P.mask(); P.mEllipse(m, cx + 9, 23, 4, 4); const c = P.mask(); P.mEllipse(c, cx + 9, 23, 2.5, 2.5); P.mSub(m, c); P.fill(m, '#c08a3a', { outline: ol }); P.set(cx + 6, 21, '#f0e0c0'); P.set(cx + 12, 21, '#f0e0c0'); P.set(cx + 9, 26, '#f0e0c0'); break; }
    case 'mic': { const m = P.mask(); P.mLine(m, cx - 5, 12, cx - 5, 17, 2); P.fill(m, '#4a4a58', { outline: ol, shade: false }); const h = P.mask(); P.mEllipse(h, cx - 4, 10, 2, 2); P.fill(h, '#a0a0b0', { outline: ol }); break; }
    case 'harmonica': { const m = P.mask(); P.mRect(m, cx - 4, 15, 8, 3); P.fill(m, '#b0b0c0', { outline: ol, shade: false }); P.paint(m, (x, y) => y === 16 && x % 2 === 0 ? '#606070' : null); break; }
    case 'triangle': { const m = P.mask(); P.mLine(m, cx + 5, 17, cx + 9, 25, 1); P.mLine(m, cx + 9, 25, cx + 1, 25, 1); P.mLine(m, cx + 1, 25, cx + 5, 17, 1); P.fill(m, '#d8d8e0', { shade: false }); break; }
    case 'keytar': { const m = P.mask(); P.mLine(m, cx - 6, 24, cx + 8, 17, 4); P.fill(m, '#d84060', { outline: ol }); P.paint(m, (x, y) => (x + y) % 2 === 0 && y > 18 ? '#f4f0e8' : null); break; }
  }
}

// Standalone instrument props (drum kit, keyboard stand) drawn on the stage, not on the bug
function propInstrument(kind) {
  return cached('propinstr|' + kind, () => {
    let P;
    if (kind === 'drums') {
      P = new Pix(40, 30); const ol = '#1a1410';
      // cymbals
      for (const [x, y] of [[6, 4], [34, 5]]) { const m = P.mask(); P.mEllipse(m, x, y, 6, 1.5); P.fill(m, '#e0c060', { outline: ol }); const s = P.mask(); P.mLine(s, x, y + 1, x, 24, 1); P.fill(s, '#888', { shade: false }); }
      // toms
      for (const [x, y] of [[13, 10], [27, 10]]) { const m = P.mask(); P.mEllipse(m, x, y, 5, 4); P.fill(m, '#c03a3a', { outline: ol }); P.paint(m, (px2, py) => py <= y - 2 ? '#f0e8d8' : null); }
      // kick
      const k = P.mask(); P.mEllipse(k, 20, 20, 9, 8); P.fill(k, '#c03a3a', { outline: ol });
      const f = P.mask(); P.mEllipse(f, 20, 20, 6, 5.5); P.fill(f, '#f0e8d8', { outline: darken('#c03a3a', 0.2), shade: false });
      // crown logo
      P.set(18, 19, '#3a2a1a'); P.set(20, 18, '#3a2a1a'); P.set(22, 19, '#3a2a1a'); P.set(19, 21, '#3a2a1a'); P.set(20, 21, '#3a2a1a'); P.set(21, 21, '#3a2a1a');
      const legs = P.mask(); P.mLine(legs, 12, 24, 10, 29, 1); P.mLine(legs, 28, 24, 30, 29, 1); P.fill(legs, '#888', { shade: false });
    } else if (kind === 'piano') {
      P = new Pix(40, 22); const ol = '#1a1410';
      const top = P.mask(); P.mRect(top, 2, 4, 36, 7); P.fill(top, '#2a2a3a', { outline: ol });
      P.paint(top, (x, y) => y >= 6 && y <= 9 ? (x % 5 === 0 ? '#101018' : y <= 7 && x % 5 === 2 ? '#101018' : '#f4f0e8') : null);
      const st = P.mask(); P.mLine(st, 6, 11, 4, 21, 1); P.mLine(st, 34, 11, 36, 21, 1); P.mLine(st, 4, 15, 36, 15, 1); P.fill(st, '#777', { shade: false });
    } else { P = new Pix(4, 4); }
    return P.toCanvas();
  });
}

function bugCanvas(spec, pose = 'idle', instrument = null) {
  const key = 'bug|' + JSON.stringify(spec) + '|' + pose + '|' + (instrument || '');
  return cached(key, () => {
    const P = buildBug(spec, pose);
    if (instrument && instrument !== 'drums' && instrument !== 'piano') drawHeldInstrument(P, instrument, pose, spec);
    return P.toCanvas();
  });
}
// Draw a bug with its feet at (x, y). opts: {pose, flip, instrument, scale, alpha}
function drawBugAt(ctx, spec, x, y, opts = {}) {
  let c = bugCanvas(spec, opts.pose || 'idle', opts.instrument);
  if (opts.flip) c = cached('flip|' + JSON.stringify(spec) + '|' + (opts.pose || 'idle') + '|' + (opts.instrument || ''), () => flipCanvas(c));
  const s = opts.scale || 1;
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  ctx.drawImage(c, Math.round(x - BUG_CX * s), Math.round(y - BUG_FEET * s), Math.round(BUG_W * s), Math.round(BUG_H * s));
  if (opts.alpha != null) ctx.globalAlpha = 1;
}
function drawShadow(ctx, x, y, w, alpha = 0.25) {
  ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
  ctx.fillRect(Math.round(x - w / 2), Math.round(y - 1), Math.round(w), 2);
  ctx.fillRect(Math.round(x - w / 2 + 2), Math.round(y - 2), Math.round(w - 4), 1);
}
