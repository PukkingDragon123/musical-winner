// ---------- A street set: play, tally, draft an ability ----------
'use strict';
class GigScene {
  constructor(node) {
    const r = Game.run; this.node = node; this.venue = VENUES[node.venue] || VENUES.shotengai; this.t = 0; this.phase = 'prep';
    this.mode = node.icon === 'elite' ? 'elite' : (node.icon === 'boss' || node.venue === 'skytree') ? 'boss' : 'gig';
    this.bossMod = this.mode !== 'gig' ? (node.bossMod || (node.bossMod = r.rng.pick(BOSS_MOD_KEYS))) : null;
    this.difficulty = clamp(Math.round(1 + r.day * 0.8 + (this.mode === 'elite' ? 1 : 0) + (this.mode === 'boss' ? 2 : 0)), 1, 7);
    const leader = r.members[0], fam = INSTRUMENTS[leader.instrument].family;
    const pool = r.buffs.genre ? TUNE_BY_GENRE(r.buffs.genre) : TUNE_KEYS.filter(k => this.difficulty >= 4 || !TUNES[k].hard);
    // ---- the crate: what this room has records of tonight
    const src = (pool.length >= 8 ? pool : TUNE_KEYS).slice();
    this.crate = r.rng.shuffle(src).slice(0, 8);
    // a tune you have played before is still in the crate, but marked, so you
    // can choose between something you know and something you do not
    this.known = r.playedTunes || (r.playedTunes = {});
    this.setlist = [];
    this.songIdx = 0;
    // the tally adds up across the whole show
    this.showTotals = { perfect: 0, great: 0, good: 0, miss: 0, maxCombo: 0 };
    this.setSong(this.crate[0]);
    this.V = buildVenue(this.venue, hashStr(node.id + r.seed), r.day / 5);
    this.active = r.members.map(m => m.stamina >= 15 || m.leader); this.useItems = {};
    this.layout(); this.buildPrepMenu(); this.pads = []; this.padPointers = new Map(); this.dragDrum = new Map(); this.earPointers = new Map(); this.fx = new Particles();
    this.cam = new Camera(); this.cutIn = null; this.haze = new Haze(6, hashStr(node.id) & 63);
    // ---- the duel. Favour runs 0..1; you start level and the crowd decides.
    if (this.mode === 'boss') {
      this.rival = { favour: 0.5, phase: 0, spec: HERO_PRESETS.smoke || randomBugSpec(makeRng(99)),
                     tauntT: 0, taunt: null, hurt: 0, flash: 0, downed: false };
      this.bossMod = RIVAL.phases[0].mod;
    }
    this.train = { x: -700, t: r.rng.range(4, 9) };
  }
  // Point the scene at one tune: everything downstream reads this.song.
  setSong(key) {
    const r = Game.run;
    this.tuneKey = key;
    this.song = songFromTune(key, { bpm: TUNES[key].bpm + r.day * 2 });
    this.bars = this.mode === 'boss' ? Math.max(12, this.song.bars) : this.song.bars;
  }
  // A show is three songs. Each one is short, so the set has shape.
  get setSize() { return 3; }
  toggleSong(key) {
    const i = this.setlist.indexOf(key);
    if (i >= 0) { this.setlist.splice(i, 1); Audio.ui('back'); return; }
    if (this.setlist.length >= this.setSize) { Audio.ui('error'); return; }
    this.setlist.push(key); Audio.ui('select');
    // a taste of what you just picked, so choosing is a musical decision
    const t2 = TUNES[key]; const beat = 60 / t2.bpm;
    let at = Audio.now() + 0.02;
    for (const [m, b] of t2.notes.slice(0, 6)) { if (m > 0) Audio.note('piano', m, at, beat * b * 0.9, 0.34); at += beat * b * 0.6; }
  }
  layout() {
    const t = Game.touch;
    // A kit is played on the drums themselves, so it needs no highway and no
    // pads: the venue gets the whole frame and the drums sit in it. Everything
    // that still reads a converging highway keeps the split screen.
    const lead = Game.run && Game.run.members[0];
    const lv = lead && (INSTRUMENTS[lead.instrument] || {}).view;
    this.openKit = lv === 'kit';
    this.openEar = lv === 'keys' || lv === 'fret';
    this.openStage = this.openKit || this.openEar || lv === 'sheet';
    if (this.openStage) {
      // A kit is tapped on the drums, so it never needs pads. Anything read off
      // a page still does on a phone: the pads sit at the bottom of the scene.
      const needPads = t && !this.openKit && !this.openEar;
      this.L = { top: false, open: true, stageTop: 26, stageBottom: H,
                 groundY: t ? (needPads ? 330 : 372) : 396, rows: [0, -10, -20],
                 streetY: t ? (needPads ? 356 : 420) : 446, streetH: needPads ? 56 : 94,
                 rhythmY: 16, rhythmH: (needPads ? H - 124 : H) - 16,
                 padY: needPads ? H - 118 : 0, padH: needPads ? 114 : 0, overlay: true };
      this.stageX = 150; this.hatX = this.stageX + 92;
      return;
    }
    this.L = t ? { top: true, stageTop: 26, stageBottom: 150, groundY: 122, rows: [0, -8, -16], streetY: null, rhythmY: 152, rhythmH: 248, padY: 404, padH: 130, compact: true }
      : { top: false, stageTop: 316, stageBottom: 540, groundY: 452, rows: [0, -9, -18], streetY: 474, streetH: 66, rhythmY: 16, rhythmH: 296, padY: 0, padH: 0 };
    this.stageX = 230; this.hatX = this.stageX + 100;
  }
  isPlaying() { return this.phase === 'play'; }
  buildPrepMenu() {
    const r = Game.run, items = [];
    r.members.forEach((m, i) => { if (!m.leader) items.push({ label: (this.active[i] ? 'ON' : 'OFF') + '  ' + m.name, right: INSTRUMENTS[m.instrument].name, icon: 'note', onSelect: () => { if (m.stamina < 15) { Audio.ui('error'); return; } this.active[i] = !this.active[i]; const k = this.menu.idx; this.buildPrepMenu(); this.menu.idx = k; } }); });
    const seen = new Set();
    r.consumables.forEach(k => { const c = CONSUMABLES[k]; if (seen.has(k) || c.target !== 'run') return; seen.add(k); items.push({ label: (this.useItems[k] ? 'USE  ' : '     ') + c.name, right: c.desc.slice(0, 22), icon: c.icon, onSelect: () => { this.useItems[k] = !this.useItems[k]; const i2 = this.menu.idx; this.buildPrepMenu(); this.menu.idx = i2; } }); });
    items.push({ label: 'START THE SET', icon: 'gig', onSelect: () => this.startPlay() });
    const keep = this.menu ? this.menu.idx : items.length - 1; this.menu = new Menu(items); this.menu.idx = Math.min(keep, items.length - 1);
  }
  startPlay() {
    const r = Game.run; Audio.init(); Audio.setStageReverb(false);
    if (this.setlist.length < this.setSize) { Audio.ui('error'); this.setWarn = 1.4; return; }
    for (const k in this.useItems) if (this.useItems[k]) { const i = r.consumables.indexOf(k); if (i >= 0) { r.consumables.splice(i, 1); CONSUMABLES[k].use(r); } }
    this.songIdx = 0;
    this.startSong(0);
  }
  // Run one song of the set. Called again for each, so the show is continuous.
  startSong(idx) {
    const r = Game.run;
    this.songIdx = idx;
    this.setSong(this.setlist[idx]);
    this.known[this.tuneKey] = (this.known[this.tuneKey] || 0) + 1;
    this.performers = r.members.filter((m, i) => this.active[i]); if (!this.performers.length) this.performers = [r.members[0]];
    const leader = r.members[0], mates = this.performers.filter(m => !m.leader);
    const sections = []; let mi = 0;
    for (let b = 0; b < this.bars; b += 4) { const spot = (b / 4) % 2 === 1 && mates.length; if (spot) { const m = mates[mi++ % mates.length]; sections.push({ instrument: m.instrument, startBar: b, endBar: Math.min(this.bars, b + 4), qte: true, member: m }); } else sections.push({ instrument: leader.instrument, instr: gearInstrument(leader.instrument, leader.quality), startBar: b, endBar: Math.min(this.bars, b + 4), member: leader }); }
    this.sections = sections;
    const mods = r.gigMods(this.performers, this.difficulty, this.bossMod); mods.fx = { shake: Game.shake };
    mods.maxPhrases = 3;
    const notes = chartFromMelody(this.song, sections, this.difficulty, r.rng, { bombMult: (this.bossMod === 'heckler' ? 3 : 1) * (mods.bombMult || 1), starRate: mods.starRate || 0.08 });
    this.mods = mods;
    if (!this.S) this.S = new ScoreState(r, { instrument: leader.instrument, genre: this.song.genre, tune: this.tuneKey, performers: this.performers.length, band: this.performers, venue: this.venue, mode: this.mode, bossMod: this.bossMod, mods, songs: this.setSize, battle: !!(r.pendingGig && r.pendingGig.battle) });
    else this.S.setSection(false);
    // Instruments you actually play are run by ear: the band states a phrase
    // and you answer it on the real thing. Everything else keeps its chart.
    const lInstr = gearInstrument(leader.instrument, leader.quality);
    if (lInstr.game === 'ear') {
      this.surface = makeSurface(lInstr, this.song);
      this.rhythm = new EarGame(this.song, this.surface, mods, {
        onJudge: (n, j) => { const a = this.S.onHit({ midi: n.midi, star: false }, j, {}); if (a) this.fx.text(this.hatX + 30, this.L.groundY - 74, '+' + a, '#fff', { life: 0.6 }); },
        onPhase: (ph) => { if (ph === 'response') { this.cam.hit(2); Audio.ui('tick'); } },
        onMilestone: (ms) => { this.cutIn = { t: 0, ms }; this.cam.hit(3); this.cam.push(1.12, 0, -14, (Math.random() - 0.5) * 0.02); this.camHold = 1.1; },
      });
      this.rhythm.voice = lInstr.voice;
      this.rhythm.instr = lInstr; this.rhythm.instrKey = leader.instrument; this.rhythm.member = leader;
      this.earMode = true;
    } else this.rhythm = new RhythmGame(this.song, sections, notes, mods, {
      onJudge: (n, j, info) => { const a = this.S.onHit(n, j, info); if (a) this.fx.text(this.hatX + 30, this.L.groundY - 74, '+' + a, n.star ? '#ffd24a' : '#fff', { life: 0.6 }); this.duelJudge(j); this.thanksJudge(j, n); },
      onCheer: () => this.S.onCheer(), onQte: (j) => this.S.onQte(j), onRoll: () => this.S.onRoll(),
      onBombDodged: () => { this.S.onBombDodged(); if (this.mods.dodgeMult) this.S.multAdd += this.mods.dodgeMult; },
      onSection: (sec, isLast) => this.S.setSection(isLast),
      onMilestone: (ms) => {
        this.cutIn = { t: 0, ms };
        this.cam.hit(3); this.cam.push(1.12, 0, -14, (Math.random() - 0.5) * 0.02);
        this.camHold = 1.1;
      },
    });
    this.S.setSection(false);
    const wmul = (WEATHERS[r.weather] || WEATHERS.clear).tipMult;
    this.crowd = new Crowd(this.venue, Object.assign({}, mods, { bossMod: this.bossMod, range: 1, crowd: mods.crowd * wmul }), r.rng, { groundY: this.L.groundY, rows: this.L.rows, streetY: this.L.streetY, streetH: this.L.streetH, stageX: this.stageX, hatX: this.hatX, hatY: this.L.groundY - 6 });
    const start = Audio.now() + 0.6 + this.song.leadIn; this.rhythm.begin(start);
    if (this.earMode) {
      // the band vamps round the changes for as long as the lesson takes, and
      // drops out under a call so the phrase is the only thing you can hear
      const steps = Math.ceil(this.rhythm.totalLength / (this.song.beat / 4)) + 32;
      this.backing = new Backing(this.song, start - this.song.leadIn, () => {
        const quiet = this.rhythm.phase === 'call';
        return { bass: quiet, chords: quiet };
      }, { loop: true, steps });
    } else this.backing = new Backing(this.song, start - this.song.leadIn, (t) => { const sec = sections.find(s => t - start >= s.start - this.song.leadIn - 0.001 && t - start < s.end - this.song.leadIn); const ins = sec ? sec.instrument : null; return { drums: ins === 'drums', bass: ins === 'bass' }; });
    this.phase = 'play'; this.padKey = null; this.quakeT = 3;
    this.pauseBtn = new Btn(8, this.L.rhythmY + 6, 34, 20, 'II', () => this.togglePause(), { color: '#3a3560', hi: '#5a5490', lo: '#2a2540', ol: '#1a1430' });
    this.pauseButtons = [new Btn(W / 2 - 150, 240, 140, 34, 'RESUME', () => this.togglePause(), { scale: 2 }), new Btn(W / 2 + 10, 240, 140, 34, 'BAIL OUT', () => this.quit(), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14', scale: 2 })];
  }
  update(dt) {
    this.t += dt; this.fx.update(dt, Game.wind.px); this.haze.update(dt);
    if (this.setWarn) this.setWarn = Math.max(0, this.setWarn - dt);
    if (this.phase === 'play') {
      if (this.paused) return;
      // Nothing is on the glass, so nothing can be held. Browsers drop a
      // pointerup often enough on a phone that without this sweep a single
      // lost one leaves a pad stuck down for the rest of the song.
      if (!Game.pointers.size && (this.padPointers.size || this.dragDrum.size)) {
        for (const c of this.padPointers.values()) this.rhythm.keyUp(c);
        this.padPointers.clear(); this.dragDrum.clear();
      }
      this.backing.update(); this.rhythm.update(dt); this.updateDuel(dt);
      this.cam.update(dt);
      if (this.camHold != null) { this.camHold -= dt; if (this.camHold <= 0) { this.camHold = null; this.cam.reset(); } }
      // ---- the camera works the set like a crew would
      if (this.camHold == null && this.rhythm && !this.paused) {
        const hy = this.rhythm.hype / 100;
        if (this.L.open) {
          // cut between a handful of shots, holding each for a few bars, and
          // favour the tight ones once the crowd is going
          this.shotT = (this.shotT || 0) - dt;
          if (this.shotT <= 0) {
            const bar = this.song.beat * 4;
            this.shotT = bar * (2 + Math.floor(Math.random() * 3));
            const pool = this.earMode ? ['wide', 'wide', 'low'] : hy > 0.6 ? ['tight', 'tight', 'low', 'wide', 'over'] : ['wide', 'wide', 'tight', 'low'];
            this.shot = pool[Math.floor(Math.random() * pool.length)];
          }
          const kx = this.stageX + (this.openKit ? 244 : 120);
          // With an instrument in your hands the shot only breathes: a big pan
          // would drag the venue off the frame behind a keyboard that cannot
          // move with it. A kit stands in the scene, so it can take real moves.
          const SHOTS = this.earMode ? {
            wide: { z: 1.0,  x: 0,  y: 0,  r: 0.003 },
            low:  { z: 1.06, x: 0,  y: 12, r: 0.008 },
            tight: { z: 1.08, x: Math.round((kx - W / 2) * 0.25), y: -8, r: -0.005 },
          } : {
            wide:  { z: 1.0,  x: 0,             y: 0,   r: 0.004 },
            tight: { z: 1.26, x: kx - W / 2,    y: -18, r: -0.006 },
            low:   { z: 1.16, x: kx - W / 2 - 40, y: 24, r: 0.012 },
            over:  { z: 1.34, x: this.stageX - W / 2 + 60, y: -34, r: -0.014 },
          };
          const sh = SHOTS[this.shot] || SHOTS.wide;
          const breathe = Math.sin(this.t * 0.4) * 4;
          this.cam.push(sh.z + hy * 0.05, sh.x + breathe, sh.y - hy * 8, sh.r + Math.sin(this.t * 0.27) * 0.004);
          // and a small push on every downbeat, so the frame moves with the tune
          if (this.rhythm.onBeat && this.rhythm.lastBeat % 4 === 0) this.cam.hit(1.4);
        } else {
          this.cam.push(1 + hy * 0.035, Math.sin(this.t * 0.35) * 5, -hy * 6, Math.sin(this.t * 0.23) * 0.006);
        }
      }
      if (this.cutIn) { this.cutIn.t += dt; if (this.cutIn.t > 1.5) this.cutIn = null; }
      if (Game.touch) { const k = this.rhythm.section.qte ? 'qte' : this.rhythm.section.instrument; if (this.padKey !== k) { this.padKey = k; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, this.rhythm.section.qte); } }
      this.crowd.update(dt, this.rhythm.hype, this.rhythm.events, Game.wind.v, !this.earMode || this.rhythm.phase === 'response');
      this.S.watcherTick(dt, this.crowd.watchers.length, !this.earMode || this.rhythm.phase === 'response');
      if (this.bossMod === 'quake') { this.quakeT -= dt; if (this.quakeT <= 0) { this.quakeT = 4 + Math.random() * 5; Game.shake.hit(6, 0.6); Audio.drum('stomp', 0, 0.6); } }
      this.train.t -= dt; if (this.train.t < 0 && this.venue.kind === 'subway') { this.train.x += dt * 300; if (this.train.x > W + 400) { this.train.x = -700; this.train.t = 7 + Math.random() * 8; } }
      this.updateThanks(dt);
      if (this.rhythm.finished) this.songDone();
    } else if (this.phase === 'break') {
      // a beat between numbers: the crowd claps, you catch your breath
      this.songBreak.t += dt;
      this.crowd.update(dt, 70, { perfects: 0, misses: 0, cheer: 1 }, Game.wind.v);
      if (this.songBreak.t > 2.4) { this.songBreak = null; this.startSong(this.songIdx + 1); }
    } else if (this.phase === 'tally') { this.tallyT += dt; this.advanceTally(); }
  }
  // One song down. Bank it, put the next record on, and only tally the show
  // once all three have been played.
  songDone() {
    const res = this.rhythm.results();
    const T = this.showTotals;
    T.perfect += res.perfect; T.great += res.great; T.good += res.good; T.miss += res.miss;
    T.maxCombo = Math.max(T.maxCombo, res.maxCombo);
    if (this.backing) this.backing.stopped = true;
    if (this.songIdx + 1 < this.setlist.length) {
      Audio.applause(0.6, 1.1);
      // One song down, and the room is still yours: take something off the
      // table before the next record goes on.
      if (typeof UpgradeScene === 'function') {
        const here = this;
        Game.go(() => new UpgradeScene({
          run: Game.run, songIndex: this.songIdx,
          title: 'SONG ' + (this.songIdx + 1) + ' DOWN',
          onDone: () => {
            Game.go(() => {
              here.songBreak = { t: 0, next: here.setlist[here.songIdx + 1] };
              here.phase = 'break';
              here.mods = Game.run.gigMods(here.performers, here.difficulty, here.bossMod);
              return here;
            }, 'fade', { dur: 0.5 });
          },
        }), 'fade', { dur: 0.5 });
        return;
      }
      this.songBreak = { t: 0, next: this.setlist[this.songIdx + 1] };
      this.phase = 'break';
      return;
    }
    this.finish();
  }
  finish() {
    const r = Game.run, live = this.rhythm.results(), T = this.showTotals;
    // the tally is the whole show, not the last song of it
    const res = { perfect: T.perfect, great: T.great, good: T.good, miss: T.miss, maxCombo: Math.max(T.maxCombo, live.maxCombo) };
    res.total = res.perfect + res.great + res.good + res.miss;
    res.acc = res.total ? (res.perfect + res.great * 0.75 + res.good * 0.4) / res.total : 0;
    this.res = res;
    // Winning the room off her is the whole point of the finale, so it has to
    // be settled before the tally is run, not after it has already paid out.
    if (this.rival) {
      this.duelWon = this.rival.favour >= 0.75;
      if (this.duelWon) { this.S.addCash(60, 'You took the room from ' + RIVAL.name); this.S.timesMult(1.5, 'Headliner'); }
      else this.S.steps.push({ kind: 'note', label: RIVAL.name + ' kept the crowd (needed 75%)' });
    }
    const total = this.S.finish({ combo: this.rhythm.combo, maxCombo: res.maxCombo, misses: res.miss, watchers: this.crowd.watchers.length, hype: this.rhythm.hype, acc: res.acc });
    const tips = Math.round(this.crowd.earned * (this.mods.tipMult || 1) * 4) / 4;
    this.tips = tips; this.earned = total + tips;
    r.money += this.earned; r.stats.earned += this.earned; r.stats.gigs++; r.stats.bestCombo = Math.max(r.stats.bestCombo, res.maxCombo); r.stats.perfects += res.perfect; r.stats.bestPayout = Math.max(r.stats.bestPayout, this.earned);
    r.today.earned += this.earned; r.today.gigs++; r.today.bestCombo = Math.max(r.today.bestCombo, res.maxCombo); r.today.perfects += res.perfect;
    this.goalHit = checkGoals(r);
    r.lastTune = this.tuneKey; r.pendingGig = null; r.buffs = {};
    const st = 20 * (r.perks.stamina || 1) + (this.mods.staminaExtra || 0); this.xpLines = [];
    for (const m of this.performers) { m.stamina = Math.max(0, m.stamina - st * (m.hunger ? 1.4 : 1)); m.gigs++; const xp = 0.5 + res.acc * 1.5; m.xp += xp; let up = 0; while (m.xp >= 3 && m.skill < 10) { m.xp -= 3; m.skill++; up++; } if (up) this.xpLines.push(m.name + ' LV' + m.skill); }
    this.grade = res.acc >= 0.95 ? 'S' : res.acc >= 0.85 ? 'A' : res.acc >= 0.7 ? 'B' : res.acc >= 0.5 ? 'C' : 'D';
    // somebody in the third row filmed it on a phone
    if (typeof grantFollowers === 'function') {
      this.fame = grantFollowers(r, { acc: res.acc, perfects: res.perfect, maxCombo: res.maxCombo, watchers: this.crowd.watchers.length, mode: this.mode });
    }
    this.phase = 'tally'; this.tallyT = 0; this.tallyStep = 0; this.tallyDone = false;
    if (res.acc >= 0.7) Audio.applause(clamp(res.acc, 0.3, 1), 1.5);
    r.save();
  }
  advanceTally() {
    const steps = this.S.steps, per = 0.4, target = Math.min(steps.length + 1, Math.floor(this.tallyT / per));
    while (this.tallyStep < target) {
      const st = steps[this.tallyStep];
      if (st) { Audio.ui(st.kind === 'mult' ? 'stamp' : st.kind === 'times' ? 'mult' : st.kind === 'cash' ? 'coin' : 'tally'); this.fx.burst(W / 2, 110, 8, { color: st.kind === 'mult' || st.kind === 'times' ? '#ff5a5a' : '#5bc0ff', speed: 60, life: 0.4, kind: 'spark' }); }
      else if (!this.tallyDone) { this.tallyDone = true; Audio.ui('cash'); this.fx.burst(W / 2, 150, 34, { color: ['#ffd24a', '#fff', '#6be585'], speed: 130, life: 0.8, kind: 'star', size: 2, gravity: 60 }); }
      this.tallyStep++;
    }
  }
  next() { Game.go(() => new DraftScene(this), 'vinyl'); }
  key(code) {
    if (this.phase === 'prep') {
      if (['Enter', 'Space'].includes(code)) this.startPlay();
      else if (code === 'Escape') Game.go(() => new CityScene(), 'slideR');
      else if (code === 'ArrowLeft' || code === 'KeyA') { this.prepSel = ((this.prepSel || 0) - 1 + Game.run.members.length) % Game.run.members.length; Audio.ui('move'); }
      else if (code === 'ArrowRight' || code === 'KeyD') { this.prepSel = ((this.prepSel || 0) + 1) % Game.run.members.length; Audio.ui('move'); }
      else if (code === 'KeyX' || code === 'ArrowUp' || code === 'ArrowDown') this.toggleMember(this.prepSel || 0);
      return;
    }
    if (this.phase === 'tally') { if (!this.tallyDone) { if (['Enter', 'Space'].includes(code)) this.tallyT = 999; return; } if (['Enter', 'Space'].includes(code)) this.next(); return; }
    if (code === 'Escape') { this.togglePause(); return; }
    if (this.paused) { if (code === 'KeyQ') this.quit(); return; }
    // the thank-you window takes the key before the chart does, so bowing
    // never costs you a note
    if (this.thanks && !this.thanks.hit && ['Space', 'Enter', 'KeyZ'].includes(code)) { this.takeThanks(); return; }
    this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play' && !this.paused) this.rhythm.keyUp(code); }
  togglePause() { this.paused = !this.paused; if (Audio.ctx) { if (this.paused) Audio.ctx.suspend(); else Audio.ctx.resume(); } this.rhythm.keysDown.clear(); }
  quit() { if (Audio.ctx) Audio.ctx.resume(); this.backing.stop(); this.rhythm.finished = true; this.paused = false; this.S.applause *= 0.5; this.finish(); }
  padAt(x, y) { return this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h); }
  // Which drum is under the pointer? Nearest wins where two overlap, so a tap
  // between a tom and a crash always resolves to something.
  drumAt(x, y) {
    const spots = this.rhythm && this.rhythm.kitSpots; if (!spots) return null;
    let best = null, bestD = Infinity;
    for (const sp of spots) {
      if (!kitHit(sp, x, y)) continue;
      const d = (x - sp.x) * (x - sp.x) + (y - sp.y) * (y - sp.y) * 2.6;
      if (d < bestD) { bestD = d; best = sp; }
    }
    return best;
  }
  // The drum closest to a point, hit radius or not: what a strike in open air
  // should sound like when the chart is asking for nothing.
  nearestDrum(x, y) {
    const spots = this.rhythm && this.rhythm.kitSpots; if (!spots || !spots.length) return null;
    let best = null, bestD = Infinity;
    for (const sp of spots) { const d = (x - sp.x) * (x - sp.x) + (y - sp.y) * (y - sp.y) * 2.6; if (d < bestD) { bestD = d; best = sp; } }
    return best;
  }
  pointerDown(x, y, id) {
    if (this.phase === 'prep') {
      if (this.startBtn && this.startBtn.hit(x, y)) { this.startBtn.onTap(); return; }
      if (this.backBtn && this.backBtn.hit(x, y)) { this.backBtn.onTap(); return; }
      for (const sv of (this.sleeves || [])) if (x >= sv.x && x < sv.x + sv.w && y >= sv.y && y < sv.y + sv.h) { this.toggleSong(sv.key); return; }
      for (const sl of (this.setSlots || [])) if (x >= sl.x && x < sl.x + sl.w && y >= sl.y && y < sl.y + sl.h) { const k = this.setlist[sl.i]; if (k) this.toggleSong(k); return; }
      for (const l of (this.lineup || [])) if (x >= l.x && x < l.x + l.w && y >= l.y && y < l.y + l.h) { this.toggleMember(l.i); return; }
      return;
    }
    if (this.phase === 'tally') { if (!this.tallyDone) { this.tallyT = 999; return; } this.next(); return; }
    if (this.thanks && !this.thanks.hit) { this.takeThanks(); return; }
    if (this.paused) { for (const b of this.pauseButtons) if (b.hit(x, y)) { b.onTap(); return; } return; }
    if (this.pauseBtn.hit(x, y)) { this.pauseBtn.onTap(); return; }
    const pad = this.padAt(x, y); if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); return; }
    // A kit is played by hitting the drums themselves, mouse or finger alike.
    // A kit is struck wherever you touch, and the stage uses the same code.
    if (kitPointerDown(this, x, y, id)) return;
    // ...and a kit takes a strike anywhere in the scene. Hunting a small
    // sprite with a mouse inside one beat was the whole difficulty, so a tap
    // in open air lands on the drum the chart wants and scores in full. With
    // nothing due it still sounds the nearest drum, so you can noodle.

    // Keys and necks are played on the instrument: the note under your finger
    // is the note that sounds, exactly as it would be in the room.
    if (earPointerDown(this, x, y, id)) return;
    if (Game.touch && this.rhythm.section.qte) { this.padPointers.set(id, 'Space'); this.rhythm.keyDown('Space'); }
  }
  pointerMove(x, y, id) {
    if (this.phase !== 'play' || this.paused) return;
    if (kitPointerMove(this, x, y, id)) return;
    const prev = this.padPointers.get(id); if (prev === undefined) return;
    if (earPointerMove(this, x, y, id)) return;
    const pad = this.padAt(x, y); let next = pad ? pad.code : null;
    if (next === prev) return;
    this.rhythm.keyUp(prev);
    if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id);
  }
  pointerUp(x, y, id) {
    kitPointerUp(this, id);
    const c = this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); }
    earPointerUp(this, id);
  }
  hover(x, y) { if (this.phase === 'prep') for (const l of (this.lineup || [])) if (x >= l.x && x < l.x + l.w && y >= l.y && y < l.y + l.h) this.prepSel = l.i; }
  toggleMember(i) {
    const r = Game.run; if (i == null || !r.members[i]) return;
    if (i === 0) { Audio.ui('error'); return; }                 // the leader always plays
    const onCount = this.active.filter(Boolean).length;
    if (this.active[i] && onCount <= 1) { Audio.ui('error'); return; }
    this.active[i] = !this.active[i]; Audio.ui(this.active[i] ? 'select' : 'back');
    this.prepSel = i;
  }
  drawStage(ctx) {
    const L = this.L; drawVenue(ctx, this.V, L, this.t, Game.wind, this.venue);
    ctx.save(); ctx.beginPath(); ctx.rect(0, L.stageTop, W, L.stageBottom - L.stageTop); ctx.clip();
    if (this.venue.kind === 'subway' && this.train.t < 0 && L.streetY) { const tx = Math.round(this.train.x), ty = L.streetY + 4; rect(ctx, tx, ty, 700, 34, '#c8c8d0'); rect(ctx, tx, ty, 700, 3, '#e8e8f0'); rect(ctx, tx, ty + 26, 700, 5, '#2a4a9a'); for (let x = tx + 10; x < tx + 700; x += 34) { rect(ctx, x, ty + 7, 22, 14, '#ffe8a0'); } }
    const perf = this.performers || Game.run.members, cur = this.rhythm ? this.rhythm.section.member : null;
    const onBeat = this.rhythm ? (this.rhythm.onBeat || this.rhythm.beatPulse > 0.78) : false;
    if (this.crowd) { this.crowd.drawCars(ctx, 0); this.crowd.drawPeds(ctx, [2]); }
    const celebrate = this.phase === 'tally';
    drawBand(ctx, perf, cur, this.stageX, L.groundY + L.rows[1], this.t, onBeat, this.hatX, 0, celebrate);
    if (this.crowd) this.crowd.drawPigeons(ctx);
    drawBand(ctx, perf, cur, this.stageX, L.groundY + L.rows[1], this.t, onBeat, this.hatX, 1, celebrate);
    if (this.crowd) { this.crowd.drawPeds(ctx, [1, 0]); this.crowd.drawCars(ctx, 1); this.crowd.drawCoins(ctx); }
    this.fx.draw(ctx); ctx.restore();
    const wk = WEATHERS[Game.run.weather] || WEATHERS.clear;
    if (wk.tint) { ctx.fillStyle = wk.tint; ctx.fillRect(0, L.stageTop, W, L.stageBottom - L.stageTop); }
    // ---- finish. A pavement is not a mirror, so no reflection out here: just
    // air you can see the light hanging in, and enough bloom that the lamps
    // and the brass glow without washing the cast out.
    const sTop = L.stageTop, sBot = Math.min(H, L.stageBottom);
    if (this.phase === 'play' && sBot > sTop) {
      // haze only hangs where the light actually pools: a band just above the
      // ground. Across a bright sky it reads as a smear, not as air.
      const hzTop = Math.max(sTop, L.groundY - 96);
      this.haze.draw(ctx, 0, hzTop, W, Math.max(0, L.groundY - hzTop), '#c8d4f0');
      bloom(ctx, 0, sTop, W, sBot - sTop, 0.05, 1);
    }
    
  }
  // Between numbers: the record you just played, and the one going on next.
  drawBreak(ctx) {
    const L = this.L, b = this.songBreak, k = clamp(b.t / 0.4, 0, 1);
    this.drawStage(ctx);
    ctx.globalAlpha = 0.55 * k; rect(ctx, 0, 0, W, H, '#0a0812'); ctx.globalAlpha = 1;
    const cy = H / 2 - 10;
    const slide = (1 - easeOutBack(k)) * 90;
    drawText(ctx, 'SONG ' + (this.songIdx + 2) + ' OF ' + this.setlist.length, W / 2, cy - 108 + slide, '#cfc9e6', { align: 'center', scale: 2 });
    // the sleeve of what is coming, big
    const S = 120;
    drawSleeve(ctx, b.next, W / 2 - S / 2, cy - 66 + slide, S, { selected: true });
    const t2 = TUNES[b.next];
    drawText(ctx, t2.title.toUpperCase(), W / 2, cy + 66 + slide, '#ffd98a', { align: 'center', scale: 3, outline: '#1a1410' });
    drawText(ctx, t2.composer.toUpperCase(), W / 2, cy + 92 + slide, '#b8aed0', { align: 'center' });
    if (b.t > 1.5) { ctx.globalAlpha = 0.6 + 0.4 * Math.sin(this.t * 6); drawText(ctx, 'COUNTING IN', W / 2, cy + 114 + slide, '#6be585', { align: 'center' }); ctx.globalAlpha = 1; }
    this.fx.draw(ctx);
  }
  // ---------- The duel ----------
  // Every judgement moves the crowd. Land them and the favour swings to you;
  // drop them and she takes it back. Crossing a third of the bar flips her
  // into the next phase, which changes what she is doing to you.
  duelJudge(j) {
    const R = this.rival; if (!R || R.downed) return;
    const d = j === 'perfect' ? 0.022 : j === 'great' ? 0.013 : j === 'good' ? 0.004 : -0.028;
    R.favour = clamp(R.favour + d, 0, 1);
    if (d > 0) { R.hurt = Math.min(1, R.hurt + 0.5); R.flash = 0.2; }
    // she answers when you take a chunk off her
    const want = R.favour > 0.66 ? 2 : R.favour > 0.33 ? 1 : 0;
    const next = Math.max(R.phase, want);
    if (next !== R.phase) {
      R.phase = next;
      this.bossMod = RIVAL.phases[next].mod;
      if (this.rhythm && this.rhythm.mods) this.rhythm.mods.bossMod = this.bossMod;
      R.taunt = RIVAL.taunts[next]; R.tauntT = 3;
      this.cam.hit(5); Game.shake.hit(6, 0.4); Audio.ui('boo');
      this.fx.burst(W * 0.78, this.L.groundY - 40, 26, { color: [RIVAL.phases[next].color, '#fff'], speed: 130, life: 0.8, kind: 'spark', gravity: 40, size: 2 });
    }
    if (R.favour >= 1 && !R.downed) { R.downed = true; R.taunt = 'Then it is yours.'; R.tauntT = 4; Audio.ui('fanfare'); Game.shake.hit(9, 0.6); }
  }
  updateDuel(dt) {
    const R = this.rival; if (!R) return;
    R.tauntT = Math.max(0, R.tauntT - dt);
    R.hurt = Math.max(0, R.hurt - dt * 1.6);
    R.flash = Math.max(0, R.flash - dt * 4);
    // she works the crowd back while you are not scoring
    if (!R.downed && this.rhythm && this.rhythm.now > 0) R.favour = clamp(R.favour - dt * 0.012, 0, 1);
  }
  // Her side of the stage, and the bar that says who the room belongs to.
  drawDuel(ctx) {
    const R = this.rival; if (!R) return;
    const L = this.L, gy = L.groundY, rx = Math.round(W * 0.8);
    // the rival, lit from behind, sagging as she loses the room
    const slump = R.downed ? 10 : Math.round(R.favour * 8);
    drawShadow(ctx, rx, gy + slump, 46, 0.32);
    ctx.globalAlpha = R.downed ? 0.6 : 1;
    lightPool(ctx, rx, gy - 40, 90, RIVAL.phases[R.phase].color, 0.18);
    drawBugAt(ctx, R.spec, rx, gy + slump, {
      pose: R.downed ? 'sad' : (Math.floor(this.t * 4) % 2 ? 'play' : 'play2'),
      expr: R.downed ? 'sad' : R.hurt > 0.3 ? 'shock' : 'angry',
      scale: 2.1, rate: 3.4, bounce: R.downed ? 0.3 : 1.6,
    });
    ctx.globalAlpha = 1;
    if (R.flash > 0) { ctx.globalAlpha = R.flash; ellipsePx(ctx, rx, gy - 34, 40, 44, '#ffffff'); ctx.globalAlpha = 1; }
    // her name plate
    const nm = RIVAL.name, nw = textWidth(nm) + 16;
    rect(ctx, rx - nw / 2, gy + 10, nw, 13, '#1a1420');
    frame(ctx, rx - nw / 2, gy + 10, nw, 13, RIVAL.phases[R.phase].color);
    drawText(ctx, nm, rx, gy + 13, RIVAL.phases[R.phase].color, { align: 'center' });
    // ---- the favour bar, across the top: her side against yours
    const bw = 420, bx = Math.round(W / 2 - bw / 2), by = 40;
    rect(ctx, bx - 3, by - 3, bw + 6, 20, '#15121c');
    frame(ctx, bx - 3, by - 3, bw + 6, 20, '#6a5f8a');
    rect(ctx, bx, by, bw, 14, '#2a2036');
    const mine = Math.round(bw * R.favour);
    for (let i = 0; i < mine; i++) rect(ctx, bx + i, by, 1, 14, i > mine - 4 ? '#fff6d0' : mixColor('#e8563f', '#ffd24a', i / bw));
    rect(ctx, bx + mine, by, bw - mine, 14, RIVAL.phases[R.phase].color);
    ctx.globalAlpha = 0.25; halftone(ctx, bx + mine, by, bw - mine, 14, '#000000', 4, 1); ctx.globalAlpha = 1;
    // the marker where the room currently stands
    rect(ctx, bx + mine - 1, by - 4, 3, 22, '#ffffff');
    drawText(ctx, 'YOU', bx + 4, by + 4, '#fff6d0', { font: 'small' });
    drawText(ctx, RIVAL.title, bx + bw - 4, by + 4, '#1a1420', { align: 'right', font: 'small' });
    // which phase she is in
    const ph = RIVAL.phases[R.phase];
    drawText(ctx, 'PHASE ' + (R.phase + 1) + '  ' + ph.name + '  -  ' + ph.desc, W / 2, by + 22, ph.color, { align: 'center', font: 'small' });
    // and what she has to say about it
    if (R.tauntT > 0 && R.taunt) {
      ctx.globalAlpha = clamp(R.tauntT, 0, 1);
      const tw = textWidth(R.taunt) + 20;
      rect(ctx, rx - tw / 2, gy - 104, tw, 18, 'rgba(14,10,20,0.88)');
      frame(ctx, rx - tw / 2, gy - 104, tw, 18, ph.color);
      drawText(ctx, R.taunt, rx, gy - 99, '#f0e8ff', { align: 'center' });
      ctx.globalAlpha = 1;
    }
  }
  // The set read-outs live outside the camera: the shot moves, the HUD does not.
  drawSetHud(ctx) {
    const L = this.L; if (!this.rhythm) return;
      // ---- the hype gauge: a brass-cased meter with real ticks and a needle
      const hh = this.earMode ? 132 : L.open ? 150 : Math.min(130, L.stageBottom - L.stageTop - 30);
      const hx = W - 34, hy = this.earMode ? 92 : L.open ? H - 58 - hh - 10 : L.stageTop + 8;
      const hype = this.rhythm.hype, hot = hype > 70, warm = hype > 40;
      const hcol = hot ? '#ff5a9a' : warm ? '#ffd166' : '#6fb8ff';
      rect(ctx, hx - 4, hy - 12, 20, hh + 18, '#171320');
      frame(ctx, hx - 4, hy - 12, 20, hh + 18, '#6a5f8a');
      rect(ctx, hx - 3, hy - 11, 18, 1, '#8f83b4');
      drawText(ctx, 'HYPE', hx + 6, hy - 9, hcol, { align: 'center', font: 'small' });
      rect(ctx, hx - 1, hy - 1, 14, hh + 2, '#0c0a14');
      const fill = Math.round(hh * hype / 100);
      // the column, brightening toward the top
      for (let i = 0; i < fill; i++) {
        const k = i / Math.max(1, hh), y2 = hy + hh - 1 - i;
        rect(ctx, hx, y2, 12, 1, i > fill - 3 ? lighten(hcol, 0.3) : k > 0.72 ? '#ff5a9a' : k > 0.42 ? '#ffd166' : '#6fb8ff');
        if (i % 6 === 0) { ctx.globalAlpha = 0.3; rect(ctx, hx, y2, 12, 1, '#ffffff'); ctx.globalAlpha = 1; }
      }
      // tick marks up the case, heavier at the quarters
      for (let i = 0; i <= 8; i++) { const ty = hy + hh - Math.round(hh * i / 8); rect(ctx, hx + 12, ty, i % 2 ? 2 : 4, 1, '#8f83b4'); }
      frame(ctx, hx - 1, hy - 1, 14, hh + 2, '#4a4270');
      if (hype > 80 && Math.random() < 0.6) this.fx.add({ x: hx + 6 + (Math.random() - 0.5) * 8, y: hy + hh - fill, vx: 0, vy: -40, life: 0.5, color: '#ff9030', kind: 'fire', size: 3, gravity: 0 });
      const rdY = this.earMode ? 32 : L.open ? H - 58 : L.stageTop + 6;
      rect(ctx, W - 196, rdY, 156, 44, 'rgba(10,8,20,0.74)'); frame(ctx, W - 196, rdY, 156, 44, '#3a3560');
      rect(ctx, W - 195, rdY + 1, 154, 1, '#5a5490');
      drawText(ctx, fmtNum(this.S.applause), W - 48, rdY + 4, '#fff', { align: 'right', scale: 3 });
      ctx.drawImage(icon('heart'), W - 190, rdY + 28, 12, 10); drawText(ctx, this.crowd.watchers.length + '', W - 174, rdY + 29, '#cfc9e6');
      ctx.drawImage(icon('coin'), W - 138, rdY + 27, 13, 12); drawText(ctx, fmtMoney(this.crowd.earned), W - 120, rdY + 29, '#ffd24a');
      this.drawGratitude(ctx, W - 196, rdY + 50, 156);
      this.drawThanks(ctx);
  }
  // ---- Saying thank you.
  // Busking is not only playing. The crowd builds while you hold a run of
  // clean notes, and when enough of them have stopped, there is a moment to
  // look up and thank them. Take it on time and they empty their pockets.
  thanksJudge(j, n) {
    if (this.thanks) return;
    if (j === 'perfect') this.grat = Math.min(1, (this.grat || 0) + 0.035 + (n && n.star ? 0.03 : 0));
    else if (j === 'great') this.grat = Math.min(1, (this.grat || 0) + 0.014);
    else if (j === 'miss') this.grat = Math.max(0, (this.grat || 0) - 0.06);
    if ((this.grat || 0) >= 1 && !this.thanksDone) {
      this.thanks = { t: 0, len: 2.1, hit: null };
      Audio.ui('pop');
    }
  }
  // the window is the middle third of the bar sweeping across
  takeThanks() {
    const T = this.thanks; if (!T || T.hit) return;
    const k = T.t / T.len;
    const off = Math.abs(k - 0.5);
    const good = off < 0.07, ok = off < 0.16;
    T.hit = good ? 'perfect' : ok ? 'ok' : 'miss';
    const r = Game.run;
    if (good) {
      const bonus = 2 + Math.round((this.crowd ? this.crowd.watchers.length : 4) * 0.5);
      this.crowd.earned += bonus;
      r.gratitude = (r.gratitude || 0) + 1;
      this.fx.text(W / 2, this.L.groundY - 120, 'THANK YOU  +' + fmtMoney(bonus), '#6be585', { life: 1.4, scale: 3 });
      for (let i = 0; i < 18; i++) this.fx.add({ x: this.hatX + 30 + (Math.random() - 0.5) * 120, y: this.L.groundY - 120, vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 60, life: 1.1, color: '#ffd24a', kind: 'star', size: 2, gravity: 220 });
      Audio.ui('fanfare'); Audio.roar(1.2, 0.25);
    } else if (ok) {
      const bonus = 1 + Math.round((this.crowd ? this.crowd.watchers.length : 4) * 0.2);
      this.crowd.earned += bonus;
      this.fx.text(W / 2, this.L.groundY - 120, 'THANKS  +' + fmtMoney(bonus), '#ffd24a', { life: 1.2, scale: 2 });
      Audio.ui('coin');
    } else {
      this.fx.text(W / 2, this.L.groundY - 120, 'THE MOMENT PASSES', '#e0785a', { life: 1.2, scale: 2 });
      Audio.ui('error');
    }
    this.thanksDone = true; this.grat = 0;
  }
  updateThanks(dt) {
    const T = this.thanks; if (!T) return;
    T.t += dt;
    if (T.hit && T.t > T.len * 0.5 + 0.9) { this.thanks = null; return; }
    if (!T.hit && T.t > T.len) { this.takeThanks(); }
  }
  drawThanks(ctx) {
    const T = this.thanks; if (!T) return;
    const bw = 340, bx = W / 2 - bw / 2, by = this.L.open ? 96 : this.L.stageTop + 56;
    ctx.globalAlpha = 0.85; rect(ctx, bx - 8, by - 30, bw + 16, 72, '#0b0914'); ctx.globalAlpha = 1;
    frame(ctx, bx - 8, by - 30, bw + 16, 72, '#c8a03a');
    drawText(ctx, 'LOOK UP AND SAY THANK YOU', W / 2, by - 24, '#ffe9a8', { align: 'center', scale: 2 });
    rect(ctx, bx, by, bw, 18, '#241d33');
    // the sweet spot, then the wider one either side of it
    rect(ctx, bx + bw * 0.34, by, bw * 0.32, 18, '#3a5f3a');
    rect(ctx, bx + bw * 0.43, by, bw * 0.14, 18, '#6be585');
    const k = clamp(T.t / T.len, 0, 1);
    rect(ctx, bx + bw * k - 2, by - 4, 4, 26, '#fff8e0');
    frame(ctx, bx, by, bw, 18, '#4a4068');
    if (T.hit) drawText(ctx, T.hit === 'perfect' ? 'PERFECT' : T.hit === 'ok' ? 'CLOSE' : 'MISSED IT', W / 2, by + 24, T.hit === 'miss' ? '#e0785a' : '#6be585', { align: 'center', scale: 2 });
    else drawText(ctx, Game.touch ? 'TAP' : 'SPACE', W / 2, by + 24, '#8ad8ff', { align: 'center', scale: 2 });
  }
  // the meter itself, beside the takings
  drawGratitude(ctx, x, y, w) {
    const g = this.grat || 0;
    rect(ctx, x, y, w, 8, '#241d33');
    rect(ctx, x, y, Math.round(w * g), 8, g >= 1 ? '#6be585' : '#c8a03a');
    if (g >= 1) { ctx.globalAlpha = 0.4 + 0.3 * Math.sin(this.t * 8); rect(ctx, x, y, w, 8, '#fff8e0'); ctx.globalAlpha = 1; }
    frame(ctx, x, y, w, 8, '#4a4068');
    drawText(ctx, 'GRATITUDE', x, y - 10, '#8a82a8', { font: 'small' });
  }
  // Standing outside the venue before the set. The scene does the talking:
  // the band is on the pavement, you tap a bug to put them in or out.
  drawPrep(ctx) {
    const r = Game.run, t = this.t, L = this.L;
    // the venue, full frame
    const big = Object.assign({}, L, { top: false, stageTop: 26, stageBottom: H, groundY: 424, rows: [0, -10, -20], streetY: 474, streetH: 66, compact: false });
    const saved = this.L; this.L = big;
    drawVenue(ctx, this.V, big, t, Game.wind, this.venue);
    if (this.crowd) { this.crowd.drawCars(ctx, 0); this.crowd.drawPeds(ctx, [2, 1, 0]); this.crowd.drawCars(ctx, 1); }
    this.L = saved;
    // ---- the band, lined up on the pavement
    this.lineup = [];
    const n = r.members.length, spacing = Math.min(112, 760 / Math.max(1, n));
    r.members.forEach((m, i) => {
      const x = W / 2 - (n - 1) * spacing / 2 + i * spacing, y = 424;
      const on = this.active[i];
      drawShadow(ctx, x, y, on ? 44 : 34, on ? 0.3 : 0.18);
      if (!on) ctx.globalAlpha = 0.55;
      drawBugAt(ctx, m.spec, x, y, {
        pose: on ? (Math.floor(t * 3 + i) % 2 ? 'play' : 'play2') : 'sad',
        expr: on ? null : 'sad',
        instrument: on && m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null,
        scale: on ? 1.9 : 1.5, rate: on ? 2.6 : 1.2, phase: i * 1.4 });
      if (on && m.instrument === 'drums') ctx.drawImage(propInstrument('drums'), x - 40, y - 46, 80, 60);
      if (on && m.instrument === 'piano') ctx.drawImage(propInstrument('piano'), x - 38, y - 32, 76, 40);
      ctx.globalAlpha = 1;
      // name plate and stamina, right under their feet
      const nm = m.name.toUpperCase(), nw = textWidth(nm) + 14;
      rect(ctx, x - nw / 2, y + 6, nw, 13, on ? '#4f8032' : 'rgba(16,14,24,0.7)');
      frame(ctx, x - nw / 2, y + 6, nw, 13, on ? '#7fc45a' : '#4a4268');
      drawText(ctx, nm, x, y + 9, on ? '#f2ffe4' : '#a89fc0', { align: 'center' });
      uiBar(ctx, x - 22, y + 21, 44, 6, m.stamina / 100, m.stamina > 50 ? '#6fbf4a' : '#e0783a');
      if (on) { ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 4 + i); ringPx(ctx, x, y - 34, 32, '#ffd24a'); ctx.globalAlpha = 1; }
      this.lineup.push({ x: x - 34, y: y - 96, w: 68, h: 120, i });
    });
    // ---- the crate: flip through the records and build a three-song set
    this.sleeves = []; this.setSlots = [];
    const SZ = 74, gap = 10, n2 = this.crate.length;
    const totalW = n2 * SZ + (n2 - 1) * gap;
    const cx0 = Math.round((W - totalW) / 2), cy0 = 60;
    // the crate itself, with a divider card behind the records
    rect(ctx, cx0 - 14, cy0 - 12, totalW + 28, SZ + 40, 'rgba(30,20,16,0.82)');
    frame(ctx, cx0 - 14, cy0 - 12, totalW + 28, SZ + 40, '#6a4a2c');
    rect(ctx, cx0 - 13, cy0 - 11, totalW + 26, 2, '#9a7048');
    rect(ctx, cx0 - 14, cy0 + SZ + 24, totalW + 28, 4, '#4a3220');
    this.crate.forEach((k, i) => {
      const x = cx0 + i * (SZ + gap), y = cy0 + (this.setlist.includes(k) ? -6 : 0);
      const chosen = this.setlist.indexOf(k);
      drawSleeve(ctx, k, x, y, SZ, { selected: chosen >= 0 });
      if (chosen >= 0) {
        rect(ctx, x + SZ - 15, y - 4, 15, 13, '#d9a520'); frame(ctx, x + SZ - 15, y - 4, 15, 13, '#1a1410');
        drawText(ctx, String(chosen + 1), x + SZ - 8, y - 1, '#2a2010', { align: 'center' });
      }
      // how many times you have played it: a tune you know is worth less
      const plays = this.known[k] || 0;
      if (plays > 0) { rect(ctx, x, y + SZ - 9, 30, 9, 'rgba(10,8,16,0.8)'); drawText(ctx, 'x' + plays, x + 3, y + SZ - 7, '#8a80b0', { font: 'small' }); }
      this.sleeves.push({ x, y, w: SZ, h: SZ, key: k });
    });
    // the set, written on a strip of tape stuck to the floor monitor
    const slotY = cy0 + SZ + 34, sw = 172;
    const sx0 = Math.round(W / 2 - (this.setSize * (sw + 8) - 8) / 2);
    for (let i = 0; i < this.setSize; i++) {
      const x = sx0 + i * (sw + 8), k = this.setlist[i];
      rect(ctx, x, slotY, sw, 22, k ? '#e8dcbc' : 'rgba(20,16,26,0.7)');
      frame(ctx, x, slotY, sw, 22, k ? '#9a8a60' : '#4a4268');
      drawText(ctx, String(i + 1) + '.', x + 6, slotY + 7, k ? '#8a7a50' : '#5a5480');
      if (k) drawText(ctx, TUNES[k].title.toUpperCase().slice(0, 20), x + 22, slotY + 7, '#3a2e18');
      else drawText(ctx, 'PICK A RECORD', x + 22, slotY + 7, '#5a5480');
      this.setSlots.push({ x, y: slotY, w: sw, h: 22, i });
    }
    if (this.setWarn > 0) { ctx.globalAlpha = clamp(this.setWarn, 0, 1); drawText(ctx, 'PICK ' + this.setSize + ' SONGS FIRST', W / 2, slotY + 28, '#ff8a6a', { align: 'center', outline: '#1a1410' }); ctx.globalAlpha = 1; }
    if (this.bossMod) {
      const bm = BOSS_MODS[this.bossMod], bw = textWidth(bm.name.toUpperCase() + '  ' + bm.desc) + 40;
      rect(ctx, W / 2 - bw / 2, 112, bw, 20, bm.color); frame(ctx, W / 2 - bw / 2, 112, bw, 20, '#1a1410');
      ctx.drawImage(icon('skull'), W / 2 - bw / 2 + 6, 115, 13, 12);
      drawText(ctx, bm.name.toUpperCase() + '  ' + bm.desc, W / 2 + 10, 118, '#1a1410', { align: 'center' });
    }
    // ---- one button, and a one-line nudge
    vignette(ctx, 0.34);
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
    drawText(ctx, 'TAP A BUG TO SIT THEM OUT', W / 2, H - 74, '#e8dcc0', { align: 'center', outline: '#1a1410' });
    ctx.globalAlpha = 1;
    this.startBtn = new Btn(W / 2 - 130, H - 58, 260, 40, 'START THE SET', () => this.startPlay(), { scale: 3 });
    this.startBtn.draw(ctx);
    this.backBtn = new Btn(16, H - 50, 96, 30, 'LEAVE', () => Game.go(() => new CityScene(), 'slideR'), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14', scale: 2 });
    this.backBtn.draw(ctx);
  }
  // A comic cut-in: the player, close up, at the moment the combo lands.
  drawCutIn(ctx) {
    const c = this.cutIn, k = clamp(c.t / 1.5, 0, 1);
    const inK = clamp(c.t / 0.14, 0, 1), outK = clamp((c.t - 1.15) / 0.35, 0, 1);
    const slide = (1 - easeOutBack(inK)) * 260 + outK * 260;
    const m = Game.run.members[0];
    const pw = 240, ph = 150, px2 = W - pw - 26 + slide, py = this.L.top ? 170 : 52;
    comicPanel(ctx, px2, py, pw, ph, -0.045, (g, w, h) => {
      vgrad(g, 0, 0, w, h, '#3a2a52', '#1a1424');
      halftone(g, 0, 0, w, h, '#ffd24a', 7, 0.2);
      speedLines(g, w * 0.5, h * 0.56, 30, 150, 18, '#ffffff', this.t, 0.3);
      drawShadow(g, w * 0.5, h - 10, 70, 0.3);
      drawBugAt(g, m.spec, w * 0.5, h - 6, { pose: Math.floor(this.t * 12) % 2 ? 'play' : 'play2', expr: 'focus',
        instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 2.4, rate: 6, tilt: -0.05 });
      rect(g, 0, h - 22, w, 22, 'rgba(20,14,28,0.8)');
      drawText(g, c.ms + ' COMBO', w / 2, h - 17, '#ffd98a', { align: 'center', scale: 2, outline: '#1a1410' });
    });
    if (c.t < 0.5) comicBurst(ctx, px2 + 24, py + 16, c.ms >= 50 ? 'WOW!' : 'HOT!', '#ff5a5a', c.t * 2, 0.8);
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0b0916'); const L = this.L;
    if (this.phase === 'prep') { this.drawPrep(ctx); Game.drawHud(ctx); return; }
    if (this.phase === 'break') { this.drawBreak(ctx); Game.drawHud(ctx); return; }
    if (this.phase === 'play') {
      const rA = { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads, backdrop: this.V.far,
        overlay: !!L.overlay, kit: L.open ? { cx: W / 2, baseY: H - 146, width: W, zoom: 2 } : null };
      // On an open stage the venue is the picture and the kit stands in it, so
      // the scene is painted first and the drums go on top of the ground.
      if (L.open) {
        this.cam.apply(ctx, W / 2, L.groundY - 40);
        this.drawStage(ctx);
        // The kit stands in the scene, so it rides the shot. An instrument in
        // your hands does not: it stays put while the camera moves behind it.
        // A full-size kit stands in front of the whole scene, filling the
        // bottom of the screen, so it does not ride the shot: a camera move
        // would swim the one thing your hands are on.
        if (!this.earMode && !this.openKit) this.rhythm.draw(ctx, rA);
        this.cam.done(ctx);
        if (this.earMode || this.openKit) this.rhythm.draw(ctx, rA);
      } else {
        this.rhythm.draw(ctx, rA);
        this.cam.apply(ctx, W / 2, L.top ? L.stageBottom : (L.stageTop + L.stageBottom) / 2);
        this.drawStage(ctx);
        this.cam.done(ctx);
      }
      this.drawSetHud(ctx);
      if (this.rival) this.drawDuel(ctx);
      if (this.cutIn) this.drawCutIn(ctx);
      const p = this.rhythm.progress != null ? this.rhythm.progress : clamp(this.rhythm.now / this.song.length, 0, 1);
      const barY = L.open ? 25 : (L.top ? L.stageBottom : L.stageTop - 4);
      rect(ctx, 0, barY, W, 5, '#1b1626'); rect(ctx, 0, barY, W, 1, '#332b46');
      rect(ctx, 0, barY + 1, Math.round(W * p), 4, '#ffd24a');
      rect(ctx, 0, barY + 1, Math.round(W * p), 1, '#fff2b0');
      // where each section starts, so the run of the set is readable at a glance
      if (this.earMode) {
        const n = this.rhythm.phrases.length;
        for (let i = 1; i < n; i++) rect(ctx, Math.round(W * i / n), barY, 1, 5, '#6a5f9a');
      } else for (const sec of this.rhythm.sections) {
        const sx = Math.round(W * clamp(sec.start / this.song.length, 0, 1));
        rect(ctx, sx, barY, 1, 5, sec.qte ? '#ff9f68' : '#6a5f9a');
      }
      { const hx2 = Math.round(W * p); rect(ctx, hx2 - 1, barY - 1, 3, 7, '#fff8e0'); }
      const sec = this.rhythm.section, lbl = sec.qte ? sec.member.name.toUpperCase() : this.song.name.toUpperCase();
      const lblY = L.top ? L.stageBottom - 18 : L.stageTop + 8;
      rect(ctx, 4, lblY - 3, textWidth(lbl) + 14, 15, 'rgba(0,0,0,0.62)'); drawText(ctx, lbl, 11, lblY, '#fff');
      // The pad strip only exists where there are pads. A kit is tapped on the
      // drums themselves, so padY is zero there — and painting the strip anyway
      // laid a black sheet over the whole phone screen.
      drawPadStrip(ctx, L, this.pads, this.rhythm.keysDown);
      this.pauseBtn.draw(ctx);
      if (this.paused) { rect(ctx, 0, 0, W, H, 'rgba(0,0,0,0.78)'); uiRibbon(ctx, W / 2, 170, 'PAUSED', { scale: 4 }); for (const b of this.pauseButtons) b.draw(ctx); }
      return;
    }
    // tally
    this.drawStage(ctx);
    const PY = L.top ? 156 : 26, PH = L.top ? H - 162 : 248;
    const inner = uiPanel(ctx, 50, PY, W - 100, PH, { title: 'SET COMPLETE' });
    const S = this.S, steps = S.steps, shown = Math.min(this.tallyStep, steps.length);
    let multAdd = 0, times = 1;
    for (let i = 0; i < shown; i++) { const st = steps[i]; if (st.kind === 'mult') multAdd += st.value; if (st.kind === 'times') times *= st.value; }
    const vis = steps.slice(Math.max(0, shown - 9), shown); let y = inner.y + 10;
    for (const st of vis) {
      const col = st.kind === 'applause' ? '#2a5ab0' : (st.kind === 'mult' || st.kind === 'times') ? '#b02a2a' : st.kind === 'cash' ? '#2a7a3a' : UI.inkSoft;
      const val = st.kind === 'applause' ? '+' + fmtNum(st.value) : st.kind === 'mult' ? '+' + st.value : st.kind === 'times' ? 'x' + st.value : st.kind === 'cash' ? '+' + fmtMoney(st.value) : '';
      drawText(ctx, st.label, inner.x + 14, y, UI.ink); drawText(ctx, val, inner.x + 300, y, col, { align: 'right' }); y += 14;
    }
    const bx = inner.x + inner.w - 240, by = inner.y + 10;
    rect(ctx, bx, by, 228, 44, '#2a5ab0'); frame(ctx, bx, by, 228, 44, '#1a1410'); ctx.drawImage(icon('heart'), bx + 8, by + 16, 14, 12); drawText(ctx, fmtNum(shown ? S.applause : 0), bx + 220, by + 10, '#fff', { align: 'right', scale: 3 });
    const mult = Math.round(((shown ? S.baseMult : 1) + multAdd) * times * 100) / 100;
    rect(ctx, bx, by + 50, 228, 44, '#b02a2a'); frame(ctx, bx, by + 50, 228, 44, '#1a1410'); ctx.drawImage(icon('mult'), bx + 8, by + 66, 14, 14); drawText(ctx, 'x' + mult.toFixed(2), bx + 220, by + 50, '#fff', { align: 'right', scale: 3 });
    if (this.tallyDone) {
      if (Math.random() < 0.25) this.fx.add({ x: 60 + Math.random() * (W - 120), y: PY + PH, vx: (Math.random() - 0.5) * 40, vy: 40 + Math.random() * 70, life: 1.6, kind: 'star', color: '#ffd24a', size: 3, gravity: 120 });
      rect(ctx, bx, by + 100, 228, 48, '#2a7a3a'); frame(ctx, bx, by + 100, 228, 48, '#1a1410'); ctx.drawImage(icon('coin'), bx + 8, by + 118, 15, 14); drawText(ctx, fmtMoney(this.earned), bx + 220, by + 102, '#fff', { align: 'right', scale: 3 });
      const gcol = { S: '#d9a520', A: '#4f8032', B: '#2a5ab0', C: '#b07030', D: '#b02a2a' }[this.grade];
      const gs = bounceScale(this.tallyT, 0.2, 10);
      // the grade lands like a stamp: speed lines, a halftone burst, then the letter
      speedLines(ctx, inner.x + 90, inner.y + 60, 34, 92, 18, gcol, this.tallyT, 0.3);
      ctx.save(); ctx.translate(inner.x + 90, inner.y + 88); ctx.scale(gs, gs);
      drawText(ctx, this.grade, 0, -32, gcol, { align: 'center', scale: 8, outline: '#1a1410' });
      ctx.restore();
      if (this.tallyT < 0.9 && (this.grade === 'S' || this.grade === 'A'))
        comicBurst(ctx, inner.x + 152, inner.y + 44, this.grade === 'S' ? 'PERFECT!' : 'NICE SET!', '#ffd24a', this.tallyT / 0.9, 0.8);
      drawText(ctx, Math.round(this.res.acc * 100) + '%', inner.x + 90, inner.y + 140, gcol, { align: 'center', scale: 3 });
      // what you played it on, so the gear ladder is visible
      let gearW = 0;
      { const m0 = Game.run.members[0], t2 = gearTier(m0.quality);
        gearW = textWidth(t2.name + ' ' + INSTRUMENTS[m0.instrument].name.toUpperCase()) + 16;
        rect(ctx, inner.x + 14, inner.y + 166, gearW, 14, t2.color);
        drawText(ctx, t2.name + ' ' + INSTRUMENTS[m0.instrument].name.toUpperCase(), inner.x + 22, inner.y + 169, '#fdf6e2'); }
      // the performers, taking a bow
      (this.performers || Game.run.members).slice(0, 4).forEach((m, i) => { const px2 = inner.x + 210 + i * 58; drawShadow(ctx, px2, inner.y + 168, 34, 0.18); drawBugAt(ctx, m.spec, px2, inner.y + 168, { pose: 'cheer', expr: 'happy', scale: 1.4, rate: 4.2, phase: i * 1.3, bounce: 2.2 }); });
      let yy = inner.y + inner.h - 40;
      drawText(ctx, Math.round(this.res.acc * 100) + '%   COMBO ' + this.res.maxCombo + '   MISS ' + this.res.miss + (this.xpLines.length ? '     ' + this.xpLines.join('  ') : ''), inner.x + 26 + gearW, yy, UI.inkSoft);
      const b = new Btn(inner.x + inner.w - 200, inner.y + inner.h - 34, 188, 28, 'PICK AN ABILITY', () => this.next(), { scale: 2 }); b.draw(ctx);
    } else drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', inner.x + inner.w / 2, inner.y + inner.h - 20, UI.inkFaint, { align: 'center' });
    this.fx.draw(ctx); Game.drawHud(ctx);
  }
}

// ---------- Ability draft ----------
class DraftScene {
  constructor(gig) {
    const r = Game.run; this.t = 0; this.gig = gig; this.sel = 0; this.taken = false;
    const picks = []; for (let i = 0; i < 3; i++) { const k = r.randomCharm(picks); if (k) picks.push(k); }
    this.picks = picks; this.cards = [];
  }
  choose(i) {
    const r = Game.run; if (this.taken) return;
    if (i < this.picks.length) {
      const k = this.picks[i];
      if (r.charms.length >= r.charmSlots) { this.full = k; this.sel = i; Audio.ui('error'); return; }
      r.addCharm(k); Audio.ui('fanfare');
    } else { r.money += 15; Audio.ui('cash'); }
    this.taken = true; r.save(); setTimeout(() => Game.go(() => new CityScene(), 'iris'), 260);
  }
  swap(slot) { const r = Game.run; r.removeCharm(r.charms[slot]); r.addCharm(this.full); this.full = null; this.taken = true; Audio.ui('fanfare'); r.save(); setTimeout(() => Game.go(() => new CityScene(), 'iris'), 260); }
  update(dt) { this.t += dt; }
  key(code) {
    if (this.full != null) { const r = Game.run; if (code === 'ArrowLeft') this.sel = (this.sel + r.charms.length - 1) % r.charms.length; else if (code === 'ArrowRight') this.sel = (this.sel + 1) % r.charms.length; else if (['Enter', 'Space'].includes(code)) this.swap(this.sel); else if (code === 'Escape') this.full = null; return; }
    if (code === 'ArrowLeft' || code === 'KeyA') this.sel = (this.sel + this.cards.length - 1) % this.cards.length;
    else if (code === 'ArrowRight' || code === 'KeyD') this.sel = (this.sel + 1) % this.cards.length;
    else if (['Enter', 'Space'].includes(code)) this.choose(this.sel);
  }
  click(x, y) {
    if (this.full != null) { const r = Game.run; for (let i = 0; i < r.charms.length; i++) { const cx = W / 2 - r.charmSlots * 26 + i * 52; if (x >= cx && x < cx + 46 && y >= 392 && y < 438) { this.swap(i); return; } } return; }
    this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) { if (this.sel === i) this.choose(i); else { this.sel = i; Audio.ui('move'); } } });
  }
  hover(x, y) { this.cards.forEach((c, i) => { if (x >= c.x && x < c.x + c.w && y >= c.y && y < c.y + c.h) this.sel = i; }); }
  draw(ctx) {
    const r = Game.run;
    vgrad(ctx, 0, 0, W, H, '#1d1330', '#0b0818');
    for (let i = 0; i < 5; i++) { const rr = ((this.t * 90 + i * 110) % 560); ctx.globalAlpha = clamp(1 - rr / 560, 0, 1) * 0.16; ringPx(ctx, W / 2, 220, rr, '#ffd24a'); ctx.globalAlpha = 1; }
    uiRibbon(ctx, W / 2, 24, 'PICK AN ABILITY', { scale: 4, color: '#4a6e3a' });
    this.cards = []; const n = this.picks.length + 1, cw = 176, gap = 22, x0 = Math.round((W - (n * cw + (n - 1) * gap)) / 2);
    for (let i = 0; i < n; i++) {
      const isCash = i >= this.picks.length, k = this.picks[i], c = k ? CHARMS[k] : null;
      const sel = i === this.sel, ch = 252;
      // the card breathes; the selected one rides higher and tilts a touch
      const bob = Math.sin(this.t * (sel ? 3 : 1.6) + i * 1.7) * (sel ? 3 : 1.4);
      const x = x0 + i * (cw + gap), y = Math.round(90 - (sel ? 12 : 0) + bob);
      this.cards.push({ x, y, w: cw, h: ch });
      const rar = isCash ? 'cash' : c.rarity, rc = { common: '#4d86c6', uncommon: '#4f8032', rare: '#c8433a', cash: '#2a7a3a' }[rar];
      // rarity glow behind the card, strongest on rares
      const glow = (rar === 'rare' ? 0.5 : rar === 'uncommon' ? 0.32 : 0.22) * (sel ? 1.7 : 1) * (0.75 + 0.25 * Math.sin(this.t * 3 + i));
      ctx.globalAlpha = glow * 0.5;
      for (let g = 3; g >= 1; g--) frame(ctx, x - g * 3, y - g * 3, cw + g * 6, ch + g * 6, rc);
      ctx.globalAlpha = 1;
      if (sel) speedLines(ctx, x + cw / 2, y + ch / 2, cw * 0.62, cw * 0.95, 16, rc, this.t, 0.16);
      ctx.save();
      ctx.translate(x + cw / 2, y + ch / 2); ctx.rotate(Math.sin(this.t * (sel ? 1.9 : 1.1) + i * 2.1) * (sel ? 0.014 : 0.006));
      ctx.translate(-(x + cw / 2), -(y + ch / 2));
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(x + 6, y + 7, cw, ch);
      rect(ctx, x, y, cw, ch, sel ? UI.goldHi : UI.woodLo); rect(ctx, x + 4, y + 4, cw - 8, ch - 8, UI.paper);
      halftone(ctx, x + 4, y + 22, cw - 8, ch - 26, rc, 6, 0.1);
      rect(ctx, x + 4, y + 4, cw - 8, 18, rc); drawText(ctx, rar.toUpperCase(), x + cw / 2, y + 9, '#fff', { align: 'center' });
      const slotX = x + cw / 2 - 44, slotY = y + 28;
      uiItemSlot(ctx, slotX, slotY, 88, null, {});
      drawAbilityIcon(ctx, slotX + 5, slotY + 5, 78, isCash ? 'coin' : charmArt(c.icon), this.t, { selected: sel, color: rc });
      drawWrapped(ctx, (isCash ? 'TAKE $15' : c.name.toUpperCase()), x + 12, y + 124, 11, UI.ink, 20, { scale: 2 });
      drawWrapped(ctx, isCash ? 'Skip the ability. Cash is dinner.' : c.desc, x + 12, y + 168, 24, UI.inkSoft, 12);
      if (sel) { const k2 = Math.floor(this.t * 8) % 2; frame(ctx, x - 3 + k2, y - 3, cw + 6, ch + 6, '#fff8e8'); frame(ctx, x - 4 + k2, y - 4, cw + 8, ch + 8, '#d9a520'); }
      ctx.restore();
      // rares get a comic flash on the corner so the eye goes there
      if (rar === 'rare' && !isCash) comicBurst(ctx, x + cw - 10, y + 30, 'RARE!', '#ffd24a', (this.t * 0.5) % 1, 0.62);
      if (this.taken && sel) comicBurst(ctx, x + cw / 2, y + 64, isCash ? 'CASH!' : 'GOT IT!', '#fff3b0', this.t * 2, 1.15);
    }
    // current charms
    drawText(ctx, 'YOUR ABILITIES  ' + r.charms.length + '/' + r.charmSlots, W / 2, 372, '#cfc9e6', { align: 'center' });
    for (let i = 0; i < r.charmSlots; i++) { const cx = W / 2 - r.charmSlots * 26 + i * 52, k = r.charms[i]; uiItemSlot(ctx, cx, 392, 46, k ? charmArt(CHARMS[k].icon) : null, { empty: !k, selected: this.full != null && this.sel === i }); }
    if (this.full != null) { rect(ctx, 0, 452, W, 52, 'rgba(20,10,10,0.9)'); drawText(ctx, 'FULL - PICK ONE TO REPLACE', W / 2, 462, '#ff9f68', { align: 'center', scale: 2 }); drawText(ctx, Game.touch ? 'TAP A SLOT' : 'ARROWS + ENTER', W / 2, 484, '#cfc9e6', { align: 'center' }); }
    else drawText(ctx, Game.touch ? 'TAP A CARD' : 'ARROWS + ENTER', W / 2, 462, '#8a86b0', { align: 'center' });
  }
}
