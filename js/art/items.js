// ---------- High-resolution item art: 32x32 objects in ornate slots ----------
'use strict';
const ITEM_PX = 32;
const IOL = '#231a16';           // shared item outline: warm near-black

// Every item is a Pix of ITEM_PX square, drawn once and cached.
function itemCanvas(kind) {
  return cached('item32|' + kind, () => buildItem(kind).toCanvas());
}
function buildItem(kind) {
  const P = new Pix(ITEM_PX, ITEM_PX);
  const m = () => P.mask();
  const metal = (c) => ({ outline: IOL, hi: lighten(c, 0.35), lo: darken(c, 0.28) });
  switch (kind) {
    // ---- instruments ----
    case 'guitar': {
      const b = m(); P.mEllipse(b, 12, 22, 9, 8); P.mEllipse(b, 12, 13, 7, 6); P.fill(b, '#b9692c', { outline: IOL });
      P.paint(b, (x, y) => (x * 2 + y * 5) % 13 === 0 ? darken('#b9692c', 0.12) : null);
      const h = m(); P.mEllipse(h, 12, 18, 3.4, 3.4); P.fill(h, '#2a1a12', { shade: false });
      P.paint(h, (x, y) => Math.hypot(x - 12, y - 18) > 2.6 ? '#e8c88a' : null);
      const n = m(); P.mRect(n, 20, 4, 4, 16); P.fill(n, '#5a3a22', { outline: IOL });
      const hd = m(); P.mRound(hd, 22, 1, 8, 7, 2); P.fill(hd, '#3f2617', { outline: IOL });
      for (let i = 0; i < 3; i++) { P.set(21 + i * 0, 3 + i * 2, '#d8c8a0'); P.set(29, 3 + i * 2, '#d8c8a0'); }
      for (let i = 0; i < 4; i++) { const sx = 21 + i; for (let y = 5; y < 26; y++) if (P.get(sx, y)) P.set(sx, y, '#efe4c8'); }
      const br = m(); P.mRect(br, 8, 26, 9, 2); P.fill(br, '#2a1a12', { shade: false });
      break;
    }
    case 'bass': {
      const b = m(); P.mEllipse(b, 11, 23, 8, 7); P.mEllipse(b, 11, 15, 6.5, 5.5); P.fill(b, '#2f4f86', metal('#2f4f86'));
      const n = m(); P.mRect(n, 19, 3, 4, 18); P.fill(n, '#43301c', { outline: IOL });
      const hd = m(); P.mRound(hd, 20, 0, 9, 6, 2); P.fill(hd, '#2b1d11', { outline: IOL });
      for (let i = 0; i < 2; i++) { const sx = 20 + i * 2; for (let y = 4; y < 27; y++) if (P.get(sx, y)) P.set(sx, y, '#d8d0b8'); }
      break;
    }
    case 'keyboard': case 'piano': {
      const c = m(); P.mRound(c, 1, 10, 30, 13, 2); P.fill(c, '#2b2734', { outline: IOL });
      const w = m(); P.mRect(w, 3, 13, 26, 8); P.fill(w, '#f4efe2', { shade: false });
      P.paint(w, (x, y) => (x - 3) % 3 === 2 ? '#b9b0a0' : null);
      for (let i = 0; i < 8; i++) { const bx = 4 + i * 3 + (i % 3 === 2 ? 1 : 0); const k = m(); P.mRect(k, bx, 13, 2, 5); P.fill(k, '#26222c', { shade: false }); }
      const l = m(); P.mRect(l, 2, 8, 28, 3); P.fill(l, '#3d3750', { outline: IOL });
      P.set(4, 9, '#e05a5a'); P.set(6, 9, '#5ae07a');
      const lg = m(); P.mRect(lg, 4, 23, 3, 7); P.mRect(lg, 25, 23, 3, 7); P.fill(lg, '#3a3444', { outline: IOL });
      break;
    }
    case 'drums': case 'drumsticks': {
      const s = m(); P.mRound(s, 4, 14, 22, 12, 3); P.fill(s, '#c4402f', metal('#c4402f'));
      const hd = m(); P.mEllipse(hd, 15, 15, 11, 3.4); P.fill(hd, '#f3ecdc', { outline: IOL });
      P.paint(s, (x, y) => (x - 4) % 5 === 0 && y > 16 && y < 24 ? '#e8d09a' : null);
      const r1 = m(); P.mRect(r1, 4, 13, 22, 2); P.mRect(r1, 4, 24, 22, 2); P.fill(r1, '#d9c37a', { outline: IOL, shade: false });
      const st = m(); P.mLine(st, 20, 2, 27, 13, 2); P.mLine(st, 25, 1, 30, 12, 2); P.fill(st, '#d7b483', { outline: IOL, shade: false });
      break;
    }
    case 'sax': {
      const b = m(); P.mLine(b, 16, 4, 16, 18, 4); P.mLine(b, 16, 18, 11, 24, 4); P.mEllipse(b, 11, 26, 6, 4); P.fill(b, '#e0a827', metal('#e0a827'));
      const bell = m(); P.mEllipse(bell, 11, 26, 4, 2.6); P.fill(bell, '#8a6212', { shade: false });
      const nk = m(); P.mLine(nk, 16, 5, 21, 2, 3); P.fill(nk, '#c08e18', { outline: IOL });
      for (let i = 0; i < 4; i++) P.set(18, 8 + i * 3, '#f6e2a0');
      break;
    }
    case 'trumpet': {
      const b = m(); P.mRect(b, 6, 13, 16, 5); P.mPoly(b, [[22, 9], [30, 6], [30, 25], [22, 22]]); P.fill(b, '#e0a827', metal('#e0a827'));
      const bell = m(); P.mPoly(bell, [[27, 8], [30, 7], [30, 24], [27, 23]]); P.fill(bell, '#8a6212', { shade: false });
      const mp = m(); P.mEllipse(mp, 5, 15, 3, 3.4); P.fill(mp, '#c8ccd8', { outline: IOL });
      for (let i = 0; i < 3; i++) { const v = m(); P.mRect(v, 10 + i * 4, 8, 3, 6); P.fill(v, '#c8ccd8', { outline: IOL }); }
      break;
    }
    case 'violin': {
      const b = m(); P.mEllipse(b, 13, 20, 8, 7); P.mEllipse(b, 13, 12, 6.5, 5.5); P.fill(b, '#8d4520', metal('#8d4520'));
      P.paint(b, (x, y) => Math.abs(x - 13) === 6 && y > 14 && y < 24 ? '#2a170c' : null);
      const n = m(); P.mRect(n, 12, 2, 3, 8); P.fill(n, '#33200f', { outline: IOL });
      const sc = m(); P.mEllipse(sc, 13, 2, 3, 2.4); P.fill(sc, '#33200f', { outline: IOL });
      const bw = m(); P.mLine(bw, 24, 3, 27, 28, 2); P.fill(bw, '#c8a26a', { outline: IOL, shade: false });
      P.paint(bw, (x, y) => x > 24 ? '#f2ead6' : null);
      break;
    }
    case 'mic': {
      const h = m(); P.mEllipse(h, 16, 9, 6, 6.5); P.fill(h, '#9aa0ae', metal('#9aa0ae'));
      P.paint(h, (x, y) => (x + y) % 2 === 0 && Math.hypot(x - 16, y - 9) < 5 ? '#4c525e' : null);
      const st = m(); P.mRect(st, 14, 15, 5, 12); P.fill(st, '#33313c', { outline: IOL });
      const bs = m(); P.mEllipse(bs, 16, 28, 8, 3); P.fill(bs, '#2a2834', { outline: IOL });
      break;
    }
    case 'tambourine': {
      const r = m(); P.mEllipse(r, 16, 16, 12, 12); P.fill(r, '#b4762f', { outline: IOL });
      const in_ = m(); P.mEllipse(in_, 16, 16, 9, 9); P.fill(in_, '#f0e0bc', { shade: false });
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283, d = m(); P.mEllipse(d, 16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11, 2.4, 2.4); P.fill(d, '#e4c05a', { outline: IOL }); }
      break;
    }
    // ---- food ----
    case 'burrito': {
      const b = m(); P.mRound(b, 5, 9, 23, 14, 6); P.fill(b, '#e8cf9a', { outline: IOL });
      P.paint(b, (x, y) => (x * 3 + y * 2) % 17 === 0 ? '#c9ab74' : null);
      const f = m(); P.mPoly(f, [[5, 11], [11, 9], [11, 22], [5, 20]]); P.fill(f, '#f4e2b8', { shade: false });
      const w = m(); P.mRect(w, 20, 9, 9, 14); P.fill(w, '#d8d4cc', { outline: IOL });
      P.paint(w, (x, y) => (x + y) % 4 === 0 ? '#bfbab0' : null);
      break;
    }
    case 'dumpling': {
      for (const [ox, oy] of [[10, 20], [21, 20], [16, 12]]) {
        const d = m(); P.mEllipse(d, ox, oy, 7, 6); P.fill(d, '#f3ead4', { outline: IOL });
        P.paint(d, (x, y) => y < oy - 3 && (x - ox) % 3 === 0 ? '#d9cdb0' : null);
      }
      break;
    }
    case 'bread': {
      const b = m(); P.mEllipse(b, 16, 18, 12, 9); P.fill(b, '#c88a42', { outline: IOL });
      P.paint(b, (x, y) => Math.abs((x - 16) * 0.6 + (y - 18)) < 1.2 ? '#f0c079' : null);
      P.paint(b, (x, y) => Math.abs((x - 16) * 0.6 + (y - 18) + 7) < 1.2 ? '#f0c079' : null);
      break;
    }
    case 'coffee': {
      const c = m(); P.mPoly(c, [[9, 10], [23, 10], [21, 27], [11, 27]]); P.fill(c, '#f2ece0', { outline: IOL });
      const l = m(); P.mRect(l, 7, 6, 18, 5); P.fill(l, '#b8452f', { outline: IOL });
      const sl = m(); P.mRect(sl, 14, 2, 4, 5); P.fill(sl, '#8f3423', { outline: IOL });
      P.paint(c, (x, y) => y > 15 && y < 20 ? '#c8a878' : null);
      break;
    }
    case 'noodles': {
      const b = m(); P.mEllipse(b, 16, 20, 12, 8); P.fill(b, '#d8534a', { outline: IOL });
      const s = m(); P.mEllipse(s, 16, 16, 10, 5); P.fill(s, '#e8c878', { shade: false });
      P.paint(s, (x, y) => (x + y * 2) % 5 === 0 ? '#f4e2a8' : null);
      const st = m(); P.mLine(st, 20, 2, 26, 14, 1); P.mLine(st, 24, 2, 28, 14, 1); P.fill(st, '#c8a26a', { shade: false });
      break;
    }
    // ---- gear ----
    case 'pick': {
      const b = m(); P.mPoly(b, [[16, 5], [26, 13], [16, 27], [6, 13]]); P.fill(b, '#e05a7a', { outline: IOL });
      P.paint(b, (x, y) => Math.hypot(x - 13, y - 12) < 4 ? '#f6a0b4' : null);
      break;
    }
    case 'strings': {
      const r = m(); P.mEllipse(r, 16, 16, 11, 11); P.fill(r, '#c9ccd6', { outline: IOL, shade: false });
      const h = m(); P.mEllipse(h, 16, 16, 7, 7); for (let i = 0; i < h.length; i++) if (h[i]) P.d[i] = null;
      P.paint(r, (x, y) => (x * 2 + y) % 6 === 0 ? '#8e939e' : null);
      const tag = m(); P.mRound(tag, 20, 3, 10, 7, 2); P.fill(tag, '#e8d090', { outline: IOL });
      break;
    }
    case 'lantern': {
      const c = m(); P.mRound(c, 9, 8, 14, 16, 3); P.fill(c, '#7a6a52', { outline: IOL });
      const g = m(); P.mRect(g, 12, 11, 8, 10); P.fill(g, '#ffd36a', { shade: false });
      P.paint(g, (x, y) => Math.hypot(x - 16, y - 16) < 3 ? '#fff3c0' : null);
      const t = m(); P.mRect(t, 11, 5, 10, 3); P.mLine(t, 16, 1, 16, 5, 2); P.fill(t, '#5f5140', { outline: IOL });
      break;
    }
    case 'book': {
      const b = m(); P.mRound(b, 5, 7, 22, 19, 2); P.fill(b, '#a8382f', { outline: IOL });
      const pg = m(); P.mRect(pg, 8, 9, 18, 15); P.fill(pg, '#f2ead6', { shade: false });
      P.paint(pg, (x, y) => (y - 9) % 3 === 0 && x > 10 && x < 24 ? '#c9c0a8' : null);
      const sp = m(); P.mRect(sp, 5, 7, 3, 19); P.fill(sp, '#7f261f', { shade: false });
      break;
    }
    case 'map': {
      const b = m(); P.mPoly(b, [[3, 7], [12, 4], [21, 8], [29, 5], [29, 25], [21, 28], [12, 24], [3, 27]]); P.fill(b, '#e8d6a6', { outline: IOL });
      P.paint(b, (x, y) => Math.abs(x - 12) < 1 || Math.abs(x - 21) < 1 ? '#c4ab78' : null);
      const rd = m(); P.mLine(rd, 6, 20, 14, 12, 1); P.mLine(rd, 14, 12, 25, 16, 1); P.fill(rd, '#b8553a', { shade: false });
      P.set(25, 16, '#c4402f'); P.set(25, 15, '#c4402f');
      break;
    }
    case 'key': {
      const h = m(); P.mEllipse(h, 9, 10, 6, 6); P.fill(h, '#e0b84a', metal('#e0b84a'));
      const in_ = m(); P.mEllipse(in_, 9, 10, 2.6, 2.6); for (let i = 0; i < in_.length; i++) if (in_[i]) P.d[i] = null;
      const sh = m(); P.mLine(sh, 12, 14, 25, 27, 3); P.mRect(sh, 19, 22, 5, 3); P.mRect(sh, 22, 25, 5, 3); P.fill(sh, '#e0b84a', metal('#e0b84a'));
      break;
    }
    case 'clock': {
      const c = m(); P.mRound(c, 4, 8, 24, 20, 4); P.mPoly(c, [[8, 8], [16, 2], [24, 8]]); P.fill(c, '#8a5a2e', { outline: IOL });
      const f = m(); P.mEllipse(f, 16, 17, 7, 7); P.fill(f, '#f4eeda', { outline: IOL });
      P.paint(f, (x, y) => (x === 16 && y > 12 && y < 18) || (y === 17 && x > 16 && x < 21) ? '#33291f' : null);
      break;
    }
    case 'ticket': {
      const b = m(); P.mRound(b, 3, 10, 26, 13, 2); P.fill(b, '#e8c14a', { outline: IOL });
      const p = m(); P.mEllipse(p, 12, 16, 2.4, 2.4); for (let i = 0; i < p.length; i++) if (p[i]) P.d[i] = IOL;
      P.paint(b, (x, y) => x === 12 && (y - 10) % 3 === 0 ? IOL : null);
      P.paint(b, (x, y) => x > 15 && x < 27 && (y === 14 || y === 17) ? '#a07a18' : null);
      break;
    }
    case 'bag': {
      const b = m(); P.mRound(b, 5, 11, 22, 17, 3); P.fill(b, '#8a5a34', { outline: IOL });
      const f = m(); P.mRound(f, 5, 11, 22, 7, 3); P.fill(f, '#a06f42', { outline: IOL });
      const h = m(); P.mLine(h, 11, 11, 13, 5, 2); P.mLine(h, 13, 5, 19, 5, 2); P.mLine(h, 19, 5, 21, 11, 2); P.fill(h, '#6a4425', { outline: IOL, shade: false });
      const l = m(); P.mRect(l, 14, 16, 4, 4); P.fill(l, '#e0b84a', { outline: IOL });
      break;
    }
    case 'bottle': {
      const b = m(); P.mRound(b, 10, 10, 12, 18, 3); P.mRect(b, 14, 4, 4, 7); P.fill(b, '#4f8a56', { outline: IOL });
      P.paint(b, (x, y) => x === 12 ? '#8fd08f' : null);
      const c = m(); P.mRect(c, 13, 2, 6, 3); P.fill(c, '#b8452f', { outline: IOL });
      const lb = m(); P.mRect(lb, 10, 16, 12, 7); P.fill(lb, '#f2ead6', { shade: false });
      P.paint(lb, (x, y) => (y - 17) % 3 === 0 && x > 11 && x < 21 ? '#a89878' : null);
      break;
    }
    case 'poster': {
      const b = m(); P.mRect(b, 5, 4, 22, 24); P.fill(b, '#f2ead6', { outline: IOL });
      const t = m(); P.mRect(t, 7, 6, 18, 6); P.fill(t, '#c4402f', { shade: false });
      const fig = m(); P.mEllipse(fig, 16, 19, 4, 5); P.fill(fig, '#3a6ab0', { shade: false });
      P.paint(b, (x, y) => y > 24 && (x - 6) % 3 === 0 ? '#b0a488' : null);
      break;
    }
    case 'funko': {
      const h = m(); P.mRound(h, 7, 4, 18, 15, 5); P.fill(h, '#e8c9a0', { outline: IOL });
      for (const s of [-1, 1]) { const e = m(); P.mEllipse(e, 16 + s * 4, 11, 2.4, 2.4); P.fill(e, '#241c20', { shade: false }); }
      const bd = m(); P.mRound(bd, 11, 19, 10, 10, 2); P.fill(bd, '#c4402f', { outline: IOL });
      const lg = m(); P.mRect(lg, 12, 28, 3, 3); P.mRect(lg, 17, 28, 3, 3); P.fill(lg, '#33313c', { shade: false });
      break;
    }
    case 'tipjar': case 'jar': {
      const g = m(); P.mRound(g, 8, 8, 16, 20, 3); P.fill(g, '#bcd6e2', { outline: IOL, shade: false });
      P.paint(g, (x, y) => x === 10 ? '#ecf6fb' : x === 21 ? '#8fadbb' : null);
      const co = m(); P.mRect(co, 10, 20, 12, 7); P.fill(co, '#e0b84a', { outline: IOL });
      P.paint(co, (x, y) => (x + y) % 3 === 0 ? '#f6d982' : null);
      const lp = m(); P.mRect(lp, 7, 6, 18, 3); P.fill(lp, '#8a6a44', { outline: IOL });
      break;
    }
    case 'amp': {
      const b = m(); P.mRound(b, 3, 6, 26, 22, 2); P.fill(b, '#33313c', { outline: IOL });
      const gr = m(); P.mRect(gr, 6, 12, 20, 13); P.fill(gr, '#4a4756', { shade: false });
      P.paint(gr, (x, y) => (x + y) % 2 === 0 ? '#24222c' : null);
      const t = m(); P.mRect(t, 6, 8, 20, 3); P.fill(t, '#22202a', { shade: false });
      for (let i = 0; i < 4; i++) P.set(8 + i * 5, 9, '#c8ccd8');
      P.set(24, 9, '#e05a5a');
      break;
    }
    case 'headphones': {
      const b = m(); P.mLine(b, 6, 18, 7, 9, 3); P.mLine(b, 7, 9, 25, 9, 3); P.mLine(b, 25, 9, 26, 18, 3); P.fill(b, '#c4402f', { outline: IOL });
      for (const x of [4, 22]) { const c = m(); P.mRound(c, x, 16, 7, 11, 3); P.fill(c, '#33313c', { outline: IOL }); P.paint(c, (xx, y) => xx === x + 1 ? '#5a5668' : null); }
      break;
    }
    case 'boombox': {
      const b = m(); P.mRound(b, 2, 9, 28, 17, 2); P.fill(b, '#4a4756', { outline: IOL });
      for (const x of [5, 20]) { const s = m(); P.mEllipse(s, x + 3, 17, 5, 5); P.fill(s, '#26242e', { outline: IOL }); P.paint(s, (xx, y) => Math.hypot(xx - (x + 3), y - 17) < 2 ? '#6a6678' : null); }
      const h = m(); P.mLine(h, 8, 9, 10, 5, 2); P.mLine(h, 10, 5, 22, 5, 2); P.mLine(h, 22, 5, 24, 9, 2); P.fill(h, '#33313c', { shade: false });
      const d = m(); P.mRect(d, 13, 13, 6, 6); P.fill(d, '#8fd0e0', { shade: false });
      break;
    }
    case 'star': {
      const st = m(); const pts = [];
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 13; pts.push([16 + Math.cos(a) * r, 16 + Math.sin(a) * r]); }
      P.mPoly(st, pts); P.fill(st, '#f2c53d', { outline: IOL });
      P.paint(st, (x, y) => Math.hypot(x - 13, y - 12) < 4 ? '#fff0a8' : null);
      break;
    }
    case 'coin': {
      const c = m(); P.mEllipse(c, 16, 16, 12, 12); P.fill(c, '#e0b84a', metal('#e0b84a'));
      const in_ = m(); P.mEllipse(in_, 16, 16, 8, 8); P.fill(in_, '#c89a28', { shade: false });
      P.paint(in_, (x, y) => Math.abs(x - 16) < 1 && y > 11 && y < 21 ? '#f6d982' : null);
      break;
    }

    // ---- ability art: one 32x32 object per charm family ----
    case 'metronome': {
      const b = m(); P.mPoly(b, [[10, 28], [22, 28], [19, 5], [13, 5]]); P.fill(b, '#8a4f2a', { outline: IOL });
      const f = m(); P.mPoly(f, [[12, 26], [20, 26], [18, 9], [14, 9]]); P.fill(f, '#f2ead6', { shade: false });
      const arm = m(); P.mLine(arm, 16, 25, 21, 7, 2); P.fill(arm, '#33313c', { outline: IOL, shade: false });
      const wt = m(); P.mRect(wt, 19, 11, 5, 4); P.fill(wt, '#e0b84a', { outline: IOL });
      break;
    }
    case 'earplugs': {
      for (const ox of [8, 19]) { const e = m(); P.mRound(e, ox, 10, 9, 14, 4); P.fill(e, '#f2c53d', { outline: IOL });
        P.paint(e, (x, y) => x === ox + 1 ? '#f8e08a' : null); const c2 = m(); P.mEllipse(c2, ox + 4, 13, 2.4, 2.4); P.fill(c2, '#d8a020', { shade: false }); }
      break;
    }
    case 'net': {
      const h = m(); P.mLine(h, 6, 27, 14, 14, 2); P.fill(h, '#a8763c', { outline: IOL, shade: false });
      const r2 = m(); P.mEllipse(r2, 19, 11, 10, 9); const in3 = m(); P.mEllipse(in3, 19, 11, 8, 7); P.mSub(r2, in3);
      P.fill(r2, '#c8ccd8', { outline: IOL });
      P.paint(in3, (x, y) => ((x + y) % 4 === 0 || (x - y) % 4 === 0) ? '#e2e6f0' : null);
      break;
    }
    case 'medal': {
      const rb = m(); P.mPoly(rb, [[11, 2], [21, 2], [19, 13], [13, 13]]); P.fill(rb, '#c4402f', { outline: IOL });
      P.paint(rb, (x, y) => x === 16 ? '#e8dcc0' : null);
      const d = m(); P.mEllipse(d, 16, 21, 9, 9); P.fill(d, '#e0b84a', metal('#e0b84a'));
      P.paint(d, (x, y) => Math.hypot(x - 16, y - 21) < 5 ? '#c89a28' : null);
      P.set(16, 18, '#f6d982'); P.set(16, 24, '#f6d982'); P.set(13, 21, '#f6d982'); P.set(19, 21, '#f6d982');
      break;
    }
    case 'permit': {
      const b = m(); P.mRect(b, 5, 5, 22, 24); P.fill(b, '#f2ead6', { outline: IOL });
      const st2 = m(); P.mRect(st2, 5, 5, 22, 6); P.fill(st2, '#3f7fa8', { shade: false });
      for (let i = 0; i < 4; i++) { const l = m(); P.mRect(l, 8, 14 + i * 4, 16 - (i % 2) * 5, 2); P.fill(l, '#a89878', { shade: false }); }
      const sl = m(); P.mEllipse(sl, 22, 24, 4, 4); P.fill(sl, '#c4402f', { outline: IOL, shade: false });
      break;
    }
    case 'flyer': {
      const b = m(); P.mRect(b, 6, 4, 20, 25); P.fill(b, '#f6ecd0', { outline: IOL });
      const t2 = m(); P.mRect(t2, 9, 7, 14, 7); P.fill(t2, '#e8563f', { shade: false });
      for (let i = 0; i < 4; i++) { const l = m(); P.mRect(l, 9, 17 + i * 3, 14 - i * 2, 1); P.fill(l, '#b0a488', { shade: false }); }
      break;
    }
    case 'boots': {
      for (const ox of [3, 17]) { const b = m(); P.mRect(b, ox + 3, 6, 8, 14); P.mRect(b, ox, 18, 12, 7); P.fill(b, '#5a3a24', { outline: IOL });
        P.paint(b, (x, y) => y === 24 ? '#2a1a10' : y === 7 ? '#7a5334' : null); }
      break;
    }
    case 'cape': {
      const c2 = m(); P.mPoly(c2, [[9, 4], [23, 4], [28, 28], [4, 28]]); P.fill(c2, '#a8382f', { outline: IOL });
      P.paint(c2, (x, y) => (x * 2 + y) % 9 === 0 ? '#7f261f' : null);
      const col = m(); P.mRect(col, 8, 3, 16, 4); P.fill(col, '#e0b84a', { outline: IOL });
      break;
    }
    case 'union': {
      const b = m(); P.mEllipse(b, 16, 16, 12, 12); P.fill(b, '#3f5f8a', { outline: IOL });
      const h2 = m(); P.mLine(h2, 9, 20, 16, 10, 3); P.mLine(h2, 16, 10, 23, 20, 3); P.fill(h2, '#e8dcc0', { shade: false });
      P.paint(b, (x, y) => y === 23 ? '#2a4060' : null);
      break;
    }
    case 'balloon': {
      const b = m(); P.mEllipse(b, 16, 12, 9, 11); P.fill(b, '#e0507a', { outline: IOL });
      P.paint(b, (x, y) => Math.hypot(x - 12, y - 8) < 3 ? '#f6a0b4' : null);
      const st3 = m(); P.mLine(st3, 16, 23, 18, 30, 1); P.fill(st3, '#8a8a98', { shade: false });
      break;
    }
    default: {
      const b = m(); P.mRound(b, 7, 7, 18, 18, 3); P.fill(b, '#8a7a9a', { outline: IOL });
      drawTextless(P);
    }
  }
  return P;
}
function drawTextless(P) { const m = P.mask(); P.mRect(m, 15, 11, 3, 8); P.mRect(m, 15, 21, 3, 3); P.fill(m, '#f0e8f4', { shade: false }); }

// Ornate gold slot holding a 32px item. size is the outer square.
function uiItemSlot(ctx, x, y, size, kind, opts = {}) {
  x = Math.round(x); y = Math.round(y); const s = Math.round(size);
  const sel = opts.selected;
  // frame
  rect(ctx, x, y, s, s, UI.goldOl);
  rect(ctx, x + 1, y + 1, s - 2, s - 2, sel ? UI.goldHi : UI.gold);
  rect(ctx, x + 1, y + 1, s - 2, 1, UI.goldHi); rect(ctx, x + 1, y + 1, 1, s - 2, UI.goldHi);
  rect(ctx, x + 1, y + s - 2, s - 2, 1, UI.goldLo); rect(ctx, x + s - 2, y + 1, 1, s - 2, UI.goldLo);
  // filigree: a little leaf in each corner
  for (const [cx, cy, dx, dy] of [[x + 2, y + 2, 1, 1], [x + s - 3, y + 2, -1, 1], [x + 2, y + s - 3, 1, -1], [x + s - 3, y + s - 3, -1, -1]]) {
    px(ctx, cx, cy, UI.goldHi); px(ctx, cx + dx * 2, cy, UI.goldHi); px(ctx, cx, cy + dy * 2, UI.goldHi);
    px(ctx, cx + dx, cy + dy, UI.goldLo); px(ctx, cx + dx * 3, cy + dy, UI.goldHi); px(ctx, cx + dx, cy + dy * 3, UI.goldHi);
  }
  // recessed leather interior
  const p = 5, iw = s - p * 2;
  rect(ctx, x + p - 1, y + p - 1, iw + 2, iw + 2, UI.goldOl);
  vgrad(ctx, x + p, y + p, iw, iw, opts.empty ? '#4a3524' : '#6b4a2b', opts.empty ? '#33241a' : '#472f1a');
  rect(ctx, x + p, y + p, iw, 1, 'rgba(0,0,0,0.35)');
  rect(ctx, x + p, y + p + iw - 1, iw, 1, 'rgba(255,220,160,0.12)');
  if (kind) {
    const c = itemCanvas(kind), k = Math.max(1, Math.floor(iw / ITEM_PX));
    const d = ITEM_PX * k, ox = x + p + Math.floor((iw - d) / 2), oy = y + p + Math.floor((iw - d) / 2);
    ctx.drawImage(c, 0, 0, ITEM_PX, ITEM_PX, ox, oy + 1, d, d);
  }
  if (opts.count != null) drawText(ctx, String(opts.count), x + s - 4, y + s - 10, '#fff8e8', { align: 'right', outline: '#231a16' });
  if (sel) { frame(ctx, x - 1, y - 1, s + 2, s + 2, '#fff8e8'); frame(ctx, x - 2, y - 2, s + 4, s + 4, UI.goldOl); }
}
// Which 32px item art to use for a gameplay thing
const ITEM_FOR = {
  guitar: 'guitar', bass: 'bass', piano: 'keyboard', drums: 'drums', sax: 'sax', trumpet: 'trumpet',
  violin: 'violin', tambourine: 'tambourine', mic: 'mic', harmonica: 'sax', triangle: 'tambourine', keytar: 'keyboard',
};
function itemForInstrument(k) { return ITEM_FOR[k] || 'guitar'; }
// Charms and abilities get proper objects, not 12px glyphs.
const CHARM_ART = {
  amp: 'amp', bag: 'bag', balloon: 'balloon', bar: 'bread', beret: 'poster', boots: 'boots', bread: 'bread',
  cape: 'cape', case: 'bag', chalk: 'book', coffee: 'coffee', coin: 'coin', coupon: 'ticket', cred: 'medal',
  dive: 'boots', drum: 'drums', earplugs: 'earplugs', encore: 'star', fire: 'lantern', flyer: 'flyer',
  hat: 'poster', heart: 'funko', horn: 'trumpet', jacket: 'cape', jar: 'tipjar', kazoo: 'sax', medal: 'medal',
  metronome: 'metronome', net: 'net', note: 'mic', oil: 'bottle', permit: 'permit', phone: 'ticket', pick: 'pick',
  reed: 'sax', rosin: 'strings', sheet: 'book', shirt: 'poster', star: 'star', sticks: 'drums', strings: 'strings',
  taco: 'burrito', tuner: 'metronome', union: 'union', violin: 'violin', openmic: 'mic', food: 'noodles',
  gig: 'mic', skull: 'lantern', money: 'coin', mult: 'star', chips: 'coin', rest: 'coffee', treasure: 'bag',
  event: 'map', lock: 'key', check: 'star', rain: 'bottle', cop: 'permit', elite: 'star', boss: 'medal', shop: 'bag',
};
function charmArt(iconName) { return CHARM_ART[iconName] || 'star'; }
