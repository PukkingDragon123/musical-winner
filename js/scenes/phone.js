// ---------- The phone ----------
// A 2012 handset with a cracked corner: a metal band round the edge, a home
// button you can actually press, and a screen full of apps. One of them is the
// map, which is how you look at the whole city without walking it.
'use strict';
const PHONE_APPS = [
  { key: 'maps',     name: 'MAPS',     col: '#4a9f68', ic: 'map' },
  { key: 'contacts', name: 'CONTACTS', col: '#4a86f7', ic: 'contacts' },
  { key: 'band',     name: 'BAND',     col: '#e0783c', ic: 'band' },
  { key: 'wallet',   name: 'WALLET',   col: '#d8b83c', ic: 'wallet' },
  { key: 'weather',  name: 'WEATHER',  col: '#5bc0ff', ic: 'weather' },
  { key: 'camera',   name: 'CAMERA',   col: '#8a8f9a', ic: 'camera' },
  { key: 'music',    name: 'PLAYER',   col: '#e0503a', ic: 'music' },
  { key: 'notes',    name: 'NOTES',    col: '#f0d060', ic: 'notes' },
  { key: 'bugtube',  name: 'BUGTUBE',  col: '#c8302c', ic: 'video' },
  { key: 'ramen',    name: 'RAMENGO',  col: '#e88a3c', ic: 'ramen' },
  { key: 'step',     name: 'STEPS',    col: '#6be585', ic: 'steps' },
  { key: 'settings', name: 'SETTINGS', col: '#7a8090', ic: 'gear' },
];
class PhoneScene {
  constructor(back) {
    const r = Game.run;
    this.t = 0; this.back = back || (() => new CityScene());
    this.list = (r.contacts || []).filter(k => CONTACTS[k]);
    this.sel = 0; this.log = null; this.app = null; this.appT = 0;
    this.iconRects = []; this.rows = [];
    this.mapCam = null; this.shot = null;
    this.battery = 0.34 + ((r.day || 0) % 4) * 0.12;
  }
  open(k) { this.app = k; this.appT = 0; this.sel = 0; Audio.ui('select'); if (k === 'camera') this.shot = 0; }
  home() { if (this.app) { this.app = null; Audio.ui('back'); } else this.leave(); }
  call(k) {
    const r = Game.run;
    if (r.usedContacts.includes(k)) { Audio.ui('error'); return; }
    r.usedContacts.push(k);
    const lines = []; CONTACTS[k].use(r, (m) => lines.push(m));
    this.log = lines.join(' '); Audio.ui('fanfare'); r.save();
  }
  leave() { Game.go(this.back, 'slideR'); }
  update(dt) { this.t += dt; this.appT += dt; if (this.shot != null) this.shot += dt; }
  key(code) {
    if (this.log) { if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(code)) this.log = null; return; }
    if (code === 'Escape' || code === 'KeyP') { this.home(); return; }
    if (!this.app) {
      const cols = 3;
      if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % PHONE_APPS.length; Audio.ui('move'); }
      if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel - 1 + PHONE_APPS.length) % PHONE_APPS.length; Audio.ui('move'); }
      if (code === 'ArrowDown' || code === 'KeyS') { this.sel = Math.min(PHONE_APPS.length - 1, this.sel + cols); Audio.ui('move'); }
      if (code === 'ArrowUp' || code === 'KeyW') { this.sel = Math.max(0, this.sel - cols); Audio.ui('move'); }
      if (['Enter', 'Space', 'KeyZ'].includes(code)) this.open(PHONE_APPS[this.sel].key);
      return;
    }
    if (this.app === 'contacts') {
      if (code === 'ArrowUp' || code === 'KeyW') { this.sel = (this.sel + this.list.length - 1) % Math.max(1, this.list.length); Audio.ui('move'); }
      else if (code === 'ArrowDown' || code === 'KeyS') { this.sel = (this.sel + 1) % Math.max(1, this.list.length); Audio.ui('move'); }
      else if (['Enter', 'Space', 'KeyZ'].includes(code)) { if (this.list[this.sel]) this.call(this.list[this.sel]); }
      return;
    }
    if (this.app === 'settings' && ['Enter', 'Space', 'KeyZ'].includes(code)) { Game.muted = !Game.muted; Audio.setMuted(Game.muted); Audio.ui('select'); }
    if (this.app === 'camera' && ['Enter', 'Space', 'KeyZ'].includes(code)) { this.shot = 0; Audio.ui('pop'); }
  }
  click(x, y) {
    if (this.log) { this.log = null; return; }
    const S = this.screen();
    if (this.homeBtn && Math.hypot(x - this.homeBtn.x, y - this.homeBtn.y) < this.homeBtn.r + 6) { this.home(); return; }
    if (x < S.x || x > S.x + S.w || y < S.y || y > S.y + S.h) { this.leave(); return; }
    if (!this.app) {
      for (let i = 0; i < this.iconRects.length; i++) { const r2 = this.iconRects[i]; if (x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h) { this.sel = i; this.open(PHONE_APPS[i].key); return; } }
      return;
    }
    if (this.app === 'contacts') { this.rows.forEach((r2, i) => { if (x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h) { if (this.sel === i) this.call(this.list[i]); else { this.sel = i; Audio.ui('move'); } } }); return; }
    if (this.app === 'settings') { Game.muted = !Game.muted; Audio.setMuted(Game.muted); Audio.ui('select'); return; }
    if (this.app === 'camera') { this.shot = 0; Audio.ui('pop'); return; }
  }
  pointerDown(x, y) { this.click(x, y); }
  hover(x, y) {
    if (!this.app) { for (let i = 0; i < this.iconRects.length; i++) { const r2 = this.iconRects[i]; if (x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h) this.sel = i; } return; }
    this.rows.forEach((r2, i) => { if (x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h) this.sel = i; });
  }
  // the glass, in screen coordinates
  screen() { const pw = 286, ph = 500, px = Math.round(W / 2 - pw / 2), py = 20; return { px, py, pw, ph, x: px + 14, y: py + 62, w: pw - 28, h: ph - 128 }; }
  draw(ctx) {
    const r = Game.run, t = this.t;
    vgrad(ctx, 0, 0, W, H, '#161226', '#0a0812');
    // a desk light behind the handset
    ctx.globalAlpha = 0.1; ellipsePx(ctx, W / 2, H / 2, 300, 260, '#8ad8ff'); ctx.globalAlpha = 1;
    const S = this.screen();
    const { px, py, pw, ph } = S;
    // ---- the body: a metal band, chamfered edges, a glass front
    rect(ctx, px + 7, py + 10, pw, ph, 'rgba(4,3,10,0.6)');
    rect(ctx, px - 2, py - 2, pw + 4, ph + 4, '#9aa0aa');       // the chamfer
    rect(ctx, px, py, pw, ph, '#2b2f36');
    rect(ctx, px + 2, py + 2, pw - 4, ph - 4, '#15171c');
    rect(ctx, px + 2, py + 2, pw - 4, 1, '#4a505a');
    // the aerial breaks in the band, the way that model had them
    for (const by of [py + 40, py + ph - 70]) { rect(ctx, px - 2, by, pw + 4, 3, '#cfd4da'); }
    // earpiece, camera and sensor
    rect(ctx, px + pw / 2 - 26, py + 26, 52, 6, '#0a0b0e');
    rect(ctx, px + pw / 2 - 24, py + 27, 48, 4, '#2a2d33');
    circle(ctx, px + pw / 2 - 44, py + 29, 4, '#0a0b0e'); circle(ctx, px + pw / 2 - 44, py + 29, 2, '#2f4a6a');
    circle(ctx, px + pw / 2 + 44, py + 29, 3, '#0a0b0e');
    // ---- the screen
    rect(ctx, S.x - 2, S.y - 2, S.w + 4, S.h + 4, '#05060a');
    rect(ctx, S.x, S.y, S.w, S.h, '#0f1420');
    ctx.save(); ctx.beginPath(); ctx.rect(S.x, S.y, S.w, S.h); ctx.clip();
    this.drawScreen(ctx, S);
    // a bit of glare across the glass, and the crack in the corner
    ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(S.x, S.y + S.h * 0.75); ctx.lineTo(S.x + S.w * 0.6, S.y); ctx.lineTo(S.x + S.w, S.y); ctx.lineTo(S.x, S.y + S.h); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5;
    line(ctx, S.x + S.w - 30, S.y + 2, S.x + S.w - 2, S.y + 26, '#c8d0dc');
    line(ctx, S.x + S.w - 22, S.y + 2, S.x + S.w - 2, S.y + 14, '#c8d0dc');
    ctx.globalAlpha = 1;
    ctx.restore();
    // ---- the home button
    const hb = { x: px + pw / 2, y: py + ph - 34, r: 15 };
    this.homeBtn = hb;
    circle(ctx, hb.x, hb.y, hb.r, '#3a3f47'); circle(ctx, hb.x, hb.y, hb.r - 2, '#1b1e24');
    frame(ctx, hb.x - 5, hb.y - 5, 10, 10, '#8a9098');
    drawText(ctx, this.app ? 'BACK' : 'PUT IT AWAY', W / 2, py + ph + 12, '#6a6488', { align: 'center', font: 'small' });
    // ---- a call in progress sits over everything
    if (this.log) {
      ctx.globalAlpha = 0.8; rect(ctx, 0, 0, W, H, '#05040c'); ctx.globalAlpha = 1;
      const bw = 560, bx = W / 2 - bw / 2;
      rect(ctx, bx, 180, bw, 180, '#151228'); frame(ctx, bx, 180, bw, 180, '#6be585');
      drawText(ctx, 'CALL ENDED', W / 2, 198, '#6be585', { align: 'center', scale: 3 });
      drawWrapped(ctx, this.log, bx + 20, 240, bw - 40, 20, '#e8e2f0', { scale: 2 });
      drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, 332, '#8a82a8', { align: 'center', font: 'small' });
    }
  }
  // ---------- what is on the screen ----------
  drawScreen(ctx, S) {
    const r = Game.run, t = this.t;
    // the status bar, on every screen
    const bar = () => {
      rect(ctx, S.x, S.y, S.w, 16, 'rgba(0,0,0,0.35)');
      drawText(ctx, 'BUG-MOBILE', S.x + 6, S.y + 5, '#cfd6e2', { font: 'small' });
      for (let i = 0; i < 5; i++) { const on = i < 3 + ((Math.floor(t) % 2)); rect(ctx, S.x + 74 + i * 5, S.y + 11 - i * 2, 3, 3 + i * 2, on ? '#e8f0fa' : '#4a5260'); }
      const day = (r && r.day != null) ? r.day : 0;
      drawText(ctx, (7 + day) + ':4' + (Math.floor(t) % 10), S.x + S.w / 2, S.y + 5, '#e8f0fa', { align: 'center', font: 'small' });
      rect(ctx, S.x + S.w - 30, S.y + 4, 22, 9, '#4a5260'); rect(ctx, S.x + S.w - 8, S.y + 7, 2, 3, '#4a5260');
      rect(ctx, S.x + S.w - 29, S.y + 5, Math.round(20 * this.battery), 7, this.battery < 0.25 ? '#e8503a' : '#6be585');
    };
    if (!this.app) {
      // ---- the home screen: a photo of the band behind the icons
      vgrad(ctx, S.x, S.y, S.w, S.h, '#2a3f6a', '#101828');
      for (let i = 0; i < 40; i++) { const sx = S.x + ((i * 73) % S.w), sy = S.y + ((i * 41) % S.h); ctx.globalAlpha = 0.25; px(ctx, sx, sy, '#8ad8ff'); ctx.globalAlpha = 1; }
      if (r && r.members && r.members[0]) { ctx.globalAlpha = 0.5; drawBugAt(ctx, r.members[0].spec, S.x + S.w / 2, S.y + S.h - 70, { pose: 'idle', scale: 2.2, t: t * 0.4 }); ctx.globalAlpha = 1; }
      bar();
      this.iconRects = [];
      const cols = 3, iw = 52, gap = Math.floor((S.w - cols * iw) / (cols + 1));
      PHONE_APPS.forEach((a, i) => {
        const ix = S.x + gap + (i % cols) * (iw + gap), iy = S.y + 30 + Math.floor(i / cols) * 62;
        this.iconRects.push({ x: ix, y: iy, w: iw, h: 58 });
        const on = i === this.sel;
        if (on) { ctx.globalAlpha = 0.3; rect(ctx, ix - 3, iy - 3, iw + 6, iw + 6, '#ffffff'); ctx.globalAlpha = 1; }
        rect(ctx, ix + 1, iy + 2, iw, iw, 'rgba(0,0,0,0.4)');
        rect(ctx, ix, iy, iw, iw, a.col);
        vgrad(ctx, ix, iy, iw, iw, lighten(a.col, 0.24), darken(a.col, 0.16));
        for (const [cx, cy] of [[ix, iy], [ix + iw - 1, iy], [ix, iy + iw - 1], [ix + iw - 1, iy + iw - 1]]) rect(ctx, cx, cy, 1, 1, '#0f1420');
        ctx.globalAlpha = 0.18; rect(ctx, ix + 1, iy + 1, iw - 2, Math.floor(iw * 0.4), '#ffffff'); ctx.globalAlpha = 1;
        this.appGlyph(ctx, a, ix, iy, iw);
        drawText(ctx, a.name, ix + iw / 2, iy + iw + 3, '#e8f0fa', { align: 'center', font: 'small' });
        // an unread badge on the two that ever have news
        if (a.key === 'contacts') { const un = (r.contacts || []).filter(k => !r.usedContacts.includes(k)).length; if (un) { circle(ctx, ix + iw - 4, iy + 4, 8, '#e8503a'); drawText(ctx, String(un), ix + iw - 4, iy + 1, '#fff', { align: 'center', font: 'small' }); } }
        if (a.key === 'wallet' && r.money < 10) { circle(ctx, ix + iw - 4, iy + 4, 8, '#e8503a'); drawText(ctx, '!', ix + iw - 4, iy + 1, '#fff', { align: 'center', font: 'small' }); }
      });
      return;
    }
    // ---- an app is open
    const A = PHONE_APPS.find(a => a.key === this.app);
    rect(ctx, S.x, S.y, S.w, S.h, '#10141c');
    if (this.app === 'maps') this.drawMaps(ctx, S);
    else if (this.app === 'contacts') this.drawContacts(ctx, S);
    else if (this.app === 'band') this.drawBand(ctx, S);
    else if (this.app === 'wallet') this.drawWallet(ctx, S);
    else if (this.app === 'weather') this.drawWeather(ctx, S);
    else if (this.app === 'camera') this.drawCamera(ctx, S);
    else if (this.app === 'music') this.drawMusic(ctx, S);
    else if (this.app === 'notes') this.drawNotes(ctx, S);
    else if (this.app === 'bugtube') this.drawTube(ctx, S);
    else if (this.app === 'ramen') this.drawRamen(ctx, S);
    else if (this.app === 'step') this.drawSteps(ctx, S);
    else this.drawSettings(ctx, S);
    bar();
    rect(ctx, S.x, S.y + 16, S.w, 18, A.col);
    drawText(ctx, A.name, S.x + S.w / 2, S.y + 21, '#0f1420', { align: 'center', scale: 2 });
  }
  appGlyph(ctx, a, ix, iy, iw) {
    const cx = ix + iw / 2, cy = iy + iw / 2, t = this.t;
    switch (a.ic) {
      case 'map': {
        rect(ctx, ix + 6, iy + 8, iw - 12, iw - 16, '#e8e2d0');
        for (let i = 0; i < 3; i++) rect(ctx, ix + 6, iy + 14 + i * 9, iw - 12, 3, '#9aa0aa');
        rect(ctx, ix + 16, iy + 8, 3, iw - 16, '#9aa0aa');
        rect(ctx, ix + 24, iy + 18, 5, 5, '#e8503a'); rect(ctx, ix + 25, iy + 23, 3, 4, '#e8503a');
        break;
      }
      case 'contacts': { circle(ctx, cx, cy - 6, 7, '#f0ece2'); ellipsePx(ctx, cx, cy + 9, 12, 8, '#f0ece2'); break; }
      case 'band': { for (let i = 0; i < 3; i++) { circle(ctx, cx - 10 + i * 10, cy - 4, 5, '#fff2d8'); rect(ctx, cx - 14 + i * 10, cy + 2, 8, 9, '#fff2d8'); } break; }
      case 'wallet': { rect(ctx, ix + 8, iy + 14, iw - 16, iw - 26, '#5a3a1e'); rect(ctx, ix + 8, iy + 14, iw - 16, 4, '#7a5030'); circle(ctx, cx + 8, cy + 2, 5, '#f2c94c'); break; }
      case 'weather': { circle(ctx, cx + 6, cy - 6, 8, '#ffe07a'); ellipsePx(ctx, cx - 3, cy + 4, 14, 8, '#f0f4fa'); ellipsePx(ctx, cx + 8, cy + 6, 9, 6, '#f0f4fa'); break; }
      case 'camera': { rect(ctx, ix + 7, iy + 14, iw - 14, iw - 24, '#2a2d33'); circle(ctx, cx, cy + 2, 8, '#111'); circle(ctx, cx, cy + 2, 6, '#4a86f7'); circle(ctx, cx - 2, cy, 2, '#cfe4ff'); break; }
      case 'music': { rect(ctx, cx + 2, cy - 12, 3, 16, '#fff2d8'); rect(ctx, cx + 2, cy - 12, 10, 4, '#fff2d8'); circle(ctx, cx, cy + 5, 5, '#fff2d8'); break; }
      case 'notes': { rect(ctx, ix + 10, iy + 10, iw - 20, iw - 20, '#fdf6e2'); for (let i = 0; i < 4; i++) rect(ctx, ix + 14, iy + 16 + i * 7, iw - 28 - (i % 2) * 6, 2, '#b0a68e'); break; }
      case 'video': { rect(ctx, ix + 8, iy + 14, iw - 16, iw - 26, '#fdf6e2'); ctx.fillStyle = '#c8302c'; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 5); ctx.lineTo(cx + 7, cy + 1); ctx.lineTo(cx - 4, cy + 7); ctx.fill(); break; }
      case 'ramen': { ellipsePx(ctx, cx, cy + 2, 14, 9, '#f0ece2'); ellipsePx(ctx, cx, cy - 1, 11, 6, '#e0a04a'); for (let i = 0; i < 3; i++) rect(ctx, cx - 6 + i * 5, cy - 10 - (i % 2) * 2, 2, 6, '#f0ece2'); break; }
      case 'steps': { for (let i = 0; i < 3; i++) { rect(ctx, cx - 8 + i * 7, cy - 8 + i * 6, 5, 8, '#0f2a18'); } break; }
      default: { circle(ctx, cx, cy, 10, '#d8dce2'); circle(ctx, cx, cy, 5, '#7a8090'); for (let i = 0; i < 6; i++) { const a2 = i * 1.05 + t; rect(ctx, cx + Math.cos(a2) * 12 - 1, cy + Math.sin(a2) * 12 - 1, 3, 3, '#d8dce2'); } }
    }
  }
  // ---- the map app: the whole city, at a glance, with you on it
  drawMaps(ctx, S) {
    const r = Game.run, t = this.t;
    const sf = buildSF();
    const top = S.y + 34, h = S.h - 34;
    // fills the screen and centres on you, the way a map app does
    const k = Math.max(S.w / MAPW, h / MAPH) * 1.25;
    const dw = Math.round(MAPW * k), dh = Math.round(MAPH * k);
    const you = r && r.tile ? { x: (r.tile.tx + 0.5) * TILE, y: (r.tile.ty + 0.5) * TILE } : { x: MAPW / 2, y: MAPH / 2 };
    const ox = Math.round(S.x + S.w / 2 - clamp(you.x * k, S.w / 2, dw - S.w / 2));
    const oy = Math.round(top + h / 2 - clamp(you.y * k, h / 2, dh - h / 2));
    rect(ctx, S.x, top, S.w, h, '#0b1018');
    ctx.save(); ctx.beginPath(); ctx.rect(S.x, top, S.w, h); ctx.clip();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sf.canvas, ox, oy, dw, dh);
    // every pin you can still walk to, and the ones that are done
    for (const n of NODES) {
      const nx = ox + n.x * k, ny = oy + n.y * k;
      const col = PIN_COLOR[n.type] || '#e0523c';
      if (n.type === 'mystery') { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 3 + n.x); rect(ctx, nx - 1, ny - 3, 3, 3, '#c58bff'); ctx.globalAlpha = 1; continue; }
      rect(ctx, nx - 3, ny - 8, 6, 7, col); rect(ctx, nx - 3, ny - 8, 6, 2, lighten(col, 0.3));
      rect(ctx, nx - 1, ny - 1, 2, 3, darken(col, 0.35));
      rect(ctx, nx - 1, ny - 6, 2, 2, '#fff8e8');
    }
    // you, as a blue dot with the accuracy circle round it, like every map app
    if (r && r.tile) {
      const yx = ox + (r.tile.tx + 0.5) * TILE * k, yy = oy + (r.tile.ty + 0.5) * TILE * k;
      ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 2.4); circle(ctx, yx, yy, 13, '#4a86f7'); ctx.globalAlpha = 1;
      circle(ctx, yx, yy, 4, '#ffffff'); circle(ctx, yx, yy, 3, '#2f6fe0');
    }
    ctx.restore();
    // the chrome a map app puts on top
    rect(ctx, S.x + 6, top + 6, S.w - 12, 18, 'rgba(12,16,24,0.8)');
    drawText(ctx, 'TOKYO', S.x + 12, top + 11, '#e8f0fa', { font: 'small' });
    drawText(ctx, (r && r.pos ? String(r.pos).toUpperCase() : ''), S.x + S.w - 12, top + 11, '#8ad8ff', { align: 'right', font: 'small' });
    for (let i = 0; i < 2; i++) { rect(ctx, S.x + S.w - 24, top + 34 + i * 20, 18, 18, 'rgba(12,16,24,0.8)'); drawText(ctx, i ? '-' : '+', S.x + S.w - 15, top + 39 + i * 20, '#e8f0fa', { align: 'center', scale: 2 }); }
    // ---- what is on. Every event and every stage in the city, listed the way
    // a maps app lists what is near you, nearest first.
    const near = NODES.filter(n => n.type === 'event' || n.type === 'venue' || n.type === 'mystery')
      .map(n => ({ n, d: r && r.tile ? Math.hypot(n.x - (r.tile.tx + 0.5) * TILE, n.y - (r.tile.ty + 0.5) * TILE) : 0 }))
      .sort((a, b) => a.d - b.d).slice(0, 3);
    const lh = 16, ly = S.y + S.h - 24 - near.length * lh;
    rect(ctx, S.x + 6, ly - 12, S.w - 12, near.length * lh + 12, 'rgba(12,16,24,0.85)');
    drawText(ctx, 'WHAT IS ON', S.x + 12, ly - 9, '#6be585', { font: 'small' });
    near.forEach((e, i) => {
      const y = ly + 3 + i * lh;
      const col = PIN_COLOR[e.n.type] || '#e0523c';
      rect(ctx, S.x + 12, y + 1, 5, 5, col);
      drawText(ctx, e.n.type === 'mystery' ? '???' : e.n.name, S.x + 22, y, '#e8f0fa', { font: 'small' });
      drawText(ctx, Math.round(e.d / TILE) + ' BLK', S.x + S.w - 12, y, '#8ad8ff', { align: 'right', font: 'small' });
    });
    rect(ctx, S.x + 6, S.y + S.h - 24, S.w - 12, 18, 'rgba(12,16,24,0.8)');
    drawText(ctx, 'STAMINA ' + (r ? r.stamina : 0) + '  DAY ' + ((r ? r.day : 0) + 1) + '/5', S.x + 12, S.y + S.h - 19, '#cfd6e2', { font: 'small' });
  }
  drawContacts(ctx, S) {
    const r = Game.run;
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#f4f1ea');
    this.rows = [];
    if (!this.list.length) { drawWrapped(ctx, 'NOBODY HAS GIVEN YOU THEIR NUMBER YET. GO AND MEET SOMEBODY.', S.x + 12, S.y + 60, S.w - 24, 14, '#5a5468', { font: 'small' }); return; }
    this.list.forEach((k, i) => {
      const C = CONTACTS[k], used = r.usedContacts.includes(k);
      const ry = S.y + 40 + i * 34;
      this.rows.push({ x: S.x, y: ry, w: S.w, h: 32 });
      if (i === this.sel) rect(ctx, S.x, ry, S.w, 32, '#d8e4f8');
      rect(ctx, S.x, ry + 32, S.w, 1, '#d2ccc0');
      circle(ctx, S.x + 20, ry + 16, 12, used ? '#b8b2a8' : (C.col || '#4a86f7'));
      drawText(ctx, (C.name || k).toUpperCase().slice(0, 1), S.x + 20, ry + 12, '#fff', { align: 'center', scale: 2 });
      drawText(ctx, (C.name || k).toUpperCase(), S.x + 38, ry + 7, used ? '#9a94a8' : '#1a1826', { scale: 2 });
      drawText(ctx, used ? 'ALREADY CALLED' : (C.tag || 'TAP TO CALL'), S.x + 38, ry + 22, used ? '#b0aabc' : '#5a5468', { font: 'small' });
    });
  }
  drawBand(ctx, S) {
    const r = Game.run;
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#1b1826');
    (r.members || []).forEach((m, i) => {
      const ry = S.y + 42 + i * 56;
      if (ry > S.y + S.h - 40) return;
      rect(ctx, S.x + 6, ry, S.w - 12, 50, '#2a2438'); frame(ctx, S.x + 6, ry, S.w - 12, 50, '#4a4260');
      drawBugAt(ctx, m.spec, S.x + 32, ry + 42, { pose: 'idle', scale: 1.1, t: this.t * 0.6, phase: i });
      drawText(ctx, (m.name || '').toUpperCase(), S.x + 56, ry + 8, '#fff4d8', { scale: 2 });
      drawText(ctx, (INSTRUMENTS[m.instrument] ? INSTRUMENTS[m.instrument].name : m.instrument).toUpperCase(), S.x + 56, ry + 24, '#8ad8ff', { font: 'small' });
      const hungry = (m.hunger || 0) >= 2;
      drawText(ctx, hungry ? 'HUNGRY' : 'OK', S.x + S.w - 16, ry + 24, hungry ? '#e8503a' : '#6be585', { align: 'right', font: 'small' });
    });
  }
  drawWallet(ctx, S) {
    const r = Game.run;
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#141a14');
    drawText(ctx, fmtMoney(r.money), S.x + S.w / 2, S.y + 60, '#6be585', { align: 'center', scale: 6 });
    drawText(ctx, 'IN THE CASE', S.x + S.w / 2, S.y + 108, '#8a9a88', { align: 'center', font: 'small' });
    const rows = [['TRAIN RIDES', String(r.tickets)], ['STAMINA', r.stamina + '/' + r.staminaMax], ['GRATITUDE', String(r.gratitude || 0)], ['DAY', (r.day + 1) + ' OF 5']];
    rows.forEach(([a, b], i) => {
      const ry = S.y + 140 + i * 26;
      rect(ctx, S.x + 8, ry, S.w - 16, 22, '#1d261d');
      drawText(ctx, a, S.x + 14, ry + 7, '#8a9a88', { font: 'small' });
      drawText(ctx, b, S.x + S.w - 14, ry + 5, '#e8f0e2', { align: 'right', scale: 2 });
    });
    // today's goals, as a to-do list
    drawText(ctx, 'TODAY', S.x + 12, S.y + 254, '#6be585', { scale: 2 });
    (r.goals || []).slice(0, 3).forEach((g, i) => {
      const ry = S.y + 274 + i * 22;
      const done = g.done;
      rect(ctx, S.x + 12, ry, 12, 12, done ? '#6be585' : '#2a332a');
      if (done) { line(ctx, S.x + 14, ry + 6, S.x + 17, ry + 9, '#0f1a0f'); line(ctx, S.x + 17, ry + 9, S.x + 22, ry + 3, '#0f1a0f'); }
      drawText(ctx, (GOALS[g.key] ? GOALS[g.key].name : g.key).toUpperCase(), S.x + 30, ry + 3, done ? '#6a7a68' : '#e8f0e2', { font: 'small' });
    });
  }
  drawWeather(ctx, S) {
    const r = Game.run, wk = WEATHERS[r.weather] || WEATHERS.clear, t = this.t;
    vgrad(ctx, S.x, S.y + 34, S.w, S.h - 34, '#2f6fa8', '#8ad0f0');
    drawText(ctx, 'TOKYO', S.x + S.w / 2, S.y + 48, '#ffffff', { align: 'center', scale: 3 });
    drawText(ctx, wk.name, S.x + S.w / 2, S.y + 78, '#eaf6ff', { align: 'center', scale: 2 });
    circle(ctx, S.x + S.w / 2, S.y + 140, 26, '#ffe07a');
    for (let i = 0; i < 8; i++) { const a = i * 0.79 + t * 0.5; rect(ctx, S.x + S.w / 2 + Math.cos(a) * 36 - 2, S.y + 140 + Math.sin(a) * 36 - 2, 4, 4, '#ffe07a'); }
    if (r.weather === 'rain') for (let i = 0; i < 24; i++) { const rx = S.x + ((i * 37) % S.w), ry = S.y + 40 + ((i * 53 + Math.floor(t * 200)) % (S.h - 60)); rect(ctx, rx, ry, 1, 7, '#cfe8ff'); }
    if (r.weather === 'sakura') for (let i = 0; i < 18; i++) { const rx = S.x + ((i * 41 + Math.floor(t * 20)) % S.w), ry = S.y + 40 + ((i * 59 + Math.floor(t * 40)) % (S.h - 60)); rect(ctx, rx, ry, 3, 2, '#ffc6dd'); }
    drawWrapped(ctx, wk.desc.toUpperCase(), S.x + 12, S.y + 200, S.w - 24, 14, '#0f2a3a', { font: 'small' });
    drawText(ctx, 'TIPS x' + wk.tipMult, S.x + S.w / 2, S.y + S.h - 40, '#0f2a3a', { align: 'center', scale: 2 });
  }
  drawCamera(ctx, S) {
    const r = Game.run, t = this.t;
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#0b0d12');
    const vx = S.x + 8, vy = S.y + 56, vw = S.w - 16, vh = 190;
    rect(ctx, vx, vy, vw, vh, '#1b2230');
    vgrad(ctx, vx, vy, vw, vh, '#2f3f5a', '#151c28');
    (r.members || []).slice(0, 4).forEach((m, i) => {
      const bx = vx + 30 + i * ((vw - 60) / Math.max(1, Math.min(4, r.members.length) - 1 || 1));
      drawBugAt(ctx, m.spec, isFinite(bx) ? bx : vx + vw / 2, vy + vh - 20, { pose: 'cheer', scale: 1.5, t: t * 0.8, phase: i });
    });
    // the focus box and the flash
    frame(ctx, vx + vw / 2 - 30, vy + vh / 2 - 24, 60, 48, '#6be585');
    if (this.shot != null && this.shot < 0.25) { ctx.globalAlpha = 1 - this.shot / 0.25; rect(ctx, vx, vy, vw, vh, '#ffffff'); ctx.globalAlpha = 1; }
    circle(ctx, S.x + S.w / 2, S.y + S.h - 46, 20, '#e8e8ee'); circle(ctx, S.x + S.w / 2, S.y + S.h - 46, 16, '#fdfdff');
    drawText(ctx, this.shot != null && this.shot > 0.3 ? 'SAVED TO THE ROLL' : 'TAP THE SHUTTER', S.x + S.w / 2, S.y + 258, '#8ad8ff', { align: 'center', font: 'small' });
  }
  drawMusic(ctx, S) {
    const r = Game.run, t = this.t;
    vgrad(ctx, S.x, S.y + 34, S.w, S.h - 34, '#2a1020', '#120a16');
    const aw = S.w - 40, ax = S.x + 20, ay = S.y + 54;
    rect(ctx, ax, ay, aw, aw, '#3a1a2a'); frame(ctx, ax, ay, aw, aw, '#7a3a4a');
    circle(ctx, ax + aw / 2, ay + aw / 2, aw / 3, '#1b1220');
    circle(ctx, ax + aw / 2, ay + aw / 2, 6, '#e8c06a');
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.3; ringPx(ctx, ax + aw / 2, ay + aw / 2, aw / 3 - 4 - i * 5, '#5a3a4a'); ctx.globalAlpha = 1; }
    drawText(ctx, 'LAST NIGHT AT THE HIVE', S.x + S.w / 2, ay + aw + 12, '#ffd24a', { align: 'center', font: 'small' });
    drawText(ctx, 'THE BAND YOU WERE IN', S.x + S.w / 2, ay + aw + 26, '#8a7a90', { align: 'center', font: 'small' });
    // a bar meter that moves with nothing in particular
    for (let i = 0; i < 14; i++) { const bh = 6 + Math.abs(Math.sin(t * 3 + i)) * 26; rect(ctx, S.x + 16 + i * ((S.w - 32) / 14), S.y + S.h - 30 - bh, 8, bh, ['#ff5a9a', '#8ad8ff', '#ffd24a'][i % 3]); }
  }
  drawNotes(ctx, S) {
    const r = Game.run;
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#fdf6e2');
    for (let i = 0; i < 16; i++) rect(ctx, S.x + 8, S.y + 56 + i * 16, S.w - 16, 1, '#e0d8c0');
    rect(ctx, S.x + 22, S.y + 34, 1, S.h - 34, '#e8a0a0');
    const lines = (r.log || []).slice(-9);
    if (!lines.length) drawText(ctx, 'NOTHING WRITTEN DOWN YET.', S.x + 28, S.y + 48, '#9a8f78', { font: 'small' });
    lines.forEach((l, i) => drawWrapped(ctx, String(l).toUpperCase(), S.x + 28, S.y + 46 + i * 16, S.w - 40, 16, '#3a3428', { font: 'small' }));
  }
  drawTube(ctx, S) {
    const r = Game.run, t = this.t;
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#f4f1ea');
    const views = 40 + (r.day || 0) * 130 + Math.round((r.gratitude || 0) * 220);
    for (let i = 0; i < 3; i++) {
      const ry = S.y + 44 + i * 78;
      rect(ctx, S.x + 8, ry, 84, 56, '#1b2230');
      vgrad(ctx, S.x + 8, ry, 84, 56, '#2f3f5a', '#151c28');
      if (r.members && r.members[i % r.members.length]) drawBugAt(ctx, r.members[i % r.members.length].spec, S.x + 50, ry + 50, { pose: 'play', scale: 1.1, t: t * 0.7, phase: i });
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(S.x + 70, ry + 44, 20, 10);
      drawText(ctx, '3:1' + i, S.x + 80, ry + 46, '#fff', { align: 'center', font: 'small' });
      drawText(ctx, ['STREET SET, SHIBUYA', 'BUSKER GOES HARD', 'WHO ARE THESE BUGS'][i], S.x + 98, ry + 6, '#1a1826', { font: 'small' });
      drawText(ctx, Math.round(views / (i + 1)) + ' VIEWS', S.x + 98, ry + 22, '#7a7488', { font: 'small' });
      drawText(ctx, '@bugbusker', S.x + 98, ry + 36, '#7a7488', { font: 'small' });
    }
  }
  drawRamen(ctx, S) {
    const t = this.t;
    vgrad(ctx, S.x, S.y + 34, S.w, S.h - 34, '#3a2418', '#1c120c');
    drawText(ctx, 'NEAR YOU', S.x + 12, S.y + 44, '#e88a3c', { scale: 2 });
    const shops = [['MENYA HACHI', '4.8', '$'], ['SOUP CURRY POP', '4.6', '$$'], ['GYOZA STAND', '4.4', '$'], ['TSUKEMEN BROS', '4.9', '$$$']];
    shops.forEach(([nm, st, pr], i) => {
      const ry = S.y + 66 + i * 52;
      rect(ctx, S.x + 8, ry, S.w - 16, 44, '#2c1d14'); frame(ctx, S.x + 8, ry, S.w - 16, 44, '#5a3a24');
      ellipsePx(ctx, S.x + 30, ry + 22, 14, 10, '#f0ece2'); ellipsePx(ctx, S.x + 30, ry + 20, 11, 7, '#e0a04a');
      for (let j = 0; j < 3; j++) rect(ctx, S.x + 24 + j * 5, ry + 8 + (j % 2) * 2 - Math.round(Math.sin(t * 3 + j) * 2), 2, 6, '#f0ece2');
      drawText(ctx, nm, S.x + 52, ry + 8, '#ffe9c8', { scale: 2 });
      drawText(ctx, st + ' STARS   ' + pr, S.x + 52, ry + 26, '#c8a07a', { font: 'small' });
    });
  }
  drawSteps(ctx, S) {
    const r = Game.run, t = this.t;
    vgrad(ctx, S.x, S.y + 34, S.w, S.h - 34, '#0f2a18', '#081409');
    const walked = (r.today && r.today.tiles) || 0;
    const goal = 14;
    drawText(ctx, String(walked), S.x + S.w / 2, S.y + 80, '#6be585', { align: 'center', scale: 8 });
    drawText(ctx, 'BLOCKS TODAY', S.x + S.w / 2, S.y + 140, '#4a8a5a', { align: 'center', font: 'small' });
    const k = clamp(walked / goal, 0, 1);
    ringPx(ctx, S.x + S.w / 2, S.y + 230, 54, '#1c3a24');
    for (let i = 0; i < Math.round(k * 40); i++) { const a = -Math.PI / 2 + (i / 40) * Math.PI * 2; rect(ctx, S.x + S.w / 2 + Math.cos(a) * 54 - 2, S.y + 230 + Math.sin(a) * 54 - 2, 5, 5, '#6be585'); }
    drawText(ctx, Math.round(k * 100) + '%', S.x + S.w / 2, S.y + 224, '#e8f0e2', { align: 'center', scale: 3 });
    drawText(ctx, 'GOAL ' + goal, S.x + S.w / 2, S.y + S.h - 40, '#4a8a5a', { align: 'center', font: 'small' });
  }
  drawSettings(ctx, S) {
    rect(ctx, S.x, S.y + 34, S.w, S.h - 34, '#f0f0f4');
    const rows = [['SOUND', Game.muted ? 'OFF' : 'ON'], ['CARRIER', 'BUG-MOBILE'], ['STORAGE', '2 OF 16 GB'], ['MODEL', 'HANDSET 5'], ['SCREEN', 'CRACKED']];
    rows.forEach(([a, b], i) => {
      const ry = S.y + 44 + i * 34;
      rect(ctx, S.x, ry, S.w, 32, i === 0 ? '#e0e8f6' : '#ffffff');
      rect(ctx, S.x, ry + 32, S.w, 1, '#d8d8e0');
      drawText(ctx, a, S.x + 12, ry + 11, '#1a1826', { scale: 2 });
      drawText(ctx, b, S.x + S.w - 12, ry + 11, i === 0 ? (Game.muted ? '#c8402c' : '#3f9a5a') : '#7a7488', { align: 'right', scale: 2 });
    });
    drawText(ctx, 'TAP TO TOGGLE SOUND', S.x + S.w / 2, S.y + S.h - 30, '#7a7488', { align: 'center', font: 'small' });
  }
}
