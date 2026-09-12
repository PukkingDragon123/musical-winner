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
class ShopScene {
  constructor(node) {
    this.node = node; const r = Game.run; this.t = 0;
    if (!node.stock) { node.rerolls = 0; this.restock(); }
    this.sel = 0; this.msg = 'Welcome to Weevil\'s. Everything is slightly overpriced. It is San Francisco.';
    this.buttons = [];
  }
  restock() {
    const r = Game.run, rng = r.rng, pm = 1 + r.day * 0.1; const stock = [];
    const ex = []; for (let i = 0; i < 2; i++) { const k = r.randomCharm(ex); if (k) { ex.push(k); stock.push({ kind: 'charm', key: k, price: Math.round(CHARMS[k].price * pm) }); } }
    const vk = rng.shuffle(VOUCHER_KEYS.filter(k => !r.vouchers.includes(k)))[0]; if (vk) stock.push({ kind: 'voucher', key: vk, price: Math.round(VOUCHERS[vk].price * pm) });
    for (const k of rng.shuffle(CONSUMABLE_KEYS).slice(0, 2)) stock.push({ kind: 'use', key: k, price: Math.round(CONSUMABLES[k].price * pm) });
    const ik = rng.pick(PLAYABLE.filter(k => k !== r.members[0].instrument)); const q = rng.int(1, Math.min(3, 1 + r.day)); stock.push({ kind: 'instrument', key: ik, quality: q, price: Math.round(INSTRUMENTS[ik].price * (0.7 + q * 0.3) * pm) });
    if (rng.chance(0.5) && r.members.length < 6) { const m = r.makeMember(); stock.push({ kind: 'recruit', member: m, price: 18 + r.day * 7 + m.skill * 2 }); }
    this.node.stock = stock;
  }
  get items() { return this.node.stock.filter(s => !s.sold); }
  rerollPrice() { return Math.max(1, 5 + this.node.rerolls * 2 - (Game.run.perks.rerollDiscount || 0)); }
  cardLabel(s) { return s.kind === 'charm' ? CHARMS[s.key].name : s.kind === 'voucher' ? VOUCHERS[s.key].name : s.kind === 'use' ? CONSUMABLES[s.key].name : s.kind === 'instrument' ? INSTRUMENTS[s.key].name + ' ' + '★'.repeat(s.quality) : 'HIRE ' + s.member.name; }
  cardDesc(s) { return s.kind === 'charm' ? CHARMS[s.key].desc : s.kind === 'voucher' ? VOUCHERS[s.key].desc + ' (permanent)' : s.kind === 'use' ? CONSUMABLES[s.key].desc : s.kind === 'instrument' ? INSTRUMENTS[s.key].desc + ' Quality stars raise applause.' : s.member.spec.species + ' with a ' + INSTRUMENTS[s.member.instrument].name + ', skill ' + s.member.skill + '. Bandmates take spotlights and add Mult, but eat dinner too.'; }
  canBuy(s) { const r = Game.run; if (r.money < s.price) return 'Not enough cash.'; if (s.kind === 'charm' && r.charms.length >= r.charmSlots) return 'No charm slots free. Sell one in BAND & BAG.'; if (s.kind === 'use' && r.consumables.length >= 6) return 'Your pockets are full.'; if (s.kind === 'recruit' && r.members.length >= 6) return 'The band is full.'; return null; }
  buy(s) {
    const r = Game.run; const why = this.canBuy(s); if (why) { this.msg = why; Audio.ui('error'); return; }
    r.money -= s.price; s.sold = true; Audio.ui('cash');
    if (s.kind === 'charm') { r.addCharm(s.key); this.msg = 'Bought ' + CHARMS[s.key].name + '. ' + CHARMS[s.key].desc; }
    else if (s.kind === 'voucher') { r.vouchers.push(s.key); VOUCHERS[s.key].apply(r); this.msg = VOUCHERS[s.key].name + ' redeemed. ' + VOUCHERS[s.key].desc; }
    else if (s.kind === 'use') { r.consumables.push(s.key); this.msg = 'Bought ' + CONSUMABLES[s.key].name + '.'; }
    else if (s.kind === 'instrument') { const m = r.members[0]; r.spareInstruments.push({ kind: m.instrument, quality: m.quality }); m.instrument = s.key; m.quality = s.quality; this.msg = 'You now play ' + INSTRUMENTS[s.key].name + '. Your old instrument is stored as a spare (BAND & BAG).'; }
    else if (s.kind === 'recruit') { r.members.push(s.member); this.msg = s.member.name + ' joins the band!'; }
    this.sel = Math.min(this.sel, Math.max(0, this.items.length - 1)); r.save();
  }
  reroll() { const r = Game.run; const p = this.rerollPrice(); if (r.money < p) { this.msg = 'Not enough cash to reroll.'; Audio.ui('error'); return; } r.money -= p; this.node.rerolls++; this.restock(); this.sel = 0; Audio.ui('select'); this.msg = 'Fresh stock!'; }
  update(dt) { this.t += dt; }
  key(code) {
    const n = this.items.length;
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + n) % Math.max(1, n); Audio.ui('move'); }
    else if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % Math.max(1, n); Audio.ui('move'); }
    else if (['Enter', 'Space'].includes(code)) { const s = this.items[this.sel]; if (s) this.buy(s); }
    else if (code === 'KeyR') this.reroll(); else if (code === 'Escape' || code === 'KeyL') Game.go(() => new CityScene(), 'slideR');
  }
  click(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { b.onTap(); return; }
    this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.buy(this.items[i]); else { this.sel = i; Audio.ui('move'); } } });
  }
  hover(x, y) { this.cards && this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; }); }
  draw(ctx) {
    const r = Game.run; drawTownBackdrop(ctx, this.t, 'day', 13);
    // shop front
    rect(ctx, 0, 90, W, 302, '#3a2418'); for (let x = 0; x < W; x += 34) rect(ctx, x, 90, 2, 302, '#2a1a10'); rect(ctx, 0, 90, W, 9, '#5a3a1e');
    for (let i = 0; i < 16; i++) { const k = PLAYABLE[i % PLAYABLE.length]; const s = bugCanvas(HERO_PRESETS.buzz, 'idle', k); }
    for (let i = 0; i < 9; i++) { const k = ['amp', 'speaker', 'micstand', 'amp'][i % 4], c = propCanvas(k); ctx.drawImage(c, 28 + i * 104, 352 - c.height * 1.5 - (k === 'speaker' ? 10 : 0), c.width * 1.5, c.height * 1.5); }
    drawBugAt(ctx, HERO_PRESETS.gary, 840, 392, { pose: 'idle', scale: 1.6 });
    uiRibbon(ctx, W / 2, 30, 'AMOEBUG RECORDS', { scale: 3 });
    // cards
    const items = this.items; const cw = 124, gap = 10; const total = items.length * (cw + gap) - gap; let cx = Math.round((W - total) / 2);
    this.cards = [];
    items.forEach((s, i) => {
      const x = cx + i * (cw + gap), y = 72; const sel = i === this.sel; const yy = y - (sel ? 6 : 0);
      this.cards.push({ x, y: yy, w: cw, h: 140 });
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 4, yy + 6, cw, 140);
      rect(ctx, x, yy, cw, 140, sel ? UI.goldHi : UI.woodLo); rect(ctx, x + 3, yy + 3, cw - 6, 134, s.kind === 'voucher' ? '#d8c8a0' : UI.paper);
      const rar = s.kind === 'charm' ? CHARMS[s.key].rarity : s.kind === 'voucher' ? 'voucher' : s.kind === 'recruit' ? 'recruit' : 'item';
      const rc = { common: '#4d86c6', uncommon: '#4f8032', rare: '#c8433a', voucher: '#8a2a5a', recruit: '#b07030', item: '#6b5138' }[rar];
      rect(ctx, x + 3, yy + 3, cw - 6, 14, rc); drawText(ctx, rar.toUpperCase(), x + cw / 2, yy + 6, '#fff', { align: 'center' });
      if (s.kind === 'recruit') drawBugAt(ctx, s.member.spec, x + cw / 2, yy + 92, { pose: sel ? 'play' : 'idle', instrument: s.member.instrument, scale: 1.3 });
      else { uiSlot(ctx, x + cw / 2 - 24, yy + 24, 48, { selected: false }); const ic = icon(s.kind === 'charm' ? CHARMS[s.key].icon : s.kind === 'voucher' ? VOUCHERS[s.key].icon : s.kind === 'use' ? CONSUMABLES[s.key].icon : 'case'); ctx.drawImage(ic, x + cw / 2 - 17, yy + 30, 34, 30); if (s.kind === 'instrument') { const bc = bugCanvas(HERO_PRESETS.stag, 'play', s.key); ctx.drawImage(bc, x + cw / 2 - 26, yy + 22, 52, 70); } }
      drawWrapped(ctx, this.cardLabel(s).toUpperCase(), x + 6, yy + 98, 19, UI.ink, 11);
      const afford = r.money >= s.price; rect(ctx, x + 3, yy + 120, cw - 6, 16, afford ? UI.green : '#8a8a7a'); drawText(ctx, fmtMoney(s.price), x + cw / 2, yy + 124, '#fff', { align: 'center', scale: 2 });
    });
    if (!items.length) drawText(ctx, 'SOLD OUT - REROLL FOR NEW STOCK', W / 2, 130, '#f4efe0', { align: 'center', scale: 2, outline: '#1a1410' });
    // detail panel
    const inner = uiPanel(ctx, 24, 226, W - 48, 140);
    const s = items[this.sel];
    if (s) { drawText(ctx, this.cardLabel(s).toUpperCase(), inner.x + 12, inner.y + 8, '#7a4a10', { scale: 2 }); drawWrapped(ctx, this.cardDesc(s), inner.x + 12, inner.y + 34, 96, UI.ink, 13); const why = this.canBuy(s); if (why) drawText(ctx, why, inner.x + 12, inner.y + inner.h - 36, '#b02a2a'); }
    drawText(ctx, this.msg, inner.x + 12, inner.y + inner.h - 18, UI.inkSoft);
    this.buttons = [new Btn(inner.x + inner.w - 370, inner.y + inner.h - 38, 110, 30, 'BUY', () => { const it = items[this.sel]; if (it) this.buy(it); }, { scale: 2 }), new Btn(inner.x + inner.w - 250, inner.y + inner.h - 38, 138, 30, 'REROLL ' + fmtMoney(this.rerollPrice()), () => this.reroll(), { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050' }), new Btn(inner.x + inner.w - 102, inner.y + inner.h - 38, 94, 30, 'LEAVE', () => Game.go(() => new CityScene(), 'slideR'), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14', scale: 2 })];
    for (const b of this.buttons) b.draw(ctx);
    drawParty(ctx, 90, 442, this.t);
    Game.drawHud(ctx);
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
      { label: 'Call an Uber: +2 tickets', icon: 'phone', onSelect: () => { r.tickets += 2; this.finish('+2 UBER TICKETS'); } },
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
    for (let i = 0; i < r.charmSlots; i++) { const k = r.charms[i]; uiSlot(ctx, 28 + i * 46, 214, 40, { empty: !k, selected: this.hoverCharm === i }); if (k) ctx.drawImage(icon(CHARMS[k].icon), 28 + i * 46 + 12, 226, 18, 16); }
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
    ctx.drawImage(landmarkCanvas('bridge'), -60, 70, 690, 240); ctx.drawImage(landmarkCanvas('bridge'), 630, 70, 690, 240);
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
  ctx.drawImage(landmarkCanvas('bridge'), 0, 150, 480, 168); ctx.drawImage(landmarkCanvas('bridge'), 480, 150, 480, 168);
  ctx.drawImage(skylineCanvas(11, W, 120, { color: '#1e1a3a', lit: '#ffe6a0', tall: true, density: 0.3 }), 0, 220);
  ctx.drawImage(landmarkCanvas('transamerica'), 660, 232, 28, 98); ctx.drawImage(landmarkCanvas('coit'), 570, 284, 20, 56);
  ctx.globalAlpha = 0.28; for (let i = 0; i < 10; i++) { const fx = ((t * 14 + i * 150) % (W + 220)) - 110; rect(ctx, fx, 300 + (i % 3) * 12, 130, 14, '#c8c8e0'); } ctx.globalAlpha = 1;
  rect(ctx, 0, 344, W, 196, '#2a2438'); rect(ctx, 0, 344, W, 4, '#4a4468'); for (let x = 0; x < W; x += 40) rect(ctx, x, 348, 2, 60, '#22202f');
  rect(ctx, 0, 406, W, 134, '#1a1826'); for (let x = 0; x < W; x += 48) rect(ctx, x, 470, 26, 3, '#5a5040');
  ctx.drawImage(propCanvas('lamp'), 90, 276, 17, 67); ctx.drawImage(propCanvas('lamp'), 840, 276, 17, 67);
  ctx.globalAlpha = 0.12; circle(ctx, 98, 300, 58, '#ffe680'); circle(ctx, 848, 300, 58, '#ffe680'); ctx.globalAlpha = 1;
}
