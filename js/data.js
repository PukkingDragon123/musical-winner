// ---------- Game data: instruments, items, venues, events ----------
'use strict';

// Each instrument = a distinct rhythm minigame. keys are KeyboardEvent.code
const INSTRUMENTS = {
  guitar: { name: 'Guitar', game: 'lanes', lanes: 4, keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], keyNames: ['D', 'F', 'J', 'K'],
    desc: 'Guitar Hero style: 4 lanes of falling notes, hold the long ones.', price: 40, color: '#d98c3a', base: 60, tipMult: 1.0 },
  bass: { name: 'Bass', game: 'lanes', lanes: 2, keys: ['KeyF', 'KeyJ'], keyNames: ['F', 'J'],
    desc: 'Two fat strings. Groove notes and long slides. Steady hands.', price: 35, color: '#8a3a5a', base: 40, tipMult: 0.9 },
  drums: { name: 'Taiko Drums', game: 'taiko', keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], keyNames: ['D', 'F', 'J', 'K'],
    desc: 'Beat game: red DON = F/J, blue KA = D/K. Big notes need both hands.', price: 60, color: '#c03a3a', base: 0, tipMult: 1.1 },
  sax: { name: 'Saxophone', game: 'wind', keys: ['Space'], keyNames: ['SPACE'],
    desc: 'Hold SPACE to blow through each phrase. Release on time. Watch your breath.', price: 55, color: '#e0b040', base: 58, tipMult: 1.15 },
  trumpet: { name: 'Trumpet', game: 'valves', keys: ['KeyJ', 'KeyK', 'KeyL'], keyNames: ['J', 'K', 'L'],
    desc: 'Valve combos: press the shown 1-3 valves together in time.', price: 50, color: '#f0c040', base: 62, tipMult: 1.1 },
  violin: { name: 'Violin', game: 'bow', keys: ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'], keyNames: ['UP', 'DOWN'],
    desc: 'Bow direction: UP or DOWN arrows on the beat. Hold the long bows.', price: 65, color: '#b05a2a', base: 67, tipMult: 1.2 },
  piano: { name: 'Keyboard', game: 'lanes', lanes: 6, keys: ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'], keyNames: ['S', 'D', 'F', 'J', 'K', 'L'],
    desc: 'Six lanes, sometimes chords. For virtuosos.', price: 80, color: '#f4f0e8', base: 60, tipMult: 1.3 },
  tambourine: { name: 'Tambourine', game: 'lanes', lanes: 1, keys: ['Space'], keyNames: ['SPACE'],
    desc: 'One lane. Hit the beat, shake the hold notes. Humble but honest.', price: 12, color: '#c08a3a', base: 0, tipMult: 0.7 },
};
const INSTRUMENT_KEYS = Object.keys(INSTRUMENTS);

const FIRST_NAMES = ['Benny', 'Rosa', 'Ziggy', 'Mabel', 'Otis', 'Pip', 'Dolores', 'Gus', 'Nina', 'Ferdie', 'Coco', 'Hank', 'Lulu', 'Miles', 'Etta', 'Django', 'Bix', 'Juno', 'Sal', 'Wren', 'Tito', 'Marge', 'Boris', 'Fay', 'Louie', 'Pearl', 'Chester', 'Ivy', 'Rufus', 'Dot'];

// Items: kind 'relic' (passive), 'use' (consumable, used before/at a gig or in camp)
const ITEMS = {
  coffee:    { name: 'Espresso', kind: 'use', icon: 'coffee', price: 8, desc: 'Next gig: timing windows +30%. Jittery but precise.' },
  bar:       { name: 'Energy Bar', kind: 'use', icon: 'bar', price: 6, desc: 'Restore 40 stamina to the most tired member.' },
  bread:     { name: 'Bread Crumbs', kind: 'use', icon: 'bread', price: 5, desc: 'A snack. Removes 1 hunger from one member.' },
  flyer:     { name: 'Gig Flyers', kind: 'use', icon: 'flyer', price: 10, desc: 'Next gig: twice as many passers-by show up.' },
  jar:       { name: 'Shiny Tip Jar', kind: 'relic', icon: 'jar', price: 30, desc: 'Tips +20%. It catches the light just right.' },
  amp:       { name: 'Portable Amp', kind: 'relic', icon: 'amp', price: 45, desc: 'Passers-by notice you from further away. Crowd +35%.' },
  pick:      { name: 'Lucky Pick', kind: 'relic', icon: 'pick', price: 25, desc: 'PERFECT window +25% on string instruments.' },
  metronome: { name: 'Brass Metronome', kind: 'relic', icon: 'metronome', price: 20, desc: 'Shows a beat pulse during gigs. Combo breaks cost half hype.' },
  permit:    { name: 'Busker Permit', kind: 'relic', icon: 'permit', price: 35, desc: 'Police never shut you down. Official!' },
  jacket:    { name: 'Fog Jacket', kind: 'relic', icon: 'jacket', price: 25, desc: 'Weather never drains your stamina.' },
  kazoo:     { name: 'Golden Kazoo', kind: 'relic', icon: 'kazoo', price: 50, desc: 'Combo milestone cheers pay double.' },
  cred:      { name: 'Street Cred', kind: 'relic', icon: 'cred', price: 40, desc: 'Watchers stay 50% longer once hooked.' },
  case:      { name: 'Sturdy Case', kind: 'relic', icon: 'case', price: 30, desc: 'Every instrument counts as +1 quality star.' },
  shades:    { name: 'Cool Shades', kind: 'relic', icon: 'shades', price: 28, desc: 'Misses drain 40% less hype. Stay cool.' },
  earplugs:  { name: 'Earplugs', kind: 'relic', icon: 'earplugs', price: 22, desc: 'Great counts as Perfect for hype purposes.' },
  strings:   { name: 'Spare Strings', kind: 'relic', icon: 'strings', price: 18, desc: 'Gigs cost 30% less stamina.' },
  pass:      { name: 'Muni Pass', kind: 'relic', icon: 'pass', price: 26, desc: 'Meals cost $2 less per member. Save on transit, spend on food.' },
  medal:     { name: 'Talent Show Medal', kind: 'relic', icon: 'medal', price: 60, desc: 'Band members gain skill twice as fast.' },
};
const ITEM_KEYS = Object.keys(ITEMS);
const RELIC_KEYS = ITEM_KEYS.filter(k => ITEMS[k].kind === 'relic');
const USE_KEYS = ITEM_KEYS.filter(k => ITEMS[k].kind === 'use');

// Venues (backgrounds + crowd behavior). wealth = tip size, traffic = passers-by per minute
const VENUES = {
  corner:   { name: 'Street Corner', bg: 'street', wealth: 1.0, traffic: 1.0, bpm: [92, 108] },
  subway:   { name: 'BART Station', bg: 'subway', wealth: 0.85, traffic: 1.6, bpm: [100, 120] },
  park:     { name: 'Dolores Park', bg: 'park', wealth: 1.0, traffic: 0.9, bpm: [84, 100] },
  cablecar: { name: 'Cable Car Stop', bg: 'street', wealth: 1.3, traffic: 1.1, bpm: [96, 116], hills: true },
  chinatown:{ name: 'Chinatown Alley', bg: 'chinatown', wealth: 1.1, traffic: 1.3, bpm: [104, 124] },
  pier:     { name: 'Pier 39', bg: 'pier', wealth: 1.5, traffic: 1.2, bpm: [100, 120] },
  ferry:    { name: 'Ferry Building', bg: 'pier', wealth: 1.6, traffic: 1.0, bpm: [96, 118] },
  fidi:     { name: 'Financial District', bg: 'street', wealth: 1.9, traffic: 0.8, bpm: [110, 130], tall: true },
  haight:   { name: 'Haight Street', bg: 'street', wealth: 0.9, traffic: 1.3, bpm: [88, 108], colorful: true },
  ggpark:   { name: 'Golden Gate Park', bg: 'park', wealth: 1.3, traffic: 1.0, bpm: [92, 112] },
  bridge:   { name: 'Golden Gate Bridge', bg: 'bridge', wealth: 2.2, traffic: 1.0, bpm: [112, 132] },
};
// Which venues appear on which day (bottom of map = day 1)
const DAY_VENUES = [
  ['corner', 'park', 'subway'],
  ['subway', 'corner', 'haight', 'cablecar'],
  ['chinatown', 'cablecar', 'fidi', 'subway'],
  ['pier', 'ferry', 'fidi', 'chinatown'],
  ['ggpark', 'pier', 'ferry', 'cablecar'],
];
const DAY_NAMES = ['The Mission', 'Downtown', 'Chinatown & Nob Hill', 'The Waterfront', 'Golden Gate'];

// Random text events ('?' nodes). Each choice: {label, req(state)?, apply(state, log)}
const EVENTS = [
  {
    id: 'cop', title: 'Officer Buzzkill', icon: 'cop',
    text: 'A beetle in a blue uniform taps a clipboard. "Permit for this racket?" Your band goes quiet.',
    choices: [
      { label: 'Show your Busker Permit', req: s => s.hasRelic('permit'), apply: (s, log) => { log('He squints, then nods. "Carry on, maestro."'); s.money += 6; log('An onlooker tips $6 for the drama.'); } },
      { label: 'Pay the $12 "fine"', req: s => s.money >= 12, apply: (s, log) => { s.money -= 12; log('The beetle pockets the cash and wanders off.'); } },
      { label: 'Run for it (all members -20 stamina)', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 20)); log('You scatter into an alley, cases clattering.'); } },
    ],
  },
  {
    id: 'stray', title: 'A Stray Musician', icon: 'openmic',
    text: 'A scruffy bug sits on a crate strumming a busted instrument. "Room for one more? I work for food."',
    choices: [
      { label: 'Recruit them (share a $8 meal)', req: s => s.money >= 8 && s.members.length < 6, apply: (s, log) => { s.money -= 8; const m = s.recruitRandom(['tambourine', 'bass', 'guitar', 'trumpet']); log(m.name + ' the ' + SPECIES[m.species].name + ' joins with a ' + INSTRUMENTS[m.instrument].name + '!'); } },
      { label: 'Give them $3 and move on', req: s => s.money >= 3, apply: (s, log) => { s.money -= 3; log('They tip their hat. Karma noted.'); s.karma = (s.karma || 0) + 1; } },
      { label: 'Walk past', apply: (s, log) => log('You keep walking. The strumming fades.') },
    ],
  },
  {
    id: 'tourist', title: 'Lost Tourists', icon: 'event',
    text: 'A family of moths in matching windbreakers asks how to get to the crooked street. You know exactly where it is.',
    choices: [
      { label: 'Give directions', apply: (s, log) => { const t = 5 + Math.floor(Math.random() * 8); s.money += t; log('They press ' + fmtMoney(t) + ' into your hand. "For the trouble!"'); } },
      { label: 'Serenade them first', apply: (s, log) => { s.pendingGig = { bonus: 1.3, note: 'The tourists follow you to your next gig.' }; log('They love it and promise to come to your next show.'); } },
    ],
  },
  {
    id: 'rain', title: 'Karl the Fog Rolls In', icon: 'rain',
    text: 'The fog thickens into a cold drizzle. Everyone shivers. Instruments hate this.',
    choices: [
      { label: 'Wait it out under an awning', apply: (s, log) => { if (s.hasRelic('jacket')) log('Your Fog Jacket keeps everyone warm. No harm done.'); else { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 15)); log('Everyone loses 15 stamina to the chill.'); } } },
      { label: 'Duck into a cafe ($4/member)', req: s => s.money >= 4 * s.members.length, apply: (s, log) => { s.money -= 4 * s.members.length; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 15)); log('Warm drinks all round. Stamina +15.'); } },
    ],
  },
  {
    id: 'yardsale', title: 'Stoop Sale', icon: 'shop',
    text: 'A cricket is selling junk off her stoop. Among the lamps and books: a dusty instrument case.',
    choices: [
      { label: 'Buy the mystery case ($15)', req: s => s.money >= 15, apply: (s, log) => { s.money -= 15; const k = RNG.pick(INSTRUMENT_KEYS.filter(k => k !== 'piano' && k !== 'drums')); s.spareInstruments.push({ kind: k, quality: RNG.int(1, 3) }); log('Inside: a ' + INSTRUMENTS[k].name + '! Stored as a spare instrument.'); } },
      { label: 'Haggle for a relic ($20)', req: s => s.money >= 20, apply: (s, log) => { s.money -= 20; const k = s.randomNewRelic(); if (k) { s.addRelic(k); log('You get a ' + ITEMS[k].name + '.'); } else { s.money += 20; log('Nothing you don\'t already own. She refunds you.'); } } },
      { label: 'Browse and leave', apply: (s, log) => log('Nice lamps though.') },
    ],
  },
  {
    id: 'battle', title: 'Busker Battle', icon: 'elite',
    text: 'A slick mantis with a saxophone claims this corner. "Best set wins the spot. And the pot: $30."',
    choices: [
      { label: 'Accept the challenge ($10 buy-in)', req: s => s.money >= 10, apply: (s, log) => { s.money -= 10; s.pendingGig = { battle: true, note: 'Beat 80% accuracy to win the $30 pot.' }; log('Game on. Your next gig is the battle.'); } },
      { label: 'Decline politely', apply: (s, log) => log('The mantis smirks and starts to play. Not bad, honestly.') },
    ],
  },
  {
    id: 'foodtruck', title: 'Taco Truck', icon: 'food',
    text: 'The smell of a taco truck stops the whole band mid-stride. Stomachs rumble in harmony.',
    choices: [
      { label: 'Tacos for everyone ($5/member)', req: s => s.money >= 5 * s.members.length, apply: (s, log) => { s.money -= 5 * s.members.length; s.members.forEach(m => { m.hunger = Math.max(0, m.hunger - 1); m.stamina = Math.min(100, m.stamina + 25); }); log('Delicious. Hunger -1, stamina +25 for all.'); } },
      { label: 'Play for the truck owner', apply: (s, log) => { const m = RNG.pick(s.members); m.hunger = Math.max(0, m.hunger - 1); m.stamina = Math.min(100, m.stamina + 30); log('One free taco for ' + m.name + '. The owner hums along.'); } },
      { label: 'Resist temptation', apply: (s, log) => log('You march on, hungrier and wiser.') },
    ],
  },
  {
    id: 'techie', title: 'Tech Bro Firefly', icon: 'money',
    text: 'A firefly in a hoodie is filming everything. "Yo, can I put you on my stream? I\'ll tip in crypto... or cash."',
    choices: [
      { label: 'Take the cash ($15)', apply: (s, log) => { s.money += 15; log('Cash. Real, spendable cash.'); } },
      { label: 'Take the "crypto" (gamble)', apply: (s, log) => { if (Math.random() < 0.4) { s.money += 45; log('It mooned! +$45!'); } else log('It went to zero by the time you reached the corner.'); } },
    ],
  },
  {
    id: 'oldtimer', title: 'The Old Timer', icon: 'metronome',
    text: 'An ancient snail with a harmonica watches you tune up. "Kids these days have no sense of TIME. Lemme show you."',
    choices: [
      { label: 'Take the lesson (-15 stamina, +skill)', apply: (s, log) => { s.members.forEach(m => { m.stamina = Math.max(0, m.stamina - 15); m.skill = Math.min(10, m.skill + 1); }); log('Everyone gains +1 skill. Worth it.'); } },
      { label: 'Ask for the harmonica', apply: (s, log) => { if (Math.random() < 0.5) { s.addRelic('metronome'); log('He gives you his Brass Metronome instead. "Keep time, kid."'); } else log('"Get your own." Fair.'); } },
    ],
  },
  {
    id: 'pigeons', title: 'Pigeon Trouble', icon: 'event',
    text: 'A flock of pigeons descends on your open instrument case. They found your tip money.',
    choices: [
      { label: 'Shoo them (lose $5)', apply: (s, log) => { const l = Math.min(s.money, 5); s.money -= l; log('They fly off with ' + fmtMoney(l) + ' in change.'); } },
      { label: 'Play them a lullaby', apply: (s, log) => { if (Math.random() < 0.6) { s.money += 4; log('They coo and leave behind a shiny... quarter. And a dollar. +$4.'); } else { const l = Math.min(s.money, 8); s.money -= l; log('They are unmoved. They take ' + fmtMoney(l) + '.'); } } },
    ],
  },
];
