// ---------- The Ladybug 11 ----------
// The phone. It is a black slab in a red case shaped like a ladybug, which
// somebody gave you at a service station outside Barstow and you never took
// off, and now it is the only thing in your pocket with a name on it. The
// case has a head with two white dots, six little legs gripping the sides,
// and a gold ring round a camera that is not gold. The screen is the part
// that matters: this is where the day's three jobs live, where the bar in
// Shimokitazawa is advertised, and where you find out how few people watched
// you play last night.
'use strict';

// The house palette, phone-shaped. Everything on the glass picks from here so
// twenty little apps still look like they came out of one factory.
const LB = {
  ink: '#0b0a10', ink2: '#15141d', ink3: '#232130',
  cream: '#f2efe6', bone: '#cfcadb', grey: '#8a84a0', grey2: '#5a5670',
  blue: '#3f7df0', green: '#3fc06a', red: '#e0483a', gold: '#ffd24a',
  pink: '#ff5a9a', cyan: '#5ad8ff', purple: '#a06bff', orange: '#f28a2e',
  shellRed: '#c8241e', shellHi: '#e8483a', shellLo: '#7a1210',
  paper: '#fdf6e2', line: '#e0d8c0',
};

// ---------- rounded things, drawn as pixels ----------
// Every panel on a phone is a rounded rectangle and nothing else, so it is
// worth having one that steps properly instead of one the browser blurs.
function lbRound(ctx, x, y, w, h, r, col) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  r = Math.max(0, Math.min(Math.round(r), Math.floor(Math.min(w, h) / 2)));
  if (w <= 0 || h <= 0) return;
  if (r <= 0) { rect(ctx, x, y, w, h, col); return; }
  rect(ctx, x, y + r, w, h - r * 2, col);
  for (let i = 0; i < r; i++) {
    const dy = r - i - 0.5;
    const c = Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)));
    rect(ctx, x + c, y + i, w - c * 2, 1, col);
    rect(ctx, x + c, y + h - 1 - i, w - c * 2, 1, col);
  }
}
function lbRoundOutline(ctx, x, y, w, h, r, col) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  r = Math.max(0, Math.min(Math.round(r), Math.floor(Math.min(w, h) / 2)));
  if (w <= 0 || h <= 0) return;
  const cuts = [];
  for (let i = 0; i < r; i++) { const dy = r - i - 0.5; cuts.push(Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)))); }
  const c0 = r ? cuts[0] : 0;
  rect(ctx, x + c0, y, w - c0 * 2, 1, col);
  rect(ctx, x + c0, y + h - 1, w - c0 * 2, 1, col);
  rect(ctx, x, y + r, 1, h - r * 2, col);
  rect(ctx, x + w - 1, y + r, 1, h - r * 2, col);
  for (let i = 0; i < r; i++) {
    const c = cuts[i], p = i > 0 ? cuts[i - 1] : c;
    const run = Math.max(1, p - c + 1);
    rect(ctx, x + c, y + i, run, 1, col); rect(ctx, x + w - c - run, y + i, run, 1, col);
    rect(ctx, x + c, y + h - 1 - i, run, 1, col); rect(ctx, x + w - c - run, y + h - 1 - i, run, 1, col);
  }
}
// The clip every screen and every icon lives inside. Built out of one scanline
// rect per row, so the mask has hard stepped corners like the art does.
function lbRoundClip(ctx, x, y, w, h, r) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  r = Math.max(0, Math.min(Math.round(r), Math.floor(Math.min(w, h) / 2)));
  ctx.beginPath();
  ctx.rect(x, y + r, w, h - r * 2);
  for (let i = 0; i < r; i++) {
    const dy = r - i - 0.5;
    const c = Math.round(r - Math.sqrt(Math.max(0, r * r - dy * dy)));
    ctx.rect(x + c, y + i, w - c * 2, 1);
    ctx.rect(x + c, y + h - 1 - i, w - c * 2, 1);
  }
  ctx.clip();
}
// darken() only speaks in #rrggbb, and half the cards on this phone are
// translucent so the wallpaper shows through them. Hand it an rgba() string
// and it hands back '#NaNNaNNaN', which the canvas quietly ignores and you
// spend an hour wondering why one edge is the wrong colour. So: hex goes
// through, everything else gets a plain black wash.
function lbDarken(col, amt) {
  return (typeof col === 'string' && col.charAt(0) === '#') ? darken(col, amt) : 'rgba(0,0,0,0.28)';
}
// A card: shadow, body, a lit top edge and a shadowed bottom one.
function lbCard(ctx, x, y, w, h, r, col, opts) {
  const o = opts || {};
  if (o.shadow !== false) lbRound(ctx, x + 1, y + 2, w, h, r, 'rgba(4,3,10,0.45)');
  lbRound(ctx, x, y, w, h, r, col);
  ctx.save(); lbRoundClip(ctx, x, y, w, h, r);
  ctx.globalAlpha = 0.1; rect(ctx, x, y, w, Math.max(2, Math.round(h * 0.4)), '#ffffff'); ctx.globalAlpha = 1;
  rect(ctx, x, y + h - 2, w, 2, lbDarken(col, 0.22));
  ctx.restore();
  if (o.edge) lbRoundOutline(ctx, x, y, w, h, r, o.edge);
}
// The goals table is written elsewhere and a saved run can carry a key that is
// no longer in it. Nothing on a phone screen is worth a crash, so both of
// these fall back to something printable.
function lbGoalText(g) {
  if (g && typeof GOALS !== 'undefined' && GOALS[g.key]) return goalText(g);
  return String((g && g.key) || 'SOMETHING').toUpperCase();
}
function lbGoalK(r, g) {
  if (r && g && typeof GOALS !== 'undefined' && GOALS[g.key]) return goalProgress(r, g);
  return 0;
}
function lbGoalName(g) {
  if (g && typeof GOALS !== 'undefined' && GOALS[g.key]) return GOALS[g.key].name;
  return String((g && g.key) || 'A THING').toUpperCase();
}

// ---------- status bar furniture ----------
function lbBars(ctx, x, y, n, col, off) {
  for (let i = 0; i < 4; i++) {
    const hh = 3 + i * 2;
    rect(ctx, x + i * 4, y + 9 - hh, 3, hh, i < n ? col : (off || withAlpha(col, 0.28)));
  }
}
function lbWifi(ctx, x, y, col) {
  // three arcs and a dot, built out of stepped rows
  rect(ctx, x + 1, y, 9, 1, col); rect(ctx, x, y + 1, 2, 1, col); rect(ctx, x + 9, y + 1, 2, 1, col);
  rect(ctx, x + 3, y + 3, 5, 1, col); rect(ctx, x + 2, y + 4, 2, 1, col); rect(ctx, x + 7, y + 4, 2, 1, col);
  rect(ctx, x + 4, y + 7, 3, 2, col);
}
function lbBatteryIcon(ctx, x, y, k, warn) {
  const w = 22, h = 10;
  lbRoundOutline(ctx, x, y, w, h, 3, withAlpha('#ffffff', 0.45));
  rect(ctx, x + w + 1, y + 3, 2, 4, withAlpha('#ffffff', 0.45));
  const fill = Math.max(1, Math.round((w - 4) * clamp(k, 0, 1)));
  const col = k < 0.12 ? LB.red : k < 0.25 ? LB.gold : (warn || '#f2efe6');
  lbRound(ctx, x + 2, y + 2, fill, h - 4, 1, col);
}
function lbChevron(ctx, x, y, dir, col, s) {
  s = s || 4;
  for (let i = 0; i < s; i++) { rect(ctx, x + dir * i, y - i - 1, 2, 2, col); rect(ctx, x + dir * i, y + i, 2, 2, col); }
}
function lbStars(ctx, x, y, v, col) {
  for (let i = 0; i < 5; i++) {
    const on = v >= i + 0.75 ? 1 : v >= i + 0.25 ? 0.5 : 0;
    const c = on ? col : withAlpha(col, 0.22);
    const sx = x + i * 7;
    rect(ctx, sx + 2, y, 1, 5, c); rect(ctx, sx, y + 2, 5, 1, c); rect(ctx, sx + 1, y + 1, 3, 3, c);
    rect(ctx, sx, y + 4, 1, 1, c); rect(ctx, sx + 4, y + 4, 1, 1, c);
    if (on === 0.5) rect(ctx, sx + 3, y, 2, 5, withAlpha(col, 0.22));
  }
}
// A run of glyphs nobody in this game can read, which is the whole joke of the
// translate app and half the signage in Tokyo.
function lbKanaRun(ctx, x, y, s, n, col, seed, gap) {
  const r = makeRng(hashStr(String(seed)));
  for (let i = 0; i < n; i++) drawKanaBlock(ctx, x + i * (s + (gap == null ? 2 : gap)), y, s, col, r.int(0, 5));
}
function lbPill(ctx, x, y, w, h, col, label, ink) {
  lbRound(ctx, x, y, w, h, Math.floor(h / 2), col);
  if (label) drawText(ctx, label, x + w / 2, y + Math.floor((h - 5) / 2), ink || LB.ink, { align: 'center', font: 'small' });
}
function lbToggle(ctx, x, y, on) {
  lbRound(ctx, x, y, 26, 14, 7, on ? LB.green : '#4a4658');
  lbRound(ctx, x + (on ? 13 : 1), y + 1, 12, 12, 6, '#f6f4ee');
  if (on) { ctx.globalAlpha = 0.25; lbRound(ctx, x, y, 26, 6, 6, '#ffffff'); ctx.globalAlpha = 1; }
}
// Who the tower says you are talking to. It changes once, on the runway.
function lbCarrier() {
  const ch = (Game.run && Game.run.chapter) || 'tokyo';
  return (ch === 'vegas' || ch === 'plane') ? 'BUG MOBILE' : 'NTT DOKODEMO';
}
const LB_WEEK = ['WED', 'THU', 'FRI', 'SAT', 'SUN', 'MON', 'TUE'];
// The clock is the run's clock, not the wall's. Five days of it, ticking a
// minute every six seconds you stare at the thing.
function lbClockOf(secs) {
  const day = (Game.run && Game.run.day) || 0;
  const mins = 7 * 60 + 41 + day * 97 + Math.floor(secs / 6);
  const h = Math.floor(mins / 60) % 24, m = mins % 60;
  return { h: h, m: m, text: pad2(h) + ':' + pad2(m), day: day, date: LB_WEEK[day % 7] + ' ' + (12 + day) + ' NOV' };
}

// ---------- what is installed ----------
// page 0 is the one you actually use. page 1 is the one every phone has, full
// of the things that came with it. The dock is the four you press without
// looking.
const LB_APPS = [
  { key: 'notes', name: 'NOTES', col: '#f2c94c', col2: '#c89a20', page: 0 },
  { key: 'jobs', name: 'BUGSEEK', col: '#2f7a4a', col2: '#1c4e30', page: 0 },
  { key: 'tikbug', name: 'TIKBUG', col: '#161620', col2: '#08080e', page: 0 },
  { key: 'maps', name: 'MAPS', col: '#4a9f68', col2: '#2c6742', page: 0 },
  { key: 'translate', name: 'TRANSLATE', col: '#3f7df0', col2: '#2450a8', page: 0 },
  { key: 'wallet', name: 'WALLET', col: '#2a2a34', col2: '#131318', page: 0 },
  { key: 'weather', name: 'WEATHER', col: '#4a86f7', col2: '#7ac0ff', page: 0 },
  { key: 'clock', name: 'CLOCK', col: '#15141d', col2: '#08080e', page: 0 },
  { key: 'camera', name: 'CAMERA', col: '#6a6478', col2: '#3a3546', page: 0 },
  { key: 'contacts', name: 'CONTACTS', col: '#c8a03a', col2: '#8a6a1a', page: 0 },
  { key: 'band', name: 'THE BAND', col: '#c8402c', col2: '#8a2418', page: 0 },
  { key: 'settings', name: 'SETTINGS', col: '#7a8090', col2: '#4a5058', page: 0 },
  { key: 'mail', name: 'MAIL', col: '#5ab0f0', col2: '#2a78b8', page: 0 },
  { key: 'calendar', name: 'CALENDAR', col: '#f4f1ea', col2: '#d8d2c4', page: 0 },
  { key: 'photos', name: 'PHOTOS', col: '#1c1b26', col2: '#0d0d14', page: 0 },
  { key: 'ramen', name: 'RAMENGO', col: '#e0783c', col2: '#a04a18', page: 0 },
  { key: 'calc', name: 'CALC', col: '#2a2a32', col2: '#141418', page: 1 },
  { key: 'steps', name: 'HEALTH', col: '#f4f1ea', col2: '#d0cabe', page: 1 },
  { key: 'store', name: 'APP SHOP', col: '#3f7df0', col2: '#2450a8', page: 1 },
  { key: 'compass', name: 'COMPASS', col: '#1c1b26', col2: '#0d0d14', page: 1 },
  { key: 'phone', name: 'PHONE', col: '#3fc06a', col2: '#237a42', dock: true },
  { key: 'messages', name: 'MESSAGES', col: '#3fc06a', col2: '#1c7a40', dock: true },
  { key: 'browser', name: 'BROWSER', col: '#e8eef6', col2: '#a8b4c4', dock: true },
  { key: 'music', name: 'MUSIC', col: '#e0503a', col2: '#9a2418', dock: true },
];
const LB_APP_BY_KEY = {};
for (let i = 0; i < LB_APPS.length; i++) LB_APP_BY_KEY[LB_APPS[i].key] = LB_APPS[i];
const LB_DOCK = LB_APPS.filter(function (a) { return a.dock; });
function lbPageApps(n) { return LB_APPS.filter(function (a) { return !a.dock && a.page === n; }); }

// ---------- BUGSEEK ----------
// The listings are all real jobs for a bug with an instrument and no visa.
// Only one of them matters, and it is the cheapest one on the list.
const LB_JOBS = [
  {
    id: 'beatles', venue: 'THE BEATLES', kind: 'BAR - LIVE MUSIC', area: 'SHIMOKITAZAWA',
    pay: 38, per: 'PER SET', dist: '1.2 KM', stars: 4.5, reviews: 212, posted: 'POSTED 2 DAYS AGO',
    blurb: 'SIX SEATS, ONE STAGE, EVERY RECORD EVER PRESSED. THE OWNER WILL TELL YOU ABOUT ALL OF THEM.',
    reqs: ['BRING YOUR OWN INSTRUMENT', 'THREE SONGS, FORTY MINUTES', 'BE THERE BY SEVEN'],
    km: 1.2, music: true, tonight: true,
    hot: true, note: 'NO AUDITION. HE JUST WANTS TO HEAR IT.',
  },
  {
    id: 'crossing', venue: 'SCRAMBLE SQUARE', kind: 'STREET - BUSKING PERMIT', area: 'SHIBUYA',
    pay: 0, per: 'TIPS ONLY', dist: '4.8 KM', stars: 3.5, reviews: 41, posted: 'POSTED TODAY',
    blurb: 'STAND WHERE THE CAMERAS POINT. TWO THOUSAND BUGS CROSS EVERY LIGHT AND NONE OF THEM STOP.',
    reqs: ['PERMIT AT YOUR OWN RISK', 'NO AMPLIFICATION', 'MOVE ON WHEN TOLD'],
    km: 4.8, music: true, tonight: true,
    note: 'REVIEWERS SAY: LOUD. VERY LOUD.',
  },
  {
    id: 'izakaya', venue: 'TORIKIZOKU DAYS', kind: 'IZAKAYA - BACKGROUND SETS', area: 'SHINJUKU',
    pay: 52, per: 'PER NIGHT', dist: '6.1 KM', stars: 3.0, reviews: 88, posted: 'POSTED 5 DAYS AGO',
    blurb: 'PLAY QUIET. NOBODY IS LISTENING AND THAT IS THE CONTRACT. FREE SKEWERS AFTER ELEVEN.',
    reqs: ['UNDER 60 DECIBELS', 'NO SINGING', 'FINISH BY MIDNIGHT'],
    km: 6.1, music: true, tonight: true,
    note: 'THE LAST ACT LASTED ONE NIGHT.',
  },
  {
    id: 'weddings', venue: 'HAPPY VEIL CO.', kind: 'FUNCTION - STRINGS WANTED', area: 'GINZA',
    pay: 120, per: 'PER BOOKING', dist: '8.4 KM', stars: 4.0, reviews: 19, posted: 'POSTED 1 WEEK AGO',
    blurb: 'CANON IN D. THEN CANON IN D. THEN, IF THE SPEECHES OVERRUN, CANON IN D.',
    reqs: ['BLACK JACKET', 'SIGHT READING', 'SMILE THROUGH IT'],
    km: 8.4, music: true, tonight: false,
    note: 'PAYS IN THREE WEEKS. THEY PROMISE.',
  },
  {
    id: 'mascot', venue: 'COLONY MART 24H', kind: 'RETAIL - NIGHT SHIFT', area: 'NAKANO',
    pay: 44, per: 'PER SHIFT', dist: '2.9 KM', stars: 2.5, reviews: 303, posted: 'ALWAYS HIRING',
    blurb: 'NOT MUSIC. TILL, MOP, RESTOCK, BOW. THE LIGHTS ARE ON FOREVER AND SO ARE YOU.',
    reqs: ['ANY VISA', 'TEN PM TO SIX AM', 'NO EXPERIENCE'],
    km: 2.9, music: false, tonight: true,
    note: 'ALWAYS HIRING IS NEVER A GOOD SIGN.',
  },
  {
    id: 'ferry', venue: 'ODAIBA NIGHT FERRY', kind: 'BOAT - DECK MUSIC', area: 'BAYSIDE',
    pay: 66, per: 'PER CROSSING', dist: '14 KM', stars: 4.0, reviews: 7, posted: 'POSTED 3 DAYS AGO',
    blurb: 'FORTY MINUTES EACH WAY UNDER THE RAINBOW BRIDGE. THE WIND TAKES HALF OF WHAT YOU PLAY.',
    reqs: ['SEA LEGS', 'WEATHER DEPENDENT', 'CLIP YOUR SHEETS DOWN'],
    km: 14, music: true, tonight: false,
    note: 'CANCELLED IF IT RAINS, WHICH IT WILL.',
  },
];
const LB_FILTERS = ['ALL', 'MUSIC', 'NEAR ME', 'TONIGHT'];
// The filter pills used to be decoration. They are not: a pill that lies to
// you is worse than no pill, and the point of NEAR ME is that it leaves the
// ferry behind.
function lbJobsFor(f) {
  return LB_JOBS.filter(function (j) {
    if (f === 1) return !!j.music;
    if (f === 2) return (j.km || 99) <= 5;
    if (f === 3) return !!j.tonight;
    return true;
  });
}

// ---------- TIKBUG ----------
const LB_CLIPS = [
  { cap: 'FIRST NIGHT IN TOKYO AND I CAN SEE MY BREATH', tag: '#busking #tokyo #coldhands', pose: 'play', col: '#2a2f52' },
  { cap: 'THE AMP IS A BUCKET. THE BUCKET IS FINE.', tag: '#gear #budget #bucketamp', pose: 'play', col: '#4a2a3a' },
  { cap: 'ONE BUG STOPPED. ONE IS A CROWD.', tag: '#streetmusic #onebug', pose: 'cheer', col: '#243a2c' },
  { cap: 'PLAYED FOR FORTY MINUTES. MADE ENOUGH FOR RICE.', tag: '#tourlife #rice', pose: 'sad', col: '#3a2f22' },
  { cap: 'SOMEBODY REQUESTED A SONG I WROTE. NOBODY KNOWS IT.', tag: '#original #confused', pose: 'talk', col: '#2f2a4a' },
];

// ---------- TRANSLATE ----------
// Every phrase you actually need on day one, and the machine is very confident
// about all of them.
const LB_PHRASES = [
  { en: 'WHERE IS THE STAGE?', conf: 99.1 },
  { en: 'I AM HERE ABOUT THE ADVERT.', conf: 98.4 },
  { en: 'SORRY. I WILL MOVE.', conf: 99.7 },
  { en: 'ONE TONKATSU PLEASE.', conf: 97.2 },
  { en: 'IS THIS SEAT TAKEN?', conf: 99.9 },
  { en: 'I DO NOT HAVE A VISA FOR THIS.', conf: 96.8 },
  { en: 'THANK YOU FOR LISTENING.', conf: 99.4 },
];

// ---------- MAPS ----------
// A plan view with a side elevation under it, because the city is both: a grid
// on the screen and a wall of buildings you walk past.
const LB_SPOTS = [
  { key: 'capsule', name: 'THE CAPSULE', sub: 'BED 4F, POD 12', x: 0.18, y: 0.66, col: '#c8a03a', you: true },
  { key: 'station', name: 'SHIMOKITA STN', sub: 'ODAKYU + KEIO', x: 0.38, y: 0.42, col: '#4a86f7' },
  { key: 'tonkatsu', name: 'KATSU TARO', sub: 'OPEN 11 TO 2, 5 TO 9', x: 0.55, y: 0.72, col: '#e0783c' },
  { key: 'beatles', name: 'THE BEATLES', sub: 'BASEMENT, NO SIGN', x: 0.74, y: 0.34, col: '#c8402c' },
  { key: 'park', name: 'KITAZAWA PARK', sub: 'BENCHES, NO POWER', x: 0.86, y: 0.62, col: '#3fc06a' },
];

// ---------- MAIL ----------
const LB_MAIL = [
  { from: 'DRAGON FLY', sub: 'YOUR TRIP DF 0808 IS COMPLETE', body: 'THANK YOU FOR FLYING THE LONG WAY ROUND. RATE YOUR CABIN CREW.', t: '06:12', unread: true },
  { from: 'BUGSEEK ALERTS', sub: '6 NEW ROLES NEAR SHIMOKITAZAWA', body: 'ONE OF THEM IS MUSIC. FIVE OF THEM ARE NOT.', t: 'YESTERDAY', unread: true },
  { from: 'THE LANDLORD', sub: 'RE: RE: RE: THE AMP', body: 'THE NEIGHBOURS HAVE WRITTEN AGAIN. I AM FORWARDING IT WITHOUT COMMENT.', t: 'TUE', unread: false },
  { from: 'COLONY MART', sub: 'YOUR POINTS ARE EXPIRING', body: 'YOU HAVE 12 POINTS. THAT IS ONE RICE BALL, ROUNDED DOWN.', t: 'MON', unread: false },
];

// ---------- the icons ----------
// One tile, three tones, one glyph that survives being 38 pixels across. The
// tile is drawn clipped so the corners step; the glyph goes on top of it.
function ladybugIcon(ctx, x, y, s, key, t) {
  const A = LB_APP_BY_KEY[key] || { col: '#4a4a5a', col2: '#25252f' };
  const r = Math.round(s * 0.24);
  lbRound(ctx, x + 1, y + 2, s, s, r, 'rgba(4,3,10,0.5)');
  ctx.save(); lbRoundClip(ctx, x, y, s, s, r);
  rect(ctx, x, y, s, s, A.col);
  vgrad(ctx, x, y, s, s, lighten(A.col, 0.16), A.col2 || darken(A.col, 0.24));
  ctx.globalAlpha = 0.12; rect(ctx, x, y, s, Math.round(s * 0.34), '#ffffff'); ctx.globalAlpha = 1;
  rect(ctx, x, y + s - 2, s, 2, darken(A.col, 0.3));
  lbIconGlyph(ctx, x, y, s, key, t || 0);
  ctx.restore();
  lbRoundOutline(ctx, x, y, s, s, r, withAlpha('#ffffff', 0.16));
}
function lbIconGlyph(ctx, x, y, s, key, t) {
  const cx = Math.round(x + s / 2), cy = Math.round(y + s / 2), u = s / 16;
  const W_ = LB.cream, K = '#1a1826';
  switch (key) {
    case 'phone': {
      // a handset on the diagonal, the way the glyph has been since 1962
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.5); ctx.translate(-cx, -cy);
      rect(ctx, cx - 3 * u, cy - 1.4 * u, 6 * u, 3 * u, W_);
      rect(ctx, cx - 5.4 * u, cy - 4.4 * u, 3.4 * u, 4 * u, W_);
      rect(ctx, cx + 2 * u, cy + 0.4 * u, 3.4 * u, 4 * u, W_);
      rect(ctx, cx - 5.4 * u, cy - 4.4 * u, 3.4 * u, 1 * u, withAlpha('#ffffff', 0.5));
      ctx.restore();
      break;
    }
    case 'messages': {
      lbRound(ctx, cx - 5.5 * u, cy - 5 * u, 11 * u, 8.5 * u, 3 * u, W_);
      ctx.fillStyle = W_; ctx.beginPath();
      ctx.moveTo(cx - 3 * u, cy + 3 * u); ctx.lineTo(cx + 1 * u, cy + 3 * u); ctx.lineTo(cx - 4 * u, cy + 6 * u); ctx.fill();
      for (let i = 0; i < 3; i++) rect(ctx, cx - 3.4 * u + i * 2.6 * u, cy - 1.4 * u, 1.6 * u, 1.6 * u, '#2f8f50');
      break;
    }
    case 'browser': {
      circle(ctx, cx, cy, 5.6 * u, '#2a3448');
      ringPx(ctx, cx, cy, 5.6 * u, '#7a8496');
      ctx.fillStyle = LB.red; ctx.beginPath();
      ctx.moveTo(cx + 3.6 * u, cy - 3.6 * u); ctx.lineTo(cx + 0.6 * u, cy + 0.6 * u); ctx.lineTo(cx - 0.8 * u, cy - 0.8 * u); ctx.fill();
      ctx.fillStyle = W_; ctx.beginPath();
      ctx.moveTo(cx - 3.6 * u, cy + 3.6 * u); ctx.lineTo(cx - 0.6 * u, cy - 0.6 * u); ctx.lineTo(cx + 0.8 * u, cy + 0.8 * u); ctx.fill();
      break;
    }
    case 'music': {
      rect(ctx, cx + 1 * u, cy - 6 * u, 1.8 * u, 8.5 * u, W_);
      rect(ctx, cx + 1 * u, cy - 6 * u, 5.5 * u, 2.4 * u, W_);
      ellipsePx(ctx, cx - 0.4 * u, cy + 3 * u, 2.6 * u, 2.1 * u, W_);
      break;
    }
    case 'notes': {
      rect(ctx, x + 3 * u, y + 2.5 * u, s - 6 * u, s - 5 * u, LB.paper);
      rect(ctx, x + 3 * u, y + 2.5 * u, s - 6 * u, 2.2 * u, '#e8b83a');
      for (let i = 0; i < 4; i++) rect(ctx, x + 4.6 * u, y + 7 * u + i * 2.2 * u, (s - 9 * u) - (i === 3 ? 3 * u : 0), 1, '#b0a68e');
      break;
    }
    case 'jobs': {
      // a case with a magnifier over it: looking for work
      rect(ctx, x + 2.6 * u, cy - 2.5 * u, s - 5.2 * u, 6.5 * u, '#e8d6a8');
      rect(ctx, x + 2.6 * u, cy - 2.5 * u, s - 5.2 * u, 1.2 * u, '#fff4d8');
      rect(ctx, cx - 2.4 * u, cy - 4.6 * u, 4.8 * u, 2.2 * u, '#e8d6a8');
      rect(ctx, x + 2.6 * u, cy + 0.6 * u, s - 5.2 * u, 1 * u, '#a89a70');
      ringPx(ctx, cx + 2.6 * u, cy + 1.6 * u, 3.4 * u, '#6be585');
      ringPx(ctx, cx + 2.6 * u, cy + 1.6 * u, 3 * u, '#6be585');
      line(ctx, cx + 4.8 * u, cy + 3.8 * u, cx + 7 * u, cy + 6 * u, '#6be585');
      break;
    }
    case 'tikbug': {
      // the note, printed three times slightly out of register
      const note = function (ox, oy, col) {
        rect(ctx, cx + 0.4 * u + ox, cy - 6 * u + oy, 1.8 * u, 8.4 * u, col);
        rect(ctx, cx + 0.4 * u + ox, cy - 6 * u + oy, 4.6 * u, 2 * u, col);
        ellipsePx(ctx, cx - 1 * u + ox, cy + 2.8 * u + oy, 2.6 * u, 2.1 * u, col);
      };
      note(-1.4 * u, 0.6 * u, '#3ff0e0'); note(1.4 * u, -0.4 * u, '#ff2a5a'); note(0, 0, W_);
      break;
    }
    case 'maps': {
      // a folded map, three panels, with a pin in it
      rect(ctx, x + 2 * u, y + 3 * u, 4 * u, s - 6 * u, '#e8e2d0');
      rect(ctx, x + 6 * u, y + 4.6 * u, 4 * u, s - 6 * u, '#d6d0be');
      rect(ctx, x + 10 * u, y + 3 * u, 4 * u, s - 6 * u, '#e8e2d0');
      rect(ctx, x + 2 * u, y + 8 * u, s - 4 * u, 1, '#a8a292');
      rect(ctx, cx - 1 * u, y + 3 * u, 1, s - 6 * u, '#a8a292');
      ellipsePx(ctx, cx + 2.4 * u, cy - 1 * u, 2.4 * u, 2.6 * u, LB.red);
      ctx.fillStyle = LB.red; ctx.beginPath();
      ctx.moveTo(cx + 0.4 * u, cy); ctx.lineTo(cx + 4.4 * u, cy); ctx.lineTo(cx + 2.4 * u, cy + 4 * u); ctx.fill();
      rect(ctx, cx + 1.6 * u, cy - 1.6 * u, 1.8 * u, 1.8 * u, '#fff4e8');
      break;
    }
    case 'translate': {
      drawText(ctx, 'A', x + 3 * u, y + 3.4 * u, W_, { scale: Math.max(1, Math.round(s / 16)) });
      drawKanaBlock(ctx, cx + 0.6 * u, cy + 0.4 * u, 5.4 * u, '#ffd24a', 2);
      rect(ctx, cx - 5 * u, cy + 4.6 * u, 8 * u, 1, withAlpha('#ffffff', 0.7));
      rect(ctx, cx + 2 * u, cy + 3.6 * u, 1, 3, withAlpha('#ffffff', 0.7));
      break;
    }
    case 'wallet': {
      const cols = ['#e0483a', '#3fc06a', '#f2c94c'];
      for (let i = 2; i >= 0; i--) lbRound(ctx, x + 2.6 * u, cy - 4 * u + i * 2 * u, s - 5.2 * u, 6 * u, 1.4 * u, cols[i]);
      rect(ctx, x + 2.6 * u, cy + 0.4 * u, s - 5.2 * u, 1, '#8a6a1a');
      rect(ctx, x + 4.4 * u, cy + 2.4 * u, 4 * u, 1.4 * u, '#fff4d8');
      break;
    }
    case 'weather': {
      circle(ctx, cx + 2.4 * u, cy - 2.4 * u, 3.4 * u, '#ffe07a');
      for (let i = 0; i < 8; i++) { const a = i * 0.785; rect(ctx, cx + 2.4 * u + Math.cos(a) * 5.2 * u - 0.6 * u, cy - 2.4 * u + Math.sin(a) * 5.2 * u - 0.6 * u, 1.4 * u, 1.4 * u, '#ffe07a'); }
      ellipsePx(ctx, cx - 1.4 * u, cy + 2.4 * u, 5 * u, 2.8 * u, '#f4f6fa');
      ellipsePx(ctx, cx + 2.6 * u, cy + 3.2 * u, 3.4 * u, 2.2 * u, '#dfe4ee');
      break;
    }
    case 'clock': {
      circle(ctx, cx, cy, 6.4 * u, '#f6f4ee'); ringPx(ctx, cx, cy, 6.4 * u, '#8a8496');
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; rect(ctx, cx + Math.sin(a) * 5.4 * u - 0.5, cy - Math.cos(a) * 5.4 * u - 0.5, 1, 1, '#4a4658'); }
      const mm = t * 0.9, hh = t * 0.075;
      line(ctx, cx, cy, cx + Math.sin(hh) * 3 * u, cy - Math.cos(hh) * 3 * u, '#15141d');
      line(ctx, cx, cy, cx + Math.sin(mm) * 4.6 * u, cy - Math.cos(mm) * 4.6 * u, '#15141d');
      rect(ctx, cx - 1, cy - 1, 2, 2, LB.orange);
      break;
    }
    case 'camera': {
      rect(ctx, x + 2 * u, cy - 3.6 * u, s - 4 * u, 8.4 * u, '#2a2d36');
      rect(ctx, x + 2 * u, cy - 3.6 * u, s - 4 * u, 1, '#4a4e5a');
      rect(ctx, cx - 2.4 * u, cy - 5.4 * u, 4.8 * u, 2 * u, '#2a2d36');
      circle(ctx, cx, cy + 0.6 * u, 3.4 * u, '#0d0f16');
      circle(ctx, cx, cy + 0.6 * u, 2.4 * u, '#3f7df0');
      circle(ctx, cx - 1 * u, cy - 0.4 * u, 1 * u, '#cfe4ff');
      rect(ctx, x + s - 5 * u, cy - 2.4 * u, 1.4 * u, 1.4 * u, LB.red);
      break;
    }
    case 'contacts': {
      lbRound(ctx, x + 3 * u, y + 2.6 * u, s - 6 * u, s - 5.2 * u, 1.6 * u, LB.paper);
      rect(ctx, x + 3 * u, y + 2.6 * u, 1.4 * u, s - 5.2 * u, '#8a6a1a');
      circle(ctx, cx - 1.4 * u, cy - 1.6 * u, 2.2 * u, '#8a7a5e');
      ellipsePx(ctx, cx - 1.4 * u, cy + 3.4 * u, 3.6 * u, 2.6 * u, '#8a7a5e');
      for (let i = 0; i < 3; i++) rect(ctx, x + s - 4.4 * u, y + 5 * u + i * 3 * u, 1.6 * u, 1, '#8a6a1a');
      break;
    }
    case 'band': {
      for (let i = 0; i < 3; i++) {
        const bx = cx - 4.6 * u + i * 4.6 * u, by = cy - 1 * u + (i === 1 ? -1.4 * u : 0);
        circle(ctx, bx, by, 2.6 * u, ['#ffd24a', '#8ad8ff', '#6be585'][i]);
        rect(ctx, bx - 1 * u, by - 3.4 * u, 0.9 * u, 1.8 * u, '#241d28'); rect(ctx, bx + 0.4 * u, by - 3.4 * u, 0.9 * u, 1.8 * u, '#241d28');
        rect(ctx, bx - 1.2 * u, by - 0.6 * u, 0.9 * u, 0.9 * u, '#241d28'); rect(ctx, bx + 0.4 * u, by - 0.6 * u, 0.9 * u, 0.9 * u, '#241d28');
        ellipsePx(ctx, bx, by + 3.6 * u, 2.8 * u, 1.8 * u, darken(['#ffd24a', '#8ad8ff', '#6be585'][i], 0.25));
      }
      break;
    }
    case 'settings': {
      const gear = function (gx, gy, R, col) {
        circle(ctx, gx, gy, R, col); circle(ctx, gx, gy, R * 0.45, '#4a5058');
        for (let i = 0; i < 8; i++) { const a = i * 0.785 + t * 0.4; rect(ctx, gx + Math.cos(a) * R * 1.25 - R * 0.2, gy + Math.sin(a) * R * 1.25 - R * 0.2, R * 0.42, R * 0.42, col); }
      };
      gear(cx - 1.4 * u, cy - 1 * u, 3.6 * u, '#d8dce2');
      gear(cx + 3.4 * u, cy + 3.4 * u, 2.2 * u, '#a8aeb6');
      break;
    }
    case 'mail': {
      rect(ctx, x + 2.4 * u, cy - 4 * u, s - 4.8 * u, 8 * u, LB.paper);
      rect(ctx, x + 2.4 * u, cy - 4 * u, s - 4.8 * u, 1, '#ffffff');
      ctx.fillStyle = '#c8d8e8'; ctx.beginPath();
      ctx.moveTo(x + 2.4 * u, cy - 4 * u); ctx.lineTo(x + s - 2.4 * u, cy - 4 * u); ctx.lineTo(cx, cy + 0.6 * u); ctx.fill();
      line(ctx, x + 2.4 * u, cy - 4 * u, cx, cy + 0.6 * u, '#8aa0b8');
      line(ctx, x + s - 2.4 * u, cy - 4 * u, cx, cy + 0.6 * u, '#8aa0b8');
      break;
    }
    case 'calendar': {
      rect(ctx, x + 2.4 * u, y + 2.4 * u, s - 4.8 * u, s - 4.8 * u, '#ffffff');
      rect(ctx, x + 2.4 * u, y + 2.4 * u, s - 4.8 * u, 3.4 * u, LB.red);
      const day = 12 + ((Game.run && Game.run.day) || 0);
      drawText(ctx, String(day), cx, cy - 1 * u, '#241d28', { align: 'center', scale: Math.max(1, Math.round(s / 14)) });
      drawText(ctx, 'NOV', cx, y + 3.2 * u, '#fff4e8', { align: 'center', font: 'small' });
      break;
    }
    case 'photos': {
      for (let i = 0; i < 8; i++) {
        const a = i * 0.785;
        ellipsePx(ctx, cx + Math.cos(a) * 3.6 * u, cy + Math.sin(a) * 3.6 * u, 2.4 * u, 2.4 * u,
          ['#ffd24a', '#f28a2e', '#e0483a', '#ff5a9a', '#a06bff', '#3f7df0', '#5ad8ff', '#3fc06a'][i]);
      }
      circle(ctx, cx, cy, 2 * u, '#f6f4ee');
      break;
    }
    case 'ramen': {
      ellipsePx(ctx, cx, cy + 1.4 * u, 6.4 * u, 4 * u, '#f0ece2');
      ellipsePx(ctx, cx, cy - 0.4 * u, 5.4 * u, 2.8 * u, '#e0a04a');
      rect(ctx, cx - 3 * u, cy - 1 * u, 2.6 * u, 1 * u, '#f4f1ea');
      circle(ctx, cx + 2 * u, cy - 0.4 * u, 1.4 * u, '#f4f1ea'); circle(ctx, cx + 2 * u, cy - 0.4 * u, 0.7 * u, '#e8b83a');
      for (let i = 0; i < 3; i++) rect(ctx, cx - 3.4 * u + i * 3 * u, cy - 6 * u + Math.round(Math.sin(t * 2.4 + i) * 1.2), 1 * u, 3 * u, withAlpha('#ffffff', 0.65));
      rect(ctx, cx - 6.4 * u, cy + 4.4 * u, 12.8 * u, 1, '#a07040');
      break;
    }
    case 'calc': {
      rect(ctx, x + 3 * u, y + 3 * u, s - 6 * u, 3 * u, '#3a3a44');
      drawText(ctx, '0', x + s - 4.4 * u, y + 3.6 * u, W_, { align: 'right', font: 'small' });
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 3; c2++) rect(ctx, x + 3 * u + c2 * 2.8 * u, y + 7.4 * u + r2 * 2.8 * u, 2 * u, 2 * u, '#6a6a76');
      for (let r2 = 0; r2 < 3; r2++) rect(ctx, x + s - 5.2 * u, y + 7.4 * u + r2 * 2.8 * u, 2 * u, 2 * u, LB.orange);
      break;
    }
    case 'steps': {
      ctx.fillStyle = '#e0483a';
      ellipsePx(ctx, cx - 2.4 * u, cy - 1.6 * u, 3 * u, 3 * u, '#e0483a');
      ellipsePx(ctx, cx + 2.4 * u, cy - 1.6 * u, 3 * u, 3 * u, '#e0483a');
      ctx.beginPath(); ctx.moveTo(cx - 5.2 * u, cy - 0.6 * u); ctx.lineTo(cx + 5.2 * u, cy - 0.6 * u); ctx.lineTo(cx, cy + 5.4 * u); ctx.fill();
      rect(ctx, cx - 2 * u, cy + 0.4 * u, 1.4 * u, 1.4 * u, withAlpha('#ffffff', 0.4));
      break;
    }
    case 'store': {
      ctx.fillStyle = W_;
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + i * 2.094;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.translate(-cx, -cy);
        rect(ctx, cx - 1.1 * u, cy - 6 * u, 2.2 * u, 6 * u, W_);
        ctx.restore();
      }
      circle(ctx, cx, cy, 1.6 * u, '#2450a8');
      break;
    }
    case 'compass': {
      circle(ctx, cx, cy, 6.4 * u, '#22212e'); ringPx(ctx, cx, cy, 6.4 * u, '#6a6478');
      const a = t * 0.35;
      ctx.fillStyle = LB.red; ctx.beginPath();
      ctx.moveTo(cx + Math.sin(a) * 5.4 * u, cy - Math.cos(a) * 5.4 * u);
      ctx.lineTo(cx + Math.cos(a) * 1.8 * u, cy + Math.sin(a) * 1.8 * u);
      ctx.lineTo(cx - Math.cos(a) * 1.8 * u, cy - Math.sin(a) * 1.8 * u); ctx.fill();
      ctx.fillStyle = W_; ctx.beginPath();
      ctx.moveTo(cx - Math.sin(a) * 5.4 * u, cy + Math.cos(a) * 5.4 * u);
      ctx.lineTo(cx + Math.cos(a) * 1.8 * u, cy + Math.sin(a) * 1.8 * u);
      ctx.lineTo(cx - Math.cos(a) * 1.8 * u, cy - Math.sin(a) * 1.8 * u); ctx.fill();
      break;
    }
    default: {
      circle(ctx, cx, cy, 4 * u, W_);
      drawText(ctx, (LB_APP_BY_KEY[key] ? LB_APP_BY_KEY[key].name : '?')[0], cx, cy - 3 * u, K, { align: 'center', scale: Math.max(1, Math.round(s / 12)) });
    }
  }
}

// ---------- the phone itself ----------
class LadybugPhone {
  constructor(backFactory, opts) {
    const r = Game.run;
    this.opts = opts || {};
    this.back = backFactory || (function () { return gameHub(); });
    this.t = 0; this.clockT = 0; this.appT = 0;
    this.left = false;
    // the hardware, centred: a slab about the size of a real one at this scale
    this.P = { x: 364, y: 30, w: 232, h: 480 };
    this.SC = { x: 377, y: 43, w: 206, h: 454 };
    this.mode = 'lock'; this.app = null; this.sub = null;
    this.sel = 0; this.cols = 1; this.page = 0; this.pageK = 0; this.unlockK = 0;
    this.nav = []; this.backRect = null; this.homeRect = null; this.pageRects = [];
    this.scroll = 0; this.msg = null; this.msgT = 0;
    this.drag = null; this.lockSlide = 0;
    // per-app scratch state
    this.feed = 0; this.feedK = 0; this.liked = {};
    this.thread = null; this.typing = 0;
    this.phrase = 0; this.translated = false; this.transK = 0;
    this.filter = 0; this.shot = null; this.camMode = 1;
    this.calc = '0'; this.calcAcc = null; this.calcOp = null;
    this.clockTab = 0; this.swapped = false; this.playing = true;
    this.airplane = false; this.lowpower = false; this.dnd = false;
    if (r) {
      if (r.followers == null) r.followers = 0;
      if (!r.flags) r.flags = {};
      // the battery is a run-long number: it goes down and it never goes up,
      // because you have not seen a plug since the airport
      if (r.phoneBattery == null) r.phoneBattery = clamp(0.94 - (r.day || 0) * 0.13, 0.08, 1);
      this.batt = r.phoneBattery;
    } else this.batt = 0.62;
    this.you = (r && r.members && r.members[0]) || { spec: HERO_PRESETS.buzz, name: 'YOU' };
    Audio.ui('pop');
  }

  // ---- housekeeping
  flash(m) { this.msg = m; this.msgT = 2.8; }
  accent() {
    if (this.mode !== 'app') return LB.gold;
    const A = LB_APP_BY_KEY[this.app];
    return A ? A.col : LB.gold;
  }
  openApp(k) {
    this.app = k; this.mode = 'app'; this.sub = null; this.sel = 0; this.scroll = 0; this.appT = 0;
    // every app declares its own grid width while it draws; until it has drawn
    // once, assume a single column, or the arrow keys inherit the last app's
    // idea of a row and jump four places on the first press
    this.cols = 1;
    if (k === 'camera') this.shot = null;
    Audio.ui('select');
  }
  goBack() {
    if (this.mode === 'lock') { this.leave(); return; }
    if (this.mode === 'app') {
      if (this.sub) { this.sub = null; this.sel = 0; this.scroll = 0; Audio.ui('back'); return; }
      this.app = null; this.mode = 'home'; this.sel = 0; this.scroll = 0; Audio.ui('back'); return;
    }
    this.leave();
  }
  goHome() {
    if (this.mode === 'lock') { this.mode = 'home'; this.sel = 0; Audio.ui('select'); return; }
    if (this.mode === 'app') { this.app = null; this.sub = null; this.mode = 'home'; this.sel = 0; Audio.ui('back'); return; }
    this.leave();
  }
  leave() {
    if (this.left) return; this.left = true;
    if (Game.run) { Game.run.phoneBattery = this.batt; Game.run.save(); }
    Game.go(this.back, 'slideR');
  }
  // Sending an application is the only thing in here that changes the run, so
  // it is the only thing that writes a flag.
  applyJob(j) {
    const r = Game.run; if (!r) return;
    if (!r.flags) r.flags = {};
    if (!r.flags.lbApplied) r.flags.lbApplied = {};
    if (r.flags.lbApplied[j.id]) { Audio.ui('error'); this.flash('ALREADY SENT. NOBODY HAS READ IT.'); return; }
    r.flags.lbApplied[j.id] = true;
    if (j.id === 'beatles') { r.flags.beatlesApplied = true; r.flags.beatlesFound = true; }
    r.save(); Audio.ui('fanfare');
    this.flash('SENT TO ' + j.venue + '. NOW YOU WAIT.');
  }
  callContact(k) {
    const r = Game.run;
    if (!r || !CONTACTS[k]) return;
    if (r.usedContacts.indexOf(k) >= 0) { Audio.ui('error'); this.flash('YOU HAVE ALREADY USED THAT ONE.'); return; }
    r.usedContacts.push(k);
    const lines = [];
    CONTACTS[k].use(r, function (m) { lines.push(m); });
    Audio.ui('fanfare'); r.save();
    this.flash(String(lines.join(' ')).toUpperCase().slice(0, 62));
  }

  // ---- loop
  update(dt) {
    this.t += dt; this.clockT += dt; this.appT += dt;
    this.msgT = Math.max(0, this.msgT - dt);
    this.unlockK += ((this.mode === 'lock' ? 0 : 1) - this.unlockK) * Math.min(1, dt * 7);
    this.pageK += (this.page - this.pageK) * Math.min(1, dt * 11);
    this.feedK += (this.feed - this.feedK) * Math.min(1, dt * 9);
    this.transK = this.translated ? Math.min(1, this.transK + dt * 2.2) : 0;
    this.typing += dt;
    if (this.shot != null) this.shot += dt;
    // it drains while you look at it. that is what they do.
    this.batt = Math.max(0.03, this.batt - dt * 0.0017);
    if (Game.run) Game.run.phoneBattery = this.batt;
    if (this.lockSlide > 0 && !this.drag) this.lockSlide = Math.max(0, this.lockSlide - dt * 300);
  }

  // ---- input. Every view builds this.nav during draw, so one set of keys
  // drives all twenty-odd screens without any of them knowing about it.
  key(code) {
    if (code === 'Escape' || code === 'KeyP') { this.goBack(); return; }
    if (code === 'Backspace') { this.goBack(); return; }
    if (this.mode === 'lock') {
      // the cards are selectable on the lock screen too, because that is the
      // fastest way into the one app that matters
      if (code === 'ArrowDown' || code === 'KeyS') { if (this.nav.length) { this.sel = Math.min(this.nav.length - 1, this.sel + 1); Audio.ui('move'); } return; }
      if (code === 'ArrowUp' || code === 'KeyW') { if (this.sel > 0) { this.sel -= 1; Audio.ui('move'); } else this.goHome(); return; }
      if (code === 'Enter' && this.nav.length) { this.fire(Math.min(this.sel, this.nav.length - 1)); return; }
      if (['Enter', 'Space', 'KeyZ'].indexOf(code) >= 0) { this.goHome(); return; }
      return;
    }
    const n = this.nav.length;
    if (code === 'KeyH') { this.goHome(); return; }
    if (!n) return;
    const cols = Math.max(1, this.cols);
    if (code === 'ArrowRight' || code === 'KeyD') {
      if (this.mode === 'home' && cols > 1 && (this.sel % cols === cols - 1 || this.sel === n - 1) && this.page === 0) { this.page = 1; this.sel = 0; Audio.ui('move'); return; }
      this.sel = (this.sel + 1) % n; Audio.ui('move'); return;
    }
    if (code === 'ArrowLeft' || code === 'KeyA') {
      if (this.mode === 'home' && this.sel % cols === 0 && this.page === 1) { this.page = 0; this.sel = 0; Audio.ui('move'); return; }
      this.sel = (this.sel - 1 + n) % n; Audio.ui('move'); return;
    }
    if (code === 'ArrowDown' || code === 'KeyS') { this.sel = Math.min(n - 1, this.sel + cols); Audio.ui('move'); return; }
    if (code === 'ArrowUp' || code === 'KeyW') { this.sel = Math.max(0, this.sel - cols); Audio.ui('move'); return; }
    if (['Enter', 'Space', 'KeyZ'].indexOf(code) >= 0) { this.fire(this.sel); return; }
  }
  keyUp() {}
  fire(i) {
    const it = this.nav[i];
    if (!it || !it.go) { Audio.ui('error'); return; }
    it.go();
  }
  hit(list, x, y) {
    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
    }
    return -1;
  }
  pointerDown(x, y, id) {
    const S = this.SC;
    // outside the glass is the shelf, and tapping the shelf puts it away
    if (x < this.P.x - 16 || x > this.P.x + this.P.w + 16 || y < this.P.y - 30 || y > this.P.y + this.P.h + 26) { this.leave(); return; }
    if (this.backRect && this.hit([this.backRect], x, y) === 0) { this.goBack(); return; }
    if (this.homeRect && this.hit([this.homeRect], x, y) === 0) { this.goHome(); return; }
    const pd = this.hit(this.pageRects, x, y);
    if (pd >= 0) { this.page = pd; this.sel = 0; Audio.ui('move'); return; }
    const n = this.hit(this.nav, x, y);
    if (n >= 0) { this.sel = n; this.fire(n); return; }
    // a swipe up off the lock screen, or sideways across the home screen
    if (this.mode === 'lock') { this.drag = { x: x, y: y, id: id }; return; }
    if (this.mode === 'home') this.drag = { x: x, y: y, id: id, page: true };
  }
  pointerMove(x, y, id) {
    if (!this.drag || this.drag.id !== id) return;
    if (this.mode === 'lock') this.lockSlide = clamp(this.drag.y - y, 0, 140);
  }
  pointerUp(x, y, id) {
    if (!this.drag || this.drag.id !== id) { this.drag = null; return; }
    const d = this.drag; this.drag = null;
    if (this.mode === 'lock') {
      if (this.lockSlide > 26 || Math.abs(d.y - y) < 8) { this.lockSlide = 0; this.goHome(); }
      else this.lockSlide = 0;
      return;
    }
    if (d.page && Math.abs(d.x - x) > 34) {
      const np = clamp(this.page + (d.x > x ? 1 : -1), 0, 1);
      if (np !== this.page) { this.page = np; this.sel = 0; Audio.ui('move'); }
    }
  }
  click(x, y) { this.pointerDown(x, y, 991); this.pointerUp(x, y, 991); }
  hover(x, y) {
    if (this.mode === 'lock') return;
    const n = this.hit(this.nav, x, y);
    if (n >= 0) this.sel = n;
  }
  isPlaying() { return false; }

  // ---------- the scene around the phone ----------
  draw(ctx) {
    const acc = this.accent();
    this.drawRoom(ctx, acc);
    this.drawHardware(ctx, acc);
    this.drawAnnotations(ctx);
    // a message from the phone to you, under it, where the thumb is
    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = Math.min(W - 60, textWidth(this.msg, { font: 'small' }) + 24);
      lbRound(ctx, W / 2 - w2 / 2, H - 34, w2, 18, 9, 'rgba(10,26,16,0.92)');
      lbRoundOutline(ctx, W / 2 - w2 / 2, H - 34, w2, 18, 9, '#6be585');
      drawText(ctx, this.msg, W / 2, H - 28, '#6be585', { align: 'center', font: 'small' });
      ctx.globalAlpha = 1;
    } else {
      drawText(ctx, Game.touch ? 'TAP THE SHELF TO PUT IT AWAY' : 'ESC - PUT IT AWAY    ARROWS + ENTER    H - HOME',
        W / 2, H - 28, '#4a4468', { align: 'center', font: 'small' });
    }
  }

  // ---------- the room ----------
  // You are not anywhere. You are in a pod on the fourth floor with a laminate
  // wall eighteen inches from your face, a reading lamp on a hinge, a shelf the
  // width of a forearm, and a socket you have nothing to put in it. All of the
  // light in here comes from two places and both of them are things you own.
  drawRoom(ctx, acc) {
    const t = this.t, sh = H - 44;                 // sh: the top of the shelf
    // the bulb is cheap and the wiring is worse, so it never sits quite still
    const lamp = 0.86 + 0.14 * Math.sin(t * 2.3) + (Math.sin(t * 27) > 0.94 ? -0.18 : 0);
    // ---- the laminate wall, which is printed wood over printed wood
    vgrad(ctx, 0, 0, W, sh, '#1a1526', '#0c0a14');
    const rr = makeRng(4242);
    for (let y = 26; y < sh; y += 54) {
      rect(ctx, 0, y, W, 1, '#241d33');
      rect(ctx, 0, y + 1, W, 1, '#0a0812');
      // the fake grain: short broken strokes, never a full line
      for (let i = 0; i < 26; i++) { const gx = rr.int(0, W - 40); ctx.globalAlpha = 0.05; rect(ctx, gx, y + rr.int(4, 48), rr.int(14, 40), 1, '#9a8fb8'); ctx.globalAlpha = 1; }
    }
    // two panel joins, because the wall came in sheets
    for (const jx of [232, 712]) { rect(ctx, jx, 0, 1, sh, '#0a0812'); rect(ctx, jx + 1, 0, 1, sh, '#2a2340'); }
    // the dust that only shows up when a screen is on
    for (let i = 0; i < 80; i++) { ctx.globalAlpha = 0.05; px(ctx, rr.int(0, W), rr.int(0, sh), '#8a84c0'); ctx.globalAlpha = 1; }
    // ---- the reading lamp, clipped to the shelf above, pointing down-right
    const lx = 96, ly = 44;
    ctx.globalAlpha = 0.1 * lamp; ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.moveTo(lx + 4, ly + 16); ctx.lineTo(lx + 30, ly + 12); ctx.lineTo(360, sh + 6); ctx.lineTo(96, sh + 6); ctx.fill();
    ctx.globalAlpha = 1;
    rect(ctx, lx - 6, 0, 5, ly - 4, '#2a2434'); rect(ctx, lx - 6, 0, 2, ly - 4, '#3f3752');   // the stalk
    rect(ctx, lx - 14, ly - 8, 22, 5, '#3a3346'); rect(ctx, lx - 14, ly - 8, 22, 2, '#544a68'); // the hinge
    ctx.fillStyle = '#2e2740'; ctx.beginPath();
    ctx.moveTo(lx - 12, ly - 4); ctx.lineTo(lx + 16, ly - 4); ctx.lineTo(lx + 30, ly + 14); ctx.lineTo(lx + 2, ly + 14); ctx.fill();
    rect(ctx, lx - 11, ly - 4, 26, 2, '#4a4162');
    rect(ctx, lx + 3, ly + 12, 26, 3, '#ffe9a8');          // the bulb, seen edge on
    ctx.globalAlpha = 0.28 * lamp; ellipsePx(ctx, lx + 16, ly + 14, 26, 14, '#ffd24a'); ctx.globalAlpha = 1;
    // ---- the socket with nothing in it
    const px0 = 664, py0 = 296;
    rect(ctx, px0, py0, 34, 40, '#26202f'); rect(ctx, px0, py0, 34, 2, '#3e3550');
    rect(ctx, px0, py0 + 38, 34, 2, '#0c0a14');
    frame(ctx, px0 + 3, py0 + 3, 28, 34, '#191426');
    rect(ctx, px0 + 10, py0 + 12, 4, 9, '#0a0810'); rect(ctx, px0 + 20, py0 + 12, 4, 9, '#0a0810');
    rect(ctx, px0 + 15, py0 + 25, 4, 6, '#0a0810');
    drawText(ctx, '100V', px0 + 17, py0 + 42, '#38304a', { align: 'center', font: 'small' });
    // ---- the glow the screen throws back into the room
    ctx.globalAlpha = 0.1; ellipsePx(ctx, 480, 268, 300, 320, acc); ctx.globalAlpha = 1;
    // ---- the shelf: a lip, a top, a shadowed underside
    rect(ctx, 0, sh, W, 44, '#1d1729');
    rect(ctx, 0, sh, W, 3, '#3a3350');
    ctx.globalAlpha = 0.07; rect(ctx, 0, sh + 3, W, 10, '#ffffff'); ctx.globalAlpha = 1;
    rect(ctx, 0, sh + 16, W, 2, '#120e1c');                // the front lip
    rect(ctx, 0, sh + 18, W, 26, '#150f20');
    for (let x = 0; x < W; x += 96) { ctx.globalAlpha = 0.06; rect(ctx, x + 8, sh + 4, 64, 1, '#b8aee0'); ctx.globalAlpha = 1; }
    // the two light pools on it: the lamp, warm, and the phone, whatever colour
    ctx.globalAlpha = 0.12 * lamp; ellipsePx(ctx, 200, sh + 6, 150, 16, '#ffd24a'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.16; ellipsePx(ctx, 480, sh + 6, 190, 18, acc); ctx.globalAlpha = 1;
    // ---- what else is on the shelf, to the right, where the thumb is not
    // a can, gone warm hours ago
    rect(ctx, 792, sh - 34, 20, 34, '#3f6a4c'); rect(ctx, 792, sh - 34, 20, 3, '#6fa87c');
    rect(ctx, 792, sh - 34, 4, 34, '#5a8f68'); rect(ctx, 808, sh - 34, 4, 34, '#2a4a34');
    rect(ctx, 794, sh - 38, 16, 4, '#9aa4ae'); rect(ctx, 794, sh - 39, 16, 1, '#cfd6de');
    rect(ctx, 795, sh - 22, 14, 7, '#e8e2d2'); rect(ctx, 796, sh - 20, 5, 3, '#3f6a4c');
    ctx.globalAlpha = 0.3; ellipsePx(ctx, 802, sh + 2, 16, 4, '#000000'); ctx.globalAlpha = 1;
    // a cable, coiled, with nothing on the end of it
    ringPx(ctx, 866, sh - 8, 16, '#1e1a28'); ringPx(ctx, 866, sh - 8, 15, '#2e2840');
    ringPx(ctx, 866, sh - 8, 10, '#1e1a28'); ringPx(ctx, 866, sh - 8, 9, '#2e2840');
    rect(ctx, 880, sh - 12, 10, 7, '#3a3346'); rect(ctx, 880, sh - 12, 10, 2, '#544a68');
    // two coins nobody is going to spend
    for (let i = 0; i < 2; i++) { const cx = 744 + i * 13, cy = sh - 3 + i; circle(ctx, cx, cy, 5, '#8a7a4a'); circle(ctx, cx, cy - 1, 4, '#c8a03a'); circle(ctx, cx, cy - 1, 1, '#6a5420'); }
    // ---- the room closes in at the edges
    vignette(ctx, 0.5);
  }

  // ---------- the case ----------
  // A ladybug, in three parts: a black head bumper at the top, a red shell
  // round the sides and the bottom, and six legs holding on. The phone is the
  // black thing it has swallowed.
  drawHardware(ctx, acc) {
    const P = this.P, S = this.SC, t = this.t;
    const cx = P.x - 12, cy = P.y - 26, cw = P.w + 24, ch = P.h + 40;
    const mid = cx + cw / 2;
    // ---- the shadow on the shelf
    lbRound(ctx, cx + 6, cy + 10, cw, ch, 30, 'rgba(3,2,8,0.55)');
    // ---- the legs, drawn first so the shell sits over the knuckles
    for (let i = 0; i < 3; i++) {
      const ly = cy + 110 + i * 116;
      for (const d of [-1, 1]) {
        const lx = d < 0 ? cx : cx + cw;
        // thigh, shin, foot: three segments and a highlight on each
        rect(ctx, lx + d * 2 - (d < 0 ? 16 : 0), ly, 18, 7, '#15121c');
        rect(ctx, lx + d * 2 - (d < 0 ? 16 : 0), ly, 18, 2, '#332c40');
        rect(ctx, lx + d * 16 - (d < 0 ? 7 : 0), ly + 5, 7, 20, '#15121c');
        rect(ctx, lx + d * 16 - (d < 0 ? 7 : 0), ly + 5, 2, 20, '#332c40');
        rect(ctx, lx + d * 20 - (d < 0 ? 11 : 0), ly + 22, 12, 6, '#0d0b12');
      }
    }
    // ---- the head bumper
    lbRound(ctx, cx, cy, cw, 58, 26, '#15121c');
    lbRound(ctx, cx + 2, cy + 2, cw - 4, 16, 14, '#2a2434');
    ctx.globalAlpha = 0.22; lbRound(ctx, cx + 6, cy + 4, cw - 12, 10, 5, '#ffffff'); ctx.globalAlpha = 1;
    // the two white dots every ladybug head has, and the shine in them
    for (const d of [-1, 1]) {
      const ex = mid + d * Math.round(cw * 0.23);
      circle(ctx, ex, cy + 30, 11, '#f4f1ea');
      circle(ctx, ex, cy + 30, 9, '#e6e0d2');
      circle(ctx, ex - 3, cy + 27, 3, '#ffffff');
      circle(ctx, ex + d * 2, cy + 33, 3, '#bdb6a8');
    }
    // ---- the shell
    lbRound(ctx, cx, cy + 40, cw, ch - 40, 26, LB.shellLo);
    lbRound(ctx, cx + 1, cy + 41, cw - 2, ch - 43, 25, LB.shellRed);
    ctx.save(); lbRoundClip(ctx, cx + 1, cy + 41, cw - 2, ch - 43, 25);
    vgrad(ctx, cx, cy + 40, cw, ch - 40, LB.shellHi, '#8a1612');
    // the gloss: one hard diagonal band, the way plastic catches a window
    ctx.globalAlpha = 0.16; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(cx + 10, cy + ch); ctx.lineTo(cx + 44, cy + ch); ctx.lineTo(cx + cw, cy + 46); ctx.lineTo(cx + cw - 40, cy + 46); ctx.fill();
    ctx.globalAlpha = 1;
    // the spots. Placed round the border, because the middle is all phone.
    const spots = [[0.13, 0.17, 13], [0.87, 0.2, 12], [0.09, 0.44, 10], [0.91, 0.47, 11],
      [0.14, 0.72, 12], [0.86, 0.75, 10], [0.31, 0.93, 13], [0.69, 0.93, 12], [0.5, 0.97, 9]];
    for (const sp of spots) {
      const sx = cx + cw * sp[0], sy = cy + 40 + (ch - 40) * sp[1];
      circle(ctx, sx, sy, sp[2], '#12101a');
      ctx.globalAlpha = 0.3; circle(ctx, sx - 2, sy - 3, Math.round(sp[2] * 0.4), '#4a4258'); ctx.globalAlpha = 1;
    }
    // the seam down the elytra, only visible below the phone
    rect(ctx, mid - 1, P.y + P.h + 4, 2, 24, '#7a1210');
    rect(ctx, mid + 1, P.y + P.h + 4, 1, 24, '#e8483a');
    ctx.restore();
    // ---- the camera hole in the case, ringed in gold that is not gold
    const camx = cx + 30, camy = cy + 74;
    ringPx(ctx, camx, camy, 15, '#8a6a1a'); ringPx(ctx, camx, camy, 14, LB.gold);
    ringPx(ctx, camx, camy, 13, '#8a6a1a');
    circle(ctx, camx, camy, 11, '#0a0910');
    circle(ctx, camx, camy, 7, '#151a2c');
    circle(ctx, camx - 2, camy - 2, 3, '#4a86f7');
    px(ctx, camx - 3, camy - 3, '#cfe4ff');
    circle(ctx, camx + 16, camy + 16, 3, '#2a2434');
    // ---- the buttons on the edge, moulded through the case
    rect(ctx, cx + cw - 3, cy + 176, 5, 46, '#1d1a26'); rect(ctx, cx + cw - 3, cy + 176, 5, 2, '#443c54');
    rect(ctx, cx - 2, cy + 156, 5, 30, '#1d1a26'); rect(ctx, cx - 2, cy + 156, 5, 2, '#443c54');
    rect(ctx, cx - 2, cy + 194, 5, 30, '#1d1a26'); rect(ctx, cx - 2, cy + 194, 5, 2, '#443c54');
    rect(ctx, cx - 2, cy + 120, 5, 16, '#1d1a26');
    // ---- the light off the glass, spilling onto the shell round the phone
    ctx.globalAlpha = 0.16; lbRound(ctx, P.x - 13, P.y - 13, P.w + 26, P.h + 26, 28, acc); ctx.globalAlpha = 1;
    // ---- the phone: a black slab in a black bezel
    lbRound(ctx, P.x, P.y, P.w, P.h, 22, '#07060c');
    lbRoundOutline(ctx, P.x, P.y, P.w, P.h, 22, '#39344a');
    lbRoundOutline(ctx, P.x + 1, P.y + 1, P.w - 2, P.h - 2, 21, '#15131d');
    lbRound(ctx, S.x - 2, S.y - 2, S.w + 4, S.h + 4, 15, '#04040a');
    // ---- the screen
    ctx.save(); lbRoundClip(ctx, S.x, S.y, S.w, S.h, 14);
    this.drawScreen(ctx, S);
    // a thin sheet of glare over all of it
    ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(S.x, S.y + S.h * 0.8); ctx.lineTo(S.x + S.w * 0.72, S.y); ctx.lineTo(S.x + S.w, S.y); ctx.lineTo(S.x, S.y + S.h); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
    // ---- the island, which is a hole in the screen, so it goes on last
    lbRound(ctx, S.x + S.w / 2 - 34, S.y + 5, 68, 16, 8, '#04040a');
    circle(ctx, S.x + S.w / 2 + 23, S.y + 13, 4, '#0d1018');
    circle(ctx, S.x + S.w / 2 + 23, S.y + 13, 2, '#1e2a44');
    px(ctx, S.x + S.w / 2 + 22, S.y + 12, '#4a86f7');
    rect(ctx, S.x + S.w / 2 - 22, S.y + 11, 20, 3, '#0f1118');
  }

  // A little exploded-diagram labelling round the edges, because the thing
  // deserves a spec sheet and the screen has room for one.
  drawAnnotations(ctx) {
    const P = this.P, t = this.t;
    const rows = [
      { side: -1, y: 92, top: 'GLOSS SHELL', bot: 'FREE WITH THE PHONE' },
      { side: -1, y: 236, top: 'SIX LEGS', bot: 'ONE OF THEM IS LOOSE' },
      { side: -1, y: 380, top: 'VOLUME', bot: 'STUCK ON LOUD' },
      { side: 1, y: 92, top: 'GOLD RING', bot: 'NOT GOLD' },
      { side: 1, y: 236, top: 'LADYBUG 11', bot: '128 GB - ' + Math.round(this.batt * 100) + '% BATTERY' },
      { side: 1, y: 380, top: 'SIDE BUTTON', bot: 'ALSO THE TORCH' },
    ];
    for (const r of rows) {
      const x = r.side < 0 ? 44 : W - 44;
      const ax = r.side < 0 ? 148 : W - 148;   // start the leader where the label stops
      const ex = r.side < 0 ? P.x - 18 : P.x + P.w + 18;
      ctx.globalAlpha = 0.5;
      dashedLine(ctx, ax, r.y, ex, r.y, '#4a4468', 3, 4, Math.floor(t * 8));
      rect(ctx, ex - (r.side < 0 ? 0 : 3), r.y - 1, 3, 3, '#6a6488');
      ctx.globalAlpha = 1;
      drawText(ctx, r.top, x, r.y - 9, '#8a84a8', { align: r.side < 0 ? 'left' : 'right', font: 'small' });
      drawText(ctx, r.bot, x, r.y - 1, '#4a4468', { align: r.side < 0 ? 'left' : 'right', font: 'small' });
    }
    drawText(ctx, 'THE LADYBUG 11', 44, H - 84, '#c8402c', { scale: 2 });
    drawText(ctx, 'IT IS A CASE. THERE IS A PHONE IN IT.', 44, H - 68, '#4a4468', { font: 'small' });
  }

  // ---------- the glass ----------
  body() { const S = this.SC; return { x: S.x, y: S.y + 22, w: S.w, h: S.h - 22 - 16 }; }
  drawScreen(ctx, S) {
    this.nav = []; this.backRect = null; this.homeRect = null; this.pageRects = [];
    const t = this.t;
    if (this.mode === 'lock') { this.drawLock(ctx, S); this.drawStatus(ctx, S, true); return; }
    if (this.mode === 'home') { this.drawHome(ctx, S); this.drawStatus(ctx, S, false); this.drawIndicator(ctx, S); this.drawSel(ctx); return; }
    // an app: wallpaper goes black, the app owns the glass
    rect(ctx, S.x, S.y, S.w, S.h, LB.ink);
    const B = this.body();
    switch (this.app) {
      case 'notes': this.appNotes(ctx, B); break;
      case 'jobs': this.appJobs(ctx, B); break;
      case 'tikbug': this.appTikbug(ctx, B); break;
      case 'messages': this.appMessages(ctx, B); break;
      case 'maps': this.appMaps(ctx, B); break;
      case 'translate': this.appTranslate(ctx, B); break;
      case 'wallet': this.appWallet(ctx, B); break;
      case 'weather': this.appWeather(ctx, B); break;
      case 'clock': this.appClock(ctx, B); break;
      case 'camera': this.appCamera(ctx, B); break;
      case 'settings': this.appSettings(ctx, B); break;
      case 'music': this.appMusic(ctx, B); break;
      case 'contacts': this.appContacts(ctx, B); break;
      case 'band': this.appBand(ctx, B); break;
      case 'mail': this.appMail(ctx, B); break;
      case 'calendar': this.appCalendar(ctx, B); break;
      case 'photos': this.appPhotos(ctx, B); break;
      case 'ramen': this.appRamen(ctx, B); break;
      case 'calc': this.appCalc(ctx, B); break;
      case 'steps': this.appSteps(ctx, B); break;
      case 'store': this.appStore(ctx, B); break;
      case 'compass': this.appCompass(ctx, B); break;
      case 'phone': this.appDialer(ctx, B); break;
      case 'browser': this.appBrowser(ctx, B); break;
      default: this.appBlank(ctx, B); break;
    }
    this.drawStatus(ctx, S, false);
    this.drawIndicator(ctx, S);
    this.drawSel(ctx);
  }
  // The header every app wears: a back chevron, a title, and a hairline in the
  // app's own colour so you always know which one you are in.
  header(ctx, B, title, right) {
    const A = LB_APP_BY_KEY[this.app] || { col: LB.gold };
    const y = B.y, h = 28;
    rect(ctx, B.x, y, B.w, h, '#14131c');
    rect(ctx, B.x, y + h - 1, B.w, 1, withAlpha(A.col, 0.75));
    this.backRect = { x: B.x, y: y, w: 34, h: h };
    lbChevron(ctx, B.x + 13, y + h / 2, -1, A.col, 4);
    drawText(ctx, title, B.x + B.w / 2, y + 10, LB.cream, { align: 'center', scale: 2 });
    if (right) drawText(ctx, right, B.x + B.w - 8, y + 12, withAlpha(A.col, 0.9), { align: 'right', font: 'small' });
    return y + h;
  }
  // The selection ring. It only shows on a keyboard, because on a touch screen
  // there is nothing to move around with.
  drawSel(ctx) {
    if (Game.touch || !this.nav.length) return;
    const r = this.nav[Math.min(this.sel, this.nav.length - 1)];
    if (!r || r.nosel) return;
    ctx.globalAlpha = 0.55 + 0.35 * Math.sin(this.t * 5);
    lbRoundOutline(ctx, r.x - 2, r.y - 2, r.w + 4, r.h + 4, r.r != null ? r.r + 2 : 6, '#ffffff');
    ctx.globalAlpha = 1;
  }
  drawIndicator(ctx, S) {
    const y = S.y + S.h - 11;
    this.homeRect = { x: S.x + S.w / 2 - 44, y: y - 7, w: 88, h: 16 };
    lbRound(ctx, S.x + S.w / 2 - 36, y, 72, 4, 2, withAlpha('#ffffff', 0.72));
  }

  // ---------- the status bar ----------
  drawStatus(ctx, S, big) {
    const c = lbClockOf(this.clockT);
    const y = S.y + 6, ink = LB.cream;
    // the network: four bars, the letters, the fan, and the battery
    drawText(ctx, c.text, S.x + 9, y + 1, ink, { font: 'small' });
    drawText(ctx, lbCarrier(), S.x + 9, y + 9, withAlpha('#ffffff', 0.5), { font: 'small' });
    let rx = S.x + S.w - 9;
    rx -= 22; lbBatteryIcon(ctx, rx, y - 1, this.batt, ink);
    rx -= 22; drawText(ctx, Math.round(this.batt * 100) + '%', rx + 18, y + 1, this.batt < 0.2 ? LB.red : withAlpha('#ffffff', 0.7), { align: 'right', font: 'small' });
    rx -= 15; lbWifi(ctx, rx, y, ink);
    rx -= 13; drawText(ctx, '5G', rx, y + 1, ink, { font: 'small' });
    rx -= 19; lbBars(ctx, rx, y - 1, 3 + (Math.floor(this.t * 0.4) % 2), ink);
  }

  // ---------- the wallpaper ----------
  // A photo somebody took out of a train window. It is the only picture on the
  // phone that is not of the band.
  wallpaper(ctx, S, dim) {
    vgrad(ctx, S.x, S.y, S.w, S.h, '#1b1636', '#4a2a50');
    const r = makeRng(9021);
    for (let i = 0; i < 40; i++) { const sx = S.x + r.int(0, S.w), sy = S.y + r.int(0, 150); ctx.globalAlpha = 0.5; px(ctx, sx, sy, '#cfc9e6'); ctx.globalAlpha = 1; }
    circle(ctx, S.x + 152, S.y + 78, 17, '#f4f0d8');
    circle(ctx, S.x + 160, S.y + 72, 15, '#2a2044');
    // a skyline: towers, then the near block, then the road
    const sky = function (yBase, col, lit, n, seed, wmin, wmax) {
      const rr = makeRng(seed);
      let x = S.x - 10;
      while (x < S.x + S.w + 10) {
        const bw = rr.int(wmin, wmax), bh = rr.int(30, 120);
        rect(ctx, x, yBase - bh, bw, bh, col);
        rect(ctx, x, yBase - bh, bw, 2, lighten(col, 0.16));
        for (let wy = yBase - bh + 6; wy < yBase - 6; wy += 9)
          for (let wx = x + 3; wx < x + bw - 4; wx += 7)
            if (rr.chance(0.42)) rect(ctx, wx, wy, 3, 4, lit);
        x += bw + rr.int(1, 4);
      }
    };
    sky(S.y + 268, '#241d3a', '#ffd9a0', 0, 771, 18, 34);
    sky(S.y + 316, '#160f28', '#ffe6b0', 0, 313, 26, 46);
    // the road, wet, with the lights doubled in it
    rect(ctx, S.x, S.y + 316, S.w, S.h - 316, '#0d0a18');
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 9; i++) rect(ctx, S.x, S.y + 322 + i * 12, S.w, 3, '#ffb060');
    ctx.globalAlpha = 1;
    for (let i = 0; i < 5; i++) rect(ctx, S.x + 14 + i * 44, S.y + 344, 22, 3, withAlpha('#f4f1ea', 0.3));
    // and you, very small, at the bottom of it
    if (this.you && this.you.spec) {
      ctx.globalAlpha = 0.9;
      drawBugAt(ctx, this.you.spec, S.x + S.w * 0.5, S.y + S.h - 46, { pose: 'idle', scale: 1.5, bounce: 0.3, phase: 1.2 });
      ctx.globalAlpha = 1;
    }
    if (dim) { ctx.globalAlpha = dim; rect(ctx, S.x, S.y, S.w, S.h, '#08060f'); ctx.globalAlpha = 1; }
  }

  // ---------- the lock screen ----------
  lockCards() {
    const r = Game.run, out = [];
    if (!r) return out;
    const goals = (r.goals || []).filter(function (g) { return !g.done; });
    if (goals.length) out.push({ app: 'notes', title: 'NOTES', head: 'TODAY, ' + goals.length + ' LEFT', body: lbGoalText(goals[0]), t: '07:02' });
    out.push({ app: 'jobs', title: 'BUGSEEK', head: LB_JOBS.length + ' ROLES NEAR YOU', body: 'THE BEATLES, SHIMOKITAZAWA - LIVE MUSIC', t: '06:48' });
    const un = (r.contacts || []).filter(function (k) { return r.usedContacts.indexOf(k) < 0; });
    if (un.length) out.push({ app: 'contacts', title: 'CONTACTS', head: un.length + ' NEW NUMBER' + (un.length > 1 ? 'S' : ''), body: 'SOMEBODY WROTE IT ON SOMETHING.', t: 'YESTERDAY' });
    out.push({ app: 'tikbug', title: 'TIKBUG', head: fmtNum(r.followers || 0) + ' FOLLOWERS', body: (r.followers ? 'YOUR LAST CLIP IS STILL GOING.' : 'NOBODY HAS SEEN YOU YET.'), t: '02:14' });
    if (this.batt < 0.25) out.push({ app: 'settings', title: 'BATTERY', head: Math.round(this.batt * 100) + '% LEFT', body: 'LOW POWER MODE IS ON. IT DOES NOT HELP.', t: 'NOW' });
    return out.slice(0, 4);
  }
  drawLock(ctx, S) {
    const c = lbClockOf(this.clockT), t = this.t;
    const lift = Math.round(this.lockSlide + this.unlockK * 200);
    this.wallpaper(ctx, S, 0.22);
    ctx.save();
    ctx.globalAlpha = clamp(1 - this.unlockK * 1.4, 0, 1);
    ctx.translate(0, -lift);
    // the clock, which is the only thing on this screen anybody reads
    drawText(ctx, c.date, S.x + S.w / 2, S.y + 42, withAlpha('#ffffff', 0.75), { align: 'center', font: 'small' });
    drawText(ctx, c.text, S.x + S.w / 2, S.y + 56, '#ffffff', { align: 'center', scale: 8, shadow: 'rgba(0,0,0,0.5)' });
    drawText(ctx, 'DAY ' + Math.min(5, ((Game.run && Game.run.day) || 0) + 1) + ' OF 5', S.x + S.w / 2, S.y + 122, LB.gold, { align: 'center', font: 'small' });
    // the cards, stacked, newest at the top
    const cards = this.lockCards();
    let y = S.y + 152;
    for (let i = 0; i < cards.length; i++) {
      const k = cards[i], h = 52;
      const self = this;
      this.nav.push({ x: S.x + 10, y: y, w: S.w - 20, h: h, r: 12, go: function () { self.mode = 'home'; self.unlockK = 0.9; self.openApp(k.app); } });
      lbCard(ctx, S.x + 10, y, S.w - 20, h, 12, 'rgba(28,26,42,0.88)', { edge: withAlpha('#ffffff', 0.12) });
      ladybugIcon(ctx, S.x + 18, y + 9, 22, k.app, t);
      drawText(ctx, k.title, S.x + 46, y + 9, withAlpha('#ffffff', 0.7), { font: 'small' });
      drawText(ctx, k.t, S.x + S.w - 18, y + 9, withAlpha('#ffffff', 0.4), { align: 'right', font: 'small' });
      drawText(ctx, k.head, S.x + 46, y + 20, LB.cream, { scale: 1 });
      drawWrapped(ctx, k.body, S.x + 46, y + 32, 34, withAlpha('#ffffff', 0.62), 8, { font: 'small' });
      y += h + 7;
    }
    // the torch and the camera, which every lock screen has and nobody presses
    const by = S.y + S.h - 56;
    for (let i = 0; i < 2; i++) {
      const bx = S.x + (i ? S.w - 54 : 22);
      circle(ctx, bx + 16, by + 16, 16, 'rgba(20,18,30,0.8)');
      ringPx(ctx, bx + 16, by + 16, 16, withAlpha('#ffffff', 0.2));
      if (i) { rect(ctx, bx + 9, by + 12, 14, 10, LB.cream); rect(ctx, bx + 13, by + 9, 6, 3, LB.cream); circle(ctx, bx + 16, by + 17, 4, '#2a2d36'); }
      else { ctx.fillStyle = LB.cream; ctx.beginPath(); ctx.moveTo(bx + 12, by + 9); ctx.lineTo(bx + 20, by + 9); ctx.lineTo(bx + 18, by + 14); ctx.lineTo(bx + 14, by + 14); ctx.fill(); rect(ctx, bx + 14, by + 15, 4, 8, LB.cream); }
    }
    // swipe up
    const bob = Math.round(Math.sin(t * 3) * 2);
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
    lbChevron(ctx, S.x + S.w / 2, S.y + S.h - 26 + bob, 0, LB.cream, 1);
    for (let i = 0; i < 5; i++) { rect(ctx, S.x + S.w / 2 - 5 + i, S.y + S.h - 30 + Math.abs(i - 2) + bob, 2, 2, LB.cream); }
    drawText(ctx, Game.touch ? 'SWIPE UP TO OPEN' : 'PRESS SPACE TO OPEN', S.x + S.w / 2, S.y + S.h - 22 + bob, withAlpha('#ffffff', 0.55), { align: 'center', font: 'small' });
    ctx.globalAlpha = 1;
    ctx.restore();
    if (this.unlockK > 0.02) this.drawSel(ctx);
  }

  // ---------- the home screen ----------
  drawHome(ctx, S) {
    const t = this.t, r = Game.run;
    this.wallpaper(ctx, S, 0.3);
    ctx.globalAlpha = clamp(this.unlockK * 1.6 - 0.2, 0, 1);
    const slide = Math.round((1 - this.unlockK) * 40);
    ctx.save(); ctx.translate(0, slide);
    // ---- the widget: what the day wants from you, without opening anything
    const wx = S.x + 10, wy = S.y + 24;
    lbCard(ctx, wx, wy, S.w - 20, 70, 14, 'rgba(24,22,36,0.86)', { edge: withAlpha('#ffffff', 0.1) });
    drawText(ctx, 'TODAY', wx + 10, wy + 8, LB.gold, { font: 'small' });
    drawText(ctx, fmtMoney(r ? r.money : 0), wx + 10, wy + 18, r && r.money < 10 ? LB.red : LB.green, { scale: 3 });
    drawText(ctx, 'IN THE CASE', wx + 10, wy + 42, withAlpha('#ffffff', 0.45), { font: 'small' });
    const goals = (r && r.goals) || [];
    for (let i = 0; i < 3; i++) {
      const g = goals[i], gy = wy + 10 + i * 17;
      const gx = wx + S.w - 20 - 104;
      if (!g) { drawText(ctx, '- - -', gx, gy + 2, withAlpha('#ffffff', 0.2), { font: 'small' }); continue; }
      lbRound(ctx, gx, gy, 9, 9, 2, g.done ? LB.green : 'rgba(255,255,255,0.14)');
      if (g.done) { line(ctx, gx + 2, gy + 4, gx + 4, gy + 6, '#0d2214'); line(ctx, gx + 4, gy + 6, gx + 7, gy + 2, '#0d2214'); }
      drawText(ctx, String(lbGoalName(g)).slice(0, 15), gx + 14, gy + 2, g.done ? withAlpha('#ffffff', 0.35) : LB.cream, { font: 'small' });
    }
    // ---- the grid
    const apps = lbPageApps(this.page);
    const px0 = S.x + 12, py0 = wy + 80, step = 48, rowH = 60, s = 38;
    this.cols = 4;
    const self = this;
    const shift = Math.round((this.page - this.pageK) * -S.w);
    ctx.save(); ctx.translate(shift, 0);
    apps.forEach(function (a, i) {
      const ix = px0 + (i % 4) * step, iy = py0 + Math.floor(i / 4) * rowH;
      self.nav.push({ x: ix, y: iy, w: s, h: s, r: 9, go: function () { self.openApp(a.key); } });
      ladybugIcon(ctx, ix, iy, s, a.key, t);
      drawText(ctx, a.name, ix + s / 2, iy + s + 4, LB.cream, { align: 'center', font: 'small', shadow: 'rgba(0,0,0,0.6)' });
      const b = self.badge(a.key);
      if (b) { circle(ctx, ix + s - 3, iy + 3, 8, LB.red); ringPx(ctx, ix + s - 3, iy + 3, 8, '#ffd0c8'); drawText(ctx, String(b).slice(0, 2), ix + s - 3, iy, '#fff4e8', { align: 'center', font: 'small' }); }
    });
    ctx.restore();
    // ---- the page dots
    const dy = S.y + 366;
    for (let i = 0; i < 2; i++) {
      const dx = S.x + S.w / 2 - 8 + i * 12;
      this.pageRects.push({ x: dx - 6, y: dy - 5, w: 14, h: 14 });
      circle(ctx, dx, dy, 3, i === this.page ? LB.cream : withAlpha('#ffffff', 0.3));
    }
    // ---- the dock
    const dkx = S.x + 10, dky = S.y + 382;
    lbRound(ctx, dkx, dky, S.w - 20, 56, 17, 'rgba(26,24,40,0.72)');
    lbRoundOutline(ctx, dkx, dky, S.w - 20, 56, 17, withAlpha('#ffffff', 0.1));
    LB_DOCK.forEach(function (a, i) {
      const ix = px0 + i * step, iy = dky + 9;
      self.nav.push({ x: ix, y: iy, w: s, h: s, r: 9, go: function () { self.openApp(a.key); } });
      ladybugIcon(ctx, ix, iy, s, a.key, t);
      const b = self.badge(a.key);
      if (b) { circle(ctx, ix + s - 3, iy + 3, 8, LB.red); ringPx(ctx, ix + s - 3, iy + 3, 8, '#ffd0c8'); drawText(ctx, String(b).slice(0, 2), ix + s - 3, iy, '#fff4e8', { align: 'center', font: 'small' }); }
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // the little red numbers, which are the only reason anybody opens anything
  badge(k) {
    const r = Game.run; if (!r) return 0;
    if (k === 'contacts') return (r.contacts || []).filter(function (c) { return r.usedContacts.indexOf(c) < 0; }).length;
    if (k === 'notes') return (r.goals || []).filter(function (g) { return !g.done; }).length;
    if (k === 'jobs') return (r.flags && r.flags.lbApplied) ? 0 : LB_JOBS.length;
    if (k === 'mail') return LB_MAIL.filter(function (m) { return m.unread; }).length;
    if (k === 'messages') return this.threads().filter(function (th) { return th.unread; }).length;
    return 0;
  }

  // ---------- NOTES ----------
  // The three things the day wants, on the back of an envelope, in your own
  // handwriting, which is to say in the only font this phone has.
  appNotes(ctx, B) {
    const r = Game.run, t = this.t;
    const y0 = this.header(ctx, B, 'NOTES', 'TODAY');
    rect(ctx, B.x, y0, B.w, B.h - 28, LB.paper);
    ctx.globalAlpha = 0.5; rect(ctx, B.x, y0, B.w, 3, '#e6ddc4'); ctx.globalAlpha = 1;
    for (let i = 0; i < 26; i++) rect(ctx, B.x + 8, y0 + 44 + i * 14, B.w - 16, 1, LB.line);
    rect(ctx, B.x + 26, y0, 1, B.h - 28, '#e8a0a0');
    drawText(ctx, lbClockOf(this.clockT).date, B.x + 34, y0 + 12, '#9a8f78', { font: 'small' });
    drawText(ctx, 'THREE THINGS', B.x + 34, y0 + 22, '#3a3428', { scale: 2 });
    const goals = (r && r.goals) || [];
    const self = this;
    if (!goals.length) drawText(ctx, 'NOTHING WRITTEN DOWN YET.', B.x + 34, y0 + 50, '#9a8f78', { font: 'small' });
    goals.slice(0, 3).forEach(function (g, i) {
      const gy = y0 + 48 + i * 42;
      self.nav.push({ x: B.x + 8, y: gy - 4, w: B.w - 16, h: 38, r: 4, go: function () { self.flash(g.done ? 'DONE. LEAVE IT ALONE.' : lbGoalText(g)); } });
      // the box, and the tick that somebody drew in it too hard
      rect(ctx, B.x + 34, gy, 13, 13, '#fdf6e2'); frame(ctx, B.x + 34, gy, 13, 13, '#7a7060');
      if (g.done) {
        line(ctx, B.x + 36, gy + 7, B.x + 39, gy + 11, '#2f7a4a');
        line(ctx, B.x + 39, gy + 11, B.x + 45, gy + 1, '#2f7a4a');
        line(ctx, B.x + 36, gy + 8, B.x + 39, gy + 12, '#2f7a4a');
      }
      const name = lbGoalName(g);
      drawText(ctx, name, B.x + 54, gy + 1, g.done ? '#a09680' : '#241d28', { scale: 2 });
      if (g.done) rect(ctx, B.x + 54, gy + 7, textWidth(name, { scale: 2 }), 1, '#a09680');
      drawText(ctx, lbGoalText(g), B.x + 54, gy + 17, '#6a6254', { font: 'small' });
      // the progress, scribbled on the right
      const k = lbGoalK(r, g);
      rect(ctx, B.x + 54, gy + 27, B.w - 96, 4, '#e6ddc4');
      rect(ctx, B.x + 54, gy + 27, Math.round((B.w - 96) * k), 4, g.done ? '#3fc06a' : '#e8a03a');
      drawText(ctx, Math.round(k * 100) + '%', B.x + B.w - 12, gy + 26, '#8a8070', { align: 'right', font: 'small' });
    });
    // the rest of the page, with the other things you wrote on it
    const log = (r && r.log) || [];
    drawText(ctx, 'OTHER THINGS', B.x + 34, y0 + 186, '#9a8f78', { font: 'small' });
    const extra = log.slice(-5);
    if (!extra.length) {
      const lines = ['- CHARGER. FIND A CHARGER.', '- THE BAR IN SHIMOKITA, ASK', '- POST THE CLIP', '- RING HOME'];
      lines.forEach(function (l, i) { drawText(ctx, l, B.x + 34, y0 + 202 + i * 14, '#4a4438', { font: 'small' }); });
    } else extra.forEach(function (l, i) { drawText(ctx, '- ' + String(l).toUpperCase().slice(0, 40), B.x + 34, y0 + 202 + i * 14, '#4a4438', { font: 'small' }); });
    ctx.globalAlpha = 0.07; rect(ctx, B.x, y0, B.w, B.h - 28, '#c8a060'); ctx.globalAlpha = 1;
  }

  // ---------- BUGSEEK ----------
  appJobs(ctx, B) {
    if (this.sub) { this.jobDetail(ctx, B, this.sub); return; }
    const t = this.t, self = this, r = Game.run;
    const y0 = this.header(ctx, B, 'BUGSEEK', 'TOKYO');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#12161a');
    // the search field, which has your last search still in it
    lbRound(ctx, B.x + 8, y0 + 8, B.w - 16, 20, 10, '#1e262c');
    circle(ctx, B.x + 20, y0 + 18, 4, '#2f7a4a'); ringPx(ctx, B.x + 20, y0 + 18, 5, '#5ab07a');
    line(ctx, B.x + 24, y0 + 22, B.x + 27, y0 + 25, '#5ab07a');
    drawText(ctx, 'LIVE MUSIC - NO VISA', B.x + 32, y0 + 14, '#8fb0a0', { font: 'small' });
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4); rect(ctx, B.x + 32 + textWidth('LIVE MUSIC - NO VISA', { font: 'small' }) + 2, y0 + 12, 1, 9, '#6be585'); ctx.globalAlpha = 1;
    // the filter row
    let fx = B.x + 8;
    LB_FILTERS.forEach(function (f, i) {
      const w = textWidth(f, { font: 'small' }) + 14;
      self.nav.push({ x: fx, y: y0 + 34, w: w, h: 16, r: 8, go: function () { self.filter = i; self.sel = i; Audio.ui('move'); } });
      lbPill(ctx, fx, y0 + 34, w, 16, i === self.filter ? '#3fc06a' : '#1e262c', f, i === self.filter ? '#0d2214' : '#7a9a8a');
      fx += w + 5;
    });
    const shown = lbJobsFor(this.filter);
    drawText(ctx, shown.length + ' RESULTS', B.x + 8, y0 + 58, '#5a7a6a', { font: 'small' });
    drawText(ctx, 'SORT: NEAREST', B.x + B.w - 8, y0 + 58, '#5a7a6a', { align: 'right', font: 'small' });
    if (!shown.length) drawText(ctx, 'NOTHING. TRY ALL.', B.x + 8, y0 + 80, '#3f5a4c', { scale: 2 });
    // the listings
    shown.forEach(function (j, i) {
      const jy = y0 + 72 + i * 50;
      if (jy > B.y + B.h - 20) return;
      const applied = r && r.flags && r.flags.lbApplied && r.flags.lbApplied[j.id];
      self.nav.push({ x: B.x + 6, y: jy, w: B.w - 12, h: 46, r: 8, go: function () { self.sub = j; self.sel = 0; Audio.ui('select'); } });
      lbCard(ctx, B.x + 6, jy, B.w - 12, 46, 8, '#1b2228', { shadow: false, edge: '#2c3840' });
      if (j.hot) { lbPill(ctx, B.x + B.w - 46, jy + 5, 38, 12, '#c8402c', 'NEW', '#fff0e8'); }
      drawText(ctx, j.venue, B.x + 13, jy + 6, LB.cream, { scale: 2 });
      drawText(ctx, j.kind, B.x + 13, jy + 20, '#7fae94', { font: 'small' });
      lbStars(ctx, B.x + 13, jy + 32, j.stars, '#f2c94c');
      drawText(ctx, '(' + j.reviews + ')', B.x + 51, jy + 32, '#5a7a6a', { font: 'small' });
      drawText(ctx, j.dist, B.x + B.w - 13, jy + 32, '#8fb0a0', { align: 'right', font: 'small' });
      drawText(ctx, j.pay ? fmtMoney(j.pay) : 'TIPS', B.x + B.w - 13, jy + 19, j.pay ? '#6be585' : '#8a8470', { align: 'right', scale: 2 });
      if (applied) { ctx.globalAlpha = 0.55; rect(ctx, B.x + 6, jy, B.w - 12, 46, '#0d1114'); ctx.globalAlpha = 1; drawText(ctx, 'APPLIED', B.x + B.w / 2, jy + 19, '#6be585', { align: 'center', scale: 2 }); }
    });
  }
  jobDetail(ctx, B, j) {
    const self = this, r = Game.run, t = this.t;
    const applied = r && r.flags && r.flags.lbApplied && r.flags.lbApplied[j.id];
    const y0 = this.header(ctx, B, 'LISTING', j.area);
    rect(ctx, B.x, y0, B.w, B.h - 28, '#12161a');
    // a hero strip: the front of the place, more or less
    rect(ctx, B.x, y0, B.w, 56, '#1b2228');
    vgrad(ctx, B.x, y0, B.w, 56, '#2a3a44', '#10161a');
    const rr = makeRng(hashStr(j.id));
    for (let i = 0; i < 7; i++) { const bw = rr.int(18, 40), bx = B.x + i * 30; rect(ctx, bx, y0 + 56 - rr.int(14, 40), bw, 40, '#161c22'); }
    neonSign(ctx, B.x + 12, y0 + 18, j.venue.slice(0, 11), j.hot ? '#ff5a9a' : '#8ad8ff', t, { scale: 2, box: false });
    ctx.globalAlpha = 0.3; rect(ctx, B.x, y0 + 44, B.w, 12, '#000000'); ctx.globalAlpha = 1;
    drawText(ctx, j.kind, B.x + 12, y0 + 46, '#8fb0a0', { font: 'small' });
    // the numbers
    const row = function (i, k, v, col) {
      const ry = y0 + 64 + i * 18;
      drawText(ctx, k, B.x + 12, ry, '#5a7a6a', { font: 'small' });
      drawText(ctx, v, B.x + B.w - 12, ry - 1, col || LB.cream, { align: 'right', font: 'small' });
    };
    row(0, 'PAY', j.pay ? fmtMoney(j.pay) + ' ' + j.per : 'TIPS ONLY', j.pay ? '#6be585' : '#e8a03a');
    row(1, 'DISTANCE', j.dist + ' - ' + j.area);
    row(2, 'POSTED', j.posted);
    lbStars(ctx, B.x + 12, y0 + 120, j.stars, '#f2c94c');
    drawText(ctx, j.stars.toFixed(1) + ' FROM ' + j.reviews + ' REVIEWS', B.x + 52, y0 + 120, '#8fb0a0', { font: 'small' });
    rect(ctx, B.x + 12, y0 + 134, B.w - 24, 1, '#243038');
    drawWrapped(ctx, j.blurb, B.x + 12, y0 + 142, 44, '#c8d4cc', 10, { font: 'small' });
    drawText(ctx, 'THEY WANT', B.x + 12, y0 + 194, '#5a7a6a', { font: 'small' });
    j.reqs.forEach(function (q, i) {
      rect(ctx, B.x + 12, y0 + 208 + i * 14, 5, 5, '#3fc06a');
      drawText(ctx, q, B.x + 22, y0 + 207 + i * 14, '#c8d4cc', { font: 'small' });
    });
    drawText(ctx, j.note, B.x + 12, y0 + 258, '#7a6a50', { font: 'small' });
    // the button that changes the run
    const by = B.y + B.h - 44;
    this.nav.push({ x: B.x + 12, y: by, w: B.w - 24, h: 32, r: 16, go: function () { self.applyJob(j); } });
    lbRound(ctx, B.x + 12, by, B.w - 24, 32, 16, applied ? '#243038' : '#2f9a56');
    if (!applied) { ctx.globalAlpha = 0.25; lbRound(ctx, B.x + 14, by + 2, B.w - 28, 12, 6, '#ffffff'); ctx.globalAlpha = 1; }
    drawText(ctx, applied ? 'APPLICATION SENT' : 'APPLY', B.x + B.w / 2, by + 11, applied ? '#6be585' : '#eafff0', { align: 'center', scale: 2 });
    drawText(ctx, applied ? 'THEY HAVE NOT REPLIED.' : 'ONE TAP. NO COVER LETTER.', B.x + B.w / 2, by + 34, '#5a7a6a', { align: 'center', font: 'small' });
  }

  // ---------- TIKBUG ----------
  appTikbug(ctx, B) {
    const r = Game.run, t = this.t, self = this;
    const n = LB_CLIPS.length;
    const idx = ((this.feed % n) + n) % n;
    const clip = LB_CLIPS[idx];
    rect(ctx, B.x, B.y, B.w, B.h + 16, '#07070c');
    // the clip itself: a still of you playing, lit badly
    const vy = B.y + 22, vh = B.h - 30;
    vgrad(ctx, B.x, vy, B.w, vh, clip.col, darken(clip.col, 0.4));
    const rr = makeRng(hashStr(clip.cap));
    for (let i = 0; i < 26; i++) { const bx = B.x + rr.int(-10, B.w), bw = rr.int(14, 40); rect(ctx, bx, vy + vh - rr.int(40, 150), bw, 160, withAlpha('#000000', 0.3)); }
    ctx.globalAlpha = 0.18; ellipsePx(ctx, B.x + B.w / 2, vy + vh - 120, 90, 80, '#ffd9a0'); ctx.globalAlpha = 1;
    if (this.you && this.you.spec) {
      drawShadow(ctx, B.x + B.w / 2 - 14, vy + vh - 76, 34, 0.3);
      drawBugAt(ctx, this.you.spec, B.x + B.w / 2 - 14, vy + vh - 76, { pose: clip.pose, scale: 2.6, bounce: 0.8, phase: t });
    }
    ctx.globalAlpha = 0.06; for (let i = 0; i < vh; i += 3) rect(ctx, B.x, vy + i, B.w, 1, '#000000'); ctx.globalAlpha = 1;
    // the tabs
    const tabs = ['FOLLOWING', 'FOR YOU'];
    tabs.forEach(function (tb, i) {
      const tx = B.x + B.w / 2 + (i ? 30 : -30);
      drawText(ctx, tb, tx, B.y + 8, i === 1 ? LB.cream : withAlpha('#ffffff', 0.5), { align: 'center', font: 'small', shadow: 'rgba(0,0,0,0.6)' });
      if (i === 1) rect(ctx, tx - 16, B.y + 17, 32, 2, LB.cream);
    });
    // the rail down the right: you, the heart, the comments, the share
    const rx = B.x + B.w - 26, ry = vy + vh - 150;
    if (this.you && this.you.spec) {
      circle(ctx, rx, ry, 13, '#f4f1ea'); ctx.save(); ctx.beginPath(); ctx.arc(rx, ry, 12, 0, Math.PI * 2); ctx.clip();
      drawBugAt(ctx, this.you.spec, rx, ry + 14, { pose: 'idle', scale: 0.8, bounce: 0 }); ctx.restore();
      circle(ctx, rx, ry + 15, 6, LB.red); rect(ctx, rx - 3, ry + 14, 7, 2, '#fff'); rect(ctx, rx, ry + 11, 2, 7, '#fff');
    }
    const liked = !!this.liked[idx];
    const hearts = 12 + (r ? Math.round((r.followers || 0) * 0.34) : 0) + idx * 7 + (liked ? 1 : 0);
    this.nav.push({ x: rx - 14, y: ry + 34, w: 28, h: 30, r: 8, go: function () { self.liked[idx] = !self.liked[idx]; Audio.ui(self.liked[idx] ? 'pop' : 'back'); if (self.liked[idx] && Game.run) { Game.run.followers = (Game.run.followers || 0) + 1; } } });
    const hc = liked ? LB.red : LB.cream;
    ellipsePx(ctx, rx - 4, ry + 42, 5, 5, hc); ellipsePx(ctx, rx + 4, ry + 42, 5, 5, hc);
    ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(rx - 9, ry + 43); ctx.lineTo(rx + 9, ry + 43); ctx.lineTo(rx, ry + 53); ctx.fill();
    drawText(ctx, fmtNum(hearts), rx, ry + 56, LB.cream, { align: 'center', font: 'small', shadow: 'rgba(0,0,0,0.7)' });
    lbRound(ctx, rx - 9, ry + 70, 18, 14, 4, LB.cream);
    ctx.fillStyle = LB.cream; ctx.beginPath(); ctx.moveTo(rx - 6, ry + 84); ctx.lineTo(rx, ry + 84); ctx.lineTo(rx - 6, ry + 89); ctx.fill();
    drawText(ctx, String(3 + idx), rx, ry + 92, LB.cream, { align: 'center', font: 'small', shadow: 'rgba(0,0,0,0.7)' });
    ctx.fillStyle = LB.cream; ctx.beginPath();
    ctx.moveTo(rx + 9, ry + 112); ctx.lineTo(rx - 9, ry + 104); ctx.lineTo(rx - 9, ry + 120); ctx.fill();
    drawText(ctx, 'SHARE', rx, ry + 124, LB.cream, { align: 'center', font: 'small', shadow: 'rgba(0,0,0,0.7)' });
    // the caption, bottom left, over the video the way they all are
    const cy2 = vy + vh - 62;
    drawText(ctx, '@BUGBUSKER', B.x + 10, cy2, LB.cream, { scale: 2, shadow: 'rgba(0,0,0,0.8)' });
    drawText(ctx, fmtNum(r ? (r.followers || 0) : 0) + ' FOLLOWERS', B.x + 10, cy2 + 16, LB.gold, { font: 'small', shadow: 'rgba(0,0,0,0.8)' });
    drawWrapped(ctx, clip.cap, B.x + 10, cy2 + 27, 38, LB.cream, 9, { font: 'small', shadow: 'rgba(0,0,0,0.8)' });
    drawText(ctx, clip.tag, B.x + 10, cy2 + 48, '#5ad8ff', { font: 'small', shadow: 'rgba(0,0,0,0.8)' });
    // the scrub bar and the up/down targets
    const pk = ((t * 0.18) % 1);
    rect(ctx, B.x, B.y + B.h - 4, B.w, 2, withAlpha('#ffffff', 0.25));
    rect(ctx, B.x, B.y + B.h - 5, Math.round(B.w * pk), 3, LB.cream);
    this.nav.push({ x: B.x, y: vy, w: B.w - 34, h: vh / 2, r: 0, nosel: true, go: function () { self.feed = self.feed - 1; Audio.ui('move'); } });
    this.nav.push({ x: B.x, y: vy + vh / 2, w: B.w - 34, h: vh / 2, r: 0, nosel: true, go: function () { self.feed = self.feed + 1; Audio.ui('move'); } });
    this.cols = 1;
    this.backRect = { x: B.x, y: B.y, w: 28, h: 22 };
    lbChevron(ctx, B.x + 12, B.y + 11, -1, LB.cream, 4);
  }

  // ---------- MESSAGES ----------
  threads() {
    const r = Game.run; if (!r) return [];
    const out = [];
    const applied = r.flags && r.flags.lbApplied;
    if (applied && applied.beatles) out.push({
      who: 'THE BEATLES', tint: '#c8402c', unread: true, t: '09:14',
      lines: [
        { me: false, s: 'GOT YOUR MESSAGE.' },
        { me: false, s: 'WHAT DO YOU PLAY.' },
        { me: true, s: 'ANYTHING WITH SIX STRINGS' },
        { me: false, s: 'SEVEN TONIGHT. DOOR IS THE GREY ONE.' },
      ],
    });
    out.push({
      who: 'MUM', tint: '#f2c94c', unread: true, t: '04:02',
      lines: [
        { me: false, s: 'DID YOU LAND' },
        { me: true, s: 'YES. IT IS TOMORROW HERE.' },
        { me: false, s: 'WHAT DOES THAT MEAN' },
        { me: false, s: 'ARE YOU EATING' },
      ],
    });
    out.push({
      who: 'BUGSEEK', tint: '#2f7a4a', unread: false, t: 'YESTERDAY',
      lines: [
        { me: false, s: 'YOUR PROFILE IS 40% COMPLETE.' },
        { me: false, s: 'ADD A PHOTO TO GET 3X MORE VIEWS.' },
        { me: true, s: 'NO' },
      ],
    });
    (r.contacts || []).slice(0, 2).forEach(function (k) {
      const C = CONTACTS[k]; if (!C) return;
      out.push({
        who: C.name, tint: C.tint || '#8ad8ff', unread: r.usedContacts.indexOf(k) < 0, t: 'MON',
        lines: [{ me: false, s: String(C.desc || '').toUpperCase() }, { me: false, s: 'RING ME IF YOU NEED IT.' }],
      });
    });
    return out;
  }
  appMessages(ctx, B) {
    const self = this, t = this.t;
    const list = this.threads();
    if (this.sub) {
      const th = this.sub;
      const y0 = this.header(ctx, B, th.who.slice(0, 12), th.t);
      rect(ctx, B.x, y0, B.w, B.h - 28, '#0e0e14');
      let by = y0 + 12;
      th.lines.forEach(function (l, i) {
        const lines = wrapText(l.s, 26);
        const bw = Math.min(B.w - 60, Math.max.apply(null, lines.map(function (s) { return textWidth(s, { font: 'small' }); })) + 16);
        const bh = lines.length * 9 + 12;
        const bx = l.me ? B.x + B.w - 12 - bw : B.x + 12;
        lbRound(ctx, bx, by, bw, bh, 8, l.me ? '#2f9a56' : '#2a2834');
        // the little tail, on the side the bubble came from
        rect(ctx, l.me ? bx + bw - 4 : bx, by + bh - 4, 4, 4, l.me ? '#2f9a56' : '#2a2834');
        lines.forEach(function (s, j) { drawText(ctx, s, bx + 8, by + 6 + j * 9, l.me ? '#eafff0' : LB.cream, { font: 'small' }); });
        by += bh + 6;
      });
      // they are typing, and they have been for a while
      if (Math.sin(this.typing * 0.7) > -0.2) {
        lbRound(ctx, B.x + 12, by, 38, 16, 8, '#2a2834');
        for (let i = 0; i < 3; i++) { const a = 0.35 + 0.65 * Math.max(0, Math.sin(this.typing * 6 - i * 0.7)); ctx.globalAlpha = a; circle(ctx, B.x + 22 + i * 8, by + 8, 2, LB.cream); ctx.globalAlpha = 1; }
      }
      // the field you never type in
      const fy = B.y + B.h - 30;
      lbRound(ctx, B.x + 10, fy, B.w - 46, 22, 11, '#1d1c28');
      drawText(ctx, 'MESSAGE', B.x + 22, fy + 8, '#5a5670', { font: 'small' });
      circle(ctx, B.x + B.w - 22, fy + 11, 11, '#2f9a56');
      ctx.fillStyle = '#eafff0'; ctx.beginPath();
      ctx.moveTo(B.x + B.w - 28, fy + 6); ctx.lineTo(B.x + B.w - 16, fy + 11); ctx.lineTo(B.x + B.w - 28, fy + 16); ctx.fill();
      this.nav.push({ x: B.x + 10, y: fy, w: B.w - 20, h: 22, r: 11, go: function () { Audio.ui('error'); self.flash('YOU TYPE THREE WORDS AND DELETE THEM.'); } });
      return;
    }
    const y0 = this.header(ctx, B, 'MESSAGES', list.length + ' CHATS');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0e0e14');
    lbRound(ctx, B.x + 8, y0 + 8, B.w - 16, 18, 9, '#1d1c28');
    drawText(ctx, 'SEARCH', B.x + 20, y0 + 14, '#4a4658', { font: 'small' });
    list.forEach(function (th, i) {
      const ry = y0 + 32 + i * 52;
      if (ry > B.y + B.h - 30) return;
      self.nav.push({ x: B.x + 4, y: ry, w: B.w - 8, h: 48, r: 6, go: function () { self.sub = th; self.sel = 0; th.unread = false; Audio.ui('select'); } });
      rect(ctx, B.x + 12, ry + 47, B.w - 24, 1, '#1d1c28');
      circle(ctx, B.x + 26, ry + 22, 16, th.tint);
      circle(ctx, B.x + 26, ry + 22, 14, darken(th.tint, 0.18));
      drawText(ctx, th.who[0], B.x + 26, ry + 16, '#fff4e8', { align: 'center', scale: 2 });
      if (th.unread) { circle(ctx, B.x + 8, ry + 22, 4, '#3f7df0'); }
      drawText(ctx, th.who.slice(0, 14), B.x + 48, ry + 9, LB.cream, { scale: 2 });
      drawText(ctx, th.t, B.x + B.w - 12, ry + 10, '#5a5670', { align: 'right', font: 'small' });
      drawWrapped(ctx, th.lines[th.lines.length - 1].s, B.x + 48, ry + 24, 32, '#8a84a0', 9, { font: 'small' });
      lbChevron(ctx, B.x + B.w - 16, ry + 24, 1, '#3a3648', 3);
    });
  }

  // ---------- MAPS ----------
  // Plan on the top, elevation on the bottom, because you need both: where it
  // is, and what it looks like when you are standing in front of it.
  appMaps(ctx, B) {
    const self = this, t = this.t, r = Game.run;
    const y0 = this.header(ctx, B, 'MAPS', 'SHIMOKITAZAWA');
    const mh = 236;
    rect(ctx, B.x, y0, B.w, mh, '#1a2018');
    // the plan: blocks, roads, the river, the railway
    const rr = makeRng(5150);
    for (let i = 0; i < 34; i++) {
      const bx = B.x + rr.int(0, B.w - 20), by = y0 + rr.int(0, mh - 16);
      rect(ctx, bx, by, rr.int(12, 30), rr.int(10, 22), '#242c22');
    }
    for (let i = 0; i < 5; i++) rect(ctx, B.x, y0 + 26 + i * 44, B.w, 7, '#3a4438');
    for (let i = 0; i < 5; i++) rect(ctx, B.x + 18 + i * 42, y0, 7, mh, '#3a4438');
    for (let i = 0; i < 5; i++) { rect(ctx, B.x, y0 + 28 + i * 44, B.w, 1, '#4c5848'); }
    // the railway, on the diagonal, with sleepers
    ctx.save(); ctx.beginPath(); ctx.rect(B.x, y0, B.w, mh); ctx.clip();
    line(ctx, B.x - 10, y0 + 170, B.x + B.w + 10, y0 + 54, '#6a6478');
    for (let i = 0; i < 26; i++) { const k = i / 25; rect(ctx, lerp(B.x - 10, B.x + B.w + 10, k) - 3, lerp(y0 + 170, y0 + 54, k) - 2, 7, 3, '#4a4458'); }
    // the route: a fat blue line from you to whatever is selected
    const pt = function (s) { return { x: B.x + 10 + s.x * (B.w - 20), y: y0 + 16 + s.y * (mh - 32) }; };
    const a = pt(LB_SPOTS[0]), bsel = LB_SPOTS[Math.min(Math.max(1, this.sel), LB_SPOTS.length - 1)], b = pt(bsel);
    const mid = { x: b.x, y: a.y };
    ctx.globalAlpha = 0.35;
    rect(ctx, Math.min(a.x, mid.x), a.y - 3, Math.abs(mid.x - a.x), 6, '#3f7df0');
    rect(ctx, b.x - 3, Math.min(mid.y, b.y), 6, Math.abs(b.y - mid.y), '#3f7df0');
    ctx.globalAlpha = 1;
    const dash = Math.floor(t * 24);
    dashedLine(ctx, a.x, a.y, mid.x, mid.y, '#8fc0ff', 4, 4, dash);
    dashedLine(ctx, mid.x, mid.y, b.x, b.y, '#8fc0ff', 4, 4, dash);
    ctx.restore();
    // the pins
    LB_SPOTS.forEach(function (s, i) {
      const p = pt(s);
      self.nav.push({ x: p.x - 12, y: p.y - 22, w: 24, h: 26, r: 6, go: function () { self.flash(s.name + ' - ' + s.sub); Audio.ui('select'); } });
      if (s.you) {
        ctx.globalAlpha = 0.2 + 0.12 * Math.sin(t * 2.4); circle(ctx, p.x, p.y, 13, '#4a86f7'); ctx.globalAlpha = 1;
        circle(ctx, p.x, p.y, 5, '#ffffff'); circle(ctx, p.x, p.y, 4, '#2f6fe0');
        return;
      }
      ellipsePx(ctx, p.x, p.y - 9, 6, 7, s.col);
      ctx.fillStyle = s.col; ctx.beginPath(); ctx.moveTo(p.x - 5, p.y - 5); ctx.lineTo(p.x + 5, p.y - 5); ctx.lineTo(p.x, p.y + 4); ctx.fill();
      rect(ctx, p.x - 2, p.y - 11, 4, 4, '#fff4e8');
      if (i === self.sel) { ringPx(ctx, p.x, p.y - 9, 10, '#ffffff'); }
    });
    // the chrome
    lbRound(ctx, B.x + 8, y0 + 6, B.w - 16, 18, 9, 'rgba(10,14,10,0.82)');
    drawText(ctx, 'SHIMOKITAZAWA', B.x + 16, y0 + 12, '#cfe4d0', { font: 'small' });
    drawText(ctx, '1:8000', B.x + B.w - 16, y0 + 12, '#6be585', { align: 'right', font: 'small' });
    for (let i = 0; i < 2; i++) { lbRound(ctx, B.x + B.w - 26, y0 + 32 + i * 20, 18, 18, 5, 'rgba(10,14,10,0.82)'); drawText(ctx, i ? '-' : '+', B.x + B.w - 17, y0 + 36 + i * 20, '#cfe4d0', { align: 'center', scale: 2 }); }
    // ---- the elevation: the same street, seen from across the road
    const ey = y0 + mh, eh = B.h - 28 - mh;
    vgrad(ctx, B.x, ey, B.w, eh, '#1b1a2c', '#0d0c16');
    const gy = ey + eh - 26;
    LB_SPOTS.forEach(function (s, i) {
      const sx = B.x + 8 + s.x * (B.w - 30), bw = 34, bh = 30 + (i % 3) * 14;
      rect(ctx, sx, gy - bh, bw, bh, '#242238');
      rect(ctx, sx, gy - bh, bw, 2, '#39365a');
      for (let wy = gy - bh + 6; wy < gy - 8; wy += 8) for (let wx = sx + 4; wx < sx + bw - 5; wx += 7) rect(ctx, wx, wy, 4, 4, ((i + wx) % 3) ? withAlpha('#ffd9a0', 0.7) : '#151426');
      rect(ctx, sx + 4, gy - 12, bw - 8, 12, darken(s.col, 0.35));
      rect(ctx, sx + 4, gy - 12, bw - 8, 3, s.col);
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 2 + i); rect(ctx, sx + 4, gy, bw - 8, 5, s.col); ctx.globalAlpha = 1;
    });
    sideFloor(ctx, B.x, B.x + B.w, gy, { h: 26, col: '#1c1a26', tile: 26, shine: false });
    drawText(ctx, bsel.name, B.x + 8, ey + 6, LB.cream, { scale: 2 });
    drawText(ctx, bsel.sub, B.x + 8, ey + 20, '#8a84a0', { font: 'small' });
    drawText(ctx, 'ON FOOT', B.x + B.w - 8, ey + 6, '#6be585', { align: 'right', font: 'small' });
    drawText(ctx, (8 + this.sel * 3) + ' MIN', B.x + B.w - 8, ey + 14, LB.cream, { align: 'right', scale: 2 });
    this.cols = 1;
  }

  // ---------- TRANSLATE ----------
  appTranslate(ctx, B) {
    const self = this, t = this.t;
    const p = LB_PHRASES[this.phrase % LB_PHRASES.length];
    const y0 = this.header(ctx, B, 'TRANSLATE', 'BETA');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#101422');
    // the language row, with the swap in the middle
    const lang = this.swapped ? ['JAPANESE', 'ENGLISH'] : ['ENGLISH', 'JAPANESE'];
    lbRound(ctx, B.x + 8, y0 + 8, B.w - 16, 22, 11, '#1a2036');
    drawText(ctx, lang[0], B.x + 44, y0 + 16, LB.cream, { font: 'small' });
    drawText(ctx, lang[1], B.x + B.w - 44, y0 + 16, LB.cream, { align: 'right', font: 'small' });
    this.nav.push({ x: B.x + B.w / 2 - 14, y: y0 + 8, w: 28, h: 22, r: 11, go: function () { self.swapped = !self.swapped; self.translated = false; Audio.ui('move'); } });
    circle(ctx, B.x + B.w / 2, y0 + 19, 10, '#3f7df0');
    for (let i = 0; i < 2; i++) {
      const d = i ? 1 : -1, ax = B.x + B.w / 2 + d * 3;
      rect(ctx, ax - 1, y0 + 15 + i * 6, 3, 3, '#eaf2ff');
      rect(ctx, ax - 4 * (i ? 1 : -1), y0 + 15 + i * 6, 5, 1, '#eaf2ff');
    }
    // the box you typed into
    lbCard(ctx, B.x + 8, y0 + 38, B.w - 16, 96, 10, '#1a2036', { edge: '#2a3556' });
    drawText(ctx, lang[0], B.x + 18, y0 + 46, '#5f78a8', { font: 'small' });
    drawWrapped(ctx, p.en, B.x + 18, y0 + 60, 26, LB.cream, 14, { scale: 2 });
    ctx.globalAlpha = 0.4 + 0.5 * Math.sin(t * 4); rect(ctx, B.x + 18, y0 + 118, 8, 2, '#8fc0ff'); ctx.globalAlpha = 1;
    this.nav.push({ x: B.x + 8, y: y0 + 38, w: B.w - 16, h: 96, r: 10, go: function () { self.phrase = (self.phrase + 1) % LB_PHRASES.length; self.translated = false; Audio.ui('type'); } });
    drawText(ctx, 'TAP TO CYCLE PHRASES', B.x + B.w - 18, y0 + 122, '#3f4e6e', { align: 'right', font: 'small' });
    // the box it gave back
    lbCard(ctx, B.x + 8, y0 + 142, B.w - 16, 96, 10, '#131a2c', { edge: '#2a3556' });
    drawText(ctx, lang[1], B.x + 18, y0 + 150, '#5f78a8', { font: 'small' });
    if (this.translated) {
      const n = Math.floor(clamp(this.transK, 0, 1) * 18);
      for (let row = 0; row < 2; row++) {
        const c = Math.min(9, Math.max(0, n - row * 9));
        if (c > 0) lbKanaRun(ctx, B.x + 18, y0 + 164 + row * 26, 17, c, '#ffd24a', 'tr' + this.phrase + row, 3);
      }
      if (this.transK >= 1) {
        drawText(ctx, 'CONFIDENCE ' + p.conf.toFixed(1) + '%', B.x + 18, y0 + 222, '#6be585', { font: 'small' });
        rect(ctx, B.x + B.w - 66, y0 + 222, 48, 4, '#22304a');
        rect(ctx, B.x + B.w - 66, y0 + 222, Math.round(48 * p.conf / 100), 4, '#6be585');
      }
    } else {
      drawText(ctx, '- - - -', B.x + 18, y0 + 170, '#2a3556', { scale: 2 });
      drawText(ctx, 'IT HAS NOT GUESSED YET.', B.x + 18, y0 + 222, '#3f4e6e', { font: 'small' });
    }
    // the button
    const by = y0 + 250;
    this.nav.push({ x: B.x + 8, y: by, w: B.w - 16, h: 30, r: 15, go: function () { self.translated = true; self.transK = 0; Audio.ui('select'); Voice.chime('shop'); } });
    lbRound(ctx, B.x + 8, by, B.w - 16, 30, 15, '#3f7df0');
    ctx.globalAlpha = 0.25; lbRound(ctx, B.x + 10, by + 2, B.w - 20, 11, 6, '#ffffff'); ctx.globalAlpha = 1;
    drawText(ctx, 'TRANSLATE', B.x + B.w / 2, by + 10, '#eaf2ff', { align: 'center', scale: 2 });
    drawText(ctx, 'IT IS ALWAYS THIS SURE. IT IS NOT ALWAYS RIGHT.', B.x + B.w / 2, by + 40, '#3f4e6e', { align: 'center', font: 'small' });
  }

  // ---------- WALLET ----------
  appWallet(ctx, B) {
    const r = Game.run, t = this.t, self = this;
    const y0 = this.header(ctx, B, 'WALLET', 'DEFAULT');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0f0f16');
    // the money, which is a card like everything else now
    const cy2 = y0 + 10;
    lbCard(ctx, B.x + 10, cy2, B.w - 20, 72, 10, '#15301f', { edge: '#2f7a4a' });
    drawText(ctx, 'IN THE CASE', B.x + 20, cy2 + 10, '#5a8a6a', { font: 'small' });
    drawText(ctx, fmtMoney(r ? r.money : 0), B.x + 20, cy2 + 24, r && r.money < 10 ? LB.red : '#6be585', { scale: 5 });
    drawText(ctx, 'CASH. NO CARD. NO BANK.', B.x + 20, cy2 + 58, '#3f6a4c', { font: 'small' });
    // the boarding pass, which is the only official document you own
    const py2 = cy2 + 82;
    dfBoardingPass(ctx, B.x + 10, py2, B.w - 20, 106, {
      name: (this.you.name || 'BUSKER').toUpperCase() + ' / B', from: 'LAS VEGAS  LAS', to: 'TOKYO  NRT',
      flight: 'DF 0808', seat: '31A', gate: 'C12',
    }, t);
    this.nav.push({ x: B.x + 10, y: py2, w: B.w - 20, h: 106, r: 4, go: function () { self.flash('USED. YOU KEEP IT ANYWAY.'); } });
    // the train card
    const ty = py2 + 116;
    lbCard(ctx, B.x + 10, ty, B.w - 20, 62, 8, '#1f3f66', { edge: '#3f7db0' });
    drawText(ctx, 'SUBICA', B.x + 20, ty + 10, '#cfe4ff', { scale: 3 });
    drawText(ctx, 'IC CARD - TAP AT THE GATE', B.x + 20, ty + 30, '#7fa8d8', { font: 'small' });
    drawText(ctx, 'BALANCE', B.x + B.w - 20, ty + 10, '#7fa8d8', { align: 'right', font: 'small' });
    drawText(ctx, String(r ? r.tickets : 0) + ' RIDES', B.x + B.w - 20, ty + 20, r && r.tickets > 0 ? '#8ad8ff' : LB.red, { align: 'right', scale: 2 });
    for (let i = 0; i < 12; i++) rect(ctx, B.x + 20 + i * 4, ty + 44, 2, 10, withAlpha('#8ad8ff', i % 3 ? 0.5 : 0.9));
    circle(ctx, B.x + B.w - 32, ty + 46, 8, '#2a5a8a'); ringPx(ctx, B.x + B.w - 32, ty + 46, 8, '#8ad8ff');
    this.nav.push({ x: B.x + 10, y: ty, w: B.w - 20, h: 62, r: 8, go: function () { Audio.ui('coin'); self.flash(r && r.tickets ? 'BEEP. ' + r.tickets + ' RIDES LEFT.' : 'IT BEEPS ANGRILY. NO RIDES LEFT.'); } });
    this.cols = 1;
  }

  // ---------- WEATHER ----------
  appWeather(ctx, B) {
    const r = Game.run, t = this.t;
    const wk = (r && WEATHERS[r.weather]) || WEATHERS.clear;
    const y0 = this.header(ctx, B, 'WEATHER', 'TOKYO');
    const rain = r && r.weather === 'rain', night = false;
    vgrad(ctx, B.x, y0, B.w, B.h - 28, rain ? '#3a4a66' : '#2f6fa8', rain ? '#1b2436' : '#8ad0f0');
    drawText(ctx, 'SHIMOKITAZAWA', B.x + B.w / 2, y0 + 12, '#ffffff', { align: 'center', scale: 2 });
    drawText(ctx, wk.name, B.x + B.w / 2, y0 + 28, '#eaf6ff', { align: 'center', font: 'small' });
    const temp = 12 - ((r && r.day) || 0);
    drawText(ctx, String(temp), B.x + B.w / 2 - 10, y0 + 42, '#ffffff', { align: 'center', scale: 8 });
    drawText(ctx, 'C', B.x + B.w / 2 + 34, y0 + 46, '#ffffff', { scale: 3 });
    // the big glyph
    const gx = B.x + B.w / 2, gy = y0 + 130;
    if (rain) {
      ellipsePx(ctx, gx, gy, 34, 18, '#cfd8e6'); ellipsePx(ctx, gx + 20, gy + 4, 20, 12, '#b8c2d2');
      for (let i = 0; i < 14; i++) { const dx = gx - 30 + ((i * 17) % 62), dy = gy + 16 + ((i * 23 + Math.floor(t * 140)) % 54); rect(ctx, dx, dy, 1, 7, '#cfe8ff'); }
    } else {
      circle(ctx, gx, gy, 26, '#ffe07a'); circle(ctx, gx, gy, 22, '#fff0b0');
      for (let i = 0; i < 8; i++) { const a = i * 0.785 + t * 0.4; rect(ctx, gx + Math.cos(a) * 36 - 3, gy + Math.sin(a) * 36 - 3, 6, 6, '#ffe07a'); }
      ellipsePx(ctx, gx + 16, gy + 20, 24, 11, '#f4f8fe');
    }
    drawWrapped(ctx, String(wk.desc).toUpperCase(), B.x + 12, y0 + 176, 44, '#0f2a3a', 10, { font: 'small' });
    // the hours, which is the part anybody looks at
    rect(ctx, B.x + 8, y0 + 210, B.w - 16, 56, 'rgba(10,26,42,0.3)');
    const hrs = ['NOW', '13', '15', '17', '19', '21'];
    hrs.forEach(function (h, i) {
      const hx = B.x + 20 + i * 32;
      drawText(ctx, h, hx, y0 + 216, '#dff0ff', { align: 'center', font: 'small' });
      if (rain) { rect(ctx, hx - 4, y0 + 228, 9, 5, '#cfd8e6'); rect(ctx, hx - 1, y0 + 234, 1, 4, '#8fc0ff'); }
      else { circle(ctx, hx, y0 + 231, 5, '#ffe07a'); }
      drawText(ctx, String(temp - i) + 'C', hx, y0 + 244, '#ffffff', { align: 'center', font: 'small' });
      const bh = 6 + ((i * 5) % 11);
      rect(ctx, hx - 5, y0 + 258 - bh, 10, bh, withAlpha('#8ad8ff', 0.6));
    });
    drawText(ctx, 'TIPS x' + wk.tipMult, B.x + B.w / 2, y0 + 274, '#0f2a3a', { align: 'center', scale: 2 });
    drawText(ctx, 'NOT A FORECAST. A WARNING.', B.x + B.w / 2, y0 + 292, '#2a4a5e', { align: 'center', font: 'small' });
    this.cols = 1;
  }

  // ---------- CLOCK ----------
  appClock(ctx, B) {
    const self = this, t = this.t, c = lbClockOf(this.clockT);
    const y0 = this.header(ctx, B, 'CLOCK', c.date);
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0c0b12');
    const tabs = ['WORLD', 'ALARM', 'TIMER'];
    tabs.forEach(function (tb, i) {
      const tw = (B.w - 16) / 3, tx = B.x + 8 + i * tw;
      self.nav.push({ x: tx, y: y0 + 6, w: tw - 3, h: 18, r: 9, go: function () { self.clockTab = i; Audio.ui('move'); } });
      lbPill(ctx, tx, y0 + 6, tw - 3, 18, i === self.clockTab ? '#f28a2e' : '#1c1b26', tb, i === self.clockTab ? '#2a1600' : '#6a6478');
    });
    if (this.clockTab === 0) {
      // the face, hands moving on the run's clock
      const cx = B.x + B.w / 2, cy2 = y0 + 96;
      circle(ctx, cx, cy2, 52, '#15141d'); ringPx(ctx, cx, cy2, 52, '#3a3648');
      for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30; const rr2 = i % 5 === 0 ? 44 : 48; rect(ctx, cx + Math.sin(a) * rr2 - 1, cy2 - Math.cos(a) * rr2 - 1, i % 5 === 0 ? 3 : 1, i % 5 === 0 ? 3 : 1, i % 15 === 0 ? LB.gold : '#6a6478'); }
      const ma = (c.m / 60) * Math.PI * 2, ha = ((c.h % 12) / 12 + c.m / 720) * Math.PI * 2, sa = (this.clockT * 0.4 % 1) * Math.PI * 2;
      line(ctx, cx, cy2, cx + Math.sin(ha) * 26, cy2 - Math.cos(ha) * 26, LB.cream);
      line(ctx, cx + 1, cy2, cx + Math.sin(ha) * 26 + 1, cy2 - Math.cos(ha) * 26, LB.cream);
      line(ctx, cx, cy2, cx + Math.sin(ma) * 40, cy2 - Math.cos(ma) * 40, LB.cream);
      line(ctx, cx, cy2, cx + Math.sin(sa) * 44, cy2 - Math.cos(sa) * 44, LB.red);
      circle(ctx, cx, cy2, 3, LB.gold);
      drawText(ctx, c.text, cx, y0 + 158, LB.cream, { align: 'center', scale: 4 });
      const rows = [['TOKYO', c.text, 'TODAY'], ['LAS VEGAS', pad2((c.h + 7) % 24) + ':' + pad2(c.m), 'YESTERDAY'], ['LONDON', pad2((c.h + 15) % 24) + ':' + pad2(c.m), 'TODAY']];
      rows.forEach(function (rw, i) {
        const ry = y0 + 188 + i * 30;
        rect(ctx, B.x + 12, ry + 26, B.w - 24, 1, '#1c1b26');
        drawText(ctx, rw[2], B.x + 12, ry, '#5a5670', { font: 'small' });
        drawText(ctx, rw[0], B.x + 12, ry + 9, LB.cream, { scale: 2 });
        drawText(ctx, rw[1], B.x + B.w - 12, ry + 4, i === 0 ? LB.gold : '#8a84a0', { align: 'right', scale: 3 });
      });
    } else if (this.clockTab === 1) {
      const alarms = [['06:30', 'GET UP', true], ['07:00', 'GET UP', true], ['07:20', 'REALLY', false], ['18:30', 'LOAD IN', true]];
      alarms.forEach(function (al, i) {
        const ry = y0 + 40 + i * 48;
        rect(ctx, B.x + 12, ry + 42, B.w - 24, 1, '#1c1b26');
        drawText(ctx, al[0], B.x + 12, ry + 2, al[2] ? LB.cream : '#4a4658', { scale: 5 });
        drawText(ctx, al[1], B.x + 12, ry + 32, al[2] ? '#8a84a0' : '#3a3648', { font: 'small' });
        self.nav.push({ x: B.x + B.w - 44, y: ry + 12, w: 32, h: 18, r: 9, go: function () { al[2] = !al[2]; Audio.ui('move'); } });
        lbToggle(ctx, B.x + B.w - 40, ry + 14, al[2]);
      });
      drawText(ctx, 'YOU SET FOUR AND USED NONE.', B.x + B.w / 2, y0 + 250, '#4a4658', { align: 'center', font: 'small' });
    } else {
      const k = (this.appT * 0.05) % 1;
      const cx = B.x + B.w / 2, cy2 = y0 + 120;
      ringPx(ctx, cx, cy2, 60, '#1c1b26');
      for (let i = 0; i < Math.round((1 - k) * 60); i++) { const a = -Math.PI / 2 + (i / 60) * Math.PI * 2; rect(ctx, cx + Math.cos(a) * 60 - 2, cy2 + Math.sin(a) * 60 - 2, 4, 4, '#f28a2e'); }
      const rem = Math.round((1 - k) * 1200);
      drawText(ctx, pad2(Math.floor(rem / 60)) + ':' + pad2(rem % 60), cx, cy2 - 14, LB.cream, { align: 'center', scale: 4 });
      drawText(ctx, 'NOODLES', cx, cy2 + 24, '#8a84a0', { align: 'center', font: 'small' });
      drawText(ctx, 'IT HAS BEEN RUNNING SINCE THE AIRPORT.', B.x + B.w / 2, y0 + 220, '#4a4658', { align: 'center', font: 'small' });
    }
  }

  // ---------- CAMERA ----------
  appCamera(ctx, B) {
    const self = this, t = this.t, r = Game.run;
    rect(ctx, B.x, B.y, B.w, B.h + 16, '#07070c');
    const vy = B.y + 34, vh = 250;
    // the viewfinder: the band, in a room, slightly out of frame
    vgrad(ctx, B.x, vy, B.w, vh, '#2b3450', '#12161f');
    ctx.globalAlpha = 0.2; ellipsePx(ctx, B.x + B.w / 2, vy + 40, 70, 50, '#ffd9a0'); ctx.globalAlpha = 1;
    rect(ctx, B.x, vy + vh - 44, B.w, 44, '#1a1c28');
    rect(ctx, B.x, vy + vh - 44, B.w, 2, '#2a2e3e');
    const mem = (r && r.members) || [this.you];
    mem.slice(0, 4).forEach(function (m, i) {
      const n = Math.min(4, mem.length);
      const bx = B.x + (B.w / (n + 1)) * (i + 1);
      drawShadow(ctx, bx, vy + vh - 34, 24, 0.3);
      drawBugAt(ctx, m.spec, bx, vy + vh - 34, { pose: self.camMode === 2 ? 'cheer' : 'idle', scale: 1.5, bounce: 0.5, phase: i * 1.3 + t * 0.4 });
    });
    // the grid, the focus box, the exposure slider
    ctx.globalAlpha = 0.18;
    for (let i = 1; i < 3; i++) { rect(ctx, B.x + (B.w / 3) * i, vy, 1, vh, '#ffffff'); rect(ctx, B.x, vy + (vh / 3) * i, B.w, 1, '#ffffff'); }
    ctx.globalAlpha = 1;
    const fx = B.x + B.w / 2 - 26, fy = vy + vh / 2 - 22;
    for (const c of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const cx2 = fx + c[0] * 52, cy2 = fy + c[1] * 44;
      rect(ctx, cx2 - (c[0] ? 8 : 0), cy2, 8, 2, '#f2c94c');
      rect(ctx, cx2 - (c[0] ? 2 : 0), cy2 - (c[1] ? 8 : 0), 2, 8, '#f2c94c');
    }
    drawText(ctx, 'AE/AF LOCK', fx, fy - 10, '#f2c94c', { font: 'small' });
    // the top strip
    rect(ctx, B.x, B.y, B.w, 34, '#07070c');
    this.backRect = { x: B.x, y: B.y, w: 30, h: 34 };
    lbChevron(ctx, B.x + 13, B.y + 17, -1, LB.cream, 4);
    drawText(ctx, 'FLASH OFF', B.x + B.w / 2, B.y + 14, '#f2c94c', { align: 'center', font: 'small' });
    drawText(ctx, '0.5x  1x  2x', B.x + B.w - 10, B.y + 22, '#8a84a0', { align: 'right', font: 'small' });
    // the mode strip
    const modes = ['VIDEO', 'PHOTO', 'PORTRAIT'];
    const my = vy + vh + 10;
    modes.forEach(function (m, i) {
      const mx = B.x + 26 + i * 60;
      self.nav.push({ x: mx - 26, y: my, w: 54, h: 14, r: 7, go: function () { self.camMode = i; Audio.ui('move'); } });
      drawText(ctx, m, mx, my + 4, i === self.camMode ? '#f2c94c' : '#5a5670', { align: 'center', font: 'small' });
    });
    // the shutter, and the roll
    const sy = my + 26;
    this.nav.push({ x: B.x + B.w / 2 - 22, y: sy, w: 44, h: 44, r: 22, go: function () { self.shot = 0; Audio.ui('pop'); Game.shake.hit(2, 0.1); } });
    circle(ctx, B.x + B.w / 2, sy + 22, 21, '#f4f1ea');
    circle(ctx, B.x + B.w / 2, sy + 22, 17, self.camMode === 0 ? LB.red : '#fdfdff');
    ringPx(ctx, B.x + B.w / 2, sy + 22, 21, '#8a8496');
    rect(ctx, B.x + 16, sy + 8, 28, 28, '#1c1b26'); frame(ctx, B.x + 16, sy + 8, 28, 28, '#3a3648');
    if (this.you && this.you.spec) { ctx.save(); ctx.beginPath(); ctx.rect(B.x + 17, sy + 9, 26, 26); ctx.clip(); drawBugAt(ctx, this.you.spec, B.x + 30, sy + 34, { pose: 'idle', scale: 1, bounce: 0 }); ctx.restore(); }
    circle(ctx, B.x + B.w - 30, sy + 22, 14, '#1c1b26');
    for (let i = 0; i < 2; i++) { const a = i * Math.PI; rect(ctx, B.x + B.w - 30 + Math.cos(a) * 7 - 3, sy + 22 + Math.sin(a) * 7 - 1, 6, 2, LB.cream); }
    if (this.shot != null && this.shot < 0.22) { ctx.globalAlpha = 1 - this.shot / 0.22; rect(ctx, B.x, B.y, B.w, B.h + 16, '#ffffff'); ctx.globalAlpha = 1; }
    else if (this.shot != null && this.shot < 2.4) drawText(ctx, 'SAVED TO THE ROLL', B.x + B.w / 2, vy + vh - 14, '#6be585', { align: 'center', font: 'small' });
    this.cols = 3;
  }

  // ---------- SETTINGS ----------
  appSettings(ctx, B) {
    const self = this, r = Game.run;
    const y0 = this.header(ctx, B, 'SETTINGS', 'LADYBUG 11');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0f0f15');
    const toggles = [
      { k: 'SOUND', get: function () { return !Game.muted; }, set: function () { Game.muted = !Game.muted; Audio.setMuted(Game.muted); } },
      { k: 'AIRPLANE MODE', get: function () { return !!self.airplane; }, set: function () { self.airplane = !self.airplane; } },
      { k: 'LOW POWER', get: function () { return self.batt < 0.25 || !!self.lowpower; }, set: function () { self.lowpower = !self.lowpower; } },
      { k: 'DO NOT DISTURB', get: function () { return !!self.dnd; }, set: function () { self.dnd = !self.dnd; } },
    ];
    toggles.forEach(function (tg, i) {
      const ry = y0 + 8 + i * 32;
      rect(ctx, B.x, ry, B.w, 30, '#171722');
      rect(ctx, B.x + 10, ry + 30, B.w - 20, 1, '#22222e');
      drawText(ctx, tg.k, B.x + 12, ry + 11, LB.cream, { scale: 2 });
      self.nav.push({ x: B.x + B.w - 46, y: ry + 6, w: 34, h: 18, r: 9, go: function () { tg.set(); Audio.ui('select'); } });
      lbToggle(ctx, B.x + B.w - 42, ry + 8, tg.get());
    });
    // the storage bar, which is mostly video of one night
    const sy = y0 + 148;
    drawText(ctx, 'STORAGE', B.x + 12, sy, '#5a5670', { font: 'small' });
    const segs = [['VIDEO', 0.44, '#e0483a'], ['PHOTOS', 0.22, '#f2c94c'], ['APPS', 0.14, '#3f7df0'], ['OTHER', 0.06, '#8a84a0']];
    let sx = B.x + 12, total = 0;
    segs.forEach(function (s) { const w = Math.round((B.w - 24) * s[1]); rect(ctx, sx, sy + 12, w, 10, s[2]); rect(ctx, sx, sy + 12, w, 2, lighten(s[2], 0.25)); sx += w; total += s[1]; });
    rect(ctx, sx, sy + 12, B.x + B.w - 12 - sx, 10, '#26262f');
    segs.forEach(function (s, i) {
      const cx2 = B.x + 12 + (i % 2) * 96, cy2 = sy + 30 + Math.floor(i / 2) * 12;
      rect(ctx, cx2, cy2 + 1, 5, 5, s[2]);
      drawText(ctx, s[0] + ' ' + Math.round(s[1] * 128) + 'GB', cx2 + 9, cy2, '#8a84a0', { font: 'small' });
    });
    // the about rows
    const rows = [['CARRIER', lbCarrier()], ['MODEL', 'LADYBUG 11'], ['CASE', 'LADYBUG, RED'], ['BATTERY', Math.round(this.batt * 100) + '% - NO CHARGER'], ['SCREEN', 'ONE HAIRLINE CRACK'], ['NAME', String((this.you.name || 'BUSKER')).toUpperCase() + "'S PHONE"]];
    rows.forEach(function (rw, i) {
      const ry = sy + 66 + i * 22;
      rect(ctx, B.x, ry, B.w, 20, i % 2 ? '#131320' : '#171722');
      drawText(ctx, rw[0], B.x + 12, ry + 7, '#6a6478', { font: 'small' });
      drawText(ctx, rw[1], B.x + B.w - 12, ry + 7, LB.cream, { align: 'right', font: 'small' });
    });
    this.cols = 1;
  }

  // ---------- MUSIC ----------
  appMusic(ctx, B) {
    const self = this, t = this.t;
    const y0 = this.header(ctx, B, 'MUSIC', 'LIBRARY');
    vgrad(ctx, B.x, y0, B.w, B.h - 28, '#3a1024', '#0e0810');
    const aw = B.w - 60, ax = B.x + 30, ay = y0 + 16;
    // the sleeve: a room, a stage, a bug
    rect(ctx, ax + 3, ay + 5, aw, aw, 'rgba(4,3,10,0.6)');
    vgrad(ctx, ax, ay, aw, aw, '#7a1a2a', '#241020');
    for (let i = 0; i < 5; i++) { ctx.globalAlpha = 0.16; ellipsePx(ctx, ax + aw / 2, ay + aw * 0.72, aw * 0.5 - i * 8, aw * 0.22 - i * 3, '#ffd24a'); ctx.globalAlpha = 1; }
    if (this.you && this.you.spec) drawBugAt(ctx, this.you.spec, ax + aw / 2, ay + aw * 0.78, { pose: 'play', scale: 2, bounce: 0.6, phase: t });
    rect(ctx, ax, ay + aw - 22, aw, 22, 'rgba(8,4,12,0.75)');
    drawText(ctx, 'LAST NIGHT AT THE HIVE', ax + 6, ay + aw - 16, '#ffd24a', { font: 'small' });
    frame(ctx, ax, ay, aw, aw, '#8a3a4a');
    drawText(ctx, 'ONE MORE STOP', B.x + B.w / 2, ay + aw + 12, LB.cream, { align: 'center', scale: 2 });
    drawText(ctx, 'THE BAND YOU WERE IN', B.x + B.w / 2, ay + aw + 28, '#a07a90', { align: 'center', font: 'small' });
    // the scrubber
    const sy = ay + aw + 46, k = (this.appT * 0.006) % 1;
    rect(ctx, B.x + 24, sy, B.w - 48, 3, '#4a2a3a');
    rect(ctx, B.x + 24, sy, Math.round((B.w - 48) * k), 3, '#ffd24a');
    circle(ctx, B.x + 24 + (B.w - 48) * k, sy + 1, 4, '#fff4d8');
    drawText(ctx, pad2(Math.floor(k * 213 / 60)) + ':' + pad2(Math.floor(k * 213) % 60), B.x + 24, sy + 8, '#a07a90', { font: 'small' });
    drawText(ctx, '-' + pad2(Math.floor((213 - k * 213) / 60)) + ':' + pad2(Math.floor(213 - k * 213) % 60), B.x + B.w - 24, sy + 8, '#a07a90', { align: 'right', font: 'small' });
    // the transport
    const ty = sy + 26, cx = B.x + B.w / 2;
    const tri = function (x, d, s) { ctx.fillStyle = LB.cream; ctx.beginPath(); ctx.moveTo(x + d * s, ty + 10); ctx.lineTo(x - d * s, ty + 10 - s); ctx.lineTo(x - d * s, ty + 10 + s); ctx.fill(); };
    this.nav.push({ x: cx - 66, y: ty, w: 28, h: 22, r: 6, go: function () { Audio.ui('back'); self.flash('THE ONE BEFORE IS THE SAME SONG.'); } });
    tri(cx - 52, -1, 8); rect(ctx, cx - 62, ty + 3, 2, 14, LB.cream);
    this.nav.push({ x: cx - 18, y: ty - 6, w: 36, h: 36, r: 18, go: function () { self.playing = !self.playing; Audio.ui('select'); } });
    circle(ctx, cx, ty + 10, 17, '#ffd24a');
    if (this.playing) { ctx.fillStyle = '#2a1a08'; ctx.beginPath(); ctx.moveTo(cx + 7, ty + 10); ctx.lineTo(cx - 5, ty + 3); ctx.lineTo(cx - 5, ty + 17); ctx.fill(); }
    else { rect(ctx, cx - 5, ty + 3, 4, 14, '#2a1a08'); rect(ctx, cx + 2, ty + 3, 4, 14, '#2a1a08'); }
    this.nav.push({ x: cx + 38, y: ty, w: 28, h: 22, r: 6, go: function () { Audio.ui('move'); self.flash('THERE IS NOTHING AFTER IT.'); } });
    tri(cx + 52, 1, 8); rect(ctx, cx + 60, ty + 3, 2, 14, LB.cream);
    // a meter that is not measuring anything
    for (let i = 0; i < 20; i++) {
      const bh = 3 + Math.abs(Math.sin(t * 3 + i * 0.7)) * 16 * (this.playing === false ? 0.2 : 1);
      rect(ctx, B.x + 14 + i * ((B.w - 28) / 20), B.y + B.h - 22 - bh, 6, bh, ['#ff5a9a', '#8ad8ff', '#ffd24a'][i % 3]);
    }
    this.cols = 3;
  }

  // ---------- CONTACTS ----------
  appContacts(ctx, B) {
    const self = this, r = Game.run;
    const list = ((r && r.contacts) || []).filter(function (k) { return CONTACTS[k]; });
    const y0 = this.header(ctx, B, 'CONTACTS', list.length + ' CARDS');
    rect(ctx, B.x, y0, B.w, B.h - 28, LB.paper);
    if (!list.length) {
      drawText(ctx, 'NOBODY.', B.x + 16, y0 + 24, '#241d28', { scale: 3 });
      drawWrapped(ctx, 'NOBODY HAS GIVEN YOU THEIR NUMBER YET. GO AND BE USEFUL TO SOMEONE.', B.x + 16, y0 + 52, 40, '#7a7060', 10, { font: 'small' });
      return;
    }
    list.forEach(function (k, i) {
      const C = CONTACTS[k], used = r.usedContacts.indexOf(k) >= 0;
      const ry = y0 + 6 + i * 50;
      if (ry > B.y + B.h - 30) return;
      self.nav.push({ x: B.x + 4, y: ry, w: B.w - 8, h: 46, r: 6, go: function () { self.callContact(k); } });
      rect(ctx, B.x + 10, ry + 46, B.w - 20, 1, '#e0d8c0');
      circle(ctx, B.x + 26, ry + 22, 15, used ? '#b8b2a8' : (C.tint || '#4a86f7'));
      drawText(ctx, String(C.name || k)[0], B.x + 26, ry + 16, '#fff8e8', { align: 'center', scale: 2 });
      drawText(ctx, String(C.name || k).toUpperCase().slice(0, 15), B.x + 48, ry + 8, used ? '#9a9488' : '#241d28', { scale: 2 });
      drawText(ctx, String(C.who || '').toUpperCase(), B.x + 48, ry + 22, '#8a8070', { font: 'small' });
      drawText(ctx, used ? 'ALREADY CALLED' : 'TAP TO CALL', B.x + 48, ry + 32, used ? '#b0aa9c' : '#2f7a4a', { font: 'small' });
      if (!used) { circle(ctx, B.x + B.w - 22, ry + 22, 11, '#2f9a56'); rect(ctx, B.x + B.w - 27, ry + 20, 10, 4, '#eafff0'); }
    });
  }

  // ---------- THE BAND ----------
  appBand(ctx, B) {
    const self = this, r = Game.run, t = this.t;
    const mem = (r && r.members) || [];
    const y0 = this.header(ctx, B, 'THE BAND', mem.length + ' OF YOU');
    vgrad(ctx, B.x, y0, B.w, B.h - 28, '#2a1220', '#100810');
    mem.forEach(function (m, i) {
      const ry = y0 + 8 + i * 58;
      if (ry > B.y + B.h - 40) return;
      self.nav.push({ x: B.x + 8, y: ry, w: B.w - 16, h: 52, r: 8, go: function () { self.flash(String(m.name || 'THEM').toUpperCase() + ' IS ' + (m.hunger >= 2 ? 'HUNGRY AND SAYING SO.' : 'FINE.')); } });
      lbCard(ctx, B.x + 8, ry, B.w - 16, 52, 8, '#2a2036', { shadow: false, edge: '#4a3a56' });
      drawBugAt(ctx, m.spec, B.x + 32, ry + 44, { pose: i === 0 ? 'play' : 'idle', scale: 1.2, bounce: 0.5, phase: i * 1.7 + t * 0.4 });
      drawText(ctx, String(m.name || 'BUG').toUpperCase(), B.x + 56, ry + 8, '#fff4d8', { scale: 2 });
      const inm = INSTRUMENTS[m.instrument] ? INSTRUMENTS[m.instrument].name : m.instrument;
      drawText(ctx, String(inm).toUpperCase(), B.x + 56, ry + 22, '#8ad8ff', { font: 'small' });
      for (let q = 0; q < 5; q++) rect(ctx, B.x + 56 + q * 8, ry + 34, 6, 6, q < (m.quality || 1) ? LB.gold : '#3a3048');
      const hungry = (m.hunger || 0) >= 2;
      drawText(ctx, hungry ? 'HUNGRY' : 'OK', B.x + B.w - 18, ry + 22, hungry ? LB.red : '#6be585', { align: 'right', font: 'small' });
      rect(ctx, B.x + B.w - 60, ry + 34, 42, 5, '#3a3048');
      rect(ctx, B.x + B.w - 60, ry + 34, Math.round(42 * clamp((m.stamina || 0) / 100, 0, 1)), 5, '#6be585');
    });
    drawText(ctx, 'FAME ' + fmtNum((r && r.fame) || 0) + '   FOLLOWERS ' + fmtNum((r && r.followers) || 0), B.x + B.w / 2, B.y + B.h - 22, '#a07a90', { align: 'center', font: 'small' });
  }

  // ---------- MAIL ----------
  appMail(ctx, B) {
    const self = this;
    if (this.sub) {
      const m = this.sub;
      const y0 = this.header(ctx, B, 'MAIL', m.t);
      rect(ctx, B.x, y0, B.w, B.h - 28, '#0f1218');
      drawText(ctx, m.from, B.x + 12, y0 + 12, '#5ab0f0', { scale: 2 });
      drawText(ctx, m.sub, B.x + 12, y0 + 30, LB.cream, { font: 'small' });
      rect(ctx, B.x + 12, y0 + 44, B.w - 24, 1, '#22262e');
      drawWrapped(ctx, m.body, B.x + 12, y0 + 54, 44, '#b8bcc8', 11, { font: 'small' });
      drawText(ctx, 'UNSUBSCRIBE', B.x + 12, y0 + 120, '#3a4450', { font: 'small' });
      return;
    }
    const y0 = this.header(ctx, B, 'INBOX', LB_MAIL.filter(function (m) { return m.unread; }).length + ' NEW');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0f1218');
    LB_MAIL.forEach(function (m, i) {
      const ry = y0 + 4 + i * 56;
      self.nav.push({ x: B.x + 4, y: ry, w: B.w - 8, h: 52, r: 6, go: function () { self.sub = m; m.unread = false; self.sel = 0; Audio.ui('select'); } });
      rect(ctx, B.x + 10, ry + 52, B.w - 20, 1, '#1c2028');
      if (m.unread) circle(ctx, B.x + 12, ry + 14, 4, '#3f7df0');
      drawText(ctx, m.from, B.x + 22, ry + 8, m.unread ? LB.cream : '#8a90a0', { scale: 2 });
      drawText(ctx, m.t, B.x + B.w - 12, ry + 9, '#4a5260', { align: 'right', font: 'small' });
      drawWrapped(ctx, m.sub, B.x + 22, ry + 24, 34, '#8a90a0', 9, { font: 'small' });
      drawText(ctx, String(m.body).slice(0, 34), B.x + 22, ry + 42, '#4a5260', { font: 'small' });
    });
  }

  // ---------- CALENDAR ----------
  appCalendar(ctx, B) {
    const self = this, r = Game.run, day = (r && r.day) || 0;
    const y0 = this.header(ctx, B, 'NOVEMBER', 'DAY ' + Math.min(5, day + 1) + '/5');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#f4f1ea');
    const hdr = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    hdr.forEach(function (h, i) { drawText(ctx, h, B.x + 18 + i * 27, y0 + 8, '#9a9488', { align: 'center', font: 'small' }); });
    const today = 12 + day;
    for (let i = 0; i < 35; i++) {
      const d = i - 2, cx = B.x + 18 + (i % 7) * 27, cy2 = y0 + 24 + Math.floor(i / 7) * 26;
      if (d < 1 || d > 30) continue;
      const isToday = d === today, isRun = d >= 12 && d <= 16;
      if (isToday) circle(ctx, cx, cy2 + 5, 11, '#c8402c');
      drawText(ctx, String(d), cx, cy2 + 2, isToday ? '#fff4e8' : (isRun ? '#241d28' : '#a8a296'), { align: 'center', scale: isToday ? 2 : 1 });
      if (isRun && !isToday) circle(ctx, cx, cy2 + 14, 2, '#2f7a4a');
    }
    rect(ctx, B.x + 12, y0 + 160, B.w - 24, 1, '#ddd7c8');
    drawText(ctx, 'TODAY', B.x + 12, y0 + 168, '#9a9488', { font: 'small' });
    const evts = [['07:00', 'WAKE UP IN A DRAWER', '#c8402c'], ['12:00', 'EAT SOMETHING', '#e0783c'], ['19:00', 'THE BEATLES - LOAD IN', '#2f7a4a'], ['23:30', 'LAST TRAIN', '#3f7df0']];
    evts.forEach(function (e, i) {
      const ry = y0 + 182 + i * 26;
      rect(ctx, B.x + 12, ry, 3, 20, e[2]);
      drawText(ctx, e[0], B.x + 20, ry + 2, '#7a7466', { font: 'small' });
      drawText(ctx, e[1], B.x + 20, ry + 11, '#241d28', { font: 'small' });
      self.nav.push({ x: B.x + 8, y: ry - 2, w: B.w - 16, h: 24, r: 4, go: function () { self.flash(e[0] + ' - ' + e[1]); } });
    });
    this.cols = 1;
  }

  // ---------- PHOTOS ----------
  appPhotos(ctx, B) {
    const self = this, t = this.t, r = Game.run;
    const y0 = this.header(ctx, B, 'PHOTOS', '41 ITEMS');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0d0d13');
    drawText(ctx, 'LAST FIVE DAYS', B.x + 10, y0 + 8, '#6a6478', { font: 'small' });
    const cols = 3, s = Math.floor((B.w - 16) / cols) - 2;
    const mem = (r && r.members) || [this.you];
    for (let i = 0; i < 12; i++) {
      const tx = B.x + 8 + (i % cols) * (s + 3), ty = y0 + 22 + Math.floor(i / cols) * (s + 3);
      self.nav.push({ x: tx, y: ty, w: s, h: s, r: 2, go: function () { Audio.ui('pop'); self.flash(['A BLURRED TRAIN.', 'SOMEBODY ELSE THUMB.', 'A VERY GOOD BOWL OF NOODLES.', 'THE CEILING OF THE CAPSULE.'][i % 4]); } });
      const rr = makeRng(700 + i);
      vgrad(ctx, tx, ty, s, s, ['#2a3450', '#3a2a3a', '#243a2c', '#3a2f22'][i % 4], '#0d0d13');
      for (let j = 0; j < 5; j++) rect(ctx, tx + rr.int(0, s - 8), ty + s - rr.int(6, s), rr.int(4, 12), s, 'rgba(0,0,0,0.3)');
      if (i % 3 === 0 && mem.length) { ctx.save(); ctx.beginPath(); ctx.rect(tx, ty, s, s); ctx.clip(); drawBugAt(ctx, mem[i % mem.length].spec, tx + s / 2, ty + s - 4, { pose: ['idle', 'play', 'cheer', 'sad'][i % 4], scale: 1.1, bounce: 0 }); ctx.restore(); }
      frame(ctx, tx, ty, s, s, '#1c1b26');
      if (i === 2) { rect(ctx, tx + s - 16, ty + s - 10, 14, 8, 'rgba(0,0,0,0.6)'); drawText(ctx, '0:14', tx + s - 9, ty + s - 9, '#fff', { align: 'center', font: 'small' }); }
    }
    drawText(ctx, 'NONE OF THESE ARE GOOD.', B.x + B.w / 2, B.y + B.h - 24, '#3a3648', { align: 'center', font: 'small' });
    this.cols = 3;
  }

  // ---------- RAMENGO ----------
  appRamen(ctx, B) {
    const self = this, t = this.t;
    const y0 = this.header(ctx, B, 'RAMENGO', 'OPEN NOW');
    vgrad(ctx, B.x, y0, B.w, B.h - 28, '#2e1c12', '#140c08');
    const shops = [['MENYA HACHI', 4.8, '$', '220 M', 'TONKOTSU, 9 SEATS'], ['KATSU TARO', 4.6, '$$', '400 M', 'THE PORK ONE'],
      ['SOUP CURRY POP', 4.4, '$$', '900 M', 'NOT RAMEN. STILL GOOD.'], ['GYOZA STAND', 4.2, '$', '1.1 KM', 'SIX FOR TWO DOLLARS'], ['TSUKEMEN BROS', 4.9, '$$$', '2.4 KM', 'QUEUE STARTS AT ELEVEN']];
    shops.forEach(function (s, i) {
      const ry = y0 + 8 + i * 54;
      self.nav.push({ x: B.x + 8, y: ry, w: B.w - 16, h: 48, r: 8, go: function () { Audio.ui('eat'); self.flash(s[0] + ' - ' + s[4]); } });
      lbCard(ctx, B.x + 8, ry, B.w - 16, 48, 8, '#3a2418', { shadow: false, edge: '#5a3a24' });
      ellipsePx(ctx, B.x + 30, ry + 26, 15, 10, '#f0ece2');
      ellipsePx(ctx, B.x + 30, ry + 23, 12, 7, '#e0a04a');
      circle(ctx, B.x + 34, ry + 23, 3, '#f4f1ea'); circle(ctx, B.x + 34, ry + 23, 1, '#e8b83a');
      for (let j = 0; j < 3; j++) rect(ctx, B.x + 25 + j * 5, ry + 8 - Math.round(Math.sin(t * 3 + j + i) * 2), 2, 6, withAlpha('#ffffff', 0.55));
      drawText(ctx, s[0], B.x + 52, ry + 7, '#ffe9c8', { scale: 2 });
      lbStars(ctx, B.x + 52, ry + 22, s[1], '#f2c94c');
      drawText(ctx, String(s[1]), B.x + 90, ry + 22, '#c8a07a', { font: 'small' });
      drawText(ctx, s[2] + '  ' + s[3], B.x + 52, ry + 34, '#a07a5a', { font: 'small' });
      drawText(ctx, 'OPEN', B.x + B.w - 18, ry + 8, '#6be585', { align: 'right', font: 'small' });
    });
    drawText(ctx, 'YOU HAVE READ ALL OF THESE TWICE.', B.x + B.w / 2, B.y + B.h - 22, '#6a5038', { align: 'center', font: 'small' });
  }

  // ---------- CALCULATOR ----------
  appCalc(ctx, B) {
    const self = this;
    const y0 = this.header(ctx, B, 'CALC', 'YEN / USD');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#141418');
    drawText(ctx, String(this.calc).slice(-11), B.x + B.w - 14, y0 + 30, LB.cream, { align: 'right', scale: 5 });
    drawText(ctx, this.calcOp ? (fmtNum(this.calcAcc) + ' ' + this.calcOp) : 'THE MATHS YOU DO EVERY DAY', B.x + B.w - 14, y0 + 16, '#5a5670', { align: 'right', font: 'small' });
    const keys = [['C', '+/-', '%', '/'], ['7', '8', '9', '*'], ['4', '5', '6', '-'], ['1', '2', '3', '+'], ['0', '.', '=', 'Y']];
    const kw = Math.floor((B.w - 20) / 4) - 3, kh = 34;
    keys.forEach(function (row, r2) {
      row.forEach(function (k, c2) {
        const kx = B.x + 10 + c2 * (kw + 3), ky = y0 + 68 + r2 * (kh + 4);
        const op = ['/', '*', '-', '+', '='].indexOf(k) >= 0;
        const util = ['C', '+/-', '%', 'Y'].indexOf(k) >= 0;
        self.nav.push({ x: kx, y: ky, w: kw, h: kh, r: Math.floor(kh / 2), go: function () { self.calcKey(k); } });
        lbRound(ctx, kx, ky, kw, kh, Math.floor(kh / 2), op ? '#f28a2e' : util ? '#7a7484' : '#33333d');
        ctx.globalAlpha = 0.14; lbRound(ctx, kx + 2, ky + 2, kw - 4, 10, 5, '#ffffff'); ctx.globalAlpha = 1;
        drawText(ctx, k, kx + kw / 2, ky + kh / 2 - 7, op ? '#2a1600' : util ? '#1a1a22' : LB.cream, { align: 'center', scale: 2 });
      });
    });
    drawText(ctx, 'Y CONVERTS AT 152 TO THE DOLLAR', B.x + B.w / 2, B.y + B.h - 22, '#3a3648', { align: 'center', font: 'small' });
    this.cols = 4;
  }
  calcKey(k) {
    Audio.ui('move');
    const n = parseFloat(this.calc) || 0;
    if (k === 'C') { this.calc = '0'; this.calcAcc = null; this.calcOp = null; return; }
    if (k === '+/-') { this.calc = String(-n); return; }
    if (k === '%') { this.calc = String(n / 100); return; }
    if (k === 'Y') { this.calc = String(Math.round(n * 152)); return; }
    if (k === '=') {
      if (this.calcOp == null) return;
      const a = this.calcAcc, b = n;
      let v = a;
      if (this.calcOp === '+') v = a + b; else if (this.calcOp === '-') v = a - b;
      else if (this.calcOp === '*') v = a * b; else if (this.calcOp === '/') v = b ? a / b : 0;
      this.calc = String(Math.round(v * 1000) / 1000); this.calcOp = null; this.calcAcc = null; Audio.ui('select'); return;
    }
    if (['+', '-', '*', '/'].indexOf(k) >= 0) { this.calcAcc = n; this.calcOp = k; this.calc = '0'; return; }
    if (k === '.' && String(this.calc).indexOf('.') >= 0) return;
    this.calc = (this.calc === '0' && k !== '.') ? k : String(this.calc) + k;
  }

  // ---------- HEALTH ----------
  appSteps(ctx, B) {
    const r = Game.run, t = this.t;
    const y0 = this.header(ctx, B, 'HEALTH', 'TODAY');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#f4f1ea');
    const blocks = (r && r.today && r.today.tiles) || 0, goal = 14;
    const k = clamp(blocks / goal, 0, 1);
    const cx = B.x + B.w / 2, cy2 = y0 + 84;
    ringPx(ctx, cx, cy2, 58, '#e2ddd0'); ringPx(ctx, cx, cy2, 56, '#e2ddd0');
    for (let i = 0; i < Math.round(k * 56); i++) { const a = -Math.PI / 2 + (i / 56) * Math.PI * 2; rect(ctx, cx + Math.cos(a) * 57 - 3, cy2 + Math.sin(a) * 57 - 3, 6, 6, '#e0483a'); }
    drawText(ctx, String(blocks), cx, cy2 - 20, '#241d28', { align: 'center', scale: 6 });
    drawText(ctx, 'BLOCKS WALKED', cx, cy2 + 16, '#8a8478', { align: 'center', font: 'small' });
    drawText(ctx, 'GOAL ' + goal, cx, cy2 + 28, '#c0b8a8', { align: 'center', font: 'small' });
    const rows = [['STAMINA', (r ? r.stamina : 0) + ' / ' + (r ? r.staminaMax : 0), '#e0483a'],
      ['SLEEP', '4 H 10 M', '#3f7df0'], ['STANDING', '9 HOURS', '#f2c94c'], ['MEALS', String((r && r.members ? r.members.filter(function (m) { return !m.hunger; }).length : 0)) + ' FED', '#3fc06a']];
    rows.forEach(function (rw, i) {
      const ry = y0 + 166 + i * 34;
      rect(ctx, B.x + 10, ry, B.w - 20, 30, '#ffffff');
      rect(ctx, B.x + 10, ry, 3, 30, rw[2]);
      drawText(ctx, rw[0], B.x + 20, ry + 6, '#8a8478', { font: 'small' });
      drawText(ctx, rw[1], B.x + 20, ry + 16, '#241d28', { scale: 2 });
    });
    this.cols = 1;
  }

  // ---------- APP SHOP ----------
  appStore(ctx, B) {
    const self = this, t = this.t;
    const y0 = this.header(ctx, B, 'APP SHOP', 'TODAY');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#f2f2f6');
    lbCard(ctx, B.x + 10, y0 + 8, B.w - 20, 96, 10, '#1b2a44', { edge: '#3f7df0' });
    drawText(ctx, 'APP OF THE DAY', B.x + 20, y0 + 16, '#8fb8ff', { font: 'small' });
    drawText(ctx, 'BUSK PRO', B.x + 20, y0 + 28, LB.cream, { scale: 3 });
    drawWrapped(ctx, 'COUNTS YOUR TIPS. TAKES 14%. RATED 2.1.', B.x + 20, y0 + 52, 32, '#8fb8ff', 10, { font: 'small' });
    ladybugIcon(ctx, B.x + B.w - 58, y0 + 46, 38, 'wallet', t);
    const apps = [['TUNER FREE', 'MUSIC', '#2f7a4a'], ['VISA HELPER', 'UTILITIES', '#3f7df0'], ['SLEEP CAPSULE', 'TRAVEL', '#a06bff'], ['HOW TO BOW', 'EDUCATION', '#f28a2e']];
    apps.forEach(function (a, i) {
      const ry = y0 + 116 + i * 44;
      self.nav.push({ x: B.x + 10, y: ry, w: B.w - 20, h: 40, r: 6, go: function () { Audio.ui('error'); self.flash('NOT ENOUGH STORAGE. NOT EVER.'); } });
      rect(ctx, B.x + 10, ry + 40, B.w - 20, 1, '#e0e0e8');
      lbRound(ctx, B.x + 12, ry + 4, 32, 32, 8, a[2]);
      drawText(ctx, a[0][0], B.x + 28, ry + 13, '#ffffff', { align: 'center', scale: 2 });
      drawText(ctx, a[0], B.x + 52, ry + 8, '#1a1826', { scale: 2 });
      drawText(ctx, a[1], B.x + 52, ry + 24, '#8a8496', { font: 'small' });
      lbPill(ctx, B.x + B.w - 56, ry + 12, 42, 16, '#e4e4ec', 'GET', '#3f7df0');
    });
    this.cols = 1;
  }

  // ---------- COMPASS ----------
  appCompass(ctx, B) {
    const t = this.t;
    const y0 = this.header(ctx, B, 'COMPASS', 'TRUE NORTH');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0c0b12');
    const cx = B.x + B.w / 2, cy2 = y0 + 120, a = Math.sin(t * 0.3) * 0.5 + 2.1;
    ringPx(ctx, cx, cy2, 84, '#22212e');
    for (let i = 0; i < 72; i++) { const aa = i * Math.PI / 36 - a; const rr2 = i % 9 === 0 ? 68 : 76; rect(ctx, cx + Math.sin(aa) * rr2 - 1, cy2 - Math.cos(aa) * rr2 - 1, 2, 2, i % 9 === 0 ? LB.cream : '#4a4658'); }
    ['N', 'E', 'S', 'W'].forEach(function (d, i) {
      const aa = i * Math.PI / 2 - a;
      drawText(ctx, d, cx + Math.sin(aa) * 56, cy2 - Math.cos(aa) * 56 - 4, i === 0 ? LB.red : LB.cream, { align: 'center', scale: 2 });
    });
    ctx.fillStyle = LB.red; ctx.beginPath();
    ctx.moveTo(cx + Math.sin(-a) * 44, cy2 - Math.cos(-a) * 44);
    ctx.lineTo(cx + Math.cos(-a) * 7, cy2 + Math.sin(-a) * 7);
    ctx.lineTo(cx - Math.cos(-a) * 7, cy2 - Math.sin(-a) * 7); ctx.fill();
    circle(ctx, cx, cy2, 4, LB.gold);
    drawText(ctx, Math.round(((a * 180 / Math.PI) % 360 + 360) % 360) + ' DEG', cx, y0 + 220, LB.cream, { align: 'center', scale: 4 });
    drawText(ctx, '35.661 N   139.668 E', cx, y0 + 252, '#6a6478', { align: 'center', font: 'small' });
    drawText(ctx, 'ELEVATION 34 M - SHIMOKITAZAWA', cx, y0 + 264, '#4a4658', { align: 'center', font: 'small' });
    this.cols = 1;
  }

  // ---------- PHONE ----------
  appDialer(ctx, B) {
    const self = this, r = Game.run;
    const y0 = this.header(ctx, B, 'PHONE', 'RECENTS');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#0f0f15');
    const recents = [['MUM', 'OUTGOING', '4 MIN', '#f2c94c'], ['MUM', 'MISSED', '-', '#e0483a'], ['UNKNOWN', 'INCOMING', '0 SEC', '#8a84a0'], ['VOICEMAIL', 'ONE MESSAGE', '0:42', '#3f7df0']];
    recents.forEach(function (rc, i) {
      const ry = y0 + 6 + i * 42;
      self.nav.push({ x: B.x + 4, y: ry, w: B.w - 8, h: 38, r: 6, go: function () { Audio.ui('select'); self.flash(rc[0] === 'MUM' ? 'IT IS THE MIDDLE OF THE NIGHT THERE.' : 'IT RINGS OUT.'); } });
      rect(ctx, B.x + 10, ry + 38, B.w - 20, 1, '#1c1c26');
      circle(ctx, B.x + 22, ry + 18, 13, rc[3]);
      drawText(ctx, rc[0][0], B.x + 22, ry + 12, '#1a1a22', { align: 'center', scale: 2 });
      drawText(ctx, rc[0], B.x + 42, ry + 8, LB.cream, { scale: 2 });
      drawText(ctx, rc[1], B.x + 42, ry + 24, '#6a6478', { font: 'small' });
      drawText(ctx, rc[2], B.x + B.w - 12, ry + 16, '#6a6478', { align: 'right', font: 'small' });
    });
    // the keypad, because a phone app has to have one
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
    const subs = ['', 'ABC', 'DEF', 'GHI', 'JKL', 'MNO', 'PQRS', 'TUV', 'WXYZ', '', '+', ''];
    const ky = y0 + 184;
    keys.forEach(function (k, i) {
      const kx = B.x + 26 + (i % 3) * 54, kyy = ky + Math.floor(i / 3) * 44;
      self.nav.push({ x: kx - 18, y: kyy, w: 36, h: 36, r: 18, go: function () { Audio.ui('type'); } });
      circle(ctx, kx, kyy + 18, 18, '#25252f');
      ctx.globalAlpha = 0.12; lbRound(ctx, kx - 14, kyy + 3, 28, 8, 4, '#ffffff'); ctx.globalAlpha = 1;
      drawText(ctx, k, kx, kyy + 10, LB.cream, { align: 'center', scale: 2 });
      if (subs[i]) drawText(ctx, subs[i], kx, kyy + 24, '#6a6478', { align: 'center', font: 'small' });
    });
    this.cols = 3;
  }

  // ---------- BROWSER ----------
  appBrowser(ctx, B) {
    const self = this, t = this.t;
    const y0 = this.header(ctx, B, 'BROWSER', '4 TABS');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#f6f6fa');
    lbRound(ctx, B.x + 8, y0 + 6, B.w - 16, 20, 10, '#e4e4ec');
    rect(ctx, B.x + 18, y0 + 12, 6, 8, '#8a8496'); rect(ctx, B.x + 16, y0 + 15, 10, 6, '#8a8496');
    drawText(ctx, 'HOW TO GET PAID IN CASH IN JAPAN', B.x + 30, y0 + 12, '#4a4858', { font: 'small' });
    drawText(ctx, 'ABOUT 2,140,000 RESULTS', B.x + 12, y0 + 34, '#8a8496', { font: 'small' });
    const results = [
      ['TOKYO BUSKING - WHAT IS LEGAL', 'REDDIT.COM/R/TOKYO', 'THE ANSWER IS ALWAYS IT DEPENDS.'],
      ['GET A WORKING HOLIDAY VISA', 'MOFA.GO.JP', 'APPLY FROM YOUR HOME COUNTRY. YOU ARE NOT IN IT.'],
      ['SHIMOKITAZAWA LIVE HOUSES', 'TOKYOGIGGUIDE.COM', '41 VENUES. 39 WANT A DEMO.'],
      ['IS THE BEATLES BAR STILL OPEN', 'FORUM POST, 2019', 'YES. HE NEVER CLOSES. HE JUST LOCKS IT.'],
    ];
    results.forEach(function (rs, i) {
      const ry = y0 + 48 + i * 56;
      self.nav.push({ x: B.x + 8, y: ry, w: B.w - 16, h: 50, r: 4, go: function () { Audio.ui('select'); self.flash(rs[2]); } });
      drawText(ctx, rs[1], B.x + 12, ry, '#2f7a4a', { font: 'small' });
      drawWrapped(ctx, rs[0], B.x + 12, ry + 10, 26, '#2a3f8a', 12, { scale: 2 });
      drawWrapped(ctx, rs[2], B.x + 12, ry + 34, 44, '#6a6878', 9, { font: 'small' });
    });
    rect(ctx, B.x, B.y + B.h - 26, B.w, 26, '#e4e4ec');
    ['<', '>', '+', '=', 'X'].forEach(function (g, i) { drawText(ctx, g, B.x + 22 + i * 42, B.y + B.h - 18, '#6a6878', { align: 'center', scale: 2 }); });
    this.cols = 1;
  }

  appBlank(ctx, B) {
    const y0 = this.header(ctx, B, String(this.app || 'APP').toUpperCase(), '');
    rect(ctx, B.x, y0, B.w, B.h - 28, '#12121a');
    drawText(ctx, 'NOTHING IN HERE.', B.x + B.w / 2, y0 + 60, '#4a4658', { align: 'center', scale: 2 });
  }
}

// ---------- the door the rest of the game knocks on ----------
// The old scene was called PhoneScene and half a dozen places still ask for a
// phone by that shape. This is the one function they need.
function openLadybug(back) { return new LadybugPhone(back); }
