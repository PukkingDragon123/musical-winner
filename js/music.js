// ---------- Procedural songs, charts, and backing band ----------
'use strict';
const PROGRESSIONS = [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 4], [0, 0, 3, 4], [2, 5, 0, 4], [0, 4, 3, 4], [3, 4, 0, 0]];
const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const SONG_ADJ = ['Foggy', 'Midnight', 'Sourdough', 'Cable Car', 'Bay', 'Sunset', 'Twin Peaks', 'Steep Hill', 'Sea Lion', 'Karl\'s', 'Painted Lady', 'Hyde Street'];
const SONG_NOUN = ['Shuffle', 'Blues', 'Stomp', 'Rag', 'Waltz', 'Bounce', 'Groove', 'Serenade', 'Rumble', 'Strut', 'Boogie', 'Lullaby'];

function chordTones(root, degree) {
  // triad on scale degree (major scale)
  const d = (i) => MAJOR[(degree + i) % 7] + 12 * Math.floor((degree + i) / 7);
  return [root + d(0), root + d(2), root + d(4)];
}
function scaleNote(root, idx) { return root + MAJOR[((idx % 7) + 7) % 7] + 12 * Math.floor(idx / 7); }

function makeSong(rng, bpm, bars) {
  const root = rng.int(55, 64);
  const prog = rng.pick(PROGRESSIONS);
  const chords = [];
  for (let b = 0; b < bars; b++) chords.push(prog[b % prog.length]);
  return {
    name: rng.pick(SONG_ADJ) + ' ' + rng.pick(SONG_NOUN),
    bpm, beat: 60 / bpm, bars, root, chords, prog,
    leadIn: 4 * (60 / bpm), // one bar count-in
    length: 4 * (60 / bpm) + bars * 4 * (60 / bpm) + 1.5,
  };
}

// Generate a melody-ish midi for a beat position (subdivision grid), following chord tones
function melodyPitch(song, bar, beatInBar, rng, prev) {
  const root = song.root + 12;
  const tones = chordTones(root, song.chords[bar]);
  if (beatInBar % 1 === 0 || rng.chance(0.6)) {
    let cand = tones.slice();
    if (rng.chance(0.3)) cand = cand.map(n => n + 12);
    if (prev != null) cand.sort((a, b) => Math.abs(a - prev) - Math.abs(b - prev));
    return rng.chance(0.65) ? cand[0] : rng.pick(cand);
  }
  // passing tone near previous
  const base = prev == null ? tones[0] : prev;
  const idx = Math.round((base - root) / 12 * 7);
  return scaleNote(root, idx + (rng.chance(0.5) ? 1 : -1));
}

// Chart generation. Returns notes: {t, lane, dur, type, midi, combo, dir}
// difficulty 1..6, sections: array of {instrument, startBar, endBar}
function generateChart(song, sections, difficulty, rng) {
  const notes = [];
  const beat = song.beat;
  const dens = clamp(0.35 + difficulty * 0.09, 0.4, 0.95); // on-beat density
  const offDens = clamp(-0.1 + difficulty * 0.14, 0, 0.75);
  const sixteenth = difficulty >= 4 ? (difficulty - 3) * 0.12 : 0;
  for (const sec of sections) {
    const instr = INSTRUMENTS[sec.instrument];
    let prev = null, lane = Math.floor((instr.lanes || 2) / 2), lastDir = 1;
    for (let bar = sec.startBar; bar < sec.endBar; bar++) {
      const barT = song.leadIn + bar * 4 * beat;
      const grid = []; // eighth-note grid, 8 per bar
      for (let e = 0; e < 8; e++) {
        const onBeat = e % 2 === 0;
        let p = onBeat ? dens : offDens;
        if (e === 0) p = Math.max(p, 0.8);
        grid.push(rng.chance(p));
      }
      // ensure at least 2 notes per bar
      if (grid.filter(Boolean).length < 2) { grid[0] = true; grid[4] = true; }
      const bi = bar - sec.startBar;
      const isLastBar = bar === sec.endBar - 1;
      for (let e = 0; e < 8; e++) {
        if (!grid[e]) continue;
        const t = barT + e * beat / 2;
        const midi = melodyPitch(song, bar, e / 2, rng, prev); prev = midi;
        let dur = 0;
        const nextOn = grid.slice(e + 1).findIndex(Boolean);
        const gapEighths = nextOn === -1 ? 8 - e : nextOn + 1;
        switch (instr.game) {
          case 'lanes': {
            const L = instr.lanes;
            if (L === 1) lane = 0;
            else { lane = clamp(lane + rng.int(-1, 1) * (rng.chance(0.7) ? 1 : 2), 0, L - 1); }
            if (gapEighths >= 3 && rng.chance(0.3 + difficulty * 0.05)) dur = (gapEighths - 1) * beat / 2;
            notes.push({ t, lane, dur, type: dur ? 'hold' : 'tap', midi });
            if (L >= 6 && difficulty >= 3 && !dur && rng.chance(0.18)) {
              const l2 = lane + (lane < L - 2 ? 2 : -2);
              notes.push({ t, lane: l2, dur: 0, type: 'tap', midi: midi + 4 });
            }
            break;
          }
          case 'taiko': {
            const onBeat = e % 2 === 0;
            let type = onBeat ? (rng.chance(0.75) ? 'don' : 'ka') : (rng.chance(0.6) ? 'ka' : 'don');
            if (e === 0 && bi % 2 === 1 && rng.chance(0.35 + difficulty * 0.05)) type = 'big';
            if (isLastBar && e === 4 && rng.chance(0.5)) { notes.push({ t, lane: 0, dur: beat * 1.5, type: 'roll', midi }); break; }
            notes.push({ t, lane: 0, dur: 0, type, midi });
            break;
          }
          case 'wind': {
            // phrases: holds with breaths
            if (gapEighths >= 2) dur = Math.max(beat * 0.5, (gapEighths - 0.5) * beat / 2);
            else dur = beat * 0.4;
            const pitch = clamp((midi - song.root - 12) / 19, 0, 1);
            notes.push({ t, lane: 0, dur, type: 'hold', midi, pitch });
            break;
          }
          case 'valves': {
            const combo = 1 + ((midi - song.root) % 7 + 7) % 7; // 1..7 bitmask
            notes.push({ t, lane: 0, dur: 0, type: 'tap', midi, combo });
            break;
          }
          case 'bow': {
            let dir = -lastDir; if (rng.chance(0.2)) dir = lastDir; lastDir = dir;
            if (gapEighths >= 3 && rng.chance(0.45)) dur = (gapEighths - 1) * beat / 2;
            const pitch = clamp((midi - song.root - 12) / 19, 0, 1);
            notes.push({ t, lane: dir > 0 ? 1 : 0, dur, type: dur ? 'hold' : 'tap', midi, dir, pitch });
            break;
          }
        }
      }
    }
  }
  notes.sort((a, b) => a.t - b.t);
  notes.forEach((n, i) => { n.id = i; n.hit = false; n.judged = false; });
  return notes;
}

// Backing band: schedules drums/bass/pads ahead of time
class Backing {
  constructor(song, startTime, mute) {
    this.song = song; this.start = startTime; this.mute = mute || {};
    this.nextStep = 0; // 16th-note steps since leadIn start
    this.stepDur = song.beat / 4;
    this.totalSteps = (song.bars + 4) * 16;
    this.stopped = false;
  }
  update() {
    if (this.stopped || !Audio.ctx) return;
    const now = Audio.now();
    const horizon = now + 0.3;
    while (this.nextStep < this.totalSteps) {
      const t = this.start + this.nextStep * this.stepDur;
      if (t > horizon) break;
      this.schedule(this.nextStep, t);
      this.nextStep++;
    }
  }
  schedule(step, t) {
    const s = this.song;
    const barIdx = Math.floor(step / 16); // bar 0 = count-in
    const inBar = step % 16;
    const beatIdx = Math.floor(inBar / 4), sub = inBar % 4;
    const countIn = barIdx === 0;
    const outro = barIdx > s.bars;
    const mute = typeof this.mute === 'function' ? (this.mute(t) || {}) : this.mute;
    if (countIn) { if (sub === 0) Audio.drum('hat', t, 0.7); return; }
    const chord = s.chords[Math.min(barIdx - 1, s.bars - 1)];
    const rootMidi = s.root - 12;
    if (!mute.drums && !outro) {
      if (sub === 0 && (beatIdx === 0 || beatIdx === 2)) Audio.drum('kick', t, 0.6);
      if (sub === 0 && (beatIdx === 1 || beatIdx === 3)) Audio.drum('snare', t, 0.45);
      if (sub === 2) Audio.drum('hat', t, 0.35);
      if (sub === 0) Audio.drum('hat', t, 0.2);
    }
    if (outro && step === (s.bars + 1) * 16) Audio.drum('crash', t, 0.5);
    if (!mute.bass && !outro) {
      const tones = chordTones(rootMidi, chord);
      if (sub === 0 && beatIdx === 0) Audio.note('bass', tones[0], t, s.beat * 0.9, 0.35);
      if (sub === 0 && beatIdx === 2) Audio.note('bass', tones[0], t, s.beat * 0.9, 0.3);
      if (sub === 2 && beatIdx === 1) Audio.note('bass', tones[2] - 12 + 12, t, s.beat * 0.4, 0.22);
      if (sub === 2 && beatIdx === 3) Audio.note('bass', tones[1], t, s.beat * 0.4, 0.22);
    }
    if (!mute.pad && !outro && inBar === 0) {
      const tones = chordTones(s.root, chord);
      tones.forEach(m => Audio.note('pad', m, t, s.beat * 3.8, 0.16));
    }
  }
  stop() { this.stopped = true; }
}
