// ---------- UI kit: parchment panels, wooden frames, green buttons, gold slots ----------
'use strict';
const UI = {
  paper: '#f0e2bc', paperHi: '#fbf2d8', paperLo: '#d8c49a', paperLine: '#c9ad74',
  wood: '#5a3a1e', woodHi: '#8a5a30', woodLo: '#3a2410', woodMid: '#6e4622',
  ink: '#3a2a1a', inkSoft: '#6b5138', inkFaint: '#9a7d55',
  green: '#78b04a', greenHi: '#a8d56a', greenLo: '#4f8032', greenOl: '#2a4a1c',
  red: '#c8433a', redHi: '#e57b6a', redLo: '#8a2a22',
  blue: '#4d86c6', blueHi: '#86b6e8', blueLo: '#2f5a8a',
  gold: '#d9a520', goldHi: '#f6d95a', goldLo: '#8a6010', goldOl: '#4a3208',
  slot: '#6a4a2a', slotHi: '#8a6438', slotLo: '#4a3018',
  header: '#5d8c56', headerHi: '#7fae74',
  line: '#33402f', lineHi: '#8a9a72',
};

let _paperTex = null;
function paperTexture() {
  if (_paperTex) return _paperTex;
  const c = makeCanvas(64, 64), x = c.getContext('2d'); const r = makeRng(99);
  x.fillStyle = UI.paper; x.fillRect(0, 0, 64, 64);
  for (let i = 0; i < 520; i++) { x.fillStyle = r.chance(0.5) ? UI.paperHi : UI.paperLo; x.globalAlpha = 0.35; x.fillRect(r.int(0, 63), r.int(0, 63), r.int(1, 3), 1); }
  x.globalAlpha = 1; _paperTex = x.createPattern(c, 'repeat'); return _paperTex;
}
// Cream panel with a hard dark border and a coloured title bar.
// opts: {title, close, color}
function uiPanel(ctx, x, y, w, h, opts = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  ctx.fillStyle = 'rgba(12,10,18,0.38)'; ctx.fillRect(x + 4, y + 5, w, h);
  // hard outer border, then a mid rail, then the cream field
  rect(ctx, x, y, w, h, UI.line);
  rect(ctx, x + 2, y + 2, w - 4, h - 4, UI.lineHi);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, UI.paper);
  // inner bevel: light at the top-left, shadowed at the bottom-right
  rect(ctx, x + 3, y + 3, w - 6, 1, UI.paperHi); rect(ctx, x + 3, y + 3, 1, h - 6, UI.paperHi);
  rect(ctx, x + 3, y + h - 4, w - 6, 1, UI.paperLo); rect(ctx, x + w - 4, y + 3, 1, h - 6, UI.paperLo);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y + 4, w - 8, h - 8); ctx.clip();
  ctx.globalAlpha = 0.5; ctx.fillStyle = paperTexture(); ctx.fillRect(x + 4, y + 4, w - 8, h - 8); ctx.globalAlpha = 1; ctx.restore();
  // corner studs
  for (const [nx, ny] of [[x + 3, y + 3], [x + w - 5, y + 3], [x + 3, y + h - 5], [x + w - 5, y + h - 5]]) rect(ctx, nx, ny, 2, 2, UI.line);
  let top = y + 3;
  if (opts.title) {
    const th = 17, col = opts.color || UI.header;
    rect(ctx, x + 3, y + 3, w - 6, th, col);
    rect(ctx, x + 3, y + 3, w - 6, 1, lighten(col, 0.2));
    rect(ctx, x + 3, y + 2 + th, w - 6, 2, UI.line);
    drawText(ctx, opts.title, x + w / 2, y + 8, '#fdf6e2', { align: 'center', shadow: darken(col, 0.35) });
    if (opts.close) uiCloseBox(ctx, x + w - 19, y + 6);
    top = y + 5 + th;
  }
  return { x: x + 6, y: top + 2, w: w - 12, h: h - (top - y) - 8 };
}
function uiCloseBox(ctx, x, y) {
  rect(ctx, x, y, 10, 10, UI.woodLo); rect(ctx, x + 1, y + 1, 8, 8, UI.red); rect(ctx, x + 1, y + 1, 8, 1, UI.redHi);
  line(ctx, x + 3, y + 3, x + 6, y + 6, '#fff'); line(ctx, x + 6, y + 3, x + 3, y + 6, '#fff');
}
// Green pill button. state: 'normal'|'hover'|'down'|'disabled'
function uiButton(ctx, x, y, w, h, label, state = 'normal', opts = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const down = state === 'down'; const dis = state === 'disabled';
  const base = opts.color || (dis ? '#8a8a7a' : UI.green), hi = dis ? '#a8a898' : (opts.hi || UI.greenHi), lo = dis ? '#5a5a50' : (opts.lo || UI.greenLo), ol = opts.ol || UI.greenOl;
  // A real button has a side to it. The face sits on a lip, and pressing it
  // drops the face onto the lip instead of just tinting the same rectangle.
  const lip = h >= 34 ? 5 : h >= 22 ? 4 : 2;
  const oy = down ? lip - 1 : 0;
  const fh = h - lip;                                    // the face itself
  // the body under the face, and the shadow it casts
  ctx.globalAlpha = 0.28; rect(ctx, x + 2, y + h - 1, w - 4, 3, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x + 1, y + 2, w - 2, h - 3, darken(ol, 0.18));
  rect(ctx, x, y + 3, w, h - 5, darken(ol, 0.18));
  // the face: a slab with a bevel, a gradient and a gloss across the top half
  const fy = y + oy;
  rect(ctx, x + 1, fy, w - 2, fh, ol); rect(ctx, x, fy + 1, w, fh - 2, ol);
  vgrad(ctx, x + 2, fy + 1, w - 4, fh - 2, hi, base);
  vgrad(ctx, x + 1, fy + 2, w - 2, fh - 4, hi, base);
  ctx.globalAlpha = 0.16; rect(ctx, x + 2, fy + 1, w - 4, Math.floor(fh * 0.42), '#ffffff'); ctx.globalAlpha = 1;
  rect(ctx, x + 2, fy + 1, w - 4, 1, lighten(hi, 0.3));
  rect(ctx, x + 1, fy + 2, 1, fh - 4, lighten(hi, 0.18));
  rect(ctx, x + 2, fy + fh - 2, w - 4, 1, lo);
  rect(ctx, x + w - 2, fy + 2, 1, fh - 4, lo);
  // the corners knocked off, so it reads as moulded and not as a rectangle
  for (const [cx, cy] of [[x + 1, fy + 1], [x + w - 2, fy + 1], [x + 1, fy + fh - 2], [x + w - 2, fy + fh - 2]]) rect(ctx, cx, cy, 1, 1, ol);
  if (state === 'hover') { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 2, fy + 1, w - 4, fh - 2); frame(ctx, x, fy, w, fh, lighten(hi, 0.4)); }
  if (down) { ctx.globalAlpha = 0.18; rect(ctx, x + 2, fy + 1, w - 4, 3, '#000'); ctx.globalAlpha = 1; }
  const tc = dis ? '#dcdccc' : (opts.text || '#fff8e8');
  // The label is drawn as large as the button will hold. Without a scale it
  // grows to fill; with one it still shrinks rather than spilling out of the
  // box, which is what used to happen to the longer labels.
  let sc = opts.scale || 4;
  const room = w - 12 - (opts.icon ? opts.icon.width + 8 : 0);
  while (sc > 1 && textWidth(label, { scale: sc }) > room) sc--;
  const tx = opts.icon ? x + 8 + opts.icon.width + (w - 16 - opts.icon.width) / 2 : x + w / 2;
  drawText(ctx, label, tx, fy + Math.floor((fh - 7 * sc) / 2), tc, { align: 'center', scale: sc, shadow: opts.noShadow ? null : ol });
  if (opts.icon) ctx.drawImage(opts.icon, x + 8, fy + Math.floor((fh - opts.icon.height) / 2));
}
// Ornate gold slot with dark leather interior
function uiSlot(ctx, x, y, size = 26, opts = {}) {
  x = Math.round(x); y = Math.round(y); const s = size;
  const sel = opts.selected, empty = opts.empty;
  rect(ctx, x, y, s, s, UI.goldOl);
  rect(ctx, x + 1, y + 1, s - 2, s - 2, sel ? UI.goldHi : UI.gold);
  rect(ctx, x + 1, y + 1, s - 2, 1, UI.goldHi); rect(ctx, x + 1, y + 1, 1, s - 2, UI.goldHi);
  rect(ctx, x + 1, y + s - 2, s - 2, 1, UI.goldLo); rect(ctx, x + s - 2, y + 1, 1, s - 2, UI.goldLo);
  rect(ctx, x + 3, y + 3, s - 6, s - 6, UI.goldOl);
  const inner = empty ? '#4a3a2a' : UI.slot;
  rect(ctx, x + 4, y + 4, s - 8, s - 8, inner);
  rect(ctx, x + 4, y + 4, s - 8, 1, empty ? '#5a4a38' : UI.slotHi); rect(ctx, x + 4, y + s - 5, s - 8, 1, UI.slotLo);
  // corner filigree
  for (const [cx, cy, dx, dy] of [[x + 2, y + 2, 1, 1], [x + s - 3, y + 2, -1, 1], [x + 2, y + s - 3, 1, -1], [x + s - 3, y + s - 3, -1, -1]]) {
    px(ctx, cx, cy, UI.goldHi); px(ctx, cx + dx, cy, UI.goldLo); px(ctx, cx, cy + dy, UI.goldLo); px(ctx, cx + dx * 2, cy + dy * 2, UI.goldHi);
  }
  if (opts.count != null) { drawText(ctx, String(opts.count), x + s - 3, y + s - 8, '#fff', { align: 'right', font: 'small', outline: '#000' }); }
  if (sel) { frame(ctx, x - 1, y - 1, s + 2, s + 2, '#fff8e8'); }
}
// Round portrait frame for HUD
function uiPortrait(ctx, x, y, r, drawInner) {
  circle(ctx, x, y, r + 2, UI.woodLo); circle(ctx, x, y, r + 1, UI.gold); circle(ctx, x, y, r, '#2a2438');
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip(); drawInner(); ctx.restore();
  ringPx(ctx, x, y, r + 1, UI.goldHi);
}
// Segmented bar (hp style). color for fill
function uiBar(ctx, x, y, w, h, t, color, opts = {}) {
  x = Math.round(x); y = Math.round(y);
  rect(ctx, x, y, w, h, UI.woodLo); rect(ctx, x + 1, y + 1, w - 2, h - 2, '#2a2020');
  const fw = Math.round((w - 2) * clamp(t, 0, 1));
  if (fw > 0) { rect(ctx, x + 1, y + 1, fw, h - 2, color); rect(ctx, x + 1, y + 1, fw, 1, lighten(color, 0.2)); rect(ctx, x + 1, y + h - 2, fw, 1, darken(color, 0.2)); }
  if (opts.segments) for (let i = 1; i < opts.segments; i++) rect(ctx, x + Math.round((w - 2) * i / opts.segments), y + 1, 1, h - 2, 'rgba(0,0,0,0.35)');
  if (opts.label) drawText(ctx, opts.label, x + w / 2, y + Math.floor((h - 5) / 2), '#fff', { align: 'center', font: 'small', outline: '#000' });
}
// Speech / dialogue box with speaker tag
function uiDialog(ctx, x, y, w, h, speaker, text, opts = {}) {
  const inner = uiPanel(ctx, x, y, w, h);
  if (speaker) { const tw = textWidth(speaker) + 12; rect(ctx, x + 10, y - 6, tw, 13, UI.woodLo); rect(ctx, x + 11, y - 5, tw - 2, 11, opts.tagColor || UI.header); drawText(ctx, speaker, x + 16, y - 3, '#fff8e8'); }
  const lines = wrapText(text, Math.floor((w - 24) / 6));
  lines.forEach((l, i) => drawText(ctx, l, inner.x + 8, inner.y + 8 + i * 10, UI.ink));
  if (opts.more) drawText(ctx, '▼', x + w - 14, y + h - 12, UI.inkSoft, { font: 'small' });
  return inner;
}
// Scroll ribbon title
function uiRibbon(ctx, cx, y, text, opts = {}) {
  const w = textWidth(text, { scale: opts.scale || 1 }) + 30, h = 14 + (opts.scale ? (opts.scale - 1) * 8 : 0);
  const x = Math.round(cx - w / 2);
  const col = opts.color || UI.red, hi = lighten(col, 0.18), lo = darken(col, 0.2);
  rect(ctx, x - 6, y + 3, w + 12, h - 3, lo); rect(ctx, x - 8, y + 5, 4, h - 6, lo); rect(ctx, x + w + 4, y + 5, 4, h - 6, lo);
  rect(ctx, x, y, w, h, darken(col, 0.4)); rect(ctx, x + 1, y + 1, w - 2, h - 2, col); rect(ctx, x + 1, y + 1, w - 2, 1, hi); rect(ctx, x + 1, y + h - 2, w - 2, 1, lo);
  drawText(ctx, text, cx, y + Math.floor((h - 7 * (opts.scale || 1)) / 2), '#fff8e8', { align: 'center', scale: opts.scale || 1, shadow: lo });
}
// Item / node icons: small 12x12 pixel icons built procedurally
const ICON_DEFS = {
  gig:      { rows: ['.....nn.....', '.....n.n....', '.....n..n...', '.....n......', '.....n......', '.....n......', '...nnn......', '..nnnn......', '..nnnn......', '...nn.......'], pal: { n: '#fff8e8' } },
  elite:    { rows: ['.....y......', '....yyy.....', '.yyyyyyyyy..', '..yyyyyyy...', '...yyyyy....', '..yyy.yyy...', '.yy.....yy..'], pal: { y: '#ffd24a' } },
  boss:     { rows: ['y....y....y.', 'yy...y...yy.', 'yyy.yyy.yyy.', 'yyyyyyyyyyy.', 'yyyyyyyyyyy.', '.yyyyyyyyy..', '.rrrrrrrrr..'], pal: { y: '#ffd24a', r: '#d84040' } },
  shop:     { rows: ['....gggg....', '...g....g...', 'bbbbbbbbbbbb', 'byyyyyyyyyyb', 'byyyyyyyyyyb', 'byyyyyyyyyyb', 'bbbbbbbbbbbb'], pal: { g: '#ddd', b: '#b06a2a', y: '#f4d890' } },
  event:    { rows: ['...wwwww....', '..ww...ww...', '.......ww...', '......ww....', '.....ww.....', '.....ww.....', '............', '.....ww.....', '.....ww.....'], pal: { w: '#8ad8ff' } },
  rest:     { rows: ['............', '...bbbbbb...', '..bbbbbbbb..', 'wwwwwwwwwwww', 'wwwwwwwwwwww', 'p..........p', 'p..........p'], pal: { b: '#d05070', w: '#f0eee8', p: '#a08060' } },
  treasure: { rows: ['..bbbbbbbb..', '.bbbbbbbbbb.', 'bbbbbyybbbbb', 'yyyyyyyyyyyy', 'bbbbbyybbbbb', 'bbbbbbbbbbbb', '.bbbbbbbbbb.'], pal: { b: '#b07030', y: '#ffd24a' } },
  openmic:  { rows: ['....mmmm....', '...mmmmmm...', '...mmmmmm...', '....mmmm....', '.....ss.....', '.....ss.....', '....ssss....'], pal: { m: '#e0e0e8', s: '#777' } },
  coin:     { rows: ['..gggg..', '.gyyyyg.', 'gyyggyyg', 'gyyggyyg', 'gyyyyyyg', '.gyyyyg.', '..gggg..'], pal: { g: '#b8860b', y: '#ffd24a' } },
  bill:     { rows: ['gggggggggg', 'gwwgwwwwgg', 'gwwgwgwwgg', 'gwwgwwwwgg', 'gggggggggg'], pal: { g: '#5ab060', w: '#c8f0c0' } },
  heart:    { rows: ['.pp.pp.', 'ppppppp', 'ppppppp', '.ppppp.', '..ppp..', '...p...'], pal: { p: '#ff5a7a' } },
  note:     { rows: ['...nn', '...n.', '...n.', '...n.', 'nnnn.', 'nnnn.', '.nn..'], pal: { n: '#fff8e8' } },
  fire:     { rows: ['...r...', '..rr...', '..rrr..', '.rroor.', '.rooor.', 'rooyoor', '.rooor.', '..ooo..'], pal: { r: '#e04020', o: '#ff9020', y: '#fff080' } },
  skull:    { rows: ['.wwwww.', 'wwwwwww', 'wbwwwbw', 'wwwwwww', '.wwwww.', '.w.w.w.'], pal: { w: '#eee', b: '#222' } },
  lock:     { rows: ['..ggg..', '.g...g.', '.g...g.', 'yyyyyyy', 'yyyyyyy', 'yyykyyy', 'yyyyyyy'], pal: { g: '#aaa', y: '#e0b040', k: '#5a3a10' } },
  check:    { rows: ['......g', '.....gg', '....gg.', 'g..gg..', 'gggg...', '.gg....'], pal: { g: '#6be585' } },
  arrowR:   { rows: ['g....', 'gg...', 'ggg..', 'gggg.', 'ggggg', 'gggg.', 'ggg..', 'gg...', 'g....'], pal: { g: '#3a6a2a' } },
  arrowL:   { rows: ['....g', '...gg', '..ggg', '.gggg', 'ggggg', '.gggg', '..ggg', '...gg', '....g'], pal: { g: '#3a6a2a' } },
  arrowU:   { rows: ['....g....', '...ggg...', '..ggggg..', '.ggggggg.', 'ggggggggg'], pal: { g: '#3a6a2a' } },
  cop:      { rows: ['..bbbbbb..', '.bbbbbbbb.', 'bbbbbbbbbb', '...yyyy...', '..yeyyey..', '..yyyyyy..', '...bbbb...'], pal: { b: '#2a3a8a', y: '#e0c090', e: '#000' } },
  rain:     { rows: ['..cccccc..', '.cccccccc.', 'cccccccccc', '..........', '.b..b..b..', 'b..b..b...', '.b..b..b..'], pal: { c: '#aab', b: '#60a0ff' } },
  food:     { rows: ['...wwww...', '..wwwwww..', '.wwwwwwww.', 'bbbbbbbbbb', '.bbbbbbbb.', '..bbbbbb..', '...bbbb...'], pal: { w: '#f0f0e0', b: '#c08040' } },
  money:    { rows: ['gggggggggg', 'gwgwwwwgwg', 'gwgwwwwgwg', 'gwgwwwwgwg', 'gggggggggg'], pal: { g: '#5ab060', w: '#c8f0c0' } },
  mult:     { rows: ['r.....r', '.r...r.', '..r.r..', '...r...', '..r.r..', '.r...r.', 'r.....r'], pal: { r: '#ff5a5a' } },
  mystery:  { rows: ['..pppppp..', '.pp....pp.', '.......pp.', '.....ppp..', '....pp....', '....pp....', '..........', '....pp....', '....pp....'], pal: { p: '#c58bff' } },
  dango:    { rows: ['...ggg...', '..ggggg..', '...ggg...', '...ppp...', '..ppppp..', '...ppp...', '...www...', '..wwwww..', '...www...', '....s....', '....s....'], pal: { g: '#9ed46a', p: '#f0a8c0', w: '#f4ecd8', s: '#b08050' } },
  cat:      { rows: ['.k...k.', 'kk...kk', 'kkkkkkk', 'kykkkyk', 'kkkkkkk', '.kkkkk.', '..k.k..'], pal: { k: '#2a2430', y: '#ffd24a' } },
  chips:    { rows: ['..bbbb..', '.bwwwwb.', 'bwwwwwwb', 'bwwbbwwb', 'bwwwwwwb', '.bwwwwb.', '..bbbb..'], pal: { b: '#3a6ab0', w: '#8ab8ff' } },
};
function icon(kind) { const d = ICON_DEFS[kind] || ICON_DEFS.event; return cached('icon|' + kind, () => pixFromRows(d.rows, d.pal).toCanvas()); }
