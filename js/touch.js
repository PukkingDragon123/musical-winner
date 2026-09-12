// ---------- Touch controls ----------
'use strict';
class Btn {
  constructor(x, y, w, h, label, onTap, opts = {}) { Object.assign(this, { x, y, w, h, label, onTap, opts, held: false, flash: 0 }); }
  hit(px, py) { return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h; }
  draw(ctx, state) { uiButton(ctx, this.x, this.y, this.w, this.h, this.label, state || (this.flash > 0 ? 'down' : 'normal'), this.opts); }
  update(dt) { this.flash = Math.max(0, this.flash - dt * 4); }
}
function buildPads(instr, area, qte) {
  const pads = []; const { x, y, w, h } = area;
  const add = (fx, fw, code, label, color, sub) => pads.push({ x: Math.round(x + w * fx), y, w: Math.round(w * fw) - 3, h, code, label, color, sub });
  if (qte) { add(0.1, 0.8, 'Space', 'TAP', '#5bc0ff', 'HIT THE RING'); return pads; }
  switch (instr.game) {
    case 'lanes': { const L = instr.lanes; for (let i = 0; i < L; i++) add(i / L, 1 / L, instr.keys[i], instr.keyNames[i], LANE_COLORS[i]); break; }
    case 'taiko': add(0, 0.22, 'KeyD', 'KA', '#5bc0ff'); add(0.22, 0.28, 'KeyF', 'DON', '#ff6b6b'); add(0.50, 0.28, 'KeyJ', 'DON', '#ff6b6b'); add(0.78, 0.22, 'KeyK', 'KA', '#5bc0ff'); break;
    case 'wind': add(0.1, 0.8, 'Space', 'BLOW', '#e0b040', 'HOLD THE PAD'); break;
    case 'valves': add(0.14, 0.24, 'KeyJ', '1', '#f0c040'); add(0.38, 0.24, 'KeyK', '2', '#f0c040'); add(0.62, 0.24, 'KeyL', '3', '#f0c040'); break;
    case 'bow': add(0.04, 0.46, 'ArrowUp', '↑ UP BOW', '#c58bff'); add(0.50, 0.46, 'ArrowDown', '↓ DOWN BOW', '#6be585'); break;
  }
  return pads;
}
function drawPads(ctx, pads, downCodes) {
  for (const p of pads) {
    const on = downCodes.has(p.code);
    rect(ctx, p.x, p.y, p.w, p.h, on ? p.color : '#181430'); frame(ctx, p.x, p.y, p.w, p.h, on ? '#fff' : darken(p.color, 0.3)); rect(ctx, p.x + 1, p.y + 1, p.w - 2, 1, on ? '#fff' : darken(p.color, 0.5));
    const col = on ? '#141026' : p.color; const big = p.label.length <= 3;
    drawText(ctx, p.label, p.x + p.w / 2, p.y + (p.sub ? 12 : Math.floor((p.h - (big ? 14 : 7)) / 2)), col, { align: 'center', scale: big ? 2 : 1 });
    if (p.sub) drawText(ctx, p.sub, p.x + p.w / 2, p.y + p.h - 12, on ? '#141026' : '#8a80c0', { align: 'center', font: 'small' });
  }
}
