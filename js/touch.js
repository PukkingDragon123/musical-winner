// ---------- Touch controls: on-screen buttons and rhythm pads ----------
'use strict';

// A tappable on-screen button drawn on the canvas.
class Btn {
  constructor(x, y, w, h, label, onTap, opts = {}) {
    Object.assign(this, { x, y, w, h, label, onTap, opts, held: false, flash: 0 });
  }
  hit(px, py) { return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h; }
  draw(ctx) {
    const o = this.opts;
    const bg = this.held ? (o.activeBg || '#5a54a0') : (o.bg || '#2a2540');
    const border = o.border || '#8a80c0';
    rect(ctx, this.x, this.y, this.w, this.h, bg);
    frame(ctx, this.x, this.y, this.w, this.h, border);
    if (this.flash > 0) { ctx.globalAlpha = this.flash * 2; rect(ctx, this.x + 1, this.y + 1, this.w - 2, this.h - 2, o.activeBg || '#fff'); ctx.globalAlpha = 1; }
    const scale = o.scale || 1;
    drawText(ctx, this.label, this.x + this.w / 2, this.y + Math.floor((this.h - 5 * scale) / 2), o.color || '#fff', { align: 'center', scale });
    if (o.sub) drawText(ctx, o.sub, this.x + this.w / 2, this.y + this.h - 7, o.subColor || '#cfc9e6', { align: 'center' });
  }
  update(dt) { this.flash = Math.max(0, this.flash - dt * 4); }
}

// Builds the row of rhythm pads for the instrument currently being played.
// Returns [{x, y, w, h, code, label, sub, color}]
function buildPads(instr, area) {
  const pads = [];
  const { x, y, w, h } = area;
  const add = (fx, fw, code, label, color, sub) => pads.push({ x: Math.round(x + w * fx), y, w: Math.round(w * fw) - 2, h, code, label, color, sub });
  switch (instr.game) {
    case 'lanes': {
      const L = instr.lanes;
      for (let i = 0; i < L; i++) add(i / L, 1 / L, instr.keys[i], instr.keyNames[i], LANE_COLORS[i]);
      break;
    }
    case 'taiko':
      add(0, 0.22, 'KeyD', 'KA', '#5bc0ff');
      add(0.22, 0.28, 'KeyF', 'DON', '#ff6b6b');
      add(0.50, 0.28, 'KeyJ', 'DON', '#ff6b6b');
      add(0.78, 0.22, 'KeyK', 'KA', '#5bc0ff');
      break;
    case 'wind':
      add(0.1, 0.8, 'Space', 'BLOW', '#e0b040', 'HOLD THE PAD');
      break;
    case 'valves':
      add(0.14, 0.24, 'KeyJ', '1', '#f0c040');
      add(0.38, 0.24, 'KeyK', '2', '#f0c040');
      add(0.62, 0.24, 'KeyL', '3', '#f0c040');
      break;
    case 'bow':
      add(0.04, 0.46, 'ArrowUp', '↑ UP BOW', '#c58bff');
      add(0.50, 0.46, 'ArrowDown', '↓ DOWN BOW', '#6be585');
      break;
  }
  return pads;
}

function drawPads(ctx, pads, downCodes, t) {
  for (const p of pads) {
    const on = downCodes.has(p.code);
    rect(ctx, p.x, p.y, p.w, p.h, on ? p.color : '#181430');
    frame(ctx, p.x, p.y, p.w, p.h, on ? '#fff' : shade(p.color, -40));
    rect(ctx, p.x + 1, p.y + 1, p.w - 2, 1, on ? '#fff' : shade(p.color, -70));
    const col = on ? '#141026' : p.color;
    const big = p.label.length <= 3;
    drawText(ctx, p.label, p.x + p.w / 2, p.y + (p.sub ? 10 : Math.floor((p.h - (big ? 10 : 5)) / 2)), col, { align: 'center', scale: big ? 2 : 1 });
    if (p.sub) drawText(ctx, p.sub, p.x + p.w / 2, p.y + p.h - 9, on ? '#141026' : '#8a80c0', { align: 'center' });
  }
}
