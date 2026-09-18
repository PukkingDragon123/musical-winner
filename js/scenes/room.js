// ---------- Rooms you walk around in ----------
// The airport, the second-hand music shop, the ramen counter, the capsule
// hotel. All of them are the same thing: a floor, walls, a lot of furniture
// you can bump into, people with somewhere to be, and things you can stand in
// front of and use. Same camera, same movement, same game as the street.
'use strict';
const RT = 24;                                  // room tile
// ---------- Furniture ----------
// Everything here is drawn in room pixels. `solid` is what you cannot walk
// through; `label` is what it says when you stand in front of it.
function drawRoomProp(ctx, p, t, room) {
  const x = p.x, y = p.y, w = p.w, h = p.h;
  const sh = () => { ctx.globalAlpha = 0.28; rect(ctx, x + 3, y + 4, w, h, '#000'); ctx.globalAlpha = 1; };
  switch (p.kind) {
    // ---- airport
    case 'seats': {
      sh();
      for (let i = 0; i < Math.max(1, Math.floor(w / 22)); i++) {
        const sx = x + i * 22;
        rect(ctx, sx + 1, y + 4, 20, 16, '#2f4a68'); rect(ctx, sx + 1, y + 4, 20, 3, '#4a6f96');
        rect(ctx, sx + 1, y, 20, 6, '#24384f');
        rect(ctx, sx + 2, y + 19, 3, 5, '#8a8f98'); rect(ctx, sx + 17, y + 19, 3, 5, '#8a8f98');
      }
      break;
    }
    case 'bench': { sh(); rect(ctx, x, y + 2, w, h - 6, '#8a6a44'); rect(ctx, x, y + 2, w, 2, '#a88a5e'); for (let i = 0; i < w; i += 8) rect(ctx, x + i, y + 2, 1, h - 6, '#6a5030'); rect(ctx, x + 2, y + h - 4, 4, 4, '#4a4a52'); rect(ctx, x + w - 6, y + h - 4, 4, 4, '#4a4a52'); break; }
    case 'luggage': {
      sh();
      const cols = ['#c8402c', '#2f5a9a', '#3f8f6a', '#d8b83c', '#6a4a8a'];
      for (let i = 0; i < Math.max(1, Math.floor(w / 14)); i++) {
        const bx = x + i * 14, c = cols[(i + p.x) % cols.length];
        rect(ctx, bx + 1, y + 2, 12, h - 4, c); rect(ctx, bx + 1, y + 2, 12, 2, lighten(c, 0.25));
        rect(ctx, bx + 4, y, 6, 3, '#4a4a52'); rect(ctx, bx + 2, y + Math.floor(h / 2), 10, 1, darken(c, 0.3));
      }
      break;
    }
    case 'counter': {
      sh();
      rect(ctx, x, y, w, h, '#d8d2c4'); rect(ctx, x, y, w, 4, '#f0ece2');
      rect(ctx, x, y + h - 5, w, 5, '#9a958a');
      for (let i = 12; i < w - 8; i += 34) { rect(ctx, x + i, y + 5, 16, 11, '#1b2230'); rect(ctx, x + i + 1, y + 6, 14, 9, '#3f6f9e'); rect(ctx, x + i + 1, y + 6, 14, 3, '#6fa8e8'); }
      break;
    }
    case 'board': {
      rect(ctx, x, y, w, h, '#0d1018'); frame(ctx, x, y, w, h, '#3a4250');
      for (let i = 0; i < Math.floor(h / 9); i++) {
        const ry = y + 4 + i * 9, on = ((Math.floor(t * 2) + i) % 7) !== 0;
        drawText(ctx, ['TOKYO', 'OSAKA', 'SAPPORO', 'NAHA', 'SEOUL'][i % 5], x + 5, ry, on ? '#ffc040' : '#6a5a20', { font: 'small' });
        drawText(ctx, ['ON TIME', 'BOARDING', 'DELAYED', 'ARRIVED'][(i + Math.floor(t)) % 4], x + w - 5, ry, on ? '#6be585' : '#2a5a38', { align: 'right', font: 'small' });
      }
      break;
    }
    case 'sign': {
      rect(ctx, x, y, w, h, p.col || '#1f6f4a'); frame(ctx, x, y, w, h, '#0f3a28');
      rect(ctx, x + 1, y + 1, w - 2, 2, lighten(p.col || '#1f6f4a', 0.3));
      drawText(ctx, p.text || 'EXIT', x + w / 2, y + Math.floor((h - 7) / 2), '#f0f6f0', { align: 'center' });
      if (p.arrow) { ctx.fillStyle = '#f0f6f0'; const ax = p.arrow < 0 ? x + 6 : x + w - 6; ctx.beginPath(); ctx.moveTo(ax + p.arrow * 5, y + h / 2); ctx.lineTo(ax - p.arrow * 2, y + h / 2 - 4); ctx.lineTo(ax - p.arrow * 2, y + h / 2 + 4); ctx.fill(); }
      break;
    }
    case 'vending': {
      sh();
      rect(ctx, x, y, w, h, '#c8402c'); rect(ctx, x, y, w, 4, '#e8604c');
      rect(ctx, x + 2, y + 5, w - 4, h - 20, '#12161f');
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < Math.floor((w - 8) / 9); c2++) {
        const bx = x + 5 + c2 * 9, by = y + 8 + r2 * 10;
        if (by + 8 > y + h - 15) continue;
        rect(ctx, bx, by, 6, 8, ['#4a86f7', '#f2c94c', '#6be585', '#f0f0ff', '#e8503a'][(c2 + r2) % 5]);
        rect(ctx, bx, by, 6, 2, '#ffffff');
      }
      rect(ctx, x + 3, y + h - 14, w - 6, 5, '#e8e4dc');
      rect(ctx, x + 3, y + h - 8, w - 6, 6, '#2a2d33');
      ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 3); rect(ctx, x + 2, y + 5, w - 4, h - 20, '#ffffff'); ctx.globalAlpha = 1;
      break;
    }
    case 'trolley': { sh(); rect(ctx, x, y + 4, w, 4, '#8a8f98'); rect(ctx, x + 1, y + 8, w - 2, h - 12, '#b9bec6'); rect(ctx, x + 2, y, 3, 8, '#8a8f98'); circle(ctx, x + 4, y + h - 2, 3, '#2a2d33'); circle(ctx, x + w - 4, y + h - 2, 3, '#2a2d33'); break; }
    case 'plant': { sh(); rect(ctx, x + 2, y + h - 9, w - 4, 9, '#8a5f3a'); rect(ctx, x + 2, y + h - 9, w - 4, 2, '#a87a50'); const m = 5; for (let i = 0; i < 7; i++) { const a = i * 0.9, lx = x + w / 2 + Math.cos(a) * m, ly = y + h - 12 + Math.sin(a) * m * 0.7; ellipsePx(ctx, lx, ly, 6, 4, i % 2 ? '#2f8f4a' : '#43a85c'); } break; }
    case 'gate': {
      rect(ctx, x, y, w, h, '#1b2230'); rect(ctx, x + 3, y + 3, w - 6, h - 6, '#2f3f5a');
      rect(ctx, x + 6, y + 6, w - 12, h - 20, '#0d1018');
      drawText(ctx, p.text || 'GATE 4', x + w / 2, y + h - 12, '#8ad8ff', { align: 'center', font: 'small' });
      break;
    }
    // ---- the second-hand music shop
    case 'wallguitars': {
      rect(ctx, x, y, w, h, '#4a3524'); rect(ctx, x, y, w, 3, '#6a4f36');
      const n = Math.max(1, Math.floor(w / 26));
      for (let i = 0; i < n; i++) {
        const gx = x + 8 + i * 26, col = ['#c8402c', '#e8c040', '#2f5a9a', '#f0ece2', '#3f8f6a', '#8a4fd0'][(i + p.x / 7) % 6 | 0];
        rect(ctx, gx + 5, y + 6, 3, 22, '#3a2a1c');                  // neck
        ellipsePx(ctx, gx + 6, y + 32, 8, 10, col);
        ellipsePx(ctx, gx + 6, y + 30, 3, 3, '#2a1f16');
        rect(ctx, gx + 4, y + 4, 5, 4, '#2a1f16');
        rect(ctx, gx - 2, y + 40, 16, 6, '#efe6cc');                  // the price tag
        drawText(ctx, '¥' + (8 + i * 3) + 'K', gx + 6, y + 41, '#8a2a1c', { align: 'center', font: 'small' });
      }
      break;
    }
    case 'amps': {
      sh();
      const n = Math.max(1, Math.floor(w / 28));
      for (let i = 0; i < n; i++) {
        const ax = x + i * 28;
        rect(ctx, ax + 1, y + 2, 26, h - 4, '#241f2e'); rect(ctx, ax + 1, y + 2, 26, 3, '#3f3850');
        rect(ctx, ax + 4, y + 7, 20, h - 18, '#3a3448');
        for (let gy = y + 8; gy < y + h - 12; gy += 3) for (let gx = ax + 5; gx < ax + 23; gx += 3) px(ctx, gx, gy, '#262034');
        rect(ctx, ax + 4, y + h - 9, 20, 5, '#8a8a98');
        for (let k = 0; k < 4; k++) circle(ctx, ax + 7 + k * 5, y + h - 7, 1, '#e8e4dc');
        rect(ctx, ax + 6, y + h - 3, 14, 4, '#efe6cc');
      }
      break;
    }
    case 'shelf': {
      sh();
      rect(ctx, x, y, w, h, '#8a6a44'); rect(ctx, x, y, w, 3, '#a88a5e');
      const rows = Math.max(1, Math.floor(h / 15));
      for (let r2 = 0; r2 < rows; r2++) {
        const ry = y + 4 + r2 * 15;
        rect(ctx, x + 1, ry + 11, w - 2, 3, '#6a5030');
        for (let i = 0; i < Math.floor((w - 6) / 9); i++) {
          const bx = x + 4 + i * 9;
          const c = ['#e8503a', '#4a86f7', '#f2c94c', '#6be585', '#c58bff', '#f0ece2', '#e88a3c'][(i * 3 + r2 * 5 + p.x) % 7];
          rect(ctx, bx, ry, 7, 11, c); rect(ctx, bx, ry, 7, 2, lighten(c, 0.3));
          if ((i + r2) % 3 === 0) rect(ctx, bx + 1, ry + 4, 5, 3, '#1b1826');
        }
      }
      break;
    }
    case 'crate': { sh(); rect(ctx, x, y, w, h, '#6a4a2e'); rect(ctx, x, y, w, 3, '#8a6440'); for (let i = 0; i < Math.floor((w - 4) / 4); i++) rect(ctx, x + 3 + i * 4, y + 4, 3, h - 8, ['#f0ece2', '#2a2434', '#c8a03a', '#4a86f7'][i % 4]); break; }
    case 'glasscase': {
      sh();
      rect(ctx, x, y, w, h, '#b9bec6'); rect(ctx, x + 2, y + 2, w - 4, h - 4, '#dfe8f2');
      ctx.globalAlpha = 0.5; rect(ctx, x + 2, y + 2, w - 4, Math.floor(h / 3), '#ffffff'); ctx.globalAlpha = 1;
      for (let i = 0; i < Math.floor((w - 10) / 12); i++) {
        const bx = x + 6 + i * 12;
        rect(ctx, bx, y + h - 14, 9, 9, ['#e8503a', '#f2c94c', '#4a86f7', '#6be585'][i % 4]);
        rect(ctx, bx + 2, y + h - 12, 5, 3, '#1b1826');
      }
      frame(ctx, x, y, w, h, '#8a8f98');
      break;
    }
    case 'pedals': {
      sh(); rect(ctx, x, y, w, h, '#2a2434'); rect(ctx, x, y, w, 3, '#463c58');
      for (let i = 0; i < Math.floor((w - 4) / 11); i++) for (let r2 = 0; r2 < Math.max(1, Math.floor(h / 13)); r2++) {
        const bx = x + 3 + i * 11, by = y + 4 + r2 * 13;
        if (by + 10 > y + h) break;
        const c = ['#e8503a', '#f2c94c', '#4a86f7', '#6be585', '#c58bff'][(i + r2) % 5];
        rect(ctx, bx, by, 9, 10, c); rect(ctx, bx, by, 9, 2, lighten(c, 0.3));
        circle(ctx, bx + 4, by + 4, 2, '#1b1826'); rect(ctx, bx + 1, by + 7, 7, 2, '#241f2e');
      }
      break;
    }
    case 'poster': { rect(ctx, x, y, w, h, '#f0ece2'); frame(ctx, x, y, w, h, '#8a8478'); const c = ['#e8503a', '#4a86f7', '#f2c94c'][(p.x / 5 | 0) % 3]; rect(ctx, x + 2, y + 2, w - 4, Math.floor(h * 0.6), c); for (let i = 0; i < 3; i++) rect(ctx, x + 4, y + h - 10 + i * 3, w - 8 - i * 4, 2, '#5a5468'); break; }
    case 'till': { sh(); rect(ctx, x, y, w, h, '#d8d2c4'); rect(ctx, x, y, w, 4, '#f0ece2'); rect(ctx, x + w - 22, y + 4, 18, 12, '#3a3444'); rect(ctx, x + w - 20, y + 6, 14, 6, '#6be585'); rect(ctx, x + 4, y + 6, 14, 10, '#8a8f98'); break; }
    // ---- the ramen counter
    case 'ticketmachine': {
      sh();
      rect(ctx, x, y, w, h, '#c03a2c'); rect(ctx, x, y, w, 4, '#e0584a');
      rect(ctx, x + 3, y + 6, w - 6, h - 26, '#f4f1ea');
      for (let r2 = 0; r2 < 4; r2++) for (let c2 = 0; c2 < 3; c2++) {
        const bx = x + 6 + c2 * 13, by = y + 9 + r2 * 10;
        if (by + 8 > y + h - 22) continue;
        rect(ctx, bx, by, 11, 8, '#e8e2d4'); frame(ctx, bx, by, 11, 8, '#b0a898');
        rect(ctx, bx + 1, by + 1, 9, 3, ['#e8503a', '#f2c94c', '#4a86f7', '#6be585'][(r2 + c2) % 4]);
      }
      rect(ctx, x + 4, y + h - 18, w - 8, 7, '#2a2d33');
      drawText(ctx, '¥', x + 8, y + h - 16, '#6be585', { font: 'small' });
      rect(ctx, x + 6, y + h - 9, 14, 4, '#1b1e26');
      break;
    }
    case 'stools': {
      for (let i = 0; i < Math.max(1, Math.floor(w / 20)); i++) {
        const sx = x + 4 + i * 20;
        ctx.globalAlpha = 0.28; ellipsePx(ctx, sx + 1, y + 10, 8, 4, '#000'); ctx.globalAlpha = 1;
        rect(ctx, sx - 1, y + 4, 3, 8, '#8a8f98');
        ellipsePx(ctx, sx, y + 3, 8, 6, '#c8402c'); ellipsePx(ctx, sx, y + 2, 7, 5, '#e05a48');
      }
      break;
    }
    case 'ramencounter': {
      sh();
      rect(ctx, x, y, w, h, '#8a5f3a'); rect(ctx, x, y, w, 4, '#b07f4e');
      rect(ctx, x, y + h - 4, w, 4, '#5f4028');
      for (let i = 0; i < Math.floor(w / 26); i++) {
        const bx = x + 10 + i * 26;
        ellipsePx(ctx, bx, y + 10, 8, 5, '#f0ece2'); ellipsePx(ctx, bx, y + 9, 6, 4, '#e0a04a');
        rect(ctx, bx + 5, y + 4, 8, 1, '#c8b090'); rect(ctx, bx + 5, y + 6, 8, 1, '#c8b090');
        if (i % 2) { rect(ctx, bx - 12, y + 6, 4, 7, '#3f3850'); rect(ctx, bx - 11, y + 7, 2, 5, '#c8402c'); }
      }
      break;
    }
    case 'kitchen': {
      rect(ctx, x, y, w, h, '#8a8f98'); rect(ctx, x, y, w, 4, '#b9bec6');
      for (let i = 0; i < Math.floor(w / 30); i++) {
        const bx = x + 8 + i * 30;
        rect(ctx, bx, y + 8, 20, 14, '#3a3444'); rect(ctx, bx + 2, y + 10, 16, 10, '#5a5468');
        ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4 + i); ellipsePx(ctx, bx + 10, y + 6, 8, 4, '#cfd6e2'); ctx.globalAlpha = 1;
      }
      for (let i = 0; i < Math.floor(w / 16); i++) rect(ctx, x + 4 + i * 16, y + h - 8, 10, 6, '#c8c2b4');
      break;
    }
    case 'water': { sh(); rect(ctx, x, y, w, h, '#b9bec6'); rect(ctx, x + 2, y + 2, w - 4, 6, '#dfe8f2'); for (let i = 0; i < 4; i++) rect(ctx, x + 3 + i * 7, y + 10, 5, 8, '#e8f4ff'); break; }
    case 'noren': { for (let i = 0; i < Math.floor(w / 10); i++) { const bx = x + i * 10; rect(ctx, bx, y, 9, h, '#2f4a8a'); rect(ctx, bx, y, 9, 2, '#4a6fb0'); if (i % 2) drawText(ctx, 'ラ', bx + 4, y + 6, '#f0ece2', { align: 'center', font: 'small' }); } break; }
    // ---- the capsule hotel
    case 'pods': {
      const cols = Math.max(1, Math.floor(w / 46));
      for (let i = 0; i < cols; i++) {
        for (let r2 = 0; r2 < 2; r2++) {
          const bx = x + i * 46, by = y + r2 * (h / 2);
          rect(ctx, bx, by, 44, h / 2 - 2, '#d8d2c4');
          rect(ctx, bx + 3, by + 3, 38, h / 2 - 8, '#1b1e26');
          rect(ctx, bx + 3, by + 3, 38, 3, '#8a8f98');
          const lit = ((i + r2 * 3) % 4) !== 0;
          if (lit) { ctx.globalAlpha = 0.4; rect(ctx, bx + 5, by + 6, 34, h / 2 - 13, '#4a6f96'); ctx.globalAlpha = 1; }
          rect(ctx, bx + 6, by + h / 2 - 9, 32, 4, '#3f4a5c');
          drawText(ctx, String(101 + i + r2 * cols), bx + 22, by + h / 2 - 8, '#cfd6e2', { align: 'center', font: 'small' });
        }
      }
      break;
    }
    case 'lockers': {
      for (let i = 0; i < Math.floor(w / 16); i++) for (let r2 = 0; r2 < Math.max(1, Math.floor(h / 22)); r2++) {
        const bx = x + i * 16, by = y + r2 * 22;
        rect(ctx, bx, by, 15, 21, '#5f6a78'); rect(ctx, bx + 1, by + 1, 13, 19, '#788292');
        rect(ctx, bx + 11, by + 9, 2, 4, '#2a2d33'); rect(ctx, bx + 2, by + 2, 11, 2, '#98a2b0');
      }
      break;
    }
    case 'washbasin': {
      sh(); rect(ctx, x, y, w, h, '#dfe8f2'); rect(ctx, x, y, w, 3, '#f4f8fc');
      for (let i = 0; i < Math.floor(w / 26); i++) { const bx = x + 8 + i * 26; ellipsePx(ctx, bx, y + 10, 9, 6, '#b9c6d2'); rect(ctx, bx - 1, y + 2, 3, 5, '#8a95a2'); rect(ctx, bx - 8, y - 14, 18, 14, '#c8d4e0'); rect(ctx, bx - 7, y - 13, 16, 12, '#8ab0d0'); }
      break;
    }
    case 'shoerack': { sh(); rect(ctx, x, y, w, h, '#8a6a44'); for (let r2 = 0; r2 < 2; r2++) { rect(ctx, x + 1, y + 10 + r2 * 12, w - 2, 2, '#6a5030'); for (let i = 0; i < Math.floor((w - 6) / 10); i++) { const bx = x + 4 + i * 10; rect(ctx, bx, y + 3 + r2 * 12, 8, 6, ['#2a2434', '#8a4a2a', '#f0ece2', '#3a3a5a'][(i + r2) % 4]); } } break; }
    case 'tv': { rect(ctx, x, y, w, h, '#1b1e26'); rect(ctx, x + 2, y + 2, w - 4, h - 8, '#0d1018'); for (let i = 0; i < 20; i++) { const bx = x + 3 + ((i * 17 + Math.floor(t * 30)) % (w - 8)), by = y + 3 + ((i * 11) % (h - 12)); rect(ctx, bx, by, 4, 2, ['#4a86f7', '#e8503a', '#f2c94c'][i % 3]); } break; }
    case 'futon': { rect(ctx, x, y, w, h, '#e8e2d4'); rect(ctx, x, y, w, 3, '#f4f1ea'); rect(ctx, x + 3, y + 3, w - 6, 8, '#c8d4e0'); break; }
    // ---- generic
    case 'table': { sh(); rect(ctx, x, y, w, h, '#a8784a'); rect(ctx, x, y, w, 3, '#c8985e'); rect(ctx, x + 2, y + h - 4, 4, 4, '#6a4a2a'); rect(ctx, x + w - 6, y + h - 4, 4, 4, '#6a4a2a'); break; }
    case 'bin': { sh(); rect(ctx, x, y, w, h, '#4a5260'); rect(ctx, x - 1, y, w + 2, 4, '#6a7280'); rect(ctx, x + 3, y + 6, w - 6, h - 9, '#3a4250'); break; }
    case 'pole': { ctx.globalAlpha = 0.28; ellipsePx(ctx, x + w / 2 + 2, y + h + 2, 5, 3, '#000'); ctx.globalAlpha = 1; rect(ctx, x, y, w, h, '#8a8f98'); rect(ctx, x, y, 2, h, '#b9bec6'); break; }
    case 'display': {
      // a single thing, out on a stand with a tag on it
      sh();
      rect(ctx, x, y + h - 8, w, 8, '#6a5030'); rect(ctx, x, y + h - 8, w, 2, '#8a6a44');
      rect(ctx, x + 2, y + 2, w - 4, h - 10, p.item && p.item.sold ? '#5a5468' : '#2a2434');
      rect(ctx, x + 2, y + 2, w - 4, 2, '#463c58');
      if (p.item && !p.item.sold) {
        const ic = icon(p.item.icon || 'star');
        ctx.drawImage(ic, x + w / 2 - ic.width / 2, y + 4, ic.width, ic.height);
        ctx.globalAlpha = 0.12 + 0.06 * Math.sin(t * 3 + x); circle(ctx, x + w / 2, y + 10, 12, '#ffd24a'); ctx.globalAlpha = 1;
      }
      break;
    }
    case 'rug': { rect(ctx, x, y, w, h, p.col || '#8a3a4a'); frame(ctx, x, y, w, h, darken(p.col || '#8a3a4a', 0.3)); for (let i = 4; i < w - 4; i += 10) rect(ctx, x + i, y + 3, 4, h - 6, lighten(p.col || '#8a3a4a', 0.12)); break; }
    default: { sh(); rect(ctx, x, y, w, h, '#6a6478'); rect(ctx, x, y, w, 3, '#8a8498'); }
  }
  // a price tag on anything for sale
  if (p.item) {
    const lab = fmtMoney(p.item.price);
    const lw = textWidth(lab, { font: 'small' }) + 8;
    rect(ctx, x + w / 2 - lw / 2, y - 11, lw, 10, p.item.sold ? '#5a5468' : '#f6f2e0');
    frame(ctx, x + w / 2 - lw / 2, y - 11, lw, 10, '#8a8478');
    drawText(ctx, p.item.sold ? 'SOLD' : lab, x + w / 2, y - 9, p.item.sold ? '#cfc9e6' : '#8a2a1c', { align: 'center', font: 'small' });
  }
}

// ---------- The room itself ----------
class RoomScene {
  constructor(def, node, opts = {}) {
    this.D = def; this.node = node || {}; this.opts = opts;
    this.t = 0; this.fx = new Particles();
    this.you = Game.run.members[0];
    this.msg = null; this.msgT = 0;
    this.say = null; this.sayT = 0;                       // somebody talking to you
    this.card = null;                                     // an item you picked up
    this.props = def.props.map(p => Object.assign({}, p, { x: p.tx * RT, y: p.ty * RT, w: p.tw * RT, h: p.th * RT }));
    this.wpx = def.w * RT; this.hpx = def.h * RT;
    this.cam = new WorldCam({ z: def.zoom || 2.6, view: { x: 0, y: 0, w: W, h: H }, bounds: { w: this.wpx, h: this.hpx }, lead: 0.1 });
    const st = def.start || { tx: def.w / 2, ty: def.h - 2 };
    this.body = new Walker(st.tx * RT, st.ty * RT, { r: 8, speed: 100, accel: 1000, friction: 1100, spec: this.you.spec, scale: 1.5 });
    this.input = new WorldInput();
    this.cam.snapTo(this.body.x, this.body.y);
    // the walls of the room and everything solid inside it
    this.solid = (x, y) => {
      if (x < 8 || y < 8 || x > this.wpx - 8 || y > this.hpx - 8) return true;
      for (const p of this.props) { if (p.walk || p.hidden) continue; if (x > p.x && x < p.x + p.w && y > p.y && y < p.y + p.h) return true; }
      return false;
    };
    // the people who are here
    this.npcs = (def.npcs || []).map((n, i) => new Npc({
      spec: n.spec || randomBugSpec(makeRng(hashStr((node && node.id || def.name) + 'npc' + i))),
      x: n.route[0].tx * RT, y: n.route[0].ty * RT,
      route: n.route.map(r => ({ x: r.tx * RT, y: r.ty * RT, wait: r.wait, act: r.act })),
      speed: n.speed || 44, tag: n.tag, name: n.name, carry: n.carry, scale: n.scale || 1.25,
    }));
    this.zoomIn = 0.35;                                   // the camera comes in as you arrive
    this.cam.z = (def.zoom || 2.6) * 0.72; this.cam.targetZ = def.zoom || 2.6;
    this.prompt = null;
    if (def.enter) this.flash(def.enter);
  }
  flash(m) { this.msg = m; this.msgT = 3; }
  speak(who, line) { this.say = { who, line }; this.sayT = 4; Audio.ui('type'); }
  leave() {
    if (this.left) return; this.left = true; Game.run.save();
    Game.go(this.opts.back || (() => new CityScene()), 'iris', { dur: 0.55 });
  }
  // ---- the thing in front of you
  findPrompt() {
    const b = this.body;
    let best = null, bd = 30;
    for (const p of this.props) {
      if (!p.label && !p.act) continue;
      const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      const dx = Math.max(Math.abs(b.x - cx) - p.w / 2, 0), dy = Math.max(Math.abs(b.y - cy) - p.h / 2, 0);
      const d = Math.hypot(dx, dy);
      if (d < bd) { bd = d; best = { kind: 'prop', p }; }
    }
    for (const n of this.npcs) {
      const d = Math.hypot(b.x - n.x, b.y - n.y);
      if (d < bd && n.tag) { bd = d; best = { kind: 'npc', n }; }
    }
    return best;
  }
  update(dt) {
    this.t += dt; this.msgT = Math.max(0, this.msgT - dt); this.sayT = Math.max(0, this.sayT - dt);
    if (this.sayT <= 0) this.say = null;
    this.fx.update(dt);
    if (!this.card) {
      const v = this.input.vector({ x: this.body.x, y: this.body.y });
      this.body.step(dt, v.x, v.y, this.solid);
    }
    for (const n of this.npcs) n.update(dt, this.solid);
    this.cam.follow(dt, this.body.x, this.body.y, this.body.vx, this.body.vy);
    this.prompt = this.card ? null : this.findPrompt();
    if (this.D.tick) this.D.tick(this, dt);
  }
  interact() {
    const P = this.prompt; if (!P) return;
    if (P.kind === 'npc') { this.speak(P.n.name || 'SOMEBODY', typeof P.n.tag === 'function' ? P.n.tag(this) : P.n.tag); return; }
    const p = P.p;
    if (p.act === 'exit') { this.leave(); return; }
    if (p.item) { this.card = p; Audio.ui('select'); return; }
    if (this.D.use) this.D.use(this, p);
  }
  key(code) {
    if (this.card) { if (['Enter', 'Space', 'KeyZ'].includes(code)) this.buyCard(); else if (['Escape', 'KeyX'].includes(code)) { this.card = null; Audio.ui('back'); } return; }
    if (this.say && ['Enter', 'Space', 'KeyZ'].includes(code)) { this.say = null; this.sayT = 0; return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) { this.interact(); return; }
    if (code === 'Escape') { this.leave(); return; }
    this.input.key(code);
  }
  keyUp(code) { this.input.keyUp(code); }
  buyCard() {
    const p = this.card;
    if (!p || !p.item) { this.card = null; return; }
    if (this.D.buy) this.D.buy(this, p);
    this.card = null;
  }
  pointerDown(x, y, id) {
    if (this.card) {
      const r = this.cardRect();
      if (x >= r.bx && x < r.bx + r.bw && y >= r.by && y < r.by + r.bh) { this.buyCard(); return; }
      this.card = null; Audio.ui('back'); return;
    }
    if (this.say) { this.say = null; this.sayT = 0; return; }
    // tapping what you are standing in front of uses it
    if (this.prompt) {
      const P = this.prompt;
      const cx = P.kind === 'npc' ? this.cam.sx(P.n.x) : this.cam.sx(P.p.x + P.p.w / 2);
      const cy = P.kind === 'npc' ? this.cam.sy(P.n.y) : this.cam.sy(P.p.y + P.p.h / 2);
      if (Math.hypot(x - cx, y - cy) < 70) { this.interact(); return; }
    }
    if (Game.touch) { this.input.down(x, y, id); this.dragId = id; this.dragAt = { x, y }; this.dragMoved = 0; return; }
    this.input.tapGoal = { x: this.cam.wx(x), y: this.cam.wy(y) };
  }
  pointerMove(x, y, id) { if (this.input.move(x, y, id) && this.dragAt) this.dragMoved = Math.max(this.dragMoved, Math.hypot(x - this.dragAt.x, y - this.dragAt.y)); }
  pointerUp(x, y, id) {
    if (this.dragId === id) { const moved = this.dragMoved; this.input.up(id); this.dragId = null; if (moved < 6) this.input.tapGoal = { x: this.cam.wx(x), y: this.cam.wy(y) }; return; }
    this.input.up(id);
  }
  click(x, y) { this.pointerDown(x, y, 999); }
  hover() {}
  cardRect() { const w = 340, h = 150, x = W / 2 - w / 2, y = H / 2 - h / 2; return { x, y, w, h, bx: x + w - 150, by: y + h - 44, bw: 134, bh: 34 }; }
  // ---------- drawing ----------
  draw(ctx) {
    const D = this.D, t = this.t, cam = this.cam;
    rect(ctx, 0, 0, W, H, '#05060a');
    cam.push(ctx);
    // ---- the floor
    for (let ty = 0; ty < D.h; ty++) for (let tx = 0; tx < D.w; tx++) {
      const X = tx * RT, Y = ty * RT;
      const alt = (tx + ty) % 2;
      rect(ctx, X, Y, RT, RT, alt ? D.floor : (D.floorAlt || D.floor));
      ctx.globalAlpha = 0.1; rect(ctx, X, Y, RT, 1, '#ffffff'); rect(ctx, X, Y, 1, RT, '#ffffff'); ctx.globalAlpha = 1;
      if ((tx * 7 + ty * 13) % 17 === 0) { ctx.globalAlpha = 0.08; rect(ctx, X + 5, Y + 7, 7, 3, '#000'); ctx.globalAlpha = 1; }
    }
    if (D.floorArt) D.floorArt(ctx, this);
    // ---- the walls, with a top and a face like everything outdoors
    const WT = 20;
    rect(ctx, -WT, -WT, this.wpx + WT * 2, WT, D.wallTop);
    rect(ctx, -WT, -WT, this.wpx + WT * 2, 3, lighten(D.wallTop, 0.25));
    rect(ctx, -WT, -6, this.wpx + WT * 2, 6, D.wall);
    rect(ctx, -WT, -WT, WT, this.hpx + WT * 2, D.wallTop);
    rect(ctx, this.wpx, -WT, WT, this.hpx + WT * 2, D.wallTop);
    rect(ctx, -6, 0, 6, this.hpx, D.wall);
    rect(ctx, this.wpx, 0, 6, this.hpx, D.wall);
    rect(ctx, -WT, this.hpx, this.wpx + WT * 2, WT, D.wallTop);
    rect(ctx, -WT, this.hpx, this.wpx + WT * 2, 6, D.wall);
    // ---- furniture and people, sorted so the near ones cover the far ones
    const drawables = [];
    for (const p of this.props) { if (!p.hidden) drawables.push({ y: p.y + (p.overhead ? -1000 : p.h), d: (c) => drawRoomProp(c, p, t, this) }); }
    for (const n of this.npcs) drawables.push({ y: n.y, d: (c) => n.draw(c, t) });
    const b = this.body;
    drawables.push({ y: b.y, d: (c) => {
      drawShadow(c, b.x, b.y + 7, 22, 0.34);
      drawBugAt(c, this.you.spec, b.x, b.y + 9, { pose: b.pose, scale: b.scale, flip: b.flip, bounce: b.moving ? 1 : 0.6 });
    } });
    drawables.sort((a, b2) => a.y - b2.y);
    for (const d of drawables) d.d(ctx);
    if (D.over) D.over(ctx, this);
    cam.pop(ctx);
    // ---- the light in here, and the dark outside it
    if (D.dark) { ctx.globalAlpha = 0.3; rect(ctx, 0, 0, W, H, D.dark); ctx.globalAlpha = 1; }
    vignette(ctx, 0.42);
    // ---- the prompt over whatever you are standing at
    if (this.prompt) {
      const P = this.prompt;
      if (P.kind === 'npc') drawPrompt(ctx, cam, { x: P.n.x - 20, y: P.n.y - 20, w: 40, h: 0 }, t, 'TALK');
      else drawPrompt(ctx, cam, P.p, t, P.p.item ? (P.p.item.sold ? 'SOLD' : 'LOOK AT IT') : (P.p.label || 'USE'));
    }
    this.fx.draw(ctx);
    // ---- the name of the place, and the way out
    uiRibbon(ctx, W / 2, 8, D.name, { scale: 3, color: D.tint || '#7a1a2a' });
    if (D.sub) drawText(ctx, D.sub, W / 2, 38, '#cfc9e6', { align: 'center', scale: 2, outline: '#12101c' });
    drawText(ctx, Game.touch ? 'DRAG TO WALK' : 'ARROWS / WASD', 14, H - 20, '#8a82a8', { font: 'small' });
    drawText(ctx, fmtMoney(Game.run.money), W - 14, 44, '#ffd24a', { align: 'right', scale: 3 });
    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = Math.min(W - 40, textWidth(this.msg, { scale: 2 }) + 28);
      rect(ctx, W / 2 - w2 / 2, 58, w2, 24, '#152a18'); frame(ctx, W / 2 - w2 / 2, 58, w2, 24, '#6be585');
      drawText(ctx, this.msg, W / 2, 65, '#6be585', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    // ---- somebody talking
    if (this.say) {
      const bh = 92, by = H - bh - 10;
      rect(ctx, 20, by, W - 40, bh, 'rgba(10,8,20,0.9)'); frame(ctx, 20, by, W - 40, bh, '#c8a03a');
      rect(ctx, 28, by - 10, textWidth(this.say.who, { scale: 2 }) + 16, 18, '#c8a03a');
      drawText(ctx, this.say.who, 36, by - 5, '#2a1a08', { scale: 2 });
      drawWrapped(ctx, this.say.line, 34, by + 22, W - 80, 20, '#f2ecd8', { scale: 2 });
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 5);
      drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W - 40, by + bh - 18, '#cfc9e6', { align: 'right', font: 'small' });
      ctx.globalAlpha = 1;
    }
    // ---- an item in your hands
    if (this.card) this.drawCard(ctx);
    this.input.drawStick(ctx);
  }
  drawCard(ctx) {
    const p = this.card, it = p.item, r = this.cardRect();
    ctx.globalAlpha = 0.65; rect(ctx, 0, 0, W, H, '#05040c'); ctx.globalAlpha = 1;
    rect(ctx, r.x + 5, r.y + 6, r.w, r.h, 'rgba(6,4,12,0.6)');
    rect(ctx, r.x, r.y, r.w, r.h, '#241d33'); frame(ctx, r.x, r.y, r.w, r.h, '#c8a03a');
    rect(ctx, r.x, r.y, r.w, 22, '#c8a03a');
    drawText(ctx, it.title || 'FOR SALE', r.x + 10, r.y + 7, '#2a1a08', { scale: 2 });
    if (it.icon) ctx.drawImage(icon(it.icon), r.x + 12, r.y + 34, 34, 30);
    drawWrapped(ctx, it.desc || '', r.x + 56, r.y + 34, r.w - 70, 16, '#cfc9e6', { scale: 2 });
    drawText(ctx, fmtMoney(it.price), r.x + 12, r.y + r.h - 34, Game.run.money >= it.price ? '#ffd24a' : '#e0785a', { scale: 4 });
    uiButton(ctx, r.bx, r.by, r.bw, r.bh, it.sold ? 'SOLD' : 'BUY IT', it.sold || Game.run.money < it.price ? 'disabled' : 'normal', { scale: 3 });
  }
}

// ---------- The places, as scenes ----------
class AirportScene extends RoomScene {
  constructor() {
    super(ROOMS.airport, { id: 'narita' }, { back: () => new CrossingScene(() => new CityScene(true)) });
  }
}
// The second-hand shop, stocked from the same list the old counter used: each
// piece of stock is put out somewhere you can walk up to and pick up.
class MusicShopScene extends RoomScene {
  constructor(node) {
    super(ROOMS.hardoff, node, { back: () => new CityScene() });
    const n = node || {};
    if (!n.stock) n.stock = shopStock(n);
    // where things get put out: in front of the shelves and along the wall
    const spots = [
      { tx: 3, ty: 7.4 }, { tx: 6, ty: 7.4 }, { tx: 9, ty: 7.4 }, { tx: 12, ty: 7.4 },
      { tx: 15, ty: 7.4 }, { tx: 18, ty: 7.4 }, { tx: 3, ty: 12.2 }, { tx: 6, ty: 12.2 },
      { tx: 16, ty: 12.2 }, { tx: 19, ty: 12.2 }, { tx: 21, ty: 7.4 },
    ];
    n.stock.forEach((s, i) => {
      const sp = spots[i % spots.length];
      const lab = stockLabel(s);
      this.props.push({
        kind: 'display', x: sp.tx * RT, y: sp.ty * RT, w: Math.round(RT * 1.4), h: Math.round(RT * 1.3),
        label: lab.title, item: { title: lab.title, desc: lab.desc, icon: lab.icon, price: s.price, sold: !!s.sold, stock: s },
      });
    });
  }
}
class RamenScene extends RoomScene {
  constructor(node) { super(ROOMS.ramen, node, { back: () => new CityScene() }); this.ticket = null; this.bowl = null; this.cooking = null; }
  draw(ctx) {
    super.draw(ctx);
    // the ticket in your hand, top left, because it is the whole loop
    if (this.ticket) {
      rect(ctx, 14, 74, 150, 30, '#f6f2e0'); frame(ctx, 14, 74, 150, 30, '#8a2a1c');
      rect(ctx, 14, 74, 150, 3, '#c8402c');
      drawText(ctx, 'TICKET', 20, 80, '#8a2a1c', { font: 'small' });
      drawText(ctx, this.ticket.name, 20, 90, '#2a1a08', { scale: 2 });
    }
    if (this.cooking != null) {
      const k = 1 - clamp(this.cooking / 4.5, 0, 1);
      rect(ctx, W / 2 - 80, 78, 160, 12, '#241d33'); rect(ctx, W / 2 - 80, 78, Math.round(160 * k), 12, '#e8a03a');
      frame(ctx, W / 2 - 80, 78, 160, 12, '#4a4068');
      drawText(ctx, 'COOKING', W / 2, 92, '#e8a03a', { align: 'center', font: 'small' });
    }
  }
}
class CapsuleScene extends RoomScene {
  constructor(node) { super(ROOMS.capsule, node || { id: 'capsule' }, { back: () => new CityScene() }); }
}
