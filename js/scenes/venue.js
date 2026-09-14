// ---------- Street gigs: venue backdrops, band, crowd, rhythm panel, payout tally ----------
'use strict';
// Static venue backdrop layers. Returns {far, mid, drawGround(ctx,L,t), props:[{kind,x}]}
function buildVenue(venue, seed, dayT) {
  const r = makeRng(seed); const skyT = clamp(venue.sky * 0.6 + dayT * 0.5, 0, 1);
  const V = { skyT, kind: venue.kind };
  const far = makeCanvas(W, 210), fx = far.getContext('2d');
  const [c1, c2] = skyColors(skyT); vgrad(fx, 0, 0, W, 210, c1, c2);
  if (skyT > 0.7) { for (let i = 0; i < 70; i++) px(fx, r.int(0, W), r.int(0, 120), '#fff'); }
  if (skyT > 0.45 && skyT < 0.8) { circle(fx, r.int(120, 840), 58, 18, '#fff0b0'); }
  if (venue.kind !== 'subway') {
    fx.drawImage(skylineCanvas(seed, W, 108, { color: skyT > 0.6 ? '#1e1a3a' : '#7a86a8', lit: '#ffe6a0', tall: venue.tall || venue.kind === 'pier', density: skyT > 0.5 ? 0.35 : 0.1 }), 0, 102);
    (venue.landmarks || []).forEach((lm, i) => { const c = landmarkCanvas(lm); fx.drawImage(c, [640, 160, 780][i % 3], 210 - c.height * 1.4, c.width * 1.4, c.height * 1.4); });
    for (let i = 0; i < 6; i++) fx.drawImage(propCanvas('cloud'), r.int(0, W - 60), r.int(8, 76), 60, 21);
  }
  V.far = far;
  // mid: facades or venue-specific wall
  const mid = makeCanvas(W + 260, 250), mx = mid.getContext('2d'); V.midH = 250;
  if (venue.kind === 'street') {
    let x = -20, i = 0; const styles = venue.styles || ['victorian', 'pastel'];
    while (x < W + 240) { const w = r.int(60, 108); const f = facadeCanvas(styles[i % styles.length], seed * 31 + i, w); mx.drawImage(f, x, 250 - f.height * 1.45, w * 1.45, f.height * 1.45); x += w * 1.45 + 2; i++; }
    if (venue.lanterns) { for (let lx = 14; lx < W + 240; lx += 62) mx.drawImage(propCanvas('lantern2', Math.floor(lx / 62) % 3), lx, 148 + (lx % 124 ? 0 : 10), 18, 27); }
    // ---- Tokyo street furniture, laid along the shopfronts
    for (let px2 = 60; px2 < W + 220; px2 += r.int(150, 240)) {
      const pick = r.int(0, 5);
      if (pick === 0) mx.drawImage(propCanvas('vending', r.int(0, 2)), px2, 178, 27, 45);
      else if (pick === 1) { mx.drawImage(propCanvas('gacha', r.int(0, 2)), px2, 184, 24, 39); mx.drawImage(propCanvas('gacha', r.int(0, 2)), px2 + 25, 184, 24, 39); }
      else if (pick === 2) mx.drawImage(propCanvas('bike', r.int(0, 2)), px2, 202, 36, 21);
      else if (pick === 3) mx.drawImage(propCanvas('crate2', r.int(0, 2)), px2, 202, 30, 21);
      else if (pick === 4 && venue.signs) mx.drawImage(propCanvas('arcade', r.int(0, 2)), px2, 172, 33, 51);
      else mx.drawImage(propCanvas('trash'), px2, 200, 18, 24);
      drawShadow(mx, px2 + 14, 224, 34, 0.14);
    }
    if (venue.narrow) { // a low alley: bunting of small lanterns overhead
      for (let lx = 0; lx < W + 240; lx += 34) { rect(mx, lx, 92, 34, 1, '#3a3040'); mx.drawImage(propCanvas('lantern2', Math.floor(lx / 34) % 3), lx + 10, 92, 12, 18); }
    }
    if (venue.screens) { // the big video walls of a crossing
      for (const [sx, sy, sw, sh] of [[200, 44, 150, 82], [700, 30, 190, 96]]) {
        rect(mx, sx - 3, sy - 3, sw + 6, sh + 6, '#15121c');
        rect(mx, sx, sy, sw, sh, '#0e1420');
        for (let i = 0; i < 70; i++) { const bx = sx + r.int(2, sw - 8), by = sy + r.int(2, sh - 6);
          rect(mx, bx, by, r.int(3, 8), 2, r.pick(['#40d8f0', '#f0d040', '#f04888', '#68f088', '#f8f8ff'])); }
        for (let y = sy; y < sy + sh; y += 3) { mx.globalAlpha = 0.16; rect(mx, sx, y, sw, 1, '#000'); mx.globalAlpha = 1; }
      }
    }
  } else if (venue.kind === 'subway') {
    mx.fillStyle = '#2a2a34'; mx.fillRect(0, 0, W + 260, 250);
    for (let x = 0; x < W + 260; x += 11) for (let y = 60; y < 230; y += 9) rect(mx, x, y, 10, 8, ((x / 11 + y / 9) % 2) ? '#c8c0a8' : '#b8b09a');
    rect(mx, 0, 0, W + 260, 58, '#1e1e26'); for (let x = 0; x < W + 260; x += 84) { rect(mx, x + 14, 12, 9, 6, '#ffe8a0'); ctx2glow(mx, x + 18, 15); }
    rect(mx, 0, 104, W + 260, 18, '#2a4a9a'); drawText(mx, 'SHIBUYA   SHIBUYA   SHIBUYA   SHIBUYA   SHIBUYA   SHIBUYA   SHIBUYA', 14, 107, '#fff', { scale: 2 });
    for (let x = 56; x < W + 260; x += 224) { rect(mx, x, 0, 24, 250, '#7a7a8a'); rect(mx, x + 3, 0, 6, 250, '#9a9aaa'); rect(mx, x + 18, 0, 3, 250, '#5a5a6a'); }
    mx.drawImage(propCanvas('sign', 0), 300, 176, 21, 33); mx.drawImage(propCanvas('bench'), 480, 218, 45, 21);
    function ctx2glow(c, x, y) { c.globalAlpha = 0.15; circle(c, x, y + 14, 16, '#ffe680'); c.globalAlpha = 1; }
  } else if (venue.kind === 'park') {
    // ---- lawn, in bands so it reads as depth rather than a flat green wall
    rect(mx, 0, 168, W + 260, 82, '#5aa050');
    vgrad(mx, 0, 168, W + 260, 82, '#78bb63', '#4e9147');
    rect(mx, 0, 168, W + 260, 3, '#8fcf76');
    for (let i = 0; i < 220; i++) { const gx = r.int(0, W + 260), gy = r.int(174, 248); rect(mx, gx, gy, 2, 2, r.chance(0.5) ? '#7fb85a' : '#4a8a42'); }
    // a winding path with a gravel edge
    mx.strokeStyle = '#d8ceb0'; mx.lineWidth = 22; mx.lineCap = 'round'; mx.beginPath();
    mx.moveTo(-20, 246); for (let x = 0; x < W + 280; x += 60) mx.lineTo(x, 222 + Math.sin(x * 0.012) * 16); mx.stroke();
    mx.strokeStyle = '#c2b694'; mx.lineWidth = 26; mx.globalAlpha = 0.35; mx.stroke(); mx.globalAlpha = 1; mx.lineWidth = 1;
    // ---- a back row of full trees with trunks and a front row of shrubs
    for (let x = -20; x < W + 280; x += 88) {
      const kind = r.pick(['round', 'round', 'light', 'palm', 'cypress']);
      const tc = treeCanvas(kind, 0), tx = x + r.int(-14, 14), ty = 104 + r.int(-8, 8);
      rect(mx, tx + 24, ty + 54, 7, 26, '#6a4a2a'); rect(mx, tx + 24, ty + 54, 2, 26, '#8a6a44');
      mx.drawImage(tc, tx, ty, 56, 74);
    }
    for (let x = 10; x < W + 260; x += 54) { const bs = r.int(11, 19); circle(mx, x + r.int(-8, 8), 200 + r.int(-4, 6), bs, '#3f7a3a'); circle(mx, x - 4, 194, Math.round(bs * 0.6), '#5da24f'); }
    // flower beds
    for (let i = 0; i < 9; i++) { const fx2 = r.int(20, W + 220), fy = r.int(196, 240);
      circle(mx, fx2, fy, 9, '#3f7a3a');
      for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; circle(mx, fx2 + Math.cos(a) * 5, fy + Math.sin(a) * 4, 2, r.pick(['#e8563f', '#f2cf4a', '#e07ab0', '#f0f0e0'])); } }
    // ---- benches, bins, a drinking fountain and a bandstand
    for (const bx of [220, 520, 830, 1140]) { mx.drawImage(propCanvas('bench'), bx, 218, 45, 21); drawShadow(mx, bx + 22, 240, 42, 0.16); }
    mx.drawImage(propCanvas('trash'), 400, 214, 18, 24);
    mx.drawImage(propCanvas('lamp'), 690, 150, 18, 69);
    rect(mx, 960, 206, 14, 30, '#8a9aa8'); rect(mx, 958, 202, 18, 6, '#a8b8c4'); circle(mx, 967, 200, 4, '#bcd8e8');
    if (venue.ggpark) {
      // the conservatory: a glasshouse dome at the back
      rect(mx, 560, 130, 120, 72, '#e8e2cc'); frame(mx, 560, 130, 120, 72, '#c8bfa0');
      for (let gx = 566; gx < 676; gx += 14) rect(mx, gx, 136, 10, 60, '#cfe4dc');
      mx.fillStyle = '#e8e2cc'; mx.beginPath(); mx.moveTo(556, 130); mx.quadraticCurveTo(620, 86, 684, 130); mx.fill();
      for (let k = 0; k < 5; k++) { mx.strokeStyle = '#c8bfa0'; mx.beginPath(); mx.moveTo(620, 92); mx.lineTo(566 + k * 27, 130); mx.stroke(); }
      rect(mx, 606, 168, 28, 34, '#4a3a2a'); rect(mx, 606, 168, 28, 3, '#6a5a44');
    }
  } else if (venue.kind === 'temple') {
    // ---- a temple forecourt: the great gate, its lantern, and a swept yard
    vgrad(mx, 0, 0, W + 260, 168, '#2c3550', '#4a4262');
    rect(mx, 0, 168, W + 260, 82, '#b0a894');
    for (let x = 0; x < W + 260; x += 26) for (let y = 170; y < 250; y += 13) rect(mx, x + ((y / 13) % 2 ? 13 : 0), y, 25, 12, ((x / 26 + y / 13) % 2) ? '#b8b09c' : '#aca48e');
    // the main hall behind, on its stone base
    const hx = 380, hw = 480;
    rect(mx, hx, 96, hw, 76, '#9a3a2a'); rect(mx, hx, 96, hw, 4, '#c8604a');
    for (let px2 = hx + 14; px2 < hx + hw - 10; px2 += 54) { rect(mx, px2, 100, 12, 72, '#b04a34'); rect(mx, px2, 100, 3, 72, '#c8604a'); }
    mx.fillStyle = '#3a4450'; mx.beginPath(); mx.moveTo(hx - 46, 100); mx.lineTo(hx + hw + 46, 100); mx.lineTo(hx + hw - 20, 52); mx.lineTo(hx + 20, 52); mx.fill();
    for (let px2 = hx - 44; px2 < hx + hw + 44; px2 += 8) rect(mx, px2, 54, 4, 46, '#46525f');
    rect(mx, hx - 46, 96, hw + 92, 5, '#e8c86a');
    // the big red lantern hanging in the gate
    rect(mx, 596, 100, 2, 22, '#2a2028');
    const lg = propCanvas('lantern2', 1); mx.drawImage(lg, 572, 120, 48, 72);
    // stone lanterns and a pair of torii either side
    mx.drawImage(landmarkCanvas('torii'), 140, 96, 90, 102);
    mx.drawImage(landmarkCanvas('torii'), 1080, 104, 75, 85);
    for (const sx of [320, 940]) { rect(mx, sx, 196, 16, 30, '#9a968c'); rect(mx, sx - 4, 186, 24, 10, '#a8a49a'); rect(mx, sx - 2, 180, 20, 6, '#8e8a80'); }
    // an incense burner, smoking
    rect(mx, 700, 200, 44, 24, '#5a5048'); rect(mx, 700, 196, 44, 5, '#7a7066');
    for (let i = 0; i < 5; i++) { mx.globalAlpha = 0.18; circle(mx, 716 + i * 3, 188 - i * 9, 5 + i * 2, '#e8e4dc'); mx.globalAlpha = 1; }
  } else if (venue.kind === 'pier') {
    rect(mx, 0, 0, W + 260, 176, '#3a6a9a'); for (let y = 8; y < 174; y += 7) for (let x = (y * 7) % 28; x < W + 260; x += 28) rect(mx, x, y, 12, 2, '#5a8ab8');
    mx.drawImage(propCanvas('boat'), 180, 86, 45, 18); mx.drawImage(propCanvas('sailboat'), 700, 56, 24, 27); mx.drawImage(propCanvas('sailboat'), 1020, 100, 24, 27);
    rect(mx, 440, 58, 104, 24, '#6a6a5a'); rect(mx, 464, 42, 52, 18, '#d8d0c0'); rect(mx, 482, 32, 12, 12, '#e8e0d0');
    rect(mx, 0, 174, W + 260, 76, '#8a6a4a'); for (let x = 0; x < W + 260; x += 14) rect(mx, x, 174, 2, 76, '#6a4a2a'); rect(mx, 0, 174, W + 260, 4, '#5a3a1a');
    for (let x = 0; x < W + 260; x += 68) { rect(mx, x, 152, 6, 30, '#5a3a1a'); rect(mx, x, 152, 6, 3, '#7a5a3a'); } rect(mx, 0, 158, W + 260, 3, '#5a3a1a');
    mx.drawImage(propCanvas('seal'), 740, 218, 33, 18); mx.drawImage(propCanvas('seal'), 130, 224, 33, 18); if (venue.ferry) mx.drawImage(landmarkCanvas('ferry'), 880, 86, 33, 90);
  } else if (venue.kind === 'bridge') {
    rect(mx, 0, 0, W + 260, 180, '#4a4a8a'); for (let y = 8; y < 178; y += 7) for (let x = (y * 7) % 28; x < W + 260; x += 28) rect(mx, x, y, 12, 2, '#6a6aa8');
    mx.drawImage(landmarkCanvas('rainbow'), -60, -44, 660, 230); mx.drawImage(landmarkCanvas('rainbow'), 600, -44, 660, 230);
    mx.drawImage(landmarkCanvas('skytree'), 940, -30, 34, 176);
    rect(mx, 0, 186, W + 260, 64, '#5a5a6a'); rect(mx, 0, 186, W + 260, 6, '#8ad8ff'); for (let x = 0; x < W + 260; x += 86) rect(mx, x, 148, 7, 44, '#8a92a8');
    for (let x = 0; x < W + 260; x += 11) rect(mx, x, 166, 6, 2, '#8a92a8');
  }
  V.mid = mid;
  // near props on the sidewalk (x positions, drawn behind the band row)
  V.props = [];
  const pool = venue.kind === 'street' ? ['lamp', 'hydrant', 'trash', 'newsbox', 'planter', 'mailbox', 'tree', 'bench', 'sign', 'cone'] : venue.kind === 'park' ? ['bench', 'trash', 'lamp', 'planter'] : venue.kind === 'pier' ? ['lamp', 'trash', 'bench', 'sign'] : venue.kind === 'bridge' ? ['lamp', 'lamp', 'cone'] : ['trash', 'newsbox', 'sign', 'cone'];
  let px2 = 360; while (px2 < W + 60) { V.props.push({ kind: r.pick(pool), x: px2, v: r.int(0, 2) }); px2 += r.int(96, 160); }
  V.props.push({ kind: 'lamp', x: 56, v: 0 });
  return V;
}
function drawVenue(ctx, V, L, t, wind, venue) {
  const top = L.stageTop, bottom = L.stageBottom, groundY = L.groundY;
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
  // far sky+skyline, anchored to the facade line
  const midBottom = groundY - 20;
  ctx.drawImage(V.far, 0, midBottom - V.midH - 60 + (L.compact ? 90 : 0));
  const parallax = Math.round(Math.sin(t * 0.1) * 0); ctx.drawImage(V.mid, -20 + parallax, midBottom - V.midH);
  // sidewalk
  rect(ctx, 0, midBottom, W, groundY - midBottom + 18, venue.kind === 'park' ? '#b8a888' : venue.kind === 'pier' ? '#7a5a3a' : '#a8a49a'); rect(ctx, 0, midBottom, W, 3, venue.kind === 'pier' ? '#8a6a4a' : '#c8c4b8');
  if (venue.kind !== 'pier') for (let sx = 0; sx < W; sx += 38) rect(ctx, sx, midBottom + 3, 2, groundY - midBottom + 15, 'rgba(0,0,0,0.12)'); else for (let sx = 0; sx < W; sx += 14) rect(ctx, sx, midBottom, 2, groundY - midBottom + 18, '#5a3a1a');
  rect(ctx, 0, groundY + 16, W, 4, venue.kind === 'subway' ? '#ffe040' : '#6a6660');
  // street / tracks
  if (L.streetY) {
    if (venue.kind === 'subway') { rect(ctx, 0, L.streetY, W, L.streetH, '#1a1a20'); for (let x = 0; x < W; x += 14) rect(ctx, x, L.streetY + 12, 8, 3, '#4a3a2a'); rect(ctx, 0, L.streetY + 8, W, 2, '#8a8a90'); rect(ctx, 0, L.streetY + 18, W, 2, '#8a8a90'); }
    else if (venue.kind === 'pier' || venue.kind === 'bridge') { rect(ctx, 0, L.streetY, W, L.streetH, venue.kind === 'pier' ? '#3a6a9a' : '#4a4a8a'); for (let y = L.streetY + 3; y < L.streetY + L.streetH; y += 5) for (let x = (y * 7 + Math.floor(t * 10)) % 20; x < W; x += 20) rect(ctx, x, y, 8, 1, venue.kind === 'pier' ? '#5a8ab8' : '#6a6aa8'); }
    else if (venue.kind === 'park') { rect(ctx, 0, L.streetY, W, L.streetH, '#5aa050'); for (let i = 0; i < 30; i++) rect(ctx, (i * 53) % W, L.streetY + (i * 17) % L.streetH, 2, 1, '#7fb85a'); }
    else { rect(ctx, 0, L.streetY, W, L.streetH, '#3f3f48'); for (let sx = 0; sx < W; sx += 48) rect(ctx, sx, L.streetY + L.streetH / 2 - 1, 26, 3, '#d8c860'); for (let sx = 300; sx < 380; sx += 11) rect(ctx, sx, L.streetY, 6, L.streetH, 'rgba(255,255,255,0.5)'); }
  }
  // props behind band row
  for (const p of V.props) {
    if (p.kind === 'tree') { const c = treeCanvas('round', wind.frame(p.x)); ctx.drawImage(c, p.x - 28, midBottom - 74, 56, 78); continue; }
    const c = propCanvas(p.kind, p.v), sc = 1.45; ctx.drawImage(c, p.x, midBottom + 6 - c.height * sc, c.width * sc, c.height * sc);
    if (c.height * sc > 20) drawShadow(ctx, p.x + c.width * sc / 2, midBottom + 7, c.width * sc * 1.1, 0.18);
    if (p.kind === 'lamp' && V.skyT > 0.55) lightPool(ctx, p.x + 9, midBottom - 52, 78, '#ffe680', 0.16);
  }
  // ---- cinematic pass: haze on the horizon, a colour grade, a soft vignette
  ctx.globalAlpha = 0.16; vgrad(ctx, 0, midBottom - 46, W, 52, 'rgba(0,0,0,0)', V.skyT > 0.6 ? '#2a2a4a' : '#e8dcc0'); ctx.globalAlpha = 1;
  grade(ctx, 0, top, W, bottom - top, V.skyT > 0.6 ? '#3a3a7a' : '#ffd9a0', V.skyT > 0.6 ? 0.16 : 0.1);
  vignetteRect(ctx, 0, top, W, bottom - top, V.skyT > 0.6 ? 0.5 : 0.34);
  ctx.restore();
}
function drawBand(ctx, performers, active, stageX, groundY, t, onBeat, hatX, layer, celebrate) {
  performers.forEach((m, i) => {
    const x = stageX - (performers.length - 1) * 26 + i * 52, isAct = m === active;
    const cel = celebrate ? { pose: 'cheer', expr: 'happy', rate: 4.4, bounce: 2.6, phase: i * 1.4 } : null;
    if (m.instrument === 'drums') { if (layer === 0) { ctx.drawImage(propInstrument('drums'), x - 32, groundY - 52, 64, 48); drawBugAt(ctx, m.spec, x, groundY - 16, Object.assign({ pose: onBeat ? 'play' : 'idle', scale: 1.2 }, cel)); } return; }
    if (m.instrument === 'piano') { if (layer === 0) { drawBugAt(ctx, m.spec, x, groundY - 6, Object.assign({ pose: onBeat ? 'play' : 'idle', scale: 1.2 }, cel)); ctx.drawImage(propInstrument('piano'), x - 32, groundY - 34, 64, 34); } return; }
    if (layer === 1) { drawShadow(ctx, x, groundY, 32, 0.25); drawBugAt(ctx, m.spec, x, groundY + (isAct && onBeat ? -3 : 0), Object.assign({ pose: isAct ? (onBeat ? 'play' : 'play2') : (Math.floor(t * 4 + i) % 3 ? 'play' : 'idle'), instrument: m.instrument, scale: 1.3, squash: isAct && onBeat ? 1.05 : 1 }, cel, cel ? { instrument: null } : null)); if (isAct && !celebrate) drawText(ctx, '\u2193', x, groundY - 96 + Math.round(Math.sin(t * 8) * 2), '#ffe14d', { align: 'center', scale: 2, outline: '#1a1410' }); }
  });
  if (layer === 0) { ctx.drawImage(propCanvas('amp'), stageX - performers.length * 26 - 54, groundY - 26, 32, 28); }
  if (layer === 1) ctx.drawImage(propCanvas('hat'), hatX - 11, groundY - 12, 22, 13);
}

