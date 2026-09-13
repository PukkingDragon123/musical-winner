// ---------- Record sleeves ----------
// Original cover art, one per tune, drawn in the *design language* of a period
// rather than copying anybody's actual sleeve: a hard-bop two-tone block, a
// prog gatefold landscape, a photocopied punk zine, a chrome metal sleeve, a
// black-metal forest, a folk porch photo, a psych poster, a plain classical
// box. Every one of them has a bug on it.
'use strict';

const SLEEVE_PX = 88;
// Band names built from bug vocabulary. Original, and daft on purpose.
const BAND_A = ['THE', 'DEAD', 'ROYAL', 'SIX', 'LATE', 'HOLY', 'YOUNG', 'ELECTRIC', 'SLOW', 'BITTER', 'GOLDEN', 'CRUDE'];
const BAND_B = ['MANDIBLE', 'CARAPACE', 'LARVA', 'THORAX', 'ANTENNA', 'MOLT', 'CHITIN', 'GRUB', 'HIVE', 'SPIRACLE', 'PUPA', 'WEEVIL', 'MOTH', 'BEETLE', 'APHID'];
const BAND_C = ['S', ' COLLECTIVE', ' ORCHESTRA', ' FIVE', ' QUARTET', ' UNION', ' SOCIETY', ' BROTHERS', '', '', ''];
const LABELS = ['BUZZ REC.', 'HIVE SOUND', 'NECTAR', 'SIX LEG', 'CHITIN LP', 'MOLT RECORDS', 'ANTHILL', 'GRUBWAX'];
function bandName(key) {
  const r = makeRng(hashStr('band' + key));
  const a = r.chance(0.45) ? r.pick(BAND_A) + ' ' : '';
  return (a + r.pick(BAND_B) + r.pick(BAND_C)).trim();
}
// Which design era a tune gets. Stable per tune, steered by its genre so a
// waltz does not end up looking like a thrash record unless the dice say so.
const STYLE_BY_GENRE = {
  rock: ['shred', 'bm', 'punk', 'prog'],
  jazz: ['bop', 'bop', 'soul'],
  funk: ['soul', 'disco', 'psych'],
  ballad: ['classical', 'folk', 'prog'],
  folk: ['folk', 'punk', 'psych'],
};
function sleeveStyle(key) {
  const t = TUNES[key];
  const pool = (t && STYLE_BY_GENRE[t.genre]) || ['classical'];
  return pool[hashStr('sty' + key) % pool.length];
}

// A bug drawn straight onto the sleeve, sized to it.
function sleeveBug(ctx, key, cx, feetY, scale, opts = {}) {
  const spec = cached('slvbug|' + key, () => randomBugSpec(makeRng(hashStr('cover' + key))));
  drawBugAt(ctx, spec, cx, feetY, Object.assign({ pose: 'play', expr: 'focus', scale, bounce: 0, rate: 0 }, opts));
}

function sleeveCanvas(key, size) {
  const S = size || SLEEVE_PX;
  return cached('sleeve|' + key + '|' + S, () => {
    const c = makeCanvas(S, S), ctx = c.getContext('2d');
    const t = TUNES[key] || { title: key, composer: '', genre: 'folk' };
    const r = makeRng(hashStr('slv' + key));
    const style = sleeveStyle(key);
    const band = bandName(key);
    const title = t.title.toUpperCase();
    const fit = (str, w) => { let s2 = str; while (textWidth(s2, { font: 'small' }) > w && s2.length > 3) s2 = s2.slice(0, -1); return s2; };
    // A long title gets two lines rather than being chopped mid-word, because
    // half a title on a sleeve just looks like a mistake.
    const wrap2 = (str, w) => {
      if (textWidth(str, { font: 'small' }) <= w) return [str];
      const words = str.split(' '); let a = '', b = '';
      for (const wd of words) {
        if (!a || textWidth(a + ' ' + wd, { font: 'small' }) <= w) a = a ? a + ' ' + wd : wd;
        else b = b ? b + ' ' + wd : wd;
      }
      return b ? [a, fit(b, w)] : [fit(a, w)];
    };
    // Draw a title where the last line sits on `y`, so it never runs off the
    // bottom edge of the sleeve however long it is.
    const title2 = (str, cx2, y, w, col, o = {}) => {
      const ls = wrap2(str, w), lh = 7;
      ls.forEach((l, i) => drawText(ctx, l, cx2, y - (ls.length - 1 - i) * lh, col, Object.assign({ align: 'center', font: 'small' }, o)));
      return ls.length;
    };

    switch (style) {
      // ---- hard bop: two flat colours, a tilted photo block, condensed type
      case 'bop': {
        const bg = r.pick(['#1d4f7a', '#7a3320', '#2c6a52', '#6a2a4a']);
        rect(ctx, 0, 0, S, S, bg);
        halftone(ctx, 0, 0, S, S, '#ffffff', 5, 0.1);
        // the photo, knocked back to two tones and set at an angle
        ctx.save(); ctx.translate(S * 0.56, S * 0.52); ctx.rotate(-0.06); ctx.translate(-S * 0.56, -S * 0.52);
        rect(ctx, S * 0.3, S * 0.2, S * 0.62, S * 0.6, '#e8e0cc');
        rect(ctx, S * 0.3, S * 0.2, S * 0.62, 2, '#fff8ea');
        ctx.save(); ctx.beginPath(); ctx.rect(S * 0.3, S * 0.2, S * 0.62, S * 0.6); ctx.clip();
        sleeveBug(ctx, key, S * 0.61, S * 0.79, S / 62, { expr: 'cool' });
        ctx.globalAlpha = 0.35; rect(ctx, S * 0.3, S * 0.2, S * 0.62, S * 0.6, bg); ctx.globalAlpha = 1;
        ctx.restore(); ctx.restore();
        rect(ctx, 0, S - 16, S, 4, '#e8b23a');
        drawText(ctx, fit(band, S - 10), 5, 6, '#f4ecd6', { font: 'small' });
        wrap2(title, S - 10).forEach((l, i) => drawText(ctx, l, 5, 13 + i * 7, '#e8b23a', { font: 'small' }));
        drawText(ctx, LABELS[hashStr(key) % LABELS.length], 5, S - 10, '#f4ecd6', { font: 'small' });
        break;
      }
      // ---- prog gatefold: an airbrushed sky, a lone shape, an arched title
      case 'prog': {
        for (let y = 0; y < S; y++) rect(ctx, 0, y, S, 1, mixColor('#f0a860', '#2a2060', y / S));
        const sun = S * 0.34;
        ellipsePx(ctx, S / 2, sun, S * 0.22, S * 0.22, '#ffd98a');
        ellipsePx(ctx, S / 2, sun, S * 0.18, S * 0.18, '#ffefc0');
        // a ridge of rock, and a very small bug looking at it
        ctx.fillStyle = '#3a2a4a'; ctx.beginPath(); ctx.moveTo(0, S * 0.78);
        for (let x = 0; x <= S; x += 6) ctx.lineTo(x, S * 0.78 - Math.sin(x * 0.11 + 1) * 8 - (x > S * 0.5 ? 6 : 0));
        ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.fill();
        sleeveBug(ctx, key, S * 0.3, S * 0.8, S / 110, { pose: 'idle' });
        for (let i = 0; i < 30; i++) px(ctx, r.int(0, S - 1), r.int(0, S * 0.5), '#fff8e0');
        drawText(ctx, fit(band, S - 8), S / 2, 6, '#f6e6c0', { align: 'center', font: 'small', outline: '#2a2060' });
        title2(title, S / 2, S - 12, S - 8, '#f6e6c0', { outline: '#2a2060' });
        break;
      }
      // ---- punk zine: a photocopy, a ransom-note title, a stapled corner
      case 'punk': {
        rect(ctx, 0, 0, S, S, '#e8e6de');
        for (let i = 0; i < 400; i++) px(ctx, r.int(0, S - 1), r.int(0, S - 1), r.chance(0.5) ? '#d2d0c8' : '#f4f2ea');
        ctx.save(); ctx.beginPath(); ctx.rect(4, 16, S - 8, S - 38); ctx.clip();
        rect(ctx, 4, 16, S - 8, S - 38, '#f8f6ee');
        sleeveBug(ctx, key, S / 2, S - 24, S / 58, { expr: 'angry', pose: 'cheer' });
        // blown-out photocopy: knock it to black and white with a halftone
        ctx.globalCompositeOperation = 'saturation'; rect(ctx, 4, 16, S - 8, S - 38, '#808080');
        ctx.globalCompositeOperation = 'source-over';
        halftone(ctx, 4, 16, S - 8, S - 38, '#000000', 3, 0.3);
        ctx.restore();
        frame(ctx, 4, 16, S - 8, S - 38, '#151515');
        // ransom note: every letter on its own scrap
        let lx = 4;
        for (const ch of fit(title, S - 8)) {
          const cw = textWidth(ch, { font: 'small' }) + 3, ch2 = r.int(-1, 1);
          rect(ctx, lx, 3 + ch2, cw, 9, r.chance(0.5) ? '#151515' : '#e8442e');
          drawText(ctx, ch, lx + 1, 5 + ch2, r.chance(0.5) ? '#f8f6ee' : '#ffe14d', { font: 'small' });
          lx += cw;
          if (lx > S - 8) break;
        }
        drawText(ctx, fit(band, S - 8), 5, S - 9, '#151515', { font: 'small' });
        for (const [sx, sy] of [[S - 10, 5], [S - 10, S - 9]]) { rect(ctx, sx, sy, 5, 2, '#9aa0a8'); rect(ctx, sx, sy + 2, 5, 1, '#6a7078'); }
        break;
      }
      // ---- eighties metal: chrome type, lightning, a guitar held overhead
      case 'shred': {
        for (let y = 0; y < S; y++) rect(ctx, 0, y, S, 1, mixColor('#1a1030', '#5a1040', y / S));
        for (let i = 0; i < 4; i++) {
          let x = r.int(8, S - 8), y = 0;
          while (y < S * 0.7) { const nx = x + r.int(-5, 5), ny = y + r.int(5, 11); line(ctx, x, y, nx, ny, '#9ad8ff'); line(ctx, x + 1, y, nx + 1, ny, '#e8f6ff'); x = nx; y = ny; }
        }
        sleeveBug(ctx, key, S / 2, S - 16, S / 56, { pose: 'cheer', expr: 'happy' });
        ctx.globalAlpha = 0.25; rect(ctx, 0, 0, S, S, '#ff40a0'); ctx.globalAlpha = 1;
        drawText(ctx, fit(band, S - 6), S / 2, 8, '#e8ecf4', { align: 'center', font: 'small', outline: '#7a1060', shadow: '#3a0830' });
        rect(ctx, 0, S - 21, S, 17, 'rgba(10,6,20,0.84)');
        title2(title, S / 2, S - 12, S - 6, '#ffd24a');
        break;
      }
      // ---- black metal: a wall of trees, an unreadable logo, one pale figure
      case 'bm': {
        rect(ctx, 0, 0, S, S, '#0a0b0c');
        for (let i = 0; i < 34; i++) {
          const x = r.int(0, S - 1), h = r.int(S * 0.4, S * 0.9), w = r.int(1, 3);
          rect(ctx, x, S - h, w, h, r.chance(0.4) ? '#1a1e1c' : '#121514');
          for (let b = 0; b < 4; b++) line(ctx, x, S - h + b * 8 + 6, x + r.int(-7, 7), S - h + b * 8, '#161a18');
        }
        rect(ctx, 0, S - 8, S, 8, '#0e1010');
        ctx.globalAlpha = 0.5; sleeveBug(ctx, key, S * 0.5, S - 10, S / 78, { pose: 'sad', expr: 'sad' }); ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.6; rect(ctx, 0, 0, S, S, '#0a1418'); ctx.globalAlpha = 1;
        // the logo: spidery, symmetrical, barely legible, exactly as intended
        const ly = 12;
        drawText(ctx, fit(band, S - 10), S / 2, ly, '#cfd8d4', { align: 'center', font: 'small' });
        const bw = textWidth(fit(band, S - 10), { font: 'small' });
        for (const d of [-1, 1]) {
          const ex = S / 2 + d * (bw / 2 + 2);
          for (let i = 0; i < 5; i++) { line(ctx, ex, ly + 2, ex + d * (3 + i * 2), ly - 4 - i * 2, '#cfd8d4'); }
          line(ctx, ex, ly + 2, ex + d * 8, ly + 8, '#cfd8d4');
        }
        title2(title, S / 2, S - 7, S - 6, '#7a8a84');
        break;
      }
      // ---- folk: a warm washed photo of somebody sitting on a step
      case 'folk': {
        for (let y = 0; y < S; y++) rect(ctx, 0, y, S, 1, mixColor('#d8b478', '#8a6a44', y / S));
        rect(ctx, 0, S * 0.66, S, S * 0.34, '#7a5c3c');
        for (let i = 0; i < 3; i++) rect(ctx, 0, S * 0.66 + i * 8, S, 2, '#6a4e32');
        sleeveBug(ctx, key, S * 0.5, S * 0.78, S / 58, { pose: 'idle', expr: 'calm' });
        ctx.globalAlpha = 0.18; rect(ctx, 0, 0, S, S, '#e8c078'); ctx.globalAlpha = 1;
        for (let i = 0; i < 80; i++) px(ctx, r.int(0, S - 1), r.int(0, S - 1), r.chance(0.5) ? '#f0dcb8' : '#6a5238');
        rect(ctx, 0, 0, S, 1, '#f4e4c0'); frame(ctx, 0, 0, S, S, '#6a5238');
        // handwritten-looking title, on a slant
        rect(ctx, 2, S - 26, S - 4, 24, 'rgba(240,228,196,0.86)');
        ctx.save(); ctx.translate(6, S - 22); ctx.rotate(-0.04);
        wrap2(title, S - 14).forEach((l, i) => drawText(ctx, l, 0, i * 7, '#3a2a1a', { font: 'small' }));
        drawText(ctx, fit(band, S - 14), 0, 15, '#7a5e40', { font: 'small' });
        ctx.restore();
        break;
      }
      // ---- disco: a mirrorball sunburst and a lot of gloss
      case 'disco': {
        rect(ctx, 0, 0, S, S, '#2a1040');
        for (let i = 0; i < 24; i++) {
          const a = (i / 24) * Math.PI * 2;
          ctx.fillStyle = i % 2 ? '#e8409a' : '#f0a020'; ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.moveTo(S / 2, S / 2);
          ctx.lineTo(S / 2 + Math.cos(a) * S, S / 2 + Math.sin(a) * S);
          ctx.lineTo(S / 2 + Math.cos(a + 0.13) * S, S / 2 + Math.sin(a + 0.13) * S); ctx.fill();
          ctx.globalAlpha = 1;
        }
        ellipsePx(ctx, S / 2, S * 0.42, S * 0.24, S * 0.24, '#b8c8e0');
        for (let y = -12; y <= 12; y += 3) for (let x = -12; x <= 12; x += 3) {
          if (x * x + y * y > 132) continue;
          px(ctx, S / 2 + x, S * 0.42 + y, (x + y) % 6 === 0 ? '#ffffff' : (x * y) % 4 === 0 ? '#8aa0c0' : '#dfe8f4');
        }
        sleeveBug(ctx, key, S / 2, S - 14, S / 66, { pose: 'cheer', expr: 'happy' });
        drawText(ctx, fit(band, S - 6), S / 2, S - 12, '#ffe14d', { align: 'center', font: 'small', outline: '#7a1050' });
        wrap2(title, S - 6).forEach((l, i) => drawText(ctx, l, S / 2, 5 + i * 7, '#ffffff', { align: 'center', font: 'small', outline: '#7a1050' }));
        break;
      }
      // ---- psychedelic poster: melting rings and type you have to work at
      case 'psych': {
        const c1 = r.pick(['#e84a2a', '#f0a020', '#5a30c0']), c2 = r.pick(['#20b0a0', '#e8e040', '#e8409a']);
        rect(ctx, 0, 0, S, S, c1);
        for (let rr = S; rr > 0; rr -= 7) { ellipsePx(ctx, S / 2 + Math.sin(rr * 0.3) * 4, S / 2, rr / 2, rr / 2.2, (rr / 7) % 2 ? c2 : c1); }
        ctx.globalAlpha = 0.9; sleeveBug(ctx, key, S / 2, S * 0.76, S / 62, { pose: 'play', expr: 'happy' }); ctx.globalAlpha = 1;
        for (let i = 0; i < 5; i++) { const y = S * 0.06 + i; rect(ctx, 0, y, S, 1, i % 2 ? c2 : c1); }
        drawText(ctx, fit(band, S - 6), S / 2, 6, '#2a1030', { align: 'center', font: 'small', outline: '#f6e8a0' });
        title2(title, S / 2, S - 10, S - 6, '#2a1030', { outline: '#f6e8a0' });
        break;
      }
      // ---- soul: a portrait in a soft vignette over one hot colour
      case 'soul': {
        const bg = r.pick(['#c8402a', '#2a5aa8', '#d88a20', '#7a2a6a']);
        rect(ctx, 0, 0, S, S, bg);
        ellipsePx(ctx, S / 2, S * 0.46, S * 0.36, S * 0.36, darken(bg, 0.25));
        ellipsePx(ctx, S / 2, S * 0.46, S * 0.33, S * 0.33, '#f0dfc0');
        ctx.save(); ctx.beginPath(); ctx.arc(S / 2, S * 0.46, S * 0.33, 0, Math.PI * 2); ctx.clip();
        sleeveBug(ctx, key, S / 2, S * 0.72, S / 48, { expr: 'calm', pose: 'idle' });
        ctx.restore();
        rect(ctx, 0, S - 26, S, 26, 'rgba(20,10,14,0.76)');
        drawText(ctx, fit(band, S - 6), S / 2, S - 24, '#ffe9b0', { align: 'center', font: 'small' });
        title2(title, S / 2, S - 9, S - 6, '#f0c060');
        break;
      }
      // ---- the plain classical box: a field, a rule, a catalogue number
      default: {
        const bg = r.pick(['#1f3a5c', '#3c2a1e', '#2a3c2a', '#4a2030']);
        rect(ctx, 0, 0, S, S, bg);
        frame(ctx, 4, 4, S - 8, S - 8, '#d8c48a');
        frame(ctx, 6, 6, S - 12, S - 12, '#8a7648');
        rect(ctx, 8, 8, S - 16, 12, '#d8c48a');
        drawText(ctx, fit(t.composer.toUpperCase(), S - 22), S / 2, 11, '#2a2018', { align: 'center', font: 'small' });
        ctx.save(); ctx.beginPath(); ctx.rect(10, 24, S - 20, S - 48); ctx.clip();
        rect(ctx, 10, 24, S - 20, S - 48, darken(bg, 0.16));
        sleeveBug(ctx, key, S / 2, S - 26, S / 56, { pose: 'play', expr: 'focus' });
        ctx.restore();
        frame(ctx, 10, 24, S - 20, S - 48, '#8a7648');
        title2(title, S / 2, S - 20, S - 16, '#e8dcb8');
        drawText(ctx, 'No. ' + (hashStr(key) % 900 + 100), S / 2, S - 12, '#9a8a60', { align: 'center', font: 'small' });
        break;
      }
    }
    // every sleeve is a printed object: a little wear, and a spine shadow
    ctx.globalAlpha = 0.14; rect(ctx, 0, 0, 3, S, '#000000'); ctx.globalAlpha = 1;
    for (let i = 0; i < 12; i++) { const x = r.int(0, S - 1), y = r.int(0, S - 1); ctx.globalAlpha = 0.2; px(ctx, x, y, r.chance(0.5) ? '#ffffff' : '#000000'); ctx.globalAlpha = 1; }
    frame(ctx, 0, 0, S, S, '#15121a');
    return c;
  });
}
// A sleeve sitting in its outer, as it looks in a crate.
function drawSleeve(ctx, key, x, y, size, opts = {}) {
  const S = Math.round(size);
  ctx.fillStyle = 'rgba(8,6,12,0.45)'; ctx.fillRect(x + 3, y + 4, S, S);
  ctx.drawImage(sleeveCanvas(key, SLEEVE_PX), 0, 0, SLEEVE_PX, SLEEVE_PX, Math.round(x), Math.round(y), S, S);
  if (opts.selected) { frame(ctx, x - 2, y - 2, S + 4, S + 4, '#fff8e8'); frame(ctx, x - 3, y - 3, S + 6, S + 6, '#d9a520'); }
  if (opts.done) { ctx.globalAlpha = 0.55; rect(ctx, x, y, S, S, '#0a0812'); ctx.globalAlpha = 1; ctx.drawImage(icon('check'), x + S / 2 - 6, y + S / 2 - 5); }
}
