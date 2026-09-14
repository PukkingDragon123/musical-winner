// ---------- Real music: public-domain melodies + the rock opera ----------
'use strict';
// Melody format: [midi, beats] pairs. midi 0 = rest. Chords: scale degrees per bar (0=I).
// All tunes below are traditional or public domain (pre-1929 / folk).
const TUNES = {
  odeToJoy: { title: 'Ode to Joy', composer: 'Beethoven', genre: 'folk', bpm: 108, key: 60, chords: [0, 0, 4, 0, 0, 0, 4, 0],
    notes: [[64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[64,1.5],[62,.5],[62,2],
            [64,1],[64,1],[65,1],[67,1],[67,1],[65,1],[64,1],[62,1],[60,1],[60,1],[62,1],[64,1],[62,1.5],[60,.5],[60,2]] },
  furElise: { title: 'Fur Elise', composer: 'Beethoven', genre: 'ballad', bpm: 76, key: 57, chords: [0, 4, 0, 4, 0, 4, 0, 0],
    notes: [[76,.5],[75,.5],[76,.5],[75,.5],[76,.5],[71,.5],[74,.5],[72,.5],[69,1],[0,.5],[60,.5],[64,.5],[69,.5],[71,1],[0,.5],[64,.5],[68,.5],[71,.5],[72,1],[0,.5],[64,.5],
            [76,.5],[75,.5],[76,.5],[75,.5],[76,.5],[71,.5],[74,.5],[72,.5],[69,1],[0,.5],[60,.5],[64,.5],[69,.5],[71,1],[0,.5],[64,.5],[72,.5],[71,.5],[69,2]] },
  bumblebee: { title: 'Flight of the Bumblebee', composer: 'Rimsky-Korsakov', genre: 'rock', bpm: 132, key: 57, chords: [0, 0, 4, 4, 0, 0, 4, 0], hard: true,
    notes: [[76,.25],[75,.25],[74,.25],[73,.25],[72,.25],[71,.25],[70,.25],[69,.25],[68,.25],[67,.25],[66,.25],[65,.25],[64,.25],[65,.25],[66,.25],[67,.25],
            [68,.25],[67,.25],[66,.25],[65,.25],[64,.25],[63,.25],[62,.25],[61,.25],[60,.25],[61,.25],[62,.25],[63,.25],[64,.25],[65,.25],[66,.25],[67,.25],
            [68,.25],[69,.25],[70,.25],[71,.25],[72,.25],[71,.25],[70,.25],[69,.25],[68,.25],[67,.25],[66,.25],[65,.25],[64,.25],[63,.25],[62,.25],[61,.25],
            [60,.25],[62,.25],[64,.25],[65,.25],[67,.25],[69,.25],[71,.25],[72,.25],[74,.5],[72,.5],[71,.5],[69,.5]] },
  mountainKing: { title: 'In the Hall of the Mountain King', composer: 'Grieg', genre: 'rock', bpm: 120, key: 57, chords: [0, 0, 4, 4, 0, 0, 4, 0],
    notes: [[57,.5],[59,.5],[60,.5],[62,.5],[64,.5],[60,.5],[64,1],[63,.5],[59,.5],[63,1],[62,.5],[59,.5],[62,1],
            [57,.5],[59,.5],[60,.5],[62,.5],[64,.5],[60,.5],[64,1],[67,.5],[64,.5],[60,.5],[64,.5],[57,2],
            [69,.5],[71,.5],[72,.5],[74,.5],[76,.5],[72,.5],[76,1],[75,.5],[71,.5],[75,1],[74,.5],[71,.5],[74,1],
            [69,.5],[71,.5],[72,.5],[74,.5],[76,.5],[72,.5],[76,1],[79,.5],[76,.5],[72,.5],[76,.5],[69,2]] },
  entertainer: { title: 'The Entertainer', composer: 'Joplin', genre: 'funk', bpm: 104, key: 60, chords: [0, 0, 4, 0, 0, 3, 4, 0],
    notes: [[72,.5],[73,.5],[74,.5],[79,1],[74,.5],[79,1],[74,.5],[79,1.5],
            [72,.5],[73,.5],[74,.5],[79,1],[74,.5],[79,1],[74,.5],[79,1.5],
            [72,.5],[73,.5],[74,.5],[79,1],[74,.5],[79,.5],[76,.5],[77,.5],[74,.5],[72,.5],[71,.5],[69,.5],[67,1],
            [67,.5],[69,.5],[71,.5],[72,1],[74,.5],[76,1],[72,1.5]] },
  canCan: { title: 'Can-Can', composer: 'Offenbach', genre: 'rock', bpm: 136, key: 60, chords: [0, 0, 4, 0, 0, 0, 4, 0],
    notes: [[79,.5],[77,.5],[76,.5],[74,.5],[72,.5],[74,.5],[76,.5],[77,.5],[79,1],[76,1],[72,2],
            [79,.5],[77,.5],[76,.5],[74,.5],[72,.5],[74,.5],[76,.5],[77,.5],[79,1],[76,1],[72,2],
            [76,.5],[77,.5],[79,.5],[77,.5],[76,.5],[74,.5],[72,.5],[71,.5],[72,1],[74,1],[76,2],
            [72,.5],[74,.5],[76,.5],[77,.5],[79,1],[76,1],[72,1],[72,1]] },
  williamTell: { title: 'William Tell Overture', composer: 'Rossini', genre: 'rock', bpm: 140, key: 60, chords: [0, 0, 0, 0, 4, 4, 0, 0],
    notes: [[67,.5],[67,.25],[67,.25],[67,.5],[67,.5],[67,.5],[67,.25],[67,.25],[67,.5],[67,.5],
            [67,.5],[72,.5],[76,.5],[0,.5],[76,.5],[74,.25],[72,.25],[71,.5],[72,1],
            [67,.5],[67,.25],[67,.25],[67,.5],[67,.5],[67,.5],[67,.25],[67,.25],[67,.5],[67,.5],
            [67,.5],[72,.5],[76,.5],[0,.5],[76,.5],[74,.25],[72,.25],[71,.5],[72,1]] },
  habanera: { title: 'Habanera', composer: 'Bizet', genre: 'jazz', bpm: 96, key: 57, chords: [0, 0, 4, 4, 0, 0, 4, 0],
    notes: [[76,1],[75,.5],[74,.5],[73,.5],[72,.5],[71,1],[0,.5],[71,.5],[72,.5],[73,.5],[72,.5],[71,.5],[69,1],
            [76,1],[75,.5],[74,.5],[73,.5],[72,.5],[71,1],[0,.5],[71,.5],[72,.5],[73,.5],[72,.5],[71,.5],[69,1],
            [69,.5],[69,.5],[69,1],[69,.5],[71,.5],[72,1],[74,.5],[76,.5],[77,1],[76,2]] },
  turkishMarch: { title: 'Rondo Alla Turca', composer: 'Mozart', genre: 'funk', bpm: 124, key: 57, chords: [0, 0, 4, 0, 0, 0, 4, 0],
    notes: [[71,.25],[69,.25],[68,.25],[69,.25],[72,1],[74,.25],[72,.25],[71,.25],[72,.25],[76,1],
            [78,.25],[76,.25],[75,.25],[76,.25],[83,.25],[81,.25],[80,.25],[81,.25],[83,.25],[81,.25],[80,.25],[81,.25],[76,1],
            [81,.5],[80,.5],[81,.5],[76,.5],[81,.5],[80,.5],[81,.5],[76,.5],[81,1],[76,1]] },
  saints: { title: 'When the Saints Go Marching In', composer: 'Traditional', genre: 'folk', bpm: 116, key: 60, chords: [0, 0, 0, 0, 4, 4, 0, 0],
    notes: [[60,1],[64,1],[65,1],[67,3],[0,1],[60,1],[64,1],[65,1],[67,3],[0,1],
            [60,1],[64,1],[65,1],[67,2],[64,2],[60,2],[64,2],[62,4],
            [64,1],[64,1],[62,2],[60,2],[60,2],[62,2],[67,2],[67,1],[65,1],[64,2],[60,2]] },
  risingSun: { title: 'House of the Rising Sun', composer: 'Traditional', genre: 'ballad', bpm: 84, key: 57, chords: [0, 2, 3, 5, 0, 2, 4, 4],
    notes: [[69,1.5],[72,.5],[76,1],[77,1],[76,1],[72,1],[69,1],[67,1],[69,2],[0,1],[69,.5],[72,.5],
            [76,1],[77,1],[76,1],[72,1],[81,2],[79,2],[76,1],[72,1],[69,2],
            [76,1],[77,1],[76,1],[72,1],[69,1],[67,1],[69,4]] },
  greensleeves: { title: 'Greensleeves', composer: 'Traditional', genre: 'ballad', bpm: 88, key: 57, chords: [0, 6, 0, 4, 0, 6, 4, 0],
    notes: [[69,1],[72,1.5],[74,.5],[76,1.5],[77,.5],[76,1],[74,1.5],[71,.5],[67,1.5],[69,.5],[71,1],[72,1.5],[69,.5],[69,1],[68,.5],[69,.5],[71,1],[68,2],
            [69,1],[72,1.5],[74,.5],[76,1.5],[77,.5],[76,1],[74,1.5],[71,.5],[67,1.5],[69,.5],[71,1],[72,.5],[71,.5],[69,1],[68,1],[64,1],[69,3]] },
  scarborough: { title: 'Scarborough Fair', composer: 'Traditional', genre: 'folk', bpm: 92, key: 62, chords: [0, 0, 6, 0, 3, 0, 4, 0],
    notes: [[62,2],[62,1],[69,2],[69,1],[71,1.5],[69,.5],[67,1],[65,1],[64,2],[62,3],
            [62,1],[64,1],[65,1],[67,2],[65,1],[64,1],[62,1],[64,2],[62,1],[57,3]] },
  camptown: { title: 'Camptown Races', composer: 'Foster', genre: 'folk', bpm: 128, key: 60, chords: [0, 0, 4, 0, 0, 0, 4, 0],
    notes: [[67,.5],[67,.5],[64,.5],[67,.5],[69,.5],[67,.5],[64,1.5],[0,.5],[62,.5],[64,.5],[62,.5],[60,2],
            [67,.5],[67,.5],[64,.5],[67,.5],[69,.5],[67,.5],[64,1.5],[0,.5],[62,.5],[64,.5],[62,.5],[60,2],
            [60,.5],[60,.5],[62,1],[64,1],[67,1],[67,.5],[64,.5],[67,1],[69,1],[67,2]] },
  stLouis: { title: 'St. Louis Blues', composer: 'W.C. Handy', genre: 'jazz', bpm: 100, key: 60, chords: [0, 0, 3, 3, 0, 4, 0, 0],
    notes: [[67,1],[63,.5],[64,.5],[67,1],[63,.5],[64,.5],[67,1],[65,1],[64,2],
            [60,1],[63,.5],[64,.5],[67,1],[63,.5],[64,.5],[67,2],[64,1],[60,1],
            [72,1],[70,.5],[72,.5],[70,1],[67,1],[64,2],[60,2]] },
  carnival: { title: 'Carnival of Venice', composer: 'Traditional', genre: 'funk', bpm: 112, key: 60, chords: [0, 0, 4, 0, 0, 0, 4, 0],
    notes: [[67,.5],[0,.5],[67,.5],[0,.5],[67,.5],[69,.5],[71,.5],[72,.5],[74,1],[72,1],[71,2],
            [71,.5],[0,.5],[71,.5],[0,.5],[71,.5],[72,.5],[74,.5],[76,.5],[77,1],[76,1],[74,2],
            [72,.25],[74,.25],[76,.25],[77,.25],[79,1],[77,.5],[76,.5],[74,1],[72,1],[71,1],[72,2]] },
  blueDanube: { title: 'The Blue Danube', composer: 'Strauss', genre: 'ballad', bpm: 104, key: 60, chords: [0, 0, 4, 4, 0, 0, 4, 0],
    notes: [[60,1],[64,2],[0,1],[67,1],[0,1],[67,1],[0,2],[0,1],[64,1],[0,1],[64,1],[0,2],
            [60,1],[64,2],[0,1],[67,1],[0,1],[67,1],[0,2],[0,1],[65,1],[0,1],[65,1],[0,2],
            [69,1],[72,2],[0,1],[74,1],[0,1],[72,1],[0,1],[71,1],[69,3]] },
  toccata: { title: 'Toccata in D Minor', composer: 'Bach', genre: 'rock', bpm: 96, key: 57, chords: [0, 0, 4, 4, 0, 0, 4, 0], hard: true,
    notes: [[69,.25],[67,.25],[69,1.5],[0,.5],[67,.25],[65,.25],[64,.25],[62,.25],[61,.5],[62,2],
            [0,1],[57,.25],[55,.25],[57,1.5],[0,.5],[55,.25],[53,.25],[52,.25],[50,.25],[49,.5],[50,2],
            [69,.5],[72,.5],[76,.5],[81,1],[79,.5],[76,.5],[74,.5],[72,1],[69,2]] },
  ohSusanna: { title: 'Oh! Susanna', composer: 'Foster', genre: 'folk', bpm: 124, key: 60, chords: [0, 0, 4, 0, 0, 0, 4, 0],
    notes: [[60,.5],[62,.5],[64,.5],[67,1],[67,.5],[69,.5],[67,.5],[64,1],[60,.5],[62,.5],[64,1],[64,.5],[62,.5],[60,.5],[62,1.5],
            [60,.5],[62,.5],[64,.5],[67,1],[67,.5],[69,.5],[67,.5],[64,1],[60,.5],[62,.5],[64,1],[64,.5],[62,.5],[62,.5],[60,1.5]] },
  swanLake: { title: 'Swan Lake', composer: 'Tchaikovsky', genre: 'ballad', bpm: 90, key: 57, chords: [0, 0, 4, 4, 0, 0, 4, 0],
    notes: [[69,2],[76,2],[75,1],[74,1],[73,1],[74,2],[73,1],[74,1],[76,1],[74,2],
            [69,2],[76,2],[75,1],[74,1],[73,1],[74,2],[76,1],[77,1],[76,1],[74,2],[69,2]] },
  jarabe: { title: 'Jarabe Tapatio', composer: 'Traditional', genre: 'funk', bpm: 130, key: 60, chords: [0, 0, 4, 0, 4, 4, 0, 0],
    notes: [[72,.5],[72,.5],[74,.5],[76,.5],[76,.5],[74,.5],[72,1],[71,.5],[71,.5],[72,.5],[74,.5],[74,.5],[72,.5],[71,1],
            [72,.5],[72,.5],[74,.5],[76,.5],[79,1],[76,.5],[74,.5],[72,2],[67,.5],[69,.5],[71,.5],[72,2]] },
};
const TUNE_KEYS = Object.keys(TUNES);
const TUNE_BY_GENRE = (g) => TUNE_KEYS.filter(k => TUNES[k].genre === g);

// ---- The opening rock opera. Original, in the spirit of a six-minute epic.
const OPERA = {
  title: 'LAST NIGHT AT THE HIVE',
  subtitle: 'TOKYO DOME - FINAL NIGHT',
  venueName: 'TOKYO DOME',
  kana: 'MONAAKU',            // how the crowd chants the name back
  seats: '55,000 SOLD OUT',
  movements: [
    { key: 'intro', title: 'I. HOUSE LIGHTS', instrument: 'piano', bpm: 72, style: 'opera', difficulty: 1, key_: 57, chords: [0, 5, 3, 4],
      lights: ['#c58bff', '#5bc0ff'], pyro: 0,
      notes: [[69,1],[71,1],[72,2],[74,1],[72,1],[71,2],[69,1],[67,1],[69,2],[64,4],
              [76,1],[74,1],[72,2],[71,1],[72,1],[74,2],[76,1],[79,1],[81,2],[76,4]],
      tutorial: 'TAP THE NOTES ON THE LINE' },
    { key: 'ballad', title: 'II. SLOW BURN', instrument: 'piano', bpm: 84, style: 'ballad', difficulty: 2, key_: 57, chords: [0, 4, 5, 3, 0, 4, 0, 0],
      lights: ['#5bc0ff', '#ffd24a'], pyro: 1,
      notes: [[72,1.5],[71,.5],[69,2],[67,1],[69,1],[71,2],[72,1.5],[74,.5],[76,2],[74,1],[72,1],[71,2],
              [76,1.5],[77,.5],[79,2],[81,1],[79,1],[76,2],[74,1],[76,1],[77,2],[76,4]],
      tutorial: 'HOLD THE LONG ONES - GOLD PAYS TRIPLE' },
    { key: 'groove', title: 'III. LOW ROAD', instrument: 'bass', bpm: 108, style: 'rock', difficulty: 2, key_: 45, chords: [0, 0, 5, 5, 3, 3, 4, 4],
      lights: ['#6be585', '#5bc0ff'], pyro: 1,
      notes: [[45,.5],[45,.5],[52,.5],[45,.5],[48,.5],[45,.5],[50,1],
              [45,.5],[45,.5],[52,.5],[45,.5],[55,.5],[52,.5],[48,1],
              [43,.5],[43,.5],[50,.5],[43,.5],[46,.5],[43,.5],[48,1],
              [45,.5],[48,.5],[52,.5],[55,.5],[57,1],[52,1],
              [45,.5],[45,.5],[52,.5],[45,.5],[48,.5],[45,.5],[50,1],
              [45,.5],[45,.5],[52,.5],[45,.5],[55,.5],[57,.5],[59,1],
              [60,.5],[59,.5],[57,.5],[55,.5],[52,1],[50,1],
              [48,.5],[50,.5],[52,.5],[55,.5],[57,2]],
      tutorial: 'LOCK INTO THE GROOVE' },
    { key: 'solo', title: 'IV. SIX STRINGS', instrument: 'guitar', bpm: 128, style: 'rock', difficulty: 3, key_: 57, chords: [0, 5, 3, 4],
      lights: ['#ff5a5a', '#ffb340'], pyro: 2,
      notes: [[69,.5],[72,.5],[74,.5],[76,.5],[79,1],[76,.5],[74,.5],
              [72,.5],[74,.5],[76,.5],[79,.5],[81,1],[79,1],
              [83,.5],[81,.5],[79,.5],[76,.5],[74,.5],[72,.5],[69,1],
              [67,.5],[69,.5],[72,.5],[76,.5],[74,2],
              [69,.25],[72,.25],[76,.25],[79,.25],[81,.25],[79,.25],[76,.25],[72,.25],[74,1],[76,1],
              [71,.25],[74,.25],[79,.25],[83,.25],[81,.25],[79,.25],[76,.25],[74,.25],[72,1],[71,1],
              [69,.5],[76,.5],[81,.5],[88,.5],[86,1],[84,1],
              [81,.5],[79,.5],[76,.5],[74,.5],[69,2]],
      tutorial: 'RED BOMBS - LET THEM PASS' },
    { key: 'opera', title: 'V. CHOIR OF THOUSANDS', instrument: 'drums', bpm: 140, style: 'opera', difficulty: 4, key_: 60, chords: [0, 3, 4, 0, 5, 3, 4, 0],
      lights: ['#ffd24a', '#ffffff', '#ff5ab0'], pyro: 3,
      notes: [[72,.5],[72,.5],[72,.5],[60,.5],[72,1],[60,1],
              [60,.5],[60,.5],[72,.5],[72,.5],[60,2],
              [72,.5],[60,.5],[72,.5],[60,.5],[72,.5],[72,.5],[60,1],
              [60,.5],[72,.5],[72,.5],[60,.5],[72,2],
              [72,.25],[72,.25],[60,.5],[72,.25],[72,.25],[60,.5],[72,.5],[60,.5],[72,1],
              [60,.5],[60,.5],[72,.5],[60,.5],[72,.5],[72,.5],[60,1],
              [72,.5],[60,.5],[72,.5],[60,.5],[72,.5],[60,.5],[72,.5],[60,.5],
              [60,2],[72,2]],
      tutorial: 'CALL AND ANSWER - KEEP THE COMBO' },
    { key: 'impossible', title: 'VI. THE LAST SOLO', instrument: 'guitar', bpm: 184, style: 'concert', difficulty: 9, key_: 57, chords: [0, 5, 3, 4], impossible: true,
      lights: ['#ff2a2a', '#ffffff'], pyro: 5,
      notes: [[81,.25],[84,.25],[88,.25],[86,.25],[84,.25],[81,.25],[79,.25],[76,.25],
              [79,.25],[83,.25],[86,.25],[90,.25],[88,.25],[86,.25],[83,.25],[79,.25]],
      tutorial: 'NOBODY HAS EVER LANDED THIS ONE' },
  ],
};

// ---- Build a song object from a tune
function songFromTune(key, opts = {}) {
  const t = TUNES[key]; const bpm = opts.bpm || t.bpm; const beat = 60 / bpm;
  const totalBeats = t.notes.reduce((a, n) => a + n[1], 0); const bars = Math.max(4, Math.ceil(totalBeats / 4));
  return { name: t.title, composer: t.composer, tune: key, genre: t.genre, bpm, beat, bars, root: t.key, chords: expandChords(t.chords, bars), melody: t.notes,
    leadIn: 4 * beat, length: 4 * beat + bars * 4 * beat + 1.6, style: GENRES[t.genre] ? GENRES[t.genre].backing : 'rock' };
}
function expandChords(chords, bars) { const out = []; for (let b = 0; b < bars; b++) out.push(chords[b % chords.length]); return out; }
function songFromMovement(mv) {
  const beat = 60 / mv.bpm; const totalBeats = mv.notes.reduce((a, n) => a + n[1], 0);
  const bars = mv.impossible ? 8 : Math.max(4, Math.ceil(totalBeats / 4));
  return { name: mv.title, composer: 'BUZZ', genre: 'rock', bpm: mv.bpm, beat, bars, root: mv.key_, chords: expandChords(mv.chords, bars), melody: mv.notes,
    leadIn: 4 * beat, length: 4 * beat + bars * 4 * beat + 1.6, style: mv.style };
}
// ---- Chart from a melody. Lanes follow the melodic contour so the chart IS the tune.
// ---------- Drum grooves ----------
// A drummer does not play one hit per note of the tune — they play a groove.
// Charting a kit off the melody meant a fast tune asked for nearly four taps a
// second on day one, which is why it felt brutal. This lays down a real pattern
// on the beat instead, and only thickens it as the run gets harder.
//
// notesPerBar by difficulty: 4, 4-5, 5-7, 6-9, 8-11. Everything sits on a beat
// or an eighth, so it always lands where the count is.
function kitGroove(song, sec, difficulty, rng, instr, opts = {}) {
  const beat = song.beat, out = [];
  const pieces = instr.pieces || instr.drumFor || ['kick', 'snare', 'hat', 'tom', 'crash'];
  const n = pieces.length;
  // rank the pieces you actually own from lowest to highest
  const byPitch = pieces.map((p, i) => i).sort((a, b) => (PIECE_PITCH[pieces[a]] || 0) - (PIECE_PITCH[pieces[b]] || 0));
  const low = byPitch[0];                                   // kick, or the bucket
  const back = byPitch[Math.min(byPitch.length - 1, Math.max(1, Math.floor(n / 2)))];  // snare, or the pot
  const top = byPitch[byPitch.length - 1];                  // crash / hat / pot
  const mid = byPitch[Math.min(byPitch.length - 1, 1)];     // a tom if there is one
  const d = clamp(difficulty, 1, 7);
  // Nothing happens off the count until you have played a few nights, and
  // nothing asks for two limbs at once until you own a kit that could do it.
  const offChance = [0, 0, 0, 0.05, 0.12, 0.24, 0.34, 0.44][d];     // eighths between the beats
  const topChance = [0, 0, 0, 0, 0.07, 0.14, 0.22, 0.3][d];         // a piece on top of a beat
  const starRate = opts.starRate != null ? opts.starRate : 0.08;
  const bars = sec.endBar - sec.startBar;
  for (let bar = 0; bar < bars; bar++) {
    const barT = song.leadIn + (sec.startBar + bar) * 4 * beat;
    const isPhraseEnd = d >= 5 && bar % 4 === 3;
    for (let b = 0; b < 4; b++) {
      const t = barT + b * beat;
      // the backbone: low piece on one and three, backbeat on two and four
      const lane = (b === 1 || b === 3) ? back : low;
      out.push({ t, lane, dur: 0, type: 'tap', midi: song.root, star: rng.chance(starRate) });
      // a crash or hat riding the downbeat, once there is a kit to do it on
      if (n >= 4 && d >= 4 && ((bar === 0 && b === 0) || rng.chance(topChance)) && top !== lane)
        out.push({ t, lane: top, dur: 0, type: 'tap', midi: song.root, chord: true });
      // an eighth between this beat and the next
      if (rng.chance(offChance)) {
        const offLane = d >= 5 && rng.chance(0.4) ? mid : low;
        out.push({ t: t + beat * 0.5, lane: offLane, dur: 0, type: 'tap', midi: song.root });
      }
    }
    // a fill across the last bar of a phrase, walking down the kit
    // a fill across the last bar of a phrase, walking down the kit. It stays
    // inside the bar, so it never lands on top of the next downbeat.
    if (isPhraseEnd && n >= 3 && rng.chance(0.4)) {
      const order = byPitch.slice().reverse();
      for (let i = 0; i < 2; i++)
        out.push({ t: barT + 3 * beat + i * beat * 0.5, lane: order[i % order.length], dur: 0, type: 'tap', midi: song.root });
    }
  }
  // two things asked for at the same instant on the same drum is not playable
  const seen = new Set();
  return out.filter(x => { const k = Math.round(x.t * 1000) + ':' + x.lane; if (seen.has(k)) return false; seen.add(k); return true; });
}
function chartFromMelody(song, sections, difficulty, rng, opts = {}) {
  const notes = []; const beat = song.beat; const mel = song.melody;
  const pitches = mel.filter(n => n[0] > 0).map(n => n[0]);
  const lo = Math.min(...pitches), hi = Math.max(...pitches), span = Math.max(1, hi - lo);
  const starRate = opts.starRate != null ? opts.starRate : 0.08;
  const bombRate = difficulty >= 2 ? (0.015 + difficulty * 0.006) * (opts.bombMult || 1) : 0;
  for (const sec of sections) {
    const instr = sec.instr || INSTRUMENTS[sec.instrument]; const secStart = song.leadIn + sec.startBar * 4 * beat, secEnd = song.leadIn + sec.endBar * 4 * beat;
    if (sec.qte) { for (let bar = sec.startBar; bar < sec.endBar; bar++) { const barT = song.leadIn + bar * 4 * beat; const slots = difficulty >= 4 ? [0, 2] : [0]; for (const s of slots) if (rng.chance(0.9)) notes.push({ t: barT + s * beat, lane: 0, dur: 0, type: 'qte', midi: song.root + 12 }); } continue; }
    // a kit plays a groove, not the tune, and never has bombs to dodge
    // — reading a chart is not what this instrument is asking of you
    if (instr.view === 'kit') { notes.push(...kitGroove(song, sec, difficulty, rng, instr, opts)); continue; }
    // walk the melody, looping it to fill the section
    let t = secStart, i = 0, lastLane = Math.floor((instr.lanes || 2) / 2), lastDir = 1, guard = 0;
    while (t < secEnd - 0.001 && guard++ < 900) {
      const [midi, beats] = mel[i % mel.length]; i++;
      const dur = beats * beat;
      if (midi === 0) { t += dur; continue; }
      const rel = (midi - lo) / span;              // 0..1 contour
      const isLong = beats >= 1.5, isFast = beats <= 0.3;
      const star = rng.chance(starRate) && !isFast;
      const bomb = !star && rng.chance(bombRate) && beats <= 0.5;
      switch (instr.game) {
        case 'lanes': {
          const L = instr.lanes, kit = instr.view === 'kit';
          let lane = clamp(Math.round(rel * (L - 1)), 0, L - 1);
          if (L <= 2) lane = rel > 0.5 ? L - 1 : 0;
          if (lane === lastLane && rng.chance(0.25) && L > 2) lane = clamp(lane + rng.sign(), 0, L - 1);
          lastLane = lane;
          if (bomb) { notes.push({ t, lane: clamp(lane + rng.sign(), 0, L - 1), dur: 0, type: 'bomb', midi }); break; }
          if (kit) {
            // A kit has no sustain. The contour picks a piece by how high it
            // sits, downbeats fall on the lowest thing you own, and the top
            // piece rides on top of them. Works for a bucket and a pot as
            // happily as for a full five-piece.
            const pieces = instr.pieces || instr.drumFor || [];
            const order = pieces.map((p, i) => i).sort((a, b) => (PIECE_PITCH[pieces[a]] || 0) - (PIECE_PITCH[pieces[b]] || 0));
            const low = order[0], top = order[order.length - 1];
            lane = order[clamp(Math.round(rel * (order.length - 1)), 0, order.length - 1)];
            const onBeat = Math.abs(((t - secStart) / beat) % 2) < 0.02;
            if (onBeat && rng.chance(0.5)) lane = low;
            notes.push({ t, lane, dur: 0, type: 'tap', midi, star });
            // a two-limb accent: only once you own enough of a kit for it
            if (onBeat && difficulty >= 3 && L >= 4 && rng.chance(0.22) && lane !== top) { notes.push({ t, lane: top, dur: 0, type: 'tap', midi, chord: true }); notes[notes.length - 2].chord = true; }
            break;
          }
          if (isLong && difficulty >= 2) { notes.push({ t, lane, dur: dur - beat * 0.15, type: 'hold', midi, star }); break; }
          notes.push({ t, lane, dur: 0, type: 'tap', midi, star });
          if (L >= 6 && difficulty >= 3 && beats >= 1 && rng.chance(0.22)) { const l2 = clamp(lane + (lane < L - 2 ? 2 : -2), 0, L - 1); notes.push({ t, lane: l2, dur: 0, type: 'tap', midi: midi + 4, chord: true }); notes[notes.length - 2].chord = true; }
          break;
        }
        case 'taiko': {
          if (bomb) { notes.push({ t, lane: 0, dur: 0, type: 'bomb', midi }); break; }
          const strong = (t - secStart) % (beat * 2) < 0.001;
          let type = rel > 0.55 ? 'ka' : 'don'; if (strong && isLong && difficulty >= 3 && rng.chance(0.5)) type = 'big';
          if (isLong && beats >= 2 && rng.chance(0.5)) { notes.push({ t, lane: 0, dur: Math.min(dur, beat * 2), type: 'roll', midi }); break; }
          notes.push({ t, lane: 0, dur: 0, type, midi, star: star && type !== 'big' }); break;
        }
        case 'wind': { notes.push({ t, lane: 0, dur: Math.max(beat * 0.35, dur - beat * 0.12), type: 'hold', midi, pitch: rel, star }); break; }
        case 'valves': { if (bomb) { notes.push({ t, lane: 0, dur: 0, type: 'bomb', midi }); break; } const combo = 1 + (Math.round(rel * 6) % 7); notes.push({ t, lane: 0, dur: 0, type: 'tap', midi, combo, star }); break; }
        case 'bow': { let dir = -lastDir; if (rng.chance(0.15)) dir = lastDir; lastDir = dir; const hold = isLong && difficulty >= 2; notes.push({ t, lane: dir > 0 ? 1 : 0, dur: hold ? dur - beat * 0.15 : 0, type: hold ? 'hold' : 'tap', midi, dir, pitch: rel, star: star && !hold }); break; }
      }
      t += dur;
    }
  }
  notes.sort((a, b) => a.t - b.t); notes.forEach((n, i) => { n.id = i; n.hit = false; n.judged = false; });
  return notes;
}
