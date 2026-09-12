// ---------- Game core: loop, input, run state, save ----------
'use strict';
const SAVE_KEY = 'bugbusker_v2_save';
const CHARM_SLOTS_BASE = 5;

class Member {
  constructor(o) { Object.assign(this, { name: 'Bug', presetKey: null, spec: null, instrument: 'guitar', quality: 1, skill: 1, stamina: 100, hunger: 0, xp: 0, leader: false, gigs: 0 }, o); if (!this.spec) this.spec = randomBugSpec(makeRng(hashStr(this.name))); }
}
class RunState {
  constructor(seed) {
    this.seed = seed; this.rng = makeRng(seed);
    this.money = 6; this.day = 0; this.members = []; this.charms = []; this.charmSlots = CHARM_SLOTS_BASE; this.vouchers = []; this.perks = {}; this.consumables = []; this.spareInstruments = [];
    this.buffs = {}; this.karma = 0; this.pendingGig = null; this.stats = { earned: 0, gigs: 0, bestCombo: 0, perfects: 0, bestPayout: 0 };
    this.pos = 'mission'; this.tickets = 7; this.weather = 'clear'; this.doneNodes = {}; this.hero = 'buzz'; this.nightPending = false; this.seenEvents = []; this.log = [];
  }
  static newRun(char) {
    const s = new RunState((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    const c = char || ROSTER[0], p = HERO_PRESETS[c.key];
    s.hero = c.key;
    s.members.push(new Member({ name: p.name, presetKey: c.key, spec: p, instrument: c.instrument, quality: 1, skill: 2 + c.stats[0], leader: true }));
    s.money = c.money; if (c.charm) s.addCharm(c.charm);
    s.stats.charSkill = c.stats;
    s.consumables.push('bread');
    s.pos = 'mission'; s.tickets = 7; s.weather = 'clear'; s.doneNodes = {};
    return s;
  }
  newDay() {
    const bonus = collectMods(this).tickets || 0;
    this.tickets = 7 + bonus; this.doneNodes = {};
    this.weather = this.day === 0 ? 'clear' : this.rng.pick(WEATHER_KEYS);
  }
  hasCharm(k) { return this.charms.includes(k); }
  addCharm(k) { if (this.charms.includes(k) || this.charms.length >= this.charmSlots) return false; this.charms.push(k); return true; }
  removeCharm(k) { const i = this.charms.indexOf(k); if (i >= 0) this.charms.splice(i, 1); }
  randomCharm(exclude = []) {
    const pool = CHARM_KEYS.filter(k => !this.charms.includes(k) && !exclude.includes(k)); if (!pool.length) return null;
    const weights = pool.map(k => RARITY_WEIGHT[CHARMS[k].rarity] || 1); let tot = weights.reduce((a, b) => a + b, 0), r = this.rng() * tot;
    for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) return pool[i]; } return pool[pool.length - 1];
  }
  makeMember(instrs) {
    const usedNames = this.members.map(m => m.name); const name = this.rng.pick(FIRST_NAMES.filter(n => !usedNames.includes(n)) || FIRST_NAMES);
    const spec = randomBugSpec(this.rng); spec.name = name; spec.species = ['Beetle', 'Weevil', 'Cricket', 'Moth', 'Hopper', 'Ant', 'Aphid'][this.rng.int(0, 6)];
    return new Member({ name, spec, instrument: this.rng.pick(instrs || PLAYABLE), quality: this.rng.int(1, 2), skill: this.rng.int(1, 3 + this.day), stamina: this.rng.int(60, 100) });
  }
  recruitRandom(instrs) { const m = this.makeMember(instrs); this.members.push(m); return m; }
  recruitPreset(key, instrument, skill) { const p = HERO_PRESETS[key]; const m = new Member({ name: p.name, presetKey: key, spec: p, instrument, quality: 2, skill: skill || 4 }); this.members.push(m); return m; }
  mealPrice() { return Math.max(3, 7 + this.day * 3 - (this.perks.mealDiscount || 0)); }
  avgSkill() { return this.members.reduce((a, m) => a + m.skill, 0) / Math.max(1, this.members.length); }
  gigMods(performers, difficulty, bossMod) {
    const avgSt = performers.reduce((a, m) => a + m.stamina, 0) / performers.length, hungerPen = performers.reduce((a, m) => a + m.hunger, 0) / performers.length;
    const m = collectMods(this, { difficulty, bossMod });
    m.windowMult *= (0.78 + 0.22 * (avgSt / 100)) * (1 - 0.08 * hungerPen);
    return m;
  }
  save() {
    try {
      const data = { seed: this.seed, money: this.money, day: this.day, members: this.members, charms: this.charms, charmSlots: this.charmSlots, vouchers: this.vouchers, perks: this.perks, consumables: this.consumables, spareInstruments: this.spareInstruments, karma: this.karma, stats: this.stats, buffs: this.buffs, pendingGig: this.pendingGig, seenEvents: this.seenEvents, nightPending: this.nightPending, pos: this.pos, tickets: this.tickets, weather: this.weather, doneNodes: this.doneNodes, hero: this.hero, lastTune: this.lastTune };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { }
  }
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null; const d = JSON.parse(raw); const s = new RunState(d.seed);
      Object.assign(s, { money: d.money, day: d.day, charms: d.charms, charmSlots: d.charmSlots || CHARM_SLOTS_BASE, vouchers: d.vouchers || [], perks: d.perks || {}, consumables: d.consumables, spareInstruments: d.spareInstruments || [], karma: d.karma, stats: d.stats, buffs: d.buffs || {}, pendingGig: d.pendingGig, seenEvents: d.seenEvents || [], nightPending: d.nightPending, pos: d.pos || 'mission', tickets: d.tickets != null ? d.tickets : 7, weather: d.weather || 'clear', doneNodes: d.doneNodes || {}, hero: d.hero || 'buzz', lastTune: d.lastTune });
      s.members = d.members.map(m => new Member(m));
      return s;
    } catch (e) { return null; }
  }
  static hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
}

// Menu helper: items [{label, right, icon, disabled, desc, onSelect}] ; style 'buttons' | 'list'
class Menu {
  constructor(items, opts = {}) { this.items = items; this.idx = 0; this.opts = opts; this.rects = []; this.fixIdx(1); }
  fixIdx(dir) { let n = 0; while (this.items[this.idx] && this.items[this.idx].disabled && n++ < this.items.length) this.idx = (this.idx + dir + this.items.length) % this.items.length; }
  move(d) { if (!this.items.length) return; this.idx = (this.idx + d + this.items.length) % this.items.length; this.fixIdx(d); Audio.ui('move'); }
  key(code) {
    if (code === 'ArrowUp' || code === 'KeyW') { this.move(-1); return true; } if (code === 'ArrowDown' || code === 'KeyS') { this.move(1); return true; }
    if (code === 'Enter' || code === 'Space' || code === 'KeyZ') { this.select(); return true; } return false;
  }
  get current() { return this.items[this.idx]; }
  select() { const it = this.items[this.idx]; if (!it || it.disabled) { Audio.ui('error'); return; } Audio.ui('select'); it.onSelect && it.onSelect(it); }
  click(x, y) { const pad = Game.touch ? 3 : 0; for (let i = 0; i < this.rects.length; i++) { const r = this.rects[i]; if (r && x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad) { this.idx = i; this.select(); return true; } } return false; }
  hover(x, y) { for (let i = 0; i < this.rects.length; i++) { const r = this.rects[i]; if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h && !this.items[i].disabled) { this.idx = i; return; } } }
  draw(ctx, x, y, w, rowH, style = 'list') {
    this.rects = [];
    this.items.forEach((it, i) => {
      const yy = y + i * rowH, sel = i === this.idx; this.rects.push({ x, y: yy, w, h: rowH - 2 });
      if (style === 'buttons') { uiButton(ctx, x, yy, w, rowH - 3, it.label, it.disabled ? 'disabled' : sel ? 'hover' : 'normal', it.color ? { color: it.color, hi: lighten(it.color, 0.2), lo: darken(it.color, 0.2), ol: darken(it.color, 0.45) } : {}); return; }
      if (sel) { rect(ctx, x, yy, w, rowH - 2, it.disabled ? 'rgba(90,58,30,0.15)' : UI.paperLo); frame(ctx, x, yy, w, rowH - 2, it.disabled ? UI.paperLine : UI.wood); }
      const col = it.disabled ? UI.inkFaint : UI.ink; let tx = x + 6;
      if (it.icon) { const ic = typeof it.icon === 'string' ? icon(it.icon) : it.icon; ctx.drawImage(ic, x + 4, yy + Math.floor((rowH - 2 - ic.height) / 2)); tx = x + 20; }
      drawText(ctx, (sel ? '> ' : '') + it.label, tx, yy + Math.floor((rowH - 2 - 7) / 2), col);
      if (it.right) drawText(ctx, it.right, x + w - 6, yy + Math.floor((rowH - 2 - 7) / 2), it.disabled ? UI.inkFaint : (it.rightColor || '#7a4a10'), { align: 'right' });
    });
    return y + this.items.length * rowH;
  }
}

const Game = {
  canvas: null, ctx: null, scene: null, run: null, last: 0, mouse: { x: 0, y: 0 }, scale: 1, time: 0, muted: false, keys: new Set(), pointers: new Map(), touch: false, rotated: false, rotateOverride: null, wind: null,
  init() {
    this.canvas = document.getElementById('game'); this.ctx = this.canvas.getContext('2d'); this.ctx.imageSmoothingEnabled = false;
    this.touch = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    this.wind = new Wind(); this.shake = new Shake();
    window.addEventListener('resize', () => this.resize()); if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => setTimeout(() => this.resize(), 120)); this.resize();
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault(); if (e.repeat) return; Audio.init();
      if (e.code === 'KeyM' && !(this.scene && this.scene.isPlaying && this.scene.isPlaying())) { this.muted = !this.muted; Audio.setMuted(this.muted); return; }
      this.keys.add(e.code); if (this.scene && this.scene.key) this.scene.key(e.code, e);
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); if (this.scene && this.scene.keyUp) this.scene.keyUp(e.code); });
    const c = this.canvas; c.style.touchAction = 'none'; c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); if (e.pointerType === 'touch' || e.pointerType === 'pen') this.touch = true; Audio.init(); try { c.setPointerCapture(e.pointerId); } catch (err) { } const p = this.toCanvas(e); this.pointers.set(e.pointerId, p); this.mouse = p; if (this.scene && this.scene.pointerDown) this.scene.pointerDown(p.x, p.y, e.pointerId); else if (this.scene && this.scene.click) this.scene.click(p.x, p.y); });
    c.addEventListener('pointermove', (e) => { const p = this.toCanvas(e); this.mouse = p; if (this.pointers.has(e.pointerId)) { this.pointers.set(e.pointerId, p); if (this.scene && this.scene.pointerMove) this.scene.pointerMove(p.x, p.y, e.pointerId); } else if (e.pointerType === 'mouse' && this.scene && this.scene.hover) this.scene.hover(p.x, p.y); });
    const release = (e) => { if (!this.pointers.has(e.pointerId)) return; const p = this.toCanvas(e); this.pointers.delete(e.pointerId); if (this.scene && this.scene.pointerUp) this.scene.pointerUp(p.x, p.y, e.pointerId); };
    c.addEventListener('pointerup', release); c.addEventListener('pointercancel', release);
    window.addEventListener('blur', () => { this.keys.clear(); for (const id of Array.from(this.pointers.keys())) if (this.scene && this.scene.pointerUp) this.scene.pointerUp(-1, -1, id); this.pointers.clear(); });
    this.setScene(new TitleScene()); requestAnimationFrame((t) => this.frame(t));
  },
  toCanvas(e) { const r = this.canvas.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = e.clientX - cx, dy = e.clientY - cy, s = this.scale || 1; return this.rotated ? { x: W / 2 + dy / s, y: H / 2 - dx / s } : { x: W / 2 + dx / s, y: H / 2 + dy / s }; },
  resize() {
    const vw = window.innerWidth, vh = window.innerHeight; const rotate = this.rotateOverride != null ? this.rotateOverride : (vh > vw * 1.05 && vw < 700); this.rotated = rotate;
    const availW = rotate ? vh : vw, availH = rotate ? vw : vh - (this.touch ? 0 : 22); const raw = Math.min(availW / W, availH / H);
    const s = raw >= 2 ? Math.floor(raw) : Math.max(0.25, Math.floor(raw * 8) / 8); this.scale = s;
    const st = this.canvas.style; st.width = (W * s) + 'px'; st.height = (H * s) + 'px'; st.position = 'fixed'; st.left = Math.round((vw - W * s) / 2) + 'px'; st.top = Math.round((vh - H * s) / 2) + 'px'; st.transform = rotate ? 'rotate(90deg)' : 'none';
    const hint = document.getElementById('hint'); if (hint) hint.style.display = (rotate || this.touch || vh - H * s < 30) ? 'none' : 'block';
  },
  setScene(s) { this.scene = s; if (s.enter) s.enter(); },
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0.016); this.last = t; this.time += dt; this.wind.update(dt); this.shake.update(dt);
    if (this.scene) {
      try { this.scene.update(dt); this.ctx.save(); if (this.shake.x || this.shake.y) this.ctx.translate(this.shake.x, this.shake.y); this.scene.draw(this.ctx); this.ctx.restore(); }
      catch (e) { console.error(e); this.lastError = String(e && e.message || e); this.ctx.restore(); }
    }
    if (this.lastError) drawText(this.ctx, 'ERR: ' + this.lastError.slice(0, 90), 2, H - 8, '#ff5a5a', { font: 'small' });
    if (this.muted) drawText(this.ctx, 'MUTED', W - 4, H - 8, '#aaa', { align: 'right', font: 'small' });
    requestAnimationFrame((tt) => this.frame(tt));
  },
  // Top HUD strip in parchment style
  drawHud(ctx, opts = {}) {
    const r = this.run; if (!r) return;
    rect(ctx, 0, 0, W, 18, UI.woodLo); ctx.fillStyle = paperTexture(); ctx.fillRect(0, 1, W, 15); rect(ctx, 0, 16, W, 1, UI.wood); rect(ctx, 0, 17, W, 1, UI.woodHi);
    ctx.drawImage(icon('coin'), 6, 5); drawText(ctx, fmtMoney(r.money), 18, 5, '#7a4a10');
    ctx.drawImage(icon('phone'), 78, 5); drawText(ctx, String(r.tickets), 90, 5, r.tickets > 0 ? '#2a5ab0' : '#b02a2a');
    drawText(ctx, 'DAY ' + Math.min(5, r.day + 1) + '/5', W / 2, 5, UI.ink, { align: 'center' });
    // charms mini icons
    let cx = W - 6; for (let i = r.charms.length - 1; i >= 0; i--) { const ck = r.charms[i]; cx -= 12; uiSlotMini(ctx, cx, 3); ctx.drawImage(icon(CHARMS[ck].icon), cx + 2, 5); }
    for (let i = r.charms.length; i < r.charmSlots; i++) { cx -= 12; uiSlotMini(ctx, cx, 3, true); }
    drawText(ctx, r.members.length + ' BUG' + (r.members.length > 1 ? 'S' : ''), cx - 8, 5, UI.ink, { align: 'right' });
  },
  afterNode() { this.run.save(); this.setScene(new CityScene()); },
};
function uiSlotMini(ctx, x, y, empty) { rect(ctx, x, y, 11, 11, UI.goldOl); rect(ctx, x + 1, y + 1, 9, 9, empty ? '#5a4a38' : UI.gold); rect(ctx, x + 2, y + 2, 7, 7, empty ? '#4a3a2a' : UI.slot); }
// Charm icon fallbacks: any icon name not in ICON_DEFS maps to a themed generated glyph
(function () {
  const extra = {
    jacket: { rows: ['.k....k.', 'kkkkkkkk', 'kkkkkkkk', 'kk.kk.kk', '.kkkkkk.', '.kkkkkk.', '.kkkkkk.'], pal: { k: '#5a3a2a' } },
    jar: { rows: ['.gggggg.', '..wwww..', '.wwwwww.', '.wyyyyw.', '.wyyyyw.', '.wyyyyw.', '.wwwwww.'], pal: { g: '#888', w: '#c0e0f0', y: '#f0c040' } },
    chalk: { rows: ['........', '..pppp..', '.pbbbbp.', 'pyyyyyyp', 'pggggggp', '.pppppp.', '........'], pal: { p: '#f0f0f0', b: '#5bc0ff', y: '#ffd166', g: '#6be585' } },
    pick: { rows: ['.pppppp.', 'pppppppp', 'pppppppp', '.pppppp.', '..pppp..', '...pp...', '........'], pal: { p: '#f050a0' } },
    sticks: { rows: ['w......w', '.w....w.', '..w..w..', '...ww...', '..w..w..', '.w....w.', 'w......w'], pal: { w: '#e0c090' } },
    reed: { rows: ['..bbbb..', '..bbbb..', '..bbbb..', '.bbbbbb.', '.bbbbbb.', '.bbbbbb.', '..bbbb..'], pal: { b: '#c8a060' } },
    oil: { rows: ['...ww...', '..wwww..', '..wwww..', '.wwwwww.', '.wyyyyw.', '.wyyyyw.', '.wwwwww.'], pal: { w: '#d0d0d8', y: '#e0b040' } },
    rosin: { rows: ['........', '.aaaaaa.', 'aaaaaaaa', 'aaaaaaaa', 'aaaaaaaa', '.aaaaaa.', '........'], pal: { a: '#d8a040' } },
    sheet: { rows: ['wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbwbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.'], pal: { w: '#f4efe0', b: '#3a3040' } },
    metronome: { rows: ['...bb...', '..bbbb..', '..bwwb..', '.bbwbbb.', '.bwbbbb.', 'bbbbbbbb', 'bbbbbbbb'], pal: { b: '#a06030', w: '#eee' } },
    earplugs: { rows: ['........', '.oo..oo.', 'oooooooo', 'oooooooo', '.oo..oo.', '........', '........'], pal: { o: '#f0a040' } },
    strings: { rows: ['s.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.', 's.s.s.s.'], pal: { s: '#ffd24a' } },
    net: { rows: ['b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '.b.b.b.b', 'b.b.b.b.', '.b.b.b.b', 'b.b.b.b.'], pal: { b: '#6fb8ff' } },
    hat: { rows: ['..kkkk..', '..kkkk..', '..kkkk..', 'kkkkkkkk', 'kkkkkkkk', '........', '........'], pal: { k: '#3a2a4a' } },
    balloon: { rows: ['..rrrr..', '.rrrrrr.', '.rrwrrr.', '.rrrrrr.', '..rrrr..', '...rr...', '...k....'], pal: { r: '#ff5a7a', w: '#fff', k: '#555' } },
    amp: { rows: ['kkkkkkkk', 'kggggggk', 'kkkkkkkk', 'kbbbbbbk', 'kbkkkkbk', 'kbbbbbbk', 'kkkkkkkk'], pal: { k: '#222', g: '#888', b: '#444' } },
    dive: { rows: ['...y....', '..yyy...', 'yyyyyyy.', '..yyy...', '.y...y..', 'y.....y.', '........'], pal: { y: '#ffb340' } },
    encore: { rows: ['ppppppp.', 'p.....p.', 'p.ppp.p.', 'p.ppp.p.', 'p.....p.', 'ppppppp.', '...p....'], pal: { p: '#c58bff' } },
    drum: { rows: ['.rrrrrr.', 'rwwwwwwr', 'rrrrrrrr', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrr.', '........'], pal: { r: '#c03a3a', w: '#f0e8d8' } },
    horn: { rows: ['.......g', 'gggggggg', '..g.g..g', '.......g', '......gg', '........', '........'], pal: { g: '#f0c040' } },
    violin: { rows: ['......n.', '.....n..', '..vv.n..', '.vvvvn..', '.vvvvv..', '..vvv...', '.vvvvv..'], pal: { n: '#4a2a10', v: '#b05a2a' } },
    shirt: { rows: ['.t....t.', 'tttttttt', 'tttttttt', '.tttttt.', '.tttttt.', '.tttttt.', '........'], pal: { t: '#4d86c6' } },
    kazoo: { rows: ['........', 'gggggggg', 'gyyyyyyg', 'gggggggg', '...gg...', '........', '........'], pal: { g: '#e0b030', y: '#fff0a0' } },
    boots: { rows: ['..kk....', '..kk....', '..kk....', '..kkk...', '..kkkk..', 'kkkkkkk.', 'kkkkkkk.'], pal: { k: '#2a2028' } },
    beret: { rows: ['....k...', '..kkkkk.', '.kkkkkkk', 'kkkkkkkk', '.kkkkkk.', '........', '........'], pal: { k: '#3a3a5a' } },
    medal: { rows: ['..rr..r.', '..rr.r..', '..rrr...', '..yyy...', '.yyyyy..', '.yyyyy..', '..yyy...'], pal: { r: '#d03030', y: '#ffd040' } },
    cape: { rows: ['.rrrrrr.', 'rrrrrrrr', 'rrrrrrrr', 'rrrrrrrr', 'rrrrrrrr', 'rryyyyrr', '........'], pal: { r: '#d83a3a', y: '#ffd24a' } },
    star: { rows: ['...y....', '..yyy...', 'yyyyyyy.', '.yyyyy..', '..yyy...', '.yy.yy..', 'y.....y.'], pal: { y: '#ffd24a' } },
    permit: { rows: ['wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbwbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.'], pal: { w: '#eee', b: '#4060c0' } },
    bag: { rows: ['..kkkk..', '.k....k.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk'], pal: { k: '#5a3a2a' } },
    taco: { rows: ['........', '..yyyy..', '.yggrgy.', 'yggrggry', 'yyyyyyyy', '.yyyyyy.', '........'], pal: { y: '#f0c060', g: '#6be585', r: '#d83a3a' } },
    case: { rows: ['..kkkk..', '.k....k.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk'], pal: { k: '#3a2a3a' } },
    cred: { rows: ['...y....', '..yyy...', '.yyyyy..', 'yyyyyyy.', '.yyyyy..', '.yy.yy..', 'y.....y.'], pal: { y: '#ff80c0' } },
    phone: { rows: ['.kkkkk..', '.kwwwk..', '.kwwwk..', '.kwwwk..', '.kwwwk..', '.kkkkk..', '........'], pal: { k: '#222', w: '#8ad8ff' } },
    coffee: { rows: ['.s.s....', 's.s.....', 'wwwwww..', 'wbbbbwww', 'wbbbbw.w', 'wbbbbwww', '.wwww...'], pal: { s: '#ccc', w: '#eee', b: '#6a3a1a' } },
    union: { rows: ['rrrrrrr.', 'rwwwwwr.', 'rwrrrwr.', 'rwwwwwr.', 'rrrrrrr.', '........', '........'], pal: { r: '#d03030', w: '#fff' } },
    coupon: { rows: ['gggggggg', 'g.g..g.g', 'gggggggg', 'g.g..g.g', 'gggggggg', '........', '........'], pal: { g: '#5ab060' } },
    flyer: { rows: ['wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.', 'wbbbbbw.', 'wwwwwww.'], pal: { w: '#ffe0a0', b: '#c04040' } },
    tuner: { rows: ['kkkkkkkk', 'kggggggk', 'kgg.gggk', 'kggg.ggk', 'kggggggk', 'kkkkkkkk', '........'], pal: { k: '#222', g: '#6be585' } },
    bread: { rows: ['........', '..bbbb..', '.bbbbbb.', 'bbbyybbb', 'bbbbbbbb', '.bbbbbb.', '........'], pal: { b: '#d8a050', y: '#f0d090' } },
    bar: { rows: ['........', '.rrrrrr.', 'rbbbbbbr', 'rbybbybr', 'rbbbbbbr', '.rrrrrr.', '........'], pal: { r: '#d04040', b: '#a0703a', y: '#ffd040' } },
  };
  for (const k in extra) if (!ICON_DEFS[k]) ICON_DEFS[k] = extra[k];
})();
window.addEventListener('load', () => Game.init());
