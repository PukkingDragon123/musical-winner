// ---------- Instruments ----------
'use strict';
const LANE_COLORS = ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff', '#ff9f68'];
const INSTRUMENTS = {
  guitar:     { name: 'Guitar', game: 'lanes', lanes: 4, keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], keyNames: ['D', 'F', 'J', 'K'], voice: 'guitar', price: 40, tipMult: 1.0, family: 'strings',
                desc: 'Four lanes of falling notes. Hold the long ones, catch the gold stars, dodge the bombs.' },
  bass:       { name: 'Bass', game: 'lanes', lanes: 2, keys: ['KeyF', 'KeyJ'], keyNames: ['F', 'J'], voice: 'bass', price: 35, tipMult: 0.9, family: 'strings',
                desc: 'Two fat strings and long slides. Lock in with the drums.' },
  piano:      { name: 'Keyboard', game: 'lanes', lanes: 6, keys: ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'], keyNames: ['S', 'D', 'F', 'J', 'K', 'L'], voice: 'piano', price: 80, tipMult: 1.3, family: 'keys',
                desc: 'Six lanes with two-note chords. For virtuosos.' },
  tambourine: { name: 'Tambourine', game: 'lanes', lanes: 1, keys: ['Space'], keyNames: ['SPACE'], voice: 'tambourine', price: 12, tipMult: 0.7, family: 'percussion',
                desc: 'One lane. Hit the beat and shake the hold notes. Humble but honest.' },
  drums:      { name: 'Taiko Drums', game: 'taiko', keys: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'], keyNames: ['D', 'F', 'J', 'K'], voice: null, price: 60, tipMult: 1.1, family: 'percussion',
                desc: 'Red DON = F or J, blue KA = D or K. Big notes need both hands. Mash the rolls.' },
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
