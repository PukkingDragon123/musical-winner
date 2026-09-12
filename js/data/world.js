// ---------- Venues, boss modifiers, days, story ----------
'use strict';
const VENUES = {
  corner:    { name: 'Valencia St Corner', kind: 'street', styles: ['victorian', 'pastel', 'victorian'], wealth: 1.0, traffic: 1.0, sky: 0.15, landmarks: ['sutro'] },
  subway:    { name: '16th St BART', kind: 'subway', wealth: 0.85, traffic: 1.7, sky: 0.5 },
  park:      { name: 'Dolores Park', kind: 'park', wealth: 1.0, traffic: 0.9, sky: 0.2, landmarks: ['transamerica', 'sutro'] },
  haight:    { name: 'Haight & Ashbury', kind: 'street', styles: ['pastel', 'pastel', 'victorian'], wealth: 0.9, traffic: 1.3, sky: 0.3 },
  cablecar:  { name: 'Powell St Turnaround', kind: 'street', styles: ['downtown', 'brick', 'victorian'], wealth: 1.3, traffic: 1.2, sky: 0.35, cablecar: true, landmarks: ['transamerica'] },
  chinatown: { name: 'Grant Ave, Chinatown', kind: 'street', styles: ['chinatown', 'chinatown', 'brick'], wealth: 1.1, traffic: 1.3, sky: 0.7, lanterns: true, landmarks: ['transamerica', 'coit'] },
  fidi:      { name: 'Montgomery St', kind: 'street', styles: ['downtown', 'downtown', 'downtown'], wealth: 1.9, traffic: 0.8, sky: 0.45, tall: true, landmarks: ['transamerica'] },
  pier:      { name: 'Pier 39', kind: 'pier', wealth: 1.5, traffic: 1.2, sky: 0.55, landmarks: ['coit'] },
  ferry:     { name: 'Ferry Building', kind: 'pier', wealth: 1.6, traffic: 1.0, sky: 0.25, ferry: true },
  ggpark:    { name: 'Golden Gate Park', kind: 'park', wealth: 1.3, traffic: 1.0, sky: 0.3, ggpark: true },
  bridge:    { name: 'Golden Gate Bridge', kind: 'bridge', wealth: 2.2, traffic: 1.0, sky: 0.6 },
  stadium:   { name: 'Oracle Park', kind: 'stadium', wealth: 3, traffic: 0, sky: 0.9 },
};
const DAY_VENUES = [
  ['corner', 'park', 'subway'],
  ['subway', 'corner', 'haight', 'cablecar'],
  ['chinatown', 'cablecar', 'fidi', 'subway'],
  ['pier', 'ferry', 'fidi', 'chinatown'],
  ['ggpark', 'pier', 'ferry', 'cablecar'],
];
const DAY_NAMES = ['The Mission', 'Downtown', 'Chinatown & Nob Hill', 'The Waterfront', 'Golden Gate'];

// Boss / Big Gig modifiers (shown on the map like Balatro boss blinds)
const BOSS_MODS = {
  fog:      { name: 'Karl the Fog', icon: 'rain', desc: 'Notes fade out before they reach you.', color: '#a0b0c8' },
  rain:     { name: 'The Drizzle', icon: 'rain', desc: 'Hype drains twice as fast.', color: '#5bc0ff' },
  cops:     { name: 'Officer Buzzkill', icon: 'cop', desc: 'The set is cut 30% short. Pays x1.4.', color: '#4060c0' },
  snob:     { name: 'Snob Crowd', icon: 'skull', desc: 'Only PERFECT hits raise hype.', color: '#c58bff' },
  heckler:  { name: 'The Heckler', icon: 'skull', desc: 'Three times as many bomb notes.', color: '#ff5a5a' },
  rushHour: { name: 'Rush Hour', icon: 'event', desc: 'Twice the crowd, but they leave fast.', color: '#ffb340' },
  quake:    { name: 'Tremor', icon: 'event', desc: 'The ground shakes now and then.', color: '#c8703a' },
  blackout: { name: 'Blackout', icon: 'skull', desc: 'Only the bottom of the lanes is lit.', color: '#404060' },
};
const BOSS_MOD_KEYS = Object.keys(BOSS_MODS);

const STORY = {
  bandName: 'MONARCH',
  concert: {
    venue: 'Oracle Park',
    intro: [
      { who: 'monarch', text: 'Forty thousand bugs, Buzz. Forty thousand. Tonight we play the Rhapsody. All six movements.' },
      { who: 'buzz', text: 'Relax, Monarch. I have played it a hundred times.' },
      { who: 'monarch', text: 'You have played it a hundred times in REHEARSAL. Pick who goes on with us. Then do not embarrass me.' },
    ],
    beforeSolo: [
      { who: 'monarch', text: 'Here it comes. The Solo. Nobody in history has landed this live. Make me a believer.' },
    ],
    fail: [
      { who: 'monarch', text: 'STOP. Stop the pyro. Stop everything.' },
      { who: 'monarch', text: 'You had ONE job, Buzz. One solo. Get off my stage.' },
      { who: 'buzz', text: 'That part is IMPOSSIBLE. Nobody can...' },
      { who: 'monarch', text: 'Then nobody plays with me. Security!' },
    ],
    wake: [
      { who: 'buzz', text: '...ow. Where am I? Is that... a bench?' },
      { who: 'buzz', text: 'Right. No band. No gig. Six dollars and a guitar with four strings.' },
      { who: 'buzz', text: 'Fine. If I cannot play stadiums, I will play the streets. Every corner of this city. And I will build a band Monarch could only dream of.' },
    ],
  },
  finale: [
    { who: 'buzz', text: 'Five days. Every corner of San Francisco. And now: the Golden Gate.' },
    { who: 'monarch', text: 'You again? With... THAT band?' },
    { who: 'buzz', text: 'THIS band. Watch and learn.' },
  ],
};
