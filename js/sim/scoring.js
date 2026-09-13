// ---------- Applause x Mult scoring with charm hooks ----------
'use strict';
const PAYOUT_DIV = 110;
function collectMods(run, extra = {}) {
  const m = { windowMult: 1, missMult: 1, crowd: 1, watchTime: 1, decay: 1, watcherApplause: 1, cheerMult: 0.3, safetyNet: 0, staminaExtra: 0, encore: false, metronome: false, earplugs: false, tuner: false, quality: 0, permit: false, eliteBonus: 1, multBonus: 0, starRate: 0.08, bombMult: 1, tipMult: 1, dodgeMult: 0, tickets: 0, cheapTravel: false };
  if (!run) return Object.assign(m, extra);
  for (const k of run.charms) { const c = CHARMS[k]; if (c && c.mods) for (const key in c.mods) { const v = c.mods[key]; if (typeof v === 'number' && ['crowd', 'watchTime', 'decay', 'watcherApplause', 'windowMult', 'missMult', 'bombMult', 'tipMult'].includes(key)) m[key] *= v; else if (typeof v === 'number') m[key] = ['tickets', 'dodgeMult', 'safetyNet'].includes(key) ? (m[key] || 0) + v : Math.max(m[key] || 0, v); else m[key] = v; } }
  const p = run.perks || {};
  if (p.crowd) m.crowd *= p.crowd; if (p.watchTime) m.watchTime *= p.watchTime; if (p.window) m.windowMult *= p.window; if (p.quality) m.quality += p.quality;
  const b = run.buffs || {};
  if (b.window) m.windowMult *= b.window; if (b.crowd) m.crowd *= b.crowd; if (b.mult) m.multBonus += b.mult; if (b.tuner) m.tuner = true;
  return Object.assign(m, extra);
}
class ScoreState {
  constructor(run, info) {
    this.run = run; this.info = info; this.mods = info.mods;
    this.applause = 0; this.multAdd = 0; this.times = []; this.cash = []; this.steps = []; this.cheers = 0; this.rollHits = 0; this.qteHits = 0;
    this.instrument = info.instrument; this.genre = info.genre; this.performers = info.performers || 1; this.band = info.band || [];
    this.watchers = 0; this.combo = 0; this.hype = 0; this.misses = 0; this.sectionMult = 1;
    this.charms = (run ? run.charms : []).map(k => CHARMS[k]).filter(Boolean);
  }
  bandHas(k) { return this.band.some(m => m.instrument === k); }
  addApplause(n, why) { n = Math.round(n); if (!n) return; this.applause += n * this.sectionMult; if (why) this.steps.push({ kind: 'applause', label: why, value: n }); }
  addMult(n, why) { if (!n) return; this.multAdd += n; this.steps.push({ kind: 'mult', label: why, value: n }); }
  timesMult(n, why) { this.times.push(n); this.steps.push({ kind: 'times', label: why, value: n }); }
  addCash(n, why) { if (!n) return; this.cash.push({ n, why }); this.steps.push({ kind: 'cash', label: why, value: n }); }
  setSection(isLast) { this.sectionMult = (isLast && this.mods.encore) ? 2 : 1; }
  onHit(note, judge, info = {}) {
    let j = judge;
    if (this.mods.earplugs && j === 'great') j = 'perfect';
    let base = j === 'perfect' ? 30 : j === 'great' ? 18 : j === 'good' ? 8 : 0;
    if (note.star && base) base *= 3;
    if (info.tail && base) base = Math.round(base * 0.6) + 10;
    if (note.type === 'big' && base) base += 10;
    if (base && this.mods && this.mods.gearPay) base = Math.round(base * (0.7 + this.mods.gearPay * 0.3));
    if (note.chord && base) base += 4;
    info.applause = base;
    this.applause += base * this.sectionMult;
    if (judge === 'miss') this.misses++;
    for (const c of this.charms) if (c.onHit) c.onHit(this, note, judge, info);
    return base;
  }
  onBombDodged() { this.applause += 6; }
  onRoll() { this.applause += 6; this.rollHits++; }
  onQte(judge) { const a = judge === 'perfect' ? 30 : judge === 'great' ? 20 : judge === 'good' ? 10 : 0; this.applause += a; if (a) this.qteHits++; return a; }
  // The crowd only cheers while you are actually playing. Without this, a mode
  // that spends half its time listening would earn twice as much for it.
  watcherTick(dt, watchers, playing) { this.watchers = watchers; if (playing === false) return; this.applause += watchers * 3 * dt * this.mods.watcherApplause; }
  onCheer() { this.cheers++; this.addMult(this.mods.cheerMult, 'Crowd cheer'); }
  finish(state) {
    this.combo = state.combo; this.maxCombo = state.maxCombo; this.misses = state.misses; this.watchers = state.watchers; this.hype = state.hype; this.acc = state.acc;
    this.applause = Math.round(this.applause);
    this.baseMult = 1; this.steps.unshift({ kind: 'applause', label: 'Applause', value: this.applause, total: true });
    const comboM = Math.round(Math.min(1.5, this.maxCombo / 80) * 100) / 100; if (comboM) { this.baseMult += comboM; this.steps.push({ kind: 'mult', label: 'Max combo ' + this.maxCombo, value: comboM }); }
    const hypeM = Math.round(this.hype / 100 * 100) / 100; if (hypeM) { this.baseMult += hypeM; this.steps.push({ kind: 'mult', label: 'Final hype ' + Math.round(this.hype) + '%', value: hypeM }); }
    if (this.mods.multBonus) { this.addMult(this.mods.multBonus, 'Lucky charms & events'); }
    for (const c of this.charms) if (c.onSetEnd) c.onSetEnd(this);
    let mult = this.baseMult + this.multAdd; for (const t of this.times) mult *= t;
    this.mult = Math.round(mult * 100) / 100;
    const venue = this.info.venue || { wealth: 1 }; let dollars = this.applause * this.mult / PAYOUT_DIV * venue.wealth;
    // A show is several songs, but it is still one night's pay: normalise by
    // the song count and hand back a modest bonus for playing a longer set.
    const songs = this.info.songs || 1;
    if (songs > 1) dollars *= (1 + (songs - 1) * 0.35) / songs;
    if (this.info.mode === 'elite') dollars *= 1.25 * this.mods.eliteBonus; if (this.info.mode === 'boss') dollars *= 1.6;
    if (this.info.bossMod === 'cops') dollars *= 1.4;
    this.basePay = Math.round(dollars * 4) / 4;
    for (const c of this.charms) if (c.onPayout) c.onPayout(this);
    if (this.info.battle) { if (this.acc >= 0.8) this.addCash(40, 'Busker battle won!'); else this.steps.push({ kind: 'note', label: 'Busker battle lost (need 80% accuracy)' }); }
    this.total = this.basePay + this.cash.reduce((a, c) => a + c.n, 0);
    return this.total;
  }
}
