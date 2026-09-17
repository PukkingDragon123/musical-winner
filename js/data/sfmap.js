// ---------- Tokyo: a living map you travel with train passes ----------
'use strict';
const MAP_SCALE = 1.5;
const MAPW = 1500, MAPH = 1140;
const DISTRICTS = [
  { name: 'SHINJUKU', x: 300, y: 180, poly: [[190, 110], [430, 115], [435, 255], [190, 250]] },
  { name: 'KABUKICHO', x: 330, y: 118, poly: [[250, 80], [430, 85], [430, 140], [250, 138]] },
  { name: 'YOYOGI PARK', x: 300, y: 330, park: true, poly: [[200, 280], [420, 285], [420, 385], [200, 380]] },
  { name: 'HARAJUKU', x: 470, y: 315, poly: [[425, 270], [570, 275], [570, 360], [425, 355]] },
  { name: 'OMOTESANDO', x: 560, y: 385, poly: [[480, 360], [640, 365], [640, 420], [480, 415]] },
  { name: 'SHIBUYA', x: 420, y: 465, poly: [[330, 400], [540, 405], [540, 530], [330, 525]] },
  { name: 'SHIMOKITAZAWA', x: 165, y: 450, poly: [[70, 395], [290, 400], [290, 500], [70, 495]] },
  { name: 'NAKANO', x: 150, y: 250, poly: [[70, 200], [190, 205], [190, 300], [70, 295]] },
  { name: 'AKIHABARA', x: 720, y: 210, poly: [[650, 160], [810, 165], [810, 260], [650, 255]] },
  { name: 'UENO', x: 780, y: 115, park: true, poly: [[690, 70], [860, 75], [860, 155], [690, 150]] },
  { name: 'ASAKUSA', x: 900, y: 95, poly: [[865, 55], [990, 60], [990, 150], [865, 145]] },
  { name: 'GINZA', x: 730, y: 340, poly: [[650, 290], [820, 295], [820, 380], [650, 375]] },
  { name: 'ROPPONGI', x: 590, y: 490, poly: [[545, 440], [690, 445], [690, 540], [545, 535]] },
  { name: 'TSUKIJI', x: 800, y: 450, poly: [[720, 405], [880, 410], [880, 490], [720, 485]] },
  { name: 'ODAIBA', x: 900, y: 590, poly: [[820, 545], [990, 550], [990, 650], [820, 645]] },
  { name: 'MEGURO', x: 420, y: 600, poly: [[300, 550], [540, 555], [540, 650], [300, 645]] },
];
const WATER = [
  { name: 'TOKYO BAY', poly: [[790, 690], [1000, 690], [1000, 500], [900, 505], [860, 560], [800, 620]] },
  { name: 'SUMIDA RIVER', poly: [[985, 40], [1000, 40], [1000, 700], [955, 700], [930, 420], [950, 180]] },
  { name: '', poly: [[0, 690], [1000, 690], [1000, 760], [0, 760]] },
];
// Streets: polylines with names, drawn like a transit map
const STREETS = [
  { name: 'YAMANOTE LINE', big: true, pts: [[300, 120], [290, 260], [330, 380], [420, 440], [560, 430], [680, 370], [740, 260], [760, 140], [800, 90]] },
  { name: 'MEIJI-DORI', big: true, pts: [[300, 90], [310, 210], [330, 300], [400, 400], [430, 470], [440, 560]] },
  { name: 'OMOTESANDO', big: true, pts: [[440, 330], [500, 350], [560, 380], [620, 400], [660, 415]] },
  { name: 'TAKESHITA-DORI', pts: [[430, 300], [490, 302], [545, 305]] },
  { name: 'CHUO-DORI', big: true, pts: [[720, 100], [722, 180], [726, 265], [730, 340], [734, 400]] },
  { name: 'YASUKUNI-DORI', big: true, pts: [[240, 130], [370, 128], [500, 135], [620, 145], [720, 150]] },
  { name: 'KAMINARIMON-DORI', pts: [[865, 100], [920, 98], [975, 100]] },
  { name: 'AOYAMA-DORI', pts: [[470, 430], [560, 445], [650, 460], [700, 470]] },
  { name: 'KOSHU-KAIDO', pts: [[80, 215], [190, 218], [300, 222], [400, 225]] },
  { name: 'DOGENZAKA', pts: [[400, 470], [360, 500], [330, 530]] },
  { name: 'SOTOBORI-DORI', pts: [[640, 200], [660, 290], [680, 370], [700, 440]] },
  { name: 'HARUMI-DORI', pts: [[700, 350], [780, 380], [850, 420], [900, 470]] },
  { name: 'RAINBOW BRIDGE', big: true, pts: [[830, 490], [870, 530], [900, 570]] },
  { name: 'INOKASHIRA LINE', pts: [[90, 430], [190, 440], [290, 450], [380, 460]] },
  { name: 'GINZA LINE', pts: [[430, 320], [530, 350], [640, 330], [720, 300], [790, 180], [880, 110]] },
];
// Travel graph. type: venue|shop|food|recruit|event|pickup|rest|home
// Each node: id, x, y, name, type, icon, district, venue(for gigs), tip
const NODES = [
  // ---- Shinjuku
  { id: 'kabuki', x: 330, y: 112, name: 'KABUKICHO GATE', type: 'venue', venue: 'neon', icon: 'gig', sub: 'NEON AND NOISE' },
  { id: 'goldengai', x: 400, y: 132, name: 'GOLDEN GAI', type: 'venue', venue: 'yokocho', icon: 'gig', sub: 'SIX SEATS A BAR' },
  { id: 'omoide', x: 262, y: 138, name: 'MEMORY LANE', type: 'food', icon: 'food', sub: 'YAKITORI AND SMOKE' },
  { id: 'shinjuku', x: 300, y: 205, name: 'SHINJUKU STATION', type: 'inside', interior: 'metro', icon: 'gig', sub: 'TWO HUNDRED EXITS' },
  { id: 'tocho', x: 210, y: 175, name: 'METRO GOV BUILDING', type: 'event', icon: 'event', sub: 'THE WHOLE CITY, FREE' },
  { id: 'disk', x: 372, y: 218, name: 'DISK UNION', type: 'shop', icon: 'shop', sub: 'SIX FLOORS OF VINYL' },
  // ---- Nakano / Shimokita
  { id: 'nakano', x: 150, y: 248, name: 'NAKANO BROADWAY', type: 'inside', interior: 'mall', icon: 'shop', sub: 'FOUR FLOORS, NO MAP' },
  { id: 'koenji', x: 110, y: 330, name: 'KOENJI BASEMENT', type: 'recruit', icon: 'openmic', sub: 'PUNK SINCE 1978' },
  { id: 'shimokita', x: 170, y: 448, name: 'SHIMOKITAZAWA', type: 'venue', venue: 'shotengai', icon: 'gig', sub: 'THRIFT AND GUITARS' },
  { id: 'curry', x: 250, y: 470, name: 'SHIMOKITA CURRY', type: 'food', icon: 'food', sub: 'SOUP CURRY, EXTRA HOT' },
  { id: 'inokashira', x: 95, y: 428, name: 'INOKASHIRA LINE', type: 'pickup', icon: 'coin' },
  // ---- Yoyogi / Harajuku
  { id: 'yoyogi', x: 300, y: 330, name: 'YOYOGI PARK', type: 'venue', venue: 'park', icon: 'gig', sub: 'SUNDAY ROCKABILLIES' },
  { id: 'meiji', x: 380, y: 300, name: 'MEIJI SHRINE', type: 'rest', icon: 'rest', sub: 'GRAVEL, CEDARS, QUIET' },
  { id: 'takeshita', x: 480, y: 302, name: 'TAKESHITA-DORI', type: 'venue', venue: 'takeshita', icon: 'gig', sub: 'CREPES AND CHAOS' },
  { id: 'crepe', x: 545, y: 318, name: 'MARION CREPES', type: 'food', icon: 'food', sub: 'STRAWBERRY, WHIPPED' },
  { id: 'omotesando', x: 560, y: 385, name: 'OMOTESANDO', type: 'venue', venue: 'ginza', icon: 'elite', sub: 'BIG GIG - RICH CROWD' },
  // ---- Shibuya
  { id: 'scramble', x: 420, y: 455, name: 'SHIBUYA SCRAMBLE', type: 'venue', venue: 'scramble', icon: 'elite', sub: 'BIG GIG - 3000 A LIGHT' },
  { id: 'hachiko', x: 448, y: 478, name: 'HACHIKO STATUE', type: 'event', icon: 'event', sub: 'EVERYONE MEETS HERE' },
  { id: 'shibuyasta', x: 400, y: 492, name: 'SHIBUYA STATION', type: 'inside', interior: 'metro', icon: 'gig', sub: 'NOBODY HAS EVER FOUND HACHIKO EXIT' },
  { id: 'dogenzaka', x: 352, y: 508, name: 'DOGENZAKA', type: 'recruit', icon: 'openmic', sub: 'LIVE HOUSE BASEMENT' },
  { id: 'tower', x: 470, y: 425, name: 'TOWER RECORDS', type: 'shop', icon: 'shop', sub: 'NO MUSIC NO LIFE' },
  { id: 'ramen', x: 340, y: 448, name: 'SHIBUYA RAMEN', type: 'food', icon: 'food', sub: 'TONKOTSU, EXTRA EGG' },
  // ---- Roppongi / Meguro
  { id: 'roppongi', x: 590, y: 488, name: 'ROPPONGI CROSSING', type: 'venue', venue: 'neon', icon: 'gig', sub: 'AFTER MIDNIGHT' },
  { id: 'meguro', x: 420, y: 598, name: 'MEGURO RIVER', type: 'venue', venue: 'sakura', icon: 'gig', sub: 'CHERRY TREES, BOTH BANKS' },
  { id: 'onsen', x: 520, y: 570, name: 'SENTO BATHHOUSE', type: 'rest', icon: 'rest', sub: 'HOT WATER, NO PHONES' },
  { id: 'gyoza', x: 640, y: 545, name: 'GYOZA STAND', type: 'food', icon: 'food', sub: 'SIX FOR 300 YEN' },
  // ---- Ginza / Tsukiji
  { id: 'ginza', x: 730, y: 335, name: 'GINZA CROSSING', type: 'venue', venue: 'ginza', icon: 'elite', sub: 'BIG GIG - DEEP POCKETS' },
  { id: 'kabukiza', x: 770, y: 375, name: 'KABUKI-ZA', type: 'event', icon: 'event', sub: 'A REAL THEATRE' },
  { id: 'tsukiji', x: 800, y: 448, name: 'TSUKIJI OUTER MARKET', type: 'food', icon: 'food', sub: 'TAMAGOYAKI ON A STICK' },
  { id: 'yurakucho', x: 690, y: 400, name: 'YURAKUCHO ARCHES', type: 'venue', venue: 'yokocho', icon: 'gig', sub: 'UNDER THE TRACKS' },
  // ---- Akihabara / Ueno / Asakusa
  { id: 'akiba', x: 720, y: 208, name: 'AKIHABARA', type: 'venue', venue: 'akiba', icon: 'gig', sub: 'ELECTRIC TOWN' },
  { id: 'arcade', x: 770, y: 240, name: 'GAME CENTER', type: 'event', icon: 'event', sub: 'CRANE GAMES AND RHYTHM' },
  { id: 'maid', x: 668, y: 230, name: 'MAID CAFE', type: 'recruit', icon: 'openmic', sub: 'OKAERINASAI' },
  { id: 'radio', x: 760, y: 175, name: 'RADIO KAIKAN', type: 'inside', interior: 'mall', icon: 'shop', sub: 'TEN FLOORS OF PARTS' },
  { id: 'ueno', x: 780, y: 112, name: 'UENO PARK', type: 'venue', venue: 'park', icon: 'gig', sub: 'PICNICS AND PIGEONS' },
  { id: 'ameyoko', x: 700, y: 120, name: 'AMEYOKO MARKET', type: 'pickup', icon: 'coin' },
  { id: 'sensoji', x: 900, y: 92, name: 'SENSO-JI', type: 'venue', venue: 'temple', icon: 'gig', sub: 'INCENSE AND LANTERNS' },
  { id: 'nakamise', x: 950, y: 120, name: 'NAKAMISE-DORI', type: 'pickup', icon: 'coin' },
  // ---- the places you go when you are not working: four attractions, each
  // one a room you walk around from above
  { id: 'uenozoo', x: 815, y: 92, name: 'UENO ZOO', type: 'place', place: 'zoo', icon: 'rest', sub: 'PANDAS, AND A VERY LOUD BIRD' },
  { id: 'sumida', x: 940, y: 158, name: 'SUMIDA AQUARIUM', type: 'place', place: 'aquarium', icon: 'rest', sub: 'BLUE LIGHT AND SLOW FISH' },
  { id: 'animate', x: 690, y: 185, name: 'ANIME MEGA STORE', type: 'place', place: 'anime', icon: 'shop', sub: 'DECALS, PEDALS, SEVEN FLOORS' },
  { id: 'gamecenter', x: 455, y: 432, name: 'GAME CENTER', type: 'place', place: 'arcade', icon: 'event', sub: 'CRANES AND A RHYTHM MACHINE' },
  // ---- Odaiba and the finale
  { id: 'odaiba', x: 890, y: 590, name: 'ODAIBA WATERFRONT', type: 'venue', venue: 'bayside', icon: 'elite', sub: 'BIG GIG - BAY BREEZE' },
  { id: 'dome', x: 610, y: 255, name: 'TOKYO DOME', type: 'venue', venue: 'dome', icon: 'elite', sub: 'BIG GIG - THE BIG EGG' },
  { id: 'skytree', x: 965, y: 215, name: 'TOKYO SKYTREE', type: 'venue', venue: 'skytree', icon: 'boss', sub: 'THE FINALE' },
  // ---- The question marks. Sixteen of them, everywhere, and none of them
  // tells you what it is until you are standing in front of it. Some are a
  // choice, some are a thing you have to actually play, and either can go
  // badly. They are the reason to walk the long way round.
  { id: 'q_omoide', x: 232, y: 108, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_tocho', x: 190, y: 130, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_nakano', x: 122, y: 288, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_koenji', x: 140, y: 384, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_shimokita', x: 214, y: 418, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_yoyogi', x: 258, y: 372, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_meiji', x: 412, y: 268, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_harajuku', x: 512, y: 340, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_shibuya', x: 372, y: 528, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_meguro', x: 470, y: 630, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_roppongi', x: 648, y: 512, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_ginza', x: 676, y: 318, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_tsukiji', x: 842, y: 408, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_akiba', x: 700, y: 268, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_ueno', x: 828, y: 140, name: '???', type: 'mystery', icon: 'mystery' },
  { id: 'q_asakusa', x: 928, y: 162, name: '???', type: 'mystery', icon: 'mystery' },
];
const EDGES = [
  ['kabuki', 'goldengai'], ['kabuki', 'omoide'], ['omoide', 'shinjuku'], ['goldengai', 'shinjuku'], ['shinjuku', 'tocho'],
  ['shinjuku', 'disk'], ['tocho', 'nakano'], ['nakano', 'koenji'], ['koenji', 'shimokita'], ['shimokita', 'curry'],
  ['shimokita', 'inokashira'], ['inokashira', 'koenji'], ['curry', 'ramen'], ['disk', 'yoyogi'], ['shinjuku', 'yoyogi'],
  ['yoyogi', 'meiji'], ['meiji', 'takeshita'], ['takeshita', 'crepe'], ['crepe', 'omotesando'], ['omotesando', 'tower'],
  ['yoyogi', 'scramble'], ['scramble', 'hachiko'], ['hachiko', 'shibuyasta'], ['shibuyasta', 'dogenzaka'], ['dogenzaka', 'ramen'],
  ['ramen', 'scramble'], ['tower', 'scramble'], ['shibuyasta', 'meguro'], ['meguro', 'onsen'], ['onsen', 'roppongi'],
  ['roppongi', 'gyoza'], ['gyoza', 'yurakucho'], ['omotesando', 'roppongi'], ['roppongi', 'ginza'], ['ginza', 'kabukiza'],
  ['kabukiza', 'tsukiji'], ['tsukiji', 'odaiba'], ['ginza', 'yurakucho'], ['yurakucho', 'akiba'], ['ginza', 'akiba'],
  ['akiba', 'arcade'], ['akiba', 'maid'], ['maid', 'radio'], ['radio', 'ueno'], ['ueno', 'ameyoko'], ['ameyoko', 'akiba'],
  ['ueno', 'sensoji'], ['sensoji', 'nakamise'], ['nakamise', 'skytree'], ['akiba', 'dome'], ['dome', 'shinjuku'],
  ['dome', 'ueno'], ['odaiba', 'skytree'], ['meguro', 'shimokita'], ['takeshita', 'omotesando'], ['arcade', 'ginza'],
  // every question mark hangs off two places, so it is always a detour you
  // choose rather than a thing the route drags you through
  ['q_omoide', 'omoide'], ['q_omoide', 'kabuki'], ['q_tocho', 'tocho'], ['q_tocho', 'nakano'],
  ['q_nakano', 'nakano'], ['q_nakano', 'koenji'], ['q_koenji', 'koenji'], ['q_koenji', 'shimokita'],
  ['q_shimokita', 'shimokita'], ['q_shimokita', 'curry'], ['q_yoyogi', 'yoyogi'], ['q_yoyogi', 'scramble'],
  ['q_meiji', 'meiji'], ['q_meiji', 'takeshita'], ['q_harajuku', 'takeshita'], ['q_harajuku', 'omotesando'],
  ['q_shibuya', 'dogenzaka'], ['q_shibuya', 'shibuyasta'], ['q_meguro', 'meguro'], ['q_meguro', 'onsen'],
  ['q_roppongi', 'roppongi'], ['q_roppongi', 'gyoza'], ['q_ginza', 'ginza'], ['q_ginza', 'yurakucho'],
  ['q_tsukiji', 'tsukiji'], ['q_tsukiji', 'kabukiza'], ['q_akiba', 'akiba'], ['q_akiba', 'maid'],
  ['q_ueno', 'ueno'], ['q_ueno', 'radio'], ['q_asakusa', 'sensoji'], ['q_asakusa', 'nakamise'],
];
// Decorative map labels (no gameplay)
const MAP_DETAILS = [
  { kind: 'label', x: 955, y: 330, text: 'SUMIDA R.' }, { kind: 'label', x: 900, y: 680, text: 'TOKYO BAY' },
  { kind: 'label', x: 60, y: 120, text: 'TO KICHIJOJI' }, { kind: 'label', x: 640, y: 620, text: 'TO SHINAGAWA' },
  { kind: 'label', x: 120, y: 660, text: 'TO YOKOHAMA' }, { kind: 'label', x: 560, y: 60, text: 'TO IKEBUKURO' },
  { kind: 'label', x: 990, y: 60, text: 'TO CHIBA' }, { kind: 'label', x: 300, y: 348, text: 'MEIJI JINGU' },
  { kind: 'label', x: 782, y: 132, text: 'SHINOBAZU POND' }, { kind: 'label', x: 430, y: 620, text: 'MEGURO R.' },
  // stations on the loop, drawn as a ring on the line the way a transit map does
  { kind: 'station', x: 300, y: 205, text: 'SHINJUKU' }, { kind: 'station', x: 400, y: 492, text: 'SHIBUYA' },
  { kind: 'station', x: 720, y: 208, text: 'AKIHABARA' }, { kind: 'station', x: 780, y: 112, text: 'UENO' },
  { kind: 'station', x: 690, y: 400, text: 'YURAKUCHO' }, { kind: 'station', x: 170, y: 448, text: 'SHIMOKITA' },
  // the scramble crossings, painted on in white stripes
  { kind: 'crossing', x: 420, y: 455 }, { kind: 'crossing', x: 730, y: 335 }, { kind: 'crossing', x: 590, y: 488 },
  // torii at the shrines and the temple
  { kind: 'torii', x: 380, y: 300 }, { kind: 'torii', x: 900, y: 92 }, { kind: 'torii', x: 336, y: 318 },
  // bridges where a road crosses water
  { kind: 'bridge', x: 850, y: 510, a: -0.72 }, { kind: 'bridge', x: 948, y: 260, a: 0 }, { kind: 'bridge', x: 944, y: 470, a: 0 },
  // parkland: little clumps of trees inside the green blocks
  { kind: 'trees', x: 250, y: 310 }, { kind: 'trees', x: 350, y: 355 }, { kind: 'trees', x: 400, y: 305 },
  { kind: 'trees', x: 720, y: 95 }, { kind: 'trees', x: 820, y: 130 }, { kind: 'trees', x: 300, y: 370 },
  { kind: 'trees', x: 380, y: 620 }, { kind: 'trees', x: 470, y: 585 },
  // the two towers, marked on the map the way landmarks are
  { kind: 'tower', x: 610, y: 470, text: 'TOKYO TOWER' }, { kind: 'tower', x: 965, y: 215, text: 'SKYTREE' },
];
// ---- Blossom, mascots, awnings and parked cars. A city map with nothing on
// it but roads is a diagram; this is the layer that makes it a place. All of
// it is seeded, so the map is the same map every run.
(function () {
  const rng = makeRng(3131);
  const push = (o) => MAP_DETAILS.push(o);
  // sakura follows the avenues, the way it does along every Tokyo canal
  for (const st of STREETS) {
    for (let i = 0; i < st.pts.length - 1; i++) {
      const [ax, ay] = st.pts[i], [bx, by] = st.pts[i + 1];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const nx = -(by - ay) / len, ny = (bx - ax) / len;
      for (let d = 26; d < len - 12; d += st.big ? 64 : 44) {
        if (rng.chance(st.big ? 0.62 : 0.42)) continue;
        const k = d / len, side = rng.sign();
        push({ kind: 'sakura', x: ax + (bx - ax) * k + nx * 15 * side, y: ay + (by - ay) * k + ny * 15 * side, r: rng.range(0.85, 1.3) });
      }
    }
  }
  // and fills the parks, mixed in with the green
  for (const d of DISTRICTS) {
    if (!d.park) continue;
    const xs = d.poly.map(p2 => p2[0]), ys = d.poly.map(p2 => p2[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    for (let i = 0; i < 16; i++) push({ kind: 'sakura', x: rng.range(x0 + 10, x1 - 10), y: rng.range(y0 + 10, y1 - 10), r: rng.range(0.9, 1.4) });
    for (let i = 0; i < 5; i++) push({ kind: 'flowers', x: rng.range(x0 + 10, x1 - 10), y: rng.range(y0 + 10, y1 - 10), c: rng.int(0, 3) });
  }
  // a mascot standing outside somewhere in every district, waving at nobody
  const MK = ['cat', 'bird', 'bean', 'fish', 'bear'];
  for (const d of DISTRICTS) {
    if (d.park) continue;
    push({ kind: 'mascot', x: d.x + rng.range(-46, 46), y: d.y + rng.range(18, 40), m: rng.pick(MK), c: rng.int(0, 5) });
  }
})();
function nodeById(id) { return NODES.find(n => n.id === id); }
function buildGraph() {
  const map = {}; for (const n of NODES) map[n.id] = Object.assign({}, n, { links: [] });
  for (const [a, b] of EDGES) { if (map[a] && map[b]) { map[a].links.push(b); map[b].links.push(a); } }
  return map;
}
const WEATHERS = {
  clear:  { name: 'CLEAR', icon: 'sun', tint: null, tipMult: 1, desc: 'Blue sky. Wallets open.' },
  fog:    { name: 'CITY HAZE', icon: 'fog', tint: 'rgba(220,226,238,0.34)', tipMult: 0.9, desc: 'Grey over the towers. Smaller crowds.' },
  rain:   { name: 'TSUYU RAIN', icon: 'rain', tint: 'rgba(90,120,170,0.28)', tipMult: 0.8, desc: 'A wall of clear umbrellas hurries past.' },
  golden: { name: 'GOLDEN HOUR', icon: 'sun', tint: 'rgba(255,190,120,0.22)', tipMult: 1.25, desc: 'The whole city goes amber. Tips up.' },
  sakura: { name: 'PETAL FALL', icon: 'sun', tint: 'rgba(255,200,220,0.18)', tipMult: 1.15, desc: 'Blossom on the wind. Everybody lingers.' },
};
const WEATHER_KEYS = Object.keys(WEATHERS);

// scale all coordinates to the larger canvas
(function () {
  const S = MAP_SCALE;
  for (const d of DISTRICTS) { d.x *= S; d.y *= S; d.poly = d.poly.map(p => [p[0] * S, p[1] * S]); }
  for (const w of WATER) w.poly = w.poly.map(p => [p[0] * S, p[1] * S]);
  for (const st of STREETS) st.pts = st.pts.map(p => [p[0] * S, p[1] * S]);
  for (const n of NODES) { n.x = Math.round(n.x * S); n.y = Math.round(n.y * S); }
  for (const d of MAP_DETAILS) { d.x *= S; d.y *= S; }
})();

// ---------- Walkable tile grid, derived from the drawn map ----------
// Roads, plazas and parks are walkable; water and building footprints are not.
const TILE = 24;
const GW = Math.floor(MAPW / TILE), GH = Math.floor(MAPH / TILE);
let _grid = null;
function tileGrid() {
  if (_grid) return _grid;
  const TM = cityTiles();
  const walk = new Uint8Array(GW * GH), cost = new Uint8Array(GW * GH);
  for (let i = 0; i < walk.length; i++) {
    const k = TM.kind[i];
    walk[i] = TILE_WALKABLE[k] ? 1 : 0;
    cost[i] = TILE_COST[k] || 2;
  }
  _grid = { walk, cost, w: GW, h: GH };
  return _grid;
}
function tileWalkable(gr, tx, ty) { return tx >= 0 && ty >= 0 && tx < gr.w && ty < gr.h && !!gr.walk[ty * gr.w + tx]; }
function tileCost(gr, tx, ty) { return gr.cost[ty * gr.w + tx] || 1; }
// Breadth-first route between two tiles, returning the tiles after the start.
function tileRoute(gr, ax, ay, bx, by, limit = 4000) {
  if (ax === bx && ay === by) return [];
  const start = ay * gr.w + ax, goal = by * gr.w + bx;
  const prev = new Int32Array(gr.w * gr.h).fill(-1);
  const q = [start]; prev[start] = start; let head = 0, seen = 0;
  while (head < q.length && seen++ < limit) {
    const cur = q[head++]; if (cur === goal) break;
    const cx = cur % gr.w, cy = (cur / gr.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (!tileWalkable(gr, nx, ny)) continue;
      const ni = ny * gr.w + nx; if (prev[ni] !== -1) continue;
      prev[ni] = cur; q.push(ni);
    }
  }
  if (prev[goal] === -1) return null;
  const out = []; let cur = goal;
  while (cur !== start) { out.push({ tx: cur % gr.w, ty: (cur / gr.w) | 0 }); cur = prev[cur]; }
  return out.reverse();
}

// ---------- The city as a logical tile map ----------
// Every square of the city is one of these. The renderer turns them into
// pixel tiles, and movement reads walkability straight off this array.
const T_WATER = 0, T_LAND = 1, T_PARK = 2, T_BLDG = 3, T_ROAD = 4, T_BIGROAD = 5, T_PLAZA = 6, T_SHORE = 7;
let _tmap = null;
function cityTiles() {
  if (_tmap) return _tmap;
  const N = GW * GH, kind = new Uint8Array(N).fill(T_LAND), variant = new Uint8Array(N);
  const rng = makeRng(8181);
  const idx = (x, y) => y * GW + x;
  const inb = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH;
  const setK = (x, y, k) => { if (inb(x, y)) kind[idx(x, y)] = k; };
  // point-in-polygon over map coordinates
  const inPoly = (poly, px2, py) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (((yi > py) !== (yj > py)) && px2 < (xj - xi) * (py - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  // ---- water, then parks, then the rest is land
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
    for (const w of WATER) if (inPoly(w.poly, cx, cy)) { setK(tx, ty, T_WATER); break; }
  }
  for (const d of DISTRICTS) {
    if (!d.park) continue;
    for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
      if (kind[idx(tx, ty)] === T_WATER) continue;
      if (inPoly(d.poly, (tx + 0.5) * TILE, (ty + 0.5) * TILE)) setK(tx, ty, T_PARK);
    }
  }
  // ---- roads: rasterise every street and travel edge onto the grid
  const stamp = (x0, y0, x1, y1, big) => {
    const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (TILE * 0.4)));
    for (let i = 0; i <= steps; i++) {
      const k = i / steps, mx = lerp(x0, x1, k), my = lerp(y0, y1, k);
      const tx = Math.floor(mx / TILE), ty = Math.floor(my / TILE);
      if (!inb(tx, ty) || kind[idx(tx, ty)] === T_WATER) continue;
      const cur = kind[idx(tx, ty)];
      if (big || cur !== T_BIGROAD) kind[idx(tx, ty)] = big ? T_BIGROAD : T_ROAD;
    }
  };
  for (const st of STREETS) for (let i = 1; i < st.pts.length; i++) stamp(st.pts[i - 1][0], st.pts[i - 1][1], st.pts[i][0], st.pts[i][1], !!st.big);
  const G = buildGraph();
  for (const [a, b] of EDGES) { const na = G[a], nb = G[b]; if (na && nb) stamp(na.x, na.y, nb.x, nb.y, false); }
  // close one-tile gaps so the road network is actually connected
  const isR = (tx, ty) => inb(tx, ty) && (kind[idx(tx, ty)] === T_ROAD || kind[idx(tx, ty)] === T_BIGROAD);
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (let ty = 1; ty < GH - 1; ty++) for (let tx = 1; tx < GW - 1; tx++) {
      if (isR(tx, ty) || kind[idx(tx, ty)] === T_WATER) continue;
      if ((isR(tx - 1, ty) && isR(tx + 1, ty)) || (isR(tx, ty - 1) && isR(tx, ty + 1))) add.push(idx(tx, ty));
    }
    for (const i of add) kind[i] = T_ROAD;
  }
  // ---- blocks: whatever land is left inside a district becomes buildings
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    const i = idx(tx, ty); if (kind[i] !== T_LAND) continue;
    const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
    let inCity = false, dense = false;
    for (const d of DISTRICTS) { if (d.park) continue; if (inPoly(d.poly, cx, cy)) { inCity = true; dense = /FINANCIAL|SOMA|CHINATOWN|NORTH BEACH|NOB/.test(d.name); break; } }
    if (!inCity) { variant[i] = rng.int(0, 3); continue; }
    kind[i] = rng.chance(dense ? 0.9 : 0.72) ? T_BLDG : T_PLAZA;
    variant[i] = rng.int(0, 5) + (dense ? 8 : 0);
  }
  // ---- pins always stand on a walkable square, and get a plaza if they'd be in a wall
  for (const n of NODES) {
    const tx = clamp(Math.round(n.x / TILE), 0, GW - 1), ty = clamp(Math.round(n.y / TILE), 0, GH - 1);
    n.tx = tx; n.ty = ty;
    if (kind[idx(tx, ty)] === T_BLDG || kind[idx(tx, ty)] === T_WATER) kind[idx(tx, ty)] = T_PLAZA;
    let touches = false;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = inb(tx + dx, ty + dy) ? kind[idx(tx + dx, ty + dy)] : T_WATER; if (k === T_ROAD || k === T_BIGROAD || k === T_PLAZA) touches = true; }
    if (!touches) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (inb(tx + dx, ty + dy) && kind[idx(tx + dx, ty + dy)] !== T_WATER) { kind[idx(tx + dx, ty + dy)] = T_PLAZA; break; } }
  }
  // ---- shore: any water square touching land
  for (let ty = 0; ty < GH; ty++) for (let tx = 0; tx < GW; tx++) {
    if (kind[idx(tx, ty)] !== T_WATER) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      if (inb(tx + dx, ty + dy) && kind[idx(tx + dx, ty + dy)] !== T_WATER) { kind[idx(tx, ty)] = T_SHORE; break; }
    }
  }
  for (let i = 0; i < N; i++) if (!variant[i]) variant[i] = rng.int(0, 5);
  _tmap = { kind, variant, w: GW, h: GH };
  return _tmap;
}
const TILE_WALKABLE = { 0: 0, 1: 1, 2: 1, 3: 0, 4: 1, 5: 1, 6: 1, 7: 0 };
const TILE_COST = { 1: 2, 2: 2, 4: 1, 5: 1, 6: 1 };
