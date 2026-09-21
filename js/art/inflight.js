// ---------- The in-flight movie ----------
// Not a loop of atmosphere: an actual short film, cut into shots, with a
// story, subtitles, a score and an end card. It is ninety seconds long and
// it is about a bug who leaves somewhere and comes back different, because
// at thirty-six thousand feet that is the only film anybody can watch.
'use strict';

const FILM_LEN = 92;
// every shot: when it starts, how long it holds, what it looks like, what is said
const FILM_SHOTS = [
  { at: 0, dur: 7, id: 'title', sub: null },
  { at: 7, dur: 8, id: 'room', sub: 'MUM, I AM NOT COMING BACK FOR IT.' },
  { at: 15, dur: 7, id: 'room2', sub: 'IT IS A SUITCASE. IT IS NOT A DECISION.' },
  { at: 22, dur: 9, id: 'road', sub: '[ A BUS. SIX HOURS. ONE STOP. ]' },
  { at: 31, dur: 9, id: 'city', sub: 'IT IS BIGGER THAN THE PHOTOGRAPHS.' },
  { at: 40, dur: 8, id: 'street', sub: 'NOBODY LOOKED UP. NOT ONE OF THEM.' },
  { at: 48, dur: 10, id: 'stage', sub: 'AND THEN, ON THE THURSDAY, ELEVEN PEOPLE.' },
  { at: 58, dur: 8, id: 'stage2', sub: 'ELEVEN IS NOT NOTHING. ELEVEN IS ELEVEN.' },
  { at: 66, dur: 8, id: 'train', sub: 'I AM NOT HOMESICK. I AM JUST TIRED.' },
  { at: 74, dur: 7, id: 'call', sub: 'NO. I AM STAYING.' },
  { at: 81, dur: 6, id: 'return', sub: null },
  { at: 87, dur: 5, id: 'end', sub: null },
];
function filmShotAt(time) {
  const t = ((time % FILM_LEN) + FILM_LEN) % FILM_LEN;
  for (let i = FILM_SHOTS.length - 1; i >= 0; i--) if (t >= FILM_SHOTS[i].at) return { s: FILM_SHOTS[i], k: (t - FILM_SHOTS[i].at) / FILM_SHOTS[i].dur, t: t };
  return { s: FILM_SHOTS[0], k: 0, t: t };
}
// a little bug silhouette, since the film is not about anybody we have met
function filmBug(ctx, x, y, s, col, pose, t) {
  const bob = pose === 'walk' ? Math.abs(Math.sin(t * 7)) * 2 : Math.sin(t * 2) * 1;
  ellipsePx(ctx, x, y - 9 * s - bob, 7 * s, 9 * s, col);
  ellipsePx(ctx, x, y - 19 * s - bob, 5.5 * s, 5 * s, col);
  rect(ctx, x - 4 * s, y - 25 * s - bob, 2, 5 * s, col);
  rect(ctx, x + 2 * s, y - 25 * s - bob, 2, 5 * s, col);
  rect(ctx, x - 6 * s, y - 3 * s, 3 * s, 3 * s, col);
  rect(ctx, x + 3 * s, y - 3 * s, 3 * s, 3 * s, col);
  if (pose === 'play') {
    rect(ctx, x - 2 * s, y - 14 * s - bob, 13 * s, 4 * s, darken(col, 0.3));
    rect(ctx, x + 9 * s, y - 17 * s - bob, 5 * s, 8 * s, darken(col, 0.3));
  }
  if (pose === 'case') { rect(ctx, x + 7 * s, y - 12 * s, 6 * s, 9 * s, darken(col, 0.25)); rect(ctx, x + 9 * s, y - 14 * s, 2, 3 * s, col); }
}
// ---------- the shots ----------
function drawFilmShot(ctx, r, id, k, t, tt) {
  const X = r.x, Y = r.y, Wv = r.w, Hv = r.h, cx = X + Wv / 2, cy = Y + Hv / 2;
  const clip = function (fn) { ctx.save(); ctx.beginPath(); ctx.rect(X, Y, Wv, Hv); ctx.clip(); fn(); ctx.restore(); };
  switch (id) {
    case 'title': {
      clip(function () {
        vgrad(ctx, X, Y, Wv, Hv, '#08060f', '#241a3a');
        const rr = makeRng(5);
        for (let i = 0; i < 90; i++) { const sx = X + rr.int(0, Wv), sy = Y + rr.int(0, Hv); ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(tt * 1.3 + i)); px(ctx, sx, sy, '#f4f1ea'); ctx.globalAlpha = 1; }
        // a horizon coming up, slowly, the way dawn does
        const hy = Y + Hv * (0.9 - k * 0.12);
        vgrad(ctx, X, hy - 30, Wv, 30, 'rgba(0,0,0,0)', '#c8703a');
        rect(ctx, X, hy, Wv, Hv, '#120c18');
        ctx.globalAlpha = clamp(k * 3, 0, 1);
        drawText(ctx, 'THE LONG WAY', cx, cy - 22, '#f4f1ea', { align: 'center', scale: 4, outline: '#12101c' });
        drawText(ctx, 'ROUND', cx, cy + 12, DF.gold, { align: 'center', scale: 4, outline: '#12101c' });
        ctx.globalAlpha = clamp(k * 2 - 0.6, 0, 1);
        drawText(ctx, 'A DRAGON FLY PRESENTATION', cx, cy + 46, '#8a82a8', { align: 'center', font: 'small' });
        ctx.globalAlpha = 1;
      });
      break;
    }
    case 'room': case 'room2': case 'return': {
      const dawn = id === 'return';
      clip(function () {
        rect(ctx, X, Y, Wv, Hv, dawn ? '#3a3448' : '#141020');
        // the window, and the light a passing car throws across the wall
        const wx = X + Wv * 0.62, wy = Y + Hv * 0.14, ww = Wv * 0.3, wh = Hv * 0.44;
        rect(ctx, wx, wy, ww, wh, dawn ? '#e8b878' : '#1a2440');
        if (dawn) { ctx.globalAlpha = 0.5; ellipsePx(ctx, wx + ww * 0.5, wy + wh * 0.8, ww * 0.3, wh * 0.2, '#fff2c0'); ctx.globalAlpha = 1; }
        rect(ctx, wx - 3, wy - 3, ww + 6, 4, '#5a5068');
        rect(ctx, wx + ww / 2 - 2, wy, 4, wh, '#5a5068');
        rect(ctx, wx, wy + wh / 2 - 2, ww, 4, '#5a5068');
        if (!dawn) {
          const sweep = ((tt * 0.35) % 1);
          ctx.globalAlpha = 0.16 * Math.sin(sweep * Math.PI);
          ctx.fillStyle = '#ffe9a8';
          ctx.beginPath(); ctx.moveTo(X + Wv * sweep - 40, Y + Hv); ctx.lineTo(X + Wv * sweep + 10, Y + Hv); ctx.lineTo(X + Wv * sweep + 80, wy); ctx.lineTo(X + Wv * sweep + 30, wy); ctx.fill();
          ctx.globalAlpha = 1;
        }
        // the poster, blank at the start and signed at the end
        rect(ctx, X + Wv * 0.1, Y + Hv * 0.18, Wv * 0.16, Hv * 0.34, '#2a2440');
        rect(ctx, X + Wv * 0.11, Y + Hv * 0.2, Wv * 0.14, Hv * 0.2, dawn ? '#c8402c' : '#3a3450');
        if (dawn) { for (let i = 0; i < 4; i++) rect(ctx, X + Wv * 0.12 + i * 6, Y + Hv * 0.44, 5, 2, DF.gold); }
        // the bed, the case, and whoever is sitting on the edge of it
        rect(ctx, X, Y + Hv * 0.66, Wv * 0.66, Hv * 0.34, '#241e34');
        rect(ctx, X, Y + Hv * 0.66, Wv * 0.66, 5, '#3a3450');
        const bx = X + Wv * 0.3, by = Y + Hv * 0.66;
        if (id === 'room') filmBug(ctx, bx, by, Hv / 120, '#0c0a14', 'sit', tt);
        else if (id === 'room2') { filmBug(ctx, bx - Wv * 0.06, by, Hv / 120, '#0c0a14', 'case', tt); }
        else { rect(ctx, bx - 16, by - 14, 32, 14, '#1b1628'); rect(ctx, bx - 16, by - 14, 32, 3, '#2f2740'); }
        // the case, open on the floor, empty either way
        const sx2 = X + Wv * 0.52;
        rect(ctx, sx2, Y + Hv * 0.82, 44, 26, '#2f4a8a');
        rect(ctx, sx2, Y + Hv * 0.82, 44, 3, '#4a6fb0');
        if (dawn) { rect(ctx, sx2 + 4, Y + Hv * 0.82 - 22, 36, 22, '#24386a'); }
      });
      break;
    }
    case 'road': {
      clip(function () {
        vgrad(ctx, X, Y, Wv, Hv * 0.6, '#3a2a4a', '#e8a86a');
        rect(ctx, X, Y + Hv * 0.6, Wv, Hv * 0.4, '#241d2a');
        // the road, rushing
        for (let i = 0; i < 9; i++) { const dx = (X + (i * 90 - tt * 320) % (Wv + 90)); ctx.globalAlpha = 0.85; rect(ctx, dx, Y + Hv * 0.82, 44, 4, '#c8c2a4'); ctx.globalAlpha = 1; }
        rect(ctx, X, Y + Hv * 0.6, Wv, 3, '#4a3a4a');
        // telegraph poles ticking past, which is what six hours looks like
        for (let i = 0; i < 6; i++) {
          const px0 = X + ((i * 150 - tt * 260) % (Wv + 150));
          rect(ctx, px0, Y + Hv * 0.28, 4, Hv * 0.34, '#1b1622');
          rect(ctx, px0 - 12, Y + Hv * 0.3, 28, 3, '#1b1622');
        }
        // distant hills, barely moving at all
        for (let i = 0; i < 5; i++) {
          const hx = X + ((i * 210 - tt * 26) % (Wv + 210));
          ctx.fillStyle = '#4a3550'; ctx.beginPath();
          ctx.moveTo(hx - 80, Y + Hv * 0.6); ctx.lineTo(hx, Y + Hv * 0.44); ctx.lineTo(hx + 80, Y + Hv * 0.6); ctx.fill();
        }
        // the bus, dead centre, going nowhere in frame
        const by = Y + Hv * 0.78;
        rect(ctx, cx - 74, by - 46, 150, 42, '#c8c2b4');
        rect(ctx, cx - 74, by - 46, 150, 5, '#e8e2d4');
        rect(ctx, cx - 74, by - 18, 150, 6, '#8a6a44');
        for (let i = 0; i < 6; i++) rect(ctx, cx - 66 + i * 24, by - 40, 18, 14, '#2a3a5a');
        ctx.globalAlpha = 0.9; rect(ctx, cx - 42, by - 40, 18, 14, '#3a4f7a'); ctx.globalAlpha = 1;
        filmBug(ctx, cx - 33, by - 26, 0.42, '#0c0a14', 'sit', tt);
        circle(ctx, cx - 50, by - 2, 9, '#12101c'); circle(ctx, cx + 46, by - 2, 9, '#12101c');
        circle(ctx, cx - 50, by - 2, 4, '#3a3448'); circle(ctx, cx + 46, by - 2, 4, '#3a3448');
      });
      break;
    }
    case 'city': {
      clip(function () {
        // a crane up: the skyline rises into frame and the lights come on
        const rise = easeInOut(clamp(k, 0, 1));
        vgrad(ctx, X, Y, Wv, Hv, '#120e22', '#3a2450');
        const base = Y + Hv * (1.25 - rise * 0.5);
        const rr = makeRng(41);
        for (let layer = 0; layer < 3; layer++) {
          const col = ['#150f22', '#1d1630', '#261d3e'][layer];
          for (let i = 0; i < 16; i++) {
            const bw = rr.int(22, 52), bh = rr.int(40, 190) * (1 + layer * 0.25);
            const bx = X + rr.int(-20, Wv), by = base - layer * 10;
            rect(ctx, bx, by - bh, bw, bh, col);
            if (layer === 2) for (let wy2 = by - bh + 8; wy2 < by - 8; wy2 += 11) for (let wx2 = bx + 4; wx2 < bx + bw - 6; wx2 += 9) {
              if (((wx2 * 7 + wy2 * 13) % 11) < 4 * (0.3 + rise)) rect(ctx, wx2, wy2, 4, 5, '#ffd88a');
            }
          }
        }
        // the aeroplane crossing it, because the film knows where you are
        const ax = X + ((tt * 34) % (Wv + 80)) - 40;
        rect(ctx, ax, Y + Hv * 0.16, 12, 3, '#0c0a14');
        if (Math.floor(tt * 3) % 2) px(ctx, ax + 12, Y + Hv * 0.16, '#ff6a5a');
        ctx.globalAlpha = 0.2 * rise; rect(ctx, X, Y, Wv, Hv, '#ffb060'); ctx.globalAlpha = 1;
      });
      break;
    }
    case 'street': {
      clip(function () {
        rect(ctx, X, Y, Wv, Hv, '#141020');
        // a wall of people going the other way, in three depths
        for (let d = 0; d < 3; d++) {
          const sc = 0.5 + d * 0.28, y2 = Y + Hv * (0.62 + d * 0.14);
          ctx.globalAlpha = 0.4 + d * 0.3;
          for (let i = 0; i < 14; i++) {
            const px0 = X + ((i * 62 + tt * (30 + d * 40) + d * 31) % (Wv + 80)) - 40;
            filmBug(ctx, px0, y2, sc, d === 2 ? '#0a0810' : '#171226', 'walk', tt + i);
          }
          ctx.globalAlpha = 1;
        }
        // and one standing still in the middle of it, playing
        filmBug(ctx, cx, Y + Hv * 0.8, 1.05, '#2a2340', 'play', tt);
        ctx.globalAlpha = 0.13; ellipsePx(ctx, cx, Y + Hv * 0.5, Wv * 0.2, Hv * 0.34, '#ffd24a'); ctx.globalAlpha = 1;
        // rain, because of course
        for (let i = 0; i < 40; i++) { const rx = (i * 47 + tt * 420) % Wv; ctx.globalAlpha = 0.3; rect(ctx, X + rx, Y + ((i * 83 + tt * 620) % Hv), 1, 9, '#8ad8ff'); ctx.globalAlpha = 1; }
      });
      break;
    }
    case 'stage': case 'stage2': {
      const wide = id === 'stage';
      clip(function () {
        rect(ctx, X, Y, Wv, Hv, '#08060f');
        // the room: a low stage, one lamp, and eleven heads
        const sy = Y + Hv * 0.74;
        rect(ctx, X, sy, Wv, Hv * 0.26, '#161020');
        rect(ctx, X, sy, Wv, 4, '#2a2038');
        // the beam, snapping on at the top of the shot
        const on = clamp(k * 6, 0, 1);
        ctx.globalAlpha = 0.18 * on;
        ctx.fillStyle = '#ffd24a'; ctx.beginPath();
        ctx.moveTo(cx - 14, Y); ctx.lineTo(cx + 14, Y); ctx.lineTo(cx + 88, sy); ctx.lineTo(cx - 88, sy); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.3 * on; ellipsePx(ctx, cx, sy, 86, 16, '#ffd24a'); ctx.globalAlpha = 1;
        filmBug(ctx, cx, sy, wide ? 1.0 : 1.7, '#2a2038', 'play', tt);
        // eleven of them, and you can count them, which is the joke
        for (let i = 0; i < 11; i++) {
          const hx = X + Wv * 0.12 + i * (Wv * 0.078), hy = Y + Hv * (0.9 + Math.sin(tt * 2 + i) * 0.012);
          ellipsePx(ctx, hx, hy, 11, 13, '#0a0810');
          ellipsePx(ctx, hx, hy - 11, 8, 7, '#0a0810');
          if (i % 3 === 0) { rect(ctx, hx - 1, hy - 26, 2, 8, '#0a0810'); }
        }
        if (!wide) { // the close-up: a hand, a string, and the dust in the beam
          ctx.globalAlpha = 0.24;
          const rr = makeRng(3);
          for (let i = 0; i < 40; i++) { const dx = cx + rr.range(-70, 70), dy = Y + Hv * rr.range(0.1, 0.72) - ((tt * 10 + i * 7) % 40); px(ctx, dx, dy, '#fff2c0'); }
          ctx.globalAlpha = 1;
        }
      });
      break;
    }
    case 'train': {
      clip(function () {
        rect(ctx, X, Y, Wv, Hv, '#0e1018');
        // the window, with a night going past at speed
        const wx = X + Wv * 0.08, wy = Y + Hv * 0.12, ww = Wv * 0.84, wh = Hv * 0.6;
        rect(ctx, wx, wy, ww, wh, '#0a0e18');
        ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
        for (let i = 0; i < 26; i++) {
          const bx = wx + ((i * 57 - tt * 460) % (ww + 60));
          const bh = 14 + (i * 23) % 60;
          rect(ctx, bx, wy + wh - bh, 16, bh, '#151b28');
          if (i % 2) rect(ctx, bx + 3, wy + wh - bh + 4, 4, 5, '#ffd88a');
        }
        for (let i = 0; i < 18; i++) { const lx = wx + ((i * 96 - tt * 620) % (ww + 96)); ctx.globalAlpha = 0.6; rect(ctx, lx, wy + wh * 0.3, 2, 16, '#f0c88a'); ctx.globalAlpha = 1; }
        ctx.restore();
        // your own face in the glass, which is the shot
        ctx.globalAlpha = 0.3;
        filmBug(ctx, wx + ww * 0.3, wy + wh * 0.94, 1.5, '#8aa8d8', 'sit', tt);
        ctx.globalAlpha = 1;
        rect(ctx, wx - 4, wy - 4, ww + 8, 5, '#3a4250');
        rect(ctx, wx - 4, wy + wh, ww + 8, 6, '#3a4250');
        // the rail and the strap swinging with the carriage
        rect(ctx, X, Y + Hv * 0.06, Wv, 4, '#5a6472');
        const sw = Math.sin(tt * 1.6) * 5;
        rect(ctx, cx + 60 + sw, Y + Hv * 0.08, 3, 26, '#8a8478');
        rect(ctx, cx + 55 + sw, Y + Hv * 0.16, 13, 10, '#2a2d33');
      });
      break;
    }
    case 'call': {
      clip(function () {
        rect(ctx, X, Y, Wv, Hv, '#0a0810');
        // a close-up: a phone, a hand, and the light off the screen
        const px0 = cx - 26, py0 = cy - 40;
        ctx.globalAlpha = 0.2; ellipsePx(ctx, cx, cy - 10, 120, 90, '#8ad8ff'); ctx.globalAlpha = 1;
        rect(ctx, px0, py0, 52, 92, '#1b1b24');
        rect(ctx, px0 + 3, py0 + 5, 46, 80, '#2a4a7a');
        ctx.globalAlpha = 0.55 + 0.25 * Math.sin(tt * 3);
        rect(ctx, px0 + 3, py0 + 5, 46, 80, '#8ad8ff'); ctx.globalAlpha = 1;
        drawText(ctx, 'MUM', cx, py0 + 24, '#0a1a2a', { align: 'center', scale: 2 });
        drawText(ctx, pad2(Math.floor(tt) % 60) + ':' + pad2(Math.floor(tt * 3) % 60), cx, py0 + 46, '#0a1a2a', { align: 'center', font: 'small' });
        circle(ctx, cx, py0 + 70, 9, '#c8402c');
        // the hand round it
        rect(ctx, px0 - 10, py0 + 40, 12, 56, '#3a2f28');
        for (let i = 0; i < 4; i++) rect(ctx, px0 - 4, py0 + 44 + i * 12, 12, 8, '#4a3a30');
      });
      break;
    }
    case 'end': {
      clip(function () {
        rect(ctx, X, Y, Wv, Hv, '#05060a');
        const roll = k * Hv * 1.4;
        const lines = ['THE LONG WAY ROUND', '', 'WRITTEN AND DIRECTED BY', 'NOBODY YOU HAVE HEARD OF',
          '', 'MUSIC BY', 'A BUG WITH ONE GUITAR', '', 'FILMED ON LOCATION', 'SOMEWHERE IT RAINS',
          '', 'NO ANIMALS WERE CONSULTED', '', 'FOR MUM'];
        for (let i = 0; i < lines.length; i++) {
          const ly = Y + Hv + 10 + i * 15 - roll;
          if (ly < Y - 12 || ly > Y + Hv) continue;
          drawText(ctx, lines[i], cx, ly, i === 0 ? DF.gold : '#8a82a8', { align: 'center', scale: i === 0 ? 2 : 1 });
        }
      });
      break;
    }
  }
  // the grain and the gate weave that make it feel like a print
  ctx.globalAlpha = 0.05;
  const g = makeRng(Math.floor(tt * 24) % 97);
  for (let i = 0; i < 60; i++) px(ctx, X + g.int(0, Wv), Y + g.int(0, Hv), '#ffffff');
  ctx.globalAlpha = 1;
}
// The whole film, letterboxed into a rectangle, with subtitles.
function drawFilm(ctx, r, time, opts) {
  const o = opts || {};
  const S = filmShotAt(time);
  const bar = Math.round(r.h * 0.07);
  const inner = { x: r.x, y: r.y + bar, w: r.w, h: r.h - bar * 2 };
  rect(ctx, r.x, r.y, r.w, r.h, '#000000');
  drawFilmShot(ctx, inner, S.s.id, S.k, S.t, time);
  rect(ctx, r.x, r.y, r.w, bar, '#000000');
  rect(ctx, r.x, r.y + r.h - bar, r.w, bar, '#000000');
  // a cut is a hard black frame, not a fade, because film
  if (S.k < 0.035) { ctx.globalAlpha = 1 - S.k / 0.035; rect(ctx, r.x, r.y, r.w, r.h, '#000000'); ctx.globalAlpha = 1; }
  if (S.s.sub && o.subs !== false) {
    const sw = textWidth(S.s.sub, { scale: 2 }) + 16;
    ctx.globalAlpha = 0.72; rect(ctx, r.x + r.w / 2 - sw / 2, r.y + r.h - bar - 24, sw, 20, '#000000'); ctx.globalAlpha = 1;
    drawText(ctx, S.s.sub, r.x + r.w / 2, r.y + r.h - bar - 19, '#f4f1ea', { align: 'center', scale: 2, outline: '#0a0a0a' });
  }
  return S;
}
// A four-note cue per shot, so the film has a score instead of silence.
const FILM_CUES = { title: [60, 64, 67, 72], room: [57, 60, 64], room2: [55, 59, 62], road: [50, 57, 62, 64],
  city: [60, 67, 72, 76], street: [53, 56, 60], stage: [60, 64, 67, 71], stage2: [67, 71, 74],
  train: [55, 58, 62], call: [53, 55, 58], return: [60, 64, 67, 72], end: [48, 55, 60, 64] };
function filmCue(id) {
  if (!Audio.ctx || Audio.muted) return;
  const n = FILM_CUES[id] || [60, 64];
  const now = Audio.ctx.currentTime;
  for (let i = 0; i < n.length; i++) Audio.note('pad', n[i], now + i * 0.22, 1.6, 0.18);
}
