// ---------- Going inside, and actually buying something ----------
// Every shop on the concourse has a door, and until now the door was a
// painted rectangle. This is what is behind it. One small room, one floor,
// the camera pulled in a little closer than the terminal, and a shelf you can
// stand in front of and take a thing off.
//
// The point of the room is the transaction. You pick things up, you carry
// them to the till in a basket, somebody scans them one at a time and the
// numbers go up, you pay, and a receipt comes out of a slot. Nothing here is
// a menu. A konbini is not a menu. It is a very bright room at four in the
// morning with a wall of cold drinks in it and one person behind a counter
// who has said the same six words nine hundred times today and will say them
// again for you, properly, because that is the job.
//
// The interior is drawn per `kind` off the SHOPS catalogue, so a coffee place
// gets an espresso machine and a convenience store gets a hot case, and the
// shelves are stocked from SHOP_STOCK rather than from anything invented in
// here. If the catalogue is missing the room still opens; it is just emptier,
// which is honest.
'use strict';

// ---------- what a thing on a shelf looks like ----------
// The catalogue only knows an item's name, its price and a rough icon key.
// This turns that into a shape. The name is trusted first, because a product
// called MELON BREAD should be drawn as melon bread and not as generic food,
// and the whole room lives or dies on whether the shelf reads as a shelf of
// real objects at twenty pixels tall.
function shopinShapeFor(it) {
  const n = String((it && it.name) || '').toUpperCase();
  const has = function (w) { return n.indexOf(w) >= 0; };
  if (has('ONIGIRI') || has('RICE BALL')) return 'onigiri';
  if (has('NOODLE CUP') || has('INSTANT NOODLE')) return 'noodlecup';
  if (has('RAMEN') || has('SOBA') || has('UDON')) return 'ramen';
  if (has('SOUP')) return 'soup';
  if (has('BEEF BOWL') || has('SET WITH')) return 'bowl';
  if (has('SANDWICH') || has('SANDO')) return 'sandwich';
  if (has('MELON BREAD')) return 'melonbread';
  if (has('CROISSANT') || has('SCONE') || has('MUFFIN') || has('TOAST') || has('CURRY BREAD') || has('BEAN BUN') || has('MILANO')) return 'bread';
  if (has('PORK BUN') || has('GYOZA')) return 'bun';
  if (has('PRETZEL')) return 'pretzel';
  if (has('BURGER') || has('MONARCH') || has('ROYALE')) return 'burger';
  if (has('FRIES') || has('ONION RING')) return 'fries';
  if (has('KARAAGE') || has('FRIED CHICKEN')) return 'chicken';
  if (has('SKEWER') || has('YAKITORI')) return 'skewer';
  if (has('ODEN')) return 'oden';
  if (has('PUDDING')) return 'pudding';
  if (has('DONUT') || has('CHEWY RING')) return 'donut';
  if (has('ICE CREAM')) return 'icecream';
  if (has('CHIPS')) return 'crisps';
  if (has('CHOCOLATE')) return 'chocolate';
  if (has('NIGIRI') || has('SALMON,') || has('TUNA,') || has('PRAWN,') || has('FATTY TUNA')) return 'sushi';
  if (has('RAW EGG')) return 'egg';
  if (has('PICKLE')) return 'pickles';
  if (has('CANNED COFFEE') || has('CAN COFFEE') || has('BEER')) return 'can';
  if (has('ENERGY DRINK') || has('VITAMIN DRINK') || has('ROYAL JELLY')) return 'energy';
  if (has('TEA')) return 'tea';
  if (has('COFFEE') || has('LATTE') || has('FROTH') || has('BLEND')) return 'cup';
  if (has('WHISKY')) return 'whisky';
  if (has('SHAKE') || has('COLA') || has('LEMONADE') || has('WATER')) return 'bottle';
  if (has('UMBRELLA')) return 'umbrella';
  if (has('CHARGER') || has('BATTERY') || has('POCKET BATTERY')) return 'charger';
  if (has('BATTERIES')) return 'batteries';
  if (has('PLASTER')) return 'plasters';
  if (has('TOOTHBRUSH')) return 'toothbrush';
  if (has('SOCKS')) return 'socks';
  if (has('WIPES')) return 'wipes';
  if (has('TOWEL')) return 'towel';
  if (has('MASK')) return 'mask';
  if (has('CREAM') || has('SPRAY') || has('DROPS')) return 'cream';
  if (has('PAINKILLER') || has('LOZENGE') || has('SLEEP AID') || has('PATCH')) return 'pill';
  if (has('T-SHIRT') || has('THERMAL') || has('VEST')) return 'shirt';
  if (has('CAP')) return 'cap';
  if (has('PILLOW')) return 'pillow';
  if (has('NOTEBOOK') || has('MANGA') || has('PHRASEBOOK') || has('ATLAS') || has('STAVE')) return 'book';
  if (has('MONTHLY') || has('MAGAZINE')) return 'magazine';
  if (has('PEN') || has('MARKER') || has('PICKS')) return 'pen';
  if (has('EARPHONE')) return 'earphones';
  if (has('TUNER')) return 'tuner';
  if (has('CABLE') || has('STRINGS') || has('STRAP')) return 'cable';
  if (has('CARD')) return 'card';
  if (has('CHANGE ')) return 'note';
  if (has('AIRCRAFT')) return 'plane';
  if (has('BANANT') || has('CAKE')) return 'cake';
  if (has('FLOWER')) return 'flower';
  if (has('BAG') || has('DUFFEL') || has('CUBES')) return 'bag';
  if (has('AROMA') || has('STICKS')) return 'incense';
  if (has('EAR PLUG')) return 'earplugs';
  if (has('WHEEL')) return 'wheel';
  if (has('NAME TAG')) return 'tag';
  if (has('STAND')) return 'stand';
  switch (it && it.icon) {
    case 'coffee': return 'cup';
    case 'bottle': return 'bottle';
    case 'noodles': return 'ramen';
    case 'dumpling': return 'onigiri';
    case 'bread': return 'bread';
    case 'dango': return 'pudding';
    case 'burrito': return 'burger';
    case 'book': return 'book';
    case 'pill': return 'pill';
    case 'cape': return 'shirt';
    case 'boots': return 'socks';
    case 'bag': return 'bag';
    case 'money': return 'note';
    case 'ticket': return 'card';
    case 'strings': return 'cable';
    case 'headphones': return 'earphones';
    case 'metronome': return 'tuner';
    case 'amp': return 'charger';
    case 'net': return 'umbrella';
    case 'permit': return 'plasters';
    case 'key': return 'toothbrush';
    case 'funko': return 'plane';
    case 'poster': return 'magazine';
    case 'lantern': return 'incense';
    case 'pick': return 'pen';
  }
  if (it && it.kind === 'drink') return 'bottle';
  if (it && it.kind === 'food') return 'bread';
  return 'box';
}

// ---------- the product itself ----------
// Drawn on a grid running -10..+10 in both directions, centred on x,y, so the
// same routine paints a 20px thumbnail on a shelf row and an 84px hero in the
// product panel without a second set of numbers. `s` is half the box.
// Everything gets a body, a lit top edge and a shadowed bottom edge, because
// at twenty pixels the only thing that reads is which way the light is coming
// from.
function drawShopItem(ctx, x, y, s, item) {
  const shape = shopinShapeFor(item);
  const q = s / 10, big = s >= 20;
  const R = function (ax, ay, aw, ah, c) { rect(ctx, x + ax * q, y + ay * q, Math.max(1, aw * q), Math.max(1, ah * q), c); };
  const E = function (ax, ay, rx, ry, c) { ellipsePx(ctx, x + ax * q, y + ay * q, Math.max(1, rx * q), Math.max(1, ry * q), c); };
  const K = function (ax, ay, sz, c, kind) { if (big && typeof drawKanaBlock === 'function') drawKanaBlock(ctx, x + ax * q, y + ay * q, sz * q, c, kind); };
  const name = String((item && item.name) || '').toUpperCase();
  switch (shape) {
    case 'onigiri': {
      // a triangle of rice with a nori belt, and whatever is in the middle
      // showing at the top corner where the wrapper is folded
      for (let i = 0; i < 15; i++) { const w = 1.4 + i * 0.94; R(-w / 2, -9 + i, w, 1.04, i < 3 ? '#ffffff' : '#f2efe2'); }
      R(-7.4, 1.4, 14.8, 5.4, '#233023'); R(-7.4, 1.4, 14.8, 0.9, '#3e5641'); R(-7.4, 6.2, 14.8, 0.7, '#141b14');
      E(0, -4.6, 1.8, 1.5, name.indexOf('PLUM') >= 0 ? '#b8323c' : name.indexOf('TUNA') >= 0 ? '#d8b07c' : '#e8804a');
      K(-1.6, 2.6, 3.4, '#cfd6c8', 2);
      break;
    }
    case 'sandwich': {
      // two wedges in the clear plastic box, filling showing on the cut face
      R(-9, -8, 18, 16, '#dbe4e8'); R(-9, -8, 18, 1, '#f2f8fa'); R(-9, 7, 18, 1, '#9fb0b8');
      const wedge = function (ox, oy, fill) {
        for (let i = 0; i < 12; i++) { const w = 12.4 - i * 0.98; R(ox, oy + i, w, 1.04, i === 0 ? '#fff6e2' : '#f4ecd6'); }
        R(ox, oy + 4, 8.4, 2.2, fill); R(ox, oy + 4, 8.4, 0.7, lighten(fill, 0.25));
        R(ox, oy, 12.4, 0.8, '#d8c8a2');
      };
      const f = name.indexOf('EGG') >= 0 ? '#f2c94c' : name.indexOf('HAM') >= 0 ? '#e08a90' : '#c8d88a';
      wedge(-8, -6.6, f); wedge(-1.4, -4.4, f);
      ctx.globalAlpha = 0.18; R(-9, -8, 18, 16, '#ffffff'); ctx.globalAlpha = 1;
      break;
    }
    case 'noodlecup': {
      for (let i = 0; i < 16; i++) { const w = 15.4 - i * 0.44; R(-w / 2, -7 + i, w, 1.04, i > 12 ? '#ded8ca' : '#f2eee4'); }
      R(-7.6, -2.4, 15.2, 5.4, '#c8402c'); R(-7.6, -2.4, 15.2, 0.8, '#e8604a'); R(-7.6, 2.4, 15.2, 0.7, '#7a1d12');
      R(-8.4, -9.2, 16.8, 2.4, '#cfd6de'); R(-8.4, -9.2, 16.8, 0.8, '#eef3f8');
      R(5.2, -9.4, 2.6, 1.2, '#8a8f98');
      K(-5.4, -1.4, 3.6, '#f6f0e0', 1); K(-0.6, -1.4, 3.6, '#f6f0e0', 4); K(4.2, -1.4, 3.6, '#f6f0e0', 0);
      break;
    }
    case 'can': case 'energy': {
      const slim = shape === 'energy';
      const w = slim ? 9.4 : 11.4, c1 = slim ? '#2a2c34' : '#8a2a1c', c2 = slim ? '#f2c94c' : '#e8d2a8';
      E(0, -8.6, w / 2, 1.5, '#b9bec6');
      R(-w / 2, -8.6, w, 17.2, c1);
      R(-w / 2, -8.6, 1.6, 17.2, lighten(c1, 0.3));
      R(w / 2 - 1.6, -8.6, 1.6, 17.2, darken(c1, 0.35));
      R(-w / 2, -3.4, w, 6.4, c2); R(-w / 2, -3.4, w, 0.8, lighten(c2, 0.3));
      if (slim) { ctx.fillStyle = '#2a2c34'; ctx.beginPath(); ctx.moveTo(x + 1.2 * q, y - 2.4 * q); ctx.lineTo(x - 2 * q, y + 0.6 * q); ctx.lineTo(x - 0.2 * q, y + 0.6 * q); ctx.lineTo(x - 1.6 * q, y + 2.8 * q); ctx.lineTo(x + 2.2 * q, y - 0.6 * q); ctx.lineTo(x + 0.4 * q, y - 0.6 * q); ctx.fill(); }
      else K(-2.2, -2.4, 4.4, '#5a1a10', 3);
      E(0, 8.6, w / 2, 1.4, darken(c1, 0.4));
      E(0, -8.8, w / 2 - 1.4, 1.1, '#e2e8ee'); R(-1.6, -9.4, 3.2, 1.1, '#9aa2aa');
      break;
    }
    case 'bottle': case 'tea': {
      const c = shape === 'tea' ? '#3f7a3a' : (name.indexOf('COLA') >= 0 ? '#2a1a14' : name.indexOf('SHAKE') >= 0 ? '#6a4432' : '#bfe0ee');
      R(-2.4, -10, 4.8, 2.4, shape === 'tea' ? '#2a5a28' : '#d8503a');
      R(-2.4, -9.9, 4.8, 0.7, '#ffffff');
      R(-2, -7.8, 4, 2.2, '#dfe6ea');
      for (let i = 0; i < 13; i++) { const w = i < 2 ? 5 + i * 2.4 : 9.4; R(-w / 2, -6 + i, w, 1.04, c); }
      R(-4.7, -4, 1.4, 12, lighten(c, 0.35));
      R(3.3, -4, 1.4, 12, darken(c, 0.3));
      R(-4.7, -1.6, 9.4, 7.2, shape === 'tea' ? '#f0ead8' : '#f4f1ea');
      R(-4.7, -1.6, 9.4, 0.8, '#ffffff'); R(-4.7, 5, 9.4, 0.7, '#c8c2b4');
      if (shape === 'tea') { E(0, 1.8, 2.2, 2.6, '#3f7a3a'); R(-0.4, -0.6, 0.8, 4.8, '#2a5a28'); } else K(-2.2, 0.4, 4.4, '#3a4450', 5);
      R(-4.7, 6.6, 9.4, 1, darken(c, 0.4));
      break;
    }
    case 'cup': {
      // a paper cup: tapered, lid on, sleeve round the middle
      for (let i = 0; i < 15; i++) { const w = 12.6 - i * 0.36; R(-w / 2, -6 + i, w, 1.04, '#f4f1ea'); }
      R(-6.6, -1.8, 13.2, 6, '#8a6a44'); R(-6.6, -1.8, 13.2, 0.8, '#a88a5e'); R(-6.6, 3.4, 13.2, 0.8, '#5a4028');
      R(-7.6, -8.4, 15.2, 2.6, '#3a3f46'); R(-7.6, -8.4, 15.2, 0.8, '#5c626c');
      R(-7.2, -6, 14.4, 0.9, '#cfc8ba');
      R(1.4, -9.6, 3.2, 1.4, '#3a3f46');
      E(0, 0.6, 2.6, 2.6, '#f4f1ea'); E(0, 0.6, 2, 2, '#0b6b4a');
      R(-6.2, 5.4, 12.4, 1, '#ddd6c6');
      break;
    }
    case 'pudding': {
      for (let i = 0; i < 12; i++) { const w = 6 + i * 0.72; R(-w / 2, -5 + i, w, 1.04, '#f2d47a'); }
      for (let i = 0; i < 4; i++) { const w = 6 + i * 0.5; R(-w / 2, -5 + i, w, 1.04, '#8a5a24'); }
      R(-3.6, -6.2, 7.2, 1.4, '#a8702e');
      R(-7.4, 6.6, 14.8, 1.6, '#e8d8a2');
      ctx.globalAlpha = 0.25; R(-3, -4, 1.6, 10, '#ffffff'); ctx.globalAlpha = 1;
      R(-7.6, 8, 15.2, 1, '#c8b884');
      break;
    }
    case 'melonbread': {
      // a dome of cookie crust over soft bread. No melon anywhere in it.
      E(0, 0.4, 8.6, 5.8, '#d8a44a');
      E(0, -0.4, 8.2, 5.2, '#e8bb63');
      E(0, -1.2, 7.2, 4.2, '#f2cd7e');
      // the crackle: every line cut to the dome rather than laid over it
      for (let i = -2; i <= 2; i++) {
        const ay = 0.4 + i * 2.1;
        const ky = 1 - ((ay - 0.4) * (ay - 0.4)) / (5.8 * 5.8);
        if (ky > 0.02) { const hw = 8.6 * Math.sqrt(ky); R(-hw, ay, hw * 2, 0.8, '#c08a34'); }
        const ax = i * 3.1;
        const kx = 1 - (ax * ax) / (8.6 * 8.6);
        if (kx > 0.02) { const hh = 5.8 * Math.sqrt(kx); R(ax, 0.4 - hh, 0.8, hh * 2, '#c08a34'); }
      }
      R(-8.6, 6, 17.2, 1.4, '#a8702a');
      R(-8.6, 6, 17.2, 0.6, '#c08a34');
      break;
    }
    case 'bread': {
      // a crescent, built out of four fat overlapping lumps
      for (let i = 0; i < 5; i++) { const k = (i - 2) / 2; E(k * 5.4, Math.abs(k) * 3 - 1, 3.4 - Math.abs(k) * 0.9, 3.8 - Math.abs(k) * 1.3, '#d99f4e'); }
      for (let i = 0; i < 5; i++) { const k = (i - 2) / 2; E(k * 5.4, Math.abs(k) * 3 - 2, 2.8 - Math.abs(k) * 0.8, 2.8 - Math.abs(k) * 1, '#f0bd6e'); }
      R(-9, 5.6, 18, 1.2, '#a8702a');
      break;
    }
    case 'bun': {
      E(0, 0.4, 7.4, 6.2, '#f2ece0'); E(0, -0.8, 6.8, 5.2, '#fbf6ec');
      for (let i = 0; i < 5; i++) { const a = -1.9 + i * 0.95; R(Math.cos(a) * 4.4, -6 + Math.sin(a) * 1.2, 0.9, 3.4, '#d8cfbe'); }
      E(0, -5.4, 1.8, 1.2, '#c8bda8');
      R(-8, 6.4, 16, 1.2, '#b8ad98');
      break;
    }
    case 'pretzel': {
      const c = '#a8662a', hi = '#c8873e';
      ellipseRingPx(ctx, x - 3.6 * q, y + 1.4 * q, 4.4 * q, 4.4 * q, c);
      ellipseRingPx(ctx, x - 3.6 * q, y + 1.4 * q, 3.6 * q, 3.6 * q, c);
      ellipseRingPx(ctx, x + 3.6 * q, y + 1.4 * q, 4.4 * q, 4.4 * q, c);
      ellipseRingPx(ctx, x + 3.6 * q, y + 1.4 * q, 3.6 * q, 3.6 * q, c);
      R(-1.8, -7.6, 1.8, 6.6, c); R(0.2, -7.6, 1.8, 6.6, c);
      R(-1.8, -7.6, 3.8, 1, hi);
      for (let i = 0; i < 9; i++) R(-7 + i * 1.7, -2 + ((i * 5) % 7), 0.9, 0.9, '#f4f1ea');
      break;
    }
    case 'burger': {
      E(0, -4.4, 7.6, 3.6, '#d9a24e'); E(0, -5.4, 7, 2.8, '#eebb6e');
      for (let i = 0; i < 6; i++) R(-5 + i * 2, -6.6 + ((i * 3) % 3) * 0.6, 1.1, 0.8, '#f8ecd2');
      R(-7.8, -1.2, 15.6, 1.6, '#f2c94c');
      R(-8.2, 0.2, 16.4, 2.2, '#7ab04a'); R(-8.2, 0.2, 16.4, 0.7, '#9cd06a');
      R(-7.6, 2.2, 15.2, 2.8, '#6a3c22'); R(-7.6, 2.2, 15.2, 0.8, '#8a5232');
      E(0, 6.2, 7.4, 2.6, '#d9a24e'); R(-7.4, 4.8, 14.8, 1.6, '#e8b264');
      R(-8, 8.2, 16, 1, '#a8702a');
      break;
    }
    case 'fries': {
      for (let i = 0; i < 7; i++) { const fx = -5.4 + i * 1.8, h = 6 + ((i * 5) % 4) * 1.4; R(fx, -8.4, 1.4, h, '#f2c94c'); R(fx, -8.4, 1.4, 0.8, '#fbe088'); }
      ctx.fillStyle = '#c8402c'; ctx.beginPath();
      ctx.moveTo(x - 7 * q, y - 3.4 * q); ctx.lineTo(x + 7 * q, y - 3.4 * q); ctx.lineTo(x + 5 * q, y + 8.4 * q); ctx.lineTo(x - 5 * q, y + 8.4 * q); ctx.fill();
      R(-7, -3.4, 14, 1, '#e8604a');
      R(-4.4, 0.4, 8.8, 3.4, '#f2c94c'); R(-4.4, 0.4, 8.8, 0.8, '#fbe088');
      R(-5, 7.4, 10, 1, '#8a1d12');
      break;
    }
    case 'chicken': {
      R(-7, -3, 14, 11, '#e8dcc0'); R(-7, -3, 14, 1, '#f8eeda'); R(-7, 7, 14, 1, '#c8bba0');
      for (let i = 0; i < 5; i++) { const cx2 = -4.6 + (i % 3) * 4.6, cy2 = -4.8 + Math.floor(i / 3) * 3.4; E(cx2, cy2, 2.6, 2.1, '#c8853a'); E(cx2, cy2 - 0.7, 2, 1.4, '#e0a552'); }
      R(-4.6, 0.6, 9.2, 0.9, '#c8bba0');
      break;
    }
    case 'skewer': {
      R(-0.7, -9.6, 1.4, 19.2, '#c8ac7a'); R(-0.7, -9.6, 1.4, 0.8, '#e2ca9c');
      for (let i = 0; i < 3; i++) { const cy2 = -5 + i * 4.4; E(0, cy2, 3.8, 2.4, '#b06a34'); E(0, cy2 - 0.8, 3.2, 1.5, '#d08a4a'); R(-3.8, cy2 + 1.6, 7.6, 0.8, '#7a4420'); }
      break;
    }
    case 'oden': {
      for (let i = 0; i < 12; i++) { const w = 14.6 - i * 0.24; R(-w / 2, -3 + i, w, 1.04, i > 9 ? '#bfc6cc' : '#dfe6ea'); }
      R(-7.4, -3.6, 14.8, 1.6, '#c9a25a');
      E(-3.4, -2.2, 2.6, 1.6, '#f0e2c0'); R(1, -4, 3.4, 3.4, '#e8dcc0');
      R(4.2, -9, 0.9, 7, '#c8ac7a'); E(4.6, -5.4, 1.8, 1.8, '#d8b06a');
      R(-7.6, 8.4, 15.2, 1.2, '#8a9198');
      break;
    }
    case 'ramen': case 'soup': case 'bowl': {
      const deep = shape !== 'soup';
      const c = shape === 'bowl' ? '#3a2a20' : '#c8402c';
      for (let i = 0; i < (deep ? 11 : 8); i++) { const w = 17 - i * 1.3; R(-w / 2, -2 + i, w, 1.04, i === 0 ? lighten(c, 0.25) : c); }
      R(-8.6, -3, 17.2, 1.4, lighten(c, 0.35));
      if (shape === 'bowl') { for (let i = 0; i < 9; i++) R(-6.4 + (i % 5) * 2.8, -2.4 + Math.floor(i / 5) * 1.6, 2.4, 1.4, '#f4f1ea'); R(-5.4, -3.4, 10.8, 1.6, '#8a5230'); }
      else {
        for (let i = 0; i < 6; i++) R(-6 + i * 2.2, -3.2, 1.4, 2.2, '#f2dfa8');
        E(3.4, -2.6, 2.2, 1.8, '#f4f1ea'); E(3.4, -2.6, 1.2, 1, '#f2a03a');
        R(-6.6, -5.8, 3.4, 3.6, '#223028'); R(-6.6, -5.8, 3.4, 0.8, '#3a5240');
      }
      R(-9, 8.6, 18, 1.2, darken(c, 0.4));
      break;
    }
    case 'sushi': {
      const fish = name.indexOf('TUNA') >= 0 ? '#c8402c' : name.indexOf('PRAWN') >= 0 ? '#f0a88a' : '#f0904a';
      for (let k = 0; k < 2; k++) {
        const ox = -4.4 + k * 8.8, oy = k * 1.2;
        R(ox - 3.6, oy - 0.4, 7.2, 5.4, '#f6f2e8'); R(ox - 3.6, oy - 0.4, 7.2, 0.8, '#ffffff'); R(ox - 3.6, oy + 4.2, 7.2, 0.8, '#d8d2c2');
        E(ox, oy - 1.6, 4, 2.2, fish); E(ox, oy - 2.2, 3.4, 1.2, lighten(fish, 0.28));
        R(ox - 4, oy - 1.4, 8, 0.6, darken(fish, 0.3));
      }
      break;
    }
    case 'egg': { E(0, 0.6, 5.4, 6.8, '#f6eedc'); E(-1.4, -2.6, 2.6, 2.8, '#fdfaf2'); R(-5.6, 7, 11.2, 1, '#cfc4ac'); break; }
    case 'pickles': { for (let i = 0; i < 7; i++) { const a = i * 0.9; R(Math.cos(a) * 4.4 - 1.4, Math.sin(a) * 3 - 1.4, 3, 2.4, i % 2 ? '#d8303a' : '#e8505a'); } R(-8, 5.4, 16, 1.2, '#a01820'); break; }
    case 'icecream': {
      R(-0.9, 0.4, 1.8, 9.6, '#c8ac7a');
      R(-4.4, -9, 8.8, 10.4, '#f2ece0'); R(-4.4, -9, 8.8, 1, '#ffffff');
      R(-4.4, -9, 8.8, 4.4, '#5a3a24'); R(-4.4, -9, 8.8, 0.9, '#7a5234');
      for (let i = 0; i < 4; i++) R(-4.4 + i * 2.4, -4.6, 1.6, 1.6, '#5a3a24');
      break;
    }
    case 'donut': {
      ellipseRingPx(ctx, x, y + 0.6 * q, 8 * q, 6.4 * q, '#c8873e');
      ellipseRingPx(ctx, x, y + 0.6 * q, 7 * q, 5.6 * q, '#c8873e');
      ellipseRingPx(ctx, x, y + 0.6 * q, 6 * q, 4.8 * q, '#d89a52');
      ellipseRingPx(ctx, x, y - 1 * q, 7.4 * q, 5.4 * q, '#e8dcc0');
      ellipseRingPx(ctx, x, y - 1 * q, 6.6 * q, 4.8 * q, '#e8dcc0');
      for (let i = 0; i < 8; i++) { const a = i * 0.79; R(Math.cos(a) * 6.6 - 0.6, Math.sin(a) * 4.6 - 2.2, 1.4, 0.9, ['#e8503a', '#f2c94c', '#6be585', '#8ad8ff'][i % 4]); }
      break;
    }
    case 'chocolate': {
      R(-7.6, -6.4, 15.2, 13.6, '#4a2a18'); R(-7.6, -6.4, 15.2, 1, '#6a3f24');
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 3; c2++) { R(-6.6 + c2 * 4.6, -5.4 + r2 * 4.4, 3.8, 3.6, '#5c3520'); R(-6.6 + c2 * 4.6, -5.4 + r2 * 4.4, 3.8, 0.8, '#7a4a2c'); }
      R(-8.4, -3.4, 5.4, 10.6, '#8a2a3a'); R(-8.4, -3.4, 5.4, 1, '#b04050');
      R(-8.4, 7.2, 16.8, 1, '#2a160c');
      break;
    }
    case 'crisps': {
      ctx.fillStyle = '#c8873e'; ctx.beginPath();
      ctx.moveTo(x - 7 * q, y - 8 * q); ctx.lineTo(x + 7 * q, y - 8 * q); ctx.lineTo(x + 5.4 * q, y + 8.4 * q); ctx.lineTo(x - 5.4 * q, y + 8.4 * q); ctx.fill();
      R(-7, -8, 14, 1.6, '#e0a552'); R(-5.4, 7.4, 10.8, 1, '#8a5a24');
      R(-4.4, -3.4, 8.8, 5.4, '#f4f1ea'); K(-2.2, -2.6, 4.4, '#8a5a24', 4);
      break;
    }
    case 'umbrella': {
      R(-0.7, -5, 1.4, 13.6, '#3a3440');
      ctx.fillStyle = '#cfe4ee'; ctx.beginPath();
      ctx.moveTo(x - 8 * q, y - 4.4 * q); ctx.lineTo(x, y - 9.6 * q); ctx.lineTo(x + 8 * q, y - 4.4 * q); ctx.fill();
      for (let i = -2; i <= 2; i++) R(i * 3.2, -8.4, 0.7, 4.4, '#a0bcc8');
      R(-8, -4.4, 16, 1, '#8fb0c0');
      R(-0.7, -10.2, 1.4, 1.6, '#8a8f98');
      R(-2.6, 7.8, 2.6, 1.4, '#3a3440'); R(-2.6, 6.6, 1.2, 1.4, '#3a3440');
      break;
    }
    case 'charger': {
      R(-7.4, -8.6, 14.8, 17.2, '#cfe0ea'); ctx.globalAlpha = 0.5; R(-6.4, -7.6, 12.8, 15.2, '#ffffff'); ctx.globalAlpha = 1;
      R(-7.4, -8.6, 14.8, 2.6, '#f4f1ea'); R(-7.4, -8.6, 14.8, 0.8, '#ffffff');
      R(-4.4, -4.4, 4.4, 4.4, '#f4f1ea'); R(-4.4, -4.4, 4.4, 0.8, '#ffffff'); R(-3.4, -3.4, 2.4, 2.4, '#3a3f46');
      for (let i = 0; i < 12; i++) { const a = i * 0.52; R(1.4 + Math.cos(a) * 3.4, 2 + Math.sin(a) * 3.4, 1.2, 1.2, '#f4f1ea'); }
      R(-7.4, 7.6, 14.8, 1, '#9fb0b8');
      break;
    }
    case 'batteries': {
      for (let i = 0; i < 4; i++) { const bx = -6.6 + i * 3.6; R(bx, -7, 2.8, 14, '#2a2c34'); R(bx, -7, 2.8, 4.4, '#c8a03a'); R(bx, -7, 0.9, 14, '#4a4c56'); R(bx + 0.8, -8.4, 1.2, 1.6, '#b9bec6'); }
      ctx.globalAlpha = 0.28; R(-8, -9, 16, 18, '#bfe0ee'); ctx.globalAlpha = 1;
      frame(ctx, x - 8 * q, y - 9 * q, 16 * q, 18 * q, '#8fa8b4');
      break;
    }
    case 'plasters': {
      R(-8, -5.4, 16, 11.4, '#f0ece2'); R(-8, -5.4, 16, 1, '#ffffff'); R(-8, 5, 16, 1, '#cfc8ba');
      R(-8, -5.4, 16, 3.4, '#2f7a4a'); R(-8, -5.4, 16, 0.8, '#4c9c66');
      R(-1, -4.6, 2, 2, '#f4f1ea'); R(-2.5, -3.1, 5, 2, '#f4f1ea');
      for (let i = 0; i < 3; i++) { R(-6 + i * 4.4, -0.6, 3.4, 4.4, '#e0bb8a'); R(-5.4 + i * 4.4, 0.6, 2.2, 2, '#f4ece0'); }
      break;
    }
    case 'toothbrush': {
      R(-8.4, 1.4, 12.4, 2.2, '#f4f1ea'); R(-8.4, 1.4, 12.4, 0.7, '#ffffff');
      R(2.4, 0.4, 5.4, 3.4, '#4a86f7'); R(2.4, 0.4, 5.4, 0.9, '#7fa8ff');
      for (let i = 0; i < 6; i++) R(3 + i * 0.8, -1.4, 0.6, 2, '#e8eef4');
      R(-8.4, -7.4, 15.4, 5.4, '#f0ece2'); R(-8.4, -7.4, 15.4, 1, '#ffffff');
      R(-8.4, -6.2, 15.4, 2, '#2f8f4a'); R(6, -6.8, 2.2, 4.4, '#cfc8ba');
      break;
    }
    case 'socks': {
      for (let k = 0; k < 2; k++) { const oy = -4 + k * 6.4; R(-7.4, oy, 14.8, 5.4, k ? '#2a2c34' : '#3a3f46'); R(-7.4, oy, 14.8, 0.9, '#4e545e'); R(-7.4, oy + 4.6, 14.8, 0.8, '#15171c'); }
      R(-2.4, -5.4, 5.4, 13.4, '#f2c94c'); R(-2.4, -5.4, 5.4, 0.9, '#fbe088');
      K(-1.8, -1, 3.6, '#7a5a10', 0);
      break;
    }
    case 'wipes': {
      R(-8, -5, 16, 10.4, '#8ad8ff'); R(-8, -5, 16, 1, '#c2eaff'); R(-8, 4.4, 16, 1, '#4a86a8');
      R(-3.4, -6.4, 7.4, 2.4, '#f4f1ea'); R(-3.4, -6.4, 7.4, 0.8, '#ffffff');
      R(-6.4, -2.4, 6.4, 4.4, '#f4f1ea'); K(-5.4, -1.6, 3.4, '#2f6a8a', 3);
      break;
    }
    case 'towel': {
      for (let i = 0; i < 4; i++) { const oy = -6 + i * 3.4; R(-8, oy, 16, 3, i % 2 ? '#dfe6ea' : '#eef3f6'); R(-8, oy, 16, 0.7, '#ffffff'); }
      R(-8, -6, 0.9, 13.4, '#c0c8cc'); R(-8, 7, 16, 1, '#a8b0b4');
      R(-4.4, -6, 8.8, 0.9, '#4a86f7');
      break;
    }
    case 'mask': {
      for (let i = 0; i < 9; i++) R(-6.4, -4.4 + i, 12.8, 1.04, i % 3 === 1 ? '#e6ecf0' : '#f4f8fa');
      R(-6.4, -4.4, 12.8, 1, '#ffffff'); R(-6.4, 4.2, 12.8, 1, '#c8d0d4');
      R(-9.4, -3.4, 3, 0.8, '#dfe6ea'); R(6.4, -3.4, 3, 0.8, '#dfe6ea');
      break;
    }
    case 'cream': {
      R(-3.4, -4, 6.8, 12.4, '#f0ece2'); R(-3.4, -4, 2, 12.4, '#ffffff'); R(1.4, -4, 2, 12.4, '#d8d2c2');
      R(-3.4, -4, 6.8, 3.4, '#e05a8a'); R(-2.4, -7.4, 4.8, 3.4, '#c8c2b4'); R(-2.4, -7.4, 4.8, 0.8, '#e2ddd0');
      R(-3.4, 7.4, 6.8, 1, '#b8b2a4');
      break;
    }
    case 'pill': {
      R(-7.4, -5.4, 14.8, 10.8, '#dfe6ea'); R(-7.4, -5.4, 14.8, 1, '#f4f8fa');
      for (let i = 0; i < 6; i++) { const cx2 = -5.2 + (i % 3) * 5.2, cy2 = -2.6 + Math.floor(i / 3) * 5; E(cx2, cy2, 2, 1.6, '#f4f1ea'); E(cx2, cy2 - 0.5, 1.6, 1, '#ffffff'); }
      R(-7.4, 4.4, 14.8, 1, '#a8b4ba');
      break;
    }
    case 'shirt': {
      R(-7.4, -4.4, 14.8, 11.4, '#f0ece2'); R(-7.4, -4.4, 14.8, 1, '#ffffff'); R(-7.4, 6, 14.8, 1, '#cfc8ba');
      R(-7.4, -4.4, 4.4, 11.4, '#e4dfd2'); R(3, -4.4, 4.4, 11.4, '#e4dfd2');
      R(-2.4, -5.4, 4.8, 2.4, '#ddd6c6'); R(-2.4, -5.4, 4.8, 0.8, '#f4f1ea');
      R(-7.4, 0.6, 14.8, 0.8, '#d8d2c2');
      break;
    }
    case 'cap': {
      E(0, -0.6, 7, 5, '#2f4a68'); E(0, -1.8, 6.4, 4, '#3f5f84');
      R(-7, -0.6, 14, 2, '#2f4a68');
      R(-1.4, -6.4, 2.8, 1.6, '#5a7aa0');
      ctx.fillStyle = '#24384f'; ctx.beginPath();
      ctx.moveTo(x - 7 * q, y + 1 * q); ctx.lineTo(x + 9.4 * q, y + 1.4 * q); ctx.lineTo(x + 9 * q, y + 3.4 * q); ctx.lineTo(x - 6.4 * q, y + 3 * q); ctx.fill();
      break;
    }
    case 'pillow': {
      E(-3.4, 0, 5, 5.4, '#4a5a7a'); E(3.4, 0, 5, 5.4, '#4a5a7a'); R(-3.4, -5.4, 6.8, 5.4, '#4a5a7a');
      E(-3.4, -1.4, 4.2, 4, '#5f7298'); E(3.4, -1.4, 4.2, 4, '#5f7298');
      R(-8.4, 4, 16.8, 1, '#2f3c52');
      break;
    }
    case 'book': case 'magazine': {
      const mag = shape === 'magazine';
      R(-6.4, -8.4, 12.8, 17, mag ? '#c8402c' : '#3a5a8a');
      R(-6.4, -8.4, 12.8, 1, lighten(mag ? '#c8402c' : '#3a5a8a', 0.3));
      R(-6.4, -8.4, 1.4, 17, darken(mag ? '#c8402c' : '#3a5a8a', 0.35));
      R(5.4, -8.4, 1, 17, '#f0ece2');
      if (mag) { R(-4.4, -6.4, 9.4, 8.4, '#f2c94c'); E(0, -2.2, 3, 3.4, '#e8a66a'); for (let i = 0; i < 3; i++) R(-4.4, 3 + i * 2, 9.4 - i * 2.4, 1.2, '#f4f1ea'); }
      else { for (let i = 0; i < 4; i++) R(-4.4, -5.4 + i * 2, 9 - (i % 2) * 2.4, 1.2, withAlpha('#f4f1ea', 0.75)); K(-2.2, 2, 4.4, '#dfe6ea', 1); }
      break;
    }
    case 'pen': {
      for (let k = 0; k < 3; k++) { const ox = -5 + k * 5; R(ox, -8.4, 2.8, 15.4, ['#2a2c34', '#2f4a8a', '#c8402c'][k]); R(ox, -8.4, 0.9, 15.4, '#6a7079'); R(ox, -8.4, 2.8, 2.4, '#b9bec6'); R(ox + 0.6, 7, 1.6, 2, '#8a8f98'); }
      break;
    }
    case 'earplugs': {
      // foam, orange, and the single cheapest way to survive a dormitory
      for (let k = 0; k < 2; k++) {
        const ox = -4.4 + k * 8.8;
        for (let i = 0; i < 12; i++) { const ww = 5.4 - Math.abs(i - 6) * 0.22; R(ox - ww / 2, -6 + i, ww, 1.04, k ? '#e8742a' : '#f2883a'); }
        R(ox - 2.4, -6, 4.8, 1, '#ffb06a');
        R(ox - 2.4, 5, 4.8, 1, '#b8541c');
      }
      R(-9, 7.4, 18, 1.2, '#8a3a10');
      break;
    }
    case 'wheel': {
      // a caster off the bottom of a suitcase, fitted while you wait
      R(-4.4, -9, 8.8, 4.4, '#8a8f98'); R(-4.4, -9, 8.8, 1, '#c0c8d0');
      R(-1.4, -5, 2.8, 2.4, '#5c626c');
      ellipseRingPx(ctx, x, y + 2.4 * q, 6.4 * q, 6.4 * q, '#2a2c34');
      ellipseRingPx(ctx, x, y + 2.4 * q, 5.6 * q, 5.6 * q, '#2a2c34');
      E(0, 2.4, 4.4, 4.4, '#3a3f46');
      E(-1.2, 1.2, 2.4, 2.4, '#5c626c');
      E(0, 2.4, 1.4, 1.4, '#b9bec6');
      break;
    }
    case 'tag': {
      // a card in a plastic sleeve on a loop, two dollars of certainty
      for (let i = 0; i < 8; i++) { const a = i * 0.8; R(Math.cos(a) * 2.4 - 0.5, -8 + Math.sin(a) * 2, 1, 1, '#8a8f98'); }
      R(-6.4, -5.4, 12.8, 13.4, '#f2c94c'); R(-6.4, -5.4, 12.8, 1, '#fbe088'); R(-6.4, 7, 12.8, 1, '#c8a03a');
      R(-4.6, -3.6, 9.2, 9.6, '#f4f1ea');
      for (let i = 0; i < 3; i++) R(-3.6, -2.4 + i * 3, 7.2 - i * 2, 1.4, '#8a8478');
      R(-1, -6.6, 2, 1.4, '#c8a03a');
      break;
    }
    case 'stand': {
      // folds flat, holds a phone up in a capsule where there is no shelf
      ctx.fillStyle = '#3a3f46'; ctx.beginPath();
      ctx.moveTo(x - 7 * q, y + 8 * q); ctx.lineTo(x + 1 * q, y + 8 * q); ctx.lineTo(x + 6 * q, y - 4 * q); ctx.lineTo(x - 1 * q, y - 4 * q); ctx.fill();
      R(-7, 7.4, 8, 1.4, '#5c626c');
      R(-1.4, -9, 8.8, 13.4, '#1b1b24'); R(-0.4, -8, 6.8, 11.4, '#2f6a8a');
      ctx.globalAlpha = 0.35; R(-0.4, -8, 6.8, 3.4, '#8ad8ff'); ctx.globalAlpha = 1;
      R(-2.4, 3.4, 10.8, 1.4, '#8a8f98');
      break;
    }
    case 'earphones': {
      E(-5, -4.4, 2.4, 2.4, '#f4f1ea'); E(5, -4.4, 2.4, 2.4, '#f4f1ea');
      E(-5, -4.4, 1.4, 1.4, '#cfc8ba'); E(5, -4.4, 1.4, 1.4, '#cfc8ba');
      R(-5.6, -3, 1.2, 4.4, '#f4f1ea'); R(4.4, -3, 1.2, 4.4, '#f4f1ea');
      for (let i = 0; i < 9; i++) { const k = i / 8; R(lerp(-5, 0, k), lerp(1.4, 6.4, k) + Math.sin(k * 3) * 1.4, 1, 1, '#e4dfd2'); R(lerp(5, 0, k), lerp(1.4, 6.4, k) + Math.sin(k * 3) * 1.4, 1, 1, '#e4dfd2'); }
      R(-1, 6.4, 2, 3, '#3a3f46');
      break;
    }
    case 'tuner': {
      R(-5.4, -5.4, 10.8, 8.4, '#2a2c34'); R(-5.4, -5.4, 10.8, 1, '#4a4c56');
      R(-4.2, -4.2, 8.4, 5.4, '#1b2230'); R(-3.6, -3.6, 7.2, 4.2, '#2f6a4a');
      R(-0.4, -3.2, 0.8, 3.4, '#6be585'); R(-3, -2.4, 1.2, 1.2, '#6be585');
      R(-2.4, 3, 4.8, 4.4, '#3a3f46'); R(-4.4, 5.4, 8.8, 2, '#2a2c34');
      break;
    }
    case 'cable': {
      for (let i = 0; i < 16; i++) { const a = i * 0.42; R(Math.cos(a) * (6.4 - i * 0.12) - 0.7, Math.sin(a) * (4.8 - i * 0.1) - 0.7, 1.6, 1.6, i % 2 ? '#2a2c34' : '#3a3f46'); }
      R(-8.4, -1.4, 2.6, 3.4, '#b9bec6'); R(-8.4, -1.4, 2.6, 0.9, '#dfe6ea');
      R(6.4, 1.4, 2.6, 3.4, '#b9bec6');
      break;
    }
    case 'card': {
      R(-8, -5.4, 16, 10.8, '#3f8fd0'); R(-8, -5.4, 16, 1, '#7ab8ee'); R(-8, 4.4, 16, 1, '#2a6a9a');
      E(-4, 0.4, 2.8, 3.4, '#f4f1ea'); E(-4, -0.6, 2, 2, '#2a2c34'); R(-5, 3, 2, 1.4, '#f2a03a');
      for (let i = 0; i < 3; i++) R(0.4, -3 + i * 2.4, 6.4 - i * 1.4, 1.2, withAlpha('#ffffff', 0.7));
      break;
    }
    case 'note': {
      R(-8.4, -4.4, 16.8, 9.4, '#cfe0c8'); R(-8.4, -4.4, 16.8, 1, '#eaf4e4'); R(-8.4, 4, 16.8, 1, '#9ab498');
      frame(ctx, x - 7 * q, y - 3.2 * q, 14 * q, 7 * q, '#6a9a72');
      E(0, 0.2, 2.6, 3, '#9ab498'); E(0, -0.4, 2, 2, '#cfe0c8');
      R(-6.4, -2.4, 2.4, 1.4, '#4a7a52'); R(4, 1.4, 2.4, 1.4, '#4a7a52');
      break;
    }
    case 'whisky': {
      R(-4.4, -6, 8.8, 14.4, '#8a5a24'); R(-4.4, -6, 2, 14.4, '#a87a3c'); R(2.4, -6, 2, 14.4, '#5a3a14');
      R(-2, -9.4, 4, 3.6, '#6a4420'); R(-2.4, -10.4, 4.8, 1.4, '#2a2c34');
      R(-4.4, -1.4, 8.8, 5.4, '#f0ece2'); R(-4.4, -1.4, 8.8, 0.8, '#ffffff');
      R(-3.4, 0, 6.8, 1.2, '#8a6a2a'); R(-3.4, 2, 4.8, 1, '#8a6a2a');
      R(-6.4, -7, 12.8, 16, withAlpha('#ffd24a', 0.12));
      break;
    }
    case 'cake': {
      R(-8.4, -5.4, 16.8, 11.4, '#f2c94c'); R(-8.4, -5.4, 16.8, 1, '#fbe088'); R(-8.4, 5, 16.8, 1, '#c8a03a');
      for (let i = 0; i < 4; i++) { const cx2 = -5.4 + (i % 2) * 6.4, cy2 = -2.6 + Math.floor(i / 2) * 4.6; E(cx2, cy2, 2.8, 2, '#e0a552'); E(cx2, cy2 - 0.6, 2.2, 1.2, '#f2c07a'); R(cx2 - 1, cy2 - 0.4, 0.8, 0.8, '#5a3a20'); R(cx2 + 0.4, cy2 - 0.4, 0.8, 0.8, '#5a3a20'); }
      break;
    }
    case 'flower': {
      R(-0.7, 0, 1.4, 9, '#3f7a3a');
      for (let i = 0; i < 5; i++) { const a = -1.6 + i * 0.78; E(Math.cos(a) * 4.4, Math.sin(a) * 3.4 - 2.4, 2.4, 2.2, ['#e05a8a', '#f2c94c', '#f4f1ea', '#e0708a', '#f2a03a'][i]); }
      ctx.fillStyle = '#e8dcc0'; ctx.beginPath();
      ctx.moveTo(x - 5.4 * q, y + 3 * q); ctx.lineTo(x + 5.4 * q, y + 3 * q); ctx.lineTo(x + 2.4 * q, y + 9.4 * q); ctx.lineTo(x - 2.4 * q, y + 9.4 * q); ctx.fill();
      R(-5.4, 3, 10.8, 1, '#f6f0e0');
      break;
    }
    case 'plane': {
      if (typeof dfMark === 'function' && big) { const m = dfMark(Math.round(s * 1.1)); ctx.drawImage(m, Math.round(x - m.width / 2), Math.round(y - m.height / 2 - s * 0.2)); }
      else { R(-8, -1.4, 16, 2.8, '#12203f'); R(-2.4, -6.4, 4.8, 12.8, '#12203f'); R(-8, -1.4, 16, 0.9, '#e0b23c'); }
      R(-1, 5.4, 2, 3.4, '#8a8f98'); R(-4.4, 8.4, 8.8, 1.6, '#3a3f46');
      break;
    }
    case 'incense': {
      R(-4.4, -2.4, 8.8, 10.4, '#8a6a44'); R(-4.4, -2.4, 8.8, 1, '#a88a5e'); R(-4.4, 7, 8.8, 1, '#5a4028');
      for (let i = 0; i < 4; i++) R(-3 + i * 2, -8.4, 0.8, 6.4, '#5a4028');
      ctx.globalAlpha = 0.4; for (let i = 0; i < 4; i++) E(Math.sin(i) * 2, -9.4 - i * 1.6, 1.6 + i * 0.5, 1 + i * 0.3, '#cfc9e6'); ctx.globalAlpha = 1;
      break;
    }
    case 'bag': {
      R(-7.4, -3.4, 14.8, 11.4, '#8a5a3a'); R(-7.4, -3.4, 14.8, 1, '#aa7a54'); R(-7.4, 7, 14.8, 1, '#5a3a20');
      ellipseRingPx(ctx, x - 3 * q, y - 5.4 * q, 3 * q, 3 * q, '#6a4428');
      ellipseRingPx(ctx, x + 3 * q, y - 5.4 * q, 3 * q, 3 * q, '#6a4428');
      R(-7.4, 0.4, 14.8, 1.2, '#6a4428');
      break;
    }
    default: {
      // a box with the first letter on it, so an unknown product is still a
      // product and not a hole in the shelf
      R(-7, -6.4, 14, 13.4, '#c8a03a'); R(-7, -6.4, 14, 1.2, '#ffd24a'); R(-7, 6, 14, 1, '#8a6a1a');
      R(-5.4, -4.6, 10.8, 9.4, '#f0ece2');
      if (big) drawText(ctx, (name || '?')[0], x, y - 5 * q, '#8a6a1a', { align: 'center', scale: Math.max(2, Math.round(s / 8)) });
      else { R(-3, -2.4, 6, 1.4, '#c8a03a'); R(-3, 0.4, 4, 1.4, '#c8a03a'); }
    }
  }
}

// ---------- the room ----------
// One floor, one ceiling, and about a thousand pixels of wall between them.
// Everything else stands on the floor line and is drawn by the prop painter.
const SHOPIN_FLOOR = 420;
const SHOPIN_CEIL = 130;

// The light in a shop is the whole shop. A konbini is lit like an operating
// theatre and a coffee place is lit like somebody's front room, and you can
// tell which one you are in before you read a single sign.
function shopinCeiling(ctx, S, t) {
  const I = S.SI, x0 = S.cam.wx(-40), x1 = S.cam.wx(W + 40);
  const ceil = SHOPIN_CEIL;
  rect(ctx, x0, ceil - 90, x1 - x0, 92, I.ceilCol);
  rect(ctx, x0, ceil - 4, x1 - x0, 4, darken(I.ceilCol, 0.28));
  // the grid of tiles, then the fittings hung off it
  const step = I.lightStep;
  for (let gx = Math.floor(x0 / 40) * 40; gx < x1; gx += 40) { ctx.globalAlpha = 0.16; rect(ctx, gx, ceil - 90, 1, 88, '#000000'); ctx.globalAlpha = 1; }
  for (let lx = Math.floor(x0 / step) * step; lx < x1 + step; lx += step) {
    const cx = lx + step / 2;
    if (I.lightKind === 'pendant') {
      // a flex and a cone shade, warm, low, one over each table
      rect(ctx, cx - 1, ceil - 6, 2, 22, '#2a2420');
      ctx.fillStyle = I.lightShade; ctx.beginPath();
      ctx.moveTo(cx - 3, ceil + 16); ctx.lineTo(cx + 3, ceil + 16); ctx.lineTo(cx + 13, ceil + 32); ctx.lineTo(cx - 13, ceil + 32); ctx.fill();
      rect(ctx, cx - 13, ceil + 30, 26, 3, darken(I.lightShade, 0.35));
      ellipsePx(ctx, cx, ceil + 34, 9, 3, I.lightCol);
      ctx.globalAlpha = 0.13 + 0.03 * Math.sin(t * 1.4 + cx); ellipsePx(ctx, cx, ceil + 74, 40, 46, I.lightCol); ctx.globalAlpha = 1;
    } else {
      // a recessed fluorescent tray, flat white, with the faint flicker one
      // tube in every shop has and nobody has ever replaced
      const flick = (Math.sin(t * 27 + cx * 0.3) > -0.94 || (cx % 240 !== 0)) ? 1 : 0.55;
      rect(ctx, cx - 34, ceil - 12, 68, 12, '#c8ccd2');
      rect(ctx, cx - 31, ceil - 9, 62, 9, '#eef2f6');
      ctx.globalAlpha = 0.9 * flick; rect(ctx, cx - 29, ceil - 8, 58, 7, I.lightCol); ctx.globalAlpha = 1;
      rect(ctx, cx - 34, ceil - 12, 68, 2, '#e4e8ee');
      ctx.globalAlpha = (0.15 + 0.03 * Math.sin(t * 2 + cx)) * flick;
      ctx.fillStyle = I.lightCol; ctx.beginPath();
      ctx.moveTo(cx - 30, ceil); ctx.lineTo(cx + 30, ceil); ctx.lineTo(cx + 76, SHOPIN_FLOOR); ctx.lineTo(cx - 76, SHOPIN_FLOOR); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.1 * flick; ellipsePx(ctx, cx, SHOPIN_FLOOR + 6, 78, 12, I.lightCol); ctx.globalAlpha = 1;
    }
  }
}

// The wall: whatever the shop has decided it is made of. A tiled dado, a
// painted band in the brand colour, and a skirting, because a room with no
// skirting board reads as a cardboard box.
function shopinWall(ctx, S, t) {
  const I = S.SI, x0 = S.cam.wx(-40), x1 = S.cam.wx(W + 40);
  const ceil = SHOPIN_CEIL, floor = SHOPIN_FLOOR;
  rect(ctx, x0, ceil, x1 - x0, floor - ceil, I.wall);
  ctx.globalAlpha = 0.22; vgrad(ctx, x0, ceil, x1 - x0, floor - ceil, lighten(I.wall, 0.3), darken(I.wall, 0.3)); ctx.globalAlpha = 1;
  if (I.wallTile) {
    for (let gy = ceil + 14; gy < floor - 40; gy += 26) {
      rect(ctx, x0, gy, x1 - x0, 1, darken(I.wall, 0.14));
      for (let gx = Math.floor(x0 / 34) * 34 + ((Math.round(gy / 26) % 2) * 17); gx < x1; gx += 34) rect(ctx, gx, gy - 25, 1, 25, darken(I.wall, 0.1));
    }
  }
  rect(ctx, x0, ceil, x1 - x0, 14, I.band);
  rect(ctx, x0, ceil + 12, x1 - x0, 2, darken(I.band, 0.4));
  rect(ctx, x0, ceil, x1 - x0, 2, lighten(I.band, 0.3));
  rect(ctx, x0, floor - 12, x1 - x0, 12, I.skirt);
  rect(ctx, x0, floor - 12, x1 - x0, 2, lighten(I.skirt, 0.3));
  rect(ctx, x0, floor - 2, x1 - x0, 2, darken(I.skirt, 0.4));
}

// A lit shelf of stock, seen through glass, for the fridge banks and the
// cases. Each can is its own three-tone object, because a wall of drinks is
// the only thing anybody actually remembers about a convenience store.
function shopinStockWall(ctx, x, y, w, h, t, seed, opts) {
  const o = opts || {}, r = makeRng(seed >>> 0);
  const rows = o.rows || 4, pad = o.pad != null ? o.pad : 5;
  const back = o.back || '#eef4f2';
  rect(ctx, x, y, w, h, back);
  ctx.globalAlpha = 0.6; vgrad(ctx, x, y, w, h, '#ffffff', back); ctx.globalAlpha = 1;
  const rh = (h - pad * 2) / rows;
  for (let ri = 0; ri < rows; ri++) {
    const ry = y + pad + ri * rh;
    // the strip light under every shelf, which is what makes the cans glow
    rect(ctx, x + 2, ry + 1, w - 4, 2, '#ffffff');
    ctx.globalAlpha = 0.3; rect(ctx, x + 2, ry + 3, w - 4, 6, '#ffffff'); ctx.globalAlpha = 1;
    const cw = o.cw || 11, n = Math.max(1, Math.floor((w - 12) / (cw + 2)));
    for (let i = 0; i < n; i++) {
      const cx = x + 6 + i * (cw + 2);
      const kind = r.int(0, 3);
      const col = r.pick(o.cols || ['#c8402c', '#2f6fc0', '#2f8f4a', '#f2c94c', '#f4f1ea', '#3a3f46', '#e05a8a']);
      const ch = kind === 0 ? rh - 12 : kind === 1 ? rh - 16 : rh - 9;
      const cy = ry + rh - 5 - ch;
      if (kind === 1) { rect(ctx, cx + 3, cy - 4, cw - 6, 5, col); rect(ctx, cx + 3, cy - 6, cw - 6, 2, '#d8503a'); }
      rect(ctx, cx, cy, cw, ch, col);
      rect(ctx, cx, cy, 2, ch, lighten(col, 0.35));
      rect(ctx, cx + cw - 2, cy, 2, ch, darken(col, 0.35));
      rect(ctx, cx, cy + Math.round(ch * 0.4), cw, Math.max(2, Math.round(ch * 0.3)), '#f4f1ea');
      ctx.globalAlpha = 0.5; rect(ctx, cx, cy, cw, 1, '#ffffff'); ctx.globalAlpha = 1;
      rect(ctx, cx, ry + rh - 5, cw, 1, 'rgba(0,0,0,0.3)');
    }
    // the price rail: a white strip with tick marks pretending to be numbers
    rect(ctx, x + 2, ry + rh - 5, w - 4, 5, '#f4f8fa');
    rect(ctx, x + 2, ry + rh - 5, w - 4, 1, '#ffffff');
    for (let i = 0; i < Math.floor((w - 12) / 13); i++) { rect(ctx, x + 7 + i * 13, ry + rh - 4, 5, 2, '#c8402c'); rect(ctx, x + 7 + i * 13, ry + rh - 2, 3, 1, '#8a8f98'); }
  }
}

// ---------- the fixtures ----------
// Each of these stands on the floor line and is drawn from its base upward,
// so a prop can be moved sideways without anything else having to know.
// Returning false hands the prop back to the shared library in sideart.js.
function shopinProp(ctx, p, t, S) {
  const I = S.SI, B = I.B;
  const base = Math.round(S.propY(p)), h = Math.round(p.h || 40), w = Math.round(p.w || 40);
  const x = Math.round(p.x - w / 2), y = base - h;
  const lit = p.items && p.items.length && S.prompt && S.prompt.kind === 'prop' && S.prompt.p === p;
  const shade = function () { ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base + 1, w * 0.52, 5, '#000000'); ctx.globalAlpha = 1; };
  switch (p.kind) {
    // ---- the way out, which is also the way in, and remembers which
    case 'sidoor': {
      rect(ctx, x - 6, y - 10, w + 12, h + 10, '#8a8f98');
      rect(ctx, x - 6, y - 10, w + 12, 4, '#b4bac2');
      rect(ctx, x, y, w, h, '#0e1420');
      glassWall(ctx, x, y, w, h, t, { tint: '#2c4c60', top: '#b8dcf0', bot: '#24384a', mullion: w, rail: h });
      // what is outside, reduced to shapes going past
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      rect(ctx, x, base - 26, w, 26, '#3a4250');
      for (let i = 0; i < 4; i++) {
        const ox = ((t * 16 + i * 51) % (w + 40)) - 20;
        ctx.globalAlpha = 0.32; ellipsePx(ctx, x + ox, base - 30, 7, 15, '#0d1018'); ctx.globalAlpha = 1;
      }
      ctx.restore();
      rect(ctx, x + w / 2 - 1, y, 2, h, '#8a8f98');
      rect(ctx, x, base - 30, w, 3, '#b4bac2');
      // the sticker set every automatic door in the world carries
      rect(ctx, x + 4, y + 16, w - 8, 12, '#f4f1ea');
      drawText(ctx, 'PUSH', p.x, y + 19, '#c8402c', { align: 'center', font: 'small' });
      rect(ctx, x + 4, y + 32, w - 8, 10, '#2f8f4a');
      rect(ctx, x + 6, base - 58, w - 12, 14, '#12101c');
      ctx.globalAlpha = 0.65 + 0.3 * Math.sin(t * 2.6);
      drawText(ctx, 'OPEN', p.x, base - 55, '#6be585', { align: 'center', font: 'small' });
      ctx.globalAlpha = 1;
      // the mat, which is the first thing about this country you noticed
      rect(ctx, x - 14, base - 4, w + 28, 4, '#3a4a42');
      rect(ctx, x - 14, base - 4, w + 28, 1, '#5a6a60');
      for (let i = 0; i < Math.floor((w + 28) / 9); i++) rect(ctx, x - 12 + i * 9, base - 3, 4, 2, '#2c3a34');
      return true;
    }
    // ---- the bell over the door, still swinging from the last customer
    case 'sibell': {
      const sw = Math.sin(t * 9) * Math.max(0, 1 - I.bellT) * 0.5;
      rect(ctx, p.x - 1, y, 2, 10, '#6a5a3a');
      ctx.save(); ctx.translate(p.x, y + 10); ctx.rotate(sw);
      ellipsePx(ctx, 0, 6, 7, 7, '#c8a03a');
      ellipsePx(ctx, -2, 4, 3, 3, '#ffd24a');
      rect(ctx, -7, 11, 14, 2, '#8a6a1a');
      rect(ctx, -1, 13, 2, 3, '#5a4210');
      ctx.restore();
      return true;
    }
    // ---- the counter, the till, and the little tray you put coins in
    case 'sitill': {
      shade();
      rect(ctx, x, y, w, h, '#d8d2c4');
      rect(ctx, x, y, w, 5, '#f2eee2');
      rect(ctx, x, y + 5, w, 3, '#b8b0a0');
      rect(ctx, x, base - 8, w, 8, '#9a9286');
      for (let i = 0; i < Math.floor(w / 26); i++) { ctx.globalAlpha = 0.13; rect(ctx, x + 6 + i * 26, y + 8, 1, h - 16, '#000000'); ctx.globalAlpha = 1; }
      // the register itself, angled away from you, and its little screen
      rect(ctx, x + 12, y - 34, 46, 34, '#3a3f46');
      rect(ctx, x + 12, y - 34, 46, 3, '#5c626c');
      rect(ctx, x + 16, y - 30, 38, 16, '#101820');
      ctx.globalAlpha = 0.85;
      drawText(ctx, I.scan ? fmtMoney(I.scan.total) : (I.basket.length ? fmtMoney(shopinBasketTotal(I)) : '0'), x + 52, y - 26, '#6be585', { align: 'right', font: 'small' });
      ctx.globalAlpha = 1;
      for (let r2 = 0; r2 < 3; r2++) for (let c2 = 0; c2 < 5; c2++) rect(ctx, x + 16 + c2 * 8, y - 12 + r2 * 4, 6, 3, '#6a7079');
      // the scanner window, glowing red the way they do
      rect(ctx, x + w - 46, y - 12, 30, 12, '#2a2c34');
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(t * 8);
      rect(ctx, x + w - 44, y - 10, 26, 3, '#e8503a');
      ctx.globalAlpha = 1;
      // the coin tray. You do not hand money over here. You put it down.
      rect(ctx, x + w - 44, y + 10, 30, 8, '#3a3440');
      rect(ctx, x + w - 42, y + 11, 26, 6, '#5a5060');
      // the bag rack and the hot case of things nobody ordered
      rect(ctx, x + 2, y - 16, 8, 16, '#8a8f98');
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.5; rect(ctx, x + 1, y - 14 + i * 5, 11, 3, '#f4f8fa'); ctx.globalAlpha = 1; }
      if (p.label) { rect(ctx, p.x - 30, y - 52, 60, 14, B.col); frame(ctx, p.x - 30, y - 52, 60, 14, darken(B.col, 0.4)); drawText(ctx, 'TILL', p.x, y - 49, B.col2 || '#f4f1ea', { align: 'center', font: 'small' }); }
      return true;
    }
    // ---- the wall of cold drinks: the single best thing about being awake at 3am
    case 'sifridge': {
      const doors = Math.max(2, Math.round(w / 56));
      rect(ctx, x - 4, y - 8, w + 8, h + 8, '#9aa2aa');
      rect(ctx, x - 4, y - 8, w + 8, 4, '#c0c8d0');
      rect(ctx, x - 4, y - 4, w + 8, 4, '#6a7079');
      const dw = w / doors;
      for (let d = 0; d < doors; d++) {
        const dx = x + d * dw;
        rect(ctx, dx, y, dw, h, '#0d1416');
        shopinStockWall(ctx, dx + 3, y + 3, dw - 6, h - 6, t, hashStr(B.id + 'f' + d), { rows: 4, cw: 10, back: '#e6f0ee', cols: ['#2f6fc0', '#2f8f4a', '#c8402c', '#f2c94c', '#f4f1ea', '#e8a03a', '#8ad8ff'] });
        // the cold coming off it, and the glass over all of it
        ctx.globalAlpha = 0.2; vgrad(ctx, dx + 3, y + 3, dw - 6, h - 6, '#cfe8ff', '#5a8aa8'); ctx.globalAlpha = 1;
        ctx.globalAlpha = 0.12;
        ctx.fillStyle = '#ffffff'; ctx.beginPath();
        ctx.moveTo(dx + 8, base - 6); ctx.lineTo(dx + 22, base - 6); ctx.lineTo(dx + 22 + h * 0.5, y + 3); ctx.lineTo(dx + 8 + h * 0.5, y + 3); ctx.fill();
        ctx.globalAlpha = 1;
        frame(ctx, dx + 1, y + 1, dw - 2, h - 2, '#b4bac2');
        rect(ctx, dx + dw - 8, y + h * 0.38, 4, 34, '#dfe6ea');
        rect(ctx, dx + dw - 8, y + h * 0.38, 4, 2, '#ffffff');
      }
      // the header board with the category on it, in the brand's colour
      rect(ctx, x - 4, y - 26, w + 8, 20, B.col);
      rect(ctx, x - 4, y - 26, w + 8, 2, lighten(B.col, 0.35));
      drawText(ctx, p.sign || 'COLD DRINKS', p.x, y - 21, B.col2 || '#f4f1ea', { align: 'center', scale: 2 });
      if (lit) { ctx.globalAlpha = 0.14 + 0.06 * Math.sin(t * 5); rect(ctx, x - 4, y - 8, w + 8, h + 8, '#ffffff'); ctx.globalAlpha = 1; }
      return true;
    }
    // ---- the hot case: oden in one half, fried things under a lamp in the other
    case 'sihot': {
      shade();
      rect(ctx, x, y, w, h, '#b9bec6');
      rect(ctx, x, y, w, 4, '#dfe6ea');
      rect(ctx, x, base - 10, w, 10, '#8a8f98');
      // the oden vat, sectioned, with things floating in a brown sea
      const vw = Math.round(w * 0.52);
      rect(ctx, x + 4, y + 8, vw, h - 24, '#5a4a2a');
      rect(ctx, x + 5, y + 9, vw - 2, h - 26, '#8a6a34');
      ctx.globalAlpha = 0.4 + 0.08 * Math.sin(t * 2); rect(ctx, x + 5, y + 9, vw - 2, 3, '#c8a25a'); ctx.globalAlpha = 1;
      rect(ctx, x + 4 + vw / 3, y + 8, 2, h - 24, '#b9bec6');
      rect(ctx, x + 4 + (vw * 2) / 3, y + 8, 2, h - 24, '#b9bec6');
      const bob = Math.sin(t * 1.6) * 1.2;
      ellipsePx(ctx, x + 12, y + 16 + bob, 6, 4, '#f0e2c0');
      rect(ctx, x + 4 + vw / 3 + 6, y + 13 + bob, 9, 8, '#e8dcc0');
      rect(ctx, x + 4 + (vw * 2) / 3 + 5, y + 6, 2, 16, '#c8ac7a');
      ellipsePx(ctx, x + 4 + (vw * 2) / 3 + 6, y + 18 + bob, 5, 4, '#d8b06a');
      // the steam, which is the whole reason you walked over here
      ctx.globalAlpha = 0.18;
      for (let i = 0; i < 4; i++) { const k = ((t * 0.5 + i * 0.25) % 1); ellipsePx(ctx, x + 14 + i * 12 + Math.sin(t + i) * 3, y + 6 - k * 26, 5 + k * 6, 3 + k * 4, '#ffffff'); }
      ctx.globalAlpha = 1;
      // the fried side, under an orange lamp that never turns off
      const fx = x + vw + 10, fw = w - vw - 14;
      rect(ctx, fx, y + 8, fw, h - 24, '#2a2c34');
      rect(ctx, fx + 2, y + 10, fw - 4, h - 28, '#c8873e');
      for (let i = 0; i < 6; i++) ellipsePx(ctx, fx + 8 + (i % 3) * 11, y + 16 + Math.floor(i / 3) * 10, 5, 4, i % 2 ? '#d89a52' : '#b8762e');
      rect(ctx, fx - 2, y - 10, fw + 4, 8, '#3a3f46');
      ctx.globalAlpha = 0.55 + 0.1 * Math.sin(t * 3);
      rect(ctx, fx, y - 5, fw, 3, '#ffb84a');
      ctx.fillStyle = '#ffb84a'; ctx.beginPath();
      ctx.moveTo(fx, y - 2); ctx.lineTo(fx + fw, y - 2); ctx.lineTo(fx + fw + 8, y + h - 20); ctx.lineTo(fx - 8, y + h - 20); ctx.fill();
      ctx.globalAlpha = 1;
      // the glass, and the tongs hanging off the side
      ctx.globalAlpha = 0.16; rect(ctx, x + 2, y + 6, w - 4, h - 20, '#bfe0ff'); ctx.globalAlpha = 1;
      rect(ctx, x + w - 6, y + 12, 3, 20, '#8a8f98');
      rect(ctx, p.x - 32, y - 30, 64, 16, '#c8402c');
      rect(ctx, p.x - 32, y - 30, 64, 2, '#e8604a');
      drawText(ctx, 'HOT', p.x, y - 26, '#ffe8b0', { align: 'center', scale: 2 });
      return true;
    }
    // ---- a gondola: four shelves of packets, seen end on, price rail and all
    case 'sishelf': {
      shade();
      rect(ctx, x - 3, y - 6, w + 6, 8, '#8a8f98');
      rect(ctx, x - 3, y - 6, w + 6, 2, '#b4bac2');
      rect(ctx, x, y, w, h, '#cfd6de');
      rect(ctx, x + 2, y + 2, w - 4, h - 4, '#e8eef2');
      shopinStockWall(ctx, x + 3, y + 3, w - 6, h - 8, t, hashStr(B.id + (p.sign || '') + p.x), { rows: p.rows || 4, cw: 12, back: '#f2f6f8', cols: ['#f2c94c', '#c8402c', '#2f8f4a', '#8ad8ff', '#e8a03a', '#f4f1ea', '#8a5a3a'] });
      rect(ctx, x, base - 14, w, 14, '#b4bac2');
      rect(ctx, x, base - 14, w, 2, '#dfe6ea');
      if (p.sign) { rect(ctx, x - 3, y - 24, w + 6, 18, B.col); rect(ctx, x - 3, y - 24, w + 6, 2, lighten(B.col, 0.35)); drawText(ctx, p.sign, p.x, y - 19, B.col2 || '#f4f1ea', { align: 'center', scale: 2 }); }
      if (lit) { ctx.globalAlpha = 0.12 + 0.05 * Math.sin(t * 5); rect(ctx, x, y, w, h, '#ffffff'); ctx.globalAlpha = 1; }
      return true;
    }
    // ---- the magazine rack, angled, and the one man standing at it reading for free
    case 'simag': {
      shade();
      rect(ctx, x, y, w, h, '#8a5a3a');
      rect(ctx, x, y, w, 3, '#aa7a54');
      for (let r2 = 0; r2 < 4; r2++) {
        const ry = y + 8 + r2 * ((h - 16) / 4);
        rect(ctx, x + 2, ry + 20, w - 4, 3, '#6a4428');
        for (let i = 0; i < Math.floor((w - 10) / 15); i++) {
          const mx = x + 5 + i * 15, seedc = (r2 * 7 + i * 3) % 6;
          const c = ['#c8402c', '#2f6fc0', '#f2c94c', '#2f8f4a', '#e05a8a', '#3a3f46'][seedc];
          rect(ctx, mx, ry, 13, 21, c);
          rect(ctx, mx, ry, 13, 1, lighten(c, 0.35));
          rect(ctx, mx + 2, ry + 3, 9, 10, '#f0ece2');
          ellipsePx(ctx, mx + 6, ry + 8, 3, 4, '#e8a66a');
          rect(ctx, mx + 2, ry + 15, 9, 2, '#f4f1ea');
          rect(ctx, mx + 2, ry + 18, 6, 1, '#f4f1ea');
        }
      }
      rect(ctx, x, base - 10, w, 10, '#6a4428');
      return true;
    }
    // ---- the coffee machine you work yourself, which takes eleven seconds and feels like four minutes
    case 'sicoffee': {
      shade();
      rect(ctx, x, y, w, h, '#3a3f46');
      rect(ctx, x, y, w, 4, '#5c626c');
      rect(ctx, x + 3, y + 6, w - 6, 26, '#101820');
      ctx.globalAlpha = 0.8; rect(ctx, x + 5, y + 8, w - 10, 22, '#2f6a8a'); ctx.globalAlpha = 1;
      drawText(ctx, 'HOT', x + 7, y + 12, '#8ad8ff', { font: 'small' });
      drawText(ctx, 'ICE', x + 7, y + 22, '#f4f1ea', { font: 'small' });
      rect(ctx, x + 4, y + 38, w - 8, 26, '#1b2230');
      // a cup under the spout, filling, forever
      const fill = ((t * 0.3) % 1);
      rect(ctx, x + w / 2 - 6, y + 46, 12, 16, '#f4f1ea');
      rect(ctx, x + w / 2 - 5, y + 60 - Math.round(fill * 12), 10, Math.max(1, Math.round(fill * 12)), '#5a3a20');
      rect(ctx, x + w / 2 - 2, y + 38, 4, 7, '#8a8f98');
      if (fill > 0.05) { ctx.globalAlpha = 0.6; rect(ctx, x + w / 2 - 1, y + 45, 2, 6, '#8a6a44'); ctx.globalAlpha = 1; }
      rect(ctx, x + 2, base - 24, w - 4, 4, '#2a2c34');
      for (let i = 0; i < 4; i++) rect(ctx, x + 6 + i * 9, base - 18, 6, 6, '#6a7079');
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(t * 4); rect(ctx, x + w - 10, y + 66, 5, 4, '#6be585'); ctx.globalAlpha = 1;
      return true;
    }
    // ---- the copier, which is here because a konbini is also a post office and a printer
    case 'sicopier': {
      shade();
      rect(ctx, x, y + 18, w, h - 18, '#dfe6ea');
      rect(ctx, x, y + 18, w, 3, '#f4f8fa');
      rect(ctx, x, y, w, 20, '#c0c8d0');
      rect(ctx, x + 3, y + 3, w - 6, 12, '#8a8f98');
      ctx.globalAlpha = 0.35 + 0.35 * Math.abs(Math.sin(t * 0.9)); rect(ctx, x + 4, y + 5, w - 8, 8, '#8ad8ff'); ctx.globalAlpha = 1;
      rect(ctx, x + 4, y + 24, w - 8, 12, '#1b2230');
      drawText(ctx, 'A4', x + 8, y + 28, '#6be585', { font: 'small' });
      rect(ctx, x + 2, y + 44, w - 4, 3, '#8a8f98');
      rect(ctx, x + 6, y + 47, w - 12, 8, '#f4f1ea');
      rect(ctx, x, base - 30, w, 30, '#b4bac2');
      for (let i = 0; i < 3; i++) rect(ctx, x + 3, base - 26 + i * 9, w - 6, 6, '#9aa2aa');
      return true;
    }
    // ---- the menu board, hung off the ceiling, with prices that end in nines
    case 'simenu': {
      rect(ctx, x - 2, y - 2, w + 4, h + 4, '#2a2c34');
      rect(ctx, x, y, w, h, I.menuBack);
      rect(ctx, x, y, w, 3, lighten(I.menuBack, 0.3));
      rect(ctx, x, y + h - 3, w, 3, darken(I.menuBack, 0.4));
      rect(ctx, x + 4, y + 4, w - 8, 14, B.col);
      drawText(ctx, B.name, x + w / 2, y + 7, B.col2 || '#f4f1ea', { align: 'center', scale: 2 });
      const list = p.items || [];
      const cols = w > 190 ? 2 : 1, perCol = Math.ceil(Math.min(list.length, 10) / cols);
      for (let i = 0; i < Math.min(list.length, cols * perCol); i++) {
        const it = list[i], c2 = Math.floor(i / perCol), r2 = i % perCol;
        const lx = x + 8 + c2 * ((w - 16) / cols), ly = y + 24 + r2 * 13;
        if (p.photo) { rect(ctx, lx, ly - 1, 12, 11, '#1b2230'); drawShopItem(ctx, lx + 6, ly + 4, 5, it); }
        let nm = it.name, sc = 1;
        const room = (w - 16) / cols - (p.photo ? 16 : 0) - 34;
        while (nm.length > 4 && textWidth(nm, { scale: sc }) > room) nm = nm.slice(0, -1);
        drawText(ctx, nm, lx + (p.photo ? 15 : 0), ly, I.menuInk, { scale: sc });
        drawText(ctx, fmtMoney(it.price), lx + (w - 16) / cols - 6, ly, '#ffd24a', { align: 'right', scale: 1 });
      }
      // the little downlights that wash it, and the rods holding it up
      rect(ctx, x + w * 0.2, y - 16, 2, 16, '#6a7079');
      rect(ctx, x + w * 0.8, y - 16, 2, 16, '#6a7079');
      ctx.globalAlpha = 0.12; rect(ctx, x, y + h, w, 10, '#ffffff'); ctx.globalAlpha = 1;
      return true;
    }
    default: return shopinProp2(ctx, p, t, S);
  }
}

// ---------- the fixtures that belong to the other kinds of shop ----------
// Split off only because one switch of this length stops being readable, not
// because these are any less part of the room.
function shopinProp2(ctx, p, t, S) {
  const I = S.SI, B = I.B;
  const base = Math.round(S.propY(p)), h = Math.round(p.h || 40), w = Math.round(p.w || 40);
  const x = Math.round(p.x - w / 2), y = base - h;
  const shade = function () { ctx.globalAlpha = 0.3; ellipsePx(ctx, p.x, base + 1, w * 0.52, 5, '#000000'); ctx.globalAlpha = 1; };
  switch (p.kind) {
    // ---- the pastry case: glass, three shelves, tongs, and a label for everything
    case 'sipastry': {
      shade();
      rect(ctx, x, y, w, h, '#6a4a2e');
      rect(ctx, x, y, w, 4, '#8a6440');
      rect(ctx, x + 3, y + 6, w - 6, h - 20, '#2a1e16');
      for (let r2 = 0; r2 < 2; r2++) {
        const ry = y + 12 + r2 * ((h - 28) / 2);
        rect(ctx, x + 5, ry + 14, w - 10, 2, '#b9bec6');
        ctx.globalAlpha = 0.35; rect(ctx, x + 5, ry + 2, w - 10, 6, '#ffe9a8'); ctx.globalAlpha = 1;
        for (let i = 0; i < Math.floor((w - 16) / 22); i++) {
          const cx = x + 16 + i * 22;
          const kind = (i + r2) % 3;
          if (kind === 0) { for (let k = 0; k < 4; k++) { const kk = (k - 1.5) / 1.5; ellipsePx(ctx, cx + kk * 5, ry + 9 + Math.abs(kk) * 2, 3.4 - Math.abs(kk), 3, '#d99f4e'); } }
          else if (kind === 1) { rect(ctx, cx - 7, ry + 4, 14, 10, '#c8873e'); rect(ctx, cx - 7, ry + 4, 14, 2, '#e0a552'); for (let k = 0; k < 4; k++) rect(ctx, cx - 5 + k * 3, ry + 8, 2, 2, '#5a3a20'); }
          else { ellipsePx(ctx, cx, ry + 9, 7, 4, '#e8dcc0'); ellipsePx(ctx, cx, ry + 7, 6, 3, '#f6ecd6'); rect(ctx, cx - 3, ry + 5, 6, 2, '#c8402c'); }
          rect(ctx, cx - 8, ry + 16, 16, 4, '#f4f1ea');
          rect(ctx, cx - 6, ry + 17, 8, 2, '#8a8478');
        }
      }
      ctx.globalAlpha = 0.18; rect(ctx, x + 3, y + 6, w - 6, h - 20, '#bfe0ff'); ctx.globalAlpha = 1;
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = '#ffffff'; ctx.beginPath();
      ctx.moveTo(x + 14, base - 16); ctx.lineTo(x + 26, base - 16); ctx.lineTo(x + 26 + h * 0.4, y + 6); ctx.lineTo(x + 14 + h * 0.4, y + 6); ctx.fill();
      ctx.globalAlpha = 1;
      rect(ctx, x, base - 14, w, 14, '#5a3a20');
      rect(ctx, x, base - 14, w, 2, '#7a5236');
      return true;
    }
    // ---- the espresso machine, with a real cloud of steam off the wand
    case 'siespresso': {
      shade();
      rect(ctx, x, y + 10, w, h - 10, '#8a8f98');
      rect(ctx, x, y + 10, w, 4, '#cfd6de');
      rect(ctx, x, base - 12, w, 12, '#5c626c');
      rect(ctx, x + 2, y, w - 4, 12, '#3a3f46');
      rect(ctx, x + 2, y, w - 4, 2, '#5c626c');
      // two groups, two cups, and the portafilter handles sticking out
      for (let g = 0; g < 2; g++) {
        const gx = x + 16 + g * (w - 40);
        rect(ctx, gx - 8, y + 24, 16, 12, '#3a3f46');
        rect(ctx, gx - 8, y + 24, 16, 2, '#5c626c');
        rect(ctx, gx - 14, y + 32, 22, 5, '#2a2c34');
        rect(ctx, gx - 20, y + 33, 8, 3, '#1b1b24');
        rect(ctx, gx - 5, y + 44, 10, 10, '#f4f1ea');
        rect(ctx, gx - 5, y + 44, 10, 2, '#ffffff');
        rect(ctx, gx - 4, y + 46, 8, 3, '#5a3a20');
        ctx.globalAlpha = 0.5; rect(ctx, gx - 2, y + 36, 1, 8, '#8a6a44'); rect(ctx, gx + 1, y + 36, 1, 8, '#8a6a44'); ctx.globalAlpha = 1;
      }
      // the steam wand, hissing
      rect(ctx, x + w - 10, y + 18, 3, 22, '#b9bec6');
      ctx.globalAlpha = 0.22;
      for (let i = 0; i < 5; i++) { const k = ((t * 0.7 + i * 0.2) % 1); ellipsePx(ctx, x + w - 8 + Math.sin(t * 2 + i) * 4, y + 16 - k * 30, 4 + k * 7, 3 + k * 5, '#ffffff'); }
      ctx.globalAlpha = 1;
      // the pressure gauge, and the row of tampers
      circle(ctx, x + w / 2, y + 6, 4, '#f4f1ea'); rect(ctx, x + w / 2 - 1, y + 3, 2, 3, '#c8402c');
      rect(ctx, x + 4, base - 22, w - 8, 3, '#3a3f46');
      return true;
    }
    // ---- the bean display: hoppers on top, sacks below, a scoop in one of them
    case 'sibeans': {
      shade();
      rect(ctx, x, y + 26, w, h - 26, '#6a4a2e');
      rect(ctx, x, y + 26, w, 3, '#8a6440');
      for (let i = 0; i < 3; i++) {
        const hx = x + 6 + i * ((w - 12) / 3);
        const hw = (w - 12) / 3 - 4;
        rect(ctx, hx, y, hw, 26, '#cfd6de');
        ctx.globalAlpha = 0.4; rect(ctx, hx, y, hw, 26, '#bfe0ff'); ctx.globalAlpha = 1;
        rect(ctx, hx + 1, y + 10, hw - 2, 15, ['#4a2a18', '#6a4020', '#3a2010'][i]);
        for (let k = 0; k < 7; k++) rect(ctx, hx + 2 + ((k * 5) % (hw - 4)), y + 12 + ((k * 3) % 11), 2, 2, lighten(['#4a2a18', '#6a4020', '#3a2010'][i], 0.35));
        rect(ctx, hx, y + 25, hw, 3, '#8a8f98');
        rect(ctx, hx + hw / 2 - 2, y + 28, 4, 5, '#5c626c');
      }
      for (let i = 0; i < 2; i++) {
        const sx2 = x + 8 + i * ((w - 16) / 2);
        rect(ctx, sx2, base - 26, (w - 16) / 2 - 6, 26, '#b4a884');
        rect(ctx, sx2, base - 26, (w - 16) / 2 - 6, 3, '#cec2a0');
        rect(ctx, sx2 + 4, base - 20, (w - 16) / 2 - 14, 8, '#7a6a48');
      }
      return true;
    }
    // ---- mugs on a shelf, which is the whole personality of a coffee shop
    case 'simugs': {
      rect(ctx, x, y + h - 5, w, 5, '#6a4a2e');
      rect(ctx, x, y + h - 5, w, 2, '#8a6440');
      for (let i = 0; i < Math.floor(w / 18); i++) {
        const mx = x + 6 + i * 18, c = ['#f4f1ea', '#0b6b4a', '#c8402c', '#3a3f46', '#f2c94c'][i % 5];
        rect(ctx, mx, y + h - 19, 12, 14, c);
        rect(ctx, mx, y + h - 19, 12, 2, lighten(c, 0.35));
        rect(ctx, mx + 10, y + h - 19, 2, 14, darken(c, 0.35));
        ellipseRingPx(ctx, mx + 15, y + h - 12, 4, 4, c);
      }
      return true;
    }
    // ---- the cork board: gig flyers, a lost cat, a room to let
    case 'sicork': {
      rect(ctx, x - 3, y - 3, w + 6, h + 6, '#6a4a2e');
      rect(ctx, x - 3, y - 3, w + 6, 3, '#8a6440');
      rect(ctx, x, y, w, h, '#b58a52');
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 90; i++) { const r2 = makeRng(hashStr('cork' + i)); rect(ctx, x + r2() * w, y + r2() * h, 1, 1, '#6a4a2e'); }
      ctx.globalAlpha = 1;
      const r = makeRng(hashStr(B.id + 'cork'));
      for (let i = 0; i < 7; i++) {
        const fx = x + 5 + r.range(0, w - 34), fy = y + 5 + r.range(0, h - 40);
        const c = r.pick(['#f4f1ea', '#f2c94c', '#e8a8c0', '#8ad8ff', '#cfe4c8']);
        ctx.save(); ctx.translate(fx + 14, fy + 18); ctx.rotate(r.range(-0.1, 0.1)); ctx.translate(-14, -18);
        ctx.globalAlpha = 0.3; rect(ctx, 1, 2, 28, 36, '#000000'); ctx.globalAlpha = 1;
        rect(ctx, 0, 0, 28, 36, c);
        rect(ctx, 3, 3, 22, 12, darken(c, 0.35));
        for (let k = 0; k < 4; k++) rect(ctx, 3, 18 + k * 4, 22 - k * 4, 2, '#8a8478');
        for (let k = 0; k < 4; k++) rect(ctx, 2 + k * 7, 32, 5, 4, darken(c, 0.2));
        circle(ctx, 14, 3, 2, '#c8402c');
        ctx.restore();
      }
      return true;
    }
    // ---- the fast food counter: three tills, a drop shelf, a heat lamp, a queue rail
    case 'sifastcounter': {
      shade();
      rect(ctx, x, y, w, h, '#c8402c');
      rect(ctx, x, y, w, 5, '#e8604a');
      rect(ctx, x, y + 5, w, 3, '#8a1d12');
      rect(ctx, x, base - 12, w, 12, '#8a1d12');
      for (let i = 0; i < 3; i++) {
        const tx = x + 22 + i * ((w - 44) / 2.4);
        rect(ctx, tx - 16, y - 26, 32, 26, '#3a3f46');
        rect(ctx, tx - 16, y - 26, 32, 3, '#5c626c');
        rect(ctx, tx - 13, y - 22, 26, 12, '#101820');
        ctx.globalAlpha = 0.8; drawText(ctx, i === 0 ? 'OPEN' : i === 1 ? 'WAIT' : '----', tx, y - 19, i === 0 ? '#6be585' : '#f2a03a', { align: 'center', font: 'small' }); ctx.globalAlpha = 1;
        for (let k = 0; k < 6; k++) rect(ctx, tx - 12 + (k % 3) * 9, y - 8 + Math.floor(k / 3) * 4, 7, 3, '#6a7079');
      }
      // the drop shelf, lit orange, with two bags waiting on it
      rect(ctx, x + 10, y - 44, w - 20, 5, '#8a8f98');
      ctx.globalAlpha = 0.5 + 0.08 * Math.sin(t * 2.4);
      rect(ctx, x + 10, y - 39, w - 20, 3, '#ffb84a');
      ctx.globalAlpha = 0.13; rect(ctx, x + 10, y - 36, w - 20, 34, '#ffb84a'); ctx.globalAlpha = 1;
      for (let i = 0; i < 2; i++) { const bx = x + 30 + i * 60; rect(ctx, bx, y - 62, 22, 18, '#e8dcc0'); rect(ctx, bx, y - 62, 22, 2, '#f8eeda'); rect(ctx, bx + 6, y - 58, 10, 8, '#c8402c'); }
      return true;
    }
    // ---- the fry station: baskets, oil, a timer beeping at nobody
    case 'sifry': {
      shade();
      rect(ctx, x, y + 20, w, h - 20, '#8a8f98');
      rect(ctx, x, y + 20, w, 4, '#cfd6de');
      rect(ctx, x, base - 14, w, 14, '#5c626c');
      for (let i = 0; i < 2; i++) {
        const vx = x + 8 + i * ((w - 16) / 2);
        const vw = (w - 16) / 2 - 6;
        rect(ctx, vx, y + 26, vw, 22, '#2a2c34');
        rect(ctx, vx + 2, y + 28, vw - 4, 18, '#c8873e');
        ctx.globalAlpha = 0.4 + 0.14 * Math.sin(t * 5 + i); rect(ctx, vx + 2, y + 28, vw - 4, 3, '#f2c94c'); ctx.globalAlpha = 1;
        for (let k = 0; k < 5; k++) { const bb = Math.sin(t * 6 + k * 1.3 + i) * 2; rect(ctx, vx + 4 + k * 5, y + 32 + bb, 3, 9, '#f2c94c'); }
        // the basket handle, angled up out of the oil
        rect(ctx, vx + vw - 6, y + 10, 3, 18, '#b9bec6');
        rect(ctx, vx + vw - 12, y + 8, 12, 3, '#b9bec6');
        ctx.globalAlpha = 0.16;
        for (let k = 0; k < 3; k++) { const kk = ((t * 0.6 + k * 0.33) % 1); ellipsePx(ctx, vx + vw / 2, y + 24 - kk * 24, 4 + kk * 6, 3 + kk * 4, '#ffffff'); }
        ctx.globalAlpha = 1;
      }
      rect(ctx, x + w - 16, y + 4, 14, 12, '#1b2230');
      ctx.globalAlpha = Math.sin(t * 6) > 0 ? 1 : 0.3;
      drawText(ctx, '0:12', x + w - 14, y + 8, '#e8503a', { font: 'small' });
      ctx.globalAlpha = 1;
      return true;
    }
    // ---- the fountain: nine buttons, one ice lever, a drain tray
    case 'sifountain': {
      shade();
      rect(ctx, x, y, w, h, '#2a2c34');
      rect(ctx, x, y, w, 4, '#4a4c56');
      rect(ctx, x + 3, y + 8, w - 6, h * 0.42, '#c8402c');
      rect(ctx, x + 3, y + 8, w - 6, 2, '#e8604a');
      for (let i = 0; i < 6; i++) { const bx = x + 8 + (i % 3) * ((w - 16) / 3), by = y + 14 + Math.floor(i / 3) * 16; rect(ctx, bx, by, (w - 16) / 3 - 4, 12, ['#3a3f46', '#8a5a2a', '#2f8f4a', '#f2a03a', '#c83a6a', '#2f6fc0'][i]); rect(ctx, bx, by, (w - 16) / 3 - 4, 2, '#ffffff'); }
      rect(ctx, x + 4, y + h * 0.52, w - 8, 6, '#8a8f98');
      for (let i = 0; i < 3; i++) rect(ctx, x + 12 + i * ((w - 24) / 3), y + h * 0.52 + 6, 4, 8, '#b9bec6');
      // a cup under one of the nozzles, and a thin line of cola going into it
      rect(ctx, x + 14, base - 32, 14, 20, '#f4f1ea');
      rect(ctx, x + 15, base - 24, 12, 12, '#2a1a14');
      ctx.globalAlpha = 0.7; rect(ctx, x + 20, base - 46, 2, 14, '#3a2a20'); ctx.globalAlpha = 1;
      rect(ctx, x + 2, base - 10, w - 4, 10, '#4a4c56');
      for (let i = 0; i < Math.floor((w - 8) / 6); i++) rect(ctx, x + 5 + i * 6, base - 8, 3, 6, '#1b1b24');
      return true;
    }
    // ---- a stack of trays and the paper that goes on them
    case 'sitrays': {
      shade();
      rect(ctx, x, base - 14, w, 14, '#8a8f98');
      for (let i = 0; i < 8; i++) { const ty = base - 18 - i * 4; rect(ctx, x + 2, ty, w - 4, 4, i % 2 ? '#8a3a2a' : '#a04a34'); rect(ctx, x + 2, ty, w - 4, 1, '#c86a4a'); }
      rect(ctx, x + w - 20, base - 62, 18, 12, '#f4f1ea');
      rect(ctx, x + w - 20, base - 62, 18, 1, '#ffffff');
      rect(ctx, x + w - 17, base - 58, 12, 2, '#c8402c');
      return true;
    }
    // ---- the sign pointing at the play area, which you are too old for
    case 'siplay': {
      rect(ctx, p.x - 3, y + 20, 6, h - 20, '#8a8f98');
      rect(ctx, x, y, w, 30, '#f2a03a');
      rect(ctx, x, y, w, 3, '#ffc86a');
      frame(ctx, x, y, w, 30, '#8a5a10');
      drawText(ctx, 'PLAY', p.x, y + 6, '#4a2a08', { align: 'center', scale: 2 });
      drawText(ctx, 'SHOES OFF', p.x, y + 20, '#4a2a08', { align: 'center', font: 'small' });
      rect(ctx, x + 4, y + 34, w - 8, 18, '#2f8f4a');
      for (let i = 0; i < 3; i++) circle(ctx, x + 12 + i * 14, y + 43, 5, ['#c8402c', '#f2c94c', '#2f6fc0'][i]);
      return true;
    }
    // ---- a clothes rail: hangers, sleeves, a size cube on the end
    case 'sirack': {
      shade();
      rect(ctx, x + 2, base - 4, w - 4, 4, '#6a7079');
      rect(ctx, p.x - 2, y + 14, 4, h - 18, '#8a8f98');
      rect(ctx, x, y + 10, w, 4, '#b9bec6');
      rect(ctx, x, y + 10, w, 1, '#dfe6ea');
      const r = makeRng(hashStr(B.id + 'rack' + p.x));
      for (let i = 0; i < Math.floor((w - 8) / 10); i++) {
        const gx = x + 6 + i * 10;
        const c = r.pick(['#3a3f46', '#c8402c', '#2f4a68', '#f0ece2', '#6a4a2e', '#2f8f4a']);
        rect(ctx, gx + 3, y + 8, 1, 6, '#b9bec6');
        rect(ctx, gx, y + 14, 8, 34, c);
        rect(ctx, gx, y + 14, 8, 2, lighten(c, 0.3));
        rect(ctx, gx + 6, y + 14, 2, 34, darken(c, 0.3));
        if (i % 4 === 0) { rect(ctx, gx, y + 48, 8, 3, '#f4f1ea'); }
      }
      if (p.sign) { rect(ctx, x, y - 16, w, 16, B.col); drawText(ctx, p.sign, p.x, y - 12, B.col2 || '#f4f1ea', { align: 'center', font: 'small' }); }
      return true;
    }
    // ---- a mirror, which is where you find out what eleven hours did to you
    case 'simirror': {
      rect(ctx, x - 4, y - 4, w + 8, h + 8, '#c8a03a');
      rect(ctx, x - 4, y - 4, w + 8, 3, '#ffd24a');
      rect(ctx, x - 4, base + 1, w + 8, 3, '#8a6a1a');
      rect(ctx, x, y, w, h, '#2a3340');
      ctx.globalAlpha = 0.5; vgrad(ctx, x, y, w, h, '#8fb0c8', '#2a3340'); ctx.globalAlpha = 1;
      // your own reflection, flipped, a shade darker, always one step behind
      const d = S.body.x - p.x;
      if (Math.abs(d) < w * 0.8 + 40) {
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
        ctx.globalAlpha = 0.45;
        drawBugAt(ctx, S.you.spec, p.x - d * 0.4, base - 6, { pose: S.body.pose, scale: S.body.scale * 0.92, flip: !S.body.flip, bounce: 0.4 });
        ctx.globalAlpha = 1; ctx.restore();
      }
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = '#ffffff'; ctx.beginPath();
      ctx.moveTo(x + 4, base - 4); ctx.lineTo(x + 16, base - 4); ctx.lineTo(x + 16 + h * 0.5, y); ctx.lineTo(x + 4 + h * 0.5, y); ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    }
    // ---- the fitting room: one curtain, one stool, one mirror you cannot see
    case 'sifitting': {
      rect(ctx, x - 4, y - 8, w + 8, 10, '#6a4a2e');
      rect(ctx, x - 4, y - 8, w + 8, 3, '#8a6440');
      rect(ctx, x, y + 2, w, h - 2, '#151a22');
      const sw = Math.sin(t * 1.1) * 2;
      for (let i = 0; i < Math.floor(w / 7); i++) {
        const cx = x + i * 7, ph = Math.sin(t * 1.3 + i * 0.7) * 1.6 + sw;
        rect(ctx, cx + ph, y + 2, 7, h - 2, i % 2 ? '#5a2a40' : '#6a3450');
        rect(ctx, cx + ph, y + 2, 2, h - 2, '#7a4060');
      }
      rect(ctx, x, y + 2, w, 3, '#8a8f98');
      rect(ctx, x + w - 10, y + h * 0.5, 4, 12, '#c8a03a');
      rect(ctx, p.x - 20, y - 26, 40, 16, '#3a3f46');
      drawText(ctx, 'FITTING', p.x, y - 22, '#f4f1ea', { align: 'center', font: 'small' });
      return true;
    }
    // ---- a display table: folded stacks, a sign on a stand, a basket of socks
    case 'sidisplay': {
      shade();
      rect(ctx, x, y, w, 7, '#a8784a');
      rect(ctx, x, y, w, 2, '#c99a62');
      rect(ctx, x + 5, y + 7, 6, h - 7, '#7a5636');
      rect(ctx, x + w - 11, y + 7, 6, h - 7, '#7a5636');
      const r = makeRng(hashStr(B.id + 'disp' + p.x));
      for (let i = 0; i < 3; i++) {
        const sx2 = x + 10 + i * ((w - 20) / 3), sw2 = (w - 20) / 3 - 8;
        for (let k = 0; k < 3; k++) { const c = r.pick(['#f0ece2', '#3a3f46', '#c8402c', '#2f4a68', '#e8a8c0']); rect(ctx, sx2, y - 5 - k * 5, sw2, 5, c); rect(ctx, sx2, y - 5 - k * 5, sw2, 1, lighten(c, 0.3)); }
      }
      rect(ctx, p.x - 14, y - 40, 28, 16, '#f4f1ea');
      frame(ctx, p.x - 14, y - 40, 28, 16, '#c8402c');
      drawText(ctx, p.sign || 'SALE', p.x, y - 36, '#c8402c', { align: 'center', font: 'small' });
      rect(ctx, p.x - 1, y - 24, 2, 24, '#8a8f98');
      return true;
    }
    default: return false;
  }
}

// ---------- the shop, as a thing with rules ----------
// Everything below is about the transaction. The catalogue is the source of
// truth for what is on the shelves; this file only decides which shelf.
function shopinBrandOf(brand) {
  if (brand && typeof brand === 'object') return brand;
  if (typeof shopById === 'function') { const s = shopById(brand); if (s) return s; }
  if (typeof SHOPS !== 'undefined') { for (let i = 0; i < SHOPS.length; i++) if (SHOPS[i].id === brand) return SHOPS[i]; }
  // a shop that is not in the catalogue still gets a door and a clerk
  return { id: String(brand || 'shop'), name: 'A SHOP', tag: 'IT SELLS THINGS', kind: 'conv', logo: 'store', col: '#2f6fc0', col2: '#f4f1ea', inner: '#e4e8e8', blurb: 'Nobody has written down what this place is like yet.' };
}
function shopinStockOf(B) {
  if (typeof SHOP_STOCK === 'undefined') return [];
  const list = SHOP_STOCK[B.id];
  return list ? list.slice() : [];
}
// The green strip at the bottom is one line and the pixel font is twelve
// pixels a character, so a sentence that runs past the frame gets cut at the
// last word that fits rather than sliding off the edge of the screen.
function shopinShort(text, n) {
  const s = String(text || '').toUpperCase();
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  const sp = cut.lastIndexOf(' ');
  return (sp > n * 0.5 ? cut.slice(0, sp) : cut) + '...';
}
function shopinBasketTotal(I) { let n = 0; for (let i = 0; i < I.basket.length; i++) n += I.basket[i].price; return n; }

// Which fixture a given product belongs on. Specific beats general, so the
// hot case gets the karaage before the snack shelf can have it.
function shopinWants(pick, it) {
  const hot = it.effect === 'warm' && it.kind === 'food';
  switch (pick) {
    case 'hot': return hot;
    case 'drink': return it.kind === 'drink';
    case 'food': return it.kind === 'food';
    case 'item': return it.kind === 'item' || it.kind === 'gear';
    case 'any': return true;
  }
  return false;
}
function shopinDeal(S) {
  const I = S.SI;
  const shelves = [];
  for (let i = 0; i < S.props.length; i++) if (S.props[i].pick) { S.props[i].items = []; shelves.push(S.props[i]); }
  if (!shelves.length) return;
  // Specific fixtures get first refusal: the hot case takes the karaage
  // before the snack shelf is allowed to want it, and the fridge takes
  // anything cold. Whatever nobody claimed gets shared out evenly across the
  // general shelves, so no fixture in the room is standing there empty.
  const order = ['hot', 'drink', 'food', 'item'];
  const spare = [];
  for (let i = 0; i < I.stock.length; i++) {
    const it = I.stock[i];
    let target = null;
    for (let o = 0; o < order.length && !target; o++) {
      if (!shopinWants(order[o], it)) continue;
      for (let k = 0; k < shelves.length; k++) if (shelves[k].pick === order[o]) { target = shelves[k]; break; }
    }
    if (target) target.items.push(it); else spare.push(it);
  }
  const general = [];
  for (let k = 0; k < shelves.length; k++) if (shelves[k].pick === 'any') general.push(shelves[k]);
  const pool = general.length ? general : shelves;
  for (let i = 0; i < spare.length; i++) pool[i % pool.length].items.push(spare[i]);
  // Balance: take from the fullest shelf until nothing is completely bare.
  for (let pass = 0; pass < 24; pass++) {
    let low = shelves[0], high = shelves[0];
    for (let k = 1; k < shelves.length; k++) {
      if (shelves[k].items.length < low.items.length) low = shelves[k];
      if (shelves[k].items.length > high.items.length) high = shelves[k];
    }
    if (low.items.length > 0 || high.items.length < 2) break;
    low.items.push(high.items.pop());
  }
  // A shelf with nothing left on it stops being a thing you can walk up to.
  for (let k = 0; k < shelves.length; k++) if (!shelves[k].items.length) { shelves[k].label = null; shelves[k].act = null; }
}

// ---------- what a thing does to you once you have paid for it ----------
// The money comes off at the till, not at the shelf, because that is how a
// shop works and because it makes the walk to the counter mean something.
function shopinApply(it) {
  const r = Game.run;
  if (!r) return;
  if (!r.flags) r.flags = {};
  if (!r.buffs) r.buffs = {};
  if (it.stam) r.stamina = clamp(r.stamina + it.stam, 0, r.staminaMax);
  const room = function () { return r.consumables && r.consumables.length < 6; };
  switch (it.effect) {
    case 'warm': r.flags.warm = true; break;
    case 'sugar': if (room()) r.consumables.push('energyBar'); break;
    case 'voice': r.buffs.voice = true; if (room()) r.consumables.push('espresso'); break;
    case 'cure': {
      // the cheapest medicine in the game: one bug stops being hungry
      const m = r.members && r.members[0];
      if (m) { m.hunger = Math.max(0, (m.hunger || 0) - 1); m.stamina = Math.min(100, (m.stamina || 0) + 10); }
      r.flags.patched = true;
      break;
    }
    case 'rain': r.flags.umbrella = true; break;
    case 'power': r.flags.charged = true; break;
    case 'clean': r.flags.clean = true; break;
    case 'wear': r.flags.presentable = true; break;
    case 'gear': if (room()) r.consumables.push('tuner'); break;
    case 'gift': r.gratitude = (r.gratitude || 0) + 1; break;
    case 'luck': if (room()) r.consumables.push('luckyCoin'); break;
    case 'read': if (room()) r.consumables.push('setlist'); break;
  }
}

// ---------- what the person behind the counter says ----------
// Six words, nine hundred times a day, and still said properly.
const SHOPIN_HELLO = {
  conv: ['WELCOME. TAKE YOUR TIME.', 'GOOD MORNING. HOT CASE IS ON.', 'WELCOME IN. IT IS RAINING AGAIN.'],
  coffee: ['HI THERE. WHAT CAN I GET YOU?', 'WELCOME IN. THE WIFI IS ON THE BOARD.', 'HI. NAME FOR THE CUP?'],
  fast: ['WELCOME. ORDER WHEN YOU ARE READY.', 'HELLO. TILL TWO IS OPEN.', 'WELCOME IN. FRIES JUST WENT DOWN.'],
  fashion: ['PLEASE LOOK AROUND.', 'WELCOME. SHOUT IF YOU WANT A SIZE.'],
  other: ['WELCOME.', 'PLEASE LOOK AROUND.', 'HELLO. TAKE YOUR TIME.'],
};
const SHOPIN_BYE = {
  conv: ['THANK YOU. PLEASE COME AGAIN.', 'THANK YOU. MIND THE STEP.', 'THANK YOU VERY MUCH.'],
  coffee: ['THANK YOU. SEE YOU AGAIN.', 'HAVE A GOOD ONE.'],
  fast: ['THANK YOU. NEXT PLEASE.', 'THANK YOU. ENJOY.'],
  other: ['THANK YOU.', 'THANK YOU. TAKE CARE.'],
};
// The comment when something in the basket is not what people usually buy at
// this hour. Said flatly, never as a joke, which is what makes it funny.
function shopinOddLine(I) {
  const b = I.basket;
  if (!b.length) return null;
  const count = {};
  for (let i = 0; i < b.length; i++) count[b[i].name] = (count[b[i].name] || 0) + 1;
  for (const k in count) if (count[k] >= 4) return 'FOUR OF THE SAME THING. NOTED.';
  const has = function (w) { for (let i = 0; i < b.length; i++) if (b[i].name.indexOf(w) >= 0) return true; return false; };
  const eff = function (e) { for (let i = 0; i < b.length; i++) if (b[i].effect === e) return true; return false; };
  if (has('UMBRELLA') && has('SOCKS')) return 'UMBRELLA AND SOCKS. YOU HAVE BEEN WALKING.';
  if (has('UMBRELLA')) return 'IT IS NOT RAINING. IT WILL BE.';
  if (has('TOOTHBRUSH')) return 'CAPSULE HOTEL. THEY NEVER HAVE THEM.';
  if (has('BATTERIES')) return 'AA. EVERYTHING GOOD TAKES AA.';
  if (has('WHISKY')) return 'THAT IS FOR SOMEBODY ELSE. I CAN TELL.';
  if (has('PLASTER')) return 'NEW SHOES OR OLD SHOES?';
  if (eff('gift')) return 'A PRESENT. GOOD. THEY WILL NOTICE.';
  if (b.length === 1 && b[0].price <= 2) return 'ONE THING. THAT IS ALLOWED.';
  if (b.length >= 7) return 'BIG BAG OR TWO SMALL ONES?';
  if (eff('warm') && eff('sugar')) return 'HOT AND SWEET. THAT IS A PLAN.';
  return null;
}

// ---------- the floor plan ----------
// Each kind of shop is laid out by hand rather than generated, because the
// order you meet things in is the whole feel of the room: you pass the till
// on the way in at a konbini, you queue past the pastry case at a coffee
// place, and at a burger place the menu is over your head before you have
// decided anything.
function shopinLayout(B) {
  const kind = B.kind || 'conv';
  const F = SHOPIN_FLOOR;
  const P = [];
  const push = function (o) { P.push(o); return o; };
  let w = 1180, tillX = 200, clerkName = 'CLERK';
  push({ kind: 'sidoor', x: 60, w: 76, h: 158, label: 'LEAVE', reach: 46 });
  push({ kind: 'sibell', x: 60, y: F - 172, w: 16, h: 18, over: true });
  if (kind === 'conv') {
    clerkName = 'THE CLERK';
    tillX = 176;
    push({ kind: 'sitill', x: 176, w: 134, h: 72, label: 'PAY', reach: 62 });
    push({ kind: 'sihot', x: 306, w: 110, h: 100, label: 'HOT FOOD', pick: 'hot', reach: 50 });
    push({ kind: 'sicoffee', x: 400, w: 58, h: 118, label: 'COFFEE MACHINE', reach: 36 });
    push({ kind: 'sicopier', x: 480, w: 66, h: 112, label: 'COPIER', reach: 34 });
    push({ kind: 'atm', x: 562, w: 54, h: 126, label: 'ATM', reach: 34 });
    push({ kind: 'simag', x: 650, w: 114, h: 142, label: 'MAGAZINES', reach: 46 });
    push({ kind: 'sishelf', x: 784, w: 130, h: 168, sign: 'SNACKS', label: 'SNACK SHELF', pick: 'food', reach: 56 });
    push({ kind: 'sishelf', x: 930, w: 126, h: 168, sign: 'DAILY', label: 'EVERYTHING ELSE', pick: 'item', reach: 56 });
    push({ kind: 'sifridge', x: 1076, w: 150, h: 204, sign: 'COLD DRINKS', label: 'DRINKS FRIDGE', pick: 'drink', reach: 64 });
    push({ kind: 'bin', x: 124, w: 26, h: 42, label: 'BIN', reach: 26 });
  } else if (kind === 'coffee') {
    clerkName = 'THE BARISTA';
    w = 1140; tillX = 1010;
    push({ kind: 'table', x: 196, w: 92, h: 56 });
    push({ kind: 'stool', x: 150, w: 26, h: 34 });
    push({ kind: 'stool', x: 244, w: 26, h: 34, label: 'SIT DOWN', reach: 30 });
    push({ kind: 'table', x: 350, w: 92, h: 56 });
    push({ kind: 'stool', x: 304, w: 26, h: 34 });
    push({ kind: 'stool', x: 398, w: 26, h: 34 });
    push({ kind: 'sicork', x: 500, w: 112, h: 118, label: 'NOTICEBOARD', reach: 42, y: F - 120 });
    push({ kind: 'sibeans', x: 626, w: 96, h: 116, label: 'THE BEANS', reach: 40 });
    push({ kind: 'sipastry', x: 752, w: 134, h: 96, label: 'PASTRY CASE', pick: 'food', reach: 60 });
    push({ kind: 'siespresso', x: 868, w: 98, h: 120, label: 'THE MACHINE', reach: 42 });
    push({ kind: 'simugs', x: 700, y: F - 210, w: 150, h: 24 });
    push({ kind: 'simenu', x: 892, y: F - 168, w: 232, h: 96, over: true, label: 'MENU', pick: 'drink', reach: 60 });
    push({ kind: 'sitill', x: 1010, w: 134, h: 72, label: 'ORDER', reach: 56 });
    push({ kind: 'plant', x: 1098, w: 40, h: 58 });
  } else if (kind === 'fast') {
    clerkName = 'THE CREW';
    w = 1120; tillX = 900;
    push({ kind: 'siplay', x: 194, w: 92, h: 128, label: 'PLAY AREA', reach: 40 });
    push({ kind: 'table', x: 320, w: 92, h: 56 });
    push({ kind: 'stool', x: 276, w: 26, h: 34, label: 'SIT DOWN', reach: 30 });
    push({ kind: 'stool', x: 366, w: 26, h: 34 });
    push({ kind: 'sitrays', x: 452, w: 66, h: 60, label: 'TRAYS', reach: 32 });
    push({ kind: 'sifountain', x: 556, w: 108, h: 138, label: 'DRINKS FOUNTAIN', pick: 'drink', reach: 50 });
    push({ kind: 'sifry', x: 690, w: 118, h: 116, label: 'FRY STATION', reach: 50 });
    push({ kind: 'sifastcounter', x: 900, w: 190, h: 76 });
    push({ kind: 'simenu', x: 900, y: F - 160, w: 260, h: 104, over: true, photo: true, label: 'MENU', pick: 'food', reach: 86 });
    push({ kind: 'sitill', x: 1020, w: 96, h: 72, label: 'PAY', reach: 52 });
    push({ kind: 'bin', x: 140, w: 30, h: 46, label: 'BIN', reach: 26 });
  } else {
    // everything else: a rail, a table, a mirror, and either a fitting room
    // or one more shelf depending on whether you could try it on
    clerkName = 'THE ASSISTANT';
    w = 1100; tillX = 912;
    const soft = kind === 'fashion' || kind === 'beauty';
    push({ kind: 'sishelf', x: 216, w: 132, h: 172, sign: 'NEW IN', label: 'SHELF', pick: 'any', reach: 56 });
    push({ kind: soft ? 'sirack' : 'sishelf', x: 376, w: 138, h: 172, sign: 'THE REST', label: soft ? 'THE RAIL' : 'SHELF', pick: 'item', reach: 58 });
    push({ kind: 'sidisplay', x: 540, w: 140, h: 62, sign: 'PICK ONE', label: 'DISPLAY TABLE', pick: 'any', reach: 58 });
    push({ kind: 'simirror', x: 672, w: 66, h: 148, label: 'MIRROR', reach: 36, y: F - 4 });
    if (soft) push({ kind: 'sifitting', x: 782, w: 96, h: 176, label: 'FITTING ROOM', reach: 44 });
    else push({ kind: 'sishelf', x: 782, w: 124, h: 172, sign: 'ALSO', label: 'SHELF', pick: 'any', reach: 54 });
    push({ kind: 'sitill', x: 912, w: 140, h: 72, label: 'PAY', reach: 66 });
    push({ kind: 'plant', x: 1014, w: 44, h: 62 });
  }
  return { w: w, props: P, tillX: tillX, clerkName: clerkName, kind: kind };
}

// ---------- picking a thing up ----------
function shopinOpenPanel(S, p) {
  const I = S.SI;
  if (!p.items || !p.items.length) return;
  I.panel = { p: p, idx: 0, scroll: 0, t: 0, rows: [], buy: null, close: null, bump: 0 };
  Audio.ui('select');
}
function shopinClosePanel(S) {
  const I = S.SI;
  if (!I.panel) return;
  I.panel = null;
  Audio.ui('back');
}
function shopinPanelMove(S, d) {
  const I = S.SI, P = I.panel, list = P.p.items;
  P.idx = (P.idx + d + list.length) % list.length;
  const vis = SHOPIN_ROWS;
  if (P.idx < P.scroll) P.scroll = P.idx;
  if (P.idx >= P.scroll + vis) P.scroll = P.idx - vis + 1;
  P.scroll = clamp(P.scroll, 0, Math.max(0, list.length - vis));
  Audio.ui('move');
}
// Taking a thing off the shelf costs nothing. It costs at the counter. What
// this does check is whether the basket you are already holding, plus this,
// is more money than you have, because putting things back at the till in
// front of a queue is a specific kind of bad day and the game can spare you.
function shopinBuy(S) {
  const I = S.SI, P = I.panel;
  if (!P) return;
  const it = P.p.items[P.idx];
  const r = Game.run;
  const would = shopinBasketTotal(I) + it.price;
  if (r && would > r.money) {
    Audio.ui('error');
    S.flash('THAT IS MORE THAN YOU HAVE. ' + fmtMoney(r.money) + ' LEFT.', 3);
    I.deny = 0.5;
    return;
  }
  if (I.basket.length >= 12) { Audio.ui('error'); S.flash('YOUR ARMS ARE FULL. GO AND PAY.', 3); return; }
  I.basket.push(it);
  P.bump = 1;
  Audio.ui('pop');
  S.flash(shopinShort(it.line || it.name, 68), 3.4);
  // a little something leaves the shelf and lands in the basket
  S.fx.burst(S.cam.sx(P.p.x), S.cam.sy(S.propY(P.p) - (P.p.h || 60) * 0.6), 6, { color: ['#ffd24a', '#f4f1ea'], speed: 60, life: 0.5, gravity: 220, size: 2 });
}
function shopinReturnAll(S) {
  const I = S.SI;
  I.basket = [];
  I.scan = null;
  Audio.ui('back');
  S.flash('YOU PUT IT ALL BACK. SLOWLY.', 3);
}

// ---------- the counter ----------
// One beep per item, a total, and then the part where you find out whether
// you can afford the evening.
function shopinTill(S) {
  const I = S.SI;
  if (I.scan) return;
  if (!I.basket.length) {
    const lines = ['NOTHING? THAT IS FINE.', 'THE HOT CASE IS BEHIND YOU.', 'TAKE YOUR TIME. IT IS QUIET.'];
    S.run([{ who: I.clerkName, voice: 'clerk', at: I.clerkName, text: lines[Math.floor(S.t * 3) % lines.length] }]);
    return;
  }
  I.panel = null;
  I.scan = { i: 0, t: 0, total: 0, shown: [], done: false, paid: false };
  S.locked = 99;
  S.cam.focus(I.tillX + 20, SHOPIN_FLOOR - 70, 1.3);
  I.clerkPose = 'play';
}
function shopinScanTick(S, dt) {
  const I = S.SI, K = I.scan;
  if (!K || K.done) return;
  K.t += dt;
  const step = 0.3;
  while (K.i < I.basket.length && K.t > (K.i + 1) * step) {
    const it = I.basket[K.i];
    K.total += it.price;
    K.shown.push(it);
    K.i++;
    Audio.ui('coin');
    S.fx.burst(S.cam.sx(I.tillX + 44), S.cam.sy(SHOPIN_FLOOR - 78), 4, { color: ['#e8503a', '#ffd24a'], speed: 42, life: 0.3, gravity: 0, size: 2 });
  }
  if (K.i >= I.basket.length && K.t > (K.i + 1) * step + 0.45 && !K.done) {
    K.done = true;
    shopinAskToPay(S);
  }
}
function shopinAskToPay(S) {
  const I = S.SI, K = I.scan;
  const r = Game.run, money = r ? r.money : 0;
  const odd = shopinOddLine(I);
  const script = [];
  script.push({ who: I.clerkName, voice: 'clerk', at: I.clerkName, text: String(I.basket.length) + ' ITEMS. ' + fmtMoney(K.total) + ', PLEASE.' });
  if (odd) script.push({ who: I.clerkName, voice: 'clerk', at: I.clerkName, text: odd });
  if (money < K.total) {
    script.push({ who: I.clerkName, voice: 'clerk', at: I.clerkName, text: 'TAKE YOUR TIME. IT HAPPENS.' });
    script.push({
      who: '', voice: false, at: 'you', think: true, text: 'YOU HAVE ' + fmtMoney(money) + '.',
      choices: [{ label: 'PUT IT ALL BACK', note: 'NOBODY IS WATCHING', go: function () { shopinReturnAll(S); shopinUnlock(S); } }],
    });
  } else {
    script.push({
      who: '', voice: false, at: 'you', think: true, text: 'YOU HAVE ' + fmtMoney(money) + '.',
      choices: [
        { label: 'PAY', note: fmtMoney(K.total), go: function () { shopinPay(S); } },
        { label: 'ACTUALLY, PUT IT BACK', note: 'ALL OF IT', go: function () { shopinReturnAll(S); shopinUnlock(S); } },
      ],
    });
  }
  S.run(script);
}
function shopinUnlock(S) {
  const I = S.SI;
  I.scan = null;
  I.clerkPose = null;
  S.locked = 0;
  S.cam.release(S.D.zoom || 1);
}
// Money off, effects on, receipt out. The receipt is the bit that makes the
// whole thing feel like it happened.
function shopinPay(S) {
  const I = S.SI, K = I.scan, r = Game.run;
  const lines = [];
  let stam = 0;
  for (let i = 0; i < I.basket.length; i++) {
    const it = I.basket[i];
    lines.push({ name: it.name, price: it.price });
    shopinApply(it);
    stam += it.stam || 0;
  }
  if (r) { r.money = Math.max(0, r.money - K.total); r.stats = r.stats || {}; r.save(); }
  Audio.ui('cash');
  I.receipt = { t: 0, lines: lines, total: K.total, hold: 3.4 };
  I.bought = I.bought.concat(I.basket);
  I.basket = [];
  I.scan = null;
  I.clerkPose = 'talk';
  S.flash(stam ? 'PAID. STAMINA +' + stam : 'PAID. ' + fmtMoney(r ? r.money : 0) + ' LEFT.', 3.4);
}

// ---------- the things that are not for sale ----------
// A shop is mostly objects you do not buy. They still have to answer when you
// press the button at them, or the room is a shelf with scenery round it.
const SHOPIN_FLAVOUR = {
  sicoffee: ['THE MACHINE ASKS HOT OR ICED.', 'IT ASKS AGAIN. IT WANTS TO BE SURE.'],
  sicopier: ['IT WILL PRINT A TRAIN TICKET, A CONCERT TICKET,', 'AND A COPY OF YOUR PASSPORT AT ONE IN THE MORNING.'],
  atm: ['IT SPEAKS SIX LANGUAGES AND CHARGES IN ALL OF THEM.'],
  bin: ['THREE SLOTS. YOU STAND THERE AND GET IT RIGHT.'],
  simag: ['SIXTY MAGAZINES. YOU CANNOT READ ONE WORD.', 'THE PICTURES ARE STILL DOING MOST OF THE WORK.'],
  sibeans: ['THREE HOPPERS. ALL THREE SMELL DIFFERENT.', 'THE MIDDLE ONE SMELLS LIKE A GOOD IDEA.'],
  siespresso: ['THE WAND SHRIEKS. EVERYBODY IGNORES IT.'],
  simugs: ['THIRTY MUGS. NOBODY DRINKS OUT OF THEM.'],
  sicork: ['FOUR BANDS LOOKING FOR A DRUMMER.', 'ONE ROOM TO LET. ONE CAT, MISSING SINCE MARCH.', 'YOU WRITE THE BAR NAME DOWN.'],
  sifry: ['THE TIMER SAYS TWELVE SECONDS AND HAS FOR A WHILE.'],
  sitrays: ['BROWN PLASTIC. WARM FROM THE WASHER.'],
  siplay: ['SHOES OFF, IT SAYS. A CHILD IS IN THERE ALONE,', 'AT THE TOP OF THE SLIDE, THINKING ABOUT IT.'],
  simirror: ['ELEVEN HOURS IN A PRESSURISED TUBE, FROM THE FRONT.'],
  sifitting: ['ONE CURTAIN, ONE STOOL, ONE HOOK.', 'THE HOOK IS THE IMPORTANT ONE.'],
  stool: ['YOU SIT DOWN FOR A MINUTE. JUST A MINUTE.'],
  plant: ['PLASTIC. WATERED ANYWAY, BY SOMEBODY, ONCE.'],
  table: ['A TABLE. SOMEBODY LEFT A NAPKIN ON IT.'],
};
function shopinFlavour(S, p) {
  const I = S.SI;
  const lines = SHOPIN_FLAVOUR[p.kind];
  if (!lines) { S.flash('NOTHING TO DO WITH THAT.', 2); return; }
  if (p.kind === 'stool' || p.kind === 'table') {
    // once. A minute off your feet is a minute, not a mechanic.
    if (p.sat) { S.run([{ who: '', voice: false, think: true, at: 'you', text: 'YOU ALREADY HAD YOUR MINUTE.' }]); return; }
    p.sat = true;
    const r = Game.run;
    if (r) r.stamina = clamp(r.stamina + 8, 0, r.staminaMax);
    S.run([{ who: '', voice: false, think: true, at: 'you', text: lines[0] }]);
    S.flash('STAMINA +8', 2.4);
    return;
  }
  S.run(lines.map(function (l) { return { who: '', voice: false, think: true, at: 'you', text: l }; }));
}

// ---------- the product panel ----------
// Not a list with prices after it. A shelf tag on the left, the thing itself
// on the right under a light, the sentence about what it does, and a button.
// The whole point is that you look at the object before you buy it.
const SHOPIN_ROWS = 9;
const SHOPIN_PW = 676;
const SHOPIN_PH = 404;
function shopinPanelBox() {
  const x = Math.round((W - SHOPIN_PW) / 2), y = Math.round((H - SHOPIN_PH) / 2) - 6;
  return { x: x, y: y, w: SHOPIN_PW, h: SHOPIN_PH };
}
function shopinDrawPanel(ctx, S, t) {
  const I = S.SI, P = I.panel, B = I.B;
  const box = shopinPanelBox();
  const k = clamp(P.t * 6, 0, 1), e = easeOut(k);
  ctx.globalAlpha = 0.66 * e; rect(ctx, 0, 0, W, H, '#07060f'); ctx.globalAlpha = 1;
  const bx = box.x, by = Math.round(lerp(H + 20, box.y, e)), bw = box.w, bh = box.h;
  const c1 = B.col || '#2f6fc0', c2 = B.col2 || '#f4f1ea';
  ctx.fillStyle = 'rgba(6,4,12,0.55)'; ctx.fillRect(bx + 6, by + 8, bw, bh);
  rect(ctx, bx, by, bw, bh, '#12101c');
  rect(ctx, bx + 2, by + 2, bw - 4, bh - 4, darken(c1, 0.45));
  rect(ctx, bx + 4, by + 4, bw - 8, bh - 8, '#f2eee2');
  rect(ctx, bx + 4, by + 4, bw - 8, 1, '#ffffff');
  // ---- header: the brand, and how much money you have left, side by side
  rect(ctx, bx + 4, by + 4, bw - 8, 34, c1);
  rect(ctx, bx + 4, by + 4, bw - 8, 2, lighten(c1, 0.35));
  rect(ctx, bx + 4, by + 36, bw - 8, 2, darken(c1, 0.45));
  brandLogo(ctx, bx + 24, by + 21, 12, B, t);
  drawText(ctx, B.name, bx + 42, by + 14, c2, { scale: 2 });
  if (P.p.sign || P.p.label) drawText(ctx, P.p.sign || P.p.label, bx + 42, by + 28, withAlpha(c2, 0.7), { font: 'small' });
  const money = Game.run ? Game.run.money : 0;
  drawText(ctx, fmtMoney(money), bx + bw - 14, by + 14, '#ffd24a', { align: 'right', scale: 2, shadow: darken(c1, 0.5) });
  drawText(ctx, 'IN YOUR POCKET', bx + bw - 14, by + 28, withAlpha(c2, 0.6), { align: 'right', font: 'small' });
  // ---- the shelf tags down the left
  const list = P.p.items;
  P.rows = [];
  const lx = bx + 12, ly = by + 46, lw = 300, rh = 30;
  rect(ctx, lx - 2, ly - 2, lw + 4, SHOPIN_ROWS * rh + 4, '#ddd6c6');
  for (let i = 0; i < SHOPIN_ROWS; i++) {
    const n = P.scroll + i;
    if (n >= list.length) break;
    const it = list[n], ry = ly + i * rh, on = n === P.idx;
    const inBasket = (function () { let c = 0; for (let q = 0; q < I.basket.length; q++) if (I.basket[q] === it) c++; return c; })();
    rect(ctx, lx, ry, lw, rh - 2, on ? '#ffd24a' : (i % 2 ? '#e8e2d2' : '#f2eee2'));
    if (on) { rect(ctx, lx, ry, 4, rh - 2, '#c8402c'); rect(ctx, lx, ry, lw, 1, '#fff6c8'); }
    rect(ctx, lx + 6, ry + 3, 24, 24, on ? '#5a4210' : '#cfc6b2');
    drawShopItem(ctx, lx + 18, ry + 15, 10, it);
    let nm = it.name, sc = 2;
    const room = lw - 44 - 52;
    while (sc > 1 && textWidth(nm, { scale: sc }) > room) sc--;
    while (nm.length > 5 && textWidth(nm, { scale: sc }) > room) nm = nm.slice(0, -1);
    drawText(ctx, nm, lx + 36, ry + Math.floor((rh - 2 - 7 * sc) / 2), on ? '#2a1a08' : '#4a4038', { scale: sc });
    drawText(ctx, fmtMoney(it.price), lx + lw - 8, ry + 9, on ? '#5a3a10' : '#8a7a5e', { align: 'right', scale: 2 });
    if (inBasket) { rect(ctx, lx + lw - 20, ry + 2, 16, 11, '#2f8f4a'); drawText(ctx, 'X' + inBasket, lx + lw - 12, ry + 4, '#f4f1ea', { align: 'center', font: 'small' }); }
    P.rows.push({ x: lx, y: ry, w: lw, h: rh - 2, n: n });
  }
  // the scrollbar, which is also how you know there is more shelf
  if (list.length > SHOPIN_ROWS) {
    const th = Math.max(20, (SHOPIN_ROWS / list.length) * (SHOPIN_ROWS * rh));
    const tt = (P.scroll / Math.max(1, list.length - SHOPIN_ROWS)) * (SHOPIN_ROWS * rh - th);
    rect(ctx, lx + lw + 4, ly, 5, SHOPIN_ROWS * rh, '#ddd6c6');
    rect(ctx, lx + lw + 4, ly + tt, 5, th, c1);
    rect(ctx, lx + lw + 4, ly + tt, 5, 1, lighten(c1, 0.4));
  }
  // ---- the thing itself, on the right, under a light
  const it = list[P.idx];
  const rx = bx + 330, rw = bw - 330 - 14;
  rect(ctx, rx, by + 46, rw, 134, '#1b1728');
  rect(ctx, rx, by + 46, rw, 2, '#3a3450');
  ctx.globalAlpha = 0.5; vgrad(ctx, rx + 2, by + 48, rw - 4, 130, '#3a3450', '#100e1a'); ctx.globalAlpha = 1;
  // a downlight, a plinth, and a shadow under the product
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#ffe9a8'; ctx.beginPath();
  ctx.moveTo(rx + rw / 2 - 16, by + 48); ctx.lineTo(rx + rw / 2 + 16, by + 48); ctx.lineTo(rx + rw / 2 + 54, by + 168); ctx.lineTo(rx + rw / 2 - 54, by + 168); ctx.fill();
  ctx.globalAlpha = 1;
  rect(ctx, rx + 24, by + 166, rw - 48, 8, '#2a2438');
  rect(ctx, rx + 24, by + 166, rw - 48, 2, '#4a4060');
  ctx.globalAlpha = 0.34; ellipsePx(ctx, rx + rw / 2, by + 168, 40, 6, '#000000'); ctx.globalAlpha = 1;
  const pop = 1 + (P.bump > 0 ? Math.sin(P.bump * Math.PI) * 0.16 : 0);
  drawShopItem(ctx, rx + rw / 2, by + 118 - Math.sin(t * 2) * 2, 40 * pop, it);
  // ---- name, price, and the sentence
  const nameLines = wrapText(it.name, 22);
  for (let i = 0; i < Math.min(2, nameLines.length); i++) drawText(ctx, nameLines[i], rx + rw / 2, by + 186 + i * 17, '#2a2438', { align: 'center', scale: 2 });
  drawText(ctx, fmtMoney(it.price), rx + 8, by + 222, c1, { align: 'left', scale: 4, shadow: withAlpha('#000000', 0.2) });
  if (it.stam) { rect(ctx, rx + rw - 88, by + 224, 80, 18, '#2f8f4a'); rect(ctx, rx + rw - 88, by + 224, 80, 1, '#6be585'); drawText(ctx, 'STAMINA +' + it.stam, rx + rw - 48, by + 229, '#f4f1ea', { align: 'center', font: 'small' }); }
  const desc = wrapText(it.line || 'IT IS EXACTLY WHAT IT LOOKS LIKE.', 46);
  for (let i = 0; i < Math.min(3, desc.length); i++) drawText(ctx, desc[i], rx + 8, by + 254 + i * 9, '#6b5138', { font: 'small' });
  // what kind of thing it is, as two little chips
  const chip = function (cx, label, col) { const cw = textWidth(label, { font: 'small' }) + 10; rect(ctx, cx, by + 284, cw, 14, col); rect(ctx, cx, by + 284, cw, 1, lighten(col, 0.3)); drawText(ctx, label, cx + 5, by + 288, '#f4f1ea', { font: 'small' }); return cx + cw + 5; };
  let chx = rx + 8;
  chx = chip(chx, String(it.kind || 'THING').toUpperCase(), '#5a5068');
  if (it.effect) {
    const eff = (typeof SHOP_EFFECTS !== 'undefined' && SHOP_EFFECTS[it.effect]) ? SHOP_EFFECTS[it.effect].name : String(it.effect).toUpperCase();
    chx = chip(chx, eff, '#8a5a1a');
  }
  // ---- the button, and what is already in your arms
  const afford = !Game.run || (shopinBasketTotal(I) + it.price) <= Game.run.money;
  const bw2 = 168, bh2 = 40, bxx = rx + 8, byy = by + 304;
  P.buy = { x: bxx, y: byy, w: bw2, h: bh2 };
  uiButton(ctx, bxx, byy, bw2, bh2, afford ? 'TAKE ONE' : 'TOO MUCH', afford ? (I.deny > 0 ? 'down' : 'normal') : 'disabled', { scale: 3, color: afford ? UI.green : undefined });
  const bt = shopinBasketTotal(I);
  rect(ctx, bxx + bw2 + 8, byy, rw - bw2 - 16, bh2, '#ddd6c6');
  rect(ctx, bxx + bw2 + 8, byy, rw - bw2 - 16, 1, '#f2eee2');
  drawText(ctx, 'BASKET', bxx + bw2 + 16, byy + 7, '#8a7a5e', { font: 'small' });
  drawText(ctx, String(I.basket.length) + ' - ' + fmtMoney(bt), bxx + bw2 + 16, byy + 18, '#3a2a1a', { scale: 2 });
  // ---- the bottom rail
  rect(ctx, bx + 4, by + bh - 30, bw - 8, 26, '#ddd6c6');
  rect(ctx, bx + 4, by + bh - 30, bw - 8, 1, '#f2eee2');
  drawText(ctx, Game.touch ? 'TAP OUTSIDE TO PUT IT DOWN' : 'UP / DOWN TO LOOK - ENTER TO TAKE - ESC TO PUT IT DOWN', bx + 14, by + bh - 22, '#8a7a5e', { font: 'small' });
  drawText(ctx, 'TILL IS BY THE DOOR', bx + bw - 14, by + bh - 22, '#8a7a5e', { align: 'right', font: 'small' });
  P.close = { x: bx + bw - 30, y: by + 10, w: 20, h: 20 };
  uiCloseBox(ctx, bx + bw - 26, by + 13);
}

// ---------- what you are carrying, while you are carrying it ----------
// A basket drawn in the corner with the actual things in it, so you never
// have to open a menu to remember what you picked up.
function shopinDrawBasket(ctx, S, t) {
  const I = S.SI;
  if (!I.basket.length) return;
  const n = I.basket.length, total = shopinBasketTotal(I);
  const bw = 40 + Math.min(n, 8) * 22, bh = 42;
  const bx = W - bw - 12, by = H - bh - 98;
  ctx.fillStyle = 'rgba(8,6,14,0.55)'; ctx.fillRect(bx + 3, by + 4, bw, bh);
  rect(ctx, bx, by, bw, bh, '#3a3440');
  rect(ctx, bx + 2, by + 2, bw - 4, bh - 4, '#5c5468');
  rect(ctx, bx + 2, by + 2, bw - 4, 1, '#7a7288');
  // the wire basket every konbini stacks by the door
  for (let i = 0; i < bw; i += 6) { ctx.globalAlpha = 0.3; rect(ctx, bx + i, by + 2, 1, bh - 4, '#241d33'); ctx.globalAlpha = 1; }
  for (let i = 0; i < Math.min(n, 8); i++) {
    const it = I.basket[n - 1 - i];
    drawShopItem(ctx, bx + 16 + i * 22, by + 20, 9, it);
  }
  if (n > 8) drawText(ctx, '+' + (n - 8), bx + bw - 26, by + 16, '#ffd24a', { font: 'small' });
  rect(ctx, bx, by - 14, bw, 14, '#12101c');
  drawText(ctx, String(n) + ' ITEMS', bx + 5, by - 11, '#cfc9e6', { font: 'small' });
  drawText(ctx, fmtMoney(total), bx + bw - 5, by - 11, '#ffd24a', { align: 'right', font: 'small' });
}

// ---------- the scan ----------
// A green display, a line per item, one beep each. The pleasure of this is
// entirely in watching the number climb and not being able to stop it.
function shopinDrawScan(ctx, S, t) {
  const I = S.SI, K = I.scan;
  const bw = 420, bh = 168;
  const bx = Math.round(W / 2 - bw / 2), by = H - bh - 92;
  ctx.fillStyle = 'rgba(6,4,12,0.5)'; ctx.fillRect(bx + 5, by + 6, bw, bh);
  rect(ctx, bx, by, bw, bh, '#2a2c34');
  rect(ctx, bx + 2, by + 2, bw - 4, bh - 4, '#3a3f46');
  rect(ctx, bx + 2, by + 2, bw - 4, 2, '#5c626c');
  rect(ctx, bx + 8, by + 8, bw - 16, bh - 16, '#08140c');
  frame(ctx, bx + 8, by + 8, bw - 16, bh - 16, '#101820');
  // the phosphor lines
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < bh - 16; i += 3) rect(ctx, bx + 8, by + 8 + i, bw - 16, 1, '#000000');
  ctx.globalAlpha = 1;
  drawText(ctx, I.B.name, bx + 16, by + 14, '#2f8f4a', { font: 'small' });
  drawText(ctx, 'REG 1', bx + bw - 16, by + 14, '#2f8f4a', { align: 'right', font: 'small' });
  const show = K.shown.slice(-6);
  for (let i = 0; i < show.length; i++) {
    const it = show[i], ly = by + 26 + i * 15;
    const fresh = (i === show.length - 1) && (K.t - K.i * 0.3) < 0.14;
    const col = fresh ? '#c8ffc8' : '#6be585';
    let nm = it.name;
    while (nm.length > 4 && textWidth(nm, { scale: 1 }) > bw - 110) nm = nm.slice(0, -1);
    drawText(ctx, nm, bx + 16, ly, col, { scale: 1 });
    drawText(ctx, fmtMoney(it.price), bx + bw - 18, ly, col, { align: 'right', scale: 1 });
    if (fresh) { ctx.globalAlpha = 0.22; rect(ctx, bx + 10, ly - 2, bw - 20, 11, '#6be585'); ctx.globalAlpha = 1; }
  }
  rect(ctx, bx + 12, by + bh - 44, bw - 24, 1, '#2f8f4a');
  drawText(ctx, 'TOTAL', bx + 16, by + bh - 34, '#2f8f4a', { scale: 2 });
  drawText(ctx, fmtMoney(K.total), bx + bw - 18, by + bh - 38, '#8bff9b', { align: 'right', scale: 4 });
  if (!K.done) { ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 14); drawText(ctx, String(K.i) + ' / ' + I.basket.length, bx + bw / 2, by + bh - 32, '#6be585', { align: 'center', font: 'small' }); ctx.globalAlpha = 1; }
}

// ---------- the receipt ----------
// Printed at the speed a thermal printer actually prints, which is one line
// at a time and faster than you can read it.
function shopinDrawReceipt(ctx, S, t) {
  const I = S.SI, R = I.receipt;
  const rw = 220;
  const rows = R.lines.length;
  const rh = 46 + rows * 11 + 62;
  const slot = clamp(S.cam.sx(I.tillX + 10), rw / 2 + 14, W - rw / 2 - 14);
  const outK = easeOut(clamp(R.t / 1.1, 0, 1));
  const goK = clamp((R.t - R.hold) / 0.5, 0, 1);
  const baseY = S.cam.sy(SHOPIN_FLOOR - 92);
  const y = Math.round(baseY - rh * outK - goK * 120);
  const x = Math.round(slot - rw / 2 + goK * (W - slot - rw / 2));
  ctx.globalAlpha = 1 - goK * 0.85;
  ctx.fillStyle = 'rgba(6,4,12,0.4)'; ctx.fillRect(x + 4, y + 5, rw, rh);
  rect(ctx, x, y, rw, rh, '#faf7ee');
  ctx.globalAlpha = (1 - goK * 0.85) * 0.4; ctx.fillStyle = paperTexture(); ctx.fillRect(x, y, rw, rh); ctx.globalAlpha = 1 - goK * 0.85;
  rect(ctx, x, y, rw, 1, '#ffffff');
  // the torn bottom edge
  for (let i = 0; i < rw; i += 6) rect(ctx, x + i, y + rh - 3, 3, 3 + ((i / 6) % 2 ? 2 : 0), '#faf7ee');
  rect(ctx, x + rw - 1, y, 1, rh, '#ddd6c6');
  drawText(ctx, I.B.name, x + rw / 2, y + 8, '#241d28', { align: 'center', scale: 2 });
  drawText(ctx, I.B.tag || 'THANK YOU', x + rw / 2, y + 24, '#8a8478', { align: 'center', font: 'small' });
  dashedLine(ctx, x + 8, y + 34, x + rw - 8, y + 34, '#c8c0ae', 3, 3, 0);
  const shown = Math.min(rows, Math.floor(R.t * 14));
  for (let i = 0; i < shown; i++) {
    const L = R.lines[i], ly = y + 40 + i * 11;
    let nm = L.name;
    while (nm.length > 4 && textWidth(nm, { scale: 1 }) > rw - 70) nm = nm.slice(0, -1);
    drawText(ctx, nm, x + 10, ly, '#3a2a1a', { scale: 1 });
    drawText(ctx, fmtMoney(L.price), x + rw - 10, ly, '#3a2a1a', { align: 'right', scale: 1 });
  }
  if (shown >= rows) {
    const ty = y + 44 + rows * 11;
    dashedLine(ctx, x + 8, ty, x + rw - 8, ty, '#c8c0ae', 3, 3, 0);
    drawText(ctx, 'TOTAL', x + 10, ty + 8, '#241d28', { scale: 2 });
    drawText(ctx, fmtMoney(R.total), x + rw - 10, ty + 8, '#241d28', { align: 'right', scale: 2 });
    drawText(ctx, 'CASH', x + 10, ty + 24, '#8a8478', { font: 'small' });
    drawText(ctx, fmtMoney(R.total), x + rw - 10, ty + 24, '#8a8478', { align: 'right', font: 'small' });
    // the barcode, and the line at the bottom of every receipt on earth
    const r = makeRng(hashStr(I.B.id + R.total + rows));
    for (let i = 0; i < rw - 40; i++) if (r.chance(0.5)) rect(ctx, x + 20 + i, ty + 36, 1, 16, '#241d28');
    drawText(ctx, 'THANK YOU', x + rw / 2, ty + 56, '#8a8478', { align: 'center', font: 'small' });
  }
  ctx.globalAlpha = 1;
}

// ---------- the back of the room ----------
// The things on the wall that you never look at directly and would miss
// immediately if they were gone.
function shopinBackdrop(ctx, S, t) {
  const I = S.SI, B = I.B, kind = I.kind;
  const F = SHOPIN_FLOOR, C = SHOPIN_CEIL;
  const x0 = S.cam.wx(-40), x1 = S.cam.wx(W + 40);
  if (kind === 'conv') {
    // the window onto the concourse, and the people who do not come in
    const wx = 130, ww = 210;
    glassWall(ctx, wx, C + 20, ww, 150, t, { tint: '#2c4c60', top: '#a8d0e8', bot: '#24384a', mullion: 70, rail: 150 });
    ctx.save(); ctx.beginPath(); ctx.rect(wx, C + 20, ww, 150); ctx.clip();
    for (let i = 0; i < 6; i++) {
      const ox = ((t * 13 + i * 61) % (ww + 60)) - 30;
      ctx.globalAlpha = 0.34;
      ellipsePx(ctx, wx + ox, C + 128, 9, 22, '#101828');
      ellipsePx(ctx, wx + ox, C + 100, 7, 8, '#101828');
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    rect(ctx, wx - 4, C + 16, ww + 8, 4, '#8a8f98');
    // the posters taped to the inside of the glass, facing out, backs to you
    for (let i = 0; i < 3; i++) { rect(ctx, wx + 16 + i * 64, C + 36, 44, 58, '#f2eee2'); ctx.globalAlpha = 0.5; rect(ctx, wx + 16 + i * 64, C + 36, 44, 58, '#c8ccd2'); ctx.globalAlpha = 1; frame(ctx, wx + 16 + i * 64, C + 36, 44, 58, '#c8c0ae'); }
    // the security mirror in the corner, which shows the whole aisle at once
    const mx = 900;
    circle(ctx, mx, C + 46, 26, '#5c626c');
    circle(ctx, mx, C + 46, 23, '#8fb0c8');
    ctx.globalAlpha = 0.5; circle(ctx, mx - 6, C + 40, 12, '#cfe4f0'); ctx.globalAlpha = 1;
    ringPx(ctx, mx, C + 46, 24, '#3a3f46');
    // the clock nobody in here is allowed to look at
    circle(ctx, 500, C + 40, 16, '#f4f1ea');
    ringPx(ctx, 500, C + 40, 16, '#3a3f46');
    rect(ctx, 499, C + 30, 2, 11, '#241d28');
    rect(ctx, 500, C + 39, 9, 2, '#c8402c');
    // banners hung off the ceiling grid, angled at the aisle
    for (let i = 0; i < 4; i++) {
      const bx = 380 + i * 210;
      if (bx < x0 - 120 || bx > x1 + 120) continue;
      rect(ctx, bx, C, 2, 26, '#6a7079');
      rect(ctx, bx - 46, C + 24, 92, 34, i % 2 ? '#c8402c' : B.col);
      rect(ctx, bx - 46, C + 24, 92, 2, '#ffffff');
      drawText(ctx, i % 2 ? 'NEW' : 'HOT', bx, C + 32, '#f4f1ea', { align: 'center', scale: 2 });
      drawText(ctx, i % 2 ? 'THIS WEEK' : 'FROM THE CASE', bx, C + 48, withAlpha('#f4f1ea', 0.75), { align: 'center', font: 'small' });
    }
  } else if (kind === 'coffee') {
    // white tile behind the bar, a wooden rail, and the chalk nobody redrew
    rect(ctx, 600, C + 24, 520, F - C - 40, '#e8e4da');
    for (let gy = C + 24; gy < F - 16; gy += 18) { rect(ctx, 600, gy, 520, 1, '#cfc8ba'); for (let gx = 600 + ((Math.round(gy / 18) % 2) * 13); gx < 1120; gx += 26) rect(ctx, gx, gy - 17, 1, 17, '#d8d2c2'); }
    rect(ctx, 600, C + 20, 520, 5, '#6a4a2e');
    rect(ctx, 120, C + 30, 340, 110, '#3a2a1e');
    for (let i = 0; i < 4; i++) rect(ctx, 130 + i * 84, C + 34, 76, 102, '#2a1e16');
    // framed things on the wall: a map, a photograph, two prints of beans
    for (let i = 0; i < 4; i++) {
      const fx = 136 + i * 84;
      rect(ctx, fx, C + 40, 64, 84, '#8a6440');
      rect(ctx, fx + 4, C + 44, 56, 76, ['#cfc8ba', '#6a8a70', '#d8c4a0', '#8a7a5e'][i]);
      for (let k = 0; k < 4; k++) rect(ctx, fx + 8, C + 52 + k * 14, 48 - k * 8, 3, withAlpha('#3a2a1a', 0.5));
    }
    // the rain on the window, because it is always raining when you arrive
    glassWall(ctx, 500, C + 30, 84, 130, t, { tint: '#2c4050', top: '#8aa8c0', bot: '#1b2a38', mullion: 84, rail: 130 });
    ctx.save(); ctx.beginPath(); ctx.rect(500, C + 30, 84, 130); ctx.clip();
    for (let i = 0; i < 18; i++) { const r = makeRng(hashStr('rain' + i)); const rx2 = 500 + r() * 84, ry = C + 30 + ((t * (40 + r() * 60) + r() * 130) % 130); ctx.globalAlpha = 0.4; rect(ctx, rx2, ry, 1, 7, '#cfe4f0'); ctx.globalAlpha = 1; }
    ctx.restore();
  } else if (kind === 'fast') {
    // the kitchen band, seen over the counter, lit hard and white
    rect(ctx, 760, C + 20, 360, F - C - 34, '#e8e4da');
    for (let gy = C + 20; gy < F - 14; gy += 16) rect(ctx, 760, gy, 360, 1, '#cfc8ba');
    rect(ctx, 760, C + 16, 360, 6, '#c8402c');
    for (let i = 0; i < 3; i++) { rect(ctx, 780 + i * 110, C + 40, 90, 60, '#b9bec6'); rect(ctx, 780 + i * 110, C + 40, 90, 3, '#dfe6ea'); rect(ctx, 786 + i * 110, C + 48, 78, 40, '#8a8f98'); }
    ctx.globalAlpha = 0.35; rect(ctx, 760, C + 22, 360, 30, '#ffffff'); ctx.globalAlpha = 1;
    // a wall of yellow and red stripes down the seating end
    for (let i = 0; i < 12; i++) rect(ctx, 120 + i * 50, C + 24, 26, F - C - 40, i % 2 ? '#f2c94c' : '#e8e4da');
    rect(ctx, 120, C + 24, 600, 8, '#c8402c');
    // the queue rail, in front of the counter, going nowhere
    for (let i = 0; i < 4; i++) { const px2 = 740 + i * 52; rect(ctx, px2, F - 46, 4, 46, '#8a8f98'); ellipsePx(ctx, px2 + 2, F - 48, 6, 4, '#3a3f46'); }
    for (let i = 0; i < 3; i++) rect(ctx, 742 + i * 52, F - 42, 52, 3, '#c8402c');
  } else {
    // a shop with a back wall of shelving, a track of little lamps and two
    // posters of somebody far more relaxed about all this than you are
    rect(ctx, 150, C + 26, 820, F - C - 42, darken(I.wall, 0.08));
    for (let gy = C + 40; gy < F - 30; gy += 30) { rect(ctx, 150, gy, 820, 3, '#b9b0a0'); ctx.globalAlpha = 0.25; rect(ctx, 150, gy + 3, 820, 6, '#000000'); ctx.globalAlpha = 1; }
    rect(ctx, 150, C + 18, 820, 6, '#8a8f98');
    for (let i = 0; i < 7; i++) { const lx = 190 + i * 120; rect(ctx, lx, C + 12, 8, 10, '#3a3f46'); ctx.globalAlpha = 0.1; ctx.fillStyle = '#ffe9a8'; ctx.beginPath(); ctx.moveTo(lx, C + 22); ctx.lineTo(lx + 8, C + 22); ctx.lineTo(lx + 40, F); ctx.lineTo(lx - 32, F); ctx.fill(); ctx.globalAlpha = 1; }
    for (let i = 0; i < 2; i++) {
      const px2 = 260 + i * 460;
      rect(ctx, px2, C + 36, 96, 124, '#f4f1ea');
      frame(ctx, px2, C + 36, 96, 124, '#8a8478');
      rect(ctx, px2 + 4, C + 40, 88, 84, B.col);
      ctx.globalAlpha = 0.35; ellipsePx(ctx, px2 + 48, C + 78, 26, 32, '#ffffff'); ctx.globalAlpha = 1;
      drawText(ctx, B.name, px2 + 48, C + 132, '#3a2a1a', { align: 'center', font: 'small' });
      drawText(ctx, 'NEW SEASON', px2 + 48, C + 144, '#8a8478', { align: 'center', font: 'small' });
    }
  }
}

// The low run of fixtures between you and the camera. It is one aisle nearer
// than you are, it is out of focus, and it is the thing that makes a flat
// side view read as a room with depth in it.
function shopinForeground(ctx, S, t) {
  const I = S.SI, kind = I.kind;
  const x0 = S.cam.wx(-60), x1 = S.cam.wx(W + 60);
  const y = SHOPIN_FLOOR + 86;
  if (kind === 'coffee') {
    rect(ctx, x0, y + 10, x1 - x0, 14, '#4a2f1c');
    rect(ctx, x0, y + 10, x1 - x0, 3, '#6a4428');
    for (let gx = Math.floor(x0 / 120) * 120; gx < x1; gx += 120) { rect(ctx, gx, y + 24, 12, 80, '#3a2418'); rect(ctx, gx, y + 24, 3, 80, '#5a3a24'); }
  } else if (kind === 'fast') {
    for (let gx = Math.floor(x0 / 90) * 90; gx < x1; gx += 90) { rect(ctx, gx, y - 10, 5, 70, '#8a8f98'); ellipsePx(ctx, gx + 2, y - 12, 7, 4, '#3a3f46'); }
    rect(ctx, x0, y - 4, x1 - x0, 4, '#c8402c');
  } else {
    rect(ctx, x0, y, x1 - x0, 10, '#9aa2aa');
    rect(ctx, x0, y, x1 - x0, 3, '#c0c8d0');
    rect(ctx, x0, y + 10, x1 - x0, 94, '#cfd6de');
    for (let gx = Math.floor(x0 / 22) * 22; gx < x1; gx += 22) {
      const hh = 14 + ((Math.abs(Math.round(gx / 22)) * 7) % 10);
      const c = ['#c8402c', '#2f8f4a', '#f2c94c', '#8ad8ff', '#f4f1ea', '#e8a03a'][Math.abs(Math.round(gx / 22)) % 6];
      rect(ctx, gx + 4, y - hh, 15, hh, c);
      rect(ctx, gx + 4, y - hh, 15, 2, lighten(c, 0.35));
      rect(ctx, gx + 4, y - Math.round(hh * 0.45), 15, Math.round(hh * 0.3), '#f4f1ea');
    }
  }
  // out of focus, in the cheapest and most convincing way there is
  ctx.globalAlpha = 0.28;
  rect(ctx, x0, y - 40, x1 - x0, 160, '#0d0b14');
  ctx.globalAlpha = 1;
}

// ---------- leaving ----------
// You cannot walk out holding a basket. The clerk will not chase you or
// accuse you; they will simply point out where the till is, in the flattest
// voice available, which is worse.
function shopinTryLeave(S) {
  const I = S.SI;
  if (I.scan || I.receipt) return;
  if (I.basket.length) {
    const total = shopinBasketTotal(I);
    S.run([
      { who: I.clerkName, voice: 'clerk', at: I.clerkName, text: 'EXCUSE ME. THE TILL IS OVER HERE.' },
      {
        who: '', voice: false, think: true, at: 'you',
        text: 'YOU ARE HOLDING ' + I.basket.length + ' THINGS.',
        choices: [
          { label: 'GO AND PAY', note: fmtMoney(total), go: function () { S.walkTo(I.tillX + 52, 0, function () { shopinTill(S); }); } },
          { label: 'PUT IT ALL BACK', note: 'AND LEAVE', go: function () { shopinReturnAll(S); } },
        ],
      },
    ]);
    return;
  }
  const bye = SHOPIN_BYE[I.kind] || SHOPIN_BYE.other;
  const line = I.bought.length ? bye[0] : (bye[bye.length - 1] || 'THANK YOU.');
  S.run([{ who: I.clerkName, voice: 'clerk', at: I.clerkName, text: line }], function () {
    Voice.chime('shop');
    S.leave(S.SIback, 'slideR', { dur: 0.5 });
  });
}

// ---------- the definition ----------
function shopinDef(B) {
  const L = shopinLayout(B);
  const kind = L.kind;
  const F = SHOPIN_FLOOR;
  const look = (typeof SHOP_KIND_LOOK !== 'undefined' && SHOP_KIND_LOOK[kind]) ? SHOP_KIND_LOOK[kind] : { name: 'A SHOP' };
  // whoever is behind the counter, plus two people who were here first
  const npcs = [
    { name: L.clerkName, x: L.tillX + 4, y: F - 10, floor: 0, voice: 'clerk', scale: 1.42, act: 'till', tag: 'TAKE YOUR TIME.' },
  ];
  const r = makeRng(hashStr(B.id + 'people'));
  const browseLines = {
    conv: [['THE HOT CASE IS THE ONLY REASON', 'ANYBODY COMES IN AT THIS HOUR.'], ['I AM BUYING A SHIRT. IN A SHOP', 'THAT ALSO SELLS SOUP. THIS IS FINE.']],
    coffee: [['THEY SPELLED IT WRONG AGAIN.', 'I HAVE STOPPED CORRECTING THEM.'], ['FOUR HOURS. ONE COFFEE.', 'IT IS A SYSTEM.']],
    fast: [['THE ICE MACHINE IS THE BEST ONE', 'IN THE WHOLE BUILDING.'], ['I AM NOT EVEN FLYING TODAY.']],
    other: [['I CAME IN FOR ONE THING.'], ['DO NOT LOOK AT ME. LOOK AT THE SHELF.']],
  };
  const lines = browseLines[kind] || browseLines.other;
  for (let i = 0; i < 2; i++) {
    const cx = 380 + i * 300;
    npcs.push({
      name: i ? 'A SHOPPER' : 'SOMEBODY', x: cx, floor: 0, voice: i ? 'you' : 'guard',
      scale: 1.36, speed: r.range(14, 22), walk: [cx - r.range(50, 110), cx + r.range(50, 110)],
      carry: r.chance(0.5) ? 'bag' : null, tag: lines[i % lines.length],
    });
  }
  return {
    name: B.name, sub: look.name + ' - ' + (B.tag || ''), tint: B.col || '#2f6fc0',
    w: L.w, zoom: 1.15, yBias: 0.66, hud: true, canLeave: false, freeFloors: false, heroScale: 1.6, speed: 116,
    start: { x: 132, floor: 0 },
    floors: [{ y: F, z: 1 }],
    props: L.props,
    npcs: npcs,
    sky: function (ctx, S) { rect(ctx, 0, 0, W, H, S.SI ? S.SI.ceilCol : '#e8e4da'); },
    // ---------- the room, from the back forward
    mid: function (ctx, S, t) {
      const I = S.SI;
      const x0 = S.cam.wx(-40), x1 = S.cam.wx(W + 40);
      shopinWall(ctx, S, t);
      shopinBackdrop(ctx, S, t);
      sideFloor(ctx, x0, x1, F, { h: 200, col: I.floorCol, col2: darken(I.floorCol, 0.1), lip: lighten(I.floorCol, 0.3), tile: 46, shine: true, grout: true });
      shopinCeiling(ctx, S, t);
    },
    fore: function (ctx, S, t) { shopinForeground(ctx, S, t); },
    // ---------- the grade, which is the difference between a bright room and a lit one
    after: function (ctx, S, t) {
      const I = S.SI;
      grade(ctx, 0, 0, W, H, I.gradeCol, I.gradeAmt, 'overlay');
      vignette(ctx, I.vig, '#0a0814');
      if (I.enterFlash > 0) { ctx.globalAlpha = I.enterFlash * 0.35; rect(ctx, 0, 0, W, H, '#ffffff'); ctx.globalAlpha = 1; }
      void t;
    },
    // ---------- everything the room says about itself
    overlay: function (ctx, S, t) {
      const I = S.SI;
      if (!I.panel && !I.scan) shopinDrawBasket(ctx, S, t);
      if (I.scan) shopinDrawScan(ctx, S, t);
      if (I.receipt) shopinDrawReceipt(ctx, S, t);
      if (I.panel) shopinDrawPanel(ctx, S, t);
      // the one sentence about what it is genuinely like to stand in here
      if (I.blurbT > 0 && B.blurb) {
        const a = clamp(I.blurbT, 0, 1) * clamp((5.2 - I.blurbT) * 2, 0, 1);
        ctx.globalAlpha = a;
        const lines2 = wrapText(String(B.blurb).toUpperCase(), 52);
        const bw = 520, bh = 16 + lines2.length * 12;
        rect(ctx, W / 2 - bw / 2, H - bh - 22, bw, bh, 'rgba(8,6,14,0.78)');
        rect(ctx, W / 2 - bw / 2, H - bh - 22, bw, 2, B.col || '#ffd24a');
        for (let i = 0; i < lines2.length; i++) drawText(ctx, lines2[i], W / 2, H - bh - 14 + i * 12, '#cfc9e6', { align: 'center', font: 'small' });
        ctx.globalAlpha = 1;
      }
    },
    prop: function (ctx, p, t, S) { return shopinProp(ctx, p, t, S); },
    // ---------- pressing the button at things
    use: function (S, p) {
      const I = S.SI;
      if (I.scan || I.receipt) return;
      if (p.act === 'till' || p.kind === 'sitill') { shopinTill(S); return; }
      if (p.kind === 'sidoor') { shopinTryLeave(S); return; }
      if (p.items && p.items.length) { shopinOpenPanel(S, p); return; }
      shopinFlavour(S, p);
    },
    // ---------- the clock
    tick: function (S, dt) {
      const I = S.SI;
      I.bellT = Math.min(1.4, I.bellT + dt);
      I.blurbT = Math.max(0, I.blurbT - dt);
      I.enterFlash = Math.max(0, I.enterFlash - dt * 1.6);
      I.deny = Math.max(0, I.deny - dt);
      if (I.panel) { I.panel.t += dt; I.panel.bump = Math.max(0, I.panel.bump - dt * 3); S.locked = Math.max(S.locked, 0.2); }
      if (I.scan) { shopinScanTick(S, dt); S.locked = Math.max(S.locked, 0.2); }
      if (I.receipt) {
        const R = I.receipt;
        R.t += dt;
        S.locked = Math.max(S.locked, 0.2);
        if (R.t > R.hold + 0.5) {
          I.receipt = null;
          I.clerkPose = null;
          S.locked = 0;
          S.cam.release(1.15);
          S.flash('IN YOUR POCKET. IT WILL GO THROUGH THE WASH.', 3);
        }
      }
      // the greeting, once the door has finished closing behind you
      if (!I.greeted && S.t > 0.9) {
        I.greeted = true;
        const hi = SHOPIN_HELLO[I.kind] || SHOPIN_HELLO.other;
        S.run([{ who: I.clerkName, voice: 'clerk', at: I.clerkName, text: hi[hashStr(B.id) % hi.length] }]);
        I.clerkBow = 1;
      }
      I.clerkBow = Math.max(0, I.clerkBow - dt * 1.1);
    },
    // ---------- setting the room up
    init: function (S) {
      const pal = kind === 'coffee'
        ? { wall: '#3a2a1e', band: '#0b6b4a', skirt: '#241a12', ceilCol: '#2a2018', floorCol: '#5a3f28', lightCol: '#ffd9a0', lightShade: '#c8a03a', lightStep: 172, lightKind: 'pendant', wallTile: false, menuBack: '#241a12', menuInk: '#f2eee2', gradeCol: '#ffb84a', gradeAmt: 0.1, vig: 0.42 }
        : kind === 'fast'
          ? { wall: '#e8e4da', band: '#c8402c', skirt: '#8a1d12', ceilCol: '#f2eee4', floorCol: '#c8b8a0', lightCol: '#fff4d8', lightShade: '#f2c94c', lightStep: 142, lightKind: 'strip', wallTile: false, menuBack: '#2a1a14', menuInk: '#f4f1ea', gradeCol: '#ffd24a', gradeAmt: 0.07, vig: 0.3 }
          : kind === 'conv'
            ? { wall: '#dfe4e0', band: B.col || '#2f8f4a', skirt: '#9aa2aa', ceilCol: '#eef2f4', floorCol: '#e0e4e0', lightCol: '#f8fcff', lightShade: '#ffffff', lightStep: 148, lightKind: 'strip', wallTile: true, menuBack: '#1b2230', menuInk: '#f4f1ea', gradeCol: '#bfe0ff', gradeAmt: 0.06, vig: 0.24 }
            : { wall: lighten(B.inner || '#d8d4cc', 0.12), band: B.col || '#5a5068', skirt: darken(B.inner || '#d8d4cc', 0.38), ceilCol: '#e8e4da', floorCol: '#cfc6b4', lightCol: '#fff0d8', lightShade: '#c8a03a', lightStep: 162, lightKind: 'strip', wallTile: false, menuBack: '#241d33', menuInk: '#f4f1ea', gradeCol: '#ffd24a', gradeAmt: 0.08, vig: 0.34 };
      const I = {
        B: B, kind: kind, tillX: L.tillX, clerkName: L.clerkName,
        stock: shopinStockOf(B), basket: [], bought: [],
        panel: null, scan: null, receipt: null,
        bellT: 0, blurbT: 5.2, enterFlash: 1, deny: 0, greeted: false, clerkBow: 0, clerkPose: null,
      };
      for (const k in pal) I[k] = pal[k];
      S.SI = I;
      shopinDeal(S);
      // an empty catalogue is not a crash, it is a shop that has sold out
      if (!I.stock.length) S.flash('THE SHELVES ARE BARE. COME BACK TOMORROW.', 4);
      Voice.chime('shop');
      if (Game.run) Game.run.save();
    },
    enterLine: null,
  };
}

// ---------- where you go when you walk back out ----------
// A shop is always somewhere. If nobody told us where, guess at the biggest
// room the build has and go there rather than falling over on the doorstep.
function shopinFallbackBack() {
  return function () {
    if (typeof NaritaTerminalScene !== 'undefined') return new NaritaTerminalScene();
    if (typeof NaritaArrivalScene !== 'undefined') return new NaritaArrivalScene();
    if (typeof StreetHubScene !== 'undefined') return new StreetHubScene();
    if (typeof gameHub === 'function') return gameHub();
    return new CityScene();
  };
}

// ---------- the scene ----------
class ShopInteriorScene extends SideScene {
  // brand: a SHOPS id, or a SHOPS row straight out of the catalogue.
  // back:  a factory for wherever the door leads.
  constructor(brand, back) {
    const B = shopinBrandOf(brand);
    const go = back || shopinFallbackBack();
    super(shopinDef(B), { back: go });
    this.SIB = B;
    this.SIback = go;
  }
  // ---- the panel eats the keyboard while it is open, and Escape is the
  // door rather than an instant exit, so the clerk gets their line in
  key(code) {
    const I = this.SI;
    if (!I) { super.key(code); return; }
    if (I.panel) {
      if (code === 'ArrowUp' || code === 'KeyW') { shopinPanelMove(this, -1); return; }
      if (code === 'ArrowDown' || code === 'KeyS') { shopinPanelMove(this, 1); return; }
      if (code === 'ArrowLeft' || code === 'KeyA') { shopinPanelMove(this, -SHOPIN_ROWS); return; }
      if (code === 'ArrowRight' || code === 'KeyD') { shopinPanelMove(this, SHOPIN_ROWS); return; }
      if (code === 'Enter' || code === 'Space' || code === 'KeyZ') { shopinBuy(this); return; }
      if (code === 'Escape' || code === 'KeyX' || code === 'Backspace') { shopinClosePanel(this); return; }
      return;
    }
    if (this.dlg) { super.key(code); return; }
    if (I.scan || I.receipt) return;
    if (code === 'Escape') { shopinTryLeave(this); return; }
    super.key(code);
  }
  pointerDown(x, y, id) {
    const I = this.SI;
    if (I && I.panel) {
      const P = I.panel, box = shopinPanelBox();
      const inside = function (r2) { return r2 && x >= r2.x && x < r2.x + r2.w && y >= r2.y && y < r2.y + r2.h; };
      if (inside(P.close)) { shopinClosePanel(this); return; }
      if (inside(P.buy)) { shopinBuy(this); return; }
      for (let i = 0; i < P.rows.length; i++) {
        if (inside(P.rows[i])) {
          if (P.idx === P.rows[i].n) shopinBuy(this);
          else { P.idx = P.rows[i].n; Audio.ui('move'); }
          return;
        }
      }
      if (x < box.x || x > box.x + box.w || y < box.y || y > box.y + box.h) shopinClosePanel(this);
      return;
    }
    if (I && (I.scan || I.receipt) && !this.dlg) return;
    super.pointerDown(x, y, id);
  }
  // ---- the clerk gets their own painter, because a bow is the one bit of
  // body language this game genuinely needs and the shared one cannot tilt
  drawNpc(ctx, n) {
    const I = this.SI;
    if (I && n.name === I.clerkName) {
      const y = n.y != null ? n.y : this.floorY(n.floor);
      const bow = I.clerkBow > 0 ? Math.sin(clamp(I.clerkBow, 0, 1) * Math.PI) : 0;
      drawShadow(ctx, n._x, y + 2, 22 * n.scale, 0.28);
      drawBugAt(ctx, n.spec, n._x, y + 3 + bow * 4, {
        pose: I.clerkPose || (bow > 0.15 ? 'sad' : 'idle'),
        scale: n.scale, flip: this.body.x < n._x, bounce: 0.45, phase: n.t,
        tilt: bow * (this.body.x < n._x ? 0.34 : -0.34),
      });
      // the apron and the name badge, painted on over the sprite
      const ax = Math.round(n._x - 9 * n.scale * 0.6);
      rect(ctx, ax, y - 24, Math.round(18 * n.scale * 0.6), 14, withAlpha(I.B.col || '#2f6fc0', 0.85));
      rect(ctx, ax, y - 24, Math.round(18 * n.scale * 0.6), 2, withAlpha('#ffffff', 0.5));
      rect(ctx, ax + 2, y - 21, 4, 3, '#ffd24a');
      return;
    }
    super.drawNpc(ctx, n);
  }
}

// ---------- the one line other scenes need ----------
// Anywhere in the game that has a shopfront can hand this to Game.go and get
// the whole room, the stock, the clerk and the till for nothing.
function shopVisitFactory(id, back) {
  return function () { return new ShopInteriorScene(id, back); };
}
