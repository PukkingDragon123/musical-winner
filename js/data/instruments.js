// ---------- Instruments ----------
'use strict';
const LANE_COLORS = ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff', '#ff9f68'];
// Colour per kit piece, keyed by piece name rather than by lane, because how
// many pieces you own changes as you climb the ladder.
const PIECE_COLORS = {
  bucket: '#c9c2b0', pot: '#9aa2ab', pan: '#6e7178', crate: '#a8783f',
  kick: '#e0563f', tom: '#e0563f', floor: '#c14a35', snare: '#c2c8d6',
  hat: '#d8c060', crash: '#f2cf4a', ride: '#e8bf46',
};
// What each piece actually sounds like.
const PIECE_VOICE = {
  bucket: 'bucket', pot: 'pot', pan: 'ka', crate: 'crate',
  kick: 'bigkick', tom: 'tom', floor: 'floortom', snare: 'snare',
  hat: 'hat', crash: 'crash', ride: 'ride',
};
// Roughly where each piece sits in pitch, so a melody contour can be mapped
// onto whatever pieces you happen to own.
const PIECE_PITCH = {
  kick: 0, bucket: 0, floor: 1, crate: 1, tom: 2, pot: 3, snare: 3, pan: 4, hat: 4, ride: 5, crash: 6,
};
const PIECE_LABEL = {
  bucket: 'BUCKET', pot: 'POT', pan: 'PAN', crate: 'CRATE',
  kick: 'KICK', tom: 'TOM', floor: 'FLOOR', snare: 'SNARE',
  hat: 'HAT', crash: 'CRASH', ride: 'RIDE',
};
// ---------- The kit ladder ----------
// Busking on day one is a paint bucket, a stock pot and one stick. Two things
// to hit. Every tier bolts on another piece until, at the top, you are sitting
// behind a real five-piece and the charts finally use all of it.
const KIT_LADDER = [
  null,
  { pieces: ['bucket', 'pot'],                            name: 'BUCKET & POT',  junk: true },
  { pieces: ['bucket', 'pot', 'crate'],                   name: 'STREET KIT',    junk: true },
  { pieces: ['kick', 'snare', 'hat', 'tom'],              name: 'WORKING KIT' },
  { pieces: ['kick', 'snare', 'hat', 'tom', 'crash'],     name: 'STAGE KIT' },
  { pieces: ['kick', 'snare', 'hat', 'tom', 'crash'],     name: 'SIGNATURE KIT', chrome: true },
];
const KIT_COLORS = KIT_LADDER[4].pieces.map(p => PIECE_COLORS[p]);
const INSTRUMENTS = {
  guitar:     { name: 'Guitar', game: 'ear', view: 'fret', voice: 'guitar', price: 40, tipMult: 1.0, family: 'strings',
                frets: 5, keys: [], keyNames: [],
                desc: 'A real neck. Listen to the phrase, then find it on the fretboard and play it back.' },
  bass:       { name: 'Bass', game: 'ear', view: 'fret', voice: 'bass', price: 35, tipMult: 0.9, family: 'strings',
                frets: 5, tuning: [28, 33, 38, 43], keys: [], keyNames: [],
                desc: 'Four thick strings. Hear the line, then walk it back yourself.' },
  piano:      { name: 'Keyboard', game: 'ear', view: 'keys', voice: 'piano', price: 80, tipMult: 1.3, family: 'keys',
                octaves: 2, keys: [], keyNames: [],
                desc: 'Real keys. The band plays you a phrase, then you play it back from memory.' },
  tambourine: { name: 'Tambourine', game: 'lanes', lanes: 1, keys: ['Space'], keyNames: ['SPACE'], voice: 'tambourine', price: 12, tipMult: 0.7, family: 'percussion',
                desc: 'One lane. Hit the beat and shake the hold notes. Humble but honest.' },
  drums:      { name: 'Drum Kit', game: 'lanes', view: 'kit', lanes: 5, keys: ['KeyD', 'KeyF', 'Space', 'KeyJ', 'KeyK'], keyNames: ['D', 'F', 'SP', 'J', 'K'],
                pieces: KIT_LADDER[4].pieces, padNames: KIT_LADDER[4].pieces.map(p => PIECE_LABEL[p]), drumFor: KIT_LADDER[4].pieces,
                voice: null, price: 60, tipMult: 1.1, family: 'percussion', noPads: true,
                desc: 'Hit the drum itself, right on the beat. Start on a bucket and a pot; end up behind a five-piece.' },
  sax:        { name: 'Saxophone', game: 'wind', keys: ['Space'], keyNames: ['SPACE'], voice: 'sax', price: 55, tipMult: 1.15, family: 'horns',
                desc: 'Hold SPACE through each phrase and release on the end marker. Watch your breath.' },
  trumpet:    { name: 'Trumpet', game: 'valves', keys: ['KeyJ', 'KeyK', 'KeyL'], keyNames: ['J', 'K', 'L'], voice: 'trumpet', price: 50, tipMult: 1.1, family: 'horns',
                desc: 'Press the lit valve combination together, right on the beat.' },
  violin:     { name: 'Violin', game: 'bow', keys: ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'], keyNames: ['UP', 'DOWN'], voice: 'violin', price: 65, tipMult: 1.2, family: 'strings',
                desc: 'Bow UP or DOWN on the marker. Hold the long bows.' },
  // NPC-only
  mic:        { name: 'Vocals', game: 'npc', keys: [], keyNames: [], voice: 'vox', price: 0, tipMult: 1.4, family: 'voice', desc: 'A voice that fills stadiums.' },
  harmonica:  { name: 'Harmonica', game: 'npc', keys: [], keyNames: [], voice: 'harmonica', price: 0, tipMult: 0.9, family: 'horns', desc: 'Blues in a pocket.' },
  triangle:   { name: 'Triangle', game: 'npc', keys: [], keyNames: [], voice: 'tambourine', price: 0, tipMult: 0.6, family: 'percussion', desc: 'Ding.' },
  keytar:     { name: 'Keytar', game: 'npc', keys: [], keyNames: [], voice: 'organ', price: 0, tipMult: 1.2, family: 'keys', desc: 'The eighties never ended.' },
};
const PLAYABLE = ['guitar', 'bass', 'piano', 'tambourine', 'drums', 'sax', 'trumpet', 'violin'];
const GENRES = {
  rock:   { name: 'Rock', color: '#ff5a5a', bpm: [116, 140], dens: 1.15, backing: 'rock' },
  funk:   { name: 'Funk', color: '#ffb340', bpm: [98, 116], dens: 1.1, backing: 'funk', syncopated: true },
  jazz:   { name: 'Jazz', color: '#5bc0ff', bpm: [90, 120], dens: 0.95, backing: 'jazz', swing: true },
  ballad: { name: 'Ballad', color: '#c58bff', bpm: [72, 92], dens: 0.8, backing: 'ballad', holds: true },
  folk:   { name: 'Folk', color: '#6be585', bpm: [96, 118], dens: 0.9, backing: 'folk' },
};
const GENRE_KEYS = Object.keys(GENRES);
const FIRST_NAMES = ['Benny', 'Rosa', 'Ziggy', 'Mabel', 'Otis', 'Dolores', 'Gus', 'Nina', 'Ferdie', 'Coco', 'Hank', 'Lulu', 'Miles', 'Etta', 'Django', 'Bix', 'Juno', 'Sal', 'Wren', 'Tito', 'Marge', 'Boris', 'Fay', 'Louie', 'Pearl', 'Chester', 'Ivy', 'Rufus', 'Dot'];

// ---------- Gear tiers: the ladder you climb ----------
// A busted instrument is genuinely easier to play and genuinely pays worse.
// Upgrading gives back lanes and money at the same time.
const GEAR_TIERS = [
  null,
  { name: 'BUSTED',    short: 'BUSTED',  pay: 0.55, window: 1.35, laneCut: 2, color: '#8a7a6a', desc: 'Held together with tape. Forgiving, and nobody tips for it.' },
  { name: 'PAWN SHOP', short: 'PAWN',    pay: 0.8,  window: 1.15, laneCut: 1, color: '#9a8a58', desc: 'Second hand and out of tune, but it holds a note.' },
  { name: 'WORKING',   short: 'WORKING', pay: 1.0,  window: 1.0,  laneCut: 0, color: '#5d8c56', desc: 'What a working musician actually plays.' },
  { name: 'PRO',       short: 'PRO',     pay: 1.3,  window: 0.95, laneCut: 0, color: '#3f7fa8', desc: 'Road-ready. Crowds hear the difference.' },
  { name: 'SIGNATURE', short: 'SIGNATURE', pay: 1.7, window: 0.9, laneCut: 0, color: '#8a3a9a', desc: 'Somebody famous had their name put on it.' },
];
function gearTier(q) { return GEAR_TIERS[clamp(Math.round(q || 1), 1, 5)]; }
// The instrument you actually play, once the state of your gear is applied.
function gearInstrument(kind, quality) {
  const base = INSTRUMENTS[kind]; if (!base) return INSTRUMENTS.guitar;
  const t = gearTier(quality);
  // Drums do not lose lanes, they lose *pieces*: the ladder says exactly what
  // you are sitting behind, from a bucket and a pot up to a full five-piece.
  if (kind === 'drums') {
    const q = clamp(Math.round(quality || 1), 1, 5);
    return cached('kit|' + q, () => {
      const rung = KIT_LADDER[q], pieces = rung.pieces;
      const allKeys = ['KeyD', 'KeyF', 'Space', 'KeyJ', 'KeyK'];
      const allNames = ['D', 'F', 'SP', 'J', 'K'];
      // fewer pieces use the middle keys, so your hands never start spread wide
      const pick = []; const n = pieces.length;
      for (let i = 0; i < n; i++) pick.push(Math.round((5 - n) / 2) + i);
      return Object.assign({}, base, {
        lanes: n, pieces, kitName: rung.name, junk: !!rung.junk, chrome: !!rung.chrome,
        keys: pick.map(i => allKeys[i]),
        keyNames: pick.map(i => allNames[i]),
        padNames: pieces.map(p => PIECE_LABEL[p]),
        drumFor: pieces.slice(),
      });
    });
  }
  if (!t.laneCut || !base.lanes || base.lanes <= 2) return base;
  return cached('gear|' + kind + '|' + quality, () => {
    const lanes = Math.max(2, base.lanes - t.laneCut);
    // keep the outer lanes so the shape of the instrument still reads
    const pick = [];
    for (let i = 0; i < lanes; i++) pick.push(Math.round(i * (base.lanes - 1) / (lanes - 1)));
    return Object.assign({}, base, {
      lanes,
      keys: pick.map(i => base.keys[i]),
      keyNames: pick.map(i => base.keyNames[i]),
      padNames: base.padNames ? pick.map(i => base.padNames[i]) : null,
      drumFor: base.drumFor ? pick.map(i => base.drumFor[i]) : null,
    });
  });
}
