// ---------- What you get for finishing a song ----------
// A set is three songs and a walk home. This is the bit in between: three
// cards face down on a flight case, one of them yours, and nobody to tell you
// which. Everything here writes into the same two pockets the rest of the game
// already reads - run.perks for what sticks, run.buffs for what only lasts the
// next song - so an upgrade is not a new system, it is a charm you did not
// have to pay for.
//
// After the last song of a set the summary runs instead: the money, the combo,
// how many strangers followed you because of forty seconds of phone footage,
// and how much closer that puts you to being somebody.
'use strict';

// ---------- rarity ----------
// Four tiers, and the frame tells you which before you have read a word. A
// common is grey steel. A legend is gold and will not sit still.
const UPG_RARITY = {
  common: { name: 'COMMON', col: '#6f7d92', hi: '#a8b8cc', lo: '#2f3a48', glow: 0.16 },
  rare:   { name: 'RARE',   col: '#4a86f7', hi: '#8ad8ff', lo: '#1b356e', glow: 0.30 },
  epic:   { name: 'EPIC',   col: '#c58bff', hi: '#eed4ff', lo: '#432470', glow: 0.44 },
  legend: { name: 'LEGEND', col: '#ffd24a', hi: '#fff4bc', lo: '#7a5408', glow: 0.62 },
};
const UPG_RARITY_ORDER = ['common', 'rare', 'epic', 'legend'];

// ---------- where an upgrade lands ----------
// collectMods() in scoring.js already builds a mods object out of charms, gear
// and perks. These are the perk keys an upgrade is allowed to write, and how
// each one folds into that object: multiply, add, take the biggest, or just be
// true. Anything not on this list is not a mod, it is a number the run keeps.
const UPG_PERK_MODS = {
  missMult: 'mul', tipMult: 'mul', bombMult: 'mul', decay: 'mul', watcherApplause: 'mul',
  eliteBonus: 'mul', hypeGain: 'mul',
  safetyNet: 'add', dodgeMult: 'add', tickets: 'add', multBonus: 'add', staminaExtra: 'add',
  revive: 'add', freeNotes: 'add', perfectFollowers: 'add', heat: 'add',
  cheerMult: 'max', starRate: 'max', starPay: 'max', fillMult: 'max', holdPay: 'max',
  earplugs: 'set', tuner: 'set', metronome: 'set', permit: 'set', encore: 'set',
  encore2: 'set', autoHold: 'set', brittle: 'set', cheapTravel: 'set',
};
// The one line scoring.js needs: fold the run's perks into the mods object it
// is already assembling. Kept here so the whole upgrade system lives in one
// file and scoring.js only has to learn its name.
function upgApplyPerkMods(run, m) {
  if (!run || !run.perks || !m) return m;
  const p = run.perks;
  for (const k in UPG_PERK_MODS) {
    if (p[k] === undefined || p[k] === null) continue;
    const how = UPG_PERK_MODS[k];
    if (how === 'mul') m[k] = (m[k] === undefined ? 1 : m[k]) * p[k];
    else if (how === 'add') m[k] = (m[k] || 0) + p[k];
    else if (how === 'max') m[k] = Math.max(m[k] || 0, p[k]);
    else m[k] = p[k];
  }
  return m;
}
// Three small hands that keep every apply() below to one readable line.
function upgPerk(run, key, how, v) {
  if (!run.perks) run.perks = {};
  const p = run.perks;
  if (how === 'mul') p[key] = (p[key] === undefined ? 1 : p[key]) * v;
  else if (how === 'add') p[key] = (p[key] || 0) + v;
  else if (how === 'max') p[key] = Math.max(p[key] || 0, v);
  else p[key] = v;
  return p[key];
}
function upgBuff(run, key, v) { if (!run.buffs) run.buffs = {}; run.buffs[key] = v; }
// Some upgrades are a charm you were handed rather than sold. If the bag is
// full it quietly becomes money, because a card that does nothing is a lie.
function upgGiveCharm(run, key) {
  if (typeof CHARMS === 'undefined' || !CHARMS[key]) { run.money += 14; return false; }
  if (run.hasCharm && run.hasCharm(key)) { run.money += 10; return false; }
  if (run.addCharm && run.addCharm(key)) return true;
  run.money += 14; return false;
}
// Called once per song, by whoever shows the pick. Stamina that comes back
// between numbers is the difference between three songs and two.
function upgSongTick(run) {
  if (!run || !run.perks) return 0;
  const n = run.perks.songStamina || 0;
  if (n && run.rest) run.rest(n);
  return n;
}

// ---------- the pool ----------
// Everything in here has to be true in one line on a card. If the line needs a
// second sentence to make sense it is a bad upgrade, not a long one.
const SONG_UPGRADES = [
  // ---- common: the small honest ones
  { id: 'looseWrists', name: 'LOOSE WRISTS', rarity: 'common', icon: 'window', weight: 10, tags: ['timing'],
    desc: 'Timing windows +12%.',
    blurb: 'You stop gripping the neck like it owes you money. Everything lands a fraction later and still counts.',
    apply: (r) => { upgPerk(r, 'window', 'mul', 1.12); } },
  { id: 'heavyHat', name: 'HEAVY HAT', rarity: 'common', icon: 'hat', weight: 10, tags: ['money'],
    desc: 'Tips in the hat are worth +25%.',
    blurb: 'A heavier hat does not blow over and does not look empty. Both of those are worth real coins.',
    apply: (r) => { upgPerk(r, 'tipMult', 'mul', 1.25); } },
  { id: 'brasso', name: 'BRASSO', rarity: 'common', icon: 'star', weight: 9, tags: ['stars'],
    desc: 'Twice as many gold star notes.',
    blurb: 'Polished brass catches the streetlight. The chart notices and hands out more of the gold ones.',
    apply: (r) => { upgPerk(r, 'starRate', 'max', 0.16); } },
  { id: 'hypeMan', name: 'HYPE MAN', rarity: 'common', icon: 'flame', weight: 9, tags: ['hype'],
    desc: 'Crowd hype builds 30% faster.',
    blurb: 'Somebody at the front decided tonight is a night. The rest of the pavement takes their word for it.',
    apply: (r) => { upgPerk(r, 'hypeGain', 'mul', 1.3); } },
  { id: 'secondWind', name: 'SECOND WIND', rarity: 'common', icon: 'battery', weight: 9, tags: ['stamina'],
    desc: '+25 stamina back after every song.',
    blurb: 'The trick is to breathe out between numbers instead of talking. Nobody teaches you that.',
    apply: (r) => { upgPerk(r, 'songStamina', 'add', 25); } },
  { id: 'flyerRun', name: 'FLYER RUN', rarity: 'common', icon: 'phone', weight: 9, tags: ['crowd'],
    desc: 'Crowds are 20% bigger everywhere.',
    blurb: 'Four hundred photocopies and a morning of taping them to poles. Half get torn down. Half do not.',
    apply: (r) => { upgPerk(r, 'crowd', 'mul', 1.2); } },
  { id: 'theRegulars', name: 'THE REGULARS', rarity: 'common', icon: 'eye', weight: 8, tags: ['crowd'],
    desc: 'Watchers stay 40% longer.',
    blurb: 'The same six faces, in the same spots, every week. They have opinions about your setlist now.',
    apply: (r) => { upgPerk(r, 'watchTime', 'mul', 1.4); } },
  { id: 'chalkLine', name: 'CHALK LINE', rarity: 'common', icon: 'note', weight: 8, tags: ['crowd'],
    desc: 'Watchers clap 50% louder.',
    blurb: 'A chalk square on the pavement tells people where to stand. Standing together makes them loud.',
    apply: (r) => { upgPerk(r, 'watcherApplause', 'mul', 1.5); } },
  { id: 'tradeCard', name: 'TRADE CARD', rarity: 'common', icon: 'tag', weight: 8, tags: ['gear'],
    desc: 'Gear and charms cost 15% less.',
    blurb: 'The man behind the counter decides you are staff. He does not check. You do not ask.',
    apply: (r) => { upgPerk(r, 'gearDiscount', 'max', 0.15); } },
  { id: 'onigiri', name: 'RICE IN THE CASE', rarity: 'common', icon: 'rice', weight: 8, tags: ['band'],
    desc: 'Meals cost $3 less per bug.',
    blurb: 'Two hundred yen of rice, wrapped that morning, riding under the sheet music. It keeps a band together.',
    apply: (r) => { upgPerk(r, 'mealDiscount', 'add', 3); } },
  { id: 'couponBook', name: 'COUPON BOOK', rarity: 'common', icon: 'dice', weight: 7, tags: ['meta'],
    desc: 'Rerolls cost $2 less. One free reroll now.',
    blurb: 'Free-standing on the convenience store counter. Mostly ramen vouchers. Mostly.',
    apply: (r) => { upgPerk(r, 'rerollDiscount', 'add', 2); upgPerk(r, 'rerollTokens', 'add', 1); } },
  { id: 'brassMetronome', name: 'BRASS METRONOME', rarity: 'common', icon: 'metronome', weight: 7, tags: ['timing'],
    desc: 'The beat is drawn. Misses cost half the hype.',
    blurb: 'It sits on the amp and ticks whether you want it to or not. Being told is not the same as being helped.',
    apply: (r) => { upgPerk(r, 'metronome', 'set', true); upgPerk(r, 'missMult', 'mul', 0.5); } },
  { id: 'loudmouth', name: 'LOUDMOUTH', rarity: 'common', icon: 'mask', weight: 5, tags: ['crowd', 'cursed'],
    desc: 'Crowds 60% bigger. The police start noticing.',
    blurb: 'You talk between songs now. It fills the pavement and it fills the complaints book at the koban.',
    apply: (r) => { upgPerk(r, 'crowd', 'mul', 1.6); upgPerk(r, 'heat', 'add', 1); } },

  // ---- rare: the ones that change how a song feels
  { id: 'safetyNet', name: 'SAFETY NET', rarity: 'rare', icon: 'shield', weight: 6, tags: ['combo'],
    desc: 'The first miss of a song keeps your combo.',
    blurb: 'Everyone drops one. The difference is whether the next eight bars know about it.',
    apply: (r) => { upgPerk(r, 'safetyNet', 'add', 1); } },
  { id: 'soundproofCase', name: 'SOUNDPROOF CASE', rarity: 'rare', icon: 'shield', weight: 4, tags: ['combo'],
    desc: 'Three misses a song are forgiven.',
    blurb: 'Foam, felt and a broken latch. It swallows the sound of a mistake before the front row gets it.',
    apply: (r) => { upgPerk(r, 'safetyNet', 'add', 3); } },
  { id: 'goldRush', name: 'GOLD RUSH', rarity: 'rare', icon: 'star', weight: 5, tags: ['stars'],
    desc: 'Star notes pay double on top of triple.',
    blurb: 'Six times a normal note. You will start playing for them and forget the tune, which is the trap.',
    apply: (r) => { upgPerk(r, 'starPay', 'max', 2); } },
  { id: 'freeIntro', name: 'FREE INTRO', rarity: 'rare', icon: 'ten', weight: 5, tags: ['chart'],
    desc: 'The first ten notes of a song play themselves.',
    blurb: 'Muscle memory gets you through the intro while your hands catch up with the rest of you.',
    apply: (r) => { upgPerk(r, 'freeNotes', 'add', 10); } },
  { id: 'stickyFingers', name: 'STICKY FINGERS', rarity: 'rare', icon: 'sustain', weight: 5, tags: ['chart'],
    desc: 'Sustain notes hold themselves once struck.',
    blurb: 'Rosin, sweat and not letting go. The long ones stop being a test of patience.',
    apply: (r) => { upgPerk(r, 'autoHold', 'set', true); upgPerk(r, 'holdPay', 'max', 1.5); } },
  { id: 'fillTheBar', name: 'FILL THE BAR', rarity: 'rare', icon: 'drum', weight: 5, tags: ['chart'],
    desc: 'Drum fills and rolls score double.',
    blurb: 'Four bars of nothing, then everything. It is showing off and it has always worked.',
    apply: (r) => { upgPerk(r, 'fillMult', 'max', 2); } },
  { id: 'earplugs', name: 'EARPLUGS', rarity: 'rare', icon: 'ear', weight: 5, tags: ['timing'],
    desc: 'GREAT counts as PERFECT.',
    blurb: 'You stop hearing the room and start hearing the tune. It turns out the room was the problem.',
    apply: (r) => { upgPerk(r, 'earplugs', 'set', true); } },
  { id: 'clipOnTuner', name: 'PERMANENT TUNER', rarity: 'rare', icon: 'bolt', weight: 5, tags: ['timing'],
    desc: 'GOOD counts as GREAT.',
    blurb: 'Clipped to the headstock and never taken off. A little green light that says carry on.',
    apply: (r) => { upgPerk(r, 'tuner', 'set', true); } },
  { id: 'encore', name: 'ENCORE', rarity: 'rare', icon: 'encore', weight: 5, tags: ['score'],
    desc: 'The last section of a song scores double.',
    blurb: 'Nobody remembers the second verse. Everybody remembers how it ended.',
    apply: (r) => { upgPerk(r, 'encore', 'set', true); } },
  { id: 'commuterPass', name: 'COMMUTER PASS', rarity: 'rare', icon: 'ticket', weight: 5, tags: ['travel'],
    desc: '+2 train rides every morning.',
    blurb: 'A month of unlimited hops across the loop. You will use every one of them and want more.',
    apply: (r) => { upgPerk(r, 'tickets', 'add', 2); r.tickets = (r.tickets || 0) + 2; } },
  { id: 'clipFarm', name: 'CLIP FARM', rarity: 'rare', icon: 'phone', weight: 5, tags: ['fame'],
    desc: '+1 follower for every perfect note.',
    blurb: 'Somebody films the whole set on a cracked phone. The good bits find their own way out.',
    apply: (r) => { upgPerk(r, 'perfectFollowers', 'add', 1); } },
  { id: 'sturdyCase', name: 'STURDY CASE', rarity: 'rare', icon: 'crown', weight: 4, tags: ['gear'],
    desc: 'Every instrument counts as +1 quality star.',
    blurb: 'It is not a better guitar. It is a guitar that arrives in tune, which turns out to be the same thing.',
    apply: (r) => { upgPerk(r, 'quality', 'add', 1); } },
  { id: 'luckyQuarter', name: 'LUCKY QUARTER', rarity: 'rare', icon: 'clover', weight: 5, tags: ['score'],
    desc: '+1 Mult on every song from here.',
    blurb: 'Off the pavement outside the station, heads up, on a bad Tuesday. You do not spend it.',
    apply: (r) => { upgPerk(r, 'multBonus', 'add', 1); } },
  { id: 'stageDive', name: 'STAGE DIVE', rarity: 'rare', icon: 'mask', weight: 4, tags: ['score', 'cursed'],
    desc: '+3 Mult. Everyone loses 15 more stamina.',
    blurb: 'There is no stage. You do it anyway, off an amp, into four people who did not agree to it.',
    apply: (r) => { upgPerk(r, 'multBonus', 'add', 3); upgPerk(r, 'staminaExtra', 'add', 15); } },
  { id: 'theAdvance', name: 'THE ADVANCE', rarity: 'rare', icon: 'coin', weight: 4, tags: ['money', 'cursed'],
    desc: '$60 tonight. -1 Mult on every song after it.',
    blurb: 'She counts it onto the table in front of the band so they all see it. That is the clever part.',
    apply: (r) => { r.money += 60; upgPerk(r, 'multBonus', 'add', -1); r.karma = (r.karma || 0) - 1; } },

  // ---- epic: the ones you build a run around
  { id: 'oneMoreSong', name: 'ONE MORE SONG', rarity: 'epic', icon: 'heart', weight: 3, tags: ['safety'],
    desc: 'One free revive. A dead set gets back up.',
    blurb: 'The crowd thins, the hype hits the floor, and somebody at the back shouts for one more. You get one more.',
    apply: (r) => { upgPerk(r, 'revive', 'add', 1); } },
  { id: 'secondEncore', name: 'SECOND ENCORE', rarity: 'epic', icon: 'encore', weight: 2, tags: ['score'],
    desc: 'Every set gets one extra song, paid.',
    blurb: 'You had packed the case. You unpack the case. This is how you end up doing it for a living.',
    apply: (r) => { upgPerk(r, 'encore2', 'set', true); upgPerk(r, 'encore', 'set', true); } },
  { id: 'punchCard', name: 'CAFE PUNCH CARD', rarity: 'epic', icon: 'window', weight: 3, tags: ['timing'],
    desc: 'Timing windows +30%. Permanently caffeinated.',
    blurb: 'Ten stamps for a free one. You have filled four cards. Your hands are very slightly ahead of the beat.',
    apply: (r) => { upgPerk(r, 'window', 'mul', 1.3); upgBuff(r, 'window', Math.max((r.buffs && r.buffs.window) || 1, 1.3)); } },
  { id: 'biggerBag', name: 'BIGGER GIG BAG', rarity: 'epic', icon: 'crown', weight: 3, tags: ['meta'],
    desc: '+1 charm slot, and a charm to put in it.',
    blurb: 'More pockets than you need, which is exactly the right number of pockets.',
    apply: (r) => { r.charmSlots = (r.charmSlots || 5) + 1; const k = r.randomCharm ? r.randomCharm() : null; if (k) upgGiveCharm(r, k); } },
  { id: 'algorithmFriend', name: 'ALGORITHM FRIEND', rarity: 'epic', icon: 'phone', weight: 3, tags: ['fame'],
    desc: 'Followers from every song are doubled.',
    blurb: 'Nobody knows why it picked you. It will stop for no reason too. Take it while it is looking.',
    apply: (r) => { upgPerk(r, 'followerMult', 'mul', 2); } },
  { id: 'goldenKazoo', name: 'GOLDEN KAZOO', rarity: 'epic', icon: 'flame', weight: 3, tags: ['score'],
    desc: 'Every crowd cheer gives +1 Mult, not +0.3.',
    blurb: 'It is a kazoo. It is gold. It should not work and the crowd loses its mind every single time.',
    apply: (r) => { upgPerk(r, 'cheerMult', 'max', 1); } },
  { id: 'crackedAmp', name: 'CRACKED AMP', rarity: 'epic', icon: 'amp', weight: 3, tags: ['score', 'cursed'],
    desc: '+4 Mult. Hype drains twice as fast.',
    blurb: 'The cone has a split in it and everything through it sounds like it means something. It also dies fast.',
    apply: (r) => { upgPerk(r, 'multBonus', 'add', 4); upgPerk(r, 'decay', 'mul', 2); } },
  { id: 'glassCane', name: 'GLASS CANE', rarity: 'epic', icon: 'mask', weight: 2, tags: ['money', 'cursed'],
    desc: 'Tips doubled. One miss ends the combo for good.',
    blurb: 'Beautiful, and you will not put it down, and you already know how this ends.',
    apply: (r) => { upgPerk(r, 'tipMult', 'mul', 2); upgPerk(r, 'brittle', 'set', true); } },

  // ---- legend: three of these exist and you will remember which you got
  { id: 'theBigRoom', name: 'THE BIG ROOM', rarity: 'legend', icon: 'crown', weight: 1, tags: ['money', 'fame'],
    desc: 'Big gigs pay x1.35. Fame climbs 40% faster.',
    blurb: 'Somebody with a lanyard watched the whole set from the side and wrote your name down properly.',
    apply: (r) => { upgPerk(r, 'eliteBonus', 'mul', 1.35); upgPerk(r, 'followerMult', 'mul', 1.4); upgPerk(r, 'permit', 'set', true); } },
  { id: 'wingsOut', name: 'WINGS OUT', rarity: 'legend', icon: 'wing', weight: 1, tags: ['stars', 'score'],
    desc: '+3 Mult, and stars all over the chart.',
    blurb: 'The dragonfly on the tail of the plane that brought you here. You have decided it means something.',
    apply: (r) => { upgPerk(r, 'multBonus', 'add', 3); upgPerk(r, 'starRate', 'max', 0.3); } },
  { id: 'lastTrain', name: 'THE LAST TRAIN', rarity: 'legend', icon: 'clock', weight: 1, tags: ['travel', 'stamina'],
    desc: 'Free travel, +60 stamina a day, +1 revive.',
    blurb: 'You learn the timetable the way other people learn a prayer. It gets you home. It always gets you home.',
    apply: (r) => { upgPerk(r, 'cheapTravel', 'set', true); upgPerk(r, 'revive', 'add', 1); r.staminaMax = (r.staminaMax || 240) + 60; if (r.rest) r.rest(60); } },
];
const SONG_UPGRADE_BY_ID = (function () { const m = {}; for (const u of SONG_UPGRADES) m[u.id] = u; return m; })();

// Deal three, weighted, never the same card twice, and never something the run
// has already taken to the point of being meaningless.
function upgRoll(run, n, exclude) {
  const taken = (run && run.takenUpgrades) || [];
  const out = [], used = (exclude || []).slice();
  // Some of these are a switch, not a dial: taking EARPLUGS twice does
  // nothing, so the deck stops offering them once they are yours.
  const once = { biggerBag: 2, oneMoreSong: 2, secondEncore: 1, glassCane: 1, theAdvance: 1, theBigRoom: 1, wingsOut: 1, lastTrain: 1, earplugs: 1, clipOnTuner: 1, encore: 1, brassMetronome: 1, stickyFingers: 1, freeIntro: 1, goldRush: 1, fillTheBar: 1, goldenKazoo: 1, sturdyCase: 2, soundproofCase: 1 };
  const count = (id) => taken.filter(k => k === id).length;
  for (let i = 0; i < (n || 3); i++) {
    const pool = SONG_UPGRADES.filter(u => used.indexOf(u.id) < 0 && count(u.id) < (once[u.id] || 3));
    if (!pool.length) break;
    let tot = 0; for (const u of pool) tot += u.weight || 1;
    let roll = (run && run.rng ? run.rng() : Math.random()) * tot, pick = pool[pool.length - 1];
    for (const u of pool) { roll -= (u.weight || 1); if (roll <= 0) { pick = u; break; } }
    used.push(pick.id); out.push(pick);
  }
  return out;
}
// Taking one. Everything funnels through here so the run always remembers what
// it is made of, which is what lets the summary screen tell you.
function upgTake(run, up) {
  if (!run || !up) return null;
  if (!run.perks) run.perks = {};
  if (!run.buffs) run.buffs = {};
  if (!run.takenUpgrades) run.takenUpgrades = [];
  up.apply(run);
  run.takenUpgrades.push(up.id);
  if (run.save) run.save();
  return up;
}

// ---------- the ladder ----------
// Followers are a number. Fame is what the number lets you walk into. Five
// rungs, each one further apart than the last, because that is how it works.
const FAME_TIERS = [
  { key: 'busker',    name: 'BUSKER',     at: 0,     col: '#8a9aa8', unlock: 'THE PAVEMENT, AND WHOEVER STOPS.' },
  { key: 'regular',   name: 'REGULAR',    at: 250,   col: '#6be585', unlock: 'BAR OWNERS KNOW YOUR FACE. OPEN MICS SKIP THE QUEUE.' },
  { key: 'local',     name: 'LOCAL NAME', at: 1200,  col: '#8ad8ff', unlock: 'PAID SLOTS. SOMEBODY ELSE CARRIES THE AMP.' },
  { key: 'support',   name: 'SUPPORT ACT', at: 5000, col: '#c58bff', unlock: 'A DRESSING ROOM WITH A DOOR THAT SHUTS.' },
  { key: 'headliner', name: 'HEADLINER',  at: 20000, col: '#ffd24a', unlock: 'YOUR NAME ON TOP, IN LIGHTS THAT ALL WORK.' },
];
function upgEnsureFame(run) {
  if (!run) return;
  if (typeof run.followers !== 'number') run.followers = 0;
  if (typeof run.fame !== 'number') run.fame = 0;
  if (!run.perks) run.perks = {};
  if (!run.buffs) run.buffs = {};
  if (!run.takenUpgrades) run.takenUpgrades = [];
}
// Either of these screens can be opened with no run behind it - a dev
// shortcut, a reload in the wrong place, a chapter that has not started one
// yet. Rather than throw on frame one, they get a pocket-sized stand-in with
// the same shape as the real thing, which forgets everything the moment you
// walk away from it.
function upgStubRun() {
  return {
    money: 0, day: 0, members: [], charms: [], perks: {}, buffs: {}, takenUpgrades: [],
    goals: [], followers: 0, fame: 0, tickets: 0, karma: 0, charmSlots: 5,
    stamina: 120, staminaMax: 240,
    rest: function (n) { this.stamina = clamp(this.stamina + n, 0, this.staminaMax); },
    save: function () { },
  };
}
function upgRunOf(o) {
  return (o && o.run) || (typeof Game !== 'undefined' && Game.run) || upgStubRun();
}
function fameTier(run) {
  upgEnsureFame(run);
  const f = run ? run.followers : 0;
  let t = FAME_TIERS[0];
  for (const tier of FAME_TIERS) if (f >= tier.at) t = tier;
  return t;
}
function fameNext(run) {
  upgEnsureFame(run);
  const i = FAME_TIERS.indexOf(fameTier(run));
  return i >= FAME_TIERS.length - 1 ? null : FAME_TIERS[i + 1];
}
// 0..1 along the current rung. The top rung is always full, because there is
// nowhere above headliner and pretending otherwise is mean.
function fameProgress(run) {
  upgEnsureFame(run);
  const a = fameTier(run), b = fameNext(run);
  if (!b) return 1;
  return clamp((run.followers - a.at) / Math.max(1, b.at - a.at), 0, 1);
}
// Add followers and settle the ladder. Returns what changed, so a screen can
// make a noise about it.
function famePush(run, n) {
  upgEnsureFame(run);
  const before = FAME_TIERS.indexOf(fameTier(run));
  run.followers = Math.max(0, Math.round(run.followers + (n || 0)));
  const tier = fameTier(run), after = FAME_TIERS.indexOf(tier);
  run.fame = after;
  return { gained: Math.round(n || 0), tier, tierUp: after > before, from: FAME_TIERS[before] };
}
// Forty seconds of phone footage, shot vertically, from too far back. This
// turns a performance into strangers, and gives you the line about it.
function grantFollowers(run, perf) {
  upgEnsureFame(run);
  const p = perf || {};
  const acc = clamp(p.acc != null ? p.acc : 0.5, 0, 1);
  const perfects = p.perfects || 0, combo = p.maxCombo || 0, watchers = p.watchers || 0;
  const tierIdx = FAME_TIERS.indexOf(fameTier(run));
  let n = 5 + perfects * 0.8 + combo * 0.35 + watchers * 2.6;
  n *= 0.25 + acc * acc * 1.15;                       // a sloppy set does not travel
  n *= 1 + tierIdx * 0.42;                            // the further up, the faster it goes
  n *= (run.perks.followerMult || 1);
  n += perfects * (run.perks.perfectFollowers || 0);
  if (p.mode === 'elite') n *= 1.4; else if (p.mode === 'boss') n *= 2;
  if (acc < 0.35) n *= 0.3;                           // somebody filmed the bad one
  n = Math.max(0, Math.round(n));
  const res = famePush(run, n);
  res.line = n < 8 ? 'THREE VIEWS. TWO OF THEM YOURS.'
    : n < 40 ? 'A FEW SHARES. THE FEED SHRUGS AND MOVES ON.'
    : n < 150 ? 'YOUR CLIP DID NUMBERS. SMALL ONES, BUT NUMBERS.'
    : n < 500 ? 'SOMEBODY DUETTED YOU AT TWO IN THE MORNING.'
    : n < 1500 ? 'THE CLIP IS EVERYWHERE AND YOU ARE ASLEEP ON A TRAIN.'
    : 'THE SOUND ON IT IS TERRIBLE. IT DOES NOT MATTER AT ALL.';
  res.n = n;
  if (run.save) run.save();
  return res;
}

// ---------- icons ----------
// Pixel art, drawn into an s by s box with its top-left at x,y. Everything is
// built out of rectangles on a sixteenth grid so it stays hard-edged at any
// size the card needs. Three tones minimum on everything: body, lit top,
// shadowed bottom.
function drawUpgradeIcon(ctx, x, y, s, key, t) {
  const u = s / 16, R = (a, b, w, h, c) => rect(ctx, x + a * u, y + b * u, w * u, h * u, c);
  const puls = 0.55 + 0.45 * Math.sin((t || 0) * 3);
  switch (key) {
    case 'window': {                                   // a timing gate: two brackets and the note between
      R(2, 3, 2, 10, '#8ad8ff'); R(2, 3, 2, 2, '#d8f4ff'); R(2, 11, 2, 2, '#2f6a96');
      R(12, 3, 2, 10, '#8ad8ff'); R(12, 3, 2, 2, '#d8f4ff'); R(12, 11, 2, 2, '#2f6a96');
      R(5, 6, 6, 4, '#ffd24a'); R(5, 6, 6, 1, '#fff2b0'); R(5, 9, 6, 1, '#c8a03a');
      ctx.globalAlpha = 0.25 * puls; R(4, 2, 8, 12, '#8ad8ff'); ctx.globalAlpha = 1;
      break;
    }
    case 'coin': {
      circle(ctx, x + 8 * u, y + 8 * u, 6 * u, '#c8a03a');
      circle(ctx, x + 8 * u, y + 8 * u, 5 * u, '#ffd24a');
      circle(ctx, x + 7 * u, y + 7 * u, 3 * u, '#fff2b0');
      R(7, 4, 2, 8, '#8a6010'); R(5, 6, 6, 1, '#8a6010'); R(5, 9, 6, 1, '#8a6010');
      break;
    }
    case 'hat': {                                      // a busker hat, brim up, coins in it
      ellipsePx(ctx, x + 8 * u, y + 11 * u, 7 * u, 2.4 * u, '#3a2a20');
      ellipsePx(ctx, x + 8 * u, y + 10 * u, 7 * u, 2.2 * u, '#6a4a30');
      R(4, 4, 8, 6, '#5a3a24'); R(4, 4, 8, 1, '#8a6440'); R(4, 9, 8, 1, '#32200f');
      R(4, 7, 8, 1, '#c8402c');
      R(6, 9, 2, 2, '#ffd24a'); R(9, 9, 2, 2, '#ffd24a');
      break;
    }
    case 'star': {
      ctx.fillStyle = '#c8a03a'; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 3 : 7) * u; ctx[i ? 'lineTo' : 'moveTo'](x + 8 * u + Math.cos(a) * rr, y + 8 * u + Math.sin(a) * rr); }
      ctx.fill();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = (i % 2 ? 2.4 : 6) * u; ctx[i ? 'lineTo' : 'moveTo'](x + 8 * u + Math.cos(a) * rr, y + 7.6 * u + Math.sin(a) * rr); }
      ctx.fill();
      R(6, 5, 2, 2, '#fff2b0');
      break;
    }
    case 'flame': {
      R(6, 10, 4, 4, '#8a2a12');
      ctx.fillStyle = '#c8402c'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 1 * u); ctx.lineTo(x + 13 * u, y + 9 * u); ctx.lineTo(x + 11 * u, y + 14 * u);
      ctx.lineTo(x + 5 * u, y + 14 * u); ctx.lineTo(x + 3 * u, y + 9 * u); ctx.fill();
      ctx.fillStyle = '#e8803a'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 4 * u); ctx.lineTo(x + 11 * u, y + 10 * u); ctx.lineTo(x + 5 * u, y + 10 * u); ctx.fill();
      ctx.globalAlpha = puls; R(7, 9, 2, 4, '#fff2b0'); ctx.globalAlpha = 1;
      break;
    }
    case 'battery': {
      R(3, 4, 10, 9, '#2a3a2a'); R(3, 4, 10, 1, '#4a6a4a'); R(7, 2, 2, 2, '#8a8f98');
      const n = 1 + Math.floor(puls * 2);
      for (let i = 0; i < 3; i++) R(4, 11 - i * 3, 8, 2, i < n ? '#6be585' : '#1c2a1c');
      R(4, 5, 8, 1, '#0d160d');
      break;
    }
    case 'phone': {                                    // a phone held up, a clip playing on it
      R(4, 1, 8, 14, '#161620'); R(4, 1, 8, 1, '#3a3a4a'); R(4, 14, 8, 1, '#08080e');
      R(5, 3, 6, 10, '#2a1a30');
      ctx.globalAlpha = 0.6 + 0.4 * puls; R(5, 3, 6, 10, '#ff5a9a'); ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff2b0'; ctx.beginPath();
      ctx.moveTo(x + 7 * u, y + 5.5 * u); ctx.lineTo(x + 10 * u, y + 8 * u); ctx.lineTo(x + 7 * u, y + 10.5 * u); ctx.fill();
      R(6, 13, 4, 1, '#4a4a5a');
      break;
    }
    case 'eye': {
      ellipsePx(ctx, x + 8 * u, y + 8 * u, 7 * u, 4.2 * u, '#f4f1ea');
      ellipseRingPx(ctx, x + 8 * u, y + 8 * u, 7 * u, 4.2 * u, '#241d28');
      circle(ctx, x + 8 * u, y + 8 * u, 3 * u, '#4a86f7');
      circle(ctx, x + 8 * u, y + 8 * u, 1.6 * u, '#12101c');
      R(6, 6, 2, 1, '#ffffff');
      break;
    }
    case 'note': {
      R(9, 2, 2, 9, '#f4f1ea'); R(9, 2, 5, 2, '#f4f1ea'); R(9, 4, 4, 1, '#b8b2a8');
      ellipsePx(ctx, x + 7 * u, y + 11.5 * u, 3.2 * u, 2.4 * u, '#ffd24a');
      ellipsePx(ctx, x + 6.4 * u, y + 11 * u, 1.6 * u, 1.1 * u, '#fff2b0');
      break;
    }
    case 'tag': {                                      // a price tag on a string
      ctx.fillStyle = '#2f7a4a'; ctx.beginPath();
      ctx.moveTo(x + 3 * u, y + 8 * u); ctx.lineTo(x + 8 * u, y + 3 * u); ctx.lineTo(x + 14 * u, y + 3 * u);
      ctx.lineTo(x + 14 * u, y + 9 * u); ctx.lineTo(x + 9 * u, y + 14 * u); ctx.fill();
      R(9, 4, 4, 1, '#6be585');
      circle(ctx, x + 11.5 * u, y + 5.5 * u, 1.4 * u, '#0d1e14');
      R(3, 2, 6, 1, '#8a8478');
      break;
    }
    case 'rice': {                                     // an onigiri, in its wrapper
      ctx.fillStyle = '#f4f1ea'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 2 * u); ctx.lineTo(x + 14 * u, y + 12 * u); ctx.lineTo(x + 2 * u, y + 12 * u); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 4 * u); ctx.lineTo(x + 11 * u, y + 9 * u); ctx.lineTo(x + 5 * u, y + 9 * u); ctx.fill();
      R(5, 9, 6, 3, '#1c2a20'); R(5, 9, 6, 1, '#2f4a38');
      break;
    }
    case 'dice': {
      R(2, 2, 12, 12, '#241d28'); R(3, 3, 10, 10, '#f4f1ea'); R(3, 3, 10, 1, '#ffffff'); R(3, 12, 10, 1, '#c8c2b8');
      const pips = [[5, 5], [10, 5], [5, 10], [10, 10], [7.5, 7.5]];
      for (let i = 0; i < pips.length; i++) { const on = i < 4 || (Math.floor((t || 0) * 2) % 2); if (on) R(pips[i][0] - 0.5, pips[i][1] - 0.5, 2, 2, '#c8402c'); }
      break;
    }
    case 'metronome': {
      ctx.fillStyle = '#6a4a2e'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 1 * u); ctx.lineTo(x + 13 * u, y + 14 * u); ctx.lineTo(x + 3 * u, y + 14 * u); ctx.fill();
      ctx.fillStyle = '#8a6440'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 3 * u); ctx.lineTo(x + 11 * u, y + 12 * u); ctx.lineTo(x + 5 * u, y + 12 * u); ctx.fill();
      const sw = Math.sin((t || 0) * 4) * 2.4;
      line(ctx, x + 8 * u, y + 12 * u, x + (8 + sw) * u, y + 3 * u, '#ffd24a');
      R(7.4 + sw * 0.7, 5, 1.4, 1.4, '#c8402c');
      R(3, 13, 10, 1, '#3a2410');
      break;
    }
    case 'shield': {
      ctx.fillStyle = '#2f4a68'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 1 * u); ctx.lineTo(x + 14 * u, y + 4 * u); ctx.lineTo(x + 8 * u, y + 15 * u);
      ctx.lineTo(x + 2 * u, y + 4 * u); ctx.fill();
      ctx.fillStyle = '#4a86f7'; ctx.beginPath();
      ctx.moveTo(x + 8 * u, y + 3 * u); ctx.lineTo(x + 12 * u, y + 5 * u); ctx.lineTo(x + 8 * u, y + 12 * u);
      ctx.lineTo(x + 4 * u, y + 5 * u); ctx.fill();
      R(7, 5, 2, 5, '#d8f4ff');
      break;
    }
    case 'ten': {                                      // the numeral, because a card with a number on it reads
      R(2, 4, 2, 8, '#ffd24a'); R(2, 4, 2, 1, '#fff2b0'); R(1, 4, 2, 2, '#ffd24a');
      R(7, 4, 6, 8, '#c8a03a'); R(8, 5, 4, 6, '#241d28'); R(7, 4, 6, 1, '#ffd24a');
      ctx.globalAlpha = 0.3 * puls; R(1, 3, 13, 10, '#ffd24a'); ctx.globalAlpha = 1;
      break;
    }
    case 'sustain': {                                  // a held note: a head and a long bar
      R(2, 6, 4, 4, '#ffd24a'); R(2, 6, 4, 1, '#fff2b0'); R(2, 9, 4, 1, '#c8a03a');
      R(6, 7, 8, 2, '#6be585'); R(6, 7, 8, 1, '#c8ffd8');
      ctx.globalAlpha = 0.4 * puls; R(6, 6, 8, 4, '#6be585'); ctx.globalAlpha = 1;
      R(13, 5, 1, 6, '#2f7a4a');
      break;
    }
    case 'drum': {
      ellipsePx(ctx, x + 8 * u, y + 5 * u, 6 * u, 2.4 * u, '#f0ece2');
      R(2, 5, 12, 6, '#c8402c'); R(2, 5, 12, 1, '#e8604a'); R(2, 10, 12, 1, '#8a2a12');
      for (let i = 0; i < 4; i++) line(ctx, x + (2.5 + i * 3.2) * u, y + 5 * u, x + (4 + i * 3.2) * u, y + 11 * u, '#f0ece2');
      ellipsePx(ctx, x + 8 * u, y + 11 * u, 6 * u, 2.2 * u, '#a8322a');
      line(ctx, x + 11 * u, y + 1 * u, x + 6 * u, y + 5 * u, '#c8a03a');
      break;
    }
    case 'ear': {                                      // an earplug, foam, in a lit ear
      ellipsePx(ctx, x + 7 * u, y + 8 * u, 5 * u, 6 * u, '#e8b890');
      ellipsePx(ctx, x + 7 * u, y + 8 * u, 3 * u, 4 * u, '#b8845c');
      ellipsePx(ctx, x + 8 * u, y + 8 * u, 2.4 * u, 3 * u, '#f2a03a');
      R(9, 6, 3, 4, '#f2c94c'); R(9, 6, 3, 1, '#fff2b0');
      break;
    }
    case 'bolt': {
      ctx.fillStyle = '#c8a03a'; ctx.beginPath();
      ctx.moveTo(x + 10 * u, y + 1 * u); ctx.lineTo(x + 4 * u, y + 8 * u); ctx.lineTo(x + 7.5 * u, y + 8 * u);
      ctx.lineTo(x + 6 * u, y + 15 * u); ctx.lineTo(x + 12 * u, y + 7 * u); ctx.lineTo(x + 8.5 * u, y + 7 * u); ctx.fill();
      ctx.globalAlpha = 0.5 + 0.5 * puls; ctx.fillStyle = '#ffd24a'; ctx.beginPath();
      ctx.moveTo(x + 9.5 * u, y + 2.5 * u); ctx.lineTo(x + 5.5 * u, y + 7.5 * u); ctx.lineTo(x + 8 * u, y + 7.5 * u);
      ctx.lineTo(x + 7 * u, y + 13 * u); ctx.lineTo(x + 11 * u, y + 7.5 * u); ctx.lineTo(x + 9 * u, y + 7.5 * u); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
    case 'encore': {                                   // a curtain, half open, and the arrow that sends it back
      R(1, 1, 3, 14, '#8a1a2a'); R(1, 1, 3, 1, '#c8402c'); R(12, 1, 3, 14, '#8a1a2a'); R(12, 1, 3, 1, '#c8402c');
      R(4, 1, 8, 2, '#c8a03a'); R(4, 1, 8, 1, '#ffd24a');
      R(4, 3, 8, 11, '#1b1020');
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath(); ctx.moveTo(x + 5 * u, y + 9 * u); ctx.lineTo(x + 8 * u, y + 5 * u); ctx.lineTo(x + 8 * u, y + 13 * u); ctx.fill();
      R(8, 8, 3, 2, '#ffd24a');
      break;
    }
    case 'ticket': {
      R(2, 4, 12, 8, '#f4f1ea'); R(2, 4, 12, 1, '#ffffff'); R(2, 11, 12, 1, '#c8c2b8');
      R(7, 4, 1, 8, '#b8b2a8');
      for (let i = 0; i < 4; i++) R(3, 6 + i * 1.6, 3, 1, '#4a4058');
      R(9, 6, 4, 4, '#2f6a4a'); R(9, 6, 4, 1, '#6be585');
      break;
    }
    case 'clover': {
      for (const d of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) circle(ctx, x + (8 + d[0]) * u, y + (7 + d[1]) * u, 3 * u, '#2f7a4a');
      for (const d of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) circle(ctx, x + (8 + d[0]) * u, y + (6.4 + d[1]) * u, 2 * u, '#6be585');
      R(7.4, 10, 1.2, 5, '#2f7a4a');
      break;
    }
    case 'crown': {
      ctx.fillStyle = '#c8a03a'; ctx.beginPath();
      ctx.moveTo(x + 2 * u, y + 12 * u); ctx.lineTo(x + 2 * u, y + 4 * u); ctx.lineTo(x + 5 * u, y + 8 * u);
      ctx.lineTo(x + 8 * u, y + 3 * u); ctx.lineTo(x + 11 * u, y + 8 * u); ctx.lineTo(x + 14 * u, y + 4 * u);
      ctx.lineTo(x + 14 * u, y + 12 * u); ctx.fill();
      R(2, 10, 12, 1, '#ffd24a'); R(2, 12, 12, 1, '#8a6010');
      R(7.4, 6, 1.4, 1.4, '#c8402c'); R(3.4, 8, 1.4, 1.4, '#4a86f7'); R(11.4, 8, 1.4, 1.4, '#6be585');
      break;
    }
    case 'heart': {
      circle(ctx, x + 5.5 * u, y + 6 * u, 3.2 * u, '#c8402c');
      circle(ctx, x + 10.5 * u, y + 6 * u, 3.2 * u, '#c8402c');
      ctx.fillStyle = '#c8402c'; ctx.beginPath();
      ctx.moveTo(x + 2.4 * u, y + 7 * u); ctx.lineTo(x + 13.6 * u, y + 7 * u); ctx.lineTo(x + 8 * u, y + 14 * u); ctx.fill();
      circle(ctx, x + 5.5 * u, y + 5.2 * u, 1.6 * u, '#e8503a');
      ctx.globalAlpha = 0.25 * puls; circle(ctx, x + 8 * u, y + 8 * u, 7 * u, '#e8503a'); ctx.globalAlpha = 1;
      break;
    }
    case 'amp': {
      R(1, 2, 14, 12, '#2a2030'); R(1, 2, 14, 1, '#5a4a60'); R(1, 13, 14, 1, '#140e18');
      R(3, 5, 10, 7, '#5a4a3a');
      for (let a = 3; a < 13; a += 2) for (let b = 5; b < 12; b += 2) R(a, b, 1, 1, '#3a2f26');
      R(3, 3, 10, 1, '#c8a03a');
      line(ctx, x + 4 * u, y + 5 * u, x + 11 * u, y + 11 * u, '#8ad8ff');
      R(12, 3, 2, 1, '#6be585');
      break;
    }
    case 'mask': {                                     // the cursed ones: a theatre mask, not smiling
      ctx.fillStyle = '#c8c2b8'; ctx.beginPath();
      ctx.moveTo(x + 3 * u, y + 3 * u); ctx.lineTo(x + 13 * u, y + 3 * u); ctx.lineTo(x + 11 * u, y + 13 * u);
      ctx.lineTo(x + 5 * u, y + 13 * u); ctx.fill();
      R(3, 3, 10, 1, '#f4f1ea');
      R(5, 6, 2.4, 2, '#12101c'); R(8.6, 6, 2.4, 2, '#12101c');
      R(6, 10, 4, 1, '#12101c'); R(5.4, 9.4, 1, 1, '#12101c'); R(9.6, 9.4, 1, 1, '#12101c');
      ctx.globalAlpha = 0.4; R(3, 3, 10, 10, '#8a2a4a'); ctx.globalAlpha = 1;
      break;
    }
    case 'wing': {                                     // the dragonfly off the tail of the plane
      R(7.4, 2, 1.6, 12, '#c8a03a'); R(7.4, 2, 1.6, 1, '#ffd24a');
      circle(ctx, x + 8 * u, y + 2.4 * u, 1.6 * u, '#ffd24a');
      for (const d of [-1, 1]) {
        ctx.fillStyle = '#e0b23c'; ctx.beginPath();
        ctx.moveTo(x + 8 * u, y + 4.5 * u); ctx.lineTo(x + (8 + d * 7) * u, y + 3 * u); ctx.lineTo(x + (8 + d * 6) * u, y + 6 * u); ctx.fill();
        ctx.fillStyle = '#8a6a1a'; ctx.beginPath();
        ctx.moveTo(x + 8 * u, y + 7 * u); ctx.lineTo(x + (8 + d * 5.5) * u, y + 6.5 * u); ctx.lineTo(x + (8 + d * 4.5) * u, y + 9 * u); ctx.fill();
      }
      break;
    }
    case 'clock': {
      circle(ctx, x + 8 * u, y + 8 * u, 6.5 * u, '#3a3f4a');
      circle(ctx, x + 8 * u, y + 8 * u, 5.5 * u, '#f0ece2');
      circle(ctx, x + 7.4 * u, y + 7.4 * u, 3.4 * u, '#ffffff');
      R(7.4, 4, 1.2, 4.4, '#241d28'); R(8, 7.4, 3.4, 1.2, '#c8402c');
      R(7, 1, 2, 2, '#8a8f98');
      break;
    }
    case 'bomb': {
      circle(ctx, x + 7.5 * u, y + 9.5 * u, 5 * u, '#241d28');
      circle(ctx, x + 6 * u, y + 8 * u, 2 * u, '#4a4458');
      R(7, 3, 2, 2, '#6a6478');
      line(ctx, x + 9 * u, y + 4 * u, x + 13 * u, y + 1 * u, '#8a6440');
      ctx.globalAlpha = puls; circle(ctx, x + 13 * u, y + 1.5 * u, 2 * u, '#ffd24a'); ctx.globalAlpha = 1;
      break;
    }
    default: {                                         // an unknown icon is a gold question, not a crash
      R(2, 2, 12, 12, '#3a3050'); R(2, 2, 12, 1, '#5a4a78'); R(2, 13, 12, 1, '#1b1428');
      drawText(ctx, '?', x + 8 * u, y + 4 * u, '#ffd24a', { align: 'center', scale: Math.max(1, Math.round(s / 14)) });
    }
  }
}

// ---------- the card itself ----------
// Drawn twice: face down while it is still in the air, face up once it has
// landed. The frame carries the rarity so you can read the row at a glance
// without going near the small print.
function upgCardBack(ctx, x, y, w, h, t) {
  ctx.fillStyle = 'rgba(6,4,12,0.5)'; ctx.fillRect(x + 5, y + 6, w, h);
  rect(ctx, x, y, w, h, '#0d0b16');
  rect(ctx, x + 2, y + 2, w - 4, h - 4, '#241d33');
  frame(ctx, x + 2, y + 2, w - 4, h - 4, '#4a4068');
  // a lattice of little gold diamonds, the back of every deck ever printed
  ctx.save(); ctx.beginPath(); ctx.rect(x + 8, y + 8, w - 16, h - 16); ctx.clip();
  for (let a = 0; a < w; a += 16) for (let b = 0; b < h; b += 16) {
    const ox = x + a + ((b / 16) % 2 ? 8 : 0);
    ctx.globalAlpha = 0.34;
    rect(ctx, ox + 6, y + b + 7, 3, 3, '#c8a03a'); rect(ctx, ox + 5, y + b + 8, 5, 1, '#c8a03a');
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  frame(ctx, x + 8, y + 8, w - 16, h - 16, '#c8a03a');
  drawUpgradeIcon(ctx, x + w / 2 - 18, y + h / 2 - 18, 36, 'note', t);
}
function upgCardFace(ctx, c, up, t, sel, dim) {
  const x = c.x, y = c.y, w = c.w, h = c.h;
  const R = UPG_RARITY[up.rarity] || UPG_RARITY.common;
  const cursed = up.tags && up.tags.indexOf('cursed') >= 0;
  // the glow behind it, strongest on the good ones, breathing
  const g = R.glow * (sel ? 1.6 : 1) * (0.7 + 0.3 * Math.sin(t * 2.4 + x * 0.02));
  ctx.globalAlpha = g * 0.4;
  for (let i = 4; i >= 1; i--) frame(ctx, x - i * 3, y - i * 3, w + i * 6, h + i * 6, R.col);
  ctx.globalAlpha = 1;
  if (sel && up.rarity !== 'common') speedLines(ctx, x + w / 2, y + h / 2, w * 0.6, w * 1.05, 14, R.col, t, 0.13);
  // the card: dark stock, a rarity rail and a paper field
  ctx.fillStyle = 'rgba(4,3,10,0.55)'; ctx.fillRect(x + 6, y + 8, w, h);
  rect(ctx, x, y, w, h, R.lo);
  rect(ctx, x + 3, y + 3, w - 6, h - 6, '#1b1626');
  rect(ctx, x + 3, y + 3, w - 6, 1, lighten(R.col, 0.2));
  rect(ctx, x + 3, y + h - 4, w - 6, 1, '#08060e');
  frame(ctx, x, y, w, h, R.col);
  // ---- the rarity ribbon
  rect(ctx, x + 3, y + 3, w - 6, 20, R.col);
  rect(ctx, x + 3, y + 3, w - 6, 1, R.hi);
  rect(ctx, x + 3, y + 22, w - 6, 1, R.lo);
  drawText(ctx, cursed ? R.name + ' - CURSED' : R.name, x + w / 2, y + 9, up.rarity === 'legend' ? '#3a2a08' : '#f4f1ea', { align: 'center', scale: 1 });
  // ---- the ornament, which is how the tiers differ without reading anything
  if (up.rarity === 'rare' || up.rarity === 'epic' || up.rarity === 'legend') {
    for (const p of [[x + 6, y + 26], [x + w - 9, y + 26], [x + 6, y + h - 9], [x + w - 9, y + h - 9]]) {
      rect(ctx, p[0], p[1], 3, 3, R.col); px(ctx, p[0] + 1, p[1] + 1, R.hi);
    }
  }
  if (up.rarity === 'epic' || up.rarity === 'legend') {
    frame(ctx, x + 6, y + 26, w - 12, h - 34, withAlpha(R.col, 0.5));
    for (let i = 0; i < 3; i++) { rect(ctx, x + w / 2 - 14 + i * 12, y + h - 7, 4, 2, R.col); }
  }
  if (up.rarity === 'legend') {
    // gold does not sit still: a few sparks crawl the frame
    for (let i = 0; i < 5; i++) {
      const k = ((t * 0.32 + i / 5) % 1) * (w * 2 + h * 2);
      let sx2 = x, sy2 = y;
      if (k < w) { sx2 = x + k; sy2 = y; } else if (k < w + h) { sx2 = x + w; sy2 = y + (k - w); }
      else if (k < w * 2 + h) { sx2 = x + w - (k - w - h); sy2 = y + h; } else { sx2 = x; sy2 = y + h - (k - w * 2 - h); }
      rect(ctx, sx2 - 1, sy2 - 1, 3, 3, '#fff4bc');
    }
  }
  // ---- the icon, in a slot
  const ix = x + w / 2 - 38, iy = y + 32;
  rect(ctx, ix - 5, iy - 5, 86, 86, '#0d0b16');
  frame(ctx, ix - 5, iy - 5, 86, 86, darken(R.col, 0.25));
  ctx.globalAlpha = 0.14; rect(ctx, ix - 4, iy - 4, 84, 40, R.col); ctx.globalAlpha = 1;
  halftone(ctx, ix - 4, iy - 4, 84, 84, R.col, 5, 0.1);
  drawUpgradeIcon(ctx, ix, iy, 76, up.icon, t + (sel ? 0 : 1.7));
  // a pool of the rarity colour on the shelf under it, because a lit thing lights something
  ctx.globalAlpha = 0.2; ellipsePx(ctx, x + w / 2, iy + 84, 40, 6, R.col); ctx.globalAlpha = 1;
  // ---- the name, as big as the card will take
  let sc = 2;
  const nameLines = wrapText(up.name, 15);
  nameLines.forEach((l, i) => drawText(ctx, l, x + w / 2, y + 128 + i * 18, '#fff4d8', { align: 'center', scale: sc, outline: '#12101c' }));
  rect(ctx, x + 18, y + 128 + nameLines.length * 18 + 4, w - 36, 1, withAlpha(R.col, 0.6));
  // ---- the line that has to do all the work
  drawWrapped(ctx, up.desc, x + 12, y + 128 + nameLines.length * 18 + 12, 30, '#cfc9e6', 10, { font: 'small' });
  // ---- what it is about, bottom left, for the people who like sorting things
  if (up.tags && up.tags.length) {
    let tx = x + 10;
    for (const tag of up.tags.slice(0, 2)) {
      const tw = textWidth(tag.toUpperCase(), { font: 'small' }) + 8;
      rect(ctx, tx, y + h - 20, tw, 11, tag === 'cursed' ? '#5a1424' : '#2a2438');
      drawText(ctx, tag.toUpperCase(), tx + 4, y + h - 17, tag === 'cursed' ? '#e8807a' : '#8a82a8', { font: 'small' });
      tx += tw + 4;
    }
  }
  if (dim) { ctx.globalAlpha = 0.42; rect(ctx, x, y, w, h, '#0a0814'); ctx.globalAlpha = 1; }
  if (sel) { const k = Math.floor(t * 8) % 2; frame(ctx, x - 2 + k, y - 2, w + 4, h + 4, '#fff8e8'); frame(ctx, x - 3 + k, y - 3, w + 6, h + 6, R.col); }
}

// ---------- the room both of these screens happen in ----------
// Behind the venue, after the song stops. A breeze-block wall somebody painted
// black once and never touched up, a roller shutter that stays down the whole
// time a band is in the building, the flight cases you will be carrying again
// in twenty minutes, and the green of the fire door - the only light in here
// that is on whether anybody is or not. All of it is deliberately dim. The
// cards are the thing being read, and a back wall that competes with them is a
// back wall nobody looks at twice.
//
// The still half is painted once into a cached canvas, because it is about
// nine hundred rectangles and it does not move.
function upgBackroomWall(floorY) {
  return cached('upg|backroom|' + floorY, function () {
    const c = makeCanvas(W, floorY), x = c.getContext('2d'), r = makeRng(hashStr('backroom'));
    vgrad(x, 0, 0, W, floorY, '#2a2038', '#0e0b18');
    // breeze block: 64 by 26, every other course offset half a block, each one
    // a slightly different grey because they were never all the same batch
    for (let row = 0, y = -8; y < floorY; row++, y += 26) {
      const off = (row % 2) ? -32 : 0;
      for (let bx = off - 64; bx < W + 64; bx += 64) {
        const tone = r.range(0, 1);
        rect(x, bx + 1, y + 1, 62, 24, tone > 0.86 ? '#261e3c' : tone > 0.5 ? '#1f1930' : '#1b1629');
        rect(x, bx + 1, y + 1, 62, 1, '#332b4c');
        rect(x, bx + 1, y + 24, 62, 1, '#110e1c');
        rect(x, bx, y, 1, 26, '#130f20');
      }
    }
    // the damp that comes up the bottom of every basement wall anywhere
    x.globalAlpha = 0.45;
    for (let i = 0; i < 90; i++) rect(x, r.int(0, W), r.int(floorY - 130, floorY), r.int(6, 40), r.int(1, 3), '#2b3a34');
    x.globalAlpha = 1;
    halftone(x, 0, floorY - 160, W, 160, '#080b10', 5, 0.22);
    // the pipe run along the ceiling, with its clamps
    rect(x, 0, 16, W, 8, '#332e44'); rect(x, 0, 16, W, 2, '#4e4768'); rect(x, 0, 23, W, 1, '#16121f');
    for (let bx = 26; bx < W; bx += 118) { rect(x, bx, 12, 8, 15, '#423c58'); rect(x, bx, 12, 8, 2, '#5d5578'); }

    // ---- the roller shutter: load-in, shut, and staying shut
    const sy = 100, sx0 = 36, sw = 222;
    rect(x, sx0 - 4, sy - 14, sw + 8, 15, '#262232'); rect(x, sx0 - 4, sy - 14, sw + 8, 2, '#413a54');
    for (let y = sy; y < floorY - 9; y += 9) {
      rect(x, sx0, y, sw, 8, '#2b3040'); rect(x, sx0, y, sw, 2, '#3f4658'); rect(x, sx0, y + 7, sw, 1, '#171b24');
    }
    rect(x, sx0 - 5, sy, 6, floorY - sy, '#413c50'); rect(x, sx0 + sw - 1, sy, 6, floorY - sy, '#413c50');
    rect(x, sx0 - 5, sy, 2, floorY - sy, '#575070'); rect(x, sx0 + sw - 1, sy, 2, floorY - sy, '#575070');
    rect(x, sx0 - 2, floorY - 10, sw + 4, 10, '#4e4862'); rect(x, sx0 - 2, floorY - 10, sw + 4, 2, '#6c648a');
    rect(x, sx0 + sw / 2 - 8, floorY - 30, 16, 12, '#585272'); rect(x, sx0 + sw / 2 - 8, floorY - 30, 16, 2, '#7a7298');
    circle(x, sx0 + sw / 2, floorY - 33, 5, '#2a2636'); ringPx(x, sx0 + sw / 2, floorY - 33, 5, '#8a83a8');
    drawText(x, 'LOAD IN', sx0 + sw / 2, sy + 40, '#4a4460', { align: 'center', scale: 2 });
    drawText(x, 'KEEP CLEAR AT ALL TIMES', sx0 + sw / 2, sy + 62, '#3c3750', { align: 'center', font: 'small' });

    // ---- the fire extinguisher nobody has checked since the last landlord
    const ex = 292, eb = floorY - 4;
    rect(x, ex - 8, eb - 46, 16, 46, '#8a2a20'); rect(x, ex - 8, eb - 46, 4, 46, '#b84030'); rect(x, ex + 5, eb - 46, 3, 46, '#5a1610');
    rect(x, ex - 5, eb - 56, 10, 11, '#3a3440'); rect(x, ex - 5, eb - 56, 10, 2, '#5c5468');
    rect(x, ex - 12, eb - 52, 8, 3, '#2a2530');
    rect(x, ex - 7, eb - 34, 14, 14, '#d8d2c4'); rect(x, ex - 7, eb - 34, 14, 1, '#f4f1ea');
    rect(x, ex - 5, eb - 31, 10, 2, '#8a2a20'); rect(x, ex - 5, eb - 27, 8, 1, '#6a6478'); rect(x, ex - 5, eb - 24, 10, 1, '#6a6478');

    // ---- the wedge monitor that got dragged off the stage first
    const wx = 404, wb = floorY - 2;
    rect(x, wx, wb - 26, 96, 26, '#1a1722'); rect(x, wx, wb - 26, 96, 2, '#2e2a3c');
    rect(x, wx + 10, wb - 44, 78, 20, '#201c2a'); rect(x, wx + 10, wb - 44, 78, 2, '#37324a');
    for (let gx = wx + 14; gx < wx + 84; gx += 4) for (let gy = wb - 41; gy < wb - 8; gy += 4) rect(x, gx, gy, 2, 2, '#0e0c16');
    rect(x, wx + 4, wb - 3, 88, 3, '#0a0812');
    rect(x, wx + 78, wb - 20, 10, 5, '#3e3850');

    // ---- a coil of cable, dropped where it was unplugged
    const cx2 = 344, cy2 = floorY - 8;
    for (let i = 0; i < 3; i++) { ellipseRingPx(x, cx2, cy2 - i, 22 - i * 5, 7 - i * 1.6, '#181520'); ellipseRingPx(x, cx2, cy2 - i - 1, 22 - i * 5, 7 - i * 1.6, '#302a3e'); }
    rect(x, cx2 + 18, cy2 - 4, 14, 3, '#241f30'); rect(x, cx2 + 30, cy2 - 6, 8, 6, '#6a6478'); rect(x, cx2 + 30, cy2 - 6, 8, 2, '#8a83a8');

    // ---- a mic stand, folded wrong, leaning on the wall
    const mx = 580;
    ellipsePx(x, mx, floorY - 3, 17, 5, '#1a1722'); ellipsePx(x, mx, floorY - 5, 17, 5, '#332d44'); ellipsePx(x, mx, floorY - 6, 11, 3, '#231e30');
    rect(x, mx - 2, floorY - 118, 4, 114, '#3d374e'); rect(x, mx - 2, floorY - 118, 1, 114, '#5b5372');
    rect(x, mx - 2, floorY - 72, 4, 6, '#6a6380');
    rect(x, mx, floorY - 122, 34, 4, '#3d374e'); rect(x, mx, floorY - 122, 34, 1, '#5b5372');
    rect(x, mx + 30, floorY - 126, 8, 10, '#1d1a26'); rect(x, mx + 30, floorY - 126, 8, 2, '#3a3448');

    // ---- the flight cases, stencilled, stacked, waiting for you
    const caseBox = (bx, by, bw, bh, label) => {
      rect(x, bx, by, bw, bh, '#191622'); rect(x, bx, by, bw, 2, '#2c2738'); rect(x, bx, by + bh - 2, bw, 2, '#0d0b14');
      for (let hy = by + 4; hy < by + bh - 4; hy += 6) { x.globalAlpha = 0.5; rect(x, bx + 3, hy, bw - 6, 1, '#221d2e'); x.globalAlpha = 1; }
      rect(x, bx, by + Math.round(bh * 0.42), bw, 4, '#6f7684'); rect(x, bx, by + Math.round(bh * 0.42), bw, 1, '#9aa2b2');
      rect(x, bx, by + Math.round(bh * 0.42) + 3, bw, 1, '#3d424e');
      // the ball corners, which are the only part of a flight case that ever
      // takes the fall it was bought for
      for (const cxp of [bx, bx + bw - 9]) {
        rect(x, cxp, by, 9, 9, '#7c8492'); rect(x, cxp, by, 9, 2, '#a7aebc');
        rect(x, cxp, by + bh - 9, 9, 9, '#7c8492'); rect(x, cxp, by + bh - 7, 9, 2, '#414652');
      }
      for (const kx of [bx + Math.round(bw * 0.24), bx + Math.round(bw * 0.72)]) {
        rect(x, kx, by + Math.round(bh * 0.42) - 4, 13, 12, '#9aa2b2'); rect(x, kx, by + Math.round(bh * 0.42) - 4, 13, 2, '#c6ccd8');
        rect(x, kx + 4, by + Math.round(bh * 0.42) - 1, 5, 6, '#2b303a');
      }
      drawText(x, label, bx + bw / 2, by + Math.round(bh * 0.42) + 12, '#5e6472', { align: 'center', font: 'small' });
    };
    caseBox(690, floorY - 78, 158, 78, 'FRAGILE THIS WAY UP');
    caseBox(702, floorY - 136, 134, 58, 'BUG BUSKER ORCH.');
    caseBox(862, floorY - 56, 82, 56, 'CABLES');

    // ---- the setlist, off the floor, still taped where it was taped
    const px3 = 636, py3 = 196;
    x.globalAlpha = 0.9; rect(x, px3, py3, 44, 58, '#d8d2c0'); x.globalAlpha = 1;
    rect(x, px3, py3, 44, 1, '#f4f1ea'); rect(x, px3, py3 + 57, 44, 1, '#9a9488');
    for (let i = 0; i < 7; i++) rect(x, px3 + 6, py3 + 9 + i * 7, r.int(16, 32), 2, '#4a4458');
    for (const [tx2, ty2] of [[px3 - 5, py3 - 5], [px3 + 36, py3 - 5], [px3 - 5, py3 + 50], [px3 + 36, py3 + 50]]) {
      rect(x, tx2, ty2, 14, 9, '#2f3a42'); rect(x, tx2, ty2, 14, 2, '#4a5a64');
    }
    return c;
  });
}
// The live half: the fire door sign, which hums, and the light it throws.
function upgBackroom(ctx, t, opts) {
  const o = opts || {}, floorY = o.floorY != null ? o.floorY : H - 22;
  ctx.drawImage(upgBackroomWall(floorY), 0, 0);
  // ---- the floor: concrete, sealed once, with the tape that marks the line
  // past which the fire officer stops being reasonable. It goes down before
  // the sign, so the sign has something to spill onto.
  sideFloor(ctx, 0, W, floorY, { h: H - floorY, col: '#1d1928', col2: '#171320', lip: '#3a3450', tile: 72, shine: false });
  ctx.globalAlpha = 0.45; rect(ctx, 0, floorY + 9, W, 3, '#8a7a2a'); ctx.globalAlpha = 1;
  // the exit sign over the shutter. Fluorescent tubes on their last legs do
  // not blink, they dip - so this dips, and takes the wall down with it.
  const buzz = 0.82 + 0.18 * Math.sin(t * 31) * Math.sin(t * 7.3);
  const ex = 147, ey = 62;
  rect(ctx, ex - 34, ey - 3, 68, 28, '#171420'); frame(ctx, ex - 34, ey - 3, 68, 28, '#2e2a3c');
  ctx.globalAlpha = buzz;
  rect(ctx, ex - 31, ey, 62, 22, '#1d6b3f'); rect(ctx, ex - 31, ey, 62, 2, '#6be585');
  drawText(ctx, 'EXIT', ex, ey + 7, '#d8ffe4', { align: 'center', scale: 2 });
  ctx.globalAlpha = 1;
  lightPool(ctx, ex, ey + 30, 132, '#6be585', 0.11 * buzz);
  ctx.globalAlpha = 0.1 * buzz;
  ellipsePx(ctx, ex, floorY + 4, 96, 13, '#6be585');
  ctx.globalAlpha = 1;
  if (o.dim) { ctx.globalAlpha = o.dim; rect(ctx, 0, 0, W, H, '#07060e'); ctx.globalAlpha = 1; }
}

// ---------- the pick, after every song ----------
// Three cards, a reroll you probably cannot afford, and a skip that pays for
// dinner. It has to be fast: this screen happens nine times a day.
class UpgradeScene {
  constructor(opts) {
    const o = opts || {};
    this.opts = o;
    this.run = upgRunOf(o);
    this.onDone = o.onDone || function () { };
    this.songIndex = o.songIndex || 0;
    this.title = o.title || 'PICK ONE';
    this.t = 0; this.sel = 0; this.phase = 'deal'; this.taken = null; this.takenT = 0; this.done = false;
    this.msg = null; this.msgT = 0; this.hoverBtn = null;
    this.fx = new Particles();
    upgEnsureFame(this.run);
    this.rerolls = o.rerolls != null ? o.rerolls : (this.run.perks.rerollTokens || 1);
    this.rerollCost = Math.max(0, 6 + this.songIndex * 2 - (this.run.perks.rerollDiscount || 0));
    this.skipCash = 10 + this.songIndex * 3;
    // stamina back between numbers, for whoever bought it
    this.stamBack = upgSongTick(this.run);
    this.picks = upgRoll(this.run, 3, []);
    // a run long enough to have taken everything twice still gets a table to
    // look at, because an empty screen reads as a crash
    if (!this.picks.length) this.picks = SONG_UPGRADES.slice(0, 3);
    this.layout();
    this.rerollBtn = new Btn(112, 468, 244, 46, 'REROLL', () => this.reroll(), { scale: 3, color: UI.blue, hi: UI.blueHi, lo: UI.blueLo, ol: '#14243a' });
    this.skipBtn = new Btn(W - 356, 468, 244, 46, 'SKIP', () => this.skip(), { scale: 3, color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1410' });
    // a row of silhouettes at the back, packing up while you decide
    this.crowd = makeSideCrowd(9, hashStr('upgrade' + this.songIndex), { x0: 0, x1: W, floors: 1, min: 0.8, max: 1.1 });
    Audio.ui('whoosh');
  }
  // three slots, centred, with the deck they came off in the top-left corner
  layout() {
    const n = Math.max(1, this.picks.length), cw = 214, ch = 286, gap = 26;
    const x0 = Math.round((W - (n * cw + (n - 1) * gap)) / 2);
    this.cards = this.picks.map((up, i) => ({
      up, w: cw, h: ch, sx: x0 + i * (cw + gap), sy: 92,
      x: x0 + i * (cw + gap), y: 92, delay: 0.18 + i * 0.2,
    }));
    this.deck = { x: 30, y: H - 132 };
  }
  get dealt() { return this.t > 0.18 + (this.cards.length - 1) * 0.2 + 0.58; }
  reroll() {
    if (this.phase !== 'pick' && !this.dealt) return;
    if (this.taken) return;
    const r = this.run;
    if (this.rerolls > 0) {
      this.rerolls--;
      if (r.perks.rerollTokens) r.perks.rerollTokens = Math.max(0, r.perks.rerollTokens - 1);
    } else if (r.money >= this.rerollCost) {
      r.money -= this.rerollCost;
      this.rerollCost += 4;                            // the second one always costs more
    } else { Audio.ui('error'); this.flash('NOT ENOUGH FOR THAT'); return; }
    Audio.ui('whoosh');
    let next = upgRoll(this.run, 3, this.picks.map(p => p.id));
    if (!next.length) next = upgRoll(this.run, 3, []);
    if (!next.length) next = this.picks;                 // the deck is out: keep what is on the table
    this.picks = next;
    this.layout();
    this.t = 0; this.sel = clamp(this.sel, 0, this.picks.length - 1);
    if (r.save) r.save();
  }
  skip() {
    if (this.taken || this.done) return;
    this.run.money += this.skipCash;
    Audio.ui('cash');
    this.fx.burst(W / 2, H - 80, 22, { color: ['#ffd24a', '#fff2b0'], speed: 120, life: 0.7, kind: 'star', size: 2, gravity: 90 });
    this.taken = { i: -1, up: null };
    this.takenT = 0;
    if (this.run.save) this.run.save();
  }
  choose(i) {
    if (this.taken || this.done) return;
    if (!this.dealt) { this.t = 9; return; }            // impatient: land the cards and let them pick
    const up = this.picks[i]; if (!up) return;
    upgTake(this.run, up);
    this.taken = { i, up };
    this.takenT = 0;
    this.sel = i;
    Audio.ui('levelup');
    if (Game.shake) Game.shake.hit(2.6, 0.22);
    const R = UPG_RARITY[up.rarity] || UPG_RARITY.common;
    const c = this.cards[i];
    this.fx.burst(c.x + c.w / 2, c.y + c.h / 2, 46, { color: [R.col, R.hi, '#fff8e8'], speed: 190, life: 0.9, kind: 'star', size: 2, gravity: 130 });
    this.fx.burst(c.x + c.w / 2, c.y + c.h, 26, { color: ['#cfc9e6', '#8a82a8'], speed: 110, life: 0.5, kind: 'smoke', size: 3, gravity: -20 });
  }
  flash(m) { this.msg = m; this.msgT = 2.2; }
  update(dt) {
    this.t += dt;
    this.msgT = Math.max(0, (this.msgT || 0) - dt);
    this.fx.update(dt);
    if (this.rerollBtn) this.rerollBtn.update(dt);
    if (this.skipBtn) this.skipBtn.update(dt);
    if (this.dealt && this.phase === 'deal') this.phase = 'pick';
    if (this.taken) {
      this.takenT += dt;
      if (this.takenT > 0.9 && !this.done) { this.done = true; this.onDone(this.taken.up); }
    }
  }
  // where a card is right now: off the deck, spinning, or sat in its slot
  cardAt(i) {
    const c = this.cards[i];
    const k = clamp((this.t - c.delay) / 0.58, 0, 1);
    const e = easeOut(k);
    const x = Math.round(lerp(this.deck.x, c.sx, e));
    const y = Math.round(lerp(this.deck.y, c.sy, e) - Math.sin(k * Math.PI) * 54);
    const spin = (1 - k) * 3;
    const sx = Math.max(0.04, Math.abs(Math.cos(spin * Math.PI)));
    const back = (Math.floor(spin) % 2) === 1;
    // the selected card rides higher, and breathes
    const sel = i === this.sel && this.phase === 'pick' && !this.taken;
    const lift = sel ? -14 + Math.sin(this.t * 3) * 2 : Math.sin(this.t * 1.6 + i * 1.7) * 1.6;
    // and a picked card slams flat
    let slam = 0, squash = 1;
    if (this.taken && this.taken.i === i) {
      const s = clamp(this.takenT / 0.26, 0, 1);
      slam = -22 * (1 - easeIn(s));
      squash = s < 1 ? 1 + (1 - s) * 0.1 : 1 + Math.sin(this.takenT * 22) * 0.04 * Math.exp(-this.takenT * 4);
    }
    return { x, y: Math.round(y + lift + slam), w: c.w, h: c.h, sx, back, k, squash, sel };
  }
  key(code) {
    if (this.taken || !this.picks.length) return;
    if (code === 'ArrowLeft' || code === 'KeyA') { this.sel = (this.sel + this.picks.length - 1) % this.picks.length; Audio.ui('move'); return; }
    if (code === 'ArrowRight' || code === 'KeyD') { this.sel = (this.sel + 1) % this.picks.length; Audio.ui('move'); return; }
    if (code === 'KeyR') { this.reroll(); return; }
    if (code === 'KeyS' || code === 'Escape') { this.skip(); return; }
    if (['Enter', 'Space', 'KeyZ'].includes(code)) this.choose(this.sel);
  }
  keyUp() {}
  click(x, y) {
    if (this.taken) return;
    if (this.rerollBtn.hit(x, y)) { this.rerollBtn.flash = 1; this.reroll(); return; }
    if (this.skipBtn.hit(x, y)) { this.skipBtn.flash = 1; this.skip(); return; }
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cardAt(i);
      if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) {
        if (this.sel === i) this.choose(i); else { this.sel = i; Audio.ui('move'); }
        return;
      }
    }
  }
  pointerDown(x, y) { this.click(x, y); }
  pointerUp() {}
  hover(x, y) {
    this.hoverBtn = null;
    if (this.taken) return;
    this.hoverBtn = this.rerollBtn.hit(x, y) ? 'r' : this.skipBtn.hit(x, y) ? 's' : null;
    for (let i = 0; i < this.cards.length; i++) {
      const c = this.cardAt(i);
      if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i;
    }
  }
  draw(ctx) {
    const t = this.t, r = this.run;
    // ---- the room: the back of a venue after the song stops
    upgBackroom(ctx, t, { floorY: H - 46 });
    // the crowd, filing out past the cases, dim enough never to fight a card
    ctx.globalAlpha = 0.32;
    for (const c of this.crowd) {
      const x = ((c.x + t * c.sp * 0.5) % (W + 80) + W + 80) % (W + 80) - 40;
      drawShadow(ctx, x, H - 42, 18 * c.sc, 0.2);
      drawBugAt(ctx, c.spec, x, H - 42, { pose: Math.floor(t * 5 + c.o) % 2 ? 'walk1' : 'walk2', scale: c.sc * 0.8, flip: c.sp < 0, bounce: 0.5, phase: c.o });
    }
    ctx.globalAlpha = 1;
    // three work lamps clipped to the pipe, each one throwing its own pool.
    // The rings are the song still ringing in the room, and in your head.
    for (let i = 0; i < 6; i++) {
      const rr = ((t * 80 + i * 96) % 620);
      ctx.globalAlpha = clamp(1 - rr / 620, 0, 1) * 0.08;
      ringPx(ctx, W / 2, 210, rr, '#ffd24a'); ctx.globalAlpha = 1;
    }
    for (let i = 0; i < 3; i++) {
      const lx = W / 2 - 250 + i * 250, lc = ['#ffd24a', '#8ad8ff', '#c58bff'][i];
      lightPool(ctx, lx, 120, 190, lc, 0.1);
      rect(ctx, lx - 1, 20, 2, 28, '#2a2438'); rect(ctx, lx - 1, 20, 1, 28, '#453e5c');
      rect(ctx, lx - 12, 46, 24, 4, '#403a54'); rect(ctx, lx - 12, 46, 24, 1, '#5e5678');
      ellipsePx(ctx, lx, 50, 11, 5, '#332e44'); ellipsePx(ctx, lx, 52, 7, 3, lighten(lc, 0.45));
      ctx.globalAlpha = 0.5; ellipsePx(ctx, lx, 53, 4, 2, '#ffffff'); ctx.globalAlpha = 1;
    }
    // ---- the deck the cards came off, a flight case with a setlist on it
    rect(ctx, this.deck.x - 4, this.deck.y - 4, 60, 84, '#12101c');
    rect(ctx, this.deck.x - 2, this.deck.y - 2, 56, 80, '#241d33');
    frame(ctx, this.deck.x - 2, this.deck.y - 2, 56, 80, '#c8a03a');
    for (let i = 0; i < 4; i++) { ctx.globalAlpha = 0.5; rect(ctx, this.deck.x + 4, this.deck.y + 6 + i * 4, 44, 2, '#4a4068'); ctx.globalAlpha = 1; }
    drawText(ctx, 'SET', this.deck.x + 26, this.deck.y + 58, '#8a82a8', { align: 'center', font: 'small' });
    // ---- the header
    uiRibbon(ctx, W / 2, 14, this.title, { scale: 3, color: '#4a6e3a' });
    drawText(ctx, 'SONG ' + (this.songIndex + 1) + ' DONE', 18, 18, '#8a82a8', { scale: 2 });
    drawText(ctx, fmtMoney(r.money), W - 18, 18, '#ffd24a', { align: 'right', scale: 3 });
    if (this.stamBack) drawText(ctx, '+' + this.stamBack + ' STAMINA', W - 18, 44, '#6be585', { align: 'right', font: 'small' });
    // ---- the cards, back to front so the selected one sits over its neighbours
    const order = [];
    for (let i = 0; i < this.cards.length; i++) order.push(i);
    order.sort((a, b) => (a === this.sel ? 1 : 0) - (b === this.sel ? 1 : 0));
    for (const i of order) {
      const c = this.cardAt(i), up = this.cards[i].up;
      const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(c.sx, c.squash); ctx.translate(-cx, -cy);
      if (c.back) upgCardBack(ctx, c.x, c.y, c.w, c.h, t);
      else upgCardFace(ctx, c, up, t, c.sel, this.taken && this.taken.i !== i);
      ctx.restore();
      if (this.taken && this.taken.i === i && this.takenT > 0.1) {
        comicBurst(ctx, cx, c.y + 62, 'TAKEN!', '#fff3b0', this.takenT * 2, 1.2);
      }
    }
    // ---- the longer blurb, under whatever you are looking at
    const up = this.picks[this.sel];
    if (up && this.dealt && !this.taken) {
      const R = UPG_RARITY[up.rarity] || UPG_RARITY.common;
      rect(ctx, 80, 392, W - 160, 62, 'rgba(9,7,18,0.86)');
      frame(ctx, 80, 392, W - 160, 62, withAlpha(R.col, 0.7));
      rect(ctx, 80, 392, 4, 62, R.col);
      drawUpgradeIcon(ctx, 92, 402, 42, up.icon, t);
      drawText(ctx, up.name, 144, 400, R.hi, { scale: 2 });
      drawWrapped(ctx, up.blurb || up.desc, 144, 420, 74, '#b8b2d0', 11, { font: 'small' });
    }
    if (this.taken && this.taken.i === -1) {
      rect(ctx, 80, 392, W - 160, 62, 'rgba(9,7,18,0.86)');
      frame(ctx, 80, 392, W - 160, 62, '#6be585');
      drawText(ctx, 'NOTHING TONIGHT. ' + fmtMoney(this.skipCash) + ' IS DINNER.', W / 2, 414, '#6be585', { align: 'center', scale: 2 });
    }
    // ---- the two buttons, and what they cost
    this.rerollBtn.label = this.rerolls > 0 ? 'REROLL (' + this.rerolls + ')' : 'REROLL ' + fmtMoney(this.rerollCost);
    this.skipBtn.label = 'SKIP FOR ' + fmtMoney(this.skipCash);
    const canRoll = this.rerolls > 0 || r.money >= this.rerollCost;
    this.rerollBtn.draw(ctx, this.taken ? 'disabled' : !canRoll ? 'disabled' : this.hoverBtn === 'r' ? 'hover' : 'normal');
    this.skipBtn.draw(ctx, this.taken ? 'disabled' : this.hoverBtn === 's' ? 'hover' : 'normal');
    drawText(ctx, Game.touch ? 'TAP A CARD TWICE' : 'ARROWS  ENTER   R REROLL   S SKIP', W / 2, 484, '#6a6488', { align: 'center', font: 'small' });
    // ---- what the run is made of so far, a quiet row of pips
    const taken = r.takenUpgrades || [];
    if (taken.length) {
      const n = Math.min(taken.length, 18);
      for (let i = 0; i < n; i++) {
        const id = taken[taken.length - n + i], u2 = SONG_UPGRADE_BY_ID[id];
        const R2 = u2 ? (UPG_RARITY[u2.rarity] || UPG_RARITY.common) : UPG_RARITY.common;
        rect(ctx, 18 + i * 9, 44, 7, 7, R2.col); rect(ctx, 18 + i * 9, 44, 7, 1, R2.hi);
      }
    }
    this.fx.draw(ctx);
    if (this.msgT > 0) {
      ctx.globalAlpha = clamp(this.msgT, 0, 1);
      const w2 = textWidth(this.msg, { scale: 2 }) + 28;
      rect(ctx, W / 2 - w2 / 2, 358, w2, 26, 'rgba(40,12,10,0.92)'); frame(ctx, W / 2 - w2 / 2, 358, w2, 26, '#e0785a');
      drawText(ctx, this.msg, W / 2, 366, '#e0785a', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    vignette(ctx, 0.42);
  }
  isPlaying() { return false; }
}

// ---------- after the whole set ----------
// The numbers, one at a time, with a noise for each. Nobody reads a table of
// results; everybody watches a counter climb.
class SetSummaryScene {
  constructor(opts) {
    const o = opts || {};
    this.opts = o;
    this.run = upgRunOf(o);
    // With no caller to hand it back to, walk out onto whatever street this
    // build actually has. The names are checked one at a time rather than
    // looked up on window, because a top-level class in a plain script is a
    // lexical binding and never turns up as a property of anything.
    this.onDone = o.onDone || function () {
      if (typeof StreetHubScene === 'function') Game.go(() => new StreetHubScene(), 'fade');
      else if (typeof QuietStreetScene === 'function') Game.go(() => new QuietStreetScene(), 'fade');
      else if (typeof CityScene === 'function') Game.go(() => new CityScene(), 'fade');
    };
    this.title = o.title || 'THAT IS THE SET';
    this.perf = o.perf || {};
    this.t = 0; this.fx = new Particles(); this.done = false; this.left = false;
    upgEnsureFame(this.run);
    const p = this.perf;
    // followers are granted here if the caller has not already done it, so a
    // gig scene can stay dumb and this screen still has something to show
    this.fame = o.fameResult || grantFollowers(this.run, p);
    this.fameFrom = Math.max(0, (this.run.followers || 0) - (this.fame.n || 0));
    this.rows = [
      { label: 'THE DOOR', value: Math.round(p.earned || 0), col: '#ffd24a', money: true, icon: 'coin' },
      { label: 'THE HAT', value: Math.round(p.tips || 0), col: '#f2c94c', money: true, icon: 'hat' },
      { label: 'BEST COMBO', value: Math.round(p.maxCombo || 0), col: '#8ad8ff', icon: 'note' },
      { label: 'PERFECTS', value: Math.round(p.perfects || 0), col: '#6be585', icon: 'star' },
      { label: 'NEW FOLLOWERS', value: Math.round(this.fame.n || 0), col: '#ff5a9a', icon: 'phone' },
    ];
    for (const row of this.rows) { row.shown = 0; row.tickT = 0; }
    this.goals = (o.goals || (this.run.goals || []).filter(g => g && g.done)).slice(0, 3);
    this.barK = 0;
    this.contBtn = new Btn(W / 2 - 130, H - 62, 260, 48, 'CONTINUE', () => this.leave(), { scale: 3 });
    this.rowStart = 0.5; this.rowGap = 0.52; this.rowDur = 0.62;
    this.crowd = makeSideCrowd(11, hashStr('summary'), { x0: 0, x1: W, floors: 1, min: 0.8, max: 1.2 });
    if (this.run.save) this.run.save();
  }
  get allDone() { return this.t > this.rowStart + this.rows.length * this.rowGap + this.rowDur + 0.6; }
  skipAhead() { this.t = Math.max(this.t, this.rowStart + this.rows.length * this.rowGap + this.rowDur + 0.7); }
  leave() {
    if (this.left) return;
    if (!this.allDone) { this.skipAhead(); Audio.ui('select'); return; }
    this.left = true; Audio.ui('select');
    if (this.run.save) this.run.save();
    this.onDone();
  }
  update(dt) {
    this.t += dt;
    this.fx.update(dt);
    this.contBtn.update(dt);
    // each row climbs for a beat and clicks while it does
    this.rows.forEach((row, i) => {
      const k = clamp((this.t - this.rowStart - i * this.rowGap) / this.rowDur, 0, 1);
      const want = row.value * easeOut(k);
      if (want > row.shown) {
        row.shown = want;
        row.tickT += dt;
        if (row.tickT > 0.055) { row.tickT = 0; Audio.ui('tally'); }
      }
      if (k >= 1 && !row.popped) {
        row.popped = true;
        if (row.value > 0) { Audio.ui(row.money ? 'coin' : 'stamp'); this.fx.burst(430, 118 + i * 46, 9, { color: [row.col, '#fff8e8'], speed: 70, life: 0.45, kind: 'spark', size: 1 }); }
      }
    });
    // then the fame bar catches up with the followers
    const fk = clamp((this.t - this.rowStart - this.rows.length * this.rowGap) / 0.9, 0, 1);
    this.barK = easeOut(fk);
    if (fk >= 1 && !this.famePopped) {
      this.famePopped = true;
      if (this.fame.tierUp) {
        Audio.ui('fanfare');
        if (Game.shake) Game.shake.hit(2.4, 0.3);
        this.fx.burst(W - 220, 250, 44, { color: ['#ffd24a', '#fff2b0', '#ff5a9a'], speed: 180, life: 1.1, kind: 'star', size: 2, gravity: 90 });
      } else Audio.ui('pop');
    }
  }
  key(code) {
    if (['Enter', 'Space', 'KeyZ', 'Escape'].includes(code)) this.leave();
  }
  keyUp() { }
  click(x, y) { if (this.contBtn.hit(x, y) || this.allDone) this.leave(); else this.skipAhead(); }
  pointerDown(x, y) { this.click(x, y); }
  pointerUp() { }
  hover(x, y) { this.contHover = this.contBtn.hit(x, y); }
  draw(ctx) {
    const t = this.t, r = this.run;
    // ---- the same room, ten minutes later, emptying out
    upgBackroom(ctx, t, { floorY: H - 34, dim: 0.22 });
    ctx.globalAlpha = 0.24;
    for (const c of this.crowd) {
      const x = ((c.x + t * c.sp * 0.4) % (W + 80) + W + 80) % (W + 80) - 40;
      drawShadow(ctx, x, H - 30, 18 * c.sc, 0.18);
      drawBugAt(ctx, c.spec, x, H - 30, { pose: Math.floor(t * 5 + c.o) % 2 ? 'walk1' : 'walk2', scale: c.sc * 0.9, flip: c.sp < 0, bounce: 0.5, phase: c.o });
    }
    ctx.globalAlpha = 1;
    lightPool(ctx, W / 2, 40, 300, '#ffd24a', 0.07);
    uiRibbon(ctx, W / 2, 14, this.title, { scale: 3, color: '#7a1a2a' });
    // ---- left: the numbers
    rect(ctx, 44, 84, 460, 258, 'rgba(9,7,18,0.8)');
    frame(ctx, 44, 84, 460, 258, '#4a4068');
    rect(ctx, 44, 84, 460, 2, '#ffd24a');
    drawText(ctx, 'THE TAKE', 62, 94, '#8a82a8', { font: 'small' });
    this.rows.forEach((row, i) => {
      const y = 116 + i * 46;
      rect(ctx, 58, y - 4, 432, 40, i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.18)');
      drawUpgradeIcon(ctx, 64, y, 30, row.icon, t);
      drawText(ctx, row.label, 104, y + 10, '#cfc9e6', { scale: 2 });
      const shown = row.shown;
      const txt = row.money ? fmtMoney(Math.round(shown)) : fmtNum(Math.round(shown));
      // still climbing: the number glows rather than changing size, because a
      // counter that grows and shrinks is unreadable at exactly the moment
      // somebody is trying to read it
      if (!row.popped && shown > 0) { ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 16); rect(ctx, 330, y - 2, 160, 24, row.col); ctx.globalAlpha = 1; }
      drawText(ctx, txt, 482, y + 2, row.col, { align: 'right', scale: 3, outline: '#12101c' });
    });
    // ---- right: where that leaves you
    const tier = fameTier(r), next = fameNext(r);
    const px2 = 524, pw = W - 524 - 44;
    rect(ctx, px2, 84, pw, 258, 'rgba(9,7,18,0.8)');
    frame(ctx, px2, 84, pw, 258, '#4a4068');
    rect(ctx, px2, 84, pw, 2, tier.col);
    drawText(ctx, 'WHO KNOWS YOU', px2 + 18, 94, '#8a82a8', { font: 'small' });
    drawText(ctx, tier.name, px2 + pw / 2, 112, tier.col, { align: 'center', scale: 4, outline: '#12101c' });
    // the ladder itself, five rungs, the one you are on lit
    for (let i = 0; i < FAME_TIERS.length; i++) {
      const T = FAME_TIERS[i], on = i <= FAME_TIERS.indexOf(tier);
      const bx = px2 + 18 + i * ((pw - 36) / FAME_TIERS.length);
      rect(ctx, bx, 152, (pw - 36) / FAME_TIERS.length - 5, 7, on ? T.col : '#2a2438');
      if (on) rect(ctx, bx, 152, (pw - 36) / FAME_TIERS.length - 5, 1, lighten(T.col, 0.3));
    }
    // the followers counter, and the bar toward the next rung
    const shownF = Math.round(lerp(this.fameFrom, r.followers, this.barK));
    drawText(ctx, fmtNum(shownF), px2 + pw / 2, 172, '#ff5a9a', { align: 'center', scale: 5, outline: '#3a0a20' });
    drawText(ctx, 'FOLLOWERS', px2 + pw / 2, 214, '#8a82a8', { align: 'center', font: 'small' });
    const prog = next ? clamp((shownF - tier.at) / Math.max(1, next.at - tier.at), 0, 1) : 1;
    rect(ctx, px2 + 18, 230, pw - 36, 14, '#12101c');
    rect(ctx, px2 + 19, 231, Math.round((pw - 38) * prog), 12, tier.col);
    rect(ctx, px2 + 19, 231, Math.round((pw - 38) * prog), 1, lighten(tier.col, 0.35));
    frame(ctx, px2 + 18, 230, pw - 36, 14, '#4a4068');
    drawText(ctx, next ? fmtNum(Math.max(0, next.at - shownF)) + ' TO ' + next.name : 'TOP OF THE BILL', px2 + pw / 2, 250, '#cfc9e6', { align: 'center', font: 'small' });
    drawWrapped(ctx, tier.unlock, px2 + 18, 268, 36, '#b8b2d0', 11, { font: 'small' });
    if (this.fame.line && this.barK > 0.4) {
      ctx.globalAlpha = clamp((this.barK - 0.4) * 2, 0, 1);
      drawWrapped(ctx, this.fame.line, px2 + 18, 306, 36, '#ff8ad8', 11, { font: 'small' });
      ctx.globalAlpha = 1;
    }
    if (this.fame.tierUp && this.famePopped) comicBurst(ctx, px2 + pw / 2, 120, 'FAME UP!', '#fff3b0', (t * 0.9) % 1.6, 1.1);
    // ---- the goals you ticked on the way
    rect(ctx, 44, 356, W - 88, 96, 'rgba(9,7,18,0.72)');
    frame(ctx, 44, 356, W - 88, 96, '#3a3450');
    drawText(ctx, 'GOALS', 62, 364, '#8a82a8', { font: 'small' });
    if (!this.goals.length) {
      drawText(ctx, 'NOTHING TICKED OFF. THERE IS ALWAYS TOMORROW.', W / 2, 400, '#6a6488', { align: 'center', scale: 2 });
    } else {
      this.goals.forEach((g, i) => {
        const gy = 382 + i * 22;
        // goalText reaches into the GOALS table by key, so a goal from an
        // older save that this build no longer defines would take the whole
        // screen down. Fall back to the key itself, which is ugly and fine.
        const known = typeof GOALS !== 'undefined' && g && GOALS[g.key];
        const txt = known && typeof goalText === 'function' ? goalText(g) : String((g && g.key) || '').toUpperCase();
        const rw = known && typeof goalRewardText === 'function' ? goalRewardText(g) : '';
        ctx.drawImage(icon('check'), 62, gy + 2, 14, 12);
        drawText(ctx, txt, 84, gy, '#6be585', { scale: 2 });
        if (rw) drawText(ctx, rw, W - 64, gy, '#ffd24a', { align: 'right', scale: 2 });
      });
    }
    this.fx.draw(ctx);
    // ---- and out
    this.contBtn.label = this.allDone ? 'CONTINUE' : 'SKIP';
    this.contBtn.draw(ctx, this.contHover ? 'hover' : 'normal');
    vignette(ctx, 0.4);
  }
  isPlaying() { return false; }
}
