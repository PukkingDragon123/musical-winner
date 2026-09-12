// ---------- Songs, charts, backing band, the concert suite ----------
'use strict';
const PROGRESSIONS = {
  rock: [[0, 4, 5, 3], [0, 3, 4, 4], [5, 3, 0, 4], [0, 0, 3, 4]],
  funk: [[0, 0, 3, 3], [1, 4, 0, 0], [0, 3, 0, 4]],
  jazz: [[1, 4, 0, 0], [2, 5, 1, 4], [0, 5, 1, 4]],
  ballad: [[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 0]],
  folk: [[0, 3, 0, 4], [0, 4, 3, 4], [5, 3, 0, 4]],
};
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SONG_ADJ = ['Foggy', 'Midnight', 'Sourdough', 'Cable Car', 'Bay', 'Sunset', 'Twin Peaks', 'Steep Hill', 'Sea Lion', 'Karl\'s', 'Painted Lady', 'Hyde Street', 'Mission', 'Golden'];
const SONG_NOUN = ['Shuffle', 'Blues', 'Stomp', 'Rag', 'Waltz', 'Bounce', 'Groove', 'Serenade', 'Rumble', 'Strut', 'Boogie', 'Lullaby', 'Anthem', 'Rhapsody'];
function chordTones(root, degree) { const d = (i) => MAJOR[(degree + i) % 7] + 12 * Math.floor((degree + i) / 7); return [root + d(0), root + d(2), root + d(4)]; }
function scaleNote(root, idx) { return root + MAJOR[((idx % 7) + 7) % 7] + 12 * Math.floor(idx / 7); }

function makeSong(rng, opts = {}) {
  const genre = opts.genre || rng.pick(GENRE_KEYS); const G = GENRES[genre];
  const bpm = opts.bpm || rng.int(G.bpm[0], G.bpm[1]); const bars = opts.bars || 12;
  const root = opts.root != null ? opts.root : rng.int(55, 64);
  const prog = opts.prog || rng.pick(PROGRESSIONS[genre]);
  const chords = []; for (let b = 0; b < bars; b++) chords.push(prog[b % prog.length]);
  const beat = 60 / bpm;
  return { name: opts.name || (rng.pick(SONG_ADJ) + ' ' + rng.pick(SONG_NOUN)), genre, bpm, beat, bars, root, chords, prog, leadIn: 4 * beat, length: 4 * beat + bars * 4 * beat + 1.5, style: opts.style || G.backing };
}
function melodyPitch(song, bar, beatInBar, rng, prev) {
  const root = song.root + 12; const tones = chordTones(root, song.chords[bar]);
  if (beatInBar % 1 === 0 || rng.chance(0.6)) { let cand = tones.slice(); if (rng.chance(0.3)) cand = cand.map(n => n + 12); if (prev != null) cand.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev)); return rng.chance(0.65) ? cand[0] : rng.pick(cand); }
  const base = prev == null ? tones[0] : prev; const idx = Math.round((base - root) / 12 * 7); return scaleNote(root, idx + (rng.chance(0.5) ? 1 : -1));
}
// sections: [{instrument, startBar, endBar, member, qte}] ; difficulty 1..7 ; opts {bombMult, starRate, dens}
function generateChart(song, sections, difficulty, rng, opts = {}) {
  const notes = []; const beat = song.beat; const G = GENRES[song.genre] || GENRES.rock;
  const densMul = (opts.dens || 1) * G.dens;
  const dens = clamp((0.35 + difficulty * 0.09) * densMul, 0.4, 0.97), offDens = clamp((-0.1 + difficulty * 0.14) * densMul, 0, 0.8);
  const bombRate = (difficulty >= 2 ? 0.03 + difficulty * 0.01 : 0) * (opts.bombMult || 1), starRate = opts.starRate || 0.07;
  for (const sec of sections) {
    const instr = INSTRUMENTS[sec.instrument];
    if (sec.qte) { // quick-time prompts on strong beats while a bandmate plays
      for (let bar = sec.startBar; bar < sec.endBar; bar++) {
        const barT = song.leadIn + bar * 4 * beat; const slots = difficulty >= 4 ? [0, 2] : [0];
        for (const s of slots) if (rng.chance(0.85)) notes.push({ t: barT + s * beat, lane: 0, dur: 0, type: 'qte', midi: melodyPitch(song, bar, s, rng, null), key: rng.pick(['Space', 'Space', 'KeyF', 'KeyJ']) });
      }
      continue;
    }
    let prev = null, lane = Math.floor((instr.lanes || 2) / 2), lastDir = 1;
    for (let bar = sec.startBar; bar < sec.endBar; bar++) {
      const barT = song.leadIn + bar * 4 * beat; const grid = [];
      for (let e = 0; e < 8; e++) { const onBeat = e % 2 === 0; let p = onBeat ? dens : offDens; if (e === 0) p = Math.max(p, 0.8); if (G.syncopated && !onBeat) p *= 1.3; grid.push(rng.chance(p)); }
      if (grid.filter(Boolean).length < 2) { grid[0] = true; grid[4] = true; }
      const bi = bar - sec.startBar, isLastBar = bar === sec.endBar - 1;
      for (let e = 0; e < 8; e++) {
        if (!grid[e]) continue;
        let t = barT + e * beat / 2; if (G.swing && e % 2 === 1) t += beat * 0.08;
        const midi = melodyPitch(song, bar, e / 2, rng, prev); prev = midi;
        let dur = 0; const nextOn = grid.slice(e + 1).findIndex(Boolean); const gapEighths = nextOn === -1 ? 8 - e : nextOn + 1;
        const star = rng.chance(starRate), bomb = !star && e % 2 === 1 && rng.chance(bombRate);
        switch (instr.game) {
          case 'lanes': {
            const L = instr.lanes; if (L === 1) lane = 0; else lane = clamp(lane + rng.int(-1, 1) * (rng.chance(0.7) ? 1 : 2), 0, L - 1);
            if (bomb) { notes.push({ t, lane, dur: 0, type: 'bomb', midi }); break; }
            if (gapEighths >= 3 && rng.chance((G.holds ? 0.5 : 0.28) + difficulty * 0.04)) dur = (gapEighths - 1) * beat / 2;
            if (isLastBar && e === 0 && difficulty >= 3 && rng.chance(0.35)) { notes.push({ t, lane, dur: beat * 1.5, type: 'roll', midi }); break; }
            notes.push({ t, lane, dur, type: dur ? 'hold' : 'tap', midi, star: star && !dur });
            if (L >= 6 && difficulty >= 3 && !dur && rng.chance(0.2)) { const l2 = lane + (lane < L - 2 ? 2 : -2); notes.push({ t, lane: l2, dur: 0, type: 'tap', midi: midi + 4, chord: true }); notes[notes.length - 2].chord = true; }
            break;
          }
          case 'taiko': {
            const onBeat = e % 2 === 0; let type = onBeat ? (rng.chance(0.75) ? 'don' : 'ka') : (rng.chance(0.6) ? 'ka' : 'don');
            if (e === 0 && bi % 2 === 1 && rng.chance(0.35 + difficulty * 0.05)) type = 'big';
            if (isLastBar && e === 4 && rng.chance(0.5)) { notes.push({ t, lane: 0, dur: beat * 1.5, type: 'roll', midi }); break; }
            if (bomb) { notes.push({ t, lane: 0, dur: 0, type: 'bomb', midi }); break; }
            notes.push({ t, lane: 0, dur: 0, type, midi, star: star && type !== 'big' }); break;
          }
          case 'wind': { dur = gapEighths >= 2 ? Math.max(beat * 0.5, (gapEighths - 0.5) * beat / 2) : beat * 0.4; const pitch = clamp((midi - song.root - 12) / 19, 0, 1); notes.push({ t, lane: 0, dur, type: 'hold', midi, pitch, star }); break; }
          case 'valves': { if (bomb) { notes.push({ t, lane: 0, dur: 0, type: 'bomb', midi }); break; } const combo = 1 + ((midi - song.root) % 7 + 7) % 7; notes.push({ t, lane: 0, dur: 0, type: 'tap', midi, combo, star }); break; }
          case 'bow': { let dir = -lastDir; if (rng.chance(0.2)) dir = lastDir; lastDir = dir; if (gapEighths >= 3 && rng.chance(0.45)) dur = (gapEighths - 1) * beat / 2; const pitch = clamp((midi - song.root - 12) / 19, 0, 1); notes.push({ t, lane: dir > 0 ? 1 : 0, dur, type: dur ? 'hold' : 'tap', midi, dir, pitch, star: star && !dur }); break; }
        }
      }
    }
  }
  notes.sort((a, b) => a.t - b.t); notes.forEach((n, i) => { n.id = i; n.hit = false; n.judged = false; });
  return notes;
}
// Backing band with genre styles. mute: fn(t)->{drums,bass,pad} or object
class Backing {
  constructor(song, startTime, mute) { this.song = song; this.start = startTime; this.mute = mute || {}; this.nextStep = 0; this.stepDur = song.beat / 4; this.totalSteps = (song.bars + 4) * 16; this.stopped = false; }
  update() { if (this.stopped || !Audio.ctx) return; const horizon = Audio.now() + 0.3; while (this.nextStep < this.totalSteps) { const t = this.start + this.nextStep * this.stepDur; if (t > horizon) break; this.schedule(this.nextStep, t); this.nextStep++; } }
  schedule(step, t) {
    const s = this.song, barIdx = Math.floor(step / 16), inBar = step % 16, beatIdx = Math.floor(inBar / 4), sub = inBar % 4;
    const countIn = barIdx === 0, outro = barIdx > s.bars;
    const mute = typeof this.mute === 'function' ? (this.mute(t) || {}) : this.mute;
    if (countIn) { if (sub === 0) Audio.drum('hat', t, 0.7); return; }
    const chord = s.chords[Math.min(barIdx - 1, s.bars - 1)], rootMidi = s.root - 12, style = s.style || 'rock';
    if (outro) { if (step === (s.bars + 1) * 16) { Audio.drum('crash', t, 0.5); if (style === 'concert') chordTones(s.root, chord).forEach(m => Audio.note('eguitar', m - 12, t, s.beat * 3, 0.4)); } return; }
    if (!mute.drums) {
      if (style === 'rock' || style === 'concert') { if (sub === 0 && (beatIdx === 0 || beatIdx === 2)) Audio.drum(style === 'concert' ? 'bigkick' : 'kick', t, 0.7); if (sub === 0 && (beatIdx === 1 || beatIdx === 3)) Audio.drum('snare', t, 0.55); if (sub === 2) Audio.drum('hat', t, 0.35); if (sub === 0) Audio.drum('hat', t, 0.25); if (style === 'concert' && sub === 2 && beatIdx === 3) Audio.drum('tom', t, 0.4); }
      else if (style === 'funk') { if (sub === 0 && beatIdx === 0) Audio.drum('kick', t, 0.7); if (sub === 2 && beatIdx === 1) Audio.drum('kick', t, 0.5); if (sub === 0 && (beatIdx === 1 || beatIdx === 3)) Audio.drum('snare', t, 0.5); if (sub === 3 && beatIdx === 2) Audio.drum('snare', t, 0.3); Audio.drum('hat', t, sub === 0 ? 0.3 : 0.18); }
      else if (style === 'jazz') { if (sub === 0 && beatIdx % 2 === 0) Audio.drum('kick', t, 0.3); if (sub === 0 || (sub === 3 && beatIdx % 2 === 1)) Audio.drum(beatIdx % 2 === 1 ? 'ohat' : 'hat', t, 0.3); if (sub === 0 && beatIdx === 3) Audio.drum('snare', t, 0.2); }
      else if (style === 'ballad') { if (sub === 0 && beatIdx === 0) Audio.drum('kick', t, 0.5); if (sub === 0 && beatIdx === 2) Audio.drum('snare', t, 0.3); if (sub === 0) Audio.drum('hat', t, 0.2); }
      else if (style === 'folk') { if (sub === 0 && (beatIdx === 0 || beatIdx === 2)) Audio.drum('stomp', t, 0.5); if (sub === 0 && (beatIdx === 1 || beatIdx === 3)) Audio.drum('clap', t, 0.4); if (sub === 2) Audio.drum('hat', t, 0.2); }
      else if (style === 'opera') { if (sub === 0 && beatIdx === 0) Audio.drum('timpani', t, 0.6); if (sub === 0 && beatIdx === 2) Audio.drum('timpani', t, 0.4); }
    }
    if (!mute.bass) {
      const tones = chordTones(rootMidi, chord);
      if (style === 'funk') { if (sub === 0 && beatIdx === 0) Audio.note('bass', tones[0], t, s.beat * 0.4, 0.4); if (sub === 2 && beatIdx === 0) Audio.note('bass', tones[0], t, s.beat * 0.2, 0.3); if (sub === 0 && beatIdx === 2) Audio.note('bass', tones[0] + 12, t, s.beat * 0.3, 0.3); if (sub === 3 && beatIdx === 2) Audio.note('bass', tones[2], t, s.beat * 0.3, 0.3); if (sub === 2 && beatIdx === 3) Audio.note('bass', tones[1], t, s.beat * 0.3, 0.25); }
      else if (style === 'jazz') { if (sub === 0) Audio.note('bass', [tones[0], tones[1], tones[2], tones[1] - 12 + 12][beatIdx], t, s.beat * 0.9, 0.3); }
      else if (style === 'ballad' || style === 'opera') { if (sub === 0 && beatIdx === 0) Audio.note('bass', tones[0], t, s.beat * 3.8, 0.35); }
      else if (style === 'concert') { if (sub === 0 || sub === 2) Audio.note('bass', tones[0], t, s.beat * 0.45, 0.4); }
      else { if (sub === 0 && beatIdx === 0) Audio.note('bass', tones[0], t, s.beat * 0.9, 0.35); if (sub === 0 && beatIdx === 2) Audio.note('bass', tones[0], t, s.beat * 0.9, 0.3); if (sub === 2 && beatIdx === 1) Audio.note('bass', tones[2], t, s.beat * 0.4, 0.22); if (sub === 2 && beatIdx === 3) Audio.note('bass', tones[1], t, s.beat * 0.4, 0.22); }
    }
    if (!mute.pad && inBar === 0) {
      const tones = chordTones(s.root, chord);
      if (style === 'concert') { tones.forEach(m => Audio.note('eguitar', m - 12, t, s.beat * 3.6, 0.3)); }
      else if (style === 'opera') { tones.forEach(m => Audio.note('choir', m, t, s.beat * 3.8, 0.35)); if (beatIdx === 0) Audio.note('organ', tones[0] - 12, t, s.beat * 3.8, 0.25); }
      else if (style === 'ballad') { tones.forEach((m, i) => Audio.note('piano', m, t + i * 0.03, s.beat * 3.6, 0.28)); }
      else if (style === 'jazz') { tones.forEach(m => Audio.note('piano', m + 12, t + s.beat * 0.5, s.beat * 1.5, 0.2)); }
      else if (style === 'funk') { tones.forEach(m => Audio.note('organ', m, t + s.beat * 0.75, s.beat * 0.4, 0.2)); tones.forEach(m => Audio.note('organ', m, t + s.beat * 2.5, s.beat * 0.4, 0.2)); }
      else tones.forEach(m => Audio.note('pad', m, t, s.beat * 3.8, 0.16));
    }
    if (style === 'opera' && sub === 0 && (beatIdx === 1 || beatIdx === 3)) { chordTones(s.root + 12, chord).forEach(m => Audio.note('choir', m, t, s.beat * 0.8, 0.3)); }
  }
  stop() { this.stopped = true; }
}
// The stadium suite that opens the game: six movements in the spirit of a certain six-minute rhapsody.
const CONCERT_MOVEMENTS = [
  { key: 'ballad', title: 'I. THE BALLAD', bpm: 74, bars: 6, genre: 'ballad', style: 'ballad', instrument: 'piano', difficulty: 1, root: 58, prog: [0, 5, 3, 4, 0, 4],
    tutorial: 'KEYBOARD: notes fall down the lanes. Press the matching key when a note reaches the bar. Hold long notes down.' },
  { key: 'guitar', title: 'II. THE RIFF', bpm: 112, bars: 8, genre: 'rock', style: 'rock', instrument: 'guitar', difficulty: 2, root: 58, prog: [0, 4, 5, 3],
    tutorial: 'GUITAR: same idea, four lanes. Gold STAR notes are worth triple. Red BOMBS: do not touch.' },
  { key: 'opera', title: 'III. THE OPERA', bpm: 132, bars: 8, genre: 'rock', style: 'opera', instrument: 'drums', difficulty: 3, root: 60, prog: [0, 3, 0, 4, 5, 3, 4, 4],
    tutorial: 'TAIKO: red DON = F or J. Blue KA = D or K. Big notes: both DON keys. Mash the gold ROLL bars.' },
  { key: 'horns', title: 'IV. THE FANFARE', bpm: 120, bars: 8, genre: 'rock', style: 'rock', instrument: 'trumpet', difficulty: 2, root: 60, prog: [0, 4, 3, 4],
    tutorial: 'TRUMPET: each note shows lit valves. Press exactly those keys (J K L) together, on the beat.' },
  { key: 'band', title: 'V. THE BAND', bpm: 128, bars: 8, genre: 'rock', style: 'concert', instrument: 'guitar', difficulty: 3, root: 58, prog: [0, 4, 5, 3], band: true,
    tutorial: 'When a bandmate takes the spotlight you back them up: hit the QTE ring as it closes. Then it is back to you.' },
  { key: 'solo', title: 'VI. THE SOLO', bpm: 176, bars: 8, genre: 'rock', style: 'concert', instrument: 'guitar', difficulty: 9, root: 58, prog: [5, 3, 0, 4], impossible: true,
    tutorial: 'THE SOLO. Nobody has ever landed it live. Good luck.' },
];
