// ---------- Props: street furniture, trees, vehicles, effects ----------
'use strict';
const OL = '#1a1410';
function propCanvas(kind, variant = 0) {
  return cached('prop|' + kind + '|' + variant, () => {
    let P;
    switch (kind) {
      case 'lamp': { P = new Pix(12, 46); const m = P.mask(); P.mRect(m, 5, 8, 2, 34); P.mRect(m, 3, 42, 6, 3); P.mRect(m, 2, 44, 8, 2); P.fill(m, '#3a3a48', { outline: OL, shade: false }); const h = P.mask(); P.mPoly(h, [[2, 8], [10, 8], [8, 2], [4, 2]]); P.fill(h, '#3a3a48', { outline: OL }); const g = P.mask(); P.mRect(g, 4, 4, 4, 4); P.fill(g, '#ffe680', { shade: false }); P.set(5, 5, '#fff8d0'); break; }
      case 'lampOff': { P = new Pix(12, 46); const m = P.mask(); P.mRect(m, 5, 8, 2, 34); P.mRect(m, 3, 42, 6, 3); P.mRect(m, 2, 44, 8, 2); P.fill(m, '#3a3a48', { outline: OL, shade: false }); const h = P.mask(); P.mPoly(h, [[2, 8], [10, 8], [8, 2], [4, 2]]); P.fill(h, '#3a3a48', { outline: OL }); const g = P.mask(); P.mRect(g, 4, 4, 4, 4); P.fill(g, '#c8d0e0', { shade: false }); break; }
      case 'hydrant': { P = new Pix(10, 14); const m = P.mask(); P.mRect(m, 3, 3, 4, 10); P.mRect(m, 1, 6, 8, 2); P.mEllipse(m, 5, 2, 2, 2); P.mRect(m, 2, 12, 6, 2); P.fill(m, '#c83a3a', { outline: OL }); P.set(4, 4, '#ff8a8a'); break; }
      case 'trash': { P = new Pix(12, 16); const m = P.mask(); P.mRect(m, 1, 3, 10, 12); P.fill(m, '#4a6a4a', { outline: OL }); const lid = P.mask(); P.mRect(lid, 0, 1, 12, 3); P.fill(lid, '#6a6a70', { outline: OL }); P.paint(m, (x, y) => x % 3 === 0 && y > 4 ? '#3a5a3a' : null); break; }
      case 'bench': { P = new Pix(30, 14); const m = P.mask(); P.mRect(m, 1, 1, 28, 3); P.mRect(m, 1, 6, 28, 3); P.fill(m, '#8a5a3a', { outline: OL }); P.paint(m, (x, y) => (y === 1 || y === 6) ? '#a8744a' : null); const legs = P.mask(); P.mRect(legs, 3, 9, 2, 5); P.mRect(legs, 25, 9, 2, 5); P.mRect(legs, 3, 4, 2, 2); P.mRect(legs, 25, 4, 2, 2); P.fill(legs, '#2a2a30', { shade: false }); break; }
      case 'newsbox': { P = new Pix(12, 18); const m = P.mask(); P.mRect(m, 1, 1, 10, 14); P.fill(m, ['#3a6ac0', '#c83a3a', '#e0a030'][variant % 3], { outline: OL }); const win = P.mask(); P.mRect(win, 3, 3, 6, 6); P.fill(win, '#c8dcf0', { shade: false }); const legs = P.mask(); P.mRect(legs, 2, 15, 2, 3); P.mRect(legs, 8, 15, 2, 3); P.fill(legs, '#2a2a30', { shade: false }); break; }
      case 'planter': { P = new Pix(18, 14); const pot = P.mask(); P.mPoly(pot, [[1, 6], [17, 6], [15, 13], [3, 13]]); P.fill(pot, '#a06a40', { outline: OL }); const g = P.mask(); P.mEllipse(g, 9, 5, 8, 4); P.fill(g, '#4f9a3a', { outline: OL }); P.paint(g, (x, y) => (x * 7 + y * 3) % 5 === 0 ? '#ff70b0' : (x + y) % 4 === 0 ? '#6fc050' : null); break; }
      case 'sign': { P = new Pix(14, 22); const m = P.mask(); P.mRect(m, 6, 8, 2, 14); P.fill(m, '#555', { shade: false }); const s = P.mask(); P.mRect(s, 0, 0, 14, 9); P.fill(s, ['#2a5ab0', '#2a7a3a', '#c83a3a'][variant % 3], { outline: OL }); P.paint(s, (x, y) => y >= 3 && y <= 5 && x >= 2 && x <= 11 && (x % 2 === 0) ? '#f0f4ff' : null); break; }
      case 'grate': { P = new Pix(16, 4); const m = P.mask(); P.mRect(m, 0, 0, 16, 4); P.fill(m, '#4a4a50', { shade: false }); P.paint(m, (x, y) => x % 2 === 0 && y > 0 && y < 3 ? '#1a1a20' : null); break; }
      case 'pigeon': { P = new Pix(8, 7); const m = P.mask(); P.mEllipse(m, 4, 4, 3, 2); P.mEllipse(m, 6, 2, 1.5, 1.5); P.fill(m, '#8a8a9a', { outline: OL }); P.set(7, 2, '#e0a040'); P.set(3, 6, '#e0a040'); P.set(5, 6, '#e0a040'); break; }
      case 'seal': { P = new Pix(22, 12); const m = P.mask(); P.mEllipse(m, 11, 7, 10, 4); P.mEllipse(m, 18, 4, 3, 3); P.fill(m, '#6a6a7a', { outline: OL }); P.set(19, 3, '#111'); P.set(21, 5, '#3a3a44'); break; }
      case 'lantern': { P = new Pix(8, 12); const m = P.mask(); P.mEllipse(m, 4, 6, 3, 4); P.fill(m, '#d83030', { outline: OL }); P.paint(m, (x, y) => y === 6 ? '#ff6060' : null); P.set(4, 1, '#f0c040'); P.set(4, 11, '#f0c040'); break; }
      case 'cone': { P = new Pix(8, 10); const m = P.mask(); P.mPoly(m, [[3, 0], [5, 0], [7, 9], [1, 9]]); P.fill(m, '#ff7a20', { outline: OL }); P.paint(m, (x, y) => y === 4 || y === 5 ? '#fff' : null); break; }
      case 'mailbox': { P = new Pix(10, 16); const m = P.mask(); P.mRound(m, 1, 1, 8, 10, 3); P.mRect(m, 3, 11, 4, 5); P.fill(m, '#2a4ab0', { outline: OL }); P.paint(m, (x, y) => y === 5 && x > 2 && x < 7 ? '#101830' : null); break; }
      case 'hat': { P = new Pix(14, 8); const m = P.mask(); P.mEllipse(m, 7, 5, 6, 2.5); P.mRound(m, 3, 0, 8, 6, 2); P.fill(m, '#3a2a4a', { outline: OL }); P.paint(m, (x, y) => y === 4 && x > 3 && x < 10 ? '#d84040' : null); break; }
      case 'amp': { P = new Pix(16, 14); const m = P.mask(); P.mRect(m, 0, 0, 16, 14); P.fill(m, '#2a2a30', { outline: OL }); P.paint(m, (x, y) => y >= 4 && y <= 12 && x >= 2 && x <= 13 ? ((x + y) % 2 ? '#3a3a44' : '#1a1a22') : y === 2 && x % 3 === 0 && x > 1 && x < 14 ? '#c0c0c8' : null); P.set(13, 1, '#ff4040'); break; }
      case 'micstand': { P = new Pix(8, 30); const m = P.mask(); P.mRect(m, 3, 4, 2, 24); P.mRect(m, 0, 27, 8, 3); P.fill(m, '#3a3a48', { outline: OL, shade: false }); const h = P.mask(); P.mEllipse(h, 4, 2, 2.5, 2.5); P.fill(h, '#a0a0b0', { outline: OL }); break; }
      case 'speaker': { P = new Pix(20, 34); const m = P.mask(); P.mRect(m, 0, 0, 20, 34); P.fill(m, '#1e1e26', { outline: OL }); const c1 = P.mask(); P.mEllipse(c1, 10, 10, 6, 6); P.fill(c1, '#33333e', { outline: '#0a0a10' }); const c2 = P.mask(); P.mEllipse(c2, 10, 25, 5, 5); P.fill(c2, '#33333e', { outline: '#0a0a10' }); P.set(10, 10, '#555'); P.set(10, 25, '#555'); break; }
      case 'light': { P = new Pix(10, 8); const m = P.mask(); P.mRect(m, 1, 0, 8, 6); P.fill(m, '#2a2a30', { outline: OL }); const l = P.mask(); P.mRect(l, 3, 2, 4, 3); P.fill(l, ['#ff5050', '#50a0ff', '#ffe050', '#c060ff', '#50ff90'][variant % 5], { shade: false }); break; }
      case 'truss': { P = new Pix(16, 16); const m = P.mask(); P.mRect(m, 0, 0, 16, 2); P.mRect(m, 0, 14, 16, 2); P.mRect(m, 0, 0, 2, 16); P.mRect(m, 14, 0, 2, 16); P.mLine(m, 1, 1, 14, 14, 1); P.mLine(m, 14, 1, 1, 14, 1); P.fill(m, '#7a7a88', { shade: false }); break; }
      case 'cloud': { P = new Pix(40, 14); const m = P.mask(); P.mEllipse(m, 12, 9, 11, 4); P.mEllipse(m, 24, 8, 12, 5); P.mEllipse(m, 18, 5, 8, 4); P.mEllipse(m, 32, 9, 7, 3); P.fill(m, '#ffffff', { hi: '#ffffff', lo: '#dfe6f2' }); break; }
      case 'leaf': { P = new Pix(4, 3); P.set(1, 0, '#c8703a'); P.set(0, 1, '#e08a40'); P.set(1, 1, '#e08a40'); P.set(2, 1, '#c8703a'); P.set(2, 2, '#a05a2a'); P.set(3, 1, '#c8703a'); break; }
      case 'boat': { P = new Pix(30, 12); const h = P.mask(); P.mPoly(h, [[0, 6], [30, 6], [26, 11], [4, 11]]); P.fill(h, '#c04040', { outline: OL }); const c = P.mask(); P.mRect(c, 8, 1, 14, 5); P.fill(c, '#f0f0f0', { outline: OL }); P.paint(c, (x, y) => y === 3 && x % 3 === 0 ? '#4060a0' : null); P.set(14, 0, '#333'); break; }
      case 'sailboat': { P = new Pix(16, 18); const s = P.mask(); P.mPoly(s, [[8, 0], [8, 12], [1, 12]]); P.fill(s, '#f4f0e8', { outline: OL }); const h = P.mask(); P.mPoly(h, [[0, 13], [16, 13], [13, 17], [3, 17]]); P.fill(h, '#3a4a8a', { outline: OL }); break; }
      case 'tomato': { P = new Pix(10, 10); const m = P.mask(); P.mEllipse(m, 5, 6, 4.5, 4); P.fill(m, '#d83a2a', { outline: OL }); const g = P.mask(); P.mRect(g, 3, 1, 4, 2); P.mRect(g, 4, 0, 2, 2); P.fill(g, '#4f9a3a', { outline: OL, shade: false }); P.set(3, 4, '#ff8a7a'); break; }
      case 'can': { P = new Pix(8, 12); const m = P.mask(); P.mRect(m, 1, 1, 6, 10); P.fill(m, '#c8c8d0', { outline: OL }); P.paint(m, (x, y) => y > 3 && y < 8 ? (x % 2 ? '#d83a3a' : '#f0f0f4') : null); P.set(2, 2, '#fff'); break; }
      case 'boot': { P = new Pix(14, 10); const m = P.mask(); P.mRect(m, 4, 0, 6, 7); P.mRect(m, 1, 6, 12, 4); P.fill(m, '#5a3a24', { outline: OL }); P.paint(m, (x, y) => y === 9 ? '#2a1a10' : null); break; }
      case 'cabbage': { P = new Pix(12, 11); const m = P.mask(); P.mEllipse(m, 6, 6, 5.5, 5); P.fill(m, '#6fc050', { outline: OL }); P.paint(m, (x, y) => (x * 3 + y * 5) % 7 === 0 ? '#4f9a3a' : (x + y) % 9 === 0 ? '#a8e090' : null); break; }
      case 'fish': { P = new Pix(16, 8); const m = P.mask(); P.mEllipse(m, 6, 4, 5, 3); P.mPoly(m, [[11, 4], [15, 1], [15, 7]]); P.fill(m, '#8ab8d8', { outline: OL }); P.set(3, 3, '#fff'); P.set(3, 3, '#1a1410'); break; }
      case 'laser': { P = new Pix(8, 6); const m = P.mask(); P.mRect(m, 0, 1, 8, 4); P.fill(m, '#2a2a34', { outline: OL, shade: false }); P.set(7, 3, '#ff4040'); break; }
      case 'flightcase': { P = new Pix(30, 20); const m = P.mask(); P.mRect(m, 0, 0, 30, 20); P.fill(m, '#23232c', { outline: OL }); const e = P.mask(); P.mRect(e, 0, 0, 30, 2); P.mRect(e, 0, 18, 30, 2); P.mRect(e, 0, 0, 2, 20); P.mRect(e, 28, 0, 2, 20); P.fill(e, '#8a8a98', { shade: false }); P.paint(m, (x, y) => (x === 14 || x === 15) && y > 3 && y < 16 ? '#3a3a46' : null); P.set(7, 10, '#c8a83a'); P.set(22, 10, '#c8a83a'); break; }
      case 'goldrecord': { P = new Pix(24, 24); const f = P.mask(); P.mRect(f, 0, 0, 24, 24); P.fill(f, '#6a4a28', { outline: OL }); const in_ = P.mask(); P.mRect(in_, 3, 3, 18, 18); P.fill(in_, '#1a1622', { shade: false }); const d = P.mask(); P.mEllipse(d, 12, 12, 8, 8); P.fill(d, '#e0b040', { outline: '#6a4a10' }); P.paint(d, (x, y) => { const dx = x - 12, dy = y - 12, r = Math.sqrt(dx * dx + dy * dy); return r > 3 && Math.floor(r) % 2 === 0 ? '#c89830' : null; }); P.set(12, 12, '#2a2018'); break; }
      case 'cooler': { P = new Pix(20, 15); const m = P.mask(); P.mRound(m, 0, 3, 20, 12, 2); P.fill(m, '#3a6ac0', { outline: OL }); const l = P.mask(); P.mRect(l, 0, 1, 20, 4); P.fill(l, '#e8e8f0', { outline: OL }); P.paint(m, (x, y) => y === 10 ? '#2a4a90' : null); break; }
      case 'stool': { P = new Pix(16, 18); const s2 = P.mask(); P.mEllipse(s2, 8, 4, 7, 3); P.fill(s2, '#8a3a4a', { outline: OL }); const lg = P.mask(); P.mRect(lg, 3, 6, 2, 12); P.mRect(lg, 11, 6, 2, 12); P.mRect(lg, 3, 13, 10, 2); P.fill(lg, '#3a2a20', { shade: false }); break; }
      case 'guitarcase': { P = new Pix(16, 44); const m = P.mask(); P.mEllipse(m, 8, 12, 7, 9); P.mEllipse(m, 8, 32, 8, 11); P.mRect(m, 3, 12, 10, 20); P.fill(m, '#2a2028', { outline: OL }); P.paint(m, (x, y) => x === 8 ? '#3e3240' : null); P.set(8, 2, '#c8a83a'); P.set(4, 22, '#c8a83a'); P.set(12, 22, '#c8a83a'); break; }
      case 'clock': { P = new Pix(18, 18); const m = P.mask(); P.mEllipse(m, 9, 9, 8, 8); P.fill(m, '#d8d0c0', { outline: OL }); const r2 = P.mask(); P.mEllipse(r2, 9, 9, 6, 6); P.fill(r2, '#f4f0e4', { shade: false }); P.mLine(m, 9, 9, 9, 5, 1); P.set(9, 5, '#2a2018'); P.set(9, 6, '#2a2018'); P.set(9, 7, '#2a2018'); P.set(9, 8, '#2a2018'); P.set(12, 9, '#8a3a3a'); P.set(11, 9, '#8a3a3a'); P.set(10, 9, '#8a3a3a'); break; }
      case 'suitcase': { P = new Pix(18, 14); const m = P.mask(); P.mRound(m, 0, 3, 18, 11, 2); P.fill(m, '#8a5a3a', { outline: OL }); const h = P.mask(); P.mRect(h, 6, 0, 6, 4); P.fill(h, '#5a3a20', { outline: OL, shade: false }); P.paint(m, (x, y) => y === 8 ? '#5a3a20' : null); break; }
      case 'seat': { P = new Pix(30, 34); const m = P.mask(); P.mRound(m, 2, 0, 26, 24, 3); P.fill(m, '#3a4a6a', { outline: OL }); const c = P.mask(); P.mRound(c, 5, 22, 20, 10, 2); P.fill(c, '#4a5a7a', { outline: OL }); P.paint(m, (x, y) => y === 4 || y === 18 ? '#2a3a5a' : null); break; }
      case 'window': { P = new Pix(40, 30); const m = P.mask(); P.mRound(m, 0, 0, 40, 30, 10); P.fill(m, '#d8dce8', { outline: OL }); const g2 = P.mask(); P.mRound(g2, 4, 4, 32, 22, 8); P.fill(g2, '#8ec8f0', { shade: false }); break; }
      default: P = new Pix(4, 4);
    }
    return P.toCanvas();
  });
}
// Tree with wind sway (frame 0..2), variants: round / palm / cypress / pine
function treeCanvas(variant, frame) {
  return cached('tree|' + variant + '|' + frame, () => {
    const P = new Pix(40, 56); const sway = [-1, 0, 1][frame % 3];
    const trunk = P.mask();
    if (variant === 'palm') {
      P.mLine(trunk, 19, 55, 20 + sway, 22, 3); P.fill(trunk, '#a8763a', { outline: OL }); P.paint(trunk, (x, y) => y % 4 === 0 ? '#8a5a2a' : null);
      const fronds = [[0, -14], [-14, -8], [14, -8], [-12, 4], [12, 4], [-6, 10], [6, 10]];
      for (const [dx, dy] of fronds) { const m = P.mask(); const ex = 20 + sway + dx * 1.1 + sway * 2, ey = 20 + dy; P.mLine(m, 20 + sway, 21, ex, ey, 2); P.mEllipse(m, ex, ey, 3, 2); P.fill(m, '#3f8a3f', { outline: OL, hi: '#6ab04a', lo: '#2a6a2a' }); }
      const nuts = P.mask(); P.mEllipse(nuts, 20 + sway, 23, 2, 2); P.fill(nuts, '#8a5a2a', { outline: OL });
    } else if (variant === 'cypress') {
      P.mRect(trunk, 18, 46, 4, 10); P.fill(trunk, '#6a4a2a', { outline: OL });
      const m = P.mask(); P.mPoly(m, [[20 + sway * 2, 2], [30 + sway, 30], [32, 46], [8, 46], [10 + sway, 30]]); P.fill(m, '#2f6b3a', { outline: OL, hi: '#4f9a4a', lo: '#1f4a2a' });
      P.paint(m, (x, y) => (x * 3 + y * 5) % 11 === 0 ? '#1f4a2a' : (x + y * 2) % 13 === 0 ? '#5aa050' : null);
    } else if (variant === 'pine') {
      P.mRect(trunk, 18, 44, 4, 12); P.fill(trunk, '#5a3a1e', { outline: OL });
      for (let i = 0; i < 3; i++) { const m = P.mask(); const w = 8 + i * 5, y = 8 + i * 12; P.mPoly(m, [[20 + sway * (3 - i) * 0.5, y], [20 + w, y + 16], [20 - w, y + 16]]); P.fill(m, '#2f6b3a', { outline: OL, hi: '#4f9a4a', lo: '#1f4a2a' }); }
    } else {
      P.mLine(trunk, 19, 55, 20 + sway, 30, 4); P.fill(trunk, '#6a4a2a', { outline: OL }); P.paint(trunk, (x, y) => x === 19 ? '#8a6a3a' : null);
      const m = P.mask(); P.mEllipse(m, 20 + sway * 2, 20, 16, 13); P.mEllipse(m, 12 + sway, 26, 9, 8); P.mEllipse(m, 29 + sway * 2, 25, 9, 8); P.mEllipse(m, 20 + sway * 2, 10, 9, 7);
      const cols = [['#3f8a3f', '#6ab04a', '#2a6a2a'], ['#5a9a3a', '#8ac850', '#3a6a2a'], ['#c8703a', '#e8a050', '#8a4a2a']][variant === 'autumn' ? 2 : variant === 'light' ? 1 : 0];
      P.fill(m, cols[0], { outline: OL, hi: cols[1], lo: cols[2] });
      P.paint(m, (x, y) => ((x * 5 + y * 3 + sway) % 9 === 0) ? cols[1] : ((x * 3 + y * 7) % 11 === 0) ? cols[2] : null);
    }
    return P.toCanvas();
  });
}
// Procedural side-view car (variant seed)
function carCanvas(seed, dir = 1) {
  return cached('car|' + seed + '|' + dir, () => {
    const r = makeRng(seed); const P = new Pix(44, 20);
    const col = r.pick(['#d84040', '#3a6ac0', '#e0b030', '#f4f0e8', '#3a3a44', '#4fa060', '#c060a0', '#e07030', '#70b0d0']);
    const kind = r.pick(['sedan', 'sedan', 'van', 'taxi', 'bus']);
    const body = P.mask();
    if (kind === 'bus') { P.mRound(body, 1, 2, 42, 14, 2); }
    else if (kind === 'van') { P.mRound(body, 2, 8, 40, 8, 2); P.mRound(body, 8, 2, 30, 8, 3); }
    else { P.mRound(body, 2, 9, 40, 7, 2); P.mRound(body, 11, 3, 22, 8, 3); }
    const c = kind === 'taxi' ? '#f0c020' : col;
    P.fill(body, c, { outline: OL });
    // windows
    const win = P.mask();
    if (kind === 'bus') { for (let i = 0; i < 5; i++) P.mRect(win, 4 + i * 8, 4, 6, 5); }
    else if (kind === 'van') { P.mRect(win, 10, 4, 8, 5); P.mRect(win, 20, 4, 8, 5); P.mRect(win, 30, 4, 6, 5); }
    else { P.mRect(win, 13, 5, 7, 4); P.mRect(win, 22, 5, 9, 4); }
    P.fill(win, '#9ad0f0', { outline: darken(c, 0.3), hi: '#d8f0ff', lo: '#6aa0c8' });
    // wheels
    for (const wx of kind === 'bus' ? [8, 34] : [9, 33]) { const w = P.mask(); P.mEllipse(w, wx, 16, 3.5, 3.5); P.fill(w, '#202024', { outline: OL, shade: false }); P.set(wx, 16, '#8a8a90'); }
    // lights
    P.set(42, 12, dir > 0 ? '#fff0a0' : '#ff4040'); P.set(1, 12, dir > 0 ? '#ff4040' : '#fff0a0');
    if (kind === 'taxi') { const t = P.mask(); P.mRect(t, 19, 1, 6, 2); P.fill(t, '#f4f0e8', { outline: OL, shade: false }); }
    const cv = P.toCanvas();
    return dir > 0 ? cv : flipCanvas(cv);
  });
}
// Cable car (SF icon)
function cableCarCanvas() {
  return cached('cablecar', () => {
    const P = new Pix(56, 26);
    const body = P.mask(); P.mRound(body, 2, 8, 52, 14, 2); P.fill(body, '#8a2a1a', { outline: OL });
    const roof = P.mask(); P.mRound(roof, 0, 4, 56, 5, 2); P.fill(roof, '#d8c8a0', { outline: OL });
    const win = P.mask(); for (let i = 0; i < 6; i++) P.mRect(win, 5 + i * 8, 10, 6, 6); P.fill(win, '#f0d890', { outline: darken('#8a2a1a', 0.3), shade: false });
    P.paint(body, (x, y) => y === 18 ? '#e0c060' : null);
    for (const wx of [10, 46]) { const w = P.mask(); P.mEllipse(w, wx, 23, 2.5, 2.5); P.fill(w, '#303038', { outline: OL, shade: false }); }
    const pole = P.mask(); P.mRect(pole, 27, 0, 2, 5); P.fill(pole, '#444', { shade: false });
    return P.toCanvas();
  });
}
