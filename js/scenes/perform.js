// ---------- Street gigs: venue backdrops, band, crowd, rhythm panel, payout tally ----------
'use strict';
// Static venue backdrop layers. Returns {far, mid, drawGround(ctx,L,t), props:[{kind,x}]}
function buildVenue(venue, seed, dayT) {
  const r = makeRng(seed); const skyT = clamp(venue.sky * 0.6 + dayT * 0.5, 0, 1);
  const V = { skyT, kind: venue.kind };
  const far = makeCanvas(W, 140), fx = far.getContext('2d');
  const [c1, c2] = skyColors(skyT); vgrad(fx, 0, 0, W, 140, c1, c2);
  if (skyT > 0.7) { for (let i = 0; i < 40; i++) px(fx, r.int(0, W), r.int(0, 80), '#fff'); }
  if (skyT > 0.45 && skyT < 0.8) { circle(fx, r.int(80, 560), 40, 12, '#fff0b0'); }
  if (venue.kind !== 'subway') {
    fx.drawImage(skylineCanvas(seed, W, 70, { color: skyT > 0.6 ? '#1e1a3a' : '#7a86a8', lit: '#ffe6a0', tall: venue.tall || venue.kind === 'pier', density: skyT > 0.5 ? 0.35 : 0.1 }), 0, 70);
    (venue.landmarks || []).forEach((lm, i) => { const c = landmarkCanvas(lm); fx.drawImage(c, [420, 120, 520][i % 3], 140 - c.height); });
    for (let i = 0; i < 4; i++) fx.drawImage(propCanvas('cloud'), r.int(0, W - 40), r.int(6, 50));
  }
  V.far = far;
  // mid: facades or venue-specific wall
  const mid = makeCanvas(W + 200, 170), mx = mid.getContext('2d'); V.midH = 170;
  if (venue.kind === 'street') {
    let x = -20, i = 0; const styles = venue.styles || ['victorian', 'pastel'];
    while (x < W + 180) { const w = r.int(52, 96); const f = facadeCanvas(styles[i % styles.length], seed * 31 + i, w); mx.drawImage(f, x, 170 - f.height); x += w + 1; i++; }
    if (venue.lanterns) { for (let lx = 10; lx < W + 180; lx += 44) mx.drawImage(propCanvas('lantern'), lx, 100 + (lx % 88 ? 0 : 8)); }
  } else if (venue.kind === 'subway') {
    mx.fillStyle = '#2a2a34'; mx.fillRect(0, 0, W + 200, 170);
    for (let x = 0; x < W + 200; x += 8) for (let y = 40; y < 150; y += 6) rect(mx, x, y, 7, 5, ((x / 8 + y / 6) % 2) ? '#c8c0a8' : '#b8b09a');
    rect(mx, 0, 0, W + 200, 40, '#1e1e26'); for (let x = 0; x < W + 200; x += 60) { rect(mx, x + 10, 8, 6, 4, '#ffe8a0'); ctx2glow(mx, x + 13, 10); }
    rect(mx, 0, 70, W + 200, 12, '#2a4a9a'); drawText(mx, '16TH ST MISSION      16TH ST MISSION      16TH ST MISSION      16TH ST MISSION', 10, 72, '#fff');
    for (let x = 40; x < W + 200; x += 160) { rect(mx, x, 0, 16, 170, '#7a7a8a'); rect(mx, x + 2, 0, 4, 170, '#9a9aaa'); rect(mx, x + 12, 0, 2, 170, '#5a5a6a'); }
    mx.drawImage(propCanvas('sign', 0), 200, 120); mx.drawImage(propCanvas('bench'), 330, 150);
    function ctx2glow(c, x, y) { c.globalAlpha = 0.15; circle(c, x, y + 14, 16, '#ffe680'); c.globalAlpha = 1; }
  } else if (venue.kind === 'park') {
    rect(mx, 0, 120, W + 200, 50, '#5aa050'); rect(mx, 0, 120, W + 200, 2, '#7ac060');
    for (let i = 0; i < 40; i++) rect(mx, r.int(0, W + 200), r.int(124, 168), 2, 1, '#7fb85a');
    for (let x = 0; x < W + 200; x += 70) mx.drawImage(treeCanvas(r.pick(['round', 'round', 'light', 'palm', 'cypress']), 0), x + r.int(-10, 10), 76 + r.int(-4, 4));
    mx.drawImage(propCanvas('bench'), 260, 152); mx.drawImage(propCanvas('bench'), 520, 152);
    if (venue.ggpark) { rect(mx, 400, 100, 60, 40, '#e0d8c0'); rect(mx, 404, 96, 52, 6, '#c8b090'); rect(mx, 420, 110, 20, 30, '#4a3a2a'); }
  } else if (venue.kind === 'pier') {
    rect(mx, 0, 0, W + 200, 120, '#3a6a9a'); for (let y = 6; y < 118; y += 5) for (let x = (y * 7) % 20; x < W + 200; x += 20) rect(mx, x, y, 8, 1, '#5a8ab8');
    mx.drawImage(propCanvas('boat'), 120, 60); mx.drawImage(propCanvas('sailboat'), 480, 40); mx.drawImage(propCanvas('sailboat'), 700, 70);
    rect(mx, 300, 40, 70, 16, '#6a6a5a'); rect(mx, 316, 30, 34, 12, '#d8d0c0'); rect(mx, 328, 24, 8, 8, '#e8e0d0'); // Alcatraz
    rect(mx, 0, 118, W + 200, 52, '#8a6a4a'); for (let x = 0; x < W + 200; x += 10) rect(mx, x, 118, 1, 52, '#6a4a2a'); rect(mx, 0, 118, W + 200, 3, '#5a3a1a');
    for (let x = 0; x < W + 200; x += 48) { rect(mx, x, 104, 4, 20, '#5a3a1a'); rect(mx, x, 104, 4, 2, '#7a5a3a'); } rect(mx, 0, 108, W + 200, 2, '#5a3a1a');
    mx.drawImage(propCanvas('seal'), 500, 150); mx.drawImage(propCanvas('seal'), 90, 154); if (venue.ferry) mx.drawImage(landmarkCanvas('ferry'), 600, 60);
  } else if (venue.kind === 'bridge') {
    rect(mx, 0, 0, W + 200, 120, '#4a4a8a'); for (let y = 6; y < 118; y += 5) for (let x = (y * 7) % 20; x < W + 200; x += 20) rect(mx, x, y, 8, 1, '#6a6aa8');
    mx.drawImage(landmarkCanvas('bridge'), -40, -30, 460, 160); mx.drawImage(landmarkCanvas('bridge'), 420, -30, 460, 160);
    rect(mx, 0, 126, W + 200, 44, '#5a5a6a'); rect(mx, 0, 126, W + 200, 4, '#c8432a'); for (let x = 0; x < W + 200; x += 60) { rect(mx, x, 100, 5, 30, '#c8432a'); }
    for (let x = 0; x < W + 200; x += 8) rect(mx, x, 112, 4, 1, '#c8432a');
  }
  V.mid = mid;
  // near props on the sidewalk (x positions, drawn behind the band row)
  V.props = [];
  const pool = venue.kind === 'street' ? ['lamp', 'hydrant', 'trash', 'newsbox', 'planter', 'mailbox', 'tree', 'bench', 'sign', 'cone'] : venue.kind === 'park' ? ['bench', 'trash', 'lamp', 'planter'] : venue.kind === 'pier' ? ['lamp', 'trash', 'bench', 'sign'] : venue.kind === 'bridge' ? ['lamp', 'lamp', 'cone'] : ['trash', 'newsbox', 'sign', 'cone'];
  let px2 = 250; while (px2 < W + 40) { V.props.push({ kind: r.pick(pool), x: px2, v: r.int(0, 2) }); px2 += r.int(70, 120); }
  V.props.push({ kind: 'lamp', x: 40, v: 0 });
  return V;
}
function drawVenue(ctx, V, L, t, wind, venue) {
  const top = L.stageTop, bottom = L.stageBottom, groundY = L.groundY;
  ctx.save(); ctx.beginPath(); ctx.rect(0, top, W, bottom - top); ctx.clip();
  // far sky+skyline, anchored to the facade line
  const midBottom = groundY - 14; // facades sit on the back of the sidewalk
  ctx.drawImage(V.far, 0, midBottom - 120 - 70 + (L.compact ? 60 : 0));
  const parallax = Math.round(Math.sin(t * 0.1) * 0); ctx.drawImage(V.mid, -20 + parallax, midBottom - V.midH);
  // sidewalk
  rect(ctx, 0, midBottom, W, groundY - midBottom + 12, venue.kind === 'park' ? '#b8a888' : venue.kind === 'pier' ? '#7a5a3a' : '#a8a49a'); rect(ctx, 0, midBottom, W, 2, venue.kind === 'pier' ? '#8a6a4a' : '#c8c4b8');
  if (venue.kind !== 'pier') for (let sx = 0; sx < W; sx += 26) rect(ctx, sx, midBottom + 2, 1, groundY - midBottom + 10, 'rgba(0,0,0,0.12)'); else for (let sx = 0; sx < W; sx += 10) rect(ctx, sx, midBottom, 1, groundY - midBottom + 12, '#5a3a1a');
  rect(ctx, 0, groundY + 10, W, 3, venue.kind === 'subway' ? '#ffe040' : '#6a6660');
  // street / tracks
  if (L.streetY) {
    if (venue.kind === 'subway') { rect(ctx, 0, L.streetY, W, L.streetH, '#1a1a20'); for (let x = 0; x < W; x += 14) rect(ctx, x, L.streetY + 12, 8, 3, '#4a3a2a'); rect(ctx, 0, L.streetY + 8, W, 2, '#8a8a90'); rect(ctx, 0, L.streetY + 18, W, 2, '#8a8a90'); }
    else if (venue.kind === 'pier' || venue.kind === 'bridge') { rect(ctx, 0, L.streetY, W, L.streetH, venue.kind === 'pier' ? '#3a6a9a' : '#4a4a8a'); for (let y = L.streetY + 3; y < L.streetY + L.streetH; y += 5) for (let x = (y * 7 + Math.floor(t * 10)) % 20; x < W; x += 20) rect(ctx, x, y, 8, 1, venue.kind === 'pier' ? '#5a8ab8' : '#6a6aa8'); }
    else if (venue.kind === 'park') { rect(ctx, 0, L.streetY, W, L.streetH, '#5aa050'); for (let i = 0; i < 30; i++) rect(ctx, (i * 53) % W, L.streetY + (i * 17) % L.streetH, 2, 1, '#7fb85a'); }
    else { rect(ctx, 0, L.streetY, W, L.streetH, '#3f3f48'); for (let sx = 0; sx < W; sx += 34) rect(ctx, sx, L.streetY + L.streetH / 2, 18, 2, '#d8c860'); for (let sx = 200; sx < 260; sx += 8) rect(ctx, sx, L.streetY, 4, L.streetH, 'rgba(255,255,255,0.5)'); }
  }
  // props behind band row
  for (const p of V.props) {
    if (p.kind === 'tree') { const c = treeCanvas('round', wind.frame(p.x)); ctx.drawImage(c, p.x - 20, midBottom - 52); continue; }
    const c = propCanvas(p.kind, p.v); ctx.drawImage(c, p.x, midBottom + 4 - c.height + (p.kind === 'lamp' ? 2 : 0));
    if (p.kind === 'lamp' && V.skyT > 0.55) { ctx.globalAlpha = 0.12; circle(ctx, p.x + 6, midBottom - 36, 34, '#ffe680'); ctx.globalAlpha = 1; }
  }
  ctx.restore();
}
function drawBand(ctx, performers, active, stageX, groundY, t, onBeat, hatX, layer) {
  performers.forEach((m, i) => {
    const x = stageX - (performers.length - 1) * 17 + i * 34, isAct = m === active;
    if (m.instrument === 'drums') { if (layer === 0) { ctx.drawImage(propInstrument('drums'), x - 20, groundY - 36); drawBugAt(ctx, m.spec, x, groundY - 12, { pose: onBeat ? 'play' : 'idle' }); } return; }
    if (m.instrument === 'piano') { if (layer === 0) { drawBugAt(ctx, m.spec, x, groundY - 4, { pose: onBeat ? 'play' : 'idle' }); ctx.drawImage(propInstrument('piano'), x - 20, groundY - 24); } return; }
    if (layer === 1) { drawShadow(ctx, x, groundY, 20, 0.25); drawBugAt(ctx, m.spec, x, groundY + (isAct && onBeat ? -2 : 0), { pose: isAct ? (onBeat ? 'play' : 'idle') : (Math.floor(t * 4 + i) % 3 ? 'play' : 'idle'), instrument: m.instrument }); if (isAct) drawText(ctx, '▼', x, groundY - 52 + Math.round(Math.sin(t * 8)), '#ffe14d', { align: 'center', outline: '#1a1410' }); }
  });
  if (layer === 0) { ctx.drawImage(propCanvas('amp'), stageX - performers.length * 17 - 34, groundY - 14); }
  if (layer === 1) ctx.drawImage(propCanvas('hat'), hatX - 7, groundY - 6);
}

class PerformScene {
  constructor(node) {
    const r = Game.run; this.node = node; this.venue = VENUES[node.venue] || VENUES.corner; this.mode = node.type; this.t = 0; this.phase = 'prep'; this.paused = false;
    this.bossMod = node.bossMod || null;
    this.difficulty = clamp(Math.round(1 + r.day * 0.9 + (this.mode === 'elite' ? 1 : 0) + (this.mode === 'boss' ? 1.5 : 0) - (this.mode === 'openmic' ? 0.5 : 0)), 1, 7);
    this.bars = this.mode === 'boss' ? 20 : this.mode === 'elite' ? 16 : this.mode === 'openmic' ? 8 : 12; if (this.bossMod === 'cops') this.bars = Math.round(this.bars * 0.7);
    const genre = r.buffs.genre || r.rng.pick(GENRE_KEYS); this.song = makeSong(r.rng, { genre, bars: this.bars }); this.song.bpm += r.day * 2; this.song.beat = 60 / this.song.bpm; this.song.leadIn = 4 * this.song.beat; this.song.length = 4 * this.song.beat + this.bars * 4 * this.song.beat + 1.5;
    this.V = buildVenue(this.venue, hashStr(node.venue + node.r + node.c + r.seed), r.day / 5);
    this.active = r.members.map(m => m.stamina >= 15 || m.leader); this.useItems = {};
    this.layout(); this.buildPrepMenu(); this.pads = []; this.padPointers = new Map(); this.fx = new Particles();
    this.train = { x: -700, t: r.rng.range(4, 9) };
  }
  layout() {
    const touch = Game.touch;
    this.L = touch ? { top: true, stageTop: 18, stageBottom: 98, groundY: 78, rows: [0, -5, -10], streetY: null, rhythmY: 100, rhythmH: 192, padY: 296, padH: 60, compact: true }
      : { top: false, stageTop: 214, stageBottom: 360, groundY: 300, rows: [0, -6, -12], streetY: 316, streetH: 44, rhythmY: 18, rhythmH: 194, padY: 0, padH: 0 };
    this.stageX = 170; this.hatX = this.stageX + 70;
  }
  isPlaying() { return this.phase === 'play'; }
  buildPrepMenu() {
    const r = Game.run; const items = [];
    r.members.forEach((m, i) => items.push({ label: (this.active[i] ? '[x] ' : '[ ] ') + m.name + ' - ' + INSTRUMENTS[m.instrument].name + (m.leader ? ' (you)' : ' (backup taps)'), right: 'STA ' + Math.round(m.stamina), rightColor: m.stamina < 30 ? '#c8433a' : '#4f8032', disabled: m.leader, onSelect: () => { if (m.stamina < 15) { Audio.ui('error'); return; } this.active[i] = !this.active[i]; const k = this.menu.idx; this.buildPrepMenu(); this.menu.idx = k; } }));
    const seen = new Set();
    r.consumables.forEach((k) => { const c = CONSUMABLES[k]; if (seen.has(k) || c.target !== 'run') return; seen.add(k); items.push({ label: (this.useItems[k] ? '[x] ' : '[ ] ') + 'Use ' + c.name + ': ' + c.desc, icon: c.icon, onSelect: () => { this.useItems[k] = !this.useItems[k]; const kk = this.menu.idx; this.buildPrepMenu(); this.menu.idx = kk; } }); });
    items.push({ label: 'START THE SET', onSelect: () => this.startPlay() });
    const keep = this.menu ? this.menu.idx : items.length - 1; this.menu = new Menu(items); this.menu.idx = Math.min(keep, items.length - 1);
  }
  startPlay() {
    const r = Game.run; Audio.init(); Audio.setStageReverb(false);
    for (const k in this.useItems) if (this.useItems[k]) { const i = r.consumables.indexOf(k); if (i >= 0) { r.consumables.splice(i, 1); CONSUMABLES[k].use(r); } }
    this.performers = r.members.filter((m, i) => this.active[i]); if (!this.performers.length) this.performers = [r.members[0]];
    const leader = r.members[0]; const mates = this.performers.filter(m => !m.leader);
    // sections: your instrument, with bandmate spotlights (QTE) woven in
    const sections = []; let mateI = 0;
    for (let b = 0; b < this.bars; b += 4) { const slot = (b / 4) % 2 === 1 && mates.length; if (slot) { const m = mates[mateI % mates.length]; mateI++; sections.push({ instrument: m.instrument, startBar: b, endBar: Math.min(this.bars, b + 4), qte: true, member: m }); } else sections.push({ instrument: leader.instrument, startBar: b, endBar: Math.min(this.bars, b + 4), member: leader }); }
    this.sections = sections;
    const mods = r.gigMods(this.performers, this.difficulty, this.bossMod); mods.fx = { shake: Game.shake };
    const notes = generateChart(this.song, sections, this.difficulty, r.rng, { bombMult: this.bossMod === 'heckler' ? 3 : 1 });
    this.mods = mods;
    this.S = new ScoreState(r, { instrument: leader.instrument, genre: this.song.genre, performers: this.performers.length, band: this.performers, venue: this.venue, mode: this.mode, bossMod: this.bossMod, mods, battle: !!(r.pendingGig && r.pendingGig.battle) });
    this.rhythm = new RhythmGame(this.song, sections, notes, mods, {
      onJudge: (n, j, info) => { const a = this.S.onHit(n, j, info); if (a && this.L) this.fx.text(this.hatX + 20, this.L.groundY - 60, '+' + a, n.star ? '#ffd24a' : '#fff', { life: 0.6, font: 'small' }); },
      onCheer: () => { this.S.onCheer(); }, onQte: (j) => this.S.onQte(j), onRoll: () => this.S.onRoll(), onBombDodged: () => this.S.onBombDodged(),
      onSection: (sec, isLast) => this.S.setSection(isLast),
    });
    this.crowd = new Crowd(this.venue, Object.assign({}, mods, { bossMod: this.bossMod, range: 1 }), r.rng, { groundY: this.L.groundY, rows: this.L.rows, streetY: this.L.streetY, streetH: this.L.streetH, stageX: this.stageX, hatX: this.hatX, hatY: this.L.groundY - 4 });
    const start = Audio.now() + 0.6 + this.song.leadIn; this.rhythm.begin(start);
    this.backing = new Backing(this.song, start - this.song.leadIn, (t) => { const sec = sections.find(s => t - start >= s.start - this.song.leadIn - 0.001 && t - start < s.end - this.song.leadIn); const ins = sec ? sec.instrument : null; return { drums: ins === 'drums', bass: ins === 'bass' }; });
    this.phase = 'play'; this.padKey = null; this.quakeT = 3;
    this.pauseBtn = new Btn(4, this.L.rhythmY + 2, 24, 14, 'II', () => this.togglePause(), { color: '#3a3560', hi: '#5a5490', lo: '#2a2540', ol: '#1a1430' });
    this.pauseButtons = [new Btn(W / 2 - 100, 150, 92, 26, 'RESUME', () => this.togglePause()), new Btn(W / 2 + 8, 150, 92, 26, 'BAIL OUT', () => this.quit(), { color: UI.red, hi: UI.redHi, lo: UI.redLo, ol: '#4a1a14' })];
  }
  update(dt) {
    this.t += dt; this.fx.update(dt, Game.wind.px);
    if (this.phase === 'play') {
      if (this.paused) return;
      this.backing.update(); this.rhythm.update(dt);
      if (Game.touch) { const key = this.rhythm.section.qte ? 'qte' : this.rhythm.section.instrument; if (this.padKey !== key) { this.padKey = key; this.pads = buildPads(this.rhythm.instrument, { x: 4, y: this.L.padY, w: W - 8, h: this.L.padH }, this.rhythm.section.qte); } }
      this.crowd.update(dt, this.rhythm.hype, this.rhythm.events, Game.wind.v);
      this.S.watcherTick(dt, this.crowd.watchers.length);
      if (this.bossMod === 'quake') { this.quakeT -= dt; if (this.quakeT <= 0) { this.quakeT = 4 + Math.random() * 5; Game.shake.hit(6, 0.6); Audio.drum('stomp', 0, 0.6); } }
      this.train.t -= dt; if (this.train.t < 0 && this.venue.kind === 'subway') { this.train.x += dt * 300; if (this.train.x > W + 400) { this.train.x = -700; this.train.t = 7 + Math.random() * 8; } }
      if (this.rhythm.finished) this.finish();
    } else if (this.phase === 'tally') { this.tallyT += dt; this.advanceTally(); }
  }
  finish() {
    const r = Game.run; const res = this.rhythm.results(); this.res = res;
    const total = this.S.finish({ combo: this.rhythm.combo, maxCombo: res.maxCombo, misses: res.miss, watchers: this.crowd.watchers.length, hype: this.rhythm.hype, acc: res.acc });
    this.earned = total; r.money += total; r.stats.earned += total; r.stats.gigs++; r.stats.bestCombo = Math.max(r.stats.bestCombo, res.maxCombo); r.stats.perfects += res.perfect; r.stats.bestPayout = Math.max(r.stats.bestPayout, total);
    r.pendingGig = null; r.buffs = {};
    const stCost = 22 * (r.perks.stamina || 1) + (this.mods.staminaExtra || 0); this.xpLines = [];
    for (const m of this.performers) { m.stamina = Math.max(0, m.stamina - stCost * (m.hunger ? 1.4 : 1)); m.gigs++; let xp = (0.5 + res.acc * 1.5); m.xp += xp; let ups = 0; while (m.xp >= 3 && m.skill < 10) { m.xp -= 3; m.skill++; ups++; } this.xpLines.push(m.name + ' +' + xp.toFixed(1) + ' xp' + (ups ? '  SKILL UP! (' + m.skill + ')' : '')); }
    this.grade = res.acc >= 0.95 ? 'S' : res.acc >= 0.85 ? 'A' : res.acc >= 0.7 ? 'B' : res.acc >= 0.5 ? 'C' : 'D';
    this.recruit = (this.mode === 'openmic' && res.acc >= 0.6 && r.members.length < 6) ? r.makeMember() : null;
    this.phase = 'tally'; this.tallyT = 0; this.tallyStep = 0; this.shownApplause = 0; this.shownMult = 1; this.tallyDone = false;
    const items = []; if (this.recruit) { items.push({ label: 'Welcome ' + this.recruit.name + ' (' + INSTRUMENTS[this.recruit.instrument].name + ', skill ' + this.recruit.skill + ') to the band!', icon: 'openmic', onSelect: () => { r.members.push(this.recruit); Audio.ui('fanfare'); Game.afterNode(); } }); items.push({ label: 'Politely decline. One more mouth to feed.', onSelect: () => Game.afterNode() }); }
    else items.push({ label: 'CONTINUE', onSelect: () => Game.afterNode() });
    this.menu = new Menu(items);
    if (res.acc >= 0.7) Audio.applause(clamp(res.acc, 0.3, 1), 1.5); r.save();
  }
  advanceTally() {
    const S = this.S, steps = S.steps; const per = 0.42;
    const target = Math.min(steps.length + 1, Math.floor(this.tallyT / per));
    while (this.tallyStep < target) {
      const st = steps[this.tallyStep];
      if (st) { if (st.kind === 'applause') Audio.ui('tally'); else if (st.kind === 'mult') Audio.ui('stamp'); else if (st.kind === 'times') Audio.ui('mult'); else if (st.kind === 'cash') Audio.ui('coin'); this.fx.burst(W / 2, 120, 8, { color: st.kind === 'mult' || st.kind === 'times' ? '#ff5a5a' : '#5bc0ff', speed: 60, life: 0.4, kind: 'spark' }); }
      else if (!this.tallyDone) { this.tallyDone = true; Audio.ui('cash'); this.fx.burst(W / 2, 150, 30, { color: ['#ffd24a', '#fff', '#6be585'], speed: 120, life: 0.8, kind: 'star', size: 2, gravity: 60 }); }
      this.tallyStep++;
    }
  }
  key(code) {
    if (this.phase === 'prep') { this.menu.key(code); return; }
    if (this.phase === 'tally') { if (!this.tallyDone) { if (['Enter', 'Space'].includes(code)) { this.tallyT = 999; } return; } this.menu.key(code); return; }
    if (code === 'Escape') { this.togglePause(); return; }
    if (this.paused) { if (code === 'KeyQ') this.quit(); return; }
    this.rhythm.keyDown(code);
  }
  keyUp(code) { if (this.phase === 'play' && !this.paused) this.rhythm.keyUp(code); }
  togglePause() { this.paused = !this.paused; if (Audio.ctx) { if (this.paused) Audio.ctx.suspend(); else Audio.ctx.resume(); } this.rhythm.keysDown.clear(); }
  quit() { if (Audio.ctx) Audio.ctx.resume(); this.backing.stop(); this.rhythm.finished = true; this.paused = false; this.S.applause *= 0.5; this.finish(); this.S.steps.push({ kind: 'note', label: 'Bailed early: half the applause walked off.' }); }
  padAt(x, y) { return this.pads.find(p => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h); }
  pointerDown(x, y, id) {
    if (this.phase !== 'play') { if (this.phase === 'tally' && !this.tallyDone) { this.tallyT = 999; return; } this.menu.click(x, y); return; }
    if (this.paused) { for (const b of this.pauseButtons) if (b.hit(x, y)) { b.onTap(); return; } return; }
    if (this.pauseBtn.hit(x, y)) { this.pauseBtn.onTap(); return; }
    const pad = this.padAt(x, y); if (pad) { this.padPointers.set(id, pad.code); this.rhythm.keyDown(pad.code); } else if (Game.touch && this.rhythm.section.qte) { this.padPointers.set(id, 'Space'); this.rhythm.keyDown('Space'); }
  }
  pointerMove(x, y, id) { if (this.phase !== 'play' || this.paused) return; const prev = this.padPointers.get(id); if (prev === undefined) return; const pad = this.padAt(x, y); const next = pad ? pad.code : null; if (next === prev) return; this.rhythm.keyUp(prev); if (next) { this.padPointers.set(id, next); this.rhythm.keyDown(next); } else this.padPointers.delete(id); }
  pointerUp(x, y, id) { const code = this.padPointers.get(id); if (code !== undefined) { this.padPointers.delete(id); this.rhythm.keyUp(code); } }
  hover(x, y) { if (this.phase !== 'play') this.menu.hover(x, y); }
  drawStage(ctx) {
    const L = this.L; drawVenue(ctx, this.V, L, this.t, Game.wind, this.venue);
    ctx.save(); ctx.beginPath(); ctx.rect(0, L.stageTop, W, L.stageBottom - L.stageTop); ctx.clip();
    if (this.venue.kind === 'subway' && this.train.t < 0 && L.streetY) { const tx = Math.round(this.train.x); const ty = L.streetY + 4; rect(ctx, tx, ty, 700, 34, '#c8c8d0'); rect(ctx, tx, ty, 700, 3, '#e8e8f0'); rect(ctx, tx, ty + 26, 700, 5, '#2a4a9a'); for (let x = tx + 10; x < tx + 700; x += 34) { rect(ctx, x, ty + 7, 22, 14, '#ffe8a0'); rect(ctx, x + 1, ty + 8, 20, 3, '#fff8e0'); } for (let x = tx + 4; x < tx + 700; x += 140) rect(ctx, x, ty + 4, 2, 28, '#8a8a98'); }
    const perf = this.performers || Game.run.members; const cur = this.rhythm ? this.rhythm.section.member : null; const onBeat = this.rhythm ? this.rhythm.onBeat || this.rhythm.beatPulse > 0.75 : false;
    if (this.crowd) { this.crowd.drawCars(ctx, 0); this.crowd.drawPeds(ctx, [2]); }
    drawBand(ctx, perf, cur, this.stageX, L.groundY + L.rows[1], this.t, onBeat, this.hatX, 0);
    if (this.crowd) this.crowd.drawPigeons(ctx);
    drawBand(ctx, perf, cur, this.stageX, L.groundY + L.rows[1], this.t, onBeat, this.hatX, 1);
    if (this.crowd) { this.crowd.drawPeds(ctx, [1, 0]); this.crowd.drawCars(ctx, 1); this.crowd.drawCoins(ctx); }
    this.fx.draw(ctx);
    ctx.restore();
    if (this.rhythm) {
      // hype + live applause
      const hx = W - 16, hy = L.stageTop + 6, hh = Math.min(80, L.stageBottom - L.stageTop - 24);
      rect(ctx, hx - 1, hy - 1, 10, hh + 2, '#1a1410'); const fill = hh * this.rhythm.hype / 100; rect(ctx, hx, hy + hh - fill, 8, fill, this.rhythm.hype > 70 ? '#ff5a9a' : this.rhythm.hype > 40 ? '#ffd166' : '#6fb8ff'); frame(ctx, hx - 1, hy - 1, 10, hh + 2, '#888');
      if (this.rhythm.hype > 80 && Math.random() < 0.5) this.fx.add({ x: hx + 4 + (Math.random() - 0.5) * 6, y: hy + hh - fill, vx: 0, vy: -30, life: 0.4, color: '#ff9030', kind: 'fire', size: 2, gravity: 0 });
      drawText(ctx, 'HYPE', hx + 4, hy + hh + 4, '#fff', { align: 'center', font: 'small', outline: '#1a1410' });
      rect(ctx, W - 126, L.stageTop + 4, 100, 30, 'rgba(10,8,20,0.72)'); frame(ctx, W - 126, L.stageTop + 4, 100, 30, '#3a3560');
      drawText(ctx, 'APPLAUSE', W - 122, L.stageTop + 7, '#8ad8ff', { font: 'small' }); drawText(ctx, fmtNum(this.S.applause), W - 30, L.stageTop + 6, '#fff', { align: 'right', scale: 2 });
      drawText(ctx, this.crowd.watchers.length + ' WATCHING  -  ' + fmtMoney(this.crowd.earned) + ' TIPS', W - 122, L.stageTop + 24, '#cfc9e6', { font: 'small' });
    }
  }
  draw(ctx) {
    rect(ctx, 0, 0, W, H, '#0d0b18'); const L = this.L;
    if (this.phase === 'prep') {
      this.drawStage(ctx);
      const PY = L.top ? 100 : 22, PH = L.top ? H - 104 : L.stageTop - 26; const inner = uiPanel(ctx, 16, PY, W - 32, PH, { title: ({ gig: 'GIG', elite: 'BIG GIG', boss: 'THE FINALE', openmic: 'OPEN MIC' })[this.mode] + ': ' + this.venue.name.toUpperCase() });
      const G = GENRES[this.song.genre]; let y = inner.y + 4;
      drawText(ctx, '"' + this.song.name + '"', inner.x + 8, y, UI.ink); rect(ctx, inner.x + 8 + textWidth('"' + this.song.name + '"') + 8, y - 1, textWidth(G.name.toUpperCase()) + 8, 9, G.color); drawText(ctx, G.name.toUpperCase(), inner.x + 8 + textWidth('"' + this.song.name + '"') + 12, y, '#1a1410');
      drawText(ctx, this.song.bpm + ' BPM  -  ' + this.bars + ' BARS  -  ' + '★'.repeat(this.difficulty) + '.'.repeat(Math.max(0, 7 - this.difficulty)), inner.x + inner.w - 8, y, '#7a4a10', { align: 'right' }); y += 11;
      drawText(ctx, 'Crowd: ' + (this.venue.traffic >= 1.3 ? 'BUSY' : this.venue.traffic >= 1 ? 'STEADY' : 'QUIET') + '   Wallets: ' + (this.venue.wealth >= 1.5 ? 'FAT' : this.venue.wealth >= 1 ? 'AVERAGE' : 'THIN') + (Game.run.pendingGig && Game.run.pendingGig.note ? '   ' + Game.run.pendingGig.note : ''), inner.x + 8, y, UI.inkSoft, { font: 'small' }); y += 8;
      if (this.bossMod) { const bm = BOSS_MODS[this.bossMod]; rect(ctx, inner.x + 8, y, inner.w - 16, 11, bm.color); ctx.drawImage(icon('skull'), inner.x + 11, y + 2); drawText(ctx, bm.name.toUpperCase() + ': ' + bm.desc, inner.x + 22, y + 2, '#1a1410'); y += 13; }
      drawText(ctx, 'LINEUP - your instrument leads; bandmates take spotlights you back with taps', inner.x + 8, y, UI.inkSoft, { font: 'small' }); y += 8;
      this.menu.draw(ctx, inner.x + 8, y, inner.w - 16, Game.touch ? 14 : 12, 'list');
      const it = this.menu.current; if (it && it.label.includes(' - ')) { const m = Game.run.members[this.menu.idx]; if (m) drawWrapped(ctx, INSTRUMENTS[m.instrument].desc, inner.x + 8, inner.y + inner.h - 18, 90, '#7a4a10', 8, { font: 'small' }); }
      Game.drawHud(ctx); return;
    }
    if (this.phase === 'play') {
      this.rhythm.draw(ctx, { x: 0, y: L.rhythmY, w: W, h: L.rhythmH, touch: L.top, pads: this.pads, backdrop: this.V.far });
      this.drawStage(ctx);
      const p = clamp(this.rhythm.now / this.song.length, 0, 1); const barY = L.top ? L.stageBottom : L.stageTop - 3; rect(ctx, 0, barY, W, 3, '#222'); rect(ctx, 0, barY, W * p, 3, '#ffd24a');
      const sec = this.rhythm.section; const lbl = sec.qte ? 'BACKING ' + sec.member.name.toUpperCase() : this.rhythm.section.member.name.toUpperCase() + ' ON ' + this.rhythm.instrument.name.toUpperCase();
      const lblY = L.top ? L.stageBottom - 12 : L.stageTop + 6; rect(ctx, 2, lblY - 2, textWidth(lbl) + 8, 11, 'rgba(0,0,0,0.65)'); drawText(ctx, lbl, 6, lblY, '#fff');
      if (Game.touch) { rect(ctx, 0, L.padY - 3, W, H - L.padY + 3, '#0a0814'); drawPads(ctx, this.pads, this.rhythm.keysDown); }
      this.pauseBtn.draw(ctx);
      if (this.paused) { rect(ctx, 0, 0, W, H, 'rgba(0,0,0,0.75)'); uiRibbon(ctx, W / 2, 100, 'PAUSED', { scale: 2 }); for (const b of this.pauseButtons) b.draw(ctx); if (!Game.touch) drawText(ctx, 'ESC: RESUME    Q: BAIL OUT (HALF APPLAUSE)', W / 2, 190, '#cfc9e6', { align: 'center', font: 'small' }); }
      return;
    }
    // ---- tally
    this.drawStage(ctx);
    const PY = L.top ? 100 : 20, PH = L.top ? H - 104 : L.stageTop - 24; const inner = uiPanel(ctx, 40, PY, W - 80, PH, { title: 'SET COMPLETE  -  ' + this.venue.name.toUpperCase() });
    const S = this.S; const steps = S.steps; const shown = Math.min(this.tallyStep, steps.length);
    // left column: steps
    let y = inner.y + 4; const colX = inner.x + 8;
    let applause = 0, multAdd = 0, times = 1, cash = 0;
    for (let i = 0; i < shown; i++) { const st = steps[i]; if (st.kind === 'applause') applause += st.value; if (st.kind === 'mult') multAdd += st.value; if (st.kind === 'times') times *= st.value; if (st.kind === 'cash') cash += st.value; }
    const baseMult = shown > 0 ? S.baseMult : 1;
    const visSteps = steps.slice(Math.max(0, shown - 9), shown);
    for (const st of visSteps) {
      const col = st.kind === 'applause' ? '#2a5ab0' : st.kind === 'mult' || st.kind === 'times' ? '#b02a2a' : st.kind === 'cash' ? '#2a7a3a' : UI.inkSoft;
      const val = st.kind === 'applause' ? '+' + fmtNum(st.value) : st.kind === 'mult' ? '+' + st.value + ' MULT' : st.kind === 'times' ? 'x' + st.value + ' MULT' : st.kind === 'cash' ? '+' + fmtMoney(st.value) : '';
      drawText(ctx, st.label, colX, y, UI.ink, { font: 'small' }); drawText(ctx, val, colX + 190, y, col, { font: 'small', align: 'right' }); y += 8;
    }
    // right: big applause x mult
    const bx = inner.x + inner.w - 150, by = inner.y + 6;
    rect(ctx, bx, by, 140, 30, '#2a5ab0'); frame(ctx, bx, by, 140, 30, '#1a1410'); drawText(ctx, 'APPLAUSE', bx + 6, by + 3, '#c8e0ff', { font: 'small' }); drawText(ctx, fmtNum(shown ? S.applause : 0), bx + 134, by + 12, '#fff', { align: 'right', scale: 2 });
    const mult = Math.round((baseMult + multAdd) * times * 100) / 100;
    rect(ctx, bx, by + 34, 140, 30, '#b02a2a'); frame(ctx, bx, by + 34, 140, 30, '#1a1410'); drawText(ctx, 'MULT', bx + 6, by + 37, '#ffd0d0', { font: 'small' }); drawText(ctx, 'x' + mult.toFixed(2), bx + 134, by + 46, '#fff', { align: 'right', scale: 2 });
    if (this.tallyDone) {
      rect(ctx, bx, by + 68, 140, 34, '#2a7a3a'); frame(ctx, bx, by + 68, 140, 34, '#1a1410'); drawText(ctx, 'PAYOUT', bx + 6, by + 71, '#c8f0c0', { font: 'small' }); drawText(ctx, fmtMoney(this.earned), bx + 134, by + 82, '#fff', { align: 'right', scale: 2 });
      drawText(ctx, 'GRADE', bx - 40, by + 74, UI.inkSoft, { font: 'small' }); drawText(ctx, this.grade, bx - 30, by + 82, { S: '#d9a520', A: '#4f8032', B: '#2a5ab0', C: '#b07030', D: '#b02a2a' }[this.grade], { scale: 3, outline: '#1a1410' });
      let yy = inner.y + inner.h - 26 - this.xpLines.length * 7 - (this.recruit ? 8 : 0);
      drawText(ctx, 'ACC ' + Math.round(this.res.acc * 100) + '%  COMBO ' + this.res.maxCombo + '  PERFECT ' + this.res.perfect + '  MISS ' + this.res.miss, colX, yy, UI.inkSoft, { font: 'small' }); yy += 8;
      for (const l of this.xpLines) { drawText(ctx, l, colX, yy, '#5a3a8a', { font: 'small' }); yy += 7; }
      if (this.recruit) { drawText(ctx, 'Someone in the crowd wants to join!', colX, yy, '#8a3a8a', { font: 'small' }); drawBugAt(ctx, this.recruit.spec, inner.x + inner.w - 30, inner.y + inner.h - 10, { pose: 'cheer', instrument: this.recruit.instrument }); }
      this.menu.draw(ctx, inner.x + 8, inner.y + inner.h - (this.recruit ? 30 : 18), inner.w - 190, 13, 'list');
    } else drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', inner.x + inner.w / 2, inner.y + inner.h - 12, UI.inkFaint, { align: 'center', font: 'small' });
    this.fx.draw(ctx);
    Game.drawHud(ctx);
  }
}
