// ---------- Venues, boss modifiers, days, story ----------
'use strict';
const VENUES = {
  shotengai: { name: 'Shimokita Shotengai', kind: 'street', styles: ['shitamachi', 'shitamachi', 'showa'], wealth: 1.0, traffic: 1.0, sky: 0.15, banners: true, landmarks: ['tokyotower'] },
  metro:     { name: 'Shibuya Station', kind: 'subway', wealth: 0.85, traffic: 1.8, sky: 0.5 },
  park:      { name: 'Yoyogi Park', kind: 'park', wealth: 1.0, traffic: 0.9, sky: 0.2, landmarks: ['tokyotower', 'skytree'] },
  takeshita: { name: 'Takeshita-dori', kind: 'street', styles: ['kawaii', 'kawaii', 'showa'], wealth: 0.95, traffic: 1.6, sky: 0.3, banners: true, narrow: true },
  scramble:  { name: 'Shibuya Scramble', kind: 'street', styles: ['glass', 'neon', 'glass'], wealth: 1.5, traffic: 2.0, sky: 0.4, screens: true, tall: true, landmarks: ['tokyotower'] },
  yokocho:   { name: 'Golden Gai', kind: 'street', styles: ['showa', 'showa', 'shitamachi'], wealth: 1.1, traffic: 1.2, sky: 0.72, lanterns: true, narrow: true },
  neon:      { name: 'Kabukicho', kind: 'street', styles: ['neon', 'neon', 'glass'], wealth: 1.25, traffic: 1.5, sky: 0.78, signs: true, tall: true },
  akiba:     { name: 'Akihabara', kind: 'street', styles: ['neon', 'kawaii', 'glass'], wealth: 1.2, traffic: 1.4, sky: 0.5, signs: true, screens: true },
  temple:    { name: 'Senso-ji', kind: 'temple', styles: ['temple', 'temple', 'shitamachi'], wealth: 1.15, traffic: 1.3, sky: 0.25, lanterns: true, landmarks: ['skytree'] },
  ginza:     { name: 'Ginza Crossing', kind: 'street', styles: ['glass', 'glass', 'glass'], wealth: 2.0, traffic: 0.9, sky: 0.45, tall: true, landmarks: ['tokyotower'] },
  sakura:    { name: 'Meguro River', kind: 'park', wealth: 1.2, traffic: 1.0, sky: 0.2, sakura: true },
  bayside:   { name: 'Odaiba Waterfront', kind: 'pier', wealth: 1.5, traffic: 1.1, sky: 0.55, landmarks: ['skytree'] },
  skytree:   { name: 'Tokyo Skytree', kind: 'bridge', wealth: 2.4, traffic: 1.0, sky: 0.62 },
  dome:      { name: 'Tokyo Dome', kind: 'stadium', wealth: 3, traffic: 0, sky: 0.9 },
};
const DAY_VENUES = [
  ['shotengai', 'park', 'metro'],
  ['metro', 'shotengai', 'takeshita', 'yokocho'],
  ['takeshita', 'yokocho', 'akiba', 'metro'],
  ['scramble', 'neon', 'akiba', 'temple'],
  ['ginza', 'scramble', 'bayside', 'temple'],
];
const DAY_NAMES = ['Shimokitazawa', 'Shinjuku Nights', 'Harajuku & Akihabara', 'Shibuya Scramble', 'The Skytree'];

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
// ---------- The rival ----------
// The finale is not another street set with a debuff on it. There is somebody
// else on the deck of the Skytree and only one of you is leaving with the
// crowd. They work in three phases and each one changes what they do to you.
const RIVAL = {
  name: 'KUROHANE',
  title: 'THE BLACK MOTH',
  taunts: [
    'You busk. I headline. Watch.',
    'Not bad. Try it with the lights in your eyes.',
    'Then take it. If you can still hear the beat.',
  ],
  phases: [
    { name: 'OVERTURE',  mod: 'rushHour', color: '#ffb340', desc: 'She pulls the whole crowd at once.' },
    { name: 'THE TURN',  mod: 'snob',     color: '#c58bff', desc: 'Nothing but PERFECT moves them now.' },
    { name: 'LAST LIGHT', mod: 'blackout', color: '#404060', desc: 'She kills the house lights.' },
  ],
};

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
      { who: 'buzz', text: 'Fine. If I cannot play the Dome, I will play the street. Every ward of this city. And I will build a band Monarch could only dream of.' },
    ],
  },
  finale: [
    { who: 'buzz', text: 'Five days. Shibuya to Asakusa. And now: the Skytree.' },
    { who: 'monarch', text: 'You again? With... THAT band?' },
    { who: 'buzz', text: 'THIS band. Watch and learn.' },
  ],
};
