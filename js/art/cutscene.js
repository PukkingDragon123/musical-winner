// ---------- Cutscenes ----------
// A cinematic layer anything can borrow: letterbox bars slide in, a portrait
// of whoever is talking slides up from the corner, the line types itself out,
// and a tap takes you to the next beat. It draws over whatever scene is
// underneath, so the world keeps moving behind the conversation.
'use strict';

// A beat: { who, name, spec, text, portrait, shake, sfx, flip }
class Cutscene {
  constructor(beats, opts = {}) {
    this.beats = beats.filter(Boolean); this.i = 0; this.t = 0; this.chars = 0;
    this.opts = opts; this.done = false; this.enterT = 0;
    this.speed = opts.speed || 46;         // characters a second
    this.onEnd = opts.onEnd || null;
  }
  get beat() { return this.beats[this.i]; }
  get full() { return this.beat ? this.beat.text.length : 0; }
  get typed() { return Math.min(this.full, Math.floor(this.chars)); }
  get complete() { return this.typed >= this.full; }
  update(dt) {
    if (this.done) return;
    this.t += dt; this.enterT = Math.min(1, this.enterT + dt * 3.4);
    if (!this.complete) {
      const was = this.typed;
      this.chars += dt * this.speed;
      // a soft click per couple of glyphs, so a line has a voice
      if (Math.floor(this.typed / 3) !== Math.floor(was / 3) && this.typed < this.full) Audio.ui('type');
    }
  }
  // tap or key: finish the line, then move on
  advance() {
    if (this.done) return true;
    if (!this.complete) { this.chars = this.full; return false; }
    this.i++; this.chars = 0;
    if (this.i >= this.beats.length) { this.done = true; if (this.onEnd) this.onEnd(); return true; }
    Audio.ui('move');
    return false;
  }
  draw(ctx) {
    if (this.done || !this.beat) return;
    const b = this.beat, k = easeOut(this.enterT);
    // letterbox: the cheapest way to say "this is a scene, not a menu"
    const bar = Math.round(38 * k);
    rect(ctx, 0, 0, W, bar, '#07060c'); rect(ctx, 0, H - bar, W, bar, '#07060c');
    rect(ctx, 0, bar, W, 1, 'rgba(255,255,255,0.08)'); rect(ctx, 0, H - bar - 1, W, 1, 'rgba(255,255,255,0.08)');
    // the box
    const bw = W - 64, bh = Game.touch ? 132 : 122;
    const bx = Math.round((W - bw) / 2), by = Math.round(H - bar - bh - 16 + (1 - k) * 40);
    ctx.globalAlpha = k;
    rect(ctx, bx + 4, by + 5, bw, bh, 'rgba(6,4,12,0.5)');
    rect(ctx, bx, by, bw, bh, '#161226');
    frame(ctx, bx, by, bw, bh, '#6a5f9a');
    frame(ctx, bx + 2, by + 2, bw - 4, bh - 4, '#2e2748');
    rect(ctx, bx + 1, by + 1, bw - 2, 1, '#8a7fc0');
    // the portrait of whoever is speaking, in its own framed plate
    let tx = bx + 16;
    if (b.spec) {
      const pw = Game.touch ? 84 : 76, px2 = bx + 8, py2 = by + Math.round((bh - pw) / 2);
      rect(ctx, px2, py2, pw, pw, '#0e0b1a'); frame(ctx, px2, py2, pw, pw, '#4a4270');
      ctx.save(); ctx.beginPath(); ctx.rect(px2 + 2, py2 + 2, pw - 4, pw - 4); ctx.clip();
      // a soft pool behind them so the silhouette reads
      ctx.globalAlpha = k * 0.35; ellipsePx(ctx, px2 + pw / 2, py2 + pw - 10, pw * 0.42, pw * 0.2, b.tint || '#c58bff'); ctx.globalAlpha = k;
      drawBugAt(ctx, b.spec, px2 + pw / 2, py2 + pw - 4, { pose: b.pose || 'idle', scale: (pw / 46), flip: !!b.flip, expr: b.expr });
      ctx.restore();
      tx = px2 + pw + 12;
    }
    // who is talking
    if (b.name) {
      const nw = textWidth(b.name, { scale: 3 }) + 20;
      rect(ctx, tx - 4, by - 15, nw, 24, '#2a2348'); frame(ctx, tx - 4, by - 15, nw, 24, '#6a5f9a');
      rect(ctx, tx - 3, by - 14, nw - 2, 1, '#8a7fc0');
      drawText(ctx, b.name, tx + 6, by - 9, b.tint || '#ffd24a', { scale: 3 });
    }
    // The line, typing itself out, at twice the size it used to be. Dialogue
    // read at arm's length on a phone is the whole reason any of this is here.
    const shown = b.text.slice(0, this.typed);
    drawWrapped(ctx, shown, tx, by + 20, Math.floor((bx + bw - tx - 18) / 12), '#efe8ff', 21, { scale: 2 });
    // the prompt, once the line has finished arriving
    if (this.complete) {
      const py3 = by + bh - 16, bob = Math.round(Math.sin(this.t * 5) * 2);
      const label = this.i >= this.beats.length - 1 ? (Game.touch ? 'TAP TO GO ON' : 'ENTER') : (Game.touch ? 'TAP' : 'ENTER');
      drawText(ctx, label, bx + bw - 16, py3 - 2, '#a79ce0', { align: 'right' });
      for (let r = 0; r < 4; r++) rect(ctx, bx + bw - 14 + r, py3 - 10 + bob + r, 1, 1, '#ffd24a');
      for (let r = 0; r < 4; r++) rect(ctx, bx + bw - 14 - r + 6, py3 - 10 + bob + r, 1, 1, '#ffd24a');
    }
    ctx.globalAlpha = 1;
  }
}

// Somebody to talk to. Stable per key, so the shop owner is the same bug every
// time you walk in.
const CAST = {};
function castMember(key, over) {
  if (!CAST[key]) CAST[key] = Object.assign(randomBugSpec(makeRng(hashStr('cast|' + key))), over || {});
  return CAST[key];
}

// ---------- An intro any scene can wear ----------
// Scenes that used to cut straight to a menu now open with somebody saying
// something first. Mix it in with three lines: hold the intro in `intro`, call
// `introUpdate` / `introDraw`, and let `introTap` eat the first tap.
function sceneIntro(beats, opts) { const c = new Cutscene(beats, opts || {}); return c.beats.length ? c : null; }
function introUpdate(scene, dt) { if (scene.intro) { scene.intro.update(dt); if (scene.intro.done) scene.intro = null; return true; } return false; }
function introDraw(scene, ctx) { if (scene.intro) { scene.intro.draw(ctx); return true; } return false; }
function introTap(scene) { if (!scene.intro) return false; scene.intro.advance(); if (scene.intro && scene.intro.done) scene.intro = null; return true; }

// What the person behind the counter says when you walk in. Keyed off the
// place, so the same shop greets you the same way every time.
const SHOP_HELLO = [
  ['IRASSHAIMASE!', 'She does not look up from the magazine. The bell over the door is still swinging.'],
  ['IRASSHAIMASE!', '"Have a look. Touch anything you like, you break it you buy it, the usual."'],
  ['IRASSHAIMASE!', '"You are the ones from the station. I heard you through the floor."'],
  ['IRASSHAIMASE!', '"Everything here is slightly overpriced. It is Tokyo. What can I do."'],
  ['IRASSHAIMASE!', '"Careful with the cases by the door, they are not mine and he is coming back for them."'],
];
const FOOD_HELLO = [
  ['"SIT ANYWHERE."', 'Steam, a radio playing something from thirty years ago, and six seats at a counter.'],
  ['"SIT ANYWHERE."', '"You want the set. Everybody wants the set. Nobody has ever wanted anything else."'],
  ['"SIT ANYWHERE."', 'He is already reaching for the bowls before any of you have said a word.'],
];
