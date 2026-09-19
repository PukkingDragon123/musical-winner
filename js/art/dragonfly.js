// ---------- Dragon Fly ----------
// The airline. Navy, gold and a dragonfly with its wings out, stamped on
// everything it owns: the tail, the boarding pass, the seat-back, the napkin,
// the cup, the sick bag, the safety card and the app icon.
'use strict';
const DF = {
  navy: '#12203f', navyHi: '#1d3563', gold: '#e0b23c', goldHi: '#ffd97a', goldLo: '#8a6a1a',
  cream: '#f4f1e6', red: '#c8402c', sky: '#8fc0e4',
  name: 'DRAGON FLY', code: 'DF', tag: 'THE LONG WAY ROUND',
};
DF.navyLo = '#08122a';
// The mark: a dragonfly seen from above, wings spread, inside a roundel.
function dfMark(size, opts = {}) {
  const S = Math.max(12, Math.round(size));
  return cached('dfmark|' + S + '|' + (opts.flat ? 1 : 0) + '|' + (opts.mono || ''), () => {
    const c = makeCanvas(S, S), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    const g = opts.mono || DF.gold, bg = opts.flat ? null : DF.navy;
    const cx = S / 2, cy = S / 2, R = S / 2 - 1;
    if (bg) { circle(x, cx, cy, R, bg); ringPx(x, cx, cy, R, DF.goldLo); ringPx(x, cx, cy, R - 2, g); }
    // the body
    const bl = R * 1.12;
    rect(x, cx - Math.max(1, S / 22), cy - bl * 0.42, Math.max(2, S / 11), bl * 0.86, g);
    // the head and the two big eyes
    circle(x, cx, cy - bl * 0.44, Math.max(1.5, S / 13), g);
    if (S >= 22) { circle(x, cx - S / 13, cy - bl * 0.48, Math.max(1, S / 22), DF.navy); circle(x, cx + S / 13, cy - bl * 0.48, Math.max(1, S / 22), DF.navy); }
    // four wings, swept back, the long pair over the short pair
    const wing = (dir, up, len, wid) => {
      x.fillStyle = g; x.beginPath();
      x.moveTo(cx + dir * S / 24, cy + up);
      x.quadraticCurveTo(cx + dir * len * 0.6, cy + up - wid, cx + dir * len, cy + up - wid * 0.25);
      x.quadraticCurveTo(cx + dir * len * 0.55, cy + up + wid * 0.35, cx + dir * S / 24, cy + up + wid * 0.28);
      x.fill();
    };
    for (const d of [-1, 1]) { wing(d, -R * 0.2, R * 0.96, R * 0.34); wing(d, R * 0.12, R * 0.74, R * 0.26); }
    // the tail segments
    if (S >= 20) for (let i = 0; i < 3; i++) { x.globalAlpha = 0.5; rect(x, cx - S / 20, cy + bl * 0.12 + i * (S / 12), S / 10, 1, DF.navy); x.globalAlpha = 1; }
    return c;
  });
}
// The wordmark, for the tail and the top of a boarding pass.
function dfWordmark(ctx, x, y, scale = 3, opts = {}) {
  const m = dfMark(scale * 9);
  ctx.drawImage(m, Math.round(x), Math.round(y - scale * 1.5), m.width, m.height);
  const tx = x + scale * 10;
  drawText(ctx, 'DRAGON', tx, y, opts.col || DF.cream, { scale });
  drawText(ctx, 'FLY', tx + textWidth('DRAGON ', { scale }), y, opts.accent || DF.gold, { scale });
  if (opts.tag) drawText(ctx, DF.tag, tx, y + scale * 8, withAlpha(opts.col || DF.cream, 0.6), { font: 'small' });
  return tx + textWidth('DRAGON FLY', { scale });
}
// The corner stamp that sits on every screen of the trip.
function dfStamp(ctx, x, y, s = 20, label) {
  const m = dfMark(s);
  ctx.globalAlpha = 0.9; ctx.drawImage(m, Math.round(x), Math.round(y)); ctx.globalAlpha = 1;
  if (label) drawText(ctx, label, x + s + 5, y + Math.round(s / 2) - 3, withAlpha(DF.cream, 0.75), { font: 'small' });
}
// A boarding pass, which is also the ticket the game gives you.
function dfBoardingPass(ctx, x, y, w, h, d, t) {
  rect(ctx, x + 4, y + 5, w, h, 'rgba(6,4,12,0.5)');
  rect(ctx, x, y, w, h, DF.cream);
  rect(ctx, x, y, w, 26, DF.navy);
  frame(ctx, x, y, w, h, DF.navyLo);
  dfWordmark(ctx, x + 8, y + 9, 2);
  drawText(ctx, 'BOARDING PASS', x + w - 8, y + 10, DF.gold, { align: 'right', scale: 2 });
  // the stub, torn off down a perforation
  const stub = Math.round(w * 0.28);
  for (let i = 4; i < h - 4; i += 7) rect(ctx, x + w - stub, y + i, 1, 4, '#b9b2a0');
  const field = (lx, ly, k, v, sc) => { drawText(ctx, k, lx, ly, '#8a8478', { font: 'small' }); drawText(ctx, v, lx, ly + 8, DF.navy, { scale: sc || 2 }); };
  field(x + 10, y + 34, 'PASSENGER', d.name || 'BUSKER / B');
  field(x + 10, y + 62, 'FROM', d.from || 'LAS VEGAS  LAS', 2);
  field(x + Math.round(w * 0.42), y + 62, 'TO', d.to || 'TOKYO NARITA  NRT', 2);
  field(x + 10, y + 90, 'FLIGHT', d.flight || 'DF 0808');
  field(x + Math.round(w * 0.28), y + 90, 'SEAT', d.seat || '31A');
  field(x + Math.round(w * 0.48), y + 90, 'GATE', d.gate || 'C12');
  // the barcode nobody can read, which is the point
  const bx = x + w - stub + 8;
  const r = makeRng(hashStr((d.flight || 'DF0808') + (d.seat || '31A')));
  for (let i = 0; i < stub - 18; i++) { if (r.chance(0.55)) rect(ctx, bx + i, y + 34, 1, h - 48, DF.navy); }
  drawText(ctx, d.seat || '31A', x + w - stub / 2 - 4, y + h - 13, DF.navy, { align: 'center', scale: 2 });
}
// The tail fin livery, for when you see the aircraft.
function dfTail(ctx, x, yBase, w, h) {
  ctx.fillStyle = DF.navy; ctx.beginPath();
  ctx.moveTo(x, yBase); ctx.lineTo(x + w * 0.55, yBase - h); ctx.lineTo(x + w, yBase - h); ctx.lineTo(x + w, yBase); ctx.fill();
  ctx.fillStyle = DF.navyHi; ctx.beginPath();
  ctx.moveTo(x + w * 0.2, yBase); ctx.lineTo(x + w * 0.62, yBase - h * 0.82); ctx.lineTo(x + w, yBase - h * 0.82); ctx.lineTo(x + w, yBase); ctx.fill();
  const m = dfMark(Math.round(h * 0.46), { flat: true });
  ctx.drawImage(m, Math.round(x + w * 0.52), Math.round(yBase - h * 0.7));
  rect(ctx, x, yBase - 6, w, 6, DF.gold);
}
