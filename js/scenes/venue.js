// ---------- Street gigs: venue backdrops, band, crowd, rhythm panel, payout tally ----------
'use strict';
// Static venue backdrop layers. Returns {far, mid, drawGround(ctx,L,t), props:[{kind,x}]}
function buildVenue(venue, seed, dayT) {
  const r = makeRng(seed); const skyT = clamp(venue.sky * 0.6 + dayT * 0.5, 0, 1);
  const V = { skyT, kind: venue.kind };
  const far = makeCanvas(W, 140), fx = far.getContext('2d');
  const [c1, c2] = skyColors(skyT); vgrad(fx, 0, 0, W, 140, c1, c2);
  if (skyT > 0.7) { for (let i = 0; i < 40; i++) px(fx, r.int(0, W), r.int(0, 80), '#fff'); }
  if (skyT > 0.45 && skyT < 0.8) { circle(fx, r.int(80, 560), 40, 12, '#fff0b0'); }
  if (venue.kind !== 'subway') {
    fx.drawImage(skylineCanvas(seed, W, 70, { color: skyT > 0.6 ? '#1e1a3a' : '#7a86a8', lit: '#ffe6a0', tall: venue.tall || venue.kind === 'pier', density: skyT > 0.5 ? 0.35 : 0.1 }), 0, 70);
    (venue.landmarks || []).forEach((lm, i) => { const c = landmarkCanvas(lm); fx.drawImage(c, [420, 120, 520][i % 3], 140 - c.height); });
    for (let i = 0; i < 4; i++) fx.drawImage(propCanvas('cloud'), r.int(0, W - 40), r.int(6, 50));
  }
  V.far = far;
  // mid: facades or venue-specific wall
  const mid = makeCanvas(W + 200, 170), mx = mid.getContext('2d'); V.midH = 170;
  if (venue.kind === 'street') {
    let x = -20, i = 0; const styles = venue.styles || ['victorian', 'pastel'];
    while (x < W + 180) { const w = r.int(52, 96); const f = facadeCanvas(styles[i % styles.length], seed * 31 + i, w); mx.drawImage(f, x, 170 - f.height); x += w + 1; i++; }
    if (venue.lanterns) { for (let lx = 10; lx < W + 180; lx += 44) mx.drawImage(propCanvas('lantern'), lx, 100 + (lx % 88 ? 0 : 8)); }
  } else if (venue.kind === 'subway') {
    mx.fillStyle = '#2a2a34'; mx.fillRect(0, 0, W + 200, 170);
    for (let x = 0; x < W + 200; x += 8) for (let y = 40; y < 150; y += 6) rect(mx, x, y, 7, 5, ((x / 8 + y / 6) % 2) ? '#c8c0a8' : '#b8b09a');
    rect(mx, 0, 0, W + 200, 40, '#1e1e26'); for (let x = 0; x < W + 200; x += 60) { rect(mx, x + 10, 8, 6, 4, '#ffe8a0'); ctx2glow(mx, x + 13, 10); }
    rect(mx, 0, 70, W + 200, 12, '#2a4a9a'); drawText(mx, '16TH ST MISSION      16TH ST MISSION      16TH ST MISSION      16TH ST MISSION', 10, 72, '#fff');
    for (let x = 40; x < W + 200; x += 160) { rect(mx, x, 0, 16, 170, '#7a7a8a'); rect(mx, x + 2, 0, 4, 170, '#9a9aaa'); rect(mx, x + 12, 0, 2, 170, '#5a5a6a'); }
    mx.drawImage(propCanvas('sign', 0), 200, 120); mx.drawImage(propCanvas('bench'), 330, 150);
    function ctx2glow(c, x, y) { c.globalAlpha = 0.15; circle(c, x, y + 14, 16, '#ffe680'); c.globalAlpha = 1; }
  } else if (venue.kind === 'park') {
    rect(mx, 0, 120, W + 200, 50, '#5aa050'); rect(mx, 0, 120, W + 200, 2, '#7ac060');
    for (let i = 0; i < 40; i++) rect(mx, r.int(0, W + 200), r.int(124, 168), 2, 1, '#7fb85a');
    for (let x = 0; x < W + 200; x += 70) mx.drawImage(treeCanvas(r.pick(['round', 'round', 'light', 'palm', 'cypress']), 0), x + r.int(-10, 10), 76 + r.int(-4, 4));
    mx.drawImage(propCanvas('bench'), 260, 152); mx.drawImage(propCanvas('bench'), 520, 152);
    if (venue.ggpark) { rect(mx, 400, 100, 60, 40, '#e0d8c0'); rect(mx, 404, 96, 52, 6, '#c8b090'); rect(mx, 420, 110, 20, 30, '#4a3a2a'); }
  } else if (venue.kind === 'pier') {
    rect(mx, 0, 0, W + 200, 120, '#3a6a9a'); for (let y = 6; y < 118; y += 5) for (let x = (y * 7) % 20; x < W + 200; x += 20) rect(mx, x, y, 8, 1, '#5a8ab8');
    mx.drawImage(propCanvas('boat'), 120, 60); mx.drawImage(propCanvas('sailboat'), 480, 40); mx.drawImage(propCanvas('sailboat'), 700, 70);
    rect(mx, 300, 40, 70, 16, '#6a6a5a'); rect(mx, 316, 30, 34, 12, '#d8d0c0'); rect(mx, 328, 24, 8, 8, '#e8e0d0'); // Alcatraz
    rect(mx, 0, 118, W + 200, 52, '#8a6a4a'); for (let x = 0; x < W + 200; x += 10) rect(mx, x, 118, 1, 52, '#6a4a2a'); rect(mx, 0, 118, W + 200, 3, '#5a3a1a');
    for (let x = 0; x < W + 200; x += 48) { rect(mx, x, 104, 4, 20, '#5a3a1a'); rect(mx, x, 104, 4, 2, '#7a5a3a'); } rect(mx, 0, 108, W + 200, 2, '#5a3a1a');
    mx.drawImage(propCanvas('seal'), 500, 150); mx.drawImage(propCanvas('seal'), 90, 154); if (venue.ferry) mx.drawImage(landmarkCanvas('ferry'), 600, 60);
  } else if (venue.kind === 'bridge') {
    rect(mx, 0, 0, W + 200, 120, '#4a4a8a'); for (let y = 6; y < 118; y += 5) for (let x = (y * 7) % 20; x < W + 200; x += 20) rect(mx, x, y, 8, 1, '#6a6aa8');
    mx.drawImage(landmarkCanvas('bridge'), -40, -30, 460, 160); mx.drawImage(landmarkCanvas('bridge'), 420, -30, 460, 160);
    rect(mx, 0, 126, W + 200, 44, '#5a5a6a'); rect(mx, 0, 126, W + 200, 4, '#c8432a'); for (let x = 0; x < W + 200; x += 60) { rect(mx, x, 100, 5, 30, '#c8432a'); }
    for (let x = 0; x < W + 200; x += 8) rect(mx, x, 112, 4, 1, '#c8432a');
  }
  V.mid = mid;
  // near props on the sidewalk (x positions, drawn behind the band row)
  V.props = [];
  const pool = venue.kind === 'street' ? ['lamp', 'hydrant', 'trash', 'newsbox', 'planter', 'mailbox', 'tree', 'bench', 'sign', 'cone'] : venue.kind === 'park' ? ['bench', 'trash', 'lamp', 'planter'] : venue.kind === 'pier' ? ['lamp', 'trash', 'bench', 'sign'] : venue.kind === 'bridge' ? ['lamp', 'lamp', 'cone'] : ['trash', 'newsbox', 'sign', 'cone'];
  let px2 = 250; while (px2 < W + 40) { V.props.push({ kind: r.pick(pool), x: px2, v: r.int(0, 2) }); px2 += r.int(70, 120); }
  V.props.push({ kind: 'lamp', x: 40, v: 0 });
  return V;
}
function drawVenue(ctx, V, L, t, wind, venue) {
  const top = L.stageTop, bottom = L.stageBottom, groundY = L.groundY;
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
  // far sky+skyline, anchored to the facade line
  const midBottom = groundY - 14; // facades sit on the back of the sidewalk
  ctx.drawImage(V.far, 0, midBottom - 120 - 70 + (L.compact ? 60 : 0));
  const parallax = Math.round(Math.sin(t * 0.1) * 0); ctx.drawImage(V.mid, -20 + parallax, midBottom - V.midH);
  // sidewalk
  rect(ctx, 0, midBottom, W, groundY - midBottom + 12, venue.kind === 'park' ? '#b8a888' : venue.kind === 'pier' ? '#7a5a3a' : '#a8a49a'); rect(ctx, 0, midBottom, W, 2, venue.kind === 'pier' ? '#8a6a4a' : '#c8c4b8');
  if (venue.kind !== 'pier') for (let sx = 0; sx < W; sx += 26) rect(ctx, sx, midBottom + 2, 1, groundY - midBottom + 10, 'rgba(0,0,0,0.12)'); else for (let sx = 0; sx < W; sx += 10) rect(ctx, sx, midBottom, 1, groundY - midBottom + 12, '#5a3a1a');
  rect(ctx, 0, groundY + 10, W, 3, venue.kind === 'subway' ? '#ffe040' : '#6a6660');
  // street / tracks
  if (L.streetY) {
    if (venue.kind === 'subway') { rect(ctx, 0, L.streetY, W, L.streetH, '#1a1a20'); for (let x = 0; x < W; x += 14) rect(ctx, x, L.streetY + 12, 8, 3, '#4a3a2a'); rect(ctx, 0, L.streetY + 8, W, 2, '#8a8a90'); rect(ctx, 0, L.streetY + 18, W, 2, '#8a8a90'); }
    else if (venue.kind === 'pier' || venue.kind === 'bridge') { rect(ctx, 0, L.streetY, W, L.streetH, venue.kind === 'pier' ? '#3a6a9a' : '#4a4a8a'); for (let y = L.streetY + 3; y < L.streetY + L.streetH; y += 5) for (let x = (y * 7 + Math.floor(t * 10)) % 20; x < W; x += 20) rect(ctx, x, y, 8, 1, venue.kind === 'pier' ? '#5a8ab8' : '#6a6aa8'); }
    else if (venue.kind === 'park') { rect(ctx, 0, L.streetY, W, L.streetH, '#5aa050'); for (let i = 0; i < 30; i++) rect(ctx, (i * 53) % W, L.streetY + (i * 17) % L.streetH, 2, 1, '#7fb85a'); }
    else { rect(ctx, 0, L.streetY, W, L.streetH, '#3f3f48'); for (let sx = 0; sx < W; sx += 34) rect(ctx, sx, L.streetY + L.streetH / 2, 18, 2, '#d8c860'); for (let sx = 200; sx < 260; sx += 8) rect(ctx, sx, L.streetY, 4, L.streetH, 'rgba(255,255,255,0.5)'); }
  }
  // props behind band row
  for (const p of V.props) {
    if (p.kind === 'tree') { const c = treeCanvas('round', wind.frame(p.x)); ctx.drawImage(c, p.x - 20, midBottom - 52); continue; }
    const c = propCanvas(p.kind, p.v); ctx.drawImage(c, p.x, midBottom + 4 - c.height + (p.kind === 'lamp' ? 2 : 0));
    if (p.kind === 'lamp' && V.skyT > 0.55) { ctx.globalAlpha = 0.12; circle(ctx, p.x + 6, midBottom - 36, 34, '#ffe680'); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}
function drawBand(ctx, performers, active, stageX, groundY, t, onBeat, hatX, layer) {
  performers.forEach((m, i) => {
    const x = stageX - (performers.length - 1) * 17 + i * 34, isAct = m === active;
    if (m.instrument === 'drums') { if (layer === 0) { ctx.drawImage(propInstrument('drums'), x - 20, groundY - 36); drawBugAt(ctx, m.spec, x, groundY - 12, { pose: onBeat ? 'play' : 'idle' }); } return; }
    if (m.instrument === 'piano') { if (layer === 0) { drawBugAt(ctx, m.spec, x, groundY - 4, { pose: onBeat ? 'play' : 'idle' }); ctx.drawImage(propInstrument('piano'), x - 20, groundY - 24); } return; }
    if (layer === 1) { drawShadow(ctx, x, groundY, 20, 0.25); drawBugAt(ctx, m.spec, x, groundY + (isAct && onBeat ? -2 : 0), { pose: isAct ? (onBeat ? 'play' : 'idle') : (Math.floor(t * 4 + i) % 3 ? 'play' : 'idle'), instrument: m.instrument }); if (isAct) drawText(ctx, '▼', x, groundY - 52 + Math.round(Math.sin(t * 8)), '#ffe14d', { align: 'center', outline: '#1a1410' }); }
  });
  if (layer === 0) { ctx.drawImage(propCanvas('amp'), stageX - performers.length * 17 - 34, groundY - 14); }
  if (layer === 1) ctx.drawImage(propCanvas('hat'), hatX - 7, groundY - 6);
}

