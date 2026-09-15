// ---------- The question marks ----------
// A node marked ? tells you nothing until you are standing in front of it.
// Every one of them is a scene with somebody in it who wants something, and
// every one can go badly. Some are a straight choice; some hand you something
// to actually play, and then the outcome is yours to earn.
'use strict';
const MYSTERIES = [
  {
    id: 'dango', scene: 'dango', title: 'THE DANGO CART',
    line: 'An old moth leans over a yatai cart and holds out three dumplings on a stick. Steam off the grill, a red lantern swinging. "Dango? Two dollars."',
    choices: [
      { label: 'Buy a stick ($2)', req: s => s.money >= 2,
        apply: (s, log) => { s.money -= 2; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 14)); log('Sweet, sticky, still warm. Everyone perks up. (+14 stamina each)'); } },
      { label: 'Buy the whole tray ($9)', req: s => s.money >= 9,
        apply: (s, log) => { s.money -= 9; s.members.forEach(m => m.stamina = 100); s.buffs.crowd = (s.buffs.crowd || 1) * 1.3; log('He wraps the lot. The band eats like kings and plays like it. (Full stamina, bigger crowd next set)'); } },
      { label: 'Haggle him down', game: 'timing', gameLabel: 'STOP ON THE GREEN',
        good: (s, log) => { s.money += 0; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 14)); log('"...fine. On the house, for the music." Free dango. (+14 stamina each)'); },
        bad: (s, log) => { s.karma--; log('He looks at you for a long moment, then packs the tray away. Nobody eats.'); } },
      { label: 'Walk on', apply: (s, log) => log('You keep walking. The smell follows you for two streets.') },
    ],
  },
  {
    id: 'cat', scene: 'cat', title: 'OCCUPIED',
    line: 'A enormous tortoiseshell cat has fallen asleep on your amp. It is not a small cat. Its tail moves once, slowly, which is somehow a threat.',
    choices: [
      { label: 'Play around it', game: 'copy', gameLabel: 'KEEP IT QUIET - COPY THE PHRASE',
        good: (s, log) => { s.buffs.mult = (s.buffs.mult || 0) + 2; log('It sleeps through the whole set. A crowd gathers to watch the cat. (+2 Mult)'); },
        bad: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 12)); log('You clip a cymbal. It leaves, taking a strip of your forearm. (-12 stamina each)'); } },
      { label: 'Offer it the good snacks ($3)', req: s => s.money >= 3,
        apply: (s, log) => { s.money -= 3; s.karma++; s.buffs.crowd = (s.buffs.crowd || 1) * 1.4; log('It eats, stays, and doubles your audience by existing. (Bigger crowd next set)'); } },
      { label: 'Move the amp', apply: (s, log) => { s.members[0].stamina = Math.max(0, s.members[0].stamina - 15); log('You lift amp and cat together. It does not wake. Your back will remember. (-15 stamina)'); } },
    ],
  },
  {
    id: 'salaryman', scene: 'salaryman', title: 'ONE MORE SONG',
    line: 'A salaryman beetle, tie at half mast, has been swaying to you for ten minutes. He produces a fistful of coins and requests something. He is not specific.',
    choices: [
      { label: 'Play him something', game: 'timing', gameLabel: 'LAND IT ON THE BEAT',
        good: (s, log) => { const t = 14 + Math.floor(Math.random() * 12); s.money += t; log('He weeps. He tips ' + fmtMoney(t) + '. He tells you about his division.'); },
        bad: (s, log) => { s.karma--; log('Wrong song. He explains, at length, what you got wrong. You lose ten minutes.'); } },
      { label: 'Point him at the last train', apply: (s, log) => { s.karma++; s.money += 4; log('He bows twice, presses $4 into the case, and runs. He makes it.') } },
      { label: 'Take the coins and stop playing', apply: (s, log) => { s.money += 9; s.karma--; log('$9 richer. The rest of the crowd notices and drifts off.'); } },
    ],
  },
  {
    id: 'busker', scene: 'busker', title: 'THE OTHER END OF THE UNDERPASS',
    line: 'Another busker has set up forty metres away, in the same tunnel, in the same key. He is very good. He knows it. He has not looked at you once.',
    choices: [
      { label: 'Cut him', game: 'copy', gameLabel: 'PLAY IT BACK BETTER',
        good: (s, log) => { s.money += 18; s.buffs.mult = (s.buffs.mult || 0) + 1; log('You answer his phrase and add to it. The tunnel picks you. He packs up. (+$18, +1 Mult)'); },
        bad: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 10)); log('You fluff it, in a tunnel, with the acoustics of a cathedral. Everybody heard. (-10 stamina each)'); } },
      { label: 'Play together instead', apply: (s, log) => { s.karma += 2; s.money += 7; const t = 7; s.buffs.crowd = (s.buffs.crowd || 1) * 1.25; log('Two acts, one tune. The tunnel fills. You split ' + fmtMoney(t * 2) + ' and he gives you his number.'); } },
      { label: 'Move to another exit', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 8)); log('You carry everything up two flights of stairs to a worse spot. (-8 stamina each)'); } },
    ],
  },
  {
    id: 'gacha', scene: 'gacha', title: 'A WALL OF CAPSULES',
    line: 'Sixteen gachapon machines under a flickering strip light. One of them is full of tiny brass instruments. You have a pocket of coins and no self-control.',
    choices: [
      { label: 'One go ($3)', req: s => s.money >= 3,
        apply: (s, log) => { s.money -= 3; if (Math.random() < 0.45) { const k = s.randomCharm(); if (k && s.addCharm(k)) { Audio.ui('fanfare'); log('The capsule cracks open on a ' + CHARMS[k].name + '. Unbelievable.'); return; } } log('A tiny plastic trombone. It does not play. You keep it anyway.'); } },
      { label: 'Empty your pockets ($10)', req: s => s.money >= 10,
        apply: (s, log) => { s.money -= 10; let got = 0; for (let i = 0; i < 4; i++) { if (Math.random() < 0.4) { const k = s.randomCharm(); if (k && s.addCharm(k)) got++; } } if (got) { Audio.ui('fanfare'); log('Four turns, ' + got + ' of them worth keeping.'); } else log('Four turns. Four tiny plastic trombones. A matched set.'); } },
      { label: 'Walk away', apply: (s, log) => log('You walk away. This is the correct decision and it feels terrible.') },
    ],
  },
  {
    id: 'monk', scene: 'monk', title: 'THE ALMS BOWL',
    line: 'A monk stands perfectly still at the foot of the temple steps with a bowl and a small bell. He has been there since before you arrived and will be there after.',
    choices: [
      { label: 'Give what you can ($5)', req: s => s.money >= 5,
        apply: (s, log) => { s.money -= 5; s.karma += 2; s.buffs.mult = (s.buffs.mult || 0) + 1; log('The bell sounds once. Whatever that does, it does it. (+1 Mult)'); } },
      { label: 'Play for him instead', game: 'copy', gameLabel: 'MATCH THE BELL',
        good: (s, log) => { s.karma += 3; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 20)); log('He rings, you answer, for a long time. You leave lighter. (+20 stamina each)'); },
        bad: (s, log) => { log('You lose the thread. He waits. You stop. He does not mind, which is worse.'); } },
      { label: 'Bow and pass', apply: (s, log) => { s.karma++; log('He bows back. That is the whole of it.'); } },
    ],
  },
  {
    id: 'scout', scene: 'scout', title: 'A CARD WITH A LOGO ON IT',
    line: 'A wasp in a very good suit has been filming you on a phone. She hands you a card. "Six months. We handle everything. You would not have to carry anything ever again."',
    choices: [
      { label: 'Sign it', apply: (s, log) => { s.money += 60; s.buffs.mult = (s.buffs.mult || 0) - 1; s.karma -= 2; log('$60 today. She takes the setlist, the name, and the right to both. (-1 Mult)'); } },
      { label: 'Ask what the catch is', game: 'timing', gameLabel: 'READ THE SMALL PRINT - STOP ON THE CLAUSE',
        good: (s, log) => { s.money += 30; log('You find the clause and strike it. She signs anyway, surprised. (+$30, nothing lost)'); },
        bad: (s, log) => { s.karma--; log('You miss it. She smiles, takes the card back, and gives it to somebody else.'); } },
      { label: 'Tear it up in front of her', apply: (s, log) => { s.karma += 2; s.buffs.mult = (s.buffs.mult || 0) + 1; log('She watches the pieces fall. "Good." She means it. (+1 Mult)'); } },
    ],
  },
  {
    id: 'rain', scene: 'rain', title: 'IT COMES DOWN ALL AT ONCE',
    line: 'The sky goes green and then the rain arrives sideways. Thirty umbrellas open at once like a magic trick. Your gear is not waterproof and neither are you.',
    choices: [
      { label: 'Pack up fast', game: 'timing', gameLabel: 'GET THE LID ON IN TIME',
        good: (s, log) => { log('Everything in the case, dry, in nine seconds flat. The band is impressed with itself.'); },
        bad: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 18)); log('The snare takes half a litre. Everyone is soaked through. (-18 stamina each)'); } },
      { label: 'Keep playing in it', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 14)); s.money += 20; s.buffs.mult = (s.buffs.mult || 0) + 1; log('Nobody who stays ever forgets it. They empty their wallets. (+$20, +1 Mult, -14 stamina each)'); } },
      { label: 'Shelter under the arcade', req: s => s.money >= 4,
        apply: (s, log) => { s.money -= 4; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 8)); log('Hot coffee from a machine, four dollars, and you watch it pass. (+8 stamina each)'); } },
    ],
  },
  {
    id: 'crane', scene: 'crane', title: 'THE CLAW',
    line: 'A crane machine, lit like an altar, with a single enormous plush frog wedged against the glass. The claw has the grip strength of a damp tissue. You know this.',
    choices: [
      { label: 'Have a go ($2)', req: s => s.money >= 2, game: 'timing', gameLabel: 'LINE THE CLAW UP',
        good: (s, log) => { s.money -= 2; s.buffs.crowd = (s.buffs.crowd || 1) * 1.5; log('It comes out. You carry a frog the size of a bass drum to your next gig. People follow it. (Much bigger crowd)'); },
        bad: (s, log) => { s.money -= 2; log('The claw closes, lifts, opens. It was always going to. -$2.'); } },
      { label: 'Feed it everything ($8)', req: s => s.money >= 8,
        apply: (s, log) => { s.money -= 8; if (Math.random() < 0.5) { s.buffs.crowd = (s.buffs.crowd || 1) * 1.5; Audio.ui('fanfare'); log('Fourth go. The frog is yours. It cost more than the amp. (Much bigger crowd)'); } else log('Eight dollars. The frog has not moved a millimetre.'); } },
      { label: 'Leave the frog', apply: (s, log) => log('You leave. The frog watches you go, which it would, being pressed against the glass.') },
    ],
  },
  {
    id: 'train', scene: 'train', title: 'THE LAST TRAIN',
    line: 'The board says 00:42 and the platform is emptying. There is exactly one more service. Your cases are heavy and the stairs are long.',
    choices: [
      { label: 'Run for it', game: 'timing', gameLabel: 'THROUGH THE DOORS',
        good: (s, log) => { s.tickets = (s.tickets || 0) + 1; log('You make it with the doors on your shoulders. Somebody cheers. (+1 train ride)'); },
        bad: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 20)); log('The doors close on your face. It is an hour to walk. (-20 stamina each)'); } },
      { label: 'Busk the platform instead', apply: (s, log) => { const t = 10 + Math.floor(Math.random() * 10); s.money += t; s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 12)); log('The night crowd is drunk and generous. ' + fmtMoney(t) + ', and a long walk home. (-12 stamina each)'); } },
      { label: 'Sleep in the station', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 25)); s.karma--; log('Nobody moves you on. You wake stiff but rested. (+25 stamina each)'); } },
    ],
  },
  {
    id: 'vending', scene: 'vending', title: 'THE MACHINE THAT TAKES',
    line: 'A vending machine hums in an otherwise empty side street. You put in two dollars. Nothing comes out. The machine hums on, unmoved.',
    choices: [
      { label: 'Hit it in the right place', game: 'timing', gameLabel: 'ON THE BEAT, ON THE SIDE',
        good: (s, log) => { s.money += 6; s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 10)); log('Four cans fall out at once. Percussion solves another problem. (+$6 worth, +10 stamina each)'); },
        bad: (s, log) => { s.money = Math.max(0, s.money - 2); s.members[0].stamina = Math.max(0, s.members[0].stamina - 10); log('You hurt your hand and the machine keeps the two dollars.'); } },
      { label: 'Put in two more ($2)', req: s => s.money >= 2,
        apply: (s, log) => { s.money -= 2; if (Math.random() < 0.6) { s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 12)); log('Two cans. It was only ever going to give you what you paid for. (+12 stamina each)'); } else log('Nothing. Again. The machine hums.'); } },
      { label: 'Let it go', apply: (s, log) => log('You walk off. Two dollars is two dollars, but it is also only two dollars.') },
    ],
  },
  {
    id: 'koban', scene: 'koban', title: 'THE POLICE BOX',
    line: 'The officer at the koban has been watching the amp. He steps out with his hands behind his back, which is never the start of good news.',
    choices: [
      { label: 'Turn it down and apologise', apply: (s, log) => { s.karma++; s.buffs.crowd = (s.buffs.crowd || 1) * 0.85; log('He nods and goes back in. Quieter, smaller crowd, no trouble.'); } },
      { label: 'Ask him what he plays', game: 'copy', gameLabel: 'HE HUMS IT - PLAY IT BACK',
        good: (s, log) => { s.karma += 2; s.money += 12; s.buffs.crowd = (s.buffs.crowd || 1) * 1.2; log('Trumpet, police band, 1988. He requests one and tips $12. Nobody moves you on again tonight.'); },
        bad: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 10)); log('You mangle it. He loses interest and moves you on anyway. (-10 stamina each)'); } },
      { label: 'Pack up and go', apply: (s, log) => { s.members.forEach(m => m.stamina = Math.max(0, m.stamina - 6)); log('No argument. You find somewhere else. (-6 stamina each)'); } },
    ],
  },
];
