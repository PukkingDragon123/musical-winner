// ---------- The rooms ----------
// Four places laid out square by square: what is in them, who is in them, and
// what happens when you stand in front of a thing and press the button.
'use strict';
// helper: a run of the same prop along a line
function propRow(kind, tx, ty, tw, th, n, step, extra) {
  const out = []; for (let i = 0; i < n; i++) out.push(Object.assign({ kind, tx: tx + i * step, ty, tw, th }, extra || {}));
  return out;
}
const ROOMS = {
  // ======================= NARITA, ARRIVALS =======================
  airport: {
    name: 'NARITA - ARRIVALS', sub: 'FOLLOW THE GREEN SIGNS', tint: '#1f5f4a',
    w: 46, h: 20, zoom: 1.9,
    floor: '#d8d2c4', floorAlt: '#cfc8b8', wall: '#6a7280', wallTop: '#98a2b0',
    start: { tx: 4, ty: 10 },
    enter: 'THE DOORS HISS SHUT BEHIND YOU.',
    props: [].concat(
      // the belt you came off, still going round
      [{ kind: 'counter', tx: 6, ty: 3, tw: 14, th: 2, label: 'BAGGAGE BELT 4' }],
      propRow('luggage', 7, 2, 3, 1, 4, 4),
      propRow('trolley', 6, 6, 2, 2, 3, 5),
      // the waiting area
      propRow('seats', 4, 12, 4, 1, 3, 5),
      propRow('seats', 4, 15, 4, 1, 3, 5),
      [{ kind: 'plant', tx: 3, ty: 13, tw: 2, th: 2 }, { kind: 'plant', tx: 20, ty: 13, tw: 2, th: 2 }],
      // the row of shops down the middle
      [{ kind: 'shelf', tx: 23, ty: 3, tw: 6, th: 3, label: 'CONVENIENCE STORE' },
       { kind: 'shelf', tx: 23, ty: 7, tw: 6, th: 3, label: 'SNACKS AND CHARMS' },
       { kind: 'till', tx: 30, ty: 5, tw: 3, th: 2, label: 'TILL' },
       { kind: 'glasscase', tx: 23, ty: 12, tw: 6, th: 3, label: 'CAPSULE TOYS' },
       { kind: 'vending', tx: 31, ty: 12, tw: 2, th: 3, label: 'VENDING MACHINE' },
       { kind: 'vending', tx: 33, ty: 12, tw: 2, th: 3, label: 'HOT DRINKS' }],
      // information, and the boards nobody can read fast enough
      [{ kind: 'counter', tx: 34, ty: 3, tw: 8, th: 2, label: 'INFORMATION' },
       { kind: 'board', tx: 35, ty: 6, tw: 7, th: 4, overhead: true, walk: true },
       { kind: 'gate', tx: 36, ty: 12, tw: 4, th: 3, text: 'GATE 41' }],
      // signage overhead, all the way down
      [{ kind: 'sign', tx: 8, ty: 9, tw: 4, th: 1, text: 'EXIT', col: '#1f6f4a', arrow: 1, walk: true, overhead: true },
       { kind: 'sign', tx: 20, ty: 9, tw: 5, th: 1, text: 'TRAINS', col: '#2f5a9a', arrow: 1, walk: true, overhead: true },
       { kind: 'sign', tx: 32, ty: 9, tw: 4, th: 1, text: 'EXIT', col: '#1f6f4a', arrow: 1, walk: true, overhead: true }],
      propRow('bin', 12, 17, 1, 1, 4, 8),
      propRow('pole', 15, 2, 1, 16, 2, 14, { walk: false }),
      // the way out
      [{ kind: 'sign', tx: 42, ty: 9, tw: 3, th: 2, text: 'TOKYO', col: '#1f6f4a', label: 'WALK OUT INTO TOKYO', act: 'exit' }]
    ),
    npcs: [
      { name: 'A TIRED FAMILY', carry: 'bag', tag: 'Four of them, three suitcases, one of them asleep standing up.',
        route: [{ tx: 8, ty: 6, wait: 2 }, { tx: 18, ty: 8, wait: 1 }, { tx: 30, ty: 10, wait: 3 }, { tx: 40, ty: 10, wait: 1 }, { tx: 20, ty: 5, wait: 2 }] },
      { name: 'GROUND STAFF', carry: 'phone', tag: '"Trains are through there. Mind the step. Welcome back."',
        route: [{ tx: 34, ty: 6, wait: 4, act: 'stand' }, { tx: 28, ty: 8, wait: 2 }, { tx: 34, ty: 6, wait: 5 }] },
      { name: 'A BUSINESS BUG', carry: 'case', tag: 'Asleep on his feet. Been in the air eleven hours.',
        route: [{ tx: 6, ty: 14, wait: 6, act: 'sit' }, { tx: 20, ty: 14, wait: 2 }, { tx: 6, ty: 14, wait: 8 }] },
      { name: 'A STUDENT', carry: 'bag', tag: '"You in a band? You look like you are in a band."',
        route: [{ tx: 24, ty: 16, wait: 2 }, { tx: 36, ty: 16, wait: 2 }, { tx: 30, ty: 11, wait: 3 }] },
      { name: 'CLEANER', tag: 'Going over the same six feet of floor for the third time.',
        route: [{ tx: 14, ty: 18, wait: 1 }, { tx: 26, ty: 18, wait: 1 }, { tx: 14, ty: 18, wait: 1 }] },
      { name: 'A COUPLE', carry: 'umbrella', tag: 'Reading the sign, then the map, then the sign again.',
        route: [{ tx: 21, ty: 4, wait: 3 }, { tx: 21, ty: 12, wait: 3 }, { tx: 33, ty: 8, wait: 2 }] },
    ],
    use(S, p) {
      if (p.kind === 'vending') { const r = Game.run; if (r.money >= 2) { r.money -= 2; r.stamina = Math.min(r.staminaMax, r.stamina + 10); S.flash('CANNED COFFEE. -$2, +10 STAMINA.'); Audio.ui('eat'); } else S.flash('THE MACHINE WANTS TWO DOLLARS.'); return; }
      if (p.kind === 'glasscase') { S.flash('CAPSULE TOYS. YOU HAVE NO COINS SMALL ENOUGH.'); return; }
      if (p.kind === 'board') { S.flash('EVERY BOARD SAYS THE SAME THING: YOU ARE HERE.'); return; }
      S.flash(p.label || 'NOTHING TO DO HERE.');
    },
  },
  // ======================= THE SECOND-HAND MUSIC SHOP =======================
  hardoff: {
    name: 'OFF-BEAT USED GEAR', sub: 'EVERYTHING HERE BELONGED TO SOMEBODY', tint: '#1f4a7a',
    w: 26, h: 16, zoom: 2.4,
    floor: '#c8c2b0', floorAlt: '#bfb8a4', wall: '#3f4a5c', wallTop: '#5f6a7c',
    start: { tx: 13, ty: 14 },
    enter: 'IRASSHAIMASE. NOBODY LOOKS UP.',
    props: [].concat(
      [{ kind: 'wallguitars', tx: 2, ty: 1, tw: 10, th: 3, label: 'GUITARS ON THE WALL' },
       { kind: 'wallguitars', tx: 14, ty: 1, tw: 9, th: 3, label: 'MORE GUITARS' },
       { kind: 'amps', tx: 2, ty: 5, tw: 7, th: 2, label: 'AMPS, ALL WORKING' },
       { kind: 'amps', tx: 17, ty: 5, tw: 6, th: 2, label: 'AMPS, MOSTLY WORKING' },
       { kind: 'pedals', tx: 11, ty: 5, tw: 4, th: 2, label: 'PEDAL WALL' },
       { kind: 'shelf', tx: 2, ty: 9, tw: 5, th: 3 },
       { kind: 'shelf', tx: 9, ty: 9, tw: 5, th: 3 },
       { kind: 'shelf', tx: 16, ty: 9, tw: 5, th: 3 },
       { kind: 'glasscase', tx: 2, ty: 13, tw: 6, th: 2 },
       { kind: 'crate', tx: 10, ty: 13, tw: 5, th: 2, label: 'CRATE OF RECORDS' },
       { kind: 'till', tx: 21, ty: 12, tw: 4, th: 2, label: 'THE TILL' },
       { kind: 'poster', tx: 24, ty: 2, tw: 2, th: 3, walk: true },
       { kind: 'poster', tx: 24, ty: 6, tw: 2, th: 3, walk: true },
       { kind: 'bin', tx: 24, ty: 14, tw: 1, th: 1 }]
    ),
    npcs: [
      { name: 'THE OWNER', carry: 'phone', tag: '"Everything is as it is. Plug it in if you want. Do not plug in the orange one."',
        route: [{ tx: 22, ty: 11, wait: 8, act: 'stand' }, { tx: 18, ty: 11, wait: 3 }, { tx: 22, ty: 11, wait: 9 }] },
      { name: 'A REGULAR', carry: 'case', tag: '"Been coming here since the nineties. They know what I want before I do."',
        route: [{ tx: 5, ty: 8, wait: 4 }, { tx: 12, ty: 8, wait: 3 }, { tx: 19, ty: 8, wait: 4 }, { tx: 12, ty: 12, wait: 2 }] },
      { name: 'A KID', tag: 'Staring at a bass he is nine hundred dollars away from.',
        route: [{ tx: 16, ty: 4, wait: 7, act: 'stand' }, { tx: 8, ty: 7, wait: 2 }, { tx: 16, ty: 4, wait: 8 }] },
    ],
    use(S, p) { S.flash(p.label ? p.label + '.' : 'A LOT OF DUST AND A LOT OF HISTORY.'); },
    buy(S, p) {
      const r = Game.run, it = p.item;
      if (it.sold) return;
      if (r.money < it.price) { S.flash('NOT ENOUGH FOR THAT.'); Audio.ui('error'); return; }
      const msg = shopBuy(r, it.stock);
      it.sold = it.stock.sold; S.flash(msg.toUpperCase()); r.save();
      S.fx.burst(S.cam.sx(p.x + p.w / 2), S.cam.sy(p.y), 12, { color: ['#ffd24a', '#fff'], speed: 80, life: 0.6, kind: 'star', size: 2, gravity: 120 });
    },
  },
  // ======================= THE RAMEN COUNTER =======================
  ramen: {
    name: 'MENYA HACHI', sub: 'TICKET FIRST. THEN SIT.', tint: '#8a2a1c',
    w: 20, h: 12, zoom: 2.8,
    floor: '#8a7a5e', floorAlt: '#7f7054', wall: '#4a3524', wallTop: '#6a4f36',
    start: { tx: 10, ty: 10 },
    enter: 'IT IS THE SIZE OF A CORRIDOR AND SMELLS LIKE HEAVEN.',
    props: [].concat(
      [{ kind: 'noren', tx: 6, ty: 0, tw: 8, th: 1, walk: true, overhead: true },
       { kind: 'ticketmachine', tx: 2, ty: 8, tw: 2, th: 3, label: 'TICKET MACHINE', act: 'ticket' },
       { kind: 'ramencounter', tx: 3, ty: 4, tw: 14, th: 2, label: 'THE COUNTER', act: 'counter' },
       { kind: 'kitchen', tx: 3, ty: 1, tw: 14, th: 2 },
       { kind: 'stools', tx: 3, ty: 7, tw: 14, th: 1, label: 'SIT DOWN', act: 'sit' },
       { kind: 'water', tx: 17, ty: 7, tw: 2, th: 2, label: 'WATER AND CUPS' },
       { kind: 'bin', tx: 18, ty: 10, tw: 1, th: 1 },
       { kind: 'poster', tx: 0, ty: 2, tw: 1, th: 3, walk: true }]
    ),
    npcs: [
      { name: 'THE CHEF', tag: '"Ticket. Then sit. Then eat. Then go."', speed: 30,
        route: [{ tx: 6, ty: 3, wait: 3, act: 'work' }, { tx: 12, ty: 3, wait: 3, act: 'work' }, { tx: 9, ty: 3, wait: 4, act: 'work' }] },
      { name: 'A SALARYMAN', tag: 'Eating with the focus of somebody with eleven minutes.',
        route: [{ tx: 6, ty: 7, wait: 12, act: 'eat' }, { tx: 6, ty: 7, wait: 12, act: 'eat' }] },
      { name: 'A STUDENT', tag: '"Extra noodles are free. Do not tell anyone."',
        route: [{ tx: 13, ty: 7, wait: 9, act: 'eat' }, { tx: 15, ty: 9, wait: 3 }, { tx: 13, ty: 7, wait: 9 }] },
    ],
    use(S, p) {
      const r = Game.run;
      if (p.act === 'ticket') {
        if (S.ticket) { S.flash('YOU ALREADY HAVE A TICKET. GIVE IT TO THE COUNTER.'); return; }
        S.menu = S.menu || 0;
        const M = RAMEN_MENU[S.menu % RAMEN_MENU.length];
        if (r.money < M.price) { S.flash('THE MACHINE WANTS ' + fmtMoney(M.price) + '. IT DOES NOT NEGOTIATE.'); Audio.ui('error'); S.menu++; return; }
        r.money -= M.price; S.ticket = M; S.menu++;
        Audio.ui('cash'); S.flash('A TICKET FOR ' + M.name + '. ' + fmtMoney(M.price) + '.');
        return;
      }
      if (p.act === 'counter') {
        if (!S.ticket) { S.flash('TICKET FIRST. THE MACHINE IS BY THE DOOR.'); return; }
        if (S.cooking != null) { S.flash('IT IS COMING.'); return; }
        S.cooking = 4.5; S.speak('THE CHEF', 'He takes the ticket without looking at it and drops noodles into the water.');
        return;
      }
      if (p.act === 'sit') {
        if (!S.bowl) { S.flash(S.cooking != null ? 'NOT YET. IT IS COOKING.' : 'NOTHING TO EAT YET.'); return; }
        const M = S.bowl; S.bowl = null;
        for (const m of r.members) { m.hunger = 0; m.stamina = Math.min(m.maxStamina || 100, (m.stamina || 0) + 20); }
        r.stamina = Math.min(r.staminaMax, r.stamina + M.stam);
        r.gratitude = (r.gratitude || 0) + (M.grat || 0);
        Audio.ui('eat'); r.save();
        S.speak('YOU', M.after);
        S.flash('+' + M.stam + ' STAMINA. EVERYBODY IS FED.');
        return;
      }
      if (p.kind === 'water') { S.flash('COLD WATER. YOU POUR ONE FOR EVERYBODY.'); return; }
      S.flash(p.label || 'STEAM.');
    },
    tick(S, dt) {
      if (S.cooking != null) { S.cooking -= dt; if (S.cooking <= 0) { S.cooking = null; S.bowl = S.ticket; S.ticket = null; Audio.ui('fanfare'); S.flash(S.bowl.name + ' IS UP. SIT DOWN.'); } }
    },
    over(ctx, S) {
      // the bowl on the counter when it is ready, and the steam off it
      if (S.bowl) {
        const bx = 10 * RT, by = 5 * RT;
        ellipsePx(ctx, bx, by, 11, 7, '#f0ece2'); ellipsePx(ctx, bx, by - 1, 9, 5, '#e0a04a');
        rect(ctx, bx - 3, by - 3, 7, 2, '#f4e8d0'); rect(ctx, bx + 2, by - 2, 4, 2, '#c84a3a');
        for (let i = 0; i < 4; i++) { const k = ((ANIM_T * 0.8 + i * 0.25) % 1); ctx.globalAlpha = 0.5 * (1 - k); rect(ctx, bx - 4 + i * 3, by - 8 - k * 14, 2, 4, '#f0ece2'); ctx.globalAlpha = 1; }
      }
      if (S.cooking != null) {
        const bx = 9 * RT, by = 2 * RT;
        for (let i = 0; i < 6; i++) { const k = ((ANIM_T * 1.2 + i * 0.18) % 1); ctx.globalAlpha = 0.45 * (1 - k); rect(ctx, bx - 8 + i * 4, by - k * 20, 3, 5, '#e8ecf4'); ctx.globalAlpha = 1; }
      }
    },
  },
  // ======================= THE CAPSULE HOTEL =======================
  capsule: {
    name: 'HOTEL HACHI - CAPSULES', sub: 'SHOES OFF. FLOOR THREE.', tint: '#2f3f6a',
    w: 24, h: 16, zoom: 2.3,
    floor: '#3a4256', floorAlt: '#333b4e', wall: '#1f2636', wallTop: '#39445c',
    start: { tx: 12, ty: 14 },
    enter: 'THE CORRIDOR SMELLS OF CLEAN TOWELS AND HOT VENDING-MACHINE SOUP.',
    dark: 'rgba(12,18,38,0.22)',
    props: [].concat(
      [{ kind: 'counter', tx: 8, ty: 12, tw: 8, th: 2, label: 'CHECK IN', act: 'checkin' },
       { kind: 'shoerack', tx: 2, ty: 12, tw: 5, th: 2, label: 'SHOE LOCKERS' },
       { kind: 'lockers', tx: 17, ty: 11, tw: 6, th: 4, label: 'YOUR LOCKER', act: 'locker' },
       { kind: 'pods', tx: 2, ty: 1, tw: 10, th: 5, label: 'CAPSULES 101-110', act: 'sleep' },
       { kind: 'pods', tx: 13, ty: 1, tw: 9, th: 5, label: 'CAPSULES 111-118', act: 'sleep' },
       { kind: 'washbasin', tx: 2, ty: 8, tw: 6, th: 2, label: 'WASH AREA' },
       { kind: 'vending', tx: 10, ty: 8, tw: 2, th: 3, label: 'VENDING MACHINE', act: 'vend' },
       { kind: 'vending', tx: 12, ty: 8, tw: 2, th: 3, label: 'HOT SOUP', act: 'vend' },
       { kind: 'table', tx: 16, ty: 8, tw: 4, th: 2, label: 'COMMON TABLE' },
       { kind: 'tv', tx: 21, ty: 7, tw: 2, th: 3, walk: true, label: 'THE TELEVISION' },
       { kind: 'bench', tx: 16, ty: 6, tw: 5, th: 1 },
       { kind: 'rug', tx: 9, ty: 6, tw: 6, th: 1, walk: true, col: '#5a3a4a' },
       { kind: 'sign', tx: 5, ty: 6, tw: 3, th: 1, text: 'BATHS', col: '#2f5a9a', walk: true, overhead: true },
       { kind: 'bin', tx: 22, ty: 14, tw: 1, th: 1 }]
    ),
    npcs: [
      { name: 'THE NIGHT CLERK', tag: '"Curfew is never. Bath closes at two. Sleep well."',
        route: [{ tx: 12, ty: 11, wait: 10, act: 'stand' }, { tx: 9, ty: 11, wait: 3 }, { tx: 12, ty: 11, wait: 12 }] },
      { name: 'A GUEST', carry: 'bag', tag: 'Been here six weeks. Says it is cheaper than a flat and there is soup.',
        route: [{ tx: 18, ty: 9, wait: 5 }, { tx: 11, ty: 9, wait: 3 }, { tx: 6, ty: 10, wait: 4 }, { tx: 18, ty: 9, wait: 6 }] },
      { name: 'ANOTHER MUSICIAN', carry: 'case', tag: '"You playing tomorrow? Everybody here is playing tomorrow."',
        route: [{ tx: 17, ty: 7, wait: 8, act: 'sit' }, { tx: 20, ty: 10, wait: 3 }, { tx: 17, ty: 7, wait: 9 }] },
    ],
    use(S, p) {
      const r = Game.run;
      if (p.act === 'sleep') {
        r.nightPending = true; r.save();
        Audio.ui('select');
        Game.go(() => new NightScene(), 'fade', { dur: 0.8 });
        S.left = true;
        return;
      }
      if (p.act === 'vend') { if (r.money >= 3) { r.money -= 3; r.stamina = Math.min(r.staminaMax, r.stamina + 14); Audio.ui('eat'); S.flash('HOT CORN SOUP. -$3, +14 STAMINA.'); } else S.flash('THREE DOLLARS. YOU ARE SHORT.'); return; }
      if (p.act === 'locker') { S.flash('YOUR WHOLE LIFE FITS IN IT, WHICH IS THE POINT.'); return; }
      if (p.act === 'checkin') { S.speak('THE NIGHT CLERK', 'She slides a wristband across without looking up. "Same as last night. Three-oh-four."'); return; }
      S.flash(p.label || 'QUIET.');
    },
  },
};
// what the machine sells
const RAMEN_MENU = [
  { name: 'SHOYU RAMEN', price: 7, stam: 26, grat: 0, after: 'Salt, fat, noodles. You feel like a person again.' },
  { name: 'MISO RAMEN, EXTRA CORN', price: 9, stam: 32, grat: 1, after: 'You get corn in every single mouthful. Worth the two dollars.' },
  { name: 'TSUKEMEN', price: 10, stam: 34, grat: 1, after: 'Dipping noodles. You take your time. Nobody hurries you.' },
  { name: 'GYOZA SET', price: 8, stam: 24, grat: 0, after: 'Six of them, and the last one is always the best.' },
];
