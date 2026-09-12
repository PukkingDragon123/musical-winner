// ---------- Passers-by, watchers, coins ----------
'use strict';
class Crowd {
  // mods: {crowd, tips, watchTime, wealth}
  constructor(venue, mods, rng) {
    this.venue = venue; this.mods = mods; this.rng = rng;
    this.peds = []; this.coins = []; this.popups = []; this.particles = [];
    this.earned = 0; this.tipCount = 0; this.spawnAcc = 1.5; this.hype = 20;
    this.stageX = 110; this.hatX = 150; this.hatY = 0; this.groundY = 0;
    this.watchersMax = 8; this.time = 0;
    this.cheerFlash = 0;
  }
  get watchers() { return this.peds.filter(p => p.state === 'watch'); }
  spawn() {
    const r = this.rng;
    const dir = r.chance(0.5) ? 1 : -1;
    const row = r.int(0, 2);
    const species = r.pick(SPECIES_KEYS);
    const hue = r.pick(['#c04040', '#4070c0', '#40a060', '#c0a040', '#8050b0', '#d07030', '#3aa0a0', '#b04080', '#777']);
    this.peds.push({
      x: dir > 0 ? -20 : W + 20, dir, row, species, speed: r.range(14, 26),
      override: { s: hue }, hat: r.chance(0.35) ? r.pick(Object.keys(HATS)) : null,
      state: 'walk', t: r.range(0, 10), watchT: 0, tipT: r.range(2, 5), generous: r.range(0.6, 1.6),
      attention: r.range(0.5, 1.4), stopX: null, bob: r.range(0, 6), tipped: 0,
    });
  }
  // events: {perfects, misses, cheer} since last frame
  update(dt, hype, ev) {
    this.time += dt;
    this.hype = hype;
    const traffic = this.venue.traffic * this.mods.crowd;
    this.spawnAcc += dt * traffic * 0.42;
    while (this.spawnAcc >= 1) { this.spawnAcc -= 1; if (this.peds.length < 26) this.spawn(); }
    const attractRange = 70 * (this.mods.range || 1);
    let watchers = this.watchers.length;
    for (const p of this.peds) {
      p.t += dt;
      if (p.state === 'walk' || p.state === 'leave') {
        p.x += p.dir * p.speed * dt;
        if (p.state === 'walk' && Math.abs(p.x - this.stageX) < attractRange && watchers < this.watchersMax) {
          const pStop = (hype / 100) * 0.9 * p.attention * dt;
          if (this.rng.chance(pStop)) {
            p.state = 'watch'; watchers++;
            p.watchT = this.rng.range(8, 14) * this.mods.watchTime;
            p.tipT = this.rng.range(1.5, 4);
            // find a spot in front of the stage
            p.stopX = this.stageX + this.rng.range(-60, 60);
            p.row = this.rng.int(0, 2);
          }
        }
      } else if (p.state === 'watch') {
        // shuffle to stop spot
        if (Math.abs(p.x - p.stopX) > 1) { const d = Math.sign(p.stopX - p.x); p.x += d * 20 * dt; p.dir = d; }
        else p.dir = p.x < this.stageX ? 1 : -1;
        p.watchT -= dt;
        if (hype > 60) p.watchT += dt * 0.6; // hooked
        p.tipT -= dt;
        if (p.tipT <= 0) {
          p.tipT = this.rng.range(3, 6);
          if (this.rng.chance(clamp(hype / 100 + 0.1, 0.15, 1))) this.tip(p, 1);
        }
        if (ev.misses > 0 && this.rng.chance(0.18 * ev.misses * (hype < 40 ? 1.6 : 1))) { p.state = 'leave'; p.dir = this.rng.chance(0.5) ? 1 : -1; }
        if (p.watchT <= 0 || (hype < 15 && this.rng.chance(dt * 0.5))) { p.state = 'leave'; p.dir = this.rng.chance(0.5) ? 1 : -1; }
      }
    }
    if (ev.cheer) {
      this.cheerFlash = 1;
      for (const p of this.watchers) this.tip(p, ev.cheer);
      Audio.applause(clamp(this.watchers.length / 8, 0.2, 1));
    }
    this.cheerFlash = Math.max(0, this.cheerFlash - dt * 2);
    this.peds = this.peds.filter(p => p.x > -30 && p.x < W + 30);
    // coins
    for (const c of this.coins) {
      c.t += dt / c.dur;
      if (c.t >= 1 && !c.done) {
        c.done = true; this.earned += c.value; this.tipCount++;
        Audio.ui(c.bill ? 'bill' : 'coin');
        this.popups.push({ x: this.hatX, y: this.hatY - 6, text: '+' + fmtMoney(c.value), t: 0, color: c.bill ? '#9af09a' : '#ffe680' });
        for (let i = 0; i < 4; i++) this.particles.push({ x: this.hatX + 4, y: this.hatY, vx: this.rng.range(-20, 20), vy: this.rng.range(-40, -10), t: 0 });
      }
    }
    this.coins = this.coins.filter(c => !c.done);
    for (const p of this.popups) { p.t += dt; p.y -= dt * 14; }
    this.popups = this.popups.filter(p => p.t < 1.2);
    for (const p of this.particles) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; }
    this.particles = this.particles.filter(p => p.t < 0.6);
  }
  tip(p, mult) {
    const wealth = this.venue.wealth * (this.mods.wealth || 1);
    let value, bill = false;
    const roll = this.rng() * p.generous * (0.6 + this.hype / 120);
    if (roll > 1.3 && this.hype > 60) { bill = true; value = this.rng.pick([1, 1, 2, 2, 5]) * (wealth > 1.5 ? 2 : 1); }
    else value = this.rng.pick([0.25, 0.5, 0.5, 1]) * (wealth >= 1.4 ? 2 : 1);
    value = Math.round(value * wealth * this.mods.tips * mult * 4) / 4;
    value = Math.max(0.25, value);
    p.tipped++;
    this.coins.push({ x0: p.x + 8, y0: this.groundY - 8 - p.row * 3, t: 0, dur: 0.55 + this.rng() * 0.2, value, bill, done: false });
  }
  drawPeds(ctx, groundY, layer) {
    // layer 0 = behind band (rows far), layer 1 = in front
    const rows = layer === 0 ? [2] : [1, 0];
    for (const row of rows) {
      for (const p of this.peds) {
        if (p.row !== row) continue;
        const walking = p.state !== 'watch' || Math.abs(p.x - p.stopX) > 1;
        const pose = walking ? (Math.floor(p.t * 6) % 2 ? 'walk' : 'stand') : (this.cheerFlash > 0 ? 'play' : 'stand');
        const y = groundY - 18 + 4 - row * 3 + (p.state === 'watch' && !walking ? Math.round(Math.sin(this.time * 6 + p.bob) * (this.hype > 60 ? 1 : 0)) : 0);
        drawBug(ctx, p.species, p.x, y, { pose, flip: p.dir < 0, override: p.override, hat: p.hat });
        if (p.state === 'watch' && this.hype > 70 && Math.floor(this.time * 2 + p.bob) % 3 === 0) {
          ctx.drawImage(propSprite('heart'), Math.round(p.x + 6), Math.round(y - 6 - Math.sin(this.time * 4 + p.bob) * 2));
        } else if (p.state === 'watch' && Math.floor(this.time * 1.5 + p.bob) % 4 === 0) {
          ctx.drawImage(propSprite('note'), Math.round(p.x + 7), Math.round(y - 6));
        }
      }
    }
  }
  drawCoins(ctx) {
    for (const c of this.coins) {
      const t = clamp(c.t, 0, 1);
      const x = lerp(c.x0, this.hatX + 3, t);
      const y = lerp(c.y0, this.hatY, t) - Math.sin(t * Math.PI) * 28;
      const spr = propSprite(c.bill ? 'bill' : 'coin');
      ctx.drawImage(spr, Math.round(x), Math.round(y));
    }
    for (const p of this.particles) rect(ctx, p.x, p.y, 1, 1, '#ffe680');
    for (const p of this.popups) {
      ctx.globalAlpha = clamp(1.5 - p.t, 0, 1);
      drawText(ctx, p.text, p.x + 4, p.y, p.color, { align: 'center', shadow: '#000' });
      ctx.globalAlpha = 1;
    }
  }
}
