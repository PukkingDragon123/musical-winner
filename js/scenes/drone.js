// ---------- The shot that opens the game ----------
// It used to be a drone. It is the street now: the same street the menu sits
// on, scrolling past at walking pace while fifty thousand bugs head the same
// way, and then the camera pushes all the way in on the dome they are going
// to. Nothing here is drawn twice — it is the menu's own scene, moved.
'use strict';
class DroneScene {
  constructor(next) {
    this.t = 0; this.next = next || (() => new SelectScene());
    this.left = false;
    // what the narrator says, and when
    this.lines = [
      [0.5, 'TOKYO. FRIDAY. ELEVEN AT NIGHT.'],
      [3.6, 'THE WHOLE STREET IS WALKING THE SAME WAY.'],
      [6.9, 'FIFTY-FIVE THOUSAND OF THEM.'],
      [10.2, 'ALL OF THEM HERE FOR ONE BAND.'],
      [13.4, 'THIS IS THE LAST GOOD NIGHT.'],
    ];
    this.scrollFor = 9.2;          // how long we track along the street
    this.dur = 17.0;
  }
  skip() { if (this.left) return; this.left = true; Game.go(this.next, 'fade', { dur: 0.7 }); }
  update(dt) { this.t += dt; if (this.t > this.dur) this.skip(); }
  key(code) { if (['Enter', 'Space', 'Escape', 'KeyZ'].includes(code)) this.skip(); }
  click() { this.skip(); }
  draw(ctx) {
    const t = this.t;
    // ---- the side-scroll: the street goes past, faster than the crowd walks,
    // because the camera is moving with somebody in a hurry
    const cam = 40 + t * 96;
    // ---- and then the push in, on the dome at the end of it
    const zk = easeInOut(clamp((t - this.scrollFor) / 5.4, 0, 1));
    const z = lerp(1, 2.25, zk);
    // the doors, wherever they are right now: the dome drifts with the camera,
    // so the focus has to follow it rather than sit at a number
    const fx = (520 - cam * 0.16) + 210, fy = 300;
    ctx.save();
    ctx.translate(W / 2, H * 0.52); ctx.scale(z, z);
    ctx.translate(-lerp(W / 2, fx, zk), -lerp(H * 0.52, fy, zk));
    drawConcertStreet(ctx, t, { camX: cam });
    // the band, crossing the road in front of it all, going the same way
    drawStreetBand(ctx, t, { x: ((t * 58) % (W + 620)) - 260 });
    ctx.restore();
    // ---- the frame it is all shot in
    letterbox(ctx, 58, 1);
    vignette(ctx, 0.46);
    grade(ctx, 0, 0, W, H, '#3a2a7a', 0.1);
    // ---- the finish: through the doors
    if (t > this.dur - 2.2) { ctx.globalAlpha = clamp((t - (this.dur - 2.2)) / 1.6, 0, 1); rect(ctx, 0, 0, W, H, '#f6f2ff'); ctx.globalAlpha = 1; }
    // ---- the narrator. Not called `line`: that is the global that draws one,
    // and a local of the same name puts it in the dead zone for the whole
    // function, which took out every stroke above it.
    let say = null;
    for (const [at, txt] of this.lines) if (t >= at && t < at + 3.1) say = [at, txt];
    if (say) {
      const lt = t - say[0], fade = clamp(lt / 0.4, 0, 1) * clamp((3.1 - lt) / 0.5, 0, 1);
      const chars = Math.floor(lt * 34);
      ctx.globalAlpha = fade;
      drawText(ctx, say[1].slice(0, chars), W / 2, H - 92, '#f2ecff', { align: 'center', scale: 3, outline: '#12101c' });
      ctx.globalAlpha = 1;
    }
    drawText(ctx, Game.touch ? 'TAP TO SKIP' : 'ENTER TO SKIP', W - 16, H - 34, '#5a5478', { align: 'right', font: 'small' });
  }
}
