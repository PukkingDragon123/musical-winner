// ---------- Rhythm engine + instrument minigames ----------
'use strict';
const JUDGE = { perfect: 0.045, great: 0.09, good: 0.14, window: 0.19 };
const JUDGE_COLOR = { perfect: '#ffe14d', great: '#6ff08a', good: '#6fb8ff', miss: '#ff5a5a' };
const HYPE_GAIN = { perfect: 2.4, great: 1.3, good: 0.4, miss: -7 };
const COMBO_MILESTONES = [20, 40, 70, 100, 150, 200, 300];
const LANE_COLORS = ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff', '#ff9f68'];

class RhythmGame {
  // sections: [{instrument, startBar, endBar, member}]
  constructor(song, sections, notes, mods) {
    this.song = song; this.sections = sections; this.notes = notes; this.mods = mods;
    this.startTime = null; this.now = -song.leadIn;
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.combo = 0; this.maxCombo = 0; this.hype = 25; this.rollHits = 0;
    this.events = { perfects: 0, misses: 0, cheer: 0 };
    this.popups = []; this.flashes = {}; this.milestoneIdx = 0;
    this.holds = {}; // lane -> note being held
    this.keysDown = new Set();
    this.breath = 1; this.breathNote = null;
    this.valveMask = 0; this.valveEvalAt = null; this.valveGroupT = null;
    this.lastDon = { t: -1, code: null };
    this.secIdx = 0; this.finished = false; this.bannerT = 0;
    this.difficulty = mods.difficulty || 1;
    this.approach = clamp(1.75 - this.difficulty * 0.12, 0.95, 1.75);
    this.notesTotal = notes.length + notes.filter(n => n.type === 'hold').length;
    // hype gain scales with note density so sparse beginner charts can still build a crowd
    this.hypeScale = clamp(230 / Math.max(1, this.notesTotal), 1, 2.8);
    this.beatPulse = 0;
    this.voices = {};
    sections.forEach((s, i) => { s.start = song.leadIn + s.startBar * 4 * song.beat; s.end = song.leadIn + s.endBar * 4 * song.beat; s.idx = i; });
    notes.forEach(n => { n.sec = sections.findIndex(s => n.t >= s.start - 0.001 && n.t < s.end + 0.001); if (n.sec < 0) n.sec = sections.length - 1; });
  }
  get section() { return this.sections[this.secIdx]; }
  get instrument() { return INSTRUMENTS[this.section.instrument]; }
  get nextSection() { return this.sections[this.secIdx + 1]; }
  begin(audioTime) { this.startTime = audioTime; }
  win(kind) {
    let m = this.mods.windowMult || 1;
    if (kind === 'perfect' && this.mods.luckyPick && ['guitar', 'bass', 'violin'].includes(this.section.instrument)) m *= 1.25;
    return JUDGE[kind] * m;
  }
  judgeDt(dt) {
    const a = Math.abs(dt);
    if (a <= this.win('perfect')) return 'perfect';
    if (a <= this.win('great')) return 'great';
    if (a <= this.win('good')) return 'good';
    return 'miss';
  }
  applyJudge(j, note, opts = {}) {
    this.counts[j]++;
    let gain = HYPE_GAIN[j];
    if (j === 'great' && this.mods.earplugs) gain = HYPE_GAIN.perfect;
    if (j !== 'miss') gain *= this.hypeScale;
    if (j === 'miss') {
      gain *= this.mods.missMult || 1;
      if (this.combo >= 10 && this.mods.metronome) gain *= 0.5;
      this.combo = 0; this.events.misses++;
    } else {
      this.combo++; this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (j === 'perfect') this.events.perfects++;
      if (this.milestoneIdx < COMBO_MILESTONES.length && this.combo >= COMBO_MILESTONES[this.milestoneIdx]) {
        this.milestoneIdx++; this.events.cheer += (this.mods.kazoo ? 2 : 1);
        this.popups.push({ text: this.combo + ' COMBO!', color: '#ff9fef', t: 0, big: true });
      }
    }
    this.hype = clamp(this.hype + gain, 0, 100);
    this.popups.push({ text: j.toUpperCase() + (opts.suffix || ''), color: JUDGE_COLOR[j], t: 0, lane: note ? note.lane : 0 });
  }
  // find best unjudged note for lanes within window
  findNote(pred) {
    let best = null, bestD = Infinity;
    const w = this.win('good') + 0.05;
    for (const n of this.notes) {
      if (n.judged || n.sec !== this.secIdx) continue;
      if (n.t - this.now > w + 0.4) break;
      if (!pred(n)) continue;
      const d = Math.abs(n.t - this.now);
      if (d <= w && d < bestD) { best = n; bestD = d; }
    }
    return best;
  }
  playHit(note, j, hold) {
    const k = this.section.instrument;
    if (k === 'drums') { Audio.drum(note.type === 'ka' ? 'ka' : 'don', 0, j === 'perfect' ? 0.9 : 0.7); return null; }
    const vel = j === 'perfect' ? 0.55 : j === 'great' ? 0.45 : 0.35;
    const dur = hold ? Math.max(0.3, note.dur) + 0.3 : (k === 'tambourine' ? 0.1 : 0.35);
    return Audio.note(k, note.midi, 0, dur, vel);
  }
  keyDown(code) {
    if (this.finished || this.startTime == null || this.keysDown.has(code)) return;
    this.keysDown.add(code);
    const instr = this.instrument; const g = instr.game;
    if (g === 'lanes' || g === 'bow') {
      let lane = instr.keys.indexOf(code);
      if (g === 'bow') { lane = (code === 'ArrowUp' || code === 'KeyW') ? 1 : (code === 'ArrowDown' || code === 'KeyS') ? 0 : -1; }
      if (lane < 0) return;
      const n = this.findNote(x => x.lane === lane);
      if (!n) { if (this.now > 0) { Audio.drum('clunk', 0, 0.4); this.flashes[lane] = 0.15; } return; }
      const j = this.judgeDt(this.now - n.t);
      n.judged = true; n.hit = j !== 'miss'; n.judge = j;
      this.flashes[lane] = 0.2;
      this.applyJudge(j, n);
      if (n.hit) {
        const v = this.playHit(n, j, n.type === 'hold');
        if (n.type === 'hold') { n.holding = true; this.holds[lane] = n; n.voice = v; }
        else if (v) v.off && setTimeout(() => { }, 0);
      } else if (n.type === 'hold') { n.tailJudged = true; this.counts.miss++; this.events.misses++; }
    } else if (g === 'taiko') {
      const isDon = code === 'KeyF' || code === 'KeyJ';
      const isKa = code === 'KeyD' || code === 'KeyK';
      if (!isDon && !isKa) return;
      this.flashes[isDon ? 'don' : 'ka'] = 0.15;
      // rolls
      const roll = this.notes.find(n => n.type === 'roll' && n.sec === this.secIdx && this.now >= n.t - 0.05 && this.now <= n.t + n.dur + 0.05);
      if (roll) { roll.judged = true; roll.hits = (roll.hits || 0) + 1; this.rollHits++; this.hype = clamp(this.hype + 0.6, 0, 100); Audio.drum(isDon ? 'don' : 'ka', 0, 0.6); this.popups.push({ text: 'ROLL x' + roll.hits, color: '#ffd166', t: 0 }); return; }
      // big note second hit
      if (isDon && this.lastDon.note && this.now - this.lastDon.t < 0.07 && this.lastDon.code !== code) {
        const n = this.lastDon.note; this.lastDon.note = null;
        if (n.type === 'big' && n.hit) { this.hype = clamp(this.hype + 2.5, 0, 100); this.popups.push({ text: 'BIG DON!', color: '#ff9f68', t: 0, big: true }); Audio.drum('don', 0, 1); Audio.drum('tom', 0, 0.6); }
        return;
      }
      const n = this.findNote(x => x.type !== 'roll');
      if (!n) { if (this.now > 0) Audio.drum(isDon ? 'don' : 'ka', 0, 0.25); return; }
      const wantDon = n.type === 'don' || n.type === 'big';
      let j = this.judgeDt(this.now - n.t);
      if (wantDon !== isDon) j = 'miss';
      n.judged = true; n.hit = j !== 'miss'; n.judge = j;
      this.applyJudge(j, n, { suffix: j === 'miss' && wantDon !== isDon && Math.abs(this.now - n.t) < this.win('good') ? ' (WRONG)' : '' });
      if (n.hit) { this.playHit(n, j); if (n.type === 'big') this.lastDon = { t: this.now, code, note: n }; }
      else Audio.drum('clunk', 0, 0.4);
    } else if (g === 'wind') {
      if (code !== 'Space') return;
      if (this.breath <= 0.02) { Audio.drum('clunk', 0, 0.3); return; }
      const n = this.findNote(() => true);
      this.flashes.wind = 0.2;
      if (!n) { if (this.now > 0) Audio.drum('clunk', 0, 0.3); return; }
      const j = this.judgeDt(this.now - n.t);
      n.judged = true; n.hit = j !== 'miss'; n.judge = j;
      this.applyJudge(j, n);
      if (n.hit) { n.holding = true; this.breathNote = n; n.voice = this.playHit(n, j, true); }
      else { n.tailJudged = true; this.counts.miss++; this.events.misses++; }
    } else if (g === 'valves') {
      const vi = instr.keys.indexOf(code);
      if (vi < 0) return;
      this.valveMask |= (1 << vi);
      if (this.valveGroupT == null) this.valveGroupT = this.now;
      this.valveEvalAt = this.now + 0.045;
      this.flashes['v' + vi] = 0.15;
    }
  }
  keyUp(code) {
    this.keysDown.delete(code);
    if (this.finished || this.startTime == null) return;
    const instr = this.instrument; const g = instr.game;
    if (g === 'lanes' || g === 'bow') {
      let lane = instr.keys.indexOf(code);
      if (g === 'bow') { lane = (code === 'ArrowUp' || code === 'KeyW') ? 1 : (code === 'ArrowDown' || code === 'KeyS') ? 0 : -1; }
      const n = this.holds[lane];
      if (n && n.holding) this.releaseHold(n, lane);
    } else if (g === 'wind') {
      if (code === 'Space' && this.breathNote) this.releaseWind(this.breathNote);
    } else if (g === 'valves') {
      const vi = instr.keys.indexOf(code);
      if (vi >= 0) this.valveMask &= ~(1 << vi);
    }
  }
  releaseHold(n, lane) {
    n.holding = false; delete this.holds[lane];
    if (n.voice) n.voice.off();
    if (n.tailJudged) return;
    n.tailJudged = true;
    const early = (n.t + n.dur) - this.now;
    if (early > this.win('good')) { this.applyJudge('miss', n, { suffix: ' (EARLY)' }); }
    else this.applyJudge(early > this.win('great') ? 'good' : 'perfect', n, { suffix: ' HOLD' });
  }
  releaseWind(n) {
    n.holding = false; this.breathNote = null;
    if (n.voice) n.voice.off();
    if (n.tailJudged) return;
    n.tailJudged = true;
    const dt = this.now - (n.t + n.dur);
    let j = this.judgeDt(dt);
    if (dt < -this.win('good')) j = 'miss';
    this.applyJudge(j, n, { suffix: j === 'miss' ? (dt < 0 ? ' (EARLY)' : ' (LATE)') : ' RELEASE' });
  }
  evalValves() {
    this.valveEvalAt = null;
    const groupT = this.valveGroupT; this.valveGroupT = null;
    const mask = this.valveMask;
    const n = this.findNote(() => true);
    if (!n) { if (this.now > 0) Audio.drum('clunk', 0, 0.3); return; }
    let j = this.judgeDt(groupT - n.t);
    const wrong = mask !== n.combo;
    if (wrong) j = 'miss';
    n.judged = true; n.hit = !wrong && j !== 'miss'; n.judge = j;
    this.applyJudge(j, n, { suffix: wrong ? ' (VALVES)' : '' });
    if (n.hit) this.playHit(n, j); else Audio.drum('clunk', 0, 0.4);
  }
  update(dt) {
    if (this.startTime == null) return;
    this.now = Audio.now() - this.startTime;
    this.events = { perfects: 0, misses: 0, cheer: 0 };
    // section switching
    while (this.secIdx < this.sections.length - 1 && this.now >= this.sections[this.secIdx + 1].start) {
      // release everything from the old instrument
      for (const l in this.holds) { const n = this.holds[l]; if (n.holding) this.releaseHold(n, l); }
      if (this.breathNote) this.releaseWind(this.breathNote);
      const changed = this.sections[this.secIdx + 1].instrument !== this.section.instrument;
      this.secIdx++; this.bannerT = changed ? 1.2 : 0; this.valveMask = 0; this.valveEvalAt = null; this.valveGroupT = null;
      this.keysDown.clear();
    }
    const ns = this.nextSection;
    this.switchWarn = ns && ns.instrument !== this.section.instrument && this.now > ns.start - 4 * this.song.beat && this.now < ns.start;
    // misses
    for (const n of this.notes) {
      if (n.judged) continue;
      if (n.t - this.now > 0.5) break;
      if (this.now - n.t > this.win('good') + 0.02) {
        n.judged = true; n.hit = false; n.judge = 'miss';
        if (n.type === 'roll') { n.hits = n.hits || 0; continue; }
        this.applyJudge('miss', n);
        if (n.type === 'hold') { n.tailJudged = true; this.counts.miss++; }
      }
    }
    // holds progression
    for (const l in this.holds) {
      const n = this.holds[l];
      if (n.holding && this.now >= n.t + n.dur) { n.tailJudged = true; n.holding = false; delete this.holds[l]; if (n.voice) n.voice.off(); this.applyJudge('perfect', n, { suffix: ' HOLD' }); }
    }
    // wind breath
    if (this.breathNote) {
      const n = this.breathNote;
      this.breath = Math.max(0, this.breath - dt * 0.28);
      if (this.now > n.t + n.dur + this.win('good')) { n.tailJudged = true; this.applyJudge('miss', n, { suffix: ' (LATE)' }); n.holding = false; this.breathNote = null; if (n.voice) n.voice.off(); }
      else if (this.breath <= 0) { this.popups.push({ text: 'OUT OF BREATH', color: '#ff5a5a', t: 0 }); this.releaseWind(n); }
    } else if (this.keysDown.has('Space') && this.instrument.game === 'wind') {
      this.breath = Math.max(0, this.breath - dt * 0.15);
    } else this.breath = Math.min(1, this.breath + dt * 0.45);
    // valves
    if (this.valveEvalAt != null && this.now >= this.valveEvalAt) this.evalValves();
    // hype decay
    if (this.now > 0) this.hype = clamp(this.hype - dt * 0.7, 0, 100);
    // popups / flashes
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter(p => p.t < (p.big ? 1.2 : 0.55));
    for (const k in this.flashes) this.flashes[k] = Math.max(0, this.flashes[k] - dt);
    this.bannerT = Math.max(0, this.bannerT - dt);
    const beatPos = ((this.now % this.song.beat) + this.song.beat) % this.song.beat;
    this.beatPulse = 1 - beatPos / this.song.beat;
    if (this.now >= this.song.length) this.finished = true;
  }
  results() {
    const c = this.counts; const total = c.perfect + c.great + c.good + c.miss;
    const acc = total ? (c.perfect + c.great * 0.75 + c.good * 0.4) / total : 0;
    return { ...c, total, acc, maxCombo: this.maxCombo, rollHits: this.rollHits };
  }

  // ---------- Rendering ----------
  draw(ctx, A) {
    const g = this.instrument.game;
    rect(ctx, A.x, A.y, A.w, A.h, '#0d0b18');
    if (g === 'lanes') this.drawLanes(ctx, A);
    else if (g === 'taiko') this.drawTaiko(ctx, A);
    else if (g === 'wind') this.drawWind(ctx, A);
    else if (g === 'valves') this.drawValves(ctx, A);
    else if (g === 'bow') this.drawBow(ctx, A);
    this.drawHud(ctx, A);
  }
  drawHud(ctx, A) {
    // combo & hype
    if (this.combo >= 5) drawText(ctx, this.combo + ' COMBO', A.x + A.w / 2, A.y + 8, '#fff', { align: 'center', scale: 2, shadow: '#000' });
    // popups
    let py = A.y + 34;
    for (const p of this.popups.slice(-3)) {
      ctx.globalAlpha = clamp(1 - p.t / (p.big ? 1.2 : 0.55) * 0.8 + 0.2, 0, 1);
      drawText(ctx, p.text, A.x + A.w / 2, py - (p.big ? p.t * 10 : 0), p.color, { align: 'center', scale: p.big ? 2 : 1, shadow: '#000' });
      ctx.globalAlpha = 1; py += p.big ? 12 : 7;
    }
    // count-in
    if (this.now < 0) {
      const beatsLeft = Math.ceil(-this.now / this.song.beat);
      drawText(ctx, beatsLeft > 0 ? String(beatsLeft) : 'GO!', A.x + A.w / 2, A.y + A.h / 2 - 10, '#fff', { align: 'center', scale: 3, shadow: '#000' });
      drawText(ctx, this.instrument.name.toUpperCase() + ' - ' + this.instrument.keyNames.join(' '), A.x + A.w / 2, A.y + A.h / 2 + 16, '#ffd166', { align: 'center', shadow: '#000' });
    }
    // banner on switch
    if (this.bannerT > 0 && this.now > 0) {
      ctx.globalAlpha = clamp(this.bannerT, 0, 1);
      rect(ctx, A.x, A.y + A.h / 2 - 12, A.w, 24, '#000');
      drawText(ctx, 'NOW: ' + this.instrument.name.toUpperCase() + ' (' + this.instrument.keyNames.join(' ') + ')', A.x + A.w / 2, A.y + A.h / 2 - 5, '#ffe14d', { align: 'center', scale: 2 });
      ctx.globalAlpha = 1;
    }
    if (this.switchWarn) {
      const ns = this.nextSection; const ni = INSTRUMENTS[ns.instrument];
      const blink = Math.floor(this.now * 6) % 2 === 0;
      rect(ctx, A.x + A.w - 130, A.y + 2, 128, 16, '#000');
      drawText(ctx, 'SWITCH: ' + ni.name.toUpperCase(), A.x + A.w - 66, A.y + 4, blink ? '#ff9f68' : '#fff', { align: 'center' });
      drawText(ctx, ni.keyNames.join(' ') + (ns.member ? ' - ' + ns.member.name : ''), A.x + A.w - 66, A.y + 11, '#ccc', { align: 'center' });
    }
    if (this.mods.metronome) {
      const r = 2 + Math.round(this.beatPulse * 3);
      circle(ctx, A.x + 8, A.y + 8, r, this.beatPulse > 0.8 ? '#ffe14d' : '#665');
    }
  }
  drawLanes(ctx, A) {
    const instr = this.instrument; const L = instr.lanes;
    const laneW = Math.min(40, Math.floor((A.w - 40) / L));
    const x0 = A.x + Math.floor((A.w - laneW * L) / 2);
    const hitY = A.y + A.h - 22, top = A.y + 10;
    // highway
    for (let l = 0; l < L; l++) {
      const x = x0 + l * laneW;
      rect(ctx, x, top, laneW, hitY - top + 8, l % 2 ? '#141126' : '#181430');
      if (this.flashes[l] > 0) { ctx.globalAlpha = this.flashes[l] * 3; rect(ctx, x, top, laneW, hitY - top + 8, LANE_COLORS[l]); ctx.globalAlpha = 1; }
      rect(ctx, x, top, 1, hitY - top + 8, '#2a2450');
      // receptor
      const held = this.keysDown.has(instr.keys[l]);
      rect(ctx, x + 3, hitY - 2, laneW - 6, 5, held ? LANE_COLORS[l] : shade(LANE_COLORS[l], -90));
      frame(ctx, x + 3, hitY - 2, laneW - 6, 5, LANE_COLORS[l]);
      drawText(ctx, instr.keyNames[l], x + laneW / 2, hitY + 8, '#ccc', { align: 'center' });
    }
    rect(ctx, x0 + L * laneW, top, 1, hitY - top + 8, '#2a2450');
    // beat lines
    const pxPerSec = (hitY - top) / this.approach;
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
      const t = b * this.song.beat; const y = hitY - (t - this.now) * pxPerSec;
      if (y < top) break;
      rect(ctx, x0, y, L * laneW, 1, b % 4 === 0 ? '#3a3560' : '#242040');
    }
    // notes
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      const y = hitY - (n.t - this.now) * pxPerSec;
      if (y < top - 10) break;
      if (n.judged && !n.holding && (n.type !== 'hold' || n.tailJudged || !n.hit)) { if (n.type !== 'hold' || !n.hit) continue; }
      const x = x0 + n.lane * laneW + 3, w = laneW - 6;
      const col = LANE_COLORS[n.lane];
      if (n.type === 'hold') {
        const yEnd = hitY - (n.t + n.dur - this.now) * pxPerSec;
        const yStart = n.holding ? hitY : y;
        if (yEnd < hitY + 4) {
          const yy = Math.max(top, yEnd), hh = Math.min(hitY + 3, yStart) - yy;
          if (hh > 0) rect(ctx, x + w / 2 - 3, yy, 6, hh, n.holding ? col : shade(col, -60));
        }
        if (n.tailJudged && n.hit) continue;
      }
      if (n.judged && n.hit && (!n.holding)) continue;
      if (y > hitY + 12) continue;
      if (n.holding) continue;
      rect(ctx, x, y - 3, w, 6, col);
      rect(ctx, x + 1, y - 2, w - 2, 1, shade(col, 60));
      rect(ctx, x, y + 3, w, 1, shade(col, -50));
    }
  }
  drawTaiko(ctx, A) {
    const hitX = A.x + 52, cy = A.y + A.h / 2 - 6, lineTop = cy - 22, lineH = 44;
    rect(ctx, A.x, lineTop, A.w, lineH, '#1a1428');
    rect(ctx, A.x, lineTop, A.w, 1, '#3a3060'); rect(ctx, A.x, lineTop + lineH, A.w, 1, '#3a3060');
    const pxPerSec = (A.w - 60) / this.approach;
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
      const t = b * this.song.beat; const x = hitX + (t - this.now) * pxPerSec;
      if (x > A.x + A.w) break;
      if (x > A.x) rect(ctx, x, lineTop, 1, lineH, b % 4 === 0 ? '#4a4070' : '#2a2448');
    }
    // hit circle
    ringPx(ctx, hitX, cy, 12, '#666'); ringPx(ctx, hitX, cy, 11, '#444');
    if (this.flashes.don > 0) circle(ctx, hitX, cy, 10, '#ff6b6b');
    else if (this.flashes.ka > 0) circle(ctx, hitX, cy, 10, '#5bc0ff');
    // drum face left
    rect(ctx, A.x + 2, cy - 18, 32, 36, '#5a3a1e'); rect(ctx, A.x + 6, cy - 14, 24, 28, '#f0e8d8');
    drawText(ctx, 'D K', A.x + 18, cy - 24, '#5bc0ff', { align: 'center' });
    drawText(ctx, 'F J', A.x + 18, cy + 22, '#ff6b6b', { align: 'center' });
    // notes, draw far ones first
    const visible = [];
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      if (n.judged && n.type !== 'roll') continue;
      const x = hitX + (n.t - this.now) * pxPerSec;
      if (x > A.x + A.w + 20) break;
      if (x < A.x - 20 && n.type !== 'roll') continue;
      visible.push({ n, x });
    }
    for (let i = visible.length - 1; i >= 0; i--) {
      const { n, x } = visible[i];
      if (n.type === 'roll') {
        const xe = hitX + (n.t + n.dur - this.now) * pxPerSec;
        const xs = Math.max(hitX, x);
        if (xe > A.x) { rect(ctx, xs, cy - 7, Math.max(0, xe - xs), 14, '#ffd166'); circle(ctx, xe, cy, 7, '#ffd166'); circle(ctx, xs, cy, 7, '#ffd166'); drawText(ctx, 'ROLL!', (xs + xe) / 2, cy - 16, '#ffd166', { align: 'center' }); }
        continue;
      }
      const big = n.type === 'big'; const r = big ? 12 : 8;
      const col = n.type === 'ka' ? '#5bc0ff' : '#ff6b6b';
      circle(ctx, x, cy, r, '#111'); circle(ctx, x, cy, r - 1, col); circle(ctx, x, cy, r - 4, shade(col, 50));
      if (big) drawText(ctx, 'FJ', x, cy - 2, '#000', { align: 'center' });
    }
  }
  drawWind(ctx, A) {
    const hitX = A.x + 70, top = A.y + 22, bot = A.y + A.h - 30;
    rect(ctx, A.x, top - 4, A.w, bot - top + 8, '#141126');
    for (let i = 0; i <= 4; i++) rect(ctx, A.x, top + (bot - top) * i / 4, A.w, 1, '#2a2450');
    const pxPerSec = (A.w - 80) / this.approach;
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
      const t = b * this.song.beat; const x = hitX + (t - this.now) * pxPerSec;
      if (x > A.x + A.w) break;
      if (x > A.x) rect(ctx, x, top - 4, 1, bot - top + 8, b % 4 === 0 ? '#4a4070' : '#242040');
    }
    // hit line
    rect(ctx, hitX, top - 6, 2, bot - top + 12, this.keysDown.has('Space') ? '#ffe14d' : '#887');
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      const xs = hitX + (n.t - this.now) * pxPerSec, xe = hitX + (n.t + n.dur - this.now) * pxPerSec;
      if (xs > A.x + A.w + 10) break;
      if (xe < A.x - 10) continue;
      const y = bot - (bot - top) * n.pitch;
      let col = '#e0b040';
      if (n.judged && !n.hit) col = '#553';
      else if (n.holding) col = '#ffe14d';
      else if (n.tailJudged) col = '#6ff08a';
      const x1 = Math.max(A.x, xs), x2 = Math.min(A.x + A.w, xe);
      if (x2 > x1) rect(ctx, x1, y - 3, x2 - x1, 7, col);
      if (xs >= A.x) { rect(ctx, xs, y - 5, 3, 11, shade(col, 60)); }
      if (xe <= A.x + A.w) rect(ctx, xe - 2, y - 5, 3, 11, shade(col, -40));
    }
    // breath meter
    const bw = 100, bx = A.x + A.w / 2 - bw / 2, by = A.y + A.h - 16;
    rect(ctx, bx, by, bw, 6, '#222'); rect(ctx, bx, by, bw * this.breath, 6, this.breath < 0.25 ? '#ff5a5a' : '#6fb8ff'); frame(ctx, bx, by, bw, 6, '#889');
    drawText(ctx, 'BREATH', bx - 4, by, '#aab', { align: 'right' });
    drawText(ctx, 'HOLD SPACE', bx + bw + 6, by, '#aab');
  }
  drawValves(ctx, A) {
    const hitX = A.x + 60, cy = A.y + A.h / 2 - 14;
    rect(ctx, A.x, cy - 22, A.w, 44, '#141126');
    const pxPerSec = (A.w - 70) / this.approach;
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
      const t = b * this.song.beat; const x = hitX + (t - this.now) * pxPerSec;
      if (x > A.x + A.w) break;
      if (x > A.x) rect(ctx, x, cy - 20, 1, 40, b % 4 === 0 ? '#4a4070' : '#242040');
    }
    ringPx(ctx, hitX, cy, 13, '#777');
    for (const n of this.notes) {
      if (n.sec !== this.secIdx || n.judged) continue;
      const x = hitX + (n.t - this.now) * pxPerSec;
      if (x > A.x + A.w + 14) break;
      if (x < A.x - 14) continue;
      circle(ctx, x, cy, 13, '#f0c040'); circle(ctx, x, cy, 12, '#c89a2a');
      for (let v = 0; v < 3; v++) {
        const on = (n.combo >> v) & 1;
        rect(ctx, x - 8 + v * 5, cy - 6, 4, 12, on ? '#fff' : '#5a4210');
        if (on) drawText(ctx, this.instrument.keyNames[v], x - 7 + v * 5, cy - 2, '#000');
      }
    }
    // valve buttons
    const names = this.instrument.keyNames;
    for (let v = 0; v < 3; v++) {
      const bx = A.x + A.w / 2 - 36 + v * 26, by = A.y + A.h - 30;
      const on = (this.valveMask >> v) & 1;
      rect(ctx, bx, by + (on ? 3 : 0), 20, 14 - (on ? 3 : 0), on ? '#ffe14d' : '#8a6a20'); frame(ctx, bx, by + (on ? 3 : 0), 20, 14 - (on ? 3 : 0), '#fff');
      drawText(ctx, names[v], bx + 10, by + 5 + (on ? 2 : 0), '#000', { align: 'center' });
    }
    drawText(ctx, 'PRESS THE LIT VALVES TOGETHER', A.x + A.w / 2, A.y + A.h - 10, '#aab', { align: 'center' });
  }
  drawBow(ctx, A) {
    const hitX = A.x + 70, top = A.y + 24, bot = A.y + A.h - 30;
    rect(ctx, A.x, top - 6, A.w, bot - top + 12, '#141126');
    for (let i = 0; i < 4; i++) rect(ctx, A.x, top + (bot - top) * i / 3, A.w, 1, '#3a3560');
    const pxPerSec = (A.w - 80) / this.approach;
    for (let b = Math.ceil(this.now / this.song.beat); ; b++) {
      const t = b * this.song.beat; const x = hitX + (t - this.now) * pxPerSec;
      if (x > A.x + A.w) break;
      if (x > A.x) rect(ctx, x, top - 6, 1, bot - top + 12, b % 4 === 0 ? '#4a4070' : '#242040');
    }
    rect(ctx, hitX, top - 8, 2, bot - top + 16, '#887');
    if (this.flashes[1] > 0) rect(ctx, hitX - 3, top - 8, 8, (bot - top) / 2 + 8, '#c58bff');
    if (this.flashes[0] > 0) rect(ctx, hitX - 3, top + (bot - top) / 2, 8, (bot - top) / 2 + 8, '#6be585');
    for (const n of this.notes) {
      if (n.sec !== this.secIdx) continue;
      const xs = hitX + (n.t - this.now) * pxPerSec;
      if (xs > A.x + A.w + 10) break;
      const xe = n.dur ? hitX + (n.t + n.dur - this.now) * pxPerSec : xs;
      if (xe < A.x - 10) continue;
      if (n.judged && !n.holding && (!n.type === 'hold' || n.tailJudged || !n.hit)) { if (!(n.type === 'hold' && n.hit && !n.tailJudged)) continue; }
      const y = bot - (bot - top) * n.pitch;
      const col = n.dir > 0 ? '#c58bff' : '#6be585';
      if (n.dur) { const x1 = Math.max(A.x, n.holding ? hitX : xs), x2 = Math.min(A.x + A.w, xe); if (x2 > x1) rect(ctx, x1, y - 2, x2 - x1, 5, n.holding ? '#fff' : shade(col, -50)); }
      if (n.holding) continue;
      // arrow
      circle(ctx, xs, y, 6, col);
      drawText(ctx, n.dir > 0 ? '↑' : '↓', xs, y - 2, '#000', { align: 'center' });
    }
    drawText(ctx, 'UP BOW = ↑ / W', A.x + 6, A.y + A.h - 12, '#c58bff');
    drawText(ctx, 'DOWN BOW = ↓ / S', A.x + A.w - 6, A.y + A.h - 12, '#6be585', { align: 'right' });
  }
}
