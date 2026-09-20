// ---------- Narita, and the two hours it takes to leave it ----------
// An airport is not a place, it is a corridor with shops in it. You get off
// the aeroplane at the far end of a jet bridge and from there until the kerb
// nobody asks you anything except who you are and what you are carrying.
//
// Three scenes, in the order you walk them:
//   NaritaArrivalScene   - the door, the bridge, immigration, the carousel
//   NaritaTerminalScene  - the vast one. two levels, thirty shops, gate 5
//   NaritaKerbScene      - outside, in the cold, looking for your name
//
// The whole thing is one long walk to the right. The signs are green and they
// are honest; if you get lost it is because you stopped reading them.
'use strict';

// ---------- what an airport is made of ----------
// Four greys, one green, and whatever colour the shops brought with them.
const NRT_PAL = {
  ink: '#151821', deep: '#1d222d', wall: '#3a4150', wallHi: '#4e5668', wallLo: '#252b36',
  floor: '#6d6a63', floorLo: '#5b5852', floorHi: '#8f8b82',
  steel: '#b9bec6', steelHi: '#e2e6ec', steelLo: '#8a8f98',
  glass: '#2f4a68', glassTop: '#8fc0e4',
  green: '#1f7a52', greenHi: '#2fa86c', cream: '#f4f1ea',
  amber: '#f2a03a', gold: '#ffd24a', red: '#c8402c', sky: '#8ad8ff',
  outside: '#7d90a4',            // the grey afternoon behind the curtain wall
};

// ---------- the shops, which somebody else wrote ----------
// js/data/shops.js is a separate file and a separate agent. Everything here
// asks for it politely and carries on if it is not there yet, because a scene
// that throws on load takes the whole game with it.
const NRT_FALLBACK_SHOPS = [
  // In blocks of five, in the order the bands ask for them, so a terminal
  // built without the data file still has a food court that sells food.
  { id: 'starbugs', name: 'STARBUGS', logo: 'ring', col: '#0b6b4a', col2: '#f4f1ea', tag: 'SINCE THE FIRST ONE' },
  { id: 'burgermonarch', name: 'BURGER MONARCH', logo: 'crown', col: '#c8402c', col2: '#ffd24a', tag: 'FLAME GRILLED' },
  { id: 'antties', name: 'ANTTIES', logo: 'pretzel', col: '#e07a1a', col2: '#f4f1ea', tag: 'TWISTED FRESH' },
  { id: 'katsucounter', name: 'KATSU COUNTER', logo: 'leaf', col: '#8a3a2a', col2: '#ffd24a', tag: 'FRIED, THEN SLICED' },
  { id: 'nooodle', name: 'NOOODLE', logo: 'bottle', col: '#c8503a', col2: '#f4f1ea', tag: 'STANDING ONLY' },

  { id: 'colonymart', name: 'COLONY MART', logo: 'store', col: '#2f8f4a', col2: '#f4f1ea', tag: 'ALWAYS OPEN' },
  { id: 'mantiselec', name: 'MANTIS ELECTRIC', logo: 'bolt', col: '#2f6fc0', col2: '#f4f1ea', tag: 'ADAPTERS AND HOPE' },
  { id: 'dashipot', name: 'DASHI POT', logo: 'leaf', col: '#3a6a4a', col2: '#f4f1ea', tag: 'HOT THINGS IN BOWLS' },
  { id: 'hivebooks', name: 'HIVE BOOKS', logo: 'book', col: '#4a3a8a', col2: '#f4f1ea', tag: 'READ SOMETHING' },
  { id: 'papernest', name: 'PAPER NEST', logo: 'book', col: '#5a6a4a', col2: '#f4f1ea', tag: 'STATIONERY' },

  { id: 'kikigift', name: 'KIKI GIFT', logo: 'star', col: '#e0506a', col2: '#ffd24a', tag: 'OMIYAGE' },
  { id: 'lanternco', name: 'LANTERN CO', logo: 'ring', col: '#c8402c', col2: '#ffd24a', tag: 'GIFTS IN BOXES' },
  { id: 'saltandshell', name: 'SALT AND SHELL', logo: 'star', col: '#3a6a7a', col2: '#ffd24a', tag: 'SEAWEED SNACKS' },
  { id: 'beebread', name: 'BEE BREAD', logo: 'store', col: '#d8a03a', col2: '#3a2a08', tag: 'BAKED AT FOUR' },
  { id: 'matchahour', name: 'MATCHA HOUR', logo: 'leaf', col: '#4a7a3a', col2: '#f4f1ea', tag: 'GREEN, BITTER, FINE' },

  { id: 'sixlegs', name: 'SIX LEGS', logo: 'bag', col: '#2f4a68', col2: '#f4f1ea', tag: 'SHOES FOR ALL OF THEM' },
  { id: 'chrysalis', name: 'CHRYSALIS', logo: 'star', col: '#7a3a8a', col2: '#ffd24a', tag: 'OUTERWEAR' },
  { id: 'mothballs', name: 'MOTHBALLS', logo: 'bag', col: '#5a5a70', col2: '#f4f1ea', tag: 'KNITWEAR' },
  { id: 'weaverknit', name: 'WEAVER', logo: 'bag', col: '#7a5a3a', col2: '#f4f1ea', tag: 'MADE ON A LOOM' },
  { id: 'wingtip', name: 'WINGTIP', logo: 'plane', col: '#12203f', col2: '#e0b23c', tag: 'TRAVEL GOODS' },

  { id: 'pollenbeauty', name: 'POLLEN', logo: 'leaf', col: '#c85a7a', col2: '#f4f1ea', tag: 'BEAUTY HALL' },
  { id: 'moltbeauty', name: 'MOLT', logo: 'pill', col: '#d86a90', col2: '#f4f1ea', tag: 'SKIN. NEW ONE.' },
  { id: 'exoskin', name: 'EXOSKIN', logo: 'pill', col: '#b0446a', col2: '#f4f1ea', tag: 'SHELL CARE' },
  { id: 'glowworm', name: 'GLOWWORM', logo: 'bolt', col: '#c8a03a', col2: '#12101c', tag: 'LIGHTING AND LAMPS' },
  { id: 'nectarpharm', name: 'NECTAR PHARMACY', logo: 'pill', col: '#2f8f7a', col2: '#f4f1ea', tag: 'OPEN LATE' },

  { id: 'amberduty', name: 'AMBER DUTY FREE', logo: 'bottle', col: '#a8701a', col2: '#ffd24a', tag: 'TAX IS OPTIONAL' },
  { id: 'nocturne', name: 'NOCTURNE', logo: 'watch', col: '#c8a03a', col2: '#12101c', tag: 'GENEVE 1861' },
  { id: 'royaljelly', name: 'ROYAL JELLY', logo: 'bottle', col: '#e8a020', col2: '#3a2a08', tag: 'DRINK THE FUTURE' },
  { id: 'cicadaco', name: 'CICADA AND CO', logo: 'watch', col: '#3a4a6a', col2: '#ffd24a', tag: 'SEVENTEEN YEARS' },
  { id: 'hoverboard', name: 'HOVER', logo: 'plane', col: '#2f6fc0', col2: '#f4f1ea', tag: 'LUGGAGE THAT FOLLOWS' },
];
function nrtShopList() {
  if (typeof SHOPS !== 'undefined' && SHOPS && SHOPS.length) return SHOPS;
  return NRT_FALLBACK_SHOPS;
}
function nrtShopById(id) {
  if (typeof shopById === 'function') { const s = shopById(id); if (s) return s; }
  const L = nrtShopList();
  for (let i = 0; i < L.length; i++) if (L[i].id === id) return L[i];
  return null;
}
// A shop record in any shape at all, turned into something brandBoard can draw.
function nrtBrandOf(s) {
  if (!s) return { name: 'CLOSED', logo: 'bag', col: '#4a4a58', col2: '#f4f1ea', tag: '' };
  return {
    name: s.name || s.id || 'SHOP',
    logo: s.logo || 'bag',
    col: s.col || s.color || '#2f4a68',
    col2: s.col2 || '#f4f1ea',
    tag: s.tag || s.sub || '',
    inner: s.inner,
  };
}
// ---------- the people who work here ----------
// Twelve of them, placed by hand. The data file supplies the names and the
// lines when it exists; these are what stands in for it when it does not.
const NRT_FALLBACK_PEOPLE = [
  { name: 'MEETER', voice: 'clerk', lines: ['I HAVE HELD THIS SIGN FOR AN HOUR.', 'HE IS NOT ON THE FLIGHT.', 'HE IS NEVER ON THE FLIGHT.'] },
  { name: 'GUARD ONO', voice: 'guard', lines: ['KEEP LEFT PLEASE.', 'NO PHOTOS AT THE GATES.', 'EXIT IS THAT WAY. IT IS ALWAYS THAT WAY.'] },
  { name: 'INFORMATION', voice: 'clerk', lines: ['WELCOME TO NARITA.', 'TRAIN, BUS, OR A CAR MEETING YOU?', 'A CAR? THEN GATE 5. GROUND LEVEL, EAST END.'] },
  { name: 'SLEEPER', voice: 'oldman', lines: ['MMM.', 'NINE HOURS LAYOVER.', 'THE BENCH HAS AN ARMREST IN THE MIDDLE.', 'THAT IS DELIBERATE.'] },
  { name: 'CLEANER SUMI', voice: 'oldman', lines: ['MIND THE WET BIT.', 'EVERY DAY THE SAME WET BIT.'] },
  { name: 'TOUR LEADER', voice: 'hostess', lines: ['GROUP SEVEN! FLAG UP!', 'IF YOU CAN SEE THE FLAG YOU ARE FINE.', 'NOBODY CAN SEE THE FLAG.'] },
  { name: 'DUTY FREE', voice: 'clerk', lines: ['TAX FREE FOR TRAVELLERS.', 'YOU ARE A TRAVELLER. LOOK AT YOU.'] },
  { name: 'VERY STILL BUG', voice: 'tannoy', lines: ['...', 'I AM WAITING FOR THE 1840.', 'IT IS 1611.'] },
  { name: 'KID', voice: 'kid', lines: ['I HAVE GONE ROUND THIS FOUR TIMES.', 'IT IS FREE. IT IS A FREE RIDE.'] },
  { name: 'SALARYBUG', voice: 'driver', lines: ['YES. YES. I LANDED. YES.', 'I AM WALKING TO THE CAR NOW.', 'I AM NOT WALKING TO THE CAR NOW.'] },
  { name: 'LOST TOURIST', voice: 'you', lines: ['IS THIS ARRIVALS OR DEPARTURES.', 'IT SAYS BOTH.', 'IT CANNOT SAY BOTH.'] },
  { name: 'DOOR GUARD', voice: 'guard', lines: ['GATES ONE TO SEVEN, OUTSIDE.', 'PRIVATE CARS AT FIVE.', 'IT IS COLD OUT THERE. TEN DEGREES.'] },
];
function nrtPeopleList() {
  if (typeof AIRPORT_PEOPLE !== 'undefined' && AIRPORT_PEOPLE && AIRPORT_PEOPLE.length) return AIRPORT_PEOPLE;
  return NRT_FALLBACK_PEOPLE;
}
// Slot i wants a person. Take whoever the data file has at that index and
// normalise the three fields the engine actually reads.
function nrtPerson(i) {
  const L = nrtPeopleList(), F = NRT_FALLBACK_PEOPLE[i % NRT_FALLBACK_PEOPLE.length];
  // If the data file is shorter than the number of slots, the rest of the
  // slots get our own people rather than the same three bugs again.
  const p = L[i] || F;
  const lines = p.lines || p.tag || p.say || p.talk || F.lines;
  // `walk` in the catalogue is how wide a patch they pace. Clamped, because
  // a bug that wanders far enough ends up standing under a shop sign and
  // loses its own prompt to the door.
  return {
    name: p.name || F.name, voice: p.voice || F.voice, tag: lines,
    carry: p.carry || null, walk: Math.min(p.walk || 0, 56),
  };
}

// ---------- bits of building that turn up in all three scenes ----------
// A run of green wayfinding, hung off the ceiling. The arrow is the whole
// point of it: the words are a courtesy.
function nrtGreenSign(ctx, cx, y, w, h, lines, arrow, t) {
  rect(ctx, cx - w / 2 - 2, y - 12, 4, 12, NRT_PAL.steelLo);
  rect(ctx, cx + w / 2 - 2, y - 12, 4, 12, NRT_PAL.steelLo);
  rect(ctx, cx - w / 2, y, w, h, darken(NRT_PAL.green, 0.4));
  rect(ctx, cx - w / 2 + 2, y + 2, w - 4, h - 4, NRT_PAL.green);
  rect(ctx, cx - w / 2 + 2, y + 2, w - 4, 2, NRT_PAL.greenHi);
  // lit from inside, so it throws a little colour on the air under it
  ctx.globalAlpha = 0.1; rect(ctx, cx - w / 2, y + h, w, 10, NRT_PAL.greenHi); ctx.globalAlpha = 1;
  const rows = lines.length;
  for (let i = 0; i < rows; i++) {
    drawText(ctx, lines[i], cx - w / 2 + 10, y + 6 + i * (h - 10) / rows, NRT_PAL.cream, { scale: 2 });
  }
  if (arrow) {
    const ax = arrow > 0 ? cx + w / 2 - 16 : cx - w / 2 + 16, d = Math.sign(arrow);
    ctx.fillStyle = NRT_PAL.cream; ctx.beginPath();
    ctx.moveTo(ax + d * 8, y + h / 2); ctx.lineTo(ax - d * 5, y + h / 2 - 8); ctx.lineTo(ax - d * 5, y + h / 2 + 8); ctx.fill();
  }
}
// The white steel that holds a terminal roof up. Three tones, no curves: a
// truss at this size is a zigzag between two lines and nothing else.
function nrtTruss(ctx, x0, x1, y, depth, seed) {
  rect(ctx, x0, y, x1 - x0, 4, NRT_PAL.steelHi);
  rect(ctx, x0, y + depth, x1 - x0, 4, NRT_PAL.steel);
  const step = 46;
  for (let x = x0; x < x1; x += step) {
    line(ctx, x, y + 4, x + step / 2, y + depth, NRT_PAL.steelLo);
    line(ctx, x + step / 2, y + depth, x + step, y + 4, NRT_PAL.steelLo);
    rect(ctx, x, y + 4, 2, depth - 4, withAlpha('#ffffff', 0.35));
  }
  ctx.globalAlpha = 0.25; rect(ctx, x0, y + depth + 4, x1 - x0, 3, '#000000'); ctx.globalAlpha = 1;
}
// Whatever is outside the glass: a grey afternoon, a wet apron and the tails
// of four aeroplanes that are not yours.
function nrtOutside(ctx, x0, x1, top, bot, t, seed) {
  vgrad(ctx, x0, top, x1 - x0, bot - top, '#98a8b8', '#c2ccd4');
  const r = makeRng(seed || 77);
  // the far treeline, which is the only thing Narita has instead of a skyline
  ctx.fillStyle = '#4a5a52';
  for (let x = x0; x < x1; x += 22) rect(ctx, x, bot - 44 - r.int(0, 10), 22, 50, '#4a5a52');
  rect(ctx, x0, bot - 22, x1 - x0, 22, '#5e6a62');
  // the apron, wet
  rect(ctx, x0, bot - 14, x1 - x0, 14, '#6a7078');
  ctx.globalAlpha = 0.2; rect(ctx, x0, bot - 12, x1 - x0, 4, '#cfe0ea'); ctx.globalAlpha = 1;
  // tails, parked nose-in, all of them somebody else's afternoon
  const cols = [['#c8402c', '#f4f1ea'], ['#1f5f9a', '#ffd24a'], ['#2f7a4a', '#f4f1ea'], ['#7a3a8a', '#ffd24a']];
  for (let i = 0; i < 6; i++) {
    const tx = x0 + 60 + i * 190;
    if (tx > x1) break;
    const c = cols[i % cols.length], h = 40 + (i % 3) * 8;
    ctx.fillStyle = darken(c[0], 0.2); ctx.beginPath();
    ctx.moveTo(tx, bot - 18); ctx.lineTo(tx + h * 0.5, bot - 18 - h); ctx.lineTo(tx + h * 0.9, bot - 18 - h); ctx.lineTo(tx + h * 0.9, bot - 18); ctx.fill();
    rect(ctx, tx + h * 0.55, bot - 14 - h * 0.7, h * 0.3, 6, c[1]);
    rect(ctx, tx - 14, bot - 22, h * 1.5, 5, '#e8eaee');
  }
  // rain, because it is always raining when you arrive
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 90; i++) {
    const rx = x0 + ((r.range(0, x1 - x0) + t * 140) % (x1 - x0));
    const ry = top + ((r.range(0, bot - top) + t * 520) % (bot - top));
    rect(ctx, rx, ry, 1, 6, '#dfe8f0');
  }
  ctx.globalAlpha = 1;
}
// One unreadable Japanese sign board, which is most of the signage in here.
function nrtKanaBoard(ctx, x, y, w, h, col, t, seed) {
  rect(ctx, x, y, w, h, '#0f1219');
  frame(ctx, x, y, w, h, darken(col, 0.35));
  const r = makeRng(seed || 3);
  const s = Math.min(h - 6, 14);
  const n = Math.max(1, Math.floor((w - 8) / (s + 3)));
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(t * 2.4 + i);
    drawKanaBlock(ctx, x + 4 + i * (s + 3), y + (h - s) / 2, s, col, r.int(0, 5));
    ctx.globalAlpha = 1;
  }
}
// Somebody holding a name card up at chest height, hoping.
function nrtNameCard(ctx, x, y, s, text, col) {
  const w = Math.max(38, textWidth(text, { font: 'small' }) + 12);
  rect(ctx, x - w / 2, y - 16 * s, w, 16, '#f4f1ea');
  frame(ctx, x - w / 2, y - 16 * s, w, 16, '#8a8478');
  drawText(ctx, text, x, y - 16 * s + 5, col || '#241d28', { align: 'center', font: 'small' });
}

// ==========================================================================
//  ONE - ARRIVALS. THE DOOR, THE BRIDGE, THE QUEUE, THE BELT.
// ==========================================================================
// This is the corridor everybody walks and nobody remembers. It is eight
// hundred metres of carpet and one man asking why you came.

const NRT_A_W = 2520;
const NRT_A_Y = 430;                 // the only floor there is
const NRT_A_BRIDGE0 = 220, NRT_A_BRIDGE1 = 690;
const NRT_A_WALL0 = 690, NRT_A_WALL1 = 880;
const NRT_A_IMMIG = 1620;            // where the booths are
const NRT_A_GATE = 1830;             // the barrier that opens when you are stamped
const NRT_A_BELT = 2040;             // the middle of the carousel
const NRT_A_CUSTOMS = 2360;
const NRT_A_EXIT = 2470;

// The aeroplane you just got off, seen as one slice: the door, the galley
// behind it, two seats, and a strip of cabin light.
function nrtCabinSlice(ctx, t) {
  rect(ctx, -80, 150, 300, 300, '#1c2130');
  rect(ctx, -80, 150, 300, 6, '#39405a');
  // the galley: trolleys stowed, one coffee pot, one very tired light
  rect(ctx, -60, 250, 110, 180, '#39405a');
  rect(ctx, -60, 250, 110, 4, '#5a6480');
  for (let i = 0; i < 3; i++) rect(ctx, -54 + i * 36, 266, 30, 150, '#2a3040');
  for (let i = 0; i < 3; i++) rect(ctx, -54 + i * 36, 266, 30, 3, '#4a5468');
  rect(ctx, -30, 232, 50, 16, '#4a5468');
  ctx.globalAlpha = 0.25; rect(ctx, -60, 234, 110, 10, '#ffe9b0'); ctx.globalAlpha = 1;
  // the door itself: a rounded hole in the side of a tube, with DF on it
  const dx = 70, dw = 96, dt = 196, dh = 234;
  rect(ctx, dx - 6, dt - 6, dw + 12, dh + 12, '#2a3040');
  rect(ctx, dx, dt, dw, dh, '#0d1018');
  vgrad(ctx, dx + 2, dt + 2, dw - 4, dh - 4, '#1a2030', '#2a3444');
  rect(ctx, dx, dt, dw, 4, '#5a6480');
  rect(ctx, dx + dw - 5, dt, 5, dh, '#39405a');
  // the DF mark on the door lining, half lit
  const m = dfMark(34);
  ctx.globalAlpha = 0.8; ctx.drawImage(m, Math.round(dx + dw / 2 - 17), 250); ctx.globalAlpha = 1;
  dfWordmark(ctx, dx + 6, 300, 2, { col: withAlpha(DF.cream, 0.7) });
  drawText(ctx, 'THANK YOU', dx + dw / 2, 322, withAlpha(DF.gold, 0.8), { align: 'center', font: 'small' });
  // the sill you step over, which is the last bit of aeroplane you touch
  rect(ctx, dx, NRT_A_Y - 6, dw, 8, '#8a8f98');
  rect(ctx, dx, NRT_A_Y - 6, dw, 2, '#cfd6de');
  ctx.globalAlpha = 0.16; ellipsePx(ctx, dx + dw / 2, NRT_A_Y - 2, dw * 0.6, 12, '#ffe9b0'); ctx.globalAlpha = 1;
}
// The jet bridge. A concertina of ribs with a strip light down the middle and
// carpet that has had four million feet on it.
function nrtBridge(ctx, S, t, x0, x1) {
  const a = Math.max(x0, NRT_A_BRIDGE0), b = Math.min(x1, NRT_A_BRIDGE1);
  if (b <= a) return;
  rect(ctx, a, 130, b - a, 320, '#4a5160');
  vgrad(ctx, a, 130, b - a, 120, '#5b6272', '#3e4554');
  rect(ctx, a, 130, b - a, 5, '#6f7788');
  // the ribs, every metre, stepping down into the ceiling
  for (let x = Math.floor(a / 44) * 44; x < b; x += 44) {
    rect(ctx, x, 132, 7, 300, '#39405a');
    rect(ctx, x, 132, 2, 300, '#6a7284');
    rect(ctx, x - 4, 140, 15, 8, '#2f3644');
  }
  // the light down the spine of it
  ctx.globalAlpha = 0.85; rect(ctx, a, 152, b - a, 7, '#ffeec4'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.12; rect(ctx, a, 159, b - a, 60, '#ffe9a8'); ctx.globalAlpha = 1;
  // the handrail, the skirting, and the carpet
  rect(ctx, a, 330, b - a, 5, '#6a7284');
  rect(ctx, a, 335, b - a, 6, '#2f3644');
  sideFloor(ctx, a, b, NRT_A_Y, { h: 120, col: '#4a4038', col2: '#413930', tile: 62, lip: '#6b5e50', shine: false });
  // the join plates, which are the bit that always clanks
  for (let x = Math.floor(a / 176) * 176; x < b; x += 176) {
    rect(ctx, x, NRT_A_Y - 2, 12, 6, '#8a8f98');
    rect(ctx, x, NRT_A_Y - 2, 12, 2, '#cfd6de');
  }
  // the ramp warning, stencilled on the floor, worn through in the middle
  ctx.globalAlpha = 0.5;
  drawText(ctx, 'MIND THE SLOPE', (a + b) / 2, NRT_A_Y + 16, '#c8b070', { align: 'center', font: 'small' });
  ctx.globalAlpha = 1;
}
// The one window in the bridge, and the aeroplane you came on sitting under a
// grey sky being emptied by people in hi-vis.
function nrtBridgeWindow(ctx, x, y, w, h, t) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  nrtOutside(ctx, x, x + w, y, y + h, t, 41);
  // your own aeroplane's tail, close, filling most of the glass
  dfTail(ctx, x + w * 0.24, y + h - 14, w * 0.6, h * 0.66);
  // the ground crew, tiny, doing the only real work in the building
  for (let i = 0; i < 3; i++) {
    const gx = x + 16 + i * 26 + Math.sin(t * 0.7 + i * 2) * 5;
    rect(ctx, gx, y + h - 24, 6, 12, '#f2a03a');
    rect(ctx, gx, y + h - 24, 6, 3, '#ffd24a');
    rect(ctx, gx + 1, y + h - 28, 4, 4, '#3a3f4a');
  }
  // the belt loader, chewing bags out of the hold
  rect(ctx, x + w * 0.05, y + h - 26, 34, 12, '#e8b040');
  rect(ctx, x + w * 0.05, y + h - 26, 34, 3, '#ffd870');
  const bo = (t * 18) % 14;
  for (let i = 0; i < 3; i++) rect(ctx, x + w * 0.05 + 3 + ((i * 14 + bo) % 30), y + h - 30, 8, 5, ['#2f4a8a', '#8a2a1c', '#2f6a4a'][i]);
  ctx.restore();
}
// WELCOME TO JAPAN. A wall the width of the corridor, a mountain on it, and
// six words in a language you are about to find out you do not have.
function nrtWelcomeWall(ctx, t) {
  const a = NRT_A_WALL0, b = NRT_A_WALL1;
  rect(ctx, a, 120, b - a, 330, '#2b3140');
  rect(ctx, a, 120, b - a, 6, '#4c556a');
  // the mural: a mountain, flattened into six bands because that is all the
  // resolution a wall gets at this distance
  const mx = a + 24, mw = b - a - 48, my = 180, mh = 130;
  rect(ctx, mx, my, mw, mh, '#c8d8e8');
  vgrad(ctx, mx, my, mw, mh * 0.7, '#e2ecf4', '#b8cede');
  ctx.fillStyle = '#5a6f9a'; ctx.beginPath();
  ctx.moveTo(mx + 8, my + mh - 6); ctx.lineTo(mx + mw * 0.47, my + 22); ctx.lineTo(mx + mw - 8, my + mh - 6); ctx.fill();
  ctx.fillStyle = '#f0f4fa'; ctx.beginPath();
  ctx.moveTo(mx + mw * 0.47 - 26, my + 48); ctx.lineTo(mx + mw * 0.47, my + 22); ctx.lineTo(mx + mw * 0.47 + 26, my + 48);
  ctx.lineTo(mx + mw * 0.47 + 12, my + 42); ctx.lineTo(mx + mw * 0.47, my + 50); ctx.lineTo(mx + mw * 0.47 - 14, my + 40); ctx.fill();
  rect(ctx, mx, my + mh - 6, mw, 6, '#3f5a78');
  frame(ctx, mx, my, mw, mh, '#1a1f2a');
  // the words, and the ones under them nobody in your party can read
  drawText(ctx, 'WELCOME TO JAPAN', (a + b) / 2, my + mh + 14, NRT_PAL.cream, { align: 'center', scale: 3, outline: '#12101c' });
  nrtKanaBoard(ctx, (a + b) / 2 - 70, my + mh + 40, 140, 20, NRT_PAL.gold, t, 17);
  // a strip light washing the whole wall, which is why it is the brightest
  // thing in the corridor
  ctx.globalAlpha = 0.5; rect(ctx, a + 10, 150, b - a - 20, 5, '#ffeec4'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.1; rect(ctx, a + 10, 155, b - a - 20, 90, '#ffe9a8'); ctx.globalAlpha = 1;
}
// The immigration hall: a low ceiling, a wall of booths, and a rope maze that
// takes forty minutes to walk thirty metres.
function nrtImmigHall(ctx, S, t, x0, x1) {
  const a = Math.max(x0, 1300), b = Math.min(x1, NRT_A_GATE + 90);
  if (b <= a) return;
  rect(ctx, a, 110, b - a, 340, '#343b4a');
  rect(ctx, a, 110, b - a, 5, '#525b70');
  // the ceiling grid, which in a place like this is the only pattern there is
  for (let x = Math.floor(a / 56) * 56; x < b; x += 56) {
    rect(ctx, x, 114, 2, 70, '#2a3040');
    if ((x / 56) % 2 === 0) { ctx.globalAlpha = 0.8; rect(ctx, x + 10, 128, 34, 5, '#ffeec4'); ctx.globalAlpha = 1; ctx.globalAlpha = 0.09; ellipsePx(ctx, x + 27, 200, 50, 84, '#ffe9a8'); ctx.globalAlpha = 1; }
  }
  // the booth wall
  const bw0 = NRT_A_IMMIG - 130;
  if (b > bw0) {
    rect(ctx, bw0, 190, Math.min(b, NRT_A_GATE) - bw0, 260, '#48505f');
    rect(ctx, bw0, 190, Math.min(b, NRT_A_GATE) - bw0, 4, '#69728a');
    for (let i = 0; i < 3; i++) nrtBooth(ctx, bw0 + 24 + i * 84, NRT_A_Y, t, i, S);
  }
  // FOREIGN PASSPORTS, in green, over the lane you are in
  nrtGreenSign(ctx, NRT_A_IMMIG - 96, 150, 190, 34, ['FOREIGN PASSPORTS'], 1, t);
  nrtGreenSign(ctx, NRT_A_IMMIG + 120, 150, 150, 34, ['BAGGAGE  EXIT'], 1, t);
  sideFloor(ctx, a, b, NRT_A_Y, { h: 120, col: '#6d6a63', col2: '#5f5c56', tile: 52, lip: '#938f86', grout: true });
}
// One booth. A desk, a screen the officer looks at instead of you, a camera
// on a stalk, and a light that is red until it is not.
function nrtBooth(ctx, x, base, t, i, S) {
  const done = S && S.nrtStamped;
  rect(ctx, x, base - 96, 66, 96, '#5a6272');
  rect(ctx, x, base - 96, 66, 4, '#7c8496');
  rect(ctx, x + 4, base - 62, 58, 58, '#3e4554');
  rect(ctx, x + 4, base - 62, 58, 3, '#5a6272');
  // the glass screen, and the slot you push a passport through
  ctx.globalAlpha = 0.22; rect(ctx, x + 4, base - 96, 58, 34, '#bfe0ff'); ctx.globalAlpha = 1;
  rect(ctx, x + 14, base - 64, 38, 4, '#23293a');
  // the officer's own monitor, facing away, glowing on their face
  rect(ctx, x + 40, base - 90, 22, 18, '#12161f');
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(t * 3 + i); rect(ctx, x + 42, base - 88, 18, 14, '#4a86f7'); ctx.globalAlpha = 1;
  // the camera on its stalk, looking at exactly where your face will be
  rect(ctx, x + 8, base - 118, 3, 24, '#3a3f4a');
  rect(ctx, x + 3, base - 126, 14, 10, '#23293a');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 5 + i * 2); circle(ctx, x + 10, base - 121, 2, '#e8503a'); ctx.globalAlpha = 1;
  // the lane light over the booth
  const on = i === 1 ? done : (i === 0);
  rect(ctx, x + 22, base - 140, 22, 14, '#12161f');
  ctx.globalAlpha = 0.8;
  rect(ctx, x + 25, base - 137, 16, 8, on ? '#6be585' : '#c8402c');
  ctx.globalAlpha = 0.14; ellipsePx(ctx, x + 33, base - 120, 22, 20, on ? '#6be585' : '#c8402c'); ctx.globalAlpha = 1;
  // and the officer, who has been here since six
  const sp = cachedBrandStaff({ name: 'NRT-BOOTH-' + i });
  drawBugAt(ctx, sp, x + 33, base - 62, { pose: Math.floor(t * 0.7 + i) % 2 ? 'idle' : 'talk', scale: 1.2, bounce: 0.3, phase: i * 1.3 });
}
// The queue. Everybody in it shuffles forward at the same moment and then
// nothing happens for twenty seconds, which is exactly right.
function nrtDrawQueue(ctx, S, t) {
  const Q = S.nrtQueue;
  if (!Q) return;
  for (let i = 0; i < Q.length; i++) {
    const q = Q[i];
    const shuffle = Math.max(0, Math.sin(t * 0.55 - i * 0.22)) * 9;
    const x = q.x + shuffle;
    if (!S.cam.visible(x, 80)) continue;
    drawShadow(ctx, x, NRT_A_Y + 2, 20 * q.sc, 0.24);
    drawBugAt(ctx, q.spec, x, NRT_A_Y + 2, {
      pose: shuffle > 3 ? (Math.floor(t * 6 + i) % 2 ? 'walk1' : 'walk2') : 'idle',
      scale: q.sc, flip: q.flip, bounce: 0.5, phase: q.o,
    });
    if (q.carry) drawSideCarry(ctx, q.carry, x, NRT_A_Y, q.flip ? -1 : 1, q.sc, t);
  }
}
// The baggage hall: lower ceiling, a screen saying which belt, and the belt.
function nrtBaggageHall(ctx, S, t, x0, x1) {
  const a = Math.max(x0, NRT_A_GATE + 20), b = Math.min(x1, NRT_A_W);
  if (b <= a) return;
  rect(ctx, a, 130, b - a, 320, '#2f3644');
  rect(ctx, a, 130, b - a, 5, '#4a5266');
  for (let x = Math.floor(a / 72) * 72; x < b; x += 72) {
    ctx.globalAlpha = 0.75; rect(ctx, x + 12, 146, 46, 5, '#ffeec4'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.08; ellipsePx(ctx, x + 35, 240, 58, 100, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  // BELT 4 painted enormous on the back wall, because people look up
  drawText(ctx, 'BELT 4', NRT_A_BELT, 200, withAlpha('#7a8494', 0.9), { align: 'center', scale: 6 });
  nrtKanaBoard(ctx, NRT_A_BELT - 60, 246, 120, 18, '#8a94a4', t, 29);
  sideFloor(ctx, a, b, NRT_A_Y, { h: 120, col: '#6d6a63', col2: '#5f5c56', tile: 52, lip: '#938f86', grout: true });
  // the customs arches at the end: one red, one green, and a hard choice
  if (b > NRT_A_CUSTOMS - 80) {
    nrtCustomsArch(ctx, NRT_A_CUSTOMS - 46, '#c8402c', 'RED', 'GOODS TO DECLARE', t);
    nrtCustomsArch(ctx, NRT_A_CUSTOMS + 46, '#2f8f4a', 'GREEN', 'NOTHING TO DECLARE', t);
  }
}
function nrtCustomsArch(ctx, cx, col, word, sub, t) {
  rect(ctx, cx - 40, 250, 80, 200, '#3a4150');
  rect(ctx, cx - 40, 250, 80, 6, col);
  rect(ctx, cx - 34, 262, 68, 188, '#161a22');
  ctx.globalAlpha = 0.2; rect(ctx, cx - 34, 262, 68, 188, col); ctx.globalAlpha = 1;
  rect(ctx, cx - 44, 216, 88, 34, darken(col, 0.4));
  rect(ctx, cx - 42, 218, 84, 30, col);
  rect(ctx, cx - 42, 218, 84, 2, lighten(col, 0.35));
  drawText(ctx, word, cx, 226, NRT_PAL.cream, { align: 'center', scale: 2 });
  drawText(ctx, sub, cx, 240, withAlpha(NRT_PAL.cream, 0.75), { align: 'center', font: 'small' });
  ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 2 + cx); rect(ctx, cx - 44, 250, 88, 12, col); ctx.globalAlpha = 1;
}

// ---------- the arrival scene's props ----------
function nrtArrivalProps() {
  const P = [];
  P.push({ kind: 'window', x: 430, y: 300, w: 150, h: 92, floor: 0, draw: nrtBridgeWindow, frame: '#8a9098' });
  P.push({ kind: 'nrtsign', x: 300, y: 196, w: 150, h: 30, floor: 0, over: true, lines: ['ARRIVALS'], arrow: 1 });
  P.push({ kind: 'nrtsign', x: 980, y: 196, w: 200, h: 30, floor: 0, over: true, lines: ['IMMIGRATION'], arrow: 1 });
  P.push({ kind: 'nrtsign', x: 1290, y: 196, w: 210, h: 30, floor: 0, over: true, lines: ['PASSPORT CONTROL'], arrow: 1 });
  // the two travelators in the long corridor, which save you nothing and feel
  // like they save you everything
  P.push({ kind: 'travelator', x: 1010, w: 240, h: 20, floor: 0, dir: 1 });
  P.push({ kind: 'travelator', x: 1290, w: 220, h: 20, floor: 0, dir: 1 });
  P.push({ kind: 'plant', x: 900, w: 44, h: 52, floor: 0 });
  P.push({ kind: 'plant', x: 1490, w: 44, h: 52, floor: 0 });
  P.push({ kind: 'bin', x: 950, w: 26, h: 40, floor: 0 });
  P.push({ kind: 'fireext', x: 760, y: 396, w: 14, h: 26, floor: 0 });
  P.push({ kind: 'poster', x: 1160, y: 330, w: 60, h: 84, floor: 0, col: '#2f6fc0' });
  P.push({ kind: 'poster', x: 1230, y: 330, w: 60, h: 84, floor: 0, col: '#c8402c' });
  // the queue furniture
  P.push({ kind: 'barrier', x: 1400, w: 200, h: 34, floor: 0 });
  P.push({ kind: 'barrier', x: 1560, w: 160, h: 34, floor: 0 });
  // the fingerprint glass and the camera, which the officer will point at
  P.push({ kind: 'nrtscan', x: NRT_A_IMMIG - 96, w: 34, h: 52, floor: 0, label: 'FINGERPRINTS', act: 'scan' });
  // the gate that opens when you are stamped
  P.push({ kind: 'nrtgate', x: NRT_A_GATE, w: 46, h: 108, floor: 0, solid: true, label: 'GATE', act: 'gate', open: 0 });
  // baggage reclaim
  P.push({ kind: 'nrtflight', x: NRT_A_GATE + 120, y: 250, w: 190, h: 66, floor: 0, over: true });
  P.push({ kind: 'belt', x: NRT_A_BELT, w: 300, h: 54, floor: 0, tag: 'BELT 4' });
  P.push({ kind: 'trolley', x: 1870, w: 46, h: 52, floor: 0 });
  P.push({ kind: 'trolley', x: 2230, w: 46, h: 52, floor: 0 });
  P.push({ kind: 'nrtcase', x: NRT_A_BELT - 110, y: NRT_A_Y - 34, w: 40, h: 30, floor: 0, label: 'THAT IS YOURS', act: 'case' });
  // customs, then the doors
  P.push({ kind: 'nrtcustoms', x: NRT_A_CUSTOMS, w: 60, h: 90, floor: 0, solid: true, label: 'CUSTOMS', act: 'customs' });
  P.push({ kind: 'door', x: NRT_A_EXIT, w: 70, h: 120, floor: 0, label: 'OUT', act: 'out', text: 'EXIT', glow: '#6be585', col: '#2a3a32' });
  return P;
}
function nrtArrivalNpcs() {
  return [
    { name: 'AYA', x: 148, floor: 0, voice: 'hostess', scale: 1.5, pose: 'idle', face: -1,
      tag: ['THANK YOU FOR FLYING DRAGON FLY.', 'MIND THE STEP DOWN.', 'GOOD LUCK WITH WHATEVER IT IS.'] },
    { name: 'CAPTAIN', x: 62, floor: 0, voice: 'captain', scale: 1.5, pose: 'idle', face: 1,
      tag: ['ELEVEN HOURS AND SIX MINUTES.', 'WE MADE UP FOUR OVER THE POLE.', 'NOBODY EVER NOTICES THE FOUR.'] },
    { name: 'GROUND STAFF', x: 720, floor: 0, voice: 'clerk', scale: 1.45, speed: 20, walk: [700, 800],
      tag: ['PASSPORT OUT, PLEASE.', 'FOREIGN PASSPORTS TO THE RIGHT.', 'YES. ALL THE WAY TO THE RIGHT.'] },
    { name: 'OFFICER MORI', x: NRT_A_IMMIG + 6, floor: 0, voice: 'guard', scale: 1.5, act: 'immig', face: -1, pose: 'idle' },
    { name: 'CUSTOMS', x: NRT_A_CUSTOMS - 70, floor: 0, voice: 'guard', scale: 1.45, face: 1,
      tag: ['RED IF YOU HAVE SOMETHING.', 'GREEN IF YOU DO NOT.', 'MOST PEOPLE ARE WRONG ABOUT WHICH.'] },
    { name: 'A MAN WAITING', x: NRT_A_BELT + 210, floor: 0, voice: 'oldman', scale: 1.45,
      tag: ['MINE COMES OFF LAST. ALWAYS LAST.', 'I PAID FOR PRIORITY IN 2009.', 'IT HAS NEVER ONCE WORKED.'] },
  ];
}

// ---------- the arrival scene ----------
function nrtArrivalDef() {
  return {
    name: 'NARITA - ARRIVALS', sub: 'FOLLOW THE GREEN SIGNS', tint: '#1f5f4a',
    w: NRT_A_W, zoom: 1, yBias: 0.70, hud: false, canLeave: false, freeFloors: false,
    heroScale: 1.6, speed: 124,
    start: { x: 96, floor: 0 },
    floors: [{ y: NRT_A_Y, z: 1 }],
    props: nrtArrivalProps(),
    npcs: nrtArrivalNpcs(),
    enterLine: 'FOUR TEN IN THE AFTERNOON. IT IS RAINING.',
    sky: function (ctx) { rect(ctx, 0, 0, W, H, '#0d1018'); },

    init: function (S) {
      S.nrtStamped = false; S.nrtCleared = false; S.nrtGotCase = false; S.nrtStage = 0;
      S.nrtCaseDir = 1; S.nrtScanned = false; S.nrtLooked = false;
      S.nrtTannoy = 8; S.nrtObj = 'GET OFF THE AEROPLANE.';
      // the queue, built once, so it is the same queue every time you look
      const r = makeRng(40841);
      S.nrtQueue = [];
      for (let i = 0; i < 16; i++) {
        S.nrtQueue.push({
          spec: randomBugSpec(makeRng(40900 + i * 7)),
          x: 1330 + i * 19 + (i % 2) * 6,
          sc: r.range(1.05, 1.4), o: r.range(0, 6.28), flip: false,
          carry: r.chance(0.55) ? r.pick(['bag', 'case', 'suitcase', 'coffee']) : null,
        });
      }
      if (typeof setChapter === 'function') setChapter('narita');
    },

    tick: function (S, dt) {
      // what the corridor wants from you next, said in the corner
      if (S.nrtStage === 0 && S.body.x > 240) { S.nrtStage = 1; S.nrtObj = 'DOWN THE BRIDGE. KEEP RIGHT.'; }
      if (S.nrtStage === 1 && S.body.x > 900) { S.nrtStage = 2; S.nrtObj = 'PASSPORT CONTROL.'; }
      if (S.nrtStage === 2 && S.nrtStamped) { S.nrtStage = 3; }
      // the travelators, which move you whether you asked or not
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'travelator') continue;
        if (Math.abs(S.body.x - p.x) < p.w / 2 && Math.abs(S.body.fk - p.floor) < 0.3) S.body.x += 44 * dt * (p.dir || 1);
      }
      // your case, going round and round the way it has been for four minutes
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'nrtcase' || p.hidden) continue;
        p.x += 62 * dt * S.nrtCaseDir;
        if (p.x > NRT_A_BELT + 120) { p.x = NRT_A_BELT + 120; S.nrtCaseDir = -1; }
        if (p.x < NRT_A_BELT - 120) { p.x = NRT_A_BELT - 120; S.nrtCaseDir = 1; }
      }
      // the gate, easing open once the passport is stamped
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'nrtgate') continue;
        p.open = clamp(p.open + (S.nrtStamped ? dt * 1.6 : -dt * 2), 0, 1);
        p.solid = p.open < 0.6;
      }
      // an announcement nobody listens to, every half minute or so
      S.nrtTannoy -= dt;
      if (S.nrtTannoy <= 0 && !S.dlg) {
        S.nrtTannoy = 34;
        Voice.chime('station');
        const lines = [
          'PASSENGERS FROM DF0808: BELT 4.',
          'PLEASE DO NOT LEAVE BAGS UNATTENDED.',
          'A LOST CHILD IS AT THE INFORMATION DESK.',
          'THE MOVING WALKWAY IS ENDING. PLEASE LOOK DOWN.',
        ];
        S.flash(lines[Math.floor(S.t / 34) % lines.length], 4);
      }
    },

    // ---- the corridor, drawn in slices, so only what is on screen is painted
    mid: function (ctx, S, t) {
      const x0 = S.cam.wx(-160), x1 = S.cam.wx(W + 160);
      // the generic walls and floor everywhere the set pieces are not
      rect(ctx, x0, 100, x1 - x0, 360, '#333a48');
      sideFloor(ctx, x0, x1, NRT_A_Y, { h: 130, col: NRT_PAL.floor, col2: NRT_PAL.floorLo, tile: 52, lip: NRT_PAL.floorHi, grout: true });
      if (x0 < 240) nrtCabinSlice(ctx, t);
      nrtBridge(ctx, S, t, x0, x1);
      if (x1 > NRT_A_WALL0 && x0 < NRT_A_WALL1) nrtWelcomeWall(ctx, t);
      // the long corridor between the wall and immigration
      if (x1 > NRT_A_WALL1 && x0 < 1340) {
        const a = Math.max(x0, NRT_A_WALL1), b = Math.min(x1, 1340);
        rect(ctx, a, 120, b - a, 330, '#3a4150');
        rect(ctx, a, 120, b - a, 5, '#59627a');
        for (let x = Math.floor(a / 64) * 64; x < b; x += 64) {
          rect(ctx, x, 124, 2, 210, '#2b3140');
          ctx.globalAlpha = 0.8; rect(ctx, x + 14, 138, 38, 5, '#ffeec4'); ctx.globalAlpha = 1;
          ctx.globalAlpha = 0.07; ellipsePx(ctx, x + 33, 230, 52, 96, '#ffe9a8'); ctx.globalAlpha = 1;
        }
        // the dado rail and the hand-smeared glass above it
        rect(ctx, a, 334, b - a, 6, '#2b3140');
        glassWall(ctx, a, 200, b - a, 134, t, { tint: '#2a3a4e', top: '#7aa8cc', bot: '#1b2a3e', mullion: 78, rail: 134 });
        rect(ctx, a, 334, b - a, 6, '#4a5266');
      }
      nrtImmigHall(ctx, S, t, x0, x1);
      nrtDrawQueue(ctx, S, t);
      nrtBaggageHall(ctx, S, t, x0, x1);
    },

    fore: function (ctx, S, t) {
      // the near edge of the ceiling, cropping the top of frame, which is what
      // makes a corridor feel like a corridor instead of a stage
      const x0 = S.cam.wx(-160), x1 = S.cam.wx(W + 160);
      ctx.globalAlpha = 0.9; rect(ctx, x0, 96, x1 - x0, 10, '#191d26'); ctx.globalAlpha = 1;
    },

    after: function (ctx, S, t) {
      grade(ctx, 0, 0, W, H, '#7a8ea8', 0.05);
      vignette(ctx, 0.4, '#070910');
      if (S.t < 3.2) letterbox(ctx, Math.round(50 * clamp((3.2 - S.t) / 1.2, 0, 1)));
    },

    overlay: function (ctx, S, t) {
      nrtObjectiveStrip(ctx, S.nrtObj, t);
    },

    // ---- the props the shared library has never heard of
    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'nrtsign': nrtGreenSign(ctx, p.x, p.y, p.w, p.h, p.lines, p.arrow, t); return true;
        case 'nrtscan': {
          // a slab of glass on a post with two hand shapes printed on it
          rect(ctx, p.x - 8, base - 46, 16, 46, '#3a4150');
          rect(ctx, p.x - 22, base - 66, 44, 24, '#23293a');
          rect(ctx, p.x - 19, base - 63, 38, 18, '#0d1018');
          const lit = S.nrtScanned ? '#6be585' : '#4a86f7';
          ctx.globalAlpha = 0.6 + 0.35 * Math.sin(t * 3.4);
          rect(ctx, p.x - 17, base - 61, 34, 14, lit);
          ctx.globalAlpha = 1;
          // two little hands, the universal symbol for put these here
          for (const d of [-1, 1]) {
            rect(ctx, p.x + d * 8 - 3, base - 58, 6, 8, withAlpha('#0d1018', 0.7));
            rect(ctx, p.x + d * 8 - 4, base - 60, 8, 3, withAlpha('#0d1018', 0.7));
          }
          ctx.globalAlpha = 0.14; ellipsePx(ctx, p.x, base - 54, 26, 20, lit); ctx.globalAlpha = 1;
          return true;
        }
        case 'nrtgate': {
          // a pair of glass flaps that stay shut until a stamp says otherwise
          const o = clamp(p.open, 0, 1), half = Math.round(20 * (1 - o));
          rect(ctx, p.x - 26, base - 104, 10, 104, '#5a6272');
          rect(ctx, p.x + 16, base - 104, 10, 104, '#5a6272');
          rect(ctx, p.x - 26, base - 104, 10, 3, '#7c8496');
          rect(ctx, p.x + 16, base - 104, 10, 3, '#7c8496');
          ctx.globalAlpha = 0.45;
          rect(ctx, p.x - 16, base - 86, half, 82, '#bfe0ff');
          rect(ctx, p.x + 16 - half, base - 86, half, 82, '#bfe0ff');
          ctx.globalAlpha = 1;
          rect(ctx, p.x - 16, base - 86, half, 2, '#ffffff');
          rect(ctx, p.x + 16 - half, base - 86, half, 2, '#ffffff');
          // the arrow on the floor, green when it means it
          ctx.globalAlpha = o > 0.5 ? 0.9 : 0.25;
          ctx.fillStyle = o > 0.5 ? '#6be585' : '#5a6272';
          ctx.beginPath(); ctx.moveTo(p.x + 14, base + 8); ctx.lineTo(p.x - 2, base + 1); ctx.lineTo(p.x - 2, base + 15); ctx.fill();
          ctx.globalAlpha = 1;
          return true;
        }
        case 'nrtflight': {
          // the board that tells you which belt, in three languages, one of
          // which is a colour
          rect(ctx, p.x - p.w / 2, p.y - p.h, p.w, p.h, '#12161f');
          frame(ctx, p.x - p.w / 2, p.y - p.h, p.w, p.h, '#3a4150');
          rect(ctx, p.x - p.w / 2 + 3, p.y - p.h + 3, p.w - 6, 16, '#1c2334');
          drawText(ctx, 'FLIGHT      FROM        BELT', p.x - p.w / 2 + 7, p.y - p.h + 7, '#7a8494', { font: 'small' });
          const rows = [['DF0808', 'LAS VEGAS', '4'], ['NH  118', 'LOS ANGELES', '3'], ['JL  002', 'NEW YORK', '5'], ['CX  520', 'HONG KONG', '2']];
          for (let i = 0; i < rows.length; i++) {
            const ry = p.y - p.h + 22 + i * 11;
            const on = i === 0;
            drawText(ctx, rows[i][0], p.x - p.w / 2 + 7, ry, on ? '#ffd24a' : '#8fa0b0', { font: 'small' });
            drawText(ctx, rows[i][1], p.x - p.w / 2 + 48, ry, on ? '#f4f1ea' : '#6f7d8c', { font: 'small' });
            ctx.globalAlpha = on ? 0.7 + 0.3 * Math.sin(t * 4) : 1;
            drawText(ctx, rows[i][2], p.x + p.w / 2 - 12, ry, on ? '#6be585' : '#6f7d8c', { align: 'right', font: 'small' });
            ctx.globalAlpha = 1;
          }
          ctx.globalAlpha = 0.07; for (let i = 0; i < p.h; i += 3) rect(ctx, p.x - p.w / 2, p.y - p.h + i, p.w, 1, '#000'); ctx.globalAlpha = 1;
          return true;
        }
        case 'nrtcase': {
          // the one bag in the world that is yours, with a Vegas tag still on
          const y = p.y;
          ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, y + 16, 22, 5, '#000'); ctx.globalAlpha = 1;
          rect(ctx, p.x - 18, y - 14, 36, 30, '#2f4a8a');
          rect(ctx, p.x - 18, y - 14, 36, 3, '#5a80c8');
          rect(ctx, p.x - 18, y - 1, 36, 2, '#1f3568');
          rect(ctx, p.x - 6, y - 18, 12, 4, '#8a8f98');
          // the stickers: one from LAS, one that says FRAGILE and was ignored
          rect(ctx, p.x - 14, y + 2, 12, 9, '#f4f1ea');
          drawText(ctx, 'LAS', p.x - 13, y + 4, '#241d28', { font: 'small' });
          rect(ctx, p.x + 2, y + 2, 13, 9, '#e8503a');
          // a little glow so you can pick it out of a moving belt
          ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 4); ellipsePx(ctx, p.x, y, 30, 24, '#ffd24a'); ctx.globalAlpha = 1;
          return true;
        }
        case 'nrtcustoms': {
          // the officer's table between the two channels
          rect(ctx, p.x - 30, base - 44, 60, 44, '#8a8478');
          rect(ctx, p.x - 30, base - 44, 60, 4, '#b2ab9c');
          rect(ctx, p.x - 26, base - 40, 52, 4, '#6a6458');
          rect(ctx, p.x - 12, base - 56, 24, 12, '#23293a');
          ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2.6); rect(ctx, p.x - 10, base - 54, 20, 8, '#4a86f7'); ctx.globalAlpha = 1;
          return true;
        }
      }
      return false;
    },

    // ---- pressing the button
    use: function (S, e) {
      switch (e.act) {
        case 'scan': {
          if (S.nrtScanned) { S.flash('BOTH INDEX FINGERS. ALREADY DONE.'); return; }
          if (!S.nrtLooked) { S.flash('THE OFFICER HAS NOT ASKED YOU YET.'); Audio.ui('error'); return; }
          S.nrtScanned = true; Audio.ui('type');
          S.fx.burst(e.x, NRT_A_Y - 56, 10, { color: ['#6be585', '#8ad8ff'], speed: 40, life: 0.5, gravity: -10, size: 2 });
          S.say('SCANNER', 'BOTH HANDS. HOLD. HOLD. THANK YOU.', 'robot');
          return;
        }
        case 'immig': {
          if (S.nrtStamped) { S.say('OFFICER MORI', 'YOU ARE THROUGH. BAGGAGE IS BEHIND ME.', 'guard'); return; }
          nrtImmigrationTalk(S);
          return;
        }
        case 'gate': {
          if (S.nrtStamped) { S.flash('THROUGH YOU GO.'); return; }
          S.flash('NOT UNTIL YOU ARE STAMPED.'); Audio.ui('error');
          return;
        }
        case 'case': {
          if (S.nrtGotCase) return;
          S.nrtGotCase = true; e.hidden = true; e.label = null; e.act = null;
          S.body.carry = 'suitcase';
          Audio.ui('coin'); Game.shake.hit(3, 0.2);
          S.fx.burst(e.x, NRT_A_Y - 30, 14, { color: ['#ffd24a', '#f4f1ea'], speed: 90, life: 0.6, size: 2 });
          S.nrtObj = 'RED OR GREEN. PICK ONE.';
          S.run([
            { who: 'YOU', voice: 'you', at: 'you', text: 'THERE IT IS. HEAVIER THAN IT WAS.' },
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'EVERYTHING I OWN, ON A WHEEL.' },
          ]);
          return;
        }
        case 'customs': {
          if (S.nrtCleared) { S.flash('ALREADY WAVED THROUGH.'); return; }
          if (!S.nrtGotCase) { S.flash('YOU HAVE NOT GOT YOUR BAG YET.'); Audio.ui('error'); return; }
          nrtCustomsTalk(S, e);
          return;
        }
        case 'out': {
          if (!S.nrtCleared) { S.flash('CUSTOMS FIRST.'); Audio.ui('error'); return; }
          Voice.chime('station');
          S.leave(function () { return new NaritaTerminalScene(); }, 'iris', { dur: 1.1 });
          return;
        }
      }
    },
  };
}
// The two questions, and the third one they always ask anyway.
function nrtImmigrationTalk(S) {
  let stay = 'TWO WEEKS', why = 'PLEASURE';
  S.locked = 24;
  S.run([
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'PASSPORT. THANK YOU.' },
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'LOOK AT THE CAMERA PLEASE.',
      do: function () { S.nrtLooked = true; Audio.ui('type'); } },
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'BUSINESS OR PLEASURE?',
      choices: [
        { label: 'BUSINESS', note: 'TRUE, SORT OF', next: 'q2', go: function () { why = 'BUSINESS'; } },
        { label: 'PLEASURE', note: 'EASIER', next: 'q2', go: function () { why = 'PLEASURE'; } },
        { label: 'I AM A MUSICIAN', note: 'HONEST', next: 'muso', go: function () { why = 'MUSIC'; } },
      ] },
    { id: 'muso', who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'PAID WORK NEEDS A DIFFERENT VISA.' },
    { who: 'YOU', voice: 'you', at: 'you', text: 'NOBODY HAS PAID ME YET.' },
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'THEN IT IS PLEASURE.', next: 'q2' },
    { id: 'q2', who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'HOW LONG WILL YOU STAY?',
      choices: [
        { label: 'TWO WEEKS', next: 'q3', go: function () { stay = 'TWO WEEKS'; } },
        { label: 'NINETY DAYS', next: 'q3', go: function () { stay = 'NINETY DAYS'; } },
        { label: 'I HAVE NOT DECIDED', note: 'WRONG ANSWER', next: 'undecided', go: function () { stay = 'UNDECIDED'; } },
      ] },
    { id: 'undecided', who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'THE FORM HAS NO BOX FOR THAT.' },
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'I WILL PUT NINETY DAYS.', next: 'q3', do: function () { stay = 'NINETY DAYS'; } },
    { id: 'q3', who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'AND WHERE ARE YOU STAYING?',
      choices: [
        { label: 'A CAPSULE HOTEL', note: 'BOOKED', next: 'prints' },
        { label: 'NOT SURE YET', note: 'RISKY', next: 'nowhere' },
      ] },
    { id: 'nowhere', who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'PUT THE CAPSULE ONE. THEY ALL SAY THAT ONE.', next: 'prints' },
    { id: 'prints', who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'FINGERS ON THE GLASS, BOTH HANDS.',
      do: function () { S.nrtLooked = true; } },
    { who: '', voice: false, think: true, at: 'you', text: 'THE GLASS IS WARM. EVERYBODY TOUCHES IT.' },
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'THANK YOU.',
      do: function () {
        S.nrtScanned = true; S.nrtStamped = true;
        Audio.ui('stamp'); Game.shake.hit(4, 0.24);
        S.fx.burst(S.body.x, NRT_A_Y - 40, 12, { color: ['#c8402c', '#ffd24a'], speed: 70, life: 0.6, size: 2 });
        S.nrtObj = 'BELT 4. WAIT FOR YOUR BAG.';
        S.flash('STAMPED. NINETY DAYS.', 3.6);
      } },
    { who: 'OFFICER MORI', voice: 'guard', at: 'OFFICER MORI', text: 'WELCOME TO JAPAN. BAGGAGE IS BEHIND ME.' },
  ], function () { S.locked = 0; });
}
function nrtCustomsTalk(S, e) {
  S.locked = 20;
  S.run([
    { who: 'CUSTOMS', voice: 'guard', at: 'CUSTOMS', text: 'ANYTHING TO DECLARE?',
      choices: [
        { label: 'RED CHANNEL', note: 'DECLARE SOMETHING', next: 'red' },
        { label: 'GREEN CHANNEL', note: 'NOTHING AT ALL', next: 'green' },
      ] },
    { id: 'red', who: 'YOU', voice: 'you', at: 'you', text: 'A GUITAR. IT IS NOT FOR SELLING.' },
    { who: 'CUSTOMS', voice: 'guard', at: 'CUSTOMS', text: 'OPEN IT.' },
    { who: '', voice: false, think: true, at: 'you', text: 'HE LOOKS AT IT LONGER THAN ANYBODY HAS IN FOUR YEARS.' },
    { who: 'CUSTOMS', voice: 'guard', at: 'CUSTOMS', text: 'IT NEEDS NEW STRINGS.' },
    { who: 'CUSTOMS', voice: 'guard', at: 'CUSTOMS', text: 'GO ON. GREEN IS FASTER NEXT TIME.', next: 'done' },
    { id: 'green', who: 'CUSTOMS', voice: 'guard', at: 'CUSTOMS', text: 'BAG ON THE TABLE ANYWAY.' },
    { who: '', voice: false, think: true, at: 'you', text: 'THE GREEN CHANNEL IS ALSO A CHANNEL.' },
    { who: 'CUSTOMS', voice: 'guard', at: 'CUSTOMS', text: 'FINE. ENJOY YOUR STAY.', next: 'done' },
    { id: 'done', who: '', voice: false, at: 'you', think: true, text: 'THE DOORS AT THE END ARE FROSTED.' },
  ], function () {
    S.locked = 0; S.nrtCleared = true;
    e.solid = false; e.label = 'CLEARED';
    S.nrtObj = 'OUT THROUGH THE DOORS.';
    Audio.ui('select');
    S.flash('CLEARED. THE DOORS ARE THE LAST BIT.', 3.5);
  });
}
// The objective line every one of these scenes draws in the same corner.
function nrtObjectiveStrip(ctx, text, t) {
  if (!text) return;
  const w = Math.min(W - 24, textWidth(text, { scale: 2 }) + 46);
  ctx.globalAlpha = 0.86;
  rect(ctx, 10, 10, w, 26, 'rgba(8,14,12,0.88)');
  ctx.globalAlpha = 1;
  frame(ctx, 10, 10, w, 26, NRT_PAL.greenHi);
  rect(ctx, 10, 10, 4, 26, NRT_PAL.greenHi);
  ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3);
  ctx.fillStyle = NRT_PAL.greenHi;
  ctx.beginPath(); ctx.moveTo(30, 23); ctx.lineTo(21, 16); ctx.lineTo(21, 30); ctx.fill();
  ctx.globalAlpha = 1;
  drawText(ctx, text, 38, 16, '#dff5e6', { scale: 2 });
}

class NaritaArrivalScene extends SideScene {
  constructor(opts) { super(nrtArrivalDef(), opts || {}); }
}

// ==========================================================================
//  TWO - THE TERMINAL. THE SHOWPIECE.
// ==========================================================================
// Six thousand pixels of glass and shopfront on two levels, with sixty-odd
// people in it who all know where they are going. The only thing you have to
// do is get to the east end and out. The only thing stopping you is that it
// is enormous and everything in it is for sale.

const NRT_T_W = 7600;
const NRT_T_UP = 250;              // the upper concourse (the FAR floor)
const NRT_T_DOWN = 452;            // the arrivals floor (the NEAR floor)
const NRT_T_EXIT = 7400;
const NRT_T_PLAN = 560;
const NRT_T_LIFTX = 4590;          // the glass lift runs through both levels here

// Three runs of shopfronts on each level, with the same four holes cut
// through both of them. A terminal is a building with holes in it for stairs
// and everything else is shelving.
//
//   holes:  780-1140    2560-2940    4400-4780    6300-6680
//
const NRT_BANDS = [
  { x0: 1140, x1: 2560, floor: 1 },
  { x0: 2940, x1: 4400, floor: 1 },
  { x0: 4780, x1: 6300, floor: 1 },
  { x0: 1140, x1: 2560, floor: 0 },
  { x0: 2940, x1: 4400, floor: 0 },
  { x0: 4780, x1: 6300, floor: 0 },
];
// Which of the data file's zones live on which level here. The catalogue
// lays the whole airport out as one 7300px strip; this game splits it into
// three scenes, so the zone ids are borrowed and the geometry is not.
const NRT_ZONES_F1 = ['arrivals', 'concourse', 'market'];
const NRT_ZONES_F0 = ['mezzanine', 'foodcourt', 'departures'];
const NRT_BAND_NAMES = {
  arrivals: 'ARRIVALS HALL', concourse: 'CENTRAL CONCOURSE', market: 'MARKET ROW',
  mezzanine: 'THE MEZZANINE', foodcourt: 'FOOD COURT', departures: 'DEPARTURES',
};
function nrtZoneName(id) {
  if (typeof airportZoneById === 'function') { const z = airportZoneById(id); if (z && z.name) return z.name; }
  return NRT_BAND_NAMES[id] || 'SHOPS';
}
// Everything the catalogue puts on one level, in zone order.
function nrtFloorShops(floor) {
  const zones = floor === 1 ? NRT_ZONES_F1 : NRT_ZONES_F0;
  const out = [];
  if (typeof shopsForZone === 'function') {
    for (let i = 0; i < zones.length; i++) {
      const z = shopsForZone(zones[i]) || [];
      for (let k = 0; k < z.length; k++) { const c = z[k]; if (c) { c._zone = c.zone || zones[i]; out.push(c); } }
    }
  }
  if (out.length >= 9) return out;
  // no data file yet: take half the fallback list, which is already sorted
  // into ground-floor shops and upstairs shops
  const all = nrtShopList(), off = floor === 1 ? 0 : 15;
  const sub = [];
  for (let i = 0; i < 15; i++) sub.push(all[(off + i) % all.length]);
  return sub;
}
// Hand out `total` shops across bands of the given widths, so the widest run
// gets the most doors and none of them ends up with one lonely shop in it.
function nrtSpread(total, widths) {
  let sum = 0;
  for (let i = 0; i < widths.length; i++) sum += widths[i];
  const out = [];
  let used = 0;
  for (let i = 0; i < widths.length; i++) {
    const n = i === widths.length - 1 ? Math.max(1, total - used) : Math.max(1, Math.round(total * widths[i] / sum));
    out.push(n); used += n;
  }
  return out;
}
// Built once, because two different parts of the scene have to agree about
// exactly where every shopfront is: the painter, and the doorway hotspots.
let _nrtLayout = null;
function nrtLayout() {
  if (_nrtLayout) return _nrtLayout;
  const out = [];
  for (let f = 1; f >= 0; f--) {
    const shops = nrtFloorShops(f);
    const bands = [];
    for (let i = 0; i < NRT_BANDS.length; i++) if (NRT_BANDS[i].floor === f) bands.push(NRT_BANDS[i]);
    const widths = bands.map(function (b) { return b.x1 - b.x0; });
    const share = nrtSpread(shops.length, widths);
    let n = 0;
    for (let b = 0; b < bands.length; b++) {
      const band = bands[b], count = Math.min(share[b], shops.length - n);
      if (count <= 0) continue;
      const pitch = (band.x1 - band.x0) / count;
      band.label = nrtZoneName(shops[n]._zone || (f === 1 ? NRT_ZONES_F1[b] : NRT_ZONES_F0[b]));
      for (let i = 0; i < count; i++) {
        const sh = shops[n++];
        out.push({
          id: (sh && sh.id) || ('shop' + f + b + i),
          brand: nrtBrandOf(sh),
          // a shop is the width it says it is, squeezed to fit its slot
          w: clamp(sh && sh.w ? sh.w : 200, 96, Math.round(pitch - 24)),
          x: Math.round(band.x0 + pitch * i + pitch / 2),
          h: f === 0 ? 110 : 168,
          floor: f,
          enter: !(sh && sh.enter === false),
          blurb: (sh && sh.blurb) || '',
        });
      }
    }
  }
  _nrtLayout = out;
  return out;
}

// ---------- architecture ----------
// The roof. In real life it is a hundred metres of glazing on white steel; at
// this size it is three bands of sky, a lot of diagonals, and dust in the air.
function nrtRoof(ctx, S, t, x0, x1) {
  vgrad(ctx, x0, -40, x1 - x0, 190, '#c6d4e0', '#8fa2b4');
  // the glazing bars, and the grey afternoon coming through them
  for (let x = Math.floor(x0 / 58) * 58; x < x1; x += 58) {
    rect(ctx, x, -40, 3, 190, '#e6ecf2');
    ctx.globalAlpha = 0.18; rect(ctx, x + 3, -40, 24, 190, '#ffffff'); ctx.globalAlpha = 1;
  }
  nrtTruss(ctx, x0, x1, 86, 34, 5);
  nrtTruss(ctx, x0, x1, 126, 14, 9);
  // the service run bolted under the trusses, because nothing is ever tidy
  rect(ctx, x0, 144, x1 - x0, 5, '#9aa2ae');
  for (let x = Math.floor(x0 / 118) * 118; x < x1; x += 118) {
    rect(ctx, x + 30, 148, 42, 7, '#3a4150');
    ctx.globalAlpha = 0.85; rect(ctx, x + 32, 155, 38, 4, '#fff2cc'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.06; ellipsePx(ctx, x + 51, 300, 60, 140, '#ffe9a8'); ctx.globalAlpha = 1;
  }
  // dust, lit by the roof, which is the one thing that says how big this is
  const r = makeRng(9191);
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 60; i++) {
    const dx = x0 + ((r.range(0, x1 - x0) + t * 6) % (x1 - x0));
    const dy = 40 + ((r.range(0, 260) + t * 9) % 260);
    px(ctx, dx, dy, '#ffffff');
  }
  ctx.globalAlpha = 1;
}
// The back of the building: glass from the upper slab down, and outside it
// the apron with everybody else's aeroplanes on it.
function nrtCurtainWall(ctx, S, t, x0, x1) {
  const top = 150, bot = NRT_T_UP - 6;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0, top, x1 - x0, bot - top); ctx.clip();
  nrtOutside(ctx, x0, x1, top - 20, bot + 30, t, 133);
  ctx.restore();
  glassWall(ctx, x0, top, x1 - x0, bot - top, t, { tint: '#3a5470', top: '#a8ccE4', bot: '#42607e', mullion: 66, rail: 54 });
  rect(ctx, x0, bot - 4, x1 - x0, 6, '#8a9098');
}
// The upper concourse: a slab with a lit edge, a glass balustrade, and the
// legs and shoulders of people walking behind it.
function nrtUpperSlab(ctx, S, t, x0, x1) {
  sideFloor(ctx, x0, x1, NRT_T_UP, { h: 30, col: '#7d7a72', col2: '#6c6962', tile: 46, lip: '#a9a49a', grout: true });
  // the fascia under the slab, lit from behind so the edge reads at distance
  rect(ctx, x0, NRT_T_UP + 22, x1 - x0, 14, '#4a5060');
  rect(ctx, x0, NRT_T_UP + 22, x1 - x0, 3, '#6a7282');
  ctx.globalAlpha = 0.55; rect(ctx, x0, NRT_T_UP + 33, x1 - x0, 3, '#ffeec4'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.07; rect(ctx, x0, NRT_T_UP + 36, x1 - x0, 44, '#ffe9a8'); ctx.globalAlpha = 1;
  // the balustrade: glass panels with a steel rail along the top
  ctx.globalAlpha = 0.22; rect(ctx, x0, NRT_T_UP - 34, x1 - x0, 34, '#bfe0ff'); ctx.globalAlpha = 1;
  for (let x = Math.floor(x0 / 92) * 92; x < x1; x += 92) rect(ctx, x, NRT_T_UP - 34, 3, 34, '#8a9098');
  rect(ctx, x0, NRT_T_UP - 37, x1 - x0, 4, '#b9bec6');
  rect(ctx, x0, NRT_T_UP - 37, x1 - x0, 1, '#e2e6ec');
}
// The clock wall: four cities, four times, one of which is where you were
// this morning and is not a time you can feel any more.
function nrtClockWall(ctx, cx, y, t) {
  const cities = [['TOKYO', 16, 11], ['LONDON', 8, 11], ['NEW YORK', 3, 11], ['LAS VEGAS', 0, 11]];
  rect(ctx, cx - 190, y, 380, 96, '#333a48');
  rect(ctx, cx - 190, y, 380, 4, '#4e5668');
  frame(ctx, cx - 190, y, 380, 96, '#1a1f2a');
  for (let i = 0; i < 4; i++) {
    const x = cx - 142 + i * 95;
    circle(ctx, x, y + 40, 28, '#e8e4da');
    ringPx(ctx, x, y + 40, 28, '#2a2f3a');
    ringPx(ctx, x, y + 40, 27, '#b8b2a6');
    for (let k = 0; k < 12; k++) {
      const a = k * Math.PI / 6;
      rect(ctx, x + Math.cos(a) * 22 - 1, y + 40 + Math.sin(a) * 22 - 1, 2, 2, '#4a4f58');
    }
    const hh = cities[i][1], mm = cities[i][2];
    const ha = (hh % 12) / 12 * Math.PI * 2 - Math.PI / 2, ma = mm / 60 * Math.PI * 2 - Math.PI / 2;
    line(ctx, x, y + 40, x + Math.cos(ha) * 13, y + 40 + Math.sin(ha) * 13, '#241d28');
    line(ctx, x, y + 40, x + Math.cos(ma) * 21, y + 40 + Math.sin(ma) * 21, '#241d28');
    const sa = (t * 0.1047) - Math.PI / 2;
    line(ctx, x, y + 40, x + Math.cos(sa) * 23, y + 40 + Math.sin(sa) * 23, '#c8402c');
    circle(ctx, x, y + 40, 2, '#241d28');
    drawText(ctx, cities[i][0], x, y + 74, i === 3 ? '#ffd24a' : '#cfd6de', { align: 'center', font: 'small' });
  }
}
// The departures board, still clacking even though nothing on it is yours.
function nrtDepBoard(ctx, cx, y, t) {
  const w = 300, h = 120;
  rect(ctx, cx - w / 2, y, w, h, '#0d1018');
  frame(ctx, cx - w / 2, y, w, h, '#3a4150');
  rect(ctx, cx - w / 2 + 4, y + 4, w - 8, 16, '#1c2334');
  drawText(ctx, 'DEPARTURES', cx - w / 2 + 9, y + 8, '#f2a03a', { scale: 2 });
  drawText(ctx, pad2(16) + ':' + pad2(11 + Math.floor(t / 60) % 40), cx + w / 2 - 9, y + 9, '#6be585', { align: 'right', font: 'small' });
  const rows = [
    ['NH 852', 'SAPPORO', '17:05', 'GATE 62'],
    ['JL 041', 'SEOUL', '17:20', 'BOARDING'],
    ['DF 0809', 'LAS VEGAS', '18:40', 'CHECK IN'],
    ['CX 501', 'HONG KONG', '19:05', 'ON TIME'],
    ['NH 203', 'FUKUOKA', '19:30', 'DELAYED'],
  ];
  for (let i = 0; i < rows.length; i++) {
    const ry = y + 26 + i * 18;
    // one row flips over every couple of seconds, which is the whole charm
    const flip = (Math.floor(t * 0.7) % rows.length) === i ? Math.abs(Math.sin(t * 9)) : 0;
    ctx.globalAlpha = 1 - flip * 0.7;
    drawText(ctx, rows[i][0], cx - w / 2 + 9, ry, '#e8e2d0', { font: 'small' });
    drawText(ctx, rows[i][1], cx - w / 2 + 62, ry, '#e8e2d0', { font: 'small' });
    drawText(ctx, rows[i][2], cx - w / 2 + 166, ry, '#8fa0b0', { font: 'small' });
    drawText(ctx, rows[i][3], cx + w / 2 - 9, ry, rows[i][3] === 'DELAYED' ? '#e8503a' : '#f2c94c', { align: 'right', font: 'small' });
    ctx.globalAlpha = 1;
    rect(ctx, cx - w / 2 + 6, ry + 8, w - 12, 1, '#1c2230');
  }
}
// The mural: a wave, done the only way this game knows how, which is in flat
// bands of blue with hard white edges.
function nrtMural(ctx, x, y, w, h, t) {
  rect(ctx, x, y, w, h, '#1b3350');
  vgrad(ctx, x, y, w, h, '#2a4f7a', '#12233c');
  for (let b = 0; b < 5; b++) {
    const by = y + h * 0.28 + b * (h * 0.13);
    ctx.fillStyle = ['#2f6fc0', '#3f82d0', '#5a9ae0', '#7ab4ec', '#a8d4f4'][b];
    ctx.beginPath(); ctx.moveTo(x, by + 30);
    for (let i = 0; i <= 10; i++) {
      const px2 = x + (w / 10) * i;
      ctx.lineTo(px2, by + Math.sin(i * 0.9 + b * 0.6) * 12);
    }
    ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.fill();
  }
  // the foam, in hard white pixels, and a very small boat nobody asked for
  const r = makeRng(606);
  for (let i = 0; i < 90; i++) {
    const fx = x + r.range(0, w), fy = y + h * 0.3 + r.range(0, h * 0.55);
    px(ctx, fx, fy, '#eaf4ff');
  }
  rect(ctx, x + w * 0.66, y + h * 0.42, 22, 6, '#f4f1ea');
  rect(ctx, x + w * 0.70, y + h * 0.30, 3, 12, '#8a6a3a');
  frame(ctx, x, y, w, h, '#0d1018');
  drawText(ctx, 'NARITA INTERNATIONAL', x + w / 2, y + h + 6, withAlpha('#9aa2ae', 0.8), { align: 'center', font: 'small' });
}
// A pillar with a banner advert wrapped round it, in the gap between shops.
function nrtBannerPillar(ctx, x, top, bot, seed, t) {
  rect(ctx, x - 16, top, 32, bot - top, '#b9bec6');
  rect(ctx, x - 16, top, 5, bot - top, '#dfe4ea');
  rect(ctx, x + 11, top, 5, bot - top, '#8a8f98');
  rect(ctx, x - 20, top, 40, 8, '#cfd6de');
  rect(ctx, x - 20, bot - 10, 40, 10, '#a0a6ae');
  const ads = [
    { col: '#12203f', col2: '#e0b23c', name: 'DRAGON FLY', tag: 'THE LONG WAY ROUND' },
    { col: '#2f8f4a', col2: '#f4f1ea', name: 'COLONY MART', tag: 'ALWAYS OPEN' },
    { col: '#c8a03a', col2: '#12101c', name: 'NOCTURNE', tag: 'GENEVE 1861' },
    { col: '#b0446a', col2: '#ffd24a', name: 'POLLEN', tag: 'BEAUTY HALL 2F' },
  ];
  const a = ads[seed % ads.length];
  const by = top + 40, bh = 140;
  rect(ctx, x - 22, by, 44, bh, a.col);
  rect(ctx, x - 22, by, 44, 3, lighten(a.col, 0.3));
  rect(ctx, x - 22, by + bh - 3, 44, 3, darken(a.col, 0.3));
  // the name runs down it, one letter a row, like every pillar banner ever
  const nm = a.name.replace(' ', '');
  for (let i = 0; i < Math.min(nm.length, 11); i++) drawText(ctx, nm[i], x, by + 9 + i * 12, a.col2, { align: 'center', scale: 2 });
  ctx.globalAlpha = 0.16 + 0.05 * Math.sin(t * 1.6 + seed); rect(ctx, x - 22, by, 44, bh, '#ffffff'); ctx.globalAlpha = 1;
}
// A planted bed. Nobody has ever sat on the edge of one of these and not felt
// slightly better.
function nrtBed(ctx, x, base, w, t, seed) {
  rect(ctx, x - w / 2, base - 26, w, 26, '#7d6a52');
  rect(ctx, x - w / 2, base - 26, w, 4, '#9c8768');
  rect(ctx, x - w / 2, base - 8, w, 8, '#5f5142');
  const r = makeRng(seed || 1);
  for (let i = 0; i < Math.floor(w / 9); i++) {
    const px2 = x - w / 2 + 6 + i * 9, hgt = r.range(16, 40);
    const sway = Math.sin(t * 0.8 + i) * 2;
    line(ctx, px2, base - 24, px2 + sway, base - 24 - hgt, '#2f7a4a');
    ellipsePx(ctx, px2 + sway, base - 24 - hgt, 5, 3, i % 3 ? '#43a85c' : '#2f8f4a');
  }
  // the soil, and the one plastic bottle somebody left in it
  ctx.globalAlpha = 0.4; rect(ctx, x - w / 2 + 3, base - 24, w - 6, 4, '#3a2f22'); ctx.globalAlpha = 1;
  if (seed % 3 === 0) rect(ctx, x + w * 0.3, base - 30, 5, 8, '#bfe0ff');
}
// Every shopfront on both levels, drawn back to front, before the crowds.
function nrtDrawShops(ctx, S, t, floor) {
  const L = nrtLayout();
  const base = floor === 0 ? NRT_T_UP : NRT_T_DOWN;
  for (let i = 0; i < L.length; i++) {
    const s = L[i];
    if (s.floor !== floor) continue;
    if (!S.cam.visible(s.x, s.w + 160)) continue;
    sideShopFront(ctx, s.x - s.w / 2, base, s.w, s.h, s.brand, t, S);
  }
  // the band names, hung over the middle of each run of shops. Only on the
  // near level: upstairs the trusses already own that strip of air.
  if (floor !== 1) return;
  for (let b = 0; b < NRT_BANDS.length; b++) {
    const band = NRT_BANDS[b];
    if (band.floor !== floor) continue;
    const cx = (band.x0 + band.x1) / 2;
    if (!S.cam.visible(cx, 400)) continue;
    nrtKanaBoard(ctx, cx - 54, base - 214, 108, 14, NRT_PAL.gold, t, b * 13 + 5);
    if (band.label) drawText(ctx, band.label, cx, base - 196, withAlpha(NRT_PAL.cream, 0.55), { align: 'center', scale: 2 });
  }
}

// ---------- the terminal's props ----------
function nrtTerminalProps() {
  const P = [];
  // the doors you arrived through, shut behind you
  P.push({ kind: 'door', x: 120, w: 76, h: 126, floor: 1, col: '#2a3140', glow: '#6a7282', text: 'ARRIVALS' });
  // ---- wayfinding. These are the signs that actually work: all of them
  // point east, and east is where the kerb is.
  const signs = [
    { x: 320, lines: ['EXIT  GATES 1-7'], arrow: 1 },
    { x: 960, lines: ['EXIT  EAST'], arrow: 1 },
    { x: 2750, lines: ['GATES 1-7', 'GROUND LEVEL'], arrow: 1 },
    { x: 4590, lines: ['EXIT  KEEP RIGHT'], arrow: 1 },
    { x: 6480, lines: ['GATE 5  PRIVATE CARS'], arrow: 1 },
    { x: 7180, lines: ['EXIT'], arrow: 1 },
    { x: 1850, lines: ['TRAINS  BUSES'], arrow: -1 },
    { x: 3660, lines: ['TOILETS  LIFT'], arrow: -1 },
  ];
  for (let i = 0; i < signs.length; i++) {
    const multi = signs[i].lines.length > 1;
    P.push({ kind: 'nrtsign', x: signs[i].x, y: 214, w: multi ? 214 : 196, h: multi ? 44 : 32, floor: 1, over: true, lines: signs[i].lines, arrow: signs[i].arrow });
  }
  // the floor plan, with a dot on it that is you
  P.push({ kind: 'nrtplan', x: NRT_T_PLAN, w: 96, h: 92, floor: 1, label: 'READ THE PLAN', act: 'plan' });
  // ---- shop doorways: one hotspot per shopfront, sitting in the doorway.
  // The front itself is painted into mid() so the crowd walks in front of it.
  const L = nrtLayout();
  for (let i = 0; i < L.length; i++) {
    const sh = L[i];
    P.push({
      kind: 'nrtdoor', x: sh.x, w: 58, h: 66, floor: sh.floor, reach: 44,
      label: sh.enter ? ('GO INTO ' + sh.brand.name) : 'LOOK IN THE WINDOW',
      act: sh.enter ? 'shop' : 'window',
      shopId: sh.id, brand: sh.brand, blurb: sh.blurb,
    });
  }
  // ---- the four holes in the building. Nothing else moves you between
  // levels: the up arrow on its own does nothing in here.
  P.push({ kind: 'escalator', x: 900, w: 240, h: 40, floor: 1, toY: NRT_T_UP, toFloor: 0, dir: 1, rideTime: 2.6, act: 'ride', label: 'UP TO THE SHOPS', reach: 70 });
  P.push({ kind: 'stairs', x: 1080, w: 180, h: 40, floor: 0, toY: NRT_T_DOWN, toFloor: 1, dir: -1, rideTime: 3.0, act: 'ride', label: 'STAIRS DOWN', reach: 70 });
  P.push({ kind: 'escalator', x: 2700, w: 260, h: 40, floor: 1, toY: NRT_T_UP, toFloor: 0, dir: 1, rideTime: 2.6, act: 'ride', label: 'UP', reach: 70 });
  P.push({ kind: 'escalator', x: 2840, w: 260, h: 40, floor: 0, toY: NRT_T_DOWN, toFloor: 1, dir: -1, rideTime: 2.6, act: 'ride', label: 'DOWN', reach: 70 });
  P.push({ kind: 'lift', x: NRT_T_LIFTX, w: 88, h: 96, floor: 1, level: 1, open: 1, act: 'lift', label: 'LIFT', reach: 52 });
  P.push({ kind: 'lift', x: NRT_T_LIFTX, w: 88, h: 96, floor: 0, level: 2, open: 1, act: 'lift', label: 'LIFT', reach: 52 });
  P.push({ kind: 'escalator', x: 6460, w: 260, h: 40, floor: 0, toY: NRT_T_DOWN, toFloor: 1, dir: -1, rideTime: 2.6, act: 'ride', label: 'DOWN', reach: 70 });
  P.push({ kind: 'stairs', x: 6620, w: 180, h: 40, floor: 1, toY: NRT_T_UP, toFloor: 0, dir: 1, rideTime: 3.0, act: 'ride', label: 'STAIRS UP', reach: 70 });
  // the last moving walkway, which delivers you at the doors whether or not
  // you were ready to be delivered
  P.push({ kind: 'travelator', x: 7120, w: 320, h: 20, floor: 1, dir: 1 });
  // ---- the things that make a hall a hall. None of these is interactable,
  // so none of them can steal a prompt from a shop door.
  const benches = [300, 1010, 2640, 4470, 6360, 7000];
  for (let i = 0; i < benches.length; i++) P.push({ kind: 'bench', x: benches[i], w: 96, h: 40, floor: 1 });
  const upBenches = [1010, 2650, 4480, 6370];
  for (let i = 0; i < upBenches.length; i++) P.push({ kind: 'bench', x: upBenches[i], w: 80, h: 34, floor: 0 });
  const bins = [380, 1090, 2900, 4700, 6300, 7060];
  for (let i = 0; i < bins.length; i++) P.push({ kind: 'bin', x: bins[i], w: 26, h: 42, floor: 1 });
  const plants = [200, 2580, 4420, 6680, 7300];
  for (let i = 0; i < plants.length; i++) P.push({ kind: 'plant', x: plants[i], w: 48, h: 56, floor: 1 });
  P.push({ kind: 'nrtbed', x: 2820, w: 170, h: 30, floor: 1 });
  P.push({ kind: 'nrtbed', x: 4660, w: 170, h: 30, floor: 1 });
  P.push({ kind: 'trolley', x: 240, w: 46, h: 52, floor: 1 });
  P.push({ kind: 'trolley', x: 6920, w: 46, h: 52, floor: 1 });
  P.push({ kind: 'fireext', x: 1120, y: 400, w: 14, h: 26, floor: 1 });
  P.push({ kind: 'fireext', x: 6290, y: 400, w: 14, h: 26, floor: 1 });
  // ---- the labelled furniture, kept in the two ends of the hall where
  // there is room for it
  P.push({ kind: 'counter', x: 420, w: 150, h: 44, floor: 1, col: '#d8d2c4', text: 'INFORMATION' });
  P.push({ kind: 'atm', x: 700, w: 46, h: 76, floor: 1, label: 'CASH MACHINE', act: 'atm' });
  P.push({ kind: 'vending', x: 6800, w: 48, h: 84, floor: 1, label: 'VENDING', act: 'vend' });
  P.push({ kind: 'payphone', x: 6920, y: 420, w: 26, h: 52, floor: 0, label: 'PAYPHONE', act: 'phone' });
  P.push({ kind: 'vending', x: 6960, w: 48, h: 84, floor: 1, label: 'VENDING', act: 'vend' });
  // the doors out, and the gate numbers beyond them
  P.push({ kind: 'nrtexit', x: NRT_T_EXIT, w: 130, h: 140, floor: 1, label: 'OUT TO THE GATES', act: 'gates', reach: 72 });
  return P;
}
// Where a bug can stand without a shop door shouting over the top of it.
// Everything labelled owns a stretch of floor; these are the stretches that
// are left, which is where the people go.
function nrtFreeSpots(props, floor, x0, x1, gap) {
  const busy = [];
  for (let i = 0; i < props.length; i++) {
    const p = props[i];
    if (!p.label && !p.act) continue;
    if (Math.round(p.floor) !== floor) continue;
    const r = (p.reach || 34) + (p.w || 40) / 2 + 46;
    busy.push([p.x - r, p.x + r]);
  }
  const out = [];
  for (let x = x0; x <= x1; x += 8) {
    let ok = true;
    for (let i = 0; i < busy.length && ok; i++) if (x > busy[i][0] && x < busy[i][1]) ok = false;
    for (let i = 0; i < out.length && ok; i++) if (Math.abs(out[i] - x) < (gap || 190)) ok = false;
    if (ok) out.push(x);
  }
  return out;
}
function nrtTerminalNpcs() {
  // Twelve people, placed into whatever floor is left over once every shop
  // door and every escalator has taken its share. Hand-picking x for these
  // never survives a change to the shop catalogue; this does.
  const props = nrtTerminalProps();
  const down = nrtFreeSpots(props, 1, 180, NRT_T_W - 260, 200);
  const up = nrtFreeSpots(props, 0, 1100, 6700, 220);
  const poses = ['idle', 'talk', 'idle', 'sleep', 'idle', 'cheer', 'talk', 'idle', 'idle', 'talk', 'idle', 'idle'];
  const carries = [null, null, null, null, 'bag', null, null, null, 'coffee', 'phone', 'suitcase', null];
  const out = [];
  for (let i = 0; i < 12; i++) {
    // eight down on the arrivals floor, four up on the mezzanine
    const useUp = (i % 3 === 1) && up.length > 0;
    const pool = useUp ? up : down;
    if (!pool.length) continue;
    const x = pool.splice(Math.floor(i * pool.length / 13) % pool.length, 1)[0];
    const p = nrtPerson(i);
    const span = p.walk ? p.walk / 2 : (i % 4 === 2 ? 22 : 0);
    out.push({
      name: p.name, voice: p.voice, tag: p.tag,
      x: x, floor: useUp ? 0 : 1, scale: useUp ? 1.25 : 1.45,
      walk: span ? [x - span, x + span] : null, speed: 14,
      carry: p.carry || carries[i], pose: poses[i], sign: i === 0 ? 'MR. TANA' : null,
    });
  }
  return out;
}
// The flight-information screens, hung on poles out over the arrivals floor.
// They belong in front of the upper level, not behind it, which is why they
// are painted in fore() and not with the rest of the architecture.
function nrtHangingScreens(ctx, S, t) {
  const xs = [1400, 3200, 5100, 6900];
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i];
    if (!S.cam.visible(x, 180)) continue;
    rect(ctx, x - 46, 150, 4, 44, '#8a9098');
    rect(ctx, x + 42, 150, 4, 44, '#8a9098');
    rect(ctx, x - 58, 190, 116, 74, '#191d26');
    rect(ctx, x - 54, 194, 108, 66, '#0d1018');
    // four rows of a flight board nobody on the ground needs any more
    const rows = ['NH 852  SAPPORO    17:05', 'JL 041  SEOUL      17:20', 'DF0809  LAS VEGAS  18:40', 'CX 501  HONG KONG  19:05'];
    for (let r = 0; r < rows.length; r++) {
      const on = (Math.floor(t * 0.6) % 4) === r;
      drawText(ctx, rows[r], x - 50, 199 + r * 15, on ? '#f2a03a' : '#6f8a9c', { font: 'small' });
    }
    ctx.globalAlpha = 0.09; for (let k = 0; k < 66; k += 3) rect(ctx, x - 54, 194 + k, 108, 1, '#000'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.1; ellipsePx(ctx, x, 280, 70, 40, '#8ad8ff'); ctx.globalAlpha = 1;
  }
}

// ---------- the terminal scene ----------
function nrtTerminalDef() {
  return {
    name: 'NARITA - TERMINAL 1', sub: 'FIND THE PICK-UP. GATE 5.', tint: '#1f5f4a',
    w: NRT_T_W, zoom: 1, yBias: 0.74, hud: false, canLeave: false, freeFloors: false,
    heroScale: 1.6, speed: 130, carry: 'suitcase',
    start: { x: 180, floor: 1 },
    floors: [{ y: NRT_T_UP, z: 0.86 }, { y: NRT_T_DOWN, z: 1 }],
    props: nrtTerminalProps(),
    npcs: nrtTerminalNpcs(),
    enterLine: 'IT IS BIGGER THAN THE TOWN YOU GREW UP IN.',
    sky: function (ctx) { rect(ctx, 0, 0, W, H, '#9aaab8'); },

    init: function (S) {
      S.nrtObj = 'FIND THE PICK-UP. GATE 5.';
      S.nrtPlanT = 0; S.nrtStage = 0; S.nrtTannoy = 12;
      S.nrtLift = { k: 1, from: 1, to: 1, p: null, other: null };
      // sixty-odd people, split between the two levels, all of them going
      // somewhere with more conviction than you
      S.nrtCrowdDown = makeSideCrowd(40, 80808, { x0: 160, x1: NRT_T_W - 200, floors: 1, min: 1.05, max: 1.45 });
      S.nrtCrowdUp = makeSideCrowd(28, 50505, { x0: 1000, x1: 6700, floors: 1, min: 0.78, max: 1.05 });
      if (typeof setChapter === 'function') setChapter('narita');
      if (S.opts && S.opts.at != null) {
        // coming back out of a shop: stand where you were, on the level you
        // were on. Floor zero is a real floor, so this cannot use `|| 1`.
        S.body.x = S.opts.at;
        S.body.floor = S.opts.floor != null ? S.opts.floor : 1;
        S.body.fk = S.body.floor;
        S.cam.snapTo(S.body.x, S.floorY(S.body.fk));
      }
    },

    tick: function (S, dt) {
      // ---- the travelator, carrying whoever stands on it
      for (let i = 0; i < S.props.length; i++) {
        const p = S.props[i];
        if (p.kind !== 'travelator') continue;
        if (Math.abs(S.body.x - p.x) < p.w / 2 && Math.abs(S.body.fk - p.floor) < 0.3) S.body.x += 48 * dt * (p.dir || 1);
      }
      // ---- the lift, which takes its time on purpose
      const L = S.nrtLift;
      if (L.k < 1) {
        L.k = Math.min(1, L.k + dt / 3.0);
        S.locked = 0.4;
        S.body.x = L.p.x;
        S.body.moving = false;
        // doors shut, car moves, doors open: a third of the ride each
        const shut = clamp(L.k / 0.22, 0, 1);
        const move = clamp((L.k - 0.26) / 0.48, 0, 1);
        const open = clamp((L.k - 0.78) / 0.22, 0, 1);
        L.p.open = 1 - shut + open;
        if (L.other) L.other.open = L.p.open;
        S.body.fk = lerp(L.from, L.to, easeInOut(move));
        if (L.k >= 1) {
          S.body.floor = L.to; S.body.fk = L.to; S.locked = 0;
          L.p.open = 1; if (L.other) L.other.open = 1;
          Audio.ui('pop');
        }
      }
      // ---- where you are up to, said out loud in the corner
      if (S.nrtStage === 0 && S.body.x > 3200) { S.nrtStage = 1; S.nrtObj = 'EAST END. GATE 5 IS OUTSIDE.'; }
      if (S.nrtStage === 1 && S.body.x > 6700) { S.nrtStage = 2; S.nrtObj = 'THE DOORS ARE AHEAD.'; S.flash('YOU CAN SEE DAYLIGHT.', 3); }
      if (S.nrtStage === 2) S.nrtObj = S.body.floor !== 1 ? 'WRONG LEVEL. GET DOWN TO ARRIVALS.' : 'THE DOORS ARE AHEAD.';
      S.nrtPlanT = Math.max(0, S.nrtPlanT - dt);
      // ---- the tannoy, in a building where nobody has ever heard one clearly
      S.nrtTannoy -= dt;
      if (S.nrtTannoy <= 0 && !S.dlg) {
        S.nrtTannoy = 42;
        Voice.chime('station');
        const lines = [
          'THE MOVING WALKWAY IS ENDING.',
          'PASSENGER LAST CALL: GATE 62.',
          'PLEASE KEEP YOUR BAGGAGE WITH YOU.',
          'CARS AND TAXIS: GATES 1 TO 7, GROUND LEVEL.',
          'SMOKING IS PERMITTED IN THE ROOMS PROVIDED.',
        ];
        S.flash(lines[Math.floor(S.t / 42) % lines.length], 4);
      }
    },

    // ---- the building, painted far to near
    mid: function (ctx, S, t) {
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      nrtRoof(ctx, S, t, x0, x1);
      nrtCurtainWall(ctx, S, t, x0, x1);
      // the set pieces along the back wall, each one dropped into a gap
      // between the shop runs so nothing is ever hidden behind a shopfront
      if (S.cam.visible(420, 420)) nrtClockWall(ctx, 420, 142, t);
      if (S.cam.visible(960, 400)) nrtDepBoard(ctx, 960, 130, t);
      if (S.cam.visible(2750, 400)) nrtDepBoard(ctx, 2750, 130, t);
      if (S.cam.visible(4590, 420)) nrtMural(ctx, 4440, 146, 300, 92, t);
      if (S.cam.visible(6900, 400)) nrtDepBoard(ctx, 6900, 130, t);
      // the upper level, its shops, and everybody on it
      nrtUpperSlab(ctx, S, t, x0, x1);
      nrtDrawShops(ctx, S, t, 0);
      drawSideCrowd(ctx, S, S.nrtCrowdUp, t, { x0: 1000, x1: 6700, y: NRT_T_UP, dim: 0.35 });
      // the glass lift shaft, which runs through both levels
      nrtLiftShaft(ctx, S, t);
      // the arrivals floor, its shops, and everybody on that
      sideFloor(ctx, x0, x1, NRT_T_DOWN, { h: 140, col: NRT_PAL.floor, col2: NRT_PAL.floorLo, tile: 56, lip: NRT_PAL.floorHi, grout: true });
      // the green line painted on the floor, which is the honest wayfinding
      ctx.globalAlpha = 0.5;
      for (let x = Math.floor(x0 / 34) * 34; x < x1; x += 34) rect(ctx, x, NRT_T_DOWN + 26, 22, 4, NRT_PAL.greenHi);
      ctx.globalAlpha = 1;
      nrtDrawShops(ctx, S, t, 1);
      // the pillars, in the gaps between the shop runs
      const pillars = [800, 2580, 4420, 6320, 7280];
      for (let i = 0; i < pillars.length; i++) if (S.cam.visible(pillars[i], 120)) nrtBannerPillar(ctx, pillars[i], 190, NRT_T_DOWN, i, t);
      drawSideCrowd(ctx, S, S.nrtCrowdDown, t, { x0: 160, x1: NRT_T_W - 200, dim: 0.16 });
    },

    fore: function (ctx, S, t) {
      // the lift car, and the boards hanging out over the hall: both of them
      // live in the near air, in front of the upper level
      nrtLiftCar(ctx, S, t);
      nrtHangingScreens(ctx, S, t);
      // the near pillars, cropped by the bottom of the frame, which is what
      // gives the hall its depth
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      for (let x = Math.floor(x0 / 1400) * 1400; x < x1; x += 1400) {
        ctx.globalAlpha = 0.92;
        rect(ctx, x + 640, 120, 46, 520, '#232833');
        rect(ctx, x + 640, 120, 8, 520, '#39404e');
        rect(ctx, x + 676, 120, 10, 520, '#171b23');
        ctx.globalAlpha = 1;
      }
    },

    after: function (ctx, S, t) {
      grade(ctx, 0, 0, W, H, '#cfe0ee', 0.06);
      vignette(ctx, 0.34, '#0a0d14');
    },

    overlay: function (ctx, S, t) {
      nrtObjectiveStrip(ctx, S.nrtObj, t);
      nrtMoneyChip(ctx);
      // the east arrow, for when you have been standing still too long
      if (!S.dlg && S.body.x < NRT_T_EXIT - 400) {
        ctx.globalAlpha = 0.35 + 0.3 * Math.sin(t * 3);
        drawText(ctx, 'EAST', W - 52, 64, NRT_PAL.greenHi, { align: 'center', scale: 2, outline: '#0a1a12' });
        ctx.fillStyle = NRT_PAL.greenHi;
        for (let i = 0; i < 3; i++) {
          const ax = W - 72 + i * 15 + Math.sin(t * 5 - i * 0.7) * 3;
          ctx.beginPath(); ctx.moveTo(ax + 8, 88); ctx.lineTo(ax - 4, 80); ctx.lineTo(ax - 4, 96); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (S.nrtPlanT > 0) nrtPlanPanel(ctx, S, t);
    },

    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'nrtsign': nrtGreenSign(ctx, p.x, p.y, p.w, p.h, p.lines, p.arrow, t); return true;
        case 'nrtbed': nrtBed(ctx, p.x, base, p.w, t, Math.round(p.x)); return true;
        case 'nrtdoor': {
          // the doorway is already painted into the shopfront; all this adds
          // is the mat and the light spilling out of it
          ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 2 + p.x * 0.01);
          ellipsePx(ctx, p.x, base + 1, 34, 9, p.brand ? lighten(p.brand.col, 0.5) : '#ffe9a8');
          ctx.globalAlpha = 1;
          rect(ctx, p.x - 26, base - 3, 52, 3, p.brand ? darken(p.brand.col, 0.25) : '#3a3f4a');
          return true;
        }
        case 'nrtplan': {
          // a lit board with the terminal drawn on it in two colours and a
          // dot that is you, which is the only useful thing on it
          rect(ctx, p.x - p.w / 2, base - p.h, p.w, p.h, '#2a3140');
          frame(ctx, p.x - p.w / 2, base - p.h, p.w, p.h, '#4a5262');
          rect(ctx, p.x - p.w / 2 + 5, base - p.h + 16, p.w - 10, p.h - 26, '#e6e2d6');
          drawText(ctx, 'FLOOR PLAN', p.x, base - p.h + 5, NRT_PAL.gold, { align: 'center', font: 'small' });
          const mx = p.x - p.w / 2 + 9, mw = p.w - 18, my = base - p.h + 24;
          rect(ctx, mx, my, mw, 12, '#b8c8b8');
          rect(ctx, mx, my + 18, mw, 12, '#c8c0a8');
          const dot = mx + mw * clamp(S.body.x / NRT_T_W, 0, 1);
          ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6);
          rect(ctx, dot - 2, my + (S.body.floor === 0 ? 0 : 18), 4, 12, '#c8402c');
          ctx.globalAlpha = 1;
          rect(ctx, mx + mw - 6, my + 18, 6, 12, '#2f8f4a');
          drawText(ctx, 'YOU ARE HERE', p.x, base - 16, '#241d28', { align: 'center', font: 'small' });
          // the little post it stands on
          rect(ctx, p.x - 5, base - p.h + p.h, 10, 0, '#4a5262');
          return true;
        }
        case 'nrtexit': {
          // the automatic doors, and the grey day on the other side of them
          const w = p.w, h = p.h, x = p.x - w / 2, y = base - h;
          rect(ctx, x - 8, y - 10, w + 16, h + 10, '#3a4150');
          rect(ctx, x - 8, y - 10, w + 16, 4, '#5c6476');
          rect(ctx, x, y, w, h, '#7d90a4');
          vgrad(ctx, x, y, w, h, '#b8c6d2', '#8090a0');
          // gate numbers on the lintel, with 5 lit
          for (let i = 0; i < 7; i++) {
            const gx = x + 10 + i * ((w - 20) / 7);
            const on = i === 4;
            rect(ctx, gx, y - 8, 12, 12, on ? '#2f8f4a' : '#23293a');
            drawText(ctx, String(i + 1), gx + 6, y - 5, on ? '#f4f1ea' : '#7a8494', { align: 'center', font: 'small' });
          }
          // the doors themselves, parted a little because somebody just left
          const gap = 12 + Math.abs(Math.sin(t * 0.9)) * 10;
          rect(ctx, x, y, w / 2 - gap, h, '#a8b8c6');
          rect(ctx, x + w / 2 + gap, y, w / 2 - gap, h, '#a8b8c6');
          ctx.globalAlpha = 0.3;
          rect(ctx, x + 3, y + 3, w / 2 - gap - 6, h - 6, '#eaf2f8');
          rect(ctx, x + w / 2 + gap + 3, y + 3, w / 2 - gap - 6, h - 6, '#eaf2f8');
          ctx.globalAlpha = 1;
          rect(ctx, x + w / 2 - gap - 3, y, 3, h, '#6a7282');
          rect(ctx, x + w / 2 + gap, y, 3, h, '#6a7282');
          // cold air falling in over the threshold
          ctx.globalAlpha = 0.12 + 0.04 * Math.sin(t * 2.2);
          rect(ctx, x + w / 2 - gap, base - 40, gap * 2, 40, '#cfe4f4');
          ctx.globalAlpha = 1;
          nrtGreenSign(ctx, p.x, y - 46, 150, 30, ['EXIT'], 1, t);
          return true;
        }
      }
      return false;
    },

    use: function (S, e) {
      switch (e.act) {
        case 'plan': {
          S.nrtPlanT = 8; Audio.ui('select');
          if (S.nrtStage === 0) { S.nrtStage = 1; S.nrtObj = 'EAST END. GATE 5 IS OUTSIDE.'; }
          S.flash('GATE 5 IS AT THE EAST END, GROUND LEVEL.', 4);
          return;
        }
        case 'window': {
          const b = e.brand ? e.brand.name : 'THIS ONE';
          if (e.blurb) S.run([
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: b + '. YOU DO NOT GO IN.' },
            { who: '', voice: false, at: 'you', think: true, text: String(e.blurb).toUpperCase().slice(0, 96) },
          ]);
          else S.say('YOU', b + '. NOT FOR PEOPLE LIKE YOU TODAY.', 'you');
          return;
        }
        case 'shop': {
          const shop = nrtShopById(e.shopId);
          if (typeof ShopInteriorScene === 'undefined' || !shop) {
            S.say('YOU', 'SHUT. OR YOU HAVE NO MONEY. HARD TO TELL.', 'you');
            return;
          }
          const at = S.body.x, fl = S.body.floor;
          Audio.ui('select');
          Voice.chime('shop');
          Game.go(function () {
            return new ShopInteriorScene(shop, function () { return new NaritaTerminalScene({ at: at, floor: fl }); });
          }, 'iris');
          return;
        }
        case 'ride': {
          if (S.riding) return;
          S.ride(e);
          return;
        }
        case 'lift': {
          const L = S.nrtLift;
          if (L.k < 1) return;
          const to = S.body.floor === 1 ? 0 : 1;
          let other = null;
          for (let i = 0; i < S.props.length; i++) if (S.props[i].kind === 'lift' && S.props[i] !== e) other = S.props[i];
          S.nrtLift = { k: 0, from: S.body.floor, to: to, p: e, other: other };
          Audio.ui('move');
          S.flash(to === 0 ? 'UP TO THE SHOPS.' : 'DOWN TO ARRIVALS.', 2);
          return;
        }
        case 'atm': {
          S.say('YOU', 'THE RATE IS AN INSULT. YOU TAKE IT ANYWAY.', 'you');
          return;
        }
        case 'vend': {
          const r = Game.run;
          if (r && r.money >= 2) {
            r.money -= 2;
            r.stamina = clamp((r.stamina || 0) + 6, 0, r.staminaMax || 100);
            Audio.ui('coin'); r.save();
            S.flash('HOT CAN OF COFFEE. -$2. +6 STAMINA.');
            S.fx.burst(e.x, S.floorY(e.floor) - 30, 8, { color: ['#f2a03a', '#f4f1ea'], speed: 50, life: 0.5, size: 2 });
          } else { S.flash('TWO DOLLARS. YOU DO NOT HAVE TWO DOLLARS.'); Audio.ui('error'); }
          return;
        }
        case 'phone': {
          S.say('YOU', 'WHO WOULD I RING. AND WITH WHAT COINS.', 'you');
          return;
        }
        // NB: not called 'exit'. SideScene.interact() treats that act as a
        // reserved word and leaves before the scene's own use() is reached.
        case 'gates': {
          Voice.chime('station');
          if (typeof setChapter === 'function') setChapter('narita');
          S.leave(function () { return new NaritaKerbScene(); }, 'slideL', { dur: 0.9 });
          return;
        }
      }
    },
  };
}
// The shaft: a glass box running through both floors, with the guide rails
// and the counterweight visible because it is meant to be looked at.
function nrtLiftShaft(ctx, S, t) {
  const x = NRT_T_LIFTX;
  if (!S.cam.visible(x, 160)) return;
  const top = 150, bot = NRT_T_DOWN;
  rect(ctx, x - 52, top, 104, bot - top, '#2a303c');
  ctx.globalAlpha = 0.22; rect(ctx, x - 48, top + 4, 96, bot - top - 8, '#bfe0ff'); ctx.globalAlpha = 1;
  rect(ctx, x - 52, top, 6, bot - top, '#8a9098');
  rect(ctx, x + 46, top, 6, bot - top, '#8a9098');
  rect(ctx, x - 52, top, 104, 8, '#b9bec6');
  rect(ctx, x - 52, top, 104, 3, '#e2e6ec');
  for (let y = top + 16; y < bot; y += 34) { ctx.globalAlpha = 0.2; rect(ctx, x - 46, y, 92, 2, '#ffffff'); ctx.globalAlpha = 1; }
  // the counterweight, which goes the other way and that is the nice bit
  const L = S.nrtLift;
  const k = L.k < 1 ? clamp((L.k - 0.26) / 0.48, 0, 1) : 1;
  const carY = lerp(L.from === 0 ? NRT_T_UP : NRT_T_DOWN, L.to === 0 ? NRT_T_UP : NRT_T_DOWN, easeInOut(k));
  const cwY = lerp(NRT_T_DOWN, NRT_T_UP, 1 - clamp((carY - NRT_T_UP) / (NRT_T_DOWN - NRT_T_UP), 0, 1));
  rect(ctx, x + 36, cwY - 90, 10, 30, '#5a6272');
  rect(ctx, x + 36, cwY - 90, 10, 3, '#7c8496');
}
// The car. Drawn in front of the far level so the glass reads, with you
// visible through it when you are inside.
function nrtLiftCar(ctx, S, t) {
  const x = NRT_T_LIFTX;
  if (!S.cam.visible(x, 160)) return;
  const L = S.nrtLift;
  const k = L.k < 1 ? clamp((L.k - 0.26) / 0.48, 0, 1) : 1;
  const from = L.from === 0 ? NRT_T_UP : NRT_T_DOWN, to = L.to === 0 ? NRT_T_UP : NRT_T_DOWN;
  const base = Math.round(lerp(from, to, easeInOut(k)));
  const h = 98, w = 84;
  rect(ctx, x - w / 2, base - h, w, 5, '#b9bec6');
  rect(ctx, x - w / 2, base - 5, w, 6, '#8a8f98');
  rect(ctx, x - w / 2, base - h, 5, h, '#9aa0aa');
  rect(ctx, x + w / 2 - 5, base - h, 5, h, '#9aa0aa');
  ctx.globalAlpha = 0.28; rect(ctx, x - w / 2 + 5, base - h + 5, w - 10, h - 11, '#cfe8ff'); ctx.globalAlpha = 1;
  // the strip light in the car ceiling, and the pool it puts on its own floor
  ctx.globalAlpha = 0.8; rect(ctx, x - w / 2 + 12, base - h + 6, w - 24, 3, '#fff2cc'); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.12; rect(ctx, x - w / 2 + 6, base - 24, w - 12, 20, '#ffe9a8'); ctx.globalAlpha = 1;
  // the diagonal flare on the glass, which is the only reason it reads as glass
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(x - w / 2 + 14, base - 6); ctx.lineTo(x - w / 2 + 30, base - 6);
  ctx.lineTo(x - w / 2 + 62, base - h + 6); ctx.lineTo(x - w / 2 + 46, base - h + 6); ctx.fill();
  ctx.globalAlpha = 1;
}
// The floor plan as a panel, once you have actually read the board.
function nrtPlanPanel(ctx, S, t) {
  const w = 460, h = 168, x = W / 2 - w / 2, y = 62;
  const a = clamp(S.nrtPlanT, 0, 1);
  ctx.globalAlpha = a;
  uiPanel(ctx, x, y, w, h, { color: '#1b2230' });
  drawText(ctx, 'TERMINAL 1  -  ARRIVALS', x + 14, y + 12, NRT_PAL.gold, { scale: 2 });
  // two bars, one per level, with the bands marked along them
  const mx = x + 16, mw = w - 32;
  for (let f = 0; f < 2; f++) {
    const my = y + 40 + f * 52;
    rect(ctx, mx, my, mw, 34, f === 0 ? '#3a4a58' : '#4a4438');
    rect(ctx, mx, my, mw, 2, f === 0 ? '#5f7382' : '#6d6450');
    drawText(ctx, f === 0 ? '2F  SHOPS' : '1F  ARRIVALS', mx + 4, my + 3, withAlpha('#f4f1ea', 0.7), { font: 'small' });
    for (let b = 0; b < NRT_BANDS.length; b++) {
      const band = NRT_BANDS[b];
      if (band.floor !== f) continue;
      const bx = mx + mw * (band.x0 / NRT_T_W), bw = mw * ((band.x1 - band.x0) / NRT_T_W);
      rect(ctx, bx, my + 14, bw, 16, '#2f8f4a');
      rect(ctx, bx, my + 14, bw, 2, '#6be585');
      drawText(ctx, band.name, bx + 2, my + 19, '#f4f1ea', { font: 'small' });
    }
    if (f === 1) {
      rect(ctx, mx + mw - 20, my + 14, 20, 16, '#c8402c');
      drawText(ctx, 'G5', mx + mw - 18, my + 19, '#fff2cc', { font: 'small' });
    }
  }
  // you, blinking, on the right bar
  const dx = mx + mw * clamp(S.body.x / NRT_T_W, 0, 1);
  const dy = y + 40 + (S.body.floor === 0 ? 0 : 52);
  ctx.globalAlpha = a * (0.55 + 0.45 * Math.sin(t * 7));
  rect(ctx, dx - 3, dy - 6, 6, 8, '#ffd24a');
  ctx.globalAlpha = a;
  drawText(ctx, 'YOU ARE HERE', dx, dy - 18, '#ffd24a', { align: 'center', font: 'small' });
  drawText(ctx, 'GATE 5: EAST END, GROUND LEVEL, OUTSIDE.', x + 14, y + h - 16, '#cfc9e6', { font: 'small' });
  ctx.globalAlpha = 1;
}
// The little money chip, since these scenes hide the normal HUD.
function nrtMoneyChip(ctx) {
  const money = (Game.run && Game.run.money != null) ? Game.run.money : 0;
  ctx.globalAlpha = 0.86;
  rect(ctx, W - 122, 10, 112, 26, 'rgba(8,10,18,0.85)');
  ctx.globalAlpha = 1;
  frame(ctx, W - 122, 10, 112, 26, DF.goldLo);
  ctx.drawImage(icon('coin'), W - 114, 16);
  drawText(ctx, fmtMoney(money), W - 16, 16, NRT_PAL.gold, { align: 'right', scale: 2 });
}

class NaritaTerminalScene extends SideScene {
  constructor(opts) { super(nrtTerminalDef(), opts || {}); }
  // the named NPCs who are holding something up get it drawn over their head
  drawNpc(ctx, n) {
    super.drawNpc(ctx, n);
    if (n.sign) nrtNameCard(ctx, n._x, this.floorY(n.floor) - 30, 1.4, n.sign, '#241d28');
  }
}

// ==========================================================================
//  THREE - THE KERB. OUTSIDE, AT LAST, AND IT IS COLD.
// ==========================================================================
// A covered kerbside under the departures ramp: seven numbered gates, a bus
// idling at two, a taxi rank at three with white gloves on every wheel, and
// at five a small car with your name on a tablet, spelled wrong.

const NRT_K_W = 2500;
const NRT_K_Y = 424;
const NRT_K_GATE5 = 1560;   // gate five, where a private car is allowed to wait

function nrtKerbRoof(ctx, x0, x1, t) {
  // the underside of the departures ramp, which is the roof down here
  rect(ctx, x0, -20, x1 - x0, 176, '#4a4f5c');
  rect(ctx, x0, 150, x1 - x0, 10, '#2f3440');
  rect(ctx, x0, 156, x1 - x0, 4, '#1b1f28');
  for (let x = Math.floor(x0 / 132) * 132; x < x1; x += 132) {
    rect(ctx, x, 0, 10, 156, '#3a3f4c');
    rect(ctx, x, 0, 3, 156, '#575d6c');
    // the fluorescent tube under every second beam, half of them buzzing
    const on = ((x / 132) | 0) % 3 !== 1;
    rect(ctx, x + 40, 142, 56, 6, '#23272f');
    ctx.globalAlpha = on ? 0.9 : 0.3 + 0.4 * Math.abs(Math.sin(t * 22 + x));
    rect(ctx, x + 42, 143, 52, 4, '#eaf2ff');
    ctx.globalAlpha = 0.08; ellipsePx(ctx, x + 68, 260, 74, 130, '#cfe4f4'); ctx.globalAlpha = 1;
  }
}
function nrtGatePost(ctx, x, base, n, t, lit) {
  rect(ctx, x - 6, base - 150, 12, 150, '#5a6272');
  rect(ctx, x - 6, base - 150, 4, 150, '#7c8496');
  rect(ctx, x - 30, base - 186, 60, 44, lit ? '#1f7a52' : '#2a3140');
  rect(ctx, x - 28, base - 184, 56, 40, lit ? '#2fa86c' : '#3a4150');
  rect(ctx, x - 28, base - 184, 56, 2, lit ? '#6be585' : '#4e5668');
  drawText(ctx, String(n), x, base - 176, '#f4f1ea', { align: 'center', scale: 4 });
  if (lit) { ctx.globalAlpha = 0.14 + 0.05 * Math.sin(t * 2); ellipsePx(ctx, x, base - 160, 54, 40, '#6be585'); ctx.globalAlpha = 1; }
  // the painted number on the kerb itself, worn by tyres
  ctx.globalAlpha = 0.5;
  drawText(ctx, String(n), x, base + 14, '#d8d2c4', { align: 'center', scale: 3 });
  ctx.globalAlpha = 1;
}
// An airport limousine bus: a slab with a luggage hold open and a driver in
// gloves stacking cases by size.
function nrtBus(ctx, x, base, t) {
  const w = 300, h = 96;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x + w / 2, base + 4, w * 0.46, 8, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, base - h, w, h, '#e8e4da');
  rect(ctx, x, base - h, w, 5, '#ffffff');
  rect(ctx, x, base - 34, w, 10, '#c8402c');
  rect(ctx, x, base - 24, w, 8, '#2f4a68');
  for (let i = 0; i < 6; i++) {
    rect(ctx, x + 18 + i * 44, base - h + 14, 34, 28, '#243244');
    ctx.globalAlpha = 0.3; rect(ctx, x + 18 + i * 44, base - h + 14, 34, 10, '#bfe0ff'); ctx.globalAlpha = 1;
    if (i % 2 === 0) ellipsePx(ctx, x + 28 + i * 44, base - h + 32, 6, 6, '#3a3550');
  }
  // the destination blind, in a colour of green only buses have
  rect(ctx, x + 10, base - h + 3, 96, 12, '#12161f');
  ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 3);
  drawText(ctx, 'TOKYO CITY AIR', x + 12, base - h + 5, '#f2a03a', { font: 'small' });
  ctx.globalAlpha = 1;
  // the hold, open, and the cases going in smallest last
  rect(ctx, x + 40, base - 22, 120, 18, '#1b1f28');
  for (let i = 0; i < 4; i++) rect(ctx, x + 46 + i * 28, base - 20, 24, 15, ['#2f4a8a', '#8a2a1c', '#2f6a4a', '#5a5a70'][i]);
  circle(ctx, x + 52, base - 4, 13, '#1b1b24'); circle(ctx, x + 52, base - 4, 6, '#5a6272');
  circle(ctx, x + w - 58, base - 4, 13, '#1b1b24'); circle(ctx, x + w - 58, base - 4, 6, '#5a6272');
  // exhaust, idling, because it has been idling for twenty minutes
  if (Math.sin(t * 1.7) > 0.4) { ctx.globalAlpha = 0.18; ellipsePx(ctx, x - 6, base - 12, 12, 7, '#cfd6e8'); ctx.globalAlpha = 1; }
}
// A rank of black taxis with doilies on the headrests and doors that open
// themselves, which is the first thing anybody notices about this country.
function nrtTaxi(ctx, x, base, t, i) {
  const w = 128, h = 54;
  ctx.globalAlpha = 0.3; ellipsePx(ctx, x + w / 2, base + 3, w * 0.44, 6, '#000'); ctx.globalAlpha = 1;
  rect(ctx, x, base - h, w, h, '#181a20');
  rect(ctx, x, base - h, w, 3, '#3a3f4a');
  rect(ctx, x + 16, base - h - 22, w - 44, 24, '#20232b');
  rect(ctx, x + 22, base - h - 18, w - 56, 16, '#2f3a50');
  ctx.globalAlpha = 0.35; rect(ctx, x + 22, base - h - 18, w - 56, 6, '#bfe0ff'); ctx.globalAlpha = 1;
  // the roof sign, lit, and the green FOR HIRE plate in the window
  rect(ctx, x + 48, base - h - 32, 30, 11, '#e8e4da');
  ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2 + i); rect(ctx, x + 50, base - h - 30, 26, 7, '#ffd24a'); ctx.globalAlpha = 1;
  rect(ctx, x + 28, base - h - 12, 14, 8, '#2f8f4a');
  circle(ctx, x + 26, base - 4, 11, '#0d0f14'); circle(ctx, x + 26, base - 4, 5, '#8a8f98');
  circle(ctx, x + w - 28, base - 4, 11, '#0d0f14'); circle(ctx, x + w - 28, base - 4, 5, '#8a8f98');
  // the driver, outside, in white gloves, wiping something already clean
  const sp = cachedBrandStaff({ name: 'NRT-TAXI-' + i });
  drawBugAt(ctx, sp, x + w + 16, base, { pose: Math.floor(t * 0.9 + i) % 2 ? 'idle' : 'talk', scale: 1.3, bounce: 0.3, phase: i });
  rect(ctx, x + w + 22, base - 24, 5, 5, '#f4f1ea');
}

function nrtKerbProps() {
  const P = [];
  for (let i = 0; i < 7; i++) P.push({ kind: 'nrtgatepost', x: 360 + i * 300, w: 60, h: 190, floor: 0, n: i + 1 });
  P.push({ kind: 'nrtsign', x: 260, y: 186, w: 210, h: 32, floor: 0, over: true, lines: ['GATES 1-7'], arrow: 1 });
  P.push({ kind: 'nrtsign', x: 1600, y: 186, w: 230, h: 32, floor: 0, over: true, lines: ['PRIVATE CARS  5'], arrow: 1 });
  P.push({ kind: 'door', x: 110, w: 90, h: 130, floor: 0, col: '#2a3140', glow: '#a8c8e0', text: 'TERMINAL' });
  P.push({ kind: 'bench', x: 500, w: 96, h: 38, floor: 0 });
  P.push({ kind: 'bench', x: 1700, w: 96, h: 38, floor: 0 });
  P.push({ kind: 'bin', x: 560, w: 26, h: 42, floor: 0 });
  P.push({ kind: 'bin', x: 1760, w: 26, h: 42, floor: 0 });
  P.push({ kind: 'cone', x: 1380, w: 22, h: 30, floor: 0 });
  P.push({ kind: 'cone', x: 1420, w: 22, h: 30, floor: 0 });
  P.push({ kind: 'vending', x: 840, w: 48, h: 84, floor: 0, label: 'HOT CANS', act: 'vend' });
  P.push({ kind: 'plant', x: 2000, w: 44, h: 50, floor: 0 });
  P.push({ kind: 'nrtsmoke', x: 2180, w: 120, h: 108, floor: 0, label: 'SMOKING ROOM', act: 'smoke' });
  // whatever the catalogue keeps at the kerb - flowers, for the people who
  // came to meet somebody and only remembered on the way
  const kerbShop = (typeof shopsForZone === 'function' ? shopsForZone('kerb') : null);
  if (kerbShop && kerbShop.length) {
    const sh = kerbShop[0];
    P.push({
      kind: 'nrtstall', x: 2380, w: clamp(sh.w || 120, 96, 140), h: 134, floor: 0, reach: 46,
      brand: nrtBrandOf(sh), blurb: sh.blurb || '', shopId: sh.id,
      label: sh.enter === false ? 'LOOK AT THE FLOWERS' : ('GO INTO ' + (sh.name || 'IT')),
      act: sh.enter === false ? 'window' : 'stall',
    });
  }
  P.push({ kind: 'nrtride', x: NRT_K_GATE5, w: 150, h: 70, floor: 0, label: 'THAT IS YOUR NAME. ALMOST.', act: 'ride', reach: 74 });
  return P;
}
function nrtKerbNpcs() {
  return [
    { name: 'DOOR GUARD', x: 240, floor: 0, voice: 'guard', scale: 1.45, walk: [200, 320], speed: 16,
      tag: ['COLD ONE TODAY. TEN DEGREES.', 'PRIVATE CARS AT FIVE.', 'NOT FOUR. FOUR IS BUSES.'] },
    { name: 'BUS MARSHAL', x: 700, floor: 0, voice: 'clerk', scale: 1.45, carry: 'phone',
      tag: ['CITY AIR LIMOUSINE, GATE TWO.', 'NINETY MINUTES TO SHINJUKU.', 'TWO HOURS IF IT RAINS. IT IS RAINING.'] },
    { name: 'TAXI MARSHAL', x: 1230, floor: 0, voice: 'driver', scale: 1.45,
      tag: ['TAXI TO THE CITY IS TWO HUNDRED.', 'DOLLARS. NOT YEN.', 'THAT IS THE FACE EVERYBODY MAKES.'] },
    { name: 'SMOKER', x: 2110, floor: 0, voice: 'oldman', scale: 1.4,
      tag: ['ELEVEN HOURS WITHOUT ONE.', 'I COUNTED EVERY ONE OF THEM.'] },
    { name: 'YUKI', x: NRT_K_GATE5 + 96, floor: 0, voice: 'driver', scale: 1.5, act: 'driver', face: -1, pose: 'idle' },
  ];
}
function nrtKerbDef() {
  return {
    name: 'NARITA - KERBSIDE', sub: 'GATE 5. PRIVATE CARS.', tint: '#1f4a6a',
    w: NRT_K_W, zoom: 1, yBias: 0.70, hud: false, canLeave: false, freeFloors: false,
    heroScale: 1.6, speed: 126, carry: 'suitcase',
    start: { x: 150, floor: 0 },
    floors: [{ y: NRT_K_Y, z: 1 }],
    props: nrtKerbProps(),
    npcs: nrtKerbNpcs(),
    enterLine: 'TEN DEGREES. YOU CAN SEE YOUR OWN BREATH.',
    sky: function (ctx) { vgrad(ctx, 0, 0, W, H, '#8fa2b6', '#c2ccd6'); },

    init: function (S) {
      S.nrtObj = 'GATE 5. KEEP WALKING.';
      S.nrtGot = false;
      if (S.opts && S.opts.at != null) { S.body.x = S.opts.at; S.cam.snapTo(S.body.x, S.floorY(S.body.fk)); }
      // breath, and the thin drizzle blowing in under the canopy
      S.nrtPuff = 0;
    },
    tick: function (S, dt) {
      S.nrtPuff -= dt;
      if (S.nrtPuff <= 0 && S.body.moving) {
        S.nrtPuff = 1.1;
        S.fx.add({ x: S.body.x + S.body.face * 14, y: NRT_K_Y - 46, vx: S.body.face * 12, vy: -6, life: 1.1, color: '#e8f2fa', kind: 'smoke', size: 2, grow: 5, alpha: 0.35, gravity: -6 });
      }
      if (!S.nrtGot && S.body.x > NRT_K_GATE5 - 240 && S.nrtObj !== 'THE CAR AT FIVE.') {
        S.nrtObj = 'THE CAR AT FIVE.';
      }
    },

    mid: function (ctx, S, t) {
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      // the far side: the car park deck and the grey trees behind it
      nrtOutside(ctx, x0, x1, 150, 330, t, 211);
      rect(ctx, x0, 300, x1 - x0, 40, '#6a7078');
      rect(ctx, x0, 300, x1 - x0, 4, '#8a9098');
      nrtKerbRoof(ctx, x0, x1, t);
      // the road, the kerb, and the pavement you are standing on
      vgrad(ctx, x0, 340, x1 - x0, NRT_K_Y - 340, '#3f434c', '#2c2f37');
      ctx.globalAlpha = 0.4;
      for (let x = Math.floor(x0 / 74) * 74; x < x1; x += 74) rect(ctx, x, 372, 38, 3, '#e8e6dc');
      ctx.globalAlpha = 1;
      // the vehicles waiting at their numbered gates
      if (S.cam.visible(710, 340)) nrtBus(ctx, 560, 404, t);
      for (let i = 0; i < 3; i++) if (S.cam.visible(1084 + i * 150, 220)) nrtTaxi(ctx, 1020 + i * 150, 404, t, i);
      sideFloor(ctx, x0, x1, NRT_K_Y, { h: 120, col: '#8b867c', col2: '#7a7570', tile: 54, lip: '#adA79a', grout: true });
      // the yellow tactile strip along the kerb edge
      for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) rect(ctx, x, NRT_K_Y - 2, 8, 5, '#d8b23a');
    },

    fore: function (ctx, S, t) {
      // drizzle blowing in sideways under the canopy
      const x0 = S.cam.wx(-200), x1 = S.cam.wx(W + 200);
      const r = makeRng(3131);
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 70; i++) {
        const rx = x0 + ((r.range(0, x1 - x0) + t * 220) % (x1 - x0));
        const ry = 160 + ((r.range(0, 300) + t * 460) % 300);
        rect(ctx, rx, ry, 1, 7, '#dfe8f0');
      }
      ctx.globalAlpha = 1;
    },

    after: function (ctx, S, t) {
      grade(ctx, 0, 0, W, H, '#9fb6cc', 0.09);
      vignette(ctx, 0.4, '#0a0d14');
    },
    overlay: function (ctx, S, t) { nrtObjectiveStrip(ctx, S.nrtObj, t); nrtMoneyChip(ctx); },

    prop: function (ctx, p, t, S) {
      const base = S.propY(p);
      switch (p.kind) {
        case 'nrtsign': nrtGreenSign(ctx, p.x, p.y, p.w, p.h, p.lines, p.arrow, t); return true;
        case 'nrtgatepost': nrtGatePost(ctx, p.x, base, p.n, t, p.n === 5); return true;
        case 'nrtstall': sideShopFront(ctx, p.x - p.w / 2, base, p.w, p.h, p.brand, t, S); return true;
        case 'nrtsmoke': {
          // the smoking room: a glass box with the air visibly worse inside it
          rect(ctx, p.x - p.w / 2, base - p.h, p.w, p.h, '#2a3140');
          rect(ctx, p.x - p.w / 2 + 4, base - p.h + 4, p.w - 8, p.h - 8, '#4a4a48');
          ctx.globalAlpha = 0.3; rect(ctx, p.x - p.w / 2 + 4, base - p.h + 4, p.w - 8, p.h - 8, '#c8c0a8'); ctx.globalAlpha = 1;
          for (let i = 0; i < 4; i++) {
            ctx.globalAlpha = 0.18;
            ellipsePx(ctx, p.x - 40 + i * 28, base - 40 - ((t * 9 + i * 20) % 50), 16, 10, '#d8d4c8');
            ctx.globalAlpha = 1;
          }
          rect(ctx, p.x - p.w / 2, base - p.h - 16, p.w, 16, '#12161f');
          drawText(ctx, 'SMOKING ROOM', p.x, base - p.h - 12, '#cfd6de', { align: 'center', font: 'small' });
          return true;
        }
        case 'nrtride': {
          // a small silver car, hazards on, and a bug beside it with a tablet
          const x = p.x - 74, base2 = base;
          ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base2 + 3, 62, 7, '#000'); ctx.globalAlpha = 1;
          rect(ctx, x, base2 - 40, 148, 40, '#c8ccd2');
          rect(ctx, x, base2 - 40, 148, 3, '#eef1f4');
          rect(ctx, x + 22, base2 - 62, 100, 24, '#b4b9c0');
          rect(ctx, x + 28, base2 - 58, 88, 17, '#2f3a50');
          ctx.globalAlpha = 0.35; rect(ctx, x + 28, base2 - 58, 88, 6, '#bfe0ff'); ctx.globalAlpha = 1;
          circle(ctx, x + 30, base2 - 3, 12, '#14161c'); circle(ctx, x + 30, base2 - 3, 5, '#8a8f98');
          circle(ctx, x + 118, base2 - 3, 12, '#14161c'); circle(ctx, x + 118, base2 - 3, 5, '#8a8f98');
          // hazards, which are the international sign for I am allowed to wait here
          const on = Math.sin(t * 5) > 0;
          ctx.globalAlpha = on ? 1 : 0.2;
          rect(ctx, x + 2, base2 - 28, 6, 6, '#ff9a2a'); rect(ctx, x + 140, base2 - 28, 6, 6, '#ff9a2a');
          ctx.globalAlpha = on ? 0.2 : 0.05;
          ellipsePx(ctx, x + 5, base2 - 20, 14, 7, '#ff9a2a'); ellipsePx(ctx, x + 143, base2 - 20, 14, 7, '#ff9a2a');
          ctx.globalAlpha = 1;
          // the tablet with your name on it, spelled the way it sounded
          const tx = p.x + 52, ty = base2 - 62;
          rect(ctx, tx - 20, ty, 40, 28, '#1b1f28');
          rect(ctx, tx - 17, ty + 3, 34, 22, '#f2f4f8');
          drawText(ctx, 'BUSKA', tx, ty + 8, '#241d28', { align: 'center', font: 'small' });
          drawText(ctx, 'B.', tx, ty + 16, '#6a6478', { align: 'center', font: 'small' });
          ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
          frame(ctx, tx - 20, ty, 40, 28, NRT_PAL.gold);
          ctx.globalAlpha = 1;
          return true;
        }
      }
      return false;
    },

    use: function (S, e) {
      switch (e.act) {
        case 'vend': {
          const r = Game.run;
          if (r && r.money >= 2) {
            r.money -= 2; r.stamina = clamp((r.stamina || 0) + 8, 0, r.staminaMax || 100); r.save();
            Audio.ui('coin');
            S.flash('HOT CORN SOUP IN A CAN. -$2. IT HELPS.');
          } else { S.flash('NOT EVEN TWO DOLLARS.'); Audio.ui('error'); }
          return;
        }
        case 'smoke': { S.say('YOU', 'THE GLASS IS BROWN. THE GLASS IS BROWN FROM INSIDE.', 'you'); return; }
        case 'window': {
          S.run([
            { who: 'YOU', voice: 'you', at: 'you', think: true, text: 'FLOWERS, AT THE KERB, AT FIVE IN THE AFTERNOON.' },
            { who: '', voice: false, at: 'you', think: true, text: 'SOMEBODY HERE IS MEETING SOMEBODY.' },
          ]);
          return;
        }
        case 'stall': {
          if (typeof ShopInteriorScene === 'undefined' || typeof shopById !== 'function') { S.say('YOU', 'SHUT. OF COURSE IT IS SHUT.', 'you'); return; }
          const shop = shopById(e.shopId);
          if (!shop) { S.say('YOU', 'SHUT. OF COURSE IT IS SHUT.', 'you'); return; }
          const at = S.body.x;
          Audio.ui('select'); Voice.chime('shop');
          Game.go(function () { return new ShopInteriorScene(shop, function () { return new NaritaKerbScene({ at: at }); }); }, 'iris');
          return;
        }
        case 'driver': case 'ride': {
          if (S.nrtGot) return;
          S.nrtGot = true;
          S.locked = 20;
          S.run([
            { who: 'YUKI', voice: 'driver', at: 'YUKI', text: 'BUSKA? MISTER BUSKA?' },
            { who: 'YOU', voice: 'you', at: 'you', text: 'CLOSE ENOUGH.' },
            { who: 'YUKI', voice: 'driver', at: 'YUKI', text: 'ONE BAG? ONLY ONE BAG?' },
            { who: 'YOU', voice: 'you', at: 'you', text: 'AND THE GUITAR.' },
            { who: 'YUKI', voice: 'driver', at: 'YUKI', text: 'GOOD. BOOT IS SMALL.',
              choices: [
                { label: 'GET IN', note: 'NINETY MINUTES TO THE CITY', next: 'go' },
                { label: 'ONE MINUTE', note: 'LOOK BACK AT THE TERMINAL', next: 'wait' },
              ] },
            { id: 'wait', who: '', voice: false, think: true, at: 'you', text: 'THE BUILDING IS ALREADY BEHIND YOU AND IT IS ENORMOUS.' },
            { who: 'YUKI', voice: 'driver', at: 'YUKI', text: 'IT IS COLD. IN, IN.', next: 'go' },
            { id: 'go', who: 'YUKI', voice: 'driver', at: 'YUKI', text: 'SEAT BELT. EXPRESSWAY IS BUSY AT FIVE.' },
          ], function () {
            S.locked = 0;
            Audio.ui('select');
            if (typeof setChapter === 'function') setChapter('uber');
            S.leave(function () {
              if (typeof UberScene !== 'undefined') return new UberScene();
              if (typeof gameHub === 'function') return gameHub();
              return new CityScene();
            }, 'fade', { dur: 1 });
          });
          return;
        }
      }
    },
  };
}
class NaritaKerbScene extends SideScene {
  constructor(opts) { super(nrtKerbDef(), opts || {}); }
}
