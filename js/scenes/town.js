// ---------- Shop, events, rest, treasure, night, band, endings ----------
'use strict';
function drawTownBackdrop(ctx, t, kind, seed) {
  const r = Game.run; const [c1, c2] = skyColors(kind === 'night' ? 0.95 : clamp(0.1 + r.day * 0.12, 0, 0.6)); vgrad(ctx, 0, 0, W, H, c1, c2);
  ctx.drawImage(skylineCanvas(seed || 5, W, 110, { color: kind === 'night' ? '#1e1a3a' : '#8a90a8', lit: '#ffe6a0', density: kind === 'night' ? 0.35 : 0.1 }), 0, 220);
  let x = -10; const rr = makeRng(seed || 5); let i = 0; while (x < W + 20) { const w = rr.int(60, 108); const f = facadeCanvas(['victorian', 'pastel', 'brick'][i % 3], (seed || 5) * 7 + i, w); ctx.drawImage(f, x, 392 - f.height * 1.45, w * 1.45, f.height * 1.45); x += w * 1.45 + 2; i++; }
  rect(ctx, 0, 392, W, 50, '#a8a49a'); rect(ctx, 0, 392, W, 3, '#c8c4b8'); for (let sx = 0; sx < W; sx += 38) rect(ctx, sx, 395, 2, 48, 'rgba(0,0,0,0.12)'); rect(ctx, 0, 442, W, 98, '#3f3f48'); for (let sx = 0; sx < W; sx += 48) rect(ctx, sx, 488, 26, 3, '#d8c860');
  ctx.drawImage(propCanvas(kind === 'night' ? 'lamp' : 'lampOff'), 44, 326, 17, 67); ctx.drawImage(treeCanvas('round', Game.wind.frame()), 840, 314, 58, 81);
  if (kind === 'night') { ctx.globalAlpha = 0.14; circle(ctx, 52, 356, 58, '#ffe680'); ctx.globalAlpha = 1; }
}
function drawParty(ctx, x, y, t, pose) { const r = Game.run; r.members.forEach((m, i) => { drawShadow(ctx, x + i * 52, y, 34); drawBugAt(ctx, m.spec, x + i * 52, y + Math.round(Math.sin(t * 3 + i)), { pose: pose || (Math.floor(t * 2 + i) % 3 ? 'idle' : 'play'), instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.4 }); }); }

// ---------- Shop ----------
// ---------- What a shop has in it, and what happens when you buy it ----------
// Lifted out of the scene so the walkable shop and the old counter are the
// same shop, stocked the same way.
function shopStock(node) {
  const r = Game.run, rng = r.rng, pm = 1 + r.day * 0.1; const stock = [];
  const ex = []; for (let i = 0; i < 2; i++) { const k = r.randomCharm(ex); if (k) { ex.push(k); stock.push({ kind: 'charm', key: k, price: Math.round(CHARMS[k].price * pm) }); } }
  const vk = rng.shuffle(VOUCHER_KEYS.filter(k => !r.vouchers.includes(k)))[0]; if (vk) stock.push({ kind: 'voucher', key: vk, price: Math.round(VOUCHERS[vk].price * pm) });
  for (const k of rng.shuffle(CONSUMABLE_KEYS).slice(0, 2)) stock.push({ kind: 'use', key: k, price: Math.round(CONSUMABLES[k].price * pm) });
  const me = r.members[0], myQ = me.quality || 1;
  if (myQ < 5) { const q = Math.min(5, myQ + (r.day >= 2 ? 2 : 1)); stock.push({ kind: 'upgrade', key: me.instrument, quality: q, price: Math.round(INSTRUMENTS[me.instrument].price * (0.5 + q * 0.45) * pm) }); }
  const ik = rng.pick(PLAYABLE.filter(k => k !== me.instrument)); const q2 = rng.int(2, Math.min(4, 2 + r.day)); stock.push({ kind: 'instrument', key: ik, quality: q2, price: Math.round(INSTRUMENTS[ik].price * (0.7 + q2 * 0.3) * pm) });
  if (rng.chance(0.5) && r.members.length < 6) { const m = r.makeMember(); stock.push({ kind: 'recruit', member: m, price: 18 + r.day * 7 + m.skill * 2 }); }
  stock.push({ kind: 'rest', key: 'coffee', price: 4 + r.day, restores: 18 });
  node.rerolls = node.rerolls || 0;
  return stock;
}
function shopBuy(r, s) {
  r.money -= s.price; s.sold = true; Audio.ui('cash');
  if (s.kind === 'charm') { r.addCharm(s.key); return 'Bought ' + CHARMS[s.key].name + '. ' + CHARMS[s.key].desc; }
  if (s.kind === 'voucher') { r.vouchers.push(s.key); VOUCHERS[s.key].apply(r); return VOUCHERS[s.key].name + ' redeemed. ' + VOUCHERS[s.key].desc; }
  if (s.kind === 'use') { r.consumables.push(s.key); return 'Bought ' + CONSUMABLES[s.key].name + '.'; }
  if (s.kind === 'upgrade') { const m = r.members[0]; m.quality = s.quality; r.today.upgrades = (r.today.upgrades || 0) + 1; checkGoals(r); return s.key === 'drums' ? 'You are behind a ' + KIT_LADDER[clamp(s.quality, 1, 5)].name.toLowerCase() + ' now.' : 'Your ' + INSTRUMENTS[s.key].name + ' is now ' + gearTier(s.quality).name + '.'; }
  if (s.kind === 'instrument') { const m = r.members[0]; r.spareInstruments.push({ kind: m.instrument, quality: m.quality }); m.instrument = s.key; m.quality = s.quality; return 'You now play ' + INSTRUMENTS[s.key].name + '. Your old one is a spare.'; }
  if (s.kind === 'recruit') { r.members.push(s.member); r.today.recruited = (r.today.recruited || 0) + 1; checkGoals(r); return s.member.name + ' joins the band!'; }
  if (s.kind === 'rest') { r.rest(s.restores); s.sold = false; s.price += 2; Audio.ui('eat'); return 'Back on your feet. +' + s.restores + ' stamina.'; }
  return '';
}
// what a piece of stock is called and looks like on a shelf
function stockLabel(s) {
  if (s.kind === 'charm') return { title: CHARMS[s.key].name.toUpperCase(), desc: CHARMS[s.key].desc, icon: CHARMS[s.key].icon || 'star' };
  if (s.kind === 'voucher') return { title: VOUCHERS[s.key].name.toUpperCase(), desc: VOUCHERS[s.key].desc, icon: 'note' };
  if (s.kind === 'use') return { title: CONSUMABLES[s.key].name.toUpperCase(), desc: CONSUMABLES[s.key].desc, icon: CONSUMABLES[s.key].icon || 'food' };
  if (s.kind === 'upgrade') return { title: 'UPGRADE: ' + INSTRUMENTS[s.key].name.toUpperCase(), desc: 'Your own instrument, rebuilt to ' + gearTier(s.quality).name + '.', icon: 'gig' };
  if (s.kind === 'instrument') return { title: INSTRUMENTS[s.key].name.toUpperCase(), desc: 'Second hand, ' + gearTier(s.quality).name + '. You would switch to it.', icon: 'gig' };
  if (s.kind === 'recruit') return { title: (s.member.name || 'SOMEBODY').toUpperCase(), desc: 'Wants to join. Plays ' + (INSTRUMENTS[s.member.instrument] ? INSTRUMENTS[s.member.instrument].name : s.member.instrument) + '.', icon: 'openmic' };
  if (s.kind === 'rest') return { title: 'CANNED COFFEE', desc: 'Hot, from the machine. +' + s.restores + ' stamina.', icon: 'food' };
  return { title: 'SOMETHING', desc: '', icon: 'star' };
}
class ShopScene {
  constructor(node) {
    this.node = node; const r = Game.run; this.t = 0;
    if (!node.stock) { node.rerolls = 0; this.restock(); }
    this.sel = 0; this.msg = 'Irasshaimase. Everything here is slightly overpriced. It is Tokyo.';
    this.buttons = [];
    // You walk in and somebody says something, instead of a shelf of prices
    // appearing out of nowhere.
    const rr = makeRng(hashStr('hello|' + node.id));
    const hello = SHOP_HELLO[rr.int(0, SHOP_HELLO.length - 1)];
    this.owner = castMember('shop|' + node.id);
    this.intro = sceneIntro([
      { name: node.name, text: hello[1], tint: '#8ad8ff' },
      { name: hello[0], spec: this.owner, text: 'She gestures at the whole shop with a magazine and goes back to reading it.', tint: '#ffd24a', flip: true },
    ]);
  }
  restock() { this.node.stock = shopStock(this.node); }
  get items() { return this.node.stock.filter(s => !s.sold); }
  rerollPrice() { return Math.max(1, 5 + this.node.rerolls * 2 - (Game.run.perks.rerollDiscount || 0)); }
  cardLabel(s) { if (s.kind === 'rest') return 'COFFEE BREAK'; if (s.kind === 'upgrade') return s.key === 'drums' ? KIT_LADDER[clamp(s.quality, 1, 5)].name : gearTier(s.quality).name + ' ' + INSTRUMENTS[s.key].name; return s.kind === 'charm' ? CHARMS[s.key].name : s.kind === 'voucher' ? VOUCHERS[s.key].name : s.kind === 'use' ? CONSUMABLES[s.key].name : s.kind === 'instrument' ? INSTRUMENTS[s.key].name + ' ' + '★'.repeat(s.quality) : 'HIRE ' + s.member.name; }
  cardDesc(s) { if (s.kind === 'rest') return 'Sit down, drink it hot. Back on your feet with +' + s.restores + ' stamina.'; if (s.kind === 'upgrade') { const t = gearTier(s.quality); if (s.key === 'drums') { const rung = KIT_LADDER[clamp(s.quality, 1, 5)]; return t.desc + ' ' + rung.pieces.map(p => PIECE_LABEL[p]).join(', ').toLowerCase() + '. Pays x' + t.pay.toFixed(2) + '.'; } return t.desc + ' Pays x' + t.pay.toFixed(2) + (t.laneCut ? '' : ', full ' + INSTRUMENTS[s.key].lanes + ' lanes') + '.'; } return s.kind === 'charm' ? CHARMS[s.key].desc : s.kind === 'voucher' ? VOUCHERS[s.key].desc + ' (permanent)' : s.kind === 'use' ? CONSUMABLES[s.key].desc : s.kind === 'instrument' ? INSTRUMENTS[s.key].desc + ' Quality stars raise applause.' : s.member.spec.species + ' with a ' + INSTRUMENTS[s.member.instrument].name + ', skill ' + s.member.skill + '. Bandmates take spotlights and add Mult, but eat dinner too.'; }
  canBuy(s) { const r = Game.run; if (r.money < s.price) return 'Not enough cash.'; if (s.kind === 'rest' && r.stamina >= r.staminaMax) return 'Nobody is tired yet.'; if (s.kind === 'charm' && r.charms.length >= r.charmSlots) return 'No charm slots free. Sell one in BAND & BAG.'; if (s.kind === 'use' && r.consumables.length >= 6) return 'Your pockets are full.'; if (s.kind === 'recruit' && r.members.length >= 6) return 'The band is full.'; return null; }
  buy(s) {
    const r = Game.run; const why = this.canBuy(s); if (why) { this.msg = why; Audio.ui('error'); return; }
    this.msg = shopBuy(r, s);
    this.sel = Math.min(this.sel, Math.max(0, this.items.length - 1)); r.save();
  }
  reroll() { const r = Game.run; const p = this.rerollPrice(); if (r.money < p) { this.msg = 'Not enough cash to reroll.'; Audio.ui('error'); return; } r.money -= p; this.node.rerolls++; this.restock(); this.sel = 0; Audio.ui('select'); this.msg = 'Fresh stock!'; }
  update(dt) { this.t += dt; introUpdate(this, dt); }
  key(code) {
    if (this.intro) { if (['Enter', 'Space', 'KeyZ', 'Escape'].includes(code)) introTap(this); return; }
    const n = this.items.length;
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + n) % Math.max(1, n); Audio.ui('move'); }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % Math.max(1, n); Audio.ui('move'); }
    else if (['Enter', 'Space'].includes(code)) { const s = this.items[this.sel]; if (s) this.buy(s); }
    else if (code === 'KeyR') this.reroll(); else if (code === 'Escape' || code === 'KeyL') Game.go(() => new CityScene(), 'slideR');
  }
  click(x, y) {
    if (introTap(this)) return;
    for (const b of this.buttons) if (b.hit(x, y)) { b.onTap(); return; }
    (this.cards || []).forEach((c) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === c.i) this.buy(this.items[c.i]); else { this.sel = c.i; Audio.ui('move'); } } });
  }
  hover(x, y) { this.cards && this.cards.forEach((c) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = c.i; }); }
  // Where each piece of stock physically sits in the room.
  displaySpots() {
    const items = this.items, out = [];
    // three hang on the pegboard, the rest stand on the counter
    const peg = [[116, 140], [236, 140], [356, 140]];
    const top = [[560, 318], [664, 318], [768, 318]];
    items.forEach((s, i) => {
      const p = i < 3 ? peg[i] : top[Math.min(2, i - 3)];
      out.push({ s, i, x: p[0], y: p[1], hung: i < 3 });
    });
    return out;
  }
  itemArt(s) {
    if (s.kind === 'instrument' || s.kind === 'upgrade') return itemForInstrument(s.key);
    if (s.kind === 'rest') return 'coffee';
    if (s.kind === 'use') return ({ bread: 'bread', coffee: 'coffee', burrito: 'burrito' })[s.key] || 'bottle';
    if (s.kind === 'voucher') return 'book';
    if (s.kind === 'charm') return ({ tipJar: 'tipjar', luckyPick: 'pick', drumsticks: 'drums', shield: 'strings' })[s.key] || 'star';
    return 'bag';
  }
  draw(ctx) {
    const r = Game.run, t = this.t;
    // ---- room shell
    vgrad(ctx, 0, 0, W, 340, '#5c4a63', '#463a52');
    for (let x = 0; x < W; x += 26) { rect(ctx, x, 26, 1, 314, '#3f3549'); rect(ctx, x + 13, 26, 1, 314, '#6a5872'); }
    rect(ctx, 0, 0, W, 26, '#33293d'); rect(ctx, 0, 24, W, 4, '#251d2e');
    rect(ctx, 0, 316, W, 8, '#6d5a3c'); rect(ctx, 0, 316, W, 3, '#8f7650');
    // ceiling lamps throwing pools on the floor
    for (const lx of [200, 480, 760]) {
      rect(ctx, lx - 1, 0, 2, 16, '#2a2232');
      const m = 1 + Math.sin(t * 2 + lx) * 0.02;
      ctx.fillStyle = '#c8b06a'; ctx.beginPath(); ctx.moveTo(lx - 16 * m, 30); ctx.lineTo(lx + 16 * m, 30); ctx.lineTo(lx + 9, 16); ctx.lineTo(lx - 9, 16); ctx.closePath(); ctx.fill();
      circle(ctx, lx, 29, 5, '#fff4c0');
      lightPool(ctx, lx, 40, 150, '#ffe6a0', 0.13);
    }
    // ---- floor
    vgrad(ctx, 0, 324, W, H - 324, '#6a4a34', '#432c1f');
    for (let i = 0; i < 22; i++) { const k = i / 22; line(ctx, W / 2 + (k - 0.5) * W * 0.7, 324, W / 2 + (k - 0.5) * W * 2.4, H, '#3a2417'); }
    for (let y = 348; y < H; y += 30) { ctx.globalAlpha = 0.3; rect(ctx, 0, y, W, 1, '#33200f'); ctx.globalAlpha = 1; }
    // ---- pegboard wall of instruments (left)
    rect(ctx, 24, 44, 424, 250, '#c8a266'); frame(ctx, 24, 44, 424, 250, '#7a5a30');
    rect(ctx, 27, 47, 418, 244, '#d8b378');
    for (let py = 56; py < 286; py += 12) for (let px2 = 36; px2 < 440; px2 += 12) px(ctx, px2, py, '#a8854c');
    rect(ctx, 24, 44, 424, 4, '#e2c48f'); rect(ctx, 24, 290, 424, 4, '#6a4a24');
    // guitars and gear hanging as stock, so the wall is never bare
    {
      const rr = makeRng(19);
      const hang = ['guitar', 'bass', 'violin', 'trumpet', 'sax'];
      for (let i = 0; i < hang.length; i++) {
        const hx = 66 + i * 80, hy = 240;
        rect(ctx, hx - 1, hy - 46, 2, 18, '#8a7048'); circle(ctx, hx, hy - 48, 3, '#c8ccd8');
        ctx.save(); ctx.translate(hx, hy); ctx.rotate(Math.sin(this.t * 0.6 + i) * 0.025);
        ctx.drawImage(itemCanvas(hang[i]), 0, 0, 32, 32, -28, -28, 56, 56);
        ctx.restore();
      }
      // a rack of picks and strings pinned along the bottom rail
      for (let i = 0; i < 9; i++) { const px2 = 62 + i * 40; ctx.drawImage(itemCanvas(rr.chance(0.5) ? 'pick' : 'strings'), 0, 0, 32, 32, px2, 268, 20, 20); }
    }
    // shop name board over the pegboard
    rect(ctx, 108, 30, 256, 26, '#2f4a38'); frame(ctx, 108, 30, 256, 26, '#1c2e22');
    rect(ctx, 110, 32, 252, 2, '#4e7059');
    drawText(ctx, 'AMOEBUG RECORDS', 236, 38, '#f3e6c0', { align: 'center', scale: 2, shadow: '#16241b' });
    // ---- shelving (right)
    rect(ctx, 500, 44, 436, 250, '#6b4a2c'); frame(ctx, 500, 44, 436, 250, '#3f2a17');
    rect(ctx, 504, 48, 428, 242, '#7d5834');
    for (let i = 0; i < 4; i++) {
      const sy = 92 + i * 52;
      rect(ctx, 504, sy, 428, 6, '#5b3c22'); rect(ctx, 504, sy, 428, 2, '#9a7047');
      // goods on the shelf, deterministic per row
      const rr = makeRng(31 + i * 7);
      for (let x = 514; x < 924; x += rr.int(30, 46)) {
        const kind = rr.pick(['box', 'box', 'bottle', 'record', 'amp', 'book']);
        if (kind === 'box') { const w = rr.int(16, 26), h = rr.int(18, 30), c = rr.pick(['#c4402f', '#3f7fa8', '#d8a83a', '#4f8a56', '#8a5a9a']);
          rect(ctx, x, sy - h, w, h, c); rect(ctx, x, sy - h, w, 2, lighten(c, 0.25)); rect(ctx, x, sy - 3, w, 3, darken(c, 0.2));
          rect(ctx, x + 3, sy - h + 5, w - 6, 5, '#f2ead6'); }
        else if (kind === 'bottle') { ctx.drawImage(itemCanvas('bottle'), 0, 0, 32, 32, x, sy - 30, 30, 30); }
        else if (kind === 'record') { circle(ctx, x + 12, sy - 12, 11, '#241c28'); circle(ctx, x + 12, sy - 12, 4, rr.pick(['#e0b84a', '#c4402f', '#3f7fa8'])); circle(ctx, x + 12, sy - 12, 1, '#241c28'); }
        else if (kind === 'amp') { ctx.drawImage(itemCanvas('amp'), 0, 0, 32, 32, x, sy - 28, 28, 28); }
        else { ctx.drawImage(itemCanvas('book'), 0, 0, 32, 32, x, sy - 28, 28, 28); }
      }
    }
    // framed pictures between the two walls
    for (let i = 0; i < 3; i++) {
      const fx2 = 456, fy = 60 + i * 76;
      rect(ctx, fx2, fy, 38, 52, '#8a6a3a'); frame(ctx, fx2, fy, 38, 52, '#4a3418');
      rect(ctx, fx2 + 4, fy + 4, 30, 44, i === 1 ? '#2a3a5a' : '#e8dcc0');
      if (i === 1) { circle(ctx, fx2 + 19, fy + 22, 9, '#e0b84a'); circle(ctx, fx2 + 19, fy + 22, 2, '#2a3a5a'); }
      else { drawBugAt(ctx, i ? HERO_PRESETS.duke : HERO_PRESETS.merc, fx2 + 19, fy + 46, { pose: 'cheer', scale: 0.62, bounce: 0 }); }
    }
    // ---- the shopkeeper, standing behind where the counter will be
    const cty = 336;
    drawShadow(ctx, 838, 404, 40, 0.22);
    drawBugAt(ctx, HERO_PRESETS.gary, 838, 404, { pose: 'idle', scale: 2.1, expr: 'happy', rate: 1.3 });
    // ---- counter
    rect(ctx, 0, cty, W, 16, '#8a5f36'); rect(ctx, 0, cty, W, 4, '#b5834f');
    rect(ctx, 0, cty + 16, W, 74, '#5e3d22');
    for (let x = 0; x < W; x += 64) { rect(ctx, x, cty + 20, 2, 66, '#472d18'); rect(ctx, x + 30, cty + 30, 28, 40, '#6a4728'); frame(ctx, x + 30, cty + 30, 28, 40, '#472d18'); }
    rect(ctx, 0, cty + 88, W, 4, '#3a2414');
    // counter clutter: register, tip jar, funko, receipts, plant
    rect(ctx, 60, cty - 34, 52, 34, '#4a4756'); rect(ctx, 62, cty - 32, 48, 14, '#8fd0e0'); rect(ctx, 66, cty - 12, 40, 8, '#2e2c38');
    for (let i = 0; i < 4; i++) rect(ctx, 68 + i * 9, cty - 10, 6, 4, '#c8ccd8');
    ctx.drawImage(itemCanvas('tipjar'), 0, 0, 32, 32, 136, cty - 40, 40, 40);
    if (Math.sin(t * 1.4) > 0.9) { ctx.globalAlpha = 0.6; circle(ctx, 156, cty - 30, 10, '#ffe6a0'); ctx.globalAlpha = 1; }
    drawText(ctx, 'TIPS', 156, cty + 2, '#f0d8a0', { align: 'center', font: 'small' });
    ctx.drawImage(itemCanvas('funko'), 0, 0, 32, 32, 196, cty - 42, 42, 42);
    rect(ctx, 196, cty - 4, 42, 5, '#c4402f');
    rect(ctx, 252, cty - 12, 26, 12, '#f2ead6'); rect(ctx, 252, cty - 12, 26, 2, '#d8cfb4'); rect(ctx, 264, cty - 22, 2, 12, '#8a8a98');
    rect(ctx, 872, cty - 22, 22, 22, '#a8643a'); circle(ctx, 883, cty - 30, 12, '#4f8a56'); circle(ctx, 876, cty - 34, 6, '#6fae72');
    // ---- other shoppers, browsing
    const shoppers = this._shoppers || (this._shoppers = (() => { const rr = makeRng(77); return [0, 1, 2].map(i => ({ spec: randomBugSpec(rr), x: 150 + i * 250, o: rr.range(0, 6) })); })());
    shoppers.forEach((sh, i) => {
      const x = sh.x + Math.sin(t * 0.5 + sh.o) * 22;
      drawShadow(ctx, x, 494, 34, 0.24);
      drawBugAt(ctx, sh.spec, x, 494, { pose: Math.floor(t * 1.2 + i) % 3 === 0 ? 'point' : 'idle', flip: Math.cos(t * 0.5 + sh.o) < 0, scale: 1.5, rate: 1.7, phase: sh.o });
    });
    // ---- your band, waiting by the door
    drawParty(ctx, 150, 516, t);
    // ---- the stock, as objects you can actually see
    const spots = this.displaySpots();
    this.cards = [];
    spots.forEach((sp) => {
      const sel = sp.i === this.sel, s = sp.s;
      const lift = sel ? Math.round(Math.sin(t * 5) * 2) - 3 : 0;
      const y = sp.y + lift;
      if (sp.hung) { rect(ctx, sp.x - 1, sp.y - 44, 2, 20, '#6a5a3a'); circle(ctx, sp.x, sp.y - 46, 3, '#c8ccd8'); }
      if (s.kind === 'recruit') {
        drawShadow(ctx, sp.x, y + 34, 34, 0.25);
        drawBugAt(ctx, s.member.spec, sp.x, y + 34, { pose: sel ? 'cheer' : 'idle', expr: sel ? 'happy' : null, instrument: s.member.instrument, scale: 1.5, rate: sel ? 3.4 : 1.6 });
      } else {
        uiItemSlot(ctx, sp.x - 27, y - 27, 54, this.itemArt(s), { selected: sel });
      }
      // price tag on a string
      const price = fmtMoney(s.price), afford = r.money >= s.price;
      const tw = textWidth(price) + 12;
      rect(ctx, sp.x - tw / 2, y + 30, tw, 13, afford ? '#f3e6c0' : '#b0a894'); frame(ctx, sp.x - tw / 2, y + 30, tw, 13, '#6a5a3a');
      drawText(ctx, price, sp.x, y + 33, afford ? '#3a2a1a' : '#7a7060', { align: 'center' });
      this.cards.push({ x: sp.x - 30, y: y - 32, w: 60, h: 74, i: sp.i });
    });
    if (!spots.length) drawText(ctx, 'SOLD OUT', W / 2, 150, '#f4efe0', { align: 'center', scale: 3, outline: '#1a1410' });
    // ---- atmosphere
    this.motes || (this.motes = new Motes(22, 31));
    this.motes.update(1 / 60, t); this.motes.draw(ctx, t, '#ffe6b0');
    grade(ctx, 0, 0, W, H, '#ffc98a', 0.1);
    vignette(ctx, 0.42);
    // ---- one line of chrome, no more
    const sItem = this.items[this.sel];
    rect(ctx, 0, H - 40, W, 40, 'rgba(24,18,28,0.88)'); rect(ctx, 0, H - 40, W, 2, '#c8a03a');
    if (sItem) {
      uiItemSlot(ctx, 8, H - 37, 34, sItem.kind === 'recruit' ? 'bag' : this.itemArt(sItem), {});
      drawText(ctx, this.cardLabel(sItem).toUpperCase(), 50, H - 34, '#ffd98a', { scale: 2 });
      drawText(ctx, this.cardDesc(sItem).slice(0, 78), 50, H - 15, '#cfc6b0', { font: 'small' });
      const why = this.canBuy(sItem);
      if (why) drawText(ctx, why, 50, H - 15, '#ff8a7a', { font: 'small' });
    } else drawText(ctx, this.msg, 12, H - 22, '#cfc6b0');
    this.buttons = [
      new Btn(W - 300, H - 34, 92, 28, 'BUY', () => { const it = this.items[this.sel]; if (it) this.buy(it); }, { scale: 2 }),
      new Btn(W - 202, H - 34, 104, 28, 'REROLL ' + fmtMoney(this.rerollPrice()), () => this.reroll(), { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050' }),
      new Btn(W - 92, H - 34, 84, 28, 'LEAVE', () => Game.go(() => new CityScene(), 'slideR'), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14', scale: 2 }),
    ];
    for (const b of this.buttons) b.draw(ctx);
    Game.drawHud(ctx);
    introDraw(this, ctx);
  }
}
// ---------- Event ----------
class EventScene {
  constructor(node) {
    const r = Game.run; let pool = EVENTS.filter(e => !r.seenEvents.includes(e.id) && (!e.req || e.req(r)));
    if (!pool.length) { r.seenEvents = r.seenEvents.filter(id => EVENTS.find(e => e.id === id && e.once)); pool = EVENTS.filter(e => !r.seenEvents.includes(e.id) && (!e.req || e.req(r))); }
    if (!pool.length) pool = EVENTS.filter(e => !e.once);
    this.ev = r.rng.pick(pool); r.seenEvents.push(this.ev.id); this.log = []; this.done = false; this.t = 0;
    this.menu = new Menu(this.ev.choices.map(c => ({ label: c.label, disabled: c.req ? !c.req(r) : false, onSelect: () => { c.apply(r, (s) => this.log.push(s)); this.done = true; r.save(); this.menu = new Menu([{ label: 'CONTINUE', onSelect: () => Game.go(() => new CityScene(), 'slideR') }]); } })));
  }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); } click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawTownBackdrop(ctx, this.t, 'day', hashStr(this.ev.id) % 50 + 1); drawParty(ctx, 90, 442, this.t);
    if (this.ev.id === 'exmate') drawBugAt(ctx, HERO_PRESETS.slim, 780, 442, { pose: 'idle', instrument: 'bass', flip: true, scale: 1.5 });
    if (this.ev.id === 'cop') drawBugAt(ctx, Object.assign({}, HERO_PRESETS.stag, { outfit: { tee: '#2a3a8a', hat: 'cap', hatColor: '#1a2a6a' } }), 780, 442, { pose: 'idle', flip: true, scale: 1.5 });
    const inner = uiPanel(ctx, 90, 44, W - 180, 300, { title: this.ev.title.toUpperCase() });
    ctx.drawImage(icon(this.ev.icon), inner.x + 14, inner.y + 10, 36, 32);
    let y = inner.y + 10; y += drawWrapped(ctx, this.ev.text, inner.x + 60, y, 76, UI.ink, 14) + 12;
    if (!this.done) { drawText(ctx, 'WHAT DO YOU DO?', inner.x + 14, y, '#7a4a10'); y += 16; this.menu.draw(ctx, inner.x + 14, y, inner.w - 28, Game.touch ? 24 : 22, 'list'); }
    else { for (const l of this.log) y += drawWrapped(ctx, l, inner.x + 14, y, 90, '#7a4a10', 14) + 6; this.menu.draw(ctx, inner.x + 14, Math.max(y + 8, inner.y + inner.h - 34), inner.w - 28, 24, 'list'); }
    Game.drawHud(ctx);
  }
}
// ---------- Rest ----------
class RestScene {
  constructor(node) {
    const r = Game.run; this.t = 0; this.log = null;
    this.menu = new Menu([
      { label: 'Nap: +45 stamina for all', icon: 'rest', onSelect: () => { r.members.forEach(m => m.stamina = Math.min(100, m.stamina + 45)); this.finish('EVERYONE IS RESTED'); } },
      { label: 'Top up the train pass: +2 rides', icon: 'phone', onSelect: () => { r.tickets += 2; this.finish('+2 TRAIN RIDES'); } },
      { label: 'Jam: +1 skill to your weakest', icon: 'metronome', onSelect: () => { const m = r.members.slice().sort((a, b) => a.skill - b.skill)[0]; m.skill = Math.min(10, m.skill + 1); r.members.forEach(x => x.stamina = Math.max(0, x.stamina - 10)); Audio.ui('levelup'); this.finish(m.name.toUpperCase() + ' LEVELLED UP'); } },
    ]);
  }
  finish(msg) { this.log = msg; Audio.ui('select'); Game.run.save(); this.menu = new Menu([{ label: 'CONTINUE', onSelect: () => Game.go(() => new CityScene(), 'slideR') }]); }
  update(dt) { this.t += dt; } key(code) { this.menu.key(code); } click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const [c1, c2] = skyColors(0.35); vgrad(ctx, 0, 0, W, H, c1, c2); circle(ctx, 780, 90, 24, '#fff0a0'); ctx.drawImage(skylineCanvas(8, W, 90, { color: '#8a90a8', lit: '#fff', density: 0.05 }), 0, 255);
    rect(ctx, 0, 330, W, 210, '#5aa050'); rect(ctx, 0, 330, W, 3, '#7ac060'); for (let i = 0; i < 90; i++) rect(ctx, (i * 53) % W, 338 + (i * 17) % 196, 3, 2, '#7fb85a');
    for (let i = 0; i < 7; i++) ctx.drawImage(treeCanvas(['round', 'palm', 'light', 'cypress', 'round', 'pine', 'round'][i], Game.wind.frame(i)), 16 + i * 140, 250, 58, 81); ctx.drawImage(propCanvas('bench'), 640, 396, 45, 21);
    drawParty(ctx, 170, 452, this.t, this.log ? 'idle' : null);
    const inner = uiPanel(ctx, 60, 40, W - 120, 176, { title: 'A QUIET MOMENT' });
    if (!this.log) { drawText(ctx, 'A patch of grass in the sun. How do you spend the afternoon?', inner.x + 14, inner.y + 10, UI.ink); this.menu.draw(ctx, inner.x + 14, inner.y + 30, inner.w - 28, Game.touch ? 24 : 22, 'list'); }
    else { drawWrapped(ctx, this.log, inner.x + 14, inner.y + 14, 96, '#7a4a10', 14, { scale: 2 }); this.menu.draw(ctx, inner.x + 14, inner.y + inner.h - 34, inner.w - 28, 24, 'list'); }
    Game.drawHud(ctx);
  }
}
// ---------- Treasure ----------
class TreasureScene {
  constructor(node) {
    const r = Game.run; this.t = 0; const picks = []; for (let i = 0; i < 3; i++) { const k = r.randomCharm(picks); if (k) picks.push(k); } this.picks = picks; this.sel = 0;
    this.items = picks.map(k => ({ label: CHARMS[k].name, key: k })); this.items.push({ label: 'Take $30 instead', cash: 30 });
  }
  choose(i) { const r = Game.run; const it = this.items[i]; if (it.key) { if (!r.addCharm(it.key)) { Audio.ui('error'); this.msg = 'No free charm slot!'; return; } Audio.ui('fanfare'); } else { r.money += it.cash; Audio.ui('cash'); } r.save(); Game.go(() => new CityScene(), 'slideR'); }
  update(dt) { this.t += dt; }
  key(code) { if (code === 'ArrowLeft' || code === 'ArrowUp') { this.sel = (this.sel + this.items.length - 1) % this.items.length; Audio.ui('move'); } else if (code === 'ArrowRight' || code === 'ArrowDown') { this.sel = (this.sel + 1) % this.items.length; Audio.ui('move'); } else if (['Enter', 'Space'].includes(code)) this.choose(this.sel); }
  click(x, y) { this.cards && this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.choose(i); else this.sel = i; } }); }
  hover(x, y) { this.click.call({ cards: this.cards, sel: -1, choose: () => { }, items: this.items }, x, y); this.cards && this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; }); }
  draw(ctx) {
    drawTownBackdrop(ctx, this.t, 'day', 21); drawParty(ctx, 90, 442, this.t);
    uiRibbon(ctx, W / 2, 36, 'LOST & FOUND', { scale: 4 });
    drawText(ctx, 'TAKE ONE', W / 2, 86, '#f4efe0', { align: 'center', scale: 2, outline: '#1a1410' });
    this.cards = []; const cw = 166, gap = 18, total = this.items.length * (cw + gap) - gap; const x0 = Math.round((W - total) / 2);
    this.items.forEach((it, i) => {
      const x = x0 + i * (cw + gap), y = 116 - (i === this.sel ? 8 : 0); this.cards.push({ x, y, w: cw, h: 200 });
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 5, y + 6, cw, 200); rect(ctx, x, y, cw, 200, i === this.sel ? UI.goldHi : UI.woodLo); rect(ctx, x + 3, y + 3, cw - 6, 194, UI.paper);
      if (it.key) { const c = CHARMS[it.key]; rect(ctx, x + 3, y + 3, cw - 6, 14, { common: '#4d86c6', uncommon: '#4f8032', rare: '#c8433a' }[c.rarity]); drawText(ctx, c.rarity.toUpperCase(), x + cw / 2, y + 6, '#fff', { align: 'center' }); uiSlot(ctx, x + cw / 2 - 26, y + 26, 52); ctx.drawImage(icon(c.icon), x + cw / 2 - 18, y + 36, 36, 32); drawWrapped(ctx, c.name.toUpperCase(), x + 8, y + 88, 15, UI.ink, 13); drawWrapped(ctx, c.desc, x + 8, y + 124, 24, UI.inkSoft, 11); }
      else { ctx.drawImage(icon('money'), x + cw / 2 - 24, y + 40, 48, 24); drawText(ctx, '$30', x + cw / 2, y + 88, UI.ink, { align: 'center', scale: 3 }); drawText(ctx, 'DINNER MONEY', x + cw / 2, y + 124, UI.inkSoft, { align: 'center' }); }
    });
    if (this.msg) drawText(ctx, this.msg, W / 2, 340, '#ff9f68', { align: 'center', scale: 2, outline: '#1a1410' });
    Game.drawHud(ctx);
  }
}
// ---------- Night: dinner ----------
class NightScene {
  constructor() {
    const r = Game.run; this.t = 0; this.phase = 'dinner'; this.log = []; this.fx = new Particles();
    const price = r.mealPrice(), n = r.members.length, total = price * n; const canFeed = Math.min(n, Math.floor(r.money / price));
    this.menu = new Menu([
      { label: 'Full meal for everyone', right: fmtMoney(total), icon: 'food', disabled: r.money < total, onSelect: () => { r.money -= total; r.members.forEach(m => { m.hunger = 0; m.stamina = Math.min(100, m.stamina + 65); }); Audio.ui('eat'); this.log.push('Mission burritos the size of a bug. Everyone is fed and happy.'); this.morning(); } },
      { label: 'Feed the hungriest ' + canFeed + ', others go without', right: fmtMoney(price * canFeed), icon: 'bread', disabled: canFeed === 0 || canFeed === n, onSelect: () => { const sorted = r.members.slice().sort((a, b) => b.hunger - a.hunger || a.stamina - b.stamina); sorted.forEach((m, i) => { if (i < canFeed) { m.hunger = 0; m.stamina = Math.min(100, m.stamina + 65); } else { m.hunger++; m.stamina = Math.min(100, m.stamina + 25); } }); r.money -= price * canFeed; Audio.ui('eat'); this.log.push(canFeed + ' ate. ' + sorted.slice(canFeed).map(m => m.name).join(', ') + ' went hungry.'); this.morning(); } },
      { label: 'Cheap snacks for all (hunger unchanged)', right: fmtMoney(Math.ceil(price / 2) * n), icon: 'bar', disabled: r.money < Math.ceil(price / 2) * n, onSelect: () => { r.money -= Math.ceil(price / 2) * n; r.members.forEach(m => m.stamina = Math.min(100, m.stamina + 40)); Audio.ui('eat'); this.log.push('Vending machine chips. Nobody is full, nobody starves.'); this.morning(); } },
      { label: 'Skip dinner (everyone +1 hunger)', icon: 'skull', onSelect: () => { r.members.forEach(m => { m.hunger++; m.stamina = Math.min(100, m.stamina + 25); }); Audio.ui('sad'); this.log.push('Stomachs growl in a minor key.'); this.morning(); } },
    ]);
  }
  morning() {
    const r = Game.run; this.phase = 'morning'; const leaving = r.members.filter(m => m.hunger >= 2);
    for (const m of leaving) { if (m.leader) { this.gameOver = 'You collapsed from hunger on a Mission sidewalk. The orchestra disbands before it began.'; continue; } r.members.splice(r.members.indexOf(m), 1); this.log.push(m.name + ' the ' + m.spec.species + ' left at dawn to find food elsewhere.'); }
    if (!this.gameOver && r.members.some(m => m.hunger === 1)) this.log.push('Hungry bugs play with shaky hands (smaller timing windows).');
    r.day++; r.nightPending = false; r.newDay();
    if (!this.gameOver) this.log.push('A new day. ' + DAY_NAMES[Math.min(4, r.day)] + ' awaits.'); r.save();
    this.menu = new Menu([{ label: this.gameOver ? '...' : 'CONTINUE TO THE MAP', onSelect: () => { if (this.gameOver) Game.setScene(new GameOverScene(this.gameOver)); else Game.go(() => new CityScene(), 'slideR'); } }]);
  }
  update(dt) { this.t += dt; this.fx.update(dt); if (this.phase === 'dinner' && Math.random() < dt * 8) this.fx.add({ x: 480 + (Math.random() - 0.5) * 12, y: 452, vx: (Math.random() - 0.5) * 14, vy: -58 - Math.random() * 40, life: 0.8, kind: 'fire', size: 4, gravity: -26 }); }
  key(code) { this.menu.key(code); } click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const r = Game.run;
    if (this.phase === 'dinner') {
      drawTownBackdrop(ctx, this.t, 'night', 17);
      grade(ctx, 0, 0, W, H, '#101a4a', 0.3);
      rect(ctx, 450, 452, 60, 9, '#5a3a1e'); rect(ctx, 459, 446, 42, 6, '#3a2410');
      this.fx.draw(ctx);
      lightPool(ctx, 480, 444, 190, '#ffa040', 0.2 + 0.05 * Math.sin(this.t * 8));
      lightPool(ctx, 480, 452, 90, '#ffd08a', 0.18);
    }
    else { const [c1, c2] = skyColors(0.05); vgrad(ctx, 0, 0, W, H, c1, c2); drawTownBackdrop(ctx, this.t, 'day', 17); grade(ctx, 0, 0, W, H, '#ffc27a', 0.14); }
    r.members.forEach((m, i) => {
      const x = 330 + i * 60, fed = this.phase === 'morning' && m.hunger === 0;
      drawShadow(ctx, x, 452, 32);
      drawBugAt(ctx, m.spec, x, 452, { pose: fed ? 'cheer' : m.hunger >= 2 ? 'sad' : 'idle', expr: fed ? 'happy' : m.hunger >= 2 ? 'sad' : null, flip: x > 480, scale: 1.5, rate: fed ? 4 : 1.6, phase: i * 1.5, bounce: fed ? 2.2 : 0.7 });
      if (fed) ctx.drawImage(icon('heart'), x - 6, 372 + Math.round(Math.sin(this.t * 3 + i) * 3), 13, 11);
    });
    vignette(ctx, this.phase === 'dinner' ? 0.55 : 0.3);
    const inner = uiPanel(ctx, 60, 40, W - 120, this.phase === 'dinner' ? 170 : 200, { title: this.phase === 'dinner' ? 'NIGHTFALL - END OF DAY ' + (r.day + 1) : 'MORNING' });
    if (this.phase === 'dinner') {
      drawText(ctx, 'DINNER: ' + fmtMoney(r.mealPrice()) + ' PER BUG.   YOU HAVE ' + fmtMoney(r.money), inner.x + 14, inner.y + 10, UI.ink, { scale: 2 });
      drawText(ctx, 'A full meal resets hunger. STARVING bugs leave at dawn.', inner.x + 14, inner.y + 34, UI.inkSoft);
      this.menu.draw(ctx, inner.x + 14, inner.y + 54, inner.w - 28, Game.touch ? 26 : 24, 'list');
      const hungry = r.members.filter(m => m.hunger > 0); if (hungry.length) drawText(ctx, 'HUNGRY: ' + hungry.map(m => m.name + (m.hunger >= 2 ? '!' : '')).join(', '), inner.x + 14, inner.y + inner.h - 18, '#b02a2a');
    } else { let y = inner.y + 12; for (const l of this.log) y += drawWrapped(ctx, l, inner.x + 14, y, 92, UI.ink, 14) + 6; this.menu.draw(ctx, inner.x + 14, inner.y + inner.h - 34, inner.w - 28, 24, 'list'); }
    Game.drawHud(ctx);
  }
}
// ---------- Band & bag ----------
class BandScene {
  constructor() { this.sel = 0; this.tab = 'band'; this.t = 0; this.buildMenu(); }
  buildMenu() {
    const r = Game.run; const m = r.members[this.sel]; const items = [];
    const seen = new Set();
    r.consumables.forEach((k, i) => { const c = CONSUMABLES[k]; if (c.target !== 'member' || seen.has(k)) return; seen.add(k); items.push({ label: 'Use ' + c.name + ' on ' + m.name, icon: c.icon, onSelect: () => { const idx = r.consumables.indexOf(k); r.consumables.splice(idx, 1); this.msg = c.use(r, m); Audio.ui('eat'); this.buildMenu(); } }); });
    r.spareInstruments.forEach((s, i) => items.push({ label: 'Give ' + INSTRUMENTS[s.kind].name + ' ' + '★'.repeat(s.quality) + ' to ' + m.name, icon: 'case', onSelect: () => { const old = { kind: m.instrument, quality: m.quality }; m.instrument = s.kind; m.quality = s.quality; r.spareInstruments.splice(i, 1, old); this.msg = m.name + ' now plays ' + INSTRUMENTS[s.kind].name + '.'; this.buildMenu(); } }));
    r.charms.forEach(k => items.push({ label: 'Sell ' + CHARMS[k].name, right: '+' + fmtMoney(Math.floor(CHARMS[k].price / 2)), icon: CHARMS[k].icon, onSelect: () => { r.money += Math.floor(CHARMS[k].price / 2); r.removeCharm(k); Audio.ui('cash'); this.msg = 'Sold ' + CHARMS[k].name + '.'; this.buildMenu(); } }));
    if (r.members.length > 1 && !m.leader) items.push({ label: 'Part ways with ' + m.name, icon: 'skull', onSelect: () => { r.members.splice(this.sel, 1); this.sel = 0; this.msg = 'Farewell.'; this.buildMenu(); } });
    items.push({ label: 'Sound: ' + (Game.muted ? 'OFF' : 'ON'), icon: 'metronome', onSelect: () => { Game.muted = !Game.muted; Audio.setMuted(Game.muted); this.buildMenu(); } });
    items.push({ label: 'Back to map', icon: 'arrowL', onSelect: () => { r.save(); Game.go(() => new CityScene(), 'slideR'); } });
    this.menu = new Menu(items);
  }
  update(dt) { this.t += dt; }
  key(code) { const r = Game.run; if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + r.members.length) % r.members.length; this.buildMenu(); Audio.ui('move'); return; } if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % r.members.length; this.buildMenu(); Audio.ui('move'); return; } if (code === 'Escape' || code === 'Tab') { r.save(); Game.go(() => new CityScene(), 'slideR'); return; } this.menu.key(code); }
  click(x, y) { Game.run.members.forEach((m, i) => { if (x >= 24 + i * 150 && x < 24 + i * 150 + 142 && y >= 44 && y < 188) { this.sel = i; this.buildMenu(); Audio.ui('move'); } }); this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); this.hoverCharm = -1; Game.run.charms.forEach((k, i) => { if (x >= 28 + i * 46 && x < 68 + i * 46 && y >= 214 && y < 254) this.hoverCharm = i; }); }
  draw(ctx) {
    const r = Game.run; drawTownBackdrop(ctx, this.t, 'day', 31);
    r.members.forEach((m, i) => {
      const x = 24 + i * 150, sel = i === this.sel; const inner = uiPanel(ctx, x, 44, 142, 144, { title: m.name.toUpperCase() + (m.leader ? ' *' : '') });
      drawBugAt(ctx, m.spec, x + 38, inner.y + 84, { pose: sel ? 'play' : 'idle', instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.4 });
      drawText(ctx, m.spec.species, x + 68, inner.y + 8, UI.inkSoft, { font: 'small' }); drawText(ctx, INSTRUMENTS[m.instrument].name, x + 68, inner.y + 20, '#7a4a10');
      drawText(ctx, 'SKILL ' + m.skill, x + 68, inner.y + 36, UI.ink); uiBar(ctx, x + 68, inner.y + 50, 64, 7, m.xp / 3, '#8a5ad0');
      uiBar(ctx, x + 68, inner.y + 62, 64, 9, m.stamina / 100, m.stamina > 50 ? '#6fbf4a' : m.stamina > 25 ? '#ffd166' : '#ff5a5a', { label: 'STA' });
      drawText(ctx, ['FED', 'HUNGRY', 'STARVING'][Math.min(2, m.hunger)], x + 68, inner.y + 78, ['#4f8032', '#b07030', '#b02a2a'][Math.min(2, m.hunger)], { font: 'small' });
      if (sel) { frame(ctx, x - 2, 42, 146, 148, UI.goldHi); frame(ctx, x - 3, 41, 148, 150, '#d9a520'); }
    });
    drawText(ctx, 'ABILITIES  ' + r.charms.length + '/' + r.charmSlots, 28, 200, '#f4efe0', { outline: '#1a1410' });
    for (let i = 0; i < r.charmSlots; i++) { const k = r.charms[i]; uiItemSlot(ctx, 28 + i * 46, 214, 42, k ? charmArt(CHARMS[k].icon) : null, { empty: !k, selected: this.hoverCharm === i }); }
    drawText(ctx, 'ITEMS', 360, 200, '#f4efe0', { outline: '#1a1410' }); r.consumables.forEach((k, i) => { uiSlot(ctx, 360 + i * 46, 214, 40); ctx.drawImage(icon(CONSUMABLES[k].icon), 360 + i * 46 + 12, 226, 18, 16); });
    drawText(ctx, 'VOUCHERS', 660, 200, '#f4efe0', { outline: '#1a1410' }); r.vouchers.forEach((k, i) => { uiSlot(ctx, 660 + i * 46, 214, 40); ctx.drawImage(icon(VOUCHERS[k].icon), 660 + i * 46 + 12, 226, 18, 16); });
    const inner = uiPanel(ctx, 24, 266, W - 48, H - 280);
    const m = r.members[this.sel];
    const tip = this.hoverCharm >= 0 && r.charms[this.hoverCharm] ? CHARMS[r.charms[this.hoverCharm]].name.toUpperCase() + ': ' + CHARMS[r.charms[this.hoverCharm]].desc : INSTRUMENTS[m.instrument].name.toUpperCase() + ' (' + INSTRUMENTS[m.instrument].keyNames.join(' ') + '): ' + INSTRUMENTS[m.instrument].desc;
    drawWrapped(ctx, tip, inner.x + 14, inner.y + 8, 96, '#7a4a10', 13);
    this.menu.draw(ctx, inner.x + 14, inner.y + 44, Math.min(inner.w - 28, 600), Game.touch ? 24 : 22, 'list');
    if (this.msg) drawText(ctx, this.msg, inner.x + inner.w - 14, inner.y + inner.h - 16, UI.inkSoft, { align: 'right' });
    drawText(ctx, Game.touch ? 'TAP A BUG' : 'LEFT/RIGHT   ESC: BACK', inner.x + inner.w - 14, inner.y + 8, UI.inkFaint, { align: 'right' });
    Game.drawHud(ctx);
  }
}
class GameOverScene {
  constructor(reason) { this.reason = reason; this.t = 0; RunState.clearSave(); Audio.ui('sad'); this.btn = new Btn(W / 2 - 100, 400, 200, 30, 'BACK TO TITLE', () => { Game.run = null; Game.setScene(new TitleScene()); }); }
  update(dt) { this.t += dt; } key(code) { if (['Enter', 'Space', 'Escape'].includes(code)) this.btn.onTap(); } click(x, y) { if (this.btn.hit(x, y) || !Game.touch) this.btn.onTap(); }
  draw(ctx) { const r = Game.run; drawTownBackdrop(ctx, this.t, 'night', 3); ctx.globalAlpha = 0.6; rect(ctx, 0, 0, W, H, '#100c14'); ctx.globalAlpha = 1; if (r) drawBugAt(ctx, r.members[0].spec, W / 2, 470, { pose: 'sad', instrument: r.members[0].instrument, scale: 2, expr: 'sad' }); uiRibbon(ctx, W / 2, 60, 'THE SHOW IS OVER', { scale: 4 }); const inner = uiPanel(ctx, 180, 130, W - 360, 200); drawWrapped(ctx, this.reason, inner.x + 16, inner.y + 14, 58, UI.ink, 15); if (r) { drawText(ctx, 'DAYS ' + (r.day + 1) + '   GIGS ' + r.stats.gigs, inner.x + 16, inner.y + 110, UI.inkSoft); drawText(ctx, 'EARNED ' + fmtMoney(r.stats.earned) + '   BEST COMBO ' + r.stats.bestCombo, inner.x + 16, inner.y + 130, UI.inkSoft); } this.btn.draw(ctx); }
}
class VictoryScene {
  constructor() { this.t = 0; const r = Game.run; RunState.clearSave(); Audio.ui('fanfare'); Audio.roar(3, 0.6); this.fx = new Particles(); this.btn = new Btn(W / 2 - 110, 450, 220, 30, 'PLAY AGAIN', () => { Game.run = null; Game.setScene(new TitleScene()); }); }
  update(dt) { this.t += dt; this.fx.update(dt); if (Math.random() < dt * 26) this.fx.add({ x: Math.random() * W, y: -5, vx: (Math.random() - 0.5) * 34, vy: 34 + Math.random() * 44, life: 6, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][Math.floor(Math.random() * 5)], kind: 'confetti', gravity: 10 }); }
  key(code) { if (['Enter', 'Space'].includes(code)) this.btn.onTap(); }
  click(x, y) { if (this.btn.hit(x, y) || !Game.touch) this.btn.onTap(); }
  draw(ctx) {
    const r = Game.run; const [c1, c2] = skyColors(0.6); vgrad(ctx, 0, 0, W, H, c1, c2);
    ctx.drawImage(landmarkCanvas('rainbow'), -60, 70, 690, 240); ctx.drawImage(landmarkCanvas('rainbow'), 630, 70, 690, 240);
    rect(ctx, 0, 310, W, 230, '#5a5a6a'); rect(ctx, 0, 310, W, 6, '#c8432a');
    r.members.forEach((m, i) => { const x = W / 2 - (r.members.length - 1) * 34 + i * 68; drawShadow(ctx, x, 460, 36); drawBugAt(ctx, m.spec, x, 460 + Math.round(Math.sin(this.t * 6 + i) * 3), { pose: 'cheer', instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.7 }); });
    drawBugAt(ctx, HERO_PRESETS.merc, 860, 460, { pose: 'idle', instrument: 'mic', flip: true, scale: 1.7, expr: 'sad' });
    this.fx.draw(ctx);
    uiRibbon(ctx, W / 2, 26, 'ENCORE!', { scale: 6, color: '#d9a520' });
    const inner = uiPanel(ctx, 230, 110, W - 460, 190);
    ctx.drawImage(icon('coin'), inner.x + 20, inner.y + 34, 22, 20); drawText(ctx, fmtMoney(r.money), inner.x + 52, inner.y + 20, '#2a7a3a', { scale: 5 });
    drawText(ctx, 'EARNED ' + fmtMoney(r.stats.earned) + '   GIGS ' + r.stats.gigs, inner.x + 20, inner.y + 96, UI.ink);
    drawText(ctx, 'BEST COMBO ' + r.stats.bestCombo + '   BAND OF ' + r.members.length, inner.x + 20, inner.y + 116, UI.ink);
    this.btn.draw(ctx);
  }
}
function drawNightCity(ctx, t, opts = {}) {
  const [c1, c2] = skyColors(opts.sky != null ? opts.sky : 0.92); vgrad(ctx, 0, 0, W, H, c1, c2);
  const r = makeRng(7); for (let i = 0; i < 140; i++) { const x = r.int(0, W), y = r.int(0, 230); if (Math.sin(t * 2 + i) > 0.3) px(ctx, x, y, i % 3 ? '#8a86b0' : '#fff'); }
  circle(ctx, 780, 76, 22, '#f4f0d8'); circle(ctx, 789, 70, 20, c1);
  ctx.drawImage(landmarkCanvas('rainbow'), 0, 150, 480, 168); ctx.drawImage(landmarkCanvas('rainbow'), 480, 150, 480, 168);
  ctx.drawImage(skylineCanvas(11, W, 120, { color: '#1e1a3a', lit: '#ffe6a0', tall: true, density: 0.3 }), 0, 220);
  // the two towers everybody photographs, instead of the ones we left behind
  ctx.drawImage(landmarkCanvas('skytree'), 636, 166, 32, 164); ctx.drawImage(landmarkCanvas('tokyotower'), 726, 240, 40, 100);
  ctx.globalAlpha = 0.28; for (let i = 0; i < 10; i++) { const fx = ((t * 14 + i * 150) % (W + 220)) - 110; rect(ctx, fx, 300 + (i % 3) * 12, 130, 14, '#c8c8e0'); } ctx.globalAlpha = 1;
  rect(ctx, 0, 344, W, 196, '#2a2438'); rect(ctx, 0, 344, W, 4, '#4a4468'); for (let x = 0; x < W; x += 40) rect(ctx, x, 348, 2, 60, '#22202f');
  rect(ctx, 0, 406, W, 134, '#1a1826'); for (let x = 0; x < W; x += 48) rect(ctx, x, 470, 26, 3, '#5a5040');
  ctx.drawImage(propCanvas('lamp'), 90, 276, 17, 67); ctx.drawImage(propCanvas('lamp'), 840, 276, 17, 67);
  ctx.globalAlpha = 0.12; circle(ctx, 98, 300, 58, '#ffe680'); circle(ctx, 848, 300, 58, '#ffe680'); ctx.globalAlpha = 1;
}
