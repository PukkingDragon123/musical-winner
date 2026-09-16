// ---------- Inside a building ----------
// Malls and subway stations you actually walk around in. Every room looks a
// lot like the last one, the signs disagree with each other, and going back
// the way you came does not always work — which is what being inside Nakano
// Broadway or Shinjuku station is genuinely like. Somewhere in here is what
// you came for, and somewhere else is the way out.
'use strict';

const EXIT_SIGNS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B4', 'C7', 'C8', 'D2', 'E1', 'JR', 'M4', 'W3', 'S5'];
const MALL_SHOPS = ['USED CD', 'FIGURES', 'MODEL KITS', 'VINTAGE', 'WATCHES', 'DOUJIN', 'CAMERA', 'GAMES',
  'AMERICAN', 'PATCHES', 'PARTS', 'TOYS', 'MANGA', 'STAMPS', 'RECORDS', 'STRINGS'];

function buildInterior(node, rng) {
  const metro = node.interior === 'metro';
  const n = metro ? 9 : 8;
  const rooms = [];
  for (let i = 0; i < n; i++) {
    rooms.push({
      i, kind: metro ? rng.pick(['concourse', 'passage', 'passage', 'platform']) : rng.pick(['arcade', 'arcade', 'stairwell']),
      sign: metro ? rng.pick(EXIT_SIGNS) : (rng.int(1, 4) + 'F'),
      shops: metro ? [] : [0, 1, 2].map(() => rng.pick(MALL_SHOPS)),
      seed: rng.int(0, 9999), links: {},
    });
  }
  // Wire it up deliberately badly: left and right rarely undo each other, and
  // two of the rooms loop back on themselves.
  for (let i = 0; i < n; i++) {
    rooms[i].links.right = (i + 1 + rng.int(0, 1)) % n;
    rooms[i].links.left = (i + n - 1 - rng.int(0, 1)) % n;
    if (rng.chance(0.4)) rooms[i].links.down = rng.int(0, n - 1);
  }
  // What you came for, and the way out: never the same room, and never the one
  // you walked in on, or the whole building would be one step deep.
  const goalRoom = rng.int(2, n - 1);
  let exitRoom = rng.int(1, n - 1);
  if (exitRoom === goalRoom || exitRoom === 0) exitRoom = ((goalRoom + 3) % (n - 1)) + 1;
  if (exitRoom === goalRoom) exitRoom = ((goalRoom + 4) % (n - 1)) + 1;
  rooms[goalRoom].goal = true;
  rooms[exitRoom].exit = true;
  return { rooms, start: 0, metro, goalRoom, exitRoom };
}

class InteriorScene {
  constructor(node) {
    const r = Game.run;
    this.node = node; this.t = 0; this.fx = new Particles();
    this.rng = makeRng(hashStr(node.id + '|' + r.day));
    this.map = buildInterior(node, this.rng);
    this.at = this.map.start; this.moves = 0; this.walkT = 0; this.dir = 1;
    this.msg = null; this.msgT = 0; this.done = false;
    this.metro = this.map.metro;
    this.intro = sceneIntro([
      { name: node.name, tint: '#8ad8ff', text: this.metro
        ? 'Eleven exits, four of them closed, and a sign for every one of them pointing a different way. Somewhere down here is the platform.'
        : 'Four floors of shops the size of wardrobes, and a stairwell that does not go where the sign says. The one you want is in here somewhere.' },
    ]);
  }
  get room() { return this.map.rooms[this.at]; }
  go(dirName) {
    if (this.done) return;
    const r = Game.run, to = this.room.links[dirName];
    if (to == null) { Audio.ui('error'); this.say('No way through.'); return; }
    // walking a building costs you, the same as walking the city does
    r.stamina = Math.max(0, r.stamina - 2);
    this.moves++; this.at = to; this.walkT = 0.35; this.dir = dirName === 'left' ? -1 : 1;
    Audio.ui('move');
    if (this.room.goal) this.say(this.metro ? 'THE PLATFORM. Finally.' : 'THIS IS THE ONE.');
    else if (this.room.exit) this.say('The way out.');
    if (r.stamina <= 0) { this.say('Everyone is done in.'); this.leave(); }
  }
  say(m) { this.msg = m; this.msgT = 2.2; }
  enterGoal() {
    const r = Game.run;
    this.done = true; r.save();
    // what is actually in here
    if (this.metro) Game.go(() => new GigScene(Object.assign({}, this.node, { type: 'venue', venue: 'metro' })), 'iris');
    else Game.go(() => new ShopScene(Object.assign({}, this.node, { type: 'shop', stock: null })), 'iris');
  }
  leave() { this.done = true; Game.run.save(); Game.go(() => new CityScene(), 'slideR'); }
  update(dt) {
    this.t += dt; this.fx.update(dt);
    if (introUpdate(this, dt)) return;
    this.walkT = Math.max(0, this.walkT - dt);
    if (this.msgT > 0) this.msgT -= dt;
  }
  key(code) {
    if (this.intro) { if (['Enter', 'Space', 'KeyZ', 'Escape'].includes(code)) introTap(this); return; }
    if (code === 'ArrowLeft' || code === 'KeyA') this.go('left');
    else if (code === 'ArrowRight' || code === 'KeyD') this.go('right');
    else if (code === 'ArrowDown' || code === 'KeyS') this.go('down');
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) { if (this.room.goal) this.enterGoal(); else if (this.room.exit) this.leave(); }
    else if (code === 'Escape') this.leave();
  }
  click(x, y) {
    if (introTap(this)) return;
    for (const b of (this.buttons || [])) if (b.hit(x, y)) { b.onTap(); return; }
  }
  hover() { }
  draw(ctx) {
    const R = this.room, rr = makeRng(R.seed);
    const floorY = 386;
    if (this.metro) this.drawMetro(ctx, R, rr, floorY); else this.drawMall(ctx, R, rr, floorY);
    // the band, walking
    const wob = this.walkT > 0 ? Math.round(Math.sin(this.t * 26) * 4) : 0;
    drawParty(ctx, 150, floorY + wob, this.t, this.walkT > 0 ? null : 'idle');
    this.fx.draw(ctx);
    // ---- the read-outs
    const head = this.metro ? 'EXIT ' + R.sign : R.sign + '  -  ' + this.node.name;
    uiRibbon(ctx, W / 2, 30, head, { scale: 3, color: this.metro ? '#3f6fb0' : '#8a4fd0' });
    // how lost you are, which is the only number that matters in here
    const p = uiPanel(ctx, 18, 74, 214, 64);
    drawText(ctx, 'ROOMS WALKED', p.x + 10, p.y + 8, UI.inkSoft, { font: 'small' });
    drawText(ctx, String(this.moves), p.x + 10, p.y + 20, '#7a4a10', { scale: 4 });
    ctx.drawImage(icon('fire'), p.x + 150, p.y + 20, 16, 18);
    drawText(ctx, String(Math.round(Game.run.stamina)), p.x + 172, p.y + 24, '#7a4a10', { scale: 3 });
    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = textWidth(this.msg, { scale: 2 }) + 28;
      rect(ctx, W / 2 - w2 / 2, 150, w2, 30, '#12101c'); frame(ctx, W / 2 - w2 / 2, 150, w2, 30, '#ffd24a');
      drawText(ctx, this.msg, W / 2, 160, '#ffd24a', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    // ---- the controls: big, because this is the whole interaction
    this.buttons = [];
    const bw = 150, bh = 52, by = H - bh - 12;
    const mk = (x, label, fn, col) => { const b = new Btn(x, by, bw, bh, label, fn, col ? { color: col.c, hi: col.h, lo: col.l, ol: col.o } : {}); this.buttons.push(b); b.draw(ctx); };
    mk(20, '< LEFT', () => this.go('left'));
    mk(20 + bw + 10, 'RIGHT >', () => this.go('right'));
    if (R.links.down != null) mk(20 + (bw + 10) * 2, this.metro ? 'DOWN' : 'STAIRS', () => this.go('down'),
      { c: '#4d86c6', h: '#86b6e8', l: '#2f5a8a', o: '#1a3050' });
    if (R.goal) mk(W - bw - 20, this.metro ? 'GET ON' : 'GO IN', () => this.enterGoal(), { c: UI.gold, h: UI.goldHi, l: UI.goldLo, o: '#20180a' });
    else if (R.exit) mk(W - bw - 20, 'LEAVE', () => this.leave(), { c: UI.red, h: UI.redHi, l: UI.redLo, o: '#4a1a14' });
    Game.drawHud(ctx);
    introDraw(this, ctx);
  }
  // ---- a mall floor: a corridor of tiny shops, all lit, all cluttered
  drawMall(ctx, R, rr, floorY) {
    vgrad(ctx, 0, 0, W, H, '#2a2436', '#1a1626');
    // ceiling tiles and strip lights
    rect(ctx, 0, 0, W, 76, '#3a3448');
    for (let x = 0; x < W; x += 48) { rect(ctx, x, 4, 44, 2, '#4a4458'); rect(ctx, x + 8, 30, 28, 6, '#f4f0d8'); ctx.globalAlpha = 0.1; rect(ctx, x + 2, 36, 40, 70, '#f4f0d8'); ctx.globalAlpha = 1; }
    // the run of shop fronts
    for (let i = 0; i < 3; i++) {
      const x = 246 + i * 240, w = 210, top = 108;
      rect(ctx, x, top, w, floorY - top, '#241f30');
      rect(ctx, x + 6, top + 34, w - 12, floorY - top - 46, '#3e3550');
      // the shutter box and the name board
      rect(ctx, x, top, w, 30, '#5a4a6a'); rect(ctx, x, top, w, 3, '#7a6a8a');
      drawText(ctx, R.shops[i], x + w / 2, top + 10, '#f4ecd8', { align: 'center', scale: 2 });
      // goods on shelves, different every room
      for (let s = 0; s < 3; s++) {
        const sy = top + 48 + s * 34;
        rect(ctx, x + 14, sy + 18, w - 28, 3, '#6a5a7a');
        for (let k = 0; k < 7; k++) {
          const gx = x + 20 + k * ((w - 44) / 7), c = ['#e0503c', '#e8b840', '#3f6fb0', '#6be585', '#c58bff', '#f0f0e8'][rr.int(0, 5)];
          const gh = rr.int(8, 16);
          rect(ctx, gx, sy + 18 - gh, rr.int(7, 13), gh, c);
          rect(ctx, gx, sy + 18 - gh, rr.int(7, 13), 2, lighten(c, 0.3));
        }
      }
      // a light spilling out of the doorway
      ctx.globalAlpha = 0.12; rect(ctx, x + 6, top + 34, w - 12, floorY - top - 46, '#ffe6a0'); ctx.globalAlpha = 1;
    }
    // the floor
    rect(ctx, 0, floorY, W, H - floorY, '#4a4258');
    rect(ctx, 0, floorY, W, 4, '#6a6078');
    for (let x = 0; x < W; x += 34) rect(ctx, x, floorY + 6, 30, 2, 'rgba(0,0,0,0.16)');
    // signage that disagrees with itself
    for (let i = 0; i < 2; i++) {
      const sx = 300 + i * 380;
      rect(ctx, sx, 60, 130, 26, '#1e6a3a'); frame(ctx, sx, 60, 130, 26, '#7ac49a');
      drawText(ctx, rr.chance(0.5) ? 'EXIT  >' : '<  EXIT', sx + 65, 68, '#f0fff4', { align: 'center', scale: 2 });
    }
    // other shoppers, drifting
    for (let i = 0; i < 4; i++) {
      const sx = ((i * 260 + this.t * (18 + i * 7)) % (W + 120)) - 60;
      drawShadow(ctx, sx, floorY + 4, 22);
      drawBugAt(ctx, MYSTERY_BUGS.crowd[i % MYSTERY_BUGS.crowd.length], sx, floorY + 4, { pose: Math.floor(this.t * 5 + i) % 2 ? 'walk1' : 'walk2', scale: 1.2, flip: i % 2 === 0 });
    }
  }
  // ---- a station: tiled passages, numbered exits, a map nobody can read
  drawMetro(ctx, R, rr, floorY) {
    vgrad(ctx, 0, 0, W, H, '#2c2e3c', '#1a1c26');
    // tiled walls
    for (let y = 60; y < floorY; y += 16) for (let x = (y / 16 % 2) * 16; x < W; x += 32) {
      rect(ctx, x, y, 30, 14, '#4a4f62'); rect(ctx, x, y, 30, 1, '#5e6478');
    }
    rect(ctx, 0, 0, W, 60, '#22242e');
    for (let i = 0; i < 7; i++) { rect(ctx, 40 + i * 130, 26, 84, 6, '#eef4ff'); ctx.globalAlpha = 0.1; rect(ctx, 24 + i * 130, 32, 116, 70, '#cfe0ff'); ctx.globalAlpha = 1; }
    if (R.kind === 'platform') {
      // the platform edge, the tracks, and a train in the tunnel
      rect(ctx, 0, floorY - 96, W, 96, '#1a1c26');
      rect(ctx, 0, floorY - 96, W, 3, '#3a3e4c');
      const tx = ((this.t * 120) % (W + 700)) - 350;
      rect(ctx, tx, floorY - 90, 320, 80, '#7a8090'); rect(ctx, tx, floorY - 90, 320, 5, '#aab0c0');
      for (let i = 0; i < 4; i++) rect(ctx, tx + 16 + i * 78, floorY - 76, 58, 38, '#1a2434');
      rect(ctx, tx, floorY - 40, 320, 4, '#4aa0d0');
      rect(ctx, 0, floorY - 14, W, 14, '#8a8880');
      for (let x = 0; x < W; x += 12) rect(ctx, x, floorY - 12, 8, 8, '#d8c020');
    } else {
      // a wall of exit signs, each insisting on a different direction
      for (let i = 0; i < 3; i++) {
        const sx = 90 + i * 280;
        rect(ctx, sx, 96, 190, 40, '#1e3f6a'); frame(ctx, sx, 96, 190, 40, '#6a9fd0');
        drawText(ctx, EXIT_SIGNS[(R.seed + i) % EXIT_SIGNS.length], sx + 12, 106, '#ffd24a', { scale: 3 });
        drawText(ctx, rr.chance(0.5) ? 'THIS WAY  >' : '<  THIS WAY', sx + 96, 112, '#dfe8ff', { scale: 2 });
      }
      // a route map nobody has ever successfully read
      const mx = 420, my = 182;
      rect(ctx, mx, my, 210, 128, '#f2efe4'); frame(ctx, mx, my, 210, 128, '#7a7466');
      for (let i = 0; i < 7; i++) {
        const col = ['#c8402c', '#2a7ac8', '#3f9a52', '#d9a520', '#8a4fd0', '#c8608a', '#40a8b0'][i];
        const y0 = my + 16 + i * 15;
        for (let k = 0; k < 9; k++) rect(ctx, mx + 12 + k * 22, y0 + Math.round(Math.sin(k + i) * 4), 22, 3, col);
        for (let k = 0; k < 4; k++) rect(ctx, mx + 16 + k * 48, y0 - 1 + Math.round(Math.sin(k * 2 + i) * 4), 5, 5, '#ffffff');
      }
    }
    rect(ctx, 0, floorY, W, H - floorY, '#5a5a62');
    rect(ctx, 0, floorY, W, 4, '#74747e');
    for (let x = 0; x < W; x += 26) rect(ctx, x, floorY + 8, 22, 2, 'rgba(0,0,0,0.14)');
    // commuters, all of them faster than you
    for (let i = 0; i < 6; i++) {
      const sx = ((i * 190 + this.t * (40 + i * 11)) % (W + 140)) - 70;
      drawShadow(ctx, sx, floorY + 4, 20);
      drawBugAt(ctx, MYSTERY_BUGS.office[i % MYSTERY_BUGS.office.length], sx, floorY + 4, { pose: Math.floor(this.t * 7 + i) % 2 ? 'walk1' : 'walk2', scale: 1.15, flip: i % 3 === 0 });
    }
  }
}
