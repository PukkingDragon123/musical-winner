// ---------- San Francisco: a living map you travel with Uber tickets ----------
'use strict';
const MAP_SCALE = 1.5;
const MAPW = 1500, MAPH = 1140;
const DISTRICTS = [
  { name: 'PRESIDIO', x: 150, y: 120, park: true, poly: [[60, 60], [300, 70], [310, 190], [70, 200]] },
  { name: 'THE MARINA', x: 390, y: 110, poly: [[310, 70], [520, 70], [520, 175], [310, 180]] },
  { name: 'FISHERMANS WHARF', x: 660, y: 90, poly: [[520, 60], [790, 70], [800, 150], [520, 150]] },
  { name: 'NORTH BEACH', x: 690, y: 175, poly: [[600, 150], [800, 150], [810, 225], [600, 225]] },
  { name: 'CHINATOWN', x: 660, y: 245, poly: [[600, 225], [760, 225], [760, 290], [600, 290]] },
  { name: 'NOB HILL', x: 560, y: 250, poly: [[470, 200], [600, 200], [600, 300], [470, 300]] },
  { name: 'FINANCIAL DISTRICT', x: 810, y: 265, poly: [[760, 225], [900, 235], [900, 320], [760, 310]] },
  { name: 'RICHMOND', x: 190, y: 275, poly: [[70, 210], [430, 215], [430, 330], [70, 330]] },
  { name: 'GOLDEN GATE PARK', x: 250, y: 365, park: true, poly: [[70, 335], [430, 340], [430, 405], [70, 400]] },
  { name: 'HAIGHT-ASHBURY', x: 470, y: 360, poly: [[435, 330], [560, 335], [560, 410], [435, 405]] },
  { name: 'THE SUNSET', x: 200, y: 470, poly: [[70, 410], [420, 415], [420, 560], [70, 555]] },
  { name: 'TWIN PEAKS', x: 460, y: 465, hill: true, poly: [[420, 415], [560, 420], [560, 520], [420, 515]] },
  { name: 'SOMA', x: 780, y: 400, poly: [[660, 320], [900, 330], [900, 460], [660, 450]] },
  { name: 'THE MISSION', x: 620, y: 500, poly: [[560, 425], [790, 435], [790, 600], [560, 590]] },
  { name: 'THE CASTRO', x: 520, y: 545, poly: [[430, 520], [560, 525], [560, 600], [430, 595]] },
  { name: 'BERNAL HEIGHTS', x: 700, y: 640, poly: [[560, 600], [820, 610], [820, 700], [560, 690]] },
];
const WATER = [
  { name: 'PACIFIC OCEAN', poly: [[0, 0], [65, 0], [70, 760], [0, 760]] },
  { name: 'SAN FRANCISCO BAY', poly: [[820, 0], [1000, 0], [1000, 760], [830, 760], [900, 470], [905, 230], [800, 60]] },
  { name: '', poly: [[0, 0], [1000, 0], [1000, 55], [300, 62], [0, 40]] },
];
// Streets: polylines with names, drawn Google-Maps style
const STREETS = [
  { name: 'THE EMBARCADERO', big: true, pts: [[790, 80], [830, 160], [860, 240], [880, 330], [890, 430]] },
  { name: 'MARKET ST', big: true, pts: [[880, 330], [790, 370], [700, 410], [610, 450], [520, 495], [460, 520]] },
  { name: 'VAN NESS AVE', big: true, pts: [[520, 90], [525, 220], [530, 340], [535, 450], [540, 560]] },
  { name: 'GEARY BLVD', big: true, pts: [[80, 285], [260, 285], [430, 282], [560, 275], [700, 268], [830, 260]] },
  { name: 'COLUMBUS AVE', pts: [[790, 120], [720, 180], [660, 230], [610, 280]] },
  { name: 'LOMBARD ST', pts: [[310, 130], [450, 128], [560, 130], [640, 135]] },
  { name: 'GRANT AVE', pts: [[655, 150], [655, 230], [652, 300]] },
  { name: 'CALIFORNIA ST', pts: [[430, 235], [520, 232], [610, 230], [700, 228], [800, 226]] },
  { name: 'DIVISADERO ST', pts: [[435, 220], [438, 340], [440, 450], [442, 550]] },
  { name: 'HAIGHT ST', pts: [[430, 370], [500, 368], [560, 366], [620, 364]] },
  { name: 'MISSION ST', big: true, pts: [[790, 390], [720, 450], [660, 510], [620, 570], [600, 640]] },
  { name: 'VALENCIA ST', pts: [[700, 460], [650, 520], [620, 580], [605, 650]] },
  { name: '19TH AVE', big: true, pts: [[210, 215], [212, 330], [214, 420], [216, 560]] },
  { name: 'JUDAH ST', pts: [[80, 445], [200, 445], [320, 443], [420, 440]] },
  { name: 'GREAT HIGHWAY', pts: [[80, 220], [78, 340], [76, 450], [78, 560]] },
  { name: 'FULTON ST', pts: [[80, 335], [220, 337], [340, 338], [430, 338]] },
  { name: 'CASTRO ST', pts: [[500, 520], [502, 570], [504, 620]] },
  { name: 'KING ST', pts: [[890, 430], [820, 450], [760, 465]] },
  { name: 'BAY ST', pts: [[330, 105], [450, 103], [560, 102], [680, 100]] },
];
// Travel graph. type: venue|shop|food|recruit|event|pickup|rest|home
// Each node: id, x, y, name, type, icon, district, venue(for gigs), tip
const NODES = [
  { id: 'wharf', x: 660, y: 95, name: 'FISHERMAN\'S WHARF', type: 'venue', venue: 'pier', icon: 'gig', sub: 'SEA LIONS & TOURISTS' },
  { id: 'pier39', x: 760, y: 95, name: 'PIER 39', type: 'venue', venue: 'pier', icon: 'gig', sub: 'FAT WALLETS' },
  { id: 'sourdough', x: 590, y: 100, name: 'SOURDOUGH SAM\'S', type: 'food', icon: 'food', sub: 'CLAM CHOWDER BOWL' },
  { id: 'lombard', x: 560, y: 130, name: 'LOMBARD ST', type: 'venue', venue: 'cablecar', icon: 'gig', sub: 'THE CROOKED ONE' },
  { id: 'palace', x: 350, y: 128, name: 'PALACE OF FINE ARTS', type: 'venue', venue: 'park', icon: 'elite', sub: 'BIG GIG' },
  { id: 'presidio', x: 170, y: 150, name: 'PRESIDIO', type: 'rest', icon: 'rest', sub: 'NAP IN THE EUCALYPTUS' },
  { id: 'ggb', x: 120, y: 75, name: 'GOLDEN GATE BRIDGE', type: 'venue', venue: 'bridge', icon: 'boss', sub: 'THE FINALE' },
  { id: 'coit', x: 720, y: 165, name: 'COIT TOWER', type: 'venue', venue: 'fidi', icon: 'gig', sub: 'VIEW OF THE BAY' },
  { id: 'beach', x: 690, y: 215, name: 'NORTH BEACH CAFE', type: 'recruit', icon: 'openmic', sub: 'OPEN MIC NIGHT' },
  { id: 'gate', x: 655, y: 265, name: 'CHINATOWN GATE', type: 'venue', venue: 'chinatown', icon: 'gig', sub: 'GRANT AVE CROWDS' },
  { id: 'dumpling', x: 600, y: 250, name: 'DUMPLING DYNASTY', type: 'food', icon: 'food', sub: '6 FOR A DOLLAR' },
  { id: 'fortune', x: 700, y: 300, name: 'FORTUNE COOKIE CO.', type: 'event', icon: 'event', sub: 'WHAT DOES YOURS SAY?' },
  { id: 'cable', x: 560, y: 230, name: 'CABLE CAR TURNAROUND', type: 'venue', venue: 'cablecar', icon: 'gig', sub: 'POWELL & MARKET' },
  { id: 'union', x: 760, y: 250, name: 'UNION SQUARE', type: 'venue', venue: 'fidi', icon: 'elite', sub: 'BIG GIG - RICH CROWD' },
  { id: 'ferry', x: 850, y: 300, name: 'FERRY BUILDING', type: 'venue', venue: 'ferry', icon: 'gig', sub: 'FARMERS MARKET' },
  { id: 'amoebug', x: 470, y: 275, name: 'AMOEBUG RECORDS', type: 'shop', icon: 'shop', sub: 'CHARMS & INSTRUMENTS' },
  { id: 'geary', x: 300, y: 283, name: 'GEARY & 14TH', type: 'pickup', icon: 'coin' },
  { id: 'clement', x: 180, y: 250, name: 'CLEMENT ST NOODLES', type: 'food', icon: 'food', sub: 'HAND PULLED' },
  { id: 'ocean', x: 95, y: 350, name: 'OCEAN BEACH', type: 'venue', venue: 'pier', icon: 'gig', sub: 'WINDY. VERY WINDY.' },
  { id: 'ggpark', x: 250, y: 368, name: 'GG PARK BANDSHELL', type: 'venue', venue: 'ggpark', icon: 'elite', sub: 'BIG GIG - REAL STAGE' },
  { id: 'teagarden', x: 340, y: 360, name: 'JAPANESE TEA GARDEN', type: 'rest', icon: 'rest', sub: 'QUIET. VERY QUIET.' },
  { id: 'haight', x: 490, y: 368, name: 'HAIGHT & ASHBURY', type: 'venue', venue: 'haight', icon: 'gig', sub: 'TIE DYE FOREVER' },
  { id: 'vinyl', x: 560, y: 366, name: 'HAIGHT VINYL', type: 'shop', icon: 'shop', sub: 'DUSTY CRATES' },
  { id: 'alamo', x: 470, y: 320, name: 'PAINTED LADIES', type: 'event', icon: 'event', sub: 'POSTCARD VIEW' },
  { id: 'judah', x: 230, y: 445, name: 'JUDAH & 19TH', type: 'pickup', icon: 'coin' },
  { id: 'sunset', x: 150, y: 470, name: 'SUNSET DINER', type: 'food', icon: 'food', sub: 'ALL DAY BREAKFAST' },
  { id: 'twin', x: 460, y: 470, name: 'TWIN PEAKS', type: 'event', icon: 'event', sub: 'THE WHOLE CITY' },
  { id: 'sutro', x: 400, y: 430, name: 'SUTRO TOWER', type: 'pickup', icon: 'coin' },
  { id: 'castro', x: 505, y: 560, name: 'CASTRO THEATRE', type: 'venue', venue: 'haight', icon: 'gig', sub: 'NEON MARQUEE' },
  { id: 'dolores', x: 610, y: 480, name: 'DOLORES PARK', type: 'venue', venue: 'park', icon: 'gig', sub: 'PICNIC BLANKETS' },
  { id: 'burrito', x: 660, y: 520, name: 'BURRITO BEETLE', type: 'food', icon: 'food', sub: 'MISSION STYLE' },
  { id: 'mission', x: 700, y: 455, name: '16TH ST BART', type: 'venue', venue: 'subway', icon: 'gig', sub: 'UNDERGROUND ACOUSTICS' },
  { id: 'clarion', x: 640, y: 570, name: 'CLARION ALLEY', type: 'event', icon: 'event', sub: 'MURALS & SPRAY CANS' },
  { id: 'valencia', x: 605, y: 635, name: 'VALENCIA ST', type: 'recruit', icon: 'openmic', sub: 'BUSKER BATTLE' },
  { id: 'bernal', x: 720, y: 640, name: 'BERNAL HILL', type: 'rest', icon: 'rest', sub: 'DOGS AND SUNSETS' },
  { id: 'ballpark', x: 860, y: 420, name: 'THE BALLPARK', type: 'venue', venue: 'stadium', icon: 'elite', sub: 'BIG GIG - GARLIC FRIES' },
  { id: 'soma', x: 790, y: 380, name: 'SOMA WAREHOUSE', type: 'recruit', icon: 'openmic', sub: 'WAREHOUSE JAM' },
  { id: 'bobabugs', x: 760, y: 340, name: 'BOBA BUGS', type: 'food', icon: 'food', sub: 'EXTRA PEARLS' },
  { id: 'caltrain', x: 820, y: 470, name: 'CALTRAIN', type: 'pickup', icon: 'coin' },
];
const EDGES = [
  ['ggb', 'presidio'], ['presidio', 'palace'], ['palace', 'lombard'], ['lombard', 'sourdough'], ['sourdough', 'wharf'], ['wharf', 'pier39'],
  ['pier39', 'coit'], ['coit', 'beach'], ['beach', 'gate'], ['gate', 'dumpling'], ['dumpling', 'cable'], ['cable', 'lombard'],
  ['gate', 'fortune'], ['fortune', 'union'], ['union', 'ferry'], ['ferry', 'bobabugs'], ['bobabugs', 'soma'], ['soma', 'ballpark'],
  ['ballpark', 'caltrain'], ['caltrain', 'mission'], ['union', 'cable'], ['cable', 'amoebug'], ['amoebug', 'geary'], ['geary', 'clement'],
  ['clement', 'presidio'], ['clement', 'ocean'], ['ocean', 'ggpark'], ['ggpark', 'teagarden'], ['teagarden', 'geary'], ['ggpark', 'judah'],
  ['judah', 'sunset'], ['sunset', 'ocean'], ['judah', 'sutro'], ['sutro', 'twin'], ['twin', 'castro'], ['ggpark', 'haight'],
  ['haight', 'vinyl'], ['vinyl', 'alamo'], ['alamo', 'amoebug'], ['vinyl', 'dolores'], ['dolores', 'mission'], ['mission', 'burrito'],
  ['burrito', 'clarion'], ['clarion', 'valencia'], ['valencia', 'bernal'], ['bernal', 'caltrain'], ['dolores', 'castro'], ['castro', 'clarion'],
  ['twin', 'haight'], ['mission', 'soma'], ['coit', 'union'], ['palace', 'geary'], ['sutro', 'haight'],
];
// Decorative map labels (no gameplay)
const MAP_DETAILS = [
  { kind: 'label', x: 900, y: 120, text: 'ALCATRAZ' }, { kind: 'label', x: 940, y: 560, text: 'BAY BRIDGE' },
  { kind: 'label', x: 30, y: 400, text: 'PACIFIC' }, { kind: 'label', x: 930, y: 350, text: 'THE BAY' },
];
function nodeById(id) { return NODES.find(n => n.id === id); }
function buildGraph() {
  const map = {}; for (const n of NODES) map[n.id] = Object.assign({}, n, { links: [] });
  for (const [a, b] of EDGES) { if (map[a] && map[b]) { map[a].links.push(b); map[b].links.push(a); } }
  return map;
}
const WEATHERS = {
  clear: { name: 'CLEAR', icon: 'sun', tint: null, tipMult: 1, desc: 'Sunny. Wallets open.' },
  fog:   { name: 'KARL THE FOG', icon: 'fog', tint: 'rgba(220,226,238,0.34)', tipMult: 0.9, desc: 'Fog rolls in. Smaller crowds.' },
  rain:  { name: 'RAIN', icon: 'rain', tint: 'rgba(90,120,170,0.28)', tipMult: 0.8, desc: 'Everyone hurries past.' },
  golden:{ name: 'GOLDEN HOUR', icon: 'sun', tint: 'rgba(255,190,120,0.22)', tipMult: 1.25, desc: 'The city glows. Tips up.' },
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
