// ---------- The phone ----------
// A cheap flip phone with a list of everybody who ever gave you their number.
// Each one does its thing once and is then greyed out for the rest of the run.
'use strict';
class PhoneScene {
  constructor(back) {
    const r = Game.run;
    this.t = 0; this.back = back || (() => new CityScene());
    this.list = (r.contacts || []).filter(k => CONTACTS[k]);
    this.sel = 0; this.log = null; this.buttons = [];
  }
  call(k) {
    const r = Game.run;
    if (r.usedContacts.includes(k)) { Audio.ui('error'); return; }
    r.usedContacts.push(k);
    const lines = []; CONTACTS[k].use(r, (m) => lines.push(m));
    this.log = lines.join(' '); Audio.ui('fanfare'); r.save();
  }
  leave() { Game.go(this.back, 'slideR'); }
  update(dt) { this.t += dt; }
  key(code) {
    if (this.log) { if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(code)) this.log = null; return; }
    if (code === 'ArrowUp' || code === 'KeyW') { this.sel = (this.sel + this.list.length - 1) % Math.max(1, this.list.length); Audio.ui('move'); }
    else if (code === 'ArrowDown' || code === 'KeyS') { this.sel = (this.sel + 1) % Math.max(1, this.list.length); Audio.ui('move'); }
    else if (['Enter', 'Space', 'KeyZ'].includes(code)) { if (this.list[this.sel]) this.call(this.list[this.sel]); }
    else if (code === 'Escape') this.leave();
  }
  click(x, y) {
    if (this.log) { this.log = null; return; }
    for (const b of this.buttons) if (b.hit(x, y)) { b.onTap(); return; }
    (this.rows || []).forEach((r2, i) => { if (x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h) { if (this.sel === i) this.call(this.list[i]); else { this.sel = i; Audio.ui('move'); } } });
  }
  hover(x, y) { (this.rows || []).forEach((r2, i) => { if (x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h) this.sel = i; }); }
  draw(ctx) {
    const r = Game.run;
    vgrad(ctx, 0, 0, W, H, '#161226', '#0c0a16');
    // the handset itself, held up in front of you
    const pw = 300, ph = 470, px = Math.round(W / 2 - pw / 2), py = 34;
    rect(ctx, px + 6, py + 8, pw, ph, 'rgba(6,4,12,0.55)');
    rect(ctx, px, py, pw, ph, '#2a2636'); frame(ctx, px, py, pw, ph, '#5a5470');
    rect(ctx, px + 2, py + 2, pw - 4, 2, '#7a7490');
    // the earpiece and the screen
    rect(ctx, px + pw / 2 - 26, py + 12, 52, 5, '#16131e');
    const sx = px + 16, sy = py + 28, sw = pw - 32, sh = ph - 76;
    rect(ctx, sx, sy, sw, sh, '#0e1a14'); frame(ctx, sx, sy, sw, sh, '#1e3a2a');
    ctx.globalAlpha = 0.06; for (let y = sy; y < sy + sh; y += 3) rect(ctx, sx, y, sw, 1, '#8affc0'); ctx.globalAlpha = 1;
    // the status bar
    drawText(ctx, 'CONTACTS', sx + 8, sy + 8, '#8affc0', { scale: 2 });
    drawText(ctx, String(this.list.length), sx + sw - 8, sy + 10, '#4a9a70', { align: 'right' });
    rect(ctx, sx + 6, sy + 26, sw - 12, 1, '#2a5a42');
    this.rows = [];
    if (!this.list.length) {
      drawWrapped(ctx, 'NOBODY HAS GIVEN YOU THEIR NUMBER YET. PLAY WELL FOR SOMEBODY AND THEY WILL.', sx + 10, sy + 44, 22, '#4a9a70', 14);
    }
    this.list.forEach((k, i) => {
      const c = CONTACTS[k], used = r.usedContacts.includes(k), on = i === this.sel;
      const ry = sy + 34 + i * 58, rw = sw - 12, rh = 52;
      this.rows.push({ x: sx + 6, y: ry, w: rw, h: rh });
      rect(ctx, sx + 6, ry, rw, rh, on ? '#16382a' : '#10261c');
      frame(ctx, sx + 6, ry, rw, rh, used ? '#274034' : on ? '#8affc0' : '#2a5a42');
      ctx.drawImage(icon(c.icon), sx + 12, ry + 8, 18, 16);
      drawText(ctx, c.name, sx + 38, ry + 6, used ? '#3f7a5c' : c.tint, { scale: 2 });
      drawWrapped(ctx, used ? 'CALLED IN ALREADY.' : c.desc, sx + 38, ry + 24, 24, used ? '#2f6049' : '#7fd8a8', 11, { font: 'small' });
      if (on && !used) for (let d = 0; d < 4; d++) rect(ctx, sx + rw - 2, ry + rh / 2 - 4 + d, 4 - d, 1, '#8affc0');
    });
    // keypad, for looks and for the buttons
    const ky = py + ph - 44;
    for (let i = 0; i < 3; i++) rect(ctx, px + 24 + i * 88, ky, 76, 14, '#3a3448');
    this.buttons = [];
    const b1 = new Btn(px + 16, py + ph - 26, 128, 22, 'CALL', () => { if (this.list[this.sel]) this.call(this.list[this.sel]); }, { tight: true });
    const b2 = new Btn(px + pw - 144, py + ph - 26, 128, 22, 'CLOSE', () => this.leave(), { tight: true, color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14' });
    this.buttons.push(b1, b2); b1.draw(ctx); b2.draw(ctx);
    if (this.log) {
      rect(ctx, 0, 0, W, H, 'rgba(6,4,14,0.72)');
      const inner = uiPanel(ctx, 90, 180, W - 180, 170, { title: 'CALL CONNECTED' });
      drawWrapped(ctx, this.log, inner.x + 16, inner.y + 16, 56, '#7a4a10', 22, { scale: 2 });
      drawText(ctx, Game.touch ? 'TAP TO CLOSE' : 'ENTER', inner.x + inner.w / 2, inner.y + inner.h - 22, UI.inkSoft, { align: 'center' });
    }
    Game.drawHud(ctx);
  }
}
// Somebody liked you enough to hand over a number.
function giveContact(key, log) {
  const r = Game.run; if (!r || !CONTACTS[key]) return;
  if (r.contacts.includes(key)) return;
  r.contacts.push(key);
  if (log) log('They give you their number. It is in the phone now.');
  Audio.ui('levelup');
}
