// ---------- High-detail procedural bug musicians ----------
'use strict';
// Sprite grid 52x70. Feet baseline y=64, centre x=26.
const BUG_W = 52, BUG_H = 70, BUG_CX = 26, BUG_FEET = 64;

// --- the band: a four-piece stadium act of bugs
const HERO_PRESETS = {
  merc:    { name: 'MERC', species: 'Monarch Butterfly', role: 'VOCALS & PIANO', body: 'slim', head: 'round', eyes: 'bold', antennae: 'club', wings: 'butterfly', pattern: 'none',
             colors: { body: '#f4dcc0', body2: '#2a2018', head: '#f6e2c8', limb: '#2a2018', wing: '#f08a2a', wing2: '#241a12', trim: '#ffd24a' },
             outfit: { jacket: '#e8c020', jacketTrim: '#fff4d0', shirt: '#fdfaf2', trousers: '#fdfaf2', wristband: '#e8c020' } },
  stag:    { name: 'STAG', species: 'Stag Beetle', role: 'LEAD GUITAR', body: 'beetle', head: 'round', eyes: 'calm', antennae: 'curly', wings: 'none', pattern: 'elytra', horns: 'stag',
             colors: { body: '#5a3722', body2: '#8a5a34', head: '#46291a', limb: '#2e1c10', trim: '#d8c8a0' },
             outfit: { blouse: '#f2ece0', clogs: true } },
  dot:     { name: 'DOT', species: 'Ladybug', role: 'DRUMS', body: 'round', head: 'round', eyes: 'bold', antennae: 'curve', wings: 'none', pattern: 'spots',
             colors: { body: '#d8382c', body2: '#221a18', head: '#7e241a', limb: '#2a1a18', trim: '#ffd8a0' },
             outfit: { vest: '#f6f0e2', band: '#d8382c' } },
  slim:    { name: 'SLIM', species: 'Mantis', role: 'BASS', body: 'slim', head: 'tri', eyes: 'calm', antennae: 'straight', wings: 'none', pattern: 'none',
             colors: { body: '#79c257', head: '#8ed166', body2: '#3f7a34', limb: '#3f7a34', trim: '#e8f6d8' },
             outfit: { tee: '#2c2c36', belt: '#c8a048' } },
  // supporting cast / recruits
  hopper:  { name: 'HOPPER', species: 'Grasshopper', role: 'KEYS', body: 'slim', head: 'oval', eyes: 'bold', antennae: 'long', wings: 'none', pattern: 'none',
             colors: { body: '#8fc95a', body2: '#5a9a3a', head: '#9ad06a', limb: '#5a9a3a' }, outfit: { hat: 'cap', hatColor: '#242430', tee: '#4d86c6' } },
  duke:    { name: 'DUKE', species: 'Roach', role: 'SAX', body: 'slim', head: 'oval', eyes: 'bold', antennae: 'long', wings: 'none', pattern: 'none',
             colors: { body: '#8a5a3a', body2: '#5a3a20', head: '#9a6a4a', limb: '#5a3a20' }, outfit: { jacket: '#6a2a4a', shirt: '#f2ece0', crown: true } },
  fitz:    { name: 'FITZ', species: 'Fly', role: 'TRUMPET', body: 'slim', head: 'wide', eyes: 'compound', antennae: 'none', wings: 'fly', pattern: 'none',
             colors: { body: '#2b2b33', body2: '#c8a030', head: '#2b2b33', limb: '#2b2b33', wing: '#c3ccdc', eye: '#c83030' }, outfit: { vest: '#3a3a46', vestTrim: '#e0b040' } },
  cici:    { name: 'CICI', species: 'Cicada', role: 'VIOLIN', body: 'fuzzy', head: 'round', eyes: 'bold', antennae: 'straight', wings: 'moth', pattern: 'none',
             colors: { body: '#8a9a6a', body2: '#5a6a4a', head: '#9aaa7a', limb: '#5a6a4a', wing: '#dde4cd' }, outfit: { blouse: '#f2ece0' } },
  roly:    { name: 'ROLY', species: 'Pill Bug', role: 'TAMBOURINE', body: 'segmented', head: 'round', eyes: 'bold', antennae: 'curve', wings: 'none', pattern: 'plates',
             colors: { body: '#5a78c0', body2: '#39508f', head: '#6a88d0', limb: '#39508f' }, outfit: {} },
  gary:    { name: 'GARY', species: 'Snail', role: 'SHOPKEEP', body: 'round', head: 'round', eyes: 'stalk', antennae: 'none', wings: 'none', pattern: 'none', shell: true,
             colors: { body: '#e0c8a8', body2: '#b0906a', head: '#e8d0b0', limb: '#b0906a', shell: '#a06a3a', shell2: '#6a4020' }, outfit: {} },
  buzz:    { name: 'BUZZ', species: 'Bee', role: 'GUITAR', body: 'fuzzy', head: 'round', eyes: 'shades', antennae: 'curve', wings: 'bee', pattern: 'stripes',
             colors: { body: '#f2c53d', body2: '#2a2420', head: '#f2c53d', limb: '#3a3020', wing: '#dfe9ff' }, outfit: { jacket: '#e8b830', shirt: '#fff4d0' } },
  monarch: { name: 'MERC', species: 'Monarch Butterfly', role: 'VOCALS', body: 'slim', head: 'round', eyes: 'bold', antennae: 'club', wings: 'butterfly', pattern: 'none',
             colors: { body: '#f4dcc0', body2: '#2a2018', head: '#f6e2c8', limb: '#2a2018', wing: '#f08a2a', wing2: '#241a12' }, outfit: { jacket: '#e8c020', shirt: '#fdfaf2', trousers: '#fdfaf2' } },
};
const NPC_PALETTES = ['#d8382c', '#f2c53d', '#79c257', '#5a78c0', '#c8402a', '#8a5a3a', '#3aa0a0', '#b070c0', '#e08040', '#5a6a4a', '#3a3038', '#e0c8a8', '#d0d0d8', '#90b0e0', '#c86a8a'];
function randomBugSpec(rng) {
  const body = rng.pick(['beetle', 'slim', 'round', 'segmented', 'fuzzy']);
  const base = rng.pick(NPC_PALETTES), dark = darken(base, 0.3);
  const spec = { name: 'Passer-by', species: 'Bug', body,
    head: rng.pick(['round', 'round', 'oval', 'wide', 'tri']),
    eyes: rng.pick(['bold', 'bold', 'bold', 'calm', 'compound', 'shades', 'sleepy']),
    antennae: rng.pick(['curve', 'straight', 'club', 'long', 'curly', 'none']),
    wings: rng.chance(0.3) ? rng.pick(['bee', 'fly', 'moth', 'dragonfly', 'butterfly']) : 'none',
    pattern: rng.pick(['none', 'none', 'spots', 'stripes', 'elytra', 'plates']),
    colors: { body: base, body2: dark, head: rng.chance(0.5) ? base : lighten(base, 0.08), limb: dark, wing: rng.pick(['#dfe9ff', '#ffd0e0', '#dde4cd', '#cfe8ff']), wing2: dark, eye: '#c83030', trim: lighten(base, 0.3) },
    outfit: {} };
  const r = rng();
  if (r < 0.22) { spec.outfit.jacket = rng.pick(['#c04040', '#4060b0', '#3a8a5a', '#8a5a3a', '#242430', '#e0a030']); spec.outfit.shirt = '#f2ece0'; }
  else if (r < 0.38) { spec.outfit.vest = rng.pick(['#f2ece0', '#3a3a46', '#8a3a5a']); spec.outfit.vestTrim = rng.pick(['#d84040', '#e0b040']); }
  else if (r < 0.52) spec.outfit.tee = rng.pick(['#4d86c6', '#d8382c', '#2c2c36', '#79c257', '#e8c020']);
  else if (r < 0.6) spec.outfit.blouse = '#f2ece0';
  const h = rng();
  if (h < 0.14) { spec.outfit.hat = 'cap'; spec.outfit.hatColor = rng.pick(['#242430', '#c04040', '#3060b0']); }
  else if (h < 0.2) { spec.outfit.hat = 'top'; spec.outfit.hatColor = '#242430'; }
  else if (h < 0.3) { spec.outfit.hat = 'beanie'; spec.outfit.hatColor = rng.pick(['#3a7ac0', '#d05070', '#e0b040']); }
  else if (h < 0.36) spec.outfit.hat = 'flower';
  if (rng.chance(0.09)) spec.outfit.scarf = rng.pick(['#d84040', '#e0b040', '#40a0d0']);
  if (rng.chance(0.07)) spec.outfit.headphones = true;
  if (rng.chance(0.08)) spec.outfit.bag = rng.pick(['#8a5a3a', '#3a4a6a']);
  return spec;
}
// ---- geometry per body type: {rx, ry, cy}
const BODY_GEO = { beetle: { rx: 13, ry: 14, cy: 42 }, round: { rx: 12, ry: 12, cy: 44 }, slim: { rx: 8.5, ry: 13, cy: 43 }, segmented: { rx: 13, ry: 14, cy: 42 }, fuzzy: { rx: 11.5, ry: 13, cy: 43 } };
const HEAD_GEO = { round: { rx: 10, ry: 10 }, oval: { rx: 8.5, ry: 11 }, wide: { rx: 12.5, ry: 9 }, tri: { rx: 11, ry: 9.5 } };
// ---- pose table: arm targets and leg offsets
function poseData(pose) {
  switch (pose) {
    case 'walk1': return { arms: [[-16, 12], [15, 7]], legs: [-5, 5], bob: 0, lean: 0 };
    case 'walk2': return { arms: [[-15, 7], [16, 12]], legs: [5, -5], bob: -1, lean: 0 };
    case 'play': return { arms: [[-15, 12], [13, 5]], legs: [-2, 2], bob: 0, lean: 0 };
    case 'play2': return { arms: [[-14, 8], [14, 10]], legs: [-2, 2], bob: -1, lean: 0 };
    case 'cheer': return { arms: [[-15, -14], [15, -14]], legs: [-3, 3], bob: -2, lean: 0 };
    case 'sing': return { arms: [[-11, -11], [16, 5]], legs: [-2, 2], bob: -1, lean: 0 };
    case 'sad': return { arms: [[-10, 14], [10, 14]], legs: [-2, 2], bob: 2, lean: 0 };
    case 'shock': return { arms: [[-15, -6], [15, -6]], legs: [-4, 4], bob: -1, lean: 0 };
    case 'point': return { arms: [[-10, 12], [18, -2]], legs: [-2, 2], bob: 0, lean: 0 };
    case 'idle2': return { arms: [[-15, 12], [15, 12]], legs: [-2, 2], bob: 1, lean: 0 };
    default: return { arms: [[-15, 13], [15, 13]], legs: [-2, 2], bob: 0, lean: 0 };
  }
}
const EXPR_FOR_POSE = { cheer: 'happy', sing: 'sing', sad: 'sad', shock: 'shock', play: 'focus', play2: 'focus' };

function buildBug(spec, pose, expr) {
  const P = new Pix(BUG_W, BUG_H);
  const C = spec.colors, O = spec.outfit || {};
  const ol = darken(C.body, 0.45), cx = BUG_CX;
  const pd = poseData(pose);
  const geo = BODY_GEO[spec.body] || BODY_GEO.round;
  const bcy = geo.cy + pd.bob, shoulderY = bcy - geo.ry + 4;
  const hr = HEAD_GEO[spec.head] || HEAD_GEO.round;
  const headCy = bcy - geo.ry - hr.ry + 3 + pd.bob;
  const limb = C.limb || darken(C.body, 0.32);
  const trim = C.trim || lighten(C.body, 0.3);

  // ---------- cape (behind all) ----------
  if (O.cape) {
    const m = P.mask(); const sway = pose === 'walk1' ? 3 : pose === 'walk2' ? -2 : pose === 'cheer' ? 5 : 1;
    P.mPoly(m, [[cx - 9, shoulderY], [cx + 9, shoulderY], [cx + 15 + sway, BUG_FEET - 4], [cx - 15 + sway, BUG_FEET - 4]]);
    P.fill(m, O.cape, { outline: ol });
    P.paint(m, (x, y) => (y > BUG_FEET - 8 && y < BUG_FEET - 4) ? (O.capeTrim || trim) : ((x + sway * 2) % 9 === 0 && y > shoulderY + 4) ? darken(O.cape, 0.14) : null);
  }
  // ---------- wings ----------
  if (spec.wings && spec.wings !== 'none') drawWings(P, spec, cx, shoulderY + 2, (pose === 'cheer' || pose === 'play' || pose === 'sing') ? 2 : 0, ol, pose);
  // ---------- snail shell ----------
  if (spec.shell) {
    const sx = cx + 12, sy = bcy - 5;
    const m = P.mask(); P.mEllipse(m, sx, sy, 12, 12); P.fill(m, C.shell, { outline: ol });
    P.paint(m, (x, y) => { const a = Math.atan2(y - sy, x - sx), d = Math.hypot(x - sx, y - sy); return Math.abs(((d - a * 1.5) % 4.4) - 2.2) < 0.8 ? C.shell2 : null; });
    P.paint(m, (x, y) => Math.hypot(x - (sx - 4), y - (sy - 5)) < 3 ? lighten(C.shell, 0.3) : null);
  }
  // ---------- legs ----------
  const hipY = bcy + geo.ry - 4;
  for (let i = 0; i < 2; i++) {
    const s = i ? 1 : -1, off = pd.legs[i];
    const hipX = cx + s * (geo.rx * 0.45), kneeX = hipX + off * 0.5, footX = hipX + off;
    const m = P.mask();
    P.mLine(m, hipX, hipY, kneeX, hipY + (BUG_FEET - hipY) * 0.55, 3);
    P.mLine(m, kneeX, hipY + (BUG_FEET - hipY) * 0.55, footX, BUG_FEET - 2, 3);
    P.fill(m, limb, { outline: ol, shade: false });
    P.paint(m, (x, y) => x === Math.round(hipX) - 1 || x === Math.round(kneeX) - 1 ? lighten(limb, 0.12) : null);
    const f = P.mask();
    if (O.clogs) { P.mRect(f, footX - 5, BUG_FEET - 4, 10, 4); P.fill(f, '#c8a058', { outline: ol }); }
    else { P.mEllipse(f, footX, BUG_FEET - 2, 4.5, 2.5); P.fill(f, darken(limb, 0.1), { outline: ol }); }
  }
  // ---------- body ----------
  const bm = P.mask();
  P.mEllipse(bm, cx, bcy, geo.rx, geo.ry);
  if (spec.body === 'slim') P.mEllipse(bm, cx, bcy - geo.ry + 4, geo.rx + 1.5, 4.5);
  if (spec.body === 'fuzzy') for (let i = -geo.rx; i <= geo.rx; i += 2) { const yy = bcy - geo.ry + Math.abs(i) * 0.2; P.mRect(bm, Math.round(cx + i), Math.round(yy) - 2, 1, 2); }
  P.fill(bm, C.body, { outline: ol });
  // body shading: rim light top-left, occlusion bottom-right
  P.paint(bm, (x, y) => { const dx = (x - cx) / geo.rx, dy = (y - bcy) / geo.ry, d = dx * dx + dy * dy;
    if (d > 0.62 && dx + dy > 0.55) return darken(C.body, 0.16);
    if (Math.hypot(x - (cx - geo.rx * 0.42), y - (bcy - geo.ry * 0.42)) < geo.rx * 0.36) return lighten(C.body, 0.2);
    return null; });
  const b2 = C.body2 || darken(C.body, 0.3);
  if (spec.pattern === 'spots') { const spots = [[-6, -5, 3], [5, -6, 3], [-2, 2, 2.5], [8, 3, 2.5], [-9, 4, 2.5], [1, 8, 2]];
    for (const [ox, oy, rr] of spots) { const m = P.mask(); P.mEllipse(m, cx + ox, bcy + oy, rr, rr); P.fill(m, b2, { shade: false }); P.paint(m, (x, y) => Math.hypot(x - (cx + ox - rr * 0.3), y - (bcy + oy - rr * 0.3)) < rr * 0.4 ? lighten(b2, 0.12) : null); } }
  if (spec.pattern === 'stripes') P.paint(bm, (x, y) => { const t = (y - bcy + 30) % 6; return (t < 2.5) ? b2 : (t < 3.3) ? darken(b2, 0.1) : null; });
  if (spec.pattern === 'plates') P.paint(bm, (x, y) => { const t = (y - bcy + 30) % 5; return t < 1 ? darken(C.body, 0.24) : t < 2 ? lighten(C.body, 0.08) : null; });
  if (spec.pattern === 'elytra' || spec.body === 'beetle') {
    P.paint(bm, (x, y) => x === cx && y > bcy - geo.ry + 4 ? darken(C.body, 0.3) : (x === cx - 1 && y > bcy - geo.ry + 5) ? lighten(C.body, 0.12) : null);
    P.paint(bm, (x, y) => (Math.abs(Math.abs(x - cx) - geo.rx * 0.62) < 0.6 && y > bcy - geo.ry + 6 && y < bcy + geo.ry - 4) ? darken(C.body, 0.2) : null);
  }
  // ---------- outfits over the body ----------
  const cut = (m, fromY) => { const c2 = P.mask(); P.mRect(c2, 0, fromY, BUG_W, BUG_H); P.mSub(m, c2); };
  if (O.tee || O.blouse) {
    const col = O.tee || O.blouse; const m = P.mask();
    P.mEllipse(m, cx, bcy, geo.rx - 0.5, geo.ry - 0.5); cut(m, bcy + geo.ry - 5);
    const neck = P.mask(); P.mEllipse(neck, cx, bcy - geo.ry + 3, 4, 3); P.mSub(m, neck);
    P.fill(m, col, { outline: ol });
    P.paint(m, (x, y) => y > bcy + geo.ry - 9 ? darken(col, 0.12) : (x < cx - geo.rx * 0.5 && y < bcy) ? lighten(col, 0.14) : null);
    if (O.blouse) { for (let i = 0; i < 4; i++) { const yy = bcy - geo.ry + 6 + i * 4; P.set(cx, yy, darken(col, 0.3)); } // ruffle front
      P.paint(m, (x, y) => Math.abs(x - cx) < 2 && (y - bcy) % 3 === 0 ? darken(col, 0.18) : null); }
  }
  if (O.vest) {
    const m = P.mask(); P.mEllipse(m, cx, bcy, geo.rx - 0.5, geo.ry - 1); cut(m, bcy + geo.ry - 6);
    const v = P.mask(); P.mPoly(v, [[cx - 3, bcy - geo.ry], [cx + 4, bcy - geo.ry], [cx + 3, bcy + 3], [cx - 2, bcy + 3]]); P.mSub(m, v);
    P.fill(m, O.vest, { outline: ol });
    if (O.vestTrim) P.paint(m, (x, y) => (Math.abs(x - (cx - 5)) < 1 || Math.abs(x - (cx + 5)) < 1) && (y - bcy) % 3 === 0 ? O.vestTrim : null);
  }
  if (O.jacket) {
    const m = P.mask(); P.mEllipse(m, cx, bcy - 1, geo.rx + 0.5, geo.ry); cut(m, bcy + geo.ry - 4);
    const v = P.mask(); P.mPoly(v, [[cx - 3, bcy - geo.ry], [cx + 4, bcy - geo.ry], [cx + 2, bcy + 5], [cx - 1, bcy + 5]]); P.mSub(m, v);
    P.fill(m, O.jacket, { outline: ol });
    // lapels + seams + shoulder highlight
    P.paint(m, (x, y) => { const t = y - (bcy - geo.ry);
      if (t < 9 && Math.abs(Math.abs(x - cx) - (3 + t * 0.42)) < 1.1) return O.jacketTrim || lighten(O.jacket, 0.24);
      if (Math.abs(Math.abs(x - cx) - geo.rx * 0.72) < 0.6 && t > 6) return darken(O.jacket, 0.16);
      if (y < bcy - geo.ry * 0.4 && x < cx - geo.rx * 0.4) return lighten(O.jacket, 0.16);
      return null; });
    const sh = P.mask(); P.mPoly(sh, [[cx - 2, bcy - geo.ry + 1], [cx + 3, bcy - geo.ry + 1], [cx + 1, bcy + 4], [cx, bcy + 4]]); P.fill(sh, O.shirt || '#f2ece0', { shade: false });
  }
  if (O.trousers) { const m = P.mask(); P.mEllipse(m, cx, bcy + geo.ry - 2, geo.rx - 1, 4); P.fill(m, O.trousers, { outline: ol }); }
  if (O.belt) { const m = P.mask(); P.mRect(m, cx - geo.rx + 1, bcy + geo.ry - 6, geo.rx * 2 - 2, 3); P.fill(m, '#2a2028', { outline: ol, shade: false }); P.paint(m, (x, y) => Math.abs(x - cx) < 2 && y === bcy + geo.ry - 5 ? O.belt : null); }
  if (O.scarf) { const m = P.mask(); P.mRect(m, cx - geo.rx + 1, shoulderY - 2, geo.rx * 2 - 1, 3); P.mRect(m, cx + 3, shoulderY, 3, 9); P.fill(m, O.scarf, { outline: ol }); }
  if (O.bag) { const m = P.mask(); P.mLine(m, cx - 8, shoulderY, cx + 9, bcy + 3, 2); P.fill(m, darken(O.bag, 0.2), { shade: false }); const b = P.mask(); P.mRound(b, cx + 7, bcy + 1, 10, 9, 2); P.fill(b, O.bag, { outline: ol }); }
  // ---------- arms ----------
  const armY = shoulderY + 2;
  pd.arms.forEach(([hx, hy], i) => {
    const s = i ? 1 : -1, sx = cx + s * (geo.rx - 1.5), tx = cx + hx, ty = armY + hy;
    const ex = (sx + tx) / 2 + s * 2.5, ey = (armY + ty) / 2 + 1;
    const m = P.mask(); P.mLine(m, sx, armY, ex, ey, 3); P.mLine(m, ex, ey, tx, ty, 3);
    const sleeve = O.jacket || O.tee || O.vest || O.blouse;
    P.fill(m, sleeve && !O.vest ? sleeve : limb, { outline: ol, shade: false });
    if (sleeve && !O.vest) { const cuff = P.mask(); P.mEllipse(cuff, (ex + tx) / 2, (ey + ty) / 2, 2.5, 2.5); P.fill(cuff, sleeve, { shade: false }); }
    const h = P.mask(); P.mEllipse(h, tx, ty, 2.6, 2.6); P.fill(h, limb, { outline: ol });
    P.paint(h, (x, y) => Math.hypot(x - (tx - 1), y - (ty - 1)) < 1.4 ? lighten(limb, 0.18) : null);
    if (O.wristband) { const w = P.mask(); P.mEllipse(w, (ex + tx) / 2 + (tx - ex) * 0.3, (ey + ty) / 2 + (ty - ey) * 0.3, 3, 2); P.fill(w, O.wristband, { shade: false }); }
  });
  // ---------- head ----------
  const hm = P.mask();
  if (spec.head === 'tri') P.mPoly(hm, [[cx - hr.rx, headCy - hr.ry + 2], [cx + hr.rx, headCy - hr.ry + 2], [cx + 3, headCy + hr.ry], [cx - 3, headCy + hr.ry]]);
  else P.mEllipse(hm, cx, headCy, hr.rx, hr.ry);
  P.fill(hm, C.head || C.body, { outline: ol });
  const hc = C.head || C.body;
  P.paint(hm, (x, y) => { const dx = (x - cx) / hr.rx, dy = (y - headCy) / hr.ry, d = dx * dx + dy * dy;
    if (d > 0.6 && dx + dy > 0.5) return darken(hc, 0.15);
    if (Math.hypot(x - (cx - hr.rx * 0.45), y - (headCy - hr.ry * 0.45)) < hr.rx * 0.34) return lighten(hc, 0.22);
    return null; });
  // neck shadow
  P.paint(bm, (x, y) => y < bcy - geo.ry + 3 && Math.abs(x - cx) < hr.rx * 0.7 ? darken(C.body, 0.2) : null);
  if (spec.horns === 'stag') for (const s of [-1, 1]) { const m = P.mask();
    P.mLine(m, cx + s * 4, headCy - hr.ry + 2, cx + s * 9, headCy - hr.ry - 7, 3); P.mLine(m, cx + s * 9, headCy - hr.ry - 7, cx + s * 5, headCy - hr.ry - 12, 3);
    P.mLine(m, cx + s * 9, headCy - hr.ry - 7, cx + s * 13, headCy - hr.ry - 9, 2);
    P.fill(m, C.body2 || darken(C.body, 0.2), { outline: ol }); }
  if (spec.horns === 'rhino') { const m = P.mask(); P.mPoly(m, [[cx - 3, headCy - hr.ry + 2], [cx + 3, headCy - hr.ry + 2], [cx + 4, headCy - hr.ry - 10], [cx + 1, headCy - hr.ry - 12]]); P.fill(m, C.body2 || darken(C.body, 0.2), { outline: ol }); }
  drawAntennae(P, spec, cx, headCy - hr.ry + 1, ol, pose);
  drawFace(P, spec, cx, headCy, hr, ol, expr);
  drawHat(P, spec, cx, headCy - hr.ry + 1, hr, ol);
  if (O.headphones) { const m = P.mask();
    P.mLine(m, cx - hr.rx - 1, headCy, cx - hr.rx + 1, headCy - hr.ry - 2, 2); P.mLine(m, cx - hr.rx + 1, headCy - hr.ry - 2, cx + hr.rx - 1, headCy - hr.ry - 2, 2); P.mLine(m, cx + hr.rx - 1, headCy - hr.ry - 2, cx + hr.rx + 1, headCy, 2);
    P.mRound(m, cx - hr.rx - 3, headCy - 3, 5, 8, 2); P.mRound(m, cx + hr.rx - 1, headCy - 3, 5, 8, 2);
    P.fill(m, '#d84040', { outline: ol }); }
  if (O.crown) { const m = P.mask(); P.mRect(m, cx - 7, headCy - hr.ry - 5, 15, 5); for (const x of [-7, -2, 3, 7]) P.mRect(m, cx + x, headCy - hr.ry - 8, 2, 3);
    P.fill(m, '#ffd24a', { outline: ol }); P.paint(m, (x, y) => y === headCy - hr.ry - 3 && (x - cx) % 4 === 0 ? '#d83a3a' : null); }
  return P;
}
function drawWings(P, spec, cx, y, spread, ol, pose) {
  const C = spec.colors, w = C.wing || '#dfe9ff', wl = lighten(w, 0.14), wd = darken(w, 0.18);
  const flap = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  switch (spec.wings) {
    case 'bee': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (11 + spread), y - 6 - spread * 2 + flap, 8, 4.5); P.fill(m, w, { outline: ol, hi: wl, lo: wd });
      P.paint(m, (x, yy) => ((x - cx) * s * 0.6 + (yy - y) * 1.2) % 4 < 1 ? wd : null); } break;
    case 'fly': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (11 + spread), y - 1 - spread + flap, 6, 11); P.fill(m, w, { outline: ol, hi: wl, lo: wd });
      P.paint(m, (x, yy) => Math.abs(x - (cx + s * (11 + spread))) < 1 || (yy - y) % 5 === 0 ? wd : null); } break;
    case 'moth': for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (12 + spread), y + 1, 9, 12); P.fill(m, w, { outline: ol, hi: wl, lo: wd });
      P.paint(m, (x, yy) => (yy - y) % 6 === 0 ? wd : ((x - cx) * s + yy) % 11 === 0 ? wl : null); } break;
    case 'dragonfly': for (const s of [-1, 1]) for (const k of [0, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (16 + spread * 2), y - 8 + k * 10 + flap * 2, 15, 3); P.fill(m, w, { outline: ol, hi: wl, lo: wd, shade: false });
      P.paint(m, (x, yy) => (x - cx) % 5 === 0 ? wd : null); } break;
    case 'butterfly': {
      const o = C.wing || '#f08a2a', v = C.wing2 || '#241a12';
      for (const s of [-1, 1]) {
        const up = P.mask(); P.mEllipse(up, cx + s * (18 + spread * 2), y - 8 - spread, 13, 11); P.fill(up, o, { outline: v, hi: lighten(o, 0.16), lo: darken(o, 0.14) });
        const lo = P.mask(); P.mEllipse(lo, cx + s * (16 + spread * 2), y + 8, 10, 8); P.fill(lo, o, { outline: v, hi: lighten(o, 0.16), lo: darken(o, 0.14) });
        P.paint(up, (x, yy) => { const dx = (x - (cx + s * (18 + spread * 2))), dy = yy - (y - 8 - spread);
          return (Math.abs(dx * 0.55 + dy * 0.8) < 0.7 || Math.abs(dx * 0.9 - dy * 0.4) < 0.7 || Math.abs(dy - dx * s * 0.6) < 0.7) ? v : null; });
        P.paint(up, (x, yy) => { const dx = (x - (cx + s * (18 + spread * 2))), dy = yy - (y - 8 - spread); return (dx * dx + dy * dy) > 74 ? v : null; });
        for (const [ox, oy] of [[8, -5], [3, -8], [10, 1]]) P.paint(up, (x, yy) => Math.hypot(x - (cx + s * (18 + spread * 2) + s * ox), yy - (y - 8 - spread + oy)) < 1.7 ? '#fff4d8' : null);
        P.paint(lo, (x, yy) => { const dx = (x - (cx + s * (16 + spread * 2))), dy = yy - (y + 8); return (Math.abs(dy - dx * s * 0.5) < 0.7 || dx * dx + dy * dy > 58) ? v : null; });
      }
      break;
    }
  }
}
function drawAntennae(P, spec, cx, topY, ol, pose) {
  const col = spec.colors.limb || ol, tip = spec.colors.trim || col;
  const wag = pose === 'walk1' ? 2 : pose === 'walk2' ? -2 : pose === 'cheer' ? -3 : pose === 'shock' ? -4 : 0;
  switch (spec.antennae) {
    case 'curve': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 4, topY, cx + s * 7, topY - 5, 2); P.mLine(m, cx + s * 7, topY - 5, cx + s * (10 + wag), topY - 10, 2); P.fill(m, col, { shade: false });
      const b = P.mask(); P.mEllipse(b, cx + s * (10 + wag), topY - 11, 2, 2); P.fill(b, tip, { outline: ol }); } break;
    case 'straight': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 4, topY, cx + s * (6 + wag), topY - 13, 2); P.fill(m, col, { shade: false }); P.set(cx + s * (6 + wag), topY - 14, tip); } break;
    case 'club': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 3, topY, cx + s * (8 + wag), topY - 12, 2); P.fill(m, col, { shade: false });
      const b = P.mask(); P.mEllipse(b, cx + s * (8 + wag), topY - 13, 2.6, 2.6); P.fill(b, tip, { outline: ol }); } break;
    case 'long': for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 4, topY, cx + s * (13 + wag), topY - 10, 2); P.mLine(m, cx + s * (13 + wag), topY - 10, cx + s * (19 + wag), topY - 11, 1); P.fill(m, col, { shade: false }); } break;
    case 'curly': for (const s of [-1, 1]) { const m = P.mask();
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2.4, rr = 2 + i * 0.42; P.mRect(m, Math.round(cx + s * (6 + Math.cos(a) * rr + wag * 0.4)), Math.round(topY - 3 - i * 0.8 - Math.sin(a) * rr * 0.5), 2, 2); }
      P.fill(m, col, { shade: false }); } break;
  }
}
function drawFace(P, spec, cx, cy, hr, ol, expr) {
  const ex = Math.max(3, hr.rx - 4), ey = cy - 1, e = spec.eyes;
  const blink = expr === 'blink';
  if (e === 'compound') {
    const col = spec.colors.eye || '#c83030';
    for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (hr.rx - 3), ey, 5, 6); P.fill(m, col, { outline: ol });
      P.paint(m, (x, y) => (x + y) % 2 === 0 ? darken(col, 0.14) : null);
      P.paint(m, (x, y) => Math.hypot(x - (cx + s * (hr.rx - 3) - 2), y - (ey - 3)) < 1.8 ? lighten(col, 0.5) : null); }
  } else if (e === 'shades') {
    const m = P.mask(); P.mRound(m, cx - hr.rx + 1, ey - 4, hr.rx * 2 - 2, 8, 2); P.fill(m, '#1c1a24', { outline: ol, shade: false });
    P.paint(m, (x, y) => y < ey - 1 && ((x - cx) % 7 === 0) ? '#5a5870' : null);
    P.set(cx, ey - 1, '#3a3848'); P.set(cx, ey, '#3a3848');
    for (const s of [-1, 1]) P.paint(m, (x, y) => Math.hypot(x - (cx + s * 4), y - (ey - 2)) < 1.6 ? '#8a88a8' : null);
  } else if (e === 'stalk') {
    for (const s of [-1, 1]) { const m = P.mask(); P.mLine(m, cx + s * 3, cy - hr.ry, cx + s * 6, cy - hr.ry - 10, 2); P.fill(m, spec.colors.head, { shade: false });
      const b = P.mask(); P.mEllipse(b, cx + s * 6, cy - hr.ry - 12, 3, 3); P.fill(b, '#ffffff', { outline: ol });
      P.paint(b, (x, y) => Math.hypot(x - (cx + s * 6), y - (cy - hr.ry - 12)) < 1.4 ? '#141018' : null); }
  } else {
    const big = e === 'bold', rw = big ? 4 : 3.2, rh = big ? 4.8 : 3.6;
    for (const s of [-1, 1]) {
      const m = P.mask(); P.mEllipse(m, cx + s * ex, ey, rw, rh);
      P.fill(m, '#ffffff', { outline: ol, shade: false });
      if (blink || e === 'sleepy') { const lid = P.mask(); P.mRect(lid, cx + s * ex - rw - 1, ey - rh - 1, rw * 2 + 2, blink ? rh * 2 + 1 : rh + 1); P.fill(lid, spec.colors.head || spec.colors.body, { shade: false });
        P.paint(lid, (x, y) => y === Math.round(ey + (blink ? 0 : -0.5)) ? ol : null); }
      else {
        let px2 = cx + s * ex, py2 = ey + 0.6;
        if (expr === 'shock') { py2 = ey; }
        if (expr === 'focus') px2 += s * 0.6;
        if (expr === 'sad') py2 = ey + 1.4;
        const ir = P.mask(); P.mEllipse(ir, px2, py2, expr === 'shock' ? 1.6 : 2.4, expr === 'shock' ? 1.6 : 2.6);
        P.fill(ir, spec.colors.iris || '#2a2438', { shade: false });
        P.paint(ir, (x, y) => Math.hypot(x - (px2 - 0.8), y - (py2 - 0.8)) < 1.1 ? '#ffffff' : null);
        P.set(Math.round(px2 + 1), Math.round(py2 + 1), '#6a6480');
      }
      // brows
      const bw = rw + 1;
      let by = ey - rh - 2, tilt = 0;
      if (expr === 'angry' || expr === 'focus') { by = ey - rh - 1; tilt = s * 1; }
      if (expr === 'sad') { by = ey - rh - 2; tilt = -s * 1; }
      if (expr === 'happy' || expr === 'sing') by = ey - rh - 3;
      if (expr !== 'none') { const m2 = P.mask(); P.mLine(m2, cx + s * ex - bw, by + tilt, cx + s * ex + bw, by - tilt, 2); P.fill(m2, darken(spec.colors.head || spec.colors.body, 0.4), { shade: false }); }
    }
  }
  // cheeks
  if (expr === 'happy' || expr === 'sing') for (const s of [-1, 1]) { const m = P.mask(); P.mEllipse(m, cx + s * (hr.rx - 2), cy + 3, 2.4, 1.6); P.fill(m, withAlpha('#ff8080', 1), { shade: false }); }
  // mouth
  const my = cy + Math.max(3, hr.ry - 4);
  const mk = (pts, col) => { const m = P.mask(); P.mPoly(m, pts); P.fill(m, col, { shade: false }); };
  if (e !== 'compound') {
    switch (expr) {
      case 'sing': { const m = P.mask(); P.mEllipse(m, cx, my + 1, 3.2, 4); P.fill(m, '#3a1a24', { outline: ol, shade: false }); P.paint(m, (x, y) => y > my + 2 ? '#d8607a' : null); break; }
      case 'happy': { const m = P.mask(); for (let i = -4; i <= 4; i++) P.mRect(m, cx + i, my + Math.round(Math.abs(i) < 3 ? 1.4 - Math.abs(i) * 0.1 : 0), 1, 2); P.fill(m, ol, { shade: false }); break; }
      case 'sad': { const m = P.mask(); for (let i = -3; i <= 3; i++) P.mRect(m, cx + i, my + Math.round(Math.abs(i) * 0.6), 1, 2); P.fill(m, ol, { shade: false }); break; }
      case 'shock': { const m = P.mask(); P.mEllipse(m, cx, my + 1, 2.6, 3); P.fill(m, '#3a1a24', { outline: ol, shade: false }); break; }
      case 'focus': { const m = P.mask(); P.mRect(m, cx - 3, my, 6, 2); P.fill(m, ol, { shade: false }); break; }
      default: { const m = P.mask(); for (let i = -3; i <= 3; i++) P.mRect(m, cx + i, my + (Math.abs(i) > 2 ? 0 : 1), 1, 1); P.fill(m, ol, { shade: false }); }
    }
  }
}
function drawHat(P, spec, cx, topY, hr, ol) {
  const O = spec.outfit || {};
  if (O.hat === 'cap') { const m = P.mask(); P.mEllipse(m, cx, topY + 2, hr.rx + 1, 5); const c2 = P.mask(); P.mRect(c2, 0, topY + 2, BUG_W, BUG_H); P.mSub(m, c2);
    P.mRect(m, cx - 1, topY + 1, hr.rx + 6, 3); P.fill(m, O.hatColor || '#242430', { outline: ol });
    P.paint(m, (x, y) => y < topY - 2 && x < cx ? lighten(O.hatColor || '#242430', 0.18) : null); }
  else if (O.hat === 'top') { const m = P.mask(); P.mRect(m, cx - hr.rx - 2, topY, hr.rx * 2 + 5, 3); P.mRect(m, cx - hr.rx + 2, topY - 11, hr.rx * 2 - 3, 12); P.fill(m, O.hatColor || '#242430', { outline: ol });
    P.paint(m, (x, y) => y === topY - 3 ? '#c04040' : null); }
  else if (O.hat === 'beanie') { const m = P.mask(); P.mEllipse(m, cx, topY + 3, hr.rx + 1, 7); const c2 = P.mask(); P.mRect(c2, 0, topY + 3, BUG_W, BUG_H); P.mSub(m, c2); P.fill(m, O.hatColor || '#3a7ac0', { outline: ol });
    const b = P.mask(); P.mEllipse(b, cx, topY - 5, 2.4, 2.4); P.fill(b, lighten(O.hatColor || '#3a7ac0', 0.25), { outline: ol }); }
  else if (O.hat === 'flower') { const c = ['#ff70b0', '#ffe060']; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; const m = P.mask(); P.mEllipse(m, cx + hr.rx - 3 + Math.cos(a) * 2.4, topY + Math.sin(a) * 2.4, 1.8, 1.8); P.fill(m, c[0], { shade: false }); }
    const m2 = P.mask(); P.mEllipse(m2, cx + hr.rx - 3, topY, 1.6, 1.6); P.fill(m2, c[1], { shade: false }); }
}
// ---------- held instruments (scaled for the bigger sprite) ----------
function drawHeldInstrument(P, kind, pose, spec) {
  const cx = BUG_CX, ol = '#1a1410', playing = pose === 'play' || pose === 'play2' || pose === 'sing' || pose === 'cheer';
  switch (kind) {
    case 'guitar': case 'bass': {
      const bodyCol = kind === 'bass' ? '#8a3a5a' : '#c8702a', neck = '#5a3a1e';
      const bx = cx - 7, by = playing ? 45 : 48;
      const n = P.mask(); P.mLine(n, bx + 5, by - 4, bx + 22, by - 19, 3); P.fill(n, neck, { outline: ol, shade: false });
      P.paint(n, (x, y) => (x + y) % 4 === 0 ? lighten(neck, 0.2) : null);
      const hd = P.mask(); P.mRect(hd, bx + 20, by - 25, 5, 7); P.fill(hd, darken(neck, 0.12), { outline: ol });
      for (let i = 0; i < 3; i++) { P.set(bx + 20, by - 24 + i * 2, '#d8d0b0'); P.set(bx + 24, by - 24 + i * 2, '#d8d0b0'); }
      const b = P.mask(); P.mEllipse(b, bx, by, 9, 7); P.mEllipse(b, bx + 7, by - 4, 6, 5); P.fill(b, bodyCol, { outline: ol });
      P.paint(b, (x, y) => Math.hypot(x - bx, y - by) < 2.6 ? '#2a1a0a' : null);
      P.paint(b, (x, y) => Math.hypot(x - (bx - 4), y - (by - 4)) < 3 ? lighten(bodyCol, 0.28) : null);
      const st = P.mask(); P.mLine(st, bx + 2, by - 1, bx + 21, by - 18, 1); P.fill(st, '#f0e8d0', { shade: false });
      break;
    }
    case 'sax': { const g = '#e0b040'; const m = P.mask(); P.mLine(m, cx + 2, 24, cx + 5, 42, 3); P.mEllipse(m, cx + 9, 46, 5, 5); P.mRect(m, cx + 5, 42, 8, 3); P.fill(m, g, { outline: ol });
      P.paint(m, (x, y) => Math.hypot(x - (cx + 6), y - 30) < 2 ? lighten(g, 0.3) : null);
      for (let i = 0; i < 4; i++) { const b = P.mask(); P.mEllipse(b, cx + 7, 28 + i * 5, 1.6, 1.6); P.fill(b, '#f6e2a0', { outline: darken(g, 0.3) }); }
      const mp = P.mask(); P.mRect(mp, cx - 1, 18, 6, 7); P.fill(mp, '#2a2430', { outline: ol }); break; }
    case 'trumpet': { const g = '#f0c040'; const m = P.mask(); P.mLine(m, cx + 3, 26, cx + 19, 26, 4); P.mRect(m, cx + 8, 29, 8, 3); P.fill(m, g, { outline: ol });
      for (let i = 0; i < 10; i++) { const c2 = P.mask(); P.mEllipse(c2, cx + 19 + i * 0.9, 26, 3 + i * 0.7, 3 + i * 0.7); P.fill(c2, i % 2 ? g : lighten(g, 0.2), { shade: false }); }
      for (let v = 0; v < 3; v++) { const b = P.mask(); P.mRect(b, cx + 6 + v * 4, 21, 3, 6); P.fill(b, darken(g, 0.2), { outline: ol }); } break; }
    case 'violin': { const v = '#b05a2a'; const m = P.mask(); P.mEllipse(m, cx - 5, 30, 5, 6); P.mEllipse(m, cx - 5, 24, 4, 4); P.fill(m, v, { outline: ol });
      const nk = P.mask(); P.mLine(nk, cx - 4, 24, cx + 9, 14, 2); P.fill(nk, '#3a2010', { shade: false });
      const bw = P.mask(); P.mLine(bw, cx - 14, 38, cx + 6, 20, 1); P.fill(bw, '#e8dcc0', { shade: false }); break; }
    case 'tambourine': { const m = P.mask(); P.mEllipse(m, cx + 13, 34, 7, 7); const c2 = P.mask(); P.mEllipse(c2, cx + 13, 34, 4.6, 4.6); P.mSub(m, c2); P.fill(m, '#c08a3a', { outline: ol });
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; P.set(Math.round(cx + 13 + Math.cos(a) * 7), Math.round(34 + Math.sin(a) * 7), '#f0e0c0'); } break; }
    case 'mic': { const m = P.mask(); P.mLine(m, cx - 8, 18, cx - 8, 28, 3); P.fill(m, '#4a4a58', { outline: ol, shade: false });
      const h = P.mask(); P.mEllipse(h, cx - 8, 15, 3.4, 3.4); P.fill(h, '#b0b0c0', { outline: ol }); P.paint(h, (x, y) => (x + y) % 2 === 0 ? '#7a7a8a' : null); break; }
    case 'harmonica': { const m = P.mask(); P.mRect(m, cx - 6, 24, 13, 5); P.fill(m, '#b8b8c8', { outline: ol }); P.paint(m, (x, y) => y === 26 && x % 2 === 0 ? '#5a5a68' : null); break; }
    case 'triangle': { const m = P.mask(); P.mLine(m, cx + 8, 26, cx + 14, 38, 2); P.mLine(m, cx + 14, 38, cx + 2, 38, 2); P.mLine(m, cx + 2, 38, cx + 8, 26, 2); P.fill(m, '#dcdce6', { shade: false }); break; }
    case 'keytar': { const m = P.mask(); P.mLine(m, cx - 9, 38, cx + 13, 26, 7); P.fill(m, '#d84060', { outline: ol }); P.paint(m, (x, y) => (x * 2 + y) % 5 < 2 ? '#f4f0e8' : null); break; }
  }
}
function propInstrument(kind) {
  return cached('propinstr|' + kind, () => {
    let P;
    if (kind === 'drums') {
      P = new Pix(64, 48); const ol = '#1a1410';
      for (const [x, y, r] of [[9, 6, 9], [55, 7, 8]]) { const m = P.mask(); P.mEllipse(m, x, y, r, 2); P.fill(m, '#e0c060', { outline: ol }); P.paint(m, (px2, py) => px2 % 3 === 0 ? '#f6e0a0' : null); const s = P.mask(); P.mLine(s, x, y + 2, x, 40, 2); P.fill(s, '#8a8a98', { shade: false }); }
      for (const [x, y] of [[20, 14], [44, 14]]) { const m = P.mask(); P.mEllipse(m, x, y, 8, 7); P.fill(m, '#c8382c', { outline: ol }); const h = P.mask(); P.mEllipse(h, x, y - 2, 7, 4); P.fill(h, '#f2e8d4', { outline: darken('#c8382c', 0.2) }); P.paint(h, (px2, py) => py < y - 3 ? '#fbf6ea' : null); }
      const k = P.mask(); P.mEllipse(k, 32, 32, 15, 13); P.fill(k, '#c8382c', { outline: ol });
      const f = P.mask(); P.mEllipse(f, 32, 32, 11, 9.5); P.fill(f, '#f2e8d4', { outline: darken('#c8382c', 0.25) });
      P.paint(f, (x, y) => Math.hypot(x - 28, y - 27) < 4 ? '#fbf6ea' : null);
      const crown = P.mask(); P.mRect(crown, 27, 33, 11, 3); for (const x of [27, 31, 36]) P.mRect(crown, x, 30, 2, 3); P.fill(crown, '#c8a020', { shade: false });
      const legs = P.mask(); P.mLine(legs, 20, 40, 15, 47, 2); P.mLine(legs, 44, 40, 49, 47, 2); P.fill(legs, '#8a8a98', { shade: false });
    } else if (kind === 'piano') {
      P = new Pix(64, 34); const ol = '#1a1410';
      const top = P.mask(); P.mRect(top, 2, 6, 60, 12); P.fill(top, '#2a2a3a', { outline: ol });
      P.paint(top, (x, y) => { if (y < 9 || y > 17) return null; const k = (x - 3) % 6; return k === 0 ? '#101018' : (y < 14 && (k === 2 || k === 4)) ? '#101018' : '#f4f0e8'; });
      P.paint(top, (x, y) => y === 7 ? '#5a5a70' : null);
      const st = P.mask(); P.mLine(st, 8, 18, 5, 33, 2); P.mLine(st, 56, 18, 59, 33, 2); P.mLine(st, 6, 26, 58, 26, 2); P.fill(st, '#7a7a88', { shade: false });
    } else P = new Pix(4, 4);
    return P.toCanvas();
  });
}
function bugCanvas(spec, pose = 'idle', instrument = null, expr = null) {
  const e = expr || EXPR_FOR_POSE[pose] || 'none';
  const key = 'bug|' + (spec.name || '') + JSON.stringify(spec) + '|' + pose + '|' + (instrument || '') + '|' + e;
  return cached(key, () => { const P = buildBug(spec, pose, e); if (instrument && instrument !== 'drums' && instrument !== 'piano') drawHeldInstrument(P, instrument, pose, spec); return P.toCanvas(); });
}
// opts: {pose, expr, flip, instrument, scale, alpha, squash}
function drawBugAt(ctx, spec, x, y, opts = {}) {
  const pose = opts.pose || 'idle', e = opts.expr || EXPR_FOR_POSE[pose] || 'none';
  let c = bugCanvas(spec, pose, opts.instrument, e);
  if (opts.flip) c = cached('flip|' + (spec.name || '') + JSON.stringify(spec) + '|' + pose + '|' + (opts.instrument || '') + '|' + e, () => flipCanvas(c));
  const base = opts.scale || 1;
  const s = base * (opts.pop != null ? opts.pop : 1);
  let sq = opts.squash || 1, dy = 0;
  // cartoon breathing / bounce. On by default for every bug in the game:
  // opts.t overrides the clock, opts.bounce scales it, opts.bounce = 0 turns it off.
  const amp = opts.bounce != null ? opts.bounce : 0.7;
  const clk = opts.t != null ? opts.t : ANIM_T;
  if (amp > 0) {
    const phase = opts.phase != null ? opts.phase : (x * 0.017 + y * 0.011);
    const ph = clk * (opts.rate || 2.1) * Math.PI * 2 + phase;
    const up = 0.5 + 0.5 * Math.sin(ph);
    dy = -up * 2.4 * amp * base;
    sq *= 1 - Math.sin(ph) * 0.04 * amp;
  }
  const w = BUG_W * s * (2 - sq), h = BUG_H * s * sq;
  if (opts.alpha != null) ctx.globalAlpha = opts.alpha;
  if (opts.tilt) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y + dy)); ctx.rotate(opts.tilt);
    ctx.drawImage(c, Math.round(-w / 2), Math.round(-h), Math.round(w), Math.round(h)); ctx.restore();
  } else ctx.drawImage(c, Math.round(x - w / 2), Math.round(y + dy - h), Math.round(w), Math.round(h));
  if (opts.alpha != null) ctx.globalAlpha = 1;
  return dy;
}
function drawShadow(ctx, x, y, w, alpha = 0.28) {
  ctx.fillStyle = 'rgba(0,0,0,' + alpha + ')';
  ctx.beginPath(); ctx.ellipse(Math.round(x), Math.round(y), Math.round(w / 2), Math.max(2, Math.round(w / 7)), 0, 0, Math.PI * 2); ctx.fill();
}
