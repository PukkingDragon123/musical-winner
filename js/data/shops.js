// ---------- Everything with a sign on it at Narita ----------
// An airport is a shopping centre that occasionally lets an aeroplane land on
// it. This file is the shopping centre: forty-odd brands, what they sell, what
// it costs, and where in the building they stand. None of them are real
// companies. All of them are somebody you have met at four in the morning with
// a suitcase, which is the same thing.
//
// A SHOPS entry is deliberately shaped like the `brand` object that
// brandBoard / sideShopFront / brandLogo already take, so the terminal scene
// can hand a shop straight to the art kit without translating anything.
//
// Nothing in here draws. Nothing in here holds state. It is a catalogue.
'use strict';

// ---------- what a thing does to you when you eat it or carry it ----------
// `effect` on a stock item is one of these keys. The shop scene decides what
// each one actually costs the run; this is only the promise it makes.
const SHOP_EFFECTS = {
  warm:  { name: 'WARM',    note: 'A hot thing in cold hands. Worth more when it is raining.' },
  sugar: { name: 'SUGAR',   note: 'A quick lift and a quicker drop, about an hour later.' },
  voice: { name: 'VOICE',   note: 'Your throat holds out for one more song tonight.' },
  cure:  { name: 'CURE',    note: 'Whatever you were carrying around, you are not any more.' },
  rain:  { name: 'RAIN',    note: 'You own an umbrella now. You will leave it on a train.' },
  power: { name: 'POWER',   note: 'The phone lasts until the end of tomorrow.' },
  clean: { name: 'CLEAN',   note: 'Teeth, hands, face. Front desks notice. So do audiences.' },
  wear:  { name: 'WEAR',    note: 'Something clean to stand up in front of strangers.' },
  gear:  { name: 'GEAR',    note: 'Counts as equipment. It goes in the case, not the stomach.' },
  gift:  { name: 'GIFT',    note: 'Somebody is going to be pleased about this. Not today.' },
  read:  { name: 'READ',    note: 'Something to hold on the train that is not your phone.' },
  luck:  { name: 'LUCK',    note: 'Does nothing you could measure. Helps anyway.' },
};

// ---------- what kind of shop it is ----------
// The prompt word over the door, and a fallback interior tone for any shop
// that did not bother to pick one.
const SHOP_KIND_LOOK = {
  coffee:  { name: 'COFFEE',      label: 'ORDER',  tint: '#1b4a38' },
  food:    { name: 'RESTAURANT',  label: 'EAT',    tint: '#3a2418' },
  fast:    { name: 'FAST FOOD',   label: 'ORDER',  tint: '#5a2418' },
  conv:    { name: 'CONVENIENCE', label: 'GO IN',  tint: '#e8ecec' },
  fashion: { name: 'CLOTHES',     label: 'BROWSE', tint: '#d8d4cc' },
  beauty:  { name: 'COSMETICS',   label: 'BROWSE', tint: '#3a1018' },
  books:   { name: 'BOOKS',       label: 'BROWSE', tint: '#3a3020' },
  tech:    { name: 'ELECTRICAL',  label: 'BROWSE', tint: '#2a2a3a' },
  duty:    { name: 'DUTY FREE',   label: 'BROWSE', tint: '#1b2a44' },
  gift:    { name: 'SOUVENIRS',   label: 'BROWSE', tint: '#4a3a24' },
  pharma:  { name: 'PHARMACY',    label: 'GO IN',  tint: '#1b4a3a' },
  bank:    { name: 'COUNTER',     label: 'QUEUE',  tint: '#14402f' },
  luggage: { name: 'LUGGAGE',     label: 'BROWSE', tint: '#3a2418' },
  watch:   { name: 'WATCHES',     label: 'LOOK',   tint: '#1b1828' },
  toys:    { name: 'TOYS',        label: 'BROWSE', tint: '#5a2040' },
  sport:   { name: 'SPORT',       label: 'BROWSE', tint: '#14284a' },
  kids:    { name: 'PLAY AREA',   label: 'LOOK',   tint: '#7a4a18' },
  lounge:  { name: 'LOUNGE',      label: 'LOOK',   tint: '#1b2a44' },
  // Two kinds that live outside this airport. The Tokyo street carries its own
  // shop rows for them, and looks the name up in here, so the names live here.
  music:   { name: 'USED GEAR',    label: 'GO IN',  tint: '#3a3446' },
  hotel:   { name: 'FRONT DESK',   label: 'ASK',    tint: '#1b2a3e' },
};

// ---------- the shops ----------
// id       stable key, used by SHOP_STOCK and by save data
// name     what is on the board. Latin only, the pixel font has no kana
// tag      the little line under the name nobody reads
// kind     see SHOP_KIND_LOOK
// logo     ring crown pretzel leaf store bolt star bag bottle watch book pill plane
// col/col2 brand colours: the board, and the ink on it
// inner    the colour of the light inside, seen through the glass
// w        how wide the shopfront is in world pixels
// enter    can you actually go in and buy something
// zone     which AIRPORT_ZONES strip it stands in
// blurb    one sentence about what it is genuinely like to stand in there
const SHOPS = [
  // ---- the corridor off the aircraft, where nothing is open to you yet ----
  {
    id: 'dutyfly', name: 'DUTY FLY', tag: 'ARRIVALS DUTY FREE', kind: 'duty', logo: 'plane',
    col: '#12203f', col2: '#e0b23c', inner: '#1b2a44', w: 200, enter: true, zone: 'corridor',
    blurb: 'The same six bottles as every airport on earth, lit like a jewellery case.',
  },
  {
    id: 'gallery', name: 'GALLERY OF SMALL THINGS', tag: 'FREE ADMISSION', kind: 'gift', logo: 'leaf',
    col: '#4a3a5a', col2: '#f0e8d8', inner: '#2a2238', w: 150, enter: false, zone: 'corridor',
    blurb: 'Twelve carved toggles in a case and a guard who has read every label twice.',
  },

  // ---- baggage reclaim: money, and somewhere to fix what broke in the hold ----
  {
    id: 'travelarva', name: 'TRAVELARVA', tag: 'RATES ON THE BOARD', kind: 'bank', logo: 'star',
    col: '#1f5f4a', col2: '#f4f1ea', inner: '#14402f', w: 130, enter: true, zone: 'baggage',
    blurb: 'The rate is bad and the queue knows it and stands there anyway.',
  },
  {
    id: 'carapace', name: 'CARAPACE LUGGAGE', tag: 'WHEELS FITTED WHILE YOU WAIT', kind: 'luggage', logo: 'bag',
    col: '#5a3a2a', col2: '#f0e0c8', inner: '#3a2418', w: 150, enter: true, zone: 'baggage',
    blurb: 'A shop that exists entirely because of what carousels do to suitcases.',
  },

  // ---- the arrivals hall, the first place in Japan that sells you anything ----
  {
    id: 'sixeleven', name: 'SIX ELEVEN', tag: 'OPEN 24 HOURS, OBVIOUSLY', kind: 'conv', logo: 'store',
    col: '#2f6fc0', col2: '#f4f1ea', inner: '#e4e8e8', w: 160, enter: true, zone: 'arrivals',
    blurb: 'Brighter inside than the sky outside, at any hour you care to test it.',
  },
  {
    id: 'newsnest', name: 'NEWS NEST', tag: 'PAPERS - GUM - SIM CARDS', kind: 'gift', logo: 'book',
    col: '#c8402c', col2: '#f4f1ea', inner: '#4a1a14', w: 100, enter: false, zone: 'arrivals',
    blurb: 'Four newspapers, sixty magazines, and one shelf of things for crying children.',
  },
  {
    id: 'nymphplay', name: 'NYMPH PLAY CORNER', tag: 'SHOES OFF PLEASE', kind: 'kids', logo: 'star',
    col: '#f2a03a', col2: '#3a2408', inner: '#7a4a18', w: 140, enter: false, zone: 'arrivals',
    blurb: 'Foam blocks, a soft slide, and three parents sitting very still around the edge.',
  },

  // ---- ground concourse: the practical level ----
  {
    id: 'starbugs', name: 'STARBUGS', tag: 'COFFEE SINCE 1971-ISH', kind: 'coffee', logo: 'ring',
    col: '#0b6b4a', col2: '#f4f1ea', inner: '#1b4a38', w: 170, enter: true, zone: 'concourse',
    blurb: 'Every seat taken, every laptop open, and your name spelled a new way.',
  },
  {
    id: 'uniqlarva', name: 'UNIQLARVA', tag: 'LIFEWEAR FOR SMALL BODIES', kind: 'fashion', logo: 'bag',
    col: '#c8402c', col2: '#f4f1ea', inner: '#d8d4cc', w: 180, enter: true, zone: 'concourse',
    blurb: 'Folded so precisely that unfolding one feels like vandalism.',
  },
  {
    id: 'kinokubugiya', name: 'KINOKUBUGIYA', tag: 'BOOKS AND MAPS', kind: 'books', logo: 'book',
    col: '#2f4a68', col2: '#f0e8d0', inner: '#3a3020', w: 170, enter: true, zone: 'concourse',
    blurb: 'Four floors of Japanese and one shelf in English, half of it thrillers.',
  },
  {
    id: 'biccricket', name: 'BIC CRICKET', tag: 'EVERY CABLE EVER MADE', kind: 'tech', logo: 'bolt',
    col: '#d8202c', col2: '#f2e04a', inner: '#2a2a3a', w: 180, enter: true, zone: 'concourse',
    blurb: 'A jingle on a loop, a wall of adaptors, and staff who genuinely know which one.',
  },
  {
    id: 'matsumoth', name: 'MATSUMOTH KIYOSHI', tag: 'DRUGS AND MAKE-UP', kind: 'pharma', logo: 'pill',
    col: '#f2c40c', col2: '#3a2a08', inner: '#d8c860', w: 170, enter: true, zone: 'concourse',
    blurb: 'Yellow enough to be visible from orbit, and it sells face masks by the crate.',
  },
  {
    id: 'larvaland', name: 'LARVALAND TOYS', tag: 'CAPSULES AND PLUSH', kind: 'toys', logo: 'star',
    col: '#e04a8a', col2: '#fff0f6', inner: '#5a2040', w: 160, enter: false, zone: 'concourse',
    blurb: 'Sixty capsule machines and one bear the size of a fridge nobody has ever bought.',
  },
  {
    id: 'pollen', name: 'POLLEN PHARMACY', tag: 'DISPENSING SINCE 1948', kind: 'pharma', logo: 'pill',
    col: '#2f8f6a', col2: '#f4f1ea', inner: '#1b4a3a', w: 150, enter: true, zone: 'concourse',
    blurb: 'A quiet counter, a pharmacist with a mask on, and a stool for the queue.',
  },
  {
    id: 'hivepost', name: 'HIVE POST', tag: 'PARCELS - STAMPS - PATIENCE', kind: 'bank', logo: 'plane',
    col: '#e8503a', col2: '#f4f1ea', inner: '#5a1a14', w: 140, enter: false, zone: 'concourse',
    blurb: 'Where people post home the things they have decided not to carry any further.',
  },

  // ---- the mezzanine: the level that exists to be expensive ----
  {
    id: 'mothco', name: 'MOTH AND CO', tag: 'KNITWEAR', kind: 'fashion', logo: 'leaf',
    col: '#3a3040', col2: '#e8dcc8', inner: '#241d2c', w: 160, enter: false, zone: 'mezzanine',
    blurb: 'Cashmere for climates you are not going to, folded on a lit oak table.',
  },
  {
    id: 'mugi', name: 'MUGI', tag: 'NO BRAND', kind: 'fashion', logo: 'bag',
    col: '#8a2a2a', col2: '#f0ece2', inner: '#d8d2c4', w: 170, enter: true, zone: 'mezzanine',
    blurb: 'Everything is beige, everything is calm, and it costs more than the loud shops.',
  },
  {
    id: 'shiseidrone', name: 'SHISEIDRONE', tag: 'GINZA - SINCE 1872', kind: 'beauty', logo: 'bottle',
    col: '#b0142c', col2: '#f4f1ea', inner: '#3a1018', w: 150, enter: false, zone: 'mezzanine',
    blurb: 'Red lacquer, white light, and a sales assistant who can tell you slept on a plane.',
  },
  {
    id: 'beetlebath', name: 'BEETLE BATH AND BODY', tag: 'SOAP AND CANDLES', kind: 'beauty', logo: 'bottle',
    col: '#3a7a5a', col2: '#f8f4e8', inner: '#2a5a44', w: 140, enter: false, zone: 'mezzanine',
    blurb: 'You can smell it from the escalator. That is not an accident, that is the shop.',
  },
  {
    id: 'nocturne', name: 'NOCTURNE', tag: 'GENEVE - SINCE 1861', kind: 'watch', logo: 'watch',
    col: '#c8a03a', col2: '#12101c', inner: '#1b1828', w: 150, enter: false, zone: 'mezzanine',
    blurb: 'The advert from the seat-back, now in a glass case, still not yours.',
  },
  {
    id: 'antics', name: 'ANTICS SPORT', tag: 'RUNNING - TRAINING', kind: 'sport', logo: 'bolt',
    col: '#1b3a8a', col2: '#f4f1ea', inner: '#14284a', w: 160, enter: false, zone: 'mezzanine',
    blurb: 'Shoes that know exactly where you are going, sold to people who are sitting down.',
  },
  {
    id: 'hornma', name: 'HORNMA GOLF', tag: 'CLUBS AND GLOVES', kind: 'sport', logo: 'star',
    col: '#2a2a2a', col2: '#e0b23c', inner: '#1b1b1b', w: 140, enter: false, zone: 'mezzanine',
    blurb: 'A driver in the window costs more than a car, and somebody buys one every week.',
  },
  {
    id: 'sonymph', name: 'SONYMPH', tag: 'SOUND AND VISION', kind: 'tech', logo: 'bolt',
    col: '#1b1b24', col2: '#8ad8ff', inner: '#101018', w: 150, enter: false, zone: 'mezzanine',
    blurb: 'Headphones on a plinth, a robot dog on a loop, and a demo track you now hate.',
  },
  {
    id: 'silkworm', name: 'SILKWORM SILK', tag: 'PRINTED IN KYOTO', kind: 'fashion', logo: 'leaf',
    col: '#7a2a5a', col2: '#f8e8f0', inner: '#4a1838', w: 130, enter: false, zone: 'mezzanine',
    blurb: 'Scarves hung like paintings, and a mirror angled so you look better than you are.',
  },

  // ---- the food court, which is where the airport is honest ----
  {
    id: 'burgermonarch', name: 'BURGER MONARCH', tag: 'HAVE IT HOWEVER', kind: 'fast', logo: 'crown',
    col: '#c8402c', col2: '#f2c94c', inner: '#5a2418', w: 170, enter: true, zone: 'foodcourt',
    blurb: 'Flame-grilled smell pumped into the concourse on purpose, and it works on you.',
  },
  {
    id: 'antties', name: 'ANTTIES', tag: 'HOT TWISTS', kind: 'fast', logo: 'pretzel',
    col: '#e07020', col2: '#f8ecd0', inner: '#6a3a10', w: 140, enter: true, zone: 'foodcourt',
    blurb: 'Butter, salt, and a girl rolling dough in the window who has stopped looking up.',
  },
  {
    id: 'mantisramen', name: 'MANTIS RAMEN', tag: 'TICKET MACHINE BY THE DOOR', kind: 'food', logo: 'bottle',
    col: '#a82a1c', col2: '#f4e8c8', inner: '#3a1810', w: 150, enter: true, zone: 'foodcourt',
    blurb: 'Nine seats at a counter, no conversation, and steam on the inside of the glass.',
  },
  {
    id: 'yoshinobug', name: 'YOSHINOBUG', tag: 'BEEF BOWL', kind: 'food', logo: 'star',
    col: '#e8801a', col2: '#f4f1ea', inner: '#5a3208', w: 150, enter: true, zone: 'foodcourt',
    blurb: 'Fast, cheap and good, all three at once, which should not be legal.',
  },
  {
    id: 'nigirinymph', name: 'NIGIRI NYMPH', tag: 'IT GOES ROUND', kind: 'food', logo: 'leaf',
    col: '#2f5a8a', col2: '#f4f1ea', inner: '#1b3450', w: 150, enter: true, zone: 'foodcourt',
    blurb: 'A belt, a stack of plates by your elbow, and the quiet maths of what you owe.',
  },
  {
    id: 'hoppersoba', name: 'HOPPER SOBA', tag: 'STAND - EAT - GO', kind: 'food', logo: 'bolt',
    col: '#3a3a2a', col2: '#e8dcc0', inner: '#2a2a1c', w: 130, enter: true, zone: 'foodcourt',
    blurb: 'No chairs. Four minutes from ticket to empty bowl, and the broth is still good.',
  },
  {
    id: 'misterdronut', name: 'MISTER DRONUT', tag: 'CHEWY RINGS', kind: 'fast', logo: 'ring',
    col: '#e8a020', col2: '#5a2a10', inner: '#6a4218', w: 140, enter: true, zone: 'foodcourt',
    blurb: 'Free refills on the coffee, so half the tables are people who finished hours ago.',
  },
  {
    id: 'mossburger', name: 'MOSS BURGER', tag: 'RICE BUNS', kind: 'fast', logo: 'crown',
    col: '#2f6a3a', col2: '#f2e0a0', inner: '#1b4224', w: 140, enter: true, zone: 'foodcourt',
    blurb: 'Slower than the other burger place because they make it after you ask.',
  },

  // ---- the market row on the ground floor: where you actually buy things ----
  {
    id: 'colonymart', name: 'COLONY MART', tag: 'OPEN. ALWAYS. EVEN NOW.', kind: 'conv', logo: 'store',
    col: '#2f8f4a', col2: '#f4f1ea', inner: '#e8ecec', w: 240, enter: true, zone: 'market',
    blurb: 'Rice balls, hot coffee in a can, socks, and a toothbrush, all within one arm.',
  },
  {
    id: 'viedeflea', name: 'VIE DE FLEA', tag: 'BAKED THIS MORNING', kind: 'food', logo: 'pretzel',
    col: '#c8903a', col2: '#4a2e10', inner: '#e0cc9a', w: 150, enter: true, zone: 'market',
    blurb: 'You take the tongs and the tray, and the tongs make a noise you will remember.',
  },
  {
    id: 'daizo', name: 'DAIZO 100', tag: 'EVERYTHING ONE COIN', kind: 'gift', logo: 'store',
    col: '#e8503a', col2: '#f4f1ea', inner: '#d0d4d8', w: 160, enter: true, zone: 'market',
    blurb: 'Thirty aisles of things you did not know were solvable for one coin.',
  },
  {
    id: 'crawlbee', name: 'CRAWLBEE PLUS', tag: 'CRISPS MADE IN FRONT OF YOU', kind: 'gift', logo: 'bag',
    col: '#f2c40c', col2: '#a82a1c', inner: '#e8d86a', w: 140, enter: false, zone: 'market',
    blurb: 'A fryer behind glass, a queue for a warm bag, and the smell doing all the work.',
  },
  {
    id: 'itoant', name: 'ITO-ANT TEA', tag: 'LEAF - BOTTLE - POWDER', kind: 'gift', logo: 'leaf',
    col: '#2f7a4a', col2: '#f4f1ea', inner: '#1b4a2c', w: 130, enter: false, zone: 'market',
    blurb: 'Green in forty grades, and a man who will explain all forty if you pause.',
  },

  // ---- departures, seen from the wrong side, which is the sad side ----
  {
    id: 'doutermite', name: 'DOUTERMITE', tag: 'COFFEE AND TOAST', kind: 'coffee', logo: 'ring',
    col: '#5a3a1a', col2: '#f0e0c0', inner: '#3a2410', w: 140, enter: true, zone: 'departures',
    blurb: 'Cheaper than the green one, browner than the green one, and always has a seat.',
  },
  {
    id: 'tokyobanant', name: 'TOKYO BANANT', tag: 'THE ONE YOU BRING BACK', kind: 'gift', logo: 'leaf',
    col: '#f2c94c', col2: '#3a2a08', inner: '#e8d878', w: 140, enter: true, zone: 'departures',
    blurb: 'Boxed sponge cake, sold to people who have run out of time to think of anything.',
  },
  {
    id: 'roaches', name: "ROACHE'S CHOCOLATE", tag: 'KEEP IT COLD', kind: 'gift', logo: 'bag',
    col: '#3a2418', col2: '#e8c86a', inner: '#241810', w: 150, enter: true, zone: 'departures',
    blurb: 'They hand you an ice pack and a warning about how long it survives outside.',
  },
  {
    id: 'dfnest', name: 'DRAGON FLY SKY NEST', tag: 'MEMBERS ONLY', kind: 'lounge', logo: 'plane',
    col: '#12203f', col2: '#e0b23c', inner: '#1b2a44', w: 170, enter: false, zone: 'departures',
    blurb: 'Navy carpet, free noodles, and a glass door that knows you are not on the list.',
  },

  // ---- outside, at the kerb, on the way to a car ----
  {
    id: 'sixpetals', name: 'SIX PETALS', tag: 'FLOWERS', kind: 'gift', logo: 'leaf',
    col: '#e05a8a', col2: '#f8f0f4', inner: '#5a2840', w: 120, enter: false, zone: 'kerb',
    blurb: 'For arriving with, or apologising with. The stall keeps both wrapped and ready.',
  },
];

// ---------- what is on the shelves ----------
// Real products with real prices, in dollars because that is what your wallet
// still thinks in. `line` is what it does to you, said plainly.
const SHOP_STOCK = {
  // ---- the fullest shelf in the game ----
  colonymart: [
    { name: 'SALMON ONIGIRI', price: 2, icon: 'dumpling', kind: 'food', stam: 10, effect: 'warm', line: 'Cold rice, warm fish, film you tear along a number.' },
    { name: 'TUNA MAYO ONIGIRI', price: 2, icon: 'dumpling', kind: 'food', stam: 10, line: 'The one everybody actually buys, every single time.' },
    { name: 'PICKLED PLUM ONIGIRI', price: 2, icon: 'dumpling', kind: 'food', stam: 9, effect: 'cure', line: 'Sour enough to wake you up at the till.' },
    { name: 'EGG SALAD SANDWICH', price: 3, icon: 'bread', kind: 'food', stam: 14, line: 'White bread, no crusts, and somehow the best thing here.' },
    { name: 'COLD SOBA WITH DIP', price: 5, icon: 'noodles', kind: 'food', stam: 20, line: 'Buckwheat, ice water, a cup of sauce you pour yourself.' },
    { name: 'KARAAGE, FIVE PIECES', price: 4, icon: 'food', kind: 'food', stam: 22, effect: 'warm', line: 'Fried chicken from the hot case by the till, in a paper bag.' },
    { name: 'HOT CAN COFFEE', price: 2, icon: 'coffee', kind: 'drink', stam: 8, effect: 'warm', line: 'Out of a heated cabinet. Holds your hands together for a block.' },
    { name: 'ICED COFFEE CUP', price: 3, icon: 'coffee', kind: 'drink', stam: 9, line: 'A cup of ice from the freezer, coffee from the machine, do it yourself.' },
    { name: 'GREEN TEA, 500ML', price: 2, icon: 'bottle', kind: 'drink', stam: 6, line: 'Unsweetened, which surprises you for about four seconds.' },
    { name: 'ENERGY DRINK', price: 3, icon: 'bottle', kind: 'drink', stam: 18, effect: 'sugar', line: 'Tastes like a vitamin apologising. Buys you two hours.' },
    { name: 'CUSTARD PUDDING', price: 2, icon: 'dango', kind: 'food', stam: 8, effect: 'sugar', line: 'In a plastic cup with a burnt sugar layer that always wins.' },
    { name: 'MELON BREAD', price: 2, icon: 'bread', kind: 'food', stam: 12, effect: 'sugar', line: 'No melon anywhere in it. Crunchy lid, soft everything else.' },
    { name: 'INSTANT NOODLE CUP', price: 2, icon: 'noodles', kind: 'food', stam: 15, effect: 'warm', line: 'There is a kettle by the door and a bin for the lid.' },
    { name: 'CHOCOLATE BAR', price: 2, icon: 'food', kind: 'food', stam: 6, effect: 'sugar', line: 'Small, dark, gone before you reach the automatic doors.' },
    { name: 'CLEAR PLASTIC UMBRELLA', price: 6, icon: 'net', kind: 'item', effect: 'rain', line: 'The national umbrella. You will lose it inside a week.' },
    { name: 'PHONE CHARGER CABLE', price: 8, icon: 'strings', kind: 'item', effect: 'power', line: 'Overpriced, in a blister pack, and the exact one you need.' },
    { name: 'PLASTERS, TEN PACK', price: 3, icon: 'permit', kind: 'item', effect: 'cure', line: 'For the back of both heels, about four hours from now.' },
    { name: 'TOOTHBRUSH AND PASTE SET', price: 3, icon: 'key', kind: 'item', effect: 'clean', line: 'A travel set in a tube. The capsule hotel will not provide one.' },
    { name: 'BLACK SOCKS, ONE PAIR', price: 4, icon: 'boots', kind: 'item', effect: 'wear', line: 'Clean socks change your entire opinion of a day.' },
    { name: 'AA BATTERIES, FOUR', price: 4, icon: 'metronome', kind: 'gear', effect: 'gear', line: 'For the tuner, the pedal, and the thing you have not bought yet.' },
    { name: 'WET WIPES', price: 2, icon: 'permit', kind: 'item', effect: 'clean', line: 'Eleven hours of aeroplane comes off with about six of these.' },
    { name: 'CHICKEN SKEWER', price: 2, icon: 'food', kind: 'food', stam: 11, effect: 'warm', line: 'From the hot case. They ask if you want sauce. Say yes.' },
  ],

  // ---- coffee ----
  starbugs: [
    { name: 'DRIP COFFEE, TALL', price: 3, icon: 'coffee', kind: 'drink', stam: 9, effect: 'warm', line: 'Burnt in the good way, and the cup keeps your hands busy.' },
    { name: 'ICED LATTE, GRANDE', price: 5, icon: 'coffee', kind: 'drink', stam: 11, line: 'Cold enough to hurt. Wakes you up twice, once by temperature.' },
    { name: 'MATCHA LATTE', price: 5, icon: 'coffee', kind: 'drink', stam: 12, line: 'Green, grassy and sweeter than anybody who orders it admits.' },
    { name: 'CARAMEL FROTH THING', price: 6, icon: 'coffee', kind: 'drink', stam: 14, effect: 'sugar', line: 'Dessert wearing a coffee costume. No regrets until later.' },
    { name: 'SAKURA LATTE, SEASONAL', price: 6, icon: 'coffee', kind: 'drink', stam: 12, effect: 'luck', line: 'It is not the season. They are selling it anyway.' },
    { name: 'BLUEBERRY SCONE', price: 4, icon: 'bread', kind: 'food', stam: 12, line: 'Dry on purpose, so you have to buy something to drink.' },
    { name: 'HAM AND CHEESE CROISSANT', price: 5, icon: 'bread', kind: 'food', stam: 16, effect: 'warm', line: 'Toasted flat in a press. Comes out too hot to hold.' },
    { name: 'BOTTLED WATER', price: 2, icon: 'bottle', kind: 'drink', stam: 5, effect: 'voice', line: 'Your throat has been in a pressurised tube for eleven hours.' },
  ],
  doutermite: [
    { name: 'BLEND COFFEE', price: 2, icon: 'coffee', kind: 'drink', stam: 8, effect: 'warm', line: 'A small cup, a small saucer, and nobody hurrying you at all.' },
    { name: 'MILANO SANDWICH', price: 5, icon: 'bread', kind: 'food', stam: 18, effect: 'warm', line: 'Pressed flat, cut on the diagonal, served on a real plate.' },
    { name: 'THICK TOAST WITH BUTTER', price: 3, icon: 'bread', kind: 'food', stam: 13, effect: 'warm', line: 'Two centimetres thick. The butter goes all the way in.' },
    { name: 'ICED TEA', price: 3, icon: 'bottle', kind: 'drink', stam: 7, line: 'Comes with a tiny jug of syrup you are meant to pour yourself.' },
    { name: 'MORNING SET', price: 6, icon: 'food', kind: 'food', stam: 24, effect: 'warm', line: 'Coffee, toast, a boiled egg, and a newspaper somebody left.' },
  ],
  misterdronut: [
    { name: 'CHEWY RING', price: 3, icon: 'dango', kind: 'food', stam: 12, effect: 'sugar', line: 'Eight little balls in a circle. It squeaks. It should not squeak.' },
    { name: 'OLD FASHIONED DONUT', price: 2, icon: 'dango', kind: 'food', stam: 10, effect: 'sugar', line: 'Crumbly, honest, and the same price it was in 1985.' },
    { name: 'CHOCOLATE DONUT', price: 2, icon: 'dango', kind: 'food', stam: 10, effect: 'sugar', line: 'The icing cracks when you bite it. That is the entire appeal.' },
    { name: 'COFFEE, FREE REFILLS', price: 3, icon: 'coffee', kind: 'drink', stam: 10, effect: 'warm', line: 'You can sit here until somebody asks you to leave. Nobody will.' },
    { name: 'NOODLE SOUP', price: 4, icon: 'noodles', kind: 'food', stam: 17, effect: 'warm', line: 'A donut shop that sells soup. It is better than it has any right to be.' },
  ],

  // ---- burgers and twists ----
  burgermonarch: [
    { name: 'THE MONARCH', price: 7, icon: 'burrito', kind: 'food', stam: 30, effect: 'warm', line: 'Flame-grilled, slightly crushed in the box, exactly as intended.' },
    { name: 'DOUBLE MONARCH', price: 9, icon: 'burrito', kind: 'food', stam: 38, effect: 'warm', line: 'Twice the patty, same bun, structurally a poor decision.' },
    { name: 'CHICKEN ROYALE', price: 7, icon: 'burrito', kind: 'food', stam: 28, line: 'Long, thin, and mostly lettuce at one end. Everyone knows.' },
    { name: 'FRIES, LARGE', price: 3, icon: 'food', kind: 'food', stam: 14, effect: 'warm', line: 'Salted like the sea. Gone before you find a table.' },
    { name: 'ONION RINGS', price: 4, icon: 'food', kind: 'food', stam: 15, line: 'Nine rings. Two of them are just batter, and you knew that.' },
    { name: 'CHOCOLATE SHAKE', price: 4, icon: 'bottle', kind: 'drink', stam: 16, effect: 'sugar', line: 'Too thick for the straw, which is how you can tell it is real.' },
    { name: 'COLA, REFILLABLE', price: 2, icon: 'bottle', kind: 'drink', stam: 8, effect: 'sugar', line: 'The machine is over there and nobody is watching it.' },
    { name: 'BREAKFAST MUFFIN', price: 4, icon: 'bread', kind: 'food', stam: 18, effect: 'warm', line: 'Served until ten thirty, which it is not any more. They do it anyway.' },
  ],
  antties: [
    { name: 'ORIGINAL PRETZEL', price: 4, icon: 'bread', kind: 'food', stam: 16, effect: 'warm', line: 'Handed over in wax paper, so hot you swap hands twice.' },
    { name: 'CINNAMON SUGAR PRETZEL', price: 5, icon: 'bread', kind: 'food', stam: 17, effect: 'sugar', line: 'You will find sugar on your jacket tomorrow and smile about it.' },
    { name: 'JALAPENO CHEESE PRETZEL', price: 5, icon: 'bread', kind: 'food', stam: 18, effect: 'warm', line: 'Comes with a tub of cheese that has never been near a cow.' },
    { name: 'PRETZEL DOG', price: 6, icon: 'burrito', kind: 'food', stam: 22, effect: 'warm', line: 'A sausage wearing a pretzel. Nobody asked for this. Everybody buys it.' },
    { name: 'PRETZEL NUGGETS', price: 5, icon: 'dango', kind: 'food', stam: 15, line: 'A cup of small ones, for people who cannot commit.' },
    { name: 'LEMONADE', price: 3, icon: 'bottle', kind: 'drink', stam: 8, effect: 'voice', line: 'Sharp, cold, and it cuts straight through the salt.' },
    { name: 'FROZEN LEMONADE', price: 4, icon: 'bottle', kind: 'drink', stam: 10, effect: 'sugar', line: 'Drink it too fast and your whole head stops working for ten seconds.' },
  ],
  mossburger: [
    { name: 'RICE BUN BURGER', price: 6, icon: 'burrito', kind: 'food', stam: 26, effect: 'warm', line: 'Two pressed discs of rice instead of bread. It works. Annoyingly.' },
    { name: 'TERIYAKI BURGER', price: 6, icon: 'burrito', kind: 'food', stam: 25, effect: 'warm', line: 'Sweet, sticky, and served with a wet wipe because they know.' },
    { name: 'FRESH VEGETABLE BURGER', price: 7, icon: 'burrito', kind: 'food', stam: 24, line: 'They build it after you order, so you stand there for six minutes.' },
    { name: 'CORN SOUP', price: 3, icon: 'noodles', kind: 'food', stam: 12, effect: 'warm', line: 'A paper cup of it, sweet and thick, in an airport, for no reason.' },
  ],

  // ---- proper food ----
  mantisramen: [
    { name: 'SHOYU RAMEN', price: 8, icon: 'noodles', kind: 'food', stam: 34, effect: 'warm', line: 'Clear brown broth, straight noodles, one sheet of seaweed standing up.' },
    { name: 'MISO RAMEN', price: 9, icon: 'noodles', kind: 'food', stam: 36, effect: 'warm', line: 'Thicker, sweeter, with a knob of butter melting in the middle of it.' },
    { name: 'TONKOTSU RAMEN', price: 9, icon: 'noodles', kind: 'food', stam: 38, effect: 'warm', line: 'Pork bones boiled for a day and a half. You will smell of it later.' },
    { name: 'EXTRA NOODLES', price: 2, icon: 'noodles', kind: 'food', stam: 12, line: 'You shout one word at the counter and more arrive. Perfect system.' },
    { name: 'GYOZA, SIX', price: 4, icon: 'dumpling', kind: 'food', stam: 18, effect: 'warm', line: 'Crisped on one side only, stuck together in a sheet you break.' },
    { name: 'COLD BEER', price: 5, icon: 'bottle', kind: 'drink', stam: 6, effect: 'luck', line: 'At eleven in the morning, local time, which is not your time.' },
  ],
  yoshinobug: [
    { name: 'BEEF BOWL, REGULAR', price: 5, icon: 'noodles', kind: 'food', stam: 26, effect: 'warm', line: 'Ninety seconds from order to bowl. Sweet onions, thin beef, rice.' },
    { name: 'BEEF BOWL, LARGE', price: 7, icon: 'noodles', kind: 'food', stam: 34, effect: 'warm', line: 'The same, but you will not need dinner, and you know it now.' },
    { name: 'MISO SOUP', price: 1, icon: 'noodles', kind: 'food', stam: 6, effect: 'warm', line: 'Comes in a plastic bowl with a lid. Drink it straight from the rim.' },
    { name: 'RAW EGG', price: 1, icon: 'food', kind: 'food', stam: 8, line: 'You crack it over the top. Trust the building. It is fine.' },
    { name: 'PICKLES', price: 1, icon: 'food', kind: 'food', stam: 4, effect: 'cure', line: 'Bright red, aggressively crunchy, and somehow necessary.' },
    { name: 'SET WITH SOUP AND EGG', price: 8, icon: 'food', kind: 'food', stam: 38, effect: 'warm', line: 'The whole tray. The correct order. Say the word and point.' },
  ],
  nigirinymph: [
    { name: 'SALMON, TWO PIECES', price: 3, icon: 'dumpling', kind: 'food', stam: 12, line: 'Orange plate. The cheapest belt on the belt, and still good.' },
    { name: 'TUNA, TWO PIECES', price: 4, icon: 'dumpling', kind: 'food', stam: 13, line: 'Red plate. You watch it go past twice before you commit.' },
    { name: 'EGG, ONE PIECE', price: 2, icon: 'dumpling', kind: 'food', stam: 8, line: 'Sweet omelette on rice, tied with a belt of seaweed. A test dish.' },
    { name: 'PRAWN, TWO PIECES', price: 4, icon: 'dumpling', kind: 'food', stam: 13, line: 'Comes with the tails still on, pointing at you, slightly accusing.' },
    { name: 'FATTY TUNA, ONE PIECE', price: 7, icon: 'dumpling', kind: 'food', stam: 16, effect: 'luck', line: 'Gold plate. Thirty seconds of your life that you will refer back to.' },
    { name: 'MISO WITH CLAMS', price: 3, icon: 'noodles', kind: 'food', stam: 11, effect: 'warm', line: 'There is a hot water tap at the seat. Powder, cup, done.' },
  ],
  hoppersoba: [
    { name: 'PLAIN SOBA', price: 4, icon: 'noodles', kind: 'food', stam: 20, effect: 'warm', line: 'Buy the ticket, hand it over, eat standing up, leave. Four minutes.' },
    { name: 'TEMPURA SOBA', price: 6, icon: 'noodles', kind: 'food', stam: 26, effect: 'warm', line: 'The batter dissolves into the broth and that is the whole point of it.' },
    { name: 'FOX UDON', price: 5, icon: 'noodles', kind: 'food', stam: 24, effect: 'warm', line: 'Fat white noodles under a sweet sheet of fried tofu.' },
    { name: 'RICE BALL, ANY', price: 2, icon: 'dumpling', kind: 'food', stam: 9, line: 'From a basket on the counter. You pick it up. Nobody checks.' },
  ],
  viedeflea: [
    { name: 'CURRY BREAD', price: 3, icon: 'bread', kind: 'food', stam: 18, effect: 'warm', line: 'Deep-fried, filled with yesterday curry, and improved by that.' },
    { name: 'MELON BREAD', price: 3, icon: 'bread', kind: 'food', stam: 14, effect: 'sugar', line: 'The crackle lid, the soft inside, the crumbs down your front.' },
    { name: 'EGG SANDWICH', price: 4, icon: 'bread', kind: 'food', stam: 16, line: 'Crusts off, corners square, a little too much mayonnaise. Correct.' },
    { name: 'CROISSANT', price: 3, icon: 'bread', kind: 'food', stam: 12, effect: 'warm', line: 'French name, Japanese bakery, absolutely no complaints.' },
    { name: 'RED BEAN BUN', price: 3, icon: 'bread', kind: 'food', stam: 15, effect: 'sugar', line: 'Sweet paste in the middle, a sesame seed navel on the top.' },
    { name: 'ICED COFFEE', price: 3, icon: 'coffee', kind: 'drink', stam: 8, line: 'Comes in a cup with the bakery logo and a lid that never fits.' },
  ],

  // ---- convenience and one-coin ----
  sixeleven: [
    { name: 'EGG SANDWICH', price: 3, icon: 'bread', kind: 'food', stam: 14, line: 'The rival to the other one. This is a genuine national argument.' },
    { name: 'PORK BUN, HOT CASE', price: 2, icon: 'dumpling', kind: 'food', stam: 14, effect: 'warm', line: 'From the steamer by the till. Handed over in a paper square.' },
    { name: 'ODEN, THREE PIECES', price: 4, icon: 'noodles', kind: 'food', stam: 20, effect: 'warm', line: 'You point at a vat. What comes out is a surprise and it is good.' },
    { name: 'CANNED COFFEE', price: 2, icon: 'coffee', kind: 'drink', stam: 8, effect: 'warm', line: 'Short, sweet, and the can itself is the reason to buy it.' },
    { name: 'ICE CREAM BAR', price: 2, icon: 'dango', kind: 'food', stam: 7, effect: 'sugar', line: 'From the chest freezer with the sticky lid. Vanilla, always.' },
    { name: 'POCKET BATTERY', price: 9, icon: 'amp', kind: 'item', effect: 'power', line: 'Heavier than the phone it charges. Still worth carrying.' },
    { name: 'CLEAR UMBRELLA', price: 6, icon: 'net', kind: 'item', effect: 'rain', line: 'The same one as everywhere. There is only the one design.' },
  ],
  daizo: [
    { name: 'NOTEBOOK', price: 1, icon: 'book', kind: 'item', effect: 'read', line: 'Ruled, stapled, and about to hold every setlist you write.' },
    { name: 'PEN, THREE PACK', price: 1, icon: 'pick', kind: 'item', line: 'Black, blue, red. You will lose the red one first.' },
    { name: 'PHONE STAND', price: 1, icon: 'permit', kind: 'item', line: 'Folds flat. Holds the phone up in a capsule where there is no shelf.' },
    { name: 'TOWEL', price: 1, icon: 'boots', kind: 'item', effect: 'clean', line: 'Small, thin, and the only towel the public baths expect you to bring.' },
    { name: 'EAR PLUGS', price: 1, icon: 'earplugs', kind: 'gear', effect: 'gear', line: 'Foam. Orange. Keeps a dormitory from ending your run.' },
    { name: 'GUITAR PICKS, SIX', price: 1, icon: 'pick', kind: 'gear', effect: 'gear', line: 'Too thin, slightly wrong, and completely acceptable for one coin.' },
    { name: 'FOLDING BAG', price: 1, icon: 'bag', kind: 'item', line: 'Packs down to a fist. For the day you buy more than you can hold.' },
    { name: 'SNACK, ANY', price: 1, icon: 'food', kind: 'food', stam: 6, effect: 'sugar', line: 'There is a whole wall of it and every bag costs the same coin.' },
  ],

  // ---- things you carry rather than eat ----
  uniqlarva: [
    { name: 'PLAIN T-SHIRT', price: 9, icon: 'cape', kind: 'item', effect: 'wear', line: 'White, cotton, and the first clean thing you have worn in two days.' },
    { name: 'SOCKS, THREE PAIRS', price: 6, icon: 'boots', kind: 'item', effect: 'wear', line: 'Sold in a plastic sleeve. The single best purchase of the trip.' },
    { name: 'THERMAL TOP', price: 12, icon: 'cape', kind: 'item', effect: 'warm', line: 'Thin enough to wear under anything. Tokyo in the evening is colder than it looks.' },
    { name: 'LIGHT DOWN VEST', price: 29, icon: 'cape', kind: 'item', effect: 'warm', line: 'Packs into its own pocket, which delights you more than it should.' },
    { name: 'CAP', price: 10, icon: 'boots', kind: 'item', effect: 'wear', line: 'For the mornings when the hair is not going to happen.' },
  ],
  mugi: [
    { name: 'GEL PEN, 0.38', price: 2, icon: 'pick', kind: 'item', line: 'Writes finer than anything you own. You will buy nine more.' },
    { name: 'PLAIN NOTEBOOK', price: 3, icon: 'book', kind: 'item', effect: 'read', line: 'Brown cover, no lines, no logo, a slightly holy object.' },
    { name: 'TRAVEL TOOTHBRUSH SET', price: 4, icon: 'key', kind: 'item', effect: 'clean', line: 'Folds in half and lives in a tube. Beige, obviously.' },
    { name: 'NECK PILLOW', price: 14, icon: 'cape', kind: 'item', effect: 'warm', line: 'Too late for the flight. Just in time for the overnight bus.' },
    { name: 'AROMA STICKS', price: 8, icon: 'lantern', kind: 'item', effect: 'luck', line: 'Cedar. Makes a capsule smell like somewhere that meant to smell of something.' },
    { name: 'PACKING CUBES, TWO', price: 11, icon: 'bag', kind: 'item', line: 'Will not create more space, but they will lie to you convincingly.' },
  ],
  kinokubugiya: [
    { name: 'POCKET PHRASEBOOK', price: 9, icon: 'book', kind: 'item', effect: 'read', line: 'Has a page for renting a flat and none for asking for a gig.' },
    { name: 'TOKYO STREET ATLAS', price: 6, icon: 'map', kind: 'item', effect: 'read', line: 'Paper, folded wrong by a previous customer, still more use than the phone.' },
    { name: 'MANGA, VOLUME ONE', price: 5, icon: 'book', kind: 'item', effect: 'read', line: 'You cannot read a word. The pictures carry you eleven stops.' },
    { name: 'MUSIC MONTHLY', price: 7, icon: 'poster', kind: 'item', effect: 'read', line: 'A listings section in the back with every small bar in the city in it.' },
    { name: 'BLANK STAVE PAD', price: 4, icon: 'book', kind: 'gear', effect: 'gear', line: 'Twelve staves a page. Somewhere to put the thing you heard on the plane.' },
    { name: 'FINE TIP MARKER', price: 3, icon: 'pick', kind: 'item', line: 'For writing a set list on your hand, which is the traditional method.' },
  ],
  biccricket: [
    { name: 'EARPHONES, WIRED', price: 12, icon: 'headphones', kind: 'gear', effect: 'gear', line: 'Wired, because wireless ones die exactly when you need them.' },
    { name: 'CHARGER BRICK', price: 14, icon: 'amp', kind: 'item', effect: 'power', line: 'Fast charge, two ports, and a plug shape that fits this country.' },
    { name: 'TRAVEL SIM CARD', price: 18, icon: 'ticket', kind: 'item', effect: 'power', line: 'Ten days of data. The assistant fits it for you and hands the tray back.' },
    { name: 'CLIP-ON TUNER', price: 8, icon: 'metronome', kind: 'gear', effect: 'gear', line: 'Clamps to the headstock. Goes green. The cheapest confidence available.' },
    { name: 'INSTRUMENT CABLE, 3M', price: 11, icon: 'strings', kind: 'gear', effect: 'gear', line: 'Long enough for a small stage, short enough to coil in one hand.' },
    { name: 'SPARE STRINGS', price: 9, icon: 'strings', kind: 'gear', effect: 'gear', line: 'One set. You will break the G string on the second night. Everyone does.' },
  ],
  carapace: [
    { name: 'REPLACEMENT WHEEL', price: 12, icon: 'permit', kind: 'item', line: 'Fitted at the counter in four minutes while you stand there holding a coffee.' },
    { name: 'LUGGAGE STRAP', price: 8, icon: 'strings', kind: 'item', line: 'Bright orange. So it comes round the belt already looking like yours.' },
    { name: 'SOFT CASE COVER', price: 16, icon: 'bag', kind: 'gear', effect: 'gear', line: 'Padded, for an instrument case that has had a bad flight.' },
    { name: 'NAME TAG', price: 3, icon: 'permit', kind: 'item', line: 'You write your name on a card and it never falls off. Two dollars of certainty.' },
    { name: 'FOLDING DUFFEL', price: 19, icon: 'bag', kind: 'item', line: 'For the way back, when you have more than you arrived with.' },
  ],

  // ---- the counters that are not shops ----
  travelarva: [
    { name: 'CHANGE 50 DOLLARS', price: 50, icon: 'money', kind: 'item', effect: 'luck', line: 'The rate is poor. It is that or arrive in a city with no coins.' },
    { name: 'CHANGE 100 DOLLARS', price: 100, icon: 'money', kind: 'item', effect: 'luck', line: 'A better rate above a hundred, which is how they get you there.' },
    { name: 'TRANSPORT CARD, LOADED', price: 12, icon: 'ticket', kind: 'item', effect: 'luck', line: 'A plastic card with a penguin on it. It opens every gate in the city.' },
  ],
  matsumoth: [
    { name: 'FACE MASK, SEVEN PACK', price: 4, icon: 'permit', kind: 'item', effect: 'cure', line: 'Everyone wears one. Nobody stares at you on the train any more.' },
    { name: 'THROAT LOZENGES', price: 3, icon: 'dango', kind: 'item', effect: 'voice', line: 'Honey and something medical. Buys your voice one extra song.' },
    { name: 'HAND CREAM', price: 4, icon: 'bottle', kind: 'item', effect: 'clean', line: 'Aeroplane air takes the skin off your knuckles. This puts it back.' },
    { name: 'SHEET MASK, FIVE', price: 5, icon: 'permit', kind: 'item', effect: 'clean', line: 'Ten minutes lying flat with a cold paper face on. Restorative.' },
    { name: 'VITAMIN DRINK', price: 4, icon: 'bottle', kind: 'drink', stam: 14, effect: 'cure', line: 'A tiny brown bottle. Tastes medicinal because it nearly is.' },
    { name: 'COOLING PATCHES', price: 3, icon: 'permit', kind: 'item', effect: 'cure', line: 'Stick one on your forehead. Ridiculous. Works.' },
  ],
  pollen: [
    { name: 'PAINKILLERS', price: 5, icon: 'pill', kind: 'item', effect: 'cure', line: 'For the headache that starts about now and lasts until you sleep.' },
    { name: 'EYE DROPS', price: 4, icon: 'bottle', kind: 'item', effect: 'cure', line: 'Eleven hours of cabin air, undone in two drops per side.' },
    { name: 'BLISTER PLASTERS', price: 5, icon: 'permit', kind: 'item', effect: 'cure', line: 'The gel ones. Expensive, and worth every cent by this evening.' },
    { name: 'SLEEP AID', price: 6, icon: 'pill', kind: 'item', effect: 'cure', line: 'The pharmacist asks what time zone you came from and nods slowly.' },
    { name: 'THROAT SPRAY', price: 6, icon: 'bottle', kind: 'item', effect: 'voice', line: 'Tastes of pine. Singers swear by it. Doctors say nothing.' },
  ],

  // ---- the ones you buy for other people ----
  dutyfly: [
    { name: 'ROYAL JELLY GOLD', price: 9, icon: 'bottle', kind: 'drink', stam: 16, effect: 'sugar', line: 'Six vitamins, one of them real, as seen on the seat-back for eleven hours.' },
    { name: 'DF MODEL AIRCRAFT', price: 24, icon: 'funko', kind: 'item', effect: 'gift', line: 'Navy and gold, 1:200, in a box that will not survive your bag.' },
    { name: 'DF PLAYING CARDS', price: 6, icon: 'ticket', kind: 'item', effect: 'gift', line: 'The dragonfly on the back of all fifty-two. Genuinely quite nice.' },
    { name: 'NECK PILLOW', price: 14, icon: 'cape', kind: 'item', effect: 'warm', line: 'Sold at the end of the flight, which tells you everything about airports.' },
    { name: 'MATCHA CHOCOLATE, TWELVE', price: 9, icon: 'food', kind: 'food', stam: 10, effect: 'gift', line: 'The flavour you cannot get at home, in a box built for a suitcase.' },
    { name: 'WHISKY, SINGLE MALT', price: 48, icon: 'bottle', kind: 'item', effect: 'gift', line: 'In a wooden box, in a bag they seal, for a person you have not met yet.' },
  ],
  tokyobanant: [
    { name: 'BANANT CAKES, FOUR', price: 7, icon: 'bread', kind: 'food', stam: 12, effect: 'gift', line: 'Sponge, custard, and a face printed on every single one.' },
    { name: 'BANANT CAKES, EIGHT', price: 12, icon: 'bread', kind: 'food', stam: 14, effect: 'gift', line: 'The box everyone at home has already seen and still wants.' },
    { name: 'CHOCOLATE BANANT, EIGHT', price: 13, icon: 'bread', kind: 'food', stam: 14, effect: 'gift', line: 'The variant. Bought by people trying to seem thoughtful.' },
    { name: 'ONE, FOR NOW', price: 2, icon: 'bread', kind: 'food', stam: 8, effect: 'sugar', line: 'They sell singles by the till precisely because of people like you.' },
  ],
  roaches: [
    { name: 'FRESH CHOCOLATE, MILK', price: 14, icon: 'food', kind: 'food', stam: 16, effect: 'gift', line: 'Cut into squares, dusted in cocoa, and dead within a day outside a fridge.' },
    { name: 'FRESH CHOCOLATE, BITTER', price: 14, icon: 'food', kind: 'food', stam: 16, effect: 'gift', line: 'The one the staff recommend, quietly, when you look uncertain.' },
    { name: 'CHOCOLATE POTATO CHIPS', price: 10, icon: 'food', kind: 'food', stam: 12, effect: 'gift', line: 'Half dipped, half salt. Should not work. Has worked since 1976.' },
    { name: 'SINGLE BAR', price: 5, icon: 'food', kind: 'food', stam: 9, effect: 'sugar', line: 'For eating on the kerb outside while waiting for a car.' },
    { name: 'ICE PACK', price: 1, icon: 'permit', kind: 'item', effect: 'luck', line: 'They offer it before you ask, and they are right to.' },
  ],

  // ---- not in this building at all ----
  // AMP OFF is a second-hand shop on a Tokyo side street, and js/scenes/street2.js
  // carries its own row for it. Stock is looked up by id, so the shelf can live
  // here with all the other shelves instead of being stranded in a scene file.
  ampoff: [
    { name: 'PATCH CABLE, USED', price: 5, icon: 'strings', kind: 'gear', effect: 'gear', line: 'Coiled by somebody who knew how. It has been somewhere.' },
    { name: 'STRINGS, MIXED GAUGES', price: 6, icon: 'strings', kind: 'gear', effect: 'gear', line: 'An opened packet with four left in it, sold at four fifths of the price.' },
    { name: 'CLIP TUNER, SECONDHAND', price: 5, icon: 'metronome', kind: 'gear', effect: 'gear', line: 'Somebody else name is worn off the back of it. It still goes green.' },
    { name: 'PICKS IN A TIN', price: 3, icon: 'pick', kind: 'gear', effect: 'gear', line: 'Thirty of them, every one a different shop, every one a different night.' },
    { name: 'GIG BAG, TAPED SEAM', price: 14, icon: 'bag', kind: 'gear', effect: 'gear', line: 'The tape is the same colour as the bag. Somebody cared about that.' },
    { name: 'EAR PLUGS, FOR THE VAN', price: 2, icon: 'earplugs', kind: 'gear', effect: 'gear', line: 'Behind the till, in a jar, next to a sign that says PLEASE.' },
    { name: 'MIC STAND, NO BOOM', price: 16, icon: 'amp', kind: 'gear', effect: 'gear', line: 'Straight, heavy, and it will not creep down in the middle of a song.' },
    { name: 'HEADPHONES, ONE EAR LOUD', price: 9, icon: 'headphones', kind: 'gear', effect: 'gear', line: 'Priced in felt pen at a third, and honest about it on the label.' },
    { name: 'STAVE PAD, HALF USED', price: 2, icon: 'book', kind: 'item', effect: 'read', line: 'Eleven pages of somebody else song, then blank. They sell it anyway.' },
  ],
};

// ---------- the building, left to right ----------
// One strip of world per part of the journey out. x runs from the jetway at
// zero to the kerb at the far end, because that is the only direction anybody
// walks through an arrivals hall. Floor 0 is the upper level, floor 1 the
// ground: two of the strips share an x range and differ only in which floor
// you are standing on, which is what a mezzanine is.
const AIRPORT_ZONES = [
  { id: 'jetway',      name: 'JETWAY',            x0: 0,    x1: 520,  floor: 1, sub: 'THE TUBE OFF THE AIRCRAFT' },
  { id: 'corridor',    name: 'ARRIVALS CORRIDOR', x0: 520,  x1: 1080, floor: 1, sub: 'A VERY LONG CARPET AND A TRAVELATOR' },
  { id: 'immigration', name: 'IMMIGRATION',       x0: 1080, x1: 1720, floor: 1, sub: 'QUEUE HERE. NOT THERE.' },
  { id: 'baggage',     name: 'BAGGAGE RECLAIM',   x0: 1720, x1: 2460, floor: 1, sub: 'CAROUSEL 4 - FLIGHT DF 0808' },
  { id: 'customs',     name: 'CUSTOMS',           x0: 2460, x1: 2800, floor: 1, sub: 'NOTHING TO DECLARE. WALK NORMALLY.' },
  { id: 'arrivals',    name: 'ARRIVALS HALL',     x0: 2800, x1: 3300, floor: 1, sub: 'THE DOORS EVERYBODY WAITS AT' },
  { id: 'concourse',   name: 'CENTRAL CONCOURSE', x0: 3300, x1: 4800, floor: 1, sub: 'GROUND LEVEL - THE USEFUL SHOPS' },
  { id: 'mezzanine',   name: 'THE MEZZANINE',     x0: 3300, x1: 4800, floor: 0, sub: 'UPPER LEVEL - THE EXPENSIVE ONES' },
  { id: 'market',      name: 'MARKET ROW',        x0: 4800, x1: 6100, floor: 1, sub: 'FOOD TO CARRY, NOT TO SIT WITH' },
  { id: 'foodcourt',   name: 'FOOD COURT',        x0: 4800, x1: 6100, floor: 0, sub: 'UPPER LEVEL - TRAYS AND PLASTIC CHAIRS' },
  { id: 'departures',  name: 'DEPARTURES',        x0: 6100, x1: 6800, floor: 0, sub: 'SOMEBODY ELSE IS LEAVING' },
  { id: 'kerb',        name: 'THE KERB',          x0: 6800, x1: 7300, floor: 1, sub: 'GATE 5 IS OUTSIDE AND TO THE RIGHT' },
];
// How long the whole terminal is, so the scene does not have to add it up.
const AIRPORT_W = AIRPORT_ZONES[AIRPORT_ZONES.length - 1].x1;

// ---------- lookups ----------
function shopById(id) {
  for (let i = 0; i < SHOPS.length; i++) if (SHOPS[i].id === id) return SHOPS[i];
  return null;
}
function shopsForZone(zoneId) {
  const out = [];
  for (let i = 0; i < SHOPS.length; i++) if (SHOPS[i].zone === zoneId) out.push(SHOPS[i]);
  return out;
}
function shopStockFor(id) { return SHOP_STOCK[id] || []; }
function airportZoneById(id) {
  for (let i = 0; i < AIRPORT_ZONES.length; i++) if (AIRPORT_ZONES[i].id === id) return AIRPORT_ZONES[i];
  return null;
}
// Space a zone's shops evenly across it. Shops are the width they say they
// are; whatever is left over becomes the gaps between them, which is how a
// real concourse ends up with a bench in one place and nothing in another.
function airportShopLayout(zoneId, opts) {
  const o = opts || {}, zone = airportZoneById(zoneId);
  if (!zone) return [];
  const list = shopsForZone(zoneId);
  if (!list.length) return [];
  const pad = o.pad != null ? o.pad : 24;
  const span = (zone.x1 - zone.x0) - pad * 2;
  let total = 0;
  for (let i = 0; i < list.length; i++) total += list[i].w;
  const gap = Math.max(o.minGap != null ? o.minGap : 6, (span - total) / (list.length + 1));
  const out = [];
  let x = zone.x0 + pad + gap;
  for (let i = 0; i < list.length; i++) {
    out.push({ shop: list[i], id: list[i].id, x: Math.round(x + list[i].w / 2), left: Math.round(x), w: list[i].w, floor: zone.floor, zone: zoneId });
    x += list[i].w + gap;
  }
  return out;
}
// Every shop in the building, already placed. The terminal scene can walk
// this once and turn each row into a prop.
function airportAllShops() {
  let out = [];
  for (let i = 0; i < AIRPORT_ZONES.length; i++) out = out.concat(airportShopLayout(AIRPORT_ZONES[i].id));
  return out;
}

// ---------- everybody else in the building ----------
// Templates, not instances: the scene decides where each one stands and how
// many copies of it there are. `walk` is how wide a patch they pace, in
// pixels, or nothing at all for the ones who have given up on moving.
// `carry` is a key into drawSideCarry: case bag tray suitcase phone coffee umbrella.
const AIRPORT_PEOPLE = [
  {
    id: 'guard', name: 'SECURITY', voice: 'guard', walk: 70, zones: ['immigration', 'customs', 'concourse'],
    tag: [
      'PLEASE KEEP MOVING TO THE LEFT.',
      'THE LEFT. YES. THAT LEFT.',
      'ENJOY YOUR STAY IN JAPAN.',
    ],
  },
  {
    id: 'cleaner', name: 'CLEANER', voice: 'oldman', walk: 140, zones: ['concourse', 'foodcourt', 'baggage'],
    tag: [
      'I DO THIS FLOOR FOUR TIMES A DAY.',
      'IT IS NEVER DIRTY. THAT IS NOT THE POINT.',
    ],
  },
  {
    id: 'tourist', name: 'LOST TOURIST', voice: 'clerk', carry: 'suitcase', walk: 110, zones: ['concourse', 'arrivals'],
    tag: [
      'EXCUSE ME. IS THIS THE TRAIN?',
      'THIS IS A SHOP. I KNOW. I KNOW.',
      'I HAVE WALKED PAST YOU THREE TIMES.',
    ],
  },
  {
    id: 'guide', name: 'TOUR GUIDE', voice: 'hostess', carry: 'umbrella', walk: 180, zones: ['arrivals', 'concourse'],
    tag: [
      'GROUP 12! GROUP 12, THIS WAY!',
      'THE FLAG IS YELLOW. PLEASE LOOK AT THE FLAG.',
      'WE HAVE FIFTY MINUTES AND NINE SHOPS.',
    ],
  },
  {
    id: 'sleeper', name: 'BUSINESS BUG', voice: 'oldman', carry: 'case', pose: 'sleep', zones: ['concourse', 'departures'],
    tag: [
      '...',
      'HE IS ASLEEP SITTING UP, IN A SUIT, AT NOON.',
      'HIS COFFEE HAS GONE COLD BESIDE HIM.',
    ],
  },
  {
    id: 'dad', name: 'DAD', voice: 'driver', carry: 'case', walk: 60, zones: ['baggage', 'arrivals'],
    tag: [
      'IT WILL COME ROUND. IT ALWAYS COMES ROUND.',
      'IT HAS NOT COME ROUND.',
    ],
  },
  {
    id: 'mum', name: 'MUM', voice: 'hostess', carry: 'bag', walk: 50, zones: ['baggage', 'arrivals'],
    tag: [
      'HOLD YOUR BROTHER. HOLD HIM.',
      'WE ARE NOT BUYING ANYTHING IN THIS AIRPORT.',
    ],
  },
  {
    id: 'smallone', name: 'THE SMALL ONE', voice: 'kid', walk: 90, zones: ['baggage', 'arrivals', 'concourse'],
    tag: [
      'THAT ONE IS OURS! THAT ONE! NO.',
      'I WANT THE BIG BEAR.',
      'ARE WE THERE. ARE WE THERE NOW.',
    ],
  },
  {
    id: 'crew', name: 'DF CREW', voice: 'hostess', carry: 'suitcase', walk: 420, zones: ['corridor', 'concourse', 'departures'],
    tag: [
      'THANK YOU FOR FLYING DRAGON FLY.',
      'WE LAND AGAIN AT SIX. SAME AIRCRAFT.',
      'SHE IS THE ONE WHO ASKED YOU ABOUT THE CHICKEN.',
    ],
  },
  {
    id: 'purser', name: 'THE PURSER', voice: 'captain', carry: 'case', walk: 400, zones: ['corridor', 'departures'],
    tag: [
      'ELEVEN HOURS. NOT A BAD ONE.',
      'THE CAPTAIN TALKS TOO MUCH. HE KNOWS.',
    ],
  },
  {
    id: 'monk', name: 'A MONK', voice: 'oldman', zones: ['concourse', 'mezzanine'],
    tag: [
      'THE BUILDING IS VERY LOUD AND VERY EMPTY.',
      'BOTH THINGS ARE TRUE AT ONCE. THAT IS FINE.',
    ],
  },
  {
    id: 'handler', name: 'BAGGAGE HANDLER', voice: 'guard', carry: 'bag', walk: 120, zones: ['baggage'],
    tag: [
      'IF IT IS BROKEN, THE DESK IS BEHIND YOU.',
      'IT WAS PROBABLY BROKEN IN LAS VEGAS.',
    ],
  },
  {
    id: 'tout', name: 'TAXI TOUT', voice: 'driver', walk: 80, zones: ['kerb', 'arrivals'],
    tag: [
      'TAXI? TAXI TO TOKYO? VERY FAST.',
      'ONE HUNDRED AND NINETY DOLLARS. VERY FAST.',
      'THE TRAIN IS TWELVE. BUT THE TRAIN IS SLOW.',
    ],
  },
  {
    id: 'oldhusband', name: 'OLD HUSBAND', voice: 'oldman', carry: 'suitcase', walk: 40, zones: ['concourse', 'departures'],
    tag: [
      'SHE PACKED THE CAMERA. I PACKED THE CHARGER.',
      'ONE OF US PACKED WRONG. WE WILL FIND OUT.',
    ],
  },
  {
    id: 'oldwife', name: 'OLD WIFE', voice: 'clerk', carry: 'bag', walk: 40, zones: ['concourse', 'departures'],
    tag: [
      'FORTY-ONE YEARS AND HE STILL WALKS TOO FAST.',
      'SIT DOWN. THE GATE IS NOT EVEN UP YET.',
    ],
  },
  {
    id: 'student', name: 'STUDENT', voice: 'kid', carry: 'phone', walk: 60, zones: ['foodcourt', 'concourse'],
    tag: [
      'THE WIFI IS FREE FOR THIRTY MINUTES.',
      'THEN IT ASKS FOR YOUR PASSPORT NUMBER.',
      'I HAVE USED FOUR PASSPORT NUMBERS TODAY.',
    ],
  },
  {
    id: 'mascot', name: 'NARI-KUN', voice: 'robot', carry: 'tray', walk: 100, zones: ['market', 'concourse'],
    tag: [
      'PLEASE ENJOY A FREE SAMPLE OF CHEESE TART.',
      '[ THE HEAD DOES NOT MOVE WHEN THE VOICE DOES ]',
      'IT IS VERY HOT INSIDE NARI-KUN TODAY.',
    ],
  },
  {
    id: 'ground', name: 'GROUND STAFF', voice: 'clerk', zones: ['arrivals', 'departures', 'concourse'],
    tag: [
      'WELCOME TO JAPAN. THE EXIT IS STRAIGHT ON.',
      '[ SHE BOWS. YOU BOW BACK, BADLY. ]',
      'PLEASE TAKE CARE. IT IS RAINING OUTSIDE.',
    ],
  },
  {
    id: 'greeter', name: 'A NAME BOARD', voice: 'driver', zones: ['arrivals'],
    tag: [
      'HE HAS HELD THAT SIGN UP FOR FORTY MINUTES.',
      'THE NAME ON IT IS NOT YOURS.',
      'SOMEBODY IS ABOUT TO BE VERY GLAD TO SEE HIM.',
    ],
  },
  {
    id: 'photographer', name: 'WAITING', voice: 'you', carry: 'coffee', zones: ['arrivals'],
    tag: [
      'SHE HAS CHECKED THE BOARD NINE TIMES.',
      'THE FLIGHT LANDED. THE DOORS HAVE NOT OPENED.',
    ],
  },
];
// Which of them can plausibly be standing in a given strip of the building.
function airportPeopleForZone(zoneId) {
  const out = [];
  for (let i = 0; i < AIRPORT_PEOPLE.length; i++) {
    const p = AIRPORT_PEOPLE[i];
    if (!p.zones || p.zones.indexOf(zoneId) >= 0) out.push(p);
  }
  return out;
}
