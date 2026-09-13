// ---------- Passers-by, traffic, watchers, coins, ambient particles ----------
'use strict';
class Crowd {
  // layout: {groundY, rows:[dy...], streetY, streetH, stageX, hatX, hatY, spanL, spanR}
  constructor(venue, mods, rng, L) {
    this.venue = venue; this.mods = mods; this.rng = rng; this.L = L;
    this.peds = []; this.cars = []; this.coins = []; this.popups = []; this.fx = new Particles();
    this.earned = 0; this.tipCount = 0; this.spawnAcc = 1.2; this.carAcc = 0.5; this.hype = 20; this.time = 0; this.watchersMax = 8; this.cheerFlash = 0;
    this.pigeons = []; for (let i = 0; i < (venue.kind === 'park' || venue.kind === 'pier' ? 4 : 2); i++) this.pigeons.push({ x: rng.range(20, W - 20), t: rng.range(0, 5), hop: 0, dir: rng.sign() });
    for (let i = 0; i < 3; i++) this.spawn(true);
  }
  get watchers() { return this.peds.filter(p => p.state === 'watch'); }
  spawn(anywhere) {
    const r = this.rng, dir = r.sign(), row = r.int(0, this.L.rows.length - 1);
    this.peds.push({ x: anywhere ? r.range(20, W - 20) : (dir > 0 ? -24 : W + 24), dir, row, spec: randomBugSpec(r), speed: r.range(16, 30), state: 'walk', t: r.range(0, 10), watchT: 0, tipT: r.range(2, 5), generous: r.range(0.6, 1.6), attention: r.range(0.5, 1.4), stopX: null, bob: r.range(0, 6), tipped: 0, walkT: 0 });
  }
  spawnCar() { const r = this.rng, dir = r.sign(); const kind = this.venue.cablecar && r.chance(0.25) ? 'cable' : 'car'; this.cars.push({ x: dir > 0 ? -70 : W + 70, dir, speed: kind === 'cable' ? 22 : r.range(40, 75), seed: r.int(1, 9999), kind, lane: dir > 0 ? 1 : 0 }); }
  update(dt, hype, ev, wind, playing) {
    // Passers-by drop coins for playing, not for standing there listening to
    // your own band. A mode with a listen half would otherwise earn double.
    this.paying = playing !== false;
    this.time += dt; this.hype = hype;
    const traffic = this.venue.traffic * this.mods.crowd * (this.mods.bossMod === 'rushHour' ? 2 : 1);
    this.spawnAcc += dt * traffic * 0.42; while (this.spawnAcc >= 1) { this.spawnAcc -= 1; if (this.peds.length < 26) this.spawn(); }
    if (this.L.streetY && this.venue.kind !== 'subway') { this.carAcc += dt * (0.12 + this.venue.traffic * 0.08); if (this.carAcc >= 1 && this.cars.length < 4) { this.carAcc = 0; this.spawnCar(); } }
    for (const c of this.cars) c.x += c.dir * c.speed * dt; this.cars = this.cars.filter(c => c.x > -100 && c.x < W + 100);
    const attractRange = 90 * (this.mods.range || 1); let watchers = this.watchers.length;
    for (const p of this.peds) {
      p.t += dt;
      if (p.state === 'walk' || p.state === 'leave') {
        p.x += p.dir * p.speed * dt; p.walkT += dt * p.speed / 10;
        if (p.state === 'walk' && Math.abs(p.x - this.L.stageX) < attractRange && watchers < this.watchersMax && this.rng.chance((hype / 100) * 0.9 * p.attention * dt)) {
          p.state = 'watch'; watchers++; p.watchT = this.rng.range(8, 14) * this.mods.watchTime * (this.mods.bossMod === 'rushHour' ? 0.5 : 1); p.tipT = this.rng.range(1.5, 4);
          p.stopX = clamp(this.L.stageX + this.rng.range(-80, 80), 20, W - 20); p.row = this.rng.int(0, this.L.rows.length - 1);
          this.fx.text(p.x, this.L.groundY - 46, '!', '#ffe680', { life: 0.6 });
        }
      } else if (p.state === 'watch') {
        if (Math.abs(p.x - p.stopX) > 1) { const d = Math.sign(p.stopX - p.x); p.x += d * 20 * dt; p.dir = d; p.walkT += dt * 2; } else p.dir = p.x < this.L.stageX ? 1 : -1;
        p.watchT -= dt; if (hype > 60) p.watchT += dt * 0.6; p.tipT -= dt;
        if (p.tipT <= 0) { p.tipT = this.rng.range(3, 6); if (this.rng.chance(clamp(hype / 100 + 0.1, 0.15, 1))) this.tip(p, 1); }
        if (ev.misses > 0 && this.rng.chance(0.18 * ev.misses * (hype < 40 ? 1.6 : 1))) { p.state = 'leave'; p.dir = this.rng.sign(); this.fx.text(p.x, this.L.groundY - 46, '...', '#aab', { life: 0.6 }); }
        if (p.watchT <= 0 || (hype < 15 && this.rng.chance(dt * 0.5))) { p.state = 'leave'; p.dir = this.rng.sign(); }
      }
    }
    if (ev.cheer) { this.cheerFlash = 1; for (const p of this.watchers) this.tip(p, ev.cheer); Audio.applause(clamp(this.watchers.length / 8, 0.2, 1)); for (let i = 0; i < 40; i++) this.fx.add({ x: this.L.stageX + (this.rng() - 0.5) * 240, y: this.L.groundY - 90 - this.rng() * 40, vx: (this.rng() - 0.5) * 30, vy: 20 + this.rng() * 30, life: 2, color: ['#ff6b6b', '#ffd166', '#6be585', '#5bc0ff', '#c58bff'][i % 5], kind: 'confetti', gravity: 15 }); }
    this.cheerFlash = Math.max(0, this.cheerFlash - dt * 2);
    this.peds = this.peds.filter(p => p.x > -40 && p.x < W + 40);
    for (const c of this.coins) { c.t += dt / c.dur; if (c.t >= 1 && !c.done) { c.done = true; if (this.paying) this.earned += c.value; this.tipCount++; Audio.ui(c.bill ? 'bill' : 'coin'); this.fx.text(this.L.hatX, this.L.hatY - 10, '+' + fmtMoney(c.value), c.bill ? '#9af09a' : '#ffe680', { life: 1 }); this.fx.burst(this.L.hatX, this.L.hatY - 2, 6, { color: ['#ffe680', '#fff'], speed: 40, life: 0.4, kind: 'spark', gravity: 80, up: 30 }); } }
    this.coins = this.coins.filter(c => !c.done);
    for (const pg of this.pigeons) { pg.t += dt; if (pg.t > 3 && this.rng.chance(dt * 0.6)) { pg.t = 0; pg.hop = 0.25; pg.dir = this.rng.sign(); } if (pg.hop > 0) { pg.hop -= dt; pg.x += pg.dir * 30 * dt; } const near = this.peds.some(p => Math.abs(p.x - pg.x) < 14); if (near && pg.hop <= 0) { pg.hop = 0.3; pg.dir = this.rng.sign(); } pg.x = clamp(pg.x, 10, W - 10); }
    // ambient: leaves / fog / steam
    const kind = this.venue.kind;
    if (kind === 'park' || kind === 'street') { if (this.rng.chance(dt * (1.2 + Math.abs(wind) * 2))) this.fx.add({ x: wind > 0 ? -5 : W + 5, y: this.rng.range(20, this.L.groundY - 20), vx: wind * 30 + this.rng.range(-10, 10) * (wind > 0 ? 1 : -1), vy: this.rng.range(5, 20), life: 8, kind: 'leaf', gravity: 4 }); }
    if (kind === 'bridge' || kind === 'pier' || this.venue.sky > 0.6) { if (this.rng.chance(dt * 0.8)) this.fx.add({ x: wind >= 0 ? -30 : W + 30, y: this.rng.range(60, this.L.groundY - 40), vx: wind * 20 + (wind >= 0 ? 12 : -12), vy: 0, life: 20, kind: 'fog', color: '#dfe6f2', size: 12, grow: 10, alpha: 0.18, gravity: 0 }); }
    if (kind === 'subway' || kind === 'street') { if (this.rng.chance(dt * 0.5)) this.fx.add({ x: this.L.stageX + 200 + this.rng.range(-10, 10), y: this.L.groundY + 2, vx: wind * 5, vy: -14, life: 2.2, kind: 'smoke', color: '#d8d8e0', size: 2, grow: 6, alpha: 0.35, gravity: 0 }); }
    this.fx.update(dt, wind * 40);
  }
  tip(p, mult) {
    const wealth = this.venue.wealth; let value, bill = false;
    const roll = this.rng() * p.generous * (0.6 + this.hype / 120);
    if (roll > 1.3 && this.hype > 60) { bill = true; value = this.rng.pick([1, 1, 2, 2, 5]) * (wealth > 1.5 ? 2 : 1); } else value = this.rng.pick([0.25, 0.5, 0.5, 1]) * (wealth >= 1.4 ? 2 : 1);
    value = Math.max(0.25, Math.round(value * wealth * mult * 4) / 4); p.tipped++;
    this.coins.push({ x0: p.x, y0: this.L.groundY + this.L.rows[p.row] - 22, t: 0, dur: 0.55 + this.rng() * 0.2, value, bill, done: false });
  }
  drawCars(ctx, lane) {
    if (!this.L.streetY) return;
    for (const c of this.cars) { if (c.lane !== lane) continue; const y = this.L.streetY + (lane === 0 ? 4 : this.L.streetH - 22); if (c.kind === 'cable') { const cc = cableCarCanvas(); ctx.drawImage(c.dir > 0 ? cc : cached('cableflip', () => flipCanvas(cc)), Math.round(c.x - 28), Math.round(y - 6)); } else ctx.drawImage(carCanvas(c.seed, c.dir), Math.round(c.x - 22), Math.round(y)); }
  }
  drawPeds(ctx, rowsToDraw) {
    for (const row of rowsToDraw) for (const p of this.peds) {
      if (p.row !== row) continue;
      const walking = p.state !== 'watch' || Math.abs(p.x - p.stopX) > 1;
      const pose = walking ? (Math.floor(p.walkT * 2) % 2 ? 'walk1' : 'walk2') : (this.cheerFlash > 0 ? 'cheer' : 'idle');
      const y = this.L.groundY + this.L.rows[row] + (p.state === 'watch' && !walking && this.hype > 60 ? Math.round(Math.sin(this.time * 6 + p.bob)) : 0);
      drawShadow(ctx, p.x, y, 16, 0.2);
      drawBugAt(ctx, p.spec, p.x, y, { pose, flip: p.dir < 0 });
      if (p.state === 'watch') { const ph = Math.floor(this.time * 1.5 + p.bob) % 4; if (this.hype > 70 && ph === 0) ctx.drawImage(icon('heart'), Math.round(p.x + 6), Math.round(y - 50 - Math.sin(this.time * 4 + p.bob) * 2)); else if (ph === 2) ctx.drawImage(icon('note'), Math.round(p.x + 8), Math.round(y - 50)); }
    }
  }
  drawPigeons(ctx) { for (const pg of this.pigeons) { const c = propCanvas('pigeon'); ctx.drawImage(pg.dir > 0 ? c : cached('pigeonflip', () => flipCanvas(c)), Math.round(pg.x), Math.round(this.L.groundY - 7 - (pg.hop > 0 ? 3 : 0))); } }
  drawCoins(ctx) {
    for (const c of this.coins) { const t = clamp(c.t, 0, 1); const x = lerp(c.x0, this.L.hatX, t), y = lerp(c.y0, this.L.hatY - 4, t) - Math.sin(t * Math.PI) * 36; ctx.drawImage(icon(c.bill ? 'bill' : 'coin'), Math.round(x), Math.round(y)); if (Math.random() < 0.3) this.fx.add({ x, y: y + 3, vx: 0, vy: 0, life: 0.3, color: '#fff8c0', kind: 'px' }); }
    this.fx.draw(ctx);
  }
}
