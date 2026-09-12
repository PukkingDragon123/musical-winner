// ---------- Shop, events, rest, treasure, night, band, endings ----------
'use strict';
function drawTownBackdrop(ctx, t, kind, seed) {
  const r = Game.run; const [c1, c2] = skyColors(kind === 'night' ? 0.95 : clamp(0.1 + r.day * 0.12, 0, 0.6)); vgrad(ctx, 0, 0, W, H, c1, c2);
  ctx.drawImage(skylineCanvas(seed || 5, W, 70, { color: kind === 'night' ? '#1e1a3a' : '#8a90a8', lit: '#ffe6a0', density: kind === 'night' ? 0.35 : 0.1 }), 0, 150);
  let x = -10; const rr = makeRng(seed || 5); let i = 0; while (x < W + 20) { const w = rr.int(50, 90); const f = facadeCanvas(['victorian', 'pastel', 'brick'][i % 3], (seed || 5) * 7 + i, w); ctx.drawImage(f, x, 262 - f.height); x += w + 1; i++; }
  rect(ctx, 0, 262, W, 34, '#a8a49a'); rect(ctx, 0, 262, W, 2, '#c8c4b8'); for (let sx = 0; sx < W; sx += 26) rect(ctx, sx, 264, 1, 32, 'rgba(0,0,0,0.12)'); rect(ctx, 0, 296, W, 64, '#3f3f48'); for (let sx = 0; sx < W; sx += 34) rect(ctx, sx, 326, 18, 2, '#d8c860');
  ctx.drawImage(propCanvas(kind === 'night' ? 'lamp' : 'lampOff'), 30, 216); ctx.drawImage(treeCanvas('round', Game.wind.frame()), 560, 210);
  if (kind === 'night') { ctx.globalAlpha = 0.14; circle(ctx, 36, 240, 40, '#ffe680'); ctx.globalAlpha = 1; }
}
function drawParty(ctx, x, y, t, pose) { const r = Game.run; r.members.forEach((m, i) => { drawShadow(ctx, x + i * 30, y, 18); drawBugAt(ctx, m.spec, x + i * 30, y + Math.round(Math.sin(t * 3 + i) * 0.5), { pose: pose || (Math.floor(t * 2 + i) % 3 ? 'idle' : 'play'), instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null }); }); }

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
    else if (code === 'KeyR') this.reroll(); else if (code === 'Escape' || code === 'KeyL') Game.setScene(new CityScene());
  }
  click(x, y) {
    for (const b of this.buttons) if (b.hit(x, y)) { b.onTap(); return; }
    this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.buy(this.items[i]); else { this.sel = i; Audio.ui('move'); } } });
  }
  hover(x, y) { this.cards && this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; }); }
  draw(ctx) {
    const r = Game.run; drawTownBackdrop(ctx, this.t, 'day', 13);
    // shop front
    rect(ctx, 0, 60, W, 202, '#3a2418'); for (let x = 0; x < W; x += 24) rect(ctx, x, 60, 1, 202, '#2a1a10'); rect(ctx, 0, 60, W, 6, '#5a3a1e');
    for (let i = 0; i < 16; i++) { const k = PLAYABLE[i % PLAYABLE.length]; const s = bugCanvas(HERO_PRESETS.buzz, 'idle', k); }
    for (let i = 0; i < 8; i++) { ctx.drawImage(propCanvas(['amp', 'speaker', 'micstand', 'amp'][i % 4]), 20 + i * 78, 226 - (i % 4 === 1 ? 14 : 0)); }
    drawBugAt(ctx, HERO_PRESETS.gary, 560, 262, { pose: 'idle' });
    uiRibbon(ctx, W / 2, 24, 'WEEVIL\'S MUSIC EMPORIUM', { scale: 1 });
    // cards
    const items = this.items; const cw = 84, gap = 6; const total = items.length * (cw + gap) - gap; let cx = Math.round((W - total) / 2);
    this.cards = [];
    items.forEach((s, i) => {
      const x = cx + i * (cw + gap), y = 46; const sel = i === this.sel; const yy = y - (sel ? 4 : 0);
      this.cards.push({ x, y: yy, w: cw, h: 92 });
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 3, yy + 4, cw, 92);
      rect(ctx, x, yy, cw, 92, sel ? UI.goldHi : UI.woodLo); rect(ctx, x + 2, yy + 2, cw - 4, 88, s.kind === 'voucher' ? '#d8c8a0' : UI.paper);
      const rar = s.kind === 'charm' ? CHARMS[s.key].rarity : s.kind === 'voucher' ? 'voucher' : s.kind === 'recruit' ? 'recruit' : 'item';
      const rc = { common: '#4d86c6', uncommon: '#4f8032', rare: '#c8433a', voucher: '#8a2a5a', recruit: '#b07030', item: '#6b5138' }[rar];
      rect(ctx, x + 2, yy + 2, cw - 4, 9, rc); drawText(ctx, rar.toUpperCase(), x + cw / 2, yy + 4, '#fff', { align: 'center', font: 'small' });
      if (s.kind === 'recruit') drawBugAt(ctx, s.member.spec, x + cw / 2, yy + 62, { pose: sel ? 'play' : 'idle', instrument: s.member.instrument });
      else { uiSlot(ctx, x + cw / 2 - 16, yy + 16, 32, { selected: false }); const ic = icon(s.kind === 'charm' ? CHARMS[s.key].icon : s.kind === 'voucher' ? VOUCHERS[s.key].icon : s.kind === 'use' ? CONSUMABLES[s.key].icon : 'case'); ctx.drawImage(ic, x + cw / 2 - 12, yy + 20, 24, 21); if (s.kind === 'instrument') { const bc = bugCanvas(HERO_PRESETS.buzz, 'play', s.key); ctx.drawImage(bc, x + cw / 2 - 17, yy + 14); } }
      drawWrapped(ctx, this.cardLabel(s).toUpperCase(), x + 4, yy + 66, 19, UI.ink, 7, { font: 'small' });
      const afford = r.money >= s.price; rect(ctx, x + 2, yy + 80, cw - 4, 10, afford ? UI.green : '#8a8a7a'); drawText(ctx, fmtMoney(s.price), x + cw / 2, yy + 82, '#fff', { align: 'center' });
    });
    if (!items.length) drawText(ctx, 'SOLD OUT - REROLL FOR NEW STOCK', W / 2, 90, '#f4efe0', { align: 'center', outline: '#1a1410' });
    // detail panel
    const inner = uiPanel(ctx, 16, 148, W - 32, 96);
    const s = items[this.sel];
    if (s) { drawText(ctx, this.cardLabel(s).toUpperCase(), inner.x + 8, inner.y + 6, '#7a4a10'); drawWrapped(ctx, this.cardDesc(s), inner.x + 8, inner.y + 18, 96, UI.ink, 9); const why = this.canBuy(s); if (why) drawText(ctx, why, inner.x + 8, inner.y + inner.h - 24, '#b02a2a', { font: 'small' }); }
    drawText(ctx, this.msg, inner.x + 8, inner.y + inner.h - 12, UI.inkSoft, { font: 'small' });
    this.buttons = [new Btn(inner.x + inner.w - 250, inner.y + inner.h - 26, 76, 20, 'BUY', () => { const it = items[this.sel]; if (it) this.buy(it); }), new Btn(inner.x + inner.w - 168, inner.y + inner.h - 26, 90, 20, 'REROLL ' + fmtMoney(this.rerollPrice()), () => this.reroll(), { color: '#4d86c6', hi: '#86b6e8', lo: '#2f5a8a', ol: '#1a3050' }), new Btn(inner.x + inner.w - 72, inner.y + inner.h - 26, 66, 20, 'LEAVE', () => Game.setScene(new CityScene()), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14' })];
    for (const b of this.buttons) b.draw(ctx);
    drawParty(ctx, 60, 296, this.t);
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
    this.menu = new Menu(this.ev.choices.map(c => ({ label: c.label, disabled: c.req ? !c.req(r) : false, onSelect: () => { c.apply(r, (s) => this.log.push(s)); this.done = true; r.save(); this.menu = new Menu([{ label: 'CONTINUE', onSelect: () => Game.setScene(new CityScene()) }]); } })));
  }
  update(dt) { this.t += dt; }
  key(code) { this.menu.key(code); } click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    drawTownBackdrop(ctx, this.t, 'day', hashStr(this.ev.id) % 50 + 1); drawParty(ctx, 60, 296, this.t);
    if (this.ev.id === 'exmate') drawBugAt(ctx, HERO_PRESETS.slim, 520, 296, { pose: 'idle', instrument: 'bass', flip: true });
    if (this.ev.id === 'cop') drawBugAt(ctx, Object.assign({}, HERO_PRESETS.stag, { outfit: { coat: '#2a3a8a', hat: 'cap', hatColor: '#1a2a6a' } }), 520, 296, { pose: 'idle', flip: true });
    const inner = uiPanel(ctx, 60, 30, W - 120, 200, { title: this.ev.title.toUpperCase() });
    ctx.drawImage(icon(this.ev.icon), inner.x + 8, inner.y + 6, 24, 21);
    let y = inner.y + 6; y += drawWrapped(ctx, this.ev.text, inner.x + 40, y, 70, UI.ink, 9) + 8;
    if (!this.done) { drawText(ctx, 'WHAT DO YOU DO?', inner.x + 8, y, '#7a4a10', { font: 'small' }); y += 9; this.menu.draw(ctx, inner.x + 8, y, inner.w - 16, Game.touch ? 15 : 13, 'list'); }
    else { for (const l of this.log) y += drawWrapped(ctx, l, inner.x + 8, y, 90, '#7a4a10', 9) + 3; this.menu.draw(ctx, inner.x + 8, Math.max(y + 4, inner.y + inner.h - 20), inner.w - 16, 14, 'list'); }
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
  finish(msg) { this.log = msg; Audio.ui('select'); Game.run.save(); this.menu = new Menu([{ label: 'CONTINUE', onSelect: () => Game.setScene(new CityScene()) }]); }
  update(dt) { this.t += dt; } key(code) { this.menu.key(code); } click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const [c1, c2] = skyColors(0.35); vgrad(ctx, 0, 0, W, H, c1, c2); circle(ctx, 520, 60, 16, '#fff0a0'); ctx.drawImage(skylineCanvas(8, W, 60, { color: '#8a90a8', lit: '#fff', density: 0.05 }), 0, 170);
    rect(ctx, 0, 220, W, 140, '#5aa050'); rect(ctx, 0, 220, W, 2, '#7ac060'); for (let i = 0; i < 60; i++) rect(ctx, (i * 53) % W, 226 + (i * 17) % 130, 2, 1, '#7fb85a');
    for (let i = 0; i < 6; i++) ctx.drawImage(treeCanvas(['round', 'palm', 'light', 'cypress', 'round', 'pine'][i], Game.wind.frame(i)), 10 + i * 110, 176); ctx.drawImage(propCanvas('bench'), 420, 268);
    drawParty(ctx, 120, 300, this.t, this.log ? 'idle' : null);
    const inner = uiPanel(ctx, 40, 26, W - 80, 118, { title: 'A QUIET MOMENT' });
    if (!this.log) { drawText(ctx, 'The band finds a patch of grass in the sun. How do you spend the afternoon?', inner.x + 8, inner.y + 6, UI.ink, { font: 'small' }); this.menu.draw(ctx, inner.x + 8, inner.y + 18, inner.w - 16, Game.touch ? 15 : 13, 'list'); }
    else { drawWrapped(ctx, this.log, inner.x + 8, inner.y + 8, 96, '#7a4a10', 9); this.menu.draw(ctx, inner.x + 8, inner.y + inner.h - 20, inner.w - 16, 14, 'list'); }
    Game.drawHud(ctx);
  }
}
// ---------- Treasure ----------
class TreasureScene {
  constructor(node) {
    const r = Game.run; this.t = 0; const picks = []; for (let i = 0; i < 3; i++) { const k = r.randomCharm(picks); if (k) picks.push(k); } this.picks = picks; this.sel = 0;
    this.items = picks.map(k => ({ label: CHARMS[k].name, key: k })); this.items.push({ label: 'Take $30 instead', cash: 30 });
  }
  choose(i) { const r = Game.run; const it = this.items[i]; if (it.key) { if (!r.addCharm(it.key)) { Audio.ui('error'); this.msg = 'No free charm slot!'; return; } Audio.ui('fanfare'); } else { r.money += it.cash; Audio.ui('cash'); } r.save(); Game.setScene(new CityScene()); }
  update(dt) { this.t += dt; }
  key(code) { if (code === 'ArrowLeft' || code === 'ArrowUp') { this.sel = (this.sel + this.items.length - 1) % this.items.length; Audio.ui('move'); } else if (code === 'ArrowRight' || code === 'ArrowDown') { this.sel = (this.sel + 1) % this.items.length; Audio.ui('move'); } else if (['Enter', 'Space'].includes(code)) this.choose(this.sel); }
  click(x, y) { this.cards && this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.choose(i); else this.sel = i; } }); }
  hover(x, y) { this.click.call({ cards: this.cards, sel: -1, choose: () => { }, items: this.items }, x, y); this.cards && this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; }); }
  draw(ctx) {
    drawTownBackdrop(ctx, this.t, 'day', 21); drawParty(ctx, 60, 296, this.t);
    uiRibbon(ctx, W / 2, 26, 'LOST & FOUND', { scale: 2 });
    drawText(ctx, 'Someone left a box of goodies at the cable car turnaround. Take ONE.', W / 2, 56, '#f4efe0', { align: 'center', outline: '#1a1410' });
    this.cards = []; const cw = 110, gap = 12, total = this.items.length * (cw + gap) - gap; const x0 = Math.round((W - total) / 2);
    this.items.forEach((it, i) => {
      const x = x0 + i * (cw + gap), y = 80 - (i === this.sel ? 4 : 0); this.cards.push({ x, y, w: cw, h: 120 });
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 3, y + 4, cw, 120); rect(ctx, x, y, cw, 120, i === this.sel ? UI.goldHi : UI.woodLo); rect(ctx, x + 2, y + 2, cw - 4, 116, UI.paper);
      if (it.key) { const c = CHARMS[it.key]; rect(ctx, x + 2, y + 2, cw - 4, 9, { common: '#4d86c6', uncommon: '#4f8032', rare: '#c8433a' }[c.rarity]); drawText(ctx, c.rarity.toUpperCase(), x + cw / 2, y + 4, '#fff', { align: 'center', font: 'small' }); uiSlot(ctx, x + cw / 2 - 16, y + 16, 32); ctx.drawImage(icon(c.icon), x + cw / 2 - 12, y + 20, 24, 21); drawText(ctx, c.name.toUpperCase(), x + cw / 2, y + 54, UI.ink, { align: 'center', font: 'small' }); drawWrapped(ctx, c.desc, x + 6, y + 64, 24, UI.inkSoft, 7, { font: 'small' }); }
      else { ctx.drawImage(icon('money'), x + cw / 2 - 15, y + 30, 30, 15); drawText(ctx, '$30 CASH', x + cw / 2, y + 60, UI.ink, { align: 'center' }); drawText(ctx, 'Cold hard dinner money.', x + cw / 2, y + 76, UI.inkSoft, { align: 'center', font: 'small' }); }
    });
    if (this.msg) drawText(ctx, this.msg, W / 2, 210, '#ff9f68', { align: 'center', outline: '#1a1410' });
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
    this.menu = new Menu([{ label: this.gameOver ? '...' : 'CONTINUE TO THE MAP', onSelect: () => { if (this.gameOver) Game.setScene(new GameOverScene(this.gameOver)); else Game.setScene(new CityScene()); } }]);
  }
  update(dt) { this.t += dt; this.fx.update(dt); if (this.phase === 'dinner' && Math.random() < dt * 6) this.fx.add({ x: 320 + (Math.random() - 0.5) * 8, y: 300, vx: (Math.random() - 0.5) * 10, vy: -40 - Math.random() * 30, life: 0.7, kind: 'fire', size: 3, gravity: -20 }); }
  key(code) { this.menu.key(code); } click(x, y) { this.menu.click(x, y); } hover(x, y) { this.menu.hover(x, y); }
  draw(ctx) {
    const r = Game.run;
    if (this.phase === 'dinner') { drawTownBackdrop(ctx, this.t, 'night', 17); rect(ctx, 300, 300, 40, 6, '#5a3a1e'); rect(ctx, 306, 296, 28, 4, '#3a2410'); this.fx.draw(ctx); ctx.globalAlpha = 0.12 + 0.03 * Math.sin(this.t * 8); circle(ctx, 320, 296, 70, '#ffa040'); ctx.globalAlpha = 1; }
    else { const [c1, c2] = skyColors(0.05); vgrad(ctx, 0, 0, W, H, c1, c2); drawTownBackdrop(ctx, this.t, 'day', 17); }
    r.members.forEach((m, i) => { const x = 220 + i * 40; drawShadow(ctx, x, 300, 18); drawBugAt(ctx, m.spec, x, 300, { pose: this.phase === 'morning' && m.hunger === 0 ? 'cheer' : 'idle', flip: x > 320 }); if (this.phase === 'morning' && m.hunger === 0) ctx.drawImage(icon('heart'), x - 3, 250); });
    const inner = uiPanel(ctx, 40, 26, W - 80, 130, { title: this.phase === 'dinner' ? 'NIGHTFALL - END OF DAY ' + (r.day + 1) : 'MORNING' });
    if (this.phase === 'dinner') {
      drawText(ctx, 'Dinner costs ' + fmtMoney(r.mealPrice()) + ' per bug tonight. You have ' + fmtMoney(r.money) + '.', inner.x + 8, inner.y + 6, UI.ink);
      drawText(ctx, 'A full meal resets hunger and restores 65 stamina. STARVING bugs (hunger 2) leave at dawn.', inner.x + 8, inner.y + 16, UI.inkSoft, { font: 'small' });
      this.menu.draw(ctx, inner.x + 8, inner.y + 28, inner.w - 16, Game.touch ? 15 : 14, 'list');
      const hungry = r.members.filter(m => m.hunger > 0); if (hungry.length) drawText(ctx, 'Already hungry: ' + hungry.map(m => m.name + (m.hunger >= 2 ? ' (STARVING)' : '')).join(', '), inner.x + 8, inner.y + inner.h - 10, '#b02a2a', { font: 'small' });
    } else { let y = inner.y + 6; for (const l of this.log) y += drawWrapped(ctx, l, inner.x + 8, y, 96, UI.ink, 9) + 2; this.menu.draw(ctx, inner.x + 8, inner.y + inner.h - 20, inner.w - 16, 14, 'list'); }
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
    items.push({ label: 'Back to map', icon: 'arrowL', onSelect: () => { r.save(); Game.setScene(new CityScene()); } });
    this.menu = new Menu(items);
  }
  update(dt) { this.t += dt; }
  key(code) { const r = Game.run; if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + r.members.length) % r.members.length; this.buildMenu(); Audio.ui('move'); return; } if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % r.members.length; this.buildMenu(); Audio.ui('move'); return; } if (code === 'Escape' || code === 'Tab') { r.save(); Game.setScene(new CityScene()); return; } this.menu.key(code); }
  click(x, y) { Game.run.members.forEach((m, i) => { if (x >= 16 + i * 100 && x < 16 + i * 100 + 96 && y >= 30 && y < 120) { this.sel = i; this.buildMenu(); Audio.ui('move'); } }); this.menu.click(x, y); }
  hover(x, y) { this.menu.hover(x, y); this.hoverCharm = -1; Game.run.charms.forEach((k, i) => { if (x >= 20 + i * 30 && x < 46 + i * 30 && y >= 138 && y < 164) this.hoverCharm = i; }); }
  draw(ctx) {
    const r = Game.run; drawTownBackdrop(ctx, this.t, 'day', 31);
    r.members.forEach((m, i) => {
      const x = 16 + i * 100, sel = i === this.sel; const inner = uiPanel(ctx, x, 30, 96, 96, sel ? { title: m.name.toUpperCase() + (m.leader ? ' ★' : '') } : { title: m.name.toUpperCase() });
      drawBugAt(ctx, m.spec, x + 24, inner.y + 52, { pose: sel ? 'play' : 'idle', instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null });
      drawText(ctx, m.spec.species, x + 44, inner.y + 4, UI.inkSoft, { font: 'small' }); drawText(ctx, INSTRUMENTS[m.instrument].name, x + 44, inner.y + 12, '#7a4a10', { font: 'small' }); drawText(ctx, '★'.repeat(m.quality), x + 44, inner.y + 20, '#d9a520', { font: 'small' });
      drawText(ctx, 'SKILL ' + m.skill, x + 44, inner.y + 30, UI.ink, { font: 'small' }); uiBar(ctx, x + 44, inner.y + 38, 46, 5, m.xp / 3, '#8a5ad0');
      uiBar(ctx, x + 44, inner.y + 48, 46, 6, m.stamina / 100, m.stamina > 50 ? '#6fbf4a' : m.stamina > 25 ? '#ffd166' : '#ff5a5a', { label: 'STA' });
      drawText(ctx, ['FED', 'HUNGRY', 'STARVING'][Math.min(2, m.hunger)], x + 44, inner.y + 58, ['#4f8032', '#b07030', '#b02a2a'][Math.min(2, m.hunger)], { font: 'small' });
      if (sel) frame(ctx, x - 1, 29, 98, 98, UI.goldHi);
    });
    // charms row
    drawText(ctx, 'CHARMS  ' + r.charms.length + '/' + r.charmSlots, 20, 130, '#f4efe0', { outline: '#1a1410' });
    for (let i = 0; i < r.charmSlots; i++) { const k = r.charms[i]; uiSlot(ctx, 20 + i * 30, 138, 26, { empty: !k, selected: this.hoverCharm === i }); if (k) ctx.drawImage(icon(CHARMS[k].icon), 20 + i * 30 + 9, 147); }
    drawText(ctx, 'ITEMS', 240, 130, '#f4efe0', { outline: '#1a1410' }); r.consumables.forEach((k, i) => { uiSlot(ctx, 240 + i * 30, 138, 26); ctx.drawImage(icon(CONSUMABLES[k].icon), 240 + i * 30 + 9, 147); });
    drawText(ctx, 'VOUCHERS', 440, 130, '#f4efe0', { outline: '#1a1410' }); r.vouchers.forEach((k, i) => { uiSlot(ctx, 440 + i * 30, 138, 26); ctx.drawImage(icon(VOUCHERS[k].icon), 440 + i * 30 + 9, 147); });
    const inner = uiPanel(ctx, 16, 170, W - 32, H - 176);
    const m = r.members[this.sel];
    const tip = this.hoverCharm >= 0 && r.charms[this.hoverCharm] ? CHARMS[r.charms[this.hoverCharm]].name.toUpperCase() + ': ' + CHARMS[r.charms[this.hoverCharm]].desc : INSTRUMENTS[m.instrument].name.toUpperCase() + ' (' + INSTRUMENTS[m.instrument].keyNames.join(' ') + '): ' + INSTRUMENTS[m.instrument].desc;
    drawWrapped(ctx, tip, inner.x + 8, inner.y + 4, 100, '#7a4a10', 8, { font: 'small' });
    this.menu.draw(ctx, inner.x + 8, inner.y + 24, Math.min(inner.w - 16, 400), Game.touch ? 14 : 12, 'list');
    if (this.msg) drawText(ctx, this.msg, inner.x + inner.w - 8, inner.y + inner.h - 10, UI.inkSoft, { align: 'right', font: 'small' });
    drawText(ctx, Game.touch ? 'TAP A BUG TO SELECT' : 'LEFT/RIGHT: PICK A BUG   ESC: BACK', inner.x + inner.w - 8, inner.y + 4, UI.inkFaint, { align: 'right', font: 'small' });
    Game.drawHud(ctx);
  }
}
class GameOverScene {
  constructor(reason) { this.reason = reason; this.t = 0; RunState.clearSave(); Audio.ui('sad'); this.btn = new Btn(W / 2 - 60, 250, 120, 22, 'BACK TO TITLE', () => { Game.run = null; Game.setScene(new TitleScene()); }); }
  update(dt) { this.t += dt; } key(code) { if (['Enter', 'Space', 'Escape'].includes(code)) this.btn.onTap(); } click(x, y) { if (this.btn.hit(x, y) || !Game.touch) this.btn.onTap(); }
  draw(ctx) { const r = Game.run; drawTownBackdrop(ctx, this.t, 'night', 3); ctx.globalAlpha = 0.6; rect(ctx, 0, 0, W, H, '#100c14'); ctx.globalAlpha = 1; if (r) drawBugAt(ctx, r.members[0].spec, W / 2, 300, { pose: 'idle', instrument: 'guitar' }); uiRibbon(ctx, W / 2, 40, 'THE SHOW IS OVER', { scale: 2 }); const inner = uiPanel(ctx, 120, 80, W - 240, 160); drawWrapped(ctx, this.reason, inner.x + 10, inner.y + 8, 62, UI.ink, 9); if (r) { drawText(ctx, 'Days survived: ' + (r.day + 1) + '   Gigs: ' + r.stats.gigs, inner.x + 10, inner.y + 50, UI.inkSoft, { font: 'small' }); drawText(ctx, 'Total earned: ' + fmtMoney(r.stats.earned) + '   Best payout: ' + fmtMoney(r.stats.bestPayout) + '   Best combo: ' + r.stats.bestCombo, inner.x + 10, inner.y + 58, UI.inkSoft, { font: 'small' }); } this.btn.draw(ctx); }
}
class VictoryScene {
  constructor() { this.t = 0; const r = Game.run; RunState.clearSave(); Audio.ui('fanfare'); Audio.roar(3, 0.6); this.fx = new Particles(); this.btn = new Btn(W / 2 - 70, 300, 140, 22, 'PLAY AGAIN', () => { Game.run = null; Game.setScene(new TitleScene()); }); }
  update(dt) { this.t += dt; this.fx.update(dt); if (Math.random() < dt * 26) this.fx.add({ x: Math.random() * W, y: -5, vx: (Math.random() - 0.5) * 34, vy: 34 + Math.random() * 44, life: 6, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][Math.floor(Math.random() * 5)], kind: 'confetti', gravity: 10 }); }
  key(code) { if (['Enter', 'Space'].includes(code)) this.btn.onTap(); }
  click(x, y) { if (this.btn.hit(x, y) || !Game.touch) this.btn.onTap(); }
  draw(ctx) {
    const r = Game.run; const [c1, c2] = skyColors(0.6); vgrad(ctx, 0, 0, W, H, c1, c2);
    ctx.drawImage(landmarkCanvas('bridge'), -40, 50, 460, 160); ctx.drawImage(landmarkCanvas('bridge'), 420, 50, 460, 160);
    rect(ctx, 0, 210, W, 150, '#5a5a6a'); rect(ctx, 0, 210, W, 4, '#c8432a');
    r.members.forEach((m, i) => { const x = W / 2 - (r.members.length - 1) * 22 + i * 44; drawShadow(ctx, x, 290, 22); drawBugAt(ctx, m.spec, x, 290 + Math.round(Math.sin(this.t * 6 + i) * 2), { pose: 'cheer', instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.3 }); });
    drawBugAt(ctx, HERO_PRESETS.monarch, 580, 290, { pose: 'idle', instrument: 'mic', flip: true });
    this.fx.draw(ctx);
    uiRibbon(ctx, W / 2, 16, 'ENCORE!', { scale: 4, color: '#d9a520' });
    const inner = uiPanel(ctx, 150, 70, W - 300, 120);
    ctx.drawImage(icon('coin'), inner.x + 14, inner.y + 22, 14, 13); drawText(ctx, fmtMoney(r.money), inner.x + 34, inner.y + 14, '#2a7a3a', { scale: 3 });
    drawText(ctx, 'EARNED ' + fmtMoney(r.stats.earned) + '   GIGS ' + r.stats.gigs, inner.x + 14, inner.y + 48, UI.ink, { font: 'small' });
    drawText(ctx, 'BEST COMBO ' + r.stats.bestCombo + '   BAND OF ' + r.members.length, inner.x + 14, inner.y + 58, UI.ink, { font: 'small' });
    this.btn.draw(ctx);
  }
}
function drawNightCity(ctx, t, opts = {}) {
  const [c1, c2] = skyColors(opts.sky != null ? opts.sky : 0.92); vgrad(ctx, 0, 0, W, H, c1, c2);
  const r = makeRng(7); for (let i = 0; i < 90; i++) { const x = r.int(0, W), y = r.int(0, 150); if (Math.sin(t * 2 + i) > 0.3) px(ctx, x, y, i % 3 ? '#8a86b0' : '#fff'); }
  circle(ctx, 520, 50, 14, '#f4f0d8'); circle(ctx, 526, 46, 13, c1);
  ctx.drawImage(landmarkCanvas('bridge'), 0, 110, 320, 112); ctx.drawImage(landmarkCanvas('bridge'), 320, 110, 320, 112);
  ctx.drawImage(skylineCanvas(11, W, 80, { color: '#1e1a3a', lit: '#ffe6a0', tall: true, density: 0.3 }), 0, 150);
  ctx.drawImage(landmarkCanvas('transamerica'), 440, 160); ctx.drawImage(landmarkCanvas('coit'), 380, 190);
  ctx.globalAlpha = 0.28; for (let i = 0; i < 8; i++) { const fx = ((t * 10 + i * 110) % (W + 160)) - 80; rect(ctx, fx, 200 + (i % 3) * 8, 90, 10, '#c8c8e0'); } ctx.globalAlpha = 1;
  rect(ctx, 0, 230, W, 130, '#2a2438'); rect(ctx, 0, 230, W, 3, '#4a4468'); for (let x = 0; x < W; x += 28) rect(ctx, x, 233, 1, 40, '#22202f');
  rect(ctx, 0, 272, W, 88, '#1a1826'); for (let x = 0; x < W; x += 34) rect(ctx, x, 312, 18, 2, '#5a5040');
  ctx.drawImage(propCanvas('lamp'), 60, 184); ctx.drawImage(propCanvas('lamp'), 560, 184);
  ctx.globalAlpha = 0.12; circle(ctx, 66, 200, 40, '#ffe680'); circle(ctx, 566, 200, 40, '#ffe680'); ctx.globalAlpha = 1;
}
