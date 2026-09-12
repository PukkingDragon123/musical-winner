// ---------- 3x5 pixel bitmap font ----------
'use strict';
const FONT = (() => {
  const raw = {
    'A': '010 101 111 101 101', 'B': '110 101 110 101 110', 'C': '011 100 100 100 011',
    'D': '110 101 101 101 110', 'E': '111 100 110 100 111', 'F': '111 100 110 100 100',
    'G': '011 100 101 101 011', 'H': '101 101 111 101 101', 'I': '111 010 010 010 111',
    'J': '011 001 001 101 010', 'K': '101 101 110 101 101', 'L': '100 100 100 100 111',
    'M': '101 111 111 101 101', 'N': '110 101 101 101 101', 'O': '010 101 101 101 010',
    'P': '110 101 110 100 100', 'Q': '010 101 101 111 011', 'R': '110 101 110 101 101',
    'S': '011 100 010 001 110', 'T': '111 010 010 010 010', 'U': '101 101 101 101 011',
    'V': '101 101 101 101 010', 'W': '101 101 111 111 101', 'X': '101 101 010 101 101',
    'Y': '101 101 010 010 010', 'Z': '111 001 010 100 111',
    '0': '010 101 101 101 010', '1': '010 110 010 010 111', '2': '110 001 010 100 111',
    '3': '110 001 010 001 110', '4': '101 101 111 001 001', '5': '111 100 110 001 110',
    '6': '011 100 110 101 010', '7': '111 001 010 010 010', '8': '010 101 010 101 010',
    '9': '010 101 011 001 110',
    ' ': '000 000 000 000 000', '.': '000 000 000 000 010', ',': '000 000 000 010 100',
    '!': '010 010 010 000 010', '?': '110 001 010 000 010', ':': '000 010 000 010 000',
    ';': '000 010 000 010 100', '-': '000 000 111 000 000', '+': '000 010 111 010 000',
    '$': '010 111 100 011 111', '%': '101 001 010 100 101', '/': '001 001 010 100 100',
    '(': '010 100 100 100 010', ')': '010 001 001 001 010', "'": '010 010 000 000 000',
    '"': '101 101 000 000 000', '#': '101 111 101 111 101', '*': '101 010 111 010 101',
    '<': '001 010 100 010 001', '>': '100 010 001 010 100', '=': '000 111 000 111 000',
    '_': '000 000 000 000 111', '&': '010 101 010 101 011', '[': '110 100 100 100 110',
    ']': '011 001 001 001 011', '~': '000 001 111 100 000', '^': '010 101 000 000 000',
    '@': '010 101 111 100 011', 'x': '000 101 010 101 000',
    // music note ♪ and heart, star, arrows, coin mapped to special chars
    '♪': '011 010 010 110 110', '♥': '101 111 111 010 000', '★': '010 111 111 010 101',
    '↑': '010 111 010 010 010', '↓': '010 010 010 111 010', '←': '000 010 111 010 000',
    '→': '000 010 111 010 000',
    '●': '000 010 111 010 000', // bullet
  };
  const glyphs = {};
  for (const k in raw) glyphs[k] = raw[k].split(' ').map(r => r.split('').map(c => c === '1'));
  // proper arrows left/right need distinct shapes
  glyphs['←'] = ['010', '100', '111', '100', '010'].map(r => r.split('').map(c => c === '1'));
  glyphs['→'] = ['010', '001', '111', '001', '010'].map(r => r.split('').map(c => c === '1'));
  return glyphs;
})();

const _fontCache = new Map();
function _glyphCanvas(ch, color, scale) {
  const key = ch + '|' + color + '|' + scale;
  let c = _fontCache.get(key);
  if (c) return c;
  const g = FONT[ch] || FONT['?'];
  c = document.createElement('canvas');
  c.width = 3 * scale; c.height = 5 * scale;
  const cx = c.getContext('2d');
  cx.fillStyle = color;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 3; x++) if (g[y][x]) cx.fillRect(x * scale, y * scale, scale, scale);
  _fontCache.set(key, c);
  return c;
}
function textWidth(str, scale = 1) {
  return str.length * 4 * scale - scale;
}
// opts: {scale, align:'left'|'center'|'right', shadow, color}
function drawText(ctx, str, x, y, color = '#ffffff', opts = {}) {
  const scale = opts.scale || 1;
  str = String(str);
  let cx = Math.round(x);
  const w = textWidth(str, scale);
  if (opts.align === 'center') cx -= Math.floor(w / 2);
  else if (opts.align === 'right') cx -= w;
  const yy = Math.round(y);
  if (opts.shadow) {
    let sx = cx;
    for (const raw of str) {
      const ch = raw.length === 1 && raw >= 'a' && raw <= 'z' ? raw.toUpperCase() : raw;
      if (ch !== ' ') ctx.drawImage(_glyphCanvas(ch, opts.shadow, scale), sx + scale, yy + scale);
      sx += 4 * scale;
    }
  }
  for (const raw of str) {
    const ch = raw.length === 1 && raw >= 'a' && raw <= 'z' ? raw.toUpperCase() : raw;
    if (ch !== ' ') ctx.drawImage(_glyphCanvas(ch, color, scale), cx, yy);
    cx += 4 * scale;
  }
  return w;
}
// Word-wrap text into lines of at most maxChars
function wrapText(str, maxChars) {
  const words = String(str).split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; }
    else cur = (cur ? cur + ' ' : '') + w;
  }
  if (cur) lines.push(cur);
  return lines;
}
function drawWrapped(ctx, str, x, y, maxChars, color, lineH = 7, opts = {}) {
  const lines = wrapText(str, maxChars);
  lines.forEach((l, i) => drawText(ctx, l, x, y + i * lineH, color, opts));
  return lines.length;
}
