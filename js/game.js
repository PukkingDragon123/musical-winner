// ---------- Game core: loop, input, run state, save ----------
'use strict';
const SAVE_KEY = 'bugbusker_save_v1';

class Member {
  constructor(o) { Object.assign(this, { name: 'Bug', species: 'beetle', instrument: 'guitar', quality: 1, skill: 1, stamina: 100, hunger: 0, xp: 0, leader: false, gigs: 0 }, o); }
}

class RunState {
  constructor(seed) {
    this.seed = seed; this.rng = makeRng(seed);
    this.money = 6; this.day = 0; this.members = []; this.relics = []; this.consumables = []; this.spareInstruments = [];
    this.karma = 0; this.pendingGig = null; this.stats = { earned: 0, gigs: 0, bestCombo: 0, perfects: 0, tips: 0 };
    this.map = generateMap(this.rng); this.current = null; this.nightPending = false;
    this.buffs = {}; // next-gig buffs: {coffee, flyer}
    this.rowTurns = 0;
  }
  static newRun() {
    const s = new RunState((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);
    const sp = s.rng.pick(['beetle', 'ant', 'grasshopper', 'cricket', 'ladybug']);
    s.members.push(new Member({ name: s.rng.pick(FIRST_NAMES), species: sp, instrument: 'guitar', quality: 1, skill: 2, leader: true }));
    s.consumables.push('bread');
    return s;
  }
  hasRelic(k) { return this.relics.includes(k); }
  addRelic(k) { if (!this.relics.includes(k)) this.relics.push(k); }
  randomNewRelic(exclude = []) { const c = RELIC_KEYS.filter(k => !this.relics.includes(k) && !exclude.includes(k)); return c.length ? this.rng.pick(c) : null; }
  makeMember(instrs) {
    const used = this.members.map(m => m.species);
    const sp = this.rng.pick(SPECIES_KEYS.filter(k => !used.includes(k))) || this.rng.pick(SPECIES_KEYS);
    const usedNames = this.members.map(m => m.name);
    return new Member({ name: this.rng.pick(FIRST_NAMES.filter(n => !usedNames.includes(n))), species: sp, instrument: this.rng.pick(instrs || INSTRUMENT_KEYS), quality: this.rng.int(1, 2), skill: this.rng.int(1, 3 + this.day), stamina: this.rng.int(60, 100) });
  }
  recruitRandom(instrs) { const m = this.makeMember(instrs); this.members.push(m); return m; }
  mealPrice() { return Math.max(3, 7 + this.day * 2 - (this.hasRelic('pass') ? 2 : 0)); }
  avgSkill() { return this.members.reduce((a, m) => a + m.skill, 0) / Math.max(1, this.members.length); }
  isDayEnd(node) { return node.type !== 'boss' && (node.r + 1) % ROWS_PER_DAY === 0; }
  // Performance modifiers
  gigMods(performers, difficulty) {
    const avgSt = performers.reduce((a, m) => a + m.stamina, 0) / performers.length;
    const hungerPen = performers.reduce((a, m) => a + m.hunger, 0) / performers.length;
    let windowMult = (0.78 + 0.22 * (avgSt / 100)) * (1 - 0.08 * hungerPen);
    if (this.buffs.coffee) windowMult *= 1.3;
    const qual = performers.reduce((a, m) => a + m.quality + (this.hasRelic('case') ? 1 : 0), 0) / performers.length;
    let tips = 1 + (qual - 1) * 0.12 + (this.avgSkill() - 1) * 0.04;
    if (this.hasRelic('jar')) tips *= 1.2;
    performers.forEach(m => { tips *= INSTRUMENTS[m.instrument].tipMult ** (1 / performers.length); });
    if (this.pendingGig && this.pendingGig.bonus) tips *= this.pendingGig.bonus;
    let crowd = 1; if (this.hasRelic('amp')) crowd *= 1.35; if (this.buffs.flyer) crowd *= 2;
    return {
      difficulty, windowMult, tips, crowd, range: this.hasRelic('amp') ? 1.4 : 1, watchTime: this.hasRelic('cred') ? 1.5 : 1, wealth: 1,
      luckyPick: this.hasRelic('pick'), metronome: this.hasRelic('metronome'), kazoo: this.hasRelic('kazoo'), earplugs: this.hasRelic('earplugs'),
      missMult: this.hasRelic('shades') ? 0.6 : 1,
    };
  }
  save() {
    try {
      const data = { seed: this.seed, money: this.money, day: this.day, members: this.members, relics: this.relics, consumables: this.consumables, spareInstruments: this.spareInstruments, karma: this.karma, stats: this.stats, buffs: this.buffs, pendingGig: this.pendingGig,
        visited: this.map.nodes.filter(n => n.visited).map(n => [n.r, n.c]), current: this.current ? [this.current.r, this.current.c] : null, nightPending: this.nightPending,
        types: this.map.nodes.map(n => [n.r, n.c, n.type, n.venue || null]) };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) { }
  }
  static load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY); if (!raw) return null;
      const d = JSON.parse(raw);
      const s = new RunState(d.seed);
      // regenerate map with same seed, then restore types (in case of drift)
      s.money = d.money; s.day = d.day; s.members = d.members.map(m => new Member(m)); s.relics = d.relics; s.consumables = d.consumables; s.spareInstruments = d.spareInstruments || [];
      s.karma = d.karma; s.stats = d.stats; s.buffs = d.buffs || {}; s.pendingGig = d.pendingGig; s.nightPending = d.nightPending;
      for (const [r, c, t, v] of d.types) { const n = s.map.grid[r][c]; if (n) { n.type = t; n.venue = v || undefined; } }
      for (const [r, c] of d.visited) { const n = s.map.grid[r][c]; if (n) n.visited = true; }
      if (d.current) s.current = s.map.grid[d.current[0]][d.current[1]];
      return s;
    } catch (e) { return null; }
  }
  static clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }
}

// Simple vertical menu helper
class Menu {
  constructor(items, opts = {}) { this.items = items; this.idx = 0; this.opts = opts; this.rects = []; this.fixIdx(1); }
  fixIdx(dir) { let n = 0; while (this.items[this.idx] && this.items[this.idx].disabled && n++ < this.items.length) this.idx = (this.idx + dir + this.items.length) % this.items.length; }
  move(d) { if (!this.items.length) return; this.idx = (this.idx + d + this.items.length) % this.items.length; this.fixIdx(d); Audio.ui('move'); }
  key(code) {
    if (code === 'ArrowUp' || code === 'KeyW') { this.move(-1); return true; }
    if (code === 'ArrowDown' || code === 'KeyS') { this.move(1); return true; }
    if (code === 'Enter' || code === 'Space' || code === 'KeyZ') { this.select(); return true; }
    return false;
  }
  select() { const it = this.items[this.idx]; if (!it || it.disabled) { Audio.ui('error'); return; } Audio.ui('select'); it.onSelect && it.onSelect(it); }
  click(x, y) {
    const pad = Game.touch ? 2 : 0;
    for (let i = 0; i < this.rects.length; i++) {
      const r = this.rects[i];
      if (r && x >= r.x - pad && x < r.x + r.w + pad && y >= r.y - pad && y < r.y + r.h + pad) { this.idx = i; this.select(); return true; }
    }
    return false;
  }
  hover(x, y) { for (let i = 0; i < this.rects.length; i++) { const r = this.rects[i]; if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h && !this.items[i].disabled) { if (this.idx !== i) { this.idx = i; } return; } } }
  draw(ctx, x, y, w, lineH = 12) {
    this.rects = [];
    this.items.forEach((it, i) => {
      const yy = y + i * lineH; const sel = i === this.idx;
      this.rects.push({ x, y: yy - 2, w, h: lineH });
      if (sel) rect(ctx, x, yy - 2, w, lineH - 1, it.disabled ? '#2a2030' : '#3a3560');
      const col = it.disabled ? '#666' : sel ? '#fff' : '#cfc9e6';
      if (it.icon) { ctx.drawImage(iconSprite(it.icon), x + 2, yy - 1); }
      drawText(ctx, (sel ? '> ' : '  ') + it.label, x + (it.icon ? 12 : 2), yy, col);
      if (it.right) drawText(ctx, it.right, x + w - 4, yy, it.disabled ? '#666' : it.rightColor || '#ffe680', { align: 'right' });
    });
    return y + this.items.length * lineH;
  }
}

const Game = {
  canvas: null, ctx: null, scene: null, run: null, last: 0, mouse: { x: 0, y: 0 }, scale: 1, time: 0, muted: false, keys: new Set(),
  init() {
    this.canvas = document.getElementById('game'); this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.pointers = new Map();
    this.touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.rotated = false;
    window.addEventListener('resize', () => this.resize());
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => setTimeout(() => this.resize(), 120));
    this.resize();
    window.addEventListener('keydown', (e) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      Audio.init();
      if (e.code === 'KeyM' && !(this.scene instanceof PerformScene && this.scene.phase === 'play')) { this.muted = !this.muted; Audio.setMuted(this.muted); return; }
      this.keys.add(e.code);
      if (this.scene && this.scene.key) this.scene.key(e.code, e);
    });
    window.addEventListener('keyup', (e) => { this.keys.delete(e.code); if (this.scene && this.scene.keyUp) this.scene.keyUp(e.code); });
    const c = this.canvas;
    c.style.touchAction = 'none';
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    c.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (e.pointerType === 'touch' || e.pointerType === 'pen') this.touch = true;
      Audio.init();
      try { c.setPointerCapture(e.pointerId); } catch (err) { }
      const p = this.toCanvas(e);
      this.pointers.set(e.pointerId, p);
      if (this.scene && this.scene.pointerDown) this.scene.pointerDown(p.x, p.y, e.pointerId);
      else if (this.scene && this.scene.click) this.scene.click(p.x, p.y);
    });
    c.addEventListener('pointermove', (e) => {
      const p = this.toCanvas(e);
      this.mouse = p;
      if (this.pointers.has(e.pointerId)) {
        this.pointers.set(e.pointerId, p);
        if (this.scene && this.scene.pointerMove) this.scene.pointerMove(p.x, p.y, e.pointerId);
      } else if (e.pointerType === 'mouse' && this.scene && this.scene.hover) this.scene.hover(p.x, p.y);
    });
    const release = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const p = this.toCanvas(e);
      this.pointers.delete(e.pointerId);
      if (this.scene && this.scene.pointerUp) this.scene.pointerUp(p.x, p.y, e.pointerId);
    };
    c.addEventListener('pointerup', release);
    c.addEventListener('pointercancel', release);
    window.addEventListener('blur', () => {
      this.keys.clear();
      for (const id of Array.from(this.pointers.keys())) { if (this.scene && this.scene.pointerUp) this.scene.pointerUp(-1, -1, id); }
      this.pointers.clear();
    });
    this.setScene(new TitleScene());
    requestAnimationFrame((t) => this.frame(t));
  },
  // Map a pointer event to canvas pixels, accounting for the portrait rotation.
  toCanvas(e) {
    const r = this.canvas.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const s = this.scale || 1;
    if (this.rotated) return { x: W / 2 + dy / s, y: H / 2 - dx / s };
    return { x: W / 2 + dx / s, y: H / 2 + dy / s };
  },
  toggleFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) { document.exitFullscreen && document.exitFullscreen(); }
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => { });
  },
  resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    // A portrait viewport plays rotated so the game always fills the long edge.
    const rotate = this.rotateOverride != null ? this.rotateOverride : (vh > vw * 1.05 && vw < 700);
    this.rotated = rotate;
    const availW = rotate ? vh : vw, availH = rotate ? vw : vh - (this.touch ? 0 : 24);
    const raw = Math.min(availW / W, availH / H);
    const s = raw >= 2 ? Math.floor(raw) : Math.max(0.25, Math.floor(raw * 8) / 8);
    this.scale = s;
    const st = this.canvas.style;
    st.width = (W * s) + 'px'; st.height = (H * s) + 'px';
    st.position = 'fixed';
    st.left = Math.round((vw - W * s) / 2) + 'px';
    st.top = Math.round((vh - H * s) / 2) + 'px';
    st.transform = rotate ? 'rotate(90deg)' : 'none';
    const hint = document.getElementById('hint');
    if (hint) hint.style.display = (rotate || this.touch || vh - H * s < 30) ? 'none' : 'block';
  },
  setScene(s) { this.scene = s; if (s.enter) s.enter(); },
  frame(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0.016); this.last = t; this.time += dt;
    if (this.scene) {
      try { this.scene.update(dt); this.scene.draw(this.ctx); }
      catch (e) { console.error(e); this.lastError = String(e && e.message || e); }
    }
    if (this.lastError) drawText(this.ctx, 'ERR: ' + this.lastError.slice(0, 100), 2, H - 7, '#ff5a5a');
    if (this.muted) drawText(this.ctx, this.touch ? 'MUTED' : 'MUTED (M)', W - 4, 2, '#888', { align: 'right' });
    requestAnimationFrame((tt) => this.frame(tt));
  },
  // common HUD for run screens
  drawRunHud(ctx) {
    const r = this.run; if (!r) return;
    rect(ctx, 0, 0, W, 12, '#0d0b18'); rect(ctx, 0, 12, W, 1, '#3a3560');
    drawText(ctx, fmtMoney(r.money), 4, 3, '#ffe680', { shadow: '#000' });
    drawText(ctx, (r.day >= 5 ? 'FINAL NIGHT' : 'DAY ' + (r.day + 1) + '/5') + ' - ' + DAY_NAMES[Math.min(4, r.day)].toUpperCase(), W / 2, 3, '#cfc9e6', { align: 'center' });
    drawText(ctx, r.members.length + ' BUG' + (r.members.length > 1 ? 'S' : '') + '  ' + r.relics.length + ' RELICS', W - 4, 3, '#cfc9e6', { align: 'right' });
  },
  afterNode() {
    // called when a node's activity finishes: night check, boss victory, otherwise back to map
    const r = this.run; const node = r.current;
    if (node.type === 'boss') { this.setScene(new VictoryScene()); return; }
    if (r.isDayEnd(node)) { r.nightPending = true; r.save(); this.setScene(new NightScene()); return; }
    r.save(); this.setScene(new MapScene());
  },
};
window.addEventListener('load', () => Game.init());
