// ---------- The side-scroller ----------
// The whole game runs on this now. A scene is a long strip of world: you walk
// left and right along a floor, step between floors that are stacked into the
// screen, and stand in front of things to use them. Nothing is top-down any
// more.
//
// World space is pixels. x runs 0..def.w. y is the same scale as the screen at
// zoom 1, so a floor at y 430 is authored where you can see it.
'use strict';

// ---------- somebody walking ----------
class SideWalker {
  constructor(x, floor, opts = {}) {
    this.x = x; this.floor = floor || 0; this.fk = this.floor;   // fk = the floor we are visually on, tweened
    this.vx = 0; this.face = 1; this.moving = false; this.t = 0;
    this.speed = opts.speed || 118; this.accel = opts.accel || 900; this.friction = opts.friction || 1200;
    this.spec = opts.spec || null; this.scale = opts.scale || 1.5; this.r = opts.r || 9;
    this.carry = opts.carry || null;                                // a case, a bag, a tray
    this.riding = null;                                             // an escalator has hold of you
  }
  get pose() { return this.moving ? (Math.floor(this.t * 7) % 2 ? 'walk1' : 'walk2') : 'idle'; }
  get flip() { return this.face < 0; }
  // ax: -1..1. solid(x, floor) says whether that spot is blocked.
  step(dt, ax, solid) {
    this.t += dt;
    if (this.riding) { this.riding.carry(this, dt); return; }
    const want = ax * this.speed;
    if (Math.abs(ax) > 0.02) { this.vx += (want - this.vx) * Math.min(1, dt * (this.accel / 90)); this.face = ax > 0 ? 1 : -1; }
    else { const d = this.friction * dt; this.vx = Math.abs(this.vx) <= d ? 0 : this.vx - Math.sign(this.vx) * d; }
    const nx = this.x + this.vx * dt;
    if (!solid || !solid(nx, this.floor)) this.x = nx; else this.vx = 0;
    this.moving = Math.abs(this.vx) > 8;
    // ease onto the floor we were sent to
    this.fk += (this.floor - this.fk) * Math.min(1, dt * 7);
    if (Math.abs(this.fk - this.floor) < 0.01) this.fk = this.floor;
  }
  goFloor(n) { this.floor = n; }
}

// ---------- the camera, which mostly just tracks sideways ----------
class SideCam {
  constructor(opts = {}) {
    this.x = 0; this.y = 0; this.z = opts.z || 1; this.targetZ = this.z;
    this.view = opts.view || { x: 0, y: 0, w: W, h: H };
    this.x0 = opts.x0 || 0; this.x1 = opts.x1 != null ? opts.x1 : 4000;
    this.lead = opts.lead != null ? opts.lead : 0.34;
    this.yBias = opts.yBias != null ? opts.yBias : 0.60;   // where the floor sits down the screen
    this.hold = null;                                      // a cinematic target
    this.sh = 0; this.shT = 0;
  }
  want(x, y, vx) {
    const V = this.view, z = this.z;
    let cx = x * z - V.w / 2 + (vx || 0) * this.lead;
    let cy = y * z - V.h * this.yBias;
    return { x: clamp(cx, this.x0 * z, Math.max(this.x0 * z, this.x1 * z - V.w)), y: cy };
  }
  snapTo(x, y) { const t = this.want(x, y, 0); this.x = t.x; this.y = t.y; }
  follow(dt, x, y, vx) {
    this.z += (this.targetZ - this.z) * Math.min(1, dt * 3.4);
    const g = this.hold || { x, y, vx };
    const t = this.want(g.x, g.y, g.vx || 0);
    const k = Math.min(1, dt * (this.hold ? 3.2 : 6));
    this.x += (t.x - this.x) * k; this.y += (t.y - this.y) * k;
    if (this.shT > 0) { this.shT -= dt; if (this.shT <= 0) this.sh = 0; }
  }
  // Look somewhere that is not the player for a moment.
  focus(x, y, z) { this.hold = { x, y }; if (z) this.targetZ = z; }
  release(z) { this.hold = null; if (z) this.targetZ = z; }
  kick(m, d) { this.sh = m; this.shT = d; }
  get shakeX() { return this.shT > 0 ? Math.round((Math.random() - 0.5) * 2 * this.sh) : 0; }
  sx(x) { return Math.round(x * this.z - this.x + this.view.x); }
  sy(y) { return Math.round(y * this.z - this.y + this.view.y); }
  wx(x) { return (x - this.view.x + this.x) / this.z; }
  wy(y) { return (y - this.view.y + this.y) / this.z; }
  push(ctx) {
    ctx.save(); ctx.beginPath(); ctx.rect(this.view.x, this.view.y, this.view.w, this.view.h); ctx.clip();
    ctx.translate(this.view.x - this.x + this.shakeX, this.view.y - this.y); ctx.scale(this.z, this.z);
  }
  pop(ctx) { ctx.restore(); }
  visible(x, pad = 120) { const s = this.sx(x); return s > this.view.x - pad && s < this.view.x + this.view.w + pad; }
}

// ---------- input: left, right, up, down, and the button ----------
class SideInput {
  constructor() { this.k = new Set(); this.pads = null; this.held = new Map(); }
  key(c) { this.k.add(c); }
  keyUp(c) { this.k.delete(c); }
  clear() { this.k.clear(); this.held.clear(); }
  get ax() {
    let a = 0;
    if (this.k.has('ArrowLeft') || this.k.has('KeyA')) a -= 1;
    if (this.k.has('ArrowRight') || this.k.has('KeyD')) a += 1;
    for (const v of this.held.values()) { if (v === 'l') a -= 1; if (v === 'r') a += 1; }
    return clamp(a, -1, 1);
  }
  // the touch pads, laid across the bottom of a phone
  layout() {
    const b = Game.touch ? 62 : 0;
    if (!b) return null;
    return {
      l: { x: 12, y: H - b - 12, w: b, h: b },
      r: { x: 12 + b + 8, y: H - b - 12, w: b, h: b },
      u: { x: W - b * 2 - 20, y: H - b - 12, w: b, h: b },
      a: { x: W - b - 12, y: H - b - 12, w: b, h: b },
    };
  }
  hit(x, y, id) {
    const L = this.layout(); if (!L) return null;
    for (const k of ['l', 'r', 'u', 'a']) { const r = L[k]; if (x >= r.x - 8 && x < r.x + r.w + 8 && y >= r.y - 8 && y < r.y + r.h + 8) { if (k === 'l' || k === 'r') this.held.set(id, k); return k; } }
    return null;
  }
  up(id) { this.held.delete(id); }
  draw(ctx) {
    const L = this.layout(); if (!L) return;
    const pad = (r, glyph, on) => {
      ctx.globalAlpha = on ? 0.55 : 0.3;
      rect(ctx, r.x, r.y, r.w, r.h, '#0b0a14'); frame(ctx, r.x, r.y, r.w, r.h, '#ffd24a');
      rect(ctx, r.x + 2, r.y + 2, r.w - 4, 2, '#3a3450');
      ctx.globalAlpha = on ? 1 : 0.75;
      drawText(ctx, glyph, r.x + r.w / 2, r.y + r.h / 2 - 7, '#ffd24a', { align: 'center', scale: 3 });
      ctx.globalAlpha = 1;
    };
    const dirs = Array.from(this.held.values());
    pad(L.l, '<', dirs.includes('l')); pad(L.r, '>', dirs.includes('r'));
    pad(L.u, '^', false); pad(L.a, 'A', false);
  }
}

// ---------- a speech bubble ----------
// Everybody in this game talks in a bubble over their head, not in a box at
// the bottom of the screen. The box at the bottom is for the narrator.
class Bubble {
  constructor(text, opts = {}) {
    this.full = String(text); this.n = 0; this.t = 0;
    this.who = opts.who || null; this.voice = opts.voice === false ? false : (opts.voice || null);
    this.think = !!opts.think; this.col = opts.col || '#f6f2e0'; this.ink = opts.ink || '#241d28';
    this.maxChars = opts.maxChars || 34;
    this.lines = wrapText(this.full, this.maxChars);
    this.speed = opts.speed || 44;
    this.done = false; this.spoke = false;
  }
  update(dt) {
    this.t += dt;
    if (!this.spoke && this.voice !== false) { this.spoke = true; Voice.say(this.full, this.voice, {}); }
    this.n = Math.min(this.full.length, this.n + dt * this.speed);
    if (this.n >= this.full.length) this.done = true;
  }
  skip() { this.n = this.full.length; this.done = true; }
  // draw it over a point in SCREEN space
  draw(ctx, sx, sy, t) {
    const shown = this.full.slice(0, Math.floor(this.n));
    const lines = wrapText(shown, this.maxChars);
    const all = this.lines;
    const wch = Math.max(...all.map(l => l.length), 6);
    const bw = wch * 12 + 18, bh = all.length * 20 + (this.who ? 26 : 14);
    let bx = Math.round(clamp(sx - bw / 2, 8, W - bw - 8));
    let by = Math.round(clamp(sy - bh - 20, 30, H - bh - 20));
    // the tail, which is what makes it a speech bubble instead of a box
    ctx.fillStyle = 'rgba(8,6,14,0.45)'; ctx.fillRect(bx + 4, by + 5, bw, bh);
    rect(ctx, bx, by, bw, bh, this.col);
    frame(ctx, bx, by, bw, bh, '#241d28');
    rect(ctx, bx + 1, by + 1, bw - 2, 2, '#ffffff');
    if (this.think) {
      for (let i = 0; i < 3; i++) { const r = 5 - i, cx = sx + (sx > bx + bw / 2 ? -6 : 6) * 0, cy = by + bh + 5 + i * 8; circle(ctx, clamp(sx, bx + 10, bx + bw - 10), cy, r, this.col); ringPx(ctx, clamp(sx, bx + 10, bx + bw - 10), cy, r, '#241d28'); }
    } else {
      const tx = clamp(sx, bx + 14, bx + bw - 22);
      ctx.fillStyle = this.col; ctx.beginPath();
      ctx.moveTo(tx - 7, by + bh - 1); ctx.lineTo(tx + 7, by + bh - 1); ctx.lineTo(clamp(sx, bx + 6, bx + bw - 6), by + bh + 13); ctx.fill();
      ctx.strokeStyle = '#241d28'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(tx - 7, by + bh - 0.5); ctx.lineTo(clamp(sx, bx + 6, bx + bw - 6), by + bh + 13); ctx.lineTo(tx + 7, by + bh - 0.5); ctx.stroke();
    }
    let ty = by + 8;
    if (this.who) { rect(ctx, bx + 6, by - 9, textWidth(this.who, { scale: 2 }) + 12, 17, '#c8a03a'); frame(ctx, bx + 6, by - 9, textWidth(this.who, { scale: 2 }) + 12, 17, '#5a3a10'); drawText(ctx, this.who, bx + 12, by - 5, '#2a1a08', { scale: 2 }); ty = by + 12; }
    lines.forEach((l, i) => drawText(ctx, l, bx + 9, ty + i * 20, this.ink, { scale: 2 }));
    if (this.done) { ctx.globalAlpha = 0.4 + 0.5 * Math.sin(t * 6); drawText(ctx, Game.touch ? 'TAP' : 'Z', bx + bw - 8, by + bh - 12, '#8a7a5e', { align: 'right', font: 'small' }); ctx.globalAlpha = 1; }
  }
}

// ---------- a conversation ----------
// A script is a list of beats. A beat is a line, or a line with choices, or a
// function to run. Choices branch by label. This runs the whole thing.
class Dialogue {
  // script: [{who, text, voice, think, at, choices:[{label, next, go, cost}], do, next, id}]
  constructor(script, opts = {}) {
    this.script = script; this.i = 0; this.opts = opts; this.t = 0;
    this.bubble = null; this.choiceIdx = 0; this.finished = false; this.rects = [];
    this.begin();
  }
  find(id) { const n = this.script.findIndex(b => b.id === id); return n < 0 ? this.script.length : n; }
  begin() {
    while (this.i < this.script.length) {
      const b = this.script[this.i];
      if (!b) break;
      if (b.when && !b.when()) { this.i++; continue; }
      if (b.do && !b._ran) { b._ran = true; b.do(this); }
      if (b.text) { this.bubble = new Bubble(b.text, { who: b.who, voice: b.voice, think: b.think }); this.choiceIdx = 0; return; }
      if (b.next) { this.i = this.find(b.next); continue; }
      this.i++;
    }
    this.finished = true; this.bubble = null;
    if (this.opts.onEnd) { const f = this.opts.onEnd; this.opts.onEnd = null; f(); }
  }
  get beat() { return this.script[this.i]; }
  get choices() { const b = this.beat; return this.bubble && this.bubble.done && b && b.choices ? b.choices : null; }
  update(dt) { this.t += dt; if (this.bubble) this.bubble.update(dt); }
  advance() {
    const b = this.beat; if (!b) { this.finished = true; return; }
    if (!this.bubble.done) { this.bubble.skip(); return; }
    if (b.choices) { this.pick(this.choiceIdx); return; }
    this.i = b.next ? this.find(b.next) : this.i + 1;
    this.bubble = null; this.begin();
  }
  pick(n) {
    const b = this.beat, c = b.choices[n]; if (!c) return;
    Audio.ui('select');
    if (c.go) c.go(this);
    this.i = c.next ? this.find(c.next) : this.i + 1;
    this.bubble = null; this.begin();
  }
  key(code) {
    if (this.finished) return;
    const ch = this.choices;
    if (ch) {
      if (code === 'ArrowUp' || code === 'KeyW') { this.choiceIdx = (this.choiceIdx - 1 + ch.length) % ch.length; Audio.ui('move'); return; }
      if (code === 'ArrowDown' || code === 'KeyS') { this.choiceIdx = (this.choiceIdx + 1) % ch.length; Audio.ui('move'); return; }
    }
    if (['Enter', 'Space', 'KeyZ', 'KeyX', 'Escape'].includes(code)) this.advance();
  }
  click(x, y) {
    if (this.finished) return true;
    const ch = this.choices;
    if (ch) { for (let i = 0; i < this.rects.length; i++) { const r = this.rects[i]; if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { this.pick(i); return true; } } return true; }
    this.advance(); return true;
  }
  // sx/sy: screen point the bubble points at
  draw(ctx, sx, sy) {
    if (!this.bubble) return;
    this.bubble.draw(ctx, sx, sy, this.t);
    this.rects = [];
    const ch = this.choices; if (!ch) return;
    const rowH = Game.touch ? 34 : 28, bw = 430, bx = W / 2 - bw / 2, by = H - 24 - ch.length * rowH;
    ctx.fillStyle = 'rgba(6,5,12,0.62)'; ctx.fillRect(0, by - 12, W, H - by + 12);
    ch.forEach((c, i) => {
      const y = by + i * rowH, on = i === this.choiceIdx;
      this.rects.push({ x: bx, y, w: bw, h: rowH - 4 });
      rect(ctx, bx, y, bw, rowH - 4, on ? '#ffd24a' : '#1b1728');
      frame(ctx, bx, y, bw, rowH - 4, on ? '#fff6c8' : '#4a4068');
      if (on) rect(ctx, bx, y, 5, rowH - 4, '#c8402c');
      drawText(ctx, c.label, bx + 14, y + Math.floor((rowH - 4 - 14) / 2), on ? '#2a1a08' : '#cfc9e6', { scale: 2 });
      if (c.note) drawText(ctx, c.note, bx + bw - 12, y + Math.floor((rowH - 4 - 10) / 2), on ? '#7a5a10' : '#8a82a8', { align: 'right', font: 'small' });
    });
  }
}

// ---------- the scene everything inherits ----------
// def: {
//   name, sub, w, floors: [{y, z, name}], sky (fn or [c1,c2]),
//   back(ctx,S,t), mid(ctx,S,t), fore(ctx,S,t),     // parallax painters
//   props: [{kind, x, w, h, floor, solid, label, act, over, ...}],
//   npcs:  [{name, x, floor, spec, voice, tag, walk:[x0,x1], speed, carry, scale}],
//   use(S, p), enterLine, hud (false to hide), start:{x,floor}
// }
class SideScene {
  constructor(def, opts = {}) {
    this.D = def; this.opts = opts; this.t = 0; this.fx = new Particles(); this.wfx = new Particles();
    this.you = (Game.run && Game.run.members[0]) || { spec: HERO_PRESETS.buzz };
    this.floors = def.floors || [{ y: 430, z: 1 }];
    this.props = (def.props || []).map(p => Object.assign({ floor: 0, w: 40, h: 40 }, p));
    this.npcs = (def.npcs || []).map((n, i) => Object.assign({
      floor: 0, scale: 1.4, speed: 32, t: makeRng(hashStr((def.name || '') + i))() * 6,
      spec: n.spec || randomBugSpec(makeRng(hashStr((def.name || 'x') + 'n' + i))),
      _x: n.x, dir: 1,
    }, n));
    const st = def.start || { x: 60, floor: 0 };
    this.body = new SideWalker(st.x, st.floor || 0, { spec: this.you.spec, scale: def.heroScale || 1.6, speed: def.speed || 120, carry: opts.carry || def.carry });
    this.cam = new SideCam({ z: def.zoom || 1, x0: 0, x1: def.w || 2400, yBias: def.yBias != null ? def.yBias : 0.62 });
    this.cam.targetZ = def.zoom || 1;
    this.input = new SideInput();
    this.cam.snapTo(this.body.x, this.floorY(this.body.fk));
    this.prompt = null; this.dlg = null; this.msg = null; this.msgT = 0;
    this.locked = 0;                        // > 0 means you cannot walk
    this.left = false;
    if (def.enterLine) this.flash(def.enterLine);
    if (def.init) def.init(this);
  }
  // ---- geometry
  floorY(fk) {
    const f = this.floors;
    const a = f[Math.max(0, Math.min(f.length - 1, Math.floor(fk)))];
    const b = f[Math.max(0, Math.min(f.length - 1, Math.ceil(fk)))];
    const k = fk - Math.floor(fk);
    return lerp(a.y, b.y, k);
  }
  floorZ(fk) {
    const f = this.floors;
    const a = f[Math.max(0, Math.min(f.length - 1, Math.floor(fk)))];
    const b = f[Math.max(0, Math.min(f.length - 1, Math.ceil(fk)))];
    return lerp(a.z != null ? a.z : 1, b.z != null ? b.z : 1, fk - Math.floor(fk));
  }
  propY(p) { return p.y != null ? p.y : this.floorY(p.floor); }
  flash(m, secs) { this.msg = m; this.msgT = secs || 3.2; }
  // ---- talking
  say(who, text, voice, opts) {
    const o = opts || {};
    this.dlg = new Dialogue([{ who, text, voice, at: o.at || who || 'you', think: o.think }],
      Object.assign({ onEnd: () => { this.dlg = null; } }, o));
  }
  run(script, onEnd) {
    this.dlg = new Dialogue(script, { onEnd: () => { this.dlg = null; if (onEnd) onEnd(); } });
  }
  leave(factory, kind, opts) {
    if (this.left) return; this.left = true;
    if (Game.run) Game.run.save();
    Game.go(factory || this.opts.back || (() => new StreetHubScene()), kind || 'fade', opts || { dur: 0.6 });
  }
  // ---- what is in front of you
  solid(x, floor) {
    if (x < 14 || x > (this.D.w || 2400) - 14) return true;
    for (const p of this.props) {
      if (!p.solid || p.floor !== floor) continue;
      if (x > p.x - p.w / 2 && x < p.x + p.w / 2) return true;
    }
    return false;
  }
  findPrompt() {
    const b = this.body; let best = null, bd = 1e9;
    for (const p of this.props) {
      if (!p.label && !p.act) continue;
      if (Math.round(p.floor) !== Math.round(b.floor)) continue;
      const d = Math.abs(b.x - p.x) - (p.w || 40) / 2;
      const reach = p.reach || 34;
      if (d < reach && d < bd) { bd = d; best = { kind: 'prop', p }; }
    }
    for (const n of this.npcs) {
      if (!n.tag && !n.act) continue;
      if (Math.round(n.floor) !== Math.round(b.floor)) continue;
      const d = Math.abs(b.x - n._x) - 18;
      if (d < 32 && d < bd) { bd = d; best = { kind: 'npc', n }; }
    }
    return best;
  }
  interact() {
    const P = this.prompt; if (!P) return;
    Audio.ui('select');
    if (P.kind === 'npc') {
      const n = P.n;
      if (n.act && this.D.use) { this.D.use(this, n); return; }
      const line = typeof n.tag === 'function' ? n.tag(this) : n.tag;
      if (Array.isArray(line)) this.run(line.map(l => ({ who: n.name, text: l, voice: n.voice, at: n.name })));
      else this.say(n.name, line, n.voice, { at: n.name });
      return;
    }
    const p = P.p;
    if (p.act === 'exit') { this.leave(p.to, p.trans || 'fade'); return; }
    if (this.D.use) this.D.use(this, p);
  }
  // ---- loop
  update(dt) {
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt);
    this.fx.update(dt); this.wfx.update(dt);
    if (this.dlg) { this.dlg.update(dt); this.body.step(dt, 0, (x, f) => this.solid(x, f)); }
    else if (this.locked > 0) { this.locked -= dt; this.body.step(dt, 0, (x, f) => this.solid(x, f)); }
    else this.body.step(dt, this.input.ax, (x, f) => this.solid(x, f));
    for (const n of this.npcs) this.stepNpc(n, dt);
    this.cam.follow(dt, this.body.x, this.floorY(this.body.fk), this.body.vx);
    this.prompt = (this.dlg || this.locked > 0) ? null : this.findPrompt();
    if (this.D.tick) this.D.tick(this, dt);
  }
  stepNpc(n, dt) {
    n.t += dt;
    if (!n.walk) { n.moving = false; return; }
    const [a, b] = n.walk;
    n._x += n.dir * n.speed * dt;
    if (n._x > b) { n._x = b; n.dir = -1; } else if (n._x < a) { n._x = a; n.dir = 1; }
    n.moving = true; n.face = n.dir;
  }
  key(code) {
    if (this.dlg) { this.dlg.key(code); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.interact(); return; }
    if (code === 'ArrowUp' || code === 'KeyW') { this.upDown(-1); return; }
    if (code === 'ArrowDown' || code === 'KeyS') { this.upDown(1); return; }
    if (code === 'Escape') { if (this.D.canLeave !== false) this.leave(); return; }
    this.input.key(code);
  }
  keyUp(code) { this.input.keyUp(code); }
  upDown(d) {
    // up/down steps between floors when you are standing on something that
    // connects them; otherwise it is the use button too
    const P = this.prompt;
    if (P && P.kind === 'prop' && (P.p.kind === 'escalator' || P.p.kind === 'stairs' || P.p.kind === 'lift')) { this.interact(); return; }
    const n = clamp(this.body.floor + d, 0, this.floors.length - 1);
    if (n !== this.body.floor && this.D.freeFloors !== false) { this.body.goFloor(n); Audio.ui('move'); }
    else if (P) this.interact();
  }
  pointerDown(x, y, id) {
    if (this.dlg) { this.dlg.click(x, y); return; }
    const h = this.input.hit(x, y, id);
    if (h === 'a') { this.interact(); return; }
    if (h === 'u') { this.upDown(-1); return; }
    if (h) return;
    // tapping the thing you are standing at uses it; tapping elsewhere walks
    if (this.prompt) {
      const P = this.prompt;
      const px2 = P.kind === 'npc' ? this.cam.sx(P.n._x) : this.cam.sx(P.p.x);
      if (Math.abs(x - px2) < 90) { this.interact(); return; }
    }
    this.input.held.set(id, x < W / 2 ? 'l' : 'r');
  }
  pointerMove(x, y, id) { if (this.input.held.has(id)) this.input.held.set(id, x < W / 2 ? 'l' : 'r'); }
  pointerUp(x, y, id) { this.input.up(id); }
  click(x, y) { this.pointerDown(x, y, 991); }
  hover() {}
  // ---- drawing
  drawHero(ctx) {
    const b = this.body, y = this.floorY(b.fk), z = this.floorZ(b.fk);
    drawShadow(ctx, b.x, y + 2, 24 * b.scale * z, 0.32);
    drawBugAt(ctx, this.you.spec, b.x, y + 3, { pose: b.pose, scale: b.scale * z, flip: b.flip, bounce: b.moving ? 1 : 0.6 });
    if (b.carry) drawSideCarry(ctx, b.carry, b.x, y, b.face, b.scale * z, this.t);
  }
  drawNpc(ctx, n) {
    const y = n.y != null ? n.y : this.floorY(n.floor), z = this.floorZ(n.floor);
    drawShadow(ctx, n._x, y + 2, 22 * n.scale * z, 0.28);
    drawBugAt(ctx, n.spec, n._x, y + 3, {
      pose: n.pose || (n.moving ? (Math.floor(n.t * 6) % 2 ? 'walk1' : 'walk2') : 'idle'),
      scale: n.scale * z, flip: n.face < 0, bounce: n.moving ? 0.9 : 0.5, phase: n.t,
    });
    if (n.carry) drawSideCarry(ctx, n.carry, n._x, y, n.face || 1, n.scale * z, this.t);
  }
  draw(ctx) {
    const D = this.D, t = this.t, cam = this.cam;
    // ---- sky
    if (typeof D.sky === 'function') D.sky(ctx, this, t);
    else if (Array.isArray(D.sky)) vgrad(ctx, 0, 0, W, H, D.sky[0], D.sky[1]);
    else rect(ctx, 0, 0, W, H, '#0a0912');
    if (D.back) D.back(ctx, this, t);
    cam.push(ctx);
    if (D.mid) D.mid(ctx, this, t);
    // ---- everything on the floors, far floors first
    const items = [];
    for (const p of this.props) if (!p.hidden) items.push({ f: p.floor, y: this.propY(p), z: p.over ? 9 : 0, d: () => this.drawProp(ctx, p) });
    for (const n of this.npcs) if (!n.hidden) items.push({ f: n.floor, y: n.y != null ? n.y : this.floorY(n.floor), z: 1, d: () => this.drawNpc(ctx, n) });
    items.push({ f: this.body.fk, y: this.floorY(this.body.fk), z: 2, d: () => this.drawHero(ctx) });
    items.sort((a, b) => (a.f - b.f) || (a.y - b.y) || (a.z - b.z));
    for (const it of items) it.d();
    this.wfx.draw(ctx);
    if (D.fore) D.fore(ctx, this, t);
    cam.pop(ctx);
    if (D.after) D.after(ctx, this, t);
    // ---- the prompt over what you are at
    if (this.prompt) {
      const P = this.prompt;
      const px2 = P.kind === 'npc' ? cam.sx(P.n._x) : cam.sx(P.p.x);
      const py = P.kind === 'npc' ? cam.sy((P.n.y != null ? P.n.y : this.floorY(P.n.floor)) - 56) : cam.sy(this.propY(P.p) - (P.p.h || 40) - 12);
      sidePrompt(ctx, px2, py, P.kind === 'npc' ? 'TALK' : (P.p.label || 'USE'), t);
    }
    this.fx.draw(ctx);
    if (D.hud !== false && Game.run) Game.drawHud(ctx);
    // ---- the name of the place, as a title card that gets out of the way
    // It used to sit at the top and fight whatever the scene had put there -
    // an objective line, a shop's own sign, the HUD. It is a card now: it
    // lands in the middle of the frame over its own plate, holds, and goes.
    if (D.name && this.t < 4.2) {
      const a = clamp(4.2 - this.t, 0, 1) * clamp(this.t * 3, 0, 1);
      const cy = D.nameY != null ? D.nameY : Math.round(H * 0.24);
      const tw = Math.max(textWidth(D.name, { scale: 3 }), D.sub ? textWidth(D.sub, { scale: 2 }) : 0) + 56;
      ctx.globalAlpha = a * 0.72;
      rect(ctx, W / 2 - tw / 2, cy - 12, tw, D.sub ? 62 : 40, '#07060c');
      rect(ctx, W / 2 - tw / 2, cy - 12, tw, 2, D.tint || '#7a1a2a');
      rect(ctx, W / 2 - tw / 2, cy + (D.sub ? 48 : 26), tw, 2, D.tint || '#7a1a2a');
      ctx.globalAlpha = a;
      uiRibbon(ctx, W / 2, cy, D.name, { scale: 3, color: D.tint || '#7a1a2a' });
      if (D.sub) drawText(ctx, D.sub, W / 2, cy + 32, '#cfc9e6', { align: 'center', scale: 2, outline: '#12101c' });
      ctx.globalAlpha = 1;
    }
    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = Math.min(W - 40, textWidth(this.msg, { scale: 2 }) + 28);
      rect(ctx, W / 2 - w2 / 2, H - 112, w2, 26, 'rgba(8,20,12,0.9)'); frame(ctx, W / 2 - w2 / 2, H - 112, w2, 26, '#6be585');
      drawText(ctx, this.msg, W / 2, H - 104, '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    if (this.dlg) {
      const b = this.body;
      const who = this.dlg.beat && this.dlg.beat.at;
      const target = who === 'you' || !who ? { x: b.x, y: this.floorY(b.fk) - 58 * b.scale * 0.6 }
        : typeof who === 'object' ? who
          : (this.npcs.find(n => n.name === who) ? { x: this.npcs.find(n => n.name === who)._x, y: this.floorY(this.npcs.find(n => n.name === who).floor) - 52 } : { x: b.x, y: this.floorY(b.fk) - 60 });
      this.dlg.draw(ctx, cam.sx(target.x), cam.sy(target.y));
    }
    this.input.draw(ctx);
    if (D.overlay) D.overlay(ctx, this, t);
  }
  // props get drawn by the scene's own painter, or the shared library
  drawProp(ctx, p) {
    if (this.D.prop && this.D.prop(ctx, p, this.t, this) !== false) return;
    drawSideProp(ctx, p, this.t, this);
  }
  isPlaying() { return false; }
}

// ---------- scripted movement ----------
// A cutscene needs to be able to walk you somewhere, hold you still, and put
// you on an escalator, without the player fighting it.
SideScene.prototype.lock = function (secs) { this.locked = Math.max(this.locked, secs || 0.5); };
SideScene.prototype.walkTo = function (x, floor, cb) {
  this.auto = { x, floor: floor != null ? floor : this.body.floor, cb };
};
SideScene.prototype.stopAuto = function () { this.auto = null; };
// Put the player on a ramp and carry them to the other end of it.
SideScene.prototype.ride = function (p, cb) {
  const toFloor = p.toFloor != null ? p.toFloor : (p.floor === 0 ? 1 : 0);
  const dir = p.dir || 1;
  const endX = p.x + dir * (p.w / 2 + 24);
  this.riding = { p, toFloor, endX, k: 0, dur: p.rideTime || 1.8, from: { x: this.body.x, f: this.body.floor }, cb };
  Audio.ui('move');
};
// the black bars, for the beats that are not gameplay
SideScene.prototype.bars = function (ctx, k) { letterbox(ctx, Math.round(58 * clamp(k, 0, 1)), 1); };

const _sideUpdate = SideScene.prototype.update;
SideScene.prototype.update = function (dt) {
  // an escalator has hold of you: nothing else gets a say
  if (this.riding) {
    const R = this.riding;
    R.k = Math.min(1, R.k + dt / R.dur);
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt); this.fx.update(dt); this.wfx.update(dt);
    this.body.x = lerp(R.from.x, R.endX, easeInOut(R.k));
    this.body.fk = lerp(R.from.f, R.toFloor, easeInOut(R.k));
    this.body.moving = false;
    for (const n of this.npcs) this.stepNpc(n, dt);
    this.cam.follow(dt, this.body.x, this.floorY(this.body.fk), 0);
    this.prompt = null;
    if (R.k >= 1) { this.body.floor = R.toFloor; this.body.fk = R.toFloor; this.riding = null; if (R.cb) R.cb(); }
    if (this.D.tick) this.D.tick(this, dt);
    return;
  }
  // walking yourself somewhere on a script
  if (this.auto && !this.dlg) {
    const a = this.auto, d = a.x - this.body.x;
    if (this.body.floor !== a.floor) this.body.goFloor(a.floor);
    if (Math.abs(d) < 6) { this.auto = null; this.input.clear(); if (a.cb) a.cb(); }
    else {
      this.t += dt; this.msgT = Math.max(0, this.msgT - dt); this.fx.update(dt); this.wfx.update(dt);
      this.body.step(dt, Math.sign(d) * (Math.abs(d) < 40 ? 0.5 : 1), (x, f) => this.solid(x, f));
      for (const n of this.npcs) this.stepNpc(n, dt);
      this.cam.follow(dt, this.body.x, this.floorY(this.body.fk), this.body.vx);
      this.prompt = null;
      if (this.D.tick) this.D.tick(this, dt);
      return;
    }
  }
  _sideUpdate.call(this, dt);
};

// the little arrow + word over whatever you are standing at
function sidePrompt(ctx, sx, sy, label, t) {
  const bob = Math.round(Math.sin(t * 5) * 2);
  const w = textWidth(label, { scale: 2 }) + 16;
  rect(ctx, sx - w / 2, sy - 20 + bob, w, 18, '#ffd24a');
  frame(ctx, sx - w / 2, sy - 20 + bob, w, 18, '#5a3a10');
  drawText(ctx, label, sx, sy - 15 + bob, '#2a1a08', { align: 'center', scale: 2 });
  ctx.fillStyle = '#ffd24a'; ctx.beginPath();
  ctx.moveTo(sx - 5, sy - 2 + bob); ctx.lineTo(sx + 5, sy - 2 + bob); ctx.lineTo(sx, sy + 5 + bob); ctx.fill();
}
// something held: a case, a bag, a tray, a suitcase on wheels
function drawSideCarry(ctx, kind, x, y, face, s, t) {
  const ox = x + face * 13 * s, bob = Math.round(Math.sin(t * 6) * 1);
  switch (kind) {
    case 'case': rect(ctx, ox - 5 * s, y - 20 * s + bob, 10 * s, 20 * s, '#3a2a3a'); rect(ctx, ox - 5 * s, y - 20 * s + bob, 10 * s, 2, '#5a4a5a'); rect(ctx, ox - 2 * s, y - 24 * s + bob, 4 * s, 4 * s, '#8a7a5e'); break;
    case 'bag': rect(ctx, ox - 6 * s, y - 15 * s + bob, 12 * s, 14 * s, '#5a3a2a'); rect(ctx, ox - 6 * s, y - 15 * s + bob, 12 * s, 2, '#7a5a40'); break;
    case 'tray': rect(ctx, ox - 9 * s, y - 20 * s + bob, 18 * s, 3 * s, '#b9bec6'); rect(ctx, ox - 7 * s, y - 24 * s + bob, 6 * s, 4 * s, '#e8503a'); rect(ctx, ox + 1 * s, y - 23 * s + bob, 5 * s, 3 * s, '#f2c94c'); break;
    case 'suitcase': {
      const sx2 = ox + face * 6 * s;
      rect(ctx, sx2 - 8 * s, y - 22 * s, 16 * s, 20 * s, '#2f4a8a'); rect(ctx, sx2 - 8 * s, y - 22 * s, 16 * s, 2, '#4a6fb0');
      rect(ctx, sx2 - 8 * s, y - 14 * s, 16 * s, 2, '#1f3568');
      circle(ctx, sx2 - 5 * s, y - 1, 2.5 * s, '#1b1b24'); circle(ctx, sx2 + 5 * s, y - 1, 2.5 * s, '#1b1b24');
      rect(ctx, sx2 - 1 * s, y - 32 * s, 2 * s, 11 * s, '#8a8f98');
      rect(ctx, sx2 - 5 * s, y - 33 * s, 10 * s, 3 * s, '#6a7079');
      break;
    }
    case 'phone': rect(ctx, ox - 3 * s, y - 20 * s + bob, 6 * s, 10 * s, '#1b1b24'); rect(ctx, ox - 2 * s, y - 19 * s + bob, 4 * s, 8 * s, '#8ad8ff'); break;
    case 'coffee': rect(ctx, ox - 3 * s, y - 20 * s + bob, 6 * s, 8 * s, '#f0ece2'); rect(ctx, ox - 3 * s, y - 21 * s + bob, 6 * s, 2 * s, '#3f6f4a'); break;
    case 'umbrella': rect(ctx, ox - 1 * s, y - 26 * s + bob, 2 * s, 24 * s, '#3a3440'); ellipsePx(ctx, ox, y - 27 * s + bob, 9 * s, 4 * s, '#c8402c'); break;
  }
}
