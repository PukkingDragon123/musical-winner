// ---------- Buildings: side-view facades, skylines, oblique map blocks ----------
'use strict';
const FACADE_STYLES = {
  victorian: { cols: ['#c8b8a8', '#e8d0c0', '#b8c8d8', '#d8c8a0', '#c0a0b0', '#a8c0b0', '#e0c8b8'], trim: '#f4efe0', floors: [2, 4], floorH: 22, bay: true },
  downtown:  { cols: ['#4a5a7a', '#5a6a8a', '#3a4a6a', '#6a7a90', '#556070'], trim: '#8a9ab0', floors: [5, 11], floorH: 14, bay: false },
  chinatown: { cols: ['#8a2a2a', '#6a2a3a', '#a03a2a', '#7a3a2a'], trim: '#d0a030', floors: [2, 4], floorH: 20, bay: false, pagoda: true },
  brick:     { cols: ['#8a4a3a', '#7a4a3a', '#9a5a4a', '#6a3a30'], trim: '#c8b8a0', floors: [3, 5], floorH: 18, bay: false, fire: true },
  pastel:    { cols: ['#d05070', '#50a0d0', '#e0b040', '#60b060', '#a060c0', '#f08060'], trim: '#f4efe0', floors: [2, 3], floorH: 22, bay: true },
  // ---- Tokyo
  // shitamachi: the low, tiled, slightly weathered old-town block
  shitamachi: { cols: ['#b9a894', '#a89882', '#c4b6a2', '#9a8c7a', '#cfc0a8'], trim: '#6a5c48', floors: [2, 3], floorH: 21, bay: false, tiled: true },
  // showa: narrow post-war bar fronts, painted and re-painted
  showa:      { cols: ['#7a5a48', '#6a4a4a', '#8a6a4a', '#5a4a44', '#7a4a3a'], trim: '#e0c88a', floors: [2, 3], floorH: 19, bay: false, noren: true },
  // kawaii: the sugar-coloured Harajuku frontages
  kawaii:     { cols: ['#f0a0c0', '#a8d8f0', '#f8e090', '#c0a8f0', '#a8f0c8', '#f8b8a0'], trim: '#ffffff', floors: [2, 4], floorH: 20, bay: false, awning: true },
  // glass: Ginza and the Scramble, mirrored and cold
  glass:      { cols: ['#3a4a60', '#44566e', '#32425a', '#4e6078'], trim: '#8fa8c4', floors: [6, 12], floorH: 13, bay: false, mirror: true },
  // neon: Kabukicho, every surface rented out to a sign
  neon:       { cols: ['#2a2434', '#332a40', '#241f30', '#3a2f46'], trim: '#6a5a80', floors: [4, 8], floorH: 15, bay: false, signs: true },
  // temple: vermilion posts and a heavy tiled roof
  temple:     { cols: ['#9a3a2a', '#8a3428', '#a84432'], trim: '#e8c86a', floors: [1, 2], floorH: 30, bay: false, kawara: true },
};
// Returns a canvas of a single building facade whose bottom edge is the street level.
function facadeCanvas(style, seed, w) {
  return cached('facade|' + style + '|' + seed + '|' + w, () => {
    const st = FACADE_STYLES[style] || FACADE_STYLES.victorian; const r = makeRng(seed);
    const floors = r.int(st.floors[0], st.floors[1]); const h = floors * st.floorH + 14;
    const P = new Pix(w, h + 10);
    const col = r.pick(st.cols); const dark = darken(col, 0.18), light = lighten(col, 0.1);
    const body = P.mask(); P.mRect(body, 0, 10, w, h); P.fill(body, col, { outline: OL, grad: false, shade: false });
    // storefront
    const sf = P.mask(); P.mRect(sf, 0, 10 + h - 14, w, 14); P.fill(sf, darken(col, 0.3), { shade: false });
    const awningCol = r.pick(['#c83a3a', '#2a7a3a', '#2a5ab0', '#e0a030', '#8a3a8a']);
    const aw = P.mask(); P.mRect(aw, 2, 10 + h - 16, w - 4, 3); P.fill(aw, awningCol, { outline: OL, shade: false }); P.paint(aw, (x, y) => x % 4 < 2 ? lighten(awningCol, 0.2) : null);
    const door = P.mask(); P.mRect(door, Math.floor(w / 2) - 3, 10 + h - 11, 6, 11); P.fill(door, '#3a2a1a', { outline: OL, shade: false }); P.set(Math.floor(w / 2) + 1, 10 + h - 6, '#e0c060');
    for (const wx of [4, w - 12]) { const win = P.mask(); P.mRect(win, wx, 10 + h - 11, 8, 7); P.fill(win, '#f0d890', { outline: OL, shade: false }); P.paint(win, (x, y) => y === 10 + h - 8 ? '#f8f0c0' : null); }
    // floors with windows
    const winW = st.floorH > 16 ? 6 : 4, winH = st.floorH > 16 ? 9 : 6, gap = st.floorH > 16 ? 12 : 9;
    for (let f = 0; f < floors; f++) {
      const fy = 10 + h - 14 - (f + 1) * st.floorH + 5;
      // cornice line
      const cl = P.mask(); P.mRect(cl, 0, fy + st.floorH - 6, w, 1); P.fill(cl, dark, { shade: false });
      for (let wx = 5; wx + winW < w - 3; wx += gap) {
        const lit = r.chance(0.55);
        const win = P.mask(); P.mRect(win, wx, fy, winW, winH); P.fill(win, lit ? '#f4d890' : '#3a3050', { outline: dark, shade: false });
        if (lit && r.chance(0.5)) P.paint(win, (x, y) => y === fy + 1 ? '#fff4c0' : null);
        if (!lit) P.paint(win, (x, y) => x === wx && y === fy ? '#6a6080' : null);
        if (st.bay && r.chance(0.25)) { const sill = P.mask(); P.mRect(sill, wx - 1, fy + winH, winW + 2, 1); P.fill(sill, st.trim, { shade: false }); }
      }
      if (st.fire && f > 0 && r.chance(0.6)) { const fe = P.mask(); P.mRect(fe, 2, fy + winH - 1, w - 4, 1); for (let x = 2; x < w - 2; x += 3) P.mRect(fe, x, fy + winH - 4, 1, 3); P.fill(fe, '#2a2a30', { shade: false }); }
    }
    // roof
    if (st.pagoda) { const roof = P.mask(); P.mPoly(roof, [[-4, 12], [w + 4, 12], [w - 2, 6], [2, 6]]); P.fill(roof, '#c8402a', { outline: OL }); P.paint(roof, (x, y) => y === 7 ? '#e0a030' : null); }
    else if (st.bay) { const roof = P.mask(); P.mRect(roof, -1, 8, w + 2, 3); P.fill(roof, st.trim, { outline: OL, shade: false }); if (r.chance(0.5)) { const g = P.mask(); P.mPoly(g, [[Math.floor(w / 2) - 8, 9], [Math.floor(w / 2) + 8, 9], [Math.floor(w / 2), 2]]); P.fill(g, col, { outline: OL }); } }
    else { const roof = P.mask(); P.mRect(roof, 0, 9, w, 2); P.fill(roof, dark, { outline: OL, shade: false }); if (r.chance(0.5)) { const wt = P.mask(); P.mRect(wt, r.int(3, Math.max(3, w - 10)), 3, 6, 7); P.fill(wt, '#6a5a4a', { outline: OL }); } if (r.chance(0.4)) { const ant = P.mask(); P.mRect(ant, w - 6, 0, 1, 10); P.fill(ant, '#888', { shade: false }); P.set(w - 6, 0, '#ff4040'); } }
    // wall texture
    P.paint(body, (x, y) => { const c = P.get(x, y); if (c !== col) return null; return (style === 'brick' && (y % 3 === 0) && ((x + (y % 6 === 0 ? 0 : 2)) % 5 === 0)) ? dark : (x === 0 ? light : x === w - 1 ? dark : null); });
    // ---- Tokyo dressing, layered on after the wall is built
    if (st.tiled) {
      // the small square tiles an old-town frontage is faced with
      P.paint(body, (x, y) => (x % 4 === 0 || y % 4 === 0) && P.get(x, y) === col ? darken(col, 0.09) : null);
    }
    if (st.kawara) {
      // a heavy tiled temple roof with an upturned ridge
      const roof = P.mask();
      P.mPoly(roof, [[-6, 14], [w + 6, 14], [w - 4, 4], [4, 4]]);
      P.fill(roof, '#3a4450', { outline: OL });
      for (let x = -4; x < w + 4; x += 4) { const rib = P.mask(); P.mRect(rib, x, 5, 2, 9); P.fill(rib, '#4c5866', { shade: false }); }
      P.paint(roof, (x, y) => y === 13 ? '#e8c86a' : null);
    }
    if (st.mirror) {
      // a mirrored curtain wall: bands of sky reflected down the face
      P.paint(body, (x, y) => { const c = P.get(x, y); if (c !== col) return null; return (y % 13 < 2) ? lighten(col, 0.22) : ((x * 3 + y) % 17 === 0 ? lighten(col, 0.12) : null); });
    }
    if (st.noren) {
      // a split curtain hung over the door of every little bar
      const nx = Math.floor(w / 2) - 8;
      const nr = P.mask(); P.mRect(nr, nx, 10 + h - 16, 16, 6);
      P.fill(nr, r.pick(['#1f3a6a', '#6a1f2a', '#2a4a2a', '#3a2a4a']), { outline: OL, shade: false });
      for (const sx of [nx + 5, nx + 10]) P.paint(nr, (x, y) => x === sx ? '#12101a' : null);
    }
    if (st.awning) {
      // a scalloped candy awning over the shopfront
      const aw2 = P.mask(); P.mRect(aw2, 1, 10 + h - 20, w - 2, 5);
      const ac = r.pick(['#f06aa0', '#6ac8f0', '#f8d24a', '#8af0b0']);
      P.fill(aw2, ac, { outline: OL, shade: false });
      P.paint(aw2, (x, y) => (x % 6 < 3) ? '#fdfcf8' : null);
      for (let x = 2; x < w - 2; x += 6) P.set(x, 10 + h - 15, darken(ac, 0.2));
    }
    if (st.signs) {
      // stacked signboards bolted to the face, the way Kabukicho does it
      const cols2 = ['#f0407a', '#40d0f0', '#f0d040', '#8a50f0', '#40f0a0'];
      let sy = 16;
      while (sy < 10 + h - 26) {
        const sh = r.int(6, 10), side = r.chance(0.5);
        const sx = side ? 1 : w - 10, sw = r.int(7, 10);
        const sg = P.mask(); P.mRect(sg, Math.min(sx, w - sw - 1), sy, sw, sh);
        const sc = r.pick(cols2);
        P.fill(sg, '#16121f', { outline: OL, shade: false });
        // the lit characters on it, as bars of light
        P.paint(sg, (x, y) => (y - sy) % 3 === 1 && (x % 2 === 0) ? sc : null);
        sy += sh + r.int(3, 7);
      }
    }
    return P.toCanvas();
  });
}
// Far skyline strip: rows of dark building silhouettes with lit windows. Returns canvas W x h
function skylineCanvas(seed, width, height, opts = {}) {
  return cached('skyline|' + seed + '|' + width + '|' + height + '|' + JSON.stringify(opts), () => {
    const r = makeRng(seed); const c = makeCanvas(width, height); const x = c.getContext('2d');
    const base = opts.color || '#3a3a5a', lit = opts.lit || '#ffe6a0';
    let px0 = 0;
    while (px0 < width) {
      const bw = r.int(10, 30), bh = r.int(Math.floor(height * 0.25), Math.floor(height * (opts.tall ? 0.95 : 0.7)));
      x.fillStyle = base; x.fillRect(px0, height - bh, bw, bh);
      x.fillStyle = lighten(base, 0.06); x.fillRect(px0, height - bh, bw, 1);
      if (opts.tall && r.chance(0.3)) { x.fillStyle = base; x.fillRect(px0 + bw / 2 - 1, height - bh - 6, 2, 6); }
      x.fillStyle = lit;
      for (let wy = height - bh + 3; wy < height - 2; wy += 4) for (let wx = px0 + 2; wx < px0 + bw - 2; wx += 4) if (r.chance(opts.density || 0.35)) x.fillRect(wx, wy, 2, 2);
      px0 += bw + r.int(1, 4);
    }
    return c;
  });
}
// SF landmark silhouettes for skylines
function landmarkCanvas(kind) {
  return cached('landmark|' + kind, () => {
    let P;
    if (kind === 'transamerica') { P = new Pix(20, 70); const m = P.mask(); P.mPoly(m, [[10, 0], [11, 0], [19, 60], [19, 70], [1, 70], [1, 60]]); P.fill(m, '#8a94a8', { outline: OL, grad: false }); P.paint(m, (x, y) => (y % 4 === 0 && x % 2 === 0 && y > 8) ? '#3a3a50' : null); const wing = P.mask(); P.mRect(wing, 4, 40, 3, 30); P.mRect(wing, 13, 40, 3, 30); P.fill(wing, '#6a748a', { outline: OL, grad: false }); }
    else if (kind === 'coit') { P = new Pix(14, 40); const m = P.mask(); P.mRect(m, 3, 4, 8, 36); P.fill(m, '#d8d0c0', { outline: OL, grad: false }); const top = P.mask(); P.mRect(top, 2, 2, 10, 3); P.fill(top, '#e8e0d0', { outline: OL, shade: false }); P.paint(m, (x, y) => x === 7 && y % 3 === 0 && y > 6 ? '#8a8070' : null); }
    else if (kind === 'ferry') { P = new Pix(22, 60); const m = P.mask(); P.mRect(m, 6, 6, 10, 54); P.fill(m, '#d0c8b8', { outline: OL, grad: false }); const clock = P.mask(); P.mEllipse(clock, 11, 16, 4, 4); P.fill(clock, '#f4f0e0', { outline: OL, shade: false }); P.set(11, 14, OL); P.set(12, 16, OL); P.set(11, 16, OL); const top = P.mask(); P.mPoly(top, [[6, 6], [16, 6], [11, 0]]); P.fill(top, '#a0a090', { outline: OL }); }
    else if (kind === 'sutro') { P = new Pix(30, 60); const m = P.mask(); P.mLine(m, 6, 60, 12, 0, 2); P.mLine(m, 24, 60, 18, 0, 2); P.mLine(m, 15, 60, 15, 10, 2); P.mRect(m, 4, 14, 24, 2); P.mRect(m, 8, 34, 16, 2); P.mRect(m, 10, 0, 12, 2); P.fill(m, '#d04040', { outline: OL, shade: false }); }
    else if (kind === 'bridge') {
      P = new Pix(200, 70); const m = P.mask();
      P.mRect(m, 0, 44, 200, 3); for (const tx of [50, 150]) { P.mRect(m, tx - 4, 6, 3, 44); P.mRect(m, tx + 1, 6, 3, 44); P.mRect(m, tx - 6, 4, 12, 3); P.mRect(m, tx - 6, 22, 12, 2); P.mRect(m, tx - 6, 34, 12, 2); }
      for (let x = 0; x < 200; x++) { const c = Math.abs(((x + 50) % 100) - 50) / 50; const y = 6 + Math.round(c * c * 36); P.mRect(m, x, y, 1, 1); if (x % 6 === 0) P.mRect(m, x, y, 1, 44 - y); }
      P.fill(m, '#c8432a', { outline: null, shade: false }); P.paint(m, (x, y) => y === 44 ? '#e05a3a' : null);
    }
    else if (kind === 'tokyotower') {
      // a lattice tower in international orange and white
      P = new Pix(34, 84); const m = P.mask();
      P.mLine(m, 3, 84, 14, 4, 2); P.mLine(m, 31, 84, 20, 4, 2);
      P.mRect(m, 14, 0, 6, 6); P.mRect(m, 15, 6, 4, 18);
      for (const [yy, half] of [[24, 6], [44, 9], [64, 12]]) P.mRect(m, 17 - half, yy, half * 2, 3);
      P.mRect(m, 6, 70, 22, 4);
      P.fill(m, '#e05a2a', { outline: OL, shade: false });
      // the white bands that break the orange up
      P.paint(m, (x, y) => (y > 8 && y < 20) || (y > 30 && y < 40) || (y > 50 && y < 58) ? '#f4ecdc' : null);
      // the lattice itself
      const lat = P.mask();
      for (let y = 24; y < 80; y += 7) { P.mLine(lat, 17 - (y - 10) * 0.22, y, 17 + (y - 10) * 0.22, y + 7, 1); P.mLine(lat, 17 + (y - 10) * 0.22, y, 17 - (y - 10) * 0.22, y + 7, 1); }
      P.paint(lat, (x, y) => P.get(x, y) ? darken(P.get(x, y), 0.18) : null);
      P.set(17, 0, '#ffd24a');
    }
    else if (kind === 'skytree') {
      // a tall pale spire with two observation decks and a red light on top
      P = new Pix(22, 110); const m = P.mask();
      for (let y = 0; y < 110; y++) { const half = Math.max(1, Math.round(1 + Math.pow(y / 110, 1.7) * 8)); P.mRect(m, 11 - half, y, half * 2, 1); }
      P.fill(m, '#cfd6e4', { outline: OL, shade: false });
      P.ditherTo(m, '#a8b2c8', (x, y) => clamp(1 - y / 110, 0, 1) * 0.6);
      for (const [yy, half] of [[54, 8], [74, 9]]) { const d = P.mask(); P.mRect(d, 11 - half, yy, half * 2, 5); P.fill(d, '#e8edf6', { outline: OL, shade: false }); P.paint(d, (x, y) => y === yy + 2 ? '#7fc8e8' : null); }
      const sp = P.mask(); P.mRect(sp, 10, 0, 2, 22); P.fill(sp, '#dfe6f2', { shade: false });
      P.set(11, 0, '#ff4a4a'); P.set(10, 1, '#ff8a6a');
      // the steel lattice, hinted rather than drawn
      P.paint(m, (x, y) => y > 20 && (x + y) % 5 === 0 ? '#b4bccc' : null);
    }
    else if (kind === 'torii') {
      P = new Pix(30, 34); const m = P.mask();
      P.mRect(m, 4, 8, 4, 26); P.mRect(m, 22, 8, 4, 26);
      P.mPoly(m, [[0, 2], [30, 2], [28, 7], [2, 7]]);
      P.mRect(m, 3, 11, 24, 3);
      P.fill(m, '#c8402a', { outline: OL });
      P.paint(m, (x, y) => y === 2 || y === 11 ? '#e4644a' : null);
      P.paint(m, (x, y) => y > 30 ? '#2a2028' : null);
    }
    else { P = new Pix(4, 4); }
    return P.toCanvas();
  });
}
// Oblique (top-down with visible front) building block for the city map. w,d in px, h = height px
function blockCanvas(seed, w, d, h, style) {
  return cached('block|' + seed + '|' + w + '|' + d + '|' + h + '|' + style, () => {
    const r = makeRng(seed); const st = FACADE_STYLES[style] || FACADE_STYLES.downtown;
    const col = r.pick(st.cols); const P = new Pix(w + 2, d + h + 2);
    // front face
    const front = P.mask(); P.mRect(front, 1, d + 1, w, h); P.fill(front, col, { outline: OL, grad: false, shade: false });
    const fdark = darken(col, 0.15);
    P.paint(front, (x, y) => { const fy = y - (d + 1); if (fy % 6 === 2 && x % 5 >= 1 && x % 5 <= 2 && fy < h - 4) return r.chance(0.5) ? '#f4d890' : '#2a2a40'; if (fy === h - 1) return fdark; return null; });
    // roof (top face) lighter
    const roof = P.mask(); P.mRect(roof, 1, 1, w, d); P.fill(roof, lighten(col, 0.16), { outline: OL, grad: false, shade: false });
    P.paint(roof, (x, y) => y === 1 ? lighten(col, 0.28) : null);
    if (style === 'chinatown') P.paint(roof, (x, y) => y === 2 || y === d ? '#c8402a' : null);
    if (r.chance(0.35)) { const ac = P.mask(); P.mRect(ac, r.int(2, Math.max(2, w - 6)), r.int(2, Math.max(2, d - 4)), 4, 3); P.fill(ac, '#8a8a90', { outline: OL, shade: false }); }
    if (r.chance(0.3) && d > 8) { const wt = P.mask(); P.mEllipse(wt, r.int(4, w - 4), r.int(3, d - 3), 2, 2); P.fill(wt, '#6a5a4a', { outline: OL, shade: false }); }
    return P.toCanvas();
  });
}
