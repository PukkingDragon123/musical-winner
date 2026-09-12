// ---------- Random '?' events ----------
'use strict';
const EVENTS = [
  { id: 'cop', title: 'Officer Buzzkill', icon: 'cop', text: 'A beetle in a blue uniform taps a clipboard. "Permit for this racket?" Your band goes quiet.',
    choices: [
      { label: 'Show your Busker\'s License', req: s => s.hasCharm('busker'), apply: (s, log) => { log('He squints, then nods. "Carry on, maestro." An onlooker tips $6 for the drama.'); s.money += 6; } },
      { label: 'Pay the $12 "fine"', req: s => s.money >= 12, apply: (s, log) => { s.money -= 12; log('The beetle pockets the cash and wanders off.'); } },
      { label: 'Run for it (everyone -20 stamina)', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 20)); log('You scatter into an alley, cases clattering.'); } },
    ] },
  { id: 'stray', title: 'A Stray Musician', icon: 'openmic', text: 'A scruffy bug sits on a crate strumming a busted instrument. "Room for one more? I work for food."',
    choices: [
      { label: 'Recruit them (share an $8 meal)', req: s => s.money >= 8 && s.members.length < 6, apply: (s, log) => { s.money -= 8; const m = s.recruitRandom(['tambourine', 'bass', 'guitar', 'trumpet']); log(m.name + ' the ' + m.spec.species + ' joins with a ' + INSTRUMENTS[m.instrument].name + '!'); } },
      { label: 'Give them $3 and move on', req: s => s.money >= 3, apply: (s, log) => { s.money -= 3; log('They tip their hat. Karma noted.'); s.karma++; } },
      { label: 'Walk past', apply: (s, log) => log('You keep walking. The strumming fades.') },
    ] },
  { id: 'exmate', title: 'A Familiar Face', icon: 'openmic', text: 'Slim the mantis leans on a lamp post, bass case at his feet. "Monarch fired me too. Said my groove was TOO deep. You building something?"',
    once: true, req: s => !s.members.some(m => m.presetKey === 'slim'),
    choices: [
      { label: 'Welcome him to the band', req: s => s.members.length < 6, apply: (s, log) => { const m = s.recruitPreset('slim', 'bass', 4); log(m.name + ' is in. The rhythm section just got serious.'); } },
      { label: 'Not now', apply: (s, log) => log('"Suit yourself." He plays a walking line as you leave. It IS deep.') },
    ] },
  { id: 'tourist', title: 'Lost Tourists', icon: 'event', text: 'A family of moths in matching windbreakers asks how to get to the crooked street. You know exactly where it is.',
    choices: [
      { label: 'Give directions', apply: (s, log) => { const t = 5 + Math.floor(Math.random() * 8); s.money += t; log('They press ' + fmtMoney(t) + ' into your hand. "For the trouble!"'); } },
      { label: 'Serenade them first', apply: (s, log) => { s.buffs.mult = (s.buffs.mult || 0) + 1; s.buffs.crowd = 1.5; log('They love it and promise to bring friends to your next set. (+1 Mult, bigger crowd)'); } },
    ] },
  { id: 'rain', title: 'Karl the Fog Rolls In', icon: 'rain', text: 'The fog thickens into a cold drizzle. Everyone shivers. Instruments hate this.',
    choices: [
      { label: 'Wait it out under an awning', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 15)); log('Everyone loses 15 stamina to the chill.'); } },
      { label: 'Duck into a cafe ($4 per bug)', req: s => s.money >= 4 * s.members.length, apply: (s, log) => { s.money -= 4 * s.members.length; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 15)); log('Warm drinks all round. Stamina +15.'); } },
    ] },
  { id: 'yardsale', title: 'Stoop Sale', icon: 'shop', text: 'A cricket is selling junk off her stoop. Among the lamps and books: a dusty instrument case and a box of odd trinkets.',
    choices: [
      { label: 'Buy the mystery case ($15)', req: s => s.money >= 15, apply: (s, log) => { s.money -= 15; const k = RNG.pick(PLAYABLE.filter(k => k !== 'piano' && k !== 'drums')); s.spareInstruments.push({ kind: k, quality: RNG.int(1, 3) }); log('Inside: a ' + INSTRUMENTS[k].name + '! Stored as a spare instrument.'); } },
      { label: 'Rummage for a charm ($20)', req: s => s.money >= 20, apply: (s, log) => { s.money -= 20; const k = s.randomCharm(); if (k && s.addCharm(k)) log('You fish out a ' + CHARMS[k].name + '!'); else { s.money += 20; log('Nothing fits in your bag. She refunds you.'); } } },
      { label: 'Browse and leave', apply: (s, log) => log('Nice lamps though.') },
    ] },
  { id: 'battle', title: 'Busker Battle', icon: 'elite', text: 'A slick roach with a saxophone claims this corner. "Best set wins the spot. And the pot: $40."',
    choices: [
      { label: 'Accept the challenge ($10 buy-in)', req: s => s.money >= 10, apply: (s, log) => { s.money -= 10; s.pendingGig = { battle: true, note: 'BUSKER BATTLE: beat 80% accuracy to win the $40 pot.' }; log('Game on. Your next set is the battle.'); } },
      { label: 'Decline politely', apply: (s, log) => log('The roach smirks and starts to play. Not bad, honestly.') },
    ] },
  { id: 'foodtruck', title: 'Taco Truck', icon: 'food', text: 'The smell of a taco truck stops the whole band mid-stride. Stomachs rumble in harmony.',
    choices: [
      { label: 'Tacos for everyone ($5 per bug)', req: s => s.money >= 5 * s.members.length, apply: (s, log) => { s.money -= 5 * s.members.length; s.members.forEach(m => { m.hunger = Math.max(0, m.hunger - 1); m.stamina = Math.min(100, m.stamina + 25); }); log('Delicious. Hunger -1, stamina +25 for all.'); } },
      { label: 'Play for the truck owner', apply: (s, log) => { const m = RNG.pick(s.members); m.hunger = Math.max(0, m.hunger - 1); m.stamina = Math.min(100, m.stamina + 30); log('One free taco for ' + m.name + '. The owner hums along.'); } },
    ] },
  { id: 'techie', title: 'Tech Bro Firefly', icon: 'money', text: 'A firefly in a hoodie is filming everything. "Yo, can I put you on my stream? I will tip in crypto... or cash."',
    choices: [
      { label: 'Take the cash ($15)', apply: (s, log) => { s.money += 15; log('Cash. Real, spendable cash.'); } },
      { label: 'Take the "crypto" (gamble)', apply: (s, log) => { if (Math.random() < 0.4) { s.money += 50; log('It mooned! +$50!'); } else log('It went to zero by the time you reached the corner.'); } },
    ] },
  { id: 'oldtimer', title: 'The Old Timer', icon: 'metronome', text: 'An ancient snail with a harmonica watches you tune up. "Kids these days have no sense of TIME. Lemme show you."',
    choices: [
      { label: 'Take the lesson (-15 stamina, +1 skill all)', apply: (s, log) => { s.members.forEach(m => { m.stamina = Math.max(0, m.stamina - 15); m.skill = Math.min(10, m.skill + 1); }); log('Everyone gains +1 skill. Worth it.'); } },
      { label: 'Ask about the harmonica', apply: (s, log) => { if (s.addCharm('metronome')) log('He hands you his Brass Metronome instead. "Keep time, kid."'); else log('"Your bag is full of junk, kid." He is not wrong.'); } },
    ] },
  { id: 'pigeons', title: 'Pigeon Trouble', icon: 'event', text: 'A flock of pigeons descends on your open case. They found your tip money.',
    choices: [
      { label: 'Shoo them (lose $5)', apply: (s, log) => { const l = Math.min(s.money, 5); s.money -= l; log('They fly off with ' + fmtMoney(l) + ' in change.'); } },
      { label: 'Play them a lullaby', apply: (s, log) => { if (Math.random() < 0.6) { s.money += 4; log('They coo and leave behind a shiny quarter. And a dollar. +$4.'); } else { const l = Math.min(s.money, 8); s.money -= l; log('They are unmoved. They take ' + fmtMoney(l) + '.'); } } },
    ] },
  { id: 'monarchPoster', title: 'The Poster', icon: 'elite', text: 'A wall of posters: MONARCH - WORLD TOUR - SOLD OUT. Your face is torn off every single one.',
    choices: [
      { label: 'Tear one down and keep it (+1 Mult next set)', apply: (s, log) => { s.buffs.mult = (s.buffs.mult || 0) + 1; log('Fuel. Pure fuel.'); } },
      { label: 'Sign one: "BUZZ WAS HERE"', apply: (s, log) => { s.karma++; s.buffs.crowd = 1.4; log('A passing bug laughs and takes a photo. Word spreads.'); } },
    ] },
];
