// ---------- The top-down world ----------
// One engine for every place you can stand in: the airport, the street, a
// shop, a restaurant, the hotel. It owns movement, collision, the camera and
// everybody else walking about, so all of those places feel like the same
// game rather than a set of different screens.
'use strict';
// ---- Eight directions, and the sprite frame that goes with each
const DIR8 = [
  { dx: 0, dy: -1, name: 'n' }, { dx: 1, dy: -1, name: 'ne' }, { dx: 1, dy: 0, name: 'e' }, { dx: 1, dy: 1, name: 'se' },
  { dx: 0, dy: 1, name: 's' }, { dx: -1, dy: 1, name: 'sw' }, { dx: -1, dy: 0, name: 'w' }, { dx: -1, dy: -1, name: 'nw' },
];
function dirIndex(dx, dy) {
  if (!dx && !dy) return 4;
  const a = Math.atan2(dy, dx);                    // -pi..pi, 0 = east
  return ((Math.round(a / (Math.PI / 4)) + 2) + 8) % 8;
}
// ---- A body that walks. Acceleration, friction and a slide along walls, so
// clipping a doorframe pushes you round it instead of stopping you dead.
class Walker {
  constructor(x, y, opts = {}) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.r = opts.r || 9;
    this.speed = opts.speed || 128;
    this.accel = opts.accel || 1100;
    this.friction = opts.friction || 1000;
    this.dir = 4; this.walkT = 0; this.moving = false;
    this.spec = opts.spec || null;
    this.scale = opts.scale || 1.4;
  }
  // in: {x, y} desired direction, length <= 1
  step(dt, ix, iy, solid) {
    const len = Math.hypot(ix, iy);
    if (len > 1) { ix /= len; iy /= len; }
    const want = Math.min(1, len);
    if (want > 0.02) {
      this.vx += ix * this.accel * dt;
      this.vy += iy * this.accel * dt;
      const sp = Math.hypot(this.vx, this.vy), max = this.speed * want;
      if (sp > max) { this.vx = this.vx / sp * max; this.vy = this.vy / sp * max; }
      this.dir = dirIndex(ix, iy);
      this.moving = true;
    } else {
      const sp = Math.hypot(this.vx, this.vy);
      if (sp > 0) {
        const drop = Math.min(sp, this.friction * dt);
        this.vx -= this.vx / sp * drop; this.vy -= this.vy / sp * drop;
      }
      this.moving = Math.hypot(this.vx, this.vy) > 8;
    }
    const moved = this.slide(this.vx * dt, this.vy * dt, solid);
    if (this.moving) this.walkT += dt * (0.6 + Math.hypot(this.vx, this.vy) / this.speed);
    return moved;
  }
  // move each axis on its own, so a wall on one side never blocks the other
  slide(dx, dy, solid) {
    let moved = 0;
    const R = this.r;
    if (dx) {
      const nx = this.x + dx;
      if (!solid(nx + Math.sign(dx) * R, this.y - R * 0.6) && !solid(nx + Math.sign(dx) * R, this.y + R * 0.6)) { this.x = nx; moved += Math.abs(dx); }
      else this.vx = 0;
    }
    if (dy) {
      const ny = this.y + dy;
      if (!solid(this.x - R * 0.6, ny + Math.sign(dy) * R) && !solid(this.x + R * 0.6, ny + Math.sign(dy) * R)) { this.y = ny; moved += Math.abs(dy); }
      else this.vy = 0;
    }
    return moved;
  }
  get facing() { return DIR8[this.dir]; }
  get flip() { return this.facing.dx < 0; }
  // the pose to draw: two walk frames, or standing
  get pose() { return this.moving ? (Math.floor(this.walkT * 7) % 2 ? 'walk1' : 'walk2') : 'idle'; }
}
// ---- Input: keys, a virtual stick on touch, and tap-to-walk
class WorldInput {
  constructor() { this.keys = new Set(); this.stick = null; this.tapGoal = null; this.pointers = new Map(); }
  key(code) { this.keys.add(code); this.tapGoal = null; }
  keyUp(code) { this.keys.delete(code); }
  clear() { this.keys.clear(); this.stick = null; this.tapGoal = null; this.pointers.clear(); }
  // where the player wants to go this frame, as a vector
  vector(from) {
    let ix = 0, iy = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) ix -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) ix += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) iy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) iy += 1;
    if (ix || iy) return { x: ix, y: iy };
    if (this.stick) return { x: this.stick.x, y: this.stick.y };
    if (this.tapGoal && from) {
      const dx = this.tapGoal.x - from.x, dy = this.tapGoal.y - from.y, d = Math.hypot(dx, dy);
      if (d < 6) { this.tapGoal = null; return { x: 0, y: 0 }; }
      return { x: dx / d, y: dy / d };
    }
    return { x: 0, y: 0 };
  }
  // the stick lives wherever the thumb first lands
  down(x, y, id) { if (!Game.touch) return false; if (this.stick) return false; this.stick = { ox: x, oy: y, x: 0, y: 0, id }; this.pointers.set(id, 'stick'); return true; }
  move(x, y, id) {
    if (!this.stick || this.stick.id !== id) return false;
    const dx = x - this.stick.ox, dy = y - this.stick.oy, d = Math.hypot(dx, dy);
    const dead = 6, max = 46;
    if (d < dead) { this.stick.x = 0; this.stick.y = 0; return true; }
    const k = Math.min(1, (d - dead) / (max - dead));
    this.stick.x = dx / d * k; this.stick.y = dy / d * k;
    return true;
  }
  up(id) { if (this.stick && this.stick.id === id) this.stick = null; this.pointers.delete(id); }
  drawStick(ctx) {
    if (!this.stick) return;
    const s = this.stick;
    ctx.globalAlpha = 0.18; circle(ctx, s.ox, s.oy, 46, '#ffffff'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.3; ringPx(ctx, s.ox, s.oy, 46, '#ffffff'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5; circle(ctx, s.ox + s.x * 40, s.oy + s.y * 40, 16, '#ffffff'); ctx.globalAlpha = 1;
  }
}
// ---- A camera that follows, zooms and stays inside the world
class WorldCam {
  constructor(opts = {}) {
    this.x = 0; this.y = 0; this.z = opts.z || 2; this.targetZ = this.z;
    this.view = opts.view || { x: 0, y: 26, w: W, h: H - 60 };
    this.bounds = opts.bounds || { w: 4000, h: 4000 };
    this.lead = opts.lead != null ? opts.lead : 0.18;
    this.shakeT = 0;
  }
  snapTo(x, y) { const t = this.want(x, y, 0, 0); this.x = t.x; this.y = t.y; }
  want(x, y, vx, vy) {
    const V = this.view, z = this.z;
    let cx = x * z - V.w / 2 + (vx || 0) * this.lead;
    let cy = y * z - V.h / 2 + (vy || 0) * this.lead;
    const maxX = Math.max(0, this.bounds.w * z - V.w), maxY = Math.max(0, this.bounds.h * z - V.h);
    return { x: clamp(cx, 0, maxX), y: clamp(cy, 0, maxY) };
  }
  follow(dt, x, y, vx, vy) {
    this.z += (this.targetZ - this.z) * Math.min(1, dt * 4);
    const t = this.want(x, y, vx, vy);
    const k = Math.min(1, dt * 7);
    this.x += (t.x - this.x) * k; this.y += (t.y - this.y) * k;
  }
  // world -> screen
  sx(x) { return Math.round(x * this.z - this.x + this.view.x); }
  sy(y) { return Math.round(y * this.z - this.y + this.view.y); }
  // screen -> world
  wx(x) { return (x - this.view.x + this.x) / this.z; }
  wy(y) { return (y - this.view.y + this.y) / this.z; }
  push(ctx) { ctx.save(); ctx.beginPath(); ctx.rect(this.view.x, this.view.y, this.view.w, this.view.h); ctx.clip(); ctx.translate(this.view.x - this.x, this.view.y - this.y); ctx.scale(this.z, this.z); }
  pop(ctx) { ctx.restore(); }
  visible(x, y, pad = 40) {
    const s = { x: this.sx(x), y: this.sy(y) };
    return s.x > this.view.x - pad && s.x < this.view.x + this.view.w + pad && s.y > this.view.y - pad && s.y < this.view.y + this.view.h + pad;
  }
}
// ---- Somebody else who lives here.
// An NPC is not a wanderer: it has a list of places it means to be, in order,
// and it walks to each one and stands there for a while doing its thing.
class Npc {
  constructor(opts) {
    this.body = new Walker(opts.x, opts.y, { r: opts.r || 8, speed: opts.speed || 52, accel: 700, friction: 900, scale: opts.scale || 1.2 });
    this.spec = opts.spec;
    this.route = opts.route || [];              // [{x, y, wait, act}]
    this.i = 0; this.wait = opts.wait || 0;
    this.act = 'walk';
    this.tag = opts.tag || null;                // what they say if you talk
    this.name = opts.name || null;
    this.carry = opts.carry || null;            // a bag, a case, a tray
    this.o = Math.random() * 6.3;
  }
  get x() { return this.body.x; } get y() { return this.body.y; }
  update(dt, solid) {
    if (this.wait > 0) { this.wait -= dt; this.body.step(dt, 0, 0, solid); return; }
    const g = this.route[this.i];
    if (!g) { this.body.step(dt, 0, 0, solid); return; }
    const dx = g.x - this.body.x, dy = g.y - this.body.y, d = Math.hypot(dx, dy);
    if (d < 7) {
      this.wait = g.wait != null ? g.wait : 1.5;
      this.act = g.act || 'stand';
      this.i = (this.i + 1) % this.route.length;
      return;
    }
    this.act = 'walk';
    const moved = this.body.step(dt, dx / d, dy / d, solid);
    // stuck against something: give up on this stop and try the next
    if (moved < 0.2) { this.stuck = (this.stuck || 0) + dt; if (this.stuck > 1.2) { this.stuck = 0; this.i = (this.i + 1) % this.route.length; } }
    else this.stuck = 0;
  }
  draw(ctx, t) {
    const b = this.body;
    drawShadow(ctx, b.x, b.y + 6, 18 * b.scale, 0.3);
    drawBugAt(ctx, this.spec, b.x, b.y + 8, { pose: b.pose, scale: b.scale, flip: b.flip, bounce: b.moving ? 0.9 : 0.5, phase: this.o });
    if (this.carry) drawCarried(ctx, this.carry, b.x, b.y, b.flip);
  }
}
// the thing an NPC is holding, which is most of what tells you who they are
function drawCarried(ctx, kind, x, y, flip) {
  const s = flip ? -1 : 1, hx = x + s * 12;
  if (kind === 'case') { rect(ctx, hx - 4, y - 2, 9, 14, '#4a3a2a'); rect(ctx, hx - 4, y - 2, 9, 2, '#6a5340'); rect(ctx, hx - 1, y - 5, 3, 4, '#8a8a98'); }
  else if (kind === 'bag') { rect(ctx, hx - 4, y + 2, 8, 9, '#c8402c'); rect(ctx, hx - 3, y - 1, 6, 3, '#8a2a1c'); }
  else if (kind === 'tray') { rect(ctx, hx - 8, y - 1, 16, 4, '#d8d2c4'); rect(ctx, hx - 5, y - 4, 6, 3, '#e8503a'); rect(ctx, hx + 2, y - 3, 4, 2, '#f2efe8'); }
  else if (kind === 'amp') { rect(ctx, hx - 6, y - 4, 13, 14, '#241f2e'); rect(ctx, hx - 5, y - 3, 11, 8, '#3a3448'); rect(ctx, hx - 5, y + 6, 11, 2, '#8a8a98'); }
  else if (kind === 'phone') { rect(ctx, hx - 2, y - 4, 5, 8, '#1b1e26'); rect(ctx, hx - 1, y - 3, 3, 5, '#8ad8ff'); }
  else if (kind === 'umbrella') { rect(ctx, hx - 1, y - 8, 2, 16, '#3a3448'); ellipsePx(ctx, hx, y - 9, 8, 4, '#cfe4f8'); }
}
// ---- Things in the world you can walk up to and use
// {x, y, w, h, label, kind, act, solid}
function nearestProp(props, x, y, reach = 26) {
  let best = null, bd = Infinity;
  for (const p of props) {
    if (p.hidden) continue;
    const cx = p.x + (p.w || 0) / 2, cy = p.y + (p.h || 0) / 2;
    const dx = Math.max(Math.abs(x - cx) - (p.w || 0) / 2, 0), dy = Math.max(Math.abs(y - cy) - (p.h || 0) / 2, 0);
    const d = Math.hypot(dx, dy);
    if (d < reach && d < bd) { bd = d; best = p; }
  }
  return best;
}
// the little prompt over whatever you are standing in front of
function drawPrompt(ctx, cam, p, t, label) {
  const sx = cam.sx(p.x + (p.w || 0) / 2), sy = cam.sy(p.y) - 14;
  const txt = label || p.label || '';
  const w = textWidth(txt, { scale: 2 }) + 18;
  const bob = Math.round(Math.sin(t * 5) * 2);
  rect(ctx, sx - w / 2, sy - 22 + bob, w, 22, 'rgba(10,8,20,0.86)');
  frame(ctx, sx - w / 2, sy - 22 + bob, w, 22, '#ffd24a');
  drawText(ctx, txt, sx, sy - 15 + bob, '#ffe9a8', { align: 'center', scale: 2 });
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath(); ctx.moveTo(sx - 4, sy + bob); ctx.lineTo(sx + 4, sy + bob); ctx.lineTo(sx, sy + 5 + bob); ctx.fill();
}
