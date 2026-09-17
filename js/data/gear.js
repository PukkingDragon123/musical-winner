// ---------- Skins and modifications ----------
// Two different things you can do to an instrument. A skin changes what it
// looks like and nothing else. A modification changes how it plays, costs
// real money, and there are only three slots.
'use strict';
const SKINS = {
  plain:   { name: 'FACTORY',      cost: 0,  col: null,      deco: 'none',   desc: 'However it came.' },
  sakura:  { name: 'SAKURA',       cost: 18, col: '#ef9fbe', deco: 'petal',  desc: 'Blossom down the body.' },
  neon:    { name: 'NEON CITY',    cost: 24, col: '#5bc0ff', deco: 'grid',   desc: 'Lit from the inside.' },
  sunset:  { name: 'SUNSET',       cost: 20, col: '#ff8a4a', deco: 'stripe', desc: 'Two-tone fade, 1978.' },
  matcha:  { name: 'MATCHA',       cost: 16, col: '#8fc98a', deco: 'none',   desc: 'Quiet. Expensive.' },
  gold:    { name: 'GOLD LEAF',    cost: 40, col: '#f0c848', deco: 'leaf',   desc: 'Somebody will notice.' },
  vhs:     { name: 'VHS',          cost: 22, col: '#c58bff', deco: 'scan',   desc: 'Tracking. Please stand by.' },
  koi:     { name: 'KOI',          cost: 28, col: '#e8503a', deco: 'koi',    desc: 'One carp, going up.' },
};
const SKIN_KEYS = Object.keys(SKINS);
const GEAR_MODS = {
  wide:    { name: 'FAT STRINGS',   cost: 26, icon: 'star',  desc: 'Timing windows 20% wider.',        mods: { windowMult: 1.2 } },
  loud:    { name: 'BRASS RESO',    cost: 30, icon: 'chips', desc: 'Tips pay 25% more.',                mods: { tipMult: 1.25 } },
  star:    { name: 'GLITTER PICK',  cost: 24, icon: 'star',  desc: 'Half again as many gold notes.',    mods: { starRate: 0.12 } },
  steady:  { name: 'STRAP LOCKS',   cost: 34, icon: 'shield', desc: 'The first miss of a song is free.', mods: { safetyNet: 1 } },
  crowd:   { name: 'BIG BELL',      cost: 28, icon: 'note',  desc: 'Draws 20% more of a crowd.',        mods: { crowd: 1.2 } },
  soft:    { name: 'FELT DAMPERS',  cost: 22, icon: 'rest',  desc: 'Bombs do half as much damage.',     mods: { bombMult: 0.5 } },
};
const MOD_KEYS = Object.keys(GEAR_MODS);
const MOD_SLOTS = 3;
function runSkin(kind) { const r = Game.run; return (r && r.skins && r.skins[kind]) || 'plain'; }
function skinOwned(k) { const r = Game.run; return k === 'plain' || (r && r.ownedSkins && r.ownedSkins.includes(k)); }
function modOwned(k) { const r = Game.run; return r && r.gearMods && r.gearMods.includes(k); }
// the wash a skin puts over the instrument you are playing
function drawSkinOverlay(ctx, area, instr) {
  const kind = instr && instr.key ? instr.key : (instr && instr.name ? String(instr.name).toLowerCase() : null);
  if (!kind) return;
  const S = SKINS[instr._preview || runSkin(kind)];
  if (!S || !S.col) return;
  const { x, y, w, h } = area;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.globalAlpha = 0.16; rect(ctx, x, y, w, h, S.col); ctx.globalAlpha = 1;
  const t = ANIM_T;
  if (S.deco === 'petal') {
    for (let i = 0; i < 14; i++) { const px2 = x + ((i * 97 + Math.floor(t * 18)) % w), py2 = y + ((i * 53 + Math.floor(t * 26)) % h); ctx.globalAlpha = 0.5; rect(ctx, px2, py2, 3, 2, '#ffd8e8'); ctx.globalAlpha = 1; }
  } else if (S.deco === 'grid') {
    ctx.globalAlpha = 0.16; for (let gx = x; gx < x + w; gx += 18) rect(ctx, gx, y, 1, h, S.col); for (let gy = y; gy < y + h; gy += 18) rect(ctx, x, gy, w, 1, S.col); ctx.globalAlpha = 1;
  } else if (S.deco === 'stripe') {
    ctx.globalAlpha = 0.14; for (let i = 0; i < 5; i++) rect(ctx, x, y + h * (0.4 + i * 0.1), w, 4, '#ffd24a'); ctx.globalAlpha = 1;
  } else if (S.deco === 'scan') {
    ctx.globalAlpha = 0.12; for (let gy = y + ((Math.floor(t * 40)) % 6); gy < y + h; gy += 6) rect(ctx, x, gy, w, 2, '#ffffff'); ctx.globalAlpha = 1;
  } else if (S.deco === 'leaf') {
    ctx.globalAlpha = 0.1 + 0.06 * Math.sin(t * 3); rect(ctx, x, y, w, h, '#fff0a8'); ctx.globalAlpha = 1;
  } else if (S.deco === 'koi') {
    ctx.globalAlpha = 0.35;
    const kx = x + w * 0.5 + Math.sin(t * 0.8) * w * 0.3, ky = y + h * 0.5 + Math.cos(t * 0.6) * h * 0.2;
    ellipsePx(ctx, kx, ky, 12, 6, '#e8503a'); ellipsePx(ctx, kx - 11, ky, 5, 4, '#f2efe8'); ctx.globalAlpha = 1;
  }
  ctx.restore();
}
