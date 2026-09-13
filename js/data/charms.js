// ---------- Charms (build-defining passive items), vouchers, consumables ----------
'use strict';
// Scoring hooks receive S (ScoreState) which exposes: S.addApplause(n, why), S.addMult(n, why), S.timesMult(n, why), S.run, S.band, S.watchers, S.combo, S.hype, S.instrument, S.genre, S.misses
const CHARMS = {
  // ---- common
  leatherJacket: { name: 'Leather Jacket', rarity: 'common', price: 22, icon: 'jacket', desc: '+2 Mult. Looks cool. Is cool.', onSetEnd: (S) => S.addMult(2, 'Leather Jacket') },
  tipJar:        { name: 'Shiny Tip Jar', rarity: 'common', price: 18, icon: 'jar', desc: '+$5 flat after every set.', onPayout: (S) => S.addCash(5, 'Shiny Tip Jar') },
  chalk:         { name: 'Sidewalk Chalk', rarity: 'common', price: 20, icon: 'chalk', desc: 'Watchers give double applause while they watch.', mods: { watcherApplause: 2 } },
  luckyPick:     { name: 'Lucky Pick', rarity: 'common', price: 20, icon: 'pick', desc: 'Guitar and bass hits +8 applause.', onHit: (S, n, j) => { if (['guitar', 'bass'].includes(S.instrument) && j !== 'miss') S.addApplause(8); } },
  drumsticks:    { name: 'Signed Drumsticks', rarity: 'common', price: 20, icon: 'sticks', desc: 'Kick and crash +10 applause, the rest +5.', onHit: (S, n, j) => { if (S.instrument === 'drums' && j !== 'miss') S.addApplause(n.lane === 0 || n.lane === 3 ? 10 : 5); } },
  reedCase:      { name: 'Reed Case', rarity: 'common', price: 20, icon: 'reed', desc: 'Saxophone hold releases give double applause.', onHit: (S, n, j, info) => { if (S.instrument === 'sax' && info.tail && j !== 'miss') S.addApplause(info.applause); } },
  valveOil:      { name: 'Valve Oil', rarity: 'common', price: 20, icon: 'oil', desc: 'Trumpet three-valve combos +20 applause.', onHit: (S, n, j) => { if (S.instrument === 'trumpet' && j !== 'miss' && n.combo === 7) S.addApplause(20); } },
  rosin:         { name: 'Fresh Rosin', rarity: 'common', price: 20, icon: 'rosin', desc: 'Violin bow hits +8 applause.', onHit: (S, n, j) => { if (S.instrument === 'violin' && j !== 'miss') S.addApplause(8); } },
  sheetMusic:    { name: 'Sheet Music', rarity: 'common', price: 20, icon: 'sheet', desc: 'Keyboard notes +6 applause, chords +14.', onHit: (S, n, j) => { if (S.instrument === 'piano' && j !== 'miss') S.addApplause(n.chord ? 14 : 6); } },
  metronome:     { name: 'Brass Metronome', rarity: 'common', price: 18, icon: 'metronome', desc: 'Shows the beat. Misses drain half the hype.', mods: { metronome: true, missMult: 0.5 } },
  earplugs:      { name: 'Earplugs', rarity: 'common', price: 22, icon: 'earplugs', desc: 'GREAT counts as PERFECT for hype and applause.', mods: { earplugs: true } },
  goldStrings:   { name: 'Gold Strings', rarity: 'common', price: 24, icon: 'strings', desc: 'Star notes give +50 applause.', onHit: (S, n, j) => { if (n.star && j !== 'miss') S.addApplause(50); } },
  // ---- uncommon
  streak:        { name: 'Hot Streak', rarity: 'uncommon', price: 36, icon: 'fire', desc: '+0.03 Mult per combo at set end. Miss and it burns down.', onSetEnd: (S) => S.addMult(Math.round(S.combo * 0.03 * 100) / 100, 'Hot Streak') },
  safetyNet:     { name: 'Safety Net', rarity: 'uncommon', price: 34, icon: 'net', desc: 'The first miss of every set does not break your combo.', mods: { safetyNet: 1 } },
  hatTrick:      { name: 'Hat Trick', rarity: 'uncommon', price: 38, icon: 'hat', desc: '+0.5 Mult for every 3 watchers at set end.', onSetEnd: (S) => S.addMult(Math.floor(S.watchers / 3) * 0.5, 'Hat Trick') },
  kidMagnet:     { name: 'Kid Magnet', rarity: 'uncommon', price: 34, icon: 'balloon', desc: 'Passers-by arrive 50% faster.', mods: { crowd: 1.5 } },
  crackedAmp:    { name: 'Cracked Amp', rarity: 'uncommon', price: 40, icon: 'amp', desc: 'x1.5 Mult, but hype drains twice as fast.', mods: { decay: 2 }, onSetEnd: (S) => S.timesMult(1.5, 'Cracked Amp') },
  stageDive:     { name: 'Stage Dive', rarity: 'uncommon', price: 40, icon: 'dive', desc: 'x1.4 Mult. Everyone loses 15 extra stamina.', mods: { staminaExtra: 15 }, onSetEnd: (S) => S.timesMult(1.4, 'Stage Dive') },
  encore:        { name: 'Encore!', rarity: 'uncommon', price: 42, icon: 'encore', desc: 'The final section of every set scores double applause.', mods: { encore: true } },
  rhythmSection: { name: 'Rhythm Section', rarity: 'uncommon', price: 36, icon: 'drum', desc: '+3 Mult if your band has drums and bass.', onSetEnd: (S) => { if (S.bandHas('drums') && S.bandHas('bass')) S.addMult(3, 'Rhythm Section'); } },
  hornSection:   { name: 'Horn Section', rarity: 'uncommon', price: 36, icon: 'horn', desc: '+3 Mult if your band has sax and trumpet.', onSetEnd: (S) => { if (S.bandHas('sax') && S.bandHas('trumpet')) S.addMult(3, 'Horn Section'); } },
  strings:       { name: 'String Quartet', rarity: 'uncommon', price: 38, icon: 'violin', desc: '+4 Mult if your band has guitar, bass and violin.', onSetEnd: (S) => { if (S.bandHas('guitar') && S.bandHas('bass') && S.bandHas('violin')) S.addMult(4, 'String Quartet'); } },
  merch:         { name: 'Merch Table', rarity: 'uncommon', price: 36, icon: 'shirt', desc: '+$1 for every 100 applause.', onPayout: (S) => S.addCash(Math.floor(S.applause / 100), 'Merch Table') },
  fanClub:       { name: 'Fan Club', rarity: 'uncommon', price: 38, icon: 'heart', desc: 'Every watcher still there at the end gives +40 applause.', onSetEnd: (S) => S.addApplause(S.watchers * 40, 'Fan Club') },
  // ---- rare
  goldenKazoo:   { name: 'Golden Kazoo', rarity: 'rare', price: 60, icon: 'kazoo', desc: 'Every combo cheer gives +1 Mult instead of +0.3.', mods: { cheerMult: 1 } },
  rockstar:      { name: 'Rockstar Boots', rarity: 'rare', price: 55, icon: 'boots', desc: 'x1.6 Mult on ROCK songs.', onSetEnd: (S) => { if (S.genre === 'rock') S.timesMult(1.6, 'Rockstar Boots'); } },
  jazzCat:       { name: 'Jazz Cat Beret', rarity: 'rare', price: 55, icon: 'beret', desc: 'x1.6 Mult on JAZZ songs.', onSetEnd: (S) => { if (S.genre === 'jazz') S.timesMult(1.6, 'Jazz Cat Beret'); } },
  funkSoul:      { name: 'Funk Medallion', rarity: 'rare', price: 55, icon: 'medal', desc: 'x1.6 Mult on FUNK songs.', onSetEnd: (S) => { if (S.genre === 'funk') S.timesMult(1.6, 'Funk Medallion'); } },
  showman:       { name: 'Showman\'s Cape', rarity: 'rare', price: 60, icon: 'cape', desc: '+1 Mult per bandmate on stage with you.', onSetEnd: (S) => S.addMult(Math.max(0, S.performers - 1), 'Showman\'s Cape') },
  perfectionist: { name: 'Perfectionist', rarity: 'rare', price: 58, icon: 'star', desc: '+5 Mult if you miss nothing. +1 if you miss once.', onSetEnd: (S) => { if (S.misses === 0) S.addMult(5, 'Perfectionist'); else if (S.misses === 1) S.addMult(1, 'Perfectionist'); } },
  busker:        { name: 'Busker\'s License', rarity: 'rare', price: 50, icon: 'permit', desc: 'Police never shut you down. Big Gigs pay x1.3.', mods: { permit: true, eliteBonus: 1.3 } },
};
const CHARM_KEYS = Object.keys(CHARMS);
const RARITY_WEIGHT = { common: 6, uncommon: 3, rare: 1 };

// Vouchers: permanent one-off upgrades (one offered per shop)
const VOUCHERS = {
  charmSlot:  { name: 'Bigger Gig Bag', price: 40, icon: 'bag', desc: '+1 charm slot.', apply: (r) => { r.charmSlots++; } },
  gourmet:    { name: 'Taco Truck Loyalty Card', price: 30, icon: 'taco', desc: 'Meals cost $3 less per bug.', apply: (r) => { r.perks.mealDiscount = (r.perks.mealDiscount || 0) + 3; } },
  sturdyCase: { name: 'Sturdy Case', price: 35, icon: 'case', desc: 'Every instrument counts as +1 quality star.', apply: (r) => { r.perks.quality = (r.perks.quality || 0) + 1; } },
  streetCred: { name: 'Street Cred', price: 35, icon: 'cred', desc: 'Watchers stay 50% longer once hooked.', apply: (r) => { r.perks.watchTime = (r.perks.watchTime || 1) * 1.5; } },
  promoter:   { name: 'Promoter\'s Number', price: 40, icon: 'phone', desc: 'Crowds are 30% bigger everywhere.', apply: (r) => { r.perks.crowd = (r.perks.crowd || 1) * 1.3; } },
  coffeeCard: { name: 'Cafe Punch Card', price: 45, icon: 'coffee', desc: 'Timing windows +10%. Permanently caffeinated.', apply: (r) => { r.perks.window = (r.perks.window || 1) * 1.1; } },
  union:      { name: 'Musicians\' Union Card', price: 30, icon: 'union', desc: 'Gigs cost 30% less stamina.', apply: (r) => { r.perks.stamina = (r.perks.stamina || 1) * 0.7; } },
  rerolls:    { name: 'Coupon Book', price: 25, icon: 'coupon', desc: 'Shop rerolls cost $2 less.', apply: (r) => { r.perks.rerollDiscount = (r.perks.rerollDiscount || 0) + 2; } },
};
const VOUCHER_KEYS = Object.keys(VOUCHERS);

// Consumables: one use. use(run, member?) => log string
const CONSUMABLES = {
  espresso:  { name: 'Espresso', price: 8, icon: 'coffee', desc: 'Next set: timing windows +30%.', target: 'run', use: (r) => { r.buffs.window = 1.3; return 'Jittery but precise. Next set has wider windows.'; } },
  flyers:    { name: 'Gig Flyers', price: 10, icon: 'flyer', desc: 'Next set: twice as many passers-by.', target: 'run', use: (r) => { r.buffs.crowd = 2; return 'Flyers everywhere. Next set draws a big crowd.'; } },
  luckyCoin: { name: 'Lucky Quarter', price: 14, icon: 'coin', desc: 'Next set: +2 Mult.', target: 'run', use: (r) => { r.buffs.mult = (r.buffs.mult || 0) + 2; return 'Heads. Next set gets +2 Mult.'; } },
  tuner:     { name: 'Clip-on Tuner', price: 12, icon: 'tuner', desc: 'Next set: GOOD hits count as GREAT.', target: 'run', use: (r) => { r.buffs.tuner = true; return 'In tune. GOODs count as GREATs next set.'; } },
  bread:     { name: 'Sourdough Heel', price: 5, icon: 'bread', desc: 'Removes 1 hunger from one bug.', target: 'member', use: (r, m) => { m.hunger = Math.max(0, m.hunger - 1); return m.name + ' munches happily. Hunger -1.'; } },
  energyBar: { name: 'Energy Bar', price: 6, icon: 'bar', desc: '+45 stamina to one bug.', target: 'member', use: (r, m) => { m.stamina = Math.min(100, m.stamina + 45); return m.name + ' feels the sugar rush. Stamina +45.'; } },
  setlist:   { name: 'Rock Setlist', price: 12, icon: 'sheet', desc: 'Next song is ROCK.', target: 'run', use: (r) => { r.buffs.genre = 'rock'; return 'Next song will be a rock number.'; } },
  jazzChart: { name: 'Jazz Chart', price: 12, icon: 'sheet', desc: 'Next song is JAZZ.', target: 'run', use: (r) => { r.buffs.genre = 'jazz'; return 'Next song swings.'; } },
};
const CONSUMABLE_KEYS = Object.keys(CONSUMABLES);

// ---- Drafted abilities (offered after every set). Chart-affecting mods live here.
Object.assign(CHARMS, {
  goldRush:    { name: 'Gold Rush', rarity: 'uncommon', price: 40, icon: 'star', desc: 'Twice as many gold STAR notes.', mods: { starRate: 0.18 } },
  bombSquad:   { name: 'Bomb Squad', rarity: 'uncommon', price: 38, icon: 'fire', desc: 'Double bombs. Each dodged bomb: +0.2 Mult.', mods: { bombMult: 2, dodgeMult: 0.2 } },
  shield:      { name: 'Soundproof Case', rarity: 'uncommon', price: 40, icon: 'case', desc: 'The first 3 misses of a set are forgiven.', mods: { safetyNet: 3 } },
  virtuoso:    { name: 'Virtuoso', rarity: 'rare', price: 60, icon: 'star', desc: 'Every PERFECT adds +0.05 Mult. No cap.', onHit: (S, n, j) => { if (j === 'perfect') S.multAdd += 0.05; } },
  sustain:     { name: 'Sustain Pedal', rarity: 'common', price: 24, icon: 'sheet', desc: 'Hold notes score double.', onHit: (S, n, j, info) => { if (info.tail && j !== 'miss') S.addApplause(info.applause); } },
  chordist:    { name: 'Chord Theory', rarity: 'common', price: 24, icon: 'sheet', desc: 'Two-handed hits +25 applause.', onHit: (S, n, j) => { if (j !== 'miss' && (n.chord || n.type === 'big')) S.addApplause(25); } },
  opener:      { name: 'Strong Opener', rarity: 'common', price: 22, icon: 'note', desc: 'The first 20 notes score triple.', onHit: (S, n, j, info) => { S._cnt = (S._cnt || 0) + 1; if (S._cnt <= 20 && j !== 'miss') S.addApplause(info.applause * 2); } },
  closer:      { name: 'Big Finish', rarity: 'uncommon', price: 36, icon: 'encore', desc: 'x2 Mult if your final combo beats 40.', onSetEnd: (S) => { if (S.combo >= 40) S.timesMult(2, 'Big Finish'); } },
  tipsy:       { name: 'Happy Hour', rarity: 'common', price: 22, icon: 'coin', desc: 'Tips from the hat are worth double.', mods: { tipMult: 2 } },
  gigEconomy:  { name: 'Commuter Pass', rarity: 'uncommon', price: 34, icon: 'phone', desc: '+1 train ride every morning.', mods: { tickets: 1 } },
  earworm:     { name: 'Earworm', rarity: 'rare', price: 55, icon: 'note', desc: 'x1.5 Mult when you play the same tune twice in a row.', onSetEnd: (S) => { if (S.run && S.run.lastTune === S.info.tune) S.timesMult(1.5, 'Earworm'); } },
  busStop:     { name: 'Muni Pass', rarity: 'common', price: 26, icon: 'phone', desc: 'Travel costs 1 ticket less on long hops.', mods: { cheapTravel: true } },
});
