// ---------- Places you go inside ----------
// Inside a building the camera stays where it is: straight down, the same as
// the street. The room is lit and everything around it is black, because from
// up here that is all you can see of a building you are standing in.
'use strict';
const PLACE_TILE = 34;
const PLACES = {
  zoo: {
    name: 'UENO ZOO', sub: 'PANDAS, PENGUINS, ONE VERY LOUD BIRD', fee: 6,
    floor: '#c8b78e', floorAlt: '#bda981', wall: '#6f8f5a', wallTop: '#8fb074',
    w: 20, h: 12, kind: 'zoo',
    spots: [
      { tx: 3, ty: 2, w: 5, h: 3, kind: 'pen', label: 'PANDA HOUSE', animal: 'panda', act: 'wonder' },
      { tx: 12, ty: 2, w: 5, h: 3, kind: 'pool', label: 'PENGUIN POOL', animal: 'penguin', act: 'wonder' },
      { tx: 3, ty: 7, w: 4, h: 3, kind: 'aviary', label: 'AVIARY', animal: 'bird', act: 'wonder' },
      { tx: 13, ty: 7, w: 4, h: 3, kind: 'pen', label: 'CAPYBARA', animal: 'capy', act: 'wonder' },
      { tx: 9, ty: 5, w: 2, h: 2, kind: 'cart', label: 'ICE CREAM CART', act: 'snack' },
    ],
  },
  aquarium: {
    name: 'SUMIDA AQUARIUM', sub: 'BLUE LIGHT AND VERY SLOW FISH', fee: 8,
    floor: '#2a3550', floorAlt: '#24304a', wall: '#1a2238', wallTop: '#33405e',
    w: 20, h: 12, kind: 'aquarium', dark: true,
    spots: [
      { tx: 2, ty: 2, w: 6, h: 3, kind: 'tank', label: 'THE BIG TANK', act: 'calm' },
      { tx: 12, ty: 2, w: 6, h: 3, kind: 'tank', label: 'JELLYFISH', act: 'calm' },
      { tx: 2, ty: 7, w: 5, h: 3, kind: 'tank', label: 'CORAL WALL', act: 'calm' },
      { tx: 13, ty: 7, w: 5, h: 3, kind: 'tank', label: 'DEEP SEA', act: 'calm' },
      { tx: 9, ty: 5, w: 2, h: 2, kind: 'bench', label: 'A BENCH', act: 'rest' },
    ],
  },
  anime: {
    name: 'ANIME MEGA STORE', sub: 'SEVEN FLOORS. YOU ARE ON THREE.', fee: 0,
    floor: '#e8e2d6', floorAlt: '#ded7c9', wall: '#c85a7a', wallTop: '#e07a96',
    w: 20, h: 12, kind: 'anime',
    spots: [
      { tx: 2, ty: 2, w: 4, h: 2, kind: 'shelf', label: 'FIGURE WALL', act: 'skin' },
      { tx: 8, ty: 2, w: 4, h: 2, kind: 'shelf', label: 'GACHA CORNER', act: 'skin' },
      { tx: 14, ty: 2, w: 4, h: 2, kind: 'shelf', label: 'DOUJIN TABLES', act: 'skin' },
      { tx: 3, ty: 7, w: 5, h: 3, kind: 'rack', label: 'INSTRUMENT DECALS', act: 'skin' },
      { tx: 12, ty: 7, w: 5, h: 3, kind: 'rack', label: 'EFFECT PEDALS', act: 'mod' },
    ],
  },
  arcade: {
    name: 'GAME CENTER', sub: 'FOUR FLOORS OF NOISE', fee: 2,
    floor: '#2e2a3e', floorAlt: '#272338', wall: '#3f2f5a', wallTop: '#5f4a80',
    w: 20, h: 12, kind: 'arcade', dark: true,
    spots: [
      { tx: 2, ty: 2, w: 3, h: 2, kind: 'cab', label: 'CRANE GAME', act: 'crane' },
      { tx: 7, ty: 2, w: 3, h: 2, kind: 'cab', label: 'SHOOTER', act: 'coin' },
      { tx: 12, ty: 2, w: 3, h: 2, kind: 'cab', label: 'FIGHTER', act: 'coin' },
      { tx: 16, ty: 2, w: 3, h: 2, kind: 'cab', label: 'PURIKURA', act: 'coin' },
      { tx: 6, ty: 7, w: 8, h: 3, kind: 'rhythm', label: 'RHYTHM MACHINE', act: 'rhythm' },
    ],
  },
};
class PlaceScene {
  constructor(node) {
    this.node = node;
    this.P = PLACES[node.place] || PLACES.zoo;
    this.t = 0; this.fx = new Particles();
    this.you = Game.run.members[0];
    const P = this.P;
    // the room, in room coordinates: origin so it sits in the middle of the frame
    this.ox = Math.round((W - P.w * PLACE_TILE) / 2);
    this.oy = Math.round((H - 40 - P.h * PLACE_TILE) / 2) + 18;
    this.pos = { x: (P.w / 2) * PLACE_TILE, y: (P.h - 1.2) * PLACE_TILE };
    this.target = null;
    this.keys = new Set();
    this.msg = null; this.msgT = 0;
    this.used = {};                       // one go at each exhibit per visit
    this.paid = false;
    this.leaveBtn = new Btn(W - 168, H - 52, 150, 40, 'LEAVE', () => this.leave(), { scale: 3, color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1410' });
    this.prompt = null;
    this.rng = makeRng(hashStr(node.id) + Game.run.day * 7);
    if (P.fee && Game.run.money >= P.fee) { Game.run.money -= P.fee; this.paid = true; this.flash('PAID ' + fmtMoney(P.fee) + ' TO GET IN'); }
    else if (P.fee) this.flash('NO MONEY FOR A TICKET. THEY LET YOU LOOK.');
    // other people came too, and they wander the room the same as you
    this.visitors = [];
    for (let i = 0; i < 5; i++) this.visitors.push({
      spec: randomBugSpec(makeRng(6100 + i + hashStr(node.id))),
      x: this.rng.range(1.5, P.w - 1.5) * PLACE_TILE, y: this.rng.range(1.5, P.h - 1.5) * PLACE_TILE,
      tx: 0, ty: 0, o: this.rng.range(0, 6), sc: this.rng.range(0.85, 1.15), wait: this.rng.range(0, 2),
    });
    this.bubbles = [];
    for (let i = 0; i < 26; i++) this.bubbles.push({ x: this.rng.range(0, W), y: this.rng.range(0, H), sp: this.rng.range(8, 24), o: this.rng.range(0, 6) });
  }
  flash(m) { this.msg = m; this.msgT = 2.6; }
  leave() { if (this.left) return; this.left = true; Game.run.save(); Game.go(() => new CityScene(), 'iris', { dur: 0.6 }); }
  // ---- the room: which squares you cannot stand on
  blocked(tx, ty) {
    const P = this.P;
    if (tx < 0 || ty < 0 || tx >= P.w || ty >= P.h) return true;
    for (const s of P.spots) if (tx >= s.tx && tx < s.tx + s.w && ty >= s.ty && ty < s.ty + s.h) return true;
    return false;
  }
  spotNear() {
    const P = this.P, tx = this.pos.x / PLACE_TILE, ty = this.pos.y / PLACE_TILE;
    for (const s of P.spots) {
      const cx = s.tx + s.w / 2, cy = s.ty + s.h / 2;
      if (Math.abs(tx - cx) < s.w / 2 + 1 && Math.abs(ty - cy) < s.h / 2 + 1.1) return s;
    }
    return null;
  }
  update(dt) {
    this.t += dt; this.fx.update(dt); this.msgT = Math.max(0, this.msgT - dt);
    const sp = 118 * dt;
    let dx = 0, dy = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy += 1;
    if (!dx && !dy && this.target) {
      const tdx = this.target.x - this.pos.x, tdy = this.target.y - this.pos.y;
      const d = Math.hypot(tdx, tdy);
      if (d < 4) this.target = null; else { dx = tdx / d; dy = tdy / d; }
    }
    if (dx || dy) {
      const n = Math.hypot(dx, dy) || 1;
      this.move(dx / n * sp, dy / n * sp);
      this.facing = dx < -0.3 ? -1 : dx > 0.3 ? 1 : this.facing || 1;
      this.walkT = (this.walkT || 0) + dt;
    }
    this.prompt = this.spotNear();
    for (const b of this.bubbles) { b.y -= b.sp * dt; if (b.y < -10) { b.y = H + 10; b.x = Math.random() * W; } }
    // the other visitors pick a spot, walk to it, and stand there a while
    for (const v of this.visitors) {
      v.wait -= dt;
      if (v.wait <= 0 && !v.goal) {
        const P2 = this.P;
        for (let tries = 0; tries < 12; tries++) {
          const gx = this.rng.range(1, P2.w - 1) * PLACE_TILE, gy = this.rng.range(1, P2.h - 1) * PLACE_TILE;
          if (!this.blocked(Math.floor(gx / PLACE_TILE), Math.floor(gy / PLACE_TILE))) { v.goal = { x: gx, y: gy }; break; }
        }
      }
      if (v.goal) {
        const dx2 = v.goal.x - v.x, dy2 = v.goal.y - v.y, d2 = Math.hypot(dx2, dy2);
        if (d2 < 5) { v.goal = null; v.wait = this.rng.range(1.5, 5); }
        else {
          const step = 42 * dt;
          const nx2 = v.x + dx2 / d2 * step, ny2 = v.y + dy2 / d2 * step;
          if (!this.blocked(Math.floor(nx2 / PLACE_TILE), Math.floor(ny2 / PLACE_TILE))) { v.x = nx2; v.y = ny2; v.face = dx2 < 0 ? -1 : 1; v.walk = (v.walk || 0) + dt; }
          else { v.goal = null; v.wait = this.rng.range(0.5, 2); }
        }
      }
    }
  }
  move(dx, dy) {
    const R = 9;
    const tryX = this.pos.x + dx;
    if (!this.blocked(Math.floor((tryX - R) / PLACE_TILE), Math.floor(this.pos.y / PLACE_TILE)) &&
        !this.blocked(Math.floor((tryX + R) / PLACE_TILE), Math.floor(this.pos.y / PLACE_TILE))) this.pos.x = tryX;
    const tryY = this.pos.y + dy;
    if (!this.blocked(Math.floor(this.pos.x / PLACE_TILE), Math.floor((tryY - R) / PLACE_TILE)) &&
        !this.blocked(Math.floor(this.pos.x / PLACE_TILE), Math.floor((tryY + R) / PLACE_TILE))) this.pos.y = tryY;
  }
  key(code) {
    if (['Escape', 'KeyQ'].includes(code)) { this.leave(); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.interact(); return; }
    this.keys.add(code);
  }
  keyUp(code) { this.keys.delete(code); }
  pointerDown(x, y) {
    if (this.leaveBtn.hit(x, y)) { this.leave(); return; }
    // tapping the thing you are standing at uses it; tapping the floor walks
    const s = this.spotNear();
    if (s) { const r = this.spotRect(s); if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) { this.interact(); return; } }
    this.target = { x: clamp(x - this.ox, 8, this.P.w * PLACE_TILE - 8), y: clamp(y - this.oy, 8, this.P.h * PLACE_TILE - 8) };
  }
  pointerMove() {} pointerUp() {}
  click(x, y) { if (this.leaveBtn.hit(x, y)) this.leave(); }
  hover(x, y) { this.leaveBtn.hover(x, y); }
  spotRect(s) { return { x: this.ox + s.tx * PLACE_TILE, y: this.oy + s.ty * PLACE_TILE, w: s.w * PLACE_TILE, h: s.h * PLACE_TILE }; }
  // ---- what each exhibit actually does for you
  interact() {
    const s = this.prompt; if (!s) return;
    const r = Game.run;
    if (this.used[s.label]) { this.flash('YOU HAVE ALREADY SEEN THAT'); Audio.ui('error'); return; }
    this.used[s.label] = true;
    Audio.ui('select');
    const rect2 = this.spotRect(s);
    this.fx.burst(rect2.x + rect2.w / 2, rect2.y + rect2.h / 2, 14, { color: ['#ffd24a', '#fff'], speed: 90, life: 0.7, kind: 'star', size: 2, gravity: 90 });
    switch (s.act) {
      case 'wonder': {
        r.gratitude = (r.gratitude || 0) + 1;
        for (const m of r.members) m.stamina = Math.min(m.maxStamina || 100, (m.stamina || 0) + 6);
        this.flash(this.rng.pick(['NOBODY SAYS ANYTHING FOR A WHILE.', 'IT LOOKS BACK AT YOU.', 'THAT WAS WORTH THE WALK.']) + '  +1 GRATITUDE');
        break;
      }
      case 'calm': {
        r.gratitude = (r.gratitude || 0) + 1;
        r.stamina = Math.min(r.maxStamina || r.stamina + 8, r.stamina + 8);
        this.flash('THE WHOLE ROOM IS BLUE AND QUIET.  +8 STAMINA, +1 GRATITUDE');
        break;
      }
      case 'rest': { r.stamina = Math.min((r.maxStamina || 999), r.stamina + 12); this.flash('YOU SIT DOWN FOR TEN MINUTES.  +12 STAMINA'); break; }
      case 'snack': { if (r.money >= 4) { r.money -= 4; for (const m of r.members) m.hunger = Math.max(0, (m.hunger || 0) - 1); this.flash('ICE CREAM ALL ROUND.  -$4'); } else this.flash('NOT EVEN FOUR DOLLARS.'); break; }
      case 'coin': { const win = this.rng.chance(0.45); if (win) { const c = this.rng.int(6, 16); r.money += c; this.flash('YOU WIN ' + fmtMoney(c)); Audio.ui('coin'); } else { r.money = Math.max(0, r.money - 2); this.flash('THE MACHINE EATS YOUR COINS. -$2'); } break; }
      case 'crane': { Game.go(() => new CraneScene(this.node), 'fade', { dur: 0.4 }); break; }
      case 'rhythm': { Game.go(() => new ArcadeRhythmScene(this.node), 'fade', { dur: 0.4 }); break; }
      case 'skin': { Game.go(() => new SkinShopScene(this.node, 'skin'), 'slideL', { dur: 0.4 }); break; }
      case 'mod': { Game.go(() => new SkinShopScene(this.node, 'mod'), 'slideL', { dur: 0.4 }); break; }
    }
    Game.run.save();
  }
  // ---------- drawing ----------
  draw(ctx) {
    const P = this.P, t = this.t;
    rect(ctx, 0, 0, W, H, '#05060a');
    // the room floor, in a chequer
    for (let ty = 0; ty < P.h; ty++) for (let tx = 0; tx < P.w; tx++) {
      const X = this.ox + tx * PLACE_TILE, Y = this.oy + ty * PLACE_TILE;
      rect(ctx, X, Y, PLACE_TILE, PLACE_TILE, (tx + ty) % 2 ? P.floor : P.floorAlt);
      ctx.globalAlpha = 0.12; rect(ctx, X, Y, PLACE_TILE, 1, '#ffffff'); rect(ctx, X, Y, 1, PLACE_TILE, '#ffffff'); ctx.globalAlpha = 1;
      if ((tx * 7 + ty * 13) % 11 === 0) { ctx.globalAlpha = 0.1; rect(ctx, X + 6, Y + 8, 6, 3, '#000'); ctx.globalAlpha = 1; }
    }
    // the walls round it, drawn with a top and a side like everything outside
    const RW = P.w * PLACE_TILE, RH = P.h * PLACE_TILE, WT = 16;
    rect(ctx, this.ox - WT, this.oy - WT, RW + WT * 2, WT, P.wallTop);
    rect(ctx, this.ox - WT, this.oy - WT, RW + WT * 2, 3, lighten(P.wallTop, 0.25));
    rect(ctx, this.ox - WT, this.oy - 4, RW + WT * 2, 4, P.wall);
    rect(ctx, this.ox - WT, this.oy - WT, WT, RH + WT * 2, P.wallTop);
    rect(ctx, this.ox + RW, this.oy - WT, WT, RH + WT * 2, P.wallTop);
    rect(ctx, this.ox - 4, this.oy, 4, RH, P.wall);
    rect(ctx, this.ox + RW, this.oy, 4, RH, P.wall);
    rect(ctx, this.ox - WT, this.oy + RH, RW + WT * 2, WT, P.wallTop);
    rect(ctx, this.ox - WT, this.oy + RH, RW + WT * 2, 4, P.wall);
    // the way out, in the bottom wall
    const dx = this.ox + RW / 2 - 24;
    rect(ctx, dx, this.oy + RH, 48, WT, '#1a1620');
    rect(ctx, dx + 2, this.oy + RH + 2, 44, WT - 4, '#2f2838');
    drawText(ctx, 'EXIT', dx + 24, this.oy + RH + 5, '#6be585', { align: 'center', font: 'small' });
    // ---- the exhibits
    for (const s of P.spots) this.drawSpot(ctx, s);
    // ---- everybody else who came today
    for (const v of this.visitors) {
      const vx = this.ox + v.x, vy = this.oy + v.y;
      drawShadow(ctx, vx, vy + 7, 20 * v.sc, 0.28);
      drawBugAt(ctx, v.spec, vx, vy + 9, { pose: v.goal ? (Math.floor((v.walk || 0) * 7) % 2 ? 'walk1' : 'walk2') : 'idle', scale: 1.1 * v.sc, flip: v.face === -1, bounce: 0.6, phase: v.o });
    }
    // ---- you, from above
    const px2 = this.ox + this.pos.x, py2 = this.oy + this.pos.y;
    drawShadow(ctx, px2, py2 + 8, 26, 0.35);
    const walking = this.keys.size > 0 || this.target;
    drawBugAt(ctx, this.you.spec, px2, py2 + 10, {
      pose: walking ? (Math.floor((this.walkT || 0) * 7) % 2 ? 'walk1' : 'walk2') : 'idle',
      scale: 1.5, flip: this.facing === -1, bounce: walking ? 1 : 0.6 });
    // ---- the light in the room, and the dark everywhere else
    if (P.dark) {
      ctx.globalAlpha = 0.34; rect(ctx, this.ox, this.oy, RW, RH, '#0d1730'); ctx.globalAlpha = 1;
      for (const b of this.bubbles) { ctx.globalAlpha = 0.16; circle(ctx, b.x, b.y, 2 + (b.o % 2), '#9fd8ff'); ctx.globalAlpha = 1; }
    }
    vignetteRect(ctx, this.ox - WT, this.oy - WT, RW + WT * 2, RH + WT * 2, 0.4);
    // and the black beyond the walls, with the room's glow leaking into it
    ctx.globalAlpha = 0.2;
    for (let i = 1; i <= 4; i++) frame(ctx, this.ox - WT - i * 3, this.oy - WT - i * 3, RW + WT * 2 + i * 6, RH + WT * 2 + i * 6, P.dark ? '#1a2a4a' : '#2a2418');
    ctx.globalAlpha = 1;
    // ---- the plate along the top, and whatever you are standing in front of
    uiRibbon(ctx, W / 2, 10, P.name, { scale: 3, color: '#7a1a2a' });
    drawText(ctx, P.sub, W / 2, 40, '#cfc9e6', { align: 'center', scale: 2, outline: '#12101c' });
    if (this.prompt) {
      const r2 = this.spotRect(this.prompt);
      frame(ctx, r2.x - 2, r2.y - 2, r2.w + 4, r2.h + 4, Math.sin(t * 8) > 0 ? '#ffd24a' : '#fff8e0');
      const lab = this.prompt.label + (this.used[this.prompt.label] ? '  (SEEN)' : '');
      const w2 = textWidth(lab, { scale: 2 }) + 24;
      rect(ctx, W / 2 - w2 / 2, H - 96, w2, 26, 'rgba(10,8,20,0.85)');
      frame(ctx, W / 2 - w2 / 2, H - 96, w2, 26, '#c8a03a');
      drawText(ctx, lab, W / 2, H - 88, '#ffe9a8', { align: 'center', scale: 2 });
      if (!this.used[this.prompt.label]) drawText(ctx, Game.touch ? 'TAP IT' : 'ENTER', W / 2, H - 66, '#8ad8ff', { align: 'center', font: 'small' });
    }
    this.fx.draw(ctx);
    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = textWidth(this.msg, { scale: 2 }) + 28;
      rect(ctx, W / 2 - w2 / 2, 58, w2, 24, '#152a18'); frame(ctx, W / 2 - w2 / 2, 58, w2, 24, '#6be585');
      drawText(ctx, this.msg, W / 2, 65, '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    this.leaveBtn.draw(ctx);
    drawText(ctx, Game.touch ? 'TAP TO WALK' : 'ARROWS TO WALK', 16, H - 26, '#8a82a8', { font: 'small' });
  }
  drawSpot(ctx, s) {
    const r = this.spotRect(s), t = this.t;
    const X = r.x, Y = r.y, w = r.w, h = r.h;
    ctx.globalAlpha = 0.34; rect(ctx, X + 4, Y + 6, w, h, '#000'); ctx.globalAlpha = 1;
    if (s.kind === 'tank') {
      rect(ctx, X, Y, w, h, '#121a2e');
      rect(ctx, X + 3, Y + 3, w - 6, h - 6, '#1b4f7d');
      vgrad(ctx, X + 3, Y + 3, w - 6, h - 6, '#2f7fc0', '#123a63');
      for (let i = 0; i < 9; i++) {
        const fx2 = X + 8 + ((i * 37 + Math.floor(t * 18 + i * 9)) % (w - 20));
        const fy2 = Y + 10 + ((i * 23) % Math.max(4, h - 20));
        const col = ['#ffd24a', '#ff8a6a', '#8ad8ff', '#f0f0ff'][i % 4];
        rect(ctx, fx2, fy2, 5, 3, col); rect(ctx, fx2 - 2, fy2, 2, 3, darken(col, 0.3));
      }
      for (let i = 0; i < 5; i++) { const bx = X + 10 + i * 13, by = Y + h - 8 - ((t * 22 + i * 30) % (h - 14)); ctx.globalAlpha = 0.5; circle(ctx, bx, by, 2, '#cfe8ff'); ctx.globalAlpha = 1; }
      for (let i = 0; i < 4; i++) rect(ctx, X + 8 + i * 15, Y + h - 12, 4, 9, '#2f7a4a');
      ctx.globalAlpha = 0.16; rect(ctx, X + 3, Y + 3, w - 6, Math.floor(h * 0.4), '#ffffff'); ctx.globalAlpha = 1;
      frame(ctx, X, Y, w, h, '#3f4a60');
    } else if (s.kind === 'pen' || s.kind === 'pool' || s.kind === 'aviary') {
      rect(ctx, X, Y, w, h, s.kind === 'pool' ? '#2f7fc0' : '#6fa84f');
      if (s.kind === 'pool') { for (let i = 0; i < 6; i++) rect(ctx, X + 6 + ((i * 19 + Math.floor(t * 9)) % (w - 14)), Y + 8 + (i % 3) * 9, 7, 2, '#8fd0f0'); }
      else { for (let i = 0; i < 14; i++) rect(ctx, X + 4 + (i * 11) % (w - 8), Y + 5 + (i * 7) % (h - 10), 3, 2, '#4f8a3a'); }
      // the fence round it
      frame(ctx, X, Y, w, h, '#8a7a5e');
      for (let i = 0; i < w; i += 8) rect(ctx, X + i, Y, 2, h, 'rgba(120,100,70,0.5)');
      // and whatever lives in it, asleep or not
      const ax = Math.round(X + w / 2 + Math.sin(t * 0.7) * (w / 4)), ay = Math.round(Y + h / 2 + Math.cos(t * 0.5) * 5);
      ctx.globalAlpha = 0.3; ellipsePx(ctx, ax, ay + 14, 18, 6, '#000'); ctx.globalAlpha = 1;
      if (s.animal === 'panda') {
        ellipsePx(ctx, ax, ay, 20, 16, '#f4f1ea'); ellipsePx(ctx, ax, ay, 18, 14, '#fdfbf6');
        ellipsePx(ctx, ax - 13, ay - 11, 7, 6, '#241f26'); ellipsePx(ctx, ax + 13, ay - 11, 7, 6, '#241f26');
        ellipsePx(ctx, ax - 7, ay - 2, 6, 5, '#241f26'); ellipsePx(ctx, ax + 7, ay - 2, 6, 5, '#241f26');
        rect(ctx, ax - 7, ay - 3, 3, 3, '#fdfbf6'); rect(ctx, ax + 5, ay - 3, 3, 3, '#fdfbf6');
        rect(ctx, ax - 2, ay + 4, 5, 3, '#241f26');
        ellipsePx(ctx, ax - 12, ay + 12, 6, 4, '#241f26'); ellipsePx(ctx, ax + 12, ay + 12, 6, 4, '#241f26');
      } else if (s.animal === 'penguin') {
        ellipsePx(ctx, ax, ay, 11, 16, '#2a2f3e'); ellipsePx(ctx, ax, ay + 2, 7, 12, '#f2efe8');
        ellipsePx(ctx, ax - 9, ay, 4, 8, '#1b2030'); ellipsePx(ctx, ax + 9, ay, 4, 8, '#1b2030');
        rect(ctx, ax - 3, ay - 10, 3, 3, '#1b2030'); rect(ctx, ax + 1, ay - 10, 3, 3, '#1b2030');
        rect(ctx, ax - 2, ay - 5, 5, 3, '#e0a02a');
        rect(ctx, ax - 6, ay + 14, 5, 3, '#e0a02a'); rect(ctx, ax + 2, ay + 14, 5, 3, '#e0a02a');
      } else if (s.animal === 'bird') {
        ellipsePx(ctx, ax, ay, 13, 10, '#e0503a'); ellipsePx(ctx, ax - 2, ay - 2, 9, 7, '#ff7a5a');
        rect(ctx, ax + 11, ay - 2, 7, 4, '#e0a02a');
        rect(ctx, ax + 7, ay - 5, 3, 3, '#241f26');
        for (let i = 0; i < 3; i++) rect(ctx, ax - 16 - i * 3, ay - 4 + i * 3, 7, 3, '#c8402c');
        rect(ctx, ax - 4, ay + 9, 3, 4, '#e0a02a'); rect(ctx, ax + 2, ay + 9, 3, 4, '#e0a02a');
      } else {
        ellipsePx(ctx, ax, ay, 22, 13, '#a8794a'); ellipsePx(ctx, ax, ay - 2, 20, 10, '#bd8a58');
        ellipsePx(ctx, ax + 17, ay - 3, 9, 7, '#a8794a');
        rect(ctx, ax + 20, ay - 5, 3, 3, '#2a1f16'); rect(ctx, ax + 22, ay - 1, 4, 2, '#2a1f16');
        rect(ctx, ax - 10, ay + 10, 5, 4, '#8a5f38'); rect(ctx, ax + 5, ay + 10, 5, 4, '#8a5f38');
      }
    } else if (s.kind === 'shelf' || s.kind === 'rack') {
      rect(ctx, X, Y, w, h, '#8a5f4a');
      rect(ctx, X, Y, w, 4, '#a87a5e');
      for (let row = 0; row < Math.max(1, Math.floor(h / 16)); row++) {
        const ry = Y + 6 + row * 16;
        rect(ctx, X + 2, ry + 10, w - 4, 3, '#6a4530');
        for (let i = 0; i < Math.floor((w - 8) / 9); i++) {
          const bx = X + 5 + i * 9;
          rect(ctx, bx, ry, 7, 10, ['#e8503a', '#4a86f7', '#f2c94c', '#6be585', '#c58bff', '#ff8ad8'][(i + row * 3) % 6]);
          rect(ctx, bx, ry, 7, 2, '#ffffff');
        }
      }
      frame(ctx, X, Y, w, h, '#5a3a28');
    } else if (s.kind === 'cab') {
      rect(ctx, X, Y, w, h, '#1b1830');
      rect(ctx, X + 2, Y + 2, w - 4, h - 12, '#0d0b18');
      const lit = ['#ff5a9a', '#8ad8ff', '#ffd24a', '#6be585'][(s.tx + Math.floor(t * 2)) % 4];
      for (let i = 0; i < 8; i++) rect(ctx, X + 6 + ((i * 13 + Math.floor(t * 20)) % (w - 14)), Y + 6 + (i % 3) * 7, 5, 4, lit);
      rect(ctx, X + 2, Y + h - 9, w - 4, 7, '#3f3550');
      for (let i = 0; i < 3; i++) circle(ctx, X + 8 + i * 10, Y + h - 5, 3, ['#e8503a', '#4a86f7', '#f2c94c'][i]);
      ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 4 + s.tx); ellipsePx(ctx, X + w / 2, Y + h / 2, w, h, lit); ctx.globalAlpha = 1;
      frame(ctx, X, Y, w, h, '#5f4a80');
    } else if (s.kind === 'rhythm') {
      rect(ctx, X, Y, w, h, '#241f38');
      rect(ctx, X + 4, Y + 4, w - 8, h - 22, '#0d0b18');
      for (let i = 0; i < 4; i++) {
        const lx = X + 12 + i * ((w - 24) / 4);
        ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 6 + i); rect(ctx, lx, Y + 8, 14, h - 30, ['#ff5a9a', '#8ad8ff', '#ffd24a', '#6be585'][i]); ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 4; i++) { const px3 = X + 10 + i * ((w - 20) / 4); rect(ctx, px3, Y + h - 16, 20, 12, Math.sin(t * 8 + i) > 0.6 ? '#fff4c0' : '#4a4058'); }
      frame(ctx, X, Y, w, h, '#6a5a90');
    } else if (s.kind === 'bench') {
      rect(ctx, X + 2, Y + h / 2 - 4, w - 4, 10, '#6a5a44'); rect(ctx, X + 2, Y + h / 2 - 4, w - 4, 2, '#8a7a5e');
    } else {                                     // the cart
      rect(ctx, X, Y + 6, w, h - 8, '#f2efe8'); rect(ctx, X, Y + 6, w, 4, '#e8503a');
      circle(ctx, X + 8, Y + h - 2, 4, '#3a3444'); circle(ctx, X + w - 8, Y + h - 2, 4, '#3a3444');
      rect(ctx, X - 2, Y, w + 4, 6, '#e8503a'); rect(ctx, X - 2, Y, w + 4, 2, '#ff8a7a');
    }
    // the little sign in front of every exhibit
    const lw = Math.min(w, textWidth(s.label, { font: 'small' }) + 10);
    rect(ctx, X + w / 2 - lw / 2, Y + h - 3, lw, 9, 'rgba(10,8,20,0.8)');
    drawText(ctx, s.label, X + w / 2, Y + h - 1, '#e8e2f0', { align: 'center', font: 'small' });
  }
}
