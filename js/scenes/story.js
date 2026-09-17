// ---------- The cinematic: arena concert, the fall, backstage, the flight ----------
'use strict';
// Short beat-based dialogue. {who, text} - kept to one line each.
function bubble(ctx, x, y, text, opts = {}) {
  const w = textWidth(text) + 16, h = 20;
  const bx = Math.round(clamp(x - w / 2, 6, W - w - 6)), by = Math.round(y - h);
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(bx + 2, by + 3, w, h);
  rect(ctx, bx, by, w, h, opts.dark ? '#1a1228' : '#f6f2e6'); frame(ctx, bx, by, w, h, opts.color || '#1a1410');
  for (let i = 0; i < 5; i++) rect(ctx, x - 4 + i, by + h + i, 8 - i * 2, 1, opts.dark ? '#1a1228' : '#f6f2e6');
  drawText(ctx, text, bx + w / 2, by + 6, opts.dark ? '#fff' : UI.ink, { align: 'center' });
}
const MONARCH_CREW = [{ key: 'dot', instrument: 'drums' }, { key: 'hopper', instrument: 'piano' }];

const PLATE_H = 136;
class ConcertScene {
  constructor(opts = {}) {
    // Coming out of character select there is nothing left to introduce: the
    // lights are already down and the song starts.
    this.straightIn = !!opts.straightIn;
    this.t = 0; this.phase = 'rise'; this.phaseT = 0; this.moveIdx = 0; this.fx = new Particles(); this.lightT = 0; this.strobe = 0; this.results = [];
    this.rng = makeRng(777); this.crowd = [];
    for (let i = 0; i < 300; i++) this.crowd.push({ x: this.rng.range(-10, W + 10), row: this.rng.int(0, 4), o: this.rng.range(0, 6), lighter: this.rng.chance(0.44), col: this.rng.pick(['#231b38', '#2b2246', '#1b1728', '#322648']), glow: this.rng.pick(['#ffd24a', '#8ad8ff', '#ff5a9a', '#6be585', '#c58bff']) });
    this.layout(); this.pyroT = 0; this.throwables = []; this.booT = 0;
    this.haze = new Haze(8, 11);
    this.you = Game.run ? Game.run.members[0] : new Member({ name: 'STAG', presetKey: 'stag', spec: HERO_PRESETS.stag, instrument: 'guitar' });
    this.gearQuality = 5;     // the flashback is always top of the range
    this.heroKey = Game.run ? Game.run.hero : 'stag';
    this.mates = ROSTER.filter(r => r.key !== this.heroKey).map(r => ({ key: r.key, spec: HERO_PRESETS[r.key], instrument: r.instrument, name: HERO_PRESETS[r.key].name }));
    this.singer = this.mates.find(m => m.instrument === 'piano') || this.mates[0];
    Audio.setStageReverb(true);
    this.beats = [{ who: 'singer', text: 'FORTY THOUSAND BUGS OUT THERE.' }];
    this.stageLights = ['#c58bff', '#5bc0ff'];
  }
  layout() {
    const t = Game.touch;
    // An instrument you play by hand gets the whole stadium behind it and sits
    // along the bottom edge; a chart still splits the screen the old way.
    const you = Game.run ? Game.run.members[0] : null;
    this.earLayout = you && (INSTRUMENTS[you.instrument] || {}).game === 'ear';
    // A kit gets the open stage too: it is played on the drums themselves, so
    // it needs no pads and no split screen, and a five-piece squeezed into a
    // 250px band with the band crammed above it looked like neither.
    this.kitLayout = you && (INSTRUMENTS[you.instrument] || {}).view === 'kit';
    if (this.earLayout || this.kitLayout) {
      this.L = { open: true, rhythmY: 16, rhythmH: H - 16, stageTop: 20, stageBottom: t ? 404 : 430, padY: 0, padH: 0 };
      return;
    }
    this.L = t ? { rhythmY: 150, rhythmH: 250, stageTop: 20, stageBottom: 148, padY: 404, padH: 130 }
               : { rhythmY: 16, rhythmH: 296, stageTop: 316, stageBottom: 540, padY: 0, padH: 0 };
  }
  isPlaying() { return this.phase === 'play'; }
  get mv() { return OPERA.movements[this.moveIdx]; }
  // everything except the playable movement is framed full-screen like a film
  get cinematic() { const p = this.phase; return p !== 'play'; }
  stageRect() {
    if (!this.cinematic) return { top: this.L.stageTop, bottom: this.L.stageBottom };
    const plated = this.phase === 'card' || this.phase === 'done';
    return { top: 0, bottom: plated ? H - PLATE_H : H };
  }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.lightT += dt; this.fx.update(dt); this.pyroT = Math.max(0, this.pyroT - dt);
    this.singT = Math.max(0, (this.singT || 0) - dt); this.crowdSingT = Math.max(0, (this.crowdSingT || 0) - dt);
    // smoke off the deck, always, because a stage this size is never clear
    if (this.phase === 'play' && Math.random() < dt * 5) {
      const sx = Math.random() * W;
      this.fx.add({ x: sx, y: this.stageRect().bottom - 12, vx: (Math.random() - 0.5) * 26, vy: -14 - Math.random() * 22,
        life: 2.6 + Math.random() * 1.4, kind: 'smoke', color: Math.random() < 0.3 ? '#8a7fc0' : '#5a5474', size: 9, grow: 30, alpha: 0.3, gravity: -5 });
    }
    this.haze.update(dt);
    for (const o of this.throwables) { o.t += dt; o.x += o.vx * dt; o.y += o.vy * dt; o.vy += 420 * dt; o.rot += dt * 9; }
    this.throwables = this.throwables.filter(o => o.y < H + 20 && o.t < 3);
    if (this.phase === 'rise') {
      if (this.straightIn && this.phaseT > 0.9) { Audio.roar(2.2, 0.45); this.startMovement(0); this.startPlay(); }
      else if (this.phaseT > 2.6) { this.phase = 'hello'; this.phaseT = 0; Audio.roar(2.5, 0.5); }
    }
    else if (this.phase === 'hello') { if (this.phaseT > 3.4) this.startMovement(0); }
    else if (this.phase === 'card') { if (this.phaseT > 30) this.startPlay(); }
    else if (this.phase === 'play') {
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch) { const k = this.rhythm.section.qte ? 'qte' : this.rhythm.section.instrument; if (this.padKey !== k) { this.padKey = k; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, this.rhythm.section.qte); } }
      if (this.rhythm.events.perfects && Math.random() < 0.3) this.pyro(1);
      // The song is survivable; the solo is not. Nothing goes wrong until the
      // moment it starts, and then it goes wrong very fast.
      const inSolo = this.soloAt != null && this.rhythm.now >= this.soloAt;
      if (inSolo && !this.soloSeen) { this.soloSeen = true; this.soloT = 0; Audio.ui('pyro'); Game.shake.hit(9, 0.6); this.pyro(4); }
      if (inSolo) { this.soloT = (this.soloT || 0) + dt; this.strobe = Math.floor(this.t * 14) % 2; if (this.rhythm.counts.miss >= 12 || this.rhythm.finished) { this.meltdown(); return; } }
      else if (this.mv.impossible && this.rhythm.finished) { this.meltdown(); return; }
      else if (this.rhythm.finished) this.finishMovement();
    }
    else if (this.phase === 'fail') {
      this.booT += dt;
      const SB = this.stageRect().bottom;
      if (Math.random() < dt * 26) this.fx.add({ x: Math.random() * W, y: SB - 20 - Math.random() * 60, vx: (Math.random() - 0.5) * 70, vy: -70 - Math.random() * 90, life: 0.9, kind: 'fire', size: 3 + Math.random() * 3, gravity: 60 });
      if (Math.random() < dt * 5) this.fx.add({ x: Math.random() * W, y: SB - 60, vx: 0, vy: -22, life: 3, kind: 'smoke', color: '#4a4450', size: 7, grow: 16, alpha: 0.5 });
      if (this.booT > 0.4 && Math.random() < dt * 9) this.throwItem();
      if (this.booT > 5.2 && !this.left) { this.left = true; Game.go(() => new BackstageScene(), 'fade', { dur: 0.7 }); }
    }
  }
  throwItem() {
    const kind = this.rng.pick(['tomato', 'can', 'cabbage', 'boot', 'fish', 'tomato']);
    const fromX = this.rng.range(60, W - 60), fromY = H - 20;
    const SB = this.stageRect().bottom;
    const tx = W / 2 - 90 + this.rng.range(-60, 60), ty = SB - 150;
    const time = 0.75;
    this.throwables.push({ kind, x: fromX, y: fromY, vx: (tx - fromX) / time, vy: (ty - fromY) / time - 0.5 * 420 * time, rot: 0, t: 0 });
    Audio.ui('whoosh');
    setTimeout(() => { Game.shake.hit(5, 0.2); Audio.drum('clunk', 0, 0.6); this.fx.burst(tx, ty, 14, { color: kind === 'tomato' ? ['#d83a2a', '#f06a4a'] : kind === 'cabbage' ? ['#6fc050', '#a8e090'] : ['#c8c8d0', '#fff'], speed: 110, life: 0.6, kind: 'px', size: 3, gravity: 280 }); this.fx.text(tx, ty - 20, 'OOF', '#ff5a5a', { life: 0.7, scale: 2 }); }, time * 1000);
  }
  startMovement(i) {
    this.moveIdx = i; this.phase = 'card'; this.phaseT = 0;
    this.stageLights = this.mv.lights;
    this.cardBtn = new Btn(W - 246, H - 104, 182, 38, i === 0 ? 'PLAY' : 'NEXT', () => this.startPlay(), { scale: 3 });
  }
  startPlay() {
    const mv = this.mv; Audio.init();
    const song = songFromMovement(mv);
    // This is the night you were somebody. Whatever you are reduced to later,
    // here you are behind the best money can buy: a signature instrument, a
    // chrome five-piece, the works. The whole point is that you had it all.
    const gear = gearInstrument(this.you.instrument, 5);
    const sections = [{ instrument: this.you.instrument, instr: gear, startBar: 0, endBar: song.bars }];
    // The last movement is an ordinary song until the solo starts, so it is
    // charted in two halves: the tune at its own difficulty, then the part
    // nobody has ever landed.
    const diff = mv.difficulty;
    // The stadium kit plays a part, not a loop, and it is pitched harder than
    // anything on the street. You cannot lose this night either way — it is a
    // memory, and it ends how it ends.
    const kitHere = gear.view === 'kit';
    const notes = chartFromMelody(song, sections, kitHere ? Math.max(diff, 4) + (mv.impossible ? 2 : 1) : diff, this.rng,
      { starRate: 0.12, bombMult: mv.key === 'solo' ? 1.5 : 0.6, showcase: kitHere });
    if (song.soloBar) {
      // everything from the solo bar on is a wall of sixteenths
      const cut = song.leadIn + song.soloBar * 4 * song.beat;
      for (let i = notes.length - 1; i >= 0; i--) if (notes[i].t >= cut) notes.splice(i, 1);
      const L = gear.lanes || 4, extra = [];
      for (let bar = song.soloBar; bar < song.bars; bar++)
        for (let st = 0; st < 16; st++)
          extra.push({ t: song.leadIn + bar * 4 * song.beat + st * song.beat / 4, lane: this.rng.int(0, L - 1), dur: 0, type: 'tap', midi: song.root + 24 + this.rng.int(0, 12), solo: true });
      notes.push(...extra); notes.sort((a, b) => a.t - b.t); notes.forEach((n, i) => { n.id = i; n.judged = false; n.hit = false; });
      this.soloAt = cut;
    }
    const mods = collectMods(null, { difficulty: diff, fx: { shake: Game.shake }, windowMult: 1.25, voiceOverride: sections[0].instrument === 'guitar' ? 'eguitar' : null });
    // An instrument you play by hand is played by hand here too, on a stage
    // this size. The last movement is meant to be unplayable either way.
    this.earMode = gear.game === 'ear';
    if (this.earMode) {
      this.surface = makeSurface(gear, song);
      mods.maxPhrases = mv.impossible ? 99 : 2;
      this.rhythm = new EarGame(song, this.surface, mods, { onMilestone: () => this.pyro(3) });
      this.rhythm.voice = mods.voiceOverride || gear.voice;
      this.rhythm.instr = gear; this.rhythm.instrKey = this.you.instrument; this.rhythm.member = this.you;
      this.earPointers = new Map();
    } else this.rhythm = new RhythmGame(song, sections, notes, mods, { onCheer: () => this.pyro(3) });
    const start = Audio.now() + 0.5 + song.leadIn; this.rhythm.begin(start);
    const steps = this.earMode ? Math.ceil(this.rhythm.totalLength / (song.beat / 4)) + 32 : 0;
    this.backing = new Backing(song, start - song.leadIn,
      () => this.earMode && this.rhythm.phase === 'call' ? { bass: true, chords: true } : ({ drums: mv.instrument === 'drums', pad: mv.instrument === 'piano' }),
      this.earMode ? { loop: true, steps } : {});
    // A stadium has a singer in it and forty thousand people who know the
    // words. The chip voice takes the tune; the room comes in on every
    // turnaround, and you can see it as well as hear it.
    this.backing.vocal = true;
    this.backing.onSing = (when, midi) => { this.singT = 0.34; this.singPitch = midi; };
    this.backing.onCrowdSing = () => { this.crowdSingT = 2.6; Audio.roar(1.2, 0.22); };
    this.song = song; this.phase = 'play'; this.phaseT = 0; this.padKey = null; this.pads = []; this.padPointers = new Map(); this.dragDrum = new Map();
    this.pyro(mv.pyro);
  }
  pyro(n) { for (let k = 0; k < n; k++) { const x = k % 2 ? 76 : W - 76; for (let i = 0; i < 14; i++) this.fx.add({ x: x + (Math.random() - 0.5) * 8, y: this.L.stageBottom - 26, vx: (Math.random() - 0.5) * 34, vy: -170 - Math.random() * 130, life: 0.7 + Math.random() * 0.4, kind: 'fire', size: 4, gravity: 130 }); } if (n) { Audio.ui('pyro'); Game.shake.hit(2, 0.15); this.pyroT = 0.3; } }
  finishMovement() {
    this.backing.stop(); this.results.push(this.rhythm.results()); this.phase = 'done'; this.phaseT = 0;
    for (let i = 0; i < 70; i++) this.fx.add({ x: Math.random() * W, y: this.L.stageTop - 10, vx: (Math.random() - 0.5) * 34, vy: 34 + Math.random() * 44, life: 3, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][i % 5], kind: 'confetti', gravity: 10 });
    Audio.roar(2.5, 0.5); this.pyro(2);
    this.doneBtn = new Btn(W - 246, H - 104, 182, 38, 'NEXT', () => this.startMovement(this.moveIdx + 1), { scale: 3 });
  }
  meltdown() { this.phase = 'fail'; this.booT = 0; this.backing.stop(); Audio.setStageReverb(false); Audio.ui('pyro'); Audio.ui('boo'); Game.shake.hit(11, 0.9); for (let i = 0; i < 90; i++) this.fx.add({ x: Math.random() * W, y: this.stageRect().bottom - 120, vx: (Math.random() - 0.5) * 220, vy: -110 - Math.random() * 210, life: 1.2, kind: 'fire', size: 5, gravity: 110 }); }
  key(code) {
    if (this.phase === 'card') { if (['Enter', 'Space'].includes(code)) this.startPlay(); return; }
    if (this.phase === 'done') { if (['Enter', 'Space'].includes(code)) this.doneBtn.onTap(); return; }
    if (this.phase === 'hello' || this.phase === 'rise') { if (['Enter', 'Space'].includes(code)) { this.phase = 'card'; this.startMovement(0); } return; }
    if (this.phase === 'play') this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play') this.rhythm.keyUp(code); }
  padAt(x, y) { return this.pads ? this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) : null; }
  pointerDown(x, y, id) {
    if (this.phase === 'card') { this.startPlay(); return; }
    if (this.phase === 'done') { this.doneBtn.onTap(); return; }
    if (this.phase === 'play') {
      const pad = this.padAt(x, y); if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); return; }
      // The stage had no drum input whatsoever, so a drummer's opening show
      // could only be played on a keyboard. It uses the gig's code now.
      if (kitPointerDown(this, x, y, id)) return;
      earPointerDown(this, x, y, id);
    }
  }
  pointerMove(x, y, id) {
    if (this.phase !== 'play') return;
    if (kitPointerMove(this, x, y, id)) return;
    if (earPointerMove(this, x, y, id)) return;
    const prev = this.padPointers.get(id); if (prev === undefined) return;
    const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return;
    this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id);
  }
  pointerUp(x, y, id) {
    kitPointerUp(this, id);
    if (earPointerUp(this, id)) return;
    const c = this.padPointers && this.padPointers.get(id); if (c !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(c); }
  }
  // A chrome five-piece on the deck, drawn with the real kit art rather than
  // the little prop sprite, because this stage is the whole point.
  drawBigKit(ctx, cx, baseY, beat) {
    const stub = this._kitStub || (this._kitStub = { flashes: {}, receptors: {}, now: 0 });
    stub.now = this.t;
    // the kit breathes with the tune instead of sitting dead still
    if (beat) { stub.flashes[0] = 0.12; stub.flashes[3] = 0.1; } else { stub.flashes[0] = 0; stub.flashes[3] = 0; }
    drawDrumKit(ctx, { x: 0, y: 0, w: W, h: H }, stub,
      { pieces: KIT_LADDER[5].pieces, cx, baseY, width: 300, chrome: true, noMat: true });
  }
  // A two-tier keyboard rig: a big synth on a stand with a second board over it.
  drawRig(ctx, cx, baseY) {
    const w = 96, h = 16, y = baseY - 34;
    // the stand
    for (const d of [-1, 1]) { line(ctx, cx + d * 34, y + h, cx + d * 44, baseY, '#6a6478'); line(ctx, cx + d * 34, y + h, cx + d * 22, baseY, '#565062'); }
    rect(ctx, cx - 40, y + h + 6, 80, 2, '#4a4558');
    // lower board
    rect(ctx, cx - w / 2, y, w, h, '#1b1822');
    rect(ctx, cx - w / 2 + 1, y + 1, w - 2, 4, '#312c3c');
    for (let i = 0; i < 9; i++) rect(ctx, cx - w / 2 + 4 + i * 2, y + 2, 1, 2, i % 3 ? '#8a84a0' : '#e8c060');
    for (let i = 0; i < Math.floor((w - 6) / 4); i++) { const kx = cx - w / 2 + 3 + i * 4; rect(ctx, kx, y + 6, 3, h - 8, '#efe9da'); rect(ctx, kx, y + 6, 3, 1, '#fffaea'); if (i % 7 !== 2 && i % 7 !== 6) rect(ctx, kx + 2, y + 6, 2, Math.round((h - 8) * 0.6), '#211d28'); }
    // upper board, angled back on the tier
    const y2 = y - 16;
    rect(ctx, cx - 36, y2, 72, 12, '#221e2c');
    rect(ctx, cx - 35, y2 + 1, 70, 3, '#3a3448');
    for (let i = 0; i < Math.floor(68 / 3); i++) { const kx = cx - 34 + i * 3; rect(ctx, kx, y2 + 5, 2, 6, '#e6e0d2'); if (i % 7 !== 2 && i % 7 !== 6) rect(ctx, kx + 1, y2 + 5, 1, 4, '#211d28'); }
    for (const d of [-1, 1]) rect(ctx, cx + d * 33, y2 + 12, 2, y - y2 - 12, '#5a5468');
    // a red standby light, because every rig has one
    rect(ctx, cx + w / 2 - 5, y + 2, 2, 2, '#e8483a');
  }
  drawStadium(ctx) {
    const L = this.L, S = this.stageRect(), top = S.top, bottom = S.bottom, h = bottom - top;
    ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, h); ctx.clip();
    const rise = this.phase === 'rise' ? easeOut(clamp(this.phaseT / 2.2, 0, 1)) : 1;
    const floorY = drawStageBack(ctx, this.t, { top, bottom, floorY: bottom - Math.round(h * 0.36), lights: this.stageLights });
    if (this.phase === 'play' && this.mv.pyro >= 3) { for (let i = 0; i < 10; i++) { const lx = W / 2 + Math.sin(this.t * 2.6 + i * 0.8) * 460; ctx.globalAlpha = 0.45; line(ctx, W / 2, top + 20, lx, bottom, i % 2 ? '#6be585' : '#ff5ab0'); ctx.globalAlpha = 1; } }
    const beat = this.rhythm ? (this.rhythm.onBeat || this.rhythm.beatPulse > 0.78) : Math.floor(this.t * 4) % 2 === 0;
    const dead = this.phase === 'fail';
    const won = this.phase === 'done';
    // the band reacts to how the set is going
    const combo = this.rhythm ? this.rhythm.combo || 0 : 0;
    const bandExpr = dead ? 'sad' : won ? 'happy' : (this.phase === 'play' ? (combo > 20 ? 'happy' : combo === 0 && this.rhythm && this.rhythm.counts.miss > 2 ? 'shock' : null) : null);
    const bandPose = (def) => dead ? 'sad' : won ? 'cheer' : def;
    // ---- the production. You had money once and it is all on this stage:
    // walls of cabinets, wedges along the lip, a riser for the drums, cases
    // stacked in the wings, parcans on the deck and cable runs underfoot.
    const rigY = floorY;
    // cabinet walls either side, stacked three high and two wide
    for (const side of [-1, 1]) {
      const bx = side < 0 ? 64 : W - 124;
      for (let row = 0; row < 3; row++) for (let col = 0; col < 2; col++) {
        const cw = 30, chh = 26;
        ctx.drawImage(propCanvas('cab'), bx + col * (cw + 1), rigY - 12 - (row + 1) * chh);
      }
      // a hint of the light spilling down the front of the stack
      ctx.globalAlpha = 0.1; rect(ctx, bx, rigY - 12 - 3 * 26, 61, 3 * 26, this.stageLights[0]); ctx.globalAlpha = 1;
    }
    // the drum riser, with a lit skirt
    const riX = W / 2 + 96, riW = 190, riH = 26;
    rect(ctx, riX, rigY - riH, riW, riH, '#2a2334');
    rect(ctx, riX, rigY - riH, riW, 3, '#6a6080');
    rect(ctx, riX, rigY - 4, riW, 4, '#191420');
    for (let x = riX + 4; x < riX + riW - 3; x += 9) rect(ctx, x, rigY - riH + 5, 4, riH - 11, '#211b2c');
    ctx.globalAlpha = 0.35 + (beat ? 0.25 : 0);
    rect(ctx, riX + 2, rigY - 8, riW - 4, 2, this.stageLights[1]); ctx.globalAlpha = 1;
    // wedges along the front lip, aimed back at the band
    for (let i = 0; i < 6; i++) ctx.drawImage(propCanvas('wedge'), Math.round(120 + i * ((W - 264) / 5)), rigY + 2);
    // flight cases and parcans in the wings
    ctx.drawImage(propCanvas('case'), 30, rigY - 18);
    ctx.drawImage(propCanvas('case'), 36, rigY - 32);
    ctx.drawImage(propCanvas('case'), W - 58, rigY - 18);
    for (const px2 of [104, 250, W - 250, W - 118]) {
      ctx.drawImage(propCanvas('par'), px2 - 6, rigY - 14);
      // the beam it throws up into the haze
      ctx.globalAlpha = 0.07 + (beat ? 0.05 : 0);
      ctx.fillStyle = this.stageLights[px2 % 2]; ctx.beginPath();
      ctx.moveTo(px2 - 4, rigY - 14); ctx.lineTo(px2 + 4, rigY - 14);
      ctx.lineTo(px2 + 44, top + 10); ctx.lineTo(px2 - 44, top + 10); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // cable runs snaking across the deck
    for (const [cy2, col2] of [[rigY + 7, '#161320'], [rigY + 11, '#1d1826']]) {
      for (let x = 40; x < W - 40; x++) rect(ctx, x, cy2 + Math.round(Math.sin(x * 0.05 + cy2) * 2), 1, 2, col2);
    }
    // the three mates
    const riserTop = floorY - 26;
    const spots = [{ x: W / 2 + 190, y: riserTop }, { x: W / 2 + 40, y: floorY }, { x: W / 2 - 230, y: floorY }];
    // whoever is on drums goes up on the riser, behind the kit
    const dIdx = this.mates.findIndex(m => m.instrument === 'drums');
    if (dIdx >= 0) spots[dIdx] = { x: riX + riW / 2, y: riserTop };
    this.mates.forEach((m, i) => {
      const sp = spots[i] || spots[2]; const pose = bandPose(m.instrument === 'piano' ? 'sing' : (beat ? 'play' : 'play2'));
      if (m.instrument === 'piano') ctx.drawImage(propCanvas('micstand'), sp.x - 46, sp.y - 66, 14, 54);
      drawShadow(ctx, sp.x, sp.y, 40);
      drawBugAt(ctx, m.spec, sp.x, sp.y + (beat && !dead ? -2 : 0), { pose, instrument: m.instrument !== 'drums' && m.instrument !== 'piano' ? m.instrument : null, scale: 1.9, expr: bandExpr, rate: won ? 4.2 : 2.4, phase: i * 1.7, bounce: won ? 2.4 : dead ? 0.35 : 1 });
      // signature gear, because this is the night before it all went
      if (m.instrument === 'drums') this.drawBigKit(ctx, sp.x, sp.y - 30, beat);
      if (m.instrument === 'piano') this.drawRig(ctx, sp.x, sp.y);
    });
    // you, front left
    const yx = W / 2 - 90, yy = floorY + 8;
    drawShadow(ctx, yx, yy, 46, 0.35);
    const youPose = bandPose(beat ? 'play' : 'play2');
    // The player's own kit is the playable one, drawn full size over the top
    // of everything. Drawing the prop version here too put two kits on stage.
    if (this.you.instrument === 'drums') { drawBugAt(ctx, this.you.spec, yx, yy - 10, { pose: youPose, scale: 2.1, expr: bandExpr, rate: won ? 4.2 : 2.4, bounce: won ? 2.4 : dead ? 0.35 : 1 }); if (this.phase !== 'play') this.drawBigKit(ctx, yx, yy - 20, beat); }
    else if (this.you.instrument === 'piano') { ctx.drawImage(propCanvas('micstand'), yx - 52, yy - 76, 16, 62); drawBugAt(ctx, this.you.spec, yx, yy - 4, { pose: youPose, scale: 2.1, expr: bandExpr, rate: won ? 4.2 : 2.4, bounce: won ? 2.4 : dead ? 0.35 : 1 }); this.drawRig(ctx, yx, yy); }
    else drawBugAt(ctx, this.you.spec, yx, yy, { pose: youPose, instrument: this.you.instrument, scale: 2.1, expr: bandExpr, squash: beat && !dead ? 1.04 : 1, rate: won ? 4.2 : 2.4, bounce: won ? 2.4 : dead ? 0.35 : 1 });
    ctx.drawImage(propCanvas('cab'), yx - 92, yy - 26, 30, 26);
    for (const cx of [110, W - 110]) { rect(ctx, cx - 7, floorY - 12, 14, 12, '#444'); rect(ctx, cx - 4, floorY - 18, 8, 6, '#666'); if (this.pyroT > 0) circle(ctx, cx, floorY - 22, 10, '#fff4b0'); }
    // ---- finish: the deck throws the whole show back, the lamps wash colour
    // over everything they touch, and the hot bits bloom.
    const deckTop = floorY, deckDepth = Math.max(0, Math.min(bottom, deckTop + 34) - deckTop);
    if (deckDepth > 4 && !dead) deckReflection(ctx, Math.max(top, floorY - 110), Math.min(110, floorY - top), deckTop, deckDepth, 0.2, '#241c34');
    if (!dead) {
      lightWash(ctx, 0, top, W, floorY - top, this.stageLights[Math.floor(this.t * 0.3) % 2], 0.045 + (beat ? 0.035 : 0));
      this.haze.draw(ctx, 0, top, W, floorY - top, this.stageLights[1]);
    }
    drawArenaCrowd(ctx, this.crowd, this.t, bottom - Math.round(h * 0.22), bottom, dead ? 'angry' : 'happy', won ? 1.8 : 1);
    // The room singing: notes coming up out of the crowd for a couple of bars
    // after every turnaround, and the whole floor lifting while it lasts.
    if (this.crowdSingT > 0) {
      const k = clamp(this.crowdSingT / 2.6, 0, 1), cy = bottom - Math.round(h * 0.16);
      for (let i = 0; i < 18; i++) {
        const seed = (i * 137) % 100 / 100, rise = ((this.t * 0.55 + seed) % 1);
        const cx = 20 + ((i * 213) % (W - 40));
        ctx.globalAlpha = (1 - rise) * k * 0.85;
        drawText(ctx, i % 3 ? '♪' : '♫', cx, cy - rise * 130, i % 2 ? '#ffd24a' : '#8ad8ff', { align: 'center', scale: 2, outline: '#12101c' });
        ctx.globalAlpha = 1;
      }
      ctx.globalAlpha = k * 0.12; rect(ctx, 0, bottom - Math.round(h * 0.24), W, Math.round(h * 0.24), '#ffd88a'); ctx.globalAlpha = 1;
    }
    // and the singer's own note, thrown up off the stage as it is sung
    if (this.singT > 0) {
      const k = this.singT / 0.34, sx = W / 2 - 30;
      ctx.globalAlpha = k * 0.9;
      drawText(ctx, '♪', sx, bottom - h * 0.5 - (1 - k) * 26, '#fff8e0', { align: 'center', scale: 3, outline: '#2a1a40' });
      ctx.globalAlpha = 1;
    }
    if (dead && Math.floor(this.t * 3) % 2 === 0) for (let i = 0; i < 8; i++) drawText(ctx, 'BOO', (i * 137 + 50) % W, bottom - Math.round(h * 0.22) - 10 - (i % 3) * 12, '#ff5a5a', { align: 'center' });
    for (const o of this.throwables) { const c = propCanvas(o.kind); ctx.save(); ctx.translate(Math.round(o.x), Math.round(o.y)); ctx.rotate(o.rot); ctx.drawImage(c, -c.width, -c.height, c.width * 2, c.height * 2); ctx.restore(); }
    this.fx.draw(ctx);
    if (!dead) bloom(ctx, 0, top, W, h, 0.085, 1);
    ctx.restore();
    if (this.phase === 'play' && this.mv.impossible && this.strobe) { ctx.globalAlpha = 0.1; rect(ctx, 0, top, W, h, '#fff'); ctx.globalAlpha = 1; }
    if (this.phase === 'play' || this.phase === 'hello' || this.phase === 'fail') this.drawCrowdCam(ctx, { top, bottom });
    if (this.phase === 'rise') { ctx.globalAlpha = 1 - rise; rect(ctx, 0, top, W, h, '#000'); ctx.globalAlpha = 1; }
  }
  // ---- the house broadcast. Every real show has a camera crew and a screen
  // over the stage; this is that feed, cutting between the floor and each
  // player on a four-shot rotation, with the tally light on.
  camShot() { return Math.floor(this.t / 3.4) % 4; }
  drawCrowdCam(ctx, S) {
    // the unit is sized to the stage it hangs over: on the split layout the
    // stage is a strip, and a full-size feed would bury the band in it
    let pw = Math.min(248, Math.round(W * 0.27));
    let ph = Math.min(Math.round(pw * 0.56), Math.round((S.bottom - S.top) * 0.42));
    pw = Math.round(ph / 0.56);
    if (pw < 120) return;
    const px = W - pw - 14, py = Math.max(S.top + 10, 14);
    if (py + ph > S.bottom - 8) return;
    const shot = this.camShot(), since = this.t % 3.4;
    const cut = since < 0.14;                       // one frame of cut noise
    const beat = this.rhythm ? this.rhythm.beatPulse > 0.8 : false;
    const dead = this.phase === 'fail';
    ctx.save();
    // the body of the unit, then the picture inside it
    rect(ctx, px - 3, py - 3, pw + 6, ph + 6, '#0a0812');
    frame(ctx, px - 3, py - 3, pw + 6, ph + 6, '#3a3352');
    ctx.beginPath(); ctx.rect(px, py, pw, ph); ctx.clip();
    rect(ctx, px, py, pw, ph, '#0d0a18');
    const shake = cut ? 0 : Math.sin(this.t * 9 + shot) * 1.4;
    ctx.save(); ctx.translate(0, shake);
    if (shot === 0) {
      // the floor, tight: a slow pan along the front rows
      const cTop = S.bottom - Math.round((S.bottom - S.top) * 0.22);
      const z = 2.8, panX = W / 2 + Math.sin(this.t * 0.18) * (W * 0.34);
      ctx.save();
      ctx.translate(px + pw / 2, py + ph * 0.62); ctx.scale(z, z);
      ctx.translate(-panX, -(cTop + (S.bottom - cTop) * 0.5));
      drawArenaCrowd(ctx, this.crowd, this.t, cTop, S.bottom, dead ? 'angry' : 'happy', 1.9);
      ctx.restore();
    } else {
      // a player, framed chest-up against the wash off the rig
      const who = shot === 1 ? (this.mates.find(m => m.instrument === 'drums') || this.mates[0])
                : shot === 2 ? this.singer : this.you;
      const col = this.stageLights[shot % 2];
      hgrad(ctx, px, py, pw, ph, '#1b1430', '#0d0a18');
      ctx.globalAlpha = 0.16 + (beat ? 0.14 : 0); rect(ctx, px, py, pw, ph, col); ctx.globalAlpha = 1;
      // a few blown-out lamps behind the head
      for (let i = 0; i < 5; i++) {
        const lx = px + 18 + i * (pw - 36) / 4, ly = py + 14 + Math.sin(this.t * 2 + i) * 2;
        ctx.globalAlpha = 0.5; circle(ctx, lx, ly, beat ? 4 : 3, i % 2 ? '#fff0c0' : col); ctx.globalAlpha = 1;
      }
      const inst = who.instrument === 'drums' || who.instrument === 'piano' ? null : who.instrument;
      drawBugAt(ctx, who.spec, px + pw / 2, py + ph + 24, { pose: dead ? 'sad' : (beat ? 'play' : 'play2'),
        instrument: inst, scale: 3.4, expr: dead ? 'sad' : null, rate: 2.6, bounce: dead ? 0.3 : 1.3 });
      if (who.instrument === 'piano' && !dead) ctx.drawImage(propCanvas('micstand'), px + pw / 2 - 46, py + ph - 52, 12, 46);
      // the name strip broadcast puts under a face
      rect(ctx, px, py + ph - 20, pw, 20, 'rgba(10,8,18,0.72)');
      rect(ctx, px, py + ph - 20, 4, 20, '#e03a4a');
      drawText(ctx, (who.name || 'YOU').toUpperCase(), px + 10, py + ph - 14, '#f6efe2', { scale: 2 });
    }
    ctx.restore();
    // scanlines and a cut flash, so it reads as a screen and not a window
    ctx.globalAlpha = 0.16; for (let y = py; y < py + ph; y += 3) rect(ctx, px, y, pw, 1, '#000'); ctx.globalAlpha = 1;
    if (cut) { ctx.globalAlpha = 0.35; rect(ctx, px, py, pw, ph, '#cfd8ff'); ctx.globalAlpha = 1; }
    ctx.restore();
    // tally light, shot number and a running timecode
    const on = Math.floor(this.t * 2) % 2 === 0;
    circle(ctx, px + 12, py + 12, 4, on ? '#ff3a3a' : '#5a1a1a');
    drawText(ctx, 'LIVE', px + 22, py + 7, on ? '#ff6a6a' : '#7a4a4a', { scale: 2 });
    drawText(ctx, 'CAM ' + (shot + 1), px + pw - 8, py + 7, '#9a92b8', { align: 'right', scale: 2 });
    const secs = Math.floor(this.t);
    const tc = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
    drawText(ctx, tc, px + pw - 8, py + ph - 14, '#9a92b8', { align: 'right', scale: 2 });
  }
  // a wide cinematic plate across the lower third
  cinePlate(ctx, y, h) {
    ctx.globalAlpha = 0.82; rect(ctx, 0, y, W, h, '#0b0914'); ctx.globalAlpha = 1;
    rect(ctx, 0, y, W, 2, '#c8a03a'); rect(ctx, 0, y + h - 2, W, 2, '#3a2c14');
    hgrad(ctx, 0, y + 2, W, h - 4, 'rgba(40,24,60,0.5)', 'rgba(10,8,20,0.1)');
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#06051a'); const L = this.L;
    this.drawStadium(ctx);
    if (this.cinematic) { vignette(ctx, 0.44); if (this.phase !== 'card' && this.phase !== 'done') letterbox(ctx, 24); }

    if (this.phase === 'rise' || this.phase === 'hello') {
      const k = clamp(this.phaseT / 1.1, 0, 1), pop = popIn(this.phaseT - 0.3, 0.5);
      ctx.globalAlpha = clamp(k, 0, 1);
      // ---- the title card, built like a Japanese tour poster: a black band
      // across the frame, the band name set huge, a vertical strip of the
      // venue down one side, and a red seal stamped over the corner.
      const tw = textWidth(OPERA.title, { scale: 5 }) + 150;
      const cardW = Math.min(W - 40, Math.max(tw, 640)), cardX = Math.round(W / 2 - cardW / 2), cardY = 52;
      ctx.globalAlpha = clamp(k, 0, 1);
      // the band itself, with a hard rule top and bottom
      rect(ctx, cardX, cardY, cardW, 92, '#0a0810');
      rect(ctx, cardX, cardY, cardW, 2, '#e03a4a');
      rect(ctx, cardX, cardY + 90, cardW, 2, '#e03a4a');
      halftone(ctx, cardX, cardY + 2, cardW, 88, '#e03a4a', 6, 0.1);
      // a vertical strip down the left, the way a poster carries the venue
      rect(ctx, cardX + 8, cardY + 8, 16, 76, '#e03a4a');
      for (let i = 0; i < 5; i++) rect(ctx, cardX + 11, cardY + 14 + i * 14, 10, 9, '#0a0810');
      // the name, with a red shadow behind it so it sits off the black
      ctx.save(); ctx.translate(cardX + 34 + (cardW - 70) / 2, cardY + 22); ctx.scale(pop, pop);
      drawText(ctx, OPERA.title, 3, 3, '#7a1420', { align: 'center', scale: 5 });
      drawText(ctx, OPERA.title, 0, 0, '#f6efe2', { align: 'center', scale: 5 });
      ctx.restore();
      drawText(ctx, OPERA.venueName + '   ' + OPERA.seats, cardX + 34 + (cardW - 70) / 2, cardY + 64, '#e0a0a8', { align: 'center' });
      // the seal, stamped over the corner at an angle
      ctx.save(); ctx.translate(cardX + cardW - 28, cardY + 68); ctx.rotate(-0.12);
      ellipsePx(ctx, 0, 0, 20, 20, '#c8283a');
      ellipsePx(ctx, 0, 0, 17, 17, '#0a0810');
      ellipsePx(ctx, 0, 0, 15, 15, '#c8283a');
      for (let i = 0; i < 3; i++) rect(ctx, -8, -8 + i * 6, 16, 4, '#f6e6e8');
      ctx.restore();
      uiRibbon(ctx, W / 2, cardY + 100, OPERA.subtitle, { scale: 3, color: '#7a1a2a' });      ctx.globalAlpha = 1;
      if (this.phase === 'hello') bubble(ctx, W / 2 + 170, 300, this.beats[0].text, { dark: true, color: '#8a2a5a' });
      ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.t * 4);
      drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W / 2, H - 54, '#cfc9e6', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
      return;
    }

    if (this.phase === 'card') {
      const mv = this.mv, ins = INSTRUMENTS[this.you.instrument];
      const pop = popIn(this.phaseT, 0.3), py = H - PLATE_H + (1 - pop) * 70;
      const parts = mv.title.split('. '), num = parts[0], name = parts.slice(1).join('. ');
      this.cinePlate(ctx, py, PLATE_H + 40);
      // giant roman numeral
      ctx.globalAlpha = 0.24; drawText(ctx, num, 44, py + 26, '#ffd24a', { scale: 11 }); ctx.globalAlpha = 1;
      drawText(ctx, name, 150, py + 18, '#fff4d8', { scale: 5, outline: '#2a1a08' });
      // instrument + keycaps, drawn not described
      ctx.drawImage(icon('note'), 152, py + 62, 20, 18);
      drawText(ctx, ins.name.toUpperCase(), 180, py + 66, '#ffd24a', { scale: 2 });
      let kx = 180 + textWidth(ins.name.toUpperCase(), { scale: 2 }) + 22;
      for (const kn of ins.keyNames.slice(0, 6)) { const kw = textWidth(kn, { scale: 2 }) + 14; rect(ctx, kx, py + 58, kw, 26, '#2c2440'); frame(ctx, kx, py + 58, kw, 26, '#8a7ab0'); rect(ctx, kx + 1, py + 59, kw - 2, 3, '#4a4068'); drawText(ctx, kn, kx + kw / 2, py + 66, '#e8e0ff', { align: 'center', scale: 2 }); kx += kw + 8; }
      // difficulty as stars, and the hook line in one short row
      const pips = mv.impossible ? 5 : Math.min(5, mv.difficulty);
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = i < pips ? (mv.impossible ? 0.6 + 0.4 * Math.sin(this.t * 8 + i) : 1) : 0.15; ctx.drawImage(icon('star'), 152 + i * 24, py + 98, 20, 18); }
      ctx.globalAlpha = 1;
      drawText(ctx, mv.tutorial, 292, py + 102, mv.impossible ? '#ff7a6a' : '#b8aed0', { scale: 2 });
      this.cardBtn.draw(ctx);
      return;
    }

    if (this.phase === 'done') {
      const res = this.results[this.results.length - 1], acc = Math.round(res.acc * 100);
      const pop = popIn(this.phaseT, 0.34), py = H - PLATE_H + (1 - pop) * 70;
      const grade2 = acc > 95 ? 'S' : acc > 88 ? 'A' : acc > 78 ? 'B' : acc > 65 ? 'C' : 'D';
      const gc = acc > 88 ? '#6be585' : acc > 70 ? '#ffd24a' : '#e0785a';
      this.cinePlate(ctx, py, PLATE_H + 40);
      const bs = bounceScale(this.phaseT, 0.22, 11);
      ctx.save(); ctx.translate(96, py + 66); ctx.scale(bs, bs);
      drawText(ctx, grade2, 0, -34, gc, { align: 'center', scale: 9, outline: '#1a1208' });
      ctx.restore();
      drawText(ctx, acc + '%', 180, py + 24, '#fff4d8', { scale: 5, outline: '#2a1a08' });
      drawText(ctx, 'COMBO', 180, py + 76, '#8a82a8', { scale: 2 });
      drawText(ctx, String(res.maxCombo), 180 + textWidth('COMBO', { scale: 2 }) + 16, py + 72, '#ffd24a', { scale: 3 });
      const bar = clamp(res.acc, 0, 1) * 420;
      rect(ctx, 180, py + 106, 420, 10, '#241d2e'); rect(ctx, 180, py + 106, bar * Math.min(1, this.phaseT * 2), 10, gc);
      frame(ctx, 180, py + 106, 420, 10, '#4a4068');
      this.doneBtn.draw(ctx);
      return;
    }

    if (this.phase === 'fail') {
      ctx.globalAlpha = Math.min(0.5, this.booT * 0.3); rect(ctx, 0, 0, W, H, '#3a0000'); ctx.globalAlpha = 1;
      if (this.booT > 0.5) {
        const sh = Math.sin(this.booT * 22) * 3;
        drawText(ctx, 'THE SOLO COLLAPSES', W / 2 + sh, 128, '#ff5a5a', { align: 'center', scale: 6, outline: '#1a0000' });
      }
      return;
    }

    // ---- playing
    this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: Game.touch, pads: this.pads, overlay: !!L.open,
      kit: this.kitLayout ? { cx: W / 2, baseY: H - 150, width: W, zoom: 2 } : null });
    const p = this.rhythm.progress != null ? this.rhythm.progress : clamp(this.rhythm.now / this.song.length, 0, 1);
    const barY = L.open ? 0 : L.rhythmY + L.rhythmH - 3;
    rect(ctx, 0, barY, W, 4, '#241d2e'); rect(ctx, 0, barY, Math.round(W * p), 4, '#ffd24a');
    rect(ctx, 0, barY, Math.round(W * p), 1, '#fff2b0');
    drawText(ctx, this.mv.title, 10, barY + 8, '#ffd24a', { outline: '#1a1410' });
    drawPadStrip(ctx, L, this.pads, this.rhythm.keysDown);
    if (this.mv.impossible && this.strobe) { ctx.globalAlpha = 0.08; rect(ctx, 0, 0, W, H, '#fff'); ctx.globalAlpha = 1; }
  }
}

// ---------- Backstage: the awkward room ----------
class BackstageScene {
  constructor() {
    this.t = 0; this.step = 0; this.fx = new Particles(); this.motes = new Motes(30, 12);
    this.you = Game.run.members[0];
    this.mates = ROSTER.filter(r => r.key !== Game.run.hero).map(r => ({ key: r.key, spec: HERO_PRESETS[r.key], name: HERO_PRESETS[r.key].name, instrument: r.instrument }));
    this.beats = [
      { who: null, text: '' }, { who: 'mate0', text: '...' }, { who: 'you', text: 'I CAN FIX IT.' },
      { who: 'mate0', text: 'PACK YOUR CASE.' }, { who: 'mate1', text: 'SORRY.' }, { who: null, text: 'THE DOOR' },
    ];
    this.stepT = 0; this.rng = makeRng(404);
    this.costumes = [{ c: '#c8a83a', h: 30 }, { c: '#8a2a5a', h: 36 }, { c: '#2c6ec0', h: 28 }, { c: '#d8d0c0', h: 34 }];
  }
  advance() {
    this.step++; this.stepT = 0; Audio.ui('select');
    Game.shake.hit(2, 0.12);
    if (this.step === 3) { drawDust(this.fx, 250, 470, 10, '#6a5a70'); Audio.ui('hurt'); }
    if (this.step >= this.beats.length) Game.go(() => new FlightScene(), 'slideL', { dur: 0.5 });
  }
  update(dt) { this.t += dt; this.stepT += dt; this.fx.update(dt); this.motes.update(dt, this.t); if (Math.random() < dt * 0.7) this.fx.add({ x: 200 + Math.random() * 560, y: 386, vx: 0, vy: -6, life: 3, kind: 'smoke', color: '#4a4256', size: 3, grow: 5, alpha: 0.2 }); }
  key(code) { if (['Enter', 'Space', 'KeyZ'].includes(code)) this.advance(); }
  click() { this.advance(); }
  draw(ctx) {
    const floorY = 388;
    // ---- wall: panelling, dado rail, wallpaper stripe
    vgrad(ctx, 0, 0, W, floorY, '#3b3048', '#221a30');
    for (let x = 0; x < W; x += 48) { rect(ctx, x, 0, 2, floorY, '#2b2239'); rect(ctx, x + 24, 0, 1, floorY, '#453a55'); }
    rect(ctx, 0, 300, W, 5, '#4e3f5e'); rect(ctx, 0, 305, W, 2, '#1d1728');
    vgrad(ctx, 0, 307, W, floorY - 307, '#312842', '#251e34');
    // ---- floor: boards in light perspective
    vgrad(ctx, 0, floorY, W, H - floorY, '#4a3528', '#2b1e16');
    rect(ctx, 0, floorY - 6, W, 6, '#6a4d3a'); rect(ctx, 0, floorY - 6, W, 2, '#8a6a50');
    for (let i = 0; i < 26; i++) { const k = i / 26, x = W / 2 + (k - 0.5) * W * 2.1; line(ctx, W / 2 + (k - 0.5) * W * 0.9, floorY, x, H, '#231a14'); }
    for (let y = floorY + 14; y < H; y += 26) { ctx.globalAlpha = 0.35; rect(ctx, 0, y, W, 1, '#20170f'); ctx.globalAlpha = 1; }
    // ---- ceiling strip light + its pool on the floor
    rect(ctx, 300, 0, 340, 10, '#1c1626'); rect(ctx, 316, 8, 308, 5, '#fff2c0');
    lightPool(ctx, 470, 60, 300, '#ffe6a0', 0.1);
    lightPool(ctx, 470, floorY + 40, 260, '#ffd88a', 0.07);
    // ---- vanity: mirror, bulbs, counter, clutter
    rect(ctx, 44, 84, 268, 186, '#15121c'); frame(ctx, 44, 84, 268, 186, '#7a6440'); frame(ctx, 47, 87, 262, 180, '#4a3a22');
    vgrad(ctx, 54, 94, 248, 166, '#4a4a60', '#2e2e40');
    ctx.globalAlpha = 0.18; for (let i = 0; i < 6; i++) line(ctx, 54 + i * 46, 94, 54 + i * 46 - 40, 260, '#ffffff'); ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.5; drawBugAt(ctx, this.you.spec, 178, 258, { pose: 'sad', scale: 2.3, expr: 'sad', t: this.t, rate: 0.9, bounce: 0.5 }); ctx.globalAlpha = 1;
    for (let i = 0; i < 10; i++) {
      const bx = 58 + i * 27, on = Math.floor(this.t * 2.2 + i * 1.7) % 9 !== 0;
      circle(ctx, bx + 6, 74, 6, on ? '#ffeeb0' : '#5a5040'); circle(ctx, bx + 4, 72, 2, on ? '#fffbe8' : '#6a6050');
      if (on) lightPool(ctx, bx + 6, 74, 34, '#ffe680', 0.13);
    }
    rect(ctx, 38, 270, 282, 12, '#6a4d3a'); rect(ctx, 38, 270, 282, 3, '#8f6a50'); rect(ctx, 38, 282, 282, 4, '#392719');
    // counter clutter
    ctx.drawImage(propCanvas('can'), 70, 250, 10, 20); ctx.drawImage(propCanvas('can'), 88, 254, 8, 16);
    rect(ctx, 116, 256, 22, 14, '#c83a5a'); rect(ctx, 116, 256, 22, 3, '#e8687a');
    circle(ctx, 160, 264, 7, '#e8e0d0'); circle(ctx, 158, 262, 2, '#fff');
    rect(ctx, 186, 252, 6, 18, '#6be585'); rect(ctx, 200, 258, 30, 12, '#2a2434'); rect(ctx, 202, 260, 26, 8, '#4a4256');
    ctx.drawImage(propCanvas('stool'), 156, 286, 32, 36);
    // ---- gold records + setlist on the wall
    for (let i = 0; i < 3; i++) { const gx = 348 + i * 62; ctx.drawImage(propCanvas('goldrecord'), gx, 96 + (i % 2) * 10, 48, 48); ctx.globalAlpha = 0.18; circle(ctx, gx + 24, 120 + (i % 2) * 10, 30, '#ffd24a'); ctx.globalAlpha = 1; }
    rect(ctx, 548, 100, 46, 62, '#efe6cc'); frame(ctx, 548, 100, 46, 62, '#9a8a68');
    for (let i = 0; i < 7; i++) rect(ctx, 553, 108 + i * 8, 30 - (i % 3) * 6, 2, '#6a6058');
    rect(ctx, 564, 96, 14, 8, '#d8d0b0'); ctx.globalAlpha = 0.6; rect(ctx, 564, 96, 14, 8, '#efe6cc'); ctx.globalAlpha = 1;
    ctx.drawImage(propCanvas('clock'), 624, 104, 36, 36);
    // ---- clothes rack
    rect(ctx, 356, 196, 190, 4, '#8a8a98'); rect(ctx, 358, 200, 3, 104, '#6a6a78'); rect(ctx, 540, 200, 3, 104, '#6a6a78');
    this.costumes.forEach((c, i) => {
      const cx = 378 + i * 42, sway = Math.sin(this.t * 1.1 + i) * 1.5;
      rect(ctx, cx + 5 + sway, 196, 2, 8, '#b0b0c0');
      ctx.fillStyle = '#b8b8c8'; ctx.beginPath(); ctx.moveTo(cx + 6 + sway, 202); ctx.lineTo(cx - 9 + sway, 210); ctx.lineTo(cx + 21 + sway, 210); ctx.closePath(); ctx.fill();
      ctx.fillStyle = c.c; ctx.beginPath(); ctx.moveTo(cx + 6 + sway, 204); ctx.lineTo(cx - 11 + sway, 214); ctx.lineTo(cx - 8 + sway, 214 + c.h); ctx.lineTo(cx + 20 + sway, 214 + c.h); ctx.lineTo(cx + 23 + sway, 214); ctx.closePath(); ctx.fill();
      rect(ctx, cx - 9 + sway, 214, 30, 3, lighten(c.c, 0.25)); rect(ctx, cx + 4 + sway, 218, 2, c.h - 8, darken(c.c, 0.22));
    });
    // ---- couch against the wall
    const cy = floorY - 4;
    rect(ctx, 372, cy - 74, 236, 44, '#7a3a4e'); rect(ctx, 372, cy - 74, 236, 5, '#a4526a');
    for (let i = 0; i < 3; i++) { const bx = 382 + i * 74; rect(ctx, bx, cy - 68, 66, 34, '#8e4459'); rect(ctx, bx + 2, cy - 66, 62, 4, '#ad5a72'); }
    rect(ctx, 362, cy - 66, 22, 54, '#6a3244'); rect(ctx, 596, cy - 66, 22, 54, '#6a3244');
    rect(ctx, 372, cy - 34, 236, 24, '#8e4459'); rect(ctx, 372, cy - 34, 236, 4, '#a4526a');
    rect(ctx, 380, cy - 10, 12, 12, '#33221c'); rect(ctx, 588, cy - 10, 12, 12, '#33221c');
    // jacket thrown over the arm
    rect(ctx, 586, cy - 78, 34, 40, '#2c6ec0'); rect(ctx, 586, cy - 78, 34, 4, '#4a8ce0'); rect(ctx, 594, cy - 40, 18, 10, '#245ba0');
    // ---- flight cases + guitar case + cables
    ctx.drawImage(propCanvas('flightcase'), 646, floorY - 44, 90, 60);
    ctx.drawImage(propCanvas('flightcase'), 660, floorY - 82, 62, 41);
    ctx.drawImage(propCanvas('amp'), 300, floorY - 10, 64, 56);
    ctx.drawImage(propCanvas('guitarcase'), 96, floorY - 64, 34, 94);
    ctx.drawImage(propCanvas('cooler'), 748, floorY + 14, 60, 45);
    ctx.strokeStyle = '#191319'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(340, floorY + 40); ctx.bezierCurveTo(470, floorY + 76, 560, floorY + 12, 700, floorY + 52); ctx.stroke();
    ctx.strokeStyle = '#2a2028'; ctx.lineWidth = 3; ctx.beginPath();
    ctx.moveTo(120, floorY + 72); ctx.bezierCurveTo(260, floorY + 30, 330, floorY + 92, 480, floorY + 66); ctx.stroke(); ctx.lineWidth = 1;
    // ---- door + EXIT
    rect(ctx, 774, 104, 152, 284, '#2a1c12');
    rect(ctx, 782, 112, 136, 276, '#4e3520'); frame(ctx, 782, 112, 136, 276, '#2a1a10');
    rect(ctx, 794, 126, 112, 110, '#5c4029'); frame(ctx, 794, 126, 112, 110, '#3a2818');
    rect(ctx, 794, 246, 112, 128, '#5c4029'); frame(ctx, 794, 246, 112, 128, '#3a2818');
    circle(ctx, 898, 256, 6, '#e8c25a'); circle(ctx, 896, 254, 2, '#fff2c0');
    const open = this.step >= 5 ? clamp(this.stepT * 1.1, 0, 1) : 0;
    if (open > 0) { const w = Math.round(open * 120); rect(ctx, 782 + 136 - w, 112, w, 276, '#0e0c14'); vgrad(ctx, 782 + 136 - w, 112, w, 276, '#1a2a3a', '#0a0810'); ctx.globalAlpha = 0.5 * open; rect(ctx, 782 + 136 - w, 360, w, 28, '#9fd8ff'); ctx.globalAlpha = 1; }
    const eg = this.step >= 5 ? 0.5 + 0.3 * Math.sin(this.t * 6) : 0.2;
    rect(ctx, 806, 74, 88, 26, '#123018'); frame(ctx, 806, 74, 88, 26, '#0a1a0e');
    ctx.globalAlpha = eg; rect(ctx, 810, 78, 80, 18, '#6be585'); ctx.globalAlpha = 1;
    drawText(ctx, 'EXIT', 850, 80, '#0b2412', { align: 'center', scale: 2 });
    lightPool(ctx, 850, 96, 120, '#6be585', 0.1 + eg * 0.12);
    if (this.step >= 5) lightPool(ctx, 850, floorY + 10, 190, '#8fe0ff', 0.12);
    // ---- cast
    const you = { x: 236, y: 472 };
    const sagging = this.step >= 3;
    drawShadow(ctx, you.x, you.y, 52, 0.34);
    drawBugAt(ctx, this.you.spec, you.x, you.y, { pose: 'sad', instrument: sagging ? null : this.you.instrument, scale: 2.3, expr: 'sad', t: this.t, rate: 0.8, bounce: 0.6 });
    if (sagging) { ctx.drawImage(propCanvas('suitcase'), you.x + 34, you.y - 26, 46, 36); }
    this.mates.forEach((m, i) => {
      const x = 596 + i * 92, pointing = this.step >= 3 && i === 0;
      drawShadow(ctx, x, 472, 46, 0.3);
      drawBugAt(ctx, m.spec, x, 472, { pose: pointing ? 'point' : 'idle', flip: true, scale: 2.1, expr: this.step >= 3 ? 'angry' : (this.step >= 1 ? 'sad' : 'none'), t: this.t, rate: 1.6 + i * 0.2, phase: i * 1.9, bounce: pointing ? 1.8 : 0.8, tilt: pointing ? Math.sin(this.t * 7) * 0.05 - 0.06 : 0 });
      if (pointing) { ctx.globalAlpha = 0.5 + 0.4 * Math.sin(this.t * 7); drawText(ctx, '>', x - 62, 392, '#ff6b6b', { scale: 3 }); ctx.globalAlpha = 1; }
    });
    // ---- atmosphere
    this.fx.draw(ctx); this.motes.draw(ctx, this.t, '#d8c8ff');
    vignette(ctx, 0.5);
    // ---- the line
    const b = this.beats[this.step];
    if (b && b.text) {
      const pop = popIn(this.stepT, 0.24);
      ctx.save(); ctx.translate(0, (1 - pop) * 8);
      if (b.who === 'you') bubble(ctx, you.x + 62, 330, b.text, {});
      else if (b.who === 'mate0') bubble(ctx, 596, 322, b.text, { dark: true, color: '#8a2a5a' });
      else if (b.who === 'mate1') bubble(ctx, 716, 296, b.text, {});
      else uiRibbon(ctx, W / 2, 26, b.text, { scale: 3, color: '#c8433a' });
      ctx.restore();
    }
    if (this.step <= 1) for (let i = 0; i < 3; i++) { const a = 0.3 + 0.35 * Math.sin(this.t * 2.4 - i * 0.8); ctx.globalAlpha = clamp(a, 0, 1); circle(ctx, 470 + i * 16, 350, 3, '#b8b0e0'); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.45 + 0.25 * Math.sin(this.t * 3);
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W - 54, H - 24, '#9a92b8', { align: 'right', font: 'small' });
    ctx.globalAlpha = 1;
  }
}

// ---------- The flight: one last practice ----------
class FlightScene {
  constructor() {
    this.t = 0; this.phase = 'board'; this.phaseT = 0; this.fx = new Particles(); this.clouds = [];
    const r = makeRng(21); for (let i = 0; i < 14; i++) this.clouds.push({ x: r.range(0, W), y: r.range(30, 200), s: r.range(0.6, 1.6), sp: r.range(20, 50) });
    this.you = Game.run.members[0];
    // Nobody practises on a plane. You sit by the window and you look at the
    // place that is about to happen to you.
    this.lines = [
      'THE CAPTAIN SAYS WE BEGIN OUR DESCENT.',
      'IT GOES ON PAST THE HORIZON IN EVERY DIRECTION.',
      'THIRTY-SEVEN MILLION OF THEM DOWN THERE.',
      'AND NOT ONE OF THEM KNOWS YOUR NAME ANY MORE.',
    ];
    this.li = 0; this.lineT = 0;
    this.layout();
  }
  layout() { this.L = { seatTop: 18, seatH: 130, padY: 0, padH: 0 }; }
  isPlaying() { return false; }
  update(dt) {
    this.t += dt; this.phaseT += dt; this.fx.update(dt);
    for (const c of this.clouds) { c.x -= c.sp * dt; if (c.x < -60) { c.x = W + 40; c.y = 30 + Math.random() * 170; } }
    if (this.phase === 'board') { if (this.phaseT > 3.4) { this.phase = 'window'; this.phaseT = 0; } }
    else if (this.phase === 'window') {
      this.lineT += dt;
      if (this.lineT > 3.4 && this.li < this.lines.length - 1) { this.li++; this.lineT = 0; }
      else if (this.lineT > 4.4 && this.li >= this.lines.length - 1) this.leave();
    }
  }
  leave() { if (this.left) return; this.left = true; Game.run.save(); Game.go(() => new CrossingScene(() => new CityScene(true)), 'fade', { dur: 0.7 }); }
  advance() {
    if (this.phase === 'board') { this.phase = 'window'; this.phaseT = 0; return; }
    if (this.li < this.lines.length - 1) { this.li++; this.lineT = 0; return; }
    this.leave();
  }
  key(code) { if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(code)) this.advance(); }
  keyUp() {}
  pointerDown() { this.advance(); }
  pointerMove() {}
  pointerUp() {}
  // ---- the gate, an hour before the flight
  drawGate(ctx) {
    const t = this.t;
    if (!this.gate) {
      const r = makeRng(515);
      this.gate = {
        waiting: [0, 1, 2, 3, 4, 5, 6].map(i => ({ spec: randomBugSpec(r), row: i, asleep: r.chance(0.3), kid: r.chance(0.3), o: r.range(0, 6) })),
        walkers: [0, 1, 2].map(i => ({ spec: randomBugSpec(r), x: r.range(0, W), sp: r.range(14, 26) * r.sign(), bag: r.chance(0.6), o: r.range(0, 6) })),
        clerk: randomBugSpec(r), barista: randomBugSpec(r),
      };
    }
    const G = this.gate;
    // ---- terminal shell
    vgrad(ctx, 0, 0, W, 330, '#e6e6ee', '#c6c8d4');
    rect(ctx, 0, 0, W, 34, '#b8bcc8'); rect(ctx, 0, 32, W, 3, '#8f94a2');
    for (let x = 24; x < W; x += 120) { rect(ctx, x, 0, 6, 34, '#9aa0ae'); }
    // strip lights in the ceiling
    for (let x = 60; x < W; x += 150) { rect(ctx, x, 6, 90, 6, '#fffbe8'); lightPool(ctx, x + 45, 20, 130, '#fff4c0', 0.12); }
    // ---- glass wall onto the apron, with the plane
    rect(ctx, 0, 34, W, 250, '#7fb3dc');
    vgrad(ctx, 4, 38, W - 8, 242, '#b9dcf2', '#7fb3dc');
    // distant hills and runway
    ctx.fillStyle = '#9ab89a'; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(200, 120); ctx.lineTo(420, 152); ctx.lineTo(700, 118); ctx.lineTo(W, 148); ctx.lineTo(W, 200); ctx.lineTo(0, 200); ctx.fill();
    rect(ctx, 0, 196, W, 88, '#8f97a4'); rect(ctx, 0, 196, W, 3, '#a8b0bc');
    for (let x = 0; x < W; x += 60) rect(ctx, x, 238, 34, 3, '#e8e4d0');
    // the aircraft
    const px0 = 230 + Math.sin(t * 0.4) * 6;
    rect(ctx, px0, 186, 392, 46, '#f2f2f8'); rect(ctx, px0, 186, 392, 6, '#ffffff');
    rect(ctx, px0, 214, 392, 8, '#2f5a9a');
    ctx.fillStyle = '#f2f2f8'; ctx.beginPath(); ctx.moveTo(px0 + 392, 186); ctx.lineTo(px0 + 452, 200); ctx.lineTo(px0 + 452, 224); ctx.lineTo(px0 + 392, 232); ctx.fill();
    ctx.fillStyle = '#2f5a9a'; ctx.beginPath(); ctx.moveTo(px0 + 352, 186); ctx.lineTo(px0 + 402, 138); ctx.lineTo(px0 + 424, 138); ctx.lineTo(px0 + 400, 186); ctx.fill();
    for (let i = 0; i < 13; i++) rect(ctx, px0 + 30 + i * 26, 198, 13, 11, '#8ec8f0');
    rect(ctx, px0 + 96, 232, 150, 30, '#c8c8d4'); circle(ctx, px0 + 120, 250, 13, '#3a3a48'); circle(ctx, px0 + 120, 250, 7, '#8a8a98');
    rect(ctx, px0 + 8, 224, 34, 16, '#c8c8d4');
    // jet bridge reaching in from the right
    rect(ctx, px0 + 300, 196, 320, 26, '#b8bcc8'); rect(ctx, px0 + 300, 196, 320, 4, '#d4d8e2');
    for (let x = px0 + 310; x < px0 + 620; x += 26) rect(ctx, x, 200, 10, 16, '#8ec8f0');
    // ground crew
    for (const gx of [px0 + 60, px0 + 300]) { drawShadow(ctx, gx, 268, 20, 0.2); drawBugAt(ctx, G.clerk, gx, 268, { pose: Math.floor(t * 2) % 2 ? 'point' : 'idle', scale: 0.8, rate: 1.6 }); }
    // mullions
    rect(ctx, 0, 280, W, 8, '#8f94a2');
    for (let x = 0; x < W; x += 128) { rect(ctx, x, 34, 7, 250, '#c8ccd8'); rect(ctx, x + 1, 34, 2, 250, '#eef0f6'); }
    ctx.globalAlpha = 0.16; for (let x = -200; x < W; x += 160) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(x, 284); ctx.lineTo(x + 70, 34); ctx.lineTo(x + 110, 34); ctx.lineTo(x + 40, 284); ctx.fill(); } ctx.globalAlpha = 1;
    // ---- floor
    vgrad(ctx, 0, 288, W, H - 288, '#d8d4cc', '#b0aca6');
    for (let x = 0; x < W; x += 48) rect(ctx, x, 288, 1, H - 288, '#c4c0b8');
    for (let y = 300; y < H; y += 34) rect(ctx, 0, y, W, 1, '#c4c0b8');
    ctx.globalAlpha = 0.12; for (let x = 0; x < W; x += 90) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 300, 30, H - 300); } ctx.globalAlpha = 1;
    // ---- duty free, left
    rect(ctx, 12, 210, 300, 150, '#f2ead6'); frame(ctx, 12, 210, 300, 150, '#8a7450');
    rect(ctx, 12, 210, 300, 26, '#7a2a5a'); rect(ctx, 14, 212, 296, 2, '#a8467e');
    drawText(ctx, 'DUTY FREE', 162, 217, '#ffd9ea', { align: 'center', scale: 2, shadow: '#4a1636' });
    for (let i = 0; i < 3; i++) {
      const sy = 262 + i * 34; rect(ctx, 20, sy, 284, 5, '#b09a6e'); rect(ctx, 20, sy, 284, 2, '#d8c79c');
      const rr = makeRng(60 + i * 3);
      for (let x = 26; x < 296; x += 30) {
        const k = rr.pick(['bottle', 'bottle', 'coffee', 'book', 'poster']);
        ctx.drawImage(itemCanvas(k), 0, 0, 32, 32, x, sy - 28, 28, 28);
      }
    }
    drawShadow(ctx, 268, 360, 28, 0.2);
    drawBugAt(ctx, G.barista, 268, 360, { pose: 'idle', expr: 'happy', scale: 1.1, rate: 1.4 });
    rect(ctx, 236, 344, 62, 18, '#8a5f36'); rect(ctx, 236, 344, 62, 4, '#b5834f');
    // ---- gate desk, right
    rect(ctx, 660, 258, 284, 102, '#31537f'); rect(ctx, 660, 258, 284, 6, '#4a75a8');
    rect(ctx, 668, 266, 268, 30, '#12213a');
    const blink = Math.floor(t * 2) % 2 === 0;
    drawText(ctx, 'GATE A12', 678, 272, '#ffb340', { scale: 2 });
    if (blink) drawText(ctx, 'BOARDING', 838, 272, '#6be585', { align: 'center', scale: 2 });
    for (let i = 0; i < 3; i++) drawText(ctx, ['SFO  0740  ON TIME', 'LAX  0815  DELAYED', 'PDX  0905  ON TIME'][i], 676, 302 + i * 16, i === 1 ? '#e0785a' : '#cfe0f0', { font: 'small' });
    drawShadow(ctx, 790, 372, 30, 0.2);
    drawBugAt(ctx, G.clerk, 790, 372, { pose: 'idle', expr: 'happy', scale: 1.2, rate: 1.3 });
    // ---- planters
    for (const bx of [340, 620]) {
      rect(ctx, bx, 300, 54, 32, '#9a7a52'); rect(ctx, bx, 300, 54, 4, '#b89a70'); frame(ctx, bx, 300, 54, 32, '#6a5236');
      circle(ctx, bx + 16, 294, 15, '#4f8a56'); circle(ctx, bx + 36, 290, 13, '#3f7a48'); circle(ctx, bx + 26, 280, 12, '#6fae72');
      circle(ctx, bx + 12, 284, 7, '#6fae72');
    }
    // ---- seating rows with travellers
    const rowY = [402, 470];
    for (let r2 = 0; r2 < 2; r2++) {
      const y = rowY[r2];
      rect(ctx, 60, y, 840, 8, '#5f6672'); rect(ctx, 60, y, 840, 3, '#7d8493');
      for (let i = 0; i < 8; i++) { const sx = 72 + i * 106; rect(ctx, sx, y - 26, 84, 26, '#3f6ea8'); rect(ctx, sx, y - 26, 84, 3, '#5b8fcc'); rect(ctx, sx + 38, y + 8, 8, 22, '#5f6672'); }
      rect(ctx, 88, y + 30, 8, 6, '#4a5058'); rect(ctx, 864, y + 30, 8, 6, '#4a5058');
    }
    G.waiting.forEach((p, i) => {
      const row = i < 4 ? 0 : 1, y = rowY[row] - 4;
      const x = 104 + (i % 4) * 212 + (row ? 60 : 0);
      drawShadow(ctx, x, y + 4, 26, 0.18);
      drawBugAt(ctx, p.spec, x, y + 2, { pose: p.asleep ? 'sad' : 'idle', expr: p.asleep ? 'sleepy' : null, scale: p.kid ? 0.85 : 1.25, rate: p.asleep ? 0.7 : 1.6, phase: p.o });
      if (p.asleep) { ctx.globalAlpha = 0.4 + 0.3 * Math.sin(t * 2 + i); drawText(ctx, 'Z', x + 18, y - 48 - (t * 8 % 14), '#6a7080', { scale: 2 }); ctx.globalAlpha = 1; }
      // backpack on the floor beside them
      if (i % 2 === 0) ctx.drawImage(itemCanvas('bag'), 0, 0, 32, 32, x + 22, y - 20, 26, 26);
      if (p.kid) { const kx = x + 34; drawShadow(ctx, kx, y + 6, 16, 0.16); drawBugAt(ctx, p.spec, kx, y + 4, { pose: Math.floor(t * 3 + i) % 2 ? 'cheer' : 'idle2', expr: 'happy', scale: 0.6, rate: 4.2, phase: i }); }
    });
    // ---- travellers walking past
    G.walkers.forEach((wk, i) => {
      wk.x += wk.sp * (1 / 60); if (wk.x < -40) wk.x = W + 40; if (wk.x > W + 40) wk.x = -40;
      drawShadow(ctx, wk.x, 520, 30, 0.2);
      drawBugAt(ctx, wk.spec, wk.x, 518, { pose: Math.floor(t * 5 + i) % 2 ? 'walk1' : 'walk2', flip: wk.sp < 0, scale: 1.35, rate: 3.4, phase: wk.o });
      if (wk.bag) { ctx.drawImage(itemCanvas('bag'), 0, 0, 32, 32, wk.x + (wk.sp < 0 ? -34 : 12), 492, 24, 24); rect(ctx, wk.x + (wk.sp < 0 ? -22 : 22), 470, 2, 24, '#4a4050'); }
    });
    // ---- you, with your case, heading for the gate
    const yx = 470 + Math.sin(t * 0.5) * 10;
    drawShadow(ctx, yx, 520, 46, 0.28);
    drawBugAt(ctx, this.you.spec, yx, 518, { pose: Math.floor(t * 4) % 2 ? 'walk1' : 'walk2', instrument: this.you.instrument, scale: 2.1, expr: 'sad', rate: 3.2 });
    ctx.drawImage(itemCanvas('bag'), 0, 0, 32, 32, yx + 30, 492, 30, 30);
    if (t > 1.2) bubble(ctx, yx + 54, 404, 'ONE WAY.', {});
    // ---- hanging sign
    rect(ctx, 380, 34, 220, 34, '#12213a'); frame(ctx, 380, 34, 220, 34, '#3a4050');
    rect(ctx, 470, 34, 2, 10, '#8a8a98'); rect(ctx, 510, 34, 2, 10, '#8a8a98');
    drawText(ctx, 'GATES A1 - A20', 490, 44, '#ffd9a0', { align: 'center', scale: 2 });
    ctx.drawImage(icon('arrowR'), 578, 44, 10, 18);
    grade(ctx, 0, 0, W, H, '#cfe0ff', 0.1);
    vignette(ctx, 0.36);
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0d0b18');
    if (this.phase === 'board') { this.drawGate(ctx); return; }
    this.drawWindow(ctx);
  }
  // ---- The window seat, coming in over Tokyo. There is no practice on this
  // plane any more; there is a pane of glass and a city on the other side.
  drawWindow(ctx) {
    const t = this.t;
    // the cabin wall, the panel lines and the trim under the window
    vgrad(ctx, 0, 0, W, H, '#2b2736', '#14121c');
    for (let y = 0; y < H; y += 46) { ctx.globalAlpha = 0.25; rect(ctx, 0, y, W, 1, '#3a3648'); ctx.globalAlpha = 1; }
    rect(ctx, 0, 0, W, 30, '#343040'); rect(ctx, 0, 30, W, 3, '#1b1824');
    // the reading lights and the seatbelt sign overhead
    for (let i = 0; i < 7; i++) { const lx = 74 + i * 136; circle(ctx, lx, 14, 5, '#3f3a4e'); if (i % 3 === 0) { circle(ctx, lx, 14, 3, '#ffe6a0'); lightPool(ctx, lx, 22, 70, '#ffdf9a', 0.07); } }
    rect(ctx, W / 2 - 34, 6, 68, 18, '#2a2634'); frame(ctx, W / 2 - 34, 6, 68, 18, '#4a4458');
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2.4); drawText(ctx, 'SEATBELTS', W / 2, 12, '#ffcf6a', { align: 'center', font: 'small' }); ctx.globalAlpha = 1;
    // ---- the window itself: a big rounded pane with the city in it
    const wx = 168, wy = 74, ww = 636, wh = 328, rr = 58;
    const pane = (px2, py2, pw, ph, rad) => {
      ctx.beginPath();
      ctx.moveTo(px2 + rad, py2);
      ctx.lineTo(px2 + pw - rad, py2); ctx.quadraticCurveTo(px2 + pw, py2, px2 + pw, py2 + rad);
      ctx.lineTo(px2 + pw, py2 + ph - rad); ctx.quadraticCurveTo(px2 + pw, py2 + ph, px2 + pw - rad, py2 + ph);
      ctx.lineTo(px2 + rad, py2 + ph); ctx.quadraticCurveTo(px2, py2 + ph, px2, py2 + ph - rad);
      ctx.lineTo(px2, py2 + rad); ctx.quadraticCurveTo(px2, py2, px2 + rad, py2);
      ctx.closePath();
    };
    // the frame: three rings of trim, the way a cabin window is built
    ctx.fillStyle = '#4a4458'; pane(wx - 16, wy - 16, ww + 32, wh + 32, rr + 14); ctx.fill();
    ctx.fillStyle = '#2f2b3c'; pane(wx - 8, wy - 8, ww + 16, wh + 16, rr + 7); ctx.fill();
    ctx.fillStyle = '#0a0a12'; pane(wx, wy, ww, wh, rr); ctx.fill();
    ctx.save(); pane(wx, wy, ww, wh, rr); ctx.clip();
    // the whole city, out to the horizon
    drawTokyoFromAbove(ctx, wx, wy, ww, wh, t, { seed: 5 });
    // the wing, coming in from the bottom left with its light going
    ctx.fillStyle = '#20202e'; ctx.beginPath();
    ctx.moveTo(wx - 10, wy + wh); ctx.lineTo(wx + 210, wy + wh); ctx.lineTo(wx + 96, wy + wh - 74); ctx.lineTo(wx - 10, wy + wh - 46); ctx.fill();
    rect(ctx, wx + 60, wy + wh - 54, 40, 3, '#3a3a52');
    if (Math.sin(t * 3.4) > 0.72) { circle(ctx, wx + 96, wy + wh - 72, 3, '#9fe8ff'); ctx.globalAlpha = 0.4; circle(ctx, wx + 96, wy + wh - 72, 8, '#9fe8ff'); ctx.globalAlpha = 1; }
    // cloud passing under the wing
    for (let i = 0; i < 4; i++) {
      const cx2 = wx + ww - ((t * 40 + i * 260) % (ww + 300));
      ctx.globalAlpha = 0.13; ctx.drawImage(propCanvas('cloud'), cx2, wy + wh - 120 + (i % 2) * 40, 150, 52); ctx.globalAlpha = 1;
    }
    // ---- the glass: a sheen across it, and his own face looking back
    ctx.globalAlpha = 0.09; ctx.fillStyle = '#cfe0ff';
    ctx.beginPath(); ctx.moveTo(wx, wy + wh * 0.62); ctx.lineTo(wx + ww * 0.5, wy); ctx.lineTo(wx + ww * 0.78, wy); ctx.lineTo(wx, wy + wh); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.globalAlpha = 0.16;
    drawBugAt(ctx, this.you.spec, wx + ww - 150, wy + wh - 26, { pose: 'sad', scale: 2.6, expr: 'sad', t: t, rate: 0.7, bounce: 0.35 });
    ctx.globalAlpha = 1;
    ctx.restore();
    // condensation and a scratch or two on the pane
    ctx.globalAlpha = 0.1; for (let i = 0; i < 30; i++) { const sx = wx + ((i * 137) % ww), sy = wy + ((i * 71) % wh); rect(ctx, sx, sy, 1, 2 + (i % 3), '#dfe8ff'); } ctx.globalAlpha = 1;
    // the shade, pulled up, and the little tray edge below
    rect(ctx, wx - 16, wy - 22, ww + 32, 10, '#3a3648'); rect(ctx, wx - 16, wy - 22, ww + 32, 3, '#544e68');
    // ---- him, in the seat: the back of the chair, then him in it, turned to
    // the glass, which is the whole shot
    rect(ctx, 14, 384, 176, 156, '#241f30'); rect(ctx, 14, 384, 176, 5, '#3c364e');
    rect(ctx, 24, 398, 156, 124, '#2e2940');
    for (let i = 0; i < 6; i++) rect(ctx, 32, 408 + i * 19, 140, 2, '#241f30');
    const hx = 128, hy2 = 470;
    drawBugAt(ctx, this.you.spec, hx, hy2, { pose: 'sad', scale: 3.6, expr: 'sad', t: t, rate: 0.6, bounce: 0.3 });
    // the armrest between him and the window, and his hand on it
    rect(ctx, 176, 462, 78, 12, '#3a3448'); rect(ctx, 176, 462, 78, 3, '#544e68');
    rect(ctx, 176, 474, 78, 8, '#241f30');
    // the seat in front, with a tray table down and a paper cup on it
    rect(ctx, 706, 392, 240, 148, '#2a2636'); rect(ctx, 706, 392, 240, 5, '#453f58');
    rect(ctx, 690, 446, 250, 10, '#4a4458'); rect(ctx, 690, 446, 250, 3, '#655d7c');
    rect(ctx, 760, 424, 22, 24, '#d8d2c4'); rect(ctx, 760, 424, 22, 4, '#f0ebe0'); rect(ctx, 762, 430, 18, 3, '#8a7a5a');
    ctx.drawImage(icon('note'), 818, 418, 18, 16);
    // ---- the line he is thinking, in a plate along the bottom
    const plate = 92;
    ctx.globalAlpha = 0.86; rect(ctx, 0, H - plate, W, plate, '#0b0914'); ctx.globalAlpha = 1;
    rect(ctx, 0, H - plate, W, 2, '#c8a03a');
    const shown = this.lines[this.li] || '';
    const chars = Math.min(shown.length, Math.floor(this.lineT * 34));
    drawText(ctx, shown.slice(0, chars), W / 2, H - plate + 30, '#f2ecd8', { align: 'center', scale: 3 });
    for (let i = 0; i < this.lines.length; i++) {
      rect(ctx, W / 2 - this.lines.length * 9 + i * 18, H - 22, 12, 3, i <= this.li ? '#c8a03a' : '#3a3444');
    }
    ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 4);
    drawText(ctx, Game.touch ? 'TAP' : 'ENTER', W - 20, H - 26, '#cfc9e6', { align: 'right', font: 'small' });
    ctx.globalAlpha = 1;
    letterbox(ctx, 22, 1);
    vignette(ctx, 0.4);
  }
}
