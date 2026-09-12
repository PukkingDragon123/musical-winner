// ---------- Pixel art sprites ----------
'use strict';
const _spriteCache = new Map();

// rows: array of strings; palette: char -> color. '.' = transparent
function makeSprite(rows, palette, key) {
  if (key && _spriteCache.has(key)) return _spriteCache.get(key);
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x];
    if (ch === '.' || ch === ' ') continue;
    const col = palette[ch];
    if (!col) continue;
    ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
  }
  if (key) _spriteCache.set(key, c);
  return c;
}
function flipSprite(c, key) {
  if (key && _spriteCache.has(key)) return _spriteCache.get(key);
  const f = document.createElement('canvas');
  f.width = c.width; f.height = c.height;
  const ctx = f.getContext('2d');
  ctx.translate(c.width, 0); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0);
  if (key) _spriteCache.set(key, f);
  return f;
}

// ---- Bug body template (12x16). o outline, b body, s shell/shirt, e eye, h eye highlight, a antenna, m mouth
const BUG_BASE = {
  stand: [
    '.a........a.',
    '..a......a..',
    '...oooooo...',
    '..obbbbbbo..',
    '..oehbbeho..',
    '..obbbbbbo..',
    '...oobmoo...',
    '..oossssoo..',
    '.obssssssbo.',
    '.obssssssbo.',
    '..ossssssso.',
    '..oossssoo..',
    '...o....o...',
    '...o....o...',
    '..oo....oo..',
    '............',
  ],
  walk: [
    '.a........a.',
    '..a......a..',
    '...oooooo...',
    '..obbbbbbo..',
    '..oehbbeho..',
    '..obbbbbbo..',
    '...oobmoo...',
    '..oossssoo..',
    '.obssssssbo.',
    '.obssssssbo.',
    '..ossssssso.',
    '..oossssoo..',
    '..o......o..',
    '..o.....o...',
    '.oo....oo...',
    '............',
  ],
  // arms raised (performing / cheering)
  play: [
    '.a........a.',
    '..a......a..',
    '...oooooo...',
    '..obbbbbbo..',
    '..oehbbeho..',
    '..obbbbbbo..',
    '...oobmoo...',
    '.b.ossssso.b',
    '.obssssssbo.',
    '..ossssssso.',
    '..ossssssso.',
    '..oossssoo..',
    '...o....o...',
    '...o....o...',
    '..oo....oo..',
    '............',
  ],
};
const WINGS = {
  bee: ['..ww....ww..', '.wwww..wwww.', '.wwww..wwww.', '..ww....ww..'],
  moth: ['.wwww..wwww.', 'wwwwwwwwwwww', 'wwwwwwwwwwww', '.wwww..wwww.', '..ww....ww..'],
  butterfly: ['.wwww..wwww.', 'wwvwwwwwwvww', 'wwwwvwwvwwww', '.wwwwwwwwww.', '..wvw..wvw..', '...ww..ww...'],
};
const SPECIES = {
  beetle:      { name: 'Beetle',      b: '#4f8a46', s: '#2f4f9a', a: '#c9d3ff', decor: 'horn' },
  ant:         { name: 'Ant',         b: '#c2502f', s: '#8a2f1f', a: '#ffb08a' },
  ladybug:     { name: 'Ladybug',     b: '#2b2b2b', s: '#dc3c2f', a: '#555', decor: 'spots' },
  grasshopper: { name: 'Grasshopper', b: '#86c84f', s: '#4e8f2d', a: '#d6f0a0' },
  bee:         { name: 'Bee',         b: '#f2c53d', s: '#f2c53d', a: '#333', decor: 'stripes', wings: 'bee' },
  moth:        { name: 'Moth',        b: '#b3a28a', s: '#7d6b57', a: '#e6dccc', wings: 'moth' },
  mantis:      { name: 'Mantis',      b: '#7ad275', s: '#3f9a48', a: '#cbf5c0' },
  cricket:     { name: 'Cricket',     b: '#9a7443', s: '#5c4426', a: '#e0c090' },
  firefly:     { name: 'Firefly',     b: '#4a4a6a', s: '#2c2c44', a: '#ffe66d', decor: 'glow' },
  butterfly:   { name: 'Butterfly',   b: '#5d4b8f', s: '#7f5fbf', a: '#e0d0ff', wings: 'butterfly' },
  snail:       { name: 'Snail',       b: '#d1ab80', s: '#8d5c38', a: '#f5e2c8', decor: 'shell' },
  spider:      { name: 'Spider',      b: '#4a3350', s: '#2c1e33', a: '#c090d0', decor: 'legs' },
  roach:       { name: 'Roach',       b: '#7a4a2a', s: '#4a2a12', a: '#c08a60' },
  weevil:      { name: 'Weevil',      b: '#5a6a7a', s: '#34404c', a: '#a0b0c0' },
};
const SPECIES_KEYS = Object.keys(SPECIES);

function bugPalette(sp, override = {}) {
  const b = override.b || sp.b, s = override.s || sp.s;
  return {
    o: override.o || '#14101c', b, s, e: '#14101c', h: '#ffffff', a: override.a || sp.a, m: shade(b, -40),
    w: override.w || '#dfe9ff', v: override.v || '#ff7fbf',
  };
}
function bugSprite(speciesKey, pose = 'stand', override = {}) {
  const key = 'bug|' + speciesKey + '|' + pose + '|' + JSON.stringify(override);
  if (_spriteCache.has(key)) return _spriteCache.get(key);
  const sp = SPECIES[speciesKey] || SPECIES.beetle;
  const pal = bugPalette(sp, override);
  const c = document.createElement('canvas');
  c.width = 16; c.height = 18;
  const ctx = c.getContext('2d');
  // wings behind
  if (sp.wings) {
    const wpal = { w: pal.w, v: pal.v };
    const ws = makeSprite(WINGS[sp.wings], wpal);
    ctx.globalAlpha = 0.85;
    ctx.drawImage(ws, 2, 8);
    ctx.globalAlpha = 1;
  }
  const body = makeSprite(BUG_BASE[pose] || BUG_BASE.stand, pal);
  ctx.drawImage(body, 2, 2);
  // decor
  ctx.fillStyle = '#14101c';
  if (sp.decor === 'spots') {
    [[6, 10], [9, 10], [7, 12], [10, 12], [5, 12]].forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
  } else if (sp.decor === 'stripes') {
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(5, 10, 6, 1); ctx.fillRect(5, 12, 6, 1);
  } else if (sp.decor === 'horn') {
    ctx.fillStyle = pal.o; ctx.fillRect(7, 2, 2, 2); ctx.fillStyle = shade(pal.b, 30); ctx.fillRect(7, 3, 2, 1);
  } else if (sp.decor === 'glow') {
    ctx.fillStyle = '#ffe66d'; ctx.fillRect(6, 12, 4, 1); ctx.fillStyle = '#fff6b0'; ctx.fillRect(7, 12, 2, 1);
  } else if (sp.decor === 'shell') {
    ctx.fillStyle = pal.o; ctx.fillRect(10, 8, 5, 5);
    ctx.fillStyle = '#b06a3a'; ctx.fillRect(11, 9, 3, 3);
    ctx.fillStyle = '#e0a070'; ctx.fillRect(12, 10, 1, 1); ctx.fillRect(11, 9, 1, 1);
  } else if (sp.decor === 'legs') {
    ctx.fillStyle = pal.o;
    ctx.fillRect(1, 11, 2, 1); ctx.fillRect(0, 12, 1, 2); ctx.fillRect(13, 11, 2, 1); ctx.fillRect(15, 12, 1, 2);
    ctx.fillRect(1, 9, 1, 1); ctx.fillRect(14, 9, 1, 1);
  }
  _spriteCache.set(key, c);
  return c;
}

// ---- Hats for pedestrians (drawn at head top)
const HATS = {
  cap: { rows: ['.rrrrrr.', 'rrrrrrrrr'], pal: { r: '#c04040' } },
  top: { rows: ['..kkkk..', '..kkkk..', 'kkkkkkkk'], pal: { k: '#202028' } },
  beanie: { rows: ['..gg....', '.gggggg.', 'gggggggg'], pal: { g: '#3a7ac0' } },
  flower: { rows: ['..pp....', '.pypp...', '..pp....'], pal: { p: '#ff70b0', y: '#ffe060' } },
};

// ---- Instruments (held). Anchor at bug's hands (~x+3,y+9)
const INSTR_SPRITES = {
  guitar: { rows: [
    '..........nn',
    '.........nn.',
    '........nn..',
    '.......nn...',
    '..wwww.n....',
    '.wwwwwwn....',
    'wwwhwwww....',
    '.wwwwww.....',
    '..wwww......',
  ], pal: { n: '#5a3a1e', w: '#d98c3a', h: '#2a1a0a' } },
  bass: { rows: [
    '...........nn',
    '..........nn.',
    '.........nn..',
    '........nn...',
    '.......nn....',
    '..wwww.n.....',
    '.wwwwwwn.....',
    'wwwhwwww.....',
    '.wwwwww......',
    '..wwww.......',
  ], pal: { n: '#3a2a3a', w: '#8a3a5a', h: '#2a1a0a' } },
  drums: { rows: [
    '.ccc......ccc..',
    '.ddd......ddd..',
    '..d........d...',
    '....rrrrrrr....',
    '...rwwwwwwwr...',
    '...rrrrrrrrr...',
    '...rrrrrrrrr...',
    '...rrrrrrrrr...',
    '....rrrrrrr....',
    '..d.........d..',
    '.d...........d.',
  ], pal: { c: '#e0c060', d: '#888', r: '#c03a3a', w: '#f0e8d8' } },
  sax: { rows: [
    '..gg.',
    '...g.',
    '...g.',
    '...g.',
    '...gg',
    '...gg',
    '.gggg',
    'ggggg',
    'gggg.',
  ], pal: { g: '#e0b040' } },
  trumpet: { rows: [
    '.........gg',
    'gggggggggg.',
    '..gg.gg..g.',
    '.........gg',
    '........ggg',
  ], pal: { g: '#f0c040' } },
  violin: { rows: [
    '.........n',
    '........n.',
    '.......n..',
    '..vv..n...',
    '.vvvvvn...',
    '.vvvvvv...',
    '..vvvv....',
    '.vvvvvv...',
    '..vvvv....',
  ], pal: { n: '#4a2a10', v: '#b05a2a' } },
  piano: { rows: [
    'kkkkkkkkkkkkkkkkkk',
    'kwwkwwwkwwkwwwkwwk',
    'kwbkwbwkwbkwbwkwbk',
    'kwwkwwwkwwkwwwkwwk',
    'kkkkkkkkkkkkkkkkkk',
    '.g..............g.',
    '.g..............g.',
  ], pal: { k: '#2a2a3a', w: '#f4f0e8', b: '#101018', g: '#777' } },
  tambourine: { rows: [
    '.tttt.',
    'tjjjjt',
    'tjjjjt',
    'tjjjjt',
    '.tttt.',
  ], pal: { t: '#c08a3a', j: '#e8d8b0' } },
};
function instrumentSprite(kind) {
  const d = INSTR_SPRITES[kind] || INSTR_SPRITES.tambourine;
  return makeSprite(d.rows, d.pal, 'instr|' + kind);
}

// ---- Props
const PROPS = {
  hat: { rows: [
    '..hhhhhh..',
    '.hhhhhhhh.',
    '.hhhhhhhh.',
    'hhhhhhhhhh',
    '.hhhhhhhh.',
  ], pal: { h: '#3a2a4a' } },
  coin: { rows: ['.gg.', 'gygg', 'ggyg', '.gg.'], pal: { g: '#f0c040', y: '#fff0a0' } },
  bill: { rows: ['ggggg', 'gwgwg', 'ggggg'], pal: { g: '#5ab060', w: '#c8f0c0' } },
  heart: { rows: ['.p.p.', 'ppppp', 'ppppp', '.ppp.', '..p..'], pal: { p: '#ff5a7a' } },
  note: { rows: ['..nn', '..n.', '..n.', 'nnn.', 'nnn.'], pal: { n: '#ffffff' } },
  lamp: { rows: ['.yyy.', 'yyyyy', '.ppp.', '..p..', '..p..', '..p..', '..p..', '..p..', '..p..', '..p..', '..p..', '.ppp.'], pal: { y: '#ffe680', p: '#3a3a4a' } },
  trash: { rows: ['tttttt', '.gggg.', '.gggg.', '.gggg.', '.gggg.', '.gggg.'], pal: { t: '#666', g: '#3a6a3a' } },
  bench: { rows: ['wwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwww', '.m............m.', 'wwwwwwwwwwwwwwww', '.m............m.', '.m............m.'], pal: { w: '#8a5a3a', m: '#333' } },
  tree: { rows: [
    '....gggg....', '..gggggggg..', '.gggghggggg.', 'gggggggggggg', 'ggghgggggggg', '.gggggggggg.', '..gggggggg..', '....tttt....', '....tttt....', '....tttt....',
  ], pal: { g: '#3f8a3f', h: '#6ab04a', t: '#6a4a2a' } },
  hydrant: { rows: ['.rr.', 'rrrr', '.rr.', 'rrrr', '.rr.', '.rr.'], pal: { r: '#c83a3a' } },
  sign: { rows: ['bbbbbbbb', 'bwwwwwwb', 'bwbwwbwb', 'bwwwwwwb', 'bbbbbbbb', '...pp...', '...pp...', '...pp...'], pal: { b: '#2a5ab0', w: '#e8f0ff', p: '#555' } },
  lantern: { rows: ['..y..', '.rrr.', 'rrrrr', 'rrrrr', '.rrr.', '..y..'], pal: { r: '#d83030', y: '#f0c040' } },
  seal: { rows: ['..sss.....', '.sssssss..', 'sssssssss.', 'sssssssss.', '.sss..sss.'], pal: { s: '#6a6a7a' } },
  pigeon: { rows: ['.gg.', 'gggg', '.gg.', '.oo.'], pal: { g: '#8a8a9a', o: '#e0a040' } },
  mic: { rows: ['.mmm.', 'mmmmm', '.mmm.', '..s..', '..s..', '..s..', '.sss.'], pal: { m: '#777', s: '#333' } },
};
function propSprite(kind) {
  const d = PROPS[kind];
  return makeSprite(d.rows, d.pal, 'prop|' + kind);
}

// ---- Icons (8x8) for map nodes & items
const ICONS = {
  gig:      { rows: ['...nn...', '...n.n..', '...n....', '...n....', '.nnn....', 'nnnn....', 'nnnn....', '.nn.....'], pal: { n: '#ffffff' } },
  elite:    { rows: ['...y....', '..yyy...', 'yyyyyyy.', '.yyyyy..', '..yyy...', '.yy.yy..', 'yy...yy.', '........'], pal: { y: '#ffd040' } },
  boss:     { rows: ['y..y..y.', 'yy.y.yy.', 'yyyyyyy.', 'yyyyyyy.', 'yyyyyyy.', '.yyyyy..', '.rrrrr..', '........'], pal: { y: '#ffd040', r: '#d04040' } },
  shop:     { rows: ['..gggg..', '.g....g.', 'bbbbbbbb', 'byyyyyyb', 'byyyyyyb', 'byyyyyyb', 'bbbbbbbb', '........'], pal: { g: '#ccc', b: '#c07030', y: '#f0d090' } },
  event:    { rows: ['..wwww..', '.ww..ww.', '.....ww.', '....ww..', '...ww...', '...ww...', '........', '...ww...'], pal: { w: '#80d0ff' } },
  rest:     { rows: ['........', '..bbbb..', '.bbbbbb.', 'wwwwwwww', 'wwwwwwww', 'p......p', 'p......p', '........'], pal: { b: '#d05070', w: '#e8e8f0', p: '#a08060' } },
  treasure: { rows: ['.bbbbbb.', 'bbbbbbbb', 'bbbyybbb', 'yyyyyyyy', 'bbbyybbb', 'bbbbbbbb', '.bbbbbb.', '........'], pal: { b: '#b07030', y: '#ffd040' } },
  openmic:  { rows: ['..mmm...', '.mmmmm..', '.mmmmm..', '..mmm...', '...s....', '...s....', '..sss...', '........'], pal: { m: '#ccc', s: '#666' } },
  // items
  coffee:   { rows: ['.s.s....', 's.s.....', 'wwwwww..', 'wbbbbwww', 'wbbbbw.w', 'wbbbbwww', '.wwww...', '........'], pal: { s: '#ccc', w: '#eee', b: '#6a3a1a' } },
  bar:      { rows: ['........', '.rrrrrr.', 'rbbbbbbr', 'rbybbybr', 'rbbbbbbr', '.rrrrrr.', '........', '........'], pal: { r: '#d04040', b: '#a0703a', y: '#ffd040' } },
  bread:    { rows: ['........', '..bbbb..', '.bbbbbb.', 'bbbyybbb', 'bbbbbbbb', '.bbbbbb.', '........', '........'], pal: { b: '#d8a050', y: '#f0d090' } },
  jar:      { rows: ['.gggggg.', '..wwww..', '.wwwwww.', '.wyyyyw.', '.wyyyyw.', '.wyyyyw.', '.wwwwww.', '........'], pal: { g: '#888', w: '#c0e0f0', y: '#f0c040' } },
  amp:      { rows: ['kkkkkkkk', 'kggggggk', 'kkkkkkkk', 'kbbbbbbk', 'kbkkkkbk', 'kbbbbbbk', 'kkkkkkkk', '........'], pal: { k: '#222', g: '#888', b: '#444' } },
  pick:     { rows: ['........', '.pppppp.', 'pppppppp', 'pppppppp', '.pppppp.', '..pppp..', '...pp...', '........'], pal: { p: '#f050a0' } },
  metronome:{ rows: ['...bb...', '..bbbb..', '..bwwb..', '.bbwbbb.', '.bwbbbb.', 'bbbbbbbb', 'bbbbbbbb', '........'], pal: { b: '#a06030', w: '#eee' } },
  permit:   { rows: ['wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbwbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.', '........'], pal: { w: '#eee', b: '#4060c0' } },
  jacket:   { rows: ['.y....y.', 'yyyyyyyy', 'yyyyyyyy', 'yy.yy.yy', '.yyyyyy.', '.yyyyyy.', '.yyyyyy.', '........'], pal: { y: '#e0c020' } },
  kazoo:    { rows: ['........', '........', 'gggggggg', 'gyyyyyyg', 'gggggggg', '...gg...', '........', '........'], pal: { g: '#e0b030', y: '#fff0a0' } },
  pass:     { rows: ['........', 'rrrrrrrr', 'rwwwwwwr', 'rwrrwwwr', 'rwwwwwwr', 'rrrrrrrr', '........', '........'], pal: { r: '#d03030', w: '#fff' } },
  cred:     { rows: ['...y....', '..yyy...', '.yyyyy..', 'yyyyyyy.', '.yyyyy..', '.yy.yy..', 'y.....y.', '........'], pal: { y: '#ff80c0' } },
  case:     { rows: ['..kkkk..', '.k....k.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', '........'], pal: { k: '#5a3a2a' } },
  shades:   { rows: ['........', 'kkkkkkkk', 'kkk..kkk', 'kkk..kkk', '.kk..kk.', '........', '........', '........'], pal: { k: '#222' } },
  earplugs: { rows: ['........', '.oo..oo.', 'oooooooo', 'oooooooo', '.oo..oo.', '........', '........', '........'], pal: { o: '#f0a040' } },
  strings:  { rows: ['s.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', '........'], pal: { s: '#ccc' } },
  flyer:    { rows: ['wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.', '........'], pal: { w: '#ffe0a0', b: '#c04040' } },
  medal:    { rows: ['..rr..r.', '..rr.r..', '..rrr...', '..yyy...', '.yyyyy..', '.yyyyy..', '..yyy...', '........'], pal: { r: '#d03030', y: '#ffd040' } },
  money:    { rows: ['........', 'gggggggg', 'gwgwwgwg', 'gwgwwgwg', 'gwgwwgwg', 'gggggggg', '........', '........'], pal: { g: '#5ab060', w: '#c8f0c0' } },
  food:     { rows: ['..ww....', '.wwww...', 'wwwwww..', 'bbbbbb..', '.bbbb...', '..bb....', '........', '........'], pal: { w: '#f0f0e0', b: '#c08040' } },
  cop:      { rows: ['..bbbb..', '.bbbbbb.', 'bbbbbbbb', '..yyyy..', '.yeyyey.', '.yyyyyy.', '..bbbb..', '........'], pal: { b: '#2a3a8a', y: '#e0c090', e: '#000' } },
  rain:     { rows: ['..cccc..', '.cccccc.', 'cccccccc', '........', '.b..b..b', 'b..b..b.', '.b..b..b', '........'], pal: { c: '#aaa', b: '#60a0ff' } },
};
function iconSprite(kind) {
  const d = ICONS[kind] || ICONS.event;
  return makeSprite(d.rows, d.pal, 'icon|' + kind);
}

// Draw a bug character with optional instrument
// opts: {pose, override, flip, hat, instrument, scale}
function drawBug(ctx, speciesKey, x, y, opts = {}) {
  const pose = opts.pose || 'stand';
  let spr = bugSprite(speciesKey, pose, opts.override || {});
  if (opts.flip) spr = flipSprite(spr, 'bugflip|' + speciesKey + '|' + pose + '|' + JSON.stringify(opts.override || {}));
  const sc = opts.scale || 1;
  ctx.drawImage(spr, Math.round(x), Math.round(y), 16 * sc, 18 * sc);
  if (opts.hat && HATS[opts.hat]) {
    const h = HATS[opts.hat];
    const hs = makeSprite(h.rows, h.pal, 'hat|' + opts.hat);
    ctx.drawImage(hs, Math.round(x + 4 * sc), Math.round(y + (4 - h.rows.length) * sc), hs.width * sc, hs.height * sc);
  }
  if (opts.instrument) {
    const is = instrumentSprite(opts.instrument);
    let ox = 2, oy = 9;
    if (opts.instrument === 'drums') { ox = 0; oy = 8; }
    if (opts.instrument === 'piano') { ox = -1; oy = 10; }
    if (opts.instrument === 'sax') { ox = 8; oy = 6; }
    if (opts.instrument === 'trumpet') { ox = 6; oy = 6; }
    if (opts.instrument === 'violin') { ox = 4; oy = 4; }
    if (opts.instrument === 'tambourine') { ox = 10; oy = 8; }
    ctx.drawImage(is, Math.round(x + ox * sc), Math.round(y + oy * sc), is.width * sc, is.height * sc);
  }
}
